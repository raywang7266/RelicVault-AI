import { useMemo } from "react";

interface UserAvatarProps {
  /** 头像图片 URL；为空时回退为昵称首字母 */
  src?: string;
  /** 展示名（用于 alt 与首字母回退） */
  name?: string;
  /** 直径（px），默认 32 */
  size?: number;
  className?: string;
}

/**
 * 统一头像组件：小红书风格圆形头像，带脱敏首字母回退。
 * 用原生 <img> 以避免 next/image 的远程域名白名单限制（头像来源多样）。
 */
export function UserAvatar({ src, name, size = 32, className = "" }: UserAvatarProps) {
  const fallback = useMemo(() => {
    const ch = (name || "?").trim().charAt(0);
    return ch ? ch.toUpperCase() : "?";
  }, [name]);

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--chip-2)] text-[var(--bronze)] ${className}`}
      style={{ width: size, height: size }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name || "用户"}
          className="h-full w-full object-cover"
        />
      ) : (
        <span
          className="font-medium leading-none"
          style={{ fontSize: `calc(${Math.max(11, Math.round(size * 0.42))}px * var(--font-scale))` }}
        >
          {fallback}
        </span>
      )}
    </span>
  );
}
