export interface SessionUser {
  id: string;
  email: string | null;
  name?: string | null;
  /** 注册/账号创建时间（ISO 字符串），用于个人中心展示「加入天数」 */
  createdAt?: string | null;
  /** 是否为本地 Mock 模拟会话（未配置真实 Supabase 时） */
  mock?: boolean;
}
