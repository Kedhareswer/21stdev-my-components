"use client"

// Cyanotype Collage Hero — a summer scrapbook printed in one ink. On graph
// paper, a two-line serif headline sits beside a collage of cut-outs: a sky
// photograph full of halftone cumulus, a small snapshot of a cloud tower, a
// sunflower, an ice pop, a sandal and a pair of chopsticks, all orbiting a
// dark, mottled planet with a white starburst and the file number in its
// corner.
//
// Every scrap is a toy. Drag any of them around (or focus one and use the
// arrow keys), and tap to play: the sky photo takes another picture, the
// snapshot flips to its handwritten back, the sunflower spins, the ice pop
// gets bitten down to a winning stick, the sandal is tossed to forecast
// tomorrow's weather, the starburst flares. Tap the paper to stamp sparkles.
// The file number pages through chapters — headline, copy, sky and clouds all
// change — and the whole collage leans with the pointer.
//
// Every illustration is SVG drawn in this file from seeded shapes, halftone
// patterns and turbulence. Nothing loads: no fonts, images or stylesheets.
import * as React from "react"

/* ------------------------------------------------------------------ types */

export type CollageSky = "day" | "dusk" | "night"
export type CollagePalette = "cobalt" | "ultramarine" | "teal" | "vermilion"

export type CollageChapter = {
  /** The big numeral on the planet, e.g. "06". */
  number?: string
  /** Small label in the top corner. `\n` breaks lines, *asterisks* print in the accent. */
  kicker?: string
  /** The headline. `\n` breaks lines, *asterisks* print in the accent. */
  title?: string
  /** The centred copy under the headline. `\n` breaks lines. */
  body?: string
  /** Handwritten on the back of the small snapshot. `\n` breaks lines. */
  caption?: string
  /** Light in both photographs. */
  sky?: CollageSky
  /** Seeds the clouds, the planet and the sandal's forecasts. */
  seed?: number
}

export type CollageAction = { label: string; href: string }

export type CyanotypeCollageHeroProps = {
  /** One or more files. The numeral on the planet pages through them. */
  chapters?: CollageChapter[]
  initialChapter?: number
  /** Pages to the next chapter every this many ms. 0 turns it off. Pauses on hover. */
  autoplay?: number
  onChapterChange?: (index: number) => void
  /** Optional link under the copy. */
  action?: CollageAction
  /** Printed as the barcode, combined with the chapter number. */
  barcode?: string
  /** Small print beside the barcode. Empty string hides it. */
  hint?: string
  /** `lang` for the headline and copy, so the right glyphs are chosen. */
  lang?: string
  palette?: CollagePalette
  /** Overrides the palette's ink colour. */
  accent?: string
  /** Overrides the palette's paper colour (light theme). */
  paper?: string
  /** "auto" follows a `.dark` class on an ancestor. */
  theme?: "auto" | "light" | "dark"
  /** Lets the scraps be dragged. They still play when tapped either way. */
  draggable?: boolean
  /** Tapping the paper stamps sparkles. */
  stamps?: boolean
  /** Scraps drop onto the page on load. */
  intro?: boolean
  /** A definite length, so it survives any host layout. */
  height?: string
  className?: string
}

/* ------------------------------------------------------------------ logic */

// #region logic
const PALETTES = {
  cobalt: { label: "Cobalt", accent: "#1d3fd0", paper: "#eef0f3" },
  ultramarine: { label: "Ultramarine", accent: "#3b27c9", paper: "#f0eff4" },
  teal: { label: "Teal", accent: "#08798a", paper: "#edf2f1" },
  vermilion: { label: "Vermilion", accent: "#de3f24", paper: "#f4f0ea" },
}
const SKIES = ["day", "dusk", "night"]
const WEATHER = [
  { jp: "晴れ", en: "sunny", turn: 0 },
  { jp: "くもり", en: "cloudy", turn: 90 },
  { jp: "雨", en: "rain", turn: 180 },
]
const BITES = [
  { cx: 34, cy: -150, r: 25 },
  { cx: -24, cy: -156, r: 30 },
  { cx: 8, cy: -106, r: 33 },
]

function clamp(v: number, a: number, b: number): number {
  return Math.min(b, Math.max(a, v))
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hashString(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function r1(n: number): number {
  return Math.round(n * 10) / 10
}

function wrap(i: number, n: number): number {
  if (n <= 0) return 0
  return ((Math.round(i) % n) + n) % n
}

function paletteColors(name: string, accent?: string, paper?: string): { accent: string; paper: string } {
  const p = (PALETTES as { [k: string]: { accent: string; paper: string } })[name] || PALETTES.cobalt
  return { accent: accent || p.accent, paper: paper || p.paper }
}

function skyOf(s?: string): CollageSky {
  return (SKIES.includes(s || "") ? s : "day") as CollageSky
}

type Emph = { text: string; em: boolean }

// "plain *accent* plain" → segments. An unmatched asterisk stays literal.
function parseEmphasis(s: string): Emph[] {
  const out = [] as Emph[]
  const re = /\*([^*]+)\*/g
  let last = 0
  let m = re.exec(s)
  while (m) {
    if (m.index > last) out.push({ text: s.slice(last, m.index), em: false })
    out.push({ text: m[1], em: true })
    last = m.index + m[0].length
    m = re.exec(s)
  }
  if (last < s.length) out.push({ text: s.slice(last), em: false })
  return out
}

function plain(s: string): string {
  return s.replace(/\*([^*]+)\*/g, "$1").replace(/\s*\n\s*/g, " ").trim()
}

// Roving keys for the chapter control. Returns null for keys it does not handle.
function chapterKey(i: number, key: string, n: number): number | null {
  if (n <= 0) return null
  if (key === "ArrowRight" || key === "ArrowDown") return (i + 1) % n
  if (key === "ArrowLeft" || key === "ArrowUp") return (i - 1 + n) % n
  if (key === "Home") return 0
  if (key === "End") return n - 1
  return null
}

// Arrow keys move a focused scrap; Shift moves it further.
function nudge(key: string, shift: boolean): [number, number] | null {
  const s = shift ? 40 : 10
  if (key === "ArrowLeft") return [-s, 0]
  if (key === "ArrowRight") return [s, 0]
  if (key === "ArrowUp") return [0, -s]
  if (key === "ArrowDown") return [0, s]
  return null
}

// A press that barely moved is a tap, not a drag.
function isTap(dx: number, dy: number): boolean {
  return dx * dx + dy * dy < 36
}

// Four-point sparkle with concave sides. k is how far the waist pinches in.
function sparklePath(x: number, y: number, r: number, k = 0.13): string {
  const c = r * k
  const P = (a: number, b: number) => r1(a) + " " + r1(b)
  return "M" + P(x, y - r) + "Q" + P(x + c, y - c) + " " + P(x + r, y) + "Q" + P(x + c, y + c) + " " + P(x, y + r) + "Q" + P(x - c, y + c) + " " + P(x - r, y) + "Q" + P(x - c, y - c) + " " + P(x, y - r) + "Z"
}

// Needle starburst: n spikes alternating long and short around a tiny waist.
function starburst(x: number, y: number, long: number, short: number, n = 8): string {
  const pts = [] as string[]
  for (let i = 0; i < n * 2; i++) {
    const a = (i * Math.PI) / n - Math.PI / 2
    const r = i % 2 ? long * 0.06 : (i / 2) % 2 ? short : long
    pts.push(r1(x + Math.cos(a) * r) + " " + r1(y + Math.sin(a) * r))
  }
  return "M" + pts.join("L") + "Z"
}

// A full tilted ellipse as a path, so it can also carry an animateMotion.
function ellipsePath(cx: number, cy: number, rx: number, ry: number, deg: number): string {
  const a = (deg * Math.PI) / 180
  const p1 = r1(cx + Math.cos(a) * rx) + " " + r1(cy + Math.sin(a) * rx)
  const p2 = r1(cx - Math.cos(a) * rx) + " " + r1(cy - Math.sin(a) * rx)
  const arc = "A" + rx + " " + ry + " " + deg + " 1 1 "
  return "M" + p1 + arc + p2 + arc + p1 + "Z"
}

// A petal pointing up from radius r0.
function petalPath(r0: number, len: number, w: number): string {
  const y0 = -r0
  const y1 = -r0 - len
  return "M0 " + r1(y0) + "C" + r1(w) + " " + r1(y0 - len * 0.22) + " " + r1(w * 0.72) + " " + r1(y0 - len * 0.82) + " 0 " + r1(y1) + "C" + r1(-w * 0.72) + " " + r1(y0 - len * 0.82) + " " + r1(-w) + " " + r1(y0 - len * 0.22) + " 0 " + r1(y0) + "Z"
}

type Puff = { cx: number; cy: number; r: number }

// A cumulus as a heap of circles: a flat row along the base, then puffs piled
// higher towards the middle. Sorted top-first so lower puffs sit in front.
function cloudBank(seed: number, cx: number, base: number, w: number, h: number, n: number): Puff[] {
  const rnd = mulberry32(seed)
  const s = Math.min(w, h)
  const row = Math.max(1, Math.ceil(n / 3))
  const out = [] as Puff[]
  for (let i = 0; i < n; i++) {
    const onRow = i < row
    const t = onRow ? (i + 0.5) / row : 0.08 + rnd() * 0.84
    const hump = 1 - Math.abs(t - 0.5) * 2
    const r = (s * 0.14 + s * 0.14 * hump) * (0.75 + rnd() * 0.5)
    const lift = onRow ? 0 : rnd() * Math.pow(hump, 0.6)
    out.push({ cx: r1(cx + (t - 0.5) * w), cy: r1(base - r * 0.55 - lift * Math.max(0, h - r)), r: r1(r) })
  }
  return out.sort((a, b) => a.cy - b.cy)
}

// Bars for a decorative barcode: guard, four bars per character, guard. The
// widths are hashed from the text, so the same code always prints the same.
function barcodeBars(code: string, width: number): { x: number; w: number }[] {
  const s = code.replace(/\s+/g, "") || "0"
  const units = [1, 1, 1] as number[]
  for (let i = 0; i < s.length; i++) {
    let h = hashString(s[i] + ":" + i)
    for (let k = 0; k < 4; k++) {
      units.push(1 + ((h & 3) % 3))
      h >>>= 2
    }
  }
  units.push(1, 1, 1, 1)
  const total = units.reduce((a, b) => a + b, 0)
  const k = width / total
  const out = [] as { x: number; w: number }[]
  let x = 0
  units.forEach((u, i) => {
    if (i % 2 === 0) out.push({ x: r1(x * k), w: r1(u * k) })
    x += u
  })
  return out
}

// "Ashita tenki ni naare": toss a sandal and read tomorrow off how it lands.
function forecast(seed: number, toss: number): number {
  return Math.floor(mulberry32(seed * 31 + toss * 7 + 1)() * WEATHER.length)
}
// #endregion logic

/* --------------------------------------------------------------- defaults */

const DEFAULT_CHAPTERS: CollageChapter[] = [
  {
    number: "06",
    kicker: "Observer alpha\ndreams of blue.\nA summer scenario,\nlog no. *06*.",
    title: "観測者αは\n*青*を夢見る",
    body: "八月の空に置き忘れたもの\nあなたはまだ覚えていますか\n溶けかけた約束の続きを\nここで一緒に探しましょう",
    caption: "2026.08.06\n屋上にて",
    sky: "day",
    seed: 6,
  },
  {
    number: "07",
    kicker: "Record beta\ncounts the clouds.\nA summer scenario,\nlog no. *07*.",
    title: "記録体βは\n*雲*を数える",
    body: "ひとつ、ふたつと白い午後\n数えるたびに遠くなる\n窓の外の入道雲が\nあなたの名前を呼んでいる",
    caption: "2026.08.07\n雲の数 ∞",
    sky: "dusk",
    seed: 17,
  },
  {
    number: "08",
    kicker: "Specimen gamma\nblooms at night.\nA summer scenario,\nlog no. *08*.",
    title: "標本γは\n*夜*に咲く",
    body: "向日葵は夜に背を向けて\n星の数だけ嘘をつく\nそれでも朝が来るのなら\n最後の頁を開いてください",
    caption: "2026.08.08\n夜の向日葵",
    sky: "night",
    seed: 28,
  },
]

const DEFAULT_HINT = "Drag the scraps · tap to play · ← → files"

// Where each scrap sits on the 840 × 675 collage, its tilt and parallax depth.
const PIECES = [
  { key: "photo", x: 425, y: 338, w: 520, h: 380, r: -6, d: 6 },
  { key: "polaroid", x: 134, y: 452, w: 190, h: 250, r: 11, d: 10 },
  { key: "sunflower", x: 222, y: 288, w: 240, h: 240, r: -8, d: 16 },
  { key: "popsicle", x: 444, y: 528, w: 112, h: 304, r: 24, d: 20 },
  { key: "bars", x: 702, y: 136, w: 250, h: 76, r: -38, d: 12 },
  { key: "sandal", x: 598, y: 90, w: 280, h: 215, r: 30, d: 14 },
  { key: "star", x: 748, y: 368, w: 250, h: 250, r: 0, d: 18 },
]

const LABELS: { [k: string]: string } = {
  photo: "Sky photograph. Press Enter to take another",
  polaroid: "Snapshot. Press Enter to flip it over",
  sunflower: "Sunflower. Press Enter to spin it",
  popsicle: "Ice pop. Press Enter to take a bite",
  bars: "Chopsticks. Press Enter to clack them",
  sandal: "Sandal. Press Enter to toss it and forecast tomorrow's weather",
  star: "Starburst. Press Enter to make it flare",
}

const SPARKS = [
  { x: 70, y: 60, r: 48, t: 0 },
  { x: 152, y: 128, r: 42, t: 0.9 },
  { x: 96, y: 192, r: 27, t: 1.7 },
  { x: -16, y: 604, r: 27, t: 0.5, side: true },
  { x: 652, y: 650, r: 26, t: 1.2, light: true },
]
const RINGS = [
  { x: 186, y: 30, r: 6 },
  { x: -56, y: 646, r: 6, side: true },
]

/* -------------------------------------------------------------------- css */

const CCH_CSS = `
.cch-root{position:relative;width:100%;overflow:hidden;isolation:isolate;container-type:size;container-name:cch;--cch-p:var(--cch-pl);--cch-ink:#14151b;--cch-line:#14151b;--cch-white:#fcfcfe;--cch-night:#06070d;--cch-at:var(--cch-a);--cch-grid:color-mix(in srgb,var(--cch-a) 13%,transparent);--cch-deco:#24252d;--cch-px:0;--cch-py:0;--cch-serif:"Hiragino Mincho ProN","Yu Mincho","YuMincho","Noto Serif JP","Noto Serif CJK JP","Source Han Serif JP","Songti SC",Georgia,serif;--cch-sans:"Hiragino Sans","Hiragino Kaku Gothic ProN","Yu Gothic","YuGothic","Noto Sans JP","Noto Sans CJK JP",system-ui,sans-serif;--cch-geo:"Futura","Avenir Next","Century Gothic","Montserrat","Helvetica Neue",Arial,sans-serif;color:var(--cch-ink);background:var(--cch-p);font-family:var(--cch-sans);-webkit-tap-highlight-color:transparent}
.cch-root[data-theme="dark"],.dark .cch-root[data-theme="auto"]{--cch-p:color-mix(in srgb,var(--cch-a) 12%,#05060c);--cch-ink:#eceef8;--cch-at:color-mix(in srgb,var(--cch-a) 55%,#fff);--cch-grid:color-mix(in srgb,var(--cch-a) 30%,transparent);--cch-deco:#d6d9ef}
.cch-root :where(button){font:inherit;color:inherit;background:none;border:0;padding:0;margin:0;cursor:pointer}
.cch-root :where(h1,p){margin:0}
.cch-svg{display:block;width:100%;height:100%;max-width:none;overflow:visible}
.cch-frame{position:absolute;inset:0;--u:min(calc(100cqh / 675),calc(100cqw / 1200))}
.cch-defs{position:absolute;width:0;height:0;overflow:hidden}
.cch-bg{position:absolute;inset:0;background-image:linear-gradient(var(--cch-grid) 1px,transparent 1px),linear-gradient(90deg,var(--cch-grid) 1px,transparent 1px);background-size:max(20px,calc(33 * var(--u))) max(20px,calc(33 * var(--u)));background-position:-1px -1px}
.cch-stamps-on .cch-bg{cursor:crosshair}
.cch-grain{position:absolute;inset:0;width:100%;height:100%;max-width:none;pointer-events:none;opacity:.1;mix-blend-mode:multiply;transform:translateZ(0)}
.cch-root[data-theme="dark"] .cch-grain,.dark .cch-root[data-theme="auto"] .cch-grain{opacity:.07;mix-blend-mode:screen}

.cch-fa{fill:var(--cch-a)}
.cch-fw{fill:var(--cch-white)}
.cch-fk{fill:var(--cch-line)}
.cch-fn{fill:var(--cch-night)}
.cch-fc{fill:color-mix(in srgb,var(--cch-a) 26%,#fff)}
.cch-sk{stroke:var(--cch-line)}
.cch-o{fill:none;stroke:var(--cch-line);stroke-linecap:round;stroke-linejoin:round}

.cch-stage{position:absolute;right:0;top:50%;width:calc(840 * var(--u));height:calc(675 * var(--u));transform:translateY(-50%);pointer-events:none}
.cch-orbit{position:absolute;inset:0;transform:translate(calc(var(--cch-px) * 4 * var(--u)),calc(var(--cch-py) * 4 * var(--u)))}
.cch-orbit path{fill:none;stroke:var(--cch-a);stroke-width:2.2}
.cch-intro .cch-orbit path{stroke-dasharray:1;animation:cch-draw 2.2s cubic-bezier(.6,0,.2,1) .15s backwards}
.cch-planet{position:absolute;left:calc(830 * var(--u));top:calc(420 * var(--u));width:calc(660 * var(--u));height:calc(660 * var(--u));border-radius:50%;overflow:hidden;background:var(--cch-night);transform:translate(-50%,-50%) translate(calc(var(--cch-px) * 3 * var(--u)),calc(var(--cch-py) * 3 * var(--u)))}
.cch-root[data-theme="dark"] .cch-planet,.dark .cch-root[data-theme="auto"] .cch-planet{box-shadow:inset 0 0 0 1.5px color-mix(in srgb,var(--cch-a) 60%,#fff)}
.cch-ptex{position:absolute;inset:0;width:100%;height:100%;animation:cch-turn 300s linear infinite;will-change:transform}
.cch-pshade{position:absolute;inset:0;border-radius:50%;background:radial-gradient(circle at 16% 40%,transparent 0 26%,rgba(6,7,13,.5) 58%,rgba(6,7,13,.9) 84%)}
.cch-intro .cch-planet{animation:cch-rise 1.6s cubic-bezier(.2,.8,.2,1) backwards}

.cch-piece{position:absolute;left:calc(var(--x) * var(--u));top:calc(var(--y) * var(--u));width:calc(var(--w) * var(--u));height:calc(var(--h) * var(--u));transform:translate(-50%,-50%) translate(calc(var(--cch-px) * var(--d) * var(--u) + var(--dx,0px)),calc(var(--cch-py) * var(--d) * var(--u) + var(--dy,0px))) rotate(calc(var(--r) * 1deg));pointer-events:auto;touch-action:none;cursor:grab;outline:none;user-select:none;-webkit-user-select:none;will-change:transform}
.cch-fixed .cch-piece{cursor:pointer;touch-action:manipulation}
.cch-in{position:relative;width:100%;height:100%;transition:transform .4s cubic-bezier(.3,1.5,.5,1)}
.cch-piece:hover .cch-in{transform:translateY(calc(-5 * var(--u))) rotate(-1.2deg)}
.cch-piece:focus-visible .cch-in{outline:2px dashed var(--cch-at);outline-offset:6px}
.cch-held{cursor:grabbing}
.cch-held .cch-in,.cch-held:hover .cch-in{transform:scale(1.05) rotate(-2deg);filter:drop-shadow(0 calc(16 * var(--u)) calc(12 * var(--u)) rgba(8,12,40,.3))}
.cch-settle .cch-piece{transition:transform .75s cubic-bezier(.3,1.3,.5,1)}
.cch-intro .cch-in{animation:cch-drop .9s cubic-bezier(.2,.9,.3,1.18) backwards;animation-delay:calc(var(--i) * 120ms + 300ms)}

.cch-flip{position:relative;width:100%;height:100%;transform-style:preserve-3d;transition:transform .8s cubic-bezier(.3,1.25,.5,1)}
.cch-flipped .cch-flip{transform:rotateY(180deg)}
.cch-face{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden}
.cch-back{transform:rotateY(180deg);background:var(--cch-white);box-shadow:inset 0 0 0 1.5px var(--cch-line);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8%;padding:12%;text-align:center;color:#14151b}
.cch-back b{font-family:var(--cch-geo);font-weight:500;font-size:max(8px,calc(11 * var(--u)));letter-spacing:.18em;color:var(--cch-a)}
.cch-back span{font-family:"Bradley Hand","Segoe Print","Klee","Comic Sans MS",var(--cch-sans);font-size:max(10px,calc(17 * var(--u)));line-height:1.35;transform:rotate(-4deg)}
.cch-back i{display:grid;place-items:center;width:calc(46 * var(--u));height:calc(46 * var(--u));border:1.5px solid var(--cch-a);border-radius:50%;color:var(--cch-a);font:500 max(9px,calc(14 * var(--u)))/1 var(--cch-geo);font-style:normal;transform:rotate(12deg)}
.cch-spin{width:100%;height:100%;transition:transform 1.5s cubic-bezier(.15,.9,.2,1)}
.cch-drift{transition:transform 5s cubic-bezier(.2,.7,.3,1)}
.cch-p-photo:hover .cch-drift{transform:translateX(-22px)}
.cch-flash{position:absolute;inset:0;background:#fff;pointer-events:none;animation:cch-flash .7s ease-out forwards}
.cch-crunch{animation:cch-crunch .32s ease-out}
.cch-popbody{transition:opacity .35s,transform .45s cubic-bezier(.5,0,.8,.4);transform-box:fill-box;transform-origin:50% 100%}
.cch-gone{opacity:0;transform:translateY(-14%) scale(.92)}
.cch-drip{animation:cch-drip 3.4s ease-in infinite;transform-box:fill-box;transform-origin:50% 0;animation-delay:var(--t)}
.cch-win{animation:cch-win .9s cubic-bezier(.2,.9,.3,1.3) backwards}
.cch-toss{width:100%;height:100%;animation:cch-toss .9s cubic-bezier(.3,0,.4,1)}
.cch-turn{width:100%;height:100%;transition:transform .5s cubic-bezier(.3,1.4,.5,1) .55s}
.cch-tag{position:absolute;left:2%;bottom:-8%;padding:.35em .7em;background:#fff;color:#14151b;box-shadow:inset 0 0 0 1px #14151b,3px 3px 0 var(--cch-a);font:600 max(10px,calc(13 * var(--u)))/1.2 var(--cch-sans);white-space:nowrap;transform:rotate(-40deg);transform-origin:0 50%;animation:cch-stick .5s cubic-bezier(.3,1.5,.5,1) 1s backwards;pointer-events:none}
.cch-tag small{font:500 .7em/1 var(--cch-geo);letter-spacing:.12em;text-transform:uppercase;margin-left:.6em;color:var(--cch-a)}
.cch-clack{animation:cch-clack .5s ease-out}
.cch-pulse{transform-box:fill-box;transform-origin:center;animation:cch-pulse 4.5s ease-in-out infinite}
.cch-flare{animation:cch-flare .9s cubic-bezier(.2,.9,.3,1.2)}

.cch-sp{position:absolute;left:calc(var(--x) * var(--u));top:calc(var(--y) * var(--u));width:calc(var(--s) * 2 * var(--u));height:calc(var(--s) * 2 * var(--u));transform:translate(-50%,-50%) translate(calc(var(--cch-px) * 22 * var(--u)),calc(var(--cch-py) * 22 * var(--u)))}
.cch-sp path,.cch-sp circle{fill:var(--cch-p);stroke:var(--cch-deco);stroke-width:1.4;vector-effect:non-scaling-stroke}
.cch-sp-light path{fill:#fff;stroke:none}
.cch-tw{width:100%;height:100%;animation:cch-tw 3.8s ease-in-out infinite;animation-delay:var(--t)}
.cch-intro .cch-sp{animation:cch-fade 1s ease-out 1.2s backwards}

.cch-num{position:absolute;left:calc(708 * var(--u));top:calc(548 * var(--u));z-index:40;display:flex;flex-direction:column;align-items:flex-start;pointer-events:auto;color:#fff;transform:translate(calc(var(--cch-px) * 8 * var(--u)),calc(var(--cch-py) * 8 * var(--u)))}
.cch-numb{display:block;font:500 max(30px,calc(68 * var(--u)))/1 var(--cch-geo);letter-spacing:-.02em;color:#fff;perspective:400px}
.cch-numb span{display:inline-block}
.cch-anim .cch-numb span{animation:cch-digit .7s cubic-bezier(.3,1.4,.5,1) backwards;animation-delay:calc(var(--i) * 70ms)}
.cch-numb:focus-visible,.cch-arrow:focus-visible,.cch-dot:focus-visible{outline:2px solid #fff;outline-offset:3px;border-radius:6px}
.cch-nav{display:flex;align-items:center;gap:2px;margin-top:calc(8 * var(--u));margin-left:-4px}
.cch-arrow{display:grid;place-items:center;width:24px;height:24px;border-radius:50%;color:#fff;font:14px/1 var(--cch-geo);opacity:.7;transition:opacity .2s,background .2s}
.cch-arrow:hover{opacity:1;background:rgba(255,255,255,.14)}
.cch-dot{display:grid;place-items:center;width:20px;height:24px}
.cch-dot::before{content:"";display:block;width:6px;height:6px;border-radius:3px;background:rgba(255,255,255,.42);transition:width .3s,background .3s}
.cch-dot[aria-current="true"]::before{width:16px;background:#fff}

.cch-copy{position:absolute;left:calc(62 * var(--u));top:calc(56 * var(--u));bottom:calc(58 * var(--u));width:calc(330 * var(--u));min-width:180px;display:flex;flex-direction:column;justify-content:space-between;z-index:30}
.cch-kicker{font:500 max(10px,calc(11 * var(--u)))/1.36 var(--cch-geo);letter-spacing:.01em}
.cch-kicker>span{display:block}
.cch-em{color:var(--cch-at)}
.cch-mid{display:flex;flex-direction:column;align-items:flex-start}
.cch-title{margin-left:calc(12 * var(--u));font-family:var(--cch-serif);font-weight:800;font-size:max(30px,calc(62 * var(--u)));line-height:1.13;letter-spacing:-.05em;text-shadow:calc(var(--cch-px) * -3px) calc(var(--cch-py) * -2px) 0 color-mix(in srgb,var(--cch-a) 26%,transparent)}
.cch-tl{display:block;transform:skewX(-9deg);transform-origin:0 100%;white-space:nowrap}
.cch-title .cch-em{display:inline-block;font-size:1.12em;line-height:1;transform:translateY(.03em)}
.cch-tick{display:block;width:1px;height:calc(26 * var(--u));background:currentColor;margin:calc(30 * var(--u)) 0 calc(16 * var(--u)) calc(148 * var(--u))}
.cch-body{align-self:stretch;text-align:center;font-size:max(11px,calc(12.5 * var(--u)));font-weight:500;line-height:1.9;letter-spacing:.06em}
.cch-body>span{display:block}
.cch-cta{align-self:center;display:inline-flex;align-items:center;gap:.6em;margin-top:calc(22 * var(--u));padding:.6em 1.1em;border-radius:999px;background:var(--cch-ink);color:var(--cch-p);font:500 max(11px,calc(12 * var(--u)))/1 var(--cch-geo);letter-spacing:.1em;text-transform:uppercase;text-decoration:none;box-shadow:3px 3px 0 var(--cch-a);transition:transform .2s,box-shadow .2s}
.cch-cta:hover{transform:translate(-2px,-2px);box-shadow:5px 5px 0 var(--cch-a)}
.cch-cta:focus-visible{outline:2px dashed var(--cch-at);outline-offset:4px}
.cch-anim .cch-ln{animation:cch-wipe .9s cubic-bezier(.7,0,.2,1) backwards;animation-delay:calc(var(--i) * 90ms + var(--o,0ms))}
.cch-anim .cch-title{animation:cch-mis 1.2s ease-out backwards}
.cch-foot{display:flex;align-items:flex-end;gap:calc(16 * var(--u));min-height:24px}
.cch-code{position:relative;display:block;flex:none;width:max(56px,calc(74 * var(--u)));height:max(22px,calc(30 * var(--u)))}
.cch-code rect{fill:currentColor}
.cch-scan{position:absolute;left:-4px;right:-4px;top:0;height:2px;background:var(--cch-a);opacity:0;pointer-events:none}
.cch-code:hover .cch-scan{animation:cch-scan .9s ease-in-out infinite alternate}
.cch-hint{font:500 max(8.5px,calc(9 * var(--u)))/1.5 var(--cch-geo);letter-spacing:.14em;text-transform:uppercase;opacity:.55;max-width:max(120px,calc(150 * var(--u)))}
.cch-tidy{padding:.55em 1em;border-radius:999px;background:var(--cch-ink);color:var(--cch-p);font:500 max(10px,calc(10.5 * var(--u)))/1 var(--cch-geo);letter-spacing:.12em;text-transform:uppercase;box-shadow:2px 2px 0 var(--cch-a);animation:cch-stick .4s cubic-bezier(.3,1.5,.5,1) backwards}
.cch-root .cch-tidy{background:var(--cch-ink);color:var(--cch-p)}
.cch-tidy:focus-visible{outline:2px dashed var(--cch-at);outline-offset:3px}

.cch-stamp{position:absolute;width:var(--s);height:var(--s);transform:translate(-50%,-50%) rotate(var(--rot));pointer-events:none;animation:cch-pop .45s cubic-bezier(.3,1.6,.5,1) backwards}
.cch-stamp path{fill:var(--cch-p);stroke:var(--cch-deco);stroke-width:1.3;vector-effect:non-scaling-stroke}
.cch-stamp-a path{fill:var(--cch-a);stroke:none}
.cch-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}

@container cch (orientation: portrait){
.cch-frame{--u:min(calc(100cqw / 690),calc(50cqh / 675));--sr:min(calc(-34 * var(--u)),calc(100cqw - 818 * var(--u) - 6px))}
.cch-stage{top:auto;bottom:0;right:var(--sr);transform:none}
.cch-copy{left:22px;right:22px;top:max(22px,4cqh);bottom:auto;width:auto;justify-content:flex-start;gap:clamp(14px,3cqh,30px)}
.cch-kicker{font-size:12px}
.cch-title{font-size:clamp(30px,12.5cqw,66px);margin-left:4px}
.cch-num{top:auto;bottom:10px;left:auto;right:calc(12px - var(--sr));align-items:flex-end}
.cch-nav{margin-right:-4px}
.cch-tick{display:none}
.cch-mid{gap:14px}
.cch-body{text-align:left;font-size:clamp(13px,3.6cqw,16px);line-height:1.8}
.cch-cta{align-self:flex-start;margin-top:0}
.cch-hint{max-width:none}
.cch-side{display:none}
}

@keyframes cch-drop{0%{opacity:0;transform:translateY(calc(-40 * var(--u))) scale(1.2) rotate(-8deg)}55%{opacity:1}100%{opacity:1;transform:none}}
@keyframes cch-rise{from{opacity:0;transform:translate(-38%,-50%) scale(.9)}}
@keyframes cch-draw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}
@keyframes cch-turn{to{transform:rotate(360deg)}}
@keyframes cch-fade{from{opacity:0;scale:.4}}
@keyframes cch-tw{0%,100%{transform:scale(1) rotate(0)}50%{transform:scale(.7) rotate(14deg)}}
@keyframes cch-wipe{from{clip-path:inset(-30% 100% -30% -14%);opacity:.3}to{clip-path:inset(-30% -14% -30% -14%);opacity:1}}
@keyframes cch-mis{from{text-shadow:12px 0 0 color-mix(in srgb,var(--cch-a) 55%,transparent)}}
@keyframes cch-digit{from{opacity:0;transform:translateY(45%) rotateX(80deg)}}
@keyframes cch-flash{from{opacity:.95}to{opacity:0}}
@keyframes cch-crunch{30%{transform:translate(-3%,1%) rotate(-3deg)}60%{transform:translate(2%,-1%) rotate(2deg)}}
@keyframes cch-drip{0%{transform:scaleY(.15);opacity:0}15%{opacity:1}65%{transform:scaleY(1)}80%{transform:translateY(30%) scaleY(1.1);opacity:1}100%{transform:translateY(190%) scaleY(.8);opacity:0}}
@keyframes cch-win{from{opacity:0;transform:scale(.4)}}
@keyframes cch-toss{0%{transform:none}45%{transform:translateY(-38%) rotate(300deg) scale(1.08)}75%{transform:translateY(4%) rotate(520deg)}100%{transform:none}}
@keyframes cch-stick{from{opacity:0;scale:.6}}
@keyframes cch-clack{20%{transform:rotate(-7deg)}45%{transform:rotate(5deg)}70%{transform:rotate(-2deg)}}
@keyframes cch-pulse{0%,100%{transform:scale(1)}50%{transform:scale(.9) rotate(4deg)}}
@keyframes cch-flare{0%{transform:scale(1)}35%{transform:scale(1.45) rotate(30deg)}100%{transform:scale(1) rotate(45deg)}}
@keyframes cch-scan{from{top:0;opacity:1}to{top:100%;opacity:1}}
@keyframes cch-pop{from{opacity:0;transform:translate(-50%,-50%) rotate(var(--rot)) scale(0)}}

@media (prefers-reduced-motion:reduce){
.cch-root *,.cch-root *::before{animation:none!important;transition:none!important}
}
`

/* -------------------------------------------------------------------- art */

type Ids = { id: (k: string) => string; u: (k: string) => string }

function Emph({ text }: { text: string }) {
  return (
    <>
      {parseEmphasis(text).map((p, i) =>
        p.em ? (
          <span key={i} className="cch-em">
            {p.text}
          </span>
        ) : (
          <React.Fragment key={i}>{p.text}</React.Fragment>
        )
      )}
    </>
  )
}

function Defs({ id, u }: Ids) {
  const mix = (pct: number, other: string) => ({ stopColor: "color-mix(in srgb,var(--cch-a) " + pct + "%," + other + ")" })
  return (
    <svg className="cch-defs" aria-hidden="true" focusable="false">
      <defs>
        <pattern id={id("dA")} width="4.4" height="4.4" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
          <circle cx="2.2" cy="2.2" r="1.2" className="cch-fa" />
        </pattern>
        <pattern id={id("dW")} width="4.4" height="4.4" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
          <circle cx="2.2" cy="2.2" r="1.15" className="cch-fw" />
        </pattern>
        <pattern id={id("dK")} width="4.4" height="4.4" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
          <circle cx="2.2" cy="2.2" r="1.25" className="cch-fn" />
        </pattern>
        <linearGradient id={id("fadeY")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.2" stopColor="#000" />
          <stop offset="1" stopColor="#fff" />
        </linearGradient>
        <mask id={id("shade")} maskContentUnits="objectBoundingBox">
          <rect width="1" height="1" fill={u("fadeY")} />
        </mask>
        <filter id={id("fluff")} x="-15%" y="-15%" width="130%" height="130%">
          <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="3" seed="3" result="t" />
          <feDisplacementMap in="SourceGraphic" in2="t" scale="13" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <linearGradient id={id("sky-day")} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" style={mix(88, "#06070d")} />
          <stop offset="0.6" style={mix(100, "#fff")} />
          <stop offset="1" style={mix(55, "#fff")} />
        </linearGradient>
        <linearGradient id={id("sky-dusk")} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" style={mix(100, "#fff")} />
          <stop offset="0.55" style={mix(45, "#fff")} />
          <stop offset="1" style={mix(12, "#fff")} />
        </linearGradient>
        <linearGradient id={id("sky-night")} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor="#06070d" />
          <stop offset="0.6" style={mix(45, "#06070d")} />
          <stop offset="1" style={mix(75, "#06070d")} />
        </linearGradient>
      </defs>
    </svg>
  )
}

function Clouds({ puffs, sky, u }: { puffs: Puff[]; sky: CollageSky; u: (k: string) => string }) {
  const fill = sky === "night" ? "cch-fc" : "cch-fw"
  return (
    <g filter={u("fluff")}>
      {puffs.map((p, i) => (
        <circle key={"a" + i} cx={p.cx} cy={p.cy} r={p.r} className={fill} />
      ))}
      <g fill={u("dA")} opacity={sky === "night" ? 0.55 : 0.85}>
        {puffs.map((p, i) => (
          <circle key={"b" + i} cx={r1(p.cx + p.r * 0.34)} cy={r1(p.cy + p.r * 0.34)} r={r1(p.r * 0.62)} />
        ))}
      </g>
      {puffs.map((p, i) => (
        <circle key={"c" + i} cx={r1(p.cx - p.r * 0.16)} cy={r1(p.cy - p.r * 0.22)} r={r1(p.r * 0.52)} className={fill} />
      ))}
    </g>
  )
}

function SkyExtras({ sky, seed, w, h }: { sky: CollageSky; seed: number; w: number; h: number }) {
  if (sky === "dusk") return <circle cx={w * 0.26} cy={h * 0.44} r={h * 0.2} className="cch-fw" opacity="0.92" />
  if (sky !== "night") return null
  const rnd = mulberry32(seed + 99)
  const stars = Array.from({ length: 34 }, () => ({ x: r1(rnd() * w), y: r1(rnd() * h * 0.6), r: r1(0.5 + rnd() * rnd() * 2) }))
  return (
    <g>
      {stars.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r} className="cch-fw" />
      ))}
      <path d={"M" + r1(w * 0.2) + " " + r1(h * 0.14) + "a" + r1(h * 0.1) + " " + r1(h * 0.1) + " 0 1 0 " + r1(h * 0.13) + " " + r1(h * 0.15) + "a" + r1(h * 0.08) + " " + r1(h * 0.08) + " 0 1 1 " + r1(-h * 0.13) + " " + r1(-h * 0.15) + "Z"} className="cch-fw" />
    </g>
  )
}

function Photo({ ids, seed, sky, shot }: { ids: Ids; seed: number; sky: CollageSky; shot: number }) {
  const { id, u } = ids
  const s = seed * 13 + shot * 97
  const main = React.useMemo(() => cloudBank(s, 310, 376, 400, 250, 40), [s])
  const far = React.useMemo(() => cloudBank(s + 5, 96, 300, 150, 70, 12), [s])
  return (
    <svg className="cch-svg" viewBox="0 0 520 380" aria-hidden="true">
      <defs>
        <clipPath id={id("cb")}>
          <rect x="14" y="14" width="492" height="352" />
        </clipPath>
      </defs>
      <rect x="0.75" y="0.75" width="518.5" height="378.5" className="cch-fw cch-sk" strokeWidth="1.5" />
      <g clipPath={u("cb")}>
        <rect x="14" y="14" width="492" height="352" fill={u("sky-" + sky)} />
        <SkyExtras sky={sky} seed={s} w={520} h={380} />
        <g className="cch-drift">
          <Clouds puffs={far} sky={sky} u={u} />
          <Clouds puffs={main} sky={sky} u={u} />
        </g>
        <rect x="14" y="14" width="492" height="352" fill={u("dW")} opacity="0.12" />
      </g>
      <rect x="14" y="14" width="492" height="352" className="cch-o" strokeWidth="1" />
    </svg>
  )
}

function Snapshot({ ids, seed, sky }: { ids: Ids; seed: number; sky: CollageSky }) {
  const { id, u } = ids
  const tower = React.useMemo(() => cloudBank(seed * 7 + 3, 98, 262, 120, 220, 24), [seed])
  return (
    <svg className="cch-svg" viewBox="0 0 190 250" aria-hidden="true">
      <defs>
        <clipPath id={id("cp")}>
          <rect x="13" y="13" width="164" height="224" />
        </clipPath>
      </defs>
      <rect x="0.75" y="0.75" width="188.5" height="248.5" className="cch-fw cch-sk" strokeWidth="1.5" />
      <g clipPath={u("cp")}>
        <rect x="13" y="13" width="164" height="224" fill={u("sky-" + sky)} />
        <SkyExtras sky={sky} seed={seed + 3} w={190} h={250} />
        <Clouds puffs={tower} sky={sky} u={u} />
      </g>
      <rect x="13" y="13" width="164" height="224" className="cch-o" strokeWidth="1" />
    </svg>
  )
}

const PETALS_BACK = Array.from({ length: 18 }, (_, i) => i * 20 + 10)
const PETALS_FRONT = Array.from({ length: 16 }, (_, i) => i * 22.5)

function Sunflower({ u }: { u: (k: string) => string }) {
  const back = petalPath(30, 84, 15)
  const front = petalPath(36, 76, 16)
  return (
    <svg className="cch-svg" viewBox="-120 -120 240 240" aria-hidden="true">
      {PETALS_BACK.map((a) => (
        <g key={"b" + a} transform={"rotate(" + a + ")"}>
          <path d={back} className="cch-fw cch-sk" strokeWidth="1" />
          <path d={back} fill={u("dA")} opacity="0.9" />
        </g>
      ))}
      {PETALS_FRONT.map((a) => (
        <g key={"f" + a} transform={"rotate(" + a + ")"}>
          <path d={front} className="cch-fw cch-sk" strokeWidth="1.1" />
          <path d="M0 -44V-82" className="cch-o" strokeWidth="0.8" opacity="0.5" />
        </g>
      ))}
      <circle r="44" className="cch-fa" />
      <circle r="44" fill={u("dK")} opacity="0.35" />
      <circle r="30" fill="none" stroke="#fff" strokeWidth="1.4" strokeDasharray="1.5 4.5" opacity="0.7" />
      <circle r="17" className="cch-fa" />
      <circle r="44" className="cch-o" strokeWidth="1.2" />
    </svg>
  )
}

const POP_BODY = "M-56 80V-100A56 56 0 0 1 56 -100V80Q56 92 44 92H-44Q-56 92 -56 80Z"

function Popsicle({ ids, bites }: { ids: Ids; bites: number }) {
  const { id, u } = ids
  const win = bites > BITES.length
  return (
    <svg className="cch-svg" viewBox="-70 -160 140 380" aria-hidden="true">
      <defs>
        <mask id={id("bite")} maskUnits="userSpaceOnUse" x="-70" y="-170" width="140" height="390">
          <rect x="-70" y="-170" width="140" height="390" fill="#fff" />
          {BITES.slice(0, Math.min(bites, BITES.length)).map((b, i) => (
            <g key={i}>
              <circle cx={b.cx} cy={b.cy} r={b.r} fill="#000" />
              <circle cx={b.cx - b.r * 0.7} cy={b.cy + b.r * 0.62} r={b.r * 0.22} fill="#000" />
              <circle cx={b.cx + b.r * 0.72} cy={b.cy + b.r * 0.6} r={b.r * 0.2} fill="#000" />
            </g>
          ))}
        </mask>
        <clipPath id={id("pop")}>
          <path d={POP_BODY} />
        </clipPath>
      </defs>
      <rect x="-13" y="56" width="26" height="156" rx="13" className="cch-fw cch-sk" strokeWidth="1.4" />
      {win && (
        <g className="cch-win">
          <text x="0" y="104" textAnchor="middle" className="cch-fa" style={{ writingMode: "vertical-rl", font: "700 17px var(--cch-sans)", letterSpacing: "2px" }}>
            あたり
          </text>
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
            <path key={a} d="M0 -20V-34" transform={"translate(0 118) rotate(" + a + ")"} stroke="var(--cch-a)" strokeWidth="2.4" strokeLinecap="round" />
          ))}
        </g>
      )}
      <g mask={u("bite")}>
        <g className={"cch-popbody" + (win ? " cch-gone" : "")}>
          <path d={POP_BODY} className="cch-fa" />
          <g clipPath={u("pop")}>
            <rect x="24" y="-160" width="40" height="260" fill={u("dK")} opacity="0.4" />
            <rect x="-42" y="-128" width="20" height="176" rx="10" fill={u("dW")} />
            <path d="M-8 -60c6-4 12 0 10 6s-12 4-10-6zM16 -12c5-2 8 2 6 6s-9 1-6-6zM-20 30c4-3 9 0 7 5s-9 2-7-5zM20 50c3-2 7 1 5 4s-7 1-5-4z" className="cch-fw" opacity="0.85" />
          </g>
          {!win && (
            <>
              <path d="M-34 88q5 20 0 26q-5-6 0-26z" className="cch-fa cch-drip" style={{ ["--t" as string]: "0s" } as React.CSSProperties} />
              <path d="M30 88q4 16 0 21q-4-5 0-21z" className="cch-fa cch-drip" style={{ ["--t" as string]: "1.7s" } as React.CSSProperties} />
            </>
          )}
        </g>
      </g>
    </svg>
  )
}

const SOLE = "M-122 2C-124 -34 -96 -50 -50 -46C-12 -43 22 -58 70 -56C108 -54 126 -30 124 0C122 32 104 54 70 54C24 54 -8 40 -48 46C-94 52 -120 38 -122 2Z"
const STRAP = "M-6 -46Q40 -38 68 0Q40 38 -6 48"

function Sandal({ u }: { u: (k: string) => string }) {
  return (
    <svg className="cch-svg" viewBox="-130 -100 260 200" aria-hidden="true">
      <path d={SOLE} transform="translate(5 9)" className="cch-fk" opacity="0.9" />
      <path d={SOLE} className="cch-fw cch-sk" strokeWidth="1.6" />
      <path d={SOLE} fill={u("dA")} mask={u("shade")} />
      <path d={SOLE} transform="scale(.88)" className="cch-o" strokeWidth="0.9" opacity="0.55" />
      <path d={STRAP} className="cch-o" strokeWidth="17" />
      <path d={STRAP} fill="none" stroke="var(--cch-white)" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
      <path d={STRAP} fill="none" stroke={u("dA")} strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
      <circle cx="68" cy="0" r="7" className="cch-fa cch-sk" strokeWidth="1.4" />
    </svg>
  )
}

function Bars({ u }: { u: (k: string) => string }) {
  return (
    <svg className="cch-svg" viewBox="-125 -38 250 76" aria-hidden="true">
      <rect x="-120" y="-34" width="240" height="28" rx="14" className="cch-fw cch-sk" strokeWidth="1.6" />
      <rect x="-112" y="-18" width="224" height="9" rx="4.5" fill={u("dA")} opacity="0.75" />
      <rect x="-96" y="5" width="216" height="28" rx="14" className="cch-fw cch-sk" strokeWidth="1.6" />
      <rect x="-88" y="21" width="200" height="9" rx="4.5" fill={u("dA")} opacity="0.75" />
    </svg>
  )
}

function Star() {
  return (
    <svg className="cch-svg" viewBox="-125 -125 250 250" aria-hidden="true">
      <g className="cch-pulse">
        <path d={starburst(0, 0, 122, 72, 8)} fill="#fff" />
        <circle r="7" fill="#fff" />
      </g>
    </svg>
  )
}

function Planet({ ids, seed }: { ids: Ids; seed: number }) {
  const { id, u } = ids
  const specks = React.useMemo(() => {
    const rnd = mulberry32(seed * 5 + 11)
    return Array.from({ length: 46 }, () => ({ x: r1(rnd() * 400), y: r1(rnd() * 400), r: r1(0.6 + rnd() * rnd() * 2.6) }))
  }, [seed])
  return (
    <div className="cch-planet" aria-hidden="true">
      <svg className="cch-svg cch-ptex" viewBox="0 0 400 400" preserveAspectRatio="none">
        <defs>
          <filter id={id("blot")} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.011 0.017" numOctaves="5" seed={seed % 97} result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  14 0 0 0 -6.6" result="m" />
            <feFlood style={{ floodColor: "var(--cch-a)" }} />
            <feComposite in2="m" operator="in" />
          </filter>
          <filter id={id("fleck")} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" seed={(seed % 97) + 4} result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 26 0 -16.6" />
          </filter>
        </defs>
        <rect width="400" height="400" filter={u("blot")} />
        <rect width="400" height="400" filter={u("fleck")} opacity="0.35" />
        {specks.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#fff" opacity="0.8" />
        ))}
      </svg>
      <div className="cch-pshade" />
    </div>
  )
}

function Orbit({ reduced }: { reduced: boolean }) {
  const d = ellipsePath(258, 330, 384, 168, 64)
  return (
    <svg className="cch-svg cch-orbit" viewBox="0 0 840 675" aria-hidden="true">
      <path d={d} pathLength={1} />
      <circle r="5.5" className="cch-fa">
        {!reduced && <animateMotion dur="26s" repeatCount="indefinite" path={d} />}
      </circle>
    </svg>
  )
}

function Sparkle({ x, y, s, t, light, side }: { x: number; y: number; s: number; t: number; light?: boolean; side?: boolean }) {
  const style = { ["--x" as string]: x, ["--y" as string]: y, ["--s" as string]: s, ["--t" as string]: t + "s" } as React.CSSProperties
  return (
    <span className={"cch-sp" + (light ? " cch-sp-light" : "") + (side ? " cch-side" : "")} style={style} aria-hidden="true">
      <svg className="cch-svg cch-tw" viewBox="-50 -50 100 100">
        <path d={sparklePath(0, 0, 48)} />
      </svg>
    </span>
  )
}

function Ring({ x, y, r, side }: { x: number; y: number; r: number; side?: boolean }) {
  const style = { ["--x" as string]: x, ["--y" as string]: y, ["--s" as string]: r } as React.CSSProperties
  return (
    <span className={"cch-sp" + (side ? " cch-side" : "")} style={style} aria-hidden="true">
      <svg className="cch-svg" viewBox="-10 -10 20 20">
        <circle r="8.5" />
      </svg>
    </span>
  )
}

function Barcode({ code }: { code: string }) {
  const bars = React.useMemo(() => barcodeBars(code, 74), [code])
  return (
    <span className="cch-code" role="img" aria-label={"Barcode " + code}>
      <svg className="cch-svg" viewBox="0 0 74 30" preserveAspectRatio="none" aria-hidden="true">
        {bars.map((b, i) => (
          <rect key={i} x={b.x} y="0" width={b.w} height="30" />
        ))}
      </svg>
      <span className="cch-scan" />
    </span>
  )
}

/* -------------------------------------------------------------- component */

type Offset = { x: number; y: number }
type Grab = { key: string; el: HTMLElement; id: number; sx: number; sy: number; ox: number; oy: number; moved: boolean }
type Stamp = { id: number; x: number; y: number; s: number; rot: number; fill: boolean }

export default function CyanotypeCollageHero({
  chapters = DEFAULT_CHAPTERS,
  initialChapter = 0,
  autoplay = 0,
  onChapterChange,
  action,
  barcode = "SCN 4 901 2026",
  hint = DEFAULT_HINT,
  lang = "ja",
  palette = "cobalt",
  accent,
  paper,
  theme = "auto",
  draggable = true,
  stamps = true,
  intro = true,
  height = "100svh",
  className = "",
}: CyanotypeCollageHeroProps) {
  const uid = React.useId().replace(/[^a-zA-Z0-9_-]/g, "")
  const ids: Ids = {
    id: (k: string) => uid + "-" + k,
    u: (k: string) => "url(#" + uid + "-" + k + ")",
  }
  const list = chapters.length ? chapters : DEFAULT_CHAPTERS
  const root = React.useRef(null as HTMLElement | null)
  const els = React.useRef({} as { [k: string]: HTMLDivElement | null })
  const offsets = React.useRef({} as { [k: string]: Offset })
  const grab = React.useRef(null as Grab | null)
  const zTop = React.useRef(10)
  const hovering = React.useRef(false)
  const stampSeq = React.useRef(0)
  const lastCh = React.useRef(-1)

  const [reduced, setReduced] = React.useState(false)
  const [ch, setCh] = React.useState(() => wrap(initialChapter, list.length))
  const [swapped, setSwapped] = React.useState(false)
  const [messy, setMessy] = React.useState(false)
  const [settling, setSettling] = React.useState(false)
  const [marks, setMarks] = React.useState([] as Stamp[])
  const [say, setSay] = React.useState("")
  const [shot, setShot] = React.useState(0)
  const [flipped, setFlipped] = React.useState(false)
  const [spins, setSpins] = React.useState(0)
  const [bites, setBites] = React.useState(0)
  const [toss, setToss] = React.useState(0)
  const [clack, setClack] = React.useState(0)
  const [flare, setFlare] = React.useState(0)

  const cur = wrap(ch, list.length)
  const base = DEFAULT_CHAPTERS[cur % DEFAULT_CHAPTERS.length]
  const chapter = list[cur] || base
  const number = chapter.number ?? String(cur + 1).padStart(2, "0")
  const kicker = chapter.kicker ?? ""
  const title = chapter.title ?? ""
  const body = chapter.body ?? ""
  const caption = chapter.caption ?? ""
  const sky = skyOf(chapter.sky)
  const seed = chapter.seed ?? cur * 11 + 6
  const colors = paletteColors(palette, accent, paper)
  const weather = WEATHER[forecast(seed, toss)]

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const on = () => setReduced(mq.matches)
    on()
    mq.addEventListener?.("change", on)
    return () => mq.removeEventListener?.("change", on)
  }, [])

  // The collage leans with the pointer. Written straight to CSS variables, so
  // nothing re-renders while it eases.
  React.useEffect(() => {
    const el = root.current
    if (!el || reduced || !window.matchMedia("(pointer: fine)").matches) return
    let tx = 0
    let ty = 0
    let x = 0
    let y = 0
    let raf = 0
    const tick = () => {
      x += (tx - x) * 0.08
      y += (ty - y) * 0.08
      el.style.setProperty("--cch-px", x.toFixed(4))
      el.style.setProperty("--cch-py", y.toFixed(4))
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.002 ? requestAnimationFrame(tick) : 0
    }
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(tick)
    }
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      tx = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1)
      ty = clamp(((e.clientY - r.top) / r.height) * 2 - 1, -1, 1)
      kick()
    }
    const leave = () => {
      tx = 0
      ty = 0
      kick()
    }
    el.addEventListener("pointermove", move)
    el.addEventListener("pointerleave", leave)
    return () => {
      el.removeEventListener("pointermove", move)
      el.removeEventListener("pointerleave", leave)
      cancelAnimationFrame(raf)
      el.style.setProperty("--cch-px", "0")
      el.style.setProperty("--cch-py", "0")
    }
  }, [reduced])

  React.useEffect(() => {
    if (!autoplay || reduced || list.length < 2) return
    const t = window.setInterval(() => {
      if (!hovering.current && !grab.current) setCh((c) => wrap(c + 1, list.length))
    }, Math.max(2500, autoplay))
    return () => window.clearInterval(t)
  }, [autoplay, reduced, list.length])

  React.useEffect(() => {
    if (lastCh.current === -1) {
      lastCh.current = cur
      return
    }
    if (lastCh.current === cur) return
    lastCh.current = cur
    setSwapped(true)
    setShot(0)
    setSay("File " + number + ": " + plain(title))
    onChapterChange?.(cur)
    // onChapterChange is the host's; re-running on its identity would re-announce.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cur])

  React.useEffect(() => {
    if (!settling) return
    const t = window.setTimeout(() => setSettling(false), 800)
    return () => window.clearTimeout(t)
  }, [settling])

  const go = (n: number) => setCh(wrap(n, list.length))

  const place = (key: string, x: number, y: number) => {
    const el = els.current[key]
    offsets.current[key] = { x, y }
    if (!el) return
    el.style.setProperty("--dx", x + "px")
    el.style.setProperty("--dy", y + "px")
  }

  const raise = (key: string) => {
    const el = els.current[key]
    if (el) el.style.zIndex = String(++zTop.current)
  }

  const act = (key: string) => {
    if (key === "photo") {
      setShot((s) => s + 1)
      setSay("Took another photograph of the sky.")
    } else if (key === "polaroid") {
      setFlipped((f) => !f)
      setSay(flipped ? "Turned the snapshot face up." : "On the back: " + plain(caption))
    } else if (key === "sunflower") {
      setSpins((s) => s + 1)
      setSay("The sunflower spins.")
    } else if (key === "popsicle") {
      const next = bites > BITES.length ? 0 : bites + 1
      setBites(next)
      setSay(next > BITES.length ? "あたり — a winning stick!" : next === 0 ? "A fresh ice pop." : "Bite " + next + " of " + (BITES.length + 1) + ".")
    } else if (key === "sandal") {
      const t = toss + 1
      const w = WEATHER[forecast(seed, t)]
      setToss(t)
      setSay("Tomorrow's forecast: " + w.en + " (" + w.jp + ").")
    } else if (key === "bars") {
      setClack((c) => c + 1)
    } else if (key === "star") {
      setFlare((f) => f + 1)
    }
  }

  const down = (e: React.PointerEvent<HTMLDivElement>, key: string) => {
    if (e.button !== 0) return
    e.stopPropagation()
    const el = e.currentTarget
    const o = offsets.current[key] || { x: 0, y: 0 }
    try {
      el.setPointerCapture(e.pointerId)
    } catch {
      /* capture is a nicety */
    }
    grab.current = { key, el, id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: o.x, oy: o.y, moved: false }
  }

  const move = (e: React.PointerEvent<HTMLDivElement>) => {
    const g = grab.current
    if (!g || g.id !== e.pointerId || !draggable) return
    const dx = e.clientX - g.sx
    const dy = e.clientY - g.sy
    if (!g.moved) {
      if (isTap(dx, dy)) return
      g.moved = true
      g.el.classList.add("cch-held")
      raise(g.key)
    }
    place(g.key, g.ox + dx, g.oy + dy)
  }

  const up = (e: React.PointerEvent<HTMLDivElement>) => {
    const g = grab.current
    if (!g || g.id !== e.pointerId) return
    grab.current = null
    g.el.classList.remove("cch-held")
    if (g.moved) setMessy(true)
    else act(g.key)
  }

  const cancel = () => {
    const g = grab.current
    grab.current = null
    if (g) g.el.classList.remove("cch-held")
  }

  const keyPiece = (e: React.KeyboardEvent<HTMLDivElement>, key: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      act(key)
      return
    }
    if (!draggable) return
    const n = nudge(e.key, e.shiftKey)
    if (!n) return
    e.preventDefault()
    const o = offsets.current[key] || { x: 0, y: 0 }
    raise(key)
    place(key, o.x + n[0], o.y + n[1])
    setMessy(true)
  }

  const stamp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!stamps || e.button !== 0 || !root.current) return
    const r = root.current.getBoundingClientRect()
    const n = ++stampSeq.current
    const rnd = mulberry32(n * 9973 + seed)
    const mark = { id: n, x: e.clientX - r.left, y: e.clientY - r.top, s: 18 + rnd() * 30, rot: rnd() * 40 - 20, fill: rnd() < 0.3 }
    setMarks((m) => [...m.slice(-13), mark])
    setMessy(true)
  }

  const tidy = () => {
    for (const p of PIECES) {
      place(p.key, 0, 0)
      const el = els.current[p.key]
      if (el) el.style.zIndex = ""
    }
    zTop.current = 10
    setMarks([])
    setMessy(false)
    setSettling(!reduced)
    setSay("Tidied the collage.")
  }

  const chapterKeys = (e: React.KeyboardEvent) => {
    const n = chapterKey(cur, e.key, list.length)
    if (n === null) return
    e.preventDefault()
    go(n)
  }

  const art = (key: string) => {
    if (key === "photo")
      return (
        <>
          <Photo ids={ids} seed={seed} sky={sky} shot={shot} />
          {shot > 0 && !reduced && <span key={shot} className="cch-flash" />}
        </>
      )
    if (key === "polaroid")
      return (
        <div className="cch-flip">
          <div className="cch-face">
            <Snapshot ids={ids} seed={seed} sky={sky} />
          </div>
          <div className="cch-face cch-back" lang={lang}>
            <b>{number}</b>
            <span>
              {caption.split("\n").map((l, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <br />}
                  {l}
                </React.Fragment>
              ))}
            </span>
            <i>{number}</i>
          </div>
        </div>
      )
    if (key === "sunflower")
      return (
        <div className="cch-spin" style={{ transform: "rotate(" + spins * 360 + "deg)" }}>
          <Sunflower u={ids.u} />
        </div>
      )
    if (key === "popsicle")
      return (
        <div key={bites} className={bites ? "cch-crunch" : undefined} style={{ width: "100%", height: "100%" }}>
          <Popsicle ids={ids} bites={bites} />
        </div>
      )
    if (key === "sandal")
      return (
        <>
          <div key={toss} className={toss ? "cch-toss" : undefined}>
            <div className="cch-turn" style={{ transform: "rotate(" + weather.turn + "deg)" }}>
              <Sandal u={ids.u} />
            </div>
          </div>
          {toss > 0 && (
            <span key={"t" + toss} className="cch-tag" lang="ja">
              明日は{weather.jp}
              <small lang="en">{weather.en}</small>
            </span>
          )}
        </>
      )
    if (key === "bars")
      return (
        <div key={clack} className={clack ? "cch-clack" : undefined} style={{ width: "100%", height: "100%" }}>
          <Bars u={ids.u} />
        </div>
      )
    return (
      <div key={flare} className={flare ? "cch-flare" : undefined} style={{ width: "100%", height: "100%" }}>
        <Star />
      </div>
    )
  }

  const anim = !reduced && (intro || swapped)
  const rootClass =
    "cch-root" +
    (intro && !swapped ? " cch-intro" : "") +
    (anim ? " cch-anim" : "") +
    (draggable ? "" : " cch-fixed") +
    (stamps ? " cch-stamps-on" : "") +
    (settling ? " cch-settle" : "") +
    (className ? " " + className : "")
  const style = { height, ["--cch-a" as string]: colors.accent, ["--cch-pl" as string]: colors.paper } as React.CSSProperties
  const titleLines = title.split("\n")
  const bodyLines = body.split("\n")

  return (
    <section
      ref={root}
      className={rootClass}
      data-theme={theme}
      style={style}
      aria-label={plain(title) || "Collage"}
      onPointerEnter={() => (hovering.current = true)}
      onPointerLeave={() => (hovering.current = false)}
    >
      <style>{CCH_CSS}</style>
      <div className="cch-frame">
        <Defs {...ids} />
        <div className="cch-bg" onPointerDown={stamp} />
        <div className="cch-stage">
          <Orbit reduced={reduced} />
          <Planet ids={ids} seed={seed} />
          {PIECES.map((p, i) => (
            <div
              key={p.key}
              ref={(el) => {
                els.current[p.key] = el
              }}
              className={"cch-piece cch-p-" + p.key + (p.key === "polaroid" && flipped ? " cch-flipped" : "")}
              style={{ ["--x" as string]: p.x, ["--y" as string]: p.y, ["--w" as string]: p.w, ["--h" as string]: p.h, ["--r" as string]: p.r, ["--d" as string]: p.d, ["--i" as string]: i } as React.CSSProperties}
              role="button"
              tabIndex={0}
              aria-label={LABELS[p.key] + (draggable ? ". Arrow keys move it." : ".")}
              onPointerDown={(e) => down(e, p.key)}
              onPointerMove={move}
              onPointerUp={up}
              onPointerCancel={cancel}
              onLostPointerCapture={cancel}
              onKeyDown={(e) => keyPiece(e, p.key)}
            >
              <div className="cch-in">{art(p.key)}</div>
            </div>
          ))}
          {SPARKS.map((s, i) => (
            <Sparkle key={i} x={s.x} y={s.y} s={s.r} t={s.t} light={s.light} side={s.side} />
          ))}
          {RINGS.map((r, i) => (
            <Ring key={i} x={r.x} y={r.y} r={r.r} side={r.side} />
          ))}
          <div className="cch-num" role="group" aria-label="Files" onKeyDown={chapterKeys}>
            <button type="button" className="cch-numb" key={"n" + cur} onClick={() => go(cur + 1)} aria-label={"File " + number + (list.length > 1 ? ". Next file" : "")}>
              {number.split("").map((c, i) => (
                <span key={i} style={{ ["--i" as string]: i } as React.CSSProperties}>
                  {c}
                </span>
              ))}
            </button>
            {list.length > 1 && (
              <div className="cch-nav">
                <button type="button" className="cch-arrow" onClick={() => go(cur - 1)} aria-label="Previous file">
                  ‹
                </button>
                {list.map((c, i) => (
                  <button key={i} type="button" className="cch-dot" aria-current={i === cur} aria-label={"File " + (c.number ?? String(i + 1).padStart(2, "0"))} onClick={() => go(i)} />
                ))}
                <button type="button" className="cch-arrow" onClick={() => go(cur + 1)} aria-label="Next file">
                  ›
                </button>
              </div>
            )}
          </div>
        </div>
        {marks.map((m) => (
          <span
            key={m.id}
            className={"cch-stamp" + (m.fill ? " cch-stamp-a" : "")}
            style={{ left: m.x, top: m.y, ["--s" as string]: m.s + "px", ["--rot" as string]: m.rot + "deg" } as React.CSSProperties}
            aria-hidden="true"
          >
            <svg className="cch-svg" viewBox="-50 -50 100 100">
              <path d={sparklePath(0, 0, 48)} />
            </svg>
          </span>
        ))}
        <div className="cch-copy" key={"c" + cur}>
          <p className="cch-kicker" lang="en">
            {kicker.split("\n").map((l, i) => (
              <span key={i} className="cch-ln" style={{ ["--i" as string]: i } as React.CSSProperties}>
                <Emph text={l} />
              </span>
            ))}
          </p>
          <div className="cch-mid">
            <h1 className="cch-title" lang={lang}>
              {titleLines.map((l, i) => (
                <span key={i} className="cch-tl cch-ln" style={{ ["--i" as string]: i, ["--o" as string]: "120ms" } as React.CSSProperties}>
                  <Emph text={l} />
                </span>
              ))}
            </h1>
            <span className="cch-tick" aria-hidden="true" />
            <p className="cch-body" lang={lang}>
              {bodyLines.map((l, i) => (
                <span key={i} className="cch-ln" style={{ ["--i" as string]: i, ["--o" as string]: "320ms" } as React.CSSProperties}>
                  {l}
                </span>
              ))}
            </p>
            {action && (
              <a className="cch-cta" href={action.href}>
                {action.label}
                <span aria-hidden="true">→</span>
              </a>
            )}
          </div>
          <div className="cch-foot">
            <Barcode code={barcode + " " + number} />
            {messy ? (
              <button type="button" className="cch-tidy" onClick={tidy}>
                ↺ Tidy up
              </button>
            ) : (
              hint && <span className="cch-hint">{hint}</span>
            )}
          </div>
        </div>
        <svg className="cch-grain" aria-hidden="true">
          <filter id={ids.id("grain")}>
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7" stitchTiles="stitch" />
            <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.6 1.1" />
          </filter>
          <rect width="100%" height="100%" filter={ids.u("grain")} />
        </svg>
        <span className="cch-sr" aria-live="polite">
          {say}
        </span>
      </div>
    </section>
  )
}
