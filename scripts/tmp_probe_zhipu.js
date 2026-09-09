// 临时探测脚本 2：验证「引用角标指令」是否被模型遵循
const fs = require("fs");
const path = require("path");

const raw = fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8");
let key = "";
for (const line of raw.split(/\r?\n/)) {
  const m = line.match(/^\s*ZHIPU_API_KEY\s*=\s*(.*)\s*$/);
  if (m) key = m[1].replace(/^["']|["']$/g, "").trim();
}

const system =
  "你是「文遗小助手」，RelicVault AI 的贴心助手。请用中文简洁（3 段以内）、亲切地回答关于文物、历史、文化遗产与平台用法的问题。" +
  " 你已开启联网搜索：遇到最新或时效性信息（近期展览、新闻、价格、最新研究），可引用网络资料并标注来源。" +
  " 若引用了联网检索结果，请在相关句子末尾用 [1]、[2] 这类数字角标标注来源序号（序号对应检索结果顺序）。切勿编造链接。";

async function ask(question) {
  const res = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: Buffer.from(
      JSON.stringify({
        model: "glm-4-flash",
        messages: [
          { role: "system", content: system },
          { role: "user", content: question },
        ],
        temperature: 0.7,
        max_tokens: 1024,
        tools: [{ type: "web_search", web_search: { enable: true, search_result: true } }],
      }),
      "utf-8"
    ),
  });
  const json = await res.json();
  const text = json?.choices?.[0]?.message?.content ?? "";
  const web = Array.isArray(json.web_search) ? json.web_search : [];
  console.log("=== Q:", question);
  console.log("--- REPLY ---\n" + text);
  console.log("--- CITED ---", JSON.stringify([...new Set([...text.matchAll(/\[(\d{1,2})\]/g)].map((m) => +m[1]))]));
  console.log("--- WEB COUNT ---", web.length);
  collected.push({question, web, reply: text});
  console.log("--- WEB TOP3 ---", web.slice(0, 3).map((w) => `${w.title} | ${w.media} | ${w.link}`).join("\n"));
  console.log("");
}

const collected=[];
(async () => {
  await ask("青铜器上的饕餮纹有什么含义？");
  await ask("怎么上传文物照片？");
  fs.writeFileSync("scripts/tmp_web.json", JSON.stringify(collected));
})().catch((e) => console.log("ERR", e.message));
