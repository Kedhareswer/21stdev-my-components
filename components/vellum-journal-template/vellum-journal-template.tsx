import { useCallback, useEffect, useId, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react"

// #region story
// Pure: scroll → beats, the letter reveal, the card swing and the seeded random.
// No React, no DOM — the test lifts this region and runs it.

export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)
/** Smootherstep: zero velocity at both ends, so one beat hands over to the next without a jolt. */
export const smooth = (x: number) => {
  x = clamp01(x)
  return x * x * x * (x * (x * 6 - 15) + 10)
}

/** 0 → 1 while the stage is pinned inside its track; clamps outside it, never NaN. */
export const progressFrom = (top: number, height: number, stage: number) => {
  const travel = height - stage
  if (!(travel > 0)) return 0
  return clamp01((0 - top) / travel)
}

/** 0 → 1 from the moment a block's top enters the viewport until its bottom leaves it. */
export const flowFrom = (top: number, height: number, vh: number) => {
  const span = vh + height
  if (!(span > 0)) return 0
  return clamp01((vh - top) / span)
}

/** Each beat's slice of the pinned scroll. They overlap on purpose, as in the reference. */
export const BEATS = {
  hero: [0, 0.4],
  rise: [0.12, 0.38],
  reveal: [0.3, 0.55],
  line: [0.5, 0.82],
  swing: [0.6, 0.9],
  settle: [0.86, 0.98],
} as const

export type Beat = { hy: number; ab: number; rv: number; wl: number; sw: number; st: number }

export function story(p: number): Beat {
  const span = (b: readonly [number, number]) => (p - b[0]) / (b[1] - b[0])
  return {
    hy: smooth(span(BEATS.hero)),
    ab: smooth(span(BEATS.rise)),
    rv: clamp01(span(BEATS.reveal)),
    wl: smooth(span(BEATS.line)),
    sw: smooth(span(BEATS.swing)),
    st: smooth(span(BEATS.settle)),
  }
}

/** The static page reduced motion shows: everything arrived, nothing moving. */
export const STILL: Beat = { hy: 0, ab: 1, rv: 1, wl: 1, sw: 1, st: 1 }

/** Letter i of n: how far it has arrived. A soft wave W letters wide runs through the line. The CSS mirrors this. */
export const REVEAL_W = 8
export const letterAlpha = (rv: number, i: number, n: number) => clamp01((rv * (n + REVEAL_W) - i) / REVEAL_W)

/** The cream page swings in like a tossed card: a corner first, then the side, then it lands square. */
export const SWING = { rot: -140, rise: 150, drift: 10, scale: 0.84 }
export const swingPose = (sw: number) => ({
  rot: SWING.rot * (1 - sw),
  ty: SWING.rise * (1 - sw),
  tx: SWING.drift * (1 - sw),
  sc: SWING.scale + (1 - SWING.scale) * sw,
})

/** The orange squiggle: the intro draws its first half over time, the scroll draws the rest. */
export const INTRO_MS = 2600
export const squiggle = (ms: number, hy: number) => Math.min(1, 0.5 * smooth(ms / INTRO_MS) + 0.5 * clamp01(hy))

/** Where the menu jumps to, in pinned progress. Each lands on a held beat, not mid-motion. */
export const JUMPS = { top: 0, about: 0.58, gallery: 1 } as const

export function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Five taps on the flower within this window turn golden hour on (or off). */
export const EGG_TAPS = 5
export const EGG_WINDOW = 2400
export function tapEgg(times: number[], now: number) {
  const recent = times.filter((t) => now - t < EGG_WINDOW).concat(now)
  return recent.length >= EGG_TAPS ? { times: [] as number[], fire: true } : { times: recent, fire: false }
}
// #endregion

// #region paint
// Every photograph is painted here, on canvas, at runtime. No images ship and nothing is fetched.

type Look = { kind: "bust" | "figure" | "still"; bg: string; bg2: string; skin: string; cloth: string; hair: string; style: number; seed: number }
type Ctx = CanvasRenderingContext2D

const hex = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]
/** Mix toward white (k > 0) or black (k < 0). */
export function shade(h: string, k: number) {
  const c = hex(h).map((v) => Math.round(k >= 0 ? v + (255 - v) * k : v * (1 + k)))
  return "rgb(" + c.join(",") + ")"
}
const ell = (g: Ctx, x: number, y: number, rx: number, ry: number, rot = 0) => {
  g.beginPath()
  g.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, Math.PI * 2)
}
const soft = (g: Ctx, px: number) => {
  g.filter = px > 0 ? "blur(" + px.toFixed(1) + "px)" : "none"
}

function bloom(g: Ctx, x: number, y: number, s: number, petal: string, heart: string, n: number, turn: number) {
  for (let i = 0; i < n; i++) {
    const a = turn + (i / n) * Math.PI * 2
    const gr = g.createRadialGradient(x, y, s * 0.1, x, y, s * 1.1)
    gr.addColorStop(0, shade(petal, -0.12))
    gr.addColorStop(0.6, petal)
    gr.addColorStop(1, shade(petal, 0.25))
    g.fillStyle = gr
    ell(g, x + Math.cos(a) * s * 0.55, y + Math.sin(a) * s * 0.55, s * 0.62, s * 0.4, a)
    g.fill()
  }
  g.fillStyle = heart
  ell(g, x, y, s * 0.2, s * 0.2)
  g.fill()
}

function backdrop(g: Ctx, w: number, h: number, L: Look) {
  const gr = g.createLinearGradient(0, 0, w * 0.4, h)
  gr.addColorStop(0, L.bg2)
  gr.addColorStop(1, L.bg)
  g.fillStyle = gr
  g.fillRect(0, 0, w, h)
  const glow = g.createRadialGradient(w * 0.3, h * 0.22, 0, w * 0.3, h * 0.22, w * 0.9)
  glow.addColorStop(0, "rgba(255,255,255,.2)")
  glow.addColorStop(1, "rgba(255,255,255,0)")
  g.fillStyle = glow
  g.fillRect(0, 0, w, h)
}

function bust(g: Ctx, w: number, h: number, L: Look, R: () => number) {
  const cx = w * (0.45 + R() * 0.1)
  const hy = h * (0.38 + R() * 0.06)
  const r = Math.min(w * 0.25, h * 0.2) * (0.92 + R() * 0.14)
  const tilt = (R() - 0.5) * 0.3
  const sy = hy + r * 2.0
  // cast shadow on the wall
  g.save()
  soft(g, w * 0.05)
  g.fillStyle = "rgba(0,0,0,.2)"
  ell(g, cx + w * 0.1, sy + r * 1.6, r * 3.2, r * 2.2)
  g.fill()
  g.restore()
  // long hair falls behind the shoulders
  if (L.style === 1) {
    g.fillStyle = L.hair
    ell(g, cx, hy + r * 0.25, r * 1.08, r * 1.45, tilt)
    g.fill()
  }
  // torso
  g.beginPath()
  g.moveTo(cx - r * 3.6, h + 2)
  g.bezierCurveTo(cx - r * 3.3, sy + r * 0.4, cx - r * 2, sy - r * 0.2, cx - r * 0.5, sy - r * 0.3)
  g.lineTo(cx + r * 0.5, sy - r * 0.3)
  g.bezierCurveTo(cx + r * 2, sy - r * 0.2, cx + r * 3.3, sy + r * 0.4, cx + r * 3.6, h + 2)
  g.closePath()
  const tg = g.createLinearGradient(cx - r * 3.4, 0, cx + r * 3.4, 0)
  tg.addColorStop(0, shade(L.cloth, 0.12))
  tg.addColorStop(0.45, L.cloth)
  tg.addColorStop(1, shade(L.cloth, -0.3))
  g.fillStyle = tg
  g.fill()
  // fold shadow down the middle
  g.save()
  soft(g, r * 0.25)
  g.strokeStyle = shade(L.cloth, -0.22)
  g.lineWidth = r * 0.12
  g.beginPath()
  g.moveTo(cx + r * 0.1, sy + r * 0.1)
  g.quadraticCurveTo(cx + r * 0.5, sy + r * 1.6, cx + r * 0.2, h)
  g.stroke()
  g.restore()
  // neck
  const ng = g.createLinearGradient(0, hy + r * 0.5, 0, sy)
  ng.addColorStop(0, shade(L.skin, -0.38))
  ng.addColorStop(1, shade(L.skin, -0.08))
  g.fillStyle = ng
  g.beginPath()
  g.moveTo(cx - r * 0.38, hy + r * 0.6)
  g.lineTo(cx - r * 0.45, sy - r * 0.15)
  g.quadraticCurveTo(cx, sy + r * 0.25, cx + r * 0.45, sy - r * 0.15)
  g.lineTo(cx + r * 0.38, hy + r * 0.6)
  g.fill()
  // head
  g.save()
  g.translate(cx, hy)
  g.rotate(tilt)
  if (L.style !== 1 && L.style !== 3) {
    g.fillStyle = shade(L.skin, -0.18)
    ell(g, -r * 0.8, r * 0.05, r * 0.14, r * 0.22)
    g.fill()
    ell(g, r * 0.8, r * 0.05, r * 0.14, r * 0.22)
    g.fill()
  }
  const hg = g.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.1, 0, 0, r * 1.25)
  hg.addColorStop(0, shade(L.skin, 0.14))
  hg.addColorStop(0.55, L.skin)
  hg.addColorStop(1, shade(L.skin, -0.32))
  g.fillStyle = hg
  g.beginPath()
  g.moveTo(-r * 0.8, -r * 0.1)
  g.bezierCurveTo(-r * 0.82, r * 0.55, -r * 0.4, r * 1.02, 0, r * 1.02)
  g.bezierCurveTo(r * 0.4, r * 1.02, r * 0.82, r * 0.55, r * 0.8, -r * 0.1)
  g.bezierCurveTo(r * 0.8, -r * 0.75, r * 0.45, -r * 1.0, 0, -r * 1.0)
  g.bezierCurveTo(-r * 0.45, -r * 1.0, -r * 0.8, -r * 0.75, -r * 0.8, -r * 0.1)
  g.fill()
  // light falls from the upper left: the far side of the face sinks into shadow
  g.save()
  g.clip()
  soft(g, r * 0.3)
  g.fillStyle = "rgba(70,34,22,.34)"
  ell(g, r * 0.78, r * 0.15, r * 0.55, r * 1.25)
  g.fill()
  g.fillStyle = "rgba(255,244,230,.28)"
  ell(g, -r * 0.62, -r * 0.3, r * 0.22, r * 0.6, 0.2)
  g.fill()
  g.restore()
  // soft modelling: cheek, nose, under-lip
  g.save()
  soft(g, r * 0.12)
  g.fillStyle = "rgba(196,98,82,.18)"
  ell(g, -r * 0.42, r * 0.38, r * 0.2, r * 0.12)
  g.fill()
  ell(g, r * 0.42, r * 0.38, r * 0.2, r * 0.12)
  g.fill()
  g.fillStyle = shade(L.skin, -0.3)
  ell(g, r * 0.08, r * 0.28, r * 0.07, r * 0.17)
  g.fill()
  g.restore()
  g.strokeStyle = shade(L.skin, -0.5)
  g.lineCap = "round"
  g.lineWidth = Math.max(1, r * 0.035)
  if (L.style === 2 && L.seed % 2 === 0) {
    // round dark glasses
    g.fillStyle = "#18171a"
    ell(g, -r * 0.32, -r * 0.02, r * 0.24, r * 0.2)
    g.fill()
    ell(g, r * 0.32, -r * 0.02, r * 0.24, r * 0.2)
    g.fill()
    g.beginPath()
    g.moveTo(-r * 0.1, -r * 0.05)
    g.lineTo(r * 0.1, -r * 0.05)
    g.stroke()
  } else {
    // eyes closed: two calm arcs
    for (const s of [-1, 1]) {
      g.beginPath()
      g.arc(s * r * 0.32, -r * 0.08, r * 0.14, Math.PI * 0.15, Math.PI * 0.85)
      g.stroke()
    }
  }
  g.fillStyle = shade(L.skin, -0.42)
  ell(g, 0, r * 0.6, r * 0.17, r * 0.06)
  g.fill()
  g.fillStyle = "rgba(255,255,255,.18)"
  ell(g, 0, r * 0.66, r * 0.09, r * 0.025)
  g.fill()
  // hair
  g.fillStyle = L.hair
  if (L.style === 0) {
    ell(g, 0, -r * 1.12, r * 0.45, r * 0.4)
    g.fill()
  }
  if (L.style === 3) {
    // a wrapped scarf
    const sg = g.createLinearGradient(-r, -r, r, 0)
    sg.addColorStop(0, shade(L.hair, 0.15))
    sg.addColorStop(1, shade(L.hair, -0.2))
    g.fillStyle = sg
    ell(g, 0, -r * 0.5, r * 1.02, r * 0.78)
    g.fill()
    ell(g, r * 0.62, -r * 1.05, r * 0.4, r * 0.3, 0.6)
    g.fill()
  } else {
    g.beginPath()
    g.moveTo(-r * 0.86, r * (L.style === 1 ? 0.5 : -0.05))
    g.bezierCurveTo(-r * 0.95, -r * 0.95, -r * 0.4, -r * 1.12, 0, -r * 1.1)
    g.bezierCurveTo(r * 0.45, -r * 1.12, r * 0.95, -r * 0.95, r * 0.86, r * (L.style === 1 ? 0.5 : -0.05))
    g.bezierCurveTo(r * 0.7, -r * 0.5, r * 0.2, -r * 0.62, -r * 0.1, -r * 0.55)
    g.bezierCurveTo(-r * 0.45, -r * 0.5, -r * 0.75, -r * 0.4, -r * 0.86, r * (L.style === 1 ? 0.5 : -0.05))
    g.fill()
    g.save()
    g.strokeStyle = "rgba(255,255,255,.12)"
    g.lineWidth = r * 0.05
    g.beginPath()
    g.moveTo(-r * 0.5, -r * 0.95)
    g.quadraticCurveTo(-r * 0.1, -r * 1.08, r * 0.3, -r * 0.95)
    g.stroke()
    g.restore()
  }
  if (L.style === 4) {
    // blooms gathered over the brow and one eye
    const n = 5 + Math.floor(R() * 3)
    for (let i = 0; i < n; i++) {
      const a = -0.6 + (i / n) * 2.4 + R() * 0.3
      bloom(g, Math.cos(a) * r * 0.62, -r * 0.35 + Math.sin(a) * r * 0.45, r * (0.32 + R() * 0.12), i % 3 ? "#f4efe6" : "#f2d8d2", "#d8b34a", 5, R() * 6)
    }
  }
  g.restore()
}

function figure(g: Ctx, w: number, h: number, L: Look, R: () => number) {
  const cx = w * (0.44 + R() * 0.12)
  const u = Math.min(w, h * 0.8)
  const top = h * 0.3
  const hoop = L.style === 1
  if (hoop) {
    g.strokeStyle = "#2a2a2e"
    g.lineWidth = u * 0.025
    ell(g, cx, top + u * 0.12, u * 0.3, u * 0.3)
    g.stroke()
    g.strokeStyle = "rgba(40,40,46,.6)"
    g.lineWidth = u * 0.01
    g.beginPath()
    g.moveTo(cx, 0)
    g.lineTo(cx, top - u * 0.18)
    g.stroke()
  }
  g.lineCap = "round"
  g.lineJoin = "round"
  // legs
  g.strokeStyle = shade(L.skin, -0.12)
  g.lineWidth = u * 0.045
  g.beginPath()
  g.moveTo(cx - u * 0.03, top + u * 0.62)
  g.lineTo(cx - u * (hoop ? 0.16 : 0.07), top + u * (hoop ? 0.78 : 0.98))
  g.moveTo(cx + u * 0.03, top + u * 0.62)
  g.lineTo(cx + u * (hoop ? 0.12 : 0.05), top + u * (hoop ? 0.9 : 0.98))
  g.stroke()
  // arms raised
  g.lineWidth = u * 0.035
  g.beginPath()
  g.moveTo(cx - u * 0.06, top + u * 0.1)
  g.quadraticCurveTo(cx - u * 0.17, top - u * 0.02, cx - u * 0.13, top - u * 0.2)
  g.moveTo(cx + u * 0.06, top + u * 0.1)
  g.quadraticCurveTo(cx + u * 0.19, top, cx + u * 0.17, top - u * 0.19)
  g.stroke()
  // dress
  const dg = g.createLinearGradient(cx - u * 0.15, 0, cx + u * 0.15, 0)
  dg.addColorStop(0, shade(L.cloth, 0.1))
  dg.addColorStop(1, shade(L.cloth, -0.25))
  g.fillStyle = dg
  g.beginPath()
  g.moveTo(cx - u * 0.07, top + u * 0.06)
  g.lineTo(cx + u * 0.07, top + u * 0.06)
  g.quadraticCurveTo(cx + u * 0.1, top + u * 0.35, cx + u * 0.2, top + u * 0.66)
  g.quadraticCurveTo(cx, top + u * 0.7, cx - u * 0.18, top + u * 0.64)
  g.quadraticCurveTo(cx - u * 0.1, top + u * 0.35, cx - u * 0.07, top + u * 0.06)
  g.fill()
  // head
  g.fillStyle = L.skin
  ell(g, cx + u * 0.01, top - u * 0.03, u * 0.05, u * 0.06)
  g.fill()
  g.fillStyle = L.hair
  ell(g, cx + u * 0.01, top - u * 0.07, u * 0.055, u * 0.035)
  g.fill()
}

function still(g: Ctx, w: number, h: number, L: Look, R: () => number) {
  const ty = h * 0.72
  const tg = g.createLinearGradient(0, ty, 0, h)
  tg.addColorStop(0, shade(L.bg, -0.12))
  tg.addColorStop(1, shade(L.bg, -0.22))
  g.fillStyle = tg
  g.fillRect(0, ty, w, h - ty)
  const cx = w * 0.5
  const vw = w * 0.2
  g.save()
  soft(g, w * 0.03)
  g.fillStyle = "rgba(0,0,0,.22)"
  ell(g, cx + vw * 0.9, ty + h * 0.04, vw * 1.4, h * 0.03)
  g.fill()
  g.restore()
  // stems
  g.strokeStyle = "#4d5a3a"
  g.lineWidth = w * 0.012
  g.lineCap = "round"
  const heads: number[][] = []
  for (let i = 0; i < 3; i++) {
    const ex = cx + (i - 1) * w * 0.16 + (R() - 0.5) * w * 0.06
    const ey = h * (0.16 + R() * 0.16)
    g.beginPath()
    g.moveTo(cx + (i - 1) * vw * 0.12, ty - h * 0.28)
    g.quadraticCurveTo(cx + (i - 1) * w * 0.04, h * 0.35, ex, ey)
    g.stroke()
    heads.push([ex, ey])
  }
  for (const [x, y] of heads) bloom(g, x, y, w * 0.07, L.hair, "#3b2a1c", 6, R() * 6)
  // vase
  const vg = g.createLinearGradient(cx - vw, 0, cx + vw, 0)
  vg.addColorStop(0, shade(L.cloth, 0.2))
  vg.addColorStop(0.4, L.cloth)
  vg.addColorStop(1, shade(L.cloth, -0.35))
  g.fillStyle = vg
  g.beginPath()
  g.moveTo(cx - vw * 0.3, ty - h * 0.3)
  g.lineTo(cx + vw * 0.3, ty - h * 0.3)
  g.bezierCurveTo(cx + vw * 0.3, ty - h * 0.2, cx + vw * 1.05, ty - h * 0.2, cx + vw * 0.8, ty)
  g.lineTo(cx - vw * 0.8, ty)
  g.bezierCurveTo(cx - vw * 1.05, ty - h * 0.2, cx - vw * 0.3, ty - h * 0.2, cx - vw * 0.3, ty - h * 0.3)
  g.fill()
}

function finish(g: Ctx, w: number, h: number, seed: number, grain: number) {
  g.filter = "blur(" + Math.min(0.9, w / 420).toFixed(2) + "px)"
  g.drawImage(g.canvas, 0, 0)
  g.filter = "none"
  const v = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75)
  v.addColorStop(0, "rgba(0,0,0,0)")
  v.addColorStop(1, "rgba(20,14,10,.22)")
  g.fillStyle = v
  g.fillRect(0, 0, w, h)
  const img = g.getImageData(0, 0, w, h)
  const d = img.data
  let s = seed * 9301 + 49297
  for (let i = 0; i < d.length; i += 4) {
    s = (s * 1664525 + 1013904223) >>> 0
    const n = ((s >>> 8) / 16777216 - 0.5) * grain
    d[i] += n
    d[i + 1] += n
    d[i + 2] += n
  }
  g.putImageData(img, 0, 0)
}

export function paintLook(c: HTMLCanvasElement, L: Look, w: number, h: number) {
  c.width = w
  c.height = h
  const g = c.getContext("2d")
  if (!g) return
  const R = mulberry32(L.seed)
  backdrop(g, w, h, L)
  if (L.kind === "bust") bust(g, w, h, L, R)
  else if (L.kind === "figure") figure(g, w, h, L, R)
  else still(g, w, h, L, R)
  g.filter = "none"
  finish(g, w, h, L.seed, 22)
}

/** The feature plate: a figure in profile under a wide straw hat, a pale sun behind. */
export function paintFeature(c: HTMLCanvasElement, w: number, h: number) {
  c.width = w
  c.height = h
  const g = c.getContext("2d")
  if (!g) return
  const bg = g.createLinearGradient(0, 0, w, h)
  bg.addColorStop(0, "#2d6f84")
  bg.addColorStop(1, "#174a5d")
  g.fillStyle = bg
  g.fillRect(0, 0, w, h)
  const u = h
  const sx = w * 0.74
  const sy = h * 0.3
  const sun = g.createRadialGradient(sx, sy, u * 0.05, sx, sy, u * 0.45)
  sun.addColorStop(0, "rgba(246,230,200,.95)")
  sun.addColorStop(0.42, "rgba(240,214,176,.85)")
  sun.addColorStop(0.46, "rgba(240,214,176,.18)")
  sun.addColorStop(1, "rgba(240,214,176,0)")
  g.fillStyle = sun
  g.fillRect(0, 0, w, h)
  const cx = w * 0.5
  const hy = h * 0.5
  const r = u * 0.15
  // coat
  g.save()
  soft(g, u * 0.04)
  g.fillStyle = "rgba(6,24,32,.45)"
  ell(g, cx + r * 1.5, h, r * 5, r * 2)
  g.fill()
  g.restore()
  const cg = g.createLinearGradient(cx - r * 4, 0, cx + r * 4, 0)
  cg.addColorStop(0, "#f2ebdd")
  cg.addColorStop(0.55, "#e2d6c0")
  cg.addColorStop(1, "#a99a80")
  g.fillStyle = cg
  g.beginPath()
  g.moveTo(cx - r * 3.4, h + 2)
  g.bezierCurveTo(cx - r * 3, hy + r * 2.4, cx - r * 1.4, hy + r * 1.75, cx - r * 0.2, hy + r * 1.7)
  g.bezierCurveTo(cx + r * 1.8, hy + r * 1.6, cx + r * 3.6, hy + r * 2.4, cx + r * 4.4, h + 2)
  g.fill()
  // collar
  g.fillStyle = "#f7f1e6"
  g.beginPath()
  g.moveTo(cx - r * 0.7, hy + r * 1.62)
  g.quadraticCurveTo(cx - r * 0.2, hy + r * 2.7, cx + r * 0.45, hy + r * 3.1)
  g.lineTo(cx + r * 0.9, hy + r * 1.7)
  g.closePath()
  g.fill()
  // neck
  const ng = g.createLinearGradient(cx - r * 0.5, 0, cx + r * 0.6, 0)
  ng.addColorStop(0, "#c98f6c")
  ng.addColorStop(1, "#7d4c33")
  g.fillStyle = ng
  g.beginPath()
  g.moveTo(cx - r * 0.35, hy + r * 0.55)
  g.lineTo(cx - r * 0.5, hy + r * 1.75)
  g.lineTo(cx + r * 0.75, hy + r * 1.75)
  g.lineTo(cx + r * 0.55, hy + r * 0.4)
  g.fill()
  // head in profile, facing left
  const hg = g.createRadialGradient(cx - r * 0.5, hy - r * 0.2, r * 0.1, cx, hy, r * 1.3)
  hg.addColorStop(0, "#e2ab86")
  hg.addColorStop(0.6, "#c4865f")
  hg.addColorStop(1, "#7a4a31")
  g.fillStyle = hg
  g.beginPath()
  g.moveTo(cx + r * 0.75, hy - r * 0.6)
  g.bezierCurveTo(cx + r * 0.9, hy + r * 0.3, cx + r * 0.6, hy + r * 0.8, cx + r * 0.1, hy + r * 0.85)
  g.lineTo(cx - r * 0.35, hy + r * 0.8)
  g.quadraticCurveTo(cx - r * 0.62, hy + r * 0.72, cx - r * 0.6, hy + r * 0.52)
  g.lineTo(cx - r * 0.66, hy + r * 0.42)
  g.quadraticCurveTo(cx - r * 0.7, hy + r * 0.36, cx - r * 0.62, hy + r * 0.32)
  g.lineTo(cx - r * 0.66, hy + r * 0.22)
  g.quadraticCurveTo(cx - r * 0.86, hy + r * 0.1, cx - r * 0.74, hy - r * 0.04)
  g.quadraticCurveTo(cx - r * 0.72, hy - r * 0.3, cx - r * 0.6, hy - r * 0.55)
  g.bezierCurveTo(cx - r * 0.2, hy - r * 1.05, cx + r * 0.6, hy - r * 1.05, cx + r * 0.75, hy - r * 0.6)
  g.fill()
  g.strokeStyle = "#5b3322"
  g.lineWidth = r * 0.03
  g.lineCap = "round"
  g.beginPath()
  g.arc(cx - r * 0.42, hy - r * 0.18, r * 0.11, Math.PI * 0.1, Math.PI * 0.75)
  g.stroke()
  g.fillStyle = "#8e3f33"
  ell(g, cx - r * 0.6, hy + r * 0.38, r * 0.06, r * 0.035, 0.3)
  g.fill()
  // hair at the nape
  g.fillStyle = "#2a1b14"
  ell(g, cx + r * 0.65, hy + r * 0.05, r * 0.32, r * 0.58, 0.2)
  g.fill()
  // hat shadow over the upper face
  g.save()
  soft(g, r * 0.12)
  g.fillStyle = "rgba(40,20,10,.38)"
  ell(g, cx - r * 0.1, hy - r * 0.55, r * 1.05, r * 0.42, -0.1)
  g.fill()
  g.restore()
  // hat: crown, band, brim
  const tilt = -0.12
  const bx = cx - r * 0.05
  const by = hy - r * 0.62
  const straw = g.createLinearGradient(bx - r * 2.2, 0, bx + r * 2.2, 0)
  straw.addColorStop(0, "#efd29a")
  straw.addColorStop(0.6, "#d6b072")
  straw.addColorStop(1, "#9c7a45")
  g.fillStyle = straw
  g.beginPath()
  g.moveTo(bx - r * 0.75, by - r * 0.05)
  g.bezierCurveTo(bx - r * 0.8, by - r * 1.0, bx + r * 0.8, by - r * 1.1, bx + r * 0.8, by - r * 0.1)
  g.fill()
  g.fillStyle = "#3a261b"
  g.beginPath()
  g.moveTo(bx - r * 0.78, by - r * 0.08)
  g.quadraticCurveTo(bx, by + r * 0.05, bx + r * 0.8, by - r * 0.14)
  g.lineTo(bx + r * 0.8, by - r * 0.32)
  g.quadraticCurveTo(bx, by - r * 0.14, bx - r * 0.78, by - r * 0.27)
  g.fill()
  g.fillStyle = straw
  ell(g, bx, by, r * 2.25, r * 0.36, tilt)
  g.fill()
  g.save()
  g.strokeStyle = "rgba(120,86,40,.35)"
  g.lineWidth = r * 0.012
  for (let k = 1; k < 8; k++) {
    ell(g, bx, by, r * 2.25 * (k / 8), r * 0.36 * (k / 8), tilt)
    g.stroke()
  }
  g.restore()
  bloom(g, bx + r * 0.55, by - r * 0.32, r * 0.22, "#e2603a", "#f3c26b", 4, 0.4)
  finish(g, w, h, 41, 18)
}
// #endregion

type Action = { label: string; href?: string; onClick?: () => void }

export type VellumJournalTemplateProps = {
  /** Height of the pinned stage; every chapter is laid out against it. */
  height?: string
  /** Scroll travel, in stage heights, that the pinned story plays across. */
  scrollLength?: number
  brand?: string
  headline?: [string, string]
  tagline?: string
  aboutTitle?: [string, string]
  aboutBody?: [string, string]
  /** The cream page's headline; the flower sits between the two halves. */
  galleryTitle?: [string, string]
  galleryBody?: [string, string]
  /** Words that slide past under the gallery headline. */
  shelf?: string[]
  issue?: string
  year?: string
  primaryAction?: Action
  secondaryAction?: Action
  className?: string
  style?: CSSProperties
}

type Tile = { x: number; y: number; w: number; a: number; d: number; c?: string; t: string; look: Look }

const L = (kind: Look["kind"], bg: string, bg2: string, skin: string, cloth: string, hair: string, style: number, seed: number): Look => ({ kind, bg, bg2, skin, cloth, hair, style, seed })

const TILES: Tile[] = [
  { x: 7, y: 8, w: 9, a: 1.28, d: 0.8, c: "Petal", t: "Petal, in noon light", look: L("bust", "#5e7f86", "#8fabad", "#f0d2bd", "#f3efe8", "#3a2a20", 4, 11) },
  { x: 19.5, y: -4, w: 7, a: 0.9, d: 1.2, t: "Reach", look: L("figure", "#cfe0ea", "#9fc1d9", "#e7b896", "#f3efe8", "#2b1d16", 0, 12) },
  { x: 27, y: 21, w: 7, a: 0.95, d: 0.55, t: "Cobalt", look: L("bust", "#df5a33", "#ef7c4e", "#6b4330", "#2643a0", "#141010", 2, 14) },
  { x: 50, y: 14, w: 7, a: 1.3, d: 0.9, t: "Linen", look: L("bust", "#e4ded5", "#f3efe9", "#e7c3a8", "#d6cdbf", "#6b4a33", 0, 15) },
  { x: 60.5, y: -3, w: 7, a: 1.25, d: 1.1, t: "Hush", look: L("bust", "#d4cfc7", "#e6e1da", "#f0d2bd", "#1d1b1a", "#1f1814", 1, 16) },
  { x: 71, y: 20, w: 7, a: 0.85, d: 0.6, t: "Ring", look: L("figure", "#d9e7ef", "#8fb4d6", "#d9a383", "#f3efe8", "#2b1d16", 1, 17) },
  { x: 83, y: -1, w: 9, a: 1.05, d: 1, t: "Scarlet", look: L("bust", "#c3221e", "#d9443a", "#f1d3bf", "#141314", "#0f0d0c", 1, 18) },
  { x: 95.5, y: 2, w: 5, a: 2.6, d: 1.3, t: "Stems", look: L("still", "#c9c4bb", "#dcd7cf", "#000000", "#e9e3d8", "#e2603a", 0, 19) },
  { x: 89, y: 32, w: 6.5, a: 1.2, d: 0.7, t: "Shade", look: L("bust", "#ece8e2", "#f6f3ee", "#e9c6ad", "#2f2f33", "#16120f", 2, 20) },
  { x: 3, y: 54, w: 7, a: 0.95, d: 0.75, t: "Wrap", look: L("bust", "#6d4a3a", "#a0715a", "#f2d6c4", "#f3efe8", "#e9e1d3", 3, 21) },
  { x: -1, y: 80, w: 4.5, a: 2.2, d: 1.2, t: "Sage", look: L("figure", "#cfdccf", "#9fb8a6", "#e0ad8c", "#2b2b2b", "#1c1612", 0, 22) },
  { x: 22, y: 93, w: 5.5, a: 0.9, d: 1, t: "Clay", look: L("bust", "#e8e2da", "#f2eee8", "#c58c69", "#e8dcc5", "#1a1310", 0, 23) },
  { x: 41, y: 82, w: 7, a: 1.2, d: 0.65, t: "Tide", look: L("bust", "#2f7c86", "#4f9aa1", "#f1d3bf", "#f3efe8", "#4a3022", 4, 24) },
  { x: 60, y: 87, w: 7, a: 1.05, d: 0.95, t: "Turn", look: L("figure", "#efe9e1", "#e2d9cc", "#d39a78", "#c4532f", "#231915", 0, 25) },
  { x: 78, y: 74, w: 9, a: 1.3, d: 0.8, c: "Drift", t: "Drift, before the rain", look: L("figure", "#cfe0ee", "#7aa6cf", "#e2b394", "#f3efe8", "#2b1d16", 1, 26) },
  { x: 96, y: 68, w: 4.5, a: 1.1, d: 1.15, t: "Rust", look: L("bust", "#d5cfc6", "#e5e0d9", "#e2b394", "#b6532f", "#2a1d15", 2, 27) },
]

const DISPLAY = "VgDisplay,'Instrument Serif','Iowan Old Style',Georgia,serif"
const TEXT = "VgText,'Source Serif 4','Times New Roman',Times,serif"
const SANS = "VgSans,'DM Sans',ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif"

const CSS =
  ".vg-root{position:relative;width:100%;isolation:isolate;background:#f6f1ea;color:#1b1916;--hy:0;--ab:0;--rv:0;--sw:0;--st:0;--mx:0;--my:0;--f:0;-webkit-tap-highlight-color:transparent}" +
  ".vg-root *,.vg-root *::before,.vg-root *::after{box-sizing:border-box}" +
  ".vg-root img,.vg-root svg,.vg-root canvas{max-width:none}" +
  ".vg-root button{font:inherit;color:inherit;background:none;border:0;padding:0;margin:0;cursor:pointer}" +
  ".vg-root a{color:inherit;text-decoration:none}" +
  ".vg-sans{font-family:" + SANS + ";font-weight:500;text-transform:uppercase;letter-spacing:.14em}" +
  /* header: one bar for every chapter; difference blending keeps it legible on cream and on black */
  ".vg-head{position:sticky;top:0;height:0;z-index:40;mix-blend-mode:difference}" +
  ".vg-bar{position:absolute;left:0;right:0;top:0;height:64px;display:flex;align-items:center;justify-content:center;gap:28px;color:#fff;pointer-events:none}" +
  ".vg-logo{font-size:10px;letter-spacing:.18em;pointer-events:auto}" +
  ".vg-burger{position:relative;width:34px;height:22px;pointer-events:auto;transition:transform .5s cubic-bezier(.3,1.6,.5,1)}" +
  ".vg-burger i{position:absolute;left:4px;right:4px;height:1px;background:currentColor;transition:transform .45s cubic-bezier(.6,0,.2,1),top .45s cubic-bezier(.6,0,.2,1)}" +
  ".vg-burger i:first-child{top:8px}.vg-burger i:last-child{top:13px}" +
  ".vg-root[data-menu] .vg-burger i:first-child{top:10.5px;transform:rotate(20deg)}.vg-root[data-menu] .vg-burger i:last-child{top:10.5px;transform:rotate(-20deg)}" +
  ".vg-menu{position:fixed;left:0;right:0;top:0;z-index:39;background:#f6f1ea;color:#1b1916;padding:92px 6vw 40px;display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:18px 4vw;transform:translateY(calc(-100% - 60px));transition:transform .7s cubic-bezier(.7,0,.2,1);box-shadow:0 30px 60px -40px rgba(0,0,0,.4)}" +
  ".vg-root[data-menu] .vg-menu{transform:none}" +
  ".vg-menu button{display:flex;align-items:baseline;gap:12px;text-align:left;font-family:" + DISPLAY + ";font-size:clamp(28px,3.4vw,46px);line-height:1}" +
  ".vg-menu button small{font-family:" + SANS + ";font-size:10px;letter-spacing:.14em;color:#8a847b}" +
  ".vg-menu button span{background:linear-gradient(currentColor,currentColor) 0 100%/0 1px no-repeat;transition:background-size .5s cubic-bezier(.6,0,.2,1)}" +
  ".vg-menu button:hover span,.vg-menu button:focus-visible span{background-size:100% 1px}" +
  /* the pinned track */
  ".vg-track{position:relative}" +
  ".vg-stage{position:sticky;top:0;z-index:2;width:100%;overflow:hidden;container-type:size;background:#f6f1ea}" +
  ".vg-layer{position:absolute;inset:0;container-type:size;overflow:hidden}" +
  /* hero */
  ".vg-hero{background:#f6f1ea}" +
  ".vg-tile{position:absolute;left:calc(var(--x) * 1%);top:calc(var(--y) * 1%);width:calc(var(--w) * 1cqw);transform:translate3d(calc(var(--mx) * var(--d) * -26px),calc(var(--my) * var(--d) * -18px - var(--hy) * var(--d) * 46cqh),0);will-change:transform}" +
  ".vg-tile-in{animation:vg-pop 1s cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(.45s + var(--k) * 60ms)}" +
  ".vg-float{animation:vg-float calc(6s + var(--k) * .41s) ease-in-out infinite alternate}" +
  ".vg-photo{display:block;width:100%;aspect-ratio:1/var(--a);background:var(--bg);overflow:hidden;transition:transform .6s cubic-bezier(.2,.8,.2,1)}" +
  ".vg-photo img{display:block;width:100%;height:100%;max-width:none;object-fit:cover}" +
  ".vg-tile button:hover .vg-photo,.vg-tile button:focus-visible .vg-photo{transform:scale(1.06)}" +
  ".vg-tile button{display:block;width:100%;outline-offset:4px}" +
  ".vg-cap{display:flex;gap:12px;margin-top:10px;font-size:8px;white-space:nowrap}" +
  ".vg-cap::before{content:'';width:10px;height:1px;background:currentColor;align-self:center}" +
  ".vg-h1wrap{position:absolute;left:0;right:0;top:34%;text-align:center;transform:translate3d(calc(var(--mx) * -6px),calc(var(--hy) * -16cqh),0)}" +
  ".vg-h1{margin:0;font-family:" + DISPLAY + ";font-weight:400;font-size:min(8.6cqw,15.5cqh);line-height:1.02;letter-spacing:-.01em;color:#1b1916}" +
  ".vg-ln{display:block;transform-origin:50% 70%;animation:vg-flip 1.6s cubic-bezier(.2,.75,.15,1) both;animation-delay:calc(var(--l) * .14s + .05s)}" +
  ".vg-tag{margin-top:2.4cqh;font-size:9px;display:flex;justify-content:center;gap:8px}" +
  ".vg-squig{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible}" +
  ".vg-squig path{fill:none;stroke:#e2603a;stroke-width:1.6;stroke-linecap:round;vector-effect:non-scaling-stroke}" +
  /* about: the black page rises over the hero */
  ".vg-about{background:#0d0c0b;color:#f3efe8;transform:translate3d(0,calc((1 - var(--ab)) * 100cqh),0);will-change:transform}" +
  ".vg-alabel{position:absolute;left:21cqw;top:15cqh;font-size:9px;color:#c9c3b8}" +
  ".vg-quote{position:absolute;left:5cqw;top:24cqh;font-family:" + TEXT + ";font-size:min(8cqw,13cqh);line-height:1}" +
  ".vg-side{position:absolute;left:4cqw;top:42cqh;font-size:8px;display:flex;gap:14px;color:#c9c3b8}" +
  ".vg-side::before{content:'';width:10px;height:1px;background:currentColor;align-self:center}" +
  ".vg-h2{position:absolute;left:21cqw;right:4cqw;top:21cqh;margin:0;font-family:" + TEXT + ";font-weight:400;font-size:min(6.6cqw,12.5cqh);line-height:1.05;letter-spacing:-.012em}" +
  ".vg-h2 .vg-w{display:inline-block;white-space:nowrap}" +
  ".vg-ch{display:inline-block;--a:clamp(0,calc((var(--rv) * (var(--n) + 8) - var(--i)) / 8),1);opacity:calc(.08 + var(--a) * .92);transform:translate3d(calc((1 - var(--a)) * .42em),0,0);filter:blur(calc((1 - var(--a)) * 6px))}" +
  ".vg-cols{position:absolute;left:21cqw;right:12cqw;top:56cqh;display:grid;grid-template-columns:repeat(2,minmax(0,22cqw));gap:4cqw;font-family:" + SANS + ";font-size:clamp(10px,.82cqw,13px);line-height:1.6;color:#a39d93;opacity:calc(var(--rv) * 1.4 - .4)}" +
  ".vg-cols p,.vg-gcols p{margin:0}" +
  ".vg-wire{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}" +
  ".vg-wire path{fill:none;stroke:#f3efe8;stroke-width:1.3;stroke-linecap:round;vector-effect:non-scaling-stroke}" +
  /* gallery: the cream page tossed onto the black like a card */
  ".vg-card{position:absolute;left:0;top:0;width:100cqw;height:calc(100cqh + 16cqh);background:#f6f1ea;color:#1b1916;overflow:hidden;transform-origin:50% 45%;transform:translate3d(calc((1 - var(--sw)) * 10cqw),calc((1 - var(--sw)) * 150cqh),0) rotate(calc((1 - var(--sw)) * -140deg)) scale(calc(.84 + var(--sw) * .16));box-shadow:0 40px 90px -30px rgba(0,0,0,calc((1 - var(--sw)) * .9));will-change:transform}" +
  ".vg-gh{position:absolute;left:3cqw;right:2cqw;top:11cqh;margin:0;display:flex;align-items:center;gap:.12em;font-family:" + DISPLAY + ";font-weight:400;font-size:min(15.2cqw,27cqh);line-height:1;letter-spacing:-.02em;white-space:nowrap}" +
  ".vg-gh>span:last-child{position:relative}" +
  ".vg-flower{display:inline-block;color:#e2603a;width:.78em;height:.78em;margin:0 .06em;flex:none;transform:rotate(calc(var(--st) * 90deg + var(--f) * 220deg));transition:color .6s}" +
  ".vg-flower svg{display:block;width:100%;height:100%}" +
  ".vg-flower button{display:block;width:100%;height:100%;border-radius:50%}" +
  ".vg-flower button[data-spin]{animation:vg-spin .9s cubic-bezier(.3,1.4,.4,1)}" +
  ".vg-under{position:absolute;left:-4%;top:100%;width:104%;height:.16em;overflow:visible}" +
  ".vg-under path{fill:none;stroke:#1b1916;stroke-width:1.4;stroke-linecap:round;vector-effect:non-scaling-stroke}" +
  ".vg-gcols{position:absolute;left:49cqw;right:6cqw;top:46cqh;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5cqw;font-family:" + SANS + ";font-size:clamp(10px,.82cqw,13px);line-height:1.6;color:#4a463f}" +
  ".vg-shelf{position:absolute;left:49cqw;right:0;top:72cqh;display:flex;align-items:baseline;gap:5cqw;overflow:hidden;white-space:nowrap}" +
  ".vg-shelf::before{content:'';flex:none;width:18px;height:1px;background:#1b1916;align-self:center}" +
  ".vg-shelf-in{display:flex;gap:8cqw;font-family:" + DISPLAY + ";font-size:min(3.9cqw,8cqh);line-height:1.2;padding-left:15cqw;transform:translate3d(calc(var(--f) * -60cqw),0,0)}" +
  ".vg-issue{position:absolute;left:3cqw;top:79cqh;width:min(26cqw,300px);font-family:" + SANS + ";font-size:clamp(10px,.8cqw,12px);line-height:1.6;color:#4a463f;margin:0}" +
  ".vg-strip{position:absolute;left:2cqw;right:2cqw;top:100cqh;height:92cqh;overflow:hidden}" +
  ".vg-strip img,.vg-feat img{display:block;width:100%;height:100%;max-width:none;object-fit:cover;object-position:50% 0}" +
  ".vg-root .vg-cta{position:absolute;left:49cqw;top:60cqh;display:inline-flex;align-items:center;gap:12px;height:44px;padding:0 20px 0 22px;border-radius:999px;background:#1b1916;color:#f6f1ea;font-size:10px;transition:transform .6s cubic-bezier(.3,1.6,.5,1)}" +
  ".vg-root .vg-cta span{display:inline-flex;gap:12px;transition:transform .6s cubic-bezier(.3,1.6,.5,1)}" +
  ".vg-root .vg-cta.vg-ghost{background:transparent;color:#1b1916;box-shadow:inset 0 0 0 1px #1b1916}" +
  /* after the pin: the feature plate and the colophon scroll normally */
  ".vg-flow{position:relative;z-index:1;container-type:inline-size;background:#f6f1ea}" +
  ".vg-feat{position:relative;margin:calc(var(--H) * -.16) 2cqw 0;height:calc(var(--H) * .92);overflow:hidden;background:#174a5d}" +
  ".vg-year{position:absolute;left:1.4cqw;bottom:3cqw;font-family:" + DISPLAY + ";font-size:min(5.2cqw,90px);line-height:.8;color:#f6f1ea;writing-mode:vertical-rl;transform:rotate(180deg) translate3d(0,calc((var(--f) - .5) * -14cqw),0)}" +
  ".vg-fcap{position:absolute;right:2cqw;bottom:2cqw;font-size:9px;color:#f6f1ea;display:flex;gap:16px}" +
  ".vg-end{position:relative;padding:14cqw 3cqw 0;overflow:hidden}" +
  ".vg-end h3{margin:0 0 4cqw;max-width:14ch;font-family:" + DISPLAY + ";font-weight:400;font-size:clamp(40px,7cqw,120px);line-height:.98;letter-spacing:-.015em}" +
  ".vg-acts{display:flex;flex-wrap:wrap;gap:14px}" +
  ".vg-root .vg-acts .vg-cta{position:relative;left:auto;top:auto}" +
  ".vg-meta{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4cqw;margin-top:9cqw;padding-top:22px;border-top:1px solid rgba(27,25,22,.18);font-family:" + SANS + ";font-size:11px;line-height:1.7;color:#4a463f}" +
  ".vg-meta b{display:block;font-weight:500;font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:#8a847b;margin-bottom:6px}" +
  ".vg-mark{display:block;margin:5cqw 0 0;padding-bottom:.04em;font-family:" + DISPLAY + ";font-size:27cqw;line-height:.8;letter-spacing:-.03em;white-space:nowrap}" +
  ".vg-mark i{font-style:normal;color:#e2603a}" +
  /* lightbox */
  ".vg-box{position:fixed;inset:0;z-index:60;display:grid;place-items:center;background:rgba(246,241,234,.94);opacity:0;visibility:hidden;transition:opacity .45s,visibility 0s .45s}" +
  ".vg-box[data-open]{opacity:1;visibility:visible;transition:opacity .45s}" +
  ".vg-box figure{margin:0;display:grid;justify-items:center;gap:16px;transform:scale(.94);transition:transform .6s cubic-bezier(.2,.8,.2,1)}" +
  ".vg-box[data-open] figure{transform:none}" +
  ".vg-box figure button{display:block}" +
  ".vg-box img{display:block;width:auto;height:min(70vh,640px);max-width:86vw;object-fit:contain;box-shadow:0 40px 80px -40px rgba(0,0,0,.45)}" +
  ".vg-box figcaption{display:flex;gap:22px;font-size:10px}" +
  ".vg-box figcaption i{font-style:normal;font-family:" + DISPLAY + ";font-size:22px;letter-spacing:0;text-transform:none}" +
  ".vg-x{position:absolute;right:24px;top:20px;font-size:10px}" +
  /* toast */
  ".vg-toast{position:fixed;left:50%;bottom:28px;z-index:70;transform:translate3d(-50%,20px,0);opacity:0;padding:12px 18px;border-radius:999px;background:#1b1916;color:#f6f1ea;font-size:10px;pointer-events:none;transition:opacity .4s,transform .5s cubic-bezier(.2,.8,.2,1)}" +
  ".vg-toast[data-on]{opacity:1;transform:translate3d(-50%,0,0)}" +
  /* context cursor */
  ".vg-cursor{display:none;position:fixed;left:0;top:0;z-index:80;pointer-events:none}" +
  ".vg-cdot{position:absolute;left:-5px;top:-5px;width:10px;height:10px;border-radius:50%;background:#e2603a;transition:transform .35s cubic-bezier(.3,1.6,.5,1),opacity .3s}" +
  ".vg-badge{position:absolute;left:-46px;top:-46px;width:92px;height:92px;border-radius:50%;background:#fbf8f3;color:#1b1916;box-shadow:0 10px 30px -12px rgba(0,0,0,.35);transform:scale(.2);opacity:0;transition:transform .45s cubic-bezier(.3,1.5,.5,1),opacity .3s}" +
  ".vg-ring{position:absolute;inset:0;width:100%;height:100%;animation:vg-turn 9s linear infinite}" +
  ".vg-ring text{font-family:" + SANS + ";font-size:8.4px;font-weight:500;letter-spacing:.18em;fill:currentColor}" +
  ".vg-badge>svg:last-child{position:absolute;left:31px;top:31px;width:30px;height:30px}" +
  ".vg-cursor[data-label] .vg-badge{transform:scale(1);opacity:1}" +
  ".vg-cursor[data-label] .vg-cdot{transform:scale(0);opacity:0}" +
  ".vg-cursor[data-out] .vg-cdot,.vg-cursor[data-out] .vg-badge{opacity:0}" +
  "@media (hover:hover) and (pointer:fine){.vg-cursor{display:block}.vg-root[data-fine],.vg-root[data-fine] button,.vg-root[data-fine] a{cursor:none}}" +
  ".vg-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}" +
  /* golden hour (the easter egg) */
  ".vg-root[data-gold] .vg-photo img,.vg-root[data-gold] .vg-feat img,.vg-root[data-gold] .vg-strip img{filter:sepia(.45) saturate(1.35) hue-rotate(-8deg) brightness(1.04)}" +
  ".vg-root[data-gold] .vg-flower{color:#d9a420}" +
  ".vg-root[data-gold] .vg-hero,.vg-root[data-gold] .vg-card,.vg-root[data-gold] .vg-flow{background:#f6e9d3}" +
  ".vg-hero,.vg-card,.vg-flow{transition:background-color 1.2s}" +
  /* small screens: the tiles grow, columns stack */
  "@container (max-width:700px){.vg-squig{left:-40cqw;width:260cqw;top:22cqh}.vg-tile{width:calc(var(--w) * 1.75cqw)}.vg-cap{display:none}.vg-h1{font-size:12cqw}.vg-h2{left:6cqw;font-size:9.6cqw;top:24cqh}.vg-alabel{left:6cqw;top:17cqh}.vg-quote,.vg-side{display:none}.vg-cols{left:6cqw;right:6cqw;grid-template-columns:1fr;gap:12px;top:52cqh}.vg-gh{flex-wrap:wrap;top:14cqh;font-size:16cqw;white-space:normal;gap:0 .2em;justify-content:flex-start}.vg-gcols{left:6cqw;right:6cqw;grid-template-columns:1fr;gap:10px;top:46cqh}.vg-shelf{left:6cqw;top:70cqh}.vg-shelf-in{font-size:9cqw}.vg-root .vg-cta{left:6cqw;top:62cqh}.vg-issue{width:auto;right:6cqw;left:6cqw;top:84cqh}}" +
  "@container (max-width:700px){.vg-meta{grid-template-columns:1fr}.vg-end{padding-top:22cqw}}" +
  "@keyframes vg-flip{0%{transform:perspective(900px) rotateX(168deg) translateY(12%);opacity:0}18%{opacity:.55}100%{transform:none;opacity:1}}" +
  "@keyframes vg-pop{from{opacity:0;transform:scale(.6) translateY(16px)}}" +
  "@keyframes vg-float{to{transform:translate3d(calc(var(--fx) * 1px),calc(var(--fy) * 1px),0)}}" +
  "@keyframes vg-turn{to{transform:rotate(360deg)}}" +
  "@keyframes vg-spin{from{transform:rotate(-360deg) scale(.7)}}" +
  /* reduced motion: nothing flies; the chapters simply stack as pages */
  "@media (prefers-reduced-motion:reduce){.vg-ln,.vg-tile-in,.vg-float,.vg-ring,.vg-flower button[data-spin]{animation:none}.vg-menu,.vg-box,.vg-box figure,.vg-toast,.vg-cta,.vg-cta span,.vg-burger,.vg-burger i,.vg-badge,.vg-cdot,.vg-photo{transition:none}}" +
  ".vg-root[data-still] .vg-track{height:auto!important}" +
  ".vg-root[data-still] .vg-stage{position:relative;height:auto!important;container-type:normal;overflow:visible}" +
  ".vg-root[data-still] .vg-layer{position:relative;height:var(--H);transform:none}" +
  ".vg-root[data-still] .vg-card{position:relative;transform:none;box-shadow:none;height:calc(var(--H) * 1.16)}" +
  ".vg-root[data-still] .vg-cardwrap{position:relative;height:var(--H);overflow:visible;background:#0d0c0b}" +
  ".vg-root[data-still] .vg-tile,.vg-root[data-still] .vg-h1wrap,.vg-root[data-still] .vg-shelf-in,.vg-root[data-still] .vg-year,.vg-root[data-still] .vg-flower,.vg-root[data-still] .vg-ch{transform:none}" +
  ".vg-root[data-still] .vg-ch{opacity:1;filter:none}.vg-root[data-still] .vg-cols{opacity:1}"

/* --- fonts: SIL OFL 1.1 subsets, renamed as the licence asks of modified copies ---
   VgDisplay = Instrument Serif (c) 2022 The Instrument Serif Project Authors
   VgText    = Source Serif 4, wght 400 / opsz 60 instance (c) 2014 The Source Serif 4 Project Authors
   VgSans    = DM Sans, wght 500 / opsz 14 instance (c) 2014 The DM Sans Project Authors */
const F_DISPLAY = "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"
const F_TEXT = "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"
const F_SANS = "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"
const FONTS =
  "@font-face{font-family:VgDisplay;font-display:swap;src:url(data:font/woff2;base64," + F_DISPLAY + ") format('woff2')}" +
  "@font-face{font-family:VgText;font-display:swap;src:url(data:font/woff2;base64," + F_TEXT + ") format('woff2')}" +
  "@font-face{font-family:VgSans;font-display:swap;src:url(data:font/woff2;base64," + F_SANS + ") format('woff2')}"

/* --- small pieces --- */

const SQUIGGLE = "M200 360 C 150 330, 105 352, 118 378 C 132 404, 196 386, 232 350 C 262 320, 300 330, 296 372 C 292 420, 250 450, 268 488 C 284 522, 340 512, 352 548 C 360 572, 340 590, 360 610"
const WIRE = "M-20 880 C 120 840, 220 900, 340 860 C 470 815, 520 760, 640 790 C 780 826, 820 700, 980 690 C 1080 684, 1120 720, 1040 760"
const UNDER = "M0 30 C 60 26, 110 22, 120 14 C 128 6, 112 0, 104 8 C 96 18, 110 32, 136 30 C 200 26, 330 22, 420 16"

function Flower({ size }: { size?: number }) {
  return (
    <svg viewBox="-50 -50 100 100" width={size} height={size} aria-hidden="true" style={{ display: "block", maxWidth: "none" }}>
      {[0, 90, 180, 270].map((a) => (
        <path key={a} transform={"rotate(" + (a + 45) + ")"} d="M0 -4 C 14 -14, 18 -38, 0 -48 C -18 -38, -14 -14, 0 -4 Z" fill="currentColor" />
      ))}
    </svg>
  )
}

const ringText = (label: string) => {
  const t = label.toUpperCase() + " • "
  return t.repeat(Math.max(1, Math.round(34 / t.length)))
}

/* painted photographs are cached for the page's life, so a remount never repaints */
const PAINTED = new Map<string, string>()

/* ---------------------------------------------------------------------------- */

export default function VellumJournalTemplate({
  height = "100svh",
  scrollLength = 4.6,
  brand = "Vellum",
  headline = ["Notice The Light", "Wherever It Falls"],
  tagline = "& frame it your own way",
  aboutTitle = ["A Room For The", "Patient Image Makers"],
  aboutBody = [
    "We gather quiet, carefully made photographs from people who still wait for the right light, and print them the way they deserve.",
    "If you shoot slowly and would like your work in front of our readers, send us a set. We answer every submission, usually within two weeks.",
  ],
  galleryTitle = ["Light", "On Paper"],
  galleryBody = [
    "Each season we choose twelve photographers and give their work room: large plates, honest paper and no crop they didn't ask for.",
    "Prints ship flat in archival sleeves, signed and numbered, from our small studio by the sea.",
  ],
  shelf = ["Vellum", "Gallery", "Archive", "Prints", "Journal"],
  issue = "Issue 07, The Weather Inside. Fourteen portraits made in the hour before rain, printed on cotton rag.",
  year = "2026",
  primaryAction = { label: "Submit your work" },
  secondaryAction = { label: "Browse the archive" },
  className,
  style,
}: VellumJournalTemplateProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "")
  const fid = "vgw" + uid
  const rootRef = useRef(null as HTMLDivElement | null)
  const trackRef = useRef(null as HTMLDivElement | null)
  const flowRef = useRef(null as HTMLDivElement | null)
  const cursorRef = useRef(null as HTMLDivElement | null)
  const ringRef = useRef(null as SVGTextPathElement | null)
  const h1Ref = useRef(null as HTMLDivElement | null)
  const dispRef = useRef(null as SVGFEDisplacementMapElement | null)
  const sqRef = useRef(null as SVGPathElement | null)
  const wireRef = useRef(null as SVGPathElement | null)
  const underRef = useRef(null as SVGPathElement | null)
  const flowerRef = useRef(null as HTMLButtonElement | null)
  const toastTimer = useRef(0)
  const s = useRef({
    target: 0,
    cur: 0,
    f: 0,
    fCur: 0,
    tx: 0,
    ty: 0,
    mx: 0,
    my: 0,
    still: false,
    fine: false,
    born: 0,
    intro: true,
    trackTop: 0,
    trackH: 0,
    stageH: 0,
    flowTop: 0,
    flowH: 0,
    written: "",
    label: "",
    magnet: null as HTMLElement | null,
    magnetBox: null as DOMRect | null,
    taps: [] as number[],
  })
  const [still, setStill] = useState(false)
  const [menu, setMenu] = useState(false)
  const [box, setBox] = useState(-1)
  const [gold, setGold] = useState(false)
  const [toast, setToast] = useState({ text: "", on: false })
  const [spin, setSpin] = useState(0)

  const words = useMemo(() => {
    let i = 0
    const n = aboutTitle.join(" ").replace(/\s+/g, "").length
    return {
      n,
      lines: aboutTitle.map((line) =>
        line.split(" ").map((w) => w.split("").map((ch) => ({ ch, i: i++ }))),
      ),
    }
  }, [aboutTitle])

  const say = useCallback((text: string) => {
    window.clearTimeout(toastTimer.current)
    setToast({ text, on: true })
    toastTimer.current = window.setTimeout(() => setToast((t) => ({ ...t, on: false })), 2600)
  }, [])

  const run = useCallback(
    (a: Action) => {
      if (a.onClick) a.onClick()
      else if (!a.href) say(a.label + ": opens in spring")
    },
    [say],
  )

  // runtime gates: reduced motion and a fine, hovering pointer
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)")
    const fp = window.matchMedia("(hover: hover) and (pointer: fine)")
    const sync = () => {
      s.current.still = rm.matches
      s.current.fine = fp.matches
      const root = rootRef.current
      if (root) {
        if (fp.matches) root.dataset.fine = ""
        else delete root.dataset.fine
      }
      setStill(rm.matches)
    }
    sync()
    rm.addEventListener("change", sync)
    fp.addEventListener("change", sync)
    return () => {
      rm.removeEventListener("change", sync)
      fp.removeEventListener("change", sync)
    }
  }, [])

  // paint the photographs, one per frame, so the intro never stutters
  useEffect(() => {
    const root = rootRef.current
    if (!root || typeof document === "undefined") return
    let raf = 0
    const jobs: (() => void)[] = []
    const put = (key: string, url: string) => {
      root.querySelectorAll("img[data-photo='" + key + "']").forEach((el) => {
        ;(el as HTMLImageElement).src = url
      })
    }
    const job = (key: string, paint: (c: HTMLCanvasElement) => void) => {
      const hit = PAINTED.get(key)
      if (hit) return put(key, hit)
      jobs.push(() => {
        const c = document.createElement("canvas")
        paint(c)
        const url = c.toDataURL("image/jpeg", 0.88)
        PAINTED.set(key, url)
        put(key, url)
      })
    }
    TILES.forEach((t, k) => job("t" + k, (c) => paintLook(c, t.look, 320, Math.round(320 * t.a))))
    job("feature", (c) => paintFeature(c, 1600, 1000))
    const step = () => {
      const j = jobs.shift()
      if (j) j()
      if (jobs.length) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [])

  // layout is cached here, on mount and on resize; scroll only reads the root's rect
  const layout = useCallback(() => {
    const root = rootRef.current
    const track = trackRef.current
    const flow = flowRef.current
    if (!root || !track || !flow) return
    const st = s.current
    st.trackTop = track.offsetTop
    st.trackH = track.offsetHeight
    st.stageH = (track.firstElementChild as HTMLElement | null)?.offsetHeight || 0
    st.flowTop = flow.offsetTop
    st.flowH = flow.offsetHeight
  }, [])

  // scroll → progress: one layout read per scroll frame
  const measure = useCallback(() => {
    const root = rootRef.current
    if (!root) return
    const st = s.current
    const top = root.getBoundingClientRect().top
    st.target = progressFrom(top + st.trackTop, st.trackH, st.stageH)
    st.f = flowFrom(top + st.flowTop, st.flowH, window.innerHeight)
    if (st.magnet) release()
  }, [])

  const jump = useCallback((to: "top" | "about" | "gallery" | "feature" | "end") => {
    const root = rootRef.current
    if (!root) return
    const st = s.current
    const top = root.getBoundingClientRect().top
    const travel = st.trackH - st.stageH
    const y =
      to === "feature" ? st.flowTop - (typeof window !== "undefined" ? window.innerHeight * 0.1 : 0) : to === "end" ? st.flowTop + st.flowH - window.innerHeight : st.trackTop + JUMPS[to] * travel
    setMenu(false)
    window.scrollBy({ top: top + y, behavior: st.still ? "auto" : "smooth" })
  }, [])

  // the frame loop: eases toward the scroll and the pointer, then writes a few variables
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const st = s.current
    let raf = 0
    let last = performance.now()
    let running = false
    let alive = true
    st.born = last
    st.intro = !st.still
    const h1 = h1Ref.current
    if (h1 && st.still) h1.style.filter = "none"
    const frame = (now: number) => {
      const dt = Math.min(64, now - last)
      last = now
      const k = 1 - Math.exp(-dt / 90)
      st.cur = st.still ? 1 : Math.abs(st.cur - st.target) < 1e-4 ? st.target : st.cur + (st.target - st.cur) * k
      st.fCur = st.still ? 0.5 : Math.abs(st.fCur - st.f) < 1e-4 ? st.f : st.fCur + (st.f - st.fCur) * k
      const km = 1 - Math.exp(-dt / 220)
      st.mx += ((st.fine && !st.still ? st.tx : 0) - st.mx) * km
      st.my += ((st.fine && !st.still ? st.ty : 0) - st.my) * km
      const b = st.still ? STILL : story(st.cur)
      const age = now - st.born
      if (st.intro && age > INTRO_MS + 200) {
        st.intro = false
        if (h1) h1.style.filter = "none"
      }
      if (st.intro && dispRef.current) dispRef.current.setAttribute("scale", (38 * (1 - smooth(age / 1500))).toFixed(2))
      const sq = st.still ? 1 : squiggle(age, b.hy)
      const key = [b.hy, b.ab, b.rv, b.wl, b.sw, b.st, st.mx, st.my, st.fCur, sq].map((v) => v.toFixed(4)).join()
      if (key !== st.written) {
        st.written = key
        const cs = root.style
        cs.setProperty("--hy", b.hy.toFixed(4))
        cs.setProperty("--ab", b.ab.toFixed(4))
        cs.setProperty("--rv", b.rv.toFixed(4))
        cs.setProperty("--sw", b.sw.toFixed(4))
        cs.setProperty("--st", b.st.toFixed(4))
        cs.setProperty("--mx", st.mx.toFixed(4))
        cs.setProperty("--my", st.my.toFixed(4))
        cs.setProperty("--f", st.fCur.toFixed(4))
        sqRef.current?.setAttribute("stroke-dashoffset", (1 - sq).toFixed(4))
        wireRef.current?.setAttribute("stroke-dashoffset", (1 - b.wl).toFixed(4))
        underRef.current?.setAttribute("stroke-dashoffset", (1 - b.st).toFixed(4))
      }
      if (alive && (running || st.intro)) raf = requestAnimationFrame(frame)
    }
    const start = () => {
      if (running) return
      running = true
      cancelAnimationFrame(raf)
      last = performance.now()
      raf = requestAnimationFrame(frame)
    }
    const stop = () => {
      running = false
    }
    layout()
    measure()
    st.cur = st.target
    st.fCur = st.f
    const io = typeof IntersectionObserver !== "undefined" ? new IntersectionObserver((e) => (e[0]?.isIntersecting ? start() : stop())) : null
    if (io) io.observe(root)
    else start()
    raf = requestAnimationFrame(frame)
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => (layout(), measure())) : null
    ro?.observe(root)
    const onScroll = () => measure()
    addEventListener("scroll", onScroll, { passive: true, capture: true })
    addEventListener("resize", onScroll)
    return () => {
      alive = false
      cancelAnimationFrame(raf)
      io?.disconnect()
      ro?.disconnect()
      removeEventListener("scroll", onScroll, { capture: true })
      removeEventListener("resize", onScroll)
    }
  }, [layout, measure, still])

  // keyboard: Escape closes, arrows walk the lightbox
  useEffect(() => {
    if (box < 0 && !menu) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setBox(-1)
        setMenu(false)
      } else if (box >= 0 && e.key === "ArrowRight") setBox((b) => (b + 1) % TILES.length)
      else if (box >= 0 && e.key === "ArrowLeft") setBox((b) => (b + TILES.length - 1) % TILES.length)
    }
    addEventListener("keydown", onKey)
    return () => removeEventListener("keydown", onKey)
  }, [box, menu])

  useEffect(() => () => window.clearTimeout(toastTimer.current), [])

  /* ---- pointer: context cursor, parallax and magnets (mouse only) ---- */
  function release() {
    const m = s.current.magnet
    if (m) {
      m.style.transform = ""
      const inner = m.firstElementChild as HTMLElement | null
      if (inner) inner.style.transform = ""
    }
    s.current.magnet = null
    s.current.magnetBox = null
  }

  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return
    const st = s.current
    if (!st.fine) return
    const cur = cursorRef.current
    if (cur) {
      cur.style.transform = "translate3d(" + e.clientX + "px," + e.clientY + "px,0)"
      delete cur.dataset.out
    }
    st.tx = (e.clientX / window.innerWidth) * 2 - 1
    st.ty = (e.clientY / window.innerHeight) * 2 - 1
    const t = e.target as Element | null
    const hit = t && t.closest ? (t.closest("[data-cursor]") as HTMLElement | null) : null
    const label = hit ? hit.dataset.cursor || "" : ""
    if (label !== st.label) {
      st.label = label
      if (cur) {
        if (label) cur.dataset.label = ""
        else delete cur.dataset.label
      }
      if (label && ringRef.current) ringRef.current.textContent = ringText(label)
    }
    if (st.still) return
    const mag = t && t.closest ? (t.closest("[data-magnet]") as HTMLElement | null) : null
    if (mag !== st.magnet) {
      release()
      if (mag) {
        st.magnet = mag
        st.magnetBox = mag.getBoundingClientRect()
      }
    }
    const m = st.magnet
    const r = st.magnetBox
    if (m && r) {
      const dx = e.clientX - (r.left + r.width / 2)
      const dy = e.clientY - (r.top + r.height / 2)
      m.style.transform = "translate3d(" + (dx * 0.32).toFixed(1) + "px," + (dy * 0.4).toFixed(1) + "px,0)"
      const inner = m.firstElementChild as HTMLElement | null
      if (inner) inner.style.transform = "translate3d(" + (dx * 0.14).toFixed(1) + "px," + (dy * 0.18).toFixed(1) + "px,0)"
    }
  }

  const onLeave = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return
    release()
    s.current.tx = 0
    s.current.ty = 0
    s.current.label = ""
    const cur = cursorRef.current
    if (cur) {
      cur.dataset.out = ""
      delete cur.dataset.label
    }
  }

  const pickFlower = () => {
    setSpin((n) => n + 1)
    const st = s.current
    const r = tapEgg(st.taps, Date.now())
    st.taps = r.times
    if (r.fire) {
      setGold((g) => {
        say(g ? "Back to daylight." : "Golden hour. Everything looks better now.")
        return !g
      })
    }
  }

  useEffect(() => {
    const f = flowerRef.current
    if (!f || !spin) return
    delete f.dataset.spin
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => (f.dataset.spin = "")))
    return () => cancelAnimationFrame(raf)
  }, [spin])

  const H = height
  const rootStyle = { "--H": H, ...style } as CSSProperties
  const shown = box >= 0 ? TILES[box] : null

  const cta = (a: Action, ghost: boolean, extra?: CSSProperties) => {
    const inner = (
      <span>
        {a.label}
        <span aria-hidden="true">{"→"}</span>
      </span>
    )
    const cls = "vg-cta vg-sans" + (ghost ? " vg-ghost" : "")
    return a.href ? (
      <a className={cls} href={a.href} data-magnet="" data-cursor={a.label} style={extra} onClick={a.onClick}>
        {inner}
      </a>
    ) : (
      <button type="button" className={cls} data-magnet="" data-cursor={a.label} style={extra} onClick={() => run(a)}>
        {inner}
      </button>
    )
  }

  return (
    <div
      ref={rootRef}
      className={"vg-root" + (className ? " " + className : "")}
      style={rootStyle}
      data-still={still ? "" : undefined}
      data-menu={menu ? "" : undefined}
      data-gold={gold ? "" : undefined}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      <style>{FONTS + CSS}</style>
      <svg width="0" height="0" aria-hidden="true" style={{ position: "absolute" }}>
        <filter id={fid} x="-10%" y="-40%" width="120%" height="180%">
          <feTurbulence type="fractalNoise" baseFrequency="0.003 0.032" numOctaves={1} seed={4} />
          <feDisplacementMap ref={dispRef} in="SourceGraphic" scale="38" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>

      <header className="vg-head">
        <div className="vg-bar">
          <span className="vg-logo vg-sans">{brand}.</span>
          <button
            type="button"
            className="vg-burger"
            aria-label={menu ? "Close menu" : "Open menu"}
            aria-expanded={menu}
            data-magnet=""
            data-cursor={menu ? "Close" : "Menu"}
            onClick={() => setMenu((m) => !m)}
          >
            <i />
            <i />
          </button>
        </div>
      </header>
      <nav className="vg-menu" aria-label={brand + " sections"} aria-hidden={!menu}>
        {(
          [
            ["top", "Cover"],
            ["about", "About"],
            ["gallery", "Gallery"],
            ["feature", "Issue " + year],
            ["end", "Submit"],
          ] as const
        ).map(([k, label], i) => (
          <button key={k} type="button" data-cursor="Go" tabIndex={menu ? 0 : -1} onClick={() => jump(k)}>
            <small>{"0" + (i + 1)}</small>
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div ref={trackRef} className="vg-track" style={{ height: "calc(" + H + " * " + scrollLength + ")" }}>
        <div className="vg-stage" style={{ height: H }}>
          {/* 1 · hero */}
          <section className="vg-layer vg-hero" aria-label="Cover" data-cursor="Scroll">
            {TILES.map((t, k) => (
              <div
                key={k}
                className="vg-tile"
                style={{ "--x": t.x, "--y": t.y, "--w": t.w, "--d": t.d, "--k": k, "--a": t.a, "--fx": Math.round(Math.sin(k * 2.3) * 10), "--fy": Math.round(Math.cos(k * 1.7) * 9) } as CSSProperties}
              >
                <div className="vg-tile-in">
                  <div className="vg-float">
                    <button type="button" data-cursor="View photo" aria-label={"Open plate: " + t.t} onClick={() => setBox(k)}>
                      <span className="vg-photo" style={{ "--bg": t.look.bg } as CSSProperties}>
                        <img data-photo={"t" + k} alt="" width={320} height={Math.round(320 * t.a)} decoding="async" />
                      </span>
                    </button>
                    {t.c ? <div className="vg-cap vg-sans">{t.c}</div> : null}
                  </div>
                </div>
              </div>
            ))}
            <svg className="vg-squig" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true">
              <path ref={sqRef} d={SQUIGGLE} pathLength={1} strokeDasharray="1 2" strokeDashoffset={still ? 0 : 1} />
            </svg>
            <div className="vg-h1wrap">
              <div ref={h1Ref} style={{ filter: "url(#" + fid + ")" }}>
                <h1 className="vg-h1">
                  {headline.map((line, l) => (
                    <span key={l} className="vg-ln" style={{ "--l": l } as CSSProperties}>
                      {line}
                    </span>
                  ))}
                </h1>
              </div>
              <div className="vg-tag vg-sans">{tagline}</div>
            </div>
          </section>

          {/* 2 · about, on black */}
          <section className="vg-layer vg-about" aria-label="About">
            <svg className="vg-wire" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true">
              <path ref={wireRef} d={WIRE} pathLength={1} strokeDasharray="1 2" strokeDashoffset={still ? 0 : 1} />
            </svg>
            <div className="vg-alabel vg-sans">About us</div>
            <div className="vg-quote" aria-hidden="true">
              {"“"}
            </div>
            <div className="vg-side vg-sans">{brand}</div>
            <h2 className="vg-h2" style={{ "--n": words.n } as CSSProperties}>
              <span className="vg-sr">{aboutTitle.join(" ")}</span>
              {words.lines.map((line, l) => (
                <span key={l} aria-hidden="true" style={{ display: "block" }}>
                  {line.map((w, wi) => (
                    <span key={wi}>
                      <span className="vg-w">
                        {w.map((c) => (
                          <span key={c.i} className="vg-ch" style={{ "--i": c.i } as CSSProperties}>
                            {c.ch}
                          </span>
                        ))}
                      </span>
                      {wi < line.length - 1 ? " " : null}
                    </span>
                  ))}
                </span>
              ))}
            </h2>
            <div className="vg-cols">
              <p>{aboutBody[0]}</p>
              <p>{aboutBody[1]}</p>
            </div>
          </section>

          {/* 3 · gallery, the cream card tossed onto the black */}
          <div className="vg-layer vg-cardwrap" style={{ overflow: "visible", pointerEvents: "none" }}>
            <section className="vg-card" aria-label="Gallery" style={{ pointerEvents: "auto" }}>
              <h2 className="vg-gh">
                <span>{galleryTitle[0]}</span>
                <span className="vg-flower">
                  <button ref={flowerRef} type="button" aria-label="Pick the flower" data-cursor="Pick me" onClick={pickFlower}>
                    <Flower />
                  </button>
                </span>
                <span>
                  {galleryTitle[1]}
                  <svg className="vg-under" viewBox="0 0 420 40" preserveAspectRatio="none" aria-hidden="true">
                    <path ref={underRef} d={UNDER} pathLength={1} strokeDasharray="1 2" strokeDashoffset={still ? 0 : 1} />
                  </svg>
                </span>
              </h2>
              <div className="vg-gcols">
                <p>{galleryBody[0]}</p>
                <p>{galleryBody[1]}</p>
              </div>
              {cta(primaryAction, false)}
              <div className="vg-shelf" aria-hidden="true">
                <div className="vg-shelf-in">
                  {shelf.map((w, i) => (
                    <span key={i}>{w}</span>
                  ))}
                </div>
              </div>
              <p className="vg-issue">{issue}</p>
              <div className="vg-strip" aria-hidden="true">
                <img data-photo="feature" alt="" width={1600} height={1000} decoding="async" />
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* 4 · after the pin: the feature plate and the colophon */}
      <div ref={flowRef} className="vg-flow">
        <figure className="vg-feat" style={{ margin: undefined }}>
          <img data-photo="feature" alt={"Feature plate, " + year + ": a figure in profile under a wide straw hat"} width={1600} height={1000} decoding="async" />
          <span className="vg-year" aria-hidden="true">
            {year}
          </span>
          <figcaption className="vg-fcap vg-sans">
            <span>Plate 01</span>
            <span>The Weather Inside</span>
          </figcaption>
        </figure>
        <section className="vg-end" aria-label="Submit">
          <h3>Have a set worth a slower look?</h3>
          <div className="vg-acts">
            {cta(primaryAction, false)}
            {cta(secondaryAction, true)}
          </div>
          <div className="vg-meta">
            <div>
              <b>Studio</b>
              14 Harbour Row
              <br />
              open by appointment
            </div>
            <div>
              <b>Readers</b>
              four issues a year
              <br />
              printed, never streamed
            </div>
            <div>
              <b>Write</b>
              <button type="button" data-cursor="Copy" onClick={() => say("Address copied")}>
                letters@{brand.toLowerCase()}.press
              </button>
            </div>
          </div>
          <span className="vg-mark" aria-hidden="true">
            {brand}
            <i>.</i>
          </span>
        </section>
      </div>

      {/* lightbox */}
      <div className="vg-box" data-open={shown ? "" : undefined} role="dialog" aria-modal="true" aria-hidden={!shown} aria-label="Plate" data-cursor="Close" onClick={() => setBox(-1)}>
        {shown ? (
          <figure onClick={(e) => e.stopPropagation()}>
            <button type="button" data-cursor="Next" aria-label="Next plate" onClick={() => setBox((b) => (b + 1) % TILES.length)}>
              <img src={PAINTED.get("t" + box) || ""} alt={shown.t} />
            </button>
            <figcaption className="vg-sans">
              <span>{"Plate " + String(box + 1).padStart(2, "0") + " / " + TILES.length}</span>
              <i>{shown.t}</i>
            </figcaption>
          </figure>
        ) : null}
        <button type="button" className="vg-x vg-sans" data-cursor="Close" onClick={() => setBox(-1)}>
          Close
        </button>
      </div>

      <div className="vg-toast vg-sans" role="status" data-on={toast.on ? "" : undefined}>
        {toast.text}
      </div>

      <div ref={cursorRef} className="vg-cursor" aria-hidden="true" data-out="">
        <span className="vg-cdot" />
        <span className="vg-badge">
          <svg className="vg-ring" viewBox="0 0 92 92">
            <defs>
              <path id={"vgr" + uid} d="M46 46 m-34 0 a34 34 0 1 1 68 0 a34 34 0 1 1 -68 0" />
            </defs>
            <text>
              <textPath ref={ringRef} href={"#vgr" + uid} textLength="212">
                {ringText("Scroll")}
              </textPath>
            </text>
          </svg>
          <svg viewBox="-50 -50 100 100" style={{ color: "#e2603a" }}>
            {[0, 90, 180, 270].map((a) => (
              <path key={a} transform={"rotate(" + (a + 45) + ")"} d="M0 -4 C 14 -14, 18 -38, 0 -48 C -18 -38, -14 -14, 0 -4 Z" fill={a % 180 ? "#8a847b" : "currentColor"} />
            ))}
          </svg>
        </span>
      </div>
    </div>
  )
}
