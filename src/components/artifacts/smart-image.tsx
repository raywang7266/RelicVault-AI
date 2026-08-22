"use client";

import { useState } from "react";

interface SmartImageProps {
  src: string;
  alt: string;
  className?: string;
  /** 加载失败时展示的占位文字（通常为文物名首字） */
  fallbackLabel?: string;
  imgClassName?: string;
}

/**
 * 带“加载失败兜底”的图片组件：
 * 当远程缩略图（如 picsum）因离线/限流无法加载时，
 * 自动切换为同色系渐变占位块，保证瀑布流布局不塌陷。
 */
export default function SmartImage({
  src,
  alt,
  className = "",
  fallbackLabel = "藏",
  imgClassName = "",
}: SmartImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-[#E9DFC8] to-[#D8C7A3] text-[#8C6D46] font-serif ${className}`}
        aria-label={alt}
      >
        <span className="text-4xl opacity-70 select-none">{fallbackLabel}</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`${className} ${imgClassName}`}
    />
  );
}
