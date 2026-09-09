/**
 * 抓取当前页面真实可见文本（仅客户端使用）。
 *
 * 目的：让浮窗小助手把「用户正在看的内容」传给 AI，
 * 从而生成针对当前页面的联想词、并基于页面内容回答问题，
 * 而不仅是根据路由类型给泛泛的建议。
 *
 * 策略：
 * - 优先取 <main>（布局里 {children} 在 main 内），避开导航栏 / 页脚 / 小助手自身。
 * - 剔除 script / style / noscript 噪声。
 * - 折叠空白、截断长度，避免请求体过大。
 */

const MAX_LEN = 3500;

export function capturePageText(maxLen: number = MAX_LEN): string {
  if (typeof document === "undefined") return "";

  const root =
    (document.querySelector("main") as HTMLElement | null) ||
    (document.body as HTMLElement | null);
  if (!root) return "";

  // 克隆后清理，避免直接改动真实 DOM
  const clone = root.cloneNode(true) as HTMLElement;
  clone
    .querySelectorAll("script, style, noscript, svg")
    .forEach((n) => n.remove());

  // 剔除小助手自身（在 main 外，但防御性处理；以及任何带小助手语义的 aria-label）
  clone
    .querySelectorAll(".rv-assistant-panel, .rv-assistant-fab, [aria-label]")
    .forEach((n) => {
      const el = n as HTMLElement;
      const label = el.getAttribute("aria-label") || "";
      if (
        el.classList.contains("rv-assistant-panel") ||
        el.classList.contains("rv-assistant-fab") ||
        /小助手|assistant|打开/i.test(label)
      ) {
        el.remove();
      }
    });

  let text = (clone.innerText || clone.textContent || "")
    .replace(/\s+/g, " ")
    .trim();

  if (text.length > maxLen) {
    text = text.slice(0, maxLen);
  }
  return text;
}

/**
 * 抓取当前页面主标题（<main> 内首个 h1/h2），用于在助手面板里显示
 * 「助手正聚焦哪件文物 / 哪个页面」。DOM 未就绪时返回空串，由调用方回退到页面类型描述。
 */
export function capturePageTitle(): string {
  if (typeof document === "undefined") return "";

  const root =
    (document.querySelector("main") as HTMLElement | null) ||
    (document.body as HTMLElement | null);
  if (!root) return "";

  const heading = root.querySelector("h1, h2") as HTMLElement | null;
  const text = (heading?.innerText || "")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return "";
  return text.length > 40 ? `${text.slice(0, 40)}…` : text;
}
