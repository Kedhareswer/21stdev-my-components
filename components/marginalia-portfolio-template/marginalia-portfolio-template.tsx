"use client"

// Marginalia Portfolio Template — a designer's CV laid out like a printed
// portfolio somebody went over with a periwinkle pen. Pale paper sheets and
// charcoal night sheets take turns; a contrasty serif sets the headings big;
// and every margin carries a handwritten note: arrows into the portrait,
// ovals around the parts of the bio that matter, a curly arrow from the
// signature into the title, ticks next to languages, doodles for fun facts.
//
// Nine sheets, all from props: Cover, Hello, Education (with a real, scannable
// QR code to your CV), Skills, Projects, one case study per project, Fun
// Facts and Thank You. GSAP drives it:
//   - every pen mark draws itself in as it scrolls into view, and handwriting
//     writes itself left to right;
//   - the cover title's letters rise on load, then drift apart as you leave;
//     a star orbits one letter and morphs into a heart when you touch the name;
//   - each heading's underline morphs from a nervous zig-zag into a clean
//     swoosh as you scroll (MorphSVG);
//   - night sheets grow out of a rounded card into full bleed;
//   - the project phones start as a shuffled pile and deal themselves into a
//     row while the sheet holds still; tap one to fly to its case study;
//   - case-study phones parallax and tilt under the pointer, numbers count up;
//   - the cover takes an ink trail from the pointer.
// The top bar shows where you are and opens a contents page.
//
// Requires `gsap` (ScrollTrigger, ScrollToPlugin and MorphSVGPlugin ship in it).
// Phone screens are built here in markup around Unsplash photos; every
// doodle, arrow and the QR code are drawn in this file as SVG.
import * as React from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { ScrollToPlugin } from "gsap/ScrollToPlugin"
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin"

/* ------------------------------------------------------------------ types */

export type MgnScreen = "cover" | "feed" | "detail" | "stats"
export type MgnDoodle =
  | "guitar" | "dumbbell" | "music" | "plane" | "coffee" | "camera"
  | "plant" | "book" | "headphones" | "globe" | "cat" | "pencil" | "mountain" | "heart"

export type MgnProject = {
  name: string
  /** One line for the phone cover screen. */
  tagline?: string
  /** e.g. "UX/UI · Mobile app". */
  kind?: string
  year?: string
  /** A paragraph. *phrase* gets a pen underline, [phrase] a pen oval. */
  summary: string
  /** A handwritten callout next to the summary. */
  challenge?: string
  /** A handwritten aside beside the phones. */
  note?: string
  /** Up to three numbers that count up and get circled. */
  stats?: { value: number; decimals?: number; suffix?: string; label: string }[]
  /** Photos used inside the phone screens, in order. */
  images: string[]
  /** Which mock screens the three phones show. */
  screens?: MgnScreen[]
  /** The app's own UI colour inside the screens. */
  accent?: string
  /** Sheet colour; defaults alternate night / paper. */
  tone?: "paper" | "night"
  /** A handwritten tag written above its phone on the Projects sheet. */
  tag?: string
  href?: string
}

export type MgnTool = { name: string; mark: string; bg: string; fg: string; note?: string }
export type MgnEducation = { title: string; place?: string; period?: string; circled?: boolean }
export type MgnLanguage = { name: string; level: string; value: number }
export type MgnFact = { doodle: MgnDoodle; text: string }
export type MgnLink = { label: string; href: string }
export type MgnSection = "cover" | "hello" | "education" | "skills" | "projects" | "cases" | "facts" | "thanks"

export type MarginaliaPortfolioTemplateProps = {
  name?: string
  role?: string
  year?: string
  location?: string
  /** The giant cover word. */
  title?: string
  /** Middle of the top bar. */
  docLabel?: string
  /** Portrait photo URL; shown in greyscale, colour on hover. */
  portrait?: string
  /** Handwritten words around the portrait, each with an arrow pointing in. */
  traits?: string[]
  greeting?: string
  /** *phrase* gets a pen underline, [phrase] a pen oval. */
  bio?: string
  educationIntro?: string
  education?: MgnEducation[]
  /** What the QR code opens; null hides the code. */
  cvUrl?: string | null
  cvNote?: string
  languages?: MgnLanguage[]
  tools?: MgnTool[]
  toolNote?: string
  skillsIntro?: string
  skills?: string[]
  books?: { title: string; color: string }[]
  booksNote?: string
  projectsNote?: string
  projects?: MgnProject[]
  facts?: MgnFact[]
  /** A handwritten line beside the Fun Facts heading. */
  factsNote?: string
  thanks?: string
  email?: string
  links?: MgnLink[]
  /** The closing letter; blank lines split paragraphs. */
  letter?: string
  signature?: string
  /** Which sheets to show, in order. */
  sections?: MgnSection[]
  colors?: { paper?: string; night?: string; ink?: string; pen?: string }
  /** href: a stylesheet for the faces below (null loads nothing). */
  fonts?: { href?: string | null; display?: string; hand?: string; body?: string }
  /** The ink trail on the cover. */
  inkTrail?: boolean
  /** One "screen" of the template — every sheet is at least this tall. */
  height?: string
  className?: string
}

/* ------------------------------------------------------------------ logic */

// #region logic
type Pt = [number, number]

function clamp(v: number, a: number, b: number): number {
  return Math.min(b, Math.max(a, v))
}

/** Deterministic 0..1 noise, so pen marks look the same on every render. */
function rand(seed: number): () => number {
  let s = (Math.floor(seed * 9973) ^ 0x9e3779b9) >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function r1(n: number): string {
  return (Math.round(n * 10) / 10).toString()
}

/** Catmull-Rom through the points, as cubic Béziers. */
function smoothPath(pts: Pt[]): string {
  if (pts.length < 2) return ""
  let d = "M" + r1(pts[0][0]) + " " + r1(pts[0][1])
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] || p2
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += "C" + r1(c1[0]) + " " + r1(c1[1]) + " " + r1(c2[0]) + " " + r1(c2[1]) + " " + r1(p2[0]) + " " + r1(p2[1])
  }
  return d
}

/** A hand-drawn loop around a w×h box: a bit more than one turn, never closed. */
function ovalPath(w: number, h: number, seed: number): string {
  const R = rand(seed)
  const cx = w / 2
  const cy = h / 2
  const rx = Math.max(4, w / 2 - 3)
  const ry = Math.max(4, h / 2 - 3)
  const start = -2.5 + R() * 0.6
  const sweep = Math.PI * 2 * (1.1 + R() * 0.08)
  const n = 30
  const pts: Pt[] = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const a = start + sweep * t
    // the pen drifts inward as it comes round, so the ends overlap, not meet
    const k = 1.04 - 0.09 * t + (R() - 0.5) * 0.03
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k + (t - 0.5) * 2])
  }
  return smoothPath(pts)
}

/** A quick underline with a short return stroke. */
function underlinePath(w: number, h: number, seed: number): string {
  const R = rand(seed)
  const y = h - 4
  const pts: Pt[] = []
  const n = 8
  for (let i = 0; i <= n; i++) pts.push([2 + ((w - 4) * i) / n, y + Math.sin(i * 1.3 + R() * 2) * 1.4 - i * 0.25])
  const back = 0.35 + R() * 0.25
  const end = pts[pts.length - 1]
  // a tight turn at the end, then a short stroke back under the line
  return (
    smoothPath(pts) +
    "Q" + r1(end[0] + 3) + " " + r1(end[1] + 1.5) + " " + r1(end[0] - 6) + " " + r1(y + 2.6) +
    "L" + r1(w * (1 - back)) + " " + r1(y + 3.2 + R())
  )
}

/** A loose rectangle whose corners overshoot, like a box drawn in two goes. */
function boxPath(w: number, h: number, seed: number): string {
  const R = rand(seed)
  const j = () => (R() - 0.5) * 4
  const o = 6
  return (
    "M" + r1(-o + j()) + " " + r1(2 + j()) + "L" + r1(w + o + j()) + " " + r1(j()) +
    "M" + r1(w - 2 + j()) + " " + r1(-o + j()) + "L" + r1(w + j()) + " " + r1(h + o + j()) +
    "M" + r1(w + o + j()) + " " + r1(h - 2 + j()) + "L" + r1(-o + j()) + " " + r1(h + j()) +
    "M" + r1(2 + j()) + " " + r1(h + o + j()) + "L" + r1(j()) + " " + r1(-o + j())
  )
}

/** A curved arrow from a to b, bent sideways by `bend` × its length. */
function arrowPaths(a: Pt, b: Pt, bend: number, head = 9): { shaft: string; head: string } {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const len = Math.hypot(dx, dy) || 1
  const c: Pt = [(a[0] + b[0]) / 2 - (dy / len) * len * bend, (a[1] + b[1]) / 2 + (dx / len) * len * bend]
  const shaft = "M" + r1(a[0]) + " " + r1(a[1]) + "Q" + r1(c[0]) + " " + r1(c[1]) + " " + r1(b[0]) + " " + r1(b[1])
  const ang = Math.atan2(b[1] - c[1], b[0] - c[0])
  const s = 0.5
  const h1: Pt = [b[0] - Math.cos(ang - s) * head, b[1] - Math.sin(ang - s) * head]
  const h2: Pt = [b[0] - Math.cos(ang + s) * head, b[1] - Math.sin(ang + s) * head]
  return {
    shaft,
    head: "M" + r1(h1[0]) + " " + r1(h1[1]) + "L" + r1(b[0]) + " " + r1(b[1]) + "L" + r1(h2[0]) + " " + r1(h2[1]),
  }
}

/** The two shapes a heading underline morphs between: zig-zag → swoosh. Same point count. */
function underlineMorph(w: number, seed: number): { from: string; to: string } {
  const R = rand(seed)
  const n = 14
  const zig: Pt[] = []
  const swoosh: Pt[] = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    zig.push([4 + (w - 8) * t, 12 + (i % 2 ? -7 : 7) * (0.6 + R() * 0.5)])
    swoosh.push([4 + (w - 8) * t, 15 - Math.sin(t * Math.PI) * 6 - t * 4])
  }
  return { from: smoothPath(zig), to: smoothPath(swoosh) }
}

/** A four-point sparkle, as one closed path (also the morph source for the heart). */
function sparklePath(cx: number, cy: number, r: number): string {
  const k = r * 0.22
  return (
    "M" + r1(cx) + " " + r1(cy - r) +
    "C" + r1(cx + k * 0.4) + " " + r1(cy - k) + " " + r1(cx + k) + " " + r1(cy - k * 0.4) + " " + r1(cx + r) + " " + r1(cy) +
    "C" + r1(cx + k) + " " + r1(cy + k * 0.4) + " " + r1(cx + k * 0.4) + " " + r1(cy + k) + " " + r1(cx) + " " + r1(cy + r) +
    "C" + r1(cx - k * 0.4) + " " + r1(cy + k) + " " + r1(cx - k) + " " + r1(cy + k * 0.4) + " " + r1(cx - r) + " " + r1(cy) +
    "C" + r1(cx - k) + " " + r1(cy - k * 0.4) + " " + r1(cx - k * 0.4) + " " + r1(cy - k) + " " + r1(cx) + " " + r1(cy - r) + "Z"
  )
}

function heartPath(cx: number, cy: number, r: number): string {
  const s = r / 10
  const p = (x: number, y: number) => r1(cx + x * s) + " " + r1(cy + y * s)
  return (
    "M" + p(0, -3.5) +
    "C" + p(2, -9) + " " + p(10, -8) + " " + p(10, -2) +
    "C" + p(10, 3) + " " + p(4, 6.5) + " " + p(0, 10) +
    "C" + p(-4, 6.5) + " " + p(-10, 3) + " " + p(-10, -2) +
    "C" + p(-10, -8) + " " + p(-2, -9) + " " + p(0, -3.5) + "Z"
  )
}

export type Mark = { text: string; mark: "" | "under" | "oval" }

/** "plain *under* and [oval]" → runs. Unclosed markers stay literal. */
function parseMarks(s: string): Mark[] {
  const out: Mark[] = []
  const re = /\*([^*]+)\*|\[([^\]]+)\]/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(s))) {
    if (m.index > last) out.push({ text: s.slice(last, m.index), mark: "" })
    out.push(m[1] != null ? { text: m[1], mark: "under" } : { text: m[2], mark: "oval" })
    last = m.index + m[0].length
  }
  if (last < s.length) out.push({ text: s.slice(last), mark: "" })
  return out
}

function formatCount(v: number, decimals: number): string {
  return decimals > 0 ? v.toFixed(decimals) : Math.round(v).toLocaleString("en-US")
}

/** Where the deck card i sits before the deal: a loose, seeded pile. */
function pileOffset(i: number, n: number): { x: number; y: number; r: number } {
  const R = rand(i + 7)
  return { x: (R() - 0.5) * 40, y: (R() - 0.5) * 30 - (n - i) * 2, r: (R() - 0.5) * 28 }
}

/** Where the orbiting star is at phase t (0..1) on a tilted ellipse; front = in front of the letter. */
function orbitPoint(t: number, rx: number, ry: number, tilt: number): { x: number; y: number; front: boolean } {
  const a = t * Math.PI * 2
  const x0 = Math.cos(a) * rx
  const y0 = Math.sin(a) * ry
  const c = Math.cos(tilt)
  const s = Math.sin(tilt)
  return { x: x0 * c - y0 * s, y: x0 * s + y0 * c, front: Math.sin(a) > 0 }
}

/** A slightly wobbly horizontal pen line from x1 to x2. */
function handLine(x1: number, x2: number, y: number, seed: number): string {
  const R = rand(seed)
  const n = Math.max(2, Math.round((x2 - x1) / 22))
  const pts: Pt[] = []
  for (let i = 0; i <= n; i++) pts.push([x1 + ((x2 - x1) * i) / n, y + (R() - 0.5) * 3])
  return smoothPath(pts)
}

function pad2(n: number): string {
  return (n < 10 ? "0" : "") + n
}

/** True for colours light enough to need dark text on top. */
function isLight(hex: string): boolean {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return false
  const h = m[1].length === 3 ? m[1].split("").map((c) => c + c).join("") : m[1]
  const v = parseInt(h, 16)
  const lum = (0.299 * ((v >> 16) & 255) + 0.587 * ((v >> 8) & 255) + 0.114 * (v & 255)) / 255
  return lum > 0.62
}

// ---- QR code: byte mode, error level M, versions 1–6 (up to 106 bytes).
const QR_EXP: number[] = []
const QR_LOG: number[] = []
;(function initGF() {
  let x = 1
  for (let i = 0; i < 255; i++) {
    QR_EXP[i] = x
    QR_LOG[x] = i
    x <<= 1
    if (x & 256) x ^= 0x11d
  }
  for (let i = 255; i < 512; i++) QR_EXP[i] = QR_EXP[i - 255]
})()

function gfMul(a: number, b: number): number {
  return a && b ? QR_EXP[QR_LOG[a] + QR_LOG[b]] : 0
}

function rsRemainder(data: number[], n: number): number[] {
  let gen = [1]
  for (let i = 0; i < n; i++) {
    const next = new Array(gen.length + 1).fill(0)
    for (let j = 0; j < gen.length; j++) {
      next[j] ^= gen[j]
      next[j + 1] ^= gfMul(gen[j], QR_EXP[i])
    }
    gen = next
  }
  const res = new Array(n).fill(0)
  for (const d of data) {
    const f = d ^ res[0]
    res.shift()
    res.push(0)
    for (let j = 0; j < n; j++) res[j] ^= gfMul(gen[j + 1], f)
  }
  return res
}

function utf8(s: string): number[] {
  const out: number[] = []
  for (const ch of s) {
    let c = ch.codePointAt(0) || 0
    if (c < 0x80) out.push(c)
    else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63))
    else if (c < 0x10000) out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63))
    else out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63))
  }
  return out
}

// [data codewords per block, EC codewords per block, blocks] at level M
const QR_M = [[0, 0, 0], [16, 10, 1], [28, 16, 1], [44, 26, 1], [32, 18, 2], [43, 24, 2], [27, 16, 4]]

function qrMask(m: number, x: number, y: number): boolean {
  switch (m) {
    case 0: return (x + y) % 2 === 0
    case 1: return y % 2 === 0
    case 2: return x % 3 === 0
    case 3: return (x + y) % 3 === 0
    case 4: return (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0
    case 5: return ((x * y) % 2) + ((x * y) % 3) === 0
    case 6: return (((x * y) % 2) + ((x * y) % 3)) % 2 === 0
    default: return (((x + y) % 2) + ((x * y) % 3)) % 2 === 0
  }
}

function qrPenalty(g: boolean[][]): number {
  const n = g.length
  let p = 0
  let dark = 0
  for (let a = 0; a < n; a++) {
    for (const horiz of [true, false]) {
      let run = 1
      for (let b = 1; b <= n; b++) {
        const same = b < n && (horiz ? g[a][b] === g[a][b - 1] : g[b][a] === g[b - 1][a])
        if (same) run++
        else {
          if (run >= 5) p += run - 2
          run = 1
        }
      }
      for (let b = 0; b + 10 < n; b++) {
        let s = ""
        for (let k = 0; k < 11; k++) s += (horiz ? g[a][b + k] : g[b + k][a]) ? "1" : "0"
        if (s === "10111010000" || s === "00001011101") p += 40
      }
    }
  }
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      if (g[y][x]) dark++
      if (x < n - 1 && y < n - 1 && g[y][x] === g[y][x + 1] && g[y][x] === g[y + 1][x] && g[y][x] === g[y + 1][x + 1]) p += 3
    }
  p += Math.floor(Math.abs((dark * 20) / (n * n) - 10)) * 10
  return p
}

/** The QR module grid for `text` (true = dark), or null when it is too long. */
function qrMatrix(text: string): boolean[][] | null {
  const bytes = utf8(text)
  let ver = 1
  while (ver <= 6 && 12 + bytes.length * 8 > QR_M[ver][0] * QR_M[ver][2] * 8) ver++
  if (ver > 6) return null
  const [per, ecn, blocks] = QR_M[ver]
  const cap = per * blocks
  const bits: number[] = []
  const put = (v: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) bits.push((v >>> i) & 1)
  }
  put(4, 4)
  put(bytes.length, 8)
  for (const b of bytes) put(b, 8)
  put(0, Math.min(4, cap * 8 - bits.length))
  while (bits.length % 8) bits.push(0)
  const data: number[] = []
  for (let i = 0; i < bits.length; i += 8) data.push(parseInt(bits.slice(i, i + 8).join(""), 2))
  for (let pad = 0xec; data.length < cap; pad ^= 0xec ^ 0x11) data.push(pad)
  const dataBlocks: number[][] = []
  const ecBlocks: number[][] = []
  for (let b = 0; b < blocks; b++) {
    const chunk = data.slice(b * per, (b + 1) * per)
    dataBlocks.push(chunk)
    ecBlocks.push(rsRemainder(chunk, ecn))
  }
  const stream: number[] = []
  for (let i = 0; i < per; i++) for (const blk of dataBlocks) stream.push(blk[i])
  for (let i = 0; i < ecn; i++) for (const blk of ecBlocks) stream.push(blk[i])

  const size = 17 + ver * 4
  const mods: boolean[][] = []
  const fn: boolean[][] = []
  for (let y = 0; y < size; y++) {
    mods.push(new Array(size).fill(false))
    fn.push(new Array(size).fill(false))
  }
  const set = (x: number, y: number, v: boolean) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return
    mods[y][x] = v
    fn[y][x] = true
  }
  for (const [fx, fy] of [[3, 3], [size - 4, 3], [3, size - 4]]) {
    for (let dy = -4; dy <= 4; dy++)
      for (let dx = -4; dx <= 4; dx++) {
        const d = Math.max(Math.abs(dx), Math.abs(dy))
        set(fx + dx, fy + dy, d !== 2 && d !== 4)
      }
  }
  for (let i = 8; i < size - 8; i++) {
    set(6, i, i % 2 === 0)
    set(i, 6, i % 2 === 0)
  }
  if (ver > 1) {
    const c = size - 7
    for (let dy = -2; dy <= 2; dy++)
      for (let dx = -2; dx <= 2; dx++) set(c + dx, c + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1)
  }
  const drawFormat = (mask: number) => {
    const d = mask // level M is 00
    let rem = d
    for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537)
    const f = ((d << 10) | rem) ^ 0x5412
    const bit = (i: number) => ((f >>> i) & 1) === 1
    for (let i = 0; i <= 5; i++) set(8, i, bit(i))
    set(8, 7, bit(6))
    set(8, 8, bit(7))
    set(7, 8, bit(8))
    for (let i = 9; i < 15; i++) set(14 - i, 8, bit(i))
    for (let i = 0; i < 8; i++) set(size - 1 - i, 8, bit(i))
    for (let i = 8; i < 15; i++) set(8, size - 15 + i, bit(i))
    set(8, size - 8, true)
  }
  drawFormat(0)
  let i = 0
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5
    for (let vert = 0; vert < size; vert++)
      for (let j = 0; j < 2; j++) {
        const x = right - j
        const y = ((right + 1) & 2) === 0 ? size - 1 - vert : vert
        if (!fn[y][x] && i < stream.length * 8) {
          mods[y][x] = ((stream[i >>> 3] >>> (7 - (i & 7))) & 1) === 1
          i++
        }
      }
  }
  let best: boolean[][] = mods
  let bestScore = Infinity
  for (let m = 0; m < 8; m++) {
    drawFormat(m)
    const g = mods.map((row, y) => row.map((v, x) => (fn[y][x] ? v : v !== qrMask(m, x, y))))
    const score = qrPenalty(g)
    if (score < bestScore) {
      bestScore = score
      best = g
    }
  }
  return best
}
// #endregion logic

/* ---------------------------------------------------------------- content */

// #region content
const U = "https://images.unsplash.com/photo-"

const DEFAULT_FONT =
  "https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600;700&family=DM+Serif+Display:ital@0;1&family=Poppins:wght@300;400;500;600&display=swap"

const DEFAULT_PROJECTS: MgnProject[] = [
  {
    name: "Pirouette",
    tagline: "Learn the choreography, one count at a time.",
    kind: "UX/UI · Mobile app",
    year: "2025",
    summary:
      "My first solo project: a dance-learning app designed from scratch. Instead of another video library, I mapped [how dancers actually rehearse] — count by count, mirrored, slowed down — and built the flow around *practising between classes*.",
    challenge: "Pick, learn and practise a choreography without a teacher in the room.",
    note: "tested with my old dance crew!",
    images: [U + "1547153760-18fc86324498", U + "1508700929628-666bc8bd84ea", U + "1518834107812-67b0b7c58434"],
    screens: ["feed", "cover", "detail"],
    accent: "#e2455f",
    tag: "self taught",
  },
  {
    name: "Verde",
    tagline: "Tiny habits, kindly kept.",
    kind: "UX research · Design sprint",
    year: "2025",
    summary:
      "A self-care app from our bootcamp's final ten-day sprint. Interviews showed people [feel guilty when they miss a day], so Verde never counts what you skipped — it celebrates *small streaks* and suggests a softer plan.",
    challenge: "Keep people coming back without a single guilt-trip notification.",
    note: "my favourite insight came from interview #9",
    stats: [
      { value: 431, label: "people surveyed" },
      { value: 49.5, decimals: 1, suffix: "%", label: "drop a habit app in week one" },
      { value: 14, label: "in-depth interviews" },
    ],
    images: [U + "1544367567-0f2fcb009e0b", U + "1505576399279-565b52d4ac71", U + "1506126613408-eca07ce68773"],
    screens: ["stats", "cover", "feed"],
    accent: "#3f8f6b",
    tag: "team sprint",
  },
  {
    name: "Bookworm",
    tagline: "Your shelf, finally in order.",
    kind: "Redesign · Information architecture",
    year: "2024",
    summary:
      "A redesign of the reading tracker I open every day. Readers loved the community but [got lost in the navigation]. I rebuilt the information architecture around *the shelf, not the feed*, and gave reviews room to breathe.",
    challenge: "Make the most important features findable in two taps or fewer.",
    note: "card sorting with 12 readers",
    images: [U + "1544947950-fa07a98d237f", U + "1495446815901-a7297e633e8d", U + "1532012197267-da84d127e765"],
    screens: ["detail", "feed", "cover"],
    accent: "#b4612a",
    tag: "redesign",
  },
  {
    name: "Second Hem",
    tagline: "Pre-loved pieces, made to last.",
    kind: "E-commerce · Mobile app",
    year: "2024",
    summary:
      "An e-commerce app that helps people shop *second-hand and sustainable* fashion. Shoppers wanted to buy consciously but didn't trust a stranger's wardrobe — clear [condition grades and repair notes] made the difference.",
    challenge: "Build trust in second-hand clothes before anyone sees them in person.",
    stats: [
      { value: 6, label: "rounds of usability tests" },
      { value: 32, suffix: "%", label: "faster checkout" },
    ],
    images: [U + "1490481651871-ab68de25d43d", U + "1515886657613-9f3515b0c78f", U + "1445205170230-053b83016050"],
    screens: ["cover", "detail", "feed"],
    accent: "#6d7138",
    tag: "e-commerce",
  },
  {
    name: "Muse",
    tagline: "Every reference, one calm place.",
    kind: "Passion project · iOS",
    year: "2023",
    summary:
      "Designers save inspiration everywhere and find it nowhere. Muse makes it easy to *save, sort and share* references, then [rediscover them by colour and mood] — so nobody loses the picture they saw last Tuesday.",
    challenge: "Turn a chaotic camera roll into a moodboard you'd actually show a client.",
    note: "built the prototype in a weekend",
    images: [U + "1541961017774-22349e4a1262", U + "1579783902614-a3fb3927b6a5", U + "1513364776144-60967b0f800f"],
    screens: ["feed", "detail", "stats"],
    accent: "#6f5cf0",
    tag: "passion project",
  },
]

const DEFAULTS = {
  name: "Aurelia Sorel",
  role: "UX/UI Designer",
  year: "2026",
  location: "Paris",
  title: "Portfolio",
  docLabel: "Curriculum Vitae",
  portrait: U + "1580489944761-15a19d654956",
  traits: ["creative", "detail-oriented", "sociable", "empathic", "fast learner", "motivated"],
  greeting: "Hello.",
  bio:
    "I'm a junior UX/UI designer based in Paris. I get to combine my love for technology with my passion for art and design. I enjoy using my *creativity and problem-solving skills* to build digital experiences that don't just look good but work seamlessly for the people using them. When I'm not designing, you'll find me in the city's museums and galleries looking for inspiration. I believe [continuous learning is the key], and I'm always on the lookout for a fresh challenge.",
  educationIntro:
    "Final year of my bachelor's. My classes are done, so I can work full-time between my last two exams.",
  education: [
    { title: "UX/UI Design Bootcamp", place: "Ironhack, Paris", period: "2025" },
    { title: "Google UX Design Certificate", place: "Coursera", period: "2024" },
    { title: "Erasmus — Études visuelles", place: "Université Paris 8", period: "2023", circled: true },
    { title: "B.A. Multimedia Sciences & Technologies", place: "University of Udine", period: "2021 — 26", circled: true },
  ] as MgnEducation[],
  cvUrl: "https://example.com/aurelia-sorel-cv.pdf",
  cvNote: "my curriculum vitae",
  languages: [
    { name: "Italian", level: "native", value: 1 },
    { name: "French", level: "B2", value: 0.72 },
    { name: "English", level: "C1", value: 0.86 },
  ] as MgnLanguage[],
  tools: [
    { name: "Photoshop", mark: "Ps", bg: "#001e36", fg: "#31a8ff", note: "photo retouching since I was 14" },
    { name: "Illustrator", mark: "Ai", bg: "#330000", fg: "#ff9a00", note: "icons, posters, the occasional logo" },
    { name: "Figma", mark: "figma", bg: "#1e1e1e", fg: "#ffffff", note: "where I live, nine to five" },
    { name: "HTML", mark: "</>", bg: "#e44d26", fg: "#ffffff", note: "enough to talk to developers" },
    { name: "CSS", mark: "{ }", bg: "#264de4", fg: "#ffffff", note: "grid, flex & a lot of patience" },
  ] as MgnTool[],
  toolNote: "I'm always studying my tools",
  skillsIntro:
    "Understanding and applying visual and interaction design principles, with accessibility and inclusive design as a starting point, not a checklist.",
  skills: [
    "UX Research", "Information Architecture", "Competitor Analysis", "Design Systems", "Personas", "Moodboards",
    "Empathy Maps", "Wireframes", "User Journeys", "High-fidelity Prototypes", "User Flows", "Mock-ups",
  ],
  books: [
    { title: "The Design of Everyday Things", color: "#c9473b" },
    { title: "Don't Make Me Think", color: "#2f3b52" },
    { title: "Refactoring UI", color: "#d9a441" },
    { title: "Grid Systems", color: "#f2efe8" },
    { title: "Steal Like an Artist", color: "#1f1f21" },
  ],
  booksNote: "my books about design",
  projectsNote: "Hard skills? You'll find them all in here",
  facts: [
    { doodle: "guitar", text: "I play guitar — badly, but with feeling" },
    { doodle: "dumbbell", text: "7am lifting is my best debugging time" },
    { doodle: "plane", text: "Lived in three countries before 25" },
    { doodle: "coffee", text: "Oat flat white, no sugar, every day" },
    { doodle: "cat", text: "My cat Pixel reviews all my wireframes" },
    { doodle: "music", text: "47 concerts and counting" },
  ] as MgnFact[],
  factsNote: "the things that never fit on a CV",
  thanks: "Thank you",
  email: "aurelia.sorel@example.com",
  links: [
    { label: "Behance", href: "https://www.behance.net" },
    { label: "Dribbble", href: "https://dribbble.com" },
    { label: "LinkedIn", href: "https://www.linkedin.com" },
  ] as MgnLink[],
  letter:
    "While I may be a junior with limited experience, I've got a passion for design and a drive to learn and grow.\n\nI'm not afraid of new challenges, and I'm confident that my creativity and curiosity would make me a valuable addition to your team.\n\nI know it may be a leap to take a chance on me, but with the right guidance I believe I can become the best designer you've ever hired.",
  sections: ["cover", "hello", "education", "skills", "projects", "cases", "facts", "thanks"] as MgnSection[],
}

const SECTION_LABEL: { [k: string]: string } = {
  cover: "cover",
  hello: "hello",
  education: "education",
  skills: "skills",
  projects: "projects",
  cases: "case studies",
  facts: "fun facts",
  thanks: "thank you",
}
// #endregion content

/* ------------------------------------------------------------------ style */

const CSS = `
.mgn-root{position:relative;container-type:inline-size;isolation:isolate;overflow-x:clip;background:var(--mgn-paper);color:var(--mgn-ink);font-family:var(--mgn-body);font-weight:300;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
.mgn-root *,.mgn-root *::before,.mgn-root *::after{box-sizing:border-box}
.mgn-root :where(img){max-width:none;display:block}
.mgn-root :where(button){font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer}
.mgn-root :where(a){color:inherit;text-decoration:none}
.mgn-root :focus-visible{outline:2px dashed var(--mgn-pen);outline-offset:4px;border-radius:6px}

.mgn-display{font-family:var(--mgn-display);font-weight:400;line-height:.92;letter-spacing:-.012em}
.mgn-hand{font-family:var(--mgn-hand);color:var(--mgn-pen);font-weight:500;line-height:1.02}
.mgn-p{font-size:clamp(13px,1.08cqi,16px);line-height:1.7;color:var(--fg)}
.mgn-muted{color:var(--muted)}
.mgn-h2{font-size:clamp(54px,8.6cqi,150px);margin:0;color:var(--fg)}

.mgn-sheet{position:relative;isolation:isolate;display:flex;flex-direction:column;justify-content:center;min-height:var(--mgn-h);padding:clamp(76px,8cqi,130px) clamp(18px,5.2cqi,92px) clamp(56px,6cqi,100px);color:var(--fg)}
.mgn-sheet[data-tone=paper]{--fg:var(--mgn-ink);--muted:color-mix(in oklab,var(--mgn-ink) 60%,var(--mgn-paper));--rule:color-mix(in oklab,var(--mgn-ink) 16%,var(--mgn-paper));background:var(--mgn-paper)}
.mgn-sheet[data-tone=night]{--fg:#ecebe7;--muted:color-mix(in oklab,#ecebe7 62%,var(--mgn-night));--rule:color-mix(in oklab,#ecebe7 16%,var(--mgn-night));isolation:isolate}
.mgn-sheet>*{width:100%}
.mgn-sheet-bg{position:absolute;inset:0;z-index:-1;background:var(--mgn-night);pointer-events:none}
.mgn-grain{position:absolute;inset:0;z-index:-1;pointer-events:none;opacity:.5;mix-blend-mode:multiply;background-image:radial-gradient(color-mix(in oklab,var(--mgn-ink) 9%,transparent) .6px,transparent .7px);background-size:5px 5px}
.mgn-sheet[data-tone=night] .mgn-grain{mix-blend-mode:screen;background-image:radial-gradient(rgba(255,255,255,.05) .6px,transparent .7px)}

.mgn-mk{position:relative;display:inline-block;white-space:normal}
.mgn-mark{position:absolute;overflow:visible;pointer-events:none;fill:none;stroke:var(--mgn-pen);stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
.mgn-draw{stroke-dasharray:1;stroke-dashoffset:0}
.mgn-ink{fill:none;stroke:var(--mgn-pen);stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round;overflow:visible}
.mgn-write,.mgn-card-write{display:inline-block}
.mgn-note-swap{display:inline-block;animation:mgn-swap .45s cubic-bezier(.2,.8,.2,1)}
@keyframes mgn-swap{from{opacity:0;transform:translateY(8px) rotate(-1deg)}}

.mgn-split{display:inline}
.mgn-w{display:inline-block;white-space:nowrap}
.mgn-c{display:inline-block;overflow:hidden;padding:.06em .01em .12em;margin:-.06em -.01em -.12em}
.mgn-ci{display:inline-block;will-change:transform}

.mgn-hd{position:relative;display:inline-block}
.mgn-uline{display:block;width:min(70%,320px);height:auto;aspect-ratio:300/26;margin-top:.1em}
.mgn-uline path{fill:none;stroke:var(--mgn-pen);stroke-width:2.2;stroke-linecap:round}

/* chrome */
.mgn-top{position:sticky;top:0;height:0;z-index:50;mix-blend-mode:difference;pointer-events:none}
.mgn-bar{position:absolute;left:0;right:0;top:0;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:12px;padding:16px clamp(18px,5.2cqi,92px) 14px;color:#fff;font-size:12px;letter-spacing:.06em;pointer-events:auto}
.mgn-bar-right{justify-self:end;display:flex;align-items:baseline;gap:12px}
.mgn-bar-btn{position:relative;padding:4px 12px;letter-spacing:.06em}
.mgn-bar-btn .mgn-mark{stroke:#fff;opacity:0;transition:opacity .25s}
.mgn-bar-btn:hover .mgn-mark,.mgn-bar-btn:focus-visible .mgn-mark{opacity:1}
.mgn-bar-sec{font-family:var(--mgn-hand);font-size:19px;letter-spacing:0;min-width:5ch;text-align:right}
.mgn-progress{position:absolute;left:0;right:0;bottom:0;height:1px;background:#fff;transform-origin:0 50%;transform:scaleX(0);opacity:.6}
.mgn-hold{position:sticky;top:0;height:0;z-index:60}
.mgn-index{position:absolute;left:0;right:0;top:0;height:var(--mgn-h);background:var(--mgn-paper);color:var(--mgn-ink);display:flex;flex-direction:column;justify-content:safe center;padding:70px clamp(18px,5.2cqi,92px) 40px;overflow:auto;clip-path:circle(0% at 50% 0%);visibility:hidden;transition:clip-path .7s cubic-bezier(.7,0,.2,1),visibility 0s .7s}
.mgn-index[data-open=true]{clip-path:circle(150% at 50% 0%);visibility:visible;transition:clip-path .8s cubic-bezier(.7,0,.2,1),visibility 0s}
.mgn-index ol{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));grid-auto-flow:column;grid-template-rows:repeat(var(--rows),auto);gap:clamp(4px,.8cqi,12px) clamp(24px,4cqi,64px)}
.mgn-index li button{display:flex;align-items:baseline;gap:clamp(12px,2cqi,30px);font-family:var(--mgn-display);font-size:clamp(30px,4.2cqi,68px);line-height:1.04;text-align:left;color:var(--mgn-ink)}
.mgn-index li button small{font-family:var(--mgn-hand);font-size:.38em;color:var(--mgn-pen);min-width:2.2ch}
.mgn-index li button .mgn-mk .mgn-draw{stroke-dashoffset:1;transition:stroke-dashoffset .55s cubic-bezier(.6,0,.2,1)}
.mgn-index li button:hover .mgn-draw,.mgn-index li button:focus-visible .mgn-draw{stroke-dashoffset:0}
.mgn-index-close{position:absolute;top:16px;right:clamp(18px,5.2cqi,92px);font-family:var(--mgn-hand);font-size:22px;color:var(--mgn-pen)}
.mgn-index-foot{margin-top:clamp(24px,4cqi,56px);font-size:12px;letter-spacing:.06em;color:color-mix(in oklab,var(--mgn-ink) 60%,var(--mgn-paper))}

/* cover */
.mgn-cover{display:grid;place-items:center;overflow:hidden;padding-top:60px;touch-action:pan-y}
.mgn-canvas{position:absolute;inset:0;width:100%;height:100%;max-width:none;pointer-events:none;z-index:3}
.mgn-cover-in{position:relative;display:flex;flex-direction:column;align-items:center}
.mgn-title{display:flex;white-space:nowrap;font-size:clamp(78px,21.5cqi,370px);color:var(--fg);margin:0;position:relative;z-index:1}
.mgn-l{position:relative;display:inline-block;will-change:transform}
.mgn-lc{display:inline-block;overflow:hidden;padding:.08em .015em .16em;margin:-.08em -.015em -.16em}
.mgn-li{display:inline-block}
.mgn-orbit{position:absolute;left:50%;top:52%;width:0;height:0;pointer-events:none}
.mgn-orbit svg{position:absolute;overflow:visible;left:0;top:0}
.mgn-orbit-back{z-index:-1}
.mgn-star{position:absolute;left:0;top:0;width:0;height:0;z-index:2}
.mgn-star svg{position:absolute;left:-14px;top:-14px;width:28px;height:28px;overflow:visible}
.mgn-star path{fill:var(--mgn-pen);stroke:none}
.mgn-sig{position:absolute;right:-1%;top:-.55em;transform:rotate(-7deg);font-size:clamp(30px,4.4cqi,72px);white-space:nowrap;cursor:default;z-index:2}
.mgn-sig-arrow{position:absolute;right:calc(100% - .55em);top:.5em;width:2.3em;height:auto;aspect-ratio:150/110;stroke-width:2.1}
.mgn-pill-wrap{position:relative;margin-top:clamp(8px,1.2cqi,18px);align-self:flex-end;margin-right:6%}
.mgn-pill{position:relative;display:inline-block;padding:.32em 1.1em .36em;border:1.5px solid currentColor;border-radius:999px;font-size:clamp(12px,1.35cqi,19px);font-weight:400;letter-spacing:.02em;color:var(--fg)}
.mgn-cover-meta{position:absolute;left:clamp(18px,5.2cqi,92px);right:clamp(18px,5.2cqi,92px);bottom:clamp(20px,3cqi,40px);display:flex;justify-content:space-between;align-items:flex-end;gap:16px;font-size:12px;letter-spacing:.06em;color:var(--muted)}
.mgn-hint{display:flex;align-items:center;gap:6px;font-family:var(--mgn-hand);font-size:22px;letter-spacing:0;color:var(--mgn-pen)}
.mgn-hint svg{width:22px;height:40px;animation:mgn-bob 2.2s ease-in-out infinite}
@keyframes mgn-bob{0%,100%{transform:translateY(-3px)}50%{transform:translateY(5px)}}

/* hello */
.mgn-two{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:clamp(32px,6cqi,110px);align-items:center;max-width:1500px;margin:0 auto}
.mgn-traits{position:relative;width:100%;max-width:560px;aspect-ratio:500/520;margin:0 auto}
.mgn-traits>svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.mgn-portrait{position:absolute;left:27%;top:17%;width:46%;height:66%}
.mgn-portrait-img{position:absolute;inset:0;overflow:hidden;border-radius:4px;background:color-mix(in oklab,var(--mgn-ink) 10%,var(--mgn-paper))}
.mgn-portrait-img img{width:100%;height:100%;max-width:none;object-fit:cover;filter:grayscale(1) contrast(1.05);transform:scale(1.04);transition:filter .7s ease,transform 1.2s cubic-bezier(.2,.7,.2,1)}
.mgn-portrait:hover .mgn-portrait-img img{filter:grayscale(0) contrast(1);transform:scale(1.09)}
.mgn-trait{position:absolute;transform:translate(-50%,-50%);font-size:clamp(17px,1.9cqi,27px);white-space:nowrap}
.mgn-hello-copy .mgn-h2{font-size:clamp(64px,10.5cqi,180px)}
.mgn-hello-copy .mgn-p{max-width:52ch;margin-top:clamp(18px,2.4cqi,34px);text-align:justify;hyphens:auto}

/* education */
.mgn-edu{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,1fr);gap:clamp(32px,6cqi,110px);max-width:1500px;margin:0 auto;align-items:start}
.mgn-edu-intro{max-width:46ch;margin-top:clamp(14px,2cqi,28px)}
.mgn-edu-list{list-style:none;padding:0;margin:clamp(26px,3.4cqi,52px) 0 0;display:grid;gap:clamp(16px,1.8cqi,26px)}
.mgn-edu-list li{display:grid;grid-template-columns:auto minmax(0,1fr);gap:14px;align-items:baseline}
.mgn-edu-list li::before{content:"";width:6px;height:6px;border-radius:50%;background:var(--fg);transform:translateY(-3px)}
.mgn-edu-t{font-weight:500;font-size:clamp(14px,1.2cqi,18px)}
.mgn-edu-s{font-size:clamp(12px,.98cqi,14px);color:var(--muted);margin-top:3px}
.mgn-qr-wrap{position:relative;display:grid;grid-template-columns:auto 1fr;gap:clamp(16px,2.4cqi,36px);align-items:center}
.mgn-qr{position:relative;display:block;width:clamp(120px,13cqi,190px);padding:10px;background:#fff;border-radius:10px;box-shadow:0 18px 40px -22px rgba(0,0,0,.35);transform:rotate(-2deg);transition:transform .5s cubic-bezier(.2,.8,.2,1)}
.mgn-qr:hover{transform:rotate(0deg) scale(1.06)}
.mgn-qr svg{display:block;width:100%;height:auto}
.mgn-qr-tag{position:absolute;left:8px;top:-22px;font-family:var(--mgn-hand);font-size:17px;color:var(--mgn-pen)}
.mgn-cvnote{position:relative;font-size:clamp(24px,2.6cqi,38px);max-width:7em}
.mgn-cvnote svg{display:block;width:clamp(60px,6cqi,90px);height:auto;aspect-ratio:90/60;margin:0 0 6px -6px}
.mgn-langs{margin-top:clamp(40px,5cqi,80px)}
.mgn-langs h3{font-family:var(--mgn-display);font-weight:400;font-size:clamp(30px,3.6cqi,56px);margin:0 0 clamp(14px,1.8cqi,24px);color:var(--fg)}
.mgn-lang{display:grid;grid-template-columns:6.5em 3.5em minmax(0,1fr);align-items:center;gap:14px;padding:10px 0;border-top:1px solid var(--rule);font-size:clamp(13px,1.05cqi,15px)}
.mgn-lang b{font-weight:500}
.mgn-lang svg{width:100%;height:16px;overflow:visible}

/* skills */
.mgn-skills{max-width:1500px;margin:0 auto}
.mgn-skills-top{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);gap:clamp(32px,6cqi,110px);align-items:end}
.mgn-tools{position:relative;display:flex;flex-wrap:wrap;gap:clamp(10px,1.2cqi,16px);margin-top:clamp(26px,3cqi,44px);padding:14px 18px;width:max-content;max-width:100%}
.mgn-tool{position:relative;width:clamp(48px,4.6cqi,64px);aspect-ratio:1;border-radius:24%;display:grid;place-items:center;font-weight:600;font-size:clamp(16px,1.6cqi,22px);letter-spacing:-.02em;box-shadow:0 10px 22px -14px rgba(0,0,0,.6);transition:transform .45s cubic-bezier(.2,.9,.2,1.3);font-family:var(--mgn-body)}
.mgn-tool:hover,.mgn-tool:focus-visible,.mgn-tool[data-on=true]{transform:translateY(-8px) rotate(-6deg) scale(1.08)}
.mgn-tool-note{min-height:2.2em;margin-top:6px;font-size:clamp(20px,2cqi,28px);padding-left:18px}
.mgn-books{position:relative;justify-self:center;width:min(100%,360px)}
.mgn-books>svg{display:block;width:100%;height:auto;overflow:visible}
.mgn-books-note{position:absolute;right:-4%;top:-6%;font-size:clamp(20px,2.1cqi,30px);transform:rotate(6deg);text-align:right;width:7em}
.mgn-skills-low{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.4fr);gap:clamp(32px,6cqi,110px);margin-top:clamp(40px,5cqi,80px);align-items:start}
.mgn-skill-list{list-style:none;margin:0;padding:0;columns:2;column-gap:clamp(20px,3cqi,48px)}
.mgn-skill-list li{position:relative;padding:7px 0 7px 18px;break-inside:avoid;font-size:clamp(13px,1.1cqi,16px);border-bottom:1px solid var(--rule);transition:color .3s,padding .3s}
.mgn-skill-list li::before{content:"";position:absolute;left:2px;top:50%;width:6px;height:6px;border-radius:50%;background:var(--fg);transform:translateY(-50%);transition:background .3s,transform .3s}
.mgn-skill-list li:hover{padding-left:24px;color:var(--mgn-pen)}
.mgn-skill-list li:hover::before{background:var(--mgn-pen);transform:translateY(-50%) scale(1.5)}
.mgn-more{display:flex;align-items:center;gap:14px;margin-top:clamp(26px,3cqi,40px);font-size:clamp(20px,2cqi,28px)}
.mgn-more svg{width:clamp(56px,5cqi,74px);height:auto;flex:none}

/* projects deal */
.mgn-deal{display:block;height:calc(var(--mgn-h) * 2.3);padding:0}
.mgn-deal-stage{position:sticky;top:0;height:var(--mgn-h);min-height:560px;display:flex;flex-direction:column;padding:clamp(70px,7.5cqi,120px) clamp(18px,5.2cqi,92px) clamp(30px,4cqi,60px);overflow:hidden}
.mgn-deal-head{display:flex;justify-content:space-between;align-items:flex-start;gap:24px}
.mgn-deal-note{position:relative;font-size:clamp(20px,2.1cqi,30px);max-width:12em;text-align:right;transform:rotate(-3deg);margin-top:.6em}
.mgn-row{position:relative;flex:1;display:flex;justify-content:center;align-items:center;gap:clamp(14px,2.4cqi,40px);flex-wrap:nowrap;min-height:0}
.mgn-card{position:relative;flex:none;width:clamp(78px,14.2cqi,210px);display:flex;flex-direction:column;align-items:center;will-change:transform}
.mgn-card>button{display:block;width:100%;border-radius:16%/7.4%;transition:transform .45s cubic-bezier(.2,.9,.2,1.2)}
.mgn-card>button:hover,.mgn-card>button:focus-visible{transform:translateY(-12px) scale(1.04)}
.mgn-card-label{margin-top:clamp(12px,1.4cqi,20px);font-size:clamp(17px,1.9cqi,27px);white-space:nowrap}
.mgn-card-tag{position:absolute;bottom:calc(100% + 6px);left:50%;transform:translateX(-50%) rotate(-4deg);font-size:clamp(15px,1.6cqi,23px);white-space:nowrap;display:flex;flex-direction:column;align-items:center}
.mgn-card-tag svg{width:24px;height:30px}
.mgn-card:nth-child(even) .mgn-card-tag{transform:translateX(-50%) rotate(4deg)}

/* phone */
.mgn-phone{position:relative;width:100%;aspect-ratio:9/19.5;container-type:inline-size}
.mgn-phone-body{position:absolute;inset:0;border-radius:15cqw;background:#121214;padding:3.4cqw;box-shadow:0 0 0 .7cqw #3a3a3f inset,0 40px 70px -30px rgba(0,0,0,.55),0 14px 24px -14px rgba(0,0,0,.4)}
.mgn-screen{position:relative;width:100%;height:100%;border-radius:12cqw;overflow:hidden;background:#f7f6f3;color:#18181a;font-family:var(--mgn-body);font-weight:400;line-height:1.2;isolation:isolate}
.mgn-island{position:absolute;left:50%;top:2.6cqw;width:28cqw;height:8cqw;border-radius:99px;background:#0b0b0c;transform:translateX(-50%);z-index:5}
.mgn-status{position:absolute;left:0;right:0;top:0;height:13cqw;display:flex;justify-content:space-between;align-items:center;padding:1cqw 9cqw 0;font-size:4.2cqw;font-weight:600;z-index:4}
.mgn-status i{display:flex;gap:1.4cqw;align-items:center}
.mgn-status i b{display:block;width:6cqw;height:3.2cqw;border-radius:1cqw;border:.5cqw solid currentColor}
.mgn-status i s{display:block;width:4cqw;height:3cqw;background:currentColor;clip-path:polygon(0 100%,100% 0,100% 100%)}
.mgn-scr-img{position:absolute;width:100%;height:100%;max-width:none;object-fit:cover}
.mgn-tabbar{position:absolute;left:5cqw;right:5cqw;bottom:4cqw;height:13cqw;border-radius:99px;background:rgba(255,255,255,.92);box-shadow:0 2cqw 6cqw rgba(0,0,0,.12);display:flex;justify-content:space-around;align-items:center;z-index:3}
.mgn-tabbar span{width:4.4cqw;height:4.4cqw;border-radius:50%;background:#c9c8c3}
.mgn-bars{display:grid;gap:1.8cqw}
.mgn-bars span{display:block;height:2.4cqw;border-radius:2cqw;background:#dcdad4}
.mgn-chip{display:inline-block;padding:1.8cqw 4cqw;border-radius:99px;font-size:3.6cqw;background:#ebe9e3;white-space:nowrap}

/* case studies */
.mgn-case{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.05fr);gap:clamp(32px,6cqi,110px);align-items:center;max-width:1560px;margin:0 auto}
.mgn-case-wrap[data-flip=true] .mgn-case-copy{order:2}
.mgn-eyebrow{font-size:clamp(19px,1.9cqi,27px)}
.mgn-case-title{font-size:clamp(56px,8.2cqi,140px);margin:.12em 0 0;color:var(--fg)}
.mgn-case-title em{font-style:normal;color:var(--mgn-pen)}
.mgn-case-copy .mgn-p{max-width:50ch;margin-top:clamp(16px,2cqi,28px)}
.mgn-challenge{position:relative;margin-top:clamp(22px,2.6cqi,38px);display:grid;grid-template-columns:auto minmax(0,1fr);gap:18px;align-items:start;max-width:34em}
.mgn-challenge-l{font-size:clamp(20px,2cqi,28px);white-space:nowrap;padding:2px 8px}
.mgn-challenge-t{font-size:clamp(13px,1.05cqi,15px);line-height:1.6;padding:4px 10px;border:1px solid var(--mgn-pen);border-radius:4px;color:var(--fg)}
.mgn-stats{display:flex;flex-wrap:wrap;gap:clamp(18px,3cqi,44px);margin-top:clamp(26px,3cqi,44px)}
.mgn-stat{display:flex;align-items:center;gap:12px;max-width:15em}
.mgn-stat-n{font-size:clamp(30px,3.4cqi,52px);padding:.06em .3em;white-space:nowrap}
.mgn-stat-l{font-size:clamp(12px,.95cqi,14px);line-height:1.45;color:var(--muted)}
.mgn-visit{display:inline-flex;align-items:center;gap:8px;margin-top:clamp(22px,2.6cqi,36px);font-family:var(--mgn-hand);font-size:clamp(20px,2cqi,28px);color:var(--mgn-pen)}
.mgn-visit svg{width:34px;height:16px;transition:transform .3s}
.mgn-visit:hover svg{transform:translateX(6px)}
.mgn-trio{position:relative;width:100%;max-width:620px;aspect-ratio:1/1.08;margin:0 auto;perspective:1400px}
.mgn-trio-p{position:absolute}
.mgn-trio-p[data-slot="0"]{left:3%;top:13%;width:35%;z-index:1}
.mgn-trio-p[data-slot="1"]{left:31%;top:2%;width:38%;z-index:3}
.mgn-trio-p[data-slot="2"]{right:3%;top:16%;width:35%;z-index:2}
.mgn-tilt{transform-style:preserve-3d;will-change:transform}
.mgn-trio-p[data-slot="0"] .mgn-tilt{transform:rotate(-7deg)}
.mgn-trio-p[data-slot="2"] .mgn-tilt{transform:rotate(6deg)}
.mgn-case-note{position:absolute;z-index:4;font-size:clamp(19px,1.9cqi,27px);max-width:9em;line-height:1.05}
.mgn-case-note svg{display:block;width:60px;height:46px}
.mgn-case-wrap .mgn-case-note{left:-2%;bottom:2%;transform:rotate(-5deg)}
.mgn-case-wrap[data-flip=true] .mgn-case-note{left:auto;right:-2%;text-align:right;transform:rotate(5deg)}

/* facts */
.mgn-facts{max-width:1400px;margin:0 auto}
.mgn-facts-head{display:flex;justify-content:space-between;align-items:flex-end;gap:24px}
.mgn-facts-note{font-size:clamp(21px,2.2cqi,32px);max-width:10em;transform:rotate(-4deg);margin-bottom:1.2em}
.mgn-facts-note svg{display:block;width:70px;height:50px;margin:6px 0 0 40%}
.mgn-fact-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:clamp(30px,5cqi,80px) clamp(20px,4cqi,64px);margin-top:clamp(40px,5cqi,80px)}
.mgn-fact{display:flex;flex-direction:column;align-items:flex-start;gap:10px;text-align:left}
.mgn-fact:nth-child(3n+2){transform:translateY(clamp(20px,3cqi,50px))}
.mgn-fact:nth-child(3n){transform:translateY(clamp(-10px,-1cqi,-4px))}
.mgn-fact svg{width:clamp(64px,7cqi,104px);height:auto;aspect-ratio:1;transform-origin:50% 80%}
.mgn-fact:hover svg,.mgn-fact:focus-visible svg{animation:mgn-wiggle .7s ease-in-out}
@keyframes mgn-wiggle{0%,100%{transform:rotate(0)}25%{transform:rotate(-9deg)}55%{transform:rotate(7deg)}80%{transform:rotate(-3deg)}}
.mgn-fact-t{font-size:clamp(21px,2.2cqi,32px);max-width:11em}
.mgn-fact:nth-child(odd) .mgn-fact-t{transform:rotate(-2deg)}
.mgn-fact:nth-child(even) .mgn-fact-t{transform:rotate(1.5deg)}

/* thanks */
.mgn-thanks{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:clamp(32px,6cqi,110px);align-items:center;max-width:1500px;margin:0 auto;min-height:calc(var(--mgn-h) - 220px)}
.mgn-avatar{position:relative;width:clamp(96px,10cqi,150px);aspect-ratio:1}
.mgn-avatar img{width:100%;height:100%;max-width:none;object-fit:cover;border-radius:50%;filter:grayscale(1)}
.mgn-thanks-title{font-size:clamp(58px,7.8cqi,140px);margin:clamp(18px,2.4cqi,34px) 0 0;color:var(--fg)}
.mgn-touch{margin-top:clamp(18px,2.2cqi,30px);display:grid;gap:6px;font-size:clamp(13px,1.08cqi,16px)}
.mgn-touch b{font-weight:600}
.mgn-email{position:relative;justify-self:start;font-weight:400;font-size:clamp(14px,1.25cqi,18px);text-align:left;color:var(--fg)}
.mgn-email .mgn-draw{stroke-dashoffset:1;transition:stroke-dashoffset .5s cubic-bezier(.6,0,.2,1)}
.mgn-email:hover .mgn-draw,.mgn-email:focus-visible .mgn-draw{stroke-dashoffset:0}
.mgn-copied{position:absolute;left:100%;top:-.9em;margin-left:10px;font-family:var(--mgn-hand);font-size:20px;color:var(--mgn-pen);white-space:nowrap;opacity:0;transform:translateY(6px) rotate(-6deg);transition:opacity .3s,transform .3s}
.mgn-copied[data-on=true]{opacity:1;transform:translateY(0) rotate(-6deg)}
.mgn-links{display:flex;flex-wrap:wrap;gap:6px 22px;margin-top:clamp(18px,2.4cqi,32px)}
.mgn-links a{position:relative;font-family:var(--mgn-hand);font-size:clamp(20px,2cqi,28px);color:var(--mgn-pen)}
.mgn-links a .mgn-draw{stroke-dashoffset:1;transition:stroke-dashoffset .45s cubic-bezier(.6,0,.2,1)}
.mgn-links a:hover .mgn-draw,.mgn-links a:focus-visible .mgn-draw{stroke-dashoffset:0}
.mgn-letter{font-size:clamp(21px,2.05cqi,30px);line-height:1.22;max-width:21em;justify-self:end}
.mgn-letter p{margin:0 0 .8em}
.mgn-signature{position:relative;display:inline-block;font-size:1.5em;margin-top:.2em;transform:rotate(-4deg)}
.mgn-foot{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:16px;padding-top:clamp(36px,5cqi,70px);margin-top:clamp(36px,5cqi,70px);border-top:1px solid var(--rule);font-size:12px;letter-spacing:.06em;color:var(--muted);max-width:1500px;margin-left:auto;margin-right:auto}
.mgn-foot button{font-family:var(--mgn-hand);font-size:21px;letter-spacing:0;color:var(--mgn-pen);display:flex;align-items:center;gap:6px}

@container (max-width:860px){
  .mgn-two,.mgn-edu,.mgn-skills-top,.mgn-skills-low,.mgn-case,.mgn-thanks{grid-template-columns:minmax(0,1fr)}
  .mgn-case-wrap[data-flip=true] .mgn-case-copy{order:0}
  .mgn-books{justify-self:start;width:min(80%,320px)}
  .mgn-letter{justify-self:start}
  .mgn-hello-copy .mgn-p{text-align:left;hyphens:manual}
  .mgn-sig{right:2%}
  .mgn-row{flex-wrap:wrap;align-content:center;gap:34px 18px}
  .mgn-card{width:clamp(76px,25cqi,170px)}
  .mgn-deal-head,.mgn-facts-head{flex-direction:column;align-items:flex-start}
  .mgn-facts-head .mgn-hd{order:-1}
  .mgn-deal-note{text-align:left}
  .mgn-fact-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
  .mgn-fact:nth-child(n){transform:none}
  .mgn-fact:nth-child(even){transform:translateY(26px)}
}
@container (max-width:520px){
  .mgn-bar{grid-template-columns:auto 1fr;font-size:11px}
  .mgn-bar>:first-child{display:none}
  .mgn-bar>:nth-child(2){justify-self:start}
  .mgn-bar-name{display:none}
  .mgn-skill-list{columns:1}
  .mgn-index ol{grid-template-columns:minmax(0,1fr);grid-auto-flow:row;grid-template-rows:none}
  .mgn-card{width:23cqi}
  .mgn-row{gap:22px 12px}
  .mgn-deal-stage{padding-top:64px}
  .mgn-card-tag{display:none}
  .mgn-lang{grid-template-columns:5.5em 3em minmax(0,1fr)}
  .mgn-qr-wrap{grid-template-columns:minmax(0,1fr)}
}
@media (prefers-reduced-motion:reduce){
  .mgn-deal{height:auto}
  .mgn-deal-stage{position:relative;height:auto;min-height:var(--mgn-h)}
  .mgn-hint svg,.mgn-fact:hover svg,.mgn-note-swap{animation:none}
  .mgn-index,.mgn-index[data-open=true]{transition:none}
  .mgn-portrait-img img,.mgn-tool,.mgn-card>button,.mgn-qr{transition:none}
}
`

/* ------------------------------------------------------------- primitives */

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, MorphSVGPlugin)

const useIso = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect

function reducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function photo(url: string, w: number): string {
  if (!/^https:\/\/images\.unsplash\.com\//.test(url) || url.includes("?")) return url
  return url + "?auto=format&fit=crop&w=" + w + "&q=72"
}

type MarkKind = "oval" | "under" | "box"

/** A pen mark sized to its parent: an oval round it, a line under it, or a sketchy box. */
function PenMark({ kind, seed = 1, padX = 10, padY = 6 }: { kind: MarkKind; seed?: number; padX?: number; padY?: number }) {
  const ref = React.useRef(null as SVGSVGElement | null)
  const [box, setBox] = React.useState({ w: 0, h: 0 })
  useIso(() => {
    const host = ref.current && ref.current.parentElement
    if (!host) return
    const measure = () => {
      const w = host.offsetWidth
      const h = host.offsetHeight
      setBox((b) => (b.w === w && b.h === h ? b : { w, h }))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(host)
    return () => ro.disconnect()
  }, [])
  const W = Math.max(1, box.w + padX * 2)
  const H = Math.max(1, box.h + padY * 2)
  const d =
    kind === "oval" ? ovalPath(W, H, seed) : kind === "under" ? underlinePath(W, H, seed) : boxPath(box.w, box.h, seed)
  const vb = kind === "box" ? -padX + " " + -padY + " " + W + " " + H : "0 0 " + W + " " + H
  return (
    <svg ref={ref} className="mgn-mark" aria-hidden="true" viewBox={vb} style={{ left: -padX, top: -padY, width: W, height: H }}>
      <path className="mgn-draw" pathLength={1} d={d} />
    </svg>
  )
}

/** Text with *underlined* and [circled] phrases. */
function Marked({ text, seed = 1 }: { text: string; seed?: number }) {
  return (
    <>
      {parseMarks(text).map((m, i) =>
        m.mark ? (
          <span key={i} className="mgn-mk">
            {m.text}
            <PenMark kind={m.mark} seed={seed + i} padX={m.mark === "oval" ? 9 : 1} padY={m.mark === "oval" ? 4 : 7} />
          </span>
        ) : (
          <React.Fragment key={i}>{m.text}</React.Fragment>
        ),
      )}
    </>
  )
}

/** Word-wrapped text split into masked characters for the rise-in. */
function Split({ text }: { text: string }) {
  const words = text.split(" ")
  return (
    <span className="mgn-split" aria-label={text} role="text">
      {words.map((w, wi) => (
        <React.Fragment key={wi}>
          <span className="mgn-w" aria-hidden="true">
            {Array.from(w).map((c, ci) => (
              <span key={ci} className="mgn-c">
                <span className="mgn-ci">{c}</span>
              </span>
            ))}
          </span>
          {wi < words.length - 1 ? " " : null}
        </React.Fragment>
      ))}
    </span>
  )
}

/** A big serif heading whose pen underline morphs from a zig-zag into a swoosh. */
function Heading({ text, seed, className }: { text: string; seed: number; className?: string }) {
  const m = React.useMemo(() => underlineMorph(300, seed), [seed])
  return (
    <div className="mgn-hd">
      <h2 className={"mgn-display mgn-h2" + (className ? " " + className : "")}>
        <Split text={text} />
      </h2>
      <svg className="mgn-uline" viewBox="0 0 300 26" aria-hidden="true">
        <path className="mgn-morph mgn-draw" pathLength={1} d={m.to} data-from={m.from} data-to={m.to} />
      </svg>
    </div>
  )
}

function Arrow({ a, b, bend = 0.2, head = 9 }: { a: Pt; b: Pt; bend?: number; head?: number }) {
  const p = arrowPaths(a, b, bend, head)
  return (
    <g>
      <path className="mgn-draw" pathLength={1} d={p.shaft} />
      <path className="mgn-draw" pathLength={1} d={p.head} />
    </g>
  )
}

const DOODLES: { [k: string]: string[] } = {
  guitar: [
    "M25 33c-7-2-13 3-13 10 0 8 7 13 14 13 7 0 11-5 12-10 1-4 4-5 6-8 3-4 1-9-3-10-4-1-6 1-8 3-2 2-3 4-8 2z",
    "M30 44a4.5 4.5 0 1 1-9 0a4.5 4.5 0 1 1 9 0",
    "M33 38L51 20",
    "M36 41L54 23",
    "M50 15l7 7-3 3-7-7z",
    "M19 51L55 18",
  ],
  dumbbell: ["M21 32h22", "M9 23h6v18H9z", "M15 19h6v26h-6z", "M49 23h6v18h-6z", "M43 19h6v26h-6z", "M5 32h4M55 32h4"],
  music: [
    "M23 51c-3 0-6-2-6-4.5s3-4.5 6-4.5 6 2 6 4.5-3 4.5-6 4.5z",
    "M46 45c-3 0-6-2-6-4.5s3-4.5 6-4.5 6 2 6 4.5-3 4.5-6 4.5z",
    "M29 47V17",
    "M52 41V11",
    "M29 17L52 11",
    "M29 24L52 18",
  ],
  plane: ["M7 31L57 10L45 53L32 39Z", "M32 39L57 10", "M32 39v12l6-7", "M5 46c5 3 10 3 15 0", "M9 54c4 2 8 2 11 0"],
  coffee: [
    "M14 27h30v11c0 9-6 15-15 15S14 47 14 38z",
    "M44 31c6 0 8 3 8 6s-3 6-8 6",
    "M9 57h40",
    "M22 21c-3-3 3-6 0-10",
    "M30 21c-3-3 3-6 0-10",
    "M38 21c-3-3 3-6 0-10",
  ],
  camera: [
    "M12 21h40a4 4 0 0 1 4 4v23a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4V25a4 4 0 0 1 4-4z",
    "M22 21l4-7h12l4 7",
    "M42 37a10 10 0 1 1-20 0a10 10 0 1 1 20 0",
    "M37 37a5 5 0 1 1-10 0a5 5 0 1 1 10 0",
    "M47 27h4",
  ],
  plant: [
    "M20 40h24l-3 17H23z",
    "M17 40h30",
    "M32 40V21",
    "M32 31c-9 0-15-6-15-15 9 0 15 6 15 15z",
    "M32 25c7 0 13-5 13-13-8 0-13 5-13 13z",
  ],
  book: [
    "M32 18c-6-4-14-5-24-4v34c10-1 18 0 24 4 6-4 14-5 24-4V14c-10-1-18 0-24 4z",
    "M32 18v34",
    "M14 24c4 0 8 0 12 2",
    "M14 31c4 0 8 0 12 2",
    "M38 26c4-2 8-2 12-2",
    "M38 33c4-2 8-2 12-2",
  ],
  headphones: [
    "M12 40v-8a20 20 0 0 1 40 0v8",
    "M10 38h6v15h-6a2 2 0 0 1-2-2V40a2 2 0 0 1 2-2z",
    "M48 38h6a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-6z",
  ],
  globe: [
    "M54 32a22 22 0 1 1-44 0a22 22 0 1 1 44 0",
    "M32 10c-9 6-9 38 0 44",
    "M32 10c9 6 9 38 0 44",
    "M11 25h42",
    "M11 39h42",
  ],
  cat: [
    "M14 24l4-13 10 8h8l10-8 4 13c3 5 4 10 2 15-3 9-12 13-20 13s-17-4-20-13c-2-5-1-10 2-15z",
    "M24 32v3",
    "M40 32v3",
    "M29 41l3 2 3-2",
    "M6 38l13 2M6 45l13-1",
    "M58 38l-13 2M58 45l-13-1",
  ],
  pencil: ["M12 52l4-13 27-27 9 9-27 27z", "M16 39l9 9", "M38 17l9 9", "M12 52l9-4", "M5 58c10-3 20 2 30-1"],
  mountain: ["M5 53L24 22l10 16 8-10 17 25z", "M50 16a6 6 0 1 1-12 0a6 6 0 1 1 12 0", "M18 32l6 5 5-5"],
}

function Doodle({ kind }: { kind: MgnDoodle }) {
  const paths = kind === "heart" ? [heartPath(32, 32, 22)] : DOODLES[kind] || DOODLES.pencil
  return (
    <svg viewBox="0 0 64 64" className="mgn-ink" aria-hidden="true">
      {paths.map((d, i) => (
        <path key={i} className="mgn-draw" pathLength={1} d={d} />
      ))}
    </svg>
  )
}

function FigmaMark() {
  return (
    <svg viewBox="0 0 38 57" width="44%" aria-hidden="true">
      <path d="M19 0H9.5a9.5 9.5 0 0 0 0 19H19z" fill="#f24e1e" />
      <path d="M19 0h9.5a9.5 9.5 0 0 1 0 19H19z" fill="#ff7262" />
      <path d="M9.5 19a9.5 9.5 0 0 0 0 19H19V19z" fill="#a259ff" />
      <circle cx="28.5" cy="28.5" r="9.5" fill="#1abcfe" />
      <path d="M9.5 38a9.5 9.5 0 1 0 9.5 9.5V38z" fill="#0acf83" />
    </svg>
  )
}

function QRCode({ text }: { text: string }) {
  const g = React.useMemo(() => qrMatrix(text), [text])
  if (!g) return null
  const n = g.length
  let d = ""
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (g[y][x]) d += "M" + x + " " + y + "h1v1h-1z"
  return (
    <svg viewBox={"-2 -2 " + (n + 4) + " " + (n + 4)} shapeRendering="crispEdges" role="img" aria-label={"QR code: " + text}>
      <path d={d} fill="#141416" />
    </svg>
  )
}

function BookStack({ books }: { books: { title: string; color: string }[] }) {
  const list = books.slice(0, 7)
  const R = rand(5)
  const bh = 30
  const base = list.length * bh + 64
  return (
    <svg viewBox={"0 0 260 " + (base + 6)} aria-hidden="true">
      <g className="mgn-ink">
        <path className="mgn-draw" pathLength={1} d={handLine(6, 254, base + 2, 3)} />
      </g>
      {list.map((b, i) => {
        const w = 168 + R() * 56
        const x = (260 - w) / 2 + (R() - 0.5) * 22
        const y = base - (i + 1) * bh
        const rot = (R() - 0.5) * 5
        const dark = !isLight(b.color)
        const title = b.title.toUpperCase()
        return (
          <g key={i} transform={"rotate(" + rot.toFixed(2) + " " + (x + w / 2).toFixed(1) + " " + (y + bh / 2).toFixed(1) + ")"}>
            <rect x={x} y={y} width={w} height={bh - 3} rx={3} fill={b.color} stroke="rgba(0,0,0,.28)" strokeWidth={0.7} />
            <rect x={x + 9} y={y} width={4} height={bh - 3} fill={dark ? "rgba(255,255,255,.22)" : "rgba(0,0,0,.12)"} />
            <rect x={x + w - 13} y={y} width={4} height={bh - 3} fill={dark ? "rgba(255,255,255,.22)" : "rgba(0,0,0,.12)"} />
            <text
              x={x + w / 2}
              y={y + bh / 2 + 2}
              textAnchor="middle"
              fontSize={9}
              fill={dark ? "#f4f2ec" : "#232325"}
              textLength={Math.min(w - 42, title.length * 6.2)}
              lengthAdjust="spacingAndGlyphs"
              style={{ fontFamily: "var(--mgn-body)", fontWeight: 500, letterSpacing: ".06em" }}
            >
              {title}
            </text>
          </g>
        )
      })}
      <g className="mgn-ink" transform={"translate(104 " + (base - list.length * bh - 52) + ")"}>
        <path className="mgn-draw" pathLength={1} d="M10 22h30v10c0 8-6 13-15 13S10 40 10 32z" />
        <path className="mgn-draw" pathLength={1} d="M40 25c6 0 7 3 7 5s-2 6-7 6" />
        <path className="mgn-draw" pathLength={1} d="M19 16c-3-3 3-6 0-10M29 16c-3-3 3-6 0-10" />
      </g>
    </svg>
  )
}

/* ----------------------------------------------------------------- phones */

function Pic({ src, alt = "" }: { src: string; alt?: string }) {
  if (!src) return <div className="mgn-scr-img" style={{ background: "linear-gradient(160deg,#d9d6ce,#a9a59b)" }} />
  return <img className="mgn-scr-img" src={src} alt={alt} loading="lazy" decoding="async" draggable={false} />
}

function Status({ light }: { light?: boolean }) {
  return (
    <div className="mgn-status" style={{ color: light ? "#fff" : "#18181a" }}>
      <span>9:41</span>
      <i>
        <s />
        <b />
      </i>
    </div>
  )
}

function Tabbar({ accent, on = 0 }: { accent: string; on?: number }) {
  return (
    <div className="mgn-tabbar">
      {[0, 1, 2, 3].map((k) => (
        <span key={k} style={k === on ? { background: accent, width: "11cqw", borderRadius: "99px" } : undefined} />
      ))}
    </div>
  )
}

function Screen({ kind, p, shift }: { kind: MgnScreen; p: MgnProject; shift: number }) {
  const accent = p.accent || "#7d84ef"
  const n = Math.max(1, p.images.length)
  const im = (k: number) => photo(p.images[(shift + k) % n] || "", 520)
  const abs = { position: "absolute" } as React.CSSProperties

  if (kind === "cover")
    return (
      <div className="mgn-screen">
        <Pic src={im(0)} />
        <div style={{ ...abs, inset: 0, background: "linear-gradient(180deg,rgba(0,0,0,.3) 0%,rgba(0,0,0,0) 26%,rgba(0,0,0,.08) 48%,rgba(0,0,0,.84) 100%)" }} />
        <Status light />
        <div style={{ ...abs, left: "8cqw", right: "8cqw", bottom: "9cqw", color: "#fff" }}>
          <div style={{ fontFamily: "var(--mgn-display)", fontSize: "15cqw", lineHeight: 0.95 }}>{p.name}</div>
          <div style={{ fontSize: "4.4cqw", opacity: 0.86, marginTop: "3cqw", lineHeight: 1.35 }}>{p.tagline || p.kind}</div>
          <div style={{ marginTop: "7cqw", height: "13cqw", borderRadius: 99, background: accent, display: "grid", placeItems: "center", fontSize: "4.4cqw", fontWeight: 600 }}>
            Get started
          </div>
          <div style={{ display: "flex", gap: "1.6cqw", justifyContent: "center", marginTop: "5cqw" }}>
            {[0, 1, 2].map((k) => (
              <span key={k} style={{ width: k ? "1.8cqw" : "6cqw", height: "1.8cqw", borderRadius: 99, background: k ? "rgba(255,255,255,.5)" : "#fff" }} />
            ))}
          </div>
        </div>
      </div>
    )

  if (kind === "detail")
    return (
      <div className="mgn-screen">
        <div style={{ ...abs, left: 0, right: 0, top: 0, height: "58%" }}>
          <Pic src={im(0)} />
        </div>
        <Status light />
        <div style={{ ...abs, top: "15cqw", left: "6cqw", right: "6cqw", display: "flex", justifyContent: "space-between", zIndex: 2 }}>
          {["‹", "♡"].map((c) => (
            <span key={c} style={{ width: "10cqw", height: "10cqw", borderRadius: "50%", background: "rgba(255,255,255,.92)", display: "grid", placeItems: "center", fontSize: "5.4cqw", color: "#18181a" }}>
              {c}
            </span>
          ))}
        </div>
        <div style={{ ...abs, left: 0, right: 0, bottom: 0, height: "50%", background: "#fff", borderRadius: "9cqw 9cqw 0 0", padding: "5cqw 7cqw 0" }}>
          <div style={{ width: "12cqw", height: "1.4cqw", borderRadius: 99, background: "#ddd", margin: "0 auto 5cqw" }} />
          <div style={{ fontSize: "7.2cqw", fontWeight: 600, lineHeight: 1.1 }}>{p.name}</div>
          <div style={{ fontSize: "3.6cqw", color: "#8a8984", marginTop: "1.4cqw" }}>{p.kind || p.tagline}</div>
          <div style={{ display: "flex", alignItems: "center", gap: "2cqw", marginTop: "3.4cqw", fontSize: "4.2cqw" }}>
            <span style={{ color: accent, letterSpacing: ".1em" }}>★★★★★</span>
            <span style={{ color: "#8a8984", fontSize: "3.4cqw" }}>4.9 · 2.1k</span>
          </div>
          <div className="mgn-bars" style={{ marginTop: "4cqw" }}>
            <span />
            <span style={{ width: "88%" }} />
            <span style={{ width: "64%" }} />
          </div>
          <div style={{ ...abs, left: "7cqw", right: "7cqw", bottom: "7cqw", height: "13cqw", borderRadius: 99, background: accent, color: "#fff", display: "grid", placeItems: "center", fontSize: "4.4cqw", fontWeight: 600 }}>
            Continue
          </div>
        </div>
      </div>
    )

  if (kind === "stats") {
    const pct = 68
    const C = 2 * Math.PI * 40
    const bars = [42, 66, 50, 92, 72, 34, 80]
    return (
      <div className="mgn-screen">
        <Status />
        <div style={{ ...abs, left: "7cqw", right: "7cqw", top: "15cqw" }}>
          <div style={{ fontSize: "3.8cqw", color: "#8a8984" }}>This week</div>
          <div style={{ fontSize: "7.4cqw", fontWeight: 600, marginTop: ".6cqw" }}>Your progress</div>
          <div style={{ position: "relative", width: "52cqw", height: "52cqw", margin: "6cqw auto 0" }}>
            <svg viewBox="0 0 100 100" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
              <circle cx="50" cy="50" r="40" fill="none" stroke="#e6e4de" strokeWidth="10" />
              <circle cx="50" cy="50" r="40" fill="none" stroke={accent} strokeWidth="10" strokeLinecap="round" strokeDasharray={(C * pct) / 100 + " " + C} />
            </svg>
            <div style={{ ...abs, inset: 0, display: "grid", placeContent: "center", textAlign: "center" }}>
              <div style={{ fontSize: "10cqw", fontWeight: 600 }}>{pct}%</div>
              <div style={{ fontSize: "3.4cqw", color: "#8a8984" }}>of your goal</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "2.6cqw", height: "22cqw", marginTop: "7cqw" }}>
            {bars.map((h, k) => (
              <span key={k} style={{ flex: 1, height: h + "%", borderRadius: "2cqw", background: accent, opacity: k === 3 ? 1 : 0.3 }} />
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "3cqw", color: "#8a8984", marginTop: "1.6cqw", padding: "0 1cqw" }}>
            {["M", "T", "W", "T", "F", "S", "S"].map((d, k) => (
              <span key={k}>{d}</span>
            ))}
          </div>
          {[0, 1].map((k) => (
            <div key={k} style={{ display: "flex", gap: "3cqw", alignItems: "center", marginTop: "5cqw" }}>
              <div style={{ position: "relative", width: "12cqw", height: "12cqw", borderRadius: "3cqw", overflow: "hidden", flex: "none" }}>
                <Pic src={im(k + 1)} />
              </div>
              <div className="mgn-bars" style={{ flex: 1 }}>
                <span style={{ width: k ? "62%" : "78%", background: "#cfccc5" }} />
                <span style={{ width: "44%" }} />
              </div>
            </div>
          ))}
        </div>
        <Tabbar accent={accent} on={2} />
      </div>
    )
  }

  // feed
  return (
    <div className="mgn-screen">
      <Status />
      <div style={{ ...abs, left: "7cqw", right: "7cqw", top: "15cqw" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "3.8cqw", color: "#8a8984" }}>Good morning</div>
            <div style={{ fontSize: "7.4cqw", fontWeight: 600, marginTop: ".6cqw" }}>{p.name}</div>
          </div>
          <span style={{ width: "10cqw", height: "10cqw", borderRadius: "50%", background: accent, opacity: 0.9 }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "2.4cqw", height: "11cqw", borderRadius: 99, background: "#ebe9e3", marginTop: "5cqw", padding: "0 4cqw", fontSize: "3.6cqw", color: "#8a8984" }}>
          <span style={{ width: "3.6cqw", height: "3.6cqw", borderRadius: "50%", border: ".6cqw solid #8a8984" }} />
          Search
        </div>
        <div style={{ display: "flex", gap: "2cqw", marginTop: "4cqw" }}>
          {["For you", "New", "Saved"].map((c, k) => (
            <span key={c} className="mgn-chip" style={k ? undefined : { background: accent, color: "#fff" }}>
              {c}
            </span>
          ))}
        </div>
        <div style={{ position: "relative", height: "66cqw", borderRadius: "7cqw", overflow: "hidden", marginTop: "4.6cqw" }}>
          <Pic src={im(0)} />
          <div style={{ ...abs, inset: 0, background: "linear-gradient(180deg,rgba(0,0,0,0) 45%,rgba(0,0,0,.7))" }} />
          <div style={{ ...abs, left: "5cqw", right: "5cqw", bottom: "4.6cqw", color: "#fff" }}>
            <div style={{ fontSize: "5.4cqw", fontWeight: 600 }}>{p.tagline ? p.tagline.split(/[,.]/)[0] : p.name}</div>
            <div style={{ fontSize: "3.4cqw", opacity: 0.8, marginTop: "1cqw" }}>Picked for you</div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3cqw", marginTop: "3cqw" }}>
          {[1, 2].map((k) => (
            <div key={k} style={{ position: "relative", height: "34cqw", borderRadius: "5cqw", overflow: "hidden" }}>
              <Pic src={im(k)} />
            </div>
          ))}
        </div>
      </div>
      <Tabbar accent={accent} />
    </div>
  )
}

function Phone({ p, kind, shift = 0 }: { p: MgnProject; kind: MgnScreen; shift?: number }) {
  return (
    <div className="mgn-phone" role="img" aria-label={p.name + " — " + kind + " screen"}>
      <div className="mgn-phone-body">
        <Screen kind={kind} p={p} shift={shift} />
        <span className="mgn-island" />
      </div>
    </div>
  )
}

function TiltPhone({ slot, p, kind }: { slot: number; p: MgnProject; kind: MgnScreen }) {
  const inner = React.useRef(null as HTMLDivElement | null)
  const move = (e: React.PointerEvent) => {
    if (!inner.current || e.pointerType === "touch" || reducedMotion()) return
    const r = e.currentTarget.getBoundingClientRect()
    const dx = (e.clientX - r.left) / r.width - 0.5
    const dy = (e.clientY - r.top) / r.height - 0.5
    gsap.to(inner.current, { rotationY: dx * 22, rotationX: -dy * 16, duration: 0.6, ease: "power3.out", overwrite: "auto" })
  }
  const leave = () => {
    if (inner.current) gsap.to(inner.current, { rotationY: 0, rotationX: 0, duration: 1, ease: "elastic.out(1,0.5)", overwrite: "auto" })
  }
  return (
    <div className="mgn-trio-p" data-slot={slot} data-depth={[0.7, 1, 0.4][slot]}>
      <div className="mgn-tilt" ref={inner} onPointerMove={move} onPointerLeave={leave}>
        <Phone p={p} kind={kind} shift={slot} />
      </div>
    </div>
  )
}

/* ----------------------------------------------------------------- sheets */

type SheetInfo = { id: string; label: string; tone: "paper" | "night"; morph: boolean }

function Sheet({ info, className, flip, children }: { info: SheetInfo; className?: string; flip?: boolean; children: React.ReactNode }) {
  return (
    <section
      className={"mgn-sheet" + (className ? " " + className : "")}
      data-tone={info.tone}
      data-sheet={info.id}
      data-sec=""
      data-label={info.label}
      data-flip={flip ? "true" : undefined}
    >
      {info.tone === "night" && <div className="mgn-sheet-bg" data-morph={info.morph ? "true" : undefined} />}
      <div className="mgn-grain" aria-hidden="true" />
      {children}
    </section>
  )
}

const ORBIT_TILT = (-18 * Math.PI) / 180

function Cover({ info, title, name, role, year, location, docLabel, inkTrail }: {
  info: SheetInfo; title: string; name: string; role: string; year: string; location: string; docLabel: string; inkTrail: boolean
}) {
  const chars = Array.from(title)
  let orbitAt = title.toLowerCase().lastIndexOf("o")
  if (orbitAt < 0) orbitAt = chars.length - 1
  const sparkle = React.useMemo(() => sparklePath(0, 0, 13), [])
  const heart = React.useMemo(() => heartPath(0, 0, 13), [])
  const starRef = React.useRef(null as SVGPathElement | null)
  const canvasRef = React.useRef(null as HTMLCanvasElement | null)
  const start = orbitPoint(0.15, 92, 30, ORBIT_TILT)

  const morphStar = (toHeart: boolean) => {
    if (!starRef.current) return
    gsap.to(starRef.current, { morphSVG: toHeart ? heart : sparkle, duration: reducedMotion() ? 0 : 0.6, ease: "back.out(2)", overwrite: "auto" })
  }

  React.useEffect(() => {
    const cv = canvasRef.current
    const host = cv && cv.parentElement
    if (!inkTrail || !cv || !host || reducedMotion()) return
    const ctx = cv.getContext("2d")
    if (!ctx) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const resize = () => {
      cv.width = Math.round(host.clientWidth * dpr)
      cv.height = Math.round(host.clientHeight * dpr)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(host)
    const pen = getComputedStyle(host).getPropertyValue("--mgn-pen").trim() || "#7d84ef"
    const LIFE = 950
    const pts = [] as { x: number; y: number; t: number; gap: boolean }[]
    let raf = 0
    const draw = () => {
      raf = 0
      const now = performance.now()
      while (pts.length && now - pts[0].t > LIFE) pts.shift()
      ctx.clearRect(0, 0, cv.width, cv.height)
      ctx.lineCap = "round"
      ctx.lineJoin = "round"
      ctx.strokeStyle = pen
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1]
        const b = pts[i]
        if (b.gap) continue
        const life = 1 - (now - b.t) / LIFE
        ctx.globalAlpha = clamp(life, 0, 1) * 0.9
        ctx.lineWidth = (0.5 + 2.1 * life) * dpr
        ctx.beginPath()
        ctx.moveTo(a.x * dpr, a.y * dpr)
        ctx.lineTo(b.x * dpr, b.y * dpr)
        ctx.stroke()
      }
      if (pts.length) raf = requestAnimationFrame(draw)
    }
    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect()
      const now = performance.now()
      const last = pts[pts.length - 1]
      pts.push({ x: e.clientX - r.left, y: e.clientY - r.top, t: now, gap: !last || now - last.t > 90 })
      if (!raf) raf = requestAnimationFrame(draw)
    }
    host.addEventListener("pointermove", onMove)
    return () => {
      host.removeEventListener("pointermove", onMove)
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [inkTrail])

  return (
    <Sheet info={info} className="mgn-cover">
      <canvas ref={canvasRef} className="mgn-canvas" aria-hidden="true" />
      <div className="mgn-cover-in">
        <h1 className="mgn-display mgn-title" aria-label={title + " — " + name + ", " + role}>
          {chars.map((c, i) => (
            <span key={i} className="mgn-l" aria-hidden="true">
              <span className="mgn-lc">
                <span className="mgn-li">{c === " " ? " " : c}</span>
              </span>
              {i === orbitAt && (
                <span className="mgn-orbit">
                  <svg className="mgn-orbit-back mgn-ink" viewBox="-100 -100 200 200" style={{ width: "1.32em", height: "1.32em", left: "-.66em", top: "-.66em" }}>
                    <g transform="rotate(-18)">
                      <path className="mgn-draw" pathLength={1} d="M-92 0A92 30 0 0 1 92 0" />
                    </g>
                  </svg>
                  <svg className="mgn-ink" viewBox="-100 -100 200 200" style={{ width: "1.32em", height: "1.32em", left: "-.66em", top: "-.66em", zIndex: 2 }}>
                    <g transform="rotate(-18)">
                      <path className="mgn-draw" pathLength={1} d="M92 0A92 30 0 0 1 -92 0" />
                    </g>
                    <g className="mgn-star-g" transform={"translate(" + start.x.toFixed(2) + " " + start.y.toFixed(2) + ")"}>
                      <g className="mgn-star-s">
                        <path ref={starRef} d={sparkle} style={{ fill: "var(--mgn-pen)", stroke: "none" }} />
                      </g>
                    </g>
                  </svg>
                </span>
              )}
            </span>
          ))}
          <span className="mgn-sig mgn-hand" onPointerEnter={() => morphStar(true)} onPointerLeave={() => morphStar(false)}>
            <svg className="mgn-sig-arrow mgn-ink" viewBox="0 0 150 110" aria-hidden="true">
              <path className="mgn-draw" pathLength={1} d="M146 14C128 34 104 30 101 17C98 4 120 2 117 24C114 48 70 74 24 96" />
              <path className="mgn-draw" pathLength={1} d="M30 80L22 97L41 99" />
            </svg>
            <span className="mgn-write">{name}</span>
          </span>
        </h1>
        <div className="mgn-pill-wrap">
          <span className="mgn-pill">
            {role}
            <PenMark kind="oval" seed={9} padX={12} padY={9} />
          </span>
        </div>
      </div>
      <div className="mgn-cover-meta">
        <span>
          {location} — {year}
        </span>
        <span className="mgn-hint" aria-hidden="true">
          scroll
          <svg viewBox="0 0 22 40" className="mgn-ink">
            <path d="M11 2c-6 6 6 10 0 16s6 10 0 18" />
            <path d="M5 31l6 7 6-7" />
          </svg>
        </span>
        <span>{docLabel}</span>
      </div>
    </Sheet>
  )
}

const TRAIT_SPOTS: { at: Pt; a: Pt; b: Pt; bend: number }[] = [
  { at: [104, 40], a: [122, 60], b: [150, 94], bend: 0.22 },
  { at: [398, 38], a: [380, 58], b: [352, 94], bend: -0.22 },
  { at: [64, 226], a: [84, 248], b: [126, 262], bend: -0.3 },
  { at: [438, 300], a: [418, 282], b: [374, 270], bend: -0.28 },
  { at: [112, 488], a: [130, 468], b: [158, 438], bend: 0.25 },
  { at: [392, 490], a: [372, 470], b: [342, 440], bend: -0.25 },
]

function Hello({ info, portrait, traits, greeting, bio, name }: {
  info: SheetInfo; portrait: string; traits: string[]; greeting: string; bio: string; name: string
}) {
  const layer = React.useRef(null as HTMLDivElement | null)
  const pic = React.useRef(null as HTMLDivElement | null)
  const move = (e: React.PointerEvent) => {
    if (e.pointerType === "touch" || reducedMotion()) return
    const r = e.currentTarget.getBoundingClientRect()
    const dx = (e.clientX - r.left) / r.width - 0.5
    const dy = (e.clientY - r.top) / r.height - 0.5
    gsap.to(layer.current, { x: dx * 18, y: dy * 14, duration: 0.8, ease: "power3.out", overwrite: "auto" })
    gsap.to(pic.current, { x: -dx * 8, y: -dy * 6, duration: 0.8, ease: "power3.out", overwrite: "auto" })
  }
  const leave = () => gsap.to([layer.current, pic.current], { x: 0, y: 0, duration: 1, ease: "power3.out", overwrite: "auto" })
  const list = traits.slice(0, TRAIT_SPOTS.length)
  return (
    <Sheet info={info}>
      <div className="mgn-two">
        <div className="mgn-traits" data-ink onPointerMove={move} onPointerLeave={leave}>
          <div className="mgn-portrait" ref={pic}>
            <div className="mgn-portrait-img">{portrait && <img src={photo(portrait, 720)} alt={name} loading="lazy" decoding="async" />}</div>
            <PenMark kind="box" seed={21} padX={10} padY={10} />
            <PenMark kind="box" seed={22} padX={16} padY={16} />
          </div>
          <div ref={layer} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            <svg viewBox="0 0 500 520" className="mgn-ink" aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
              {list.map((_, i) => (
                <Arrow key={i} a={TRAIT_SPOTS[i].a} b={TRAIT_SPOTS[i].b} bend={TRAIT_SPOTS[i].bend} head={8} />
              ))}
            </svg>
            {list.map((t, i) => (
              <span key={i} className="mgn-trait mgn-hand" style={{ left: TRAIT_SPOTS[i].at[0] / 5 + "%", top: TRAIT_SPOTS[i].at[1] / 5.2 + "%" }}>
                <span className="mgn-write">{t}</span>
              </span>
            ))}
          </div>
        </div>
        <div className="mgn-hello-copy">
          <Heading text={greeting} seed={10} />
          <p className="mgn-p" data-ink>
            <Marked text={bio} seed={100} />
          </p>
        </div>
      </div>
    </Sheet>
  )
}

function Education({ info, intro, education, cvUrl, cvNote, languages }: {
  info: SheetInfo; intro: string; education: MgnEducation[]; cvUrl: string | null; cvNote: string; languages: MgnLanguage[]
}) {
  return (
    <Sheet info={info}>
      <div className="mgn-edu">
        <div>
          <Heading text="Education" seed={11} />
          {intro && (
            <p className="mgn-p mgn-edu-intro mgn-muted" data-rise>
              {intro}
            </p>
          )}
          <ul className="mgn-edu-list" data-ink>
            {education.map((e, i) => (
              <li key={i} data-rise>
                <div>
                  <div className="mgn-edu-t">
                    {e.circled ? (
                      <span className="mgn-mk">
                        {e.title}
                        <PenMark kind="oval" seed={30 + i} padX={12} padY={7} />
                      </span>
                    ) : (
                      e.title
                    )}
                  </div>
                  <div className="mgn-edu-s">{[e.place, e.period].filter(Boolean).join(" · ")}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div>
          {cvUrl && (
            <div className="mgn-qr-wrap" data-ink>
              <a className="mgn-qr" href={cvUrl} target="_blank" rel="noreferrer" aria-label={"Open my CV: " + cvUrl}>
                <span className="mgn-qr-tag">
                  <span className="mgn-write">scan me</span>
                </span>
                <QRCode text={cvUrl} />
              </a>
              <div className="mgn-cvnote mgn-hand">
                <svg viewBox="0 0 90 60" className="mgn-ink" aria-hidden="true">
                  <Arrow a={[84, 50]} b={[10, 16]} bend={-0.3} head={9} />
                </svg>
                <span className="mgn-write">{cvNote}</span>
              </div>
            </div>
          )}
          {languages.length > 0 && (
            <div className="mgn-langs" data-ink>
              <h3>Languages</h3>
              {languages.map((l, i) => (
                <div className="mgn-lang" key={i}>
                  <b>{l.name}</b>
                  <span className="mgn-muted">{l.level}</span>
                  <svg viewBox="0 0 200 16" preserveAspectRatio="none" aria-label={l.name + ": " + Math.round(clamp(l.value, 0, 1) * 100) + "%"} role="img">
                    <path d="M2 9H198" style={{ stroke: "var(--rule)", strokeWidth: 1.2, fill: "none" }} />
                    <path className="mgn-draw" pathLength={1} d={handLine(2, 2 + 196 * clamp(l.value, 0.02, 1), 8.5, 40 + i)} style={{ stroke: "var(--mgn-pen)", strokeWidth: 2.4, fill: "none", strokeLinecap: "round" }} />
                  </svg>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Sheet>
  )
}

function Skills({ info, tools, toolNote, intro, skills, books, booksNote }: {
  info: SheetInfo; tools: MgnTool[]; toolNote: string; intro: string; skills: string[]; books: { title: string; color: string }[]; booksNote: string
}) {
  const [on, setOn] = React.useState(-1)
  const note = on >= 0 && tools[on] ? tools[on].name + (tools[on].note ? " — " + tools[on].note : "") : toolNote
  return (
    <Sheet info={info}>
      <div className="mgn-skills">
        <div className="mgn-skills-top">
          <div>
            <Heading text="Skills" seed={12} />
            <div className="mgn-tools" data-ink onPointerLeave={() => setOn(-1)}>
              {tools.map((t, i) => (
                <button
                  key={i}
                  className="mgn-tool"
                  style={{ background: t.bg, color: t.fg }}
                  data-on={on === i}
                  aria-label={t.name}
                  onPointerEnter={() => setOn(i)}
                  onFocus={() => setOn(i)}
                  onBlur={() => setOn(-1)}
                  onClick={() => setOn(i)}
                >
                  {t.mark === "figma" ? <FigmaMark /> : t.mark}
                </button>
              ))}
              <PenMark kind="oval" seed={13} padX={6} padY={6} />
            </div>
            <div className="mgn-tool-note mgn-hand" aria-live="polite">
              <span key={on} className="mgn-note-swap">
                {note}
              </span>
            </div>
          </div>
          {books.length > 0 && (
            <div className="mgn-books" data-ink>
              <BookStack books={books} />
              <div className="mgn-books-note mgn-hand">
                <span className="mgn-write">{booksNote}</span>
                <svg viewBox="0 0 60 50" className="mgn-ink" aria-hidden="true" style={{ display: "block", width: 54, height: 44, marginLeft: "auto" }}>
                  <Arrow a={[44, 4]} b={[18, 44]} bend={-0.35} head={8} />
                </svg>
              </div>
            </div>
          )}
        </div>
        <div className="mgn-skills-low">
          <div>
            <p className="mgn-p mgn-muted" data-rise>
              {intro}
            </p>
            <div className="mgn-more mgn-hand" data-ink>
              <Doodle kind="pencil" />
              <span className="mgn-write">there's plenty more in my toolkit</span>
            </div>
          </div>
          <ul className="mgn-skill-list" data-rise>
            {skills.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      </div>
    </Sheet>
  )
}

function Deal({ info, projects, note, onOpen }: { info: SheetInfo; projects: MgnProject[]; note: string; onOpen: (i: number) => void }) {
  return (
    <Sheet info={info} className="mgn-deal">
      <div className="mgn-deal-stage">
        <div className="mgn-deal-head">
          <Heading text="Projects." seed={14} />
          {note && (
            <div className="mgn-deal-note mgn-hand" data-ink>
              <span className="mgn-write">{note}</span>
              <svg viewBox="0 0 60 50" className="mgn-ink" aria-hidden="true" style={{ display: "block", width: 54, height: 44, marginLeft: "auto", marginRight: "20%" }}>
                <Arrow a={[40, 4]} b={[22, 46]} bend={0.3} head={8} />
              </svg>
            </div>
          )}
        </div>
        <div className="mgn-row">
          {projects.map((p, i) => (
            <div className="mgn-card" key={i}>
              {p.tag && (
                <span className="mgn-card-tag mgn-hand" aria-hidden="true">
                  <span className="mgn-card-write">{p.tag}</span>
                  <svg viewBox="0 0 24 30" className="mgn-ink">
                    <Arrow a={[12, 2]} b={[12, 27]} bend={i % 2 ? 0.25 : -0.25} head={6} />
                  </svg>
                </span>
              )}
              <button onClick={() => onOpen(i)} aria-label={"Open the " + p.name + " case study"}>
                <Phone p={p} kind="cover" />
              </button>
              <span className="mgn-card-label mgn-hand">
                <span className="mgn-card-write">
                  {i + 1}. {p.name}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </Sheet>
  )
}

function Case({ info, p, i, flip }: { info: SheetInfo; p: MgnProject; i: number; flip: boolean }) {
  const kinds = p.screens && p.screens.length ? p.screens : (["feed", "cover", "detail"] as MgnScreen[])
  const trio = [kinds[0], kinds[1] || kinds[0], kinds[2] || kinds[0]]
  const meta = [p.kind, p.year].filter(Boolean).join(", ")
  return (
    <Sheet info={info} className="mgn-case-wrap" flip={flip}>
      <div className="mgn-case">
        <div className="mgn-case-copy">
          <div className="mgn-eyebrow mgn-hand" data-ink>
            <span className="mgn-write">
              {pad2(i + 1)}
              {meta ? " — " + meta : ""}
            </span>
          </div>
          <Heading text={p.name} seed={40 + i} className="mgn-case-title" />
          <p className="mgn-p" data-ink>
            <Marked text={p.summary} seed={200 + i * 11} />
          </p>
          {p.challenge && (
            <div className="mgn-challenge" data-ink>
              <span className="mgn-challenge-l mgn-hand mgn-mk">
                <span className="mgn-write">my challenge:</span>
                <PenMark kind="oval" seed={60 + i} padX={4} padY={4} />
              </span>
              <span className="mgn-challenge-t">{p.challenge}</span>
            </div>
          )}
          {p.stats && p.stats.length > 0 && (
            <div className="mgn-stats" data-ink>
              {p.stats.slice(0, 3).map((s, k) => (
                <div className="mgn-stat" key={k}>
                  <span className="mgn-stat-n mgn-hand mgn-mk">
                    <span className="mgn-count" data-value={s.value} data-decimals={s.decimals || 0}>
                      {formatCount(s.value, s.decimals || 0)}
                    </span>
                    {s.suffix}
                    <PenMark kind="oval" seed={70 + i * 3 + k} padX={8} padY={3} />
                  </span>
                  <span className="mgn-stat-l">{s.label}</span>
                </div>
              ))}
            </div>
          )}
          {p.href && (
            <a className="mgn-visit" href={p.href} target="_blank" rel="noreferrer">
              see the full case study
              <svg viewBox="0 0 34 16" className="mgn-ink" aria-hidden="true">
                <path d="M2 9c8-3 18-3 29-1" />
                <path d="M25 3l6 5-6 5" />
              </svg>
            </a>
          )}
        </div>
        <div className="mgn-trio">
          {trio.map((k, slot) => (
            <TiltPhone key={slot} slot={slot} p={p} kind={k} />
          ))}
          {p.note && (
            <div className="mgn-case-note mgn-hand" data-ink>
              <svg viewBox="0 0 60 46" className="mgn-ink" aria-hidden="true" style={flip ? { marginLeft: "auto", transform: "scaleX(-1)" } : undefined}>
                <Arrow a={[8, 44]} b={[46, 6]} bend={-0.3} head={8} />
              </svg>
              <span className="mgn-write">{p.note}</span>
            </div>
          )}
        </div>
      </div>
    </Sheet>
  )
}

function Facts({ info, facts, note }: { info: SheetInfo; facts: MgnFact[]; note: string }) {
  const redraw = (e: React.MouseEvent) => {
    if (reducedMotion()) return
    const paths = e.currentTarget.querySelectorAll(".mgn-draw")
    gsap.fromTo(paths, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.7, stagger: 0.1, ease: "power2.inOut", overwrite: true })
  }
  return (
    <Sheet info={info}>
      <div className="mgn-facts">
        <div className="mgn-facts-head">
          {note ? (
            <div className="mgn-facts-note mgn-hand" data-ink>
              <span className="mgn-write">{note}</span>
              <svg viewBox="0 0 70 50" className="mgn-ink" aria-hidden="true">
                <Arrow a={[6, 4]} b={[60, 44]} bend={0.3} head={8} />
              </svg>
            </div>
          ) : (
            <span />
          )}
          <Heading text="Fun Facts" seed={15} />
        </div>
        <div className="mgn-fact-grid">
          {facts.map((f, i) => (
            <button className="mgn-fact" key={i} data-ink onClick={redraw} aria-label={f.text + " (draw again)"}>
              <Doodle kind={f.doodle} />
              <span className="mgn-fact-t mgn-hand">
                <span className="mgn-write">{f.text}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </Sheet>
  )
}

function Thanks({ info, thanks, portrait, name, email, links, letter, signature, title, year, docLabel, onTop }: {
  info: SheetInfo; thanks: string; portrait: string; name: string; email: string; links: MgnLink[]; letter: string
  signature: string; title: string; year: string; docLabel: string; onTop: () => void
}) {
  const [copied, setCopied] = React.useState(false)
  const timer = React.useRef(0)
  React.useEffect(() => () => window.clearTimeout(timer.current), [])
  const copy = () => {
    const done = () => {
      setCopied(true)
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setCopied(false), 1800)
    }
    const mail = () => {
      window.location.href = "mailto:" + email
    }
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(email).then(done, mail)
    else mail()
  }
  const paras = letter.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean)
  return (
    <Sheet info={info}>
      <div className="mgn-thanks">
        <div>
          {portrait && (
            <div className="mgn-avatar" data-ink>
              <img src={photo(portrait, 320)} alt={name} loading="lazy" decoding="async" />
              <PenMark kind="oval" seed={80} padX={9} padY={9} />
            </div>
          )}
          <Heading text={thanks} seed={16} className="mgn-thanks-title" />
          {email && (
            <div className="mgn-touch">
              <b>Get in touch:</b>
              <button className="mgn-email" onClick={copy} aria-label={"Copy " + email}>
                {email}
                <PenMark kind="under" seed={81} padX={1} padY={7} />
                <span className="mgn-copied" data-on={copied} aria-live="polite">
                  {copied ? "copied!" : ""}
                </span>
              </button>
            </div>
          )}
          {links.length > 0 && (
            <div className="mgn-links">
              {links.map((l, i) => (
                <a key={i} href={l.href} target="_blank" rel="noreferrer">
                  {l.label}
                  <PenMark kind="under" seed={90 + i} padX={1} padY={5} />
                </a>
              ))}
            </div>
          )}
        </div>
        <div className="mgn-letter mgn-hand" data-ink>
          {paras.map((t, i) => (
            <p key={i} className="mgn-write-v">
              {t}
            </p>
          ))}
          {signature && (
            <span className="mgn-signature">
              <span className="mgn-write">{signature}</span>
              <PenMark kind="under" seed={82} padX={4} padY={9} />
            </span>
          )}
        </div>
      </div>
      <footer className="mgn-foot">
        <span>
          {title} {year}
        </span>
        <span>{docLabel}</span>
        <span>{name}</span>
        <button onClick={onTop}>
          back to top
          <svg viewBox="0 0 16 22" width="14" height="20" className="mgn-ink" aria-hidden="true">
            <path d="M8 20C6 14 10 8 8 3" />
            <path d="M3 8l5-5 5 5" />
          </svg>
        </button>
      </footer>
    </Sheet>
  )
}

function Chrome({ year, docLabel, name, items, secRef, onJump }: {
  year: string; docLabel: string; name: string; items: { id: string; label: string }[]
  secRef: React.MutableRefObject<HTMLSpanElement | null>; onJump: (id: string) => void
}) {
  const [open, setOpen] = React.useState(false)
  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])
  return (
    <>
      <div className="mgn-top">
        <div className="mgn-bar">
          <span>{year}</span>
          <button className="mgn-bar-btn" aria-expanded={open} aria-haspopup="true" onClick={() => setOpen((o) => !o)}>
            {docLabel}
            <PenMark kind="oval" seed={4} padX={2} padY={2} />
          </button>
          <span className="mgn-bar-right">
            <span className="mgn-bar-name">{name}</span>
            <span className="mgn-bar-sec" ref={secRef}>
              {items[0] ? items[0].label.toLowerCase() : ""}
            </span>
          </span>
          <span className="mgn-progress" />
        </div>
      </div>
      <div className="mgn-hold">
        <nav className="mgn-index" data-open={open} aria-hidden={!open} aria-label="Contents">
          <button className="mgn-index-close" onClick={() => setOpen(false)} tabIndex={open ? 0 : -1}>
            close ×
          </button>
          <ol style={{ "--rows": Math.ceil(items.length / 2) } as React.CSSProperties}>
            {items.map((it, i) => (
              <li key={it.id}>
                <button
                  tabIndex={open ? 0 : -1}
                  onClick={() => {
                    setOpen(false)
                    onJump(it.id)
                  }}
                >
                  <small>{pad2(i + 1)}</small>
                  <span className="mgn-mk">
                    {it.label}
                    <PenMark kind="under" seed={20 + i} padX={1} padY={6} />
                  </span>
                </button>
              </li>
            ))}
          </ol>
          <div className="mgn-index-foot">
            {docLabel} — {name}
          </div>
        </nav>
      </div>
    </>
  )
}

/* ---------------------------------------------------------------- template */

function cap(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s
}

export default function MarginaliaPortfolioTemplate(props: MarginaliaPortfolioTemplateProps) {
  const {
    name = DEFAULTS.name,
    role = DEFAULTS.role,
    year = DEFAULTS.year,
    location = DEFAULTS.location,
    title = DEFAULTS.title,
    docLabel = DEFAULTS.docLabel,
    portrait = DEFAULTS.portrait,
    traits = DEFAULTS.traits,
    greeting = DEFAULTS.greeting,
    bio = DEFAULTS.bio,
    educationIntro = DEFAULTS.educationIntro,
    education = DEFAULTS.education,
    cvNote = DEFAULTS.cvNote,
    languages = DEFAULTS.languages,
    tools = DEFAULTS.tools,
    toolNote = DEFAULTS.toolNote,
    skillsIntro = DEFAULTS.skillsIntro,
    skills = DEFAULTS.skills,
    books = DEFAULTS.books,
    booksNote = DEFAULTS.booksNote,
    projectsNote = DEFAULTS.projectsNote,
    projects = DEFAULT_PROJECTS,
    facts = DEFAULTS.facts,
    factsNote = DEFAULTS.factsNote,
    thanks = DEFAULTS.thanks,
    email = DEFAULTS.email,
    links = DEFAULTS.links,
    letter = DEFAULTS.letter,
    sections = DEFAULTS.sections,
    inkTrail = true,
    height = "100svh",
    className,
  } = props
  const cvUrl = props.cvUrl === undefined ? DEFAULTS.cvUrl : props.cvUrl
  const signature = props.signature ?? name
  const colors = { paper: "#ecebe7", night: "#2b2b2e", ink: "#242426", pen: "#7d84ef", ...props.colors }
  const fonts = props.fonts || {}
  const fontHref = fonts.href === undefined ? DEFAULT_FONT : fonts.href
  const rootRef = React.useRef(null as HTMLDivElement | null)
  const secRef = React.useRef(null as HTMLSpanElement | null)

  // every sheet in order, with its tone; a night sheet only grows out of a card when it follows paper
  const sheets = [] as { info: SheetInfo; kind: MgnSection; i: number }[]
  let prev = ""
  const push = (kind: MgnSection, id: string, label: string, tone: "paper" | "night", i = 0) => {
    sheets.push({ kind, i, info: { id, label, tone, morph: tone === "night" && prev !== "night" } })
    prev = tone
  }
  for (const s of sections) {
    if (s === "cases") projects.forEach((p, i) => push("cases", "case-" + i, p.name.toLowerCase(), p.tone || (i % 2 === 0 ? "night" : "paper"), i))
    else if (s === "projects") {
      if (projects.length) push(s, s, SECTION_LABEL[s], "night")
    } else if (s === "facts") {
      if (facts.length) push(s, s, SECTION_LABEL[s], "night")
    }
    else push(s, s, SECTION_LABEL[s] || s, "paper")
  }
  const animKey = sheets.map((s) => s.info.id + s.info.tone).join("|") + "|" + traits.length + "|" + facts.length

  const jump = React.useCallback((id: string) => {
    const el = rootRef.current && (rootRef.current.querySelector('[data-sheet="' + id + '"]') as HTMLElement | null)
    if (!el) return
    const y = el.getBoundingClientRect().top + window.scrollY
    if (reducedMotion()) window.scrollTo(0, y)
    else gsap.to(window, { scrollTo: { y, autoKill: true }, duration: 1.3, ease: "power3.inOut" })
  }, [])

  const toTop = React.useCallback(() => {
    const root = rootRef.current
    if (!root) return
    const y = root.getBoundingClientRect().top + window.scrollY
    if (reducedMotion()) window.scrollTo(0, y)
    else gsap.to(window, { scrollTo: { y, autoKill: true }, duration: 1.6, ease: "power3.inOut" })
  }, [])

  useIso(() => {
    const root = rootRef.current
    if (!root) return
    const q = (s: string) => Array.from(root.querySelectorAll(s)) as HTMLElement[]
    // a staggered fromTo inside a timeline only pre-renders its first target, so
    // set every target's start state up front and tween from there
    const play = (tl: gsap.core.Timeline, els: ArrayLike<Element>, from: gsap.TweenVars, to: gsap.TweenVars, at?: gsap.Position) => {
      const list = Array.from(els)
      if (!list.length) return
      gsap.set(list, from)
      tl.to(list, to, at)
    }
    const W0 = "inset(-40% 100% -40% -6%)"
    const W1 = "inset(-40% -14% -40% -6%)"
    const mm = gsap.matchMedia()
    mm.add({ motion: "(prefers-reduced-motion: no-preference)", reduce: "(prefers-reduced-motion: reduce)" }, (c) => {
      const motion = !!(c.conditions && c.conditions.motion)

      // where you are, and how far
      q("[data-sec]").forEach((el) =>
        ScrollTrigger.create({
          trigger: el,
          start: "top 40%",
          end: "bottom 40%",
          onToggle: (s) => {
            if (s.isActive && secRef.current) secRef.current.textContent = el.dataset.label || ""
          },
        }),
      )
      const bar = root.querySelector(".mgn-progress")
      if (bar) gsap.to(bar, { scaleX: 1, ease: "none", scrollTrigger: { trigger: root, start: "top top", end: "bottom bottom", scrub: true } })
      q(".mgn-count").forEach((el) => {
        el.textContent = formatCount(parseFloat(el.dataset.value || "0"), parseInt(el.dataset.decimals || "0", 10))
      })
      if (!motion) return

      // the cover: letters rise, the name writes itself, the pen marks follow
      const cover = root.querySelector(".mgn-cover")
      if (cover) {
        const intro = gsap.timeline({ delay: 0.15 })
        play(intro, cover.querySelectorAll(".mgn-li"), { yPercent: 118, rotate: 8 }, { yPercent: 0, rotate: 0, duration: 1.2, ease: "expo.out", stagger: 0.055 }, 0)
        play(intro, cover.querySelectorAll(".mgn-write"), { clipPath: W0 }, { clipPath: W1, duration: 1.2, ease: "power1.inOut" }, 0.6)
        play(intro, cover.querySelectorAll(".mgn-draw"), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.9, ease: "power2.inOut", stagger: 0.12 }, 1)
        play(intro, cover.querySelectorAll(".mgn-pill"), { scale: 0.5, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.9, ease: "back.out(2.2)" }, 0.75)
        play(intro, cover.querySelectorAll(".mgn-cover-meta > *"), { y: 18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8, ease: "power3.out", stagger: 0.08 }, 1.1)
        play(intro, cover.querySelectorAll(".mgn-star-s"), { scale: 0, rotate: -180, svgOrigin: "0 0" }, { scale: 1, rotate: 0, svgOrigin: "0 0", duration: 0.8, ease: "back.out(3)" }, 1.5)

        // …and drift apart as you leave
        const letters = cover.querySelectorAll(".mgn-l")
        const n = letters.length
        const out = gsap.timeline({ scrollTrigger: { trigger: cover, start: "top top", end: "bottom top", scrub: 0.6 } })
        letters.forEach((l, i) => {
          const R = rand(i + 3)
          out.to(l, { x: (i - (n - 1) / 2) * 26, y: -70 - R() * 170, rotation: (R() - 0.5) * 36, ease: "none" }, 0)
        })
        out.to(cover.querySelectorAll(".mgn-pill-wrap, .mgn-sig"), { y: -110, autoAlpha: 0, ease: "none" }, 0)
        out.to(cover.querySelectorAll(".mgn-cover-in"), { scale: 0.9, ease: "none" }, 0)

        // the star orbits its letter, dimming when it passes behind
        const star = cover.querySelector(".mgn-star-g") as SVGGElement | null
        if (star) {
          const ph = { t: 0.15 }
          const spin = gsap.to(ph, {
            t: 1.15,
            duration: 7,
            ease: "none",
            repeat: -1,
            onUpdate: () => {
              const o = orbitPoint(ph.t % 1, 92, 30, ORBIT_TILT)
              star.setAttribute("transform", "translate(" + o.x.toFixed(2) + " " + o.y.toFixed(2) + ")")
              star.style.opacity = o.front ? "1" : "0.3"
            },
          })
          ScrollTrigger.create({ trigger: cover, start: "top bottom", end: "bottom top", onToggle: (s) => (s.isActive ? spin.play() : spin.pause()) })
        }
      }

      // headings: characters rise, the underline goes from nervous to sure
      q(".mgn-hd").forEach((hd) => {
        play(
          gsap.timeline({ scrollTrigger: { trigger: hd, start: "top 88%", once: true } }),
          hd.querySelectorAll(".mgn-ci"),
          { yPercent: 118, rotate: 6 },
          { yPercent: 0, rotate: 0, duration: 1.05, ease: "expo.out", stagger: 0.035 },
        )
        const path = hd.querySelector(".mgn-morph") as SVGPathElement | null
        if (path && path.dataset.from && path.dataset.to) {
          gsap.set(path, { attr: { d: path.dataset.from } })
          gsap
            .timeline({ scrollTrigger: { trigger: hd, start: "top 90%", end: "top 30%", scrub: 0.8 } })
            .fromTo(path, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.45, ease: "none" }, 0)
            .to(path, { morphSVG: path.dataset.to, duration: 1, ease: "none" }, 0)
        }
      })

      // the pen: every [data-ink] group writes, then draws, once
      q("[data-ink]").forEach((g) => {
        const own = (s: string) => Array.from(g.querySelectorAll(s)).filter((el) => el.closest("[data-ink]") === g)
        const writes = own(".mgn-write")
        const lines = own(".mgn-write-v")
        const strokes = own(".mgn-draw")
        const tl = gsap.timeline({ scrollTrigger: { trigger: g, start: "top 84%", once: true } })
        play(tl, lines, { clipPath: "inset(-10% -6% 100% -6%)" }, { clipPath: "inset(-10% -6% -10% -6%)", duration: 1.5, ease: "power1.inOut", stagger: 0.55 }, 0)
        play(tl, writes, { clipPath: W0 }, { clipPath: W1, duration: 0.95, ease: "power1.inOut", stagger: 0.16 }, lines.length ? ">-0.3" : 0)
        play(tl, strokes, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.8, ease: "power2.inOut", stagger: 0.1 }, lines.length ? ">-0.4" : 0.2)
      })

      // the numbers count up
      q(".mgn-count").forEach((el) => {
        const v = parseFloat(el.dataset.value || "0")
        const d = parseInt(el.dataset.decimals || "0", 10)
        const o = { v: 0 }
        el.textContent = formatCount(0, d)
        gsap.to(o, {
          v,
          duration: 1.8,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 90%", once: true },
          onUpdate: () => {
            el.textContent = formatCount(o.v, d)
          },
        })
      })

      // plain blocks rise
      const rise = q("[data-rise]")
      if (rise.length) {
        gsap.set(rise, { autoAlpha: 0, y: 36 })
        ScrollTrigger.batch(rise, {
          start: "top 92%",
          once: true,
          onEnter: (b) => gsap.to(b, { autoAlpha: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: 0.08, overwrite: true }),
        })
      }

      // night sheets grow from a rounded card into full bleed
      q('.mgn-sheet-bg[data-morph="true"]').forEach((bg) => {
        gsap.fromTo(
          bg,
          { clipPath: "inset(80px 4% 0px 4% round 56px)" },
          { clipPath: "inset(0px 0% 0px 0% round 0px)", ease: "none", scrollTrigger: { trigger: bg.parentElement, start: "top bottom", end: "top 8%", scrub: 0.5 } },
        )
      })

      // the projects: a shuffled pile deals itself into a row while the sheet holds still
      q(".mgn-deal").forEach((sec) => {
        const cards = Array.from(sec.querySelectorAll(".mgn-card")) as HTMLElement[]
        if (!cards.length) return
        const n = cards.length
        const toCentre = (el: HTMLElement, axis: "x" | "y") => {
          const row = el.parentElement as HTMLElement
          return axis === "x"
            ? row.clientWidth / 2 - (el.offsetLeft + el.offsetWidth / 2)
            : row.clientHeight / 2 - (el.offsetTop + el.offsetHeight / 2)
        }
        const tl = gsap.timeline({ scrollTrigger: { trigger: sec, start: "top top", end: "bottom bottom", scrub: 0.7, invalidateOnRefresh: true } })
        // the top card is dealt first; each tween is its own so every card starts in the pile
        cards.forEach((el, i) => {
          const o = pileOffset(i, n)
          tl.fromTo(
            el,
            { x: () => toCentre(el, "x") + o.x, y: () => toCentre(el, "y") + o.y, rotation: o.r, scale: 0.9 },
            { x: 0, y: 0, rotation: 0, scale: 1, duration: 1, ease: "power2.inOut" },
            0.25 + (n - 1 - i) * 0.14,
          )
        })
        play(tl, sec.querySelectorAll(".mgn-card-write"), { clipPath: W0 }, { clipPath: W1, duration: 0.5, stagger: 0.08, ease: "none" }, ">-0.3")
        play(tl, sec.querySelectorAll(".mgn-card-tag .mgn-draw"), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.4, stagger: 0.04, ease: "none" }, "<0.1")
        tl.to({}, { duration: 0.4 })
      })

      // case studies: the side phones fan out from behind, the front one turns to face you, all parallax
      q(".mgn-case-wrap").forEach((sec) => {
        const scrub = { trigger: sec, start: "top 85%", end: "top 15%", scrub: 0.8 }
        sec.querySelectorAll(".mgn-trio-p").forEach((p) => {
          const d = parseFloat((p as HTMLElement).dataset.depth || "0.5")
          gsap.fromTo(p, { y: 80 * d }, { y: -80 * d, ease: "none", scrollTrigger: { trigger: sec, start: "top bottom", end: "bottom top", scrub: 0.6 } })
        })
        const front = sec.querySelector('.mgn-trio-p[data-slot="1"]')
        if (front) gsap.fromTo(front, { rotationY: -40, rotationX: 12, scale: 0.86 }, { rotationY: 0, rotationX: 0, scale: 1, ease: "power2.out", scrollTrigger: scrub })
        const sides = sec.querySelectorAll('.mgn-trio-p:not([data-slot="1"])')
        sides.forEach((el, i) => gsap.fromTo(el, { xPercent: i ? -70 : 70 }, { xPercent: 0, ease: "power3.out", scrollTrigger: { ...scrub } }))
      })
    })

    let t = 0
    const refresh = () => {
      window.clearTimeout(t)
      t = window.setTimeout(() => ScrollTrigger.refresh(), 160)
    }
    const ro = new ResizeObserver(refresh)
    ro.observe(root)
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh)
    window.addEventListener("load", refresh)
    return () => {
      window.clearTimeout(t)
      ro.disconnect()
      window.removeEventListener("load", refresh)
      mm.revert()
    }
  }, [animKey])

  const style = {
    "--mgn-paper": colors.paper,
    "--mgn-night": colors.night,
    "--mgn-ink": colors.ink,
    "--mgn-pen": colors.pen,
    "--mgn-h": height,
    "--mgn-display": fonts.display || "'DM Serif Display', 'Bodoni 72', Didot, Georgia, serif",
    "--mgn-hand": fonts.hand || "Caveat, 'Bradley Hand', 'Segoe Print', 'Comic Sans MS', cursive",
    "--mgn-body": fonts.body || "Poppins, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
  } as React.CSSProperties

  const items = sheets.map((s) => ({ id: s.info.id, label: s.kind === "cases" ? projects[s.i].name : cap(s.info.label) }))
  let caseN = 0

  return (
    <div ref={rootRef} className={"mgn-root" + (className ? " " + className : "")} style={style}>
      {fontHref && <link rel="stylesheet" href={fontHref} />}
      <style>{CSS}</style>
      <Chrome year={year} docLabel={docLabel} name={name} items={items} secRef={secRef} onJump={jump} />
      {sheets.map(({ info, kind, i }) => {
        switch (kind) {
          case "cover":
            return <Cover key={info.id} info={info} title={title} name={name} role={role} year={year} location={location} docLabel={docLabel} inkTrail={inkTrail} />
          case "hello":
            return <Hello key={info.id} info={info} portrait={portrait} traits={traits} greeting={greeting} bio={bio} name={name} />
          case "education":
            return <Education key={info.id} info={info} intro={educationIntro} education={education} cvUrl={cvUrl} cvNote={cvNote} languages={languages} />
          case "skills":
            return <Skills key={info.id} info={info} tools={tools} toolNote={toolNote} intro={skillsIntro} skills={skills} books={books} booksNote={booksNote} />
          case "projects":
            return <Deal key={info.id} info={info} projects={projects} note={projectsNote} onOpen={(k) => jump("case-" + k)} />
          case "cases":
            return <Case key={info.id} info={info} p={projects[i]} i={i} flip={caseN++ % 2 === 1} />
          case "facts":
            return <Facts key={info.id} info={info} facts={facts} note={factsNote} />
          case "thanks":
            return (
              <Thanks key={info.id} info={info} thanks={thanks} portrait={portrait} name={name} email={email} links={links} letter={letter}
                signature={signature} title={title} year={year} docLabel={docLabel} onTop={toTop} />
            )
          default:
            return null
        }
      })}
    </div>
  )
}
