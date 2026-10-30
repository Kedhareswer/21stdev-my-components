"use client"

// Venom Vial Preloader — a pixel-art phial fills with venom while a black widow
// spins it shut. Built as the gate in front of an animated portfolio.
//
//   arrive  the dark fills with spores; the glass is drawn in left to right by
//           a scanning pixel, the brass collar and the emerald stopper snap on,
//           and the widow abseils down on a thread onto the rounded end.
//   fill    venom pours in as a glowing plug, swirling, frothing at the front,
//           with vapour creeping ahead of it. The widow walks the glass with
//           the meniscus and wraps silk round everything behind her. A toxic
//           haze thickens behind the vial. A chunky pixel count reads it out.
//   brewed  at 100% the venom flashes, sparks fly, the widow climbs onto the
//           collar, and the vial waits: pull the stopper (or click) to go in.
//   uncork  the stopper pops and swings on its chain, venom fog floods the
//           screen from the neck, the widow climbs away up her thread, and the
//           fog thins out, dithered, onto whatever the gate was guarding. With
//           `loop`, the dark closes back in and it brews again.
//
// It is a toy while it loads: drag the stopper off on its chain (mist pours
// out; let go and it snaps home), swipe across the glass to slosh the venom,
// poke the widow, or drag a file onto it to feed the vial.
//
// One file, React only. Everything is drawn into a low-resolution pixel
// buffer and scaled up with `image-rendering: pixelated`; a second, blurred
// buffer carries only what glows. Labels use Pixelify Sans from Google Fonts by
// an injected <link> (fontHref={null} loads nothing).

import * as React from "react"

export interface VenomVialPalette {
  /** The dark behind everything. */
  void?: string
  /** The glass and the steel ring. */
  glass?: string
  /** The venom, its haze and the fog of the exit. */
  venom?: string
  /** The stopper's stone. */
  gem?: string
  /** The collar and the chain. */
  brass?: string
  /** The widow. */
  spider?: string
  /** Her hourglass and eyes. */
  mark?: string
  /** The silk she wraps the glass in. */
  silk?: string
}

export interface VenomVialPreloaderProps {
  /**
   * `upload` (default): the vial waits empty for a file. Drop one in (or click
   * to choose) and it pours, fills with the upload, reads "Upload complete",
   * pops its stopper and the widow rides the swinging stone.
   * `gate`: a page preloader. It fills on its own, waits for the stopper to be
   * pulled, then venom fog clears onto `children`.
   */
  mode?: "upload" | "gate"
  /** Content revealed once the fog clears (gate mode). Ignored while `loop` is set. */
  children?: React.ReactNode
  /** Gate: brew → uncork → clear, forever. Upload: plays a file being dragged in and the upload, forever. `onComplete` never fires. */
  loop?: boolean
  /** Real loading progress, 0–100. Leave undefined for a simulated load that surges and stalls. */
  progress?: number
  /** Length of the simulated load. */
  durationMs?: number
  /** Size readout under the count ("21.1 of 48.2 MB"). 0 hides it. */
  total?: number
  /** Unit for `total`. */
  unit?: string
  /** Shown under the count once the vial is full. Defaults to "Upload complete" (upload) or "Brewed. Ready when you are." (gate). */
  doneLabel?: string
  /** Upload mode: shown while the empty vial waits for a file. */
  idleLabel?: string
  /** Upload loop: name under the file the showcase drags in (its size is `total`). */
  demoFile?: string
  /** Shown at the foot while the full vial waits. */
  hint?: string
  /** Shown at the foot while loading. null hides it. */
  tip?: string | null
  /** Shown while a file is dragged over the vial. */
  dropLabel?: string
  /** Let files be dropped in to feed the vial (rushes the load to 100%). */
  feedable?: boolean
  /** Called with whatever was dropped in. */
  onFeed?: (files: File[]) => void
  /** Colour overrides, merged over the defaults. Hex colours. */
  palette?: VenomVialPalette
  /** Pixel size multiplier. 0.75 is finer, 1.5 chunkier. */
  pixel?: number
  /** Show the pixel count. */
  counter?: boolean
  /** Name announced by screen readers ("Portfolio is loading"). */
  label?: string
  /** Stylesheet for the label face. null loads nothing. */
  fontHref?: string | null
  /** Face for the labels. */
  font?: string
  /** Root height. A definite length, never a percentage. */
  height?: string
  /** Fired once: when the upload completes (upload), or after the fog has cleared (gate). */
  onComplete?: () => void
  /** Extra root class names. */
  className?: string
}

const DEFAULT_PALETTE = {
  void: "#06060d",
  glass: "#a6acb7",
  venom: "#5cf03d",
  gem: "#2fdc66",
  brass: "#e39a2d",
  spider: "#14141c",
  mark: "#e8233d",
  silk: "#eef7ef",
}

const FONT_HREF = "https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400;500&display=swap"
const LABEL_STACK = '"Pixelify Sans", "Silkscreen", ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace'

// #region vial
// Pure helpers, lifted out and executed by tests/venom-vial-preloader.test.mjs.

// 4×4 ordered dither, thresholds in (0, 1).
export const VV_BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16)

export function vvBayer(x: number, y: number) {
  return VV_BAYER[((y & 3) << 2) | (x & 3)]
}

export function vvHash(x: number, y: number) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263)) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

// Smooth value noise in [0, 1].
export function vvNoise(x: number, y: number) {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const xf = x - xi
  const yf = y - yi
  const u = xf * xf * (3 - 2 * xf)
  const v = yf * yf * (3 - 2 * yf)
  const a = vvHash(xi, yi)
  const b = vvHash(xi + 1, yi)
  const c = vvHash(xi, yi + 1)
  const d = vvHash(xi + 1, yi + 1)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}

export function vvFbm(x: number, y: number) {
  return vvNoise(x, y) * 0.62 + vvNoise(x * 2.03 + 17.1, y * 2.03 - 9.4) * 0.38
}

// A load that surges and stalls, but never runs backwards.
const VV_KEYS = [
  [0, 0],
  [0.16, 0.19],
  [0.27, 0.23],
  [0.47, 0.55],
  [0.6, 0.6],
  [0.8, 0.88],
  [0.9, 0.91],
  [1, 1],
]
export function vvSimulated(t: number) {
  if (!(t > 0)) return 0
  if (t >= 1) return 1
  for (let i = 1; i < VV_KEYS.length; i++) {
    const t1 = VV_KEYS[i][0]
    if (t <= t1) {
      const t0 = VV_KEYS[i - 1][0]
      const v0 = VV_KEYS[i - 1][1]
      const k = (t - t0) / (t1 - t0)
      return v0 + (VV_KEYS[i][1] - v0) * k * k * (3 - 2 * k)
    }
  }
  return 1
}

export function vvRgb(hex: string) {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(hex).trim())
  if (!m) return null
  const h = m[1].length === 3 ? m[1].split("").map((c) => c + c).join("") : m[1]
  const n = parseInt(h, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

// Mix toward white (amt > 0) or black (amt < 0). Non-hex passes through.
export function vvShade(hex: string, amt: number) {
  const c = vvRgb(hex)
  if (!c) return hex
  const t = amt < 0 ? 0 : 255
  const p = Math.min(1, Math.abs(amt))
  return "#" + c.map((v) => Math.round(v + (t - v) * p).toString(16).padStart(2, "0")).join("")
}

// The vial, in art pixels. s is how many CSS pixels one art pixel covers.
//   x0 rounded end · xs shoulder · xn neck · xc steel ring · xb brass collar · xg stopper centre
export const VV_R = 14
export const VV_TAIL = 50
export function vvLayout(W: number, H: number, pixel: number) {
  const s = Math.max(2, Math.round((Math.min(W, H * 1.7) / 420) * (pixel > 0 ? pixel : 1)))
  const BW = Math.max(1, Math.ceil(W / s))
  const BH = Math.max(1, Math.ceil(H / s))
  const wide = W > H
  const avail = Math.floor(BW * (wide ? 0.56 : 0.84))
  const L = Math.max(56, Math.min(210, avail - VV_TAIL))
  const x0 = Math.round((BW - (L + VV_TAIL)) / 2)
  const cy = Math.round(BH * (wide ? 0.44 : 0.42))
  const xs = x0 + L
  const xn = xs + 10
  const xc = xn + 6
  const xb = xc + 3
  const xg = xb + 7 + 12
  return { s, BW, BH, L, x0, cy, xs, xn, xc, xb, xg, end: xg + 12 }
}

// Outer radius of the silhouette at column x (pixel centre), or -1 off the vial.
export function vvOuter(v: { x0: number; xs: number; xn: number; xc: number; xb: number }, x: number) {
  if (x < v.x0 || x > v.xb + 7) return -1
  if (x < v.x0 + VV_R) {
    const d = v.x0 + VV_R - x
    return Math.sqrt(Math.max(0, VV_R * VV_R - d * d))
  }
  if (x <= v.xs) return VV_R
  if (x <= v.xn) return 6 + (VV_R - 6) * (0.5 + 0.5 * Math.cos((Math.PI * (x - v.xs)) / (v.xn - v.xs)))
  if (x <= v.xc) return 6
  if (x <= v.xb) return 8
  return 7
}

// Inner radius of the glass (where liquid can be), or -1.
export function vvInner(v: { x0: number; xs: number; xn: number; xc: number; xb: number }, x: number) {
  if (x < v.x0 || x >= v.xc) return -1
  if (x < v.x0 + VV_R) {
    const d = v.x0 + VV_R - x
    const r = VV_R - 2
    return d >= r ? -1 : Math.sqrt(r * r - d * d)
  }
  return vvOuter(v, x) - 2
}

// The stopper: an emerald-cut hexagon, pointed left and right. Facet codes:
// 0 outside · 1 girdle edge · 2 crown · 3 table · 4 right · 5 left · 6 pavilion · 7 glint · 8 table rim
export function vvGem(u: number, v: number) {
  const au = Math.abs(u)
  const av = Math.abs(v)
  if (av > 10.5 || au > 12.5 - 0.6 * av) return 0
  if (av > 9.5 || au > 11.3 - 0.6 * av) return 1
  if ((v > -3.6 && v < -2.4 && u > -3.6 && u < -0.4) || (u > -3.6 && u < -2.4 && v > -3.6 && v < -1)) return 7
  const tw = 5 - 0.2 * av
  if (au <= tw && av <= 4.5) return au > tw - 0.9 || av > 3.6 ? 8 : 3
  if (v < -4.5) return 2
  if (v > 4.5) return 6
  return u > 0 ? 4 : 5
}

// Chunky 5×7 digits for the count, and a small 4×4 percent sign.
export const VV_DIGITS = {
  "0": [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  "1": ["..#..", ".##..", "..#..", "..#..", "..#..", "..#..", ".###."],
  "2": [".###.", "#...#", "....#", "...#.", "..#..", ".#...", "#####"],
  "3": ["####.", "....#", "....#", ".###.", "....#", "....#", "####."],
  "4": ["...#.", "..##.", ".#.#.", "#..#.", "#####", "...#.", "...#."],
  "5": ["#####", "#....", "####.", "....#", "....#", "#...#", ".###."],
  "6": ["..##.", ".#...", "#....", "####.", "#...#", "#...#", ".###."],
  "7": ["#####", "....#", "...#.", "..#..", ".#...", ".#...", ".#..."],
  "8": [".###.", "#...#", "#...#", ".###.", "#...#", "#...#", ".###."],
  "9": [".###.", "#...#", "#...#", ".####", "....#", "...#.", ".##.."],
} as { [k: string]: string[] }
export const VV_PERCENT = ["#..#", "..#.", ".#..", "#..#"]

// Width in art pixels of the count at glyph scale k: digits, then a raised %.
export function vvCountWidth(text: string, k: number) {
  return text.length * 6 * k - k + 2 + VV_PERCENT[0].length
}

export function vvAmount(pct: number, total: number, unit: string) {
  if (!(total > 0) || !isFinite(total)) return ""
  const p = Math.max(0, Math.min(100, pct))
  return ((total * p) / 100).toFixed(1) + " of " + total.toFixed(1) + (unit ? " " + unit : "")
}

// The fog's dissolve: a pixel clears once k passes its blend of blotch noise
// and dither. k = 0 keeps everything, k = 1 clears everything.
export function vvVeil(n: number, b: number, k: number) {
  return n * 0.55 + b * 0.45 < k
}

// The widow's ride once an upload lands: she waits on the collar, climbs down
// the chain, rides the swinging stone, climbs back. Returns how far down the
// chain she is (0 collar, 1 on the stone) `ms` into the cycle.
export const VV_RIDE = [1200, 1500, 3200, 1500]
export function vvRide(ms: number) {
  const [wait, down, ride, up] = VV_RIDE
  const total = wait + down + ride + up
  const m = ((ms % total) + total) % total
  if (m < wait) return 0
  if (m < wait + down) return (m - wait) / down
  if (m < wait + down + ride) return 1
  return 1 - (m - wait - down - ride) / up
}

// The first pour: the stream runs from the neck to the far end. Returns its
// head's x, `k` (0 to 1) into the pour, easing out as it reaches the end.
export function vvStreamHead(k: number, from: number, to: number) {
  const e = 1 - Math.pow(1 - Math.max(0, Math.min(1, k)), 3)
  return from + (to - from) * e
}
// #endregion

const VV_CSS = `
.vvp-root {
  position: relative;
  width: 100%;
  overflow: hidden;
  isolation: isolate;
  -webkit-tap-highlight-color: transparent;
}
.vvp-root *, .vvp-root *::before, .vvp-root *::after { box-sizing: border-box; }
.vvp-dest {
  position: absolute;
  inset: 0;
  overflow-y: auto;
  opacity: 0;
  transform: scale(1.035);
  pointer-events: none;
}
.vvp-dest[data-active="true"] {
  opacity: 1;
  transform: none;
  pointer-events: auto;
  transition: transform 2.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.vvp-after {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  background: radial-gradient(120% 90% at 50% 45%, var(--vvp-haze) 0%, var(--vvp-void) 70%);
  color: var(--vvp-venom);
  font-family: var(--vvp-font);
  text-align: center;
  padding: 0 24px;
}
.vvp-after-big {
  font-size: clamp(22px, 4.4vmin, 46px);
  letter-spacing: 0.02em;
  text-shadow: 0 0 18px var(--vvp-venom);
}
.vvp-after-small {
  font-size: clamp(11px, 1.6vmin, 14px);
  letter-spacing: 0.24em;
  text-transform: uppercase;
  opacity: 0.55;
}

.vvp-gate {
  position: absolute;
  inset: 0;
  z-index: 10;
  background: var(--vvp-void);
  outline: none;
  user-select: none;
  -webkit-user-select: none;
  touch-action: none;
  overflow: hidden;
}
.vvp-gate:focus-visible::after {
  content: "";
  position: absolute;
  inset: 8px;
  border: 1px dashed var(--vvp-venom);
  opacity: 0.5;
  pointer-events: none;
}
.vvp-canvas {
  position: absolute;
  left: 0;
  top: 0;
  max-width: none;
  max-height: none;
  display: block;
  pointer-events: none;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}
.vvp-glow {
  position: absolute;
  left: 0;
  top: 0;
  max-width: none;
  max-height: none;
  display: block;
  pointer-events: none;
  mix-blend-mode: screen;
  opacity: 0.95;
}

.vvp-label, .vvp-hint {
  position: absolute;
  left: 0;
  right: 0;
  margin: 0;
  text-align: center;
  font-family: var(--vvp-font);
  white-space: nowrap;
  pointer-events: none;
  -webkit-font-smoothing: none;
  opacity: 0;
  transition: opacity 0.45s steps(3, end), color 0.3s ease;
}
.vvp-label { color: var(--vvp-muted); letter-spacing: 0.04em; }
.vvp-file { position: absolute; left: 0; top: 0; margin: 0; display: flex; flex-direction: column; align-items: center; gap: 0.1em; font-family: var(--vvp-font); line-height: 1.15; white-space: nowrap; pointer-events: none; transition: opacity 0.2s; }
.vvp-file span:first-child { color: var(--vvp-text); }
.vvp-file span:last-child { color: var(--vvp-muted); font-size: 0.85em; }
.vvp-label[data-on="true"] { opacity: 1; }
.vvp-label[data-tone="done"] { color: var(--vvp-text); }
.vvp-label[data-tone="drop"] { color: var(--vvp-venom-hi); text-shadow: 0 0 12px var(--vvp-venom); }
.vvp-hint {
  color: var(--vvp-muted);
  letter-spacing: 0.22em;
  text-transform: uppercase;
}
.vvp-hint[data-on="true"] { opacity: 0.6; }
.vvp-hint[data-on="true"][data-tone="call"] {
  color: var(--vvp-venom-hi);
  opacity: 0.9;
  animation: vvp-blink 2s steps(2, jump-none) 0.5s infinite;
}
.vvp-root[data-phase="lift"] .vvp-label,
.vvp-root[data-phase="lift"] .vvp-hint,
.vvp-root[data-phase="rest"] .vvp-label,
.vvp-root[data-phase="refill"] .vvp-label { opacity: 0; animation: none; transition: opacity 0.25s steps(2, end); }

.vvp-sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

@keyframes vvp-blink {
  0%, 100% { opacity: 0.9; }
  50% { opacity: 0.4; }
}

@media (prefers-reduced-motion: reduce) {
  .vvp-dest[data-active="true"] { transition: none; }
  .vvp-hint[data-on="true"][data-tone="call"] { animation: none; }
}
`

// ---- component ----------------------------------------------------------------

type Phase = "idle" | "pour" | "load" | "full" | "hold" | "lift" | "rest" | "refill" | "done"
type Lay = {
  s: number
  BW: number
  BH: number
  L: number
  x0: number
  cy: number
  xs: number
  xn: number
  xc: number
  xb: number
  xg: number
  end: number
}
type Star = { x: number; y: number; kind: number; ph: number; sp: number; tone: number }
type Spark = { x: number; y: number; vx: number; vy: number; born: number; life: number; kind: number; tone: number }
type Puff = { x: number; y: number; vx: number; vy: number; born: number; life: number; r0: number; r1: number }
type Bubble = { x: number; y: number; vy: number; ring: boolean }
type Flyer = { x: number; y: number; born: number }

const INTRO_MS = 1700
const FULL_MS = 1500
const HOLD_MS = 2800
const LIFT_MS = 3100
const FLOOD_MS = 1500
const FLOOD_AT = 380
const CLEAR_AT = 1650
const REST_MS = 1500
const REFILL_MS = 900
const POUR_MS = 800
const SHOW_MS = 9000
const AUTO_AT = 1400
const AUTO_HOVER = 1500
const CHAIN_LEN = 30
const CHAIN_N = 12
const GEM_A = [-6, 10]
const GRAVITY = 300
const SPIDER_Z = 1.6

const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t)
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
const easeBack = (t: number) => 1 + 2.4 * Math.pow(t - 1, 3) + 1.4 * Math.pow(t - 1, 2)

// ABGR, the byte order of an ImageData viewed as Uint32 on little-endian machines.
const pk = (hex: string) => {
  const c = vvRgb(hex) || [255, 0, 255]
  return ((255 << 24) | (c[2] << 16) | (c[1] << 8) | c[0]) >>> 0
}
const mixPk = (a: number, b: number, t: number) => {
  const r = (a & 255) + ((b & 255) - (a & 255)) * t
  const g = ((a >>> 8) & 255) + (((b >>> 8) & 255) - ((a >>> 8) & 255)) * t
  const bl = ((a >>> 16) & 255) + (((b >>> 16) & 255) - ((a >>> 16) & 255)) * t
  return ((255 << 24) | (Math.round(bl) << 16) | (Math.round(g) << 8) | Math.round(r)) >>> 0
}

export default function VenomVialPreloader({
  mode = "upload",
  children,
  loop = false,
  progress,
  durationMs = 5600,
  total = 48.2,
  unit = "MB",
  doneLabel,
  idleLabel = "Drop a file into the potion",
  demoFile = "spells.zip",
  hint = "Pull the stopper to enter",
  tip = "Tug the gem · drop a file in",
  dropLabel = "Release to drop it in",
  feedable = true,
  onFeed,
  palette,
  pixel = 1,
  counter = true,
  label = "Portfolio",
  fontHref = FONT_HREF,
  font = LABEL_STACK,
  height = "100svh",
  onComplete,
  className = "",
}: VenomVialPreloaderProps) {
  const upload = mode !== "gate"
  const doneText = doneLabel ?? (upload ? "Upload complete" : "Brewed. Ready when you are.")
  const firstPhase = (upload ? "idle" : "load") as Phase
  const [phase, setPhase] = React.useState(firstPhase)
  const [pct, setPct] = React.useState(0)
  const [arrived, setArrived] = React.useState(false)
  const [dragging, setDragging] = React.useState(false)
  const [fontsReady, setFontsReady] = React.useState(!fontHref)
  const [lay, setLay] = React.useState(null as Lay | null)

  const rootRef = React.useRef(null as HTMLDivElement | null)
  const gateRef = React.useRef(null as HTMLDivElement | null)
  const destRef = React.useRef(null as HTMLDivElement | null)
  const canvasRef = React.useRef(null as HTMLCanvasElement | null)
  const glowRef = React.useRef(null as HTMLCanvasElement | null)
  const phaseRef = React.useRef(firstPhase)
  const uploadRef = React.useRef(upload)
  uploadRef.current = upload
  const fileRef = React.useRef(null as HTMLInputElement | null)
  const phaseAtRef = React.useRef(0)
  const shownRef = React.useRef(0)
  const rushRef = React.useRef(false)
  const layRef = React.useRef(null as Lay | null)
  const dragRef = React.useRef(false)
  const pointerRef = React.useRef(null as { x: number; y: number; vx: number; t: number } | null)
  const progressRef = React.useRef(progress)
  progressRef.current = progress
  const onCompleteRef = React.useRef(onComplete)
  onCompleteRef.current = onComplete
  const onFeedRef = React.useRef(onFeed)
  onFeedRef.current = onFeed
  const loopRef = React.useRef(loop)
  loopRef.current = loop
  const durRef = React.useRef(durationMs)
  durRef.current = durationMs
  const counterRef = React.useRef(counter)
  counterRef.current = counter

  // the stopper on its chain, the widow, and everything that floats
  const gemRef = React.useRef({
    mode: "seat" as "seat" | "free" | "held" | "ret",
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    ang: 0,
    va: 0,
    gx: 0,
    gy: 0,
    offX: 0,
    offY: 0,
    pulled: 0,
  })
  const chainRef = React.useRef([] as { x: number; y: number; ox: number; oy: number }[])
  const spiderRef = React.useRef({ x: 0, y: -40, head: Math.PI / 2, gait: 0, mode: 0, vx: 0, hop: 0, hv: 0, landed: false, rideAt: 0, ride: 0 })
  // upload loop: a phantom file dragged in from the corner and dropped
  const autoRef = React.useRef({ stage: 0, at: 0, x: 0, y: 0 })
  const capRef = React.useRef(null as HTMLParagraphElement | null)
  const sloshRef = React.useRef({ a: 0, va: 0 })
  const sparksRef = React.useRef([] as Spark[])
  const puffsRef = React.useRef([] as Puff[])
  const bubblesRef = React.useRef([] as Bubble[])
  const flyersRef = React.useRef([] as Flyer[])
  const starsRef = React.useRef([] as Star[])

  const colors = React.useMemo(() => {
    const out = { ...DEFAULT_PALETTE } as { [k: string]: string }
    if (palette) {
      for (const k of Object.keys(palette)) {
        const val = (palette as { [k: string]: string | undefined })[k]
        if (val && vvRgb(val)) out[k] = val
      }
    }
    return out as typeof DEFAULT_PALETTE
  }, [palette])

  // every shade the frame loop paints with, packed once
  const K = React.useMemo(() => {
    const c = colors
    return {
      void: pk(c.void),
      starDim: pk(vvShade(c.glass, -0.55)),
      star: pk(vvShade(c.glass, 0.35)),
      glassHi: pk(vvShade(c.glass, 0.62)),
      glassTop: pk(vvShade(c.glass, 0.12)),
      glassEdge: pk(vvShade(c.glass, -0.22)),
      glassBot: pk(vvShade(c.glass, -0.42)),
      glassDeep: pk(vvShade(c.glass, -0.62)),
      glassIn: pk(vvShade(c.void, 0.07)),
      v2: pk(vvShade(c.venom, 0.62)),
      v1: pk(vvShade(c.venom, 0.3)),
      v0: pk(c.venom),
      vd1: pk(vvShade(c.venom, -0.24)),
      vd2: pk(vvShade(c.venom, -0.44)),
      vapor: pk(vvShade(c.venom, -0.5)),
      mist1: pk(vvShade(c.venom, -0.8)),
      mist2: pk(vvShade(c.venom, -0.68)),
      fog0: pk(vvShade(c.venom, -0.84)),
      fog1: pk(vvShade(c.venom, -0.72)),
      fog2: pk(vvShade(c.venom, -0.56)),
      g1: pk(vvShade(c.gem, -0.66)),
      g2: pk(vvShade(c.gem, 0.55)),
      g3: pk(vvShade(c.gem, 0.22)),
      g4: pk(c.gem),
      g5: pk(vvShade(c.gem, -0.3)),
      g6: pk(vvShade(c.gem, -0.52)),
      g7: pk(vvShade(c.gem, 0.85)),
      bD: pk(vvShade(c.brass, -0.5)),
      bM: pk(c.brass),
      bL: pk(vvShade(c.brass, 0.3)),
      bH: pk(vvShade(c.brass, 0.62)),
      sD: pk(vvShade(c.glass, -0.45)),
      sM: pk(vvShade(c.glass, -0.12)),
      sL: pk(vvShade(c.glass, 0.4)),
      body: pk(c.spider),
      rim: pk(vvShade(c.spider, 0.3)),
      edge: pk(vvShade(c.spider, 0.12)),
      gloss: pk(vvShade(c.spider, 0.62)),
      leg: pk(vvShade(c.spider, 0.2)),
      knee: pk(vvShade(c.spider, 0.4)),
      mark: pk(c.mark),
      markD: pk(vvShade(c.mark, -0.4)),
      silk: pk(c.silk),
      silkDim: pk(vvShade(c.silk, -0.4)),
      digit: pk(vvShade(c.silk, 0.4)),
      digitLo: pk(vvShade(c.glass, 0.25)),
      shadow: pk(vvShade(c.void, 0.14)),
      paper: pk("#f1f3f6"),
      paperD: pk("#b9bec8"),
      white: pk("#ffffff"),
    }
  }, [colors])
  const KRef = React.useRef(K)
  KRef.current = K

  const go = React.useCallback((next: Phase) => {
    phaseRef.current = next
    phaseAtRef.current = performance.now()
    setPhase(next)
  }, [])

  // ---- face: a <link> once per document, never a CSS import ---------------------------
  React.useEffect(() => {
    if (!fontHref) {
      setFontsReady(true)
      return
    }
    if (!document.querySelector('link[data-vvp-fonts="' + fontHref + '"]')) {
      const link = document.createElement("link")
      link.rel = "stylesheet"
      link.href = fontHref
      link.setAttribute("data-vvp-fonts", fontHref)
      document.head.appendChild(link)
    }
    let live = true
    const done = () => {
      if (live) setFontsReady(true)
    }
    const timer = setTimeout(done, 1600)
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts
    if (fonts && fonts.load) fonts.load('400 1em "Pixelify Sans"').then(done).catch(done)
    return () => {
      live = false
      clearTimeout(timer)
    }
  }, [fontHref])

  // ---- measure: the art grid follows the box ------------------------------------------------
  React.useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const measure = () => {
      const r = root.getBoundingClientRect()
      if (r.width <= 0 || r.height <= 0) return
      const next = vvLayout(r.width, r.height, pixel) as Lay
      const prev = layRef.current
      if (prev && prev.s === next.s && prev.BW === next.BW && prev.BH === next.BH) return
      layRef.current = next
      setLay(next)
      // spores and stars, scattered once per grid
      const stars = [] as Star[]
      const n = Math.round((next.BW * next.BH) / 620)
      for (let i = 0; i < n; i++) {
        const x = Math.floor(vvHash(i, 11) * next.BW)
        const y = Math.floor(vvHash(i, 23) * next.BH)
        const roll = vvHash(i, 37)
        const kind = roll < 0.62 ? 0 : roll < 0.8 ? 1 : roll < 0.9 ? 2 : 3
        if (kind === 2 && Math.abs(y - next.cy) < 26 && x > next.x0 - 12 && x < next.end + 12) continue
        stars.push({ x, y, kind, ph: vvHash(i, 51) * 6.28, sp: 0.6 + vvHash(i, 67) * 1.8, tone: Math.floor(vvHash(i, 79) * 3) })
      }
      starsRef.current = stars
      // the chain hangs from the collar to the stopper's lower corner
      const ax = next.xb + 3
      const ay = next.cy + 8
      const gx = next.xg + GEM_A[0]
      const gy = next.cy + GEM_A[1]
      chainRef.current = Array.from({ length: CHAIN_N }, (_, i) => {
        const t = i / (CHAIN_N - 1)
        const x = ax + (gx - ax) * t
        const y = ay + (gy - ay) * t + Math.sin(t * Math.PI) * 12
        return { x, y, ox: x, oy: y }
      })
      const gem = gemRef.current
      if (gem.mode === "seat") {
        gem.x = gx
        gem.y = gy
      }
    }
    measure()
    if (typeof ResizeObserver === "undefined") return
    const ro = new ResizeObserver(measure)
    ro.observe(root)
    return () => ro.disconnect()
  }, [pixel])

  // the guarded page can't take focus or clicks until the gate is gone
  React.useEffect(() => {
    destRef.current?.toggleAttribute("inert", phase !== "done" && phase !== "lift")
  }, [phase, children])

  // switching mode starts the vial over in that mode's first phase
  React.useEffect(() => {
    if (phaseRef.current !== firstPhase) go(firstPhase)
  }, [mode])

  // ---- reduced motion, tracked live -------------------------------------------------------
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

  // ---- the one frame loop -------------------------------------------------------------------
  React.useEffect(() => {
    let raf = 0
    let last = performance.now()
    let lastPct = -1
    let entered = "" as Phase | ""
    let img = null as ImageData | null
    let gimg = null as ImageData | null
    let buf = new Uint32Array(1)
    let gbuf = new Uint32Array(1)
    let nextPuff = 0
    let nextSpark = 0
    let nextBubble = 0
    let glintAt = 0
    let flash = 0
    let cone = 0
    let arrivedSent = false
    phaseAtRef.current = performance.now()

    const burst = (x: number, y: number, n: number, speed: number, now: number, spread: number) => {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2
        const sp = speed * (0.35 + Math.random() * 0.65)
        sparksRef.current.push({
          x: x + Math.cos(a) * spread * Math.random(),
          y: y + Math.sin(a) * spread * 0.4 * Math.random(),
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp * 0.75 - speed * 0.2,
          born: now,
          life: 700 + Math.random() * 1000,
          kind: Math.random() < 0.45 ? 1 : 0,
          tone: Math.floor(Math.random() * 4),
        })
      }
    }

    const enter = (ph: Phase, now: number) => {
      const v = layRef.current
      const gem = gemRef.current
      const sp = spiderRef.current
      const up = uploadRef.current
      if (up && (ph === "pour" || ph === "load")) {
        puffsRef.current = []
        if (gem.mode === "free") gem.mode = "ret"
        shownRef.current = 0
        rushRef.current = false
        lastPct = -1
        setPct(0)
      }
      if (ph === (up ? "idle" : "load")) {
        autoRef.current.stage = 0
        autoRef.current.at = now
        sp.rideAt = 0
        sp.ride = 0
        shownRef.current = 0
        rushRef.current = false
        lastPct = -1
        setPct(0)
        setArrived(false)
        arrivedSent = false
        sp.x = v ? v.x0 + 9 : 0
        sp.y = -40
        sp.mode = 0
        sp.head = Math.PI / 2
        sp.landed = false
        sp.vx = 0
        gem.mode = "seat"
        gem.ang = 0
        gem.va = 0
        sparksRef.current = []
        puffsRef.current = []
        bubblesRef.current = []
        flyersRef.current = []
        if (gateRef.current) {
          gateRef.current.style.background = ""
          gateRef.current.style.opacity = ""
        }
      }
      if (ph === "full" && v) {
        flash = 1
        if (!stillRef.current) burst(v.x0 + v.L * 0.55, v.cy, 46, 120, now, v.L * 0.5)
        sloshRef.current.va += 2.2
        if (up) {
          // the upload is in: the stopper pops off in a spray of sparks and swings on its chain
          gem.mode = "free"
          gem.vx = 55
          gem.vy = -150
          gem.va = 7
          if (!stillRef.current) {
            burst(v.xb + 8, v.cy - 6, 70, 170, now, 5)
            for (const s of sparksRef.current) if (s.born === now) s.vy -= 40
          }
          if (!loopRef.current) onCompleteRef.current?.()
        }
      }
      if (ph === "lift" && v) {
        if (gateRef.current) gateRef.current.style.background = "transparent"
        if (gem.mode === "seat" || gem.mode === "ret") {
          gem.mode = "free"
          gem.vx = 70
          gem.vy = -110
          gem.va = 6
        } else gem.mode = "free"
        if (!stillRef.current) burst(v.xb + 8, v.cy, 30, 150, now, 4)
        sp.mode = 2
      }
    }

    const tick = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000)
      last = now
      const v = layRef.current
      const cv = canvasRef.current
      const gl = glowRef.current
      const still = stillRef.current
      const t = still ? 0 : now / 1000

      if (phaseRef.current !== entered) {
        entered = phaseRef.current
        enter(entered, now)
      }
      const ph = phaseRef.current
      const since = now - phaseAtRef.current
      const up = uploadRef.current
      const arrival = up ? "idle" : "load"
      // in upload mode the arrival happens while idle, so the fill starts at once
      const intro = still || (up && ph === "load") ? 0 : INTRO_MS

      // -- progress, and the phase machine
      if (ph === "idle") {
        if (!arrivedSent && since > intro * 0.8) {
          arrivedSent = true
          setArrived(true)
        }
        // the showcase drags a file in by itself
        const auto = autoRef.current
        if (loopRef.current && auto.stage === 0 && since > intro + AUTO_AT && !dragRef.current) {
          auto.stage = 1
          auto.at = now
        } else if (auto.stage === 1 && now - auto.at > AUTO_HOVER + 900) {
          auto.stage = 2
          dragRef.current = false
          setDragging(false)
          flyersRef.current.push({ x: auto.x, y: auto.y, born: now })
          // the file is let go: the stone snaps back into the neck as it drops in
          if (gemRef.current.mode === "free") gemRef.current.mode = "ret"
        }
      } else if (ph === "pour" && since > (still ? 0 : POUR_MS)) go("load")
      else if (ph === "load") {
        const external = progressRef.current
        let target =
          external !== undefined
            ? clamp01(external / 100)
            : vvSimulated(Math.max(0, since - intro) / Math.max(600, durRef.current))
        if (since < intro) target = 0
        if (rushRef.current && since >= intro) target = 1
        const rate = rushRef.current ? 0.1 : external !== undefined ? 0.07 : 1
        let shown = shownRef.current
        shown += (target - shown) * Math.min(1, rate * (dt / 0.0167))
        if (Math.abs(target - shown) < 0.002) shown = target
        shownRef.current = shown
        const p = Math.round(shown * 100)
        if (p !== lastPct) {
          lastPct = p
          setPct(p)
        }
        if (!arrivedSent && since > intro * 0.8) {
          arrivedSent = true
          setArrived(true)
        }
        if (shown >= 1 && since > intro) go("full")
      } else if (ph === "full" && since > FULL_MS) go("hold")
      else if (up && ph === "hold") {
        if (loopRef.current && since > SHOW_MS && gemRef.current.mode !== "held") go("rest")
      } else if (ph === "hold" && since > HOLD_MS && gemRef.current.mode !== "held") go("lift")
      else if (ph === "lift" && since > LIFT_MS) {
        if (loopRef.current) go("rest")
        else {
          go("done")
          onCompleteRef.current?.()
          return
        }
      } else if (ph === "rest" && since > REST_MS) go("refill")
      else if (ph === "refill" && since > REFILL_MS) go(arrival)

      if (!v || !cv || !gl) {
        raf = requestAnimationFrame(tick)
        return
      }
      const { BW, BH, s, x0, cy, xs, xn, xc, xb } = v
      const c = KRef.current

      // -- buffers at art resolution
      if (cv.width !== BW || cv.height !== BH || !img) {
        cv.width = BW
        cv.height = BH
        gl.width = BW
        gl.height = BH
        cv.style.width = BW * s + "px"
        cv.style.height = BH * s + "px"
        gl.style.width = BW * s + "px"
        gl.style.height = BH * s + "px"
        gl.style.filter = "blur(" + Math.round(s * 4.5) + "px)"
        const cx0 = cv.getContext("2d")
        const gx0 = gl.getContext("2d")
        if (!cx0 || !gx0) {
          raf = requestAnimationFrame(tick)
          return
        }
        img = cx0.createImageData(BW, BH)
        gimg = gx0.createImageData(BW, BH)
        buf = new Uint32Array(img.data.buffer)
        gbuf = new Uint32Array(gimg!.data.buffer)
      }
      const put = (x: number, y: number, col: number) => {
        if (x >= 0 && y >= 0 && x < BW && y < BH) buf[(y | 0) * BW + (x | 0)] = col
      }
      const glow = (x: number, y: number, col: number) => {
        if (x >= 0 && y >= 0 && x < BW && y < BH) gbuf[(y | 0) * BW + (x | 0)] = col
      }
      const blend = (x: number, y: number, col: number, a: number) => {
        if (x >= 0 && y >= 0 && x < BW && y < BH) {
          const i = (y | 0) * BW + (x | 0)
          buf[i] = mixPk(buf[i], col, a)
        }
      }
      const line = (ax: number, ay: number, bx: number, by: number, col: number) => {
        let x = Math.round(ax)
        let y = Math.round(ay)
        const x1 = Math.round(bx)
        const y1 = Math.round(by)
        const dx = Math.abs(x1 - x)
        const dy = -Math.abs(y1 - y)
        const sx = x < x1 ? 1 : -1
        const sy = y < y1 ? 1 : -1
        let err = dx + dy
        for (let k = 0; k < 200; k++) {
          put(x, y, col)
          if (x === x1 && y === y1) break
          const e2 = 2 * err
          if (e2 >= dy) {
            err += dy
            x += sx
          }
          if (e2 <= dx) {
            err += dx
            y += sy
          }
        }
      }

      const shown = ph === "load" ? shownRef.current : ph === "rest" || ph === "refill" || ph === "idle" || ph === "pour" ? 0 : 1
      const loadLike = ph === "load" || ph === "idle" || ph === "pour"
      const introP = ph === arrival ? (still ? 1 : clamp01((since - 80) / 1000)) : 1
      const lifting = ph === "lift"
      flash = Math.max(0, flash - dt * 1.4)

      // ---- simulation ------------------------------------------------------------------------
      const ptr = pointerRef.current
      const slosh = sloshRef.current
      if (ptr && !still && now - ptr.t < 120 && Math.abs(ptr.y - cy) < 26 && ptr.x > x0 - 6 && ptr.x < xn) {
        slosh.va += Math.max(-1, Math.min(1, ptr.vx / 220)) * dt * 26
      }
      slosh.va += (-slosh.a * 38 - slosh.va * 3.6) * dt
      slosh.a = Math.max(-1.2, Math.min(1.2, slosh.a + slosh.va * dt))
      if (still) slosh.a = 0

      // the stopper
      const gem = gemRef.current
      const ax = xb + 3
      const ay = cy + 8
      const homeX = v.xg + GEM_A[0]
      const homeY = cy + GEM_A[1]
      const gemIn = ph === arrival ? (still ? 1 : clamp01((since - 980) / 420)) : 1
      const doneUp = up && (ph === "full" || ph === "hold")
      if (gem.mode === "seat") {
        gem.x = homeX
        gem.y = homeY
        gem.vx = 0
        gem.vy = 0
      } else if (gem.mode === "held") {
        const tx = gem.gx
        const ty = gem.gy
        const nx = gem.x + (tx - gem.x) * Math.min(1, dt * 22)
        const ny = gem.y + (ty - gem.y) * Math.min(1, dt * 22)
        gem.vx = (nx - gem.x) / Math.max(dt, 0.001)
        gem.vy = (ny - gem.y) / Math.max(dt, 0.001)
        gem.x = nx
        gem.y = ny
      } else if (gem.mode === "free") {
        // after an upload the loose stone keeps a lazy swing going
        if (doneUp && !still) gem.vx += Math.sin(t * 1.35) * 16 * dt
        gem.vy += GRAVITY * dt
        gem.vx *= Math.pow(0.55, dt)
        gem.vy *= Math.pow(0.55, dt)
        gem.x += gem.vx * dt
        gem.y += gem.vy * dt
      } else {
        // springs home, critically damped-ish
        gem.vx += ((homeX - gem.x) * 140 - gem.vx * 17) * dt
        gem.vy += ((homeY - gem.y) * 140 - gem.vy * 17) * dt
        gem.x += gem.vx * dt
        gem.y += gem.vy * dt
        if (Math.hypot(homeX - gem.x, homeY - gem.y) < 0.45 && Math.hypot(gem.vx, gem.vy) < 8 && Math.abs(gem.ang) < 0.05) {
          gem.mode = "seat"
          gem.ang = 0
          gem.va = 0
          glintAt = now
          slosh.va += 0.8
        }
      }
      if (gem.mode !== "seat") {
        const dx = gem.x - ax
        const dy = gem.y - ay
        const d = Math.hypot(dx, dy)
        if (d > CHAIN_LEN) {
          const nx = dx / d
          const ny = dy / d
          gem.x = ax + nx * CHAIN_LEN
          gem.y = ay + ny * CHAIN_LEN
          const vr = gem.vx * nx + gem.vy * ny
          if (vr > 0) {
            gem.vx -= nx * vr
            gem.vy -= ny * vr
          }
        }
        gem.pulled = Math.hypot(gem.x - homeX, gem.y - homeY)
      } else gem.pulled = 0

      // the chain: a slack verlet rope pinned at the collar and the stopper
      const chain = chainRef.current
      if (chain.length === CHAIN_N) {
        const seg = CHAIN_LEN / (CHAIN_N - 1)
        for (let i = 1; i < CHAIN_N - 1; i++) {
          const n = chain[i]
          const vx = (n.x - n.ox) * 0.96
          const vy = (n.y - n.oy) * 0.96
          n.ox = n.x
          n.oy = n.y
          n.x += vx
          n.y += vy + GRAVITY * 0.6 * dt * dt
        }
        for (let it = 0; it < 12; it++) {
          chain[0].x = ax
          chain[0].y = ay
          chain[CHAIN_N - 1].x = gem.x
          chain[CHAIN_N - 1].y = gem.y
          for (let i = 0; i < CHAIN_N - 1; i++) {
            const a = chain[i]
            const b = chain[i + 1]
            const dx = b.x - a.x
            const dy = b.y - a.y
            const d = Math.hypot(dx, dy) || 0.0001
            if (d <= seg) continue
            const f = (d - seg) / d
            const wa = i === 0 ? 0 : i + 1 === CHAIN_N - 1 ? 1 : 0.5
            const wb = i + 1 === CHAIN_N - 1 ? 0 : i === 0 ? 1 : 0.5
            a.x += dx * f * wa
            a.y += dy * f * wa
            b.x -= dx * f * wb
            b.y -= dy * f * wb
          }
        }
      }
      // the stone hangs off its corner when it is loose
      {
        let target = 0
        if (gem.mode === "free" || gem.mode === "held") {
          const prev = chain[CHAIN_N - 2] || { x: ax, y: ay }
          let dx = gem.x - prev.x
          let dy = gem.y - prev.y
          const d = Math.hypot(dx, dy) || 1
          dx /= d
          dy /= d
          const taut = clamp01((Math.hypot(gem.x - ax, gem.y - ay) / CHAIN_LEN - 0.55) / 0.4)
          dx = dx * taut
          dy = dy * taut + (1 - taut)
          target = Math.atan2(-dy, -dx) - Math.atan2(GEM_A[1], GEM_A[0])
        }
        let diff = target - gem.ang
        diff = Math.atan2(Math.sin(diff), Math.cos(diff))
        gem.va += (diff * 70 - gem.va * 7) * dt
        gem.ang += gem.va * dt
        if (still) gem.ang = target
      }
      const ca = Math.cos(gem.ang)
      const sa = Math.sin(gem.ang)
      const gcx = gem.x - (ca * GEM_A[0] - sa * GEM_A[1])
      const gcy = gem.y - (sa * GEM_A[0] + ca * GEM_A[1])
      const open = gem.mode !== "seat" && gem.pulled > 3

      // the widow
      const sp = spiderRef.current
      const fillStart = x0 + 2
      const fillEnd = xn + 3
      const xf = fillStart + (fillEnd - fillStart) * shown
      const surfaceY = (x: number) => cy - Math.max(3, vvOuter(v, x)) + 3.5
      if (sp.mode === 0) {
        // abseil onto the rounded end
        const landX = x0 + 9
        const landY = surfaceY(landX)
        const k = still ? 1 : clamp01((since - 650) / 900)
        sp.x = landX
        sp.y = -24 + (landY + 24) * easeBack(k)
        sp.head = Math.PI / 2 + (Math.atan2(-(vvOuter(v, landX + 1) - vvOuter(v, landX - 1)), 2) - Math.PI / 2) * clamp01((k - 0.85) / 0.15)
        if (k >= 1) {
          sp.mode = 1
          sp.landed = true
          slosh.va -= 0.6
        }
      } else if (sp.mode === 1 && doneUp && Math.abs(sp.x - (xb + 3)) < 1.5 && since > 1400) {
        // on the collar after an upload: start the ride down the chain
        sp.mode = 3
        sp.rideAt = now
      } else if (sp.mode === 3) {
        // down the chain, onto the swinging stone, and back up
        const u = still ? 0 : vvRide(now - sp.rideAt)
        const pts = chain.length === CHAIN_N ? chain : [{ x: ax, y: ay }]
        const f = u * (pts.length - 1)
        const i0 = Math.min(pts.length - 1, Math.floor(f))
        const i1 = Math.min(pts.length - 1, i0 + 1)
        const k = f - i0
        let px = pts[i0].x + (pts[i1].x - pts[i0].x) * k
        let py = pts[i0].y + (pts[i1].y - pts[i0].y) * k
        let dir = Math.atan2(pts[i1].y - pts[i0].y, pts[i1].x - pts[i0].x)
        if (u >= 1) {
          // sitting on the stone, head down its face
          px = gcx
          py = gcy - 6
          dir = Math.PI / 2
        }
        const goingUp = u > sp.ride + 1e-4 ? false : u < sp.ride - 1e-4
        sp.gait += Math.abs(u - sp.ride) * 40
        sp.ride = u
        sp.x = px
        sp.y = py
        const head = goingUp ? dir + Math.PI : dir
        let d = head - sp.head
        d = Math.atan2(Math.sin(d), Math.cos(d))
        sp.head += d * Math.min(1, dt * 10)
        if (!doneUp) {
          sp.mode = 1
          sp.x = xb + 3
        }
      } else if (sp.mode === 1) {
        const tx = loadLike ? Math.max(x0 + 9, Math.min(xn - 2, xf + 1)) : xb + 3
        const want = Math.max(-1, Math.min(1, (tx - sp.x) / 6))
        const maxV = loadLike ? 58 : 40
        sp.vx += (want * maxV - sp.vx) * Math.min(1, dt * 7)
        if (still) {
          sp.x = tx
          sp.vx = 0
        } else sp.x += sp.vx * dt
        sp.gait += Math.abs(sp.vx) * dt * 0.55
        const slope = -(vvOuter(v, sp.x + 1.5) - vvOuter(v, sp.x - 1.5)) / 3
        const head = Math.atan(slope) * 0.8
        sp.head += (head - sp.head) * Math.min(1, dt * 9)
        sp.hv += (GRAVITY * 1.4) * dt
        sp.hop = Math.min(0, sp.hop + sp.hv * dt)
        if (sp.hop >= 0) sp.hv = 0
        sp.y = surfaceY(sp.x) + sp.hop
      } else {
        // climb away up the thread
        const k = clamp01((since - 220) / 1100)
        sp.head += (-Math.PI / 2 - sp.head) * Math.min(1, dt * 8)
        sp.y -= (40 + 260 * k * k) * dt
        sp.gait += dt * 14
      }

      // ---- paint -----------------------------------------------------------------------------
      if (ph === "rest") {
        buf.fill(0)
        gbuf.fill(0)
      } else {
        buf.fill(c.void)
        gbuf.fill(0)

        // spores and stars
        const starOn = ph === arrival ? clamp01(since / 700) : 1
        for (const st of starsRef.current) {
          const tw = 0.5 + 0.5 * Math.sin(t * st.sp + st.ph)
          if (tw * starOn < 0.25) continue
          if (st.kind === 0) put(st.x, st.y, tw > 0.75 ? c.star : c.starDim)
          else if (st.kind === 1) {
            const col = st.tone === 0 ? c.v1 : st.tone === 1 ? c.bL : c.star
            put(st.x, st.y, col)
            if (tw > 0.85) glow(st.x, st.y, col)
          } else if (st.kind === 2) {
            const col = st.tone === 0 ? c.v2 : st.tone === 1 ? c.bH : c.glassHi
            put(st.x, st.y, col)
            if (tw > 0.55) {
              put(st.x - 1, st.y, c.vd1)
              put(st.x + 1, st.y, c.vd1)
              put(st.x, st.y - 1, c.vd1)
              put(st.x, st.y + 1, c.vd1)
              glow(st.x, st.y, col)
            }
          } else {
            // spores drift up and sideways
            const yy = ((((st.y - t * st.sp * 3) % BH) + BH) % BH) | 0
            const xx = (st.x + Math.sin(t * 0.7 + st.ph) * 3) | 0
            put(xx, yy, c.vd2)
            put(xx + 1, yy, c.vd2)
            put(xx, yy + 1, c.vd2)
            put(xx + 1, yy + 1, c.vapor)
            glow(xx, yy, c.vd2)
          }
        }

        if (ph !== "refill") {
          // -- the toxic haze behind the vial: ridged ribbons that thicken with the venom
          const hz = (0.18 + 0.82 * shown) * introP + (open ? 0.25 : 0)
          if (hz > 0.02) {
            const hx0 = Math.max(0, x0 - 34)
            const hx1 = Math.min(BW - 1, v.end + 34)
            const hy0 = Math.max(0, cy - 44)
            const hy1 = Math.min(BH - 1, cy + 44)
            const mx = (x0 + v.end) / 2
            const hw = (v.end - x0) / 2 + 34
            for (let y = hy0; y <= hy1; y++) {
              const ey = (y - cy) / 44
              for (let x = hx0; x <= hx1; x++) {
                const ex = (x - mx) / hw
                const fall = 1 - ex * ex - ey * ey * 1.15
                if (fall <= 0) continue
                const n = vvFbm(x * 0.034 + t * 0.07, y * 0.075 + Math.sin(x * 0.021 + t * 0.4) * 0.7 - t * 0.05)
                const r = 1 - Math.abs(n - 0.5) * 3.4
                if (r <= 0) continue
                const val = r * r * Math.min(1, fall * 1.6) * hz
                const b = vvBayer(x, y)
                if (val > b * 0.7 + 0.2) {
                  const col = val > 0.62 ? c.mist2 : c.mist1
                  buf[y * BW + x] = col
                  gbuf[y * BW + x] = col
                }
              }
            }
          }

          // -- the vial
          const revealX = x0 + introP * (xb + 8 - x0)
          const wrapX = loadLike ? (sp.landed && sp.mode === 1 ? sp.x - 5 : x0 - 20) : xn + 2
          // the first pour: a stream runs from the neck to the far end, then thins as the fill takes over
          const streamA = !up ? 0 : ph === "pour" ? 1 : ph === "load" ? clamp01(1 - shown * 3.2) : 0
          const streamHead = ph === "pour" ? vvStreamHead(since / POUR_MS, xn + 2, fillStart + 2) : fillStart + 2
          const P = 15
          const sl = slosh.a
          const wob = still ? 0 : 0.45 + Math.min(1.2, Math.abs(slosh.va) * 0.35)
          for (let x = x0; x < xc; x++) {
            if (x >= revealX) break
            if (x < 0 || x >= BW) continue
            const ro = vvOuter(v, x + 0.5)
            if (ro <= 0) continue
            const ri = vvInner(v, x + 0.5)
            const yTop = Math.ceil(cy - ro - 0.5)
            const yBot = Math.floor(cy + ro - 0.5)
            for (let y = yTop; y <= yBot; y++) {
              if (y < 0 || y >= BH) continue
              const dy = y + 0.5 - cy
              const ady = Math.abs(dy)
              if (ady > ro) continue
              const i = y * BW + x
              const b = vvBayer(x, y)
              if (ri > 0 && ady < ri) {
                // interior
                const ny = dy / ri
                const front = xf + sl * ny * 5 + Math.sin(y * 0.9 + t * 7) * wob
                if (x < front && shown > 0) {
                  if (x >= front - 1.3) {
                    buf[i] = c.v2
                    gbuf[i] = c.v1
                  } else {
                    const n = vvNoise(x * 0.11 - t * 0.9, y * 0.24 + Math.sin(x * 0.07 + t * 1.3) * 0.9)
                    let l = 0.55 - ny * 0.28 + (n - 0.5) * 0.7 + flash * 0.45
                    if (ny < -0.62) l += 0.32
                    if (ny > 0.66) l -= 0.22
                    const q = l + (b - 0.5) * 0.24
                    const col = q > 0.98 ? c.v2 : q > 0.7 ? c.v1 : q > 0.4 ? c.v0 : q > 0.2 ? c.vd1 : c.vd2
                    buf[i] = col
                    gbuf[i] = q > 0.4 ? c.v0 : c.vd1
                  }
                } else {
                  buf[i] = c.glassIn
                  if (streamA > 0 && x >= streamHead && x < xn + 3) {
                    // a mottled ribbon of venom low in the glass, fattest at the neck
                    const n = vvNoise(x * 0.09 - t * 2.4, y * 0.3 + t * 0.6)
                    const thick = (0.22 + 0.3 * n + 0.18 * clamp01((x - streamHead) / 30)) * streamA
                    const mid = 0.32 + Math.sin(x * 0.07 - t * 3) * 0.12
                    const dd = Math.abs(ny - mid)
                    if (dd < thick && n + (b - 0.5) * 0.3 > 0.22) {
                      const q = n - dd * 0.8 + (x - streamHead < 3 ? 0.4 : 0)
                      buf[i] = q > 0.75 ? c.v2 : q > 0.5 ? c.v1 : q > 0.3 ? c.v0 : c.vd1
                      gbuf[i] = c.v0
                      continue
                    }
                  }
                  // vapour creeping ahead of the front
                  if (shown > 0.005) {
                    const ahead = x - front
                    const dens = Math.exp(-ahead / 16) * vvFbm(x * 0.13 - t * 1.6, y * 0.3 + t * 0.4) * 1.25
                    if (dens > b * 0.9 + 0.12) {
                      buf[i] = dens > 0.55 ? c.vd2 : c.vapor
                      gbuf[i] = c.vapor
                    }
                  }
                }
              } else {
                // the wall: lit from above, a hard edge on the outside
                const outer = ady > ro - 1
                const top = dy < 0
                let col = top ? (outer ? c.glassEdge : c.glassTop) : outer ? c.glassDeep : c.glassBot
                if (x < x0 + 3 && !outer) col = c.glassTop
                if (!outer && x < xf && shown > 0) {
                  col = mixPk(col, c.v1, 0.45)
                  gbuf[i] = c.vd1
                }
                buf[i] = col
              }
              // silk, wound round everything behind the widow
              if (x < wrapX && x < xn - 1) {
                const k = x - x0 + dy * 0.55
                const idx = Math.floor(k / P)
                const m = k - idx * P
                if (m < 2 && idx * P + x0 + ro * 0.55 < wrapX) {
                  const fresh = ph === "load" && idx * P + x0 + ro * 0.55 > wrapX - P
                  buf[i] = m < 1 ? (fresh ? c.white : c.silk) : mixPk(buf[i], c.silkDim, 0.7)
                }
              }
            }
          }
          // glass highlights: a long streak along the top, broken towards the neck
          {
            const yh = cy - VV_R + 3
            const segs = [
              [x0 + 7, x0 + v.L * 0.5],
              [x0 + v.L * 0.56, x0 + v.L * 0.63],
              [x0 + v.L * 0.67, x0 + v.L * 0.7],
              [xs - 4, xs - 1],
            ]
            for (const [a, b] of segs) for (let x = Math.round(a); x < b && x < revealX; x++) blend(x, yh, c.glassHi, 0.8)
            for (let x = x0 + 12; x < xs - 8 && x < revealX; x++) if ((x >> 2) % 3 !== 0) blend(x, cy + VV_R - 4, c.glassHi, 0.16)
            if (revealX > x0 + 4) {
              blend(x0 + 3, cy - 5, c.glassHi, 0.7)
              blend(x0 + 3, cy - 4, c.glassHi, 0.7)
              blend(x0 + 4, cy - 7, c.glassHi, 0.6)
            }
          }
          // the drawing pixel, while it draws
          if (introP > 0 && introP < 1) {
            const rx = Math.floor(revealX)
            const ro = vvOuter(v, rx)
            if (ro > 0) {
              for (const yy of [cy - ro, cy + ro - 1]) {
                put(rx, Math.round(yy), c.white)
                glow(rx, Math.round(yy), c.v1)
              }
            }
          }

          // bubbles inside the venom
          if (!still && shown > 0.04 && ph !== "lift" && now > nextBubble) {
            nextBubble = now + 90 + Math.random() * (260 - Math.min(200, Math.abs(slosh.va) * 80))
            const bx = fillStart + 3 + Math.random() * Math.max(1, xf - fillStart - 6)
            const ri = vvInner(v, bx)
            if (ri > 2) bubblesRef.current.push({ x: bx, y: cy + ri - 1.5, vy: -(5 + Math.random() * 9), ring: Math.random() < 0.3 })
          }
          bubblesRef.current = bubblesRef.current.filter((bb) => {
            bb.y += bb.vy * dt
            bb.x += Math.sin(t * 3 + bb.y) * 2 * dt + slosh.a * 4 * dt
            const ri = vvInner(v, bb.x)
            if (ri <= 0 || bb.y < cy - ri + 1.5 || bb.x >= xf - 1) return false
            const bx = Math.round(bb.x)
            const by = Math.round(bb.y)
            if (bb.ring) {
              put(bx - 1, by, c.v2)
              put(bx + 1, by, c.v2)
              put(bx, by - 1, c.v2)
              put(bx, by + 1, c.v2)
            } else put(bx, by, c.v2)
            return true
          })

          // -- mist pours from the open neck
          // upload: while a file hovers, a soft cone of venom light fans out of the open neck
          cone += ((up && ph === "idle" && dragRef.current ? 1 : 0) - cone) * Math.min(1, dt * 7)
          if (up && cone > 0.01) {
            const mx = xb + 7
            const len = 46
            for (let x = mx; x < mx + len && x < BW; x++) {
              const d = (x - mx) / len
              const half = 3 + d * 17
              for (let y = Math.floor(cy - half); y <= cy + half; y++) {
                if (y < 0 || y >= BH) continue
                const ey = Math.abs(y + 0.5 - cy) / half
                const a = (1 - d) * (1 - ey * ey) * cone
                if (a <= 0) continue
                const i = y * BW + x
                gbuf[i] = a > 0.45 ? c.v1 : a > 0.2 ? c.v0 : c.vd1
                // a fine drift of motes in the beam
                const n = vvNoise(x * 0.35 - t * 3.2, y * 0.35 + t * 0.8)
                if (n * a > 0.42 + vvBayer(x, y) * 0.25) buf[i] = n > 0.75 ? c.v2 : c.v1
                else if (a > 0.3) buf[i] = mixPk(buf[i], c.vd1, a * 0.5)
              }
            }
          }
          if (!still && !up && (open || lifting) && now > nextPuff) {
            const jet = lifting && since < 1000
            nextPuff = now + (jet ? 12 : 45)
            const mx = xb + 7
            const n = jet ? 3 : 1
            for (let i = 0; i < n; i++) {
              const a = (Math.random() - 0.5) * (jet ? 1.6 : 0.9) - 0.15
              const spd = (jet ? 70 : 26) + Math.random() * (jet ? 90 : 26)
              puffsRef.current.push({
                x: mx,
                y: cy + (Math.random() - 0.5) * 6,
                vx: Math.cos(a) * spd,
                vy: Math.sin(a) * spd - 6,
                born: now,
                life: (jet ? 1300 : 1500) + Math.random() * 600,
                r0: 2,
                r1: jet ? 22 + Math.random() * 14 : 10 + Math.random() * 8,
              })
            }
          }
          if (puffsRef.current.length) {
            const keep = [] as Puff[]
            for (const p of puffsRef.current) {
              const age = (now - p.born) / p.life
              if (age >= 1) continue
              keep.push(p)
              p.vx *= Math.pow(0.4, dt)
              p.vy = p.vy * Math.pow(0.5, dt) - 10 * dt
              p.x += p.vx * dt
              p.y += p.vy * dt
              const r = p.r0 + (p.r1 - p.r0) * easeOut(age)
              const dens = (1 - age) * 0.95
              const px0 = Math.floor(p.x - r)
              const py0 = Math.floor(p.y - r)
              for (let y = py0; y <= p.y + r; y++) {
                if (y < 0 || y >= BH) continue
                for (let x = px0; x <= p.x + r; x++) {
                  if (x < 0 || x >= BW) continue
                  const d = Math.hypot(x + 0.5 - p.x, y + 0.5 - p.y) / r
                  if (d >= 1) continue
                  const n = vvNoise(x * 0.2 + p.born * 0.01, y * 0.2 - t)
                  const a = (1 - d * d) * dens * (0.15 + n * 1.25)
                  const b = vvBayer(x, y)
                  if (a > b + 0.06) {
                    const i = y * BW + x
                    buf[i] = a > b + 0.45 ? c.vd1 : a > b + 0.2 ? c.vd2 : c.vapor
                    gbuf[i] = a > b + 0.3 ? c.v0 : c.vd2
                  }
                }
              }
            }
            puffsRef.current = keep
          }

          // -- steel ring and brass collar
          if (introP >= 1 || revealX > xc) {
            for (let x = xc; x < xb + 7; x++) {
              if (x >= revealX + 1) break
              const steel = x < xb
              const rr = steel ? 8 : 7
              const col = x - (steel ? xc : xb)
              for (let y = cy - rr; y < cy + rr; y++) {
                const dy = y + 0.5 - cy
                const corner = Math.abs(dy) > rr - 1 && (col === 0 || (steel ? col === 2 : col === 6))
                if (corner) continue
                let base
                if (steel) base = col === 1 ? c.sL : col === 0 ? c.sM : c.sD
                else base = [c.bD, c.bL, c.bM, c.bD, c.bH, c.bM, c.bD][col]
                if (dy < -rr + 2.5) base = mixPk(base, c.white, steel ? 0.15 : 0.28)
                if (dy > rr - 3) base = mixPk(base, c.void, 0.45)
                put(x, y, base)
              }
            }
            // a glint where the light catches the brass
            const gb = 0.5 + 0.5 * Math.sin(t * 1.7)
            if (gb > 0.8) {
              put(xb + 4, cy - 5, c.white)
              glow(xb + 4, cy - 5, c.bH)
            }
          }

          // -- the chain
          if (gemIn > 0 && chain.length === CHAIN_N) {
            for (let i = 0; i < CHAIN_N - 1; i++) {
              const a = chain[i]
              const b = chain[i + 1]
              line(a.x + 0.6, a.y + 0.8, b.x + 0.6, b.y + 0.8, c.bD)
              line(a.x, a.y, b.x, b.y, c.bM)
            }
            for (let i = 1; i < CHAIN_N - 1; i++) {
              const n = chain[i]
              const nx = Math.round(n.x)
              const ny = Math.round(n.y)
              if (i % 2) {
                put(nx - 1, ny, c.bL)
                put(nx, ny - 1, c.bH)
                put(nx + 1, ny, c.bM)
                put(nx, ny + 1, c.bD)
                put(nx, ny, c.void)
              } else {
                put(nx, ny, c.bH)
                put(nx + 1, ny, c.bL)
              }
              glow(nx, ny, c.bD)
            }
          }

          // -- the stopper
          if (gemIn > 0) {
            const sc = still ? 1 : easeBack(gemIn)
            const rad = 14 * Math.max(0.2, sc)
            const gcol = [0, c.g1, c.g2, c.g3, c.g4, c.g5, c.g6, c.g7, c.g5]
            const gx0 = Math.floor(gcx - rad)
            const gy0 = Math.floor(gcy - rad)
            for (let y = gy0; y <= gcy + rad; y++) {
              for (let x = gx0; x <= gcx + rad; x++) {
                const dx = (x + 0.5 - gcx) / sc
                const dy = (y + 0.5 - gcy) / sc
                const u = dx * ca + dy * sa
                const w = -dx * sa + dy * ca
                const f = vvGem(u, w)
                if (!f) continue
                let col = gcol[f]
                // a slow band of light slides across the table
                if (f === 3 && Math.abs(u + w * 0.6 - ((t * 5) % 30) + 12) < 1.2) col = c.g2
                put(x, y, col)
                if (f !== 1 && f !== 6) glow(x, y, f === 7 ? c.g2 : c.g4)
              }
            }
            // a sparkle crosses the stone now and then, and when it seats
            const g = (now - glintAt) / 520
            const idle = (t % 3.6) / 0.5
            const k = g < 1 ? g : idle < 1 ? idle : -1
            if (k >= 0 && !still) {
              const arm = Math.round(Math.sin(k * Math.PI) * 3)
              const sx0 = Math.round(gcx + 4 * ca - -5 * sa)
              const sy0 = Math.round(gcy + 4 * sa + -5 * ca)
              for (let a = -arm; a <= arm; a++) {
                put(sx0 + a, sy0, c.white)
                put(sx0, sy0 + a, c.white)
                glow(sx0 + a, sy0, c.g7)
                glow(sx0, sy0 + a, c.g7)
              }
            }
          }

          // -- silk she throws over the stone while she rides it
          if (sp.mode === 3 && sp.ride >= 1) {
            const strands = [
              [-10, -4, 9, 6],
              [-9, 5, 8, -6],
              [-3, -9, 2, 9],
              [-11, 1, 11, -1],
            ]
            for (const [a1, b1, a2, b2] of strands) {
              const p1x = gcx + a1 * ca - b1 * sa
              const p1y = gcy + a1 * sa + b1 * ca
              const p2x = gcx + a2 * ca - b2 * sa
              const p2y = gcy + a2 * sa + b2 * ca
              const n = Math.max(1, Math.round(Math.hypot(p2x - p1x, p2y - p1y)))
              for (let q = 0; q <= n; q++) {
                const px = Math.round(p1x + ((p2x - p1x) * q) / n)
                const py = Math.round(p1y + ((p2y - p1y) * q) / n)
                if (q % 3 !== 1) blend(px, py, c.silk, 0.55)
              }
            }
          }

          // -- the widow, and her thread
          if (sp.mode === 0 || sp.mode === 2) {
            const tx = Math.round(sp.x)
            const ty = Math.round(sp.y + (sp.mode === 0 ? -8 * SPIDER_Z : 0))
            for (let y = 0; y < ty; y++) put(tx, y, (y + Math.floor(t * 20)) % 9 < 6 ? c.silkDim : c.silk)
          }
          if (sp.y > -16) {
            const near = ptr && Math.hypot(ptr.x - sp.x, ptr.y - sp.y) < 40
            drawSpider(sp.x, sp.y, sp.head, still ? 0 : sp.gait, near ? c.v1 : c.mark)
          }

          // -- the showcase's phantom file: dragged up from the corner, hovered at the neck, dropped
          {
            const auto = autoRef.current
            if (auto.stage === 1 && ph === "idle") {
              const k = still ? 1 : clamp01((now - auto.at) / 900)
              const e = ease(k)
              const sx0 = Math.max(6, x0 - 40)
              const sy0 = Math.min(BH - 12, cy + 70)
              const hx = xb + 22 + Math.sin(t * 2.2) * 2
              const hy = cy + 4 + Math.sin(t * 3.1) * 1.5
              auto.x = sx0 + (hx - sx0) * e
              auto.y = sy0 + (hy - sy0) * e - Math.sin(k * Math.PI) * 14
              if (k > 0.7 && !dragRef.current) {
                // close enough: the neck opens for it
                dragRef.current = true
                setDragging(true)
                if (gem.mode === "seat" || gem.mode === "ret") {
                  gem.mode = "free"
                  gem.vx = 60
                  gem.vy = -70
                }
              }
              pointerRef.current = { x: auto.x, y: auto.y, vx: 0, t: now }
              drawFile(auto.x, auto.y, 1.25)
              const cap = capRef.current
              if (cap) {
                cap.style.opacity = dragRef.current ? "0.75" : "1"
                cap.style.transform = "translate(" + Math.round(auto.x * s) + "px," + Math.round((auto.y + 15) * s) + "px) translateX(-50%)"
              }
            } else if (capRef.current && capRef.current.style.opacity !== "0") {
              capRef.current.style.opacity = "0"
            }
          }

          // -- a fed file, falling into the neck
          if (flyersRef.current.length) {
            flyersRef.current = flyersRef.current.filter((f) => {
              const k = clamp01((now - f.born) / 700)
              if (k >= 1) {
                if (up) {
                  if (phaseRef.current === "idle") go("pour")
                } else rushRef.current = true
                sloshRef.current.va += 3
                burst(xb + 8, cy, 18, 90, now, 3)
                if (gemRef.current.mode === "free") gemRef.current.mode = "ret"
                return false
              }
              const e = ease(k)
              const fx = f.x + (xb + 9 - f.x) * e
              const fy = f.y + (cy - f.y) * e - Math.sin(k * Math.PI) * 18
              const sc = 1 - e * 0.85
              drawFile(fx, fy, sc)
              return true
            })
          }

          // -- sparks
          if (!still && (ph === "hold" || ph === "full") && now > nextSpark) {
            nextSpark = now + 260 + Math.random() * 380
            burst(x0 + Math.random() * (v.end - x0), cy + (Math.random() - 0.5) * 50, 1, 14, now, 10)
          }
          if (sparksRef.current.length) {
            const keep = [] as Spark[]
            for (const p of sparksRef.current) {
              const age = (now - p.born) / p.life
              if (age >= 1) continue
              keep.push(p)
              p.vx *= Math.pow(0.18, dt)
              p.vy = p.vy * Math.pow(0.18, dt) + 6 * dt
              p.x += p.vx * dt
              p.y += p.vy * dt
              if (age > 0.66 && Math.floor(now / 60 + p.born) % 2) continue
              const col = p.tone === 0 ? c.v2 : p.tone === 1 ? c.bH : p.tone === 2 ? c.white : c.v1
              const x = Math.round(p.x)
              const y = Math.round(p.y)
              put(x, y, col)
              glow(x, y, col)
              if (p.kind === 1 && age < 0.6) {
                put(x - 1, y, col)
                put(x + 1, y, col)
                put(x, y - 1, col)
                put(x, y + 1, col)
              }
            }
            sparksRef.current = keep
          }

          // -- the count
          const showCount = counterRef.current && !dragRef.current && (ph === "pour" || ph === "load" || ph === "full" || ph === "hold")
          if (showCount && (ph !== "load" || since > intro * 0.75)) {
            const blink = ph === "full" && since < 520 && Math.floor(since / 90) % 2 === 0
            if (!blink) {
              const text = String(Math.round(shown * 100))
              const k = 2
              const w = vvCountWidth(text, k)
              let x = Math.round(BW / 2 - w / 2)
              const y = cy + VV_R + 12
              for (const ch of text) {
                const glyph = VV_DIGITS[ch]
                for (let r = 0; r < 7; r++) {
                  for (let q = 0; q < 5; q++) {
                    if (glyph[r][q] !== "#") continue
                    for (let a = 0; a < k; a++) {
                      for (let bb = 0; bb < k; bb++) {
                        const px = x + q * k + a
                        const py = y + r * k + bb
                        if (buf[(py + 1) * BW + px + 1] !== c.digit && buf[(py + 1) * BW + px + 1] !== c.digitLo) put(px + 1, py + 1, c.shadow)
                        put(px, py, r < 4 ? c.digit : c.digitLo)
                      }
                    }
                  }
                }
                x += 6 * k
              }
              x += 2 - k
              for (let r = 0; r < 4; r++) for (let q = 0; q < 4; q++) if (VV_PERCENT[r][q] === "#") put(x + q, y + r, c.digitLo)
            }
          }
        }

        // ---- the exit: venom fog floods out of the neck, then thins away
        if (lifting && !still) {
          const mx = xb + 7
          const maxD = Math.hypot(Math.max(mx, BW - mx), Math.max(cy, BH - cy) * 1.25)
          const front = ease(clamp01((since - FLOOD_AT) / FLOOD_MS)) * maxD * 1.25
          const k = ease(clamp01((since - CLEAR_AT) / (LIFT_MS - CLEAR_AT - 80)))
          for (let y = 0; y < BH; y++) {
            const ddy = (y - cy) * 1.25
            for (let x = 0; x < BW; x++) {
              const i = y * BW + x
              const b = vvBayer(x, y)
              const n = vvNoise(x * 0.05 + t * 0.35, y * 0.05 - t * 0.2)
              if (k > 0 && vvVeil(n, b, k)) {
                buf[i] = 0
                gbuf[i] = 0
                continue
              }
              const d = Math.hypot(x - mx, ddy) + (vvNoise(x * 0.022 + 40, y * 0.03 - t * 0.5) - 0.5) * 70
              const cov = (front - d) / 30 + (n - 0.5) * 0.7
              if (cov > b) {
                // dark venom smoke, ridged strands curling through it
                const sw = vvFbm(x * 0.028 - t * 0.25, y * 0.05 + Math.sin(x * 0.018 + t * 0.6) * 0.8 + t * 0.12)
                const strand = Math.max(0, 1 - Math.abs(sw - 0.5) * 5)
                const q = strand * 0.85 + (n - 0.5) * 0.3 + (b - 0.5) * 0.3
                const edge = cov < b + 0.14 && front < maxD * 1.1
                const col = edge ? c.vd1 : q > 0.7 ? c.fog2 : q > 0.3 ? c.fog1 : c.fog0
                buf[i] = col
                gbuf[i] = edge ? c.v0 : q > 0.62 ? c.fog1 : 0
              }
            }
          }
        }
        if (lifting && still && gateRef.current) gateRef.current.style.opacity = String(1 - clamp01(since / 600))
        if (ph === "refill") {
          const k = 1 - ease(clamp01(since / REFILL_MS))
          if (still && gateRef.current) gateRef.current.style.opacity = String(1 - k)
          else {
            for (let y = 0; y < BH; y++) {
              for (let x = 0; x < BW; x++) {
                if (vvVeil(vvNoise(x * 0.05, y * 0.05), vvBayer(x, y), k)) {
                  buf[y * BW + x] = 0
                  gbuf[y * BW + x] = 0
                }
              }
            }
          }
        }
      }

      const ctx = cv.getContext("2d")
      const gctx = gl.getContext("2d")
      if (ctx && img) ctx.putImageData(img, 0, 0)
      if (gctx && gimg) gctx.putImageData(gimg, 0, 0)
      raf = requestAnimationFrame(tick)

      // ---- sprites ----------------------------------------------------------------------------
      function drawSpider(sx: number, sy: number, th: number, gait: number, eye: number) {
        const z = SPIDER_Z
        const co = Math.cos(th)
        const si = Math.sin(th)
        const W = (lx: number, ly: number) => [sx + (lx * co - ly * si) * z, sy + (lx * si + ly * co) * z]
        // eight legs, two joints each, stepping in alternating fours
        const spread = [0.5, 1.12, 1.9, 2.5]
        const femur = [6, 5.2, 5.2, 6.4]
        const tibia = [7.5, 5.5, 5.5, 7.5]
        for (let side = -1; side <= 1; side += 2) {
          for (let i = 0; i < 4; i++) {
            const phs = gait * 2 + ((i + (side > 0 ? 0 : 1)) % 2) * Math.PI
            const step = Math.sin(phs) * 1.5
            const lift = Math.max(0, Math.cos(phs))
            const a = spread[i]
            const rx = 2.4 - i * 0.75
            const ry = side * 1.3
            const ka = a - 0.42
            const kx = rx + Math.cos(ka) * femur[i] + step * 0.5
            const ky = ry + side * Math.sin(ka) * femur[i] * (1 + lift * 0.12)
            const fa = a + 0.5
            const fx = kx + Math.cos(fa) * tibia[i] + step
            const fy = ky + side * Math.sin(fa) * tibia[i] * (1 - lift * 0.1)
            const [r0x, r0y] = W(rx, ry)
            const [k0x, k0y] = W(kx, ky)
            const [f0x, f0y] = W(fx, fy)
            line(r0x, r0y, k0x, k0y, c.leg)
            line(k0x, k0y, f0x, f0y, c.leg)
            put(Math.round(k0x), Math.round(k0y), c.knee)
            put(Math.round(k0x), Math.round(k0y) - 1, c.knee)
          }
        }
        // abdomen, thorax and head, rim-lit from the top left
        const acx = -4.9
        const [awx, awy] = W(acx, 0)
        const reach = 9.5 * z
        for (let y = Math.floor(sy - reach); y <= sy + reach; y++) {
          for (let x = Math.floor(sx - reach); x <= sx + reach; x++) {
            const dx = (x + 0.5 - sx) / z
            const dy = (y + 0.5 - sy) / z
            const lx = dx * co + dy * si
            const ly = -dx * si + dy * co
            const ea = ((lx - acx) / 5.6) ** 2 + (ly / 4.9) ** 2
            const et = ((lx - 1.9) / 3.1) ** 2 + (ly / 2.3) ** 2
            if (ea <= 1) {
              let col = c.body
              const ox = x + 0.5 - awx
              const oy = y + 0.5 - awy
              const lit = (ox * -0.6 + oy * -0.8) / (5 * z)
              if (ea > 0.62) col = lit > 0.25 ? c.rim : lit < -0.45 ? c.edge : col
              const du = lx - acx
              if (Math.abs(du) <= 2.6 && Math.abs(ly) <= 0.55 + Math.abs(du) * 0.8 && Math.abs(ly) <= 2.2) {
                col = Math.abs(du) > 1.7 && Math.abs(ly) > Math.abs(du) * 0.8 - 0.35 ? c.markD : c.mark
                glow(x, y, c.markD)
              }
              put(x, y, col)
            } else if (et <= 1) {
              const lit = (x + 0.5 - sx) * -0.6 + (y + 0.5 - sy) * -0.8
              put(x, y, et > 0.55 ? (lit > 1 ? c.rim : c.edge) : c.body)
            }
          }
        }
        const [gx1, gy1] = W(acx - 1.4, -1.2)
        put(Math.round(gx1 - 2), Math.round(gy1 - 2), c.gloss)
        put(Math.round(gx1 - 1), Math.round(gy1 - 2), c.rim)
        put(Math.round(gx1 - 2), Math.round(gy1 - 1), c.rim)
        for (const side of [-0.85, 0.85]) {
          const [ex, ey] = W(4.2, side)
          put(Math.round(ex), Math.round(ey), eye)
          glow(Math.round(ex), Math.round(ey), eye)
        }
      }

      // a zip file the way a desktop draws one: a page with a dog-eared corner,
      // a zipper down its middle and a green "zip" tag across the foot
      function drawFile(fx: number, fy: number, sc: number) {
        const w = Math.max(3, Math.round(15 * sc))
        const h = Math.max(4, Math.round(19 * sc))
        const x1 = Math.round(fx - w / 2)
        const y1 = Math.round(fy - h / 2)
        const fold = Math.max(1, Math.round(5 * sc))
        const zx = Math.round(w * 0.42)
        const tagY = Math.round(h * 0.66)
        const tagH = Math.max(1, Math.round(4 * sc))
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const inFold = x >= w - fold && y < fold
            if (inFold && x - (w - fold) > y) continue
            let col = c.paper
            // a rounded outline, darker down the right and along the foot
            if (x === 0 || y === 0 || (inFold && x - (w - fold) === y)) col = c.paperD
            if (x === w - 1 || y === h - 1) col = c.paperD
            if ((x === 0 || x === w - 1) && (y === 0 || y === h - 1)) continue
            // the turned-down corner
            if (inFold && x - (w - fold) < y) col = mixPk(c.paper, c.paperD, 0.6)
            // the zipper: alternating teeth down the middle of the top half
            if (sc >= 0.6 && y >= 2 && y < tagY - 2 && (x === zx || x === zx + 1)) {
              if ((y + (x === zx ? 0 : 1)) % 2 === 0) col = c.paperD
            }
            // the green tag, with "zip" picked out in its darker shade
            if (y >= tagY && y < tagY + tagH && x >= 2 && x < w - 2) {
              col = c.v0
              if (sc >= 0.9 && y === tagY + 1 && tagH >= 3 && x >= Math.round(w / 2) - 3 && x <= Math.round(w / 2) + 3 && x % 2 === 0) col = c.vd2
            }
            put(x1 + x, y1 + y, col)
            if (col === c.v0) glow(x1 + x, y1 + y, c.v0)
          }
        }
        // a soft drop shadow so it reads as lifted off the dark
        for (let x = 1; x < w; x++) blend(x1 + x, y1 + h, c.void, 0.6)
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [go])

  // ---- input ------------------------------------------------------------------------------------
  const toArt = (e: { clientX: number; clientY: number }) => {
    const root = rootRef.current
    const v = layRef.current
    if (!root || !v) return null
    const r = root.getBoundingClientRect()
    return { x: (e.clientX - r.left) / v.s, y: (e.clientY - r.top) / v.s }
  }
  const gemCentre = () => {
    const g = gemRef.current
    const ca = Math.cos(g.ang)
    const sa = Math.sin(g.ang)
    return { x: g.x - (ca * GEM_A[0] - sa * GEM_A[1]), y: g.y - (sa * GEM_A[0] + ca * GEM_A[1]) }
  }
  const live = () => {
    const ph = phaseRef.current
    return ph === "idle" || ph === "pour" || ph === "load" || ph === "full" || ph === "hold"
  }
  const uncork = () => {
    const ph = phaseRef.current
    if (!uploadRef.current && (ph === "full" || ph === "hold")) go("lift")
  }
  // upload: a file goes in from wherever it came from, and the vial is only fed while it waits
  const feed = (files: File[], from: { x: number; y: number } | null) => {
    const v = layRef.current
    if (!live() || (uploadRef.current && phaseRef.current !== "idle")) return
    const p = from || (v ? { x: v.x0 + (v.end - v.x0) / 2, y: v.cy + VV_R + 40 } : null)
    if (p) flyersRef.current.push({ x: p.x, y: p.y, born: performance.now() })
    if (uploadRef.current && gemRef.current.mode === "free") gemRef.current.mode = "ret"
    if (files.length) onFeedRef.current?.(files)
  }
  const choose = () => {
    if (uploadRef.current && phaseRef.current === "idle" && feedable) fileRef.current?.click()
  }

  const onPointerDown = (e: React.PointerEvent) => {
    const p = toArt(e)
    const v = layRef.current
    if (!p || !v || !live()) return
    const gc = gemCentre()
    const gem = gemRef.current
    if (Math.hypot(p.x - gc.x, p.y - gc.y) < 15 && (phaseRef.current !== "load" || performance.now() - phaseAtRef.current > 1400)) {
      gem.mode = "held"
      gem.gx = gem.x
      gem.gy = gem.y
      gem.offX = gem.x - p.x
      gem.offY = gem.y - p.y
      try {
        ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
      } catch {}
      if (gateRef.current) gateRef.current.style.cursor = "grabbing"
      return
    }
    const sp = spiderRef.current
    if (sp.mode === 1 && Math.hypot(p.x - sp.x, p.y - sp.y) < 16) {
      sp.hv = -95
      sp.hop = -0.01
      return
    }
    if (phaseRef.current === "idle") {
      choose()
      return
    }
    if (phaseRef.current === "load" || phaseRef.current === "pour") {
      if (Math.abs(p.y - v.cy) < 18 && p.x > v.x0 && p.x < v.xn) sloshRef.current.va += p.x < v.x0 + (v.xn - v.x0) / 2 ? 2.4 : -2.4
      return
    }
    uncork()
  }

  const onPointerMove = (e: React.PointerEvent) => {
    const p = toArt(e)
    if (!p) return
    const now = performance.now()
    const prev = pointerRef.current
    const vx = prev ? ((p.x - prev.x) / Math.max(1, now - prev.t)) * 1000 : 0
    pointerRef.current = { x: p.x, y: p.y, vx: prev ? prev.vx * 0.5 + vx * 0.5 : 0, t: now }
    const gem = gemRef.current
    if (gem.mode === "held") {
      gem.gx = p.x + gem.offX
      gem.gy = p.y + gem.offY
      return
    }
    // a loose stone can be batted about
    if (gem.mode === "free" && pointerRef.current) {
      const gc = gemCentre()
      if (Math.hypot(p.x - gc.x, p.y - gc.y) < 13) {
        gem.vx += Math.max(-160, Math.min(160, pointerRef.current.vx * 0.35))
        gem.vy -= 25
      }
    }
    if (gateRef.current) {
      const gc = gemCentre()
      const over = live() && Math.hypot(p.x - gc.x, p.y - gc.y) < 15
      const ph = phaseRef.current
      gateRef.current.style.cursor = over ? "grab" : ph === "full" || ph === "hold" ? "pointer" : ""
    }
  }

  const onPointerUp = () => {
    const gem = gemRef.current
    if (gem.mode !== "held") return
    const ph = phaseRef.current
    const done = ph === "full" || ph === "hold"
    if (uploadRef.current && done) gem.mode = "free"
    else if (done && gem.pulled > CHAIN_LEN * 0.5) {
      gem.mode = "free"
      go("lift")
    } else gem.mode = dragRef.current ? "free" : "ret"
    if (gateRef.current) gateRef.current.style.cursor = ""
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "Enter" && e.key !== " ") return
    e.preventDefault()
    if (phaseRef.current === "idle") choose()
    else if (phaseRef.current === "load") rushRef.current = true
    else uncork()
  }

  // files: hovering one pops the stopper; dropping it in feeds the vial
  const hasFiles = (e: React.DragEvent) => !!e.dataTransfer && Array.from(e.dataTransfer.types || []).indexOf("Files") > -1
  const onDragOver = (e: React.DragEvent) => {
    if (!feedable || !hasFiles(e) || !live()) return
    if (uploadRef.current && phaseRef.current !== "idle") return
    e.preventDefault()
    e.dataTransfer.dropEffect = "copy"
    const p = toArt(e)
    if (p) pointerRef.current = { x: p.x, y: p.y, vx: 0, t: performance.now() }
    if (!dragRef.current) {
      dragRef.current = true
      setDragging(true)
      const gem = gemRef.current
      if (gem.mode === "seat" || gem.mode === "ret") {
        gem.mode = "free"
        gem.vx = 60
        gem.vy = -70
      }
    }
  }
  const endDrag = () => {
    if (!dragRef.current) return
    dragRef.current = false
    setDragging(false)
    const gem = gemRef.current
    if (gem.mode === "free" && phaseRef.current !== "lift") gem.mode = "ret"
  }
  const onDragLeave = (e: React.DragEvent) => {
    const root = rootRef.current
    const to = e.relatedTarget as Node | null
    if (root && to && root.contains(to)) return
    endDrag()
  }
  const onDrop = (e: React.DragEvent) => {
    if (!feedable || !hasFiles(e)) return
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files || [])
    const p = toArt(e)
    dragRef.current = false
    setDragging(false)
    feed(files, p)
  }

  // ---- render -------------------------------------------------------------------------------------
  const ready = !!lay && fontsReady
  const idle = phase === "idle"
  const loading = phase === "load" || phase === "pour"
  const brewed = phase === "full" || phase === "hold"
  const amount = vvAmount(pct, total, unit)
  const labelText = dragging ? dropLabel : idle ? idleLabel : loading ? amount : brewed ? doneText : ""
  const labelTone = dragging ? "drop" : brewed ? "done" : "load"
  const hintText = upload ? "" : brewed ? hint : loading && tip ? tip : ""
  const s = lay ? lay.s : 3
  const labelTop = lay ? (lay.cy + VV_R + 12 + (counter && !dragging && !idle ? 22 : 2)) * s : 0
  const labelSize = Math.max(11, Math.round(s * 4.2))
  const hintTop = lay ? Math.min(lay.BH * s - labelSize * 3.4, labelTop + labelSize * 4.2 + s * 18) : 0

  return (
    <div
      ref={rootRef}
      className={"vvp-root " + className}
      data-phase={phase}
      data-ready={ready}
      style={
        {
          height,
          "--vvp-void": colors.void,
          "--vvp-venom": colors.venom,
          "--vvp-venom-hi": vvShade(colors.venom, 0.45),
          "--vvp-haze": vvShade(colors.venom, -0.8),
          "--vvp-text": vvShade(colors.silk, 0.2),
          "--vvp-muted": vvShade(colors.glass, -0.12),
          "--vvp-font": font,
        } as React.CSSProperties
      }
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <style>{VV_CSS}</style>

      {!loop && children ? (
        <div
          ref={destRef}
          className="vvp-dest"
          data-active={phase === "lift" || phase === "done"}
          aria-hidden={phase !== "done"}
        >
          {children}
        </div>
      ) : null}

      {loop ? (
        <div className="vvp-after" aria-hidden="true">
          <div className="vvp-after-big">{doneText}</div>
          <div className="vvp-after-small">Brewing again</div>
        </div>
      ) : null}

      {phase !== "done" ? (
        <div
          ref={gateRef}
          className="vvp-gate"
          role="progressbar"
          aria-label={upload ? label + " upload" : label + " is loading"}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          aria-valuetext={idle ? idleLabel + ". Press Enter to choose a file." : loading ? pct + "%" : upload ? doneText : "Loaded. Press Enter to continue."}
          tabIndex={0}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onPointerLeave={() => {
            pointerRef.current = null
          }}
          onKeyDown={onKeyDown}
        >
          <canvas ref={canvasRef} className="vvp-canvas" aria-hidden="true" />
          <canvas ref={glowRef} className="vvp-glow" aria-hidden="true" />

          {lay ? (
            <p
              className="vvp-label"
              data-on={ready && !!labelText && (arrived || (!loading && !idle))}
              data-tone={labelTone}
              style={{ top: labelTop, fontSize: labelSize }}
              aria-hidden="true"
            >
              {labelText || " "}
            </p>
          ) : null}
          {lay ? (
            <p
              className="vvp-hint"
              data-on={ready && !!hintText && (arrived || !loading)}
              data-tone={brewed ? "call" : "tip"}
              style={{ top: hintTop, fontSize: Math.max(11, Math.round(labelSize * 0.8)) }}
              aria-hidden="true"
            >
              {hintText || " "}
            </p>
          ) : null}

          {upload && loop ? (
            <p ref={capRef} className="vvp-file" style={{ fontSize: Math.max(10, Math.round(s * 3.2)), opacity: 0 }} aria-hidden="true">
              <span>{demoFile}</span>
              <span>{total > 0 ? total.toFixed(1) + (unit ? " " + unit : "") : ""}</span>
            </p>
          ) : null}
          <span className="vvp-sr" aria-live="polite">
            {brewed ? (upload ? doneText + "." : doneText + " " + hint + ".") : ""}
          </span>
          {upload && feedable ? (
            <input
              ref={fileRef}
              type="file"
              multiple
              className="vvp-sr"
              tabIndex={-1}
              aria-hidden="true"
              onChange={(e) => {
                const files = Array.from(e.target.files || [])
                e.target.value = ""
                if (files.length) feed(files, null)
              }}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
