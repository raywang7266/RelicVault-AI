const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..", "src");

// 修正：上一轮把 MAP 值写成带 "--" 前缀，又拼接了一次 "--"，
// 导致生成了非法的 var(----x)。统一把 var(---- 还原为 var(--。
let files = 0, fixes = 0;
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name.startsWith(".next")) continue;
      walk(full);
    } else if (/\.(tsx?|jsx?|mdx?)$/.test(entry.name)) {
      let src = fs.readFileSync(full, "utf8");
      if (src.includes("var(----")) {
        const n = (src.match(/var\(----/g) || []).length;
        src = src.split("var(----").join("var(--");
        fs.writeFileSync(full, src, "utf8");
        files++; fixes += n;
        console.log(`fixed ${path.relative(ROOT, full)} (${n})`);
      }
    }
  }
}
walk(ROOT);
console.log(`DONE files=${files} fixes=${fixes}`);
