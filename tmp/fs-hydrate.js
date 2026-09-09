const { execFileSync } = require("child_process");
const AGENT = process.env.AGENT;
function run(args) {
  try {
    return execFileSync(AGENT, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  } catch (e) {
    return (e.stdout || "") + "\n[ERR] " + (e.stderr || "");
  }
}
const out = [];
out.push(run(["open", "http://localhost:3000/login"]));
out.push(run(["fill", "input[type=email]", "curator@relicvault.app"]));
out.push(run(["fill", "input[type=password]", "RelicVault@2026"]));
out.push(run(["click", "button[type=submit]"]));
out.push(run(["wait", "3500"]));
out.push("HTML_ATTRS_BEFORE: " + run(["eval", "document.documentElement.getAttribute('style')"]));
out.push("CLICK_CONTROL: " + run(["eval", "document.querySelector(\"button[aria-label='字号']\").click(); 'clicked'"]));
out.push(run(["wait", "400"]));
out.push("OPTION_COUNT: " + run(["eval", "[...document.querySelectorAll('button')].filter(b=>['小','标准','大','特大'].includes(b.textContent.trim())).length"]));
out.push("OPEN_STATE: " + run(["eval", "document.querySelector(\"button[aria-label='字号']\").getAttribute('aria-expanded')"]));
console.log(out.join("\n"));
