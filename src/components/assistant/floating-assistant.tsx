"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAssistant } from "@/components/assistant/assistant-context";
import { useTranslation } from "@/lib/i18n/i18n-provider";
import { getPageType, pageContextInfo } from "@/lib/ai/page-context";
import { capturePageText, capturePageTitle } from "@/lib/ai/capture-page";
import type { ChatReference } from "@/lib/ai/references";

interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** 回答附带参考资料（仅助手消息有） */
  references?: ChatReference[];
}

interface Pos {
  x: number;
  y: number;
}

const FAB_SIZE = 56;
const PANEL_W = 384;
const PANEL_H = 580;
const EDGE = 24;

function uid(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `m-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function panelSize(): { w: number; h: number } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  return {
    w: Math.min(PANEL_W, vw - 32),
    h: Math.min(PANEL_H, vh - 48),
  };
}

function clampPos(x: number, y: number, w: number, h: number): Pos {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const maxX = Math.max(0, vw - w);
  const maxY = Math.max(0, vh - h);
  return {
    x: Math.min(Math.max(2, x), maxX),
    y: Math.min(Math.max(2, y), maxY),
  };
}

interface Anchor {
  bx: number; // 右下角 x（共享锚点）
  by: number; // 右下角 y
}

/**
 * 拖动位置管理：FAB 与展开对话框**共享同一个位置锚点**（以右下角为锚）。
 * - 单一 localStorage 键 `rv_assistant_pos` 存右下角坐标，两种形态共用。
 * - 切换形态时右下角保持不动 → 对话框从 FAB 处向上/向左展开，视觉连续。
 * - 用 window 级 pointer 监听（不依赖 setPointerCapture，跨环境/无头更稳）。
 * - 拖动阈值 4px 区分「点击」与「拖动」（FAB 据此决定是否展开）。
 */
function useDraggablePosition(mode: "mini" | "expanded", ignoreButtons: boolean) {
  const storageKey = "rv_assistant_pos";
  const [pos, setPosState] = useState<Pos | null>(null);
  const [dragging, setDragging] = useState(false);
  const posRef = useRef<Pos | null>(null);
  const anchorRef = useRef<Anchor | null>(null);
  // 标记本次交互是否发生了拖动（供 FAB 点击时判断是否应展开）
  const draggedRef = useRef(false);

  const sizeOf = (): { w: number; h: number } =>
    mode === "mini" ? { w: FAB_SIZE, h: FAB_SIZE } : panelSize();

  const setPos = (p: Pos) => {
    posRef.current = p;
    setPosState(p);
  };

  // 由共享右下角锚点推导当前形态的左上角（并夹进视口）
  const tlFromAnchor = (a: Anchor, size: { w: number; h: number }): Pos =>
    clampPos(a.bx - size.w, a.by - size.h, size.w, size.h);

  const defaultAnchor = (): Anchor => ({
    bx: window.innerWidth - EDGE,
    by: window.innerHeight - EDGE,
  });

  useEffect(() => {
    const size = sizeOf();
    let anchor: Anchor | null = null;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) anchor = JSON.parse(raw) as Anchor;
    } catch {
      anchor = null;
    }
    if (!anchor) anchor = defaultAnchor();
    anchorRef.current = anchor;
    setPos(tlFromAnchor(anchor, size));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // 视口变化时按共享锚点重新推导左上角，保持右下角不动
  useEffect(() => {
    const onResize = () => {
      const size = sizeOf();
      const a = anchorRef.current ?? defaultAnchor();
      setPos(tlFromAnchor(a, size));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    // 面板标题栏内的按钮（收起/隐藏）不参与拖动；FAB 自身是按钮，不在此列
    const target = e.target as HTMLElement;
    if (ignoreButtons && target.closest("button")) return;
    const start = posRef.current;
    if (!start) return;
    draggedRef.current = false;
    const startX = e.clientX;
    const startY = e.clientY;
    const origX = start.x;
    const origY = start.y;
    let moved = false;

    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (!moved && Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
      moved = true;
      draggedRef.current = true;
      const size = sizeOf();
      setPos(clampPos(origX + dx, origY + dy, size.w, size.h));
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      setDragging(false);
      if (moved && posRef.current) {
        const size = sizeOf();
        // 把当前左上角换算回共享右下角锚点再存储
        const anchor: Anchor = {
          bx: posRef.current.x + size.w,
          by: posRef.current.y + size.h,
        };
        anchorRef.current = anchor;
        try {
          localStorage.setItem(storageKey, JSON.stringify(anchor));
        } catch {
          /* 忽略持久化失败 */
        }
      }
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    setDragging(true);
  };

  const style: React.CSSProperties | undefined = pos
    ? {
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        right: "auto",
        bottom: "auto",
      }
    : undefined;

  return { pos, style, dragging, draggedRef, onPointerDown };
}

function ChatIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 5.5C4 4.67 4.67 4 5.5 4h13c.83 0 1.5.67 1.5 1.5v9c0 .83-.67 1.5-1.5 1.5H9l-4 4v-4H5.5C4.67 15 4 14.33 4 13.5v-8Z"
        fill="currentColor"
      />
      <circle cx="9" cy="9.2" r="1.1" fill="rgba(255,255,255,0.9)" />
      <circle cx="12.5" cy="9.2" r="1.1" fill="rgba(255,255,255,0.9)" />
      <circle cx="16" cy="9.2" r="1.1" fill="rgba(255,255,255,0.9)" />
    </svg>
  );
}

function MinimizeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 14l6-6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HideIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 3l18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M10.6 6.2A9.7 9.7 0 0 1 12 6c5 0 9 4 9 6 0 .7-.3 1.5-.8 2.2M6.3 8.4C3.9 9.9 2.5 11.6 2.5 12c0 .9 3.2 4 9 4 1.4 0 2.7-.2 3.8-.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M9.5 10.2a2.5 2.5 0 0 0 3.3 3.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 12l15-7-6 16-3-7-6-2Z" fill="currentColor" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 4.5A1.5 1.5 0 0 1 6.5 3H18a1 1 0 0 1 1 1v13.5H6.5A1.5 1.5 0 0 0 5 19V4.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M5 19a1.5 1.5 0 0 1 1.5-1.5H19V21H6.5A1.5 1.5 0 0 1 5 19Z" fill="currentColor" opacity="0.55" />
    </svg>
  );
}

function ExternalIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 17 17 7M9.5 7H17v7.5"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** 回答下方的「参考资料」区块：站内相关页 + AI 联网检索到的真实来源 */
function ReferencesBlock({
  refs,
  t,
}: {
  refs: ChatReference[];
  t: (key: string, vars?: Record<string, string | number>) => string;
}) {
  if (!refs.length) return null;
  return (
    <div className="rv-assistant-refs">
      <div className="rv-assistant-refs-label">
        <BookIcon />
        <span>{t("assistant.references")}</span>
      </div>
      <div className="rv-assistant-ref-list">
        {refs.map((r) => {
          const body = (
            <>
              <span className="rv-assistant-ref-idx">
                {r.index ? `[${r.index}]` : "·"}
              </span>
              <span className="rv-assistant-ref-body">
                <span className="rv-assistant-ref-title">{r.title}</span>
                <span className="rv-assistant-ref-meta">
                  <span className="rv-assistant-ref-source">{r.source}</span>
                  {r.kind === "site" && (
                    <span className="rv-assistant-ref-badge">
                      {t("assistant.refOnSite")}
                    </span>
                  )}
                  {r.kind === "web" && r.isSearch && (
                    <span className="rv-assistant-ref-badge rv-assistant-ref-search">
                      {t("assistant.refSearch")}
                    </span>
                  )}
                  {r.date && (
                    <span className="rv-assistant-ref-date">{r.date}</span>
                  )}
                  {r.kind === "web" && !r.isSearch && <ExternalIcon />}
                </span>
              </span>
            </>
          );
          return r.kind === "site" ? (
            <Link key={r.id} href={r.url} className="rv-assistant-ref">
              {body}
            </Link>
          ) : r.url ? (
            <a
              key={r.id}
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rv-assistant-ref"
            >
              {body}
            </a>
          ) : (
            <div key={r.id} className="rv-assistant-ref rv-assistant-ref-static">
              {body}
            </div>
          );
        })}
      </div>
      <div className="rv-assistant-refs-hint">
        {t("assistant.referencesHint")}
      </div>
    </div>
  );
}

export function FloatingAssistant() {
  const { mode, expand, minimize, hide } = useAssistant();
  const { t, locale } = useTranslation();
  const pathname = usePathname();

  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [pageTitle, setPageTitle] = useState("");
  const [resetNotice, setResetNotice] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  // 跨页面状态：用于「切到新页面即重置对话上下文」，避免 AI 还围着上一页文物回答
  const messagesRef = useRef<ChatMsg[]>(messages);
  messagesRef.current = messages;
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const pageKeyRef = useRef<string | null>(null);
  const suggestTokenRef = useRef(0);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshRef = useRef<() => void>(() => {});

  // 最新刷新函数：始终捕获当前 pathname / locale，供「切页」与「展开」两处调用，
  // 避免闭包过期导致用旧页面文本去拉联想词。延迟 220ms 让新页面 DOM / 数据就绪。
  refreshRef.current = () => {
    const pageType = getPageType(pathname);
    const token = ++suggestTokenRef.current;
    const currentPath = pathname;
    const currentLocale = locale;
    setSuggestionsLoading(true);
    window.setTimeout(() => {
      setPageTitle(capturePageTitle());
      const pageText = capturePageText(3500);
      fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: currentPath, pageType, locale: currentLocale, pageText }),
      })
        .then((r) => r.json())
        .then((d) => {
          if (token === suggestTokenRef.current && Array.isArray(d?.suggestions)) {
            setSuggestions(d.suggestions as string[]);
          }
        })
        .catch(() => {
          /* 失败时保留空，由用户直接提问 */
        })
        .finally(() => {
          if (token === suggestTokenRef.current) setSuggestionsLoading(false);
        });
    }, 220);
  };

  // 拖动位置（FAB / 对话框共用，按 mode 区分）
  const { style, dragging, draggedRef, onPointerDown } =
    useDraggablePosition(mode === "hidden" ? "mini" : (mode as "mini" | "expanded"), mode === "expanded");

  // 进入展开形态（同一页面内从 mini 点开）：拉取当前页面联想词
  useEffect(() => {
    if (mode === "expanded") refreshRef.current();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // 切到新页面：重置对话上下文 + 刷新联想词 / 标题，避免 AI 还围着上一页文物回答
  useEffect(() => {
    const prev = pageKeyRef.current;
    pageKeyRef.current = pathname;
    if (prev === null || prev === pathname) return;

    const hadConversation = messagesRef.current.length > 0;
    setMessages([]);
    setSuggestions([]);
    setPageTitle("");
    if (hadConversation) {
      setResetNotice(t("assistant.resetNotice"));
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      resetTimerRef.current = setTimeout(() => setResetNotice(null), 4000);
    } else {
      setResetNotice(null);
    }
    if (modeRef.current === "expanded") refreshRef.current();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // 卸载时清理提示计时器
  useEffect(() => {
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, []);

  // 新消息时滚动到底
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loading, mode]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || loading) return;
    const userMsg: ChatMsg = { id: uid(), role: "user", content };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.map((m) => ({ role: m.role, content: m.content })),
          context: { path: pathname, pageText: capturePageText(4000) },
          locale,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.details || data?.error || "error");
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "assistant",
          content: String(data.reply ?? ""),
          references: Array.isArray(data.references)
            ? (data.references as ChatReference[])
            : [],
        },
      ]);
    } catch (err) {
      // 把后端真实原因（超时/限流/网络）翻译成用户能看懂的副标题
      // 通用兜底「小助手暂时无法回复」保留在最末兜底
      const detail = err instanceof Error ? err.message : "";
      let userMsg = t("assistant.error");
      if (/超时|timeout/i.test(detail)) {
        userMsg = t("assistant.errorTimeout");
      } else if (/429|quota|RESOURCE_EXHAUSTED|限流|配额/i.test(detail)) {
        userMsg = t("assistant.errorRateLimit");
      } else if (/network|fetch|failed/i.test(detail)) {
        userMsg = t("assistant.errorNetwork");
      } else if (detail) {
        // 已知其他错误类型 → 用通用文案兜底，不把技术细节直接抛给用户
        userMsg = t("assistant.error");
      }
      setMessages((prev) => [
        ...prev,
        { id: uid(), role: "assistant", content: userMsg },
      ]);
    } finally {
      setLoading(false);
    }
  }

  // ---- 小型图标形态 ----
  if (mode === "mini") {
    return (
      <button
        type="button"
        className={`rv-assistant-fab${dragging ? " rv-assistant-dragging" : ""}`}
        style={style}
        onClick={() => {
          if (draggedRef.current) {
            draggedRef.current = false;
            return;
          }
          expand();
        }}
        onPointerDown={onPointerDown}
        aria-label={t("assistant.open")}
        title={t("assistant.title")}
      >
        <ChatIcon />
      </button>
    );
  }

  // ---- 隐藏形态：不渲染（导航栏提供召唤按钮） ----
  if (mode === "hidden") {
    return null;
  }

  // ---- 展开形态（对话框） ----
  return (
    <section
      className="rv-assistant-panel"
      style={style}
      role="dialog"
      aria-label={t("assistant.title")}
    >
      {/* 顶部标题栏：拖动把手 */}
      <header
        className={`rv-assistant-header${dragging ? " rv-assistant-dragging" : ""}`}
        onPointerDown={onPointerDown}
      >
        <div className="flex items-center gap-2">
          <span className="rv-assistant-avatar">
            <ChatIcon />
          </span>
          <span className="rv-assistant-title">{t("assistant.title")}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="rv-assistant-iconbtn"
            onClick={minimize}
            aria-label={t("assistant.minimize")}
            title={t("assistant.minimize")}
          >
            <MinimizeIcon />
          </button>
          <button
            type="button"
            className="rv-assistant-iconbtn"
            onClick={hide}
            aria-label={t("assistant.hide")}
            title={t("assistant.hide")}
          >
            <HideIcon />
          </button>
        </div>
      </header>

      {/* 当前页面上下文条：显示助手正聚焦的页面（文物标题或页面类型） */}
      <div className="rv-assistant-context">
        <span className="rv-assistant-context-dot" aria-hidden="true" />
        <span className="rv-assistant-context-text">
          {t("assistant.currentPage", {
            title: pageTitle || pageContextInfo(getPageType(pathname), locale),
          })}
        </span>
      </div>

      {/* 切页提示：对话已重置（4 秒后自动消失，也可手动关闭） */}
      {resetNotice && (
        <div className="rv-assistant-notice" role="status">
          <span>{resetNotice}</span>
          <button
            type="button"
            className="rv-assistant-notice-close"
            onClick={() => setResetNotice(null)}
            aria-label={t("common.close")}
          >
            ×
          </button>
        </div>
      )}

      {/* 联想词 */}
      <div className="rv-assistant-suggest">
        <span className="rv-assistant-suggest-label">
          {t("assistant.relatedQueries")}
        </span>
        <div className="rv-assistant-chips">
          {suggestionsLoading ? (
            <>
              <span className="rv-assistant-chip rv-assistant-chip-skel" />
              <span className="rv-assistant-chip rv-assistant-chip-skel" />
              <span className="rv-assistant-chip rv-assistant-chip-skel" />
            </>
          ) : (
            suggestions.map((s) => (
              <button
                key={s}
                type="button"
                className="rv-assistant-chip"
                onClick={() => send(s)}
                disabled={loading}
              >
                {s}
              </button>
            ))
          )}
        </div>
      </div>

      {/* 消息区 */}
      <div className="rv-assistant-messages" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="rv-assistant-bubble rv-assistant-bubble-assistant">
            {t("assistant.greeting")}
          </div>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={
              m.role === "user"
                ? "rv-assistant-msg rv-assistant-msg-user"
                : "rv-assistant-msg rv-assistant-msg-assistant"
            }
          >
            <div
              className={
                m.role === "user"
                  ? "rv-assistant-bubble rv-assistant-bubble-user"
                  : "rv-assistant-bubble rv-assistant-bubble-assistant"
              }
            >
              {m.content}
            </div>
            {m.role === "assistant" && m.references && m.references.length > 0 && (
              <ReferencesBlock refs={m.references} t={t} />
            )}
          </div>
        ))}
        {loading && (
          <div className="rv-assistant-bubble rv-assistant-bubble-assistant rv-assistant-typing">
            <span />
            <span />
            <span />
          </div>
        )}
      </div>

      {/* 输入区 */}
      <form
        className="rv-assistant-inputrow"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <input
          className="rv-assistant-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("assistant.inputPlaceholder")}
          aria-label={t("assistant.inputPlaceholder")}
          disabled={loading}
        />
        <button
          type="submit"
          className="rv-assistant-send"
          disabled={loading || !input.trim()}
          aria-label={t("assistant.send")}
        >
          <SendIcon />
        </button>
      </form>
    </section>
  );
}
