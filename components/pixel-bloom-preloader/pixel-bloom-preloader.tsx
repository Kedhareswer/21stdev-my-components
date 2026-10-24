"use client"

// Pixel Bloom Preloader — "there is no outside".
// A cobalt field, an italic serif word, and a garden of 8-bit flowers. The
// load is a flower: one big pixel bloom stands in for the word's "i" and grows
// pixel by pixel with the progress, stem first, then leaves, then a bud that
// opens. Around it the field sprouts smaller flowers, the sentence types itself
// in, and the word rises letter by letter out of the ground.
//
//   load   the stem climbs with the count, flowers sprout, "THERE IS NO" types,
//          the word rises one letter at a time.
//   bloom  the head opens, pollen bursts, the whole field shivers outward and
//          the sentence finishes: "GO BACK".
//   hold   the garden breathes; click (or Enter) to go in.
//   lift   the word sinks, the field folds its flowers back into the ground, and
//          the screen dissolves pixel by pixel outward from the bloom, each
//          pixel flashing gold as it goes, onto whatever the gate was guarding.
//          With `loop`, the pixels close back in and it all grows again.
//
// It is a toy while it waits: flowers lean away from the pointer and bend in
// its wake, and a click on the field plants a new one. One file, React only.
// The flowers are drawn on canvas from built-in sprites; the type is
// Instrument Serif and Inter from Google Fonts by an injected <link>
// (fontHref={null} loads nothing and uses the fallback stacks).

import * as React from "react"

export interface PixelBloomPalette {
  /** The field behind everything. */
  field?: string
  /** The type. */
  ink?: string
  /** The big bloom and the gold pixels of the exit. */
  bloom?: string
  /** The red flowers. */
  rose?: string
  /** Stems and leaves. */
  leaf?: string
}

export interface PixelBloomPreloaderProps {
  /** Content revealed once the field has dissolved. Ignored while `loop` is set. */
  children?: React.ReactNode
  /** Run forever as a showcase: children are never revealed, onComplete never fires. */
  loop?: boolean
  /** Real loading progress, 0–100. Leave undefined to run a simulated load over `durationMs`. */
  progress?: number
  /** Length of the simulated load. Defaults to 5200ms. */
  durationMs?: number
  /** The big word. Its first "i" becomes the flower; without one the flower ends the word. */
  word?: string
  /** Words set above the big one: first flush left, last flush right, the rest just before the bloom. */
  before?: string[]
  /** Words set below it, typed in once the bloom opens: first flush left, last flush right. */
  after?: string[]
  /** How many flowers sprout around the field. */
  flowers?: number
  /** Colour overrides, merged over the defaults. Hex colours. */
  palette?: PixelBloomPalette
  /** Pixel size multiplier. 1 matches the poster; 0.7 is finer, 1.4 chunkier. */
  pixel?: number
  /** How far the flowers lean from the pointer and the breeze. 0 keeps them still. */
  sway?: number
  /** Show the pixel percentage while loading. */
  counter?: boolean
  /** Stylesheet for the faces below. null loads nothing. */
  fontHref?: string | null
  /** Face for the big word. */
  serif?: string
  /** Face for the small words. */
  sans?: string
  /** Root height. A definite length, never a percentage. */
  height?: string
  /** Fired once, after the field has dissolved. */
  onComplete?: () => void
  /** Extra root class names. */
  className?: string
}

const DEFAULT_PALETTE = {
  field: "#1c3fcf",
  ink: "#ece8de",
  bloom: "#f4c531",
  rose: "#cf2420",
  leaf: "#2b9a2c",
}

const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500&display=swap"
const SERIF_STACK = '"Instrument Serif", "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif'
const SANS_STACK = '"Inter", "Helvetica Neue", Helvetica, Arial, sans-serif'

// #region garden
// Pure helpers, lifted out and executed by tests/pixel-bloom-preloader.test.mjs.

// Sprites, top row first. `head` is how many top rows are the flower head; the
// rest is stem and leaves, with the stem in the middle column.
//   Y y o b   bloom: light, body, ochre, core
//   R r d     rose: light, body, dark
//   G g l     stem, stem shadow, leaf light
export const PXB_SPRITES = {
  bloom: {
    head: 5,
    rows: [
      ".YY.yy.",
      "YYYyyyo",
      "YYyobyo",
      ".yybbo.",
      "..yoo..",
      "...G...",
      "...G...",
      "...Gg..",
      "...G...",
      "ll.G.ll",
      ".llGll.",
      "...G...",
      "...g...",
    ],
  },
  rose: {
    head: 4,
    rows: [
      "..rRr..",
      ".rRdRr.",
      ".rdRdd.",
      "..ddr..",
      "...G...",
      ".l.G...",
      ".lgG.l.",
      "...Ggl.",
      "...G...",
    ],
  },
  butter: {
    head: 3,
    rows: [
      "..Y.Y..",
      ".YyoyY.",
      "..yyy..",
      "...G...",
      "...G.l.",
      ".l.Ggl.",
      ".lgG...",
      "...G...",
    ],
  },
  tulip: {
    head: 4,
    rows: [
      ".r.R.r.",
      ".rRRrr.",
      ".drRrd.",
      "..ddd..",
      "...G...",
      "...G.l.",
      ".l.Gll.",
      ".llG...",
      "...G...",
    ],
  },
}

export type PxbKind = "bloom" | "rose" | "butter" | "tulip"
export const PXB_KINDS = ["rose", "butter", "tulip"] as PxbKind[]

// The stem's share of a flower's growth; the head opens over the rest.
export const PXB_STEM = 0.52

// A sprite as pixels, each with the growth (0–1) at which it appears: the stem
// climbs from the ground, each leaf unfurls once the stem has passed it, and
// the head opens outward from where it meets the stem, so a part-grown head
// reads as a bud.
export function pxbParse(kind: PxbKind) {
  const sprite = PXB_SPRITES[kind]
  const rows = sprite.rows
  const h = rows.length
  const w = rows[0].length
  const stemX = Math.floor(w / 2)
  const hy = sprite.head - 1
  const px = [] as { x: number; y: number; c: string; rank: number }[]
  let maxD = 0
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const c = rows[y][x]
      if (c === ".") continue
      px.push({ x, y, c, rank: 0 })
      if (y < sprite.head) maxD = Math.max(maxD, Math.hypot(x - stemX, (hy - y) * 1.2))
    }
  }
  const stemRows = h - sprite.head
  for (const p of px) {
    if (p.y < sprite.head) {
      const d = Math.hypot(p.x - stemX, (hy - p.y) * 1.2)
      p.rank = PXB_STEM + (1 - PXB_STEM) * (maxD ? d / maxD : 0) * 0.98
    } else {
      const rise = (h - 1 - p.y) / stemRows
      p.rank = Math.min(PXB_STEM - 0.01, rise * PXB_STEM * 0.86 + Math.abs(p.x - stemX) * 0.035)
    }
  }
  px.sort((a, b) => a.rank - b.rank)
  return { w, h, stemX, head: sprite.head, px }
}

const clamp01 = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x)

// Surges and stalls like a real load. [time, progress] knots, eased between.
const KNOTS = [
  [0, 0],
  [0.18, 0.22],
  [0.3, 0.26],
  [0.55, 0.62],
  [0.68, 0.66],
  [0.86, 0.9],
  [1, 1],
]

export function pxbSimulated(t: number) {
  if (t <= 0) return 0
  if (t >= 1) return 1
  for (let i = 0; i < KNOTS.length - 1; i++) {
    const a = KNOTS[i]
    const b = KNOTS[i + 1]
    if (t <= b[0]) {
      const local = (t - a[0]) / (b[0] - a[0])
      return a[1] + (b[1] - a[1]) * (1 - Math.pow(1 - local, 3))
    }
  }
  return 1
}

// Deterministic noise in [0, 1).
export function pxbHash(x: number) {
  const s = Math.sin(x * 12.9898 + 78.233) * 43758.5453
  return s - Math.floor(s)
}

// Mixes a hex colour toward white (amt > 0) or black (amt < 0).
export function pxbShade(hex: string, amt: number) {
  let h = hex.replace("#", "").trim()
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]
  const n = parseInt(h.slice(0, 6), 16)
  if (h.length < 6 || Number.isNaN(n)) return hex
  const to = amt > 0 ? 255 : 0
  const k = Math.min(1, Math.abs(amt))
  const ch = (v: number) => Math.round(v + (to - v) * k)
  const out = (ch((n >> 16) & 255) << 16) | (ch((n >> 8) & 255) << 8) | ch(n & 255)
  return "#" + out.toString(16).padStart(6, "0")
}

type Box = number[]
const hits = (a: Box, b: Box) => a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1]

// Scatters `count` flowers over a W×H field, clear of every box in `avoid`
// ([x0, y0, x1, y1]) and of each other. A flower is `fw` wide and `fh` tall
// above its base point. Same seed, same garden.
export function pxbScatter(W: number, H: number, count: number, avoid: Box[], fw: number, fh: number, seed: number) {
  const out = [] as { x: number; y: number; kind: PxbKind; at: number }[]
  const pad = Math.max(14, fw * 0.6)
  const gap = Math.max(fw * 1.5, Math.min(W, H) * 0.09)
  for (let k = 0; k < count * 80 && out.length < count; k++) {
    const x = pad + fw / 2 + pxbHash(seed + k * 2.17) * (W - pad * 2 - fw)
    const y = pad + fh + pxbHash(seed + k * 5.31 + 0.7) * (H - pad * 2 - fh)
    const box = [x - fw / 2 - 2, y - fh - 2, x + fw / 2 + 2, y + 2]
    if (avoid.some((a) => hits(box, a))) continue
    if (out.some((f) => Math.hypot(f.x - x, (f.y - y) * 1.3) < gap)) continue
    const r = pxbHash(seed + k * 9.7 + 3.3)
    out.push({ x, y, kind: r < 0.45 ? "rose" : r < 0.8 ? "butter" : "tulip", at: 0 })
  }
  // they sprout in a shuffled order, spread over the load
  out.forEach((f, i) => {
    f.at = 0.05 + 0.85 * ((i + pxbHash(seed + i * 3.9) * 0.8) / Math.max(1, out.length))
  })
  return out
}

// When each cell of a cols×rows grid goes in the exit dissolve, 0–1: a ripple
// out from (ox, oy), roughened so the front breaks up into pixels.
export function pxbOrder(cols: number, rows: number, ox: number, oy: number, seed: number) {
  const out = new Float32Array(cols * rows)
  let maxD = 1
  for (const [cx, cy] of [[0, 0], [cols, 0], [0, rows], [cols, rows]]) maxD = Math.max(maxD, Math.hypot(cx - ox, cy - oy))
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const d = Math.hypot(c - ox, r - oy) / maxD
      out[r * cols + c] = Math.min(0.999, d * 0.8 + pxbHash(seed + c * 31.7 + r * 7.3) * 0.2)
    }
  }
  return out
}

// A cell's state at wave front w: 0 gone, 1 the leading flash, 2 the trailing
// flash, 3 still field.
export const PXB_BAND = 0.09
export function pxbCell(order: number, w: number) {
  if (order < w - PXB_BAND) return 0
  if (order < w - PXB_BAND * 0.45) return 2
  if (order < w) return 1
  return 3
}

// 3×5 pixel digits for the count.
export const PXB_DIGITS: { [ch: string]: string[] } = {
  "0": ["###", "#.#", "#.#", "#.#", "###"],
  "1": [".#.", "##.", ".#.", ".#.", "###"],
  "2": ["###", "..#", "###", "#..", "###"],
  "3": ["###", "..#", ".##", "..#", "###"],
  "4": ["#.#", "#.#", "###", "..#", "..#"],
  "5": ["###", "#..", "###", "..#", "###"],
  "6": ["###", "#..", "###", "#.#", "###"],
  "7": ["###", "..#", ".#.", ".#.", ".#."],
  "8": ["###", "#.#", "###", "#.#", "###"],
  "9": ["###", "#.#", "###", "..#", "###"],
  "%": ["##..#", "##.#.", "..#..", ".#.##", "#..##"],
}

export function pxbCount(v: number) {
  return String(Math.round(Math.min(100, Math.max(0, v)))).padStart(3, "0") + "%"
}

// Where the flower goes in the word: its first i, else after the last letter.
export function pxbSplit(word: string) {
  const chars = Array.from(word.trim() || " ")
  const at = chars.findIndex((c) => c === "i" || c === "I" || c === "ı")
  return at < 0 ? { chars, at: chars.length } : { chars: chars.slice(0, at).concat(chars.slice(at + 1)), at }
}
// #endregion

// ---- styles -------------------------------------------------------------------

const PXB_CSS = `
.pxb-root {
  position: relative;
  width: 100%;
  overflow: hidden;
  -webkit-tap-highlight-color: transparent;
}
.pxb-root *, .pxb-root *::before, .pxb-root *::after { box-sizing: border-box; }
.pxb-dest {
  position: absolute;
  inset: 0;
  overflow-y: auto;
  opacity: 0;
  pointer-events: none;
}
.pxb-dest[data-active="true"] { opacity: 1; pointer-events: auto; }
.pxb-after {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--pxb-ink);
  color: var(--pxb-field);
  font-family: var(--pxb-serif);
  font-style: italic;
  font-size: clamp(22px, 4.2vmin, 44px);
  letter-spacing: -0.01em;
  text-align: center;
  padding: 0 24px;
}

.pxb-gate {
  position: absolute;
  inset: 0;
  z-index: 10;
  background: var(--pxb-field);
  color: var(--pxb-ink);
  cursor: crosshair;
  outline: none;
  user-select: none;
  -webkit-user-select: none;
  overflow: hidden;
}
.pxb-root[data-phase="bloom"] .pxb-gate, .pxb-root[data-phase="hold"] .pxb-gate { cursor: pointer; }
.pxb-gate:focus-visible::after {
  content: "";
  position: absolute;
  inset: 6px;
  border: 1px dashed var(--pxb-ink);
  opacity: 0.6;
  pointer-events: none;
}
.pxb-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  max-width: none;
  display: block;
  pointer-events: none;
}

/* ---- the word ---- */
.pxb-word {
  position: absolute;
  left: 50%;
  top: 50%;
  margin: 0;
  display: inline-block;
  white-space: nowrap;
  font-family: var(--pxb-serif);
  font-style: italic;
  font-weight: 400;
  line-height: 1;
  letter-spacing: -0.012em;
  transform: translate(-50%, -64%);
  opacity: 0;
}
.pxb-root[data-ready="true"] .pxb-word { opacity: 1; }
.pxb-lw {
  display: inline-block;
  clip-path: inset(-0.5em -0.3em -0.32em -0.3em);
}
.pxb-l {
  display: inline-block;
  transform: translateY(1.45em) rotate(9deg);
  transform-origin: 0% 100%;
  transition: transform 0.95s cubic-bezier(0.16, 1, 0.3, 1);
}
.pxb-l[data-on="true"] { transform: none; }
.pxb-root[data-phase="lift"] .pxb-l,
.pxb-root[data-phase="rest"] .pxb-l,
.pxb-root[data-phase="refill"] .pxb-l {
  transform: translateY(1.45em) rotate(-6deg);
  transition: transform 0.6s cubic-bezier(0.6, 0, 0.8, 0.3) var(--pxb-drop);
}
.pxb-slot {
  display: inline-block;
  height: 0;
  vertical-align: baseline;
}

/* ---- the small words ---- */
.pxb-row {
  position: absolute;
  height: 0;
  font-family: var(--pxb-sans);
  font-weight: 400;
  line-height: 1;
  letter-spacing: 0.01em;
  text-transform: uppercase;
  white-space: nowrap;
}
.pxb-item { position: absolute; top: 0; }
.pxb-ch { opacity: 0; }
.pxb-row[data-on="true"] .pxb-ch { animation: pxb-type 90ms steps(2, jump-none) var(--pxb-d) both; }
.pxb-caret {
  display: inline-block;
  width: 0.55em;
  height: 0.8em;
  margin-left: 0.08em;
  vertical-align: -0.02em;
  background: var(--pxb-ink);
  opacity: 0;
}
.pxb-row[data-on="true"] .pxb-item:last-child .pxb-caret { animation: pxb-caret 1.1s steps(1, end) var(--pxb-d) 3 forwards; }
.pxb-root[data-phase="lift"] .pxb-row,
.pxb-root[data-phase="rest"] .pxb-row,
.pxb-root[data-phase="refill"] .pxb-row { opacity: 0; transition: opacity 0.35s steps(3, end); }

/* ---- the hint ---- */
.pxb-hint {
  position: absolute;
  left: 0;
  right: 0;
  text-align: center;
  font-family: var(--pxb-sans);
  font-weight: 500;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  opacity: 0;
  transition: opacity 0.5s ease;
  pointer-events: none;
}
.pxb-root[data-phase="hold"] .pxb-hint { opacity: 0.85; animation: pxb-blink 2.2s steps(2, jump-none) 0.6s infinite; }

.pxb-sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

@keyframes pxb-type {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes pxb-caret {
  0% { opacity: 1; }
  50% { opacity: 0; }
}
@keyframes pxb-blink {
  0%, 100% { opacity: 0.85; }
  50% { opacity: 0.45; }
}

@media (prefers-reduced-motion: reduce) {
  .pxb-l, .pxb-l[data-on="true"] { transform: none; opacity: 0; transition: opacity 0.6s ease; }
  .pxb-l[data-on="true"] { opacity: 1; }
  .pxb-root[data-phase="lift"] .pxb-l,
  .pxb-root[data-phase="rest"] .pxb-l,
  .pxb-root[data-phase="refill"] .pxb-l { transform: none; opacity: 0; transition: opacity 0.4s ease; }
  .pxb-row[data-on="true"] .pxb-ch { animation: none; opacity: 1; }
  .pxb-row[data-on="true"] .pxb-item:last-child .pxb-caret { animation: none; }
  .pxb-root[data-phase="hold"] .pxb-hint { animation: none; }
}
`

// ---- component ----------------------------------------------------------------

type Phase = "load" | "bloom" | "hold" | "lift" | "rest" | "refill" | "done"

const BLOOM_MS = 1500
const HOLD_MS = 2800
const RETRACT_MS = 800
const DISSOLVE_MS = 1350
const REST_MS = 600
const REFILL_MS = 1050
const GROW_MS = 900
const SHRINK_MS = 420
const MAX_PLANTED = 24

type Flower = {
  x: number
  y: number
  kind: PxbKind
  at: number
  born: number
  dying: number
  lean: number
  vlean: number
  seed: number
}
type Mote = { x: number; y: number; vx: number; vy: number; born: number; life: number; light: boolean }
type Geo = {
  W: number
  H: number
  F: number
  u: number
  su: number
  bx: number
  by: number
  baseY: number
  wordL: number
  wordR: number
  topY: number
  botY: number
  rowF: number
  midRight: number
  hintY: number
}

const SPRITES = {
  bloom: pxbParse("bloom"),
  rose: pxbParse("rose"),
  butter: pxbParse("butter"),
  tulip: pxbParse("tulip"),
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

export default function PixelBloomPreloader({
  children,
  loop = false,
  progress,
  durationMs = 5200,
  word = "outside",
  before = ["There", "is", "no"],
  after = ["Go", "back"],
  flowers = 12,
  palette,
  pixel = 1,
  sway = 1,
  counter = true,
  fontHref = FONT_HREF,
  serif = SERIF_STACK,
  sans = SANS_STACK,
  height = "100svh",
  onComplete,
  className = "",
}: PixelBloomPreloaderProps) {
  const [phase, setPhase] = React.useState("load" as Phase)
  const [cycle, setCycle] = React.useState(0)
  const [pct, setPct] = React.useState(0)
  const [lit, setLit] = React.useState(0)
  const [rows, setRows] = React.useState(0)
  const [fontsReady, setFontsReady] = React.useState(!fontHref)
  const [F, setF] = React.useState(160)
  const [geo, setGeo] = React.useState(null as Geo | null)

  const rootRef = React.useRef(null as HTMLDivElement | null)
  const gateRef = React.useRef(null as HTMLDivElement | null)
  const destRef = React.useRef(null as HTMLDivElement | null)
  const backRef = React.useRef(null as HTMLCanvasElement | null)
  const frontRef = React.useRef(null as HTMLCanvasElement | null)
  const wordRef = React.useRef(null as HTMLDivElement | null)
  const slotRef = React.useRef(null as HTMLSpanElement | null)
  const itemRefs = React.useRef([] as (HTMLSpanElement | null)[])
  const fRef = React.useRef(160)
  const phaseRef = React.useRef("load" as Phase)
  const phaseAtRef = React.useRef(0)
  const shownRef = React.useRef(0)
  const rushRef = React.useRef(false)
  const flowersRef = React.useRef([] as Flower[])
  const plantedRef = React.useRef([] as Flower[])
  const bigRef = React.useRef({ x: 0, y: 0, lean: 0, vlean: 0 })
  const motesRef = React.useRef([] as Mote[])
  const pointerRef = React.useRef(null as { x: number; y: number; vx: number; t: number } | null)
  const progressRef = React.useRef(progress)
  progressRef.current = progress
  const onCompleteRef = React.useRef(onComplete)
  onCompleteRef.current = onComplete
  const loopRef = React.useRef(loop)
  loopRef.current = loop
  const geoRef = React.useRef(geo)
  geoRef.current = geo
  const cycleRef = React.useRef(cycle)
  cycleRef.current = cycle

  const colors = { ...DEFAULT_PALETTE, ...palette }
  const ink = React.useMemo(() => {
    const c = { ...DEFAULT_PALETTE, ...palette }
    return {
      Y: pxbShade(c.bloom, 0.5),
      y: c.bloom,
      o: pxbShade(c.bloom, -0.3),
      b: pxbShade(c.bloom, -0.58),
      R: pxbShade(c.rose, 0.22),
      r: c.rose,
      d: pxbShade(c.rose, -0.42),
      G: c.leaf,
      g: pxbShade(c.leaf, -0.38),
      l: pxbShade(c.leaf, 0.22),
      field: c.field,
      text: c.ink,
    } as { [k: string]: string }
  }, [palette])
  const inkRef = React.useRef(ink)
  inkRef.current = ink

  const split = React.useMemo(() => pxbSplit(word), [word])
  const nLetters = split.chars.length
  const items = React.useMemo(() => {
    const clean = (a: string[]) => a.map((s) => s.trim()).filter(Boolean)
    return { before: clean(before), after: clean(after) }
  }, [before.join("\u0000"), after.join("\u0000")])

  const go = React.useCallback((next: Phase) => {
    phaseRef.current = next
    phaseAtRef.current = performance.now()
    setPhase(next)
  }, [])

  // ---- faces: a <link> once per document, never a CSS import ----------------------
  React.useEffect(() => {
    if (!fontHref) {
      setFontsReady(true)
      return
    }
    if (!document.querySelector('link[data-pxb-fonts="' + fontHref + '"]')) {
      const link = document.createElement("link")
      link.rel = "stylesheet"
      link.href = fontHref
      link.setAttribute("data-pxb-fonts", fontHref)
      document.head.appendChild(link)
    }
    let live = true
    const done = () => {
      if (live) setFontsReady(true)
    }
    const timer = setTimeout(done, 1800)
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts
    if (fonts && fonts.load) {
      Promise.all([fonts.load('italic 400 1em "Instrument Serif"'), fonts.load('400 1em "Inter"')])
        .then(done)
        .catch(done)
    }
    return () => {
      live = false
      clearTimeout(timer)
    }
  }, [fontHref])

  // ---- measure: fit the word, then read where everything landed -------------------
  const measure = React.useCallback(() => {
    const root = rootRef.current
    const wordEl = wordRef.current
    const slot = slotRef.current
    if (!root || !wordEl || !slot) return
    const r = root.getBoundingClientRect()
    if (r.width <= 0 || r.height <= 0) return
    const W = r.width
    const H = r.height
    const wr = wordEl.getBoundingClientRect()
    const cur = fRef.current
    const target = W * (W > H ? 0.8 : 0.88)
    const next = Math.max(28, Math.min((cur * target) / Math.max(1, wr.width), H * 0.46))
    if (Math.abs(next - cur) > 0.75) {
      fRef.current = next
      setF(next)
      return
    }
    const sr = slot.getBoundingClientRect()
    const baseY = sr.top - r.top
    const u = Math.max(3, Math.round(cur * 0.066 * Math.max(0.4, pixel)))
    const su = Math.max(2, Math.round(u * 0.42))
    const bx = Math.round(sr.left - r.left + sr.width / 2 - u / 2)
    const by = Math.round(baseY + cur * 0.2)
    const headL = bx - 3 * u
    const headTop = by - SPRITES.bloom.h * u
    const rowF = Math.max(11, cur * 0.1)
    setGeo({
      W,
      H,
      F: cur,
      u,
      su,
      bx,
      by,
      baseY,
      wordL: wr.left - r.left,
      wordR: wr.right - r.left,
      topY: Math.min(headTop + u * 0.3, baseY - cur * 0.64),
      botY: baseY + cur * 0.19,
      rowF,
      midRight: headL - u * 0.5,
      hintY: Math.min(H - rowF * 2.6, Math.max(by + u * 2, H - Math.max(36, H * 0.08))),
    })
  }, [pixel])

  React.useEffect(() => {
    measure()
  }, [measure, F, fontsReady, split, items])

  React.useEffect(() => {
    const root = rootRef.current
    if (!root || typeof ResizeObserver === "undefined") return
    const ro = new ResizeObserver(() => measure())
    ro.observe(root)
    return () => ro.disconnect()
  }, [measure])

  // ---- the garden, scattered clear of the type ----------------------------------------
  React.useEffect(() => {
    if (!geo) return
    const root = rootRef.current
    const rb = root ? root.getBoundingClientRect() : null
    const avoid = [] as Box[]
    const { su, u, bx, by, F: f, baseY, wordL, wordR } = geo
    avoid.push([wordL, baseY - f * 0.72, wordR, baseY + f * 0.2])
    avoid.push([bx - 4 * u, by - SPRITES.bloom.h * u - u, bx + 5 * u, by + u])
    avoid.push([geo.W / 2 - geo.rowF * 6, geo.hintY - geo.rowF * 2, geo.W / 2 + geo.rowF * 6, geo.H])
    if (rb) {
      for (const el of itemRefs.current) {
        if (!el) continue
        const e = el.getBoundingClientRect()
        avoid.push([e.left - rb.left - su * 2, e.top - rb.top - su * 2, e.right - rb.left + su * 2, e.bottom - rb.top + su * 2])
      }
    }
    const fw = 7 * su
    const fh = 9 * su
    const now = performance.now()
    const shown = shownRef.current
    const live = phaseRef.current === "load" || phaseRef.current === "bloom" || phaseRef.current === "hold"
    flowersRef.current = pxbScatter(geo.W, geo.H, Math.max(0, Math.round(flowers)), avoid, fw, fh, 7.3).map((f, i) => ({
      ...f,
      born: live && (shown >= f.at || phaseRef.current !== "load") ? now - GROW_MS : 0,
      dying: 0,
      lean: 0,
      vlean: 0,
      seed: i * 1.7 + 0.3,
    }))
    plantedRef.current = []
  }, [geo, flowers])

  // the guarded page can't take focus or clicks until the gate is gone
  React.useEffect(() => {
    destRef.current?.toggleAttribute("inert", phase !== "done")
  }, [phase, children])

  // ---- reduced motion, tracked live --------------------------------------------------
  const stillRef = React.useRef(false)
  React.useEffect(() => {
    if (typeof matchMedia === "undefined") return
    const mq = matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => {
      stillRef.current = mq.matches
    }
    sync()
    mq.addEventListener("change", sync)
    return () => mq.removeEventListener("change", sync)
  }, [])

  // ---- phase entries ------------------------------------------------------------------
  React.useEffect(() => {
    phaseRef.current = phase
    const now = performance.now()
    if (phase === "load") {
      phaseAtRef.current = now
      shownRef.current = 0
      rushRef.current = false
      setPct(0)
      setLit(0)
      setRows(0)
      plantedRef.current = []
      for (const f of flowersRef.current) {
        f.born = 0
        f.dying = 0
      }
      if (gateRef.current) gateRef.current.style.background = ""
    }
    if (phase === "bloom") {
      setRows(2)
      const g = geoRef.current
      if (!g || stillRef.current) return
      // pollen bursts from the head, and the field shivers outward from it
      const hx = g.bx + g.u / 2
      const hy = g.by - (SPRITES.bloom.h - 2.5) * g.u
      for (let i = 0; i < 26; i++) {
        const a = -Math.PI / 2 + (pxbHash(i * 3.3 + cycle) - 0.5) * 2.4
        const sp = Math.min(g.W, g.H) * (0.25 + pxbHash(i * 7.1 + cycle) * 0.55)
        motesRef.current.push({
          x: hx,
          y: hy,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp,
          born: now,
          life: 900 + pxbHash(i * 1.9) * 900,
          light: i % 3 !== 0,
        })
      }
      bigRef.current.vlean += 9
      const timers = flowersRef.current.concat(plantedRef.current).map((f) => {
        const dx = f.x - hx
        const delay = Math.hypot(dx, f.y - hy) / Math.max(g.W, g.H)
        return setTimeout(() => {
          f.vlean += (dx >= 0 ? 1 : -1) * 14
        }, delay * 600)
      })
      return () => timers.forEach(clearTimeout)
    }
    if (phase === "lift") {
      const g = geoRef.current
      const all = flowersRef.current.concat(plantedRef.current)
      for (const f of all) {
        const d = g ? Math.hypot(f.x - g.bx, f.y - g.by) / Math.max(g.W, g.H) : 0
        f.dying = now + (1 - d) * (RETRACT_MS - SHRINK_MS - 60)
      }
    }
  }, [phase, cycle])

  const counterRef = React.useRef(counter)
  counterRef.current = counter
  const swayRef = React.useRef(sway)
  swayRef.current = sway
  const litRef = React.useRef(0)
  const rowsRef = React.useRef(0)
  litRef.current = lit
  rowsRef.current = rows
  const fontsRef = React.useRef(fontsReady)
  fontsRef.current = fontsReady
  const durRef = React.useRef(durationMs)
  durRef.current = durationMs

  // ---- the one frame loop: progress, garden, pollen, dissolve -------------------------
  React.useEffect(() => {
    let raf = 0
    let last = performance.now()
    let lastPct = -1
    let order = null as Float32Array | null
    let grid = { cols: 0, rows: 0, ox: 0, oy: 0, c: 1 }
    let dissolveFrom = 0
    let nextMote = 0

    const tick = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000)
      last = now
      const g = geoRef.current
      const back = backRef.current
      const front = frontRef.current
      const ph = phaseRef.current
      const since = now - phaseAtRef.current
      const still = stillRef.current
      const c = inkRef.current

      // -- progress
      if (ph === "load") {
        const external = progressRef.current
        let target =
          external !== undefined ? clamp01(external / 100) : pxbSimulated(since / Math.max(600, durRef.current))
        if (rushRef.current) target = 1
        const rate = rushRef.current ? 0.12 : external !== undefined ? 0.08 : 1
        let shown = shownRef.current
        shown += (target - shown) * Math.min(1, rate * (dt / 0.0167))
        if (target - shown < 0.002) shown = target
        shownRef.current = shown
        const p = Math.round(shown * 100)
        if (p !== lastPct) {
          lastPct = p
          setPct(p)
        }
        if (fontsRef.current && g) {
          if (rowsRef.current < 1 && shown >= 0.03) setRows(1)
          const want = Math.min(nLetters, Math.floor(((shown - 0.1) / 0.72) * nLetters + 1))
          if (want > litRef.current) setLit(Math.max(0, want))
        }
        for (const f of flowersRef.current) if (!f.born && shown >= f.at) f.born = now
        if (shown >= 1 && litRef.current >= nLetters && fontsRef.current) go("bloom")
      } else if (ph === "bloom" && since > BLOOM_MS) go("hold")
      else if (ph === "hold" && since > HOLD_MS) go("lift")
      else if (ph === "lift" && since > RETRACT_MS + DISSOLVE_MS) {
        if (loopRef.current) go("rest")
        else {
          go("done")
          onCompleteRef.current?.()
          return
        }
      } else if (ph === "rest" && since > REST_MS) go("refill")
      else if (ph === "refill" && since > REFILL_MS) {
        order = null
        setCycle((k) => k + 1)
        go("load")
      }

      if (!g || !back || !front) {
        raf = requestAnimationFrame(tick)
        return
      }

      // -- canvases at device resolution; rects snap to device pixels so the art stays crisp
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      const cw = Math.round(g.W * dpr)
      const chh = Math.round(g.H * dpr)
      for (const cv of [back, front]) {
        if (cv.width !== cw || cv.height !== chh) {
          cv.width = cw
          cv.height = chh
        }
      }
      const bctx = back.getContext("2d")
      const fctx = front.getContext("2d")
      if (!bctx || !fctx) {
        raf = requestAnimationFrame(tick)
        return
      }
      bctx.clearRect(0, 0, cw, chh)
      fctx.clearRect(0, 0, cw, chh)
      const box = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
        const x0 = Math.round(x * dpr)
        const y0 = Math.round(y * dpr)
        ctx.rect(x0, y0, Math.round((x + w) * dpr) - x0, Math.round((y + h) * dpr) - y0)
      }

      // -- pointer: lean away from it, bend in its wake
      const ptr = pointerRef.current
      const amount = still ? 0 : Math.max(0, swayRef.current)
      const sig = Math.min(g.W, g.H) * 0.16
      const vx = ptr && now - ptr.t < 140 ? ptr.vx : 0
      const lean = (f: { x: number; y: number; lean: number; vlean: number }, hy: number, seed: number) => {
        let target = Math.sin(now / 1300 + seed * 2.1) * 0.55 * amount
        if (ptr && amount) {
          const dx = ptr.x - f.x
          const dy = ptr.y - hy
          const fall = Math.exp(-(dx * dx + dy * dy) / (2 * sig * sig))
          target += (-(dx / sig) * 2.6 + Math.max(-1, Math.min(1, vx / 1600)) * 2.2) * fall * amount
        }
        f.vlean += (-(f.lean - target) * 60 - f.vlean * 6.5) * dt
        f.lean = Math.max(-2.6, Math.min(2.6, f.lean + f.vlean * dt))
        if (still) f.lean = 0
      }

      // -- draws a sprite grown to `grow`, base centred at (bx + unit/2, by)
      const drawSprite = (
        ctx: CanvasRenderingContext2D,
        kind: PxbKind,
        bx: number,
        by: number,
        unit: number,
        grow: number,
        tilt: number,
        mask: ((x: number, y: number) => number) | null,
      ) => {
        const s = SPRITES[kind]
        const byColor = {} as { [k: string]: number[][] }
        for (const p of s.px) {
          if (grow < 1 && p.rank >= grow) break
          const hb = p.y < s.head ? s.h - s.head : s.h - 1 - p.y
          const shift = Math.round(tilt * Math.pow(hb / (s.h - 1), 1.35) * 2)
          const x = bx + (p.x - s.stemX + shift) * unit
          const y = by - (s.h - p.y) * unit
          let col = p.c
          if (mask) {
            const st = mask(x, y)
            if (st === 0) continue
            if (st === 1) col = "Y"
          }
          ;(byColor[col] = byColor[col] || []).push([x, y])
        }
        for (const k in byColor) {
          ctx.beginPath()
          for (const [x, y] of byColor[k]) box(ctx, x, y, unit, unit)
          ctx.fillStyle = c[k] || c.G
          ctx.fill()
        }
      }

      // -- the field's flowers
      const all = flowersRef.current.concat(plantedRef.current)
      for (const f of all) {
        if (!f.born) continue
        let grow = still ? 1 : easeOut(clamp01((now - f.born) / GROW_MS))
        if (f.dying) {
          if (now < f.dying) {
            // still standing, waiting its turn
          } else grow = Math.min(grow, 1 - clamp01((now - f.dying) / SHRINK_MS))
        }
        if (grow <= 0) continue
        lean(f, f.y - 7 * g.su, f.seed)
        const bx = Math.round(f.x - g.su / 2)
        drawSprite(bctx, f.kind, bx, Math.round(f.y), g.su, grow, f.lean, null)
      }

      // -- the dissolve grid, aligned to the big flower's pixels
      let wave = -1
      let fade = 1
      if ((ph === "lift" && since > RETRACT_MS) || ph === "rest" || ph === "refill") {
        if (!order) {
          const u = g.u
          const ox = (g.bx % u) - u
          const oy = (g.by % u) - u
          const cols = Math.ceil((g.W - ox) / u) + 1
          const rws = Math.ceil((g.H - oy) / u) + 1
          grid = { cols, rows: rws, ox, oy, c: u }
          const hx = Math.round((g.bx - ox) / u)
          const hy = Math.round((g.by - (SPRITES.bloom.h - 2) * u - oy) / u)
          order = pxbOrder(cols, rws, hx, hy, 11 + cycleRef.current)
          dissolveFrom = now
          if (gateRef.current) gateRef.current.style.background = "transparent"
        }
        if (ph === "lift") wave = ease(clamp01((now - dissolveFrom) / DISSOLVE_MS)) * (1 + PXB_BAND)
        else if (ph === "rest") wave = 1 + PXB_BAND
        else wave = (1 - ease(clamp01(since / REFILL_MS))) * (1 + PXB_BAND)
        if (still) {
          fade = ph === "lift" ? 1 - clamp01((now - dissolveFrom) / 500) : ph === "rest" ? 0 : clamp01(since / 500)
          wave = -1
        }
        if (wave >= 0 && order) {
          const paths = [[], [], [], []] as number[][][]
          for (let r = 0; r < grid.rows; r++) {
            for (let k = 0; k < grid.cols; k++) {
              const st = pxbCell(order[r * grid.cols + k], wave)
              if (st) paths[st].push([grid.ox + k * grid.c, grid.oy + r * grid.c])
            }
          }
          const fills = ["", c.Y, c.y, c.field]
          for (let st = 1; st <= 3; st++) {
            fctx.beginPath()
            for (const [x, y] of paths[st]) box(fctx, x, y, grid.c, grid.c)
            fctx.fillStyle = fills[st]
            fctx.fill()
          }
        } else if (still) {
          fctx.globalAlpha = fade
          fctx.fillStyle = c.field
          fctx.fillRect(0, 0, cw, chh)
          fctx.globalAlpha = 1
        }
      }

      // -- the big bloom
      const bigGrow = ph === "load" ? shownRef.current : ph === "rest" || ph === "refill" ? 0 : 1
      if (bigGrow > 0) {
        const big = bigRef.current
        big.x = g.bx + g.u / 2
        big.y = g.by
        lean(big, g.by - 10 * g.u, 0.9)
        const mask =
          wave >= 0 && order
            ? (x: number, y: number) => {
                const k = Math.round((x - grid.ox) / grid.c)
                const r = Math.round((y - grid.oy) / grid.c)
                if (k < 0 || r < 0 || k >= grid.cols || r >= grid.rows) return 3
                return pxbCell(order![r * grid.cols + k], wave)
              }
            : null
        if (fade < 1) fctx.globalAlpha = fade
        drawSprite(fctx, "bloom", g.bx, g.by, g.u, bigGrow, big.lean * 0.6, mask)
        fctx.globalAlpha = 1
      }

      // -- pollen: a burst at the bloom, then a slow drift while it waits
      if (!still && (ph === "hold" || ph === "bloom") && now > nextMote) {
        nextMote = now + 260 + Math.random() * 420
        motesRef.current.push({
          x: g.bx + g.u / 2 + (Math.random() - 0.5) * g.u * 5,
          y: g.by - (SPRITES.bloom.h - 1) * g.u,
          vx: (Math.random() - 0.5) * 30,
          vy: -(28 + Math.random() * 40),
          born: now,
          life: 1600 + Math.random() * 1400,
          light: Math.random() < 0.7,
        })
      }
      if (motesRef.current.length) {
        const keep = [] as Mote[]
        const lightPath = [] as number[][]
        const bodyPath = [] as number[][]
        for (const m of motesRef.current) {
          const age = now - m.born
          if (age > m.life || ph === "lift" || ph === "rest" || ph === "refill" || ph === "load") continue
          m.vx *= Math.pow(0.12, dt)
          m.vy = m.vy * Math.pow(0.2, dt) + 26 * dt
          m.x += m.vx * dt + Math.sin((now + m.born) / 380) * 8 * dt
          m.y += m.vy * dt
          keep.push(m)
          // flicker out over the last third, like a sprite's dying frames
          const left = 1 - age / m.life
          if (left < 0.33 && Math.floor(now / 70 + m.born) % 2) continue
          const q = g.su
          ;(m.light ? lightPath : bodyPath).push([Math.round(m.x / q) * q, Math.round(m.y / q) * q])
        }
        motesRef.current = keep
        for (const [pathPts, col] of [[lightPath, c.Y], [bodyPath, c.y]] as [number[][], string][]) {
          fctx.beginPath()
          for (const [x, y] of pathPts) box(fctx, x, y, g.su, g.su)
          fctx.fillStyle = col
          fctx.fill()
        }
      }

      // -- the pixel count
      if (counterRef.current && (ph === "load" || (ph === "bloom" && since < 420))) {
        const text = pxbCount(Math.round(shownRef.current * 100))
        const q = Math.max(2, Math.round(g.su * 0.7))
        const total = Array.from(text).reduce((sum, ch) => sum + ((PXB_DIGITS[ch] || ["..."])[0].length + 1) * q, -q)
        let x = Math.round(g.W / 2 - total / 2)
        const y = Math.round(g.hintY - 2.5 * q)
        const blink = ph === "bloom" && Math.floor(since / 90) % 2 === 0
        if (!blink) {
          fctx.beginPath()
          for (const ch of text) {
            const glyph = PXB_DIGITS[ch]
            if (glyph) {
              for (let r = 0; r < 5; r++) for (let k = 0; k < glyph[r].length; k++) if (glyph[r][k] === "#") box(fctx, x + k * q, y + r * q, q, q)
            }
            x += ((glyph || ["..."])[0].length + 1) * q
          }
          fctx.fillStyle = c.text
          fctx.globalAlpha = 0.85
          fctx.fill()
          fctx.globalAlpha = 1
        }
      }

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [go, nLetters])

  // ---- input -----------------------------------------------------------------------------
  const plant = (x: number, y: number) => {
    const g = geoRef.current
    if (!g) return
    const list = plantedRef.current
    if (list.length >= MAX_PLANTED) list.shift()
    const k = list.length + cycle * 7
    list.push({
      x,
      y: y + 4.5 * g.su,
      kind: PXB_KINDS[Math.floor(pxbHash(x * 0.13 + y * 0.71 + k) * PXB_KINDS.length)],
      at: 0,
      born: performance.now(),
      dying: 0,
      lean: 0,
      vlean: (pxbHash(k * 3.1) - 0.5) * 10,
      seed: k * 1.3,
    })
  }

  const onActivate = (e: { clientX: number; clientY: number } | null) => {
    const ph = phaseRef.current
    if (ph === "load") {
      if (e && rootRef.current) {
        const r = rootRef.current.getBoundingClientRect()
        plant(e.clientX - r.left, e.clientY - r.top)
      } else rushRef.current = true
    } else if (ph === "bloom" || ph === "hold") go("lift")
  }

  const onPointerMove = (e: { clientX: number; clientY: number }) => {
    const root = rootRef.current
    if (!root) return
    const r = root.getBoundingClientRect()
    const x = e.clientX - r.left
    const y = e.clientY - r.top
    const now = performance.now()
    const prev = pointerRef.current
    const vx = prev ? ((x - prev.x) / Math.max(1, now - prev.t)) * 1000 : 0
    pointerRef.current = { x, y, vx: prev ? prev.vx * 0.5 + vx * 0.5 : 0, t: now }
  }

  // ---- render ----------------------------------------------------------------------------
  const ready = !!geo && fontsReady
  const label = word.trim() || "Page"
  // "There is no outside. Go back."
  const sentence = [[...items.before, word.trim()], items.after]
    .map((part) => part.filter(Boolean).join(" ").toLowerCase())
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1) + ".")
    .join(" ")
  const loading = phase === "load"

  // A row of small words: first flush left, last flush right. The middle ones
  // join up and sit just before the bloom above the word (like "IS" on the
  // poster), or centred below it.
  const row = (list: string[], which: "before" | "after", on: boolean, y: number) => {
    if (!geo || !list.length) return null
    const parts = list.length > 2 ? [list[0], list.slice(1, -1).join(" "), list[list.length - 1]] : list
    const base = which === "before" ? 0 : 3
    let typed = 0
    return (
      <div
        className="pxb-row"
        data-on={on}
        style={{ top: y, left: geo.wordL, width: geo.wordR - geo.wordL, fontSize: geo.rowF }}
        aria-hidden="true"
      >
        {parts.map((text, i) => {
          let pos: React.CSSProperties = { left: 0 }
          if (i === parts.length - 1 && i > 0) pos = { right: 0 }
          else if (i === 1) {
            pos =
              which === "before"
                ? { right: Math.max(0, geo.wordR - geo.midRight) }
                : { left: "50%", transform: "translateX(-50%)" }
          }
          const chars = Array.from(text)
          const start = typed
          typed += chars.length + 2
          return (
            <span
              key={i}
              className="pxb-item"
              style={pos}
              ref={(el) => {
                itemRefs.current[base + i] = el
              }}
            >
              {chars.map((ch, k) => (
                <span key={k} className="pxb-ch" style={{ "--pxb-d": (start + k) * 42 + "ms" } as React.CSSProperties}>
                  {ch}
                </span>
              ))}
              <span className="pxb-caret" style={{ "--pxb-d": typed * 42 + "ms" } as React.CSSProperties} />
            </span>
          )
        })}
      </div>
    )
  }

  const letters = split.chars.map((ch, i) => (
    <span key={i} className="pxb-lw">
      <span
        className="pxb-l"
        data-on={i < lit}
        style={{ "--pxb-drop": ((i * 53) % 260) + "ms" } as React.CSSProperties}
      >
        {ch === " " ? " " : ch}
      </span>
    </span>
  ))
  const slot = <span key="slot" ref={slotRef} className="pxb-slot" style={{ width: split.at < split.chars.length ? "0.3em" : "0.42em" }} />
  letters.splice(split.at, 0, slot)

  return (
    <div
      ref={rootRef}
      className={"pxb-root " + className}
      data-phase={phase}
      data-ready={ready}
      style={
        {
          height,
          "--pxb-field": colors.field,
          "--pxb-ink": colors.ink,
          "--pxb-serif": serif,
          "--pxb-sans": sans,
        } as React.CSSProperties
      }
      onPointerMove={onPointerMove}
      onPointerLeave={() => {
        pointerRef.current = null
      }}
    >
      <style>{PXB_CSS}</style>

      {!loop && children ? (
        <div
          ref={destRef}
          className="pxb-dest"
          data-active={phase === "lift" || phase === "done"}
          aria-hidden={phase !== "done"}
        >
          {children}
        </div>
      ) : null}

      {loop ? (
        <div className="pxb-after" aria-hidden="true">
          {sentence}
        </div>
      ) : null}

      {phase !== "done" ? (
        <div
          ref={gateRef}
          className="pxb-gate"
          role="progressbar"
          aria-label={label + " is loading"}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          aria-valuetext={loading ? pct + "%" : "Loaded. Press Enter to continue."}
          tabIndex={0}
          onClick={(e) => onActivate(e)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              onActivate(null)
            }
          }}
        >
          <canvas ref={backRef} className="pxb-canvas" aria-hidden="true" />

          <div ref={wordRef} className="pxb-word" aria-hidden="true" style={{ fontSize: F }}>
            {letters}
          </div>
          {row(items.before, "before", rows >= 1, geo ? geo.topY : 0)}
          {row(items.after, "after", rows >= 2, geo ? geo.botY : 0)}

          <canvas ref={frontRef} className="pxb-canvas" aria-hidden="true" />

          {geo ? (
            <div className="pxb-hint" style={{ top: geo.hintY - geo.rowF * 0.35, fontSize: Math.max(10, geo.rowF * 0.62) }}>
              {loop ? "Click to go back in" : "Click to enter"}
            </div>
          ) : null}

          <span className="pxb-sr" aria-live="polite">
            {loading ? "" : sentence}
          </span>
        </div>
      ) : null}
    </div>
  )
}
