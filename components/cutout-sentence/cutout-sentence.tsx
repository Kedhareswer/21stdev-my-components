"use client"

import * as React from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

/**
 * Cutout Sentence — a picture that turns into the words describing it.
 *
 * The section opens on one full-bleed image. As you scroll it settles into
 * the lower part of the stage, small rectangles are scored into it, and then
 * they lift out one by one — leaving clean holes the colour of the page — and
 * fly up into a sentence, each landing between typographic braces beside the
 * word it shows: { boats } next to "boats", { pier } next to "pier". On the
 * way the pieces tilt, swell and re-crop (the window opens on a little more of
 * the picture mid-flight, then closes on its slot), and the words around each
 * slot rise out of a blur to receive it. Scroll back and every piece flies
 * home into its own hole.
 *
 * `mode="auto"` plays it once when the section comes into view instead, with
 * a replay button. Reduced motion shows the finished sentence, no flight.
 *
 * With no `src` it paints its own picture — an aerial harbour, drawn on a
 * canvas in the browser — so it loads nothing from anywhere.
 */

// #region cutout
// Pure: sentence parsing, layout and the scroll → choreography mapping. Lifted out and run by the test.

/** [x, y, w, h] as fractions of the image (0–1). */
export type Region = [number, number, number, number]
export type Rect = { x: number; y: number; w: number; h: number }

export type CutoutPiece = {
  /** Matches a `{id}` placeholder in `sentence`. */
  id: string
  /** The word this piece illustrates — its accessible name and hover tag. */
  word: string
  /** Which part of the image is cut out. */
  region: Region
  /** Slot width ÷ height in the sentence. Defaults to the region's own shape; anything else re-crops on landing. */
  aspect?: number
}

export type Token =
  | { kind: "word"; text: string; seg: number; j: number }
  | { kind: "piece"; id: string; index: number }

export const clamp01 = (v: number): number => (v > 0 ? (v < 1 ? v : 1) : 0)
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t
/** 0 before a, 1 after b, linear between. */
export const ramp = (p: number, a: number, b: number): number => (b <= a ? (p >= b ? 1 : 0) : clamp01((p - a) / (b - a)))
export const easeInOutCubic = (x: number): number => {
  const t = clamp01(x)
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}
export const easeOutCubic = (x: number): number => 1 - Math.pow(1 - clamp01(x), 3)
export const easeOutBack = (x: number, s = 2.2): number => {
  const t = clamp01(x) - 1
  return 1 + (s + 1) * t * t * t + s * t * t
}
export const lerpRect = (a: Rect, b: Rect, t: number): Rect => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
  w: lerp(a.w, b.w, t),
  h: lerp(a.h, b.h, t),
})

/**
 * Splits "Painted boats {boats} doze…" into nowrap groups: each word is a
 * group, a piece joins the word before it, and punctuation written straight
 * after a piece ("{pier},") joins the piece. Unknown ids are dropped.
 * Every word records which flight reveals it (`seg`: the next piece's index,
 * or the piece count for the tail) and its place in that run (`j`).
 */
export function parseSentence(sentence: string, ids: string[]) {
  const known = new Set(ids)
  const groups: Token[][] = []
  const order: string[] = []
  const segCount: number[] = []
  let attach = false
  const pushWord = (text: string, glue: boolean) => {
    const seg = order.length
    const j = segCount[seg] ?? 0
    segCount[seg] = j + 1
    const tok: Token = { kind: "word", text, seg, j }
    if (glue && groups.length) groups[groups.length - 1].push(tok)
    else groups.push([tok])
  }
  const parts = sentence.split(/\{([^{}\s]+)\}/)
  parts.forEach((part, i) => {
    if (i % 2 === 1) {
      if (!known.has(part) || order.includes(part)) return
      const tok: Token = { kind: "piece", id: part, index: order.length }
      order.push(part)
      if (groups.length) groups[groups.length - 1].push(tok)
      else groups.push([tok])
      attach = true
      return
    }
    const lead = /^\s/.test(part)
    const words = part.split(/\s+/).filter(Boolean)
    words.forEach((w, k) => pushWord(w, k === 0 && attach && !lead))
    if (words.length || lead) attach = false
  })
  return { groups, order, segCount: order.map((_, k) => segCount[k] ?? 0).concat(segCount[order.length] ?? 0) }
}

/**
 * Where the image sits inside `box`. Covers the box and centres the regions'
 * bounding box; with `fit`, shrinks until every region (plus `margin`) is in
 * view — then a picture narrower than the box is centred, and one shorter
 * than it sits on the bottom edge.
 */
export function placeImage(aspect: number, box: Rect, bb: Region, margin: number, fit: boolean): Rect {
  let w = Math.max(box.w, box.h * aspect)
  if (fit) {
    const needW = (box.w - 2 * margin) / Math.max(bb[2], 1e-6)
    const needH = ((box.h - 2 * margin) / Math.max(bb[3], 1e-6)) * aspect
    w = Math.max(1, Math.min(w, needW, needH))
  }
  const h = w / aspect
  let x = box.x + box.w / 2 - (bb[0] + bb[2] / 2) * w
  let y = box.y + box.h / 2 - (bb[1] + bb[3] / 2) * h
  x = w >= box.w ? Math.min(box.x, Math.max(box.x + box.w - w, x)) : box.x + (box.w - w) / 2
  y = h >= box.h ? Math.min(box.y, Math.max(box.y + box.h - h, y)) : box.y + box.h - h
  return { x, y, w, h }
}

export const intersect = (a: Rect, b: Rect): Rect => {
  const x = Math.max(a.x, b.x)
  const y = Math.max(a.y, b.y)
  return { x, y, w: Math.max(0, Math.min(a.x + a.w, b.x + b.w) - x), h: Math.max(0, Math.min(a.y + a.h, b.y + b.h) - y) }
}

export const regionsBox = (regions: Region[]): Region => {
  if (!regions.length) return [0, 0, 1, 1]
  let x0 = 1, y0 = 1, x1 = 0, y1 = 0
  for (const [x, y, w, h] of regions) {
    x0 = Math.min(x0, x); y0 = Math.min(y0, y)
    x1 = Math.max(x1, x + w); y1 = Math.max(y1, y + h)
  }
  return [x0, y0, x1 - x0, y1 - y0]
}

/** The beats, as fractions of the whole progress. */
export const LOWER: [number, number] = [0.03, 0.28]
export const SCORE: [number, number] = [0.2, 0.3]
export const FLY: [number, number] = [0.3, 0.93]
export const FLY_LEN = 0.24
export const SETTLED = 0.985

/** When piece i of n lifts and lands. Staggered so three or four are in the air at once. */
export const flightWindow = (i: number, n: number): [number, number] => {
  const len = Math.min(FLY_LEN, FLY[1] - FLY[0])
  const stagger = n > 1 ? (FLY[1] - FLY[0] - len) / (n - 1) : 0
  const a = FLY[0] + i * stagger
  return [a, a + len]
}

/** When piece i's outline is scored into the picture. */
export const scoreWindow = (i: number, n: number): [number, number] => {
  const step = n > 1 ? (SCORE[1] - SCORE[0]) / n : 0
  const a = SCORE[0] + i * step
  return [a, a + 0.07]
}

/** Words rise just ahead of the piece they lead into; the tail follows the last landing. */
export const wordWindow = (seg: number, j: number, m: number, n: number): [number, number] => {
  const start = n === 0 ? 0.3 : seg < n ? flightWindow(seg, n)[0] - 0.035 : flightWindow(n - 1, n)[1] - 0.05
  const s = start + j * Math.min(0.014, 0.07 / Math.max(1, m))
  return [s, Math.min(1, s + 0.1)]
}

export type FlightFrame = { x: number; y: number; w: number; h: number; rot: number; scale: number; zoom: number; shadow: number; edge: number }

/**
 * A piece u of the way through its flight from hole `a` to slot `b`: lifts
 * (scale up, shadow), arcs along a bowed path while tilting, opens its window
 * mid-air (w/h swell, crop zooms out), then lands with a small overshoot.
 * u = 0 is exactly the hole, u = 1 exactly the slot.
 */
export function flight(u: number, a: Rect, b: Rect, side: number): FlightFrame {
  const lift = easeOutCubic(ramp(u, 0, 0.16))
  const t = easeInOutCubic(ramp(u, 0.08, 0.86))
  const settle = ramp(u, 0.8, 1)
  const ax = a.x + a.w / 2, ay = a.y + a.h / 2
  const bx = b.x + b.w / 2, by = b.y + b.h / 2
  const dist = Math.hypot(bx - ax, by - ay)
  const cx = (ax + bx) / 2 + side * dist * 0.26
  const cy = (ay + by) / 2 + dist * 0.04
  const k = 1 - t
  const x = k * k * ax + 2 * k * t * cx + t * t * bx
  const y = k * k * ay + 2 * k * t * cy + t * t * by - lift * k * 10
  const breathe = Math.sin(Math.PI * t)
  const w = lerp(a.w, b.w, t) * (1 + breathe * 0.14)
  const h = lerp(a.h, b.h, t) * (1 + breathe * 0.08)
  return {
    x: x - w / 2,
    y: y - h / 2,
    w,
    h,
    rot: side * (8 * breathe - 2.5 * lift * k),
    scale: 1 + 0.07 * lift - 0.07 * easeOutBack(settle),
    zoom: 1 - 0.26 * breathe,
    shadow: lift * (1 - settle),
    edge: lift * (1 - t),
  }
}

/**
 * How to draw the whole image inside a w × h window so `region` covers it,
 * centred. `zoom` < 1 opens the window onto the surroundings. At the hole's
 * own size this is exactly the picture's own scale and offset.
 */
export function cropFor(region: Region, aspect: number, w: number, h: number, zoom = 1) {
  const [rx, ry, rw, rh] = region
  let D = Math.max(w / Math.max(rw, 1e-6), (h * aspect) / Math.max(rh, 1e-6)) * zoom
  D = Math.max(D, w, h * aspect)
  const Dh = D / aspect
  let ix = w / 2 - (rx + rw / 2) * D
  let iy = h / 2 - (ry + rh / 2) * Dh
  ix = Math.min(0, Math.max(w - D, ix))
  iy = Math.min(0, Math.max(h - Dh, iy))
  return { D, Dh, ix, iy }
}
// #endregion

// ---------------------------------------------------------------------------
// The default picture: an aerial harbour, painted on a canvas. Exported so you
// can reuse it; it resolves to an object URL (revoke it when you are done).

const tick = () => new Promise<void>((r) => setTimeout(r, 0))

export async function paintHarbour(width = 2400): Promise<string> {
  const W = Math.round(width)
  const H = Math.round((width * 2) / 3)
  const c = document.createElement("canvas")
  c.width = W
  c.height = H
  const g = c.getContext("2d") as CanvasRenderingContext2D
  const S = W / 2400 // authored on a 2400 × 1600 board
  let seed = 7
  const rnd = () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const grid = new Float32Array(64 * 64).map(() => rnd())
  const vn = (x: number, y: number) => {
    const xi = Math.floor(x), yi = Math.floor(y)
    const xf = x - xi, yf = y - yi
    const a = grid[(yi & 63) * 64 + (xi & 63)], b = grid[(yi & 63) * 64 + ((xi + 1) & 63)]
    const cc = grid[((yi + 1) & 63) * 64 + (xi & 63)], d = grid[((yi + 1) & 63) * 64 + ((xi + 1) & 63)]
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf)
    return a + (b - a) * u + (cc - a) * v + (a - b - cc + d) * u * v
  }
  const fbm = (x: number, y: number) => vn(x, y) * 0.55 + vn(x * 2.03, y * 2.03) * 0.28 + vn(x * 4.1, y * 4.1) * 0.17

  // ---- water, per pixel at half resolution (soft caustics want it anyway) ----
  const WW = Math.ceil(W / 2), WH = Math.ceil(H / 2)
  const wc = document.createElement("canvas")
  wc.width = WW
  wc.height = WH
  const wg = wc.getContext("2d") as CanvasRenderingContext2D
  const img = wg.createImageData(WW, WH)
  const px = img.data
  const deep = [8, 96, 122], mid = [16, 158, 168], shal = [96, 214, 200], sand = [226, 226, 188]
  const S2 = S / 2
  // a plain function, not inline: V8 won't optimise a hot loop inside an async body
  const rows = (y0: number, y1: number) => {
  for (let y = y0; y < y1; y++) {
    for (let x = 0; x < WW; x++) {
      const bx = x / S2, by = y / S2
      const n = fbm(bx / 260, by / 260)
      const dx = (bx - 2700) / 1350, dy = (by - 1500) / 1100
      const sh = clamp01((1 - Math.sqrt(dx * dx + dy * dy)) * 1.35 + (n - 0.5) * 0.55)
      const s = Math.min(1, sh + Math.max(0, 1 - bx / 520) * 0.35)
      let r: number, gg: number, b: number
      if (s < 0.45) {
        const t = s / 0.45
        r = lerp(deep[0], mid[0], t); gg = lerp(deep[1], mid[1], t); b = lerp(deep[2], mid[2], t)
      } else if (s < 0.8) {
        const t = (s - 0.45) / 0.35
        r = lerp(mid[0], shal[0], t); gg = lerp(mid[1], shal[1], t); b = lerp(mid[2], shal[2], t)
      } else {
        const t = ((s - 0.8) / 0.2) * 0.85
        r = lerp(shal[0], sand[0], t); gg = lerp(shal[1], sand[1], t); b = lerp(shal[2], sand[2], t)
      }
      const rip = s * s * 14 * (Math.sin(bx * 0.045 + by * 0.018 + n * 9) * 0.5)
      const f = 0.0105
      let u = bx * f + 1.3 * Math.sin(by * f * 0.73 + 1.7 + n * 2)
      let v = by * f + 1.3 * Math.sin(bx * f * 0.81 + 4.2 - n * 2)
      const c1 = Math.sin(u) + Math.sin(v) + Math.sin((u + v) * 0.62)
      u = bx * f * 1.9 + 1.1 * Math.sin(by * f * 1.4 + 0.3)
      v = by * f * 1.9 + 1.1 * Math.sin(bx * f * 1.2 + 2.6)
      const c2 = Math.sin(u + 0.7) + Math.sin(v - 0.4)
      const cA = (Math.exp(-c1 * c1 * 9) * 0.75 + Math.exp(-c2 * c2 * 14) * 0.45) * (22 + 52 * s)
      const swell = (fbm(bx / 700 + 3, by / 700) - 0.5) * 26
      const i = (y * WW + x) * 4
      px[i] = r + rip + cA * 0.85 + swell * 0.4
      px[i + 1] = gg + rip + cA + swell * 0.8
      px[i + 2] = b + rip * 0.6 + cA * 0.9 + swell
      px[i + 3] = 255
    }
  }
  }
  for (let y = 0; y < WH; y += 90) {
    rows(y, Math.min(WH, y + 90))
    await tick()
  }
  wg.putImageData(img, 0, 0)
  g.imageSmoothingQuality = "high"
  g.drawImage(wc, 0, 0, W, H)
  await tick()
  g.save()
  g.scale(S, S)

  const shade = (hex: string, k: number) => {
    const n = parseInt(hex.slice(1), 16)
    const ch = (v: number) => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k)))
    return "rgb(" + ch(n >> 16) + "," + ch((n >> 8) & 255) + "," + ch(n & 255) + ")"
  }
  // bow at -x (pointed), transom at +x
  const hull = (L: number, B: number, k = 0) => {
    const p = new Path2D()
    const h = L / 2 - k * 1.6, b = B / 2 - k
    p.moveTo(-h, 0)
    p.bezierCurveTo(-h + L * 0.19, -b * 1.02, -h + L * 0.45, -b, h - L * 0.055, -b * 0.88)
    p.quadraticCurveTo(h, -b * 0.84, h, -b * 0.55)
    p.lineTo(h, b * 0.55)
    p.quadraticCurveTo(h, b * 0.84, h - L * 0.055, b * 0.88)
    p.bezierCurveTo(-h + L * 0.45, b, -h + L * 0.19, b * 1.02, -h, 0)
    p.closePath()
    return p
  }

  type Boat = { x: number; y: number; a: number; L: number; B: number; hull: string; inner: string; stripe: string; oars?: boolean }
  const pierW = 330
  const posts = [150, 470, 790, 1110, 1430]
  const boats: Boat[] = [
    { x: 760, y: 205, a: -0.06, L: 760, B: 236, hull: "#e4583e", inner: "#f2e7d2", stripe: "#f6efe0" },
    { x: 720, y: 470, a: 0.04, L: 700, B: 224, hull: "#f2b134", inner: "#2d6a86", stripe: "#fbf3df" },
    { x: 780, y: 735, a: -0.03, L: 780, B: 240, hull: "#f4efe4", inner: "#e9ddc6", stripe: "#d0473a", oars: true },
    { x: 735, y: 1000, a: 0.07, L: 720, B: 228, hull: "#2a5fae", inner: "#efe6d2", stripe: "#f2c14b" },
    { x: 770, y: 1265, a: -0.05, L: 750, B: 234, hull: "#5ec3a1", inner: "#e4583e", stripe: "#fbf3df" },
    { x: 720, y: 1515, a: 0.03, L: 700, B: 226, hull: "#ef7d97", inner: "#fbf2e2", stripe: "#2a5fae" },
  ]
  const drift: Boat = { x: 1800, y: 330, a: 0.62, L: 640, B: 210, hull: "#f07a2b", inner: "#1f4c66", stripe: "#f6efe0" }

  // shadows on the seabed, light from the top left
  g.save()
  g.filter = "blur(16px)"
  g.fillStyle = "rgba(0,34,48,0.42)"
  for (const bt of [...boats, drift]) {
    g.save(); g.translate(bt.x + 46, bt.y + 58); g.rotate(bt.a); g.fill(hull(bt.L, bt.B)); g.restore()
  }
  g.fillRect(0, -50, pierW + 38, 1800)
  g.restore()

  const ring = (bt: Boat) => {
    g.save(); g.translate(bt.x, bt.y); g.rotate(bt.a)
    for (let k = 0; k < 3; k++) {
      g.save(); g.scale(1.05 + k * 0.045, 1.14 + k * 0.13)
      g.lineWidth = 3.2 - k * 0.8
      g.strokeStyle = "rgba(235,255,250," + (0.34 - k * 0.09) + ")"
      g.stroke(hull(bt.L, bt.B)); g.restore()
    }
    g.restore()
  }

  const rope = (x0: number, y0: number, x1: number, y1: number, sag: number) => {
    const mx = (x0 + x1) / 2, my = (y0 + y1) / 2 + sag
    const path = (o: number, q: number) => { g.beginPath(); g.moveTo(x0 + o, y0 + q); g.quadraticCurveTo(mx + o, my + q, x1 + o, y1 + q); g.stroke() }
    g.save()
    g.lineCap = "round"
    g.filter = "blur(5px)"; g.strokeStyle = "rgba(0,40,50,0.35)"; g.lineWidth = 12; path(16, 20)
    g.filter = "none"
    g.strokeStyle = "#cdb383"; g.lineWidth = 11; path(0, 0)
    g.strokeStyle = "#8f7449"; g.setLineDash([3, 9]); path(0, 0)
    g.setLineDash([]); g.strokeStyle = "rgba(255,248,226,0.55)"; g.lineWidth = 2.5; path(0, -3)
    g.restore()
  }

  const drawBoat = (bt: Boat) => {
    const { L, B } = bt
    ring(bt)
    g.save(); g.translate(bt.x, bt.y); g.rotate(bt.a)
    const outer = hull(L, B)
    const gr = g.createLinearGradient(0, -B / 2, 0, B / 2)
    gr.addColorStop(0, shade(bt.hull, 0.22)); gr.addColorStop(0.5, bt.hull); gr.addColorStop(1, shade(bt.hull, -0.22))
    g.fillStyle = gr; g.fill(outer)
    g.lineWidth = 3; g.strokeStyle = shade(bt.hull, -0.4); g.stroke(outer)
    g.save(); g.clip(outer)
    g.lineWidth = 7; g.strokeStyle = bt.stripe; g.stroke(hull(L, B, 7))
    g.restore()
    g.lineWidth = 12; g.strokeStyle = "#8a6a46"; g.stroke(hull(L, B, 34))
    g.lineWidth = 3; g.strokeStyle = "rgba(255,240,215,0.6)"; g.stroke(hull(L, B, 30))
    const inner = hull(L, B, 42)
    const ig = g.createLinearGradient(0, -B / 2, 0, B / 2)
    ig.addColorStop(0, shade(bt.inner, -0.18)); ig.addColorStop(0.35, bt.inner); ig.addColorStop(1, shade(bt.inner, -0.08))
    g.fillStyle = ig; g.fill(inner)
    g.save(); g.clip(inner)
    g.strokeStyle = "rgba(60,40,20,0.16)"; g.lineWidth = 2
    for (let k = -3; k <= 3; k++) { g.beginPath(); g.moveTo(-L / 2, k * 22); g.lineTo(L / 2, k * 22); g.stroke() }
    g.lineWidth = 26; g.strokeStyle = "rgba(0,0,0,0.12)"; g.filter = "blur(8px)"; g.stroke(inner); g.filter = "none"
    for (const sx of [-L * 0.16, L * 0.12, L * 0.36]) {
      g.fillStyle = "#b07f4f"; g.fillRect(sx - 22, -B, 44, B * 2)
      g.fillStyle = "rgba(255,236,200,0.35)"; g.fillRect(sx - 22, -B, 6, B * 2)
      g.fillStyle = "rgba(60,30,10,0.25)"; g.fillRect(sx + 18, -B, 4, B * 2)
    }
    g.restore()
    g.fillStyle = "#7a5a3a"
    g.beginPath(); g.moveTo(-L / 2 + 6, 0); g.lineTo(-L / 2 + 60, -14); g.lineTo(-L / 2 + 60, 14); g.closePath(); g.fill()
    g.strokeStyle = "#c9c2b0"; g.lineWidth = 4; g.beginPath(); g.arc(-L / 2 + 44, 0, 8, 0, Math.PI * 2); g.stroke()
    if (bt.oars) {
      for (const [oy, oa] of [[-34, -0.03], [30, 0.04]]) {
        g.save(); g.translate(L * 0.02, oy); g.rotate(oa)
        g.fillStyle = "rgba(0,0,0,0.18)"; g.filter = "blur(4px)"; g.fillRect(-L * 0.36 + 6, 6, L * 0.62, 16); g.filter = "none"
        g.fillStyle = "#d9b27a"; g.fillRect(-L * 0.36, -7, L * 0.5, 14)
        g.fillStyle = "rgba(255,240,210,0.6)"; g.fillRect(-L * 0.36, -7, L * 0.5, 4)
        g.beginPath(); g.ellipse(L * 0.2, 0, 80, 23, 0, 0, Math.PI * 2); g.fillStyle = "#d0473a"; g.fill()
        g.beginPath(); g.ellipse(L * 0.2, -5, 72, 9, 0, Math.PI, Math.PI * 2); g.fillStyle = "rgba(255,220,200,0.45)"; g.fill()
        g.fillStyle = "#8b6a42"; g.fillRect(-L * 0.36 - 40, -6, 44, 12)
        g.restore()
      }
    }
    g.save(); g.clip(outer)
    const sh = g.createLinearGradient(0, -B / 2, 0, -B / 2 + 40)
    sh.addColorStop(0, "rgba(255,255,255,0.35)"); sh.addColorStop(1, "rgba(255,255,255,0)")
    g.fillStyle = sh; g.fillRect(-L / 2, -B / 2, L, 40)
    g.restore()
    g.restore()
  }

  // ---- pier: pilings, then planks over them, then cleats ----
  for (const py of posts) {
    g.beginPath(); g.arc(pierW + 6, py, 30, 0, Math.PI * 2)
    const pg = g.createRadialGradient(pierW - 4, py - 10, 4, pierW + 6, py, 30)
    pg.addColorStop(0, "#7d6248"); pg.addColorStop(1, "#3b2a1c")
    g.fillStyle = pg; g.fill()
    g.strokeStyle = "rgba(0,0,0,0.35)"; g.lineWidth = 3; g.stroke()
    g.strokeStyle = "rgba(255,230,190,0.18)"; g.lineWidth = 2
    for (let r = 8; r < 26; r += 7) { g.beginPath(); g.arc(pierW + 6, py, r, 0, Math.PI * 2); g.stroke() }
  }
  const tones = ["#b9946a", "#a8865e", "#c2a079", "#9e7f5c", "#b08d66", "#a49072", "#bb9a72"]
  for (let y = -20, k = 0; y < 1640; k++) {
    const h = 46 + Math.round(rnd() * 8)
    const base = tones[k % tones.length]
    const pg = g.createLinearGradient(0, y, 0, y + h)
    pg.addColorStop(0, shade(base, 0.12)); pg.addColorStop(1, shade(base, -0.12))
    g.fillStyle = pg
    const end = pierW - 12 + rnd() * 18
    g.fillRect(0, y, end, h - 5)
    g.save(); g.beginPath(); g.rect(0, y, end, h - 5); g.clip()
    for (let q = 0; q < 7; q++) {
      g.strokeStyle = "rgba(70,45,25," + (0.08 + rnd() * 0.12) + ")"
      g.lineWidth = 1 + rnd() * 1.6
      const gy = y + 4 + rnd() * (h - 12)
      g.beginPath(); g.moveTo(0, gy)
      g.bezierCurveTo(end * 0.3, gy + (rnd() - 0.5) * 8, end * 0.6, gy + (rnd() - 0.5) * 8, end, gy + (rnd() - 0.5) * 6)
      g.stroke()
    }
    if (rnd() < 0.35) {
      const kx = 40 + rnd() * (end - 90), ky = y + h * 0.45
      g.fillStyle = "rgba(80,50,28,0.45)"; g.beginPath(); g.ellipse(kx, ky, 12, 6, 0, 0, Math.PI * 2); g.fill()
      g.strokeStyle = "rgba(80,50,28,0.25)"; g.beginPath(); g.ellipse(kx, ky, 22, 10, 0, 0, Math.PI * 2); g.stroke()
    }
    g.restore()
    g.fillStyle = "rgba(255,240,215,0.28)"; g.fillRect(0, y, end, 3)
    g.fillStyle = "#4a3a2c"
    for (const nx of [36, pierW * 0.5, pierW - 40]) {
      g.beginPath(); g.arc(nx, y + 12, 3.2, 0, Math.PI * 2); g.fill()
      g.beginPath(); g.arc(nx, y + h - 17, 3.2, 0, Math.PI * 2); g.fill()
    }
    y += h
  }
  for (const py of posts) {
    g.fillStyle = "rgba(0,0,0,0.3)"; g.fillRect(pierW - 64, py - 30, 26, 66)
    g.fillStyle = "#3e4448"; g.fillRect(pierW - 70, py - 36, 24, 66)
    g.fillStyle = "rgba(255,255,255,0.25)"; g.fillRect(pierW - 70, py - 36, 5, 66)
  }
  for (const bt of boats) {
    const bx = bt.x - (bt.L / 2 - 44) * Math.cos(bt.a), by = bt.y - (bt.L / 2 - 44) * Math.sin(bt.a)
    const post = posts.reduce((a, b) => (Math.abs(b - by) < Math.abs(a - by) ? b : a))
    rope(pierW - 58, post, bx, by, 26)
  }
  for (const bt of boats) drawBoat(bt)
  drawBoat(drift)

  // ---- one buoy in the open water ----
  {
    const x = 1700, y = 980, r = 46
    for (let k = 0; k < 4; k++) {
      g.beginPath(); g.ellipse(x, y, r * (1.6 + k * 0.75), r * (1.5 + k * 0.7), 0, 0, Math.PI * 2)
      g.strokeStyle = "rgba(235,255,250," + (0.3 - k * 0.065) + ")"; g.lineWidth = 3 - k * 0.5; g.stroke()
    }
    g.save(); g.filter = "blur(10px)"; g.fillStyle = "rgba(0,38,52,0.38)"
    g.beginPath(); g.arc(x + 22, y + 26, r, 0, Math.PI * 2); g.fill(); g.restore()
    const bg = g.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r)
    bg.addColorStop(0, "#ffb27a"); bg.addColorStop(0.55, "#f2652a"); bg.addColorStop(1, "#b13a12")
    g.fillStyle = bg; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill()
    g.save(); g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.clip()
    g.fillStyle = "rgba(255,250,240,0.92)"; g.fillRect(x - r, y - r * 0.18, r * 2, r * 0.36)
    g.restore()
    g.fillStyle = "rgba(255,255,255,0.75)"; g.beginPath(); g.ellipse(x - r * 0.38, y - r * 0.42, r * 0.22, r * 0.13, -0.6, 0, Math.PI * 2); g.fill()
  }
  for (let k = 0; k < 46; k++) {
    const x = 1150 + rnd() * 1250, y = 60 + rnd() * 820, r = 1 + rnd() * 2.2
    g.fillStyle = "rgba(255,255,248," + (0.18 + rnd() * 0.3) + ")"
    g.beginPath(); g.ellipse(x, y, r * 3, r * 0.7, -0.2, 0, Math.PI * 2); g.fill()
  }
  g.restore()

  // ---- grade: vignette and a grain tile ----
  const vg = g.createRadialGradient(W * 0.55, H * 0.45, W * 0.25, W * 0.5, H * 0.5, W * 0.78)
  vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,20,30,0.28)")
  g.fillStyle = vg; g.fillRect(0, 0, W, H)
  const tile = document.createElement("canvas")
  tile.width = tile.height = 256
  const tg = tile.getContext("2d") as CanvasRenderingContext2D
  const td = tg.createImageData(256, 256)
  for (let i = 0; i < td.data.length; i += 4) {
    const n = 128 + (rnd() - 0.5) * 60
    td.data[i] = td.data[i + 1] = td.data[i + 2] = n
    td.data[i + 3] = 255
  }
  tg.putImageData(td, 0, 0)
  const pat = g.createPattern(tile, "repeat")
  if (pat) {
    g.save(); g.globalCompositeOperation = "overlay"; g.globalAlpha = 0.22
    g.fillStyle = pat; g.fillRect(0, 0, W, H); g.restore()
  }
  await tick()
  const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/jpeg", 0.92))
  return blob ? URL.createObjectURL(blob) : c.toDataURL("image/jpeg", 0.9)
}

// ---------------------------------------------------------------------------

export const HARBOUR_SENTENCE =
  "Painted boats {boats} doze by the old pier {pier}, oars {oars} shipped, ropes {rope} slack, as a lone buoy {buoy} bobs on turquoise {deep} water above pale shallows {shallows}."

export const HARBOUR_PIECES: CutoutPiece[] = [
  { id: "boats", word: "boats", region: [0.1708, 0.5563, 0.1125, 0.1375] },
  { id: "pier", word: "pier", region: [0.025, 0.45, 0.1167, 0.125] },
  { id: "oars", word: "oars", region: [0.35, 0.4063, 0.0917, 0.1] },
  { id: "rope", word: "ropes", region: [0.1042, 0.5975, 0.06, 0.115] },
  { id: "buoy", word: "buoy", region: [0.6667, 0.565, 0.0792, 0.09] },
  { id: "deep", word: "turquoise", region: [0.725, 0.4125, 0.1167, 0.1188] },
  { id: "shallows", word: "shallows", region: [0.8917, 0.625, 0.1042, 0.1125] },
]

export type CutoutSentenceProps = {
  /** The picture. Omit it to paint the built-in harbour. */
  src?: string
  alt?: string
  /** Width ÷ height of `src`, used until it has loaded. */
  imageAspect?: number
  /** Words with `{id}` placeholders where pieces land. */
  sentence?: string
  pieces?: CutoutPiece[]
  /** `scroll` scrubs with the page; `auto` plays once on view, then offers a replay. */
  mode?: "scroll" | "auto"
  /** Stage height. Must be a definite length. */
  height?: string
  /** Scroll mode: extra stage-heights of scroll the story takes. */
  scrollLength?: number
  /** Share of the stage kept for the sentence once the picture settles (0–1). */
  split?: number
  /** Slot height in em. */
  pieceHeight?: number
  /** Multiplies the fluid sentence size. */
  fontScale?: number
  /** Small line above the sentence. `""` hides it. */
  eyebrow?: string
  /** Line on the picture before it starts. `""` hides it. */
  hint?: string
  background?: string
  ink?: string
  muted?: string
  fontFamily?: string
  className?: string
  onComplete?: () => void
}

const useIsoLayoutEffect = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect

function useReducedMotion() {
  const [reduced, setReduced] = React.useState(false)
  useIsoLayoutEffect(() => {
    if (typeof matchMedia !== "function") return
    const mq = matchMedia("(prefers-reduced-motion: reduce)")
    const on = () => setReduced(mq.matches)
    on()
    mq.addEventListener("change", on)
    return () => mq.removeEventListener("change", on)
  }, [])
  return reduced
}

type Geo = {
  W: number
  H: number
  frame0: Rect
  frame1: Rect
  img0: Rect
  img1: Rect
  holes: Rect[]
  slots: Rect[]
  sides: number[]
}

const CSS = `
.cs-root{position:relative;width:100%;overflow:clip}
.cs-stage{position:sticky;top:0;width:100%;overflow:hidden}
.cs-frame{position:absolute;left:0;top:0;overflow:hidden;will-change:transform;background:color-mix(in oklab,var(--cs-ink) 7%,var(--cs-bg))}
.cs-img{position:absolute;left:0;top:0;max-width:none;display:block;user-select:none;-webkit-user-drag:none;transition:opacity .9s ease}
.cs-cut{position:absolute;box-sizing:border-box}
.cs-hole{pointer-events:none;background:var(--cs-bg);box-shadow:inset 0 0 0 1px color-mix(in oklab,var(--cs-ink) 7%,transparent)}
.cs-hole .cs-tag{position:absolute;left:50%;bottom:calc(100% + 8px);transform:translate(-50%,4px);opacity:0;white-space:nowrap;font-size:12px;letter-spacing:.06em;text-transform:lowercase;padding:4px 9px;border-radius:999px;background:var(--cs-ink);color:var(--cs-bg);pointer-events:none;transition:opacity .3s ease,transform .3s ease}
.cs-score{position:absolute;inset:-1px;width:calc(100% + 2px);height:calc(100% + 2px);overflow:visible;pointer-events:none}
.cs-score rect{fill:none;stroke:#fff;stroke-width:1.5;filter:drop-shadow(0 0 2px rgba(0,0,0,.45))}
.cs-sentence{position:absolute;left:0;top:0;margin:0;text-align:center;line-height:1.5;font-weight:450;letter-spacing:-.012em;text-wrap:pretty}
.cs-eyebrow{display:block;margin-bottom:1.1em;font-size:.42em;letter-spacing:.22em;text-transform:uppercase;color:var(--cs-muted);font-weight:500}
.cs-g{display:inline-block;white-space:nowrap}
.cs-w{display:inline-block;will-change:transform,opacity,filter}
.cs-brace{display:inline-block;font-weight:300;opacity:.7;transform-origin:50% 55%}
.cs-slot{display:inline-block;vertical-align:middle;margin:.14em .1em}
.cs-layer{position:absolute;inset:0;pointer-events:none}
.cs-piece{position:absolute;left:0;top:0;pointer-events:none;transform-origin:50% 50%;will-change:transform;visibility:hidden}
.cs-card{position:absolute;inset:0;overflow:hidden;transition:transform .5s cubic-bezier(.2,.9,.25,1.25),box-shadow .5s ease}
.cs-card img{position:absolute;left:0;top:0;max-width:none;display:block;pointer-events:none;user-select:none}
.cs-root[data-settled] .cs-piece,.cs-root[data-settled] .cs-hole{pointer-events:auto;cursor:pointer}
.cs-piece.is-hot .cs-card{transform:translateY(-3px) scale(1.07);box-shadow:0 16px 30px -14px rgba(0,0,0,.55)}
.cs-hole.is-hot{animation:cs-pulse 1.4s ease-in-out infinite}
.cs-hole.is-hot .cs-tag{opacity:1;transform:translate(-50%,0)}
@keyframes cs-pulse{0%,100%{box-shadow:inset 0 0 0 1.5px var(--cs-ink)}50%{box-shadow:inset 0 0 0 4px color-mix(in oklab,var(--cs-ink) 35%,transparent)}}
.cs-hint{position:absolute;left:0;right:0;bottom:clamp(18px,5vh,44px);display:flex;flex-direction:column;align-items:center;gap:12px;color:#fff;font-size:12px;letter-spacing:.24em;text-transform:uppercase;text-shadow:0 1px 10px rgba(0,0,0,.4);pointer-events:none}
.cs-hint i{display:block;width:1px;height:42px;background:linear-gradient(#fff,transparent);transform-origin:top;animation:cs-drip 2.2s cubic-bezier(.6,0,.2,1) infinite}
@keyframes cs-drip{0%{transform:scaleY(0);opacity:1}60%{transform:scaleY(1);opacity:1}100%{transform:scaleY(1);opacity:0}}
.cs-replay{position:absolute;right:clamp(16px,3vw,32px);bottom:clamp(16px,3vw,28px);display:inline-flex;align-items:center;gap:8px;padding:9px 15px;border-radius:999px;border:0;background:color-mix(in oklab,var(--cs-bg) 82%,transparent);color:var(--cs-ink);font:500 13px/1 var(--cs-font);letter-spacing:.02em;cursor:pointer;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);box-shadow:0 6px 24px -10px rgba(0,0,0,.4);opacity:0;transform:translateY(8px);pointer-events:none;transition:opacity .4s ease,transform .4s ease}
.cs-root[data-settled] .cs-replay{opacity:1;transform:none;pointer-events:auto}
.cs-replay:focus-visible{outline:2px solid var(--cs-ink);outline-offset:2px}
@media (prefers-reduced-motion: reduce){.cs-card,.cs-img,.cs-hole .cs-tag{transition:none}.cs-hole.is-hot{animation:none;box-shadow:inset 0 0 0 2px var(--cs-ink)}.cs-hint i{animation:none}}
`

export default function CutoutSentence({
  src,
  alt = "An aerial view of painted rowboats moored along a wooden pier in clear turquoise water.",
  imageAspect = 1.5,
  sentence = HARBOUR_SENTENCE,
  pieces = HARBOUR_PIECES,
  mode = "scroll",
  height = "100svh",
  scrollLength = 2.4,
  split = 0.46,
  pieceHeight = 2.1,
  fontScale = 1,
  eyebrow = "Harbour study — 10:40, low tide",
  hint = "Scroll to read the picture",
  background = "var(--color-background, #ececec)",
  ink = "var(--color-foreground, #141414)",
  muted = "var(--color-muted-foreground, #6b6b6b)",
  fontFamily = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  className = "",
  onComplete,
}: CutoutSentenceProps) {
  const reduced = useReducedMotion()
  const [painted, setPainted] = React.useState<string | null>(null)
  const [aspect, setAspect] = React.useState(imageAspect)
  const [loaded, setLoaded] = React.useState(false)
  const url = src ?? painted

  const rootRef = React.useRef<HTMLElement | null>(null)
  const stageRef = React.useRef<HTMLDivElement | null>(null)
  const frameRef = React.useRef<HTMLDivElement | null>(null)
  const imgBoxRef = React.useRef<HTMLDivElement | null>(null)
  const sentRef = React.useRef<HTMLParagraphElement | null>(null)
  const hintRef = React.useRef<HTMLDivElement | null>(null)
  const eyebrowRef = React.useRef<HTMLSpanElement | null>(null)
  const pieceEls = React.useRef<(HTMLDivElement | null)[]>([])
  const cardImgs = React.useRef<(HTMLImageElement | null)[]>([])
  const holeEls = React.useRef<(HTMLDivElement | null)[]>([])
  const scoreEls = React.useRef<(SVGSVGElement | null)[]>([])
  const slotEls = React.useRef<(HTMLSpanElement | null)[]>([])
  const braceEls = React.useRef<(HTMLSpanElement | null)[]>([])
  const wordEls = React.useRef<(HTMLSpanElement | null)[]>([])
  const geo = React.useRef<Geo | null>(null)
  const prog = React.useRef(0)
  const tease = React.useRef(0)
  const done = React.useRef(false)
  const last = React.useRef<Map<Element, string>>(new Map())
  const player = React.useRef<gsap.core.Animation | null>(null)

  // paint the built-in picture when no src is given
  React.useEffect(() => {
    if (src) return
    let alive = true
    let made: string | null = null
    paintHarbour(typeof window !== "undefined" && window.innerWidth < 700 ? 1600 : 2400).then((u) => {
      made = u
      if (alive) setPainted(u)
      else if (u.startsWith("blob:")) URL.revokeObjectURL(u)
    })
    return () => {
      alive = false
      if (made && made.startsWith("blob:")) URL.revokeObjectURL(made)
    }
  }, [src])

  React.useEffect(() => {
    setLoaded(false)
  }, [url])

  // the sentence, in reading order; pieces fly in that order
  const model = React.useMemo(() => {
    const byId = new Map(pieces.map((p) => [p.id, p]))
    const parsed = parseSentence(sentence, pieces.map((p) => p.id))
    const list = parsed.order.map((id) => byId.get(id) as CutoutPiece)
    return { ...parsed, list }
  }, [sentence, pieces])
  const n = model.list.length
  const bbox = React.useMemo(() => regionsBox(model.list.map((p) => p.region)), [model])

  const write = (el: Element | null | undefined, key: string, css: string, apply: (s: CSSStyleDeclaration) => void) => {
    if (!el) return
    const k = key + css
    const m = last.current
    if (m.get(el) === k) return
    m.set(el, k)
    apply((el as HTMLElement).style)
  }

  const render = React.useCallback(
    (p: number) => {
      const g = geo.current
      if (!g) return
      const lo = easeInOutCubic(ramp(p, LOWER[0], LOWER[1]))
      const fr = lerpRect(g.frame0, g.frame1, lo)
      const im = lerpRect(g.img0, g.img1, lo)
      const frame = frameRef.current
      if (frame) {
        frame.style.transform = "translate3d(" + fr.x + "px," + fr.y + "px,0)"
        frame.style.width = fr.w + "px"
        frame.style.height = fr.h + "px"
      }
      const box = imgBoxRef.current
      if (box) {
        box.style.transform = "translate3d(" + (im.x - fr.x) + "px," + (im.y - fr.y) + "px,0)"
        box.style.width = im.w + "px"
        box.style.height = im.h + "px"
      }
      const hintO = 1 - ramp(p, 0, 0.07)
      write(hintRef.current, "o", hintO.toFixed(3), (s) => {
        s.opacity = String(hintO)
        s.transform = "translateY(" + (1 - hintO) * 14 + "px)"
      })

      const teaseOn = tease.current * (1 - ramp(p, 0, 0.05))
      for (let i = 0; i < n; i++) {
        const [a, b] = flightWindow(i, n)
        const u = ramp(p, a, b)
        const [sa, sb] = scoreWindow(i, n)
        const draw = Math.max(easeOutCubic(ramp(p, sa, sb)), teaseOn)
        // the line goes the instant its piece leaves; the hole keeps its own edge
        const scoreO = u > 0 ? 0 : draw
        const score = scoreEls.current[i]
        write(score, "s", scoreO.toFixed(3), (s) => {
          s.opacity = String(scoreO)
          const r = score?.firstElementChild as SVGRectElement | null
          if (r) r.style.strokeDashoffset = String(1 - draw)
        })
        write(holeEls.current[i], "h", u > 0 ? "1" : "0", (s) => {
          s.opacity = u > 0 ? "1" : "0"
        })
        const el = pieceEls.current[i]
        const img = cardImgs.current[i]
        if (el && img) {
          if (u <= 0) {
            write(el, "v", "off", (s) => {
              s.visibility = "hidden"
            })
          } else {
            const f = flight(u, g.holes[i], g.slots[i], g.sides[i])
            const c = cropFor(model.list[i].region, aspect, f.w, f.h, f.zoom)
            last.current.delete(el)
            el.style.visibility = "visible"
            el.style.width = f.w + "px"
            el.style.height = f.h + "px"
            el.style.transform =
              "translate3d(" + f.x + "px," + f.y + "px,0) rotate(" + f.rot + "deg) scale(" + f.scale + ")"
            el.style.zIndex = u < 1 ? String(10 + Math.round(f.shadow * 10)) : "1"
            img.style.width = c.D + "px"
            img.style.height = c.Dh + "px"
            img.style.transform = "translate3d(" + c.ix + "px," + c.iy + "px,0)"
            const card = img.parentElement
            if (card) {
              card.style.boxShadow =
                f.shadow > 0.01 || f.edge > 0.01
                  ? "0 " + (4 + f.shadow * 22) + "px " + (8 + f.shadow * 38) + "px -6px rgba(0,0,0," + (0.42 * f.shadow).toFixed(3) + "), inset 0 0 0 1.5px rgba(255,255,255," + (0.85 * f.edge).toFixed(3) + ")"
                  : ""
            }
          }
        }
        const o = easeOutCubic(ramp(p, b - 0.07, b + 0.004))
        const L = braceEls.current[i * 2]
        const R = braceEls.current[i * 2 + 1]
        const ov = o.toFixed(3)
        write(L, "b", ov, (s) => {
          s.opacity = String(0.7 * o)
          s.transform = "translateX(" + (1 - o) * 0.55 + "em) scaleY(" + (0.6 + 0.4 * o) + ")"
        })
        write(R, "b", ov, (s) => {
          s.opacity = String(0.7 * o)
          s.transform = "translateX(" + -(1 - o) * 0.55 + "em) scaleY(" + (0.6 + 0.4 * o) + ")"
        })
      }

      let wi = 0
      for (const grp of model.groups)
        for (const t of grp) {
          if (t.kind !== "word") continue
          const [s0, s1] = wordWindow(t.seg, t.j, model.segCount[t.seg] || 1, n)
          const r = easeOutCubic(ramp(p, s0, s1))
          const rv = r.toFixed(3)
          write(wordEls.current[wi++], "w", rv, (s) => {
            s.opacity = String(r)
            s.transform = r >= 1 ? "" : "translateY(" + (1 - r) * 0.45 + "em)"
            s.filter = r >= 1 ? "" : "blur(" + (1 - r) * 7 + "px)"
          })
        }
      const eb = easeOutCubic(ramp(p, LOWER[1] - 0.06, LOWER[1] + 0.06))
      write(eyebrowRef.current, "e", eb.toFixed(3), (s) => {
        s.opacity = String(eb)
        s.transform = "translateY(" + (1 - eb) * 0.6 + "em)"
      })

      const root = rootRef.current
      if (root) {
        const settled = p >= SETTLED
        if (settled !== root.hasAttribute("data-settled")) root.toggleAttribute("data-settled", settled)
        if (settled && !done.current) {
          done.current = true
          onComplete?.()
        }
        if (p < 0.5) done.current = false
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [model, n, aspect, onComplete],
  )

  const measure = React.useCallback(() => {
    const stage = stageRef.current
    const sent = sentRef.current
    if (!stage || !sent) return
    const W = stage.clientWidth
    const H = stage.clientHeight
    if (!W || !H) return
    const fs = Math.max(17, Math.min(32, W * 0.017 + 7.5)) * fontScale
    const gutter = W < 640 ? 16 : Math.max(24, W * 0.06)
    sent.style.fontSize = fs + "px"
    const sw = Math.min(W - gutter * 2, fs * 34)
    sent.style.width = sw + "px"
    sent.style.left = (W - sw) / 2 + "px"
    const sh = sent.offsetHeight
    const pad = Math.max(18, H * 0.06)
    const top1 = Math.min(H * 0.8, Math.max(H * split, sh + pad * 2))
    const avail: Rect = { x: 0, y: top1, w: W, h: H - top1 }
    let img1 = placeImage(aspect, avail, bbox, Math.max(10, W * 0.012), true)
    let frame1 = intersect(avail, img1)
    let sentTop = Math.max(pad * 0.6, (frame1.y - sh) / 2)
    if (frame1.h < avail.h - 1) {
      // the picture had to shrink to keep every cut in view (narrow screens):
      // centre sentence and picture together instead of leaving a gap between
      const gap = Math.max(28, pad)
      sentTop = Math.max(pad * 0.6, (H - (sh + gap + img1.h)) / 2)
      const dy = Math.min(H - img1.h, sentTop + sh + gap) - img1.y
      img1 = { ...img1, y: img1.y + dy }
      frame1 = { ...frame1, y: frame1.y + dy }
    }
    sent.style.top = sentTop + "px"
    const frame0: Rect = { x: 0, y: 0, w: W, h: H }
    const img0 = placeImage(aspect, frame0, bbox, 0, false)
    const holes = model.list.map(({ region: [x, y, w, h] }) => ({
      x: img1.x + x * img1.w,
      y: img1.y + y * img1.h,
      w: w * img1.w,
      h: h * img1.h,
    }))
    const sl = sent.offsetLeft
    const st = sent.offsetTop
    const slots = model.list.map((_, i) => {
      const el = slotEls.current[i]
      return el ? { x: sl + el.offsetLeft, y: st + el.offsetTop, w: el.offsetWidth, h: el.offsetHeight } : holes[i]
    })
    const sides = holes.map((h, i) => {
      const d = h.x + h.w / 2 - (slots[i].x + slots[i].w / 2)
      return Math.abs(d) < 8 ? (i % 2 ? 1 : -1) : Math.sign(d)
    })
    geo.current = { W, H, frame0, frame1, img0, img1, holes, slots, sides }
    last.current.clear()
    render(prog.current)
  }, [aspect, bbox, fontScale, model, render, split])

  useIsoLayoutEffect(() => {
    measure()
    const stage = stageRef.current
    if (!stage || typeof ResizeObserver === "undefined") return
    const ro = new ResizeObserver(() => measure())
    ro.observe(stage)
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts
    fonts?.ready.then(() => measure())
    return () => ro.disconnect()
  }, [measure])

  // the pieces' copies of the picture need their crop as soon as it exists
  React.useEffect(() => {
    if (loaded) measure()
  }, [loaded, measure])

  // drive the progress: scrubbed by scroll, played once on view, or parked at the end
  useIsoLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    if (reduced) {
      prog.current = 1
      render(1)
      return
    }
    gsap.registerPlugin(ScrollTrigger)
    const state = { p: prog.current }
    const ctx = gsap.context(() => {
      if (mode === "scroll") {
        gsap.to(state, {
          p: 1,
          ease: "none",
          onUpdate: () => {
            prog.current = state.p
            render(state.p)
          },
          scrollTrigger: { trigger: root, start: "top top", end: "bottom bottom", scrub: 0.65 },
        })
        // first impression: the cuts are traced on the whole picture once, then fade
        const t = { v: 0 }
        gsap
          .timeline({ delay: 1.1 })
          .to(t, { v: 1, duration: 1.1, ease: "power2.inOut" })
          .to(t, { v: 0, duration: 0.8, ease: "power2.in" }, "+=0.9")
          .eventCallback("onUpdate", () => {
            tease.current = t.v
            if (prog.current < 0.06) render(prog.current)
          })
      } else {
        ScrollTrigger.create({
          trigger: root,
          start: "top 60%",
          once: true,
          onEnter: () => {
            player.current = gsap.to(state, {
              p: 1,
              duration: 6.2,
              ease: "power1.inOut",
              delay: 0.5,
              onUpdate: () => {
                prog.current = state.p
                render(state.p)
              },
            })
          },
        })
      }
    }, root)
    return () => {
      ctx.revert()
      player.current?.kill()
    }
  }, [mode, reduced, render])

  const replay = () => {
    const state = { p: prog.current }
    player.current?.kill()
    player.current = gsap
      .timeline()
      .to(state, {
        p: 0.27,
        duration: 1.6,
        ease: "power2.inOut",
        onUpdate: () => {
          prog.current = state.p
          render(state.p)
        },
      })
      .to(state, {
        p: 1,
        duration: 5.2,
        ease: "power1.inOut",
        delay: 0.25,
        onUpdate: () => {
          prog.current = state.p
          render(state.p)
        },
      })
  }

  const hot = (i: number, on: boolean) => {
    pieceEls.current[i]?.classList.toggle("is-hot", on)
    holeEls.current[i]?.classList.toggle("is-hot", on)
  }

  const scrolls = mode === "scroll" && !reduced
  let wordIndex = 0
  let braceIndex = 0
  const fallbackRegionAspect = (p: CutoutPiece) => (p.region[2] * aspect) / Math.max(p.region[3], 1e-6)

  return (
    <section
      ref={rootRef}
      data-cutout=""
      aria-label={sentence.replace(/\s*\{[^{}]*\}/g, "")}
      className={"cs-root " + className}
      style={
        {
          height: scrolls ? "calc(" + height + " * " + (1 + scrollLength) + ")" : height,
          background,
          color: ink,
          fontFamily,
          "--cs-bg": background,
          "--cs-ink": ink,
          "--cs-muted": muted,
          "--cs-font": fontFamily,
        } as React.CSSProperties
      }
    >
      <style>{CSS}</style>
      <div ref={stageRef} className="cs-stage" style={{ height }}>
        <div ref={frameRef} className="cs-frame">
          <div ref={imgBoxRef} style={{ position: "absolute", left: 0, top: 0 }}>
            {url ? (
              <img
                className="cs-img"
                src={url}
                alt={alt}
                draggable={false}
                onLoad={(e) => {
                  const im = e.currentTarget
                  if (im.naturalWidth && im.naturalHeight) setAspect(im.naturalWidth / im.naturalHeight)
                  setLoaded(true)
                }}
                style={{ width: "100%", height: "100%", maxWidth: "none", opacity: loaded ? 1 : 0 }}
              />
            ) : null}
            {model.list.map((pc, i) => (
              <div
                key={pc.id}
                ref={(el) => {
                  holeEls.current[i] = el
                }}
                className="cs-cut cs-hole"
                onPointerEnter={() => hot(i, true)}
                onPointerLeave={() => hot(i, false)}
                style={{
                  left: pc.region[0] * 100 + "%",
                  top: pc.region[1] * 100 + "%",
                  width: pc.region[2] * 100 + "%",
                  height: pc.region[3] * 100 + "%",
                  opacity: 0,
                }}
              >
                <span className="cs-tag">{pc.word}</span>
              </div>
            ))}
            {model.list.map((pc, i) => (
              <div
                key={pc.id + "-s"}
                className="cs-cut"
                aria-hidden="true"
                style={{
                  left: pc.region[0] * 100 + "%",
                  top: pc.region[1] * 100 + "%",
                  width: pc.region[2] * 100 + "%",
                  height: pc.region[3] * 100 + "%",
                  pointerEvents: "none",
                }}
              >
                <svg
                  ref={(el) => {
                    scoreEls.current[i] = el
                  }}
                  className="cs-score"
                  style={{ opacity: 0 }}
                >
                  <rect x="1" y="1" width="calc(100% - 2px)" height="calc(100% - 2px)" pathLength={1} strokeDasharray="1" strokeDashoffset="1" />
                </svg>
              </div>
            ))}
          </div>
        </div>

        <p ref={sentRef} className="cs-sentence">
          {eyebrow ? (
            <span ref={eyebrowRef} className="cs-eyebrow" aria-hidden="true">
              {eyebrow}
            </span>
          ) : null}
          {model.groups.map((grp, gi) => (
            <React.Fragment key={gi}>
              {gi > 0 ? " " : null}
              <span className="cs-g">
                {grp.map((t, ti) => {
                  if (t.kind === "word") {
                    const k = wordIndex++
                    const glue = ti > 0 && grp[ti - 1].kind === "piece"
                    return (
                      <span
                        key={ti}
                        ref={(el) => {
                          wordEls.current[k] = el
                        }}
                        className="cs-w"
                        style={{ opacity: 0, marginLeft: glue && /^[\w(“"']/.test(t.text) ? "0.25em" : undefined }}
                      >
                        {t.text}
                      </span>
                    )
                  }
                  const pc = model.list[t.index]
                  const ar = pc.aspect ?? fallbackRegionAspect(pc)
                  const w = Math.max(0.9, Math.min(4.6, pieceHeight * ar))
                  const bl = braceIndex++
                  const br = braceIndex++
                  return (
                    <span key={ti} aria-hidden="true" style={{ marginLeft: ti > 0 ? "0.28em" : undefined }}>
                      <span
                        ref={(el) => {
                          braceEls.current[bl] = el
                        }}
                        className="cs-brace"
                        style={{ opacity: 0 }}
                      >
                        {"{"}
                      </span>
                      <span
                        ref={(el) => {
                          slotEls.current[t.index] = el
                        }}
                        className="cs-slot"
                        style={{ width: w + "em", height: pieceHeight + "em" }}
                      />
                      <span
                        ref={(el) => {
                          braceEls.current[br] = el
                        }}
                        className="cs-brace"
                        style={{ opacity: 0 }}
                      >
                        {"}"}
                      </span>
                    </span>
                  )
                })}
              </span>
            </React.Fragment>
          ))}
        </p>

        <div className="cs-layer" aria-hidden="true">
          {model.list.map((pc, i) => (
            <div
              key={pc.id}
              ref={(el) => {
                pieceEls.current[i] = el
              }}
              className="cs-piece"
              onPointerEnter={() => hot(i, true)}
              onPointerLeave={() => hot(i, false)}
            >
              <div className="cs-card">
                {url ? (
                  <img
                    ref={(el) => {
                      cardImgs.current[i] = el
                    }}
                    src={url}
                    alt=""
                    draggable={false}
                    style={{ maxWidth: "none" }}
                  />
                ) : null}
              </div>
            </div>
          ))}
        </div>

        {scrolls && hint ? (
          <div ref={hintRef} className="cs-hint" aria-hidden="true">
            <span>{hint}</span>
            <i />
          </div>
        ) : null}

        {mode === "auto" && !reduced ? (
          <button type="button" className="cs-replay" onClick={replay}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 12a9 9 0 1 0 3-6.7" />
              <path d="M3 4v5h5" />
            </svg>
            Replay
          </button>
        ) : null}
      </div>
    </section>
  )
}
