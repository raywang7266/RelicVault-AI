const { execFileSync } = require("child_process");
function run(args) {
  try { return execFileSync(process.env.AGENT, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }); }
  catch (e) { return (e.stdout || "") + "\n[ERR]" + (e.stderr || ""); }
}
const out = [];
out.push(run(["open", "http://localhost:3000/login"]));
out.push(run(["fill", "input[type=email]", "curator@relicvault.app"]));
out.push(run(["fill", "input[type=password]", "RelicVault@2026"]));
out.push(run(["click", "button[type=submit]"]));
out.push(run(["wait", "3000"]));

out.push("CONTROLS: " + run(["eval", "document.querySelectorAll('.rv-controls').length"]));
out.push("CTRL_BTNS: " + run(["eval", "document.querySelectorAll('.rv-controls .rv-ctrl').length"]));
out.push("BADGE_INIT: " + run(["eval", "(document.querySelector('.rv-ctrl-badge')||{}).textContent || 'NONE'"]));

// theme toggle
out.push(run(["eval", "document.querySelector('.rv-ctrl[data-theme]').click()"]));
out.push(run(["wait", "300"]));
out.push("DARK_AFTER: " + run(["eval", "document.documentElement.classList.contains('dark')"]));
out.push(run(["eval", "document.querySelector('.rv-ctrl[data-theme]').click()"]));

// set font to MAX (极大, 1.9x)
out.push(run(["eval", "document.querySelectorAll('.rv-controls .rv-ctrl')[1].click()"]));
out.push(run(["wait", "400"]));
out.push("OPTION_CLICK: " + run(["eval", "(()=>{const b=[...document.querySelectorAll('.rv-menu [role=option]')].find(x=>x.textContent.includes('极大')); if(b){b.click(); return 'clicked';} return 'NO_OPTION';})()"]));
out.push(run(["wait", "400"]));
out.push("FONT_VAR: " + run(["eval", "document.documentElement.style.getPropertyValue('--font-scale')"]));
out.push("BADGE_MAX: " + run(["eval", "(document.querySelector('.rv-ctrl-badge')||{}).textContent || 'NONE'"]));
out.push("CTRL_H_AT_MAX: " + run(["eval", "Math.round(document.querySelector('.rv-ctrl').getBoundingClientRect().height)"]));
out.push("MEASURE_AT_MAX: " + run(["eval",
  "(()=>{var h=document.querySelector('header');var c=document.querySelector('.rv-controls');var hr=h.getBoundingClientRect();var cr=c.getBoundingClientRect();return JSON.stringify({headerH:Math.round(hr.height),ctrlBottom:Math.round(cr.bottom),overflow:Math.round(cr.bottom-hr.bottom)});})()"
]));
// also measure the full right cluster (controls + bell + user) does not exceed header
out.push("RIGHTCLUSTER: " + run(["eval",
  "(()=>{var h=document.querySelector('header');var nav=h.querySelector('nav');var hr=h.getBoundingClientRect();var nr=nav.getBoundingClientRect();return JSON.stringify({navBottom:Math.round(nr.bottom),headerBottom:Math.round(hr.bottom),overflow:Math.round(nr.bottom-hr.bottom)});})()"
]));
console.log(out.join("\n"));
