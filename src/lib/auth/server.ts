import { getSessionUser } from "./session";

/**
 * 服务端统一获取当前登录用户（基于本地 JWT 会话）。
 * 供布局、页面、导航栏读取初始用户状态。
 */
export async function getServerUser() {
  return getSessionUser();
}
