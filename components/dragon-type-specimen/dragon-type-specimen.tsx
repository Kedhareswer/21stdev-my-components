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
 * Everything is drawn from numbers. The dragon is WebGL2: a body swept along its
 * path every frame and shaded as wet, dark clay. The display face is an original
 * angular slab serif built from strokes, spikes and slabs. No images, no fonts to
 * load, React is the only import.
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
  /** Dragon skin. Hex; it tints the whole wet-clay material. */
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
  G: [66, (p) => { p.S(60, T, 20, T, 7, 18, 7, 82, 20, B, 60, B, 60, 52, 34, 52); p.vs(60, 0, 24); p.vs(34, 42, 62) }],
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

export const WEIGHTS = { regular: 8, bold: 14 } as const

/**
 * The stylistic alternates: each letter changes its own form (an overhanging crossbar, a
 * thorned arm, a spurred jaw, a whipped leg); nothing runs from one letter to the next.
 * Letters without their own get a thorn off the cap line.
 */
const ALTS: Record<string, (p: Pen) => void> = {
  A: (p) => { p.L(-2, 64, 78, 64); p.spike(-2, 64, 180, 10); p.spike(78, 64, 0, 10) },
  G: (p) => { p.spike(60, 52, 0, 14); p.spike(7, 50, 180, 12) },
  K: (p) => { p.spike(58, 0, -58, 18); p.spike(62, 100, 58, 12) },
  N: (p) => { p.spike(35, 50, 0, 16); p.spike(35, 50, 180, 16) },
  R: (p) => { p.S(62, 100, 74, 118); p.spike(58, 31, 0, 12) },
  S: (p) => { p.slab(58, true); p.slab(5, false) },
  V: (p) => { p.L(22, 48, 50, 48); p.spike(36, 100, 90, 14) },
  Z: (p) => { p.L(18, 50, 44, 50); p.spike(56, 5.5, 0, 12); p.spike(6, 94.5, 180, 12) },
  L: (p) => { p.spike(56, 94.5, 0, 16); p.spike(12, 0, -90, 14) },
}

/** A glyph's filled polygons. `alt` swaps in the letter's stylistic alternate. */
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
  if (alt && ch !== " ") (ALTS[ch] ?? ((q: Pen) => q.spike(g[0] / 2, 0, -90, 16)))(pen)
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
/** Body length along its path, head to tail tip, in scene units at scale 1. */
export const BODY_LEN = 4200
/** Body radius at scale 1, in scene units. */
export const R_BODY = 110
const ENTER_FROM = -700
const DRIFT = 70

export interface Scene {
  chapter: number
  /** which side of the path the crown turns to when the head's pose cannot say: -1 = left of travel */
  side: 1 | -1
  /** index into pts where the head rests on this page */
  rest: number
  /** how far the jaw hangs open at rest, radians */
  jaw: number
  /** how far the jaw drops at rest as well as swinging open, in head units (0 when absent) */
  drop?: number
  /** at rest the snout points along `face` and the crown along `top` (x right, y down, z toward the viewer); travelling, the head follows the neck */
  face?: [number, number, number]
  top?: [number, number, number]
  /** head size: the neck's radius where it enters the skull, as a share of R_BODY x scale (1 when absent) */
  head?: number
  /** the head's length, height and width against the model's (1 when absent): the pages' heads differ */
  stretch?: [number, number, number]
  /** the horns and quills the head wears on this page */
  horns?: "crown" | "quills" | "spears" | "mask"
  /** the tongue, shown while the jaws are open: darting out and back ("flick") or hanging in a curl ("curl") */
  tongue?: "flick" | "curl"
  /** how far the head turns toward the pointer, radians (0.2 when absent) */
  look?: number
  /** where the spine appears on the page (z only changes its depth and apparent size) */
  pts: Pt[]
  /** depth of each point, + toward the viewer: parts further back look thinner. Flat when absent. */
  z?: number[]
  /** how close the camera is on this page: the whole dragon, girth and length, times this */
  scale?: number
  /** how far the whip tip curls, radians, clockwise on screen walking down to the tip */
  curl?: number
  /** strength of the dim grey dust flecks on the skin (0.3 when absent) */
  dust?: number
  /** the legs showing on this page */
  legs?: Leg[]
}

/**
 * A leg. It grows out of the body at `u` and, at rest, puts its wrist on `to`, measured in
 * `ref`'s box: so the hands grip the letters whatever the title. Directions are on the
 * page at rest (x right, y down, z toward the viewer); travelling, they turn with the body.
 */
export interface Leg {
  /** where it grows from: 0 the neck .. 1 the tail tip */
  u: number
  /** the root, sunk in the body: [across the path (+ to its left on screen), toward the viewer], in body radii */
  at: [number, number]
  /** the upper and lower bones, in body radii */
  len: [number, number]
  /** what the wrist is placed against: title letters, the weights page's G row, the liquid drop, or the page */
  ref: "title" | "g" | "drop" | "page"
  /** the first and last letter of the box, for "title" and "g" (clamped to the word) */
  k?: [number, number]
  /** the wrist: [x, y] as fractions of the box, offsets from the drop, or page units; then its depth */
  to: [number, number, number]
  /** which way the elbow or knee points */
  pole: [number, number, number]
  /** where the fingers point, and which way the back of the hand faces */
  dir: [number, number, number]
  back: [number, number, number]
  /** finger curl, 0 straight .. 1 gripping, and the fan between fingers, radians */
  curl: number
  spread: number
  /** hand size and limb girth against the default (1) */
  hand?: number
  thick?: number
  /** the fingers and claws pass in front of the type */
  front?: boolean
}

/**
 * Two-bone reach: the elbow for a shoulder S reaching for a wrist at W with bones a and b,
 * bent toward `pole`. Out of reach the arm points straight at W; the wrist then sits b
 * past the elbow toward W.
 */
export function ik2(S: number[], W: number[], a: number, b: number, pole: number[]) {
  const d = [W[0] - S[0], W[1] - S[1], W[2] - S[2]]
  const l = Math.hypot(d[0], d[1], d[2]) || 1e-9
  const u = [d[0] / l, d[1] / l, d[2] / l]
  const L = Math.min(Math.max(l, Math.abs(a - b) + 1e-3), a + b - 1e-3)
  const x = (a * a - b * b + L * L) / (2 * L)
  const h = Math.sqrt(Math.max(0, a * a - x * x))
  // the bend: the pole with its share along the reach taken out; any side will do if it has none
  let pd = pole[0] * u[0] + pole[1] * u[1] + pole[2] * u[2]
  let p = [pole[0] - u[0] * pd, pole[1] - u[1] * pd, pole[2] - u[2] * pd]
  let pl = Math.hypot(p[0], p[1], p[2])
  if (pl < 1e-6) {
    const o = Math.abs(u[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0]
    pd = o[0] * u[0] + o[1] * u[1] + o[2] * u[2]
    p = [o[0] - u[0] * pd, o[1] - u[1] * pd, o[2] - u[2] * pd]
    pl = Math.hypot(p[0], p[1], p[2])
  }
  return [0, 1, 2].map((c) => S[c] + u[c] * x + (p[c] / pl) * h)
}

/**
 * One path per page. The head travels in along it, rests, and leaves along it;
 * the body follows the head's path exactly, so it slithers instead of morphing.
 * Every path starts and ends well outside the frame. At rest the body is laid
 * over the reference silhouettes, cropped by the page edges.
 */
export const SCENES: Scene[] = [
  // cover: the tail waves across the bottom to a whip tip, the body runs off the
  // left edge, back across the top and over the top edge, and the neck drops into
  // the head at the upper right. Leaves down through the lower right.
  {
    chapter: 0,
    side: -1,
    rest: 38,
    jaw: 0.05,
    curl: 0.15,
    face: [0.454, 0.738, 0.5],
    top: [-0.074, -0.528, 0.846],
    head: 0.87,
    horns: "crown",
    // the left foreleg folds up under the year; the hind leg grips the second letter, the
    // letter's bowl over its palm and its claws over the strokes; the right foreleg hangs
    // down and dips its claws into the third and fourth letters
    legs: [
      { u: 0.47, at: [-0.45, 0.55], len: [1.9, 1.9], ref: "page", to: [175, 455, -230], pole: [0.2, -1, 0.4], dir: [0.5, -0.6, 0.6], back: [-0.3, -0.7, 0.75], curl: 0.9, spread: 0.3 },
      { u: 0.225, at: [-0.45, 0.5], len: [3, 2.6], ref: "title", k: [1, 1], to: [0.45, 0.12, -180], pole: [-1, -0.3, 0.3], dir: [0.45, 0.75, 0.45], back: [-0.5, -0.1, 0.85], curl: 1, spread: 0.4, front: true },
      { u: 0.17, at: [-0.5, 0.55], len: [1.7, 1.7], ref: "title", k: [2, 3], to: [0.62, -0.22, -260], pole: [0.6, 0.1, 0.8], dir: [0.05, 0.85, 0.5], back: [-0.3, -0.35, 0.9], curl: 0.9, spread: 0.4, front: true },
    ],
    pts: [
      [1650, 700], [1545, 705], [1470, 722], [1400, 760], [1300, 797], [1200, 764], [1100, 731], [1000, 728],
      [900, 790], [800, 872], [700, 985], [600, 1030], [500, 1020], [400, 955], [200, 845], [0, 805],
      [-100, 750], [-150, 650], [-140, 545], [-80, 450], [15, 350], [50, 215], [62, 70], [140, -75],
      [290, -45], [410, 90], [520, 170], [620, 218], [700, 250], [765, 208], [782, 100], [777, 0],
      [800, -80], [880, -115], [955, -95], [1015, -30], [1080, 30], [1148, 108], [1215, 186], [1300, 315],
      [1440, 540], [1580, 880], [1740, 1300], [1850, 1700],
    ],
    // the tail lies nearest; the coil over the top recedes, and the neck comes forward into the head
    z: [
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      -100, -200, -300, -400, -450, -500, -500, -500,
      -500, -500, -500, -500, -500, -550, -600, -600,
      -550, -450, -300, -150, -50, 0, 0, 0,
      0, 0, 0, 0,
    ],
  },
  // glyph set: up out of the lower right, over a hump, under the bottom edge and
  // up an S-coil in the middle, head rising at the alphabet. Leaves up and right.
  {
    chapter: 2,
    side: -1,
    rest: 16,
    jaw: 0.68,
    face: [0.7, -0.7, 0.16],
    top: [-0.7, -0.7, 0.1],
    head: 0.8,
    // shorter, deeper and broader than the model: a heavy head, not a snake's
    stretch: [0.84, 1.2, 1.14],
    horns: "quills",
    tongue: "flick",
    pts: [
      [1470, 1500], [1375, 1250], [1330, 1100], [1315, 960], [1290, 860], [1205, 800], [1125, 820], [1070, 900],
      [1000, 1000], [860, 1090], [680, 1085], [540, 995], [490, 900], [495, 810], [505, 735], [540, 660],
      [590, 575], [700, 465], [880, 250], [1050, 0], [1250, -350], [1450, -700],
    ],
    // the hump behind lies further back than the coil the neck rises from
    z: [-450, -450, -450, -450, -450, -450, -450, -450, -350, -200, -60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  // weights: a close-up. The belly hangs over the top edge, the head is cut by the
  // right edge and the tail arches across the bottom.
  {
    chapter: 3,
    side: -1,
    rest: 22,
    jaw: 0.04,
    scale: 1.3,
    face: [0.4, 0.66, 0.64],
    top: [-0.1, -0.64, 0.76],
    head: 1.17,
    horns: "crown",
    // two hands come down from the belly and hold the G row from above
    legs: [
      { u: 0.24, at: [-0.5, 0.5], len: [1.5, 1.5], ref: "g", k: [0, 0], to: [-0.25, -0.2, 60], pole: [-1, 0.1, 0.4], dir: [0.7, 0.55, 0.45], back: [-0.5, -0.35, 0.8], curl: 1, spread: 0.36, front: true },
      { u: 0.14, at: [-0.5, 0.5], len: [1.3, 1.3], ref: "g", k: [1, 2], to: [0.5, -0.55, 60], pole: [-0.3, 0, 1], dir: [0.05, 0.85, 0.5], back: [-0.3, -0.35, 0.9], curl: 0.9, spread: 0.4, front: true },
    ],
    pts: [
      [1470, 1450], [1330, 1110], [1245, 1000], [1170, 935], [1035, 832], [900, 795], [775, 830], [640, 912],
      [490, 1000], [340, 1100], [150, 1230], [-150, 1240], [-380, 850], [-380, 350], [-230, -80], [0, -200],
      [260, -130], [530, -50], [760, -110], [950, -230], [1140, -250], [1270, -170], [1350, 8], [1440, 260],
      [1550, 700], [1700, 1200], [1850, 1600],
    ],
  },
  // styles: rises from below the bottom edge; the face-on head hides the rest
  {
    chapter: 4,
    side: 1,
    rest: 3,
    jaw: 0.02,
    scale: 1.2,
    face: [0, 0.5, 0.87],
    top: [0, -0.87, 0.5],
    head: 1.5,
    horns: "mask",
    look: 0.08,
    pts: [[800, 1700], [800, 1300], [800, 1040], [800, 760], [800, 600], [800, 300], [800, -200], [800, -900]],
    // the neck comes up from behind the face-on head
    z: [-1100, -1000, -800, -500, -500, -500, -500, -500],
  },
  // alternates: only the neck, thick as a third of the page, in from the left edge
  {
    chapter: 5,
    side: -1,
    rest: 4,
    jaw: 0.4,
    scale: 1.7,
    face: [1, 0.04, 0.22],
    top: [0, -0.88, 0.47],
    head: 0.68,
    stretch: [1, 0.76, 1],
    drop: 0.6,
    horns: "spears",
    tongue: "curl",
    pts: [[-1600, 775], [-900, 655], [-300, 575], [0, 525], [190, 500], [560, 575], [700, 800], [700, 1150], [600, 1600]],
  },
  // liquid: up from the bottom, an arch over the drop, down the right side and
  // out of the right edge, head off the page
  {
    chapter: 6,
    side: 1,
    rest: 15,
    jaw: 0.3,
    dust: 1,
    // the foreleg reaches down for the drop; the hind foot splays on the bottom edge
    legs: [
      { u: 0.26, at: [0.05, 0.5], len: [2.2, 2.2], ref: "drop", to: [-40, -225, -60], pole: [-1, -0.8, 0.2], dir: [0.7, 0.55, 0.45], back: [-0.2, -0.75, 0.6], curl: 0.75, spread: 0.4, thick: 1.3, hand: 1.15, front: true },
      { u: 0.1, at: [0.1, 0.5], len: [2.6, 2.6], ref: "page", to: [1390, 860, -160], pole: [0.8, -0.7, 0.5], dir: [0.45, 0.7, 0.55], back: [0.1, -0.9, 0.3], curl: 0.45, spread: 0.55, thick: 1.3, hand: 1.15 },
    ],
    pts: [
      [950, 1500], [840, 1120], [760, 950], [715, 860], [685, 760], [690, 640], [745, 525], [840, 410],
      [945, 305], [1040, 218], [1128, 180], [1222, 214], [1295, 300], [1365, 440], [1470, 560], [1596, 640],
      [1710, 705], [1850, 800], [2100, 900],
    ],
    // the top of the arch bulges toward the viewer; both sides fall away
    z: [-700, -700, -700, -695, -670, -610, -510, -360, -190, -40, 50, -40, -250, -400, -450, -450, -450, -450, -450],
  },
]

/** A Catmull-Rom curve through the points, `per` steps a span. Points may carry any number of coordinates. */
export function catmull<T extends number[]>(pts: T[], per = 24): T[] {
  const out: T[] = []
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
      out.push(p1.map((b, c) => 0.5 * (2 * b + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * b + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * b - 3 * p2[c] + p3[c]) * t3)) as T)
    }
  }
  out.push(pts[n - 1])
  return out
}

export interface Track {
  pts: Pt[]
  /** depth along pts, or null for a flat path */
  z: number[] | null
  cum: number[]
  len: number
  restArc: number
  /** the body's length on this page */
  body: number
}

export function makeTrack(s: Scene, per = 24): Track {
  const pts = catmull(s.pts, per)
  const z = s.z ? catmull(s.z.map((v): Pt => [v, 0]), per).map((q) => q[0]) : null
  const cum = [0]
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]))
  return { pts, z, cum, len: cum[cum.length - 1], restArc: cum[s.rest * per], body: BODY_LEN * (s.scale ?? 1) }
}

/** Position, unit tangent (in the page plane) and depth at arc length a. Past either end the path runs on straight and level. */
export function trackAt(tr: Track, a: number): [number, number, number, number, number] {
  const { pts, cum, len, z } = tr
  const n = pts.length
  const dir = (i: number, j: number) => {
    const dx = pts[j][0] - pts[i][0]
    const dy = pts[j][1] - pts[i][1]
    const l = Math.hypot(dx, dy) || 1
    return [dx / l, dy / l]
  }
  if (a <= 0) {
    const [tx, ty] = dir(0, 1)
    return [pts[0][0] + tx * a, pts[0][1] + ty * a, tx, ty, z ? z[0] : 0]
  }
  if (a >= len) {
    const [tx, ty] = dir(n - 2, n - 1)
    return [pts[n - 1][0] + tx * (a - len), pts[n - 1][1] + ty * (a - len), tx, ty, z ? z[n - 1] : 0]
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
  return [lerp(pts[lo][0], pts[hi][0], k), lerp(pts[lo][1], pts[hi][1], k), tx, ty, z ? lerp(z[lo], z[hi], k) : 0]
}

/** Where the head is along its page's path at page time t. */
export function headArc(tr: Track, t: number, first: boolean, last: boolean) {
  const rest = tr.restArc
  const exitTo = tr.len + tr.body + 700
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

/**
 * Body radius as a share of the full radius, u = 0 at the neck to 1 at the tail tip.
 * It keeps its girth, eases to 0.8 down the tail, then whips out fast: fitted to the
 * reference cover's tail, which measures 0.8 at u 0.8 and 0.2 at u 0.96.
 */
export function bodyRadius(u: number) {
  if (u < 0.08) return 0.82 + 0.18 * smooth(0, 0.08, u)
  if (u < 0.84) return 1 - 0.2 * smooth(0.5, 0.72, u)
  return Math.max(0.02, 0.8 * Math.pow(clamp01(1 - (u - 0.84) / 0.16), 1.1))
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

// ---------------------------------------------------------------- the dragon (webgl2)

/** A spine sample: position, unit tangent toward the head, radius, and skin coordinate (arc from the head, at scale 1). */
type Q = { x: number; y: number; z: number; tx: number; ty: number; tz: number; r: number; s: number }

const makeSpine = (samples: number): Q[] =>
  Array.from({ length: samples + 1 }, () => ({ x: 0, y: 0, z: 0, tx: 0, ty: 0, tz: 0, r: 0, s: 0 }))

/** Re-lays the chain from sample j0 to j1, turning each link a little more, up to `turn` radians clockwise on screen. */
function bend(P: Q[], j0: number, j1: number, turn: number) {
  if (!turn) return
  const n = Math.abs(j1 - j0)
  const dir = j1 > j0 ? 1 : -1
  let ox = P[j0].x
  let oy = P[j0].y
  for (let i = 1; i <= n; i++) {
    const q = P[j0 + i * dir]
    const prev = P[j0 + (i - 1) * dir]
    const dx = q.x - ox
    const dy = q.y - oy
    ox = q.x
    oy = q.y
    const c = Math.cos((turn * i) / n)
    const s = Math.sin((turn * i) / n)
    q.x = prev.x + dx * c - dy * s
    q.y = prev.y + dx * s + dy * c
  }
}

/** The camera's distance from the page: about 22 degrees of view over the viewBox's height. */
const camDist = (vh: number) => 2.6 * Math.max(SCENE_H, vh)

/**
 * The spine at head arc `a`, written into P (allocated once): P[0] is where the neck
 * meets the head, the last sample is the whip tip. `look` turns the neck toward what
 * the dragon watches, radians clockwise on screen. `D` is the camera distance: each
 * sample is pushed back along its sight line to its depth, so it still appears where
 * the path puts it.
 */
function bodyFrame(P: Q[], tr: Track, a: number, time: number, still: boolean, sc: Scene, look: number, D: number) {
  const n = P.length - 1
  const zoom = sc.scale ?? 1
  const step = tr.body / n
  for (let j = 0; j <= n; j++) {
    const u = j / n
    const [x, y, tx, ty, z] = trackAt(tr, a - j * step)
    // a travelling wave down the body, stronger toward the tail: it is alive even at rest
    const env = smooth(0.03, 0.4, u) * (0.45 + 0.55 * u) * zoom
    const w = still ? 0 : (Math.sin(((u * BODY_LEN) / 780) * Math.PI * 2 - time * 2.2) * 22 + Math.sin(u * 9.3 - time * 1.3) * 9) * env
    const k = (D - z) / D
    const q = P[j]
    q.x = SCENE_W / 2 + (x - ty * w - SCENE_W / 2) * k
    q.y = SCENE_H / 2 + (y + tx * w - SCENE_H / 2) * k
    q.z = z
    q.r = bodyRadius(u) * R_BODY * zoom * (still ? 1 : 1 + 0.028 * Math.sin(time * 1.9 - u * 5))
    q.s = u * BODY_LEN
  }
  // the neck turns over its last 260 units, so it never shears; the whip tip curls
  bend(P, Math.round(n / 16), 0, look)
  bend(P, Math.round(n * 0.94), n, sc.curl ?? 0)
  tangents(P, 0, n)
}

// ---- the skin, baked once from typed arrays: no images -------------------------------

function hash(i: number, j: number) {
  let h = (i * 374761393 + j * 668265263) | 0
  h = ((h ^ (h >>> 13)) * 1274126177) | 0
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

/** Value noise that repeats every px by py cells. */
function vnoise(x: number, y: number, px: number, py: number) {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const fx = x - xi
  const fy = y - yi
  const sx = fx * fx * (3 - 2 * fx)
  const sy = fy * fy * (3 - 2 * fy)
  const x0 = ((xi % px) + px) % px
  const x1 = (x0 + 1) % px
  const y0 = ((yi % py) + py) % py
  const y1 = (y0 + 1) % py
  const a = hash(x0, y0)
  const b = hash(x1, y0)
  const c = hash(x0, y1)
  const d = hash(x1, y1)
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy
}

const SKIN = 256
let skinPx: Uint8Array | null = null

/** RG: slope of a lumpy height field streaked along the tube (u). B: cavity. A: the gloss fleck mask. */
function skinTexture() {
  if (skinPx) return skinPx
  const S = SKIN
  const h = new Float32Array(S * S)
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      const u = x / S
      const v = y / S
      h[y * S + x] = vnoise(u * 4, v * 4, 4, 4) - 0.5 + (vnoise(u * 3, v * 12, 3, 12) - 0.5) * 0.5 + (vnoise(u * 10, v * 40, 10, 40) - 0.5) * 0.06
    }
  const px = new Uint8Array(S * S * 4)
  const at = (x: number, y: number) => h[((y + S) % S) * S + ((x + S) % S)]
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      const gx = (at(x + 1, y) - at(x - 1, y)) * 9
      const gy = (at(x, y + 1) - at(x, y - 1)) * 9
      const i = (y * S + x) * 4
      px[i] = 128 + Math.max(-127, Math.min(127, gx * 127))
      px[i + 1] = 128 + Math.max(-127, Math.min(127, gy * 127))
      px[i + 2] = Math.max(0, Math.min(255, -at(x, y) * 400))
    }
  // flecks: mostly dots and short dashes along the tube, a few long streaks
  let seed = 7
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647
  for (let n = 0; n < 420; n++) {
    const cx = Math.round(rnd() * S)
    const cy = Math.round(rnd() * S)
    const r = rnd()
    const len = r < 0.65 ? 1.6 + rnd() * 1.6 : r < 0.94 ? 3.2 + rnd() * 5 : 14 + rnd() * 26
    const wid = 1.1 + rnd() * 1.3
    const ang = (rnd() - 0.5) * 0.5
    const ca = Math.cos(ang)
    const sa = Math.sin(ang)
    const R = Math.ceil(len + 2)
    for (let dy = -R; dy <= R; dy++)
      for (let dx = -R; dx <= R; dx++) {
        const d = Math.hypot((dx * ca + dy * sa) / len, (dy * ca - dx * sa) / wid)
        if (d >= 1) continue
        const i = ((((cy + dy) % S) + S) % S) * S * 4 + ((((cx + dx) % S) + S) % S) * 4 + 3
        px[i] = Math.max(px[i], 255 * (1 - d * d))
      }
  }
  return (skinPx = px)
}

const LUMP_S = 256
const LUMP_K = 32
let lumpTab: Float32Array | null = null

/** Radius wobble along (s / 11.7 cells, repeating) and round (32 cells) the body. */
function lumps() {
  if (lumpTab) return lumpTab
  const t = new Float32Array(LUMP_S * LUMP_K)
  for (let i = 0; i < LUMP_S; i++)
    for (let k = 0; k < LUMP_K; k++)
      t[i * LUMP_K + k] = (vnoise(i / 12, (k / LUMP_K) * 5, LUMP_S / 12, 5) - 0.5) * 0.16 + (vnoise(i / 5 + 9, (k / LUMP_K) * 9, LUMP_S / 5, 9) - 0.5) * 0.06
  return (lumpTab = t)
}

function lumpAt(L: Float32Array, s: number, a: number) {
  const x = s / 11.7
  const y = a * LUMP_K
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const fx = x - xi
  const fy = y - yi
  const x0 = ((xi % LUMP_S) + LUMP_S) % LUMP_S
  const x1 = (x0 + 1) % LUMP_S
  const y0 = ((yi % LUMP_K) + LUMP_K) % LUMP_K
  const y1 = (y0 + 1) % LUMP_K
  const a0 = L[x0 * LUMP_K + y0] + (L[x1 * LUMP_K + y0] - L[x0 * LUMP_K + y0]) * fx
  const a1 = L[x0 * LUMP_K + y1] + (L[x1 * LUMP_K + y1] - L[x0 * LUMP_K + y1]) * fx
  return a0 + (a1 - a0) * fy
}

// ---- the body mesh ---------------------------------------------------------------------

const rings = new Map<number, Float32Array>()
/** cos and sin round a ring of n steps, n + 1 of them: the sweeps run every frame, so no trig per vertex. */
function ringTable(n: number) {
  let t = rings.get(n)
  if (!t) {
    t = new Float32Array((n + 1) * 2)
    for (let k = 0; k <= n; k++) {
      t[k * 2] = Math.cos((k / n) * Math.PI * 2)
      t[k * 2 + 1] = Math.sin((k / n) * Math.PI * 2)
    }
    rings.set(n, t)
  }
  return t
}

/** Rings in the dome that closes the head end. */
const CAP = 6
/** Floats per vertex: position 3, normal 3, tangent 3, uv 2, bump 1. */
const STRIDE = 12

/**
 * Sweeps a ring round every spine sample into `out`, with a dome over the head end.
 * The rings ride a parallel-transported frame, so the tube never twists. Normals come
 * from the neighbouring vertices, so they carry the lumps, the taper and the dome.
 * Allocates nothing: it runs every frame.
 */
function sweepBody(P: Q[], ring: number, zoom: number, out: Float32Array) {
  const L = lumps()
  const cs = ringTable(ring)
  const cols = ring + 1
  const rows = CAP + P.length
  const q0 = P[0]
  // T runs down the body toward the tail; N starts in the page plane
  let tx = -q0.tx
  let ty = -q0.ty
  let tz = -q0.tz
  let nx = ty
  let ny = -tx
  let nz = 0
  for (let row = 0; row < rows; row++) {
    const cap = row < CAP
    const q = cap ? q0 : P[row - CAP]
    if (!cap) {
      tx = -q.tx
      ty = -q.ty
      tz = -q.tz
    }
    const d = nx * tx + ny * ty + nz * tz
    nx -= tx * d
    ny -= ty * d
    nz -= tz * d
    let l = Math.sqrt(nx * nx + ny * ny + nz * nz)
    if (l < 1e-6) {
      // the tube points straight at the camera: any perpendicular will do
      nx = tz
      ny = 0
      nz = -tx
      l = Math.sqrt(nx * nx + nz * nz) || 1
    }
    nx /= l
    ny /= l
    nz /= l
    const bx = ty * nz - tz * ny
    const by = tz * nx - tx * nz
    const bz = tx * ny - ty * nx
    // the dome: rings step ahead of P[0] and close to a point
    const ph = cap ? (Math.PI / 2) * (1 - row / CAP) : 0
    const ahead = q.r * Math.sin(ph)
    const shrink = Math.cos(ph)
    const cx = q.x - tx * ahead
    const cy = q.y - ty * ahead
    const cz = q.z - tz * ahead
    const s = cap ? -ahead / zoom : q.s
    // smooth where the neck enters the skull's ring
    const plain = smooth(0, 70, s)
    // where the spine bends tighter than the tube is thick, the inside of the bend would fold
    // over itself: squeeze the ring's inner side toward the bend's centre instead
    let kx = 0
    let ky = 0
    let kz = 0
    let bendR = 0
    if (!cap) {
      const j = row - CAP
      const a = P[j > 0 ? j - 1 : 0]
      const b = P[j < P.length - 1 ? j + 1 : j]
      const dx = a.x - b.x
      const dy = a.y - b.y
      const dz = a.z - b.z
      const ds = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1
      kx = (a.tx - b.tx) / ds
      ky = (a.ty - b.ty) / ds
      kz = (a.tz - b.tz) / ds
      const kl = Math.sqrt(kx * kx + ky * ky + kz * kz)
      // only rings that bend tighter than ~1.8 radii need it
      if (kl * q.r > 0.55) {
        bendR = 1 / kl
        kx /= kl
        ky /= kl
        kz /= kl
      }
    }
    for (let k = 0; k <= ring; k++) {
      const c = cs[k * 2]
      const sn = cs[k * 2 + 1]
      const lump = lumpAt(L, s, k / ring) * plain
      const r = q.r * shrink * (1 + lump)
      let ox = (c * nx + sn * bx) * r
      let oy = (c * ny + sn * by) * r
      let oz = (c * nz + sn * bz) * r
      if (bendR > 0) {
        const inner = ox * kx + oy * ky + oz * kz
        const soft = bendR * 0.55
        if (inner > soft) {
          // ponytail: a per-ring squeeze, not a true offset curve; widen the path if a bend still creases
          const room = bendR * 0.35
          const cut = inner - (soft + room * (1 - Math.exp(-(inner - soft) / room)))
          ox -= kx * cut
          oy -= ky * cut
          oz -= kz * cut
        }
      }
      const o = (row * cols + k) * STRIDE
      out[o] = cx + ox
      out[o + 1] = cy + oy
      out[o + 2] = cz + oz
      out[o + 6] = tx
      out[o + 7] = ty
      out[o + 8] = tz
      out[o + 9] = s / 190
      out[o + 10] = (3 * k) / ring
      out[o + 11] = lump / 0.11
    }
  }
  for (let row = 0; row < rows; row++) {
    const q = row < CAP ? q0 : P[row - CAP]
    const ra = Math.max(0, row - 1) * cols
    const rb = Math.min(rows - 1, row + 1) * cols
    for (let k = 0; k <= ring; k++) {
      const o = (row * cols + k) * STRIDE
      const a0 = (ra + k) * STRIDE
      const a1 = (rb + k) * STRIDE
      const b0 = (row * cols + (k === 0 ? ring - 1 : k - 1)) * STRIDE
      const b1 = (row * cols + (k === ring ? 1 : k + 1)) * STRIDE
      const ax = out[a1] - out[a0]
      const ay = out[a1 + 1] - out[a0 + 1]
      const az = out[a1 + 2] - out[a0 + 2]
      const bx = out[b1] - out[b0]
      const by = out[b1 + 1] - out[b0 + 1]
      const bz = out[b1 + 2] - out[b0 + 2]
      let mx = ay * bz - az * by
      let my = az * bx - ax * bz
      let mz = ax * by - ay * bx
      let m = Math.sqrt(mx * mx + my * my + mz * mz)
      if (m < 1e-9) {
        // the dome's apex looks straight ahead
        mx = q.tx
        my = q.ty
        mz = q.tz
        m = 1
      }
      if (mx * (out[o] - q.x) + my * (out[o + 1] - q.y) + mz * (out[o + 2] - q.z) < 0) m = -m
      out[o + 3] = mx / m
      out[o + 4] = my / m
      out[o + 5] = mz / m
    }
  }
}

// ---- the head: sculpted once in head space, posed every frame ----------------------------
//
// Head units: 1 is the neck's radius where it enters the skull. +x runs to the snout,
// +y is the crown and +z the head's right, which every pose turns away from the viewer.
// The skull starts as a ring the size of the neck; each frame the neck is seated into
// that ring along the head's axis (seatNeck), so neck and head read as one piece.

type V3 = number[]
const add3 = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
const sub3 = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const mul3 = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k]
const dot3 = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const cross3 = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const norm3 = (a: V3) => mul3(a, 1 / (Math.hypot(a[0], a[1], a[2]) || 1))
const spow = (v: number, p: number) => Math.sign(v) * Math.pow(Math.abs(v), p)

/** The head while it is built: STRIDE floats a vertex, a skull-to-jaw weight a vertex, triangles. */
type HeadMesh = { v: number[]; w: number[]; i: number[] }

/**
 * Meshes a rows x cols grid of points. Normals come from the neighbours and face away from
 * each row's centre (toward it when `inward`); `ring` closes the seam, where the last column
 * repeats the first. Triangles are wound to face the normal's way whichever way the grid runs.
 */
function grid(
  m: HeadMesh,
  G: V3[],
  rows: number,
  cols: number,
  centre: V3[],
  ring: boolean,
  uv: (j: number, k: number) => number[],
  bump: (j: number, k: number) => number,
  weight: (j: number, k: number) => number = () => 0,
  inward = false,
) {
  const base = m.v.length / STRIDE
  const at = (j: number, k: number) => G[j * cols + k]
  const N: V3[] = []
  for (let j = 0; j < rows; j++)
    for (let k = 0; k < cols; k++) {
      const p = at(j, k)
      const dr = sub3(at(Math.min(rows - 1, j + 1), k), at(Math.max(0, j - 1), k))
      const dc = sub3(at(j, k < cols - 1 ? k + 1 : ring ? 1 : k), at(j, k > 0 ? k - 1 : ring ? cols - 2 : k))
      const out = sub3(p, centre[j])
      let n = cross3(dr, dc)
      // a closed end: face straight out of it
      if (Math.hypot(n[0], n[1], n[2]) < 1e-12) n = out
      n = norm3(n)
      if (dot3(n, out) < 0 !== inward) n = mul3(n, -1)
      N.push(n)
      const t = norm3(dr)
      const [u, v] = uv(j, k)
      m.v.push(p[0], p[1], p[2], n[0], n[1], n[2], t[0], t[1], t[2], u, v, bump(j, k))
      m.w.push(weight(j, k))
    }
  // a triangle faces the camera when its edges' cross product points into the surface
  let s = 0
  for (let j = 0; j < rows - 1; j++)
    for (let k = 0; k < cols - 1; k++) s += dot3(cross3(sub3(at(j + 1, k), at(j, k)), sub3(at(j, k + 1), at(j, k))), N[j * cols + k])
  for (let j = 0; j < rows - 1; j++)
    for (let k = 0; k < cols - 1; k++) {
      const a = base + j * cols + k
      const b = a + cols
      if (s > 0) m.i.push(a, a + 1, b, a + 1, b + 1, b)
      else m.i.push(a, b, a + 1, a + 1, b, b + 1)
    }
}

/**
 * Superellipse sections [x, W, Hh, c, e] down the head: half width, half height, centre
 * height and squareness (2 round, higher boxier). The skull opens at x 0 as the neck's ring.
 */
const SKULL = [
  [0, 0.985, 0.985, 0, 2],
  [0.2, 0.995, 0.995, 0.02, 2.02],
  [0.5, 1.14, 1.06, 0.12, 2.2],
  [0.9, 1.5, 1.04, 0.3, 3.2],
  [1.25, 1.66, 0.94, 0.31, 3.8],
  [1.7, 1.6, 0.84, 0.25, 4],
  [2.2, 1.28, 0.72, 0.16, 4],
  [2.7, 1.0, 0.62, 0.07, 4],
  [3.15, 0.8, 0.55, -0.02, 3.8],
  [3.5, 0.66, 0.47, -0.1, 3.8],
  [3.75, 0.54, 0.41, -0.2, 3.4],
  [3.94, 0.4, 0.31, -0.33, 3],
  [4.06, 0.2, 0.17, -0.47, 2.4],
  [4.12, 0.03, 0.03, -0.58, 2],
]
/** The lower jaw, closed; it swings open about HINGE. */
const JAW = [
  [0.35, 0.1, 0.08, -0.7, 2],
  [0.5, 1.1, 0.28, -0.74, 2.2],
  [0.95, 1.3, 0.27, -0.78, 2.4],
  [1.6, 1.22, 0.22, -0.76, 2.6],
  [2.3, 1.06, 0.18, -0.72, 2.8],
  [2.95, 0.76, 0.15, -0.68, 3],
  [3.45, 0.56, 0.13, -0.66, 3],
  [3.72, 0.4, 0.11, -0.64, 2.6],
  [3.84, 0.1, 0.05, -0.63, 2],
]
const HINGE = [0.55, -0.62]
/** Where the tongue grows from, on the floor of the mouth (jaw space). */
const ROOT = [1.2, -0.64]

/**
 * The skull's carving, a share of its radius: [degrees up from the side at x0, at x1, width in
 * degrees, height (+ ridge, - groove), x0, x1], mirrored left and right. Grooves shade dark.
 */
const CARVE = [
  [90, 90, 5, 0.1, 0.3, 3], // a crest down the middle
  [84, 82, 2.5, -0.15, 0.3, 3.3], // a sharp groove either side of it
  [77, 78, 2.5, 0.07, 0.2, 2.2], // tendon cords running back over the skull
  [71, 73, 2, -0.08, 0.2, 2.1], // and the grooves between them
  [63, 74, 10, -0.27, 1.3, 2.4], // the eye sockets, deep, slanting in toward the snout
  [55, 64, 3, 0.14, 1.2, 2.6], // the socket's hard upper rim
  [52, 48, 5, 0.2, 0.5, 2.7], // the cheek ridge, a sharp plane edge
  [42, 38, 3, -0.18, 0.45, 2.9], // the cut under it
  [28, 22, 8, 0.06, 0.6, 2.6], // the cheek's bulge
  [14, 10, 2.5, -0.1, 0.7, 2.4], // a lower cheek crease
  [-24, -27, 6, -0.09, 1.1, 3.8], // the lip line
  [76, 80, 4, 0.1, 2.5, 3.8], // nasal ridges
  [66, 70, 3, -0.12, 2.5, 3.9], // beside them
  [62, 58, 9, -0.16, 3.62, 4.02], // the nostril pits
]

/** A section table at x: [W, Hh, c, e] on a smooth curve through its rows. */
function sectionAt(T: number[][], x: number) {
  let i = 0
  while (i < T.length - 2 && T[i + 1][0] < x) i++
  const a = T[i]
  const b = T[i + 1]
  const h = b[0] - a[0]
  const t = clamp01((x - a[0]) / h)
  const t2 = t * t
  const t3 = t2 * t
  const slope = (j: number, c: number) => {
    const p = T[Math.max(0, j - 1)]
    const q = T[Math.min(T.length - 1, j + 1)]
    return (q[c] - p[c]) / (q[0] - p[0])
  }
  const v = [1, 2, 3, 4].map(
    (c) => (2 * t3 - 3 * t2 + 1) * a[c] + (t3 - 2 * t2 + t) * h * slope(i, c) + (3 * t2 - 2 * t3) * b[c] + (t3 - t2) * h * slope(i + 1, c),
  )
  return [Math.max(0.005, v[0]), Math.max(0.005, v[1]), v[2], Math.max(2, v[3])]
}

/** A point on a table's surface at x, angle ph round it (0 the right side, pi/2 the crown), grown by `grow` of its radius. */
function sectionPt(T: number[][], x: number, ph: number, grow: number): V3 {
  const [W, H, c, e] = sectionAt(T, x)
  return [x, c + H * spow(Math.sin(ph), 2 / e) * (1 + grow), W * spow(Math.cos(ph), 2 / e) * (1 + grow)]
}

function carve(x: number, ph: number) {
  const deg = (((ph * 180) / Math.PI) % 360 + 360) % 360
  let k = 0
  for (const [a0, a1, w, amp, x0, x1] of CARVE) {
    const win = clamp01(Math.min(x - x0, x1 - x) / 0.3)
    if (win <= 0) continue
    const c = lerp(a0, a1, clamp01((x - x0) / (x1 - x0)))
    for (const cc of c === 90 ? [c] : [c, 180 - c]) {
      let d = Math.abs(deg - cc) % 360
      if (d > 180) d = 360 - d
      k += amp * win * Math.exp(-(d / w) * (d / w))
    }
  }
  const v = ph / (Math.PI * 2)
  k += (vnoise(x * 3.2, v * 7, 1e6, 7) - 0.5) * 0.12 + (vnoise(x * 8 + 3, v * 17, 1e6, 17) - 0.5) * 0.035
  // none at the ring, where the neck comes in
  return k * smooth(0, 0.45, x)
}

/** The carved skull at x, `deg` up from the side (past 90 is the left), lifted `lift` off it. */
function onSkull(x: number, deg: number, lift: number): V3 {
  const ph = (deg * Math.PI) / 180
  const e = 0.004
  const p = sectionPt(SKULL, x, ph, carve(x, ph))
  const px = sectionPt(SKULL, x + e, ph, carve(x + e, ph))
  const pp = sectionPt(SKULL, x, ph + e, carve(x, ph + e))
  let n = norm3(cross3(sub3(px, p), sub3(pp, p)))
  if (dot3(n, sub3(p, [x, sectionAt(SKULL, x)[2], 0])) < 0) n = mul3(n, -1)
  return add3(p, mul3(n, lift))
}

/** A skull or jaw: the table's sections down x, `rows` of them, carved by `cut`. */
function loft(m: HeadMesh, T: number[][], rows: number, ring: number, cut: (x: number, ph: number) => number) {
  const x0 = T[0][0]
  const x1 = T[T.length - 1][0]
  const cols = ring + 1
  const G: V3[] = []
  const C: V3[] = []
  const B: number[] = []
  const X = (j: number) => lerp(x0, x1, j / (rows - 1))
  for (let j = 0; j < rows; j++) {
    const x = X(j)
    C.push([x, sectionAt(T, x)[2], 0])
    for (let k = 0; k < cols; k++) {
      const ph = (k / ring) * Math.PI * 2
      const s = cut(x, ph)
      G.push(sectionPt(T, x, ph, s))
      B.push(s * 6)
    }
  }
  grid(m, G, rows, cols, C, true, (j, k) => [-X(j) * 0.6, (k / ring) * 3], (j, k) => B[j * cols + k])
}

/**
 * A tube through [x, y, z, r] points (a Catmull-Rom curve): horns, quills, ridges, teeth,
 * the tongue. It never thins below `minR` and closes in a point; its start is buried in
 * whatever it grows from. `flat` < 1 squashes the section across `wide`, into a blade.
 * `weight` (0 skull .. 1 jaw, along the tube) lets it stretch across the open mouth.
 */
/** How finely tubes are cut: 1 on a GPU, less for software rendering, where every triangle costs. */
let detail = 1

function tube(
  m: HeadMesh,
  pts: number[][],
  per: number,
  ring: number,
  minR: number,
  bump: number,
  flat = 1,
  wide: V3 | null = null,
  weight: (t: number) => number = () => 0,
) {
  per = Math.max(3, Math.round(per * detail))
  ring = Math.max(6, Math.round(ring * detail))
  const C = catmull(pts, per)
  const n = C.length
  const cols = ring + 1
  const G: V3[] = []
  const centre: V3[] = []
  const S: number[] = []
  const dir = (j: number) => norm3(sub3(C[Math.min(n - 1, j + 1)], C[Math.max(0, j - 1)]))
  let T = dir(0)
  const pick = Math.abs(T[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]
  let N = norm3(sub3(pick, mul3(T, dot3(pick, T))))
  let s = 0
  for (let j = 0; j < n; j++) {
    T = dir(j)
    const w = wide ?? N
    N = norm3(sub3(w, mul3(T, dot3(w, T))))
    const B = cross3(T, N)
    const r = Math.max(minR, C[j][3])
    if (j) s += Math.hypot(C[j][0] - C[j - 1][0], C[j][1] - C[j - 1][1], C[j][2] - C[j - 1][2])
    centre.push(C[j].slice(0, 3))
    S.push(s)
    for (let k = 0; k < cols; k++) {
      const th = (k / ring) * Math.PI * 2
      G.push(add3(C[j], add3(mul3(N, Math.cos(th) * r), mul3(B, Math.sin(th) * r * flat))))
    }
  }
  // the point, one radius on
  const end = Math.max(minR, C[n - 1][3])
  const tip = add3(C[n - 1], mul3(T, end))
  centre.push(C[n - 1].slice(0, 3))
  S.push(s + end)
  for (let k = 0; k < cols; k++) G.push(tip)
  grid(m, G, n + 1, cols, centre, true, (j, k) => [S[j] * 0.6, k / ring], () => bump, (j) => weight(Math.min(1, j / (n - 1))))
}

/** A tube laid along the skull: [x, degrees up from the side, lift off it, r] points, on side `sd`. */
const ridge = (m: HeadMesh, pts: number[][], sd: number, minR: number, bump = 0.7) =>
  tube(m, pts.map(([x, a, l, r]) => [...onSkull(x, sd > 0 ? a : 180 - a, l), r]), 6, 10, minR, bump)

/**
 * A leaf-shaped slit laid in the skull from (x0, a0) to (x1, a1), `w` degrees across at its
 * widest, on side `sd`. uv runs along it and across it; the shader draws the lids from v.
 */
function slit(m: HeadMesh, x0: number, a0: number, x1: number, a1: number, w: number, sd: number) {
  const rows = 16
  const cols = 7
  const G: V3[] = []
  const C: V3[] = []
  for (let j = 0; j < rows; j++) {
    const t = j / (rows - 1)
    const half = w * 0.5 * Math.pow(Math.sin(Math.PI * t), 0.75) * (1 - 0.3 * t)
    const x = lerp(x0, x1, t)
    const a = lerp(a0, a1, t)
    C.push([x, sectionAt(SKULL, x)[2], 0])
    for (let k = 0; k < cols; k++) {
      const deg = a + (k / (cols - 1) - 0.5) * 2 * half
      G.push(onSkull(x, sd > 0 ? deg : 180 - deg, 0.012))
    }
  }
  grid(m, G, rows, cols, C, false, (j, k) => [j / (rows - 1), k / (cols - 1)], () => 0)
}

/** The skull's underside and the jaw's top at x: where the lips meet. */
const gapeAt = (x: number) => {
  const s = sectionAt(SKULL, x)
  return s[2] - s[1]
}

/**
 * The inside of the mouth: a red pouch hung between the palate (just under the skull) and
 * the floor (just on the jaw), with the far cheek between them. The near side stays open,
 * so the open jaws show into it; it narrows to the throat at the back.
 */
function mouth(m: HeadMesh) {
  const rows = 22
  const cols = 25
  const G: V3[] = []
  const C: V3[] = []
  const W: number[] = []
  for (let j = 0; j < rows; j++) {
    const x = lerp(0.95, 3.7, j / (rows - 1))
    const top = gapeAt(x) - 0.02
    const J = sectionAt(JAW, x)
    const floor = J[2] + J[1] + 0.02
    // it narrows to the throat at the back and closes toward the jaw tips, so no end shows as a cut
    const wid = J[0] * 0.86 * smooth(0.95, 1.5, x) * (1 - 0.85 * smooth(3.1, 3.7, x))
    const mid = (top + floor) / 2
    const half = (top - floor) / 2
    C.push([x, mid, -wid * 3 - 0.5])
    for (let k = 0; k < cols; k++) {
      // one round pouch: from the palate's near edge over the far cheek to the floor's near edge,
      // so no flat panel or crease can catch the light
      const ph = lerp(-0.32, 1.32, k / (cols - 1)) * Math.PI
      const c = Math.cos(ph)
      G.push([x, mid + half * c, wid * 1.02 * Math.sin(ph)])
      W.push(smooth(0.6, -0.6, c))
    }
  }
  grid(m, G, rows, cols, C, false, (j, k) => [j / rows, k / cols], () => 0, (j, k) => W[j * cols + k], true)
}

/** The rest of the head's parts, per page. `minR` is the thinnest a tip may get, in head units. */
const HORNS: Record<string, (m: HeadMesh, minR: number) => void> = {
  // the cover: two sickle horns curling down from the jaw sides, a straight horn up and
  // back on the far side, two crown spikes and the long quill off the near cheek
  crown: (m, minR) => {
    for (const s of [-1, 1]) {
      tube(m, [[0.95, 0.85, s * 0.45, 0.42], [0.8, 1.3, s * 0.56, 0.28], [0.66, 1.72, s * 0.64, 0.12], [0.6, 1.92, s * 0.67, 0.01]], 8, 12, minR, 0.6)
      tube(m, [[2.4, -0.1, s * 0.9, 0.27], [2.55, -0.3, s * 1.5, 0.27], [2.9, -0.68, s * 1.9, 0.23], [3.38, -1.05, s * 1.88, 0.16], [3.8, -1.25, s * 1.62, 0.08], [4.05, -1.25, s * 1.42, 0.01]], 8, 14, minR, 0.6)
    }
    tube(m, [[1.15, 0.6, 1.2, 0.19], [1.25, 0.9, 1.6, 0.14], [1.4, 1.25, 2.15, 0.07], [1.5, 1.5, 2.6, 0.01]], 8, 12, minR, 0.6)
    tube(m, [[1.3, 0.35, -1.35, 0.08], [0.9, 0.0, -2.0, 0.065], [0.1, -0.6, -2.8, 0.04], [-0.8, -0.95, -3.4, 0.01]], 8, 10, minR, 0.8)
  },
  // the glyph set: a quill back off the skull, one down from the throat, one along the neck
  quills: (m, minR) => {
    tube(m, [[0.9, 0.6, 0, 0.15], [0.2, 1.35, 0, 0.11], [-1.2, 2.75, 0, 0.05], [-2.2, 3.7, 0, 0.01]], 8, 12, minR, 0.7)
    tube(m, [[1.3, -0.8, -0.2, 0.12], [1.35, -1.6, -0.25, 0.08], [1.4, -2.9, -0.3, 0.035], [1.42, -3.4, -0.3, 0.01]], 8, 12, minR, 0.7)
    tube(m, [[0.7, -0.75, -0.9, 0.09], [-0.4, -0.95, -1.05, 0.07], [-1.8, -0.9, -1.15, 0.035], [-2.6, -0.85, -1.15, 0.01]], 8, 10, minR, 0.8)
  },
  // alternates: a long quill up and back off the skull, one straight down from the throat
  spears: (m, minR) => {
    tube(m, [[0.9, 0.85, 0, 0.16], [0.1, 1.45, 0.05, 0.12], [-1.5, 2.3, 0.15, 0.06], [-2.6, 2.9, 0.2, 0.01]], 8, 12, minR, 0.7)
    tube(m, [[0.5, -0.9, -0.1, 0.15], [0.62, -1.9, -0.15, 0.11], [0.8, -3.3, -0.2, 0.05], [0.88, -4.2, -0.2, 0.01]], 8, 12, minR, 0.7)
  },
  // styles: flat blade horns in a V, flat spikes out to the sides, layered cheek plates
  mask: (m, minR) => {
    for (const s of [-1, 1]) {
      // blade horns in a V, broad across the view
      tube(m, [[1.7, 0.7, s * 0.7, 0.34], [1.3, 1.35, s * 1.2, 0.28], [0.85, 2.05, s * 1.75, 0.15], [0.6, 2.5, s * 2.05, 0.01]], 8, 12, minR, 0.6, 0.3, [-0.3 * s, 0.5 * s, -1])
      // flat spikes straight out to the sides
      tube(m, [[2.2, -0.3, s * 1.0, 0.26], [2.1, -0.05, s * 1.9, 0.2], [1.9, 0.45, s * 3.0, 0.09], [1.8, 0.75, s * 3.7, 0.01]], 8, 12, minR, 0.6, 0.3, [s, -1.74 * s, -0.4])
      // layered cheek plates sweeping out and down
      for (let p = 0; p < 4; p++)
        tube(m, [[1.3 + p * 0.36, 0.4 - p * 0.28, s * 1.25, 0.36], [1.6 + p * 0.36, -0.1 - p * 0.28, s * (1.85 + p * 0.12), 0.32], [1.95 + p * 0.34, -0.85 - p * 0.22, s * (2.1 + p * 0.1), 0.18], [2.2 + p * 0.34, -1.3 - p * 0.18, s * (2.05 + p * 0.08), 0.01]], 8, 12, minR, 0.9, 0.3, [-0.25 * s, 0.44 * s, 1.3])
    }
  },
}

/** The tongue in jaw space: out past the jaw tip ("flick"), or hanging in a curl ("curl"). The fork is added at the end. */
const TONGUES: Record<string, number[][]> = {
  flick: [[1.2, -0.5, 0, 0.12], [2, -0.47, 0, 0.12], [2.7, -0.44, 0, 0.1], [3.3, -0.41, 0, 0.085], [3.85, -0.4, 0.02, 0.065], [4.3, -0.46, 0.03, 0.05]],
  curl: [[1.2, -0.5, 0, 0.13], [2.1, -0.46, 0, 0.13], [3, -0.42, 0.05, 0.115], [3.7, -0.45, 0.12, 0.095], [4.2, -0.64, 0.16, 0.08], [4.5, -0.9, 0.16, 0.066], [4.8, -1.08, 0.12, 0.055], [5.1, -1.16, 0.08, 0.045], [5.4, -1.08, 0.05, 0.036]],
}

/** A drawable piece of the head: an index range, its material (uMat), which matrix moves it, and whether only an open mouth shows it. */
type Part = { at: number; n: number; mat: number; space: number; open: boolean }
/** Which matrix moves a part: the skull's (vertices weighted toward the jaw follow it), the jaw's, the tongue's. */
const SKULL_SPACE = 0
const JAW_SPACE = 1
const TONGUE_SPACE = 2

/**
 * Builds every page's head once: the shared skull, jaw, eyes, ridges, lip folds and mouth,
 * then each page's horns and tongue. `units` is each scene's head unit in scene units,
 * so tips can be held to 1.2 scene units whatever the page's zoom. `fine` is false for
 * software rendering, which gets a coarser skull and jaw.
 */
function buildHead(scenes: Scene[], units: number[], fine: boolean) {
  const m: HeadMesh = { v: [], w: [], i: [] }
  const shared: Part[] = []
  const add = (mat: number, space: number, open: boolean, fn: () => void) => {
    const at = m.i.length
    fn()
    shared.push({ at, n: m.i.length - at, mat, space, open })
  }
  const minR = 1.2 / Math.min(...units)
  detail = fine ? 1 : 0.5
  add(6, SKULL_SPACE, false, () => {
    loft(m, SKULL, fine ? 96 : 40, fine ? 96 : 40, carve)
    for (const s of [-1, 1]) {
      // a broad brow between the eyes and the crest, and the cheek ridge outside them: low folds, not cords
      ridge(m, [[2.5, 87, -0.08, 0.08], [2.05, 86.5, -0.08, 0.15], [1.5, 86, -0.08, 0.16], [0.95, 86, -0.09, 0.14], [0.5, 86.5, -0.12, 0.1]], s, minR)
      ridge(m, [[2.65, 52, -0.1, 0.1], [2.1, 50, -0.09, 0.19], [1.5, 48, -0.09, 0.21], [0.95, 47, -0.1, 0.17], [0.5, 47, -0.13, 0.1]], s, minR)
      // thin cords on the brow; one lifts off in a loop the page shows through
      ridge(m, [[2.3, 83, 0.01, 0.03], [1.75, 82.5, 0.07, 0.04], [1.2, 82, 0.12, 0.038], [0.75, 82.5, 0.09, 0.032], [0.45, 83, 0, 0.022]], s, minR, 0.9)
      // the lid between the two slits
      ridge(m, [[1.45, 64, 0, 0.04], [1.85, 69.5, 0.04, 0.06], [2.25, 74, 0.01, 0.035]], s, minR, 0.9)
    }
  })
  add(6, JAW_SPACE, false, () => loft(m, JAW, fine ? 48 : 24, fine ? 48 : 24, (x, ph) => (vnoise(x * 3.2, (ph / Math.PI) * 3.5, 1e6, 7) - 0.5) * 0.08 * smooth(0.35, 0.6, x)))
  // the rolled lip: from above the corner round it and forward along the lower jaw
  add(6, SKULL_SPACE, false, () => {
    for (const s of [-1, 1])
      tube(m, [[0.5, 0.2, s * 1.3, 0.12], [0.72, -0.12, s * 1.52, 0.22], [0.98, -0.44, s * 1.6, 0.29], [1.25, -0.64, s * 1.46, 0.31], [1.8, -0.64, s * 1.16, 0.26], [2.45, -0.62, s * 0.98, 0.16], [2.95, -0.6, s * 0.82, 0.04]], 8, 14, minR, 0.8, 1, null, (t) => smooth(0.2, 0.45, t))
  })
  add(1, SKULL_SPACE, false, () => {
    for (const s of [-1, 1]) {
      // the inner slit shorter, the outer one longer
      slit(m, 1.58, 70, 2.08, 76, 7.5, s)
      slit(m, 1.42, 61, 2.22, 69.5, 9.5, s)
    }
  })
  add(2, SKULL_SPACE, false, () => {
    for (const s of [-1, 1]) slit(m, 3.78, 64, 3.95, 56, 9, s)
  })
  add(3, SKULL_SPACE, true, () => mouth(m))
  // gums along both jaws, so the teeth are set in flesh and the mouth's rims never show as edges
  add(3, SKULL_SPACE, true, () => {
    for (const s of [-1, 1]) {
      const up: number[][] = []
      for (let x = 1.3; x <= 3.8; x += 0.25) up.push([x, gapeAt(x) + 0.02, s * sectionAt(JAW, x)[0] * 0.86, 0.1 * (1 - 0.4 * smooth(3, 3.8, x))])
      tube(m, up, 5, 8, minR, 0.2)
    }
  })
  add(3, JAW_SPACE, true, () => {
    for (const s of [-1, 1]) {
      const lo: number[][] = []
      for (let x = 1.4; x <= 3.7; x += 0.25) {
        const J = sectionAt(JAW, x)
        lo.push([x, J[2] + J[1] - 0.01, s * J[0] * 0.8, 0.085 * (1 - 0.4 * smooth(3, 3.7, x))])
      }
      tube(m, lo, 5, 8, minR, 0.2)
    }
  })
  // needle teeth, dark like the skin: six down from each side of the upper jaw, three up from the lower
  add(6, SKULL_SPACE, true, () => {
    for (const s of [-1, 1])
      for (let k = 0; k < 8; k++) {
        const x = 1.45 + k * 0.31
        const L = lerp(0.34, 0.74, k / 7) * (k % 2 ? 0.8 : 1)
        const y = gapeAt(x) + 0.05
        const z = s * sectionAt(JAW, x)[0] * 0.84
        tube(m, [[x + 0.02, y, z, 0.06], [x, y - L * 0.5, z, 0.04], [x - 0.07, y - L, z * 0.98, 0.012]], 5, 7, minR, 1)
      }
  })
  add(6, JAW_SPACE, true, () => {
    for (const s of [-1, 1])
      for (let k = 0; k < 5; k++) {
        const x = 2.1 + k * 0.36
        const L = lerp(0.22, 0.4, k / 4)
        const J = sectionAt(JAW, x)
        const y = J[2] + J[1] - 0.04
        const z = s * J[0] * 0.8
        tube(m, [[x - 0.02, y, z, 0.04], [x, y + L * 0.5, z, 0.028], [x + 0.05, y + L, z, 0.01]], 5, 7, minR, 1)
      }
  })
  // strings of spit between the jaws, sagging toward the throat
  add(5, SKULL_SPACE, true, () => {
    for (const [x, z] of [[2.9, -0.35], [3.3, 0.3], [3.55, -0.12]]) {
      const y = gapeAt(x)
      tube(m, [[x, y + 0.03, z, 0.014], [x - 0.08, y - 0.1, z, 0.012], [x + 0.04, y - 0.04, z, 0.014]], 10, 6, minR, 0, 1, null, (t) => t)
    }
  })

  const sets = scenes.map((sc, si) => {
    const parts = shared.slice()
    const at = m.i.length
    const r = 1.2 / units[si]
    if (sc.horns) HORNS[sc.horns](m, r)
    parts.push({ at, n: m.i.length - at, mat: 6, space: SKULL_SPACE, open: false })
    if (sc.tongue) {
      const t0 = m.i.length
      const pts = TONGUES[sc.tongue]
      tube(m, pts, 6, 9, r, 0)
      const e = pts[pts.length - 1]
      const d = norm3(sub3(e, pts[pts.length - 2]))
      for (const s of [-1, 1]) tube(m, [[e[0], e[1], e[2], 0.03], [e[0] + d[0] * 0.2, e[1] + d[1] * 0.2 - 0.03, e[2] + s * 0.07, 0.02], [e[0] + d[0] * 0.38, e[1] + d[1] * 0.38 - 0.04, e[2] + s * 0.16, 0.01]], 6, 7, r, 0)
      parts.push({ at: t0, n: m.i.length - t0, mat: 4, space: TONGUE_SPACE, open: true })
    }
    return parts.filter((p) => p.n > 0)
  })
  detail = 1
  return { verts: new Float32Array(m.v), weights: new Float32Array(m.w), index: new Uint32Array(m.i), sets }
}

/**
 * The head's pose for one frame, column-major: where the head sits in the scene, and the
 * jaw's and the tongue's motion in head space. `stretch` reshapes it for the page.
 */
type HeadPose = { place: Float32Array; jaw: Float32Array; tongue: Float32Array; stretch: number[]; open: boolean }

const hingeM = new Float32Array(16)

const ONE3 = [1, 1, 1]

/** out = M, then a turn of `ang` about head z through (hx, hy) and a scale of k about it. */
function hinge(M: Float32Array, hx: number, hy: number, ang: number, k: number, out: Float32Array) {
  const c = Math.cos(ang) * k
  const s = Math.sin(ang) * k
  const H = hingeM
  H.fill(0)
  H[0] = c
  H[1] = s
  H[4] = -s
  H[5] = c
  H[10] = k
  H[12] = hx - (c * hx - s * hy)
  H[13] = hy - (s * hx + c * hy)
  H[15] = 1
  for (let col = 0; col < 4; col++)
    for (let row = 0; row < 4; row++)
      out[col * 4 + row] = M[row] * H[col * 4] + M[4 + row] * H[col * 4 + 1] + M[8 + row] * H[col * 4 + 2] + M[12 + row] * H[col * 4 + 3]
}

/** Refreshes the spine's unit tangents (toward the head) for samples j0..j1. */
function tangents(P: Q[], j0: number, j1: number) {
  const n = P.length - 1
  for (let j = Math.max(0, j0); j <= Math.min(n, j1); j++) {
    const p = P[Math.max(0, j - 1)]
    const q = P[Math.min(n, j + 1)]
    const dx = p.x - q.x
    const dy = p.y - q.y
    const dz = p.z - q.z
    const l = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1
    P[j].tx = dx / l
    P[j].ty = dy / l
    P[j].tz = dz / l
  }
}

/**
 * Poses the head on the neck's end and seats the neck in it. Travelling, the head runs along
 * the neck with its crown held as near the page's pose as the heading allows; at rest
 * (`rest` 1) it takes the page's pose, turned `look` radians clockwise about the line of
 * sight. Over its last stretch the neck then swings round to run straight into the back of
 * the skull and eases to the skull's ring, so the joint never shows.
 */
function poseHead(P: Q[], sc: Scene, unit: number, rest: number, look: number, jaw: number, tongue: number[], out: HeadPose) {
  const q = P[0]
  const c = Math.cos(look)
  const s = Math.sin(look)
  const turn = (v: V3): V3 => [v[0] * c - v[1] * s, v[0] * s + v[1] * c, v[2]]
  const along: V3 = [q.tx, q.ty, q.tz]
  const F = norm3(sc.face ? add3(mul3(along, 1 - rest), mul3(turn(sc.face), rest)) : along)
  let up = turn(sc.top ?? [0, -1, 0])
  up = sub3(up, mul3(F, dot3(up, F)))
  if (Math.hypot(up[0], up[1], up[2]) < 0.25) {
    // heading along the crown's own direction: fall back to the path's back side
    up = [-sc.side * q.ty, sc.side * q.tx, 0]
    up = sub3(up, mul3(F, dot3(up, F)))
  }
  const U = norm3(up)
  const R = cross3(F, U)
  const M = out.place
  for (let k = 0; k < 3; k++) {
    M[k] = F[k] * unit
    M[4 + k] = U[k] * unit
    M[8 + k] = R[k] * unit
  }
  M[3] = M[7] = M[11] = 0
  M[12] = q.x
  M[13] = q.y
  M[14] = q.z
  M[15] = 1
  hinge(IDENTITY, HINGE[0], HINGE[1], -jaw, 1, out.jaw)
  out.jaw[13] -= (sc.drop ?? 0) * rest
  hinge(out.jaw, ROOT[0], ROOT[1], tongue[1], tongue[0], out.tongue)
  out.open = jaw > 0.05
  out.stretch = sc.stretch ?? ONE3

  // seat the neck: pull its last stretch onto the head's axis, easing out to the path
  const len = unit * 2.4 + Math.abs(P[Math.min(P.length - 1, 24)].r - unit) * 4
  let px = q.x
  let py = q.y
  let pz = q.z
  let d = 0
  let j = 1
  q.r = unit
  for (; j < P.length - 1 && d < len; j++) {
    const p = P[j]
    d += Math.hypot(p.x - px, p.y - py, p.z - pz)
    px = p.x
    py = p.y
    pz = p.z
    const w = smooth(0, len, d)
    const ax = q.x - F[0] * d
    const ay = q.y - F[1] * d
    const az = q.z - F[2] * d
    p.x = ax + (p.x - ax) * w
    p.y = ay + (p.y - ay) * w
    p.z = az + (p.z - az) * w
    p.r = unit + (p.r - unit) * w
  }
  tangents(P, 0, j + 1)
}

// ---- legs, hands and claws: posed and swept every frame, in scene space --------------------
//
// A limb is six tubes: the arm (root, flared into the body, to the palm's end, with a
// muscle bulge and a round elbow knob) and five digits (four fingers and a dewclaw), each
// three knuckled bones and a hooked claw. The row counts never change, so the triangles
// are built once and only the vertices move.

/** The most legs on one page. */
const MAX_LEGS = 3
/** Rows a finger bone, rows a claw; a digit's rows, then the point. */
const PH = 3
const CL = 5
const F_ROWS = 1 + 3 * PH + CL
/** The fingers cross the type from their second bone on; the first stays with the palm. */
const FRONT_ROW = 1 + PH
const DIGITS = 5

/** Rows along the arm (root to elbow, elbow to wrist, the palm) and round it and a digit. */
type LimbShape = { up: number; low: number; palm: number; ring: number; fring: number }
/** Rows that bury the arm's start in the body: a long, slow cone, so no rim can show where it leaves. */
const ROOT_ROWS = 3
const armRows = (sh: LimbShape) => ROOT_ROWS + sh.up + sh.low + sh.palm
const limbVerts = (sh: LimbShape) => (armRows(sh) + 1) * (sh.ring + 1) + DIGITS * (F_ROWS + 1) * (sh.fring + 1)

/** A leg this frame: the root in the body, elbow, wrist, and the hand's frame (fingers F, back K, side S). */
type LegPose = {
  root: V3
  elbow: V3
  wrist: V3
  F: V3
  K: V3
  S: V3
  curl: number
  spread: number
  /** hand size and limb girth, in scene units; the body's radius where the leg grows */
  size: number
  rootR: number
  girth: number
  front: boolean
}

/** Turns v about the unit axis k by a radians. */
function turn3(v: V3, k: V3, a: number): V3 {
  const c = Math.cos(a)
  const s = Math.sin(a)
  const kv = dot3(k, v)
  const x = cross3(k, v)
  return [v[0] * c + x[0] * s + k[0] * kv * (1 - c), v[1] * c + x[1] * s + k[1] * kv * (1 - c), v[2] * c + x[2] * s + k[2] * kv * (1 - c)]
}

/** A Catmull-Rom point between p1 and p2. */
function cat3(p0: V3, p1: V3, p2: V3, p3: V3, t: number): V3 {
  const t2 = t * t
  const t3 = t2 * t
  return [0, 1, 2].map((c) => 0.5 * (2 * p1[c] + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3))
}

const gauss = (x: number, at: number, w: number) => Math.exp(-((x - at) / w) * ((x - at) / w))

/** Per finger (index to little): an extra splay, a tilt out of the hand's plane, and how much more it curls. */
const SPLAY = [-0.14, 0.04, -0.05, 0.16]
const TILT = [0.12, -0.06, 0.09, -0.12]
const CURLS = [1.15, 0.88, 1.05, 1.28]

/**
 * Sweeps a ring round each of `rows` centre points C (x, y, z, r) into `out` from vertex v0,
 * then closes the tube in a point one radius on. Rings ride a parallel-transported frame;
 * W and H, when given, stretch each ring along the unit vectors Sx and Kx (the palm's
 * breadth and thickness). Normals come from the neighbouring vertices, as the body's do.
 */
function sweepTube(C: Float32Array, rows: number, ring: number, bump: Float32Array, vScale: number, out: Float32Array, v0: number, W: Float32Array | null, H: Float32Array | null, Sx: V3, Kx: V3) {
  const cols = ring + 1
  const cs = ringTable(ring)
  let tx = C[4] - C[0]
  let ty = C[5] - C[1]
  let tz = C[6] - C[2]
  // a first normal: whichever axis the tube runs least along
  let nx = Math.abs(tx) < Math.abs(ty) ? 1 : 0
  let ny = 1 - nx
  let nz = 0
  let s = 0
  for (let j = 0; j <= rows; j++) {
    const tip = j === rows
    const i = (tip ? rows - 1 : j) * 4
    if (!tip) {
      const a = Math.max(0, j - 1) * 4
      const b = Math.min(rows - 1, j + 1) * 4
      tx = C[b] - C[a]
      ty = C[b + 1] - C[a + 1]
      tz = C[b + 2] - C[a + 2]
      const tl = Math.sqrt(tx * tx + ty * ty + tz * tz) || 1
      tx /= tl
      ty /= tl
      tz /= tl
      if (j) {
        const dx = C[i] - C[i - 4]
        const dy = C[i + 1] - C[i - 3]
        const dz = C[i + 2] - C[i - 2]
        s += Math.sqrt(dx * dx + dy * dy + dz * dz)
      }
    }
    const d = nx * tx + ny * ty + nz * tz
    nx -= tx * d
    ny -= ty * d
    nz -= tz * d
    const nl = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1
    nx /= nl
    ny /= nl
    nz /= nl
    const bx = ty * nz - tz * ny
    const by = tz * nx - tx * nz
    const bz = tx * ny - ty * nx
    const r = tip ? 0 : C[i + 3]
    const ahead = tip ? C[i + 3] : 0
    const cx = C[i] + tx * ahead
    const cy = C[i + 1] + ty * ahead
    const cz = C[i + 2] + tz * ahead
    const w = W ? W[j] - 1 : 0
    const h = H ? H[j] - 1 : 0
    for (let k = 0; k <= ring; k++) {
      const c = cs[k * 2] * r
      const sn = cs[k * 2 + 1] * r
      let ox = c * nx + sn * bx
      let oy = c * ny + sn * by
      let oz = c * nz + sn * bz
      if (w || h) {
        const os = (ox * Sx[0] + oy * Sx[1] + oz * Sx[2]) * w
        const ok = (ox * Kx[0] + oy * Kx[1] + oz * Kx[2]) * h
        ox += Sx[0] * os + Kx[0] * ok
        oy += Sx[1] * os + Kx[1] * ok
        oz += Sx[2] * os + Kx[2] * ok
      }
      const o = (v0 + j * cols + k) * STRIDE
      out[o] = cx + ox
      out[o + 1] = cy + oy
      out[o + 2] = cz + oz
      out[o + 6] = tx
      out[o + 7] = ty
      out[o + 8] = tz
      out[o + 9] = (s + ahead) / 190
      out[o + 10] = (k / ring) * vScale
      out[o + 11] = bump[tip ? rows - 1 : j]
    }
  }
  for (let j = 0; j <= rows; j++) {
    const i = Math.min(j, rows - 1) * 4
    const ra = (v0 + Math.max(0, j - 1) * cols) * STRIDE
    const rb = (v0 + Math.min(rows, j + 1) * cols) * STRIDE
    for (let k = 0; k <= ring; k++) {
      const o = (v0 + j * cols + k) * STRIDE
      const a0 = ra + k * STRIDE
      const a1 = rb + k * STRIDE
      const b0 = (v0 + j * cols + (k === 0 ? ring - 1 : k - 1)) * STRIDE
      const b1 = (v0 + j * cols + (k === ring ? 1 : k + 1)) * STRIDE
      const ax = out[a1] - out[a0]
      const ay = out[a1 + 1] - out[a0 + 1]
      const az = out[a1 + 2] - out[a0 + 2]
      const bx = out[b1] - out[b0]
      const by = out[b1 + 1] - out[b0 + 1]
      const bz = out[b1 + 2] - out[b0 + 2]
      let mx = ay * bz - az * by
      let my = az * bx - ax * bz
      let mz = ax * by - ay * bx
      let m = Math.sqrt(mx * mx + my * my + mz * mz)
      if (m < 1e-9) {
        // the point looks straight ahead
        mx = out[o + 6]
        my = out[o + 7]
        mz = out[o + 8]
        m = 1
      }
      if (mx * (out[o] - C[i]) + my * (out[o + 1] - C[i + 1]) + mz * (out[o + 2] - C[i + 2]) < 0) m = -m
      out[o + 3] = mx / m
      out[o + 4] = my / m
      out[o + 5] = mz / m
    }
  }
}

/** Scratch rows for one tube at a time: centre and radius, gloss, palm breadth and thickness. */
const tubeC = new Float32Array(64 * 4)
const tubeB = new Float32Array(64)
const tubeW = new Float32Array(64)
const tubeH = new Float32Array(64)

/**
 * Sweeps leg L into `out` from vertex v0: the arm, then the four fingers and the dewclaw.
 * `minR` is the thinnest a claw's point may get.
 */
function sweepLimb(L: LegPose, sh: LimbShape, minR: number, out: Float32Array, v0: number) {
  const { root, elbow, wrist, F, K, S, size, girth } = L
  const palmEnd = add3(wrist, mul3(F, size * 0.36))
  const ghost0 = sub3(mul3(root, 2), elbow)
  const ghost3 = sub3(mul3(palmEnd, 2), wrist)
  const g = girth / 46
  let row = 0
  const put = (p: V3, r: number, b: number, w = 1, h = 1) => {
    tubeC[row * 4] = p[0]
    tubeC[row * 4 + 1] = p[1]
    tubeC[row * 4 + 2] = p[2]
    tubeC[row * 4 + 3] = r
    tubeB[row] = b
    tubeW[row] = w
    tubeH[row] = h
    row++
  }
  // the fillet: up to 1.4x where it leaves the body, easing out over the first half of the upper arm, never wider than the body
  const flare = Math.min(0.4, Math.max(0, (L.rootR * 0.8) / (46 * g) - 1))
  // closed in a long cone where it starts, deep in the body, so no open end or rim can ever show
  const back = norm3(sub3(elbow, root))
  const R0 = 46 * g * (1 + flare)
  put(sub3(root, mul3(back, R0 * 2.6)), 0.5, 0.2)
  put(sub3(root, mul3(back, R0 * 1.7)), R0 * 0.55, 0.2)
  put(sub3(root, mul3(back, R0 * 0.8)), R0 * 0.88, 0.2)
  // the upper bone flares where it leaves the body (1.6x, the body's fillet), bulges, ends in the knob
  for (let j = 0; j < sh.up; j++) {
    const t = j / sh.up
    const knob = gauss(t, 1, 0.14)
    const r = lerp(46, 40, t) * (1 + flare * (1 - smooth(0, 0.45, t))) * (1 + 0.16 * gauss(t, 0.4, 0.2)) * (1 + 0.3 * knob)
    put(cat3(ghost0, root, elbow, wrist, t), r * g, 0.2 + knob * 0.8)
  }
  for (let j = 0; j < sh.low; j++) {
    const t = j / sh.low
    const knob = gauss(t, 0, 0.14)
    const r = lerp(37, 24, t) * (1 + 0.3 * knob) * (1 + 0.1 * gauss(t, 0.3, 0.2))
    put(cat3(root, elbow, wrist, palmEnd, t), r * g, 0.2 + knob * 0.8 + 0.3 * gauss(t, 0.6, 0.3))
  }
  // the palm: broad and flat, rounding off at its end where the fingers come out
  const palmR = size * 0.16
  for (let j = 0; j < sh.palm; j++) {
    const t = j / (sh.palm - 1)
    const r = lerp(24 * g, palmR, smooth(0, 0.5, t)) * (1 - 0.45 * smooth(0.7, 1, t))
    put(cat3(elbow, wrist, palmEnd, ghost3, t), r, 0.3, lerp(1, 1.55, smooth(0, 0.5, t)), lerp(1, 0.52, smooth(0, 0.5, t)))
  }
  sweepTube(tubeC, row, sh.ring, tubeB, 2, out, v0, tubeW, tubeH, S, K)
  let v = v0 + (row + 1) * (sh.ring + 1)

  // the digits: four fingers fanned across the palm's end, then the dewclaw hooking back off the wrist
  for (let f = 0; f < DIGITS; f++) {
    const dew = f === DIGITS - 1
    const lenK = dew ? 0.32 : [0.9, 1, 0.97, 0.82][f]
    let p: V3
    let d: V3
    let axis: V3
    if (dew) {
      // its root inside the wrist, so the tube's open start never shows
      p = add3(add3(wrist, mul3(F, size * 0.12)), mul3(S, size * 0.05))
      // back along the wrist and out to the side, held flat to the page so it reads as a hook
      d = add3(mul3(F, -0.7), mul3(S, 0.7))
      d = norm3([d[0], d[1], 0.15])
      // it hooks round in the page's plane, toward the palm's side
      axis = [0, 0, dot3(cross3(d, sub3([0, 0, 0], K)), [0, 0, 1]) < 0 ? -1 : 1]
    } else {
      const o = f - 1.5
      p = add3(add3(palmEnd, mul3(F, -size * 0.12)), add3(mul3(S, o * size * 0.14), mul3(K, -size * 0.03)))
      // splayed unevenly, and not all in one plane: no two fingers lie alike
      d = turn3(F, K, o * L.spread * 1.3 + SPLAY[f])
      d = turn3(d, S, TILT[f])
      axis = norm3(cross3(K, d))
    }
    let r = size * (dew ? 0.07 : 0.058)
    row = 0
    put(p, r * 1.2, 0.5)
    const bones = [0.36, 0.3, 0.24]
    // the first joint lifts the finger off the palm, the next two hook it down: an arched grip,
    // each finger curled its own amount
    const bend = [-0.35, 0.62, 0.55]
    for (let b = 0; b < 3; b++) {
      const len = bones[b] * size * lenK
      const tw = dew ? 0.25 : bend[b] * L.curl * (b ? CURLS[f] : 1)
      // the joint turns at the bone's start, then the bone runs straight to its knuckle
      d = turn3(d, axis, tw)
      for (let k = 0; k < PH; k++) {
        p = add3(p, mul3(d, len / PH))
        // knuckles; the dewclaw is one smooth hook
        const kn = k === PH - 1 && !dew ? 1 : 0
        put(p, dew ? r : r * (kn ? 1.62 : k === 0 ? 0.92 : 0.76), 0.25 + kn * 0.75)
      }
      r *= 0.88
    }
    // the claw: a big talon, over a third of the finger, hooked about 120 degrees to a needle
    const clen = (dew ? 0.3 : 0.4) * size * lenK
    const r0 = r * (dew ? 0.95 : 1.2)
    for (let k = 0; k < CL; k++) {
      const t = (k + 1) / CL
      d = turn3(d, axis, 2.15 / CL)
      p = add3(p, mul3(d, clen / CL))
      put(p, Math.max(minR, r0 * Math.pow(1 - t, 1.25)), 1)
    }
    sweepTube(tubeC, row, sh.fring, tubeB, 1, out, v, null, null, S, K)
    v += (row + 1) * (sh.fring + 1)
  }
}

/**
 * The triangles for MAX_LEGS limbs, and each limb's index ranges: `back` (the arm, the palm,
 * the fingers' first bones and the dewclaw) and `front` (the rest of the fingers and the
 * claws), so a gripping hand's fingers can be drawn on their own, above the type; `hand`
 * is the tail of `back` from the wrist on, all that can hide a finger.
 */
function limbIndex(sh: LimbShape) {
  const idx: number[] = []
  const ranges: { back: number[]; hand: number[]; front: number[] }[] = []
  const quads = (v0: number, ring: number, r0: number, r1: number) => {
    for (let j = r0; j < r1; j++)
      for (let k = 0; k < ring; k++) {
        const a = v0 + j * (ring + 1) + k
        const b = a + ring + 1
        idx.push(a, b, a + 1, a + 1, b, b + 1)
      }
  }
  const per = limbVerts(sh)
  const armV = (armRows(sh) + 1) * (sh.ring + 1)
  const digV = (F_ROWS + 1) * (sh.fring + 1)
  for (let l = 0; l < MAX_LEGS; l++) {
    const v0 = l * per
    const at = idx.length
    quads(v0, sh.ring, 0, ROOT_ROWS + sh.up + sh.low)
    const wrist = idx.length
    quads(v0, sh.ring, ROOT_ROWS + sh.up + sh.low, armRows(sh))
    for (let f = 0; f < DIGITS; f++) quads(v0 + armV + f * digV, sh.fring, 0, f === DIGITS - 1 ? F_ROWS : FRONT_ROW)
    const mid = idx.length
    for (let f = 0; f < DIGITS - 1; f++) quads(v0 + armV + f * digV, sh.fring, FRONT_ROW, F_ROWS)
    ranges.push({ back: [at, mid - at], hand: [wrist, mid - wrist], front: [mid, idx.length - mid] })
  }
  return { index: new Uint32Array(idx), ranges }
}

/** The page's grip boxes: [x, top, width, height] per letter. */
type Boxes = { title: number[][]; g: number[][] }

/**
 * Where leg L's wrist goes at rest, on the page: [x, y, depth]. Letters come from the live
 * layout, so a custom title is still gripped; the drop is wherever it has run to.
 */
function gripAt(L: Leg, boxes: Boxes, drop: Pt): V3 {
  const [fx, fy, z] = L.to
  if (L.ref === "page") return [fx, fy, z]
  if (L.ref === "drop") return [drop[0] + fx, drop[1] + fy, z]
  const B = L.ref === "title" ? boxes.title : boxes.g
  if (!B.length) return [SCENE_W / 2, SCENE_H / 2, z]
  const at = (k: number) => B[Math.max(0, Math.min(B.length - 1, k))]
  const a = at(L.k ? L.k[0] : 0)
  const b = at(L.k ? L.k[1] : 0)
  return [lerp(a[0], b[0] + b[2], fx), a[1] + a[3] * fy, z]
}

/**
 * Poses leg L (the i-th on its page) on the spine for this frame. At rest (`rest` 1) the wrist
 * sits on `goal`, a page point [x, y, depth]; travelling, the whole leg keeps its rest shape
 * turned with the body where it grows, and swings in a walk as the body slides along.
 */
function poseLeg(P: Q[], L: Leg, i: number, sc: Scene, tr: Track, a: number, rest: number, D: number, goal: V3, curl: number, out: LegPose) {
  const n = P.length - 1
  const zoom = sc.scale ?? 1
  const q = P[Math.max(1, Math.min(n, Math.round(L.u * n)))]
  const tl = Math.hypot(q.tx, q.ty) || 1
  const tx = q.tx / tl
  const ty = q.ty / tl
  const root: V3 = [q.x + ty * L.at[0] * q.r, q.y - tx * L.at[0] * q.r, q.z + L.at[1] * q.r]
  // the same place on the body at rest, and how far the body has turned there since
  const [x0, y0, t0x, t0y, z0] = trackAt(tr, tr.restArc + DRIFT * 0.5 - L.u * tr.body)
  const k0 = (D - z0) / D
  const r0 = bodyRadius(L.u) * R_BODY * zoom
  const root0: V3 = [SCENE_W / 2 + (x0 - SCENE_W / 2) * k0 + t0y * L.at[0] * r0, SCENE_H / 2 + (y0 - SCENE_H / 2) * k0 - t0x * L.at[0] * r0, z0 + L.at[1] * r0]
  const c = t0x * tx + t0y * ty
  const s = t0x * ty - t0y * tx
  const rot = (v: number[]): V3 => [v[0] * c - v[1] * s, v[0] * s + v[1] * c, v[2]]
  const gk = (D - goal[2]) / D
  const G: V3 = [SCENE_W / 2 + (goal[0] - SCENE_W / 2) * gk, SCENE_H / 2 + (goal[1] - SCENE_H / 2) * gk, goal[2]]
  const upper = L.len[0] * R_BODY * zoom
  const lower = L.len[1] * R_BODY * zoom
  let target = G
  if (rest < 1) {
    const reach = upper + lower
    // near its rest heading the leg keeps its rest shape turned with the body; turned further
    // it would point anywhere (up out of a climbing neck), so it hangs down and forward instead
    const off = add3(mul3(rot(sub3(G, root0)), smooth(0.3, 0.9, c)), mul3([0, 0.53, 0.23], reach * (1 - smooth(0.3, 0.9, c))))
    // the walk: forward and back along the body, lifting toward it on the way forward
    const ph = (a / 640) * Math.PI * 2 + i * Math.PI
    const lift = Math.max(0, Math.cos(ph)) * 0.2 * reach
    const ol = Math.hypot(off[0], off[1], off[2]) || 1
    const walk = add3(mul3([tx, ty, 0], Math.sin(ph) * 0.25 * reach), mul3(off, -lift / ol))
    target = add3(mul3(G, rest), mul3(add3(add3(root, off), walk), 1 - rest))
  }
  const elbow = ik2(root, target, upper, lower, rot(L.pole))
  const wrist = add3(elbow, mul3(norm3(sub3(target, elbow)), lower))
  // travelling, the hand hangs more along the forearm
  const fore = norm3(sub3(wrist, elbow))
  const F = norm3(add3(mul3(norm3(rot(L.dir)), 0.4 + 0.6 * rest), mul3(fore, 0.6 * (1 - rest))))
  const back = rot(L.back)
  const K = norm3(sub3(back, mul3(F, dot3(back, F))))
  out.root = root
  out.elbow = elbow
  out.wrist = wrist
  out.F = F
  out.K = K
  out.S = cross3(F, K)
  out.curl = lerp(0.45, curl, rest)
  out.spread = L.spread
  out.size = 230 * zoom * (L.hand ?? 1)
  out.girth = 56 * zoom * (L.thick ?? 1)
  out.rootR = q.r
  out.front = !!L.front
}

// ---- page two's eye: a panel of folded skin with two slits in it, built once ------------------

/** The eye panel in scene units: its centre and half size. */
const EYE = { x: 800, y: 500, hw: 335, hh: 221 }
/** The slits, [x0, y0, x1, y1, half width, bow]: leaves rising to the right, bowed into crescents, the upper one smaller. */
const SLITS = [
  [654, 474, 824, 380, 23, 5],
  [686, 610, 940, 474, 32, 12],
]

/**
 * The panel's skin at (x, y): its height (+ toward the viewer) and how deep in a crease it
 * is (below 0). Folds sweep up to the right; round the slits they settle into sockets
 * ringed by puffy lids, the lower lid the heavier.
 */
function eyeSkin(x: number, y: number): [number, number] {
  const dx = x - EYE.x
  const dy = y - EYE.y
  const s = dx * 0.883 - dy * 0.469
  const w = dx * 0.469 + dy * 0.883 + 34 * Math.sin(s / 190) + 10 * Math.sin(s / 71 + 1.3)
  // broad round folds, sharp creases between them, of uneven depth
  const fold = Math.sqrt(Math.abs(Math.sin((Math.PI * w) / 104)))
  const amp = 0.35 + 0.65 * vnoise(s / 150 + 3, w / 180, 1e6, 1e6)
  let h = 20 * amp * fold + (vnoise(x / 70, y / 70, 1e6, 1e6) - 0.5) * 10
  // darker toward the panel's edges, most of all along the top
  let crease = (fold - 0.62) * amp - 0.3 - 0.45 * smooth(0.6, 1.05, Math.max(Math.abs(dx) / EYE.hw, Math.abs(dy) / EYE.hh)) - 0.35 * smooth(-0.3, -1, dy / EYE.hh)
  for (const [x0, y0, x1, y1, hw, bow] of SLITS) {
    const L = Math.hypot(x1 - x0, y1 - y0)
    const ux = (x1 - x0) / L
    const uy = (y1 - y0) / L
    const px = x - (x0 + x1) / 2
    const py = y - (y0 + y1) / 2
    const u = (px * ux + py * uy) / (L / 2)
    // across the slit, from its bowed centre line: + is the lower lid's side
    const v = py * ux - px * uy - bow * Math.max(0, 1 - u * u)
    const half = hw * Math.pow(Math.max(0, 1 - u * u), 0.7)
    const win = smooth(1.5, 0.92, Math.abs(u))
    const calm = smooth(half + 90, half + 14, Math.abs(v)) * win
    const lid = v > 0 ? 1.3 : 1
    h = h * (1 - 0.8 * calm) - 26 * smooth(half + 24, half - 2, Math.abs(v)) * win
    h += 20 * lid * gauss(Math.abs(v), half + 11 * lid, 12 * lid) * win
    crease = crease * (1 - calm) - 1.6 * gauss(Math.abs(v), half + 1, 6) * win + 0.3 * calm
  }
  return [h, crease]
}

/** The panel (skin) and the two slits (index ranges [first, count]), in scene space at z 0. */
function buildEye(fine: boolean) {
  const m: HeadMesh = { v: [], w: [], i: [] }
  const cols = fine ? 128 : 64
  const rows = fine ? 84 : 42
  const G: V3[] = []
  const C: V3[] = []
  const B: number[] = []
  const U: number[][] = []
  for (let j = 0; j < rows; j++) {
    const y = EYE.y - EYE.hh - 6 + ((2 * EYE.hh + 12) * j) / (rows - 1)
    C.push([EYE.x, y, -1e4])
    for (let k = 0; k < cols; k++) {
      const x = EYE.x - EYE.hw - 6 + ((2 * EYE.hw + 12) * k) / (cols - 1)
      const [h, cr] = eyeSkin(x, y)
      G.push([x, y, h])
      B.push(cr)
      U.push([((x - EYE.x) * 0.883 - (y - EYE.y) * 0.469) / 190, ((x - EYE.x) * 0.469 + (y - EYE.y) * 0.883) / 230])
    }
  }
  grid(m, G, rows, cols, C, false, (j, k) => U[j * cols + k], (j, k) => B[j * cols + k])
  // the skin's streaks run along the folds
  for (let o = 0; o < m.v.length; o += STRIDE) {
    m.v[o + 6] = 0.883
    m.v[o + 7] = -0.469
    m.v[o + 8] = 0
  }
  const panel = [0, m.i.length]
  for (const [x0, y0, x1, y1, hw, bow] of SLITS) {
    const n = fine ? 28 : 16
    const across = fine ? 11 : 7
    const L = Math.hypot(x1 - x0, y1 - y0)
    const ux = (x1 - x0) / L
    const uy = (y1 - y0) / L
    const S: V3[] = []
    const SC: V3[] = []
    for (let j = 0; j < n; j++) {
      const t = j / (n - 1)
      const u = 2 * t - 1
      const half = hw * Math.pow(Math.max(0, 1 - u * u), 0.7)
      const cx = (x0 + x1) / 2 + (u * L * ux) / 2 - uy * bow * (1 - u * u)
      const cy = (y0 + y1) / 2 + (u * L * uy) / 2 + ux * bow * (1 - u * u)
      SC.push([cx, cy, -1e4])
      for (let k = 0; k < across; k++) {
        const v = (2 * k) / (across - 1) - 1
        const x = cx - uy * v * half
        const y = cy + ux * v * half
        // a wet lens, bulging a little out of its socket
        S.push([x, y, eyeSkin(x, y)[0] + 3 + 5 * (1 - v * v) * Math.sin(Math.PI * t)])
      }
    }
    grid(m, S, n, across, SC, false, (j, k) => [j / (n - 1), k / (across - 1)], () => 0)
  }
  return { verts: new Float32Array(m.v), index: new Uint32Array(m.i), panel, slits: [panel[1], m.i.length - panel[1]] }
}

// ---- shaders: plain strings, so no interpolation can reach them --------------------------

/**
 * Perspective with the eye at (800, 500, uD), looking down -z. The z = 0 plane maps
 * 1:1 onto the svg viewBox (uView: its centre and half size), nearer parts grow.
 * A head part moves by uModel in head space (the jaw's hinge, the tongue's flick); aW
 * pulls a vertex toward uJaw instead, so the mouth, the lip folds and the spit stretch
 * across the open jaws. uStretch then reshapes the head per page (none at the neck's
 * ring) and uHead places it. The body sets them all to identity; aW is off, so reads 0.
 */
const VS = [
  "#version 300 es",
  "layout(location=0) in vec3 aPos;",
  "layout(location=1) in vec3 aN;",
  "layout(location=2) in vec3 aT;",
  "layout(location=3) in vec2 aUV;",
  "layout(location=4) in float aBump;",
  "layout(location=5) in float aW;",
  "uniform mat4 uModel, uJaw, uHead;",
  "uniform vec3 uStretch;",
  "uniform vec4 uView;",
  "uniform float uD;",
  "out vec3 vPos; out vec3 vN; out vec3 vT; out vec2 vUV; out float vBump;",
  "void main() {",
  "  vec3 q = mix(uModel * vec4(aPos, 1.), uJaw * vec4(aPos, 1.), aW).xyz;",
  "  vec3 st = mix(vec3(1.), uStretch, smoothstep(0., .8, q.x));",
  "  vec4 p = uHead * vec4(q * st, 1.);",
  "  vPos = p.xyz;",
  "  vN = mat3(uHead) * (mix(mat3(uModel) * aN, mat3(uJaw) * aN, aW) / st);",
  "  vT = mat3(uHead) * (mix(mat3(uModel) * aT, mat3(uJaw) * aT, aW) * st);",
  "  vUV = aUV; vBump = aBump;",
  "  float w = uD - p.z, nr = uD - 2000., fr = uD + 2000., b = 2. * nr * fr / (nr - fr), a = 1. - b / fr;",
  "  gl_Position = vec4((p.x - uView.x) * uD / uView.z, -(p.y - uView.y) * uD / uView.w, a * w + b, w);",
  "}",
].join("\n")

/**
 * Wet dark clay, in display (sRGB) values so the ramp stops are the colours sampled
 * off the reference. Broken glints, never a stripe; the page bounces back into the
 * shadow side; a thin near-black contour.
 */
const FS = [
  "#version 300 es",
  "precision highp float;",
  "in vec3 vPos; in vec3 vN; in vec3 vT; in vec2 vUV; in float vBump;",
  "uniform sampler2D uSkin;",
  "uniform vec3 uCam, uL, uBg, uAlb, uEye, uMouth;",
  // uMat: 0 skin, 1 eye slit, 2 dark pit, 3 mouth, 4 tongue, 5 spit, 6 carved skin (grooves shade), 7 page two's molten slit
  "uniform float uKey, uFade, uDust, uMat, uBlink, uGlint;",
  "out vec4 o;",
  // #060503 -> #14110f -> #2d2722 (median) -> #3c382d (lit) -> #4a453c (peak)
  "vec3 ramp(float d) {",
  "  vec3 c = mix(vec3(.024, .02, .012), vec3(.08, .068, .058), smoothstep(0., .3, d));",
  "  c = mix(c, vec3(.176, .153, .133), smoothstep(.25, .62, d));",
  "  c = mix(c, vec3(.235, .219, .176), smoothstep(.62, .92, d));",
  "  return mix(c, vec3(.29, .27, .235), smoothstep(.92, 1., d));",
  "}",
  "void main() {",
  "  vec3 N0 = normalize(vN), V = normalize(uCam - vPos);",
  // no MSAA in software rendering: fade the silhouette over its last pixel instead
  "  float e = dot(N0, V), cov = uFade > .5 ? smoothstep(0., fwidth(e) * 1.25, e) : 1.;",
  // page two's slits: molten, dark red under the upper lid to orange and gold on the lower lip,
  // a pale wet line along the upper inside edge that slides after the pointer (uGlint).
  // The lids close in from the edges (uBlink: 0 open .. 1 shut), the upper one further.
  // only in the eye's own program: software rendering pays for every branch a shader has, taken or not
  "#ifdef EYE",
  "  if (uMat > 6.5) {",
  "    float c0 = uBlink * .74, c1 = 1. - uBlink * .26, q = clamp((vUV.y - c0) / max(c1 - c0, .001), 0., 1.);",
  "    float inside = smoothstep(c0, c0 + .06, vUV.y) * (1. - smoothstep(c1 - .06, c1, vUV.y));",
  "    vec3 c = mix(uEye * .5, uEye * .8 + vec3(0., .04, .03), smoothstep(.05, .5, q));",
  "    c = mix(c, vec3(.99, .52, .24), smoothstep(.6, .84, q));",
  "    c = mix(c, vec3(.96, .68, .2), smoothstep(.86, .97, q));",
  "    float hl = exp(-pow((q - .2 - .03 * sin(vUV.x * 19.)) / .03, 2.)) * (.25 + .75 * exp(-pow((vUV.x - uGlint) / .2, 2.)));",
  "    c = mix(c, vec3(1., .71, .56), hl * .7);",
  "    c += vec3(1., .86, .76) * pow(max(dot(N0, normalize(uL + V)), 0.), 80.) * .35;",
  // dark rims at the lids and the leaf's points
  "    c *= mix(.25, 1., smoothstep(0., .14, min(q, 1. - q))) * mix(.2, 1., smoothstep(0., .1, min(vUV.x, 1. - vUV.x)));",
  "    o = vec4(mix(vec3(.03, .022, .016), c, inside), 1.);",
  "    return;",
  "  }",
  "#endif",
  "  if (uMat > .5 && uMat < 5.5) {",
  "    vec3 c;",
  "    if (uMat < 1.5) {",
  // the eye: red seen through a slit in the skin, dark at the lids, closing from them as it blinks. Unlit.
  "      float open = min(vUV.y, 1. - vUV.y) * 2. - uBlink;",
  "      o = vec4(mix(vec3(.02, .012, .01), uEye * vec3(.88, .8, .95) * mix(.7, 1., smoothstep(.3, .9, open)), smoothstep(.06, .32, open)), 1.);",
  "      return;",
  "    }",
  "    if (uMat < 2.5) c = vec3(.03, .024, .018);",
  "    else {",
  // wet parts: one continuous gloss, no flecks. They draw two-sided, so turn the normal to the eye
  "      if (e < 0.) { N0 = -N0; cov = uFade > .5 ? smoothstep(0., fwidth(e) * 1.25, -e) : 1.; }",
  "      c = uMat < 3.5 ? uMouth : uMat < 4.5 ? uEye * vec3(.7, .67, .65) : mix(uEye, vec3(1.), .47);",
  "      c *= .5 + .5 * clamp(dot(N0, uL) * .5 + .5, 0., 1.);",
  // the mouth darkens down toward the throat
  "      if (uMat < 3.5) c *= mix(.35, 1., smoothstep(0., .8, vUV.x));",
  "      c += vec3(1., .92, .9) * pow(max(dot(N0, normalize(uL + V)), 0.), 48.) * .7;",
  "    }",
  "    o = vec4(c * uKey * cov, cov);",
  "    return;",
  "  }",
  // RG slope, B cavity, A fleck mask; a second, stretched lookup breaks the repeat
  "  vec4 a = texture(uSkin, vUV);",
  // software rendering reads the skin once: the second, stretched lookup is faked from the first
  "#ifdef SOFT",
  "  vec4 b = vec4(.5 + (a.gr - .5) * .5, a.b, a.b);",
  "#else",
  "  vec4 b = texture(uSkin, vUV * vec2(2.37, 1.) + vec2(.31, .5));",
  "#endif",
  "  vec2 g = (a.rg - .5) * 2. + (b.rg - .5);",
  "  vec3 T = normalize(vT - N0 * dot(vT, N0)), A = cross(N0, T);",
  "  vec3 N = normalize(N0 - .3 * (g.x * T + g.y * A));",
  "  float d = clamp(dot(N, uL) * .7 + .22, 0., 1.);",
  "  vec3 col = ramp(d) * uAlb * (1. - .25 * (a.b - .3));",
  // the head's carved grooves: dark, with a little of the page's red down in them
  "  if (uMat > 5.5) { float gr = smoothstep(.1, -.9, vBump); col *= 1. - .55 * gr; col = mix(col, uBg * .22, gr * .45); }",
  "  float nv = clamp(dot(N0, V), 0., 1.), shade = 1. - smoothstep(-.3, .45, dot(N0, uL));",
  "  col = mix(col, uBg * .3, clamp((pow(1. - nv, 2.5) * .9 + a.b * .4) * shade, 0., .7));",
  "  col = mix(col, vec3(.024, .02, 0.), (1. - smoothstep(0., .1 + fwidth(nv) * 1.5, nv)) * (.25 + .75 * shade));",
  // a sharp highlight on the bumped normal, masked by sparse flecks and the lumps' crowns
  "  float fl = smoothstep(.3, .6, a.a);",
  "  float spec = pow(max(dot(N, normalize(uL + V)), 0.), 30.) * fl * (.25 + .75 * smoothstep(-.4, .8, vBump)) * 3. * uKey;",
  "  col = mix(col, mix(vec3(.5, .47, .44), vec3(1., .99, .96), smoothstep(.5, 1.2, spec)), clamp(spec, 0., 1.));",
  "  col = mix(col, vec3(.47, .45, .41), smoothstep(.5, .9, b.a) * (1. - fl) * uDust * (.3 + .7 * d));",
  "  o = vec4(col * uKey * cov, cov);",
  "}",
].join("\n")

/** The shader program; `eye` adds page two's molten slits. */
function compile(gl: WebGL2RenderingContext, soft: boolean, eye = false) {
  const prog = gl.createProgram()
  if (!prog) return null
  for (const [type, src] of [
    [gl.VERTEX_SHADER, VS],
    [gl.FRAGMENT_SHADER, FS.replace("\n", "\n" + (soft ? "#define SOFT\n" : "") + (eye ? "#define EYE\n" : ""))],
  ] as const) {
    const sh = gl.createShader(type)
    if (!sh) return null
    gl.shaderSource(sh, src)
    gl.compileShader(sh)
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) console.error("dragon-type-specimen:", gl.getShaderInfoLog(sh))
    gl.attachShader(prog, sh)
    gl.deleteShader(sh)
  }
  gl.linkProgram(prog)
  if (gl.getProgramParameter(prog, gl.LINK_STATUS)) return prog
  console.error("dragon-type-specimen:", gl.getProgramInfoLog(prog))
  gl.deleteProgram(prog)
  return null
}

// ---- the renderer --------------------------------------------------------------------

/** Key light from above, a little front-left: scene axes are x right, y down, z toward the viewer. */
const LIGHT = [-0.2, -0.8, 0.6].map((v) => v / Math.hypot(-0.2, -0.8, 0.6))
/** Software renderers: SwiftShader (how 21st records its previews), llvmpipe, Microsoft's Basic Render. */
const SOFTWARE = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i
/** The skin shades as dragonColor over this. */
const DEFAULT_SKIN = [0x2b, 0x26, 0x21]

type DragonFrame = {
  /** size of the view rectangle, in scene units: the svg viewBox's */
  vw: number
  vh: number
  /** the live page colour and the skin tint, 0..1 */
  bg: number[]
  alb: number[]
  /** overall light: 1 on the red pages, lower on the dark one */
  key: number
  dust: number
  /** the page's scene scale */
  zoom: number
  /** the scene drawn (its index in SCENES), for its head's parts */
  scene: number
  /** the head this frame, or null to leave it off */
  head: HeadPose | null
  /** 0 eyes open .. 1 shut */
  blink: number
  /** the slits' colour and the mouth's, 0..1 */
  eye: number[]
  mouth: number[]
  /** this page's legs, posed */
  legs: LegPose[]
}

/** What every draw in a frame shares: the view, the page colour, the skin tint, the light. */
type PageLight = Pick<DragonFrame, "vw" | "vh" | "bg" | "alb" | "key" | "dust">

/** Page two's eye: how far the panel is revealed and the lids are shut (0..1), where the wet glint sits along the slits (0..1), and the slits' colour. */
type EyeFrame = PageLight & { reveal: number; shut: number; glint: number; eye: number[] }

/** A page's head unit, in scene units: the neck's radius where it enters the skull. */
const headUnit = (sc: Scene) => R_BODY * (sc.scale ?? 1) * (sc.head ?? 1)

const IDENTITY = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1])

type DragonGL = {
  /** spine samples to allocate with makeSpine */
  samples: number
  resize: (w: number, h: number, dpr: number) => void
  draw: (P: Q[], f: DragonFrame) => void
  drawEye: (f: EyeFrame) => void
  clear: () => void
  dispose: () => void
}

/**
 * A WebGL2 context on `canvas` set up to draw the skin: the shader, the baked skin texture,
 * a mesh maker, and `frame`, which sets the uniforms every draw in a frame shares (the
 * scene-space draws, the body and the legs, need nothing more).
 */
function skinGL(canvas: HTMLCanvasElement, soft: boolean, msaa: boolean) {
  // without MSAA (software, and the overlay) the shader fades the silhouette instead
  const gl = canvas.getContext("webgl2", { antialias: msaa, alpha: true, premultipliedAlpha: true, depth: true, stencil: false })
  if (!gl) return null
  // position, normal, tangent, uv, bump: the locations the vertex shader declares
  const layout = () => {
    for (const [loc, size, at] of [[0, 3, 0], [1, 3, 3], [2, 3, 6], [3, 2, 9], [4, 1, 11]]) {
      gl.enableVertexAttribArray(loc)
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, STRIDE * 4, at * 4)
    }
  }
  const meshes: { vao: WebGLVertexArrayObject | null; vbo: WebGLBuffer | null; ibo: WebGLBuffer | null }[] = []
  /** A vertex array over one vertex buffer (dynamic, or static holding `data`) and a static index buffer. Leaves it bound. */
  const mesh = (data: Float32Array, idx: Uint32Array, dynamic: boolean) => {
    const vao = gl.createVertexArray()
    gl.bindVertexArray(vao)
    const vbo = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
    if (dynamic) gl.bufferData(gl.ARRAY_BUFFER, data.byteLength, gl.DYNAMIC_DRAW)
    else gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
    layout()
    const ibo = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW)
    const m = { vao, vbo, ibo }
    meshes.push(m)
    return m
  }
  const tex = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, tex)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, SKIN, SKIN, 0, gl.RGBA, gl.UNSIGNED_BYTE, skinTexture())
  gl.generateMipmap(gl.TEXTURE_2D)
  // software: one mip level a lookup, not two (trilinear doubles the texture cost there)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, soft ? gl.LINEAR_MIPMAP_NEAREST : gl.LINEAR_MIPMAP_LINEAR)

  /** A program and its uniforms, set up once: the skin's, and the eye's when page two first needs it. */
  const setup = (eye: boolean) => {
    const prog = compile(gl, soft, eye)
    if (!prog) return null
    const u = (name: string) => gl.getUniformLocation(prog, name)
    const U = {
      view: u("uView"), d: u("uD"), cam: u("uCam"), bg: u("uBg"), alb: u("uAlb"), key: u("uKey"), dust: u("uDust"),
      model: u("uModel"), jaw: u("uJaw"), head: u("uHead"), stretch: u("uStretch"), mat: u("uMat"), blink: u("uBlink"), eye: u("uEye"), mouth: u("uMouth"), glint: u("uGlint"),
    }
    gl.useProgram(prog)
    gl.uniform3fv(u("uL"), LIGHT)
    gl.uniform1f(u("uFade"), msaa ? 0 : 1)
    gl.uniform1i(u("uSkin"), 0)
    return { prog, U }
  }
  const main = setup(false)
  if (!main) return null
  let eyeProg: ReturnType<typeof setup> | undefined
  let cur = main
  gl.enable(gl.DEPTH_TEST)
  gl.enable(gl.CULL_FACE)
  gl.enable(gl.BLEND)
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
  gl.clearColor(0, 0, 0, 0)

  return {
    gl,
    /** the uniforms of the program the last frame() picked */
    get U() {
      return cur.U
    },
    mesh,
    /** Starts a frame: clears, picks the program (the eye's, for page two) and sets the shared uniforms. False if that program will not build. */
    frame(f: PageLight, D: number, eye = false) {
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
      if (eye && eyeProg === undefined) eyeProg = setup(true)
      const next = eye ? eyeProg : main
      if (!next) return false
      cur = next
      const U = cur.U
      gl.useProgram(cur.prog)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, tex)
      gl.uniform4f(U.view, SCENE_W / 2, SCENE_H / 2, f.vw / 2, f.vh / 2)
      gl.uniform1f(U.d, D)
      gl.uniform3f(U.cam, SCENE_W / 2, SCENE_H / 2, D)
      gl.uniform3fv(U.bg, f.bg)
      gl.uniform3fv(U.alb, f.alb)
      gl.uniform1f(U.key, f.key)
      gl.uniform1f(U.dust, f.dust)
      gl.uniformMatrix4fv(U.model, false, IDENTITY)
      gl.uniformMatrix4fv(U.jaw, false, IDENTITY)
      gl.uniformMatrix4fv(U.head, false, IDENTITY)
      gl.uniform3fv(U.stretch, ONE3)
      gl.uniform1f(U.mat, 0)
      return true
    },
    /** draws an index range [first, count] of the bound mesh */
    range(r: number[]) {
      if (r[1]) gl.drawElements(gl.TRIANGLES, r[1], gl.UNSIGNED_INT, r[0] * 4)
    },
    dispose() {
      for (const m of meshes) {
        gl.deleteBuffer(m.vbo)
        gl.deleteBuffer(m.ibo)
        gl.deleteVertexArray(m.vao)
      }
      gl.deleteTexture(tex)
      gl.deleteProgram(main.prog)
      if (eyeProg) gl.deleteProgram(eyeProg.prog)
    },
  }
}

/**
 * The WebGL2 dragon on its own canvas, or null when WebGL2 is not there. `top` is a second
 * canvas above the type: the fingers and claws that grip letters are drawn there instead,
 * so they cross in front of the strokes while the palm stays under the letter.
 */
function createDragon(canvas: HTMLCanvasElement, top: HTMLCanvasElement): DragonGL | null {
  // probe on a throwaway canvas: a context, once made, is bound to its canvas for good
  const probe = document.createElement("canvas").getContext("webgl2", { failIfMajorPerformanceCaveat: true })
  const info = probe && probe.getExtension("WEBGL_debug_renderer_info")
  const soft = !probe || SOFTWARE.test(String(probe.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : probe.RENDERER)))
  probe?.getExtension("WEBGL_lose_context")?.loseContext()
  const A = skinGL(canvas, soft, !soft)
  if (!A) return null
  // without a second context the front parts just stay in the main pass, under the type
  // (no MSAA there: resolving a second full-size multisampled canvas every frame costs more than the fingers)
  const B = skinGL(top, soft, false)
  const gl = A.gl

  // software: fewer vertices everywhere
  const samples = soft ? 150 : 320
  const ring = soft ? 20 : 36
  const cols = ring + 1
  const rows = CAP + samples + 1
  const verts = new Float32Array(rows * cols * STRIDE)
  const index = new Uint32Array((rows - 1) * ring * 6)
  for (let j = 0, w = 0; j < rows - 1; j++)
    for (let k = 0; k < ring; k++) {
      const a = j * cols + k
      const b = a + cols
      index[w++] = a
      index[w++] = b
      index[w++] = a + 1
      index[w++] = a + 1
      index[w++] = b
      index[w++] = b + 1
    }
  const body = A.mesh(verts, index, true)

  // the legs: every limb in one dynamic buffer, the triangles built once
  const shape: LimbShape = soft ? { up: 7, low: 6, palm: 4, ring: 10, fring: 5 } : { up: 12, low: 11, palm: 7, ring: 18, fring: 8 }
  const perLimb = limbVerts(shape)
  const lverts = new Float32Array(MAX_LEGS * perLimb * STRIDE)
  const limbs = limbIndex(shape)
  const legs = A.mesh(lverts, limbs.index, true)
  const legsB = B && B.mesh(lverts, limbs.index, true)
  // claws taper to needles, never thinner than this (scene units): no MSAA in software, so thicker there
  const minR = soft ? 1.5 : 1.2

  // the head: every page's parts in one static mesh, plus each vertex's pull toward the jaw
  const head = buildHead(SCENES, SCENES.map(headUnit), !soft)
  const hm = A.mesh(head.verts, head.index, false)
  const hwbo = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, hwbo)
  gl.bufferData(gl.ARRAY_BUFFER, head.weights, gl.STATIC_DRAW)
  gl.enableVertexAttribArray(5)
  gl.vertexAttribPointer(5, 1, gl.FLOAT, false, 4, 0)
  // page two's eye panel
  const eye = buildEye(!soft)
  const em = A.mesh(eye.verts, eye.index, false)
  gl.bindVertexArray(null)
  B?.gl.bindVertexArray(null)

  let topShown = false
  const clearTop = () => {
    if (!B || !topShown) return
    B.gl.clear(B.gl.COLOR_BUFFER_BIT | B.gl.DEPTH_BUFFER_BIT)
    topShown = false
  }

  return {
    samples,
    resize(w, h, dpr) {
      // software: 1x at most and no more than 0.85 MP, as every covered pixel costs there (21st
      // records at 1280 x 960, which this draws at 0.83x). A GPU stops at 1.5x: with 4x MSAA
      // on, 2x only costs fill rate.
      const k = soft ? Math.min(dpr, Math.sqrt(8.5e5 / (w * h))) : Math.min(dpr, 1.5)
      for (const c of [canvas, top]) {
        c.width = Math.max(1, Math.round(w * k))
        c.height = Math.max(1, Math.round(h * k))
      }
      topShown = true
    },
    draw(P, f) {
      const D = camDist(f.vh)
      sweepBody(P, ring, f.zoom, verts)
      let fronts = false
      for (let l = 0; l < f.legs.length; l++) {
        fronts ||= f.legs[l].front
        sweepLimb(f.legs[l], shape, minR, lverts, l * perLimb)
      }
      const split = fronts && !!legsB
      const nl = f.legs.length * perLimb * STRIDE

      A.frame(f, D)
      gl.bindBuffer(gl.ARRAY_BUFFER, body.vbo)
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, verts)
      gl.bindVertexArray(body.vao)
      gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_INT, 0)
      if (nl) {
        gl.bindBuffer(gl.ARRAY_BUFFER, legs.vbo)
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, lverts, 0, nl)
        gl.bindVertexArray(legs.vao)
        for (let l = 0; l < f.legs.length; l++) {
          A.range(limbs.ranges[l].back)
          if (!split || !f.legs[l].front) A.range(limbs.ranges[l].front)
        }
      }
      const h = f.head
      if (h) {
        // the head is built once in head space and posed by its matrices
        const U = A.U
        gl.bindVertexArray(hm.vao)
        gl.uniformMatrix4fv(U.jaw, false, h.jaw)
        gl.uniformMatrix4fv(U.head, false, h.place)
        gl.uniform3fv(U.stretch, h.stretch)
        gl.uniform1f(U.blink, f.blink)
        gl.uniform3fv(U.eye, f.eye)
        gl.uniform3fv(U.mouth, f.mouth)
        for (const part of head.sets[f.scene]) {
          if (part.open && !h.open) continue
          gl.uniformMatrix4fv(U.model, false, part.space === JAW_SPACE ? h.jaw : part.space === TONGUE_SPACE ? h.tongue : IDENTITY)
          gl.uniform1f(U.mat, part.mat)
          // the mouth and the spit are seen from either side
          const both = part.mat === 3 || part.mat === 5
          if (both) gl.disable(gl.CULL_FACE)
          gl.drawElements(gl.TRIANGLES, part.n, gl.UNSIGNED_INT, part.at * 4)
          if (both) gl.enable(gl.CULL_FACE)
        }
      }
      gl.bindVertexArray(null)

      // above the type: the gripping fingers and claws, hidden where their own arm and palm
      // are nearer (drawn first into depth only). Nothing is read back between the canvases.
      if (split && B && legsB) {
        const g = B.gl
        B.frame(f, D)
        g.bindBuffer(g.ARRAY_BUFFER, legsB.vbo)
        g.bufferSubData(g.ARRAY_BUFFER, 0, lverts, 0, nl)
        g.bindVertexArray(legsB.vao)
        g.colorMask(false, false, false, false)
        for (let l = 0; l < f.legs.length; l++) if (f.legs[l].front) B.range(limbs.ranges[l].hand)
        g.colorMask(true, true, true, true)
        for (let l = 0; l < f.legs.length; l++) if (f.legs[l].front) B.range(limbs.ranges[l].front)
        g.bindVertexArray(null)
        topShown = true
      } else clearTop()
    },
    drawEye(f) {
      if (!A.frame(f, camDist(f.vh), true)) return
      // the panel opens from its middle: everything outside the open slot is cut away
      const kx = canvas.width / f.vw
      const ky = canvas.height / f.vh
      const hh = EYE.hh * f.reveal
      gl.enable(gl.SCISSOR_TEST)
      gl.scissor(
        Math.round((EYE.x - EYE.hw - SCENE_W / 2 + f.vw / 2) * kx),
        Math.round(canvas.height - (EYE.y + hh - SCENE_H / 2 + f.vh / 2) * ky),
        Math.round(2 * EYE.hw * kx),
        Math.max(0, Math.round(2 * hh * ky)),
      )
      gl.bindVertexArray(em.vao)
      gl.uniform1f(A.U.mat, 6)
      A.range(eye.panel)
      gl.uniform1f(A.U.mat, 7)
      gl.uniform1f(A.U.blink, f.shut)
      gl.uniform1f(A.U.glint, f.glint)
      gl.uniform3fv(A.U.eye, f.eye)
      A.range(eye.slits)
      gl.bindVertexArray(null)
      gl.disable(gl.SCISSOR_TEST)
      clearTop()
    },
    clear() {
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
      clearTop()
    },
    dispose() {
      gl.deleteBuffer(hwbo)
      A.dispose()
      B?.dispose()
    },
  }
}

/**
 * The tongue: [how far out, 0..1; its flicker, radians]. On the glyph page it darts back in
 * and out every few seconds; the curl just hangs and sways. Time 0 (reduced motion) holds it out.
 */
function tongueAt(kind: Scene["tongue"], time: number): number[] {
  if (kind !== "flick") return [1, Math.sin(time * 1.3) * 0.05]
  const t = time % 3.4
  const back = smooth(0, 0.1, t) * (1 - smooth(0.22, 0.4, t))
  return [1 - 0.6 * back, Math.sin(time * 38) * 0.14 * smooth(0.25, 0.35, t) * (1 - smooth(0.6, 1.1, t))]
}

// ---------------------------------------------------------------- the type (svg)

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
/** The cover title's place (centred on x, baseline y, fitted into width, cap height at most cap) and the weights page's G row. */
const COVER_TITLE = { x: 800, y: 652, width: 1030, cap: 205 }
const G_ROW = { x: 355, step: 243, base: 496, cap: 185 }
/** Where the liquid drop idles, under the arch, in reach of the dragon's hand. */
const DROP_HOME: Pt = [1085, 800]

/** The boxes the hands grip, [x, top, width, height]: the cover title's letters, and the G row. */
function gripBoxes(title: string, weight: number): Boxes {
  const cap = fitCap(title, weight, 0, COVER_TITLE.width, COVER_TITLE.cap)
  const lay = layoutWord(title, weight)
  const s = cap / 100
  const x0 = COVER_TITLE.x - (lay.width * s) / 2
  return {
    title: lay.glyphs.map((g) => [x0 + g.x * s, COVER_TITLE.y - cap, g.w * s, cap]),
    g: G_WEIGHTS.map((_, k) => [G_ROW.x + k * G_ROW.step, G_ROW.base - G_ROW.cap, (GLYPHS.G[0] * G_ROW.cap) / 100, G_ROW.cap]),
  }
}

/** The book's progress, the cover's reveal (0..1 over its first 1.8 s) and whether the scroll cue is up (1, from 1.5 s to 5 s after load; it fades by css). */
type Frame = { p: number; intro: number; hint: number }

export default function DragonTypeSpecimen({
  title = "DRAKON",
  subtitle = "TYPEFACE",
  studio = "STUDIO WYRM",
  year = "2026",
  specimenWord = "SNARL",
  background = "#de0902",
  night = "#000000",
  ink = "#fdc80f",
  dragonColor = "#2b2621",
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
  const glRef = React.useRef<HTMLCanvasElement | null>(null)
  const frontRef = React.useRef<HTMLCanvasElement | null>(null)
  const blobRefs = React.useRef<(SVGCircleElement | null)[]>([])
  const dropRef = React.useRef<SVGGElement | null>(null)
  const reduced = usePrefersReducedMotion()
  const id = "dts" + React.useId().replace(/[^a-zA-Z0-9]/g, "")
  const controlled = progress !== undefined
  const [f, setF] = React.useState<Frame>({ p: progress ?? 0, intro: 0, hint: 0 })
  const [view, setView] = React.useState({ w: 1600, h: 1000 })
  const [style, setStyle] = React.useState<SpecimenStyle>(defaultStyle)
  const [glyph, setGlyph] = React.useState("")
  const [hoverG, setHoverG] = React.useState(-1)

  const tracks = React.useMemo(() => SCENES.map((s) => makeTrack(s)), [])
  // the shader's colours, 0..255: the page, the dark page, and the skin tint over the default
  const rgb = React.useMemo(() => {
    const skin = parseHex(dragonColor) ?? DEFAULT_SKIN
    return {
      bg: parseHex(background) ?? [222, 9, 2],
      night: parseHex(night) ?? [0, 0, 0],
      alb: skin.map((v, k) => v / DEFAULT_SKIN[k]),
      eye: parseHex(eyeColor) ?? [255, 42, 26],
    }
  }, [background, night, dragonColor, eyeColor])

  const weight = styleSpec(style).weight
  const boxes = React.useMemo(() => gripBoxes(title, weight), [title, weight])
  const cfg = React.useRef({ progress, controlled, reduced, rgb, boxes })
  cfg.current = { progress, controlled, reduced, rgb, boxes }
  const pointer = React.useRef<{ x: number; y: number } | null>(null)
  const snapAt = React.useRef(-1e9)

  React.useEffect(() => {
    const root = rootRef.current
    const stage = stageRef.current
    const glc = glRef.current
    const over = frontRef.current
    if (!root || !stage || !glc || !over) return
    const dragon = createDragon(glc, over)
    const P = makeSpine(dragon ? dragon.samples : 0)
    const legs: LegPose[] = []
    let shown = true
    let opacity = 1
    let raf = 0
    let visible = true
    let p = cfg.current.progress ?? 0
    let intro = 0
    let last: Frame | null = null
    let look = 0
    let glint = 0.5
    let lids = 0
    let blob: Pt = [DROP_HOME[0], DROP_HOME[1]]
    let nextBlink = performance.now() + 2200
    const pose: HeadPose = { place: new Float32Array(16), jaw: new Float32Array(16), tongue: new Float32Array(16), stretch: [1, 1, 1], open: false }
    const t0 = performance.now()
    const size = { w: 1, h: 1, dpr: 1 }

    const measure = () => {
      const r = stage.getBoundingClientRect()
      size.w = Math.max(1, r.width)
      size.h = Math.max(1, r.height)
      size.dpr = Math.min(2, window.devicePixelRatio || 1)
      dragon?.resize(size.w, size.h, size.dpr)
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
      const hint = !c.reduced && now - t0 > 1500 && now - t0 < 5000 ? 1 : 0
      if (!last || Math.abs(p - last.p) > 1e-5 || intro !== last.intro || hint !== last.hint) {
        last = { p, intro, hint }
        setF(last)
      }

      const time = c.reduced ? 0 : now / 1000
      const scale = Math.min(size.w / 1300, size.h / SCENE_H)
      const vx = SCENE_W / 2 - size.w / 2 / scale
      const vy = SCENE_H / 2 - size.h / 2 / scale
      const { i, t } = chapterAt(p)
      // the live page colour (the dark page fades it to night), and the slits' red, deeper on the dark page
      const k4 = chapterVis(4, localT(p, 4))
      const page = [0, 1, 2].map((k) => lerp(c.rgb.bg[k], c.rgb.night[k], k4) / 255)
      const eye = c.rgb.eye.map((v) => (v / 255) * lerp(1, 0.78, k4))

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

      // the liquid drop on the last page follows the pointer below the arch (not under reduced motion)
      const lt = localT(p, LAST)
      if (lt > -0.05) {
        const want: Pt =
          ptr && !c.reduced && ptr[1] > 560 && ptr[0] > 600
            ? [Math.max(760, Math.min(1400, ptr[0])), Math.max(700, Math.min(880, ptr[1]))]
            : [DROP_HOME[0] + Math.sin(time * 0.6) * 24, DROP_HOME[1] + Math.cos(time * 0.8) * 10]
        blob = [lerp(blob[0], want[0], c.reduced ? 1 : 0.08), lerp(blob[1], want[1], c.reduced ? 1 : 0.08)]
        dropRef.current?.setAttribute("transform", "translate(" + (blob[0] - DROP_HOME[0]).toFixed(1) + " " + (blob[1] - DROP_HOME[1]).toFixed(1) + ")")
        blobRefs.current.forEach((el, k) => {
          if (!el) return
          // each lobe wobbles on its own, so the drop never sits still as one shape
          const a = time * (0.9 + k * 0.23) + k * 1.9
          el.setAttribute("cx", (DROP_HOME[0] + DROP_LOBES[k][0] + Math.cos(a) * 5).toFixed(1))
          el.setAttribute("cy", (DROP_HOME[1] + DROP_LOBES[k][1] + Math.sin(a * 1.3) * 4).toFixed(1))
        })
      }

      // page two: the eye panel opens in its slot; the pointer slides the wet glint along the
      // slits and, close in, makes the lids narrow
      let drew = false
      if (dragon && i === 1) {
        const reveal = smooth(0.03, 0.28, t) * (1 - smooth(0.8, 0.97, t))
        if (reveal > 0.001) {
          const open = smooth(0.22, 0.5, t) * (1 - smooth(0.68, 0.84, t))
          const focus = c.reduced ? null : ptr
          const wantG = focus ? clamp01((focus[0] - 650) / 300) : 0.5 + 0.3 * Math.sin(time * 0.5)
          const near = focus ? 1 - smooth(120, 420, Math.hypot(focus[0] - EYE.x, focus[1] - EYE.y)) : 0
          glint = c.reduced ? 0.5 : lerp(glint, wantG, 0.1)
          lids = c.reduced ? 0 : lerp(lids, near, 0.1)
          if (opacity !== 1) glc!.style.opacity = over!.style.opacity = String((opacity = 1))
          dragon.drawEye({ vw: size.w / scale, vh: size.h / scale, bg: page, alb: c.rgb.alb, key: 0.9, dust: 0, reveal, shut: 1 - open * (1 - blink) * (1 - 0.4 * lids), glint, eye })
          drew = shown = true
        }
      }

      // the dragon, on its own WebGL2 canvas
      const si = SCENES.findIndex((s) => s.chapter === i)
      if (dragon && si >= 0) {
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
          // the head turns toward the pointer (or the drop, on the last page) while it rests;
          // reduced motion holds it still and ignores the pointer
          const most = scene.look ?? 0.2
          const focus: Pt | null = c.reduced ? null : i === LAST ? blob : ptr
          let want = Math.sin(time * 0.7) * most * 0.5
          if (focus) {
            const [hx, hy, htx, hty] = trackAt(tr, a)
            const ang = Math.atan2(focus[1] - hy, focus[0] - hx) - Math.atan2(hty, htx)
            want = Math.atan2(Math.sin(ang), Math.cos(ang)) * 0.7
          }
          look = c.reduced ? 0 : lerp(look, Math.max(-most, Math.min(most, want)) * restness, 0.08)
          const D = camDist(size.h / scale)
          bodyFrame(P, tr, a, time, c.reduced, scene, look, D)
          // a click snaps the jaws open as it lunges
          const settled = smooth(0, 0.8, restness)
          poseHead(P, scene, headUnit(scene), settled, look, scene.jaw + snap * 0.6 * restness, tongueAt(scene.tongue, time), pose)
          // the legs: at rest the hands hold their letters; the last page's reaches for the drop,
          // fingers closing as it comes within reach
          const sl = scene.legs ?? []
          legs.length = sl.length
          for (let l = 0; l < sl.length; l++) {
            const L = sl[l]
            const goal = gripAt(L, c.boxes, blob)
            let curl = L.curl
            if (L.ref === "drop") {
              const q = P[Math.round(L.u * (P.length - 1))]
              const gk = (D - goal[2]) / D
              const far = Math.hypot(SCENE_W / 2 + (goal[0] - SCENE_W / 2) * gk - q.x, SCENE_H / 2 + (goal[1] - SCENE_H / 2) * gk - q.y, goal[2] - q.z)
              curl *= 1 - 0.6 * smooth(0.8, 1.05, far / ((L.len[0] + L.len[1]) * R_BODY * (scene.scale ?? 1)))
            }
            legs[l] ??= {} as LegPose
            poseLeg(P, L, l, scene, tr, a, settled, D, goal, curl, legs[l])
          }
          // reduced motion cross-fades the pages: fading the canvas keeps the depth-tested mesh solid
          if (alpha !== opacity) glc!.style.opacity = over!.style.opacity = String((opacity = alpha))
          const alb = c.rgb.alb
          dragon.draw(P, {
            vw: size.w / scale,
            vh: size.h / scale,
            bg: page,
            alb,
            key: i === 4 ? 0.55 : 1,
            dust: scene.dust ?? 0.3,
            zoom: scene.scale ?? 1,
            scene: si,
            head: pose,
            blink,
            eye,
            mouth: page.map((v, k) => lerp(v, eye[k], 0.35) * 0.62),
            legs,
          })
          drew = shown = true
        }
      }
      if (dragon && shown && !drew) {
        dragon.clear()
        shown = false
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      ro.disconnect()
      dragon?.dispose()
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
  const outline = st.outline ? outlineId : undefined
  const titleCap = fitCap(title, st.weight, 0, COVER_TITLE.width, COVER_TITLE.cap)
  const titleW = (layoutWord(title, st.weight).width * titleCap) / 100
  const specCap = fitCap(specimenWord, WEIGHTS.regular, 42, 585, 105)
  const letters = title.split("")
  const studioW = (layoutWord(studio, WEIGHTS.bold, 6).width * 15) / 100
  // the glyph page's grids: 12 columns for the capitals, 15 for the smaller alternates
  const G12 = (c: number) => 365 + (c + 0.5) * (873 / 12)
  const G15 = (c: number) => 365 + (c + 0.5) * (873 / 15)
  const CAPS: [string, number, number][] = [
    ["ABCDEFGHIJKL", 0, 311], ["MNOP", 0, 388], ["QRSTU", 7, 388], ["VW", 0, 467], ["XYZ", 9, 467],
  ]
  const ALTROWS: [string, number, number][] = [
    ["ABCD", 0, 600], ["EFGHI", 10, 600], ["JKL", 0, 655], ["MNOPQR", 9, 655], ["ST", 0, 705], ["UVWXYZ", 9, 705],
  ]
  const reach = smooth(0.2, 0.6, localT(f.p, LAST))

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
        {/* behind the dragon: a faint grain and vignette, and the last page's drop, which the claw rests on */}
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
              <stop offset="1" stopColor="#000" stopOpacity={0.08} />
            </radialGradient>
            <filter id={id + "-goo"} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="b" />
              <feColorMatrix in="b" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 26 -11" />
            </filter>
          </defs>
          <rect x={-2000} y={-2000} width={5600} height={5000} filter={"url(#" + id + "-grain)"} opacity={0.1 * (1 - vis[4])} />
          <rect x={SCENE_W / 2 - vw / 2} y={SCENE_H / 2 - vh / 2} width={vw} height={vh} fill={"url(#" + id + "-vig)"} opacity={1 - vis[4]} />
          {vis[6] > 0.001 ? (
            <g opacity={vis[6]} ref={dropRef}>
              <g filter={"url(#" + id + "-goo)"} fill={ink}>
                {DROP_LOBES.map(([dx, dy, r], k) => (
                  <circle key={k} ref={(el) => void (blobRefs.current[k] = el)} cx={DROP_HOME[0] + dx} cy={DROP_HOME[1] + dy} r={r * rev[6]} />
                ))}
              </g>
              <circle cx={DROP_HOME[0] + 35} cy={DROP_HOME[1] + 30} r={27 * rev[6]} fill={bg} />
            </g>
          ) : null}
        </svg>

        {/* the dragon, and page two's eye (webgl2) */}
        <canvas
          ref={glRef}
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
          </defs>

          {/* 01 cover */}
          {vis[0] > 0.001 ? (
            <g opacity={vis[0]}>
              <Word text={year} x={198} y={228} cap={26} weight={WEIGHTS.bold} tracking={6} fill={ink} reveal={rev[0]} />
              <Word text={studio} x={613} y={423} cap={18} weight={WEIGHTS.bold} tracking={14} fill={ink} reveal={rev[0]} />
              <Word text={title} x={COVER_TITLE.x} y={COVER_TITLE.y} cap={titleCap} weight={st.weight} outline={outline} anchor="middle" fill={ink} reveal={rev[0]} />
              <Word text={subtitle} x={800 - titleW / 2} y={736} cap={57} weight={WEIGHTS.bold} tracking={8} fill={ink} reveal={rev[0]} />
              <g opacity={smooth(0.5, 1, f.intro)}>
                <Label text="SLAB SERIF" x={1136} y={895} cap={17} anchor="end" fill={ink} />
                <Label text="FONT FAMILY" x={1136} y={925} cap={17} anchor="end" fill={ink} />
                <rect x={1164} y={865} width={2.5} height={65} fill={ink} />
                {G_WEIGHTS.map((w, k) => (
                  <Word key={w} text="A" x={1200 + k * 58} y={925} cap={57} weight={w} fill={ink} />
                ))}
              </g>
            </g>
          ) : null}

          {/* 02 the eye: the title spread across the page, its middle letters over the panel */}
          {vis[1] > 0.001 ? (
            <g opacity={vis[1]}>
              <g opacity={rev[1]}>
                <Word text={studio} x={61} y={80} cap={15} weight={WEIGHTS.bold} tracking={6} fill={ink} />
                <rect x={61 + studioW + 12} y={62} width={2} height={20} fill={ink} />
                <Word text={title} x={61 + studioW + 26} y={80} cap={15} weight={WEIGHTS.bold} tracking={6} fill={ink} />
                <Label text={"VOL. 01 / " + year} x={61} y={110} cap={7} fill={ink} />
                <Label text="AN EXPERIMENTAL SLAB SERIF FORGED FROM SCALE - SPINE AND HORN - WITH SHARP SLABS AND THORNED ENDS" x={800} y={68} cap={9} anchor="middle" fill={ink} />
                <Label text="ONE ANGULAR SKELETON CUT IN FOUR WEIGHTS - MADE FOR COVERS - POSTERS AND BIG TITLES" x={800} y={90} cap={9} anchor="middle" fill={ink} />
                <Label text="AND FOR ANYTHING THAT SHOULD LOOK BACK AT YOU." x={800} y={112} cap={9} anchor="middle" fill={ink} />
                <Label text={"VOL. 01 / " + year} x={1547} y={68} cap={7} anchor="end" fill={ink} />
                <Label text={studio} x={1547} y={90} cap={7} anchor="end" fill={ink} />
                <Label text="SPECIMEN BOOK" x={1547} y={112} cap={7} anchor="end" fill={ink} />
              </g>
              <Word text={year} x={800} y={205} cap={30} weight={WEIGHTS.bold} tracking={8} anchor="middle" fill={ink} reveal={rev[1]} />
              {letters.map((ch, k) => (
                <Word key={k} text={ch} x={letters.length > 1 ? 312 + (k * 1008) / (letters.length - 1) : 800} y={540} cap={90} weight={st.weight === WEIGHTS.regular ? 7 : st.weight} outline={outline} anchor="middle" fill={ink} reveal={rev[1]} />
              ))}
              <g opacity={rev[1]}>
                {[title + " " + subtitle, "SLAB SERIF FONT FAMILY", "4 STYLES / " + (Object.keys(GLYPHS).length - 1) + " GLYPHS", "TYPE DESIGN - " + studio, "DRAGON - LAYOUT AND MOTION - " + studio].map((s, k) => (
                  <Label key={k} text={s} x={800} y={780 + k * 21} cap={10} anchor="middle" fill={ink} />
                ))}
                <Label text="SPECIMEN - VOL. 01" x={800} y={908} cap={10} anchor="middle" fill={ink} />
                <Label text={year} x={800} y={929} cap={10} anchor="middle" fill={ink} />
              </g>
            </g>
          ) : null}

          {/* 03 glyph set, framed round the dragon's head; hover a letter to light it */}
          {vis[2] > 0.001 ? (
            <g opacity={vis[2]}>
              <Word text={title} x={800} y={140} cap={50} tracking={8} anchor="middle" fill={ink} reveal={rev[2]} />
              <g opacity={rev[2]}>
                <Label text={subtitle} x={800} y={162} cap={7} tracking={60} anchor="middle" fill={ink} />
                <Label text="UPPERCASE" x={365} y={222} cap={8} fill={ink} />
                <Label text="A TO Z" x={1238} y={222} cap={8} anchor="end" fill={ink} />
                <Label text="ALTERNATES" x={1238} y={522} cap={8} anchor="end" fill={ink} />
                {[0, 1].map((side) => (
                  <g key={side} fill={mixColor(background, "#000000", side ? 0.88 : 0.45)}>
                    {G_WEIGHTS.map((w, k) => (
                      <Word key={w} text="A" x={side ? 1416 : 184} y={350 + k * 100} cap={60} weight={w} anchor="middle" fill={mixColor(background, "#000000", side ? 0.88 : 0.45)} />
                    ))}
                    <rect x={(side ? 1416 : 184) - 48} y={699.5} width={96} height={1.2} />
                    <path d={"M" + (side ? 1416 : 184) + " 694 l6 6 l-6 6 l-6 -6z"} />
                    <Label text={side ? "INK" : "WEIGHT"} x={side ? 1416 : 184} y={724} cap={7} anchor="middle" fill={mixColor(background, "#000000", side ? 0.88 : 0.45)} />
                  </g>
                ))}
              </g>
              <g data-ui="" style={{ pointerEvents: "auto" }} onPointerLeave={() => setGlyph("")}>
                {CAPS.map(([row, c0, y], ri) =>
                  row.split("").map((ch, ci) => {
                    const gx = G12(c0 + ci)
                    const on = glyph === ch
                    const k = clamp01((rev[2] - (ri * 6 + ci) / 60) / 0.5)
                    return (
                      <g key={ch} onPointerEnter={() => setGlyph(ch)} onClick={() => setGlyph(ch)} style={{ cursor: "pointer" }} opacity={k}>
                        <rect x={gx - 34} y={y - 70} width={68} height={80} fill={on ? ink : "transparent"} />
                        <Word text={ch} x={gx} y={y} cap={59} anchor="middle" fill={on ? background : ink} />
                      </g>
                    )
                  }),
                )}
              </g>
              <g opacity={rev[2]}>
                {ALTROWS.map(([row, c0, y]) =>
                  row.split("").map((ch, ci) => <Word key={ch + y} text={ch} x={G15(c0 + ci)} y={y} cap={45} alt anchor="middle" fill={ink} />),
                )}
                {"-.:!?/-.:!?/-.:!?/".split("").map((ch, k) => (
                  <Word key={k} text={ch} x={365 + (k + 0.5) * (873 / 18)} y={767} cap={26} anchor="middle" fill={ink} />
                ))}
                {"0123456789".split("").map((ch, k) => (
                  <Word key={k} text={ch} x={365 + (k + 0.5) * 87.3} y={870} cap={70} outline={outlineId} anchor="middle" fill={ink} opacity={0.5} />
                ))}
              </g>
              <Word text={year} x={800} y={944} cap={26} weight={WEIGHTS.bold} tracking={10} anchor="middle" fill={ink} reveal={rev[2]} />
            </g>
          ) : null}

          {/* 04 weights: the hands hold the filled row */}
          {vis[3] > 0.001 ? (
            <g opacity={vis[3]}>
              <g opacity={rev[3]}>
                <Label text="4 WEIGHTS" x={408} y={186} cap={9} fill={ink} />
                <Label text="ONE SKELETON" x={408} y={207} cap={9} fill={ink} />
                <Label text="REGULAR" x={336} y={408} cap={9} anchor="end" fill={ink} />
                <Label text="OUTLINE" x={333} y={639} cap={9} anchor="end" fill={ink} />
              </g>
              <g data-ui="" style={{ pointerEvents: "auto" }}>
                {G_WEIGHTS.map((w, k) => {
                  const x = G_ROW.x + k * G_ROW.step
                  const lift = hoverG === k ? 14 : 0
                  const kk = clamp01((rev[3] - k * 0.1) / 0.6)
                  return (
                    <g key={w} onPointerEnter={() => setHoverG(k)} onPointerLeave={() => setHoverG(-1)} opacity={kk}>
                      <rect x={x - 20} y={G_ROW.base - G_ROW.cap - 20} width={(GLYPHS.G[0] * G_ROW.cap) / 100 + 40} height={440} fill="transparent" />
                      <Word text="G" x={x} y={G_ROW.base - lift} cap={G_ROW.cap} weight={w} fill={hoverG === k ? "#ffffff" : ink} reveal={kk} />
                      <Word text="G" x={x} y={717 - lift} cap={G_ROW.cap} weight={w} outline={outlineId} fill={ink} reveal={kk} />
                    </g>
                  )
                })}
              </g>
              <Word text={title} x={1480} y={871} cap={46} tracking={6} anchor="end" fill={ink} reveal={rev[3]} />
              <Label text={subtitle} x={1550} y={898} cap={8} anchor="end" fill={ink} opacity={rev[3]} />
            </g>
          ) : null}

          {/* 05 styles, on the dark page: pick one and every title follows */}
          {vis[4] > 0.001 ? (
            <g opacity={vis[4]}>
              <Label text="SLAB SERIF FONT FAMILY" x={800} y={210} cap={12} anchor="middle" fill={ink} opacity={rev[4]} />
              <Word text={title} x={800} y={403} cap={fitCap(title, st.weight, 0, 440, 88)} weight={st.weight} outline={outline} anchor="middle" fill={ink} reveal={rev[4]} />
              <Label text={subtitle} x={800} y={446} cap={14} tracking={60} anchor="middle" fill={ink} opacity={rev[4]} />
              <g data-ui="" style={{ pointerEvents: "auto" }} opacity={rev[4]}>
                {[0, 1].map((side) => {
                  const cx = side ? 1240 : 352
                  return (
                    <g key={side}>
                      <Label text={side ? "UPPERCASE" : "ALTERNATE"} x={cx} y={205} cap={12} anchor="middle" fill={background} />
                      {STYLES.map((s, k) => {
                        const on = s === style
                        const sp = styleSpec(s)
                        const names = s === "bold-outline" ? ["BOLD", "OUTLINE"] : [s]
                        const nw = (layoutWord(names[0], sp.weight, 6).width * 45) / 100
                        const top = [265, 370, 465, 570][k]
                        return (
                          <g
                            key={s}
                            role="button"
                            tabIndex={side ? 0 : -1}
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
                            opacity={on || !sp.outline ? 1 : 0.3}
                          >
                            <rect x={cx - 170} y={top - 22} width={340} height={names.length * 50 + 40} fill="transparent" />
                            {on ? <path d={"M" + (cx - nw / 2 - 30) + " " + (top + 32) + " l14 10 l-14 10z"} fill={ink} /> : null}
                            <Word text="ABC:123" x={cx} y={top} cap={14} weight={sp.weight} tracking={6} alt={!side} anchor="middle" fill={ink} />
                            {names.map((nm, j) => (
                              <Word key={nm} text={nm} x={cx} y={top + 55 + j * 50} cap={45} weight={sp.weight} tracking={6} alt={!side} outline={sp.outline ? outlineId : undefined} anchor="middle" fill={ink} />
                            ))}
                          </g>
                        )
                      })}
                    </g>
                  )
                })}
              </g>
              {/* the needle cross, in front of the dragon's brow and through the title */}
              <g fill={background} opacity={rev[4]}>
                <path d={NEEDLE} />
                <Label text={studio} x={800} y={810} cap={7} anchor="middle" fill={ink} />
              </g>
            </g>
          ) : null}

          {/* 06 alternates */}
          {vis[5] > 0.001 ? (
            <g opacity={vis[5]}>
              <Word text={specimenWord} x={829} y={289} cap={specCap} tracking={42} alt fill={ink} reveal={rev[5]} />
              <Word text={specimenWord} x={829} y={422} cap={specCap} tracking={42} fill={ink} reveal={rev[5]} />
              <g opacity={rev[5]}>
                <Label text="ALT" x={768} y={244} cap={8} anchor="end" fill={ink} />
                <Label text="REG" x={768} y={376} cap={8} anchor="end" fill={ink} />
                <Label text="STYLISTIC ALTERNATES" x={1112} y={534} cap={8} anchor="middle" fill={ink} />
                <Label text="REGULAR CHARACTER" x={1112} y={739} cap={8} anchor="middle" fill={ink} />
                <Label text="STYLISTIC SET" x={600} y={364} cap={6} anchor="middle" fill={ink} />
                <Label text={subtitle} x={432} y={812} cap={8} fill={ink} />
              </g>
              <Word text="AGKNRSVZ" x={1112} y={623} cap={61} tracking={39} alt anchor="middle" fill={ink} reveal={rev[5]} />
              <Word text="AGKNRSVZ" x={1112} y={831} cap={62} tracking={38} anchor="middle" fill={ink} reveal={rev[5]} />
              <Word text={title} x={88} y={831} cap={43} tracking={6} fill={ink} reveal={rev[5]} />
            </g>
          ) : null}

          {/* 07 liquid */}
          {vis[6] > 0.001 ? (
            <g opacity={vis[6]}>
              <Label text={studio} x={221} y={149} cap={7} fill={ink} opacity={rev[6]} />
              <Word text="EXPERIMENTAL" x={221} y={201} cap={26} tracking={14} fill={ink} reveal={rev[6]} />
              <Word text="LIQUID-LIKE" x={221} y={251} cap={35} weight={WEIGHTS.bold} tracking={22} fill={ink} reveal={rev[6]} />
              <Word text="EFFECT" x={221} y={300} cap={35} weight={WEIGHTS.bold} tracking={26} fill={ink} reveal={rev[6]} />
              <Word text={title} x={1438} y={216} cap={44} tracking={6} anchor="end" fill={ink} reveal={rev[6]} />
              <Label text={subtitle} x={1498} y={245} cap={8} anchor="end" fill={ink} opacity={rev[6]} />
              <Word text="A" x={226} y={578} cap={205} fill={ink} reveal={rev[6]} />
              {/* call-outs: they reach out as the page settles */}
              <g stroke={ink} fill="none" strokeWidth={1.4} opacity={rev[6]}>
                <path d="M589 235 L720 235 L1120 445 L1224 620 L1136 740" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - reach} />
                <path d="M356 505 L504 565 L504 620 L400 730" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - reach} />
                <circle cx={365} cy={770} r={135} strokeWidth={2} />
              </g>
              <g fill={ink} opacity={rev[6]}>
                {[[589, 235, 0], [720, 235, 0.1], [1120, 445, 0.55], [1224, 620, 0.8], [504, 565, 0.4], [504, 620, 0.6]].map(([x, y, at], k) => (
                  <circle key={k} cx={x} cy={y} r={4} opacity={smooth(at, at + 0.05, reach)} />
                ))}
              </g>
              {/* the zoom: our own A, crossbar and leg, blown up inside the ring. The clip lives here:
                  any clipPath in the svg makes software rendering repaint it every frame */}
              <clipPath id={id + "-zoom"}>
                <circle cx={365} cy={770} r={134} />
              </clipPath>
              <g clipPath={"url(#" + id + "-zoom)"} opacity={rev[6]}>
                <Word text="A" x={-148} y={1094} cap={900} fill={ink} />
              </g>
            </g>
          ) : null}
        </svg>

        {/* the fingers and claws that grip the letters, drawn above the type */}
        <canvas
          ref={frontRef}
          aria-hidden="true"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", maxWidth: "none", display: "block", pointerEvents: "none" }}
        />

        {hint && !controlled ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-12 flex flex-col items-center gap-2 font-mono text-[10px] uppercase tracking-[0.35em] transition-opacity duration-1000 motion-reduce:transition-none"
            style={{ color: ink, opacity: Math.max(0, 0.85 - localT(f.p, 0) * 4) * f.hint }}
          >
            scroll
            <span className="block h-6 w-px animate-pulse motion-reduce:animate-none" style={{ background: ink }} />
          </div>
        ) : null}
      </div>
    </section>
  )
}

/** A small label: the display face, bold and tracked. */
function Label(props: { text: string; x: number; y: number; cap: number; fill: string; anchor?: "start" | "middle" | "end"; tracking?: number; opacity?: number }) {
  return <Word weight={16} tracking={8} {...props} />
}

/** The liquid drop's lobes round DROP_HOME: [dx, dy, r]. Three lobes, a bridge between them. */
const DROP_LOBES = [
  [-77, 0, 114],
  [115, -35, 68],
  [35, 92, 38],
  [80, 62, 30],
]

/**
 * The dark page's ornament: a needle down the brow, barbed in pairs as it thickens, a guard
 * with pointed ends, and a short blade under it.
 */
const NEEDLE = (() => {
  let d = "M800 254 L803 400 L809 598 L791 598 L797 400Z"
  for (let k = 0; k < 7; k++) {
    const y = 408 + k * 30
    const hw = 3 + (6 * (y - 400)) / 200
    const len = 6 + k * 2.6
    d += "M" + (800 - hw + 0.5) + " " + y + "l0 10l" + -len + " " + -(12 + k) + "z"
    d += "M" + (800 + hw - 0.5) + " " + y + "l0 10l" + len + " " + -(12 + k) + "z"
  }
  d += "M800 322l5 9l-5 9l-5 -9zM800 356l6 10l-6 10l-6 -10z"
  d += "M637 610L684 603L916 603L963 610L916 617L684 617Z"
  d += "M800 586L824 610L800 634L776 610Z"
  d += "M790 626L810 626L806 690L800 770L794 690Z"
  return d
})()
