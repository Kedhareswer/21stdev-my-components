"use client"

// Darwaza Preloader — a loading gate in the manner of a Jaipur doorway: a
// pink-washed wall, a cusped Mughal arch framed in steel blue and white
// plaster, and a pair of rose timber doors. The doorway starts as bare
// plaster and raw wood. As the page loads, paint rises up the frame like a
// gauge — the blue climbs, the doors turn rose, brass studs pop in and the
// plaster leaves bloom as the paint line passes them. At 100 the title
// cascades along the arch, two hands rise from the bottom corners holding
// gold rings, their bangles settle, the rings click onto the door plates and
// the hands withdraw. The doors swing inward and the camera pushes through
// the doorway onto whatever the gate was guarding.
//
// One file, React only. SVG for the wall, the frame and the hands; DOM for
// the doors (they swing in real 3D) and the counter. Every rule in the
// scoped <style> is .dwz- prefixed and nothing is fetched.

import * as React from "react"

export interface DarwazaPalette {
  /** The wall wash. */
  wall: string
  /** The painted frame. */
  frame: string
  /** Plaster: the moulding and the relief work. */
  plaster: string
  /** The painted doors. */
  door: string
  /** Rings, studs, bangles. */
  brass: string
  /** The title, the monogram and the corner type. */
  ink: string
  /** Skin of the hands. */
  skin: string
  /** The left sleeve: a sheer dupatta. */
  sleeveLeft: string
  /** The right sleeve: embroidered cloth. */
  sleeveRight: string
  /** Bangles on the left wrist, worn in this order from the hand down. */
  banglesLeft: string[]
  /** Bangles on the right wrist. */
  banglesRight: string[]
}

export type DarwazaPreset = "gulabi" | "neel" | "haldi"

export interface DarwazaPreloaderProps {
  /** Content revealed through the doors. Ignored while `loop` is set. */
  children?: React.ReactNode
  /** Run forever as a showcase: children are never revealed, onComplete never fires. */
  loop?: boolean
  /** Real loading progress, 0–100. Leave undefined to simulate over `durationMs`. */
  progress?: number
  /** Length of the simulated load. Defaults to 5600ms. */
  durationMs?: number
  /** Wall, frame, doors and hands. Defaults to "gulabi" (Jaipur pink). */
  preset?: DarwazaPreset
  /** Colour overrides, merged over the preset. */
  palette?: {
    wall?: string; frame?: string; plaster?: string; door?: string; brass?: string; ink?: string
    skin?: string; sleeveLeft?: string; sleeveRight?: string; banglesLeft?: string[]; banglesRight?: string[]
  }
  /** The line that arches over the doors. Defaults to "Pesh Karte Hain". */
  title?: string
  /** The small mark above the doorway. Defaults to "etc". */
  monogram?: string
  /** Replaces the monogram with your own node, centred above the doorway. */
  logo?: React.ReactNode
  /** Top-left line. */
  meta?: string
  /** The line seen through the open doors when there are no children. */
  message?: string
  /** The hands and the rings. Defaults to true. */
  hands?: boolean
  /** Corner type and the counter. Defaults to true. */
  hud?: boolean
  /** Accessible name of the progress bar. */
  label?: string
  /** Face for the title and the monogram. */
  displayFamily?: string
  /** Face for the corner type. */
  monoFamily?: string
  /** Root height while the gate is up. A definite length, never a percentage. */
  height?: string
  /** Fired once, after the camera has passed through the doorway. */
  onComplete?: () => void
  className?: string
}

const PRESETS: { [K in DarwazaPreset]: DarwazaPalette } = {
  gulabi: {
    wall: "#e2176f", frame: "#87b0d6", plaster: "#f6f3ec", door: "#e9a6b2", brass: "#d8a84a", ink: "#ffffff",
    skin: "#e4b08c", sleeveLeft: "#f7cdb6", sleeveRight: "#c21633",
    banglesLeft: ["#c4102b", "#f08a2a", "#e9c25e", "#c4102b", "#f2a73a", "#e9c25e"],
    banglesRight: ["#e8c75f", "#f3dc8a", "#d6a63c", "#e8c75f", "#d6a63c"],
  },
  neel: {
    wall: "#1d2a67", frame: "#79c2bd", plaster: "#f4eee0", door: "#d9a94e", brass: "#f0d58a", ink: "#f7f1e3",
    skin: "#d7a27a", sleeveLeft: "#efd3b4", sleeveRight: "#8f1d3c",
    banglesLeft: ["#f0d58a", "#2a9d8f", "#f0d58a", "#b3242f", "#f0d58a"],
    banglesRight: ["#f0d58a", "#e9c46a", "#f0d58a", "#e9c46a"],
  },
  haldi: {
    wall: "#f0b429", frame: "#2f6f55", plaster: "#fbf6e8", door: "#d94f72", brass: "#9c6b1f", ink: "#fffaf0",
    skin: "#e2ab86", sleeveLeft: "#fbe3d3", sleeveRight: "#1f4d3a",
    banglesLeft: ["#2f6f55", "#d94f72", "#f6d365", "#2f6f55", "#d94f72"],
    banglesRight: ["#f6d365", "#d94f72", "#f6d365", "#2f6f55"],
  },
}

const DISPLAY_STACK = '"Yatra One", "Bodoni Moda", "Playfair Display", Didot, "Iowan Old Style", Georgia, serif'
const MONO_STACK = '"JetBrains Mono", "SF Mono", ui-monospace, Menlo, Consolas, monospace'

// The stage: a 1000 × 1200 drawing, fitted into the root.
const SW = 1000
const SH = 1200
// The opening: x 200–800, springing at 600, apex at 320, down to the floor at 1200.
const OX0 = 200
const OX1 = 800
const OYS = 600
const OYA = 320
const OYB = 1200
const LOBES = 9
// The paint rises from the floor to the top of the frame.
const PAINT_TOP = 150
const PAINT_BOTTOM = OYB + 18
// The rings hang here once placed.
const RING_Y = 760
const RING_DX = 28

const PRESENT_MS = 4300
const PLACE_MS = 2650
const OPEN_MS = 1750
const PUSH_MS = 1550
const PRESENT_RM = 1300
const OPEN_RM = 1000
const PUSH_RM = 700

// #region geometry
// Pure helpers, lifted out and executed by tests/darwaza-preloader.test.mjs.

/** The simulated load at time fraction t ∈ [0, 1]: eased, with stalls, monotonic, 0 → 100. */
export function dwzSimulated(t: number) {
  const k = t < 0 ? 0 : t > 1 ? 1 : t
  const ease = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2
  const stall = 0.035 * Math.sin(k * Math.PI * 3) * Math.sin(k * Math.PI)
  return Math.max(0, Math.min(100, (ease - stall) * 100))
}

/** Two decimals, no trailing noise. */
export function dwzN(v: number) {
  return String(Math.round(v * 100) / 100)
}

/**
 * A cusped (multifoil) arch: from the floor up the left jamb, over `lobes`
 * outward-bulging foils to the right jamb and back down. The envelope is the
 * half-ellipse spanning x0–x1 with its apex at ya; the foils bulge outside it.
 */
export function dwzArch(x0: number, x1: number, ys: number, ya: number, yb: number, lobes: number) {
  const cx = (x0 + x1) / 2
  const a = (x1 - x0) / 2
  const b = ys - ya
  const pts: number[][] = []
  for (let i = 0; i <= lobes; i++) {
    const th = Math.PI - (Math.PI * i) / lobes
    pts.push([cx + a * Math.cos(th), ys - b * Math.sin(th)])
  }
  let d = "M" + dwzN(x0) + " " + dwzN(yb) + " L" + dwzN(pts[0][0]) + " " + dwzN(pts[0][1])
  for (let i = 1; i <= lobes; i++) {
    const p = pts[i - 1]
    const q = pts[i]
    const r = Math.hypot(q[0] - p[0], q[1] - p[1]) * 0.58
    d += " A" + dwzN(r) + " " + dwzN(r) + " 0 0 0 " + dwzN(q[0]) + " " + dwzN(q[1])
  }
  return d + " L" + dwzN(x1) + " " + dwzN(yb) + " Z"
}

/** The opening, grown outward by `pad` on the jambs and the apex. */
export function dwzOpening(pad: number) {
  return dwzArch(OX0 - pad, OX1 + pad, OYS, OYA - pad, OYB + 1, LOBES)
}

/** The paint's wet edge: a rect from y=0 down to `depth`, with a gently waved top. */
export function dwzWave(x0: number, x1: number, depth: number, amp: number) {
  const wl = 180
  let d = "M" + dwzN(x0 - wl) + " 0"
  for (let x = x0 - wl; x < x1 + wl; x += wl) {
    d += " Q" + dwzN(x + wl / 4) + " " + dwzN(-amp) + " " + dwzN(x + wl / 2) + " 0"
    d += " Q" + dwzN(x + (wl * 3) / 4) + " " + dwzN(amp) + " " + dwzN(x + wl) + " 0"
  }
  return d + " V" + dwzN(depth) + " H" + dwzN(x0 - wl) + " Z"
}

/** Where the paint line sits for a load of `pct`: the floor at 0, the top of the frame at 100. */
export function dwzPaintY(pct: number) {
  const p = Math.max(0, Math.min(100, pct)) / 100
  return PAINT_BOTTOM - (PAINT_BOTTOM - PAINT_TOP) * p
}

/** How to fit the stage into a root of w × h: scale and offsets. The doors reach the floor on wide screens. */
export function dwzFit(w: number, h: number) {
  const k = Math.max(0.05, Math.min((w * 0.92) / SW, h / SH))
  return { k, ox: (w - SW * k) / 2, oy: (h - SH * k) / 2 }
}

/** The zoom that carries the opening past every edge of a root of w × h. */
export function dwzZoom(w: number, h: number, k: number) {
  return Math.max(w / ((OX1 - OX0) * k), h / ((OYB - OYA) * k)) * 1.12
}

/** Title size on the arch: 58 for up to 15 letters, smaller so a longer line still fits the curve. */
export function dwzTitleSize(len: number) {
  return Math.max(26, Math.min(58, 870 / Math.max(1, len)))
}

/** Hex colour → [r, g, b], or the fallback for anything else. */
export function dwzHex(c: string, fallback: number[]) {
  const m = /^#([0-9a-f]{6})$/i.exec(c.trim())
  if (!m) return fallback
  const n = parseInt(m[1], 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/** Mix a hex colour toward black (amt < 0) or white (amt > 0), amt ∈ [-1, 1]. */
export function dwzShade(c: string, amt: number) {
  const [r, g, b] = dwzHex(c, [128, 128, 128])
  const t = amt < 0 ? 0 : 255
  const f = Math.abs(amt)
  const mix = (v: number) => Math.round(v + (t - v) * f)
  return "rgb(" + mix(r) + "," + mix(g) + "," + mix(b) + ")"
}
// #endregion

const DWZ_CSS = `
.dwz-root { position: relative; overflow: hidden; background: var(--dwz-wall); color: var(--dwz-ink); isolation: isolate; -webkit-font-smoothing: antialiased; }
.dwz-page { position: absolute; inset: 0; overflow: auto; }
.dwz-root[data-done="true"] { overflow: visible; }
.dwz-root[data-done="true"] .dwz-page { position: static; overflow: visible; }
.dwz-stage { position: absolute; inset: 0; display: grid; place-items: center; text-align: center; background: var(--color-background, #faf7f2); color: var(--color-foreground, #1a1412); }
.dwz-stage-glow { position: absolute; inset: 0; background: radial-gradient(ellipse 60% 55% at 50% 45%, rgba(255,255,255,.55), transparent 70%); }
.dwz-stage p { position: relative; margin: 0; font-family: var(--dwz-display); font-size: clamp(30px, 5vw, 64px); line-height: 1.05; letter-spacing: .02em; }
.dwz-stage small { position: relative; display: block; margin-top: 14px; font-family: var(--dwz-mono); font-size: 10px; letter-spacing: .24em; text-transform: uppercase; opacity: .5; }
.dwz-gate { position: absolute; inset: 0; z-index: 2; outline: none; cursor: pointer; user-select: none; -webkit-tap-highlight-color: transparent; background: var(--dwz-wall); }
.dwz-gate:focus-visible { box-shadow: inset 0 0 0 3px rgba(255,255,255,.55); }
.dwz-gate[data-phase="paint"] { opacity: 1; transition: opacity 600ms ease; }
.dwz-gate[data-phase="push"] { opacity: 0; transition: opacity 520ms 1000ms ease; }
.dwz-gate[data-phase="push"], .dwz-gate[data-phase="open"] { background: transparent; }
.dwz-scene { position: absolute; inset: 0; transform-origin: var(--dwz-ox) var(--dwz-oy); }
.dwz-gate[data-phase="push"] .dwz-scene { transform: scale(var(--dwz-zoom)); transition: transform 1550ms cubic-bezier(.7,0,.2,1); }
.dwz-svg { position: absolute; inset: 0; display: block; width: 100%; height: 100%; overflow: visible; max-width: none; pointer-events: none; }
.dwz-doors { position: absolute; overflow: hidden; perspective: 1500px; perspective-origin: 50% 46%; }
.dwz-leaf { position: absolute; top: 0; bottom: 0; width: 50%; transform: rotateY(0deg); }
.dwz-leaf-l { left: 0; transform-origin: 0% 50%; }
.dwz-leaf-r { right: 0; transform-origin: 100% 50%; }
.dwz-gate[data-phase="open"] .dwz-leaf, .dwz-gate[data-phase="push"] .dwz-leaf { transition: transform 1750ms cubic-bezier(.76,0,.24,1); }
.dwz-gate[data-phase="open"] .dwz-leaf-l, .dwz-gate[data-phase="push"] .dwz-leaf-l { transform: rotateY(102deg); }
.dwz-gate[data-phase="open"] .dwz-leaf-r, .dwz-gate[data-phase="push"] .dwz-leaf-r { transform: rotateY(-102deg); }
.dwz-leaf svg { position: absolute; inset: 0; width: 100%; height: 100%; display: block; max-width: none; }
.dwz-leaf::after { content: ""; position: absolute; inset: 0; opacity: 0; transition: opacity 1400ms ease; pointer-events: none; }
.dwz-leaf-l::after { background: linear-gradient(to right, rgba(40,8,22,0), rgba(40,8,22,.55)); }
.dwz-leaf-r::after { background: linear-gradient(to left, rgba(40,8,22,0), rgba(40,8,22,.55)); }
.dwz-gate[data-phase="open"] .dwz-leaf::after, .dwz-gate[data-phase="push"] .dwz-leaf::after { opacity: 1; }
.dwz-lintel { position: absolute; inset: 0; pointer-events: none; background: linear-gradient(to bottom, rgba(40,8,22,.34), rgba(40,8,22,0) 16%), linear-gradient(to right, rgba(40,8,22,.22), transparent 7%, transparent 93%, rgba(40,8,22,.22)); }
.dwz-glow { position: absolute; inset: -20%; pointer-events: none; opacity: 0; background: radial-gradient(ellipse 30% 46% at 50% 52%, rgba(255,250,236,.95), rgba(255,250,236,0) 70%); }
.dwz-gate[data-phase="open"] .dwz-glow { animation: dwz-glow 1750ms ease-out both; }
.dwz-hud { position: absolute; z-index: 1; font-family: var(--dwz-mono); font-size: 10px; letter-spacing: .24em; text-transform: uppercase; opacity: .78; transition: opacity 500ms ease; pointer-events: none; }
.dwz-tl { left: clamp(18px, 3vw, 40px); top: clamp(18px, 3vw, 34px); }
.dwz-br { right: clamp(18px, 3vw, 40px); bottom: clamp(16px, 3vw, 28px); text-align: right; display: flex; flex-direction: column; gap: 5px; }
.dwz-count { font-size: 13px; letter-spacing: .14em; font-variant-numeric: tabular-nums; }
.dwz-gate[data-phase="open"] .dwz-hud, .dwz-gate[data-phase="push"] .dwz-hud { opacity: 0; }
.dwz-logo { position: absolute; z-index: 1; display: grid; place-items: center; pointer-events: none; }
.dwz-mono-l { animation: dwz-mono 1000ms cubic-bezier(.2,.7,.2,1) both; }
.dwz-rel { transform-box: fill-box; transform-origin: 50% 100%; transform: scale(0); opacity: 0; transition: transform 900ms cubic-bezier(.34,1.46,.5,1), opacity 300ms ease; }
.dwz-rel[data-on="1"] { transform: scale(1); opacity: 1; }
.dwz-rel-crest { transform-origin: 50% 100%; }
.dwz-stud { transform-box: fill-box; transform-origin: 50% 50%; transform: scale(0); transition: transform 500ms cubic-bezier(.34,1.56,.64,1); }
.dwz-stud[data-on="1"] { transform: scale(1); }
.dwz-title { opacity: 1; }
.dwz-tl-letter { opacity: 0; }
.dwz-gate[data-phase="present"] .dwz-tl-letter, .dwz-gate[data-phase="open"] .dwz-tl-letter, .dwz-gate[data-phase="push"] .dwz-tl-letter { animation: dwz-letter 720ms cubic-bezier(.2,.7,.2,1) both; }
.dwz-gate[data-phase="open"] .dwz-title, .dwz-gate[data-phase="push"] .dwz-title { opacity: 0; transition: opacity 650ms ease; }
.dwz-hand { opacity: 0; transform: translate(0px, 1500px); }
.dwz-gate[data-phase="present"] .dwz-hand { animation: dwz-hand 3700ms cubic-bezier(.16,1,.3,1) 420ms both; }
.dwz-gate[data-phase="present"] .dwz-hand-r { animation-delay: 540ms; }
.dwz-bangles { transform: translate(0px, -14px); }
.dwz-gate[data-phase="present"] .dwz-bangles { animation: dwz-bangle 820ms cubic-bezier(.34,1.56,.64,1) 1700ms both; }
.dwz-gate[data-phase="present"] .dwz-hand-r .dwz-bangles { animation-delay: 1820ms; }
.dwz-ring-held { opacity: 1; }
.dwz-gate[data-placed="true"] .dwz-ring-held { opacity: 0; }
.dwz-ring-door { opacity: 0; }
.dwz-gate[data-placed="true"] .dwz-ring-door { opacity: 1; }
.dwz-spark { transform-box: fill-box; transform-origin: 50% 50%; transform: scale(0); opacity: 0; }
.dwz-gate[data-placed="true"] .dwz-spark { animation: dwz-spark 820ms cubic-bezier(.2,.7,.2,1) both; }
.dwz-gate[data-placed="true"] .dwz-spark-r { animation-delay: 90ms; }
.dwz-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
@keyframes dwz-mono { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
@keyframes dwz-letter { from { opacity: 0; } to { opacity: 1; } }
@keyframes dwz-glow { 0% { opacity: 0; } 35% { opacity: .95; } 100% { opacity: 0; } }
@keyframes dwz-hand {
  0% { opacity: 0; transform: translate(0px, 1500px); animation-timing-function: cubic-bezier(.16,1,.3,1); }
  4% { opacity: 1; }
  38% { transform: translate(0px, 0px); animation-timing-function: ease-in-out; }
  52% { transform: translate(0px, 0px); animation-timing-function: cubic-bezier(.3,0,.2,1); }
  58% { transform: translate(0px, -16px) scale(1.015); animation-timing-function: cubic-bezier(.5,0,.5,1); }
  63% { transform: translate(0px, 6px); animation-timing-function: cubic-bezier(.4,0,.8,.4); }
  68% { transform: translate(0px, 6px); animation-timing-function: cubic-bezier(.55,0,.9,.45); }
  100% { opacity: 1; transform: translate(0px, 1600px); }
}
@keyframes dwz-bangle { from { transform: translate(0px, -14px); } to { transform: translate(0px, 8px); } }
@keyframes dwz-spark { 0% { opacity: 0; transform: scale(0) rotate(0deg); } 30% { opacity: 1; transform: scale(1.15) rotate(25deg); } 100% { opacity: 0; transform: scale(.2) rotate(70deg); } }
@media (prefers-reduced-motion: reduce) {
  .dwz-hand, .dwz-spark, .dwz-glow { display: none; }
  .dwz-rel, .dwz-stud, .dwz-mono-l { transition: none; animation: none; }
  .dwz-tl-letter { animation: none !important; }
  .dwz-gate[data-phase="present"] .dwz-tl-letter, .dwz-gate[data-phase="open"] .dwz-tl-letter, .dwz-gate[data-phase="push"] .dwz-tl-letter { opacity: 1; }
  .dwz-gate[data-phase="open"] .dwz-leaf, .dwz-gate[data-phase="push"] .dwz-leaf { transform: none; opacity: 0; transition: opacity 900ms ease; }
  .dwz-gate[data-phase="push"] .dwz-scene { transform: none; transition: none; }
  .dwz-gate[data-phase="push"] { transition: opacity 650ms ease; }
}
`

// ---- drawing ----

type Pal = DarwazaPalette

/** One plaster relief: a leaf, a curl or the crest, with its cast shadow. */
function Relief({ d, y, pal, transform, cls }: { d: string; y: number; pal: Pal; transform?: string; cls?: string }) {
  return (
    <g transform={transform}>
      <g className={"dwz-rel " + (cls || "")} data-y={y}>
        <path d={d} fill={dwzShade(pal.frame, -0.38)} opacity={0.45} transform="translate(3 4)" />
        <path d={d} fill={pal.plaster} />
      </g>
    </g>
  )
}

// A curling acanthus vine for the left spandrel; the right is its mirror.
const VINE = "M152 470 C150 400, 164 328, 214 292 C256 262, 302 272, 300 304 C298 326, 274 334, 262 318 C253 306, 262 294, 276 298 C282 300, 283 306, 279 309"
const LEAF_A = "M0 0 C-30 -18, -56 -58, -40 -104 C-10 -70, 20 -52, 0 0 Z"
const LEAF_B = "M0 0 C-24 -10, -36 -36, -22 -66 C-6 -46, 10 -34, 0 0 Z"
const LEAF_C = "M0 0 C-14 -8, -22 -24, -10 -46 C0 -30, 10 -22, 0 0 Z"
const BUD = "M0 0 C-10 -4, -14 -18, 0 -30 C14 -18, 10 -4, 0 0 Z"
const CREST = "M0 0 C-22 -14, -42 -46, -30 -84 C-20 -112, -8 -124, 0 -136 C8 -124, 20 -112, 30 -84 C42 -46, 22 -14, 0 0 Z"
const CREST_SIDE = "M0 0 C-26 -6, -56 -22, -62 -58 C-34 -54, -12 -36, 0 0 Z"

function Frame({ pal, paintId }: { pal: Pal; paintId: string }) {
  const hole = dwzOpening(0)
  const pinkBand = dwzOpening(18) + " " + hole
  const whiteBand = dwzOpening(42) + " " + hole
  const raw = "#e6ded0"
  const rawDeep = "#d6ccbb"
  const frameLight = dwzShade(pal.frame, 0.28)
  const frameDeep = dwzShade(pal.frame, -0.22)
  const doorBandPainted = dwzShade(pal.door, 0.3)
  const outer = "M80 150 H920 V1200 H80 Z " + hole
  const band = "M94 164 H906 V1200 H94 Z M118 188 H882 V1200 H118 Z"
  const inner = "M118 188 H882 V1200 H118 Z M138 208 H862 V1200 H138 Z"
  const spandrel = "M138 208 H862 V1200 H138 Z " + hole
  return (
    <g>
      {/* The bare doorway: plaster lip, raw band, white moulding, raw spandrel and arch bands. */}
      <path d={outer} fill={pal.plaster} fillRule="evenodd" />
      <path d={band} fill={raw} fillRule="evenodd" />
      <path d={inner} fill={pal.plaster} fillRule="evenodd" />
      <path d={spandrel} fill={raw} fillRule="evenodd" />
      <path d={whiteBand} fill={pal.plaster} fillRule="evenodd" />
      <path d={pinkBand} fill={rawDeep} fillRule="evenodd" />
      <path d={hole} fill="none" stroke={rawDeep} strokeWidth="6" />
      <path d="M94 164 H906 V1200" fill="none" stroke={dwzShade(raw, -0.12)} strokeWidth="2" />
      {/* The same doorway, painted, revealed by the rising wet edge. */}
      <g clipPath={"url(#" + paintId + ")"}>
        <path d={band} fill={pal.frame} fillRule="evenodd" />
        <path d="M94 164 H906 V1200" fill="none" stroke={frameLight} strokeWidth="3" />
        <path d="M118 188 H882 V1200" fill="none" stroke={frameDeep} strokeWidth="3" />
        <path d={spandrel} fill={pal.frame} fillRule="evenodd" />
        <path d="M138 208 H862 V1200" fill="none" stroke={frameDeep} strokeWidth="4" opacity={0.6} />
        <path d={whiteBand} fill={pal.plaster} fillRule="evenodd" />
        <path d={dwzOpening(42)} fill="none" stroke={dwzShade(pal.frame, -0.3)} strokeWidth="2" opacity={0.5} />
        <path d={pinkBand} fill={doorBandPainted} fillRule="evenodd" />
        <path d={dwzOpening(18)} fill="none" stroke={dwzShade(pal.door, -0.25)} strokeWidth="1.5" opacity={0.7} />
        {/* Covers the sub-pixel seam between the opening and the clipped doors behind it. */}
        <path d={hole} fill="none" stroke={doorBandPainted} strokeWidth="6" />
      </g>
      <path d={inner} fill="none" fillRule="evenodd" stroke={dwzShade(pal.plaster, -0.16)} strokeWidth="1.5" />
      {/* Relief work, blooming as the paint passes. */}
      <g>
        <g data-y={470} className="dwz-rel">
          <path d={VINE} fill="none" stroke={dwzShade(pal.frame, -0.38)} strokeWidth="9" strokeLinecap="round" opacity={0.45} transform="translate(3 4)" />
          <path d={VINE} fill="none" stroke={pal.plaster} strokeWidth="9" strokeLinecap="round" />
        </g>
        <Relief d={LEAF_A} y={440} pal={pal} transform="translate(176 440) rotate(-18)" />
        <Relief d={LEAF_B} y={372} pal={pal} transform="translate(204 372) rotate(22)" />
        <Relief d={LEAF_C} y={318} pal={pal} transform="translate(246 318) rotate(-40)" />
        <Relief d={BUD} y={300} pal={pal} transform="translate(236 304) rotate(-8)" />
        <Relief d={LEAF_B} y={292} pal={pal} transform="translate(288 292) rotate(58)" />
      </g>
      <g transform="translate(1000 0) scale(-1 1)">
        <g data-y={470} className="dwz-rel">
          <path d={VINE} fill="none" stroke={dwzShade(pal.frame, -0.38)} strokeWidth="9" strokeLinecap="round" opacity={0.45} transform="translate(-3 4)" />
          <path d={VINE} fill="none" stroke={pal.plaster} strokeWidth="9" strokeLinecap="round" />
        </g>
        <Relief d={LEAF_A} y={440} pal={pal} transform="translate(176 440) rotate(-18)" />
        <Relief d={LEAF_B} y={372} pal={pal} transform="translate(204 372) rotate(22)" />
        <Relief d={LEAF_C} y={318} pal={pal} transform="translate(246 318) rotate(-40)" />
        <Relief d={BUD} y={300} pal={pal} transform="translate(236 304) rotate(-8)" />
        <Relief d={LEAF_B} y={292} pal={pal} transform="translate(288 292) rotate(58)" />
      </g>
      <Relief d={CREST_SIDE} y={262} pal={pal} transform="translate(486 262)" />
      <Relief d={CREST_SIDE} y={262} pal={pal} transform="translate(514 262) scale(-1 1)" />
      <Relief d={CREST} y={214} pal={pal} cls="dwz-rel-crest" transform="translate(500 270) scale(.55)" />
      <Relief d={BUD} y={282} pal={pal} transform="translate(500 296) scale(.9)" />
    </g>
  )
}

/** One door leaf. Local units: 300 wide, 880 tall (stage 320–1200). `side` -1 hinges left, 1 hinges right. */
function Leaf({ pal, side, clipId, gradId }: { pal: Pal; side: number; clipId: string; gradId: string }) {
  const raw = "#d9ccbc"
  const rawSeam = "#c4b5a3"
  const seam = dwzShade(pal.door, -0.26)
  const plankHi = dwzShade(pal.door, 0.16)
  const brass = pal.brass
  const brassHi = dwzShade(brass, 0.45)
  const brassLo = dwzShade(brass, -0.45)
  // The meeting stile is x=300 for the left leaf, x=0 for the right.
  const meet = side < 0 ? 300 : 0
  const ringX = side < 0 ? 300 - RING_DX : RING_DX
  const ringY = RING_Y - OYA
  const studs: number[][] = []
  for (let y = 160; y <= 860; y += 50) {
    studs.push([24, y])
    studs.push([276, y])
  }
  for (let x = 74; x <= 226; x += 76) {
    studs.push([x, 586])
    studs.push([x, 626])
  }
  for (let y = 180; y <= 540; y += 60) studs.push([150, y])
  for (let y = 700; y <= 840; y += 70) studs.push([150, y])
  return (
    <svg viewBox="0 0 300 880" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={brassHi} />
          <stop offset="0.5" stopColor={brass} />
          <stop offset="1" stopColor={brassLo} />
        </linearGradient>
        <clipPath id={clipId}>
          <path data-leaf-clip="" d={dwzWave(0, 300, 2600, 12)} transform="translate(0 880)" />
        </clipPath>
      </defs>
      {/* Raw timber, then the rose paint rising over it. */}
      <rect width="300" height="880" fill={raw} />
      {[75, 150, 225].map((x) => (
        <rect key={x} x={x - 1.5} width="3" height="880" fill={rawSeam} />
      ))}
      <g clipPath={"url(#" + clipId + ")"}>
        <rect width="300" height="880" fill={pal.door} />
        {[0, 75, 150, 225].map((x) => (
          <rect key={x} x={x + 6} width="30" height="880" fill={plankHi} opacity={0.35} />
        ))}
        {[75, 150, 225].map((x) => (
          <rect key={x} x={x - 1.5} width="3" height="880" fill={seam} opacity={0.85} />
        ))}
        <rect y="568" width="300" height="76" fill={dwzShade(pal.door, -0.14)} />
        <rect y="568" width="300" height="2" fill={seam} opacity={0.6} />
        <rect y="642" width="300" height="2" fill={seam} opacity={0.6} />
        <rect x={meet - 3} y="0" width="6" height="880" fill={dwzShade(pal.door, -0.5)} opacity={0.8} />
        <rect x={side < 0 ? 0 : 296} y="0" width="4" height="880" fill={dwzShade(pal.door, 0.2)} opacity={0.6} />
      </g>
      {/* Brass studs, popping in as the paint passes each row. */}
      {studs.map(([x, y], i) => (
        <g key={i} className="dwz-stud" data-y={y + OYA}>
          <circle cx={x + 1.5} cy={y + 2} r="8" fill={dwzShade(pal.door, -0.5)} opacity={0.5} />
          <circle cx={x} cy={y} r="8" fill={"url(#" + gradId + ")"} />
          <circle cx={x - 2.5} cy={y - 2.5} r="2.6" fill={brassHi} opacity={0.85} />
        </g>
      ))}
      {/* The plate the ring hangs from. */}
      <g>
        <rect x={ringX - 15} y={ringY - 54} width="30" height="30" rx="4" fill={dwzShade(pal.door, -0.5)} opacity={0.5} transform="translate(2 3)" />
        <rect x={ringX - 15} y={ringY - 54} width="30" height="30" rx="4" fill={"url(#" + gradId + ")"} />
        <circle cx={ringX} cy={ringY - 39} r="4" fill={brassLo} />
        <circle cx={ringX} cy={ringY - 39} r="2.2" fill={brassHi} />
      </g>
      <g className="dwz-ring-door">
        <circle cx={ringX + 2} cy={ringY + 3} r="23" fill="none" stroke={dwzShade(pal.door, -0.5)} strokeWidth="7" opacity={0.45} />
        <circle cx={ringX} cy={ringY} r="23" fill="none" stroke={"url(#" + gradId + ")"} strokeWidth="7" />
        <path d={"M" + (ringX - 14) + " " + (ringY - 16) + " A23 23 0 0 1 " + (ringX + 10) + " " + (ringY - 20)} fill="none" stroke={brassHi} strokeWidth="2.2" strokeLinecap="round" opacity={0.9} />
      </g>
    </svg>
  )
}

/** A hand holding a ring, drawn pointing up with the ring at the origin. `side` -1 is the left hand (a mirror). */
function Hand({ pal, side, ids }: { pal: Pal; side: number; ids: string }) {
  const skin = pal.skin
  const skinLo = dwzShade(skin, -0.24)
  const skinHi = dwzShade(skin, 0.16)
  const line = "rgba(84,38,30,.55)"
  const crease = "rgba(84,38,30,.22)"
  const henna = "rgba(110,36,28,.6)"
  const nail = dwzShade(skin, 0.34)
  const brass = pal.brass
  const brassHi = dwzShade(brass, 0.45)
  const brassLo = dwzShade(brass, -0.45)
  const sleeve = side < 0 ? pal.sleeveLeft : pal.sleeveRight
  const bangles = side < 0 ? pal.banglesLeft : pal.banglesRight
  const sheer = side < 0
  const g = ids + (side < 0 ? "l" : "r")
  const rot = side < 0 ? -34 : -38
  const x = side < 0 ? 500 - RING_DX : 500 + RING_DX
  // Index on the left, thumb on the right, their pads meeting on the lower half of the ring.
  const index = "M-58 130 C-62 92, -50 48, -34 18 C-28 4, -8 0, -4 12 C-6 44, -12 86, -16 130 Z"
  const thumb = "M78 152 C80 112, 60 58, 38 22 C32 8, 12 2, 8 14 C14 44, 26 82, 36 130 C42 140, 62 148, 78 152 Z"
  const palm = "M-62 128 C-68 172, -60 216, -46 252 C-28 264, 30 264, 50 252 C66 216, 80 172, 78 152 C70 136, 20 118, -62 128 Z"
  const forearm = "M-44 252 C-54 330, -62 520, -70 760 L-92 1900 L92 1900 L70 760 C62 520, 54 330, 46 252 C30 244, -30 244, -44 252 Z"
  const lobes = [
    [-58, 160, 20],
    [-52, 196, 18],
    [-42, 228, 15],
  ]
  const parts = [palm, index, thumb]
  const cuff = "M-72 352 C-40 366, 40 366, 72 352"
  const sleevePath = sheer
    ? "M-78 322 C-50 340, 50 340, 78 322 C84 500, 96 900, 108 1900 L-108 1900 C-96 900, -84 500, -78 322 Z"
    : "M-76 350 C-44 366, 44 366, 76 350 C82 520, 94 900, 108 1900 L-108 1900 C-94 900, -82 520, -76 350 Z"
  return (
    <g transform={"translate(" + x + " " + RING_Y + ") " + (side < 0 ? "scale(-1 1) " : "") + "rotate(" + rot + ") scale(1.2)"} aria-hidden="true">
      <g className={"dwz-hand " + (side < 0 ? "dwz-hand-l" : "dwz-hand-r")}>
        <defs>
          <linearGradient id={g + "skin"} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={skinHi} />
            <stop offset="0.5" stopColor={skin} />
            <stop offset="1" stopColor={skinLo} />
          </linearGradient>
          <linearGradient id={g + "brass"} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={brassHi} />
            <stop offset="0.5" stopColor={brass} />
            <stop offset="1" stopColor={brassLo} />
          </linearGradient>
        </defs>
        {/* The arm, then the sleeve over it. */}
        <path d={forearm} fill={"url(#" + g + "skin)"} stroke={line} strokeWidth="1.4" />
        {sheer ? (
          <g>
            <path d={sleevePath} fill={sleeve} opacity={0.6} />
            <path d={sleevePath} fill="none" stroke={dwzShade(sleeve, -0.3)} strokeWidth="1.2" opacity={0.55} />
            <path d="M-78 322 C-50 340, 50 340, 78 322" fill="none" stroke={brass} strokeWidth="2.6" strokeDasharray="1 6" strokeLinecap="round" />
            <path d="M-80 420 C-50 436, 50 436, 80 420" fill="none" stroke={brass} strokeWidth="1.6" strokeDasharray="1 8" strokeLinecap="round" opacity={0.6} />
          </g>
        ) : (
          <g>
            <path d={sleevePath} fill={sleeve} stroke={dwzShade(sleeve, -0.35)} strokeWidth="1.2" />
            <path d="M-70 356 C-40 370, 40 370, 70 356 C72 420, 76 500, 80 600 L-80 600 C-76 500, -72 420, -70 356 Z" fill={dwzShade(sleeve, -0.18)} opacity={0.5} />
            <path d={cuff} fill="none" stroke={brass} strokeWidth="5" strokeLinecap="round" />
            <path d={cuff} fill="none" stroke={brassHi} strokeWidth="1.4" strokeDasharray="2 5" strokeLinecap="round" />
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <path key={i} d="M0 0 C-5 -8, -5 -18, 0 -24 C5 -18, 5 -8, 0 0 Z" fill={brass} transform={"translate(" + (-60 + i * 24) + " " + (378 + Math.abs(i - 2.5) * 2) + ") scale(.9)"} />
            ))}
            <path d="M-74 440 C-40 452, 40 452, 74 440" fill="none" stroke={brass} strokeWidth="2" strokeDasharray="3 7" strokeLinecap="round" opacity={0.8} />
            <path d="M-78 520 C-40 532, 40 532, 78 520" fill="none" stroke={brass} strokeWidth="2" strokeDasharray="3 7" strokeLinecap="round" opacity={0.6} />
          </g>
        )}
        {/* Bangles: they settle down the wrist once the hand stops. */}
        <g className="dwz-bangles">
          {bangles.map((c, i) => (
            <g key={i} transform={"translate(" + (i % 2 ? 1.5 : -1.5) + " " + (270 + i * 13) + ") rotate(" + (i % 2 ? 2 : -2) + ")"}>
              <ellipse cx="0" cy="2" rx="58" ry="10" fill="none" stroke="rgba(60,20,20,.28)" strokeWidth="7" />
              <ellipse cx="0" cy="0" rx="58" ry="10" fill="none" stroke={c} strokeWidth="6" />
              <path d="M-48 -6 Q0 -14 48 -6" fill="none" stroke="rgba(255,255,255,.55)" strokeWidth="1.6" strokeLinecap="round" />
            </g>
          ))}
        </g>
        {/* The hand: a stroked underlay for the outline, then the fills over it so only the silhouette keeps a line. */}
        <g fill={line} stroke={line} strokeWidth="2.8" strokeLinejoin="round">
          {parts.map((d, i) => (
            <path key={i} d={d} />
          ))}
          {lobes.map(([cx, cy, r], i) => (
            <circle key={"l" + i} cx={cx} cy={cy} r={r} />
          ))}
        </g>
        <g fill={"url(#" + g + "skin)"}>
          <path d={palm} />
          {lobes.map(([cx, cy, r], i) => (
            <circle key={i} cx={cx} cy={cy} r={r} fill={skin} />
          ))}
          <path d={index} />
          <path d={thumb} />
        </g>
        {/* Creases and the knuckle shadows. */}
        <g fill="none" stroke={crease} strokeWidth="2" strokeLinecap="round">
          {lobes.map(([cx, cy, r], i) => (
            <path key={i} d={"M" + (cx - r * 0.9) + " " + (cy - r * 0.2) + " A" + r + " " + r + " 0 0 1 " + (cx + r * 0.3) + " " + (cy - r * 0.95)} />
          ))}
          <path d="M-48 128 C-30 124, -4 122, 14 126" />
          <path d="M-32 60 C-28 58, -22 58, -18 60" />
          <path d="M26 66 C30 64, 36 64, 40 66" />
        </g>
        {/* Henna on the back of the hand and down the index finger. */}
        <g fill={henna}>
          <circle cx="16" cy="180" r="4" />
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <circle key={i} cx={16 + 13 * Math.cos((i * Math.PI) / 4)} cy={180 + 13 * Math.sin((i * Math.PI) / 4)} r="2.1" />
          ))}
          {[0, 1, 2, 3, 4].map((i) => (
            <circle key={"t" + i} cx={16 + 2 * i} cy={204 + i * 9} r={1.6} />
          ))}
          {[0, 1, 2, 3].map((i) => (
            <circle key={"i" + i} cx={-34 - i * 3} cy={74 + i * 14} r={1.6} />
          ))}
        </g>
        {/* The ring, pinched: its lower half sits behind the pads. */}
        <g className="dwz-ring-held">
          <circle cx="2" cy="3" r="24" fill="none" stroke="rgba(60,20,20,.3)" strokeWidth="8" />
          <circle cx="0" cy="0" r="24" fill="none" stroke={"url(#" + g + "brass)"} strokeWidth="8" />
          <path d="M-15 -17 A24 24 0 0 1 11 -21" fill="none" stroke={brassHi} strokeWidth="2.4" strokeLinecap="round" opacity={0.95} />
        </g>
        <ellipse cx="-17" cy="16" rx="12" ry="14" fill={skin} stroke={line} strokeWidth="1.4" transform="rotate(16 -17 16)" />
        <ellipse cx="21" cy="18" rx="12" ry="14" fill={skin} stroke={line} strokeWidth="1.4" transform="rotate(-22 21 18)" />
        <ellipse cx="-19" cy="13" rx="6" ry="8" fill={nail} stroke={line} strokeWidth=".8" transform="rotate(16 -19 13)" />
        <ellipse cx="22" cy="15" rx="6" ry="8" fill={nail} stroke={line} strokeWidth=".8" transform="rotate(-22 22 15)" />
      </g>
    </g>
  )
}

export default function DarwazaPreloader({
  children,
  loop = false,
  progress,
  durationMs = 5600,
  preset = "gulabi",
  palette,
  title = "Pesh Karte Hain",
  monogram = "etc",
  logo,
  meta = "Portfolio · 2026",
  message = "Khush aamdeed.",
  hands = true,
  hud = true,
  label = "Loading",
  displayFamily = DISPLAY_STACK,
  monoFamily = MONO_STACK,
  height = "100svh",
  onComplete,
  className = "",
}: DarwazaPreloaderProps) {
  const pal: Pal = { ...(PRESETS[preset] || PRESETS.gulabi), ...(palette || {}) } as Pal
  const ids = "dwz" + React.useId().replace(/[^a-zA-Z0-9]/g, "")
  const rootRef = React.useRef(null as HTMLDivElement | null)
  const paintRef = React.useRef(null as SVGPathElement | null)
  const [size, setSize] = React.useState({ w: SW, h: SH })
  const [phase, setPhase] = React.useState("paint" as "paint" | "present" | "open" | "push" | "done")
  const [placed, setPlaced] = React.useState(false)
  const [pct, setPct] = React.useState(0)
  const [run, setRun] = React.useState(0)
  const phaseRef = React.useRef(phase)
  phaseRef.current = phase
  const progressRef = React.useRef(progress)
  progressRef.current = progress
  const onCompleteRef = React.useRef(onComplete)
  onCompleteRef.current = onComplete
  const durationRef = React.useRef(durationMs)
  durationRef.current = durationMs
  const rushRef = React.useRef(false)

  // Fit the stage to the root.
  React.useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    const measure = () => {
      const r = root.getBoundingClientRect()
      const w = Math.max(1, Math.round(r.width))
      const h = Math.max(1, Math.round(r.height))
      setSize((s) => (s.w === w && s.h === h ? s : { w, h }))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(root)
    return () => ro.disconnect()
  }, [])

  // The load: ease the shown value toward the target, move the wet edge, bloom what it passes.
  React.useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const blooms = Array.from(root.querySelectorAll("[data-y]")) as Element[]
    const ys = blooms.map((el) => Number(el.getAttribute("data-y")) || 0)
    const on = blooms.map(() => false)
    const leafClips = Array.from(root.querySelectorAll("[data-leaf-clip]")) as SVGPathElement[]
    let shown = 0
    let pctLast = -1
    let raf = 0
    const started = performance.now()

    const paint = (y: number) => {
      if (paintRef.current) paintRef.current.setAttribute("transform", "translate(0 " + dwzN(y) + ")")
      for (const c of leafClips) c.setAttribute("transform", "translate(0 " + dwzN(y - OYA) + ")")
      for (let i = 0; i < blooms.length; i++) {
        const want = y <= ys[i]
        if (want !== on[i]) {
          on[i] = want
          blooms[i].setAttribute("data-on", want ? "1" : "0")
        }
      }
    }

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      const real = progressRef.current
      const t = (now - started) / Math.max(800, durationRef.current)
      let target = real === undefined ? dwzSimulated(t) : Math.max(0, Math.min(100, Number(real) || 0))
      if (rushRef.current) target = 100
      shown = reduced ? target : Math.max(shown, shown + (target - shown) * (rushRef.current ? 0.16 : 0.1))
      if (target >= 100 && shown > 99.6) shown = 100
      paint(dwzPaintY(shown))
      const p = Math.floor(shown)
      if (p !== pctLast) {
        pctLast = p
        setPct(p)
      }
      if (shown >= 100) {
        cancelAnimationFrame(raf)
        setPhase("present")
      }
    }
    paint(dwzPaintY(0))
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [run])

  // After the load: present the rings, open the doors, push through, done (or replay).
  React.useEffect(() => {
    if (phase === "paint" || phase === "done") return
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const showHands = hands && !reduced
    const timers: number[] = []
    const later = (fn: () => void, ms: number) => timers.push(window.setTimeout(fn, ms))
    if (phase === "present") {
      if (showHands) later(() => setPlaced(true), PLACE_MS)
      else later(() => setPlaced(true), 500)
      later(() => setPhase("open"), reduced ? PRESENT_RM : showHands ? PRESENT_MS : 1500)
    } else if (phase === "open") {
      later(() => setPhase("push"), reduced ? OPEN_RM : OPEN_MS)
    } else if (phase === "push") {
      later(() => {
        if (loop) {
          rushRef.current = false
          setPlaced(false)
          setPct(0)
          setPhase("paint")
          setRun((r) => r + 1)
          return
        }
        setPhase("done")
        onCompleteRef.current?.()
      }, (reduced ? PUSH_RM : PUSH_MS) + (loop ? 500 : 0))
    }
    return () => timers.forEach((t) => clearTimeout(t))
  }, [phase, loop, hands])

  const onActivate = () => {
    if (phaseRef.current === "paint") rushRef.current = true
  }

  const { k, ox, oy } = dwzFit(size.w, size.h)
  const zoom = dwzZoom(size.w, size.h, k)
  const doorL = ox + OX0 * k
  const doorT = oy + OYA * k
  const doorW = (OX1 - OX0) * k
  const doorH = (OYB - OYA) * k
  const doorClip = dwzArch(0, doorW, (OYS - OYA) * k, 0, doorH + 2, LOBES)
  const done = phase === "done"
  const showGate = loop || !done
  const count = (pct < 10 ? "00" : pct < 100 ? "0" : "") + pct
  const letters = Array.from(title)
  const paintId = ids + "paint"
  const clipId = ids + "door"
  const titleArc = "M264 600 A236 206 0 0 1 736 600"
  const monoSize = 108 * k
  const vignette = ids + "vig"

  return (
    <div
      ref={rootRef}
      className={"dwz-root " + className}
      data-done={done ? "true" : "false"}
      style={
        {
          height: done && children ? undefined : height,
          minHeight: done && children ? undefined : height,
          "--dwz-wall": pal.wall,
          "--dwz-ink": pal.ink,
          "--dwz-display": displayFamily,
          "--dwz-mono": monoFamily,
          "--dwz-zoom": dwzN(zoom),
          "--dwz-ox": dwzN(ox + 500 * k) + "px",
          "--dwz-oy": dwzN(oy + RING_Y * k) + "px",
        } as React.CSSProperties
      }
    >
      <style>{DWZ_CSS}</style>
      {loop || !children ? (
        <div className="dwz-stage" aria-hidden={showGate && phase === "paint"}>
          <div className="dwz-stage-glow" />
          <div>
            <p>{message}</p>
            {loop ? <small>Click to rush · replays</small> : null}
          </div>
        </div>
      ) : (
        <div className="dwz-page">{children}</div>
      )}
      {showGate ? (
        <div
          className="dwz-gate"
          data-phase={phase}
          data-placed={placed ? "true" : "false"}
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
          <div className="dwz-scene">
            <div
              className="dwz-doors"
              style={{ left: doorL, top: doorT, width: doorW, height: doorH, clipPath: 'path("' + doorClip + '")' }}
            >
              <div className="dwz-leaf dwz-leaf-l">
                <Leaf pal={pal} side={-1} clipId={clipId + "l"} gradId={ids + "bl"} />
              </div>
              <div className="dwz-leaf dwz-leaf-r">
                <Leaf pal={pal} side={1} clipId={clipId + "r"} gradId={ids + "br"} />
              </div>
              <div className="dwz-lintel" />
              <div className="dwz-glow" />
            </div>
            <svg className="dwz-svg" viewBox={"0 0 " + size.w + " " + size.h} aria-hidden="true">
              <defs>
                <clipPath id={paintId}>
                  <path ref={paintRef} d={dwzWave(0, SW, 2600, 12)} transform={"translate(0 " + OYB + ")"} />
                </clipPath>
                <radialGradient id={vignette} cx="0.5" cy="0.55" r="0.75">
                  <stop offset="0" stopColor="#fff" stopOpacity="0.06" />
                  <stop offset="0.55" stopColor="#000" stopOpacity="0" />
                  <stop offset="1" stopColor="#000" stopOpacity="0.26" />
                </radialGradient>
              </defs>
              <g transform={"translate(" + dwzN(ox) + " " + dwzN(oy) + ") scale(" + dwzN(k) + ")"}>
                {/* The wall, with the doorway cut out of it. */}
                <path d={"M-9000 -9000 H19000 V19000 H-9000 Z " + dwzOpening(0)} fill={pal.wall} fillRule="evenodd" />
                <path d={"M-9000 -9000 H19000 V19000 H-9000 Z " + dwzOpening(0)} fill={"url(#" + vignette + ")"} fillRule="evenodd" />
                <Frame pal={pal} paintId={paintId} />
                {/* The title, arched over the doors. */}
                <path id={ids + "arc"} d={titleArc} fill="none" />
                <text
                  className="dwz-title"
                  fill={pal.ink}
                  fontFamily={displayFamily}
                  fontSize={dwzN(dwzTitleSize(letters.length))}
                  fontWeight="700"
                  letterSpacing="3"
                  style={{ textTransform: "uppercase" }}
                >
                  <textPath href={"#" + ids + "arc"} startOffset="50%" textAnchor="middle">
                    {letters.map((ch, i) => (
                      <tspan key={i} className="dwz-tl-letter" style={{ animationDelay: 180 + i * 48 + "ms" }}>
                        {ch === " " ? " " : ch}
                      </tspan>
                    ))}
                  </textPath>
                </text>
                {/* The hands. */}
                {hands ? (
                  <g>
                    <Hand pal={pal} side={-1} ids={ids} />
                    <Hand pal={pal} side={1} ids={ids} />
                    <g transform={"translate(" + (500 - RING_DX - 30) + " " + (RING_Y - 26) + ")"}>
                      <path className="dwz-spark dwz-spark-l" d="M0 -22 C2 -8, 8 -2, 22 0 C8 2, 2 8, 0 22 C-2 8, -8 2, -22 0 C-8 -2, -2 -8, 0 -22 Z" fill="#fff" />
                    </g>
                    <g transform={"translate(" + (500 + RING_DX + 30) + " " + (RING_Y - 26) + ")"}>
                      <path className="dwz-spark dwz-spark-r" d="M0 -22 C2 -8, 8 -2, 22 0 C8 2, 2 8, 0 22 C-2 8, -8 2, -22 0 C-8 -2, -2 -8, 0 -22 Z" fill="#fff" />
                    </g>
                  </g>
                ) : null}
              </g>
            </svg>
            {/* The mark above the doorway. */}
            <div className="dwz-logo" style={{ left: ox, top: oy + 20 * k, width: SW * k, height: 120 * k }}>
              {logo ? (
                logo
              ) : (
                <svg key={run} viewBox="0 0 400 140" style={{ height: monoSize, width: monoSize * (400 / 140), display: "block", maxWidth: "none", overflow: "visible" }} aria-hidden="true">
                  <text
                    x="200"
                    y="104"
                    textAnchor="middle"
                    fill={pal.ink}
                    fontFamily={displayFamily}
                    fontStyle="italic"
                    fontWeight="400"
                    letterSpacing="-10"
                  >
                    {Array.from(monogram).map((ch, i) => (
                      <tspan
                        key={i}
                        className="dwz-mono-l"
                        fontSize={i === 1 ? 150 : 92}
                        dy={i === 1 ? -6 : i === 2 ? 6 : 0}
                        style={{ animationDelay: 220 + i * 140 + "ms" }}
                      >
                        {ch}
                      </tspan>
                    ))}
                  </text>
                </svg>
              )}
            </div>
          </div>
          {hud ? (
            <>
              <div className="dwz-hud dwz-tl" aria-hidden="true">{meta}</div>
              <div className="dwz-hud dwz-br" aria-hidden="true">
                <span>{phase === "paint" ? label : "Ready"}</span>
                <span className="dwz-count">{count}</span>
              </div>
            </>
          ) : null}
          <span className="dwz-sr" aria-live="polite">
            {phase === "paint" ? "" : title + ". " + (children ? "Loaded." : message)}
          </span>
        </div>
      ) : null}
    </div>
  )
}
