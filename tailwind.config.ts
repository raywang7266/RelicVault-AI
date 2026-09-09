import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      // 字号调节：仅让「字号」乘上 --font-scale，间距/尺寸/图标一律不动
      // （这样是真正的「改文本大小」而非整体缩放）。行高用无单位倍数，
      // 会随字号自动等比放大，保证多行文字仍有呼吸空间。
      fontSize: {
        xs: ["calc(0.75rem * var(--font-scale))", { lineHeight: "1.25" }],
        sm: ["calc(0.875rem * var(--font-scale))", { lineHeight: "1.45" }],
        base: ["calc(1rem * var(--font-scale))", { lineHeight: "1.6" }],
        lg: ["calc(1.125rem * var(--font-scale))", { lineHeight: "1.55" }],
        xl: ["calc(1.25rem * var(--font-scale))", { lineHeight: "1.4" }],
        "2xl": ["calc(1.5rem * var(--font-scale))", { lineHeight: "1.3" }],
        "3xl": ["calc(1.875rem * var(--font-scale))", { lineHeight: "1.2" }],
        "4xl": ["calc(2.25rem * var(--font-scale))", { lineHeight: "1.15" }],
        "5xl": ["calc(3rem * var(--font-scale))", { lineHeight: "1.1" }],
        "6xl": ["calc(3.75rem * var(--font-scale))", { lineHeight: "1.05" }],
        "7xl": ["calc(4.5rem * var(--font-scale))", { lineHeight: "1" }],
        "8xl": ["calc(6rem * var(--font-scale))", { lineHeight: "1" }],
        "9xl": ["calc(8rem * var(--font-scale))", { lineHeight: "1" }],
      },
      fontFamily: {
        // 正文：Inter 负责拉丁文，Noto Sans SC 负责中文，回退到系统无衬线
        sans: [
          "var(--font-sans)",
          "Noto Sans SC",
          "system-ui",
          "-apple-system",
          "PingFang SC",
          "Microsoft YaHei",
          "sans-serif",
        ],
        // 标题：思源宋体 / 宋体栈，营造古籍与文博的高级感
        serif: [
          "Noto Serif SC",
          "Songti SC",
          "STSong",
          "Source Han Serif SC",
          "ui-serif",
          "Georgia",
          "serif",
        ],
        // 展示字：拉丁文用 Cormorant（优雅衬线），中文回落到宋体栈
        display: [
          "Cormorant Garamond",
          "Noto Serif SC",
          "Songti SC",
          "ui-serif",
          "Georgia",
          "serif",
        ],
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        // 高级感点缀：暖金 / 古铜色阶（与既有 #8C6D46 青铜保持一致）
        gold: {
          DEFAULT: "#B7935A",
          soft: "#C9A96A",
          deep: "#8C6D46",
        },
      },
      keyframes: {
        // 入场系列统一只用 transform，不依赖 fill-mode 把 opacity 从 0 拉到
        // 1。这样即使运行环境（动画中断、HMR 重新挂载、multi-column）把
        // fill-mode 剥离，元素始终是可见状态，不会出现「DOM 上有 n 个但视觉
        // 完全空白」这类隐形 bug。
        "fade-in-up": {
          "0%": { transform: "translate3d(0, 12px, 0)" },
          "100%": { transform: "translate3d(0, 0, 0)" },
        },
        "fade-in": {
          "0%": { transform: "translate3d(0, 6px, 0)" },
          "100%": { transform: "translate3d(0, 0, 0)" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-in": "fade-in 0.6s ease-out both",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
