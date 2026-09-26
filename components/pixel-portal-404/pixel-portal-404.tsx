"use client"

import * as React from "react"

// #region pixels
/* Everything the scene is made of, as plain data and pure functions, so the
   test can lift it out and run it. The canvas code below only paints it. */

export type Mask = { w: number; h: number; data: Uint8Array }

export type Layout = {
  px: number
  W: number
  H: number
  cx: number
  archX: number
  archTop: number
  archBottom: number
  leftX: number
  rightX: number
  digitTop: number
  captionY: number
  maxChars: number
}

export type Box = { x: number; y: number; w: number; h: number }

export const ARCH_W = 40
export const ARCH_H = 58
export const BLOCK = 7
export const DIGIT_W = 5 * BLOCK
export const DIGIT_H = 7 * BLOCK
export const GAP = 9
export const ADVANCE = 6
export const LINE_H = 12

/* 5-wide pixel font. Rows are top-down; descenders run to row 8. */
export const FONT: Record<string, string> = {
  A: ".###.|#...#|#...#|#####|#...#|#...#|#...#",
  B: "####.|#...#|#...#|####.|#...#|#...#|####.",
  C: ".###.|#...#|#....|#....|#....|#...#|.###.",
  D: "####.|#...#|#...#|#...#|#...#|#...#|####.",
  E: "#####|#....|#....|####.|#....|#....|#####",
  F: "#####|#....|#....|####.|#....|#....|#....",
  G: ".###.|#...#|#....|#.###|#...#|#...#|.####",
  H: "#...#|#...#|#...#|#####|#...#|#...#|#...#",
  I: ".###.|..#..|..#..|..#..|..#..|..#..|.###.",
  J: "..###|...#.|...#.|...#.|...#.|#..#.|.##..",
  K: "#...#|#..#.|#.#..|##...|#.#..|#..#.|#...#",
  L: "#....|#....|#....|#....|#....|#....|#####",
  M: "#...#|##.##|#.#.#|#.#.#|#...#|#...#|#...#",
  N: "#...#|#...#|##..#|#.#.#|#..##|#...#|#...#",
  O: ".###.|#...#|#...#|#...#|#...#|#...#|.###.",
  P: "####.|#...#|#...#|####.|#....|#....|#....",
  Q: ".###.|#...#|#...#|#...#|#.#.#|#..#.|.##.#",
  R: "####.|#...#|#...#|####.|#.#..|#..#.|#...#",
  S: ".####|#....|#....|.###.|....#|....#|####.",
  T: "#####|..#..|..#..|..#..|..#..|..#..|..#..",
  U: "#...#|#...#|#...#|#...#|#...#|#...#|.###.",
  V: "#...#|#...#|#...#|#...#|#...#|.#.#.|..#..",
  W: "#...#|#...#|#...#|#.#.#|#.#.#|#.#.#|.#.#.",
  X: "#...#|#...#|.#.#.|..#..|.#.#.|#...#|#...#",
  Y: "#...#|#...#|.#.#.|..#..|..#..|..#..|..#..",
  Z: "#####|....#|...#.|..#..|.#...|#....|#####",
  a: ".....|.....|.###.|....#|.####|#...#|.####",
  b: "#....|#....|#.##.|##..#|#...#|#...#|####.",
  c: ".....|.....|.###.|#....|#....|#...#|.###.",
  d: "....#|....#|.##.#|#..##|#...#|#...#|.####",
  e: ".....|.....|.###.|#...#|#####|#....|.###.",
  f: "..##.|.#..#|.#...|###..|.#...|.#...|.#...",
  g: ".....|.....|.####|#...#|#...#|#...#|.####|....#|.###.",
  h: "#....|#....|#.##.|##..#|#...#|#...#|#...#",
  i: "..#..|.....|.##..|..#..|..#..|..#..|.###.",
  j: "...#.|.....|..##.|...#.|...#.|...#.|...#.|#..#.|.##..",
  k: "#....|#....|#..#.|#.#..|##...|#.#..|#..#.",
  l: ".##..|..#..|..#..|..#..|..#..|..#..|.###.",
  m: ".....|.....|##.#.|#.#.#|#.#.#|#...#|#...#",
  n: ".....|.....|#.##.|##..#|#...#|#...#|#...#",
  o: ".....|.....|.###.|#...#|#...#|#...#|.###.",
  p: ".....|.....|####.|#...#|#...#|#...#|####.|#....|#....",
  q: ".....|.....|.####|#...#|#...#|#...#|.####|....#|....#",
  r: ".....|.....|#.##.|##..#|#....|#....|#....",
  s: ".....|.....|.####|#....|.###.|....#|####.",
  t: ".#...|.#...|###..|.#...|.#...|.#..#|..##.",
  u: ".....|.....|#...#|#...#|#...#|#..##|.##.#",
  v: ".....|.....|#...#|#...#|#...#|.#.#.|..#..",
  w: ".....|.....|#...#|#...#|#.#.#|#.#.#|.#.#.",
  x: ".....|.....|#...#|.#.#.|..#..|.#.#.|#...#",
  y: ".....|.....|#...#|#...#|#...#|#...#|.####|....#|.###.",
  z: ".....|.....|#####|...#.|..#..|.#...|#####",
  "0": ".###.|#...#|#..##|#.#.#|##..#|#...#|.###.",
  "1": "..#..|.##..|..#..|..#..|..#..|..#..|.###.",
  "2": ".###.|#...#|....#|...#.|..#..|.#...|#####",
  "3": "#####|...#.|..#..|...#.|....#|#...#|.###.",
  "4": "...#.|..##.|.#.#.|#..#.|#####|...#.|...#.",
  "5": "#####|#....|####.|....#|....#|#...#|.###.",
  "6": "..##.|.#...|#....|####.|#...#|#...#|.###.",
  "7": "#####|....#|...#.|..#..|.#...|.#...|.#...",
  "8": ".###.|#...#|#...#|.###.|#...#|#...#|.###.",
  "9": ".###.|#...#|#...#|.####|....#|...#.|.##..",
  ".": ".....|.....|.....|.....|.....|.....|..#..",
  ",": ".....|.....|.....|.....|.....|..#..|..#..|.#...",
  "!": "..#..|..#..|..#..|..#..|..#..|.....|..#..",
  "?": ".###.|#...#|....#|...#.|..#..|.....|..#..",
  "'": "..#..|..#..|.#...",
  "’": "..#..|..#..|.#...",
  '"': ".#.#.|.#.#.",
  "-": ".....|.....|.....|.###.",
  ":": ".....|..#..|.....|.....|.....|..#..",
  ";": ".....|..#..|.....|.....|.....|..#..|.#...",
  "/": "....#|....#|...#.|..#..|.#...|#....|#....",
  "(": "...#.|..#..|.#...|.#...|.#...|..#..|...#.",
  ")": ".#...|..#..|...#.|...#.|...#.|..#..|.#...",
  "[": ".###.|.#...|.#...|.#...|.#...|.#...|.###.",
  "]": ".###.|...#.|...#.|...#.|...#.|...#.|.###.",
  _: ".....|.....|.....|.....|.....|.....|.....|#####",
  "+": ".....|..#..|..#..|#####|..#..|..#..",
  "=": ".....|.....|#####|.....|#####",
  "<": "...#.|..#..|.#...|#....|.#...|..#..|...#.",
  ">": ".#...|..#..|...#.|....#|...#.|..#..|.#...",
  "#": ".#.#.|.#.#.|#####|.#.#.|#####|.#.#.|.#.#.",
  "&": ".##..|#..#.|#.#..|.#...|#.#.#|#..#.|.##.#",
  "@": ".###.|#...#|#.###|#.#.#|#.###|#....|.###.",
  "*": ".....|..#..|#.#.#|.###.|#.#.#|..#..",
  "%": "##..#|##..#|...#.|..#..|.#...|#..##|#..##",
  "~": ".....|.....|.#...|#.#.#|...#.",
}

/* The big stone numerals: 5×7 blocks, one block per stroke. */
export const BIG: Record<string, string> = {
  "0": "#####|#...#|#...#|#...#|#...#|#...#|#####",
  "1": ".##..|..#..|..#..|..#..|..#..|..#..|.###.",
  "2": "#####|....#|....#|#####|#....|#....|#####",
  "3": "#####|....#|....#|.####|....#|....#|#####",
  "4": "#..#.|#..#.|#..#.|#####|...#.|...#.|...#.",
  "5": "#####|#....|#....|#####|....#|....#|#####",
  "6": "#####|#....|#....|#####|#...#|#...#|#####",
  "7": "#####|....#|....#|....#|....#|....#|....#",
  "8": "#####|#...#|#...#|#####|#...#|#...#|#####",
  "9": "#####|#...#|#...#|#####|....#|....#|#####",
}

export function glyph(ch: string): string[] {
  const g =
    FONT[ch] ?? FONT[ch.toUpperCase()] ?? FONT[ch.toLowerCase()] ?? (ch.trim() ? FONT["?"] : "")
  return g ? g.split("|") : []
}

export function wrapText(text: string, maxChars: number): string[] {
  const out: string[] = []
  const max = Math.max(1, maxChars)
  for (const para of text.split("\n")) {
    let line = ""
    for (const word of para.split(/\s+/).filter(Boolean)) {
      let w = word
      while (w.length > max) {
        if (line) out.push(line)
        line = ""
        out.push(w.slice(0, max))
        w = w.slice(max)
      }
      if (!w) continue
      if (!line) line = w
      else if (line.length + 1 + w.length <= max) line += " " + w
      else {
        out.push(line)
        line = w
      }
    }
    out.push(line)
  }
  return out
}

/* Half-width of a pixel circle's row, for rows -r..r. */
export function circleSpans(r: number): number[] {
  const out: number[] = []
  for (let dy = -r; dy <= r; dy++) {
    out.push(Math.floor(Math.sqrt(Math.max(0, (r + 0.5) * (r + 0.5) - dy * dy))))
  }
  return out
}

/* 0 empty, 1 stone, 2 flute groove, 3 lighter accent. */
export function digitMask(ch: string): Mask {
  const src = BIG[ch] ?? FONT[ch.toUpperCase()] ?? FONT[ch] ?? BIG["4"]
  const rows = src.split("|").slice(0, 7)
  const on = (c: number, r: number) => (rows[r]?.[c] ?? ".") === "#"
  const w = DIGIT_W
  const h = DIGIT_H
  const data = new Uint8Array(w * h)
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 5; c++) {
      if (!on(c, r)) continue
      // A lone block in its row that continues up or down is a column: flute it.
      const fluted = !on(c - 1, r) && !on(c + 1, r) && (on(c, r - 1) || on(c, r + 1))
      for (let oy = 0; oy < BLOCK; oy++) {
        for (let ox = 0; ox < BLOCK; ox++) {
          data[(r * BLOCK + oy) * w + c * BLOCK + ox] = fluted && (ox === 2 || ox === 4) ? 2 : 1
        }
      }
    }
  }
  return { w, h, data }
}

/* The doorway in arch space: x 0..39, y 0..57, circle centre (20, 20). */
export function insideDoor(x: number, y: number): boolean {
  if (x >= 6 && x < 34 && y >= 20 && y < ARCH_H) return true
  return y < 20 && Math.hypot(x + 0.5 - 20, y + 0.5 - 20) < 14
}

/* Arch mask is one pixel wider on every side than the arch, for the capitals
   and keystone: mask (x + 1, y + 1) is arch (x, y). */
export function archMask(): Mask {
  const w = ARCH_W + 2
  const h = ARCH_H + 2
  const data = new Uint8Array(w * h)
  const set = (x: number, y: number, v: number) => {
    if (x >= -1 && y >= -1 && x <= ARCH_W && y <= ARCH_H) data[(y + 1) * w + x + 1] = v
  }
  const joints = [Math.PI / 6, Math.PI / 3, (2 * Math.PI) / 3, (5 * Math.PI) / 6]
  for (let y = 0; y < 20; y++) {
    for (let x = 0; x < ARCH_W; x++) {
      const d = Math.hypot(x + 0.5 - 20, y + 0.5 - 20)
      if (d < 14 || d >= 20) continue
      const a = Math.atan2(20 - (y + 0.5), x + 0.5 - 20)
      set(x, y, joints.some((j) => Math.abs(a - j) * d < 0.6) ? 2 : 1)
    }
  }
  for (const x0 of [0, 34]) {
    for (let y = 20; y < ARCH_H; y++) {
      for (let x = x0; x < x0 + 6; x++) set(x, y, x - x0 === 2 || x - x0 === 4 ? 2 : 1)
    }
    for (const y of [20, 21, 55, 56, 57]) {
      for (let x = x0 - 1; x <= x0 + 6; x++) set(x, y, 1)
    }
  }
  for (let y = -1; y < 6; y++) {
    set(16, y, y < 0 ? 0 : 2)
    set(23, y, y < 0 ? 0 : 2)
    for (let x = 17; x < 23; x++) set(x, y, 3)
  }
  return { w, h, data }
}

/* Palette indices, with a 1px outline ring: 0 clear, 1 outline, 2 shadow,
   3 half shadow, 4 groove, 5 stone, 6 fleck, 7 light, 8 highlight. */
export function shadeMask(m: Mask, seed = 1): Uint8Array {
  const W = m.w + 2
  const H = m.h + 2
  const out = new Uint8Array(W * H)
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= m.w || y >= m.h ? 0 : m.data[y * m.w + x])
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const mx = x - 1
      const my = y - 1
      const v = at(mx, my)
      const i = y * W + x
      if (!v) {
        if (at(mx - 1, my) || at(mx + 1, my) || at(mx, my - 1) || at(mx, my + 1)) out[i] = 1
        continue
      }
      if (!at(mx, my - 1)) out[i] = 8
      else if (!at(mx - 1, my)) out[i] = 7
      else if (!at(mx, my + 1) || !at(mx + 1, my)) out[i] = 2
      else if (v === 2) out[i] = 4
      else if (v === 3) out[i] = 7
      else if (!at(mx + 2, my) || !at(mx, my + 2)) out[i] = 3
      else out[i] = hash2(mx, my, seed) < 0.07 ? 6 : 5
    }
  }
  return out
}

export function layoutScene(w: number, h: number): Layout {
  const px = Math.max(1, Math.floor(Math.min(w / 175, h / 200)))
  const W = Math.max(1, Math.ceil(w / px))
  const H = Math.max(1, Math.ceil(h / px))
  const cx = Math.floor(W / 2)
  const archX = cx - ARCH_W / 2
  const archTop = Math.round(H * 0.42) - 34
  const archBottom = archTop + ARCH_H
  const floor = archBottom + 14
  return {
    px,
    W,
    H,
    cx,
    archX,
    archTop,
    archBottom,
    leftX: archX - GAP - DIGIT_W,
    rightX: archX + ARCH_W + GAP,
    digitTop: archBottom - DIGIT_H,
    captionY: floor + Math.round(Math.max(0, H - floor - 24) * 0.4),
    maxChars: Math.max(4, Math.floor((W - 12) / ADVANCE)),
  }
}

/* Slide a decoration sideways out of the way of the 404 and the caption.
   Null when there is no room for it. */
export function place(x: number, y: number, r: number, W: number, boxes: Box[]): [number, number] | null {
  const hits = (px: number, b: Box) =>
    !(px + r < b.x || px - r > b.x + b.w || y + r < b.y || y - r > b.y + b.h)
  let nx = x
  for (const b of boxes) {
    if (hits(nx, b)) nx = nx < b.x + b.w / 2 ? b.x - r - 3 : b.x + b.w + r + 3
  }
  if (nx < 0 || nx > W || boxes.some((b) => hits(nx, b))) return null
  return [nx, y]
}

export function hash2(x: number, y: number, s: number): number {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1274126177)) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  h ^= h >>> 16
  return (h >>> 0) / 4294967296
}

export function noise(x: number, y: number, s: number): number {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const xf = x - xi
  const yf = y - yi
  const u = xf * xf * (3 - 2 * xf)
  const v = yf * yf * (3 - 2 * yf)
  const a = hash2(xi, yi, s)
  const b = hash2(xi + 1, yi, s)
  const c = hash2(xi, yi + 1, s)
  const d = hash2(xi + 1, yi + 1, s)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}

export function fbm(x: number, y: number, s: number): number {
  let sum = 0
  let amp = 0.5
  let f = 1
  for (let i = 0; i < 4; i++) {
    sum += amp * noise(x * f, y * f, s + i * 17)
    f *= 2
    amp *= 0.5
  }
  return sum / 0.9375
}

export const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16)

export function bayer(x: number, y: number): number {
  return BAYER[(y & 3) * 4 + (x & 3)]
}

export function hexRgb(hex: string): [number, number, number] {
  let h = hex.trim().replace(/^#/, "")
  if (h.length === 3) h = h.split("").map((c) => c + c).join("")
  if (!/^[0-9a-f]{6}$/i.test(h)) return [0, 0, 0]
  const n = parseInt(h, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export function mulberry(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
// #endregion

/* ---------------------------------------------------------------- palette */

const NEBULA = ["#05031a", "#0a0830", "#100d46", "#17135d", "#201a76", "#2b238f"]
const DUST = ["#2c2a7c", "#3a3596", "#4b47b8", "#6461d0"]
const STONE = ["", "#2b2270", "#7b74cc", "#9892dc", "#a5a1e3", "#bebbf1", "#b1adeb", "#dcdafc", "#f6f5ff"]
const TEXT = "#ece9ff"
const TEXT_SHADOW = "#0b0826"
const TWINKLE = ["#ffffff", "#dcd8ff", "#c8a8ff", "#ff8ade", "#8fe6ff", "#fff1a0"]
const TEAL = ["#2fb8d0", "#c4f7ff"]

/* Cloud bank puffs: dx, dy, r, relative to the foot of each piece. */
const DOOR_PUFFS: [number, number, number][] = [
  [-33, 5, 5], [-27, 2, 7], [-18, 0, 9], [-7, -1, 10], [5, -1, 10], [16, 0, 9], [26, 2, 7], [33, 5, 5],
  [-22, 7, 7], [-10, 8, 8], [3, 9, 8], [15, 8, 7], [26, 7, 6],
]
const DIGIT_PUFFS: [number, number, number][] = [
  [-16, 4, 5], [-9, 2, 6], [0, 1, 7], [9, 2, 6], [16, 4, 5], [-5, 6, 6], [6, 6, 5],
]
const GLOWS: [number, number, number][] = [[-14, 3, 3], [-2, 5, 4], [11, 2, 3], [22, 6, 2], [-26, 6, 2]]
const TEAL_DOTS: [number, number, number][] = [[-24, -3, 1], [-13, -8, 2], [15, -8, 1], [25, -2, 2], [30, 1, 1], [-31, 1, 1]]
const DOOR_CLOUDS: { puffs: [number, number, number][]; y: number; speed: number; x0: number }[] = [
  { puffs: [[0, 0, 2], [3, -1, 3], [7, 0, 2]], y: 0.2, speed: 1.4, x0: 4 },
  { puffs: [[0, 0, 3], [4, -2, 4], [9, -1, 3], [12, 0, 2]], y: 0.42, speed: 2.1, x0: 20 },
  { puffs: [[0, 0, 2], [3, -1, 2], [6, 0, 2]], y: 0.6, speed: 1.1, x0: 38 },
  { puffs: [[0, 0, 3], [4, -1, 3], [8, 0, 2]], y: 0.78, speed: 2.6, x0: 12 },
]

type Star = { x: number; y: number; kind: 0 | 1 | 2; size: number; color: string; phase: number; speed: number; depth: number }
type Deco = { sprite: HTMLCanvasElement; x: number; y: number; depth: number; alpha: number; bobA: number; bobS: number; ph: number }
type GalaxyPt = { a: number; r: number; c: string }
type Scene = {
  L: Layout
  bg: HTMLCanvasElement
  stars: Star[]
  decos: Deco[]
  galaxy: { x: number; y: number; pts: GalaxyPt[]; disc: GalaxyPt[] } | null
  arch: HTMLCanvasElement
  left: HTMLCanvasElement
  right: HTMLCanvasElement
  sky: HTMLCanvasElement
  doorMask: HTMLCanvasElement
  door: HTMLCanvasElement
  doorCtx: CanvasRenderingContext2D
  captionBox: Box
}
type Shot = { x: number; y: number; vx: number; vy: number; age: number; life: number }
type Mote = { x: number; y: number; vx: number; vy: number; age: number; life: number; c: string }

const MARGIN = 6

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement("canvas")
  c.width = Math.max(1, w)
  c.height = Math.max(1, h)
  const ctx = c.getContext("2d")!
  ctx.imageSmoothingEnabled = false
  return [c, ctx]
}

function paint(indices: Uint8Array, w: number, h: number, palette: string[]): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(w, h)
  const img = ctx.createImageData(w, h)
  const rgb = palette.map((p) => (p ? hexRgb(p) : null))
  for (let i = 0; i < indices.length; i++) {
    const col = rgb[indices[i]]
    if (!col) continue
    img.data[i * 4] = col[0]
    img.data[i * 4 + 1] = col[1]
    img.data[i * 4 + 2] = col[2]
    img.data[i * 4 + 3] = 255
  }
  ctx.putImageData(img, 0, 0)
  return c
}

function stoneSprite(m: Mask, seed: number) {
  return paint(shadeMask(m, seed), m.w + 2, m.h + 2, STONE)
}

function circle(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, maxY = Infinity) {
  const rr = Math.max(0, Math.round(r))
  const spans = circleSpans(rr)
  const x = Math.round(cx)
  const y = Math.round(cy)
  for (let i = 0; i < spans.length; i++) {
    const row = y - rr + i
    if (row > maxY) break
    ctx.fillRect(x - spans[i], row, spans[i] * 2 + 1, 1)
  }
}

function sparkle(ctx: CanvasRenderingContext2D, x: number, y: number, n: number, arm: string, core = "#ffffff") {
  if (n > 0) {
    ctx.fillStyle = arm
    ctx.fillRect(x - n, y, n * 2 + 1, 1)
    ctx.fillRect(x, y - n, 1, n * 2 + 1)
    if (n > 1) {
      ctx.fillStyle = core
      ctx.globalAlpha *= 0.8
      ctx.fillRect(x - 1, y, 3, 1)
      ctx.fillRect(x, y - 1, 1, 3)
      ctx.globalAlpha /= 0.8
    }
  }
  ctx.fillStyle = core
  ctx.fillRect(x, y, 1, 1)
}

function planetSprite(
  r: number,
  pal: string[],
  speckle: number,
  seed: number,
  ring?: [string, string],
): HTMLCanvasElement {
  const ringRx = ring ? Math.round(r * 1.9) : 0
  const half = Math.max(r, ringRx) + 1
  const size = half * 2 + 1
  const [c, ctx] = makeCanvas(size, size)
  const img = ctx.createImageData(size, size)
  const rgb = pal.map(hexRgb)
  const put = (x: number, y: number, col: [number, number, number]) => {
    const i = ((y + half) * size + x + half) * 4
    img.data[i] = col[0]
    img.data[i + 1] = col[1]
    img.data[i + 2] = col[2]
    img.data[i + 3] = 255
  }
  const R = r + 0.5
  const ringPass = (front: boolean) => {
    if (!ring) return
    const cs = Math.cos(-0.32)
    const sn = Math.sin(-0.32)
    const outer = hexRgb(ring[0])
    const inner = hexRgb(ring[1])
    for (let y = -half; y <= half; y++) {
      for (let x = -half; x <= half; x++) {
        const rx = x * cs - y * sn
        const ry = x * sn + y * cs
        const e = (rx / ringRx) ** 2 + (ry / (ringRx * 0.3)) ** 2
        if (e > 1 || e < 0.55) continue
        if (ry < 0 === front) continue
        if (!front && x * x + y * y <= R * R) continue
        put(x, y, e < 0.78 ? inner : outer)
      }
    }
  }
  ringPass(false)
  for (let y = -r; y <= r; y++) {
    for (let x = -r; x <= r; x++) {
      if (x * x + y * y > R * R) continue
      const nx = x / R
      const ny = y / R
      const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny))
      const l = -0.55 * nx - 0.6 * ny + 0.58 * nz
      let v = Math.min(1, Math.max(0, (l + 0.15) / 1.1))
      v += (noise(x * 0.45 + 9, y * 0.45, seed) - 0.5) * speckle * 1.2
      const n = rgb.length
      const lvl = Math.round(v * (n - 1) + (bayer(x + half, y + half) - 0.5) * 0.8)
      put(x, y, rgb[Math.min(n - 1, Math.max(0, lvl))])
    }
  }
  ringPass(true)
  ctx.putImageData(img, 0, 0)
  return c
}

function buildScene(L: Layout, opts: { seed: number; sky: string[]; left: string; right: string; captions: string[] }): Scene {
  const { W, H, seed } = { ...L, seed: opts.seed }
  const rand = mulberry(seed)

  // Nebula: banded, ordered-dithered fbm, lighter towards the top.
  const BW = W + MARGIN * 2
  const BH = H + MARGIN * 2
  const [bg, bctx] = makeCanvas(BW, BH)
  const img = bctx.createImageData(BW, BH)
  const neb = NEBULA.map(hexRgb)
  const scale = 3 / Math.max(120, H)
  for (let y = 0; y < BH; y++) {
    for (let x = 0; x < BW; x++) {
      const u = x * scale
      const v = y * scale
      const n1 = fbm(u * 1.1, v * 1.1, seed)
      const n2 = fbm(u * 2.7 + 5, v * 2.7, seed + 7)
      const val = 0.66 * n1 + 0.2 * n2 + 0.3 * (1 - y / BH) - 0.14
      const lvl = Math.round(val * 6 - 1.1 + (bayer(x, y) - 0.5))
      const col = neb[Math.min(5, Math.max(0, lvl))]
      const i = (y * BW + x) * 4
      img.data[i] = col[0]
      img.data[i + 1] = col[1]
      img.data[i + 2] = col[2]
      img.data[i + 3] = 255
    }
  }
  const dust = DUST.map(hexRgb)
  const dustCount = Math.round((BW * BH) / 55)
  for (let k = 0; k < dustCount; k++) {
    const x = Math.floor(rand() * BW)
    const y = Math.floor(rand() * BH)
    const col = dust[Math.floor(rand() * dust.length)]
    const i = (y * BW + x) * 4
    img.data[i] = col[0]
    img.data[i + 1] = col[1]
    img.data[i + 2] = col[2]
  }
  bctx.putImageData(img, 0, 0)

  // Keep-out boxes: the 404 group and the widest caption.
  const group: Box = {
    x: L.leftX - 6,
    y: L.archTop - 6,
    w: L.rightX + DIGIT_W + 12 - L.leftX,
    h: L.archBottom + 20 - L.archTop,
  }
  const lines = opts.captions.map((c) => wrapText(c, L.maxChars))
  const capChars = Math.max(1, ...lines.flat().map((l) => l.length))
  const capLines = Math.max(1, ...lines.map((l) => l.length))
  const capW = capChars * ADVANCE
  const captionBox: Box = { x: L.cx - capW / 2 - 4, y: L.captionY - 4, w: capW + 8, h: capLines * LINE_H + 8 }
  const keep = [group, captionBox]

  // Twinkling stars.
  const stars: Star[] = []
  const starCount = Math.round((W * H) / 240)
  for (let k = 0; k < starCount; k++) {
    const sx = Math.floor(rand() * (W + 8)) - 4
    const sy = Math.floor(rand() * (H + 8)) - 4
    const roll = rand()
    const kind: 0 | 1 | 2 = roll < 0.6 ? 0 : roll < 0.92 ? 1 : 2
    const sizeRoll = rand()
    stars.push({
      x: sx,
      y: sy,
      kind,
      size: kind === 1 ? (sizeRoll < 0.7 ? 1 : sizeRoll < 0.95 ? 2 : 3) : 1,
      color:
        kind === 2
          ? rand() < 0.55 ? "#ff7ad9" : "#7ae0ff"
          : TWINKLE[Math.floor(Math.pow(rand(), 1.6) * TWINKLE.length)],
      phase: rand() * Math.PI * 2,
      speed: 0.6 + rand() * 2.2,
      depth: 1 + Math.floor(rand() * 2),
    })
  }
  // Nothing twinkles on top of the words.
  const clear = { x: captionBox.x - 4, y: captionBox.y - 4, w: captionBox.w + 8, h: captionBox.h + 8 }
  const readable = stars.filter((s) => s.x < clear.x || s.x > clear.x + clear.w || s.y < clear.y || s.y > clear.y + clear.h)


  const decos: Deco[] = []
  const add = (fx: number, fy: number, sprite: HTMLCanvasElement, depth: number, alpha = 1) => {
    const r = sprite.width / 2
    const at = place(Math.round(fx * W), Math.round(fy * H), r, W, keep)
    if (!at) return
    decos.push({ sprite, x: at[0], y: at[1], depth, alpha, bobA: 0.6 + rand() * 1.2, bobS: 0.3 + rand() * 0.5, ph: rand() * 6.28 })
  }
  const ORB = ["#5a1a8c", "#8a2cb8", "#b340cf", "#d970e6"]
  const ORB_PINK = ["#7a1466", "#b0268c", "#d63fae", "#f07ad0"]
  // Translucent bubbles first, so planets sit in front of them.
  const orbs: [number, number, number, string[]][] = [
    [0.075, 0.235, 8, ORB], [0.125, 0.25, 6, ORB_PINK], [0.105, 0.68, 7, ORB], [0.2, 0.685, 5, ORB_PINK],
    [0.36, 0.12, 4, ORB], [0.635, 0.05, 4, ORB], [0.465, 0.07, 2, ORB_PINK], [0.7, 0.575, 4, ORB],
    [0.83, 0.375, 4, ORB_PINK], [0.29, 0.66, 3, ORB], [0.055, 0.52, 3, ORB_PINK], [0.575, 0.84, 2, ORB],
    [0.915, 0.62, 2, ORB], [0.4, 0.94, 3, ORB_PINK], [0.955, 0.2, 3, ORB], [0.27, 0.37, 2, ORB],
  ]
  for (const [fx, fy, r, pal] of orbs) add(fx, fy, planetSprite(r, pal, 0.25, seed + r), 3, 0.62)
  add(0.17, 0.16, planetSprite(11, ["#0d1a44", "#1a3470", "#2a5b9c", "#4d8cc8", "#7fb6e0"], 0.9, seed + 1), 4)
  add(0.755, 0.12, planetSprite(5, ["#15152a", "#26263f", "#3b3b58", "#5e5e80"], 0.7, seed + 2), 3)
  add(0.785, 0.335, planetSprite(6, ["#1f2670", "#3246a6", "#4f70d2", "#86a8f0"], 0.3, seed + 3, ["#6a38c8", "#a77aff"]), 4)
  add(0.225, 0.865, planetSprite(7, ["#343f3d", "#56645f", "#7d8d85", "#aebcb0"], 0.9, seed + 4), 5)
  add(0.855, 0.72, planetSprite(7, ["#6e0c3e", "#b01a5c", "#e0357a", "#ff7eaa"], 0.35, seed + 5), 5)

  // The spiral galaxy.
  let galaxy: Scene["galaxy"] = null
  const gAt = place(Math.round(0.745 * W), Math.round(0.84 * H), 16, W, keep)
  if (gAt) {
    const pts: GalaxyPt[] = []
    const ramp = ["#ffffff", "#ffc2f2", "#ff6fe0", "#d63ad6", "#9b2fd6", "#5d25b0"]
    for (let k = 0; k < 190; k++) {
      const t = Math.pow(rand(), 1.25)
      const arm = k % 2
      pts.push({
        a: arm * Math.PI + t * 4.4 + (rand() - 0.5) * 0.55,
        r: 1.5 + t * 16 + (rand() - 0.5) * 1.6,
        c: ramp[Math.min(ramp.length - 1, Math.floor(t * ramp.length + rand() * 0.8))],
      })
    }
    // A filled, tilted disc under the arms, hot in the middle.
    const disc: GalaxyPt[] = []
    const discRamp = ["#ff8fe8", "#e44fd8", "#b634d0", "#7f28c0", "#5220a0"]
    for (let y = -6; y <= 6; y++) {
      for (let x = -11; x <= 11; x++) {
        const rx = x * Math.cos(0.3) + y * Math.sin(0.3)
        const ry = -x * Math.sin(0.3) + y * Math.cos(0.3)
        const e = Math.sqrt((rx / 10.5) ** 2 + (ry / 4.4) ** 2)
        if (e > 1) continue
        const lvl = Math.min(discRamp.length - 1, Math.floor(e * discRamp.length + bayer(x + 12, y + 8) - 0.5))
        if (e > 0.75 && bayer(x + 12, y + 8) > 1.9 - e * 1.6) continue
        disc.push({ a: x, r: y, c: discRamp[Math.max(0, lvl)] })
      }
    }
    galaxy = { x: gAt[0], y: gAt[1], pts, disc }
  }

  // Stone.
  const arch = stoneSprite(archMask(), seed)
  const left = stoneSprite(digitMask(opts.left), seed + 11)
  const right = stoneSprite(digitMask(opts.right), seed + 12)

  // The sky through the door, and the door-shaped mask it is cut with.
  const DW = 28
  const DH = ARCH_H - 6
  const [sky, sctx] = makeCanvas(DW, DH)
  const simg = sctx.createImageData(DW, DH)
  const [top, bottom] = [hexRgb(opts.sky[0] ?? "#2a55c9"), hexRgb(opts.sky[1] ?? "#79acf7")]
  const bands = 5
  for (let y = 0; y < DH; y++) {
    for (let x = 0; x < DW; x++) {
      const lvl = Math.min(bands - 1, Math.max(0, Math.round((y / (DH - 1)) * (bands - 1) + bayer(x, y) - 0.5)))
      const k = lvl / (bands - 1)
      const i = (y * DW + x) * 4
      simg.data[i] = top[0] + (bottom[0] - top[0]) * k
      simg.data[i + 1] = top[1] + (bottom[1] - top[1]) * k
      simg.data[i + 2] = top[2] + (bottom[2] - top[2]) * k
      simg.data[i + 3] = 255
    }
  }
  sctx.putImageData(simg, 0, 0)
  const [doorMask, mctx] = makeCanvas(DW, DH)
  mctx.fillStyle = "#000"
  for (let y = 0; y < DH; y++) {
    for (let x = 0; x < DW; x++) if (insideDoor(x + 6, y + 6)) mctx.fillRect(x, y, 1, 1)
  }
  const [door, doorCtx] = makeCanvas(DW, DH)

  return { L, bg, stars: readable, decos, galaxy, arch, left, right, sky, doorMask, door, doorCtx, captionBox }
}

export type PixelPortal404Props = {
  /** The line typed under the 404. */
  caption?: string
  /** Typed instead while the door is hovered or focused. Empty keeps the caption. */
  hoverCaption?: string
  /** Where the door leads. Used when there is no `onEnter`. */
  href?: string
  /** Called once the fly-through finishes, instead of navigating to `href`. */
  onEnter?: () => void
  /** Accessible name of the door link. */
  linkLabel?: string
  /** The stone numerals either side of the door. Any digit, or a letter. */
  leftDigit?: string
  rightDigit?: string
  /** Sky through the door, top then bottom, hex. */
  skyColors?: [string, string]
  /** Cloud bank, dark → hot: [shadow, body, light, glow, core], hex. */
  cloudColors?: [string, string, string, string, string]
  /** Star field, planets and galaxy placement. */
  seed?: number
  /** Length of the fly-through, ms. */
  enterMs?: number
  /** Must be a definite length. */
  height?: string
  className?: string
}

export default function PixelPortal404({
  caption = "Are you ready to come back?",
  hoverCaption = "Step through the door.",
  href = "/",
  onEnter,
  linkLabel = "Go back to the home page",
  leftDigit = "4",
  rightDigit = "4",
  skyColors = ["#2a55c9", "#79acf7"],
  cloudColors = ["#3d10a8", "#6a22e6", "#8f45ff", "#b681ff", "#efdcff"],
  seed = 404,
  enterMs = 1400,
  height = "100svh",
  className = "",
}: PixelPortal404Props) {
  const rootRef = React.useRef<HTMLElement>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const hoverRef = React.useRef(false)
  const enterRef = React.useRef(0)
  const timers = React.useRef<number[]>([])
  const api = React.useRef<{ shoot: (x: number, y: number) => void; poke: () => void } | null>(null)
  const [box, setBox] = React.useState<{ l: number; t: number; w: number; h: number; ox: number; oy: number; zoom: number } | null>(null)
  const [entering, setEntering] = React.useState(false)

  const live = React.useRef({ caption, hoverCaption, href, onEnter, enterMs, cloudColors, skyColors })
  live.current = { caption, hoverCaption, href, onEnter, enterMs, cloudColors, skyColors }

  const skyKey = skyColors.join(",")
  const captionKey = caption + "\u0000" + hoverCaption

  React.useEffect(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    if (!root || !canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
    const rand = mulberry(seed ^ 0x9e37)
    const t0 = performance.now()
    let scene: Scene | null = null
    let raf = 0
    let onscreen = true
    const sim = {
      px: 0, py: 0, tx: 0, ty: 0, hover: 0, last: 0, nextShot: 2.5,
      shots: [] as Shot[], motes: [] as Mote[], moteAcc: 0,
      capText: "", capStart: 0,
    }

    const rebuild = () => {
      const w = root.clientWidth
      const h = root.clientHeight
      if (!w || !h) return
      const L = layoutScene(w, h)
      const same = scene && scene.L.W === L.W && scene.L.H === L.H && scene.L.px === L.px
      if (!same) {
        scene = buildScene(L, {
          seed,
          sky: skyKey.split(","),
          left: leftDigit.slice(0, 1) || "4",
          right: rightDigit.slice(0, 1) || "4",
          captions: captionKey.split("\u0000").filter(Boolean),
        })
        canvas.width = L.W
        canvas.height = L.H
        ctx.imageSmoothingEnabled = false
      }
      const cw = L.W * L.px
      const ch = L.H * L.px
      const left = Math.floor((w - cw) / 2)
      canvas.style.width = cw + "px"
      canvas.style.height = ch + "px"
      canvas.style.left = left + "px"
      const ox = left + (L.archX + 20) * L.px
      const oy = (L.archTop + 30) * L.px
      setBox({
        l: left + (L.archX - 3) * L.px,
        t: (L.archTop - 3) * L.px,
        w: (ARCH_W + 6) * L.px,
        h: (ARCH_H + 8) * L.px,
        ox,
        oy,
        zoom: Math.ceil((Math.max(w, h) / (18 * L.px)) * 1.4),
      })
      draw(performance.now())
    }

    const drawText = (text: string, x: number, y: number, color: string) => {
      ctx.fillStyle = color
      for (let k = 0; k < text.length; k++) {
        const rows = glyph(text[k])
        for (let r = 0; r < rows.length; r++) {
          const row = rows[r]
          for (let c = 0; c < row.length; c++) if (row[c] === "#") ctx.fillRect(x + k * ADVANCE + c, y + r, 1, 1)
        }
      }
    }

    const draw = (now: number) => {
      const S = scene
      if (!S) return
      const L = S.L
      const P = live.current
      const still = reduced.matches
      const t = still ? 0 : (now - t0) / 1000
      const dt = sim.last ? Math.min(0.05, (now - sim.last) / 1000) : 0.016
      sim.last = now
      const k = still ? 1 : 0.06
      sim.px += ((still ? 0 : sim.tx) - sim.px) * k
      sim.py += ((still ? 0 : sim.ty) - sim.py) * k
      sim.hover += ((hoverRef.current ? 1 : 0) - sim.hover) * (still ? 1 : 0.12)
      const enter = enterRef.current ? Math.min(1, (now - enterRef.current) / P.enterMs) : 0
      const hover = Math.max(sim.hover, enter)
      const off = (d: number): [number, number] => [Math.round(-sim.px * d), Math.round(-sim.py * d)]
      const [cDark, cBody, cLight, cGlow, cCore] = P.cloudColors

      ctx.globalCompositeOperation = "source-over"
      ctx.globalAlpha = 1
      {
        const [ox, oy] = off(1.5)
        ctx.drawImage(S.bg, -MARGIN + ox, -MARGIN + oy)
      }

      // Stars.
      for (const s of S.stars) {
        const [ox, oy] = off(s.depth * 1.5)
        const x = s.x + ox
        const y = s.y + oy
        const tw = still ? 0.7 : 0.5 + 0.5 * Math.sin(t * s.speed + s.phase)
        if (s.kind === 0) {
          ctx.globalAlpha = 0.3 + 0.7 * tw * tw
          ctx.fillStyle = s.color
          ctx.fillRect(x, y, 1, 1)
        } else if (s.kind === 1) {
          ctx.globalAlpha = 0.55 + 0.45 * tw
          sparkle(ctx, x, y, Math.round(s.size * tw), s.color)
        } else {
          ctx.globalAlpha = 0.4 + 0.6 * tw
          ctx.fillStyle = s.color
          ctx.fillRect(x - 1, y - 1, 1, 1)
          ctx.fillRect(x + 1, y - 1, 1, 1)
          ctx.fillRect(x - 1, y + 1, 1, 1)
          ctx.fillRect(x + 1, y + 1, 1, 1)
          ctx.fillStyle = "#ffffff"
          ctx.fillRect(x, y, 1, 1)
        }
      }
      ctx.globalAlpha = 1

      // Planets and bubbles.
      for (const d of S.decos) {
        const [ox, oy] = off(d.depth)
        const bob = still ? 0 : Math.round(Math.sin(t * d.bobS + d.ph) * d.bobA)
        ctx.globalAlpha = d.alpha
        ctx.drawImage(d.sprite, Math.round(d.x - d.sprite.width / 2) + ox, Math.round(d.y - d.sprite.height / 2) + oy + bob)
      }
      ctx.globalAlpha = 1

      // Galaxy.
      if (S.galaxy) {
        const [ox, oy] = off(4)
        const gx = S.galaxy.x + ox
        const gy = S.galaxy.y + oy
        ctx.globalCompositeOperation = "lighter"
        const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, 20)
        g.addColorStop(0, "rgba(255,90,220,0.55)")
        g.addColorStop(0.45, "rgba(170,50,220,0.2)")
        g.addColorStop(1, "rgba(0,0,0,0)")
        ctx.fillStyle = g
        ctx.fillRect(gx - 20, gy - 20, 40, 40)
        ctx.globalCompositeOperation = "source-over"
        for (const p of S.galaxy.disc) {
          ctx.fillStyle = p.c
          ctx.fillRect(gx + p.a, gy + p.r, 1, 1)
        }
        const rot = t * 0.12
        const tilt = -0.3
        const ct = Math.cos(tilt)
        const st = Math.sin(tilt)
        for (const p of S.galaxy.pts) {
          const a = p.a + rot
          const x = Math.cos(a) * p.r
          const y = Math.sin(a) * p.r * 0.42
          ctx.fillStyle = p.c
          ctx.fillRect(Math.round(gx + x * ct - y * st), Math.round(gy + x * st + y * ct), 1, 1)
        }
        ctx.fillStyle = "#d63ad6"
        circle(ctx, gx, gy, 3)
        ctx.fillStyle = "#ff9ff0"
        circle(ctx, gx, gy, 2)
        const flare = still ? 3 : 3 + Math.round(1.5 + 1.5 * Math.sin(t * 2.1))
        sparkle(ctx, gx, gy, flare, "#ffb3f2")
      }

      // Shooting stars.
      if (!still) {
        sim.nextShot -= dt
        if (sim.nextShot <= 0) {
          sim.nextShot = 5 + rand() * 7
          shoot(rand() * L.W * 0.8 + L.W * 0.2, rand() * L.H * 0.35)
        }
        sim.shots = sim.shots.filter((s) => (s.age += dt) < s.life)
        for (const s of sim.shots) {
          s.x += s.vx * dt
          s.y += s.vy * dt
          const fade = 1 - s.age / s.life
          const len = 12
          const sp = Math.hypot(s.vx, s.vy)
          for (let i = len; i >= 0; i--) {
            ctx.globalAlpha = fade * (1 - i / len)
            ctx.fillStyle = i < 2 ? "#ffffff" : i < 5 ? "#d9ccff" : "#9d86ff"
            ctx.fillRect(Math.round(s.x - (s.vx / sp) * i), Math.round(s.y - (s.vy / sp) * i), 1, 1)
          }
        }
        ctx.globalAlpha = 1
      }

      // The 404.
      const [gx, gy] = off(0.8)
      const bobDoor = still ? 0 : Math.round(Math.sin(t * 0.9) * 1.2)
      const bobL = still ? 0 : Math.round(Math.sin(t * 0.9 + 1.4) * 1.2)
      const bobR = still ? 0 : Math.round(Math.sin(t * 0.9 + 2.6) * 1.2)
      const ax = L.archX + gx
      const ay = L.archTop + gy + bobDoor
      const foot = L.archBottom + gy
      const doorCx = ax + 20
      const pulse = still ? 0.5 : 0.5 + 0.5 * Math.sin(t * 1.7)

      // Glow behind everything in the group.
      ctx.globalCompositeOperation = "lighter"
      {
        const [r0, g0, b0] = hexRgb(cBody)
        ctx.save()
        ctx.translate(doorCx, foot + 2)
        ctx.scale(2.1, 1)
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 34)
        g.addColorStop(0, `rgba(${r0},${g0},${b0},${0.62 + 0.12 * pulse + 0.25 * hover})`)
        g.addColorStop(0.5, `rgba(${r0},${g0},${b0},${0.22 + 0.1 * hover})`)
        g.addColorStop(1, "rgba(0,0,0,0)")
        ctx.fillStyle = g
        ctx.fillRect(-34, -34, 68, 68)
        ctx.restore()
        if (hover > 0.01) {
          const [r1, g1, b1] = hexRgb(P.skyColors[1] ?? "#79acf7")
          const g2 = ctx.createRadialGradient(doorCx, ay + 30, 4, doorCx, ay + 30, 46)
          g2.addColorStop(0, `rgba(${r1},${g1},${b1},${0.32 * hover})`)
          g2.addColorStop(1, "rgba(0,0,0,0)")
          ctx.fillStyle = g2
          ctx.fillRect(doorCx - 46, ay - 16, 92, 92)
        }
      }
      ctx.globalCompositeOperation = "source-over"

      ctx.drawImage(S.left, L.leftX - 1 + gx, L.digitTop - 1 + gy + bobL)
      ctx.drawImage(S.right, L.rightX - 1 + gx, L.digitTop - 1 + gy + bobR)

      // Sky through the door.
      {
        const d = S.doorCtx
        d.globalCompositeOperation = "source-over"
        d.globalAlpha = 1
        d.drawImage(S.sky, 0, 0)
        const DW = S.door.width
        const DH = S.door.height
        for (const c of DOOR_CLOUDS) {
          const span = DW + 30
          const x = (((c.x0 + t * c.speed) % span) + span) % span - 15
          const y = Math.round(c.y * DH)
          d.fillStyle = "#a9c6f7"
          for (const [dx, dy, r] of c.puffs) circle(d, x + dx + 1, y + dy + 1, r, y + 1)
          d.fillStyle = "#ffffff"
          for (const [dx, dy, r] of c.puffs) circle(d, x + dx, y + dy, r, y)
        }
        if (hover > 0.01) {
          d.globalCompositeOperation = "lighter"
          d.fillStyle = `rgba(200,225,255,${0.2 * hover + 0.5 * enter})`
          d.fillRect(0, 0, DW, DH)
        }
        d.globalCompositeOperation = "destination-in"
        d.drawImage(S.doorMask, 0, 0)
        d.globalCompositeOperation = "source-over"
        ctx.drawImage(S.door, ax + 6, ay + 6)
      }
      ctx.drawImage(S.arch, ax - 2, ay - 2)

      // Cloud bank: every puff of every piece, one tone at a time, so the
      // three clouds read as one.
      const puffs: [number, number, number, number][] = []
      const pushPuffs = (list: [number, number, number][], cx: number, cy: number, ph: number) => {
        list.forEach(([dx, dy, r], i) => {
          const b = still ? 0 : Math.round(Math.sin(t * 1.3 + i * 1.7 + ph) * 0.8)
          puffs.push([cx + dx, cy + dy + b, r, i])
        })
      }
      pushPuffs(DIGIT_PUFFS, L.leftX + gx + 17, foot + 2, 0.6)
      pushPuffs(DIGIT_PUFFS, L.rightX + gx + 17, foot + 2, 2.2)
      pushPuffs(DOOR_PUFFS, doorCx, foot + 3, 0)
      // Neon rim: the bank bleeds light into the space around it.
      {
        const [r0, g0, b0] = hexRgb(cGlow)
        ctx.globalCompositeOperation = "lighter"
        ctx.fillStyle = `rgba(${r0},${g0},${b0},${0.1 + 0.05 * pulse + 0.06 * hover})`
        for (const [x, y, r] of puffs) circle(ctx, x, y, r + 3)
        ctx.fillStyle = `rgba(${r0},${g0},${b0},0.12)`
        for (const [x, y, r] of puffs) circle(ctx, x, y, r + 1)
        ctx.globalCompositeOperation = "source-over"
      }
      ctx.fillStyle = cDark
      for (const [x, y, r] of puffs) circle(ctx, x, y, r)
      ctx.fillStyle = cBody
      for (const [x, y, r] of puffs) circle(ctx, x - 1, y - 1, r - 2)
      ctx.fillStyle = cLight
      for (const [x, y, r] of puffs) if (r >= 6) circle(ctx, x - 2, y - 2, Math.round(r * 0.5))
      for (const [dx, dy, r] of GLOWS) {
        const x = doorCx + dx
        const y = foot + 3 + dy
        ctx.fillStyle = cGlow
        circle(ctx, x, y, r + (pulse > 0.7 ? 1 : 0))
        ctx.fillStyle = cCore
        circle(ctx, x - 1, y - 1, Math.max(0, r - 2))
      }
      // Bloom over the bright hearts of the cloud.
      {
        const [r0, g0, b0] = hexRgb(cCore)
        ctx.globalCompositeOperation = "lighter"
        for (const [dx, dy, r] of GLOWS) {
          const x = doorCx + dx
          const y = foot + 3 + dy
          const rad = r * 3.2 + 2
          const g = ctx.createRadialGradient(x, y, 0, x, y, rad)
          g.addColorStop(0, `rgba(${r0},${g0},${b0},${0.3 + 0.12 * pulse + 0.15 * hover})`)
          g.addColorStop(1, "rgba(0,0,0,0)")
          ctx.fillStyle = g
          ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2)
        }
        ctx.globalCompositeOperation = "source-over"
      }
      for (const [dx, dy, r] of TEAL_DOTS) {
        const x = doorCx + dx
        const y = foot + dy + bobDoor
        ctx.fillStyle = TEAL[0]
        circle(ctx, x, y, r)
        ctx.fillStyle = TEAL[1]
        ctx.fillRect(x - (r > 1 ? 1 : 0), y - (r > 1 ? 1 : 0), 1, 1)
      }
      const glints: [number, number, number][] = [[-9, 6, 0], [13, 9, 1.3], [-21, 9, 2.1], [3, 13, 3.3], [-40, 4, 4.1], [42, 6, 5]]
      for (const [dx, dy, ph] of glints) {
        const n = still ? 1 : Math.round(1 + Math.sin(t * 2.4 + ph) * 1.2)
        if (n >= 0) sparkle(ctx, doorCx + dx, foot + dy, n, cCore)
      }

      // Motes rising off the cloud; drawn into the door while it is hovered.
      if (!still) {
        sim.moteAcc += dt * (3 + hover * 22)
        while (sim.moteAcc > 1 && sim.motes.length < 90) {
          sim.moteAcc -= 1
          sim.motes.push({
            x: L.archX + 20 + (rand() - 0.5) * 76,
            y: L.archBottom - 2 + rand() * 6,
            vx: (rand() - 0.5) * 3,
            vy: -(5 + rand() * 8),
            age: 0,
            life: 1.8 + rand() * 1.6,
            c: [cGlow, cCore, TEAL[1], "#ffffff"][Math.floor(rand() * 4)],
          })
        }
        sim.moteAcc = Math.min(sim.moteAcc, 1)
        const pcx = L.archX + 20
        const pcy = L.archTop + 32
        sim.motes = sim.motes.filter((m) => (m.age += dt) < m.life)
        for (const m of sim.motes) {
          if (hover > 0.05) {
            m.vx += (pcx - m.x) * 1.6 * hover * dt
            m.vy += (pcy - m.y) * 1.6 * hover * dt
          }
          m.x += m.vx * dt
          m.y += m.vy * dt
          ctx.globalAlpha = Math.sin((m.age / m.life) * Math.PI)
          ctx.fillStyle = m.c
          ctx.fillRect(Math.round(m.x + gx), Math.round(m.y + gy), 1, 1)
        }
        ctx.globalAlpha = 1
      }

      // Caption, typed.
      const target = hover > 0.5 && P.hoverCaption ? P.hoverCaption : P.caption
      if (target !== sim.capText) {
        sim.capText = target
        sim.capStart = t
      }
      const lines = wrapText(target, L.maxChars)
      const total = lines.reduce((n, l) => n + l.length, 0)
      const perChar = target === P.caption ? 0.055 : 0.03
      let typed = still ? total : Math.floor((t - sim.capStart) / perChar)
      const [tx, ty] = off(0.8)
      let cursor: [number, number] = [L.cx, L.captionY]
      for (let li = 0; li < lines.length; li++) {
        const line = lines[li]
        const x0 = L.cx - Math.floor((line.length * ADVANCE - 1) / 2) + tx
        const y0 = L.captionY + li * LINE_H + ty
        const shown = line.slice(0, Math.max(0, typed))
        drawText(shown, x0 + 1, y0 + 1, TEXT_SHADOW)
        drawText(shown, x0, y0, TEXT)
        if (typed >= 0) cursor = [x0 + shown.length * ADVANCE, y0]
        typed -= line.length
      }
      if (!still && (typed < 0 || Math.floor(t * 1.9) % 2 === 0)) {
        const [cx0, cy0] = cursor
        ctx.fillStyle = TEXT_SHADOW
        ctx.fillRect(cx0 + 1, cy0 + 8, 5, 1)
        ctx.fillStyle = TEXT
        ctx.fillRect(cx0, cy0 + 7, 5, 1)
      }
    }

    const shoot = (x: number, y: number) => {
      const sp = 70 + rand() * 50
      const ang = Math.PI * (0.78 + rand() * 0.08)
      sim.shots.push({ x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp * 0.6 + sp * 0.2, age: 0, life: 1 + rand() * 0.5 })
    }

    const frame = (now: number) => {
      raf = 0
      draw(now)
      schedule()
    }
    const schedule = () => {
      if (raf || reduced.matches || document.hidden || !onscreen) return
      raf = requestAnimationFrame(frame)
    }
    const stop = () => {
      if (raf) cancelAnimationFrame(raf)
      raf = 0
    }
    const wake = () => {
      sim.last = 0
      if (reduced.matches) draw(performance.now())
      else schedule()
    }

    api.current = {
      shoot: (cx, cy) => {
        const S = scene
        if (!S || reduced.matches) return
        const r = canvas.getBoundingClientRect()
        const x = ((cx - r.left) / r.width) * S.L.W
        const y = ((cy - r.top) / r.height) * S.L.H
        shoot(x + 6, y - 3)
      },
      poke: () => {
        if (reduced.matches) draw(performance.now())
      },
    }

    const onMove = (e: PointerEvent) => {
      const r = root.getBoundingClientRect()
      if (!r.width || !r.height) return
      sim.tx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1))
      sim.ty = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1))
    }
    const onVis = () => (document.hidden ? stop() : wake())
    const onMotion = () => {
      stop()
      wake()
    }

    const ro = new ResizeObserver(rebuild)
    ro.observe(root)
    const io = new IntersectionObserver(([e]) => {
      onscreen = e.isIntersecting
      if (onscreen) wake()
      else stop()
    })
    io.observe(root)
    window.addEventListener("pointermove", onMove, { passive: true })
    document.addEventListener("visibilitychange", onVis)
    reduced.addEventListener("change", onMotion)
    rebuild()
    wake()

    return () => {
      stop()
      ro.disconnect()
      io.disconnect()
      window.removeEventListener("pointermove", onMove)
      document.removeEventListener("visibilitychange", onVis)
      reduced.removeEventListener("change", onMotion)
      api.current = null
    }
  }, [seed, skyKey, leftDigit, rightDigit, captionKey])

  React.useEffect(() => () => timers.current.forEach((id) => clearTimeout(id)), [])

  const setHover = (on: boolean) => {
    hoverRef.current = on
    api.current?.poke()
  }

  const finish = () => {
    const { onEnter: cb, href: to } = live.current
    if (cb) {
      cb()
      // Still mounted (the handler did not navigate): come back out of the door.
      timers.current.push(
        window.setTimeout(() => {
          enterRef.current = 0
          setEntering(false)
        }, 700),
      )
    } else {
      window.location.assign(to)
    }
  }

  const onDoorClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.stopPropagation()
    // Let the browser handle new-tab and download clicks itself.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
    e.preventDefault()
    if (enterRef.current) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finish()
      return
    }
    enterRef.current = performance.now()
    setEntering(true)
    timers.current.push(window.setTimeout(finish, enterMs))
  }

  const [skyTop, skyBottom] = skyColors

  return (
    <section
      ref={rootRef}
      className={"relative w-full overflow-hidden select-none " + className}
      style={{ height, background: NEBULA[1] }}
      onClick={(e) => api.current?.shoot(e.clientX, e.clientY)}
    >
      <h1 className="sr-only">{`${leftDigit}0${rightDigit}: page not found`}</h1>
      <p className="sr-only">{caption}</p>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          transformOrigin: box ? `${box.ox}px ${box.oy}px` : "50% 42%",
          transform: entering && box ? `scale(${box.zoom})` : "scale(1)",
          transition: entering ? `transform ${enterMs}ms cubic-bezier(0.7, 0, 0.84, 0)` : "none",
          willChange: "transform",
        }}
      >
        <canvas
          ref={canvasRef}
          className="absolute top-0 block"
          style={{ imageRendering: "pixelated", maxWidth: "none" }}
        />
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          opacity: entering ? 1 : 0,
          transition: entering
            ? `opacity ${Math.round(enterMs * 0.4)}ms ease-in ${Math.round(enterMs * 0.6)}ms`
            : "opacity 600ms ease-out",
          background: `linear-gradient(180deg, ${skyTop} 0%, ${skyBottom} 70%, #ffffff 100%)`,
        }}
      />

      {box && (
        <a
          href={href}
          aria-label={linkLabel}
          onClick={onDoorClick}
          onPointerEnter={() => setHover(true)}
          onPointerLeave={() => setHover(false)}
          onFocus={() => setHover(true)}
          onBlur={() => setHover(false)}
          className="absolute rounded-t-full outline-none focus-visible:ring-2 focus-visible:ring-offset-0"
          style={{
            left: box.l,
            top: box.t,
            width: box.w,
            height: box.h,
            cursor: "pointer",
            ["--tw-ring-color" as string]: cloudColors[3],
          }}
        />
      )}
    </section>
  )
}
