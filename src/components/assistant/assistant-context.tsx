"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * 浮窗小助手的三种形态：
 * - mini：小型图标形态（初始形态，固定在右下角）
 * - expanded：展开形态（对话框，可对话 + 联想词）
 * - hidden：隐藏形态（不渲染，导航栏出现「召唤」按钮）
 */
export type AssistantMode = "mini" | "expanded" | "hidden";

const STORAGE_KEY = "rv_assistant_mode";

interface AssistantContextValue {
  mode: AssistantMode;
  /** 进入展开形态（点小图标触发） */
  expand: () => void;
  /** 回到小型图标形态（展开形态内「收起」触发） */
  minimize: () => void;
  /** 进入隐藏形态（展开形态内「隐藏」触发） */
  hide: () => void;
  /** 从隐藏形态召唤回小型图标形态（导航栏按钮触发） */
  summon: () => void;
}

const AssistantContext = createContext<AssistantContextValue | null>(null);

export function AssistantProvider({ children }: { children: ReactNode }) {
  // 初始统一为 mini，保证 SSR 与水合一致；mount 后再从 localStorage 还原
  const [mode, setMode] = useState<AssistantMode>("mini");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as AssistantMode | null;
      if (saved === "mini" || saved === "expanded" || saved === "hidden") {
        setMode(saved);
      }
    } catch {
      /* 隐私模式可能抛错，忽略 */
    }
  }, []);

  const persist = useCallback((next: AssistantMode) => {
    setMode(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const expand = useCallback(() => persist("expanded"), [persist]);
  const minimize = useCallback(() => persist("mini"), [persist]);
  const hide = useCallback(() => persist("hidden"), [persist]);
  const summon = useCallback(() => persist("mini"), [persist]);

  const value = useMemo<AssistantContextValue>(
    () => ({ mode, expand, minimize, hide, summon }),
    [mode, expand, minimize, hide, summon]
  );

  return (
    <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>
  );
}

export function useAssistant(): AssistantContextValue {
  const ctx = useContext(AssistantContext);
  if (!ctx) {
    throw new Error("useAssistant must be used within an <AssistantProvider>");
  }
  return ctx;
}
