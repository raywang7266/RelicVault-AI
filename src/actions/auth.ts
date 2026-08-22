"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { ZodIssue } from "zod";
import { loginSchema, registerSchema } from "@/schemas/auth";
import {
  authenticate,
  registerUser,
  signOutUser,
} from "@/lib/auth/core";

export type AuthState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

function collectFieldErrors(issues: ZodIssue[]): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }
  return fieldErrors;
}

export async function signIn(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "/explore").trim();

  const parsed = loginSchema.safeParse({ email, password });
  if (!parsed.success) {
    return { fieldErrors: collectFieldErrors(parsed.error.issues) };
  }

  const result = await authenticate(parsed.data.email, parsed.data.password);
  if (!result.ok) {
    return { error: result.error };
  }

  revalidatePath("/", "layout");
  redirect(result.redirectTo || "/explore");
}

export async function signUp(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  const parsed = registerSchema.safeParse({ email, password, confirmPassword });
  if (!parsed.success) {
    return { fieldErrors: collectFieldErrors(parsed.error.issues) };
  }

  const result = await registerUser(parsed.data.email, parsed.data.password);
  if (!result.ok) {
    return { error: result.error };
  }

  revalidatePath("/", "layout");
  redirect(result.redirectTo || "/dashboard");
}

export async function signOut() {
  await signOutUser();
  revalidatePath("/", "layout");
  redirect("/login");
}
