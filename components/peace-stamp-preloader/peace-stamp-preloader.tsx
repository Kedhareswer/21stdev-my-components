"use client"

// Peace Stamp Preloader — a loading gate drawn as a postage stamp. A sheet of
// perforated paper lands on the page, the teal and magenta plates print one
// after the other, the gold hairlines and the guilloche border draw
// themselves, and in the middle, on a mint disc, a golden hellebore grows out
// of a bud as the page loads. Two engraved blue hands reach in from the edges
// of the stamp: one open and pointing, the other pinching the stem. At 100%
// the fingertip glints, a postmark cancels the stamp, and the stamp lifts off
// the page to reveal whatever it was guarding.
//
// One file, React only. Every mark is procedural SVG built in the file: the
// perforation, the guilloche, the ring type, the flower and its morphing
// petals, both hands with their hatching, and the postmark. Paper grain and
// the postmark's rough ink come from SVG filters. Nothing is fetched. Every
// rule in the scoped <style> is .psp- prefixed.

import * as React from "react"

export interface PeaceStampPalette {
  /** The stamp's paper. */
  paper: string
  /** The magenta plate: the field inside the border and the inner ring. */
  field: string
  /** The teal plate: the outer band, the side letters, the outer ring. */
  band: string
  /** Gold hairlines, dots and the small type. */
  gold: string
  /** Edge of the central disc. It fades to `disc` at the centre. */
  mint: string
  /** Centre of the disc, where the light is. */
  disc: string
  /** The flower's petals. */
  petal: string
  /** Veins and the darker heart of the flower. */
  petalDark: string
  /** Stem and leaves. */
  leaf: string
  /** The hands. */
  skin: string
  /** The hands' shadow side and hatching. */
  skinDark: string
  /** The hands' highlight. */
  skinLight: string
  /** Engraved lines, the postmark, the small print. */
  ink: string
  /** The stage behind the stamp. Leave out to use the host's background token. */
  stage?: string
}

export interface PeaceStampPaletteOverrides {
  paper?: string
  field?: string
  band?: string
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
  /** Length of the simulated load. Defaults to 5200ms. */
  durationMs?: number
  /** The word on the ring and on the side arcs. Three or four letters read best. */
  word?: string
  /** The line set up the left edge, reading bottom to top. */
  leftText?: string
  /** The line set down the right edge, reading top to bottom. */
  rightText?: string
  /** Set small in the four corner tabs. */
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
  /** Face for the ring, the arcs and the side lines. Nothing is fetched. */
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
    paper: "#f5f0e4",
    field: "#e4247c",
    band: "#41b3a1",
    gold: "#e0b35c",
    mint: "#bfe9d9",
    disc: "#ffffff",
    petal: "#e6bd52",
    petalDark: "#a8741f",
    leaf: "#8a9a3a",
    skin: "#3f82df",
    skinDark: "#1b3f94",
    skinLight: "#b9d7fb",
    ink: "#1d2744",
  },
  cobalt: {
    paper: "#f3efe6",
    field: "#1f3fb8",
    band: "#f07a4e",
    gold: "#f1cf7a",
    mint: "#dbe4ff",
    disc: "#ffffff",
    petal: "#f6c54f",
    petalDark: "#b07a14",
    leaf: "#5b8f5a",
    skin: "#e6553f",
    skinDark: "#7a1f14",
    skinLight: "#ffc4b3",
    ink: "#141a3d",
  },
  olive: {
    paper: "#efe8d4",
    field: "#5e6b2d",
    band: "#c8552f",
    gold: "#d9b35e",
    mint: "#e8e1c5",
    disc: "#fbf7ea",
    petal: "#d6a93e",
    petalDark: "#8a5f12",
    leaf: "#3f5a2a",
    skin: "#8b6b4a",
    skinDark: "#3d2a16",
    skinLight: "#e6cfae",
    ink: "#2b2416",
  },
}

// Stamp coordinates. Everything is drawn in this box and scaled to fit.
const W = 760
const H = 540
const CX = 380
const CY = 270
// Where the two fingertips meet the flower.
const TOUCH_X = 338
const TOUCH_Y = 255
const PINCH_X = 416
const PINCH_Y = 294
const HEAD_X = 397
const HEAD_Y = 186
// How far off the sheet the hands start, in stamp units.
const SLIDE = 540

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
  let v = fast - (stall1 + stall2) * (1 - x)
  v = pspClamp(v, 0, 1)
  return x >= 1 ? 1 : v
}

/** "€0,68" from 0.68. Counts up through the load with `value * p`. */
export const pspMoney = (value: number, currency: string, decimal: string, p: number) => {
  const v = Math.max(0, value) * pspClamp(p, 0, 1)
  const decimals = Number.isInteger(value) ? 0 : 2
  const s = v.toFixed(decimals)
  return currency + (decimal === "," ? s.replace(".", ",") : s)
}

/** Deterministic noise, so grains and jitter are the same on every mount. */
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
  for (let i = 0; i < segs; i++) {
    const p0 = at(i - 1)
    const p1 = at(i)
    const p2 = at(i + 1)
    const p3 = at(i + 2)
    const k = tension / 6
    const c1x = p1[0] + (p2[0] - p0[0]) * k
    const c1y = p1[1] + (p2[1] - p0[1]) * k
    const c2x = p2[0] - (p3[0] - p1[0]) * k
    const c2y = p2[1] - (p3[1] - p1[1]) * k
    d += "C" + f1(c1x) + " " + f1(c1y) + " " + f1(c2x) + " " + f1(c2y) + " " + f1(p2[0]) + " " + f1(p2[1])
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

/**
 * Perforation holes round a w×h sheet: circle centres on the edge, one every
 * `pitch`. `torn` drops one tooth at the bottom-left corner, as the sheet in
 * the picture has.
 */
export const pspPerforation = (w: number, h: number, pitch: number) => {
  const holes: Pt[] = []
  const nx = Math.round(w / pitch)
  const ny = Math.round(h / pitch)
  const sx = w / nx
  const sy = h / ny
  for (let i = 0; i <= nx; i++) {
    holes.push([i * sx, 0])
    holes.push([i * sx, h])
  }
  for (let j = 1; j < ny; j++) {
    holes.push([0, j * sy])
    holes.push([w, j * sy])
  }
  return holes
}

/**
 * The sheet with its holes punched, as one evenodd path: the sheet, a circle
 * per hole, and the torn tooth at the bottom-left corner.
 */
export const pspPerforationPath = (w: number, h: number, holes: Pt[], r: number) => {
  let d = "M0 0H" + w + "V" + h + "H0Z"
  for (const p of holes) {
    d += "M" + f1(p[0] - r) + " " + f1(p[1]) + "a" + r + " " + r + " 0 1 0 " + 2 * r + " 0a" + r + " " + r + " 0 1 0 " + -2 * r + " 0Z"
  }
  d += "M0 " + (h - 24) + "L0 " + h + "L24 " + h + "Z"
  return d
}

/**
 * One side of the guilloche border: two sine ribbons crossing, with a loop
 * at every crossing, along `len` from (0,0). Rotate it onto each edge.
 */
export const pspGuilloche = (len: number, amp: number, period: number, phase: number) => {
  const n = Math.max(1, Math.round(len / period))
  const step = len / n
  const pts: Pt[] = []
  const samples = 12
  for (let i = 0; i <= n * samples; i++) {
    const x = (i / samples) * step
    const u = (i / samples) * Math.PI * 2
    const y = amp * Math.sin(u + phase) * (0.75 + 0.25 * Math.cos(u * 2))
    pts.push([x, y])
  }
  return pspSmooth(pts, false, 0.9)
}

/** A dotted rule of small circles along one side. */
export const pspDots = (len: number, step: number) => {
  const out: number[] = []
  for (let x = step / 2; x < len; x += step) out.push(Math.round(x * 10) / 10)
  return out
}

/**
 * One hellebore petal, morphing with t: at 0 a narrow bud fold, at 1 an open
 * rounded petal with a soft notch at the tip. Drawn with its base at the
 * origin pointing up; rotate it into place.
 */
export const pspPetal = (t: number, len = 54, wid = 40) => {
  const k = pspClamp(t, 0, 1)
  const L = pspLerp(len * 0.42, len, k)
  const Wd = pspLerp(wid * 0.22, wid, k)
  const notch = pspLerp(0, L * 0.06, pspSmoothstep(0.6, 1, k))
  const shoulder = pspLerp(0.34, 0.58, k)
  const xs = Wd / 2
  const d =
    "M0 0" +
    "C" + f1(xs * 0.55) + " " + f1(-L * 0.1) + " " + f1(xs * 1.05) + " " + f1(-L * shoulder) + " " + f1(xs * 0.92) + " " + f1(-L * 0.78) +
    "C" + f1(xs * 0.8) + " " + f1(-L * 0.98) + " " + f1(xs * 0.3) + " " + f1(-L * 1.02) + " 0 " + f1(-L + notch) +
    "C" + f1(-xs * 0.3) + " " + f1(-L * 1.02) + " " + f1(-xs * 0.8) + " " + f1(-L * 0.98) + " " + f1(-xs * 0.92) + " " + f1(-L * 0.78) +
    "C" + f1(-xs * 1.05) + " " + f1(-L * shoulder) + " " + f1(-xs * 0.55) + " " + f1(-L * 0.1) + " 0 0Z"
  return d
}

/** Three vein lines up a petal, for the engraving. Same t as the petal. */
export const pspVeins = (t: number, len = 54, wid = 40) => {
  const k = pspClamp(t, 0, 1)
  const L = pspLerp(len * 0.42, len, k)
  const xs = pspLerp(wid * 0.22, wid, k) / 2
  const out: string[] = []
  for (const s of [-0.5, 0, 0.5]) {
    const ex = xs * s * 0.85
    out.push("M0 " + f1(-L * 0.06) + "Q" + f1(ex * 0.5) + " " + f1(-L * 0.5) + " " + f1(ex) + " " + f1(-L * 0.86))
  }
  return out
}

/**
 * The flower's petals at morph t: angle, path, veins and a sort order so the
 * bud reads as folded. Five petals; in the bud they lean together, open they
 * sit 72° apart.
 */
export const pspFlower = (t: number) => {
  const k = pspClamp(t, 0, 1)
  const spread = pspLerp(14, 72, pspEaseOut(k))
  const lean = pspLerp(0, 1, k)
  return [0, 1, 2, 3, 4].map((i) => {
    const centred = i - 2
    const angle = centred * spread + 180 + pspLerp(0, 8, lean) * Math.sin(i * 2.1)
    const scale = pspLerp(0.92, 1, k) * (i === 2 ? 1 : 0.97)
    return {
      angle,
      scale,
      d: pspPetal(k, 54, 40),
      veins: pspVeins(k, 54, 40),
    }
  })
}

/** A serrated leaflet, base at the origin, pointing up. */
export const pspLeaf = (len: number, wid: number, teeth: number, seed: number) => {
  const rnd = pspRng(seed)
  const right: Pt[] = []
  const left: Pt[] = []
  for (let i = 0; i <= teeth; i++) {
    const u = i / teeth
    const half = (wid / 2) * Math.sin(Math.PI * Math.pow(u, 0.8)) * (u < 0.1 ? u / 0.1 : 1)
    const tooth = i === 0 || i === teeth ? 0 : (i % 2 ? 1 : 0.55) * (0.9 + rnd() * 0.3)
    right.push([half * tooth + half * 0.35, -len * u])
    left.push([-(half * tooth + half * 0.35), -len * u])
  }
  const pts: Pt[] = [...right, ...left.reverse()]
  return pspSmooth(pts, true, 0.5)
}

export interface PspFinger {
  /** Where the finger leaves the palm. */
  base: Pt
  /** Segment lengths, base to tip. */
  lens: number[]
  /** Thickness. */
  w: number
  /** Absolute angle of each segment, degrees. */
  a: number[]
  /** The joints, base first, tip last. */
  pts: Pt[]
  /** Whether a nail shows at the tip. */
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
const pspPoly = (pts: Pt[]) => pts.map((p, i) => (i ? "L" : "M") + f1(p[0]) + " " + f1(p[1])).join("")
/** The point a round-capped finger actually ends at. */
export const pspFingerTip = (f: PspFinger): Pt => {
  const last = f.pts[f.pts.length - 1]
  const r = (f.a[f.a.length - 1] * Math.PI) / 180
  return [last[0] + (f.w / 2) * Math.cos(r), last[1] + (f.w / 2) * Math.sin(r)]
}

/**
 * The marks on one finger: its centre line, a highlight down each segment's
 * lit side (light from above), a crease across each joint and the nail.
 */
export const pspFingerMarks = (f: PspFinger) => {
  const { pts, w } = f
  const n = pts.length - 1
  const dirs: Pt[] = []
  for (let j = 0; j < n; j++) {
    const dx = pts[j + 1][0] - pts[j][0]
    const dy = pts[j + 1][1] - pts[j][1]
    const len = Math.hypot(dx, dy) || 1
    dirs.push([dx / len, dy / len])
  }
  const highlights: string[] = []
  const hiAlpha: number[] = []
  for (let j = 0; j < n; j++) {
    const d = dirs[j]
    // the part of "up" that is across the finger
    const dot = -d[1]
    let nx = -dot * d[0]
    let ny = -1 - dot * d[1]
    const nl = Math.hypot(nx, ny)
    if (nl < 0.3) {
      highlights.push("")
      hiAlpha.push(0)
      continue
    }
    nx /= nl
    ny /= nl
    const ox = nx * w * 0.27
    const oy = ny * w * 0.27
    const s0 = j === 0 ? w * 0.15 : 0
    const s1 = j === n - 1 ? w * 0.32 : w * 0.05
    const x0 = pts[j][0] + d[0] * s0 + ox
    const y0 = pts[j][1] + d[1] * s0 + oy
    const x1 = pts[j + 1][0] - d[0] * s1 + ox
    const y1 = pts[j + 1][1] - d[1] * s1 + oy
    highlights.push("M" + f1(x0) + " " + f1(y0) + "L" + f1(x1) + " " + f1(y1))
    hiAlpha.push(Math.round(nl * 100) / 100)
  }
  const creases: string[] = []
  for (let j = 0; j < n; j++) {
    const b = j === 0 ? dirs[0] : [dirs[j - 1][0] + dirs[j][0], dirs[j - 1][1] + dirs[j][1]]
    const bl = Math.hypot(b[0], b[1]) || 1
    const bx = b[0] / bl
    const by = b[1] / bl
    const px = -by
    const py = bx
    const c = pts[j]
    const half = w * (j === 0 ? 0.3 : 0.27)
    creases.push(
      "M" + f1(c[0] - px * half) + " " + f1(c[1] - py * half) +
      "Q" + f1(c[0] + bx * w * 0.12) + " " + f1(c[1] + by * w * 0.12) + " " + f1(c[0] + px * half) + " " + f1(c[1] + py * half),
    )
  }
  const dl = dirs[n - 1]
  const tip = pts[n]
  const nail = {
    x: tip[0] + dl[0] * w * 0.04,
    y: tip[1] + dl[1] * w * 0.04,
    a: (Math.atan2(dl[1], dl[0]) * 180) / Math.PI,
  }
  return { d: pspPoly(pts), highlights, hiAlpha, creases, nail }
}

const pspFingers = (spec: { base: Pt; lens: number[]; w: number; a: number[]; nail: boolean }[]): PspFinger[] =>
  spec.map((f) => ({ ...f, pts: pspFk(f.base, f.lens, f.a) }))

/**
 * The open hand: palm down, seen from above, index finger reaching, the
 * others curling under, the thumb hanging toward the viewer. Local space: the
 * wrist is at the origin, the fingers point along +x, the thumb side is +y.
 * `e` is the pose, 0 relaxed to 1 reaching: the index straightens and the
 * other fingers ease as the hand arrives.
 */
export const pspHandOpen = (e: number) => {
  const t = pspEaseOut(pspClamp(e, 0, 1))
  const palm: Pt[] = [
    [-290, -30], [-150, -33], [-30, -35], [30, -43], [90, -47], [122, -42], [132, -16], [130, 12],
    [126, 40], [116, 62], [100, 74], [70, 80], [40, 74], [18, 64], [0, 48], [-150, 44], [-290, 42],
  ]
  const fingers = pspFingers([
    { base: [112, 54], lens: [34, 24, 20], w: 24, a: pspMix([26, 54, 80], [16, 34, 54], t), nail: true },
    { base: [122, 28], lens: [44, 30, 24], w: 26, a: pspMix([22, 48, 72], [12, 26, 42], t), nail: true },
    { base: [126, 0], lens: [50, 32, 26], w: 27, a: pspMix([20, 42, 66], [8, 18, 30], t), nail: true },
    { base: [122, -28], lens: [56, 34, 28], w: 28, a: pspMix([14, 30, 46], [2, 8, 14], t), nail: true },
    { base: [46, 52], lens: [34, 28], w: 29, a: pspMix([70, 84], [42, 58], t), nail: true },
  ])
  const highlight = pspSmooth([[-260, -22], [-120, -25], [-20, -27], [40, -35], [92, -39], [116, -36]], false)
  return { palm: pspSmooth(palm, true, 0.9), fingers, highlight, tip: pspFingerTip(fingers[3]) }
}

/**
 * The pinching hand: the thumb rides over the index and closes on its tip,
 * the other fingers curl under. Same local space as the open hand; the stamp
 * mirrors it to come in from the right. `e` closes the pinch.
 */
export const pspHandPinch = (e: number) => {
  const t = pspEaseOut(pspClamp(e, 0, 1))
  const palm: Pt[] = [
    [-290, -26], [-150, -29], [-30, -31], [30, -39], [80, -44], [108, -34], [118, -6], [116, 22],
    [108, 46], [96, 66], [76, 80], [48, 82], [20, 72], [0, 48], [-150, 42], [-290, 40],
  ]
  const fingers = pspFingers([
    { base: [94, 60], lens: [28, 20, 16], w: 23, a: pspMix([24, 52, 86], [36, 86, 136], t), nail: false },
    { base: [104, 40], lens: [34, 24, 18], w: 25, a: pspMix([20, 46, 78], [30, 78, 128], t), nail: false },
    { base: [112, 18], lens: [38, 26, 20], w: 26, a: pspMix([16, 40, 70], [24, 70, 120], t), nail: false },
    { base: [114, -10], lens: [52, 34, 26], w: 27, a: pspMix([-4, -2, 0], [-4, -10, -22], t), nail: false },
    { base: [44, -30], lens: [86, 72], w: 30, a: pspMix([-34, -4], [-22, 12], t), nail: true },
  ])
  const thumbTip = pspFingerTip(fingers[4])
  const indexDip = fingers[3].pts[2]
  const indexTip = fingers[3].pts[3]
  const pinch: Pt = [(thumbTip[0] + (indexDip[0] + indexTip[0]) / 2) / 2, (thumbTip[1] + (indexDip[1] + indexTip[1]) / 2) / 2]
  const highlight = pspSmooth([[-260, -18], [-120, -21], [-20, -23], [40, -31], [90, -37]], false)
  return { palm: pspSmooth(palm, true, 0.9), fingers, highlight, pinch }
}

/** A postmark: two rings, type between them, and wavy cancellation bars. */
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
.psp-stage:focus-visible .psp-hud { text-decoration: underline; text-underline-offset: 0.3em; }
.psp-root[data-phase="load"] .psp-stage, .psp-root[data-phase="enter"] .psp-stage { cursor: pointer; }
.psp-root[data-loop="true"][data-phase="cancel"] .psp-stage { cursor: pointer; }
.psp-root[data-phase="exit"] .psp-stage { transition: opacity 0.55s ease-in 0.35s; opacity: 0; pointer-events: none; }
.psp-root[data-phase="done"] .psp-stage { display: none; }
.psp-scene { position: relative; perspective: 1500px; }
.psp-tilt { position: relative; transform-style: preserve-3d; will-change: transform; }
.psp-shadow { position: absolute; inset: 6% 2% -4% 2%; border-radius: 8px; background: rgba(10, 8, 20, 0.45); filter: blur(22px); transform: translate(14px, 26px); will-change: transform; z-index: -1; opacity: 0.55; }
.psp-dark-shadow .psp-shadow { background: rgba(0, 0, 0, 0.7); }
.psp-sheet { position: relative; width: 100%; overflow: hidden; -webkit-mask-size: 100% 100%; mask-size: 100% 100%; -webkit-mask-repeat: no-repeat; mask-repeat: no-repeat; }
.psp-stamp { display: block; width: 100%; height: auto; overflow: visible; }
.psp-grain { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; mix-blend-mode: multiply; }
.psp-sheen { position: absolute; top: -10%; bottom: -10%; left: 0; width: 34%; pointer-events: none; background: linear-gradient(100deg, rgba(255,255,255,0) 20%, rgba(255,255,255,0.75) 50%, rgba(255,255,255,0) 80%); }
.psp-root svg, .psp-root canvas, .psp-root img { max-width: none; }
.psp-postmark { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none; opacity: 0; transform-origin: 78% 22%; }

/* landing */
.psp-root[data-phase="enter"] .psp-tilt, .psp-root[data-phase="enter"] .psp-shadow { animation: psp-land 1s cubic-bezier(0.2, 0.9, 0.25, 1.05) both; }
.psp-root[data-phase="enter"] .psp-shadow { animation-name: psp-land-shadow; }
@keyframes psp-land { from { opacity: 0; transform: translate3d(0, -46px, 120px) rotateX(24deg) rotateZ(-4deg); } to { opacity: 1; transform: translate3d(0, 0, 0) rotateX(0) rotateZ(0); } }
@keyframes psp-land-shadow { from { opacity: 0; transform: translate(40px, 80px) scale(1.1); } to { opacity: 0.55; transform: translate(14px, 26px) scale(1); } }

/* the plates print one after the other while the sheet lands */
.psp-plate-band { animation: psp-wipe 0.7s cubic-bezier(0.6, 0, 0.2, 1) 0.45s both; }
.psp-plate-field { animation: psp-wipe 0.7s cubic-bezier(0.6, 0, 0.2, 1) 0.8s both; }
.psp-plate-gold { animation: psp-wipe 0.8s cubic-bezier(0.6, 0, 0.2, 1) 1.15s both; }
@keyframes psp-wipe { from { clip-path: inset(0 100% 0 0); } to { clip-path: inset(0 0 0 0); } }
.psp-ink { animation: psp-fade 0.6s ease-out 1.5s both; }
@keyframes psp-fade { from { opacity: 0; } to { opacity: 1; } }

/* the gold catches the light */
.psp-sheen { mix-blend-mode: soft-light; animation: psp-sheen 7s ease-in-out 1.6s infinite; transform: translateX(-120%) skewX(-18deg); }
@keyframes psp-sheen { 0% { transform: translateX(-120%) skewX(-18deg); } 55% { transform: translateX(330%) skewX(-18deg); } 100% { transform: translateX(330%) skewX(-18deg); } }

/* the touch */
.psp-spark { opacity: 0; transform-box: fill-box; transform-origin: center; }
.psp-root[data-phase="touch"] .psp-spark, .psp-root[data-phase="cancel"] .psp-spark { animation: psp-spark 1.4s cubic-bezier(0.2, 0.8, 0.2, 1) both; }
@keyframes psp-spark { 0% { opacity: 0; transform: scale(0.2) rotate(-30deg); } 25% { opacity: 1; transform: scale(1.25) rotate(10deg); } 60% { opacity: 0.9; transform: scale(0.95) rotate(30deg); } 100% { opacity: 0; transform: scale(1.4) rotate(60deg); } }
.psp-halo { opacity: 0; transform-box: fill-box; transform-origin: center; }
.psp-root[data-phase="touch"] .psp-halo, .psp-root[data-phase="cancel"] .psp-halo { animation: psp-halo 1.6s ease-out both; }
@keyframes psp-halo { 0% { opacity: 0; transform: scale(0.3); } 30% { opacity: 0.9; } 100% { opacity: 0; transform: scale(2.6); } }

/* the cancellation */
.psp-root[data-phase="cancel"] .psp-postmark, .psp-root[data-phase="exit"] .psp-postmark { animation: psp-slam 0.55s cubic-bezier(0.3, 1.6, 0.4, 1) both; }
@keyframes psp-slam { from { opacity: 0; transform: scale(1.7) rotate(-14deg); } 60% { opacity: 1; } to { opacity: 0.92; transform: scale(1) rotate(-12deg); } }
.psp-root[data-phase="cancel"] .psp-tilt { animation: psp-thump 0.5s cubic-bezier(0.3, 1.4, 0.4, 1) both; }
@keyframes psp-thump { 0% { transform: translate3d(0, 0, 0); } 30% { transform: translate3d(0, 4px, -30px); } 100% { transform: translate3d(0, 0, 0); } }

/* the lift */
.psp-root[data-phase="exit"] .psp-tilt { animation: psp-lift 0.9s cubic-bezier(0.5, 0, 0.8, 0.4) both; }
.psp-root[data-phase="exit"] .psp-shadow { animation: psp-lift-shadow 0.9s cubic-bezier(0.5, 0, 0.8, 0.4) both; }
.psp-root[data-phase="exit"] .psp-postmark { animation: psp-lift-mark 0.9s cubic-bezier(0.5, 0, 0.8, 0.4) both; }
@keyframes psp-lift { 0% { transform: translate3d(0, 0, 0) rotateX(0) rotateZ(0); opacity: 1; } 100% { transform: translate3d(6%, -140%, 300px) rotateX(38deg) rotateZ(-9deg); opacity: 0; } }
@keyframes psp-lift-shadow { 0% { opacity: 0.55; transform: translate(14px, 26px) scale(1); } 100% { opacity: 0; transform: translate(60px, 140px) scale(1.2); } }
@keyframes psp-lift-mark { 0% { opacity: 0.92; transform: scale(1) rotate(-12deg); } 100% { opacity: 0; transform: translate3d(6%, -140%, 300px) scale(1.1) rotate(-20deg); } }

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
  .psp-root[data-phase="cancel"] .psp-postmark, .psp-root[data-phase="exit"] .psp-postmark { animation: psp-fade 0.4s ease-out both; opacity: 0.92; transform: rotate(-12deg); }
  .psp-root[data-phase="exit"] .psp-tilt, .psp-root[data-phase="exit"] .psp-shadow, .psp-root[data-phase="exit"] .psp-postmark { animation: psp-fade 0.6s ease-in both reverse; }
  .psp-root[data-phase="touch"] .psp-halo, .psp-root[data-phase="cancel"] .psp-halo { animation: none; opacity: 0; }
}
`

const MONO_FALLBACK = 'ui-monospace, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace'
const SERIF_FALLBACK = '"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, "Times New Roman", serif'

const PERF = pspPerforation(W, H, 24)
const OPEN_FINAL = pspHandOpen(1)
const PINCH_FINAL = pspHandPinch(1)
const OPEN_TRANSFORM = "translate(" + TOUCH_X + " " + TOUCH_Y + ") rotate(10) scale(0.95) translate(" + f1(-OPEN_FINAL.tip[0]) + " " + f1(-OPEN_FINAL.tip[1]) + ")"
const PINCH_TRANSFORM = "translate(" + PINCH_X + " " + PINCH_Y + ") rotate(17) scale(-1 1) translate(" + f1(-PINCH_FINAL.pinch[0]) + " " + f1(-PINCH_FINAL.pinch[1]) + ")"
const POSTMARK_BARS = pspPostmark(92, 5)
const LEAVES = [
  { x: 342, y: 366, rot: -118, len: 74, wid: 26, path: pspLeaf(74, 26, 11, 3) },
  { x: 346, y: 370, rot: -158, len: 64, wid: 24, path: pspLeaf(64, 24, 9, 5) },
  { x: 340, y: 364, rot: -82, len: 58, wid: 22, path: pspLeaf(58, 22, 9, 8) },
  { x: 404, y: 300, rot: 44, len: 40, wid: 14, path: pspLeaf(40, 14, 7, 11) },
]
const CORNERS = [[31, 31, 0], [W - 31, 31, 90], [W - 31, H - 31, 180], [31, H - 31, 270]]
const STEM = "M" + HEAD_X + " " + (HEAD_Y + 26) + "C428 245 432 275 " + PINCH_X + " " + PINCH_Y + "S372 335 338 372"
const STEM_LEN = 230
const GUILLOCHE_A = pspGuilloche(W - 2 * 46, 9, 46, 0)
const GUILLOCHE_B = pspGuilloche(W - 2 * 46, 9, 46, Math.PI)
const GUILLOCHE_SA = pspGuilloche(H - 2 * 46, 9, 46, 0)
const GUILLOCHE_SB = pspGuilloche(H - 2 * 46, 9, 46, Math.PI)
const GUILLOCHE_LEN = 1400

const STAMENS = (() => {
  const rnd = pspRng(17)
  const out: { a: number; r: number; w: number }[] = []
  for (let i = 0; i < 26; i++) out.push({ a: (i / 26) * Math.PI * 2 + rnd() * 0.2, r: 12 + rnd() * 9, w: 1.6 + rnd() * 1.4 })
  return out
})()

export default function PeaceStampPreloader({
  children,
  loop = false,
  progress,
  durationMs = 5200,
  word = "МИР",
  leftText = "PAR AVION",
  rightText = "POSTAGE",
  year = "2026",
  value = 0.68,
  currency = "€",
  decimal = ",",
  postmark = "DELIVERED",
  preset = "magenta",
  palette,
  tilt = 7,
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

  // ---- size: the stamp fits the box, never taller than four fifths of it ----
  React.useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const fit = () => {
      const r = root.getBoundingClientRect()
      if (r.width <= 0 || r.height <= 0) return
      const w = Math.min(r.width * 0.9, 760, ((r.height * 0.78) * W) / H)
      setStampW(Math.max(220, Math.round(w)))
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(root)
    return () => ro.disconnect()
  }, [])

  // ---- reduced motion ------------------------------------------------------
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

  // ---- the frame loop: load, morph, reach, tilt --------------------------------
  React.useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const q = (sel: string) => stage.querySelector(sel) as SVGElement | HTMLElement | null
    const el = {
      tilt: q(".psp-tilt") as HTMLElement | null,
      shadow: q(".psp-shadow") as HTMLElement | null,
      handL: q(".psp-hand-o"),
      handR: q(".psp-hand-p"),
      stem: q(".psp-stem"),
      stemLine: q(".psp-stem-line"),
      petals: Array.from(stage.querySelectorAll(".psp-petal")) as SVGElement[],
      veins: Array.from(stage.querySelectorAll(".psp-veins")) as SVGElement[],
      heart: q(".psp-heart"),
      leaves: Array.from(stage.querySelectorAll(".psp-leaf")) as SVGElement[],
      guill: Array.from(stage.querySelectorAll(".psp-guilloche")) as SVGElement[],
      arcs: Array.from(stage.querySelectorAll(".psp-arc-word")) as SVGElement[],
      ring: q(".psp-ring-type"),
      sides: Array.from(stage.querySelectorAll(".psp-side")) as SVGElement[],
      corners: Array.from(stage.querySelectorAll(".psp-corner")) as SVGElement[],
      denom: q(".psp-denom"),
      counter: q(".psp-counter"),
      light: q(".psp-light"),
      flowerLayer: q(".psp-flower-layer") as SVGElement | null,
      handLayer: q(".psp-hand-layer") as SVGElement | null,
    }

    shownRef.current = 0
    rushRef.current = false
    pctRef.current = -1
    startRef.current = performance.now()
    phaseAtRef.current = performance.now()
    let last = performance.now()
    let raf = 0
    let lastPetalK = -1
    const lastPose = { o: -1, p: -1 }
    const fingerEls = (h: string) =>
      Array.from(stage.querySelectorAll(".psp-hand-" + h + " .psp-finger")).map((g) => ({
        geo: stage.querySelector("#" + id("f" + h + (g as HTMLElement).dataset.i)) as SVGElement | null,
        hi: Array.from(g.querySelectorAll(".psp-f-hi path")) as SVGElement[],
        creases: Array.from(g.querySelectorAll(".psp-f-crease path")) as SVGElement[],
        nail: g.querySelector(".psp-f-nail") as SVGElement | null,
      }))
    const fingers = { o: fingerEls("o"), p: fingerEls("p") }
    const pose = (h: "o" | "p", e: number) => {
      if (Math.abs(e - lastPose[h]) < 0.002) return
      lastPose[h] = e
      const hand = h === "o" ? pspHandOpen(e) : pspHandPinch(e)
      hand.fingers.forEach((f, i) => {
        const els = fingers[h][i]
        if (!els) return
        const m = pspFingerMarks(f)
        els.geo?.setAttribute("d", m.d)
        els.hi.forEach((pth, j) => {
          pth.setAttribute("d", m.highlights[j] || "M0 0")
          pth.style.opacity = String(0.6 * (m.hiAlpha[j] || 0))
        })
        els.creases.forEach((pth, j) => pth.setAttribute("d", m.creases[j] || "M0 0"))
        els.nail?.setAttribute("transform", "translate(" + f1(m.nail.x) + " " + f1(m.nail.y) + ") rotate(" + f1(m.nail.a) + ")")
      })
    }

    const paint = (p: number, now: number) => {
      const reduced = reducedRef.current
      // guilloche draws over the first half
      const g = pspSmoothstep(0.02, 0.55, p)
      for (const path of el.guill) path.style.strokeDashoffset = String(GUILLOCHE_LEN * (1 - g))
      // the side lines and the corner tabs come in
      const s = pspSmoothstep(0.1, 0.4, p)
      for (const side of el.sides) side.style.opacity = String(s)
      for (const c of el.corners) c.style.opacity = String(pspSmoothstep(0.3, 0.5, p))
      // the big arcs slide out from behind the disc
      const a = pspEaseBack(pspSmoothstep(0.25, 0.6, p))
      el.arcs.forEach((arc, i) => {
        const dir = i === 0 ? -1 : 1
        arc.style.opacity = String(pspSmoothstep(0.25, 0.4, p))
        arc.style.transform = reduced ? "" : "translateX(" + dir * 120 * (1 - a) + "px)"
      })
      if (el.ring) el.ring.style.opacity = String(pspSmoothstep(0.18, 0.4, p))
      // stem, leaves, bud, bloom
      const st = pspSmoothstep(0.22, 0.52, p)
      if (el.stem) el.stem.style.strokeDashoffset = String(STEM_LEN * (1 - st))
      if (el.stemLine) el.stemLine.style.strokeDashoffset = String(STEM_LEN * (1 - st))
      el.leaves.forEach((leaf, i) => {
        const u = pspEaseBack(pspSmoothstep(0.42 + i * 0.05, 0.62 + i * 0.05, p))
        const L = LEAVES[i]
        leaf.setAttribute("transform", "translate(" + L.x + " " + L.y + ") rotate(" + L.rot + ") scale(" + f1(u) + ")")
      })
      const bud = pspSmoothstep(0.34, 0.46, p)
      const k = pspSmoothstep(0.5, 0.96, p)
      if (Math.abs(k - lastPetalK) > 0.002 || bud < 1) {
        lastPetalK = k
        const petals = pspFlower(k)
        petals.forEach((pt, i) => {
          const e = el.petals[i]
          if (!e) return
          e.setAttribute("d", pt.d)
          e.setAttribute("transform", "rotate(" + f1(pt.angle) + ") scale(" + f1(pt.scale * pspLerp(0.1, 1, pspEaseBack(bud))) + ")")
          const v = el.veins[i]
          if (v) {
            v.setAttribute("transform", "rotate(" + f1(pt.angle) + ") scale(" + f1(pt.scale * pspLerp(0.1, 1, pspEaseBack(bud))) + ")")
            v.style.opacity = String(pspSmoothstep(0.55, 0.9, k) * 0.9)
            Array.from(v.children).forEach((c, j) => c.setAttribute("d", pt.veins[j]))
          }
        })
      }
      if (el.heart) el.heart.setAttribute("transform", "scale(" + f1(pspLerp(0.2, 1, pspEaseBack(pspSmoothstep(0.7, 1, p)))) + ")")
      // the hands reach in
      const hl = pspEaseBack(pspSmoothstep(0.3, 0.86, p))
      const hr = pspEaseBack(pspSmoothstep(0.42, 0.98, p))
      const drift = reduced ? 0 : 4 * Math.sin(now / 900)
      if (el.handL) {
        el.handL.style.opacity = reduced ? String(pspSmoothstep(0.3, 0.5, p)) : "1"
        el.handL.style.transform = "translate(" + (reduced ? 0 : -SLIDE * (1 - hl) + drift) + "px, " + (reduced ? 0 : -drift * 0.4) + "px)"
      }
      if (el.handR) {
        el.handR.style.opacity = reduced ? String(pspSmoothstep(0.42, 0.62, p)) : "1"
        el.handR.style.transform = "translate(" + (reduced ? 0 : SLIDE * (1 - hr) - drift) + "px, " + (reduced ? 0 : drift * 0.5) + "px)"
      }
      // the fingers settle into their pose as each hand arrives
      pose("o", pspSmoothstep(0.5, 0.95, p))
      pose("p", pspSmoothstep(0.6, 1, p))
      if (el.light) el.light.style.opacity = String(0.4 + 0.6 * pspSmoothstep(0.6, 1, p))
      // the ring counts up to the face value
      const m = moneyRef.current
      if (el.denom) el.denom.textContent = pspMoney(m.value, m.currency, m.decimal, p)
      const pc = Math.round(p * 100)
      if (pc !== pctRef.current) {
        pctRef.current = pc
        if (el.counter) el.counter.textContent = String(pc).padStart(3, "0")
        setPct(pc)
      }
    }

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const ph = phaseRef.current
      const since = now - phaseAtRef.current
      const reduced = reducedRef.current

      // target progress
      let target: number
      if (progressRef.current !== undefined && progressRef.current !== null) {
        target = pspClamp(progressRef.current / 100, 0, 1)
      } else {
        const t = (now - startRef.current - 700) / Math.max(400, durationRef.current)
        target = pspSimulated(t)
      }
      if (rushRef.current) target = 1
      const shown = shownRef.current
      const gain = rushRef.current ? 7 : 3.2
      let next = shown + (target - shown) * Math.min(1, gain * dt)
      if (target - next < 0.0015) next = target
      if (next < shown) next = shown
      shownRef.current = next
      if (ph === "enter" || ph === "load") paint(next, now)

      // tilt toward the pointer, on a spring
      const sp = springRef.current
      const ptr = pointerRef.current
      const maxTilt = reduced ? 0 : tiltRef.current
      const trx = ptr.on ? -ptr.y * maxTilt : 0
      const trY = ptr.on ? ptr.x * maxTilt : 0
      const kS = 60
      const kD = 9
      sp.vx += (kS * (trx - sp.rx) - kD * sp.vx) * dt
      sp.vy += (kS * (trY - sp.ry) - kD * sp.vy) * dt
      sp.rx += sp.vx * dt
      sp.ry += sp.vy * dt
      const idle = reduced ? 0 : 1
      const bobY = idle * 3 * Math.sin(now / 1400)
      const bobR = idle * 0.6 * Math.sin(now / 2100)
      if ((ph === "load" || ph === "touch") && el.tilt) {
        el.tilt.style.transform =
          "translate3d(0," + f1(bobY) + "px,0) rotateX(" + f1(sp.rx + bobR) + "deg) rotateY(" + f1(sp.ry) + "deg)"
        if (el.shadow) {
          el.shadow.style.transform = "translate(" + f1(14 - sp.ry * 1.6) + "px, " + f1(26 + sp.rx * 1.6 - bobY) + "px)"
        }
        if (el.handLayer) el.handLayer.style.transform = "translate(" + f1(sp.ry * 1.1) + "px, " + f1(-sp.rx * 1.1) + "px)"
        if (el.flowerLayer) el.flowerLayer.style.transform = "translate(" + f1(sp.ry * 0.6) + "px, " + f1(-sp.rx * 0.6) + "px)"
      }

      // phases
      if (ph === "enter" && since > 1000) go("load")
      else if (ph === "load" && next >= 1 && target >= 1) go("touch")
      else if (ph === "touch" && since > 1100) go("cancel")
      else if (ph === "cancel" && since > (loopRef.current ? 2600 : 1300)) go("exit")
      else if (ph === "exit" && since > 1000) {
        if (loopRef.current) {
          setCycle((c) => c + 1)
        } else {
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

  // ---- input -----------------------------------------------------------------
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

  // the perforated edge, as a CSS mask on the sheet so the hands, the grain
  // and the sheen all clip against it without a filter in the animated tree
  const perfMask = React.useMemo(() => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + " " + H + '"><path fill-rule="evenodd" d="' + pspPerforationPath(W, H, PERF, 8.5) + '"/></svg>'
    return "url(\"data:image/svg+xml;utf8," + encodeURIComponent(svg) + "\")"
  }, [])

  const renderHand = (h: string, hand: { palm: string; fingers: PspFinger[]; highlight: string }, transform: string, from: number) => (
    <g className={"psp-hand psp-hand-" + h} data-hand={h} style={{ transform: "translate(" + from + "px, 0)" }}>
      <g transform={transform}>
        <defs>
          {hand.fingers.map((f, i) => (
            <path key={i} id={id("f" + h + i)} className="psp-fgeo" data-i={i} d={pspFingerMarks(f).d} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          ))}
          <mask id={id("union-" + h)} maskUnits="userSpaceOnUse" x="-320" y="-150" width="640" height="340">
            <path d={hand.palm} fill="#fff" />
            {hand.fingers.map((f, i) => (
              <use key={i} href={"#" + id("f" + h + i)} stroke="#fff" strokeWidth={f.w} />
            ))}
          </mask>
          <mask id={id("hatchmask-" + h)} maskUnits="userSpaceOnUse" x="-320" y="-150" width="640" height="340">
            <path d={hand.palm} fill={url("hatchfade")} />
            {hand.fingers.map((f, i) => (
              <use key={i} href={"#" + id("f" + h + i)} stroke={url("hatchfade")} strokeWidth={f.w} />
            ))}
          </mask>
        </defs>
        <path d={hand.palm} fill={url("skin")} stroke={C.skinDark} strokeWidth="1.8" strokeLinejoin="round" />
        <path d={hand.highlight} fill="none" stroke={C.skinLight} strokeWidth="4" strokeLinecap="round" opacity="0.5" />
        {hand.fingers.map((f, i) => {
          const m = pspFingerMarks(f)
          return (
            <g key={i} className="psp-finger" data-i={i}>
              <g mask={url("union-" + h)}>
                <use href={"#" + id("f" + h + i)} stroke={C.skinDark} strokeWidth={f.w + 8} opacity="0.22" transform="translate(2 7)" />
              </g>
              <use href={"#" + id("f" + h + i)} stroke={C.skinDark} strokeWidth={f.w + 3.6} />
              <use href={"#" + id("f" + h + i)} stroke={url("skin")} strokeWidth={f.w} />
              <g className="psp-f-hi" fill="none" stroke={C.skinLight} strokeWidth="2.6" strokeLinecap="round">
                {m.highlights.map((d, j) => (
                  <path key={j} d={d} style={{ opacity: 0.6 * m.hiAlpha[j] }} />
                ))}
              </g>
              <g className="psp-f-crease" fill="none" stroke={C.skinDark} strokeWidth="1.2" strokeLinecap="round" opacity="0.8">
                {m.creases.map((d, j) => (
                  <path key={j} d={d} />
                ))}
              </g>
              {f.nail && (
                <ellipse
                  className="psp-f-nail"
                  rx={f.w * 0.2}
                  ry={f.w * 0.27}
                  transform={"translate(" + f1(m.nail.x) + " " + f1(m.nail.y) + ") rotate(" + f1(m.nail.a) + ")"}
                  fill={C.skinLight}
                  fillOpacity="0.35"
                  stroke={C.skinDark}
                  strokeWidth="0.9"
                />
              )}
            </g>
          )
        })}
        <rect x="-320" y="-150" width="640" height="340" fill={url("hatch")} mask={url("hatchmask-" + h)} opacity="0.7" />
        <rect x="-320" y="-150" width="640" height="340" fill={url("crosshatch")} mask={url("hatchmask-" + h)} opacity="0.3" />
      </g>
    </g>
  )

  const ink = C.ink
  const perfR = 8.5
  const stageStyle: React.CSSProperties = C.stage ? { background: C.stage } : {}
  const live = phase !== "done"
  const statusText =
    phase === "enter" || phase === "load" ? label : phase === "touch" ? "Received" : phase === "cancel" ? "Cancelled" : "Opening"

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
          style={{ ...stageStyle, fontFamily: monoFamily }}
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
                <svg
                  className="psp-stamp"
                  viewBox={"0 0 " + W + " " + H}
                  width={W}
                  height={H}
                  aria-hidden="true"
                  style={{ fontFamily: serifFamily }}
                >
                  <defs>
                    <clipPath id={id("disc")}>
                      <circle cx={CX} cy={CY} r="125" />
                    </clipPath>
                    <radialGradient id={id("light")} cx={TOUCH_X + 30} cy={TOUCH_Y + 10} r="150" gradientUnits="userSpaceOnUse">
                      <stop offset="0" stopColor={C.disc} />
                      <stop offset="0.45" stopColor={C.disc} stopOpacity="0.85" />
                      <stop offset="1" stopColor={C.mint} stopOpacity="0" />
                    </radialGradient>
                    <radialGradient id={id("vignette")} cx={CX} cy={CY} r="125" gradientUnits="userSpaceOnUse">
                      <stop offset="0.7" stopColor={C.band} stopOpacity="0" />
                      <stop offset="1" stopColor={C.band} stopOpacity="0.45" />
                    </radialGradient>
                    <linearGradient id={id("skin")} x1="0" y1="-70" x2="0" y2="150" gradientUnits="userSpaceOnUse">
                      <stop offset="0" stopColor={C.skinLight} />
                      <stop offset="0.32" stopColor={C.skin} />
                      <stop offset="1" stopColor={C.skinDark} />
                    </linearGradient>
                    <linearGradient id={id("hatchfade")} x1="0" y1="-70" x2="0" y2="150" gradientUnits="userSpaceOnUse">
                      <stop offset="0" stopColor="#000" />
                      <stop offset="0.3" stopColor="#000" />
                      <stop offset="1" stopColor="#fff" />
                    </linearGradient>
                    <pattern id={id("hatch")} patternUnits="userSpaceOnUse" width="4.2" height="4.2" patternTransform="rotate(-28)">
                      <rect x="0" y="0" width="4.2" height="1.1" fill={C.skinDark} />
                    </pattern>
                    <pattern id={id("crosshatch")} patternUnits="userSpaceOnUse" width="4.2" height="4.2" patternTransform="rotate(38)">
                      <rect x="0" y="0" width="4.2" height="0.9" fill={C.skinDark} />
                    </pattern>
                    <radialGradient id={id("petal")} cx="0" cy="-20" r="56" gradientUnits="userSpaceOnUse">
                      <stop offset="0" stopColor={C.petalDark} />
                      <stop offset="0.35" stopColor={C.petal} />
                      <stop offset="0.85" stopColor={C.petal} />
                      <stop offset="1" stopColor={C.petalDark} stopOpacity="0.9" />
                    </radialGradient>
                    <path id={id("arc-top")} d={pspArc(CX, CY, 149, 200, 340)} />
                    <path id={id("arc-bottom")} d={pspArc(CX, CY, 173, 160, 20)} />
                    <path id={id("arc-left")} d={pspArc(CX, CY, 216, 232, 128)} />
                    <path id={id("arc-right")} d={pspArc(CX, CY, 216, -52, 52)} />
                  </defs>

                  {/* paper */}
                  <rect x="0" y="0" width={W} height={H} fill={C.paper} />

                  {/* the teal plate */}
                  <g className="psp-plate-band">
                    <rect x="14" y="14" width={W - 28} height={H - 28} fill={C.band} />
                    <rect x="31" y="31" width={W - 62} height={H - 62} fill={C.paper} />
                    <circle cx={CX} cy={CY} r="190" fill={C.band} />
                    {CORNERS.map(([x, y, r], i) => (
                      <path key={i} d="M0 0L64 0L0 64Z" fill={C.band} transform={"translate(" + x + " " + y + ") rotate(" + r + ")"} />
                    ))}
                  </g>

                  {/* the magenta plate */}
                  <g className="psp-plate-field">
                    <rect x="31" y="31" width={W - 62} height={H - 62} fill={C.field} />
                    <circle cx={CX} cy={CY} r="190" fill={C.band} />
                    {CORNERS.map(([x, y, r], i) => (
                      <g key={i} transform={"translate(" + x + " " + y + ") rotate(" + r + ")"}>
                        <path d="M0 0L64 0L0 64Z" fill={C.band} />
                        <path d="M8 8L46 8L8 46Z" fill={C.field} />
                        <circle cx="19" cy="19" r="4" fill={C.gold} className="psp-corner" style={{ opacity: 0 }} />
                      </g>
                    ))}
                    {/* the big arcs of the word, behind the ring */}
                    <g fill={C.mint} stroke={C.band} strokeWidth="1.2" paintOrder="stroke" fontSize="58" fontWeight="700" letterSpacing="6">
                      <text className="psp-arc-word" style={{ opacity: 0 }}>
                        <textPath href={"#" + id("arc-left")} startOffset="50%" textAnchor="middle">
                          {word}
                        </textPath>
                      </text>
                      <text className="psp-arc-word" style={{ opacity: 0 }}>
                        <textPath href={"#" + id("arc-right")} startOffset="50%" textAnchor="middle">
                          {word}
                        </textPath>
                      </text>
                    </g>
                    <circle cx={CX} cy={CY} r="176" fill={C.field} />
                    <circle cx={CX} cy={CY} r="125" fill={C.mint} />
                  </g>

                  {/* gold hairlines, dots and the guilloche */}
                  <g className="psp-plate-gold" fill="none" stroke={C.gold}>
                    <rect x="22" y="22" width={W - 44} height={H - 44} strokeWidth="1.4" strokeDasharray="2 4" />
                    <rect x="31" y="31" width={W - 62} height={H - 62} strokeWidth="1.6" />
                    <rect x="72" y="72" width={W - 144} height={H - 144} strokeWidth="1.2" />
                    <circle cx={CX} cy={CY} r="183" strokeWidth="1.4" strokeDasharray="1.5 5" />
                    <circle cx={CX} cy={CY} r="176" strokeWidth="1.2" />
                    <circle cx={CX} cy={CY} r="128" strokeWidth="2" />
                    <circle cx={CX} cy={CY} r="122" strokeWidth="0.8" opacity="0.7" />
                    <g strokeWidth="1.3" strokeDasharray={GUILLOCHE_LEN} opacity="0.95">
                      <g transform="translate(46 52)">
                        <path className="psp-guilloche" d={GUILLOCHE_A} stroke={C.band} strokeWidth="2.6" />
                        <path className="psp-guilloche" d={GUILLOCHE_B} />
                      </g>
                      <g transform={"translate(46 " + (H - 52) + ")"}>
                        <path className="psp-guilloche" d={GUILLOCHE_A} stroke={C.band} strokeWidth="2.6" />
                        <path className="psp-guilloche" d={GUILLOCHE_B} />
                      </g>
                      <g transform="translate(52 46) rotate(90)">
                        <path className="psp-guilloche" d={GUILLOCHE_SA} stroke={C.band} strokeWidth="2.6" />
                        <path className="psp-guilloche" d={GUILLOCHE_SB} />
                      </g>
                      <g transform={"translate(" + (W - 52) + " 46) rotate(90)"}>
                        <path className="psp-guilloche" d={GUILLOCHE_SA} stroke={C.band} strokeWidth="2.6" />
                        <path className="psp-guilloche" d={GUILLOCHE_SB} />
                      </g>
                    </g>
                    <g fill={C.gold} stroke="none">
                      {pspDots(W - 2 * 72, 18).map((x, i) => (
                        <React.Fragment key={i}>
                          <circle cx={72 + x} cy="66" r="1.4" />
                          <circle cx={72 + x} cy={H - 66} r="1.4" />
                        </React.Fragment>
                      ))}
                      {pspDots(H - 2 * 72, 18).map((y, i) => (
                        <React.Fragment key={i}>
                          <circle cx="66" cy={72 + y} r="1.4" />
                          <circle cx={W - 66} cy={72 + y} r="1.4" />
                        </React.Fragment>
                      ))}
                    </g>
                  </g>

                  {/* side lines, corner years */}
                  <g className="psp-ink" fontWeight="700" letterSpacing="5">
                    <text className="psp-side" fontSize="30" fill={C.mint} stroke={C.gold} strokeWidth="0.7" paintOrder="stroke" textAnchor="middle" transform={"translate(60 " + CY + ") rotate(-90)"} style={{ opacity: 0 }}>
                      {leftText}
                    </text>
                    <text className="psp-side" fontSize="30" fill={C.mint} stroke={C.gold} strokeWidth="0.7" paintOrder="stroke" textAnchor="middle" transform={"translate(" + (W - 60) + " " + CY + ") rotate(90)"} style={{ opacity: 0 }}>
                      {rightText}
                    </text>
                    <g fontSize="11" fill={C.paper} letterSpacing="1.5" fontWeight="600">
                      {[[62, 50], [W - 62, 50], [W - 62, H - 46], [62, H - 46]].map(([x, y], i) => (
                        <text key={i} className="psp-side" x={x} y={y} textAnchor="middle" style={{ opacity: 0 }}>
                          {year}
                        </text>
                      ))}
                    </g>
                  </g>

                  {/* the ring type */}
                  <g className="psp-ring-type" fill={C.mint} stroke={C.gold} strokeWidth="0.6" paintOrder="stroke" style={{ opacity: 0 }}>
                    <text fontSize="30" fontWeight="700" letterSpacing="10">
                      <textPath href={"#" + id("arc-top")} startOffset="50%" textAnchor="middle">
                        {word.split("").join(" · ")}
                      </textPath>
                    </text>
                    <text fontSize="28" fontWeight="700" letterSpacing="4">
                      <textPath href={"#" + id("arc-bottom")} startOffset="50%" textAnchor="middle">
                        <tspan className="psp-denom">{pspMoney(value, currency, decimal, 0)}</tspan>
                      </textPath>
                    </text>
                    {[0, 180].map((a) => (
                      <g key={a} transform={"translate(" + CX + " " + CY + ") rotate(" + a + ") translate(150 0)"} fill={C.gold} stroke="none">
                        <circle r="2.4" />
                        {[0, 90, 180, 270].map((b) => (
                          <ellipse key={b} rx="2.2" ry="4.6" transform={"rotate(" + b + ") translate(0 -6)"} />
                        ))}
                      </g>
                    ))}
                    {[45, 135, 225, 315].map((a) => (
                      <circle key={a} cx={CX + 160 * Math.cos((a * Math.PI) / 180)} cy={CY + 160 * Math.sin((a * Math.PI) / 180)} r="1.8" fill={C.gold} stroke="none" />
                    ))}
                  </g>

                  {/* the light in the disc, and its edge */}
                  <g className="psp-plate-field">
                    <g clipPath={url("disc")}>
                      <circle className="psp-light" cx={CX} cy={CY} r="125" fill={url("light")} style={{ opacity: 0.4 }} />
                      <circle cx={CX} cy={CY} r="125" fill={url("vignette")} />
                    </g>
                  </g>

                  {/* the flower */}
                  <g className="psp-flower-layer">
                    <path className="psp-stem" d={STEM} fill="none" stroke={C.leaf} strokeWidth="5" strokeLinecap="round" strokeDasharray={STEM_LEN} style={{ strokeDashoffset: STEM_LEN }} />
                    <path className="psp-stem-line" d={STEM} fill="none" stroke={C.petalDark} strokeWidth="1" strokeLinecap="round" strokeDasharray={STEM_LEN} opacity="0.7" style={{ strokeDashoffset: STEM_LEN }} />
                    {LEAVES.map((L, i) => (
                      <g key={i} className="psp-leaf" transform={"translate(" + L.x + " " + L.y + ") rotate(" + L.rot + ") scale(0)"}>
                        <path d={L.path} fill={C.leaf} stroke={C.petalDark} strokeWidth="0.8" strokeLinejoin="round" />
                        <path d={"M0 -2L0 " + -(L.len - 6)} stroke={C.petalDark} strokeWidth="0.8" fill="none" opacity="0.8" />
                        {[0.3, 0.5, 0.7].map((u) => (
                          <path key={u} d={"M0 " + -(L.len * u) + "Q" + L.wid * 0.2 + " " + -(L.len * u + 6) + " " + L.wid * 0.36 + " " + -(L.len * u + 12)} stroke={C.petalDark} strokeWidth="0.6" fill="none" opacity="0.6" />
                        ))}
                      </g>
                    ))}
                    <g transform={"translate(" + HEAD_X + " " + HEAD_Y + ")"}>
                      {[0, 1, 2, 3, 4].map((i) => (
                        <path key={i} className="psp-petal" d={pspPetal(0)} transform="scale(0)" fill={url("petal")} stroke={C.petalDark} strokeWidth="0.9" strokeLinejoin="round" />
                      ))}
                      {[0, 1, 2, 3, 4].map((i) => (
                        <g key={i} className="psp-veins" fill="none" stroke={C.petalDark} strokeWidth="0.7" style={{ opacity: 0 }}>
                          <path d="" />
                          <path d="" />
                          <path d="" />
                        </g>
                      ))}
                      <g className="psp-heart" transform="scale(0.2)">
                        {STAMENS.map((s, i) => (
                          <g key={i} transform={"rotate(" + f1((s.a * 180) / Math.PI) + ")"}>
                            <line x1="0" y1="0" x2={s.r} y2="0" stroke={C.petalDark} strokeWidth="0.9" />
                            <circle cx={s.r} cy="0" r={s.w} fill={C.petalDark} />
                            <circle cx={s.r - 0.6} cy="-0.6" r={s.w * 0.45} fill={C.petal} />
                          </g>
                        ))}
                        <circle r="7" fill={C.leaf} stroke={C.petalDark} strokeWidth="0.8" />
                        <circle r="3" fill={C.petal} />
                      </g>
                    </g>
                  </g>

                  {/* the hands */}
                  <g className="psp-hand-layer">
                    {renderHand("o", OPEN_FINAL, OPEN_TRANSFORM, -SLIDE)}
                    {renderHand("p", PINCH_FINAL, PINCH_TRANSFORM, SLIDE)}
                  </g>

                  {/* the touch */}
                  <g transform={"translate(" + (TOUCH_X + 14) + " " + (TOUCH_Y + 2) + ")"}>
                    <circle className="psp-halo" r="26" fill={C.disc} opacity="0" />
                    <g className="psp-spark" fill={C.gold} stroke={C.paper} strokeWidth="0.6">
                      <path d="M0 -22C2 -8 8 -2 22 0C8 2 2 8 0 22C-2 8 -8 2 -22 0C-8 -2 -2 -8 0 -22Z" />
                      <path d="M0 -10C1 -4 4 -1 10 0C4 1 1 4 0 10C-1 4 -4 1 -10 0C-4 -1 -1 -4 0 -10Z" transform="rotate(45)" fill="#fff8e0" />
                    </g>
                  </g>
                </svg>

                {/* paper grain, painted once, and the light passing over the gold */}
                <svg className="psp-grain" viewBox={"0 0 " + W + " " + H} width={W} height={H} aria-hidden="true" preserveAspectRatio="none">
                  <filter id={id("grain")} x="0" y="0" width="100%" height="100%">
                    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" stitchTiles="stitch" result="n" />
                    <feColorMatrix type="saturate" values="0" in="n" result="g" />
                    <feComponentTransfer in="g">
                      <feFuncA type="table" tableValues="0 0.22" />
                    </feComponentTransfer>
                  </filter>
                  <rect x="0" y="0" width={W} height={H} filter={url("grain")} />
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
                <g transform={"translate(" + W * 0.78 + " " + H * 0.22 + ")"} filter={url("rough")} fill="none" stroke={ink} opacity="0.88">
                  <circle r="92" strokeWidth="5" />
                  <circle r="66" strokeWidth="3" />
                  <g strokeWidth="4" strokeLinecap="round">
                    {POSTMARK_BARS.map((d, i) => (
                      <path key={i} d={d} />
                    ))}
                  </g>
                  {postmark ? (
                    <text fill={ink} stroke="none" fontSize="17" fontWeight="700" letterSpacing="4">
                      <textPath href={"#" + id("arc-mark")} startOffset="50%" textAnchor="middle">
                        {postmark + " · " + year}
                      </textPath>
                    </text>
                  ) : null}
                  <text fill={ink} stroke="none" fontSize="22" fontWeight="700" letterSpacing="3" textAnchor="middle" y="8">
                    {pspMoney(value, currency, decimal, 1)}
                  </text>
                  <text fill={ink} stroke="none" fontSize="10" letterSpacing="4" textAnchor="middle" y="28">
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
