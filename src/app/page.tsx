"use client";

import React from "react";
import ArtifactUploadForm from "@/components/artifacts/ArtifactUploadForm";
import SubmitSuccessToast from "@/components/artifacts/submit-success-toast";
import { useArtifactSubmit } from "@/hooks/use-artifact-submit";
import { useUser } from "@/hooks/use-user";
import { useTranslation } from "@/lib/i18n/i18n-provider";

export default function Home() {
  const { user } = useUser();
  const { handleSubmit, showSuccess } = useArtifactSubmit();
  const { t } = useTranslation();

  return (
    <main className="min-h-screen bg-stone-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* 顶部 Header 区 */}
      <header className="max-w-4xl mx-auto text-center mb-12">
        <h1 className="text-4xl font-extrabold text-stone-900 tracking-tight sm:text-5xl mb-3">
          🏛️ RelicVault AI
        </h1>
        <p className="text-lg text-stone-600 max-w-2xl mx-auto">
          {t("home.subtitle")}
        </p>
      </header>

      {/* 核心区：上传与 AI 打标表单 */}
      <section className="max-w-3xl mx-auto bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-stone-200">
        <h2 className="text-xl font-bold text-stone-800 mb-6 flex items-center gap-2">
          <span>✨</span> {t("home.uploadHeading")}
        </h2>
        {/* 提交逻辑统一走 useArtifactSubmit：POST /api/artifacts，成功 1s 后跳转 /profile */}
        <ArtifactUploadForm onSubmit={handleSubmit} ownerId={user?.id} />
      </section>

      <SubmitSuccessToast visible={showSuccess} />
    </main>
  );
}
