import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth/server";
import ArtifactUploadClient from "@/components/artifacts/artifact-upload-client";

export default async function NewArtifactPage() {
  const user = await getServerUser();

  // 路由守卫兜底：未登录直接回登录页（中间件通常已拦截）。
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <ArtifactUploadClient initialUser={user} />
    </div>
  );
}
