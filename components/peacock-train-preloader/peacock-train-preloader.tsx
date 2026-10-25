"use client"

// Peacock Train Preloader — a loading screen painted as a peacock in display.
// A small bird stands in a circle of clean paper; as the page loads its train
// fans open round that circle, feather by feather, three rings deep: a tight
// ring of eyed feathers, a wider ring of long cobalt-and-emerald plumes, and
// an outer halo of pale watercolour washes dipped in blue. Each eye opens
// with a small overshoot once its feather settles. At 100 a glint runs round
// the ring, then the whole train rushes toward the viewer and the clean
// circle at its centre becomes the window the page arrives through.
//
// The train is alive while it waits: it breathes, sways, leans toward the
// pointer, and the feathers under the pointer lift and catch the light.
//
// One file, React only. Every feather is painted once onto an offscreen
// canvas (barbs, wash, granulation, the eye) and composed every frame onto a
// single 2D canvas; the bird is procedural SVG; every rule in the scoped
// <style> is .ppl- prefixed. Nothing is fetched.

import * as React from "react"

export type PeacockTrainPreset = "ivory" | "midnight" | "opal"
export type PeacockTrainDensity = "sparse" | "full" | "lush"

export interface PeacockTrainPalette {
  /** The paper behind everything. */
  paper: string
  /** Type colour. */
  ink: string
  /** The feather shafts. */
  shaft: string
  /** Barbs near the base of an eyed feather. */
  barbBase: string
  /** Barbs along the middle of an eyed feather. */
  barbMid: string
  /** Barbs toward the tip and the outer edge. */
  barbTip: string
  /** The dark heart of each eye. */
  eyeHeart: string
  /** The ring round the heart. */
  eyeBlue: string
  /** The halo outside that. */
  eyeGreen: string
  /** The bronze rim of the eye. */
  eyeGold: string
  /** Body colour of the outer watercolour plumes. */
  plume: string
  /** The colour the plumes are dipped in at their edges. */
  plumeEdge: string
  /** The bird's neck and crest. */
  bird: string
  /** Light that gathers behind the train. */
  glow: string
}

export interface PeacockTrainPreloaderProps {
  /** Revealed through the ring once the gate opens. Ignored while `loop` is set. */
  children?: React.ReactNode
  /** Showcase mode: fans open, zooms through, greets, and replays forever. */
  loop?: boolean
  /** Real loading progress, 0–100. Leave undefined to simulate a load over `durationMs`. */
  progress?: number
  /** Length of the simulated load. Defaults to 5800ms. */
  durationMs?: number
  /** Colour preset. */
  preset?: PeacockTrainPreset
  /** Colour overrides, merged over the preset. */
  palette?: { [K in keyof PeacockTrainPalette]?: string }
  /** How many feathers the train carries. */
  density?: PeacockTrainDensity
  /** Degrees the train spans round the circle, 120–340. Defaults to 300. */
  spread?: number
  /** Reshuffles the feathers' small irregularities. */
  seed?: number
  /** The wordmark under the ring. */
  title?: string
  /** Letter-spaced line under the wordmark. */
  subtitle?: string
  /** Small lines above the wordmark. */
  meta?: string[]
  /** Greeting shown after the gate in `loop` mode. "" skips it. */
  message?: string
  /** Show the corner counter and label. */
  hud?: boolean
  /** Accessible name of the progress bar. */
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
    paper: "#f6f2ea",
    ink: "#1d2430",
    shaft: "#eadba6",
    barbBase: "#7f9430",
    barbMid: "#149a6c",
    barbTip: "#1c4fc2",
    eyeHeart: "#111848",
    eyeBlue: "#2a62cf",
    eyeGreen: "#2fb88a",
    eyeGold: "#cfa44a",
    plume: "#f1e9ad",
    plumeEdge: "#3b7bd2",
    bird: "#1f4fb6",
    glow: "#ffffff",
  },
  midnight: {
    paper: "#0b1220",
    ink: "#e6e9f2",
    shaft: "#f0d998",
    barbBase: "#3f6b55",
    barbMid: "#22a08a",
    barbTip: "#3c7fe8",
    eyeHeart: "#060a2a",
    eyeBlue: "#3f7df0",
    eyeGreen: "#39d4a7",
    eyeGold: "#e8bf63",
    plume: "#7c6cc9",
    plumeEdge: "#8fd5ff",
    bird: "#6fb3ff",
    glow: "#9fd3ff",
  },
  opal: {
    paper: "#f3f3f1",
    ink: "#2a2f3a",
    shaft: "#e7cfa0",
    barbBase: "#8ea3c9",
    barbMid: "#45b3a8",
    barbTip: "#7a63c4",
    eyeHeart: "#3f2f85",
    eyeBlue: "#7d6ad6",
    eyeGreen: "#53c7b3",
    eyeGold: "#f0a36a",
    plume: "#cfe9f0",
    plumeEdge: "#8d7bd8",
    bird: "#5c8fd6",
    glow: "#ffffff",
  },
}

const SERIF_STACK = '"Bodoni Moda", "Didot", "Playfair Display", "Instrument Serif", "Cormorant Garamond", Georgia, "Times New Roman", serif'
const MONO_STACK = '"JetBrains Mono", "SF Mono", "Fira Code", Menlo, Consolas, monospace'

const HOLD_MS = 1150
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

/** Back-out: overshoots a little past 1 before settling. The eyes open with it. */
export function pplBackOut(t: number) {
  const c = 1.70158
  const u = clamp01(t) - 1
  return 1 + (c + 1) * u * u * u + c * u * u
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

/** Feathers per ring — inner eyed ring, middle plumes, outer washes. */
export function pplCounts(density: string) {
  if (density === "sparse") return [22, 16, 12]
  if (density === "lush") return [44, 34, 24]
  return [34, 26, 18]
}

// Where in the load each ring opens: inner first, outer last, overlapping.
const WINDOWS = [
  [0, 0.5],
  [0.22, 0.78],
  [0.5, 1],
]

/** How far ring `layer` has fanned open at progress p (0–1). */
export function pplOpen(p: number, layer: number) {
  const w = WINDOWS[Math.max(0, Math.min(2, layer))]
  return pplSmooth(w[0], w[1], p)
}

export interface PplFeather {
  /** 0 inner eyed ring, 1 middle plumes, 2 outer washes. */
  layer: number
  /** Resting angle, degrees, 0 straight up, clockwise positive. */
  theta: number
  /** Where the quill sits, in units of the circle's radius. */
  base: number
  /** Length, in units of the circle's radius. */
  len: number
  /** Half width at the widest, same units. */
  half: number
  /** Which painted variant to use. */
  variant: number
  /** Sway phase. */
  phase: number
  /** Small resting lean, degrees. */
  tilt: number
  /** Mirrored for the left side so the train is symmetric. */
  mirror: boolean
}

const LAYER_BASE = [0.95, 0.98, 1.0]
const LAYER_LEN = [1.6, 2.9, 4.4]
const LAYER_OVERLAP = [1.2, 1.25, 1.1]
/** Where the eye sits along an eyed feather, per ring. */
const EYE_AT = [0.85, 0.87]
/** The train's furthest reach, in units of the circle's radius. */
export const PPL_REACH = LAYER_BASE[2] + LAYER_LEN[2]

/**
 * Lay out the train: every feather's resting angle and size, symmetric about
 * straight-up and sorted back to front (outer washes first, inner eyes last,
 * and the lowest feathers under the highest within each ring).
 */
export function pplBuild(counts: number[], spread: number, seed: number) {
  const s = Math.max(120, Math.min(340, spread || 300))
  const out: PplFeather[] = []
  for (let layer = 0; layer < 3; layer++) {
    const n = Math.max(3, Math.floor(counts[layer] || 0))
    const base = LAYER_BASE[layer]
    const len = LAYER_LEN[layer]
    const reach = base + len * 0.72
    const arc = ((Math.PI * 2 * reach * s) / 360) / (n - 1)
    const half = arc * 0.5 * LAYER_OVERLAP[layer]
    for (let k = 0; k < n; k++) {
      const theta = -s / 2 + (s * k) / (n - 1)
      // Traits come from the mirrored index, so both sides match.
      const j = Math.min(k, n - 1 - k)
      const rng = pplRng(seed * 7919 + layer * 131 + j * 17 + 1)
      out.push({
        layer,
        theta,
        base,
        len: len * (0.97 + rng() * 0.06),
        half,
        variant: Math.floor(rng() * 3),
        phase: rng() * Math.PI * 2,
        tilt: (rng() - 0.5) * 2.4,
        mirror: theta < 0,
      })
    }
  }
  out.sort((a, b) => (a.layer !== b.layer ? b.layer - a.layer : Math.abs(b.theta) - Math.abs(a.theta)))
  return out
}

/**
 * The angle a feather sits at while fanning open: closed, every feather is
 * folded straight down behind the bird; open, it rests at its own angle.
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
 * scale on the ring, and the radius of the clean window cut in the paper. The
 * window ends just past the viewport's corner so the paper leaves entirely.
 */
export function pplGate(t: number, r0: number, w: number, h: number) {
  const k = clamp01(t)
  const need = Math.hypot(w, h) * 0.56
  const top = Math.max(1.5, need / (r0 * 0.93))
  const e = k * k * (0.3 + 0.7 * k)
  const scale = 1 + (top - 1) * e
  return { scale, hole: r0 * scale * 0.93 }
}

/** Hex → [r, g, b], or a fallback for anything that isn't #rgb / #rrggbb. */
export function pplHex(hex: string, fallback: number[]) {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec((hex || "").trim())
  if (!m) return fallback
  const h = m[1].length === 3 ? m[1].split("").map((c) => c + c).join("") : m[1]
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

/** Mix two hex colours, t from a to b, returning rgb(). */
export function pplMix(a: string, b: string, t: number) {
  const x = pplHex(a, [128, 128, 128])
  const y = pplHex(b, [128, 128, 128])
  const k = clamp01(t)
  return "rgb(" + Math.round(x[0] + (y[0] - x[0]) * k) + "," + Math.round(x[1] + (y[1] - x[1]) * k) + "," + Math.round(x[2] + (y[2] - x[2]) * k) + ")"
}

/** A hex colour with alpha, as rgba(). */
export function pplRgba(hex: string, alpha: number) {
  const c = pplHex(hex, [128, 128, 128])
  return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + clamp01(alpha) + ")"
}

/** Perceived lightness 0–255, to pick type and shading against the paper. */
export function pplLuma(hex: string) {
  const c = pplHex(hex, [128, 128, 128])
  return c[0] * 0.299 + c[1] * 0.587 + c[2] * 0.114
}
// #endregion

// ---- painting --------------------------------------------------------------

interface Sprite {
  canvas: HTMLCanvasElement
  /** Sprite pixels per unit of the circle's radius. */
  px: number
  /** The quill's base, in sprite pixels. */
  ox: number
  oy: number
}

/** A small tile of grey noise, multiplied over the washes for granulation. */
function paintNoise(rng: () => number) {
  const c = document.createElement("canvas")
  c.width = 96
  c.height = 96
  const ctx = c.getContext("2d")
  if (!ctx) return c
  const img = ctx.createImageData(96, 96)
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 190 + Math.floor(rng() * 65)
    img.data[i] = v
    img.data[i + 1] = v
    img.data[i + 2] = v
    img.data[i + 3] = 255
  }
  ctx.putImageData(img, 0, 0)
  return c
}

/** An eyed train feather, painted upright: quill at the bottom, eye at the top. */
function paintBlade(f: PplFeather, colors: PeacockTrainPalette, px: number, noise: HTMLCanvasElement, rng: () => number, beaded: boolean): Sprite {
  const W = f.half * px
  const L = f.len * px
  const pad = Math.ceil(W * 0.2 + 6)
  const c = document.createElement("canvas")
  c.width = Math.ceil(W * 2 + pad * 2)
  c.height = Math.ceil(L + pad * 2)
  const ctx = c.getContext("2d")
  const ox = c.width / 2
  const oy = c.height - pad
  if (!ctx) return { canvas: c, px, ox, oy }
  ctx.lineCap = "round"

  // The quill bows a little, so no two feathers are ruler-straight.
  const bow = (rng() - 0.5) * W * 0.5
  const shaftX = (u: number) => ox + bow * 4 * u * (1 - u)
  const shaftY = (u: number) => oy - L * u
  const eyeU = EYE_AT[Math.min(1, f.layer)]
  // Half width of the blade along the quill: a loose herl near the base, then
  // a leaf that peaks just under the eye and rounds off past it.
  const hw = (u: number) => {
    if (u <= 0.8) return W * (0.1 + 0.9 * pplSmooth(0.02, 0.82, u))
    const q = (u - 0.8) / 0.2
    return W * Math.sqrt(Math.max(0, 1 - q * q))
  }

  const outline = () => {
    ctx.beginPath()
    ctx.moveTo(shaftX(0), shaftY(0))
    for (let i = 0; i <= 60; i++) {
      const u = i / 60
      ctx.lineTo(shaftX(u) + hw(u), shaftY(u))
    }
    for (let i = 60; i >= 0; i--) {
      const u = i / 60
      ctx.lineTo(shaftX(u) - hw(u), shaftY(u))
    }
    ctx.closePath()
  }

  // A translucent wash body under the barbs.
  const body = ctx.createLinearGradient(0, oy, 0, oy - L)
  body.addColorStop(0, pplRgba(colors.barbBase, 0.05))
  body.addColorStop(0.3, pplRgba(colors.barbBase, 0.34))
  body.addColorStop(0.58, pplRgba(colors.barbMid, 0.6))
  body.addColorStop(0.86, pplRgba(colors.barbMid, 0.55))
  body.addColorStop(1, pplRgba(colors.barbTip, 0.45))
  outline()
  ctx.fillStyle = body
  ctx.fill()

  // Barbs: thousands of fine strokes fanning from the quill toward the edge,
  // sparse and wispy over the herl, dense and sweeping over the blade.
  const step = Math.max(0.8, 1.05 * (px / 300))
  const count = Math.floor(L / step)
  for (let i = 0; i < count; i++) {
    const u = (i + rng() * 0.6) / count
    if (u > 0.985) continue
    const herl = u < 0.2
    if (herl && rng() < 0.4) continue
    for (let side = -1; side <= 1; side += 2) {
      const u2 = Math.min(0.995, u + 0.04 + 0.07 * (1 - u))
      const reach = herl ? hw(u) * (0.7 + rng() * 0.9) : hw(u2) * (0.94 + rng() * 0.08)
      const x0 = shaftX(u)
      const y0 = shaftY(u)
      const x1 = x0 + side * reach
      const y1 = shaftY(herl ? u2 - 0.02 + rng() * 0.05 : u2)
      const cx = x0 + side * reach * 0.42
      const cy = y0 - L * 0.025
      // Colour: olive herl, emerald middle, cobalt toward the eye and the edge,
      // and a copper cast on the barbs nearest the quill.
      let col = pplMix(colors.barbBase, colors.barbMid, pplSmooth(0.06, 0.45, u))
      col = pplMix(col, colors.barbTip, pplSmooth(0.7, 0.99, u) * 0.75)
      const lat = reach / Math.max(1, W)
      col = pplMix(col, colors.barbTip, pplSmooth(0.55, 1, lat) * 0.7 * (0.4 + 0.6 * rng()))
      if (lat < 0.4 && !herl) col = pplMix(col, colors.eyeGold, (0.4 - lat) * 1.4 * (1 - u) * rng())
      const light = rng()
      if (light > 0.9) col = pplMix(col, colors.shaft, 0.3)
      else if (light < 0.12) col = pplMix(col, colors.eyeHeart, 0.3)
      ctx.strokeStyle = col
      ctx.globalAlpha = herl ? 0.22 + rng() * 0.22 : 0.5 + rng() * 0.4
      ctx.lineWidth = ((herl ? 0.55 : 0.7) + rng() * 0.7) * Math.max(0.8, px / 300)
      ctx.beginPath()
      ctx.moveTo(x0, y0)
      ctx.quadraticCurveTo(cx, cy, x1, y1)
      ctx.stroke()
    }
  }
  ctx.globalAlpha = 1

  // Granulation and a sheen, kept inside the blade.
  ctx.save()
  outline()
  ctx.clip()
  const pat = ctx.createPattern(noise, "repeat")
  if (pat) {
    ctx.globalCompositeOperation = "multiply"
    ctx.globalAlpha = 0.12
    ctx.fillStyle = pat
    ctx.fillRect(0, 0, c.width, c.height)
    ctx.globalCompositeOperation = "source-over"
  }
  const sheen = ctx.createRadialGradient(ox - W * 0.35, shaftY(0.62), 0, ox, shaftY(0.6), W * 1.6)
  sheen.addColorStop(0, "rgba(255,255,255,0.09)")
  sheen.addColorStop(1, "rgba(255,255,255,0)")
  ctx.globalAlpha = 1
  ctx.fillStyle = sheen
  ctx.fillRect(0, 0, c.width, c.height)
  ctx.restore()

  // Beads along the edge, for the ornamental preset.
  if (beaded) {
    const spacing = Math.max(6, W * 0.32)
    for (let side = -1; side <= 1; side += 2) {
      let acc = 0
      let prev = [shaftX(0.3), shaftY(0.3)]
      for (let i = 1; i <= 160; i++) {
        const u = 0.3 + (0.68 * i) / 160
        const p = [shaftX(u) + side * hw(u) * 0.84, shaftY(u)]
        acc += Math.hypot(p[0] - prev[0], p[1] - prev[1])
        prev = p
        if (acc >= spacing) {
          acc = 0
          ctx.fillStyle = pplRgba(colors.plumeEdge, 0.92)
          ctx.beginPath()
          ctx.arc(p[0], p[1], Math.max(1, W * 0.04), 0, Math.PI * 2)
          ctx.fill()
          ctx.fillStyle = "rgba(255,255,255,0.85)"
          ctx.beginPath()
          ctx.arc(p[0] - W * 0.01, p[1] - W * 0.01, Math.max(0.5, W * 0.017), 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }
  }

  // The quill, up to the eye.
  const quill = (w: number, col: string, a: number) => {
    ctx.strokeStyle = col
    ctx.globalAlpha = a
    ctx.lineWidth = w
    ctx.beginPath()
    ctx.moveTo(shaftX(0), shaftY(0))
    for (let i = 1; i <= 24; i++) {
      const u = (i / 24) * eyeU
      ctx.lineTo(shaftX(u), shaftY(u))
    }
    ctx.stroke()
  }
  quill(Math.max(1.2, W * 0.05), colors.shaft, 0.95)
  quill(Math.max(0.6, W * 0.018), pplMix(colors.barbBase, "#000000", 0.35), 0.45)
  ctx.globalAlpha = 1
  return { canvas: c, px, ox, oy }
}

/** The eye alone, painted at the scale of its feather; composed over the blade so it can open on its own. */
function paintEye(f: PplFeather, colors: PeacockTrainPalette, px: number, rng: () => number): Sprite {
  const W = f.half * px
  const rx = W * 0.5
  const ry = W * 0.64
  const pad = 4
  const c = document.createElement("canvas")
  c.width = Math.ceil(rx * 2 + pad * 2)
  c.height = Math.ceil(ry * 2 + pad * 2)
  const ctx = c.getContext("2d")
  const ox = c.width / 2
  const oy = c.height / 2
  if (!ctx) return { canvas: c, px, ox, oy }
  const ell = (x: number, y: number, a: number, b: number, fill: string) => {
    ctx.fillStyle = fill
    ctx.beginPath()
    ctx.ellipse(x, y, Math.max(0.5, a), Math.max(0.5, b), 0, 0, Math.PI * 2)
    ctx.fill()
  }
  // Bronze rim, soft at its outside.
  const rim = ctx.createRadialGradient(ox, oy, rx * 0.55, ox, oy, rx)
  rim.addColorStop(0, pplRgba(colors.eyeGold, 0.95))
  rim.addColorStop(0.75, pplRgba(colors.eyeGold, 0.8))
  rim.addColorStop(1, pplRgba(colors.eyeGold, 0))
  ctx.save()
  ctx.scale(1, ry / rx)
  ctx.fillStyle = rim
  ctx.beginPath()
  ctx.arc(ox, oy * (rx / ry), rx, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
  ell(ox, oy + ry * 0.02, rx * 0.8, ry * 0.8, colors.eyeGreen)
  ell(ox, oy + ry * 0.04, rx * 0.6, ry * 0.62, colors.eyeBlue)
  // The heart: a dark drop with a notch at its foot.
  ell(ox, oy - ry * 0.02, rx * 0.42, ry * 0.46, colors.eyeHeart)
  ell(ox, oy + ry * 0.4, rx * 0.14, ry * 0.12, colors.eyeBlue)
  // Iridescence: a lighter arc on the upper left of the blue ring, a small spark.
  ctx.strokeStyle = pplRgba("#ffffff", 0.35)
  ctx.lineWidth = Math.max(0.8, W * 0.04)
  ctx.beginPath()
  ctx.ellipse(ox, oy + ry * 0.04, rx * 0.52, ry * 0.54, 0, Math.PI * 1.05, Math.PI * 1.6)
  ctx.stroke()
  ctx.fillStyle = pplRgba("#ffffff", 0.55 + rng() * 0.2)
  ctx.beginPath()
  ctx.arc(ox - rx * 0.16, oy - ry * 0.22, Math.max(0.6, W * 0.045), 0, Math.PI * 2)
  ctx.fill()
  return { canvas: c, px, ox, oy }
}

/** An outer plume: a long watercolour wash, pale in the body and dipped in colour at its edges. */
function paintPlume(f: PplFeather, colors: PeacockTrainPalette, px: number, noise: HTMLCanvasElement, rng: () => number, beaded: boolean): Sprite {
  const W = f.half * px
  const L = f.len * px
  const pad = Math.ceil(W * 0.25 + 6)
  const c = document.createElement("canvas")
  c.width = Math.ceil(W * 2 + pad * 2)
  c.height = Math.ceil(L + pad * 2)
  const ctx = c.getContext("2d")
  const ox = c.width / 2
  const oy = c.height - pad
  if (!ctx) return { canvas: c, px, ox, oy }
  ctx.lineCap = "round"
  ctx.lineJoin = "round"

  const bow = (rng() - 0.5) * W * 0.6
  const p1 = rng() * 6.3
  const p2 = rng() * 6.3
  const p3 = rng() * 6.3
  const shaftX = (u: number) => ox + bow * 4 * u * (1 - u)
  const shaftY = (u: number) => oy - L * u
  // A petal that peaks past the middle, its edge roughened like a dried wash.
  const hw = (u: number, side: number) => {
    const petal = Math.pow(Math.sin(Math.PI * Math.pow(u, 0.9)), 0.8)
    const rough = 1 + 0.07 * Math.sin(u * 19 + p1 + side) + 0.05 * Math.sin(u * 37 + p2 - side * 2) + 0.03 * Math.sin(u * 71 + p3)
    return W * (0.1 + 0.9 * petal) * rough
  }
  const outline = () => {
    ctx.beginPath()
    ctx.moveTo(shaftX(0), shaftY(0))
    for (let i = 0; i <= 90; i++) {
      const u = i / 90
      ctx.lineTo(shaftX(u) + hw(u, 1), shaftY(u))
    }
    for (let i = 90; i >= 0; i--) {
      const u = i / 90
      ctx.lineTo(shaftX(u) - hw(u, -1), shaftY(u))
    }
    ctx.closePath()
  }

  const dark = pplLuma(colors.paper) < 128
  // Body: the wash, lighter where the paper shows through, tinted at the tip.
  const body = ctx.createLinearGradient(0, oy, 0, oy - L)
  body.addColorStop(0, pplRgba(colors.plume, dark ? 0.5 : 0.6))
  body.addColorStop(0.5, pplRgba(colors.plume, dark ? 0.66 : 0.82))
  body.addColorStop(0.84, pplRgba(colors.plume, 0.8))
  body.addColorStop(1, pplRgba(colors.plumeEdge, dark ? 0.55 : 0.4))
  outline()
  ctx.fillStyle = body
  ctx.fill()

  ctx.save()
  outline()
  ctx.clip()
  // The edge bleed: colour that crept in from the margin while the wash dried.
  // Several strokes, each half hidden outside the clip, widest and faintest first.
  for (let i = 5; i >= 0; i--) {
    ctx.strokeStyle = pplRgba(colors.plumeEdge, (dark ? 0.16 : 0.11) * (1 - i / 7))
    ctx.lineWidth = W * (0.12 + i * 0.09)
    outline()
    ctx.stroke()
  }
  // Pools where the colour gathered toward the tip.
  for (let i = 0; i < 4; i++) {
    const u = 0.62 + rng() * 0.33
    const side = rng() < 0.5 ? -1 : 1
    const x = shaftX(u) + side * hw(u, side) * (0.5 + rng() * 0.4)
    const y = shaftY(u)
    const r = W * (0.3 + rng() * 0.4)
    const pool = ctx.createRadialGradient(x, y, 0, x, y, r)
    pool.addColorStop(0, pplRgba(colors.plumeEdge, 0.32))
    pool.addColorStop(1, pplRgba(colors.plumeEdge, 0))
    ctx.fillStyle = pool
    ctx.fillRect(x - r, y - r, r * 2, r * 2)
  }
  // Faint barbs, so it still reads as a feather.
  const lines = Math.floor(L / Math.max(2.2, 3 * (px / 260)))
  for (let i = 0; i < lines; i++) {
    const u = (i + rng()) / lines
    for (let side = -1; side <= 1; side += 2) {
      const reach = hw(Math.min(0.99, u + 0.05), side) * (0.85 + rng() * 0.15)
      ctx.strokeStyle = pplRgba(colors.plumeEdge, 0.07 + rng() * 0.09)
      ctx.lineWidth = 0.7 + rng() * 0.5
      ctx.beginPath()
      ctx.moveTo(shaftX(u), shaftY(u))
      ctx.quadraticCurveTo(shaftX(u) + side * reach * 0.4, shaftY(u) - L * 0.02, shaftX(u) + side * reach, shaftY(Math.min(0.995, u + 0.06)))
      ctx.stroke()
    }
  }
  const pat = ctx.createPattern(noise, "repeat")
  if (pat) {
    ctx.globalCompositeOperation = "multiply"
    ctx.globalAlpha = 0.2
    ctx.fillStyle = pat
    ctx.fillRect(0, 0, c.width, c.height)
    ctx.globalCompositeOperation = "source-over"
    ctx.globalAlpha = 1
  }
  ctx.restore()

  if (beaded) {
    const spacing = Math.max(7, W * 0.22)
    for (let side = -1; side <= 1; side += 2) {
      let acc = 0
      let prev = [shaftX(0.1), shaftY(0.1)]
      for (let i = 1; i <= 200; i++) {
        const u = 0.1 + (0.87 * i) / 200
        const p = [shaftX(u) + side * hw(u, side) * 0.86, shaftY(u)]
        acc += Math.hypot(p[0] - prev[0], p[1] - prev[1])
        prev = p
        if (acc >= spacing) {
          acc = 0
          ctx.fillStyle = pplRgba(colors.plumeEdge, 0.9)
          ctx.beginPath()
          ctx.arc(p[0], p[1], Math.max(1, W * 0.028), 0, Math.PI * 2)
          ctx.fill()
          ctx.fillStyle = "rgba(255,255,255,0.9)"
          ctx.beginPath()
          ctx.arc(p[0], p[1], Math.max(0.5, W * 0.012), 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }
  }

  // Fringe: loose fibres past the edge toward the tip, where a wash feathers out.
  ctx.lineCap = "round"
  const hairs = Math.floor(L / Math.max(3, 4.5 * (px / 300)))
  for (let i = 0; i < hairs; i++) {
    const u = 0.42 + Math.pow(rng(), 0.6) * 0.56
    const side = rng() < 0.5 ? -1 : 1
    const x0 = shaftX(u) + side * hw(u, side) * 0.96
    const y0 = shaftY(u)
    const out = W * (0.05 + rng() * 0.16)
    const up = L * (0.008 + rng() * 0.03)
    ctx.strokeStyle = pplRgba(colors.plumeEdge, 0.12 + rng() * 0.26)
    ctx.lineWidth = (0.5 + rng() * 0.6) * Math.max(0.8, px / 300)
    ctx.beginPath()
    ctx.moveTo(x0 - side * out * 0.6, y0 + up * 0.4)
    ctx.quadraticCurveTo(x0 + side * out * 0.3, y0 - up * 0.3, x0 + side * out, y0 - up)
    ctx.stroke()
  }

  // A thin quill.
  ctx.strokeStyle = pplMix(colors.plume, colors.ink, 0.3)
  ctx.globalAlpha = 0.28
  ctx.lineWidth = Math.max(0.8, W * 0.02)
  ctx.beginPath()
  ctx.moveTo(shaftX(0), shaftY(0))
  for (let i = 1; i <= 24; i++) {
    const u = (i / 24) * 0.9
    ctx.lineTo(shaftX(u), shaftY(u))
  }
  ctx.stroke()
  ctx.globalAlpha = 1
  return { canvas: c, px, ox, oy }
}

// ---- styles ----------------------------------------------------------------

const PPL_CSS = `
.ppl-root { position: relative; width: 100%; background: var(--ppl-paper); color: var(--ppl-ink); isolation: isolate; }
.ppl-root[data-done="false"] { overflow: hidden; }
.ppl-veil {
  position: absolute; inset: 0; z-index: 2; overflow: hidden; outline: none;
  transition: opacity 650ms cubic-bezier(.65,0,.35,1);
  -webkit-font-smoothing: antialiased; cursor: pointer;
}
.ppl-veil:focus-visible .ppl-count { text-decoration: underline; text-underline-offset: 4px; }
.ppl-veil[data-phase="after"], .ppl-veil[data-phase="done"] { opacity: 0; pointer-events: none; }
.ppl-veil canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; max-width: none; }
.ppl-bird { position: absolute; left: 0; top: 0; display: block; max-width: none; pointer-events: none; will-change: transform, opacity; }
.ppl-corner {
  position: absolute; z-index: 1; display: flex; flex-direction: column; gap: 6px;
  font-family: var(--ppl-mono); font-size: 10px; letter-spacing: .24em; text-transform: uppercase;
  transition: opacity 500ms ease;
}
.ppl-tl { left: clamp(18px, 3vw, 40px); top: clamp(18px, 3vw, 34px); opacity: .62; }
.ppl-tr { right: clamp(18px, 3vw, 40px); top: clamp(18px, 3vw, 34px); text-align: right; align-items: flex-end; }
.ppl-count { font-size: 12px; letter-spacing: .14em; font-variant-numeric: tabular-nums; }
.ppl-count small { font-size: 9px; opacity: .55; margin-left: 2px; letter-spacing: .1em; }
.ppl-rule { width: 64px; height: 1px; background: currentColor; opacity: .22; position: relative; overflow: hidden; }
.ppl-rule i { position: absolute; left: 0; top: 0; bottom: 0; background: currentColor; opacity: 1; transform-origin: left; transform: scaleX(var(--ppl-p, 0)); width: 100%; transition: transform 200ms linear; }
.ppl-poster {
  position: absolute; left: 0; right: 0; bottom: clamp(20px, 4.5vh, 48px); z-index: 1; text-align: center;
  display: flex; flex-direction: column; align-items: center; gap: 10px; pointer-events: none;
  transition: opacity 500ms ease, transform 700ms cubic-bezier(.2,.7,.1,1);
}
.ppl-meta { margin: 0; font-family: var(--ppl-mono); font-size: 9px; letter-spacing: .2em; text-transform: uppercase; line-height: 1.9; opacity: .6; }
.ppl-title { margin: 0; font-family: var(--ppl-serif); font-weight: 600; font-size: clamp(32px, 6vw, 68px); line-height: .95; letter-spacing: .06em; text-transform: uppercase; }
.ppl-sub { margin: 0; font-family: var(--ppl-mono); font-size: 11px; letter-spacing: .5em; text-indent: .5em; opacity: .75; }
.ppl-veil[data-phase="gate"] .ppl-corner, .ppl-veil[data-phase="gate"] .ppl-poster { opacity: 0; }
.ppl-veil[data-phase="gate"] .ppl-poster { transform: translateY(12px); }
.ppl-after {
  position: absolute; inset: 0; z-index: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px;
  text-align: center; opacity: 0; transform: translateY(10px); pointer-events: none; cursor: pointer;
  transition: opacity 800ms ease 150ms, transform 1000ms cubic-bezier(.2,.7,.1,1) 150ms;
}
.ppl-root[data-phase="after"] .ppl-after { opacity: 1; transform: none; pointer-events: auto; }
.ppl-after svg { display: block; width: 26px; height: 34px; opacity: .9; }
.ppl-message { margin: 0; font-family: var(--ppl-serif); font-style: italic; font-weight: 400; font-size: clamp(28px, 4.6vw, 54px); line-height: 1; letter-spacing: .01em; }
.ppl-replay { font-family: var(--ppl-mono); font-size: 10px; letter-spacing: .24em; text-transform: uppercase; opacity: .5; }
.ppl-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
@media (prefers-reduced-motion: reduce) {
  .ppl-veil, .ppl-corner, .ppl-poster, .ppl-after, .ppl-rule i { transition-duration: 1ms; }
  .ppl-veil[data-phase="gate"] .ppl-corner, .ppl-veil[data-phase="gate"] .ppl-poster { opacity: 1; transform: none; }
  .ppl-veil[data-phase="gate"] .ppl-tl { opacity: .62; }
}
`

// ---- component -------------------------------------------------------------

export default function PeacockTrainPreloader({
  children,
  loop = false,
  progress,
  durationMs = 5800,
  preset = "ivory",
  palette,
  density = "full",
  spread = 300,
  seed = 3,
  title = "ATELIER",
  subtitle = "2026",
  meta = ["Winter 2026", "Portfolio · Edition I"],
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
  const rootRef = React.useRef(null as HTMLDivElement | null)
  const veilRef = React.useRef(null as HTMLDivElement | null)
  const canvasRef = React.useRef(null as HTMLCanvasElement | null)
  const birdRef = React.useRef(null as SVGSVGElement | null)
  const ruleRef = React.useRef(null as HTMLElement | null)
  const [phase, setPhase] = React.useState("load" as "load" | "hold" | "gate" | "after" | "done")
  const [pct, setPct] = React.useState(0)
  const [run, setRun] = React.useState(0)
  const phaseRef = React.useRef(phase)
  phaseRef.current = phase
  const progressRef = React.useRef(progress)
  progressRef.current = progress
  const onCompleteRef = React.useRef(onComplete)
  onCompleteRef.current = onComplete
  const rushRef = React.useRef(false)
  const optsRef = React.useRef({ colors, density, spread, seed, durationMs, loop, preset })
  optsRef.current = { colors, density, spread, seed, durationMs, loop, preset }
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
    const beaded = o.preset === "opal" && !(palette && palette.plume)
    const dark = pplLuma(o.colors.paper) < 128

    let w = 1
    let h = 1
    let dpr = 1
    let cx = 0
    let cy = 0
    let r0 = 100
    let raf = 0
    let shown = 0
    let holdAt = -1
    let gateAt = -1
    let started = performance.now()
    let pctLast = -1
    let localPhase = "load"
    let noise = null as HTMLCanvasElement | null
    let paper = null as HTMLCanvasElement | null
    let feathers = pplBuild(pplCounts(o.density), o.spread, o.seed)
    let blades = [] as Sprite[][]
    let eyes = [] as Sprite[][]
    const lifts = new Float32Array(feathers.length)
    let lean = 0
    let leanTarget = 0
    let pointer = null as null | { a: number; d: number }

    const setLocal = (p: string) => {
      localPhase = p
      setPhase(p as "load" | "hold" | "gate" | "after" | "done")
    }

    const layout = () => {
      const rect = root.getBoundingClientRect()
      w = Math.max(1, Math.round(rect.width))
      h = Math.max(1, Math.round(rect.height))
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      const R = Math.min(w, h * 0.78) / 2
      r0 = (R * 0.93) / PPL_REACH
      cx = w / 2
      cy = h * (h > w ? 0.44 : 0.46)
      feathers = pplBuild(pplCounts(o.density), o.spread, o.seed)
      noise = paintNoise(pplRng(o.seed + 11))

      // Paper: the base colour, a soft glow gathered behind the train, a whiter
      // circle where the bird stands, grain. Painted once.
      paper = document.createElement("canvas")
      paper.width = canvas.width
      paper.height = canvas.height
      const p = paper.getContext("2d")
      if (p) {
        p.setTransform(dpr, 0, 0, dpr, 0, 0)
        p.fillStyle = o.colors.paper
        p.fillRect(0, 0, w, h)
        const halo = p.createRadialGradient(cx, cy, r0 * 0.6, cx, cy, r0 * 3.6)
        halo.addColorStop(0, pplRgba(o.colors.glow, dark ? 0.12 : 0.55))
        halo.addColorStop(0.45, pplRgba(o.colors.glow, dark ? 0.05 : 0.18))
        halo.addColorStop(1, pplRgba(o.colors.glow, 0))
        p.fillStyle = halo
        p.fillRect(0, 0, w, h)
        const shade = p.createRadialGradient(cx, cy, r0 * 0.9, cx, cy, r0 * 3.3)
        shade.addColorStop(0, pplRgba(o.colors.ink, 0))
        shade.addColorStop(0.5, pplRgba(o.colors.ink, dark ? 0 : 0.05))
        shade.addColorStop(1, pplRgba(o.colors.ink, 0))
        p.fillStyle = shade
        p.fillRect(0, 0, w, h)
        const vig = p.createRadialGradient(cx, cy, Math.min(w, h) * 0.4, cx, cy, Math.hypot(w, h) * 0.62)
        vig.addColorStop(0, "rgba(0,0,0,0)")
        vig.addColorStop(1, dark ? "rgba(0,0,0,0.5)" : pplRgba(o.colors.ink, 0.07))
        p.fillStyle = vig
        p.fillRect(0, 0, w, h)
        if (noise) {
          const pat = p.createPattern(noise, "repeat")
          if (pat) {
            p.globalCompositeOperation = dark ? "screen" : "multiply"
            p.globalAlpha = dark ? 0.035 : 0.09
            p.fillStyle = pat
            p.fillRect(0, 0, w, h)
            p.globalCompositeOperation = "source-over"
            p.globalAlpha = 1
          }
        }
      }

      // Feather sprites: three variants per ring, painted a little over display size
      // so they stay crisp as the train rushes forward.
      const px = Math.min(1800 / LAYER_LEN[2], r0 * Math.max(2, dpr * 1.5))
      blades = []
      eyes = []
      for (let layer = 0; layer < 3; layer++) {
        const sample = feathers.find((f) => f.layer === layer) as PplFeather
        blades[layer] = []
        eyes[layer] = []
        for (let v = 0; v < 3; v++) {
          const rng = pplRng(o.seed * 1013 + layer * 97 + v * 7 + 5)
          const f = { ...sample, len: LAYER_LEN[layer] }
          if (layer === 2) {
            blades[layer][v] = paintPlume(f, o.colors, px, noise as HTMLCanvasElement, rng, beaded)
          } else {
            blades[layer][v] = paintBlade(f, o.colors, px, noise as HTMLCanvasElement, rng, beaded)
            eyes[layer][v] = paintEye(f, o.colors, px, rng)
          }
        }
      }

      // The bird stands at the foot of the circle, its head near the centre.
      const bird = birdRef.current
      if (bird) {
        const bh = r0 * 1.62
        const bw = bh * (100 / 140)
        bird.setAttribute("width", String(bw))
        bird.setAttribute("height", String(bh))
        bird.style.left = cx - bw / 2 + "px"
        bird.style.top = cy + r0 * 0.92 - bh + "px"
        bird.style.transformOrigin = "50% 100%"
      }
    }

    const onMove = (e: PointerEvent) => {
      const rect = root.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      leanTarget = ((x - cx) / Math.max(1, w)) * 2 * 2.4
      const dx = x - cx
      const dy = y - cy
      pointer = { a: (Math.atan2(dx, -dy) * 180) / Math.PI, d: Math.hypot(dx, dy) / Math.max(1, r0) }
    }
    const onLeave = () => {
      leanTarget = 0
      pointer = null
    }

    const frame = (now: number) => {
      const opts = optsRef.current
      const ph = localPhase

      if (ph === "load") {
        const real = progressRef.current
        const t = (now - started) / Math.max(800, opts.durationMs)
        let target = real === undefined ? pplSimulated(t) : Math.max(0, Math.min(100, Number(real) || 0))
        if (rushRef.current) target = 100
        shown = reduced ? Math.max(shown, target) : Math.max(shown, shown + (target - shown) * (rushRef.current ? 0.11 : 0.085))
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
      } else if (ph === "hold" && now - holdAt > HOLD_MS) {
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

      const p01 = shown / 100
      lean += (leanTarget - lean) * 0.06
      const breath = reduced ? 1 : 1 + 0.006 * Math.sin(now / 2300)
      const gate = ph === "gate" ? pplGate(reduced ? 0 : Math.min(1, (now - gateAt) / GATE_MS), r0, w, h) : null
      const zoom = gate ? gate.scale : 1

      // The window in the paper, and the bird leaving through it. With reduced
      // motion there is no rush forward: the whole veil simply fades.
      if (gate) {
        if (reduced) {
          veil.style.opacity = String(1 - Math.min(1, (now - gateAt) / 700))
        } else {
          const hole = gate.hole
          const m = "radial-gradient(circle at " + cx + "px " + cy + "px, transparent " + Math.max(0, hole - 1) + "px, #000 " + (hole + 1) + "px)"
          veil.style.setProperty("-webkit-mask-image", m)
          veil.style.setProperty("mask-image", m)
        }
      }
      const bird = birdRef.current
      if (bird) {
        const k = gate ? Math.min(1, (now - gateAt) / (GATE_MS * 0.55)) : 0
        const s = reduced ? 1 : 1 + k * k * 0.9
        bird.style.opacity = String(1 - pplSmooth(0.1, 0.9, k))
        bird.style.transform = "translateY(" + (reduced ? 0 : -k * r0 * 0.25) + "px) scale(" + s + ")"
      }

      // Paper, then the train, back to front.
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      if (paper) ctx.drawImage(paper, 0, 0)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const holdK = ph === "hold" ? (now - holdAt) / HOLD_MS : ph === "gate" ? 1 : -1
      const sweep = -opts.spread / 2 - 30 + (opts.spread + 60) * pplSmooth(0.05, 0.75, holdK)
      const glints = [] as number[]

      for (let i = 0; i < feathers.length; i++) {
        const f = feathers[i]
        const open = pplOpen(p01, f.layer)
        if (open <= 0.001) continue
        const alpha = pplSmooth(0, 0.22, open) * (f.layer === 2 ? 0.96 : 1)
        if (alpha <= 0.002) continue
        const sway = reduced ? 0 : Math.sin(now / 1500 + f.phase) * (0.45 + f.layer * 0.25)
        const layerLean = lean * (0.8 + f.layer * 0.25)
        const angle = (reduced ? f.theta : pplFan(f.theta, open)) + f.tilt * open + sway + layerLean
        // Feathers under the pointer lift a little.
        let lift = 0
        if (pointer && !gate && !reduced) {
          const band = pplSmooth(0.55, 1.05, pointer.d) * (1 - pplSmooth(3.3, 4.1, pointer.d))
          const d = pplAngleDiff(angle, pointer.a)
          lift = Math.exp(-(d * d) / 160) * band
        }
        lifts[i] += (lift - lifts[i]) * 0.14
        const l = lifts[i]
        const grow = 0.6 + 0.4 * pplOutQuart(open)
        // Sprites are painted at the ring's nominal length; each feather's own length is a scale on them.
        const nominal = LAYER_LEN[f.layer]
        const sc = zoom * breath * grow * (1 + 0.045 * l) * (f.len / nominal)
        const sp = blades[f.layer][f.variant]
        if (!sp) continue
        const k = r0 / sp.px

        ctx.save()
        ctx.translate(cx, cy)
        ctx.rotate((angle * Math.PI) / 180)
        ctx.translate(0, -f.base * r0 * zoom * breath)
        ctx.scale(sc * k, sc * k)
        if (f.mirror) ctx.scale(-1, 1)
        ctx.globalAlpha = alpha
        ctx.drawImage(sp.canvas, -sp.ox, -sp.oy)
        // The eye opens once its feather has nearly settled.
        if (f.layer < 2) {
          const pop = pplSmooth(0.7, 1, open)
          if (pop > 0) {
            const eye = eyes[f.layer][f.variant]
            const eyeU = EYE_AT[f.layer]
            const es = pplBackOut(pop)
            ctx.save()
            ctx.translate(0, -nominal * sp.px * eyeU)
            ctx.scale(es, es)
            ctx.globalAlpha = alpha * Math.min(1, pop * 1.6)
            ctx.drawImage(eye.canvas, -eye.ox, -eye.oy)
            ctx.restore()
            // Glint: when the eye opens, when the hold's sweep passes, under the pointer, and a slow twinkle.
            let g = Math.sin(Math.PI * pplSmooth(0.75, 1, open)) * 0.55 * (open < 1 ? 1 : 0)
            if (holdK >= 0) g = Math.max(g, 0.85 * Math.exp(-Math.pow(pplAngleDiff(angle, sweep) / 10, 2)))
            g = Math.max(g, 0.55 * l)
            if (!reduced) g = Math.max(g, 0.14 * Math.pow(0.5 + 0.5 * Math.sin(now / 900 + f.phase * 3), 8))
            if (g > 0.02 && !reduced) {
              const dist = (f.base * zoom * breath + nominal * eyeU * sc) * r0
              const ex = cx + Math.sin((angle * Math.PI) / 180) * dist
              const ey = cy - Math.cos((angle * Math.PI) / 180) * dist
              glints.push(ex, ey, g * alpha, f.half * r0 * sc * 1.6)
            }
          }
        }
        ctx.restore()
      }

      // Glints, added on top with light.
      if (glints.length) {
        ctx.globalCompositeOperation = "screen"
        for (let i = 0; i < glints.length; i += 4) {
          const r = glints[i + 3]
          const gr = ctx.createRadialGradient(glints[i], glints[i + 1], 0, glints[i], glints[i + 1], r)
          gr.addColorStop(0, "rgba(255,255,255," + Math.min(1, glints[i + 2] * 0.85) + ")")
          gr.addColorStop(1, "rgba(255,255,255,0)")
          ctx.fillStyle = gr
          ctx.fillRect(glints[i] - r, glints[i + 1] - r, r * 2, r * 2)
        }
        ctx.globalCompositeOperation = "source-over"
      }
      ctx.globalAlpha = 1
    }

    layout()
    veil.style.removeProperty("-webkit-mask-image")
    veil.style.removeProperty("mask-image")
    veil.style.opacity = ""
    started = performance.now()
    raf = requestAnimationFrame(frame)
    const ro = new ResizeObserver(() => layout())
    ro.observe(root)
    root.addEventListener("pointermove", onMove)
    root.addEventListener("pointerleave", onLeave)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      root.removeEventListener("pointermove", onMove)
      root.removeEventListener("pointerleave", onLeave)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, colorKey, density, spread, seed])

  // In loop mode the greeting holds, then the train folds and fans again.
  React.useEffect(() => {
    if (phase !== "after" || !loop) return
    const t = setTimeout(() => replay(), AFTER_MS)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, loop])

  const replay = () => {
    rushRef.current = false
    setPct(0)
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
  const birdDark = pplLuma(colors.paper) < 128
  const birdBody = birdDark ? pplMix(colors.paper, "#ffffff", 0.82) : "#fbf8f1"
  const birdShade = birdDark ? pplMix(colors.bird, colors.paper, 0.45) : pplMix(colors.paper, colors.ink, 0.22)

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
          <svg ref={birdRef} className="ppl-bird" viewBox="0 0 100 140" aria-hidden="true">
            <defs>
              <linearGradient id={"ppl-neck-" + preset} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={pplMix(colors.bird, colors.barbMid, 0.5)} />
                <stop offset="0.6" stopColor={colors.bird} />
                <stop offset="1" stopColor={pplMix(colors.bird, birdBody, 0.5)} />
              </linearGradient>
              <radialGradient id={"ppl-body-" + preset} cx="0.36" cy="0.32" r="0.85">
                <stop offset="0" stopColor={birdBody} />
                <stop offset="0.65" stopColor={pplMix(birdBody, birdShade, 0.3)} />
                <stop offset="1" stopColor={birdShade} />
              </radialGradient>
            </defs>
            {/* ground shadow */}
            <ellipse cx="50" cy="137" rx="17" ry="2" fill={pplRgba(colors.ink, birdDark ? 0.4 : 0.1)} />
            {/* tail coverts, trailing back toward the train */}
            <g stroke={pplMix(colors.bird, colors.barbMid, 0.6)} strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.55">
              <path d="M 66 100 C 74 94 80 86 84 76" />
              <path d="M 68 104 C 77 100 84 94 90 86" />
              <path d="M 69 109 C 78 108 86 104 93 98" />
            </g>
            {/* legs */}
            <g stroke={pplMix(colors.ink, colors.eyeGold, 0.5)} strokeWidth="1.3" strokeLinecap="round" fill="none" opacity="0.8">
              <path d="M 46 122 L 44 135 M 44 135 L 39 137 M 44 135 L 45 138 M 44 135 L 49 137" />
              <path d="M 56 122 L 58 135 M 58 135 L 53 137 M 58 135 L 59 138 M 58 135 L 63 137" />
            </g>
            {/* body */}
            <path d="M 36 120 C 23 113 21 94 30 83 C 39 71 58 70 70 81 C 81 91 82 110 71 119 C 61 128 47 127 36 120 Z" fill={"url(#ppl-body-" + preset + ")"} />
            {/* folded wing */}
            <path d="M 46 84 C 58 82 70 90 72 104 C 66 96 56 92 44 94 Z" fill={pplRgba(colors.bird, birdDark ? 0.35 : 0.14)} />
            <path d="M 48 86 C 60 86 69 94 71 106" fill="none" stroke={pplRgba(colors.ink, 0.2)} strokeWidth="0.9" strokeLinecap="round" />
            {/* neck, wider at the shoulders */}
            <path d="M 41 90 C 36 80 42 68 42 58" fill="none" stroke={"url(#ppl-neck-" + preset + ")"} strokeWidth="8.5" strokeLinecap="round" />
            <path d="M 42 60 C 42 50 39 40 41 31" fill="none" stroke={"url(#ppl-neck-" + preset + ")"} strokeWidth="6.2" strokeLinecap="round" />
            {/* head */}
            <circle cx="41.5" cy="28.5" r="6.2" fill={pplMix(colors.bird, colors.barbMid, 0.45)} />
            <ellipse cx="39.6" cy="28.6" rx="2.4" ry="1.7" fill="#ffffff" opacity="0.9" />
            <circle cx="39.8" cy="27.6" r="1.4" fill={colors.eyeHeart} />
            <circle cx="39.4" cy="27.2" r="0.45" fill="#ffffff" />
            <path d="M 35.6 28 L 27.5 29.6 L 35.9 31.6 Z" fill={pplMix(colors.eyeGold, colors.ink, 0.3)} />
            {/* crest */}
            <g stroke={colors.bird} strokeWidth="0.8" strokeLinecap="round" fill="none">
              <path d="M 41.5 22.5 C 38.5 18 34.5 14.5 30.5 11.5" />
              <path d="M 41.5 22.5 C 40 17 38 12.5 36.5 8.5" />
              <path d="M 41.5 22.5 C 42 17 42.5 11.5 43.5 6.5" />
              <path d="M 41.5 22.5 C 44 18 47 13.5 50 9.5" />
              <path d="M 41.5 22.5 C 45 19 49 16 53.5 13.5" />
            </g>
            <g fill={colors.bird}>
              <ellipse cx="30" cy="10.7" rx="1.7" ry="2.3" transform="rotate(-40 30 10.7)" />
              <ellipse cx="36.1" cy="7.5" rx="1.7" ry="2.3" transform="rotate(-18 36.1 7.5)" />
              <ellipse cx="43.7" cy="5.5" rx="1.7" ry="2.3" />
              <ellipse cx="50.5" cy="8.5" rx="1.7" ry="2.3" transform="rotate(30 50.5 8.5)" />
              <ellipse cx="54.3" cy="12.9" rx="1.7" ry="2.3" transform="rotate(55 54.3 12.9)" />
            </g>
          </svg>
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
          {title || subtitle || (meta && meta.length) ? (
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
              {title ? <h1 className="ppl-title">{title}</h1> : null}
              {subtitle ? <p className="ppl-sub">{subtitle}</p> : null}
            </div>
          ) : null}
        </div>
      ) : null}
      {loop && message ? (
        <div className="ppl-after" onClick={onActivate} aria-hidden={phase !== "after"}>
          <svg viewBox="0 0 26 34" aria-hidden="true">
            <path d="M13 33 C13 26 13 20 13 14" stroke={colors.shaft} strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <ellipse cx="13" cy="12" rx="8" ry="10" fill={colors.eyeGold} />
            <ellipse cx="13" cy="12.4" rx="6.3" ry="8" fill={colors.eyeGreen} />
            <ellipse cx="13" cy="12.8" rx="4.6" ry="6" fill={colors.eyeBlue} />
            <ellipse cx="13" cy="12" rx="3.2" ry="4.4" fill={colors.eyeHeart} />
            <ellipse cx="13" cy="17" rx="1.1" ry="0.9" fill={colors.eyeBlue} />
            <circle cx="11.6" cy="9.6" r="0.6" fill="#fff" opacity="0.8" />
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
