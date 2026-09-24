"use client"

import * as React from "react"

/* ------------------------------------------------------------------ types */

export type DeskTodo = string | { text: string; done?: boolean }

export type CraftDeskPortfolioHeroProps = {
  /**
   * Height of the hero. Must be a definite length — the desk is fitted to this
   * box, so a percentage collapses to 0px unless every ancestor up to <html>
   * has a real height. Never pass `"100%"`.
   */
  height?: string
  /** Floor for the height, so the desk stays readable on short viewports. */
  minHeight?: string
  /** Hand-lettered on the torn sheet in the middle. Ten characters fit big. */
  title?: string
  /** The torn note. Broken onto two lines at the first space. */
  name?: string
  /** Where tapping the name note goes. Omit it and the note is just paper. */
  nameHref?: string
  /** The yellow tape label above the title. */
  tag?: string
  /** The orange tape label below it. */
  year?: string
  /** Heading on the sticky note. */
  todoTitle?: string
  /** Rows on the sticky note — tap to tick. Four fit, about twelve characters each. */
  todos?: DeskTodo[]
  /** Image for the die-cut sticker. Omit it for the drawn face. */
  avatar?: string
  /** Image for the polaroid. Omit it for the drawn sunset. */
  photo?: string
  /** The cutting mat. */
  matColor?: string
  /** Four crayons; tap one to doodle in its colour on the sketchbook. */
  crayons?: string[]
  /** Called with the piece id (e.g. `"glue"`, `"avatar"`) on every tap. */
  onPieceTap?: (id: string) => void
  className?: string
}

/* ----------------------------------------------------------------- palette */

const INK = "#1d1b18"
const PAPER = "#f7f2e4"
const STAR = "#f8c63d"
const STAR_LIGHT = "#fde384"
const BLUE = "#2f5fcf"
const BLUE_DARK = "#224697"
const WOOD = "#eec48c"
const SKIN = "#fbe1c9"

/* ---------------------------------------------------------------- the desk
   Every piece is drawn round its own origin and placed by a layout table, so
   the same objects can be arranged on a wide desk or a tall one. */

const PIECES = [
  "shaving-a", "shaving-b", "shavings",
  "pencil-0", "pencil-1", "pencil-2",
  "brushes", "polaroid", "crayon-3", "glue",
  "crayon-0", "crayon-1", "crayon-2",
  "todo", "clip-red-a", "star-a", "clip-green", "clip-violet",
  "title", "tape-a", "tape-b", "tag", "year",
  "avatar", "star-b", "sparkle-a", "sparkle-b",
  "name", "clip-gold", "clip-red-b",
  "sketch", "tablet", "pen",
] as const

export type PieceId = (typeof PIECES)[number]
type Place = [x: number, y: number, rot: number]
type Layout = { w: number; h: number; at: Record<PieceId, Place> }

const WIDE: Layout = {
  w: 1200,
  h: 848,
  at: {
    "star-a": [96, 84, -8],
    todo: [282, 112, -6],
    "clip-red-a": [205, 92, 12],
    "clip-green": [470, 58, -32],
    "clip-violet": [448, 190, 64],
    glue: [596, 214, -18],
    "crayon-0": [778, 170, -14],
    "crayon-1": [838, 150, -4],
    "crayon-2": [896, 118, 12],
    "crayon-3": [1150, 150, -38],
    polaroid: [1085, 92, 8],
    shavings: [128, 318, 0],
    "shaving-a": [92, 460, -18],
    "shaving-b": [196, 488, 26],
    tag: [428, 262, -3],
    "tape-a": [322, 318, -38],
    "tape-b": [880, 478, -32],
    avatar: [926, 262, 8],
    title: [600, 402, -2],
    "star-b": [1098, 300, 14],
    brushes: [1062, 398, -8],
    "sparkle-a": [1116, 486, 0],
    "sparkle-b": [1070, 530, 18],
    year: [300, 528, -4],
    "clip-red-b": [212, 560, -6],
    name: [752, 566, -3],
    "clip-gold": [930, 548, -40],
    sketch: [510, 750, -9],
    "pencil-0": [300, 650, 38],
    "pencil-1": [236, 752, 30],
    "pencil-2": [176, 842, 24],
    tablet: [1030, 732, -16],
    pen: [930, 600, 152],
  },
}

const TALL: Layout = {
  w: 800,
  h: 1480,
  at: {
    "star-a": [84, 96, -8],
    todo: [252, 138, -6],
    "clip-red-a": [176, 114, 12],
    "clip-green": [420, 56, -32],
    "clip-violet": [120, 470, 64],
    glue: [470, 272, -18],
    "crayon-0": [570, 336, -14],
    "crayon-1": [626, 320, -4],
    "crayon-2": [684, 302, 12],
    "crayon-3": [772, 170, -38],
    polaroid: [660, 124, 8],
    shavings: [104, 352, 0],
    "shaving-a": [232, 360, -14],
    "shaving-b": [322, 382, 24],
    tag: [262, 452, -4],
    "tape-a": [126, 530, -38],
    "tape-b": [684, 674, -32],
    avatar: [640, 474, 8],
    title: [400, 604, -3],
    "star-b": [716, 780, 14],
    brushes: [652, 1404, -8],
    "sparkle-a": [742, 862, 0],
    "sparkle-b": [694, 894, 18],
    year: [168, 756, -3],
    "clip-red-b": [58, 770, -6],
    name: [466, 772, -3],
    "clip-gold": [606, 836, -40],
    sketch: [262, 1070, -7],
    "pencil-0": [404, 1336, -2],
    "pencil-1": [446, 1384, 3],
    "pencil-2": [380, 1432, -1],
    tablet: [720, 1130, -16],
    pen: [620, 956, 152],
  },
}

/* ------------------------------------------------------------ the marker hand
   Every word on the desk is felt-tip capitals, and a felt-tip hand is not a
   system font: the usual stacks resolve differently on every machine and to a
   serif on the headless box that renders the cover. So it is drawn —
   centre-line strokes on a baseline at y=0, cap height 62, set with a round
   pen. Lower case is set as capitals. */

type Pen = { w: number; d: string }

const CAPS: Record<string, Pen> = {
  A: { w: 40, d: "M1 0L23 -62L34 0M8 -20L30 -21" },
  B: { w: 42, d: "M13 -62C11 -42 9 -20 8 0M13 -62C27 -63 35 -57 34 -48C33 -39 25 -34 12 -34M12 -34C27 -35 36 -29 35 -19C34 -8 24 -1 8 0" },
  C: { w: 44, d: "M41 -52C36 -60 23 -64 15 -56C5 -46 5 -18 15 -7C22 0 34 -2 41 -9" },
  D: { w: 46, d: "M12 -62C10 -42 9 -20 8 0M12 -62C30 -63 41 -51 40 -32C39 -13 25 0 8 0" },
  E: { w: 38, d: "M36 -62L11 -62C10 -42 8 -20 8 0L34 -1M9 -33L28 -34" },
  F: { w: 36, d: "M36 -62L11 -62C10 -42 8 -20 8 0M9 -33L28 -34" },
  G: { w: 46, d: "M41 -52C36 -60 23 -64 15 -56C5 -46 5 -18 15 -7C24 1 38 -3 40 -14L41 -27L27 -26" },
  H: { w: 46, d: "M11 -62C10 -42 8 -20 8 0M40 -62C38 -42 37 -20 36 0M9 -33L38 -34" },
  I: { w: 22, d: "M16 -62C14 -42 12 -20 11 0" },
  J: { w: 30, d: "M24 -62C22 -40 20 -18 18 -8C16 1 8 5 2 0" },
  K: { w: 44, d: "M12 -62C10 -42 9 -20 8 0M39 -62L10 -32M17 -38L40 0" },
  L: { w: 36, d: "M13 -62C11 -42 9 -20 8 0L33 -1" },
  M: { w: 54, d: "M2 0L11 -62L27 -22L47 -62L45 0" },
  N: { w: 48, d: "M4 0L13 -62L36 -14L42 -62" },
  O: { w: 48, d: "M24 -63C13 -63 5 -50 5 -32C5 -14 13 -1 24 -1C35 -1 43 -14 43 -32C43 -50 35 -63 24 -63Z" },
  P: { w: 40, d: "M13 -62C11 -42 9 -20 8 0M13 -62C28 -63 37 -56 36 -45C35 -33 24 -27 10 -28" },
  Q: { w: 48, d: "M24 -63C13 -63 5 -50 5 -32C5 -14 13 -1 24 -1C35 -1 43 -14 43 -32C43 -50 35 -63 24 -63ZM30 -14L44 4" },
  R: { w: 42, d: "M13 -62C11 -42 9 -20 8 0M13 -62C28 -63 37 -56 36 -45C35 -34 25 -28 11 -29L38 0" },
  S: { w: 38, d: "M35 -54C30 -62 16 -64 10 -57C4 -49 9 -40 19 -35C29 -30 35 -22 30 -11C25 -1 11 1 3 -5" },
  T: { w: 40, d: "M3 -61L38 -62M22 -62C20 -42 18 -20 17 0" },
  U: { w: 46, d: "M11 -62C9 -42 7 -22 7 -14C7 -4 14 1 23 1C33 1 40 -5 41 -16L44 -62" },
  V: { w: 42, d: "M4 -62L20 0L39 -62" },
  W: { w: 58, d: "M3 -62L13 0L28 -44L34 0L54 -62" },
  X: { w: 42, d: "M5 -62L36 0M39 -62L3 0" },
  Y: { w: 40, d: "M5 -62L21 -30L19 0M21 -30L38 -62" },
  Z: { w: 40, d: "M5 -61L35 -62L4 -1L36 -2" },
  "0": { w: 36, d: "M18 -62C10 -62 5 -49 5 -31C5 -13 10 -1 18 -1C26 -1 31 -13 31 -31C31 -49 26 -62 18 -62Z" },
  "1": { w: 26, d: "M6 -52L17 -62C15 -42 13 -20 12 0" },
  "2": { w: 34, d: "M6 -52C10 -60 20 -64 26 -59C33 -54 31 -44 24 -36L4 -1L31 -2" },
  "3": { w: 34, d: "M7 -55C12 -62 24 -63 28 -57C32 -51 27 -43 17 -41C28 -42 34 -35 32 -24C30 -11 16 -5 5 -11" },
  "4": { w: 36, d: "M27 -62L4 -20L33 -21M24 -36L22 0" },
  "5": { w: 34, d: "M31 -61L11 -61L7 -38C14 -43 25 -41 29 -33C33 -24 29 -10 19 -6C13 -4 8 -5 4 -9" },
  "6": { w: 34, d: "M29 -57C22 -63 12 -59 8 -48C4 -37 4 -18 9 -8C13 -1 23 -1 27 -8C31 -15 29 -26 21 -28C15 -30 10 -26 8 -20" },
  "7": { w: 32, d: "M4 -61L31 -62L13 0" },
  "8": { w: 34, d: "M18 -62C11 -62 7 -56 8 -49C10 -38 30 -35 31 -20C32 -9 25 -2 17 -2C9 -2 3 -9 4 -19C5 -34 27 -37 28 -50C29 -57 24 -62 18 -62Z" },
  "9": { w: 34, d: "M6 -6C13 0 23 -4 27 -15C31 -26 31 -45 26 -55C22 -62 12 -62 8 -55C4 -48 6 -37 14 -35C20 -33 25 -37 27 -43" },
  ",": { w: 14, d: "M7 -2C9 2 8 8 3 12" },
  ".": { w: 12, d: "M6 -2L7 0" },
  "'": { w: 12, d: "M8 -50C7 -44 6 -40 5 -37" },
  "!": { w: 16, d: "M11 -62L8 -16M6 -2L7 0" },
  "?": { w: 30, d: "M5 -52C9 -60 19 -64 25 -59C32 -53 28 -44 20 -38C16 -35 15 -30 15 -24M13 -2L14 0" },
  "-": { w: 26, d: "M4 -20L22 -21" },
  ":": { w: 14, d: "M8 -26L8 -24M6 -2L7 0" },
  ";": { w: 14, d: "M9 -26L9 -24M7 -2C9 2 8 8 3 12" },
  "&": { w: 44, d: "M40 0C28 -6 12 -20 10 -34C9 -43 14 -50 21 -49C27 -48 29 -42 26 -36C21 -26 6 -20 5 -10C4 -2 12 3 20 0C27 -3 32 -9 34 -16" },
  "/": { w: 28, d: "M26 -64L4 4" },
  "(": { w: 20, d: "M16 -64C8 -50 6 -30 8 -12C9 -4 11 0 14 4" },
  ")": { w: 20, d: "M6 -64C14 -50 16 -30 14 -12C13 -4 11 0 8 4" },
  " ": { w: 20, d: "" },
}

/** Repeatable wobble, so the same line is uneven the same way on every paint. */
const wobble = (n: number) => {
  const v = Math.sin(n * 12.9898 + 4.233) * 43758.5453
  return (v - Math.floor(v)) * 2 - 1
}

const glyphOf = (ch: string) => CAPS[ch.toUpperCase()] ?? CAPS[" "]

/** Advance of `text` at cap height 62. */
const measure = (text: string) => Array.from(text).reduce((s, ch) => s + glyphOf(ch).w, 0)

type HandOpts = {
  /** Cap height in board pixels. */
  cap: number
  /** Shrinks the line to fit this width, never grows it. */
  maxW?: number
  /** Stroke width in board pixels. */
  width?: number
  color?: string
  /** "start" sets from x; "middle" centres on it. */
  anchor?: "start" | "middle"
  seed?: number
  skew?: number
  /** Each glyph draws itself on, one after another. */
  draw?: boolean
}

/** Sets `text` in the marker hand with its baseline at (x, y). */
function hand(text: string, x: number, y: number, o: HandOpts) {
  const total = measure(text)
  const s = Math.min(o.cap / 62, o.maxW ? o.maxW / Math.max(total, 1) : Infinity)
  const left = o.anchor === "middle" ? x - (total * s) / 2 : x
  const paths: React.ReactNode[] = []
  let pen = 0
  let i = 0
  for (const ch of Array.from(text)) {
    const g = glyphOf(ch)
    if (g.d) {
      const seed = (o.seed ?? 0) * 7.7
      paths.push(
        <path
          key={i}
          d={g.d}
          transform={"translate(" + pen + " " + (wobble(i + seed) * 1.6).toFixed(2) + ") rotate(" + (wobble(i + seed + 40) * 1.6).toFixed(2) + ")"}
          pathLength={o.draw ? 1 : undefined}
          className={o.draw ? "cdp-ink" : undefined}
          style={o.draw ? { animationDelay: (0.25 + i * 0.11).toFixed(2) + "s" } : undefined}
        />,
      )
    }
    pen += g.w
    i++
  }
  return (
    <g
      transform={"translate(" + left.toFixed(1) + " " + y + ") scale(" + s.toFixed(4) + ") skewX(" + (o.skew ?? -6) + ")"}
      fill="none"
      stroke={o.color ?? INK}
      strokeWidth={(o.width ?? 3) / s}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths}
    </g>
  )
}

/* ---------------------------------------------------------------- shapes */

/**
 * A polygon with every edge torn: points jittered along each side at two
 * scales — a slow wander for the big tears and a fast one for the fibres.
 */
function ragged(pts: number[][], amp: number, seed: number, step = 8) {
  let d = ""
  let k = 0
  for (let i = 0; i < pts.length; i++) {
    const [x0, y0] = pts[i]
    const [x1, y1] = pts[(i + 1) % pts.length]
    const len = Math.hypot(x1 - x0, y1 - y0)
    const n = Math.max(1, Math.round(len / step))
    const nx = -(y1 - y0) / len
    const ny = (x1 - x0) / len
    for (let j = 0; j < n; j++) {
      const t = j / n
      const w = j === 0 ? 0 : wobble(k + seed * 9.1) * amp * 0.5 + wobble(Math.floor(k / 5) + seed * 5.7 + 100) * amp
      d += (d ? "L" : "M") + (x0 + (x1 - x0) * t + nx * w).toFixed(1) + " " + (y0 + (y1 - y0) * t + ny * w).toFixed(1)
      k++
    }
  }
  return d + "Z"
}

const rectPts = (x: number, y: number, w: number, h: number) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]]

/** A smooth closed blob through `n` wobbling radii — glue, shadows, puddles. */
function blob(rx: number, ry: number, seed: number, n = 9, amp = 0.18) {
  const pts: number[][] = []
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    const k = 1 + wobble(i + seed * 3.3) * amp
    pts.push([Math.cos(a) * rx * k, Math.sin(a) * ry * k])
  }
  let d = ""
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n]
    const p1 = pts[i]
    const p2 = pts[(i + 1) % n]
    const p3 = pts[(i + 2) % n]
    if (i === 0) d += "M" + p1[0].toFixed(1) + " " + p1[1].toFixed(1)
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += "C" + c1.map((v) => v.toFixed(1)).join(" ") + " " + c2.map((v) => v.toFixed(1)).join(" ") + " " + p2.map((v) => v.toFixed(1)).join(" ")
  }
  return d + "Z"
}

/** A five-point star round its centre. */
function starPath(R: number, inner = 0.5) {
  let d = ""
  for (let i = 0; i < 10; i++) {
    const a = ((-90 + i * 36) * Math.PI) / 180
    const r = i % 2 ? R * inner : R
    d += (i ? "L" : "M") + (Math.cos(a) * r).toFixed(1) + " " + (Math.sin(a) * r).toFixed(1)
  }
  return d + "Z"
}

/** A four-point twinkle. */
const sparklePath = (R: number) => {
  const q = R * 0.16
  return "M0 " + -R + "Q" + q + " " + -q + " " + R + " 0Q" + q + " " + q + " 0 " + R + "Q" + -q + " " + q + " " + -R + " 0Q" + -q + " " + -q + " 0 " + -R + "Z"
}

/** A paper clip, centred on its origin: inner loop, top loop, outer loop. */
const clipD = (h: number) =>
  "M11 " + h * 0.34 + "V" + (h - 10) + "A3 3 0 0 1 5 " + (h - 10) + "V6A5.5 5.5 0 0 1 16 6V" + (h - 8) + "A8 8 0 0 1 0 " + (h - 8) + "V" + h * 0.2

/** Doodle points → a smooth path through their midpoints. */
function strokeD(p: number[]) {
  if (p.length < 4) return p.length === 2 ? "M" + p[0] + " " + p[1] + "l0.1 0" : ""
  let d = "M" + p[0] + " " + p[1]
  for (let i = 2; i < p.length - 2; i += 2) {
    const mx = ((p[i] + p[i + 2]) / 2).toFixed(1)
    const my = ((p[i + 1] + p[i + 3]) / 2).toFixed(1)
    d += "Q" + p[i] + " " + p[i + 1] + " " + mx + " " + my
  }
  return d + "L" + p[p.length - 2] + " " + p[p.length - 1]
}

/* ------------------------------------------------------------------- style */

const CSS = `
.cdp-root{position:relative;width:100%;overflow:hidden;isolation:isolate;background-color:var(--cdp-mat);color:#1d1b18;-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent}
.cdp-mat{position:absolute;inset:0;z-index:0;pointer-events:none;background-image:linear-gradient(rgba(255,255,255,.42) 1.5px,transparent 1.5px),linear-gradient(90deg,rgba(255,255,255,.42) 1.5px,transparent 1.5px),linear-gradient(rgba(255,255,255,.16) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.16) 1px,transparent 1px);background-size:40px 40px,40px 40px,10px 10px,10px 10px;background-position:-1px -1px}
.cdp-mat::after{content:"";position:absolute;inset:0;background:radial-gradient(120% 90% at 50% 45%,transparent 55%,rgba(0,20,8,.38) 100%)}
.cdp-board{position:absolute;inset:0;z-index:1;display:block;width:100%;height:100%;overflow:visible}
.cdp-light{position:absolute;inset:-20%;z-index:2;pointer-events:none;mix-blend-mode:soft-light;opacity:.95;transition:opacity .6s ease;background:linear-gradient(118deg,transparent 30%,rgba(255,246,196,.95) 33%,rgba(255,246,196,.95) 44%,transparent 47%,transparent 55%,rgba(255,246,196,.8) 58%,rgba(255,246,196,.8) 66%,transparent 69%);transform:translate3d(calc(var(--cdp-lx,0) * 3%),calc(var(--cdp-ly,0) * 2%),0);animation:cdp-sway 14s ease-in-out infinite alternate}
.cdp-shade{position:absolute;inset:0;z-index:2;pointer-events:none;background:radial-gradient(60% 55% at 100% 100%,rgba(0,0,0,.34),transparent 70%);transition:opacity .6s ease}
.cdp-root[data-lamp="off"] .cdp-light{opacity:0}
.cdp-root[data-lamp="off"] .cdp-shade{opacity:1.6}
.cdp-piece{cursor:grab;touch-action:none;outline:none}
.cdp-piece[data-held]{cursor:grabbing}
.cdp-lift{transform-box:fill-box;transform-origin:center;transition:transform .22s cubic-bezier(.3,1.5,.5,1)}
.cdp-piece:hover>.cdp-lift{transform:scale(1.025) rotate(-.6deg)}
.cdp-piece[data-held]>.cdp-lift{transform:scale(1.06) rotate(-1.4deg);transition-duration:.12s}
.cdp-piece:focus-visible>.cdp-lift{transform:scale(1.03)}
.cdp-piece:focus-visible{outline:3px dashed #fff;outline-offset:6px}
.cdp-row{cursor:pointer;outline:none}
.cdp-row:focus-visible .cdp-rowring{opacity:1}
.cdp-rowring{opacity:0;fill:none;stroke:#d8392f;stroke-width:2;stroke-dasharray:5 4}
.cdp-check{stroke-dasharray:1 2;stroke-dashoffset:1;transition:stroke-dashoffset .35s ease}
.cdp-row[data-done] .cdp-check{stroke-dashoffset:0}
.cdp-page{cursor:crosshair}
.cdp-ink{stroke-dasharray:1 2;stroke-dashoffset:1;animation:cdp-draw .42s cubic-bezier(.5,0,.3,1) forwards}
.cdp-spin{transform-box:fill-box;transform-origin:center;animation:cdp-spin .9s cubic-bezier(.3,1.4,.5,1)}
.cdp-twinkle{transform-box:fill-box;transform-origin:center;animation:cdp-twinkle 2.6s ease-in-out infinite}
.cdp-squish{transform-box:fill-box;transform-origin:50% 100%;animation:cdp-squish .45s ease}
.cdp-puddle{transform-box:fill-box;transform-origin:center;transition:transform .5s cubic-bezier(.3,1.6,.5,1)}
.cdp-develop{animation:cdp-develop 2.8s ease forwards}
.cdp-wink{transform-box:fill-box;transform-origin:center;animation:cdp-pop .4s cubic-bezier(.3,1.6,.5,1)}
.cdp-crayon{transform-box:fill-box;transform-origin:50% 100%;transition:transform .25s cubic-bezier(.3,1.5,.5,1)}
.cdp-crayon[data-on]{transform:translateY(-10px)}
.cdp-key{cursor:pointer}
.cdp-key:active{transform-box:fill-box;transform-origin:center;transform:scale(.9)}
.cdp-ui{position:absolute;z-index:3;left:16px;bottom:16px;display:flex;gap:10px;align-items:center;font:600 12px/1 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;letter-spacing:.08em;text-transform:uppercase}
.cdp-hint{padding:8px 11px;background:rgba(247,242,228,.92);color:#1d1b18;border:2px solid #1d1b18;border-radius:3px;box-shadow:3px 3px 0 rgba(0,0,0,.35);transform:rotate(-1.5deg);transition:opacity .5s ease}
.cdp-hint[data-gone]{opacity:0;position:absolute}
.cdp-tidy{appearance:none;cursor:pointer;padding:8px 12px;background:#f5c842;color:#1d1b18;border:2px solid #1d1b18;border-radius:3px;box-shadow:3px 3px 0 rgba(0,0,0,.35);font:inherit;letter-spacing:inherit;text-transform:inherit;transform:rotate(1.5deg);transition:transform .15s ease,box-shadow .15s ease}
.cdp-tidy:hover{transform:rotate(0deg) translateY(-1px);box-shadow:4px 5px 0 rgba(0,0,0,.35)}
.cdp-tidy:focus-visible{outline:3px solid #fff;outline-offset:2px}
.cdp-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
@keyframes cdp-draw{to{stroke-dashoffset:0}}
@keyframes cdp-sway{from{background-position:0 0}to{background-position:6% 3%}}
@keyframes cdp-spin{from{transform:rotate(0deg) scale(1)}50%{transform:rotate(200deg) scale(1.25)}to{transform:rotate(360deg) scale(1)}}
@keyframes cdp-twinkle{0%,100%{transform:scale(1) rotate(0deg);opacity:1}50%{transform:scale(.72) rotate(20deg);opacity:.7}}
@keyframes cdp-squish{0%,100%{transform:scale(1,1)}35%{transform:scale(1.08,.9)}70%{transform:scale(.96,1.04)}}
@keyframes cdp-develop{from{opacity:1}to{opacity:0}}
@keyframes cdp-pop{from{transform:scale(.6)}to{transform:scale(1)}}
@media (prefers-reduced-motion:reduce){
.cdp-light,.cdp-twinkle,.cdp-spin,.cdp-squish,.cdp-wink{animation:none}
.cdp-ink{animation:none;stroke-dashoffset:0}
.cdp-develop{animation-duration:.01s}
.cdp-lift,.cdp-check,.cdp-puddle,.cdp-crayon,.cdp-hint,.cdp-tidy{transition:none}
}
`

/* ------------------------------------------------------------------ defaults */

const TODOS: DeskTodo[] = [{ text: "Sketch ideas", done: true }, "Ink & colour", "Build it", "Ship it!"]
const CRAYONS = ["#e0392e", "#f28a22", "#2f8f47", "#2f63c9"]
const NUDGE = 12

type Doodle = { c: string; p: number[] }
type Drag =
  | { kind: "piece"; id: PieceId; x0: number; y0: number; base: [number, number]; k: number; moved: boolean; target: Element }
  | { kind: "draw"; page: SVGGraphicsElement }

/* ---------------------------------------------------------------- component */

export default function CraftDeskPortfolioHero({
  height = "100svh",
  minHeight = "560px",
  title = "Portfolio",
  name = "Kedhareswer Naidu",
  nameHref,
  tag = "Design",
  year = "2026",
  todoTitle = "To-do list",
  todos = TODOS,
  avatar,
  photo,
  matColor = "#2f9a57",
  crayons = CRAYONS,
  onPieceTap,
  className = "",
}: CraftDeskPortfolioHeroProps) {
  const uid = "cdp" + React.useId().replace(/[^a-zA-Z0-9]/g, "")
  const id = (n: string) => uid + "-" + n
  const u = (n: string) => "url(#" + uid + "-" + n + ")"

  const rootRef = React.useRef<HTMLElement>(null)
  const svgRef = React.useRef<SVGSVGElement>(null)
  const drag = React.useRef<Drag | null>(null)

  const [tall, setTall] = React.useState(false)
  const [offsets, setOffsets] = React.useState<Partial<Record<PieceId, [number, number]>>>({})
  const [order, setOrder] = React.useState<PieceId[]>(() => [...PIECES])
  const [held, setHeld] = React.useState<PieceId | null>(null)
  const [done, setDone] = React.useState<boolean[]>(() => todos.map((t) => typeof t !== "string" && !!t.done))
  const [ink, setInk] = React.useState(0)
  const [doodles, setDoodles] = React.useState<Doodle[]>([])
  const [glue, setGlue] = React.useState(0)
  const [lamp, setLamp] = React.useState(true)
  const [wink, setWink] = React.useState(false)
  const [spin, setSpin] = React.useState<Record<string, number>>({})
  const [replay, setReplay] = React.useState(0)
  const [touched, setTouched] = React.useState(false)

  const layout = tall ? TALL : WIDE
  const palette = crayons.length >= 4 ? crayons : CRAYONS
  const rows = todos.slice(0, 4).map((t) => (typeof t === "string" ? t : t.text))

  // Keep the ticks in step if the list itself changes — by content, so an
  // inline array literal does not wipe them on every render.
  const todoKey = JSON.stringify(todos)
  React.useEffect(() => {
    setDone(todos.map((t) => typeof t !== "string" && !!t.done))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todoKey])

  // A tall box gets the tall desk. Measured, not media-queried: the hero is
  // rarely the full viewport.
  React.useEffect(() => {
    const el = rootRef.current
    if (!el || typeof ResizeObserver === "undefined") return
    const ro = new ResizeObserver(([e]) => {
      const r = e.contentRect
      if (r.width > 0 && r.height > 0) setTall(r.width / r.height < 0.9)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const raise = (pid: PieceId) => setOrder((o) => (o[o.length - 1] === pid ? o : [...o.filter((x) => x !== pid), pid]))

  const act = (what: string, pid: PieceId) => {
    setTouched(true)
    const [kind, arg] = what.split(":")
    if (kind === "todo") {
      const i = Number(arg)
      setDone((d) => rows.map((_, j) => (j === i ? !d[j] : !!d[j])))
    } else if (kind === "crayon") setInk(Number(arg))
    else if (kind === "glue") setGlue((g) => (g >= 5 ? 0 : g + 1))
    else if (kind === "lamp") setLamp((l) => !l)
    else if (kind === "avatar") setWink((w) => !w)
    else if (kind === "eraser") setDoodles([])
    else if (kind === "title") setReplay((r) => r + 1)
    else if (kind === "spin" || kind === "polaroid") setSpin((s) => ({ ...s, [pid]: (s[pid] ?? 0) + 1 }))
    else if (kind === "name" && nameHref) window.open(nameHref, "_blank", "noopener,noreferrer")
    onPieceTap?.(pid)
  }

  /* ---- pointer: drag a piece, tap a piece, or draw on the sketchbook ---- */

  const toPage = (page: SVGGraphicsElement, e: React.PointerEvent) => {
    const m = page.getScreenCTM()
    if (!m) return null
    const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse())
    return [Math.round(pt.x * 10) / 10, Math.round(pt.y * 10) / 10]
  }

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.button !== 0 && e.pointerType === "mouse") return
    const svg = svgRef.current
    const target = e.target as Element
    const piece = target.closest("[data-piece]")
    if (!svg || !piece) return
    const pid = piece.getAttribute("data-piece") as PieceId
    const page = target.closest("[data-draw]") as SVGGraphicsElement | null
    raise(pid)
    setTouched(true)
    svg.setPointerCapture(e.pointerId)
    if (page) {
      const pt = toPage(page, e)
      if (!pt) return
      drag.current = { kind: "draw", page }
      setDoodles((d) => [...d.slice(-80), { c: palette[ink], p: pt }])
      return
    }
    drag.current = {
      kind: "piece",
      id: pid,
      x0: e.clientX,
      y0: e.clientY,
      base: offsets[pid] ?? [0, 0],
      k: svg.getScreenCTM()?.a || 1,
      moved: false,
      target,
    }
  }

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    // The light leans toward the pointer; written straight to the element, no render.
    const root = rootRef.current
    if (root && e.pointerType === "mouse") {
      const r = root.getBoundingClientRect()
      root.style.setProperty("--cdp-lx", ((e.clientX - r.left) / r.width - 0.5).toFixed(3))
      root.style.setProperty("--cdp-ly", ((e.clientY - r.top) / r.height - 0.5).toFixed(3))
    }
    const d = drag.current
    if (!d) return
    if (d.kind === "draw") {
      const pt = toPage(d.page, e)
      if (!pt) return
      setDoodles((all) => {
        if (!all.length) return all
        const last = all[all.length - 1]
        const p = last.p
        if (Math.hypot(pt[0] - p[p.length - 2], pt[1] - p[p.length - 1]) < 2) return all
        return [...all.slice(0, -1), { c: last.c, p: [...p, pt[0], pt[1]] }]
      })
      return
    }
    const dx = e.clientX - d.x0
    const dy = e.clientY - d.y0
    if (!d.moved && Math.hypot(dx, dy) < 5) return
    if (!d.moved) {
      d.moved = true
      setHeld(d.id)
    }
    setOffsets((o) => ({ ...o, [d.id]: [d.base[0] + dx / d.k, d.base[1] + dy / d.k] }))
  }

  const onPointerUp = () => {
    const d = drag.current
    drag.current = null
    setHeld(null)
    if (!d || d.kind !== "piece" || d.moved) return
    const tap = d.target.closest("[data-tap]")?.getAttribute("data-tap")
    if (tap) act(tap, d.id)
    else onPieceTap?.(d.id)
  }

  const onKey = (pid: PieceId, primary: string | undefined) => (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? NUDGE * 4 : NUDGE
    const move = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key]
    if (move) {
      e.preventDefault()
      setTouched(true)
      raise(pid)
      setOffsets((o) => {
        const b = o[pid] ?? [0, 0]
        return { ...o, [pid]: [b[0] + move[0], b[1] + move[1]] }
      })
    } else if ((e.key === "Enter" || e.key === " ") && primary) {
      e.preventDefault()
      act(primary, pid)
    }
  }

  const tidy = () => {
    setOffsets({})
    setOrder([...PIECES])
    setDoodles([])
    setGlue(0)
  }
  const messy = Object.keys(offsets).length > 0 || doodles.length > 0 || glue > 0

  /* ----------------------------------------------------------- the pieces */

  const outline = { stroke: INK, strokeWidth: 3, strokeLinejoin: "round" as const, strokeLinecap: "round" as const }

  const star = (R: number, face: boolean, pid: PieceId) => (
    <g key={spin[pid] ?? 0} className={spin[pid] ? "cdp-spin" : undefined} data-tap="spin">
      <path d={starPath(R)} fill={STAR} {...outline} strokeWidth={R > 50 ? 3.4 : 2.8} />
      <path d={starPath(R * 0.72)} fill={STAR_LIGHT} transform={"translate(" + -R * 0.08 + " " + -R * 0.1 + ")"} opacity="0.7" />
      <path d={starPath(R)} fill="none" stroke="#d99a1c" strokeWidth={R * 0.07} transform={"translate(" + R * 0.03 + " " + R * 0.05 + ") scale(0.93)"} opacity="0.55" />
      {face ? (
        <g>
          <ellipse cx={-R * 0.17} cy={-R * 0.04} rx={R * 0.045} ry={R * 0.075} fill={INK} />
          <ellipse cx={R * 0.17} cy={-R * 0.04} rx={R * 0.045} ry={R * 0.075} fill={INK} />
          <ellipse cx={-R * 0.3} cy={R * 0.1} rx={R * 0.08} ry={R * 0.045} fill="#f08a7c" opacity="0.8" />
          <ellipse cx={R * 0.3} cy={R * 0.1} rx={R * 0.08} ry={R * 0.045} fill="#f08a7c" opacity="0.8" />
          <path d={"M" + -R * 0.08 + " " + R * 0.08 + "Q0 " + R * 0.16 + " " + R * 0.08 + " " + R * 0.08} fill="none" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
        </g>
      ) : null}
    </g>
  )

  const sparkle = (R: number) => (
    <g className="cdp-twinkle">
      <path d={sparklePath(R)} fill={STAR} {...outline} strokeWidth="2.4" />
    </g>
  )

  const clip = (colour: string, light: string, h = 66) => (
    <g transform={"translate(-8 " + -h / 2 + ")"} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={clipD(h)} stroke={INK} strokeWidth="5.4" />
      <path d={clipD(h)} stroke={colour} strokeWidth="3" />
      <path d={clipD(h)} stroke={light} strokeWidth="1" transform="translate(-0.6 -0.6)" opacity="0.9" />
    </g>
  )

  const tapeLabel = (text: string, fill: string, textColour: string, w: number, seed: number) => (
    <g>
      <path d={ragged(rectPts(-w / 2, -20, w, 40), 1.6, seed, 5)} fill={fill} {...outline} strokeWidth="2.6" />
      <path d={"M" + (-w / 2 + 6) + " -14H" + (w / 2 - 6)} stroke="#fff" strokeWidth="2" opacity="0.35" strokeLinecap="round" />
      {hand(text, 0, 10, { cap: 22, maxW: w - 30, width: 3.2, color: textColour, anchor: "middle", seed })}
    </g>
  )

  const washi = (w: number, seed: number) => (
    <path d={ragged(rectPts(-w / 2, -17, w, 34), 1.4, seed, 4)} fill="#e9e6d7" opacity="0.72" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="1" />
  )

  const crayon = (i: number) => {
    const c = palette[i]
    const on = ink === i
    return (
      <g className="cdp-crayon" data-on={on ? "" : undefined} data-tap={"crayon:" + i}>
        {on ? <rect x="-20" y="-197" width="40" height="204" rx="14" fill="#fff" opacity="0.55" /> : null}
        <path d="M-13 -30L13 -30L5 -5Q0 2 -5 -5Z" fill={c} {...outline} strokeWidth="2.6" />
        <rect x="-13" y="-190" width="26" height="160" rx="3" fill={c} {...outline} strokeWidth="2.8" />
        <rect x="-13" y="-150" width="26" height="92" fill="#000" opacity="0.14" />
        <path d="M-13 -150l6.5 -5 6.5 5 6.5 -5 6.5 5M-13 -58l6.5 5 6.5 -5 6.5 5 6.5 -5" fill="none" stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
        <g transform="rotate(-90)">{hand("Crayon", 104, 5, { cap: 10, width: 1.8, color: "#fff", anchor: "middle", seed: i })}</g>
        <rect x="-8" y="-186" width="4" height="150" rx="2" fill="#fff" opacity="0.28" />
      </g>
    )
  }

  const pencil = (i: number) => (
    <g>
      <path d="M-316 -12H-46V12H-316Z" fill={BLUE} {...outline} strokeWidth="2.8" />
      <path d="M-316 -4H-46" stroke="#5c86e6" strokeWidth="5" />
      <path d="M-316 6H-46" stroke={BLUE_DARK} strokeWidth="4" />
      <path d="M-316 -12H-300V12H-316Z" fill="#1d3a82" {...outline} strokeWidth="2.4" />
      <path d="M-46 -12L-10 -3.5V3.5L-46 12Z" fill={WOOD} {...outline} strokeWidth="2.6" />
      <path d="M-10 -3.5L0 0L-10 3.5Z" fill="#35322e" {...outline} strokeWidth="2" />
      {hand(["2B", "HB", "4B"][i % 3], -250, 5, { cap: 11, width: 1.8, color: "#fff", seed: i })}
    </g>
  )

  const glueBottle = (
    <g>
      <g className="cdp-puddle" style={{ transform: "scale(" + (1 + glue * 0.16) + ")" }}>
        <path d={blob(64, 26, 3, 11, 0.16)} fill="#fbfbf7" {...outline} strokeWidth="2.8" />
        <path d={blob(30, 9, 8)} transform="translate(-14 -6)" fill="#fff" />
        <ellipse cx="18" cy="-4" rx="8" ry="3.5" fill="#dfe3ea" />
      </g>
      <g key={"g" + glue} className={glue ? "cdp-squish" : undefined} data-tap="glue">
        <path d="M-5 -16Q0 -8 5 -16" fill="#fbfbf7" {...outline} strokeWidth="2.4" />
        <path d="M-17 -64L17 -64L5 -18Q0 -12 -5 -18Z" fill="#2d5fc4" {...outline} strokeWidth="2.8" />
        <path d="M-8 -60L-2 -22" stroke="#7fa2ea" strokeWidth="3" strokeLinecap="round" />
        <rect x="-25" y="-80" width="50" height="18" rx="4" fill="#244fa6" {...outline} strokeWidth="2.8" />
        <path d="M-38 -84C-38 -96 -30 -100 -24 -100H24C30 -100 38 -96 38 -84Z" fill="#f4f4ef" {...outline} strokeWidth="2.8" />
        <rect x="-42" y="-236" width="84" height="142" rx="16" fill="#f4f4ef" {...outline} strokeWidth="3" />
        <rect x="22" y="-228" width="14" height="126" rx="7" fill="#d6d8d6" opacity="0.8" />
        <rect x="-32" y="-226" width="7" height="120" rx="3.5" fill="#fff" />
        <rect x="-42" y="-200" width="84" height="74" fill="#f39a2b" {...outline} strokeWidth="2.6" />
        <g transform="rotate(-90)">{hand("Glue", 163, 9, { cap: 24, width: 3.4, color: "#fff", anchor: "middle", seed: 2 })}</g>
      </g>
    </g>
  )

  const polaroid = (
    <g data-tap="polaroid">
      <rect x="-104" y="-118" width="208" height="236" rx="4" fill="#fbfaf5" {...outline} />
      <clipPath id={id("snap")}>
        <rect x="-90" y="-104" width="180" height="176" />
      </clipPath>
      <g clipPath={u("snap")}>
        {photo ? (
          <image href={photo} x="-90" y="-104" width="180" height="176" preserveAspectRatio="xMidYMid slice" style={{ maxWidth: "none" }} />
        ) : (
          <g>
            <rect x="-90" y="-104" width="180" height="176" fill={u("sky")} />
            <circle cx="30" cy="0" r="30" fill="#ffe8a3" opacity="0.9" />
            <path d="M-90 12C-40 4 20 8 90 2V72H-90Z" fill="#2c6d8f" />
            <path d="M-90 26C-30 18 30 24 90 16V72H-90Z" fill="#1f5474" />
            <path d="M-40 18H10M20 30H60M-70 40H-20M0 48H70" stroke="#ffd79a" strokeWidth="2.4" strokeLinecap="round" opacity="0.8" />
            <path d="M-54 -58q6 -6 12 0q6 -6 12 0M-12 -74q5 -5 10 0q5 -5 10 0M-66 -30q4 -4 8 0q4 -4 8 0" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" />
          </g>
        )}
        <rect key={spin.polaroid ?? 0} x="-90" y="-104" width="180" height="176" fill="#e9e1cf" className="cdp-develop" />
      </g>
      <rect x="-90" y="-104" width="180" height="176" fill="none" stroke={INK} strokeWidth="2" />
      <path d="M-70 94C-50 90 -30 98 -10 92S20 96 30 93" fill="none" stroke="#3b3a36" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M58 88c-4 -7 -14 -4 -10 4l10 10 10 -10c4 -8 -6 -11 -10 -4z" fill="none" stroke="#d8392f" strokeWidth="2.4" strokeLinejoin="round" />
    </g>
  )

  const shavings = (
    <g>
      <path
        d={Array.from({ length: 18 }, (_, i) => {
          const a0 = (i / 18) * Math.PI * 2
          const a1 = ((i + 1) / 18) * Math.PI * 2
          const r = 62
          return (i ? "" : "M" + (Math.cos(a0) * r).toFixed(1) + " " + (Math.sin(a0) * r).toFixed(1)) +
            "A11 11 0 0 1 " + (Math.cos(a1) * r).toFixed(1) + " " + (Math.sin(a1) * r).toFixed(1)
        }).join("") + "Z"}
        fill={BLUE}
        {...outline}
      />
      <circle r="47" fill={WOOD} {...outline} strokeWidth="2.6" />
      {Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2
        return <path key={i} d={"M" + (Math.cos(a) * 20).toFixed(1) + " " + (Math.sin(a) * 20).toFixed(1) + "L" + (Math.cos(a) * 44).toFixed(1) + " " + (Math.sin(a) * 44).toFixed(1)} stroke="#c9975a" strokeWidth="1.4" />
      })}
      <circle r="20" fill="#f2d4a6" {...outline} strokeWidth="2" />
      <path d={starPath(15)} fill={BLUE_DARK} {...outline} strokeWidth="2" />
    </g>
  )

  const shavingWedge = (seed: number) => (
    <g>
      <path d="M0 0L-30 -64A70 70 0 0 1 30 -64Z" fill={WOOD} {...outline} strokeWidth="2.6" />
      <path d="M-30 -64A70 70 0 0 1 30 -64L26 -54A58 58 0 0 0 -26 -54Z" fill={BLUE} {...outline} strokeWidth="2.2" />
      <path d="M0 -4L-10 -52M0 -4L0 -54M0 -4L10 -52" stroke="#c9975a" strokeWidth="1.3" />
      {Array.from({ length: 7 }, (_, i) => (
        <circle key={i} cx={(wobble(i + seed) * 48).toFixed(1)} cy={(10 + Math.abs(wobble(i + seed + 9)) * 30).toFixed(1)} r={1.5 + Math.abs(wobble(i + seed + 3)) * 2} fill="#2a2724" opacity="0.75" />
      ))}
    </g>
  )

  const avatarArt = () => {
    const silhouette = (
      <>
        <path d="M-72 30C-86 -58 -40 -100 4 -100C62 -100 88 -58 78 32C75 52 62 62 50 64L-56 64C-70 56 -74 44 -72 30Z" />
        <ellipse cx="0" cy="8" rx="55" ry="52" />
        <rect x="46" y="4" width="13" height="42" rx="6.5" transform="rotate(-14 52 25)" />
        <rect x="62" y="8" width="13" height="40" rx="6.5" transform="rotate(12 68 28)" />
        <ellipse cx="62" cy="58" rx="20" ry="17" />
      </>
    )
    if (avatar) {
      return (
        <g data-tap="avatar">
          <circle r="78" fill="#fff" stroke={INK} strokeWidth="3" />
          <clipPath id={id("face")}>
            <circle r="66" />
          </clipPath>
          <image href={avatar} x="-66" y="-66" width="132" height="132" preserveAspectRatio="xMidYMid slice" clipPath={u("face")} style={{ maxWidth: "none" }} />
          <circle r="66" fill="none" stroke={INK} strokeWidth="2" />
        </g>
      )
    }
    return (
      <g data-tap="avatar">
        {/* the die-cut: an ink rim, then the white sticker margin, then the art */}
        <g fill={INK} stroke={INK} strokeWidth="26" strokeLinejoin="round">{silhouette}</g>
        <g fill="#fff" stroke="#fff" strokeWidth="20" strokeLinejoin="round">{silhouette}</g>
        <path d="M-72 30C-86 -58 -40 -100 4 -100C62 -100 88 -58 78 32C75 52 62 62 50 64L-56 64C-70 56 -74 44 -72 30Z" fill="#1b1a1a" {...outline} />
        <path d="M-46 -60C-30 -80 20 -86 44 -62" fill="none" stroke="#4a4a4f" strokeWidth="4" strokeLinecap="round" />
        <ellipse cx="0" cy="8" rx="55" ry="52" fill={SKIN} {...outline} />
        <path d="M-58 -2C-54 -62 44 -74 60 -6C46 -30 24 -36 8 -22C-4 -38 -32 -36 -58 -2Z" fill="#1b1a1a" {...outline} />
        <g key={wink ? "w" : "h"} className="cdp-wink">
          {wink ? (
            <>
              <ellipse cx="-20" cy="8" rx="6" ry="8" fill={INK} />
              <circle cx="-18" cy="5" r="2.2" fill="#fff" />
              <path d="M12 8L26 3M12 8L26 13" fill="none" stroke={INK} strokeWidth="3.6" strokeLinecap="round" />
            </>
          ) : (
            <path d="M-30 10Q-20 -1 -10 10M10 10Q20 -1 30 10" fill="none" stroke={INK} strokeWidth="3.6" strokeLinecap="round" />
          )}
        </g>
        <ellipse cx="-36" cy="26" rx="10" ry="6" fill="#f2998f" opacity="0.75" />
        <ellipse cx="36" cy="26" rx="10" ry="6" fill="#f2998f" opacity="0.75" />
        <path d="M-16 28Q0 50 16 28Z" fill="#c8453b" {...outline} strokeWidth="2.6" />
        <path d="M-8 38Q0 44 8 38" fill="#f08b7f" />
        <g fill={SKIN} {...outline} strokeWidth="2.6">
          <rect x="46" y="4" width="13" height="42" rx="6.5" transform="rotate(-14 52 25)" />
          <rect x="62" y="8" width="13" height="40" rx="6.5" transform="rotate(12 68 28)" />
          <ellipse cx="62" cy="58" rx="20" ry="17" />
        </g>
        <path d="M50 52Q62 48 74 54M52 62Q62 58 72 63" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" />
      </g>
    )
  }

  const titleSheet = () => {
    const pts = rectPts(-300, -98, 600, 196)
    const fit = Math.min(92, (500 / Math.max(measure(title), 1)) * 62)
    return (
      <g data-tap="title">
        <path d={ragged(pts.map(([x, y]) => [x * 1.012, y * 1.05]), 9, 21, 7)} fill="#fffdf6" />
        <path d={ragged(pts, 8, 4, 7)} fill={PAPER} stroke="#d9d0bb" strokeWidth="1.2" />
        <path d={ragged(pts, 8, 4, 7)} fill={u("paperShade")} />
        <g key={replay}>{hand(title, 0, fit / 2, { cap: fit, maxW: 500, width: 7.5, color: "#2a2520", anchor: "middle", seed: 5, draw: true, skew: -4 })}</g>
      </g>
    )
  }

  const nameNote = () => {
    const sp = name.indexOf(" ")
    const lines = sp > 0 ? [name.slice(0, sp), name.slice(sp + 1)] : [name]
    return (
      <g data-tap="name" style={nameHref ? { cursor: "pointer" } : undefined}>
        <path d={ragged(rectPts(-104, -46, 208, 92), 5, 17, 6)} fill="#fffdf6" />
        <path d={ragged(rectPts(-100, -42, 200, 84), 4, 9, 6)} fill={PAPER} stroke="#d9d0bb" strokeWidth="1" />
        {lines.map((l, i) => (
          <React.Fragment key={i}>{hand(l, 0, (lines.length === 1 ? 10 : -6 + i * 32) + 4, { cap: 22, maxW: 176, width: 3, anchor: "middle", seed: 11 + i, skew: -8 })}</React.Fragment>
        ))}
        {nameHref ? <path d="M58 30l14 -2-4 -12" fill="none" stroke="#d8392f" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /> : null}
      </g>
    )
  }

  const todoNote = () => (
    <g>
      <path d="M-82 -100H82V72L54 100H-82Z" fill="#f7e27a" {...outline} />
      <path d="M82 72L58 76L54 100Z" fill="#e2c14a" {...outline} strokeWidth="2.4" />
      <path d="M-82 -100H82V-86H-82Z" fill="#000" opacity="0.06" />
      {hand(todoTitle, -64, -62, { cap: 16, maxW: 136, width: 2.6, seed: 1 })}
      <path d="M-64 -54H40" stroke={INK} strokeWidth="1.6" strokeLinecap="round" opacity="0.6" />
      {rows.map((text, i) => {
        const y = -22 + i * 34
        const on = !!done[i]
        return (
          <g
            key={i}
            className="cdp-row"
            data-tap={"todo:" + i}
            data-done={on ? "" : undefined}
            tabIndex={0}
            role="checkbox"
            aria-checked={on}
            aria-label={text}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                e.stopPropagation()
                act("todo:" + i, "todo")
              }
            }}
          >
            <rect x="-72" y={y - 22} width="146" height="30" fill="transparent" />
            <rect className="cdp-rowring" x="-72" y={y - 22} width="146" height="30" rx="6" />
            <circle cx="-56" cy={y - 7} r="7.5" fill="#fff8d0" {...outline} strokeWidth="2" />
            {hand(text, -40, y, { cap: 13, maxW: 106, width: 2.2, color: on ? "#7a6f4c" : INK, seed: 30 + i })}
            <path className="cdp-check" pathLength={1} d={"M-62 " + (y - 8) + "l5 6 12 -16"} fill="none" stroke="#d8392f" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
            <path className="cdp-check" pathLength={1} d={"M-42 " + (y - 6) + "L" + (-40 + Math.min(106, measure(text) * (13 / 62)) + 2) + " " + (y - 8)} fill="none" stroke="#d8392f" strokeWidth="2.2" strokeLinecap="round" />
          </g>
        )
      })}
    </g>
  )

  const sketchbook = () => (
    <g>
      <path d="M-156 -168H160V180H-156Z" fill="#e6d6b2" {...outline} transform="translate(8 8)" />
      <path d="M-160 -176H156V172H-160Z" fill="#f3e6c6" {...outline} />
      <g data-draw="" className="cdp-page">
        <rect x="-160" y="-176" width="316" height="348" fill={u("pageShade")} />
        {/* the study already on the page: a mannequin, a lit sphere, a note */}
        <g fill="none" stroke="#6b665e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.85">
          <ellipse cx="-30" cy="-96" rx="20" ry="24" />
          <path d="M-50 -98C-40 -90 -20 -90 -10 -98M-30 -120V-72" opacity="0.6" />
          <path d="M-30 -72V-56M-66 -52H6M-64 -52C-66 -20 -56 10 -44 26M4 -52C6 -20 -6 10 -16 26M-44 26H-16" />
          <path d="M-66 -52L-86 -8L-92 26M6 -52L28 -14L50 -30" />
          <path d="M-44 26L-52 84L-58 136M-16 26L-6 84L4 136M-66 136H-50M-4 136H12" />
          <circle cx="-86" cy="-8" r="4" />
          <circle cx="28" cy="-14" r="4" />
          <circle cx="-52" cy="84" r="4" />
          <circle cx="-6" cy="84" r="4" />
          <path d="M-60 -30H0M-58 0H-6" opacity="0.45" strokeDasharray="4 5" />
        </g>
        <circle cx="96" cy="72" r="24" fill="none" stroke="#6b665e" strokeWidth="1.8" />
        <path d="M112 58A24 24 0 0 1 76 90A24 24 0 0 0 112 58Z" fill="#6b665e" opacity="0.4" />
        <ellipse cx="102" cy="100" rx="26" ry="6" fill="#6b665e" opacity="0.25" />
        {hand("Light", 60, -100, { cap: 14, width: 1.8, color: "#6b665e", seed: 44 })}
        <path d="M86 -94L104 -76M104 -76L96 -78M104 -76L102 -84" fill="none" stroke="#6b665e" strokeWidth="1.6" strokeLinecap="round" />
        <g clipPath={u("page")} fill="none" strokeLinecap="round" strokeLinejoin="round">
          {doodles.map((d, i) => (
            <path key={i} d={strokeD(d.p)} stroke={d.c} strokeWidth="5" opacity="0.92" />
          ))}
        </g>
      </g>
      <clipPath id={id("page")}>
        <rect x="-160" y="-176" width="316" height="348" />
      </clipPath>
      {/* spiral binding */}
      {Array.from({ length: 11 }, (_, i) => {
        const x = -140 + i * 28
        return (
          <g key={i}>
            <circle cx={x} cy="-160" r="4.5" fill="#3b372f" />
            <path d={"M" + (x - 1) + " -160C" + (x - 12) + " -172 " + (x - 8) + " -196 " + (x + 4) + " -192"} fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round" />
            <path d={"M" + (x - 1) + " -160C" + (x - 12) + " -172 " + (x - 8) + " -196 " + (x + 4) + " -192"} fill="none" stroke="#c9ccd2" strokeWidth="3" strokeLinecap="round" />
          </g>
        )
      })}
      {/* the eraser: tap it and the doodles go */}
      <g transform="translate(-100 44) rotate(-24)">
        <g data-tap="eraser" className="cdp-key">
        <rect x="-30" y="-20" width="60" height="40" rx="7" fill="#e8e9ec" {...outline} strokeWidth="2.6" />
        <rect x="-30" y="-20" width="24" height="40" rx="5" fill="#a9adb6" {...outline} strokeWidth="2.4" />
        <path d="M2 -12H24" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
        </g>
      </g>
      {/* the ink swatch: which crayon the pen is drawing with */}
      <g transform="translate(120 -130)">
        <circle r="13" fill={palette[ink]} {...outline} strokeWidth="2.4" />
        <path d="M-5 -4A6 6 0 0 1 3 -7" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.6" />
      </g>
    </g>
  )

  const brushes = (
    <g>
      <g transform="translate(0 -20)">
        <path d="M150 -7C90 -9 40 -8 -20 -6L-20 6C40 8 90 9 150 7Z" fill={BLUE} {...outline} strokeWidth="2.6" />
        <path d="M140 -2H-10" stroke="#6b93ec" strokeWidth="2.4" strokeLinecap="round" />
        <rect x="-62" y="-8" width="44" height="16" rx="2" fill="#c8ccd3" {...outline} strokeWidth="2.4" />
        <path d="M-62 -7C-86 -8 -104 -3 -122 1C-104 4 -86 8 -62 7Z" fill="#3a2f28" {...outline} strokeWidth="2.4" />
      </g>
      <g transform="translate(20 26) rotate(-4)">
        <path d="M150 -7C90 -9 40 -8 -20 -6L-20 6C40 8 90 9 150 7Z" fill="#244fa6" {...outline} strokeWidth="2.6" />
        <rect x="-60" y="-9" width="42" height="18" rx="2" fill="#c8ccd3" {...outline} strokeWidth="2.4" />
        <path d="M-60 -8L-110 -30Q-122 0 -110 30L-60 8Z" fill="#8a7a6a" {...outline} strokeWidth="2.4" />
        <path d="M-66 0L-114 -18M-66 0L-118 0M-66 0L-114 18" stroke="#5a4c40" strokeWidth="1.4" />
      </g>
    </g>
  )

  const tablet = (
    <g>
      <rect x="-250" y="-160" width="500" height="320" rx="34" fill="#26282c" {...outline} strokeWidth="3.4" />
      <rect x="-244" y="-154" width="488" height="30" rx="20" fill="#3a3d43" opacity="0.7" />
      <rect x="-128" y="-124" width="352" height="250" rx="12" fill="#1c1d20" stroke="#3a3d43" strokeWidth="2" />
      <path d="M-116 -110h18M-116 -110v18M212 -110h-18M212 -110v18M-116 112h18M-116 112v-18M212 112h-18M212 112v-18" stroke="#50545b" strokeWidth="2" strokeLinecap="round" />
      <g data-tap="lamp" className="cdp-key">
        <rect x="-222" y="-118" width="62" height="28" rx="9" fill={lamp ? "#f36b2c" : "#8a4a2e"} {...outline} strokeWidth="2.6" />
        <path d="M-212 -110H-172" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" opacity={lamp ? 0.6 : 0.2} />
      </g>
      <circle cx="-190" cy="-30" r="40" fill="#303338" {...outline} strokeWidth="2.6" />
      <circle cx="-190" cy="-30" r="18" fill="#3c4046" {...outline} strokeWidth="2.4" />
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={-218 + i * 28} cy="40" r="11" fill="#3c4046" {...outline} strokeWidth="2.4" />
      ))}
      <circle cx="-190" cy="98" r="6" fill={lamp ? "#9df08a" : "#3c4046"} stroke={INK} strokeWidth="1.6" />
    </g>
  )

  const stylus = (
    <g>
      <path d="M-150 -11C-160 -11 -164 -6 -164 0C-164 6 -160 11 -150 11H96L128 3Q134 0 128 -3L96 -11Z" fill="#35373c" {...outline} strokeWidth="2.8" />
      <rect x="30" y="-12" width="60" height="24" rx="4" fill="#26282c" {...outline} strokeWidth="2.4" />
      <rect x="-40" y="-14" width="26" height="8" rx="3" fill="#50545b" {...outline} strokeWidth="1.8" />
      <path d="M-150 -4H20" stroke="#5a5d64" strokeWidth="3" strokeLinecap="round" />
      <path d="M128 -3Q136 0 128 3" fill="none" stroke="#9aa0a8" strokeWidth="3" />
    </g>
  )

  const draw: Record<PieceId, () => React.ReactNode> = {
    "star-a": () => star(66, true, "star-a"),
    "star-b": () => star(42, false, "star-b"),
    "sparkle-a": () => sparkle(22),
    "sparkle-b": () => sparkle(15),
    todo: todoNote,
    "clip-red-a": () => clip("#d8392f", "#f59a8f"),
    "clip-red-b": () => clip("#d8392f", "#f59a8f", 72),
    "clip-green": () => clip("#2f9a57", "#9ee3b3"),
    "clip-violet": () => clip("#7b5cd6", "#c7b5f5", 58),
    "clip-gold": () => clip("#e8b52e", "#fff0b0", 62),
    glue: () => glueBottle,
    "crayon-0": () => crayon(0),
    "crayon-1": () => crayon(1),
    "crayon-2": () => crayon(2),
    "crayon-3": () => crayon(3),
    polaroid: () => polaroid,
    shavings: () => shavings,
    "shaving-a": () => shavingWedge(1),
    "shaving-b": () => shavingWedge(6),
    tag: () => tapeLabel(tag, "#f5c842", "#8a3413", Math.max(130, Math.min(230, measure(tag) * 0.36 + 44)), 3),
    year: () => tapeLabel(year, "#f7a93a", "#7a2e10", Math.max(120, Math.min(220, measure(year) * 0.36 + 44)), 7),
    "tape-a": () => washi(120, 2),
    "tape-b": () => washi(110, 5),
    avatar: avatarArt,
    title: titleSheet,
    brushes: () => brushes,
    name: nameNote,
    sketch: sketchbook,
    "pencil-0": () => pencil(0),
    "pencil-1": () => pencil(1),
    "pencil-2": () => pencil(2),
    tablet: () => tablet,
    pen: () => stylus,
  }

  /** Pieces you can reach by keyboard, what they're called, and what Enter does. */
  const KEYED: Partial<Record<PieceId, [label: string, primary?: string]>> = {
    title: [title + " — tap to redraw", "title"],
    todo: [todoTitle],
    avatar: ["Sticker — tap to wink", "avatar"],
    glue: ["Glue bottle — tap to squeeze", "glue"],
    polaroid: ["Polaroid — tap to develop", "polaroid"],
    "star-a": ["Star — tap to spin", "spin"],
    "crayon-0": ["Red crayon — draw with it", "crayon:0"],
    "crayon-1": ["Orange crayon — draw with it", "crayon:1"],
    "crayon-2": ["Green crayon — draw with it", "crayon:2"],
    "crayon-3": ["Blue crayon — draw with it", "crayon:3"],
    sketch: ["Sketchbook — draw on the page; the eraser clears it", "eraser"],
    tablet: ["Drawing tablet — the orange key switches the lamp", "lamp"],
    name: [name + (nameHref ? " — opens link" : ""), nameHref ? "name" : undefined],
  }

  return (
    <section
      ref={rootRef}
      className={"cdp-root " + className}
      style={{ height, minHeight, ["--cdp-mat" as string]: matColor } as React.CSSProperties}
      data-lamp={lamp ? "on" : "off"}
    >
      <style>{CSS}</style>
      <div className="cdp-mat" />
      <div className="cdp-sr">
        <h1>
          {title} — {name}
        </h1>
        <p>
          {tag} · {year}
        </p>
        <ul>
          {rows.map((r, i) => (
            <li key={i}>
              {r}
              {done[i] ? " (done)" : ""}
            </li>
          ))}
        </ul>
        <p>Everything on the desk can be dragged. Arrow keys move the focused piece.</p>
      </div>

      <svg
        ref={svgRef}
        className="cdp-board"
        viewBox={"0 0 " + layout.w + " " + layout.h}
        preserveAspectRatio="xMidYMid meet"
        role="group"
        aria-label={title + " desk"}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <defs>
          <filter id={id("drop")} x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="4" dy="7" stdDeviation="3.5" floodColor="#062a14" floodOpacity="0.42" />
          </filter>
          <filter id={id("dropHigh")} x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="12" dy="22" stdDeviation="10" floodColor="#062a14" floodOpacity="0.38" />
          </filter>
          <linearGradient id={id("sky")} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f47b3a" />
            <stop offset="0.55" stopColor="#fbb46a" />
            <stop offset="1" stopColor="#ffd9a0" />
          </linearGradient>
          <linearGradient id={id("paperShade")} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0.5" />
            <stop offset="0.6" stopColor="#fff" stopOpacity="0" />
            <stop offset="1" stopColor="#b8a987" stopOpacity="0.28" />
          </linearGradient>
          <linearGradient id={id("pageShade")} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0.35" />
            <stop offset="1" stopColor="#b69b64" stopOpacity="0.25" />
          </linearGradient>
        </defs>

        {order.map((pid) => {
          const [x, y, r] = layout.at[pid]
          const o = offsets[pid] ?? [0, 0]
          const keyed = KEYED[pid]
          return (
            <g
              key={pid}
              className="cdp-piece"
              data-piece={pid}
              data-held={held === pid ? "" : undefined}
              transform={"translate(" + (x + o[0]).toFixed(1) + " " + (y + o[1]).toFixed(1) + ") rotate(" + r + ")"}
              tabIndex={keyed ? 0 : undefined}
              role={keyed ? "button" : undefined}
              aria-label={keyed ? keyed[0] : undefined}
              aria-hidden={keyed ? undefined : true}
              onKeyDown={keyed ? onKey(pid, keyed[1]) : undefined}
            >
              <g className="cdp-lift" filter={held === pid ? u("dropHigh") : u("drop")}>
                {draw[pid]()}
              </g>
            </g>
          )
        })}
      </svg>

      <div className="cdp-light" />
      <div className="cdp-shade" />

      <div className="cdp-ui">
        <span className="cdp-hint" data-gone={touched ? "" : undefined} aria-hidden="true">
          Drag anything · tap to play
        </span>
        {messy ? (
          <button type="button" className="cdp-tidy" onClick={tidy}>
            Tidy the desk
          </button>
        ) : null}
      </div>
    </section>
  )
}
