"use client"

import * as React from "react"

/**
 * Holo Sticker Logo — a die-cut holographic foil sticker with its corner
 * peeling up, as a living logo mark.
 *
 * The sticker leans toward the pointer and the rainbow moves because the
 * *view* moved, not on a timer. Click it (or Enter) and the mark
 * morphs — the strokes are cubic Béziers interpolated point for point, while
 * the sheet dips, spins back and the foil runs a full turn of the spectrum.
 * Grab the curled corner and peel it: the flap is a real cylinder curl
 * computed per pixel, with the back of the sticker on the outside of the roll.
 *
 * One file, React only. Raw WebGL2 for the sheet, a 2D canvas for the ink
 * mask. Nothing is fetched.
 */

export type GlyphName = "waves" | "play" | "bars" | "broadcast" | "spark" | "smile"

/**
 * One stroke of a mark: a cubic Bézier in a 100 × 100 box (y down) and its
 * width — `[x0, y0, c1x, c1y, c2x, c2y, x1, y1, width]`. Round caps, so a
 * stroke whose ends meet is a dot.
 */
export type GlyphStroke = [number, number, number, number, number, number, number, number, number]

/**
 * A mark of your own. `strokes` morph point for point into any other stroke
 * mark. `d` is a filled SVG path in the same 100 × 100 box (even-odd) — for a
 * logo you already have; it cross-dissolves rather than morphs.
 */
export type StickerGlyph = { name: string; strokes?: GlyphStroke[]; d?: string }

export type StickerTone = "night" | "studio" | "clear"

export type HoloStickerLogoProps = {
  /** The marks it morphs between. Preset names or your own. */
  glyphs?: (GlyphName | StickerGlyph)[]
  /** Controlled mark index. */
  index?: number
  /** Starting mark when uncontrolled. */
  defaultIndex?: number
  /** Fired with the next index on click, key or a hard peel. */
  onIndexChange?: (index: number) => void
  /** Auto-morph every n ms. `0` holds the mark. */
  cycle?: number
  /** Sticker diameter. Defaults to a share of the stage's shorter side. */
  size?: string
  /** Stage height. Must be a definite length. */
  height?: string
  /** `night` black stage, `studio` paper, `clear` no stage (for a header). */
  tone?: StickerTone
  /** The colour the foil leans to. */
  tint?: string
  /** Ink the mark is printed in. Translucent, so the foil shows through. */
  ink?: string
  /** How much rainbow there is over the tint, 0–1. */
  foil?: number
  /** Width of the pearl rim as a share of the radius. */
  rim?: number
  /** How far the corner is peeled at rest, 0–1. `0` lies flat. */
  peel?: number
  /** Which way the corner peels, degrees (0 = right, 90 = top). */
  peelAngle?: number
  /** Largest pointer tilt, degrees. */
  tilt?: number
  /** Accessible name. */
  label?: string
  className?: string
}

// #region sticker
export const clamp = (v: number, lo: number, hi: number): number => (v > hi ? hi : v > lo ? v : lo)

/** A straight stroke, as a cubic so it can morph into a curve. */
export const line = (x0: number, y0: number, x1: number, y1: number, w: number): GlyphStroke => [
  x0,
  y0,
  x0 + (x1 - x0) / 3,
  y0 + (y1 - y0) / 3,
  x1 - (x1 - x0) / 3,
  y1 - (y1 - y0) / 3,
  x1,
  y1,
  w,
]

/**
 * A circular arc as a single cubic — angles in degrees, y down. The handle
 * length is the standard 4/3·tan(θ/4); one cubic holds the radius to well
 * under a percent out to ~140°, and keeping it to one is what lets an arc
 * morph into a line or a wave without changing shape count.
 */
export const arc = (cx: number, cy: number, r: number, a0: number, a1: number, w: number): GlyphStroke => {
  const t0 = (a0 * Math.PI) / 180
  const t1 = (a1 * Math.PI) / 180
  const k = (4 / 3) * Math.tan((t1 - t0) / 4) * r
  const x0 = cx + r * Math.cos(t0)
  const y0 = cy + r * Math.sin(t0)
  const x3 = cx + r * Math.cos(t1)
  const y3 = cy + r * Math.sin(t1)
  return [x0, y0, x0 - k * Math.sin(t0), y0 + k * Math.cos(t0), x3 + k * Math.sin(t1), y3 - k * Math.cos(t1), x3, y3, w]
}

/** The preset marks. Three strokes each, so every pair morphs one-to-one. */
export const GLYPHS: Record<GlyphName, GlyphStroke[]> = {
  waves: [
    [18, 34, 38, 20, 62, 48, 82, 34, 11],
    [24, 53, 41, 40, 59, 66, 76, 53, 10],
    [31, 72, 44, 61, 56, 83, 69, 72, 9],
  ],
  play: [line(36, 27, 74, 50, 11), line(74, 50, 36, 73, 11), line(36, 73, 36, 27, 11)],
  bars: [line(30, 46, 30, 72, 12), line(50, 28, 50, 72, 12), line(70, 38, 70, 72, 12)],
  broadcast: [arc(18, 50, 18, -50, 50, 10), arc(18, 50, 36, -46, 46, 10), arc(18, 50, 54, -42, 42, 10)],
  spark: [line(50, 20, 50, 80, 10), line(24, 35, 76, 65, 10), line(24, 65, 76, 35, 10)],
  smile: [line(38, 34, 38, 42, 11), line(62, 34, 62, 42, 11), arc(50, 46, 24, 22, 158, 10)],
}

export const bezierPoint = (s: GlyphStroke, t: number): [number, number] => {
  const u = 1 - t
  const a = u * u * u
  const b = 3 * u * u * t
  const c = 3 * u * t * t
  const d = t * t * t
  return [a * s[0] + b * s[2] + c * s[4] + d * s[6], a * s[1] + b * s[3] + c * s[5] + d * s[7]]
}

/** Arc length by chords. Drives the stroke-by-stroke draw-on. */
export const strokeLength = (s: GlyphStroke): number => {
  let len = 0
  let prev = bezierPoint(s, 0)
  for (let i = 1; i <= 24; i++) {
    const p = bezierPoint(s, i / 24)
    len += Math.hypot(p[0] - prev[0], p[1] - prev[1])
    prev = p
  }
  return len
}

/** A stroke shrunk to its own midpoint with no width — where a new stroke grows from. */
export const collapse = (s: GlyphStroke): GlyphStroke => {
  const m = bezierPoint(s, 0.5)
  return [m[0], m[1], m[0], m[1], m[0], m[1], m[0], m[1], 0]
}

/**
 * Two stroke lists made the same length. A stroke with no partner morphs
 * to or from a point at its own middle, so marks with different stroke
 * counts still morph instead of popping.
 */
export const alignStrokes = (a: GlyphStroke[], b: GlyphStroke[]): GlyphStroke[][] => {
  const n = Math.max(a.length, b.length)
  const A = []
  const B = []
  for (let i = 0; i < n; i++) {
    A.push(a[i] ?? collapse(b[i]))
    B.push(b[i] ?? collapse(a[i]))
  }
  return [A, B]
}

/** Anticipation and overshoot — the strokes pull back before they travel. */
export const easeInOutBack = (t: number): number => {
  const c = 1.2 * 1.525
  const x = clamp(t, 0, 1)
  return x < 0.5
    ? (Math.pow(2 * x, 2) * ((c + 1) * 2 * x - c)) / 2
    : (Math.pow(2 * x - 2, 2) * ((c + 1) * (x * 2 - 2) + c) + 2) / 2
}

export const easeOutCubic = (t: number): number => 1 - Math.pow(1 - clamp(t, 0, 1), 3)

/**
 * The mark part-way from `a` to `b`. Each stroke starts `stagger` later than
 * the one before, so the morph reads as a gesture, not a crossfade. Widths
 * are floored at zero because the overshoot would otherwise take them
 * negative.
 */
export const morphStrokes = (a: GlyphStroke[], b: GlyphStroke[], t: number, stagger: number): GlyphStroke[] => {
  const [A, B] = alignStrokes(a, b)
  const n = A.length
  const st = n > 1 ? Math.min(stagger, 0.5 / (n - 1)) : 0
  const span = 1 - st * (n - 1)
  return A.map((s, i) => {
    const k = easeInOutBack((t - i * st) / span)
    const out = s.map((v, j) => v + (B[i][j] - v) * k) as GlyphStroke
    out[8] = Math.max(0, out[8])
    return out
  })
}

/**
 * The fold for a corner dragged from its rest point on the rim to `(qx, qy)`,
 * in sticker units (radius 1, y up).
 *
 * Returns the unit direction pointing at the corner, the fold line's offset
 * along it, and the curl radius. The fold sits where the lifted corner,
 * rolled round a cylinder of radius `r` and laid back flat, lands exactly on
 * the drag point: `(q·d + c·d − πr) / 2`. The radius shrinks with short drags
 * so the first pixel of a peel does not jump.
 */
export const peelGeometry = (
  angleDeg: number,
  qx: number,
  qy: number,
  radius: number,
): { dx: number; dy: number; fold: number; r: number } => {
  const a = (angleDeg * Math.PI) / 180
  const cx = Math.cos(a)
  const cy = Math.sin(a)
  const len = Math.hypot(cx - qx, cy - qy)
  if (!(len > 1e-4)) return { dx: cx, dy: cy, fold: 9, r: 0 }
  const dx = (cx - qx) / len
  const dy = (cy - qy) / len
  const r = Math.min(radius, len * 0.3)
  return { dx, dy, fold: (qx * dx + qy * dy + cx * dx + cy * dy - Math.PI * r) / 2, r }
}

/**
 * Where a point of the sheet ends up, measured from the fold along the peel
 * direction, given how far past the fold it started (`s`). Flat before the
 * fold, round the roll, then laid back over the face. The shader inverts
 * exactly this.
 */
export const landing = (s: number, r: number): number =>
  s <= 0 ? s : s < Math.PI * r ? r * Math.sin(s / r) : Math.PI * r - s

/** The drag point keeps the corner pulled inward and close to the sheet. */
export const clampDrag = (angleDeg: number, qx: number, qy: number): [number, number] => {
  const a = (angleDeg * Math.PI) / 180
  const cx = Math.cos(a)
  const cy = Math.sin(a)
  // Never past the rim along the peel direction: that would fold the sheet
  // outward, which no sticker does.
  const along = qx * cx + qy * cy
  const over = along > 0.98 ? along - 0.98 : 0
  let x = qx - cx * over
  let y = qy - cy * over
  const m = Math.hypot(x, y)
  if (m > 1.2) {
    x *= 1.2 / m
    y *= 1.2 / m
  }
  return [x, y]
}

/** Where the corner rests for a given `peel`. */
export const restCorner = (angleDeg: number, peel: number): [number, number] => {
  const a = (angleDeg * Math.PI) / 180
  const k = 1 - clamp(peel, 0, 1) * 1.6
  return [Math.cos(a) * k, Math.sin(a) * k]
}

/** Pointer 0..1 over the stage, as a lean toward it in degrees. */
export const tiltFromPointer = (x: number, y: number, max: number): { ax: number; ay: number } => ({
  ax: clamp((0.5 - y) * 2 * max, -max, max),
  ay: clamp((x - 0.5) * 2 * max, -max, max),
})

/** Unit view vector in sticker space for a tilt. The foil phase hangs off it. */
export const viewFromTilt = (ax: number, ay: number): [number, number, number] => {
  const rx = (ax * Math.PI) / 180
  const ry = (ay * Math.PI) / 180
  const x = Math.sin(ry) * Math.cos(rx)
  const y = -Math.sin(rx)
  const z = Math.cos(ry) * Math.cos(rx)
  const len = Math.hypot(x, y, z) || 1
  return [x / len, y / len, z / len]
}

/** One semi-implicit Euler step of a damped spring. Stable at 30 fps. */
export const springStep = (x: number, v: number, target: number, k: number, c: number, dt: number): [number, number] => {
  const nv = v + (-k * (x - target) - c * v) * dt
  return [x + nv * dt, nv]
}

/** `#rgb` / `#rrggbb` to 0..1 channels, or the fallback. */
export const hexToRgb = (hex: string, fb: [number, number, number]): [number, number, number] => {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(hex).trim())
  if (!m) return fb
  const h = m[1].length === 3 ? m[1].replace(/./g, (c) => c + c) : m[1]
  return [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255]
}
// #endregion

const DEFAULT_GLYPHS: GlyphName[] = ["waves", "play", "bars", "broadcast", "spark", "smile"]
const LABELS: Record<GlyphName, string> = {
  waves: "Waves",
  play: "Play",
  bars: "Bars",
  broadcast: "Broadcast",
  spark: "Spark",
  smile: "Smile",
}

/** Share of the sticker's diameter the 100 × 100 mark box covers. */
const BOX = 0.64
/** Half-width of the canvas in sticker radii. Room for the flap and the shadow. */
const SPAN = 1.5
/** Resolution of the ink mask. */
const TEX = 1024
const CURL = 0.15
const MORPH_MS = 1150

const resolveGlyphs = (list: (GlyphName | StickerGlyph)[] | undefined): StickerGlyph[] => {
  const out: StickerGlyph[] = []
  for (const g of list && list.length ? list : DEFAULT_GLYPHS) {
    if (typeof g === "string") {
      if (GLYPHS[g]) out.push({ name: LABELS[g], strokes: GLYPHS[g] })
    } else if (g && ((g.strokes && g.strokes.length) || g.d)) {
      out.push(g)
    }
  }
  return out.length ? out : [{ name: LABELS.waves, strokes: GLYPHS.waves }]
}

const strokePath = (s: GlyphStroke, k: number, o: number) =>
  "M" +
  [s[0], s[1]].map((v) => (v - o) * k).join(" ") +
  "C" +
  [s[2], s[3], s[4], s[5], s[6], s[7]].map((v) => ((v - o) * k).toFixed(2)).join(" ")

// ---------------------------------------------------------------------------
// The ink mask: the mark painted white on a transparent 2D canvas, sampled by
// the shader at the *source* point of every pixel, so the ink rides round the
// curl with the sheet.

const pathCache = new Map<string, Path2D>()
const path2d = (d: string) => {
  let p = pathCache.get(d)
  if (!p) {
    p = new Path2D(d)
    pathCache.set(d, p)
  }
  return p
}

function strokeAll(ctx: CanvasRenderingContext2D, strokes: GlyphStroke[], draw: number) {
  const n = strokes.length
  const st = n > 1 ? Math.min(0.16, 0.5 / (n - 1)) : 0
  strokes.forEach((s, i) => {
    if (s[8] <= 0.01) return
    const local = clamp((draw - i * st) / (1 - st * (n - 1)), 0, 1)
    if (local <= 0) return
    ctx.lineWidth = s[8]
    ctx.beginPath()
    ctx.moveTo(s[0], s[1])
    ctx.bezierCurveTo(s[2], s[3], s[4], s[5], s[6], s[7])
    if (local < 1) {
      const len = strokeLength(s)
      ctx.setLineDash([len * local, len + 1])
    } else {
      ctx.setLineDash([])
    }
    ctx.stroke()
  })
  ctx.setLineDash([])
}

function drawGlyph(ctx: CanvasRenderingContext2D, g: StickerGlyph, alpha: number, scale: number, draw: number) {
  if (alpha <= 0.001) return
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.translate(50, 50)
  ctx.scale(scale, scale)
  ctx.translate(-50, -50)
  if (g.strokes && g.strokes.length) {
    strokeAll(ctx, g.strokes, draw)
  } else if (g.d) {
    ctx.globalAlpha = alpha * easeOutCubic(draw)
    ctx.fill(path2d(g.d), "evenodd")
  }
  ctx.restore()
}

function paintMask(
  ctx: CanvasRenderingContext2D,
  from: StickerGlyph | null,
  to: StickerGlyph,
  t: number,
  draw: number,
) {
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, TEX, TEX)
  const k = (BOX * TEX) / 100
  const o = (TEX * (1 - BOX)) / 2
  ctx.setTransform(k, 0, 0, k, o, o)
  ctx.fillStyle = "#fff"
  ctx.strokeStyle = "#fff"
  ctx.lineCap = "round"
  ctx.lineJoin = "round"
  if (!from || t >= 1) {
    drawGlyph(ctx, to, 1, 1, draw)
  } else if (from.strokes && to.strokes && from.strokes.length && to.strokes.length) {
    strokeAll(ctx, morphStrokes(from.strokes, to.strokes, t, 0.12), draw)
  } else {
    const e = t * t * (3 - 2 * t)
    drawGlyph(ctx, from, 1 - e, 1 - 0.2 * e, 1)
    drawGlyph(ctx, to, e, 0.8 + 0.2 * e, 1)
  }
}

// ---------------------------------------------------------------------------
// Shaders

const VERT = `#version 300 es
void main() {
  // One oversized triangle. The *2 is what makes it cover the viewport.
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2) * 2.0 - 1.0;
  gl_Position = vec4(p, 0.0, 1.0);
}
`

const FRAG = `#version 300 es
precision highp float;
out vec4 fragColor;

uniform vec2 uRes;
uniform float uSpan;
uniform vec3 uView;
uniform float uTime;
uniform vec3 uTint;
uniform vec3 uInk;
uniform float uFoil;
uniform float uRim;
uniform vec2 uDir;
uniform float uFold;
uniform float uCurl;
uniform float uReveal;
uniform float uHeat;
uniform float uPhase;
uniform float uSweep;
uniform float uLift;
uniform sampler2D tMask;

const float PI = 3.14159265;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p) {
  float s = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) { s += a * vnoise(p); p = p * 2.03 + 7.1; a *= 0.5; }
  return s;
}

float pixel() { return 2.0 * uSpan / uRes.y; }

// Coverage of the unpeeled sheet at q, with the stamping reveal applied.
float sheet(vec2 q) {
  float r = length(q);
  float px = pixel();
  float disk = 1.0 - smoothstep(1.0 - px, 1.0 + px, r);
  float rr = uReveal * 1.12;
  return disk * (1.0 - smoothstep(rr - 0.06, rr, r));
}

float mask(vec2 q) { return texture(tMask, vec2(q.x * 0.5 + 0.5, 0.5 - q.y * 0.5)).a; }

vec3 spectrum(float ph) { return 0.5 + 0.5 * cos(6.28318 * (ph + vec3(0.0, 0.33, 0.67))); }

// Turn a colour's hue by a (radians) in YIQ, keeping its brightness. The foil
// swings the tint's hue either way, so it stays recognisably *its* colour —
// green foil goes cyan, violet and gold, it does not become a test card.
vec3 hueTurn(vec3 c, float a) {
  float y = dot(c, vec3(0.299, 0.587, 0.114));
  float i = dot(c, vec3(0.596, -0.274, -0.322));
  float q = dot(c, vec3(0.211, -0.523, 0.312));
  float cs = cos(a);
  float sn = sin(a);
  vec2 iq = vec2(i * cs - q * sn, i * sn + q * cs);
  return max(vec3(y + 0.956 * iq.x + 0.621 * iq.y, y - 0.272 * iq.x - 0.647 * iq.y, y - 1.106 * iq.x + 1.703 * iq.y), 0.0);
}

// The printed face at sheet point q, seen with surface normal n.
vec3 face(vec2 q, vec3 n) {
  // A turned surface catches a different slice of the rainbow.
  vec2 v = uView.xy + n.xy * 0.9;
  float r = length(q);

  // Diffraction from a light off the top-left corner: the bands fan out from
  // it like the streaks on a disc, warped so they read as foil, not a ramp.
  vec2 dq = q - vec2(-1.8, 1.6);
  float warp = fbm(q * 0.75 + vec2(uTime * 0.02, -uTime * 0.015));
  float ph = length(dq) * 0.42 + atan(dq.y, dq.x) * 0.3 + warp * 0.38
    + v.x * 0.9 - v.y * 0.6 + uPhase;
  // Lingers near the tint and swings out to its neighbours: the sqrt
  // flattens the wave around zero, the bias leans it toward the cool side.
  float sw = sin(6.28318 * ph);
  float swing = 1.4 * sw * sqrt(abs(sw)) + sin(12.56637 * ph + 1.1) * 0.3 - 0.3;
  vec3 col = hueTurn(uTint, swing * uFoil);
  vec3 rainbow = spectrum(ph * 2.0);
  col = mix(col, rainbow, 0.14 * uFoil);
  // Darker streaks across the bands, as in pressed foil.
  float streak = 0.5 + 0.5 * sin(ph * 6.28318 * 1.5 + 1.4 + warp * 2.5);
  col *= 0.74 + 0.4 * streak;

  // The ink: translucent, so the foil still glows through it darker.
  float m = mask(q);
  float e = 0.01;
  vec2 g = vec2(mask(q + vec2(e, 0.0)) - mask(q - vec2(e, 0.0)), mask(q + vec2(0.0, e)) - mask(q - vec2(0.0, e)));
  float edge = -dot(g, normalize(vec2(-0.55, 0.85) - uView.xy * 0.6));
  vec3 inkCol = uInk * 0.7 + col * col * vec3(0.32, 0.22, 0.42);
  col = mix(col, inkCol, m * 0.92);
  col += edge * 0.05;

  // Pearl rim, brushed round the edge, with a hairline where it meets the face.
  float rimIn = 1.0 - uRim;
  float px = pixel();
  float rim = smoothstep(rimIn - px, rimIn + px, r);
  vec3 pearl = mix(vec3(0.9, 0.88, 0.95), spectrum(ph * 1.6 + 0.35 + r * 2.0), 0.3);
  pearl *= 0.9 + 0.14 * vnoise(normalize(q + 1e-5) * 28.0 + r * 3.0);
  pearl *= 0.85 + 0.25 * smoothstep(rimIn, 1.0, r);
  col = mix(col, pearl, rim);
  col *= 1.0 - 0.22 * exp(-pow((r - rimIn) / 0.01, 2.0));

  // A sheen that follows the view, and a band of light that crosses on cue.
  float sheen = pow(max(0.0, 1.0 - length(q + v * 1.5 - vec2(-0.4, 0.45)) / 1.35), 2.0);
  float band = exp(-pow((dot(q, vec2(0.87, -0.5)) - uSweep) / 0.15, 2.0));
  col += (sheen * 0.2 + band * 0.5 * mix(vec3(1.0), rainbow, 0.35)) * (1.0 - m * 0.55);

  // Glitter flakes that wink as the view changes.
  vec2 cell = floor(q * 150.0);
  float h = hash(cell);
  float wink = pow(0.5 + 0.5 * sin(uTime * 1.7 + h * 40.0 + (v.x - v.y) * 24.0), 24.0);
  col += step(0.993, h) * wink * 0.75 * (1.0 - m * 0.8);

  // Light falling off as the surface turns away round the curl.
  col *= 0.42 + 0.58 * clamp(n.z, 0.0, 1.0);

  // The stamping reveal's white-hot leading edge.
  float rr = uReveal * 1.12;
  col += uHeat * exp(-pow((r - rr + 0.03) / 0.035, 2.0)) * vec3(1.0, 0.96, 0.88) * 1.6;
  return col;
}

// The back of the sticker: silvered liner with a faint rainbow, lit as a curve.
vec3 liner(vec2 q, vec3 n) {
  vec3 L = normalize(vec3(-0.45, 0.6, 0.75));
  float diff = max(dot(n, L), 0.0);
  float spec = pow(max(dot(reflect(-L, n), vec3(0.0, 0.0, 1.0)), 0.0), 20.0);
  vec3 base = mix(vec3(0.82, 0.84, 0.88), spectrum(dot(q, vec2(0.9, 0.5)) * 1.3 + uView.x + n.x * 1.6 + uPhase), 0.22);
  // the liner's own rim, a shade darker, so the flap reads as die-cut
  base *= 1.0 - 0.18 * smoothstep(1.0 - uRim, 1.0, length(q));
  // and the mark ghosting through the film, mirrored because it is the back
  base *= 1.0 - 0.1 * mask(q);
  return base * (0.3 + 0.8 * diff) + spec * 0.9;
}

void main() {
  vec2 p = (gl_FragCoord.xy / uRes * 2.0 - 1.0) * uSpan;
  float px = pixel();
  float R = max(uCurl, 1e-4);
  vec2 dir = uDir;
  float d = dot(p, dir) - uFold;
  float on = min(uReveal * 1.6, 1.0);

  // Shadow on the stage under the sheet, deeper when it lifts.
  vec2 so = vec2(0.04, -0.07 - 0.06 * uLift);
  float sh = (1.0 - smoothstep(0.82, 1.14 + 0.14 * uLift, length(p - so))) * (0.42 + 0.12 * uLift);
  // The peeled-away part casts nothing: it is up on the roll.
  sh *= 1.0 - smoothstep(-R * 0.2, R * 0.9, d);
  // and a contact shadow just past the roll, where the sheet left the stage
  // only where the roll actually is, which is short at the ends of the chord
  if (d > 0.0) sh = max(sh, 0.4 * exp(-max(d - R, 0.0) / (R * 0.3)) * sheet(p + (R * 1.57 - d) * dir) * sheet(p - d * dir));
  vec4 acc = vec4(0.0, 0.0, 0.0, sh * on);

  // Front: the flat face, then the underside of the roll.
  if (d < R) {
    vec2 src;
    vec3 n;
    if (d < 0.0) {
      src = p;
      n = vec3(0.0, 0.0, 1.0);
    } else {
      float th = asin(clamp(d / R, 0.0, 1.0));
      src = p + (R * th - d) * dir;
      n = vec3(-dir * sin(th), cos(th));
    }
    float a = sheet(src) * (1.0 - smoothstep(R - px, R, d));
    if (a > 0.0) {
      vec3 c = face(src, n);
      // The crease: the face just inside the fold and the underside of the
      // roll sit in each other's shade. Symmetric in d, so it is continuous.
      float roll = sheet(p + (R * 0.6 - d) * dir);
      c *= 1.0 - 0.5 * exp(-abs(d) / (R * 0.55)) * roll;
      if (d < 0.0) {
        // and the laid-back flap's shadow, offset away from the light
        vec2 p2 = p + vec2(-0.035, 0.045);
        float d2 = dot(p2, dir) - uFold;
        if (d2 < 0.0) c *= 1.0 - 0.4 * sheet(p2 + (PI * R - 2.0 * d2) * dir);
        else if (d2 < R) c *= 1.0 - 0.4 * sheet(p2 + (R * (PI - asin(d2 / R)) - d2) * dir);
      }
      acc = vec4(c * a, a) + acc * (1.0 - a);
    }
  }

  // Back: the top of the roll, then the flap laid back over the face.
  if (d < R) {
    float s;
    vec3 n;
    if (d < 0.0) {
      s = PI * R - d;
      n = vec3(0.0, 0.0, 1.0);
    } else {
      float th = PI - asin(clamp(d / R, 0.0, 1.0));
      s = R * th;
      n = vec3(dir * sin(th), -cos(th));
    }
    vec2 src = p + (s - d) * dir;
    float a = sheet(src) * (1.0 - smoothstep(R - px, R, d));
    if (a > 0.0) acc = vec4(liner(src, n) * a, a) + acc * (1.0 - a);
  }

  fragColor = vec4(min(acc.rgb, vec3(acc.a)), acc.a);
}
`

const UNIFORMS = [
  "uRes",
  "uSpan",
  "uView",
  "uTime",
  "uTint",
  "uInk",
  "uFoil",
  "uRim",
  "uDir",
  "uFold",
  "uCurl",
  "uReveal",
  "uHeat",
  "uPhase",
  "uSweep",
  "uLift",
  "tMask",
] as const

type Spring = { x: number; v: number }

const CSS = `
.hsk-root { position: relative; width: 100%; overflow: hidden; container-type: size; isolation: isolate;
  display: flex; align-items: center; justify-content: center; box-sizing: border-box;
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; -webkit-tap-highlight-color: transparent; }
.hsk-root canvas, .hsk-root svg { max-width: none; }
.hsk-night { background: radial-gradient(70% 70% at 50% 44%, #141416 0%, #060607 55%, #000 100%); color: #f4f3f7; }
.hsk-studio { background: radial-gradient(75% 75% at 50% 40%, #f7f5f1 0%, #e4e1db 70%, #d6d2cb 100%); color: #19171d; }
.hsk-clear { background: transparent; color: inherit; }
.hsk-slot { --hsk-d: min(60vmin, 440px); position: relative; width: var(--hsk-d); height: var(--hsk-d); perspective: 900px; flex: none; }
@supports (width: 1cqmin) { .hsk-slot { --hsk-d: min(64cqmin, 440px); } }
.hsk-glow { position: absolute; inset: -38%; border-radius: 50%; pointer-events: none; filter: blur(8px); }
.hsk-body { position: absolute; inset: 0; transform-style: preserve-3d; will-change: transform; }
.hsk-canvas { position: absolute; left: -25%; top: -25%; width: 150%; height: 150%; display: block; pointer-events: none; }
.hsk-fallback { position: absolute; inset: 0; border-radius: 50%; overflow: hidden;
  box-shadow: 0 18px 50px -12px rgba(0,0,0,0.55), inset 0 0 0 6px rgba(255,255,255,0.55); }
.hsk-fallback svg { position: absolute; inset: 0; width: 100%; height: 100%; }
.hsk-hit { position: absolute; inset: 0; border-radius: 50%; border: 0; padding: 0; margin: 0; background: transparent;
  cursor: pointer; touch-action: pan-y; appearance: none; -webkit-appearance: none; color: inherit; }
.hsk-hit:focus { outline: none; }
.hsk-hit:focus-visible { outline: 1.5px solid currentColor; outline-offset: 10px; }
.hsk-corner { position: absolute; width: 26%; height: 26%; border-radius: 50%; transform: translate(-50%, -50%);
  cursor: grab; touch-action: none; }
.hsk-corner:active { cursor: grabbing; }
`

export default function HoloStickerLogo({
  glyphs,
  index,
  defaultIndex = 0,
  onIndexChange,
  cycle = 5200,
  size,
  height = "100svh",
  tone = "night",
  tint = "#2bd67b",
  ink = "#120a1c",
  foil = 1,
  rim = 0.075,
  peel = 0.3,
  peelAngle = 48,
  tilt = 14,
  label = "Holo sticker",
  className,
}: HoloStickerLogoProps) {
  const glyphKey = JSON.stringify(glyphs ?? null)
  const list = React.useMemo(() => resolveGlyphs(glyphs), [glyphKey])
  const count = list.length

  const [ownIndex, setOwnIndex] = React.useState(defaultIndex)
  const current = (((index ?? ownIndex) % count) + count) % count
  const glyph = list[current]

  const [failed, setFailed] = React.useState(false)
  const [reduced, setReduced] = React.useState(false)

  const rootRef = React.useRef<HTMLDivElement>(null)
  const slotRef = React.useRef<HTMLDivElement>(null)
  const bodyRef = React.useRef<HTMLDivElement>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const reducedRef = React.useRef(reduced)
  reducedRef.current = reduced

  const tintRgb = hexToRgb(tint, [0.17, 0.84, 0.48])
  const inkRgb = hexToRgb(ink, [0.07, 0.04, 0.11])
  const props = React.useRef({ tintRgb, inkRgb, foil, rim, peel, peelAngle, tilt })
  props.current = { tintRgb, inkRgb, foil, rim, peel, peelAngle, tilt }

  // Everything the frame loop animates. Kept out of React state: it changes
  // sixty times a second and none of it is markup.
  const anim = React.useRef({
    ax: { x: 0, v: 0 } as Spring,
    ay: { x: 0, v: 0 } as Spring,
    spin: { x: 0, v: 0 } as Spring,
    scale: { x: 1, v: 0 } as Spring,
    qx: { x: 0, v: 0 } as Spring,
    qy: { x: 0, v: 0 } as Spring,
    seeded: false,
    pointer: null as null | { x: number; y: number },
    hoverCorner: false,
    drag: null as null | { id: number; ox: number; oy: number; sx: number; sy: number; travel: number },
    dragTarget: [0, 0] as [number, number],
    sweepAt: -1e9,
    phase: 0,
    phaseFrom: 0,
    phaseAt: -1e9,
    shown: null as StickerGlyph | null,
    morph: null as null | { from: StickerGlyph; to: StickerGlyph; at: number },
    dirty: true,
    kickSign: 1,
  })

  // -- reduced motion --------------------------------------------------------
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => setReduced(mq.matches)
    sync()
    mq.addEventListener("change", sync)
    return () => mq.removeEventListener("change", sync)
  }, [])

  // -- the mark ----------------------------------------------------------------
  const go = React.useCallback(
    (step: number) => {
      const next = (((current + step) % count) + count) % count
      onIndexChange?.(next)
      if (index === undefined) setOwnIndex(next)
    },
    [current, count, index, onIndexChange],
  )

  React.useEffect(() => {
    const a = anim.current
    if (!a.shown) {
      a.shown = glyph
      a.dirty = true
      return
    }
    const target = a.morph ? a.morph.to : a.shown
    if (target === glyph) return
    const now = performance.now()
    if (reducedRef.current) {
      a.shown = glyph
      a.morph = null
      a.dirty = true
      return
    }
    // Start from what is on screen, mid-morph included.
    let from = a.morph ? a.morph.to : a.shown
    if (a.morph) {
      const t = clamp((now - a.morph.at) / MORPH_MS, 0, 1)
      const f = a.morph.from
      const g = a.morph.to
      if (f.strokes && g.strokes) from = { name: g.name, strokes: morphStrokes(f.strokes, g.strokes, t, 0.12) }
    }
    a.morph = { from, to: glyph, at: now }
    a.dirty = true
    // The cinematic part: the sheet dips, spins back, swings and the foil runs
    // a full turn of the spectrum, landing where it started.
    a.kickSign = -a.kickSign
    a.spin.v += 260 * a.kickSign
    a.scale.v -= 1.5
    a.ay.v += 90 * a.kickSign
    a.phaseFrom = a.phase
    a.phaseAt = now
    a.sweepAt = now + 120
    const ang = (props.current.peelAngle * Math.PI) / 180
    a.qx.v -= Math.cos(ang) * 2.4
    a.qy.v -= Math.sin(ang) * 2.4
  }, [glyph])

  // auto-cycle, paused while someone is handling it
  React.useEffect(() => {
    if (!cycle || cycle < 600 || reduced || count < 2) return
    const t = setInterval(() => {
      const a = anim.current
      if (a.drag || a.pointer || document.hidden) return
      go(1)
    }, cycle)
    return () => clearInterval(t)
  }, [cycle, reduced, count, go])

  // -- the sheet -----------------------------------------------------------
  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const maskCanvas = document.createElement("canvas")
    maskCanvas.width = TEX
    maskCanvas.height = TEX
    const mctx = maskCanvas.getContext("2d")
    if (!mctx) {
      setFailed(true)
      return
    }

    let gl: WebGL2RenderingContext | null = null
    let program: WebGLProgram | null = null
    let vs: WebGLShader | null = null
    let fs: WebGLShader | null = null
    let vao: WebGLVertexArrayObject | null = null
    let tex: WebGLTexture | null = null
    const loc: Record<string, WebGLUniformLocation | null> = {}
    let raf = 0
    let visible = true
    let lost = false
    let last = performance.now()
    const t0 = last

    const compile = (g: WebGL2RenderingContext, type: number, src: string) => {
      const s = g.createShader(type)
      if (!s) return null
      g.shaderSource(s, src)
      g.compileShader(s)
      if (!g.getShaderParameter(s, g.COMPILE_STATUS)) {
        g.deleteShader(s)
        return null
      }
      return s
    }

    const release = () => {
      if (!gl) return
      if (program) gl.deleteProgram(program)
      if (vs) gl.deleteShader(vs)
      if (fs) gl.deleteShader(fs)
      if (vao) gl.deleteVertexArray(vao)
      if (tex) gl.deleteTexture(tex)
      program = vs = fs = null
      vao = null
      tex = null
    }

    const build = () => {
      gl = canvas.getContext("webgl2", { alpha: true, premultipliedAlpha: true, antialias: false })
      if (!gl) return false
      vs = compile(gl, gl.VERTEX_SHADER, VERT)
      fs = compile(gl, gl.FRAGMENT_SHADER, FRAG)
      program = gl.createProgram()
      if (!vs || !fs || !program) return false
      gl.attachShader(program, vs)
      gl.attachShader(program, fs)
      gl.linkProgram(program)
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return false
      vao = gl.createVertexArray()
      tex = gl.createTexture()
      gl.bindTexture(gl.TEXTURE_2D, tex)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      for (const u of UNIFORMS) loc[u] = gl.getUniformLocation(program, u)
      anim.current.dirty = true
      return true
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr))
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr))
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
      }
    }

    const step = (s: Spring, target: number, k: number, c: number, dt: number) => {
      const [x, v] = springStep(s.x, s.v, target, k, c, dt)
      s.x = Number.isFinite(x) ? x : target
      s.v = Number.isFinite(v) ? v : 0
    }

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      const dt = Math.min(1 / 30, Math.max(0, (now - last) / 1000))
      last = now
      if (!visible || lost || !gl || !program) return
      const a = anim.current
      const P = props.current
      const still = reducedRef.current

      // tilt: toward the pointer, or a slow drift when nobody is there
      const time = (now - t0) / 1000
      let tx = 0
      let ty = 0
      if (a.pointer) {
        const t = tiltFromPointer(a.pointer.x, a.pointer.y, P.tilt)
        tx = t.ax
        ty = t.ay
      } else if (!still) {
        tx = Math.sin(time * 0.5) * P.tilt * 0.32
        ty = Math.sin(time * 0.37 + 1) * P.tilt * 0.42
      }
      if (a.drag) {
        tx *= 0.4
        ty *= 0.4
      }
      step(a.ax, tx, 60, 11, dt)
      step(a.ay, ty, 60, 11, dt)
      step(a.spin, 0, 80, 8.5, dt)
      step(a.scale, 1 + (a.hoverCorner || a.drag ? 0.015 : 0), 170, 13, dt)

      // the corner
      const ang = P.peelAngle
      if (!a.seeded) {
        const r = restCorner(ang, P.peel)
        a.qx.x = r[0]
        a.qy.x = r[1]
        a.seeded = true
      }
      let qt: [number, number]
      if (a.drag && a.pointer) qt = a.dragTarget
      else qt = restCorner(ang, P.peel + (a.hoverCorner ? 0.12 : 0))
      const soft = a.drag ? 300 : 120
      step(a.qx, qt[0], soft, a.drag ? 30 : 10, dt)
      step(a.qy, qt[1], soft, a.drag ? 30 : 10, dt)
      const geo = peelGeometry(ang, a.qx.x, a.qy.x, CURL)

      // morph
      let mt = 1
      if (a.morph) {
        mt = clamp((now - a.morph.at) / MORPH_MS, 0, 1)
        a.dirty = true
        if (mt >= 1) {
          a.shown = a.morph.to
          a.morph = null
        }
      }
      if (a.dirty && a.shown) {
        paintMask(mctx, a.morph ? a.morph.from : null, a.morph ? a.morph.to : a.shown, mt, 1)
        gl.bindTexture(gl.TEXTURE_2D, tex)
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, maskCanvas)
        a.dirty = false
      }

      // a full turn of the spectrum per morph, eased, so it lands where it began
      const pk = clamp((now - a.phaseAt) / 1300, 0, 1)
      const phaseNow = a.phaseFrom + (pk < 1 ? pk * pk * (3 - 2 * pk) : 1)
      if (pk >= 1) a.phase = a.phaseFrom + 1
      // and a band of light on cue, plus now and then on its own
      if (!still && now - a.sweepAt > 7000) a.sweepAt = now
      const sweep = -1.9 + 3.8 * easeOutCubic((now - a.sweepAt) / 1100)

      // view in sticker space: un-spin it, so the light stays in the room
      const v = viewFromTilt(a.ax.x, a.ay.x)
      const sr = (-a.spin.x * Math.PI) / 180
      const vx = v[0] * Math.cos(sr) - v[1] * Math.sin(sr)
      const vy = v[0] * Math.sin(sr) + v[1] * Math.cos(sr)

      resize()
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.useProgram(program)
      gl.bindVertexArray(vao)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, tex)
      gl.uniform1i(loc.tMask, 0)
      gl.uniform2f(loc.uRes, canvas.width, canvas.height)
      gl.uniform1f(loc.uSpan, SPAN)
      gl.uniform3f(loc.uView, vx, vy, v[2])
      gl.uniform1f(loc.uTime, still ? 0 : time)
      gl.uniform3f(loc.uTint, P.tintRgb[0], P.tintRgb[1], P.tintRgb[2])
      gl.uniform3f(loc.uInk, P.inkRgb[0], P.inkRgb[1], P.inkRgb[2])
      gl.uniform1f(loc.uFoil, clamp(P.foil, 0, 1))
      gl.uniform1f(loc.uRim, clamp(P.rim, 0, 0.3))
      gl.uniform2f(loc.uDir, geo.dx, geo.dy)
      gl.uniform1f(loc.uFold, geo.fold)
      gl.uniform1f(loc.uCurl, geo.r)
      gl.uniform1f(loc.uReveal, 1)
      gl.uniform1f(loc.uHeat, 0)
      gl.uniform1f(loc.uPhase, phaseNow)
      gl.uniform1f(loc.uSweep, sweep)
      gl.uniform1f(loc.uLift, clamp((a.scale.x - 1) * 40, 0, 1))
      gl.drawArrays(gl.TRIANGLES, 0, 3)

      const body = bodyRef.current
      if (body) {
        body.style.transform =
          "rotateX(" +
          a.ax.x.toFixed(3) +
          "deg) rotateY(" +
          a.ay.x.toFixed(3) +
          "deg) rotateZ(" +
          a.spin.x.toFixed(3) +
          "deg) scale(" +
          a.scale.x.toFixed(4) +
          ")"
      }
    }

    const onLost = (ev: Event) => {
      ev.preventDefault()
      lost = true
    }
    const onRestored = () => {
      release()
      lost = false
      if (!build()) setFailed(true)
    }

    if (!build()) {
      release()
      setFailed(true)
      return
    }
    canvas.addEventListener("webglcontextlost", onLost)
    canvas.addEventListener("webglcontextrestored", onRestored)
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    const io = new IntersectionObserver((entries) => {
      visible = entries.some((en) => en.isIntersecting)
    })
    io.observe(canvas)
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
      io.disconnect()
      canvas.removeEventListener("webglcontextlost", onLost)
      canvas.removeEventListener("webglcontextrestored", onRestored)
      release()
    }
  }, [])

  // -- pointer ---------------------------------------------------------------
  // Pointer to sticker units: radius 1, y up, the spin taken back out.
  const toSticker = (clientX: number, clientY: number): [number, number] => {
    const slot = slotRef.current
    if (!slot) return [0, 0]
    const r = slot.getBoundingClientRect()
    const x = (clientX - (r.left + r.width / 2)) / (r.width / 2)
    const y = ((r.top + r.height / 2) - clientY) / (r.height / 2)
    const s = (anim.current.spin.x * Math.PI) / 180
    return [x * Math.cos(-s) - y * Math.sin(-s), x * Math.sin(-s) + y * Math.cos(-s)]
  }

  const onMove = (ev: React.PointerEvent) => {
    const root = rootRef.current
    if (!root) return
    const a = anim.current
    const rr = root.getBoundingClientRect()
    a.pointer = { x: (ev.clientX - rr.left) / rr.width, y: (ev.clientY - rr.top) / rr.height }
    const [sx, sy] = toSticker(ev.clientX, ev.clientY)
    if (a.drag && a.drag.id === ev.pointerId) {
      a.drag.travel = Math.max(a.drag.travel, Math.hypot(sx - a.drag.sx, sy - a.drag.sy))
      a.dragTarget = clampDrag(props.current.peelAngle, sx + a.drag.ox, sy + a.drag.oy)
    } else {
      const c = restCorner(props.current.peelAngle, props.current.peel * 0.5)
      a.hoverCorner = Math.hypot(sx - c[0], sy - c[1]) < 0.3
    }
  }

  const onLeave = (ev: React.PointerEvent) => {
    if (ev.pointerType === "mouse" || !anim.current.drag) {
      anim.current.pointer = null
      anim.current.hoverCorner = false
    }
  }

  const onCornerDown = (ev: React.PointerEvent) => {
    ev.preventDefault()
    ev.stopPropagation()
    const a = anim.current
    const [sx, sy] = toSticker(ev.clientX, ev.clientY)
    a.drag = { id: ev.pointerId, ox: a.qx.x - sx, oy: a.qy.x - sy, sx, sy, travel: 0 }
    a.dragTarget = [a.qx.x, a.qy.x]
    a.hoverCorner = true
    ;(ev.currentTarget as HTMLElement).setPointerCapture?.(ev.pointerId)
  }

  const onCornerUp = (ev: React.PointerEvent) => {
    const a = anim.current
    if (!a.drag || a.drag.id !== ev.pointerId) return
    const travel = a.drag.travel
    a.drag = null
    a.hoverCorner = false
    if (ev.pointerType !== "mouse") a.pointer = null
    // A tap flicks the corner; a hard peel swaps the mark.
    if (travel < 0.03) {
      const ang = (props.current.peelAngle * Math.PI) / 180
      a.qx.v -= Math.cos(ang) * 3
      a.qy.v -= Math.sin(ang) * 3
    } else if (travel > 0.6) {
      go(1)
    }
  }

  const onKey = (ev: React.KeyboardEvent) => {
    if (ev.key === "ArrowRight" || ev.key === "ArrowDown") {
      ev.preventDefault()
      go(1)
    } else if (ev.key === "ArrowLeft" || ev.key === "ArrowUp") {
      ev.preventDefault()
      go(-1)
    }
  }

  // -- markup ----------------------------------------------------------------
  const corner = restCorner(peelAngle, peel * 0.5)
  const wk = 2 * BOX
  const glowRgb = tintRgb.map((c) => Math.round(c * 255)).join(",")

  return (
    <div
      ref={rootRef}
      className={"hsk-root hsk-" + tone + (className ? " " + className : "")}
      style={{ height }}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      <style>{CSS}</style>
      <div ref={slotRef} className="hsk-slot" style={size ? ({ "--hsk-d": size } as React.CSSProperties) : undefined}>
        {tone !== "clear" ? (
          <div
            className="hsk-glow"
            aria-hidden="true"
            style={{
              background:
                "radial-gradient(closest-side, rgba(" +
                glowRgb +
                "," +
                (tone === "night" ? 0.16 : 0.22) +
                "), rgba(" +
                glowRgb +
                ",0.05) 55%, rgba(" +
                glowRgb +
                ",0) 100%)",
            }}
          />
        ) : null}

        <div ref={bodyRef} className="hsk-body">
          {failed ? (
            <div
              className="hsk-fallback"
              style={{
                background:
                  "conic-gradient(from 210deg, " + tint + ", #7fd9ff, #b48cff, #ff9ad5, #ffe38a, " + tint + ")",
              }}
            >
              <svg viewBox="-100 -100 200 200" aria-hidden="true">
                {(glyph.strokes ?? []).map((s, i) => (
                  <path
                    key={i}
                    d={strokePath(s, wk, 50)}
                    fill="none"
                    stroke={ink}
                    strokeOpacity={0.85}
                    strokeWidth={s[8] * wk}
                    strokeLinecap="round"
                  />
                ))}
                {glyph.d ? (
                  <path d={glyph.d} transform={"scale(" + wk + ") translate(-50 -50)"} fill={ink} fillRule="evenodd" />
                ) : null}
              </svg>
            </div>
          ) : (
            <canvas ref={canvasRef} className="hsk-canvas" aria-hidden="true" />
          )}
        </div>

        <button
          type="button"
          className="hsk-hit"
          aria-label={label + ": " + glyph.name + ". Press to change the mark."}
          aria-roledescription="sticker"
          onClick={() => go(1)}
          onKeyDown={onKey}
        />
        <div
          className="hsk-corner"
          aria-hidden="true"
          style={{ left: 50 + 50 * corner[0] + "%", top: 50 - 50 * corner[1] + "%" }}
          onPointerDown={onCornerDown}
          onPointerUp={onCornerUp}
          onPointerCancel={onCornerUp}
        />
      </div>
      <span
        aria-live="polite"
        style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clipPath: "inset(50%)" }}
      >
        {glyph.name}
      </span>

    </div>
  )
}
