import "server-only";
import mongoose, {
  Schema,
  model,
  models,
  type HydratedDocument,
} from "mongoose";

export type PreservationDb =
  | "excellent"
  | "good"
  | "fair"
  | "poor"
  | "critical"
  | "unknown";

export interface IArtifact extends mongoose.Document {
  title: string;
  description: string;
  /** 封面图（= images[0]）。保留此字段以兼容既有数据与所有只读 UI */
  imageUrl: string;
  /**
   * 全部图片（data URL 或外链），第一张为封面。
   * 为空表示老数据（只有 imageUrl），读取时应回退为 [imageUrl]。
   */
  images: string[];
  aiTags: string[];
  manualTags: string[];
  era: string;
  category: string;
  locationName: string;
  preservationStatus: PreservationDb;
  /** 精确坐标（敏感，仅服务端内部持有，绝不返回给前端） */
  exactLat: number | null;
  exactLng: number | null;
  /** 脱敏坐标（对外展示用） */
  blurredLat: number | null;
  blurredLng: number | null;
  /** 是否受保护遗迹（影响脱敏精度） */
  isProtected: boolean;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  /** 点赞用户 id 数组（ObjectId 引用 User） */
  likes: mongoose.Types.ObjectId[];
  /** 收藏用户 id 数组（ObjectId 引用 User） */
  favorites: mongoose.Types.ObjectId[];
  /** 评论列表 */
  comments: {
    id: string;
    userId: mongoose.Types.ObjectId;
    username: string;
    text: string;
    createdAt: Date;
  }[];
}

/** 单条评论的数据结构（用于类型复用） */
export interface IArtifactComment {
  id: string;
  userId: mongoose.Types.ObjectId;
  username: string;
  text: string;
  createdAt: Date;
}

const PRESERVATION_VALUES: PreservationDb[] = [
  "excellent",
  "good",
  "fair",
  "poor",
  "critical",
  "unknown",
];

const artifactSchema = new Schema<IArtifact>(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    imageUrl: { type: String, required: true },
    /** 全部图片；空数组=老数据（仅 imageUrl）。前端上传时最多 6 张 */
    images: { type: [String], default: [] },
    aiTags: { type: [String], default: [] },
    manualTags: { type: [String], default: [] },
    era: { type: String, default: "" },
    category: { type: String, default: "" },
    locationName: { type: String, default: "" },
    preservationStatus: {
      type: String,
      enum: PRESERVATION_VALUES,
      default: "unknown",
    },
    exactLat: { type: Number, default: null },
    exactLng: { type: Number, default: null },
    blurredLat: { type: Number, default: null },
    blurredLng: { type: Number, default: null },
    isProtected: { type: Boolean, default: false },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    createdAt: { type: Date, default: Date.now },
    likes: {
      type: [{ type: Schema.Types.ObjectId, ref: "User" }],
      default: [],
      index: true,
    },
    favorites: {
      type: [{ type: Schema.Types.ObjectId, ref: "User" }],
      default: [],
      index: true,
    },
    comments: {
      type: [
        new Schema(
          {
            id: { type: String, required: true },
            userId: {
              type: Schema.Types.ObjectId,
              ref: "User",
              required: true,
            },
            username: { type: String, default: "" },
            text: { type: String, required: true },
            /** 评论点赞者 id 数组（参考小红书「评论点赞」） */
            likes: {
              type: [{ type: Schema.Types.ObjectId, ref: "User" }],
              default: [],
            },
            /** 父评论 id（用于「回复」，仅一层嵌套） */
            parentId: { type: String, default: null },
            createdAt: { type: Date, default: Date.now },
          },
          { _id: false }
        ),
      ],
      default: [],
    },
  },
  { timestamps: false }
);

/**
 * 坐标自动模糊 hook。
 *
 * 当 exactLat/exactLng 都存在时，根据 isProtected 自动四舍五入算出 blurred*：
 *   - 受保护遗迹（isProtected=true）保留 1 位小数（约 ±5.5km 精度，足够隐藏精确位置）
 *   - 普通文物保留 2 位小数（约 ±550m 精度）
 * 这样业务层永远只需要写入精确坐标，脱敏在落库前统一完成。
 */
artifactSchema.pre("save", async function (this: HydratedDocument<IArtifact>) {
  if (
    typeof this.exactLat === "number" &&
    typeof this.exactLng === "number" &&
    Number.isFinite(this.exactLat) &&
    Number.isFinite(this.exactLng)
  ) {
    const decimals = this.isProtected ? 1 : 2;
    const factor = Math.pow(10, decimals);
    this.blurredLat = Math.round(this.exactLat * factor) / factor;
    this.blurredLng = Math.round(this.exactLng * factor) / factor;
  }
});

export const Artifact =
  models.Artifact || model<IArtifact>("Artifact", artifactSchema);
