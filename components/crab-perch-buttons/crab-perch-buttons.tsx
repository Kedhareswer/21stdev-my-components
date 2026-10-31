"use client"

// Crab Perch Buttons: a little red crab sits on the edge of each button.
//
//   rest   it breathes, blinks, and now and then taps a claw on the rim.
//   hover  it scuttles along the edge to your pointer, leans into the walk,
//          lifts the claw on your side and snips at you. Its eyes follow you.
//   press  it ducks flat, squints, and three shock lines pop over its head.
//   click  it lets out a few bubbles.
//
// Five pieces share one hand-drawn crab:
//
//   CrabButton    solid · outline · ghost · icon, with an optional leading
//                 icon. The ghost crab stands beside the label and waves; the
//                 icon crab hugs the side of the circle.
//   CrabToggle    a switch. The crab hops over the knob every time it flips.
//   CrabDropdown  a select. The crab peers down into the open list.
//   CrabMascot    the crab on its own, for wherever else you want one.
//
// One file, React only. The crab is drawn as SVG at module load (no images, no
// fonts, no network), split into two layers so its body sits behind the
// button's top edge while its legs and claws hang over the front.

import * as React from "react"

function ArrowGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 12h15.5M13.5 5.5 20 12l-6.5 6.5" />
    </svg>
  )
}

function ChevronGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 9.5l6 6 6-6" />
    </svg>
  )
}

// #region crab
// Geometry and colour helpers. Pure functions, executed by the test.

export const CPB_W = 240
export const CPB_H = 150
/** Where the button's top edge crosses the crab's drawing. */
export const CPB_EDGE = 104

export const CPB_CRABS = {
  red: "#cc3c18",
  blue: "#3a76c4",
  gold: "#d99a2b",
  pearl: "#e4d3bd",
  violet: "#8550c8",
  mint: "#38a77f",
}

export const CPB_TONES = {
  moss: "#566341",
  ink: "#26292f",
  clay: "#a3532f",
  sea: "#2c5b6c",
  plum: "#5a3a57",
  sand: "#ebe7e0",
}

export const CPB_SIZES = { sm: 44, md: 56, lg: 68 }

export function cpbClamp(v: number, lo: number, hi: number) {
  return v < lo ? lo : v > hi ? hi : v
}

/** "#abc" / "#aabbcc" → [r, g, b]. Anything unreadable is mid grey. */
export function cpbRgb(hex: string): [number, number, number] {
  let h = String(hex || "").trim().replace(/^#/, "")
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return [128, 128, 128]
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

export function cpbHex(rgb: number[]) {
  return "#" + rgb.map((c) => cpbClamp(Math.round(c), 0, 255).toString(16).padStart(2, "0")).join("")
}

/** Blend a toward b by t (0 = a, 1 = b). */
export function cpbMix(a: string, b: string, t: number) {
  const p = cpbRgb(a)
  const q = cpbRgb(b)
  return cpbHex(p.map((c, i) => c + (q[i] - c) * t))
}

/** amt > 0 lightens toward white, amt < 0 darkens toward black. */
export function cpbShade(hex: string, amt: number) {
  return amt >= 0 ? cpbMix(hex, "#ffffff", amt) : cpbMix(hex, "#000000", -amt)
}

/** Relative luminance, 0–1. */
export function cpbLuma(hex: string) {
  const lin = cpbRgb(hex).map((c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]
}

/** A preset name or any hex. */
export function cpbPick(table: { [k: string]: string }, v: string | undefined, fallback: string) {
  if (v && Object.prototype.hasOwnProperty.call(table, v)) return table[v]
  if (v && /^#?[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(v)) return v[0] === "#" ? v : "#" + v
  return table[fallback]
}

/** Every shade the crab is painted in, from one shell colour. */
export function cpbCrabTones(shell: string) {
  const pale = cpbLuma(shell) > 0.45
  return {
    hi: cpbShade(shell, 0.34),
    light: cpbShade(shell, 0.13),
    base: shell,
    dark: cpbShade(shell, pale ? -0.3 : -0.3),
    deep: cpbShade(shell, pale ? -0.55 : -0.6),
    nail: cpbShade(shell, pale ? -0.62 : -0.74),
    face: cpbMix(shell, pale ? "#fff7ec" : "#f1cda4", 0.78),
    faceEdge: cpbMix(shell, "#c47a4a", 0.5),
    plate: cpbMix(shell, pale ? "#fffaf2" : "#f3d3ad", 0.86),
    plateDark: cpbMix(shell, "#c99062", 0.74),
    crease: cpbMix(shell, "#6e3219", 0.6),
    cream: cpbMix(shell, pale ? "#fffaf3" : "#fbe3c8", 0.8),
    gran: cpbMix(shell, pale ? "#ffffff" : "#ffbf80", 0.38),
    pit: cpbShade(shell, -0.45),
    faceGran: cpbMix(shell, pale ? "#ffffff" : "#fbe0bf", 0.86),
  }
}

/** Every shade a button face is painted in, from one surface colour. */
export function cpbFace(surface: string, ink?: string) {
  const light = cpbLuma(surface) > 0.42
  return {
    top: cpbShade(surface, light ? 0.45 : 0.1),
    base: surface,
    bottom: cpbShade(surface, light ? -0.07 : -0.16),
    line: cpbShade(surface, light ? -0.2 : -0.32),
    ink: ink || (light ? "#22241e" : "#f4f1e9"),
    light,
  }
}

/** Range of x (px, crab centre) the crab may walk on a button this wide. */
export function cpbRange(width: number, crabW: number): [number, number] {
  const inset = crabW * 0.34
  if (width <= inset * 2) return [width / 2, width / 2]
  return [inset, width - inset]
}

/** Rewrite every coordinate pair of an absolute M/L/C/Q/Z path. */
export function cpbMap(d: string, f: (x: number, y: number) => number[]) {
  return d.replace(/([MLCQ])([^MLCQZ]*)/g, (_: string, cmd: string, body: string) => {
    const n = body.trim().split(/[\s,]+/).filter(Boolean).map(Number)
    const out: number[] = []
    for (let i = 0; i + 1 < n.length; i += 2) {
      const p = f(n[i], n[i + 1])
      out.push(+p[0].toFixed(2), +p[1].toFixed(2))
    }
    return cmd + out.join(" ")
  })
}

/** Mirror a path across the crab's centre line. */
export function cpbMirror(d: string) {
  return cpbMap(d, (x, y) => [CPB_W - x, y])
}

/** Scale, rotate (degrees, about the local origin), then move a path. */
export function cpbPlace(d: string, dx: number, dy: number, deg: number, s = 1) {
  const r = (deg * Math.PI) / 180
  const c = Math.cos(r)
  const n = Math.sin(r)
  return cpbMap(d, (x, y) => [x * s * c - y * s * n + dx, x * s * n + y * s * c + dy])
}

/** Same transform, for a single point. */
export function cpbPoint(x: number, y: number, dx: number, dy: number, deg: number, s = 1) {
  const r = (deg * Math.PI) / 180
  return [x * s * Math.cos(r) - y * s * Math.sin(r) + dx, x * s * Math.sin(r) + y * s * Math.cos(r) + dy]
}

/** A smooth closed path through points (Catmull-Rom → cubic Bézier). */
export function cpbSmooth(pts: number[][]) {
  const n = pts.length
  const f = (v: number) => v.toFixed(2)
  let d = "M" + f(pts[0][0]) + " " + f(pts[0][1])
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n]
    const p1 = pts[i]
    const p2 = pts[(i + 1) % n]
    const p3 = pts[(i + 2) % n]
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += "C" + [c1[0], c1[1], c2[0], c2[1], p2[0], p2[1]].map(f).join(" ")
  }
  return d + "Z"
}

/** A point at fraction t (by length) along a polyline, and its direction. */
export function cpbAlong(pts: number[][], t: number) {
  const seg: number[] = []
  let total = 0
  for (let i = 0; i < pts.length - 1; i++) {
    const l = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1])
    seg.push(l)
    total += l
  }
  let d = cpbClamp(t, 0, 1) * total
  for (let i = 0; i < seg.length; i++) {
    if (d <= seg[i] || i === seg.length - 1) {
      const u = seg[i] ? Math.min(1, d / seg[i]) : 0
      const a = pts[i]
      const b = pts[i + 1]
      const l = seg[i] || 1
      return { p: [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u], dir: [(b[0] - a[0]) / l, (b[1] - a[1]) / l] }
    }
    d -= seg[i]
  }
  return { p: pts[0], dir: [1, 0] }
}

/** A tapered limb along a polyline: widths per point, the last one usually 0. */
export function cpbLimb(pts: number[][], widths: number[]) {
  const P: number[][] = []
  const Wd: number[] = []
  for (let i = 0; i < pts.length - 1; i++) {
    for (let k = 0; k < 4; k++) {
      const t = k / 4
      P.push([pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t])
      Wd.push(widths[i] + (widths[i + 1] - widths[i]) * t)
    }
  }
  P.push(pts[pts.length - 1])
  Wd.push(widths[widths.length - 1])
  const n = P.length
  const left: number[][] = []
  const right: number[][] = []
  for (let i = 0; i < n; i++) {
    const a = P[Math.max(0, i - 1)]
    const b = P[Math.min(n - 1, i + 1)]
    let nx = -(b[1] - a[1])
    let ny = b[0] - a[0]
    const len = Math.hypot(nx, ny) || 1
    nx /= len
    ny /= len
    const w = Wd[i] / 2
    left.push([P[i][0] + nx * w, P[i][1] + ny * w])
    right.push([P[i][0] - nx * w, P[i][1] - ny * w])
  }
  const ring = left.concat(right.reverse())
  // a rounded shoulder behind the first joint
  const a = P[0]
  const b = P[1]
  const bl = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1
  ring.push([a[0] - ((b[0] - a[0]) / bl) * Wd[0] * 0.5, a[1] - ((b[1] - a[1]) / bl) * Wd[0] * 0.5])
  return cpbSmooth(ring)
}

/** Points along a polyline with `teeth` soft saw-teeth of height `amp` on its outer side. */
export function cpbSerrate(pts: number[][], teeth: number, amp: number) {
  const out: number[][] = []
  const N = teeth * 6
  for (let i = 0; i <= N; i++) {
    const q = cpbAlong(pts, i / N)
    const ph = (i % 6) / 6
    const k = amp * (ph < 0.5 ? ph * 2 : (1 - ph) * 2)
    out.push([q.p[0] + q.dir[1] * k, q.p[1] - q.dir[0] * k])
  }
  return out
}

/** The carapace: a broad dome, saw-toothed down both front flanks. */
export function cpbCarapace() {
  const right = [[120, 21], [140, 22], [158, 26]]
    .concat(cpbSerrate([[166, 30], [178, 40], [185, 54], [186, 66]], 4, 2.8))
    .concat([[183, 78], [174, 92], [154, 101], [120, 104]])
  const left = right.slice(1, -1).reverse().map((p) => [CPB_W - p[0], p[1]])
  return cpbSmooth(right.concat(left))
}

/** The broad tan front of the crab, under the eyes. */
export function cpbFront() {
  const right = [[120, 57], [130, 55], [140, 57], [150, 58], [162, 57], [171, 62], [175, 72], [172, 86], [160, 95], [144, 100], [120, 101.5]]
  const left = right.slice(1, -1).reverse().map((p) => [CPB_W - p[0], p[1]])
  return cpbSmooth(right.concat(left))
}

/** A walking leg: the limb and its dark tip. */
export function cpbLeg(pts: number[][], widths: number[]) {
  const n = pts.length
  const a = pts[n - 2]
  const b = pts[n - 1]
  const s = [a[0] + (b[0] - a[0]) * 0.6, a[1] + (b[1] - a[1]) * 0.6]
  return { body: cpbLimb(pts, widths), nail: cpbLimb([s, b], [widths[n - 2] * 0.44, 0]) }
}
/** A seeded random generator (mulberry32), so every crab is drawn the same way. */
export function cpbRand(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Granules scattered through an ellipse, as [x, y, r]. They never overlap, and
 * `bias` (0–1) crowds them toward the bottom of the ellipse, the shell's front.
 */
export function cpbGranules(seed: number, n: number, cx: number, cy: number, rx: number, ry: number, rMin: number, rMax: number, bias = 0) {
  const rnd = cpbRand(seed)
  const out: number[][] = []
  for (let guard = 0; out.length < n && guard < n * 40; guard++) {
    const a = rnd() * Math.PI * 2
    const d = Math.sqrt(rnd())
    const x = cx + Math.cos(a) * d * rx
    const y = cy + Math.sin(a) * d * ry
    const r = rMin + (rMax - rMin) * rnd()
    if (rnd() > 1 - bias + bias * ((y - cy + ry) / (2 * ry))) continue
    if (out.some((g) => Math.hypot(g[0] - x, g[1] - y) < g[2] + r + 0.4)) continue
    out.push([+x.toFixed(2), +y.toFixed(2), +r.toFixed(2)])
  }
  return out
}

/** Short strokes across a limb at each inner joint: the dark seams between segments. */
export function cpbBands(pts: number[][], widths: number[]) {
  let d = ""
  for (let i = 1; i < pts.length - 1; i++) {
    const a = pts[i - 1]
    const b = pts[i + 1]
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1
    const nx = -(b[1] - a[1]) / l
    const ny = (b[0] - a[0]) / l
    const w = widths[i] * 0.46
    const p = pts[i]
    d += "M" + (p[0] + nx * w).toFixed(2) + " " + (p[1] + ny * w).toFixed(2) + "L" + (p[0] - nx * w).toFixed(2) + " " + (p[1] - ny * w).toFixed(2)
  }
  return d
}

/** `n` little teeth along the edge a→b, `h` tall, on the side `side` (+1 / -1) of the edge. */
export function cpbTeeth(a: number[], b: number[], n: number, h: number, side: number) {
  const dx = (b[0] - a[0]) / n
  const dy = (b[1] - a[1]) / n
  const l = Math.hypot(dx, dy) || 1
  const nx = (-dy / l) * h * side
  const ny = (dx / l) * h * side
  let d = ""
  for (let i = 0; i < n; i++) {
    const x = a[0] + dx * i
    const y = a[1] + dy * i
    d += "M" + x.toFixed(2) + " " + y.toFixed(2) + "L" + (x + dx * 0.5 + nx).toFixed(2) + " " + (y + dy * 0.5 + ny).toFixed(2) + "L" + (x + dx).toFixed(2) + " " + (y + dy).toFixed(2) + "Z"
  }
  return d
}
// #endregion

// ---------------------------------------------------------------------------
// The drawing, built once at module load.

type Pt = [number, number]
type LegArt = { body: string; nail: string; bands: string }

const legOf = (pts: number[][], w: number[]): LegArt => ({ ...cpbLeg(pts, w), bands: cpbBands(pts, w) })
const mirrorLeg = (l: LegArt): LegArt => ({ body: cpbMirror(l.body), nail: cpbMirror(l.nail), bands: cpbMirror(l.bands) })
const pct = (x: number, y: number) => ((x / CPB_W) * 100).toFixed(3) + "% " + ((y / CPB_H) * 100).toFixed(3) + "%"

const LEGS_L = {
  peek: {
    back: [legOf([[72, 64], [46, 46], [32, 62], [24, 94]], [11.5, 10.5, 8.5, 0])],
    front: [
      legOf([[68, 74], [40, 58], [27, 80], [24, 114]], [13.5, 12.5, 10, 0]),
      legOf([[72, 88], [50, 84], [40, 100], [41, 120]], [12.5, 11.5, 9, 0]),
    ],
  },
  stand: {
    back: [legOf([[72, 66], [44, 48], [28, 78], [22, 122]], [11.5, 10.5, 8.5, 0])],
    front: [
      legOf([[68, 78], [40, 66], [28, 96], [27, 138]], [13.5, 12.5, 10, 0]),
      legOf([[76, 92], [54, 92], [46, 116], [50, 144]], [12.5, 11.5, 9, 0]),
    ],
  },
}
const LEGS = {
  peek: {
    back: { l: LEGS_L.peek.back, r: LEGS_L.peek.back.map(mirrorLeg) },
    front: { l: LEGS_L.peek.front, r: LEGS_L.peek.front.map(mirrorLeg) },
  },
  stand: {
    back: { l: LEGS_L.stand.back, r: LEGS_L.stand.back.map(mirrorLeg) },
    front: { l: LEGS_L.stand.front, r: LEGS_L.stand.front.map(mirrorLeg) },
  },
}

// The claw in its own frame: wrist at the origin, the palm running along +x.
const PALM = "M-5 -2C-4 -11 10 -14 22 -12C31 -10 36 -5 36 2C35 8 29 11 20 12C8 13 -3 10 -5 2Z"
const PALM_CREAM = "M2 6C10 10 21 11 28 9C33 7 36 4 36 1C34 8 27 12 18 12C10 12 4 10 2 6Z"
const DACTYL = "M27 -9C40 -13 53 -7 59 5C53 2 47 1 41 1C37 1 33 0 29 -1Z"
const POLLEX = "M31 4C41 4 50 6 57 10C51 14 42 15 30 11Z"
const CARPUS = cpbSmooth([[-7, 0], [-5, -7], [1, -9], [7, -6], [9, 1], [5, 7], [-2, 8], [-6, 5]])
const HAND_S = 1.24
const WRIST: Pt = [49, 76]
const HAND_DEG = 41
const SHOULDER: Pt = [86, 92]
const HINGE = cpbPoint(30, -3, WRIST[0], WRIST[1], HAND_DEG, HAND_S)
const handPath = (d: string) => cpbPlace(d, WRIST[0], WRIST[1], HAND_DEG, HAND_S)

const CLAW_L = {
  arm: cpbLimb([SHOULDER, [68, 85], [53, 78]], [17, 16, 15]),
  carpus: cpbPlace(CARPUS, WRIST[0], WRIST[1], HAND_DEG - 20),
  palm: handPath(PALM),
  cream: handPath(PALM_CREAM),
  pollex: handPath(POLLEX),
  dactyl: handPath(DACTYL),
}
const CLAW_R = Object.fromEntries(Object.entries(CLAW_L).map(([k, v]) => [k, cpbMirror(v)])) as typeof CLAW_L
const CLAW_O = {
  l: { shoulder: pct(SHOULDER[0], SHOULDER[1]), wrist: pct(WRIST[0], WRIST[1]), hinge: pct(HINGE[0], HINGE[1]) },
  r: { shoulder: pct(CPB_W - SHOULDER[0], SHOULDER[1]), wrist: pct(CPB_W - WRIST[0], WRIST[1]), hinge: pct(CPB_W - HINGE[0], HINGE[1]) },
}

const placePt = (g: number[]) => {
  const p = cpbPoint(g[0], g[1], WRIST[0], WRIST[1], HAND_DEG, HAND_S)
  return [+p[0].toFixed(2), +p[1].toFixed(2), +(g[2] * HAND_S).toFixed(2)]
}
const PALM_GRAN_L = cpbGranules(41, 18, 15, -4, 17, 7, 0.6, 1.5, 0).map(placePt)
const ARM_GRAN_L = cpbGranules(43, 9, 68, 84, 14, 3.5, 0.6, 1.3, 0)
const TEETH_L = handPath(cpbTeeth([32, 0], [54, 3.5], 5, 1.9, 1) + cpbTeeth([33, 5.5], [53, 9], 5, 1.7, -1))
const mirrorPts = (g: number[][]) => g.map((p) => [CPB_W - p[0], p[1], p[2]])
const CLAW_TEX = {
  l: { palm: PALM_GRAN_L, arm: ARM_GRAN_L, teeth: TEETH_L },
  r: { palm: mirrorPts(PALM_GRAN_L), arm: mirrorPts(ARM_GRAN_L), teeth: cpbMirror(TEETH_L) },
}

const CARAPACE = cpbCarapace()
const FRONT = cpbFront()
const PLATE_L = cpbSmooth([[119.5, 63], [109, 63.5], [100.5, 67.5], [97.5, 78], [99, 90], [104.5, 98.5], [112, 101.5], [119.5, 102]])
const PLATE_R = cpbMirror(PLATE_L)
const EYE_X = [93, 147]
const BROW = "M94 62C107 57.5 133 57.5 146 62M86 70C88 76 92 80 96 82M154 70C152 76 148 80 144 82"
const PLATE_SEAMS_L = "M100 85C106 79 113 76 119 75M101 93C107 90 113 89 119 89.5M104 70C109 68 114 67.5 119 68"
const PLATE_SEAMS_R = cpbMirror(PLATE_SEAMS_L)
// granules: raised (lighter) and pitted (darker), seeded so every crab matches
const SHELL_GRAN = cpbGranules(11, 64, 120, 44, 60, 21, 0.9, 2.3, 0.45).concat(cpbGranules(12, 26, 120, 64, 66, 13, 0.8, 1.8, 0))
const SHELL_PITS = cpbGranules(23, 28, 120, 46, 58, 22, 0.5, 1.05, 0)
const FACE_GRAN = cpbGranules(31, 26, 120, 76, 52, 16, 0.6, 1.4, 0).filter((g) => Math.abs(g[0] - 120) > 21)
const PLATE_GRAN = cpbGranules(37, 10, 109, 82, 7, 14, 0.5, 1.0, 0)
// antennae and antennules, from between the eyes
const ANT_L = cpbLimb([[114, 57], [111, 47], [106, 38], [107, 27]], [2.6, 1.9, 1.3, 0])
const ANTULE_L = cpbLimb([[117.5, 58], [116, 50], [118, 44]], [2.2, 1.6, 0])
// each moving part's own box [x, y, w, h], and where it pivots
const BOX = {
  eye: [[76, 10, 34, 42], [130, 10, 34, 42]],
  ant: [[98, 20, 22, 42], [120, 20, 22, 42]],
  antule: [[110, 38, 14, 24], [116, 38, 14, 24]],
  plate: [[94, 58, 28, 48], [118, 58, 28, 48]],
  legs: [[0, 30, 92, 120], [148, 30, 92, 120]],
}

export type CrabColor = keyof typeof CPB_CRABS | (string & {})
export type CrabTone = keyof typeof CPB_TONES | (string & {})
export type CrabSize = keyof typeof CPB_SIZES
export type CrabPose = "peek" | "stand"
export type CrabMood = "idle" | "hover" | "press" | "sleep"

const uidOf = (raw: string) => "cpb" + raw.replace(/[^a-zA-Z0-9]/g, "")
const VB = "0 0 " + CPB_W + " " + CPB_H

// ---------------------------------------------------------------------------
// The crab is a stack of SVG planes, one per moving part. Each part is lit
// once by the relief filter; every motion after that is a CSS transform on
// the plane, so a page full of crabs stays on the compositor.

function Defs({ uid, shell }: { uid: string; shell: string }) {
  const t = cpbCrabTones(shell)
  const u = (k: string) => uid + "-" + k
  return (
    <defs>
      {/*
        Height = a blurred silhouette (volume) + soft noise (pebbling) + the
        paint's own brightness, so painted granules rise and painted seams sink.
        Then: blotchy mottling, diffuse light, a wet specular sheen.
      */}
      <filter id={u("relief")} x="-15%" y="-15%" width="130%" height="130%" colorInterpolationFilters="sRGB">
        <feGaussianBlur in="SourceAlpha" stdDeviation="4.2" result="bev1" />
        <feGaussianBlur in="SourceAlpha" stdDeviation="11" result="dome" />
        <feComposite in="bev1" in2="dome" operator="arithmetic" k2={0.6} k3={0.55} result="bev" />
        <feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves={2} seed={7} result="n" />
        <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1 0 0 0 0" result="g0" />
        <feGaussianBlur in="g0" stdDeviation="0.55" result="grain" />
        <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.3 0.59 0.11 0 0" result="lum0" />
        <feGaussianBlur in="lum0" stdDeviation="0.5" result="lum" />
        <feComposite in="bev" in2="grain" operator="arithmetic" k1={0.11} k2={0.92} result="h0" />
        <feComposite in="h0" in2="lum" operator="arithmetic" k2={1} k3={0.42} result="h" />
        <feDiffuseLighting in="h" surfaceScale={5} diffuseConstant={1.16} lightingColor="#ffffff" result="d">
          <feDistantLight azimuth={245} elevation={56} />
        </feDiffuseLighting>
        <feSpecularLighting in="h" surfaceScale={5} specularConstant={1.2} specularExponent={30} lightingColor="#fff4e6" result="s">
          <feDistantLight azimuth={235} elevation={50} />
        </feSpecularLighting>
        <feComposite in="s" in2="SourceAlpha" operator="in" result="s2" />
        <feTurbulence type="fractalNoise" baseFrequency="0.07" numOctaves={2} seed={3} result="m0" />
        <feColorMatrix in="m0" type="matrix" values="0 0 0 0 0.16  0 0 0 0 0.02  0 0 0 0 0  -1.9 0 0 0 1.12" result="m1" />
        <feComponentTransfer in="m1" result="mot">
          <feFuncA type="linear" slope={0.3} />
        </feComponentTransfer>
        <feComposite in="mot" in2="SourceGraphic" operator="atop" result="paint" />
        <feComposite in="paint" in2="d" operator="arithmetic" k1={1.04} result="lit" />
        <feComposite in="lit" in2="s2" operator="arithmetic" k2={1} k3={0.62} result="o" />
        <feComposite in="o" in2="SourceAlpha" operator="in" result="fin" />
        <feDropShadow in="fin" dx={0} dy={1.8} stdDeviation={1.3} floodColor="#2a0700" floodOpacity={0.38} />
      </filter>
      <radialGradient id={u("cap")} cx="50%" cy="10%" r="95%">
        <stop offset="0" stopColor={t.light} />
        <stop offset="0.5" stopColor={t.base} />
        <stop offset="1" stopColor={t.dark} />
      </radialGradient>
      <linearGradient id={u("face")} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={t.faceEdge} />
        <stop offset="0.25" stopColor={t.face} />
        <stop offset="1" stopColor={t.faceEdge} />
      </linearGradient>
      <radialGradient id={u("faceRim")} cx="50%" cy="40%" r="62%">
        <stop offset="0.58" stopColor={t.base} stopOpacity={0} />
        <stop offset="1" stopColor={t.base} stopOpacity={0.8} />
      </radialGradient>
      <linearGradient id={u("plate")} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={t.plate} />
        <stop offset="1" stopColor={t.plateDark} />
      </linearGradient>
      <linearGradient id={u("leg")} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={t.light} />
        <stop offset="0.6" stopColor={t.base} />
        <stop offset="1" stopColor={t.dark} />
      </linearGradient>
      <linearGradient id={u("palm")} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={t.light} />
        <stop offset="0.55" stopColor={t.base} />
        <stop offset="1" stopColor={t.dark} />
      </linearGradient>
      <linearGradient id={u("finger")} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={t.base} />
        <stop offset="0.45" stopColor={t.hi} />
        <stop offset="0.78" stopColor={t.base} />
        <stop offset="1" stopColor={t.nail} />
      </linearGradient>
      <radialGradient id={u("sock")} cx="50%" cy="30%" r="70%">
        <stop offset="0" stopColor={t.hi} />
        <stop offset="0.6" stopColor={t.light} />
        <stop offset="1" stopColor={t.dark} />
      </radialGradient>
      <radialGradient id={u("eye")} cx="35%" cy="28%" r="80%">
        <stop offset="0" stopColor="#4b3a38" />
        <stop offset="0.3" stopColor="#160c0b" />
        <stop offset="1" stopColor="#000000" />
      </radialGradient>
      <radialGradient id={u("ao")}>
        <stop offset="0" stopColor="#2a0800" stopOpacity={0.5} />
        <stop offset="1" stopColor="#2a0800" stopOpacity={0} />
      </radialGradient>
    </defs>
  )
}

function LegSet({ legs, uid, tones }: { legs: LegArt[]; uid: string; tones: ReturnType<typeof cpbCrabTones> }) {
  return (
    <>
      <g filter={"url(#" + uid + "-relief)"}>
        {legs.map((l, i) => (
          <g key={i}>
            <path d={l.body} fill={"url(#" + uid + "-leg)"} />
            <path d={l.bands} stroke={tones.pit} strokeWidth={1.3} strokeLinecap="round" opacity={0.75} />
          </g>
        ))}
      </g>
      {legs.map((l, i) => (
        <path key={i} d={l.nail} fill={tones.nail} opacity={0.88} />
      ))}
    </>
  )
}

function Dots({ dots, fill, opacity }: { dots: number[][]; fill: string; opacity: number }) {
  return (
    <g fill={fill} opacity={opacity}>
      {dots.map((g, i) => (
        <circle key={i} cx={g[0]} cy={g[1]} r={g[2]} />
      ))}
    </g>
  )
}

/**
 * One layer of the drawing. A plane that moves is wrapped in a span and the
 * span is what animates: Chrome composites transforms on HTML boxes, but
 * repaints (and re-lights) an <svg> whose own transform animates.
 */
function Plane({ className = "", style, box, children }: { className?: string; style?: React.CSSProperties; box?: number[]; children?: React.ReactNode }) {
  const svg = (
    <svg className="cpb-plane" viewBox={box ? box.join(" ") : VB} aria-hidden="true" focusable="false">
      {children}
    </svg>
  )
  if (!className) return svg
  // a small part gets a small layer: only its own corner of the drawing
  const at = box
    ? { left: (box[0] / CPB_W) * 100 + "%", top: (box[1] / CPB_H) * 100 + "%", width: (box[2] / CPB_W) * 100 + "%", height: (box[3] / CPB_H) * 100 + "%", right: "auto", bottom: "auto" }
    : null
  return (
    <span className={"cpb-part " + className} style={at ? { ...at, ...style } : style}>
      {svg}
    </span>
  )
}

/** A transform origin, in percent of a part's own box. */
const originIn = (box: number[], x: number, y: number) => (((x - box[0]) / box[2]) * 100).toFixed(2) + "% " + (((y - box[1]) / box[3]) * 100).toFixed(2) + "%"

function Claw({ side, uid, tones }: { side: "l" | "r"; uid: string; tones: ReturnType<typeof cpbCrabTones> }) {
  const c = side === "l" ? CLAW_L : CLAW_R
  const tex = CLAW_TEX[side]
  const o = CLAW_O[side]
  const r = (k: string) => "url(#" + uid + "-" + k + ")"
  return (
    <span className={"cpb-arm cpb-arm-" + side} style={{ transformOrigin: o.shoulder }}>
      <Plane>
        <g filter={r("relief")}>
          <path d={c.arm} fill={r("leg")} />
          <Dots dots={tex.arm} fill={tones.gran} opacity={0.65} />
          <path d={c.carpus} fill={r("palm")} />
        </g>
      </Plane>
      <span className={"cpb-hand cpb-hand-" + side} style={{ transformOrigin: o.wrist }}>
        <span className={"cpb-finger cpb-finger-" + side} style={{ transformOrigin: o.hinge }}>
          <Plane>
            <g filter={r("relief")}>
              <path d={c.dactyl} fill={r("finger")} />
            </g>
          </Plane>
        </span>
        <Plane>
          <g filter={r("relief")}>
            <path d={c.pollex} fill={r("finger")} />
            <path d={tex.teeth} fill={tones.cream} />
            <path d={c.palm} fill={r("palm")} />
            <path d={c.cream} fill={tones.cream} opacity={0.85} />
            <Dots dots={tex.palm} fill={tones.gran} opacity={0.7} />
          </g>
        </Plane>
      </span>
    </span>
  )
}

/** Half of the crab: what sits behind the button's edge, or what hangs in front of it. */
function CrabArt({ layer, pose, uid, shell }: { layer: "back" | "front"; pose: CrabPose; uid: string; shell: string }) {
  const t = cpbCrabTones(shell)
  const legs = LEGS[pose]
  const r = (k: string) => "url(#" + uid + "-" + k + ")"
  if (layer === "back") {
    return (
      <>
        <Plane className="cpb-shock-plane">
          <g className="cpb-shock" stroke="currentColor" strokeWidth={2.8} strokeLinecap="round" fill="none">
            <path d="M98 16L91 2" />
            <path d="M120 11V-4" />
            <path d="M142 16L149 2" />
          </g>
        </Plane>
        <Plane className="cpb-body">
          <Defs uid={uid} shell={shell} />
          <LegSet legs={legs.back.l.concat(legs.back.r)} uid={uid} tones={t} />
          <g filter={r("relief")}>
            <path d={CARAPACE} fill={r("cap")} />
            <Dots dots={SHELL_GRAN} fill={t.gran} opacity={0.85} />
            <Dots dots={SHELL_PITS} fill={t.pit} opacity={0.55} />
          </g>
          <g filter={r("relief")}>
            <path d={FRONT} fill={r("face")} />
            <path d={FRONT} fill={r("faceRim")} />
            <Dots dots={FACE_GRAN} fill={t.faceGran} opacity={0.8} />
            <path d={BROW} fill="none" stroke={t.crease} strokeOpacity={0.6} strokeWidth={1.1} strokeLinecap="round" />
          </g>
          <g filter={r("relief")}>
            {EYE_X.map((x) => (
              <ellipse key={x} cx={x} cy={47} rx={15.5} ry={10.5} fill={r("sock")} />
            ))}
          </g>
        </Plane>
        {(["l", "r"] as const).map((sd) => (
          <Plane key={"p" + sd} className={"cpb-plate cpb-plate-" + sd} box={BOX.plate[sd === "l" ? 0 : 1]} style={{ transformOrigin: originIn(BOX.plate[sd === "l" ? 0 : 1], sd === "l" ? 119.5 : CPB_W - 119.5, 64) }}>
            <g filter={r("relief")}>
              <path d={sd === "l" ? PLATE_L : PLATE_R} fill={r("plate")} />
              <path d={sd === "l" ? PLATE_SEAMS_L : PLATE_SEAMS_R} fill="none" stroke={t.crease} strokeOpacity={0.7} strokeWidth={1} strokeLinecap="round" />
              <Dots dots={sd === "l" ? PLATE_GRAN : mirrorPts(PLATE_GRAN)} fill={t.faceGran} opacity={0.8} />
            </g>
          </Plane>
        ))}
        {(["l", "r"] as const).map((sd) => (
          <React.Fragment key={"a" + sd}>
            <Plane className={"cpb-ant cpb-ant-" + sd} box={BOX.ant[sd === "l" ? 0 : 1]} style={{ transformOrigin: originIn(BOX.ant[sd === "l" ? 0 : 1], sd === "l" ? 114 : CPB_W - 114, 57) }}>
              <path d={sd === "l" ? ANT_L : cpbMirror(ANT_L)} fill={r("leg")} stroke={t.dark} strokeWidth={0.4} />
            </Plane>
            <Plane className={"cpb-antule cpb-antule-" + sd} box={BOX.antule[sd === "l" ? 0 : 1]} style={{ transformOrigin: originIn(BOX.antule[sd === "l" ? 0 : 1], sd === "l" ? 117.5 : CPB_W - 117.5, 58) }}>
              <path d={sd === "l" ? ANTULE_L : cpbMirror(ANTULE_L)} fill={t.hi} stroke={t.dark} strokeWidth={0.4} />
            </Plane>
          </React.Fragment>
        ))}
        {EYE_X.map((x, i) => (
          <Plane key={x} className={"cpb-eye cpb-eye-" + (i ? "r" : "l")} box={BOX.eye[i]} style={{ transformOrigin: originIn(BOX.eye[i], x, 42) }}>
            <ellipse cx={x} cy={31} rx={12} ry={15.5} fill={r("eye")} />
            <ellipse cx={x - 4} cy={23} rx={4} ry={5.4} fill="#fff" opacity={0.92} transform={"rotate(-18 " + (x - 4) + " 23)"} />
            <circle cx={x + 3.5} cy={21.5} r={1.5} fill="#fff" opacity={0.7} />
            <ellipse cx={x + 5} cy={39.5} rx={3.6} ry={1.8} fill="#fff" opacity={0.2} transform={"rotate(-30 " + (x + 5) + " 39.5)"} />
          </Plane>
        ))}
      </>
    )
  }
  return (
    <>
      {pose === "peek" ? (
        <Plane>
          <ellipse cx={120} cy={CPB_EDGE + 2} rx={72} ry={6} fill={r("ao")} />
        </Plane>
      ) : (
        <Plane>
          <ellipse cx={120} cy={146} rx={70} ry={4} fill={r("ao")} opacity={0.7} />
        </Plane>
      )}
      <Plane className="cpb-legs cpb-legs-l" box={BOX.legs[0]} style={{ transformOrigin: originIn(BOX.legs[0], 67, 80) }}>
        <LegSet legs={legs.front.l} uid={uid} tones={t} />
      </Plane>
      <Plane className="cpb-legs cpb-legs-r" box={BOX.legs[1]} style={{ transformOrigin: originIn(BOX.legs[1], CPB_W - 67, 80) }}>
        <LegSet legs={legs.front.r} uid={uid} tones={t} />
      </Plane>
      <Claw side="l" uid={uid} tones={t} />
      <Claw side="r" uid={uid} tones={t} />
    </>
  )
}

// ---------------------------------------------------------------------------
// Scoped styles. Every selector starts with .cpb-, every keyframe with cpb-.

const CPB_CSS = `
.cpb-root { position: relative; display: inline-flex; isolation: isolate; -webkit-tap-highlight-color: transparent; vertical-align: middle; }
.cpb-btn { all: unset; box-sizing: border-box; position: relative; display: inline-flex; align-items: center; justify-content: center; isolation: isolate; cursor: pointer; font: inherit; color: var(--cpb-ink); height: var(--cpb-h); -webkit-tap-highlight-color: transparent; user-select: none; -webkit-user-select: none; touch-action: manipulation; }
.cpb-btn:disabled, .cpb-btn[aria-disabled="true"] { cursor: not-allowed; }
.cpb-btn:focus-visible { outline: none; }
.cpb-btn:focus-visible .cpb-face { box-shadow: var(--cpb-shadow), 0 0 0 3px var(--cpb-ring-gap, transparent), 0 0 0 5px var(--cpb-ring); }
.cpb-face { position: relative; z-index: 1; display: inline-flex; align-items: center; justify-content: center; gap: calc(var(--cpb-h) * 0.22); height: 100%; width: 100%; box-sizing: border-box; padding: 0 calc(var(--cpb-h) * 0.5); border-radius: 999px; font-size: calc(var(--cpb-h) * 0.33); font-weight: 450; letter-spacing: -0.01em; line-height: 1; white-space: nowrap; background: linear-gradient(180deg, var(--cpb-top), var(--cpb-base) 46%, var(--cpb-bottom)); border: 1.5px solid var(--cpb-line); box-shadow: var(--cpb-shadow); transition: transform 0.18s cubic-bezier(0.3, 0.7, 0.4, 1.4), box-shadow 0.2s ease, background 0.2s ease; }
.cpb-solid, .cpb-select, .cpb-icon { --cpb-shadow: inset 0 2px 0 rgba(255, 255, 255, 0.2), inset 0 -4px 7px rgba(0, 0, 0, 0.22), 0 10px 20px -10px rgba(0, 0, 0, 0.55), 0 2px 3px rgba(0, 0, 0, 0.16); }
.cpb-select { --cpb-shadow: inset 0 2px 0 rgba(255, 255, 255, 0.9), inset 0 -4px 8px rgba(0, 0, 0, 0.08), 0 10px 20px -10px rgba(0, 0, 0, 0.35), 0 1px 2px rgba(0, 0, 0, 0.12); }
.cpb-outline { --cpb-shadow: inset 0 2px 0 rgba(255, 255, 255, 0.95), inset 0 -3px 6px rgba(0, 0, 0, 0.05), 0 8px 18px -12px rgba(0, 0, 0, 0.4); }
.cpb-outline .cpb-face { background: linear-gradient(180deg, #ffffff, #f6f4ef 60%, #efece5); border: 2px solid var(--cpb-base); color: var(--cpb-oink); }
.cpb-btn:not(:disabled):hover .cpb-face { background: linear-gradient(180deg, var(--cpb-top), var(--cpb-base) 38%, var(--cpb-bottom)); filter: brightness(1.04); }
.cpb-outline:not(:disabled):hover .cpb-face { background: linear-gradient(180deg, #ffffff, #f9f7f2 60%, #f0ede6); }
.cpb-btn:not(:disabled):active .cpb-face, .cpb-btn[data-state="press"] .cpb-face { transform: translateY(2px) scale(0.985); box-shadow: inset 0 3px 7px rgba(0, 0, 0, 0.22), inset 0 -1px 0 rgba(255, 255, 255, 0.12), 0 3px 6px -4px rgba(0, 0, 0, 0.45); }
.cpb-btn:disabled .cpb-face { filter: saturate(0.4); opacity: 0.6; }
.cpb-glyph { display: inline-flex; flex: none; width: calc(var(--cpb-h) * 0.4); height: calc(var(--cpb-h) * 0.4); transition: transform 0.35s cubic-bezier(0.3, 0.7, 0.4, 1.5); }
.cpb-glyph > svg { width: 100%; height: 100%; display: block; max-width: none; }
.cpb-lead { margin-right: calc(var(--cpb-h) * 0.12); }
.cpb-btn:not(:disabled):hover .cpb-trail, .cpb-btn[data-state="hover"] .cpb-trail { transform: translateX(4px); }
.cpb-label { display: inline-block; }
.cpb-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }

.cpb-crab { position: absolute; pointer-events: none; width: var(--cpb-cw); height: calc(var(--cpb-cw) * 0.625); left: calc(var(--cpb-xf, 0.5) * 100%); top: calc(var(--cpb-cw) * -0.4333); margin-left: calc(var(--cpb-cw) * -0.5); transform-origin: 50% 69.33%; transition: transform 0.45s cubic-bezier(0.3, 0.8, 0.3, 1.35); color: var(--cpb-mark); }
.cpb-crab-back { z-index: 0; }
.cpb-crab, .cpb-solo, .cpb-solo-front, .cpb-arm, .cpb-hand { will-change: transform; }
.cpb-crab-front { z-index: 2; }
.cpb-solo { position: relative; display: block; width: 100%; height: 100%; color: var(--cpb-mark); }
.cpb-solo-front { position: absolute; inset: 0; }
.cpb-plane { position: absolute; inset: 0; width: 100%; height: 100%; max-width: none; overflow: visible; display: block; }
.cpb-part { position: absolute; inset: 0; display: block; }
.cpb-arm, .cpb-hand, .cpb-finger { position: absolute; inset: 0; display: block; transition: transform 0.42s cubic-bezier(0.3, 0.8, 0.3, 1.35); }
.cpb-root[data-walk] .cpb-crab { transition: transform 0.18s ease-out; }

/* life at rest: breathing, wandering eyes, twitching antennae, working mouthparts, shifting legs */
.cpb-crab-back, .cpb-solo { animation: cpb-breathe 3.6s ease-in-out infinite; animation-delay: var(--cpb-phase, 0s); }
.cpb-solo, .cpb-solo-front { transform-origin: 50% 96%; }
.cpb-eye { transition: translate 0.22s cubic-bezier(0.3, 0.7, 0.3, 1.2), scale 0.14s ease, transform 0.3s cubic-bezier(0.3, 0.8, 0.3, 1.5); animation: cpb-blink 5.2s infinite, cpb-drift-l 6.3s ease-in-out infinite; animation-delay: var(--cpb-phase, 0s), var(--cpb-phase, 0s); }
.cpb-eye-r { animation: cpb-blink 5.2s infinite, cpb-drift-r 7.1s ease-in-out infinite; animation-delay: var(--cpb-phase, 0s), calc(var(--cpb-phase, 0s) - 2.2s); }
.cpb-ant-l { animation: cpb-twitch-a 2.6s ease-in-out infinite; animation-delay: var(--cpb-phase, 0s); }
.cpb-ant-r { animation: cpb-twitch-b 3.1s ease-in-out infinite; animation-delay: calc(var(--cpb-phase, 0s) - 1.1s); }
.cpb-antule-l { animation: cpb-flick-l 1.3s ease-in-out infinite; animation-delay: var(--cpb-phase, 0s); }
.cpb-antule-r { animation: cpb-flick-r 1.55s ease-in-out infinite; animation-delay: calc(var(--cpb-phase, 0s) - 0.6s); }
.cpb-plate-l { animation: cpb-chew-l 1.15s ease-in-out infinite; animation-delay: var(--cpb-phase, 0s); }
.cpb-plate-r { animation: cpb-chew-r 1.15s ease-in-out infinite; animation-delay: calc(var(--cpb-phase, 0s) - 0.55s); }
.cpb-root:not([data-walk]) .cpb-legs-l { animation: cpb-shift 3.6s ease-in-out infinite alternate; animation-delay: var(--cpb-phase, 0s); }
.cpb-root:not([data-walk]) .cpb-legs-r { animation: cpb-shift 3.6s ease-in-out infinite alternate-reverse; animation-delay: var(--cpb-phase, 0s); }
.cpb-root[data-live="hover"] .cpb-eye { transform: translateY(-14%); animation: cpb-blink 5.2s infinite; }
.cpb-root[data-live="hover"] .cpb-ant-l, .cpb-root[data-live="hover"] .cpb-ant-r { animation-duration: 0.9s; }
.cpb-root[data-live="hover"] .cpb-plate-l, .cpb-root[data-live="hover"] .cpb-plate-r { animation-duration: 0.5s; }
.cpb-finger-r { animation: cpb-tap-r 7s ease-in-out infinite; animation-delay: var(--cpb-phase, 0s); }
.cpb-shock-plane { opacity: 0; transform-origin: 50% 6%; transform: scale(0.4) translateY(10%); transition: opacity 0.12s ease, transform 0.22s cubic-bezier(0.3, 0.8, 0.3, 1.8); }

/* hover — rise, lift the claw on your side, snip */
.cpb-root[data-live="hover"] .cpb-crab { transform: translateY(calc(var(--cpb-cw) * -0.03)); }
.cpb-root[data-live="hover"][data-side="l"] .cpb-arm-l { transform: rotate(40deg); }
.cpb-root[data-live="hover"][data-side="l"] .cpb-hand-l { transform: rotate(128deg); }
.cpb-root[data-live="hover"][data-side="l"] .cpb-finger-l { animation: cpb-snip-l 0.5s ease-in-out infinite; }
.cpb-root[data-live="hover"][data-side="r"] .cpb-arm-r { transform: rotate(-40deg); }
.cpb-root[data-live="hover"][data-side="r"] .cpb-hand-r { transform: rotate(-128deg); }
.cpb-root[data-live="hover"][data-side="r"] .cpb-finger-r { animation: cpb-snip-r 0.5s ease-in-out infinite; }

/* press — duck, squint, shock lines */
.cpb-root[data-live="press"] .cpb-crab { transform: translateY(calc(var(--cpb-cw) * 0.035)) scale(1.06, 0.82); transition-duration: 0.14s; }
.cpb-root[data-live="press"] .cpb-eye { scale: 1 0.35; transform: translateY(25%); animation: none; }
.cpb-root[data-live="press"] .cpb-ant-l, .cpb-root[data-live="press"] .cpb-ant-r { transform: rotate(-40deg) scale(0.6); animation: none; }
.cpb-root[data-live="press"] .cpb-shock-plane { opacity: 1; transform: none; }
.cpb-root[data-live="press"] .cpb-arm-l { transform: rotate(-5deg); }
.cpb-root[data-live="press"] .cpb-arm-r { transform: rotate(5deg); }

/* asleep (disabled) */
.cpb-root[data-live="sleep"] .cpb-eye { scale: 1 0.1; transform: translateY(18%); animation: none; }
.cpb-root[data-live="sleep"] .cpb-plate-l, .cpb-root[data-live="sleep"] .cpb-plate-r, .cpb-root[data-live="sleep"] .cpb-antule-l, .cpb-root[data-live="sleep"] .cpb-antule-r { animation-duration: 3.4s; }
.cpb-root[data-live="sleep"] .cpb-crab { transform: translateY(calc(var(--cpb-cw) * 0.03)); }
.cpb-root[data-live="sleep"] .cpb-crab-back, .cpb-root[data-live="sleep"] .cpb-crab-front { filter: saturate(0.5) brightness(0.96); }
.cpb-zz { position: absolute; z-index: 3; pointer-events: none; font: 600 calc(var(--cpb-cw) * 0.11) / 1 ui-rounded, system-ui, sans-serif; color: var(--cpb-mark); opacity: 0.7; }
.cpb-zz > span { position: absolute; animation: cpb-zz 2.8s ease-in infinite; opacity: 0; }
.cpb-zz > span:nth-child(2) { font-size: 0.7em; margin-left: 0.9em; animation-delay: 1.4s; }

/* walking — legs patter */
.cpb-root[data-walk] .cpb-legs-l { animation: cpb-patter 0.16s ease-in-out infinite alternate; }
.cpb-root[data-walk] .cpb-legs-r { animation: cpb-patter 0.16s ease-in-out infinite alternate-reverse; }

/* loading — drum both claws */
.cpb-root[data-busy] .cpb-arm-l { animation: cpb-drum-l 0.3s ease-in-out infinite alternate; }
.cpb-root[data-busy] .cpb-arm-r { animation: cpb-drum-r 0.3s ease-in-out infinite alternate; animation-delay: -0.15s; }
.cpb-root[data-busy] .cpb-label { opacity: 0.7; }
.cpb-dots { display: inline-flex; gap: 3px; }
.cpb-dots > i { width: 4px; height: 4px; border-radius: 50%; background: currentColor; animation: cpb-dot 0.9s ease-in-out infinite; }
.cpb-dots > i:nth-child(2) { animation-delay: 0.15s; }
.cpb-dots > i:nth-child(3) { animation-delay: 0.3s; }

/* bubbles */
.cpb-bubble { position: absolute; z-index: 3; pointer-events: none; left: 50%; top: 40%; width: var(--cpb-bs); height: var(--cpb-bs); margin: calc(var(--cpb-bs) * -0.5); border-radius: 50%; background: radial-gradient(circle at 32% 30%, rgba(255, 255, 255, 0.95) 0 18%, rgba(255, 255, 255, 0.25) 30%, rgba(170, 220, 255, 0.18) 62%, rgba(255, 255, 255, 0.55) 100%); box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.6), 0 1px 2px rgba(0, 40, 80, 0.15); animation: cpb-bubble var(--cpb-bt) cubic-bezier(0.2, 0.6, 0.4, 1) forwards; }

/* idle routines, picked at random every few seconds */
.cpb-root[data-idle="tap-l"] .cpb-hand-l { animation: cpb-rap-l 0.9s ease-in-out; }
.cpb-root[data-idle="tap-r"] .cpb-hand-r { animation: cpb-rap-r 0.9s ease-in-out; }
.cpb-root[data-idle="flex"] .cpb-finger-l { animation: cpb-snip-l 0.3s ease-in-out 3; }
.cpb-root[data-idle="flex"] .cpb-finger-r { animation: cpb-snip-r 0.3s ease-in-out 3; animation-delay: 0.12s; }
.cpb-root[data-idle="wipe"] .cpb-arm-l { animation: cpb-wipe-arm 1.7s ease-in-out; }
.cpb-root[data-idle="wipe"] .cpb-hand-l { animation: cpb-wipe-hand 1.7s ease-in-out; }
.cpb-root[data-idle="wipe"] .cpb-eye-l { animation: cpb-squint 1.7s ease-in-out; }
.cpb-root[data-idle="stretch"] .cpb-crab-back, .cpb-root[data-idle="stretch"] .cpb-solo { animation: cpb-stretch 1.5s ease-in-out; }
.cpb-root[data-idle="stretch"] .cpb-arm-l { animation: cpb-reach-l 1.5s ease-in-out; }
.cpb-root[data-idle="stretch"] .cpb-arm-r { animation: cpb-reach-r 1.5s ease-in-out; }
.cpb-root[data-idle="duck"] .cpb-crab-back { animation: cpb-duck 1.9s ease-in-out; }
.cpb-root[data-idle="duck"] .cpb-eye { animation: cpb-peep 1.9s ease-in-out; }
.cpb-root[data-cheer] .cpb-crab-back, .cpb-root[data-cheer] .cpb-crab-front, .cpb-root[data-cheer] .cpb-solo, .cpb-root[data-cheer] .cpb-solo-front { animation: cpb-cheer 0.6s cubic-bezier(0.3, 0.7, 0.4, 1); }
.cpb-root[data-cheer] .cpb-finger-l { animation: cpb-snip-l 0.2s ease-in-out 3; }
.cpb-root[data-cheer] .cpb-finger-r { animation: cpb-snip-r 0.2s ease-in-out 3; }
.cpb-root[data-cheer] .cpb-eye { scale: 1 0.55; animation: none; }

/* ghost — a plain label with the crab standing beside it, waving */
.cpb-ghost .cpb-face { background: none; border-color: transparent; box-shadow: none; padding: 0 calc(var(--cpb-h) * 0.12); color: var(--cpb-gink); }
.cpb-ghost:not(:disabled):hover .cpb-face { background: none; filter: none; }
.cpb-ghost:not(:disabled):active .cpb-face, .cpb-ghost[data-state="press"] .cpb-face { box-shadow: none; transform: translateY(1px); }
.cpb-ghost:focus-visible .cpb-face { box-shadow: 0 0 0 2px var(--cpb-ring); }
.cpb-stand { position: relative; flex: none; pointer-events: none; width: var(--cpb-cw); height: calc(var(--cpb-cw) * 0.625); margin: calc(var(--cpb-cw) * -0.2) calc(var(--cpb-cw) * -0.12) calc(var(--cpb-cw) * -0.1) calc(var(--cpb-cw) * -0.06); transform-origin: 50% 96%; transform: rotate(-9deg); transition: transform 0.4s cubic-bezier(0.3, 0.8, 0.3, 1.4); color: var(--cpb-mark); }
.cpb-stand .cpb-arm-l { translate: -3% -15%; transform: rotate(35deg); animation: cpb-wave 1.7s ease-in-out infinite; }
.cpb-stand .cpb-hand-l { transform: rotate(168deg); }
.cpb-stand .cpb-finger-l { animation: cpb-snip-l 1.7s ease-in-out infinite; }
.cpb-stand .cpb-arm-r { transform: rotate(-8deg); }
.cpb-swish { opacity: 0.8; }
.cpb-root[data-live="hover"] .cpb-stand { transform: translateX(3px) rotate(-14deg); }
.cpb-root[data-live="hover"] .cpb-stand .cpb-arm-l { animation-duration: 0.6s; }
.cpb-root[data-live="hover"] .cpb-stand .cpb-finger-l { animation-duration: 0.6s; }
.cpb-root[data-live="hover"] .cpb-stand .cpb-legs-l { animation: cpb-patter 0.16s ease-in-out infinite alternate; }
.cpb-root[data-live="hover"] .cpb-stand .cpb-legs-r { animation: cpb-patter 0.16s ease-in-out infinite alternate-reverse; }
.cpb-root[data-live="press"] .cpb-stand { transform: rotate(-9deg) scale(1.06, 0.86); }


/* icon — a round button the crab hugs from the side */
.cpb-icon .cpb-face { width: var(--cpb-h); padding: 0; }
.cpb-icon .cpb-glyph { width: calc(var(--cpb-h) * 0.44); height: calc(var(--cpb-h) * 0.44); }
.cpb-root-icon .cpb-crab { left: calc(var(--cpb-h) * 0.2); top: calc(var(--cpb-h) * 0.14 - var(--cpb-cw) * 0.4333); transform: rotate(-40deg); }
.cpb-root-icon[data-live="hover"] .cpb-crab { transform: rotate(-40deg) translateY(calc(var(--cpb-cw) * -0.05)); }
.cpb-root-icon[data-live="press"] .cpb-crab { transform: rotate(-40deg) translateY(calc(var(--cpb-cw) * 0.03)) scale(1.06, 0.86); }

/* toggle */
.cpb-switch .cpb-face { padding: 0; width: calc(var(--cpb-h) * 2.05); justify-content: flex-start; background: linear-gradient(180deg, var(--cpb-ttop), var(--cpb-tbase) 50%, var(--cpb-tbottom)); border-color: var(--cpb-tline); transition: background 0.35s ease, border-color 0.35s ease, transform 0.18s ease; }
.cpb-switch[aria-checked="true"] .cpb-face { background: linear-gradient(180deg, var(--cpb-top), var(--cpb-base) 46%, var(--cpb-bottom)); border-color: var(--cpb-line); }
.cpb-switch:not(:disabled):hover .cpb-face { filter: brightness(1.03); }
.cpb-knob { position: absolute; top: 50%; left: calc(var(--cpb-h) * 0.09); width: calc(var(--cpb-h) * 0.76); height: calc(var(--cpb-h) * 0.76); margin-top: calc(var(--cpb-h) * -0.38); border-radius: 50%; background: radial-gradient(circle at 40% 30%, #ffffff, #f1efea 55%, #d9d5cc); box-shadow: inset 0 -2px 3px rgba(0, 0, 0, 0.12), inset 0 2px 1px #fff, 0 3px 8px rgba(0, 0, 0, 0.3), 0 1px 1px rgba(0, 0, 0, 0.2); transition: transform 0.42s cubic-bezier(0.3, 0.9, 0.3, 1.25), width 0.2s ease; }
.cpb-switch[aria-checked="true"] .cpb-knob { transform: translateX(calc(var(--cpb-h) * 1.11)); }
.cpb-switch:not(:disabled):active .cpb-knob { width: calc(var(--cpb-h) * 0.9); }
.cpb-switch[aria-checked="true"]:not(:disabled):active .cpb-knob { transform: translateX(calc(var(--cpb-h) * 0.97)); }
.cpb-root-switch .cpb-crab { transition: left 0.5s cubic-bezier(0.4, 0.1, 0.3, 1), transform 0.45s cubic-bezier(0.3, 0.8, 0.3, 1.35); }
.cpb-root-switch[data-hop="a"] .cpb-crab-back, .cpb-root-switch[data-hop="a"] .cpb-crab-front { animation: cpb-hop-a 0.5s cubic-bezier(0.3, 0.6, 0.4, 1); }
.cpb-root-switch[data-hop="b"] .cpb-crab-back, .cpb-root-switch[data-hop="b"] .cpb-crab-front { animation: cpb-hop-b 0.5s cubic-bezier(0.3, 0.6, 0.4, 1); }

/* dropdown */
.cpb-select .cpb-face { justify-content: space-between; min-width: calc(var(--cpb-h) * 3.6); }
.cpb-chev { transition: transform 0.3s cubic-bezier(0.3, 0.8, 0.3, 1.4); }
.cpb-select[aria-expanded="true"] .cpb-chev { transform: rotate(180deg); }
.cpb-list { position: absolute; z-index: 20; left: 0; right: 0; top: calc(100% + 10px); margin: 0; padding: 6px; list-style: none; border-radius: calc(var(--cpb-h) * 0.36); background: linear-gradient(180deg, #ffffff, #f4f1eb); border: 1.5px solid var(--cpb-line); box-shadow: 0 18px 40px -16px rgba(20, 16, 10, 0.45), 0 2px 6px rgba(20, 16, 10, 0.12), inset 0 1px 0 #fff; color: #23241f; font-size: calc(var(--cpb-h) * 0.29); transform-origin: 50% 0; animation: cpb-drop 0.26s cubic-bezier(0.3, 0.8, 0.3, 1.25); max-height: 280px; overflow: auto; outline: none; box-sizing: border-box; }
.cpb-opt { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: calc(var(--cpb-h) * 0.2) calc(var(--cpb-h) * 0.26); border-radius: calc(var(--cpb-h) * 0.24); cursor: pointer; transition: background 0.15s ease; }
.cpb-opt[data-active] { background: rgba(86, 99, 65, 0.12); background: color-mix(in srgb, var(--cpb-accent) 14%, transparent); }
.cpb-opt[aria-selected="true"] { font-weight: 600; }
.cpb-tick { width: 16px; height: 16px; flex: none; color: var(--cpb-accent); }
.cpb-root-select[data-open] .cpb-crab { transform: translateY(calc(var(--cpb-cw) * -0.03)); }

@keyframes cpb-breathe { 0%, 100% { translate: 0 0; } 50% { translate: 0 -1.1%; } }
@keyframes cpb-drift-l { 0%, 18%, 100% { transform: none; } 24%, 44% { transform: translate(-8.5%, 1.8%); } 52%, 70% { transform: translate(4.2%, -2.9%) rotate(-3deg); } 78% { transform: none; } }
@keyframes cpb-drift-r { 0%, 30%, 100% { transform: none; } 36%, 58% { transform: translate(7.8%, 1.4%) rotate(3deg); } 66%, 84% { transform: translate(-3.5%, -3.2%); } 90% { transform: none; } }
@keyframes cpb-twitch-a { 0%, 22%, 30%, 64%, 70%, 100% { transform: none; } 25% { transform: rotate(-11deg); } 27% { transform: rotate(-4deg); } 67% { transform: rotate(7deg); } }
@keyframes cpb-twitch-b { 0%, 40%, 47%, 80%, 86%, 100% { transform: none; } 43% { transform: rotate(10deg); } 45% { transform: rotate(3deg); } 83% { transform: rotate(-8deg); } }
@keyframes cpb-flick-l { 0%, 100% { transform: none; } 30% { transform: rotate(-14deg); } 45% { transform: rotate(-4deg); } 60% { transform: rotate(-12deg); } }
@keyframes cpb-flick-r { 0%, 100% { transform: none; } 35% { transform: rotate(14deg); } 50% { transform: rotate(5deg); } 65% { transform: rotate(11deg); } }
@keyframes cpb-chew-l { 0%, 55%, 100% { transform: none; } 18% { transform: rotate(-5deg); } 32% { transform: rotate(-1deg); } 44% { transform: rotate(-4deg); } }
@keyframes cpb-chew-r { 0%, 55%, 100% { transform: none; } 18% { transform: rotate(5deg); } 32% { transform: rotate(1deg); } 44% { transform: rotate(4deg); } }
@keyframes cpb-shift { from { rotate: -1.4deg; } to { rotate: 1.4deg; } }
@keyframes cpb-rap-l { 0%, 100% { transform: none; } 20%, 60% { transform: rotate(-16deg); } 40%, 80% { transform: rotate(2deg); } }
@keyframes cpb-rap-r { 0%, 100% { transform: none; } 20%, 60% { transform: rotate(16deg); } 40%, 80% { transform: rotate(-2deg); } }
@keyframes cpb-wipe-arm { 0%, 100% { transform: none; } 22%, 78% { transform: rotate(30deg); } }
@keyframes cpb-wipe-hand { 0%, 100% { transform: none; } 22% { transform: rotate(-121deg); } 34% { transform: rotate(-110deg); } 46% { transform: rotate(-126deg); } 58% { transform: rotate(-110deg); } 70%, 78% { transform: rotate(-121deg); } }
@keyframes cpb-squint { 0%, 100% { scale: 1 1; } 25%, 75% { scale: 1 0.45; } }
@keyframes cpb-stretch { 0%, 100% { translate: 0 0; } 35%, 60% { translate: 0 -5%; } }
@keyframes cpb-reach-l { 0%, 100% { transform: none; } 35%, 60% { transform: rotate(14deg); } }
@keyframes cpb-reach-r { 0%, 100% { transform: none; } 35%, 60% { transform: rotate(-14deg); } }
@keyframes cpb-duck { 0%, 100% { translate: 0 0; } 20%, 70% { translate: 0 10%; } }
@keyframes cpb-peep { 0%, 100% { transform: none; } 20%, 70% { transform: translateY(-14%); } }
@keyframes cpb-cheer { 0%, 100% { translate: 0 0; } 40% { translate: 0 -9%; } 70% { translate: 0 1%; } }
@keyframes cpb-blink { 0%, 91%, 96%, 100% { scale: 1 1; } 93.5% { scale: 1 0.08; } }
@keyframes cpb-tap-r { 0%, 80%, 100% { transform: none; } 83% { transform: rotate(14deg); } 86% { transform: none; } 89% { transform: rotate(14deg); } 92% { transform: none; } }
@keyframes cpb-snip-l { 0%, 100% { transform: none; } 50% { transform: rotate(-24deg); } }
@keyframes cpb-snip-r { 0%, 100% { transform: none; } 50% { transform: rotate(24deg); } }
@keyframes cpb-patter { from { transform: rotate(-4deg) translateY(-0.6%); } to { transform: rotate(4deg) translateY(0.6%); } }
@keyframes cpb-drum-l { from { transform: rotate(-3deg); } to { transform: rotate(12deg); } }
@keyframes cpb-drum-r { from { transform: rotate(3deg); } to { transform: rotate(-12deg); } }
@keyframes cpb-wave { 0%, 100% { transform: rotate(35deg); } 50% { transform: rotate(20deg); } }
@keyframes cpb-dot { 0%, 100% { opacity: 0.3; transform: translateY(0); } 40% { opacity: 1; transform: translateY(-3px); } }
@keyframes cpb-bubble { 0% { opacity: 0; transform: translate(0, 0) scale(0.3); } 15% { opacity: 1; } 100% { opacity: 0; transform: translate(var(--cpb-bx), var(--cpb-by)) scale(1); } }
@keyframes cpb-zz { 0% { opacity: 0; transform: translate(0, 0) scale(0.6); } 25% { opacity: 1; } 100% { opacity: 0; transform: translate(12px, -26px) scale(1.15); } }
@keyframes cpb-hop-a { 0%, 100% { translate: 0 0; } 45% { translate: 0 calc(var(--cpb-cw) * -0.2); } }
@keyframes cpb-hop-b { 0%, 100% { translate: 0 0; } 45% { translate: 0 calc(var(--cpb-cw) * -0.2); } }
@keyframes cpb-drop { from { opacity: 0; transform: translateY(-6px) scale(0.96); } to { opacity: 1; transform: none; } }

@media (prefers-reduced-motion: reduce) {
  .cpb-eye, .cpb-ant, .cpb-antule, .cpb-plate, .cpb-arm, .cpb-hand, .cpb-finger, .cpb-legs, .cpb-crab-back, .cpb-crab-front, .cpb-solo, .cpb-solo-front, .cpb-zz > span, .cpb-dots > i { animation: none !important; }
  .cpb-crab, .cpb-arm, .cpb-hand, .cpb-finger, .cpb-stand, .cpb-eye, .cpb-knob, .cpb-face, .cpb-glyph, .cpb-chev { transition-duration: 0.01s !important; }
  .cpb-bubble { display: none; }
  .cpb-list { animation: none; }
}
`

function Styles() {
  return <style>{CPB_CSS}</style>
}

// ---------------------------------------------------------------------------
// Shared behaviour: where the crab walks, where it looks, how it feels.

interface Bubble {
  id: number
  x: number
  y: number
  s: number
  t: number
}

const reduced = () => typeof window !== "undefined" && !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches

// Motion is written straight onto the few elements that move. A custom
// property on the root would be inherited by every lit SVG layer below it and
// make the browser repaint (and re-light) all of them on each pointer move.
function setEyes(root: HTMLElement, x: number, y: number) {
  const v = (x * 2.94).toFixed(2) + "% " + (y * 2.38).toFixed(2) + "%"
  root.querySelectorAll(".cpb-eye").forEach((n) => ((n as HTMLElement).style.translate = v))
}
function setSpot(root: HTMLElement, xf: number, lean = 0) {
  const left = (xf * 100).toFixed(3) + "%"
  root.querySelectorAll(".cpb-crab, .cpb-bubbles").forEach((n) => {
    const e = n as HTMLElement
    e.style.left = left
    if (e.classList.contains("cpb-crab")) e.style.rotate = lean ? lean.toFixed(2) + "deg" : ""
  })
}

function useCrab(opts: {
  rootRef: React.RefObject<HTMLSpanElement | null>
  home: number
  crabW: number
  follow: boolean
  forced?: CrabMood
  disabled?: boolean
  rotated?: boolean
  /** How far the crab is turned, in degrees, so its eyes still find the pointer. */
  tilt?: number
  /** Where the eyes rest when nothing is near: [x, y] in drawing units. */
  rest?: number[]
  /** Watch the pointer from anywhere nearby, not just over the button. */
  track?: boolean
  /** peek: perched on an edge. stand: on its own legs (the left claw is busy waving). */
  pose?: CrabPose
}) {
  const { rootRef, home, crabW, follow, forced, disabled, rotated, tilt = 0, track = true, pose = "peek" } = opts
  const anim = React.useRef({ x: -1, tx: -1, raf: 0, width: 0, lean: 0 })
  const restRef = React.useRef([0, 0])
  restRef.current = opts.rest || [0, 0]
  const trackingRef = React.useRef(false)
  const [bubbles, setBubbles] = React.useState([] as Bubble[])
  const bubbleId = React.useRef(0)
  const phase = React.useMemo(() => -Math.random() * 6 + "s", [])

  const setLive = React.useCallback(
    (mood: CrabMood | null) => {
      const el = rootRef.current
      if (!el) return
      const m = forced || (disabled ? "sleep" : mood)
      if (m && m !== "idle") {
        el.setAttribute("data-live", m)
        el.removeAttribute("data-idle")
      } else el.removeAttribute("data-live")
    },
    [forced, disabled, rootRef],
  )

  const tick = React.useCallback(() => {
    const el = rootRef.current
    const a = anim.current
    a.raf = 0
    if (!el || !a.width) return
    const k = reduced() ? 1 : 0.16
    const prev = a.x
    a.x += (a.tx - a.x) * k
    const v = a.x - prev
    a.lean += (cpbClamp(v * 1.4, -9, 9) - a.lean) * 0.25
    setSpot(el, a.x / a.width, a.lean)
    const moving = Math.abs(a.tx - a.x) > 1.2
    if (moving && !reduced()) el.setAttribute("data-walk", "")
    else el.removeAttribute("data-walk")
    if (Math.abs(a.tx - a.x) > 0.3 || Math.abs(a.lean) > 0.05) a.raf = requestAnimationFrame(tick)
    else {
      a.x = a.tx
      a.lean = 0
      setSpot(el, a.x / a.width)
      el.removeAttribute("data-walk")
    }
  }, [rootRef])

  const walkTo = React.useCallback(
    (px: number | null) => {
      const el = rootRef.current
      if (!el) return
      const a = anim.current
      a.width = el.offsetWidth
      const [lo, hi] = cpbRange(a.width, crabW)
      a.tx = cpbClamp(px == null ? home * a.width : px, lo, hi)
      if (a.x < 0) a.x = cpbClamp(home * a.width, lo, hi)
      if (!a.raf) a.raf = requestAnimationFrame(tick)
    },
    [rootRef, crabW, home, tick],
  )

  // settle at home, and re-settle whenever home moves (toggle) or the box resizes
  React.useEffect(() => {
    const el = rootRef.current
    if (!el || rotated) return
    const a = anim.current
    const place = () => {
      a.width = el.offsetWidth
      const [lo, hi] = cpbRange(a.width, crabW)
      const hx = cpbClamp(home * a.width, lo, hi)
      if (a.x < 0) {
        a.x = a.tx = hx
        setSpot(el, hx / a.width)
      }
    }
    place()
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(place) : null
    ro?.observe(el)
    return () => {
      ro?.disconnect()
      cancelAnimationFrame(a.raf)
      a.raf = 0
    }
  }, [rootRef, crabW, home, rotated])

  React.useEffect(() => {
    setLive(null)
  }, [setLive])

  const look = React.useCallback(
    (cx: number | null, cy?: number) => {
      const el = rootRef.current
      if (!el) return
      const set = (x: number, y: number) => {
        setEyes(el, x, y)
      }
      if (cx == null) return set(restRef.current[0], restRef.current[1])
      // the eyes, in page space: a fifth of the way down the drawing
      const box = (el.querySelector(".cpb-crab-back, .cpb-solo") as HTMLElement | null) || el
      const r = box.getBoundingClientRect()
      let dx = cx - (r.left + r.width / 2)
      let dy = (cy ?? 0) - (r.top + r.height * 0.21)
      if (tilt) {
        // turn the vector into the crab's own frame
        const t = (-tilt * Math.PI) / 180
        const x = dx * Math.cos(t) - dy * Math.sin(t)
        dy = dx * Math.sin(t) + dy * Math.cos(t)
        dx = x
      }
      const len = Math.hypot(dx, dy) || 1
      const m = Math.min(1, len / 60) * 3.2
      set((dx / len) * m, (dy / len) * m * 0.8)
    },
    [rootRef, tilt],
  )

  // the eyes follow the pointer anywhere near the crab, and settle back when it goes
  React.useEffect(() => {
    if (!track || reduced()) return
    let raf = 0
    let px = 0
    let py = 0
    const apply = () => {
      raf = 0
      const el = rootRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const near = px > r.left - 380 && px < r.right + 380 && py > r.top - 320 && py < r.bottom + 320
      if (near || trackingRef.current) look(near ? px : null, py)
      trackingRef.current = near
    }
    const onMove = (e: PointerEvent) => {
      px = e.clientX
      py = e.clientY
      if (!raf) raf = requestAnimationFrame(apply)
    }
    window.addEventListener("pointermove", onMove, { passive: true })
    return () => {
      window.removeEventListener("pointermove", onMove)
      cancelAnimationFrame(raf)
    }
  }, [track, look, rootRef])

  // something to do every few seconds, so the crab is never quite still
  React.useEffect(() => {
    const el = rootRef.current
    if (!el || forced || reduced()) return
    let visible = true
    const io = typeof IntersectionObserver !== "undefined" ? new IntersectionObserver((es) => (visible = es[es.length - 1].isIntersecting)) : null
    io?.observe(el)
    const acts =
      pose === "stand"
        ? ["flex", "look", "bubble", "tap-r", "flex", "look"]
        : ["tap-l", "tap-r", "flex", "look", "wipe", "stretch", "bubble", "look"].concat(rotated ? [] : ["duck"], follow && !rotated ? ["shuffle", "shuffle"] : [])
    let t1 = 0
    let t2 = 0
    const busy = () => el.hasAttribute("data-live") || el.hasAttribute("data-walk") || el.hasAttribute("data-cheer")
    const act = () => {
      if (visible && !document.hidden && !busy()) {
        const a = acts[Math.floor(Math.random() * acts.length)]
        if (a === "look") {
          if (!trackingRef.current) {
            setEyes(el, (Math.random() - 0.5) * 6, (Math.random() - 0.6) * 4)
            t2 = window.setTimeout(() => !trackingRef.current && look(null), 1300 + Math.random() * 900)
          }
        } else if (a === "shuffle") {
          const w = el.offsetWidth
          walkTo((home + (Math.random() < 0.5 ? -1 : 1) * (0.1 + Math.random() * 0.08)) * w)
          t2 = window.setTimeout(() => !el.hasAttribute("data-live") && walkTo(null), 1000 + Math.random() * 700)
        } else if (a === "bubble") {
          blow(true)
        } else {
          el.setAttribute("data-idle", a)
          t2 = window.setTimeout(() => el.removeAttribute("data-idle"), 1950)
        }
      }
      t1 = window.setTimeout(act, 2000 + Math.random() * 3800)
    }
    t1 = window.setTimeout(act, 900 + Math.random() * 2600)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      io?.disconnect()
      el.removeAttribute("data-idle")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forced, pose, rotated, follow, home, rootRef, look, walkTo])

  const handlers = {
    onPointerEnter: (e: React.PointerEvent) => {
      if (disabled) return
      setLive("hover")
      onMove(e)
    },
    onPointerMove: (e: React.PointerEvent) => onMove(e),
    onPointerLeave: () => {
      if (disabled) return
      setLive(null)
      if (follow && !rotated) walkTo(null)
    },
    onPointerDown: (e: React.PointerEvent) => {
      if (disabled || e.button !== 0) return
      setLive("press")
    },
    onPointerUp: (e: React.PointerEvent) => {
      if (disabled) return
      setLive(e.pointerType === "mouse" ? "hover" : null)
    },
    onPointerCancel: () => setLive(null),
    onFocus: (e: React.FocusEvent) => {
      if (disabled) return
      const t = e.target as HTMLElement
      if (t.matches && t.matches(":focus-visible")) setLive("hover")
    },
    onBlur: () => setLive(null),
    onKeyDown: (e: React.KeyboardEvent) => {
      if (disabled || e.repeat) return
      if (e.key === " " || e.key === "Enter") setLive("press")
    },
    onKeyUp: (e: React.KeyboardEvent) => {
      if (disabled) return
      if (e.key === " " || e.key === "Enter") setLive("hover")
    },
  }

  function onMove(e: React.PointerEvent) {
    if (disabled || forced) return
    const el = rootRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const px = e.clientX - r.left
    const a = anim.current
    const cur = a.x >= 0 ? a.x : home * r.width
    el.setAttribute("data-side", rotated ? "r" : px < cur ? "l" : "r")
    if (follow && !rotated && e.pointerType !== "touch") walkTo(px)
    if (!track || e.pointerType === "touch") look(e.clientX, e.clientY)
  }

  /** A handful of bubbles from the mouth; `small` is the idle burp. */
  const blow = React.useCallback(
    (small?: boolean) => {
      if (reduced()) return
      const n = small ? 2 + Math.floor(Math.random() * 2) : 3 + Math.floor(Math.random() * 3)
      const next: Bubble[] = []
      for (let i = 0; i < n; i++) {
        next.push({
          id: ++bubbleId.current,
          x: (Math.random() - 0.5) * crabW * (small ? 0.12 : 0.5),
          y: -crabW * (small ? 0.12 + Math.random() * 0.16 : 0.28 + Math.random() * 0.32),
          s: small ? 3 + Math.random() * 3 : 5 + Math.random() * 7,
          t: small ? 1.1 + Math.random() * 0.6 : 0.9 + Math.random() * 0.7,
        })
      }
      setBubbles((b) => b.concat(next).slice(-14))
    },
    [crabW],
  )

  const cheerT = React.useRef(0)
  /** A happy hop and a double snip, for a click. */
  const cheer = React.useCallback(() => {
    const el = rootRef.current
    if (!el || reduced()) return
    el.removeAttribute("data-cheer")
    void el.offsetWidth
    el.setAttribute("data-cheer", "")
    clearTimeout(cheerT.current)
    cheerT.current = window.setTimeout(() => el.removeAttribute("data-cheer"), 650)
  }, [rootRef])
  React.useEffect(() => () => clearTimeout(cheerT.current), [])

  const pop = React.useCallback((id: number) => setBubbles((b) => b.filter((x) => x.id !== id)), [])

  return { handlers, phase, bubbles, blow, cheer, pop, look, walkTo, setLive }
}

function Bubbles({ items, pop }: { items: Bubble[]; pop: (id: number) => void }) {
  return (
    <>
      {items.map((b, i) => (
        <span
          key={b.id}
          className="cpb-bubble"
          aria-hidden="true"
          onAnimationEnd={() => pop(b.id)}
          style={
            {
              "--cpb-bs": b.s + "px",
              "--cpb-bx": b.x + "px",
              "--cpb-by": b.y + "px",
              "--cpb-bt": b.t + "s",
              animationDelay: i % 5 === 0 ? "0s" : (i % 5) * 0.06 + "s",
            } as React.CSSProperties
          }
        />
      ))}
    </>
  )
}

function Swish() {
  return (
    <svg className="cpb-plane cpb-swish" viewBox={VB} aria-hidden="true" focusable="false">
      <g stroke="currentColor" strokeWidth={3.4} strokeLinecap="round" fill="none">
        <path d="M58 -22L68 -36" />
        <path d="M74 -10L90 -17" />
      </g>
    </svg>
  )
}

function Perch({ uid, shell, children }: { uid: string; shell: string; children?: React.ReactNode }) {
  return (
    <>
      <span className="cpb-crab cpb-crab-back" aria-hidden="true">
        <CrabArt layer="back" pose="peek" uid={uid} shell={shell} />
      </span>
      <span className="cpb-crab cpb-crab-front" aria-hidden="true">
        <CrabArt layer="front" pose="peek" uid={uid} shell={shell} />
        {children}
      </span>
    </>
  )
}

function Sleep({ crabW }: { crabW: number }) {
  return (
    <span className="cpb-zz" aria-hidden="true" style={{ left: "calc(var(--cpb-xf, 0.5) * 100% + " + Math.round(crabW * 0.16) + "px)", top: -Math.round(crabW * 0.3) }}>
      <span>z</span>
      <span>z</span>
    </span>
  )
}

function paint(surface: string, ink: string | undefined, shell: string, h: number, crabW: number) {
  const f = cpbFace(surface, ink)
  return {
    "--cpb-h": h + "px",
    "--cpb-cw": crabW + "px",
    "--cpb-top": f.top,
    "--cpb-base": f.base,
    "--cpb-bottom": f.bottom,
    "--cpb-line": f.line,
    "--cpb-ink": f.ink,
    "--cpb-oink": ink || (f.light ? "#22241e" : cpbShade(surface, -0.55)),
    "--cpb-gink": ink || "color-mix(in oklab, var(--color-foreground, #23241f) 72%, " + (f.light ? "#5b584f" : surface) + ")",
    "--cpb-ring": f.light ? cpbShade(surface, -0.45) : surface,
    "--cpb-accent": f.light ? "#566341" : surface,
    "--cpb-mark": "var(--color-foreground, #23241f)",
    "--cpb-shell": shell,
  } as React.CSSProperties
}

// ---------------------------------------------------------------------------
// CrabButton

export interface CrabButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "color"> {
  /** solid (default) · outline · ghost (the crab stands beside the label) · icon (round, the crab hugs it). */
  variant?: "solid" | "outline" | "ghost" | "icon"
  /** sm 44px · md 56px · lg 68px tall. */
  size?: CrabSize
  /** Leading icon. */
  icon?: React.ReactNode
  /** Trailing icon. Defaults to an arrow; `null` hides it. For `icon`, this is the glyph in the circle. */
  trailing?: React.ReactNode | null
  /** Shell colour: a preset (red, blue, gold, pearl, violet, mint) or any hex. */
  crab?: CrabColor
  /** Button colour: a preset (moss, ink, clay, sea, plum, sand) or any hex. */
  tone?: CrabTone
  /** Label colour. Picked for contrast with `tone` when left out. */
  ink?: string
  /** Where the crab sits along the edge when nothing is happening, 0–1. */
  crabAt?: number
  /** Scale the crab, 1 = default. */
  crabScale?: number
  /** Scuttle along the edge after the pointer. */
  follow?: boolean
  /** Bubbles on click. */
  bubbles?: boolean
  /** Hide the crab and keep the button. */
  hideCrab?: boolean
  /** Drum the claws and mark the button busy. Clicks still fire unless you also disable it. */
  loading?: boolean
  /** Freeze a pose, for docs and showcases. The button still works. */
  state?: CrabMood
}

function CrabButtonImpl(props: CrabButtonProps, ref: React.ForwardedRef<HTMLButtonElement>) {
  const {
    variant = "solid",
    size = "md",
    icon,
    trailing,
    crab = "red",
    tone = "moss",
    ink,
    crabAt,
    crabScale = 1,
    follow = true,
    bubbles = true,
    hideCrab = false,
    loading = false,
    state,
    disabled,
    children,
    className = "",
    style,
    onClick,
    type = "button",
    ...rest
  } = props

  const h = CPB_SIZES[size] || CPB_SIZES.md
  const icon_ = variant === "icon"
  const ghost = variant === "ghost"
  const crabW = Math.round(h * (icon_ ? 1.85 : ghost ? 2.5 : 2.85) * crabScale)
  const shell = cpbPick(CPB_CRABS, crab, "red")
  const surface = cpbPick(CPB_TONES, tone, "moss")
  const uid = uidOf(React.useId())
  const rootRef = React.useRef(null as HTMLSpanElement | null)
  const home = crabAt ?? 0.42

  const c = useCrab({ rootRef, home, crabW, follow: follow && !ghost, forced: state, disabled: !!disabled, rotated: icon_, tilt: icon_ ? -40 : ghost ? -9 : 0, pose: ghost ? "stand" : "peek" })

  React.useEffect(() => {
    const el = rootRef.current
    if (!el || state !== "hover") return
    el.setAttribute("data-side", "r")
    setEyes(el, 2.6, 1.4)
  }, [state])

  const trail = trailing === undefined ? <ArrowGlyph /> : trailing
  const vars = paint(surface, ink, shell, h, crabW)

  return (
    <span
      ref={rootRef}
      className={"cpb-root cpb-root-" + variant + (className ? " " + className : "")}
      style={{ ...vars, "--cpb-phase": c.phase, "--cpb-xf": String(home), ...style } as React.CSSProperties}
      data-busy={loading ? "" : undefined}
      {...(c.handlers as object)}
    >
      <Styles />
      {!hideCrab && !ghost && <Perch uid={uid} shell={shell} />}
      {!hideCrab && !ghost && disabled && <Sleep crabW={crabW} />}
      <button
        ref={ref}
        type={type}
        className={"cpb-btn cpb-" + variant}
        disabled={disabled}
        aria-busy={loading || undefined}
        data-state={state}
        onClick={(e) => {
          if (bubbles && !hideCrab) c.blow()
          if (!hideCrab) c.cheer()
          onClick?.(e)
        }}
        {...rest}
      >
        <span className="cpb-face">
          {icon_ ? (
            <>
              <span className="cpb-glyph">{trail ?? icon}</span>
              {children != null && <span className="cpb-sr">{children}</span>}
            </>
          ) : (
            <>
              {icon && <span className="cpb-glyph cpb-lead">{icon}</span>}
              {children != null && <span className="cpb-label">{children}</span>}
              {loading ? (
                <span className="cpb-dots" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
              ) : (
                trail && <span className="cpb-glyph cpb-trail">{trail}</span>
              )}
              {ghost && !hideCrab && (
                <span className="cpb-stand" aria-hidden="true">
                  <span className="cpb-solo">
                    <CrabArt layer="back" pose="stand" uid={uid} shell={shell} />
                  </span>
                  <span className="cpb-solo-front">
                    <CrabArt layer="front" pose="stand" uid={uid} shell={shell} />
                  </span>
                  <Swish />
                </span>
              )}
            </>
          )}
        </span>
      </button>
      {!ghost && <span className="cpb-bubbles" aria-hidden="true" style={{ position: "absolute", left: "calc(var(--cpb-xf) * 100%)", top: 0 }}><Bubbles items={c.bubbles} pop={c.pop} /></span>}
      {ghost && <span aria-hidden="true" style={{ position: "absolute", right: h * 0.85, top: h * 0.3 }}><Bubbles items={c.bubbles} pop={c.pop} /></span>}
    </span>
  )
}

/** A button with a crab perched on it. */
export const CrabButton = React.forwardRef(CrabButtonImpl)
CrabButton.displayName = "CrabButton"
export default CrabButton

// ---------------------------------------------------------------------------
// CrabToggle

export interface CrabToggleProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "color" | "onChange" | "defaultChecked"> {
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
  size?: CrabSize
  crab?: CrabColor
  /** Track colour when on. */
  tone?: CrabTone
  /** Track colour when off. */
  offTone?: string
  /** Freeze a pose, for docs and showcases. */
  state?: CrabMood
}

export function CrabToggle(props: CrabToggleProps) {
  const {
    checked,
    defaultChecked = false,
    onCheckedChange,
    size = "md",
    crab = "red",
    tone = "moss",
    offTone = "#d9d4ca",
    state,
    disabled,
    className = "",
    style,
    onClick,
    ...rest
  } = props
  const [inner, setInner] = React.useState(defaultChecked)
  const on = checked ?? inner
  const [hop, setHop] = React.useState("")
  const h = (CPB_SIZES[size] || CPB_SIZES.md) - 4
  const crabW = Math.round(h * 2.5)
  const shell = cpbPick(CPB_CRABS, crab, "red")
  const surface = cpbPick(CPB_TONES, tone, "moss")
  const uid = uidOf(React.useId())
  const rootRef = React.useRef(null as HTMLSpanElement | null)
  // the crab sits on the side away from the knob, and hops over it
  const home = on ? 0.36 : 0.64
  const c = useCrab({ rootRef, home, crabW, follow: false, forced: state, disabled: !!disabled, rest: on ? [3, 1.6] : [-3, 1.6] })

  // move along the track, and look at the knob
  React.useEffect(() => {
    const el = rootRef.current
    if (!el) return
    setSpot(el, home)
    c.look(null)
  }, [on, home, c.look])

  const off = cpbFace(offTone)
  const vars = {
    ...paint(surface, undefined, shell, h, crabW),
    "--cpb-ttop": off.top,
    "--cpb-tbase": off.base,
    "--cpb-tbottom": off.bottom,
    "--cpb-tline": off.line,
  } as React.CSSProperties

  return (
    <span
      ref={rootRef}
      className={"cpb-root cpb-root-switch" + (className ? " " + className : "")}
      style={{ ...vars, "--cpb-phase": c.phase, "--cpb-xf": String(home), ...style } as React.CSSProperties}
      data-hop={hop || undefined}
      onPointerEnter={c.handlers.onPointerEnter}
      onPointerLeave={c.handlers.onPointerLeave}
      onPointerDown={c.handlers.onPointerDown}
      onPointerUp={c.handlers.onPointerUp}
      onPointerCancel={c.handlers.onPointerCancel}
      onFocus={c.handlers.onFocus}
      onBlur={c.handlers.onBlur}
      onKeyDown={c.handlers.onKeyDown}
      onKeyUp={c.handlers.onKeyUp}
    >
      <Styles />
      <Perch uid={uid} shell={shell} />
      {disabled && <Sleep crabW={crabW} />}
      <button
        type="button"
        role="switch"
        aria-checked={on}
        className="cpb-btn cpb-switch cpb-solid"
        disabled={disabled}
        data-state={state}
        onClick={(e) => {
          const next = !on
          if (checked === undefined) setInner(next)
          setHop(next ? "a" : "b")
          onCheckedChange?.(next)
          onClick?.(e)
        }}
        {...rest}
      >
        <span className="cpb-face">
          <span className="cpb-knob" />
        </span>
      </button>
    </span>
  )
}

// ---------------------------------------------------------------------------
// CrabDropdown

export interface CrabOption {
  value: string
  label?: React.ReactNode
  disabled?: boolean
}

export interface CrabDropdownProps {
  options: (string | CrabOption)[]
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  /** Shown on the button until something is chosen. */
  placeholder?: React.ReactNode
  size?: CrabSize
  crab?: CrabColor
  /** Button colour. Defaults to sand. */
  tone?: CrabTone
  ink?: string
  crabAt?: number
  disabled?: boolean
  /** Accessible name for the list. */
  "aria-label"?: string
  className?: string
  style?: React.CSSProperties
  /** Freeze a pose, for docs and showcases. */
  state?: CrabMood
}

export function CrabDropdown(props: CrabDropdownProps) {
  const {
    options,
    value,
    defaultValue,
    onValueChange,
    placeholder = "Button",
    size = "md",
    crab = "red",
    tone = "sand",
    ink,
    crabAt = 0.4,
    disabled,
    className = "",
    style,
    state,
  } = props
  const opts = React.useMemo(() => options.map((o) => (typeof o === "string" ? { value: o, label: o } : o)), [options])
  const [inner, setInner] = React.useState(defaultValue)
  const current = value ?? inner
  const [open, setOpen] = React.useState(false)
  const [active, setActive] = React.useState(-1)
  const h = CPB_SIZES[size] || CPB_SIZES.md
  const crabW = Math.round(h * 2.8)
  const shell = cpbPick(CPB_CRABS, crab, "red")
  const surface = cpbPick(CPB_TONES, tone, "sand")
  const uid = uidOf(React.useId())
  const rootRef = React.useRef(null as HTMLSpanElement | null)
  const btnRef = React.useRef(null as HTMLButtonElement | null)
  const listRef = React.useRef(null as HTMLUListElement | null)
  const typed = React.useRef({ s: "", t: 0 })
  const c = useCrab({ rootRef, home: crabAt, crabW, follow: !open, forced: state, disabled: !!disabled, track: !open })
  const chosen = opts.find((o) => o.value === current)

  const step = React.useCallback(
    (from: number, dir: number) => {
      const n = opts.length
      for (let i = 1; i <= n; i++) {
        const j = (from + dir * i + n * 4) % n
        if (!opts[j].disabled) return j
      }
      return from
    },
    [opts],
  )

  const openList = (at?: number) => {
    if (disabled) return
    const sel = opts.findIndex((o) => o.value === current)
    setActive(at ?? (sel >= 0 ? sel : step(-1, 1)))
    setOpen(true)
  }
  const close = (refocus = true) => {
    setOpen(false)
    if (refocus) btnRef.current?.focus()
  }
  const choose = (i: number) => {
    const o = opts[i]
    if (!o || o.disabled) return
    if (value === undefined) setInner(o.value)
    onValueChange?.(o.value)
    c.blow()
    c.cheer()
    close()
  }

  React.useEffect(() => {
    if (!open) return
    listRef.current?.focus()
    const away = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) close(false)
    }
    document.addEventListener("pointerdown", away)
    // the crab peers down into the list
    const el = rootRef.current
    if (el) {
      el.setAttribute("data-open", "")
      setEyes(el, 0.6, 3.2)
    }
    return () => {
      document.removeEventListener("pointerdown", away)
      if (el) {
        el.removeAttribute("data-open")
        setEyes(el, 0, 0)
      }
    }
  }, [open])

  React.useEffect(() => {
    if (!open || active < 0) return
    const li = listRef.current?.children[active] as HTMLElement | undefined
    li?.scrollIntoView?.({ block: "nearest" })
  }, [open, active])

  const onListKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") (e.preventDefault(), setActive((a) => step(a, 1)))
    else if (e.key === "ArrowUp") (e.preventDefault(), setActive((a) => step(a, -1)))
    else if (e.key === "Home") (e.preventDefault(), setActive(step(-1, 1)))
    else if (e.key === "End") (e.preventDefault(), setActive(step(opts.length, -1)))
    else if (e.key === "Enter" || e.key === " ") (e.preventDefault(), choose(active))
    else if (e.key === "Escape") (e.preventDefault(), close())
    else if (e.key === "Tab") close(false)
    else if (e.key.length === 1) {
      const now = Date.now()
      const t = typed.current
      t.s = (now - t.t > 600 ? "" : t.s) + e.key.toLowerCase()
      t.t = now
      const hit = opts.findIndex((o) => !o.disabled && String(typeof o.label === "string" ? o.label : o.value).toLowerCase().startsWith(t.s))
      if (hit >= 0) setActive(hit)
    }
  }

  const vars = paint(surface, ink, shell, h, crabW)
  const listId = uid + "-list"

  return (
    <span
      ref={rootRef}
      className={"cpb-root cpb-root-select" + (className ? " " + className : "")}
      style={{ ...vars, "--cpb-phase": c.phase, "--cpb-xf": String(crabAt), ...style } as React.CSSProperties}
      onPointerEnter={c.handlers.onPointerEnter}
      onPointerMove={open ? undefined : c.handlers.onPointerMove}
      onPointerLeave={open ? undefined : c.handlers.onPointerLeave}
      onPointerDown={c.handlers.onPointerDown}
      onPointerUp={c.handlers.onPointerUp}
      onPointerCancel={c.handlers.onPointerCancel}
      onFocus={c.handlers.onFocus}
      onBlur={c.handlers.onBlur}
    >
      <Styles />
      <Perch uid={uid} shell={shell} />
      {disabled && <Sleep crabW={crabW} />}
      <button
        ref={btnRef}
        type="button"
        className="cpb-btn cpb-select"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={props["aria-label"]}
        disabled={disabled}
        data-state={state}
        onClick={() => (open ? close() : openList())}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault()
            openList(e.key === "ArrowUp" ? step(opts.length, -1) : undefined)
          }
        }}
      >
        <span className="cpb-face">
          <span className="cpb-label">{chosen ? chosen.label ?? chosen.value : placeholder}</span>
          <span className="cpb-glyph cpb-chev">
            <ChevronGlyph />
          </span>
        </span>
      </button>
      <span className="cpb-bubbles" aria-hidden="true" style={{ position: "absolute", left: "calc(var(--cpb-xf) * 100%)", top: 0 }}>
        <Bubbles items={c.bubbles} pop={c.pop} />
      </span>
      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          tabIndex={-1}
          className="cpb-list"
          aria-label={props["aria-label"]}
          aria-activedescendant={active >= 0 ? uid + "-o" + active : undefined}
          onKeyDown={onListKey}
        >
          {opts.map((o, i) => (
            <li
              key={o.value}
              id={uid + "-o" + i}
              role="option"
              className="cpb-opt"
              aria-selected={o.value === current}
              aria-disabled={o.disabled || undefined}
              data-active={i === active ? "" : undefined}
              style={o.disabled ? { opacity: 0.45, cursor: "not-allowed" } : undefined}
              onPointerEnter={() => !o.disabled && setActive(i)}
              onClick={() => choose(i)}
            >
              <span>{o.label ?? o.value}</span>
              {o.value === current && (
                <svg className="cpb-tick" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
              )}
            </li>
          ))}
        </ul>
      )}
    </span>
  )
}

// ---------------------------------------------------------------------------
// CrabMascot

export interface CrabMascotProps {
  /** Width in px. Height follows (0.625×). */
  size?: number
  crab?: CrabColor
  /** peek: perched on an edge, legs over the front. stand: on its own legs, waving. */
  pose?: CrabPose
  /** Freeze a mood. */
  mood?: CrabMood
  className?: string
  style?: React.CSSProperties
  title?: string
}

/** The crab on its own. Its eyes follow the pointer over it. */
export function CrabMascot({ size = 160, crab = "red", pose = "stand", mood, className = "", style, title }: CrabMascotProps) {
  const shell = cpbPick(CPB_CRABS, crab, "red")
  const uid = uidOf(React.useId())
  const rootRef = React.useRef(null as HTMLSpanElement | null)
  const c = useCrab({ rootRef, home: 0.5, crabW: size, follow: false, forced: mood, tilt: pose === "stand" ? -9 : 0, pose })
  return (
    <span
      ref={rootRef}
      className={"cpb-root" + (className ? " " + className : "")}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      style={{ "--cpb-cw": size + "px", "--cpb-h": size * 0.6 + "px", "--cpb-phase": c.phase, "--cpb-mark": "var(--color-foreground, #23241f)", width: size, height: size * 0.625, ...style } as React.CSSProperties}
      onPointerEnter={c.handlers.onPointerEnter}
      onPointerMove={c.handlers.onPointerMove}
      onPointerLeave={c.handlers.onPointerLeave}
      onPointerDown={(e) => {
        c.handlers.onPointerDown(e)
        c.blow()
        c.cheer()
      }}
      onPointerUp={c.handlers.onPointerUp}
    >
      <Styles />
      <span className={pose === "stand" ? "cpb-stand" : ""} style={{ position: "relative", display: "block", width: size, height: size * 0.625, margin: 0 }}>
        <span className="cpb-solo">
          <CrabArt layer="back" pose={pose} uid={uid} shell={shell} />
        </span>
        <span className="cpb-solo-front">
          <CrabArt layer="front" pose={pose} uid={uid} shell={shell} />
        </span>
        {pose === "stand" && <Swish />}
      </span>
      <span aria-hidden="true" style={{ position: "absolute", left: "50%", top: size * 0.3 }}>
        <Bubbles items={c.bubbles} pop={c.pop} />
      </span>
    </span>
  )
}
