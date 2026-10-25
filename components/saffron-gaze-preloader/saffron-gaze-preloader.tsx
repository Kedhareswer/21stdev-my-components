"use client"

// Saffron Gaze Preloader — a painted film poster that wakes up.
//
// On a black stage a slit of light opens into a letterbox window: a pair of
// painted eyes, shut, under a bindi sun. As the load climbs, saffron clouds
// pour in over the window's corners, the sun grows its rays, sparkles ignite
// and the title inks itself in, letter by letter, as the progress bar. At
// 100% the eyes open. They look at the pointer, blink, and wink when tapped.
// On the way out the eyes close, the window folds back into its slit, the
// slit stretches across the screen and the black parts top and bottom to
// reveal the page beneath — the visitor's own eyes opening.
//
// One file, React only, nothing fetched. The eyes, brows, lashes, kajal,
// clouds, sun, moon, sparkles and filigree are all procedural SVG built in
// this file, and the display type is a built-in condensed alphabet so the
// poster looks the same on every machine. Every rule in the scoped <style>
// is .sgz- prefixed.

import * as React from "react"

export interface SaffronGazePalette {
  /** The black stage. */
  stage: string
  /** Painted skin inside the window, mid tone. */
  skin: string
  /** Skin where the light hits: forehead and cheekbones. */
  skinLight: string
  /** Skin in shadow: the sockets and the window's edges. */
  skinDeep: string
  /** Lashes, brows, kajal and the pupils. */
  ink: string
  /** Sclera, sparkles, rays, moon and filigree. */
  cream: string
  /** The iris. */
  iris: string
  /** The iris at its rim. */
  irisDeep: string
  /** The bindi. */
  bindi: string
  /** The clouds, mid tone. */
  cloud: string
  /** The clouds where the sun catches them. */
  cloudLight: string
  /** The clouds in shadow. */
  cloudDeep: string
  /** The display type. */
  title: string
  /** Small text. */
  text: string
}

export interface SaffronGazeCredit {
  /** Tiny tracked line above the name. */
  eyebrow?: string
  /** Set in the display face. A–Z, 0–9, and . ' - ! / */
  name: string
  /** Tiny line under the name. */
  note?: string
}

export interface SaffronGazePreloaderProps {
  /** The page behind the gate. Mounted the whole time, revealed when the black parts. Ignored while `loop` is set. */
  children?: React.ReactNode
  /** Run forever as a showcase: the window folds shut and opens again. `onComplete` never fires. */
  loop?: boolean
  /** Real loading progress, 0–100. Leave undefined for the built-in simulated load. The eyes open at 100. */
  progress?: number
  /** Length of the simulated load. Defaults to 4600ms. */
  durationMs?: number
  /** How long the opened eyes hold before the gate lifts on its own. Defaults to 3400ms. */
  holdMs?: number
  /** Lift the gate by itself after `holdMs`. Set false to wait for a click, Enter or Space. */
  autoEnter?: boolean
  /** The big word, set in the built-in condensed face. A–Z, 0–9, and . ' - ! / (lower case is lifted, accents dropped). */
  title?: string
  /** The line under the title, in any script. The default is Devanagari. */
  subtitle?: string
  /** Tracked line at the top. */
  kicker?: string
  /** Smaller line under the kicker. */
  kickerSub?: string
  /** Caption while loading. The count is set after it. */
  loadingLabel?: string
  /** Small line under the loading caption. */
  loadingSub?: string
  /** Caption once the eyes are open. */
  enterLabel?: string
  /** Small line under the enter caption. */
  enterSub?: string
  /** Credit block, bottom left. Pass null to drop it. */
  credit?: SaffronGazeCredit | null
  /** One or two characters in the sun badge, top right. Pass "" to drop it. */
  monogram?: string
  /**
   * Your own portrait in the window instead of the painted eyes. It is
   * graded into the palette as a duotone, and the clouds, sun, sparkles and
   * moon still paint over it. The painted eyes' gaze and blink do not apply.
   */
  image?: string
  /** Where the photo is cropped from, as CSS object-position. Defaults to "50% 35%": the eyes. */
  imagePosition?: string
  /** Colour overrides, merged over the saffron defaults. */
  palette?: SaffronGazePaletteOverrides
  /** How far the eyes follow the pointer. 0 keeps them still. */
  gaze?: number
  /** Blink now and then while the eyes are open. */
  blink?: boolean
  /** Show the percentage after the loading caption. */
  counter?: boolean
  /** Face for the small text. The default stack never fetches anything. */
  fontFamily?: string
  /** Face for the subtitle and the small sub-captions, which may be in another script. */
  scriptFontFamily?: string
  /** Root height while the gate is up. A definite length, never a percentage. */
  height?: string
  /** Fired once, after the page is revealed. */
  onComplete?: () => void
  /** Extra root class names. */
  className?: string
}

const DEFAULT_PALETTE: SaffronGazePalette = {
  stage: "#0a0604",
  skin: "#dd7a36",
  skinLight: "#f2a95e",
  skinDeep: "#8e3410",
  ink: "#1a0b05",
  cream: "#f9e7c6",
  iris: "#d08a2e",
  irisDeep: "#5a2408",
  bindi: "#c0261b",
  cloud: "#e07f3c",
  cloudLight: "#f8c993",
  cloudDeep: "#9a3a12",
  title: "#f0a048",
  text: "#f1e0c4",
}

const SANS_STACK = '"Inter", "Helvetica Neue", Helvetica, Arial, sans-serif'
const SCRIPT_STACK =
  '"Noto Sans Devanagari", "Kohinoor Devanagari", "Devanagari MT", "Nirmala UI", "Mukta", "Hind", system-ui, sans-serif'

// #region geometry
// Pure helpers, lifted out and executed by tests/saffron-gaze-preloader.test.mjs.

const clamp01 = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const easeOutCubic = (t: number) => 1 - Math.pow(1 - clamp01(t), 3)
const easeInOut = (t: number) => {
  const x = clamp01(t)
  return x * x * (3 - 2 * x)
}
const f1 = (n: number) => (Math.round(n * 10) / 10).toString()
const f3 = (n: number) => (Math.round(n * 1000) / 1000).toString()

// Deterministic noise in [0, 1).
export function sgzHash(x: number) {
  const s = Math.sin(x * 12.9898 + 78.233) * 43758.5453
  return s - Math.floor(s)
}

// A tiny seeded generator, so every painted stroke is the same on every render.
export function sgzRng(seed: number) {
  let s = seed * 1013 + 7
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

// Surges and stalls like a real load. [time, progress] knots.
const KNOTS = [
  [0, 0],
  [0.2, 0.24],
  [0.32, 0.27],
  [0.58, 0.66],
  [0.68, 0.7],
  [0.86, 0.94],
  [1, 1],
]
export function sgzSimulated(t: number) {
  if (t <= 0) return 0
  if (t >= 1) return 1
  for (let i = 0; i < KNOTS.length - 1; i++) {
    const a = KNOTS[i]
    const b = KNOTS[i + 1]
    if (t <= b[0]) {
      const local = (t - a[0]) / (b[0] - a[0])
      return a[1] + (b[1] - a[1]) * (1 - Math.pow(1 - local, 3))
    }
  }
  return 1
}

// ---- the display face --------------------------------------------------------
// A condensed poster alphabet, 100 tall, drawn from primitives. Outer shapes
// run clockwise and counters run the other way, so nonzero filling unions
// overlapping parts and cuts the holes.

function sgzArea(pts: number[][]) {
  let a = 0
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i]
    const q = pts[(i + 1) % pts.length]
    a += p[0] * q[1] - q[0] * p[1]
  }
  return a
}
function poly(pts: number[][], hole?: boolean) {
  const cw = sgzArea(pts) > 0
  const list = cw !== !!hole ? pts : [...pts].reverse()
  return "M" + list.map((p) => p[0] + " " + p[1]).join(" L") + " Z"
}
function rect(x: number, y: number, w: number, h: number, hole?: boolean) {
  return poly(
    [
      [x, y],
      [x + w, y],
      [x + w, y + h],
      [x, y + h],
    ],
    hole,
  )
}
function rr(x: number, y: number, w: number, h: number, r: number, hole?: boolean) {
  const R = Math.min(r, w / 2, h / 2)
  if (hole) {
    return (
      "M" + (x + R) + " " + y + " A" + R + " " + R + " 0 0 0 " + x + " " + (y + R) + " V" + (y + h - R) +
      " A" + R + " " + R + " 0 0 0 " + (x + R) + " " + (y + h) + " H" + (x + w - R) +
      " A" + R + " " + R + " 0 0 0 " + (x + w) + " " + (y + h - R) + " V" + (y + R) +
      " A" + R + " " + R + " 0 0 0 " + (x + w - R) + " " + y + " Z"
    )
  }
  return (
    "M" + (x + R) + " " + y + " H" + (x + w - R) + " A" + R + " " + R + " 0 0 1 " + (x + w) + " " + (y + R) +
    " V" + (y + h - R) + " A" + R + " " + R + " 0 0 1 " + (x + w - R) + " " + (y + h) + " H" + (x + R) +
    " A" + R + " " + R + " 0 0 1 " + x + " " + (y + h - R) + " V" + (y + R) +
    " A" + R + " " + R + " 0 0 1 " + (x + R) + " " + y + " Z"
  )
}

const STEM = rect(0, 0, 17, 100)
const C_D = "M20 0 H50 V16 H22 A6 6 0 0 0 16 22 V78 A6 6 0 0 0 22 84 H50 V100 H20 A20 20 0 0 1 0 80 V20 A20 20 0 0 1 20 0 Z"
const P_BOWL = "M0 0 H31 A19 19 0 0 1 50 19 V41 A19 19 0 0 1 31 60 H0 Z" + rr(17, 16, 16, 28, 5, true)
const O_D = rr(0, 0, 50, 100, 22) + rr(17, 16, 16, 68, 7, true)
const SIX_D =
  "M20 0 H50 V16 H24 A7 7 0 0 0 17 23 V40 H30 A20 20 0 0 1 50 60 V80 A20 20 0 0 1 30 100 H20 A20 20 0 0 1 0 80 V20 A20 20 0 0 1 20 0 Z" +
  rr(17, 56, 16, 28, 6, true)

/** [advance, path] per character. The visible shape sits at x 0..advance-10; 5 units of bearing each side. */
export const SGZ_GLYPHS: { [ch: string]: [number, string] } = {
  " ": [26, ""],
  A: [
    60,
    poly([[0, 100], [16, 0], [34, 0], [50, 100], [33, 100], [30.6, 80], [19.4, 80], [17, 100]]) +
      poly([[21.2, 62], [28.8, 62], [25, 28]], true),
  ],
  B: [
    60,
    STEM +
      "M0 0 H30 A18 18 0 0 1 48 18 V33 A17 17 0 0 1 31 50 H0 Z" + rr(17, 16, 14, 18, 5, true) +
      "M0 42 H29 A21 21 0 0 1 50 63 V79 A21 21 0 0 1 29 100 H0 Z" + rr(17, 58, 16, 26, 6, true),
  ],
  C: [60, C_D],
  D: [60, "M0 0 H30 A20 20 0 0 1 50 20 V80 A20 20 0 0 1 30 100 H0 Z" + rr(17, 16, 16, 68, 6, true)],
  E: [58, STEM + rect(0, 0, 48, 16) + rect(0, 42, 42, 16) + rect(0, 84, 48, 16)],
  F: [56, STEM + rect(0, 0, 48, 16) + rect(0, 42, 40, 16)],
  G: [60, C_D + rect(33, 46, 17, 38) + rect(26, 46, 24, 16)],
  H: [60, STEM + rect(33, 0, 17, 100) + rect(0, 42, 50, 16)],
  I: [27, STEM],
  J: [60, "M8 0 H50 V75 A25 25 0 0 1 0 75 V68 H17 V75 A8 8 0 0 0 33 75 V16 H8 Z"],
  K: [60, STEM + poly([[16, 42], [33, 0], [51, 0], [16, 62]]) + poly([[16, 50], [29, 36], [51, 100], [33, 100]])],
  L: [58, STEM + rect(0, 84, 48, 16)],
  M: [70, poly([[0, 100], [0, 0], [17, 0], [30, 44], [43, 0], [60, 0], [60, 100], [44, 100], [44, 32], [35, 62], [25, 62], [16, 32], [16, 100]])],
  N: [60, STEM + rect(33, 0, 17, 100) + poly([[0, 0], [14, 0], [50, 80], [50, 100], [36, 100], [0, 20]])],
  O: [60, O_D],
  P: [60, STEM + P_BOWL],
  Q: [60, O_D + poly([[26, 80], [36, 72], [50, 92], [44, 100]])],
  R: [60, STEM + P_BOWL + poly([[22, 56], [36, 56], [50, 100], [33, 100]])],
  S: [
    60,
    "M20 0 H50 V16 H22 A6 6 0 0 0 16 22 V32 A6 6 0 0 0 22 38 H30 A20 20 0 0 1 50 58 V80 A20 20 0 0 1 30 100 H0 V84 H28 A6 6 0 0 0 34 78 V60 A6 6 0 0 0 28 54 H20 A20 20 0 0 1 0 34 V20 A20 20 0 0 1 20 0 Z",
  ],
  T: [60, rect(0, 0, 50, 16) + rect(16.5, 0, 17, 100)],
  U: [60, "M0 0 H17 V75 A8 8 0 0 0 33 75 V0 H50 V75 A25 25 0 0 1 0 75 Z"],
  V: [60, poly([[0, 0], [17, 0], [25, 74], [33, 0], [50, 0], [33.5, 100], [16.5, 100]])],
  W: [76, poly([[0, 0], [15, 0], [21, 76], [28.5, 20], [37.5, 20], [45, 76], [51, 0], [66, 0], [54, 100], [38, 100], [33, 54], [28, 100], [12, 100]])],
  X: [60, poly([[0, 0], [17, 0], [50, 100], [33, 100]]) + poly([[33, 0], [50, 0], [17, 100], [0, 100]])],
  Y: [60, poly([[0, 0], [17, 0], [25, 46], [33, 0], [50, 0], [33.5, 62], [33.5, 100], [16.5, 100], [16.5, 62]])],
  Z: [60, rect(0, 0, 50, 16) + rect(0, 84, 50, 16) + poly([[32, 0], [50, 0], [18, 100], [0, 100]])],
  "0": [58, rr(0, 0, 48, 100, 22) + rr(16, 16, 16, 68, 7, true)],
  "1": [42, rect(14, 0, 17, 100) + poly([[0, 16], [16, 0], [16, 20], [0, 32]])],
  "2": [60, "M0 20 A20 20 0 0 1 20 0 H30 A20 20 0 0 1 50 20 V36 L21 84 H50 V100 H0 V76 L33 34 V22 A6 6 0 0 0 27 16 H23 A6 6 0 0 0 17 22 V26 H0 Z"],
  "3": [
    60,
    "M0 0 H30 A18 18 0 0 1 48 18 V30 A16 16 0 0 1 40 44 A20 20 0 0 1 50 60 V80 A20 20 0 0 1 30 100 H0 V84 H28 A6 6 0 0 0 34 78 V60 A6 6 0 0 0 28 54 H12 V38 H26 A5 5 0 0 0 31 33 V21 A5 5 0 0 0 26 16 H0 Z",
  ],
  "4": [60, rect(30, 0, 17, 100) + rect(0, 62, 50, 16) + poly([[0, 66], [30, 0], [47, 0], [17, 66]])],
  "5": [60, "M0 0 H50 V16 H17 V38 H30 A20 20 0 0 1 50 58 V80 A20 20 0 0 1 30 100 H0 V84 H28 A6 6 0 0 0 34 78 V60 A6 6 0 0 0 28 54 H0 Z"],
  "6": [60, SIX_D],
  "7": [60, poly([[0, 0], [50, 0], [50, 14], [22, 100], [5, 100], [32, 16], [0, 16]])],
  "8": [60, rr(2, 0, 46, 52, 20) + rr(19, 16, 12, 20, 5, true) + rr(0, 44, 50, 56, 22) + rr(17, 60, 16, 24, 6, true)],
  "9": [
    60,
    "M30 100 H0 V84 H26 A7 7 0 0 0 33 77 V60 H20 A20 20 0 0 1 0 40 V20 A20 20 0 0 1 20 0 H30 A20 20 0 0 1 50 20 V80 A20 20 0 0 1 30 100 Z" +
      rr(17, 16, 16, 28, 6, true),
  ],
  ".": [26, rect(0, 84, 16, 16)],
  "-": [40, rect(0, 44, 30, 14)],
  "!": [27, rect(0, 0, 17, 70) + rect(0, 84, 17, 16)],
  "'": [23, rect(0, 0, 13, 26)],
  "/": [52, poly([[26, 0], [42, 0], [16, 100], [0, 100]])],
}

// Accents are dropped (É → E), lower case is lifted, anything unknown is a space.
export function sgzGlyph(ch: string) {
  const key = ch.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase()
  return SGZ_GLYPHS[key] ?? SGZ_GLYPHS[" "]
}

/** Lay a word out in glyph units: each letter's path and pen position, and the total width. */
export function sgzWord(text: string, tracking: number) {
  const letters: { d: string; x: number; w: number }[] = []
  let x = 0
  const chars = Array.from(text)
  chars.forEach((ch, i) => {
    const [adv, d] = sgzGlyph(ch)
    letters.push({ d, x: x + 5, w: adv - 10 })
    x += adv + (i < chars.length - 1 ? tracking : 0)
  })
  return { letters, width: Math.max(0, x) }
}

// ---- the eye -----------------------------------------------------------------
// Unit space: the eye is 2 wide, its centre at the origin, the outer corner at
// +x and the brow above at -y. The left eye is this mirrored.

const EYE_UP = [[-1, 0.06], [-0.58, -0.68], [0.3, -0.72], [1, -0.12]]
const EYE_SHUT = [[-1, 0.06], [-0.5, 0.37], [0.42, 0.33], [1, -0.12]]
const EYE_LO = [[1, -0.12], [0.6, 0.45], [-0.45, 0.43], [-1, 0.06]]

function bez(c: number[][], s: number) {
  const u = 1 - s
  const a = u * u * u
  const b = 3 * u * u * s
  const d = 3 * u * s * s
  const e = s * s * s
  return [a * c[0][0] + b * c[1][0] + d * c[2][0] + e * c[3][0], a * c[0][1] + b * c[1][1] + d * c[2][1] + e * c[3][1]]
}
function bezTan(c: number[][], s: number) {
  const u = 1 - s
  const x = 3 * u * u * (c[1][0] - c[0][0]) + 6 * u * s * (c[2][0] - c[1][0]) + 3 * s * s * (c[3][0] - c[2][0])
  const y = 3 * u * u * (c[1][1] - c[0][1]) + 6 * u * s * (c[2][1] - c[1][1]) + 3 * s * s * (c[3][1] - c[2][1])
  const l = Math.hypot(x, y) || 1
  return [x / l, y / l]
}
// The normal pointing away from the eye, for the upper curve: up on screen.
const upNormal = (t: number[]) => [t[1], -t[0]]

/** The upper lid's control points at a given openness (0 shut, 1 open). */
export function sgzUpper(open: number) {
  const t = easeInOut(open)
  return EYE_UP.map((p, i) => [lerp(EYE_SHUT[i][0], p[0], t), lerp(EYE_SHUT[i][1], p[1], t)])
}

const cubic = (c: number[][]) =>
  " C" + f3(c[1][0]) + " " + f3(c[1][1]) + " " + f3(c[2][0]) + " " + f3(c[2][1]) + " " + f3(c[3][0]) + " " + f3(c[3][1])

/** The aperture: the eye's visible shape at an openness. */
export function sgzEyeD(open: number) {
  const up = sgzUpper(open)
  return "M" + f3(up[0][0]) + " " + f3(up[0][1]) + cubic(up) + cubic(EYE_LO) + " Z"
}

/** The kajal line along the upper lid, thickening to the outer corner and flicking into a wing. */
export function sgzKajalD(open: number, wing: number) {
  const up = sgzUpper(open)
  const n = 22
  const lower: number[][] = []
  const upper: number[][] = []
  for (let i = 0; i <= n; i++) {
    const s = i / n
    const p = bez(up, s)
    const nm = upNormal(bezTan(EYE_UP, s))
    const w = 0.035 + 0.1 * Math.pow(s, 1.5)
    lower.push(p)
    upper.push([p[0] - nm[0] * w, p[1] - nm[1] * w])
  }
  const tip = [1 + 0.3 * wing, -0.12 - 0.26 * wing]
  const pts = [...lower, tip, ...upper.reverse()]
  return "M" + pts.map((p) => f3(p[0]) + " " + f3(p[1])).join(" L") + " Z"
}

/** Upper lashes: tapered brush strokes rooted on the lid, fanning outward, folding down as the eye shuts. */
export function sgzLashes(open: number, count: number, seed: number) {
  const up = sgzUpper(open)
  const t = easeInOut(open)
  const rnd = sgzRng(seed)
  const out: string[] = []
  for (let i = 0; i < count; i++) {
    const s = 0.1 + (0.88 * i) / Math.max(1, count - 1)
    const base = bez(up, s)
    const nm = upNormal(bezTan(EYE_UP, s))
    const tilt = 0.12 + 0.75 * s
    const ox = nm[0] * Math.cos(tilt) - nm[1] * Math.sin(tilt)
    const oy = nm[0] * Math.sin(tilt) + nm[1] * Math.cos(tilt)
    const sx = 0.5
    const sy = 1
    const sl = Math.hypot(sx, sy)
    let dx = lerp(sx / sl, ox, t)
    let dy = lerp(sy / sl, oy, t)
    const dl = Math.hypot(dx, dy) || 1
    dx /= dl
    dy /= dl
    const L = (0.1 + 0.3 * Math.pow(s, 1.3)) * (0.75 + 0.45 * rnd())
    const px = -dy
    const py = dx
    const bw = 0.011 + 0.011 * s
    const bend = 0.2 * L
    const cx = base[0] + dx * L * 0.55 + px * bend
    const cy = base[1] + dy * L * 0.55 + py * bend
    const tx = base[0] + dx * L + px * bend * 1.4
    const ty = base[1] + dy * L + py * bend * 1.4
    out.push(
      "M" + f3(base[0] - px * bw) + " " + f3(base[1] - py * bw) +
        " Q" + f3(cx - px * bw * 0.4) + " " + f3(cy - py * bw * 0.4) + " " + f3(tx) + " " + f3(ty) +
        " Q" + f3(cx + px * bw * 0.4) + " " + f3(cy + py * bw * 0.4) + " " + f3(base[0] + px * bw) + " " + f3(base[1] + py * bw) + " Z",
    )
  }
  return out
}

/** Lower lashes, short and static, on the outer half of the lower lid. */
export function sgzLowerLashes(count: number, seed: number) {
  const rnd = sgzRng(seed)
  const out: string[] = []
  for (let i = 0; i < count; i++) {
    const s = 0.08 + (0.5 * i) / Math.max(1, count - 1)
    const base = bez(EYE_LO, s)
    const tan = bezTan(EYE_LO, s)
    const nm = [-tan[1], tan[0]]
    const tilt = -0.35 - 0.5 * (1 - s)
    const dx = nm[0] * Math.cos(tilt) - nm[1] * Math.sin(tilt)
    const dy = nm[0] * Math.sin(tilt) + nm[1] * Math.cos(tilt)
    const L = (0.07 + 0.1 * (1 - s)) * (0.8 + 0.4 * rnd())
    const px = -dy
    const py = dx
    const bw = 0.014
    out.push(
      "M" + f3(base[0] - px * bw) + " " + f3(base[1] - py * bw) + " L" + f3(base[0] + dx * L) + " " + f3(base[1] + dy * L) +
        " L" + f3(base[0] + px * bw) + " " + f3(base[1] + py * bw) + " Z",
    )
  }
  return out
}

const BROW = [[-1.18, -0.78], [-0.55, -1.26], [0.5, -1.3], [1.35, -0.95]]

/** The brow: a tapered painted shape, thick at the inner end. */
export function sgzBrowD() {
  const n = 24
  const top: number[][] = []
  const bot: number[][] = []
  for (let i = 0; i <= n; i++) {
    const s = i / n
    const p = bez(BROW, s)
    const nm = upNormal(bezTan(BROW, s))
    const th = (0.07 + 0.2 * Math.pow(1 - s, 0.7) * (s < 0.1 ? s / 0.1 : 1)) / 2
    top.push([p[0] - nm[0] * th, p[1] - nm[1] * th])
    bot.push([p[0] + nm[0] * th, p[1] + nm[1] * th])
  }
  const pts = [...bot, ...top.reverse()]
  return "M" + pts.map((p) => f3(p[0]) + " " + f3(p[1])).join(" L") + " Z"
}

/** Hair strokes over the brow, for the painted texture. */
export function sgzBrowHairs(count: number, seed: number) {
  const rnd = sgzRng(seed)
  const out: { d: string; o: number }[] = []
  for (let i = 0; i < count; i++) {
    const s = 0.04 + 0.92 * (i / Math.max(1, count - 1)) + (rnd() - 0.5) * 0.03
    const p = bez(BROW, clamp01(s))
    const nm = upNormal(bezTan(BROW, clamp01(s)))
    const tilt = 0.9 - 0.5 * s + (rnd() - 0.5) * 0.4
    const dx = nm[0] * Math.cos(tilt) - nm[1] * Math.sin(tilt)
    const dy = nm[0] * Math.sin(tilt) + nm[1] * Math.cos(tilt)
    const L = (0.1 + 0.12 * (1 - s)) * (0.7 + 0.6 * rnd())
    const jx = (rnd() - 0.5) * 0.08
    const jy = (rnd() - 0.5) * 0.06
    out.push({
      d: "M" + f3(p[0] + jx - dx * L * 0.3) + " " + f3(p[1] + jy - dy * L * 0.3) + " L" + f3(p[0] + jx + dx * L) + " " + f3(p[1] + jy + dy * L),
      o: 0.35 + 0.55 * rnd(),
    })
  }
  return out
}

/** Filigree: a line that leaves the outer corner, sweeps up over the brow and curls in on itself. */
export function sgzCurlD() {
  const pts: number[][] = []
  const lead = [[1.2, -0.2], [1.75, -0.45], [1.9, -1.1], [1.55, -1.3]]
  for (let i = 0; i <= 18; i++) pts.push(bez(lead, i / 18))
  const cx = 1.3
  const cy = -1.26
  const r0 = 0.26
  for (let i = 1; i <= 40; i++) {
    const th = (i / 40) * Math.PI * 2.4
    const r = r0 * Math.exp(-0.38 * th)
    pts.push([cx + r * Math.cos(Math.PI - th), cy + r * Math.sin(Math.PI - th)])
  }
  return "M" + pts.map((p) => f3(p[0]) + " " + f3(p[1])).join(" L")
}

/** A small spiral for the inner corner, like the one on the poster's cheek. */
export function sgzSpiralD() {
  const pts: number[][] = []
  for (let i = 0; i <= 44; i++) {
    const th = (i / 44) * Math.PI * 3
    const r = 0.03 + 0.07 * th
    pts.push([r * Math.cos(th), r * Math.sin(th)])
  }
  return "M" + pts.map((p) => f3(p[0]) + " " + f3(p[1])).join(" L")
}

// ---- marks -------------------------------------------------------------------

/** A four-point star, concave sides. */
export function sgzSparkleD(r: number) {
  const k = r * 0.22
  return (
    "M0 " + f3(-r) + " C0 " + f3(-k) + " " + f3(k) + " 0 " + f3(r) + " 0 C" + f3(k) + " 0 0 " + f3(k) + " 0 " + f3(r) +
    " C0 " + f3(k) + " " + f3(-k) + " 0 " + f3(-r) + " 0 C" + f3(-k) + " 0 0 " + f3(-k) + " 0 " + f3(-r) + " Z"
  )
}

/** A crescent: a disc with a second, offset disc bitten out of it. Opens to +x. */
export function sgzMoonD(r: number) {
  const o = r * 0.5
  const ir = r * 0.9
  const x = (r * r - ir * ir + o * o) / (2 * o)
  const y = Math.sqrt(Math.max(0, r * r - x * x))
  return (
    "M" + f3(x) + " " + f3(-y) + " A" + f3(r) + " " + f3(r) + " 0 1 0 " + f3(x) + " " + f3(y) +
    " A" + f3(ir) + " " + f3(ir) + " 0 0 1 " + f3(x) + " " + f3(-y) + " Z"
  )
}

/** A tapered ray for the sun. */
export function sgzRayD(len: number, w: number) {
  return "M" + f3(-w) + " 0 L0 " + f3(-len) + " L" + f3(w) + " 0 Z"
}

// ---- clouds ------------------------------------------------------------------

export interface SgzPuff {
  x: number
  y: number
  r: number
}

/** A cumulus: a row of big puffs along the top, small ones rounding the base. Deterministic per seed. */
export function sgzCloud(seed: number, w: number, h: number) {
  const rnd = sgzRng(seed)
  const puffs: SgzPuff[] = []
  const n = 5 + Math.floor(rnd() * 2)
  const base = h * 0.5
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1)
    const profile = Math.pow(Math.sin(Math.PI * u), 0.55)
    const r = h * (0.24 + 0.3 * profile) * (0.86 + 0.28 * rnd())
    const x = -w / 2 + u * w + (rnd() - 0.5) * w * 0.05
    puffs.push({ x, y: base - r * 0.72 + (rnd() - 0.5) * h * 0.06, r })
  }
  const m = 3
  for (let i = 0; i < m; i++) {
    const u = (i + 0.5) / m
    const r = h * (0.24 + 0.08 * rnd())
    puffs.push({ x: -w / 2 + u * w * 0.86 + w * 0.07, y: base - r * 0.62, r })
  }
  puffs.push({ x: -w / 2 + w * (0.12 + rnd() * 0.1), y: base - h * 0.08, r: h * 0.14 })
  puffs.push({ x: w / 2 - w * (0.1 + rnd() * 0.1), y: base - h * 0.06, r: h * 0.12 })
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (const p of puffs) {
    minX = Math.min(minX, p.x - p.r)
    maxX = Math.max(maxX, p.x + p.r)
    minY = Math.min(minY, p.y - p.r)
    maxY = Math.max(maxY, p.y + p.r)
  }
  return { puffs, box: [minX, minY, maxX, maxY] }
}

// ---- layout ------------------------------------------------------------------

export interface SgzCloudSpot {
  x: number
  y: number
  w: number
  h: number
  seed: number
  depth: number
  /** Where it pours in from. */
  ox: number
  oy: number
  /** When it starts arriving, as progress. */
  at: number
}

/** The poster laid out for a box. Everything in pixels. */
export function sgzLayout(W: number, H: number, titleUnits: number, creditUnits: number) {
  const portrait = W < H * 1.05
  const aspect = portrait ? 1.3 : 2.25
  let ww = Math.min(W * (portrait ? 0.86 : 0.8), 1180)
  let wh = ww / aspect
  const maxH = H * (portrait ? 0.36 : 0.4)
  if (wh > maxH) {
    wh = maxH
    ww = wh * aspect
  }
  const wx = (W - ww) / 2
  const wy = H * (portrait ? 0.15 : 0.165)
  const a = ww * 0.145
  const eyeY = wh * 0.57
  const gap = ww * 0.235
  const sun = { x: ww / 2, y: wh * 0.17, r: wh * 0.105 }
  const moon = { x: Math.min(ww - wh * 0.14, ww / 2 + gap + a * 1.45), y: eyeY + a * 0.18, r: wh * 0.09 }
  const fs = Math.min(W, H)

  // the title fills the width under the window, never past 84% of the stage
  let th = Math.min(H * (portrait ? 0.085 : 0.12), (W * 0.84 * 100) / Math.max(1, titleUnits))
  th = Math.max(28, th)
  const titleY = wy + wh + H * (portrait ? 0.055 : 0.065)
  const subSize = Math.max(16, th * 0.5)
  const subY = titleY + th + th * 0.16
  const capY = subY + subSize * 1.35 + H * 0.025
  const creditH = Math.max(14, Math.min(fs * 0.034, (W * 0.3 * 100) / Math.max(1, creditUnits)))

  const cl = wx
  const cr = wx + ww
  const ct = wy
  const cb = wy + wh
  const clouds: SgzCloudSpot[] = [
    { x: cl + ww * 0.12, y: ct + wh * 0.03, w: ww * 0.44, h: ww * 0.16, seed: 11, depth: 0.6, ox: cl, oy: ct, at: 0.02 },
    { x: cr - ww * 0.02, y: ct + wh * 0.3, w: ww * 0.24, h: ww * 0.1, seed: 12, depth: 1, ox: cr, oy: ct + wh * 0.3, at: 0.3 },
    { x: cr - ww * 0.12, y: cb - wh * 0.1, w: ww * 0.4, h: ww * 0.15, seed: 13, depth: 0.8, ox: cr, oy: cb, at: 0.15 },
    { x: cl + ww * 0.08, y: cb - wh * 0.12, w: ww * 0.3, h: ww * 0.12, seed: 14, depth: 0.5, ox: cl, oy: cb, at: 0.45 },
    { x: cr - ww * 0.06, y: ct - wh * 0.08, w: ww * 0.2, h: ww * 0.085, seed: 15, depth: 1.25, ox: cr, oy: ct, at: 0.6 },
  ]

  // sparkles inside the window, in window space; and on the black, in stage space
  const lx = ww / 2 - gap
  const rx = ww / 2 + gap
  const sparks = [
    { x: lx - a * 1.32, y: eyeY - a * 0.78, r: a * 0.198, at: 0.12 },
    { x: lx - a * 1.08, y: eyeY + a * 0.52, r: a * 0.099, at: 0.5 },
    { x: lx - a * 0.1, y: eyeY - a * 1.2, r: a * 0.081, at: 0.74 },
    { x: rx - a * 0.5, y: eyeY - a * 1.05, r: a * 0.126, at: 0.34 },
    { x: rx + a * 1.5, y: eyeY - a * 0.62, r: a * 0.16, at: 0.22 },
    { x: rx + a * 0.95, y: eyeY + a * 0.72, r: a * 0.09, at: 0.62 },
    { x: sun.x + sun.r * 2.6, y: sun.y - sun.r * 0.3, r: a * 0.09, at: 0.42 },
    { x: sun.x - sun.r * 2.4, y: sun.y + sun.r * 0.5, r: a * 0.072, at: 0.86 },
  ]
  const stageSparks = [
    { x: wx - ww * 0.035, y: wy + wh * 0.6, r: a * 0.135, at: 0.28 },
    { x: wx + ww * 1.035, y: wy + wh * 0.82, r: a * 0.099, at: 0.55 },
    { x: wx + ww * 0.3, y: wy - wh * 0.06, r: a * 0.081, at: 0.7 },
    { x: wx + ww * 0.6, y: wy + wh * 1.08, r: a * 0.072, at: 0.92 },
  ]

  return {
    portrait,
    win: { x: wx, y: wy, w: ww, h: wh },
    a,
    eyeY,
    lx,
    rx,
    sun,
    moon,
    title: { y: titleY, h: th },
    sub: { y: subY, size: subSize },
    cap: { y: capY },
    creditH,
    fs,
    clouds,
    sparks,
    stageSparks,
  }
}
// ---- the painting ----------------------------------------------------------------
// The skin is brushed onto a canvas once per size. These two functions decide
// how light every point is and which way the brush travels there.

export interface SgzLay {
  win: { x: number; y: number; w: number; h: number }
  a: number
  eyeY: number
  lx: number
  rx: number
  sun: { x: number; y: number; r: number }
}

const sq = (x: number) => x * x

/** How lit the skin is at a point of the window, 0 (deep shadow) to 1 (highlight). */
export function sgzSkinTone(x: number, y: number, lay: SgzLay) {
  const w = lay.win.w
  const h = lay.win.h
  const a = lay.a
  let t = 0.5
  // the sun warms the forehead
  t += 0.24 * Math.exp(-(sq((x - lay.sun.x) / (w * 0.3)) + sq((y - lay.sun.y) / (h * 0.42))))
  for (const cx of [lay.lx, lay.rx]) {
    const side = cx < w / 2 ? -1 : 1
    const ex = ((x - cx) / a) * side
    const ey = (y - lay.eyeY) / a
    // shadow pooled in the socket
    t -= 0.26 * Math.exp(-(sq(ex * 0.72) + sq((ey + 0.12) * 1.35)) * 1.25)
    // the brow bone catches the light
    t += 0.14 * Math.exp(-(sq((ex - 0.15) * 0.62) + sq((ey + 1.72) * 2.4)))
    // the lid between crease and brow
    t += 0.07 * Math.exp(-(sq(ex * 0.95) + sq((ey + 0.86) * 4)))
    // the cheekbone
    t += 0.2 * Math.exp(-(sq((ex - 0.2) * 0.8) + sq((ey - 1.08) * 2)))
  }
  // the bridge of the nose, lit, with shadowed flanks
  const nx = (x - w / 2) / a
  const below = clamp01((y - (lay.eyeY - a * 0.95)) / (a * 0.7))
  t += below * (0.15 * Math.exp(-sq(nx / 0.2)) - 0.12 * Math.exp(-sq((Math.abs(nx) - 0.48) / 0.18)))
  // and the edges fall into shadow
  const ux = Math.min(x, w - x) / h
  const uy = Math.min(y, h - y) / h
  t -= 0.22 * Math.exp(-ux * 7) + 0.2 * Math.exp(-uy * 7)
  return clamp01(t)
}

/** The brush's direction at a point, in radians: round the eyes, round the sun, down the nose, else across. */
export function sgzFlow(x: number, y: number, lay: SgzLay) {
  const w = lay.win.w
  const a = lay.a
  let fx = 1
  let fy = 0.18 * Math.sin((x / w) * 7 + y / (a * 1.3))
  const blend = (vx: number, vy: number, g: number) => {
    const l = Math.hypot(vx, vy) || 1
    let ux = vx / l
    let uy = vy / l
    if (ux < 0) {
      ux = -ux
      uy = -uy
    }
    fx = fx * (1 - g) + ux * g
    fy = fy * (1 - g) + uy * g
  }
  for (const cx of [lay.lx, lay.rx]) {
    const ux = (x - cx) / a
    const uy = (y - lay.eyeY) / a + 0.15
    const g = Math.exp(-(sq(ux * 0.62) + sq(uy * 0.95)) * 0.9)
    blend(-uy / 0.49, ux, g)
  }
  const sx = x - lay.sun.x
  const sy = y - lay.sun.y
  blend(-sy, sx, Math.exp(-(sq(sx / (w * 0.16)) + sq(sy / (lay.win.h * 0.3)))) * 0.85)
  const below = clamp01((y - (lay.eyeY - a * 0.9)) / (a * 0.6))
  const gn = Math.exp(-sq((x - w / 2) / (a * 0.32))) * below
  fx = fx * (1 - gn)
  fy = fy * (1 - gn) + gn
  return Math.atan2(fy, fx)
}

/** Gold filigree in eye space: from beside the sun, over the brow, round the outer corner, into a curl on the cheek. */
export function sgzFiligreeD() {
  const pts: number[][] = []
  const a1 = [[-1.32, -1.28], [-0.6, -1.78], [0.95, -1.86], [1.45, -1.1]]
  const a2 = [[1.45, -1.1], [1.7, -0.6], [1.62, 0.15], [1.36, 0.42]]
  for (let i = 0; i <= 30; i++) pts.push(bez(a1, i / 30))
  for (let i = 1; i <= 20; i++) pts.push(bez(a2, i / 20))
  const c = [1.16, 0.52]
  const end = pts[pts.length - 1]
  const r0 = Math.hypot(end[0] - c[0], end[1] - c[1])
  const t0 = Math.atan2(end[1] - c[1], end[0] - c[0])
  for (let i = 1; i <= 46; i++) {
    const th = (i / 46) * Math.PI * 2.3
    const r = r0 * Math.exp(-0.3 * th)
    pts.push([c[0] + r * Math.cos(t0 + th), c[1] + r * Math.sin(t0 + th)])
  }
  return "M" + pts.map((q) => f3(q[0]) + " " + f3(q[1])).join(" L")
}
// #endregion

// ---- the painters: canvas, run once per size ---------------------------------------
function sgzRgb(hex: string) {
  const h = hex.replace("#", "")
  const full = h.length === 3 ? h.split("").map((ch) => ch + ch).join("") : h
  const out = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16))
  return out.some((v) => isNaN(v)) ? [200, 110, 50] : out
}
const mixC = (p: number[], q: number[], t: number) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t]
const rgba = (c: number[], al: number) =>
  "rgba(" + Math.round(c[0]) + "," + Math.round(c[1]) + "," + Math.round(c[2]) + "," + al.toFixed(3) + ")"

function sizeCanvas(canvas: HTMLCanvasElement, w: number, h: number, dpr: number) {
  canvas.width = Math.max(1, Math.round(w * dpr))
  canvas.height = Math.max(1, Math.round(h * dpr))
  return canvas.getContext("2d")
}

function paintSkin(canvas: HTMLCanvasElement, lay: SgzLay, pal: SaffronGazePalette, dpr: number) {
  const w = lay.win.w
  const h = lay.win.h
  const ctx = sizeCanvas(canvas, w, h, dpr)
  if (!ctx) return
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  const deep = sgzRgb(pal.skinDeep)
  const mid = sgzRgb(pal.skin)
  const light = sgzRgb(pal.skinLight)
  const cream = sgzRgb(pal.cream)
  const ink = sgzRgb(pal.ink)
  const stage = sgzRgb(pal.stage)
  const tone = (t: number) =>
    t < 0.5 ? mixC(deep, mid, t / 0.5) : t < 0.86 ? mixC(mid, light, (t - 0.5) / 0.36) : mixC(light, cream, Math.min(1, (t - 0.86) / 0.14) * 0.55)
  const unit = Math.max(0.35, w / 1000)
  const rnd = sgzRng(31)

  // 1. the underpainting: the tone map, sampled coarse and smoothed by scaling up
  const gw = 120
  const gh = Math.max(8, Math.round((gw * h) / w))
  const small = document.createElement("canvas")
  small.width = gw
  small.height = gh
  const sctx = small.getContext("2d")
  if (sctx) {
    const img = sctx.createImageData(gw, gh)
    for (let j = 0; j < gh; j++) {
      for (let i = 0; i < gw; i++) {
        const c = tone(sgzSkinTone(((i + 0.5) / gw) * w, ((j + 0.5) / gh) * h, lay))
        const k = (j * gw + i) * 4
        img.data[k] = c[0]
        img.data[k + 1] = c[1]
        img.data[k + 2] = c[2]
        img.data[k + 3] = 255
      }
    }
    sctx.putImageData(img, 0, 0)
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = "high"
    ctx.drawImage(small, 0, 0, w, h)
  }

  // 2. brushwork: broad strokes first, then finer ones, all following the form
  ctx.lineCap = "round"
  const n = Math.round((w * h) / 34)
  for (let i = 0; i < n; i++) {
    const broad = i < n * 0.28
    const x = rnd() * w
    const y = rnd() * h
    const t = sgzSkinTone(x, y, lay) + (rnd() - 0.5) * (broad ? 0.12 : 0.2)
    const ang = sgzFlow(x, y, lay) + (rnd() - 0.5) * 0.3
    const len = (9 + 20 * rnd()) * unit * (broad ? 2.4 : 1)
    const dx = (Math.cos(ang) * len) / 2
    const dy = (Math.sin(ang) * len) / 2
    const bend = (rnd() - 0.5) * len * 0.3
    ctx.strokeStyle = rgba(tone(clamp01(t)), (broad ? 0.16 : 0.22) + 0.36 * rnd())
    ctx.lineWidth = (1.6 + 3.8 * rnd()) * unit * (broad ? 2.6 : 1)
    ctx.beginPath()
    ctx.moveTo(x - dx, y - dy)
    ctx.quadraticCurveTo(x - Math.sin(ang) * bend, y + Math.cos(ang) * bend, x + dx, y + dy)
    ctx.stroke()
  }

  // 3. hair falls in at the corners and down the sides
  const hairline = (x: number) => {
    const d = Math.abs(x - w / 2) / (w / 2)
    return h * (-0.06 + 0.4 * Math.pow(d, 2.6)) + h * 0.9 * sq(Math.max(0, d - 0.95) / 0.05)
  }
  ctx.fillStyle = rgba(ink, 0.9)
  ctx.beginPath()
  ctx.moveTo(-2, -2)
  for (let k = 0; k <= 80; k++) {
    const x = (k / 80) * w
    ctx.lineTo(x, Math.max(-2, hairline(x) - 6 * unit))
  }
  ctx.lineTo(w + 2, -2)
  ctx.closePath()
  ctx.fill()
  const strands = Math.round(w * 1.1)
  for (let i = 0; i < strands; i++) {
    const x0 = rnd() * w
    const hl = hairline(x0)
    if (hl < 4 * unit) continue
    const d = Math.abs(x0 - w / 2) / (w / 2)
    const sgn = x0 < w / 2 ? -1 : 1
    const y0 = rnd() * hl - h * 0.02
    const ang = Math.atan2(0.3 + 1.7 * d, sgn * (1.25 - d * 0.9)) + (rnd() - 0.5) * 0.25
    const len = (30 + 80 * rnd()) * unit
    const x1 = x0 + Math.cos(ang) * len
    const y1 = y0 + Math.sin(ang) * len
    const warm = rnd() < 0.22
    ctx.strokeStyle = rgba(warm ? mixC(ink, deep, 0.6) : ink, warm ? 0.4 + 0.3 * rnd() : 0.6 + 0.35 * rnd())
    ctx.lineWidth = (0.7 + 2.2 * rnd()) * unit
    ctx.beginPath()
    ctx.moveTo(x0, y0)
    ctx.quadraticCurveTo(x0 + Math.cos(ang) * len * 0.5 + sgn * len * 0.12, y0 + Math.sin(ang) * len * 0.5 - len * 0.1, x1, y1)
    ctx.stroke()
  }

  // 4. a dry-brush edge, so the window reads as paint laid on black
  ctx.strokeStyle = rgba(stage, 1)
  const edge = (x0: number, y0: number, x1: number, y1: number, nx: number, ny: number) => {
    const L = Math.hypot(x1 - x0, y1 - y0)
    const k = Math.round(L / (3.2 * unit))
    for (let i = 0; i < k; i++) {
      const u = rnd()
      const px = x0 + (x1 - x0) * u
      const py = y0 + (y1 - y0) * u
      const depth = Math.pow(rnd(), 2.4) * 0.022 * h + 1.5 * unit
      const skew = (rnd() - 0.5) * depth * 1.6
      ctx.globalAlpha = 0.5 + 0.5 * rnd()
      ctx.lineWidth = (2.5 + 6 * rnd()) * unit
      ctx.beginPath()
      ctx.moveTo(px - nx * 3, py - ny * 3)
      ctx.lineTo(px + nx * depth + ny * skew, py + ny * depth + nx * skew)
      ctx.stroke()
    }
    ctx.globalAlpha = 1
  }
  edge(0, 0, w, 0, 0, 1)
  edge(0, h, w, h, 0, -1)
  edge(0, 0, 0, h, 1, 0)
  edge(w, 0, w, h, -1, 0)
}

function paintCloud(canvas: HTMLCanvasElement, shape: { puffs: SgzPuff[]; box: number[] }, spot: SgzCloudSpot, lay: SgzLay, pal: SaffronGazePalette, dpr: number) {
  const [bx0, by0, bx1, by1] = shape.box
  const pad = spot.h * 0.12
  const ctx = sizeCanvas(canvas, bx1 - bx0 + pad * 2, by1 - by0 + pad * 2, dpr)
  if (!ctx) return
  ctx.setTransform(dpr, 0, 0, dpr, (pad - bx0) * dpr, (pad - by0) * dpr)
  // lit from the sun on the forehead, and from above
  const sunX = lay.win.x + lay.sun.x
  const sunY = lay.win.y + lay.sun.y
  let lx = sunX - spot.x
  let ly = sunY - spot.y
  const ll = Math.hypot(lx, ly) || 1
  lx = (lx / ll) * 0.6
  ly = (ly / ll) * 0.6 - 0.45
  let lz = 0.65
  const lm = Math.hypot(lx, ly, lz)
  lx /= lm
  ly /= lm
  lz /= lm
  const deep = sgzRgb(pal.cloudDeep)
  const mid = sgzRgb(pal.cloud)
  const light = sgzRgb(pal.cloudLight)
  const cream = sgzRgb(pal.cream)
  const shade = (t: number) =>
    t < 0.4 ? mixC(deep, mid, t / 0.4) : t < 0.78 ? mixC(mid, light, (t - 0.4) / 0.38) : mixC(light, cream, ((t - 0.78) / 0.22) * 0.85)
  const rnd = sgzRng(spot.seed * 7 + 1)
  const sx = lx / Math.max(0.2, Math.hypot(lx, ly))
  const top = by0
  const bottom = spot.h * 0.5
  const span = Math.max(1, bottom - top)
  // a flat, slightly wavy underside, the way cumulus sits on its condensation line
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(bx0 - pad, by0 - pad)
  ctx.lineTo(bx1 + pad, by0 - pad)
  for (let k = 40; k >= 0; k--) {
    const x = bx0 - pad + ((bx1 - bx0 + pad * 2) * k) / 40
    ctx.lineTo(x, bottom + spot.h * (0.03 + 0.025 * Math.sin(k * 1.3 + spot.seed)))
  }
  ctx.closePath()
  ctx.clip()
  // back lobes first, the low front ones over them: each lit top lands on the shadowed belly behind it
  const puffs = [...shape.puffs].sort((p, q) => p.y - q.y)
  for (const p of puffs) {
    const vy = clamp01((p.y - top) / span)
    const g = ctx.createLinearGradient(0, p.y - p.r, 0, p.y + p.r)
    g.addColorStop(0, rgba(shade(0.74 - vy * 0.2), 1))
    g.addColorStop(0.55, rgba(shade(0.5 - vy * 0.18), 1))
    g.addColorStop(1, rgba(shade(0.22 - vy * 0.1), 1))
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
    ctx.fill()
    const n = Math.max(60, Math.min(1400, Math.round((p.r * p.r) / 7)))
    for (let i = 0; i < n; i++) {
      const ang = rnd() * Math.PI * 2
      const rr = Math.pow(rnd(), 0.42) * 1.03
      const px = Math.cos(ang) * rr
      const py = Math.sin(ang) * rr
      const gy = clamp01((p.y + py * p.r - top) / span)
      let t = 0.58 - py * 0.4 + px * sx * 0.14 - gy * 0.3 + (rnd() - 0.5) * 0.16
      // the sunlit crown of each lobe
      if (rr > 0.66 && py < -0.1) t += (rr - 0.66) * 1.5 * Math.min(1, -py * 1.8)
      ctx.fillStyle = rgba(shade(clamp01(t)), 0.4 + 0.45 * rnd())
      const len = p.r * (0.08 + 0.12 * rnd())
      ctx.beginPath()
      ctx.ellipse(p.x + px * p.r, p.y + py * p.r, len, len * (0.32 + 0.2 * rnd()), ang + Math.PI / 2 + (rnd() - 0.5) * 0.5, 0, Math.PI * 2)
      ctx.fill()
    }
    // a thin catch of light along the crown
    const a0 = -Math.PI / 2 + sx * 0.35
    ctx.lineCap = "round"
    ctx.strokeStyle = rgba(cream, 0.55)
    ctx.lineWidth = p.r * 0.035
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.r * 0.95, a0 - 0.9, a0 + 0.9)
    ctx.stroke()
  }
  ctx.restore()
}

// ---- iris striations, built once ------------------------------------------------
function irisLines(seed: number, dark: boolean) {
  const rnd = sgzRng(seed)
  let d = ""
  for (let i = 0; i < 46; i++) {
    const th = (i / 46) * Math.PI * 2 + (rnd() - 0.5) * 0.08
    const r0 = 0.2 + rnd() * 0.04
    const r1 = dark ? 0.45 : 0.3 + rnd() * 0.12
    d += "M" + f3(Math.cos(th) * r0) + " " + f3(Math.sin(th) * r0) + " L" + f3(Math.cos(th) * r1) + " " + f3(Math.sin(th) * r1)
  }
  return d
}
const IRIS_DARK = irisLines(3, true)
const IRIS_LIGHT = irisLines(4, false)
const BROW_D = sgzBrowD()
const BROW_HAIRS = sgzBrowHairs(70, 5)
const LOWER_LASHES = sgzLowerLashes(6, 6)
const CURL_D = sgzCurlD()
const FILIGREE_D = sgzFiligreeD()
const SPIRAL_D = sgzSpiralD()
const LASH_COUNT = 24
// [angle, length × sun radius, half-width × sun radius]: long across the brow, shorter up and down, short diagonals
const SUN_RAYS = [
  [90, 2.9, 0.07],
  [270, 2.9, 0.07],
  [0, 1.55, 0.065],
  [180, 1.25, 0.06],
  [45, 1.0, 0.05],
  [135, 1.0, 0.05],
  [225, 1.0, 0.05],
  [315, 1.0, 0.05],
]

// ---- the stylesheet -----------------------------------------------------------------

const SGZ_CSS = `
.sgz-root {
  position: relative;
  width: 100%;
  overflow: hidden;
  isolation: isolate;
  font-family: var(--sgz-sans);
  color: var(--sgz-text);
  --sgz-out: cubic-bezier(0.16, 1, 0.3, 1);
  --sgz-in: cubic-bezier(0.7, 0, 0.84, 0);
  --sgz-snap: cubic-bezier(0.76, 0, 0.24, 1);
}
.sgz-root[data-phase="done"] { height: auto !important; overflow: visible; }
.sgz-root svg, .sgz-root img { max-width: none; display: block; }
.sgz-root * { box-sizing: border-box; }
.sgz-dest { position: absolute; inset: 0; overflow: auto; opacity: 0; pointer-events: none; }
.sgz-root[data-step="part"] .sgz-dest, .sgz-root[data-phase="done"] .sgz-dest { opacity: 1; pointer-events: auto; }
.sgz-root[data-phase="done"] .sgz-dest { position: static; overflow: visible; }

.sgz-gate {
  position: absolute;
  inset: 0;
  z-index: 10;
  outline: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}
.sgz-gate:focus-visible .sgz-focus { opacity: 1; }
.sgz-focus {
  position: absolute; inset: 10px; border: 1px solid var(--sgz-cream); opacity: 0; pointer-events: none; z-index: 30;
  transition: opacity 0.2s;
}
.sgz-panel { position: absolute; left: 0; right: 0; height: 50%; background: var(--sgz-stage); z-index: 1; }
.sgz-panel-top { top: 0; }
.sgz-panel-bot { bottom: 0; }
.sgz-panel::after {
  content: ""; position: absolute; left: 0; right: 0; height: 2px;
  background: var(--sgz-cream);
  box-shadow: 0 0 10px 1px var(--sgz-title), 0 0 30px 4px rgba(240, 160, 72, 0.35);
  opacity: 0; transition: opacity 0.25s;
}
.sgz-panel-top::after { bottom: -1px; }
.sgz-panel-bot::after { top: -1px; }
.sgz-root[data-step="part"] .sgz-panel { transition: transform 1.05s var(--sgz-snap); }
.sgz-root[data-step="part"] .sgz-panel-top { transform: translateY(-100%); }
.sgz-root[data-step="part"] .sgz-panel-bot { transform: translateY(100%); }
.sgz-root[data-step="part"] .sgz-panel::after { opacity: 1; }

.sgz-scene { position: absolute; inset: 0; z-index: 2; }
.sgz-root[data-step="close"] .sgz-scene, .sgz-root[data-step="slit"] .sgz-scene, .sgz-root[data-step="line"] .sgz-scene, .sgz-root[data-step="part"] .sgz-scene { pointer-events: none; }

.sgz-window {
  position: absolute;
  overflow: hidden;
  border-radius: 2px;
  clip-path: inset(50% 0 50% 0);
  background: var(--sgz-skin);
  z-index: 3;
}
.sgz-root[data-open="1"] .sgz-window { clip-path: inset(0 0 0 0); transition: clip-path 0.95s var(--sgz-out) 0.2s; }
.sgz-root[data-step="slit"] .sgz-window, .sgz-root[data-step="line"] .sgz-window, .sgz-root[data-step="part"] .sgz-window {
  clip-path: inset(50% 0 50% 0); transition: clip-path 0.5s var(--sgz-in);
}
.sgz-vignette {
  position: absolute; inset: 0; pointer-events: none;
  box-shadow: inset 0 0 calc(var(--sgz-wh) * 0.22) rgba(40, 12, 2, 0.5), inset 0 0 3px rgba(40, 12, 2, 0.6);
}
.sgz-window-glow {
  position: absolute; z-index: 2; pointer-events: none; border-radius: 4px;
  box-shadow: 0 0 24px 2px rgba(224, 127, 60, 0.18);
  opacity: 0; transition: opacity 0.8s ease 0.6s;
}
.sgz-root[data-open="1"] .sgz-window-glow { opacity: 1; }
.sgz-root[data-step] .sgz-window-glow { opacity: 0; transition: opacity 0.3s; }

.sgz-slit {
  position: absolute; left: 50%; height: 2px; z-index: 4; pointer-events: none;
  background: var(--sgz-cream);
  box-shadow: 0 0 10px 1px var(--sgz-title), 0 0 28px 4px rgba(240, 160, 72, 0.4);
  transform: translate(-50%, -50%) scaleX(0);
  opacity: 0;
}
.sgz-root[data-phase="intro"] .sgz-slit { animation: sgz-slit-in 1.3s var(--sgz-out) both; }
.sgz-root[data-step="slit"] .sgz-slit { opacity: 1; transform: translate(-50%, -50%) scaleX(1); transition: opacity 0.35s ease 0.2s; }
.sgz-root[data-step="line"] .sgz-slit { opacity: 1; transform: translate(-50%, -50%) scaleX(var(--sgz-stretch)); transition: transform 0.38s var(--sgz-out); }
.sgz-root[data-step="part"] .sgz-slit { opacity: 0; transform: translate(-50%, -50%) scaleX(var(--sgz-stretch)); transition: opacity 0.1s; }
.sgz-root[data-step="shrink"] .sgz-slit { opacity: 0; transform: translate(-50%, -50%) scaleX(0); transition: transform 0.45s var(--sgz-in), opacity 0.3s ease 0.2s; }
@keyframes sgz-slit-in {
  0% { opacity: 0; transform: translate(-50%, -50%) scaleX(0); }
  18% { opacity: 1; transform: translate(-50%, -50%) scaleX(1); }
  60% { opacity: 1; }
  100% { opacity: 0; transform: translate(-50%, -50%) scaleX(1); }
}

.sgz-cloud { position: absolute; z-index: 4; pointer-events: none; will-change: transform, opacity; opacity: 0; }
.sgz-skin { position: absolute; left: 0; top: 0; }
.sgz-stars { position: absolute; inset: 0; z-index: 5; pointer-events: none; overflow: visible; }

.sgz-spark { transform-box: fill-box; transform-origin: center; transform: scale(0); opacity: 0; fill: var(--sgz-cream); }
.sgz-spark[data-lit="1"] { transform: scale(1); opacity: 1; transition: transform 0.55s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s; }
.sgz-root[data-phase="hold"] .sgz-spark[data-lit="1"], .sgz-root[data-phase="awaken"] .sgz-spark[data-lit="1"] { animation: sgz-twinkle 2.6s ease-in-out infinite; animation-delay: var(--d); }
@keyframes sgz-twinkle {
  0%, 100% { transform: scale(1) rotate(0deg); opacity: 1; }
  50% { transform: scale(0.72) rotate(12deg); opacity: 0.75; }
}
.sgz-root[data-step] .sgz-spark { opacity: 0; transform: scale(0); transition: opacity 0.25s, transform 0.3s var(--sgz-in); animation: none; }

.sgz-rays { transform-box: fill-box; transform-origin: center; }
.sgz-root[data-phase="awaken"] .sgz-rays { animation: sgz-rays 1.1s var(--sgz-out) both; }
.sgz-root[data-phase="hold"] .sgz-rays-b { animation: sgz-turn 90s linear infinite; }
@keyframes sgz-rays { 0% { transform: scale(1); } 22% { transform: scale(1.22); } 100% { transform: scale(1); } }
@keyframes sgz-turn { to { transform: rotate(360deg); } }
.sgz-halo { transform-box: fill-box; transform-origin: center; fill: none; stroke: var(--sgz-cream); stroke-width: 1.5; opacity: 0; }
.sgz-root[data-phase="awaken"] .sgz-halo { animation: sgz-halo 1.3s var(--sgz-out) both; }
.sgz-root[data-phase="awaken"] .sgz-halo-2 { animation-delay: 0.18s; }
@keyframes sgz-halo { 0% { transform: scale(0.3); opacity: 0.9; } 100% { transform: scale(4.2); opacity: 0; } }
.sgz-glow { transition: opacity 0.6s ease; }

.sgz-moon { transform-box: fill-box; transform-origin: center; transform: scale(0.5) rotate(-30deg); opacity: 0; transition: transform 0.9s var(--sgz-out), opacity 0.7s ease; }
.sgz-root[data-phase="awaken"] .sgz-moon, .sgz-root[data-phase="hold"] .sgz-moon { transform: scale(1) rotate(0deg); opacity: 1; transition-delay: 0.25s; }
.sgz-curl { fill: none; stroke: var(--sgz-cream); stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 1 1; stroke-dashoffset: 1; opacity: 0.85; }
.sgz-root[data-phase="awaken"] .sgz-curl, .sgz-root[data-phase="hold"] .sgz-curl { stroke-dashoffset: 0; transition: stroke-dashoffset 1.3s var(--sgz-out) 0.3s; }
.sgz-curl-glow { opacity: 0.55; stroke: var(--sgz-title); }
.sgz-curl-gold { stroke: var(--sgz-title); opacity: 0.9; }

.sgz-brow { transition: transform 0.7s var(--sgz-out); }
.sgz-root[data-phase="awaken"] .sgz-brow { animation: sgz-brow 1.2s var(--sgz-out) both; }
@keyframes sgz-brow { 0% { transform: translateY(0); } 30% { transform: translateY(-0.07px); } 100% { transform: translateY(0); } }
.sgz-hit { fill: transparent; cursor: pointer; }
.sgz-layer { position: absolute; left: 0; top: 0; }
.sgz-photo { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; max-width: none; user-select: none; }
.sgz-veil { position: absolute; inset: 0; background: var(--sgz-stage); opacity: 0.55; pointer-events: none; transition: opacity 0.9s var(--sgz-out); }
.sgz-root[data-phase="awaken"] .sgz-veil, .sgz-root[data-phase="hold"] .sgz-veil { opacity: 0 !important; }

.sgz-text { position: absolute; z-index: 6; pointer-events: none; opacity: 0; transform: translateY(8px); transition: opacity 0.8s ease, transform 0.9s var(--sgz-out); }
.sgz-root[data-open="1"] .sgz-text { opacity: 1; transform: translateY(0); }
.sgz-root[data-open="1"] .sgz-kicker { transition-delay: 0.35s; }
.sgz-root[data-open="1"] .sgz-badge { transition-delay: 0.5s; }
.sgz-root[data-open="1"] .sgz-credit { transition-delay: 0.65s; }
.sgz-root[data-open="1"] .sgz-title-wrap { transition-delay: 0.45s; }
.sgz-root[data-open="1"] .sgz-cap { transition-delay: 0.7s; }
.sgz-root[data-step] .sgz-text { opacity: 0; transform: translateY(10px); transition: opacity 0.35s ease, transform 0.4s var(--sgz-in); }

.sgz-kicker { top: 5.5%; left: 0; right: 0; text-align: center; text-transform: uppercase; letter-spacing: 0.32em; line-height: 1.2; }
.sgz-kicker small { display: block; margin-top: 0.4em; letter-spacing: 0.42em; font-size: 0.72em; opacity: 0.7; }
.sgz-badge { top: 4.5%; right: 4%; }
.sgz-credit { left: 4%; bottom: 4.5%; text-transform: uppercase; letter-spacing: 0.22em; line-height: 1.35; }
.sgz-credit .sgz-eyebrow { font-size: 0.78em; opacity: 0.8; margin-bottom: 0.5em; }
.sgz-credit .sgz-note { font-size: 0.78em; opacity: 0.8; margin-top: 0.45em; }
.sgz-credit svg { fill: var(--sgz-title); }

.sgz-title-wrap { left: 0; right: 0; display: flex; flex-direction: column; align-items: center; }
.sgz-title { overflow: visible; }
.sgz-title-ghost { fill: var(--sgz-title); opacity: 0.13; }
.sgz-title-edge { fill: var(--sgz-cream); }
.sgz-title-fill { fill: var(--sgz-title); }
.sgz-shine { transform: translateX(-120px); }
.sgz-root[data-phase="awaken"] .sgz-shine { animation: sgz-shine 1s var(--sgz-out) 0.15s both; }
@keyframes sgz-shine { 0% { transform: translateX(-120px); } 100% { transform: translateX(var(--sgz-tw)); } }
.sgz-root[data-phase="awaken"] .sgz-title { animation: sgz-pop 0.9s var(--sgz-out) both; }
@keyframes sgz-pop { 0% { transform: scale(1); } 25% { transform: scale(1.03); } 100% { transform: scale(1); } }
.sgz-sub { font-family: var(--sgz-script); font-weight: 700; color: var(--sgz-title); line-height: 1.25; text-align: center; opacity: 0; transform: translateY(10px); transition: opacity 0.7s ease, transform 0.8s var(--sgz-out); }
.sgz-root[data-phase="awaken"] .sgz-sub, .sgz-root[data-phase="hold"] .sgz-sub { opacity: 1; transform: translateY(0); transition-delay: 0.4s; }

.sgz-cap { left: 0; right: 0; text-align: center; text-transform: uppercase; letter-spacing: 0.36em; line-height: 1.3; }
.sgz-cap-line { position: relative; height: 1.3em; }
.sgz-cap-line > span { position: absolute; left: 0; right: 0; transition: opacity 0.5s ease, transform 0.6s var(--sgz-out); }
.sgz-cap-line > .sgz-cap-enter { opacity: 0; transform: translateY(6px); }
.sgz-root[data-phase="hold"] .sgz-cap-load, .sgz-root[data-phase="awaken"] .sgz-cap-load { opacity: 0; transform: translateY(-6px); }
.sgz-root[data-phase="hold"] .sgz-cap-enter, .sgz-root[data-phase="awaken"] .sgz-cap-enter { opacity: 1; transform: translateY(0); transition-delay: 0.55s; }
.sgz-root[data-phase="hold"] .sgz-cap-enter { animation: sgz-breathe 2.4s ease-in-out 1.2s infinite; }
@keyframes sgz-breathe { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }
.sgz-cap-sub { font-family: var(--sgz-script); text-transform: none; letter-spacing: 0.1em; opacity: 0.8; margin-top: 0.55em; font-size: 0.95em; }
.sgz-pct { font-variant-numeric: tabular-nums; }

.sgz-grain { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 8; pointer-events: none; opacity: 0.07; mix-blend-mode: screen; }
.sgz-root[data-step="part"] .sgz-grain { opacity: 0; transition: opacity 0.5s; }
.sgz-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }

@media (prefers-reduced-motion: reduce) {
  .sgz-root[data-open="1"] .sgz-window { transition: none; }
  .sgz-root[data-phase="intro"] .sgz-slit { animation: none; opacity: 0; }
  .sgz-cloud, .sgz-spark, .sgz-rays, .sgz-halo, .sgz-moon, .sgz-curl, .sgz-brow, .sgz-shine, .sgz-title, .sgz-sub, .sgz-text, .sgz-cap-line span, .sgz-panel {
    animation: none !important; transition-duration: 0.4s !important; transition-property: opacity !important; transform: none !important;
  }
  .sgz-spark[data-lit="1"] { transform: none !important; }
  .sgz-curl { stroke-dashoffset: 0; }
  .sgz-root[data-step] .sgz-panel { opacity: 0; }
  .sgz-root[data-step] .sgz-scene, .sgz-root[data-step] .sgz-slit, .sgz-root[data-step] .sgz-grain { opacity: 0; transition: opacity 0.4s; }
}
`

// ---- component ----------------------------------------------------------------------

type Phase = "intro" | "load" | "awaken" | "hold" | "lift" | "set" | "done"
type Step = "" | "close" | "slit" | "line" | "part" | "shrink"

const INTRO_MS = 1150
const AWAKEN_MS = 1700
const EYE_OPEN_AT = 90

interface EyeRefs {
  ap: SVGPathElement | null
  kajal: SVGPathElement | null
  shadow: SVGPathElement | null
  lashes: (SVGPathElement | null)[]
  iris: SVGGElement | null
  brow: SVGGElement | null
}
const emptyEye = (): EyeRefs => ({ ap: null, kajal: null, shadow: null, lashes: [], iris: null, brow: null })

export default function SaffronGazePreloader({
  children,
  loop = false,
  progress,
  durationMs = 4600,
  holdMs = 3400,
  autoEnter = true,
  title = "DARSHAN",
  subtitle = "दर्शन",
  kicker = "Nayana Studio",
  kickerSub = "presents",
  loadingLabel = "Loading",
  loadingSub = "बस कुछ ही पलों में",
  enterLabel = "Click to enter",
  enterSub = "प्रवेश करें",
  credit = { eyebrow: "Portfolio · Volume three", name: "NAYANA", note: "Design & motion studio" },
  monogram = "N",
  image,
  imagePosition = "50% 35%",
  palette,
  gaze = 1,
  blink = true,
  counter = true,
  fontFamily = SANS_STACK,
  scriptFontFamily = SCRIPT_STACK,
  height = "100svh",
  onComplete,
  className = "",
}: SaffronGazePreloaderProps) {
  const [phase, setPhase] = React.useState("intro" as Phase)
  const [step, setStep] = React.useState("" as Step)
  const [open, setOpen] = React.useState(false)
  const [pct, setPct] = React.useState(0)
  const [cycle, setCycle] = React.useState(0)
  const [size, setSize] = React.useState({ w: 1280, h: 800 })

  const uid = React.useId().replace(/[^a-zA-Z0-9_-]/g, "")
  const rootRef = React.useRef(null as HTMLDivElement | null)
  const destRef = React.useRef(null as HTMLDivElement | null)
  const gateRef = React.useRef(null as HTMLDivElement | null)
  const titleClipRef = React.useRef(null as SVGRectElement | null)
  const titleEdgeRef = React.useRef(null as SVGRectElement | null)
  const raysRef = React.useRef(null as SVGGElement | null)
  const glowRef = React.useRef(null as SVGCircleElement | null)
  const cloudRefs = React.useRef([] as (HTMLCanvasElement | null)[])
  const skinRef = React.useRef(null as HTMLCanvasElement | null)
  const sparkRefs = React.useRef([] as (SVGPathElement | null)[])
  const eyeRefs = React.useRef([emptyEye(), emptyEye()])
  const phaseRef = React.useRef("intro" as Phase)
  const phaseAtRef = React.useRef(0)
  const stepRef = React.useRef("" as Step)
  const stepAtRef = React.useRef(0)
  const shownRef = React.useRef(0)
  const rushRef = React.useRef(false)
  const progressRef = React.useRef(progress)
  progressRef.current = progress
  const onCompleteRef = React.useRef(onComplete)
  onCompleteRef.current = onComplete
  const loopRef = React.useRef(loop)
  loopRef.current = loop
  const pointerRef = React.useRef(null as { x: number; y: number } | null)
  const eyeStateRef = React.useRef({
    open: [0, 0],
    vel: [0, 0],
    gx: 0,
    gy: 0,
    tx: 0,
    ty: 0,
    idleAt: 0,
    blinkAt: 0,
    blinkStart: -1,
    wink: [-1, -1],
    written: [-1, -1],
  })
  const stillRef = React.useRef(false)

  const colors = { ...DEFAULT_PALETTE, ...palette }
  const W = size.w
  const H = size.h

  const titleWord = React.useMemo(() => sgzWord(title.trim() || "LOADING", 7), [title])
  const creditWord = React.useMemo(() => sgzWord(credit?.name ?? "", 6), [credit?.name])
  const layout = React.useMemo(() => sgzLayout(W, H, titleWord.width, creditWord.width), [W, H, titleWord.width, creditWord.width])
  const clouds = React.useMemo(() => layout.clouds.map((c) => ({ spot: c, shape: sgzCloud(c.seed, c.w, c.h) })), [layout])
  const layoutRef = React.useRef(layout)
  layoutRef.current = layout
  const titleWRef = React.useRef(titleWord.width)
  titleWRef.current = titleWord.width

  const win = layout.win
  const a = layout.a
  const painted = !image

  // ---- size off the box ------------------------------------------------------------
  React.useEffect(() => {
    const root = rootRef.current
    if (!root) return
    stillRef.current = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches
    const measure = () => {
      const r = root.getBoundingClientRect()
      if (r.width > 0 && r.height > 0) setSize({ w: Math.round(r.width), h: Math.round(r.height) })
    }
    measure()
    if (typeof ResizeObserver === "undefined") return
    const ro = new ResizeObserver(measure)
    ro.observe(root)
    return () => ro.disconnect()
  }, [])

  // ---- paint the skin and the clouds, once per size and palette ------------------------
  const paletteKey = JSON.stringify(colors)
  React.useEffect(() => {
    const pal = JSON.parse(paletteKey) as SaffronGazePalette
    const dpr = Math.min(2, typeof window === "undefined" ? 1 : window.devicePixelRatio || 1)
    if (painted && skinRef.current) paintSkin(skinRef.current, layout, pal, dpr)
    clouds.forEach((c, i) => {
      const el = cloudRefs.current[i]
      if (el) paintCloud(el, c.shape, c.spot, layout, pal, dpr)
    })
  }, [layout, clouds, painted, paletteKey, cycle])

  // the guarded page cannot take focus until the black has parted
  React.useEffect(() => {
    destRef.current?.toggleAttribute("inert", phase !== "done")
  }, [phase])

  // ---- phase bookkeeping -------------------------------------------------------------
  const go = React.useCallback((p: Phase) => {
    phaseRef.current = p
    phaseAtRef.current = performance.now()
    setPhase(p)
  }, [])
  const stepTo = React.useCallback((s: Step) => {
    stepRef.current = s
    stepAtRef.current = performance.now()
    setStep(s)
  }, [])

  // intro: the slit, then the window opens, then the load may begin
  React.useEffect(() => {
    if (phase !== "intro") return
    rushRef.current = false
    shownRef.current = 0
    const st = eyeStateRef.current
    st.open = [0, 0]
    st.vel = [0, 0]
    st.written = [-1, -1]
    st.wink = [-1, -1]
    st.blinkStart = -1
    setPct(0)
    const t1 = setTimeout(() => setOpen(true), 60)
    const t2 = setTimeout(() => go("load"), stillRef.current ? 300 : INTRO_MS)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [phase, cycle, go])

  // holds between phases
  React.useEffect(() => {
    if (phase === "awaken") {
      const t = setTimeout(() => go("hold"), AWAKEN_MS)
      return () => clearTimeout(t)
    }
    if (phase === "hold" && (loop || autoEnter)) {
      const t = setTimeout(() => go(loop ? "set" : "lift"), holdMs)
      return () => clearTimeout(t)
    }
    if (phase === "lift" || phase === "set") {
      const still = stillRef.current
      const timers = [] as unknown[]
      const at = (ms: number, fn: () => void) => timers.push(setTimeout(fn, still ? Math.min(ms, 500) : ms))
      stepTo("close")
      at(260, () => stepTo("slit"))
      at(900, () => stepTo("line"))
      if (phase === "lift") {
        at(1280, () => stepTo("part"))
        at(2400, () => {
          stepTo("")
          setOpen(false)
          go("done")
          onCompleteRef.current?.()
        })
      } else {
        at(1280, () => stepTo("shrink"))
        at(1850, () => {
          stepTo("")
          setOpen(false)
          setCycle((c) => c + 1)
          go("intro")
        })
      }
      return () => timers.forEach((t) => clearTimeout(t as number))
    }
  }, [phase, loop, autoEnter, holdMs, go, stepTo])

  // ---- the frame loop: load, eyes, clouds, sun ---------------------------------------------
  React.useEffect(() => {
    let raf = 0
    let last = performance.now()
    let lastPct = -1
    let lastLit = -1
    const st = eyeStateRef.current
    const cache = new WeakMap()
    const put = (el: Element, k: string, v: string) => {
      let c = cache.get(el) as { [k: string]: string } | undefined
      if (!c) cache.set(el, (c = {}))
      if (c[k] === v) return
      c[k] = v
      el.setAttribute(k, v)
    }

    const writeEye = (i: number, openness: number) => {
      const refs = eyeRefs.current[i]
      if (st.written[i] >= 0 && Math.abs(st.written[i] - openness) < 0.003) return
      st.written[i] = openness
      refs.ap?.setAttribute("d", sgzEyeD(openness))
      const k = sgzKajalD(openness, 1)
      refs.kajal?.setAttribute("d", k)
      refs.shadow?.setAttribute("d", k)
      const lashes = sgzLashes(openness, LASH_COUNT, 7 + i)
      lashes.forEach((d, j) => refs.lashes[j]?.setAttribute("d", d))
    }

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const ph = phaseRef.current
      const t = now - phaseAtRef.current
      const lay = layoutRef.current
      const still = stillRef.current
      const root = rootRef.current

      // 1. the load
      let shown = shownRef.current
      if (ph === "load") {
        const external = progressRef.current
        let target = external !== undefined ? clamp01(external / 100) : sgzSimulated(t / Math.max(400, durationMs))
        if (rushRef.current) target = 1
        const rate = rushRef.current ? 0.16 : external !== undefined ? 0.1 : 1
        shown += (target - shown) * Math.min(1, rate * (dt * 60))
        if (target - shown < 0.002) shown = target
        shownRef.current = shown
        const next = Math.round(shown * 100)
        if (next !== lastPct) {
          lastPct = next
          setPct(next)
        }
        if (shown >= 1) go("awaken")
      } else if (ph === "intro") {
        shown = 0
        if (lastPct !== 0) {
          lastPct = 0
          setPct(0)
        }
      } else {
        shown = 1
      }

      // 2. what the load paints: the title wipe, the rays, the sparkles
      const clip = titleClipRef.current
      const wipe = shown * (titleWRef.current + 4)
      if (clip) put(clip, "width", f1(wipe + 10))
      const edgeEl = titleEdgeRef.current
      if (edgeEl) {
        put(edgeEl, "x", f1(wipe - 1.1))
        put(edgeEl, "opacity", ph === "load" && shown > 0.002 && shown < 0.998 ? "0.9" : "0")
      }
      const rays = raysRef.current
      if (rays) {
        const s = ph === "intro" ? 0 : 0.12 + 0.88 * easeOutCubic(shown)
        put(rays, "transform", "scale(" + f3(s) + ")")
      }
      const glow = glowRef.current
      if (glow) put(glow, "opacity", (0.25 + 0.55 * shown + (ph === "hold" ? 0.1 + 0.08 * Math.sin(now / 1100) : 0)).toFixed(2))
      const litCount = Math.floor(shown * 1000)
      if (litCount !== lastLit) {
        lastLit = litCount
        sparkRefs.current.forEach((el) => {
          if (!el) return
          const at = Number(el.dataset.at || 0)
          el.dataset.lit = ph !== "intro" && shown >= at ? "1" : "0"
        })
      }

      // 3. the clouds pour in with the load, breathe, and lean away from the pointer
      const step = stepRef.current
      const ts = now - stepAtRef.current
      const ptr = pointerRef.current
      const pnx = ptr ? (ptr.x / Math.max(1, W)) * 2 - 1 : 0
      const pny = ptr ? (ptr.y / Math.max(1, H)) * 2 - 1 : 0
      const retract = step === "slit" || step === "line" || step === "part" || step === "shrink" ? 1 - Math.pow(1 - clamp01(ts / 520), 3) : step === "close" ? 0 : -1
      lay.clouds.forEach((c, i) => {
        const el = cloudRefs.current[i]
        if (!el) return
        let e = ph === "intro" ? 0 : still ? (ph === "load" ? clamp01((shown - c.at) / 0.38) : 1) : easeOutCubic((shown - c.at) / 0.38)
        let fx = c.ox - c.x
        let fy = c.oy - c.y
        if (retract >= 0) {
          e = Math.min(e, 1 - retract)
          fx = 0
          fy = lay.win.y + lay.win.h / 2 - c.y
        }
        const drift = still ? 0 : 1
        const dx = Math.sin(now / 2600 + i * 1.7) * 5 * c.depth * drift - pnx * 12 * c.depth
        const dy = Math.cos(now / 3300 + i * 2.3) * 3 * c.depth * drift - pny * 7 * c.depth
        const sc = (0.3 + 0.7 * e) * (ph === "awaken" ? 1 + 0.035 * Math.sin(Math.min(Math.PI, (t / 900) * Math.PI)) : 1)
        const tf = "translate(" + f1(fx * (1 - e) + dx) + "px, " + f1(fy * (1 - e) + dy) + "px) scale(" + f3(sc) + ")"
        if (el.style.transform !== tf) el.style.transform = tf
        const op = Math.pow(e, 0.6).toFixed(3)
        if (el.style.opacity !== op) el.style.opacity = op
      })

      // 4. the eyes
      if (painted) {
        const amount = Math.max(0, Math.min(1.5, gaze))
        const awake = ph === "awaken" ? t > EYE_OPEN_AT : ph === "hold"
        // where they look
        if (ptr && amount > 0 && awake && !still) {
          const cx = lay.win.x + lay.win.w / 2
          const cy = lay.win.y + lay.eyeY
          st.tx = Math.max(-1, Math.min(1, ((ptr.x - cx) / (W * 0.45)) * amount))
          st.ty = Math.max(-1, Math.min(1, ((ptr.y - cy) / (H * 0.45)) * amount))
        } else if (awake && !still && amount > 0) {
          if (ph === "awaken") {
            // a waking glance: left, then right, then settle
            st.tx = t < 700 ? 0 : t < 1050 ? -0.55 : t < 1400 ? 0.5 : 0
            st.ty = t < 700 ? 0 : 0.08
            st.idleAt = now + 1800
          } else if (now > st.idleAt) {
            st.idleAt = now + 2600 + sgzHash(now) * 2600
            const r = sgzHash(now * 1.3)
            st.tx = r < 0.35 ? 0 : (sgzHash(now * 0.7) - 0.5) * 1.1
            st.ty = r < 0.35 ? 0 : (sgzHash(now * 0.9) - 0.5) * 0.5
          }
        } else {
          st.tx = 0
          st.ty = 0
        }
        const k = 1 - Math.exp(-dt * (ptr ? 11 : 5))
        st.gx += (st.tx - st.gx) * k
        st.gy += (st.ty - st.gy) * k

        // blinks
        if (awake && blink && !still && ph === "hold") {
          if (st.blinkAt === 0) st.blinkAt = now + 1600 + sgzHash(now) * 2400
          if (now >= st.blinkAt && st.blinkStart < 0) {
            st.blinkStart = now
            st.blinkAt = now + 2600 + sgzHash(now * 1.1) * 3600
          }
        }
        let blinkShut = 0
        if (st.blinkStart >= 0) {
          const bt = now - st.blinkStart
          if (bt > 300) st.blinkStart = -1
          else blinkShut = bt < 110 ? bt / 110 : 1 - (bt - 110) / 190
        }

        for (let i = 0; i < 2; i++) {
          let target = 0
          if (awake) {
            target = 1 - 0.22 * Math.max(0, st.gy) - 0.06 * Math.abs(st.gx)
            target *= 1 - easeInOut(blinkShut)
            if (st.wink[i] > now) target = 0
          } else if (ph === "load" && !still && shown > 0.9 && shown < 1) {
            // a flutter before they open
            target = 0.06 * Math.max(0, Math.sin(now / 95)) * ((shown - 0.9) / 0.1)
          }
          if (still) target = ph === "intro" || ph === "load" || step !== "" ? (ph === "load" ? 1 : target) : 1
          if (still && (ph === "intro" || ph === "load")) target = 1
          if (still && step !== "") target = 0
          const stiff = target < st.open[i] ? 320 : ph === "awaken" ? 110 : 190
          const damp = 2 * Math.sqrt(stiff) * (ph === "awaken" ? 0.78 : 1)
          st.vel[i] += (stiff * (target - st.open[i]) - damp * st.vel[i]) * dt
          st.open[i] = Math.max(0, Math.min(1.06, st.open[i] + st.vel[i] * dt))
          if (still) {
            st.open[i] = target
            st.vel[i] = 0
          }
          writeEye(i, Math.min(1, st.open[i]))
          const refs = eyeRefs.current[i]
          const side = i === 0 ? -1 : 1
          if (refs.iris) put(refs.iris, "transform", "translate(" + (side * st.gx * 0.36).toFixed(3) + " " + (st.gy * 0.15).toFixed(3) + ")")
          if (refs.brow) put(refs.brow, "transform", "translate(0 " + (Math.min(0, st.gy) * 0.05).toFixed(3) + ")")
        }
      }

      if (root) root.style.setProperty("--sgz-shown", f3(shown))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [durationMs, gaze, blink, painted, W, H, go])

  // ---- input -------------------------------------------------------------------------------
  const onActivate = () => {
    const ph = phaseRef.current
    if (ph === "load") rushRef.current = true
    else if (ph === "awaken") go("hold")
    else if (ph === "hold") go(loop ? "set" : "lift")
  }
  const onPointerMove = (e: PointerEv) => {
    const root = rootRef.current
    if (!root) return
    const r = root.getBoundingClientRect()
    pointerRef.current = { x: e.clientX - r.left, y: e.clientY - r.top }
  }
  const onPointerLeave = () => {
    pointerRef.current = null
  }
  const wink = (i: number) => {
    const st = eyeStateRef.current
    if (phaseRef.current !== "hold" || stillRef.current) return
    st.wink[i] = performance.now() + 380
  }

  const loading = phase === "intro" || phase === "load"
  const label = title.trim() || "Page"
  const stretch = (W / Math.max(1, win.w)) * 1.02
  const titleK = layout.title.h / 100
  const sans = Math.max(10, Math.round(layout.fs * 0.0135))

  const px = (n: number) => f1(n) + "px"

  return (
    <div
      ref={rootRef}
      className={"sgz-root " + className}
      data-phase={phase}
      data-step={step || undefined}
      data-open={open ? "1" : "0"}
      style={
        {
          height: phase === "done" ? "auto" : height,
          "--sgz-stage": colors.stage,
          "--sgz-skin": colors.skin,
          "--sgz-cream": colors.cream,
          "--sgz-title": colors.title,
          "--sgz-text": colors.text,
          "--sgz-sans": fontFamily,
          "--sgz-script": scriptFontFamily,
          "--sgz-wh": px(win.h),
          "--sgz-stretch": f3(stretch),
          "--sgz-tw": f1(titleWord.width + 140) + "px",
        } as React.CSSProperties
      }
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      <style>{SGZ_CSS}</style>

      {!loop && children ? (
        <div ref={destRef} className="sgz-dest" aria-hidden={phase !== "done"}>
          {children}
        </div>
      ) : null}

      {phase !== "done" ? (
        <div
          ref={gateRef}
          className="sgz-gate"
          role="progressbar"
          aria-label={label + " is loading"}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          aria-valuetext={loading ? pct + "%" : "Loaded. Press Enter to continue."}
          tabIndex={0}
          onClick={onActivate}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              onActivate()
            }
          }}
        >
          <div className="sgz-panel sgz-panel-top" />
          <div className="sgz-panel sgz-panel-bot" />

          <div className="sgz-scene" key={cycle}>
            {/* the clouds: painted canvases, each its own layer so parallax stays on the compositor */}
            {clouds.map(({ spot, shape }, i) => {
              const [bx0, by0, bx1, by1] = shape.box
              const pad = spot.h * 0.12
              return (
                <canvas
                  key={i}
                  ref={(el) => {
                    cloudRefs.current[i] = el
                  }}
                  className="sgz-cloud"
                  style={{ left: px(spot.x + bx0 - pad), top: px(spot.y + by0 - pad), width: px(bx1 - bx0 + pad * 2), height: px(by1 - by0 + pad * 2) }}
                  aria-hidden="true"
                />
              )
            })}

            <div className="sgz-window-glow" style={{ left: px(win.x), top: px(win.y), width: px(win.w), height: px(win.h) }} />

            {/* the window */}
            <div className="sgz-window" style={{ left: px(win.x), top: px(win.y), width: px(win.w), height: px(win.h) }}>
              {painted ? <canvas ref={skinRef} className="sgz-skin" style={{ width: px(win.w), height: px(win.h) }} aria-hidden="true" /> : null}
              {!painted ? (
                <img className="sgz-photo" src={image} alt="" draggable={false} style={{ objectPosition: imagePosition, filter: "url(#" + uid + "-duotone)" }} />
              ) : null}
              <svg className="sgz-layer" width={f1(win.w)} height={f1(win.h)} viewBox={"0 0 " + f1(win.w) + " " + f1(win.h)} aria-hidden="true">
                <defs>
                  <linearGradient id={uid + "-sclera"} gradientUnits="userSpaceOnUse" x1="0" y1="-0.7" x2="0" y2="0.45">
                    <stop offset="0" stopColor="#b98464" />
                    <stop offset="0.4" stopColor={colors.cream} />
                    <stop offset="1" stopColor="#e8cfae" />
                  </linearGradient>
                  <radialGradient id={uid + "-corner"} gradientUnits="userSpaceOnUse" cx="0" cy="-0.06" r="1.06" gradientTransform="translate(0 -0.06) scale(1 0.58) translate(0 0.06)">
                    <stop offset="0.5" stopColor={colors.skinDeep} stopOpacity="0" />
                    <stop offset="1" stopColor={colors.skinDeep} stopOpacity="0.6" />
                  </radialGradient>
                  <radialGradient id={uid + "-iris"} gradientUnits="userSpaceOnUse" cx="0" cy="0" r="0.46">
                    <stop offset="0" stopColor="#f3c165" />
                    <stop offset="0.42" stopColor={colors.iris} />
                    <stop offset="0.8" stopColor={colors.irisDeep} />
                    <stop offset="1" stopColor="#2c1004" />
                  </radialGradient>
                  <radialGradient id={uid + "-pupil"} gradientUnits="userSpaceOnUse" cx="0.06" cy="0.08" r="0.24">
                    <stop offset="0.7" stopColor={colors.ink} />
                    <stop offset="1" stopColor={colors.irisDeep} stopOpacity="0.4" />
                  </radialGradient>
                  <linearGradient id={uid + "-wet"} gradientUnits="userSpaceOnUse" x1="0" y1="-0.46" x2="0" y2="0.3">
                    <stop offset="0" stopColor={colors.cream} stopOpacity="0.28" />
                    <stop offset="1" stopColor={colors.cream} stopOpacity="0" />
                  </linearGradient>
                  <radialGradient id={uid + "-sunglow"} cx="0.5" cy="0.5" r="0.5">
                    <stop offset="0" stopColor={colors.cream} stopOpacity="0.95" />
                    <stop offset="0.35" stopColor={colors.cloudLight} stopOpacity="0.5" />
                    <stop offset="1" stopColor={colors.cloudLight} stopOpacity="0" />
                  </radialGradient>
                  <radialGradient id={uid + "-bindi"} cx="0.4" cy="0.35" r="0.65">
                    <stop offset="0" stopColor="#e8503c" />
                    <stop offset="0.6" stopColor={colors.bindi} />
                    <stop offset="1" stopColor="#6b1009" />
                  </radialGradient>
                  <filter id={uid + "-sparkglow"} x="-100%" y="-100%" width="300%" height="300%">
                    <feGaussianBlur stdDeviation={f1(a * 0.025)} result="b" />
                    <feMerge>
                      <feMergeNode in="b" />
                      <feMergeNode in="b" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <filter id={uid + "-rayglow"} x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation={f1(layout.sun.r * 0.12)} />
                  </filter>
                  <filter id={uid + "-blur"} x="-20%" y="-50%" width="140%" height="200%">
                    <feGaussianBlur stdDeviation="0.04" />
                  </filter>
                  <filter id={uid + "-duotone"} colorInterpolationFilters="sRGB">
                    <feColorMatrix type="saturate" values="0" />
                    <feComponentTransfer>
                      <feFuncR type="table" tableValues={duoTable(colors.skinDeep, colors.skin, colors.cream, 0)} />
                      <feFuncG type="table" tableValues={duoTable(colors.skinDeep, colors.skin, colors.cream, 1)} />
                      <feFuncB type="table" tableValues={duoTable(colors.skinDeep, colors.skin, colors.cream, 2)} />
                    </feComponentTransfer>
                  </filter>
                  <linearGradient id={uid + "-shine"} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0" stopColor={colors.cream} stopOpacity="0" />
                    <stop offset="0.5" stopColor={colors.cream} stopOpacity="0.75" />
                    <stop offset="1" stopColor={colors.cream} stopOpacity="0" />
                  </linearGradient>
                </defs>

              </svg>
              {!painted ? <div className="sgz-veil" /> : null}

              <svg className="sgz-layer" width={f1(win.w)} height={f1(win.h)} viewBox={"0 0 " + f1(win.w) + " " + f1(win.h)} aria-hidden="true">
                <defs>
                  <clipPath id={uid + "-apL"}>
                    <path
                      ref={(el) => {
                        eyeRefs.current[0].ap = el
                      }}
                      d={sgzEyeD(0)}
                    />
                  </clipPath>
                  <clipPath id={uid + "-apR"}>
                    <path
                      ref={(el) => {
                        eyeRefs.current[1].ap = el
                      }}
                      d={sgzEyeD(0)}
                    />
                  </clipPath>
                </defs>
                {painted ? (
                  <g>
                    {/* the two eyes */}
                    {[0, 1].map((i) => {
                      const side = i === 0 ? -1 : 1
                      const cx = i === 0 ? layout.lx : layout.rx
                      const refs = eyeRefs.current[i]
                      return (
                        <g key={i} transform={"translate(" + f1(cx) + " " + f1(layout.eyeY) + ") scale(" + f1(side * a) + " " + f1(a) + ")"}>
                          <g
                            ref={(el) => {
                              refs.brow = el
                            }}
                          >
                            <g className="sgz-brow">
                              <path d={BROW_D} fill={colors.ink} opacity="0.62" filter={"url(#" + uid + "-blur)"} />
                              <path d={BROW_D} fill={colors.ink} opacity="0.45" />
                              <g stroke={colors.ink} strokeWidth="0.016" strokeLinecap="round" fill="none">
                                {BROW_HAIRS.map((h, j) => (
                                  <path key={j} d={h.d} opacity={f3(h.o)} />
                                ))}
                              </g>
                            </g>
                          </g>
                          <path d="M-0.92 -0.46 C-0.5 -1 0.45 -1.02 1.08 -0.5" fill="none" stroke={colors.skinDeep} strokeWidth="0.16" strokeLinecap="round" opacity="0.5" filter={"url(#" + uid + "-blur)"} />
                          <path d="M-0.86 -0.5 C-0.48 -0.96 0.42 -0.99 1.04 -0.52" fill="none" stroke={colors.ink} strokeWidth="0.028" strokeLinecap="round" opacity="0.55" />
                          <g clipPath={"url(#" + uid + (i === 0 ? "-apL" : "-apR") + ")"}>
                            <path d={sgzEyeD(1)} fill={"url(#" + uid + "-sclera)"} />
                            <ellipse rx="1.06" ry="0.62" cy="-0.06" fill={"url(#" + uid + "-corner)"} />
                            <path d={sgzEyeD(1)} fill={colors.skin} opacity="0.16" />
                            <g
                              ref={(el) => {
                                refs.iris = el
                              }}
                            >
                              <circle r="0.46" fill={"url(#" + uid + "-iris)"} />
                              <path d={IRIS_DARK} stroke={colors.irisDeep} strokeWidth="0.014" opacity="0.55" fill="none" />
                              <path d={IRIS_LIGHT} stroke="#f6d08a" strokeWidth="0.012" opacity="0.5" fill="none" />
                              <circle r="0.455" fill="none" stroke="#2c1004" strokeWidth="0.03" opacity="0.8" />
                              <circle r="0.2" fill={"url(#" + uid + "-pupil)"} />
                              <circle r="0.46" fill={"url(#" + uid + "-wet)"} />
                              <ellipse cx="-0.15" cy="-0.17" rx="0.1" ry="0.075" fill={colors.cream} transform="rotate(-20 -0.15 -0.17)" />
                              <circle cx="0.15" cy="0.14" r="0.035" fill={colors.cream} opacity="0.85" />
                              <circle cx="0.1" cy="0.24" r="0.07" fill="#f6d08a" opacity="0.35" />
                            </g>
                            <path
                              ref={(el) => {
                                refs.shadow = el
                              }}
                              d={sgzKajalD(0, 1)}
                              fill={colors.ink}
                              opacity="0.42"
                              transform="translate(0 0.1)"
                              filter={"url(#" + uid + "-blur)"}
                            />
                            <circle cx="-0.94" cy="0.07" r="0.065" fill="#c9533a" opacity="0.7" />
                          </g>
                          <path d="M1 -0.12 C0.6 0.45 -0.45 0.43 -1 0.06" fill="none" stroke={colors.cream} strokeWidth="0.03" opacity="0.5" />
                          <path d="M1 -0.12 C0.6 0.49 -0.3 0.47 -0.85 0.2" fill="none" stroke={colors.ink} strokeWidth="0.03" strokeLinecap="round" opacity="0.75" />
                          <g fill={colors.ink} opacity="0.9">
                            {LOWER_LASHES.map((d, j) => (
                              <path key={j} d={d} />
                            ))}
                          </g>
                          <path
                            ref={(el) => {
                              refs.kajal = el
                            }}
                            d={sgzKajalD(0, 1)}
                            fill={colors.ink}
                          />
                          <g fill={colors.ink}>
                            {sgzLashes(0, LASH_COUNT, 7 + i).map((d, j) => (
                              <path
                                key={j}
                                ref={(el) => {
                                  refs.lashes[j] = el
                                }}
                                d={d}
                              />
                            ))}
                          </g>
                          <g fill="none" strokeLinecap="round" strokeLinejoin="round">
                            <path className="sgz-curl sgz-curl-glow" d={FILIGREE_D} strokeWidth="0.09" pathLength={1} filter={"url(#" + uid + "-blur)"} />
                            <path className="sgz-curl sgz-curl-gold" d={FILIGREE_D} strokeWidth="0.032" pathLength={1} />
                            <path className="sgz-curl" d={FILIGREE_D} strokeWidth="0.012" pathLength={1} />
                            {i === 0 ? (
                              <g transform="translate(1.15 0.78) scale(0.36)">
                                <path className="sgz-curl" d={SPIRAL_D} strokeWidth="0.045" pathLength={1} />
                              </g>
                            ) : null}
                          </g>
                          <ellipse
                            className="sgz-hit"
                            cx="0.05"
                            cy="-0.1"
                            rx="1.3"
                            ry="0.8"
                            onClick={(e) => {
                              e.stopPropagation()
                              wink(i)
                            }}
                          />
                        </g>
                      )
                    })}
                  </g>
                ) : null}

                {/* the bindi sun */}
                <g transform={"translate(" + f1(layout.sun.x) + " " + f1(layout.sun.y) + ")"}>
                  <circle ref={glowRef} className="sgz-glow" r={f1(layout.sun.r * 2.6)} fill={"url(#" + uid + "-sunglow)"} opacity="0.25" />
                  <circle className="sgz-halo" r={f1(layout.sun.r)} />
                  <circle className="sgz-halo sgz-halo-2" r={f1(layout.sun.r)} strokeWidth="0.8" />
                  <g ref={raysRef} transform="scale(0)">
                    <g className="sgz-rays">
                      <g fill={colors.cream} opacity="0.55" filter={"url(#" + uid + "-rayglow)"}>
                        {SUN_RAYS.map((r, k) => (
                          <path key={k} d={sgzRayD(layout.sun.r * r[1] * 1.05, layout.sun.r * r[2] * 2.2)} transform={"rotate(" + r[0] + ") translate(0 " + f1(-layout.sun.r * 0.36) + ")"} />
                        ))}
                      </g>
                      <g fill={colors.cream}>
                        {SUN_RAYS.map((r, k) => (
                          <path key={k} d={sgzRayD(layout.sun.r * r[1], layout.sun.r * r[2])} transform={"rotate(" + r[0] + ") translate(0 " + f1(-layout.sun.r * 0.36) + ")"} />
                        ))}
                      </g>
                      <g className="sgz-rays-b" fill={colors.cream} opacity="0.6">
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((k) => (
                          <path key={k} d={sgzRayD(layout.sun.r * (k % 2 ? 0.42 : 0.62), layout.sun.r * 0.022)} transform={"rotate(" + (k * 22.5 + 11.25) + ") translate(0 " + f1(-layout.sun.r * 0.4) + ")"} />
                        ))}
                      </g>
                      <circle r={f1(layout.sun.r * 0.5)} fill={colors.cream} opacity="0.5" filter={"url(#" + uid + "-rayglow)"} />
                      <circle r={f1(layout.sun.r * 0.42)} fill="none" stroke={colors.cream} strokeWidth={f1(layout.sun.r * 0.04)} opacity="0.85" />
                    </g>
                  </g>
                  <circle r={f1(layout.sun.r * 0.31)} fill={"url(#" + uid + "-bindi)"} />
                  <circle r={f1(layout.sun.r * 0.31)} fill="none" stroke="#5a0d06" strokeWidth={f1(layout.sun.r * 0.03)} opacity="0.7" />
                  <ellipse cx={f1(-layout.sun.r * 0.1)} cy={f1(-layout.sun.r * 0.12)} rx={f1(layout.sun.r * 0.07)} ry={f1(layout.sun.r * 0.045)} fill={colors.cream} opacity="0.7" />
                </g>

                {/* the moon */}
                <g transform={"translate(" + f1(layout.moon.x) + " " + f1(layout.moon.y) + ") rotate(-25)"}>
                  <path className="sgz-moon" d={sgzMoonD(layout.moon.r)} fill={colors.cream} style={{ filter: "drop-shadow(0 0 " + f1(layout.moon.r * 0.5) + "px rgba(250, 220, 160, 0.55))" }} />
                </g>

                {/* sparkles in the painting */}
                {layout.sparks.map((s, i) => (
                  <g key={i} transform={"translate(" + f1(s.x) + " " + f1(s.y) + ")"} filter={"url(#" + uid + "-sparkglow)"}>
                    <path
                      ref={(el) => {
                        sparkRefs.current[i] = el
                      }}
                      className="sgz-spark"
                      data-at={f3(s.at)}
                      data-lit="0"
                      d={sgzSparkleD(s.r)}
                    style={{ "--d": f3(sgzHash(i + 3) * -2.6) + "s" } as React.CSSProperties}
                    />
                  </g>
                ))}
              </svg>
              <div className="sgz-vignette" />
            </div>

            {/* sparkles on the black */}
            <svg className="sgz-stars" width={f1(W)} height={f1(H)} viewBox={"0 0 " + f1(W) + " " + f1(H)} aria-hidden="true">
              {layout.stageSparks.map((s, i) => (
                <g key={i} transform={"translate(" + f1(s.x) + " " + f1(s.y) + ")"} filter={"url(#" + uid + "-sparkglow)"}>
                  <path
                    ref={(el) => {
                      sparkRefs.current[layout.sparks.length + i] = el
                    }}
                    className="sgz-spark"
                    data-at={f3(s.at)}
                    data-lit="0"
                    d={sgzSparkleD(s.r)}
                  style={{ "--d": f3(sgzHash(i + 11) * -2.6) + "s" } as React.CSSProperties}
                  />
                </g>
              ))}
            </svg>

            {/* type */}
            {kicker ? (
              <div className="sgz-text sgz-kicker" style={{ fontSize: px(sans * 1.05) }}>
                {kicker}
                {kickerSub ? <small>{kickerSub}</small> : null}
              </div>
            ) : null}

            {monogram ? (
              <div className="sgz-text sgz-badge">
                <svg width={f1(sans * 3.6)} height={f1(sans * 3.6)} viewBox="0 0 40 40" aria-hidden="true">
                  <circle cx="20" cy="20" r="13.5" fill="none" stroke={colors.cream} strokeWidth="0.9" opacity="0.9" />
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((k) => (
                    <path key={k} d="M20 2.2 L20 5.4" stroke={colors.cream} strokeWidth="0.9" strokeLinecap="round" transform={"rotate(" + k * 30 + " 20 20)"} opacity={k % 3 === 0 ? 1 : 0.5} />
                  ))}
                  <text x="20" y="20" textAnchor="middle" dominantBaseline="central" fontSize="13" fontWeight="700" fontFamily={fontFamily} fill={colors.cream} letterSpacing="0.5">
                    {monogram.slice(0, 2)}
                  </text>
                </svg>
              </div>
            ) : null}

            <div className="sgz-text sgz-title-wrap" style={{ top: px(layout.title.y) }}>
              <svg className="sgz-title" width={f1(titleWord.width * titleK)} height={f1(layout.title.h)} viewBox={"0 0 " + f1(titleWord.width) + " 100"} aria-hidden="true">
                <defs>
                  <linearGradient id={uid + "-tgrad"} x1="0" y1="0" x2="0" y2="100" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stopColor={colors.cloudLight} />
                    <stop offset="0.45" stopColor={colors.title} />
                    <stop offset="1" stopColor={colors.cloud} />
                  </linearGradient>
                  <filter id={uid + "-edgeglow"} x="-400%" y="-10%" width="900%" height="120%">
                    <feGaussianBlur stdDeviation="1.6" result="b" />
                    <feMerge>
                      <feMergeNode in="b" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <clipPath id={uid + "-tclip"}>
                    <rect ref={titleClipRef} x="-10" y="-10" width="0" height="120" />
                  </clipPath>
                  <mask id={uid + "-tmask"}>
                    <g fill="#fff">
                      {titleWord.letters.map((l, i) => (
                        <path key={i} d={l.d} transform={"translate(" + l.x + " 0)"} />
                      ))}
                    </g>
                  </mask>
                </defs>
                <g className="sgz-title-ghost">
                  {titleWord.letters.map((l, i) => (
                    <path key={i} d={l.d} transform={"translate(" + l.x + " 0)"} />
                  ))}
                </g>
                <g className="sgz-title-fill" clipPath={"url(#" + uid + "-tclip)"} fill={"url(#" + uid + "-tgrad)"}>
                  {titleWord.letters.map((l, i) => (
                    <path key={i} d={l.d} transform={"translate(" + l.x + " 0)"} />
                  ))}
                </g>
                <rect ref={titleEdgeRef} className="sgz-title-edge" x="-10" y="-6" width="2.2" height="112" opacity="0" filter={"url(#" + uid + "-edgeglow)"} />
                <g mask={"url(#" + uid + "-tmask)"}>
                  <g transform="skewX(-14)">
                    <rect className="sgz-shine" x="0" y="-10" width="110" height="120" fill={"url(#" + uid + "-shine)"} />
                  </g>
                </g>
              </svg>
              {subtitle ? (
                <div className="sgz-sub" style={{ fontSize: px(layout.sub.size), marginTop: px(layout.title.h * 0.14) }}>
                  {subtitle}
                </div>
              ) : null}
            </div>

            <div className="sgz-text sgz-cap" style={{ top: px(layout.cap.y), fontSize: px(sans * 1.15) }}>
              <div className="sgz-cap-line">
                <span className="sgz-cap-load">
                  {loadingLabel}
                  {counter ? (
                    <span className="sgz-pct">
                      {" · "}
                      {pct}%
                    </span>
                  ) : null}
                </span>
                <span className="sgz-cap-enter">{enterLabel}</span>
              </div>
              <div className="sgz-cap-line sgz-cap-sub">
                <span className="sgz-cap-load">{loadingSub}</span>
                <span className="sgz-cap-enter">{enterSub}</span>
              </div>
            </div>

            {credit ? (
              <div className="sgz-text sgz-credit" style={{ fontSize: px(sans * 0.95) }}>
                {credit.eyebrow ? <div className="sgz-eyebrow">{credit.eyebrow}</div> : null}
                {creditWord.width > 0 ? (
                  <svg width={f1((creditWord.width * layout.creditH) / 100)} height={f1(layout.creditH)} viewBox={"0 0 " + f1(creditWord.width) + " 100"} aria-hidden="true">
                    {creditWord.letters.map((l, i) => (
                      <path key={i} d={l.d} transform={"translate(" + l.x + " 0)"} />
                    ))}
                  </svg>
                ) : null}
                {credit.note ? <div className="sgz-note">{credit.note}</div> : null}
              </div>
            ) : null}
          </div>

          <div className="sgz-slit" style={{ top: px(win.y + win.h / 2), width: px(win.w) }} />

          <svg className="sgz-grain" width="100%" height="100%" aria-hidden="true">
            <filter id={uid + "-grain"}>
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} stitchTiles="stitch" />
              <feColorMatrix type="saturate" values="0" />
            </filter>
            <rect width="100%" height="100%" filter={"url(#" + uid + "-grain)"} />
          </svg>
          <div className="sgz-focus" />
          <span className="sgz-sr" aria-live="polite">
            {loading ? "" : label + (subtitle ? " — " + subtitle : "")}
          </span>
        </div>
      ) : null}
    </div>
  )
}

// ---- duotone: a photo's luminance mapped dark → mid → light through the palette ----------
function hexChannel(hex: string, i: number) {
  const h = hex.replace("#", "")
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h
  const v = parseInt(full.slice(i * 2, i * 2 + 2), 16)
  return isNaN(v) ? 0 : v / 255
}
function duoTable(dark: string, mid: string, light: string, i: number) {
  return [hexChannel(dark, i), hexChannel(mid, i), hexChannel(light, i)].map((v) => f3(v)).join(" ")
}

type PointerEv = React.PointerEvent<HTMLDivElement>
export type SaffronGazePaletteOverrides = Partial<SaffronGazePalette>
