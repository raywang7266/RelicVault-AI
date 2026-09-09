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
out.push("BEFORE_FONT: " + run(["eval", "getComputedStyle(document.documentElement).fontSize"]));
// open the font-size dropdown by clicking the control button directly in the DOM
out.push(run(["eval", "document.querySelector(\"button[aria-label='字号']\").click()"]));
out.push(run(["wait", "400"]));
out.push("OPTIONS_PRESENT: " + run(["eval", "!!document.querySelector(\"button:has-text('特大')\") || [...document.querySelectorAll('button')].some(b=>b.textContent.trim()==='特大')"]));
// choose 特大 via DOM click
out.push(run(["eval", "[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='特大').click()"]));
out.push(run(["wait", "400"]));
out.push("AFTER_VAR: " + run(["eval", "document.documentElement.style.getPropertyValue('--font-scale')"]));
out.push("AFTER_FONT: " + run(["eval", "getComputedStyle(document.documentElement).fontSize"]));
out.push("LS: " + run(["eval", "localStorage.getItem('rv_font_scale')"]));
// verify persistence across reload
out.push(run(["open", "http://localhost:3000/explore"]));
out.push(run(["wait", "1500"]));
out.push("PERSIST_VAR: " + run(["eval", "document.documentElement.style.getPropertyValue('--font-scale')"]));
out.push("PERSIST_FONT: " + run(["eval", "getComputedStyle(document.documentElement).fontSize"]));
console.log(out.join("\n"));
