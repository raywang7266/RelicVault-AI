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
out.push(run(["wait", "3000"]));
// dump all buttons' aria-labels and text in the navbar
out.push("NAVBAR_BTNS: " + run(["eval", `[...document.querySelectorAll('header button')].map(b=>({label:b.getAttribute('aria-label'),text:b.textContent.trim()}))]`]));
out.push("ANY_字号: " + run(["eval", `!!document.querySelector("button[aria-label='字号']")`]));
out.push("FONT_BTN_BY_TEXT: " + run(["eval", `[...document.querySelectorAll('button')].filter(b=>b.textContent.includes('字号')).length`]));
console.log(out.join("\n"));
