"use client";

/**
 * 根级错误边界：捕获根布局/全局渲染期异常（最严重的情况）。
 * 必须自带 <html>/<body>，因为此时根布局可能已不可用。
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="zh-CN">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          margin: 0,
          background: "#FAF7F2",
          color: "#2C221E",
        }}
      >
        <div style={{ textAlign: "center", padding: 24 }}>
          <h2 style={{ fontSize: 22, marginBottom: 12 }}>应用出错了</h2>
          <p style={{ color: "#7A6B5D", marginBottom: 20 }}>
            发生了一个意外错误，请重试。
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              background: "#8C6D46",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "10px 20px",
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            重试
          </button>
        </div>
      </body>
    </html>
  );
}
