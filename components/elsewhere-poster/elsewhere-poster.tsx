"use client"

// Elsewhere Poster — a square travel poster in the Swiss-meets-romantic style:
// two notched sheets of off-white paper hold a landscape painting between them,
// covered in fine print, rotating ring seals, arced captions, barcodes, wire
// globes and a big serif destination.
//
// The painting is generated in this file. Layered mountains, a snow-lit peak,
// drifting cloud banks, a still lake and stands of pine are drawn on canvas from
// seeded numbers, then repainted stroke by stroke so it reads as oil on canvas.
// Nothing loads at runtime; pass image on a destination to use a photo.
//
// It is a toy as much as a poster:
//   - drag the painting up or down (or tap it) to slide the window between the sheets
//   - move the pointer and the painting's layers drift in parallax
//   - click the title or a globe to travel to the next destination
//   - hover the ruler and a marker follows you down the numbers
import * as React from "react"

export type ElsewhereScene = "golden" | "dawn" | "dusk" | "night"

export type ElsewherePalette = {
  skyTop: string
  skyHorizon: string
  sun: string
  peakLit: string
  peakShade: string
  snow: string
  cloud: string
  haze: string
  cliffLit: string
  cliffShade: string
  slope: string
  forest: string
  pine: string
  water: string
  waterDeep: string
  ground: string
  grass: string
  ochre: string
  rock: string
}

export type ElsewhereDestination = {
  /** The big serif word. Short words read best (up to ~10 letters). */
  title: string
  /** Preset light, or your own colours on top of "golden". */
  scene?: ElsewhereScene | Partial<ElsewherePalette>
  /** Changes the mountains, trees and clouds. */
  seed?: number
  /** Printed in the barcodes. Defaults to the title. */
  code?: string
  /** Your own picture instead of the generated painting. */
  image?: string
  /** Replaces the line under the top sheet for this destination. */
  tagline?: string
}

export type ElsewhereColors = {
  /** The paper sheets. */
  paper?: string
  /** All type and marks. */
  ink?: string
  /** The black card around the poster. */
  mat?: string
  /** Hover and active marks. */
  accent?: string
}

export type ElsewhereFonts = {
  display?: string
  script?: string
  sans?: string
}

export type ElsewherePosterProps = {
  destinations?: ElsewhereDestination[]
  /** Which destination shows first. */
  initial?: number
  /** Called after the poster travels. */
  onDestinationChange?: (index: number, destination: ElsewhereDestination) => void
  /** The handwritten line at the top. */
  script?: string
  /** The five words along the top edge, repeated on both halves. */
  marquee?: string[]
  /** The line in the top sheet's tab. */
  tagline?: string
  /** Two-line labels either side of the script: [left pair, right pair]. */
  pairs?: [string, string][]
  /** Text running around the two corner seals. */
  ring?: string
  /** The three-line note in the bottom sheet's corners. */
  corner?: string[]
  /** Printed twice in the bottom sheet's tab. */
  gateLabel?: string
  /** Three two-line credits, mirrored left and right. */
  credits?: [string, string][]
  /** The small arc above the title. */
  arcTop?: string
  /** The long arc under the title. */
  arcBottom?: string
  /** Two two-line notes under the credits, mirrored. */
  notes?: [string, string][]
  /** Bottom corners. */
  footer?: string
  colors?: ElsewhereColors
  fonts?: ElsewhereFonts
  /** Draw the black card around the poster. */
  mat?: boolean
  /** Painting layers follow the pointer. */
  parallax?: boolean
  /** Rings turn, stars twinkle, clouds drift, letters scramble. */
  animate?: boolean
  /** How far the window starts slid down, 0..1. */
  gate?: number
  /** Widest the poster grows. It is square and sized by its width. */
  maxWidth?: string
  className?: string
}

// #region logic
type Pt = [number, number]

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

const fmt = (n: number) => String(Math.round(n * 100) / 100)

/** Seeded PRNG, so a destination paints the same every time. */
const rng = (seed: number) => {
  let a = seed >>> 0 || 1
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const hash = (s: string) => {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

const wrap = (i: number, n: number) => (n > 0 ? ((i % n) + n) % n : 0)

/** Poster geometry, in viewBox units (the full card is 1200 square). */
const G = {
  x0: 100,
  x1: 1100,
  y0: 100,
  y1: 1100,
  R: 26,
  c: 14,
  top: 205,
  bottom: 668,
  l0: 290,
  l1: 345,
  r1: 855,
  r0: 910,
  sMin: 26,
  sMax: 70,
}

/** Slide 0..1 to the window's drop in units. */
const gateShift = (g: number) => G.sMin + (G.sMax - G.sMin) * clamp(g, 0, 1)

/**
 * The two paper sheets for a given drop s. The middle of the window sits s
 * lower than its sides, joined by an S-curve; the outer corners next to the
 * painting are rounded, and each sheet has a shallow notch at its outer edge.
 */
const gatePaths = (s: number) => {
  const k = 30
  const t = G.top
  const ts = fmt(t + s)
  const b = G.bottom
  const bs = fmt(b + s)
  const top =
    "M" + G.x0 + " " + (G.y0 + G.R) + "A" + G.R + " " + G.R + " 0 0 1 " + (G.x0 + G.R) + " " + G.y0 +
    "L548 100C562 100 562 111 576 111L624 111C638 111 638 100 652 100" +
    "L" + (G.x1 - G.R) + " " + G.y0 + "A" + G.R + " " + G.R + " 0 0 1 " + G.x1 + " " + (G.y0 + G.R) +
    "L" + G.x1 + " " + (t - G.c) + "Q" + G.x1 + " " + t + " " + (G.x1 - G.c) + " " + t +
    "L" + G.r0 + " " + t + "C" + (G.r0 - k) + " " + t + " " + (G.r1 + k) + " " + ts + " " + G.r1 + " " + ts +
    "L" + G.l1 + " " + ts + "C" + (G.l1 - k) + " " + ts + " " + (G.l0 + k) + " " + t + " " + G.l0 + " " + t +
    "L" + (G.x0 + G.c) + " " + t + "Q" + G.x0 + " " + t + " " + G.x0 + " " + (t - G.c) + "Z"
  const bottom =
    "M" + G.x0 + " " + (b + G.c) + "Q" + G.x0 + " " + b + " " + (G.x0 + G.c) + " " + b +
    "L" + G.l0 + " " + b + "C" + (G.l0 + k) + " " + b + " " + (G.l1 - k) + " " + bs + " " + G.l1 + " " + bs +
    "L" + G.r1 + " " + bs + "C" + (G.r1 + k) + " " + bs + " " + (G.r0 - k) + " " + b + " " + G.r0 + " " + b +
    "L" + (G.x1 - G.c) + " " + b + "Q" + G.x1 + " " + b + " " + G.x1 + " " + (b + G.c) +
    "L" + G.x1 + " " + (G.y1 - G.R) + "A" + G.R + " " + G.R + " 0 0 1 " + (G.x1 - G.R) + " " + G.y1 +
    "L652 1100C638 1100 638 1089 624 1089L576 1089C562 1089 562 1100 548 1100" +
    "L" + (G.x0 + G.R) + " " + G.y1 + "A" + G.R + " " + G.R + " 0 0 1 " + G.x0 + " " + (G.y1 - G.R) + "Z"
  return { top, bottom }
}

/** Bars for a code: same text, same bars, always inside width. */
const barcode = (text: string, width: number) => {
  const r = rng(hash(text || "-"))
  const bars: { x: number; w: number }[] = []
  let x = 0
  for (;;) {
    const w = r() < 0.62 ? 0.9 : r() < 0.7 ? 1.8 : 2.8
    if (x + w > width) break
    bars.push({ x: Math.round(x * 100) / 100, w })
    x += w + (r() < 0.6 ? 1.1 : 2.2)
  }
  return bars
}

/** Relative advance of each capital in a high-contrast display serif. */
const CAP: Record<string, number> = {
  A: 0.74, B: 0.68, C: 0.7, D: 0.76, E: 0.64, F: 0.6, G: 0.76, H: 0.8, I: 0.38, J: 0.42, K: 0.74, L: 0.62,
  M: 0.92, N: 0.78, O: 0.78, P: 0.64, Q: 0.78, R: 0.72, S: 0.58, T: 0.66, U: 0.76, V: 0.74, W: 1.02, X: 0.74,
  Y: 0.7, Z: 0.66, " ": 0.34, "&": 0.78, "'": 0.26, "-": 0.4, ".": 0.28,
}

/** Lay a word out letter by letter, centred on 0, scaled to fit maxW. */
const layoutTitle = (word: string, maxW: number, maxSize: number, track: number) => {
  const chars = Array.from(word.toUpperCase())
  const ws = chars.map((c) => CAP[c] ?? 0.66)
  const em = ws.reduce((a, b) => a + b, 0) + track * Math.max(0, chars.length - 1)
  const size = em > 0 ? Math.min(maxSize, maxW / em) : maxSize
  let x = (-em * size) / 2
  const letters = chars.map((ch, i) => {
    const w = ws[i] * size
    const cx = x + w / 2
    x += w + track * size
    return { ch, x: Math.round(cx * 100) / 100, w }
  })
  return { size, letters }
}

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

/**
 * One frame of the split-flap scramble. Letter i starts turning over at
 * i * stagger and lands on its target spin later; spaces never turn.
 */
const scramble = (target: string, elapsed: number, stagger: number, spin: number, r: () => number) => {
  const chars = Array.from(target)
  let out = ""
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i]
    if (c === " " || elapsed >= i * stagger + spin) out += c
    else out += GLYPHS[Math.floor(r() * GLYPHS.length) % GLYPHS.length]
  }
  return out
}

/** Arc for text above the title (reads over the top) or below it (a smile). */
const arcPath = (cx: number, cy: number, r: number, from: number, to: number, under: boolean) => {
  const p = (a: number): Pt => [cx + r * Math.cos(a), cy + r * Math.sin(a)]
  const [x1, y1] = p(from)
  const [x2, y2] = p(to)
  const large = Math.abs(to - from) > Math.PI ? 1 : 0
  return "M" + fmt(x1) + " " + fmt(y1) + "A" + fmt(r) + " " + fmt(r) + " 0 " + large + " " + (under ? 0 : 1) + " " + fmt(x2) + " " + fmt(y2)
}

/**
 * Arced captions can't wrap. Estimate the set width and, only when it would
 * run off the end of its arc, squeeze it to fit.
 */
const fit = (text: string, size: number, spacing: number, room: number) => {
  const est = Array.from(text).length * (size * 0.66 + spacing)
  return est > room ? { textLength: Math.floor(room), lengthAdjust: "spacingAndGlyphs" } : {}
}

/** Ring text always closes the circle: spread a short line, squeeze a long one. */
const ringFit = (text: string, size: number, spacing: number, room: number) => {
  const est = Array.from(text).length * (size * 0.66 + spacing)
  return { textLength: Math.floor(room), lengthAdjust: est > room ? "spacingAndGlyphs" : "spacing" }
}

/** A full circle starting at its left, clockwise, for ring text. */
const ringPath = (cx: number, cy: number, r: number) =>
  "M" + (cx - r) + " " + cy + "a" + r + " " + r + " 0 1 1 " + 2 * r + " 0a" + r + " " + r + " 0 1 1 " + -2 * r + " 0"

/** Four-point sparkle centred on (x, y). */
const sparkle = (x: number, y: number, r: number) => {
  const q = r * 0.16
  return (
    "M" + x + " " + (y - r) + "Q" + (x + q) + " " + (y - q) + " " + (x + r) + " " + y + "Q" + (x + q) + " " + (y + q) + " " + x + " " + (y + r) +
    "Q" + (x - q) + " " + (y + q) + " " + (x - r) + " " + y + "Q" + (x - q) + " " + (y - q) + " " + x + " " + (y - r) + "Z"
  )
}

/** Small solid triangle, pointing down or up. */
const tri = (x: number, y: number, down: boolean, s = 4.2) =>
  down
    ? "M" + (x - s) + " " + (y - s * 0.8) + "L" + (x + s) + " " + (y - s * 0.8) + "L" + x + " " + (y + s * 0.8) + "Z"
    : "M" + (x - s) + " " + (y + s * 0.8) + "L" + (x + s) + " " + (y + s * 0.8) + "L" + x + " " + (y - s * 0.8) + "Z"

/** Midpoint-displaced line from a to b; axis 1 jitters y, 0 jitters x. */
const ridge = (seed: number, a: Pt, b: Pt, depth: number, amp: number, axis = 1) => {
  const r = rng(seed)
  let pts: Pt[] = [a, b]
  let k = amp
  for (let d = 0; d < depth; d++) {
    const next: Pt[] = []
    for (let i = 0; i < pts.length - 1; i++) {
      const p = pts[i]
      const q = pts[i + 1]
      const m: Pt = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]
      m[axis] += (r() - 0.5) * k
      next.push(p, m)
    }
    next.push(pts[pts.length - 1])
    pts = next
    k *= 0.55
  }
  return pts
}

/** y of a polyline (sorted by x) at x. */
const yAt = (pts: Pt[], x: number) => {
  if (!pts.length) return 0
  if (x <= pts[0][0]) return pts[0][1]
  for (let i = 1; i < pts.length; i++) {
    if (x <= pts[i][0]) {
      const [x0, y0] = pts[i - 1]
      const [x1, y1] = pts[i]
      return x1 === x0 ? y1 : y0 + ((y1 - y0) * (x - x0)) / (x1 - x0)
    }
  }
  return pts[pts.length - 1][1]
}

const hexRgb = (hex: string): [number, number, number] => {
  let h = hex.trim().replace("#", "")
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]
  const n = parseInt(h.slice(0, 6), 16)
  if (!/^[0-9a-f]{6}/i.test(h) || !Number.isFinite(n)) return [128, 128, 128]
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/** a + (b - a) t, as rgba(). */
const mix = (a: string, b: string, t: number, alpha = 1) => {
  const p = hexRgb(a)
  const q = hexRgb(b)
  const c = p.map((v, i) => Math.round(v + (q[i] - v) * t))
  return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + alpha + ")"
}

const luminance = (hex: string) => {
  const [r, g, b] = hexRgb(hex)
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
}

const SCENES: Record<ElsewhereScene, ElsewherePalette> = {
  golden: {
    skyTop: "#a3a99c", skyHorizon: "#efe0bf", sun: "#fff0cc", peakLit: "#ecc995", peakShade: "#86919b",
    snow: "#fbf2e1", cloud: "#eee7d8", haze: "#d6d2c2", cliffLit: "#c7955a", cliffShade: "#565242",
    slope: "#6a7558", forest: "#2b3a2b", pine: "#1b261b", water: "#a9b3a6", waterDeep: "#4a5953",
    ground: "#4f4b2d", grass: "#7a7d3c", ochre: "#c78a3a", rock: "#908a7b",
  },
  dawn: {
    skyTop: "#97a3c2", skyHorizon: "#f5d5c6", sun: "#ffe5d8", peakLit: "#f3c1ad", peakShade: "#8786a6",
    snow: "#fff1ec", cloud: "#f3e1de", haze: "#e0d1d4", cliffLit: "#c79285", cliffShade: "#544d62",
    slope: "#6b776f", forest: "#2c3939", pine: "#1b2528", water: "#c0c3d2", waterDeep: "#525a6d",
    ground: "#4f4b41", grass: "#7a8268", ochre: "#c88b6b", rock: "#938c92",
  },
  dusk: {
    skyTop: "#4a4c6c", skyHorizon: "#f0a468", sun: "#ffd197", peakLit: "#ee9f66", peakShade: "#56506d",
    snow: "#ffdfc2", cloud: "#e5ab89", haze: "#c49583", cliffLit: "#b16538", cliffShade: "#3a2f3d",
    slope: "#4c4d45", forest: "#222527", pine: "#14171a", water: "#d49771", waterDeep: "#36323d",
    ground: "#38342b", grass: "#5f5d38", ochre: "#c27739", rock: "#6d6261",
  },
  night: {
    skyTop: "#0d1828", skyHorizon: "#38506c", sun: "#e8eef6", peakLit: "#a7bace", peakShade: "#2d3b50",
    snow: "#e1eaf4", cloud: "#6a7c94", haze: "#475b75", cliffLit: "#5a6a7b", cliffShade: "#1b2431",
    slope: "#283442", forest: "#121b25", pine: "#0a1017", water: "#4a6482", waterDeep: "#131f2c",
    ground: "#1d272e", grass: "#2d3b3b", ochre: "#6d7b85", rock: "#495663",
  },
}

/** A destination's scene as a full palette: a preset, or your colours on golden. */
const paletteOf = (scene: ElsewhereDestination["scene"]): ElsewherePalette => {
  if (!scene) return SCENES.golden
  if (typeof scene === "string") return SCENES[scene] ?? SCENES.golden
  return { ...SCENES.golden, ...scene }
}
// #endregion logic

/* ------------------------------------------------------------------------ */
/* The painting                                                              */
/* ------------------------------------------------------------------------ */

// The painting covers viewBox x 100..1100, y 140..820 (local 0..W, 0..H). The
// sheets hide everything outside the window. Each layer canvas carries a
// margin M on every side so parallax never shows an edge.
const PW = 1000
const PH = 680
const PY = 140
const M = 44

type Ctx = CanvasRenderingContext2D

const poly = (ctx: Ctx, pts: Pt[], close = true) => {
  ctx.beginPath()
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
  if (close) ctx.closePath()
}

const pine = (ctx: Ctx, x: number, base: number, h: number, dark: string, lit: string, r: () => number) => {
  ctx.strokeStyle = dark
  ctx.lineWidth = Math.max(1, h * 0.018)
  ctx.beginPath()
  ctx.moveTo(x, base)
  ctx.lineTo(x, base - h)
  ctx.stroke()
  const tiers = Math.round(7 + h / 14)
  for (let i = 0; i < tiers; i++) {
    const t = i / tiers
    const y = base - h * (0.1 + 0.9 * t)
    const w = h * 0.2 * Math.pow(1 - t, 0.85) + 1.5
    const d = w * (0.3 + r() * 0.25)
    const tier: Pt[] = [
      [x, y - h * 0.07],
      [x - w * 0.55, y + d * 0.35],
      [x - w * (0.95 + r() * 0.2), y + d],
      [x - w * 0.35, y + d * 0.55],
      [x, y + d * 0.8],
      [x + w * 0.35, y + d * 0.55],
      [x + w * (0.95 + r() * 0.2), y + d],
      [x + w * 0.55, y + d * 0.35],
    ]
    ctx.fillStyle = dark
    poly(ctx, tier)
    ctx.fill()
    ctx.fillStyle = lit
    poly(ctx, [tier[0], tier[1], tier[2], tier[3], [x - w * 0.05, y + d * 0.4]])
    ctx.fill()
  }
}

const softPuff = (ctx: Ctx, x: number, y: number, r: number, color: string, a: number) => {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r)
  g.addColorStop(0, mix(color, color, 0, a))
  g.addColorStop(0.55, mix(color, color, 0, a * 0.55))
  g.addColorStop(1, mix(color, color, 0, 0))
  ctx.fillStyle = g
  ctx.fillRect(x - r, y - r, r * 2, r * 2)
}

/** Far layer: sky, sun, distant ranges and the snow peak. */
const paintFar = (ctx: Ctx, p: ElsewherePalette, seed: number) => {
  const r = rng(seed * 7 + 1)
  const sky = ctx.createLinearGradient(0, -M, 0, 460)
  sky.addColorStop(0, p.skyTop)
  sky.addColorStop(1, p.skyHorizon)
  ctx.fillStyle = sky
  ctx.fillRect(-M, -M, PW + 2 * M, PH + 2 * M)

  const dark = luminance(p.skyTop) < 0.25
  const sx = 260 + r() * 120
  const sy = 40 + r() * 30
  softPuff(ctx, sx, sy, 520, p.sun, dark ? 0.35 : 0.8)
  if (dark) {
    for (let i = 0; i < 160; i++) {
      ctx.fillStyle = mix(p.sun, p.sun, 0, 0.3 + r() * 0.6)
      ctx.fillRect(-M + r() * (PW + 2 * M), -M + r() * 300, 1.4, 1.4)
    }
    ctx.fillStyle = p.sun
    ctx.beginPath()
    ctx.arc(sx, sy, 15, 0, Math.PI * 2)
    ctx.fill()
  }

  // distant ranges either side of the peak
  const farL = ridge(seed + 11, [-M, 250], [420, 330], 6, 80)
  const farR = ridge(seed + 12, [640, 300], [PW + M, 210], 6, 90)
  for (const range of [farL, farR]) {
    ctx.fillStyle = mix(p.peakShade, p.haze, 0.45)
    poly(ctx, [...range, [range[range.length - 1][0], 470], [range[0][0], 470]])
    ctx.fill()
  }

  // the massif: one shadowed silhouette, its sunlit face, then snow
  const peak: Pt = [540 + r() * 40, 120 + r() * 30]
  const left = ridge(seed + 21, [290, 440], [430, 250 + r() * 30], 5, 60).concat(ridge(seed + 22, [430, 262], peak, 5, 50).slice(1))
  const right = ridge(seed + 23, peak, [700, 250 + r() * 30], 5, 50).concat(ridge(seed + 24, [700, 262], [880, 440], 5, 60).slice(1))
  const top = left.concat(right.slice(1))
  const massif: Pt[] = [...top, [880, 470], [290, 470]]
  ctx.save()
  poly(ctx, massif)
  ctx.clip()
  ctx.fillStyle = p.peakShade
  ctx.fillRect(250, 80, 680, 420)

  const spine = ridge(seed + 25, peak, [peak[0] - 60, 460], 5, 70, 0)
  const lit = ctx.createLinearGradient(0, peak[1], 0, 440)
  lit.addColorStop(0, p.peakLit)
  lit.addColorStop(1, mix(p.peakLit, p.peakShade, 0.55))
  ctx.fillStyle = lit
  poly(ctx, [...left, ...spine.slice(1), [290, 460]])
  ctx.fill()

  // strata: diagonal seams on both faces
  for (let i = 0; i < 70; i++) {
    const x = 300 + r() * 560
    const y = yAt(top, x) + 10 + r() * 180
    const len = 20 + r() * 50
    const dir = x < peak[0] ? 1 : -1
    ctx.strokeStyle = mix(p.peakShade, p.cliffShade, 0.5, 0.25 + r() * 0.25)
    ctx.lineWidth = 1 + r() * 2.5
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + dir * len * 0.6, y + len)
    ctx.stroke()
  }

  // snow: a cap along the crest and gullies running down from it
  const snowLine = peak[1] + 150
  for (let i = 0; i < 220; i++) {
    const x = 310 + r() * 560
    const ry = yAt(top, x)
    if (ry > snowLine) continue
    const len = (snowLine - ry) * (0.25 + r() * 0.9)
    const w = 3 + r() * 9
    const onLit = x < yAt(spine.map(([a, b]) => [b, a] as Pt), ry + len * 0.3)
    ctx.fillStyle = onLit ? mix(p.snow, p.snow, 0, 0.55 + r() * 0.4) : mix(p.snow, p.peakShade, 0.45, 0.5 + r() * 0.4)
    poly(ctx, [
      [x - w, ry - 3],
      [x + w, ry - 3],
      [x + w * 0.2 + (x < peak[0] ? -len * 0.35 : len * 0.35), ry + len],
    ])
    ctx.fill()
  }
  ctx.restore()

  // the valley fills with haze
  const haze = ctx.createLinearGradient(0, 250, 0, 440)
  haze.addColorStop(0, mix(p.haze, p.haze, 0, 0))
  haze.addColorStop(1, mix(p.haze, p.haze, 0, 0.92))
  ctx.fillStyle = haze
  ctx.fillRect(-M, 250, PW + 2 * M, 230)
}

/** Cloud banks, left soft: they drift as one layer. */
const paintClouds = (ctx: Ctx, p: ElsewherePalette, seed: number) => {
  const r = rng(seed * 13 + 5)
  const band = (n: number, x0: number, x1: number, y: number, spread: number, rMin: number, rMax: number, a: number) => {
    for (let i = 0; i < n; i++) {
      const x = x0 + r() * (x1 - x0)
      const yy = y + (r() + r() + r() - 1.5) * spread
      const rad = rMin + r() * (rMax - rMin)
      softPuff(ctx, x, yy, rad, p.cloud, a * (0.5 + r() * 0.5))
      softPuff(ctx, x - rad * 0.2, yy - rad * 0.25, rad * 0.6, p.sun, a * 0.35)
    }
  }
  band(26, 560, PW + M, 250, 40, 40, 110, 0.55) // over the right shoulder, as in the painting
  band(22, 300, 820, 350, 26, 30, 80, 0.5) // a belt across the peak's foot
  band(10, -M, 360, 120, 30, 30, 90, 0.35) // wisps top left
  band(8, 640, PW, 70, 30, 40, 100, 0.3)
}

/** Middle layer: the two big slopes, the far tree line and the lake. */
const paintMid = (ctx: Ctx, p: ElsewherePalette, seed: number) => {
  const r = rng(seed * 17 + 3)
  // lake first, so the slopes sit in it
  const lake = ctx.createLinearGradient(0, 430, 0, 560)
  lake.addColorStop(0, mix(p.skyHorizon, p.water, 0.45))
  lake.addColorStop(0.5, p.water)
  lake.addColorStop(1, p.waterDeep)
  ctx.fillStyle = lake
  ctx.fillRect(-M, 432, PW + 2 * M, PH - 400)
  for (let i = 0; i < 70; i++) {
    const x = 330 + r() * 420
    ctx.fillStyle = mix(p.peakLit, p.water, 0.4, 0.12 + r() * 0.15)
    ctx.fillRect(x, 436, 2 + r() * 4, 10 + r() * 40)
  }

  // the tree line at the far shore
  for (let i = 0; i < 150; i++) {
    const x = 330 + r() * 440
    const h = 8 + r() * 22
    pine(ctx, x, 440 + r() * 6, h, mix(p.forest, p.haze, 0.35), mix(p.forest, p.ochre, 0.3), r)
  }

  // left: a tall cliff catching the sun
  const ltop = ridge(seed + 31, [-M, 30], [170, 190], 5, 50).concat(ridge(seed + 32, [170, 190], [470, 448], 6, 70).slice(1))
  ctx.save()
  poly(ctx, [...ltop, [470, 448], [-M, 448]])
  ctx.clip()
  const cl = ctx.createLinearGradient(0, 40, 320, 470)
  cl.addColorStop(0, p.cliffLit)
  cl.addColorStop(0.55, mix(p.cliffLit, p.cliffShade, 0.55))
  cl.addColorStop(1, p.cliffShade)
  ctx.fillStyle = cl
  ctx.fillRect(-M, 0, 520, 480)
  for (let i = 0; i < 90; i++) {
    const x = -M + r() * 500
    const y = yAt(ltop, x) + r() * 260
    const len = 30 + r() * 70
    ctx.strokeStyle = r() < 0.55 ? mix(p.cliffShade, p.cliffShade, 0, 0.35) : mix(p.ochre, p.cliffLit, 0.4, 0.45)
    ctx.lineWidth = 1.5 + r() * 4
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + len * 0.75, y + len * 0.6)
    ctx.stroke()
  }
  for (let i = 0; i < 60; i++) {
    const x = 120 + r() * 340
    const y = yAt(ltop, x) + 20 + r() * 120
    if (y > 450) continue
    pine(ctx, x, y, 10 + r() * 24, mix(p.forest, p.cliffShade, 0.3), mix(p.forest, p.ochre, 0.4), r)
  }
  ctx.restore()

  // right: a darker, wooded slope with cloud on its shoulder
  const rtop = ridge(seed + 33, [PW + M, 60], [850, 170], 5, 50).concat(ridge(seed + 34, [850, 170], [610, 450], 6, 60).slice(1))
  ctx.save()
  poly(ctx, [...rtop, [610, 448], [PW + M, 448]])
  ctx.clip()
  const sl = ctx.createLinearGradient(700, 100, 900, 470)
  sl.addColorStop(0, mix(p.slope, p.haze, 0.35))
  sl.addColorStop(1, p.forest)
  ctx.fillStyle = sl
  ctx.fillRect(560, 0, PW + M - 560, 480)
  for (let i = 0; i < 260; i++) {
    const x = 600 + r() * (PW + M - 600)
    const y = yAt(rtop.slice().reverse(), x) + 15 + r() * 300
    if (y > 455) continue
    pine(ctx, x, y, 8 + r() * 20, mix(p.forest, p.pine, 0.4), mix(p.slope, p.ochre, 0.3), r)
  }
  ctx.restore()

  // mist where slopes meet water
  const m = ctx.createLinearGradient(0, 380, 0, 446)
  m.addColorStop(0, mix(p.haze, p.haze, 0, 0))
  m.addColorStop(1, mix(p.haze, p.haze, 0, 0.5))
  ctx.fillStyle = m
  ctx.fillRect(-M, 380, PW + 2 * M, 66)
  // shimmer
  for (let i = 0; i < 60; i++) {
    ctx.fillStyle = mix(p.skyHorizon, p.sun, 0.5, 0.25 + r() * 0.3)
    ctx.fillRect(300 + r() * 500, 450 + r() * 70, 6 + r() * 30, 1)
  }
}

/** Near layer: the dark foreground hills, tall pines, rocks and the stream. */
const paintNear = (ctx: Ctx, p: ElsewherePalette, seed: number) => {
  const r = rng(seed * 23 + 9)
  // foreground ground and shore
  const shore = ridge(seed + 41, [-M, 470], [PW + M, 480], 6, 30)
  const ground = ctx.createLinearGradient(0, 480, 0, PH + M)
  ground.addColorStop(0, p.grass)
  ground.addColorStop(0.45, mix(p.grass, p.ground, 0.6))
  ground.addColorStop(1, p.ground)
  ctx.fillStyle = ground
  poly(ctx, [...shore.map(([x, y]) => [x, y + 20 + Math.abs(x - 500) * 0.05] as Pt), [PW + M, PH + M], [-M, PH + M]])
  ctx.fill()

  // the stream, reflecting the sky
  ctx.fillStyle = mix(p.water, p.skyHorizon, 0.25)
  ctx.beginPath()
  ctx.moveTo(470, 500)
  ctx.bezierCurveTo(520, 540, 380, 580, 450, 640)
  ctx.bezierCurveTo(480, 680, 420, 700, 440, PH + M)
  ctx.lineTo(500, PH + M)
  ctx.bezierCurveTo(490, 690, 540, 660, 500, 630)
  ctx.bezierCurveTo(450, 580, 560, 540, 500, 500)
  ctx.closePath()
  ctx.fill()

  // grass tufts and ochre light
  for (let i = 0; i < 900; i++) {
    const x = -M + r() * (PW + 2 * M)
    const y = 500 + r() * (PH + M - 500)
    const h = 3 + r() * 9
    ctx.strokeStyle = r() < 0.4 ? mix(p.ochre, p.grass, r() * 0.5, 0.7) : mix(p.grass, p.ground, r(), 0.7)
    ctx.lineWidth = 1 + r()
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + (r() - 0.5) * 4, y - h)
    ctx.stroke()
  }
  for (let i = 0; i < 46; i++) {
    const x = -M + r() * (PW + 2 * M)
    const y = 505 + r() * 170
    const w = 6 + r() * 26
    ctx.fillStyle = mix(p.rock, p.ground, 0.35)
    ctx.beginPath()
    ctx.ellipse(x, y, w, w * 0.5, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = mix(p.rock, p.sun, 0.35, 0.8)
    ctx.beginPath()
    ctx.ellipse(x - w * 0.2, y - w * 0.18, w * 0.6, w * 0.24, -0.15, 0, Math.PI * 2)
    ctx.fill()
  }

  // left hill and its stand of tall pines
  const lh = ridge(seed + 42, [-M, 300], [150, 380], 5, 40).concat(ridge(seed + 43, [150, 380], [420, 540], 5, 40).slice(1))
  const lg = ctx.createLinearGradient(0, 200, 200, 600)
  lg.addColorStop(0, mix(p.ground, p.ochre, 0.35))
  lg.addColorStop(1, p.ground)
  ctx.fillStyle = lg
  poly(ctx, [...lh, [420, PH + M], [-M, PH + M]])
  ctx.fill()
  for (let i = 0; i < 160; i++) {
    const x = -M + r() * 440
    const y = yAt(lh, x) + 4 + r() * 60
    ctx.strokeStyle = mix(p.ochre, p.cliffLit, r(), 0.55)
    ctx.lineWidth = 2 + r() * 3
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + 8 + r() * 14, y + 6 + r() * 8)
    ctx.stroke()
  }
  const lp = Array.from({ length: 13 }, () => -30 + r() * 330).sort((a, b) => a - b)
  for (const x of lp) {
    const base = yAt(lh, x) + 20 + r() * 50
    pine(ctx, x, base, 150 + r() * 210, p.pine, mix(p.pine, p.ochre, 0.24), r)
  }

  // right hill
  const rh = ridge(seed + 44, [PW + M, 240], [880, 330], 5, 40).concat(ridge(seed + 45, [880, 330], [690, 535], 5, 40).slice(1))
  const rg = ctx.createLinearGradient(1000, 260, 760, 600)
  rg.addColorStop(0, mix(p.slope, p.grass, 0.4))
  rg.addColorStop(1, p.ground)
  ctx.fillStyle = rg
  poly(ctx, [...rh, [690, PH + M], [PW + M, PH + M]])
  ctx.fill()
  const rp = Array.from({ length: 11 }, () => 780 + r() * 260).sort((a, b) => b - a)
  for (const x of rp) {
    const base = yAt(rh.slice().reverse(), x) + 20 + r() * 50
    pine(ctx, x, base, 130 + r() * 200, p.pine, mix(p.pine, p.slope, 0.5), r)
  }
}

/**
 * Repaint a layer stroke by stroke. Each stroke takes its colour from the layer
 * underneath and lies along the edges there (perpendicular to the brightness
 * gradient), so shapes keep their form while every surface gets brushwork.
 * Strokes are rasterised straight into the pixel buffer: tens of thousands of
 * canvas ellipse() calls cost ten times as much.
 */
const brush = (base: HTMLCanvasElement, out: HTMLCanvasElement, scale: number, seed: number, angle: number) => {
  const w = base.width
  const h = base.height
  const bctx = base.getContext("2d")
  const ctx = out.getContext("2d")
  if (!bctx || !ctx) return
  out.width = w
  out.height = h
  const img = bctx.getImageData(0, 0, w, h)
  const src = img.data
  const dst = new Uint8ClampedArray(src)
  const r = rng(seed)
  const lum = (x: number, y: number) => {
    const i = (clamp(y, 0, h - 1) * w + clamp(x, 0, w - 1)) * 4
    return src[i] * 0.3 + src[i + 1] * 0.59 + src[i + 2] * 0.11
  }
  const alpha = (x: number, y: number) => src[(clamp(Math.round(y), 0, h - 1) * w + clamp(Math.round(x), 0, w - 1)) * 4 + 3]
  const len = 12 * scale
  const wid = 3.2 * scale
  const n = Math.min(90000, Math.round((w * h) / (len * wid * 0.9)))
  const d = Math.max(1, Math.round(2 * scale))
  for (let i = 0; i < n; i++) {
    const x = Math.floor(r() * w)
    const y = Math.floor(r() * h)
    const k = (y * w + x) * 4
    if (src[k + 3] < 200) continue
    const gx = lum(x + d, y) - lum(x - d, y)
    const gy = lum(x, y + d) - lum(x, y - d)
    const a = Math.abs(gx) + Math.abs(gy) > 10 ? Math.atan2(gy, gx) + Math.PI / 2 : angle + (r() - 0.5) * 0.6
    const ca = Math.cos(a)
    const sa = Math.sin(a)
    let hl = (len * (0.5 + r() * 0.9)) / 2
    if (alpha(x + ca * hl, y + sa * hl) < 140 || alpha(x - ca * hl, y - sa * hl) < 140) hl *= 0.35
    const hw = Math.max(0.6, wid * (0.5 + r() * 0.6))
    const j = (r() - 0.5) * 22
    const cr = src[k] + j
    const cg = src[k + 1] + j
    const cb = src[k + 2] + j * 0.8
    const op = 0.5 + r() * 0.45
    const ex = Math.ceil(Math.sqrt(hl * hl * ca * ca + hw * hw * sa * sa))
    const ey = Math.ceil(Math.sqrt(hl * hl * sa * sa + hw * hw * ca * ca))
    const x0 = Math.max(0, x - ex)
    const x1 = Math.min(w - 1, x + ex)
    const y0 = Math.max(0, y - ey)
    const y1 = Math.min(h - 1, y + ey)
    for (let py = y0; py <= y1; py++) {
      const dy = py - y
      let o = (py * w + x0) * 4
      for (let px = x0; px <= x1; px++, o += 4) {
        const dx = px - x
        const u = (dx * ca + dy * sa) / hl
        const v = (dy * ca - dx * sa) / hw
        const q = u * u + v * v
        if (q >= 1) continue
        const c = q > 0.6 ? (op * (1 - q)) / 0.4 : op
        dst[o] += (cr - dst[o]) * c
        dst[o + 1] += (cg - dst[o + 1]) * c
        dst[o + 2] += (cb - dst[o + 2]) * c
        dst[o + 3] += (255 - dst[o + 3]) * c
      }
    }
  }
  img.data.set(dst)
  ctx.putImageData(img, 0, 0)
}

const paintLayer = (
  out: HTMLCanvasElement,
  scale: number,
  draw: (ctx: Ctx) => void,
  brushed: { seed: number; angle: number } | null,
) => {
  const w = Math.round((PW + 2 * M) * scale)
  const h = Math.round((PH + 2 * M) * scale)
  const target = brushed ? document.createElement("canvas") : out
  target.width = w
  target.height = h
  const ctx = target.getContext("2d", brushed ? { willReadFrequently: true } : undefined) as Ctx | null
  if (!ctx) return
  ctx.setTransform(scale, 0, 0, scale, M * scale, M * scale)
  draw(ctx)
  if (brushed) brush(target, out, scale, brushed.seed, brushed.angle)
}

/** A small tile of canvas weave and grain, laid over the painting. */
const grainTile = () => {
  const c = document.createElement("canvas")
  c.width = 160
  c.height = 160
  const ctx = c.getContext("2d")
  if (!ctx) return ""
  const img = ctx.createImageData(160, 160)
  const r = rng(99)
  for (let y = 0; y < 160; y++) {
    for (let x = 0; x < 160; x++) {
      const weave = ((x % 4 < 2) !== (y % 4 < 2) ? 10 : -10) * 0.6
      const v = 128 + (r() - 0.5) * 70 + weave
      const i = (y * 160 + x) * 4
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v
      img.data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  return c.toDataURL()
}

/* ------------------------------------------------------------------------ */
/* Defaults                                                                  */
/* ------------------------------------------------------------------------ */

const DEFAULT_DESTINATIONS: ElsewhereDestination[] = [
  { title: "Elsewhere", scene: "golden", seed: 3, code: "ELSEWHERE-46N" },
  { title: "Somewhere", scene: "dawn", seed: 17, code: "SOMEWHERE-08E", tagline: "LE MATIN SE LÈVE TOUJOURS QUELQUE PART AILLEURS" },
  { title: "Far Away", scene: "dusk", seed: 29, code: "FARAWAY-61N", tagline: "PARTIR LOIN POUR MIEUX REVENIR À SOI" },
  { title: "Nowhere", scene: "night", seed: 41, code: "NOWHERE-00", tagline: "LA NUIT, TOUS LES CHEMINS MÈNENT ICI" },
]

const DISPLAY = '"Playfair Display", "Bodoni 72", Didot, "Big Caslon", Georgia, "Times New Roman", serif'
const SCRIPT =
  '"Snell Roundhand", "Apple Chancery", "Edwardian Script ITC", "Monotype Corsiva", "Segoe Script", "Times New Roman", serif'
const SANS = '"Helvetica Neue", Helvetica, Arial, system-ui, sans-serif'

const CSS = [
  ".ew-root{position:relative;width:100%;isolation:isolate;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none;container-type:inline-size}",
  ".ew-svg{position:absolute;left:0;top:0;width:100%;height:100%;display:block;max-width:none;overflow:visible}",
  ".ew-paint{position:absolute;overflow:hidden;transition:filter .8s ease,opacity .8s ease}",
  ".ew-paint.ew-dev{filter:blur(12px) saturate(.35) brightness(1.25);opacity:.2;transition-duration:.28s}",
  ".ew-layer{position:absolute;will-change:transform}",
  ".ew-canvas{display:block;width:100%;height:100%;max-width:none}",
  ".ew-img{position:absolute;inset:0;width:100%;height:100%;max-width:none;object-fit:cover}",
  ".ew-drift{animation:ew-drift 38s ease-in-out infinite alternate}",
  "@keyframes ew-drift{from{translate:-2.2% 0}to{translate:2.2% 0}}",
  ".ew-ring{transform-box:fill-box;transform-origin:center;animation:ew-spin 40s linear infinite}",
  ".ew-ring.ew-rev{animation-direction:reverse}",
  "@keyframes ew-spin{to{transform:rotate(360deg)}}",
  ".ew-tw{transform-box:fill-box;transform-origin:center;animation:ew-tw 3.4s ease-in-out infinite}",
  "@keyframes ew-tw{0%,100%{transform:scale(1) rotate(0deg);opacity:1}50%{transform:scale(.55) rotate(45deg);opacity:.5}}",
  ".ew-blink{animation:ew-blink 2.6s steps(1) infinite}",
  "@keyframes ew-blink{0%,64%{opacity:1}65%,80%{opacity:.12}81%{opacity:1}}",
  ".ew-btn{cursor:pointer;outline:none}",
  ".ew-focus{opacity:0;transition:opacity .2s}",
  ".ew-btn:focus-visible .ew-focus,.ew-gate:focus-visible~.ew-gatefocus{opacity:1}",
  ".ew-letter{transform-box:fill-box;transform-origin:50% 100%;transition:transform .45s cubic-bezier(.3,1.7,.5,1),fill .3s}",
  ".ew-letter:hover{transform:translateY(-7px) scale(1.04)}",
  ".ew-turn{animation:ew-turn .34s ease-out}",
  "@keyframes ew-turn{0%{transform:scaleY(.15)}100%{transform:scaleY(1)}}",
  ".ew-word{transition:fill .25s}",
  ".ew-word:hover{fill:var(--ew-accent)}",
  ".ew-gate{cursor:grab;outline:none;touch-action:pan-y}",
  ".ew-gate:active{cursor:grabbing}",
  ".ew-globe .ew-globe-body{transition:transform .5s cubic-bezier(.3,1.6,.5,1);transform-box:fill-box;transform-origin:center}",
  ".ew-globe:hover .ew-globe-body{transform:scale(1.12)}",
  ".ew-mark{transition:transform .25s ease,opacity .25s ease}",
  ".ew-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap}",
  "@media (prefers-reduced-motion:reduce){.ew-drift,.ew-ring,.ew-tw,.ew-blink,.ew-turn{animation:none}.ew-paint,.ew-letter,.ew-mark,.ew-globe .ew-globe-body{transition:none}}",
].join("")

const sid = (id: string) => "ew" + id.replace(/[^a-zA-Z0-9_-]/g, "")

/* ------------------------------------------------------------------------ */
/* Component                                                                 */
/* ------------------------------------------------------------------------ */

export default function ElsewherePoster({
  destinations = DEFAULT_DESTINATIONS,
  initial = 0,
  onDestinationChange,
  script = "You & Me",
  marquee = ["ICI", "OU", "AILLEURS", "C'EST", "PAREIL"],
  tagline = "RETROUVEZ-VOUS AVEC VOUS MÊME POUR ANTICIPER VOTRE AVENIR",
  pairs = [
    ["ÊTRE", "PRÉSENT"],
    ["TOI &", "MOI"],
  ],
  ring = "NOUS TROUVONS AILLEURS NOTRE BONHEUR",
  corner = ["C'EST LA PLUS", "BELLE CHOSE", "DU MONDE"],
  gateLabel = "ÊTRE AILLEURS",
  credits = [
    ["DESIGN", "2026"],
    ["KEDHAR", "ESWER"],
    ["GRAPHIC", "DESIGN"],
  ],
  arcTop = "UN NOUVEAU MONDE AU BOUT DE VOS DOIGTS",
  arcBottom = "NOUS SERONS TOUJOURS MIEUX AILLEURS QUE LÀ OÙ NOUS AVONS CRU ET PENSÉ ÊTRE DE TOUTE NOTRE VIE",
  notes = [
    ["AILLEURS", "AVEC MOI"],
    ["SE RETROUVER AVEC ELLE", "LE BONHEUR"],
  ],
  footer = "SEUL AVEC TOI",
  colors,
  fonts,
  mat = true,
  parallax = true,
  animate = true,
  gate = 0.7,
  maxWidth = "880px",
  className = "",
}: ElsewherePosterProps) {
  const list = destinations.length ? destinations : DEFAULT_DESTINATIONS
  const paper = colors?.paper ?? "#f1f0ec"
  const ink = colors?.ink ?? "#1c1b19"
  const matColor = colors?.mat ?? "#0b0b0b"
  const accent = colors?.accent ?? "#9a5a2a"
  const fDisplay = fonts?.display ?? DISPLAY
  const fScript = fonts?.script ?? SCRIPT
  const fSans = fonts?.sans ?? SANS

  const id = sid(React.useId())
  const [index, setIndex] = React.useState(() => wrap(initial, list.length))
  const dest = list[wrap(index, list.length)]
  const pal = paletteOf(dest.scene)
  const word = dest.title.toUpperCase()
  const [shown, setShown] = React.useState(word)
  const [turn, setTurn] = React.useState(0)
  const [developing, setDeveloping] = React.useState(false)
  const [row, setRow] = React.useState(-1)
  const [reduced, setReduced] = React.useState(false)
  const [grain, setGrain] = React.useState("")
  const [live, setLive] = React.useState("")

  const rootRef = React.useRef(null as HTMLDivElement | null)
  const farRef = React.useRef(null as HTMLCanvasElement | null)
  const cloudRef = React.useRef(null as HTMLCanvasElement | null)
  const midRef = React.useRef(null as HTMLCanvasElement | null)
  const nearRef = React.useRef(null as HTMLCanvasElement | null)
  const layerRefs = React.useRef([] as (HTMLDivElement | null)[])
  const topRef = React.useRef(null as SVGPathElement | null)
  const botRef = React.useRef(null as SVGPathElement | null)
  const gateTopRef = React.useRef(null as SVGGElement | null)
  const gateBotRef = React.useRef(null as SVGGElement | null)
  const hitRef = React.useRef(null as SVGRectElement | null)
  const meridians = React.useRef([] as (SVGEllipseElement | null)[])

  const s0 = gateShift(gate)
  const st = React.useRef({
    tx: 0, ty: 0, px: 0, py: 0,
    s: s0, ts: s0, drawnS: -1,
    spin: 0, spinBoost: 0,
    drag: null as null | { y: number; s: number; moved: boolean },
    unit: 1,
    visible: true,
  })

  const onChangeRef = React.useRef(onDestinationChange)
  onChangeRef.current = onDestinationChange

  // reduced motion, live
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const onMq = () => setReduced(mq.matches)
    onMq()
    mq.addEventListener("change", onMq)
    return () => mq.removeEventListener("change", onMq)
  }, [])

  React.useEffect(() => setGrain(grainTile()), [])

  // the painting: repainted per destination and when the poster changes size a lot
  const [bucket, setBucket] = React.useState(0)
  React.useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const measure = () => {
      const w = el.clientWidth || 600
      st.current.unit = w / (mat ? 1200 : 1008)
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      const scale = clamp((w / (mat ? 1200 : 1008)) * dpr, 0.45, 1.5)
      setBucket((b) => (Math.abs(b - scale) / Math.max(b, 0.01) > 0.18 ? Math.round(scale * 20) / 20 : b))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [mat])

  const painted = React.useRef("")
  const everPainted = React.useRef(false)
  React.useEffect(() => {
    if (!bucket || dest.image) return
    const key = index + ":" + bucket
    if (painted.current === key) return
    const first = !everPainted.current
    painted.current = key
    const seed = dest.seed ?? hash(dest.title) % 997
    const p = pal
    // one layer per frame, so no single task holds the page for long
    const steps = [
      () => farRef.current && paintLayer(farRef.current, bucket, (c) => paintFar(c, p, seed), { seed: seed + 1, angle: 0 }),
      () => cloudRef.current && paintLayer(cloudRef.current, bucket, (c) => paintClouds(c, p, seed), null),
      () => midRef.current && paintLayer(midRef.current, bucket, (c) => paintMid(c, p, seed), { seed: seed + 2, angle: 0.2 }),
      () => nearRef.current && paintLayer(nearRef.current, bucket, (c) => paintNear(c, p, seed), { seed: seed + 3, angle: -0.1 }),
    ]
    let raf = 0
    let i = 0
    const next = () => {
      steps[i++]()
      if (i < steps.length) raf = requestAnimationFrame(next)
      else {
        everPainted.current = true
        setDeveloping(false)
      }
    }
    // on travel, let the "develop" fade land before the repaint
    const t = window.setTimeout(next, first || reduced ? 0 : 300)
    return () => {
      window.clearTimeout(t)
      cancelAnimationFrame(raf)
      // stopped halfway: the next run must paint this key again
      if (i < steps.length) painted.current = ""
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, bucket])

  // the split-flap title
  React.useEffect(() => {
    if (reduced || !animate || shown === word) {
      setShown(word)
      return
    }
    const r = rng(hash(word) + turn)
    const t0 = performance.now()
    let raf = 0
    const tick = () => {
      const e = performance.now() - t0
      const next = scramble(word, e, 55, 260, r)
      setShown(next)
      if (next !== word) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word, turn])

  const travel = (dir: number) => {
    const next = wrap(index + dir, list.length)
    if (next === index) return
    if (!reduced && !list[next].image) setDeveloping(true)
    setIndex(next)
    setTurn((t) => t + 1)
    st.current.spinBoost = 7 * dir
    setLive("Now showing " + list[next].title)
    onChangeRef.current?.(next, list[next])
  }

  // one loop: parallax, the sliding window and the globes
  React.useEffect(() => {
    const s = st.current
    const el = rootRef.current
    let io: IntersectionObserver | null = null
    if (el && "IntersectionObserver" in window) {
      io = new IntersectionObserver((e) => (s.visible = e[0]?.isIntersecting ?? true))
      io.observe(el)
    }
    const depth = [6, 12, 18, 30]
    let raf = 0
    let last = performance.now()
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (!s.visible) return
      const kp = 1 - Math.exp(-dt * 4)
      const ks = reduced ? 1 : 1 - Math.exp(-dt * 9)
      s.px += (s.tx - s.px) * kp
      s.py += (s.ty - s.py) * kp
      s.s += (s.ts - s.s) * ks
      if (parallax && !reduced) {
        for (let i = 0; i < 4; i++) {
          const l = layerRefs.current[i]
          if (l) l.style.transform = "translate3d(" + fmt(-s.px * depth[i] * s.unit) + "px," + fmt(-s.py * depth[i] * 0.5 * s.unit) + "px,0)"
        }
      }
      if (Math.abs(s.s - s.drawnS) > 0.04) {
        s.drawnS = s.s
        const { top, bottom } = gatePaths(s.s)
        topRef.current?.setAttribute("d", top)
        botRef.current?.setAttribute("d", bottom)
        const dy = fmt(s.s - s0)
        gateTopRef.current?.setAttribute("transform", "translate(0 " + dy + ")")
        gateBotRef.current?.setAttribute("transform", "translate(0 " + dy + ")")
        hitRef.current?.setAttribute("height", fmt(G.bottom + s.s - G.top))
        hitRef.current?.setAttribute("aria-valuenow", String(Math.round(((s.s - G.sMin) / (G.sMax - G.sMin)) * 100)))
      }
      if (animate && !reduced) {
        s.spin += dt * (0.6 + s.spinBoost)
        s.spinBoost *= Math.exp(-dt * 2.2)
        meridians.current.forEach((m, i) => {
          if (!m) return
          const a = s.spin + (i % 3) * (Math.PI / 3)
          m.setAttribute("rx", fmt(Math.abs(Math.cos(a)) * 30))
        })
      }
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      io?.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parallax, animate, reduced])

  // the window can be slid from outside too
  React.useEffect(() => {
    st.current.ts = gateShift(gate)
  }, [gate])

  const vb = mat ? { x: 0, y: 0, w: 1200, h: 1200 } : { x: 96, y: 96, w: 1008, h: 1008 }
  const pctX = (v: number) => ((v - vb.x) / vb.w) * 100 + "%"
  const pctY = (v: number) => ((v - vb.y) / vb.h) * 100 + "%"

  const toUnits = (e: React.PointerEvent) => {
    const el = rootRef.current
    if (!el) return null
    const b = el.getBoundingClientRect()
    return { x: vb.x + ((e.clientX - b.left) / b.width) * vb.w, y: vb.y + ((e.clientY - b.top) / b.height) * vb.h, b }
  }

  const onMove = (e: React.PointerEvent) => {
    const u = toUnits(e)
    if (!u) return
    const s = st.current
    if (e.pointerType === "mouse") {
      s.tx = clamp((u.x - 600) / 500, -1, 1)
      s.ty = clamp((u.y - 470) / 400, -1, 1)
    }
    if (s.drag) {
      const dy = u.y - s.drag.y
      if (Math.abs(dy) > 4) s.drag.moved = true
      s.ts = clamp(s.drag.s + dy, G.sMin, G.sMax)
    }
    const next = u.y > 765 && u.y < 1035 ? clamp(Math.round((u.y - 783) / 30), 0, 8) : -1
    if (next !== row) setRow(next)
  }

  const onLeave = () => {
    st.current.tx = 0
    st.current.ty = 0
    setRow(-1)
  }

  const onGateDown = (e: React.PointerEvent) => {
    const u = toUnits(e)
    if (!u) return
    st.current.drag = { y: u.y, s: st.current.ts, moved: false }
    if (e.pointerType !== "touch") (e.currentTarget as Element).setPointerCapture?.(e.pointerId)
  }
  const onGateUp = () => {
    const d = st.current.drag
    st.current.drag = null
    if (d && !d.moved) {
      const mid = (G.sMin + G.sMax) / 2
      st.current.ts = st.current.ts > mid ? G.sMin : G.sMax
    }
  }
  const onGateKey = (e: React.KeyboardEvent) => {
    const s = st.current
    const step = (G.sMax - G.sMin) / 10
    if (e.key === "ArrowDown" || e.key === "ArrowRight") s.ts = clamp(s.ts + step, G.sMin, G.sMax)
    else if (e.key === "ArrowUp" || e.key === "ArrowLeft") s.ts = clamp(s.ts - step, G.sMin, G.sMax)
    else if (e.key === "Home") s.ts = G.sMin
    else if (e.key === "End") s.ts = G.sMax
    else if (e.key === "Enter" || e.key === " ") s.ts = s.ts > (G.sMin + G.sMax) / 2 ? G.sMin : G.sMax
    else return
    e.preventDefault()
  }

  const press = (fn: () => void) => ({
    onClick: fn,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        fn()
      }
    },
  })

  const { top: topD, bottom: botD } = gatePaths(s0)
  const title = layoutTitle(word, 600, 118, 0.03)
  const sh = Array.from(shown)
  const bars = barcode(dest.code ?? word, 58)
  const barsWide = barcode((dest.code ?? word) + "/" + index, 92)
  const line = dest.tagline ?? tagline

  const T = (x: number, y: number, s: string, anchor: "start" | "middle" | "end" = "start", size = 9.2, extra?: React.SVGProps<SVGTextElement>) => (
    <text x={x} y={y} textAnchor={anchor} fontSize={size} {...extra}>
      {s}
    </text>
  )
  const T2 = (x: number, y: number, lines: string[], anchor: "start" | "middle" | "end" = "start") => (
    <text x={x} y={y} textAnchor={anchor} fontSize={9.2}>
      {lines.map((l, i) => (
        <tspan key={i} x={x} dy={i ? 11 : 0}>
          {l}
        </tspan>
      ))}
    </text>
  )

  const words = marquee.slice(0, 5)
  const wordXs = [255, 298, 352, 413, 467]
  const rows = Array.from({ length: 9 }, (_, i) => 783 + i * 30)
  const motion = animate && !reduced

  const globe = (cx: number, dir: number, label: string) => (
    <g
      className="ew-btn ew-globe"
      role="button"
      tabIndex={0}
      aria-label={label}
      {...press(() => travel(dir))}
    >
      <rect x={cx - 44} y={872} width={88} height={56} fill="transparent" />
      <rect className="ew-focus" x={cx - 44} y={872} width={88} height={56} rx={10} fill="none" stroke={accent} strokeWidth={1.2} strokeDasharray="3 3" />
      <g className="ew-globe-body" fill="none" stroke={ink} strokeWidth={1.3}>
        <ellipse cx={cx} cy={900} rx={30} ry={17} />
        <line x1={cx - 30} y1={900} x2={cx + 30} y2={900} />
        <line x1={cx - 25} y1={891} x2={cx + 25} y2={891} />
        <line x1={cx - 25} y1={909} x2={cx + 25} y2={909} />
        {[0, 1, 2].map((k) => (
          <ellipse
            key={k}
            ref={(el) => {
              meridians.current[(dir < 0 ? 0 : 3) + k] = el
            }}
            cx={cx}
            cy={900}
            rx={[30, 15, 15][k]}
            ry={17}
          />
        ))}
      </g>
    </g>
  )

  const seal = (cx: number, rev: boolean) => (
    <g>
      <circle cx={cx} cy={150} r={22} fill="none" stroke={ink} strokeWidth={1.4} />
      <g className={motion ? "ew-ring" + (rev ? " ew-rev" : "") : undefined}>
        <circle cx={cx} cy={150} r={46} fill="none" stroke="none" />
        <text fontSize={8.2} letterSpacing={0.4}>
          <textPath href={"#" + id + "ring" + (rev ? "r" : "l")} {...ringFit(ring.toUpperCase() + " \u2022 ", 8.2, 0.4, 2 * Math.PI * 34 - 4)}>
            {ring.toUpperCase() + " • "}
          </textPath>
        </text>
      </g>
    </g>
  )

  return (
    <div
      ref={rootRef}
      className={"ew-root " + className}
      style={
        {
          maxWidth,
          aspectRatio: "1 / 1",
          background: mat ? matColor : "transparent",
          "--ew-accent": accent,
        } as React.CSSProperties
      }
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      <style>{CSS}</style>
      <h2 className="ew-sr">{dest.title}</h2>
      <p className="ew-sr" aria-live="polite">
        {live}
      </p>

      {/* the painting, behind the sheets */}
      <div
        className={"ew-paint" + (developing ? " ew-dev" : "")}
        aria-hidden="true"
        style={{
          left: pctX(G.x0),
          top: pctY(PY),
          width: (PW / vb.w) * 100 + "%",
          height: (PH / vb.h) * 100 + "%",
          background: "linear-gradient(" + pal.skyTop + "," + pal.skyHorizon + " 55%," + pal.water + " 70%," + pal.ground + ")",
        }}
      >
        {dest.image ? (
          <div
            ref={(el) => {
              layerRefs.current[3] = el
            }}
            className="ew-layer"
            style={{ left: "-4%", top: "-4%", width: "108%", height: "108%" }}
          >
            <img className="ew-img" src={dest.image} alt="" draggable={false} style={{ maxWidth: "none" }} />
          </div>
        ) : (
          [farRef, cloudRef, midRef, nearRef].map((ref, i) => (
            <div
              key={i}
              ref={(el) => {
                layerRefs.current[i] = el
              }}
              className="ew-layer"
              style={{
                left: (-M / PW) * 100 + "%",
                top: (-M / PH) * 100 + "%",
                width: ((PW + 2 * M) / PW) * 100 + "%",
                height: ((PH + 2 * M) / PH) * 100 + "%",
              }}
            >
              <canvas ref={ref} className={"ew-canvas" + (i === 1 && motion ? " ew-drift" : "")} style={{ maxWidth: "none" }} />
            </div>
          ))
        )}
        {/* varnish: warm vignette and canvas grain */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(ellipse at 45% 40%, rgba(255,240,210,0) 45%, rgba(40,26,10,.32) 100%)",
          }}
        />
        {grain ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: "url(" + grain + ")",
              backgroundSize: "160px 160px",
              mixBlendMode: "overlay",
              opacity: 0.42,
            }}
          />
        ) : null}
      </div>

      <svg
        className="ew-svg"
        viewBox={vb.x + " " + vb.y + " " + vb.w + " " + vb.h}
        role="group"
        aria-label={"Poster: " + dest.title}
        style={{ maxWidth: "none" }}
      >
        <defs>
          <path id={id + "ringl"} d={ringPath(150, 150, 34)} />
          <path id={id + "ringr"} d={ringPath(1050, 150, 34)} />
          <path id={id + "arct"} d={arcPath(600, 940, 145, Math.PI * 1.258, Math.PI * 1.742, false)} />
          <path id={id + "arcb"} d={arcPath(600, 412, 600, Math.PI * 0.64, Math.PI * 0.36, true)} />
        </defs>

        {/* drag the painting to slide the window */}
        <rect
          ref={hitRef}
          className="ew-gate"
          x={G.x0}
          y={G.top}
          width={G.x1 - G.x0}
          height={G.bottom + s0 - G.top}
          fill="transparent"
          role="slider"
          tabIndex={0}
          aria-label="Slide the window between the sheets"
          aria-orientation="vertical"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(clamp(gate, 0, 1) * 100)}
          onPointerDown={onGateDown}
          onPointerUp={onGateUp}
          onPointerCancel={() => (st.current.drag = null)}
          onKeyDown={onGateKey}
        />
        <rect
          className="ew-focus ew-gatefocus"
          x={G.x0 + 8}
          y={G.top + 8}
          width={G.x1 - G.x0 - 16}
          height={G.bottom - G.top - 16}
          rx={12}
          fill="none"
          stroke={paper}
          strokeWidth={1.5}
          strokeDasharray="4 4"
          pointerEvents="none"
        />

        <path ref={topRef} d={topD} fill={paper} />
        <path ref={botRef} d={botD} fill={paper} />

        <g fill={ink} fontFamily={fSans} fontWeight={500} letterSpacing={0.35}>
          {/* ---- top sheet ---- */}
          {seal(150, false)}
          {seal(1050, true)}

          {[0, 1].map((half) =>
            words.map((w, i) => (
              <text key={half + "-" + i} className="ew-word" x={wordXs[i] + half * 472} y={127} textAnchor="middle" fontSize={9.2}>
                {w}
              </text>
            )),
          )}
          <g className={motion ? "ew-blink" : undefined}>
            <path d={tri(215, 123, true)} />
            <path d={tri(985, 123, true)} />
          </g>
          <path d={tri(512, 123, true)} />
          <path d={tri(535, 123, true)} />
          <path d={tri(665, 123, true)} />
          <path d={tri(688, 123, true)} />

          {T2(252, 182, pairs[0] ?? [])}
          {T2(388, 182, pairs[1] ?? [])}
          {T2(812, 182, pairs[1] ?? [], "end")}
          {T2(948, 182, pairs[0] ?? [], "end")}

          <text x={600} y={190} textAnchor="middle" fontFamily={fScript} fontStyle="italic" fontWeight={400} fontSize={40} letterSpacing={0}>
            {script}
          </text>

          <g ref={gateTopRef} transform="translate(0 0)">
            <path className={motion ? "ew-tw" : undefined} d={sparkle(318, 183 + s0 * 0.5, 10)} />
            <path className={motion ? "ew-tw" : undefined} style={{ animationDelay: "-1.7s" }} d={sparkle(882, 183 + s0 * 0.5, 10)} />
            <path d={tri(452, G.top + s0 - 38, false)} />
            <path d={tri(466, G.top + s0 - 38, false)} />
            <path d={tri(734, G.top + s0 - 38, false)} />
            <path d={tri(748, G.top + s0 - 38, false)} />
            {T(600, G.top + s0 - 14, line, "middle", 9.2)}
          </g>

          {/* ---- bottom sheet ---- */}
          {T2(127, 692, corner)}
          {T2(1073, 692, corner, "end")}
          <path d={tri(207, 690, true)} />
          <path d={tri(220, 690, true)} />
          <path d={tri(980, 690, true)} />
          <path d={tri(993, 690, true)} />
          <path d={tri(130, 744, true)} />
          <path d={tri(1072, 744, true)} />

          <g ref={gateBotRef} transform="translate(0 0)">
            {[360, 782].map((bx) => (
              <g key={bx} transform={"translate(" + bx + " " + (G.bottom + s0 + 9) + ")"}>
                {bars.map((b, i) => (
                  <rect key={i} x={b.x} y={0} width={b.w} height={13} />
                ))}
              </g>
            ))}
            {T(560, G.bottom + s0 + 20, gateLabel, "end")}
            <path d={tri(600, G.bottom + s0 + 17, true, 3.8)} />
            {T(640, G.bottom + s0 + 20, gateLabel, "start")}
          </g>

          {/* the ruler, with a marker that follows the pointer */}
          {rows.map((y, i) => (
            <g key={i} fill={row === i ? accent : ink}>
              {T(128, y + 3, String(i + 1), "middle", 9.2, { fontWeight: row === i ? 700 : 500 })}
              {T(1072, y + 3, String(i + 1), "middle", 9.2, { fontWeight: row === i ? 700 : 500 })}
            </g>
          ))}
          <g
            className="ew-mark"
            fill={accent}
            style={{ opacity: row < 0 ? 0 : 1, transform: "translateY(" + (rows[Math.max(0, row)] - rows[0]) + "px)" }}
          >
            <path d={"M143 " + (rows[0] - 4) + "l7 4l-7 4z"} />
            <path d={"M1057 " + (rows[0] - 4) + "l-7 4l7 4z"} />
            <line x1={155} y1={rows[0]} x2={180} y2={rows[0]} stroke={accent} strokeWidth={0.8} />
            <line x1={1020} y1={rows[0]} x2={1045} y2={rows[0]} stroke={accent} strokeWidth={0.8} />
          </g>

          {credits.slice(0, 3).map((c, i) => (
            <React.Fragment key={i}>
              {T2([197, 293, 391][i], 798, c)}
              {T2([1003, 907, 809][i], 798, c, "end")}
            </React.Fragment>
          ))}

          {/* the arcs and the title */}
          <text fontSize={8.4} letterSpacing={0.4}>
            <textPath href={"#" + id + "arct"} startOffset="50%" textAnchor="middle" {...fit(arcTop, 8.4, 0.4, 145 * 0.484 * Math.PI)}>
              {arcTop}
            </textPath>
          </text>
          <path className={motion ? "ew-tw" : undefined} style={{ animationDelay: "-0.6s" }} d={sparkle(600, 826, 9)} />

          <g
            className="ew-btn"
            role="button"
            tabIndex={0}
            aria-label={"Travel on from " + dest.title}
            {...press(() => travel(1))}
          >
            <rect x={600 - 300} y={850} width={600} height={100} fill="transparent" />
            <rect className="ew-focus" x={600 - 300} y={850} width={600} height={100} rx={12} fill="none" stroke={accent} strokeWidth={1.2} strokeDasharray="3 3" />
            <g fontFamily={fDisplay} fontWeight={700} fontSize={fmt(title.size)} letterSpacing={0}>
              {title.letters.map((l, i) => (
                <text
                  key={turn + "-" + i}
                  className={"ew-letter" + (motion ? " ew-turn" : "")}
                  style={motion ? { animationDelay: i * 55 + "ms" } : undefined}
                  x={600 + l.x}
                  y={900 + title.size * 0.34}
                  textAnchor="middle"
                >
                  {sh[i] ?? l.ch}
                </text>
              ))}
            </g>
          </g>

          {globe(228, -1, "Previous destination")}
          {globe(972, 1, "Next destination")}

          <path className={motion ? "ew-tw" : undefined} style={{ animationDelay: "-1.1s" }} d={sparkle(600, 966, 8)} />
          <path className={motion ? "ew-tw" : undefined} style={{ animationDelay: "-2.2s" }} d={sparkle(553, 984, 6)} />
          <path className={motion ? "ew-tw" : undefined} style={{ animationDelay: "-0.3s" }} d={sparkle(647, 984, 6)} />
          <text fontSize={8} letterSpacing={0.3}>
            <textPath href={"#" + id + "arcb"} startOffset="50%" textAnchor="middle" {...fit(arcBottom, 8, 0.3, 600 * 0.28 * Math.PI)}>
              {arcBottom}
            </textPath>
          </text>

          {T2(197, 968, notes[0] ?? [])}
          {T2(197, 1013, notes[1] ?? [])}
          {T2(1003, 968, notes[0] ?? [], "end")}
          {T2(1003, 1013, notes[1] ?? [], "end")}

          <g className={motion ? "ew-blink" : undefined} style={{ animationDelay: "-1.3s" }}>
            <path d={tri(243, 1060, false)} />
            <path d={tri(957, 1060, false)} />
          </g>
          <path d={tri(400, 1060, false)} />
          <path d={tri(414, 1060, false)} />
          <path d={tri(786, 1060, false)} />
          <path d={tri(800, 1060, false)} />
          <path d={tri(703, 1060, false)} />
          <path d={tri(497, 1060, false)} />
          {T(128, 1081, footer, "start")}
          {T(1072, 1081, footer, "end")}
          <g transform="translate(554 1070)">
            {barsWide.map((b, i) => (
              <rect key={i} x={b.x} y={0} width={b.w} height={14} />
            ))}
          </g>
        </g>
      </svg>
    </div>
  )
}
