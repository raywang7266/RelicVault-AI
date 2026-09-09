const { execFileSync } = require("child_process");
const AGENT = process.env.AGENT;
function run(args) {
  try { return execFileSync(AGENT, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }); }
  catch (e) { return (e.stdout || "") + "\n[ERR]" + (e.stderr || ""); }
}
const out = [];
out.push(run(["open", "http://localhost:3000/login"]));
out.push(run(["fill", "input[type=email]", "curator@relicvault.app"]));
out.push(run(["fill", "input[type=password]", "RelicVault@2026"]));
out.push(run(["click", "button[type=submit]"]));
out.push(run(["wait", "2500"]));

const probe = `(() => {
  const root = getComputedStyle(document.documentElement).fontSize;
  const title = document.querySelector('[class*="text-[calc(15px"]');
  const titleFs = title ? getComputedStyle(title).fontSize : 'NO_TITLE';
  const pad = document.querySelector('[class*="px-2"]');
  const padL = pad ? getComputedStyle(pad).paddingLeft : 'NO_PAD';
  const ls = localStorage.getItem('rv_font_scale');
  return JSON.stringify({ root, titleFs, padL, ls });
})()`;

out.push("DEFAULT: " + run(["eval", probe]));

// open font-size control and pick 特大
out.push(run(["eval", `document.querySelector('button[aria-label="字号"], button[title="字号"]').click()`]));
out.push(run(["wait", "400"]));
out.push(run(["eval", `(() => { const b=[...document.querySelectorAll('button')].find(x=>x.textContent.includes('特大')); if(b) b.click(); })()`]));
out.push(run(["wait", "400"]));

out.push("XL: " + run(["eval", probe]));
out.push("LS_XL: " + run(["eval", "localStorage.getItem('rv_font_scale')"]));
console.log(out.join("\n"));
