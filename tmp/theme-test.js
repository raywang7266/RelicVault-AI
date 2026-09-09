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
  const title = document.querySelector('[class*="text-[calc(15px"]');
  return JSON.stringify({
    bodyBg: getComputedStyle(document.body).backgroundColor,
    root: getComputedStyle(document.documentElement).fontSize,
    titleFs: title ? getComputedStyle(title).fontSize : 'NO_TITLE',
    dark: document.documentElement.classList.contains('dark'),
    lsTheme: localStorage.getItem('rv_theme'),
    lsFont: localStorage.getItem('rv_font_scale')
  });
})()`;

out.push("LIGHT: " + run(["eval", probe]));

// toggle theme
out.push(run(["eval", `document.querySelector('button[aria-label="主题"]').click()`]));
out.push(run(["wait", "500"]));
out.push("DARK: " + run(["eval", probe]));

// reload -> should persist dark
out.push(run(["open", "http://localhost:3000/explore"]));
out.push(run(["wait", "2500"]));
out.push("AFTER_RELOAD: " + run(["eval", probe]));

// font ceiling: 极大 (1.9)
out.push(run(["eval", `document.querySelector('button[aria-label="字号"]').click()`]));
out.push(run(["wait", "400"]));
out.push(run(["eval", `(() => { const b=[...document.querySelectorAll('button')].find(x=>x.textContent.includes('极大')); if(b) b.click(); })()`]));
out.push(run(["wait", "400"]));
out.push("FONT_MAX: " + run(["eval", probe]));

console.log(out.join("\n"));
