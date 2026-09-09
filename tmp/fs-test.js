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
out.push("BEFORE: " + run(["eval", "getComputedStyle(document.documentElement).fontSize"]));
out.push(run(["click", "button[aria-label='字号']"]));
out.push(run(["wait", "500"]));
out.push(run(["click", "button:has-text('特大')"]));
out.push(run(["wait", "500"]));
out.push("AFTER_SCALE_VAR: " + run(["eval", "document.documentElement.style.getPropertyValue('--font-scale')"]));
out.push("AFTER_FONT: " + run(["eval", "getComputedStyle(document.documentElement).fontSize"]));
out.push("LS: " + run(["eval", "localStorage.getItem('rv_font_scale')"]));
// reload to verify persistence
out.push(run(["open", "http://localhost:3000/explore"]));
out.push(run(["wait", "1500"]));
out.push("PERSIST_VAR: " + run(["eval", "document.documentElement.style.getPropertyValue('--font-scale')"]));
out.push("PERSIST_FONT: " + run(["eval", "getComputedStyle(document.documentElement).fontSize"]));
console.log(out.join("\n"));
