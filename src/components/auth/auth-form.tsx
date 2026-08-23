"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { loginSchema, registerSchema } from "@/schemas/auth";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/i18n-provider";

type Mode = "login" | "register";

type ApiResult = {
  ok?: boolean;
  error?: string;
  redirectTo?: string;
};

function SubmitButton({
  mode,
  loading,
}: {
  mode: Mode;
  loading: boolean;
}) {
  const { t } = useTranslation();
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? t("auth.processing") : mode === "login" ? t("auth.login") : t("auth.register")}
    </button>
  );
}

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/explore";
  const isLogin = mode === "login";
  const endpoint = isLogin ? "/api/login" : "/api/register";

  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    // 兼容登录/注册两种 schema，运行时由 mode 决定
    resolver: zodResolver(isLogin ? loginSchema : registerSchema) as never,
    mode: "onTouched",
  });

  const onValid = async (values: Record<string, unknown>) => {
    setSubmitting(true);
    setServerError(null);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      // 安全读取响应体：即使非 2xx，也尝试解析 JSON，避免解析异常导致页面崩溃
      let data: ApiResult | null = null;
      const text = await res.text();
      if (text) {
        try {
          data = JSON.parse(text) as ApiResult;
        } catch {
          data = null; // 响应体不是 JSON（如网关错误页），忽略
        }
      }

      // 只有 response.ok 且解析出 ok=true 才跳转，否则给出可读提示
      if (res.ok && data?.ok) {
        const target = data.redirectTo || redirectTo;
        router.push(target);
        router.refresh();
        return;
      }

      setServerError(
        data?.error ??
          (res.ok
            ? t("auth.opFailed")
            : t("auth.requestFailed", { status: res.status }))
      );
    } catch {
      // 网络层异常（如断网）的兜底提示
      setServerError(t("auth.networkError"));
    } finally {
      setSubmitting(false);
    }
  };

  const fieldError = (name: string): string | undefined =>
    (errors as Record<string, { message?: string }>)[name]?.message ?? undefined;

  return (
    <form onSubmit={handleSubmit(onValid)} className="space-y-4" noValidate>
      {serverError && (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {serverError}
        </div>
      )}

      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium">
          {t("auth.email")}
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          className={cn(
            "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-ring",
            fieldError("email") && "border-destructive focus:ring-destructive"
          )}
          {...register("email")}
        />
        {fieldError("email") && (
          <p className="mt-1 text-xs text-destructive">{fieldError("email")}</p>
        )}
      </div>

      {!isLogin && (
        <div>
          <label
            htmlFor="username"
            className="mb-1 block text-sm font-medium"
          >
            {t("auth.username")}
          </label>
          <input
            id="username"
            type="text"
            autoComplete="username"
            placeholder={t("auth.usernamePlaceholder")}
            className={cn(
              "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-ring",
              fieldError("username") && "border-destructive focus:ring-destructive"
            )}
            {...register("username")}
          />
          {fieldError("username") && (
            <p className="mt-1 text-xs text-destructive">{fieldError("username")}</p>
          )}
        </div>
      )}

      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium">
          {t("auth.password")}
        </label>
        <input
          id="password"
          type="password"
          autoComplete={isLogin ? "current-password" : "new-password"}
          placeholder={t("auth.passwordPlaceholder")}
          className={cn(
            "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-ring",
            fieldError("password") && "border-destructive focus:ring-destructive"
          )}
          {...register("password")}
        />
        {fieldError("password") && (
          <p className="mt-1 text-xs text-destructive">
            {fieldError("password")}
          </p>
        )}
      </div>

      {!isLogin && (
        <div>
          <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium">
            {t("auth.confirmPassword")}
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder={t("auth.confirmPasswordPlaceholder")}
            className={cn(
              "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-ring",
              fieldError("confirmPassword") &&
                "border-destructive focus:ring-destructive"
            )}
            {...register("confirmPassword")}
          />
          {fieldError("confirmPassword") && (
            <p className="mt-1 text-xs text-destructive">
              {fieldError("confirmPassword")}
            </p>
          )}
        </div>
      )}

      <SubmitButton mode={mode} loading={submitting} />

      <p className="text-center text-sm text-muted-foreground">
        {isLogin ? (
          <>
            {t("auth.noAccount")}{" "}
            <Link
              href="/register"
              className="font-medium text-primary hover:underline"
            >
              {t("auth.signUpNow")}
            </Link>
          </>
        ) : (
          <>
            {t("auth.hasAccount")}{" "}
            <Link
              href="/login"
              className="font-medium text-primary hover:underline"
            >
              {t("auth.goLogin")}
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
