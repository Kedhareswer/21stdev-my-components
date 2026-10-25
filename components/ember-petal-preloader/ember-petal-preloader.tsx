"use client"

// Ember Petal Preloader — a sunlit garden that grows itself while the page loads.
// Warm light pours down from the top edge, out-of-focus stems sway far behind,
// and as the load climbs, stems push up out of the ground, leaves unfurl along
// them and buds swell and open into poppies, tulips and lavender cups. At 100%
// every bloom flares in a wave, pollen lifts into the light, and on the way out
// the camera dives into the flowers until they fill the screen.
//
// One file, React only. Every stem, leaf and petal is a path generated from a
// handful of numbers (length, width, curl, lean), so growing and opening are
// true morphs recomputed each frame rather than a crossfade. The pointer is
// wind: flowers lean away from it on their own springs, and a click sends a
// gust rippling across the garden. Every rule in the scoped <style> is
// .emb- prefixed and nothing is fetched.

import * as React from "react"

export interface EmberPalette {
  /** The light at the top of the sky. */
  sky: string
  /** Mid sky, where it turns warm. */
  haze: string
  /** The ground, the deepest colour on screen. */
  ground: string
  /** Lavender flowers and the cool wash behind them. */
  lilac: string
  /** The pink wash in the mid-ground. */
  rose: string
  /** Main petal colour. */
  petal: string
  /** Petal tips, where the light comes through. */
  petalLight: string
  /** Petal bases, at the heart of the cup. */
  petalDeep: string
  /** The small gold flowers. */
  gold: string
  /** Stems. */
  stem: string
  /** Leaves. */
  leaf: string
  /** The dark foreground leaves. */
  leafDeep: string
  /** The word, caption and count. */
  ink: string
}

/** Any subset of EmberPalette, merged over the preset. */
export interface EmberPaletteInput {
  sky?: string
  haze?: string
  ground?: string
  lilac?: string
  rose?: string
  petal?: string
  petalLight?: string
  petalDeep?: string
  gold?: string
  stem?: string
  leaf?: string
  leafDeep?: string
  ink?: string
}

export type EmberPreset = "ember" | "dusk" | "meadow"

export interface EmberPetalPreloaderProps {
  /** Content revealed once the garden has filled the screen. Ignored while `loop` is set. */
  children?: React.ReactNode
  /** Run forever as a showcase: grow, bloom, hold, set, grow again. `onComplete` never fires. */
  loop?: boolean
  /**
   * Real loading progress, 0–100. Leave undefined to run the built-in
   * simulated load over `durationMs`. The bloom waits until this hits 100.
   */
  progress?: number
  /** Length of the simulated load. Defaults to 4200ms. */
  durationMs?: number
  /** The word set in the light. */
  word?: string
  /** Small line under the word. Pass "" to drop it. */
  caption?: string
  /** Colour preset: "ember" (the sunlit original), "dusk" or "meadow". */
  preset?: EmberPreset
  /** Colour overrides, merged over the preset. */
  palette?: EmberPaletteInput
  /** How crowded the garden is. 1 is the default; 0.6 is sparse, 1.5 is a thicket. */
  density?: number
  /** Seed for the layout. Change it for a different garden with the same settings. */
  seed?: number
  /** How much the garden moves: wind, pointer, gusts. 0 keeps it still. */
  sway?: number
  /** Show the percentage next to the caption while loading. */
  counter?: boolean
  /** Face for the word. Nothing is fetched, so pass one the host already loads. */
  fontFamily?: string
  /** Root height. A definite length, never a percentage. */
  height?: string
  /** Fired once, after the gate has lifted. */
  onComplete?: () => void
  /** Extra root class names. */
  className?: string
}

const PRESETS: { [k: string]: EmberPalette } = {
  ember: {
    sky: "#fff4cc",
    haze: "#ffb878",
    ground: "#ff6a42",
    lilac: "#b89cf2",
    rose: "#ff9cb4",
    petal: "#ff8a3e",
    petalLight: "#ffd98c",
    petalDeep: "#ff5236",
    gold: "#ffc24c",
    stem: "#e8a24e",
    leaf: "#f0953f",
    leafDeep: "#8a2a34",
    ink: "#7a2416",
  },
  dusk: {
    sky: "#5a3f93",
    haze: "#8f4a9c",
    ground: "#d2466e",
    lilac: "#93c7ff",
    rose: "#ff8fd6",
    petal: "#ff7fae",
    petalLight: "#ffd6ea",
    petalDeep: "#d8386f",
    gold: "#ffd27a",
    stem: "#a97adb",
    leaf: "#8a62cf",
    leafDeep: "#2c1a4a",
    ink: "#fff2f8",
  },
  meadow: {
    sky: "#f6fbe6",
    haze: "#d0eaa9",
    ground: "#6ea65a",
    lilac: "#c6b8f6",
    rose: "#ffd6de",
    petal: "#fff3c8",
    petalLight: "#ffffff",
    petalDeep: "#ffc95a",
    gold: "#ffb224",
    stem: "#6d9c42",
    leaf: "#7fb64f",
    leafDeep: "#2f5c2b",
    ink: "#2b4a22",
  },
}

const SERIF_STACK = '"Fraunces", "Playfair Display", "Iowan Old Style", Georgia, "Times New Roman", serif'
const MONO_STACK = '"JetBrains Mono", "SF Mono", ui-monospace, Menlo, Consolas, monospace'

// #region geometry
// Pure helpers, lifted out and executed by tests/ember-petal-preloader.test.mjs.

const clamp01 = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const f1 = (n: number) => String(Math.round(n * 10) / 10)

/** Smoothstep, clamped. */
export function embSmooth(t: number) {
  const x = clamp01(t)
  return x * x * (3 - 2 * x)
}

/** Deterministic noise in [0, 1). */
export function embHash(x: number) {
  const s = Math.sin(x * 12.9898 + 78.233) * 43758.5453
  return s - Math.floor(s)
}

/** A seeded random sequence in [0, 1) (mulberry32). */
export function embRng(seed: number) {
  let a = (Math.floor(seed * 7919) + 1013904223) >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** "#rgb" / "#rrggbb" → [r, g, b]. Anything else is mid grey. */
export function embRgb(hex: string) {
  let h = hex.trim().replace("#", "")
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]
  const n = parseInt(h.slice(0, 6), 16)
  if (h.length < 6 || isNaN(n)) return [128, 128, 128]
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/** Mix two hex colours, t = 0 → a, t = 1 → b. */
export function embMix(a: string, b: string, t: number) {
  const pa = embRgb(a)
  const pb = embRgb(b)
  let out = "#"
  for (let i = 0; i < 3; i++) {
    const v = Math.max(0, Math.min(255, Math.round(lerp(pa[i], pb[i], t))))
    out += (v < 16 ? "0" : "") + v.toString(16)
  }
  return out
}

/** "rgba(r, g, b, a)" from a hex colour. */
export function embAlpha(hex: string, a: number) {
  const c = embRgb(hex)
  return "rgba(" + c[0] + ", " + c[1] + ", " + c[2] + ", " + a + ")"
}

// Surges and stalls like a real load instead of a linear tween. [time, progress] knots.
const KNOTS = [
  [0, 0],
  [0.2, 0.24],
  [0.3, 0.27],
  [0.58, 0.66],
  [0.68, 0.69],
  [1, 1],
]

export function embSimulated(t: number) {
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

/** The count read out next to the caption. */
export function embCounter(v: number) {
  return String(Math.round(Math.min(100, Math.max(0, v)))) + "%"
}

/**
 * A petal: base at the origin, pointing up (-y). `L` length, `w` half-width,
 * `curl` 0–1 flares the tip wide like an open bloom, `tip` scallops (> 0) or
 * notches (< 0) the end, `ruffle` leans the outline to one side.
 */
export function embPetal(L: number, w: number, curl: number, tip: number, ruffle: number) {
  const tw = w * (0.16 + 0.26 * curl)
  const bulge = w * (0.9 + 0.35 * curl)
  const by = -L * (0.56 - 0.12 * curl)
  const dip = L * 0.12 * tip
  const rl = 1 + ruffle * 0.14
  const rr = 1 - ruffle * 0.14
  return (
    "M0 0" +
    " C" + f1(-w * 0.42 * rl) + " " + f1(-L * 0.08) + " " + f1(-bulge * rl) + " " + f1(by) + " " + f1(-tw) + " " + f1(-L) +
    " C" + f1(-tw * 0.6) + " " + f1(-L - dip) + " " + f1(-tw * 0.15) + " " + f1(-L - dip * 0.4) + " 0 " + f1(-L - dip * 0.55) +
    " C" + f1(tw * 0.15) + " " + f1(-L - dip * 0.4) + " " + f1(tw * 0.6) + " " + f1(-L - dip) + " " + f1(tw) + " " + f1(-L) +
    " C" + f1(bulge * rr) + " " + f1(by) + " " + f1(w * 0.42 * rr) + " " + f1(-L * 0.08) + " 0 0 Z"
  )
}

/** A leaf blade: base at the origin, pointing up, tip drooping to +x by `droop`. */
export function embBlade(L: number, w: number, droop: number) {
  const tx = droop * L * 0.3
  return (
    "M0 0" +
    " C" + f1(-w * 0.95) + " " + f1(-L * 0.22) + " " + f1(-w * 0.75 + tx * 0.5) + " " + f1(-L * 0.72) + " " + f1(tx) + " " + f1(-L) +
    " C" + f1(w * 0.8 + tx * 0.6) + " " + f1(-L * 0.7) + " " + f1(w * 0.95) + " " + f1(-L * 0.22) + " 0 0 Z"
  )
}

/** Point on the quadratic stem curve. */
export function embBez(gx: number, gy: number, cx: number, cy: number, tx: number, ty: number, t: number) {
  const u = 1 - t
  return [u * u * gx + 2 * u * t * cx + t * t * tx, u * u * gy + 2 * u * t * cy + t * t * ty]
}

/** Tangent of the quadratic stem curve. */
export function embBezTan(gx: number, gy: number, cx: number, cy: number, tx: number, ty: number, t: number) {
  return [2 * (1 - t) * (cx - gx) + 2 * t * (tx - cx), 2 * (1 - t) * (cy - gy) + 2 * t * (ty - cy)]
}

/** A tapered stem as a closed fill, `w0` half-width at the ground, `w1` at the tip. */
export function embStem(gx: number, gy: number, cx: number, cy: number, tx: number, ty: number, w0: number, w1: number) {
  const n = 12
  const left: string[] = []
  const right: string[] = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const p = embBez(gx, gy, cx, cy, tx, ty, t)
    const d = embBezTan(gx, gy, cx, cy, tx, ty, t)
    const len = Math.hypot(d[0], d[1]) || 1
    const nx = -d[1] / len
    const ny = d[0] / len
    const w = lerp(w0, w1, t)
    left.push(f1(p[0] + nx * w) + " " + f1(p[1] + ny * w))
    right.push(f1(p[0] - nx * w) + " " + f1(p[1] - ny * w))
  }
  right.reverse()
  return "M" + left.join(" L") + " L" + right.join(" L") + " Z"
}

export interface EmbPetalSpec {
  /** Path data. */
  d: string
  /** Rotation about the flower's base, degrees. */
  r: number
  /** 0 back petal, 1 bowl petal, 2 the front lip, which carries the highlight. */
  k: number
}

/**
 * The petals of one flower at a given openness. 0 is a closed bud, 1 fully
 * open, and values past 1 (up to 1.3) are the bloom's overshoot: petals flare
 * wider than they will rest. Back petals come first, then the bowl.
 */
export function embFlower(kind: string, open: number, size: number, seed: number): EmbPetalSpec[] {
  const e = open < 0 ? 0 : open > 1.3 ? 1.3 : open
  const u = e > 1 ? 1 : e
  const x = e - u
  const n = (i: number) => embHash(seed + i * 3.7) - 0.5
  const out: EmbPetalSpec[] = []
  if (kind === "poppy") {
    const L = 40 * size * (1 + 0.14 * u + 0.08 * x)
    const w = 13 * size * (1 + 0.8 * u + 0.45 * x)
    const backA = 10 + 30 * u + 26 * x
    for (const [i, s] of [-1, 0, 1].entries()) {
      out.push({ d: embPetal(L * (1 - 0.1 * Math.abs(s)), w, u, 0.7, n(i) * 0.7), r: s * backA + n(i + 7) * 5, k: 0 })
    }
    const Lb = 36 * size * (1 - 0.04 * u + 0.05 * x)
    const wb = 15 * size * (1 + 0.6 * u + 0.35 * x)
    const bowlA = 8 + 20 * u + 20 * x
    for (const [i, s] of [-1, 1, 0].entries()) {
      out.push({ d: embPetal(s ? Lb : Lb * 0.9, wb, u, 0.95, n(i + 3) * 0.5), r: s * bowlA + n(i + 11) * 3, k: s ? 1 : 2 })
    }
  } else if (kind === "tulip") {
    const L = 38 * size * (1 + 0.04 * u)
    const w = 11 * size * (1 + 0.6 * u + 0.35 * x)
    const backA = 7 + 20 * u + 22 * x
    for (const [i, s] of [-1, 0, 1].entries()) {
      out.push({ d: embPetal(L * (1 - 0.06 * Math.abs(s)), w, u * 0.7, -0.35, n(i) * 0.4), r: s * backA + n(i + 7) * 3, k: 0 })
    }
    for (const [i, s] of [-1, 1].entries()) {
      out.push({ d: embPetal(L * 0.92, w * 1.2, u * 0.6, -0.2, n(i + 3) * 0.4), r: s * (5 + 11 * u + 16 * x) + n(i + 11) * 2, k: i ? 2 : 1 })
    }
  } else {
    const L = 24 * size * (1 + 0.05 * u)
    const w = 8 * size * (1 + 0.5 * u + 0.3 * x)
    for (const [i, s] of [-1, 1, 0].entries()) {
      out.push({ d: embPetal(s ? L * 0.94 : L, w, u * 0.5, 0.45, n(i) * 0.4), r: s * (6 + 12 * u + 14 * x) + n(i + 5) * 3, k: s ? 0 : 2 })
    }
  }
  return out
}

export interface EmbLeaf {
  /** Where on the stem it grows, 0 ground → 1 tip. */
  t: number
  /** -1 left, 1 right. */
  side: number
  len: number
  w: number
  /** Degrees away from the stem. */
  tilt: number
  droop: number
}

export interface EmbPlant {
  /** Ground x, in viewBox units. */
  x: number
  /** Full stem height, or blade length for a ground leaf. */
  h: number
  /** How far the tip wanders sideways. */
  bend: number
  /** "poppy" | "tulip" | "bud" | "leaf". */
  kind: string
  /** "petal" | "lilac" | "gold" | "leaf" | "leafDeep". */
  hue: string
  size: number
  /** 0 far (blurred), 1 mid, 2 near. */
  layer: number
  leaves: EmbLeaf[]
  /** Progress at which it starts to grow. */
  delay: number
  /** Progress at which its bud starts to open. */
  openAt: number
  /** How much progress the opening takes. */
  openSpan: number
  seed: number
  /** Resting tilt of the head, degrees. */
  tilt: number
}

/**
 * Lays out the garden for a box `W` × `H` (viewBox units). Deterministic for
 * a seed. Far plants come first so the array is already in paint order.
 */
export function embGarden(W: number, H: number, density: number, seed: number): EmbPlant[] {
  const rng = embRng(seed)
  const plants: EmbPlant[] = []
  const k = (Math.max(0.2, Math.min(3, density)) * W) / 1000

  const place = (
    count: number,
    layer: number,
    hMin: number,
    hMax: number,
    sMin: number,
    sMax: number,
    dMin: number,
    dMax: number,
  ) => {
    const slot = W / count
    for (let i = 0; i < count; i++) {
      const x = (i + 0.15 + rng() * 0.7) * slot
      const h = H * lerp(hMin, hMax, rng())
      const hr = rng()
      const kr = rng()
      const hue = hr < 0.58 ? "petal" : hr < 0.8 ? "lilac" : "gold"
      const kind =
        hue === "lilac" ? (kr < 0.7 ? "tulip" : "poppy") : hue === "gold" ? (kr < 0.5 ? "bud" : "tulip") : kr < 0.7 ? "poppy" : "tulip"
      const size = lerp(sMin, sMax, rng()) * (kind === "bud" ? 1.15 : 1)
      const leaves: EmbLeaf[] = []
      const nl = 1 + Math.floor(rng() * 2.6)
      for (let j = 0; j < nl; j++) {
        const len = h * lerp(0.14, 0.3, rng())
        leaves.push({
          t: lerp(0.2, 0.78, rng()),
          side: rng() < 0.5 ? -1 : 1,
          len,
          w: len * 0.3,
          tilt: lerp(46, 74, rng()),
          droop: lerp(0.1, 0.5, rng()),
        })
      }
      leaves.sort((a, b) => a.t - b.t)
      const delay = lerp(dMin, dMax, rng())
      const openAt = delay + 0.2
      plants.push({
        x,
        h,
        bend: (rng() - 0.5) * h * 0.36,
        kind,
        hue,
        size,
        layer,
        leaves,
        delay,
        openAt,
        openSpan: Math.max(0.18, 0.96 - openAt),
        seed: rng() * 1000,
        tilt: (rng() - 0.5) * 14,
      })
    }
  }

  place(Math.max(3, Math.round(10 * k)), 0, 0.5, 0.84, 0.85, 1.2, 0, 0.22)
  place(Math.max(3, Math.round(8 * k)), 1, 0.33, 0.58, 1.2, 1.65, 0.08, 0.36)
  place(Math.max(2, Math.round(6 * k)), 2, 0.17, 0.4, 1.9, 2.6, 0.2, 0.5)

  // Dark foreground foliage along the bottom edge.
  const nl = Math.max(3, Math.round(7 * k))
  const slot = W / nl
  for (let i = 0; i < nl; i++) {
    const h = H * lerp(0.14, 0.3, rng())
    plants.push({
      x: (i + 0.1 + rng() * 0.8) * slot,
      h,
      bend: 0,
      kind: "leaf",
      hue: rng() < 0.62 ? "leafDeep" : "leaf",
      size: 1,
      layer: 2,
      leaves: [],
      delay: lerp(0.04, 0.4, rng()),
      openAt: 1,
      openSpan: 1,
      seed: rng() * 1000,
      tilt: (rng() - 0.5) * 56,
    })
  }
  return plants
}
// #endregion

const EMB_CSS = `
.emb-root {
  position: relative;
  width: 100%;
  overflow: hidden;
  background: var(--emb-ground);
  color: var(--emb-ink);
  -webkit-tap-highlight-color: transparent;
}
.emb-gate *, .emb-gate *::before, .emb-gate *::after { box-sizing: border-box; }
.emb-dest {
  position: absolute;
  inset: 0;
  overflow-y: auto;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.7s ease 0.1s;
}
.emb-dest[data-active="true"] { opacity: 1; pointer-events: auto; }

.emb-gate {
  position: absolute;
  inset: 0;
  z-index: 10;
  overflow: hidden;
  cursor: pointer;
  outline: none;
  user-select: none;
  -webkit-user-select: none;
  touch-action: pan-y;
}
.emb-gate::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  box-shadow: inset 0 0 0 0 var(--emb-ink);
  transition: box-shadow 0.2s ease;
}
.emb-gate:focus-visible::after { box-shadow: inset 0 0 0 2px var(--emb-ink); }
.emb-root[data-phase="lift"] .emb-gate { opacity: 0; pointer-events: none; transition: opacity 0.85s ease 0.5s; }

.emb-sky {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, var(--emb-sky) 0%, var(--emb-haze) 46%, var(--emb-ground) 100%);
}
.emb-wash {
  position: absolute;
  inset: -12%;
  background:
    radial-gradient(42% 38% at 82% 24%, var(--emb-lilac-a) 0%, var(--emb-lilac-0) 72%),
    radial-gradient(34% 30% at 16% 42%, var(--emb-rose-a) 0%, var(--emb-rose-0) 72%),
    radial-gradient(28% 26% at 58% 64%, var(--emb-lilac-b) 0%, var(--emb-lilac-0) 72%),
    radial-gradient(40% 34% at 40% 22%, var(--emb-sky-a) 0%, var(--emb-sky-0) 72%);
  animation: emb-drift 18s ease-in-out infinite alternate;
}
.emb-sun {
  position: absolute;
  left: 50%;
  top: 0;
  width: 120%;
  height: 72%;
  transform: translate(-50%, -46%);
  transform-origin: 50% 50%;
  background: radial-gradient(closest-side, var(--emb-white-90) 0%, var(--emb-sky-70) 38%, var(--emb-sky-0) 100%);
  animation: emb-breathe 7s ease-in-out infinite;
  pointer-events: none;
}
.emb-root[data-phase="bloom"] .emb-sun { animation: emb-flare 1.6s cubic-bezier(0.2, 1.2, 0.3, 1) forwards; }
.emb-root[data-phase="hold"] .emb-sun,
.emb-root[data-phase="lift"] .emb-sun { transform: translate(-50%, -46%) scale(1.14); animation: none; }

.emb-grain {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.16;
  mix-blend-mode: multiply;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.5 0 0 0 0 0.3 0 0 0 0 0.2 0 0 0 0.55 0'/></filter><rect width='220' height='220' filter='url(%23n)'/></svg>");
  background-size: 220px 220px;
}
.emb-world {
  position: absolute;
  inset: 0;
  transform-origin: 50% 100%;
}
.emb-root[data-phase="lift"] .emb-world { animation: emb-dive 1.4s cubic-bezier(0.65, 0, 0.35, 1) forwards; }
.emb-far {
  position: absolute;
  inset: -5%;
  filter: blur(9px);
  opacity: 0.92;
  transform-origin: 50% 100%;
  will-change: transform;
}
.emb-haze {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 40%;
  background: linear-gradient(180deg, var(--emb-ground-0) 0%, var(--emb-ground-a) 100%);
  pointer-events: none;
}
.emb-svg {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  max-width: none;
  overflow: visible;
}

.emb-readout {
  position: absolute;
  left: 50%;
  top: clamp(26px, 8%, 72px);
  transform: translateX(-50%);
  width: max-content;
  max-width: 90%;
  text-align: center;
  pointer-events: none;
  transition: opacity 0.5s ease, transform 0.6s cubic-bezier(0.2, 1, 0.3, 1);
}
.emb-root[data-phase="set"] .emb-readout,
.emb-root[data-phase="lift"] .emb-readout { opacity: 0; }
.emb-word {
  font-family: var(--emb-serif);
  font-style: italic;
  font-weight: 400;
  font-size: clamp(34px, 5.4vw, 58px);
  line-height: 1;
  letter-spacing: -0.015em;
  color: var(--emb-ink);
  text-shadow: 0 1px 0 var(--emb-white-40);
  transform-origin: 50% 70%;
}
.emb-root[data-phase="bloom"] .emb-word { animation: emb-pop 0.9s cubic-bezier(0.2, 1.4, 0.3, 1); }
.emb-line {
  margin-top: 10px;
  display: flex;
  justify-content: center;
  align-items: baseline;
  gap: 12px;
  font-family: var(--emb-mono);
  font-size: 11px;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--emb-ink);
  opacity: 0.82;
}
.emb-count {
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.1em;
  min-width: 3.2em;
  text-align: left;
  transition: opacity 0.4s ease;
}
.emb-root:not([data-phase="load"]) .emb-count { opacity: 0; }
.emb-hint {
  margin-top: 8px;
  font-family: var(--emb-mono);
  font-size: 10px;
  letter-spacing: 0.26em;
  text-transform: uppercase;
  color: var(--emb-ink);
  opacity: 0;
  transition: opacity 0.5s ease;
}
.emb-root[data-phase="hold"] .emb-hint { opacity: 0.62; animation: emb-blink 2.4s ease-in-out 0.5s infinite; }
.emb-sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

@keyframes emb-breathe {
  0%, 100% { transform: translate(-50%, -46%) scale(1); }
  50% { transform: translate(-50%, -46%) scale(1.06); }
}
@keyframes emb-flare {
  0% { transform: translate(-50%, -46%) scale(1); }
  45% { transform: translate(-50%, -40%) scale(1.42); }
  100% { transform: translate(-50%, -46%) scale(1.14); }
}
@keyframes emb-drift {
  from { transform: translate(0, 0) scale(1); }
  to { transform: translate(-2%, 1.5%) scale(1.05); }
}
@keyframes emb-dive {
  0% { transform: translateY(0) scale(1); }
  100% { transform: translateY(16%) scale(2.7); }
}
@keyframes emb-pop {
  0% { transform: scale(1); }
  35% { transform: scale(1.09) rotate(-1.2deg); }
  100% { transform: scale(1); }
}
@keyframes emb-blink {
  0%, 100% { opacity: 0.62; }
  50% { opacity: 0.25; }
}

@media (prefers-reduced-motion: reduce) {
  .emb-wash, .emb-sun, .emb-word, .emb-hint { animation: none; }
  .emb-root[data-phase="bloom"] .emb-sun { animation: none; }
  .emb-root[data-phase="lift"] .emb-world { animation: none; }
  .emb-root[data-phase="hold"] .emb-hint { animation: none; opacity: 0.62; }
  .emb-readout { transition: opacity 0.5s ease; }
}
`

type Phase = "load" | "bloom" | "hold" | "lift" | "done" | "set"

const H = 600
const BLOOM_MS = 1600
const HOLD_MS = 2600
const LIFT_MS = 1400
const SET_MS = 1700
const INTRO_MS = 350

interface Hue {
  deep: string
  mid: string
  light: string
}

interface Hues {
  petal: Hue
  lilac: Hue
  gold: Hue
  stemA: string
  stemB: string
  leafA: string
  leafB: string
  deepA: string
  deepB: string
  glow: string
  pistil: string
}

function embHues(c: EmberPalette, far: boolean): Hues {
  const soft = (hex: string, t: number) => (far ? embMix(hex, c.haze, t) : hex)
  const petal: Hue = { deep: soft(c.petalDeep, 0.4), mid: soft(c.petal, 0.4), light: soft(c.petalLight, 0.3) }
  const lilac: Hue = {
    deep: soft(embMix(c.lilac, c.petalDeep, 0.3), 0.4),
    mid: soft(c.lilac, 0.4),
    light: soft(embMix(c.lilac, "#ffffff", 0.55), 0.3),
  }
  const gold: Hue = {
    deep: soft(embMix(c.gold, c.petalDeep, 0.4), 0.4),
    mid: soft(c.gold, 0.4),
    light: soft(embMix(c.gold, "#ffffff", 0.5), 0.3),
  }
  return {
    petal,
    lilac,
    gold,
    stemA: soft(embMix(c.stem, c.leafDeep, 0.3), 0.5),
    stemB: soft(embMix(c.stem, c.petalLight, 0.45), 0.4),
    leafA: soft(c.leaf, 0.5),
    leafB: soft(embMix(c.leaf, c.petalLight, 0.55), 0.4),
    deepA: soft(c.leafDeep, 0.5),
    deepB: soft(embMix(c.leafDeep, c.petal, 0.55), 0.4),
    glow: c.petalLight,
    pistil: embMix(c.petalDeep, c.leafDeep, 0.45),
  }
}

interface Handle {
  g: SVGGElement
  stem: SVGPathElement | null
  leaves: SVGPathElement[]
  head: SVGGElement | null
  petals: SVGPathElement[]
  stamen: SVGGElement | null
  lastOpen: number
  lastKey: number
  shown: boolean
  alpha: number
}

interface Spring {
  a: number
  va: number
  gust: number
}

interface Mote {
  bx: number
  y: number
  r: number
  sp: number
  ph: number
  amp: number
  a: number
}

interface Spark {
  x: number
  y: number
  vx: number
  vy: number
  life: number
}

interface Gust {
  id: number
  x: number
  t0: number
  s: number
}

interface Pointer {
  x: number
  y: number
  speed: number
  t: number
}

const deg = (r: number) => (r * 180) / Math.PI

function Defs({ id, hues }: { id: string; hues: Hues }) {
  const grad = (key: string, a: string, b: string, mid?: string) => (
    <linearGradient key={key} id={id + "-" + key} x1="0" y1="1" x2="0" y2="0">
      <stop offset="0" stopColor={a} />
      {mid ? <stop offset="0.55" stopColor={mid} /> : null}
      <stop offset="1" stopColor={b} />
    </linearGradient>
  )
  const out: React.ReactNode[] = []
  for (const name of ["petal", "lilac", "gold"]) {
    const h = name === "petal" ? hues.petal : name === "lilac" ? hues.lilac : hues.gold
    out.push(grad("b-" + name, h.deep, h.mid))
    out.push(grad("w-" + name, embMix(h.deep, h.mid, 0.5), h.light, h.mid))
    out.push(grad("f-" + name, embMix(h.deep, h.mid, 0.35), embMix(h.light, "#ffffff", 0.2), h.light))
  }
  out.push(grad("stem", hues.stemA, hues.stemB))
  out.push(grad("leaf", hues.leafA, hues.leafB))
  out.push(grad("leafDeep", hues.deepA, hues.deepB))
  return (
    <defs>
      {out}
      <radialGradient id={id + "-glow"} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0.9" />
        <stop offset="0.45" stopColor={hues.glow} stopOpacity="0.55" />
        <stop offset="1" stopColor={hues.glow} stopOpacity="0" />
      </radialGradient>
      <radialGradient id={id + "-mote"} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#fff6d6" stopOpacity="1" />
        <stop offset="0.4" stopColor={hues.gold.mid} stopOpacity="0.8" />
        <stop offset="1" stopColor={hues.gold.mid} stopOpacity="0" />
      </radialGradient>
    </defs>
  )
}

function Plant({ p, i, id, hues }: { p: EmbPlant; i: number; id: string; hues: Hues }) {
  if (p.kind === "leaf") {
    return (
      <g data-p={i} className="emb-plant" style={{ display: "none" }}>
        <path className="emb-blade" d={embBlade(p.h, p.h * 0.3, 0.3)} fill={"url(#" + id + "-" + p.hue + ")"} />
      </g>
    )
  }
  const hue = p.hue === "lilac" ? hues.lilac : p.hue === "gold" ? hues.gold : hues.petal
  const specs = embFlower(p.kind, 1, p.size, p.seed)
  const petal = (s: EmbPetalSpec, j: number) => (
    <path
      key={j}
      className="emb-petal"
      d={s.d}
      transform={"rotate(" + f1(s.r) + ")"}
      fill={"url(#" + id + "-" + (s.k === 0 ? "b" : s.k === 1 ? "w" : "f") + "-" + p.hue + ")"}
      stroke={s.k === 0 ? "none" : hue.light}
      strokeOpacity={s.k === 2 ? 0.7 : 0.45}
      strokeWidth={0.9}
      strokeLinejoin="round"
    />
  )
  const L = (p.kind === "poppy" ? 40 : p.kind === "tulip" ? 38 : 24) * p.size
  const stamens: React.ReactNode[] = []
  if (p.kind !== "bud") {
    const count = p.kind === "poppy" ? 6 : 3
    for (let j = 0; j < count; j++) {
      const a = ((j + 0.5) / count) * Math.PI - Math.PI
      const rx = L * 0.14
      stamens.push(
        <circle
          key={j}
          cx={f1(Math.cos(a) * rx)}
          cy={f1(-L * 0.3 + Math.sin(a) * rx * 0.5)}
          r={f1(Math.max(0.9, 1.5 * p.size))}
          fill={hues.pistil}
        />,
      )
    }
  }
  return (
    <g data-p={i} className="emb-plant" style={{ display: "none" }}>
      <path className="emb-stem" fill={"url(#" + id + "-stem)"} />
      {p.leaves.map((lf, j) => (
        <path key={j} className="emb-leaf" d={embBlade(lf.len, lf.w, lf.droop)} fill={"url(#" + id + "-leaf)"} />
      ))}
      <g className="emb-head">
        {specs.filter((s) => s.k === 0).map(petal)}
        <ellipse
          className="emb-glow"
          cx="0"
          cy={f1(-L * 0.36)}
          rx={f1(L * 0.4)}
          ry={f1(L * 0.42)}
          fill={"url(#" + id + "-glow)"}
          opacity={p.kind === "bud" ? 0.35 : 0.62}
        />
        <g className="emb-stamen" transform="scale(0)">
          {stamens}
        </g>
        {specs.filter((s) => s.k !== 0).map((s, j) => petal(s, j + 3))}
      </g>
    </g>
  )
}

export default function EmberPetalPreloader({
  children,
  loop = false,
  progress,
  durationMs = 4200,
  word = "Bloom",
  caption = "gathering the light",
  preset = "ember",
  palette,
  density = 1,
  seed = 7,
  sway = 1,
  counter = true,
  fontFamily = SERIF_STACK,
  height = "100svh",
  onComplete,
  className = "",
}: EmberPetalPreloaderProps) {
  const uid = "emb" + React.useId().replace(/[^a-zA-Z0-9]/g, "")
  const [phase, setPhase] = React.useState("load" as Phase)
  const [cycle, setCycle] = React.useState(0)
  const [size, setSize] = React.useState({ w: 1280, h: 800 })

  const rootRef = React.useRef(null as HTMLDivElement | null)
  const gateRef = React.useRef(null as HTMLDivElement | null)
  const farRef = React.useRef(null as HTMLDivElement | null)
  const midRef = React.useRef(null as SVGGElement | null)
  const nearRef = React.useRef(null as SVGGElement | null)
  const pollenRef = React.useRef(null as SVGGElement | null)
  const countRef = React.useRef(null as HTMLSpanElement | null)

  const phaseRef = React.useRef("load" as Phase)
  const phaseAtRef = React.useRef(0)
  const shownRef = React.useRef(0)
  const rushRef = React.useRef(false)
  const loopRef = React.useRef(loop)
  const progressRef = React.useRef(progress)
  const durationRef = React.useRef(durationMs)
  const swayRef = React.useRef(sway)
  const onCompleteRef = React.useRef(onComplete)
  const cycleRef = React.useRef(0)

  const handlesRef = React.useRef([] as Handle[])
  const springsRef = React.useRef([] as Spring[])
  const motesRef = React.useRef([] as Mote[])
  const sparksRef = React.useRef([] as Spark[])
  const moteElsRef = React.useRef([] as SVGCircleElement[])
  const sparkElsRef = React.useRef([] as SVGCircleElement[])
  const gustsRef = React.useRef([] as Gust[])
  const gustIdRef = React.useRef(0)
  const pointerRef = React.useRef(null as Pointer | null)
  const parallaxRef = React.useRef({ x: 0, y: 0 })

  React.useEffect(() => {
    loopRef.current = loop
    progressRef.current = progress
    durationRef.current = durationMs
    swayRef.current = sway
    onCompleteRef.current = onComplete
  })

  // ---- the box → a viewBox of the same shape --------------------------------------
  const W = Math.max(360, Math.min(2400, Math.round((H * size.w) / size.h)))
  const paletteKey = JSON.stringify(palette || null)
  const colors = React.useMemo(() => {
    const base = PRESETS[preset] || PRESETS.ember
    const out = { ...base }
    if (palette) {
      for (const k of Object.keys(palette)) {
        const v = (palette as { [k: string]: string | undefined })[k]
        if (v) (out as { [k: string]: string })[k] = v
      }
    }
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset, paletteKey])
  const nearHues = React.useMemo(() => embHues(colors, false), [colors])
  const farHues = React.useMemo(() => embHues(colors, true), [colors])
  const garden = React.useMemo(() => embGarden(W, H, density, seed), [W, density, seed])
  const gardenRef = React.useRef(garden)
  gardenRef.current = garden
  const moteCount = Math.round(26 * (W / 1000)) + 10
  const SPARKS = 28

  React.useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const measure = () => {
      const r = root.getBoundingClientRect()
      if (r.width > 0 && r.height > 0) setSize({ w: Math.round(r.width), h: Math.round(r.height) })
    }
    measure()
    if (typeof ResizeObserver === "undefined") return
    const ro = new ResizeObserver(measure)
    ro.observe(root)
    return () => ro.disconnect()
  }, [])

  // ---- wire the DOM up once per garden --------------------------------------------
  React.useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    const q = (el: Element, sel: string) => Array.from(el.querySelectorAll(sel)) as SVGPathElement[]
    handlesRef.current = garden.map((p, i) => {
      const g = root.querySelector('[data-p="' + i + '"]') as SVGGElement | null
      if (!g) return null as unknown as Handle
      return {
        g,
        stem: g.querySelector(".emb-stem") as SVGPathElement | null,
        leaves: q(g, ".emb-leaf"),
        head: g.querySelector(".emb-head") as SVGGElement | null,
        petals: q(g, ".emb-petal"),
        stamen: g.querySelector(".emb-stamen") as SVGGElement | null,
        lastOpen: -1,
        lastKey: -1,
        shown: false,
        alpha: -1,
      }
    })
    springsRef.current = garden.map(() => ({ a: 0, va: 0, gust: -1 }))
    const rng = embRng(seed + 101)
    motesRef.current = []
    for (let i = 0; i < moteCount; i++) {
      const big = rng() < 0.25
      motesRef.current.push({
        bx: rng() * W,
        y: rng() * H,
        r: big ? lerp(7, 13, rng()) : lerp(1.6, 4, rng()),
        sp: big ? lerp(6, 12, rng()) : lerp(12, 30, rng()),
        ph: rng() * Math.PI * 2,
        amp: lerp(6, 22, rng()),
        a: big ? 0.16 : lerp(0.35, 0.75, rng()),
      })
    }
    sparksRef.current = []
    for (let i = 0; i < SPARKS; i++) sparksRef.current.push({ x: 0, y: 0, vx: 0, vy: 0, life: 0 })
    const pollen = pollenRef.current
    moteElsRef.current = pollen ? (Array.from(pollen.querySelectorAll(".emb-mote")) as SVGCircleElement[]) : []
    sparkElsRef.current = pollen ? (Array.from(pollen.querySelectorAll(".emb-spark")) as SVGCircleElement[]) : []
  }, [garden, W, seed, moteCount])

  // ---- phases ----------------------------------------------------------------------
  React.useEffect(() => {
    phaseRef.current = phase
    phaseAtRef.current = performance.now()
    if (phase === "load") {
      rushRef.current = false
      if (cycleRef.current !== cycle) {
        shownRef.current = 0
        cycleRef.current = cycle
      }
      return
    }
    if (phase === "bloom") {
      const id = setTimeout(() => setPhase("hold"), BLOOM_MS)
      return () => clearTimeout(id)
    }
    if (phase === "hold") {
      const id = setTimeout(() => setPhase(loopRef.current ? "set" : "lift"), HOLD_MS)
      return () => clearTimeout(id)
    }
    if (phase === "lift") {
      const id = setTimeout(() => {
        setPhase("done")
        if (onCompleteRef.current) onCompleteRef.current()
      }, LIFT_MS)
      return () => clearTimeout(id)
    }
    if (phase === "set") {
      const id = setTimeout(() => {
        setCycle((c) => c + 1)
        setPhase("load")
      }, SET_MS + 250)
      return () => clearTimeout(id)
    }
  }, [phase, cycle])

  // ---- the one frame loop: progress, wind, growth, pollen --------------------------
  React.useEffect(() => {
    let raf = 0
    let last = performance.now()
    let lastPct = -1
    const still = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const t = now / 1000
      const ph = phaseRef.current
      const sw = swayRef.current

      // progress
      let shown = shownRef.current
      if (ph === "load") {
        const ext = progressRef.current
        const intro = cycleRef.current === 0 ? INTRO_MS : 0
        let target =
          ext == null ? embSimulated((now - phaseAtRef.current - intro) / Math.max(200, durationRef.current)) : clamp01(ext / 100)
        if (rushRef.current) target = 1
        shown = still ? target : shown + (target - shown) * (1 - Math.exp(-dt * 6))
        if (target >= 1 && shown > 0.996) {
          shown = 1
          phaseRef.current = "bloom"
          phaseAtRef.current = now
          setPhase("bloom")
        }
      } else if (ph === "set") {
        shown = 1 - embSmooth((now - phaseAtRef.current) / SET_MS)
      } else {
        shown = 1
      }
      shownRef.current = shown
      const pct = Math.round(shown * 100)
      if (pct !== lastPct) {
        lastPct = pct
        if (countRef.current) countRef.current.textContent = embCounter(pct)
        if (gateRef.current) gateRef.current.setAttribute("aria-valuenow", String(pct))
      }

      let pulse = 0
      if (!still && (ph === "bloom" || ph === "hold")) {
        const bt = (now - phaseAtRef.current) / BLOOM_MS
        if (ph === "bloom") pulse = Math.sin(bt * Math.PI * 2.4) * Math.exp(-bt * 3) * 0.28
      }
      const lifting = ph === "lift"

      // the pointer as wind, and the layers as parallax
      const ptr = pointerRef.current
      if (ptr && now - ptr.t > 160) ptr.speed *= 0.8
      const px = ptr ? (ptr.x / W) * 2 - 1 : 0
      const py = ptr ? (ptr.y / H) * 2 - 1 : 0
      const par = parallaxRef.current
      const ease = 1 - Math.exp(-dt * 3)
      par.x += (px - par.x) * ease
      par.y += (py - par.y) * ease
      if (!still) {
        if (farRef.current) {
          farRef.current.style.transform =
            "translate3d(" + (-par.x * 1.2).toFixed(2) + "%, " + (-par.y * 0.8).toFixed(2) + "%, 0) rotate(" + (Math.sin(t * 0.45) * 0.4 * sw).toFixed(3) + "deg)"
        }
        if (midRef.current) midRef.current.setAttribute("transform", "translate(" + (-par.x * W * 0.008).toFixed(1) + " 0)")
        if (nearRef.current) nearRef.current.setAttribute("transform", "translate(" + (par.x * W * 0.014).toFixed(1) + " 0)")
      }

      // gusts
      const gusts = gustsRef.current
      for (let i = gusts.length - 1; i >= 0; i--) if (now - gusts[i].t0 > 1500) gusts.splice(i, 1)

      // plants
      const garden = gardenRef.current
      const handles = handlesRef.current
      const springs = springsRef.current
      const gy = H + 4
      for (let i = 0; i < garden.length; i++) {
        const p = garden[i]
        const hd = handles[i]
        const sp = springs[i]
        if (!hd || !sp) continue

        let grow: number
        let open: number
        let alpha = 1
        if (still) {
          grow = 1
          open = 1
          alpha = embSmooth((shown - p.delay) / 0.3)
        } else {
          grow = embSmooth((shown - p.delay) / 0.32)
          open = embSmooth((shown - p.openAt) / p.openSpan) + pulse * (p.kind === "bud" ? 0.4 : 1)
        }
        const visible = still ? alpha > 0.001 : grow > 0.001
        if (!visible) {
          if (hd.shown) {
            hd.g.style.display = "none"
            hd.shown = false
          }
          continue
        }
        if (!hd.shown) {
          hd.g.style.display = ""
          hd.shown = true
        }
        if (alpha !== hd.alpha) {
          hd.g.style.opacity = alpha >= 1 ? "" : alpha.toFixed(3)
          hd.alpha = alpha
        }

        // the spring: pointer, gusts, then settle
        const hh = p.h * grow
        if (!still && sw > 0 && !lifting) {
          const kk = 26 / Math.sqrt(p.size)
          const cc = 2 * Math.sqrt(kk) * 0.3
          if (p.layer > 0 && ptr) {
            const tipX = p.x + p.bend * grow + (sp.a) * hh
            const tipY = gy - hh
            let d: number
            if (ptr.y > tipY && ptr.y < gy && hh > 1) {
              const tt = (gy - ptr.y) / hh
              const sx = p.x + (p.bend * grow + sp.a * hh) * tt * tt + (p.bend * grow * 0.35 + sp.a * hh * 0.3) * 2 * tt * (1 - tt)
              d = ptr.x - sx
            } else {
              const ex = ptr.x - tipX
              const ey = ptr.y - tipY
              d = (ex < 0 ? -1 : 1) * Math.hypot(ex, ey)
            }
            const R = 90 + 36 * p.size
            const ad = Math.abs(d)
            if (ad < R) {
              const push = 1 - ad / R
              sp.va += (d > 0 ? -1 : 1) * push * push * (1.4 + Math.min(3, ptr.speed * 0.0025)) * dt * 9 * sw
            }
          }
          if (p.layer > 0) {
            for (const g of gusts) {
              if (sp.gust === g.id) continue
              const dist = Math.abs(p.x - g.x)
              const front = ((now - g.t0) / 1000) * 1500
              if (dist <= front) {
                sp.gust = g.id
                const fall = Math.max(0.15, 1 - dist / (W * 0.9))
                sp.va += (p.x < g.x ? -1 : 1) * g.s * fall * 2.2 * sw
              }
            }
          }
          sp.va += (-kk * sp.a - cc * sp.va) * dt
          sp.a += sp.va * dt
        } else if (still || sw <= 0) {
          sp.a = 0
          sp.va = 0
        }
        // Far plants keep still so the blurred layer is painted once and then only
        // moved as a whole; near plants ride their spring plus a little idle wind.
        const wind =
          still || p.layer === 0
            ? 0
            : sw *
              0.04 *
              (Math.sin(t * 0.9 + p.seed) * 0.6 + Math.sin(t * 2.3 + p.seed * 1.7) * 0.25 + Math.sin(t * 0.37 + p.seed * 0.4) * 0.5)
        const lean = sp.a + wind
        const key = grow * 1000 + lean + open * 0.001
        if (Math.abs(key - hd.lastKey) < 1e-6) continue
        hd.lastKey = key

        if (p.kind === "leaf") {
          hd.g.setAttribute(
            "transform",
            "translate(" + f1(p.x) + " " + f1(gy) + ") rotate(" + f1(p.tilt + lean * 40) + ") scale(" + f1(grow) + ")",
          )
          continue
        }

        const gx = p.x
        const tx = gx + p.bend * grow + lean * hh
        const ty = gy - hh
        const cx = gx + p.bend * grow * 0.35 + lean * hh * 0.3
        const cy = gy - hh * 0.55
        const w0 = (p.layer === 2 ? 4.2 : 3.4) * Math.sqrt(p.size)
        if (hd.stem) hd.stem.setAttribute("d", embStem(gx, gy, cx, cy, tx, ty, w0, w0 * 0.42))

        for (let j = 0; j < p.leaves.length; j++) {
          const lf = p.leaves[j]
          const el = hd.leaves[j]
          if (!el) continue
          const s = still ? 1 : embSmooth((grow - lf.t) / 0.2)
          if (s <= 0.001) {
            el.setAttribute("transform", "scale(0)")
            continue
          }
          const tt = Math.min(1, lf.t / Math.max(grow, 0.001))
          const pt = embBez(gx, gy, cx, cy, tx, ty, tt)
          const tn = embBezTan(gx, gy, cx, cy, tx, ty, tt)
          const ang = deg(Math.atan2(tn[1], tn[0])) + 90
          el.setAttribute(
            "transform",
            "translate(" + f1(pt[0]) + " " + f1(pt[1]) + ") rotate(" + f1(ang + lf.side * lf.tilt + lean * 30 * lf.side) + ") scale(" + f1(s) + ")",
          )
        }

        if (hd.head) {
          const hs = still ? 1 : 0.2 + 0.8 * embSmooth((grow - 0.08) / 0.92)
          hd.head.setAttribute(
            "transform",
            "translate(" + f1(tx) + " " + f1(ty) + ") rotate(" + f1(lean * 70 + p.tilt + (p.bend / p.h) * 18) + ") scale(" + f1(hs) + ")",
          )
          if (Math.abs(open - hd.lastOpen) > 0.0015) {
            hd.lastOpen = open
            const specs = embFlower(p.kind, open, p.size, p.seed)
            for (let j = 0; j < specs.length; j++) {
              const el = hd.petals[j]
              if (!el) continue
              el.setAttribute("d", specs[j].d)
              el.setAttribute("transform", "rotate(" + f1(specs[j].r) + ")")
            }
            if (hd.stamen) {
              const ss = embSmooth((open - 0.55) / 0.35)
              hd.stamen.setAttribute("transform", "scale(" + f1(ss) + ")")
            }
          }
        }
      }

      // pollen
      if (!still) {
        const motes = motesRef.current
        const els = moteElsRef.current
        const lift = ph === "bloom" ? 3.2 : ph === "hold" ? 1.6 : 1
        const glow = ph === "load" ? 0.45 + shown * 0.55 : 1
        for (let i = 0; i < motes.length; i++) {
          const m = motes[i]
          const el = els[i]
          if (!el) continue
          m.y -= m.sp * lift * dt
          if (m.y < -20) {
            m.y = H + 20
            m.bx = Math.random() * W
          }
          const x = m.bx + Math.sin(t * 0.5 + m.ph) * m.amp + par.x * 12
          el.setAttribute("cx", f1(x))
          el.setAttribute("cy", f1(m.y))
          el.setAttribute("opacity", (m.a * glow * (0.7 + 0.3 * Math.sin(t * 1.3 + m.ph))).toFixed(3))
        }
        const sparks = sparksRef.current
        const sels = sparkElsRef.current
        for (let i = 0; i < sparks.length; i++) {
          const s = sparks[i]
          const el = sels[i]
          if (!el) continue
          if (s.life <= 0) {
            if (el.getAttribute("opacity") !== "0") el.setAttribute("opacity", "0")
            continue
          }
          s.life -= dt
          s.vy += 40 * dt
          s.vx *= 1 - dt * 1.4
          s.x += s.vx * dt
          s.y += s.vy * dt
          el.setAttribute("cx", f1(s.x))
          el.setAttribute("cy", f1(s.y))
          el.setAttribute("opacity", clamp01(s.life / 0.8).toFixed(3))
        }
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [W])

  // ---- pointer ---------------------------------------------------------------------
  const toBox = (e: React.PointerEvent) => {
    const root = rootRef.current
    if (!root) return { x: W / 2, y: H / 2 }
    const r = root.getBoundingClientRect()
    const s = H / Math.max(1, r.height)
    return { x: (e.clientX - r.left) * s, y: (e.clientY - r.top) * s }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    const b = toBox(e)
    const now = performance.now()
    const prev = pointerRef.current
    let speed = 0
    if (prev) {
      const dtm = Math.max(8, now - prev.t)
      speed = (Math.hypot(b.x - prev.x, b.y - prev.y) / dtm) * 1000
      speed = prev.speed * 0.6 + speed * 0.4
    }
    pointerRef.current = { x: b.x, y: b.y, speed, t: now }
  }
  const onPointerLeave = () => {
    pointerRef.current = null
  }

  const gust = (x: number, y: number, strength: number) => {
    gustsRef.current.push({ id: ++gustIdRef.current, x, t0: performance.now(), s: strength })
    const sparks = sparksRef.current
    let n = 0
    for (let i = 0; i < sparks.length && n < 14; i++) {
      const s = sparks[i]
      if (s.life > 0) continue
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2
      const v = 60 + Math.random() * 160
      s.x = x
      s.y = y
      s.vx = Math.cos(a) * v
      s.vy = Math.sin(a) * v - 40
      s.life = 1 + Math.random() * 0.9
      n++
    }
  }

  const activate = (x: number, y: number) => {
    const ph = phaseRef.current
    gust(x, y, ph === "hold" ? 1.4 : 1)
    if (ph === "load") rushRef.current = true
    else if (ph === "hold") setPhase(loopRef.current ? "set" : "lift")
  }

  const loading = phase === "load"
  const label = word.trim() || "Page"

  const vars = {
    height,
    "--emb-sky": colors.sky,
    "--emb-haze": colors.haze,
    "--emb-ground": colors.ground,
    "--emb-ink": colors.ink,
    "--emb-lilac-a": embAlpha(colors.lilac, 0.6),
    "--emb-lilac-b": embAlpha(colors.lilac, 0.32),
    "--emb-lilac-0": embAlpha(colors.lilac, 0),
    "--emb-rose-a": embAlpha(colors.rose, 0.55),
    "--emb-rose-0": embAlpha(colors.rose, 0),
    "--emb-sky-a": embAlpha(colors.sky, 0.8),
    "--emb-sky-70": embAlpha(colors.sky, 0.7),
    "--emb-sky-0": embAlpha(colors.sky, 0),
    "--emb-ground-a": embAlpha(colors.ground, 0.55),
    "--emb-ground-0": embAlpha(colors.ground, 0),
    "--emb-white-90": "rgba(255, 255, 255, 0.9)",
    "--emb-white-40": "rgba(255, 255, 255, 0.4)",
    "--emb-serif": fontFamily,
    "--emb-mono": MONO_STACK,
  } as React.CSSProperties

  const viewBox = "0 0 " + W + " " + H
  const far = garden.filter((p) => p.layer === 0)
  const mid = garden.filter((p) => p.layer === 1)
  const near = garden.filter((p) => p.layer === 2)
  const motes: React.ReactNode[] = []
  for (let i = 0; i < moteCount; i++) {
    motes.push(<circle key={i} className="emb-mote" r={i % 4 === 0 ? 10 : 3} fill={"url(#" + uid + "-n-mote)"} opacity="0" />)
  }
  const sparks: React.ReactNode[] = []
  for (let i = 0; i < SPARKS; i++) {
    sparks.push(<circle key={i} className="emb-spark" r={2.4} fill={"url(#" + uid + "-n-mote)"} opacity="0" />)
  }

  return (
    <div
      ref={rootRef}
      className={"emb-root " + className}
      data-phase={phase}
      style={vars}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      <style>{EMB_CSS}</style>

      {!loop && children ? (
        <div className="emb-dest" data-active={phase === "done"} aria-hidden={phase !== "done"}>
          {children}
        </div>
      ) : null}

      {phase !== "done" ? (
        <div
          ref={gateRef}
          className="emb-gate"
          role="progressbar"
          aria-label={label + " is loading"}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuetext={loading ? "loading" : "Loaded. Press Enter to continue."}
          tabIndex={0}
          onPointerDown={(e) => {
            if (e.button !== 0 && e.pointerType === "mouse") return
            const b = toBox(e)
            activate(b.x, b.y)
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              activate(W / 2, H * 0.55)
            }
          }}
        >
          <div className="emb-sky" />
          <div className="emb-wash" />
          <div className="emb-sun" />

          <div className="emb-world">
            <div className="emb-far" ref={farRef}>
              <svg className="emb-svg" viewBox={viewBox} preserveAspectRatio="xMidYMax meet" aria-hidden="true">
                <Defs id={uid + "-f"} hues={farHues} />
                {far.map((p) => (
                  <Plant key={garden.indexOf(p)} p={p} i={garden.indexOf(p)} id={uid + "-f"} hues={farHues} />
                ))}
              </svg>
            </div>
            <div className="emb-haze" />
            <svg className="emb-svg" viewBox={viewBox} preserveAspectRatio="xMidYMax meet" aria-hidden="true">
              <Defs id={uid + "-n"} hues={nearHues} />
              <g ref={midRef}>
                {mid.map((p) => (
                  <Plant key={garden.indexOf(p)} p={p} i={garden.indexOf(p)} id={uid + "-n"} hues={nearHues} />
                ))}
              </g>
              <g ref={nearRef}>
                {near.map((p) => (
                  <Plant key={garden.indexOf(p)} p={p} i={garden.indexOf(p)} id={uid + "-n"} hues={nearHues} />
                ))}
              </g>
              <g ref={pollenRef} className="emb-pollen">
                {motes}
                {sparks}
              </g>
            </svg>
          </div>

          <div className="emb-grain" />

          <div className="emb-readout" aria-hidden="true">
            <div className="emb-word">{word}</div>
            {caption || counter ? (
              <div className="emb-line">
                {caption ? <span className="emb-caption">{caption}</span> : null}
                {counter ? (
                  <span className="emb-count" ref={countRef}>
                    0%
                  </span>
                ) : null}
              </div>
            ) : null}
            <div className="emb-hint">{loop ? "click to let it set" : "click to come in"}</div>
          </div>
          <span className="emb-sr" aria-live="polite">
            {phase === "hold" ? label + " has loaded." : ""}
          </span>
        </div>
      ) : null}
    </div>
  )
}
