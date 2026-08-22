import "server-only";
import mongoose, { Schema, model, models } from "mongoose";

export interface IUser extends mongoose.Document {
  username?: string;
  displayName: string;
  email: string;
  /** bcrypt 哈希；OAuth 用户为 null（禁止走密码登录） */
  password?: string | null;
  role: "user" | "admin";
  bio: string;
  avatarUrl: string;
  /** GitHub OAuth 唯一 id，用于账号绑定 */
  githubId?: string | null;
  /** 收藏的文物 id 列表（参考小红书「收藏」） */
  favorites: string[];
  createdAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    username: { type: String, unique: true, sparse: true, index: true },
    displayName: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, default: null },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    bio: { type: String, default: "" },
    avatarUrl: { type: String, default: "" },
    githubId: { type: String, default: null, sparse: true, index: true },
    favorites: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

export const User = models.User || model<IUser>("User", userSchema);
