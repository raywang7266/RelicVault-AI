import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth/server";
import ProfileView from "@/components/profile/profile-view";

export const metadata = {
  title: "个人中心",
};

export default async function ProfilePage() {
  const user = await getServerUser();

  // 路由守卫兜底：未登录直接回登录页（中间件通常已拦截）。
  if (!user) redirect("/login");

  return <ProfileView user={user} />;
}
