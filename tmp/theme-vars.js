const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "src");

// 仅映射「羊皮纸 / 青铜 / 暖金」中性品牌色；语义状态色（绿/红/琥珀）与
// 模态遮罩 #1F1714、画布 #ffffff 等一律不动，避免破坏状态语义与对比度。
const MAP = {
  "#2c221e": "--ink",
  "#fbf8f2": "--paper",
  "#f7f1e6": "--paper-2",
  "#faf7f2": "--panel",
  "#f5f0e6": "--surface",
  "#f2ece1": "--chip",
  "#efe6d5": "--chip-2",
  "#fbf6ee": "--panel",
  "#fcfaf5": "--panel",
  "#f1e9d8": "--chip-2",
  "#e9dfc8": "--chip-2",
  "#d8c7a3": "--border",
  "#e6dfc6": "--border-soft",
  "#eadfcb": "--border-soft",
  "#f3eee3": "--border-soft",
  "#d6cbba": "--border",
  "#c9bca6": "--dot",
  "#8c6d46": "--bronze",
  "#735836": "--bronze-deep",
  "#78592f": "--bronze-deep",
  "#5c4831": "--bronze-ink",
  "#b7935a": "--gold",
  "#c9a96a": "--gold-2",
  "#7a6b5d": "--muted",
  "#9c8e80": "--muted-2",
  "#8c7e72": "--muted-3",
  "#a39587": "--muted-4",
  "#3e3228": "--brown",
  "#6e5d4f": "--chip-ink",
  "#d9cfbe": "--muted-2",
};

const PREFIXES = ["bg", "text", "border", "from", "to", "via", "divide", "ring"];
// 匹配 bg-[#hex](/NN)? 等；hex 大小写不敏感
const re = new RegExp(
  "(" + PREFIXES.join("|") + ")-\\[#([0-9a-fA-F]{3,8})\\](?:\\/(\\d+))?",
  "g"
);

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name.startsWith(".next")) continue;
      walk(full);
    } else if (/\.(tsx?|jsx?|mdx?)$/.test(entry.name)) {
      let src = fs.readFileSync(full, "utf8");
      let changed = false;
      const next = src.replace(re, (m, p, hex, op) => {
        const key = "#" + hex.toLowerCase();
        const v = MAP[key];
        if (!v) return m; // 不在映射内（状态色等）→ 不动
        changed = true;
        return `${p}-[var(--${v})]`; // 丢弃 /NN 透明度修饰
      });
      if (changed) {
        fs.writeFileSync(full, next, "utf8");
        const cnt = (next.match(re) || []).length;
        console.log(`patched ${path.relative(ROOT, full)} (remaining ${cnt} raw hex in cls)`);
      }
    }
  }
}

walk(ROOT);
console.log("DONE");
