"use client"

/**
 * Crumple Changelog — every update is a risograph poster; moving between
 * updates crumples the current poster into a paper ball and unfolds the next.
 *
 * - Posters are painted from data on a canvas: two-ink riso print (one loud
 *   colour + black), halftone where the ink runs thin, worn edges, grain and a
 *   misregistered black plate.
 * - The crumple is a real deformation: a 110 × 156 plane wraps onto a sphere
 *   with its arc length preserved, buckles, twists, and takes a per-poster
 *   crease map (a few hundred random folds at three scales). Faceted lighting
 *   comes from screen-space derivatives, so every crease catches light.
 * - Requires `three` and `gsap` (with ScrollTrigger).
 */

import * as React from "react"
import * as THREE from "three"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

export type CrumpleIcon = "star" | "heart" | "moon" | "smiley" | "bolt"

export type CrumpleUpdate = {
  /** ISO date, e.g. "2026-10-14". */
  date: string
  kind: "new" | "improved"
  /** The huge hand-lettered word. Keep it to one word. */
  headline: string
  /** Smaller lettered line under it; up to three words get a playful stagger. */
  subline: string
  icon: CrumpleIcon
  /** Tiny text knocked out of the icon (e.g. "cached once"). */
  iconLabel?: string
  /** Lettered line under the icon, e.g. "+ a fresh admin look". */
  tagline?: string
  /** Short body paragraph printed on the poster. */
  body: string
  /** One-line italic summary shown under the poster. */
  summary: string
  /** Poster ink colour. */
  color: string
}

export type CrumpleChangelogProps = {
  updates?: CrumpleUpdate[]
  /** Page title; "\n" breaks the line. */
  title?: string
  createdBy?: string
  /** Printed upside down along the top of every poster. */
  brand?: string
  /** Printed vertically down the left edge of every poster. */
  edition?: string
  changelogHref?: string
  height?: string | number
  className?: string
}

/** Loud riso inks that print well with the black plate. */
export const CRUMPLE_INKS = {
  pink: "#ff2a85",
  lime: "#c3f53c",
  blue: "#2b45ff",
  orange: "#ff5b1f",
  violet: "#7d3cff",
  cream: "#f2e8cf",
} as const

const DEFAULT_UPDATES: CrumpleUpdate[] = [
  {
    date: "2026-10-14",
    kind: "improved",
    headline: "Memory",
    subline: "for your team",
    icon: "star",
    tagline: "+ a calmer admin page",
    body: "Admins can switch Memory on for a whole workspace. Each person decides what it keeps, and nobody else can read it. The admin page got a quieter layout, too.",
    summary: "Team memory, private per person, and a calmer admin page",
    color: CRUMPLE_INKS.pink,
  },
  {
    date: "2026-10-13",
    kind: "improved",
    headline: "Cache",
    subline: "shared across chats",
    icon: "heart",
    iconLabel: "cached once",
    tagline: "+ math, tables, diagrams",
    body: "Long instructions and files are cached once and reused by every chat that needs them, so you stop paying for the same context twice. Math, tables and diagrams now render inline.",
    summary: "Prompt cache shared across chats, plus richer rendering",
    color: CRUMPLE_INKS.lime,
  },
  {
    date: "2026-10-12",
    kind: "new",
    headline: "Offline",
    subline: "works after dark",
    icon: "moon",
    tagline: "+ syncs when you're back",
    body: "Write on a plane, in a tunnel, in a cabin with no bars. Notes save on your device and sync the moment you reconnect, with conflicts merged line by line.",
    summary: "A full offline mode with line-by-line sync",
    color: CRUMPLE_INKS.blue,
  },
  {
    date: "2026-10-11",
    kind: "new",
    headline: "Toolbox",
    subline: "free built-in plugin",
    icon: "smiley",
    tagline: "no setup needed",
    body: "Read files, run snippets and crunch spreadsheets without installing a thing. Toolbox is on by default, and every tool in it can be switched off.",
    summary: "Toolbox: a free, built-in plugin for files and code",
    color: CRUMPLE_INKS.orange,
  },
  {
    date: "2026-10-10",
    kind: "improved",
    headline: "Focus",
    subline: "full screen editor",
    icon: "star",
    tagline: "+ preview attachments",
    body: "Long prompt? Open an editor that fills the screen and gets everything else out of the way. Attachments preview inline before you send.",
    summary: "A full-screen editor with inline attachment previews",
    color: CRUMPLE_INKS.violet,
  },
  {
    date: "2026-10-09",
    kind: "new",
    headline: "Three",
    subline: "new models",
    icon: "bolt",
    tagline: "tiny, fast & flagship",
    body: "Three models land today: a quick one for summaries and routing, a flagship for long work, and a tiny one that runs right on your laptop.",
    summary: "Three new models, from laptop-tiny to flagship",
    color: CRUMPLE_INKS.cream,
  },
]

// #region scrub-math
/** Knob position (0 … n-1) to what the stage shows: which poster, how crumpled.
 *  The first half of each gap crumples the current poster into a ball; the
 *  second half unfolds the next one out of it. */
export function scrubToView(p: number, n: number): { index: number; crumple: number } {
  if (n <= 1) return { index: 0, crumple: 0 }
  const q = Math.min(Math.max(p, 0), n - 1)
  const i = Math.floor(q)
  if (i >= n - 1) return { index: n - 1, crumple: 0 }
  const f = q - i
  return f < 0.5 ? { index: i, crumple: f * 2 } : { index: i + 1, crumple: (1 - f) * 2 }
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

/** "2026-10-14" → "Oct 14, 2026" (no timezone drift: the date is read as written). */
export function formatLong(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number)
  return MONTHS[(m || 1) - 1] + " " + (d || 1) + ", " + y
}

/** "2026-10-14" → "Oct 14". */
export function formatShort(iso: string): string {
  const [, m, d] = iso.split("-").map(Number)
  return MONTHS[(m || 1) - 1] + " " + (d || 1)
}
// #endregion

/* ------------------------------------------------------------------ */
/* fonts — embedded so nothing is fetched (Apache 2.0 / SIL OFL 1.1)    */
/* ------------------------------------------------------------------ */

let fontsReady: Promise<void> | null = null
function loadFonts(): Promise<void> {
  if (fontsReady) return fontsReady
  fontsReady = (async () => {
    if (typeof FontFace === "undefined") return
    const faces = [
      new FontFace("CC Marker", "url(data:font/woff2;base64," + FONT_MARKER + ")"),
      new FontFace("CC Serif", "url(data:font/woff2;base64," + FONT_SERIF + ")", { style: "normal" }),
      new FontFace("CC Serif", "url(data:font/woff2;base64," + FONT_SERIF_ITALIC + ")", { style: "italic" }),
    ]
    await Promise.all(faces.map(async (f) => document.fonts.add(await f.load())))
  })().catch(() => {})
  return fontsReady
}

/* ------------------------------------------------------------------ */
/* poster painting                                                     */
/* ------------------------------------------------------------------ */

const PW = 1000
const PH = 1414
const ASPECT = PH / PW
const SANS = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif'
const PAPER = [250, 248, 243]
const BLACK = [26, 23, 30]

function hashStr(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hexRgb(hex: string): number[] {
  const h = hex.replace("#", "")
  const v = h.length === 3 ? h.split("").map((c) => c + c).join("") : h
  const n = parseInt(v, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function luminance(rgb: number[]): number {
  return (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255
}

/** A lattice of random values sampled with smooth bilinear interpolation. */
function lattice(cell: number, rng: () => number) {
  const cols = Math.ceil(PW / cell) + 2
  const rows = Math.ceil(PH / cell) + 2
  const g = new Float32Array(cols * rows)
  for (let i = 0; i < g.length; i++) g[i] = rng()
  return (x: number, y: number) => {
    const fx = x / cell
    const fy = y / cell
    const ix = fx | 0
    const iy = fy | 0
    let u = fx - ix
    let v = fy - iy
    u = u * u * (3 - 2 * u)
    v = v * v * (3 - 2 * v)
    const o = iy * cols + ix
    const a = g[o] + (g[o + 1] - g[o]) * u
    const b = g[o + cols] + (g[o + cols + 1] - g[o + cols]) * u
    return a + (b - a) * v
  }
}

function drawIcon(ctx: CanvasRenderingContext2D, icon: CrumpleIcon, x: number, y: number, r: number, rng: () => number) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate((rng() - 0.5) * 0.18)
  ctx.beginPath()
  if (icon === "star") {
    ctx.rotate(-0.22)
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5
      const rr = i % 2 ? r * 0.4 : r * (i === 0 ? 1.12 : 1)
      ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr)
    }
    ctx.closePath()
    ctx.fill()
    // a printed star always has a heavy inner cut
    ctx.globalCompositeOperation = "destination-out"
    ctx.beginPath()
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5
      const rr = i % 2 ? r * 0.17 : r * 0.42
      ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr + r * 0.03)
    }
    ctx.closePath()
    ctx.fill()
  } else if (icon === "heart") {
    const s = r / 1.05
    ctx.moveTo(0, s * 0.92)
    ctx.bezierCurveTo(-s * 0.18, s * 0.72, -s * 1.08, s * 0.22, -s * 1.02, -s * 0.34)
    ctx.bezierCurveTo(-s * 0.96, -s * 0.86, -s * 0.28, -s * 1.02, 0, -s * 0.5)
    ctx.bezierCurveTo(s * 0.28, -s * 1.02, s * 0.96, -s * 0.86, s * 1.02, -s * 0.34)
    ctx.bezierCurveTo(s * 1.08, s * 0.22, s * 0.18, s * 0.72, 0, s * 0.92)
    ctx.fill()
  } else if (icon === "moon") {
    ctx.arc(0, 0, r * 0.92, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalCompositeOperation = "destination-out"
    ctx.beginPath()
    ctx.arc(r * 0.42, -r * 0.3, r * 0.78, 0, Math.PI * 2)
    ctx.fill()
  } else if (icon === "smiley") {
    ctx.arc(0, 0, r * 0.95, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalCompositeOperation = "destination-out"
    ctx.beginPath()
    ctx.ellipse(-r * 0.33, -r * 0.26, r * 0.11, r * 0.19, 0, 0, Math.PI * 2)
    ctx.ellipse(r * 0.33, -r * 0.26, r * 0.11, r * 0.19, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.lineWidth = r * 0.13
    ctx.lineCap = "round"
    ctx.arc(0, r * 0.05, r * 0.52, 0.18 * Math.PI, 0.82 * Math.PI)
    ctx.stroke()
  } else {
    const s = r
    ctx.moveTo(s * 0.28, -s * 1.05)
    ctx.lineTo(-s * 0.58, s * 0.14)
    ctx.lineTo(-s * 0.04, s * 0.14)
    ctx.lineTo(-s * 0.32, s * 1.08)
    ctx.lineTo(s * 0.62, -s * 0.2)
    ctx.lineTo(s * 0.06, -s * 0.2)
    ctx.lineTo(s * 0.36, -s * 1.05)
    ctx.closePath()
    ctx.fill()
  }
  ctx.restore()
}

function letter(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, rng: () => number, jitter = 1) {
  // hand-lettered: every glyph sits a little off, then gets a brush outline
  ctx.font = size + 'px "CC Marker", "Permanent Marker", "Comic Sans MS", cursive'
  ctx.textBaseline = "alphabetic"
  ctx.textAlign = "left"
  ctx.lineJoin = "round"
  ctx.lineWidth = size * 0.03
  const chars = Array.from(text)
  const widths = chars.map((c) => ctx.measureText(c).width)
  const track = -size * 0.015
  const total = widths.reduce((a, b) => a + b, 0) + track * (chars.length - 1)
  let cx = x - total / 2
  chars.forEach((c, i) => {
    ctx.save()
    ctx.translate(cx + widths[i] / 2, y + (rng() - 0.5) * size * 0.05 * jitter)
    ctx.rotate((rng() - 0.5) * 0.09 * jitter)
    const k = 1 + (rng() - 0.5) * 0.08 * jitter
    ctx.scale(k, k)
    ctx.fillText(c, -widths[i] / 2, 0)
    ctx.strokeText(c, -widths[i] / 2, 0)
    ctx.restore()
    cx += widths[i] + track
  })
}

function fitSize(ctx: CanvasRenderingContext2D, text: string, max: number, width: number, family: string) {
  ctx.font = "100px " + family
  const w = ctx.measureText(text).width || 1
  return Math.min(max, (width / w) * 100)
}

function wrap(ctx: CanvasRenderingContext2D, text: string, width: number): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let line = ""
  for (const w of words) {
    const next = line ? line + " " + w : w
    if (ctx.measureText(next).width > width && line) {
      lines.push(line)
      line = w
    } else line = next
  }
  if (line) lines.push(line)
  return lines
}

function paintPoster(u: CrumpleUpdate, brand: string, edition: string, seed: number): HTMLCanvasElement {
  const rng = mulberry32(seed)
  const mk = () => {
    const c = document.createElement("canvas")
    c.width = PW
    c.height = PH
    return c
  }
  const blackC = mk()
  const knockC = mk()
  const b = blackC.getContext("2d", { willReadFrequently: true })!
  const k = knockC.getContext("2d", { willReadFrequently: true })!
  const ink = hexRgb(u.color)
  const light = luminance(ink) > 0.62
  // small print knocks out to paper on dark inks, prints black on pale ones
  const small = light ? b : k
  const marker = '"CC Marker", "Permanent Marker", cursive'

  // the black plate never lands exactly on the colour plate
  b.translate(PW / 2, PH / 2)
  b.rotate((rng() - 0.5) * 0.007)
  b.translate(-PW / 2 + (rng() - 0.5) * 9, -PH / 2 + (rng() - 0.5) * 9)
  b.fillStyle = b.strokeStyle = "#000"
  k.fillStyle = k.strokeStyle = "#000"

  // headline
  const head = u.headline.toUpperCase()
  const hs = fitSize(b, head, 270, 800, marker)
  b.save()
  b.translate(PW / 2, 0)
  b.rotate(-0.025)
  letter(b, head, 0, 118 + hs * 0.8, hs, rng)
  b.restore()
  let y = 118 + hs * 0.8

  // subline: up to three words spread and staggered like hand lettering
  const words = u.subline.split(/\s+/).filter(Boolean)
  if (words.length && words.length <= 3) {
    const ss = Math.min(96, ...words.map((w) => fitSize(b, w, 96, words.length === 1 ? 700 : 300, marker)))
    const xs = words.length === 1 ? [500] : words.length === 2 ? [330, 670] : [235, 500, 765]
    const ys = words.length === 3 ? [0.62, 0, 0.7] : words.length === 2 ? [0.1, 0.55] : [0.2]
    words.forEach((w, i) => letter(b, w, xs[i], y + ss * 1.15 + ys[i] * ss, ss, rng))
    y += ss * 1.15 + ss * 0.75
  } else if (words.length) {
    b.font = "80px " + marker
    const lines = wrap(b, u.subline, 820)
    lines.forEach((l, i) => letter(b, l, 500, y + 100 + i * 92, 80, rng, 0.7))
    y += 100 + (lines.length - 1) * 92
  }

  // tagline + body are laid out from the bottom up, the icon takes what's left
  const bodyTop = 1036
  let tagY = bodyTop - 28
  if (u.tagline) {
    const ts = fitSize(b, u.tagline, 74, 800, marker)
    letter(b, u.tagline, 500, tagY, ts, rng, 0.6)
    tagY -= ts
  }
  const iconCy = (y + tagY) / 2 + 6
  const iconR = Math.max(70, Math.min(150, (tagY - y) / 2 - 26))
  drawIcon(b, u.icon, 500, iconCy, iconR, rng)
  if (u.iconLabel) {
    // knocked out of the black plate so it shows in the poster colour
    b.save()
    b.globalCompositeOperation = "destination-out"
    b.font = "600 " + Math.round(iconR * 0.2) + "px " + SANS
    b.textAlign = "center"
    const parts = u.iconLabel.split(" ")
    const mid = parts.length > 1 ? Math.ceil(parts.length / 2) : 1
    const l1 = parts.slice(0, mid).join(" ")
    const l2 = parts.slice(mid).join(" ")
    b.fillText(l1, 500, iconCy - (l2 ? iconR * 0.08 : -iconR * 0.04))
    if (l2) b.fillText(l2, 500, iconCy + iconR * 0.16)
    b.restore()
  }

  // body
  b.font = "500 29px " + SANS
  b.textAlign = "left"
  const lines = wrap(b, u.body, 640).slice(0, 7)
  lines.forEach((l, i) => b.fillText(l, 92, bodyTop + 30 + i * 36))

  // badge
  small.save()
  small.lineWidth = 4
  small.beginPath()
  small.arc(116, 1330, 19, 0, Math.PI * 2)
  small.stroke()
  small.font = "700 25px " + SANS
  small.textAlign = "center"
  small.fillText("i", 116, 1339)
  small.font = "500 44px " + SANS
  small.textAlign = "left"
  small.fillText(u.kind === "new" ? "NEW" : "IMPROVED", 146, 1346)
  small.restore()

  // barcode + date
  b.font = "500 19px " + SANS
  b.textAlign = "right"
  b.fillText("Released " + formatLong(u.date), 908, 1272)
  const br = mulberry32(hashStr(u.date + u.headline))
  let bx = 908
  while (bx > 682) {
    const w = [3, 3, 5, 8, 4][(br() * 5) | 0]
    b.fillRect(bx - w, 1284, w, 66 - (br() < 0.12 ? 8 : 0))
    bx -= w + [3, 4, 6][(br() * 3) | 0]
  }

  // brand upside down along the top, edition down the left edge
  small.save()
  small.font = "500 21px " + SANS
  small.translate(PW - 92, 58)
  small.rotate(Math.PI)
  small.textAlign = "left"
  small.fillText(brand, 0, 0)
  small.restore()
  small.save()
  small.font = "600 19px " + SANS
  small.translate(40, 112)
  small.rotate(Math.PI / 2)
  small.textAlign = "left"
  const ed = edition.toUpperCase().split("").join(String.fromCharCode(8202))
  small.fillText(ed, 0, 0)
  small.restore()

  // --- print: paper + colour plate (halftone where thin) + black plate ---
  const out = mk()
  const o = out.getContext("2d")!
  const img = o.createImageData(PW, PH)
  const d = img.data
  const ba = b.getImageData(0, 0, PW, PH).data
  const ka = k.getImageData(0, 0, PW, PH).data
  const low = lattice(150, rng)
  const mid = lattice(26, rng)
  const fine = lattice(6, rng)
  const ang = 0.26
  const ca = Math.cos(ang) / 7.5
  const sa = Math.sin(ang) / 7.5
  const s0 = seed | 0
  for (let py = 0; py < PH; py++) {
    for (let px = 0; px < PW; px++) {
      const i = (py * PW + px) * 4
      const n1 = low(px, py)
      const n2 = mid(px, py)
      const n3 = fine(px, py)
      let h = Math.imul(px * 374761393 + py * 668265263, 1274126177) ^ s0
      h = Math.imul(h ^ (h >>> 13), 1274126177)
      const g = ((h ^ (h >>> 16)) >>> 0) / 4294967296
      const edgeD = Math.min(px, py, PW - 1 - px, PH - 1 - py)
      // ragged cut edge
      if (edgeD < 1.5 + n2 * 4 + n3 * 2) {
        d[i + 3] = 0
        continue
      }
      // worn edges and pale, ink-starved patches
      const e = Math.min(1, Math.max(0, (edgeD + (n2 - 0.5) * 30 - 5) / (16 + n1 * 46)))
      let tone = e * e * (3 - 2 * e) * (0.95 + 0.05 * n1)
      if (n2 > 0.83) tone -= (n2 - 0.83) * 2 * (0.4 + n1)
      let cov: number
      if (tone > 0.93) cov = 1
      else {
        const hx = px * ca - py * sa
        const hy = px * sa + py * ca
        const fx = hx - Math.floor(hx) - 0.5
        const fy = hy - Math.floor(hy) - 0.5
        const dist = Math.sqrt(fx * fx + fy * fy)
        const r = Math.sqrt(Math.max(0, tone)) * 0.6
        cov = Math.min(1, Math.max(0, (r - dist) / 0.09 + 0.5))
      }
      cov *= 1 - ka[i + 3] / 255
      if (g > 0.975) cov *= 0.25
      cov *= 0.86 + 0.14 * n3
      let r = PAPER[0] + (ink[0] - PAPER[0]) * cov
      let gg = PAPER[1] + (ink[1] - PAPER[1]) * cov
      let bb = PAPER[2] + (ink[2] - PAPER[2]) * cov
      const a = ba[i + 3]
      if (a) {
        let kb = (a / 255) * (0.8 + 0.2 * n2) * (0.55 + 0.45 * e)
        if (g < 0.045 || n3 > 0.86) kb *= 0.4
        r *= 1 - kb * (1 - BLACK[0] / 255)
        gg *= 1 - kb * (1 - BLACK[1] / 255)
        bb *= 1 - kb * (1 - BLACK[2] / 255)
      }
      const fibre = 0.955 + 0.045 * g + 0.02 * (n1 - 0.5)
      d[i] = r * fibre
      d[i + 1] = gg * fibre
      d[i + 2] = bb * fibre
      d[i + 3] = 255
    }
  }
  o.putImageData(img, 0, 0)
  return out
}

/* ------------------------------------------------------------------ */
/* crease map                                                          */
/* ------------------------------------------------------------------ */

/** Hundreds of short random folds at three scales. Each fold is a V across a
 *  line, faded out along its length, so the sum is a field of flat facets
 *  meeting at creases — the way crushed paper actually breaks. */
function creaseField(pos: ArrayLike<number>, cols: number, rows: number, seed: number): Float32Array {
  const count = cols * rows
  const rng = mulberry32(seed ^ 0x9e3779b9)
  // long folds cross the whole sheet: their sum is exactly piecewise flat
  const lines: number[][] = []
  for (let i = 0; i < 64; i++) {
    const a = rng() * Math.PI
    const amp = (0.25 + rng() * 0.75) * (rng() < 0.5 ? -1 : 1)
    lines.push([(rng() - 0.5) * 1.1, (rng() - 0.5) * 1.5, Math.cos(a), Math.sin(a), amp])
  }
  // short creases break the facets up near where the hand squeezed hardest
  const folds: number[][] = []
  for (let i = 0; i < 150; i++) {
    const a = rng() * Math.PI
    const len = 0.06 + rng() * 0.2
    folds.push([(rng() - 0.5) * 1.2, (rng() - 0.5) * 1.6, Math.cos(a), Math.sin(a), len, (rng() < 0.5 ? -1 : 1) * 1.4])
  }
  const fine = new Float32Array(count)
  const coarse = new Float32Array(count)
  for (let v = 0; v < count; v++) {
    const x = pos[v * 3]
    const y = pos[v * 3 + 1]
    let h = 0
    for (let i = 0; i < lines.length; i++) {
      const [cx, cy, nx, ny, amp] = lines[i]
      h += amp * Math.abs((x - cx) * nx + (y - cy) * ny)
      // the first few folds alone make the big faces of the finished ball
      if (i === 15) coarse[v] = h
    }
    for (const [cx, cy, nx, ny, len, amp] of folds) {
      const dx = x - cx
      const dy = y - cy
      const d = Math.sqrt(dx * dx + dy * dy)
      if (d >= len) continue
      h += amp * (1 - d / len) * (Math.abs(dx * nx + dy * ny) - len * 0.25)
    }
    fine[v] = h
  }
  // high-pass: subtract a blurred copy so only crease-scale relief is left
  // (the raw sums are a big shallow bowl that would swallow every facet)
  const highpass = (src: Float32Array, rad: number) => {
    const blur = Float32Array.from(src)
    const tmp = new Float32Array(count)
    for (let pass = 0; pass < 2; pass++) {
      for (let y = 0; y < rows; y++)
        for (let x = 0; x < cols; x++) {
          let s = 0
          let k = 0
          for (let j = Math.max(0, x - rad); j <= Math.min(cols - 1, x + rad); j++, k++) s += blur[y * cols + j]
          tmp[y * cols + x] = s / k
        }
      for (let y = 0; y < rows; y++)
        for (let x = 0; x < cols; x++) {
          let s = 0
          let k = 0
          for (let j = Math.max(0, y - rad); j <= Math.min(rows - 1, y + rad); j++, k++) s += tmp[j * cols + x]
          blur[y * cols + x] = s / k
        }
    }
    let sq = 0
    for (let v = 0; v < count; v++) {
      src[v] -= blur[v]
      sq += src[v] * src[v]
    }
    const rms = Math.sqrt(sq / count) || 1
    for (let v = 0; v < count; v++) src[v] = Math.max(-1, Math.min(1, src[v] / (rms * 2.6)))
  }
  highpass(fine, 6)
  highpass(coarse, 16)
  const out = new Float32Array(count * 2)
  for (let v = 0; v < count; v++) {
    out[v * 2] = fine[v]
    out[v * 2 + 1] = coarse[v]
  }
  return out
}

/* ------------------------------------------------------------------ */
/* shaders                                                             */
/* ------------------------------------------------------------------ */

const PAPER_VS = /* glsl */ `
attribute vec2 aCrease;
uniform float uC;
uniform float uSeed;
uniform vec3 uHover;
varying vec2 vUv;
varying vec3 vView;
varying float vAO;

const float RMAX = 0.8660254;
const float PI = 3.14159265;

void main() {
  vUv = uv;
  vec2 p = position.xy;
  float c = clamp(uC, 0.0, 1.0);
  float bend = sin(PI * c);
  float r = length(p);
  float e = r / RMAX;
  // offset: software GL (21st's capture) breaks atan on the exact y = 0 row
  float th = atan(p.y + 1e-5, p.x + 1e-5);

  // wrinkles take up slack, so the sheet shrinks a little as it crumples
  float shrink = 1.0 - 0.17 * smoothstep(0.0, 0.7, c);
  // wrap angle: the sheet closes around a sphere, arc length preserved
  float Phi = max(mix(0.0, 2.8, smoothstep(0.04, 0.9, c)), 0.0015);
  float lump = 1.0 + c * (0.09 * sin(3.0 * th + uSeed * 6.283) + 0.06 * sin(5.0 * th - uSeed * 17.0));
  float phi = Phi * e * lump;
  float R = RMAX * shrink / Phi;
  float tw = (uSeed - 0.5) * 2.6 * bend * e;
  vec2 pr = vec2(p.x * cos(tw) - p.y * sin(tw), p.x * sin(tw) + p.y * cos(tw));
  vec2 dir = pr / max(r, 1e-5);
  float sp = sin(phi);
  float hs = sin(phi * 0.5);
  // R * sin(phi) / r without the angle, so the flat sheet maps exactly onto itself
  float sinc = phi < 1e-4 ? 1.0 : sp / phi;
  vec3 P = vec3(pr * shrink * lump * sinc, -2.0 * R * hs * hs);
  vec3 N = vec3(dir * sp, cos(phi));

  // big buckles mid-crumple, then the crease map
  float s = uSeed * 40.0;
  float buckle = bend * 0.075 * (sin(p.x * 7.0 + s) * cos(p.y * 5.0 - s * 0.7) + 0.6 * sin((p.x + p.y) * 11.0 + s * 1.3));
  // fine creases while the sheet is open, big flat faces once it's a ball
  float ball = smoothstep(0.35, 1.0, c);
  float crease = aCrease.x * 0.05 * smoothstep(0.0, 0.3, c) * (1.0 - 0.65 * ball) + aCrease.y * 0.095 * ball;
  // the rim rolls back first, like a hand gathering the corners
  float roll = smoothstep(0.5, 1.0, e) * bend * 0.16 * (0.6 + 0.4 * sin(th * 4.0 + s));

  // touch: the sheet dents and wrinkles a little under the pointer
  vec2 hd = p - uHover.xy;
  float touch = uHover.z * exp(-dot(hd, hd) / 0.03) * (1.0 - c);
  P += N * (buckle - roll + crease + aCrease.x * 0.022 * touch - 0.024 * touch);

  // recentre on the ball as it closes
  P.z += R * smoothstep(0.3, 1.0, c);

  vAO = 1.0 - 0.55 * clamp(-mix(aCrease.x, aCrease.y, ball) * 1.7, 0.0, 1.0) * smoothstep(0.0, 0.5, c + touch * 0.4)
            - 0.22 * smoothstep(1.6, 3.0, phi) * c;
  vec4 mv = modelViewMatrix * vec4(P, 1.0);
  vView = mv.xyz;
  gl_Position = projectionMatrix * mv;
}
`

const PAPER_FS = /* glsl */ `
uniform sampler2D uMap;
uniform sampler2D uMap2;
uniform float uMix;
uniform float uC;
uniform float uOpacity;
uniform float uTouch;
uniform vec3 uBack;
varying vec2 vUv;
varying vec3 vView;
varying float vAO;

void main() {
  vec4 t = mix(texture2D(uMap, vUv), texture2D(uMap2, vUv), uMix);
  if (t.a < 0.5) discard;
  // faceted normal from screen-space derivatives: every crease catches light
  vec3 N = normalize(cross(dFdx(vView), dFdy(vView)));
  vec3 L = normalize(vec3(-0.42, 0.58, 0.72));
  vec3 V = normalize(-vView);
  float flatRef = 0.3 + 0.7 * L.z;
  float diff = (0.3 + 0.7 * max(dot(N, L), 0.0) + 0.12 * max(dot(N, vec3(0.6, -0.3, 0.5)), 0.0)) / flatRef;
  float rim = pow(1.0 - max(dot(N, V), 0.0), 3.0) * 0.18;
  float spec = pow(max(dot(N, normalize(L + V)), 0.0), 18.0) * 0.2;
  float k = max(smoothstep(0.0, 0.25, uC), uTouch);
  // the back of the sheet is bare paper with the print ghosting through
  vec3 base = gl_FrontFacing ? t.rgb : mix(uBack, t.rgb, 0.14);
  vec3 col = base * mix(1.0, diff * vAO, k) + (spec - rim * 0.5) * k;
  gl_FragColor = vec4(col, uOpacity);
}
`

const SHADOW_VS = /* glsl */ `
varying vec2 vP;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vP = w.xy;
  gl_Position = projectionMatrix * viewMatrix * w;
}
`

const SHADOW_FS = /* glsl */ `
uniform vec2 uCenter;
uniform vec2 uHalf;
uniform float uRound;
uniform float uBlur;
uniform float uAlpha;
uniform float uAngle;
varying vec2 vP;
float box(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}
void main() {
  vec2 p = vP - uCenter;
  float cs = cos(uAngle), sn = sin(uAngle);
  p = vec2(cs * p.x + sn * p.y, -sn * p.x + cs * p.y);
  float d = box(p, uHalf, uRound);
  float soft = 1.0 - smoothstep(-uBlur * 0.5, uBlur, d);
  float contact = 1.0 - smoothstep(-6.0, 7.0, box(p + vec2(6.0, -9.0), uHalf * 0.985, uRound));
  gl_FragColor = vec4(0.0, 0.0, 0.0, uAlpha * (soft * soft + 0.35 * contact));
}
`

/* ------------------------------------------------------------------ */
/* component                                                           */
/* ------------------------------------------------------------------ */

const CSS = `
.cc-root{position:relative;isolation:isolate;width:100%;overflow:hidden;display:flex;flex-direction:column;background:var(--color-background);color:var(--color-foreground);container-type:inline-size;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Helvetica,Arial,sans-serif;-webkit-tap-highlight-color:transparent;outline:none}
.cc-gl{position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;z-index:0}
.cc-fallback{position:absolute;display:none;max-width:none;object-fit:cover;box-shadow:14px 22px 40px rgba(0,0,0,.18);transition:opacity .45s ease}
.cc-head{position:relative;z-index:2;padding:18px 16px 0}
.cc-title{margin:0;font-family:"CC Serif","Instrument Serif",Georgia,"Times New Roman",serif;font-weight:400;font-size:clamp(36px,10.5cqi,54px);line-height:.84;letter-spacing:-.035em}
.cc-line{display:block;overflow:hidden;padding:0 .04em .07em 0}
.cc-line-in{display:block;will-change:transform}
.cc-by{margin:9px 0 0;font-size:12.5px;letter-spacing:.005em;color:var(--color-muted-foreground)}
.cc-stage{position:relative;z-index:1;flex:1 1 auto;min-height:0}
.cc-hit{position:absolute;padding:0;margin:0;border:0;background:transparent;cursor:pointer;touch-action:pan-y;border-radius:2px;-webkit-user-select:none;user-select:none}
.cc-hit:focus-visible{outline:2px solid var(--color-foreground);outline-offset:8px}
.cc-meta{position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;gap:8px;padding:4px 16px 0;text-align:center}
.cc-pill{display:inline-flex;align-items:center;height:30px;padding:0 14px;border-radius:999px;background:var(--color-foreground);color:var(--color-background);font-size:13px;font-weight:600;letter-spacing:.01em;white-space:nowrap;font-variant-numeric:tabular-nums}
.cc-summary{margin:0;font-family:"CC Serif","Instrument Serif",Georgia,"Times New Roman",serif;font-style:italic;font-size:clamp(17px,4.6cqi,21px);line-height:1.15;color:var(--color-muted-foreground);max-width:36ch;text-wrap:balance}
.cc-rail{position:relative;z-index:2;width:100%;max-width:560px;margin:0 auto;padding:16px 16px 0;box-sizing:border-box}
.cc-track{position:relative;height:50px;margin:0 12px;cursor:grab;touch-action:none;outline:none}
.cc-track:active{cursor:grabbing}
.cc-track:focus-visible .cc-knob{outline:2px solid var(--color-foreground);outline-offset:3px}
.cc-ticks{position:absolute;left:0;right:0;bottom:10px;height:40px;display:flex;justify-content:space-between;align-items:flex-end;pointer-events:none}
.cc-tick{display:block;flex:none;width:1px;height:40px;background:var(--color-foreground);transform-origin:50% 100%;transform:scaleY(.25);opacity:.3}
.cc-knob{position:absolute;left:0;bottom:-2px;width:44px;height:44px;margin-left:-22px;border-radius:999px;border:1.5px solid var(--color-foreground);background:color-mix(in srgb,var(--color-background) 55%,transparent);-webkit-backdrop-filter:blur(2px);backdrop-filter:blur(2px);display:grid;place-items:center;pointer-events:none;box-sizing:border-box}
.cc-knob::before{content:"";position:absolute;left:50%;bottom:100%;width:1.5px;height:14px;margin-left:-.75px;background:var(--color-foreground)}
.cc-knob::after{content:"";position:absolute;left:50%;bottom:calc(100% + 12px);width:6px;height:6px;margin-left:-3px;border-radius:999px;background:var(--color-foreground)}
.cc-labels{display:flex;justify-content:space-between;margin-top:4px;font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--color-muted-foreground);font-variant-numeric:tabular-nums}
.cc-controls{position:relative;z-index:2;display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:8px 18px;padding:12px 16px 18px;font-size:12.5px;color:var(--color-muted-foreground)}
.cc-play{display:inline-flex;align-items:center;gap:7px;height:30px;padding:0 14px;border-radius:999px;border:1px solid var(--color-border);background:var(--color-background);color:var(--color-foreground);font:inherit;font-size:13px;font-weight:500;cursor:pointer;box-shadow:0 1px 2px rgba(0,0,0,.06);transition:transform .2s ease,box-shadow .2s ease}
.cc-play:hover{transform:translateY(-1px);box-shadow:0 3px 10px rgba(0,0,0,.08)}
.cc-play:active{transform:translateY(0)}
.cc-play:focus-visible,.cc-link:focus-visible{outline:2px solid var(--color-foreground);outline-offset:2px}
.cc-link{color:var(--color-foreground);opacity:.72;text-decoration:none;white-space:nowrap}
.cc-link:hover{opacity:1;text-decoration:underline;text-underline-offset:3px}
.cc-hint-touch{display:none}
.cc-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
@media (pointer:coarse){.cc-hint-fine{display:none}.cc-hint-touch{display:inline}}
@container (min-width:960px){
.cc-head{position:absolute;left:28px;top:22px;padding:0}
.cc-title{font-size:clamp(58px,5.4cqi,80px)}
.cc-by{margin-top:12px}
.cc-meta{flex-direction:row;justify-content:center;gap:12px;padding-top:6px}
.cc-summary{max-width:none;white-space:nowrap}
.cc-rail{padding-top:20px}
}
@media (prefers-reduced-motion:reduce){.cc-play,.cc-fallback{transition:none}}
`

type Api = { next(): void; prev(): void; toggle(): void; goTo(i: number): void }

export default function CrumpleChangelog({
  updates = DEFAULT_UPDATES,
  title = "Paperplane\nchangelog",
  createdBy = "created by Kedhareswer",
  brand = "Paperplane changelog",
  edition = "Team edition",
  changelogHref = "#",
  height = "100svh",
  className,
}: CrumpleChangelogProps) {
  const key = JSON.stringify(updates)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const list = React.useMemo(() => (updates.length ? updates : DEFAULT_UPDATES), [key])
  const n = list.length

  const rootRef = React.useRef<HTMLElement>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const fallbackRef = React.useRef<HTMLImageElement>(null)
  const stageRef = React.useRef<HTMLDivElement>(null)
  const hitRef = React.useRef<HTMLButtonElement>(null)
  const trackRef = React.useRef<HTMLDivElement>(null)
  const knobRef = React.useRef<HTMLDivElement>(null)
  const ticksRef = React.useRef<HTMLDivElement>(null)
  const metaRef = React.useRef<HTMLDivElement>(null)
  const headRef = React.useRef<HTMLElement>(null)
  const controlsRef = React.useRef<HTMLDivElement>(null)
  const apiRef = React.useRef<Api | null>(null)

  const [active, setActive] = React.useState(0)
  const [playing, setPlaying] = React.useState(false)
  const [atEnd, setAtEnd] = React.useState(n <= 1)

  const per = n > 1 ? Math.max(3, Math.min(12, Math.round(44 / (n - 1)))) : 1
  const tickCount = (n - 1) * per + 1

  React.useEffect(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    const stage = stageRef.current
    const hit = hitRef.current
    const track = trackRef.current
    const knob = knobRef.current
    const ticksEl = ticksRef.current
    if (!root || !canvas || !stage || !hit || !track || !knob || !ticksEl) return
    gsap.registerPlugin(ScrollTrigger)
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const last = Math.max(0, n - 1)
    const ticks = Array.from(ticksEl.children) as HTMLElement[]
    let disposed = false

    /* ---------- state ---------- */
    const st = { p: 0, shown: -1, c: 1, opacity: 0, drop: 0, spin: 0, ticksIn: 0, hoverX: 0, hoverY: 0, hover: 0, hx: 0, hy: 0 }
    let pShown = 0 // the smoothed knob position the stage follows
    let dragging = false
    let mode: "intro" | "scrub" | "jump" = "intro"
    const jump = { idx: 0, c: 1 }
    let tl: gsap.core.Timeline | null = null
    let playTimer: gsap.core.Tween | null = null
    let isPlaying = false
    let visible = true
    const L = { rw: 1, rh: 1, cx: 0, cy: 0, w: 1, h: 1, trackW: 1 }

    const seeds = list.map((u, i) => hashStr(u.headline + u.date + i))
    const posters: (HTMLCanvasElement | null)[] = list.map(() => null)
    const poster = (i: number) => (posters[i] ??= paintPoster(list[i], brand, edition, seeds[i]))

    /* ---------- GL ---------- */
    let renderer: THREE.WebGLRenderer | null = null
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" })
    } catch {
      renderer = null
    }
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(22, 1, 10, 40000)
    const geo = new THREE.PlaneGeometry(1, ASPECT, 110, 156)
    const vCount = geo.attributes.position.count
    const crease = new THREE.BufferAttribute(new Float32Array(vCount * 2), 2)
    geo.setAttribute("aCrease", crease)
    const creases: (Float32Array | null)[] = list.map(() => null)
    const creaseFor = (i: number) => (creases[i] ??= creaseField(geo.attributes.position.array, 111, 157, seeds[i]))
    const blank = new THREE.DataTexture(new Uint8Array([250, 248, 243, 255]), 1, 1)
    blank.needsUpdate = true
    const textures: (THREE.CanvasTexture | null)[] = list.map(() => null)
    const maxAniso = renderer ? renderer.capabilities.getMaxAnisotropy() : 1
    const texFor = (i: number) => {
      let t = textures[i]
      if (!t) {
        t = new THREE.CanvasTexture(poster(i))
        t.anisotropy = Math.min(8, maxAniso)
        t.minFilter = THREE.LinearMipmapLinearFilter
        textures[i] = t
      }
      return t
    }
    const mat = new THREE.ShaderMaterial({
      vertexShader: PAPER_VS,
      fragmentShader: PAPER_FS,
      side: THREE.DoubleSide,
      transparent: true,
      forceSinglePass: true,
      uniforms: {
        uMap: { value: blank },
        uMap2: { value: blank },
        uMix: { value: 0 },
        uC: { value: 1 },
        uSeed: { value: 0.5 },
        uHover: { value: new THREE.Vector3() },
        uOpacity: { value: 0 },
        uTouch: { value: 0 },
        uBack: { value: new THREE.Color(0.93, 0.92, 0.9) },
      },
    })
    const paper = new THREE.Mesh(geo, mat)
    scene.add(paper)
    const shadowMat = new THREE.ShaderMaterial({
      vertexShader: SHADOW_VS,
      fragmentShader: SHADOW_FS,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uCenter: { value: new THREE.Vector2() },
        uHalf: { value: new THREE.Vector2(1, 1) },
        uRound: { value: 2 },
        uBlur: { value: 30 },
        uAlpha: { value: 0 },
        uAngle: { value: 0 },
      },
    })
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), shadowMat)
    shadow.renderOrder = -1
    scene.add(shadow)

    const fallback = fallbackRef.current
    if (!renderer && fallback) fallback.style.display = "block"

    /* ---------- show a poster ---------- */
    const show = (i: number) => {
      if (i === st.shown) return
      st.shown = i
      if (renderer) {
        mat.uniforms.uMap.value = texFor(i)
        crease.array.set(creaseFor(i))
        crease.needsUpdate = true
        mat.uniforms.uSeed.value = (seeds[i] % 1000) / 1000
      } else if (fallback) fallback.src = poster(i).toDataURL("image/jpeg", 0.9)
      setActive(i)
      if (mode !== "intro") warm(i)
    }
    // print the neighbours while the user looks at this one, one per idle slot,
    // so the swap inside the ball never waits on a paint
    const warm = (i: number) => {
      const j = [i + 1, i - 1, i + 2].find((k) => k >= 0 && k <= last && !creases[k])
      if (j === undefined) return
      const idle = (cb: () => void) =>
        typeof window.requestIdleCallback === "function" ? window.requestIdleCallback(cb) : window.setTimeout(cb, 200)
      idle(() => {
        if (disposed) return
        if (renderer) renderer.initTexture(texFor(j))
        else poster(j)
        creaseFor(j)
        warm(i)
      })
    }

    /* ---------- layout ---------- */
    const layout = () => {
      const r = root.getBoundingClientRect()
      const s = stage.getBoundingClientRect()
      L.rw = Math.max(1, r.width)
      L.rh = Math.max(1, r.height)
      const pad = Math.min(28, s.height * 0.05)
      L.h = Math.max(60, Math.min(s.height - pad * 2, (s.width - 32) * ASPECT, 820))
      L.w = L.h / ASPECT
      L.cx = s.left - r.left + s.width / 2 - L.rw / 2
      L.cy = L.rh / 2 - (s.top - r.top + s.height / 2)
      Object.assign(hit.style, {
        left: (s.width - L.w) / 2 + "px",
        top: (s.height - L.h) / 2 + "px",
        width: L.w + "px",
        height: L.h + "px",
      })
      if (fallback)
        Object.assign(fallback.style, {
          left: s.left - r.left + (s.width - L.w) / 2 + "px",
          top: s.top - r.top + (s.height - L.h) / 2 + "px",
          width: L.w + "px",
          height: L.h + "px",
        })
      L.trackW = track.getBoundingClientRect().width || 1
      if (renderer) {
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
        renderer.setSize(L.rw, L.rh, false)
        camera.aspect = L.rw / L.rh
        const dist = L.rh / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
        camera.position.set(0, 0, dist)
        camera.near = dist * 0.2
        camera.far = dist * 4
        camera.updateProjectionMatrix()
        shadow.scale.set(L.rw * 1.2, L.rh * 1.2, 1)
      }
      dirty = true
    }

    /* ---------- per-frame ---------- */
    let dirty = true
    let lastSig = ""
    const view = () =>
      mode === "scrub" ? scrubToView(pShown, n) : { index: jump.idx, crumple: jump.c }

    let ready = false
    const frame = () => {
      if (disposed || !visible || !ready) return
      // the stage eases after the hand while dragging, and is exact otherwise
      pShown = dragging ? pShown + (st.p - pShown) * 0.3 : st.p
      if (Math.abs(st.p - pShown) < 1e-4) pShown = st.p
      st.hoverX += (st.hx - st.hoverX) * 0.18
      st.hoverY += (st.hy - st.hoverY) * 0.18
      const v = view()
      show(v.index)
      const c = v.crumple
      st.c = c

      // knob + ruler
      const kf = last ? pShown / last : 0
      knob.style.transform = "translateX(" + kf * L.trackW + "px)"
      const grow = st.ticksIn
      for (let t = 0; t < ticks.length; t++) {
        const f = ticks.length > 1 ? t / (ticks.length - 1) : 0
        const dpx = (f - kf) * L.trackW
        const g = Math.exp(-(dpx / 34) * (dpx / 34))
        const major = t % per === 0
        const base = (major ? 15 : 8) + 24 * g
        const local = Math.min(1, Math.max(0, grow * 1.7 - Math.abs(f - kf) * 0.7))
        const e = 1 - Math.pow(1 - local, 3)
        ticks[t].style.transform = "scaleY(" + ((base / 40) * e).toFixed(3) + ")"
        ticks[t].style.opacity = ((major ? 0.62 : 0.26) + 0.66 * g).toFixed(3)
      }

      if (!renderer) {
        if (fallback) fallback.style.opacity = String(st.opacity * (1 - c))
        return
      }
      // paper transform: each poster balls up with its own spin
      const s = (seeds[v.index] % 1000) / 1000
      const sgn = s < 0.5 ? -1 : 1
      const cc = c * c * (3 - 2 * c)
      const hov = st.hover * (1 - c)
      paper.scale.setScalar(L.w)
      paper.position.set(L.cx, L.cy + Math.sin(Math.PI * c) * L.h * 0.03 + st.drop, 0)
      paper.rotation.set(
        (s * 2 - 1) * 0.5 * cc - st.hoverY * 0.1 * hov + st.spin * 0.4,
        sgn * 0.45 * Math.sin(Math.PI * c) + st.hoverX * 0.14 * hov,
        sgn * (0.35 + s * 0.85) * cc + st.spin,
      )
      mat.uniforms.uC.value = c
      mat.uniforms.uOpacity.value = st.opacity
      mat.uniforms.uTouch.value = hov * 0.85
      ;(mat.uniforms.uHover.value as THREE.Vector3).set(st.hoverX, st.hoverY, hov)

      // soft shadow: the poster's rectangle melts into the ball's disc
      const k = THREE.MathUtils.smoothstep(c, 0.04, 0.9)
      const ball = L.w * 0.29
      const lift = st.drop * 0.35
      shadowMat.uniforms.uHalf.value.set(
        THREE.MathUtils.lerp(L.w / 2, ball * 0.9, Math.pow(k, 0.7)),
        THREE.MathUtils.lerp(L.h / 2, ball * 0.86, Math.pow(k, 0.7)),
      )
      shadowMat.uniforms.uRound.value = THREE.MathUtils.lerp(3, ball * 0.86, k)
      shadowMat.uniforms.uCenter.value.set(
        L.cx + THREE.MathUtils.lerp(16, 26, k) + lift * 0.3,
        L.cy - THREE.MathUtils.lerp(24, 42, k) - lift,
      )
      shadowMat.uniforms.uBlur.value = THREE.MathUtils.lerp(34, 30, k) + lift * 0.4
      shadowMat.uniforms.uAlpha.value = THREE.MathUtils.lerp(0.2, 0.26, k) * st.opacity * (1 - Math.min(0.85, st.drop / (L.h * 0.45)))
      shadowMat.uniforms.uAngle.value = paper.rotation.z * (1 - k)

      const sig = [c, st.opacity, st.drop, st.spin, hov, st.hoverX, st.hoverY, pShown, mat.uniforms.uMix.value, L.w, L.cx, L.cy, st.shown].join()
      if (sig === lastSig && !dirty) return
      lastSig = sig
      dirty = false
      renderer.render(scene, camera)
    }
    gsap.ticker.add(frame)

    /* ---------- moving between posters ---------- */
    const settleUi = () => {
      const at = Math.round(st.p)
      setAtEnd(at >= last)
    }
    const stopPlay = () => {
      isPlaying = false
      playTimer?.kill()
      playTimer = null
      setPlaying(false)
    }
    const goTo = (to: number, done?: () => void) => {
      to = Math.min(Math.max(to, 0), last)
      tl?.kill()
      const from = pShown
      st.p = from
      if (Math.abs(to - from) < 1e-3) {
        done?.()
        return
      }
      if (reduce) {
        // simple crossfade, the knob just slides
        const fromIdx = scrubToView(from, n).index
        mode = "jump"
        jump.idx = fromIdx
        jump.c = 0
        mat.uniforms.uMap2.value = texFor(to)
        tl = gsap.timeline({
          onComplete: () => {
            mode = "scrub"
            mat.uniforms.uMix.value = 0
            settleUi()
            done?.()
          },
        })
        tl.to(st, { p: to, duration: 0.45, ease: "power2.inOut" }, 0)
        tl.to(mat.uniforms.uMix, { value: 1, duration: 0.45, ease: "power1.inOut" }, 0)
        tl.add(() => {
          jump.idx = to
          st.shown = -1
          show(to)
          mat.uniforms.uMix.value = 0
        })
        return
      }
      tl = gsap.timeline({
        onComplete: () => {
          mode = "scrub"
          settleUi()
          done?.()
        },
      })
      if (Math.abs(to - from) <= 1.0001) {
        // adjacent: crumple into the ball (accelerating), unfold the next (settling)
        mode = "scrub"
        const dir = Math.sign(to - from)
        const ball = Math.floor(Math.min(from, to)) + 0.5
        const crossesBall = (ball - from) * dir > 0
        if (crossesBall) {
          tl.to(st, { p: ball, duration: 0.25 + 0.5 * Math.abs(ball - from) * 2, ease: "power2.in" })
          tl.to(st, { p: to, duration: 0.95, ease: "power3.out" })
        } else tl.to(st, { p: to, duration: 0.3 + 0.75 * Math.abs(to - from) * 2, ease: "power3.out" })
      } else {
        // far jump: one crumple, swap inside the ball, one unfold
        const v = view()
        mode = "jump"
        jump.idx = v.index
        jump.c = v.crumple
        tl.to(jump, { c: 1, duration: 0.6 * (1 - jump.c) + 0.15, ease: "power2.in" }, 0)
        tl.add(() => {
          jump.idx = to
        })
        tl.to(jump, { c: 0, duration: 0.95, ease: "power3.out" })
        tl.to(st, { p: to, duration: tl.duration(), ease: "power2.inOut" }, 0)
      }
    }
    const next = () => {
      stopPlay()
      const i = Math.round(pShown)
      goTo(i >= last ? 0 : i + 1)
    }
    const prev = () => {
      stopPlay()
      goTo(Math.max(0, Math.round(pShown) - 1))
    }
    const step = () => {
      if (!isPlaying) return
      const i = Math.round(st.p)
      if (i >= last) {
        stopPlay()
        return
      }
      goTo(i + 1, () => {
        if (!isPlaying) return
        if (Math.round(st.p) >= last) stopPlay()
        else playTimer = gsap.delayedCall(1.15, step)
      })
    }
    const toggle = () => {
      if (isPlaying) {
        stopPlay()
        return
      }
      isPlaying = true
      setPlaying(true)
      if (Math.round(pShown) >= last) goTo(0, () => isPlaying && (playTimer = gsap.delayedCall(1.15, step)))
      else step()
    }
    apiRef.current = { next, prev, toggle, goTo: (i) => (stopPlay(), goTo(i)) }

    /* ---------- timeline drag ---------- */
    const trackP = (clientX: number) => {
      const r = track.getBoundingClientRect()
      return Math.min(Math.max((clientX - r.left) / (r.width || 1), 0), 1) * last
    }
    const onTrackDown = (e: PointerEvent) => {
      if (mode === "intro") return
      e.preventDefault()
      stopPlay()
      tl?.kill()
      mode = "scrub"
      dragging = true
      track.setPointerCapture(e.pointerId)
      st.p = trackP(e.clientX)
      track.focus({ preventScroll: true })
    }
    const onTrackMove = (e: PointerEvent) => {
      if (dragging) st.p = trackP(e.clientX)
    }
    const release = () => {
      if (!dragging) return
      dragging = false
      st.p = pShown
      const to = Math.round(pShown)
      tl?.kill()
      tl = gsap.timeline({ onComplete: settleUi })
      tl.to(st, { p: to, duration: 0.35 + Math.abs(to - pShown) * 0.9, ease: "power3.out" })
    }
    const onTrackKey = (e: KeyboardEvent) => {
      if (mode === "intro") return
      const map: Record<string, () => void> = {
        ArrowRight: next,
        ArrowDown: next,
        ArrowLeft: prev,
        ArrowUp: prev,
        Home: () => (stopPlay(), goTo(0)),
        End: () => (stopPlay(), goTo(last)),
      }
      if (map[e.key]) {
        e.preventDefault()
        map[e.key]()
      }
    }
    track.addEventListener("pointerdown", onTrackDown)
    track.addEventListener("pointermove", onTrackMove)
    track.addEventListener("pointerup", release)
    track.addEventListener("pointercancel", release)
    track.addEventListener("keydown", onTrackKey)

    /* ---------- poster: hover, swipe, click ---------- */
    let swipe: { x: number; y: number; p0: number; id: number; moved: boolean } | null = null
    let suppressClick = false
    const local = (e: PointerEvent) => {
      const r = hit.getBoundingClientRect()
      return [((e.clientX - r.left) / r.width - 0.5), (0.5 - (e.clientY - r.top) / r.height) * ASPECT]
    }
    const onHitDown = (e: PointerEvent) => {
      if (mode === "intro") return
      swipe = { x: e.clientX, y: e.clientY, p0: Math.round(pShown), id: e.pointerId, moved: false }
    }
    const onHitMove = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && !swipe) {
        const [x, y] = local(e)
        st.hx = x
        st.hy = y
      }
      if (!swipe || swipe.id !== e.pointerId) return
      const dx = e.clientX - swipe.x
      const dy = e.clientY - swipe.y
      if (!swipe.moved && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        swipe.moved = true
        stopPlay()
        tl?.kill()
        mode = "scrub"
        dragging = true
        hit.setPointerCapture(e.pointerId)
      }
      if (swipe.moved) {
        // swipe left = forward in time-order (newest → oldest)
        const p = swipe.p0 - dx / (L.w * 1.1)
        st.p = Math.min(Math.max(p, Math.max(0, swipe.p0 - 1)), Math.min(last, swipe.p0 + 1))
      }
    }
    const onHitUp = (e: PointerEvent) => {
      if (!swipe || swipe.id !== e.pointerId) return
      const s = swipe
      swipe = null
      if (!s.moved) return
      suppressClick = true
      dragging = false
      const delta = pShown - s.p0
      const to = Math.abs(delta) > 0.22 ? s.p0 + Math.sign(delta) : s.p0
      goTo(to)
    }
    const onHitCancel = () => {
      if (swipe?.moved) {
        dragging = false
        goTo(swipe.p0)
      }
      swipe = null
    }
    const onHitEnter = () => gsap.to(st, { hover: 1, duration: 0.5, ease: "power2.out" })
    const onHitLeave = () => gsap.to(st, { hover: 0, duration: 0.7, ease: "power2.out" })
    const onHitClick = () => {
      if (suppressClick) {
        suppressClick = false
        return
      }
      if (mode === "intro") return
      next()
    }
    hit.addEventListener("pointerdown", onHitDown)
    hit.addEventListener("pointermove", onHitMove)
    hit.addEventListener("pointerup", onHitUp)
    hit.addEventListener("pointercancel", onHitCancel)
    hit.addEventListener("pointerenter", onHitEnter)
    hit.addEventListener("pointerleave", onHitLeave)
    hit.addEventListener("click", onHitClick)

    /* ---------- arrow keys anywhere while it's on screen ---------- */
    const onKey = (e: KeyboardEvent) => {
      if (!visible || mode === "intro" || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return
      const t = e.target as HTMLElement | null
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return
      if (t && t !== document.body && !root.contains(t)) return
      if (e.key === "ArrowRight") next()
      else if (e.key === "ArrowLeft") prev()
      else return
      e.preventDefault()
    }
    window.addEventListener("keydown", onKey)

    /* ---------- observers ---------- */
    const ro = new ResizeObserver(layout)
    ro.observe(root)
    ro.observe(stage)
    let seen = false
    const io = new IntersectionObserver(
      ([en]) => {
        visible = en.isIntersecting
        dirty = true
        if (en.intersectionRatio >= 0.25) {
          seen = true
          begin()
        }
      },
      { threshold: [0, 0.25] },
    )
    io.observe(root)
    layout()

    /* ---------- the entrance ---------- */
    const head = headRef.current
    const lines = head ? head.querySelectorAll<HTMLElement>(".cc-line-in") : []
    const by = head ? Array.from(head.querySelectorAll<HTMLElement>(".cc-by")) : []
    const meta = metaRef.current
    const controls = controlsRef.current
    const intro = gsap.timeline({ paused: true })
    let trigger: ScrollTrigger | null = null
    // software GL (21st's capture sandbox, old machines) can't animate this
    // smoothly, and a screenshot taken mid-entrance would be blank: land settled
    const gl = renderer?.getContext()
    const dbg = gl?.getExtension("WEBGL_debug_renderer_info")
    const software = !renderer || /swiftshader|llvmpipe|software/i.test(dbg ? String(gl!.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : "")
    // the hidden start state is set only when the entrance actually runs
    const build = () => {
      gsap.set(knob, { scale: 0 })
      if (reduce) {
        gsap.set(lines, { yPercent: 0 })
        gsap.set([by, meta, controls], { opacity: 0 })
        intro
          .to(st, { opacity: 1, ticksIn: 1, c: 0, duration: 0.5 }, 0)
          .to(jump, { c: 0, duration: 0.01 }, 0)
          .to([by, meta, controls], { opacity: 1, duration: 0.5 }, 0)
          .set(knob, { scale: 1 }, 0)
      } else {
        gsap.set(lines, { yPercent: 115, rotate: 4 })
        gsap.set(by, { opacity: 0, y: 8 })
        gsap.set(meta, { opacity: 0, y: 14, scale: 0.96 })
        gsap.set(controls, { opacity: 0, y: 10 })
        st.drop = L.h * 0.55
        st.spin = 1.6
        intro
          .to(lines, { yPercent: 0, rotate: 0, duration: 1.1, ease: "expo.out", stagger: 0.09 }, 0)
          .to(by, { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }, 0.35)
          // the first poster arrives as a ball, lands, and opens
          .to(st, { opacity: 1, duration: 0.25, ease: "none" }, 0.1)
          .to(st, { drop: 0, duration: 0.7, ease: "power2.in" }, 0.1)
          .to(st, { drop: L.h * 0.035, duration: 0.16, ease: "power1.out" }, 0.8)
          .to(st, { drop: 0, duration: 0.2, ease: "power1.in" }, 0.96)
          .to(st, { spin: 0, duration: 1.9, ease: "power3.out" }, 0.1)
          .to(jump, { c: 0, duration: 1.25, ease: "power3.out" }, 1.0)
          .to(st, { ticksIn: 1, duration: 1.3, ease: "power2.out" }, 0.55)
          .to(knob, { scale: 1, duration: 0.7, ease: "back.out(2.2)" }, 1.0)
          .to(meta, { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: "expo.out" }, 1.45)
          .to(controls, { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" }, 1.6)
      }
    }
    // ScrollTrigger starts it on a scrolling page; inside an iframe (21st's
    // preview) it may never see a scroll, so being on screen starts it too
    let begun = false
    function begin() {
      if (begun || !ready || disposed) return
      begun = true
      build()
      if (software) intro.progress(1)
      else intro.play()
    }
    intro.eventCallback("onComplete", () => {
      mode = "scrub"
      st.p = pShown = 0
      warm(0)
    })

    // the posters need their fonts before the first one is printed; all the
    // heavy first-time work (print, creases, shader compile, upload) happens
    // here, before the entrance starts, so the drop never stutters
    loadFonts().then(() => {
      if (disposed) return
      show(0)
      if (renderer) {
        renderer.compile(scene, camera)
        renderer.initTexture(texFor(0))
      }
      ready = true
      dirty = true
      trigger = ScrollTrigger.create({ trigger: root, start: "top 78%", once: true, onEnter: begin })
      if (seen) begin()
    })

    return () => {
      disposed = true
      apiRef.current = null
      gsap.ticker.remove(frame)
      tl?.kill()
      playTimer?.kill()
      intro.kill()
      trigger?.kill()
      gsap.killTweensOf(st)
      ro.disconnect()
      io.disconnect()
      window.removeEventListener("keydown", onKey)
      track.removeEventListener("pointerdown", onTrackDown)
      track.removeEventListener("pointermove", onTrackMove)
      track.removeEventListener("pointerup", release)
      track.removeEventListener("pointercancel", release)
      track.removeEventListener("keydown", onTrackKey)
      hit.removeEventListener("pointerdown", onHitDown)
      hit.removeEventListener("pointermove", onHitMove)
      hit.removeEventListener("pointerup", onHitUp)
      hit.removeEventListener("pointercancel", onHitCancel)
      hit.removeEventListener("pointerenter", onHitEnter)
      hit.removeEventListener("pointerleave", onHitLeave)
      hit.removeEventListener("click", onHitClick)
      textures.forEach((t) => t?.dispose())
      blank.dispose()
      geo.dispose()
      mat.dispose()
      shadow.geometry.dispose()
      shadowMat.dispose()
      renderer?.dispose()
    }
  }, [list, n, per, brand, edition])

  // pill + summary swap with the poster
  const first = React.useRef(true)
  React.useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    const meta = metaRef.current
    if (!meta || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    gsap.fromTo(
      meta.children,
      { y: 9, opacity: 0, filter: "blur(3px)" },
      { y: 0, opacity: 1, filter: "blur(0px)", duration: 0.55, ease: "power3.out", stagger: 0.07, overwrite: true },
    )
  }, [active])

  const u = list[Math.min(active, n - 1)]
  const kind = u.kind === "new" ? "New" : "Improved"
  const lines = title.split("\n")
  const playLabel = playing ? "Pause" : atEnd ? "Play again" : "Play all updates"

  return (
    <section
      ref={rootRef}
      className={"cc-root" + (className ? " " + className : "")}
      style={{ height }}
      aria-label={lines.join(" ")}
    >
      <style>{CSS}</style>
      <canvas ref={canvasRef} className="cc-gl" aria-hidden="true" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={fallbackRef} className="cc-fallback" alt="" aria-hidden="true" style={{ maxWidth: "none" }} />

      <header ref={headRef} className="cc-head">
        <h2 className="cc-title">
          {lines.map((l, i) => (
            <span className="cc-line" key={i}>
              <span className="cc-line-in">{l}</span>
            </span>
          ))}
        </h2>
        <p className="cc-by">{createdBy}</p>
      </header>

      <div ref={stageRef} className="cc-stage">
        <button
          ref={hitRef}
          type="button"
          className="cc-hit"
          aria-label={u.headline + ", " + u.subline + ". " + u.body + " Show the next update."}
        />
      </div>

      <div ref={metaRef} className="cc-meta" aria-live="polite">
        <span className="cc-pill">
          {formatLong(u.date)} · {kind}
        </span>
        <p className="cc-summary">{u.summary}</p>
      </div>

      <div className="cc-rail">
        <div
          ref={trackRef}
          className="cc-track"
          role="slider"
          tabIndex={0}
          aria-label="Updates, newest to oldest"
          aria-valuemin={1}
          aria-valuemax={n}
          aria-valuenow={active + 1}
          aria-valuetext={formatLong(u.date) + ": " + u.headline}
        >
          <div ref={ticksRef} className="cc-ticks" aria-hidden="true">
            {Array.from({ length: tickCount }, (_, i) => (
              <i key={i} className="cc-tick" />
            ))}
          </div>
          <div ref={knobRef} className="cc-knob" aria-hidden="true">
            <svg width="20" height="10" viewBox="0 0 20 10" fill="currentColor">
              <path d="M0 5 8 0v10zM20 5 12 0v10z" />
            </svg>
          </div>
        </div>
        <div className="cc-labels" aria-hidden="true">
          <span>{formatShort(list[0].date)}</span>
          <span>
            {n} {n === 1 ? "update" : "updates"}
          </span>
          <span>{formatShort(list[n - 1].date)}</span>
        </div>
      </div>

      <div ref={controlsRef} className="cc-controls">
        <button type="button" className="cc-play motion-reduce:transition-none" onClick={() => apiRef.current?.toggle()}>
          {playing ? (
            <svg width="9" height="10" viewBox="0 0 9 10" fill="currentColor" aria-hidden="true">
              <path d="M0 0h3v10H0zM6 0h3v10H6z" />
            </svg>
          ) : (
            <svg width="9" height="10" viewBox="0 0 9 10" fill="currentColor" aria-hidden="true">
              <path d="M0 0l9 5-9 5z" />
            </svg>
          )}
          {playLabel}
        </button>
        <span className="cc-hint-fine">Slide to crumple · click the poster for the next</span>
        <span className="cc-hint-touch">Swipe to crumple · tap for the next</span>
        <a className="cc-link" href={changelogHref} target="_blank" rel="noreferrer">
          Full changelog ↗
        </a>
      </div>
    </section>
  )
}

/* Permanent Marker — Font Diner, Apache License 2.0. Instrument Serif — Instrument, SIL OFL 1.1.
   Subset to Basic Latin + typographic punctuation, woff2. */
const FONT_MARKER = "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"
const FONT_SERIF = "d09GMgABAAAAADgcABEAAAAAfWgAADe7AAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGoFEG60UHHIGYACBTgg0CZwMEQgKgZ1MgYQ/ATYCJAODNAuBXAAEIAWEZgcgDIEnG9luJezYkwLOA+jfOUk7oxDYOAhQwO9IFKWaNYvm/89ITsaQoYfNNKv3Q7CZqdMVVQoj+MjRWaQ0yytI8Lm1BvYo5IUbVar4JIwv5qilsJHacyFx1k01cZG3IVvVYfIXhTO6wUFBRAoXEslnp9p4ok1vsXeZTtFXrCDyhAsPCvk7wnL0X1TMNiRecbrfav193hk4zkfNte9Vtd194SNQBDgipVzZvpS6lDpDFxMHvoj2Uqn5jl3t0lVxPvy37f/X2lMwDCURZYBg9KhgnEBsPIUevdXxd19Ef2V9VYWZq81+SQucw7gYJMZkXrfe5JvEBBJMT+HEP68dO2xT3bRl2imtWlr5wHkI+tlNKf3u8+IJgWGoDuJZBTikwpTi6K6vbUc8/3zcS577thXgtRUpVaQkAenjAQpFO3hr4wEMhSK834q1vei9ZYZKjGqRUljwvYpL6wzw2+yjXvHIR6goNiAgISEpPMLAwq7ZK6xcXpmrcFG3dFW6aJfh+iq8/ru/4wE6/L0b+1fGgcTDwjEdx1ZPO6jWNmDy84UT9NggH0I0NEPNA8+nLXWoqIAU+MpPdZ7dABk2pCMjSEHJt76idlFm1FVPaw6AVVWf78udru2OpSxmG6rgCIRqEIbMKgQhqIaNMeh+tQL4b0BFAMzD59mX/L+n965KO2CzkoJiraN1fQgGSj1wB3Ca3Bf+/3+tT9u7O0QvLFMJyxYuQMuzctW3Xv36p+9/A9ypsJoaAGgYBhVePsIBoYsy8fk/U832zwKkFqQCKGXenU06XshFFWLr1s+dc+tqMLuL3ZlZgMAuSAELUieACQBpHwKVQAUw6YHhUiIdUuBTRS541D5QGQ4plzF1sko71y7duaiuKN316u6Z5///PtW3/z2ZKUGO0jhRlmd5wNKJrVQAr3pP+JfUVmznOzH15Ff1zU/eG7yk3bmukBuIWBERCUHS+dmvPvbuGyquWsdDjMv6umHqFJt07Ec3kDBnAmq//gwQwArAPQCCB0wPlKCA0AJhze9ggxEccIY++EIAgRBCJMSQCCmkQgaZkEM+FFEK/RgKNdRCHY21RzAOgUN8G2BAhh9Z+GXYJPEoZFDpq/+E/bTlL/p5acnX+h1/qAGd4reIq7MTW3A8ur7+SjjIAMTbdg/vr70SFthslUAm6Dsdfwf4yzf8JaB8OJ0J68Ox6Ij5z5YNsSMujzuSyc9N+frxj1c1/ZS9mV8EJanG1IbasoL6eF10LR1s/i22rNHETd2PZZ55l+f9W2braH3tAza1HV3azX11L9Pjg5/Zr/Xv9F8N2RofqmEd88cnY8c4ctw0Mduhbn73wl96tzzXZsGXp5eYYEMNwJjJsva0lnErCAva3Ys6NjRthWU7YUV3fZN36cWX3vb+2tA/qbLec47BoO79xQFgFoQgoWBg4RFQ0DKjMrGwP9xZcwdjDODCo2Dy5XBUPaoPmp1Xo3fwwefaXxhInO7HwKQ38pfhXo7CWuW49AcJLu8fmEK1cNFCRpW1CTbqywJ3MeyNrwDgdQeNqIqVtcqhAioLE6b1rONTFdQ03W10GVzR1T1Dhl7BOx98bv91BcNpn50QshJmfxGOPyZIXVOIFqr2IJAcVtYZwebNTYZU+GIvf0SboR5JtihSsYdXZBi+5NCjgPCIiCmYXLiYTOgkk9GsqjXZ+L1izy6hwOqoHt/Jgeois/+wnWExzoDwFExVhCbUrFWL7LJxRZetkjWbaDYaGhzcbGZnTlle9Lj3IjviwV+ynLU8+mLammCJWzng0KPSMzplGBoFfNkp1HuYCS4jikhBiTYwsPASgJhJMlkKpBa0l/T94EAQ0xxbDxvjL4Dw5FsFJFLMLAtyFVRJJky/fHZuni3WYKei6kYNm/aHnbV2Y8paXY91Q7N4+ZJA7yuBkILV+Af6fb3+i/97jC6Tbo7OQK6KxrDrH0Idw0ZzUCGKSEGJNjCwDSfiKQGN6IEEyQMUqUD7OP2W0TE3w1DbV3H149xzg63hnVEybgDhZf6poAkHUSiGkkMpsqyTqxiqpCaFqWZo5sFCGXytUt2qoVrb7JzaDa2gNdjE3v9w4/8tHk5PRDQGoLq0OljrLWET2prgwWA92/yVw07PdR0Z6gJz4XmgxzRAEAiBEESkwWJpsQPvstVV0G28ZOgdDjMAAGsfepV7Bx987v4VEcBJZnYPwNyoTQMfnbc2XkGdbVWJmsau9frmvfmIPrkcJcjYSwcHnEQ0jqWjXwehodXoyxiA1x1E4SIhzbIiV9GqLEyYMtNiYKarEjVNdzu5PHXlnc8IkmQUAA8GtSJkJEhjsIFpfAsIT8F6L1FNsTVpmEUBaCey0jrY7MWor3gJZyTZIsiMT7UhZmYiIs+HNk4NHUCnCz78s8viBt/EqOaydyW6qQlsTwiZfMQZdQWhF8I9iub4cJ6j4Hh0sut4y0GnldEabKbQkCTS7MT2YTQHi6Pq+PRTb5jnojsY334chtWApyKoEYYBBwQkFDQMLBw8AiISMgoqWq0DESazyCI27vrDwUg6sRRSCUmzbJZTMtX/8YDGSnfEuczOrQ+z49Zpc5EHEzmJQBQ0DExZkB04uIyyABBmsZWElLkWAlJR04JF7HIciw+gdrR9icJC/fe95KhxvHc2oMhLOfJnsmQHtRP/d+ysCJDzW46Epyw219P82fPhhqFeKZ6f2r5P8LdbDk82lOxDhb5ZWjBOdZ6UZb7O13OBHinG5TRYSZlI8+ELtK/sT7YJDuL3jC/Ob9ri69qS747i0Y6PyWDbfFmAHXI5my/9KGpG1/w4VSEooZVKJRR16WvpuLUjNU8m21jbebhnvFV5HEJbD52+xxUvXwM2QTGvjnywbXC6Ue3fJ+uSLL5um7/dCksvf+Vfj2EeyOpKg9bqfbXzb1SzYr9Uag7MaltsxloPmu3F3pJFdniDVG4eVk0vcAfpVdWr7fhkeHClhD5Qurzt93B80Smg+JqGouK1B8OWnw+H+EcurbAXX4W84wsClns52zy8d/tWiSM+PmDrl6nJoXrtuBQiZweuP+ee74eSA4Pjba4U7d0ssHof82JhfePM+1g89Azr+CXGTWVy2vsRN2rkiFYdNXmxWJwEkN9KIxshlyP29sFhTPpkZq9VkzihGW54XIeKNIrR7WjzCtdngKrMs8P60Gm/+mzwhXfm2sUBpHz+TVjM9mhy2OnMYdZWyu2xkndwR5T1vvCZHqXFnUVmb3WQD9mjPTUJWMfZdrgR4sJioA7deOp+zNV0iuyzjL1YO8V66OBTFzIzbnaYTdfAiXdTZ/rXVF1YXJeIFasUY9bmtYnqdQMJT58vSw/6L21M0VajqI6kE8SsdEVAZRreVzWW0ehfUINMkeXterKEO/Pw8oWQcIiK1ynpnym98BdTytmAQUOW/r1xTS0rOtZtOOW0M846p2ffIaJDCsDJG4BIng/MyvDBp0sASZhdjGZ5MIQQIYiv66xKk+ZhfSF+DhBgE6cC3AAXPwiMsamPsRqyeXR7KOqkRFYKQUCyq5FqXJYwVSUkd+72bqVDiK6mtvOrdB4Dg421RUyJFCbm1X0CtL3jeyoGQx4SH6rWg+tDUUeEs+ns8Bg4/ir9/EfPFx0gOzcfrCTH1/UJSxohScoYXZu8MeL8Z+OEPKIkuTeEQQqIFzEbcHx9Hz6QT7i37j5IurD/puRD8FH+wT6m/6/9H/6F0TZr3uknlgKDQJL358xB9pGPD3OR6IZMMP/O/HW3utMHD7a58mT7f4oPq5o077QDt7X3HKZzJ2tM6oSyUe8Pmt1pUBgwisnKzir8B7ho1TknHbrUgZ4t20440tLR1LZk2UUucKFj9nWt2XOJTZfbcd6uixV64lMghIjOjuJ/+B/wfxmf7r/mXZTP8/DCW5SDfgPbfhhEVq/gOF9FvfzpaaxTvI9Tydt3CE/XFhmR7kSPjLVgDyzqoAOF0VUQJN+mFQJq1VZIkPZUWrg/4/p4KDG6Ihb6ruT6ieDeiWAkBPupRT476URfH6Mj1XtqEex3jsUbnaeCoLrOo/P96BR0/HHo/NrHEuQcKfDRG1wEfgXlEzXSCh89R65+dkWd5HAyRC3eInnY+eXjc03uGp2zm9TsDcYPB8fvgxSQSC1FrZziBKHKqrjw0SyZSn60uYBOI8eSUKYfCqMwGo0hRFdBOAYnYMOD4y/UMprRQjw/fpiuXDLBWfBKkTaENgUYg6IDhC8EfqoLFQpkKMieWkHjlkdLDktyxtqs7rcK1eDYQGSK1jq5ThTWjQJk50vEcwKltuFPnJKTX+/SKNVBR662fdwyaSd4DTYI5qU31LwzfmGWqtCAlbMdhKPBkm1NTgUM10iIdgq7UbRatKwQeYscnFzJ0gqNJOZbQDLjYHs0HZ11Sjh0PRs6YBsZSrpBJ8ZQoRjZowxzpnGrZG4DEZfcQXId02RRJE/RB0xmYicQJluGMOYADqKS06l9QvrLlrdGbehZ3MuJIvoKR4mJChdaTcBycoWEz40mF3hyija4y2Pgxr5kFke5kqWbMw1uRsn7NuAYUMc+rO75Ir8PwivsPT3hwNOz7Vd338LGCi7Pxb0o6OO+1ncWwcbhjqBURrgrznfk2gsuqSD5wIoB85Hd5UeNccJVW830n+gGA4Rvlz6zA06OcYGPH8Vd43HiigWYTwNIMPtL1Q9nH2YKRNnz9CUnQxxnCnuCYhWJl8GVGzIrd8U5ZwPwnjJsinckeCzWX4YKPwp8URHwBEJQEBASJAgLMkQEBaKCCjFBg7hggYRg3VGBesAW9W11z6vU8DlfcFPef32V3/1x3YFVeffn+y2JGYbQtAc252/pAnzRUEpSmskwWSbH5JkCU2RKTJnJdQ9CmpCFobxI8E36QrC+U0kassGoTVXBUGxaPbTWIDIe259JTXNa2sePw4z+MCy/JotjqMRcJWp1UXRx6N8EPXndQBPA6m5APsreNYIZME3hOjcMaQikKvz/gIjkrzpXGrqo7ftlFNLIWIMoWKx/iyrGUD9sKsaRE5CTjL0nUIQsudTWApl8SS3nR3fTmknij0zd3Tu5blx18V5P504C+L8DU1j2TUJ0LoZ0sHH2OA8mkSaPVzcwFZGaYh9qcviWsF9V9jbP/alsd8ycmerOWnC1dkCn5MycqI5iPSUTlsV6J69Li8iMraIwtZ0mO9QQFmvdqLNiSSXdrtJRmjOKztGaZerkc79RBqaAqsSiO2KKp31UNAu5EkNwKp1KLS3h1hcqpq1BhW9XKhDVZi64asZEx9BGQNgSPwZnoZI6sq0xd40tX0uj1vjfmEgWkFHCqtNJy92L7MYx413xF0tBXz4nS5AOY7HFGVVpv5OjJjSR2BHvzgH6LbMTvDShLlVdmJWvP/+sO2Zr+oXZ457zdi+CyWCZ3QRTkZM9ibIHmMeRc1BZUy2Blgl/hOqV7aMJo5OVJ1+7qjRS6xyHwiUUfcDdpMMc1I+LcRwTrUgle/NG54yNmHYbJIXlHZgMu9AVivt2q6Oij2oEtKr7Et/okOPaXUEcrW/KsdRxFPAaZswkToAJB04uB39RqWWUM429jDZCOszJS84aOmDHoo5AWG+goA1BYbMJ2EVbAmG7gYJ2BM3dxSkgxArdYtubUJwqbadngDpTbGcnFOdKDz2uSre/2LaDMcX5TtvhFNhz1LFdMKa4sNPjRZLJdbFcl8h1qVyXyXW5XFfIdaX8ugoF0y48Xn16x2xyjfnDtWZfbi3srgudiDXE0fk913L2XFvTwwW6moOWcGwFy29t0WmP7tRxxNQ6Hy5+64q6o56oN3p90euP3oJBFiaLksXJkhgsjcEnMTw/FYzDve1f+718xz3c3C3ZwYG+gTk54tt+oGK/e0hKy3L9i7A6xMXM7/gKw2/5f4+C5z34XwEuBnTA9wcIBAkJHCN+hGx3Z+nwm1nz0PUZyUuhEBcgtfRLtg9sUSYFkwDlE0mj6MCUz58MDsKXEASO8EFsJlV6SEhGRLKehoTDAiQGVqokovpcY4QU4RPCZSgbVuMI2YoEIUHpQdVWEqAgiFClLEIjTHYYxPWERkJSCgnhRGrUEn+IFUQksiEEoyNcpDwK+W318wsJoX/RKTZSLBFFjIC3H4JgmB+ZhCAkhGjyC1VQWqg0vCklVI5fd0spzJUKruVeeWXBT1oeydGMvttxMOzbiDSZBdU9jAC6kFRdCF0XKqAeXq8rwqfYz3g/FYK6xsI8EaACpczJ1rcZRV+eOIa6leLKVwBJc3QOGCrqdagXdofEXPkSGgr5TDU7EOr1+TnckjQDiSZMlzJELUUFIG8ZAAWMtPeUgTCpOaixLeDz9dUMBxB61MD6/uiBuhYwI27qdquNpVtd0meGrqgmhH6HIjlKRWjIydaYM80mbwmls3OIMb1v1YQMOp5KeUqZbdqQxv80XqrqU7TEZYCK5i5zQx3FnWlICfQaNLdxx/n5a9cZDs7wAEv32zx7Q1YIdB1zFIzELb0HGx32uMyAgrwhmPLjQ1ON2TZ/9p6JDP+P5nw6syVedw1kn3zjF4FeY+xtJj8RfEajN0IWXM64QXn5gt9b3qLixMXSSOOvojw2hvfIbh5fXrDQOwjodjx3jODLkc5F5+1eWd+nXOUx9jPmpcT4GdRrJQ/ce9YsXr/A2/9a5YGJeUBGeIaSlbYMB2tNZv8wVEnpldeyM8vk9owlMsQyOhNNdeG4JZEUyuoIETrlJlU5NNx34pBjaDQywAbbh8oDGKmZBLNQCrvSNJnODieJ971s/NCpgBGaMdDnlXXyoXUW6I7PX33wDpJ3EtdcHBUkiyGUvkwJpq5BaF6795dmy/MIDJjLLL0MnYXFRqMrbDLZTaH/+ACgFEC/6EKDLX2S9fJEF1Oh2eN7uv7B+XjUmmYwB2fcAKcCv5FSWyj+RYbjpi6r9n1dJpJZ9Qll1FOiQVfxunSSuW//JQX9VALhodHqmwRHHzGnbGdrlXgefexZdvkjgIutTk2s6MbJgbIUKQ4MbLSQrz6SFAJVD5v/W5lUTXTuhgFk3ZO/ytwW9WPPCqSHFmZpodzB6UoWBJ6JOnqK29fMahm4evAOTJT1RcA3pMNZZbuIby3AXDUZTOfi1dX09VQpIcHr5pYZuDu07Cnn1KDBbBvOCM+qGXABR1AcXu7xAKsKGNpfY9Hjqus+ApORCn/lXvkLmem51pZknmUqxWnvicNLpEJCmEGNcVwqCHkcQlcxN0XJmfJsbhdl/jvYUHEOkIZUu5R6BosU8kfRn8m82gHyszVISAUFO2pjmdzjcAwW77Bc7Yk8ba/hqTQbFq4cG/+RX3N+nRhr1kxDGd8ioHbFK6VkkegqJsxGQwVPtUQeoTpXLc2je70UZ2w9ArDMKzaX4CaaEGzirCbOQQ1FNR+wIQHZZppvLPq308rCGvII6vlxiko2qeWCpEAb4JWcTgXXdnZx5ISiCHhyOUNoLlIfjlHq4atVQ2XajFNzPEa2yaLhxfUzWNm4/sJxZBoPWwWJ1mFx/drzRzirY11Ns50LGy2+HSWxSHyxFgb0/2hzfoSvv8QlZAk+8dEuct5okJoaZ4DqhxZ3s6Mk69kxqn4k50eiWjFBw/E3JflKkZLQER1AehzsKqESTlr03kbVjO9V5UZbEouovEJMHk0QKIoMN3IcL3Ek+7zc5R80lQ6/d6BZPysMiyJpUiySAggXtevKtLQScI5IlklyOMtKi90E39tXyyHEyfs5rcSuXBXFkXKkNjaOHfwARoPcyJWk/KpRPAHeZO/RkvoFoLR3K48EerxU7odf4fHQO/xKjF05Ru04XXcm8ui2Ic12Vm2125Iw2u14CjM6AbnLJM+mYfi//2DUa2kFAse1Hkq+PGyKr2JEUHslVusZP20lxMH44DOFUWCcFt5L+kFu6i3FnQYHQ0t3G1QVu+6VXEF5LMNtyD225/nyk/ZTF/Olm1KKNMZeZDDcG/tNYsZPfuIeB2fltGIg4liDvtkCSa3gcrRDwkSVqr3GbDrwovyFHNMa/ea1J8vpwginkfGzMXl+j0Bmt45MVg1x5ntlS4GKwEEl3X25uYoy05KFlUkVXt47T4eT0/a/6jNa/Hg0hEe2/mxM9KUUlq+9115b2XCB5MOhagWSyp2393jffczRjFksd2L5vQ3iOVc7WZ54PpWF2SvlLyQ/Qz3Cy8a8VEpxGezo8WZaTpfm0lClEgFBykFsaCo/8TMOpqnoahicR64RDLvdrlKLsHICYha2NRw8GRb38MmGpFGQREAgN4FcTZqk37nYQF/7I0a+FSSDv+GgUcflKFG2101cWXkJ0tcjmb8nY/cmFwkI0vYF+MqqxwHF1JUqOHfPFr6LidISSCCRDbWFlKIysXrb9JomFwgFKXgTG3fOrDsyPllwZWCuKljbfSRtwPOXl5B9xbqbDeSyld4s5vbxgxLzn1GtqFQ3sOUR5NZE/EIXRmMDcjuuAz3Pt3f1NT42USPtOIeAEx1SUilQCHg1lOC7Qf101sLen/hyT23z4g9zFFr/rWxA1gOeBtxk6LUlGRk8R+NkESL1SptsH+Xpd9zhpxudMc0Jd3J8+1c+sQRaDXMJE+kpj9GbeRrZg7c0HDX0qp20xFFvNzvtLZFB3k6Fe85O/RJPSm6wW1A112+M6s9fFp5mhvQDl2bjd1ld4kalwRTs0WKovPtkVdaiJhnvvrMXl/jtv4XMTyXgb52ajECL6Yf/RvuANW3pFAcvQvU9Yyw0tFRZfac5lm8AEsfDOTbdIWLl/q0ncCIchQ7TRfzTMIePyhtle6r3McvvgbZ/asXB/w0BNjlilzORP976wKfeV7k/rnBnie5vhrjj/3MgdLTEL1EYdrH1WkJX5/hW+1QHLvzm4ms3EEaJWAOJY4A9TTBHE0SEwXNl+BRmx6bwsnMgTLwuTeQJbCJhlJ3lgEpwely5RSPPL5RpfVfLrQ69Hrer5NzT7KX8XmNqaVqao8iql/xm0bOB+IY87ba5DaYts3MtvOn2I6jbCjICC0ZpibVh1vzdW2aLVsUn8oVVlOT9oskxovsYeqk9BpXKsB0LHP4iriXNydVtrquP2eDMSo3Oyd85tjF7f5Y9DuK6CAX+t5LCoHtvJRERv3QIx/Va7lfsX1FUKlg/pJ8cI74mjk3qB0sXMiQo+iEkWSK1SgmWEwIEJYEH6IxcevWmvWPmtTIZgg/sHwwELzYmQBDyazKCCDZWEPQZkbEJ01djIEJcGASkNuZFb5vbgG9pyk0M/9h+SfOLd2KOTklc4V/azuL9dt6I5Bl2y1g2AcPEo0QEHHvtmIMR4VNft087QcJZaLPpFvYBRS+h6IdSw7SZ3QyP4rqwemwaAdmpD186h30IDwOKfWnVFPK9pQcJVA33W+y3t7Ql8ZMkEfdCoYOxm1025b+qEITuQmF4IvBN56LZ+wcHTpZ0Ew7M2w/D6DgKQ5Ou5bUDZOWgLabaiN6Sc6Yc2jbikIEAhtv8YcTkMBE+WV2uBj2WsZaXew16U8Nhbf+kOVcYIMLwxOSIAKYqPV6UEVm6JaC+ZYYOenX+le3TxGKXFx7UBI/T2vnP/olJGu8ebEUFa2HYboC0HU0I6wXc/ASEB7V+KmxqsK9lLfveK7TX6yIn241yTkH6+FScMspUCAEQp6n0ZUGLkpKCFurL05RisUNpKCc+xnmRocyh+p8teeeePck7bNaUHd79peyM5TO7o8mRSnI00ZKsLLE6FkVnsI+HLIb6c7UvU+LG+LwUR0KOVccVHnjob2LqVibnrRI7KkUrcnn+GeWLV6dXFKaA+BWfdFZ/kP+b+fcA76YPry59I8UJlZNAFmMOvWHr9rc89CP8v89prleFH1VNnlCWIjcklI+WAKUfLWuxis3PGMCF5fPvA+RjH9rNllx7fIrDJue+V8YcBWjeXx4pmwV7rKURYMnCwC8KpGqTTqOtMEniovBSVXxldop/p19aNeC2nEwAdbMwu8gqiAiXRSgTLcp4rXl2jEqSlinSNBn5S3FJOo1loyepoTYDZI3xQ4gk4BCd5H3kMucl5/IlLxIdOJSyIdAaUxxGPYlmYz8FXfLir8BMARQOqTBXczO89pa+xG7a8TSdfu+2n1BgscgHh30w+Ym8kvqQd980Uklv6ymrqK/Me4WBnnOvPz78zD+rvY3BSWeRsQ/0cLLscu9BeoacV+HhsZAEjNUGvhlz67E4v6aDdMGmrTHLebtqL49ddy1tnTRaAr9IBbdutfWEPh4QRovIMOS6cYIwFNq3xeWPBCfpoNfcG09+hwshCJ39DRXMXT2b5RSFQc0e0JuZP/qpsh/jw/I7aMsbJ4NmIIi8nwJBbkFuk/2F91WwKuPawnT3w+4QRFkFV3rmOPb7TRW+sHvX93C21x8IcoPVYgcoCDgjdb07t/IdrM152iHr9sX8P9BHh2XFZPde29jfW7d5KhCF85erE6WOUfhimaG7CS59Q/XZpN9d4ijhovvyOQuKyOWhN6nG14LKnkQ+Tid6H7/KeYHuLYC9eqNf0XDSP+GIbwb46YIIub1AN36ekCd+7MP6bEEyQvbzYwOFHzhl86R8jODgkwgIOU4aw2EeiQdfVc8mr/M5dDo8jmq7aLIrLLlTAC+nkL56uScsVLjbtK8ou++YxiBo7HDR5X8AmPQXcKH5S5nIquXWxqXJurNtK1Xm/tlVmlplEEP6r7BfdxAQWNW8enuGtDPLrBANLSe6thIRWPBwzREybY9fZXqtolYQ/C0pgQ8iwZAlzG7XHAIEZm1oXWy6rCvPpkYPXfyL2EPZc3uYceMfjWVO2UHiwH4Y773fduTZHp9z10NfDz9qgSpz35yqqJrks4A4wSCYn5gsbE7GJZrY4vpA1hkao0ZXLQ7742c+hAQTsy3WXkWFWGoMiOOER+V4OwLwdNNiJpOBQND+dyFeUf452yO4BRxqEIkGDn5LpdXpsxEkk4iixEwEGcFuGc1JwG47+b+/XuM58YGH9ixtBGWtJ/sE9ZB+ep5Nd/xSf2SaWBQeh0fwmVn3hQshJuMajSwjEo6vgpk5vPrKJh8jVxyWYIrgU9ZPud3aTc+MTbPqJcqE/IjwzSG8RNzITwoO5icZcV4i+/OQs9wQYYyYEfD99Ku/MMHFIl8EhsbumCYxnXucQHB8sWMVJ7JQZ8EmTA6pF0Z2oNj2aokykBPyPBTBJo2bQNWIOfnYFINxA8NOMRinZ+VndeZA/20shWzVCQiYeZcRsMQLRMaxA659SmvpOdegn6EzTtHpu+0BWRS7gEmOpZBuOycWxKl+mkmvDjNbL+zwzZBHy/xOa4PsXdjt2FMy/YvOaN3a+evmoeChcbBy7V02Pa/wWFxg864lqfCI+JEQGmkk2bDndqmrOzOETZhKkUwff51ui0+4PM+C0PtI5aLrAeybe8PfVC48GcBPspjrS0/pneZwf38P87YDFthlSxVIgJhmhkpe72/wQrPzepDQJSohJ+E1QJZijmyOj490plqkxGuJdFYTNaeaubN++nHWrB9/EvrcCDwyfyo2r0MCvA8175IN++ZmpVybxr+GQe3FbppC9j68nqeqpf/+RoX/Zcymm9hR4H5Vz3FOGp4JLUJYSF+9zQMWyt1jte+xSdOdqnRfD37NuY9Wt+o016IO/JNJDaeRfuo/g1L+R7OJvlFqRjtN832s8B5P6QMY6r8WIG6NZAJsIFndg9n5XO7pKGmklR+dbDHRsr9dCLnWExHvbDo1Zi7bh+obPFJBlTokMal2zTAQPKFqQhA2CQEWes3/sRyCSY0oaiTtIsn4z+ykP6ZiO/VsGCG62VW4aRfAevCSm0/Zc9vVFSZQC4hEpygsIGDmWrDvRb5AzkuB4Mxb2+3qImBThvnzlEkAVC84VjV19020ntFWFIInf527P8PB4aP8FLStph+H0O7+RAf73sVt6NqoDj8BEPCWfZPqN/3SSUE8Ag93YxC5VTeutgzKDRxWWwI9d+cXI2dgzgocRfBEA38iIsOAi9+iEHTuzcMn1k8VG5UxrTkXl+FDz0rw+HjIaFTc4q6CwhPbfh4iHxh9f/F4vwJSaOYsFTwqN3d/0V0ycXR6c67xHTd8f2dSc6ikF6kFIOz/67qEkoN1uYq/ZBMVWSE8Ai+d8oWK3jd6G7ME4b+r/IkEjzzVy522Wogvef1zQT5IEDEWK1FQ8yX1irh4Quz0TmUCLNT88o4di/kc1nAgpd8vtF9d0nsXK8ZfHX54ql2uMBS1tTXEhkh0cZEcahiGaTxOsllbt8vMCHKfydxcn4LbK1hiCEVX/1X7IcF9pF99BEHWg3Do/+nOGEkovr2dw3ozkicCijlJoTFEoLKaB+mpn4EEapUJjtch5kvKYm3fKZe8WhxmIW40+0MiipuTqtRqP72B5rsmPMeuVKizoPY9oM4qidw+a1bkNi9Lrc4sEW8jIfF2uPpqg3rnnj3qHQa0w9oppPE/0zLjz5iDzH8tI6HwTCwJweiLsZ+N7vXkuxUSRiF41zQfiZ9j2mLRS41icaIJio1EiFQvo8KeyOFaMh3xUeK69B6FI9GZvRuqDSNNt3/R8PzwWBcBUe8DyFIS9WiBzTfaWpM12cAd/9CS88KGHwvHg0IBdphytj8BJdcnxamll0TJPdmN0rAYD7LIIgvP14oDs6LNceGxuwT9am813aT2oeg1KtkzXvXz1WiERun5eVs9cQOKXgCXm8tGgVcoKkAQDoIIULSvS/7pl/YDvgNFDCKFSP769HY25wI3zVKUU1kLvBZGUQXIOvIPawBAwHgbgWxFBH4rha+SgFKrqMaQEFNTqjRNAVI7zm9NcYhWp3U3ZH0cWuwFbcryq+1hVdHL097zI+PU/AqTUVhnN0AycXl1rbBMWvPgSkQZKWl6fjJpmvRhLf0nODwUAVoerODDkoeAOi1K4BDqLcW/OkDcKS8WS8VxybxIoY3LswqjDNl2B5gWK9QWq1WSrAwpf/uVq7lhaRK11CyL+lHmDzJDd2nNNp0sJPZh05UrefrWMIalTZjjPbTYC9xi9ytbQnEy5qV/LYyMi+aXanXCSrshUpaA81tSO+IvdHTiP14skMmqSwrExdISvxqA/gOT8QOd9i+D+a9PwppdTYtO3pjjS/pFN0Oh7cJY5wPk4lIIBOePIyQPrxawFaj1SiKxuuj0LhbZKxGoBVu9WjwcXkIo7GiP/9dy3+92ldz8Xw9SJStCbKbH6UCY7NYC5OD/rqNbEmNN0Xz7jrJVTaD7EIkwH3PfkBcbqEoi6dobrmcp/rhafen+hp51lx69xqtTgdQa0+tHl9cNbHhw+RGzwICnefJeXycSldSSBYjXX/M8y2TJicyU1IMNA+su9x5TjViNO15a17Ph/iV+62PZXE/um2sktXRRjfg+h9Tm30M2hm7ZpzEceePrDyeA0Gl3Xw+T97B8YC/kg/y2gAkiH2nm216QWXf5QAgYzsxzgyAUgv58DgScXt/qZt6TWQd1CA+p9TBx41MMdeELk5J27GGyMNfkAQKeGalxCQ/b2hRWeRmegEhUe7HJERePFXOAWUFP6dzFpGF/FHUt+cIGBCNLXjBo/WJJ1+Gi5rovcGFDgxD/os58Yy6lregyRUpXW0ERsGUp60uYTPqW/hxFEDRH+wis6GjW0IclZ9nnqJ9WaKKEdT5AxE24faxcCpf7iciUGe2vFMpSsuLD++oggrGKDs774QmEed8gZMJ/Pcfy6Yx8jPrjf5765KWULrXbFmfGKvqKytujLbbqGLUzSeqXJ7H9Exz+4oKbpxuthGbt0SmypUEV0WkWaRDngcLTMywFIeKK76mOiEC1MaRKXVvbXpDSnmFZUd7XtsRZ+iOhvf2qRXHqENHZEWSjWX35/gxXfgqrIIIxUjUFKBPF3JTIhJQ2I3db7S12bDgvzGgLj+Qve8yWGdKsIUdruq5bBxXbYgp3t0lDJmAI3fcQqUpq7R8L1zybPRCdv/7n/QfHb1UldYPQ9vnaBZkC+O4zQXI4c+pjAI8QGtg+k89eE2wJZG0cHP760+2/Csv0enWW3tkLAEsAgLSbhvNIojvX5nQ+jMg3Z2VavAqA33vnu/4pMYwcE2b9hhokfSBREJdWYoKLET+1gp6MnDCe2e7uGhF+82cJL/OJeKHIWO+6EoLOjgfg8PEJCCJB0MSBU/HA2XiU5eIzX7y756LLHwslx11KdXoh0HBJ/7rvMIR4OVP7hkak52jE6wrtNCsE4Sb/qUBW9lINRBANvQ4Nw9k/BdwQE0DnwbvRGd9VVw7Pe6G4500Fzitch02Vrb07Gas6Qrv8kySSPd0ZGlof0GNYomFOB6lz03ElBL8tYBwMCDVnZobiAYjwucyq1dOmwtE+pVIk7kAK4xwBiaIQGCsGGv9Xk0spGcM0gRs7+pzWtUBwUA8K9FUeaGYxX63NxdQSz/zV1AGeXDLvLEAzXnTq6jX1PNavuszvaUovDbMARpe/e6Xn4LL3Ws/HnBd66Qt45JK27jRSf0ksyX5jSHyq69vQH585HDxdBSv8ybTbgAo5FQZkC/8D4HYhQ0+oAga0h6sQ1bFhX+XeBfrThiEOHu1opimNguKKBTLuAa6vGrqjp3LumdeqZQExNrI6rU99WyzLJScgw/SdXzwEYW7yOugzY1/nOVBgV42IR7Wk2FpQZrnmlJUZbQ1KbnnFSBgilQjKsGQYIQbRvbtenmQHYR9SLR8Rqk8sf7kSGSUrh1Jc/iGoxL5lqIlYMKcnd2OZRc4oTsASW6IHddr7arr9ru6sa1YMBAuSz0ZLL7vGjMRmv2ePmCX8dxuoUHKe8rnSnhkgxhqrRd9WeezF2DBPs22cDgvHTXVtxnq1t1zw4cu2MY41EcELBdYfRnYBd/SKxOrSzGTfxI4TsMkNbB6QyK0I4UCkvX+8i591zSDYxsS/EKdlQOG8U9CpYYauvjaj6kgUA6ddyP+hl0CGmXCyYoJjh8nSYBtuStu8xc34MIcLUNgzgNAEUTRVJGW0L0/bls/GfkOZJTGz4iWnIQSFuxVW0FNzdf71lQbnWkoQJQ1hNCiGO1q9micUYYYziT00u7eBA9QT+rwQkZCIZfxuhYeeQD0UApL+gD1gFRlzqoNd42wdzzP3JDbUqMvTUVWYMAxIgVNxoH+Fem22n+/zlGJUWPHMiWYsDNCDCyptb2V98L9b+wjnTWK5ZR6bPzY2WheSvaiY41wAXUwOhrOFCsqbMI/sttQKlVKZu4AgW4tRjm4+6fm0745+43snqKmQ9D3s66ukZHOQjJpEe/eXqyKNfaBtIf20YYyjQE95oxzG3EoUsgXYQJVVqzNvUHwr0ZMIrPnx2252ftDOZqpAMVqwIh+syzJgfQXZRu07vd2d1aWZ6XGVZ1aJW1CFYDBR3ioYuDPoV1hrtxYGK1lqJNhjd1M8CFkQjrsjI859zGlLlSqXkjgMrFEcmJx7/5iWC1TyGUDRhFIoo7ILw/CLQjYuEtjXgrXYGckoMpoIWeGU7coLpWK5RjuLXwOkEjjO7rBV+LKTOpvm+JNDuz4MMTwzXhfzrinzJAqtYMhAjbU37cxkDCqWDFyiKAQNjWOEKhGxUq5SG+p2/S5PQ/uioiTYeKvNDR2L6eQ2JQjakGd+/xNwseJWeWPWP1WUmYpFlW4rM48lIDbqRdOT49QwK6XoKXbBq4ZhDr8+i01YJreaACA8+qOEqBr7YiJWQzbt67i2WjBstAVRRjdTDiw8fMxPyWGwcaoc8uPXhzd50Q7P2uWcOgOxMVv/AvGRypcVC5QssaCgt9ktOI0MO+1sW0Q2OK29s9ZcJLrba71O79jKYrvZnpncjm1d1vIMWODC+pkXn5aFXTOo45WU4MyeGJt3SaTtthabWcPfiArjdPtdw1nXDMgEGMvhLxWmP2bQx+emD3RCIi6B1PKd6bEbRCb1MfD0twIbe6rNKZUC6fkzkMLd/kriYoKIt/+dQumU7XMBWBb59Q/zOnaYacQw1lR5VqOjJb/bMwOyLVEqGMXpx8AzIB9vCgWAjUP5Zm0ITU/MhpZrVH1cZ/RJzSkmVdAIYQGlubGC80q1Kzeryo0hVzhzqnNywRytt7Wh4xfzohApLDsJmVNBBj1AbrxSujTcwLHodlX0eYim+lWDk8NmuakQFh6ckCBOclBKR74rMnBY29goxMzU7tvYQqmQxlqCETZOErdbOd3QXJz4MQCuA42hwYaryuK8PCeRUQRhgP0g71+jvqNcrZt1u0HmF1lKH3OwrXT1vq2OWP0GWod/57xIH7WzFeSGjvcr5tMkMMjIYgl0z1nJYvTYpoeSwYy6yiLHN4VSOBB2FQq5LHFWC4o3Qtn7d0SJNuiVBWq6FFT6wNytdEVMD0xShfiQ7ZoPcFes1/JEcmxgkpM/k7I9Atoo7HHktbX61NHP/nQNyBwjIUWTrtEl62zB9MRqWeUzmttsN3YFSIIw3O2M4bVUKs5OjUNXSwbW2REhbwSy0ezpZ8FpDBFEqnBYUK/WlQ/6puZZzraoR3NchKIZObsyBJPKKi3Lr33iX45k6wo9GFgkemd1ezhnbPT4nunrBg7NQqMExbbmLuDgLrzKlWeNARjNz6qcOW5Xt4jM/dqmzM2O+kHy1XjVFcQN111xy1W3nO/tbB5bnp0all1TGokFmy/nZQPdnthYk8dBWSieUuoU8ZqrPqKbbrjqtmtuOzrobp9YXW7OzYyrutxsuJJXJKch+VIWrHXXGLeRgSDlqUO1OKrCojnW6Js8jRyB5pM80QYn1vPSb0iiY5sMKrQWzJnx3axNok3TGtulBeNGti8y4CMhDYenQEEQd2sdlGpcsc+D7Egw7pdfaLFCOV6ggKypfQAv6RtcW77fw0j3BOuLeXIZo8MgB2gr647iUWrXnlsgsdhS+tKcUdkY1luS9VpTmYbQMUqkknDNIUdyM19W5iUkLqC6J20IK1XOKv6pY4LjIDEHNWq1kshOv0eiqS0tB6FSEXl0E2o02SgGzhLKULMCi0mVFuAScYhcJvLpeIyxrTnoEdCfZl0gGam3EI/R57S1xRFkoPFfJ7TOTByuVazNDV99ywhIMbU5JAQBCBc4uUDtm8Vq1rbyQDIjIezkRQ7ZWfgP4L9Basfzk3zS7Y+3+/JiWxyWCRohSewZ19CsLNstsb9wAAQfrhISHoCRBV8MqIqxiEp1+qHDR98m4KudaAjmLSEvzlLylzSros9H7L5z+9zMoiYE6vMt/SR3q2dUaiCGBpqxHV3AKTJQYMFJi/4En9R6vI1JnyhkhZwihRGVSfWYWEPGwJ3hwh6IQdYjrx8SfZhkUQ9fDT58ru2/PdNDdNZWlus176QAhzwsN6XIVC25kdW46gQbcZHKNjw2WFQn90VRYbVz2UXfD/3H52bhErn+Omj6c6aK+wl/Z6ZHNwBvTWy+dl+gjnptMevbuirSjA0szZ2B58RMPn8QP9P/LHLUjROCohb4TXSg3v8IsYbwhv1Ujz5CiqD5CMPOECT4CDAuDTk6QDzAWvzvu+P9cY5I/F47HnyvDcBmGzmCW9VjHGP/Pjdzp53M1AhDKtOSYChQSOh04QI0O97R7XQqITn9vcl/AqDGmdt0hl/MUOiBgLiaQkwmYqF92a4YiKchpQA7TFe0N0fmsmA0+eglaIgugkn0qKDB3jUKX8RBJ5GEQZS0b92iPcTwFAAduU2y+FJ6AzfdP5zTEcp7z76KvuujqwiLs1lg2ML75YBdUfcd2qi2aMEF2u9wWxwYhBXrK8tEp728s7Jjzk7sh9W8v1WoEDlO3yxY4tILm7rneYQr/iogX+JwRZomt1pTd5fYPeoeddrzs+WaYixzuVJmYlaLyQplk399TXMP2+7LMl0aomwn0PxlKGX6qOp6YFxR8N3/HcTrUKFNHcPFioeXIG6iBENeud/bgvqI+1Jht9yameqaNPYh/hMhbtIEvJbakofZgwneR33j99tp8RPi/wBZXYY2YYgwnN9Ih73oumX65Q4I7dkmZoPh2x64KCnZN9WQ71EDn9z7DPG4PgKPP/xRDv62k6/t5GzZOqjQLDf6LQ7/7uZ2V6EKMtYlqrOjiJQ/0tSM4QJWM4DlA4VcKTB7Br1Ltv0vQcPalHZZ0NoTrjNsfFzz5V6zaXI+YOau2q+Pt413lEDMzRy+TyzWhpp9u89TV/taCxLSoDsIDPk9WXs/yPU7iADCe1+/xyg60f51ovQLCPD9+Z9rAD84/cr//pu8uy5/egqBSgAAwr810hO8h5ZZUDmdKybXlV3dP/U9eq/kQyn04h+sDA9oIMjwzzWxr/SHBq3LXcUxUS5kit2lV+K42rZCqSncBPlJw/MYU2neXtCxt3L2lGAnKW0KDBJAZVicw96zHH2N7PuR/vqe7BNo+Q5mPkoewr08TJ9i9JEV1ZvTb4jmDr1P43tky2RsqXeXhsriJZzzdeJ8m9h3hX64+BfF/knped7mXa1L6d2J+dFnq+PugGjDwt4C+Kpt3wQ3z2C1/tZpOlGXAH9rTjtvbrBsLe+w0Udxbl+jFs62LLXm0yu2Tmex0zKddv/hEpLeIHjxZPOs+OU5NaOKg0v6jysbUxqq6eWbNdUB45MkDpiu1DQCrnAP1QNkQtGWJwBP7iOQEKA59f6AVSuAz0Ly0ynps08XHH7xdEnT354uq6Z+uuL6aj4x1WDTLlzlare41iUucrHrJR2SikmlpOkOVaTjGua16bnOevAGIE0jQdLKg6awqbHGVUaNUzp/TxsbOs9wLjlOOvuMqSOfeFU1BA/TpaKynLs+kotGYoxrKvz6Bdw5nkTqqLSqjdWVuAGJSHykNUnJOadFQ1KaphCuEzRlNATPfKLzkjaOJ3NEcI458coS22hj8mpCsvImKFUJRV1SKZSXDy/laaoqMbHGuojliUcUdiLo8PSuPKvJlJTn+n973tLHv+Ozl/7ddH3yCv7LMJtn74Z28RqgS/nbwTcDoP7S6M19LRe/UgyyJVjdqPpDguaHLJdc+HeZ/7sXcCQUOz9kcXnJQ/M68nKYsz5i6cHVYcfh3h0pTu91eNFR/u6/fyx//iJ8/ielvLo0rwAA"
const FONT_SERIF_ITALIC = "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"
