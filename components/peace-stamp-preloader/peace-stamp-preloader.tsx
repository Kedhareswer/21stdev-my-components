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
// One file, React only. Every mark is procedural SVG built in the file. The
// hands are shaped from a palm and articulated fingers (forward kinematics),
// drawn as a height map and lit with SVG lighting filters, which is what gives
// them the matte, sculpted, grainy look. Paper grain, ink mottling and the
// postmark's rough edge are SVG filters too. Nothing is fetched. Every rule in
// the scoped <style> is .psp- prefixed.

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
    leaf: "#9a8a3a",
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

export interface PspFinger {
  /** Where the finger leaves the palm. */
  base: Pt
  /** Segment lengths, base to tip. */
  lens: number[]
  /** Thickness. */
  w: number
  /** Absolute angle of each segment, degrees, clockwise on screen. */
  a: number[]
  /** The joints, base first, tip last. */
  pts: Pt[]
  /** Height in the relief, 0..1: 1 is nearest. Fingers set back read darker. */
  tone: number
  /** Which side the back of the finger faces: 1 up, -1 down, 0 toward us. */
  up: number
  /** Whether a nail shows. */
  nail: boolean
}

/** Forward kinematics: joint positions from a base, lengths and absolute angles. */
export const pspFk = (base: Pt, lens: number[], angs: number[]): Pt[] => {
  let x = base[0]
  let y = base[1]
  const pts: Pt[] = [[x, y]]
  for (let i = 0; i < lens.length; i++) {
    const r = (angs[i] * Math.PI) / 180
    x += lens[i] * Math.cos(r)
    y += lens[i] * Math.sin(r)
    pts.push([x, y])
  }
  return pts
}

const pspMix = (a: number[], b: number[], t: number) => a.map((v, i) => pspLerp(v, b[i], t))

const pspDirs = (pts: Pt[]) => {
  const dirs: Pt[] = []
  for (let j = 0; j < pts.length - 1; j++) {
    const dx = pts[j + 1][0] - pts[j][0]
    const dy = pts[j + 1][1] - pts[j][1]
    const l = Math.hypot(dx, dy) || 1
    dirs.push([dx / l, dy / l])
  }
  return dirs
}

/** The point a finger actually ends at, past its last joint. */
export const pspFingerTip = (f: PspFinger): Pt => {
  const last = f.pts[f.pts.length - 1]
  const r = (f.a[f.a.length - 1] * Math.PI) / 180
  return [last[0] + f.w * 0.42 * Math.cos(r), last[1] + f.w * 0.42 * Math.sin(r)]
}

/**
 * A finger's silhouette: a tube along its joints that swells at the knuckles,
 * slims between them, tapers to a rounded tip and runs back into the palm.
 */
export const pspFingerOutline = (f: PspFinger) => {
  const { pts, w } = f
  const n = pts.length - 1
  const dirs = pspDirs(pts)
  const L: Pt[] = []
  const R: Pt[] = []
  const push = (c: Pt, d: Pt, width: number, s: number) => {
    const nx = -d[1] * s * (width / 2)
    const ny = d[0] * s * (width / 2)
    L.push([c[0] + nx, c[1] + ny])
    R.push([c[0] - nx, c[1] - ny])
  }
  const d0 = dirs[0]
  push([pts[0][0] - d0[0] * w, pts[0][1] - d0[1] * w], d0, w * 1.08, 1)
  for (let j = 0; j < n; j++) {
    const d = dirs[j]
    if (j === 0) push(pts[0], d, w * 1.05, 1)
    else {
      const bx = dirs[j - 1][0] + d[0]
      const by = dirs[j - 1][1] + d[1]
      const bl = Math.hypot(bx, by) || 1
      const bis: Pt = [bx / bl, by / bl]
      const s = Math.min(1.3, 1 / Math.max(0.3, bis[0] * d[0] + bis[1] * d[1]))
      push(pts[j], bis, w * (j === 1 ? 1.01 : 0.95), s)
    }
    const taper = j === n - 1 ? 0.88 : j === 0 ? 0.96 : 0.91
    push([(pts[j][0] + pts[j + 1][0]) / 2, (pts[j][1] + pts[j + 1][1]) / 2], d, w * taper, 1)
  }
  const dl = dirs[n - 1]
  const tip = pts[n]
  push(tip, dl, w * 0.84, 1)
  const r = w * 0.42
  const a0 = Math.atan2(dl[1], dl[0])
  const cap: Pt[] = []
  for (const k of [60, 30, 0, -30, -60]) {
    const a = a0 + (k * Math.PI) / 180
    cap.push([tip[0] + r * Math.cos(a), tip[1] + r * Math.sin(a)])
  }
  return pspSmooth(L.concat(cap, R.reverse()), true, 0.85)
}

/** The fine marks on a finger: wrinkles over its joints and its nail. */
export const pspFingerMarks = (f: PspFinger) => {
  const { pts, w, up } = f
  const n = pts.length - 1
  const dirs = pspDirs(pts)
  const dorsal = (d: Pt): Pt => {
    if (!up) return [0, 0]
    const nx = -d[1]
    const ny = d[0]
    const s = up === 1 ? (ny <= 0 ? 1 : -1) : ny >= 0 ? 1 : -1
    return [nx * s, ny * s]
  }
  const creases: string[] = []
  for (let j = 1; j < n; j++) {
    const bx = dirs[j - 1][0] + dirs[j][0]
    const by = dirs[j - 1][1] + dirs[j][1]
    const bl = Math.hypot(bx, by) || 1
    const d: Pt = [bx / bl, by / bl]
    const dp = up ? dorsal(d) : ([-d[1], d[0]] as Pt)
    const c = pts[j]
    for (const o of [-2.6, 0.2, 2.8]) {
      const reach = o === 0.2 ? 0.46 : 0.34
      const sx = c[0] + dp[0] * w * reach + d[0] * o
      const sy = c[1] + dp[1] * w * reach + d[1] * o
      const ex = c[0] + dp[0] * w * 0.02 + d[0] * o
      const ey = c[1] + dp[1] * w * 0.02 + d[1] * o
      creases.push(
        "M" + f1(sx) + " " + f1(sy) + "Q" + f1((sx + ex) / 2 + d[0] * 1.8) + " " + f1((sy + ey) / 2 + d[1] * 1.8) + " " + f1(ex) + " " + f1(ey),
      )
    }
  }
  const dl = dirs[n - 1]
  const dp = dorsal(dl)
  const segLen = Math.hypot(pts[n][0] - pts[n - 1][0], pts[n][1] - pts[n - 1][1])
  const nail = f.nail
    ? {
        x: pts[n - 1][0] + (pts[n][0] - pts[n - 1][0]) * 0.78 + dp[0] * w * 0.2,
        y: pts[n - 1][1] + (pts[n][1] - pts[n - 1][1]) * 0.78 + dp[1] * w * 0.2,
        a: (Math.atan2(dl[1], dl[0]) * 180) / Math.PI,
        rx: segLen * 0.42,
        ry: w * (up ? 0.22 : 0.3),
      }
    : null
  return { creases, nail }
}

const pspFingers = (
  spec: { base: Pt; lens: number[]; w: number; a: number[]; tone: number; up: number; nail: boolean }[],
): PspFinger[] => spec.map((f) => ({ ...f, pts: pspFk(f.base, f.lens, f.a) }))

/**
 * The left hand, after the one reaching out in the Sistine ceiling: the back
 * of the hand up, the wrist lifted, the index finger reaching and the others
 * drooping, the thumb hanging below. Stamp coordinates. `e` is the pose, 0
 * slack (as it slides in) to 1 reaching.
 */
export const pspHandLeft = (e: number) => {
  const t = pspEaseOut(pspClamp(e, 0, 1))
  // forearm, narrowing to the wrist, then the back of the hand rising to the knuckles
  const palm: Pt[] = [
    [-40, 134], [40, 136], [110, 146], [170, 157], [210, 161], [245, 164], [272, 168], [294, 176],
    [304, 192], [306, 210], [302, 228], [294, 242], [278, 252], [250, 256], [214, 250], [182, 244],
    [130, 248], [60, 252], [-40, 256],
  ]
  const under = pspFingers([
    { base: [282, 230], lens: [36, 27, 22], w: 17, a: pspMix([96, 118, 134], [88, 108, 122], t), tone: 0.6, up: 1, nail: false },
    { base: [288, 214], lens: [46, 32, 26], w: 19, a: pspMix([76, 100, 118], [66, 88, 104], t), tone: 0.7, up: 1, nail: true },
    { base: [286, 196], lens: [60, 42, 32], w: 20.5, a: pspMix([64, 84, 100], [56, 72, 86], t), tone: 0.82, up: 1, nail: true },
    { base: [282, 176], lens: [58, 40, 32], w: 21, a: pspMix([46, 56, 64], [36, 42, 48], t), tone: 0.92, up: 1, nail: true },
  ])
  // the thumb lies along the side of the hand, a lump catching the light
  const over = pspFingers([{ base: [190, 214], lens: [34, 26], w: 27, a: pspMix([24, 36], [12, 24], t), tone: 1, up: 1, nail: false }])
  // soft swellings in the relief: knuckles, the wrist bone, the forearm's muscle
  const bumps: number[][] = [
    [294, 180, 11, 9, 30], [298, 198, 10, 9, 40], [298, 216, 9, 8, 50], [292, 232, 8, 7, 60],
    [178, 163, 13, 8, -4], [70, 160, 64, 14, -3], [240, 184, 30, 15, 10], [224, 222, 22, 12, 16],
  ]
  return { palm: pspSmooth(palm, true, 0.9), under, over, bumps, tip: pspFingerTip(under[3]) }
}

/**
 * The right hand: the back of the hand toward us, the index finger reaching
 * to the stem, the thumb tucked behind it, the other fingers curled under.
 * Stamp coordinates. `e` closes the hand onto the stem.
 */
export const pspHandRight = (e: number) => {
  const t = pspEaseOut(pspClamp(e, 0, 1))
  const palm: Pt[] = [
    [840, 282], [760, 280], [680, 278], [600, 272], [566, 250], [536, 232], [508, 222], [486, 224],
    [470, 236], [462, 256], [460, 280], [464, 304], [474, 324], [490, 340], [512, 350], [546, 356],
    [590, 366], [650, 380], [730, 388], [840, 392],
  ]
  const under = pspFingers([
    { base: [510, 300], lens: [46, 36], w: 23, a: pspMix([194, 182], [178, 156], t), tone: 0.7, up: 0, nail: true },
    { base: [490, 326], lens: [29, 21, 17], w: 17.5, a: pspMix([160, 124, 96], [152, 100, 58], t), tone: 0.6, up: 1, nail: false },
    { base: [482, 308], lens: [34, 25, 20], w: 19, a: pspMix([166, 132, 104], [160, 108, 66], t), tone: 0.68, up: 1, nail: false },
    { base: [478, 288], lens: [38, 28, 22], w: 20, a: pspMix([172, 142, 112], [166, 116, 74], t), tone: 0.78, up: 1, nail: false },
    { base: [486, 246], lens: [44, 32, 26], w: 21.5, a: pspMix([176, 170, 166], [160, 152, 146], t), tone: 0.92, up: 1, nail: true },
  ])
  const bumps: number[][] = [
    [480, 250, 11, 10, -20], [474, 292, 10, 9, -10], [478, 312, 9, 8, 0], [486, 330, 8, 7, 10],
    [530, 250, 30, 15, -18], [600, 278, 14, 9, 6], [720, 310, 72, 14, 2],
  ]
  return { palm: pspSmooth(palm, true, 0.9), under, over: [] as PspFinger[], bumps, tip: pspFingerTip(under[4]) }
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
const LEFT_FINAL = pspHandLeft(1)
const RIGHT_FINAL = pspHandRight(1)
const TOUCH: Pt = [(LEFT_FINAL.tip[0] + RIGHT_FINAL.tip[0]) / 2, (LEFT_FINAL.tip[1] + RIGHT_FINAL.tip[1]) / 2]
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

    // the hands' parts, collected once so posing is only attribute writes
    const handParts = (h: string) => {
      const svg = stage.querySelector(".psp-hand-" + h)
      const keys = ["f0", "f1", "f2", "f3", "f4", "o0"]
      const map: { [k: string]: { paths: SVGElement[]; creases: SVGElement[]; nail: SVGElement | null } } = {}
      for (const k of keys) {
        const paths = svg ? (Array.from(svg.querySelectorAll('[data-part="' + k + '"]')) as SVGElement[]) : []
        const mark = svg ? svg.querySelector('[data-mark="' + k + '"]') : null
        map[k] = {
          paths,
          creases: mark ? (Array.from(mark.querySelectorAll(".psp-crease")) as SVGElement[]) : [],
          nail: mark ? (mark.querySelector(".psp-nail") as SVGElement | null) : null,
        }
      }
      return map
    }
    const parts = { l: handParts("l"), r: handParts("r") }
    const lastPose = { l: -1, r: -1 }
    const pose = (h: "l" | "r", e: number) => {
      const q = Math.round(e * 40) / 40
      if (q === lastPose[h]) return
      lastPose[h] = q
      const hand = h === "l" ? pspHandLeft(q) : pspHandRight(q)
      const list: [string, PspFinger][] = hand.under.map((f, i) => ["f" + i, f] as [string, PspFinger])
      hand.over.forEach((f, i) => list.push(["o" + i, f]))
      for (const [k, f] of list) {
        const p = parts[h][k]
        if (!p) continue
        const d = pspFingerOutline(f)
        for (const path of p.paths) path.setAttribute("d", d)
        const m = pspFingerMarks(f)
        p.creases.forEach((c, j) => c.setAttribute("d", m.creases[j] || "M0 0"))
        if (p.nail && m.nail) {
          p.nail.setAttribute("transform", "translate(" + f1(m.nail.x) + " " + f1(m.nail.y) + ") rotate(" + f1(m.nail.a) + ")")
          p.nail.setAttribute("rx", f1(m.nail.rx))
          p.nail.setAttribute("ry", f1(m.nail.ry))
        }
      }
    }

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
        put(leaf, "transform", "translate(" + L.x + " " + L.y + ") rotate(" + f1(L.rot - (1 - u) * 40) + ") scale(" + f1(Math.max(0.001, u * 1.2)) + ")")
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
      // the hands reach in over the edges, and settle into their pose
      const hl = pspEaseOut(pspSmoothstep(0.28, 0.86, p))
      const hr = pspEaseOut(pspSmoothstep(0.4, 0.97, p))
      const sc = stampScale()
      put(el.handL, "$opacity", reduced ? f1(pspSmoothstep(0.28, 0.5, p)) : "1")
      put(el.handL, "$transform", "translate(" + f1(reduced ? 0 : -SLIDE * (1 - hl) * sc) + "px, 0px)")
      put(el.handR, "$opacity", reduced ? f1(pspSmoothstep(0.4, 0.62, p)) : "1")
      put(el.handR, "$transform", "translate(" + f1(reduced ? 0 : SLIDE * (1 - hr) * sc) + "px, 0px)")
      pose("l", pspSmoothstep(0.52, 0.94, p))
      pose("r", pspSmoothstep(0.62, 1, p))
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
      put(el.head, "transform", "translate(" + HEAD_X + " " + HEAD_Y + ") rotate(" + f1(idle * 2.2 * Math.sin(now / 1300)) + ") scale(1.2)")

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
        if (el.handL) el.handL.style.transform = "translate(" + f1(drift * s + sp.ry * 1.2) + "px, " + f1(-drift * 0.5 * s - sp.rx * 1.2) + "px)"
        if (el.handR) el.handR.style.transform = "translate(" + f1(-drift * s + sp.ry * 1.2) + "px, " + f1(drift * 0.6 * s - sp.rx * 1.2) + "px)"
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

  const renderHand = (h: "l" | "r", box: number[], from: number) => {
    const hand = h === "l" ? pspHandLeft(0) : pspHandRight(0)
    const fingers: [string, PspFinger][] = hand.under.map((f, i) => ["f" + i, f] as [string, PspFinger])
    const over: [string, PspFinger][] = hand.over.map((f, i) => ["o" + i, f] as [string, PspFinger])
    const gray = (t: number) => {
      const v = Math.round(255 * t)
      return "rgb(" + v + "," + v + "," + v + ")"
    }
    return (
      <svg
        className={"psp-hand psp-hand-" + h}
        viewBox={"0 0 " + W + " " + H}
        preserveAspectRatio="none"
        aria-hidden="true"
        style={{ transform: "translate(" + from + "px, 0px)" }}
      >
        <defs>
          <filter id={id("sculpt-" + h)} filterUnits="userSpaceOnUse" x={box[0]} y={box[1]} width={box[2]} height={box[3]} colorInterpolationFilters="sRGB">
            <feColorMatrix in="SourceGraphic" type="luminanceToAlpha" result="h0" />
            <feGaussianBlur in="h0" stdDeviation="3.2" result="hs" />
            <feGaussianBlur in="h0" stdDeviation="15" result="hb" />
            <feComposite in="hs" in2="hb" operator="arithmetic" k2="0.42" k3="0.58" result="hm" />
            <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="1" seed={h === "l" ? 21 : 33} result="dn" />
            <feColorMatrix in="dn" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1 0 0 0 0" result="da" />
            <feComposite in="da" in2="hm" operator="arithmetic" k2="0.035" k3="1" k4="-0.017" result="h" />
            <feDiffuseLighting in="h" surfaceScale="24" diffuseConstant="1.25" lightingColor="#ffffff" result="d">
              <feDistantLight azimuth="250" elevation="36" />
            </feDiffuseLighting>
            <feSpecularLighting in="h" surfaceScale="24" specularConstant="0.5" specularExponent="6" lightingColor={C.skinLight} result="s">
              <feDistantLight azimuth="250" elevation="55" />
            </feSpecularLighting>
            <feComposite in="s" in2="SourceAlpha" operator="in" result="s2" />
            <feFlood floodColor={C.skin} result="c" />
            <feFlood floodColor={C.skinDark} result="k" />
            <feComposite in="d" in2="c" operator="arithmetic" k1="1" result="cd" />
            <feComposite in="d" in2="k" operator="arithmetic" k1="-1" k3="1" result="kd" />
            <feComposite in="cd" in2="kd" operator="arithmetic" k2="1" k3="1" result="lit" />
            <feColorMatrix in="hb" type="matrix" values="0 0 0 1 0  0 0 0 1 0  0 0 0 1 0  0 0 0 0 1" result="ao" />
            <feComposite in="lit" in2="ao" operator="arithmetic" k1="0.4" k2="0.7" result="lao" />
            <feComposite in="s2" in2="lao" operator="arithmetic" k2="0.6" k3="1" result="ls" />
            <feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves="2" seed={h === "l" ? 4 : 9} result="n0" />
            <feColorMatrix in="n0" type="matrix" values="0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0 0 0 0 1" result="n" />
            <feComposite in="n" in2="ls" operator="arithmetic" k2="0.3" k3="1" k4="-0.15" result="grained" />
            <feComposite in="grained" in2="SourceAlpha" operator="in" />
          </filter>
          <linearGradient id={id("tone-" + h)} x1="0" y1={box[1]} x2="0" y2={box[1] + box[3]} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor={C.skinLight} />
            <stop offset="0.35" stopColor={C.skinLight} stopOpacity="0.35" />
            <stop offset="0.6" stopColor={C.skin} stopOpacity="0" />
            <stop offset="1" stopColor={C.skinDark} />
          </linearGradient>
          <filter id={id("soft-" + h)} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
          <filter id={id("cast-" + h)} filterUnits="userSpaceOnUse" x={box[0] - 30} y={box[1] - 30} width={box[2] + 60} height={box[3] + 60}>
            <feGaussianBlur in="SourceAlpha" stdDeviation="7" />
          </filter>
        </defs>
        {/* the shadow the hand casts on the stamp */}
        <g filter={url("cast-" + h)} opacity="0.42" transform="translate(9 15)">
          {fingers.map(([k, f]) => (
            <path key={k} data-part={k} d={pspFingerOutline(f)} fill="#000" />
          ))}
          <path d={hand.palm} fill="#000" />
          {over.map(([k, f]) => (
            <path key={k} data-part={k} d={pspFingerOutline(f)} fill="#000" />
          ))}
        </g>
        {/* the relief: nearer is lighter; the filter lights it */}
        <g filter={url("sculpt-" + h)}>
          {fingers.map(([k, f]) => (
            <path key={k} data-part={k} d={pspFingerOutline(f)} fill={gray(f.tone)} stroke="#000" strokeWidth="2.4" strokeLinejoin="round" />
          ))}
          <path d={hand.palm} fill={gray(0.86)} />
          {hand.bumps.map((b, i) => (
            <ellipse key={i} cx={b[0]} cy={b[1]} rx={b[2]} ry={b[3]} transform={"rotate(" + b[4] + " " + b[0] + " " + b[1] + ")"} fill="#fff" filter={url("soft-" + h)} />
          ))}
          {over.map(([k, f]) => (
            <path key={k} data-part={k} d={pspFingerOutline(f)} fill={gray(f.tone)} />
          ))}
        </g>
        {/* a broad top light and a navy underside, blended over the relief */}
        <g style={{ mixBlendMode: "soft-light" }} opacity="0.75">
          {fingers.map(([k, f]) => (
            <path key={k} data-part={k} d={pspFingerOutline(f)} fill={url("tone-" + h)} />
          ))}
          <path d={hand.palm} fill={url("tone-" + h)} />
          {over.map(([k, f]) => (
            <path key={k} data-part={k} d={pspFingerOutline(f)} fill={url("tone-" + h)} />
          ))}
        </g>
        {/* wrinkles and nails, over the relief */}
        <g fill="none" strokeLinecap="round">
          {fingers.concat(over).map(([k, f]) => {
            const m = pspFingerMarks(f)
            return (
              <g key={k} data-mark={k}>
                {m.creases.map((d, j) => (
                  <path key={j} className="psp-crease" d={d} stroke={C.skinDark} strokeWidth="1" opacity="0.3" />
                ))}
                {m.nail ? (
                  <ellipse
                    className="psp-nail"
                    rx={m.nail.rx}
                    ry={m.nail.ry}
                    transform={"translate(" + f1(m.nail.x) + " " + f1(m.nail.y) + ") rotate(" + f1(m.nail.a) + ")"}
                    fill={C.skinLight}
                    fillOpacity="0.16"
                    stroke={C.skinDark}
                    strokeWidth="0.9"
                    strokeOpacity="0.35"
                  />
                ) : null}
              </g>
            )
          })}
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
                      <stop offset="0.34" stopColor={C.petal} />
                      <stop offset="0.86" stopColor={C.petal} />
                      <stop offset="1" stopColor={C.cream} />
                    </linearGradient>
                    <linearGradient id={id("leaf")} x1="-14" y1="0" x2="14" y2="0" gradientUnits="userSpaceOnUse">
                      <stop offset="0" stopColor={C.petal} />
                      <stop offset="0.48" stopColor={C.leaf} />
                      <stop offset="0.52" stopColor={C.petalDark} />
                      <stop offset="1" stopColor={C.leaf} />
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
                    <g className="psp-head" transform={"translate(" + HEAD_X + " " + HEAD_Y + ") scale(1.2)"}>
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
                  {renderHand("l", [-60, 110, 440, 230], -SLIDE)}
                  {renderHand("r", [350, 190, 500, 220], SLIDE)}
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
