const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "src");
const re = /text-\[(\d+(?:\.\d+)?)px\]/g;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name.startsWith(".next")) continue;
      walk(full);
    } else if (/\.(tsx?|jsx?|mdx?)$/.test(entry.name)) {
      let src = fs.readFileSync(full, "utf8");
      let changed = false;
      const next = src.replace(re, (m, num) => {
        changed = true;
        return `text-[calc(${num}px*var(--font-scale))]`;
      });
      if (changed) {
        fs.writeFileSync(full, next, "utf8");
        const count = (src.match(re) || []).length;
        console.log(`patched ${count} in ${path.relative(ROOT, full)}`);
      }
    }
  }
}

walk(ROOT);
console.log("DONE");
