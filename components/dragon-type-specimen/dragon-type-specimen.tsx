"use client"

import * as React from "react"

/**
 * Dragon Type Specimen: a type-foundry specimen book that a dragon lives in.
 *
 * Seven pinned pages play over one long scroll: the cover, an eye opening in a
 * slot, the glyph set, a weight study, the style list, stylistic alternates and
 * a liquid page. A glossy black dragon slithers between them: it lies coiled
 * across the cover, dives off the bottom, rises from the lower right, drops in
 * from the top, climbs out of the dark, lunges from the left and coils up on
 * the right. Its body follows its head along a path, so it moves like one
 * living animal rather than a sequence of stills.
 *
 * Everything is drawn from numbers. The dragon is a canvas: a shaded tube with
 * legs, spines and a hinged jaw. The display face is an original angular slab
 * serif built from strokes, spikes and slabs. No images, no fonts to load,
 * React is the only import.
 *
 * Interactive: the dragon watches your pointer and snaps when you click; hover
 * the glyph set to preview a letter; pick a style on the dark page and every
 * title switches to it; on the last page the liquid follows your pointer.
 */

export type SpecimenStyle = "regular" | "bold" | "outline" | "bold-outline"

export interface DragonTypeSpecimenProps {
  /** The typeface name: the cover title. A-Z, 0-9 and - . : ! ? / are drawn. */
  title?: string
  /** Line under the title. */
  subtitle?: string
  /** Small line above the title. */
  studio?: string
  /** Year on the cover. */
  year?: string
  /** The word set on the alternates page. */
  specimenWord?: string
  /** Page colour. */
  background?: string
  /** Page colour of the dark "styles" page. */
  night?: string
  /** Type colour. */
  ink?: string
  /** Dragon skin. Hex; the highlights are mixed from it. */
  dragonColor?: string
  /** Eye glow. */
  eyeColor?: string
  /** Style the titles start in. The dark page lets the viewer change it. */
  defaultStyle?: SpecimenStyle
  /** Height of the pinned stage. A definite length, never a percentage. */
  height?: string
  /** Extra scroll distance the seven pages play over, on top of `height`. */
  scrollDistance?: string
  /** 0..1. Drive the book yourself instead of from scroll. */
  progress?: number
  /** Show the "scroll" cue on the cover. */
  hint?: boolean
  /** Extra root class names. */
  className?: string
}

// #region specimen
export type Pt = [number, number]
export type Poly = Pt[]

export const clamp01 = (x: number) => (x <= 0 ? 0 : x > 1 ? 1 : x)
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t

export function smooth(a: number, b: number, x: number) {
  const t = clamp01((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}

export const easeOut = (t: number) => 1 - Math.pow(1 - clamp01(t), 3)
export const easeIn = (t: number) => Math.pow(clamp01(t), 3)

/** How far through the pinned scroll we are: 0 at the top, 1 when the stage lets go. */
export function scrollProgress(top: number, height: number, viewport: number) {
  const range = height - viewport
  if (range <= 0) return top <= 0 ? 1 : 0
  return clamp01(-top / range)
}

export const CHAPTERS = ["Cover", "The eye", "Glyph set", "Weights", "Styles", "Alternates", "Liquid"] as const
const LAST = CHAPTERS.length - 1

/** Which page a scroll value is on, and how far through it (0..1). */
export function chapterAt(p: number) {
  const x = clamp01(p) * CHAPTERS.length
  const i = Math.min(LAST, Math.floor(x))
  return { i, t: x - i }
}

/** Page i's own clock at book progress p. Runs below 0 before it and past 1 after it. */
export const localT = (p: number, i: number) => clamp01(p) * CHAPTERS.length - i

/** How visible a page's type is. The cover starts shown; the last page never leaves. */
export function chapterVis(i: number, t: number) {
  const fadeIn = i === 0 ? (t < -0.001 ? 0 : 1) : smooth(0.02, 0.24, t)
  const fadeOut = i === LAST ? (t > 1.001 ? 0 : 1) : 1 - smooth(0.74, 0.94, t)
  return fadeIn * fadeOut
}

// ---- the typeface: strokes, slabs and spikes on a 100-unit cap height --------

function area(p: Poly) {
  let s = 0
  for (let i = 0; i < p.length; i++) {
    const a = p[i]
    const b = p[(i + 1) % p.length]
    s += a[0] * b[1] - b[0] * a[1]
  }
  return s / 2
}

/** Fills wind one way, holes the other, so one nonzero path unions them. */
function orient(p: Poly, fill: boolean): Poly {
  return area(p) > 0 === fill ? p : p.slice().reverse()
}

/** A polyline stroked with mitred corners. Sharp corners become spikes, which is the look. */
export function strokePts(pts: Pt[], w: number, closed: boolean): Poly[] {
  const n = pts.length
  const h = w / 2
  const left: Pt[] = []
  const right: Pt[] = []
  const normal = (i: number): Pt => {
    const a = pts[i]
    const b = pts[(i + 1) % n]
    const dx = b[0] - a[0]
    const dy = b[1] - a[1]
    const l = Math.hypot(dx, dy) || 1
    return [-dy / l, dx / l]
  }
  for (let i = 0; i < n; i++) {
    const hasPrev = closed || i > 0
    const hasNext = closed || i < n - 1
    let nx: number
    let ny: number
    let k = 1
    if (hasPrev && hasNext) {
      const a = normal((i - 1 + n) % n)
      const b = normal(i)
      nx = a[0] + b[0]
      ny = a[1] + b[1]
      const ml = Math.hypot(nx, ny)
      if (ml < 1e-6) {
        nx = b[0]
        ny = b[1]
      } else {
        nx /= ml
        ny /= ml
      }
      k = Math.min(3.2, 1 / Math.max(nx * b[0] + ny * b[1], 1e-3))
    } else {
      ;[nx, ny] = normal(hasNext ? i : i - 1)
    }
    left.push([pts[i][0] + nx * h * k, pts[i][1] + ny * h * k])
    right.push([pts[i][0] - nx * h * k, pts[i][1] - ny * h * k])
  }
  if (!closed) return [orient(left.concat(right.reverse()), true)]
  const outerFirst = Math.abs(area(left)) > Math.abs(area(right))
  return [orient(outerFirst ? left : right, true), orient(outerFirst ? right : left, false)]
}

export interface Pen {
  /** stem-weight stroke through x,y pairs */
  S: (...a: number[]) => void
  /** hairline stroke */
  L: (...a: number[]) => void
  /** closed stem-weight stroke (a bowl) */
  C: (...a: number[]) => void
  /** slab serif on a stem at x, on the cap line or the baseline */
  slab: (x: number, top: boolean) => void
  /** vertical serif on a horizontal terminal */
  vs: (x: number, y0: number, y1: number) => void
  /** a diamond bead */
  dia: (x: number, y: number) => void
  /** a thin thorn pointing at `deg` */
  spike: (x: number, y: number, deg: number, len: number) => void
  rect: (x0: number, y0: number, x1: number, y1: number) => void
}

const T = 5.5 // centre of a bar sitting on the cap line
const B = 94.5 // centre of a bar sitting on the baseline

/** [advance width, drawing]. Every glyph is original: angular, slabbed, a little thorny. */
export const GLYPHS: Record<string, [number, (p: Pen) => void]> = {
  A: [76, (p) => { p.S(8, 100, 38, 0, 68, 100); p.L(20, 64, 56, 64); p.slab(8, false); p.slab(68, false); p.dia(38, 64) }],
  B: [66, (p) => { p.S(12, 0, 12, 100); p.S(12, T, 46, T, 57, 16, 57, 37, 47, 47, 12, 47); p.S(12, 47, 50, 47, 61, 57, 61, 84, 50, B, 12, B); p.slab(12, true); p.slab(12, false) }],
  C: [64, (p) => { p.S(60, T, 20, T, 7, 18, 7, 82, 20, B, 60, B); p.vs(60, 0, 24); p.vs(60, 76, 100) }],
  D: [68, (p) => { p.S(12, 0, 12, 100); p.S(12, T, 44, T, 61, 22, 61, 78, 44, B, 12, B); p.slab(12, true); p.slab(12, false) }],
  E: [60, (p) => { p.S(12, 0, 12, 100); p.S(12, T, 58, T); p.L(12, 50, 46, 50); p.S(12, B, 58, B); p.vs(58, 0, 22); p.vs(58, 78, 100); p.vs(46, 40, 60); p.slab(12, true); p.slab(12, false) }],
  F: [58, (p) => { p.S(12, 0, 12, 100); p.S(12, T, 56, T); p.L(12, 50, 44, 50); p.vs(56, 0, 22); p.vs(44, 40, 60); p.slab(12, true); p.slab(12, false) }],
  G: [66, (p) => { p.S(60, T, 20, T, 7, 18, 7, 82, 20, B, 60, B, 60, 52, 34, 52); p.vs(60, 0, 24); p.vs(34, 42, 62); p.spike(60, 100, 90, 16) }],
  H: [70, (p) => { p.S(12, 0, 12, 100); p.S(58, 0, 58, 100); p.L(12, 50, 58, 50); p.slab(12, true); p.slab(12, false); p.slab(58, true); p.slab(58, false); p.dia(35, 50) }],
  I: [30, (p) => { p.S(15, 0, 15, 100); p.slab(15, true); p.slab(15, false); p.dia(15, 50) }],
  J: [54, (p) => { p.S(42, 0, 42, 82, 30, B, 16, B, 7, 84, 7, 68); p.slab(42, true); p.vs(7, 64, 74) }],
  K: [68, (p) => { p.S(12, 0, 12, 100); p.S(58, 0, 16, 54); p.S(30, 40, 62, 100); p.slab(12, true); p.slab(12, false); p.slab(58, true); p.slab(62, false) }],
  L: [58, (p) => { p.S(12, 0, 12, 100); p.S(12, B, 56, B); p.vs(56, 76, 100); p.slab(12, true); p.slab(12, false) }],
  M: [84, (p) => { p.S(12, 100, 12, 0, 42, 64, 72, 0, 72, 100); p.slab(12, false); p.slab(72, false); p.dia(42, 82) }],
  N: [70, (p) => { p.S(12, 100, 12, 0, 58, 100, 58, 0); p.slab(12, false); p.slab(58, true) }],
  O: [68, (p) => { p.C(20, T, 48, T, 61, 18, 61, 82, 48, B, 20, B, 7, 82, 7, 18); p.dia(34, 50) }],
  P: [64, (p) => { p.S(12, 0, 12, 100); p.S(12, T, 46, T, 58, 17, 58, 45, 46, 56, 12, 56); p.slab(12, true); p.slab(12, false) }],
  Q: [68, (p) => { p.C(20, T, 48, T, 61, 18, 61, 82, 48, B, 20, B, 7, 82, 7, 18); p.S(36, 74, 64, 116); p.dia(34, 50) }],
  R: [68, (p) => { p.S(12, 0, 12, 100); p.S(12, T, 46, T, 58, 17, 58, 45, 46, 56, 12, 56); p.S(34, 56, 62, 100); p.slab(12, true); p.slab(12, false); p.slab(62, false) }],
  S: [62, (p) => { p.S(58, T, 18, T, 7, 15, 7, 40, 17, 50, 46, 50, 57, 60, 57, 85, 46, B, 5, B); p.vs(58, 0, 22); p.vs(5, 78, 100) }],
  T: [64, (p) => { p.S(4, T, 60, T); p.S(32, 0, 32, 100); p.vs(4, 0, 22); p.vs(60, 0, 22); p.slab(32, false); p.spike(32, 0, -90, 16) }],
  U: [70, (p) => { p.S(12, 0, 12, 82, 24, B, 46, B, 58, 82, 58, 0); p.slab(12, true); p.slab(58, true) }],
  V: [72, (p) => { p.S(8, 0, 36, 100, 64, 0); p.slab(8, true); p.slab(64, true) }],
  W: [96, (p) => { p.S(8, 0, 28, 100, 48, 32, 68, 100, 88, 0); p.slab(8, true); p.slab(88, true) }],
  X: [68, (p) => { p.S(10, 0, 58, 100); p.S(58, 0, 10, 100); p.slab(10, true); p.slab(58, true); p.slab(10, false); p.slab(58, false); p.dia(34, 50) }],
  Y: [68, (p) => { p.S(8, 0, 34, 52, 60, 0); p.S(34, 52, 34, 100); p.slab(8, true); p.slab(60, true); p.slab(34, false) }],
  Z: [62, (p) => { p.S(6, T, 56, T, 6, B, 56, B); p.vs(6, 0, 22); p.vs(56, 78, 100); p.dia(31, 50) }],
  "0": [62, (p) => { p.C(20, T, 42, T, 55, 18, 55, 82, 42, B, 20, B, 7, 82, 7, 18); p.L(47, 14, 15, 86) }],
  "1": [42, (p) => { p.S(8, 22, 26, 0, 26, 100); p.slab(26, false) }],
  "2": [60, (p) => { p.S(6, 22, 6, T, 44, T, 54, 15, 54, 40, 6, B, 56, B); p.vs(56, 78, 100) }],
  "3": [60, (p) => { p.S(4, T, 44, T, 54, 15, 54, 38, 44, 48, 20, 48); p.S(20, 48, 46, 48, 56, 58, 56, 85, 46, B, 4, B); p.vs(4, 0, 22); p.vs(4, 78, 100) }],
  "4": [62, (p) => { p.S(42, 100, 42, 0, 6, 68, 58, 68); p.slab(42, false) }],
  "5": [60, (p) => { p.S(54, T, 10, T, 10, 48, 44, 48, 56, 58, 56, 85, 46, B, 4, B); p.vs(54, 0, 22); p.vs(4, 78, 100) }],
  "6": [62, (p) => { p.S(52, T, 18, T, 7, 16, 7, 84, 18, B, 44, B, 55, 84, 55, 58, 44, 48, 7, 48); p.vs(52, 0, 22) }],
  "7": [58, (p) => { p.S(4, T, 54, T, 22, 100); p.vs(4, 0, 22); p.dia(38, 50) }],
  "8": [62, (p) => { p.C(16, T, 46, T, 53, 12, 53, 40, 46, 47, 16, 47, 9, 40, 9, 12); p.C(14, 47, 48, 47, 56, 55, 56, 87, 48, B, 14, B, 6, 87, 6, 55) }],
  "9": [62, (p) => { p.S(10, B, 44, B, 55, 84, 55, 16, 44, T, 18, T, 7, 16, 7, 42, 18, 52, 55, 52); p.vs(10, 78, 100) }],
  "-": [40, (p) => { p.rect(6, 45, 34, 56) }],
  ".": [22, (p) => { p.dia(11, 92) }],
  ":": [22, (p) => { p.dia(11, 36); p.dia(11, 92) }],
  "!": [24, (p) => { p.S(12, 0, 12, 70); p.dia(12, 92) }],
  "?": [56, (p) => { p.S(6, 20, 6, T, 44, T, 52, 14, 52, 40, 28, 56, 28, 72); p.dia(28, 92) }],
  "/": [48, (p) => { p.S(42, 0, 6, 100) }],
  " ": [30, () => {}],
}

export const WEIGHTS = { regular: 11, bold: 17 } as const

/** A glyph's filled polygons. `alt` adds the thorned crossbar of the alternates. */
export function glyphPolys(ch: string, weight: number = WEIGHTS.regular, alt = false) {
  const g = GLYPHS[ch]
  if (!g) return null
  const polys: Poly[] = []
  const W = weight
  const hair = Math.max(4.5, W * 0.62)
  const pairs = (a: number[]) => {
    const o: Pt[] = []
    for (let i = 0; i + 1 < a.length; i += 2) o.push([a[i], a[i + 1]])
    return o
  }
  const rect = (x0: number, y0: number, x1: number, y1: number) =>
    polys.push(orient([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], true))
  const dia = (x: number, y: number, r = W * 0.68) => polys.push(orient([[x, y - r], [x + r, y], [x, y + r], [x - r, y]], true))
  const spike = (x: number, y: number, deg: number, len: number, b = W * 0.34) => {
    const a = (deg * Math.PI) / 180
    const dx = Math.cos(a)
    const dy = Math.sin(a)
    polys.push(orient([[x - dy * b, y + dx * b], [x + dx * len, y + dy * len], [x + dy * b, y - dx * b]], true))
  }
  const pen: Pen = {
    S: (...a) => polys.push(...strokePts(pairs(a), W, false)),
    L: (...a) => polys.push(...strokePts(pairs(a), hair, false)),
    C: (...a) => polys.push(...strokePts(pairs(a), W, true)),
    slab: (x, top) => {
      const half = W * 0.7 + 8
      const sh = W * 0.55 + 2
      if (top) rect(x - half, 0, x + half, sh)
      else rect(x - half, 100 - sh, x + half, 100)
    },
    vs: (x, y0, y1) => rect(x - W * 0.34, y0, x + W * 0.34, y1),
    dia: (x, y) => dia(x, y),
    spike: (x, y, deg, len) => spike(x, y, deg, len),
    rect,
  }
  g[1](pen)
  if (alt && ch !== " ") {
    // the alternate: a thorned hairline pierces the letter at mid height
    const w = g[0]
    rect(-6, 44, w + 6, 44 + hair * 0.7)
    spike(-6, 44 + hair * 0.35, 180, 14, hair * 0.6)
    spike(w + 6, 44 + hair * 0.35, 0, 14, hair * 0.6)
    spike(w / 2, 0, -90, 20, W * 0.3)
  }
  return { w: g[0], polys }
}

export const polysToD = (polys: Poly[]) =>
  polys.map((p) => "M" + p.map(([x, y]) => x.toFixed(1) + " " + y.toFixed(1)).join("L") + "Z").join("")

const glyphCache = new Map<string, { w: number; d: string }>()

export function glyphPath(ch: string, weight: number = WEIGHTS.regular, alt = false) {
  const key = ch + "|" + weight + "|" + (alt ? 1 : 0)
  let hit = glyphCache.get(key)
  if (!hit) {
    const g = glyphPolys(ch, weight, alt)
    if (!g) return null
    hit = { w: g.w, d: polysToD(g.polys) }
    glyphCache.set(key, hit)
  }
  return hit
}

export const SIDEBEARING = 14

/** Lays a word out in glyph units (cap height 100). Unknown characters become spaces. */
export function layoutWord(text: string, weight: number = WEIGHTS.regular, tracking = 0, alt = false) {
  const glyphs: { ch: string; x: number; w: number; d: string }[] = []
  let x = 0
  for (const raw of text.toUpperCase()) {
    const g = glyphPath(raw, weight, alt) ?? glyphPath(" ", weight, false)!
    glyphs.push({ ch: raw, x, w: g.w, d: g.d })
    x += g.w + SIDEBEARING + tracking
  }
  return { glyphs, width: glyphs.length ? x - SIDEBEARING - tracking : 0 }
}

// ---- the dragon's paths -------------------------------------------------------

export const SCENE_W = 1600
export const SCENE_H = 1000
/** Body length along its path, head to tail tip, in scene units. */
export const BODY_LEN = 2600
const ENTER_FROM = -700
const DRIFT = 70

export interface Scene {
  chapter: number
  /** which side of the path the back is on: -1 = left of travel */
  side: 1 | -1
  /** index into pts where the head rests on this page */
  rest: number
  /** how far the jaw hangs open at rest, radians */
  jaw: number
  pts: Pt[]
}

/**
 * One path per page. The head travels in along it, rests, and leaves along it;
 * the body follows the head's path exactly, so it slithers instead of morphing.
 * Every path starts and ends well outside the frame.
 */
export const SCENES: Scene[] = [
  // cover: coiled across the page, tail sweeping the bottom, head over the title
  {
    chapter: 0,
    side: -1,
    rest: 10,
    jaw: 0.16,
    pts: [[2000, 1060], [1560, 930], [1060, 900], [560, 850], [190, 700], [80, 430], [210, 170], [540, 70], [930, 70], [1210, 110], [1360, 220], [1360, 440], [1260, 720], [1180, 1100], [1160, 1600]],
  },
  // glyph set: rises from the lower right, mouth open at the alphabet
  {
    chapter: 2,
    side: 1,
    rest: 7,
    jaw: 0.42,
    pts: [[2300, 1500], [1900, 1180], [1580, 1080], [1380, 930], [1440, 760], [1520, 620], [1400, 520], [1220, 530], [1010, 640], [860, 860], [800, 1200], [780, 1700]],
  },
  // weights: drops in from the top left, legs dangling over the row of G's
  {
    chapter: 3,
    side: -1,
    rest: 5,
    jaw: 0.12,
    pts: [[-900, -500], [-400, -120], [80, 150], [520, 280], [880, 300], [1120, 250], [1380, 280], [1600, 120], [1900, -300], [2200, -800]],
  },
  // styles: climbs up out of the dark to the middle of the page
  {
    chapter: 4,
    side: 1,
    rest: 6,
    jaw: 0.24,
    pts: [[-700, 1700], [-100, 1420], [420, 1320], [920, 1260], [1090, 1080], [940, 920], [810, 790], [770, 520], [880, 60], [1100, -700]],
  },
  // alternates: lunges in from the left and roars at the type
  {
    chapter: 5,
    side: -1,
    rest: 4,
    jaw: 0.6,
    pts: [[-1900, 900], [-1000, 830], [-420, 720], [20, 610], [370, 560], [540, 660], [540, 900], [440, 1300], [300, 1800]],
  },
  // liquid: pours down the right side and curls round toward the drop
  {
    chapter: 6,
    side: 1,
    rest: 7,
    jaw: 0.3,
    pts: [[1800, -1000], [1560, -380], [1380, 60], [1470, 330], [1420, 590], [1240, 700], [1120, 760], [1000, 800], [760, 840], [400, 900]],
  },
]

export function catmull(pts: Pt[], per = 24): Pt[] {
  const out: Pt[] = []
  const n = pts.length
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(n - 1, i + 2)]
    for (let k = 0; k < per; k++) {
      const t = k / per
      const t2 = t * t
      const t3 = t2 * t
      const f = (a: number, b: number, c: number, d: number) =>
        0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3)
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])])
    }
  }
  out.push(pts[n - 1])
  return out
}

export interface Track {
  pts: Pt[]
  cum: number[]
  len: number
  restArc: number
}

export function makeTrack(s: Scene, per = 24): Track {
  const pts = catmull(s.pts, per)
  const cum = [0]
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]))
  return { pts, cum, len: cum[cum.length - 1], restArc: cum[s.rest * per] }
}

/** Position and unit tangent at arc length a. Past either end the path runs on straight. */
export function trackAt(tr: Track, a: number): [number, number, number, number] {
  const { pts, cum, len } = tr
  const n = pts.length
  const dir = (i: number, j: number) => {
    const dx = pts[j][0] - pts[i][0]
    const dy = pts[j][1] - pts[i][1]
    const l = Math.hypot(dx, dy) || 1
    return [dx / l, dy / l]
  }
  if (a <= 0) {
    const [tx, ty] = dir(0, 1)
    return [pts[0][0] + tx * a, pts[0][1] + ty * a, tx, ty]
  }
  if (a >= len) {
    const [tx, ty] = dir(n - 2, n - 1)
    return [pts[n - 1][0] + tx * (a - len), pts[n - 1][1] + ty * (a - len), tx, ty]
  }
  let lo = 0
  let hi = n - 1
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (cum[mid] <= a) lo = mid
    else hi = mid
  }
  const k = (a - cum[lo]) / (cum[hi] - cum[lo] || 1)
  const [tx, ty] = dir(lo, hi)
  return [lerp(pts[lo][0], pts[hi][0], k), lerp(pts[lo][1], pts[hi][1], k), tx, ty]
}

/** Where the head is along its page's path at page time t. */
export function headArc(tr: Track, t: number, first: boolean, last: boolean) {
  const rest = tr.restArc
  const exitTo = tr.len + BODY_LEN + 700
  if (first) {
    if (t < 0.42) return rest + DRIFT * smooth(0, 0.42, t) * 0.5
    return rest + DRIFT * 0.5 + easeIn(smooth(0.42, 1, t)) * (exitTo - rest - DRIFT * 0.5)
  }
  if (last) {
    if (t < 0.55) return lerp(ENTER_FROM, rest, easeOut(smooth(0, 0.55, t)))
    return rest + DRIFT * smooth(0.55, 1, t)
  }
  if (t < 0.4) return lerp(ENTER_FROM, rest, easeOut(smooth(0, 0.4, t)))
  if (t < 0.62) return rest + DRIFT * smooth(0.4, 0.62, t)
  return rest + DRIFT + easeIn(smooth(0.62, 1, t)) * (exitTo - rest - DRIFT)
}

/** Body half-width as a share of the full radius, u = 0 at the neck to 1 at the tail tip. */
export function bodyRadius(u: number) {
  if (u < 0.1) return 0.7 + 0.32 * smooth(0, 0.1, u)
  if (u < 0.42) return 1.02
  const k = (u - 0.42) / 0.58
  return Math.max(0.03, 1.02 * Math.pow(clamp01(1 - k), 0.8))
}

export function parseHex(c: string): [number, number, number] | null {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(c.trim())
  if (!m) return null
  const h = m[1].length === 3 ? m[1].replace(/./g, (x) => x + x) : m[1]
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

/** Mix two hex colours. Anything that is not hex falls back to whichever side dominates. */
export function mixColor(a: string, b: string, t: number) {
  const x = parseHex(a)
  const y = parseHex(b)
  if (!x || !y) return t < 0.5 ? a : b
  const c = [0, 1, 2].map((i) => Math.round(lerp(x[i], y[i], clamp01(t))))
  return "rgb(" + c.join(",") + ")"
}
// #endregion

// ---------------------------------------------------------------- the dragon (canvas)

const N_BODY = 120
const R_BODY = 78
const HEAD_UNIT = R_BODY * 1.02
const LIGHT: Pt = [-0.42, -0.907]

/** [shift toward light, half-width, tone (0 body .. 4 white), alpha], in body radii */
const SHADE: [number, number, number, number][] = [
  [0.14, 0.8, 0, 1],
  [0.2, 0.68, 1, 0.3],
  [0.25, 0.58, 1, 0.3],
  [0.3, 0.48, 1, 0.35],
  [0.35, 0.38, 2, 0.25],
  [0.39, 0.29, 2, 0.3],
  [0.43, 0.2, 2, 0.35],
  [0.46, 0.13, 3, 0.3],
  [0.48, 0.07, 3, 0.45],
  [0.5, 0.025, 4, 0.55],
]

type Q = { x: number; y: number; tx: number; ty: number; nx: number; ny: number; r: number }

type Tones = { base: string; body: string; mid: string; soft: string; hl: string; rim: string; eye: string }

function makeTones(dragon: string, rim: string, eye: string): Tones {
  return {
    base: mixColor(dragon, "#000000", 0.45),
    body: dragon,
    mid: mixColor(dragon, "#ffffff", 0.1),
    soft: mixColor(dragon, "#ffffff", 0.26),
    hl: mixColor(dragon, "#ffffff", 0.62),
    rim,
    eye,
  }
}

function bodyFrame(tr: Track, a: number, time: number, still: boolean): Q[] {
  const step = BODY_LEN / N_BODY
  const P: Q[] = []
  for (let j = 0; j <= N_BODY; j++) {
    const u = j / N_BODY
    const [x, y, tx, ty] = trackAt(tr, a - j * step)
    // a travelling wave down the body, stronger toward the tail: it is alive even at rest
    const env = smooth(0.03, 0.4, u) * (0.45 + 0.55 * u)
    const w = still
      ? 0
      : (Math.sin(((u * BODY_LEN) / 780) * Math.PI * 2 - time * 2.2) * 22 + Math.sin(u * 9.3 - time * 1.3) * 9) * env
    const breathe = still ? 1 : 1 + 0.028 * Math.sin(time * 1.9 - u * 5)
    P.push({ x: x - ty * w, y: y + tx * w, tx: 0, ty: 0, nx: 0, ny: 0, r: bodyRadius(u) * R_BODY * breathe })
  }
  for (let j = 0; j <= N_BODY; j++) {
    const a0 = P[Math.max(0, j - 1)]
    const b0 = P[Math.min(N_BODY, j + 1)]
    const dx = a0.x - b0.x
    const dy = a0.y - b0.y
    const l = Math.hypot(dx, dy) || 1
    P[j].tx = dx / l
    P[j].ty = dy / l
    P[j].nx = -dy / l
    P[j].ny = dx / l
  }
  return P
}

/** A strip along the body: shifted `k` radii toward the light, `w` radii wide. */
function tube(ctx: CanvasRenderingContext2D, P: Q[], i0: number, i1: number, k: number, w: number) {
  ctx.beginPath()
  for (let i = i0; i <= i1; i++) {
    const q = P[i]
    const o = (q.nx * LIGHT[0] + q.ny * LIGHT[1]) * k * q.r
    const h = w * q.r
    const x = q.x + q.nx * (o + h)
    const y = q.y + q.ny * (o + h)
    if (i === i0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  for (let i = i1; i >= i0; i--) {
    const q = P[i]
    const o = (q.nx * LIGHT[0] + q.ny * LIGHT[1]) * k * q.r
    const h = w * q.r
    ctx.lineTo(q.x + q.nx * (o - h), q.y + q.ny * (o - h))
  }
  ctx.closePath()
  ctx.fill()
}

/** A tapered quadratic horn or spike, base width `w`, with a lit edge. */
function horn(ctx: CanvasRenderingContext2D, x0: number, y0: number, cx: number, cy: number, x1: number, y1: number, w: number, fill: string, lit?: string) {
  const L: Pt[] = []
  const R: Pt[] = []
  const n = 12
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const m = 1 - t
    const x = m * m * x0 + 2 * m * t * cx + t * t * x1
    const y = m * m * y0 + 2 * m * t * cy + t * t * y1
    const dx = 2 * m * (cx - x0) + 2 * t * (x1 - cx)
    const dy = 2 * m * (cy - y0) + 2 * t * (y1 - cy)
    const l = Math.hypot(dx, dy) || 1
    const h = (w / 2) * Math.pow(1 - t, 0.9)
    L.push([x - (dy / l) * h, y + (dx / l) * h])
    R.push([x + (dy / l) * h, y - (dx / l) * h])
  }
  ctx.fillStyle = fill
  ctx.beginPath()
  L.concat(R.reverse()).forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
  ctx.closePath()
  ctx.fill()
  if (lit) {
    ctx.strokeStyle = lit
    ctx.lineWidth = w * 0.12
    ctx.lineCap = "round"
    ctx.beginPath()
    R.reverse().slice(1, -2).forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
    ctx.stroke()
  }
}

/** A limb segment: a quad tapering from wa to wb. */
function limb(ctx: CanvasRenderingContext2D, ax: number, ay: number, bx: number, by: number, wa: number, wb: number) {
  const dx = bx - ax
  const dy = by - ay
  const l = Math.hypot(dx, dy) || 1
  const nx = -dy / l
  const ny = dx / l
  ctx.beginPath()
  ctx.moveTo(ax + nx * wa, ay + ny * wa)
  ctx.lineTo(bx + nx * wb, by + ny * wb)
  ctx.arc(bx, by, wb, Math.atan2(ny, nx), Math.atan2(-ny, -nx))
  ctx.lineTo(ax - nx * wa, ay - ny * wa)
  ctx.arc(ax, ay, wa, Math.atan2(-ny, -nx), Math.atan2(ny, nx))
  ctx.fill()
}

type DrawOpts = {
  side: 1 | -1
  jaw: number
  blink: number
  look: number
  pupil: Pt
  tones: Tones
  px: number
  gait: number
  alpha: number
}

function drawLeg(ctx: CanvasRenderingContext2D, P: Q[], u: number, hind: boolean, far: boolean, o: DrawOpts) {
  const q = P[Math.round(u * N_BODY)]
  const dX = o.side * q.nx
  const dY = o.side * q.ny
  const vX = -dX
  const vY = -dY
  // +1 when rotating the belly direction positively swings it toward the head
  const st = -vY * q.tx + vX * q.ty >= 0 ? 1 : -1
  const ph = o.gait + (hind ? Math.PI : 0) + (far ? Math.PI * 0.85 : 0)
  const base = Math.atan2(vY, vX)
  const upper = base + st * ((hind ? -0.6 : 0.55) + 0.45 * Math.sin(ph))
  const lower = upper + st * ((hind ? 0.9 : -1.0) + 0.3 * Math.cos(ph))
  const sx = q.x + vX * q.r * 0.3 + (far ? dX * q.r * 0.3 + q.tx * 14 : 0)
  const sy = q.y + vY * q.r * 0.3 + (far ? dY * q.r * 0.3 + q.ty * 14 : 0)
  const L1 = R_BODY * 1.45
  const L2 = R_BODY * 1.2
  const ex = sx + Math.cos(upper) * L1
  const ey = sy + Math.sin(upper) * L1
  const wx = ex + Math.cos(lower) * L2
  const wy = ey + Math.sin(lower) * L2
  ctx.fillStyle = far ? o.tones.base : o.tones.body
  limb(ctx, sx, sy, ex, ey, R_BODY * 0.42, R_BODY * 0.25)
  limb(ctx, ex, ey, wx, wy, R_BODY * 0.25, R_BODY * 0.13)
  // long bony talons, curling toward the belly
  for (const s of [-0.62, -0.2, 0.22, 0.62]) {
    const a = lower + st * s * (far ? 0.8 : 1)
    const cx = wx + Math.cos(a) * R_BODY * 0.5
    const cy = wy + Math.sin(a) * R_BODY * 0.5
    const a2 = a - st * 0.7
    horn(ctx, wx, wy, cx, cy, cx + Math.cos(a2) * R_BODY * 0.46, cy + Math.sin(a2) * R_BODY * 0.46, R_BODY * 0.15, far ? o.tones.base : o.tones.body, far ? undefined : o.tones.soft)
  }
  if (!far) {
    // wet light down the near leg, from where it leaves the body
    const lx = LIGHT[0] * R_BODY * 0.1
    const ly = LIGHT[1] * R_BODY * 0.1
    const mx = lerp(sx, ex, 0.4)
    const my = lerp(sy, ey, 0.4)
    ctx.fillStyle = o.tones.mid
    ctx.globalAlpha = o.alpha * 0.7
    limb(ctx, mx + lx, my + ly, ex + lx, ey + ly, R_BODY * 0.2, R_BODY * 0.13)
    limb(ctx, ex + lx, ey + ly, wx + lx * 0.5, wy + ly * 0.5, R_BODY * 0.13, R_BODY * 0.06)
    ctx.strokeStyle = o.tones.hl
    ctx.globalAlpha = o.alpha * 0.4
    ctx.lineWidth = R_BODY * 0.035
    ctx.lineCap = "round"
    ctx.beginPath()
    ctx.moveTo(mx + lx * 2, my + ly * 2)
    ctx.lineTo(ex + lx * 1.8, ey + ly * 1.8)
    ctx.lineTo(wx + lx, wy + ly)
    ctx.stroke()
    ctx.globalAlpha = o.alpha
  }
}

function drawHead(ctx: CanvasRenderingContext2D, P: Q[], o: DrawOpts) {
  const q = P[0]
  const c = Math.cos(o.look)
  const s = Math.sin(o.look)
  const fx = q.tx * c - q.ty * s
  const fy = q.tx * s + q.ty * c
  // the belly side, so the jaw always hangs below the back
  const vx = -o.side * -fy
  const vy = -o.side * fx
  const H = HEAD_UNIT
  const t = o.tones
  ctx.save()
  ctx.transform(fx * H, fy * H, vx * H, vy * H, q.x, q.y)

  // far horn and the frill behind the jaw
  horn(ctx, 1.1, -0.92, -0.3, -1.95, -2.2, -2.2, 0.32, t.base)
  horn(ctx, 0.2, 0.55, -0.5, 0.78, -1.4, 1.1, 0.24, t.base)
  horn(ctx, -0.3, 0.15, -1.0, 0.2, -1.75, 0.5, 0.22, t.base)

  const hx = 0.8
  const hy = 0.24
  const ja = o.jaw
  const cj = Math.cos(ja)
  const sj = Math.sin(ja)
  const rot = (x: number, y: number): Pt => [hx + (x - hx) * cj - (y - hy) * sj, hy + (x - hx) * sj + (y - hy) * cj]

  // inside of the mouth
  if (ja > 0.02) {
    const tip = rot(3.95, 0.26)
    const mid = rot(2.2, 0.3)
    const g = ctx.createLinearGradient(1, 0, 4, 0)
    g.addColorStop(0, "#1a0204")
    g.addColorStop(1, "#6e0a10")
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.moveTo(hx - 0.2, hy)
    ctx.lineTo(4.05, 0.14)
    ctx.lineTo(tip[0], tip[1])
    ctx.quadraticCurveTo(mid[0], mid[1], hx - 0.2, hy + 0.12)
    ctx.closePath()
    ctx.fill()
  }

  // lower jaw, hinged behind the eye
  ctx.save()
  ctx.translate(hx, hy)
  ctx.rotate(ja)
  ctx.translate(-hx, -hy)
  if (ja > 0.12) {
    ctx.fillStyle = "#a3142a"
    ctx.beginPath()
    ctx.moveTo(0.9, 0.3)
    ctx.quadraticCurveTo(2.2, 0.16, 3.3, 0.28)
    ctx.quadraticCurveTo(2.2, 0.42, 0.9, 0.42)
    ctx.fill()
  }
  ctx.fillStyle = "#d9cdb8"
  for (let x = 1.3; x < 3.85; x += 0.3) {
    const len = Math.abs(x - 3.4) < 0.15 ? 0.34 : 0.14
    ctx.beginPath()
    ctx.moveTo(x - 0.06, 0.24)
    ctx.lineTo(x + 0.02, 0.24 - len)
    ctx.lineTo(x + 0.07, 0.24)
    ctx.fill()
  }
  ctx.fillStyle = t.body
  ctx.beginPath()
  ctx.moveTo(0.3, 0.2)
  ctx.lineTo(3.95, 0.22)
  ctx.quadraticCurveTo(4.08, 0.44, 3.65, 0.56)
  ctx.quadraticCurveTo(2.2, 0.8, 0.3, 0.98)
  ctx.quadraticCurveTo(-0.25, 0.6, 0.3, 0.2)
  ctx.fill()
  ctx.strokeStyle = t.rim
  ctx.globalAlpha = o.alpha * 0.6
  ctx.lineWidth = 0.07
  ctx.beginPath()
  ctx.moveTo(0.35, 0.9)
  ctx.quadraticCurveTo(2.2, 0.72, 3.62, 0.5)
  ctx.stroke()
  ctx.globalAlpha = o.alpha
  ctx.restore()

  // skull
  const skull = () => {
    ctx.beginPath()
    ctx.moveTo(-1.25, -0.42)
    ctx.quadraticCurveTo(-0.6, -1.2, 0.3, -1.15)
    ctx.quadraticCurveTo(0.8, -1.12, 1.2, -1.05)
    ctx.lineTo(1.95, -0.96)
    ctx.quadraticCurveTo(2.2, -0.62, 2.6, -0.6)
    ctx.quadraticCurveTo(3.6, -0.58, 4.35, -0.26)
    ctx.quadraticCurveTo(4.48, 0.0, 4.2, 0.13)
    ctx.lineTo(1.0, 0.26)
    ctx.quadraticCurveTo(0.2, 0.62, -0.7, 0.62)
    ctx.quadraticCurveTo(-1.5, 0.3, -1.25, -0.42)
    ctx.closePath()
  }
  skull()
  ctx.fillStyle = t.body
  ctx.fill()
  const gloss = ctx.createRadialGradient(1.1, -0.85, 0.05, 1.1, -0.6, 1.9)
  gloss.addColorStop(0, t.soft)
  gloss.addColorStop(0.35, t.mid)
  gloss.addColorStop(1, t.body)
  ctx.fillStyle = gloss
  ctx.globalAlpha = o.alpha * 0.8
  ctx.fill()
  ctx.globalAlpha = o.alpha
  // wet ridge light along the brow and snout
  ctx.lineCap = "round"
  ctx.strokeStyle = t.hl
  ctx.lineWidth = 0.06
  ctx.globalAlpha = o.alpha * 0.7
  ctx.beginPath()
  ctx.moveTo(-0.45, -0.86)
  ctx.quadraticCurveTo(0.3, -1.16, 1.25, -0.98)
  ctx.moveTo(2.7, -0.52)
  ctx.quadraticCurveTo(3.5, -0.5, 4.2, -0.24)
  ctx.stroke()
  ctx.strokeStyle = "#ffffff"
  ctx.lineWidth = 0.02
  ctx.globalAlpha = o.alpha * 0.6
  ctx.beginPath()
  ctx.moveTo(-0.1, -0.98)
  ctx.quadraticCurveTo(0.4, -1.12, 0.95, -1.02)
  ctx.moveTo(3.0, -0.5)
  ctx.quadraticCurveTo(3.5, -0.46, 3.95, -0.3)
  ctx.stroke()
  // cheek muscle and snout creases
  ctx.strokeStyle = "#000000"
  ctx.globalAlpha = o.alpha * 0.45
  ctx.lineWidth = 0.05
  ctx.beginPath()
  ctx.moveTo(-0.3, 0.35)
  ctx.quadraticCurveTo(0.5, -0.1, 1.3, -0.25)
  ctx.moveTo(2.55, -0.45)
  ctx.lineTo(2.75, -0.2)
  ctx.moveTo(2.85, -0.48)
  ctx.lineTo(3.02, -0.24)
  ctx.stroke()
  ctx.strokeStyle = t.rim
  ctx.globalAlpha = o.alpha * 0.45
  ctx.lineWidth = 0.06
  ctx.beginPath()
  ctx.moveTo(-0.6, 0.66)
  ctx.quadraticCurveTo(0.3, 0.55, 1.0, 0.3)
  ctx.stroke()
  ctx.globalAlpha = o.alpha

  // a frill of thorns where the skull meets the neck
  horn(ctx, -0.5, -0.75, -1.2, -1.05, -2.0, -1.0, 0.3, t.body, t.soft)
  horn(ctx, -0.8, -0.2, -1.6, -0.35, -2.3, -0.2, 0.3, t.body, t.soft)
  horn(ctx, -0.8, 0.35, -1.5, 0.4, -2.1, 0.7, 0.26, t.body, t.soft)

  // upper teeth, fangs forward
  ctx.fillStyle = "#e6dac6"
  for (let x = 1.2; x < 4.05; x += 0.28) {
    const y = 0.26 - (x - 1.0) * 0.042
    const len = Math.abs(x - 3.72) < 0.15 ? 0.42 : Math.abs(x - 2.04) < 0.15 ? 0.26 : 0.15
    ctx.beginPath()
    ctx.moveTo(x - 0.07, y)
    ctx.lineTo(x - 0.02, y + len)
    ctx.lineTo(x + 0.07, y)
    ctx.fill()
  }

  // near horn, brow thorn and nose horn
  horn(ctx, 0.75, -0.98, -0.8, -1.7, -2.6, -1.7, 0.36, t.body, t.soft)
  horn(ctx, 1.65, -1.0, 1.4, -1.35, 1.0, -1.6, 0.14, t.body, t.soft)
  horn(ctx, 3.3, -0.55, 3.6, -0.95, 4.05, -1.35, 0.16, t.body, t.soft)

  // the eye: a hot slit under a heavy brow
  const eh = 0.17 * (1 - o.blink)
  ctx.fillStyle = "#050405"
  ctx.beginPath()
  ctx.ellipse(1.8, -0.6, 0.44, 0.2, -0.06, 0, Math.PI * 2)
  ctx.fill()
  if (eh > 0.01) {
    const almond = () => {
      ctx.beginPath()
      ctx.moveTo(1.4, -0.56)
      ctx.quadraticCurveTo(1.78, -0.6 - eh * 2, 2.2, -0.65)
      ctx.quadraticCurveTo(1.82, -0.6 + eh * 1.3, 1.4, -0.56)
      ctx.closePath()
    }
    ctx.save()
    ctx.shadowColor = t.eye
    ctx.shadowBlur = 22 * o.px
    ctx.fillStyle = t.eye
    almond()
    ctx.fill()
    ctx.restore()
    ctx.save()
    almond()
    ctx.clip()
    const ig = ctx.createRadialGradient(1.8, -0.62, 0.01, 1.8, -0.62, 0.36)
    ig.addColorStop(0, "#ffe1c8")
    ig.addColorStop(0.3, t.eye)
    ig.addColorStop(1, "#3a0000")
    ctx.fillStyle = ig
    ctx.fillRect(1.3, -1, 1, 0.8)
    ctx.fillStyle = "#0a0000"
    ctx.beginPath()
    ctx.ellipse(1.82 + o.pupil[0] * 0.09, -0.61 + o.pupil[1] * 0.03, 0.035, 0.16, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
  ctx.strokeStyle = t.base
  ctx.lineWidth = 0.13
  ctx.lineCap = "round"
  ctx.beginPath()
  ctx.moveTo(1.28, -0.78)
  ctx.quadraticCurveTo(1.8, -0.9, 2.32, -0.7)
  ctx.stroke()
  ctx.strokeStyle = t.soft
  ctx.lineWidth = 0.03
  ctx.beginPath()
  ctx.moveTo(1.35, -0.86)
  ctx.quadraticCurveTo(1.8, -0.97, 2.2, -0.82)
  ctx.stroke()
  // nostril
  ctx.fillStyle = "#050405"
  ctx.beginPath()
  ctx.ellipse(3.98, -0.28, 0.09, 0.035, -0.4, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function drawDragon(ctx: CanvasRenderingContext2D, P: Q[], o: DrawOpts) {
  const t = o.tones
  ctx.globalAlpha = o.alpha
  // a soft cast shadow on the page
  ctx.save()
  ctx.shadowColor = "rgba(20,0,0,0.5)"
  ctx.shadowBlur = 40 * o.px
  ctx.shadowOffsetX = 18 * o.px
  ctx.shadowOffsetY = 30 * o.px
  ctx.fillStyle = t.base
  tube(ctx, P, 0, N_BODY, 0, 1)
  ctx.restore()

  // legs first: they come out from under the belly
  drawLeg(ctx, P, 0.13, false, true, o)
  drawLeg(ctx, P, 0.47, true, true, o)
  drawLeg(ctx, P, 0.47, true, false, o)
  drawLeg(ctx, P, 0.13, false, false, o)

  // one pass: none of the paths cross themselves, and chunk seams would show
  const CH = N_BODY
  for (let hi = N_BODY; hi > 0; hi -= CH) {
    const lo = Math.max(0, hi - CH)
    const top = Math.min(N_BODY, hi + 1)
    // thorns along the back
    ctx.fillStyle = t.base
    for (let j = lo; j < top; j++) {
      if (j % 3 || j < 5 || j > N_BODY * 0.86) continue
      const q = P[j]
      const u = j / N_BODY
      const dX = o.side * q.nx
      const dY = o.side * q.ny
      const sz = q.r * 0.55 * (1 - u * 0.5)
      const bx = q.x + dX * q.r * 0.78
      const by = q.y + dY * q.r * 0.78
      ctx.beginPath()
      ctx.moveTo(bx + q.tx * sz * 0.45, by + q.ty * sz * 0.45)
      ctx.quadraticCurveTo(bx + dX * sz * 0.7, by + dY * sz * 0.7, bx + dX * sz * 1.15 - q.tx * sz * 0.8, by + dY * sz * 1.15 - q.ty * sz * 0.8)
      ctx.lineTo(bx - q.tx * sz * 0.45, by - q.ty * sz * 0.45)
      ctx.fill()
    }
    ctx.fillStyle = t.base
    tube(ctx, P, lo, top, 0, 1)
    ctx.fillStyle = t.rim
    ctx.globalAlpha = o.alpha * 0.45
    tube(ctx, P, lo, top, -0.62, 0.3)
    ctx.globalAlpha = o.alpha * 0.85
    tube(ctx, P, lo, top, -0.85, 0.07)
    ctx.globalAlpha = o.alpha
    // a glossy round tube: many thin strips stacked toward the light
    for (const [k, w, col, al] of SHADE) {
      ctx.fillStyle = col === 0 ? t.body : col === 1 ? t.mid : col === 2 ? t.soft : col === 3 ? t.hl : "#ffffff"
      ctx.globalAlpha = o.alpha * al
      tube(ctx, P, lo, top, k, w)
    }
    ctx.globalAlpha = o.alpha
    // belly folds
    ctx.strokeStyle = "#000000"
    ctx.globalAlpha = o.alpha * 0.32
    ctx.lineWidth = 3
    ctx.beginPath()
    for (let j = lo; j < top; j++) {
      if (j % 3 !== 1 || j > N_BODY * 0.8) continue
      const q = P[j]
      const vX = -o.side * q.nx
      const vY = -o.side * q.ny
      ctx.moveTo(q.x + vX * q.r * 0.2, q.y + vY * q.r * 0.2)
      ctx.quadraticCurveTo(q.x + vX * q.r * 0.6 - q.tx * q.r * 0.2, q.y + vY * q.r * 0.6 - q.ty * q.r * 0.2, q.x + vX * q.r * 0.93, q.y + vY * q.r * 0.93)
    }
    ctx.stroke()
    ctx.globalAlpha = o.alpha
  }

  drawHead(ctx, P, o)
  ctx.globalAlpha = 1
}

/** Page two: a slot in the page, and an eye opening behind it. */
function drawEyeSlot(ctx: CanvasRenderingContext2D, t: number, pupil: Pt, blink: number, tones: Tones, px: number) {
  const reveal = smooth(0.03, 0.28, t) * (1 - smooth(0.8, 0.97, t))
  if (reveal <= 0.001) return
  const open = smooth(0.22, 0.5, t) * (1 - smooth(0.68, 0.84, t))
  const cx = 800
  const cy = 445
  const W = 460
  const H = 270 * reveal
  ctx.save()
  ctx.beginPath()
  ctx.rect(cx - W / 2, cy - H / 2, W, H)
  ctx.clip()
  const g = ctx.createRadialGradient(cx - 70, cy - 90, 10, cx, cy, 320)
  g.addColorStop(0, tones.mid)
  g.addColorStop(0.5, tones.body)
  g.addColorStop(1, "#050405")
  ctx.fillStyle = g
  ctx.fillRect(cx - W / 2, cy - 140, W, 280)
  // scale folds around the socket
  ctx.lineCap = "round"
  for (let k = 0; k < 7; k++) {
    for (const [a0, a1] of [[Math.PI * 1.06, Math.PI * 1.94], [Math.PI * 0.12, Math.PI * 0.88]]) {
      ctx.beginPath()
      ctx.ellipse(cx, cy, 190 + k * 30, 64 + k * 22, 0, a0, a1)
      ctx.strokeStyle = "rgba(0,0,0,0.55)"
      ctx.lineWidth = 7
      ctx.stroke()
      ctx.beginPath()
      ctx.ellipse(cx, cy - 4, 190 + k * 30, 64 + k * 22, 0, a0 + 0.1, a1 - 0.1)
      ctx.strokeStyle = tones.soft
      ctx.globalAlpha = 0.22 - k * 0.025
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.globalAlpha = 1
    }
  }
  const eh = 66 * open * (1 - blink)
  if (eh > 0.5) {
    const almond = () => {
      ctx.beginPath()
      ctx.moveTo(cx - 175, cy + 8)
      ctx.quadraticCurveTo(cx - 20, cy - eh * 2, cx + 175, cy - 10)
      ctx.quadraticCurveTo(cx + 10, cy + eh * 1.5, cx - 175, cy + 8)
      ctx.closePath()
    }
    ctx.save()
    ctx.shadowColor = tones.eye
    ctx.shadowBlur = 50 * px
    ctx.fillStyle = tones.eye
    almond()
    ctx.fill()
    ctx.restore()
    ctx.save()
    almond()
    ctx.clip()
    const ig = ctx.createRadialGradient(cx - 10, cy - 6, 4, cx, cy, 190)
    ig.addColorStop(0, "#ffe6cf")
    ig.addColorStop(0.25, tones.eye)
    ig.addColorStop(0.75, "#6a0303")
    ig.addColorStop(1, "#1a0000")
    ctx.fillStyle = ig
    ctx.fillRect(cx - 180, cy - 140, 360, 280)
    ctx.strokeStyle = "rgba(60,0,0,0.5)"
    ctx.lineWidth = 1.5
    ctx.beginPath()
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * Math.PI * 2
      ctx.moveTo(cx + Math.cos(a) * 40, cy + Math.sin(a) * 30)
      ctx.lineTo(cx + Math.cos(a) * 180, cy + Math.sin(a) * 130)
    }
    ctx.stroke()
    ctx.fillStyle = "#070000"
    ctx.beginPath()
    ctx.ellipse(cx + pupil[0] * 60, cy + pupil[1] * 14, 9 + 8 * (1 - open), 78 * open, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = "rgba(255,255,255,0.75)"
    ctx.beginPath()
    ctx.ellipse(cx - 46 + pupil[0] * 20, cy - 22, 14, 7, -0.2, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
  // heavy lids
  ctx.strokeStyle = "#050405"
  ctx.lineWidth = 12
  ctx.beginPath()
  ctx.moveTo(cx - 185, cy + 8)
  ctx.quadraticCurveTo(cx - 20, cy - Math.max(eh, 6) * 2.1, cx + 185, cy - 10)
  ctx.moveTo(cx - 185, cy + 8)
  ctx.quadraticCurveTo(cx + 10, cy + Math.max(eh, 4) * 1.6, cx + 185, cy - 10)
  ctx.stroke()
  ctx.restore()
}

// ---------------------------------------------------------------- the type (svg)

const MONO = 'ui-monospace, "SFMono-Regular", "JetBrains Mono", Menlo, Consolas, monospace'

const styleSpec = (s: SpecimenStyle) => ({
  weight: s === "bold" || s === "bold-outline" ? WEIGHTS.bold : WEIGHTS.regular,
  outline: s === "outline" || s === "bold-outline",
})

type WordProps = {
  text: string
  x: number
  y: number
  cap: number
  weight?: number
  tracking?: number
  anchor?: "start" | "middle" | "end"
  fill: string
  outline?: string
  alt?: boolean
  reveal?: number
  opacity?: number
}

/** A word in the specimen face. y is the baseline; `outline` is a filter id. */
const Word = React.memo(function Word({
  text,
  x,
  y,
  cap,
  weight = WEIGHTS.regular,
  tracking = 0,
  anchor = "start",
  fill,
  outline,
  alt = false,
  reveal = 1,
  opacity = 1,
}: WordProps) {
  const lay = React.useMemo(() => layoutWord(text, weight, tracking, alt), [text, weight, tracking, alt])
  const s = cap / 100
  const x0 = anchor === "middle" ? x - (lay.width * s) / 2 : anchor === "end" ? x - lay.width * s : x
  const n = Math.max(1, lay.glyphs.length)
  return (
    <g
      transform={"translate(" + x0.toFixed(1) + " " + (y - cap).toFixed(1) + ") scale(" + s.toFixed(4) + ")"}
      fill={fill}
      opacity={opacity}
      filter={outline ? "url(#" + outline + ")" : undefined}
    >
      {lay.glyphs.map((g, i) => {
        // each letter climbs up out of its own baseline, left to right
        const k = clamp01((reveal - (i / n) * 0.45) / 0.55)
        if (k <= 0) return null
        const e = easeOut(k)
        return <path key={i} d={g.d} transform={"translate(" + g.x + " " + ((1 - e) * 60).toFixed(2) + ")"} opacity={e} />
      })}
    </g>
  )
})

function Mono({
  x,
  y,
  size = 14,
  fill,
  anchor = "start",
  spacing = 0.28,
  opacity = 1,
  children,
}: {
  x: number
  y: number
  size?: number
  fill: string
  anchor?: "start" | "middle" | "end"
  spacing?: number
  opacity?: number
  children: React.ReactNode
}) {
  return (
    <text
      x={x}
      y={y}
      fill={fill}
      opacity={opacity}
      textAnchor={anchor}
      style={{ font: "600 " + size + "px " + MONO, letterSpacing: spacing + "em", textTransform: "uppercase" }}
    >
      {children}
    </text>
  )
}

/** Fit a word into a width: returns the cap height to use, never above `max`. */
function fitCap(text: string, weight: number, tracking: number, width: number, max: number) {
  const w = layoutWord(text, weight, tracking).width
  return w > 0 ? Math.min(max, (width / w) * 100) : max
}

// ---------------------------------------------------------------- component

function usePrefersReducedMotion() {
  const [reduced, setReduced] = React.useState(false)
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReduced(mq.matches)
    const h = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener("change", h)
    return () => mq.removeEventListener("change", h)
  }, [])
  return reduced
}

const ALPHABET_ROWS = ["ABCDEFGHI", "JKLMNOPQR", "STUVWXYZ", "0123456789"]
const STYLES: SpecimenStyle[] = ["regular", "bold", "outline", "bold-outline"]
const G_WEIGHTS = [7, 11, 15, 20]

type Frame = { p: number; intro: number }

export default function DragonTypeSpecimen({
  title = "DRAKON",
  subtitle = "TYPEFACE",
  studio = "STUDIO WYRM",
  year = "2026",
  specimenWord = "SNARL",
  background = "#e3160f",
  night = "#0b0a0b",
  ink = "#f7d117",
  dragonColor = "#1f1d21",
  eyeColor = "#ff2a1a",
  defaultStyle = "regular",
  height = "100svh",
  scrollDistance = "700svh",
  progress,
  hint = true,
  className = "",
}: DragonTypeSpecimenProps) {
  const rootRef = React.useRef<HTMLElement | null>(null)
  const stageRef = React.useRef<HTMLDivElement | null>(null)
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
  const blobRefs = React.useRef<(SVGCircleElement | null)[]>([])
  const dripRefs = React.useRef<(SVGCircleElement | null)[]>([])
  const reduced = usePrefersReducedMotion()
  const id = "dts" + React.useId().replace(/[^a-zA-Z0-9]/g, "")
  const controlled = progress !== undefined
  const [f, setF] = React.useState<Frame>({ p: progress ?? 0, intro: 0 })
  const [view, setView] = React.useState({ w: 1600, h: 1000 })
  const [style, setStyle] = React.useState<SpecimenStyle>(defaultStyle)
  const [glyph, setGlyph] = React.useState("A")
  const [hoverG, setHoverG] = React.useState(-1)

  const tracks = React.useMemo(() => SCENES.map((s) => makeTrack(s)), [])
  const tones = React.useMemo(() => makeTones(dragonColor, background, eyeColor), [dragonColor, background, eyeColor])

  const cfg = React.useRef({ progress, controlled, reduced, tones })
  cfg.current = { progress, controlled, reduced, tones }
  const pointer = React.useRef<{ x: number; y: number } | null>(null)
  const snapAt = React.useRef(-1e9)

  React.useEffect(() => {
    const root = rootRef.current
    const stage = stageRef.current
    const canvas = canvasRef.current
    if (!root || !stage || !canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    let raf = 0
    let visible = true
    let p = cfg.current.progress ?? 0
    let intro = 0
    let last: Frame | null = null
    let look = 0
    let pupil: Pt = [0, 0]
    let blob: Pt = [520, 860]
    let nextBlink = performance.now() + 2200
    const t0 = performance.now()
    const size = { w: 1, h: 1, dpr: 1 }

    const measure = () => {
      const r = stage.getBoundingClientRect()
      size.w = Math.max(1, r.width)
      size.h = Math.max(1, r.height)
      size.dpr = Math.min(2, window.devicePixelRatio || 1)
      canvas.width = Math.round(size.w * size.dpr)
      canvas.height = Math.round(size.h * size.dpr)
      setView({ w: size.w, h: size.h })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(stage)
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      if (visible && !raf) raf = requestAnimationFrame(tick)
    })
    io.observe(root)

    function tick(now: number) {
      raf = 0
      if (!visible) return
      const c = cfg.current
      const target = c.controlled
        ? clamp01(c.progress ?? 0)
        : scrollProgress(root!.getBoundingClientRect().top, root!.offsetHeight, stage!.offsetHeight)
      p = c.reduced ? target : p + (target - p) * 0.1
      if (Math.abs(target - p) < 0.0002) p = target
      intro = c.reduced ? 1 : Math.min(1, (now - t0) / 1800)
      if (!last || Math.abs(p - last.p) > 1e-5 || intro !== last.intro) {
        last = { p, intro }
        setF(last)
      }

      const time = c.reduced ? 0 : now / 1000
      const scale = Math.min(size.w / 1300, size.h / SCENE_H)
      const vx = SCENE_W / 2 - size.w / 2 / scale
      const vy = SCENE_H / 2 - size.h / 2 / scale
      const px = scale * size.dpr
      ctx!.setTransform(1, 0, 0, 1, 0, 0)
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height)
      ctx!.setTransform(px, 0, 0, px, -vx * px, -vy * px)

      const r = stage!.getBoundingClientRect()
      const ptr: Pt | null = pointer.current
        ? [(pointer.current.x - r.left) / scale + vx, (pointer.current.y - r.top) / scale + vy]
        : null

      // blinks, and the click snap
      let blink = 0
      if (!c.reduced) {
        const since = now - nextBlink
        if (since > 0) blink = since < 80 ? since / 80 : since < 200 ? 1 - (since - 80) / 120 : 0
        if (since > 200) nextBlink = now + 2600 + Math.random() * 3400
      }
      const sinceSnap = now - snapAt.current
      const snap = c.reduced ? 0 : sinceSnap < 110 ? sinceSnap / 110 : Math.max(0, 1 - (sinceSnap - 110) / 520)

      const { i, t } = chapterAt(p)

      // the liquid drop on the last page follows the pointer
      const lt = localT(p, LAST)
      if (lt > -0.05) {
        const want: Pt = ptr && ptr[1] > 380 ? [Math.max(440, Math.min(1500, ptr[0])), Math.min(960, ptr[1])] : [520 + Math.sin(time * 0.6) * 30, 860 + Math.cos(time * 0.8) * 12]
        blob = [lerp(blob[0], want[0], c.reduced ? 1 : 0.08), lerp(blob[1], want[1], c.reduced ? 1 : 0.08)]
        blobRefs.current.forEach((el, k) => {
          if (!el) return
          const a = time * (0.9 + k * 0.23) + k * 1.9
          const rr = k === 0 ? 0 : 34 + k * 9
          el.setAttribute("cx", (blob[0] + Math.cos(a) * rr).toFixed(1))
          el.setAttribute("cy", (blob[1] + Math.sin(a * 1.3) * rr * 0.6).toFixed(1))
        })
        dripRefs.current.forEach((el, k) => {
          if (!el) return
          const cyc = (time * 0.35 + k * 0.37) % 1
          el.setAttribute("cy", (700 + cyc * 190).toFixed(1))
          el.setAttribute("r", (c.reduced ? 0 : 15 * (1 - cyc)).toFixed(1))
        })
      }

      if (i === 1) {
        const wantP: Pt = ptr ? [Math.max(-1, Math.min(1, (ptr[0] - 800) / 500)), Math.max(-1, Math.min(1, (ptr[1] - 445) / 300))] : [Math.sin(time * 0.5) * 0.5, 0]
        pupil = [lerp(pupil[0], wantP[0], 0.12), lerp(pupil[1], wantP[1], 0.12)]
        drawEyeSlot(ctx!, t, pupil, blink, c.tones, px)
      }

      const si = SCENES.findIndex((s) => s.chapter === i)
      if (si >= 0) {
        const scene = SCENES[si]
        const tr = tracks[si]
        let a = headArc(tr, t, i === 0, i === LAST)
        let alpha = 1
        if (c.reduced) {
          a = tr.restArc
          alpha = chapterVis(i, t)
        }
        const restness = clamp01(1 - Math.abs(a - tr.restArc - DRIFT * 0.5) / 500)
        a += snap * 55 * restness
        if (alpha > 0.01) {
          const P = bodyFrame(tr, a, time, c.reduced)
          // the head turns toward the pointer (or the drop, on the last page) while it rests
          const focus: Pt | null = i === LAST ? blob : ptr
          let want = Math.sin(time * 0.7) * 0.1
          if (focus) {
            const ang = Math.atan2(focus[1] - P[0].y, focus[0] - P[0].x) - Math.atan2(P[0].ty, P[0].tx)
            const wrapped = Math.atan2(Math.sin(ang), Math.cos(ang))
            want = Math.max(-0.5, Math.min(0.5, wrapped)) * 0.7
          }
          look = lerp(look, want * restness, 0.08)
          const pp: Pt = focus ? [Math.max(-1, Math.min(1, (focus[0] - P[0].x) / 600)), Math.max(-1, Math.min(1, (focus[1] - P[0].y) / 400))] : [0, 0]
          pupil = [lerp(pupil[0], pp[0], 0.1), lerp(pupil[1], pp[1], 0.1)]
          drawDragon(ctx!, P, {
            side: scene.side,
            jaw: scene.jaw * (0.6 + 0.4 * restness) + (c.reduced ? 0 : 0.04 * Math.sin(time * 1.7)) + 0.45 * snap,
            blink: Math.max(blink, 0),
            look,
            pupil,
            tones: c.tones,
            px,
            gait: a / 170 + time * 0.8,
            alpha,
          })
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      ro.disconnect()
    }
  }, [tracks])

  // ---- layout, in scene units; the svg and the canvas share one mapping
  const scale = Math.min(view.w / 1300, view.h / SCENE_H)
  const vw = view.w / scale
  const vh = view.h / scale
  const viewBox = (SCENE_W / 2 - vw / 2).toFixed(1) + " " + (SCENE_H / 2 - vh / 2).toFixed(1) + " " + vw.toFixed(1) + " " + vh.toFixed(1)

  const cur = chapterAt(f.p).i
  const vis = CHAPTERS.map((_, i) => chapterVis(i, localT(f.p, i)))
  const rev = CHAPTERS.map((_, i) => (i === 0 ? easeOut(f.intro * 1.1) : smooth(0.02, 0.36, localT(f.p, i))))
  const bg = mixColor(background, night, vis[4])
  const st = styleSpec(style)
  const outlineId = id + "-outline"
  const titleCap = fitCap(title, st.weight, 0, 1180, 230)
  const titleW = (layoutWord(title, st.weight).width * titleCap) / 100
  const half = Math.ceil(title.length / 2)
  const specCap = fitCap(specimenWord, WEIGHTS.regular, 20, 660, 150)

  const pageLabel = (i: number) => (i + 1 < 10 ? "0" : "") + (i + 1)

  return (
    <section
      ref={rootRef}
      className={"relative w-full " + className}
      style={{ height: controlled ? height : "calc(" + height + " + " + scrollDistance + ")", background: bg, overflow: "clip" }}
      aria-label={title + " " + subtitle + ": a type specimen with a dragon moving through it"}
    >
      <div
        ref={stageRef}
        className="sticky top-0 w-full overflow-hidden select-none"
        style={{ height, background: bg, cursor: "crosshair" }}
        onPointerMove={(e) => (pointer.current = { x: e.clientX, y: e.clientY })}
        onPointerLeave={() => (pointer.current = null)}
        onPointerDown={(e) => {
          if (!(e.target as Element).closest("[data-ui]")) snapAt.current = performance.now()
        }}
      >
        {/* behind the dragon: grain, vignette and the dark page's needle cross */}
        <svg
          viewBox={viewBox}
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", maxWidth: "none", display: "block" }}
        >
          <defs>
            <filter id={id + "-grain"} x="0" y="0" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" stitchTiles="stitch" />
              <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.55 0" />
            </filter>
            <radialGradient id={id + "-vig"} cx="0.5" cy="0.5" r="0.75">
              <stop offset="0.55" stopColor="#000" stopOpacity={0} />
              <stop offset="1" stopColor="#000" stopOpacity={0.42} />
            </radialGradient>
          </defs>
          <rect x={-2000} y={-2000} width={5600} height={5000} filter={"url(#" + id + "-grain)"} opacity={0.35} />
          <rect x={SCENE_W / 2 - vw / 2} y={SCENE_H / 2 - vh / 2} width={vw} height={vh} fill={"url(#" + id + "-vig)"} />
          {vis[4] > 0.001 ? (
            <g opacity={vis[4]} fill={background} stroke={background}>
              <rect x={795} y={400 + (1 - rev[4]) * 300} width={10} height={560 * rev[4]} />
              <rect x={650} y={575} width={300} height={8} opacity={rev[4]} />
              <path d="M800 520 L818 579 L800 638 L782 579Z" opacity={rev[4]} />
              <path d="M800 380 L808 420 L792 420Z" />
            </g>
          ) : null}
        </svg>

        <canvas
          ref={canvasRef}
          aria-hidden="true"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", maxWidth: "none", display: "block" }}
        />

        {/* the type */}
        <svg
          viewBox={viewBox}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={title + " " + subtitle + " type specimen, page " + (cur + 1) + " of " + CHAPTERS.length + ": " + CHAPTERS[cur]}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", maxWidth: "none", display: "block", pointerEvents: "none" }}
        >
          <defs>
            <filter id={outlineId} x="-5%" y="-10%" width="110%" height="120%">
              <feMorphology in="SourceGraphic" operator="erode" radius="2.6" result="in" />
              <feComposite in="SourceGraphic" in2="in" operator="out" />
            </filter>
            <filter id={id + "-melt"} x="-20%" y="-20%" width="140%" height="160%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="b" />
              <feColorMatrix in="b" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9" />
            </filter>
            <filter id={id + "-goo"} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="b" />
              <feColorMatrix in="b" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 26 -11" />
            </filter>
          </defs>

          {/* 01 cover */}
          {vis[0] > 0.001 ? (
            <g opacity={vis[0]}>
              <Word text={year} x={170} y={300} cap={34} fill={ink} reveal={rev[0]} />
              <Word text={studio} x={800} y={372} cap={26} tracking={16} anchor="middle" fill={ink} reveal={rev[0]} />
              <Word text={title} x={800} y={640} cap={titleCap} weight={st.weight} outline={st.outline ? outlineId : undefined} anchor="middle" fill={ink} reveal={rev[0]} />
              <Word text={subtitle} x={800 - titleW / 2} y={742} cap={72} tracking={6} fill={ink} reveal={rev[0]} />
              <g opacity={smooth(0.5, 1, f.intro)}>
                <Word text="SLAB SERIF" x={1190} y={808} cap={20} tracking={8} anchor="end" fill={ink} />
                <Word text="FONT FAMILY" x={1190} y={840} cap={20} tracking={8} anchor="end" fill={ink} />
                <rect x={1214} y={780} width={3} height={66} fill={ink} />
                {STYLES.map((s, k) => (
                  <Word key={s} text="A" x={1240 + k * 52} y={842} cap={62} weight={styleSpec(s).weight} outline={styleSpec(s).outline ? outlineId : undefined} fill={ink} />
                ))}
              </g>
            </g>
          ) : null}

          {/* 02 the eye in the slot */}
          {vis[1] > 0.001 ? (
            <g opacity={vis[1]}>
              <Word text={title.slice(0, half).split("").join(" ")} x={540} y={482} cap={80} tracking={24} anchor="end" weight={st.weight} outline={st.outline ? outlineId : undefined} fill={ink} reveal={rev[1]} />
              <Word text={title.slice(half).split("").join(" ")} x={1060} y={482} cap={80} tracking={24} weight={st.weight} outline={st.outline ? outlineId : undefined} fill={ink} reveal={rev[1]} />
              <Word text={title} x={170} y={128} cap={22} tracking={6} fill={ink} reveal={rev[1]} />
              <g opacity={rev[1]}>
                <Mono x={170} y={170} fill={ink}>An experimental slab serif,</Mono>
                <Mono x={170} y={192} fill={ink}>forged from scale, spine and horn.</Mono>
                <Mono x={170} y={214} fill={ink}>For covers, posters and anything</Mono>
                <Mono x={170} y={236} fill={ink}>that should look back at you.</Mono>
                <Mono x={1430} y={128} fill={ink} anchor="end">Vol. 01 / {year}</Mono>
                <Mono x={1430} y={150} fill={ink} anchor="end">{studio}</Mono>
                <Mono x={800} y={650} fill={ink} anchor="middle" size={15}>{title} {subtitle}</Mono>
                <Mono x={800} y={676} fill={ink} anchor="middle" size={15}>Slab serif font family</Mono>
                <Mono x={800} y={702} fill={ink} anchor="middle" size={15}>4 styles / {Object.keys(GLYPHS).length - 1} glyphs</Mono>
              </g>
            </g>
          ) : null}

          {/* 03 glyph set, hover to preview */}
          {vis[2] > 0.001 ? (
            <g opacity={vis[2]}>
              <Word text={title} x={800} y={116} cap={44} tracking={10} anchor="middle" fill={ink} reveal={rev[2]} />
              <Mono x={800} y={148} fill={ink} anchor="middle" size={12} spacing={0.6} opacity={rev[2]}>{subtitle}</Mono>
              <Mono x={170} y={215} fill={ink} size={13} opacity={rev[2]}>Uppercase + figures</Mono>
              <g data-ui="" style={{ pointerEvents: "auto" }}>
                {ALPHABET_ROWS.map((row, ri) =>
                  row.split("").map((ch, ci) => {
                    const gx = 170 + ci * 72
                    const gy = 320 + ri * 118
                    const on = glyph === ch
                    const k = clamp01((rev[2] - (ri * 9 + ci) / 60) / 0.5)
                    return (
                      <g
                        key={ch}
                        onPointerEnter={() => setGlyph(ch)}
                        onClick={() => setGlyph(ch)}
                        style={{ cursor: "pointer" }}
                        opacity={k}
                      >
                        <rect x={gx - 8} y={gy - 90} width={70} height={104} fill={on ? ink : "transparent"} />
                        <Word text={ch} x={gx + 27} y={gy} cap={72} anchor="middle" fill={on ? background : ink} />
                      </g>
                    )
                  }),
                )}
              </g>
              <g opacity={rev[2]}>
                <rect x={1120} y={170} width={320} height={300} fill="none" stroke={ink} strokeWidth={2} />
                <line x1={1120} y1={210} x2={1440} y2={210} stroke={ink} strokeWidth={1} opacity={0.5} />
                <line x1={1120} y1={420} x2={1440} y2={420} stroke={ink} strokeWidth={1} opacity={0.5} />
                <Mono x={1132} y={196} fill={ink} size={12}>Glyph</Mono>
                <Mono x={1428} y={196} fill={ink} size={12} anchor="end">{"U+00" + glyph.charCodeAt(0).toString(16).toUpperCase()}</Mono>
                <Word text={glyph} x={1280} y={420} cap={200} anchor="middle" fill={ink} />
                <Mono x={1132} y={458} fill={ink} size={12}>Hover the set</Mono>
              </g>
            </g>
          ) : null}

          {/* 04 weights */}
          {vis[3] > 0.001 ? (
            <g opacity={vis[3]}>
              <Mono x={170} y={420} fill={ink} size={13} opacity={rev[3]}>Regular</Mono>
              <Mono x={170} y={712} fill={ink} size={13} opacity={rev[3]}>Outline</Mono>
              <g data-ui="" style={{ pointerEvents: "auto" }}>
                {G_WEIGHTS.map((w, k) => {
                  const x = 400 + k * 215
                  const lift = hoverG === k ? 18 : 0
                  const kk = clamp01((rev[3] - k * 0.1) / 0.6)
                  return (
                    <g key={w} onPointerEnter={() => setHoverG(k)} onPointerLeave={() => setHoverG(-1)} opacity={kk}>
                      <rect x={x - 20} y={290} width={210} height={570} fill="transparent" />
                      <Word text="G" x={x} y={640 - lift} cap={250} weight={w} fill={hoverG === k ? "#ffffff" : ink} reveal={kk} />
                      <Word text="G" x={x} y={920 - lift} cap={250} weight={w} outline={outlineId} fill={ink} reveal={kk} />
                      <Mono x={x + 80} y={975} fill={ink} size={11} anchor="middle" opacity={0.8}>{w * 10 + 200}</Mono>
                    </g>
                  )
                })}
              </g>
              <Word text={title} x={1430} y={880} cap={34} tracking={8} anchor="end" fill={ink} reveal={rev[3]} />
              <Mono x={1430} y={910} fill={ink} size={12} anchor="end" opacity={rev[3]}>{subtitle}</Mono>
            </g>
          ) : null}

          {/* 05 styles, on the dark page: pick one and every title follows */}
          {vis[4] > 0.001 ? (
            <g opacity={vis[4]}>
              <Mono x={800} y={150} fill={ink} anchor="middle" size={13} spacing={0.5} opacity={rev[4]}>Slab serif font family</Mono>
              <Word text={title} x={800} y={330} cap={fitCap(title, st.weight, 0, 800, 150)} weight={st.weight} outline={st.outline ? outlineId : undefined} anchor="middle" fill={ink} reveal={rev[4]} />
              <Word text={subtitle} x={800} y={392} cap={34} tracking={10} anchor="middle" fill={ink} reveal={rev[4]} />
              <Mono x={170} y={520} fill={ink} size={13} opacity={rev[4]}>Styles / pick one</Mono>
              <g data-ui="" style={{ pointerEvents: "auto" }} opacity={rev[4]}>
                {STYLES.map((s, k) => {
                  const on = s === style
                  const sp = styleSpec(s)
                  return (
                    <g
                      key={s}
                      role="button"
                      tabIndex={0}
                      aria-pressed={on}
                      aria-label={"Show the titles in " + s.replace("-", " ")}
                      onClick={() => setStyle(s)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault()
                          setStyle(s)
                        }
                      }}
                      style={{ cursor: "pointer", outline: "none" }}
                    >
                      <rect x={150} y={548 + k * 66} width={420} height={60} fill="transparent" />
                      {on ? <path d={"M160 " + (570 + k * 66) + " l14 10 l-14 10z"} fill={ink} /> : null}
                      <Word text={s.replace("-", " ")} x={190} y={596 + k * 66} cap={36} weight={sp.weight} outline={sp.outline ? outlineId : undefined} fill={ink} opacity={on ? 1 : 0.38} />
                    </g>
                  )
                })}
              </g>
              <Mono x={1430} y={520} fill={ink} size={13} anchor="end" opacity={rev[4]}>Uppercase</Mono>
              <Word text="ABC:123" x={1430} y={600} cap={40} weight={st.weight} outline={st.outline ? outlineId : undefined} anchor="end" fill={ink} reveal={rev[4]} />
              <Word text="XYZ:789" x={1430} y={666} cap={40} weight={st.weight} outline={st.outline ? outlineId : undefined} anchor="end" fill={ink} reveal={rev[4]} />
            </g>
          ) : null}

          {/* 06 alternates */}
          {vis[5] > 0.001 ? (
            <g opacity={vis[5]}>
              <Mono x={760} y={160} fill={ink} size={12} opacity={rev[5]}>Regular</Mono>
              <Word text={specimenWord} x={760} y={330} cap={specCap} tracking={20} fill={ink} reveal={rev[5]} />
              <Mono x={760} y={384} fill={ink} size={12} opacity={rev[5]}>Stylistic alternate</Mono>
              <Word text={specimenWord} x={760} y={570} cap={specCap} tracking={20} alt fill={ink} reveal={rev[5]} />
              <Mono x={760} y={648} fill={ink} size={12} opacity={rev[5]}>Stylistic alternates</Mono>
              <Word text="AGKNRSVZ" x={760} y={740} cap={60} tracking={26} alt fill={ink} reveal={rev[5]} />
              <Mono x={760} y={806} fill={ink} size={12} opacity={rev[5]}>Regular character</Mono>
              <Word text="AGKNRSVZ" x={760} y={890} cap={60} tracking={26} fill={ink} reveal={rev[5]} />
              <Word text={title} x={170} y={930} cap={30} tracking={8} fill={ink} reveal={rev[5]} />
              <Mono x={420} y={930} fill={ink} size={12} opacity={rev[5]}>{subtitle}</Mono>
            </g>
          ) : null}

          {/* 07 liquid */}
          {vis[6] > 0.001 ? (
            <g opacity={vis[6]}>
              <Word text="EXPERIMENTAL" x={170} y={170} cap={32} tracking={4} fill={ink} reveal={rev[6]} />
              <Word text="LIQUID-LIKE" x={170} y={216} cap={32} tracking={4} fill={ink} reveal={rev[6]} />
              <Word text="EFFECT" x={170} y={262} cap={32} tracking={4} fill={ink} reveal={rev[6]} />
              <Word text={title} x={1430} y={150} cap={38} tracking={8} anchor="end" fill={ink} reveal={rev[6]} />
              <Mono x={1430} y={180} fill={ink} size={12} anchor="end" opacity={rev[6]}>{subtitle}</Mono>
              <g opacity={rev[6]} stroke={ink} fill="none" strokeWidth={2}>
                <line x1={150} y1={400} x2={640} y2={400} opacity={0.6} />
                <line x1={150} y1={700} x2={640} y2={700} opacity={0.6} />
                <circle cx={331} cy={392} r={46} />
                <path d={"M377 392 L" + (blobLineX(f.p)) + " 330 L1240 330"} />
                <circle cx={1240} cy={330} r={7} fill={ink} />
                <circle cx={236} cy={870} r={56} strokeWidth={10} />
                <path d="M196 830 L276 910 M276 830 L196 910" strokeWidth={10} />
              </g>
              <g filter={"url(#" + id + "-melt)"} fill={ink}>
                <Word text="A" x={200} y={700} cap={300} fill={ink} reveal={rev[6]} />
                {[0, 1, 2].map((k) => (
                  <circle key={k} ref={(el) => void (dripRefs.current[k] = el)} cx={[236, 425, 331][k]} cy={700} r={0} />
                ))}
              </g>
              <g filter={"url(#" + id + "-goo)"} fill={ink}>
                {[0, 1, 2, 3, 4].map((k) => (
                  <circle key={k} ref={(el) => void (blobRefs.current[k] = el)} cx={520} cy={860} r={[62, 44, 36, 30, 24][k] * rev[6]} />
                ))}
              </g>
              <Mono x={800} y={975} fill={ink} size={11} anchor="middle" opacity={rev[6] * 0.8}>Move your pointer / the drop follows</Mono>
            </g>
          ) : null}
        </svg>

        {/* folio: page number, page name, the book's running head */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between px-5 pt-4 font-mono text-[10px] uppercase tracking-[0.3em] sm:px-8 sm:pt-6"
          style={{ color: ink }}
        >
          <span>
            N° {pageLabel(cur)} · {CHAPTERS[cur]}
          </span>
          <span className="hidden sm:inline">
            {title} / {subtitle}
          </span>
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between px-5 pb-4 font-mono text-[10px] uppercase tracking-[0.3em] sm:px-8 sm:pb-6"
          style={{ color: ink }}
        >
          <span className="flex gap-1.5">
            {CHAPTERS.map((c, k) => (
              <span key={c} className="block h-[3px] w-5 transition-opacity motion-reduce:transition-none" style={{ background: ink, opacity: k === cur ? 1 : 0.3 }} />
            ))}
          </span>
          <span>
            {pageLabel(cur)} / {pageLabel(LAST)}
          </span>
        </div>
        {hint && !controlled ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-12 flex flex-col items-center gap-2 font-mono text-[10px] uppercase tracking-[0.35em]"
            style={{ color: ink, opacity: Math.max(0, 0.85 - localT(f.p, 0) * 4) * smooth(0.6, 1, f.intro) }}
          >
            scroll
            <span className="block h-6 w-px animate-pulse motion-reduce:animate-none" style={{ background: ink }} />
          </div>
        ) : null}
      </div>
    </section>
  )
}

/** The call-out line on the liquid page reaches out as the page settles. */
function blobLineX(p: number) {
  return (560 + 300 * smooth(0.2, 0.6, localT(p, LAST))).toFixed(1)
}
