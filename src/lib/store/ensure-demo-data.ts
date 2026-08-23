import "server-only";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import { Artifact } from "@/models/Artifact";
import { User } from "@/models/User";
import { DEMO_ARTIFACTS, DEMO_CURATOR, demoImageUrl } from "./demo-data";

/**
 * 首次运行自动灌入演示数据（幂等）。
 *
 * 背景：本项目没有统一服务器，每位用户跑的都是自己的本地 MongoDB。
 * 为了让任何人克隆项目后第一次打开就有内容可看，在应用第一次读取
 * 数据时自动执行本函数：
 *
 *   - 判断标准：curator 演示账号（curator@relicvault.app）是否存在。
 *     不存在 = 全新空库 → 创建 curator + 灌入 12 件示范文物；
 *     已存在 = 灌过（或用户已主动清理）→ 直接跳过，绝不重复插入。
 *   - 演示数据全部来自写死的 demo-data.ts（含固定 createdAt / 图片 seed），
 *     因此每个安装上的占位内容与排序完全一致。
 *
 * 实现细节：
 *   - Promise 挂在 globalThis 上做进程级记忆化，避免 dev 热重载后重复
 *     查库，也避免并发首屏请求double-run。
 *   - 灌入失败（如库暂时连不上）时重置记忆化标记，下一个请求会自动重试，
 *     且**绝不向上抛错**——播种失败不应影响正常业务请求。
 *   - 用 insertMany 批量插入（不触发 pre('save') 钩子），所以这里手动
 *     按 isProtected 规则计算脱敏坐标（与模型内钩子公式一致）。
 */

const globalForSeed = globalThis as unknown as {
  _rvDemoSeed?: Promise<void>;
};

/** 与 Artifact 模型 pre('save') 钩子一致的坐标脱敏公式 */
function blur(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

async function runSeed(): Promise<void> {
  await connectDB();

  // 幂等判断：curator 已存在 → 这个库已经灌过（或已被清理），跳过
  const existing = await User.findOne(
    { email: DEMO_CURATOR.email },
    { _id: 1 }
  ).lean();
  if (existing) return;

  // 1) 创建演示 curator 账号（各安装凭据一致，可直接登录体验）
  const passwordHash = await bcrypt.hash(DEMO_CURATOR.password, 10);
  const curator = await User.create({
    username: DEMO_CURATOR.username,
    displayName: DEMO_CURATOR.displayName,
    email: DEMO_CURATOR.email,
    password: passwordHash,
    role: "user",
    bio: DEMO_CURATOR.bio,
    avatarUrl: "",
    githubId: null,
    createdAt: DEMO_CURATOR.createdAt,
  });

  // 2) 批量灌入示范文物（手动算脱敏坐标，见文件头说明）
  const docs = DEMO_ARTIFACTS.map((a) => ({
    title: a.title,
    description: a.description,
    imageUrl: demoImageUrl(a.title),
    aiTags: [],
    manualTags: a.tags,
    era: a.era,
    category: a.category,
    locationName: a.locationName,
    preservationStatus: a.preservationStatus,
    exactLat: a.lat,
    exactLng: a.lng,
    blurredLat:
      typeof a.lat === "number" ? blur(a.lat, a.isProtected ? 1 : 2) : null,
    blurredLng:
      typeof a.lng === "number" ? blur(a.lng, a.isProtected ? 1 : 2) : null,
    isProtected: a.isProtected,
    userId: curator._id,
    createdAt: a.createdAt,
    likes: [],
    favorites: [],
    comments: [],
  }));
  await Artifact.insertMany(docs);

  console.log(
    `[demo-seed] 全新数据库检测成功，已自动灌入 ${docs.length} 件示范文物。` +
      `演示账号：${DEMO_CURATOR.username} / ${DEMO_CURATOR.password}`
  );
}

/** 在任何业务读路径开头调用（如 listArtifactsPublic）。永不抛错。 */
export function ensureDemoData(): Promise<void> {
  if (!globalForSeed._rvDemoSeed) {
    globalForSeed._rvDemoSeed = runSeed().catch((err) => {
      // 失败重置标记 → 下一个请求自动重试；不影响当次业务请求
      globalForSeed._rvDemoSeed = undefined;
      console.error(
        "[demo-seed] 演示数据灌入失败（将在下次请求重试）：",
        err instanceof Error ? err.message : err
      );
    });
  }
  return globalForSeed._rvDemoSeed;
}
