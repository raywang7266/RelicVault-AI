"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import type { ArtifactFormData } from "@/components/artifacts/ArtifactUploadForm";
import { useToast } from "@/components/ui/toaster";

/**
 * 表单提交到后端的统一逻辑：
 * 1. fetch POST /api/artifacts（带 cache: 'no-store'，跳过 Next 路由缓存）
 * 2. 成功 -> 弹成功提示 + Toast，~1 秒后自动跳转个人中心 /profile，
 *    并 router.refresh() 强制 RSC 重新拉取数据；
 *    个人中心内部 useEffect 会立即 fetch `/api/artifacts?owner=<id>` 拿到最新提交。
 * 3. 失败 -> 抛出错误，由表单组件展示顶部红色框（同时 Toast 通知）。
 */
export function useArtifactSubmit() {
  const router = useRouter();
  const [showSuccess, setShowSuccess] = useState(false);
  const { toast } = useToast();

  const handleSubmit = useCallback(
    async (data: ArtifactFormData) => {
      try {
        const res = await fetch("/api/artifacts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // 防中间代理误缓存
            "Cache-Control": "no-store",
          },
          cache: "no-store",
          body: JSON.stringify(data),
        });

        if (!res.ok) {
          let message = `保存失败（${res.status}）`;
          try {
            const err = (await res.json()) as { error?: string };
            if (err?.error) message = err.error;
          } catch {
            /* 忽略解析失败，沿用状态码提示 */
          }
          toast({
            variant: "error",
            title: "建档失败",
            description: message,
          });
          throw new Error(message);
        }

        // 优雅的成功提示，1 秒后跳转个人中心并强制刷新
        setShowSuccess(true);
        toast({
          variant: "success",
          title: "建档成功",
          description: `「${data.title || "文物"}」已写入 Supabase`,
        });
        setTimeout(() => {
          router.push("/profile");
          // 让 RSC 重新执行（同时也会重建客户端组件树，触发 useEffect 再拉一次 API）
          router.refresh();
        }, 1000);
      } catch (err) {
        if (err instanceof Error && err.message.startsWith("保存失败")) {
          // 已经在上面 toast 过了；只需抛给 form
          throw err;
        }
        // 网络层异常的兜底
        const msg = err instanceof Error ? err.message : "网络异常，请重试";
        toast({
          variant: "error",
          title: "提交异常",
          description: msg,
        });
        throw err;
      }
    },
    [router, toast]
  );

  return { handleSubmit, showSuccess };
}
