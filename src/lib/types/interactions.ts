export interface CommentItem {
  id: string;
  author: string;
  /** 评论作者用户 id（用于跳转其主页、头像回退） */
  authorId?: string;
  /** 评论作者头像 URL（来自 User 表，实时反映改名/换头像） */
  authorAvatar?: string;
  text: string;
  /** ISO 时间 */
  createdAt: string;
  /** 父评论 id（回复场景，仅一层嵌套） */
  parentId?: string;
  /** 评论点赞总数 */
  likes: number;
  /** 当前用户是否已赞该评论 */
  likedByMe: boolean;
}

export interface ArtifactInteraction {
  /** 当前用户是否已点赞（本地状态） */
  liked: boolean;
  comments: CommentItem[];
}
