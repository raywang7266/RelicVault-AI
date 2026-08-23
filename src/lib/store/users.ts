import "server-only";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import { User, type IUser } from "@/models/User";

const BCRYPT_COST = 10;

export interface UserDTO {
  id: string;
  email: string;
  displayName: string;
  username?: string;
  bio: string;
  avatarUrl: string;
  role: string;
  createdAt: string;
}

/** 把 Mongoose 文档（或 lean 结果）转成安全的 DTO（_id→id，Date→ISO） */
export function toUserDTO(doc: IUser | Record<string, any>): UserDTO {
  return {
    id: String(doc._id),
    email: doc.email,
    displayName: doc.displayName,
    username: doc.username ?? undefined,
    bio: doc.bio ?? "",
    avatarUrl: doc.avatarUrl ?? "",
    role: doc.role ?? "user",
    createdAt: doc.createdAt
      ? new Date(doc.createdAt).toISOString()
      : new Date().toISOString(),
  };
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST);
}

export function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function findByEmail(
  email: string
): Promise<IUser | null> {
  await connectDB();
  return User.findOne({ email: email.toLowerCase() }).lean() as Promise<IUser | null>;
}

export async function findById(id: string): Promise<IUser | null> {
  await connectDB();
  return User.findById(id).lean() as Promise<IUser | null>;
}

export async function findByUsername(
  username: string
): Promise<IUser | null> {
  await connectDB();
  return User.findOne({ username }).lean() as Promise<IUser | null>;
}

export interface CreateUserInput {
  email: string;
  password?: string | null;
  displayName?: string;
  username?: string;
  avatarUrl?: string;
}

export async function createUser(
  input: CreateUserInput
): Promise<IUser> {
  await connectDB();
  const doc = await User.create({
    email: input.email.toLowerCase(),
    password: input.password ?? null,
    displayName: input.displayName?.trim() || input.email.split("@")[0],
    username: input.username?.trim() || undefined,
    avatarUrl: input.avatarUrl ?? "",
    role: "user",
    bio: "",
  });
  return doc.toObject() as IUser;
}


export interface ProfilePatch {
  displayName?: string;
  username?: string;
  bio?: string;
  avatarUrl?: string;
}

export async function updateProfile(
  userId: string,
  patch: ProfilePatch
): Promise<IUser | null> {
  await connectDB();
  const update: Record<string, unknown> = {};
  if (patch.displayName !== undefined)
    update.displayName = patch.displayName;
  if (patch.username !== undefined)
    update.username = patch.username.toLowerCase();
  if (patch.bio !== undefined) update.bio = patch.bio;
  if (patch.avatarUrl !== undefined) update.avatarUrl = patch.avatarUrl;

  const doc = await User.findByIdAndUpdate(userId, update, {
    new: true,
    runValidators: true,
  }).lean();
  return doc as IUser | null;
}

// ---------------------------------------------------------------------------
// 收藏（参考小红书「收藏」）
// ---------------------------------------------------------------------------

/** 读取用户收藏的文物 id 列表（去重、返回字符串数组） */
export async function getFavorites(userId: string): Promise<string[]> {
  await connectDB();
  const doc = await User.findById(userId).lean<IUser>();
  const list = Array.isArray(doc?.favorites) ? doc!.favorites : [];
  return Array.from(new Set(list.map((x) => String(x))));
}

/** 收藏一件文物（幂等：已收藏则忽略） */
export async function addFavorite(
  userId: string,
  artifactId: string
): Promise<string[]> {
  await connectDB();
  const doc = await User.findById(userId);
  if (!doc) return [];
  const list: string[] = Array.isArray(doc.favorites) ? doc.favorites : [];
  if (!list.includes(artifactId)) {
    doc.favorites = [...list, artifactId];
    await doc.save();
  }
  return Array.from(new Set(doc.favorites.map((x: string) => String(x))));
}

/** 取消收藏一件文物（幂等：未收藏则忽略） */
export async function removeFavorite(
  userId: string,
  artifactId: string
): Promise<string[]> {
  await connectDB();
  const doc = await User.findById(userId);
  if (!doc) return [];
  const list: string[] = Array.isArray(doc.favorites) ? doc.favorites : [];
  doc.favorites = list.filter((x: string) => String(x) !== artifactId);
  await doc.save();
  return doc.favorites.map((x: string) => String(x));
}

/** 判断用户是否已收藏某文物（用于初始高亮态） */
export async function isFavorite(
  userId: string,
  artifactId: string
): Promise<boolean> {
  const list = await getFavorites(userId);
  return list.includes(artifactId);
}
