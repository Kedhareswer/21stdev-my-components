"use client"

import * as React from "react"

/**
 * Crimson Eclipse Landing — a preloader that becomes the page it was loading.
 *
 * A thin red ring counts to 100 on black. At 100 it ignites, drifts up and
 * shrinks until it *is* the eclipse hanging over the landing page, then an
 * iris opens outward from it and the camera settles back through a red maple
 * canopy onto a flooded floor that mirrors the whole scene.
 *
 * Nothing is an asset. The canopy is ~110k leaves grown once per size from a
 * seed into three depth layers; the eclipse, the petals, the wisps, the light
 * rain, the embers, the reflection and the ripples are drawn every frame.
 * `hue` recolours the entire world — foliage, water, light and type.
 *
 * Interactive: the canopy parallaxes with the pointer, petals are blown away
 * from it, a click scatters a gust of petals (and rings the water below the
 * horizon), and the eclipse itself is a button that replays the intro.
 *
 * Self-contained: React is the only import, one 2D canvas, a scoped style
 * block, no fonts to download.
 */

export type CrimsonEclipseNavItem = { label: string; href?: string }

export type IntroPhase = "load" | "ignite" | "reveal" | "landing"

export interface CrimsonEclipseLandingProps {
  /** The big word. Set in a thin, wide serif. */
  title?: string
  /** Small, very widely tracked line above the title (and above the loader ring). */
  eyebrow?: string
  /** Top navigation. `href` defaults to "#", which does not jump. */
  navItems?: CrimsonEclipseNavItem[]
  /** Index of the nav item marked current. */
  activeNav?: number
  /** Called on every nav click, after the active item has moved. */
  onNavigate?: (item: CrimsonEclipseNavItem, index: number, event: React.MouseEvent<HTMLAnchorElement>) => void
  /** Small red line at the foot of the page. Empty string hides it. */
  kanji?: string
  /** Footer lines under the kanji. */
  tagline?: string[]
  /** Status lines the loader steps through as the count climbs. */
  loadingLabels?: string[]
  /** Hue of the whole world, 0–360. 354 is crimson; try 212, 280 or 18. */
  hue?: number
  /** Seed the canopy is grown from. Same seed, same trees. */
  seed?: number
  /** Petals in the air at once. */
  petalCount?: number
  /** Length of the simulated load, in ms. Ignored when `progress` is set. */
  durationMs?: number
  /**
   * Drive the loader from real work, 0–100. The ring eases toward it and the
   * intro plays out once it reaches 100. Leave unset to simulate a load.
   */
  progress?: number
  /** Start on the landing page with no intro. */
  skipIntro?: boolean
  /** Make the eclipse a button that replays the intro. */
  replayOnEclipse?: boolean
  /** Fired when the intro has fully opened onto the landing page. */
  onIntroComplete?: () => void
  /** Font stack for the title and counter. */
  titleFont?: string
  /** Root height. A definite length — never a percentage. */
  height?: string
  /** Extra root class names */
  className?: string
}

const DEFAULT_NAV: CrimsonEclipseNavItem[] = [
  { label: "HOME PAGE" },
  { label: "ABOUT ME" },
  { label: "PORTFOLIO" },
  { label: "CONTACT ME" },
]

const DEFAULT_TAGLINE = [
  "DESIGN CREATES CULTURE. CULTURE SHAPES VALUES.",
  "VALUES DETERMINE THE FUTURE.",
]

const DEFAULT_LABELS = [
  "GATHERING PETALS",
  "GROWING THE CANOPY",
  "FLOODING THE FLOOR",
  "KINDLING THE ECLIPSE",
]

const DEFAULT_FONT =
  '"Cinzel", "Cormorant Garamond", "Trajan Pro", "Optima", "Didot", "Times New Roman", serif'

// Where things sit, as fractions of the root. Shared by the canvas and the DOM.
const ECLIPSE_Y = 0.28
const HORIZON = 0.73
const PAD = 0.08

// #region intro
export const IGNITE_MS = 1100
export const REVEAL_MS = 1700

/** Clamp to [0, 1]. NaN becomes 0 rather than leaking into geometry. */
export function clamp01(x: number): number {
  return x > 0 ? (x < 1 ? x : 1) : 0
}

export function smoothstep(a: number, b: number, x: number): number {
  if (a === b) return x < a ? 0 : 1
  const t = clamp01((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}

export function easeInOutCubic(x: number): number {
  const t = clamp01(x)
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

export function easeOutCubic(x: number): number {
  return 1 - Math.pow(1 - clamp01(x), 3)
}

/**
 * Simulated load, 0–100 over t in [0, 1]: a quick climb, a stall in the
 * 61–68 band the way a real asset queue hangs on its largest file, then a
 * surge. Monotonic — a counter that ticks backwards reads as broken.
 */
export function introProgress(t: number): number {
  const p = clamp01(t)
  if (p < 0.4) return 61 * (1 - Math.pow(1 - p / 0.4, 2))
  if (p < 0.72) return 61 + 7 * ((p - 0.4) / 0.32)
  const s = (p - 0.72) / 0.28
  return 68 + 32 * (s * s * (3 - 2 * s))
}

/** Which phase the intro is in, `ms` after the count reached 100. */
export function afterLoad(ms: number): IntroPhase {
  if (!(ms >= 0)) return "load"
  if (ms < IGNITE_MS) return "ignite"
  if (ms < IGNITE_MS + REVEAL_MS) return "reveal"
  return "landing"
}

/** Small, fast, seedable PRNG. Returns floats in [0, 1). */
export function mulberry32(seed: number) {
  let a = seed >>> 0
  return function () {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * How much canopy grows at (u, v), both fractions of the viewport. Dense at
 * the sides and overhead, a dark pocket around the eclipse, a shaft beneath
 * it down to the water, and nothing below the horizon. Mirror-symmetric.
 * `aspect` is width / height: on a tall screen the pocket widens, or the
 * eclipse ends up walled in by leaves.
 */
export function foliageDensity(u: number, v: number, ey: number, horizon: number, aspect = 1.6): number {
  if (!(v <= horizon + 0.02)) return 0
  const dx = Math.abs(u - 0.5)
  const k = Math.min(2.1, Math.pow(Math.max(1, 1.6 / (aspect > 0 ? aspect : 1.6)), 0.8))
  const px = dx / (0.16 * k)
  const py = (v - (ey + 0.05)) / 0.21
  let d = smoothstep(0.7, 1.4, Math.sqrt(px * px + py * py))
  const shaft = smoothstep(0.07 * k, 0.19 * k, dx)
  const below = smoothstep(ey, ey + 0.18, v)
  d *= 1 - below + below * shaft
  if (v > 0.58) d *= smoothstep(0.2, 0.36, dx)
  d *= 0.42 + 0.36 * smoothstep(0.12, 0.42, dx) + 0.3 * (1 - clamp01(v / 0.5))
  return clamp01(d)
}
// #endregion

// ---------------------------------------------------------------------------
// Scene building — runs once per size, never per frame
// ---------------------------------------------------------------------------

type Scene = {
  far: HTMLCanvasElement
  mid: HTMLCanvasElement
  near: HTMLCanvasElement
  floor: HTMLCanvasElement
  petal: HTMLCanvasElement
  wisp: HTMLCanvasElement
  grain: HTMLCanvasElement
}

type LayerSpec = {
  clusters: number
  rMin: number
  rMax: number
  leaves: number
  lMin: number
  lMax: number
  dpr: number
  near?: boolean
}

function makeCanvas(w: number, h: number) {
  const c = document.createElement("canvas")
  c.width = Math.max(1, Math.round(w))
  c.height = Math.max(1, Math.round(h))
  return c
}

function hsl(h: number, s: number, l: number, a = 1) {
  return "hsla(" + h.toFixed(1) + "," + s.toFixed(1) + "%," + l.toFixed(1) + "%," + a.toFixed(3) + ")"
}

function mapleLeaf() {
  const p = new Path2D()
  for (let k = 0; k < 10; k++) {
    const a = -Math.PI / 2 + (k * Math.PI) / 5
    const r = k % 2 === 0 ? (k === 4 || k === 6 ? 0.7 : 1) : 0.34
    const x = Math.cos(a) * r
    const y = Math.sin(a) * r
    if (k === 0) p.moveTo(x, y)
    else p.lineTo(x, y)
  }
  p.closePath()
  return p
}

function bladeLeaf() {
  const p = new Path2D()
  p.moveTo(0, -1)
  p.bezierCurveTo(0.55, -0.45, 0.45, 0.55, 0, 1)
  p.bezierCurveTo(-0.45, 0.55, -0.55, -0.45, 0, -1)
  p.closePath()
  return p
}

function branch(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  ang: number,
  len: number,
  wid: number,
  depth: number,
  rand: () => number,
) {
  const x2 = x + Math.cos(ang) * len
  const y2 = y + Math.sin(ang) * len
  const bend = (rand() - 0.5) * len * 0.45
  const mx = (x + x2) / 2 + Math.cos(ang + Math.PI / 2) * bend
  const my = (y + y2) / 2 + Math.sin(ang + Math.PI / 2) * bend
  g.lineWidth = Math.max(0.6, wid)
  g.beginPath()
  g.moveTo(x, y)
  g.quadraticCurveTo(mx, my, x2, y2)
  g.stroke()
  if (depth <= 0) return
  // limbs lean in toward the middle, so the two sides arch over the eclipse
  const lean = 0.06
  branch(g, x2, y2, ang - 0.28 - rand() * 0.42 + lean, len * (0.66 + rand() * 0.14), wid * 0.64, depth - 1, rand)
  branch(g, x2, y2, ang + 0.22 + rand() * 0.42 + lean, len * (0.62 + rand() * 0.14), wid * 0.62, depth - 1, rand)
}

/**
 * Grows one depth layer. A generator that yields after every clump, so the
 * caller can spread the ~110k leaf fills over several frames instead of
 * freezing the page for half a second.
 */
function* buildLayer(
  spec: LayerSpec,
  w: number,
  h: number,
  hue: number,
  rand: () => number,
  trunks: Array<[number, number, number, number, number, number]>,
  blur: number,
): Generator<void, HTMLCanvasElement> {
  const d = spec.dpr
  const W = w * (1 + 2 * PAD)
  const H = h * (1 + 2 * PAD)
  const c = makeCanvas(W * d, H * d)
  const g = c.getContext("2d")!
  const ox = PAD * w
  const oy = PAD * h
  const M = Math.max(w, h)
  const m = Math.min(w, h)
  const lx = w / 2
  const ly = ECLIPSE_Y * h

  // Trunks and limbs first, so leaves grow over them. Drawn twice, the second
  // time mirrored, with the generator still running so the sides differ.
  g.strokeStyle = hsl(hue, 55, 3.2)
  g.lineCap = "round"
  for (const [u, v, a, len, wid, depth] of trunks) {
    for (let side = 0; side < 2; side++) {
      g.setTransform(side ? -d : d, 0, 0, d, side ? (ox + w) * d : ox * d, oy * d)
      branch(g, u * w, v * h, a, len * Math.min(h, w), wid * m, depth, rand)
    }
  }

  const leaves = [mapleLeaf(), bladeLeaf()]
  let placed = 0
  let tries = 0
  while (placed < spec.clusters && tries < spec.clusters * 40) {
    tries++
    const u = -PAD + rand() * (0.5 + PAD)
    const v = -PAD + rand() * (HORIZON + 0.04 + PAD)
    const dx = Math.abs(u - 0.5)
    let dens = foliageDensity(u, v, ECLIPSE_Y, HORIZON, w / h)
    if (spec.near && !(dx > 0.31 || v < 0.06)) dens = 0
    if (rand() > dens) continue
    placed++
    const r = (spec.rMin + rand() * (spec.rMax - spec.rMin)) * M
    const n = Math.round(spec.leaves * (0.7 + rand() * 0.6))
    const lBase = spec.lMin + rand() * (spec.lMax - spec.lMin)
    for (let side = 0; side < 2; side++) {
      const cx = (side ? 1 - u : u) * w + (rand() - 0.5) * r * 0.6
      const cy = v * h + (rand() - 0.5) * r * 0.4

      // the clump's shadowed body, so gaps between leaves are dark red, not sky
      g.setTransform(d, 0, 0, d, ox * d, oy * d)
      const body = g.createRadialGradient(cx, cy + r * 0.25, 0, cx, cy, r * 1.15)
      body.addColorStop(0, hsl(hue, 80, lBase * 0.3, 0.95))
      body.addColorStop(0.7, hsl(hue, 80, lBase * 0.22, 0.6))
      body.addColorStop(1, hsl(hue, 80, 2, 0))
      g.fillStyle = body
      g.beginPath()
      g.arc(cx, cy, r * 1.15, 0, Math.PI * 2)
      g.fill()

      const toLight = Math.atan2(ly - cy, lx - cx)
      const cl = Math.cos(toLight)
      const sl = Math.sin(toLight)
      const near = Math.max(0, 0.42 - Math.hypot(cx - lx, cy - ly) / M)
      for (let i = 0; i < n; i++) {
        const a = rand() * Math.PI * 2
        const rr = r * Math.sqrt(rand()) * 0.95
        const ca = Math.cos(a)
        const sa = Math.sin(a)
        const k = rr / r
        const facing = (ca * cl + sa * sl) * k
        const top = -sa * k
        let L = lBase + facing * 13 + top * 7 + (rand() - 0.5) * 9
        L += near * 80 * Math.max(0, facing)
        if (facing > 0.55 && rand() < 0.04) L += 22
        L = Math.max(3, Math.min(68, L))
        const hh = hue + (rand() - 0.5) * 12 + (L > 38 ? 5 : 0)
        g.fillStyle = hsl(hh, 76 + rand() * 20, L)
        const s = r * (0.05 + rand() * 0.065)
        const rot = rand() * Math.PI * 2
        const cr = Math.cos(rot) * s * d
        const sr = Math.sin(rot) * s * d
        g.setTransform(cr, sr, -sr, cr, (ox + cx + ca * rr) * d, (oy + cy + sa * rr * 0.85) * d)
        g.fill(leaves[rand() < 0.4 ? 0 : 1])
      }
    }
    yield
  }
  g.setTransform(1, 0, 0, 1, 0, 0)

  if (blur > 0) {
    const out = makeCanvas(c.width, c.height)
    const og = out.getContext("2d")!
    og.filter = "blur(" + (blur * d).toFixed(2) + "px)"
    og.drawImage(c, 0, 0)
    return out
  }
  return c
}

function buildFloor(w: number, h: number, hue: number, rand: () => number) {
  const fh = h * (1 - HORIZON)
  const c = makeCanvas(w, fh)
  const g = c.getContext("2d")!
  for (let i = 0; i < 220; i++) {
    const v = rand()
    const y = fh * Math.pow(v, 1.5)
    const x = w / 2 + (rand() - 0.5) * w * (0.5 + v * 0.8)
    const rx = (6 + rand() * 70) * (0.25 + v * 1.7)
    const ry = rx * (0.06 + v * 0.1)
    g.fillStyle = hsl(hue + (rand() - 0.5) * 10, 100, 28 + rand() * 30, 0.04 + rand() * 0.16)
    g.beginPath()
    g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2)
    g.fill()
  }
  return c
}

function buildPetal(hue: number) {
  const c = makeCanvas(64, 64)
  const g = c.getContext("2d")!
  g.translate(32, 32)
  g.shadowColor = hsl(hue, 100, 62, 0.95)
  g.shadowBlur = 14
  g.fillStyle = "#fff3f4"
  g.beginPath()
  g.moveTo(0, -12)
  g.bezierCurveTo(9, -8, 8, 7, 0, 12)
  g.bezierCurveTo(-8, 7, -9, -8, 0, -12)
  g.fill()
  return c
}

/**
 * A wing of white light: tapered strands fanning up and out from one root,
 * the pale shapes flanking the eclipse. Drawn pointing up-left; mirrored for
 * the right side.
 */
function buildWisp(hue: number, rand: () => number) {
  const c = makeCanvas(170, 190)
  const g = c.getContext("2d")!
  g.translate(140, 170)
  g.shadowColor = hsl(hue, 100, 60, 1)
  g.shadowBlur = 14
  for (let k = 0; k < 7; k++) {
    const f = k / 6
    const tipX = -(26 + f * 96 + rand() * 10)
    const tipY = -(150 - f * 96 + rand() * 10)
    const bx = -k * 2.5
    const cx = tipX * 0.15 + 14 - f * 10
    const cy = tipY * 0.62
    const wd = 7 - f * 3.5
    const grad = g.createLinearGradient(bx, 0, tipX, tipY)
    grad.addColorStop(0, "rgba(255,240,242,0)")
    grad.addColorStop(0.3, "rgba(255,244,245," + (0.9 - f * 0.35).toFixed(2) + ")")
    grad.addColorStop(1, "rgba(255,250,250,0.05)")
    g.fillStyle = grad
    g.beginPath()
    g.moveTo(bx, 0)
    g.quadraticCurveTo(cx + wd, cy + wd, tipX, tipY)
    g.quadraticCurveTo(cx - wd, cy - wd * 0.2, bx - wd * 0.6, 0)
    g.closePath()
    g.fill()
  }
  return c
}

function buildGrain(rand: () => number) {
  const c = makeCanvas(160, 160)
  const g = c.getContext("2d")!
  const img = g.createImageData(160, 160)
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.floor(rand() * 255)
    img.data[i] = v
    img.data[i + 1] = v
    img.data[i + 2] = v
    img.data[i + 3] = 255
  }
  g.putImageData(img, 0, 0)
  return c
}

function* buildScene(w: number, h: number, hue: number, seed: number, dpr: number): Generator<void, Scene> {
  const rand = mulberry32(seed)
  const far = yield* buildLayer(
    { clusters: 250, rMin: 0.016, rMax: 0.04, leaves: 90, lMin: 9, lMax: 22, dpr: Math.min(dpr, 0.9) },
    w, h, hue, rand,
    [
      [0.1, 0.8, -Math.PI / 2 + 0.2, 0.2, 0.013, 6],
      [0.26, 0.76, -Math.PI / 2 + 0.5, 0.15, 0.008, 5],
    ],
    1.4,
  )
  const mid = yield* buildLayer(
    { clusters: 190, rMin: 0.028, rMax: 0.058, leaves: 135, lMin: 15, lMax: 40, dpr: Math.min(dpr, 1.25) },
    w, h, hue, rand,
    [[0.06, 0.84, -Math.PI / 2 + 0.12, 0.26, 0.02, 5]],
    0,
  )
  const near = yield* buildLayer(
    { clusters: 46, rMin: 0.05, rMax: 0.095, leaves: 190, lMin: 12, lMax: 30, dpr: Math.min(dpr, 1), near: true },
    w, h, hue, rand,
    [[0.005, 0.95, -Math.PI / 2 + 0.05, 0.4, 0.045, 4]],
    0,
  )
  return {
    far,
    mid,
    near,
    floor: buildFloor(w, h, hue, rand),
    petal: buildPetal(hue),
    wisp: buildWisp(hue, rand),
    grain: buildGrain(rand),
  }
}

// ---------------------------------------------------------------------------
// Scoped CSS. Plain strings — no backticks, no interpolation. Everything
// dynamic arrives as a custom property on the root.
// ---------------------------------------------------------------------------

const CEL_CSS = [
  ".cel-root { position: relative; width: 100%; overflow: hidden; isolation: isolate; background: #050001; color: #f6e9ea; -webkit-font-smoothing: antialiased; touch-action: manipulation; }",
  ".cel-root, .cel-root * { box-sizing: border-box; }",
  ".cel-canvas { position: absolute; inset: 0; display: block; width: 100%; height: 100%; max-width: none; }",
  ".cel-layer { position: absolute; inset: 0; pointer-events: none; }",

  /* nav */
  ".cel-nav { position: absolute; left: 0; right: 0; top: clamp(14px, 3.4%, 30px); display: flex; justify-content: center; pointer-events: none; z-index: 3; }",
  ".cel-nav ul { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px clamp(14px, calc(var(--cel-w, 1200px) * 0.058), 76px); margin: 0; padding: 0 16px; list-style: none; }",
  ".cel-link { position: relative; display: inline-block; padding: 6px 0; font: 600 clamp(8.5px, calc(var(--cel-w, 1200px) * 0.0075), 11px)/1 ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif; letter-spacing: 0.14em; color: rgba(246, 225, 227, 0.62); text-decoration: none; pointer-events: auto; transition: color .35s ease, text-shadow .35s ease; }",
  ".cel-link::after { content: ''; position: absolute; left: 0; right: 0; bottom: 0; height: 1px; background: hsl(var(--cel-hue) 100% 62%); box-shadow: 0 0 8px hsl(var(--cel-hue) 100% 55%); transform: scaleX(0); transform-origin: right; transition: transform .45s cubic-bezier(.7,0,.2,1); }",
  ".cel-link:hover, .cel-link:focus-visible, .cel-link[aria-current='page'] { color: #fff5f5; text-shadow: 0 0 12px hsl(var(--cel-hue) 100% 55% / .7); }",
  ".cel-link:hover::after, .cel-link:focus-visible::after, .cel-link[aria-current='page']::after { transform: scaleX(1); transform-origin: left; }",
  ".cel-link:focus-visible { outline: none; }",

  /* hero type */
  ".cel-hero { position: absolute; left: 0; right: 0; top: 39.5%; text-align: center; z-index: 2; will-change: transform; }",
  ".cel-eyebrow { margin: 0 0 clamp(4px, 1.2%, 14px); padding-left: 0.95em; font: 500 clamp(8px, calc(var(--cel-w, 1200px) * 0.0085), 12px)/1 ui-sans-serif, system-ui, sans-serif; letter-spacing: 0.95em; color: rgba(246, 225, 227, 0.8); }",
  ".cel-title { margin: 0; font-family: var(--cel-font); font-weight: 300; font-size: clamp(36px, calc(var(--cel-w, 1200px) * 0.088), 136px); line-height: 1; letter-spacing: 0.07em; padding-left: 0.07em; color: #f7ecec; text-shadow: 0 0 28px hsl(var(--cel-hue) 100% 45% / .45), 0 2px 1px rgba(0,0,0,.4); white-space: nowrap; pointer-events: auto; }",
  ".cel-letter { display: inline-block; }",
  ".cel-glyph { display: inline-block; transition: transform .5s cubic-bezier(.2,.8,.2,1), color .4s ease, text-shadow .4s ease; }",
  ".cel-glyph:hover { transform: translateY(-0.07em); color: #fff; text-shadow: 0 0 18px hsl(var(--cel-hue) 100% 70%), 0 0 42px hsl(var(--cel-hue) 100% 50%); }",

  /* foot */
  ".cel-foot { position: absolute; left: 0; right: 0; bottom: clamp(12px, 3.4%, 34px); text-align: center; z-index: 2; pointer-events: none; }",
  ".cel-kanji { margin: 0 0 8px; font: 500 clamp(9px, calc(var(--cel-w, 1200px) * 0.009), 13px)/1 serif; letter-spacing: 0.7em; padding-left: 0.7em; color: hsl(var(--cel-hue) 100% 52%); text-shadow: 0 0 10px hsl(var(--cel-hue) 100% 45% / .8); }",
  ".cel-tag { margin: 0; font: 500 clamp(7px, calc(var(--cel-w, 1200px) * 0.0062), 9.5px)/1.55 ui-sans-serif, system-ui, sans-serif; letter-spacing: 0.08em; color: hsl(var(--cel-hue) 85% 55% / .85); }",

  /* the eclipse button: sits exactly over the painted eclipse */
  ".cel-moon { position: absolute; left: 50%; top: calc(var(--cel-ey) * 100%); width: calc(var(--cel-r, 22px) * 3); height: calc(var(--cel-r, 22px) * 3); transform: translate(-50%, -50%); border: 0; border-radius: 999px; padding: 0; background: transparent; cursor: pointer; z-index: 3; }",
  ".cel-moon::after { content: ''; position: absolute; inset: -6px; border-radius: 999px; border: 1px solid hsl(var(--cel-hue) 100% 70% / 0); transition: border-color .4s ease, inset .6s cubic-bezier(.2,.8,.2,1); }",
  ".cel-moon:hover::after, .cel-moon:focus-visible::after { border-color: hsl(var(--cel-hue) 100% 75% / .55); inset: -14px; }",
  ".cel-moon:focus-visible { outline: none; }",

  /* landing entrance, keyed off data-phase */
  ".cel-root .cel-nav, .cel-root .cel-foot, .cel-root .cel-eyebrow, .cel-root .cel-letter, .cel-root .cel-moon { opacity: 0; }",
  ".cel-root[data-phase='reveal'] .cel-letter, .cel-root[data-phase='landing'] .cel-letter { animation: cel-letter-in 1.5s cubic-bezier(.16,.8,.2,1) both; animation-delay: calc(var(--i) * 75ms + 650ms); }",
  ".cel-root[data-phase='reveal'] .cel-eyebrow, .cel-root[data-phase='landing'] .cel-eyebrow { animation: cel-track-in 1.8s cubic-bezier(.16,.8,.2,1) 500ms both; }",
  ".cel-root[data-phase='reveal'] .cel-nav, .cel-root[data-phase='landing'] .cel-nav { animation: cel-drop-in 1.1s cubic-bezier(.16,.8,.2,1) 1200ms both; }",
  ".cel-root[data-phase='reveal'] .cel-foot, .cel-root[data-phase='landing'] .cel-foot { animation: cel-rise-in 1.2s cubic-bezier(.16,.8,.2,1) 1400ms both; }",
  ".cel-root[data-phase='landing'] .cel-moon { opacity: 1; }",
  "@keyframes cel-letter-in { from { opacity: 0; filter: blur(14px); transform: translateY(0.18em) scale(1.08); } to { opacity: 1; filter: blur(0); transform: none; } }",
  "@keyframes cel-track-in { from { opacity: 0; letter-spacing: 2.2em; } to { opacity: 1; letter-spacing: 0.95em; } }",
  "@keyframes cel-drop-in { from { opacity: 0; transform: translateY(-14px); } to { opacity: 1; transform: none; } }",
  "@keyframes cel-rise-in { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }",

  /* the gate: the preloader, above everything */
  ".cel-gate { position: absolute; inset: 0; z-index: 10; background: radial-gradient(ellipse at 50% 50%, hsl(var(--cel-hue) 80% 5%) 0%, #030001 62%); overflow: hidden; }",
  ".cel-root[data-phase='landing'] .cel-gate { opacity: 0; visibility: hidden; pointer-events: none; transition: opacity .6s ease, visibility 0s linear .6s; }",
  ".cel-corner { position: absolute; width: 18px; height: 18px; border-color: hsl(var(--cel-hue) 100% 60% / .45); border-style: solid; border-width: 0; }",
  ".cel-corner.tl { top: 18px; left: 18px; border-top-width: 1px; border-left-width: 1px; }",
  ".cel-corner.tr { top: 18px; right: 18px; border-top-width: 1px; border-right-width: 1px; }",
  ".cel-corner.bl { bottom: 18px; left: 18px; border-bottom-width: 1px; border-left-width: 1px; }",
  ".cel-corner.br { bottom: 18px; right: 18px; border-bottom-width: 1px; border-right-width: 1px; }",
  ".cel-gate-kanji { position: absolute; left: clamp(22px, 5%, 64px); bottom: clamp(40px, 9%, 90px); writing-mode: vertical-rl; font: 400 clamp(18px, calc(var(--cel-w, 1200px) * 0.02), 30px)/1 serif; letter-spacing: 0.35em; color: hsl(var(--cel-hue) 100% 50%); text-shadow: 0 0 16px hsl(var(--cel-hue) 100% 45% / .7); }",
  ".cel-gate-act { position: absolute; right: clamp(22px, 5%, 64px); bottom: clamp(40px, 9%, 90px); margin: 0; font: 500 9px/1.8 ui-sans-serif, system-ui, sans-serif; letter-spacing: 0.4em; text-align: right; color: rgba(246, 225, 227, 0.4); }",
  ".cel-gate-eyebrow { position: absolute; left: 0; right: 0; top: calc(50% - 150px); margin: 0; padding-left: 0.95em; text-align: center; font: 500 11px/1 ui-sans-serif, system-ui, sans-serif; letter-spacing: 0.95em; color: rgba(246, 225, 227, 0.72); }",
  ".cel-gate-status { position: absolute; left: 0; right: 0; top: calc(50% + 128px); margin: 0; padding-left: 0.5em; text-align: center; font: 500 9.5px/1 ui-sans-serif, system-ui, sans-serif; letter-spacing: 0.5em; color: hsl(var(--cel-hue) 90% 60% / .85); }",
  ".cel-gate-eyebrow, .cel-gate-status, .cel-gate-kanji, .cel-gate-act, .cel-corner, .cel-count { transition: opacity .5s ease; }",
  ".cel-gate[data-lit='true'] .cel-gate-eyebrow, .cel-gate[data-lit='true'] .cel-gate-status, .cel-gate[data-lit='true'] .cel-gate-kanji, .cel-gate[data-lit='true'] .cel-gate-act, .cel-gate[data-lit='true'] .cel-corner, .cel-gate[data-lit='true'] .cel-count { opacity: 0; }",

  ".cel-ring { position: absolute; left: 50%; top: 50%; width: 176px; height: 176px; transform: translate(-50%, -50%) scale(1); transition: top .9s cubic-bezier(.7,0,.2,1) .25s, transform .9s cubic-bezier(.7,0,.2,1) .25s; }",
  ".cel-gate[data-lit='true'] .cel-ring { top: calc(var(--cel-ey) * 100%); transform: translate(-50%, -50%) scale(var(--cel-shrink, .25)); }",
  ".cel-ring svg { position: absolute; inset: 0; width: 100%; height: 100%; max-width: none; overflow: visible; }",
  ".cel-arc { filter: drop-shadow(0 0 6px hsl(var(--cel-hue) 100% 55%)); transition: stroke-width .35s ease; }",
  ".cel-gate[data-lit='true'] .cel-arc { stroke-width: 7; }",
  ".cel-core { opacity: 0; transition: opacity .3s ease; }",
  ".cel-gate[data-lit='true'] .cel-core { opacity: 1; }",
  ".cel-tick { stroke: rgba(246, 225, 227, 0.16); transition: stroke .3s ease; }",
  ".cel-tick[data-on='true'] { stroke: hsl(var(--cel-hue) 100% 64%); }",
  ".cel-flash { position: absolute; inset: -60%; border-radius: 999px; background: radial-gradient(circle, hsl(var(--cel-hue) 100% 70% / .9) 0%, hsl(var(--cel-hue) 100% 45% / .35) 22%, transparent 60%); opacity: 0; transform: scale(.4); pointer-events: none; }",
  ".cel-gate[data-lit='true'] .cel-flash { animation: cel-flash 1s cubic-bezier(.2,.7,.2,1) both; }",
  "@keyframes cel-flash { 0% { opacity: 0; transform: scale(.4); } 18% { opacity: 1; } 100% { opacity: 0; transform: scale(1.6); } }",
  ".cel-count { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; }",
  ".cel-count-num { font-family: var(--cel-font); font-size: 40px; line-height: 1; letter-spacing: 0.08em; color: #f7ecec; font-variant-numeric: tabular-nums; text-shadow: 0 0 18px hsl(var(--cel-hue) 100% 45% / .6); }",
  ".cel-count-label { font: 500 8px/1 ui-sans-serif, system-ui, sans-serif; letter-spacing: 0.5em; padding-left: 0.5em; color: rgba(246, 225, 227, 0.45); }",
  ".cel-iris { position: absolute; left: 50%; top: calc(var(--cel-ey) * 100%); width: 0; height: 0; border-radius: 999px; transform: translate(-50%, -50%); border: 1.5px solid hsl(var(--cel-hue) 100% 62%); box-shadow: 0 0 30px hsl(var(--cel-hue) 100% 50%), inset 0 0 30px hsl(var(--cel-hue) 100% 50% / .6); opacity: 0; pointer-events: none; z-index: 11; }",

  /* falling petals behind the loader ring */
  ".cel-gp { position: absolute; top: -20px; left: var(--x); width: 11px; height: 7px; border-radius: 80% 0 80% 0; background: linear-gradient(135deg, #fff4f5, hsl(var(--cel-hue) 100% 82%)); box-shadow: 0 0 10px hsl(var(--cel-hue) 100% 60% / .9); opacity: 0; animation: cel-fall var(--d) linear var(--delay) infinite; }",
  "@keyframes cel-fall { 0% { opacity: 0; transform: translate3d(0, 0, 0) rotate(0deg) scale(var(--s)); } 10% { opacity: .9; } 85% { opacity: .75; } 100% { opacity: 0; transform: translate3d(var(--dx), calc(var(--cel-h, 800px) + 40px), 0) rotate(var(--rot)) scale(var(--s)); } }",

  "@media (prefers-reduced-motion: reduce) {",
  "  .cel-gp { display: none; }",
  "  .cel-ring, .cel-arc, .cel-glyph, .cel-link, .cel-link::after { transition: none; }",
  "  .cel-root .cel-letter, .cel-root .cel-eyebrow, .cel-root .cel-nav, .cel-root .cel-foot { animation: none !important; opacity: 1; }",
  "  .cel-gate[data-lit='true'] .cel-flash { animation: none; }",
  "}",
].join("\n")

const TICKS = 60
const ARC_C = 2 * Math.PI * 88

const GATE_PETALS = Array.from({ length: 14 }, (_, i) => {
  const r = mulberry32(900 + i)
  return {
    x: (4 + r() * 92).toFixed(1) + "%",
    d: (6 + r() * 7).toFixed(2) + "s",
    delay: (-r() * 10).toFixed(2) + "s",
    dx: ((r() - 0.3) * 220).toFixed(0) + "px",
    rot: ((r() - 0.5) * 900).toFixed(0) + "deg",
    s: (0.6 + r() * 0.9).toFixed(2),
  }
})

type Petal = {
  x: number; y: number; z: number; vx: number; vy: number; fall: number
  rot: number; spin: number; flip: number; flipSpeed: number; sway: number
}
type Ripple = { x: number; y: number; age: number; z: number }
type Streak = { x: number; y: number; len: number; speed: number; a: number }
type Ember = { x: number; y: number; vy: number; phase: number; size: number; life: number }

export default function CrimsonEclipseLanding({
  title = "WELCOME",
  eyebrow = "PORTFOLIO",
  navItems = DEFAULT_NAV,
  activeNav = 0,
  onNavigate,
  kanji = "ようこそ未来へ",
  tagline = DEFAULT_TAGLINE,
  loadingLabels = DEFAULT_LABELS,
  hue = 354,
  seed = 11,
  petalCount = 60,
  durationMs = 3800,
  progress,
  skipIntro = false,
  replayOnEclipse = true,
  onIntroComplete,
  titleFont = DEFAULT_FONT,
  height = "100svh",
  className = "",
}: CrimsonEclipseLandingProps) {
  const rootRef = React.useRef<HTMLDivElement>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const gateRef = React.useRef<HTMLDivElement>(null)
  const ringRef = React.useRef<HTMLDivElement>(null)
  const arcRef = React.useRef<SVGCircleElement>(null)
  const countRef = React.useRef<HTMLSpanElement>(null)
  const statusRef = React.useRef<HTMLParagraphElement>(null)
  const irisRef = React.useRef<HTMLDivElement>(null)
  const heroRef = React.useRef<HTMLDivElement>(null)
  const tickRefs = React.useRef<Array<SVGLineElement | null>>([])

  const [phase, setPhase] = React.useState<IntroPhase>(skipIntro ? "landing" : "load")
  const [active, setActive] = React.useState(activeNav)
  React.useEffect(() => setActive(activeNav), [activeNav])

  // Latest values the engine reads each frame without restarting.
  const live = React.useRef({ progress, durationMs, loadingLabels, onIntroComplete })
  live.current = { progress, durationMs, loadingLabels, onIntroComplete }

  const engine = React.useRef<{ replay: () => void; hover: (on: boolean) => void } | null>(null)

  React.useEffect(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    const gate = gateRef.current
    const hero = heroRef.current
    if (!root || !canvas || !gate) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches
    const rand = mulberry32(seed * 7919 + 13)

    let w = 1
    let h = 1
    let dpr = 1
    let R = 20
    let scene: Scene | null = null
    let dirty = true
    let visible = true
    let raf = 0
    let last = performance.now()
    let t = 0
    let rebuild = 0
    let builder: Generator<void, Scene> | null = null

    // pointer, smoothed parallax, eclipse hover
    let mx = -1e4
    let my = -1e4
    let tx = 0
    let ty = 0
    let px = 0
    let py = 0
    let hoverT = 0
    let hover = 0

    const intro = {
      phase: (skipIntro ? "landing" : "load") as IntroPhase,
      start: performance.now(),
      doneAt: 0,
      shown: 0,
      reveal: 1,
      ticks: -1,
      label: -1,
    }

    const petals: Petal[] = []
    const ripples: Ripple[] = []
    const streaks: Streak[] = []
    const embers: Ember[] = []

    const spawnPetal = (p: Petal, top: boolean) => {
      p.z = 0.35 + rand() * 0.95
      p.x = rand() * w
      p.y = top ? -20 - rand() * h * 0.25 : rand() * h * HORIZON
      p.vx = 0
      p.vy = 30
      p.fall = 24 + rand() * 34
      p.rot = rand() * Math.PI * 2
      p.spin = (rand() - 0.5) * 2.6
      p.flip = rand() * Math.PI * 2
      p.flipSpeed = 1.4 + rand() * 3
      p.sway = rand() * Math.PI * 2
    }
    const spawnStreak = (s: Streak, top: boolean) => {
      s.x = rand() * w * 1.25
      s.y = top ? -rand() * h * 0.5 : rand() * h * HORIZON
      s.len = 8 + rand() * 34
      s.speed = 260 + rand() * 420
      s.a = 0.06 + rand() * 0.26
    }
    const spawnEmber = (e: Ember) => {
      const a = rand() * Math.PI * 2
      const k = 0.85 + rand() * 0.4
      e.x = w / 2 + Math.cos(a) * w * 0.16 * k
      e.y = (ECLIPSE_Y + 0.05) * h + Math.sin(a) * h * 0.21 * k
      e.vy = -(5 + rand() * 16)
      e.phase = rand() * Math.PI * 2
      e.size = 0.6 + rand() * 1.5
      e.life = 3 + rand() * 5
    }

    const populate = () => {
      petals.length = 0
      streaks.length = 0
      embers.length = 0
      for (let i = 0; i < petalCount; i++) {
        const p = {} as Petal
        spawnPetal(p, false)
        petals.push(p)
      }
      for (let i = 0; i < 30; i++) {
        const s = {} as Streak
        spawnStreak(s, false)
        streaks.push(s)
      }
      for (let i = 0; i < 40; i++) {
        const e = {} as Ember
        spawnEmber(e)
        e.life = rand() * 6
        embers.push(e)
      }
    }

    const ripple = (x: number, y: number, z: number) => {
      if (ripples.length > 48) ripples.shift()
      ripples.push({ x, y, age: 0, z })
    }

    // ---- intro clock ------------------------------------------------------
    const go = (next: IntroPhase) => {
      intro.phase = next
      dirty = true
      setPhase(next)
      gate.dataset.lit = next === "load" ? "false" : "true"
      if (next === "landing") {
        intro.reveal = 1
        gate.style.maskImage = ""
        gate.style.webkitMaskImage = ""
        if (irisRef.current) irisRef.current.style.opacity = "0"
        live.current.onIntroComplete?.()
      }
    }

    const paintRing = (p: number) => {
      const arc = arcRef.current
      if (arc) arc.style.strokeDashoffset = String(ARC_C * (1 - p / 100))
      if (countRef.current) countRef.current.textContent = String(Math.floor(p)).padStart(3, "0")
      ringRef.current?.setAttribute("aria-valuenow", String(Math.floor(p)))
      const lit = Math.floor((p / 100) * TICKS)
      if (lit !== intro.ticks) {
        intro.ticks = lit
        tickRefs.current.forEach((el, i) => el?.setAttribute("data-on", i < lit ? "true" : "false"))
      }
      const labels = live.current.loadingLabels
      const li = Math.min(labels.length - 1, Math.floor((p / 100) * labels.length))
      if (li !== intro.label && statusRef.current) {
        intro.label = li
        statusRef.current.textContent = labels[li] ?? ""
      }
    }

    const stepIntro = (now: number, dt: number) => {
      if (intro.phase === "load") {
        const ext = live.current.progress
        if (ext != null) {
          const target = Math.max(0, Math.min(100, ext))
          intro.shown += (target - intro.shown) * Math.min(1, dt * 6)
          if (target >= 100 && intro.shown > 99.4) intro.shown = 100
        } else {
          intro.shown = Math.max(intro.shown, introProgress((now - intro.start) / live.current.durationMs))
        }
        paintRing(intro.shown)
        // the count may reach 100 before the canopy has finished growing on
        // a slow device; hold on the lit ring rather than open onto nothing
        if (intro.shown >= 100 && scene) {
          intro.doneAt = now
          go(reduced ? "landing" : "ignite")
        }
        return
      }
      if (intro.phase === "landing") return
      const since = now - intro.doneAt
      const next = afterLoad(since)
      if (next !== intro.phase) go(next)
      if (intro.phase === "reveal") {
        const local = (since - IGNITE_MS) / REVEAL_MS
        intro.reveal = easeOutCubic(local)
        const r = R + (Math.hypot(w, h) * 1.05 - R) * easeInOutCubic(local)
        const feather = 30 + r * 0.25
        const m =
          "radial-gradient(circle at 50% " + (ECLIPSE_Y * 100).toFixed(2) + "%, transparent " +
          r.toFixed(1) + "px, #000 " + (r + feather).toFixed(1) + "px)"
        gate.style.maskImage = m
        gate.style.webkitMaskImage = m
        const iris = irisRef.current
        if (iris) {
          iris.style.width = iris.style.height = (r * 2 + feather).toFixed(1) + "px"
          iris.style.opacity = String((1 - clamp01(local * 1.4)) * 0.9)
        }
      } else {
        intro.reveal = (intro.phase as IntroPhase) === "landing" ? 1 : 0
      }
    }

    // ---- sizing -----------------------------------------------------------
    const resize = () => {
      const nw = Math.max(1, root.clientWidth)
      const nh = Math.max(1, root.clientHeight)
      const changed = Math.abs(nw - w) > 1 || Math.abs(nh - h) > 1 || !scene
      w = nw
      h = nh
      dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      R = Math.max(12, Math.min(34, Math.min(w, h) * 0.032))
      root.style.setProperty("--cel-w", w + "px")
      root.style.setProperty("--cel-h", h + "px")
      root.style.setProperty("--cel-r", R + "px")
      // the loader arc is r=88 of a 200 box drawn at 176px
      root.style.setProperty("--cel-shrink", ((2 * R) / (176 * 0.88)).toFixed(4))
      dirty = true
      if (!changed) return
      // A resize keeps painting the old canopy, stretched, until the new one
      // has grown — settled sizes only, not every frame of a drag.
      window.clearTimeout(rebuild)
      if (!scene && !builder) {
        builder = buildScene(w, h, hue, seed, dpr)
        populate()
      } else {
        rebuild = window.setTimeout(() => {
          builder = buildScene(w, h, hue, seed, dpr)
        }, 180)
      }
    }

    /** Grow the canopy for at most `budget` ms of this frame. */
    const grow = (budget: number) => {
      if (!builder) return
      const until = performance.now() + budget
      while (performance.now() < until) {
        const step = builder.next()
        if (step.done) {
          scene = step.value
          builder = null
          dirty = true
          return
        }
      }
    }

    // ---- per frame --------------------------------------------------------
    const update = (dt: number) => {
      const hz = HORIZON * h
      const wind = 14 + Math.sin(t * 0.23) * 12
      const reach = Math.min(w, h) * 0.2
      for (const p of petals) {
        p.vx += (wind + Math.sin(t * 1.3 + p.sway) * 22 - p.vx) * Math.min(1, dt * 1.2)
        p.vy += (p.fall - p.vy) * Math.min(1, dt * 0.9)
        const dx = p.x - mx
        const dy = p.y - my
        const d = Math.hypot(dx, dy)
        if (d < reach && d > 0.01) {
          const k = (1 - d / reach) * 620 * dt
          p.vx += (dx / d) * k
          p.vy += (dy / d) * k
        }
        p.x += p.vx * dt * p.z
        p.y += p.vy * dt * p.z
        p.rot += p.spin * dt
        p.flip += p.flipSpeed * dt
        const ground = hz + (h - hz) * clamp01((p.z - 0.35) / 0.95) * 0.92
        if (p.y > ground) {
          ripple(p.x, ground, p.z)
          spawnPetal(p, true)
        }
        if (p.x > w + 30) p.x = -30
        else if (p.x < -30) p.x = w + 30
        if (p.y < -h) p.y = -20
      }
      for (const s of streaks) {
        s.y += s.speed * dt
        s.x -= s.speed * dt * 0.24
        if (s.y > hz) spawnStreak(s, true)
      }
      for (const e of embers) {
        e.y += e.vy * dt
        e.x += Math.sin(t * 0.8 + e.phase) * 6 * dt
        e.life -= dt
        if (e.life <= 0) spawnEmber(e)
      }
      for (let i = ripples.length - 1; i >= 0; i--) {
        ripples[i].age += dt
        if (ripples[i].age > 1.8) ripples.splice(i, 1)
      }
      hover += (hoverT - hover) * Math.min(1, dt * 4)
      px += (tx - px) * Math.min(1, dt * 2.6)
      py += (ty - py) * Math.min(1, dt * 2.6)
    }

    const drawLayer = (img: HTMLCanvasElement, depth: number, zoom: number, fx: number, fy: number) => {
      const W = w * (1 + 2 * PAD)
      const H = h * (1 + 2 * PAD)
      const ox = -px * depth
      const oy = -py * depth * 0.6
      ctx.drawImage(img, fx + (-PAD * w - fx) * zoom + ox, fy + (-PAD * h - fy) * zoom + oy, W * zoom, H * zoom)
    }

    const drawPetals = (front: boolean, sprite: HTMLCanvasElement) => {
      for (const p of petals) {
        if (p.z >= 0.8 !== front) continue
        const s = 0.22 + 0.3 * p.z
        const f = Math.cos(p.flip)
        const c = Math.cos(p.rot) * s
        const sn = Math.sin(p.rot) * s
        ctx.globalAlpha = 0.35 + 0.65 * clamp01((p.z - 0.35) / 0.9)
        ctx.setTransform(c * dpr, sn * dpr, -sn * f * dpr, c * f * dpr, p.x * dpr, p.y * dpr)
        ctx.drawImage(sprite, -32, -32)
      }
      ctx.globalAlpha = 1
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const drawEclipse = (x: number, y: number, glow: number) => {
      ctx.globalCompositeOperation = "lighter"
      const halo = ctx.createRadialGradient(x, y, R * 0.8, x, y, R * 10 * glow)
      halo.addColorStop(0, hsl(hue, 100, 55, 0.55))
      halo.addColorStop(0.14, hsl(hue, 100, 45, 0.22))
      halo.addColorStop(0.45, hsl(hue, 100, 35, 0.06))
      halo.addColorStop(1, hsl(hue, 100, 30, 0))
      ctx.fillStyle = halo
      ctx.fillRect(x - R * 10 * glow, y - R * 10 * glow, R * 20 * glow, R * 20 * glow)
      ctx.lineWidth = 1
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2 + t * 0.04
        const len = R * (2.6 + 1.8 * Math.sin(t * 0.7 + i * 1.7)) * glow
        ctx.strokeStyle = hsl(hue, 100, 70, 0.1 + 0.08 * hover)
        ctx.beginPath()
        ctx.moveTo(x + Math.cos(a) * R * 1.2, y + Math.sin(a) * R * 1.2)
        ctx.lineTo(x + Math.cos(a) * (R * 1.2 + len), y + Math.sin(a) * (R * 1.2 + len))
        ctx.stroke()
      }
      ctx.globalCompositeOperation = "source-over"
      ctx.fillStyle = "#040001"
      ctx.beginPath()
      ctx.arc(x, y, R * 0.94, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalCompositeOperation = "lighter"
      const rim = ctx.createRadialGradient(x, y, R * 0.7, x, y, R * 1.9)
      rim.addColorStop(0, hsl(hue, 100, 50, 0))
      rim.addColorStop(0.3, hsl(hue, 100, 55, 0.75 * glow))
      rim.addColorStop(1, hsl(hue, 100, 45, 0))
      ctx.fillStyle = rim
      ctx.beginPath()
      ctx.arc(x, y, R * 1.9, 0, Math.PI * 2)
      ctx.arc(x, y, R * 0.94, 0, Math.PI * 2, true)
      ctx.fill()
      ctx.lineWidth = R * 0.2
      ctx.strokeStyle = hsl(hue, 100, 55, 0.95)
      ctx.beginPath()
      ctx.arc(x, y, R, 0, Math.PI * 2)
      ctx.stroke()
      ctx.lineWidth = Math.max(1, R * 0.07)
      ctx.strokeStyle = "rgba(255,228,230,0.95)"
      ctx.beginPath()
      ctx.arc(x, y, R * 0.98, 0, Math.PI * 2)
      ctx.stroke()
      ctx.globalCompositeOperation = "source-over"
    }

    const drawWisps = (x: number, y: number, sprite: HTMLCanvasElement) => {
      ctx.globalCompositeOperation = "lighter"
      const flutter = 1 + hover * 2.5
      for (let side = 0; side < 2; side++) {
        const sx = side ? 1 : -1
        const bob = Math.sin(t * 0.9 * flutter + side * 2.1) * R * 0.25
        const sc = (R / 22) * (side ? 0.5 : 0.7)
        const ang = (side ? 0.35 : -0.1) + Math.sin(t * 0.7 * flutter + side * 1.3) * 0.08
        const cx = x + sx * R * (side ? 3.4 : 2.6)
        const cy = y + R * (side ? 0.9 : 0.4) + bob
        const c = Math.cos(ang) * sc
        const s = Math.sin(ang) * sc
        ctx.globalAlpha = 0.9
        // rotate, then mirror x for the right-hand wing
        ctx.setTransform(-sx * c * dpr, -sx * s * dpr, -s * dpr, c * dpr, cx * dpr, cy * dpr)
        ctx.drawImage(sprite, -140, -170)
      }
      ctx.globalAlpha = 1
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.globalCompositeOperation = "source-over"
    }

    const draw = () => {
      const sc = scene
      if (!sc) return
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const hz = HORIZON * h
      const m = Math.min(w, h)
      const e = intro.reveal
      const fx = w / 2
      const fy = ECLIPSE_Y * h
      const ex = fx - px * m * 0.012
      const ey = fy - py * m * 0.006

      // sky
      const sky = ctx.createLinearGradient(0, 0, 0, hz)
      sky.addColorStop(0, hsl(hue, 70, 2.5))
      sky.addColorStop(0.5, hsl(hue, 75, 5.5))
      sky.addColorStop(1, hsl(hue, 80, 9))
      ctx.fillStyle = sky
      ctx.fillRect(0, 0, w, hz + 2)
      const bloom = ctx.createRadialGradient(ex, ey, 0, ex, ey, Math.max(w, h) * 0.55)
      bloom.addColorStop(0, hsl(hue, 95, 30, 0.55 + 0.15 * hover))
      bloom.addColorStop(0.35, hsl(hue, 90, 18, 0.25))
      bloom.addColorStop(1, hsl(hue, 90, 10, 0))
      ctx.fillStyle = bloom
      ctx.fillRect(0, 0, w, hz + 2)

      // canopy, flying back through the layers as the iris opens
      drawLayer(sc.far, m * 0.008, 1 + 0.12 * (1 - e), fx, fy)
      drawEclipse(ex, ey, 1 + 0.15 * hover + 1.6 * (1 - e) + 0.05 * Math.sin(t * 1.6))
      drawWisps(ex, ey, sc.wisp)
      drawLayer(sc.mid, m * 0.02, 1 + 0.3 * (1 - e), fx, fy)

      // embers along the rim of the pocket
      ctx.globalCompositeOperation = "lighter"
      for (const em of embers) {
        const tw = 0.5 + 0.5 * Math.sin(t * 3 + em.phase * 5)
        ctx.fillStyle = hsl(hue + 8, 100, 66, 0.25 + 0.6 * tw * clamp01(em.life))
        ctx.beginPath()
        ctx.arc(em.x - px * m * 0.02, em.y - py * m * 0.012, em.size, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalCompositeOperation = "source-over"

      drawPetals(false, sc.petal)
      drawLayer(sc.near, m * 0.045, 1 + 0.55 * (1 - e), fx, fy)

      // the flooded floor: a rippled mirror of everything above the horizon
      ctx.fillStyle = hsl(hue, 70, 3)
      ctx.fillRect(0, hz, w, h - hz)
      ctx.globalAlpha = 0.55
      const strip = 3
      for (let y = hz; y < h; y += strip) {
        const depth = y - hz
        const src = hz - depth * 1.05 - strip
        if (src < 0) break
        const off = Math.sin(y * 0.085 + t * 1.7) * (1 + depth * 0.035) + Math.sin(y * 0.31 - t * 2.3) * 0.6
        ctx.drawImage(canvas, 0, src * dpr, canvas.width, strip * dpr, off - 2, y, w + 4, strip + 1)
      }
      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = "lighter"
      ctx.globalAlpha = 0.6
      ctx.drawImage(sc.floor, 0, hz, w, h - hz)
      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = "source-over"
      const tint = ctx.createLinearGradient(0, hz, 0, h)
      tint.addColorStop(0, hsl(hue, 85, 14, 0.2))
      tint.addColorStop(0.5, hsl(hue, 80, 6, 0.55))
      tint.addColorStop(1, hsl(hue, 70, 1.5, 0.9))
      ctx.fillStyle = tint
      ctx.fillRect(0, hz, w, h - hz)
      ctx.globalCompositeOperation = "lighter"
      ctx.save()
      ctx.translate(fx, hz)
      ctx.scale(1, 0.05)
      const line = ctx.createRadialGradient(0, 0, 0, 0, 0, w * 0.6)
      line.addColorStop(0, hsl(hue, 100, 55, 0.55))
      line.addColorStop(1, hsl(hue, 100, 40, 0))
      ctx.fillStyle = line
      ctx.fillRect(-w * 0.6, -w * 0.6, w * 1.2, w * 1.2)
      ctx.restore()
      for (const r of ripples) {
        const k = r.age / 1.8
        const rx = (6 + r.age * 70) * r.z
        ctx.strokeStyle = hsl(hue, 100, 72, (1 - k) * 0.45)
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.ellipse(r.x, r.y, rx, rx * 0.2, 0, 0, Math.PI * 2)
        ctx.stroke()
      }

      // light rain
      ctx.lineWidth = 1
      ctx.lineCap = "round"
      for (const s of streaks) {
        ctx.strokeStyle = hsl(hue, 100, 82, s.a)
        ctx.beginPath()
        ctx.moveTo(s.x, s.y)
        ctx.lineTo(s.x + s.len * 0.24, s.y - s.len)
        ctx.stroke()
      }
      ctx.globalCompositeOperation = "source-over"

      drawPetals(true, sc.petal)

      // vignette, a darker brow for the nav, then grain
      const vig = ctx.createRadialGradient(fx, h * 0.45, Math.max(w, h) * 0.28, fx, h * 0.45, Math.max(w, h) * 0.78)
      vig.addColorStop(0, "rgba(0,0,0,0)")
      vig.addColorStop(1, "rgba(0,0,0,0.78)")
      ctx.fillStyle = vig
      ctx.fillRect(0, 0, w, h)
      const brow = ctx.createLinearGradient(0, 0, 0, h * 0.14)
      brow.addColorStop(0, "rgba(0,0,0,0.6)")
      brow.addColorStop(1, "rgba(0,0,0,0)")
      ctx.fillStyle = brow
      ctx.fillRect(0, 0, w, h * 0.14)
      if (e < 1) {
        ctx.fillStyle = hsl(hue, 100, 60, (1 - e) * 0.35)
        ctx.globalCompositeOperation = "lighter"
        ctx.fillRect(0, 0, w, h)
        ctx.globalCompositeOperation = "source-over"
      }
      const pattern = ctx.createPattern(sc.grain, "repeat")
      if (pattern) {
        ctx.save()
        ctx.globalAlpha = 0.055
        ctx.globalCompositeOperation = "overlay"
        ctx.translate(Math.floor(rand() * 160), Math.floor(rand() * 160))
        ctx.fillStyle = pattern
        ctx.fillRect(-160, -160, w + 320, h + 320)
        ctx.restore()
      }
    }

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (!visible) return
      // while the gate is up there is nothing else to draw, so growing gets
      // most of the frame; afterwards it shares it with the animation
      grow(intro.phase === "load" ? 12 : 6)
      stepIntro(now, dt)
      if (intro.phase === "load" || intro.phase === "ignite") return
      if (reduced) {
        if (!dirty) return
        dirty = false
        draw()
        return
      }
      t += dt
      update(dt)
      draw()
      if (hero) hero.style.transform = "translate3d(" + (-px * 7).toFixed(2) + "px," + (-py * 4).toFixed(2) + "px,0)"
    }

    // ---- input ------------------------------------------------------------
    const onMove = (ev: PointerEvent) => {
      const r = root.getBoundingClientRect()
      mx = ev.clientX - r.left
      my = ev.clientY - r.top
      if (intro.phase === "landing" && !reduced) {
        tx = (mx / r.width) * 2 - 1
        ty = (my / r.height) * 2 - 1
      }
    }
    const onLeave = () => {
      mx = my = -1e4
      tx = ty = 0
    }
    const onDown = (ev: PointerEvent) => {
      if (intro.phase !== "landing" || reduced) return
      if ((ev.target as HTMLElement).closest("a, button")) return
      const r = root.getBoundingClientRect()
      const x = ev.clientX - r.left
      const y = ev.clientY - r.top
      for (let i = 0; i < 18 && petals.length; i++) {
        const p = petals[Math.floor(rand() * petals.length)]
        const a = rand() * Math.PI * 2
        const sp = 160 + rand() * 300
        p.x = x
        p.y = Math.min(y, HORIZON * h - 4)
        p.z = 0.8 + rand() * 0.5
        p.vx = Math.cos(a) * sp
        p.vy = Math.sin(a) * sp - 80
      }
      if (y > HORIZON * h) {
        ripple(x, y, 1.4)
        window.setTimeout(() => ripple(x, y, 1.0), 180)
        window.setTimeout(() => ripple(x, y, 0.7), 360)
      }
    }

    root.addEventListener("pointermove", onMove, { passive: true })
    root.addEventListener("pointerleave", onLeave)
    root.addEventListener("pointerdown", onDown)

    const observer = new ResizeObserver(resize)
    observer.observe(root)
    const io = new IntersectionObserver((entries) => {
      visible = entries[0]?.isIntersecting ?? true
      dirty = true
    })
    io.observe(root)

    resize()
    if (skipIntro) {
      grow(Infinity)
      gate.dataset.lit = "true"
      intro.reveal = 1
    } else {
      intro.start = performance.now()
      paintRing(0)
    }
    raf = requestAnimationFrame(frame)

    engine.current = {
      replay: () => {
        intro.start = performance.now()
        intro.shown = 0
        intro.reveal = 0
        intro.ticks = -1
        intro.label = -1
        tx = ty = 0
        gate.style.maskImage = ""
        gate.style.webkitMaskImage = ""
        paintRing(0)
        go("load")
      },
      hover: (on) => {
        hoverT = on ? 1 : 0
      },
    }

    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(rebuild)
      observer.disconnect()
      io.disconnect()
      root.removeEventListener("pointermove", onMove)
      root.removeEventListener("pointerleave", onLeave)
      root.removeEventListener("pointerdown", onDown)
      engine.current = null
    }
    // skipIntro is read once, on mount — flipping it later should not replay.
  }, [hue, seed, petalCount])

  const rootStyle = {
    height,
    "--cel-hue": String(hue),
    "--cel-ey": String(ECLIPSE_Y),
    "--cel-font": titleFont,
  } as React.CSSProperties

  const letters = Array.from(title)

  return (
    <div
      ref={rootRef}
      className={"cel-root " + className}
      style={rootStyle}
      data-phase={phase}
    >
      <style>{CEL_CSS}</style>
      <canvas ref={canvasRef} className="cel-canvas" aria-hidden="true" />

      <nav className="cel-nav" aria-label="Primary">
        <ul>
          {navItems.map((item, i) => (
            <li key={item.label + i}>
              <a
                className="cel-link"
                href={item.href ?? "#"}
                aria-current={i === active ? "page" : undefined}
                onClick={(ev) => {
                  if (!item.href || item.href === "#") ev.preventDefault()
                  setActive(i)
                  onNavigate?.(item, i, ev)
                }}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {replayOnEclipse && (
        <button
          type="button"
          className="cel-moon"
          aria-label="Replay the intro"
          title="Replay"
          tabIndex={phase === "landing" ? 0 : -1}
          onClick={() => engine.current?.replay()}
          onPointerEnter={() => engine.current?.hover(true)}
          onPointerLeave={() => engine.current?.hover(false)}
          onFocus={() => engine.current?.hover(true)}
          onBlur={() => engine.current?.hover(false)}
        />
      )}

      <div ref={heroRef} className="cel-hero">
        {eyebrow && <p className="cel-eyebrow">{eyebrow}</p>}
        <h1 className="cel-title" aria-label={title}>
          {letters.map((ch, i) => (
            <span key={i} className="cel-letter" aria-hidden="true" style={{ "--i": i } as React.CSSProperties}>
              <span className="cel-glyph">{ch === " " ? " " : ch}</span>
            </span>
          ))}
        </h1>
      </div>

      <div className="cel-foot">
        {kanji && <p className="cel-kanji">{kanji}</p>}
        {tagline.map((line, i) => (
          <p key={i} className="cel-tag">
            {line}
          </p>
        ))}
      </div>

      <div ref={gateRef} className="cel-gate" data-lit="false" aria-hidden={phase === "landing"}>
        {GATE_PETALS.map((p, i) => (
          <span
            key={i}
            className="cel-gp"
            style={
              {
                "--x": p.x,
                "--d": p.d,
                "--delay": p.delay,
                "--dx": p.dx,
                "--rot": p.rot,
                "--s": p.s,
              } as React.CSSProperties
            }
          />
        ))}
        <span className="cel-corner tl" />
        <span className="cel-corner tr" />
        <span className="cel-corner bl" />
        <span className="cel-corner br" />
        <span className="cel-gate-kanji">紅月</span>
        <p className="cel-gate-act">
          ACT · I
          <br />
          THE CRIMSON MOON
        </p>
        {eyebrow && <p className="cel-gate-eyebrow">{eyebrow}</p>}

        <div
          ref={ringRef}
          className="cel-ring"
          role="progressbar"
          aria-label="Loading"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={0}
        >
          <span className="cel-flash" />
          <svg viewBox="0 0 200 200" aria-hidden="true">
            {Array.from({ length: TICKS }, (_, i) => {
              const a = (i / TICKS) * Math.PI * 2 - Math.PI / 2
              const r0 = i % 5 === 0 ? 92 : 94.5
              return (
                <line
                  key={i}
                  ref={(el) => {
                    tickRefs.current[i] = el
                  }}
                  className="cel-tick"
                  x1={100 + Math.cos(a) * r0}
                  y1={100 + Math.sin(a) * r0}
                  x2={100 + Math.cos(a) * 99}
                  y2={100 + Math.sin(a) * 99}
                  strokeWidth={i % 5 === 0 ? 1.2 : 0.8}
                />
              )
            })}
            <circle className="cel-core" cx="100" cy="100" r="84" fill="#040001" />
            <circle cx="100" cy="100" r="88" fill="none" stroke={"hsl(" + hue + " 90% 50% / .18)"} strokeWidth="1" />
            <circle
              ref={arcRef}
              className="cel-arc"
              cx="100"
              cy="100"
              r="88"
              fill="none"
              stroke={"hsl(" + hue + " 100% 58%)"}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={ARC_C.toFixed(2)}
              strokeDashoffset={ARC_C.toFixed(2)}
              transform="rotate(-90 100 100)"
            />
            <circle className="cel-core" cx="100" cy="100" r="87" fill="none" stroke="#ffe4e6" strokeWidth="1.2" />
          </svg>
          <div className="cel-count">
            <span ref={countRef} className="cel-count-num">
              000
            </span>
            <span className="cel-count-label">LOADING</span>
          </div>
        </div>

        <p ref={statusRef} className="cel-gate-status" aria-live="polite">
          {loadingLabels[0] ?? ""}
        </p>
      </div>
      <div ref={irisRef} className="cel-iris" aria-hidden="true" />
    </div>
  )
}
