import { redirect } from "next/navigation";

// 个人中心已统一迁至 /profile，旧入口重定向过去（中间件仍会先校验登录态）。
export default function DashboardPage() {
  redirect("/profile");
}
