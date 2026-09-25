"use client"

import { useEffect, useRef, useState } from "react"
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from "react"

/**
 * Six Seven Poster: a thriller one-sheet that plays out the "six… seven" meme.
 *
 * A red field, a figure in a stained shirt with both palms held out, and huge
 * dry-brush numerals painted across it: first the 6 over the left hand, then
 * the 7 over the right, then the hands pump like scales, and the title is
 * painted across the whole poster.
 *
 * Nothing in it is an asset. The figure, the hands, the brush strokes, the
 * paper texture and the grain are all drawn on one canvas from numbers, so it
 * never waits on a download and never trips a sandbox that blocks off-site
 * images. React is the only import.
 *
 * Two modes, one timeline:
 * - "auto" (default): it plays itself, holds on the finished poster, and loops.
 * - "scroll": scroll position *is* the timeline. Scrub back and it runs back.
 */

export type SixSevenMode = "auto" | "scroll"

export type SixSevenBeat = "intro" | "six" | "seven" | "pump" | "title"

export type SixSevenPosterProps = {
  /** "auto" plays by itself (the default); "scroll" scrubs with the page. */
  mode?: SixSevenMode
  /** The first numeral, over the left hand. Any single glyph A–Z / 0–9. */
  first?: string
  /** The second numeral, over the right hand. */
  second?: string
  /** Painted across the finished poster. A–Z, 0–9, spaces and hyphens. */
  title?: string
  /** One line for each beat. Joined into the tagline on the last frame. */
  captions?: [string, string]
  /** Top-left billing, one name per entry. Each word gets its own line. */
  cast?: string[]
  /** Top-right credit. */
  credit?: string
  /** The small print block above the date. */
  billing?: string
  /** The big line at the bottom. */
  release?: string
  /** Text in the rating box. */
  rating?: string
  /** The field. */
  red?: string
  /** The brush paint. Deliberately not pure white. */
  paint?: string
  /** Shadows, skin and the blackout between loops. */
  ink?: string
  /** The shirt. */
  shirt?: string
  /** Film grain strength. 0 disables it. */
  grain?: number
  /** Seconds from black to the finished poster (auto mode). */
  duration?: number
  /** Seconds to hold the finished poster before looping (auto mode). */
  hold?: number
  /** Start again after the hold (auto mode). */
  loop?: boolean
  /** Start playing on mount (auto mode). Off shows the finished poster. */
  autoPlay?: boolean
  /** Scroll length as a multiple of `height` (scroll mode). */
  scrollLength?: number
  /** The stage. **Must be a definite length.** */
  height?: string
  /** Play/pause, replay, beat chips and the scrubber. */
  controls?: boolean
  /** The pointer drifts the layers and lifts the hand it is over. */
  parallax?: boolean
  onBeatChange?: (beat: SixSevenBeat) => void
  className?: string
}

// #region timeline
export function clamp01(x: number) {
  return x > 0 ? (x < 1 ? x : 1) : 0
}

export function smoothstep(a: number, b: number, x: number) {
  if (a === b) return x < a ? 0 : 1
  const t = clamp01((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}

export function easeInOut(x: number) {
  const t = clamp01(x)
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

/** 0 with the root's top at the stage's top, 1 once its bottom arrives. */
export function progressFrom(top: number, height: number, viewport: number) {
  const travel = height - viewport
  if (!(travel > 0)) return 0
  return clamp01(-top / travel)
}

export const BEATS = ["intro", "six", "seven", "pump", "title"]
/** Where each beat starts on the 0–1 timeline. */
export const BEAT_START = [0, 0.1, 0.38, 0.64, 0.76]
/** A frame inside each beat worth stopping on: the beat, fully arrived. */
export const BEAT_HOLD = [0.08, 0.33, 0.61, 0.7, 1]

export function beatIndex(t: number) {
  let i = 0
  for (let k = 1; k < BEAT_START.length; k++) if (t >= BEAT_START[k]) i = k
  return i
}

/** The auto clock: elapsed seconds → timeline position and loop blackout. */
export function autoFrame(elapsed: number, duration: number, hold: number, loop: boolean) {
  const d = duration > 0.5 ? duration : 0.5
  const h = hold > 0 ? hold : 0
  const total = d + h
  const e = loop ? ((elapsed % total) + total) % total : Math.min(Math.max(elapsed, 0), total)
  const t = clamp01(e / d)
  const blackout = loop && h > 0 ? smoothstep(total - Math.min(0.6, h), total, e) : 0
  return { t, blackout }
}

/** 0 at the start of the pump, three full six-seven swings, back to 0. */
function pumpWave(t: number) {
  return Math.sin(clamp01((t - 0.64) / 0.12) * Math.PI * 6)
}

function pumpEnvelope(t: number) {
  return smoothstep(0.62, 0.67, t) * (1 - smoothstep(0.74, 0.78, t))
}

/** How far each hand is raised. 0 rests, 1 is presented. */
export function handLift(t: number) {
  const six = smoothstep(0.1, 0.17, t) * (1 - smoothstep(0.38, 0.45, t))
  const seven = smoothstep(0.38, 0.45, t) * (1 - smoothstep(0.62, 0.68, t))
  const env = pumpEnvelope(t)
  const w = pumpWave(t)
  const rest = smoothstep(0.76, 0.84, t) * 0.4
  return {
    left: six + env * (0.5 + 0.5 * w) + rest,
    right: seven + env * (0.5 - 0.5 * w) + rest,
  }
}

/** How much of each brush layer is painted, and how strongly it shows. */
export function paintAt(t: number) {
  const env = pumpEnvelope(t)
  const w = pumpWave(t)
  const recede = 1 - smoothstep(0.76, 0.84, t)
  return {
    six: easeInOut((t - 0.12) / 0.17),
    seven: easeInOut((t - 0.4) / 0.17),
    sixAlpha: (1 - 0.55 * smoothstep(0.4, 0.46, t) + env * 0.55 * (0.5 + 0.5 * w)) * recede,
    sevenAlpha: (1 - 0.55 * smoothstep(0.62, 0.66, t) + env * 0.55 * (0.5 - 0.5 * w)) * recede,
    ghost: smoothstep(0.76, 0.86, t),
    title: clamp01((t - 0.785) / 0.14),
    poster: smoothstep(0.9, 0.98, t),
  }
}

/** A hard white frame at each cut, gone within 2% of the timeline. */
export function flashAt(t: number) {
  let f = 0
  const cuts = [0.12, 0.4, 0.785]
  for (let i = 0; i < cuts.length; i++) {
    const d = t - cuts[i]
    if (d >= 0 && d < 0.02) f = Math.max(f, 1 - d / 0.02)
  }
  return f
}
// #endregion

// ---------------------------------------------------------------------------
// Colour
// ---------------------------------------------------------------------------

type RGB = [number, number, number]

function parseHex(hex: string): RGB {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return [255, 255, 255]
  let h = m[1]
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]
  const n = parseInt(h, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function mix(a: RGB, b: RGB, t: number): RGB {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
}

function css(c: RGB, a = 1) {
  return "rgba(" + Math.round(c[0]) + "," + Math.round(c[1]) + "," + Math.round(c[2]) + "," + a + ")"
}

const BLACK: RGB = [0, 0, 0]
const WHITE: RGB = [255, 255, 255]

function mulberry32(seed: number) {
  let s = seed | 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ---------------------------------------------------------------------------
// Brush alphabet: single-line skeletons in a box 100 units tall. The brush,
// not the skeleton, makes them look painted — so these stay deliberately
// plain and let the bristles do the work.
// ---------------------------------------------------------------------------

const O_RING = [36, 4, 14, 18, 6, 52, 16, 86, 38, 97, 58, 82, 64, 46, 54, 12, 34, 5]

const GLYPHS: Record<string, [number, number[][]]> = {
  "0": [64, [O_RING]],
  "1": [44, [[10, 22, 28, 4, 30, 96]]],
  "2": [64, [[8, 24, 22, 6, 42, 4, 56, 20, 52, 42, 10, 92], [8, 94, 60, 90]]],
  "3": [62, [[8, 12, 30, 4, 52, 14, 50, 36, 28, 48], [28, 48, 54, 58, 58, 80, 40, 96, 18, 96, 4, 84]]],
  "4": [66, [[44, 96, 44, 4, 6, 66], [6, 66, 64, 64]]],
  "5": [62, [[56, 6, 16, 8], [16, 8, 12, 44, 34, 38, 54, 52, 58, 76, 42, 96, 18, 96, 4, 84]]],
  "6": [68, [[58, 6, 40, 10, 22, 30, 12, 58, 16, 84, 34, 96, 54, 92, 64, 74, 58, 56, 40, 50, 22, 58, 14, 72]]],
  "7": [70, [[6, 12, 34, 6, 66, 8], [64, 10, 46, 48, 30, 96], [24, 54, 62, 48]]],
  "8": [62, [[50, 14, 34, 4, 14, 12, 14, 32, 34, 48, 56, 64, 56, 86, 34, 97, 12, 86, 12, 64, 34, 48, 52, 32, 50, 14]]],
  "9": [62, [[54, 40, 36, 50, 14, 42, 10, 20, 28, 4, 50, 8, 58, 30, 54, 64, 40, 96]]],
  A: [68, [[4, 96, 34, 4, 64, 96], [16, 62, 54, 60]]],
  B: [62, [[10, 96, 10, 4], [10, 6, 40, 6, 52, 18, 46, 40, 12, 48], [12, 48, 46, 52, 58, 70, 48, 92, 10, 94]]],
  C: [64, [[60, 16, 44, 4, 20, 8, 8, 40, 10, 74, 26, 96, 48, 96, 62, 82]]],
  D: [64, [[10, 4, 10, 96], [10, 6, 40, 8, 58, 34, 58, 64, 42, 92, 10, 94]]],
  E: [56, [[50, 6, 10, 8, 8, 52, 10, 94, 54, 92], [10, 48, 42, 48]]],
  F: [54, [[52, 6, 10, 8, 8, 96], [10, 48, 40, 48]]],
  G: [66, [[60, 16, 44, 4, 20, 8, 8, 40, 10, 74, 26, 96, 50, 94, 62, 76, 62, 58, 38, 56]]],
  H: [66, [[10, 4, 10, 96], [58, 4, 58, 96], [10, 50, 58, 48]]],
  I: [26, [[12, 4, 13, 96]]],
  J: [56, [[50, 4, 52, 70, 40, 94, 18, 94, 6, 78]]],
  K: [62, [[10, 4, 10, 96], [58, 4, 12, 56], [26, 44, 60, 96]]],
  L: [54, [[10, 4, 8, 94, 52, 92]]],
  M: [76, [[6, 96, 10, 4, 38, 60, 66, 4, 70, 96]]],
  N: [68, [[10, 96, 10, 6], [10, 6, 58, 94], [58, 94, 60, 4]]],
  O: [68, [O_RING]],
  P: [60, [[10, 96, 10, 4], [10, 6, 42, 6, 56, 20, 52, 42, 12, 50]]],
  Q: [68, [O_RING, [40, 70, 66, 100]]],
  R: [62, [[10, 96, 10, 4], [10, 6, 42, 6, 56, 20, 52, 42, 12, 50], [30, 50, 60, 96]]],
  S: [62, [[56, 12, 40, 4, 18, 10, 10, 28, 24, 44, 44, 54, 56, 70, 50, 90, 28, 97, 6, 88]]],
  T: [66, [[4, 8, 64, 6], [34, 6, 34, 96]]],
  U: [64, [[8, 4, 8, 68, 22, 94, 46, 94, 58, 70, 58, 4]]],
  V: [64, [[4, 4, 32, 96, 60, 4]]],
  W: [78, [[4, 4, 18, 96, 38, 30, 58, 96, 72, 4]]],
  X: [66, [[6, 4, 62, 96], [62, 4, 6, 96]]],
  Y: [64, [[4, 4, 32, 50], [62, 4, 32, 50, 32, 96]]],
  Z: [64, [[6, 8, 60, 6, 8, 94, 62, 92]]],
  "-": [44, [[6, 52, 40, 48]]],
}

const SPACE = 34
const KERN = 6

type Stroke = { x: Float32Array; y: Float32Array; s: Float32Array; n: number }
type Glyph = { w: number; strokes: Stroke[] }

function sampleStroke(c: number[]): Stroke {
  const m = c.length / 2
  const dx: number[] = []
  const dy: number[] = []
  const at = (i: number) => {
    const k = Math.max(0, Math.min(m - 1, i))
    return [c[k * 2], c[k * 2 + 1]]
  }
  for (let i = 0; i < m - 1; i++) {
    const p0 = at(i - 1)
    const p1 = at(i)
    const p2 = at(i + 1)
    const p3 = at(i + 2)
    for (let k = 0; k < 16; k++) {
      const u = k / 16
      const u2 = u * u
      const u3 = u2 * u
      for (let a = 0; a < 2; a++) {
        const v =
          0.5 *
          (2 * p1[a] +
            (-p0[a] + p2[a]) * u +
            (2 * p0[a] - 5 * p1[a] + 4 * p2[a] - p3[a]) * u2 +
            (-p0[a] + 3 * p1[a] - 3 * p2[a] + p3[a]) * u3)
        if (a === 0) dx.push(v)
        else dy.push(v)
      }
    }
  }
  dx.push(c[(m - 1) * 2])
  dy.push(c[(m - 1) * 2 + 1])
  const cum = [0]
  for (let i = 1; i < dx.length; i++) cum.push(cum[i - 1] + Math.hypot(dx[i] - dx[i - 1], dy[i] - dy[i - 1]))
  const len = cum[cum.length - 1] || 1
  const n = Math.max(16, Math.min(110, Math.round(len / 2.2)))
  const x = new Float32Array(n)
  const y = new Float32Array(n)
  const s = new Float32Array(n)
  let j = 0
  for (let i = 0; i < n; i++) {
    const target = (i / (n - 1)) * len
    while (j < cum.length - 2 && cum[j + 1] < target) j++
    const seg = cum[j + 1] - cum[j] || 1
    const f = Math.min(1, Math.max(0, (target - cum[j]) / seg))
    x[i] = dx[j] + (dx[j + 1] - dx[j]) * f
    y[i] = dy[j] + (dy[j + 1] - dy[j]) * f
    s[i] = i / (n - 1)
  }
  return { x, y, s, n }
}

const glyphCache = new Map<string, Glyph | null>()

function glyphFor(ch: string): Glyph | null {
  const key = ch.toUpperCase()
  if (glyphCache.has(key)) return glyphCache.get(key) ?? null
  const def = GLYPHS[key]
  const g = def ? { w: def[0], strokes: def[1].map(sampleStroke) } : null
  glyphCache.set(key, g)
  return g
}

/** Maps glyph units onto the screen: scale, vertical stretch, lean, turn. */
type Pose = { x: number; y: number; k: number; sy: number; skew: number; rot: number }

function poseMatrix(p: Pose, gw: number) {
  const cos = Math.cos(p.rot)
  const sin = Math.sin(p.rot)
  const a = cos * p.k
  const b = sin * p.k
  const c = -(cos * p.skew + sin) * p.k * p.sy
  const d = (cos - sin * p.skew) * p.k * p.sy
  return [a, b, c, d, p.x - a * gw * 0.5 - c * 50, p.y - b * gw * 0.5 - d * 50]
}

/**
 * One dry-brush stroke, painted up to `reveal`. A bundle of bristles, each a
 * polyline offset along the normal: the middle ones run the whole length, the
 * outer ones start late, run dry early and skip, which is what makes the tail
 * split into streaks instead of ending in a clean cap.
 */
function brushStroke(
  ctx: CanvasRenderingContext2D,
  st: Stroke,
  M: number[],
  width: number,
  reveal: number,
  seed: number,
  alpha: number,
  bristles: number,
) {
  if (reveal <= 0 || alpha <= 0.002) return
  const n = st.n
  const X = new Float32Array(n)
  const Y = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    X[i] = M[0] * st.x[i] + M[2] * st.y[i] + M[4]
    Y[i] = M[1] * st.x[i] + M[3] * st.y[i] + M[5]
  }
  const NX = new Float32Array(n)
  const NY = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const a = Math.max(0, i - 1)
    const b = Math.min(n - 1, i + 1)
    const tx = X[b] - X[a]
    const ty = Y[b] - Y[a]
    const l = Math.hypot(tx, ty) || 1
    NX[i] = -ty / l
    NY[i] = tx / l
  }
  const head = reveal >= 1 ? n - 1 : Math.floor(reveal * (n - 1))
  const rnd = mulberry32(seed)
  const B = bristles
  ctx.lineCap = "round"
  ctx.lineJoin = "round"
  for (let b = 0; b < B + 3; b++) {
    const stray = b >= B
    const o = stray ? (rnd() < 0.5 ? -1 : 1) * (0.5 + rnd() * 0.14) : (b + 0.5) / B - 0.5 + (rnd() - 0.5) * (0.6 / B)
    const edge = Math.min(1, Math.abs(o) * 2)
    const lw = stray ? Math.max(0.6, width * 0.012) : (width / B) * (1.7 + rnd() * 1.5) * (1 - 0.45 * edge)
    const s0 = rnd() * 0.06 * edge + (stray ? 0.1 + rnd() * 0.3 : 0)
    const s1 = stray
      ? s0 + 0.1 + rnd() * 0.3
      : 1 - Math.pow(rnd(), 2) * 0.5 * Math.pow(edge, 1.2) - (rnd() < 0.12 ? rnd() * 0.25 : 0)
    const gap = rnd() < 0.3
    const g0 = 0.2 + rnd() * 0.6
    const g1 = g0 + 0.03 + rnd() * 0.12
    const ph = rnd() * 6.283
    const ph2 = rnd() * 6.283
    ctx.globalAlpha = alpha * (0.74 + 0.26 * rnd()) * (1 - 0.3 * edge) * (stray ? 0.6 : 1)
    ctx.lineWidth = lw
    ctx.beginPath()
    let pen = false
    for (let i = 0; i <= head; i++) {
      const s = st.s[i]
      if (s < s0 || s > s1 || (gap && s > g0 && s < g1)) {
        pen = false
        continue
      }
      const prof = (0.86 + 0.14 * Math.sin(Math.PI * Math.min(1, s * 1.6))) * (1 - 0.3 * smoothstep(0.62, 1, s))
      const splay = 1 + 0.32 * smoothstep(0.7, 1, s)
      const off = (o * splay + Math.sin(s * 11 + ph) * 0.018 + Math.sin(s * 27 + ph2) * 0.008) * width * prof
      const px = X[i] + NX[i] * off
      const py = Y[i] + NY[i] * off
      if (pen) ctx.lineTo(px, py)
      else ctx.moveTo(px, py)
      pen = true
    }
    ctx.stroke()
  }
  // Flecks thrown off the end of the stroke once the brush has lifted.
  if (reveal >= 0.999) {
    const e = n - 1
    const tx = X[e] - X[Math.max(0, e - 3)]
    const ty = Y[e] - Y[Math.max(0, e - 3)]
    const tl = Math.hypot(tx, ty) || 1
    const ux = tx / tl
    const uy = ty / tl
    const count = 5 + Math.floor(rnd() * 7)
    for (let i = 0; i < count; i++) {
      const d = width * (0.3 + rnd() * 1.6)
      const side = (rnd() - 0.5) * width * 1.1
      const r = width * (0.012 + rnd() * rnd() * 0.07)
      ctx.globalAlpha = alpha * (0.5 + rnd() * 0.5)
      ctx.beginPath()
      ctx.ellipse(X[e] + ux * d - uy * side, Y[e] + uy * d + ux * side, r * (1 + rnd() * 1.5), r, Math.atan2(uy, ux), 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.globalAlpha = 1
}

function paintGlyph(
  ctx: CanvasRenderingContext2D,
  ch: string,
  pose: Pose,
  reveal: number,
  alpha: number,
  seed: number,
  bristles: number,
  weight: number,
) {
  const g = glyphFor(ch)
  if (!g || reveal <= 0) return
  const M = poseMatrix(pose, g.w)
  const m = g.strokes.length
  for (let j = 0; j < m; j++) {
    const r = clamp01(reveal * m - j)
    brushStroke(ctx, g.strokes[j], M, pose.k * 16 * weight, r, seed + j * 1013, alpha, bristles)
  }
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

type Layout = {
  W: number
  H: number
  cx: number
  F: number
  collarY: number
  handY: number
  spread: number
  numeralH: number
  sixX: number
  sevenX: number
  numeralY: number
  portrait: boolean
}

function layoutFor(W: number, H: number): Layout {
  const portrait = W / H < 0.9
  const F = portrait ? Math.min(W * 0.2, H * 0.13) : Math.min(W * 0.125, H * 0.26)
  const numeralH = portrait ? Math.min(H * 0.34, W * 0.62) : Math.min(H * 0.68, W * 0.36)
  const off = portrait ? W * 0.23 : Math.min(W * 0.25, numeralH * 0.62)
  return {
    W,
    H,
    cx: W / 2,
    F,
    collarY: H * (portrait ? 0.14 : 0.1),
    handY: H * (portrait ? 0.6 : 0.66),
    spread: portrait ? W * 0.34 : Math.min(W * 0.4, F * 5.6),
    numeralH,
    sixX: W / 2 - off,
    sevenX: W / 2 + off,
    numeralY: H * (portrait ? 0.42 : 0.46),
    portrait,
  }
}

type TitleGlyph = { ch: string; pose: Pose; seed: number }

const advance = (c: string) => (c === " " ? SPACE : glyphFor(c)?.w ?? SPACE)

function lineWidth(line: string[]) {
  return line.reduce((a, c) => a + advance(c), 0) + KERN * Math.max(0, line.length - 1)
}

/** Split into two lines at the space that balances them best. */
function splitTitle(chars: string[]): string[][] {
  let best = -1
  let bestW = Infinity
  chars.forEach((c, i) => {
    if (c !== " ") return
    const w = Math.max(lineWidth(chars.slice(0, i)), lineWidth(chars.slice(i + 1)))
    if (w < bestW) {
      bestW = w
      best = i
    }
  })
  return best < 0 ? [chars] : [chars.slice(0, best), chars.slice(best + 1)]
}

function layoutTitle(title: string, L: Layout): TitleGlyph[] {
  const all = Array.from(title.toUpperCase().trim())
  if (!all.length) return []
  // A phone is too narrow for one long line: stack it, as a one-sheet would.
  const lines = L.portrait ? splitTitle(all) : [all]
  const sy = 1.55
  const lineGap = 0.12
  const widest = Math.max(...lines.map(lineWidth))
  if (widest <= 0) return []
  const maxW = L.W * 0.92
  const maxH = L.H * (L.portrait ? 0.42 : 0.56)
  const blockUnits = 100 * sy * (lines.length + lineGap * (lines.length - 1))
  const k = Math.min(maxW / widest, maxH / blockUnits)
  const out: TitleGlyph[] = []
  const rnd = mulberry32(7331 + all.length)
  const cy = L.H * (L.portrait ? 0.45 : 0.47)
  const lineH = 100 * sy * k * (1 + lineGap)
  let index = 0
  lines.forEach((line, li) => {
    let x = L.cx - (lineWidth(line) * k) / 2
    const y = cy + (li - (lines.length - 1) / 2) * lineH
    for (const ch of line) {
      const w = advance(ch) * k
      const jitterR = (rnd() - 0.5) * 0.12
      const jitterY = (rnd() - 0.5) * 0.08 * 100 * k * sy
      if (ch !== " " && glyphFor(ch)) {
        out.push({ ch, pose: { x: x + w / 2, y: y + jitterY, k, sy, skew: 0.2, rot: jitterR }, seed: 101 + index * 7919 })
      }
      index++
      x += w + KERN * k
    }
  })
  return out
}

// ---------------------------------------------------------------------------
// Static layers, rebuilt only on resize or a colour change
// ---------------------------------------------------------------------------

type Palette = { red: RGB; paint: RGB; ink: RGB; shirt: RGB; skin: RGB; blood: RGB }

function makeCanvas(w: number, h: number) {
  const c = document.createElement("canvas")
  c.width = Math.max(1, Math.round(w))
  c.height = Math.max(1, Math.round(h))
  return c
}

/** Red field with printed-paper mottling. Oversized so shake never shows an edge. */
function paintField(W: number, H: number, dpr: number, pal: Palette) {
  const bw = W * 1.12
  const bh = H * 1.12
  const c = makeCanvas(bw * dpr, bh * dpr)
  const g = c.getContext("2d")
  if (!g) return c
  g.scale(dpr, dpr)
  g.fillStyle = css(pal.red)
  g.fillRect(0, 0, bw, bh)
  const rnd = mulberry32(42)
  const big = Math.max(bw, bh)
  for (let i = 0; i < 70; i++) {
    const x = rnd() * bw
    const y = rnd() * bh
    const r = big * (0.05 + rnd() * 0.22)
    const tone = rnd() < 0.55 ? mix(pal.red, BLACK, 0.35) : mix(pal.red, WHITE, 0.12)
    const grad = g.createRadialGradient(x, y, 0, x, y, r)
    grad.addColorStop(0, css(tone, 0.06 + rnd() * 0.08))
    grad.addColorStop(1, css(tone, 0))
    g.fillStyle = grad
    g.fillRect(x - r, y - r, r * 2, r * 2)
  }
  // Paper fibres.
  g.lineWidth = 0.6
  for (let i = 0; i < 900; i++) {
    const x = rnd() * bw
    const y = rnd() * bh
    const a = rnd() * Math.PI
    const l = 3 + rnd() * 14
    g.strokeStyle = css(rnd() < 0.5 ? mix(pal.red, BLACK, 0.4) : mix(pal.red, WHITE, 0.25), 0.08 + rnd() * 0.1)
    g.beginPath()
    g.moveTo(x, y)
    g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l)
    g.stroke()
  }
  // A hot spot behind the figure, falling off to the edges.
  const glow = g.createRadialGradient(bw / 2, bh * 0.42, 0, bw / 2, bh * 0.42, big * 0.55)
  glow.addColorStop(0, css(mix(pal.red, WHITE, 0.1), 0.35))
  glow.addColorStop(1, css(pal.red, 0))
  g.fillStyle = glow
  g.fillRect(0, 0, bw, bh)
  return c
}

function shirtPath(g: CanvasRenderingContext2D, L: Layout) {
  const { cx, F, collarY: yc, H } = L
  g.beginPath()
  g.moveTo(cx - 0.3 * F, yc)
  g.quadraticCurveTo(cx - 0.8 * F, yc + 0.08 * F, cx - 1.08 * F, yc + 0.3 * F)
  g.quadraticCurveTo(cx - 1.3 * F, yc + 0.7 * F, cx - 1.36 * F, yc + 1.28 * F)
  g.lineTo(cx - 1.0 * F, yc + 1.42 * F)
  g.quadraticCurveTo(cx - 0.92 * F, yc + 2.4 * F, cx - 0.98 * F, H + 4)
  g.lineTo(cx + 0.98 * F, H + 4)
  g.quadraticCurveTo(cx + 0.92 * F, yc + 2.4 * F, cx + 1.0 * F, yc + 1.42 * F)
  g.lineTo(cx + 1.36 * F, yc + 1.28 * F)
  g.quadraticCurveTo(cx + 1.3 * F, yc + 0.7 * F, cx + 1.08 * F, yc + 0.3 * F)
  g.quadraticCurveTo(cx + 0.8 * F, yc + 0.08 * F, cx + 0.3 * F, yc)
  g.quadraticCurveTo(cx, yc + 0.3 * F, cx - 0.3 * F, yc)
  g.closePath()
}

function splatter(g: CanvasRenderingContext2D, rnd: () => number, x0: number, y0: number, w: number, h: number, clusters: number, scale: number, color: RGB) {
  for (let c = 0; c < clusters; c++) {
    const cxp = x0 + rnd() * w
    const cyp = y0 + rnd() * h
    const count = 6 + Math.floor(rnd() * 22)
    const spread = scale * (6 + rnd() * 26)
    for (let i = 0; i < count; i++) {
      const a = rnd() * Math.PI * 2
      const d = Math.pow(rnd(), 1.8) * spread
      const r = scale * (0.4 + Math.pow(rnd(), 3) * 4.5)
      g.fillStyle = css(color, 0.45 + rnd() * 0.5)
      g.beginPath()
      g.ellipse(cxp + Math.cos(a) * d, cyp + Math.sin(a) * d, r * (1 + rnd()), r, a, 0, Math.PI * 2)
      g.fill()
    }
    // A run or two.
    if (rnd() < 0.5) {
      const dx = cxp + (rnd() - 0.5) * spread
      const len = scale * (8 + rnd() * 30)
      g.strokeStyle = css(color, 0.55)
      g.lineWidth = scale * (0.8 + rnd() * 1.4)
      g.lineCap = "round"
      g.beginPath()
      g.moveTo(dx, cyp)
      g.quadraticCurveTo(dx + scale * (rnd() - 0.5) * 3, cyp + len * 0.5, dx + scale * (rnd() - 0.5) * 2, cyp + len)
      g.stroke()
    }
  }
}

/** The torso: neck in shadow, shirt, collar, placket, pocket, stains. */
function paintTorso(W: number, H: number, dpr: number, L: Layout, pal: Palette) {
  const c = makeCanvas(W * dpr, H * dpr)
  const g = c.getContext("2d")
  if (!g) return c
  g.scale(dpr, dpr)
  const { cx, F, collarY: yc } = L
  const rnd = mulberry32(9)
  const sc = F / 120

  // Neck and the underside of a jaw, cropped by the top edge like the poster.
  // The jaw, wider than the neck and cropped by the top edge.
  const jawY = yc - 0.62 * F
  const neck = g.createLinearGradient(0, jawY + 0.3 * F, 0, yc + 0.25 * F)
  neck.addColorStop(0, css(pal.ink))
  neck.addColorStop(1, css(pal.skin))
  g.fillStyle = neck
  g.beginPath()
  g.moveTo(cx - 0.34 * F, jawY)
  g.lineTo(cx + 0.34 * F, jawY)
  g.lineTo(cx + 0.31 * F, yc + 0.25 * F)
  g.lineTo(cx - 0.31 * F, yc + 0.25 * F)
  g.closePath()
  g.fill()
  g.fillStyle = css(mix(pal.skin, pal.ink, 0.45))
  g.beginPath()
  g.moveTo(cx - 0.62 * F, -4)
  g.lineTo(cx + 0.62 * F, -4)
  g.quadraticCurveTo(cx + 0.6 * F, jawY + 0.34 * F, cx, jawY + 0.5 * F)
  g.quadraticCurveTo(cx - 0.6 * F, jawY + 0.34 * F, cx - 0.62 * F, -4)
  g.closePath()
  g.fill()
  // Rim light down one side of the neck.
  g.strokeStyle = css(mix(pal.red, WHITE, 0.1), 0.35)
  g.lineWidth = Math.max(1, F * 0.02)
  g.beginPath()
  g.moveTo(cx + 0.5 * F, jawY + 0.28 * F)
  g.quadraticCurveTo(cx + 0.36 * F, jawY + 0.45 * F, cx + 0.33 * F, yc + 0.1 * F)
  g.stroke()

  // Shirt body.
  shirtPath(g, L)
  const body = g.createLinearGradient(cx - 1.4 * F, 0, cx + 1.4 * F, 0)
  body.addColorStop(0, css(mix(pal.shirt, BLACK, 0.55)))
  body.addColorStop(0.22, css(mix(pal.shirt, BLACK, 0.18)))
  body.addColorStop(0.42, css(mix(pal.shirt, WHITE, 0.12)))
  body.addColorStop(0.62, css(pal.shirt))
  body.addColorStop(0.85, css(mix(pal.shirt, BLACK, 0.3)))
  body.addColorStop(1, css(mix(pal.shirt, BLACK, 0.6)))
  g.fillStyle = body
  g.fill()

  g.save()
  shirtPath(g, L)
  g.clip()
  const fall = g.createLinearGradient(0, yc, 0, H)
  fall.addColorStop(0, "rgba(0,0,0,0)")
  fall.addColorStop(1, "rgba(0,0,0,0.38)")
  g.fillStyle = fall
  g.fillRect(0, 0, W, H)
  // Folds.
  g.lineCap = "round"
  for (let i = 0; i < 7; i++) {
    const side = i % 2 ? 1 : -1
    const x = cx + side * (0.25 + rnd() * 0.6) * F
    const y = yc + F * (1.5 + rnd() * 1.4)
    g.strokeStyle = css(mix(pal.shirt, BLACK, 0.5), 0.1 + rnd() * 0.1)
    g.lineWidth = F * (0.04 + rnd() * 0.06)
    g.beginPath()
    g.moveTo(x, y)
    g.quadraticCurveTo(x + side * F * 0.08, y + F * 0.5, x + side * F * (0.02 + rnd() * 0.12), y + F * (0.9 + rnd() * 0.9))
    g.stroke()
  }
  // Armpit shadows under the sleeves.
  for (const side of [-1, 1]) {
    const sx = cx + side * 1.02 * F
    const sh = g.createRadialGradient(sx, yc + 1.5 * F, 0, sx, yc + 1.5 * F, F * 0.6)
    sh.addColorStop(0, "rgba(0,0,0,0.45)")
    sh.addColorStop(1, "rgba(0,0,0,0)")
    g.fillStyle = sh
    g.fillRect(sx - F, yc + F, F * 2, F * 1.2)
  }
  // Pocket, on the figure's right (viewer's left).
  const px = cx - 0.74 * F
  const py = yc + 0.95 * F
  g.fillStyle = css(mix(pal.shirt, BLACK, 0.08))
  g.strokeStyle = css(mix(pal.shirt, BLACK, 0.45), 0.8)
  g.lineWidth = Math.max(1, F * 0.018)
  g.beginPath()
  g.rect(px, py, 0.5 * F, 0.62 * F)
  g.fill()
  g.stroke()
  g.beginPath()
  g.moveTo(px, py + 0.12 * F)
  g.lineTo(px + 0.5 * F, py + 0.12 * F)
  g.stroke()
  // Placket and buttons.
  g.strokeStyle = css(mix(pal.shirt, BLACK, 0.45), 0.9)
  g.lineWidth = Math.max(1, F * 0.02)
  g.beginPath()
  g.moveTo(cx + 0.02 * F, yc + 0.34 * F)
  g.lineTo(cx + 0.04 * F, H + 4)
  g.stroke()
  g.strokeStyle = css(mix(pal.shirt, WHITE, 0.2), 0.35)
  g.beginPath()
  g.moveTo(cx + 0.1 * F, yc + 0.34 * F)
  g.lineTo(cx + 0.12 * F, H + 4)
  g.stroke()
  for (let y = yc + 0.8 * F; y < H; y += 0.62 * F) {
    g.fillStyle = css(mix(pal.shirt, WHITE, 0.35))
    g.beginPath()
    g.arc(cx + 0.07 * F, y, F * 0.035, 0, Math.PI * 2)
    g.fill()
  }
  // Stains.
  splatter(g, rnd, cx - 1.3 * F, yc, 2.6 * F, H - yc, 22, sc, pal.blood)
  g.restore()

  // Sleeve hems.
  g.strokeStyle = css(mix(pal.shirt, BLACK, 0.6), 0.8)
  g.lineWidth = Math.max(1.2, F * 0.03)
  for (const side of [-1, 1]) {
    g.beginPath()
    g.moveTo(cx + side * 1.36 * F, yc + 1.28 * F)
    g.lineTo(cx + side * 1.0 * F, yc + 1.42 * F)
    g.stroke()
  }

  // Collar: two flaps over an undershirt V.
  g.fillStyle = css(mix(pal.shirt, WHITE, 0.5))
  g.beginPath()
  g.moveTo(cx - 0.3 * F, yc)
  g.quadraticCurveTo(cx, yc + 0.3 * F, cx + 0.3 * F, yc)
  g.lineTo(cx + 0.04 * F, yc + 0.46 * F)
  g.closePath()
  g.fill()
  for (const side of [-1, 1]) {
    g.fillStyle = css(mix(pal.shirt, WHITE, side < 0 ? 0.2 : 0.05))
    g.strokeStyle = css(mix(pal.shirt, BLACK, 0.5), 0.8)
    g.lineWidth = Math.max(1, F * 0.018)
    g.beginPath()
    g.moveTo(cx + side * 0.34 * F, yc - 0.04 * F)
    g.lineTo(cx + side * 0.04 * F, yc + 0.5 * F)
    g.lineTo(cx + side * 0.56 * F, yc + 0.4 * F)
    g.quadraticCurveTo(cx + side * 0.52 * F, yc + 0.12 * F, cx + side * 0.34 * F, yc - 0.04 * F)
    g.closePath()
    g.fill()
    g.stroke()
  }
  return c
}

function paintVignette(W: number, H: number, dpr: number) {
  const c = makeCanvas(W * dpr, H * dpr)
  const g = c.getContext("2d")
  if (!g) return c
  g.scale(dpr, dpr)
  const r = Math.hypot(W, H) * 0.62
  const v = g.createRadialGradient(W / 2, H * 0.45, r * 0.35, W / 2, H * 0.45, r)
  v.addColorStop(0, "rgba(0,0,0,0)")
  v.addColorStop(1, "rgba(0,0,0,0.55)")
  g.fillStyle = v
  g.fillRect(0, 0, W, H)
  const low = g.createLinearGradient(0, H * 0.7, 0, H)
  low.addColorStop(0, "rgba(0,0,0,0)")
  low.addColorStop(1, "rgba(0,0,0,0.35)")
  g.fillStyle = low
  g.fillRect(0, 0, W, H)
  return c
}

/** Holes punched out of the paint so it reads as dry-brushed on paper. */
function makeDryTile() {
  const size = 320
  const c = makeCanvas(size, size)
  const g = c.getContext("2d")
  if (!g) return c
  const rnd = mulberry32(1234)
  g.lineCap = "round"
  // Paper tooth: dense specks where the paint skipped the grain.
  for (let i = 0; i < 5200; i++) {
    g.fillStyle = "rgba(0,0,0," + (0.15 + rnd() * 0.75) + ")"
    const r = 0.5 + rnd() * rnd() * 2.2
    g.beginPath()
    g.arc(rnd() * size, rnd() * size, r * 0.5, 0, Math.PI * 2)
    g.fill()
  }
  // Soft blotches where the load ran thin.
  for (let i = 0; i < 26; i++) {
    const x = rnd() * size
    const y = rnd() * size
    const r = 6 + rnd() * 22
    const b = g.createRadialGradient(x, y, 0, x, y, r)
    b.addColorStop(0, "rgba(0,0,0," + (0.08 + rnd() * 0.16) + ")")
    b.addColorStop(1, "rgba(0,0,0,0)")
    g.fillStyle = b
    g.fillRect(x - r, y - r, r * 2, r * 2)
  }
  return c
}

function makeNoiseTile(seed: number) {
  const size = 160
  const c = makeCanvas(size, size)
  const g = c.getContext("2d")
  if (!g) return c
  const img = g.createImageData(size, size)
  const rnd = mulberry32(seed)
  for (let i = 0; i < img.data.length; i += 4) {
    const v = rnd() < 0.5 ? 0 : 255
    img.data[i] = v
    img.data[i + 1] = v
    img.data[i + 2] = v
    img.data[i + 3] = Math.floor(rnd() * rnd() * 110)
  }
  g.putImageData(img, 0, 0)
  return c
}

// ---------------------------------------------------------------------------
// Arms and hands, drawn every frame because they move
// ---------------------------------------------------------------------------

const FINGERS: [number, number, number, number, number][] = [
  // angle (deg), length, width, base x, base y — in hand units, fingers pointing +x
  [-108, 0.56, 0.28, -0.08, -0.28],
  [-40, 0.7, 0.25, 0.3, -0.26],
  [-15, 0.8, 0.255, 0.44, -0.07],
  [8, 0.74, 0.24, 0.44, 0.13],
  [28, 0.58, 0.21, 0.34, 0.3],
]

function drawArm(g: CanvasRenderingContext2D, ex: number, ey: number, wx: number, wy: number, F: number, pal: Palette) {
  const dx = wx - ex
  const dy = wy - ey
  const l = Math.hypot(dx, dy) || 1
  const nx = -dy / l
  const ny = dx / l
  const w0 = F * 0.24
  const w1 = F * 0.15
  g.fillStyle = css(pal.skin)
  g.beginPath()
  g.moveTo(ex + nx * w0, ey + ny * w0)
  g.quadraticCurveTo((ex + wx) / 2 + nx * w0 * 1.05, (ey + wy) / 2 + ny * w0 * 1.05, wx + nx * w1, wy + ny * w1)
  g.lineTo(wx - nx * w1, wy - ny * w1)
  g.quadraticCurveTo((ex + wx) / 2 - nx * w0 * 0.9, (ey + wy) / 2 - ny * w0 * 0.9, ex - nx * w0, ey - ny * w0)
  g.closePath()
  g.fill()
  // Red rim along the top edge, where the field bounces back onto it.
  const top = ny < 0 ? 1 : -1
  g.strokeStyle = css(mix(pal.red, WHITE, 0.1), 0.35)
  g.lineWidth = Math.max(1, F * 0.025)
  g.beginPath()
  g.moveTo(ex + nx * w0 * top * 0.95, ey + ny * w0 * top * 0.95)
  g.quadraticCurveTo(
    (ex + wx) / 2 + nx * w0 * top,
    (ey + wy) / 2 + ny * w0 * top,
    wx + nx * w1 * top * 0.95,
    wy + ny * w1 * top * 0.95,
  )
  g.stroke()
}

function drawHand(g: CanvasRenderingContext2D, x: number, y: number, s: number, dir: number, lift: number, time: number, pal: Palette, seed: number) {
  g.save()
  g.translate(x, y)
  g.scale(dir, 1)
  g.rotate(-0.22 * lift + Math.sin(time * 1.3 + seed) * 0.015)
  g.lineCap = "round"
  const spreadF = 1 + 0.1 * lift
  const tips: [number, number, number, number][] = []
  const bones = FINGERS.map(([deg, len, w, bx, by], i) => {
    const a = ((deg * spreadF) * Math.PI) / 180
    const curl = ((i === 0 ? -8 : 12) * Math.PI) / 180
    const x0 = bx * s
    const y0 = by * s
    const x1 = x0 + Math.cos(a) * len * 0.55 * s
    const y1 = y0 + Math.sin(a) * len * 0.55 * s
    const x2 = x1 + Math.cos(a + curl) * len * 0.45 * s
    const y2 = y1 + Math.sin(a + curl) * len * 0.45 * s
    tips.push([x2, y2, w * s, a + curl])
    return [x0, y0, x1, y1, x2, y2, w * s]
  })
  // Rim first, nudged up, so the dark hand sits inside a thin red edge.
  for (const pass of [0, 1]) {
    const col = pass === 0 ? css(mix(pal.red, WHITE, 0.15), 0.45) : css(pal.skin)
    const grow = pass === 0 ? s * 0.035 : 0
    const oy = pass === 0 ? -s * 0.02 : 0
    g.strokeStyle = col
    g.fillStyle = col
    for (const [x0, y0, x1, y1, x2, y2, w] of bones) {
      g.lineWidth = w + grow
      g.beginPath()
      g.moveTo(x0, y0 + oy)
      g.lineTo(x1, y1 + oy)
      g.lineTo(x2, y2 + oy)
      g.stroke()
    }
    g.beginPath()
    g.ellipse(0.1 * s, oy + 0.02 * s, 0.52 * s + grow, 0.46 * s + grow, 0, 0, Math.PI * 2)
    g.fill()
    // Wrist.
    g.beginPath()
    g.ellipse(-0.42 * s, 0.08 * s + oy, 0.3 * s + grow, 0.22 * s + grow, 0.2, 0, Math.PI * 2)
    g.fill()
  }
  // The palm catches a little light.
  const palm = g.createRadialGradient(0.14 * s, 0.02 * s, 0, 0.14 * s, 0.02 * s, 0.46 * s)
  palm.addColorStop(0, css(mix(pal.skin, pal.red, 0.35), 0.8))
  palm.addColorStop(1, css(pal.skin, 0))
  g.fillStyle = palm
  g.beginPath()
  g.ellipse(0.12 * s, 0, 0.46 * s, 0.4 * s, 0, 0, Math.PI * 2)
  g.fill()
  // Crease lines.
  g.strokeStyle = css(pal.ink, 0.55)
  g.lineWidth = Math.max(0.8, s * 0.018)
  g.beginPath()
  g.moveTo(-0.2 * s, -0.12 * s)
  g.quadraticCurveTo(0.1 * s, 0.06 * s, 0.42 * s, -0.16 * s)
  g.moveTo(-0.18 * s, 0.1 * s)
  g.quadraticCurveTo(0.12 * s, 0.24 * s, 0.4 * s, 0.1 * s)
  g.stroke()
  // Pale fingertips, the detail that makes the poster's hands read as hands.
  for (const [tx, ty, w, a] of tips) {
    g.fillStyle = css(mix(pal.paint, pal.red, 0.35), 0.5)
    g.beginPath()
    g.ellipse(tx - Math.cos(a) * w * 0.12, ty - Math.sin(a) * w * 0.12, w * 0.36, w * 0.28, a, 0, Math.PI * 2)
    g.fill()
  }
  // Stains on the palm.
  const rnd = mulberry32(seed)
  splatter(g, rnd, -0.3 * s, -0.3 * s, 0.7 * s, 0.6 * s, 3, s / 160, pal.blood)
  g.restore()
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const SERIF = 'Didot, "Bodoni 72", "Playfair Display", Georgia, "Times New Roman", serif'

type Splat = { x: number; y: number; born: number; seed: number }

const CHIPS: [number, string][] = [
  [1, "six"],
  [2, "seven"],
  [4, "title"],
]

export default function SixSevenPoster({
  mode = "auto",
  first = "6",
  second = "7",
  title = "SIX SE7EN",
  captions = ["First, it was six.", "Then, it was seven."],
  cast = ["The Left Hand", "The Right Hand", "The Group Chat"],
  credit = "A film by nobody in particular",
  billing = "Seven Six Pictures presents · a two-hand production · a film about two numbers · starring the left hand · the right hand · and the group chat · music by the pause between them · edited by nobody · directed by the meme",
  release = "In cinemas 6.7",
  rating = "Not rated for sevens",
  red = "#d3141b",
  paint = "#f2eee8",
  ink = "#0f0808",
  shirt = "#7f93a4",
  grain = 0.14,
  duration = 11,
  hold = 3.5,
  loop = true,
  autoPlay = true,
  scrollLength = 4,
  height = "100svh",
  controls = true,
  parallax = true,
  onBeatChange,
  className = "",
}: SixSevenPosterProps) {
  const rootRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const topRef = useRef<HTMLDivElement>(null)
  const cap0Ref = useRef<HTMLDivElement>(null)
  const cap1Ref = useRef<HTMLDivElement>(null)
  const posterRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const [beat, setBeat] = useState(autoPlay || mode === "scroll" ? 0 : 4)
  const [playing, setPlaying] = useState(mode === "auto" && autoPlay)
  const [reduced, setReduced] = useState(false)

  const live = useRef({
    elapsed: autoPlay ? 0 : duration,
    playing: mode === "auto" && autoPlay,
    scrubbing: false,
    t: 0,
    kickL: 0,
    kickR: 0,
    hover: 0,
    px: 0,
    py: 0,
    tx: 0,
    ty: 0,
    splats: [] as Splat[],
    kick: () => {},
  })

  const cfg = useRef({ first, second, title, red, paint, ink, shirt, grain, duration, hold, loop, parallax, onBeatChange })
  cfg.current = { first, second, title, red, paint, ink, shirt, grain, duration, hold, loop, parallax, onBeatChange }

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const on = () => setReduced(mq.matches)
    on()
    mq.addEventListener("change", on)
    return () => mq.removeEventListener("change", on)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const stage = stageRef.current
    const root = rootRef.current
    if (!canvas || !stage || !root) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const L = live.current

    // Reduced motion rests on the finished poster instead of playing.
    if (reduced && mode === "auto") {
      L.elapsed = cfg.current.duration
      L.playing = false
      setPlaying(false)
    }

    let W = 0
    let H = 0
    let dpr = 1
    const layer = document.createElement("canvas")
    const lctx = layer.getContext("2d")
    const scratch = document.createElement("canvas")
    const sctx = scratch.getContext("2d")
    const dry = makeDryTile()
    const noise = [makeNoiseTile(1), makeNoiseTile(2), makeNoiseTile(3)]
    let dryPattern: CanvasPattern | null = null
    let field: HTMLCanvasElement | null = null
    let torso: HTMLCanvasElement | null = null
    let vignette: HTMLCanvasElement | null = null
    let cacheKey = ""
    let layerKey = ""
    let titleKey = ""
    let titleGlyphs: TitleGlyph[] = []
    let lastBeat = -1
    let lastBarT = -1
    let frameNo = 0

    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1)
      W = canvas.clientWidth
      H = canvas.clientHeight
      canvas.width = Math.max(1, Math.round(W * dpr))
      canvas.height = Math.max(1, Math.round(H * dpr))
      layer.width = canvas.width
      layer.height = canvas.height
      dryPattern = null
      cacheKey = ""
      layerKey = ""
      titleKey = ""
      kick()
    }

    let scrollT = 0
    const onScroll = () => {
      const r = root.getBoundingClientRect()
      scrollT = progressFrom(r.top, r.height, stage.offsetHeight)
      kick()
    }

    const render = (t: number, blackout: number, time: number) => {
      if (W < 2 || H < 2) return
      const C = cfg.current
      const pal: Palette = {
        red: parseHex(C.red),
        paint: parseHex(C.paint),
        ink: parseHex(C.ink),
        shirt: parseHex(C.shirt),
        skin: [0, 0, 0],
        blood: [0, 0, 0],
      }
      pal.skin = mix(pal.ink, pal.red, 0.16)
      pal.blood = mix(pal.red, pal.ink, 0.62)
      const lay = layoutFor(W, H)
      const key = W + "x" + H + "@" + dpr + C.red + C.shirt + C.ink
      if (key !== cacheKey) {
        cacheKey = key
        field = paintField(W, H, dpr, pal)
        torso = paintTorso(W, H, dpr, lay, pal)
        vignette = paintVignette(W, H, dpr)
      }
      const tk = W + "x" + H + C.title
      if (tk !== titleKey) {
        titleKey = tk
        titleGlyphs = layoutTitle(C.title, lay)
      }

      // Pointer, eased; kicks decay.
      const still = reduced
      const ease = still ? 1 : 0.07
      L.px += (L.tx - L.px) * ease
      L.py += (L.ty - L.py) * ease
      L.kickL *= still ? 0 : 0.93
      L.kickR *= still ? 0 : 0.93
      const par = C.parallax && !still ? 1 : 0

      const lifts = handLift(t)
      const hoverL = L.hover < 0 ? 0.14 : 0
      const hoverR = L.hover > 0 ? 0.14 : 0
      const bob = still ? 0 : 0.035
      const liftL = Math.min(1.3, lifts.left + L.kickL * 0.7 + hoverL + Math.sin(time * 1.4) * bob)
      const liftR = Math.min(1.3, lifts.right + L.kickR * 0.7 + hoverR + Math.sin(time * 1.4 + 2.1) * bob)
      const pa = paintAt(t)

      // Camera: push out of the intro, lean into each numeral, shake on the pump.
      const sixLean = smoothstep(0.12, 0.36, t) * (1 - smoothstep(0.38, 0.46, t))
      const sevenLean = smoothstep(0.4, 0.62, t) * (1 - smoothstep(0.64, 0.7, t))
      const zoom = 1 + 0.06 * (1 - smoothstep(0, 0.14, t)) + 0.03 * (sixLean + sevenLean) + 0.015 * smoothstep(0.8, 1, t)
      const fx = lay.cx - W * 0.18 * sixLean + W * 0.18 * sevenLean
      const fy = H * 0.5
      const shakeAmp = still ? 0 : pumpEnvelope(t) * lay.F * 0.035 + flashAt(t) * lay.F * 0.05
      const shx = Math.sin(t * 2900) * shakeAmp
      const shy = Math.cos(t * 2300) * shakeAmp
      const cam = (depth: number) => {
        const ox = fx * (1 - zoom) + shx + L.px * lay.F * 0.14 * depth * par
        const oy = fy * (1 - zoom) + shy + L.py * lay.F * 0.08 * depth * par
        return [zoom, ox, oy]
      }
      const setCam = (depth: number) => {
        const [z, ox, oy] = cam(depth)
        ctx.setTransform(dpr * z, 0, 0, dpr * z, dpr * ox, dpr * oy)
      }
      const blitCam = (img: HTMLCanvasElement, depth: number, x = 0, y = 0) => {
        const [z, ox, oy] = cam(depth)
        ctx.setTransform(z, 0, 0, z, dpr * ox, dpr * oy)
        ctx.drawImage(img, x * dpr, y * dpr)
      }

      const intro = smoothstep(0, 0.07, t)
      const flicker = t < 0.1 && !still ? 0.82 + 0.18 * Math.sin(t * 420) * Math.sin(t * 131) : 1
      const figure = smoothstep(0.02, 0.1, t)

      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.globalCompositeOperation = "source-over"
      ctx.globalAlpha = 1
      ctx.fillStyle = css(pal.ink)
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // 1. Field.
      if (field) {
        ctx.globalAlpha = intro * flicker
        blitCam(field, -0.5, -W * 0.06, -H * 0.06)
      }

      // 2. Ghost numerals, behind the figure, once the title takes over.
      if (pa.ghost > 0.002) {
        setCam(-0.3)
        ctx.fillStyle = css(mix(pal.red, pal.ink, 0.45))
        ctx.strokeStyle = ctx.fillStyle
        const gh = lay.numeralH * 1.3
        const k = gh / 100
        const gSpread = lay.portrait ? 1.05 : 1.15
        paintGlyph(ctx, C.first, { x: lay.cx - (lay.cx - lay.sixX) * gSpread, y: H * 0.5, k, sy: 1, skew: 0.12, rot: -0.06 }, 1, pa.ghost * 0.6, 61, 14, 1)
        paintGlyph(ctx, C.second, { x: lay.cx + (lay.sevenX - lay.cx) * gSpread, y: H * 0.5, k, sy: 1, skew: 0.12, rot: 0.05 }, 1, pa.ghost * 0.6, 67, 14, 1)
      }

      // 3. Figure: arms go behind the torso, hands in front of the field.
      ctx.globalAlpha = figure
      setCam(0.35)
      const F = lay.F
      const hs = F * 0.72
      const handLY = lay.handY - liftL * F * 0.95
      const handRY = lay.handY - liftR * F * 0.95
      const handLX = lay.cx - lay.spread
      const handRX = lay.cx + lay.spread
      const elbowY = lay.collarY + F * 2.75
      drawArm(ctx, lay.cx - 0.7 * F, elbowY, handLX + 0.42 * hs, handLY + 0.08 * hs, F, pal)
      drawArm(ctx, lay.cx + 0.7 * F, elbowY, handRX - 0.42 * hs, handRY + 0.08 * hs, F, pal)
      if (torso) blitCam(torso, 0.35)
      setCam(0.35)
      ctx.globalAlpha = figure
      drawHand(ctx, handLX, handLY, hs, -1, liftL, still ? 0 : time, pal, 11)
      drawHand(ctx, handRX, handRY, hs, 1, liftR, still ? 0 : time + 1.7, pal, 23)
      ctx.globalAlpha = 1

      // 4. Paint. Redrawn only when something about it changed; texture after.
      const boostL = Math.min(1, L.kickL)
      const boostR = Math.min(1, L.kickR)
      const a6 = Math.min(1, pa.sixAlpha + boostL * 0.6 * (pa.six > 0.99 ? 1 : 0))
      const a7 = Math.min(1, pa.sevenAlpha + boostR * 0.6 * (pa.seven > 0.99 ? 1 : 0))
      const q = (v: number) => Math.round(v * 400)
      const lk = [W, H, dpr, C.paint, C.first, C.second, C.title, q(pa.six), q(pa.seven), q(a6), q(a7), q(pa.title), q(boostL), q(boostR)].join("|")
      if (lctx && lk !== layerKey) {
        layerKey = lk
        lctx.setTransform(1, 0, 0, 1, 0, 0)
        lctx.globalCompositeOperation = "source-over"
        lctx.clearRect(0, 0, layer.width, layer.height)
        lctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        lctx.fillStyle = css(pal.paint)
        lctx.strokeStyle = lctx.fillStyle
        // Each numeral is painted at full strength on a scratch canvas and
        // landed with one alpha: dimming per bristle would show every overlap
        // between bristles as a stripe.
        const k = lay.numeralH / 100
        const box = lay.numeralH * 1.5
        const sw = Math.ceil(box * dpr)
        if (scratch.width !== sw) {
          scratch.width = sw
          scratch.height = sw
        }
        const numerals: [string, number, number, number, number, number][] = [
          [C.first, lay.sixX, pa.six, a6, boostL, -0.07],
          [C.second, lay.sevenX, pa.seven, a7, boostR, 0.05],
        ]
        numerals.forEach(([ch, nx, rev, alpha, boost, rot], i) => {
          if (!sctx || rev <= 0 || alpha <= 0.002) return
          sctx.setTransform(1, 0, 0, 1, 0, 0)
          sctx.clearRect(0, 0, sw, sw)
          sctx.setTransform(dpr, 0, 0, dpr, 0, 0)
          sctx.fillStyle = css(pal.paint)
          sctx.strokeStyle = sctx.fillStyle
          paintGlyph(sctx, ch, { x: box / 2, y: box / 2, k: k * (1 + boost * 0.05), sy: 1, skew: 0.14, rot }, rev, 1, 3 + i * 2, 26, 1.4)
          lctx.setTransform(1, 0, 0, 1, 0, 0)
          lctx.globalAlpha = alpha
          lctx.drawImage(scratch, (nx - box / 2) * dpr, (lay.numeralY - box / 2) * dpr, sw, sw)
          lctx.globalAlpha = 1
        })
        lctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        const n = titleGlyphs.length
        for (let i = 0; i < n; i++) {
          const start = (i / Math.max(1, n)) * 0.7
          const r = clamp01((pa.title - start) / 0.3)
          const tg = titleGlyphs[i]
          paintGlyph(lctx, tg.ch, tg.pose, r, 1, tg.seed, 18, 1.35)
        }
        if (!dryPattern) dryPattern = lctx.createPattern(dry, "repeat")
        if (dryPattern) {
          lctx.setTransform(1, 0, 0, 1, 0, 0)
          lctx.globalCompositeOperation = "destination-out"
          lctx.fillStyle = dryPattern
          lctx.globalAlpha = 0.9
          lctx.fillRect(0, 0, layer.width, layer.height)
          lctx.globalAlpha = 1
          lctx.globalCompositeOperation = "source-over"
        }
      }
      ctx.globalAlpha = 1
      blitCam(layer, 0.9)

      // 5. Paint flicked at the stage by a click, in screen space.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      if (L.splats.length) {
        ctx.fillStyle = css(pal.paint)
        L.splats = L.splats.filter((sp) => time - sp.born < 2.4)
        for (const sp of L.splats) {
          const age = time - sp.born
          const out = 1 - Math.pow(1 - clamp01(age / 0.18), 3)
          ctx.globalAlpha = 1 - smoothstep(1.2, 2.4, age)
          const rnd = mulberry32(sp.seed)
          const R = lay.F * 0.9
          for (let i = 0; i < 30; i++) {
            const a = rnd() * Math.PI * 2
            const d = Math.pow(rnd(), 0.7) * R * out
            const r = lay.F * (0.008 + Math.pow(rnd(), 3) * 0.06)
            ctx.beginPath()
            ctx.ellipse(sp.x + Math.cos(a) * d, sp.y + Math.sin(a) * d, r * (1 + rnd() * 2), r, a, 0, Math.PI * 2)
            ctx.fill()
          }
          ctx.beginPath()
          ctx.arc(sp.x, sp.y, lay.F * 0.07 * out, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.globalAlpha = 1
      }

      // 6. The cut: a white-hot frame.
      const fl = still ? 0 : flashAt(t)
      if (fl > 0) {
        ctx.globalCompositeOperation = "lighter"
        ctx.fillStyle = css(mix(pal.paint, pal.red, 0.25), fl * 0.55)
        ctx.fillRect(0, 0, W, H)
        ctx.globalCompositeOperation = "source-over"
      }

      // 7. Vignette, grain, and the blackout between loops.
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      if (vignette) ctx.drawImage(vignette, 0, 0)
      if (C.grain > 0) {
        frameNo++
        const tile = noise[frameNo % noise.length]
        const pat = ctx.createPattern(tile, "repeat")
        if (pat) {
          const ox = still ? 0 : Math.floor(((frameNo * 73) % 160))
          const oy = still ? 0 : Math.floor(((frameNo * 131) % 160))
          ctx.save()
          ctx.translate(-ox, -oy)
          ctx.globalAlpha = Math.min(1, C.grain * 3)
          ctx.fillStyle = pat
          ctx.fillRect(0, 0, canvas.width + ox, canvas.height + oy)
          ctx.restore()
          ctx.globalAlpha = 1
        }
      }
      const dark = Math.max(1 - intro, blackout)
      if (dark > 0.001) {
        ctx.fillStyle = css(pal.ink, dark)
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }

      // DOM type, written directly — React only hears about beat changes.
      const lit = 1 - blackout
      const set = (el: HTMLElement | null, o: number, y = 0) => {
        if (!el) return
        el.style.opacity = String(Math.round(o * 1000) / 1000)
        el.style.transform = y ? "translateY(" + y.toFixed(1) + "px)" : ""
      }
      set(topRef.current, smoothstep(0.03, 0.1, t) * lit)
      const c0 = smoothstep(0.15, 0.19, t) * (1 - smoothstep(0.34, 0.38, t))
      const c1 = smoothstep(0.43, 0.47, t) * (1 - smoothstep(0.61, 0.65, t))
      set(cap0Ref.current, c0 * lit, (1 - c0) * 10)
      set(cap1Ref.current, c1 * lit, (1 - c1) * 10)
      set(posterRef.current, pa.poster * lit, (1 - pa.poster) * 12)
      if (barRef.current && Math.abs(t - lastBarT) > 0.0005) {
        lastBarT = t
        barRef.current.style.transform = "scaleX(" + t.toFixed(4) + ")"
      }
      const bi = beatIndex(t)
      if (bi !== lastBeat) {
        lastBeat = bi
        setBeat(bi)
        C.onBeatChange?.(BEATS[bi] as SixSevenBeat)
      }
    }

    let raf = 0
    let last = performance.now()
    let visible = true
    let doneNotified = false

    const frame = (now: number) => {
      raf = 0
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now
      const C = cfg.current
      let t = 0
      let blackout = 0
      if (mode === "scroll") {
        // A short rest at the bottom so the finished poster is not a single pixel of scroll.
        t = clamp01(scrollT * 1.06)
      } else {
        if (L.playing && !L.scrubbing && !reduced) L.elapsed += dt
        const f = autoFrame(L.elapsed, C.duration, C.hold, C.loop)
        t = f.t
        blackout = f.blackout
        if (!C.loop && L.playing && L.elapsed >= C.duration + C.hold) {
          if (!doneNotified) {
            doneNotified = true
            L.playing = false
            setPlaying(false)
          }
        } else doneNotified = false
      }
      L.t = t
      render(t, blackout, now / 1000)
      if (!reduced && visible) raf = requestAnimationFrame(frame)
    }

    function kick() {
      if (!raf) {
        last = performance.now()
        raf = requestAnimationFrame(frame)
      }
    }
    L.kick = kick

    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    resize()

    const io = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? true
        if (visible) kick()
      },
      { rootMargin: "120px" },
    )
    io.observe(stage)

    if (mode === "scroll") {
      window.addEventListener("scroll", onScroll, { passive: true })
      window.addEventListener("resize", onScroll, { passive: true })
      onScroll()
    }
    kick()

    return () => {
      cancelAnimationFrame(raf)
      raf = 0
      observer.disconnect()
      io.disconnect()
      L.kick = () => {}
      if (mode === "scroll") {
        window.removeEventListener("scroll", onScroll)
        window.removeEventListener("resize", onScroll)
      }
    }
  }, [mode, reduced])

  // ---- interaction ---------------------------------------------------------

  const setPlay = (v: boolean) => {
    const L = live.current
    if (v && L.elapsed >= duration) L.elapsed = 0
    L.playing = v
    setPlaying(v)
    L.kick()
  }

  const replay = () => {
    const L = live.current
    L.elapsed = reduced ? duration : 0
    L.playing = !reduced
    setPlaying(!reduced)
    L.kick()
  }

  const jumpTo = (bi: number) => {
    const L = live.current
    if (mode === "scroll") {
      const root = rootRef.current
      const stage = stageRef.current
      if (!root || !stage) return
      const r = root.getBoundingClientRect()
      const travel = root.offsetHeight - stage.offsetHeight
      const target = (BEAT_HOLD[bi] / 1.06) * travel
      window.scrollBy({ top: r.top + target, behavior: reduced ? "auto" : "smooth" })
      return
    }
    L.elapsed = (reduced || !L.playing ? BEAT_HOLD[bi] : BEAT_START[bi]) * duration
    L.kick()
  }

  const onStagePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const L = live.current
    L.tx = ((e.clientX - r.left) / r.width) * 2 - 1
    L.ty = ((e.clientY - r.top) / r.height) * 2 - 1
    L.hover = parallax && !reduced ? (L.tx < -0.25 ? -1 : L.tx > 0.25 ? 1 : 0) : 0
  }

  const onStagePointerLeave = () => {
    const L = live.current
    L.tx = 0
    L.ty = 0
    L.hover = 0
  }

  const onStagePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button,[data-scrub]")) return
    const r = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - r.left
    const L = live.current
    if (x < r.width / 2) L.kickL = 1
    else L.kickR = 1
    if (!reduced) L.splats.push({ x, y: e.clientY - r.top, born: performance.now() / 1000, seed: (Math.random() * 1e9) | 0 })
    L.kick()
  }

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const L = live.current
    const k = e.key.toLowerCase()
    if (k === "6") L.kickL = 1
    else if (k === "7") L.kickR = 1
    else if (mode === "auto" && (k === " " || k === "k")) setPlay(!L.playing)
    else if (mode === "auto" && k === "r") replay()
    else if (k === "arrowright" || k === "arrowleft") {
      const cur = beatIndex(L.t)
      const order = CHIPS.map((c) => c[0])
      const next =
        k === "arrowright" ? order.find((b) => b > cur) ?? order[order.length - 1] : [...order].reverse().find((b) => b < cur) ?? order[0]
      jumpTo(next)
    } else return
    e.preventDefault()
    L.kick()
  }

  const scrubFrom = (e: ReactPointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const L = live.current
    L.elapsed = clamp01((e.clientX - r.left) / r.width) * duration
    L.kick()
  }

  // ---- markup ----------------------------------------------------------------

  const tagline = captions.join(" ")
  const bone = paint
  const track = { fontFamily: SERIF, color: bone, textShadow: "0 1px 12px rgba(0,0,0,0.35)" }
  const rootHeight = mode === "scroll" ? "calc(" + height + " * " + Math.max(1.5, scrollLength) + ")" : height

  return (
    <section
      ref={rootRef}
      className={"relative w-full " + className}
      style={{ height: rootHeight, background: ink }}
      aria-label={"Six Seven poster: " + title}
    >
      <div
        ref={stageRef}
        className={(mode === "scroll" ? "sticky top-0 " : "relative ") + "w-full select-none overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-inset"}
        style={{ height, touchAction: "pan-y", cursor: "crosshair" }}
        tabIndex={0}
        aria-label={"Interactive poster. Click or press 6 and 7 to raise a hand." + (mode === "auto" ? " Space to pause, R to replay, arrow keys to change beat." : " Arrow keys change beat.")}
        onPointerMove={onStagePointerMove}
        onPointerLeave={onStagePointerLeave}
        onPointerDown={onStagePointerDown}
        onKeyDown={onKeyDown}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 block"
          style={{ width: "100%", height: "100%", maxWidth: "none" }}
          aria-hidden="true"
        />

        {/* Billing, top corners. */}
        <div ref={topRef} className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between px-4 pt-4 sm:px-8 sm:pt-7" style={{ ...track, opacity: 0 }} aria-hidden="true">
          <div className="flex flex-col gap-2 sm:gap-3">
            {cast.map((name) => (
              <div key={name} className="text-[9px] leading-[1.15] uppercase sm:text-[12px]" style={{ letterSpacing: "0.16em" }}>
                {name.split(" ").map((w, i) => (
                  <div key={i}>{w}</div>
                ))}
              </div>
            ))}
          </div>
          <div className="max-w-[45%] text-right text-[9px] uppercase sm:text-[12px]" style={{ letterSpacing: "0.16em" }}>
            {credit}
          </div>
        </div>

        {/* One line per beat. */}
        {[cap0Ref, cap1Ref].map((ref, i) => (
          <div
            key={i}
            ref={ref}
            className="pointer-events-none absolute inset-x-0 bottom-[16%] px-6 text-center text-[15px] uppercase sm:text-[22px]"
            style={{ ...track, opacity: 0, letterSpacing: "0.3em" }}
            aria-hidden="true"
          >
            {captions[i]}
          </div>
        ))}

        {/* The finished one-sheet's small print. */}
        <div
          ref={posterRef}
          className={"pointer-events-none absolute inset-x-0 flex flex-col items-center gap-1.5 px-5 text-center sm:gap-2 " + (controls ? "bottom-[4.75rem] sm:bottom-16" : "bottom-5 sm:bottom-8")}
          style={{ ...track, opacity: 0 }}
          aria-hidden="true"
        >
          <div className="text-[10px] uppercase sm:text-[14px]" style={{ letterSpacing: "0.22em" }}>
            {tagline}
          </div>
          <div className="hidden max-w-[62ch] text-[8px] leading-[1.5] uppercase opacity-80 sm:block" style={{ letterSpacing: "0.14em", transform: "scaleY(1.25)" }}>
            {billing}
          </div>
          <div className="text-[13px] uppercase sm:text-[19px]" style={{ letterSpacing: "0.26em" }}>
            {release}
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-[7px] uppercase sm:text-[8px]" style={{ letterSpacing: "0.18em" }}>
            <span className="flex items-stretch border" style={{ borderColor: bone }}>
              <span className="px-1.5 py-0.5 text-[10px] font-bold sm:text-[12px]" style={{ background: bone, color: red, fontFamily: "Georgia, serif" }}>
                {first}
                {second}
              </span>
              <span className="flex items-center px-1.5">{rating}</span>
            </span>
          </div>
        </div>

        {controls && (
          <div className="absolute inset-x-0 bottom-0 px-4 pb-3 sm:px-8 sm:pb-4" style={{ color: bone }}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5" role="group" aria-label="Beats">
                {CHIPS.map(([bi, label]) => {
                  const on = beat === bi || (bi === 2 && beat === 3)
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => jumpTo(bi)}
                      aria-pressed={on}
                      aria-label={"Go to " + label}
                      className="grid h-7 min-w-7 place-items-center rounded-full border px-2 text-[11px] uppercase transition-colors duration-200 motion-reduce:transition-none"
                      style={{
                        fontFamily: SERIF,
                        letterSpacing: "0.12em",
                        borderColor: on ? bone : "rgba(255,255,255,0.35)",
                        background: on ? bone : "rgba(0,0,0,0.18)",
                        color: on ? red : bone,
                      }}
                    >
                      {bi === 1 ? first : bi === 2 ? second : "Title"}
                    </button>
                  )
                })}
              </div>
              {mode === "auto" && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPlay(!playing)}
                    aria-label={playing ? "Pause" : "Play"}
                    className="grid h-7 w-7 place-items-center rounded-full border transition-opacity hover:opacity-80"
                    style={{ borderColor: "rgba(255,255,255,0.35)", background: "rgba(0,0,0,0.18)" }}
                  >
                    {playing ? (
                      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
                        <rect x="1.5" y="1" width="2.4" height="8" fill="currentColor" />
                        <rect x="6.1" y="1" width="2.4" height="8" fill="currentColor" />
                      </svg>
                    ) : (
                      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
                        <path d="M2 1 L9 5 L2 9 Z" fill="currentColor" />
                      </svg>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={replay}
                    aria-label="Replay"
                    className="grid h-7 w-7 place-items-center rounded-full border transition-opacity hover:opacity-80"
                    style={{ borderColor: "rgba(255,255,255,0.35)", background: "rgba(0,0,0,0.18)" }}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                      <path d="M2.2 6a3.8 3.8 0 1 0 1.2-2.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                      <path d="M2.2 1.4v2.3h2.3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
            <div
              data-scrub=""
              className={"relative mt-2.5 h-3 " + (mode === "auto" ? "cursor-pointer" : "pointer-events-none")}
              onPointerDown={(e) => {
                if (mode !== "auto") return
                e.currentTarget.setPointerCapture(e.pointerId)
                live.current.scrubbing = true
                scrubFrom(e)
              }}
              onPointerMove={(e) => {
                if (live.current.scrubbing) scrubFrom(e)
              }}
              onPointerUp={() => {
                live.current.scrubbing = false
              }}
              onPointerCancel={() => {
                live.current.scrubbing = false
              }}
              aria-hidden="true"
            >
              <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2" style={{ background: "rgba(255,255,255,0.22)" }} />
              <div ref={barRef} className="absolute inset-x-0 top-1/2 h-[2px] origin-left -translate-y-1/2" style={{ background: bone, transform: "scaleX(0)" }} />
            </div>
          </div>
        )}
      </div>

      <div className="sr-only">
        <p>{cast.join(", ")}. {credit}.</p>
        <p>{captions[0]}</p>
        <p>{captions[1]}</p>
        <p>{title}</p>
        <p>{release}. {rating}.</p>
      </div>
    </section>
  )
}
