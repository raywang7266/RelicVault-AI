import { z } from "zod";

/**
 * 用户名规则与 Supabase `profiles.username` 一致：
 *   - 长度 3~30，字符集 [a-zA-Z0-9_-]
 *   - 数据库层是 UNIQUE，重复时返回 409
 */
export const usernameSchema = z
  .string()
  .min(3, "用户名至少 3 个字符")
  .max(30, "用户名最长 30 个字符")
  .regex(/^[a-zA-Z0-9_-]+$/, "用户名仅可包含字母、数字、下划线与连字符");

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "请输入邮箱")
    .email("请输入有效的邮箱地址"),
  password: z.string().min(6, "密码至少 6 位"),
});

export const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, "请输入邮箱")
      .email("请输入有效的邮箱地址"),
    password: z.string().min(6, "密码至少 6 位"),
    confirmPassword: z.string().min(1, "请确认密码"),
    /** 可选；缺省时服务端会从 email 生成 */
    username: usernameSchema.optional(),
    /** 可选；用于 OAuth 或首次注册的个人资料 */
    displayName: z.string().max(50).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "两次输入的密码不一致",
    path: ["confirmPassword"],
  });

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;