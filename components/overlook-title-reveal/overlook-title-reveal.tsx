"use client"

import * as React from "react"

/**
 * Overlook Title Reveal — a screen-print film poster that starts as nothing but
 * its title. The picture lives inside the letters: a red duotone ballroom bar,
 * seen only through the glyphs, on a plain sheet of paper. Scroll and the
 * letters swell — the title is dilated outwards, stroke by stroke — until the
 * picture has spread out of the words and fills the sheet. The title never
 * quite leaves: its black keyline thins and fades as the picture spreads, so
 * over the finished print the word is only faintly there. Then the billing block prints in underneath, and
 * the page is a poster.
 *
 * Self-contained: React is the only import. The picture is painted once from
 * numbers on an offscreen 2D canvas — marble walls, chandeliers, a crowd that
 * never left, a bar running to the vanishing point, a guest, a barman — all in
 * grey, then gradient-mapped through `palette` so the whole thing prints in
 * two inks. Pass `image` to reveal your own picture instead (it is duotoned
 * the same way when its host allows CORS).
 *
 * The pointer drifts the picture behind the letters like looking through a
 * window. Enter on the focused poster jumps to the end and back.
 * Honours prefers-reduced-motion: no drift, no easing, no parallax.
 */

export type OverlookBilling = [label: string, value: string]

export type OverlookTitleRevealProps = {
  /** The title. "\n" forces line breaks; otherwise it wraps to fit. */
  title?: string
  /** Your own picture. Leave out for the painted ballroom. */
  image?: string
  /** Gradient-map `image` through the palette (needs CORS). */
  duotone?: boolean
  /** Ink ramp from shadow to highlight. Hex, 2 to 8 stops. */
  palette?: string[]
  /** The sheet. "transparent" lets the page show through. */
  paper?: string
  /** Billing text and hint. */
  ink?: string
  /** The small title in the billing, the rim on the swelling letters. */
  accent?: string
  /** Any heavy face; nothing is loaded. */
  fontFamily?: string
  /** Horizontal squeeze of the title, 0.5..1. Poster titles run tall. */
  condense?: number
  /** Changes the crowd, the marble and the grain. */
  seed?: number
  /** Scroll length as a multiple of `height`. */
  scrollLength?: number
  /**
   * Stage height. Must be a definite length — "100%" collapses on a page that
   * has no height chain, which is most pages.
   */
  height?: string
  /** Pointer drift of the picture. */
  parallax?: boolean
  /** Keyline around the letters, kept over the finished poster. */
  outline?: string
  /** Keyline width in px. Default scales with the title. */
  outlineWidth?: number
  /** How far the picture outside the letters dims once it is full, 0..1. */
  veil?: number
  /** How visible the keyline stays over the full picture, 0..1. */
  ghost?: number
  /** Top of the billing block. */
  credit?: string
  /** Label / value pairs, set in the billing block. */
  billing?: OverlookBilling[]
  /** The print-run number in the corner box. */
  edition?: string
  /** "Scroll" hint under the title at rest. Empty hides it. */
  hint?: string
  className?: string
  /** Always on top (a nav, a button). */
  children?: React.ReactNode
}

// #region logic
export const ART_W = 1600
export const ART_H = 1000

export function clamp01(x: number) {
  return x <= 0 ? 0 : x > 1 ? 1 : x
}

export function smoothstep(a: number, b: number, x: number) {
  const t = clamp01((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}

/** 0 while the root's top is at the viewport top, 1 when its bottom arrives. */
export function progressFrom(top: number, height: number, viewport: number) {
  const travel = height - viewport
  return travel > 0 ? clamp01(-top / travel) : 0
}

/** Every moving part, from one scroll position. */
export function timeline(t: number) {
  const p = clamp01(t)
  return {
    hint: 1 - smoothstep(0, 0.06, p),
    spread: smoothstep(0.05, 0.68, p),
    // The title fits 88% of the frame, so it may grow 8% and still stay inside it.
    zoom: 1 + 0.08 * smoothstep(0.04, 0.68, p),
    veil: smoothstep(0.6, 0.85, p),
    credits: smoothstep(0.74, 0.96, p),
  }
}

export function hexToRgb(hex: string): [number, number, number] {
  let h = String(hex).trim().replace(/^#/, "")
  if (h.length === 3) h = h.split("").map((c) => c + c).join("")
  if (!/^[0-9a-f]{6}$/i.test(h)) return [0, 0, 0]
  const n = parseInt(h, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/** 256 RGB triples, the stops spread evenly from black to white. */
export function buildLut(stops: string[]) {
  const cols = (stops && stops.length ? stops.slice(0, 8) : ["#000000", "#ffffff"]).map(hexToRgb)
  if (cols.length === 1) cols.push(cols[0])
  const lut = new Uint8ClampedArray(768)
  for (let i = 0; i < 256; i++) {
    const f = (i / 255) * (cols.length - 1)
    const k = Math.min(cols.length - 2, Math.floor(f))
    const u = f - k
    for (let c = 0; c < 3; c++) lut[i * 3 + c] = Math.round(cols[k][c] + (cols[k + 1][c] - cols[k][c]) * u)
  }
  return lut
}

/** The printed area and the billing strip under it. */
export function posterFrame(w: number, h: number) {
  const margin = Math.round(Math.max(12, Math.min(56, w * 0.035)))
  const strip = w < 640 ? 118 : w < 1024 ? 104 : 96
  return {
    margin,
    strip,
    gap: Math.round(margin * 0.4),
    frame: { x: margin, y: margin, w: Math.max(1, w - margin * 2), h: Math.max(1, h - margin - Math.round(margin * 0.4) - strip) },
  }
}

/**
 * Cover-fit the art into a frame with `pad` px spare on every side (room for
 * parallax), putting the art's focal point as near the centre as coverage lets.
 */
export function coverFit(fw: number, fh: number, pad: number, fx: number, fy: number) {
  const s = Math.max((fw + pad * 2) / ART_W, (fh + pad * 2) / ART_H)
  const w = ART_W * s
  const h = ART_H * s
  // Any offset within ±pad must still cover: x ∈ [fw - w + pad, -pad].
  const x = Math.min(-pad, Math.max(fw - w + pad, fw / 2 - fx * w))
  const y = Math.min(-pad, Math.max(fh - h + pad, fh / 2 - fy * h))
  return { x, y, w, h }
}

/** Keyline width: full on the bare title, a third of it (never under 1px) once the picture is full. */
export function keylineWidth(base: number, spread: number) {
  const e = clamp01(spread)
  return base + (Math.max(1, base * 0.3) - base) * e
}

/** Keyline opacity: solid on the bare title, `ghost` once the picture is full. */
export function keylineAlpha(ghost: number, spread: number) {
  return 1 + (clamp01(ghost) - 1) * clamp01(spread)
}

/** Stroke width that dilates any title until it covers the whole frame. */
export function dilation(spread: number, fw: number, fh: number) {
  const e = clamp01(spread)
  return Math.pow(e, 1.35) * Math.hypot(fw, fh) * 1.25
}

/** Title size (px) for a set of lines, `measure` giving widths at 100px. */
export function titleSize(lines: string[], measure: (s: string) => number, fw: number, fh: number, condense: number) {
  const widest = Math.max(1, ...lines.map((l) => measure(l) * condense))
  const byWidth = (fw * 0.88 * 100) / widest
  const byHeight = (fh * 0.64) / (0.72 + (lines.length - 1) * 0.9)
  return Math.max(8, Math.min(byWidth, byHeight))
}

/** Explicit "\n" breaks win; otherwise the word grouping that sets largest. */
export function bestLines(title: string, measure: (s: string) => number, fw: number, fh: number, condense: number) {
  const clean = title.trim() || " "
  if (clean.includes("\n")) {
    const lines = clean.split("\n").map((l) => l.trim())
    return { lines, size: titleSize(lines, measure, fw, fh, condense) }
  }
  const words = clean.split(/\s+/)
  if (words.length > 8) return { lines: [clean], size: titleSize([clean], measure, fw, fh, condense) }
  let best = { lines: [clean], size: titleSize([clean], measure, fw, fh, condense) }
  for (let mask = 1; mask < 1 << (words.length - 1); mask++) {
    const lines: string[] = []
    let cur = words[0]
    for (let i = 1; i < words.length; i++) {
      if (mask & (1 << (i - 1))) {
        lines.push(cur)
        cur = words[i]
      } else cur += " " + words[i]
    }
    lines.push(cur)
    const size = titleSize(lines, measure, fw, fh, condense)
    // A new line has to earn a clear 12% to be worth breaking the title.
    if (size > best.size * 1.12) best = { lines, size }
  }
  return best
}

export function mulberry32(seed: number) {
  let a = seed | 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Smooth value noise in 0..1. */
export function makeNoise(seed: number) {
  const rnd = mulberry32(seed * 7919 + 13)
  const vals = new Float32Array(256).map(() => rnd())
  const perm = new Uint8Array(512)
  const p = Array.from({ length: 256 }, (_, i) => i)
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    const t = p[i]
    p[i] = p[j]
    p[j] = t
  }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255]
  const at = (x: number, y: number) => vals[perm[(perm[x & 255] + y) & 511]]
  return (x: number, y: number) => {
    const xi = Math.floor(x)
    const yi = Math.floor(y)
    const xf = x - xi
    const yf = y - yi
    const u = xf * xf * (3 - 2 * xf)
    const v = yf * yf * (3 - 2 * yf)
    const a = at(xi, yi) + (at(xi + 1, yi) - at(xi, yi)) * u
    const b = at(xi, yi + 1) + (at(xi + 1, yi + 1) - at(xi, yi + 1)) * u
    return a + (b - a) * v
  }
}
// #endregion

const DEFAULT_PALETTE = ["#131528", "#351326", "#7a191d", "#b42c24", "#d9573a", "#eca36b", "#f7dcaa"]
const DEFAULT_FONT =
  '"Bebas Neue", "Oswald", "Anton", "League Gothic", Impact, "Haettenschweiler", "Arial Narrow", "Helvetica Neue", Arial, sans-serif'
const DEFAULT_BILLING: OverlookBilling[] = [
  ["starring", "The Carpet · The Bar · The Long Hallway"],
  ["with", "Every Guest Who Never Left"],
  ["based on", "a scroll position"],
  ["screenplay by", "requestAnimationFrame"],
  ["produced by", "one canvas & no dependencies"],
]

// Where the eye lands in the painting: the far end of the bar.
const FOCUS_X = 0.56
const FOCUS_Y = 0.46

// ---------------------------------------------------------------------------
// The painting. Everything is drawn in grey (value = how much light), then
// every pixel is looked up in the palette, which is what makes it a print.

const VPX = 880
const VPY = 400
const K = 420
const EYE = 1.6
const g = (v: number, a = 1) => {
  const c = Math.max(0, Math.min(255, Math.round(v)))
  return a >= 1 ? "rgb(" + c + "," + c + "," + c + ")" : "rgba(" + c + "," + c + "," + c + "," + a + ")"
}
const proj = (X: number, Y: number, z: number): [number, number, number] => {
  const s = 1 / z
  return [VPX + X * K * s, VPY - (Y - EYE) * K * s, s]
}

function poly(ctx: CanvasRenderingContext2D, pts: number[][], fill: string | CanvasGradient) {
  ctx.beginPath()
  ctx.moveTo(pts[0][0], pts[0][1])
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1])
  ctx.closePath()
  ctx.fillStyle = fill
  ctx.fill()
}

function glow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, v: number, a: number) {
  const gr = ctx.createRadialGradient(x, y, 0, x, y, r)
  gr.addColorStop(0, g(v, a))
  gr.addColorStop(1, g(v, 0))
  ctx.fillStyle = gr
  ctx.fillRect(x - r, y - r, r * 2, r * 2)
}

function paintBallroom(ctx: CanvasRenderingContext2D, seed: number) {
  const rnd = mulberry32(seed)
  const noise = makeNoise(seed)
  const fbm = (x: number, y: number) => {
    let a = 0.5
    let f = 1
    let s = 0
    for (let o = 0; o < 5; o++) {
      s += a * noise(x * f, y * f)
      f *= 2.03
      a *= 0.5
    }
    return s / 0.97
  }

  // 1. Marble walls and ceiling, at low resolution, then scaled up soft.
  const LW = 400
  const LH = 250
  const low = document.createElement("canvas")
  low.width = LW
  low.height = LH
  const lctx = low.getContext("2d")!
  const img = lctx.createImageData(LW, LH)
  for (let y = 0; y < LH; y++) {
    for (let x = 0; x < LW; x++) {
      const u = (x / LW) * 5
      const v = (y / LH) * 3.1
      const qx = fbm(u, v)
      const qy = fbm(u + 5.2, v + 1.3)
      const r = fbm(u + 3 * qx + 1.7, v + 3 * qy + 9.2)
      const vein = 1 - Math.abs(Math.sin(r * 18))
      let val = 0.16 + 0.52 * r + 0.34 * Math.pow(vein, 5)
      const dx = x / LW - 0.55
      const dy = y / LH - 0.4
      val *= 0.7 + 0.55 * Math.exp(-(dx * dx * 3 + dy * dy * 5))
      val *= 1 - 0.5 * smoothstep(0.5, 1, y / LH)
      const c = Math.max(0, Math.min(255, val * 255))
      const i = (y * LW + x) * 4
      img.data[i] = img.data[i + 1] = img.data[i + 2] = c
      img.data[i + 3] = 255
    }
  }
  lctx.putImageData(img, 0, 0)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = "high"
  ctx.drawImage(low, 0, 0, ART_W, ART_H)

  // 2. Engraved swirl lines: streamlines through the same noise.
  ctx.lineCap = "round"
  for (let i = 0; i < 1100; i++) {
    let x = rnd() * ART_W
    let y = rnd() * ART_H * 0.72
    const light = rnd() < 0.5
    ctx.beginPath()
    ctx.moveTo(x, y)
    for (let k = 0; k < 34; k++) {
      const a = fbm(x / 260, y / 260) * Math.PI * 4
      x += Math.cos(a) * 6
      y += Math.sin(a) * 6
      ctx.lineTo(x, y)
    }
    ctx.strokeStyle = light ? g(255, 0.1) : g(0, 0.13)
    ctx.lineWidth = light ? 0.9 : 1.2
    ctx.stroke()
  }

  // 3. Coffered ceiling running to the vanishing point.
  ctx.lineWidth = 1.2
  for (let X = -9; X <= 9; X += 1.1) {
    const [x0, y0] = proj(X, 4.4, 0.6)
    ctx.beginPath()
    ctx.moveTo(x0, y0)
    ctx.lineTo(VPX, VPY)
    ctx.strokeStyle = g(255, 0.09)
    ctx.stroke()
  }
  for (let z = 1; z < 40; z *= 1.32) {
    const [xa, y] = proj(-12, 4.4, z)
    const [xb] = proj(12, 4.4, z)
    ctx.beginPath()
    ctx.moveTo(xa, y)
    ctx.lineTo(xb, y)
    ctx.strokeStyle = g(255, 0.07)
    ctx.stroke()
  }
  glow(ctx, VPX, VPY, 420, 235, 0.32)

  // 4. Chandeliers, far to near.
  for (let i = 9; i >= 0; i--) {
    const z = 2.6 + i * 1.35
    for (const side of [-1, 1]) {
      const [cx, cy, s] = proj(side * (1.9 + rnd() * 0.5), 4.0, z)
      const u = K * s
      glow(ctx, cx, cy, 0.9 * u, 255, 0.34)
      ctx.beginPath()
      ctx.moveTo(cx, cy - 0.12 * u)
      ctx.lineTo(cx, 0)
      ctx.strokeStyle = g(40, 0.6)
      ctx.lineWidth = Math.max(0.6, 0.012 * u)
      ctx.stroke()
      for (let tier = 0; tier < 3; tier++) {
        const rx = (0.34 - tier * 0.09) * u
        const ry = 0.07 * u
        const ty = cy + tier * 0.1 * u
        const n = 14 - tier * 3
        for (let j = 0; j < n; j++) {
          const a = (j / n) * Math.PI * 2 + tier
          const dy = Math.sin(a) * ry
          ctx.fillStyle = g(dy > 0 ? 255 : 200)
          ctx.beginPath()
          ctx.arc(cx + Math.cos(a) * rx, ty + dy, Math.max(0.7, 0.022 * u), 0, Math.PI * 2)
          ctx.fill()
          if (rnd() < 0.5) {
            ctx.fillRect(cx + Math.cos(a) * rx - 0.3, ty + dy, 0.8, 0.09 * u)
          }
        }
      }
    }
  }

  // 5. The crowd, far to near.
  type Guest = { X: number; z: number; stand: boolean; kind: number; lamp: boolean }
  const crowd: Guest[] = []
  for (let i = 0; i < 90; i++) {
    const z = 2.3 + Math.pow(rnd(), 0.8) * 15
    const X = -7.5 + rnd() * 9.2
    if (Math.abs(X + 0.4) < 0.55) continue
    crowd.push({ X, z, stand: rnd() < 0.3, kind: rnd(), lamp: rnd() < 0.28 })
  }
  crowd.sort((a, b) => b.z - a.z)
  for (const f of crowd) {
    const [hx, hy, s] = proj(f.X, f.stand ? 1.66 : 1.3, f.z)
    const u = K * s
    const haze = clamp01((f.z - 2) / 15)
    const base = 20 + haze * 80 + rnd() * 14
    const bottom = hy + 1.4 * u
    const body = ctx.createLinearGradient(hx - 0.3 * u, 0, hx + 0.3 * u, 0)
    const lit = f.X < -0.4 ? 1 : -1
    body.addColorStop(0, g(base + (lit < 0 ? 26 : 0)))
    body.addColorStop(1, g(base + (lit > 0 ? 26 : 0)))
    ctx.beginPath()
    ctx.moveTo(hx - 0.3 * u, bottom)
    ctx.lineTo(hx - 0.28 * u, hy + 0.36 * u)
    ctx.quadraticCurveTo(hx - 0.26 * u, hy + 0.16 * u, hx - 0.07 * u, hy + 0.14 * u)
    ctx.lineTo(hx + 0.07 * u, hy + 0.14 * u)
    ctx.quadraticCurveTo(hx + 0.26 * u, hy + 0.16 * u, hx + 0.28 * u, hy + 0.36 * u)
    ctx.lineTo(hx + 0.3 * u, bottom)
    ctx.closePath()
    ctx.fillStyle = body
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(hx, hy, 0.1 * u, 0.125 * u, 0, 0, Math.PI * 2)
    ctx.fillStyle = g(base + 8)
    ctx.fill()
    if (f.kind < 0.22) {
      // A pale face turned to the camera. Nobody here has blinked in years.
      ctx.beginPath()
      ctx.ellipse(hx, hy + 0.01 * u, 0.078 * u, 0.1 * u, 0, 0, Math.PI * 2)
      ctx.fillStyle = g(175 + rnd() * 50)
      ctx.fill()
      ctx.fillStyle = g(25)
      for (const e of [-1, 1]) {
        ctx.beginPath()
        ctx.ellipse(hx + e * 0.03 * u, hy - 0.005 * u, 0.018 * u, 0.024 * u, 0, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.fillRect(hx - 0.025 * u, hy + 0.055 * u, 0.05 * u, Math.max(0.6, 0.008 * u))
    } else {
      ctx.beginPath()
      ctx.arc(hx, hy, 0.1 * u, lit > 0 ? -1.2 : Math.PI - 1.2, lit > 0 ? 1.2 : Math.PI + 1.2)
      ctx.strokeStyle = g(base + 130, 0.8)
      ctx.lineWidth = Math.max(0.7, 0.02 * u)
      ctx.stroke()
    }
    if (f.kind > 0.6) {
      poly(ctx, [[hx - 0.07 * u, hy + 0.15 * u], [hx + 0.07 * u, hy + 0.15 * u], [hx, hy + 0.44 * u]], g(222))
      poly(ctx, [[hx - 0.045 * u, hy + 0.15 * u], [hx, hy + 0.18 * u], [hx - 0.045 * u, hy + 0.21 * u]], g(18))
      poly(ctx, [[hx + 0.045 * u, hy + 0.15 * u], [hx, hy + 0.18 * u], [hx + 0.045 * u, hy + 0.21 * u]], g(18))
    }
    if (f.lamp) {
      const [lx, ly, ls] = proj(f.X + 0.4, 0.98, f.z - 0.3)
      glow(ctx, lx, ly, 0.35 * K * ls, 255, 0.5)
      ctx.fillStyle = g(255)
      ctx.beginPath()
      ctx.arc(lx, ly, Math.max(0.8, 0.025 * K * ls), 0, Math.PI * 2)
      ctx.fill()
    }
  }
  glow(ctx, VPX, VPY + 20, 300, 230, 0.22)

  // 6. The back bar, the bottles and the window, on the right.
  const wall = ctx.createLinearGradient(1060, 0, 1600, 0)
  wall.addColorStop(0, g(62))
  wall.addColorStop(1, g(34))
  poly(ctx, [[1080, 170], [1600, 120], [1600, 1000], [1080, 1000]], wall)
  for (const shelf of [560, 700]) {
    ctx.fillStyle = g(95)
    ctx.fillRect(1090, shelf, 380, 5)
    let x = 1098
    while (x < 1450) {
      const bw = 10 + rnd() * 14
      const bh = 44 + rnd() * 70
      const v = 50 + rnd() * 70
      ctx.fillStyle = g(v)
      ctx.beginPath()
      ctx.roundRect(x, shelf - bh, bw, bh, [bw * 0.45, bw * 0.45, 1, 1])
      ctx.fill()
      ctx.fillRect(x + bw * 0.3, shelf - bh - 16, bw * 0.4, 18)
      ctx.fillStyle = g(235, 0.85)
      ctx.fillRect(x + bw * 0.22, shelf - bh + 8, 1.4, bh * 0.6)
      x += bw + 4 + rnd() * 8
    }
  }
  const win = ctx.createLinearGradient(1480, 0, 1600, 0)
  win.addColorStop(0, g(215))
  win.addColorStop(1, g(250))
  poly(ctx, [[1478, 150], [1600, 140], [1600, 790], [1478, 790]], win)
  ctx.fillStyle = g(55)
  ctx.fillRect(1472, 140, 10, 660)
  ctx.fillRect(1535, 140, 6, 660)
  for (const y of [320, 480, 640]) ctx.fillRect(1478, y, 122, 6)
  glow(ctx, 1480, 470, 260, 250, 0.2)

  // 7. The bar: a pale top running to the vanishing point, a dark panelled face.
  const top = ctx.createLinearGradient(0, 1000, 0, VPY)
  top.addColorStop(0, g(252))
  top.addColorStop(1, g(212))
  poly(ctx, [proj(-0.64, 1.05, 0.36), proj(-0.2, 1.05, 0.36), proj(-0.2, 1.05, 60), proj(-0.64, 1.05, 60)], top)
  poly(ctx, [proj(-0.2, 1.05, 0.36), proj(-0.2, 1.05, 60), proj(-0.2, 0, 60), proj(-0.2, 0, 0.36)], g(34))
  ctx.lineWidth = 2
  for (let z = 0.5; z < 20; z *= 1.4) {
    const a = proj(-0.2, 0.98, z)
    const b = proj(-0.2, 0, z)
    ctx.beginPath()
    ctx.moveTo(a[0], a[1])
    ctx.lineTo(b[0], b[1])
    ctx.strokeStyle = g(80, 0.8)
    ctx.stroke()
  }
  {
    const a = proj(-0.2, 0.99, 0.36)
    const b = proj(-0.2, 0.99, 60)
    ctx.beginPath()
    ctx.moveTo(a[0], a[1])
    ctx.lineTo(b[0], b[1])
    ctx.strokeStyle = g(160)
    ctx.lineWidth = 3
    ctx.stroke()
  }
  for (const z of [1.6, 2.4, 3.3, 4.8]) {
    const [gx, gy, s] = proj(-0.44 + rnd() * 0.12, 1.05, z)
    const u = K * s
    ctx.strokeStyle = g(40, 0.9)
    ctx.lineWidth = Math.max(1, 0.012 * u)
    ctx.strokeRect(gx - 0.035 * u, gy - 0.13 * u, 0.07 * u, 0.13 * u)
    ctx.fillStyle = g(120, 0.8)
    ctx.fillRect(gx - 0.03 * u, gy - 0.06 * u, 0.06 * u, 0.06 * u)
  }

  // 8. Two blades of light across the ceiling.
  poly(ctx, [[972, 0], [1070, 0], [884, 330], [872, 330]], g(252))
  poly(ctx, [[1168, 0], [1214, 0], [1042, 282], [1036, 282]], g(248))

  // 9. The guest at the bar, from behind.
  {
    const coat = ctx.createLinearGradient(260, 0, 820, 0)
    coat.addColorStop(0, g(14))
    coat.addColorStop(0.75, g(34))
    coat.addColorStop(1, g(58))
    ctx.beginPath()
    ctx.moveTo(210, 1000)
    ctx.bezierCurveTo(215, 770, 300, 650, 450, 612)
    ctx.bezierCurveTo(510, 596, 600, 594, 660, 612)
    ctx.bezierCurveTo(760, 640, 800, 730, 820, 860)
    ctx.lineTo(790, 1000)
    ctx.closePath()
    ctx.fillStyle = coat
    ctx.fill()
    // The arm, reaching for the glass on the bar.
    ctx.beginPath()
    ctx.moveTo(630, 626)
    ctx.bezierCurveTo(660, 600, 690, 584, 708, 574)
    ctx.lineTo(730, 594)
    ctx.bezierCurveTo(736, 630, 770, 680, 806, 760)
    ctx.closePath()
    ctx.fillStyle = g(30)
    ctx.fill()
    ctx.strokeStyle = g(245)
    ctx.lineWidth = 2.5
    ctx.strokeRect(704, 512, 30, 54)
    ctx.fillStyle = g(170, 0.7)
    ctx.fillRect(706, 536, 26, 28)
    ctx.beginPath()
    ctx.ellipse(716, 578, 22, 14, -0.4, 0, Math.PI * 2)
    ctx.fillStyle = g(150)
    ctx.fill()
    // Head, hair, and the bar light catching the jaw.
    ctx.beginPath()
    ctx.ellipse(556, 505, 68, 84, 0.08, 0, Math.PI * 2)
    ctx.fillStyle = g(30)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(546, 470, 70, 60, 0.1, Math.PI, Math.PI * 2)
    ctx.fillStyle = g(12)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(556, 505, 68, 84, 0.08, -1.0, 1.1)
    ctx.strokeStyle = g(225)
    ctx.lineWidth = 4
    ctx.stroke()
    ctx.beginPath()
    ctx.ellipse(618, 516, 10, 20, 0.2, 0, Math.PI * 2)
    ctx.fillStyle = g(150)
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(660, 612)
    ctx.bezierCurveTo(760, 640, 800, 730, 820, 860)
    ctx.strokeStyle = g(170, 0.9)
    ctx.lineWidth = 3
    ctx.stroke()
  }

  // 10. The barman, in profile, lit from the bar.
  {
    const jacket = ctx.createLinearGradient(1000, 0, 1520, 0)
    jacket.addColorStop(0, g(62))
    jacket.addColorStop(0.35, g(24))
    jacket.addColorStop(1, g(12))
    ctx.beginPath()
    ctx.moveTo(1000, 1000)
    ctx.bezierCurveTo(1010, 760, 1045, 560, 1150, 482)
    ctx.lineTo(1212, 440)
    ctx.lineTo(1290, 440)
    ctx.lineTo(1352, 474)
    ctx.bezierCurveTo(1452, 505, 1500, 630, 1530, 1000)
    ctx.closePath()
    ctx.fillStyle = jacket
    ctx.fill()
    poly(ctx, [[1212, 442], [1290, 442], [1252, 566]], g(236))
    poly(ctx, [[1228, 452], [1252, 462], [1228, 474]], g(10))
    poly(ctx, [[1276, 452], [1252, 462], [1276, 474]], g(10))
    ctx.strokeStyle = g(90, 0.8)
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(1212, 442)
    ctx.lineTo(1170, 620)
    ctx.moveTo(1290, 442)
    ctx.lineTo(1320, 610)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(1150, 482)
    ctx.bezierCurveTo(1045, 560, 1010, 760, 1000, 1000)
    ctx.strokeStyle = g(165, 0.85)
    ctx.lineWidth = 3
    ctx.stroke()
    // His arm across the bar, a glass in his hand.
    ctx.beginPath()
    ctx.moveTo(1070, 622)
    ctx.bezierCurveTo(1000, 632, 890, 636, 824, 640)
    ctx.lineTo(830, 680)
    ctx.bezierCurveTo(900, 690, 1020, 700, 1100, 700)
    ctx.closePath()
    ctx.fillStyle = g(26)
    ctx.fill()
    ctx.strokeStyle = g(245)
    ctx.lineWidth = 2.5
    ctx.strokeRect(790, 594, 32, 56)
    ctx.beginPath()
    ctx.ellipse(816, 660, 24, 17, 0.2, 0, Math.PI * 2)
    ctx.fillStyle = g(160)
    ctx.fill()
    // Head: the near side dark, the face turned to the light.
    ctx.save()
    ctx.beginPath()
    ctx.ellipse(1252, 352, 58, 74, -0.05, 0, Math.PI * 2)
    ctx.clip()
    const face = ctx.createLinearGradient(1192, 0, 1300, 0)
    face.addColorStop(0, g(215))
    face.addColorStop(0.45, g(120))
    face.addColorStop(0.7, g(32))
    face.addColorStop(1, g(18))
    ctx.fillStyle = face
    ctx.fillRect(1180, 270, 140, 170)
    ctx.beginPath()
    ctx.ellipse(1262, 300, 70, 40, -0.1, Math.PI, Math.PI * 2)
    ctx.fillStyle = g(14)
    ctx.fill()
    ctx.fillStyle = g(40)
    ctx.beginPath()
    ctx.ellipse(1276, 360, 11, 18, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
    poly(ctx, [[1196, 338], [1180, 372], [1198, 378]], g(210))
    ctx.fillStyle = g(30, 0.8)
    ctx.fillRect(1216, 342, 16, 4)
    ctx.fillRect(1204, 398, 18, 3)
    ctx.beginPath()
    ctx.moveTo(1230, 420)
    ctx.lineTo(1275, 420)
    ctx.lineTo(1290, 442)
    ctx.lineTo(1212, 442)
    ctx.closePath()
    ctx.fillStyle = g(40)
    ctx.fill()
  }

  // 11. Engraving: fine diagonal hatch over everything.
  ctx.save()
  ctx.globalCompositeOperation = "multiply"
  ctx.strokeStyle = g(196)
  ctx.lineWidth = 1
  ctx.beginPath()
  for (let d = -ART_H; d < ART_W; d += 5) {
    ctx.moveTo(d, ART_H)
    ctx.lineTo(d + ART_H, 0)
  }
  ctx.stroke()
  ctx.restore()
}

/** Grey → palette, plus a vignette and a little print grain. */
function gradientMap(ctx: CanvasRenderingContext2D, lut: Uint8ClampedArray, seed: number, grey: boolean) {
  const data = ctx.getImageData(0, 0, ART_W, ART_H)
  const d = data.data
  const rnd = mulberry32(seed + 101)
  for (let y = 0; y < ART_H; y++) {
    const dy = y / ART_H - 0.5
    for (let x = 0; x < ART_W; x++) {
      const i = (y * ART_W + x) * 4
      const dx = x / ART_W - 0.5
      let v = grey ? d[i] : d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11
      v = v * (1 - 0.55 * (dx * dx + dy * dy * 1.4)) + (rnd() - 0.5) * 18
      const k = (v < 0 ? 0 : v > 255 ? 255 : v | 0) * 3
      d[i] = lut[k]
      d[i + 1] = lut[k + 1]
      d[i + 2] = lut[k + 2]
    }
  }
  ctx.putImageData(data, 0, 0)
}

function paintArt(art: HTMLCanvasElement, palette: string[], seed: number, picture: HTMLImageElement | null, duotone: boolean) {
  art.width = ART_W
  art.height = ART_H
  const ctx = art.getContext("2d", { willReadFrequently: true })!
  const lut = buildLut(palette)
  if (picture) {
    const s = Math.max(ART_W / picture.naturalWidth, ART_H / picture.naturalHeight)
    const w = picture.naturalWidth * s
    const h = picture.naturalHeight * s
    ctx.drawImage(picture, (ART_W - w) / 2, (ART_H - h) / 2, w, h)
    if (duotone) {
      try {
        gradientMap(ctx, lut, seed, false)
      } catch {
        // The host sent no CORS header, so the pixels are sealed. Show it as is.
      }
    }
    return
  }
  ctx.fillStyle = "#000"
  ctx.fillRect(0, 0, ART_W, ART_H)
  paintBallroom(ctx, seed)
  gradientMap(ctx, lut, seed, true)
}

const MAZE = "M1 1H15V15H1V4M4 12V4H12V12H7M7 9V7H9"

function scrollParent(el: HTMLElement | null): HTMLElement | null {
  let n = el?.parentElement ?? null
  while (n && n !== document.body) {
    const oy = getComputedStyle(n).overflowY
    if ((oy === "auto" || oy === "scroll") && n.scrollHeight > n.clientHeight) return n
    n = n.parentElement
  }
  return null
}

export default function OverlookTitleReveal({
  title = "THE SHINING",
  image,
  duotone = true,
  palette = DEFAULT_PALETTE,
  paper = "#f2d6a2",
  ink = "#4a1d1a",
  accent = "#b3241c",
  fontFamily = DEFAULT_FONT,
  condense = 0.84,
  seed = 7,
  scrollLength = 3.2,
  height = "100svh",
  parallax = true,
  outline = "#0b0a0d",
  outlineWidth,
  veil = 0.15,
  ghost = 0.4,
  credit = "A Kedhareswer picture",
  billing = DEFAULT_BILLING,
  edition = "17 / 60",
  hint = "Scroll",
  className = "",
  children,
}: OverlookTitleRevealProps) {
  const rootRef = React.useRef<HTMLDivElement>(null)
  const stageRef = React.useRef<HTMLDivElement>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const creditsRef = React.useRef<HTMLDivElement>(null)
  const hintRef = React.useRef<HTMLDivElement>(null)
  const progressRef = React.useRef(0)
  const [layout, setLayout] = React.useState({ margin: 24, strip: 96, gap: 10 })

  const clear = paper === "transparent" || paper === "none" || paper === ""
  const textInk = clear ? "var(--color-foreground, currentColor)" : ink
  const paletteKey = palette.join(",")

  React.useEffect(() => {
    const root = rootRef.current
    const stage = stageRef.current
    const canvas = canvasRef.current
    if (!root || !stage || !canvas) return
    const ctx = canvas.getContext("2d")
    const mask = document.createElement("canvas")
    const mctx = mask.getContext("2d")
    if (!ctx || !mctx) return

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const k = Math.max(0.5, Math.min(1, condense))
    const font = (px: number) => "900 " + px.toFixed(2) + "px " + fontFamily
    const shade = palette[0] || "#000000"

    let W = 1
    let H = 1
    let dpr = 1
    let pf = posterFrame(1, 1)
    let fit = coverFit(1, 1, 0, FOCUS_X, FOCUS_Y)
    let pad = 0
    let titleLines: string[] = [title]
    let size = 100
    let cap = 72
    let art: HTMLCanvasElement | null = null
    let paperTile: CanvasPattern | null = null
    let dirty = true
    let prog = progressRef.current
    let raf = 0
    let visible = true
    let cancelled = false
    const par = { x: 0, y: 0, tx: 0, ty: 0 }
    const t0 = performance.now()

    // Paper tooth: a small tile of specks, laid once.
    if (!clear) {
      const tile = document.createElement("canvas")
      tile.width = tile.height = 160
      const tctx = tile.getContext("2d")!
      const r = mulberry32(seed + 3)
      for (let i = 0; i < 1400; i++) {
        tctx.fillStyle = r() < 0.5 ? "rgba(90,40,20,0.07)" : "rgba(255,255,255,0.12)"
        tctx.fillRect(r() * 160, r() * 160, 1 + r() * 1.4, 1 + r() * 1.4)
      }
      paperTile = ctx.createPattern(tile, "repeat")
    }

    const relayout = () => {
      W = Math.max(1, stage.clientWidth)
      H = Math.max(1, stage.clientHeight)
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      for (const c of [canvas, mask]) {
        c.width = Math.round(W * dpr)
        c.height = Math.round(H * dpr)
      }
      pf = posterFrame(W, H)
      const f = pf.frame
      pad = Math.max(10, Math.min(28, Math.min(f.w, f.h) * 0.03))
      fit = coverFit(f.w, f.h, pad, FOCUS_X, FOCUS_Y)
      ctx.font = font(100)
      const best = bestLines(title, (s) => ctx.measureText(s).width, f.w, f.h, k)
      titleLines = best.lines
      size = best.size
      ctx.font = font(size)
      const m = ctx.measureText(titleLines.join(""))
      cap = m.actualBoundingBoxAscent || size * 0.72
      setLayout((l) =>
        l.margin === pf.margin && l.strip === pf.strip && l.gap === pf.gap ? l : { margin: pf.margin, strip: pf.strip, gap: pf.gap },
      )
      dirty = true
    }

    // The title as a shape: filled, and stroked `grow` px fat to dilate it.
    // With `keyline` > 0 it is only stroked, that wide: the letters' outline.
    const titleShape = (c: CanvasRenderingContext2D, zoom: number, grow: number, keyline = 0) => {
      const f = pf.frame
      const cx = f.x + f.w / 2
      const cy = f.y + f.h / 2
      const lh = size * 0.9
      const block = cap + (titleLines.length - 1) * lh
      c.save()
      c.beginPath()
      c.rect(f.x, f.y, f.w, f.h)
      c.clip()
      c.translate(cx, cy)
      c.scale(zoom, zoom)
      c.font = font(size)
      c.textAlign = "center"
      c.textBaseline = "alphabetic"
      c.lineJoin = "round"
      c.lineCap = "round"
      titleLines.forEach((line, i) => {
        c.save()
        c.translate(0, -block / 2 + cap + i * lh)
        c.scale(k, 1)
        if (keyline > 0) {
          c.lineJoin = "miter"
          c.lineWidth = keyline / zoom / Math.sqrt(k)
          c.strokeText(line, 0, 0)
          c.restore()
          return
        }
        c.fillText(line, 0, 0)
        if (grow > 0.5) {
          // Stroke width is squeezed by the condense too; fatten to keep it round-ish.
          c.lineWidth = grow / zoom / Math.sqrt(k)
          c.strokeText(line, 0, 0)
        }
        c.restore()
      })
      c.restore()
    }

    const draw = () => {
      const T = timeline(prog)
      const f = pf.frame
      const full = T.spread >= 0.999
      const grow = dilation(T.spread, f.w, f.h)

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, W, H)
      if (!clear) {
        ctx.fillStyle = paper
        ctx.fillRect(0, 0, W, H)
        if (paperTile) {
          ctx.fillStyle = paperTile
          ctx.fillRect(0, 0, W, H)
        }
      }

      // A thin accent rim rides the edge of the swelling letters.
      if (T.spread > 0.002 && !full) {
        ctx.fillStyle = ctx.strokeStyle = accent
        ctx.globalAlpha = smoothstep(0, 0.05, T.spread)
        titleShape(ctx, T.zoom, grow + 5)
        ctx.globalAlpha = 1
      }

      const ax = f.x + fit.x + par.x
      const ay = f.y + fit.y + par.y
      mctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      mctx.globalCompositeOperation = "source-over"
      mctx.clearRect(0, 0, W, H)
      mctx.fillStyle = mctx.strokeStyle = "#000"
      if (full) mctx.fillRect(f.x, f.y, f.w, f.h)
      else titleShape(mctx, T.zoom, grow)
      mctx.globalCompositeOperation = "source-in"
      if (art) mctx.drawImage(art, ax, ay, fit.w, fit.h)
      else {
        mctx.fillStyle = accent
        mctx.fillRect(0, 0, W, H)
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.drawImage(mask, 0, 0)

      // Once the picture is full, dim the room outside the letters so the word
      // still reads: a shade over the frame with the title punched out of it.
      const dim = T.veil * clamp01(veil)
      if (dim > 0.001) {
        mctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        mctx.globalCompositeOperation = "source-over"
        mctx.clearRect(0, 0, W, H)
        mctx.globalAlpha = dim
        mctx.fillStyle = shade
        mctx.fillRect(f.x, f.y, f.w, f.h)
        mctx.globalAlpha = 1
        mctx.globalCompositeOperation = "destination-out"
        mctx.fillStyle = "#000"
        titleShape(mctx, T.zoom, 0)
        ctx.drawImage(mask, 0, 0)
      }

      // The keyline: bold on the bare title, then thinning and fading as the
      // picture spreads, so the picture leads and the word is only just there.
      // A hairline of paper under it keeps it from vanishing on the darkest parts.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const k0 = outlineWidth ?? Math.max(2, size * 0.022)
      if (k0 > 0) {
        const kw = keylineWidth(k0, T.spread)
        const ka = keylineAlpha(ghost, T.spread)
        if (T.spread > 0.002) {
          ctx.strokeStyle = clear ? "rgba(255,255,255,0.85)" : paper
          ctx.globalAlpha = smoothstep(0, 0.2, T.spread) * ka * 0.6
          titleShape(ctx, T.zoom, 0, kw + 1.5)
        }
        ctx.globalAlpha = ka
        ctx.strokeStyle = outline
        titleShape(ctx, T.zoom, 0, kw)
        ctx.globalAlpha = 1
      }
      const cr = creditsRef.current
      if (cr) {
        cr.style.opacity = T.credits.toFixed(3)
        cr.style.transform = "translateY(" + ((1 - T.credits) * 14).toFixed(1) + "px)"
        cr.style.visibility = T.credits > 0.01 ? "visible" : "hidden"
      }
      const hn = hintRef.current
      if (hn) hn.style.opacity = T.hint.toFixed(3)
    }

    const frame = (now: number) => {
      raf = 0
      if (!visible || document.hidden) return
      const r = root.getBoundingClientRect()
      const target = progressFrom(r.top, r.height, stage.offsetHeight)
      const before = prog
      prog = reduced ? target : prog + (target - prog) * 0.16
      if (Math.abs(target - prog) < 0.0004) prog = target
      progressRef.current = prog
      if (prog !== before) dirty = true
      if (parallax && !reduced) {
        const t = (now - t0) / 1000
        // Pointer 75%, idle drift 25%: never more than `pad`, which the fit keeps spare.
        const dx = Math.sin(t * 0.21) * 0.25
        const dy = Math.cos(t * 0.17) * 0.25
        const nx = par.x + ((-par.tx * 0.75 - dx) * pad - par.x) * 0.06
        const ny = par.y + ((-par.ty * 0.75 - dy) * pad - par.y) * 0.06
        if (Math.abs(nx - par.x) + Math.abs(ny - par.y) > 0.01) dirty = true
        par.x = nx
        par.y = ny
      }
      if (dirty) {
        draw()
        dirty = false
      }
      raf = requestAnimationFrame(frame)
    }
    const kick = () => {
      if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame)
    }

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return
      const r = stage.getBoundingClientRect()
      par.tx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1))
      par.ty = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1))
    }
    const onLeave = () => {
      par.tx = 0
      par.ty = 0
    }
    const onScroll = () => kick()
    const onVis = () => kick()
    const onFonts = () => {
      relayout()
      kick()
    }

    const ro = new ResizeObserver(() => {
      relayout()
      kick()
    })
    ro.observe(stage)
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      kick()
    })
    io.observe(root)
    stage.addEventListener("pointermove", onMove)
    stage.addEventListener("pointerleave", onLeave)
    // Capture on window hears scrolls from any scrolling ancestor, not just the page.
    window.addEventListener("scroll", onScroll, { passive: true, capture: true })
    document.addEventListener("visibilitychange", onVis)
    document.fonts?.addEventListener?.("loadingdone", onFonts)
    document.fonts?.ready.then(() => !cancelled && onFonts())

    relayout()
    kick()

    // Paint the picture after the first frame, so the title shows at once in solid accent.
    const picture = image ? new Image() : null
    const bake = () => {
      if (cancelled) return
      const c = document.createElement("canvas")
      paintArt(c, palette, seed, picture && picture.naturalWidth ? picture : null, duotone)
      art = c
      dirty = true
      kick()
    }
    let idle = 0
    if (picture) {
      picture.crossOrigin = "anonymous"
      picture.decoding = "async"
      picture.onload = bake
      picture.onerror = () => {
        // No CORS or no file: try once more without CORS, then fall back to the ballroom.
        if (picture.crossOrigin && image) {
          picture.crossOrigin = null
          picture.src = image + ""
        } else {
          picture.onerror = null
          picture.removeAttribute("src")
          bake()
        }
      }
      picture.src = image!
    } else {
      idle = window.setTimeout(bake, 30)
    }

    return () => {
      cancelled = true
      window.clearTimeout(idle)
      if (raf) cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      stage.removeEventListener("pointermove", onMove)
      stage.removeEventListener("pointerleave", onLeave)
      window.removeEventListener("scroll", onScroll, { capture: true })
      document.removeEventListener("visibilitychange", onVis)
      document.fonts?.removeEventListener?.("loadingdone", onFonts)
      if (picture) {
        picture.onload = picture.onerror = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, image, duotone, paletteKey, paper, accent, outline, outlineWidth, veil, ghost, fontFamily, condense, seed, parallax, clear])

  // Enter jumps to the finished poster, and back to the bare title.
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key !== "Enter") return
    const root = rootRef.current
    const stage = stageRef.current
    if (!root || !stage) return
    e.preventDefault()
    const r = root.getBoundingClientRect()
    const travel = r.height - stage.offsetHeight
    const goal = progressRef.current < 0.5 ? travel : 0
    const by = r.top + goal
    const smooth = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"
    const sp = scrollParent(root)
    if (sp) sp.scrollBy({ top: by, behavior: smooth })
    else window.scrollBy({ top: by, behavior: smooth })
  }

  return (
    <div
      ref={rootRef}
      className={"relative w-full " + className}
      style={{ height: "calc(" + height + " * " + Math.max(1.5, scrollLength) + ")" }}
    >
      <div
        ref={stageRef}
        tabIndex={0}
        onKeyDown={onKey}
        aria-label={title.replace(/\n/g, " ") + " — scroll to reveal the poster. Enter jumps to the end and back."}
        className="sticky top-0 w-full select-none overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-inset"
        style={{ height, background: clear ? "transparent" : paper, color: textInk }}
      >
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="absolute inset-0 block"
          style={{ width: "100%", height: "100%", maxWidth: "none" }}
        />


        <div
          ref={hintRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 flex flex-col items-center gap-2"
          style={{ bottom: layout.margin + layout.gap, display: hint ? undefined : "none" }}
        >
          <span className="text-[10px] font-medium uppercase" style={{ letterSpacing: "0.42em", color: textInk }}>
            {hint}
          </span>
          <span className="block h-8 w-px animate-pulse motion-reduce:animate-none" style={{ background: textInk }} />
        </div>

        <div
          ref={creditsRef}
          className="absolute flex items-center gap-4 sm:gap-6"
          style={{
            left: layout.margin,
            right: layout.margin,
            bottom: layout.gap,
            height: layout.strip,
            color: textInk,
            opacity: 0,
            visibility: "hidden",
          }}
        >
          <div className="flex shrink-0 items-center gap-2" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 16 16" className="block shrink-0" style={{ maxWidth: "none" }}>
              <rect x="0.4" y="0.4" width="15.2" height="15.2" fill="none" stroke={accent} strokeWidth="0.8" />
              <path d={MAZE} fill="none" stroke={accent} strokeWidth="1.1" />
            </svg>
            <span
              className="block whitespace-nowrap font-black uppercase leading-none"
              style={{
                fontFamily,
                color: accent,
                fontSize: "clamp(20px, 3vw, 38px)",
                letterSpacing: "-0.01em",
              }}
            >
              {title.replace(/\n/g, " ")}
            </span>
          </div>

          <div className="min-w-0 flex-1 border-y py-1.5" style={{ borderColor: "currentColor" }}>
            <p className="truncate text-[9px] uppercase leading-5 sm:text-[10px]" style={{ letterSpacing: "0.14em" }}>
              {credit}
            </p>
            <p className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 overflow-hidden text-[10px] uppercase leading-4 sm:text-[11px]" style={{ maxHeight: 32 }}>
              {billing.map(([label, value], i) => (
                <span key={i} className="inline-flex items-baseline gap-1.5 whitespace-nowrap">
                  {i > 0 && <span aria-hidden="true" className="inline-block h-px w-5 self-center opacity-60" style={{ background: "currentColor" }} />}
                  <span className="text-[8px] opacity-70 sm:text-[9px]" style={{ letterSpacing: "0.12em" }}>{label}</span>
                  <span style={{ letterSpacing: "0.06em" }}>{value}</span>
                </span>
              ))}
            </p>
          </div>

          <div className="hidden shrink-0 items-center gap-3 sm:flex" aria-hidden="true">
            <div className="border px-2 py-1 text-center uppercase leading-tight" style={{ borderColor: "currentColor" }}>
              <div className="text-[8px]" style={{ letterSpacing: "0.2em" }}>edition</div>
              <div className="text-[13px] font-semibold tabular-nums">{edition}</div>
            </div>
            <svg width="54" height="24" viewBox="0 0 54 24" className="block" style={{ maxWidth: "none" }}>
              <path
                d="M2 18C8 4 14 3 12 15S20 7 24 11 30 20 36 8 44 14 52 6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.1"
                strokeLinecap="round"
                opacity="0.7"
              />
            </svg>
          </div>
        </div>

        <div className="sr-only">
          <h2>{title.replace(/\n/g, " ")}</h2>
          <p>{credit}</p>
          <ul>
            {billing.map(([label, value], i) => (
              <li key={i}>
                {label} {value}
              </li>
            ))}
          </ul>
        </div>

        {children}
      </div>
    </div>
  )
}
