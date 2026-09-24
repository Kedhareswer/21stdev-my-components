"use client"

// Graffiti Script Preloader — a cinematic A–Z reel of hand-built brush capitals
// in electric-blue sticker ink: rows of letters roll past, giant letters fly
// through the lens, the counter runs to 100, your word slams in with an orbit
// ring and sparkles, and an iris closes onto whatever you wrapped.
//
// The lettering is drawn, not typeset: every capital is a set of pen skeletons
// swept by a broad nib (thick/thin by stroke direction, tapered tips), then
// outlined sticker-style. No fonts, no images, nothing loads at runtime.
import * as React from "react"

// #region graffiti-engine
// #region glyph-math
type Pt = [number, number]
type Cubic = [Pt, Pt, Pt, Pt]
type Box = [number, number, number, number]
/** [pen skeleton (absolute M/L/C/Q), weight, taper-in, taper-out] */
type Stroke = [string, number, number, number]
type Glyph = { w: number; s: Stroke[] }

// Cap height is 100 units, baseline at y = 100. Skeletons are drawn upright and
// slanted afterwards, so every glyph shares one italic angle.
const GLYPHS: Record<string, Glyph> = {
  A: { w: 88, s: [
    ["M -2 104 C 14 90 34 44 52 0", 0.95, 0.35, 0.04],
    ["M 52 0 C 54 38 58 76 66 98 C 70 108 82 106 92 94", 1.15, 0.03, 0.34],
    ["M -22 74 C 6 58 46 54 88 60", 0.62, 0.4, 0.5],
  ] },
  B: { w: 84, s: [
    ["M 24 8 C 24 42 22 74 14 102", 1.12, 0.25, 0.22],
    ["M -14 26 C 6 2 54 -8 72 8 C 90 24 70 48 30 52", 1, 0.32, 0.3],
    ["M 30 50 C 74 44 94 64 80 86 C 66 106 30 108 4 96", 1.12, 0.12, 0.36],
  ] },
  C: { w: 80, s: [
    ["M 76 20 C 66 -2 30 -6 14 26 C 0 56 8 98 40 100 C 58 102 72 92 80 80", 1.18, 0.22, 0.36],
    ["M 76 20 C 82 12 88 10 96 14", 0.5, 0.05, 0.7],
  ] },
  D: { w: 90, s: [
    ["M 28 6 C 28 42 26 74 18 100", 1.12, 0.22, 0.1],
    ["M -12 22 C 18 -4 84 -8 92 40 C 98 80 56 108 2 98", 1.06, 0.3, 0.36],
  ] },
  E: { w: 74, s: [
    ["M 74 14 C 60 -4 18 -2 22 24 C 25 40 40 46 52 48", 1.08, 0.3, 0.06],
    ["M 50 48 C 10 46 -4 78 16 96 C 34 110 66 102 80 86", 1.15, 0.05, 0.36],
    ["M 14 50 C 34 47 60 44 84 38", 0.58, 0.35, 0.5],
  ] },
  F: { w: 80, s: [
    ["M -6 20 C 20 0 58 12 98 -4", 0.95, 0.32, 0.45],
    ["M 44 8 C 44 44 40 78 26 98 C 18 108 4 106 -2 96", 1.18, 0.12, 0.42],
    ["M 12 58 C 34 50 58 50 80 46", 0.78, 0.35, 0.45],
  ] },
  G: { w: 86, s: [
    ["M 76 18 C 64 -2 26 -4 12 28 C 0 58 10 98 42 100 C 64 101 78 84 78 58", 1.18, 0.22, 0.06],
    ["M 78 58 C 78 76 78 92 82 104", 0.9, 0.04, 0.5],
    ["M 40 60 C 56 56 74 56 94 58", 0.66, 0.35, 0.4],
  ] },
  H: { w: 94, s: [
    ["M 22 4 C 24 40 20 74 8 102", 1.12, 0.3, 0.22],
    ["M 72 0 C 72 40 70 74 74 96 C 76 106 86 106 94 96", 1.12, 0.25, 0.36],
    ["M -16 62 C 20 50 60 46 94 38", 0.66, 0.38, 0.45],
  ] },
  I: { w: 56, s: [
    ["M 0 12 C 18 0 42 2 62 2", 0.72, 0.32, 0.5],
    ["M 36 4 C 36 40 32 74 24 100", 1.18, 0.15, 0.1],
    ["M -8 104 C 10 94 30 100 48 96", 0.72, 0.4, 0.5],
  ] },
  J: { w: 66, s: [
    ["M 6 8 C 26 0 50 0 74 4", 0.7, 0.32, 0.5],
    ["M 54 4 C 56 50 52 100 32 118 C 16 132 -6 124 -4 104", 1.18, 0.15, 0.46],
  ] },
  K: { w: 86, s: [
    ["M 24 2 C 26 40 22 74 10 102", 1.12, 0.26, 0.22],
    ["M 82 -2 C 62 24 42 44 24 56", 0.95, 0.32, 0.08],
    ["M 30 50 C 50 62 56 96 72 100 C 80 102 88 98 94 90", 1.12, 0.1, 0.4],
  ] },
  L: { w: 80, s: [
    ["M 42 0 C 34 40 32 78 16 96 C 8 106 -6 104 -2 94", 1.15, 0.26, 0.08],
    ["M -2 94 C 6 84 34 90 52 96 C 66 100 80 100 92 92", 1.0, 0.06, 0.42],
  ] },
  M: { w: 112, s: [
    ["M 0 102 C 8 72 14 32 22 2", 0.82, 0.32, 0.04],
    ["M 22 2 C 34 30 44 58 52 76", 1.12, 0.04, 0.08],
    ["M 52 76 C 62 50 76 22 92 0", 0.82, 0.08, 0.04],
    ["M 92 0 C 90 40 92 76 100 96 C 104 104 112 104 118 96", 1.12, 0.04, 0.36],
  ] },
  N: { w: 92, s: [
    ["M 2 102 C 8 70 14 30 20 2", 0.86, 0.32, 0.04],
    ["M 20 2 C 36 36 52 70 68 98", 1.18, 0.04, 0.08],
    ["M 68 98 C 72 60 78 24 98 -8", 0.84, 0.08, 0.46],
  ] },
  O: { w: 86, s: [
    ["M 52 2 C 16 -2 0 44 10 76 C 20 108 66 106 80 70 C 92 36 78 0 44 4 C 30 6 20 14 12 24", 1.16, 0.25, 0.46],
  ] },
  P: { w: 80, s: [
    ["M 28 6 C 28 40 24 74 12 102", 1.12, 0.22, 0.26],
    ["M -12 22 C 14 0 72 -8 80 24 C 86 50 58 62 26 58", 1.06, 0.32, 0.46],
  ] },
  Q: { w: 88, s: [
    ["M 52 2 C 16 -2 0 44 10 76 C 20 108 66 106 80 70 C 92 36 78 0 44 4 C 30 6 20 14 12 24", 1.16, 0.25, 0.46],
    ["M 38 76 C 56 86 72 110 100 112", 0.92, 0.28, 0.46],
  ] },
  R: { w: 88, s: [
    ["M 28 6 C 28 40 24 74 12 102", 1.12, 0.22, 0.26],
    ["M -12 22 C 14 0 72 -8 78 22 C 82 44 56 56 28 56", 1.06, 0.32, 0.06],
    ["M 28 56 C 52 62 58 94 72 100 C 80 104 90 100 96 92", 1.12, 0.06, 0.4],
  ] },
  S: { w: 76, s: [
    ["M 74 12 C 62 -4 20 -4 18 22 C 16 44 62 48 64 72 C 66 100 20 108 -4 92", 1.18, 0.26, 0.36],
  ] },
  T: { w: 86, s: [
    ["M -8 18 C 20 2 60 8 98 -4", 0.92, 0.32, 0.46],
    ["M 52 6 C 52 44 48 78 36 100 C 28 110 16 108 8 100", 1.18, 0.1, 0.42],
  ] },
  U: { w: 90, s: [
    ["M 2 14 C 12 0 24 2 24 18 C 22 50 14 90 40 100 C 62 106 76 80 78 0", 1.12, 0.3, 0.04],
    ["M 78 0 C 74 40 74 76 80 96 C 82 104 90 104 96 96", 1.12, 0.04, 0.36],
  ] },
  V: { w: 82, s: [
    ["M -2 14 C 10 0 24 4 28 24 C 34 56 36 84 40 102", 1.18, 0.3, 0.04],
    ["M 40 102 C 52 70 68 30 94 -6", 0.84, 0.04, 0.46],
  ] },
  W: { w: 116, s: [
    ["M -2 14 C 10 2 20 4 22 24 C 24 56 24 84 28 102", 1.12, 0.3, 0.04],
    ["M 28 102 C 38 76 48 54 58 40", 0.78, 0.04, 0.04],
    ["M 58 40 C 60 64 62 86 66 102", 1.08, 0.04, 0.04],
    ["M 66 102 C 80 70 94 30 118 -6", 0.84, 0.04, 0.46],
  ] },
  X: { w: 88, s: [
    ["M 4 4 C 30 10 44 60 60 94 C 66 104 80 104 92 94", 1.18, 0.3, 0.36],
    ["M 86 -2 C 62 30 32 66 -2 106", 0.84, 0.38, 0.42],
  ] },
  Y: { w: 86, s: [
    ["M -2 14 C 10 0 24 4 24 24 C 24 44 32 56 50 54", 1.08, 0.3, 0.06],
    ["M 82 -2 C 74 40 66 90 42 118 C 28 134 4 128 6 110", 1.18, 0.2, 0.46],
  ] },
  Z: { w: 82, s: [
    ["M 4 14 C 30 0 58 10 86 2", 0.88, 0.32, 0.08],
    ["M 86 2 C 62 34 32 70 6 100", 1.12, 0.06, 0.06],
    ["M 6 100 C 32 90 62 104 92 92", 0.98, 0.06, 0.42],
    ["M 18 54 C 38 50 60 50 78 46", 0.58, 0.35, 0.45],
  ] },
}

const NIB = 27 // broad-edge width, in cap-height units
const HAIR = 2.6 // thinnest line the pen can make
const SLANT = 0.22 // italic lean: x shifts right as y rises
const NIB_ANGLE = 0.52 // ~30°, the classic italic pen hold
const NIB_X = Math.cos(NIB_ANGLE)
const NIB_Y = -Math.sin(NIB_ANGLE)
const STEPS = 22 // samples per bezier segment
const GAP = 5.5 // paper halo around the ink
const LINE = 1.8 // thin outer ink line around the halo

const r1 = (n: number) => Math.round(n * 10) / 10
const pt = (p: Pt) => r1(p[0]) + " " + r1(p[1])

/** Parse an absolute M/L/C/Q skeleton into cubics, slanting as it goes. */
function toCubics(d: string, slant: number): Cubic[] {
  const tk = d.match(/[MLCQ]|-?\d*\.?\d+/g) ?? []
  const sk = (x: number, y: number): Pt => [x + (100 - y) * slant, y]
  const lerp = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
  const out: Cubic[] = []
  let cur: Pt = [0, 0]
  let cmd = "M"
  let i = 0
  const n = () => Number(tk[i++])
  while (i < tk.length) {
    if (/[MLCQ]/.test(tk[i])) cmd = tk[i++]
    if (cmd === "M") {
      cur = sk(n(), n())
      cmd = "L"
    } else if (cmd === "L") {
      const p = sk(n(), n())
      out.push([cur, lerp(cur, p, 1 / 3), lerp(cur, p, 2 / 3), p])
      cur = p
    } else if (cmd === "C") {
      const a = sk(n(), n())
      const b = sk(n(), n())
      const p = sk(n(), n())
      out.push([cur, a, b, p])
      cur = p
    } else if (cmd === "Q") {
      const q = sk(n(), n())
      const p = sk(n(), n())
      out.push([cur, lerp(cur, q, 2 / 3), lerp(p, q, 2 / 3), p])
      cur = p
    } else i++
  }
  return out
}

function bez(c: Cubic, t: number, k: 0 | 1) {
  const u = 1 - t
  return u * u * u * c[0][k] + 3 * u * u * t * c[1][k] + 3 * u * t * t * c[2][k] + t * t * t * c[3][k]
}

function dbez(c: Cubic, t: number, k: 0 | 1) {
  const u = 1 - t
  return 3 * u * u * (c[1][k] - c[0][k]) + 6 * u * t * (c[2][k] - c[1][k]) + 3 * t * t * (c[3][k] - c[2][k])
}

/**
 * Sweep a pen along the cubics and return the filled outline. Width follows
 * the angle between travel and the nib (thick downstrokes, hairline upstrokes)
 * times a pressure curve that tapers both ends to a point.
 */
function ribbon(cs: Cubic[], weight: number, tIn: number, tOut: number, box: Box, nib = NIB): string {
  const P: Pt[] = []
  const T: Pt[] = []
  cs.forEach((c, k) => {
    for (let j = k ? 1 : 0; j <= STEPS; j++) {
      const t = j / STEPS
      P.push([bez(c, t, 0), bez(c, t, 1)])
      let d: Pt = [dbez(c, t, 0), dbez(c, t, 1)]
      if (Math.hypot(d[0], d[1]) < 1e-6) d = [c[3][0] - c[0][0], c[3][1] - c[0][1]]
      T.push(d)
    }
  })
  const L = [0]
  for (let i = 1; i < P.length; i++) L.push(L[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]))
  const total = L[L.length - 1] || 1
  const left: string[] = []
  const right: string[] = []
  for (let i = 0; i < P.length; i++) {
    const s = L[i] / total
    const a = tIn > 0 ? Math.sin((Math.min(1, s / tIn) * Math.PI) / 2) : 1
    const b = tOut > 0 ? Math.sin((Math.min(1, (1 - s) / tOut) * Math.PI) / 2) : 1
    const len = Math.hypot(T[i][0], T[i][1]) || 1
    const tx = T[i][0] / len
    const ty = T[i][1] / len
    const cross = Math.abs(tx * NIB_Y - ty * NIB_X)
    const half = weight * Math.max(0.03, a * b) * (HAIR / 2 + (nib / 2) * (0.24 + 0.76 * cross))
    const l: Pt = [P[i][0] - ty * half, P[i][1] + tx * half]
    const r: Pt = [P[i][0] + ty * half, P[i][1] - tx * half]
    for (const q of [l, r]) {
      box[0] = Math.min(box[0], q[0])
      box[1] = Math.min(box[1], q[1])
      box[2] = Math.max(box[2], q[0])
      box[3] = Math.max(box[3], q[1])
    }
    left.push(pt(l))
    right.push(pt(r))
  }
  return "M" + left.join("L") + "L" + right.reverse().join("L") + "Z"
}

const spine = (cs: Cubic[]) => "M" + pt(cs[0][0]) + cs.map((c) => "C" + pt(c[1]) + " " + pt(c[2]) + " " + pt(c[3])).join("")

interface Built {
  w: number
  d: string
  strokes: string[]
  spines: string[]
  box: Box
}

const BUILT = new Map<string, Built | null>()

/** One capital, swept and cached. Anything outside A–Z returns null. */
function glyph(ch: string): Built | null {
  const hit = BUILT.get(ch)
  if (hit !== undefined) return hit
  const g = GLYPHS[ch]
  if (!g) {
    BUILT.set(ch, null)
    return null
  }
  const box: Box = [Infinity, Infinity, -Infinity, -Infinity]
  const strokes: string[] = []
  const spines: string[] = []
  for (const [d, w, a, b] of g.s) {
    const cs = toCubics(d, SLANT)
    strokes.push(ribbon(cs, w, a, b, box))
    spines.push(spine(cs))
  }
  const out = { w: g.w, d: strokes.join(""), strokes, spines, box }
  BUILT.set(ch, out)
  return out
}

/** Deterministic 0–1 noise, so a word always lays out the same way. */
function hash(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

/** An elliptical ring from angle a0 to a1 (radians), as cubics. */
function arcCubics(rx: number, ry: number, a0: number, a1: number): Cubic[] {
  const out: Cubic[] = []
  const n = Math.max(1, Math.ceil(Math.abs(a1 - a0) / (Math.PI / 4)))
  const step = (a1 - a0) / n
  const k = (4 / 3) * Math.tan(step / 4)
  const p = (a: number): Pt => [rx * Math.cos(a), ry * Math.sin(a)]
  const v = (a: number): Pt => [-rx * Math.sin(a), ry * Math.cos(a)]
  for (let i = 0; i < n; i++) {
    const a = a0 + step * i
    const b = a + step
    const P0 = p(a)
    const P3 = p(b)
    const va = v(a)
    const vb = v(b)
    out.push([P0, [P0[0] + k * va[0], P0[1] + k * va[1]], [P3[0] - k * vb[0], P3[1] - k * vb[1]], P3])
  }
  return out
}

/** A four-point sparkle of radius 1, centred on the origin. */
const STAR =
  "M0 -1C0.08 -0.3 0.3 -0.08 1 0C0.3 0.08 0.08 0.3 0 1C-0.08 0.3 -0.3 0.08 -1 0C-0.3 -0.08 -0.08 -0.3 0 -1Z"

interface Placed {
  ch: string
  g: Built
  x: number
  y: number
  r: number
  i: number
}

interface Layout {
  items: Placed[]
  box: Box
}

const LEAD = 124 // line spacing: lines overlap like stacked stickers
const KERN = 0.95 // letters tuck into each other

/** Lay out one or more lines, centred on a shared axis and staggered. */
function layoutLines(lines: string[]): Layout {
  const items: Placed[] = []
  const box: Box = [Infinity, Infinity, -Infinity, -Infinity]
  const rows = lines.map((l) => l.toUpperCase()).filter((l) => l.trim())
  rows.forEach((line, li) => {
    const row: Placed[] = []
    let x = 0
    for (const ch of line) {
      const g = glyph(ch)
      if (!g) {
        x += 38
        continue
      }
      const k = items.length + row.length
      row.push({ ch, g, x, y: (hash(k + 9) - 0.5) * 8, r: (hash(k + 3) - 0.5) * 7, i: k })
      x += g.w * KERN
    }
    const last = row[row.length - 1]
    const width = last ? last.x + last.g.w : 0
    const shift = -width / 2 + (li - (rows.length - 1) / 2) * 46
    for (const p of row) {
      p.x += shift
      p.y += li * LEAD
      box[0] = Math.min(box[0], p.x + p.g.box[0])
      box[1] = Math.min(box[1], p.y + p.g.box[1])
      box[2] = Math.max(box[2], p.x + p.g.box[2])
      box[3] = Math.max(box[3], p.y + p.g.box[3])
      items.push(p)
    }
  })
  if (!items.length) return { items, box: [0, 0, 100, 100] }
  return { items, box }
}

// #endregion glyph-math

type Layer = "ring" | "gap" | "fill"

/** The three passes that make ink read as a die-cut sticker. */
function sticker(layer: Layer, ink: string, paper: string): React.SVGProps<SVGPathElement> {
  if (layer === "ring")
    return { fill: ink, stroke: ink, strokeWidth: (GAP + LINE) * 2, strokeLinejoin: "round" }
  if (layer === "gap") return { fill: paper, stroke: paper, strokeWidth: GAP * 2, strokeLinejoin: "round" }
  return { fill: ink }
}

export interface GraffitiLetteringProps {
  /** One string per line. Only A–Z are drawn; anything else becomes a space. */
  lines: string[]
  /** Ink colour. Defaults to electric blue. */
  ink?: string
  /** Paper colour, used for the halo between the ink and its outline. */
  paper?: string
  /** A tapered ring orbiting the word, passing behind the top and in front of the bottom. */
  orbit?: boolean
  /** How many sparkles to scatter round the word. */
  stars?: number
  /** "draw" inks each stroke in pen order; "slam" drops letters in one by one. */
  mode?: "static" | "draw" | "slam"
  /** Delay in ms before the entrance starts. */
  delay?: number
  /** Letters hop when the pointer passes over them. */
  interactive?: boolean
  className?: string
  style?: React.CSSProperties
}

/** Hand-lettered sticker word(s). Decorative: give the page its own text. */
export function GraffitiLettering({
  lines,
  ink = "#2f1ced",
  paper = "#f8f4ea",
  orbit = false,
  stars = 0,
  mode = "static",
  delay = 0,
  interactive = false,
  className = "",
  style,
}: GraffitiLetteringProps) {
  const uid = "g" + React.useId().replace(/[^a-zA-Z0-9]/g, "")
  const key = lines.join("\n")
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const L = React.useMemo(() => layoutLines(lines), [key])
  const svgRef = React.useRef<SVGSVGElement>(null)
  const [bx0, by0, bx1, by1] = L.box
  const cx = (bx0 + bx1) / 2
  const cy = (by0 + by1) / 2
  const bw = bx1 - bx0
  const bh = by1 - by0

  // The ring: a tapered pen stroke round a tilted ellipse, split into the half
  // that passes behind the letters and the half that passes in front.
  const ring = React.useMemo(() => {
    if (!orbit) return null
    const rx = bw * 0.62
    const ry = Math.max(46, bh * 0.36)
    const box: Box = [Infinity, Infinity, -Infinity, -Infinity]
    const cs = arcCubics(rx, ry, Math.PI * 0.94, Math.PI * 2.78)
    const d = ribbon(cs, 0.5, 0.1, 0.5, box, 22)
    const start = cs[0][0]
    return { rx, ry, d, planet: start, moon: arcCubics(rx, ry, Math.PI * 0.1, Math.PI * 0.2)[0][0] }
  }, [orbit, bw, bh])

  const sparkles = React.useMemo(() => {
    const spots: [number, number, number][] = [
      [0.93, 0.04, 1],
      [0.02, 0.6, 0.7],
      [0.74, 1.02, 0.8],
      [0.3, 0.02, 0.55],
      [1.02, 0.62, 0.5],
      [0.12, 0.08, 0.42],
      [0.5, 1.06, 0.4],
    ]
    return spots.slice(0, stars).map(([u, v, s], i) => ({
      x: bx0 + bw * u,
      y: by0 + bh * v,
      s: s * 17,
      i,
    }))
  }, [stars, bx0, by0, bw, bh])

  const pad = GAP + LINE + 6
  const ex = ring ? Math.max(0, ring.rx * 1.02 - bw / 2) : 0
  const ey = ring ? Math.max(0, ring.ry * 1.3 - bh / 2) : 0
  const vb = [bx0 - pad - ex - 14, by0 - pad - ey - 18, bw + (pad + ex + 14) * 2, bh + (pad + ey + 18) * 2]

  const hop = (i: number) => {
    const els = svgRef.current?.querySelectorAll<SVGGElement>('[data-l="' + i + '"]')
    els?.forEach((el) =>
      el.animate(
        [
          { transform: "none" },
          { transform: "translateY(-10%) rotate(-8deg) scale(1.08)", offset: 0.35 },
          { transform: "none" },
        ],
        { duration: 620, easing: "cubic-bezier(.3,1.5,.4,1)" },
      ),
    )
  }

  const mask = (p: Placed) => (mode === "draw" ? "url(#" + uid + "m" + p.i + ")" : undefined)

  const letters = (layer: Layer) =>
    L.items.map((p) => (
      <g key={layer + p.i} transform={"translate(" + r1(p.x) + " " + r1(p.y) + ") rotate(" + r1(p.r) + ")"}>
        <g className="gsx-l" data-l={p.i} style={{ ["--i" as string]: p.i }}>
          <path d={p.g.d} mask={mask(p)} {...sticker(layer, ink, paper)} />
        </g>
      </g>
    ))

  const ringLayers = (half: "back" | "front") =>
    ring && (
      <g transform={"translate(" + r1(cx) + " " + r1(cy + bh * 0.12) + ") rotate(-10)"}>
        <g className="gsx-orbit" clipPath={"url(#" + uid + half + ")"}>
          {(["ring", "gap", "fill"] as Layer[]).map((layer) => (
            <g key={layer}>
              <path d={ring.d} {...sticker(layer, ink, paper)} />
              {half === "front" && (
                <>
                  <circle cx={r1(ring.planet[0])} cy={r1(ring.planet[1])} r={11} {...(sticker(layer, ink, paper) as object)} />
                  <circle cx={r1(ring.moon[0])} cy={r1(ring.moon[1])} r={5} {...(sticker(layer, ink, paper) as object)} />
                </>
              )}
            </g>
          ))}
        </g>
      </g>
    )

  return (
    <svg
      ref={svgRef}
      viewBox={vb.map(r1).join(" ")}
      className={"gsx-letters gsx-" + mode + " " + className}
      style={{ ["--gsx-delay" as string]: delay + "ms", ...style }}
      aria-hidden="true"
      focusable="false"
      onPointerOver={
        interactive
          ? (e) => {
              const l = (e.target as Element).closest?.("[data-l]")
              if (l) hop(Number(l.getAttribute("data-l")))
            }
          : undefined
      }
    >
      <defs>
        {ring && (
          <>
            <clipPath id={uid + "back"}>
              <rect x={-ring.rx - 80} y={-ring.ry - 80} width={ring.rx * 2 + 160} height={ring.ry + 80} />
            </clipPath>
            <clipPath id={uid + "front"}>
              <rect x={-ring.rx - 80} y={0} width={ring.rx * 2 + 160} height={ring.ry + 80} />
            </clipPath>
          </>
        )}
        {mode === "draw" &&
          L.items.map((p) => {
            const [x0, y0, x1, y1] = p.g.box
            return (
              <mask
                key={p.i}
                id={uid + "m" + p.i}
                maskUnits="userSpaceOnUse"
                x={r1(x0 - 40)}
                y={r1(y0 - 40)}
                width={r1(x1 - x0 + 80)}
                height={r1(y1 - y0 + 80)}
              >
                {p.g.spines.map((s, j) => (
                  <path
                    key={j}
                    d={s}
                    pathLength={1}
                    className="gsx-ink"
                    fill="none"
                    stroke="#fff"
                    strokeWidth={NIB * 2}
                    strokeLinecap="round"
                    style={{ ["--d" as string]: p.i * 150 + j * 170 + "ms" }}
                  />
                ))}
              </mask>
            )
          })}
      </defs>
      {ringLayers("back")}
      <g>{letters("ring")}</g>
      <g>{letters("gap")}</g>
      <g>{letters("fill")}</g>
      <g className="gsx-gloss">
        {L.items.map((p) => (
          <g key={p.i} transform={"translate(" + r1(p.x - 2.5) + " " + r1(p.y - 2.5) + ") rotate(" + r1(p.r) + ")"}>
            <g className="gsx-l" data-l={p.i} style={{ ["--i" as string]: p.i }}>
              {p.g.spines.map((s, j) => (
                <path
                  key={j}
                  d={s}
                  mask={mask(p)}
                  pathLength={1}
                  fill="none"
                  stroke={paper}
                  strokeWidth={2.2}
                  opacity={0.9}
                  strokeDasharray={j % 2 ? "0 0.34 0.16 1" : "0 0.16 0.24 1"}
                />
              ))}
            </g>
          </g>
        ))}
      </g>
      {ringLayers("front")}
      {sparkles.map((s) => (
        <g key={s.i} transform={"translate(" + r1(s.x) + " " + r1(s.y) + ")"}>
          <g className="gsx-star" style={{ ["--i" as string]: s.i }}>
            {(["ring", "gap", "fill"] as Layer[]).map((layer) => (
              <path
                key={layer}
                d={STAR}
                transform={"scale(" + r1(s.s) + ")"}
                {...sticker(layer, ink, paper)}
                strokeWidth={layer === "ring" ? ((GAP * 0.6 + LINE) * 2) / s.s : layer === "gap" ? (GAP * 1.2) / s.s : undefined}
              />
            ))}
          </g>
        </g>
      ))}
    </svg>
  )
}

/** The small planet / helmet / spark trio from the poster corners. */
export function GraffitiPlanets({ ink = "#2f1ced", className = "" }: { ink?: string; className?: string }) {
  return (
    <svg viewBox="0 0 132 44" className={"gsx-planets " + className} aria-hidden="true" focusable="false">
      <g fill={ink}>
        <circle cx="22" cy="23" r="12" />
        <path d={STAR} transform="translate(6 10) scale(4)" />
        <path d={STAR} transform="translate(38 36) scale(3)" />
        <circle cx="66" cy="23" r="13" />
        <circle cx="108" cy="25" r="11" />
        <path d={STAR} transform="translate(126 9) scale(3.4)" />
      </g>
      <g fill="none" stroke={ink} strokeWidth="2.4" strokeLinecap="round">
        <ellipse cx="22" cy="23" rx="21" ry="6" transform="rotate(-18 22 23)" />
        <path d="M49 21a17 17 0 0 1 34 0" />
        <path d="M94 8l5 5 5-5 5 5" />
      </g>
      <g fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round">
        <path d="M56 23h20" />
        <path d="M102 28l6-6 6 6" />
      </g>
    </svg>
  )
}

const ENGINE_CSS = `
.gsx-letters{display:block;max-width:none;overflow:visible}
.gsx-l,.gsx-star,.gsx-orbit{transform-box:fill-box;transform-origin:50% 60%}
.gsx-ink{stroke-dasharray:1 1;stroke-dashoffset:1.05;animation:gsx-ink .55s cubic-bezier(.6,.05,.3,1) forwards;animation-delay:calc(var(--gsx-delay) + var(--d))}
@keyframes gsx-ink{to{stroke-dashoffset:0}}
.gsx-draw .gsx-star{animation:gsx-pop .6s cubic-bezier(.3,1.7,.5,1) both,gsx-twinkle 2.6s ease-in-out infinite;animation-delay:calc(var(--gsx-delay) + 900ms + var(--i) * 120ms),calc(var(--gsx-delay) + 1600ms + var(--i) * 370ms)}
.gsx-static .gsx-star{animation:gsx-twinkle 2.6s ease-in-out infinite;animation-delay:calc(var(--i) * 370ms)}
.gsx-draw .gsx-orbit{animation:gsx-orbit-in 1.1s cubic-bezier(.2,.9,.2,1) both;animation-delay:calc(var(--gsx-delay) + 300ms)}
.gsx-slam .gsx-l{animation:gsx-slam .7s cubic-bezier(.2,1.45,.35,1) both;animation-delay:calc(var(--gsx-delay) + var(--i) * 80ms)}
.gsx-slam .gsx-orbit{animation:gsx-orbit-in .9s cubic-bezier(.2,.9,.2,1) both;animation-delay:calc(var(--gsx-delay) + 380ms)}
.gsx-slam .gsx-star{animation:gsx-pop .55s cubic-bezier(.3,1.7,.5,1) both,gsx-twinkle 2.2s ease-in-out infinite;animation-delay:calc(var(--gsx-delay) + 650ms + var(--i) * 90ms),calc(var(--gsx-delay) + 1300ms + var(--i) * 300ms)}
.gsx-slam .gsx-gloss{animation:gsx-fade .4s ease both;animation-delay:calc(var(--gsx-delay) + 700ms)}
@keyframes gsx-slam{0%{opacity:0;transform:translateY(-24%) scale(2.6) rotate(-18deg)}50%{opacity:1}100%{opacity:1;transform:none}}
@keyframes gsx-orbit-in{0%{opacity:0;transform:rotate(-28deg) scale(.35,.1)}100%{opacity:1;transform:none}}
@keyframes gsx-pop{0%{opacity:0;transform:scale(0) rotate(-90deg)}100%{opacity:1;transform:none}}
@keyframes gsx-twinkle{0%,100%{scale:1}50%{scale:.72}}
@keyframes gsx-fade{from{opacity:0}}
.gsx-planets{display:block;max-width:none;overflow:visible}
@media (prefers-reduced-motion:reduce){
.gsx-ink{animation:none;stroke-dashoffset:0}
.gsx-l,.gsx-star,.gsx-orbit,.gsx-gloss{animation:none !important}
}
`
// #endregion graffiti-engine

// #region graffiti-preloader
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
const ROWS = 5

export interface GraffitiScriptPreloaderProps {
  /** Revealed when the iris closes. Ignored when `loop` is true. */
  children?: React.ReactNode
  /** Replay the whole sequence forever as a showcase; children never show. */
  loop?: boolean
  /** Total run time in ms, reel through iris. Defaults to 5600. */
  durationMs?: number
  /**
   * Real loading progress, 0–100. When set, the counter follows it and the
   * reel keeps rolling until it reaches 100 (and half the reel has played).
   */
  progress?: number
  /** The word that slams in at the end. A–Z only. */
  word?: string
  /** Ink colour. Defaults to electric blue. */
  ink?: string
  /** Paper colour. Defaults to a warm off-white. */
  paper?: string
  /** Heading printed top-left. */
  title?: string
  /** Spaced small caps under the heading. */
  caption?: string
  /** Label in the outlined badge top-right. */
  badge?: string
  /** Mount children from the start instead of when the iris begins to close. */
  keepMounted?: boolean
  /** Root height. Must be a definite length. Defaults to "100svh". */
  height?: string
  /** Fired once the iris has closed and children are showing. */
  onComplete?: () => void
  className?: string
}

type Stage = "reel" | "word" | "exit" | "done"

const EXIT_MS = 1150

/** A row of alphabet stickers, drawn once in <defs> and reused by id. */
function StickerDefs({ uid, ink, paper }: { uid: string; ink: string; paper: string }) {
  return (
    <svg className="gsx-defs" width="0" height="0" aria-hidden="true" focusable="false">
      <defs>
        {ALPHABET.split("").map((ch, n) => {
          const g = glyph(ch)
          if (!g) return null
          const [x0, y0, x1, y1] = g.box
          const cx = (x0 + x1) / 2
          const cy = (y0 + y1) / 2
          const box: Box = [Infinity, Infinity, -Infinity, -Infinity]
          const swoosh = hash(n + 1) > 0.35 ? ribbon(arcCubics((x1 - x0) * 0.62, 20, Math.PI * 0.05, Math.PI * 0.95), 0.34, 0.2, 0.3, box, 20) : ""
          const tilt = r1(-8 - hash(n + 4) * 16)
          const sx = hash(n + 7) > 0.5 ? x1 - 4 : x0 + 6
          const sy = y0 + 10 + hash(n + 2) * 30
          return (
            <g key={ch} id={uid + "-" + ch}>
              {(["ring", "gap", "fill"] as Layer[]).map((layer) => (
                <g key={layer} {...(sticker(layer, ink, paper) as object)}>
                  <path d={g.d} />
                  {swoosh && <path d={swoosh} transform={"translate(" + r1(cx) + " " + r1(cy + 12) + ") rotate(" + tilt + ")"} />}
                  <path d={STAR} transform={"translate(" + r1(sx) + " " + r1(sy) + ") scale(12)"} strokeWidth={layer === "fill" ? 0 : layer === "ring" ? 1.1 : 0.9} />
                  <path d={STAR} transform={"translate(" + r1(x0 + (x1 - x0) * hash(n + 5)) + " " + r1(y1 - 6) + ") scale(7)"} strokeWidth={layer === "fill" ? 0 : layer === "ring" ? 1.9 : 1.5} />
                </g>
              ))}
              {g.spines.map((s, j) => (
                <path key={j} d={s} transform="translate(-2.5 -2.5)" pathLength={1} fill="none" stroke={paper} strokeWidth={2.2} strokeDasharray="0 0.18 0.22 1" />
              ))}
            </g>
          )
        })}
      </defs>
    </svg>
  )
}

function Tile({ uid, ch, k }: { uid: string; ch: string; k: number }) {
  const g = glyph(ch)
  if (!g) return null
  const [x0, y0, x1, y1] = g.box
  const vx = x0 - 16
  const vy = y0 - 14
  const vw = x1 - x0 + 32
  const vh = y1 - y0 + 28
  return (
    <span className="gsx-tile" style={{ ["--k" as string]: k, ["--ar" as string]: r1(vw / vh) }}>
      <svg viewBox={[vx, vy, vw, vh].map(r1).join(" ")} aria-hidden="true" focusable="false">
        <use href={"#" + uid + "-" + ch} />
      </svg>
    </span>
  )
}

export function GraffitiScriptPreloader({
  children,
  loop = false,
  durationMs = 5600,
  progress,
  word = "LEGENDS",
  ink = "#2f1ced",
  paper = "#f8f4ea",
  title = "ENGLISH ALPHABET",
  caption = "GRAFFITI / CALLIGRAPHY STYLE",
  badge = "ALPHABET",
  keepMounted = false,
  height = "100svh",
  onComplete,
  className = "",
}: GraffitiScriptPreloaderProps) {
  const uid = "gsx" + React.useId().replace(/[^a-zA-Z0-9]/g, "")
  const [stage, setStage] = React.useState<Stage>("reel")
  const [count, setCount] = React.useState(0)
  const [cycle, setCycle] = React.useState(0)
  const progressRef = React.useRef(progress)
  progressRef.current = progress
  const doneRef = React.useRef(onComplete)
  doneRef.current = onComplete

  React.useEffect(() => {
    const reelMs = Math.max(1200, durationMs * 0.62)
    const wordMs = Math.max(900, durationMs * 0.38 - EXIT_MS)
    let raf = 0
    let t0 = performance.now()
    let tWord = 0
    let tExit = 0
    let shown = -1
    let current: Stage = "reel"
    const go = (s: Stage) => {
      current = s
      setStage(s)
    }
    const tick = (now: number) => {
      const el = now - t0
      if (current === "reel") {
        const ctl = progressRef.current
        const auto = Math.min(1, el / reelMs)
        const p = ctl == null ? auto : Math.max(0, Math.min(1, ctl / 100))
        const n = Math.floor(p * 100)
        if (n !== shown) setCount((shown = n))
        if (p >= 1 && el >= (ctl == null ? reelMs : reelMs * 0.5)) {
          tWord = now
          go("word")
        }
      } else if (current === "word" && now - tWord >= wordMs) {
        tExit = now
        go("exit")
      } else if (current === "exit" && now - tExit >= EXIT_MS) {
        if (loop) {
          t0 = now
          shown = -1
          setCycle((c) => c + 1)
          go("reel")
        } else {
          go("done")
          doneRef.current?.()
          return
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [durationMs, loop])

  const rows = React.useMemo(
    () =>
      Array.from({ length: ROWS }, (_, r) => {
        const off = (r * 7) % 26
        return (ALPHABET.slice(off) + ALPHABET.slice(0, off)).split("")
      }),
    [],
  )
  const flyers = React.useMemo(() => "GRAFITYSK".split(""), [])
  const reveal = !loop && (keepMounted || stage === "exit" || stage === "done")
  const wordLines = React.useMemo(() => [word], [word])

  return (
    <div
      className={"gsx-root " + className}
      data-stage={stage}
      style={{ height, ["--ink" as string]: ink, ["--paper" as string]: paper }}
    >
      <style>{ENGINE_CSS + PRELOADER_CSS}</style>
      {reveal && <div className="gsx-dest">{children}</div>}
      {stage !== "done" && (
        <div
          className="gsx-gate"
          role="progressbar"
          aria-label="Loading"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={count}
          aria-busy={stage !== "exit"}
        >
          <div className="gsx-flood" />
          <div className="gsx-scene" key={cycle} aria-hidden="true">
            <StickerDefs uid={uid} ink={ink} paper={paper} />
            <Halftone ink={ink} corner="tl" />
            <Halftone ink={ink} corner="br" />

            <div className="gsx-reel">
              {rows.map((seq, r) => (
                <div key={r} className="gsx-row" style={{ ["--row" as string]: r, ["--dir" as string]: r % 2 ? 1 : -1 }}>
                  <div className="gsx-track" style={{ animationDuration: 16 + r * 3 + "s", animationDirection: r % 2 ? "reverse" : "normal" }}>
                    {seq.concat(seq).map((ch, k) => (
                      <Tile key={k} uid={uid} ch={ch} k={k} />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="gsx-flyers">
              {flyers.map((ch, i) => {
                const a = hash(i + 21) * Math.PI * 2
                return (
                  <span
                    key={i}
                    className="gsx-fly"
                    style={{
                      ["--fx" as string]: r1(Math.cos(a) * 62) + "cqw",
                      ["--fy" as string]: r1(Math.sin(a) * 52) + "cqh",
                      ["--fr" as string]: r1((hash(i + 8) - 0.5) * 60) + "deg",
                      animationDelay: i * 0.42 + "s",
                    }}
                  >
                    <Tile uid={uid} ch={ch} k={0} />
                  </span>
                )
              })}
            </div>

            <div className="gsx-hud">
              <div className="gsx-head">
                <div className="gsx-serif gsx-title">{title}</div>
                <div className="gsx-cap">{caption}</div>
              </div>
              <div className="gsx-rule">
                <i style={{ transform: "scaleX(" + count / 100 + ")" }} />
                <b style={{ left: count + "%" }} />
              </div>
              <div className="gsx-corner">
                <GraffitiPlanets ink={ink} />
                <span className="gsx-badge gsx-serif">{badge}</span>
              </div>
              <div className="gsx-count">
                <span className="gsx-count-label gsx-serif">Loading</span>
                <span className="gsx-count-num">{String(count).padStart(3, "0")}</span>
              </div>
              <div className="gsx-foot">
                <span className="gsx-sparks">
                  {[0, 1, 2].map((i) => (
                    <svg key={i} viewBox="-1 -1 2 2" aria-hidden="true">
                      <path d={STAR} fill={ink} />
                    </svg>
                  ))}
                </span>
                <span className="gsx-cap">A–Z LETTERING SET · BRUSH SKELETONS · STICKER INK</span>
              </div>
            </div>

            {stage !== "reel" && (
              <div className="gsx-word">
                <GraffitiLettering lines={wordLines} ink={ink} paper={paper} orbit stars={5} mode="slam" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/** A wavy corner blob that breaks up into a halftone fringe. */
function Halftone({ ink, corner }: { ink: string; corner: "tl" | "br" }) {
  return (
    <div className={"gsx-blob gsx-blob-" + corner} aria-hidden="true">
      <div className="gsx-dots" style={{ ["--ink" as string]: ink }} />
      <svg viewBox="0 0 400 300" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <path fill={ink} d="M0 0H400C352 18 318 62 300 110C284 152 262 176 226 162C196 150 174 170 168 206C160 250 110 272 60 250C34 240 14 262 0 300Z" />
      </svg>
    </div>
  )
}

const PRELOADER_CSS = `
.gsx-root{position:relative;width:100%;overflow:hidden;background:var(--paper);color:var(--ink);container-type:size;isolation:isolate}
.gsx-dest{position:absolute;inset:0;overflow-y:auto;overflow-x:hidden}
.gsx-gate{position:absolute;inset:0;z-index:10;overflow:hidden}
.gsx-flood{position:absolute;inset:0;background:var(--ink)}
.gsx-scene{position:absolute;inset:0;overflow:hidden;background:var(--paper);clip-path:circle(75% at 50% 50%)}
.gsx-scene::after{content:"";position:absolute;inset:0;pointer-events:none;opacity:.5;mix-blend-mode:multiply;background-image:radial-gradient(rgba(40,30,120,.12) 1px,transparent 1.2px);background-size:4px 4px}
.gsx-defs{position:absolute;width:0;height:0;overflow:hidden}
.gsx-serif{font-family:"Copperplate","Copperplate Gothic Bold","Engravers MT","Bodoni 72","Didot",Georgia,serif;font-weight:700;letter-spacing:.08em;text-transform:uppercase}
.gsx-cap{font-family:ui-sans-serif,system-ui,sans-serif;font-size:max(8px,1.1cqmin);letter-spacing:.42em;text-transform:uppercase;font-weight:500}
.gsx-blob{position:absolute;width:10cqw;height:15cqh;z-index:3;pointer-events:none;animation:gsx-breathe 7s ease-in-out infinite}
.gsx-blob svg{position:absolute;inset:0;width:100%;height:100%;max-width:none;display:block}
.gsx-blob-tl{left:0;top:0}
.gsx-blob-br{right:0;bottom:0;width:24cqw;height:30cqh;transform:rotate(180deg)}
.gsx-blob-br{animation-name:gsx-breathe-r}
.gsx-dots{position:absolute;inset:-6% -14% -26% -8%;background-image:radial-gradient(var(--ink) 34%,transparent 40%);background-size:6px 6px;-webkit-mask-image:radial-gradient(115% 110% at 0 0,#000 42%,transparent 78%);mask-image:radial-gradient(115% 110% at 0 0,#000 42%,transparent 78%)}
@keyframes gsx-breathe{50%{transform:translate(-1.2%,-1.6%) scale(1.03)}}
@keyframes gsx-breathe-r{0%,100%{transform:rotate(180deg)}50%{transform:rotate(180deg) translate(-1.2%,-1.6%) scale(1.03)}}
.gsx-reel{position:absolute;left:50%;top:50%;width:160cqw;display:flex;flex-direction:column;gap:1.5cqh;transform:translate(-50%,-50%) rotate(-9deg);z-index:1}
.gsx-row{--rowh:clamp(56px,19cqh,190px);height:var(--rowh);animation:gsx-row-in 1.2s cubic-bezier(.16,.9,.2,1) both;animation-delay:calc(var(--row) * 110ms)}
.gsx-row:nth-child(1),.gsx-row:nth-child(5){opacity:.55;filter:saturate(.7)}
.gsx-track{display:flex;width:max-content;height:100%;animation:gsx-marquee linear infinite;will-change:transform}
.gsx-tile{display:block;height:var(--rowh);width:calc(var(--rowh) * var(--ar));margin-right:calc(var(--rowh) * -.12);flex:none;animation:gsx-roll 1.6s ease-in-out infinite alternate;animation-delay:calc(var(--k) * -170ms)}
.gsx-tile svg{display:block;width:100%;height:100%;max-width:none;overflow:visible}
@keyframes gsx-marquee{to{transform:translateX(-50%)}}
@keyframes gsx-roll{0%{transform:rotate(-7deg) translateY(5%)}100%{transform:rotate(6deg) translateY(-5%)}}
@keyframes gsx-row-in{0%{opacity:0;transform:translateX(calc(var(--dir) * 70%)) skewX(calc(var(--dir) * 12deg))}100%{opacity:1;transform:none}}
.gsx-root[data-stage="word"] .gsx-row,.gsx-root[data-stage="exit"] .gsx-row{animation:gsx-row-out .8s cubic-bezier(.7,0,.8,.4) both;animation-delay:calc(var(--row) * 60ms)}
@keyframes gsx-row-out{0%{transform:none;opacity:1}100%{transform:translateX(calc(var(--dir) * -110%)) skewX(calc(var(--dir) * -20deg));opacity:0}}
.gsx-flyers{position:absolute;inset:0;z-index:4;pointer-events:none}
.gsx-fly{position:absolute;left:50%;top:50%;--rowh:26cqh;opacity:0;animation:gsx-fly 3.8s cubic-bezier(.55,0,.9,.5) infinite}
.gsx-fly .gsx-tile{animation:none;margin:0}
@keyframes gsx-fly{0%{opacity:0;transform:translate(-50%,-50%) scale(.12) rotate(0deg)}18%{opacity:1}70%{opacity:1}100%{opacity:0;transform:translate(calc(-50% + var(--fx)),calc(-50% + var(--fy))) scale(3.4) rotate(var(--fr))}}
.gsx-root[data-stage="word"] .gsx-flyers,.gsx-root[data-stage="exit"] .gsx-flyers{opacity:0;transition:opacity .3s}
.gsx-hud{position:absolute;inset:0;z-index:6;pointer-events:none}
.gsx-head{position:absolute;left:clamp(16px,11cqw,160px);top:clamp(16px,6cqh,64px);background:var(--paper);box-shadow:0 0 22px 18px var(--paper)}
.gsx-title{font-size:clamp(13px,2.2cqmin,28px)}
.gsx-head .gsx-cap{margin-top:.5em}
.gsx-rule{position:absolute;left:40cqw;right:30cqw;top:calc(clamp(16px,6cqh,64px) + .6em);height:2px}
.gsx-rule i{position:absolute;inset:0;background:var(--ink);transform-origin:0 50%}
.gsx-rule b{position:absolute;top:50%;width:9px;height:9px;margin:-4.5px 0 0 -4.5px;border-radius:50%;background:var(--ink)}
.gsx-rule::before{content:"";position:absolute;inset:0;background:var(--ink);opacity:.18}
.gsx-corner{position:absolute;right:clamp(16px,5cqw,80px);top:clamp(14px,5cqh,56px);display:flex;align-items:center;gap:clamp(8px,1.6cqw,22px);background:var(--paper);box-shadow:0 0 22px 18px var(--paper)}
.gsx-corner .gsx-planets{width:clamp(70px,9cqw,132px);height:auto}
.gsx-badge{border:2px solid var(--ink);padding:.45em 1em;font-size:clamp(11px,1.8cqmin,22px);letter-spacing:.14em;line-height:1}
.gsx-count{position:absolute;left:clamp(16px,5cqw,80px);bottom:clamp(16px,6cqh,64px);border:2px solid var(--ink);background:var(--paper);box-shadow:0 0 0 6px var(--paper),0 0 26px 16px var(--paper);padding:.5em .9em .4em;display:flex;flex-direction:column;line-height:1}
.gsx-count-label{font-size:clamp(9px,1.2cqmin,14px);letter-spacing:.3em}
.gsx-count-num{font-family:"Arial Black","Helvetica Neue",Arial,sans-serif;font-weight:900;font-size:clamp(28px,7cqmin,86px);letter-spacing:-.02em;font-variant-numeric:tabular-nums;margin-top:.12em}
.gsx-foot{position:absolute;right:26cqw;bottom:clamp(16px,6cqh,64px);display:flex;flex-direction:column;align-items:flex-end;gap:.8em;background:var(--paper);box-shadow:0 0 22px 18px var(--paper);max-width:40cqw;text-align:right}
.gsx-sparks{display:flex;gap:6px}
.gsx-sparks svg{width:clamp(12px,1.8cqmin,22px);height:clamp(12px,1.8cqmin,22px);display:block;max-width:none;animation:gsx-spark 1.4s ease-in-out infinite}
.gsx-sparks svg:nth-child(2){animation-delay:.2s}
.gsx-sparks svg:nth-child(3){animation-delay:.4s}
@keyframes gsx-spark{50%{transform:scale(.55) rotate(45deg)}}
.gsx-word{position:absolute;inset:0;z-index:5;display:grid;place-items:center;pointer-events:none}
.gsx-word::before{content:"";position:absolute;inset:0;background:var(--paper);animation:gsx-fade .45s ease both}
.gsx-word .gsx-letters{position:relative;width:min(84cqw,150cqh);height:auto;max-height:70cqh}
.gsx-root[data-stage="exit"] .gsx-scene{animation:gsx-iris .8s cubic-bezier(.75,0,.25,1) both}
.gsx-root[data-stage="exit"] .gsx-flood{animation:gsx-iris .75s cubic-bezier(.75,0,.25,1) .3s both}
.gsx-root[data-stage="exit"] .gsx-word .gsx-letters{animation:gsx-suck .8s cubic-bezier(.7,0,.3,1) both}
@keyframes gsx-iris{0%{clip-path:circle(75% at 50% 50%)}100%{clip-path:circle(0% at 50% 50%)}}
@keyframes gsx-suck{100%{transform:scale(.4) rotate(8deg)}}
@container (max-width:640px){
.gsx-rule,.gsx-foot .gsx-cap,.gsx-corner .gsx-planets{display:none}
.gsx-head{left:16px}
.gsx-row{--rowh:clamp(48px,14cqh,120px)}
}
@media (prefers-reduced-motion:reduce){
.gsx-track,.gsx-tile,.gsx-row,.gsx-blob,.gsx-sparks svg{animation:none !important}
.gsx-flyers{display:none}
.gsx-root[data-stage="exit"] .gsx-scene,.gsx-root[data-stage="exit"] .gsx-flood{animation:gsx-fade-out .5s ease both}
@keyframes gsx-fade-out{to{opacity:0}}
}
`
// #endregion graffiti-preloader

export default GraffitiScriptPreloader
