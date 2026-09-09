import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/auth/session";
import {
  findById,
  toUserDTO,
  updateProfile,
} from "@/lib/store/users";
import { listArtifactsPublic } from "@/lib/store/artifacts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

/** 当前登录用户读取/更新自己的资料（昵称/简介/头像/用户名）+ 名下文物列表。 */
const profileSchema = z.object({
  nickname: z.string().min(1, "昵称不能为空").max(20, "昵称过长").optional(),
  username: z
    .string()
    .min(3, "用户名至少 3 个字符")
    .max(30, "用户名过长")
    .regex(/^[a-zA-Z0-9_\-]+$/, "用户名仅限字母、数字、下划线、连字符")
    .optional(),
  bio: z.string().max(140, "简介过长（≤140 字）").optional(),
  // 允许：空字符串（使用默认头像）、http(s) 外链、或本地上传的 data:image base64
  avatarUrl: z
    .string()
    .refine(
      (v) =>
        v === "" ||
        v.startsWith("data:image/") ||
        /^https?:\/\//.test(v),
      "头像格式不合法（仅支持图片链接或本地上传）"
    )
    .optional()
    .or(z.literal("")),
  // 隐私：是否对外公开「我的关注」/「我的粉丝」列表（部分字段即可）
  privacy: z
    .object({
      showFollowing: z.boolean().optional(),
      showFollowers: z.boolean().optional(),
    })
    .optional(),
});

function noStore(res: NextResponse) {
  res.headers.set("Cache-Control", "no-store, max-age=0");
  return res;
}

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return noStore(NextResponse.json({ error: "请先登录" }, { status: 401 }));
  }

  const u = await findById(userId);
  if (!u) {
    return noStore(NextResponse.json({ error: "用户不存在" }, { status: 404 }));
  }

  const dto = toUserDTO(u);
  const artifacts = await listArtifactsPublic({ ownerId: userId });

  return noStore(
    NextResponse.json({
      profile: {
        username: dto.username ?? null,
        display_name: dto.displayName,
        bio: dto.bio,
        avatar_url: dto.avatarUrl,
        privacy: dto.privacy,
      },
      // 根据当前登录用户的 userId 返回其建档的所有文物列表
      artifacts,
    })
  );
}

export async function PUT(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return noStore(NextResponse.json({ error: "请先登录" }, { status: 401 }));
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return noStore(
      NextResponse.json({ error: "请求体不是合法 JSON" }, { status: 400 })
    );
  }

  const parsed = profileSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return noStore(
      NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "请求格式不正确" },
        { status: 400 }
      )
    );
  }
  const input = parsed.data;

  const patch: {
    displayName?: string;
    username?: string;
    bio?: string;
    avatarUrl?: string;
    privacy?: { showFollowing?: boolean; showFollowers?: boolean };
  } = {};
  if (input.nickname !== undefined) patch.displayName = input.nickname.trim();
  if (input.username !== undefined) patch.username = input.username.trim().toLowerCase();
  if (input.bio !== undefined) patch.bio = input.bio.trim();
  if (input.avatarUrl !== undefined)
    patch.avatarUrl = input.avatarUrl === "" ? "" : input.avatarUrl;
  if (input.privacy) {
    patch.privacy = {
      ...(input.privacy.showFollowing !== undefined
        ? { showFollowing: input.privacy.showFollowing }
        : {}),
      ...(input.privacy.showFollowers !== undefined
        ? { showFollowers: input.privacy.showFollowers }
        : {}),
    };
  }

  try {
    const u = await updateProfile(userId, patch);
    if (!u) {
      return noStore(
        NextResponse.json({ error: "用户不存在" }, { status: 404 })
      );
    }
    const dto = toUserDTO(u);
    return noStore(
      NextResponse.json({
        ok: true,
        profile: {
          username: dto.username ?? null,
          display_name: dto.displayName,
          bio: dto.bio,
          avatar_url: dto.avatarUrl,
          privacy: dto.privacy,
        },
      })
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "保存失败";
    if (/duplicate|unique|E11000/i.test(message)) {
      return noStore(
        NextResponse.json(
          { error: "该用户名已被占用，请换一个" },
          { status: 409 }
        )
      );
    }
    return noStore(NextResponse.json({ error: "保存资料失败" }, { status: 500 }));
  }
}
