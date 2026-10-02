"use client"

import * as React from "react"

/**
 * Hiring Rig Poster — a "now hiring" poster built as a piece of hardware. A
 * frosted acrylic panel hangs from a chrome rig on orange cables: a dot-matrix
 * LED header, a role band, a seven-segment date, the recruiting e-mail, a field
 * of glyphs, an info card, an amber charge meter, a speaker, and a glass
 * capsule of glowing fluid slung underneath.
 *
 * Everything is drawn here. The hardware is SVG, the LED header is two
 * canvases (the lit dots, then their bloom), and the words and controls are
 * HTML so they stay crisp, readable to screen readers and reachable by keyboard.
 *
 * It answers you:
 *  - the rig turns toward the pointer and the acrylic catches the light;
 *  - drag the panel sideways and it swings on its cables; the fluid in the
 *    capsule stays level and sloshes;
 *  - the LED dots brighten under the pointer; click the screen for the next message;
 *  - click the date to see the countdown to `deadline` (or to re-roll it);
 *  - click the e-mail to copy it, or the arrow beside it to open a mail;
 *  - the glyph field ripples under the pointer and when clicked;
 *  - press the orange ✦ button to apply: the screen thanks you, the meter
 *    jumps, the capsule boils and `onApply` fires;
 *  - hover the info card to read it, click the speaker to mute the blips.
 *
 * One file. React is the only import. The font arrives by an injected <link>,
 * never a CSS import, and the poster still reads on the fallback stack.
 * Reduced motion holds the rig still and sets every change without animating.
 */

export type HiringRigPalette = {
  /** The studio wall behind the rig. */
  backdrop: string
  /** The hot light in the print, the ✦ button, the meter and the fluid. */
  glow: string
  /** The cool top of the print, around the screen and the role band. */
  blush: string
  /** The cool end of the LED gradient. */
  lilac: string
  /** The warm end of the LED gradient. */
  led: string
  /** Type and line work printed on the panel: the date, the e-mail, the glyphs. */
  ink: string
  /** The role line. */
  band: string
  /** The LED screen and the info card. */
  screen: string
  /** Black plastic: the spine, the fins, the speaker. */
  hardware: string
  /** The main cables. */
  cable: string
  /** The yellow loop. */
  cableAlt: string
  /** The status light on the info card. */
  signal: string
}

export type HiringRigRequirement = { label: string; value: string }

export type HiringRigPosterProps = {
  /** The LED header, one string per line. Two lines fit; a short first line trails off toward the star. */
  headline?: string[]
  /** More LED messages, shown in turn when the screen is clicked. Defaults to a few built from the props. */
  messages?: string[][]
  /** What the screen says after the ✦ button is pressed. */
  thanks?: string[]
  /** The role line under the screen. Squeezed to fit. */
  role?: string
  /** First day of the window, e.g. `09.05`. */
  from?: string
  /** Last day of the window. */
  to?: string
  /** When applications close (ISO string, timestamp or Date). Clicking the date then toggles a live countdown. */
  deadline?: string | number | Date
  /** The small line above the e-mail. */
  emailLabel?: string
  /** Copied to the clipboard on click. */
  email?: string
  /** The info card's heading. */
  lookingFor?: string
  /** The info card's table: three to a row. */
  requirements?: HiringRigRequirement[]
  /** The info card's second heading. */
  addressLabel?: string
  address?: string
  /** The info card's footer, first line. */
  tagline?: string
  /** The info card's footer, second line. A "✦" in it is drawn as the star. */
  studio?: string
  /** Small print on the foot of the panel. */
  site?: string
  /** Accessible name of the ✦ button. */
  applyLabel?: string
  /** Where the ✦ button goes, in a new tab. Without it the button only fires `onApply`. */
  applyHref?: string
  onApply?: () => void
  /** Hex colours. Partial: anything missing keeps its default. */
  palette?: Partial<HiringRigPalette>
  /** Whether the speaker starts on. Blips only ever follow a click. */
  sound?: boolean
  /** Pointer tilt, drag-to-swing and the LED torch. The controls always work. */
  interactive?: boolean
  /** The technical captions in the corners. */
  captions?: boolean
  /** Stylesheet for Tektur. `null` loads nothing. */
  fontHref?: string | null
  /** Font stack for every word on the poster. */
  font?: string
  /** Root height. Must be a definite length. */
  height?: string
  className?: string
}

const DEFAULT_PALETTE: HiringRigPalette = {
  backdrop: "#dfe4e9",
  glow: "#ff7a1a",
  blush: "#ece2f1",
  lilac: "#c6c0ff",
  led: "#ffc79c",
  ink: "#58121b",
  band: "#28235a",
  screen: "#0b0a0f",
  hardware: "#16171b",
  cable: "#ff7a12",
  cableAlt: "#ffb21a",
  signal: "#4fd8ff",
}

const HEADLINE = ["WE ARE", "NOW HIRING!"]
const THANKS = ["THANK YOU", "TALK SOON!"]
const REQUIREMENTS: HiringRigRequirement[] = [
  { label: "Based On", value: "Cinema 4D" },
  { label: "Renderer", value: "Octane" },
  { label: "Preferential", value: "Unreal Engine User" },
]

const FONT_HREF = "https://fonts.googleapis.com/css2?family=Tektur:wdth,wght@75..100,400..800&display=swap"
const FACE = 'Tektur, Bahnschrift, "DIN Alternate", "Roboto Condensed", "Arial Narrow", sans-serif'

// #region logic
type RGB = [number, number, number]

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v)

const rng = (seed: number) => {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** #rgb or #rrggbb. Anything else falls back, so the hardware never goes black. */
const hexRGB = (c: string | undefined, fallback: RGB): RGB => {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec((c || "").trim())
  if (!m) return fallback
  const h = m[1].length === 3 ? m[1].replace(/./g, (x) => x + x) : m[1]
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}
const mix = (a: RGB, b: RGB, t: number): RGB => [
  Math.round(a[0] + (b[0] - a[0]) * t),
  Math.round(a[1] + (b[1] - a[1]) * t),
  Math.round(a[2] + (b[2] - a[2]) * t),
]
const rgba = (c: RGB, a = 1) => "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a + ")"
const luma = (c: RGB) => 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]

/**
 * The LED face: 7 rows, "#" lit. Widths vary — most glyphs are 5 columns,
 * I is 3 and the punctuation narrower — and one dark column sits between glyphs.
 */
const DOTS: { [ch: string]: string } = {
  " ": "...|...|...|...|...|...|...",
  A: ".###.|#...#|#...#|#####|#...#|#...#|#...#",
  B: "####.|#...#|#...#|####.|#...#|#...#|####.",
  C: ".###.|#...#|#....|#....|#....|#...#|.###.",
  D: "####.|#...#|#...#|#...#|#...#|#...#|####.",
  E: "#####|#....|#....|####.|#....|#....|#####",
  F: "#####|#....|#....|####.|#....|#....|#....",
  G: ".###.|#...#|#....|#.###|#...#|#...#|.###.",
  H: "#...#|#...#|#...#|#####|#...#|#...#|#...#",
  I: "###|.#.|.#.|.#.|.#.|.#.|###",
  J: "..###|...#.|...#.|...#.|#..#.|#..#.|.##..",
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
  "0": ".###.|#...#|#..##|#.#.#|##..#|#...#|.###.",
  "1": "..#..|.##..|..#..|..#..|..#..|..#..|.###.",
  "2": ".###.|#...#|....#|...#.|..#..|.#...|#####",
  "3": "####.|....#|....#|.###.|....#|....#|####.",
  "4": "...#.|..##.|.#.#.|#..#.|#####|...#.|...#.",
  "5": "#####|#....|####.|....#|....#|#...#|.###.",
  "6": "..##.|.#...|#....|####.|#...#|#...#|.###.",
  "7": "#####|....#|...#.|..#..|.#...|.#...|.#...",
  "8": ".###.|#...#|#...#|.###.|#...#|#...#|.###.",
  "9": ".###.|#...#|#...#|.####|....#|...#.|.##..",
  "!": "#|#|#|#|#|.|#",
  "?": ".###.|#...#|....#|...#.|..#..|.....|..#..",
  ".": ".|.|.|.|.|.|#",
  ",": "..|..|..|..|..|.#|#.",
  ":": ".|#|.|.|.|#|.",
  ";": "..|.#|..|..|..|.#|#.",
  "'": "#|#|.|.|.|.|.",
  '"': "#.#|#.#|...|...|...|...|...",
  "-": "....|....|....|####|....|....|....",
  "~": "......|......|......|######|......|......|......",
  _: ".....|.....|.....|.....|.....|.....|#####",
  "+": ".....|..#..|..#..|#####|..#..|..#..|.....",
  "=": ".....|.....|#####|.....|#####|.....|.....",
  "/": "....#|...#.|...#.|..#..|.#...|.#...|#....",
  "&": ".##..|#..#.|#.#..|.#...|#.#.#|#..#.|.##.#",
  "@": ".###.|#...#|#.###|#.#.#|#.###|#....|.###.",
  "#": ".#.#.|.#.#.|#####|.#.#.|#####|.#.#.|.#.#.",
  "%": "##..#|##..#|...#.|..#..|.#...|#..##|#..##",
  "*": "..#..|..#..|.###.|#####|.###.|..#..|..#..",
  "(": "..#|.#.|#..|#..|#..|.#.|..#",
  ")": "#..|.#.|..#|..#|..#|.#.|#..",
  "<": "...#|..#.|.#..|#...|.#..|..#.|...#",
  ">": "#...|.#..|..#.|...#|..#.|.#..|#...",
}
/** Typographic look-alikes, folded onto the face above. */
const DOT_ALIAS: { [ch: string]: string } = {
  "✦": "*", "★": "*", "—": "~", "–": "-", "’": "'", "‘": "'", "“": '"', "”": '"', "·": ".", "…": ".",
}
const LED_GLYPH_ROWS = 7

/** One line of text as a grid of lit dots, `w` columns by 7 rows. Unknown characters are blank. */
const layoutText = (text: string) => {
  const glyphs: string[][] = []
  for (const raw of Array.from(text.toUpperCase())) {
    const ch = DOT_ALIAS[raw] ?? raw
    glyphs.push((DOTS[ch] ?? DOTS[" "]).split("|"))
  }
  const w = glyphs.reduce((s, g) => s + g[0].length, 0) + Math.max(0, glyphs.length - 1)
  const bits = new Uint8Array(w * LED_GLYPH_ROWS)
  let x = 0
  for (const g of glyphs) {
    const gw = g[0].length
    for (let y = 0; y < LED_GLYPH_ROWS; y++)
      for (let i = 0; i < gw; i++) if (g[y][i] === "#") bits[y * w + x + i] = 1
    x += gw + 1
  }
  return { w, bits }
}

/**
 * A whole screen: up to two lines, left-aligned one column in (flush when a
 * line needs every column). A single line sits in the middle. A line wider
 * than the screen runs as a marquee, `scroll` columns along. `ends` is where
 * each line stops, for the trail.
 */
const composeScreen = (lines: string[], cols: number, rows: number, scroll: number) => {
  const grid = new Uint8Array(cols * rows)
  const shown = lines.slice(0, 2)
  const ends: number[] = []
  let overflow = false
  shown.forEach((text, li) => {
    const { w, bits } = layoutText(text)
    const top = shown.length === 1 ? Math.floor((rows - LED_GLYPH_ROWS) / 2) : 1 + li * (LED_GLYPH_ROWS + 3)
    const fits = w <= cols
    const lead = Math.min(1, cols - w)
    if (!fits) overflow = true
    const span = w + 8
    const off = Math.floor(scroll)
    for (let y = 0; y < LED_GLYPH_ROWS; y++) {
      if (top + y >= rows) break
      for (let c = 0; c < cols; c++) {
        const x = fits ? c - lead : (((c + off) % span) + span) % span
        if (x >= 0 && x < w && bits[y * w + x]) grid[(top + y) * cols + c] = 1
      }
    }
    ends.push(fits ? w + lead : cols)
  })
  return { grid, ends, overflow }
}

/** Seven-segment masks, bit 0 = a (top) … bit 6 = g (middle). Letters take their usual LCD shapes. */
const SEG: { [ch: string]: number } = {
  "0": 0b0111111, "1": 0b0000110, "2": 0b1011011, "3": 0b1001111, "4": 0b1100110,
  "5": 0b1101101, "6": 0b1111101, "7": 0b0000111, "8": 0b1111111, "9": 0b1101111,
  "-": 0b1000000, _: 0b0001000, " ": 0,
  A: 0b1110111, B: 0b1111100, C: 0b0111001, D: 0b1011110, E: 0b1111001, F: 0b1110001,
  G: 0b0111101, H: 0b1110110, I: 0b0110000, J: 0b0011110, L: 0b0111000, N: 0b1010100,
  O: 0b0111111, P: 0b1110011, R: 0b1010000, S: 0b1101101, T: 0b1111000, U: 0b0111110, Y: 0b1101110,
}

type SegCell = { kind: "d" | "." | ":"; mask: number }

/** The date as display cells: full-width digits, and narrow cells for "." and ":". */
const segCells = (text: string): SegCell[] => {
  const out: SegCell[] = []
  for (const ch of Array.from(text.toUpperCase())) {
    if (ch === "." || ch === ",") out.push({ kind: ".", mask: 0 })
    else if (ch === ":") out.push({ kind: ":", mask: 0 })
    else out.push({ kind: "d", mask: SEG[ch] ?? 0 })
  }
  return out
}

/** The seven segments of a w×h digit with stroke t and joint gap g, as polygon point lists a…g. */
const segPolys = (w: number, h: number, t: number, g: number) => {
  const hx = (x1: number, x2: number, y: number) =>
    [[x1, y], [x1 + t / 2, y - t / 2], [x2 - t / 2, y - t / 2], [x2, y], [x2 - t / 2, y + t / 2], [x1 + t / 2, y + t / 2]]
  const vx = (y1: number, y2: number, x: number) =>
    [[x, y1], [x + t / 2, y1 + t / 2], [x + t / 2, y2 - t / 2], [x, y2], [x - t / 2, y2 - t / 2], [x - t / 2, y1 + t / 2]]
  const L = t / 2
  const R = w - t / 2
  const T = t / 2
  const M = h / 2
  const B = h - t / 2
  const polys = [
    hx(L + g, R - g, T), // a
    vx(T + g, M - g, R), // b
    vx(M + g, B - g, R), // c
    hx(L + g, R - g, B), // d
    vx(M + g, B - g, L), // e
    vx(T + g, M - g, L), // f
    hx(L + g, R - g, M), // g
  ]
  return polys.map((p) => p.map(([x, y]) => x.toFixed(1) + "," + y.toFixed(1)).join(" "))
}

const pad2 = (n: number) => (n < 10 ? "0" : "") + n

/** Time left as DDdHH:MM:SS, the same nine wide and two narrow cells the dates take. */
const countdown = (ms: number) => {
  if (!(ms > 0)) return "CLOSED"
  const s = Math.floor(ms / 1000)
  const d = Math.min(99, Math.floor(s / 86400))
  return pad2(d) + "D" + pad2(Math.floor(s / 3600) % 24) + ":" + pad2(Math.floor(s / 60) % 60) + ":" + pad2(s % 60)
}

const parseDeadline = (v: string | number | Date | undefined) => {
  if (v === undefined || v === null || v === "") return null
  const t = v instanceof Date ? v.getTime() : typeof v === "number" ? v : Date.parse(v)
  return Number.isFinite(t) ? t : null
}

/** One frame of the digit roll, p from 0 to 1: digits settle left to right, everything else holds. */
const rollAt = (target: string, p: number, rand: () => number) => {
  if (p >= 1) return target
  let s = ""
  const n = target.length
  for (let i = 0; i < n; i++) {
    const c = target[i]
    const settle = 0.3 + 0.7 * ((i + 1) / n)
    s += /[0-9]/.test(c) && p < settle ? String(Math.floor(rand() * 10)) : c
  }
  return s
}

type CablePt = [number, number, number]

const rotateAbout = (x: number, y: number, cx: number, cy: number, a: number) => {
  const c = Math.cos(a)
  const s = Math.sin(a)
  const dx = x - cx
  const dy = y - cy
  return [cx + dx * c - dy * s, cy + dx * s + dy * c]
}

/**
 * Where a cable's points are when the panel has swung by `a`. Each point
 * carries a weight: 0 is fixed to the rig, 1 rides with the panel, and the
 * ones between bend the cable from one to the other.
 */
const placeCable = (pts: CablePt[], a: number, cx: number, cy: number) =>
  pts.map(([x, y, w]) => {
    if (!w || !a) return [x, y]
    const [rx, ry] = rotateAbout(x, y, cx, cy, a)
    return [x + (rx - x) * w, y + (ry - y) * w]
  })

/** A Catmull-Rom spline through the points, as cubic Béziers. */
const smoothPath = (pts: number[][]) => {
  if (pts.length < 2) return ""
  const f = (v: number) => v.toFixed(1)
  let d = "M" + f(pts[0][0]) + " " + f(pts[0][1])
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] || p2
    d +=
      "C" + f(p1[0] + (p2[0] - p0[0]) / 6) + " " + f(p1[1] + (p2[1] - p0[1]) / 6) +
      " " + f(p2[0] - (p3[0] - p1[0]) / 6) + " " + f(p2[1] - (p3[1] - p1[1]) / 6) +
      " " + f(p2[0]) + " " + f(p2[1])
  }
  return d
}

type Swing = { a: number; v: number }

/** A damped spring toward `target`, semi-implicit Euler. Stable well past the 1/30 s the loop clamps to. */
const swingStep = (s: Swing, target: number, dt: number, k: number, c: number) => {
  s.v += (-k * (s.a - target) - c * s.v) * dt
  s.a += s.v * dt
}

/** The fluid's surface in the capsule: a line at `level` tilted by `slope`, with a small travelling wave. */
const fluidSurface = (x0: number, x1: number, level: number, slope: number, t: number, amp: number) => {
  const n = 20
  const xc = (x0 + x1) / 2
  let d = ""
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n
    const y = level + (x - xc) * slope + amp * Math.sin(x * 0.045 + t * 3.1) + amp * 0.45 * Math.sin(x * 0.11 - t * 4.3)
    d += (i ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1)
  }
  return d
}
/** ...and the body of fluid under it, closed along the bottom. */
const fluidPath = (x0: number, x1: number, level: number, bottom: number, slope: number, t: number, amp: number) =>
  fluidSurface(x0, x1, level, slope, t, amp) + "L" + x1 + " " + bottom + "L" + x0 + " " + bottom + "Z"

/** What must stay on screen (design px), and the part that may never be cropped on a narrow screen. */
const VIEW = { x0: 60, x1: 1140, y0: 120, y1: 1740 }
const CORE = { x0: 150, x1: 1070 }
const CENTER_X = 600

/** Scale and offset that fit the rig into a W×H root. */
const fitStage = (W: number, H: number) => {
  const sH = (H * 0.97) / (VIEW.y1 - VIEW.y0)
  const sW = (W * 0.98) / (VIEW.x1 - VIEW.x0)
  // narrow: let the capsule's end caps and the speaker run off the sides first
  const s = sW >= sH ? sH : Math.min(sH, (W * 0.98) / (CORE.x1 - CORE.x0))
  return { s, tx: W / 2 - CENTER_X * s, ty: H / 2 - ((VIEW.y0 + VIEW.y1) / 2) * s }
}
// #endregion

// ---- geometry (design px; the stage is 1200 × 1950 and scaled to fit) ----------------

const STAGE_W = 1200
const STAGE_H = 1950
/** The panel swings about the middle of its top edge. */
const PIVOT = { x: 600, y: 372 }
/** The LED screen, and its dot grid. */
const LED = { x: 318, y: 422, w: 592, h: 266, cols: 60, rows: 19, mx: 11, my: 8 }
const PITCH_X = (LED.w - 2 * LED.mx) / LED.cols
const PITCH_Y = (LED.h - 2 * LED.my) / LED.rows
const DOT_W = PITCH_X * 0.8
const DOT_H = PITCH_Y * 0.84
/** Columns the star keeps clear at the end of the first line. */
const STAR_COL = 47
/** The row the first line's trail runs along: its lower middle. */
const TRAIL_ROW = 6
/** A short first line over a second one trails a dash off toward the star. */
const hasTrail = (lines: string[]) => lines.length >= 2 && layoutText(lines[0]).w + 6 < STAR_COL

/** The fluid chamber inside the capsule. */
const FLUID = { x0: 474, x1: 906, level: 1526, bottom: 1600 }

type CableDef = { pts: CablePt[]; w: number; tone: "cable" | "alt" | "dark"; front: boolean }

const CABLES: CableDef[] = [
  // the main orange lead: down from the rig, round the top-left corner, into the spine
  { tone: "cable", w: 13, front: false, pts: [[356, -90, 0], [348, 80, 0], [326, 222, 0.05], [286, 322, 0.35], [244, 386, 0.7], [218, 432, 0.92], [206, 476, 1]] },
  // ...out of the spine lower down and into the orange connector
  { tone: "cable", w: 12, front: true, pts: [[190, 700, 1], [162, 756, 1], [150, 846, 1], [164, 918, 1], [184, 950, 1]] },
  // top-right lead, round to the speaker
  { tone: "cable", w: 11, front: false, pts: [[776, -90, 0], [790, 70, 0], [852, 184, 0.05], [910, 284, 0.4], [930, 352, 0.8], [934, 404, 1]] },
  // the yellow loop over the tab
  { tone: "alt", w: 9, front: false, pts: [[556, 446, 1], [552, 392, 0.95], [580, 352, 0.85], [640, 344, 0.8], [694, 364, 0.85], [706, 408, 0.95], [694, 446, 1]] },
  // thin black lead from the rig to the spine
  { tone: "dark", w: 4, front: true, pts: [[432, 298, 0], [376, 324, 0.25], [302, 352, 0.6], [248, 398, 0.9], [228, 468, 1]] },
  // a black drop from the spine to the capsule's end cap
  { tone: "dark", w: 6, front: true, pts: [[182, 1062, 1], [150, 1150, 1], [126, 1290, 1], [110, 1410, 1], [98, 1500, 1], [92, 1540, 1]] },
  // an orange loop hanging off the capsule's right end
  { tone: "cable", w: 9, front: true, pts: [[1050, 1546, 1], [1080, 1598, 1], [1080, 1672, 1], [1040, 1706, 1], [998, 1688, 1], [990, 1636, 1], [1008, 1602, 1]] },
]

/** Glyph shapes for the field, viewBox 0 0 20 20. */
const GLYPH_D = [
  "M3 3 H17 L10 10 L17 17 H3 L10 10 Z", // hourglass
  "M10 2.5 L17 9 V17 H3 V9 Z", // house
  "M3 17 V4 L7.5 10 L10 4 L12.5 10 L17 4 V17 Z", // crown
  "M10 1.5 Q11 9 18.5 10 Q11 11 10 18.5 Q9 11 1.5 10 Q9 9 10 1.5 Z", // sparkle
  "M3 3 L10 10 L3 17 Z M17 3 L10 10 L17 17 Z", // bow
  "M3 17 V9 Q3 3 10 3 Q17 3 17 9 V17 Z", // arch
]
const GLYPH_COLS = 6
const GLYPH_ROWS = 8 // four of outlines, four of solids
const GLYPHS = (() => {
  const r = rng(91)
  return Array.from({ length: GLYPH_COLS * GLYPH_ROWS }, (_, i) => ({
    d: GLYPH_D[Math.floor(r() * GLYPH_D.length)],
    solid: i >= GLYPH_COLS * 4,
    row: Math.floor(i / GLYPH_COLS),
    col: i % GLYPH_COLS,
  }))
})()

/** The concave four-point star. viewBox 0 0 100 100. */
const STAR_D = "M50 0 Q54 46 100 50 Q54 54 50 100 Q46 54 0 50 Q46 46 50 0 Z"

const WHITE: RGB = [255, 255, 255]
const BLACK: RGB = [0, 0, 0]

const CHROME: [number, string][] = [
  [0, "#2a2c30"], [0.07, "#767b83"], [0.16, "#eceef1"], [0.26, "#9da3ab"], [0.4, "#f8f9fa"],
  [0.55, "#b5bac1"], [0.68, "#5c6168"], [0.82, "#d6dadf"], [0.93, "#80868e"], [1, "#2b2e33"],
]

// ---- art -------------------------------------------------------------------------------

type ArtProps = { uid: string; pal: HiringRigPalette; k: string }
const sameArt = (a: ArtProps, b: ArtProps) => a.k === b.k

const ChromeStops = () => (
  <>
    {CHROME.map(([o, c]) => (
      <stop key={o} offset={o} stopColor={c} />
    ))}
  </>
)

/** A horizontal cylinder's shading, top to bottom. */
const Cyl = ({ id, base }: { id: string; base: RGB }) => (
  <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
    <stop offset="0" stopColor={rgba(mix(base, BLACK, 0.5))} />
    <stop offset="0.1" stopColor={rgba(mix(base, WHITE, 0.62))} />
    <stop offset="0.22" stopColor={rgba(mix(base, WHITE, 0.2))} />
    <stop offset="0.55" stopColor={rgba(base)} />
    <stop offset="0.85" stopColor={rgba(mix(base, BLACK, 0.3))} />
    <stop offset="1" stopColor={rgba(mix(base, BLACK, 0.62))} />
  </linearGradient>
)

/** Black plastic, lit from the left. */
const Plastic = ({ id, base, vertical }: { id: string; base: RGB; vertical?: boolean }) => (
  <linearGradient id={id} x1="0" x2={vertical ? "0" : "1"} y1="0" y2={vertical ? "1" : "0"}>
    <stop offset="0" stopColor={rgba(mix(base, BLACK, 0.55))} />
    <stop offset="0.16" stopColor={rgba(mix(base, WHITE, 0.3))} />
    <stop offset="0.32" stopColor={rgba(mix(base, WHITE, 0.08))} />
    <stop offset="0.78" stopColor={rgba(base)} />
    <stop offset="0.92" stopColor={rgba(mix(base, WHITE, 0.14))} />
    <stop offset="1" stopColor={rgba(mix(base, BLACK, 0.6))} />
  </linearGradient>
)

/** The chrome stack and the black column the panel hangs from. Fixed: it does not swing. */
const Tower = React.memo(function Tower({ uid, pal }: ArtProps) {
  const id = (s: string) => uid + s
  const url = (s: string) => "url(#" + uid + s + ")"
  const hw = hexRGB(pal.hardware, [22, 23, 27])
  const slabs = Array.from({ length: 9 }, (_, i) => 140 + i * 30)
  const grooves = Array.from({ length: 36 }, (_, i) => -2340 + i * 64)
  const ribs = Array.from({ length: 52 }, (_, i) => -2380 + i * 52)
  return (
    <svg
      aria-hidden
      viewBox="330 -2400 560 2860"
      width={560}
      height={2860}
      className="absolute"
      style={{ left: 330, top: -2400, maxWidth: "none", overflow: "visible", pointerEvents: "none" }}
    >
      <defs>
        <linearGradient id={id("tc")} x1="0" x2="1" y1="0" y2="0">
          <ChromeStops />
        </linearGradient>
        <Plastic id={id("tk")} base={hw} />
        <linearGradient id={id("slot")} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#0d0e11" />
          <stop offset="1" stopColor="#4a4e55" />
        </linearGradient>
        <linearGradient id={id("ao")} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.35" />
        </linearGradient>
      </defs>

      {/* the chrome stack, running up out of frame */}
      <rect x="388" y="-2400" width="304" height="2420" fill={url("tc")} />
      {grooves.map((y) => (
        <g key={y}>
          <rect x="388" y={y} width="304" height="5" fill="#2f3237" opacity="0.6" />
          <rect x="388" y={y + 5} width="304" height="1.5" fill="#fff" opacity="0.5" />
        </g>
      ))}
      <rect x="392" y="-58" width="296" height="70" rx="6" fill={url("tk")} />
      <rect x="586" y="-50" width="26" height="56" rx="2" fill="#cf3a1f" />
      <rect x="420" y="-40" width="120" height="8" rx="2" fill="#fff" opacity="0.12" />

      {/* the drawer block */}
      <rect x="390" y="16" width="300" height="114" rx="8" fill={url("tc")} />
      <rect x="390" y="16" width="300" height="114" rx="8" fill="none" stroke="#1f2125" strokeOpacity="0.5" />
      <rect x="466" y="52" width="170" height="44" rx="5" fill={url("slot")} />
      <rect x="470" y="56" width="162" height="4" rx="2" fill="#000" opacity="0.5" />
      <circle cx="551" cy="74" r="7" fill={url("tc")} stroke="#202226" strokeWidth="1.5" />
      <path d="M546 74 H556" stroke="#202226" strokeWidth="1.6" />

      {/* stacked slabs */}
      {slabs.map((y) => (
        <g key={y}>
          <rect x="398" y={y + 22} width="284" height="8" fill="#1d1f23" />
          <rect x="396" y={y} width="288" height="24" rx="5" fill={url("tc")} />
          <rect x="396" y={y} width="288" height="2" rx="1" fill="#fff" opacity="0.7" />
        </g>
      ))}
      <rect x="402" y="408" width="276" height="48" rx="6" fill={url("tc")} />
      <rect x="402" y="408" width="276" height="48" rx="6" fill={url("ao")} />

      {/* the black column and its plug */}
      <rect x="712" y="-2400" width="118" height="2720" fill={url("tk")} />
      {ribs.map((y) => (
        <g key={y}>
          <rect x="712" y={y} width="118" height="4" fill="#000" opacity="0.75" />
          <rect x="712" y={y + 4} width="118" height="1.5" fill="#fff" opacity="0.1" />
        </g>
      ))}
      <rect x="700" y="230" width="142" height="46" rx="8" fill={url("tk")} />
      <path d="M712 318 H830 L808 372 H734 Z" fill={url("tk")} />
      <rect x="736" y="370" width="70" height="66" rx="6" fill={url("tk")} />
      <rect x="742" y="420" width="58" height="36" rx="3" fill={url("tc")} />
      <rect x="742" y="420" width="58" height="36" rx="3" fill={url("ao")} />
      <rect x="752" y="428" width="38" height="6" fill="#111" opacity="0.6" />
    </svg>
  )
}, sameArt)

/** Everything on the panel underneath the HTML: the case, the hardware, the print and the capsule's insides. */
const PanelBack = React.memo(function PanelBack({ uid, pal }: ArtProps) {
  const id = (s: string) => uid + s
  const url = (s: string) => "url(#" + uid + s + ")"
  const glow = hexRGB(pal.glow, [255, 122, 26])
  const blush = hexRGB(pal.blush, [236, 226, 241])
  const lilac = hexRGB(pal.lilac, [198, 192, 255])
  const ink = hexRGB(pal.ink, [88, 18, 27])
  const band = hexRGB(pal.band, [40, 35, 90])
  const hw = hexRGB(pal.hardware, [22, 23, 27])
  const screen = hexRGB(pal.screen, [11, 10, 15])
  const hwLo = rgba(mix(hw, BLACK, 0.55))
  const hwHi = rgba(mix(hw, WHITE, 0.32))
  const ticks: string[] = []
  for (let x = 320; x <= 704; x += 4.3) ticks.push("M" + x.toFixed(1) + " 1040 V1054")

  return (
    <svg
      aria-hidden
      viewBox={"0 0 " + STAGE_W + " " + STAGE_H}
      width={STAGE_W}
      height={STAGE_H}
      className="absolute left-0 top-0"
      style={{ maxWidth: "none", overflow: "visible", pointerEvents: "none" }}
    >
      <defs>
        <Plastic id={id("hw")} base={hw} />
        <Plastic id={id("hwv")} base={hw} vertical />
        <linearGradient id={id("chr")} x1="0" x2="1" y1="0" y2="0">
          <ChromeStops />
        </linearGradient>
        <linearGradient id={id("acr")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.4" />
          <stop offset="0.3" stopColor="#f1f4f8" stopOpacity="0.14" />
          <stop offset="0.7" stopColor="#ffffff" stopOpacity="0.08" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.3" />
        </linearGradient>
        <linearGradient id={id("plate")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fdfdfe" />
          <stop offset="0.5" stopColor="#f3f4f7" />
          <stop offset="1" stopColor="#e7e9ee" />
        </linearGradient>
        <linearGradient id={id("print")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={rgba(mix(blush, WHITE, 0.45))} />
          <stop offset="0.2" stopColor={rgba(blush)} />
          <stop offset="0.32" stopColor={rgba(mix(blush, lilac, 0.32))} />
          <stop offset="0.42" stopColor={rgba(mix(mix(blush, glow, 0.35), WHITE, 0.3))} />
          <stop offset="0.56" stopColor={rgba(mix(glow, WHITE, 0.42))} />
          <stop offset="0.72" stopColor={rgba(mix(glow, WHITE, 0.18))} />
          <stop offset="0.88" stopColor={rgba(glow)} />
          <stop offset="1" stopColor={rgba(mix(glow, WHITE, 0.24))} />
        </linearGradient>
        <radialGradient id={id("hot")}>
          <stop offset="0" stopColor="#fff8ef" stopOpacity="0.85" />
          <stop offset="0.5" stopColor="#ffe6cc" stopOpacity="0.36" />
          <stop offset="1" stopColor="#ffe6cc" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id("ember")}>
          <stop offset="0" stopColor={rgba(mix(glow, BLACK, 0.5))} stopOpacity="0.55" />
          <stop offset="1" stopColor={rgba(glow)} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id("haze")}>
          <stop offset="0" stopColor={rgba(lilac)} stopOpacity="0.55" />
          <stop offset="1" stopColor={rgba(lilac)} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id("orange")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={rgba(mix(glow, WHITE, 0.45))} />
          <stop offset="0.4" stopColor={rgba(glow)} />
          <stop offset="1" stopColor={rgba(mix(glow, BLACK, 0.35))} />
        </linearGradient>
        <linearGradient id={id("band")} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor={rgba(mix(lilac, WHITE, 0.35))} stopOpacity="0.75" />
          <stop offset="0.6" stopColor={rgba(mix(blush, WHITE, 0.3))} stopOpacity="0.5" />
          <stop offset="1" stopColor={rgba(mix(lilac, blush, 0.5))} stopOpacity="0.7" />
        </linearGradient>
        <linearGradient id={id("scr")} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={rgba(mix(screen, WHITE, 0.06))} />
          <stop offset="1" stopColor={rgba(screen)} />
        </linearGradient>
        <Cyl id={id("cK")} base={mix(hw, WHITE, 0.08)} />
        <Cyl id={id("cN")} base={[30, 33, 52]} />
        <Cyl id={id("cPink")} base={[244, 168, 204]} />
        <Cyl id={id("cPlum")} base={[60, 38, 72]} />
        <Cyl id={id("cLilac")} base={mix(lilac, [214, 186, 238], 0.5)} />
        <Cyl id={id("cAir")} base={mix(glow, WHITE, 0.78)} />
        <linearGradient id={id("cChr")} x1="0" x2="0" y1="0" y2="1">
          <ChromeStops />
        </linearGradient>
        <filter id={id("b5")} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        <filter id={id("b10")} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
        <filter id={id("lit")} x="-80%" y="-30%" width="260%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={id("frost")} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="4" />
          <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.7 -0.28" />
        </filter>
        <clipPath id={id("pc")}>
          <rect x="304" y="408" width="620" height="978" rx="14" />
        </clipPath>
      </defs>

      {/* the clear tab the rig plugs into */}
      <rect x="328" y="328" width="540" height="116" rx="18" fill={url("acr")} />
      <rect x="328" y="328" width="540" height="116" rx="18" fill="none" stroke="#fff" strokeOpacity="0.9" strokeWidth="2.5" />
      <rect x="340" y="338" width="516" height="6" rx="3" fill="#fff" opacity="0.7" />

      {/* the case's back face */}
      <rect x="172" y="362" width="842" height="1096" rx="48" fill="#ffffff" fillOpacity="0.14" />

      {/* left: the ribbed spine, an amber strip, the connector, the fins */}
      <rect x="186" y="466" width="80" height="430" rx="10" fill={url("hw")} />
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i}>
          <rect x={195 + i * 13} y="478" width="6" height="406" rx="3" fill={hwLo} />
          <rect x={193 + i * 13} y="478" width="1.6" height="406" fill={hwHi} opacity="0.55" />
        </g>
      ))}
      {[548, 638, 728, 818].map((y) => (
        <g key={y}>
          <rect x="182" y={y} width="88" height="13" rx="3" fill={url("hw")} />
          <rect x="182" y={y} width="88" height="1.5" fill={hwHi} opacity="0.6" />
        </g>
      ))}
      <rect x="173" y="628" width="19" height="118" rx="6" fill={url("orange")} filter={url("lit")} />
      <rect x="178" y="638" width="5" height="98" rx="2.5" fill="#fff" fillOpacity="0.7" />
      <rect x="176" y="902" width="94" height="158" rx="10" fill={url("orange")} />
      <rect x="176.5" y="902.5" width="93" height="157" rx="9.5" fill="none" stroke="#fff" strokeOpacity="0.45" />
      <rect x="182" y="908" width="10" height="146" rx="5" fill="#fff" fillOpacity="0.35" />
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x="212" y={918 + i * 27} width="42" height="15" rx="3" fill={hwLo} />
      ))}
      {Array.from({ length: 9 }, (_, i) => (
        <g key={i}>
          <rect x="180" y={1092 + i * 17} width="76" height="10" rx="4" fill={url("hwv")} />
        </g>
      ))}

      {/* right: the meter housing, its connector, the lower fins */}
      <rect x="922" y="600" width="70" height="396" rx="12" fill={url("hw")} />
      <rect x="930" y="609" width="54" height="378" rx="8" fill="#120b05" />
      <rect x="988" y="616" width="34" height="372" rx="8" fill={url("hw")} />
      {Array.from({ length: 22 }, (_, i) => (
        <rect key={i} x="990" y={628 + i * 16.4} width="30" height="3" fill={hwLo} />
      ))}
      {Array.from({ length: 12 }, (_, i) => (
        <rect key={i} x="934" y={1006 + i * 20} width="66" height="12" rx="4" fill={url("hwv")} />
      ))}

      {/* the case's front face: also what you grab to swing it */}
      <rect
        data-hrp-drag=""
        x="172"
        y="362"
        width="842"
        height="1096"
        rx="48"
        fill={url("acr")}
        style={{ pointerEvents: "auto" }}
      />

      {/* the white plate and the print on it */}
      <rect x="282" y="390" width="664" height="1034" rx="28" fill="#000" opacity="0.12" filter={url("b10")} />
      <rect x="290" y="394" width="648" height="1024" rx="24" fill={url("plate")} />
      <rect x="290" y="394" width="648" height="1024" rx="24" fill="none" stroke="#fff" strokeWidth="2" />
      <g clipPath={url("pc")}>
        <rect x="304" y="408" width="620" height="978" fill={url("print")} />
        <ellipse cx="590" cy="960" rx="440" ry="300" fill={url("hot")} />
        <ellipse cx="380" cy="1330" rx="300" ry="220" fill={url("ember")} />
        <ellipse cx="880" cy="760" rx="220" ry="160" fill={url("haze")} />
        {/* out-of-focus parts inside the case */}
        <g filter={url("b10")} opacity="0.9">
          <rect x="330" y="1160" width="124" height="74" rx="16" fill={rgba(mix(glow, BLACK, 0.55))} opacity="0.35" />
          <rect x="342" y="1250" width="96" height="44" rx="12" fill={rgba(mix(glow, BLACK, 0.5))} opacity="0.3" />
          <circle cx="470" cy="1172" r="18" fill={rgba(mix(glow, BLACK, 0.5))} opacity="0.3" />
          <rect x="590" y="1058" width="130" height="34" rx="12" fill={rgba(mix(glow, BLACK, 0.4))} opacity="0.2" />
          <rect x="620" y="900" width="200" height="40" rx="18" fill={rgba(mix(glow, BLACK, 0.3))} opacity="0.14" />
        </g>
        <g filter={url("b5")}>
          <ellipse cx="470" cy="738" rx="170" ry="9" fill="#fff" opacity="0.55" />
          <ellipse cx="760" cy="764" rx="120" ry="6" fill="#fff" opacity="0.45" />
          <rect x="420" y="832" width="380" height="10" rx="5" fill="#fff" opacity="0.35" />
          <rect x="350" y="1004" width="180" height="8" rx="4" fill="#fff" opacity="0.35" />
        </g>
        <rect x="304" y="408" width="620" height="978" filter={url("frost")} opacity="0.4" />
      </g>

      {/* the LED screen's bezel (the dots are canvases on top) */}
      <rect x="314" y="418" width="600" height="274" rx="9" fill={rgba(mix(screen, BLACK, 0.4))} />
      <rect x="318" y="422" width="592" height="266" rx="6" fill={url("scr")} />

      {/* the role band and its rules */}
      <rect x="318" y="691" width="592" height="2" fill={rgba(ink)} opacity="0.5" />
      <rect x="318" y="694" width="592" height="88" fill={url("band")} />
      <rect x="318" y="783" width="592" height="5" fill={rgba(mix(band, BLACK, 0.4))} opacity="0.9" />

      {/* ticks under the date, then the circuit lines */}
      <path d={ticks.join(" ")} stroke={rgba(ink)} strokeOpacity="0.5" strokeWidth="1.3" />
      <g fill="none" stroke={rgba(ink)} strokeOpacity="0.5" strokeWidth="1.6">
        <path d="M318 1150 H506 L526 1130 H742" />
        <path d="M526 1130 V1384" />
        <path d="M318 1172 H478 L500 1194 V1384" />
        <path d="M742 1130 V1112 H760" />
        <path d="M318 1196 H330 M318 1206 H322" />
      </g>
      {[1196, 1246].map((y) => (
        <path key={y} d={"M480 " + y + " v14 a9 9 0 0 0 18 0 v-14"} fill="none" stroke="#fff" strokeOpacity="0.85" strokeWidth="3.2" strokeLinecap="round" />
      ))}

      {/* the black corner bracket the ✦ button sits on */}
      <path
        d="M164 1236 Q164 1222 178 1222 H256 Q290 1222 298 1254 L308 1296 Q316 1330 350 1338 L438 1358 Q462 1363 462 1388 V1468 H222 Q164 1468 164 1410 Z"
        fill={url("hwv")}
      />
      <path d="M166 1240 Q166 1226 180 1226 H256 Q286 1226 294 1256 L304 1298 Q312 1334 348 1342 L436 1362 Q456 1366 458 1386" fill="none" stroke="#fff" strokeOpacity="0.32" strokeWidth="2" />
      <path d="M168 1300 V1408 Q168 1462 222 1462 H300" fill="none" stroke="#fff" strokeOpacity="0.14" strokeWidth="3" />
      <circle cx="352" cy="1306" r="66" fill={hwLo} />
      <circle cx="352" cy="1306" r="66" fill="none" stroke="#000" strokeOpacity="0.6" strokeWidth="3" />
      <path d="M296 1272 A66 66 0 0 1 386 1249" fill="none" stroke="#fff" strokeOpacity="0.3" strokeWidth="2.5" strokeLinecap="round" />

      {/* the capsule's insides: caps, cores and the empty top of the fluid chamber */}
      <g data-hrp-drag="" style={{ pointerEvents: "auto" }}>
        <rect x="74" y="1520" width="26" height="52" rx="7" fill={url("cK")} />
        <rect x="92" y="1486" width="114" height="120" rx="22" fill={url("cK")} />
        {Array.from({ length: 9 }, (_, i) => (
          <rect key={i} x={112 + i * 9.5} y="1490" width="3.5" height="112" fill="#000" opacity="0.45" />
        ))}
        <rect x="200" y="1494" width="140" height="104" fill={url("cPink")} />
        <rect x="336" y="1489" width="20" height="114" rx="3" fill={url("cPlum")} />
        <rect x="354" y="1494" width="90" height="104" fill={url("cLilac")} />
        <rect x="442" y="1486" width="34" height="120" rx="3" fill={url("cChr")} />
        <rect x="452" y="1486" width="2" height="120" fill="#000" opacity="0.35" />
        <rect x="474" y="1494" width="434" height="104" fill={url("cAir")} />
        <rect x="904" y="1489" width="32" height="114" rx="3" fill={url("cLilac")} />
        <rect x="910" y="1489" width="20" height="114" fill="#6b4fe0" opacity="0.55" />
        <rect x="932" y="1482" width="106" height="128" rx="20" fill={url("cN")} />
        {Array.from({ length: 9 }, (_, i) => (
          <rect key={i} x={946 + i * 9.5} y="1486" width="3.5" height="120" fill="#000" opacity="0.4" />
        ))}
        <rect x="1032" y="1522" width="22" height="48" rx="6" fill={url("cK")} />
      </g>
    </svg>
  )
}, sameArt)

/** Everything on the panel above the HTML: rings in the fluid, the glass tube, its clips, the case's edges. */
const PanelFront = React.memo(function PanelFront({ uid, pal }: ArtProps) {
  const id = (s: string) => uid + s
  const url = (s: string) => "url(#" + uid + s + ")"
  const glow = hexRGB(pal.glow, [255, 122, 26])
  return (
    <svg
      aria-hidden
      viewBox={"0 0 " + STAGE_W + " " + STAGE_H}
      width={STAGE_W}
      height={STAGE_H}
      className="absolute left-0 top-0"
      style={{ maxWidth: "none", overflow: "visible", pointerEvents: "none" }}
    >
      <defs>
        <Cyl id={id("fRing")} base={mix(glow, BLACK, 0.5)} />
        <Cyl id={id("fRing2")} base={mix(glow, WHITE, 0.4)} />
        <linearGradient id={id("glass")} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.5" />
          <stop offset="0.07" stopColor="#fff" stopOpacity="0.08" />
          <stop offset="0.14" stopColor="#fff" stopOpacity="0.7" />
          <stop offset="0.22" stopColor="#fff" stopOpacity="0.06" />
          <stop offset="0.8" stopColor="#fff" stopOpacity="0.02" />
          <stop offset="0.9" stopColor="#fff" stopOpacity="0.3" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.12" />
        </linearGradient>
        <linearGradient id={id("clip")} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#c9ced6" />
          <stop offset="0.3" stopColor="#ffffff" />
          <stop offset="1" stopColor="#d5d9e0" />
        </linearGradient>
        <linearGradient id={id("edge")} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="1" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id={id("tab")} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={rgba(mix(glow, WHITE, 0.5))} />
          <stop offset="0.5" stopColor={rgba(glow)} />
          <stop offset="1" stopColor={rgba(mix(glow, BLACK, 0.3))} />
        </linearGradient>
        <filter id={id("soft")} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="1.2" />
        </filter>
      </defs>

      {/* rings inside the fluid chamber */}
      <rect x="560" y="1490" width="16" height="112" rx="3" fill={url("fRing")} />
      <rect x="650" y="1492" width="10" height="108" rx="3" fill={url("fRing2")} opacity="0.85" />
      <rect x="798" y="1490" width="18" height="112" rx="3" fill={url("fRing")} />
      <path d="M716 1542 q6 -14 12 0 q6 14 12 0" fill="none" stroke={rgba(mix(glow, BLACK, 0.55))} strokeOpacity="0.6" strokeWidth="2.4" />

      {/* the glass tube over all of it */}
      <rect x="194" y="1478" width="748" height="136" rx="24" fill={url("glass")} />
      <rect x="194" y="1478" width="748" height="136" rx="24" fill="none" stroke="#fff" strokeOpacity="0.8" strokeWidth="1.8" />
      <rect x="212" y="1492" width="712" height="7" rx="3.5" fill="#fff" opacity="0.8" filter={url("soft")} />
      <rect x="230" y="1594" width="680" height="4" rx="2" fill="#fff" opacity="0.45" filter={url("soft")} />

      {/* the clips that hang it from the case */}
      {[428, 774].map((x) => (
        <g key={x}>
          <rect x={x} y="1446" width="48" height="74" rx="9" fill={url("clip")} />
          <rect x={x} y="1446" width="48" height="74" rx="9" fill="none" stroke="#8d939c" strokeOpacity="0.6" />
          <rect x={x + 8} y="1458" width="6" height="52" rx="3" fill="#fff" opacity="0.9" />
          <circle cx={x + 24} cy="1500" r="5" fill="#b9bec6" stroke="#8d939c" />
        </g>
      ))}

      {/* the case's polished edges */}
      <rect x="173.5" y="363.5" width="839" height="1093" rx="47" fill="none" stroke={url("edge")} strokeWidth="3" />
      <rect x="183" y="373" width="820" height="1074" rx="40" fill="none" stroke="#fff" strokeOpacity="0.4" strokeWidth="1.4" />
      <rect x="171" y="361" width="844" height="1098" rx="49" fill="none" stroke="#3a4250" strokeOpacity="0.28" strokeWidth="1.2" />
      <rect x="176" y="430" width="5" height="700" rx="2.5" fill="#fff" opacity="0.75" filter={url("soft")} />
      <rect x="1005" y="640" width="4" height="640" rx="2" fill="#fff" opacity="0.55" filter={url("soft")} />
      <rect x="260" y="366" width="440" height="4" rx="2" fill="#fff" opacity="0.8" filter={url("soft")} />

      {/* the orange tab on the top-left corner */}
      <rect x="182" y="392" width="68" height="42" rx="8" fill={url("tab")} />
      <rect x="188" y="397" width="44" height="7" rx="3.5" fill="#fff" opacity="0.6" />

      {/* screws */}
      {[[214, 404], [972, 404], [214, 1416], [972, 1416]].map(([x, y]) => (
        <g key={x + "-" + y}>
          <circle cx={x} cy={y} r="7" fill="#e8ebef" stroke="#9aa0a8" strokeWidth="1.2" />
          <path d={"M" + (x - 4) + " " + y + " H" + (x + 4)} stroke="#8a9098" strokeWidth="1.4" />
        </g>
      ))}
    </svg>
  )
}, sameArt)

/** The speaker, drawn inside its own button. */
const Speaker = React.memo(function Speaker({ uid, pal, on }: ArtProps & { on: boolean }) {
  const id = (s: string) => uid + s
  const url = (s: string) => "url(#" + uid + s + ")"
  const hw = hexRGB(pal.hardware, [22, 23, 27])
  const glow = pal.glow
  return (
    <svg aria-hidden viewBox="900 380 230 240" width={230} height={240} style={{ maxWidth: "none", overflow: "visible", display: "block" }}>
      <defs>
        <radialGradient id={id("rim")} cx="0.4" cy="0.35" r="0.75">
          <stop offset="0" stopColor={rgba(mix(hw, WHITE, 0.2))} />
          <stop offset="0.7" stopColor={rgba(hw)} />
          <stop offset="1" stopColor={rgba(mix(hw, BLACK, 0.6))} />
        </radialGradient>
        <radialGradient id={id("cone")} cx="0.42" cy="0.38" r="0.7">
          <stop offset="0" stopColor={rgba(mix(hw, WHITE, 0.3))} />
          <stop offset="0.45" stopColor={rgba(mix(hw, WHITE, 0.06))} />
          <stop offset="1" stopColor={rgba(mix(hw, BLACK, 0.7))} />
        </radialGradient>
        <radialGradient id={id("cap")} cx="0.38" cy="0.32" r="0.8">
          <stop offset="0" stopColor="#8a8e96" />
          <stop offset="0.5" stopColor={rgba(mix(hw, WHITE, 0.15))} />
          <stop offset="1" stopColor={rgba(mix(hw, BLACK, 0.5))} />
        </radialGradient>
        <linearGradient id={id("sc")} x1="0" x2="1" y1="0" y2="1">
          <ChromeStops />
        </linearGradient>
        <linearGradient id={id("mount")} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.7" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.25" />
        </linearGradient>
      </defs>
      <rect x="900" y="404" width="108" height="192" rx="16" fill={url("mount")} stroke="#fff" strokeWidth="2" />
      <ellipse cx="1034" cy="500" rx="88" ry="110" fill={rgba(mix(hw, BLACK, 0.5))} />
      <ellipse cx="1012" cy="498" rx="92" ry="110" fill={url("rim")} />
      <ellipse cx="1012" cy="498" rx="85" ry="102" fill="none" stroke={url("sc")} strokeWidth="4.5" />
      <g className="hrp-cone">
        <ellipse cx="1012" cy="498" rx="74" ry="89" fill={url("cone")} />
        <ellipse
          cx="1012"
          cy="498"
          rx="57"
          ry="68"
          fill="none"
          stroke={glow}
          strokeWidth="3.4"
          opacity={on ? 0.95 : 0.28}
          style={{ transition: "opacity .4s", filter: on ? "drop-shadow(0 0 5px " + glow + ")" : undefined }}
        />
        <ellipse cx="1012" cy="498" rx="41" ry="49" fill="none" stroke={rgba(mix(hw, WHITE, 0.12))} strokeWidth="5" />
        <ellipse cx="1012" cy="498" rx="27" ry="32" fill={url("cap")} />
        <ellipse cx="1012" cy="498" rx="14" ry="17" fill="none" stroke={glow} strokeWidth="2.6" opacity={on ? 1 : 0.3} />
        <ellipse cx="1002" cy="482" rx="9" ry="6" fill="#fff" opacity="0.45" />
      </g>
      <circle cx="954" cy="584" r="4.5" fill={on ? pal.signal : "#5b5f66"} style={{ transition: "fill .3s" }} />
    </svg>
  )
}, (a, b) => a.k === b.k && a.on === b.on)

/** The date in seven segments, centred in a w×h box. */
const SevenSeg = ({ text, color, w, h, blink }: { text: string; color: string; w: number; h: number; blink: boolean }) => {
  const cells = segCells(text)
  const wide = cells.filter((c) => c.kind === "d").length
  const narrow = cells.length - wide
  const gap = 7
  const nw = 22
  const dw = Math.min(64, (w - narrow * nw - Math.max(0, cells.length - 1) * gap) / Math.max(1, wide))
  const t = clamp(dw * 0.24, 7, 14)
  const polys = segPolys(dw, h, t, 1.6)
  const total = wide * dw + narrow * nw + Math.max(0, cells.length - 1) * gap
  let x = (w - total) / 2
  const out: React.ReactNode[] = []
  cells.forEach((c, i) => {
    const cx = x
    if (c.kind === "d") {
      out.push(
        <g key={i} transform={"translate(" + cx.toFixed(1) + " 0)"}>
          {polys.map((p, k) => (
            <polygon key={k} points={p} fill={color} opacity={c.mask & (1 << k) ? 1 : 0.07} />
          ))}
        </g>,
      )
      x += dw + gap
    } else {
      const s = t * 1.05
      const dots = c.kind === "." ? [h - s] : [h * 0.3 - s / 2, h * 0.7 - s / 2]
      out.push(
        <g key={i} className={c.kind === ":" && blink ? "hrp-colon" : undefined}>
          {dots.map((y, k) => (
            <rect key={k} x={cx + (nw - s) / 2} y={y} width={s} height={s} fill={color} />
          ))}
        </g>,
      )
      x += nw + gap
    }
  })
  return <>{out}</>
}

/** Splits on "✦" so the star can be drawn instead of trusting the font to have it. */
const WithStar = ({ text, color }: { text: string; color: string }) => {
  const parts = text.split("✦")
  return (
    <>
      {parts.map((p, i) => (
        <React.Fragment key={i}>
          {i > 0 && (
            <svg aria-hidden viewBox="0 0 100 100" style={{ display: "inline-block", width: "0.62em", height: "0.62em", margin: "0 0.08em", verticalAlign: "-0.02em", maxWidth: "none" }}>
              <path d={STAR_D} fill={color} />
            </svg>
          )}
          {p}
        </React.Fragment>
      ))}
    </>
  )
}

// ---- styles -------------------------------------------------------------------------------

const CSS =
  ".hrp-root{-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none}" +
  ".hrp-btn{appearance:none;-webkit-appearance:none;background:transparent;border:0;padding:0;margin:0;color:inherit;font:inherit;cursor:pointer;display:block;text-align:left}" +
  ".hrp-btn:focus-visible,.hrp-card:focus-visible,.hrp-mail:focus-visible{outline:4px solid var(--hrp-focus);outline-offset:6px;border-radius:10px}" +
  ".hrp-grab [data-hrp-drag]{cursor:grab}" +
  ".hrp-dragging,.hrp-dragging [data-hrp-drag]{cursor:grabbing}" +
  ".hrp-fit{display:inline-block;white-space:nowrap;transform-origin:0 50%}" +
  ".hrp-screen .hrp-star{transform-origin:50% 50%;animation:hrp-twinkle 5s ease-in-out infinite}" +
  ".hrp-screen:hover .hrp-star{animation-duration:1.3s}" +
  ".hrp-screen .hrp-gloss{transition:opacity .4s}" +
  ".hrp-screen:hover .hrp-gloss{opacity:.65}" +
  ".hrp-date svg{transition:filter .4s}" +
  ".hrp-date:hover svg{filter:drop-shadow(0 0 10px var(--hrp-glow-a))}" +
  ".hrp-colon{animation:hrp-blink 1s steps(2,start) infinite}" +
  ".hrp-email .hrp-line{transform:scaleX(0);transform-origin:left;transition:transform .45s cubic-bezier(.2,.8,.2,1)}" +
  ".hrp-email:hover .hrp-line,.hrp-email:focus-visible .hrp-line{transform:scaleX(1)}" +
  ".hrp-pip{transition:background-color .25s,transform .25s}" +
  ".hrp-email:hover .hrp-pip{animation:hrp-pip .9s ease-in-out infinite}" +
  ".hrp-email:hover .hrp-pip:nth-child(2){animation-delay:.15s}" +
  ".hrp-email:hover .hrp-pip:nth-child(3){animation-delay:.3s}" +
  ".hrp-mail{display:block;transition:transform .3s cubic-bezier(.3,1.6,.5,1)}" +
  ".hrp-mail:hover{transform:translateX(-6px)}" +
  ".hrp-gl{fill:transparent;stroke:var(--hrp-ink);stroke-width:1.7;stroke-linejoin:round;transform-box:fill-box;transform-origin:50% 50%;transition:fill .3s ease,transform .55s cubic-bezier(.3,1.5,.5,1)}" +
  ".hrp-gl[data-on='1']{fill:var(--hrp-ink)}" +
  ".hrp-gl[data-flip='1']{transform:scale(.74)}" +
  ".hrp-gl[data-on='0'][data-flip='1']{fill:var(--hrp-ink)}" +
  ".hrp-gl[data-on='1'][data-flip='1']{fill:transparent}" +
  ".hrp-card{transform-origin:100% 100%;transition:transform .55s cubic-bezier(.2,.8,.2,1),box-shadow .55s ease}" +
  ".hrp-card:hover,.hrp-card:focus-visible{transform:translate(-8px,-10px) scale(1.5);z-index:5}" +
  ".hrp-ring{animation:hrp-ping 2.2s ease-out infinite}" +
  ".hrp-apply{transition:transform .2s cubic-bezier(.3,1.5,.5,1),filter .3s ease}" +
  ".hrp-apply:hover{transform:scale(1.05);filter:brightness(1.08) saturate(1.1)}" +
  ".hrp-apply:active,.hrp-apply[data-down='1']{transform:scale(.92);filter:brightness(1.2)}" +
  ".hrp-apply .hrp-halo{transform-origin:50% 50%;animation:hrp-halo 2.8s ease-out infinite}" +
  ".hrp-apply .hrp-astar{transform-origin:50% 50%;transition:transform .6s cubic-bezier(.3,1.5,.5,1)}" +
  ".hrp-apply:hover .hrp-astar{transform:rotate(45deg) scale(1.08)}" +
  ".hrp-apply[data-done='1'] .hrp-astar{transform:rotate(180deg) scale(1.1)}" +
  ".hrp-speaker .hrp-cone{transform-box:fill-box;transform-origin:50% 50%}" +
  ".hrp-speaker:hover .hrp-cone{transform:scale(1.02)}" +
  ".hrp-speaker[data-buzz='1'] .hrp-cone{animation:hrp-buzz .08s linear 5}" +
  ".hrp-cell{border-radius:4px;background:var(--hrp-cell-off);box-shadow:inset 0 0 0 1px var(--hrp-cell-edge);transition:background-color .12s,box-shadow .12s,opacity .12s}" +
  ".hrp-cell[data-on='1']{background:var(--hrp-cell-on);box-shadow:0 0 14px var(--hrp-glow-a),inset 0 0 0 1px rgba(255,255,255,.5),inset 0 6px 8px rgba(255,255,255,.45)}" +
  ".hrp-bub{animation:hrp-rise linear infinite}" +
  ".hrp-fluid[data-boil='1'] .hrp-bub{animation-duration:.9s !important}" +
  ".hrp-fluid{transition:filter .5s}" +
  ".hrp-fluid[data-boil='1']{filter:brightness(1.25) saturate(1.2)}" +
  ".hrp-hint{transition:opacity .8s ease}" +
  ".hrp-live{animation:hrp-ping 1.6s ease-out infinite}" +
  "@keyframes hrp-twinkle{0%,100%{transform:scale(1) rotate(0deg)}50%{transform:scale(.86) rotate(45deg)}}" +
  "@keyframes hrp-blink{to{visibility:hidden}}" +
  "@keyframes hrp-pip{0%,100%{transform:none}50%{transform:translateY(-5px)}}" +
  "@keyframes hrp-ping{0%{box-shadow:0 0 0 0 var(--hrp-signal-a)}80%,100%{box-shadow:0 0 0 9px rgba(0,0,0,0)}}" +
  "@keyframes hrp-halo{0%{transform:scale(.92);opacity:.7}80%,100%{transform:scale(1.32);opacity:0}}" +
  "@keyframes hrp-buzz{0%,100%{transform:scale(1)}50%{transform:scale(1.045)}}" +
  "@keyframes hrp-rise{0%{transform:translateY(0);opacity:0}15%{opacity:.85}100%{transform:translateY(-84px);opacity:0}}" +
  "@media (prefers-reduced-motion: reduce){" +
  ".hrp-screen .hrp-star,.hrp-colon,.hrp-ring,.hrp-apply .hrp-halo,.hrp-bub,.hrp-live,.hrp-email:hover .hrp-pip,.hrp-speaker[data-buzz='1'] .hrp-cone{animation:none}" +
  ".hrp-gl,.hrp-card,.hrp-apply,.hrp-apply .hrp-astar,.hrp-email .hrp-line,.hrp-mail,.hrp-cell{transition:none}}"

const useIsoLayoutEffect = typeof window === "undefined" ? React.useEffect : React.useLayoutEffect

// ---- the component ---------------------------------------------------------------------------

type Geo = { W: number; H: number; s: number; tx: number; ty: number }

export default function HiringRigPoster({
  headline = HEADLINE,
  messages,
  thanks = THANKS,
  role = "3D Motiongraphic Designer",
  from = "09.05",
  to = "09.15",
  deadline,
  emailLabel = "Recruit E-mail",
  email = "careers@novaforma.studio",
  lookingFor = "We are looking for",
  requirements = REQUIREMENTS,
  addressLabel = "Address",
  address = "Studio 04, 88 Meridian Lane, Harbour Quarter, Neo Busan",
  tagline = "Expand your Horizon",
  studio = "with nova ✦forma",
  site = "novaforma.studio",
  applyLabel = "Apply now",
  applyHref,
  onApply,
  palette,
  sound = true,
  interactive = true,
  captions = true,
  fontHref = FONT_HREF,
  font = FACE,
  height = "100svh",
  className = "",
}: HiringRigPosterProps) {
  const pal: HiringRigPalette = { ...DEFAULT_PALETTE, ...palette }
  const palKey = (Object.keys(DEFAULT_PALETTE) as (keyof HiringRigPalette)[]).map((k) => pal[k]).join("|")
  const uid = "hrp" + React.useId().replace(/[^a-zA-Z0-9]/g, "")
  const artKey = uid + palKey

  const glow = hexRGB(pal.glow, [255, 122, 26])
  const ink = hexRGB(pal.ink, [88, 18, 27])
  const signal = hexRGB(pal.signal, [79, 216, 255])
  const back = hexRGB(pal.backdrop, [223, 228, 233])
  const darkWall = luma(back) < 120

  const rootRef = React.useRef(null as HTMLElement | null)
  const rigRef = React.useRef(null as HTMLDivElement | null)
  const panelRef = React.useRef(null as HTMLDivElement | null)
  const shadowRef = React.useRef(null as HTMLDivElement | null)
  const sheenRef = React.useRef(null as HTMLDivElement | null)
  const ledRef = React.useRef(null as HTMLCanvasElement | null)
  const bloomRef = React.useRef(null as HTMLCanvasElement | null)
  const fluidRef = React.useRef(null as SVGPathElement | null)
  const surfaceRef = React.useRef(null as SVGPathElement | null)
  const fluidBoxRef = React.useRef(null as SVGSVGElement | null)
  const glyphRef = React.useRef(null as SVGGElement | null)
  const meterRef = React.useRef(null as HTMLDivElement | null)
  const speakerRef = React.useRef(null as HTMLButtonElement | null)
  const cableBackRef = React.useRef(null as SVGSVGElement | null)
  const cableFrontRef = React.useRef(null as SVGSVGElement | null)
  const roleRef = React.useRef(null as HTMLSpanElement | null)
  const mailRef = React.useRef(null as HTMLSpanElement | null)
  const labelRef = React.useRef(null as HTMLSpanElement | null)

  const [geo, setGeo] = React.useState(null as Geo | null)
  const [reduced, setReduced] = React.useState(false)
  const [msg, setMsg] = React.useState(0)
  const [thanking, setThanking] = React.useState(false)
  const [mode, setMode] = React.useState("dates" as "dates" | "countdown")
  const [, setTick] = React.useState(0)
  const [roll, setRoll] = React.useState(0)
  const [copied, setCopied] = React.useState(false)
  const [soundOn, setSoundOn] = React.useState(sound)
  const [applied, setApplied] = React.useState(false)
  const [touched, setTouched] = React.useState(false)
  const [dragging, setDragging] = React.useState(false)

  // the loop reads all of this through refs, never through renders
  const pointer = React.useRef({ on: false, nx: 0.5, ny: 0.5, x: -1e4, y: -1e4, vx: 0, t: 0 })
  const drag = React.useRef({ on: false, x0: 0, target: 0, id: -1 })
  const impulse = React.useRef(0)
  const boilUntil = React.useRef(0)
  const vuUntil = React.useRef(0)
  const busyUntil = React.useRef(0)
  const kick = React.useRef(() => {})
  const timers = React.useRef([] as number[])
  const audio = React.useRef(null as AudioContext | null)
  const soundRef = React.useRef(soundOn)
  soundRef.current = soundOn
  const geoRef = React.useRef(geo)
  geoRef.current = geo
  const live = React.useRef({ reduced, interactive })
  live.current = { reduced, interactive }
  const onApplyRef = React.useRef(onApply)
  onApplyRef.current = onApply

  const later = (fn: () => void, ms: number) => {
    const t = window.setTimeout(() => {
      timers.current = timers.current.filter((x) => x !== t)
      fn()
    }, ms)
    timers.current.push(t)
  }

  // ---- the screen's messages ------------------------------------------------------------
  const deck = React.useMemo(() => {
    const extra = messages ?? [["SHOW US", "YOUR REEL"], ["REMOTE", "FRIENDLY"], ["CLOSES", to]]
    return [headline, ...extra].filter((m) => m && m.length)
  }, [headline, messages, to])
  const lines = thanking ? thanks : deck[msg % Math.max(1, deck.length)] || headline
  const linesKey = lines.join("\n")
  const starOn = hasTrail(lines)

  // the LED state the loop draws from (built once: a useRef argument is evaluated every render)
  const [ledInit] = React.useState(() => {
    const c = composeScreen(lines, LED.cols, LED.rows, 0)
    const r = rng(17)
    const noise = new Float32Array(LED.cols * LED.rows)
    for (let i = 0; i < noise.length; i++) noise[i] = r()
    return { grid: c.grid, ends: c.ends, overflow: c.overflow, prev: new Uint8Array(LED.cols * LED.rows), lines, changeAt: -1e9, bootAt: -1, noise }
  })
  const led = React.useRef(ledInit)

  // ---- the date ------------------------------------------------------------------------------
  const deadlineMs = parseDeadline(deadline)
  const counting = mode === "countdown" && deadlineMs !== null
  const dateTarget = counting ? countdown((deadlineMs as number) - Date.now()) : from + "-" + to
  const [dateShown, setDateShown] = React.useState(dateTarget)
  const lastMode = React.useRef(mode + roll)

  React.useEffect(() => {
    if (!counting) return
    const t = window.setInterval(() => setTick((n) => n + 1), 1000)
    return () => window.clearInterval(t)
  }, [counting])

  React.useEffect(() => {
    const key = mode + roll
    const fresh = key !== lastMode.current || dateShown === dateTarget
    lastMode.current = key
    // a countdown ticking over just updates; a new mode, a re-roll or the first paint rolls
    if (reduced || (!fresh && counting)) {
      setDateShown(dateTarget)
      return
    }
    const r = rng(dateTarget.length * 13 + roll)
    const t0 = performance.now()
    const dur = 900
    let raf = 0
    const step = (now: number) => {
      const p = (now - t0) / dur
      setDateShown(rollAt(dateTarget, p, r))
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
    // dateShown is read once for the first-paint check, not tracked
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateTarget, roll, reduced, mode])

  // ---- fonts --------------------------------------------------------------------------------
  React.useEffect(() => {
    if (!fontHref) return
    const exists = Array.from(document.querySelectorAll("link[rel=stylesheet]")).some(
      (l) => (l as HTMLLinkElement).href === fontHref,
    )
    if (exists) return
    const link = document.createElement("link")
    link.rel = "stylesheet"
    link.href = fontHref
    link.setAttribute("data-hiring-rig-font", "")
    document.head.appendChild(link)
  }, [fontHref])

  // ---- reduced motion -------------------------------------------------------------------------
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const on = () => setReduced(mq.matches)
    on()
    mq.addEventListener("change", on)
    return () => mq.removeEventListener("change", on)
  }, [])

  // ---- fitting the rig to the root --------------------------------------------------------------
  useIsoLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    const measure = () => {
      const W = root.clientWidth
      const H = root.clientHeight
      if (W < 2 || H < 2) return
      const f = fitStage(W, H)
      setGeo((g) =>
        g && g.W === W && g.H === H ? g : { W, H, s: f.s, tx: f.tx, ty: f.ty },
      )
    }
    const ro = new ResizeObserver(measure)
    ro.observe(root)
    measure()
    return () => ro.disconnect()
  }, [])

  // ---- squeezing the role and the e-mail into their slots -----------------------------------------
  React.useEffect(() => {
    const fit = (el: HTMLElement | null, max: number) => {
      if (!el) return
      el.style.transform = ""
      const w = el.scrollWidth
      el.style.transform = w > max ? "scaleX(" + (max / w).toFixed(4) + ")" : ""
    }
    const run = () => {
      fit(roleRef.current, 572)
      fit(mailRef.current, 352)
      fit(labelRef.current, 236)
    }
    run()
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(run)
    const t = window.setTimeout(run, 1200)
    return () => window.clearTimeout(t)
  }, [role, email, emailLabel, copied, font, fontHref])

  // ---- sound ------------------------------------------------------------------------------------
  const buzz = () => {
    const sp = speakerRef.current
    if (!sp || live.current.reduced) return
    sp.setAttribute("data-buzz", "0")
    void sp.offsetWidth
    sp.setAttribute("data-buzz", "1")
    later(() => sp.setAttribute("data-buzz", "0"), 420)
  }
  const blip = (notes: number[], step = 0.07, type: OscillatorType = "square", force = false) => {
    if (!soundRef.current && !force) return
    try {
      const w = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }
      const AC = w.AudioContext || w.webkitAudioContext
      if (!AC) return
      const ctx = audio.current || (audio.current = new AC())
      if (ctx.state === "suspended") void ctx.resume()
      const t0 = ctx.currentTime + 0.01
      notes.forEach((f, i) => {
        const o = ctx.createOscillator()
        const g = ctx.createGain()
        o.type = type
        o.frequency.value = f
        const s = t0 + i * step
        g.gain.setValueAtTime(0.0001, s)
        g.gain.exponentialRampToValueAtTime(0.045, s + 0.008)
        g.gain.exponentialRampToValueAtTime(0.0001, s + step * 0.95)
        o.connect(g)
        g.connect(ctx.destination)
        o.start(s)
        o.stop(s + step)
      })
      buzz()
    } catch {
      // no audio here; the poster carries on silently
    }
  }

  // ---- the frame loop ------------------------------------------------------------------------------
  // the LED canvases are sized to the stage's scale, so they stay sharp at any size
  const scaleKey = geo ? Math.round(geo.s * 100) : 0
  const ledPaint = React.useRef({ pr: 1, off: null as HTMLCanvasElement | null, lit: null as HTMLCanvasElement | null, grad: null as CanvasGradient | null })
  React.useEffect(() => {
    const c = ledRef.current
    const b = bloomRef.current
    if (!c || !b || !scaleKey) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const pr = clamp((dpr * scaleKey) / 100, 0.75, 2)
    const W = Math.round(LED.w * pr)
    const H = Math.round(LED.h * pr)
    for (const cv of [c, b]) {
      cv.width = W
      cv.height = H
    }
    // the unlit dots, painted once
    const off = document.createElement("canvas")
    off.width = W
    off.height = H
    const og = off.getContext("2d")
    if (og) {
      og.scale(pr, pr)
      og.fillStyle = "rgba(255,255,255,0.05)"
      for (let r = 0; r < LED.rows; r++)
        for (let k = 0; k < LED.cols; k++)
          og.fillRect(LED.mx + k * PITCH_X + (PITCH_X - DOT_W) / 2, LED.my + r * PITCH_Y + (PITCH_Y - DOT_H) / 2, DOT_W, DOT_H)
    }
    const lit = document.createElement("canvas")
    lit.width = W
    lit.height = H
    const lg = lit.getContext("2d")
    let grad: CanvasGradient | null = null
    if (lg) {
      grad = lg.createLinearGradient(0, 0, LED.w, LED.h * 0.7)
      const cool = hexRGB(pal.lilac, [198, 192, 255])
      const warm = hexRGB(pal.led, [255, 199, 156])
      grad.addColorStop(0, rgba(mix(cool, [128, 108, 255], 0.35)))
      grad.addColorStop(0.36, rgba(mix(cool, [255, 222, 246], 0.6)))
      grad.addColorStop(0.68, rgba(mix(warm, glow, 0.2)))
      grad.addColorStop(1, rgba(mix(warm, glow, 0.7)))
    }
    ledPaint.current = { pr, off, lit, grad }
    if (led.current.bootAt < 0) led.current.bootAt = performance.now()
    kick.current()
    // palette is keyed by value
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scaleKey, pal.lilac, pal.led, pal.glow])

  // a new message dissolves in over the old one
  React.useEffect(() => {
    const L = led.current
    if (L.lines.join("\n") === linesKey) return
    const c = composeScreen(lines, LED.cols, LED.rows, 0)
    L.prev = L.grid
    L.grid = c.grid
    L.ends = c.ends
    L.overflow = c.overflow
    L.lines = lines
    L.changeAt = performance.now()
    busyUntil.current = performance.now() + 700
    kick.current()
    // keyed by the joined text
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linesKey])

  React.useEffect(() => {
    let raf = 0
    let visible = true
    let last = performance.now()
    let ledLast = 0
    let nextTwinkle = 0
    let lastA = 1e9
    let lastTX = 1e9
    let lastTY = 1e9
    let lastCells = -1
    let wasBoiling = false
    const t0 = performance.now()
    const swing: Swing = { a: 0, v: 0 }
    const slosh: Swing = { a: 0, v: 0 }
    const tilt = { x: 0, y: 0 }
    const twinkle = rng(5)

    const cablePaths = (svg: SVGSVGElement | null) =>
      svg
        ? Array.from(svg.querySelectorAll("g[data-cable]")).map((g) => ({
            i: Number(g.getAttribute("data-cable")),
            paths: Array.from(g.querySelectorAll("path")),
          }))
        : []
    const cables = cablePaths(cableBackRef.current).concat(cablePaths(cableFrontRef.current))
    const cells = meterRef.current ? Array.from(meterRef.current.children) : []

    const drawLED = (now: number) => {
      const c = ledRef.current
      const b = bloomRef.current
      const P = ledPaint.current
      if (!c || !b || !P.off || !P.lit || !P.grad) return
      const g = c.getContext("2d")
      const bg = b.getContext("2d")
      const lg = P.lit.getContext("2d")
      if (!g || !bg || !lg) return
      const L = led.current
      const S = live.current
      const still = S.reduced
      const pr = P.pr
      const cols = LED.cols
      const rows = LED.rows

      // marquee lines are recomposed as they run
      const grid = L.overflow ? composeScreen(L.lines, cols, rows, still ? 0 : ((now - L.changeAt) / 1000) * 11).grid : L.grid
      const ends = L.ends

      const pChange = still ? 1 : clamp((now - L.changeAt) / 520, 0, 1)
      const pBoot = still || L.bootAt < 0 ? 1 : clamp((now - L.bootAt) / 1300, 0, 1)
      const glintT = ((now - t0) / 1000) % 7.5
      const glintX = !still && glintT < 1.4 ? (glintT / 1.4) * (LED.w + LED.h + 160) - 80 : -1e4

      // the pointer, in screen-local design px (the swing undone)
      const ptr = pointer.current
      let lx = -1e4
      let ly = -1e4
      if (ptr.on && S.interactive && !still) {
        const [ux, uy] = rotateAbout(ptr.x, ptr.y, PIVOT.x, PIVOT.y, -swing.a)
        lx = ux - LED.x
        ly = uy - LED.y
      }
      const torch = lx > -80 && lx < LED.w + 80 && ly > -80 && ly < LED.h + 80

      lg.setTransform(pr, 0, 0, pr, 0, 0)
      lg.globalCompositeOperation = "source-over"
      lg.globalAlpha = 1
      lg.clearRect(0, 0, LED.w, LED.h)
      lg.fillStyle = "#fff"
      const hot: number[] = []
      const tSec = (now - t0) / 1000
      const trailOn = hasTrail(L.lines)
      for (let r = 0; r < rows; r++) {
        for (let k = 0; k < cols; k++) {
          const i = r * cols + k
          const n = L.noise[i]
          let on = grid[i]
          let a = 0
          if (pChange < 1) {
            on = n < pChange ? grid[i] : L.prev[i]
            if (Math.abs(n - pChange) < 0.06) a = 1
          }
          if (trailOn && r === TRAIL_ROW && k > ends[0] + 1 && k < STAR_COL) {
            // a dash with a gap running along it toward the star, then a dotted tail
            const shift = still ? 0 : Math.floor(tSec * 9)
            on = (((k - shift) % 7) + 7) % 7 !== 0 ? 1 : 0
            if (k > STAR_COL - 5) on = k % 2
          }
          if (on) a = Math.max(a, still ? 1 : 0.86 + 0.14 * Math.sin(tSec * 3 + n * 40))
          const x = LED.mx + k * PITCH_X
          const y = LED.my + r * PITCH_Y
          if (pBoot < 1) {
            const front = pBoot * (cols + 14) - n * 10
            if (k > front) a = 0
            else if (front - k < 1.6 && on) a = 1
          }
          if (glintX > -1e3 && on) {
            const d = x + y * 0.55 - glintX
            if (d > -36 && d < 36) a = Math.min(1, a + 0.35 * (1 - Math.abs(d) / 36))
          }
          if (torch) {
            const dx = x - lx
            const dy = y - ly
            const f = Math.exp(-(dx * dx + dy * dy) / 3600)
            if (f > 0.02) a = on ? Math.min(1, a + 0.3 * f) : Math.max(a, 0.32 * f)
          }
          if (a > 0.02) {
            lg.globalAlpha = a
            lg.fillRect(x + (PITCH_X - DOT_W) / 2, y + (PITCH_Y - DOT_H) / 2, DOT_W, DOT_H)
            if (a > 0.55) hot.push(i)
          }
        }
      }
      // colour the dots, then give the brightest a white core
      lg.globalAlpha = 1
      lg.globalCompositeOperation = "source-in"
      lg.fillStyle = P.grad
      lg.fillRect(0, 0, LED.w, LED.h)
      lg.globalCompositeOperation = "source-over"
      lg.fillStyle = "#fff"
      for (const i of hot) {
        const k = i % cols
        const r = (i - k) / cols
        lg.globalAlpha = 0.2
        lg.fillRect(LED.mx + k * PITCH_X + PITCH_X * 0.32, LED.my + r * PITCH_Y + PITCH_Y * 0.2, DOT_W * 0.5, DOT_H * 0.64)
      }
      lg.globalAlpha = 1

      g.setTransform(1, 0, 0, 1, 0, 0)
      g.clearRect(0, 0, c.width, c.height)
      g.drawImage(P.off, 0, 0)
      g.drawImage(P.lit, 0, 0)
      // the bloom: the lit dots stacked and spread, so the blur has light to spread
      bg.setTransform(1, 0, 0, 1, 0, 0)
      bg.globalCompositeOperation = "source-over"
      bg.clearRect(0, 0, b.width, b.height)
      bg.globalCompositeOperation = "lighter"
      const sp = 2 * pr
      bg.drawImage(P.lit, 0, 0)
      bg.drawImage(P.lit, sp, 0)
      bg.drawImage(P.lit, 0, sp)
      bg.drawImage(P.lit, sp, sp)
      bg.globalCompositeOperation = "source-over"
    }

    const frame = (now: number) => {
      raf = 0
      const S = live.current
      const still = S.reduced
      const dt = Math.min(1 / 30, Math.max(0, (now - last) / 1000))
      last = now
      const t = (now - t0) / 1000
      const P = pointer.current

      // tilt toward the pointer
      const want = !still && S.interactive && P.on
      tilt.x += ((want ? (P.nx - 0.5) * 9 : 0) - tilt.x) * Math.min(1, dt * 4)
      tilt.y += ((want ? (0.5 - P.ny) * 5 : 0) - tilt.y) * Math.min(1, dt * 4)
      const rig = rigRef.current
      if (rig && (Math.abs(tilt.x - lastTX) > 0.004 || Math.abs(tilt.y - lastTY) > 0.004)) {
        lastTX = tilt.x
        lastTY = tilt.y
        rig.style.transform = "rotateX(" + tilt.y.toFixed(3) + "deg) rotateY(" + tilt.x.toFixed(3) + "deg)"
        sheenRef.current?.style.setProperty("--hrp-sx", (50 + tilt.x * 7).toFixed(1) + "%")
      }

      // the swing: held while dragged, a slow idle sway otherwise
      const D = drag.current
      if (still) {
        swing.a = 0
        swing.v = 0
      } else {
        if (impulse.current) {
          swing.v += impulse.current
          impulse.current = 0
        }
        if (D.on) swingStep(swing, D.target, dt, 150, 22)
        else swingStep(swing, 0.0045 * Math.sin(t * 0.83) + 0.0022 * Math.sin(t * 1.9 + 1), dt, 15, 1.5)
        swing.a = clamp(swing.a, -0.3, 0.3)
        swing.v = clamp(swing.v, -2, 2)
      }
      if (Math.abs(swing.a - lastA) > 2e-5) {
        lastA = swing.a
        const pn = panelRef.current
        if (pn) pn.style.transform = "rotate(" + swing.a.toFixed(5) + "rad)"
        const sh = shadowRef.current
        if (sh) sh.style.transform = "translate(" + (36 + swing.a * 700).toFixed(1) + "px, 46px) rotate(" + swing.a.toFixed(5) + "rad)"
        for (const cb of cables) {
          const def = CABLES[cb.i]
          if (!def) continue
          const d = smoothPath(placeCable(def.pts, swing.a, PIVOT.x, PIVOT.y))
          for (const p of cb.paths) p.setAttribute("d", d)
        }
      }

      // the fluid stays level while the capsule swings, and sloshes
      const boiling = now < boilUntil.current
      if (!still) {
        swingStep(slosh, -swing.a, dt, 40, 2.2)
        const amp = 1.4 + Math.min(5, Math.abs(slosh.v) * 22) + (boiling ? 3.2 : 0)
        const slope = Math.tan(slosh.a)
        fluidRef.current?.setAttribute("d", fluidPath(FLUID.x0, FLUID.x1, FLUID.level, FLUID.bottom, slope, t, amp))
        surfaceRef.current?.setAttribute("d", fluidSurface(FLUID.x0, FLUID.x1, FLUID.level, slope, t, amp))
      }
      const fb = fluidBoxRef.current
      if (fb && boiling !== wasBoiling) {
        wasBoiling = boiling
        fb.setAttribute("data-boil", boiling ? "1" : "0")
      }

      // the meter: a slow charge, or a VU jump after something happens
      let level: number
      if (now < vuUntil.current) {
        const left = (vuUntil.current - now) / 1800
        level = clamp(0.35 + 0.65 * left + (still ? 0 : (twinkle() - 0.5) * 0.3), 0, 1)
      } else if (still) level = 0.66
      else {
        const ph = (t % 5.5) / 5.5
        level = ph < 0.8 ? 0.45 + 0.55 * (ph / 0.8) : Math.floor(t * 4) % 2 ? 1 : 0.89
      }
      const lit = Math.round(level * cells.length)
      if (lit !== lastCells) {
        lastCells = lit
        cells.forEach((el, i) => el.setAttribute("data-on", cells.length - 1 - i < lit ? "1" : "0"))
      }

      // a glyph turns over now and then
      if (!still && now > nextTwinkle) {
        nextTwinkle = now + 650 + twinkle() * 700
        flip(Math.floor(twinkle() * GLYPHS.length), 1300)
      }

      if (now - ledLast > 31 || still) {
        ledLast = now
        drawLED(now)
      }

      if (visible && (!still || now < busyUntil.current)) raf = requestAnimationFrame(frame)
    }

    const start = () => {
      if (!raf && visible) {
        last = performance.now()
        raf = requestAnimationFrame(frame)
      }
    }
    kick.current = start
    start()

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting && !document.hidden
      if (visible) start()
    })
    if (rootRef.current) io.observe(rootRef.current)
    const onVis = () => {
      visible = !document.hidden
      if (visible) start()
    }
    document.addEventListener("visibilitychange", onVis)

    return () => {
      cancelAnimationFrame(raf)
      raf = 0
      kick.current = () => {}
      io.disconnect()
      document.removeEventListener("visibilitychange", onVis)
      timers.current.forEach((t) => window.clearTimeout(t))
      timers.current = []
      if (audio.current) void audio.current.close()
      audio.current = null
    }
    // everything live is read through refs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // reduced motion and interactivity restart the loop
  React.useEffect(() => {
    kick.current()
  }, [reduced, interactive])

  // ---- the glyph field ------------------------------------------------------------------------
  const flipAt = React.useRef(new Float64Array(GLYPHS.length))
  function flip(i: number, ms = 900) {
    const g = glyphRef.current
    const el = g ? g.querySelector('[data-i="' + i + '"]') : null
    if (!el) return
    const now = performance.now()
    if (now - flipAt.current[i] < 250) return
    flipAt.current[i] = now
    el.setAttribute("data-flip", "1")
    later(() => el.setAttribute("data-flip", "0"), ms)
  }
  const glyphIndex = (e: React.PointerEvent | React.MouseEvent) => {
    const el = (e.target as Element).closest("[data-i]")
    return el ? Number(el.getAttribute("data-i")) : -1
  }
  const onGlyphMove = (e: React.PointerEvent) => {
    if (live.current.reduced) return
    const i = glyphIndex(e)
    if (i < 0) return
    const { row, col } = GLYPHS[i]
    flip(i)
    for (const [dr, dc] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
      const r2 = row + dr
      const c2 = col + dc
      if (r2 >= 0 && r2 < GLYPH_ROWS && c2 >= 0 && c2 < GLYPH_COLS) {
        const j = r2 * GLYPH_COLS + c2
        later(() => flip(j), 90)
      }
    }
  }
  const onGlyphClick = (e: React.MouseEvent) => {
    const i = glyphIndex(e)
    const { row, col } = i >= 0 ? GLYPHS[i] : { row: 3, col: 2 }
    touch()
    blip([1500, 1900], 0.035, "triangle")
    if (live.current.reduced) return
    GLYPHS.forEach((gl, j) => {
      const d = Math.hypot(gl.row - row, gl.col - col)
      later(() => flip(j, 700), d * 55)
    })
  }

  // ---- controls ---------------------------------------------------------------------------------
  const touch = () => {
    if (!touched) setTouched(true)
  }
  const pulse = (ms = 1800) => {
    vuUntil.current = performance.now() + ms
    kick.current()
  }
  const nextMessage = () => {
    touch()
    blip([1180], 0.04)
    pulse(900)
    if (thanking) setThanking(false)
    else setMsg((m) => (m + 1) % Math.max(1, deck.length))
  }
  const onDate = () => {
    touch()
    blip([880, 660], 0.05, "triangle")
    pulse(900)
    if (deadlineMs !== null) setMode((m) => (m === "dates" ? "countdown" : "dates"))
    else setRoll((n) => n + 1)
  }
  const onCopy = () => {
    touch()
    const done = () => {
      setCopied(true)
      blip([990, 1480], 0.06, "triangle")
      pulse(1200)
      later(() => setCopied(false), 1800)
    }
    const clip = navigator.clipboard
    if (clip && clip.writeText) clip.writeText(email).then(done, () => window.open("mailto:" + email, "_self"))
    else window.open("mailto:" + email, "_self")
  }
  const onApplyPress = () => {
    touch()
    setApplied(true)
    setThanking(true)
    blip([660, 880, 1320, 1760], 0.075)
    boilUntil.current = performance.now() + 2600
    pulse(2600)
    later(() => setThanking(false), 3600)
    later(() => setApplied(false), 1400)
    onApplyRef.current?.()
  }
  const onSpeaker = () => {
    touch()
    const next = !soundOn
    setSoundOn(next)
    if (next) blip([523, 784], 0.07, "triangle", true)
  }

  // ---- pointer --------------------------------------------------------------------------------------
  const toDesign = (cx: number, cy: number) => {
    const root = rootRef.current
    const g = geoRef.current
    if (!root || !g) return { x: -1e4, y: -1e4, nx: 0.5, ny: 0.5 }
    const rr = root.getBoundingClientRect()
    const lx = cx - rr.left
    const ly = cy - rr.top
    return { x: (lx - g.tx) / g.s, y: (ly - g.ty) / g.s, nx: lx / rr.width, ny: ly / rr.height }
  }
  const onMove = (e: React.PointerEvent) => {
    const p = toDesign(e.clientX, e.clientY)
    const P = pointer.current
    const now = performance.now()
    const dtm = Math.max(1, now - P.t)
    const vx = ((p.x - P.x) / dtm) * 1000
    P.vx = P.on ? vx : 0
    P.x = p.x
    P.y = p.y
    P.nx = p.nx
    P.ny = p.ny
    P.t = now
    P.on = true
    const D = drag.current
    if (D.on) {
      D.target = clamp(Math.atan2(p.x - D.x0, 1100), -0.17, 0.17)
    } else if (interactive && !reduced && Math.abs(P.vx) > 900 && p.x > 172 && p.x < 1014 && p.y > 362 && p.y < 1610) {
      // a fast swipe across the panel nudges it
      impulse.current += clamp(P.vx * 0.000006, -0.03, 0.03)
    }
    kick.current()
  }
  const onLeave = () => {
    pointer.current.on = false
    kick.current()
  }
  const onDown = (e: React.PointerEvent) => {
    if (!interactive || reduced) return
    const target = e.target as Element
    if (target.closest("button, a, [data-hrp-nodrag]") || !target.closest("[data-hrp-drag]")) return
    const p = toDesign(e.clientX, e.clientY)
    const D = drag.current
    D.on = true
    D.id = e.pointerId
    D.x0 = p.x
    D.target = 0
    setDragging(true)
    touch()
    try {
      rootRef.current?.setPointerCapture(e.pointerId)
    } catch {
      // capture is a nicety; the drag still works inside the root
    }
    kick.current()
  }
  const onUp = (e: React.PointerEvent) => {
    const D = drag.current
    if (!D.on) return
    D.on = false
    setDragging(false)
    try {
      rootRef.current?.releasePointerCapture(e.pointerId)
    } catch {
      // already released
    }
    kick.current()
  }

  // ---- render -----------------------------------------------------------------------------------------
  const glowA = rgba(glow, 0.55)
  const caption = darkWall ? rgba(mix(back, WHITE, 0.6)) : rgba(mix(back, BLACK, 0.55))
  const captionDim = darkWall ? rgba(mix(back, WHITE, 0.35)) : rgba(mix(back, BLACK, 0.35))
  const wallLight = rgba(mix(back, WHITE, darkWall ? 0.08 : 0.55))
  const wallDark = rgba(mix(back, BLACK, darkWall ? 0.5 : 0.12))
  const cardText = rgba(mix(glow, WHITE, 0.12))
  const reqRows: HiringRigRequirement[][] = []
  for (let i = 0; i < requirements.length; i += 3) reqRows.push(requirements.slice(i, i + 3))
  const ledLabel = lines.join(" ")
  const left = counting ? Math.max(0, (deadlineMs as number) - Date.now()) : 0
  const dateLabel = counting
    ? left > 0
      ? "Applications close in " + Math.floor(left / 864e5) + " days, " + (Math.floor(left / 36e5) % 24) + " hours"
      : "Applications are closed"
    : "Applications open " + from + " to " + to
  const cableTone = (t: CableDef["tone"]) =>
    t === "cable" ? hexRGB(pal.cable, [255, 122, 18]) : t === "alt" ? hexRGB(pal.cableAlt, [255, 178, 26]) : hexRGB(pal.hardware, [22, 23, 27])

  const cableLayer = (front: boolean, ref: { current: SVGSVGElement | null }) => (
    <svg
      ref={ref}
      aria-hidden
      viewBox={"0 0 " + STAGE_W + " " + STAGE_H}
      width={STAGE_W}
      height={STAGE_H}
      className="absolute left-0 top-0"
      style={{ maxWidth: "none", overflow: "visible", pointerEvents: "none" }}
    >
      {CABLES.map((c, i) => {
        if (c.front !== front) return null
        const base = cableTone(c.tone)
        const d = smoothPath(placeCable(c.pts, 0, PIVOT.x, PIVOT.y))
        const dark = c.tone === "dark"
        return (
          <g key={i} data-cable={i} fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d={d} stroke={rgba(mix(base, BLACK, 0.5), 0.9)} strokeWidth={c.w + 2.5} />
            <path d={d} stroke={rgba(base)} strokeWidth={c.w} />
            <path
              d={d}
              stroke={rgba(mix(base, WHITE, dark ? 0.35 : 0.6), dark ? 0.6 : 0.85)}
              strokeWidth={Math.max(1, c.w * 0.26)}
              transform={"translate(" + (-c.w * 0.2).toFixed(1) + " " + (-c.w * 0.2).toFixed(1) + ")"}
            />
          </g>
        )
      })}
    </svg>
  )

  const at = (x: number, y: number, w: number, h: number): React.CSSProperties => ({
    position: "absolute",
    left: x,
    top: y,
    width: w,
    height: h,
  })

  return (
    <section
      ref={rootRef}
      aria-label={"Now hiring: " + role}
      className={"hrp-root relative w-full overflow-hidden " + (interactive && !reduced ? "hrp-grab " : "") + (dragging ? "hrp-dragging " : "") + className}
      style={
        {
          height,
          background: "radial-gradient(120% 90% at 50% 22%, " + wallLight + " 0%, " + rgba(back) + " 55%, " + wallDark + " 100%)",
          fontFamily: font,
          touchAction: "pan-y",
          "--hrp-ink": rgba(ink),
          "--hrp-glow-a": glowA,
          "--hrp-signal-a": rgba(signal, 0.6),
          "--hrp-focus": rgba(signal),
          "--hrp-cell-on": "linear-gradient(180deg," + rgba(mix(mix(glow, [255, 214, 90], 0.5), WHITE, 0.55)) + "," + rgba(mix(glow, [255, 214, 90], 0.45)) + ")",
          "--hrp-cell-off": rgba(mix(glow, BLACK, 0.72)),
          "--hrp-cell-edge": rgba(glow, 0.28),
        } as React.CSSProperties
      }
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      onPointerDown={onDown}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      <style>{CSS}</style>

      {captions && (
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ color: caption, fontSize: 11, letterSpacing: "0.2em", lineHeight: 1.7, textTransform: "uppercase" }}>
          <div className="absolute left-5 top-5 hidden sm:block md:left-8 md:top-7">
            <p style={{ color: captionDim }}>Fig. 01 — Recruitment unit</p>
            <p>{role}</p>
          </div>
          <div className="absolute right-5 top-5 hidden text-right sm:block md:right-8 md:top-7">
            <p style={{ color: captionDim }}>Status</p>
            <p className="flex items-center justify-end gap-2">
              <span className="hrp-live inline-block rounded-full" style={{ width: 7, height: 7, background: rgba(signal) }} />
              Open {from} — {to}
            </p>
          </div>
          <div className="absolute bottom-5 right-5 hidden text-right sm:block md:bottom-7 md:right-8">
            <p style={{ color: captionDim }}>{site}</p>
          </div>
          <p
            className="hrp-hint absolute bottom-4 left-0 right-0 px-4 text-center tracking-[0.1em] sm:bottom-7 sm:left-8 sm:right-auto sm:px-0 sm:text-left sm:tracking-[0.2em]"
            style={{ opacity: touched ? 0 : 1, fontSize: 10.5 }}
          >
            Drag the panel · tap the screen · press ✦ to apply
          </p>
        </div>
      )}

      <div
        className="absolute left-0 top-0"
        style={{
          width: STAGE_W,
          height: STAGE_H,
          transformOrigin: "0 0",
          transform: geo ? "translate(" + geo.tx.toFixed(2) + "px," + geo.ty.toFixed(2) + "px) scale(" + geo.s.toFixed(5) + ")" : undefined,
          visibility: geo ? "visible" : "hidden",
          perspective: "2600px",
          perspectiveOrigin: "600px 900px",
        }}
      >
        {/* light spilling onto the wall, the panel's shadow, the floor */}
        <div
          aria-hidden
          className="pointer-events-none absolute"
          style={{ ...at(-60, 300, 1320, 1400), background: "radial-gradient(closest-side, " + rgba(glow, darkWall ? 0.3 : 0.2) + ", " + rgba(glow, 0) + ")" }}
        />
        <div
          ref={shadowRef}
          aria-hidden
          className="pointer-events-none absolute"
          style={{
            ...at(172, 362, 842, 1096),
            borderRadius: 60,
            background: darkWall ? "rgba(0,0,0,0.45)" : "rgba(28,36,50,0.2)",
            filter: "blur(44px)",
            transform: "translate(36px, 46px)",
            transformOrigin: PIVOT.x - 172 + "px " + (PIVOT.y - 362) + "px",
            willChange: "transform",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute"
          style={{ ...at(170, 1700, 880, 90), background: "radial-gradient(closest-side, " + (darkWall ? "rgba(0,0,0,0.5)" : "rgba(30,40,55,0.22)") + ", rgba(0,0,0,0))" }}
        />

        <div
          ref={rigRef}
          className="absolute left-0 top-0"
          style={{ width: STAGE_W, height: STAGE_H, transformOrigin: "600px 900px", willChange: "transform" }}
        >
          <Tower uid={uid} pal={pal} k={artKey} />
          {cableLayer(false, cableBackRef)}

          <div
            ref={panelRef}
            className="absolute left-0 top-0"
            style={{ width: STAGE_W, height: STAGE_H, transformOrigin: PIVOT.x + "px " + PIVOT.y + "px", pointerEvents: "none", willChange: "transform" }}
          >
            <PanelBack uid={uid} pal={pal} k={artKey} />

            {/* the LED screen: lit dots, their bloom, the star, the glass */}
            <button
              type="button"
              className="hrp-btn hrp-screen"
              onClick={nextMessage}
              aria-label={"LED screen: " + ledLabel + ". Show the next message."}
              style={{ ...at(LED.x, LED.y, LED.w, LED.h), pointerEvents: "auto", borderRadius: 6, overflow: "hidden" }}
            >
              <canvas
                ref={ledRef}
                aria-hidden
                className="absolute left-0 top-0 block"
                style={{ width: LED.w, height: LED.h, maxWidth: "none" }}
              />
              <canvas
                ref={bloomRef}
                aria-hidden
                className="absolute left-0 top-0 block"
                style={{ width: LED.w, height: LED.h, maxWidth: "none", filter: "blur(7px) brightness(1.5) saturate(1.8)", mixBlendMode: "screen", opacity: 0.9 }}
              />
              {starOn && (
                <svg
                  aria-hidden
                  viewBox="-10 -10 120 120"
                  className="hrp-star absolute"
                  style={{ left: 488, top: 70, width: 84, height: 108, maxWidth: "none", overflow: "visible", filter: "drop-shadow(0 0 6px " + rgba(glow, 0.9) + ")" }}
                  preserveAspectRatio="none"
                >
                  <path d={STAR_D} fill="none" stroke={rgba(mix(glow, WHITE, 0.15))} strokeWidth="5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
                </svg>
              )}
              <span
                aria-hidden
                className="hrp-gloss pointer-events-none absolute inset-0"
                style={{
                  background:
                    "linear-gradient(162deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.04) 32%, rgba(255,255,255,0) 33%), repeating-linear-gradient(0deg, rgba(0,0,0,0.1) 0 1px, rgba(0,0,0,0) 1px 3px)",
                  opacity: 1,
                }}
              />
            </button>

            {/* the role band */}
            <div
              className="absolute overflow-hidden"
              style={{ ...at(318, 694, 592, 88), padding: "0 10px", color: pal.band, fontSize: 74, lineHeight: "88px", fontWeight: 450, fontStretch: "75%", letterSpacing: "-0.005em" }}
            >
              <span ref={roleRef} className="hrp-fit">
                {role}
              </span>
            </div>

            {/* the date */}
            <button
              type="button"
              className="hrp-btn hrp-date"
              onClick={onDate}
              aria-label={dateLabel + (deadlineMs !== null ? ". " + (counting ? "Show the dates." : "Show the countdown.") : ". Roll the digits.")}
              style={{ ...at(322, 808, 586, 228), pointerEvents: "auto" }}
            >
              <svg aria-hidden viewBox="0 0 586 228" width={586} height={228} style={{ maxWidth: "none", display: "block", overflow: "visible" }}>
                <path d="M2 2 H560 L584 26 V202 L560 226 H2 Z" fill="none" stroke={rgba(ink)} strokeOpacity="0.55" strokeWidth="2" />
                <path d="M10 10 H40 M10 10 V40 M576 188 V200 L556 220 H520" fill="none" stroke={rgba(ink)} strokeOpacity="0.7" strokeWidth="2.4" />
                <g transform="translate(14 16)" style={{ filter: "drop-shadow(0 0 5px " + rgba(ink, 0.35) + ")" }}>
                  <SevenSeg text={dateShown} color={rgba(ink)} w={558} h={196} blink={counting && !reduced} />
                </g>
              </svg>
            </button>

            {/* the e-mail: click to copy */}
            <button
              type="button"
              className="hrp-btn hrp-email"
              onClick={onCopy}
              aria-label={copied ? "Copied " + email : "Copy " + email}
              style={{ ...at(318, 1060, 362, 84), pointerEvents: "auto", color: rgba(ink) }}
            >
              <span className="block" style={{ fontSize: 36, lineHeight: "38px", fontStretch: "75%", whiteSpace: "nowrap", paddingLeft: 4 }}>
                <span ref={labelRef} className="hrp-fit">
                  {copied ? "Copied!" : emailLabel}
                </span>
              </span>
              <span className="relative block" style={{ fontSize: 44, lineHeight: "44px", fontStretch: "75%", paddingLeft: 4 }}>
                <span ref={mailRef} className="hrp-fit">
                  {email}
                </span>
                <span aria-hidden className="hrp-line absolute block" style={{ left: 4, right: 0, bottom: -3, height: 2.5, background: rgba(ink) }} />
              </span>
              <span aria-hidden className="absolute flex items-center" style={{ left: 252, top: 12, gap: 9 }}>
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="hrp-pip block rounded-full"
                    style={{ width: 10, height: 10, background: copied ? rgba(signal) : "rgba(255,255,255,0.75)", boxShadow: "0 0 0 1px " + rgba(ink, 0.25) }}
                  />
                ))}
                <span className="block rounded-full" style={{ width: 16, height: 16, marginLeft: 22, border: "2.5px solid rgba(255,255,255,0.85)" }} />
              </span>
            </button>
            <a
              href={"mailto:" + email}
              className="hrp-mail absolute"
              aria-label={"Write to " + email}
              style={{ ...at(684, 1058, 36, 40), pointerEvents: "auto" }}
            >
              <svg aria-hidden viewBox="0 0 36 40" width={36} height={40} style={{ maxWidth: "none", display: "block" }}>
                <path d="M30 6 L6 20 L30 34 Z" fill={rgba(mix(ink, BLACK, 0.3))} />
              </svg>
            </a>

            {/* the glyph field */}
            <svg
              aria-hidden
              viewBox="0 0 196 214"
              width={196}
              height={214}
              className="absolute"
              style={{ left: 538, top: 1152, maxWidth: "none", overflow: "visible", pointerEvents: "auto", cursor: "pointer" }}
              onPointerMove={onGlyphMove}
              onClick={onGlyphClick}
              data-hrp-nodrag=""
            >
              {/* CSS transforms replace an SVG transform attribute, so each glyph is placed by its group */}
              <g ref={glyphRef}>
                {GLYPHS.map((gl, i) => (
                  <g key={i} transform={"translate(" + (4 + gl.col * 31) + " " + (4 + gl.row * 24.5 + (gl.solid ? 12 : 0)) + ") scale(0.95)"}>
                    <path data-i={i} data-on={gl.solid ? "1" : "0"} data-flip="0" className="hrp-gl" d={gl.d} />
                  </g>
                ))}
              </g>
            </svg>

            {/* the info card */}
            <div
              tabIndex={0}
              role="group"
              aria-label={lookingFor}
              className="hrp-card absolute overflow-hidden"
              data-hrp-nodrag=""
              style={{
                ...at(748, 1056, 196, 334),
                pointerEvents: "auto",
                borderRadius: 7,
                padding: "13px 12px 12px",
                color: cardText,
                background: "linear-gradient(160deg, " + rgba(mix(hexRGB(pal.screen, [11, 10, 15]), WHITE, 0.09)) + " 0%, " + pal.screen + " 45%)",
                boxShadow: "0 16px 30px rgba(0,0,0,0.28), inset 0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.18)",
                fontStretch: "75%",
                cursor: "zoom-in",
              }}
            >
              <div className="flex items-center justify-between" style={{ fontSize: 17, lineHeight: "20px" }}>
                <span>{lookingFor}</span>
                <span className="hrp-ring block rounded-full" style={{ width: 13, height: 13, border: "2.5px solid " + rgba(signal) }} />
              </div>
              <div style={{ height: 1.5, background: rgba(glow, 0.7), margin: "8px 0 6px" }} />
              {reqRows.map((row, ri) => (
                <div
                  key={ri}
                  className="grid"
                  style={{
                    gridTemplateColumns: "repeat(" + row.length + ", minmax(0, 1fr))",
                    border: "1px solid " + rgba(glow, 0.55),
                    marginTop: ri ? 4 : 0,
                    fontSize: 10,
                    lineHeight: "12px",
                  }}
                >
                  {row.map((r, i) => (
                    <div key={"l" + i} style={{ padding: "3px 4px", borderLeft: i ? "1px solid " + rgba(glow, 0.55) : undefined, borderBottom: "1px solid " + rgba(glow, 0.55), opacity: 0.75 }}>
                      {r.label}
                    </div>
                  ))}
                  {row.map((r, i) => (
                    <div key={"v" + i} style={{ padding: "3px 4px", borderLeft: i ? "1px solid " + rgba(glow, 0.55) : undefined }}>
                      {r.value}
                    </div>
                  ))}
                </div>
              ))}
              <div className="flex items-center" style={{ gap: 8, marginTop: 11, fontSize: 17, lineHeight: "20px" }}>
                <span>{addressLabel}</span>
                <span className="block flex-1" style={{ height: 9, background: rgba(glow, 0.85), borderRadius: 1 }} />
              </div>
              <p style={{ margin: "6px 0 0", fontSize: 10.5, lineHeight: "13px", opacity: 0.85 }}>{address}</p>
              <div className="flex" style={{ gap: 4, marginTop: 6 }}>
                <span className="block" style={{ height: 4, flex: 3, background: rgba(glow, 0.5) }} />
                <span className="block" style={{ height: 4, flex: 1, background: rgba(glow, 0.25) }} />
              </div>
              <div aria-hidden className="flex items-center justify-between" style={{ margin: "16px 6px 0" }}>
                {["M2 4 L10 12 L18 4 M2 11 L10 19 L18 11", STAR_D, "M2 2 L9 10 L2 18 M18 2 L11 10 L18 18", "M2 18 L10 4 L18 18"].map((d, i) => (
                  <svg key={i} viewBox={i === 1 ? "0 0 100 100" : "0 0 20 20"} width={20} height={20} style={{ maxWidth: "none" }}>
                    <path d={d} fill={i === 1 ? cardText : "none"} stroke={i === 1 ? "none" : cardText} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ))}
              </div>
              <div style={{ height: 1.5, background: rgba(glow, 0.7), margin: "14px 0 8px" }} />
              <p style={{ margin: 0, fontSize: 18, lineHeight: "21px" }}>
                {tagline}
                <br />
                <WithStar text={studio} color={cardText} />
              </p>
            </div>

            {/* the amber meter */}
            <div ref={meterRef} aria-hidden className="absolute flex flex-col" style={{ ...at(934, 613, 46, 370), gap: 5 }}>
              {Array.from({ length: 9 }, (_, i) => (
                <span
                  key={i}
                  data-on="0"
                  className="hrp-cell block flex-1"
                />
              ))}
            </div>

            {/* the fluid in the capsule */}
            <svg
              ref={fluidBoxRef}
              aria-hidden
              viewBox={FLUID.x0 + " 1494 " + (FLUID.x1 - FLUID.x0) + " 106"}
              width={FLUID.x1 - FLUID.x0}
              height={106}
              className="hrp-fluid absolute"
              data-boil="0"
              style={{ left: FLUID.x0, top: 1494, maxWidth: "none", pointerEvents: "none" }}
            >
              <defs>
                <linearGradient id={uid + "fl"} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0" stopColor={rgba(mix(glow, WHITE, 0.55))} />
                  <stop offset="0.16" stopColor={rgba(mix(glow, WHITE, 0.08))} />
                  <stop offset="0.6" stopColor={rgba(glow)} />
                  <stop offset="1" stopColor={rgba(mix(glow, BLACK, 0.45))} />
                </linearGradient>
                <clipPath id={uid + "fc"}>
                  <rect x={FLUID.x0} y="1494" width={FLUID.x1 - FLUID.x0} height="104" />
                </clipPath>
              </defs>
              <g clipPath={"url(#" + uid + "fc)"}>
                <path ref={fluidRef} d={fluidPath(FLUID.x0, FLUID.x1, FLUID.level, FLUID.bottom, 0, 0, 1.4)} fill={"url(#" + uid + "fl)"} />
                <path
                  ref={surfaceRef}
                  d={fluidSurface(FLUID.x0, FLUID.x1, FLUID.level, 0, 0, 1.4)}
                  fill="none"
                  stroke={rgba(mix(glow, WHITE, 0.8))}
                  strokeWidth="2.6"
                  strokeOpacity="0.9"
                />
                {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <circle
                    key={i}
                    className="hrp-bub"
                    cx={FLUID.x0 + 30 + i * 52 + (i % 3) * 9}
                    cy={1594}
                    r={2 + (i % 3) * 1.4}
                    fill="#fff"
                    fillOpacity="0.7"
                    style={{ animationDuration: 2.4 + (i % 4) * 0.7 + "s", animationDelay: -i * 0.53 + "s", transformBox: "fill-box" }}
                  />
                ))}
              </g>
            </svg>

            <PanelFront uid={uid} pal={pal} k={artKey} />

            {/* the speaker: mutes the blips */}
            <button
              ref={speakerRef}
              type="button"
              className="hrp-btn hrp-speaker"
              data-buzz="0"
              onClick={onSpeaker}
              aria-pressed={soundOn}
              aria-label={soundOn ? "Sound on. Mute." : "Sound off. Unmute."}
              style={{ ...at(900, 380, 230, 240), pointerEvents: "auto", borderRadius: "46%" }}
            >
              <Speaker uid={uid} pal={pal} k={artKey} on={soundOn} />
            </button>

            {/* the light on the acrylic follows the tilt */}
            <div
              ref={sheenRef}
              aria-hidden
              className="pointer-events-none absolute"
              style={
                {
                  ...at(172, 362, 842, 1096),
                  borderRadius: 48,
                  background:
                    "linear-gradient(112deg, rgba(255,255,255,0) calc(var(--hrp-sx) - 22%), rgba(255,255,255,0.22) calc(var(--hrp-sx) - 6%), rgba(255,255,255,0.05) var(--hrp-sx), rgba(255,255,255,0) calc(var(--hrp-sx) + 8%))",
                  mixBlendMode: "screen",
                  "--hrp-sx": "50%",
                } as React.CSSProperties
              }
            />

            {/* the ✦ button */}
            {applyHref ? (
              <a
                href={applyHref}
                target="_blank"
                rel="noreferrer"
                className="hrp-apply absolute"
                aria-label={applyLabel}
                data-done={applied ? "1" : "0"}
                onClick={onApplyPress}
                style={{ ...at(296, 1250, 112, 112), pointerEvents: "auto", borderRadius: "50%" }}
              >
                <ApplyArt uid={uid} glow={glow} />
              </a>
            ) : (
              <button
                type="button"
                className="hrp-btn hrp-apply"
                aria-label={applyLabel}
                data-done={applied ? "1" : "0"}
                onClick={onApplyPress}
                style={{ ...at(296, 1250, 112, 112), pointerEvents: "auto", borderRadius: "50%" }}
              >
                <ApplyArt uid={uid} glow={glow} />
              </button>
            )}

            {/* small print on the foot of the plate */}
            <p
              className="absolute text-center"
              style={{ ...at(460, 1394, 308, 20), margin: 0, fontSize: 15, lineHeight: "20px", letterSpacing: "0.06em", color: "#7c828c" }}
            >
              {site}
            </p>
          </div>

          {cableLayer(true, cableFrontRef)}
        </div>
      </div>
    </section>
  )
}

/** The glossy orange ✦ button. */
const ApplyArt = ({ uid, glow }: { uid: string; glow: RGB }) => (
  <svg aria-hidden viewBox="0 0 112 112" width={112} height={112} style={{ maxWidth: "none", display: "block", overflow: "visible" }}>
    <defs>
      <radialGradient id={uid + "ab"} cx="0.36" cy="0.3" r="0.78">
        <stop offset="0" stopColor={rgba(mix(glow, WHITE, 0.55))} />
        <stop offset="0.45" stopColor={rgba(glow)} />
        <stop offset="1" stopColor={rgba(mix(glow, BLACK, 0.45))} />
      </radialGradient>
    </defs>
    <circle className="hrp-halo" cx="56" cy="56" r="54" fill="none" stroke={rgba(glow)} strokeWidth="3" />
    <circle cx="56" cy="60" r="52" fill="#000" opacity="0.3" />
    <circle cx="56" cy="56" r="52" fill={"url(#" + uid + "ab)"} />
    <ellipse cx="44" cy="30" rx="26" ry="14" fill="#fff" opacity="0.35" />
    <g className="hrp-astar">
      <path d={STAR_D} transform="translate(30 30) scale(0.52)" fill="#fff" />
    </g>
  </svg>
)
