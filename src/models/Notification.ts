import "server-only";
import mongoose, { Schema, model, models } from "mongoose";

/** 通知类型：被关注的人发新文物 / 有人评论了我的文物 / 有人回复了我的评论 / 有人关注了我 */
export type NotificationType =
  | "new_artifact"
  | "new_comment"
  | "comment_reply"
  | "new_follow";

export interface INotification extends mongoose.Document {
  /** 接收方（被通知的人） */
  recipient: mongoose.Types.ObjectId;
  /** 触发方（动作发起人） */
  actor: mongoose.Types.ObjectId;
  type: NotificationType;
  /** 关联文物（new_artifact / new_comment / comment_reply 时存在） */
  artifactId?: mongoose.Types.ObjectId | null;
  /** 关联文物标题（冗余存储，列表渲染免二次查询） */
  artifactTitle?: string;
  /** 关联评论 id（comment_reply 时存在） */
  commentId?: string | null;
  /** 是否已读 */
  read: boolean;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    actor: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["new_artifact", "new_comment", "comment_reply", "new_follow"],
      required: true,
    },
    artifactId: { type: Schema.Types.ObjectId, ref: "Artifact", default: null },
    artifactTitle: { type: String, default: "" },
    commentId: { type: String, default: null },
    read: { type: Boolean, default: false, index: true },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

// 未读查询：recipient + read=false 的复合索引
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

export const Notification =
  models.Notification ||
  model<INotification>("Notification", notificationSchema);
