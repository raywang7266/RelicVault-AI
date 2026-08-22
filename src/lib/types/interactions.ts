export interface CommentItem {
  id: string;
  author: string;
  text: string;
  /** ISO 时间 */
  createdAt: string;
}

export interface ArtifactInteraction {
  /** 当前用户是否已点赞（本地状态） */
  liked: boolean;
  comments: CommentItem[];
}
