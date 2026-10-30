"use client"

// Gilded Lotus Preloader — a loading gate painted on blush linen. A gold
// stem rises from the bottom of the frame; where it stops, ink bleeds out
// into a moon. Round the moon a ring of gold leaf is laid down stroke by
// stroke, and the ring is the progress bar: it sweeps three quarters of a
// turn from eight o'clock, the brush running dry into long rays at its
// leading edge. Out of the ink a lotus bud rises on the stem and opens,
// petal by petal, as the load climbs. At 100 a light runs round the gilding;
// then the ink floods the frame, the gold lifts off as flakes, a title card
// sets itself in the dark, and the dark parts onto the page.
//
// One file, React only. Three stacked 2D canvases (linen, ink, gold) and
// one SVG (the lotus). Every rule in the scoped <style> is .glp- prefixed
// and nothing is fetched.

import * as React from "react"

export interface GildedLotusPalette {
  /** The linen. */
  canvas: string
  /** The linen's corners. */
  canvasDeep: string
  /** Ink pooled at the moon's edge. */
  ink: string
  /** The moon's mottled centre. */
  inkCore: string
  /** Gold leaf. */
  gold: string
  /** Gold catching the light. */
  goldLight: string
  /** Gold in shadow. */
  goldDeep: string
  /** The petals' body. */
  petal: string
  /** The petals' tips. */
  petalTip: string
  /** The petals' base. */
  petalBase: string
  /** Interface text. */
  text: string
}

export type GildedLotusPreset = "blush" | "ivory" | "noir"

export interface GildedLotusPreloaderProps {
  /** Content revealed once the ink has parted. Ignored while `loop` is set. */
  children?: React.ReactNode
  /** Run forever as a showcase: children are never revealed, onComplete never fires. */
  loop?: boolean
  /** Real loading progress, 0–100. Leave undefined to simulate over `durationMs`. */
  progress?: number
  /** Length of the simulated load. Defaults to 6400ms. */
  durationMs?: number
  /** Linen, ink and gold. Defaults to "blush". */
  preset?: GildedLotusPreset
  /** Colour overrides, merged over the preset. */
  palette?: {
    canvas?: string
    canvasDeep?: string
    ink?: string
    inkCore?: string
    gold?: string
    goldLight?: string
    goldDeep?: string
    petal?: string
    petalTip?: string
    petalBase?: string
    text?: string
  }
  /** Reshuffles the gold leaf, the ink's edge and the linen. */
  seed?: number
  /** Accessible name of the progress bar. */
  label?: string
  /** Top-left line. Empty string hides it. */
  meta?: string
  /** Bottom-left line while loading. Empty string hides it. */
  hint?: string
  /** The title card, set in the ink once the load is done. Empty string skips the card. */
  title?: string
  /** Under the title. */
  tagline?: string
  /** Corner type and the counter. Defaults to true. */
  hud?: boolean
  /** Face for the title. */
  serifFamily?: string
  /** Face for the corner type. */
  monoFamily?: string
  /** Root height. A definite length, never a percentage. */
  height?: string
  /** Fired once, after the gate has opened. */
  onComplete?: () => void
  className?: string
}

const PRESETS: { [name: string]: GildedLotusPalette } = {
  blush: {
    canvas: "#d9ccc6", canvasDeep: "#b6a6a1", ink: "#121012", inkCore: "#4b4446",
    gold: "#cfa52e", goldLight: "#f3dd8e", goldDeep: "#8a6a14",
    petal: "#fbf6f3", petalTip: "#c95f7a", petalBase: "#e59bae", text: "#45393a",
  },
  ivory: {
    canvas: "#e9e1d3", canvasDeep: "#c9baa3", ink: "#1b1815", inkCore: "#4e4740",
    gold: "#c89f33", goldLight: "#f1dc95", goldDeep: "#846818",
    petal: "#fcf8f4", petalTip: "#c25a76", petalBase: "#e4a2b2", text: "#3e352c",
  },
  noir: {
    canvas: "#1d191c", canvasDeep: "#0b090b", ink: "#040304", inkCore: "#2a2527",
    gold: "#d3ab3a", goldLight: "#f7e6a4", goldDeep: "#9a781c",
    petal: "#fbf6f3", petalTip: "#d0657f", petalBase: "#e9a7b7", text: "#e6dbd5",
  },
}

const SERIF_STACK = '"Cormorant Garamond", "Instrument Serif", "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif'
const MONO_STACK = '"JetBrains Mono", "SF Mono", ui-monospace, Menlo, Consolas, monospace'

const HOLD_MS = 1500
const FLOOD_MS = 1700
const CARD_MS = 2300
const RECEDE_MS = 1100
const OPEN_MS = 900
const RAY_WINDOW = 28
const SOLID_LAG = 14
const FEATHER = 12
const TAPER = 22

// #region timeline
// Pure helpers, lifted out and executed by tests/gilded-lotus-preloader.test.mjs.

/** Small fast seeded PRNG (mulberry32): same seed, same gold. */
export function glpRandom(seed: number) {
  let a = (seed >>> 0) || 1
  return function () {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function glpClamp(v: number, lo: number, hi: number) {
  return v < lo ? lo : v > hi ? hi : v
}

/** Fraction of the way from `from` to `to` that `p` has reached, clamped. */
export function glpStage(p: number, from: number, to: number) {
  return to <= from ? (p >= to ? 1 : 0) : glpClamp((p - from) / (to - from), 0, 1)
}

export function glpEaseOut(k: number) {
  const c = glpClamp(k, 0, 1)
  return 1 - (1 - c) * (1 - c) * (1 - c)
}

export function glpEaseInOut(k: number) {
  const c = glpClamp(k, 0, 1)
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2
}

/** Ease-out with a small overshoot, for a petal that flops open and settles. */
export function glpBack(k: number) {
  if (k <= 0) return 0
  if (k >= 1) return 1
  const s = 1.2
  return 1 + (s + 1) * Math.pow(k - 1, 3) + s * Math.pow(k - 1, 2)
}

/** The simulated load at time fraction t ∈ [0, 1]: eased, with stalls, monotonic, 0 → 100. */
export function glpSimulated(t: number) {
  const k = glpClamp(t, 0, 1)
  const ease = glpEaseInOut(k)
  const stall = 0.03 * Math.sin(k * Math.PI * 4) * Math.sin(k * Math.PI)
  return glpClamp((ease - stall) * 100, 0, 100)
}

/** Where the gilding starts, in screen degrees (0 = right, clockwise), and how far it goes. */
export const GLP_START = 150
export const GLP_SWEEP = 270

/** The leading edge of the gold at progress p ∈ [0, 1], in degrees. */
export function glpLead(p: number) {
  return GLP_START + GLP_SWEEP * glpClamp(p, 0, 1)
}

/** How much of the stem has risen. */
export function glpStem(p: number) {
  return glpEaseOut(glpStage(p, 0, 0.16))
}

/** The moon's radius as a fraction of its full size: ink in water, fast then slow. */
export function glpInk(p: number) {
  const k = glpStage(p, 0.12, 0.62)
  return 1 - Math.pow(1 - k, 4)
}

/** The bud rising out of the ink. */
export function glpRise(p: number) {
  return glpBack(glpStage(p, 0.24, 0.42))
}

/** The bloom, 0 (bud) → 1 (open). */
export function glpBloom(p: number) {
  return glpStage(p, 0.36, 0.98)
}

/** A petal's own opening given the bloom and the row's timing. */
export function glpOpen(bloom: number, start: number, span: number) {
  return glpBack(glpStage(bloom, start, start + span))
}
// #endregion

// #region art
// The lotus, the ink's edge and the gold leaf, as data. Executed by the tests.

export interface GlpPetal {
  row: string
  angle: number
  length: number
  width: number
  start: number
  span: number
}

/** A pointed petal from the base (0, 0) up to its tip (0, -L), widest below the middle. */
export function glpPetalPath(L: number, w: number) {
  const f = (n: number) => String(Math.round(n * 100) / 100)
  return (
    "M0 0C" + f(w * 0.9) + " " + f(-L * 0.1) + " " + f(w * 1.02) + " " + f(-L * 0.62) + " 0 " + f(-L) +
    "C" + f(-w * 1.02) + " " + f(-L * 0.62) + " " + f(-w * 0.9) + " " + f(-L * 0.1) + " 0 0Z"
  )
}

/** The central vein, base to two thirds up. */
export function glpVeinPath(L: number) {
  const f = (n: number) => String(Math.round(n * 100) / 100)
  return "M0 " + f(-L * 0.05) + "Q0.6 " + f(-L * 0.38) + " 0 " + f(-L * 0.7)
}

/** Every petal, back to front. Angles are degrees off vertical; lengths in lotus units (100 = the back row). */
export function glpLotus(): GlpPetal[] {
  const rows: GlpPetal[] = []
  const add = (row: string, angles: number[], length: number, width: number, start: number, span: number) => {
    for (const angle of angles) rows.push({ row, angle, length, width, start, span })
  }
  add("back", [-46, -23, 0, 23, 46], 100, 27, 0.12, 0.55)
  add("outer", [-64, 64], 54, 21, 0, 0.5)
  add("mid", [-34, -11, 11, 34], 82, 29, 0.3, 0.55)
  add("front", [-20, 0, 20], 60, 32, 0.45, 0.55)
  return rows
}

/**
 * An ink blot's edge: `n` points round (cx, cy) at radius r, breathing with
 * `phase` and roughened by `rough` (one 0–1 value per point) scaled by `amp`.
 * Returns a flat [x0, y0, x1, y1, …] array.
 */
export function glpBlot(cx: number, cy: number, r: number, rough: number[], amp: number, phase: number) {
  const n = rough.length
  const out: number[] = []
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    const wave =
      0.034 * Math.sin(3 * a + phase * 0.7) +
      0.021 * Math.sin(7 * a - phase * 1.3) +
      0.012 * Math.sin(11 * a + phase * 2.1)
    const grain = 0.022 * (rough[i] - 0.5)
    const k = 1 + amp * (wave + grain)
    out.push(cx + Math.cos(a) * r * k, cy + Math.sin(a) * r * k)
  }
  return out
}

/** Roughness for a blot edge, smoothed so the ink feathers instead of spiking. */
export function glpRough(seed: number, n: number) {
  const rand = glpRandom(seed)
  const raw: number[] = []
  for (let i = 0; i < n; i++) raw.push(rand())
  const out: number[] = []
  for (let i = 0; i < n; i++) {
    out.push((raw[(i + n - 1) % n] + raw[i] * 2 + raw[(i + 1) % n]) / 4)
  }
  return out
}

export interface GlpStrokes {
  count: number
  /** Degrees, GLP_START … GLP_START + GLP_SWEEP. */
  a: number[]
  /** Start and end as fractions of the band (0 = inner edge, 1 = outer edge). */
  r0: number[]
  r1: number[]
  /** 0 = deep gold, 1 = light gold. */
  tone: number[]
  width: number[]
  alpha: number[]
}

/** The radial scratches of the gold leaf: dense, short, jittered. */
export function glpStrokes(seed: number, count: number): GlpStrokes {
  const rand = glpRandom(seed)
  const s: GlpStrokes = { count, a: [], r0: [], r1: [], tone: [], width: [], alpha: [] }
  for (let i = 0; i < count; i++) {
    const a = GLP_START + (GLP_SWEEP * (i + rand())) / count
    const out = rand() < 0.04
    const r0 = out ? -0.03 + rand() * 0.06 : rand() * 0.2
    const r1 = out ? 1 + rand() * 0.035 : 0.75 + rand() * 0.25
    const tone = rand() < 0.3 ? rand() * 0.35 : 0.45 + rand() * 0.55
    s.a.push(a)
    s.r0.push(r0)
    s.r1.push(r1)
    s.tone.push(tone)
    s.width.push(0.5 + rand() * 0.8)
    // the gilding takes slowly at its start
    s.alpha.push((0.3 + rand() * 0.4) * glpStage(a - GLP_START, 0, TAPER))
  }
  return s
}

/** The rays the brush leaves as it runs dry: sparser, longer, past the outer edge. */
export function glpRays(seed: number, count: number): GlpStrokes {
  const rand = glpRandom(seed)
  const s: GlpStrokes = { count, a: [], r0: [], r1: [], tone: [], width: [], alpha: [] }
  for (let i = 0; i < count; i++) {
    const a = GLP_START + (GLP_SWEEP * (i + rand())) / count
    const long = rand() < 0.3
    const r0 = rand() < 0.45 ? rand() * 0.25 : 0.3 + rand() * 0.5
    const r1 = long ? 1.05 + rand() * 0.35 : 0.8 + rand() * 0.25
    s.a.push(a)
    s.r0.push(r0)
    s.r1.push(r1)
    s.tone.push(0.35 + rand() * 0.65)
    s.width.push(0.45 + rand() * 0.7)
    s.alpha.push(0.35 + rand() * 0.55)
  }
  return s
}

/** "#rrggbb" → [r, g, b], or the fallback. */
export function glpHex(hex: string, fallback: number[]) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return fallback
  const n = parseInt(m[1], 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export function glpMix(a: number[], b: number[], k: number) {
  const t = glpClamp(k, 0, 1)
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
}

export function glpRgba(c: number[], alpha: number) {
  return "rgba(" + Math.round(c[0]) + "," + Math.round(c[1]) + "," + Math.round(c[2]) + "," + alpha + ")"
}

/** Shortest signed distance between two angles in radians. */
export function glpAngleDelta(from: number, to: number) {
  let d = (to - from) % (Math.PI * 2)
  if (d > Math.PI) d -= Math.PI * 2
  if (d < -Math.PI) d += Math.PI * 2
  return d
}
// #endregion

const PETALS = glpLotus()

const GLP_CSS = `
.glp-root { position: relative; isolation: isolate; width: 100%; overflow: hidden; background: var(--glp-canvas); color: var(--glp-text); font-family: var(--glp-mono); }
.glp-root canvas, .glp-root svg, .glp-root img { max-width: none; }
.glp-gate { position: absolute; inset: 0; z-index: 2; overflow: hidden; outline: none; cursor: pointer; background: var(--glp-canvas); transition: opacity 900ms ease; -webkit-tap-highlight-color: transparent; touch-action: manipulation; }
.glp-gate:focus-visible::after { content: ""; position: absolute; inset: 10px; border: 1px solid var(--glp-gold); opacity: .55; pointer-events: none; }
.glp-gate[data-phase="open"] { opacity: 0; pointer-events: none; }
.glp-layer { position: absolute; inset: 0; width: 100%; height: 100%; display: block; pointer-events: none; }
.glp-lotus { position: absolute; overflow: visible; pointer-events: none; transform-origin: 50% 100%; transition: opacity 800ms ease, transform 1400ms cubic-bezier(.2,.7,.1,1); }
.glp-gate[data-phase="flood"] .glp-lotus, .glp-gate[data-phase="card"] .glp-lotus, .glp-gate[data-phase="recede"] .glp-lotus, .glp-gate[data-phase="open"] .glp-lotus { opacity: 0; transform: translate3d(0, -4%, 0) scale(1.06); transition: opacity 1000ms ease 260ms, transform 1500ms cubic-bezier(.2,.7,.1,1); }
.glp-petal { fill-rule: evenodd; }
.glp-corner { position: absolute; z-index: 3; display: flex; flex-direction: column; gap: 6px; font-size: 10px; letter-spacing: .24em; text-transform: uppercase; pointer-events: none; transition: opacity 600ms ease; }
.glp-tl { left: clamp(18px, 3vw, 40px); top: clamp(18px, 3vw, 34px); opacity: .62; }
.glp-bl { left: clamp(18px, 3vw, 40px); bottom: clamp(16px, 3vw, 28px); opacity: .5; }
.glp-br { right: clamp(18px, 3vw, 40px); bottom: clamp(16px, 3vw, 28px); text-align: right; align-items: flex-end; }
.glp-count { display: inline-flex; align-items: baseline; gap: 4px; font-size: 13px; letter-spacing: .16em; font-variant-numeric: tabular-nums; }
.glp-count small { font-size: 9px; letter-spacing: .2em; opacity: .55; }
.glp-rule { width: 38px; height: 1px; background: var(--glp-text); opacity: .28; }
.glp-gate[data-phase="hold"] .glp-bl { opacity: 0; }
.glp-gate[data-phase="flood"] .glp-corner, .glp-gate[data-phase="card"] .glp-corner, .glp-gate[data-phase="recede"] .glp-corner, .glp-gate[data-phase="open"] .glp-corner { opacity: 0; }
.glp-card { position: absolute; inset: 0; z-index: 3; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 24px; opacity: 0; pointer-events: none; transition: opacity 500ms ease; }
.glp-title { margin: 0; font-family: var(--glp-serif); font-weight: 400; font-size: clamp(38px, 6.4vw, 84px); line-height: 1; letter-spacing: .05em; color: var(--glp-gold-light); opacity: 0; transform: translateY(14px); transition: opacity 900ms ease, transform 1300ms cubic-bezier(.2,.7,.1,1); }
.glp-card-rule { width: 0; height: 1px; margin: 22px 0 18px; background: var(--glp-gold); opacity: .8; transition: width 1100ms cubic-bezier(.2,.7,.1,1) 250ms; }
.glp-tagline { margin: 0; font-size: 10px; letter-spacing: .34em; text-transform: uppercase; color: var(--glp-gold-light); opacity: 0; transform: translateY(8px); transition: opacity 900ms ease 420ms, transform 1100ms cubic-bezier(.2,.7,.1,1) 420ms; }
.glp-gate[data-phase="card"] .glp-card { opacity: 1; }
.glp-gate[data-phase="card"] .glp-title { opacity: 1; transform: none; }
.glp-gate[data-phase="card"] .glp-card-rule { width: 56px; }
.glp-gate[data-phase="card"] .glp-tagline { opacity: .72; transform: none; }
.glp-gate[data-phase="recede"] .glp-card { opacity: 0; transition: opacity 500ms ease; }
.glp-gate[data-phase="open"] .glp-card { opacity: 1; }
.glp-gate[data-phase="open"] .glp-title, .glp-gate[data-phase="open"] .glp-tagline { opacity: 1; transform: none; }
.glp-gate[data-phase="open"] .glp-card-rule { width: 56px; }
.glp-replay { display: block; margin-top: 26px; font-size: 10px; letter-spacing: .24em; text-transform: uppercase; color: var(--glp-gold-light); opacity: 0; transition: opacity 800ms ease 900ms; }
.glp-gate[data-phase="card"] .glp-replay { opacity: .4; }
.glp-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
@media (prefers-reduced-motion: reduce) {
  .glp-gate, .glp-lotus, .glp-corner, .glp-card, .glp-title, .glp-card-rule, .glp-tagline, .glp-replay { transition: none; }
  .glp-gate[data-phase="flood"] .glp-lotus, .glp-gate[data-phase="card"] .glp-lotus, .glp-gate[data-phase="recede"] .glp-lotus, .glp-gate[data-phase="open"] .glp-lotus { transform: none; }
}
`

type GlpPhase = "draw" | "hold" | "flood" | "card" | "recede" | "open" | "done"

export default function GildedLotusPreloader({
  children,
  loop = false,
  progress,
  durationMs = 6400,
  preset = "blush",
  palette,
  seed = 11,
  label = "Loading",
  meta = "Portfolio · MMXXVI",
  hint = "Click to skip",
  title = "Padma",
  tagline = "Rising from still water",
  hud = true,
  serifFamily = SERIF_STACK,
  monoFamily = MONO_STACK,
  height = "100svh",
  onComplete,
  className = "",
}: GildedLotusPreloaderProps) {
  const colors = { ...(PRESETS[preset] || PRESETS.blush), ...(palette || {}) }
  const uid = React.useId().replace(/\W/g, "")
  const rootRef = React.useRef(null as HTMLDivElement | null)
  const linenRef = React.useRef(null as HTMLCanvasElement | null)
  const inkRef = React.useRef(null as HTMLCanvasElement | null)
  const goldRef = React.useRef(null as HTMLCanvasElement | null)
  const lotusRef = React.useRef(null as SVGSVGElement | null)
  const bloomRef = React.useRef(null as SVGGElement | null)
  const petalRefs = React.useRef([] as (SVGGElement | null)[])
  const [phase, setPhase] = React.useState("draw" as GlpPhase)
  const [pct, setPct] = React.useState(0)
  const [run, setRun] = React.useState(0)
  const phaseRef = React.useRef(phase)
  phaseRef.current = phase
  const progressRef = React.useRef(progress)
  progressRef.current = progress
  const onCompleteRef = React.useRef(onComplete)
  onCompleteRef.current = onComplete
  const rushRef = React.useRef(false)
  const pointerRef = React.useRef(null as { x: number; y: number } | null)
  const optsRef = React.useRef({ colors, seed, durationMs, loop })
  optsRef.current = { colors, seed, durationMs, loop }
  const colorKey = Object.keys(colors)
    .sort()
    .map((k) => colors[k as keyof GildedLotusPalette])
    .join("|")

  React.useEffect(() => {
    const root = rootRef.current
    const linen = linenRef.current
    const inkCanvas = inkRef.current
    const goldCanvas = goldRef.current
    const lotus = lotusRef.current
    if (!root || !linen || !inkCanvas || !goldCanvas || !lotus) return
    const lc = linen.getContext("2d")
    const ic = inkCanvas.getContext("2d")
    const gc = goldCanvas.getContext("2d")
    if (!lc || !ic || !gc) return
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const o = optsRef.current
    const C = o.colors
    const canvasRgb = glpHex(C.canvas, [217, 204, 198])
    const deepRgb = glpHex(C.canvasDeep, [182, 166, 161])
    const inkRgb = glpHex(C.ink, [18, 16, 18])
    const coreRgb = glpHex(C.inkCore, [75, 68, 70])
    const goldRgb = glpHex(C.gold, [207, 165, 46])
    const lightRgb = glpHex(C.goldLight, [243, 221, 142])
    const deepGoldRgb = glpHex(C.goldDeep, [138, 106, 20])
    const darkCanvas = canvasRgb[0] * 0.3 + canvasRgb[1] * 0.59 + canvasRgb[2] * 0.11 < 110
    const washRgb = darkCanvas ? [255, 255, 255] : inkRgb

    // geometry
    let w = 1
    let h = 1
    let dpr = 1
    let cx = 0
    let cy = 0
    let rOut = 1
    let rIn = 1
    let mx = 0
    let my = 0
    let mr = 1
    let baseY = 0
    let cover = 1
    let ringTex = null as HTMLCanvasElement | null
    let inkTex = null as HTMLCanvasElement | null
    let rimTex = null as HTMLCanvasElement | null
    let strokes = glpStrokes(o.seed, 10)
    let rays = glpRays(o.seed + 3, 10)
    const rough = glpRough(o.seed + 5, 220)
    const roughIn = glpRough(o.seed + 8, 180)
    const roughOut = glpRough(o.seed + 9, 180)

    // state
    let raf = 0
    let last = performance.now()
    let started = last
    let shown = 0
    let pctLast = -1
    let localPhase = "draw" as GlpPhase
    let holdAt = 0
    let floodAt = 0
    let cardAt = 0
    let recedeAt = 0
    let light = -1.05
    let px = 0
    let py = 0
    let lastBloom = -1
    let lastRise = -1
    let flakes: { x: number; y: number; vx: number; vy: number; rot: number; vr: number; s: number; life: number; age: number; tone: number }[] = []

    const setLocal = (p: GlpPhase) => {
      localPhase = p
      setPhase(p)
    }

    const tone = (t: number) => (t < 0.5 ? glpMix(deepGoldRgb, goldRgb, t * 2) : glpMix(goldRgb, lightRgb, (t - 0.5) * 2))
    const rad = (deg: number) => (deg * Math.PI) / 180

    const tracePoly = (ctx: CanvasRenderingContext2D, pts: number[]) => {
      const n = pts.length / 2
      ctx.moveTo((pts[0] + pts[n * 2 - 2]) / 2, (pts[1] + pts[n * 2 - 1]) / 2)
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n
        ctx.quadraticCurveTo(pts[i * 2], pts[i * 2 + 1], (pts[i * 2] + pts[j * 2]) / 2, (pts[i * 2 + 1] + pts[j * 2 + 1]) / 2)
      }
      ctx.closePath()
    }

    const paintLinen = () => {
      lc.setTransform(dpr, 0, 0, dpr, 0, 0)
      lc.fillStyle = C.canvas
      lc.fillRect(0, 0, w, h)
      // a lighter wash behind the composition, darker corners
      const wash = lc.createRadialGradient(cx, cy, rOut * 0.2, cx, cy, Math.hypot(w, h) * 0.6)
      wash.addColorStop(0, glpRgba(glpMix(canvasRgb, [255, 255, 255], darkCanvas ? 0.05 : 0.22), 1))
      wash.addColorStop(0.45, glpRgba(canvasRgb, 1))
      wash.addColorStop(1, glpRgba(deepRgb, 1))
      lc.fillStyle = wash
      lc.fillRect(0, 0, w, h)
      // aged plaster: a few broad soft patches
      const rand = glpRandom(o.seed + 21)
      for (let i = 0; i < 14; i++) {
        const x = rand() * w
        const y = rand() * h
        const r = (0.12 + rand() * 0.3) * Math.max(w, h)
        const g = lc.createRadialGradient(x, y, 0, x, y, r)
        const lightPatch = rand() < 0.5
        g.addColorStop(0, lightPatch ? "rgba(255,255,255,0.06)" : glpRgba(deepRgb, 0.09))
        g.addColorStop(1, "rgba(0,0,0,0)")
        lc.fillStyle = g
        lc.fillRect(x - r, y - r, r * 2, r * 2)
      }
      // the weave: fine vertical threads, as the reference's striated ground
      const threads = Math.round(w * 1.4)
      for (let i = 0; i < threads; i++) {
        const x = Math.floor(rand() * w) + 0.5
        const y = rand() * h
        const len = 14 + rand() * 160
        const light = rand() < 0.5
        lc.strokeStyle = light ? "rgba(255,255,255," + (0.05 + rand() * 0.07) + ")" : glpRgba(deepRgb, 0.12 + rand() * 0.12)
        lc.lineWidth = 1
        lc.beginPath()
        lc.moveTo(x, y)
        lc.lineTo(x, y + len)
        lc.stroke()
      }
      // dust
      for (let i = 0; i < (w * h) / 60; i++) {
        lc.fillStyle = rand() < 0.5 ? "rgba(255,255,255,0.08)" : glpRgba(deepRgb, 0.14)
        lc.fillRect(rand() * w, rand() * h, 1, 1)
      }
    }

    const paintInkTex = () => {
      // the moon's interior at its full size, drawn once and scaled per frame
      const pad = 1.12
      const size = Math.max(8, Math.round(mr * pad * 2 * dpr))
      inkTex = document.createElement("canvas")
      inkTex.width = size
      inkTex.height = size
      const t = inkTex.getContext("2d")
      if (!t) return
      const R = mr * pad
      t.setTransform(dpr, 0, 0, dpr, 0, 0)
      t.fillStyle = C.inkCore
      t.beginPath()
      t.arc(R, R, R, 0, Math.PI * 2)
      t.fill()
      const rand = glpRandom(o.seed + 33)
      // ink that settled unevenly: darker pools and thinner washes
      for (let i = 0; i < 110; i++) {
        const a = rand() * Math.PI * 2
        const d = Math.sqrt(rand()) * mr * 0.95
        const x = R + Math.cos(a) * d
        const y = R + Math.sin(a) * d
        const r = mr * (0.06 + rand() * 0.3)
        const g = t.createRadialGradient(x, y, 0, x, y, r)
        const dark = rand() < 0.62
        g.addColorStop(0, dark ? glpRgba(inkRgb, 0.28 + rand() * 0.3) : glpRgba(glpMix(coreRgb, [255, 255, 255], 0.18), 0.22 + rand() * 0.2))
        g.addColorStop(1, "rgba(0,0,0,0)")
        t.fillStyle = g
        t.fillRect(x - r, y - r, r * 2, r * 2)
      }
      // ink pools at the edge
      const edge = t.createRadialGradient(R, R, mr * 0.45, R, R, mr * 1.02)
      edge.addColorStop(0, glpRgba(inkRgb, 0))
      edge.addColorStop(0.62, glpRgba(inkRgb, 0.55))
      edge.addColorStop(1, glpRgba(inkRgb, 0.97))
      t.fillStyle = edge
      t.fillRect(0, 0, R * 2, R * 2)
      // paper tooth showing through
      for (let i = 0; i < (R * R) / 9; i++) {
        const a = rand() * Math.PI * 2
        const d = Math.sqrt(rand()) * R
        t.fillStyle = rand() < 0.55 ? "rgba(255,255,255,0.045)" : glpRgba(inkRgb, 0.3)
        t.fillRect(R + Math.cos(a) * d, R + Math.sin(a) * d, 1, 1)
      }
    }

    const paintRingTex = () => {
      ringTex = document.createElement("canvas")
      ringTex.width = Math.round(w * dpr)
      ringTex.height = Math.round(h * dpr)
      const t = ringTex.getContext("2d")
      if (!t) return
      t.setTransform(dpr, 0, 0, dpr, 0, 0)
      const band = rOut - rIn
      // the leaf itself: a ragged annulus
      const outer = glpBlot(cx, cy, rOut, roughOut, 0.42, 0)
      const inner = glpBlot(cx, cy, rIn, roughIn, 0.3, 2)
      t.beginPath()
      tracePoly(t, outer)
      tracePoly(t, inner)
      const leaf = t.createRadialGradient(cx, cy, rIn * 0.96, cx, cy, rOut * 1.02)
      leaf.addColorStop(0, glpRgba(glpMix(goldRgb, deepGoldRgb, 0.55), 1))
      leaf.addColorStop(0.18, glpRgba(glpMix(goldRgb, deepGoldRgb, 0.15), 1))
      leaf.addColorStop(0.55, glpRgba(glpMix(goldRgb, lightRgb, 0.22), 1))
      leaf.addColorStop(0.85, glpRgba(goldRgb, 1))
      leaf.addColorStop(1, glpRgba(glpMix(goldRgb, deepGoldRgb, 0.3), 1))
      t.fillStyle = leaf
      t.fill("evenodd")
      // leaf is laid in sheets: each one took the light a little differently
      t.save()
      t.beginPath()
      tracePoly(t, outer)
      tracePoly(t, inner)
      t.clip("evenodd")
      const sheets = glpRandom(o.seed + 61)
      for (let a = GLP_START - 2; a < GLP_START + GLP_SWEEP + 2; a += 7 + sheets() * 9) {
        const span = 6 + sheets() * 10
        const lighter = sheets() < 0.5
        t.fillStyle = lighter ? glpRgba(lightRgb, 0.05 + sheets() * 0.1) : glpRgba(deepGoldRgb, 0.06 + sheets() * 0.12)
        t.beginPath()
        t.moveTo(cx, cy)
        t.arc(cx, cy, rOut * 1.2, rad(a), rad(a + span))
        t.closePath()
        t.fill()
        // and a few sheets only half took
        if (sheets() < 0.35) {
          const rr = rIn + sheets() * (rOut - rIn)
          t.fillStyle = glpRgba(lighter ? deepGoldRgb : lightRgb, 0.08)
          t.beginPath()
          t.arc(cx, cy, rr + (rOut - rIn) * 0.25, rad(a), rad(a + span))
          t.arc(cx, cy, rr, rad(a + span), rad(a), true)
          t.closePath()
          t.fill()
        }
      }
      t.restore()
      // the scratches
      t.lineCap = "butt"
      for (let i = 0; i < strokes.count; i++) {
        const a = rad(strokes.a[i])
        const ca = Math.cos(a)
        const sa = Math.sin(a)
        const r0 = rIn + strokes.r0[i] * band
        const r1 = rIn + strokes.r1[i] * band
        t.strokeStyle = glpRgba(tone(strokes.tone[i]), strokes.alpha[i])
        t.lineWidth = strokes.width[i]
        t.beginPath()
        t.moveTo(cx + ca * r0, cy + sa * r0)
        t.lineTo(cx + ca * r1, cy + sa * r1)
        t.stroke()
      }
      // flecks of leaf that did not take
      const rand = glpRandom(o.seed + 45)
      for (let i = 0; i < band * 40; i++) {
        const a = rad(GLP_START + rand() * GLP_SWEEP)
        const r = rIn + rand() * band
        t.fillStyle = rand() < 0.5 ? glpRgba(lightRgb, 0.5) : glpRgba(deepGoldRgb, 0.5)
        t.fillRect(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 1, 1)
      }
      // nothing outside the sweep; the start of the gilding fades in over the first degrees
      t.globalCompositeOperation = "destination-out"
      t.fillStyle = "rgba(0,0,0,1)"
      t.beginPath()
      t.moveTo(cx, cy)
      t.arc(cx, cy, rOut * 1.5, rad(GLP_START + GLP_SWEEP), rad(GLP_START - 3 + 360))
      t.closePath()
      t.fill()
      const slices = 26
      for (let i = 0; i < slices; i++) {
        const a0 = GLP_START - 3 + ((TAPER + 3) * i) / slices
        const a1 = a0 + (TAPER + 3) / slices + 0.15
        t.fillStyle = "rgba(0,0,0," + (1 - glpEaseInOut(i / slices)) + ")"
        t.beginPath()
        t.moveTo(cx, cy)
        t.arc(cx, cy, rOut * 1.3, rad(a0), rad(a1))
        t.closePath()
        t.fill()
      }
      t.globalCompositeOperation = "source-over"
    }

    const placeLotus = () => {
      // 100 lotus units = half the moon's radius; the base sits low in the moon
      const unit = mr * 0.0064
      lotus.style.left = mx - 120 * unit + "px"
      lotus.style.top = baseY - 118 * unit + "px"
      lotus.style.width = 240 * unit + "px"
      lotus.style.height = 138 * unit + "px"
    }

    const layout = () => {
      const rect = root.getBoundingClientRect()
      w = Math.max(1, Math.round(rect.width))
      h = Math.max(1, Math.round(rect.height))
      // three full-frame canvases: hold the pixel budget on big, dense screens
      dpr = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(3600000 / (w * h)))
      for (const c of [linen, inkCanvas, goldCanvas]) {
        c.width = Math.round(w * dpr)
        c.height = Math.round(h * dpr)
      }
      const U = Math.min(w * 0.53, h * 0.48)
      cx = w / 2
      cy = h > w * 1.2 ? h * 0.45 : h * 0.47
      rOut = U * 0.9
      rIn = U * 0.6
      mx = cx
      my = cy + U * 0.02
      mr = U * 0.5
      baseY = my + mr * 0.58
      cover = Math.hypot(Math.max(mx, w - mx), Math.max(my, h - my)) * 1.32
      strokes = glpStrokes(o.seed, Math.round(glpClamp(rOut * 5.2, 1200, 3400)))
      rays = glpRays(o.seed + 3, 440)
      paintLinen()
      paintInkTex()
      paintRingTex()
      rimTex = document.createElement("canvas")
      rimTex.width = rimTex.height = Math.max(8, Math.round(mr * 3.2 * dpr))
      placeLotus()
      lastBloom = -1
      lastRise = -1
    }

    const spawnFlakes = (lead: number) => {
      const rand = glpRandom(o.seed + 77 + Math.round(shown))
      flakes = []
      const n = Math.round(glpClamp(rOut * 0.9, 120, 320))
      for (let i = 0; i < n; i++) {
        const a = rad(GLP_START + rand() * Math.max(10, lead - GLP_START))
        const r = rIn + rand() * (rOut - rIn)
        const s = 1.5 + rand() * rand() * 5
        flakes.push({
          x: cx + Math.cos(a) * r,
          y: cy + Math.sin(a) * r,
          vx: (rand() - 0.5) * 18 + Math.cos(a) * 10,
          vy: -22 - rand() * 50,
          rot: rand() * Math.PI,
          vr: (rand() - 0.5) * 4,
          s,
          life: 1400 + rand() * 1600,
          age: -rand() * 900,
          tone: rand(),
        })
      }
    }

    const drawInk = (now: number, r: number, amp: number, stem: number, ink: number, rimAlpha: number, glow: number) => {
      ic.setTransform(1, 0, 0, 1, 0, 0)
      ic.clearRect(0, 0, inkCanvas.width, inkCanvas.height)
      ic.setTransform(dpr, 0, 0, dpr, 0, 0)
      const ph = now / 1000
      // the wash that ran down from the moon
      if (ink > 0.05 && r < cover) {
        const top = my + Math.min(r, mr) * 0.88
        const wTop = mr * 0.085
        const wBot = mr * 0.14
        const g = ic.createLinearGradient(0, top, 0, h)
        const wk = ink * (darkCanvas ? 0.4 : 1)
        g.addColorStop(0, glpRgba(washRgb, 0.3 * wk))
        g.addColorStop(0.35, glpRgba(washRgb, 0.16 * wk))
        g.addColorStop(1, glpRgba(washRgb, 0.05 * wk))
        ic.fillStyle = g
        ic.beginPath()
        ic.moveTo(mx - wTop, top)
        ic.lineTo(mx + wTop, top)
        ic.lineTo(mx + wBot, h + 2)
        ic.lineTo(mx - wBot, h + 2)
        ic.closePath()
        ic.fill()
        const soft = ic.createLinearGradient(mx - wBot, 0, mx + wBot, 0)
        soft.addColorStop(0, glpRgba(canvasRgb, 1))
        soft.addColorStop(0.3, glpRgba(canvasRgb, 0))
        soft.addColorStop(0.7, glpRgba(canvasRgb, 0))
        soft.addColorStop(1, glpRgba(canvasRgb, 1))
        ic.globalCompositeOperation = "destination-out"
        ic.fillStyle = soft
        ic.fillRect(mx - wBot, top, wBot * 2, h - top + 2)
        ic.globalCompositeOperation = "source-over"
      }
      // the moon
      if (r > 0.5) {
        // ink feathering into the weave: five thin washes, each a little further out
        for (let i = 5; i >= 1; i--) {
          const bleed = glpBlot(mx, my, r * (1 + 0.019 * i), rough, amp * (1 + 0.12 * i), ph * 0.6 + i * 0.35)
          ic.fillStyle = glpRgba(washRgb, (0.07 + (5 - i) * 0.02) * (darkCanvas ? 0.45 : 1))
          ic.beginPath()
          tracePoly(ic, bleed)
          ic.fill()
        }
        const edge = glpBlot(mx, my, r, rough, amp, ph * 0.6 + 0.8)
        ic.save()
        ic.beginPath()
        tracePoly(ic, edge)
        ic.clip()
        if (inkTex) {
          const k = r * 1.12
          ic.drawImage(inkTex, mx - k, my - k, k * 2, k * 2)
        } else {
          ic.fillStyle = C.ink
          ic.fillRect(0, 0, w, h)
        }
        ic.restore()
      }
      // a little light held behind the flower
      if (glow > 0.01 && r < cover) {
        const gx = mx
        const gy = baseY - mr * 0.26
        const g = ic.createRadialGradient(gx, gy, 0, gx, gy, mr * 0.5)
        g.addColorStop(0, "rgba(255,246,240," + 0.2 * glow + ")")
        g.addColorStop(0.5, "rgba(255,240,236," + 0.06 * glow + ")")
        g.addColorStop(1, "rgba(255,255,255,0)")
        ic.fillStyle = g
        ic.beginPath()
        ic.arc(gx, gy, mr * 0.5, 0, Math.PI * 2)
        ic.fill()
      }
      // the stem, rising from the bottom of the frame
      if (stem > 0) {
        const topY = baseY + (h + 4 - baseY) * (1 - stem)
        const g = ic.createLinearGradient(0, baseY, 0, h)
        g.addColorStop(0, glpRgba(lightRgb, 1))
        g.addColorStop(0.25, glpRgba(goldRgb, 1))
        g.addColorStop(1, glpRgba(deepGoldRgb, 0.9))
        ic.lineCap = "round"
        ic.strokeStyle = g
        ic.lineWidth = Math.max(1.6, mr * 0.011)
        ic.beginPath()
        ic.moveTo(mx, topY)
        ic.lineTo(mx, h + 4)
        ic.stroke()
        ic.strokeStyle = glpRgba(lightRgb, 0.55)
        ic.lineWidth = Math.max(0.6, mr * 0.004)
        ic.beginPath()
        ic.moveTo(mx - ic.lineWidth, topY + 2)
        ic.lineTo(mx - ic.lineWidth, h + 4)
        ic.stroke()
      }
      // the gold rim where the leaf meets the moon: brightest at the top, gone at the sides
      if (rimAlpha > 0.01 && r > 0.5 && rimTex) {
        const rr = Math.min(r, mr * 1.3)
        const half = rimTex.width / dpr / 2
        const t = rimTex.getContext("2d")
        if (t) {
          t.setTransform(1, 0, 0, 1, 0, 0)
          t.clearRect(0, 0, rimTex.width, rimTex.height)
          t.setTransform(dpr, 0, 0, dpr, 0, 0)
          const g = t.createRadialGradient(half, half, rr * 0.88, half, half, rr * 1.14)
          g.addColorStop(0, glpRgba(lightRgb, 0))
          g.addColorStop(0.45, glpRgba(lightRgb, 0.4 * rimAlpha))
          g.addColorStop(0.62, glpRgba(goldRgb, 0.22 * rimAlpha))
          g.addColorStop(1, glpRgba(goldRgb, 0))
          t.fillStyle = g
          t.beginPath()
          t.arc(half, half, rr * 1.15, Math.PI, Math.PI * 2)
          t.closePath()
          t.fill()
          const fall = t.createLinearGradient(0, half - rr * 1.15, 0, half)
          fall.addColorStop(0, "rgba(0,0,0,0)")
          fall.addColorStop(0.55, "rgba(0,0,0,0.35)")
          fall.addColorStop(1, "rgba(0,0,0,1)")
          t.globalCompositeOperation = "destination-out"
          t.fillStyle = fall
          t.fillRect(0, 0, half * 2, half * 2)
          t.globalCompositeOperation = "source-over"
          ic.drawImage(rimTex, mx - half, my - half, half * 2, half * 2)
        }
      }
    }

    const drawGold = (now: number, dt: number, lead: number, alpha: number, flash: number) => {
      gc.setTransform(1, 0, 0, 1, 0, 0)
      gc.clearRect(0, 0, goldCanvas.width, goldCanvas.height)
      if (alpha <= 0.01 && !flakes.length) return
      gc.setTransform(dpr, 0, 0, dpr, 0, 0)
      gc.globalAlpha = alpha
      const band = rOut - rIn
      const solidTo = lead - SOLID_LAG
      if (ringTex && solidTo > GLP_START - 3) {
        gc.save()
        gc.beginPath()
        gc.moveTo(cx, cy)
        gc.arc(cx, cy, rOut * 1.5, rad(GLP_START - 4), rad(solidTo))
        gc.closePath()
        gc.clip()
        gc.setTransform(1, 0, 0, 1, 0, 0)
        gc.drawImage(ringTex, 0, 0)
        gc.restore()
        gc.setTransform(dpr, 0, 0, dpr, 0, 0)
        // the leaf thins out towards the brush, no hard edge
        gc.globalCompositeOperation = "destination-out"
        const slices = 8
        for (let i = 0; i < slices; i++) {
          const a0 = solidTo - FEATHER + (FEATHER * i) / slices
          const a1 = a0 + FEATHER / slices + 0.25
          gc.fillStyle = "rgba(0,0,0," + glpEaseInOut((i + 1) / slices) + ")"
          gc.beginPath()
          gc.moveTo(cx, cy)
          gc.arc(cx, cy, rOut * 1.5, rad(a0), rad(a1))
          gc.closePath()
          gc.fill()
        }
        gc.globalCompositeOperation = "source-over"
      }
      // the brush running dry ahead of the solid leaf
      gc.lineCap = "round"
      const from = lead - RAY_WINDOW
      for (let i = 0; i < rays.count; i++) {
        const a = rays.a[i]
        if (a < from || a > lead || a < GLP_START - 2) continue
        const k = (a - from) / RAY_WINDOW
        const fade = glpStage(a - GLP_START, 0, TAPER)
        const ra = rad(a)
        const ca = Math.cos(ra)
        const sa = Math.sin(ra)
        const r0 = rIn + rays.r0[i] * band
        const r1 = rIn + rays.r1[i] * band * (1 - k * 0.35)
        gc.strokeStyle = glpRgba(tone(rays.tone[i]), rays.alpha[i] * (1 - k * 0.8) * fade)
        gc.lineWidth = rays.width[i]
        gc.beginPath()
        gc.moveTo(cx + ca * r0, cy + sa * r0)
        gc.lineTo(cx + ca * r1, cy + sa * r1)
        gc.stroke()
      }
      // light on the leaf: only where gold already is
      gc.globalCompositeOperation = "source-atop"
      const lx = Math.cos(light)
      const ly = Math.sin(light)
      const sheen = gc.createLinearGradient(cx - lx * rOut, cy - ly * rOut, cx + lx * rOut, cy + ly * rOut)
      sheen.addColorStop(0, "rgba(40,24,4,0.42)")
      sheen.addColorStop(0.5, "rgba(0,0,0,0)")
      sheen.addColorStop(1, glpRgba(lightRgb, 0.5))
      gc.fillStyle = sheen
      gc.fillRect(0, 0, w, h)
      // the cat's eye of brushed metal, across the light
      const eye = gc.createLinearGradient(cx + ly * rOut, cy - lx * rOut, cx - ly * rOut, cy + lx * rOut)
      eye.addColorStop(0.34, "rgba(255,255,255,0)")
      eye.addColorStop(0.5, "rgba(255,250,230,0.3)")
      eye.addColorStop(0.66, "rgba(255,255,255,0)")
      gc.fillStyle = eye
      gc.fillRect(0, 0, w, h)
      if (flash > 0) {
        // the light running once round the ring when the load is done
        const fa = rad(GLP_START + GLP_SWEEP * flash)
        const fx = Math.cos(fa)
        const fy = Math.sin(fa)
        const run = gc.createLinearGradient(cx + fy * rOut, cy - fx * rOut, cx - fy * rOut, cy + fx * rOut)
        const peak = Math.sin(flash * Math.PI)
        run.addColorStop(0.4, "rgba(255,255,255,0)")
        run.addColorStop(0.5, "rgba(255,252,236," + 0.55 * peak + ")")
        run.addColorStop(0.6, "rgba(255,255,255,0)")
        gc.fillStyle = run
        gc.beginPath()
        gc.moveTo(cx, cy)
        gc.arc(cx, cy, rOut * 1.5, fa - Math.PI / 2, fa + Math.PI / 2)
        gc.closePath()
        gc.fill()
      }
      gc.globalCompositeOperation = "source-over"
      // gold leaf lifting off
      gc.globalAlpha = 1
      if (flakes.length) {
        const sec = dt / 1000
        let alive = 0
        for (const f of flakes) {
          f.age += dt
          if (f.age < 0) {
            alive++
            continue
          }
          if (f.age > f.life) continue
          alive++
          const t = f.age / f.life
          f.vy -= 26 * sec
          f.vx += Math.sin(now / 350 + f.rot * 3) * 9 * sec
          f.x += f.vx * sec
          f.y += f.vy * sec
          f.rot += f.vr * sec
          const a = (t < 0.15 ? t / 0.15 : 1 - glpStage(t, 0.55, 1)) * 0.95
          gc.save()
          gc.translate(f.x, f.y)
          gc.rotate(f.rot)
          gc.fillStyle = glpRgba(tone(f.tone), a)
          gc.fillRect(-f.s / 2, -f.s * 0.3, f.s, f.s * 0.6)
          gc.restore()
        }
        if (!alive) flakes = []
      }
    }

    const updateLotus = (rise: number, bloom: number) => {
      if (rise === lastRise && bloom === lastBloom) return
      lastRise = rise
      lastBloom = bloom
      const g = bloomRef.current
      if (g) {
        const s = 0.18 + 0.82 * rise
        g.setAttribute("transform", "translate(0 " + ((1 - rise) * 10).toFixed(2) + ") scale(" + s.toFixed(4) + ")")
        g.setAttribute("opacity", glpClamp(rise * 1.6, 0, 1).toFixed(3))
      }
      for (let i = 0; i < PETALS.length; i++) {
        const el = petalRefs.current[i]
        if (!el) continue
        const p = PETALS[i]
        const open = glpOpen(bloom, p.start, p.span)
        const rot = p.angle * (0.06 + 0.94 * open)
        const sx = 0.6 + 0.4 * glpClamp(open, 0, 1)
        const sy = 0.78 + 0.22 * glpClamp(open, 0, 1)
        el.setAttribute("transform", "rotate(" + rot.toFixed(2) + ") scale(" + sx.toFixed(3) + " " + sy.toFixed(3) + ")")
      }
    }

    const restart = () => {
      shown = 0
      pctLast = -1
      rushRef.current = false
      flakes = []
      started = performance.now()
      setPct(0)
      setLocal("draw")
    }

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      const dt = Math.min(64, Math.max(0, now - last))
      last = now
      const opts = optsRef.current
      const ph = localPhase

      if (ph === "draw") {
        const real = progressRef.current
        const t = (now - started) / Math.max(800, opts.durationMs)
        let target = real === undefined ? glpSimulated(t) : glpClamp(Number(real) || 0, 0, 100)
        if (rushRef.current) target = 100
        shown = reduced ? target : Math.max(shown, shown + (target - shown) * (rushRef.current ? 0.18 : 0.11))
        if (target >= 100 && shown > 99.6) shown = 100
        const p = Math.floor(shown)
        if (p !== pctLast) {
          pctLast = p
          setPct(p)
        }
        if (shown >= 100) {
          holdAt = now
          setLocal("hold")
        }
      } else if (ph === "hold" && now - holdAt > HOLD_MS) {
        floodAt = now
        if (reduced) {
          cardAt = now
          setLocal("card")
        } else {
          spawnFlakes(glpLead(1))
          setLocal("flood")
        }
      } else if (ph === "flood" && now - floodAt > FLOOD_MS) {
        cardAt = now
        setLocal("card")
      } else if (ph === "card" && now - cardAt > CARD_MS) {
        if (opts.loop) {
          recedeAt = now
          setLocal("recede")
        } else {
          setLocal("open")
        }
      } else if (ph === "recede" && now - recedeAt > RECEDE_MS) {
        restart()
      }

      const p = shown / 100
      const lead = glpLead(p)
      const stem = glpStem(p)
      const ink = glpInk(p)
      const rise = glpRise(p)
      const bloom = glpBloom(p)

      // the light: the pointer, or a slow drift from the top right
      const ptr = pointerRef.current
      const wantLight = ptr ? Math.atan2(ptr.y - cy, ptr.x - cx) : -1.05 + Math.sin(now / 5200) * 0.22
      light += glpAngleDelta(light, wantLight) * (reduced ? 1 : 0.07)
      const tx = ptr ? ((ptr.x - cx) / Math.max(1, w)) * 16 : 0
      const ty = ptr ? ((ptr.y - cy) / Math.max(1, h)) * 16 : 0
      px += (tx - px) * 0.08
      py += (ty - py) * 0.08
      if (!reduced) {
        goldCanvas.style.transform = "translate3d(" + (px * 0.45).toFixed(2) + "px," + (py * 0.45).toFixed(2) + "px,0)"
        inkCanvas.style.transform = "translate3d(" + (px * 0.2).toFixed(2) + "px," + (py * 0.2).toFixed(2) + "px,0)"
        lotus.style.translate = (px * 0.95).toFixed(2) + "px " + (py * 0.95).toFixed(2) + "px"
      }

      // the moon's radius, and the flood
      let r = mr * ink
      let amp = 1
      let ringAlpha = 1
      let rim = ink
      let flash = 0
      let stemNow = stem
      const cur = localPhase
      if (cur === "hold") {
        flash = glpClamp((now - holdAt) / 1000, 0, 1)
      } else if (cur === "flood") {
        const k = glpEaseInOut((now - floodAt) / FLOOD_MS)
        r = mr + (cover - mr) * k
        amp = 1 + 2.2 * k
        ringAlpha = 1 - glpStage(k, 0.1, 0.7)
        rim = 1 - glpStage(k, 0, 0.35)
        // the stem sinks back into the water as the ink rises
        stemNow = 1 - glpEaseInOut(glpStage(k, 0.05, 0.75))
      } else if (cur === "card" || cur === "open") {
        r = cover
        amp = 3
        ringAlpha = 0
        rim = 0
        stemNow = 0
      } else if (cur === "recede") {
        const k = glpEaseInOut((now - recedeAt) / RECEDE_MS)
        r = cover * (1 - k)
        amp = 3 - 2 * k
        ringAlpha = 0
        rim = 0
      }

      drawInk(now, r, amp, cur === "recede" ? 0 : stemNow, cur === "recede" ? 1 - glpStage(now - recedeAt, 0, RECEDE_MS) : ink, rim, cur === "draw" || cur === "hold" ? rise : 0)
      drawGold(now, dt, lead, ringAlpha, flash)
      updateLotus(cur === "recede" ? 0 : rise, bloom)
    }

    layout()
    started = performance.now()
    last = started
    raf = requestAnimationFrame(frame)
    const ro = new ResizeObserver(() => layout())
    ro.observe(root)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [run, colorKey, seed])

  // After the ink has parted: open the gate.
  React.useEffect(() => {
    if (phase !== "open") return
    const t = setTimeout(() => {
      setPhase("done")
      onCompleteRef.current?.()
    }, OPEN_MS)
    return () => clearTimeout(t)
  }, [phase])

  const replay = () => {
    rushRef.current = false
    setPct(0)
    setPhase("draw")
    setRun((r) => r + 1)
  }

  const onActivate = () => {
    const ph = phaseRef.current
    if (ph === "draw") rushRef.current = true
    else if (loop && ph === "card") replay()
  }

  const done = phase === "done"
  const showGate = loop || !done
  const count = (pct < 10 ? "00" : pct < 100 ? "0" : "") + pct
  const gradFront = uid + "-pf"
  const gradBack = uid + "-pb"
  const gradGold = uid + "-pg"

  return (
    <div
      ref={rootRef}
      className={"glp-root " + className}
      style={
        {
          height,
          "--glp-canvas": colors.canvas,
          "--glp-text": colors.text,
          "--glp-gold": colors.gold,
          "--glp-gold-light": colors.goldLight,
          "--glp-serif": serifFamily,
          "--glp-mono": monoFamily,
        } as React.CSSProperties
      }
      onPointerMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        pointerRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
      }}
      onPointerLeave={() => {
        pointerRef.current = null
      }}
    >
      <style>{GLP_CSS}</style>
      {loop ? null : children}
      {showGate ? (
        <div
          className="glp-gate"
          data-phase={phase}
          role="progressbar"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          tabIndex={0}
          onClick={onActivate}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              onActivate()
            }
          }}
        >
          <canvas ref={linenRef} className="glp-layer" aria-hidden="true" />
          <canvas ref={inkRef} className="glp-layer" aria-hidden="true" />
          <canvas ref={goldRef} className="glp-layer" aria-hidden="true" />
          <svg ref={lotusRef} className="glp-lotus" viewBox="-120 -118 240 138" aria-hidden="true" focusable="false">
            <defs>
              <linearGradient id={gradFront} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={colors.petalTip} />
                <stop offset="0.12" stopColor={colors.petalBase} />
                <stop offset="0.34" stopColor={colors.petal} />
                <stop offset="0.88" stopColor={colors.petal} />
                <stop offset="1" stopColor={colors.petalBase} />
              </linearGradient>
              <linearGradient id={gradBack} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={colors.petalTip} />
                <stop offset="0.16" stopColor={colors.petalBase} />
                <stop offset="0.44" stopColor={colors.petal} />
                <stop offset="0.82" stopColor={colors.petalBase} />
                <stop offset="1" stopColor={colors.petalTip} />
              </linearGradient>
              <linearGradient id={gradGold} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor={colors.goldDeep} />
                <stop offset="0.5" stopColor={colors.goldLight} />
                <stop offset="1" stopColor={colors.gold} />
              </linearGradient>
            </defs>
            <g ref={bloomRef} opacity="0">
              {PETALS.map((p, i) => (
                <g
                  key={i}
                  ref={(el) => {
                    petalRefs.current[i] = el
                  }}
                >
                  <path
                    className="glp-petal"
                    d={glpPetalPath(p.length, p.width)}
                    fill={"url(#" + (p.row === "back" || p.row === "outer" ? gradBack : gradFront) + ")"}
                    stroke={colors.petalTip}
                    strokeOpacity={p.row === "front" ? 0.28 : 0.42}
                    strokeWidth="0.55"
                    strokeLinejoin="round"
                  />
                  {p.row !== "front" ? (
                    <path d={glpPetalPath(p.length, p.width)} fill="#2a1418" opacity={p.row === "mid" ? 0.08 : 0.16} />
                  ) : null}
                  <path d={glpVeinPath(p.length)} fill="none" stroke={colors.petalTip} strokeOpacity="0.22" strokeWidth="0.5" />
                </g>
              ))}
              <path
                d="M-7 3C-13 0 -16 -7 -10 -9M7 3C13 0 16 -7 10 -9"
                fill="none"
                stroke={"url(#" + gradGold + ")"}
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <ellipse cx="0" cy="2.2" rx="5.5" ry="2.4" fill={"url(#" + gradGold + ")"} />
            </g>
          </svg>
          {hud ? (
            <>
              {meta ? (
                <div className="glp-corner glp-tl" aria-hidden="true">
                  <span>{meta}</span>
                </div>
              ) : null}
              {hint ? (
                <div className="glp-corner glp-bl" aria-hidden="true">
                  <span>{hint}</span>
                </div>
              ) : null}
              <div className="glp-corner glp-br" aria-hidden="true">
                <span className="glp-rule" />
                <span className="glp-count">
                  {count}
                  <small>%</small>
                </span>
              </div>
            </>
          ) : null}
          {title ? (
            <div className="glp-card" aria-hidden={phase !== "card"}>
              <h2 className="glp-title">{title}</h2>
              <span className="glp-card-rule" />
              {tagline ? <p className="glp-tagline">{tagline}</p> : null}
              {loop ? <span className="glp-replay">Click to replay</span> : null}
            </div>
          ) : null}
          <span className="glp-sr" aria-live="polite">
            {phase === "draw" ? "" : title || "Loaded"}
          </span>
        </div>
      ) : null}
    </div>
  )
}
