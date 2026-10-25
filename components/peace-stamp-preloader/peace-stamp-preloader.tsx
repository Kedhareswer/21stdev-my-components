"use client"

// Peace Stamp Preloader — a loading gate drawn as a postage stamp. A sheet of
// teal-edged, perforated paper lands on the page and the stamp prints itself
// as the page loads: the striped rules run out, the diagonal bands draw in from
// the corners, the Victorian scrollwork unfurls, the lettered ring turns into
// place, and a gold dog-rose grows on a lit disc, its petals morphing from a
// bud to an open flower. Two sculpted blue hands reach in over the edges of
// the stamp, one pointing, one closing on the stem. At 100% the light flares
// between the fingertips, a postmark cancels the stamp, and it lifts off the
// page to reveal whatever it was guarding.
//
// One file, React only. The stamp is procedural SVG built in the file. The
// hands are Michelangelo's, from the Creation of Adam on the Sistine ceiling
// (public domain; Wikimedia Commons, "Creation of Adam (Michelangelo)
// Detail.jpg"), cut out of the fresco and embedded at the end of the file as
// small greyscale WebP images. A gradient-map filter tints them with the
// palette, so every preset recolours them. Paper grain, ink mottling and the
// postmark's rough edge are SVG filters. Nothing is fetched. Every rule in the
// scoped <style> is .psp- prefixed.

import * as React from "react"

export interface PeaceStampPalette {
  /** The magenta plate: the field, the ring, the lettering's ground. */
  field: string
  /** The teal plate: the perforated edge, the bands, the bars, the scrollwork. */
  band: string
  /** Lettering and hairlines. */
  cream: string
  /** Gold hairlines and dots. */
  gold: string
  /** Edge of the central disc. */
  mint: string
  /** Centre of the disc, where the light is. */
  disc: string
  /** The flower's petals. */
  petal: string
  /** The engraving on the flower, its veins and its heart. */
  petalDark: string
  /** Stem and leaves. */
  leaf: string
  /** The hands. */
  skin: string
  /** The hands' shadow side. */
  skinDark: string
  /** The hands' highlights. */
  skinLight: string
  /** The postmark. */
  ink: string
  /** The stage behind the stamp. Leave out to use the host's background token. */
  stage?: string
}

export interface PeaceStampPaletteOverrides {
  field?: string
  band?: string
  cream?: string
  gold?: string
  mint?: string
  disc?: string
  petal?: string
  petalDark?: string
  leaf?: string
  skin?: string
  skinDark?: string
  skinLight?: string
  ink?: string
  stage?: string
}

export type PeaceStampPreset = "magenta" | "cobalt" | "olive"

export interface PeaceStampPreloaderProps {
  /** Revealed once the stamp lifts. Inert until then. Ignored while `loop` is set. */
  children?: React.ReactNode
  /** Showcase mode: land, load, cancel, lift, and again. `onComplete` never fires. */
  loop?: boolean
  /**
   * Real loading progress, 0–100. Leave undefined to run the built-in
   * simulated load over `durationMs`. The bloom waits for 100.
   */
  progress?: number
  /** Length of the simulated load. Defaults to 5600ms. */
  durationMs?: number
  /** The word on the ring. Three or four letters read best. */
  word?: string
  /** Set up the left panel, reading bottom to top. */
  leftText?: string
  /** Set down the right panel, reading top to bottom. */
  rightText?: string
  /** Set in two of the diagonal bands. */
  cornerText?: string
  /** Set in the other two bands, and on the postmark. */
  year?: string
  /** Face value. The ring counts up to it with the load. */
  value?: number
  /** Currency sign before the value. */
  currency?: string
  /** Decimal separator in the value. European stamps use a comma. */
  decimal?: "," | "."
  /** Text round the postmark. `""` for a plain cancellation. */
  postmark?: string
  /** Colour preset. */
  preset?: PeaceStampPreset
  /** Colour overrides, merged over the preset. */
  palette?: PeaceStampPaletteOverrides
  /** Largest tilt toward the pointer, in degrees. `0` holds the stamp flat. */
  tilt?: number
  /** Show the corner read-out and the hint. */
  hud?: boolean
  /** Accessible name of the progress bar. */
  label?: string
  /** Face for the stamp's lettering. Nothing is fetched. */
  serifFamily?: string
  /** Face for the read-out. Nothing is fetched. */
  monoFamily?: string
  /** Fired once, after the stamp has lifted. */
  onComplete?: () => void
  /** Root height. A definite length, never a percentage. */
  height?: string
  /** Extra root class names. */
  className?: string
}

const PRESETS: { [k: string]: PeaceStampPalette } = {
  magenta: {
    field: "#e8287a",
    band: "#38b8a2",
    cream: "#f8e7c5",
    gold: "#dcae5e",
    mint: "#bfe8d8",
    disc: "#ffffff",
    petal: "#e8c461",
    petalDark: "#94641a",
    leaf: "#8e7d2e",
    skin: "#3d84ea",
    skinDark: "#143c94",
    skinLight: "#a9d4ff",
    ink: "#1f2547",
  },
  cobalt: {
    field: "#2341b6",
    band: "#ef7a4d",
    cream: "#fbeed6",
    gold: "#f0cd7a",
    mint: "#d8e2ff",
    disc: "#ffffff",
    petal: "#f8d670",
    petalDark: "#a06d0e",
    leaf: "#7e9852",
    skin: "#e2543d",
    skinDark: "#5e140b",
    skinLight: "#ffc6b5",
    ink: "#121a3d",
  },
  olive: {
    field: "#5e6a2b",
    band: "#c65a33",
    cream: "#f3e6c8",
    gold: "#dbb662",
    mint: "#ece3c4",
    disc: "#fffaf0",
    petal: "#e6bd5a",
    petalDark: "#7e540e",
    leaf: "#8b893b",
    skin: "#8a6747",
    skinDark: "#2a190b",
    skinLight: "#f0d8b6",
    ink: "#2b2416",
  },
}

// Stamp coordinates. Everything is drawn in this box and scaled to fit.
const W = 800
const H = 540
const CX = 400
const CY = 270
const R_OUT = 236
const R_IN = 162
const R_DISC = 155
const HEAD_X = 394
const HEAD_Y = 176
// How far off the sheet the hands start, in stamp units.
const SLIDE = 520

type Phase = "enter" | "load" | "touch" | "cancel" | "exit" | "done"
type Pt = [number, number]

// #region art
// Pure helpers. The test lifts this region out and executes it, so nothing
// here may touch React or the DOM.

export const pspClamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v)
export const pspLerp = (a: number, b: number, t: number) => a + (b - a) * t
/** 0 at or below `a`, 1 at or above `b`, smooth in between. */
export const pspSmoothstep = (a: number, b: number, v: number) => {
  const t = pspClamp((v - a) / (b - a), 0, 1)
  return t * t * (3 - 2 * t)
}
export const pspEaseOut = (t: number) => 1 - Math.pow(1 - pspClamp(t, 0, 1), 3)
/** Overshoots a little and settles, for things that slide into place. */
export const pspEaseBack = (t: number) => {
  const x = pspClamp(t, 0, 1)
  const c = 1.4
  return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2)
}

/**
 * The simulated load, 0..1 over t in 0..1. Surges, stalls twice, and never
 * runs backwards.
 */
export const pspSimulated = (t: number) => {
  const x = pspClamp(t, 0, 1)
  const fast = 1 - Math.pow(1 - x, 2.2)
  const stall1 = 0.12 * Math.exp(-Math.pow((x - 0.34) / 0.07, 2))
  const stall2 = 0.09 * Math.exp(-Math.pow((x - 0.72) / 0.06, 2))
  const v = pspClamp(fast - (stall1 + stall2) * (1 - x), 0, 1)
  return x >= 1 ? 1 : v
}

/** "€0,68" from 0.68. Counts up through the load with `value * p`. */
export const pspMoney = (value: number, currency: string, decimal: string, p: number) => {
  const v = Math.max(0, value) * pspClamp(p, 0, 1)
  const s = v.toFixed(Number.isInteger(value) ? 0 : 2)
  return currency + (decimal === "," ? s.replace(".", ",") : s)
}

/** Deterministic noise, so the drawing is the same on every mount. */
export const pspRng = (seed: number) => {
  let s = seed >>> 0 || 1
  return () => {
    s ^= s << 13
    s >>>= 0
    s ^= s >>> 17
    s ^= s << 5
    s >>>= 0
    return s / 4294967296
  }
}

const f1 = (n: number) => (Math.round(n * 10) / 10).toString()

/** A closed or open Catmull-Rom spline as cubic path data. */
export const pspSmooth = (pts: Pt[], closed: boolean, tension = 1): string => {
  const n = pts.length
  if (n < 2) return ""
  const at = (i: number) => pts[closed ? ((i % n) + n) % n : pspClamp(i, 0, n - 1)]
  let d = "M" + f1(pts[0][0]) + " " + f1(pts[0][1])
  const segs = closed ? n : n - 1
  const k = tension / 6
  for (let i = 0; i < segs; i++) {
    const p0 = at(i - 1)
    const p1 = at(i)
    const p2 = at(i + 1)
    const p3 = at(i + 2)
    d +=
      "C" + f1(p1[0] + (p2[0] - p0[0]) * k) + " " + f1(p1[1] + (p2[1] - p0[1]) * k) +
      " " + f1(p2[0] - (p3[0] - p1[0]) * k) + " " + f1(p2[1] - (p3[1] - p1[1]) * k) +
      " " + f1(p2[0]) + " " + f1(p2[1])
  }
  return closed ? d + "Z" : d
}

/** Arc path from angle a0 to a1 (degrees, clockwise on screen), for textPath. */
export const pspArc = (cx: number, cy: number, r: number, a0: number, a1: number) => {
  const rad = (a: number) => (a * Math.PI) / 180
  const x0 = cx + r * Math.cos(rad(a0))
  const y0 = cy + r * Math.sin(rad(a0))
  const x1 = cx + r * Math.cos(rad(a1))
  const y1 = cy + r * Math.sin(rad(a1))
  const sweep = a1 > a0 ? 1 : 0
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0
  return "M" + f1(x0) + " " + f1(y0) + "A" + r + " " + r + " 0 " + large + " " + sweep + " " + f1(x1) + " " + f1(y1)
}

/** Perforation holes round a w×h sheet: circle centres on the edge, one every `pitch`. */
export const pspPerforation = (w: number, h: number, pitch: number) => {
  const holes: Pt[] = []
  const nx = Math.round(w / pitch)
  const ny = Math.round(h / pitch)
  const sx = w / nx
  const sy = h / ny
  for (let i = 0; i <= nx; i++) {
    holes.push([Math.round(i * sx * 10) / 10, 0])
    holes.push([Math.round(i * sx * 10) / 10, h])
  }
  for (let j = 1; j < ny; j++) {
    holes.push([0, Math.round(j * sy * 10) / 10])
    holes.push([w, Math.round(j * sy * 10) / 10])
  }
  return holes
}

/**
 * The sheet with its holes punched, as one evenodd path: the sheet, a circle
 * per hole, and a torn tooth at the bottom-left corner.
 */
export const pspPerforationPath = (w: number, h: number, holes: Pt[], r: number) => {
  let d = "M0 0H" + w + "V" + h + "H0Z"
  for (const p of holes) {
    d += "M" + f1(p[0] - r) + " " + f1(p[1]) + "a" + r + " " + r + " 0 1 0 " + 2 * r + " 0a" + r + " " + r + " 0 1 0 " + -2 * r + " 0Z"
  }
  d += "M0 " + (h - 22) + "L0 " + h + "L22 " + h + "Z"
  return d
}

/**
 * A tapered ribbon round a centre line, as a filled outline. The width runs
 * from `w0` at the start through `w1` in the middle to `w2` at the end.
 */
export const pspRibbon = (pts: Pt[], w0: number, w1: number, w2: number) => {
  const n = pts.length
  if (n < 2) return ""
  const L: Pt[] = []
  const R: Pt[] = []
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)]
    const b = pts[Math.min(n - 1, i + 1)]
    const dx = b[0] - a[0]
    const dy = b[1] - a[1]
    const l = Math.hypot(dx, dy) || 1
    const t = i / (n - 1)
    const w = (1 - t) * (1 - t) * w0 + 2 * t * (1 - t) * w1 + t * t * w2
    const nx = (-dy / l) * (w / 2)
    const ny = (dx / l) * (w / 2)
    L.push([pts[i][0] + nx, pts[i][1] + ny])
    R.push([pts[i][0] - nx, pts[i][1] - ny])
  }
  return pspSmooth(L.concat(R.reverse()), true, 0.9)
}

/** A logarithmic spiral from radius r0 at angle a0 (radians) inward, `turns` round. */
export const pspSpiral = (c: Pt, r0: number, a0: number, turns: number, dir: number, n = 26) => {
  const pts: Pt[] = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const a = a0 + dir * t * turns * Math.PI * 2
    const r = r0 * Math.pow(0.18, t)
    pts.push([c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)])
  }
  return pts
}

/**
 * An S-scroll: a spiral at `a`, a sweep, and a spiral the other way at `b`.
 * `side` picks which way the S turns. Returns the ribbon and the two eyes.
 */
export const pspSScroll = (a: Pt, b: Pt, ra: number, rb: number, side: number, w: number) => {
  const th = Math.atan2(b[1] - a[1], b[0] - a[0])
  const sa = pspSpiral(a, ra, th - (side * Math.PI) / 2, 1.05, -side).reverse()
  const sb = pspSpiral(b, rb, th + (side * Math.PI) / 2, 1.05, -side)
  const p0 = sa[sa.length - 1]
  const q0 = sa[sa.length - 2]
  const p3 = sb[0]
  const q3 = sb[1]
  const span = Math.hypot(p3[0] - p0[0], p3[1] - p0[1]) / 2.6
  const ta = Math.atan2(p0[1] - q0[1], p0[0] - q0[0])
  const tb = Math.atan2(q3[1] - p3[1], q3[0] - p3[0])
  const p1: Pt = [p0[0] + Math.cos(ta) * span, p0[1] + Math.sin(ta) * span]
  const p2: Pt = [p3[0] - Math.cos(tb) * span, p3[1] - Math.sin(tb) * span]
  const mid: Pt[] = []
  for (const t of [0.25, 0.5, 0.75]) {
    const u = 1 - t
    mid.push([
      u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
      u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
    ])
  }
  const pts = sa.concat(mid, sb)
  return { d: pspRibbon(pts, w * 0.3, w * 1.25, w * 0.3), eyes: [sa[0], sb[sb.length - 1]] as Pt[] }
}

/** A teardrop leaf with its point at `tip` and its round end toward `base`. */
export const pspDrop = (base: Pt, tip: Pt, wid: number, bend = 0) => {
  const dx = tip[0] - base[0]
  const dy = tip[1] - base[1]
  const l = Math.hypot(dx, dy) || 1
  const nx = -dy / l
  const ny = dx / l
  const at = (u: number, s: number): Pt => [
    base[0] + dx * u + nx * s + nx * bend * Math.sin(Math.PI * u),
    base[1] + dy * u + ny * s + ny * bend * Math.sin(Math.PI * u),
  ]
  return pspSmooth(
    [at(-0.12, 0), at(0.05, wid * 0.5), at(0.4, wid * 0.42), at(0.78, wid * 0.16), at(1, 0), at(0.78, -wid * 0.16), at(0.4, -wid * 0.42), at(0.05, -wid * 0.5)],
    true,
    0.9,
  )
}

/**
 * A Victorian lyre of scrollwork round the origin, about 70 wide and 120
 * tall: two mirrored S-scrolls, two small C-scrolls under them, and leaves.
 */
export const pspLyre = () => {
  const scrolls: string[] = []
  const eyes: Pt[] = []
  for (const s of [1, -1]) {
    const big = pspSScroll([s * 9, -34], [s * 24, 20], 13, 15, s, 6.5)
    const small = pspSScroll([s * 5, 44], [s * 26, 48], 5, 8, -s, 4)
    scrolls.push(big.d, small.d)
    eyes.push(...big.eyes, ...small.eyes)
  }
  const leaves = [
    pspDrop([0, -40], [0, -62], 13),
    pspDrop([0, 30], [0, 6], 10),
    pspDrop([12, -4], [36, -16], 9, -3),
    pspDrop([-12, -4], [-36, -16], 9, 3),
    pspDrop([0, 52], [0, 66], 8),
  ]
  return { scrolls, eyes, leaves }
}

/** The winged fleur in the spandrels: a drop between two curled wings. */
export const pspFleur = () => ({
  wings: [pspDrop([2, 2], [26, -6], 14, -5), pspDrop([-2, 2], [-26, -6], 14, 5)],
  drop: pspDrop([0, -2], [0, 22], 13),
})

/**
 * One dog-rose petal, morphing with t: at 0 a narrow folded bud, at 1 a broad
 * open petal with a notch at its tip and a ruffle in its edge. Drawn with its
 * base at the origin pointing up; rotate it into place.
 */
export const pspPetal = (t: number, len = 60, wid = 58) => {
  const k = pspClamp(t, 0, 1)
  const L = pspLerp(len * 0.46, len, k)
  const Wd = pspLerp(wid * 0.22, wid, k)
  const notch = pspLerp(0, L * 0.1, pspSmoothstep(0.5, 1, k))
  const ruffle = pspLerp(0, 2.6, pspSmoothstep(0.55, 1, k))
  const half: Pt[] = [
    [Wd * 0.12, -L * 0.06],
    [Wd * 0.34, -L * 0.28],
    [Wd * 0.5, -L * 0.56],
    [Wd * 0.5 + ruffle * 0.4, -L * 0.76],
    [Wd * 0.38, -L * 0.94 - ruffle * 0.3],
    [Wd * 0.18, -L * 1.0],
    [Wd * 0.05, -L + notch * 0.7],
  ]
  const pts: Pt[] = [[0, 0], ...half, [0, -L + notch], ...half.slice().reverse().map((p) => [-p[0], p[1]] as Pt)]
  return pspSmooth(pts, true, 0.95)
}

/** Engraved lines up a petal, fanning from its base. Same t as the petal. */
export const pspPetalLines = (t: number, len = 60, wid = 58) => {
  const k = pspClamp(t, 0, 1)
  const L = pspLerp(len * 0.46, len, k)
  const Wd = pspLerp(wid * 0.22, wid, k)
  const out: string[] = []
  for (let i = -4; i <= 4; i++) {
    const u = i / 4
    const ex = Wd * 0.43 * u
    const ey = -L * (0.86 - 0.16 * u * u)
    const reach = i % 2 ? 0.62 : 1
    const x2 = ex * reach
    const y2 = ey * reach
    out.push("M" + f1(u * 1.5) + " " + f1(-L * 0.08) + "Q" + f1(ex * 0.35) + " " + f1(-L * 0.42 * reach) + " " + f1(x2) + " " + f1(y2))
  }
  return out
}

/**
 * The flower's petals at morph t. In the bud they lean together along the
 * bud's axis; open, they sit 72° apart round the heart.
 */
export const pspFlower = (t: number, axis = -24) => {
  const k = pspClamp(t, 0, 1)
  const spread = pspLerp(13, 72, pspEaseOut(k))
  return [0, 1, 2, 3, 4].map((i) => ({
    angle: axis + (i - 2) * spread + pspLerp(0, 5, k) * Math.sin(i * 2.3),
    scale: pspLerp(0.9, 1, k) * (i % 2 ? 0.96 : 1),
    d: pspPetal(k),
    lines: pspPetalLines(k),
  }))
}

/** A serrated rose leaf, base at the origin, pointing up. */
export const pspLeaf = (len: number, wid: number, teeth: number, seed: number) => {
  const rnd = pspRng(seed)
  const right: Pt[] = []
  const left: Pt[] = []
  for (let i = 0; i <= teeth; i++) {
    const u = i / teeth
    const half = (wid / 2) * Math.sin(Math.PI * Math.pow(u, 0.85))
    const tooth = i === 0 || i === teeth ? 0 : (i % 2 ? 1 : 0.86) * (0.95 + rnd() * 0.1)
    right.push([half * tooth, -len * u])
    left.push([-half * tooth, -len * u])
  }
  return pspSmooth(right.concat(left.reverse()), true, 0.6)
}

/** The veins on a leaf, and the engraving on its shadow half. */
export const pspLeafLines = (len: number, wid: number) => {
  const out: string[] = ["M0 -1L0 " + f1(-len * 0.94)]
  for (let i = 1; i <= 5; i++) {
    const u = i / 6.4
    const y = -len * u
    const r = (wid / 2) * Math.sin(Math.PI * Math.pow(u + 0.08, 0.85)) * 0.86
    out.push("M0 " + f1(y) + "Q" + f1(r * 0.5) + " " + f1(y - 5) + " " + f1(r) + " " + f1(y - 11))
    out.push("M0 " + f1(y) + "Q" + f1(-r * 0.5) + " " + f1(y - 5) + " " + f1(-r) + " " + f1(y - 11))
  }
  return out
}

/** A postmark's cancellation bars, wavy, running off to the right. */
export const pspPostmark = (r: number, bars: number) => {
  const out: string[] = []
  for (let i = 0; i < bars; i++) {
    const y = -((bars - 1) / 2) * 11 + i * 11
    const pts: Pt[] = []
    for (let x = 0; x <= 260; x += 10) pts.push([r + 14 + x, y + 4 * Math.sin(x / 14 + i * 0.6)])
    out.push(pspSmooth(pts, false, 1))
  }
  return out
}
// #endregion

const PSP_CSS = `
.psp-root { position: relative; overflow: hidden; isolation: isolate; -webkit-tap-highlight-color: transparent; }
.psp-dest { position: absolute; inset: 0; z-index: 0; overflow: auto; }
.psp-stage { position: absolute; inset: 0; z-index: 1; display: grid; place-items: center; overflow: hidden; outline: none; cursor: default; }
.psp-stage:focus-visible .psp-hud-tl { text-decoration: underline; text-underline-offset: 0.3em; }
.psp-root[data-phase="load"] .psp-stage, .psp-root[data-phase="enter"] .psp-stage { cursor: pointer; }
.psp-root[data-loop="true"][data-phase="cancel"] .psp-stage { cursor: pointer; }
.psp-root[data-phase="exit"] .psp-stage { transition: opacity 0.55s ease-in 0.35s; opacity: 0; pointer-events: none; }
.psp-root[data-phase="done"] .psp-stage { display: none; }
.psp-root svg, .psp-root canvas, .psp-root img { max-width: none; }
.psp-scene { position: relative; perspective: 1600px; }
.psp-tilt { position: relative; transform-style: preserve-3d; will-change: transform; }
.psp-shadow { position: absolute; inset: 4% 1% -3% 1%; border-radius: 6px; background: rgba(12, 8, 24, 0.5); filter: blur(24px); transform: translate(16px, 28px); z-index: -1; opacity: 0.5; }
.psp-sheet { position: relative; width: 100%; overflow: hidden; -webkit-mask-size: 100% 100%; mask-size: 100% 100%; -webkit-mask-repeat: no-repeat; mask-repeat: no-repeat; }
.psp-stamp { display: block; width: 100%; height: auto; }
.psp-layer { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
.psp-ring { transform-origin: 50% 50%; will-change: transform, opacity; }
.psp-grain { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; mix-blend-mode: multiply; will-change: transform; }
.psp-sheen { position: absolute; top: -10%; bottom: -10%; left: 0; width: 30%; pointer-events: none; mix-blend-mode: soft-light; background: linear-gradient(100deg, rgba(255,255,255,0) 15%, rgba(255,255,255,0.55) 50%, rgba(255,255,255,0) 85%); transform: translateX(-120%) skewX(-18deg); animation: psp-sheen 7.5s ease-in-out 1.8s infinite; }
@keyframes psp-sheen { 0% { transform: translateX(-120%) skewX(-18deg); } 55% { transform: translateX(380%) skewX(-18deg); } 100% { transform: translateX(380%) skewX(-18deg); } }
.psp-hands { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
.psp-hand { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; will-change: transform; }
.psp-postmark { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none; opacity: 0; transform-origin: 80% 20%; }

/* landing */
.psp-root[data-phase="enter"] .psp-tilt { animation: psp-land 1s cubic-bezier(0.2, 0.9, 0.25, 1.05) both; }
.psp-root[data-phase="enter"] .psp-shadow { animation: psp-land-shadow 1s cubic-bezier(0.2, 0.9, 0.25, 1.05) both; }
@keyframes psp-land { from { opacity: 0; transform: translate3d(0, -50px, 140px) rotateX(26deg) rotateZ(-5deg); } to { opacity: 1; transform: translate3d(0, 0, 0) rotateX(0) rotateZ(0); } }
@keyframes psp-land-shadow { from { opacity: 0; transform: translate(44px, 90px) scale(1.1); } to { opacity: 0.5; transform: translate(16px, 28px) scale(1); } }

/* the plates print one after the other while the sheet lands */
.psp-plate-band { animation: psp-wipe 0.7s cubic-bezier(0.6, 0, 0.2, 1) 0.4s both; }
.psp-plate-field { animation: psp-wipe 0.7s cubic-bezier(0.6, 0, 0.2, 1) 0.72s both; }
.psp-plate-gold { animation: psp-wipe 0.8s cubic-bezier(0.6, 0, 0.2, 1) 1.02s both; }
@keyframes psp-wipe { from { clip-path: inset(0 100% 0 0); } to { clip-path: inset(0 0 0 0); } }
@keyframes psp-fade { from { opacity: 0; } to { opacity: 1; } }

/* the touch */
.psp-spark, .psp-halo { opacity: 0; transform-box: fill-box; transform-origin: center; }
.psp-root[data-phase="touch"] .psp-spark, .psp-root[data-phase="cancel"] .psp-spark { animation: psp-spark 1.4s cubic-bezier(0.2, 0.8, 0.2, 1) both; }
@keyframes psp-spark { 0% { opacity: 0; transform: scale(0.2) rotate(-30deg); } 25% { opacity: 1; transform: scale(1.25) rotate(10deg); } 60% { opacity: 0.9; transform: scale(0.95) rotate(30deg); } 100% { opacity: 0; transform: scale(1.4) rotate(60deg); } }
.psp-root[data-phase="touch"] .psp-halo, .psp-root[data-phase="cancel"] .psp-halo { animation: psp-halo 1.6s ease-out both; }
@keyframes psp-halo { 0% { opacity: 0; transform: scale(0.3); } 30% { opacity: 0.95; } 100% { opacity: 0; transform: scale(3); } }

/* the cancellation */
.psp-root[data-phase="cancel"] .psp-postmark { animation: psp-slam 0.55s cubic-bezier(0.3, 1.6, 0.4, 1) both; }
@keyframes psp-slam { from { opacity: 0; transform: scale(1.7) rotate(-14deg); } 60% { opacity: 1; } to { opacity: 0.92; transform: scale(1) rotate(-12deg); } }
.psp-root[data-phase="cancel"] .psp-tilt { animation: psp-thump 0.5s cubic-bezier(0.3, 1.4, 0.4, 1) both; }
@keyframes psp-thump { 0% { transform: translate3d(0, 0, 0); } 30% { transform: translate3d(0, 4px, -30px); } 100% { transform: translate3d(0, 0, 0); } }

/* the lift */
.psp-root[data-phase="exit"] .psp-tilt { animation: psp-lift 0.9s cubic-bezier(0.5, 0, 0.8, 0.4) both; }
.psp-root[data-phase="exit"] .psp-shadow { animation: psp-lift-shadow 0.9s cubic-bezier(0.5, 0, 0.8, 0.4) both; }
.psp-root[data-phase="exit"] .psp-postmark { opacity: 0.92; transform: rotate(-12deg); }
@keyframes psp-lift { 0% { transform: translate3d(0, 0, 0) rotateX(0) rotateZ(0); opacity: 1; } 100% { transform: translate3d(6%, -140%, 300px) rotateX(38deg) rotateZ(-9deg); opacity: 0; } }
@keyframes psp-lift-shadow { 0% { opacity: 0.5; transform: translate(16px, 28px) scale(1); } 100% { opacity: 0; transform: translate(60px, 140px) scale(1.2); } }

/* read-out */
.psp-hud { position: absolute; z-index: 2; font-size: 11px; letter-spacing: 0.28em; text-transform: uppercase; line-height: 1; opacity: 0.75; pointer-events: none; font-variant-numeric: tabular-nums; }
.psp-hud-tl { top: 18px; left: 20px; }
.psp-hud-br { right: 20px; bottom: 18px; text-align: right; }
.psp-hud-bc { left: 0; right: 0; bottom: 18px; text-align: center; opacity: 0; transition: opacity 0.4s ease; }
.psp-root[data-phase="load"] .psp-hud-bc { opacity: 0.45; transition-delay: 1.2s; }
.psp-root[data-loop="true"][data-phase="cancel"] .psp-hud-bc { opacity: 0.45; transition-delay: 0.3s; }
.psp-hud-rule { display: inline-block; width: 28px; height: 1px; background: currentColor; vertical-align: middle; margin: 0 10px; opacity: 0.6; }
@media (max-width: 480px) { .psp-hud { font-size: 10px; letter-spacing: 0.2em; } .psp-hud-tl { top: 14px; left: 14px; } .psp-hud-br { right: 14px; bottom: 14px; } .psp-hud-bc { bottom: 14px; } }

@media (prefers-reduced-motion: reduce) {
  .psp-root[data-phase="enter"] .psp-tilt, .psp-root[data-phase="enter"] .psp-shadow { animation: psp-fade 0.6s ease-out both; }
  .psp-plate-band, .psp-plate-field, .psp-plate-gold { animation: psp-fade 0.5s ease-out both; }
  .psp-sheen { animation: none; opacity: 0; }
  .psp-root[data-phase="cancel"] .psp-tilt { animation: none; }
  .psp-root[data-phase="cancel"] .psp-postmark { animation: psp-fade 0.4s ease-out both; opacity: 0.92; transform: rotate(-12deg); }
  .psp-root[data-phase="exit"] .psp-tilt, .psp-root[data-phase="exit"] .psp-shadow { animation: psp-fade 0.6s ease-in both reverse; }
  .psp-root[data-phase="touch"] .psp-halo, .psp-root[data-phase="cancel"] .psp-halo { animation: none; opacity: 0; }
}
`

const MONO_FALLBACK = 'ui-monospace, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace'
const SERIF_FALLBACK = '"Didot", "Bodoni 72", "Bodoni MT", "Playfair Display", "Iowan Old Style", "Palatino Linotype", Georgia, serif'

const PERF_D = pspPerforationPath(W, H, pspPerforation(W, H, 22.5), 7.2)
// The two hands: each image's size in pixels, where its fingertip is in the
// image, where that fingertip lands on the stamp, its scale and tilt there,
// the wrist it swings from as it reaches in (stamp units), and how far it
// swings. The fingertips stop just short of each other, as in the fresco.
const HANDS: { [k: string]: { w: number; h: number; tip: Pt; at: Pt; scale: number; rot: number; pivot: Pt; swing: number } } = {
  l: { w: 662, h: 336, tip: [659, 168], at: [372, 256], scale: 0.64, rot: 6, pivot: [150, 196], swing: 10 },
  r: { w: 698, h: 359, tip: [2, 179], at: [398, 292], scale: 0.62, rot: 12, pivot: [650, 300], swing: -10 },
}
const TOUCH: Pt = [(HANDS.l.at[0] + HANDS.r.at[0]) / 2, (HANDS.l.at[1] + HANDS.r.at[1]) / 2]
const LYRE = pspLyre()
const FLEUR = pspFleur()
const POSTMARK_BARS = pspPostmark(92, 5)

// the frame: side panels, striped rules, the inner field and its diagonals
const SIDE_L = 44
const SIDE_R = W - 44
const PANEL_W = 54
const RULE_T = 34
const RULE_H = 22
const FIELD_T = RULE_T + RULE_H + 6
const FIELD_B = H - FIELD_T
const FIELD_L = SIDE_L + PANEL_W
const FIELD_R = SIDE_R - PANEL_W
const BARS = (() => {
  const xs: number[] = []
  for (let x = SIDE_L + 4; x < SIDE_R - 4; x += 6.4) xs.push(Math.round(x * 10) / 10)
  return xs
})()
const DIAGONALS: { from: Pt; len: number; text: "corner" | "year"; angle: number; at: Pt }[] = [
  [FIELD_L, FIELD_T, "corner"],
  [FIELD_R, FIELD_T, "year"],
  [FIELD_L, FIELD_B, "year"],
  [FIELD_R, FIELD_B, "corner"],
].map(([x, y, text]) => {
  const from: Pt = [x as number, y as number]
  const dx = CX - from[0]
  const dy = CY - from[1]
  const len = Math.hypot(dx, dy)
  const ux = dx / len
  const uy = dy / len
  let angle = (Math.atan2(dy, dx) * 180) / Math.PI
  if (angle > 90) angle -= 180
  if (angle < -90) angle += 180
  return { from, len, text: text as "corner" | "year", angle, at: [from[0] + ux * 70, from[1] + uy * 70] as Pt }
})
const LYRES = [
  { x: 150, y: 168, sx: 1, sy: 1 },
  { x: 150, y: 372, sx: 1, sy: -1 },
  { x: 650, y: 168, sx: -1, sy: 1 },
  { x: 650, y: 372, sx: -1, sy: -1 },
]
const FLEURS = [
  { x: 214, y: 82, r: 0 },
  { x: 586, y: 82, r: 0 },
  { x: 214, y: 458, r: 180 },
  { x: 586, y: 458, r: 180 },
]

// the flower
const STEM = "M" + (HEAD_X + 6) + " " + (HEAD_Y + 30) + "C" + (HEAD_X + 14) + " 240 418 282 414 318S364 382 322 404"
const BRANCH = "M406 238C424 222 446 206 470 196"
const LEAVES = [
  { x: 470, y: 196, rot: 66, len: 52, wid: 26, seed: 3 },
  { x: 446, y: 210, rot: 18, len: 40, wid: 21, seed: 5 },
  { x: 370, y: 162, rot: -56, len: 48, wid: 25, seed: 8 },
  { x: 362, y: 360, rot: -48, len: 50, wid: 24, seed: 11 },
  { x: 340, y: 392, rot: -98, len: 46, wid: 22, seed: 13 },
  { x: 380, y: 348, rot: 40, len: 38, wid: 19, seed: 17 },
].map((l) => ({ ...l, path: pspLeaf(l.len, l.wid, 13, l.seed), lines: pspLeafLines(l.len, l.wid) }))
const STAMENS = (() => {
  const rnd = pspRng(17)
  const out: { a: number; r: number; w: number }[] = []
  for (let i = 0; i < 44; i++) out.push({ a: (i / 44) * Math.PI * 2 + rnd() * 0.25, r: 10 + rnd() * 12, w: 1.3 + rnd() * 1.3 })
  return out
})()

export default function PeaceStampPreloader({
  children,
  loop = false,
  progress,
  durationMs = 5600,
  word = "МИР",
  leftText = "PAR AVION",
  rightText = "POSTE",
  cornerText = "PAX",
  year = "2026",
  value = 0.68,
  currency = "€",
  decimal = ",",
  postmark = "DELIVERED",
  preset = "magenta",
  palette,
  tilt = 6,
  hud = true,
  label = "Loading",
  serifFamily = SERIF_FALLBACK,
  monoFamily = MONO_FALLBACK,
  onComplete,
  height = "100svh",
  className = "",
}: PeaceStampPreloaderProps) {
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, "")
  const id = (s: string) => "psp-" + uid + "-" + s
  const url = (s: string) => "url(#" + id(s) + ")"

  const C = React.useMemo(() => ({ ...(PRESETS[preset] || PRESETS.magenta), ...(palette || {}) }), [preset, palette])

  const [phase, setPhase] = React.useState("enter" as Phase)
  const [cycle, setCycle] = React.useState(0)
  const [pct, setPct] = React.useState(0)
  const [stampW, setStampW] = React.useState(0)

  const rootRef = React.useRef(null as HTMLDivElement | null)
  const stageRef = React.useRef(null as HTMLDivElement | null)
  const destRef = React.useRef(null as HTMLDivElement | null)
  const phaseRef = React.useRef("enter" as Phase)
  const phaseAtRef = React.useRef(0)
  const startRef = React.useRef(0)
  const shownRef = React.useRef(0)
  const rushRef = React.useRef(false)
  const progressRef = React.useRef(progress)
  progressRef.current = progress
  const loopRef = React.useRef(loop)
  loopRef.current = loop
  const onCompleteRef = React.useRef(onComplete)
  onCompleteRef.current = onComplete
  const durationRef = React.useRef(durationMs)
  durationRef.current = durationMs
  const tiltRef = React.useRef(tilt)
  tiltRef.current = tilt
  const moneyRef = React.useRef({ value, currency, decimal })
  moneyRef.current = { value, currency, decimal }
  const pointerRef = React.useRef({ x: 0, y: 0, on: false })
  const springRef = React.useRef({ rx: 0, ry: 0, vx: 0, vy: 0 })
  const reducedRef = React.useRef(false)
  const pctRef = React.useRef(0)

  const go = React.useCallback((next: Phase) => {
    phaseRef.current = next
    phaseAtRef.current = performance.now()
    setPhase(next)
  }, [])

  // ---- size: the stamp fits the box, never taller than about four fifths of it
  React.useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const fit = () => {
      const r = root.getBoundingClientRect()
      if (r.width <= 0 || r.height <= 0) return
      const w = Math.min(r.width * 0.9, 820, (r.height * 0.78 * W) / H)
      setStampW(Math.max(220, Math.round(w)))
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(root)
    return () => ro.disconnect()
  }, [])

  // ---- reduced motion --------------------------------------------------------
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const set = () => {
      reducedRef.current = mq.matches
    }
    set()
    mq.addEventListener("change", set)
    return () => mq.removeEventListener("change", set)
  }, [])

  // ---- the guarded page is inert under the gate ------------------------------
  React.useEffect(() => {
    destRef.current?.toggleAttribute("inert", phase !== "done")
  }, [phase])

  // ---- the frame loop: load, print, grow, reach, tilt ------------------------
  React.useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const all = (sel: string) => Array.from(stage.querySelectorAll(sel)) as SVGElement[]
    const one = (sel: string) => stage.querySelector(sel) as SVGElement | null
    const el = {
      tilt: stage.querySelector(".psp-tilt") as HTMLElement | null,
      shadow: stage.querySelector(".psp-shadow") as HTMLElement | null,
      handL: stage.querySelector(".psp-hand-l") as HTMLElement | null,
      handR: stage.querySelector(".psp-hand-r") as HTMLElement | null,
      barClip: all(".psp-bar-clip"),
      diag: all(".psp-diag"),
      diagText: all(".psp-diag-text"),
      ring: stage.querySelector(".psp-ring") as HTMLElement | null,
      sides: all(".psp-side"),
      lyres: all(".psp-lyre"),
      fleurs: all(".psp-fleur"),
      stem: all(".psp-stem"),
      leaves: all(".psp-leaf"),
      head: one(".psp-head"),
      petals: all(".psp-petal"),
      petalLines: all(".psp-petal-lines"),
      heart: one(".psp-heart"),
      denom: one(".psp-denom"),
      counter: stage.querySelector(".psp-counter") as HTMLElement | null,
      light: one(".psp-light"),
    }
    const stemLens = el.stem.map((s) => {
      const len = (s as SVGPathElement).getTotalLength ? (s as SVGPathElement).getTotalLength() : 300
      s.style.strokeDasharray = String(len)
      s.style.strokeDashoffset = String(len)
      return len
    })
    const diagLen = el.diag.map((d) => +(d.getAttribute("data-len") || 0))

    shownRef.current = 0
    rushRef.current = false
    pctRef.current = -1
    startRef.current = performance.now()
    phaseAtRef.current = performance.now()
    let last = performance.now()
    let raf = 0
    let lastPetalK = -1

    // Every write goes through here and is skipped when nothing changed, so a
    // piece that has finished animating costs nothing on later frames.
    const cache = new WeakMap()
    const put = (e: Element | null, k: string, v: string) => {
      if (!e) return
      let o = cache.get(e)
      if (!o) {
        o = {}
        cache.set(e, o)
      }
      if (o[k] === v) return
      o[k] = v
      if (k.charAt(0) === "$") (e as HTMLElement).style.setProperty(k.slice(1), v)
      else e.setAttribute(k, v)
    }

    const paint = (p: number) => {
      const reduced = reducedRef.current
      // the striped rules run out from the corners
      const rule = pspEaseOut(pspSmoothstep(0.0, 0.3, p))
      for (const r of el.barClip) put(r, "width", f1((SIDE_R - SIDE_L) * rule))
      // the diagonal bands draw in from the corners
      el.diag.forEach((d, i) => {
        const u = pspEaseOut(pspSmoothstep(0.06 + (i % 4) * 0.02, 0.34 + (i % 4) * 0.02, p))
        put(d, "$stroke-dashoffset", f1(diagLen[i] * (1 - u)))
      })
      for (const t of el.diagText) put(t, "$opacity", f1(pspSmoothstep(0.3, 0.42, p)))
      // the ring turns into place
      const ring = pspEaseBack(pspSmoothstep(0.1, 0.42, p))
      put(el.ring, "$opacity", f1(pspSmoothstep(0.1, 0.22, p)))
      put(el.ring, "$transform", reduced ? "none" : "rotate(" + f1(-80 * (1 - ring)) + "deg) scale(" + (Math.round(pspLerp(0.86, 1, ring) * 1000) / 1000) + ")")
      el.sides.forEach((sd, i) => {
        const u = pspEaseOut(pspSmoothstep(0.14 + i * 0.04, 0.36 + i * 0.04, p))
        put(sd, "$opacity", f1(u))
        put(sd, "$transform", reduced ? "none" : "translateY(" + f1((i % 2 ? -1 : 1) * 30 * (1 - u)) + "px)")
      })
      // the scrollwork unfurls
      el.lyres.forEach((g, i) => {
        const L = LYRES[i]
        const u = pspEaseBack(pspSmoothstep(0.2 + i * 0.05, 0.52 + i * 0.05, p))
        const sc = reduced ? (u > 0.01 ? 1 : 0.001) : Math.max(0.001, u)
        put(g, "transform", "translate(" + L.x + " " + L.y + ") rotate(" + f1(reduced ? 0 : -50 * (1 - u) * L.sx * L.sy) + ") scale(" + f1(L.sx * sc) + " " + f1(L.sy * sc) + ")")
        put(g, "$opacity", f1(pspSmoothstep(0.2 + i * 0.05, 0.3 + i * 0.05, p)))
      })
      el.fleurs.forEach((g, i) => {
        const F = FLEURS[i]
        const u = pspEaseBack(pspSmoothstep(0.3 + i * 0.03, 0.5 + i * 0.03, p))
        put(g, "transform", "translate(" + F.x + " " + F.y + ") rotate(" + F.r + ") scale(" + f1(Math.max(0.001, u)) + ")")
      })
      // the stem draws, the leaves unfurl, the bud opens
      const st = pspSmoothstep(0.24, 0.52, p)
      el.stem.forEach((sm, i) => {
        const k = i === 2 ? pspSmoothstep(0.42, 0.6, p) : st
        put(sm, "$stroke-dashoffset", f1(stemLens[i] * (1 - k)))
      })
      el.leaves.forEach((leaf, i) => {
        const u = pspEaseBack(pspSmoothstep(0.4 + i * 0.045, 0.62 + i * 0.045, p))
        const L = LEAVES[i]
        put(leaf, "transform", "translate(" + L.x + " " + L.y + ") rotate(" + f1(L.rot - (1 - u) * 40) + ") scale(" + f1(Math.max(0.001, u * 1.4)) + ")")
      })
      const bud = pspEaseBack(pspSmoothstep(0.34, 0.48, p))
      const k = pspSmoothstep(0.5, 0.96, p)
      if (Math.abs(k - lastPetalK) > 0.004 || (bud > 0 && bud < 1)) {
        lastPetalK = k
        pspFlower(k).forEach((pt, i) => {
          const tf = "rotate(" + f1(pt.angle) + ") scale(" + f1(Math.max(0.001, pt.scale * pspLerp(0.08, 1, bud))) + ")"
          put(el.petals[i], "d", pt.d)
          put(el.petals[i], "transform", tf)
          const g = el.petalLines[i]
          if (g) {
            put(g, "transform", tf)
            put(g, "$opacity", f1(0.25 + 0.6 * pspSmoothstep(0.3, 0.9, k)))
            Array.from(g.children).forEach((c, j) => put(c, "d", pt.lines[j] || "M0 0"))
          }
        })
      }
      put(el.heart, "transform", "scale(" + f1(Math.max(0.001, pspEaseBack(pspSmoothstep(0.68, 1, p)))) + ")")
      // the hands slide in over the edges, then swing up from the wrist into their reach
      const hl = pspEaseOut(pspSmoothstep(0.28, 0.8, p))
      const hr = pspEaseOut(pspSmoothstep(0.4, 0.9, p))
      const ll = pspEaseBack(pspSmoothstep(0.55, 0.95, p))
      const lr = pspEaseBack(pspSmoothstep(0.65, 1, p))
      const sc = stampScale()
      put(el.handL, "$opacity", reduced ? f1(pspSmoothstep(0.28, 0.5, p)) : "1")
      put(el.handL, "$transform", reduced ? "none" : "translate(" + f1(-SLIDE * (1 - hl) * sc) + "px, 0px) rotate(" + f1(HANDS.l.swing * (1 - ll)) + "deg)")
      put(el.handR, "$opacity", reduced ? f1(pspSmoothstep(0.4, 0.62, p)) : "1")
      put(el.handR, "$transform", reduced ? "none" : "translate(" + f1(SLIDE * (1 - hr) * sc) + "px, 0px) rotate(" + f1(HANDS.r.swing * (1 - lr)) + "deg)")
      put(el.light, "$opacity", f1(0.35 + 0.65 * pspSmoothstep(0.6, 1, p)))
      // the ring counts up to the face value
      // the counter and the face value read from the same rounded percentage
      const pc = Math.round(p * 100)
      const m = moneyRef.current
      if (el.denom) {
        const txt = pspMoney(m.value, m.currency, m.decimal, pc / 100)
        if (el.denom.textContent !== txt) el.denom.textContent = txt
      }
      if (pc !== pctRef.current) {
        pctRef.current = pc
        if (el.counter) el.counter.textContent = String(pc).padStart(3, "0")
        setPct(pc)
      }
    }
    // stamp units to CSS pixels, for the hands' slide
    let scaleAt = -1
    let scaleVal = 1
    const stampScale = () => {
      const t = performance.now()
      if (t - scaleAt > 500) {
        scaleAt = t
        const w = el.tilt ? el.tilt.offsetWidth : 0
        scaleVal = w ? w / W : 1
      }
      return scaleVal
    }

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const ph = phaseRef.current
      const since = now - phaseAtRef.current
      const reduced = reducedRef.current

      let target: number
      if (progressRef.current !== undefined && progressRef.current !== null) target = pspClamp(progressRef.current / 100, 0, 1)
      else target = pspSimulated((now - startRef.current - 900) / Math.max(400, durationRef.current))
      if (rushRef.current) target = 1
      const shown = shownRef.current
      let next = shown + (target - shown) * Math.min(1, (rushRef.current ? 6 : 3) * dt)
      if (target - next < 0.0015) next = target
      if (next < shown) next = shown
      shownRef.current = next
      if (ph === "enter" || ph === "load") paint(next)

      // idle life: the flower sways, the hands breathe
      const idle = reduced ? 0 : 1
      put(el.head, "transform", "translate(" + HEAD_X + " " + HEAD_Y + ") rotate(" + f1(idle * 2.2 * Math.sin(now / 1300)) + ") scale(1.34)")

      // tilt toward the pointer, on a spring
      const sp = springRef.current
      const ptr = pointerRef.current
      const maxTilt = reduced ? 0 : tiltRef.current
      const trx = ptr.on ? -ptr.y * maxTilt : 0
      const trY = ptr.on ? ptr.x * maxTilt : 0
      sp.vx += (60 * (trx - sp.rx) - 9 * sp.vx) * dt
      sp.vy += (60 * (trY - sp.ry) - 9 * sp.vy) * dt
      sp.rx += sp.vx * dt
      sp.ry += sp.vy * dt
      const bobY = idle * 3 * Math.sin(now / 1400)
      const bobR = idle * 0.6 * Math.sin(now / 2100)
      if (ph !== "enter" && ph !== "cancel" && ph !== "exit" && el.tilt) {
        el.tilt.style.transform = "translate3d(0," + f1(bobY) + "px,0) rotateX(" + f1(sp.rx + bobR) + "deg) rotateY(" + f1(sp.ry) + "deg)"
        if (el.shadow) el.shadow.style.transform = "translate(" + f1(16 - sp.ry * 1.6) + "px, " + f1(28 + sp.rx * 1.6 - bobY) + "px)"
      }
      if (ph !== "enter" && ph !== "load") {
        const s = stampScale()
        const drift = idle * 3 * Math.sin(now / 900)
        const breathe = idle * 0.8 * Math.sin(now / 1500)
        if (el.handL) el.handL.style.transform = "translate(" + f1(drift * s + sp.ry * 1.2) + "px, " + f1(-drift * 0.5 * s - sp.rx * 1.2) + "px) rotate(" + f1(breathe) + "deg)"
        if (el.handR) el.handR.style.transform = "translate(" + f1(-drift * s + sp.ry * 1.2) + "px, " + f1(drift * 0.6 * s - sp.rx * 1.2) + "px) rotate(" + f1(-breathe) + "deg)"
      }

      if (ph === "enter" && since > 1000) go("load")
      else if (ph === "load" && next >= 1 && target >= 1) go("touch")
      else if (ph === "touch" && since > 1100) go("cancel")
      else if (ph === "cancel" && since > (loopRef.current ? 2600 : 1300)) go("exit")
      else if (ph === "exit" && since > 1000) {
        if (loopRef.current) setCycle((c) => c + 1)
        else {
          go("done")
          onCompleteRef.current?.()
        }
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [cycle, go])

  // a new cycle starts over
  React.useEffect(() => {
    if (cycle === 0) return
    phaseRef.current = "enter"
    phaseAtRef.current = performance.now()
    setPhase("enter")
  }, [cycle])

  // ---- input -------------------------------------------------------------------
  const activate = React.useCallback(() => {
    const ph = phaseRef.current
    if (ph === "enter" || ph === "load") rushRef.current = true
    else if (ph === "cancel" && loopRef.current) go("exit")
  }, [go])

  const onPointerMove = (e: React.PointerEvent) => {
    const r = stageRef.current?.getBoundingClientRect()
    if (!r) return
    pointerRef.current = { x: ((e.clientX - r.left) / r.width) * 2 - 1, y: ((e.clientY - r.top) / r.height) * 2 - 1, on: true }
  }
  const onPointerLeave = () => {
    pointerRef.current = { x: 0, y: 0, on: false }
  }
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      activate()
    }
  }

  // the perforated edge, as a CSS mask on the sheet: the grain, the sheen and
  // the drawing all clip against it without a filter in the animated tree
  const perfMask = React.useMemo(() => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + " " + H + '"><path fill-rule="evenodd" d="' + PERF_D + '"/></svg>'
    return 'url("data:image/svg+xml;utf8,' + encodeURIComponent(svg) + '")'
  }, [])

  // Lettering: cream, edged in teal, like the engraved type on the stamp.
  const letter = { fill: C.cream, stroke: C.band, strokeWidth: 2.6, paintOrder: "stroke" as const, strokeLinejoin: "round" as const }

  // The palette's skin tones, darkest to lightest, as a gradient map: the
  // greyscale fresco's shadows go navy and its lights go pale.
  const hex = (c: string) => {
    const m = c.replace("#", "")
    const v = m.length === 3 ? m.split("").map((x) => x + x).join("") : m
    return [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16) / 255)
  }
  const skin = hex(C.skin)
  const light = hex(C.skinLight)
  const ramp = [hex(C.skinDark).map((v) => v * 0.6), hex(C.skinDark), skin, skin.map((v, i) => v + (light[i] - v) * 0.55), light]
  const table = (ch: number) => ramp.map((c) => (Math.round(c[ch] * 1000) / 1000).toString()).join(" ")

  const renderHand = (h: "l" | "r") => {
    const H0 = HANDS[h]
    const place = "translate(" + H0.at[0] + " " + H0.at[1] + ") rotate(" + H0.rot + ") scale(" + H0.scale + ") translate(" + -H0.tip[0] + " " + -H0.tip[1] + ")"
    return (
      <svg
        className={"psp-hand psp-hand-" + h}
        viewBox={"0 0 " + W + " " + H}
        preserveAspectRatio="none"
        aria-hidden="true"
        style={{
          transform: "translate(" + (h === "l" ? -SLIDE : SLIDE) + "px, 0px) rotate(" + H0.swing + "deg)",
          transformOrigin: f1((H0.pivot[0] / W) * 100) + "% " + f1((H0.pivot[1] / H) * 100) + "%",
        }}
      >
        <defs>
          <filter id={id("tint-" + h)} x="-10%" y="-10%" width="125%" height="135%" colorInterpolationFilters="sRGB">
            <feComponentTransfer result="t">
              <feFuncR type="table" tableValues={table(0)} />
              <feFuncG type="table" tableValues={table(1)} />
              <feFuncB type="table" tableValues={table(2)} />
            </feComponentTransfer>
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={h === "l" ? 4 : 9} result="n0" />
            <feColorMatrix in="n0" type="matrix" values="0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0 0 0 0 1" result="n" />
            <feComposite in="n" in2="t" operator="arithmetic" k2="0.16" k3="1" k4="-0.08" result="g" />
            <feComposite in="g" in2="SourceAlpha" operator="in" result="body" />
            <feGaussianBlur in="SourceAlpha" stdDeviation="9" result="sb" />
            <feOffset in="sb" dx="14" dy="24" result="so" />
            <feComponentTransfer in="so" result="shadow">
              <feFuncA type="linear" slope="0.42" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode in="shadow" />
              <feMergeNode in="body" />
            </feMerge>
          </filter>
        </defs>
        <g transform={place} filter={url("tint-" + h)}>
          <image href={h === "l" ? PSP_HAND_L : PSP_HAND_R} x="0" y="0" width={H0.w} height={H0.h} preserveAspectRatio="none" />
        </g>
      </svg>
    )
  }

  const stageStyle: React.CSSProperties = { fontFamily: monoFamily }
  if (C.stage) stageStyle.background = C.stage
  const live = phase !== "done"
  const statusText =
    phase === "enter" || phase === "load" ? label : phase === "touch" ? "Received" : phase === "cancel" ? "Cancelled" : "Opening"
  const quatrefoil = (x: number, y: number, s: number, color: string, key: string | number) => (
    <g key={key} transform={"translate(" + f1(x) + " " + f1(y) + ") scale(" + s + ")"} fill={color}>
      {[0, 90, 180, 270].map((a) => (
        <path key={a} d="M0 -1.5C2.6 -3 3 -7 0 -9.5C-3 -7 -2.6 -3 0 -1.5Z" transform={"rotate(" + a + ")"} />
      ))}
      <circle r="1.6" />
    </g>
  )

  return (
    <div
      ref={rootRef}
      data-phase={phase}
      data-loop={loop ? "true" : "false"}
      className={"psp-root bg-background text-foreground " + className}
      style={{ height }}
    >
      <style dangerouslySetInnerHTML={{ __html: PSP_CSS }} />

      {!loop && (
        <div ref={destRef} className="psp-dest">
          {children}
        </div>
      )}

      {live && (
        <div
          key={cycle}
          ref={stageRef}
          className="psp-stage bg-background"
          style={stageStyle}
          role="progressbar"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          aria-valuetext={pct + "% · " + statusText}
          tabIndex={0}
          onClick={activate}
          onKeyDown={onKeyDown}
          onPointerMove={onPointerMove}
          onPointerLeave={onPointerLeave}
        >
          <div className="psp-scene" style={{ width: stampW || "90%" }}>
            <div className="psp-tilt">
              <div className="psp-shadow" />
              <div className="psp-sheet" style={{ aspectRatio: W + " / " + H, WebkitMaskImage: perfMask, maskImage: perfMask }}>
                <svg className="psp-stamp" viewBox={"0 0 " + W + " " + H} width={W} height={H} aria-hidden="true" style={{ fontFamily: serifFamily }}>
                  <defs>
                    <clipPath id={id("disc")}>
                      <circle cx={CX} cy={CY} r={R_DISC} />
                    </clipPath>
                    <clipPath id={id("field")}>
                      <rect x={FIELD_L} y={FIELD_T} width={FIELD_R - FIELD_L} height={FIELD_B - FIELD_T} />
                    </clipPath>
                    <clipPath id={id("bars-t")}>
                      <rect className="psp-bar-clip" x={SIDE_L} y={RULE_T} width="0" height={RULE_H} />
                    </clipPath>
                    <clipPath id={id("bars-b")}>
                      <rect className="psp-bar-clip" x={SIDE_L} y={H - RULE_T - RULE_H} width="0" height={RULE_H} />
                    </clipPath>
                    <radialGradient id={id("light")} cx={TOUCH[0]} cy={TOUCH[1] - 30} r="190" gradientUnits="userSpaceOnUse">
                      <stop offset="0" stopColor={C.disc} />
                      <stop offset="0.38" stopColor={C.disc} stopOpacity="0.9" />
                      <stop offset="1" stopColor={C.mint} stopOpacity="0" />
                    </radialGradient>
                    <radialGradient id={id("vignette")} cx={CX} cy={CY} r={R_DISC} gradientUnits="userSpaceOnUse">
                      <stop offset="0.62" stopColor={C.band} stopOpacity="0" />
                      <stop offset="1" stopColor={C.band} stopOpacity="0.55" />
                    </radialGradient>
                    <linearGradient id={id("petal")} x1="0" y1="0" x2="0" y2="-60" gradientUnits="userSpaceOnUse">
                      <stop offset="0" stopColor={C.petalDark} />
                      <stop offset="0.22" stopColor={C.petalDark} stopOpacity="0.85" />
                      <stop offset="0.46" stopColor={C.petal} />
                      <stop offset="0.8" stopColor={C.cream} />
                      <stop offset="1" stopColor={C.petal} />
                    </linearGradient>
                    <linearGradient id={id("leaf")} x1="-14" y1="0" x2="14" y2="0" gradientUnits="userSpaceOnUse">
                      <stop offset="0" stopColor={C.petal} />
                      <stop offset="0.3" stopColor={C.leaf} />
                      <stop offset="0.5" stopColor={C.leaf} />
                      <stop offset="0.52" stopColor={C.petalDark} />
                      <stop offset="1" stopColor={C.petalDark} />
                    </linearGradient>
                    <linearGradient id={id("goldline")} x1="0" y1="0" x2={W} y2={H} gradientUnits="userSpaceOnUse">
                      <stop offset="0" stopColor={C.gold} />
                      <stop offset="0.45" stopColor={C.cream} />
                      <stop offset="0.55" stopColor={C.gold} />
                      <stop offset="1" stopColor={C.gold} />
                    </linearGradient>
                    <path id={id("arc-top")} d={pspArc(CX, CY, 182, 200, 340)} />
                    <path id={id("arc-bottom")} d={pspArc(CX, CY, 217, 160, 20)} />
                    <path id={id("arc-left")} d={pspArc(CX, CY, 183, 140, 220)} />
                    <path id={id("arc-right")} d={pspArc(CX, CY, 183, -40, 40)} />
                  </defs>

                  {/* paper, before any plate */}
                  <rect x="0" y="0" width={W} height={H} fill={C.cream} />

                  {/* the magenta plate */}
                  <g className="psp-plate-field">
                    <rect x="22" y="22" width={W - 44} height={H - 44} fill={C.field} />
                  </g>

                  {/* the teal plate: the perforated edge */}
                  <g className="psp-plate-band">
                    <path d={"M0 0H" + W + "V" + H + "H0Z M22 22V" + (H - 22) + "H" + (W - 22) + "V22Z"} fill={C.band} fillRule="evenodd" />
                  </g>

                  {/* gold hairlines round the frame */}
                  <g className="psp-plate-gold" fill="none">
                    <rect x="24.5" y="24.5" width={W - 49} height={H - 49} stroke={url("goldline")} strokeWidth="2.2" />
                    <rect x="31" y="31" width={W - 62} height={H - 62} stroke={C.cream} strokeWidth="1" opacity="0.8" />
                  </g>

                  {/* striped rules top and bottom */}
                  {[0, 1].map((b) => {
                    const y = b ? H - RULE_T - RULE_H : RULE_T
                    return (
                      <g key={b}>
                        <rect x={SIDE_L} y={y} width={SIDE_R - SIDE_L} height={RULE_H} fill="none" stroke={C.cream} strokeWidth="1.4" />
                        <g clipPath={url(b ? "bars-b" : "bars-t")} fill={C.band}>
                          {BARS.map((x) => (
                            <rect key={x} x={x} y={y + 3.5} width="3.1" height={RULE_H - 7} />
                          ))}
                        </g>
                      </g>
                    )
                  })}

                  {/* the side panels */}
                  {[SIDE_L, FIELD_R].map((x, i) => (
                    <g key={i}>
                      <rect x={x} y={FIELD_T} width={PANEL_W} height={FIELD_B - FIELD_T} fill={C.field} stroke={C.band} strokeWidth="3" />
                      <rect x={x + 5} y={FIELD_T + 5} width={PANEL_W - 10} height={FIELD_B - FIELD_T - 10} fill="none" stroke={C.cream} strokeWidth="1" opacity="0.85" />
                    </g>
                  ))}
                  <g fontWeight="700" letterSpacing="5" fontSize="46" {...letter}>
                    <g className="psp-side" style={{ opacity: 0 }}>
                      <text textAnchor="middle" dominantBaseline="central" transform={"translate(" + (SIDE_L + PANEL_W / 2) + " " + CY + ") rotate(-90)"}>
                        {leftText}
                      </text>
                    </g>
                    <g className="psp-side" style={{ opacity: 0 }}>
                      <text textAnchor="middle" dominantBaseline="central" transform={"translate(" + (FIELD_R + PANEL_W / 2) + " " + CY + ") rotate(90)"}>
                        {rightText}
                      </text>
                    </g>
                  </g>
                  {[[SIDE_L, RULE_T], [FIELD_R, RULE_T], [SIDE_L, H - RULE_T - RULE_H], [FIELD_R, H - RULE_T - RULE_H]].map(([x, y], i) => (
                    <g key={i}>
                      <rect x={x} y={y} width={PANEL_W} height={RULE_H} fill={C.band} />
                      {quatrefoil(x + PANEL_W / 2, y + RULE_H / 2, 0.85, C.cream, "q")}
                    </g>
                  ))}

                  {/* the inner field, its diagonal bands, its spandrels */}
                  <rect x={FIELD_L} y={FIELD_T} width={FIELD_R - FIELD_L} height={FIELD_B - FIELD_T} fill="none" stroke={C.cream} strokeWidth="1.6" />
                  <g clipPath={url("field")}>
                    <g className="psp-plate-field">
                      <path d={"M" + FIELD_L + " " + FIELD_T + "L" + CX + " " + CY + "L" + FIELD_L + " " + FIELD_B + "Z"} fill={C.band} />
                      <path d={"M" + FIELD_R + " " + FIELD_T + "L" + CX + " " + CY + "L" + FIELD_R + " " + FIELD_B + "Z"} fill={C.band} />
                    </g>
                    {DIAGONALS.map((dg, i) => {
                      const d = "M" + dg.from[0] + " " + dg.from[1] + "L" + CX + " " + CY
                      return (
                        <g key={i}>
                          <path className="psp-diag" data-len={f1(dg.len)} d={d} stroke={C.cream} strokeWidth="48" strokeDasharray={f1(dg.len)} strokeDashoffset={f1(dg.len)} />
                          <path className="psp-diag" data-len={f1(dg.len)} d={d} stroke={C.band} strokeWidth="44" strokeDasharray={f1(dg.len)} strokeDashoffset={f1(dg.len)} />
                          <path className="psp-diag" data-len={f1(dg.len)} d={d} stroke={C.cream} strokeWidth="36" strokeDasharray={f1(dg.len)} strokeDashoffset={f1(dg.len)} opacity="0.9" />
                          <path className="psp-diag" data-len={f1(dg.len)} d={d} stroke={C.band} strokeWidth="34" strokeDasharray={f1(dg.len)} strokeDashoffset={f1(dg.len)} />
                        </g>
                      )
                    })}
                  </g>
                  <g fontSize="22" fontWeight="700" letterSpacing="3" fill={C.field} stroke={C.cream} strokeWidth="0.8" paintOrder="stroke">
                    {DIAGONALS.map((dg, i) => (
                      <text
                        key={i}
                        className="psp-diag-text"
                        textAnchor="middle"
                        dominantBaseline="central"
                        transform={"translate(" + f1(dg.at[0]) + " " + f1(dg.at[1]) + ") rotate(" + f1(dg.angle) + ")"}
                        style={{ opacity: 0 }}
                      >
                        {dg.text === "corner" ? cornerText : year}
                      </text>
                    ))}
                  </g>
                  {LYRES.map((L, i) => (
                    <g key={i} className="psp-lyre" transform={"translate(" + L.x + " " + L.y + ") scale(0.001)"} style={{ opacity: 0 }}>
                      {LYRE.scrolls.map((d, j) => (
                        <path key={j} d={d} fill={C.field} stroke={C.cream} strokeWidth="1" strokeOpacity="0.85" />
                      ))}
                      {LYRE.leaves.map((d, j) => (
                        <path key={j} d={d} fill={C.field} stroke={C.cream} strokeWidth="1" strokeOpacity="0.85" />
                      ))}
                      {LYRE.eyes.map((p, j) => (
                        <circle key={j} cx={f1(p[0])} cy={f1(p[1])} r="2.8" fill={C.field} stroke={C.cream} strokeWidth="1" strokeOpacity="0.85" />
                      ))}
                    </g>
                  ))}
                  {FLEURS.map((F, i) => (
                    <g key={i} className="psp-fleur" transform={"translate(" + F.x + " " + F.y + ") scale(0.001)"} fill={C.band}>
                      {FLEUR.wings.map((d, j) => (
                        <path key={j} d={d} />
                      ))}
                      <path d={FLEUR.drop} />
                      <circle cx="0" cy="-4" r="3" fill={C.cream} />
                    </g>
                  ))}

                </svg>

                {/* the ring: its own layer, so it turns on the compositor */}
                <svg className="psp-layer psp-ring" viewBox={"0 0 " + W + " " + H} aria-hidden="true" style={{ fontFamily: serifFamily, opacity: 0 }}>
                  <g>
                    <circle cx={CX} cy={CY} r={R_OUT + 3} fill={C.cream} />
                    <circle cx={CX} cy={CY} r={R_OUT} fill={C.band} />
                    <circle cx={CX} cy={CY} r={R_OUT - 5} fill={C.field} />
                    <circle cx={CX} cy={CY} r={R_OUT - 9} fill="none" stroke={C.cream} strokeWidth="1.2" />
                    <circle cx={CX} cy={CY} r={R_IN + 5} fill="none" stroke={C.cream} strokeWidth="1.2" />
                    <circle cx={CX} cy={CY} r={R_IN} fill={C.cream} />
                    <circle cx={CX} cy={CY} r={R_IN - 3} fill={C.band} />
                    <g fontWeight="700" {...letter} strokeWidth="2.2">
                      <text fontSize="52" letterSpacing="5">
                        <textPath href={"#" + id("arc-top")} startOffset="50%" textAnchor="middle">
                          {word.split("").join("·")}
                        </textPath>
                      </text>
                      <text fontSize="46" letterSpacing="4">
                        <textPath href={"#" + id("arc-left")} startOffset="50%" textAnchor="middle">
                          {word}
                        </textPath>
                      </text>
                      <text fontSize="46" letterSpacing="4">
                        <textPath href={"#" + id("arc-right")} startOffset="50%" textAnchor="middle">
                          {word}
                        </textPath>
                      </text>
                      <text fontSize="48" letterSpacing="3">
                        <textPath href={"#" + id("arc-bottom")} startOffset="50%" textAnchor="middle">
                          <tspan className="psp-denom">{pspMoney(value, currency, decimal, 0)}</tspan>
                        </textPath>
                      </text>
                    </g>
                    {[45, 135, 225, 315].map((a) =>
                      quatrefoil(CX + 199 * Math.cos((a * Math.PI) / 180), CY + 199 * Math.sin((a * Math.PI) / 180), 1.25, C.cream, a),
                    )}
                    {[28, 62, 118, 152, 208, 236, 304, 332].map((a) => (
                      <circle key={a} cx={f1(CX + 199 * Math.cos((a * Math.PI) / 180))} cy={f1(CY + 199 * Math.sin((a * Math.PI) / 180))} r="2.6" fill={C.cream} />
                    ))}
                    {/* the disc and its light */}
                    <circle cx={CX} cy={CY} r={R_DISC} fill={C.mint} />
                    <g clipPath={url("disc")}>
                      <circle className="psp-light" cx={CX} cy={CY} r={R_DISC} fill={url("light")} style={{ opacity: 0.35 }} />
                      <circle cx={CX} cy={CY} r={R_DISC} fill={url("vignette")} />
                    </g>
                  </g>

                </svg>

                {/* the flower: its own layer, so its morph repaints only itself */}
                <svg className="psp-layer psp-flower" viewBox={"0 0 " + W + " " + H} aria-hidden="true">
                  <g>
                    <path className="psp-stem" d={STEM} fill="none" stroke={C.petalDark} strokeWidth="6.2" strokeLinecap="round" />
                    <path className="psp-stem" d={STEM} fill="none" stroke={C.petal} strokeWidth="3.2" strokeLinecap="round" />
                    <path className="psp-stem" d={BRANCH} fill="none" stroke={C.petalDark} strokeWidth="3.6" strokeLinecap="round" />
                    {LEAVES.map((L, i) => (
                      <g key={i} className="psp-leaf" transform={"translate(" + L.x + " " + L.y + ") rotate(" + L.rot + ") scale(0.001)"}>
                        <path d={L.path} fill={url("leaf")} stroke={C.petalDark} strokeWidth="1" strokeLinejoin="round" />
                        <g fill="none" stroke={C.petalDark} strokeWidth="0.75" opacity="0.85">
                          {L.lines.map((d, j) => (
                            <path key={j} d={d} />
                          ))}
                        </g>
                      </g>
                    ))}
                    <g className="psp-head" transform={"translate(" + HEAD_X + " " + HEAD_Y + ") scale(1.34)"}>
                      {[0, 1, 2, 3, 4].map((i) => (
                        <g key={i}>
                          <path className="psp-petal" d={pspPetal(0)} transform="scale(0.001)" fill={url("petal")} stroke={C.petalDark} strokeWidth="1.1" strokeLinejoin="round" />
                          <g className="psp-petal-lines" transform="scale(0.001)" fill="none" stroke={C.petalDark} strokeWidth="0.7" strokeLinecap="round" style={{ opacity: 0 }}>
                            {pspPetalLines(0).map((d, j) => (
                              <path key={j} d={d} />
                            ))}
                          </g>
                        </g>
                      ))}
                      <g className="psp-heart" transform="scale(0.001)">
                        <circle r="13" fill={C.petalDark} opacity="0.35" />
                        {STAMENS.map((s, i) => (
                          <g key={i} transform={"rotate(" + f1((s.a * 180) / Math.PI) + ")"}>
                            <line x1="3" y1="0" x2={s.r} y2="0" stroke={C.petalDark} strokeWidth="0.8" />
                            <circle cx={s.r} cy="0" r={s.w} fill={C.petalDark} />
                            <circle cx={s.r - 0.4} cy="-0.4" r={s.w * 0.5} fill={C.petal} />
                          </g>
                        ))}
                        <circle r="6.5" fill={C.leaf} stroke={C.petalDark} strokeWidth="0.8" />
                        <circle r="2.6" fill={C.petal} />
                      </g>
                    </g>
                  </g>

                  {/* the touch */}
                  <g transform={"translate(" + f1(TOUCH[0]) + " " + f1(TOUCH[1]) + ")"}>
                    <circle className="psp-halo" r="26" fill={C.disc} />
                    <g className="psp-spark" fill={C.gold} stroke={C.cream} strokeWidth="0.6">
                      <path d="M0 -22C2 -8 8 -2 22 0C8 2 2 8 0 22C-2 8 -8 2 -22 0C-8 -2 -2 -8 0 -22Z" />
                      <path d="M0 -10C1 -4 4 -1 10 0C4 1 1 4 0 10C-1 4 -4 1 -10 0C-4 -1 -1 -4 0 -10Z" transform="rotate(45)" fill="#fff8e0" />
                    </g>
                  </g>
                </svg>

                {/* the hands, over the stamp and its edge, cut at the sheet's bounds */}
                <div className="psp-hands">
                  {renderHand("l")}
                  {renderHand("r")}
                </div>

                {/* print texture: grain and ink mottling, painted once */}
                <svg className="psp-grain" viewBox={"0 0 " + W + " " + H} width={W} height={H} aria-hidden="true" preserveAspectRatio="none">
                  <filter id={id("grain")} x="0" y="0" width="100%" height="100%">
                    <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7" stitchTiles="stitch" result="n" />
                    <feColorMatrix type="saturate" values="0" in="n" result="g" />
                    <feComponentTransfer in="g">
                      <feFuncA type="table" tableValues="0 0.42" />
                    </feComponentTransfer>
                  </filter>
                  <filter id={id("mottle")} x="0" y="0" width="100%" height="100%">
                    <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="3" seed="11" result="n" />
                    <feColorMatrix type="saturate" values="0" in="n" result="g" />
                    <feComponentTransfer in="g">
                      <feFuncA type="table" tableValues="0 0.12" />
                    </feComponentTransfer>
                  </filter>
                  <rect x="0" y="0" width={W} height={H} filter={url("grain")} />
                  <rect x="0" y="0" width={W} height={H} filter={url("mottle")} />
                </svg>
                <div className="psp-sheen" />
              </div>

              {/* the postmark sits over the perforation, as a cancellation does */}
              <svg className="psp-postmark" viewBox={"0 0 " + W + " " + H} aria-hidden="true" style={{ fontFamily: serifFamily }}>
                <defs>
                  <filter id={id("rough")} x="-5%" y="-5%" width="110%" height="110%">
                    <feTurbulence type="fractalNoise" baseFrequency="0.07" numOctaves="3" seed="3" result="n" />
                    <feDisplacementMap in="SourceGraphic" in2="n" scale="3.5" xChannelSelector="R" yChannelSelector="G" />
                  </filter>
                  <path id={id("arc-mark")} d={pspArc(0, 0, 78, 182, 358)} />
                </defs>
                <g transform={"translate(" + W * 0.8 + " " + H * 0.2 + ")"} filter={url("rough")} fill="none" stroke={C.ink} opacity="0.88">
                  <circle r="92" strokeWidth="5" />
                  <circle r="66" strokeWidth="3" />
                  <g strokeWidth="4" strokeLinecap="round">
                    {POSTMARK_BARS.map((d, i) => (
                      <path key={i} d={d} />
                    ))}
                  </g>
                  {postmark ? (
                    <text fill={C.ink} stroke="none" fontSize="17" fontWeight="700" letterSpacing="4">
                      <textPath href={"#" + id("arc-mark")} startOffset="50%" textAnchor="middle">
                        {postmark + " · " + year}
                      </textPath>
                    </text>
                  ) : null}
                  <text fill={C.ink} stroke="none" fontSize="22" fontWeight="700" letterSpacing="3" textAnchor="middle" y="8">
                    {pspMoney(value, currency, decimal, 1)}
                  </text>
                  <text fill={C.ink} stroke="none" fontSize="10" letterSpacing="4" textAnchor="middle" y="28">
                    {"100%"}
                  </text>
                </g>
              </svg>
            </div>
          </div>

          {hud && (
            <>
              <div className="psp-hud psp-hud-tl">
                {label}
                <span className="psp-hud-rule" />
                {word}
              </div>
              <div className="psp-hud psp-hud-br">
                <span className="psp-counter">000</span> / 100
              </div>
              <div className="psp-hud psp-hud-bc">{loop && phase === "cancel" ? "Click to lift" : "Click to skip"}</div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// The hands, cut out of Michelangelo's Creation of Adam (Sistine Chapel,
// c. 1512; public domain) and stored as greyscale WebP with alpha. The
// gradient map above gives them their colour.
const PSP_HAND_L =
  "data:image/webp;base64,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"
const PSP_HAND_R =
  "data:image/webp;base64,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"
