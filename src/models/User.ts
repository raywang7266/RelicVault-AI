import "server-only";
import mongoose, { Schema, model, models } from "mongoose";

/** 社交隐私设置：是否对外公开「我的关注」/「我的粉丝」列表 */
export interface PrivacySettings {
  showFollowing: boolean;
  showFollowers: boolean;
}

export const DEFAULT_PRIVACY: PrivacySettings = {
  showFollowing: true,
  showFollowers: true,
};

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
  /** 关注的用户 id 列表（参考小红书「关注」） */
  following: mongoose.Types.ObjectId[];
  /** 社交隐私设置；老文档可能缺失，读取时必须用 privacyOf() 兜底 */
  privacy?: PrivacySettings;
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
    following: {
      type: [{ type: Schema.Types.ObjectId, ref: "User" }],
      default: [],
      index: true,
    },
    // 隐私：默认全部公开（与老用户行为一致）；缺失字段在读取层兜底为 true
    privacy: {
      showFollowing: { type: Boolean, default: true },
      showFollowers: { type: Boolean, default: true },
    },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

export const User = models.User || model<IUser>("User", userSchema);
