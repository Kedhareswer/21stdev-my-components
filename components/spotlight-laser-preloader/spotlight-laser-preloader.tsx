"use client"

// Spotlight Laser Preloader — a stage-light loading gate. A single spotlight
// hangs over a black room, its cone falling to a faint pool on the floor. It
// hums, flickers and dies. In the dark, the dead lamp re-ignites as a red
// laser, and the beam writes a name across the wall stroke by stroke —
// throwing sparks and smoke, the line white-hot where it lands, cooling to a
// red neon glow behind it.
//
// One file, React only. The name is drawn with a built-in single-stroke vector
// alphabet (A–Z, 0–9, a little punctuation), so the laser traces real strokes
// rather than outlines and nothing is fetched. Light is scoped CSS gradients;
// laser, sparks and smoke share one <canvas> and one frame loop. Every CSS
// rule is .slp- prefixed. There is no on-screen UI: customise it in code.

import * as React from "react"

export interface SpotlightLaserPalette {
  /** Stage colour. Hex. */
  background: string
  /** The spotlight. Hex. */
  light: string
  /** The beam and the settled glow of the name. Hex. */
  laser: string
  /** White-hot colour where the beam lands, and the core of the glow. Hex. */
  hot: string
}

export interface SpotlightLaserPreloaderProps {
  /** The word the laser writes. A–Z, 0–9, space and - . ! ? / ' are drawn; lowercase is upper-cased. */
  name?: string
  /** Content revealed once the gate fades. Ignored while `loop` is set. */
  children?: React.ReactNode
  /** Run forever as a showcase: relight, flicker, write, fade, again. onComplete never fires. */
  loop?: boolean
  /**
   * Real loading progress, 0–100. The laser writes up to this much of the name
   * and waits for 100. Leave undefined to write at a steady pace over `durationMs`.
   */
  progress?: number
  /** How long the laser takes to write the whole name. Defaults to 3600ms. */
  durationMs?: number
  /** Sparks and smoke off the beam. Defaults to true. */
  sparks?: boolean
  /** The pointer re-heats the written strokes and leans the spotlight. Defaults to true. */
  interactive?: boolean
  /** Colour overrides, merged over the defaults. */
  palette?: Partial<SpotlightLaserPalette>
  /** Root height. A definite length, never a percentage. */
  height?: string
  /** Fired once, after the gate has faded. */
  onComplete?: () => void
  /** Extra root class names. */
  className?: string
}

const DEFAULT_PALETTE: SpotlightLaserPalette = {
  background: "#000000",
  light: "#ffffff",
  laser: "#ff1f2a",
  hot: "#ffe6cc",
}

type Strokes = number[][][]

interface SlpTrace {
  n: number
  x0: number[]
  y0: number[]
  x1: number[]
  y1: number[]
  u0: number[]
  u1: number[]
  starts: number[]
  first: number[]
  dwell: number
  total: number
}

// #region engine
// Pure helpers, lifted out and executed by tests/spotlight-laser-preloader.test.mjs.

const clamp01 = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x)

// A dying fluorescent tube: hard steps between levels, [time, level] knots.
const FLICKER = [
  [0, 1],
  [0.07, 0.3],
  [0.1, 1],
  [0.2, 0.92],
  [0.23, 0.04],
  [0.26, 0.85],
  [0.29, 0.12],
  [0.34, 1],
  [0.5, 0.94],
  [0.53, 0.18],
  [0.56, 0.62],
  [0.58, 0],
  [0.65, 0.48],
  [0.68, 0],
  [0.77, 0.22],
  [0.79, 0],
]

// Striking back on, for the next loop.
const RELIGHT = [
  [0, 0],
  [0.12, 0.55],
  [0.17, 0],
  [0.3, 0.9],
  [0.35, 0.2],
  [0.45, 1],
]

function steps(knots: number[][], t: number) {
  let v = knots[0][1]
  for (const k of knots) if (t >= k[0]) v = k[1]
  return v
}

export function slpFlicker(t: number) {
  if (t <= 0) return 1
  if (t >= 1) return 0
  return steps(FLICKER, t)
}

export function slpRelight(t: number) {
  if (t <= 0) return 0
  if (t >= 1) return 1
  return steps(RELIGHT, t)
}

// Deterministic noise in [0, 1).
export function slpHash(n: number) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return s - Math.floor(s)
}

// Hex to [r, g, b]; anything unparseable falls back.
export function slpRgb(hex: string, fallback: string) {
  const re = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i
  const m = re.exec((hex || "").trim()) || re.exec(fallback) || ["", "fff"]
  let h = m[1]
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

// Points along an ellipse, angles in degrees, y pointing down.
function arc(cx: number, cy: number, rx: number, ry: number, a0: number, a1: number) {
  const n = Math.max(4, Math.ceil(Math.abs(a1 - a0) / 10))
  const out = []
  for (let i = 0; i <= n; i++) {
    const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180
    out.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)])
  }
  return out
}

// The single-stroke alphabet. Cap height is 1, y runs down, strokes run in the
// order a hand would draw them — which is the order the laser burns them.
const GLYPHS = new Map([
  ["A", [[[0, 1], [0.3, 0], [0.6, 1]], [[0.11, 0.64], [0.49, 0.64]]]],
  ["B", [[[0, 1], [0, 0], [0.32, 0], ...arc(0.32, 0.24, 0.22, 0.24, -90, 90), [0, 0.48]], [[0.34, 0.48], ...arc(0.34, 0.74, 0.25, 0.26, -90, 90), [0, 1]]]],
  ["C", [arc(0.33, 0.5, 0.32, 0.5, -40, -320)]],
  ["D", [[[0, 1], [0, 0], [0.2, 0], ...arc(0.2, 0.5, 0.4, 0.5, -90, 90), [0, 1]]]],
  ["E", [[[0.54, 0], [0, 0], [0, 1], [0.54, 1]], [[0, 0.49], [0.42, 0.49]]]],
  ["F", [[[0.54, 0], [0, 0], [0, 1]], [[0, 0.49], [0.42, 0.49]]]],
  ["G", [[...arc(0.33, 0.5, 0.32, 0.5, -40, -360), [0.38, 0.5]]]],
  ["H", [[[0, 0], [0, 1]], [[0.58, 0], [0.58, 1]], [[0, 0.5], [0.58, 0.5]]]],
  ["I", [[[0.04, 0], [0.32, 0]], [[0.18, 0], [0.18, 1]], [[0.04, 1], [0.32, 1]]]],
  ["J", [[[0.48, 0], [0.48, 0.7], ...arc(0.25, 0.7, 0.23, 0.3, 0, 170)]]],
  ["K", [[[0, 0], [0, 1]], [[0.56, 0], [0, 0.6]], [[0.18, 0.42], [0.58, 1]]]],
  ["L", [[[0, 0], [0, 1], [0.52, 1]]]],
  ["M", [[[0, 1], [0, 0], [0.36, 0.64], [0.72, 0], [0.72, 1]]]],
  ["N", [[[0, 1], [0, 0], [0.6, 1], [0.6, 0]]]],
  ["O", [arc(0.34, 0.5, 0.34, 0.5, -90, 270)]],
  ["P", [[[0, 1], [0, 0], [0.32, 0], ...arc(0.32, 0.26, 0.24, 0.26, -90, 90), [0, 0.52]]]],
  ["Q", [arc(0.34, 0.5, 0.34, 0.5, -90, 270), [[0.42, 0.7], [0.72, 1.04]]]],
  ["R", [[[0, 1], [0, 0], [0.32, 0], ...arc(0.32, 0.26, 0.24, 0.26, -90, 90), [0, 0.52]], [[0.26, 0.52], [0.58, 1]]]],
  ["S", [[...arc(0.29, 0.25, 0.26, 0.25, -20, -270), ...arc(0.29, 0.75, 0.29, 0.25, -90, 160)]]],
  ["T", [[[0, 0], [0.6, 0]], [[0.3, 0], [0.3, 1]]]],
  ["U", [[[0, 0], [0, 0.66], ...arc(0.29, 0.66, 0.29, 0.34, 180, 0), [0.58, 0]]]],
  ["V", [[[0, 0], [0.3, 1], [0.6, 0]]]],
  ["W", [[[0, 0], [0.2, 1], [0.41, 0.3], [0.62, 1], [0.82, 0]]]],
  ["X", [[[0, 0], [0.58, 1]], [[0.58, 0], [0, 1]]]],
  ["Y", [[[0, 0], [0.3, 0.5], [0.6, 0]], [[0.3, 0.5], [0.3, 1]]]],
  ["Z", [[[0, 0], [0.58, 0], [0, 1], [0.58, 1]]]],
  ["0", [arc(0.28, 0.5, 0.28, 0.5, -90, 270), [[0.47, 0.18], [0.09, 0.82]]]],
  ["1", [[[0.06, 0.2], [0.28, 0], [0.28, 1]], [[0.04, 1], [0.52, 1]]]],
  ["2", [[...arc(0.28, 0.27, 0.26, 0.27, -165, 15), [0, 1], [0.56, 1]]]],
  ["3", [[...arc(0.27, 0.25, 0.25, 0.25, -160, 90), ...arc(0.27, 0.75, 0.29, 0.25, -90, 160)]]],
  ["4", [[[0.42, 1], [0.42, 0], [0, 0.7], [0.58, 0.7]]]],
  ["5", [[[0.52, 0], [0.08, 0], [0.04, 0.45], ...arc(0.27, 0.69, 0.29, 0.31, -125, 160)]]],
  ["6", [[[0.46, 0], [0.06, 0.52], ...arc(0.29, 0.68, 0.27, 0.32, -150, 210)]]],
  ["7", [[[0, 0], [0.56, 0], [0.2, 1]]]],
  ["8", [arc(0.28, 0.25, 0.22, 0.25, 90, 450), arc(0.28, 0.75, 0.28, 0.25, -90, 270)]],
  ["9", [[...arc(0.29, 0.32, 0.27, 0.32, 30, 390), [0.14, 1]]]],
  ["-", [[[0.04, 0.56], [0.4, 0.56]]]],
  [".", [arc(0.05, 0.96, 0.02, 0.02, 0, 360)]],
  ["!", [[[0.07, 0], [0.07, 0.7]], arc(0.07, 0.96, 0.02, 0.02, 0, 360)]],
  ["?", [[...arc(0.26, 0.24, 0.25, 0.24, -160, 90), [0.26, 0.68]], arc(0.26, 0.96, 0.02, 0.02, 0, 360)]],
  ["/", [[[0.46, 0], [0, 1]]]],
  ["'", [[[0.06, 0], [0.04, 0.3]]]],
])

const TRACK = 0.27
const SPACE = 0.5

function glyphOf(c: string) {
  return GLYPHS.get(c) || null
}

function widthOf(c: string) {
  const g = glyphOf(c)
  if (!g) return SPACE
  let m = 0.1
  for (const s of g) for (const p of s) if (p[0] > m) m = p[0]
  return m
}

function lineWidth(chars: string[]) {
  let w = 0
  chars.forEach((c, i) => {
    w += widthOf(c) + (i < chars.length - 1 ? TRACK : 0)
  })
  return w
}

// Fit the name to the stage: one line, or two when a narrow screen would buy a
// much bigger word by breaking at a space. Returns the strokes in pixels.
export function slpLayout(text: string, w: number, h: number) {
  const chars = Array.from(text.toUpperCase().trim())
  const options = [[chars]]
  const spaces = chars.map((c, i) => (c === " " ? i : -1)).filter((i) => i > 0)
  if (spaces.length) {
    let best = spaces[0]
    for (const i of spaces) if (Math.abs(i - chars.length / 2) < Math.abs(best - chars.length / 2)) best = i
    options.push([chars.slice(0, best), chars.slice(best + 1)])
  }
  let pick = options[0]
  let size = 0
  options.forEach((lines, k) => {
    const widest = Math.max(0.1, ...lines.map(lineWidth))
    const tall = lines.length + (lines.length - 1) * 0.6
    const s = Math.min((w * 0.8) / widest, (h * (lines.length > 1 ? 0.38 : 0.2)) / tall)
    if (k === 0 || s > size * 1.3) {
      pick = lines
      size = s
    }
  })
  size = Math.max(14, Math.floor(size))

  const strokes = []
  const tall = (pick.length + (pick.length - 1) * 0.6) * size
  let top = h * 0.5 - tall / 2
  let minX = Infinity
  let maxX = -Infinity
  for (const line of pick) {
    let x = (w - lineWidth(line) * size) / 2
    for (const c of line) {
      const g = glyphOf(c)
      if (g) {
        for (const s of g) {
          strokes.push(s.map((p) => [x + p[0] * size, top + p[1] * size]))
        }
      }
      minX = Math.min(minX, x)
      maxX = Math.max(maxX, x + widthOf(c) * size)
      x += (widthOf(c) + TRACK) * size
    }
    top += size * 1.6
  }
  const y = h * 0.5 - tall / 2
  return { size, strokes, box: { x: minX, y, w: Math.max(0, maxX - minX), h: tall } }
}

// Chop the strokes into short segments on one virtual timeline. Each stroke
// opens with a dwell: the beam slews to its start and strikes before it draws.
export function slpTrace(strokes: Strokes, size: number) {
  const step = Math.max(1.5, size * 0.022)
  const dwell = size * 0.55
  const t = { n: 0, x0: [], y0: [], x1: [], y1: [], u0: [], u1: [], starts: [], first: [], dwell, total: 0 } as SlpTrace
  let u = 0
  for (const s of strokes) {
    if (s.length < 2) continue
    t.starts.push(u)
    t.first.push(t.n)
    u += dwell
    for (let i = 0; i < s.length - 1; i++) {
      const [ax, ay] = s[i]
      const [bx, by] = s[i + 1]
      const len = Math.hypot(bx - ax, by - ay)
      if (len < 1e-6) continue
      const parts = Math.max(1, Math.ceil(len / step))
      for (let j = 0; j < parts; j++) {
        t.x0.push(ax + ((bx - ax) * j) / parts)
        t.y0.push(ay + ((by - ay) * j) / parts)
        t.x1.push(ax + ((bx - ax) * (j + 1)) / parts)
        t.y1.push(ay + ((by - ay) * (j + 1)) / parts)
        t.u0.push(u)
        u += len / parts
        t.u1.push(u)
        t.n++
      }
    }
  }
  t.total = u
  return t
}

// Where the beam is at virtual position u, whether it is burning, and how many
// segments are fully drawn (plus the fraction of the next one).
export function slpTip(tr: SlpTrace, u: number) {
  if (!tr.n) return { x: 0, y: 0, on: false, done: 0, part: 0 }
  if (u >= tr.total) return { x: tr.x1[tr.n - 1], y: tr.y1[tr.n - 1], on: false, done: tr.n, part: 0 }
  if (u < 0) u = 0
  let k = 0
  while (k + 1 < tr.starts.length && tr.starts[k + 1] <= u) k++
  const f = tr.first[k]
  const local = (u - tr.starts[k]) / tr.dwell
  if (local < 1) {
    const m = clamp01(local / 0.45)
    const e = m * m * (3 - 2 * m)
    const px = k > 0 ? tr.x1[f - 1] : tr.x0[f]
    const py = k > 0 ? tr.y1[f - 1] : tr.y0[f]
    return { x: px + (tr.x0[f] - px) * e, y: py + (tr.y0[f] - py) * e, on: local > 0.45, done: f, part: 0 }
  }
  const end = k + 1 < tr.first.length ? tr.first[k + 1] - 1 : tr.n - 1
  let lo = f
  let hi = end
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1
    if (tr.u0[mid] <= u) lo = mid
    else hi = mid - 1
  }
  const p = clamp01((u - tr.u0[lo]) / (tr.u1[lo] - tr.u0[lo]))
  return {
    x: tr.x0[lo] + (tr.x1[lo] - tr.x0[lo]) * p,
    y: tr.y0[lo] + (tr.y1[lo] - tr.y0[lo]) * p,
    on: true,
    done: lo,
    part: p,
  }
}
// #endregion

const mix = (a: number[], b: number[], t: number) => a.map((v, i) => Math.round(v + (b[i] - v) * t))
const css = (c: number[], a = 1) => "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a.toFixed(3) + ")"

const SLP_CSS = `
.slp-root {
  position: relative;
  width: 100%;
  overflow: hidden;
  isolation: isolate;
  background: var(--slp-bg);
  color: #fff;
}
.slp-root .slp-dest {
  position: absolute;
  inset: 0;
  overflow: auto;
  z-index: 0;
}
.slp-root .slp-gate {
  position: absolute;
  inset: 0;
  z-index: 1;
  overflow: hidden;
  background: var(--slp-bg);
  outline: none;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  touch-action: manipulation;
}
.slp-root .slp-gate:focus-visible {
  box-shadow: inset 0 0 0 1px rgba(var(--slp-red), 0.45);
}
.slp-root .slp-cone {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: var(--slp-l, 1);
  transform: translateX(var(--slp-lean, 0px));
  background:
    radial-gradient(ellipse 13% 9% at 50% 4%, rgba(var(--slp-light), 0.42), rgba(var(--slp-light), 0) 100%),
    radial-gradient(ellipse 30% 42% at 50% 6%, rgba(var(--slp-light), 0.24), rgba(var(--slp-light), 0) 100%),
    radial-gradient(ellipse 38% 52% at 50% 36%, rgba(var(--slp-light), 0.16) 0%, rgba(var(--slp-light), 0.08) 50%, rgba(var(--slp-light), 0) 100%);
}
.slp-root .slp-pool {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: var(--slp-l, 1);
  background:
    radial-gradient(ellipse 14% 2.6% at 50% 86%, rgba(var(--slp-light), 0.1), rgba(var(--slp-light), 0) 100%),
    radial-gradient(ellipse 36% 7% at 50% 86%, rgba(var(--slp-light), 0.07), rgba(var(--slp-light), 0) 100%);
}
.slp-root .slp-spill {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: var(--slp-r, 0);
  background:
    radial-gradient(ellipse 30% 6% at 50% 86%, rgba(var(--slp-red), 0.22), rgba(var(--slp-red), 0) 100%),
    radial-gradient(ellipse 46% 30% at 50% 50%, rgba(var(--slp-red), 0.05), rgba(var(--slp-red), 0) 100%);
}
.slp-root .slp-streak {
  position: absolute;
  left: 12%;
  right: 12%;
  top: 4%;
  height: 2px;
  margin-top: -1px;
  pointer-events: none;
  opacity: var(--slp-f, 1);
  background: linear-gradient(90deg, rgba(var(--slp-light), 0), rgba(var(--slp-light), 0.16) 30%, rgba(var(--slp-light), 0.3) 50%, rgba(var(--slp-light), 0.16) 70%, rgba(var(--slp-light), 0));
  filter: blur(1px);
}
.slp-root .slp-lamp {
  position: absolute;
  left: 50%;
  top: 4%;
  width: clamp(96px, 15%, 280px);
  height: clamp(7px, 1.6%, 14px);
  transform: translate(-50%, -50%);
  border-radius: 50%;
  pointer-events: none;
  opacity: var(--slp-f, 1);
  background: radial-gradient(ellipse at center, #fff 0%, rgba(var(--slp-light), 0.96) 38%, rgba(var(--slp-light), 0.45) 62%, rgba(var(--slp-light), 0) 74%);
  box-shadow: 0 0 16px 3px rgba(var(--slp-light), 0.32), 0 0 70px 14px rgba(var(--slp-light), 0.1);
}
.slp-root .slp-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  max-width: none;
  display: block;
  pointer-events: none;
}
.slp-root .slp-vignette {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(ellipse 75% 70% at 50% 45%, rgba(0, 0, 0, 0) 55%, rgba(0, 0, 0, 0.55) 100%);
}
.slp-root .slp-grain {
  position: absolute;
  inset: -50%;
  pointer-events: none;
  opacity: 0.035;
  mix-blend-mode: screen;
  background-size: 128px 128px;
  animation: slp-grain 0.9s steps(5) infinite;
}
.slp-root .slp-sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
.slp-root[data-phase="exit"] .slp-gate {
  animation: slp-out 0.9s ease forwards;
  pointer-events: none;
}

@keyframes slp-grain {
  0% { transform: translate(0, 0); }
  20% { transform: translate(-5%, 3%); }
  40% { transform: translate(4%, -6%); }
  60% { transform: translate(-2%, 7%); }
  80% { transform: translate(6%, 2%); }
  100% { transform: translate(0, 0); }
}
@keyframes slp-out { to { opacity: 0; } }

@media (prefers-reduced-motion: reduce) {
  .slp-root .slp-grain { animation: none; }
  .slp-root .slp-cone { transform: none; }
}
`

type Phase = "light" | "flicker" | "dark" | "write" | "hold" | "fade" | "exit" | "done"

const LIGHT_MS = 1400
const RELIGHT_MS = 1600
const FLICKER_MS = 1800
const DARK_MS = 800
const HOLD_MS = 2000
const FADE_MS = 1200
const EXIT_MS = 900

interface Spark {
  x: number
  y: number
  vx: number
  vy: number
  age: number
  life: number
}
interface Puff {
  x: number
  y: number
  vx: number
  vy: number
  age: number
  life: number
  r: number
}

export default function SpotlightLaserPreloader({
  name = "KEDHAR",
  children,
  loop = false,
  progress,
  durationMs = 3600,
  sparks = true,
  interactive = true,
  palette,
  height = "100svh",
  onComplete,
  className = "",
}: SpotlightLaserPreloaderProps) {
  const [phase, setPhase] = React.useState<Phase>("light")
  const [pct, setPct] = React.useState(0)
  const [reduced, setReduced] = React.useState(false)

  const rootRef = React.useRef<HTMLDivElement>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const grainRef = React.useRef<HTMLDivElement>(null)
  const phaseRef = React.useRef<Phase>("light")
  const skipRef = React.useRef(false)
  const rushRef = React.useRef(false)
  const pointerRef = React.useRef({ x: 0, y: 0, on: false })
  const progressRef = React.useRef(progress)
  progressRef.current = progress
  const loopRef = React.useRef(loop)
  loopRef.current = loop
  const onCompleteRef = React.useRef(onComplete)
  onCompleteRef.current = onComplete

  const colors = { ...DEFAULT_PALETTE, ...palette }
  const lightRgb = slpRgb(colors.light, DEFAULT_PALETTE.light)
  const laserRgb = slpRgb(colors.laser, DEFAULT_PALETTE.laser)
  const hotRgb = slpRgb(colors.hot, DEFAULT_PALETTE.hot)
  const laserKey = laserRgb.join(",")
  const hotKey = hotRgb.join(",")

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => setReduced(mq.matches)
    sync()
    mq.addEventListener("change", sync)
    return () => mq.removeEventListener("change", sync)
  }, [])

  // film grain: one noise tile, painted once, to keep the gradients from banding
  React.useEffect(() => {
    const el = grainRef.current
    if (!el) return
    const tile = document.createElement("canvas")
    tile.width = tile.height = 128
    const t = tile.getContext("2d")
    if (!t) return
    const img = t.createImageData(128, 128)
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() * 255
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v
      img.data[i + 3] = 255
    }
    t.putImageData(img, 0, 0)
    el.style.backgroundImage = "url(" + tile.toDataURL() + ")"
  }, [])

  // ---- one frame loop: the light, the timeline, the laser ---------------------
  React.useEffect(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!root || !canvas || !ctx) return

    const laser = laserKey.split(",").map(Number)
    const hot = hotKey.split(",").map(Number)
    const mid = mix(laser, hot, 0.5)
    // six heat levels, settled red to white-hot
    const heatCol = [0, 1, 2, 3, 4, 5].map((b) => {
      const h = b / 5
      return h < 0.5 ? mix(laser, mid, h * 2) : mix(mid, hot, (h - 0.5) * 2)
    })
    const coreCol = heatCol.map((c) => mix(c, hot, 0.6))
    const white = [255, 255, 255]

    let W = 0
    let H = 0
    let dpr = 1
    let size = 40
    let tr: SlpTrace = slpTrace([], 1)
    let born = new Float64Array(0)
    let touch = new Float32Array(0)
    let u = 0
    let lamp = 1
    let cycle = 0
    let at = performance.now()
    let last = at
    let raf = 0
    let stopped = false
    let lastPct = -1
    let lastStroke = -1
    let smokeAcc = 0
    let sparkAcc = 0
    const sparkList: Spark[] = []
    const puffs: Puff[] = []
    const buckets: number[][] = [[], [], [], [], [], []]

    const build = () => {
      const r = root.getBoundingClientRect()
      if (r.width < 2 || r.height < 2) return
      const frac = tr.total > 0 ? u / tr.total : 0
      W = r.width
      H = r.height
      dpr = Math.min(2, window.devicePixelRatio || 1)
      canvas.width = Math.round(W * dpr)
      canvas.height = Math.round(H * dpr)
      const lay = slpLayout(name, W, H)
      size = lay.size
      tr = slpTrace(lay.strokes, size)
      u = frac * tr.total
      // what was already written stays written, already cooled
      born = new Float64Array(tr.n).fill(-1e9)
      touch = new Float32Array(tr.n)
    }

    const go = (next: Phase, now: number) => {
      phaseRef.current = next
      at = now
      setPhase(next)
    }

    const spark = (x: number, y: number, power: number) => {
      if (sparkList.length > 380) return
      const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.5
      const sp = (0.5 + Math.random()) * size * 2.6 * power
      sparkList.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, age: 0, life: 260 + Math.random() * 520 })
    }

    const frame = (now: number) => {
      if (stopped) return
      const dt = Math.min(50, now - last)
      last = now
      let ph = phaseRef.current
      if (ph === "done") return
      const since = now - at
      const skip = skipRef.current
      skipRef.current = false

      // ---- timeline ----
      let level = 0
      if (ph === "light") {
        const span = cycle > 0 ? RELIGHT_MS : LIGHT_MS
        level = cycle > 0 && !reduced ? slpRelight(since / (span * 0.55)) : reduced && cycle > 0 ? clamp01(since / 600) : 1
        if (since > span || skip) go("flicker", now)
      } else if (ph === "flicker") {
        const t = since / FLICKER_MS
        level = reduced ? 1 - t * t * (3 - 2 * clamp01(t)) : slpFlicker(t) * (0.9 + 0.1 * slpHash(Math.floor(now / 40)))
        if (t >= 1 || skip) go("dark", now)
      } else if (ph === "dark") {
        if (since > DARK_MS || skip) go("write", now)
      } else if (ph === "write") {
        const speed = tr.total / Math.max(400, durationMs)
        const ext = progressRef.current
        const target = ext === undefined ? tr.total : (clamp01(ext / 100) * tr.total)
        const boost = rushRef.current ? 5 : 1
        u = Math.min(target, u + speed * boost * dt)
        if (u >= tr.total && (ext === undefined || ext >= 100)) {
          u = tr.total
          go("hold", now)
        }
      } else if (ph === "hold") {
        if (since > HOLD_MS || skip) go(loopRef.current ? "fade" : "exit", now)
      } else if (ph === "fade") {
        if (since > FADE_MS) {
          cycle++
          u = 0
          lastStroke = -1
          born.fill(-1e9)
          go("light", now)
        }
      } else if (ph === "exit") {
        if (since > EXIT_MS) {
          go("done", now)
          onCompleteRef.current?.()
          return
        }
      }
      ph = phaseRef.current
      if (ph !== "write") rushRef.current = false

      lamp = Math.max(level, lamp - dt / 420)
      const pt = pointerRef.current
      const pon = pt.on && interactive && !reduced
      const lean = pon && W ? ((pt.x - W / 2) / W) * 18 : 0
      root.style.setProperty("--slp-l", level.toFixed(3))
      root.style.setProperty("--slp-f", Math.max(level, lamp * 0.85).toFixed(3))
      root.style.setProperty("--slp-lean", lean.toFixed(1) + "px")

      const written = tr.total > 0 ? u / tr.total : 0
      const fadeK = ph === "fade" ? 1 - clamp01(since / FADE_MS) : ph === "light" || ph === "flicker" || ph === "dark" ? 0 : 1
      root.style.setProperty("--slp-r", (written * fadeK * 0.9).toFixed(3))

      const p = ph === "write" ? Math.floor(written * 100) : ph === "hold" || ph === "exit" ? 100 : ph === "fade" ? 100 : 0
      if (p !== lastPct) {
        lastPct = p
        setPct(p)
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, W, H)
      if (!W) {
        raf = requestAnimationFrame(frame)
        return
      }
      ctx.globalCompositeOperation = "lighter"
      ctx.lineCap = "round"
      ctx.lineJoin = "round"

      const writing = ph === "write"
      const tip = slpTip(tr, u)
      const beamOn = writing && tip.on && !reduced
      const ex = W / 2
      const ey = H * 0.04

      // ---- the trail ----
      const drawn = ph === "write" || ph === "hold" || ph === "fade" || ph === "exit"
      if (drawn && tr.n) {
        const doneN = tip.done
        for (let i = 0; i < doneN; i++) if (born[i] < -1e8 && writing) born[i] = now
        if (writing && tip.part > 0 && born[doneN] < -1e8) born[doneN] = now
        // the pointer re-heats what it touches
        const R = size * 0.6
        const decay = Math.exp(-dt / 800)
        for (let b = 0; b < 6; b++) buckets[b].length = 0
        const lim = Math.min(tr.n, doneN + (tip.part > 0 ? 1 : 0))
        for (let i = 0; i < lim; i++) {
          let t = touch[i] * decay
          if (pon) {
            const mx = (tr.x0[i] + tr.x1[i]) / 2 - pt.x
            const my = (tr.y0[i] + tr.y1[i]) / 2 - pt.y
            if (mx > -R && mx < R && my > -R && my < R) {
              const d = Math.sqrt(mx * mx + my * my)
              if (d < R) {
                const k = 1 - d / R
                if (k * 0.9 > t + 0.25 && sparks && Math.random() < 0.08) spark((tr.x0[i] + tr.x1[i]) / 2, (tr.y0[i] + tr.y1[i]) / 2, 0.45)
                t = Math.max(t, Math.min(1, k * 1.3))
              }
            }
          }
          touch[i] = t
          const age = now - born[i]
          const heat = reduced ? 0 : Math.min(1, Math.exp(-age / 650) + t)
          buckets[Math.min(5, Math.floor(heat * 5.999))].push(i)
        }

        let alpha = fadeK
        if (ph === "hold" || ph === "fade" || ph === "exit") alpha *= reduced ? 1 : 0.93 + 0.07 * Math.sin(now * 0.011) * slpHash(Math.floor(now / 70))
        if (alpha > 0.01) {
          // bloom: one path for everything written, so overlaps never double up
          const all = new Path2D()
          for (let b = 0; b < 6; b++) {
            for (const i of buckets[b]) {
              all.moveTo(tr.x0[i], tr.y0[i])
              if (i === doneN && writing) all.lineTo(tip.x, tip.y)
              else all.lineTo(tr.x1[i], tr.y1[i])
            }
          }
          ctx.lineWidth = size * 0.18
          ctx.strokeStyle = css(laser, 0.09 * alpha)
          ctx.stroke(all)
          ctx.shadowColor = css(laser, 0.9 * alpha)
          ctx.shadowBlur = size * 0.4
          ctx.lineWidth = size * 0.05
          ctx.strokeStyle = css(laser, 0.7 * alpha)
          ctx.stroke(all)
          ctx.shadowBlur = 0
          ctx.shadowColor = "transparent"
          // butt caps: round ones would bead where neighbouring segments overlap
          ctx.lineCap = "butt"

          for (let b = 0; b < 6; b++) {
            const list = buckets[b]
            if (!list.length) continue
            const path = new Path2D()
            for (const i of list) {
              path.moveTo(tr.x0[i], tr.y0[i])
              if (i === doneN && writing) path.lineTo(tip.x, tip.y)
              else path.lineTo(tr.x1[i], tr.y1[i])
            }
            if (b > 1) {
              ctx.lineWidth = size * 0.1
              ctx.strokeStyle = css(heatCol[b], 0.05 * b * alpha)
              ctx.stroke(path)
            }
            ctx.lineWidth = size * 0.042
            ctx.strokeStyle = css(heatCol[b], 0.55 * alpha)
            ctx.stroke(path)
            ctx.lineWidth = Math.max(1.2, size * 0.016 * (1 + b * 0.12))
            ctx.strokeStyle = css(coreCol[b], 0.95 * alpha)
            ctx.stroke(path)
          }
          ctx.lineCap = "round"
        }
      }

      // ---- the emitter: the dead lamp, re-lit red ----
      let emit = 0
      if (ph === "dark") emit = reduced ? 0 : clamp01((since - DARK_MS + 320) / 320) * 0.7
      else if (writing) emit = reduced ? 0 : beamOn ? 1 : 0.7
      else if (ph === "hold") emit = reduced ? 0 : Math.max(0, 0.7 - since / 600)
      if (emit > 0.01) {
        ctx.save()
        ctx.translate(ex, ey)
        ctx.scale(4.5, 1)
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 16)
        g.addColorStop(0, css(white, 0.9 * emit))
        g.addColorStop(0.25, css(laser, 0.8 * emit))
        g.addColorStop(1, css(laser, 0))
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(0, 0, 16, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      // ---- the beam and the burn ----
      if (writing && !reduced && tr.n) {
        const flick = 0.82 + 0.18 * Math.random()
        if (beamOn) {
          ctx.lineWidth = 7
          ctx.strokeStyle = css(laser, 0.07 * flick)
          ctx.beginPath()
          ctx.moveTo(ex, ey)
          ctx.lineTo(tip.x, tip.y)
          ctx.stroke()
          ctx.lineWidth = 1.3
          ctx.strokeStyle = css(mix(laser, hot, 0.25), 0.65 * flick)
          ctx.stroke()

          // red wash thrown on the wall
          const wash = ctx.createRadialGradient(tip.x, tip.y, 0, tip.x, tip.y, Math.max(W, H) * 0.45)
          wash.addColorStop(0, css(laser, 0.07 * flick))
          wash.addColorStop(1, css(laser, 0))
          ctx.fillStyle = wash
          ctx.fillRect(0, 0, W, H)

          const halo = ctx.createRadialGradient(tip.x, tip.y, 0, tip.x, tip.y, size * 0.5)
          halo.addColorStop(0, css(hot, 0.5 * flick))
          halo.addColorStop(0.2, css(laser, 0.3 * flick))
          halo.addColorStop(1, css(laser, 0))
          ctx.fillStyle = halo
          ctx.beginPath()
          ctx.arc(tip.x, tip.y, size * 0.5, 0, Math.PI * 2)
          ctx.fill()

          const core = Math.max(2.5, size * 0.05)
          const cg = ctx.createRadialGradient(tip.x, tip.y, 0, tip.x, tip.y, core)
          cg.addColorStop(0, css(white, flick))
          cg.addColorStop(0.5, css(hot, 0.8 * flick))
          cg.addColorStop(1, css(hot, 0))
          ctx.fillStyle = cg
          ctx.beginPath()
          ctx.arc(tip.x, tip.y, core, 0, Math.PI * 2)
          ctx.fill()

          if (sparks) {
            // a burst each time the beam strikes a new stroke
            let k = 0
            while (k + 1 < tr.starts.length && tr.starts[k + 1] <= u) k++
            if (k !== lastStroke) {
              lastStroke = k
              for (let i = 0; i < 16; i++) spark(tip.x, tip.y, 1.15)
            }
            sparkAcc += dt * 0.11 * (rushRef.current ? 1.8 : 1)
            while (sparkAcc > 1) {
              sparkAcc--
              spark(tip.x, tip.y, 1)
            }
            smokeAcc += dt
            if (smokeAcc > 70 && puffs.length < 46) {
              smokeAcc = 0
              puffs.push({
                x: tip.x,
                y: tip.y,
                vx: (Math.random() - 0.5) * size * 0.25,
                vy: -size * (0.25 + Math.random() * 0.3),
                age: 0,
                life: 1400 + Math.random() * 900,
                r: size * (0.06 + Math.random() * 0.05),
              })
            }
          }
        } else {
          // slewing between strokes: a dim aiming dot
          const ag = ctx.createRadialGradient(tip.x, tip.y, 0, tip.x, tip.y, size * 0.12)
          ag.addColorStop(0, css(laser, 0.5))
          ag.addColorStop(1, css(laser, 0))
          ctx.fillStyle = ag
          ctx.beginPath()
          ctx.arc(tip.x, tip.y, size * 0.12, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // ---- smoke, lit red from below ----
      if (puffs.length) {
        ctx.globalCompositeOperation = "source-over"
        for (let i = puffs.length - 1; i >= 0; i--) {
          const s = puffs[i]
          s.age += dt
          if (s.age > s.life) {
            puffs.splice(i, 1)
            continue
          }
          const k = s.age / s.life
          s.x += (s.vx * dt) / 1000 + Math.sin(s.age * 0.004 + i) * 0.15
          s.y += (s.vy * dt) / 1000
          const r = s.r + size * 0.5 * k
          const a = 0.07 * (1 - k) * Math.min(1, k * 8)
          const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, r)
          g.addColorStop(0, css(mix(laser, white, 0.55), a))
          g.addColorStop(1, css(laser, 0))
          ctx.fillStyle = g
          ctx.beginPath()
          ctx.arc(s.x, s.y, r, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.globalCompositeOperation = "lighter"
      }

      // ---- sparks: streaks that fall and skip off the floor ----
      if (sparkList.length) {
        const g = size * 9
        const floor = H * 0.9
        const paths = [new Path2D(), new Path2D(), new Path2D()]
        for (let i = sparkList.length - 1; i >= 0; i--) {
          const s = sparkList[i]
          s.age += dt
          if (s.age > s.life) {
            sparkList.splice(i, 1)
            continue
          }
          const t = dt / 1000
          s.vy += g * t
          s.vx *= 0.985
          s.x += s.vx * t
          s.y += s.vy * t
          if (s.y > floor && s.vy > 0) {
            s.y = floor
            s.vy *= -0.32
            s.vx *= 0.6
          }
          const k = s.age / s.life
          const path = paths[k < 0.25 ? 0 : k < 0.6 ? 1 : 2]
          path.moveTo(s.x, s.y)
          path.lineTo(s.x - s.vx * 0.016, s.y - s.vy * 0.016)
        }
        const sw = Math.max(1, size * 0.011)
        ctx.lineWidth = sw
        ctx.strokeStyle = css(white, 0.95)
        ctx.stroke(paths[0])
        ctx.strokeStyle = css(hot, 0.85)
        ctx.stroke(paths[1])
        ctx.strokeStyle = css(laser, 0.7)
        ctx.stroke(paths[2])
      }
      ctx.globalCompositeOperation = "source-over"

      raf = requestAnimationFrame(frame)
    }

    build()
    const ro = new ResizeObserver(() => build())
    ro.observe(root)
    raf = requestAnimationFrame(frame)
    return () => {
      stopped = true
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [name, durationMs, sparks, interactive, reduced, laserKey, hotKey])

  // ---- input --------------------------------------------------------------------
  const onActivate = () => {
    if (phaseRef.current === "write") rushRef.current = true
    else skipRef.current = true
  }
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = rootRef.current?.getBoundingClientRect()
    if (!r) return
    pointerRef.current = {
      x: e.clientX - r.left,
      y: e.clientY - r.top,
      on: e.pointerType !== "touch" || e.buttons > 0,
    }
  }
  const onPointerLeave = () => {
    pointerRef.current.on = false
  }

  const ready = phase === "hold" || phase === "exit" || phase === "fade"

  return (
    <div
      ref={rootRef}
      className={"slp-root " + className}
      data-phase={phase}
      style={
        {
          height,
          "--slp-bg": colors.background,
          "--slp-light": lightRgb.join(", "),
          "--slp-red": laserRgb.join(", "),
        } as React.CSSProperties
      }
    >
      <style>{SLP_CSS}</style>

      {!loop && children ? (
        <div className="slp-dest" aria-hidden={phase !== "exit" && phase !== "done"}>
          {children}
        </div>
      ) : null}

      {phase !== "done" ? (
        <div
          className="slp-gate"
          role="progressbar"
          aria-label={"Loading " + name}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          aria-valuetext={ready ? name + " — loaded" : pct + "%"}
          tabIndex={0}
          onClick={onActivate}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              onActivate()
            }
          }}
          onPointerMove={onPointerMove}
          onPointerDown={onPointerMove}
          onPointerUp={(e) => {
            if (e.pointerType === "touch") pointerRef.current.on = false
          }}
          onPointerLeave={onPointerLeave}
        >
          <div className="slp-cone" aria-hidden="true" />
          <div className="slp-pool" aria-hidden="true" />
          <div className="slp-spill" aria-hidden="true" />
          <div className="slp-streak" aria-hidden="true" />
          <div className="slp-lamp" aria-hidden="true" />
          <canvas ref={canvasRef} className="slp-canvas" aria-hidden="true" />
          <div className="slp-vignette" aria-hidden="true" />
          <div ref={grainRef} className="slp-grain" aria-hidden="true" />
          <span className="slp-sr" aria-live="polite">
            {ready ? name + " ready" : ""}
          </span>
        </div>
      ) : null}
    </div>
  )
}
