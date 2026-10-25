"use client"

// Peacock Train Preloader — a loading screen painted in watercolour. A small
// cobalt peacock stands at the foot of a circle of clean paper with its train
// folded down behind it. As the page loads the train rises and spreads, row by
// row: a dark serrated collar round the circle, scalloped feathers that warm
// from teal to chartreuse, and an outer halo of pale washes dipped in blue that
// dissolves into the paper. Gold glitter in the pigment catches the light.
//
// At 100 the bird rattles its train — a quick shiver that sets every fleck of
// glitter alight — then the train rushes toward the viewer and the clean circle
// at its centre becomes the window the page arrives through.
//
// While it waits the train breathes and sways, its rows drift in parallax with
// the pointer, and the glitter under the pointer sparkles.
//
// One file, React only. Every feather and the bird are painted once onto
// offscreen canvases with layered, deformed watercolour washes (the polygon
// technique), dry-brush streaks, granulation and glitter, then composed every
// frame onto one 2D canvas. Every rule in the scoped <style> is .ppl- prefixed.
// Nothing is fetched.

import * as React from "react"

export type PeacockTrainPreset = "ivory" | "midnight" | "opal"
export type PeacockTrainDensity = "sparse" | "full" | "lush"

export interface PeacockTrainPalette {
  /** The paper behind everything. */
  paper: string
  /** Type colour. */
  ink: string
  /** Warm centre of the scalloped feathers (chartreuse in the ivory preset). */
  core: string
  /** The green body of the inner feathers. */
  body: string
  /** The bright band inside each feather's rim. */
  rim: string
  /** The rim itself. */
  edge: string
  /** Pigment pooled at the tips and round the circle. */
  tip: string
  /** Body of the pale outer halo feathers. */
  halo: string
  /** The colour the halo feathers are dipped in. */
  haloRim: string
  /** Glitter in the pigment. */
  glitter: string
  /** The bird's neck, head and crest. */
  bird: string
  /** A second accent: coral feathers and eye rings in the ornamental preset. */
  accent: string
  /** Light in the clean circle. */
  glow: string
}

export interface PeacockTrainPreloaderProps {
  /** Revealed through the circle once the gate opens. Ignored while `loop` is set. */
  children?: React.ReactNode
  /** Showcase mode: opens, rattles, zooms through, greets, and replays forever. */
  loop?: boolean
  /** Real loading progress, 0–100. Leave undefined to simulate a load over `durationMs`. */
  progress?: number
  /** Length of the simulated load. Defaults to 6000ms. */
  durationMs?: number
  /** Colour preset. */
  preset?: PeacockTrainPreset
  /** Colour overrides, merged over the preset. */
  palette?: { [K in keyof PeacockTrainPalette]?: string }
  /** Eye-spots and beads on the feathers. Defaults on for "opal", off otherwise. */
  ornament?: boolean
  /** How many feathers the train carries. */
  density?: PeacockTrainDensity
  /** Degrees the train spans round the circle, 120–340. Defaults to 300. */
  spread?: number
  /** Reshuffles the painting's small irregularities. */
  seed?: number
  /** The wordmark under the train. */
  title?: string
  /** Letter-spaced line under the wordmark. */
  subtitle?: string
  /** Small lines above the wordmark. */
  meta?: string[]
  /** The signature line at the foot. "" hides it. */
  signature?: string
  /** Greeting shown after the gate in `loop` mode. "" skips it. */
  message?: string
  /** Show the corner label and the counter. */
  hud?: boolean
  /** Accessible name of the progress bar, also the corner label. */
  label?: string
  /** Face for the wordmark and the greeting. The default stack fetches nothing. */
  serifFamily?: string
  /** Face for the small type. */
  monoFamily?: string
  /** Root height while loading. A definite length, never a percentage. */
  height?: string
  /** Fired once, after the gate has opened. */
  onComplete?: () => void
  /** Extra root class names. */
  className?: string
}

const PRESETS: { [k: string]: PeacockTrainPalette } = {
  ivory: {
    paper: "#f5f1e7",
    ink: "#141c2b",
    core: "#dfe35b",
    body: "#3fae6a",
    rim: "#2db4d8",
    edge: "#1d5cd2",
    tip: "#0b2687",
    halo: "#f8f3d2",
    haloRim: "#78b4ec",
    glitter: "#e8bd52",
    bird: "#1b4cc0",
    accent: "#3aa8c8",
    glow: "#ffffff",
  },
  midnight: {
    paper: "#0a1222",
    ink: "#e8ecf5",
    core: "#d4e46c",
    body: "#2fb594",
    rim: "#3fc6e8",
    edge: "#4a78f5",
    tip: "#93adff",
    halo: "#c4d0f2",
    haloRim: "#6f9cff",
    glitter: "#ffd776",
    bird: "#4b86f7",
    accent: "#c08cff",
    glow: "#7fb0ff",
  },
  opal: {
    paper: "#f3f2f5",
    ink: "#2a2c3b",
    core: "#fbe6a2",
    body: "#5ecab9",
    rim: "#9481f0",
    edge: "#5b47cf",
    tip: "#2c217e",
    halo: "#e3f3f6",
    haloRim: "#78c3ea",
    glitter: "#f0b465",
    bird: "#4777d4",
    accent: "#f2916c",
    glow: "#ffffff",
  },
}

const SERIF_STACK = '"Bodoni Moda", "Didot", "Bodoni 72", "Playfair Display", "Libre Bodoni", Georgia, "Times New Roman", serif'
const MONO_STACK = '"JetBrains Mono", "SF Mono", "Fira Code", Menlo, Consolas, monospace'

const HOLD_MS = 1500
const GATE_MS = 1500
const AFTER_MS = 2600

// #region train
// Pure helpers, lifted out and executed by tests/peacock-train-preloader.test.mjs.

const clamp01 = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x)

/** Seeded so every mount paints the same train. */
export function pplRng(seed: number) {
  let s = (Math.floor(seed) || 1) >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Smoothstep between a and b. */
export function pplSmooth(a: number, b: number, x: number) {
  const t = clamp01((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}

export function pplOutQuart(t: number) {
  const u = 1 - clamp01(t)
  return 1 - u * u * u * u
}

// The simulated load surges and stalls like a real one. [time, progress] knots.
const KNOTS = [
  [0, 0],
  [0.14, 0.17],
  [0.3, 0.36],
  [0.4, 0.39],
  [0.66, 0.74],
  [0.78, 0.78],
  [1, 1],
]

/** Simulated progress 0–100 at normalised time t. Monotonic. */
export function pplSimulated(t: number) {
  if (t <= 0) return 0
  if (t >= 1) return 100
  for (let i = 0; i < KNOTS.length - 1; i++) {
    const a = KNOTS[i]
    const b = KNOTS[i + 1]
    if (t <= b[0]) {
      const local = (t - a[0]) / (b[0] - a[0])
      const eased = 1 - Math.pow(1 - local, 3)
      return (a[1] + (b[1] - a[1]) * eased) * 100
    }
  }
  return 100
}

/**
 * The rows of the train, inside out, in units of the clean circle's radius:
 * where each row's quills sit, how long its feathers are, and what kind of
 * feather it carries. Two serrated collar rows, four scalloped rows, two rows
 * of pale halo feathers.
 */
const ROWS = [
  { base: 0.9, len: 0.44, kind: "collar", aspect: 0.36 },
  { base: 1.06, len: 0.6, kind: "collar", aspect: 0.4 },
  { base: 1.3, len: 0.78, kind: "scallop", aspect: 0.5 },
  { base: 1.64, len: 1.0, kind: "scallop", aspect: 0.52 },
  { base: 2.08, len: 1.24, kind: "scallop", aspect: 0.54 },
  { base: 2.62, len: 1.5, kind: "scallop", aspect: 0.54 },
  { base: 3.24, len: 1.78, kind: "halo", aspect: 0.46 },
  { base: 3.9, len: 1.95, kind: "halo", aspect: 0.42 },
]

/** The train's furthest reach, in units of the circle's radius. */
export const PPL_REACH = ROWS[ROWS.length - 1].base + ROWS[ROWS.length - 1].len

export interface PplRow {
  base: number
  len: number
  kind: string
  /** Feathers in the row. */
  count: number
  /** Half width of one feather at its widest. */
  half: number
}

/** Row geometry for a density and a spread. Denser trains carry narrower, more numerous feathers. */
export function pplRows(density: string, spread: number) {
  const s = Math.max(120, Math.min(340, spread || 300))
  const k = density === "sparse" ? 1.32 : density === "lush" ? 0.78 : 1
  const out: PplRow[] = []
  for (const r of ROWS) {
    const arc = (Math.PI * 2 * (r.base + r.len * 0.6) * s) / 360
    const count = Math.max(5, Math.round(arc / (r.len * r.aspect * k)) + 1)
    out.push({ base: r.base, len: r.len, kind: r.kind, count, half: (arc / (count - 1)) * 0.5 * 1.38 })
  }
  return out
}

/** How far row `row` of `rows` has opened at progress p (0–1). Inner rows lead. */
export function pplOpen(p: number, row: number, rows: number) {
  const n = Math.max(1, rows)
  const width = 0.4
  const start = n > 1 ? ((1 - width) * Math.max(0, Math.min(n - 1, row))) / (n - 1) : 0
  return pplSmooth(start, start + width, p)
}

export interface PplFeather {
  /** Row index, 0 at the circle. */
  row: number
  /** Resting angle, degrees, 0 straight up, clockwise positive. */
  theta: number
  /** Length, in units of the circle's radius. */
  len: number
  /** Which painted variant to use. */
  variant: number
  /** Sway phase. */
  phase: number
  /** Small resting lean, degrees. */
  tilt: number
  /** Mirrored for the left side so the train is symmetric. */
  mirror: boolean
}

/**
 * Lay out every feather: symmetric about straight-up, alternate rows offset by
 * half a feather like scales, sorted back to front (outer rows first, and within
 * a row the lowest feathers under the highest).
 */
export function pplBuild(rows: PplRow[], spread: number, seed: number) {
  const s = Math.max(120, Math.min(340, spread || 300))
  const out: PplFeather[] = []
  for (let r = 0; r < rows.length; r++) {
    const n = rows[r].count
    const step = s / (n - 1)
    const offset = r % 2 === 1
    const m = offset ? n - 1 : n
    for (let k = 0; k < m; k++) {
      const theta = -s / 2 + step * (k + (offset ? 0.5 : 0))
      // Traits come from the mirrored index, so both sides match.
      const j = Math.min(k, m - 1 - k)
      const rng = pplRng(seed * 7919 + r * 131 + j * 17 + 1)
      out.push({
        row: r,
        theta,
        len: rows[r].len * (0.96 + rng() * 0.08),
        variant: Math.floor(rng() * 3),
        phase: rng() * Math.PI * 2,
        tilt: (rng() - 0.5) * 2,
        mirror: theta < 0,
      })
    }
  }
  out.sort((a, b) => (a.row !== b.row ? b.row - a.row : Math.abs(b.theta) - Math.abs(a.theta)))
  return out
}

/**
 * The angle a feather sits at while the train rises: closed, every feather
 * hangs straight down behind the bird; open, it rests at its own angle.
 */
export function pplFan(theta: number, open: number) {
  const closed = theta < 0 ? -180 : 180
  return closed + (theta - closed) * pplOutQuart(open)
}

/** Shortest signed difference between two angles, degrees. */
export function pplAngleDiff(a: number, b: number) {
  let d = (a - b) % 360
  if (d > 180) d -= 360
  if (d <= -180) d += 360
  return d
}

/**
 * The gate: how far the train has rushed toward the viewer at t (0–1), as a
 * scale on the train, and the radius of the window cut in the paper. The
 * window ends past the viewport's corner so the paper leaves entirely.
 */
export function pplGate(t: number, r0: number, w: number, h: number) {
  const k = clamp01(t)
  const need = Math.hypot(w, h) * 0.56
  const top = Math.max(1.5, need / (r0 * 0.88))
  const e = k * k * (0.3 + 0.7 * k)
  const scale = 1 + (top - 1) * e
  return { scale, hole: r0 * scale * 0.88 }
}

/**
 * Watercolour edge: split every edge of a closed polygon and nudge the new
 * point by an amount scaled to the edge's length, `depth` times. Layering many
 * such deformations at low alpha is what makes a wash bleed.
 */
export function pplDeform(pts: number[][], depth: number, amp: number, rng: () => number) {
  let cur = pts
  for (let d = 0; d < depth; d++) {
    const next: number[][] = []
    for (let i = 0; i < cur.length; i++) {
      const a = cur[i]
      const b = cur[(i + 1) % cur.length]
      next.push(a)
      const len = Math.hypot(b[0] - a[0], b[1] - a[1])
      const g = (rng() + rng() + rng() - 1.5) * amp * len
      const ang = rng() * Math.PI * 2
      next.push([(a[0] + b[0]) / 2 + Math.cos(ang) * g, (a[1] + b[1]) / 2 + Math.sin(ang) * g])
    }
    cur = next
  }
  return cur
}

/** Hex (#rgb, #rrggbb) or rgb()/rgba() → [r, g, b], or a fallback. */
export function pplHex(color: string, fallback: number[]) {
  const s = (color || "").trim()
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(s)
  if (m) {
    const h = m[1].length === 3 ? m[1].split("").map((c) => c + c).join("") : m[1]
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
  }
  const r = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(s)
  if (r) return [+r[1], +r[2], +r[3]]
  return fallback
}

/** Mix two colours, t from a to b, returning rgb(). */
export function pplMix(a: string, b: string, t: number) {
  const x = pplHex(a, [128, 128, 128])
  const y = pplHex(b, [128, 128, 128])
  const k = clamp01(t)
  return "rgb(" + Math.round(x[0] + (y[0] - x[0]) * k) + "," + Math.round(x[1] + (y[1] - x[1]) * k) + "," + Math.round(x[2] + (y[2] - x[2]) * k) + ")"
}

/** A colour with alpha, as rgba(). */
export function pplRgba(color: string, alpha: number) {
  const c = pplHex(color, [128, 128, 128])
  return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + clamp01(alpha) + ")"
}

/** Perceived lightness 0–255, to pick type and shading against the paper. */
export function pplLuma(color: string) {
  const c = pplHex(color, [128, 128, 128])
  return c[0] * 0.299 + c[1] * 0.587 + c[2] * 0.114
}
// #endregion

// ---- painting --------------------------------------------------------------

interface Sprite {
  canvas: HTMLCanvasElement
  /** Sprite pixels per unit of the circle's radius. */
  px: number
  /** The quill's base (or the bird's circle centre), in sprite pixels. */
  ox: number
  oy: number
}

interface Look {
  kind: string
  rim: string
  band: string
  mid: string
  core: string
  tip: string
  tipAlpha: number
  glitter: number
  strands: boolean
  eye: boolean
  beads: boolean
}

/** A small tile of grey noise, multiplied over the washes for granulation. */
function paintNoise(rng: () => number) {
  const c = document.createElement("canvas")
  c.width = 128
  c.height = 128
  const ctx = c.getContext("2d")
  if (!ctx) return c
  const img = ctx.createImageData(128, 128)
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 175 + Math.floor(Math.pow(rng(), 0.7) * 80)
    img.data[i] = v
    img.data[i + 1] = v
    img.data[i + 2] = v
    img.data[i + 3] = 255
  }
  ctx.putImageData(img, 0, 0)
  return c
}

/**
 * A graded wash: deformed layers filled with an elliptical gradient centred at
 * (fx, fy) with radii (rx, ry), so the colour runs smoothly from the middle out
 * and only the outer edge bleeds.
 */
function gradWash(ctx: CanvasRenderingContext2D, base: number[][], rng: () => number, stops: (string | number)[][], alpha: number, layers: number, amp: number, fx: number, fy: number, rx: number, ry: number) {
  const k = rx / ry
  ctx.save()
  ctx.translate(fx, fy)
  ctx.scale(k, 1)
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, ry)
  for (const st of stops) g.addColorStop(st[0] as number, st[1] as string)
  ctx.fillStyle = g
  ctx.globalAlpha = alpha
  for (let l = 0; l < layers; l++) {
    const poly = pplDeform(base, 4, amp * (0.55 + rng() * 0.9), rng)
    ctx.beginPath()
    for (let i = 0; i < poly.length; i++) {
      const x = (poly[i][0] - fx) / k
      const y = poly[i][1] - fy
      if (i) ctx.lineTo(x, y)
      else ctx.moveTo(x, y)
    }
    ctx.closePath()
    ctx.fill()
  }
  ctx.restore()
  ctx.globalAlpha = 1
}

/** Fill `layers` deformations of a polygon at low alpha, scaled about (fx, fy): one watercolour wash. */
function wash(ctx: CanvasRenderingContext2D, base: number[][], rng: () => number, color: string, alpha: number, layers: number, amp: number, scale: number, fx: number, fy: number) {
  ctx.fillStyle = pplRgba(color, alpha)
  for (let l = 0; l < layers; l++) {
    const poly = pplDeform(base, 4, amp * (0.55 + rng() * 0.9), rng)
    ctx.beginPath()
    for (let i = 0; i < poly.length; i++) {
      const x = fx + (poly[i][0] - fx) * scale
      const y = fy + (poly[i][1] - fy) * scale
      if (i) ctx.lineTo(x, y)
      else ctx.moveTo(x, y)
    }
    ctx.closePath()
    ctx.fill()
  }
}

function tracePath(ctx: CanvasRenderingContext2D, pts: number[][]) {
  ctx.beginPath()
  for (let i = 0; i < pts.length; i++) {
    if (i) ctx.lineTo(pts[i][0], pts[i][1])
    else ctx.moveTo(pts[i][0], pts[i][1])
  }
  ctx.closePath()
}

/** A teardrop pointing up, centred at (x, y). */
function teardrop(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.beginPath()
  ctx.moveTo(x, y - h * 0.62)
  ctx.bezierCurveTo(x + w * 0.56, y - h * 0.22, x + w * 0.62, y + h * 0.38, x, y + h * 0.38)
  ctx.bezierCurveTo(x - w * 0.62, y + h * 0.38, x - w * 0.56, y - h * 0.22, x, y - h * 0.62)
  ctx.closePath()
}

/** The colours a row's feathers are painted in. */
function lookFor(kind: string, row: number, rows: number, c: PeacockTrainPalette, ornament: boolean, variant: number): Look {
  if (kind === "collar") {
    return {
      kind,
      rim: c.edge,
      band: pplMix(c.rim, c.body, 0.35),
      mid: c.body,
      core: pplMix(c.body, c.core, row === 0 ? 0.2 : 0.42),
      tip: c.tip,
      tipAlpha: 0.13,
      glitter: 0.3,
      strands: false,
      eye: false,
      beads: false,
    }
  }
  if (kind === "halo") {
    const coral = ornament && variant === 2
    return {
      kind,
      rim: coral ? c.accent : c.haloRim,
      band: pplMix(coral ? c.accent : c.haloRim, c.halo, 0.5),
      mid: c.halo,
      core: pplMix(c.halo, c.core, 0.32),
      tip: coral ? pplMix(c.accent, c.tip, 0.3) : c.edge,
      tipAlpha: 0.06,
      glitter: 0.9,
      strands: true,
      eye: false,
      beads: ornament,
    }
  }
  // Scalloped rows warm outward: the inner ones green, the outer ones chartreuse.
  const k = clamp01((row - 2) / Math.max(1, rows - 5))
  return {
    kind,
    rim: c.edge,
    band: c.rim,
    mid: pplMix(c.body, c.rim, 0.12 - k * 0.12),
    core: pplMix(c.body, c.core, 0.45 + 0.55 * k),
    tip: c.tip,
    tipAlpha: 0.12,
    glitter: 0.55 + 0.45 * k,
    strands: false,
    eye: ornament,
    beads: false,
  }
}

/** One feather, painted upright: quill at the bottom, tip at the top. */
function paintFeather(half: number, len: number, look: Look, c: PeacockTrainPalette, px: number, noise: HTMLCanvasElement, rng: () => number, dark: boolean): Sprite {
  const W = half * px
  const L = len * px
  const collar = look.kind === "collar"
  const halo = look.kind === "halo"
  const padX = Math.ceil(W * 0.45 + 6)
  const padTop = Math.ceil(halo ? L * 0.3 : L * 0.18 + 6)
  const padBot = Math.ceil(collar ? L * 0.35 : 6)
  const canvas = document.createElement("canvas")
  canvas.width = Math.ceil(W * 2 + padX * 2)
  canvas.height = Math.ceil(L + padTop + padBot)
  const ox = canvas.width / 2
  const oy = canvas.height - padBot
  const ctx = canvas.getContext("2d")
  if (!ctx) return { canvas, px, ox, oy }
  ctx.lineCap = "round"
  const lw = Math.max(0.5, px / 150)

  // Shape: narrow at the quill, widest past the middle, a soft ogive at the tip.
  const k1 = collar ? 1.2 : 1.4
  const k2 = collar ? 1.0 : 0.72
  const bow = (rng() - 0.5) * W * 0.3
  const sx = (u: number) => ox + bow * 4 * u * (1 - u)
  const sy = (u: number) => oy - L * u
  const hw = (u: number) => W * Math.pow(Math.max(0, Math.sin(Math.PI * Math.pow(clamp01(u), k1))), k2)
  const outline: number[][] = []
  const N = 20
  for (let i = 0; i <= N; i++) outline.push([sx(i / N) + hw(i / N), sy(i / N)])
  for (let i = N - 1; i >= 1; i--) outline.push([sx(i / N) - hw(i / N), sy(i / N)])
  const base = pplDeform(outline, 1, 0.08, rng)

  // The wash: warm core, through the body and the bright band, out to the rim.
  const a = dark ? 1.15 : 1
  const gx = sx(0.56)
  const gy = sy(0.56)
  const stops = halo
    ? [
        [0, pplRgba(look.core, 1)],
        [0.42, pplRgba(look.mid, 1)],
        [0.72, pplRgba(look.band, 1)],
        [1, pplRgba(look.rim, 1)],
      ]
    : [
        [0, pplRgba(look.core, 1)],
        [0.4, pplRgba(look.core, 1)],
        [0.6, pplRgba(look.mid, 1)],
        [0.78, pplRgba(look.band, 1)],
        [0.92, pplRgba(look.rim, 1)],
        [1, pplRgba(pplMix(look.rim, look.tip, 0.5), 1)],
      ]
  gradWash(ctx, base, rng, stops, (halo ? 0.085 : 0.1) * a, 11, 0.42, gx, gy, W * 1.02, L * 0.6)
  // A second, smaller bloom of the core colour, for depth.
  gradWash(ctx, base.map((p) => [gx + (p[0] - gx) * 0.62, gy + (p[1] - gy) * 0.6]), rng, [[0, pplRgba(look.core, 1)], [1, pplRgba(look.core, 0)]], 0.08 * a, 5, 0.5, gx, sy(0.6), W * 0.7, L * 0.38)
  // Pigment pooled at the tip, drawn out past it in a dark point: the crown
  // spikes that poke out between the feathers of the row beyond.
  const spike: number[][] = []
  const spikeW = W * (collar ? 0.26 : halo ? 0.07 : 0.17)
  const sp = (u: number) => (u < 0.93 ? Math.sin((Math.PI / 2) * ((u - 0.84) / 0.09)) : Math.pow(1 - (u - 0.93) / 0.2, 1.5))
  for (let i = 0; i <= 14; i++) {
    const u = 0.84 + (0.29 * i) / 14
    spike.push([sx(Math.min(1, u)) + spikeW * sp(u), oy - L * u])
  }
  for (let i = 13; i >= 1; i--) {
    const u = 0.84 + (0.29 * i) / 14
    spike.push([sx(Math.min(1, u)) - spikeW * sp(u), oy - L * u])
  }
  wash(ctx, spike, rng, look.tip, look.tipAlpha, 7, 0.28, 1, sx(1), sy(1))
  // The rim darkens toward the tip as the pigment runs there.
  gradWash(ctx, base, rng, [[0, pplRgba(look.tip, 0.9)], [1, pplRgba(look.tip, 0)]], look.tipAlpha * 0.35, 4, 0.4, sx(1), sy(0.98), W * 0.9, L * 0.28)
  if (collar) {
    // And at the base, round the circle.
    wash(ctx, base, rng, look.tip, 0.08, 6, 0.4, 0.36, sx(0), sy(0))
  }

  ctx.save()
  tracePath(ctx, base)
  ctx.clip()
  // Wet edge: colour that crept to the margin while the wash dried.
  for (let i = 0; i < 3; i++) {
    tracePath(ctx, pplDeform(base, 2, 0.25, rng))
    ctx.strokeStyle = pplRgba(halo ? look.rim : pplMix(look.rim, look.tip, 0.3), halo ? 0.1 : 0.12)
    ctx.lineWidth = W * (0.05 + i * 0.05)
    ctx.stroke()
  }
  // Dry-brush streaks running from the quill out to the edge.
  const streaks = Math.floor(W * (halo ? 2.2 : 1.6))
  for (let i = 0; i < streaks; i++) {
    const side = rng() < 0.5 ? -1 : 1
    const u1 = 0.3 + 0.7 * Math.pow(rng(), 0.7)
    const ex = sx(u1) + side * hw(u1) * (0.55 + 0.5 * rng())
    const ey = sy(u1)
    const bx = sx(0.04) + side * W * 0.06 * rng()
    const by = sy(0.04 + 0.1 * rng())
    const light = rng() < (halo ? 0.62 : 0.5)
    ctx.strokeStyle = light ? "rgba(255,255,255," + (0.08 + rng() * (dark ? 0.1 : 0.22)) + ")" : pplRgba(halo ? look.rim : look.band, 0.05 + rng() * 0.12)
    ctx.lineWidth = lw * (0.6 + rng() * 1.1)
    ctx.beginPath()
    ctx.moveTo(bx, by)
    ctx.quadraticCurveTo(bx + (ex - bx) * 0.2, by + (ey - by) * 0.6, ex, ey)
    ctx.stroke()
  }
  // Granulation.
  const pat = ctx.createPattern(noise, "repeat")
  if (pat) {
    ctx.globalCompositeOperation = "multiply"
    ctx.globalAlpha = dark ? 0.1 : 0.16
    ctx.fillStyle = pat
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.globalCompositeOperation = "source-over"
    ctx.globalAlpha = 1
  }
  // Glitter in the warm part of the feather.
  const flecks = Math.floor(((W * L) / 160) * look.glitter)
  for (let i = 0; i < flecks; i++) {
    const u = 0.22 + 0.7 * rng()
    const x = sx(u) + (rng() * 2 - 1) * hw(u) * 0.78
    const y = sy(u)
    const r = lw * (0.35 + 0.9 * rng() * rng())
    ctx.fillStyle = rng() < 0.7 ? pplRgba(pplMix(c.glitter, "#ffffff", rng() * 0.4), 0.45 + rng() * 0.5) : "rgba(255,255,255," + (0.5 + rng() * 0.4) + ")"
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()

  // Serrations round the circle: dark barbs poking inward past the quill.
  if (collar) {
    const barbs = Math.floor(W * 0.7)
    for (let i = 0; i < barbs; i++) {
      const x = sx(0.05) + (rng() * 2 - 1) * W * 0.55
      const y = sy(0.06 + rng() * 0.12)
      const l = L * (0.1 + rng() * 0.22)
      ctx.strokeStyle = pplRgba(pplMix(c.tip, c.edge, rng() * 0.5), 0.25 + rng() * 0.4)
      ctx.lineWidth = lw * (0.6 + rng() * 1.2)
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.quadraticCurveTo(x + (x - ox) * 0.2, y + l * 0.5, x + (x - ox) * 0.35 + (rng() - 0.5) * l * 0.3, y + l)
      ctx.stroke()
    }
  }

  // Fibres past the edge toward the tip, where a wash feathers out into the paper.
  if (look.strands) {
    const hairs = Math.floor(W * 1.2)
    for (let i = 0; i < hairs; i++) {
      const u = 0.45 + Math.pow(rng(), 0.55) * 0.55
      const side = rng() < 0.5 ? -1 : 1
      const x0 = sx(u) + side * hw(u) * (0.75 + 0.2 * rng())
      const y0 = sy(u)
      const out = W * (0.06 + rng() * 0.22) * (0.4 + (1 - u))
      const up = L * (0.02 + rng() * 0.12) * u
      ctx.strokeStyle = rng() < 0.45 ? "rgba(255,255,255," + (0.25 + rng() * 0.4) + ")" : pplRgba(look.rim, 0.12 + rng() * 0.26)
      ctx.lineWidth = lw * (0.5 + rng() * 0.9)
      ctx.beginPath()
      ctx.moveTo(x0, y0)
      ctx.quadraticCurveTo(x0 + side * out * 0.4, y0 - up * 0.7, x0 + side * out, y0 - up)
      ctx.stroke()
    }
  }

  // Ornament: a painted eye-spot and a string of beads.
  if (look.eye) {
    const ex = sx(0.66)
    const ey = sy(0.66)
    const ew = W * 0.62
    const eh = ew * 1.55
    const layer = (s: number, col: string, al: number) => {
      for (let i = 0; i < 2; i++) {
        teardrop(ctx, ex + (rng() - 0.5) * ew * 0.03, ey + (rng() - 0.5) * eh * 0.03 + eh * (1 - s) * 0.1, ew * s, eh * s)
        ctx.fillStyle = pplRgba(col, al)
        ctx.fill()
      }
    }
    layer(1, c.body, 0.55)
    layer(0.8, c.accent, 0.6)
    layer(0.64, c.rim, 0.7)
    layer(0.42, c.tip, 0.75)
    ctx.fillStyle = "rgba(255,255,255,0.85)"
    ctx.beginPath()
    ctx.arc(ex - ew * 0.06, ey - eh * 0.06, Math.max(0.8, ew * 0.06), 0, Math.PI * 2)
    ctx.fill()
  }
  if (look.beads) {
    const spacing = Math.max(5, W * 0.2)
    for (let side = -1; side <= 1; side += 2) {
      let acc = 0
      let prev = [sx(0.25), sy(0.25)]
      for (let i = 1; i <= 160; i++) {
        const u = 0.25 + (0.72 * i) / 160
        const p = [sx(u) + side * hw(u) * 0.82, sy(u)]
        acc += Math.hypot(p[0] - prev[0], p[1] - prev[1])
        prev = p
        if (acc < spacing) continue
        acc = 0
        ctx.fillStyle = pplRgba(look.rim, 0.85)
        ctx.beginPath()
        ctx.arc(p[0], p[1], Math.max(1, W * 0.032), 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = "rgba(255,255,255,0.95)"
        ctx.beginPath()
        ctx.arc(p[0], p[1], Math.max(0.6, W * 0.017), 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }
  return { canvas, px, ox, oy }
}

/** The bird, painted in circle-radius units with (0, 0) at the circle's centre. */
function paintBird(c: PeacockTrainPalette, px: number, noise: HTMLCanvasElement, rng: () => number, dark: boolean): Sprite {
  const X0 = -0.75
  const X1 = 0.75
  const Y0 = -0.2
  const Y1 = 2.6
  const pad = 4
  const canvas = document.createElement("canvas")
  canvas.width = Math.ceil((X1 - X0) * px + pad * 2)
  canvas.height = Math.ceil((Y1 - Y0) * px + pad * 2)
  const X = (x: number) => pad + (x - X0) * px
  const Y = (y: number) => pad + (y - Y0) * px
  const ox = X(0)
  const oy = Y(0)
  const ctx = canvas.getContext("2d")
  if (!ctx) return { canvas, px, ox, oy }
  ctx.lineCap = "round"
  ctx.lineJoin = "round"
  const lw = Math.max(0.5, px / 150)
  const white = dark ? pplMix(c.paper, "#ffffff", 0.78) : "#ffffff"

  // Train coverts trailing down from the body, melting into the paper.
  for (let i = 0; i < 7; i++) {
    const t = (i / 6) * 2 - 1
    const ang = t * 0.5
    const L = 0.55 + (1 - Math.abs(t)) * 0.35
    const W = 0.11
    const x0 = 0.02 + t * 0.08
    const y0 = 1.45
    const pts: number[][] = []
    for (let j = 0; j <= 12; j++) {
      const u = j / 12
      const hw = W * Math.pow(Math.sin(Math.PI * Math.pow(u, 1.2)), 0.7)
      pts.push([x0 + Math.sin(ang) * L * u + Math.cos(ang) * hw, y0 + Math.cos(ang) * L * u - Math.sin(ang) * hw])
    }
    for (let j = 11; j >= 1; j--) {
      const u = j / 12
      const hw = W * Math.pow(Math.sin(Math.PI * Math.pow(u, 1.2)), 0.7)
      pts.push([x0 + Math.sin(ang) * L * u - Math.cos(ang) * hw, y0 + Math.cos(ang) * L * u + Math.sin(ang) * hw])
    }
    const base = pts.map((p) => [X(p[0]), Y(p[1])])
    wash(ctx, base, rng, c.haloRim, 0.05, 5, 0.35, 1, X(x0), Y(y0 + 0.4))
    wash(ctx, base, rng, white, 0.12, 5, 0.35, 0.75, X(x0), Y(y0 + 0.3))
  }

  // Body: a white breast with blue in its shadows.
  const body: number[][] = []
  const BN = 16
  const bhw = (u: number) => 0.27 * Math.pow(Math.max(0, Math.sin(Math.PI * Math.pow(u, 0.78))), 0.62)
  for (let i = 0; i <= BN; i++) body.push([X(0.03 + bhw(i / BN)), Y(0.8 + (i / BN) * 1.0)])
  for (let i = BN - 1; i >= 1; i--) body.push([X(0.03 - bhw(i / BN) * 0.92), Y(0.8 + (i / BN) * 1.0)])
  const bodyBase = pplDeform(body, 1, 0.08, rng)
  wash(ctx, bodyBase, rng, white, 0.2, 10, 0.5, 1.05, X(0.03), Y(1.3))
  wash(ctx, bodyBase, rng, white, 0.25, 6, 0.4, 0.8, X(0.03), Y(1.2))
  wash(ctx, bodyBase, rng, c.haloRim, 0.04, 6, 0.5, 0.75, X(0.2), Y(1.45))
  wash(ctx, bodyBase, rng, c.bird, 0.05, 6, 0.5, 0.3, X(0.03), Y(0.84))
  ctx.save()
  tracePath(ctx, bodyBase)
  ctx.clip()
  for (let i = 0; i < 70; i++) {
    const x = 0.03 + (rng() * 2 - 1) * 0.24
    const y = 0.9 + rng() * 0.8
    const l = 0.08 + rng() * 0.16
    ctx.strokeStyle = rng() < 0.5 ? pplRgba(c.haloRim, 0.1 + rng() * 0.14) : "rgba(255,255,255," + (0.3 + rng() * 0.4) + ")"
    ctx.lineWidth = lw * (0.6 + rng())
    ctx.beginPath()
    ctx.moveTo(X(x), Y(y))
    ctx.quadraticCurveTo(X(x + (x - 0.03) * 0.15), Y(y + l * 0.5), X(x + (x - 0.03) * 0.3), Y(y + l))
    ctx.stroke()
  }
  ctx.restore()
  // Wing shoulders: short blue-green strokes where the neck meets the body.
  for (let i = 0; i < 40; i++) {
    const side = rng() < 0.5 ? -1 : 1
    const x = 0.03 + side * (0.06 + rng() * 0.14)
    const y = 0.92 + rng() * 0.28
    const l = 0.05 + rng() * 0.08
    ctx.strokeStyle = pplRgba(rng() < 0.6 ? c.bird : c.rim, 0.12 + rng() * 0.22)
    ctx.lineWidth = lw * (0.8 + rng())
    ctx.beginPath()
    ctx.moveTo(X(x), Y(y))
    ctx.lineTo(X(x + side * l * 0.35), Y(y + l))
    ctx.stroke()
  }

  // Neck: a slender S, cobalt, lit along the front.
  const P = [
    [0.0, 0.36],
    [-0.1, 0.6],
    [0.08, 0.8],
    [0.03, 1.02],
  ]
  const bez = (t: number, i: number) => {
    const u = 1 - t
    return u * u * u * P[0][i] + 3 * u * u * t * P[1][i] + 3 * u * t * t * P[2][i] + t * t * t * P[3][i]
  }
  const neckW = (t: number) => 0.04 + 0.075 * Math.pow(t, 1.7)
  const neckSide = (shift: number, widthK: number) => {
    const left: number[][] = []
    const right: number[][] = []
    for (let i = 0; i <= 24; i++) {
      const t = i / 24
      const x = bez(t, 0)
      const y = bez(t, 1)
      const dx = bez(Math.min(1, t + 0.01), 0) - bez(Math.max(0, t - 0.01), 0)
      const dy = bez(Math.min(1, t + 0.01), 1) - bez(Math.max(0, t - 0.01), 1)
      const n = Math.hypot(dx, dy) || 1
      const nx = dy / n
      const ny = -dx / n
      const w = neckW(t)
      const cxp = x + nx * w * shift
      const cyp = y + ny * w * shift
      left.push([X(cxp - nx * w * widthK), Y(cyp - ny * w * widthK)])
      right.push([X(cxp + nx * w * widthK), Y(cyp + ny * w * widthK)])
    }
    return right.concat(left.reverse())
  }
  const neck = neckSide(0, 1)
  wash(ctx, neck, rng, c.bird, 0.3, 7, 0.08, 1, X(0), Y(0.7))
  wash(ctx, neckSide(-0.45, 0.45), rng, pplMix(c.bird, c.rim, 0.55), 0.14, 5, 0.1, 1, X(0), Y(0.7))
  wash(ctx, neckSide(0.55, 0.4), rng, pplMix(c.bird, c.tip, 0.6), 0.16, 5, 0.1, 1, X(0), Y(0.7))
  ctx.save()
  tracePath(ctx, neck)
  ctx.clip()
  for (let i = 0; i < 90; i++) {
    const t = rng()
    const x = bez(t, 0) + (rng() - 0.5) * neckW(t) * 1.6
    const y = bez(t, 1)
    ctx.strokeStyle = pplRgba(rng() < 0.6 ? pplMix(c.bird, c.rim, 0.6) : pplMix(c.bird, c.tip, 0.5), 0.3 + rng() * 0.3)
    ctx.lineWidth = lw * 0.8
    ctx.beginPath()
    ctx.arc(X(x), Y(y), lw * (2 + rng() * 2), 0.2, Math.PI - 0.2)
    ctx.stroke()
  }
  ctx.restore()

  // Head.
  const head: number[][] = []
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * Math.PI * 2
    head.push([X(-0.005 + Math.cos(a) * 0.085), Y(0.305 + Math.sin(a) * 0.072)])
  }
  wash(ctx, head, rng, c.bird, 0.34, 7, 0.08, 1, X(0), Y(0.3))
  wash(ctx, head, rng, pplMix(c.bird, c.rim, 0.5), 0.12, 4, 0.1, 0.6, X(-0.03), Y(0.28))
  // The white stripes above and below the eye.
  ctx.strokeStyle = pplRgba(white, 0.92)
  ctx.lineWidth = Math.max(0.8, px * 0.012)
  ctx.beginPath()
  ctx.moveTo(X(-0.074), Y(0.29))
  ctx.quadraticCurveTo(X(-0.03), Y(0.268), X(0.03), Y(0.29))
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(X(-0.07), Y(0.327))
  ctx.quadraticCurveTo(X(-0.02), Y(0.345), X(0.03), Y(0.33))
  ctx.stroke()
  ctx.fillStyle = pplMix(c.tip, "#000000", 0.4)
  ctx.beginPath()
  ctx.arc(X(-0.035), Y(0.304), Math.max(1, px * 0.016), 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = "rgba(255,255,255,0.9)"
  ctx.beginPath()
  ctx.arc(X(-0.039), Y(0.299), Math.max(0.5, px * 0.005), 0, Math.PI * 2)
  ctx.fill()
  // Beak.
  ctx.fillStyle = pplMix(c.glitter, c.ink, 0.5)
  ctx.beginPath()
  ctx.moveTo(X(-0.078), Y(0.296))
  ctx.quadraticCurveTo(X(-0.13), Y(0.302), X(-0.168), Y(0.318))
  ctx.quadraticCurveTo(X(-0.13), Y(0.328), X(-0.076), Y(0.33))
  ctx.closePath()
  ctx.fill()
  // Crest: a fan of fine shafts, each tipped with a small plume.
  for (let j = 0; j < 7; j++) {
    const a = ((-34 + j * 10.5) * Math.PI) / 180
    const l = 0.17 + 0.03 * Math.sin(j * 1.7)
    const bx = 0.0
    const by = 0.245
    const tx = bx + Math.sin(a) * l
    const ty = by - Math.cos(a) * l
    ctx.strokeStyle = pplRgba(pplMix(c.bird, c.tip, 0.5), 0.85)
    ctx.lineWidth = Math.max(0.6, px * 0.0055)
    ctx.beginPath()
    ctx.moveTo(X(bx), Y(by))
    ctx.quadraticCurveTo(X(bx + Math.sin(a) * l * 0.5), Y(by - Math.cos(a) * l * 0.55), X(tx), Y(ty))
    ctx.stroke()
    ctx.save()
    ctx.translate(X(tx), Y(ty))
    ctx.rotate(a)
    // A tiny fan of barbs rather than a bead.
    for (let b = -2; b <= 2; b++) {
      ctx.strokeStyle = pplRgba(b === 0 ? pplMix(c.bird, c.rim, 0.4) : c.bird, 0.9)
      ctx.lineWidth = Math.max(0.6, px * 0.006)
      ctx.beginPath()
      ctx.moveTo(0, px * 0.008)
      ctx.lineTo(b * px * 0.007, -px * 0.022)
      ctx.stroke()
    }
    ctx.restore()
  }
  // Granulation over the bird's blues.
  const pat = ctx.createPattern(noise, "repeat")
  if (pat) {
    ctx.globalCompositeOperation = "source-atop"
    ctx.globalAlpha = dark ? 0.05 : 0.08
    ctx.fillStyle = pat
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.globalCompositeOperation = "source-over"
    ctx.globalAlpha = 1
  }
  return { canvas, px, ox, oy }
}

// ---- styles ----------------------------------------------------------------

const PPL_CSS = `
.ppl-root { position: relative; width: 100%; background: var(--ppl-paper); color: var(--ppl-ink); isolation: isolate; }
.ppl-root[data-done="false"] { overflow: hidden; }
.ppl-veil {
  position: absolute; inset: 0; z-index: 2; overflow: hidden; outline: none; background: var(--ppl-paper);
  transition: opacity 650ms cubic-bezier(.65,0,.35,1);
  -webkit-font-smoothing: antialiased; cursor: pointer;
}
.ppl-veil:focus-visible .ppl-count { text-decoration: underline; text-underline-offset: 4px; }
.ppl-veil[data-phase="after"], .ppl-veil[data-phase="done"] { opacity: 0; pointer-events: none; }
.ppl-veil canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; max-width: none; }
.ppl-corner {
  position: absolute; z-index: 1; display: flex; flex-direction: column; gap: 7px;
  font-family: var(--ppl-mono); font-size: 10px; letter-spacing: .24em; text-transform: uppercase;
  transition: opacity 500ms ease;
}
.ppl-tl { left: clamp(18px, 3vw, 40px); top: clamp(18px, 3vw, 34px); opacity: .62; }
.ppl-tr { right: clamp(18px, 3vw, 40px); top: clamp(18px, 3vw, 34px); text-align: right; align-items: flex-end; }
.ppl-count { font-size: 12px; letter-spacing: .14em; font-variant-numeric: tabular-nums; }
.ppl-count small { font-size: 9px; opacity: .55; margin-left: 2px; letter-spacing: .1em; }
.ppl-rule { display: block; width: 64px; height: 1px; position: relative; overflow: hidden; }
.ppl-rule::before { content: ""; position: absolute; inset: 0; background: currentColor; opacity: .25; }
.ppl-rule i { position: absolute; left: 0; top: 0; bottom: 0; width: 100%; background: currentColor; transform-origin: left; transform: scaleX(var(--ppl-p, 0)); transition: transform 200ms linear; }
.ppl-poster {
  position: absolute; left: 0; right: 0; bottom: var(--ppl-poster-bottom, 28px); z-index: 1; text-align: center;
  display: flex; flex-direction: column; align-items: center; pointer-events: none;
  transition: opacity 450ms ease, transform 700ms cubic-bezier(.2,.7,.1,1);
}
.ppl-meta { margin: 0 0 12px; font-family: var(--ppl-mono); font-size: 9px; letter-spacing: .06em; line-height: 1.75; opacity: 0; transform: translateY(6px); transition: opacity 900ms ease 200ms, transform 900ms cubic-bezier(.2,.7,.1,1) 200ms; }
.ppl-title { margin: 0; font-family: var(--ppl-serif); font-weight: 700; font-size: clamp(30px, 4.6vw, 58px); line-height: 1; letter-spacing: .015em; text-transform: uppercase; white-space: nowrap; }
.ppl-title span { display: inline-block; opacity: 0; transform: translateY(.42em); transition: opacity 700ms ease, transform 900ms cubic-bezier(.2,.75,.1,1); transition-delay: calc(380ms + var(--i) * 55ms); }
.ppl-sub { margin: 8px 0 0; font-family: var(--ppl-mono); font-size: 10px; letter-spacing: .55em; text-indent: .55em; opacity: 0; transition: opacity 900ms ease 820ms; }
.ppl-sign { margin: clamp(14px, 3.4vh, 34px) 0 0; font-family: var(--ppl-mono); font-size: clamp(15px, 1.7vw, 21px); letter-spacing: .02em; opacity: 0; transition: opacity 900ms ease 1000ms; }
.ppl-veil[data-ready="true"] .ppl-meta { opacity: .78; transform: none; }
.ppl-veil[data-ready="true"] .ppl-title span { opacity: 1; transform: none; }
.ppl-veil[data-ready="true"] .ppl-sub { opacity: .8; }
.ppl-veil[data-ready="true"] .ppl-sign { opacity: .9; }
.ppl-veil[data-phase="gate"] .ppl-corner, .ppl-veil[data-phase="gate"] .ppl-poster { opacity: 0; }
.ppl-veil[data-phase="gate"] .ppl-poster { transform: translateY(14px); }
.ppl-after {
  position: absolute; inset: 0; z-index: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px;
  text-align: center; opacity: 0; transform: translateY(10px); pointer-events: none; cursor: pointer;
  transition: opacity 800ms ease 150ms, transform 1000ms cubic-bezier(.2,.7,.1,1) 150ms;
}
.ppl-root[data-phase="after"] .ppl-after { opacity: 1; transform: none; pointer-events: auto; }
.ppl-after svg { display: block; width: 22px; height: 34px; }
.ppl-message { margin: 0; font-family: var(--ppl-serif); font-style: italic; font-weight: 400; font-size: clamp(28px, 4.6vw, 54px); line-height: 1; letter-spacing: .01em; }
.ppl-replay { font-family: var(--ppl-mono); font-size: 10px; letter-spacing: .24em; text-transform: uppercase; opacity: .5; }
.ppl-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
@media (prefers-reduced-motion: reduce) {
  .ppl-veil, .ppl-corner, .ppl-poster, .ppl-after, .ppl-rule i, .ppl-meta, .ppl-title span, .ppl-sub, .ppl-sign { transition-duration: 1ms; transition-delay: 0ms; }
  .ppl-veil[data-phase="gate"] .ppl-poster { opacity: 1; transform: none; }
  .ppl-veil[data-phase="gate"] .ppl-tr { opacity: 1; }
  .ppl-veil[data-phase="gate"] .ppl-tl { opacity: .62; }
}
`

// ---- component -------------------------------------------------------------

interface Paint {
  key: string
  px: number
  feathers: Sprite[][]
  bird: Sprite
}

export default function PeacockTrainPreloader({
  children,
  loop = false,
  progress,
  durationMs = 6000,
  preset = "ivory",
  palette,
  ornament,
  density = "full",
  spread = 300,
  seed = 3,
  title = "Mayura",
  subtitle = "2026",
  meta = ["Winter 2026", "12.25 Portfolio by Mayura Studio", "Copyright © Mayura · All rights reserved"],
  signature = "©MAYURA",
  message = "Welcome.",
  hud = true,
  label = "Loading",
  serifFamily = SERIF_STACK,
  monoFamily = MONO_STACK,
  height = "100svh",
  onComplete,
  className = "",
}: PeacockTrainPreloaderProps) {
  const colors = { ...(PRESETS[preset] || PRESETS.ivory), ...(palette || {}) } as PeacockTrainPalette
  const ornate = ornament === undefined ? preset === "opal" : ornament
  const rootRef = React.useRef(null as HTMLDivElement | null)
  const veilRef = React.useRef(null as HTMLDivElement | null)
  const canvasRef = React.useRef(null as HTMLCanvasElement | null)
  const ruleRef = React.useRef(null as HTMLElement | null)
  const paintRef = React.useRef(null as Paint | null)
  const [phase, setPhase] = React.useState("load" as "load" | "hold" | "gate" | "after" | "done")
  const [pct, setPct] = React.useState(0)
  const [run, setRun] = React.useState(0)
  const [ready, setReady] = React.useState(false)
  const phaseRef = React.useRef(phase)
  phaseRef.current = phase
  const progressRef = React.useRef(progress)
  progressRef.current = progress
  const onCompleteRef = React.useRef(onComplete)
  onCompleteRef.current = onComplete
  const rushRef = React.useRef(false)
  const optsRef = React.useRef({ colors, density, spread, seed, durationMs, loop, ornate })
  optsRef.current = { colors, density, spread, seed, durationMs, loop, ornate }
  const colorKey = Object.keys(colors)
    .sort()
    .map((k) => colors[k as keyof PeacockTrainPalette])
    .join("|")

  React.useEffect(() => {
    const root = rootRef.current
    const veil = veilRef.current
    const canvas = canvasRef.current
    if (!root || !veil || !canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const o = optsRef.current
    const c = o.colors
    const dark = pplLuma(c.paper) < 128
    const rows = pplRows(o.density, o.spread)
    const feathers = pplBuild(rows, o.spread, o.seed)
    const nf = feathers.length
    const fc = new Float32Array(nf)
    const fs = new Float32Array(nf)
    const fbx = new Float32Array(nf)
    const fby = new Float32Array(nf)
    const fk = new Float32Array(nf)
    const fa = new Float32Array(nf)
    // Feather indices per row, in draw order.
    const rowIdx = rows.map(() => [] as number[])
    for (let i = 0; i < nf; i++) rowIdx[feathers[i].row].push(i)
    // A row that has finished opening is flattened into one image and moved as a
    // unit: about two hundred draws a frame become eight.
    let rowCache = [] as (HTMLCanvasElement | null)[]
    let rowHalf = [] as number[]
    let rowScale = [] as number[]

    // Glitter that twinkles on top of the paint: a few flecks per feather.
    const srng = pplRng(o.seed * 31 + 5)
    const sparkF = [] as number[]
    const sparkU = [] as number[]
    const sparkL = [] as number[]
    const sparkP = [] as number[]
    const sparkS = [] as number[]
    const sparkZ = [] as number[]
    for (let i = 0; i < nf; i++) {
      const f = feathers[i]
      if (f.row < 1) continue
      const n = rows[f.row].kind === "halo" ? 3 : 2
      for (let j = 0; j < n; j++) {
        sparkF.push(i)
        sparkU.push(0.3 + srng() * 0.62)
        sparkL.push((srng() * 2 - 1) * 0.62)
        sparkP.push(srng() * Math.PI * 2)
        sparkS.push(0.0011 + srng() * 0.0024)
        sparkZ.push(0.6 + srng() * 0.9)
      }
    }

    let w = 1
    let h = 1
    let dpr = 1
    let cx = 0
    let cy = 0
    let r0 = 60
    let raf = 0
    let shown = 0
    let holdAt = -1
    let gateAt = -1
    let started = performance.now()
    let pctLast = -1
    let localPhase = "load"
    let paper = null as HTMLCanvasElement | null
    let lean = 0
    let leanT = 0
    let parX = 0
    let parY = 0
    let parXT = 0
    let parYT = 0
    let pointer = null as null | { x: number; y: number }
    let repaintTimer = 0
    // Where the type sits, so the paint can thin out beneath it.
    let textCy = 0
    let textRx = 0
    let textRy = 0
    const noise = paintNoise(pplRng(o.seed + 11))

    const setLocal = (p: string) => {
      localPhase = p
      setPhase(p as "load" | "hold" | "gate" | "after" | "done")
    }

    // Paint every feather variant and the bird at a resolution for this size,
    // reusing an earlier painting when the inputs and the size are the same.
    const paintAll = (pxWanted: number) => {
      const key = colorKey + "|" + o.density + "|" + o.spread + "|" + o.seed + "|" + o.ornate
      const prev = paintRef.current
      if (prev && prev.key === key && prev.px >= pxWanted * 0.8 && prev.px <= pxWanted * 1.6) return
      const px = Math.round(pxWanted)
      const out: Sprite[][] = []
      for (let r = 0; r < rows.length; r++) {
        out[r] = []
        for (let v = 0; v < 3; v++) {
          const rng = pplRng(o.seed * 1013 + r * 97 + v * 7 + 5)
          const look = lookFor(rows[r].kind, r, rows.length, c, o.ornate, v)
          out[r][v] = paintFeather(rows[r].half, rows[r].len, look, c, px, noise, rng, dark)
        }
      }
      const bird = paintBird(c, px, noise, pplRng(o.seed * 17 + 3), dark)
      paintRef.current = { key, px, feathers: out, bird }
      rowCache = []
    }

    const buildRow = (r: number, paint: Paint) => {
      const half = (rows[r].base + rows[r].len * 1.42) * r0
      const cs = Math.min(dpr, 1.5)
      const size = Math.ceil(half * 2 * cs)
      const cv = document.createElement("canvas")
      cv.width = size
      cv.height = size
      const g = cv.getContext("2d")
      if (!g) return
      for (const i of rowIdx[r]) {
        const f = feathers[i]
        const sp = paint.feathers[r][f.variant]
        const rad = ((f.theta + f.tilt) * Math.PI) / 180
        const co = Math.cos(rad)
        const sn = Math.sin(rad)
        const k = (r0 * (f.len / rows[r].len)) / sp.px
        const baseR = rows[r].base * r0
        const m = f.mirror ? -1 : 1
        g.setTransform(cs * k * co * m, cs * k * sn * m, -cs * k * sn, cs * k * co, cs * (half + sn * baseR), cs * (half - co * baseR))
        g.drawImage(sp.canvas, -sp.ox, -sp.oy)
      }
      rowCache[r] = cv
      rowHalf[r] = half
      rowScale[r] = cs
    }

    const layout = (first: boolean) => {
      const rect = root.getBoundingClientRect()
      w = Math.max(1, Math.round(rect.width))
      h = Math.max(1, Math.round(rect.height))
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      rowCache = []
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      // The type takes the foot of the screen; the train fills what is left above it.
      const textH = Math.min(240, h * 0.28)
      const top = Math.max(10, h * 0.02)
      const avail = Math.max(120, h - textH - top)
      const R = Math.min(avail / 1.62, (w / 2) * 1.02)
      r0 = R / PPL_REACH
      cx = w / 2
      cy = top + R + Math.max(0, (avail - R * 1.62) * 0.62)
      const posterBottom = Math.max(18, Math.min(48, h * 0.045))
      root.style.setProperty("--ppl-poster-bottom", posterBottom + "px")
      textCy = h - posterBottom - textH * 0.5
      textRx = Math.min(w * 0.42, 420)
      textRy = textH * 0.62

      // Paper: the base colour, the clean circle of light, a soft vignette, grain.
      paper = document.createElement("canvas")
      paper.width = canvas.width
      paper.height = canvas.height
      const p = paper.getContext("2d")
      if (p) {
        p.setTransform(dpr, 0, 0, dpr, 0, 0)
        p.fillStyle = c.paper
        p.fillRect(0, 0, w, h)
        const sun = p.createRadialGradient(cx, cy, r0 * 0.6, cx, cy, r0 * 1.5)
        sun.addColorStop(0, pplRgba(c.glow, dark ? 0.16 : 1))
        sun.addColorStop(0.55, pplRgba(c.glow, dark ? 0.08 : 0.7))
        sun.addColorStop(1, pplRgba(c.glow, 0))
        p.fillStyle = sun
        p.fillRect(0, 0, w, h)
        const vig = p.createRadialGradient(cx, cy, Math.min(w, h) * 0.45, cx, cy, Math.hypot(w, h) * 0.65)
        vig.addColorStop(0, "rgba(0,0,0,0)")
        vig.addColorStop(1, dark ? "rgba(0,0,0,0.45)" : pplRgba(c.ink, 0.06))
        p.fillStyle = vig
        p.fillRect(0, 0, w, h)
        const pat = p.createPattern(noise, "repeat")
        if (pat) {
          p.globalCompositeOperation = dark ? "screen" : "multiply"
          p.globalAlpha = dark ? 0.03 : 0.07
          p.fillStyle = pat
          p.fillRect(0, 0, w, h)
          p.globalCompositeOperation = "source-over"
          p.globalAlpha = 1
        }
      }

      const want = r0 * Math.max(1.5, dpr * 1.25)
      if (first || !paintRef.current) paintAll(want)
      else {
        // Resizing: draw the old painting scaled, repaint once things settle.
        clearTimeout(repaintTimer)
        repaintTimer = window.setTimeout(() => paintAll(want), 180)
      }
    }

    const onMove = (e: PointerEvent) => {
      const rect = root.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      pointer = { x, y }
      leanT = ((x - cx) / Math.max(1, w)) * 2 * 1.8
      parXT = ((x - cx) / Math.max(1, w)) * 2 * r0 * 0.16
      parYT = ((y - cy) / Math.max(1, h)) * 2 * r0 * 0.12
    }
    const onLeave = () => {
      pointer = null
      leanT = 0
      parXT = 0
      parYT = 0
    }

    const frame = (now: number) => {
      const opts = optsRef.current
      const ph = localPhase

      if (ph === "load") {
        const real = progressRef.current
        const t = (now - started) / Math.max(800, opts.durationMs)
        let target = real === undefined ? pplSimulated(t) : Math.max(0, Math.min(100, Number(real) || 0))
        if (rushRef.current) target = 100
        shown = reduced ? Math.max(shown, target) : Math.max(shown, shown + (target - shown) * (rushRef.current ? 0.09 : 0.075))
        if (target >= 100 && shown > 99.6) shown = 100
        const p = Math.floor(shown)
        if (p !== pctLast) {
          pctLast = p
          setPct(p)
          if (ruleRef.current) ruleRef.current.style.setProperty("--ppl-p", String(shown / 100))
        }
        if (shown >= 100) {
          holdAt = now
          setLocal("hold")
        }
      } else if (ph === "hold" && now - holdAt > (reduced ? 700 : HOLD_MS)) {
        gateAt = now
        setLocal("gate")
      } else if (ph === "gate" && now - gateAt > (reduced ? 700 : GATE_MS)) {
        // The train has passed. Loop mode greets and replays from a fresh effect;
        // otherwise the veil unmounts, so nothing is left to draw.
        setLocal(opts.loop ? "after" : "done")
        if (!opts.loop) onCompleteRef.current?.()
        return
      }
      raf = requestAnimationFrame(frame)

      const paint = paintRef.current
      if (!paint) return
      const p01 = shown / 100
      lean += (leanT - lean) * 0.045
      parX += (parXT - parX) * 0.06
      parY += (parYT - parY) * 0.06
      const intro = reduced ? 1 : pplSmooth(0, 1100, now - started)
      const breath = reduced ? 1 : 1 + 0.005 * Math.sin(now / 2400)
      const gt = ph === "gate" ? Math.min(1, (now - gateAt) / GATE_MS) : 0
      const gate = ph === "gate" && !reduced ? pplGate(gt, r0, w, h) : null
      const zoom = gate ? gate.scale : 1
      // The train rattle: a quick shiver as the display peaks.
      const hk = ph === "hold" ? (now - holdAt) / HOLD_MS : -1
      const rattleEnv = reduced || hk < 0 ? 0 : pplSmooth(0, 0.08, hk) * (1 - pplSmooth(0.35, 0.62, hk))
      const sweepK = hk < 0 ? (ph === "gate" ? 1 : -1) : pplSmooth(0.45, 0.98, hk)

      if (gate) {
        const m = "radial-gradient(circle at " + cx + "px " + cy + "px, transparent " + Math.max(0, gate.hole - 1) + "px, #000 " + (gate.hole + 1) + "px)"
        veil.style.setProperty("-webkit-mask-image", m)
        veil.style.setProperty("mask-image", m)
      } else if (ph === "gate" && reduced) {
        veil.style.opacity = String(1 - Math.min(1, (now - gateAt) / 700))
      }

      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = "source-over"
      if (paper) ctx.drawImage(paper, 0, 0)

      // The train, back to front. Rows sway, shiver and drift as units.
      const nr = rows.length
      const zb = zoom * breath
      for (let r = nr - 1; r >= 0; r--) {
        const open = pplOpen(p01, r, nr)
        const idx = rowIdx[r]
        if (open <= 0.001) {
          for (const i of idx) fa[i] = 0
          continue
        }
        const sway = reduced ? 0 : Math.sin(now / 1700 + r * 1.3) * (0.25 + 0.1 * r)
        const rattle = rattleEnv * Math.sin(now * 0.075 + r * 1.9) * (0.7 + r * 0.12)
        const rowAng = sway + rattle + lean * (0.5 + 0.12 * r)
        const depth = (nr - r) / nr
        const ox = cx + parX * depth
        const oy = cy + parY * depth
        const settled = open >= 1
        if (settled && !rowCache[r]) buildRow(r, paint)
        const cache = settled ? rowCache[r] : null
        if (cache) {
          const rad = (rowAng * Math.PI) / 180
          const q = zb / rowScale[r]
          const co = Math.cos(rad) * q
          const sn = Math.sin(rad) * q
          ctx.globalAlpha = intro
          ctx.setTransform(dpr * co, dpr * sn, -dpr * sn, dpr * co, dpr * ox, dpr * oy)
          ctx.drawImage(cache, -rowHalf[r] * rowScale[r], -rowHalf[r] * rowScale[r])
        }
        const alpha = pplSmooth(0, 0.22, open) * intro
        const grow = reduced ? 1 : 0.55 + 0.45 * pplOutQuart(open)
        const baseR = rows[r].base * r0 * zb
        for (const i of idx) {
          const f = feathers[i]
          const ang = (reduced || settled ? f.theta : pplFan(f.theta, open)) + f.tilt * open + rowAng
          const rad = (ang * Math.PI) / 180
          const cs = Math.cos(rad)
          const sn = Math.sin(rad)
          const sc = zb * grow * (f.len / rows[r].len)
          const bx = ox + sn * baseR
          const by = oy - cs * baseR
          fc[i] = cs
          fs[i] = sn
          fbx[i] = bx
          fby[i] = by
          fk[i] = r0 * sc
          fa[i] = alpha * pplSmooth(0.6, 1, open)
          if (cache || alpha <= 0.003) continue
          const sp = paint.feathers[r][f.variant]
          const k = (r0 * sc) / sp.px
          const m = f.mirror ? -1 : 1
          ctx.globalAlpha = alpha
          ctx.setTransform(dpr * k * cs * m, dpr * k * sn * m, -dpr * k * sn, dpr * k * cs, dpr * bx, dpr * by)
          ctx.drawImage(sp.canvas, -sp.ox, -sp.oy)
        }
      }

      // The paint thins out where the type sits, like a painter leaving the paper clean.
      if (textRy > 0) {
        ctx.save()
        ctx.setTransform(dpr * (textRx / textRy), 0, 0, dpr, dpr * cx, dpr * textCy)
        const clear = ctx.createRadialGradient(0, 0, 0, 0, 0, textRy)
        clear.addColorStop(0, pplRgba(c.paper, 0.93))
        clear.addColorStop(0.55, pplRgba(c.paper, 0.8))
        clear.addColorStop(1, pplRgba(c.paper, 0))
        ctx.globalAlpha = 1
        ctx.fillStyle = clear
        ctx.fillRect(-textRy, -textRy, textRy * 2, textRy * 2)
        ctx.restore()
      }

      // Glitter catching the light.
      if (!reduced) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        ctx.globalCompositeOperation = "source-over"
        const sweep = -opts.spread / 2 - 40 + (opts.spread + 80) * sweepK
        const gl = pplHex(c.glitter, [230, 190, 80])
        const pr2 = Math.pow(r0 * 1.4, 2)
        const unit = Math.max(0.8, r0 / 55)
        for (let s = 0; s < sparkF.length; s++) {
          const i = sparkF[s]
          if (fa[i] <= 0.01) continue
          const f = feathers[i]
          const yu = -sparkU[s] * f.len
          const xu = sparkL[s] * rows[f.row].half * (f.mirror ? -1 : 1)
          const x = fbx[i] + fk[i] * (fc[i] * xu - fs[i] * yu)
          const y = fby[i] + fk[i] * (fs[i] * xu + fc[i] * yu)
          let a = Math.pow(Math.max(0, Math.sin(now * sparkS[s] + sparkP[s])), 16)
          if (pointer) {
            const d2 = (x - pointer.x) * (x - pointer.x) + (y - pointer.y) * (y - pointer.y)
            if (d2 < pr2 * 4) a = Math.max(a, Math.exp(-d2 / pr2) * (0.45 + 0.55 * Math.pow(0.5 + 0.5 * Math.sin(now * 0.012 + sparkP[s] * 5), 3)))
          }
          if (rattleEnv > 0) a = Math.max(a, rattleEnv * 0.8 * Math.pow(0.5 + 0.5 * Math.sin(now * 0.03 + sparkP[s] * 7), 9))
          if (sweepK >= 0 && sweepK < 1) {
            const ang = (Math.atan2(x - cx, cy - y) * 180) / Math.PI
            a = Math.max(a, Math.exp(-Math.pow(pplAngleDiff(ang, sweep) / 9, 2)))
          }
          a *= fa[i]
          if (a < 0.03) continue
          if (dark) a *= 0.8
          const z = sparkZ[s] * unit
          ctx.globalAlpha = Math.min(1, a)
          ctx.fillStyle = "rgb(" + Math.round(gl[0] + (255 - gl[0]) * a * 0.7) + "," + Math.round(gl[1] + (255 - gl[1]) * a * 0.7) + "," + Math.round(gl[2] + (255 - gl[2]) * a * 0.7) + ")"
          ctx.beginPath()
          ctx.arc(x, y, z * (0.7 + a * 0.6), 0, Math.PI * 2)
          ctx.fill()
          if (a > 0.4) {
            const arm = z * (2 + a * 4)
            ctx.globalAlpha = Math.min(1, a) * 0.75
            ctx.fillRect(x - arm, y - 0.35 * unit, arm * 2, 0.7 * unit)
            ctx.fillRect(x - 0.35 * unit, y - arm, 0.7 * unit, arm * 2)
          }
        }
        ctx.globalCompositeOperation = "source-over"
      }

      // The bird, in front of its train. It leaves first through the window.
      const bird = paint.bird
      const bk = gate ? Math.min(1, gt / 0.5) : 0
      const balpha = intro * (1 - pplSmooth(0.05, 0.85, bk))
      if (balpha > 0.003) {
        // Drawn larger than painted, scaled about the head so it stays in the circle.
        const bs = 1.32 * (reduced ? 1 : 0.94 + 0.06 * pplOutQuart(intro)) * (1 + bk * bk * 0.7) * breath
        const kb = (r0 * bs) / bird.px
        const bx = cx + parX * 1.15
        const by = cy + 0.3 * r0 * (1 - bs) + parY * 1.15 - bk * r0 * 0.35 + (1 - intro) * r0 * 0.12
        ctx.globalAlpha = balpha
        ctx.setTransform(dpr * kb, 0, 0, dpr * kb, dpr * bx, dpr * by)
        ctx.drawImage(bird.canvas, -bird.ox, -bird.oy)
      }
      ctx.globalAlpha = 1
    }

    veil.style.removeProperty("-webkit-mask-image")
    veil.style.removeProperty("mask-image")
    veil.style.opacity = ""
    layout(true)
    started = performance.now()
    raf = requestAnimationFrame(frame)
    const ready = requestAnimationFrame(() => setReady(true))
    const ro = new ResizeObserver(() => layout(false))
    ro.observe(root)
    root.addEventListener("pointermove", onMove)
    root.addEventListener("pointerleave", onLeave)
    return () => {
      cancelAnimationFrame(raf)
      cancelAnimationFrame(ready)
      clearTimeout(repaintTimer)
      ro.disconnect()
      root.removeEventListener("pointermove", onMove)
      root.removeEventListener("pointerleave", onLeave)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, colorKey, density, spread, seed, ornate])

  // In loop mode the greeting holds, then the train folds and rises again.
  React.useEffect(() => {
    if (phase !== "after" || !loop) return
    const t = setTimeout(() => replay(), AFTER_MS)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, loop])

  const replay = () => {
    rushRef.current = false
    setPct(0)
    setReady(false)
    if (ruleRef.current) ruleRef.current.style.setProperty("--ppl-p", "0")
    setPhase("load")
    setRun((r) => r + 1)
  }

  const onActivate = () => {
    if (phaseRef.current === "load") rushRef.current = true
    else if (loop && phaseRef.current === "after") replay()
  }

  const done = phase === "done"
  const count = (pct < 10 ? "00" : pct < 100 ? "0" : "") + pct

  return (
    <div
      ref={rootRef}
      className={"ppl-root " + className}
      data-phase={phase}
      data-done={done ? "true" : "false"}
      style={
        {
          height: done ? undefined : height,
          "--ppl-paper": colors.paper,
          "--ppl-ink": colors.ink,
          "--ppl-serif": serifFamily,
          "--ppl-mono": monoFamily,
        } as React.CSSProperties
      }
    >
      <style>{PPL_CSS}</style>
      {loop ? null : children}
      {loop || !done ? (
        <div
          ref={veilRef}
          className="ppl-veil"
          data-phase={phase}
          data-ready={ready ? "true" : "false"}
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
          <canvas ref={canvasRef} aria-hidden="true" />
          {hud ? (
            <>
              <div className="ppl-corner ppl-tl" aria-hidden="true">
                <span>{label}</span>
                <span className="ppl-rule">
                  <i ref={ruleRef} />
                </span>
              </div>
              <div className="ppl-corner ppl-tr" aria-hidden="true">
                <span className="ppl-count">
                  {count}
                  <small>%</small>
                </span>
              </div>
            </>
          ) : null}
          {title || subtitle || signature || (meta && meta.length) ? (
            <div className="ppl-poster" aria-hidden="true">
              {meta && meta.length ? (
                <p className="ppl-meta">
                  {meta.map((line, i) => (
                    <React.Fragment key={i}>
                      {i ? <br /> : null}
                      {line}
                    </React.Fragment>
                  ))}
                </p>
              ) : null}
              {title ? (
                <h1 className="ppl-title">
                  {Array.from(title).map((ch, i) => (
                    <span key={i} style={{ "--i": i } as React.CSSProperties}>
                      {ch === " " ? " " : ch}
                    </span>
                  ))}
                </h1>
              ) : null}
              {subtitle ? <p className="ppl-sub">{subtitle}</p> : null}
              {signature ? <p className="ppl-sign">{signature}</p> : null}
            </div>
          ) : null}
        </div>
      ) : null}
      {loop && message ? (
        <div className="ppl-after" onClick={onActivate} aria-hidden={phase !== "after"}>
          <svg viewBox="0 0 22 34" aria-hidden="true">
            <path d="M11 33 C11 26 11 20 11 15" stroke={colors.edge} strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.6" />
            <path d="M11 1 C17 7 19 13 19 16 C19 21 15 24 11 24 C7 24 3 21 3 16 C3 13 5 7 11 1 Z" fill={colors.body} opacity="0.75" />
            <path d="M11 5 C15.5 9.5 16.6 13.5 16.6 16 C16.6 19.6 14 21.8 11 21.8 C8 21.8 5.4 19.6 5.4 16 C5.4 13.5 6.5 9.5 11 5 Z" fill={colors.glitter} opacity="0.85" />
            <path d="M11 8.5 C14 11.6 14.6 14.4 14.6 16 C14.6 18.4 13 19.8 11 19.8 C9 19.8 7.4 18.4 7.4 16 C7.4 14.4 8 11.6 11 8.5 Z" fill={colors.edge} />
            <path d="M11 12 C12.6 13.8 12.9 15.2 12.9 16 C12.9 17.3 12 18 11 18 C10 18 9.1 17.3 9.1 16 C9.1 15.2 9.4 13.8 11 12 Z" fill={colors.tip} />
          </svg>
          <p className="ppl-message">{message}</p>
          <span className="ppl-replay">Click to replay</span>
        </div>
      ) : null}
      <span className="ppl-sr" aria-live="polite">
        {phase === "load" || phase === "hold" ? "" : phase === "after" ? message : "Loaded"}
      </span>
    </div>
  )
}
