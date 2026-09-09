import "server-only";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import { Artifact } from "@/models/Artifact";
import { User } from "@/models/User";
import {
  DEMO_ARTIFACTS,
  DEMO_CURATOR,
  DEMO_SOCIAL_ARTIFACTS,
  DEMO_SOCIAL_COMMENTS,
  DEMO_SOCIAL_PASSWORD,
  DEMO_SOCIAL_USERS,
  demoImageUrl,
} from "./demo-data";

/**
 * 首次运行自动灌入演示数据（幂等）。
 *
 * 背景：本项目没有统一服务器，每位用户跑的都是自己的本地 MongoDB。
 * 为了让任何人克隆项目后第一次打开就有内容可看，在应用第一次读取
 * 数据时自动执行本函数：
 *
 *   - 演示 curator（curator@relicvault.app）+ 12 件示范文物：
 *     以 curator 是否存在为判断标准，不存在才灌入。
 *   - 演示社交账号（6 位收藏者 + 各自文物/评论/关注关系）：
 *     独立幂等判断（见 ensureDemoSocialUsers），缺谁补谁。
 *
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

  // ---------- 1) 演示 curator + 示范文物（幂等：curator 存在即跳过） ----------
  const existingCurator = await User.findOne(
    { email: DEMO_CURATOR.email },
    { _id: 1 }
  ).lean();
  if (!existingCurator) {
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

  // ---------- 2) 演示社交账号 + 各自内容（独立幂等，缺谁补谁） ----------
  await ensureDemoSocialUsers();
}

/**
 * 灌入演示社交账号与他们的文物 / 评论 / 关注关系（独立幂等）。
 *
 *   - 账号：按 email 判断，缺谁补谁；已存在的账号不改动
 *     （避免覆盖用户登录后可能编辑过的资料）。
 *   - 关注关系：$addToSet 幂等追加（对已有账号也会执行，成本极低）。
 *   - 文物：某账号名下「一件文物都没有」时才灌入该账号的全部演示文物，
 *     避免重置后重复堆叠；评论作为嵌入子文档随文物一起写入。
 *   - 永不抛错（调用方 runSeed 外层已做 catch，但这里也尽量容错）。
 */
async function ensureDemoSocialUsers(): Promise<void> {
  await connectDB();

  const emails = DEMO_SOCIAL_USERS.map((u) => u.email);

  // email -> _id（含已存在 + 本次新建）
  const idByEmail = new Map<string, mongoose.Types.ObjectId>();
  const existing = await User.find(
    { email: { $in: emails } },
    { _id: 1, email: 1 }
  ).lean();
  for (const row of existing) {
    idByEmail.set(row.email as string, row._id);
  }

  // 1) 补建缺失的演示账号
  const missing = DEMO_SOCIAL_USERS.filter((u) => !idByEmail.has(u.email));
  if (missing.length > 0) {
    const passwordHash = await bcrypt.hash(DEMO_SOCIAL_PASSWORD, 10);
    const created = await User.insertMany(
      missing.map((u) => ({
        username: u.username,
        displayName: u.displayName,
        email: u.email,
        password: passwordHash,
        role: "user",
        bio: u.bio,
        avatarUrl: u.avatarUrl,
        githubId: null,
        favorites: [],
        following: [],
        createdAt: u.createdAt,
      }))
    );
    for (const row of created) {
      idByEmail.set(row.email as string, row._id);
    }
  }

  // 展示名映射（评论子文档的 username 字段，读取时以 User 表实时值为准）
  const displayNameByEmail = new Map<string, string>();
  for (const u of DEMO_SOCIAL_USERS) {
    displayNameByEmail.set(u.email, u.displayName);
  }

  // 2) 关注关系（幂等）
  for (const u of DEMO_SOCIAL_USERS) {
    const me = idByEmail.get(u.email);
    if (!me) continue;
    const targets = u.follows
      .map((email) => idByEmail.get(email))
      .filter((id): id is mongoose.Types.ObjectId => Boolean(id));
    if (targets.length === 0) continue;
    await User.updateOne(
      { _id: me },
      { $addToSet: { following: { $each: targets } } }
    );
  }

  // 3) 预生成所有演示评论的 id（replyToIndex 引用的就是这套 id）
  const commentIds = DEMO_SOCIAL_COMMENTS.map(
    () => `c_${new mongoose.Types.ObjectId().toHexString()}`
  );

  // 4) 各账号文物 + 内嵌评论（该账号一件文物都没有时才灌）
  const docs: Array<Record<string, unknown>> = [];
  for (const u of DEMO_SOCIAL_USERS) {
    const ownerId = idByEmail.get(u.email);
    if (!ownerId) continue;
    const ownCount = await Artifact.countDocuments({ userId: ownerId });
    if (ownCount > 0) continue;

    const own = DEMO_SOCIAL_ARTIFACTS.filter((a) => a.owner === u.email);
    for (const a of own) {
      const commentDocs = DEMO_SOCIAL_COMMENTS.map((c, idx) => ({ c, idx }))
        .filter(({ c }) => c.artifact === a.title)
        .map(({ c, idx }) => ({
          id: commentIds[idx],
          userId: idByEmail.get(c.author) ?? ownerId,
          username: displayNameByEmail.get(c.author) ?? "",
          text: c.text,
          likes: (c.likedBy ?? [])
            .map((email) => idByEmail.get(email))
            .filter((id): id is mongoose.Types.ObjectId => Boolean(id)),
          parentId:
            typeof c.replyToIndex === "number"
              ? commentIds[c.replyToIndex]
              : null,
          createdAt: c.createdAt,
        }));

      docs.push({
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
        userId: ownerId,
        createdAt: a.createdAt,
        likes: (a.likedBy ?? [])
          .map((email) => idByEmail.get(email))
          .filter((id): id is mongoose.Types.ObjectId => Boolean(id)),
        favorites: [],
        comments: commentDocs,
      });
    }
  }
  if (docs.length > 0) {
    await Artifact.insertMany(docs);
  }

  console.log(
    `[demo-seed] 演示社交账号就绪（共 ${DEMO_SOCIAL_USERS.length} 个，` +
      `本次补建 ${missing.length} 个 / 灌入 ${docs.length} 件文物）。` +
      `统一密码：${DEMO_SOCIAL_PASSWORD}`
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
