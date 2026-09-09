import { buildReferences } from "./tmp_refs.ts";
import { readFileSync } from "node:fs";

const data = JSON.parse(readFileSync(new URL("./tmp_web.json", import.meta.url), "utf8"));

for (const item of data) {
  const refs = buildReferences({
    webResults: item.web,
    reply: item.reply,
    query: item.question,
    pageType: item.question.includes("上传") ? "upload" : "artifact-detail",
    pathname: item.question.includes("上传") ? "" : "/artifact/abc123",
    locale: "zh-CN",
  });
  console.log("=== Q:", item.question);
  for (const r of refs) {
    console.log(
      `  [${r.kind}] ${r.index ? "[" + r.index + "] " : ""}${r.title} — ${r.source} — ${r.url.slice(0, 70)}`
    );
  }
  console.log("");
}

// 空检索结果（未联网 / 未命中）时也应只剩站内参考
const onlySite = buildReferences({
  webResults: [],
  reply: "你可以点右下角上传。",
  query: "如何上传",
  pageType: "home",
  pathname: "/",
  locale: "en",
});
console.log("=== no web results (en, home) ===");
for (const r of onlySite) console.log(`  [${r.kind}] ${r.title} — ${r.source} — ${r.url}`);
