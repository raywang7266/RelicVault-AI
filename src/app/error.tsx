"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * 路由级错误边界：捕获某个页面/组件渲染期抛出的异常，
 * 用可恢复界面替代「整棵 React 树崩溃」——根布局（含导航栏）保持存活，
 * 用户仍可用导航栏跳走，不再出现「点哪都没反应、必须手动刷新」的死锁。
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // 仅记录，不影响 UI
    console.error("[RelicVault] 路由渲染异常：", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <div className="text-5xl" aria-hidden>
        🏺
      </div>
      <h2 className="mt-4 font-serif text-2xl font-bold text-[#2C221E]">
        这个页面出了点问题
      </h2>
      <p className="mt-2 text-sm text-[#7A6B5D]">
        加载该文物档案时发生异常。你可以重试，或用上方导航栏前往其他页面。
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-md bg-[#8C6D46] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#735836]"
        >
          重试
        </button>
        <button
          type="button"
          onClick={() => router.push("/explore")}
          className="rounded-md border border-[#D6CBBA] px-4 py-2 text-sm font-medium text-[#5C4831] transition-colors hover:bg-[#EFE6D5]"
        >
          返回探索
        </button>
      </div>
    </div>
  );
}
