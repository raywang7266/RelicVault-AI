"use server";

import type { ArtifactFormData } from "@/components/artifacts/ArtifactUploadForm";

/**
 * 文物提交（占位）。当前阶段仅打印接收到的表单数据，
 * 后续阶段接入 Supabase 写入与 AI 鉴定流程。
 * 作为 Server Action 传递给客户端上传表单。
 */
export async function submitArtifact(data: ArtifactFormData) {
  console.log("[artifact:submit] received", data);
}
