"use client";

import { useUser } from "@/hooks/use-user";
import type { SessionUser } from "@/lib/auth/types";
import ArtifactUploadForm from "@/components/artifacts/ArtifactUploadForm";
import SubmitSuccessToast from "@/components/artifacts/submit-success-toast";
import { useArtifactSubmit } from "@/hooks/use-artifact-submit";

/**
 * 上传页的客户端容器：组合「建档表单」与「提交成功提示」。
 * - 用 useUser 解析当前登录用户，把 userId 作为 ownerId 随表单提交，
 *   后端据此将记录归属到「我的贡献」。
 * - 表单的 onSubmit 交给 useArtifactSubmit——它负责把数据 POST 到
 *   /api/artifacts，成功后在 1 秒后自动跳转 /profile 并 router.refresh()。
 */
export default function ArtifactUploadClient({
  initialUser,
}: {
  initialUser?: SessionUser | null;
}) {
  const { user } = useUser(initialUser ?? null);
  const { handleSubmit, showSuccess } = useArtifactSubmit();
  const ownerId = user?.id;

  return (
    <>
      <ArtifactUploadForm onSubmit={handleSubmit} ownerId={ownerId} />
      <SubmitSuccessToast visible={showSuccess} />
    </>
  );
}
