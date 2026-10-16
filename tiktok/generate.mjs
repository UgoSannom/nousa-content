// Génère un carrousel TikTok Nousa (PNG 1080 x 1920 + légende) à partir du contenu anglais.
// Usage : node tiktok/generate.mjs --format questions|who|wyr|pack --theme card|bold --out <dossier> [--seed <n>] [--no-state]
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(DIR, "..");
const args = Object.fromEntries(process.argv.slice(2).join(" ").split("--").filter(Boolean).map(s => {
  const [k, ...v] = s.trim().split(" ");
  return [k, v.join(" ") || true];
}));
const FORMAT = args.format || "questions";
const THEME = args.theme || "card";
const OUT = path.resolve(args.out || "tiktok/out");
const PER_POST = 5;

// ---------- tirage sans répétition ----------
let seed = Number(args.seed || Date.now() % 2147483647);
const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const pick = list => list[Math.floor(rand() * list.length)];
const STATE_FILE = path.join(DIR, "state.json");
const state = fs.existsSync(STATE_FILE) ? JSON.parse(fs.readFileSync(STATE_FILE, "utf8")) : { used: [] };

function draw(pool) {
  let fresh = pool.filter(x => !state.used.includes(x.id));
  if (fresh.length < PER_POST) { // tout a servi : on recommence ce stock
    state.used = state.used.filter(id => !pool.some(x => x.id === id));
    fresh = pool;
  }
  const out = [];
  while (out.length < PER_POST) {
    const x = pick(fresh);
    if (!out.includes(x)) out.push(x);
  }
  out.forEach(x => state.used.push(x.id));
  return out;
}

// ---------- contenu ----------
const core = JSON.parse(fs.readFileSync(path.join(DIR, "data/core.en.json"), "utf8"));
const CAT = { // couleurs et formes du site (site/build.py)
  discover: { top: "#D6476F", base: "#C43661", on: "#FFFFFF", shape: "circle" },
  memories: { top: "#FFD9BA", base: "#F6A783", on: "#3A1A24", shape: "sparkle" },
  dreams: { top: "#CDBFFF", base: "#9A86F3", on: "#2A1440", shape: "moon" },
  bond: { top: "#C4EFDF", base: "#74CDB0", on: "#0F362B", shape: "heart" },
  life: { top: "#C9E7FF", base: "#6DB8F0", on: "#0F2A40", shape: "square" },
  laughs: { top: "#FFF3B8", base: "#F5D45E", on: "#3A2E08", shape: "burst" },
};
const MODE = {
  who: { top: "#FFD9BA", base: "#F6A783", on: "#3A1A24", shape: "duo" },
  wyr: { top: "#CDBFFF", base: "#9A86F3", on: "#2A1440", shape: "diamond" },
  pack: { top: "#3B3566", base: "#262148", on: "#FFFFFF", shape: "moon" },
};
const catName = Object.fromEntries(core.categories.map(c => [c.id, c.name]));

const HOOKS = {
  questions: ["5 questions to ask your partner tonight", "Ask your partner these tonight", "Questions that bring you closer", "Try these on your next date night", "Read these to your partner"],
  who: ["Who's more likely to… Point at them", "Which one of you? Be honest", "Play this with your partner tonight", "Point at who does it more"],
  wyr: ["Would you rather… Couple edition", "Pick one, then compare with your partner", "Would you rather? Answer together", "Same answers? Let's see"],
  pack: ["Questions for a cozy night in", "Cozy night questions for two"],
};
const CAPTIONS = {
  questions: ["Save this for your next date night.", "Which one would you answer first?", "Send this to your partner.", "Try one tonight and tell me how it went."],
  who: ["Tag the one who does it more.", "Comment your score.", "Play it tonight, no cheating."],
  wyr: ["Comment your answers, A or B.", "Did you pick the same ones?", "Send this to your partner and compare."],
  pack: ["Save this for your next night in.", "Perfect for a slow evening together."],
};
const TAGS = {
  questions: ["#couplequestions", "#relationshipgoals", "#datenight", "#couples", "#questionsforcouples", "#deepquestions", "#couplegoals"],
  who: ["#whosmostlikelyto", "#couplechallenge", "#couples", "#relationshipgoals", "#couplegames", "#datenight"],
  wyr: ["#wouldyourather", "#couplequestions", "#couples", "#couplegames", "#relationshipgoals", "#datenight"],
  pack: ["#cozynight", "#couplequestions", "#datenightideas", "#couples", "#relationshipgoals"],
};

let slides = [];
if (FORMAT === "questions") {
  slides = draw(core.questions).map(q => ({ kind: "question", text: q.text, label: catName[q.category], c: CAT[q.category] }));
} else if (FORMAT === "who") {
  slides = draw(core.modes.who.items).map(x => ({ kind: "question", text: x.text, label: core.modes.who.name, c: MODE.who }));
} else if (FORMAT === "wyr") {
  slides = draw(core.modes.wyr.items).map(x => ({ kind: "wyr", a: x.a, b: x.b, label: core.modes.wyr.name, c: MODE.wyr }));
} else if (FORMAT === "pack") {
  const idx = JSON.parse(fs.readFileSync(path.join(ROOT, "packs/index.json"), "utf8"));
  const today = new Date().toISOString().slice(0, 10);
  const cur = idx.packs.filter(p => p.available <= today).at(-1);
  const pack = JSON.parse(fs.readFileSync(path.join(ROOT, `packs/${cur.id}.en.json`), "utf8"));
  slides = draw(pack.questions).map(q => ({ kind: "question", text: q.text, label: pack.title, c: MODE.pack }));
}
const accent = slides[0].c;
slides.unshift({ kind: "hook", text: pick(HOOKS[FORMAT]), c: accent });
slides.push({ kind: "cta", c: accent });
slides.forEach((s, i) => (s.n = i, s.total = slides.length));

const caption = `${pick(CAPTIONS[FORMAT])}\n\n${[...TAGS[FORMAT]].sort(() => rand() - .5).slice(0, 5).join(" ")}`;

// ---------- rendu ----------
const SHAPE = {
  circle: ["134", '<circle cx="67" cy="67" r="67"/>'],
  sparkle: ["134", '<path d="M67 0L85 49L134 67L85 85L67 134L49 85L0 67L49 49Z"/>'],
  moon: ["134", '<path d="M67 0C68.16 0 69.31.03 70.45.09 56.97 10.1 48.24 26.14 48.24 44.22c0 30.34 24.6 54.94 54.94 54.94 9.27 0 18.01-2.3 25.67-6.35C118.74 117 94.86 134 67 134 30 134 0 104 0 67S30 0 67 0Z"/>'],
  heart: ["134", '<path d="M67 128.64C29.48 101.84 0 77.72 0 45.56 0 22.78 17.42 5.36 38.86 5.36c12.06 0 21.44 6.7 28.14 17.42C73.7 12.06 83.08 5.36 95.14 5.36 116.58 5.36 134 22.78 134 45.56c0 32.16-29.48 56.28-67 83.08Z"/>'],
  square: ["134", '<rect x="8.21" y="33.06" width="96" height="96" rx="23" transform="rotate(-15 8.21 33.06)"/>'],
  burst: ["134", '<path d="M67 0L82.9 28.6L114.4 19.6L105.4 51.1L134 67L105.4 82.9L114.4 114.4L82.9 105.4L67 134L51.1 105.4L19.6 114.4L28.6 82.9L0 67L28.6 51.1L19.6 19.6L51.1 28.6Z"/>'],
  duo: ["50", '<path d="M34.5 9.5C43.06 9.5 50 16.44 50 25s-6.94 15.5-15.5 15.5c-3.58 0-6.88-1.21-9.5-3.25A15.4 15.4 0 0 1 15.5 40.5C6.94 40.5 0 33.56 0 25S6.94 9.5 15.5 9.5c3.58 0 6.88 1.21 9.5 3.25A15.4 15.4 0 0 1 34.5 9.5Z"/>'],
  diamond: ["50", '<rect x=".76" y="25" width="34.29" height="34.29" rx="6.43" transform="rotate(-45 .76 25)"/>'],
};
const shapeSvg = (k, size, style, op = .28) =>
  `<svg class="shape" style="width:${size}px;height:${size}px;${style}" viewBox="0 0 ${SHAPE[k][0]} ${SHAPE[k][0]}" fill="currentColor" opacity="${op}">${SHAPE[k][1]}</svg>`;
const img = f => "data:image/svg+xml;base64," + fs.readFileSync(path.join(ROOT, "assets/img", f)).toString("base64");
const font = f => "data:font/woff2;base64," + fs.readFileSync(path.join(ROOT, "assets/fonts", f)).toString("base64");
const typo = s => String(s).replace(/'/g, "\u2019").replace(/"([^"]*)"/g, "\u201C$1\u201D");
const esc = s => typo(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

const CSS = `
@font-face{font-family:B;font-weight:200 800;font-stretch:75% 100%;src:url(${font("bricolage-grotesque-latin-opsz-normal.woff2")})}
@font-face{font-family:F;font-weight:300 900;src:url(${font("figtree-latin-wght-normal.woff2")})}
*{box-sizing:border-box;margin:0}
html,body{width:1080px;height:1920px;overflow:hidden}
body{font-family:F;color:#2A1420;-webkit-font-smoothing:antialiased;position:relative;background:#FFF5F7}
.shape{position:absolute;color:#fff}
/* zone sûre TikTok : rien d'important sous y=1500 ni à droite de x=940 */
.safe{position:absolute;left:90px;right:150px;top:220px;bottom:420px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
.logo{position:absolute;top:120px;left:0;right:60px;display:flex;justify-content:center;align-items:center;gap:14px;font:800 44px/1 B;letter-spacing:-.5px}
.logo img{width:70px;height:56px}
.grad{background:linear-gradient(145deg,var(--top) 8.33%,var(--base) 91.67%);color:var(--on);position:relative;overflow:hidden;
  box-shadow:inset 0 24px 40px rgba(255,255,255,.18),inset 0 2px 1px rgba(255,255,255,.45)}
.card{width:100%;border-radius:64px;padding:96px 72px 110px;min-height:900px;display:flex;flex-direction:column;justify-content:center;
  box-shadow:inset 0 24px 40px rgba(255,255,255,.18),inset 0 2px 1px rgba(255,255,255,.45),0 8px 24px rgba(89,26,51,.07)}
.label{font:700 30px/1.2 F;letter-spacing:2.4px;text-transform:uppercase;opacity:.85;margin-bottom:44px;position:relative}
.q{font:800 86px/1.08 B;letter-spacing:-1.4px;position:relative}
.count{position:absolute;bottom:430px;left:0;right:60px;text-align:center;font:700 28px/1 F;color:#82636F;letter-spacing:2px}
.hook{font:800 118px/1.02 B;letter-spacing:-2.4px}
.sub{font:600 40px/1.35 F;margin-top:48px;opacity:.85}
.or{font:800 50px/1 B;margin:36px 0;opacity:.7;position:relative}
.opt{width:100%;border-radius:44px;padding:56px 48px;font:800 64px/1.1 B;letter-spacing:-.8px;position:relative}
.opt i{display:block;font:800 34px/1 F;font-style:normal;opacity:.55;margin-bottom:14px}
.opt span{display:block}
.opt.a{background:rgba(255,255,255,.92);color:#2A1420}
.opt.b{background:rgba(255,255,255,.28);color:inherit;border:4px solid rgba(255,255,255,.7)}
.mascot{width:400px;height:320px;margin-bottom:56px}
.btn{display:inline-block;margin-top:56px;padding:34px 64px;border-radius:999px;font:800 44px/1 B;background:#C43661;color:#fff;
  box-shadow:inset 0 24px 40px rgba(255,255,255,.18),inset 0 2px 1px rgba(255,255,255,.45),0 8px 24px rgba(196,54,97,.25)}
/* thème plein écran */
body.bold{background:linear-gradient(160deg,var(--top) 0%,var(--base) 100%);color:var(--on)}
body.bold .card{background:none;box-shadow:none;padding:0;min-height:0}
body.bold .q{font-size:104px;letter-spacing:-2px}
body.bold .count{color:var(--on);opacity:.6}
body.bold .btn{background:#fff;color:#C43661}
`;

function slideHtml(s) {
  const c = s.c, vars = `--top:${c.top};--base:${c.base};--on:${c.on}`;
  const light = ["#FFFFFF"].includes(c.on);
  const bold = THEME === "bold";
  const logoImg = bold && light ? "mascotte-blanc.svg" : "mascotte.svg";
  const logo = `<div class="logo"><img src="${img(logoImg)}">Nousa</div>`;
  const count = s.kind === "hook" || s.kind === "cta" ? "" : `<div class="count">${s.n} / ${s.total - 2}</div>`;
  let inner = "";
  const deco = (k) => bold
    ? shapeSvg(k, 220, "right:70px;top:300px") + shapeSvg(k, 300, "left:70px;bottom:120px", .2)
    : shapeSvg(k, 150, "right:52px;top:52px");
  if (s.kind === "hook") {
    inner = bold
      ? `<div class="hook">${esc(s.text)}</div><div class="sub">Swipe and read them out loud</div>`
      : `<div class="card grad" style="${vars}">${shapeSvg(c.shape, 150, "right:52px;top:52px")}<div class="hook" style="position:relative">${esc(s.text)}</div><div class="sub" style="position:relative">Swipe and read them out loud</div></div>`;
  } else if (s.kind === "question") {
    inner = `<div class="card ${bold ? "" : "grad"}" style="${vars}">${bold ? "" : deco(c.shape)}<div class="label">${esc(s.label)}</div><div class="q fit">${esc(s.text)}</div></div>`;
  } else if (s.kind === "wyr") {
    inner = `<div class="card ${bold ? "" : "grad"}" style="${vars}">${bold ? "" : deco(c.shape)}<div class="label">${esc(s.label)}</div>
      <div class="opt a"><i>A</i><span class="fit">${esc(cap(s.a))}</span></div><div class="or">or</div><div class="opt b"><i>B</i><span class="fit">${esc(cap(s.b))}</span></div></div>`;
  } else {
    inner = `<img class="mascot" src="${img(bold && light ? "mascotte-coeur-blanc.svg" : "mascotte-coeur.svg")}">
      <div class="hook" style="font-size:96px">More questions like these in Nousa</div>
      <div class="sub">Free 3-day trial</div><div class="btn">On the App Store</div>`;
  }
  return `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head>
<body class="${bold ? "bold" : ""}" style="${vars}">${bold ? deco(c.shape) : ""}${s.kind === "cta" ? "" : logo}<div class="safe">${inner}</div>${count}</body></html>`;
}
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
for (const s of slides) {
  await page.setContent(slideHtml(s), { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  // réduit la police d'un texte trop long jusqu'à ce qu'il tienne dans la zone sûre
  await page.evaluate(() => {
    const safe = document.querySelector(".safe");
    for (const el of document.querySelectorAll(".fit")) {
      let size = parseFloat(getComputedStyle(el).fontSize);
      while ((safe.scrollHeight > safe.clientHeight + 1) && size > 40) { size -= 2; el.style.fontSize = size + "px"; }
    }
  });
  await page.screenshot({ path: path.join(OUT, `${String(s.n + 1).padStart(2, "0")}.png`) });
}
await browser.close();
fs.writeFileSync(path.join(OUT, "caption.txt"), caption + "\n");
if (!args["no-state"]) fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 1) + "\n");
console.log(`${slides.length} slides -> ${OUT}\n---\n${caption}`);
