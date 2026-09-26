"use client"

import { useEffect, useRef, useState } from "react"
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from "react"

/**
 * Chrome Dragon Poster: a liquid-chrome eastern dragon coiled in an S across a
 * blue sky, pinned in front of a huge red four-point star.
 *
 * Nothing in it is an asset. The dragon is a rig of tapered tubes: body,
 * skull, horns, mane, fins, claws, teeth and a red whisker. It is rebuilt on
 * the CPU every frame and shaded per pixel in WebGL2 as polished metal: each
 * fragment rebuilds its tube normal, reflects a procedural studio sky, and gets
 * fish scales, an ink rim and a pointer light. The sky, the stars, the lens
 * streaks, the glints and the film grain are shaders too. React is the only
 * import.
 *
 * Move the pointer and the chrome turns under the light, the head tracks you,
 * and the glints you pass flare. Click (or press Enter) and the dragon roars:
 * the jaw drops, a pulse rolls down the body to the tail, the star flares and
 * sparks burst where you clicked.
 */

export type ChromeDragonMetal = "obsidian" | "silver" | "gold"

export type ChromeDragonPosterProps = {
  /** The stage. **Must be a definite length.** */
  height?: string
  /** Top of the sky. Hex. */
  skyTop?: string
  /** Bottom of the sky. Hex. */
  skyBottom?: string
  /** The big four-point stars. Hex. */
  star?: string
  /** The hot core inside the main star. Hex. */
  starCore?: string
  /** Whisker, tongue and the eye. Hex. */
  accent?: string
  /** The metal the dragon is cast in. */
  metal?: ChromeDragonMetal
  /** Optional hex that overrides the metal's tint. */
  tint?: string
  /** Film grain strength. 0 disables it. */
  grain?: number
  /** Animation speed multiplier. 0 freezes the idle motion. */
  speed?: number
  /** Poster scale inside the stage. 1 fits the whole poster. */
  zoom?: number
  /** Pointer light, parallax, glint flares and click-to-roar. */
  interactive?: boolean
  /** The head turns toward the pointer. */
  followPointer?: boolean
  /** White sparkles riding the chrome. */
  glints?: boolean
  /** Small top-left title. Empty hides it. */
  title?: string
  /** The vertical mark on the right. Empty hides it. */
  mark?: string
  /** Bottom-left caption. Empty hides it. */
  caption?: string
  /** Called every time the dragon roars. */
  onRoar?: () => void
  className?: string
}

export type Pt = { x: number; y: number; z: number; r: number }

// #region geometry
/** The poster is 600 × 1159 in the art it was drawn from; one unit is 600px. */
export const POSTER_W = 1
export const POSTER_H = 1159 / 600

export function clamp01(x: number) {
  return x > 0 ? (x < 1 ? x : 1) : 0
}

export function smoothstep(a: number, b: number, x: number) {
  if (a === b) return x < a ? 0 : 1
  const t = clamp01((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}

/** "#rgb" or "#rrggbb" to 0–1 floats. Anything else returns the fallback. */
export function hexToRgb(hex: string, fallback: number[]) {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(hex || "").trim())
  if (!m) return fallback.slice(0, 3)
  let h = m[1]
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]
  const n = parseInt(h, 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

/** Uniform Catmull-Rom through every control point. Radius never goes negative. */
export function catmull(pts: Pt[], per: number) {
  const n = pts.length
  if (n < 2) return pts.map((p) => ({ x: p.x, y: p.y, z: p.z, r: p.r }))
  const out: Pt[] = []
  const steps = Math.max(1, Math.floor(per))
  const f = (a: number, b: number, c: number, d: number, t: number) => {
    const t2 = t * t
    return 0.5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (3 * b - a - 3 * c + d) * t2 * t)
  }
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[i > 0 ? i - 1 : 0]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2 < n ? i + 2 : n - 1]
    for (let j = 0; j < steps; j++) {
      const t = j / steps
      out.push({
        x: f(p0.x, p1.x, p2.x, p3.x, t),
        y: f(p0.y, p1.y, p2.y, p3.y, t),
        z: f(p0.z, p1.z, p2.z, p3.z, t),
        r: Math.max(0, f(p0.r, p1.r, p2.r, p3.r, t)),
      })
    }
  }
  const last = pts[n - 1]
  out.push({ x: last.x, y: last.y, z: last.z, r: last.r })
  return out
}

/** Evenly spaced by arc length, so tubes shade and taper without stretching. */
export function resample(pts: Pt[], step: number) {
  const out: Pt[] = []
  if (pts.length === 0) return out
  const st = step > 1e-6 ? step : 1e-6
  const first = pts[0]
  out.push({ x: first.x, y: first.y, z: first.z, r: first.r })
  let carry = 0
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]
    const b = pts[i]
    const seg = Math.hypot(b.x - a.x, b.y - a.y)
    if (seg < 1e-9) continue
    let d = st - carry
    while (d <= seg) {
      const t = d / seg
      out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t, r: a.r + (b.r - a.r) * t })
      d += st
    }
    carry = seg - (d - st)
  }
  const last = pts[pts.length - 1]
  const tail = out[out.length - 1]
  if (Math.hypot(last.x - tail.x, last.y - tail.y) > st * 0.25) out.push({ x: last.x, y: last.y, z: last.z, r: last.r })
  return out
}

/** Cumulative arc length at each point. */
export function arcLengths(pts: Pt[]) {
  const out: number[] = []
  let s = 0
  for (let i = 0; i < pts.length; i++) {
    if (i > 0) s += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y)
    out.push(s)
  }
  return out
}

/**
 * Which side of the curve is the outside of its bend, per point: +1 along the
 * normal (-ty, tx), -1 against it. Fins grow on the outside, like the art.
 */
export function outerSides(pts: Pt[], win: number) {
  const n = pts.length
  const k: number[] = []
  for (let i = 0; i < n; i++) {
    const a = pts[i > 0 ? i - 1 : 0]
    const b = pts[i]
    const c = pts[i + 1 < n ? i + 1 : n - 1]
    k.push((b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x))
  }
  const out: number[] = []
  const w = Math.max(0, Math.floor(win))
  for (let i = 0; i < n; i++) {
    let s = 0
    for (let j = i - w; j <= i + w; j++) s += k[j < 0 ? 0 : j >= n ? n - 1 : j]
    out.push(s > 0 ? -1 : 1)
  }
  return out
}

/** Poster units to stage pixels: contain, centred. */
export function fitPoster(w: number, h: number, zoom: number) {
  const z = zoom > 0 ? zoom : 1
  const s = Math.max(0, Math.min(w / POSTER_W, h / POSTER_H)) * z
  return { s, ox: (w - POSTER_W * s) / 2, oy: (h - POSTER_H * s) / 2 }
}

/** 0 → 1 → 0 over one roar: a fast attack, a long release. */
export function roarEnvelope(t: number, dur: number) {
  const d = dur > 0.05 ? dur : 0.05
  if (!(t > 0) || t >= d) return 0
  const attack = Math.min(0.14, d * 0.2)
  if (t < attack) return smoothstep(0, attack, t)
  return 1 - smoothstep(attack, d, t)
}

/** Index of the point nearest (x, y). */
export function nearestIndex(pts: Pt[], x: number, y: number) {
  let best = 0
  let bd = Infinity
  for (let i = 0; i < pts.length; i++) {
    const d = (pts[i].x - x) * (pts[i].x - x) + (pts[i].y - y) * (pts[i].y - y)
    if (d < bd) {
      bd = d
      best = i
    }
  }
  return best
}
// #endregion

// ---- the rig ---------------------------------------------------------------
// Everything below is traced off the reference in its own pixels (600 wide),
// as [x, y, depth, radius]. Depth runs 0 (far) → 1 (near).

type Rig = number[][]
/** 0 head · 1 jaw · 2 whisker (head + sway) · 3 rides the body · 4 half the jaw */
type Part = { pts: Rig; mat: number; tint: number; group: number }

const MAT_BODY = 0
const MAT_CHROME = 1
const MAT_ACCENT = 2
const MAT_IVORY = 3
const MAT_EYE = 4

const BODY: Rig = [
  [258, 262, 0.55, 28],
  [300, 205, 0.5, 33],
  [365, 168, 0.46, 37],
  [428, 174, 0.46, 40],
  [468, 224, 0.5, 42],
  [478, 292, 0.55, 43],
  [455, 356, 0.62, 44],
  [405, 405, 0.7, 45],
  [330, 446, 0.8, 46],
  [255, 492, 0.85, 46],
  [196, 542, 0.85, 44],
  [158, 594, 0.8, 42],
  [168, 646, 0.7, 40],
  [226, 670, 0.6, 38],
  [305, 642, 0.5, 37],
  [386, 592, 0.45, 37],
  [452, 598, 0.46, 37],
  [484, 652, 0.5, 37],
  [472, 716, 0.56, 36],
  [422, 762, 0.62, 34],
  [342, 786, 0.68, 32],
  [266, 806, 0.72, 30],
  [212, 850, 0.74, 27],
  [198, 915, 0.72, 23],
  [222, 975, 0.68, 18],
  [270, 1024, 0.64, 12],
  [308, 1064, 0.6, 7],
  [322, 1100, 0.58, 2],
]

const HEAD_PIVOT = [262, 276]
const JAW_HINGE = [220, 316]
const HEAD_SCALE = 1.2

const talons = (x: number, y: number, z: number, dirs: number[][]): Part[] =>
  dirs.map(([a, b, c, d]) => ({
    pts: [
      [x, y, z, 4.2],
      [x + a, y + b, z, 2.6],
      [x + c, y + d, z, 0.3],
    ],
    mat: MAT_CHROME,
    tint: 1,
    group: 3,
  }))

const PARTS: Part[] = [
  // Back horn and mane: behind the skull, a little dimmer for depth.
  { pts: [[256, 258, 0.8, 9], [268, 212, 0.8, 8], [288, 168, 0.8, 5], [318, 126, 0.8, 1]], mat: MAT_CHROME, tint: 0.75, group: 0 },
  { pts: [[250, 252, 0.82, 12], [276, 226, 0.82, 10], [296, 196, 0.82, 6], [306, 166, 0.82, 0.5]], mat: MAT_CHROME, tint: 0.85, group: 0 },
  { pts: [[258, 270, 0.82, 12], [292, 258, 0.82, 9], [322, 236, 0.82, 5], [342, 212, 0.82, 0.5]], mat: MAT_CHROME, tint: 0.85, group: 0 },
  { pts: [[256, 292, 0.82, 11], [292, 300, 0.82, 8], [322, 292, 0.82, 4], [342, 278, 0.82, 0.5]], mat: MAT_CHROME, tint: 0.85, group: 0 },
  { pts: [[244, 310, 0.84, 10], [270, 330, 0.84, 7], [286, 352, 0.84, 3.5], [290, 374, 0.84, 0.5]], mat: MAT_CHROME, tint: 0.85, group: 0 },
  // Beard, under the jaw.
  { pts: [[226, 322, 0.86, 9], [236, 350, 0.86, 6], [232, 378, 0.86, 3], [222, 396, 0.86, 0.5]], mat: MAT_CHROME, tint: 0.9, group: 0 },
  { pts: [[206, 334, 0.86, 7], [208, 360, 0.86, 4], [198, 384, 0.86, 0.5]], mat: MAT_CHROME, tint: 0.9, group: 1 },
  // Mouth: the dark inside, the tongue, the jaw and its teeth.
  { pts: [[214, 314, 0.86, 13], [186, 326, 0.86, 11], [160, 337, 0.86, 8]], mat: MAT_ACCENT, tint: 0.28, group: 4 },
  { pts: [[190, 330, 0.885, 4.5], [160, 344, 0.885, 3.8], [130, 356, 0.885, 2.6], [108, 362, 0.885, 1.5], [96, 354, 0.885, 0.5]], mat: MAT_ACCENT, tint: 1, group: 4 },
  { pts: [[224, 318, 0.88, 15], [198, 334, 0.88, 12.5], [172, 347, 0.88, 9], [152, 357, 0.88, 6], [142, 361, 0.88, 3.5]], mat: MAT_CHROME, tint: 0.95, group: 1 },
  { pts: [[190, 336, 0.905, 2.8], [191, 324, 0.905, 0.2]], mat: MAT_IVORY, tint: 1, group: 1 },
  { pts: [[172, 345, 0.905, 2.8], [173, 332, 0.905, 0.2]], mat: MAT_IVORY, tint: 1, group: 1 },
  { pts: [[155, 353, 0.905, 3.4], [156, 336, 0.905, 0.2]], mat: MAT_IVORY, tint: 1, group: 1 },
  { pts: [[182, 320, 0.91, 3], [181, 333, 0.91, 0.2]], mat: MAT_IVORY, tint: 1, group: 0 },
  { pts: [[166, 328, 0.91, 2.8], [165, 340, 0.91, 0.2]], mat: MAT_IVORY, tint: 1, group: 0 },
  { pts: [[152, 334, 0.91, 2.6], [151, 346, 0.91, 0.2]], mat: MAT_IVORY, tint: 1, group: 0 },
  { pts: [[140, 338, 0.91, 3.6], [139, 358, 0.91, 0.2]], mat: MAT_IVORY, tint: 1, group: 0 },
  // Skull, cheek, snout, nose, brow.
  { pts: [[270, 262, 0.9, 28], [244, 272, 0.9, 32], [214, 290, 0.9, 28], [190, 304, 0.9, 21]], mat: MAT_CHROME, tint: 1, group: 0 },
  { pts: [[250, 298, 0.91, 16], [226, 308, 0.91, 15], [204, 318, 0.91, 10]], mat: MAT_CHROME, tint: 0.9, group: 0 },
  { pts: [[200, 298, 0.92, 19], [172, 312, 0.92, 15], [150, 324, 0.92, 12], [134, 333, 0.92, 8]], mat: MAT_CHROME, tint: 1, group: 0 },
  { pts: [[148, 322, 0.94, 6.5], [138, 318, 0.94, 5]], mat: MAT_CHROME, tint: 1.1, group: 0 },
  { pts: [[254, 260, 0.95, 9], [224, 268, 0.95, 8], [198, 284, 0.95, 5], [176, 298, 0.95, 1.5]], mat: MAT_CHROME, tint: 1.1, group: 0 },
  { pts: [[224, 266, 0.94, 7], [208, 242, 0.94, 5], [212, 214, 0.94, 0.5]], mat: MAT_CHROME, tint: 1, group: 0 },
  { pts: [[164, 314, 0.95, 4.5], [154, 300, 0.95, 3], [156, 286, 0.95, 0.4]], mat: MAT_CHROME, tint: 1, group: 0 },
  // Main horn and its branch.
  { pts: [[240, 262, 0.93, 9], [232, 216, 0.93, 8], [224, 176, 0.93, 6], [232, 130, 0.93, 4], [250, 72, 0.93, 1]], mat: MAT_CHROME, tint: 1.05, group: 0 },
  { pts: [[228, 196, 0.93, 5], [208, 172, 0.93, 3], [198, 146, 0.93, 0.4]], mat: MAT_CHROME, tint: 1.05, group: 0 },
  // The eye, in a dark socket.
  { pts: [[222, 281, 0.965, 8], [204, 289, 0.965, 6.5]], mat: MAT_ACCENT, tint: 0.12, group: 0 },
  { pts: [[216, 283, 0.97, 5], [207, 287, 0.97, 4]], mat: MAT_EYE, tint: 1, group: 0 },
  // The whisker.
  { pts: [[140, 330, 0.96, 1.8], [112, 348, 0.96, 1.6], [92, 342, 0.96, 1.4], [94, 310, 0.96, 1.1], [106, 280, 0.96, 0.9], [122, 252, 0.96, 0.4]], mat: MAT_ACCENT, tint: 1, group: 2 },

  // Front left arm, reaching across the star.
  { pts: [[268, 482, 0.8, 18], [232, 480, 0.86, 14], [204, 466, 0.88, 10], [192, 458, 0.88, 8]], mat: MAT_CHROME, tint: 1, group: 3 },
  ...talons(193, 458, 0.89, [[-16, -12, -22, -26], [-18, 2, -28, -8], [-8, 14, -20, 20]]),
  // Front right arm.
  { pts: [[412, 418, 0.64, 18], [404, 460, 0.72, 14], [392, 494, 0.74, 10], [386, 506, 0.74, 8]], mat: MAT_CHROME, tint: 1, group: 3 },
  ...talons(386, 506, 0.75, [[-14, 6, -22, -2], [-2, 18, -12, 26], [14, 12, 18, 24]]),
  // Hind left, under the lower loop.
  { pts: [[330, 640, 0.42, 16], [316, 686, 0.56, 12], [298, 672, 0.6, 9], [288, 662, 0.6, 7]], mat: MAT_CHROME, tint: 0.95, group: 3 },
  ...talons(288, 662, 0.61, [[-16, -10, -22, -22], [-4, -16, 0, -30], [-18, 4, -30, 0]]),
  // Hind right, off the tail coil.
  { pts: [[272, 806, 0.66, 16], [240, 792, 0.74, 12], [226, 764, 0.76, 9], [224, 752, 0.76, 7]], mat: MAT_CHROME, tint: 0.95, group: 3 },
  ...talons(224, 752, 0.77, [[-12, -12, -14, -26], [4, -16, 12, -28], [-18, -2, -30, -8]]),
  // The tail tuft.
  { pts: [[298, 1050, 0.56, 7], [336, 1030, 0.56, 5], [372, 996, 0.56, 0.4]], mat: MAT_CHROME, tint: 0.9, group: 3 },
  { pts: [[306, 1066, 0.56, 7], [346, 1066, 0.56, 5], [386, 1056, 0.56, 0.4]], mat: MAT_CHROME, tint: 0.9, group: 3 },
  { pts: [[314, 1090, 0.56, 6], [306, 1112, 0.56, 4], [282, 1124, 0.56, 0.4]], mat: MAT_CHROME, tint: 0.9, group: 3 },
  { pts: [[300, 1080, 0.55, 6], [276, 1092, 0.55, 4], [250, 1088, 0.55, 0.4]], mat: MAT_CHROME, tint: 0.9, group: 3 },
  { pts: [[322, 1100, 0.57, 5], [340, 1122, 0.57, 3], [346, 1148, 0.57, 0.4]], mat: MAT_CHROME, tint: 0.9, group: 3 },
]

/** [cx, cy, rotation, half-width, up, down, left, right] in reference px. The last is the hot core. */
const STARS = [
  [312, 452, -0.215, 30, 470, 740, 320, 300],
  [442, 150, -0.25, 8, 62, 74, 40, 40],
  [150, 830, -0.26, 11, 140, 212, 110, 96],
  [318, 478, -0.215, 25, 160, 200, 46, 56],
]

/** Faint rainbow lens streaks: [x1, y1, x2, y2]. */
const STREAKS = [
  [20, 40, 72, 112],
  [515, 675, 578, 720],
  [520, 840, 560, 892],
]

/** [x, y, size, rides the head (1) or the body (0)] */
const GLINTS = [
  [236, 118, 34, 1],
  [440, 420, 28, 0],
  [120, 572, 32, 0],
  [414, 690, 24, 0],
  [470, 196, 22, 0],
  [182, 300, 18, 1],
]

const METALS: Record<ChromeDragonMetal, { tint: number[]; void: number[]; fill: number }> = {
  obsidian: { tint: [0.78, 0.82, 0.92], void: [0.012, 0.014, 0.022], fill: 0.6 },
  silver: { tint: [1, 1, 1.03], void: [0.07, 0.08, 0.1], fill: 1 },
  gold: { tint: [1, 0.74, 0.34], void: [0.05, 0.03, 0.01], fill: 0.85 },
}

// ---- shaders ---------------------------------------------------------------

const FULLSCREEN_VS = [
  "#version 300 es",
  "void main() {",
  "  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));",
  "  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);",
  "}",
].join("\n")

const SKY_FS = [
  "#version 300 es",
  "precision highp float;",
  "uniform vec2 uRes;",
  "uniform vec3 uFit;",
  "uniform vec2 uPar;",
  "uniform vec3 uSkyTop;",
  "uniform vec3 uSkyBot;",
  "uniform vec3 uStar;",
  "uniform vec3 uCore;",
  "uniform vec4 uSA[4];",
  "uniform vec4 uSB[4];",
  "uniform vec4 uStreak[3];",
  "out vec4 o;",
  "float blade(float along, float across, float L, float w) {",
  "  float t = clamp(along / max(L, 1e-4), 0.0, 1.0);",
  "  return w * pow(1.0 - t, 2.6) - abs(across) - max(along - L, 0.0) - 1e-4;",
  "}",
  "float smax(float a, float b, float k) {",
  "  float h = max(k - abs(a - b), 0.0) / k;",
  "  return max(a, b) + h * h * k * 0.25;",
  "}",
  "float star(vec2 p, vec4 A, vec4 B) {",
  "  vec2 d = p - A.xy;",
  "  float c = cos(A.z), s = sin(A.z);",
  "  vec2 q = vec2(c * d.x + s * d.y, -s * d.x + c * d.y);",
  "  float lx = q.x > 0.0 ? B.w : B.z;",
  "  float ly = q.y > 0.0 ? B.y : B.x;",
  "  float h = blade(abs(q.x), q.y, lx, A.w);",
  "  float v = blade(abs(q.y), q.x, ly, A.w);",
  "  return smax(h, v, A.w * 0.7);",
  "}",
  "vec3 hue(float h) {",
  "  return clamp(abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);",
  "}",
  "void main() {",
  "  vec2 px = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);",
  "  vec2 uv = px / uRes;",
  "  vec2 P = (px - uFit.xy) / uFit.z + uPar * 0.012;",
  "  float g = smoothstep(-0.05, 1.05, uv.y);",
  "  vec3 c = mix(uSkyTop, uSkyBot, g);",
  "  c *= 1.0 - 0.16 * smoothstep(0.35, 1.25, length((uv - vec2(0.5, 0.42)) * vec2(1.0, 0.85)));",
  "  for (int i = 0; i < 3; i++) {",
  "    vec2 a = uStreak[i].xy;",
  "    vec2 ab = uStreak[i].zw - a;",
  "    float t = clamp(dot(P - a, ab) / dot(ab, ab), 0.0, 1.0);",
  "    float d = length(P - a - ab * t);",
  "    float m = smoothstep(0.009, 0.0, d) * sin(t * 3.14159);",
  "    c += hue(t * 0.8 + 0.55) * m * 0.2 + m * 0.04;",
  "  }",
  "  for (int i = 0; i < 4; i++) {",
  "    float f = star(P, uSA[i], uSB[i]);",
  "    float aa = fwidth(f) * 0.75 + 1e-6;",
  "    float m = clamp(f / aa + 0.5, 0.0, 1.0);",
  "    c = mix(c, i == 3 ? uCore : uStar, m);",
  "  }",
  "  o = vec4(c, 1.0);",
  "}",
].join("\n")

const DRAGON_VS = [
  "#version 300 es",
  "layout(location = 0) in vec3 aPos;",
  "layout(location = 1) in vec4 aNUV;",
  "layout(location = 2) in vec3 aMat;",
  "uniform vec4 uMap;",
  "uniform vec2 uPar;",
  "out vec2 vN;",
  "out vec2 vUV;",
  "out vec2 vPos;",
  "out float vZ;",
  "out float vR;",
  "out float vTint;",
  "flat out float vMat;",
  "void main() {",
  "  vec2 p = aPos.xy + uPar * (aPos.z - 0.6) * 0.035;",
  "  vPos = p;",
  "  vZ = aPos.z;",
  "  vN = aNUV.xy;",
  "  vUV = aNUV.zw;",
  "  vMat = aMat.x;",
  "  vR = aMat.y;",
  "  vTint = aMat.z;",
  "  gl_Position = vec4(uMap.x * p.x + uMap.y, uMap.z * p.y + uMap.w, 0.0, 1.0);",
  "}",
].join("\n")

const DRAGON_FS = [
  "#version 300 es",
  "precision highp float;",
  "in vec2 vN;",
  "in vec2 vUV;",
  "in vec2 vPos;",
  "in float vZ;",
  "in float vR;",
  "in float vTint;",
  "flat in float vMat;",
  "uniform vec2 uEnv;",
  "uniform vec3 uLight;",
  "uniform vec3 uTint;",
  "uniform vec3 uVoid;",
  "uniform float uFill;",
  "uniform vec3 uSkyTop;",
  "uniform vec3 uSkyBot;",
  "uniform vec3 uStar;",
  "uniform vec3 uAccent;",
  "uniform float uSheen;",
  "uniform float uEye;",
  "out vec4 o;",
  "vec3 env(vec3 R) {",
  "  float ca = cos(uEnv.x), sa = sin(uEnv.x);",
  "  R = vec3(ca * R.x + sa * R.z, R.y, -sa * R.x + ca * R.z);",
  "  float cb = cos(uEnv.y), sb = sin(uEnv.y);",
  "  R = vec3(R.x, cb * R.y - sb * R.z, sb * R.y + cb * R.z);",
  "  float y = R.y;",
  "  vec3 c = uVoid;",
  "  c += uSkyTop * uFill * 0.6 * smoothstep(0.0, 0.9, y);",
  "  c += uSkyBot * uFill * 0.28 * smoothstep(0.05, -0.8, y);",
  "  c += vec3(0.3, 0.33, 0.38) * uFill * smoothstep(-0.2, 0.9, dot(R, normalize(vec3(-0.35, 0.45, 0.8))));",
  "  float hz = y - 0.24 + 0.2 * R.x;",
  "  c += vec3(1.0) * 1.7 * exp(-hz * hz * 140.0);",
  "  c += vec3(0.75, 0.85, 1.0) * 0.35 * exp(-hz * hz * 10.0) * step(0.0, hz);",
  "  float k = dot(R, normalize(vec3(-0.55, 0.62, 0.55)));",
  "  c += vec3(1.0) * 2.2 * smoothstep(0.9, 0.975, k) + vec3(0.5) * smoothstep(0.6, 0.95, k) * uFill;",
  "  return c;",
  "}",
  "void main() {",
  "  float mat = floor(vMat + 0.5);",
  "  vec2 nxy = vN;",
  "  float l = length(nxy);",
  "  if (l > 1.0) { nxy /= l; l = 1.0; }",
  "  float nz = sqrt(max(0.0, 1.0 - l * l));",
  "  float line = 0.0;",
  "  if (mat < 0.5) {",
  "    float sv = asin(clamp(vUV.y, -1.0, 1.0)) * 1.2732;",
  "    vec2 g = vec2(vUV.x * 62.0, sv * 2.3);",
  "    g.y += mod(floor(g.x), 2.0) * 0.5;",
  "    vec2 cell = vec2(fract(g.x), fract(g.y) - 0.5);",
  "    float d = length(cell * vec2(1.0, 1.15));",
  "    float fw = fwidth(d) + 1e-4;",
  "    float band = smoothstep(0.75, 0.3, abs(vUV.y - 0.2));",
  "    line = (1.0 - smoothstep(0.0, fw * 1.5, abs(d - 0.86))) * band;",
  "    vec2 bump = normalize(cell + 1e-4) * smoothstep(0.35, 0.86, d) * 0.05 * band;",
  "    nxy = clamp(nxy + bump * nz, -1.0, 1.0);",
  "  }",
  "  vec3 N = normalize(vec3(nxy.x, -nxy.y, nz + 1e-3));",
  "  vec3 R = reflect(vec3(0.0, 0.0, -1.0), N);",
  "  vec3 c;",
  "  if (mat > 3.5) {",
  "    c = uAccent * (0.8 + 0.6 * uEye) + vec3(1.0, 0.95, 0.8) * pow(nz, 10.0) * (0.6 + uEye);",
  "  } else if (mat > 2.5) {",
  "    c = vec3(1.0, 0.97, 0.9) * (0.62 + 0.45 * nz) + vec3(0.6) * pow(max(R.y, 0.0), 8.0);",
  "  } else if (mat > 1.5) {",
  "    c = uAccent * vTint * (0.7 + 0.4 * nz) + vec3(1.0, 0.8, 0.7) * 0.35 * pow(max(dot(R, normalize(vec3(-0.4, 0.6, 0.7))), 0.0), 30.0) * vTint;",
  "  } else {",
  "    c = env(R) * uTint * vTint;",
  "    vec3 L = normalize(vec3((uLight.xy - vPos) * vec2(1.0, -1.0), 0.32));",
  "    c += vec3(1.0) * uLight.z * pow(max(dot(R, L), 0.0), 48.0) * 1.6;",
  "    c += vec3(0.9, 0.95, 1.0) * uLight.z * pow(max(dot(R, L), 0.0), 6.0) * 0.12;",
  "    if (mat < 0.5) {",
  "      c += uStar * 0.7 * smoothstep(0.9, 0.975, dot(R, normalize(vec3(0.72, -0.12, 0.68)))) * vTint;",
  "      float sw = exp(-pow((vUV.x - uSheen) * 7.0, 2.0));",
  "      c += vec3(0.85, 0.92, 1.0) * sw * smoothstep(0.1, 0.9, nz) * 0.55;",
  "      c *= 1.0 - line * 0.32;",
  "      c += vec3(0.5, 0.55, 0.6) * line * smoothstep(0.6, 1.4, dot(c, vec3(0.333))) * 0.6;",
  "    }",
  "    c = mix(c, uSkyTop * 0.35, clamp((0.9 - vZ) * 0.35, 0.0, 0.25));",
  "  }",
  "  if (mat < 1.5) c += uSkyBot * pow(1.0 - nz, 3.0) * max(dot(normalize(N.xy + 1e-4), vec2(-0.6, 0.8)), 0.0) * 0.9 * uFill;",
  "  float rim = smoothstep(0.86, 0.99, l);",
  "  c = mix(c, uVoid * 0.5, rim * (mat > 1.5 && mat < 2.5 ? 0.4 : 0.9));",
  "  c = 1.0 - exp(-c * 1.25);",
  "  gl_FragDepth = clamp(1.0 - (vZ + nz * vR * 0.8) * 0.9, 0.0, 1.0);",
  "  o = vec4(c, 1.0);",
  "}",
].join("\n")

const FX_FS = [
  "#version 300 es",
  "precision highp float;",
  "uniform vec2 uRes;",
  "uniform vec3 uFit;",
  "uniform float uTime;",
  "uniform float uGrain;",
  "uniform vec3 uStar;",
  "uniform vec4 uGlint[6];",
  "uniform vec4 uBurst[12];",
  "out vec4 o;",
  "float spark(vec2 d) {",
  "  float ax = abs(d.x), ay = abs(d.y);",
  "  float arms = exp(-ay * 36.0) * pow(max(0.0, 1.0 - ax), 2.0) + exp(-ax * 36.0) * pow(max(0.0, 1.0 - ay), 2.0);",
  "  vec2 r = vec2(d.x + d.y, d.x - d.y) * 0.7071;",
  "  float diag = exp(-abs(r.y) * 60.0) * pow(max(0.0, 1.0 - abs(r.x) * 2.4), 2.0) + exp(-abs(r.x) * 60.0) * pow(max(0.0, 1.0 - abs(r.y) * 2.4), 2.0);",
  "  float q = dot(d, d);",
  "  return arms + diag * 0.4 + exp(-q * 90.0) * 1.4 + exp(-q * 10.0) * 0.18;",
  "}",
  "float hash(vec2 p) {",
  "  p = fract(p * vec2(443.897, 441.423));",
  "  p += dot(p, p.yx + 19.19);",
  "  return fract((p.x + p.y) * p.x);",
  "}",
  "void main() {",
  "  vec2 px = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);",
  "  vec2 P = (px - uFit.xy) / uFit.z;",
  "  vec3 glow = vec3(0.0);",
  "  for (int i = 0; i < 6; i++) {",
  "    vec4 g = uGlint[i];",
  "    if (g.w <= 0.001) continue;",
  "    glow += vec3(0.92, 0.96, 1.0) * spark((P - g.xy) / g.z) * g.w;",
  "  }",
  "  for (int i = 0; i < 12; i++) {",
  "    vec4 b = uBurst[i];",
  "    if (b.w <= 0.001) continue;",
  "    vec3 col = mod(float(i), 3.0) < 0.5 ? uStar * 1.4 : vec3(1.0, 0.97, 0.9);",
  "    glow += col * spark((P - b.xy) / b.z) * b.w;",
  "  }",
  "  float ga = uGrain * 0.3;",
  "  float n = hash(px + fract(uTime * 7.13) * 91.7);",
  "  o = vec4(glow + vec3(n) * ga, ga);",
  "}",
].join("\n")

// ---- the component ---------------------------------------------------------

const PX = 1 / 600
const STEP = 0.0055
const FLOATS = 10
const CAPACITY = 60000

const toPts = (rig: Rig): Pt[] => rig.map(([x, y, z, r]) => ({ x: x * PX, y: y * PX, z, r: r * PX }))

const hash1 = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return s - Math.floor(s)
}

export default function ChromeDragonPoster({
  height = "100svh",
  skyTop = "#0b3874",
  skyBottom = "#8fbcd4",
  star = "#ff2d17",
  starCore = "#f4c21c",
  accent = "#e3261a",
  metal = "obsidian",
  tint,
  grain = 0.1,
  speed = 1,
  zoom = 1,
  interactive = true,
  followPointer = true,
  glints = true,
  title = "Chrome Dragon",
  mark = "龍",
  caption = "Move to catch the light · Click to roar",
  onRoar,
  className = "",
}: ChromeDragonPosterProps) {
  const rootRef = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [failed, setFailed] = useState(false)
  const [reduced, setReduced] = useState(false)

  // The loop reads props through a ref, so a colour change never restarts WebGL.
  const settings = {
    skyTop: hexToRgb(skyTop, [0.04, 0.22, 0.45]),
    skyBottom: hexToRgb(skyBottom, [0.56, 0.74, 0.83]),
    star: hexToRgb(star, [1, 0.18, 0.09]),
    starCore: hexToRgb(starCore, [0.96, 0.76, 0.11]),
    accent: hexToRgb(accent, [0.89, 0.15, 0.1]),
    metal: METALS[metal] ?? METALS.obsidian,
    tint: tint ? hexToRgb(tint, [1, 1, 1]) : null,
    grain: Math.max(0, grain),
    speed: Number.isFinite(speed) ? Math.max(0, speed) : 1,
    zoom,
    interactive,
    followPointer,
    glints,
    onRoar,
  }
  const settingsRef = useRef(settings)
  settingsRef.current = settings

  // Shared between the React handlers and the render loop.
  const live = useRef({
    fit: { s: 1, ox: 0, oy: 0 },
    pointer: { x: 0.5, y: 0.8, sx: 0, sy: 0, inside: false },
    roarAt: -99,
    bursts: [] as { x: number; y: number; vx: number; vy: number; born: number; size: number }[],
    clock: 0,
    redraw: () => {},
  })

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => setReduced(mq.matches)
    sync()
    mq.addEventListener("change", sync)
    return () => mq.removeEventListener("change", sync)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const gl = canvas.getContext("webgl2", {
      antialias: true,
      alpha: false,
      depth: true,
      powerPreference: "high-performance",
    })
    if (!gl) {
      setFailed(true)
      return
    }

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)
      if (!sh) return null
      gl.shaderSource(sh, src)
      gl.compileShader(sh)
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        console.error("chrome-dragon-poster:", gl.getShaderInfoLog(sh))
        gl.deleteShader(sh)
        return null
      }
      return sh
    }
    const link = (vs: string, fs: string) => {
      const v = compile(gl.VERTEX_SHADER, vs)
      const f = compile(gl.FRAGMENT_SHADER, fs)
      const p = v && f ? gl.createProgram() : null
      if (!p || !v || !f) return null
      gl.attachShader(p, v)
      gl.attachShader(p, f)
      gl.linkProgram(p)
      gl.deleteShader(v)
      gl.deleteShader(f)
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
        console.error("chrome-dragon-poster:", gl.getProgramInfoLog(p))
        gl.deleteProgram(p)
        return null
      }
      return p
    }

    const skyProgram = link(FULLSCREEN_VS, SKY_FS)
    const dragonProgram = link(DRAGON_VS, DRAGON_FS)
    const fxProgram = link(FULLSCREEN_VS, FX_FS)
    if (!skyProgram || !dragonProgram || !fxProgram) {
      if (skyProgram) gl.deleteProgram(skyProgram)
      if (dragonProgram) gl.deleteProgram(dragonProgram)
      if (fxProgram) gl.deleteProgram(fxProgram)
      setFailed(true)
      return
    }
    const U = (p: WebGLProgram) => (name: string) => gl.getUniformLocation(p, name)
    const us = U(skyProgram)
    const ud = U(dragonProgram)
    const uf = U(fxProgram)

    const emptyVao = gl.createVertexArray()
    const vao = gl.createVertexArray()
    const vbo = gl.createBuffer()
    const data = new Float32Array(CAPACITY * FLOATS)
    gl.bindVertexArray(vao)
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
    gl.bufferData(gl.ARRAY_BUFFER, data.byteLength, gl.DYNAMIC_DRAW)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, FLOATS * 4, 0)
    gl.enableVertexAttribArray(1)
    gl.vertexAttribPointer(1, 4, gl.FLOAT, false, FLOATS * 4, 12)
    gl.enableVertexAttribArray(2)
    gl.vertexAttribPointer(2, 3, gl.FLOAT, false, FLOATS * 4, 28)
    gl.bindVertexArray(null)

    // ---- rest pose, built once ----------------------------------------------
    const body0 = resample(catmull(toPts(BODY), 10), STEP)
    const arc0 = arcLengths(body0)
    const bodyLen = arc0[arc0.length - 1]
    const sides = outerSides(body0, 7)
    const normals0 = body0.map((_, i) => {
      const a = body0[Math.max(0, i - 1)]
      const b = body0[Math.min(body0.length - 1, i + 1)]
      const l = Math.hypot(b.x - a.x, b.y - a.y) || 1
      return [-(b.y - a.y) / l, (b.x - a.x) / l]
    })
    const body = body0.map((p) => ({ ...p }))
    const disp = body0.map(() => [0, 0])

    // The head is drawn a size up from the trace: at poster scale the skull
    // has to hold its own against a body this thick.
    const headScale = (rig: Rig): Rig =>
      rig.map(([x, y, z, r]) => [HEAD_PIVOT[0] + (x - HEAD_PIVOT[0]) * HEAD_SCALE, HEAD_PIVOT[1] + (y - HEAD_PIVOT[1]) * HEAD_SCALE, z, r * HEAD_SCALE])
    const parts = PARTS.map((part) => {
      const rest = resample(catmull(toPts(part.group === 3 ? part.pts : headScale(part.pts)), 8), STEP * 0.8)
      const anchor = part.group === 3 ? nearestIndex(body0, rest[0].x, rest[0].y) : 0
      return { ...part, rest, anchor, work: rest.map((p) => ({ ...p })) }
    })

    const fins: { i: number; len: number; bend: number; phase: number }[] = []
    for (let s = 0.12, k = 0; s < bodyLen * 0.94; k++) {
      const i = Math.min(body0.length - 1, Math.round(s / STEP))
      fins.push({ i, len: 0.7 + 0.6 * hash1(k), bend: 0.7 + 0.5 * hash1(k + 17), phase: hash1(k + 41) * 6.28 })
      s += 0.042 + 0.03 * hash1(k + 5)
    }

    const glintAnchors = GLINTS.map(([x, y]) => nearestIndex(body0, x * PX, y * PX))

    // ---- per-frame buffers --------------------------------------------------
    let count = 0
    const vert = (x: number, y: number, z: number, nx: number, ny: number, u: number, v: number, mat: number, r: number, tn: number) => {
      if (count >= CAPACITY) return
      const o = count * FLOATS
      data[o] = x
      data[o + 1] = y
      data[o + 2] = z
      data[o + 3] = nx
      data[o + 4] = ny
      data[o + 5] = u
      data[o + 6] = v
      data[o + 7] = mat
      data[o + 8] = r
      data[o + 9] = tn
      count++
    }
    const cap = (p: Pt, tx: number, ty: number, mat: number, tn: number, u: number) => {
      if (p.r < 0.0025) return
      const nx = -ty
      const ny = tx
      const K = 8
      let px = nx
      let py = ny
      for (let k = 1; k <= K; k++) {
        const a = (k / K) * Math.PI
        const cx = nx * Math.cos(a) + tx * Math.sin(a)
        const cy = ny * Math.cos(a) + ty * Math.sin(a)
        vert(p.x, p.y, p.z, 0, 0, u, 0, mat, p.r, tn)
        vert(p.x + px * p.r, p.y + py * p.r, p.z, px, py, u, 1, mat, p.r, tn)
        vert(p.x + cx * p.r, p.y + cy * p.r, p.z, cx, cy, u, 1, mat, p.r, tn)
        px = cx
        py = cy
      }
    }
    const tx = new Float32Array(4096)
    const ty = new Float32Array(4096)
    const tube = (P: Pt[], mat: number, tn: number, caps: boolean, us?: number[]) => {
      const n = Math.min(P.length, 4096)
      if (n < 2) return
      for (let i = 0; i < n; i++) {
        const a = P[i > 0 ? i - 1 : 0]
        const b = P[i < n - 1 ? i + 1 : n - 1]
        const l = Math.hypot(b.x - a.x, b.y - a.y) || 1
        tx[i] = (b.x - a.x) / l
        ty[i] = (b.y - a.y) / l
      }
      let u = 0
      for (let i = 0; i < n - 1; i++) {
        const a = P[i]
        const b = P[i + 1]
        const ua = us ? us[i] : u
        const ub = us ? us[i + 1] : u + Math.hypot(b.x - a.x, b.y - a.y)
        u = ub
        const anx = -ty[i], any = tx[i], bnx = -ty[i + 1], bny = tx[i + 1]
        const la = [a.x + anx * a.r, a.y + any * a.r]
        const ra = [a.x - anx * a.r, a.y - any * a.r]
        const lb = [b.x + bnx * b.r, b.y + bny * b.r]
        const rb = [b.x - bnx * b.r, b.y - bny * b.r]
        vert(la[0], la[1], a.z, anx, any, ua, 1, mat, a.r, tn)
        vert(ra[0], ra[1], a.z, -anx, -any, ua, -1, mat, a.r, tn)
        vert(lb[0], lb[1], b.z, bnx, bny, ub, 1, mat, b.r, tn)
        vert(ra[0], ra[1], a.z, -anx, -any, ua, -1, mat, a.r, tn)
        vert(rb[0], rb[1], b.z, -bnx, -bny, ub, -1, mat, b.r, tn)
        vert(lb[0], lb[1], b.z, bnx, bny, ub, 1, mat, b.r, tn)
      }
      if (caps) {
        cap(P[0], -tx[0], -ty[0], mat, tn, us ? us[0] : 0)
        cap(P[n - 1], tx[n - 1], ty[n - 1], mat, tn, u)
      }
    }
    const finPts: Pt[] = Array.from({ length: 7 }, () => ({ x: 0, y: 0, z: 0, r: 0 }))

    // ---- sizing -------------------------------------------------------------
    let W = 1
    let H = 1
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const cw = canvas.clientWidth
      const ch = canvas.clientHeight
      W = Math.max(1, Math.round(cw * dpr))
      H = Math.max(1, Math.round(ch * dpr))
      if (canvas.width !== W) canvas.width = W
      if (canvas.height !== H) canvas.height = H
      live.current.fit = fitPoster(cw, ch, settingsRef.current.zoom)
    }
    resize()

    // ---- one frame ----------------------------------------------------------
    const rot = (x: number, y: number, cx: number, cy: number, c: number, s: number) => [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c]
    const sm = { px: 0, py: 0, head: 0, lx: 0.5, ly: 0.8, light: 0 }
    const glintData = new Float32Array(24)
    const burstData = new Float32Array(48)
    const saData = new Float32Array(16)
    const sbData = new Float32Array(16)
    const streakData = new Float32Array(STREAKS.flat().map((v) => v * PX))

    const draw = (t: number, dt: number) => {
      const S = settingsRef.current
      const L = live.current
      const fit = fitPoster(W, H, S.zoom)
      const ptr = L.pointer
      const on = S.interactive && ptr.inside
      const ease = 1 - Math.exp(-dt * 5)
      sm.px += ((on ? ptr.sx : Math.sin(t * 0.23) * 0.35) - sm.px) * ease
      sm.py += ((on ? ptr.sy : Math.cos(t * 0.19) * 0.25) - sm.py) * ease
      sm.lx += ((on ? ptr.x : 0.5 + Math.sin(t * 0.31) * 0.35) - sm.lx) * ease
      sm.ly += ((on ? ptr.y : 0.9 + Math.cos(t * 0.27) * 0.5) - sm.ly) * ease
      sm.light += ((on ? 1 : 0.35) - sm.light) * ease

      const roarT = (performance.now() - L.roarAt) / 1000
      const roar = roarEnvelope(roarT, 1.8)

      // Head: idle bob, plus a turn toward the pointer.
      const hx = HEAD_PIVOT[0] * PX
      const hy = HEAD_PIVOT[1] * PX
      const look = on && S.followPointer ? -Math.max(-0.5, Math.min(0.5, ptr.y - hy)) * 0.42 + Math.max(-0.3, Math.min(0.3, hx - ptr.x)) * 0.08 : 0
      sm.head += (look + Math.sin(t * 0.9) * 0.035 + roar * 0.12 - sm.head) * ease
      const hc = Math.cos(sm.head)
      const hs = Math.sin(sm.head)
      const hdx = Math.sin(t * 0.7) * 0.004
      const hdy = Math.sin(t * 0.9 + 1) * 0.005 - roar * 0.008
      const jaw = 0.1 + 0.05 * Math.sin(t * 1.3) + roar * 0.42
      const jc = Math.cos(-jaw)
      const js = Math.sin(-jaw)
      const jc2 = Math.cos(-jaw * 0.5)
      const js2 = Math.sin(-jaw * 0.5)
      const jx = (HEAD_PIVOT[0] + (JAW_HINGE[0] - HEAD_PIVOT[0]) * HEAD_SCALE) * PX
      const jy = (HEAD_PIVOT[1] + (JAW_HINGE[1] - HEAD_PIVOT[1]) * HEAD_SCALE) * PX
      const headXf = (p: Pt, out: Pt) => {
        const [x, y] = rot(p.x, p.y, hx, hy, hc, hs)
        out.x = x + hdx
        out.y = y + hdy
        out.z = p.z
        out.r = p.r
      }

      // Body: a travelling wave that grows toward the tail, breath, roar pulse.
      const front = roarT * bodyLen * 0.75
      for (let i = 0; i < body0.length; i++) {
        const p = body0[i]
        const s = arc0[i]
        const amp = 0.003 + 0.013 * smoothstep(0.3, bodyLen, s)
        const w = amp * Math.sin(s * 5.2 - t * 1.5) + 0.0025 * Math.sin(s * 13 - t * 2.6)
        let x = p.x + normals0[i][0] * w
        let y = p.y + normals0[i][1] * w
        const neck = 1 - smoothstep(0, 0.4, s)
        if (neck > 0) {
          const [rx, ry] = rot(x, y, hx, hy, hc, hs)
          x += (rx + hdx - x) * neck
          y += (ry + hdy - y) * neck
        }
        const pulse = roar > 0 ? Math.exp(-Math.pow((s - front) / 0.09, 2)) * 0.22 * Math.min(1, roar * 3) : 0
        body[i].x = x
        body[i].y = y
        body[i].z = p.z
        body[i].r = p.r * (1 + 0.025 * Math.sin(t * 1.4 - s * 3) + pulse)
        disp[i][0] = x - p.x
        disp[i][1] = y - p.y
      }

      count = 0
      tube(body, MAT_BODY, 1, false, arc0)

      // Fins on the outside of every bend, swept toward the tail.
      for (let k = 0; k < fins.length; k++) {
        const f = fins[k]
        const i = f.i
        const a = body[Math.max(0, i - 1)]
        const b = body[Math.min(body.length - 1, i + 1)]
        const l = Math.hypot(b.x - a.x, b.y - a.y) || 1
        const tX = (b.x - a.x) / l
        const tY = (b.y - a.y) / l
        const sd = sides[i]
        const nX = -tY * sd
        const nY = tX * sd
        const p = body[i]
        const len = p.r * 0.95 * f.len
        const flutter = Math.sin(t * 2.4 + f.phase + i * 0.05) * 0.18
        const bx = p.x + nX * p.r * 0.55
        const by = p.y + nY * p.r * 0.55
        const ex = bx + (nX * (0.75 - flutter * 0.3) + tX * (0.8 + f.bend + flutter)) * len
        const ey = by + (nY * (0.75 - flutter * 0.3) + tY * (0.8 + f.bend + flutter)) * len
        const cx = bx + nX * len * 0.85
        const cy = by + nY * len * 0.85
        for (let j = 0; j < finPts.length; j++) {
          const u = j / (finPts.length - 1)
          const m = 1 - u
          finPts[j].x = m * m * bx + 2 * m * u * cx + u * u * ex
          finPts[j].y = m * m * by + 2 * m * u * cy + u * u * ey
          finPts[j].z = p.z - 0.03
          finPts[j].r = p.r * 0.42 * Math.pow(m, 1.6)
        }
        tube(finPts, MAT_CHROME, 0.9, false)
      }

      // Head, jaw, whisker, and everything that rides the body.
      for (const part of parts) {
        const { rest, work } = part
        for (let j = 0; j < rest.length; j++) {
          const p = rest[j]
          const w = work[j]
          if (part.group === 3) {
            const d = disp[part.anchor]
            w.x = p.x + d[0]
            w.y = p.y + d[1]
            w.z = p.z
            w.r = p.r
            continue
          }
          let x = p.x
          let y = p.y
          if (part.group === 1 || part.group === 4) {
            const c = part.group === 1 ? jc : jc2
            const s = part.group === 1 ? js : js2
            const r = rot(x, y, jx, jy, c, s)
            x = r[0]
            y = r[1]
          } else if (part.group === 2) {
            const u = j / Math.max(1, rest.length - 1)
            const sway = Math.pow(u, 1.4)
            x += Math.sin(t * 1.7 + u * 4) * 0.014 * sway
            y += Math.cos(t * 1.3 + u * 3) * 0.008 * sway
          }
          const tmp = { x, y, z: p.z, r: p.r }
          headXf(tmp, w)
        }
        tube(work, part.mat, part.tint, true)
      }

      // ---- paint ----
      const m = S.metal
      const tn = S.tint ?? m.tint
      gl.viewport(0, 0, W, H)
      gl.disable(gl.DEPTH_TEST)
      gl.disable(gl.BLEND)

      const pulse = 1 + roar * 0.14
      STARS.forEach((st, i) => {
        const wob = 1 + 0.02 * Math.sin(t * 0.8 + i * 1.7)
        saData[i * 4] = st[0] * PX
        saData[i * 4 + 1] = st[1] * PX
        saData[i * 4 + 2] = st[2] + Math.sin(t * 0.3 + i) * 0.008
        saData[i * 4 + 3] = st[3] * PX * (i === 3 ? 1 + roar * 0.35 : pulse)
        for (let k = 0; k < 4; k++) sbData[i * 4 + k] = st[4 + k] * PX * wob * pulse
      })
      gl.useProgram(skyProgram)
      gl.bindVertexArray(emptyVao)
      gl.uniform2f(us("uRes"), W, H)
      gl.uniform3f(us("uFit"), fit.ox, fit.oy, fit.s)
      gl.uniform2f(us("uPar"), sm.px, sm.py)
      gl.uniform3fv(us("uSkyTop"), S.skyTop)
      gl.uniform3fv(us("uSkyBot"), S.skyBottom)
      gl.uniform3fv(us("uStar"), S.star)
      gl.uniform3fv(us("uCore"), S.starCore)
      gl.uniform4fv(us("uSA"), saData)
      gl.uniform4fv(us("uSB"), sbData)
      gl.uniform4fv(us("uStreak"), streakData)
      gl.drawArrays(gl.TRIANGLES, 0, 3)

      gl.enable(gl.DEPTH_TEST)
      gl.depthFunc(gl.LEQUAL)
      gl.depthMask(true)
      gl.clearDepth(1)
      gl.clear(gl.DEPTH_BUFFER_BIT)
      gl.useProgram(dragonProgram)
      gl.bindVertexArray(vao)
      gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, data, 0, count * FLOATS)
      gl.uniform4f(ud("uMap"), (2 * fit.s) / W, (2 * fit.ox) / W - 1, (-2 * fit.s) / H, 1 - (2 * fit.oy) / H)
      gl.uniform2f(ud("uPar"), sm.px, sm.py)
      gl.uniform2f(ud("uEnv"), sm.px * 0.55 + Math.sin(t * 0.21) * 0.12, sm.py * 0.3 + Math.cos(t * 0.17) * 0.06)
      gl.uniform3f(ud("uLight"), sm.lx, sm.ly, sm.light)
      gl.uniform3fv(ud("uTint"), tn)
      gl.uniform3fv(ud("uVoid"), m.void)
      gl.uniform1f(ud("uFill"), m.fill)
      gl.uniform3fv(ud("uSkyTop"), S.skyTop)
      gl.uniform3fv(ud("uSkyBot"), S.skyBottom)
      gl.uniform3fv(ud("uStar"), S.star)
      gl.uniform3fv(ud("uAccent"), S.accent)
      const cycle = (t % 8) / 2.6
      const sheen = roarT < 1.4 ? (roarT / 1.4) * bodyLen * 1.2 - 0.2 : cycle < 1 ? cycle * bodyLen * 1.2 - 0.2 : -9
      gl.uniform1f(ud("uSheen"), sheen)
      gl.uniform1f(ud("uEye"), 0.35 + 0.25 * Math.sin(t * 2.1) + roar * 1.2)
      gl.drawArrays(gl.TRIANGLES, 0, count)
      gl.bindVertexArray(null)

      gl.disable(gl.DEPTH_TEST)
      gl.enable(gl.BLEND)
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
      for (let i = 0; i < GLINTS.length; i++) {
        const [gx, gy, gs, onHead] = GLINTS[i]
        let x = gx * PX
        let y = gy * PX
        if (onHead) {
          x = hx + (x - hx) * HEAD_SCALE
          y = hy + (y - hy) * HEAD_SCALE
          const [rx, ry] = rot(x, y, hx, hy, hc, hs)
          x = rx + hdx
          y = ry + hdy
        } else {
          const d = disp[glintAnchors[i]]
          x += d[0]
          y += d[1]
        }
        const tw = Math.pow(0.5 + 0.5 * Math.sin(t * 1.1 + i * 2.3), 3)
        const near = on ? Math.exp(-((ptr.x - x) ** 2 + (ptr.y - y) ** 2) / 0.006) : 0
        const k = S.glints ? 0.15 + tw * 0.85 + near * 0.9 + roar * 0.6 : 0
        glintData[i * 4] = x + sm.px * 0.001
        glintData[i * 4 + 1] = y
        glintData[i * 4 + 2] = gs * PX * (0.7 + 0.35 * tw + 0.4 * near + roar * 0.5)
        glintData[i * 4 + 3] = k
      }
      const now = performance.now()
      L.bursts = L.bursts.filter((b) => now - b.born < 1100)
      burstData.fill(0)
      const shown = L.bursts.slice(-12)
      shown.forEach((b, i) => {
        const age = (now - b.born) / 1000
        const drag = (1 - Math.exp(-age * 3.2)) / 3.2
        burstData[i * 4] = b.x + b.vx * drag
        burstData[i * 4 + 1] = b.y + b.vy * drag + age * age * 0.03
        burstData[i * 4 + 2] = b.size * (1 - age / 1.1)
        burstData[i * 4 + 3] = Math.max(0, 1 - age / 1.1)
      })
      gl.useProgram(fxProgram)
      gl.bindVertexArray(emptyVao)
      gl.uniform2f(uf("uRes"), W, H)
      gl.uniform3f(uf("uFit"), fit.ox, fit.oy, fit.s)
      gl.uniform1f(uf("uTime"), t)
      gl.uniform1f(uf("uGrain"), S.grain)
      gl.uniform3fv(uf("uStar"), S.star)
      gl.uniform4fv(uf("uGlint"), glintData)
      gl.uniform4fv(uf("uBurst"), burstData)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      gl.disable(gl.BLEND)
      gl.bindVertexArray(null)
    }

    // ---- loop ---------------------------------------------------------------
    let raf = 0
    let last = 0
    let visible = true
    let lost = false
    const tick = (now: number) => {
      raf = 0
      if (lost) return
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60
      last = now
      live.current.clock += dt * settingsRef.current.speed
      draw(live.current.clock, dt)
      if (!reduced && visible) raf = requestAnimationFrame(tick)
    }
    // Reduced motion: one still frame, redrawn only when something changes.
    if (reduced) live.current.clock = 2.2
    const redraw = () => {
      if (!raf && !lost) raf = requestAnimationFrame(tick)
    }
    live.current.redraw = redraw
    redraw()

    const observer = new ResizeObserver(() => {
      resize()
      redraw()
    })
    observer.observe(canvas)
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      last = 0
      if (visible) redraw()
    })
    io.observe(canvas)

    const onLost = (e: Event) => {
      e.preventDefault()
      lost = true
      setFailed(true)
    }
    canvas.addEventListener("webglcontextlost", onLost)

    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
      io.disconnect()
      canvas.removeEventListener("webglcontextlost", onLost)
      live.current.redraw = () => {}
      gl.deleteProgram(skyProgram)
      gl.deleteProgram(dragonProgram)
      gl.deleteProgram(fxProgram)
      gl.deleteBuffer(vbo)
      gl.deleteVertexArray(vao)
      gl.deleteVertexArray(emptyVao)
    }
  }, [reduced])

  // ---- input ----------------------------------------------------------------
  const toPoster = (e: { clientX: number; clientY: number }) => {
    const el = rootRef.current
    if (!el) return null
    const rect = el.getBoundingClientRect()
    const fit = live.current.fit
    const cx = e.clientX - rect.left
    const cy = e.clientY - rect.top
    return {
      x: (cx - fit.ox) / (fit.s || 1),
      y: (cy - fit.oy) / (fit.s || 1),
      sx: (cx / Math.max(1, rect.width)) * 2 - 1,
      sy: (cy / Math.max(1, rect.height)) * 2 - 1,
    }
  }

  const roarAt = (x: number, y: number) => {
    const L = live.current
    const now = performance.now()
    if (!reduced) {
      L.roarAt = now
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2 + Math.random() * 0.5
        const v = 0.18 + Math.random() * 0.32
        L.bursts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, born: now, size: 0.03 + Math.random() * 0.035 })
      }
    }
    settingsRef.current.onRoar?.()
    L.redraw()
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    if (!interactive) return
    const p = toPoster(e)
    if (!p) return
    Object.assign(live.current.pointer, p, { inside: true })
    if (reduced) live.current.redraw()
  }
  const onPointerLeave = () => {
    live.current.pointer.inside = false
    if (reduced) live.current.redraw()
  }
  const onPointerDown = (e: ReactPointerEvent<HTMLElement>) => {
    if (!interactive) return
    const p = toPoster(e)
    if (p) roarAt(p.x, p.y)
  }
  const onKeyDown = (e: ReactKeyboardEvent<HTMLElement>) => {
    if (!interactive) return
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      roarAt(0.24, 0.56)
    }
  }

  const label = (title || "Chrome dragon") + ": a chrome eastern dragon coiled in front of a red four-point star on a blue sky."

  return (
    <section
      ref={rootRef}
      role="img"
      aria-label={interactive ? label + " Press Enter to make it roar." : label}
      tabIndex={interactive ? 0 : -1}
      onPointerMove={onPointerMove}
      onPointerEnter={onPointerMove}
      onPointerLeave={onPointerLeave}
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
      className={
        "relative w-full overflow-hidden select-none outline-none focus-visible:ring-2 focus-visible:ring-white/70 " +
        (interactive ? "cursor-crosshair " : "") +
        className
      }
      style={{
        height,
        background: "linear-gradient(180deg, " + skyTop + ", " + skyBottom + ")",
        touchAction: "manipulation",
      }}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-0 block"
        style={{ width: "100%", height: "100%", maxWidth: "none" }}
      />

      {failed && (
        <div aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
          <span className="text-[28vmin] font-serif leading-none text-white/25">{mark || "龍"}</span>
        </div>
      )}

      {title && (
        <div className="pointer-events-none absolute left-5 top-5 sm:left-7 sm:top-7">
          <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-white/80 sm:text-xs">{title}</p>
          <div className="mt-2 h-px w-10 bg-white/50" />
        </div>
      )}

      {mark && (
        <p
          aria-hidden="true"
          className="pointer-events-none absolute right-5 top-5 font-serif text-2xl leading-none text-white/85 sm:right-7 sm:top-7 sm:text-4xl"
          style={{ writingMode: "vertical-rl" }}
        >
          {mark}
        </p>
      )}

      {caption && (
        <p className="pointer-events-none absolute bottom-5 left-5 max-w-[60%] font-mono text-[10px] uppercase tracking-[0.25em] text-white/75 motion-reduce:hidden sm:bottom-7 sm:left-7 sm:text-[11px]">
          {caption}
        </p>
      )}

      <p className="sr-only">
        {label} {caption}
      </p>
    </section>
  )
}
