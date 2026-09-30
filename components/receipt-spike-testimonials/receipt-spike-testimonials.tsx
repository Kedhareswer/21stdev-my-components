"use client"

import * as React from "react"

/**
 * Receipt Spike Testimonials — client reviews stuck on a receipt spike.
 *
 * Each testimonial is a torn slip, punched through near the top and stacked
 * on a steel spike, every slip at its own careless angle. The top slip is
 * the one you read: a review number, a row of pixel stars, the quote, and
 * the customer's details on dot leaders. Click the slip (or NEXT, or →) and
 * it is lifted up the spike, pulled off to the side and filed at the bottom
 * of the pile; PREV (or ←) brings the last one back down onto the spike.
 *
 * Nothing is loaded. The headline and stars are 5 × 7 bitmaps drawn as SVG,
 * the spike is SVG gradients, the paper an SVG turbulence tile, and the
 * angles are seeded from each slip, so the pile looks the same every visit.
 */

export type Testimonial = {
  quote: string
  name: string
  role?: string
  /** What the work was, printed as PROJECT. */
  project?: string
  /** Printed as DATE. */
  date?: string
  /** 0–5 stars. */
  rating?: number
}

export type ReceiptSpikeTestimonialsProps = {
  /** Pixel headline. A–Z, 0–9 and . - ! ? & ' / : are drawn. "" hides it. */
  title?: string
  testimonials?: Testimonial[]
  /** Number of the first review. */
  startNo?: number
  /** Move to the next slip every this many ms. 0 is off. Pauses on hover and focus. */
  autoplay?: number
  /** Slip width in px. It shrinks to fit. */
  width?: number
  /** Minimum height of the scene. Must be a definite length. */
  height?: string
  wall?: string
  paper?: string
  ink?: string
  /** Headline, counter and hint, which sit on the wall. Defaults to `ink`. */
  labelInk?: string
  fontMono?: string
  /** Called with the testimonial now on top. */
  onChange?: (index: number) => void
  className?: string
}

// #region spike
export const PIXEL_FONT: Record<string, string[]> = {
  A: [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  B: ["####.", "#...#", "#...#", "####.", "#...#", "#...#", "####."],
  C: [".####", "#....", "#....", "#....", "#....", "#....", ".####"],
  D: ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."],
  E: ["#####", "#....", "#....", "####.", "#....", "#....", "#####"],
  F: ["#####", "#....", "#....", "####.", "#....", "#....", "#...."],
  G: [".####", "#....", "#....", "#..##", "#...#", "#...#", ".####"],
  H: ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  I: [".###.", "..#..", "..#..", "..#..", "..#..", "..#..", ".###."],
  J: ["..###", "...#.", "...#.", "...#.", "...#.", "#..#.", ".##.."],
  K: ["#...#", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#"],
  L: ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
  M: ["#...#", "##.##", "#.#.#", "#.#.#", "#...#", "#...#", "#...#"],
  N: ["#...#", "##..#", "#.#.#", "#..##", "#...#", "#...#", "#...#"],
  O: [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  P: ["####.", "#...#", "#...#", "####.", "#....", "#....", "#...."],
  Q: [".###.", "#...#", "#...#", "#...#", "#.#.#", "#..#.", ".##.#"],
  R: ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"],
  S: [".####", "#....", "#....", ".###.", "....#", "....#", "####."],
  T: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
  U: ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  V: ["#...#", "#...#", "#...#", "#...#", ".#.#.", ".#.#.", "..#.."],
  W: ["#...#", "#...#", "#...#", "#.#.#", "#.#.#", "##.##", "#...#"],
  X: ["#...#", "#...#", ".#.#.", "..#..", ".#.#.", "#...#", "#...#"],
  Y: ["#...#", "#...#", ".#.#.", "..#..", "..#..", "..#..", "..#.."],
  Z: ["#####", "....#", "...#.", "..#..", ".#...", "#....", "#####"],
  "0": [".###.", "#...#", "#..##", "#.#.#", "##..#", "#...#", ".###."],
  "1": ["..#..", ".##..", "..#..", "..#..", "..#..", "..#..", ".###."],
  "2": [".###.", "#...#", "....#", "...#.", "..#..", ".#...", "#####"],
  "3": ["####.", "....#", "....#", ".###.", "....#", "....#", "####."],
  "4": ["#...#", "#...#", "#...#", "#####", "....#", "....#", "....#"],
  "5": ["#####", "#....", "####.", "....#", "....#", "#...#", ".###."],
  "6": [".###.", "#....", "#....", "####.", "#...#", "#...#", ".###."],
  "7": ["#####", "....#", "...#.", "..#..", "..#..", "..#..", "..#.."],
  "8": [".###.", "#...#", "#...#", ".###.", "#...#", "#...#", ".###."],
  "9": [".###.", "#...#", "#...#", ".####", "....#", "....#", ".###."],
  ".": [".....", ".....", ".....", ".....", ".....", ".....", "..#.."],
  "-": [".....", ".....", ".....", ".###.", ".....", ".....", "....."],
  "!": ["..#..", "..#..", "..#..", "..#..", "..#..", ".....", "..#.."],
  "?": [".###.", "#...#", "....#", "...#.", "..#..", ".....", "..#.."],
  "&": [".##..", "#..#.", "#.#..", ".#...", "#.#.#", "#..#.", ".##.#"],
  "'": ["..#..", "..#..", ".....", ".....", ".....", ".....", "....."],
  "/": ["....#", "....#", "...#.", "..#..", ".#...", "#....", "#...."],
  ":": [".....", "..#..", ".....", ".....", ".....", "..#..", "....."],
  " ": ["...", "...", "...", "...", "...", "...", "..."],
  "*": ["...#...", "...#...", "#######", ".#####.", "..###..", ".##.##.", ".#...#."],
}

export const pixelRuns = (text: string): { runs: { x: number; y: number; w: number }[]; cols: number } => {
  const runs: { x: number; y: number; w: number }[] = []
  let x = 0
  for (const raw of text.toUpperCase()) {
    const g = PIXEL_FONT[raw] ?? PIXEL_FONT[" "]
    for (let y = 0; y < 7; y++) {
      const row = g[y]
      let start = -1
      for (let c = 0; c <= row.length; c++) {
        const on = row[c] === "#"
        if (on && start < 0) start = c
        if (!on && start >= 0) {
          runs.push({ x: x + start, y, w: c - start })
          start = -1
        }
      }
    }
    x += g[0].length + 1
  }
  return { runs, cols: Math.max(0, x - 1) }
}

export const mulberry32 = (seed: number): (() => number) => {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const hashString = (s: string): number => {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export const barcodeBars = (code: string, width: number): { x: number; w: number }[] => {
  const rnd = mulberry32(hashString(code || "0"))
  const bars: { x: number; w: number }[] = []
  let x = 0
  while (x < width) {
    const w = 1 + Math.floor(rnd() * 3)
    if (x + w > width) break
    bars.push({ x, w })
    x += w + 1 + Math.floor(rnd() * 2)
  }
  return bars
}

/** Torn top and bottom edges: saw teeth on both ends of the slip. */
export const tornClip = (teeth: number, depth: number): string => {
  const n = Math.max(2, Math.round(teeth / 2) * 2)
  const pts: string[] = []
  for (let i = 0; i <= n; i++) {
    const x = Math.round((i / n) * 10000) / 100 + "%"
    pts.push(i % 2 === 0 ? x + " " + depth + "px" : x + " 0")
  }
  for (let i = n; i >= 0; i--) {
    const x = Math.round((i / n) * 10000) / 100 + "%"
    pts.push(i % 2 === 0 ? x + " calc(100% - " + depth + "px)" : x + " 100%")
  }
  return "polygon(" + pts.join(", ") + ")"
}

/** How a slip sits on the spike: a careless angle and a small slide, the same every time. */
export const slipPose = (seed: string, i: number): { rot: number; dx: number; dy: number } => {
  const rnd = mulberry32(hashString(seed + ":" + i))
  const side = i % 2 === 0 ? 1 : -1
  return {
    rot: Math.round(side * (2 + rnd() * 9) * 10) / 10,
    dx: Math.round((rnd() - 0.5) * 18),
    dy: Math.round(rnd() * 8),
  }
}

/** The pile after a slip is pulled off (dir 1: top to bottom) or put back (dir -1: bottom to top). */
export const rotate = (order: number[], dir: 1 | -1): number[] =>
  order.length < 2 ? order.slice() : dir === 1 ? [...order.slice(1), order[0]] : [order[order.length - 1], ...order.slice(0, -1)]

export const clampRating = (r: number | undefined): number => (r === undefined || !Number.isFinite(r) ? 5 : Math.max(0, Math.min(5, Math.round(r))))

export const pad3 = (n: number): string => String(Math.max(0, Math.floor(n))).padStart(3, "0")

/** Only the top few slips are drawn; the rest of the pile is hidden under them. */
export const VISIBLE = 5
// #endregion

const MONO = '"Courier Prime", "Courier New", Courier, FreeMono, "Nimbus Mono PS", "Liberation Mono", ui-monospace, monospace'

const PAPER_TILE =
  'url("data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="260" height="260"><filter id="p" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.02 0.03" numOctaves="5" seed="5" stitchTiles="stitch"/><feDiffuseLighting lighting-color="#ffffff" surfaceScale="2.6" diffuseConstant="1.05"><feDistantLight azimuth="235" elevation="58"/></feDiffuseLighting></filter><rect width="100%" height="100%" filter="url(#p)"/></svg>',
  ) +
  '")'

const DEFAULT_TESTIMONIALS: Testimonial[] = [
  { quote: "The only designer who sent the final invoice as a receipt. The identity is just as clear.", name: "Lena Ortiz", role: "Founder, Oat & Ember", project: "Branding", date: "03.2026", rating: 5 },
  { quote: "Twelve cans, one grid, zero arguments. Our shelf finally looks like one brand.", name: "Rui Matos", role: "Head roaster, Norte", project: "Packaging", date: "11.2025", rating: 5 },
  { quote: "Asked for a logo, got a system we still use for everything. Worth every revision round.", name: "Sam Achebe", role: "Director, Studio Halde", project: "Identity", date: "06.2025", rating: 5 },
  { quote: "Fast, funny, and allergic to lorem ipsum. Every draft came with real copy.", name: "Ines Kaur", role: "Editor, Paper Weekly", project: "Editorial", date: "02.2025", rating: 4 },
  { quote: "The festival posters were stolen off lamp posts within hours. Best compliment there is.", name: "Tom Varga", role: "Producer, Fika Fest", project: "Posters", date: "09.2024", rating: 5 },
  { quote: "We printed the brand book on thermal paper as a joke. People kept it.", name: "Mika Hale", role: "COO, Kiln", project: "Guidelines", date: "04.2024", rating: 5 },
]

const styles = [
  ".rs-root { position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 28px; overflow: clip; isolation: isolate; padding: 48px 16px; box-sizing: border-box; font-family: var(--rs-mono); color: var(--rs-ink); }",
  ".rs-shade { position: absolute; inset: 0; pointer-events: none; background: radial-gradient(90% 60% at 50% 45%, rgba(255,255,255,0.4), transparent 70%), radial-gradient(100% 80% at 50% 115%, rgba(0,0,0,0.14), transparent 60%); }",
  ".rs-head { position: relative; text-align: center; color: var(--rs-head); }",
  ".rs-head-t { width: min(360px, 78vw); margin: 0 auto; }",
  ".rs-head-m { margin-top: 12px; font-size: 11px; letter-spacing: 0.24em; text-transform: uppercase; opacity: 0.75; }",
  ".rs-stage { position: relative; margin-top: 48px; container-type: inline-size; }",
  ".rs-pile { display: grid; }",
  ".rs-slip { grid-area: 1 / 1; position: relative; transform-origin: 50% 38px; transform: translate(var(--dx), var(--dy)) rotate(var(--rot)); transition: transform 0.45s cubic-bezier(0.2, 0.9, 0.3, 1.2), filter 0.3s; filter: drop-shadow(0 1px 1px rgba(0,0,0,0.2)) drop-shadow(0 8px 10px rgba(0,0,0,0.12)); }",
  ".rs-slip[data-depth='0'] { cursor: pointer; }",
  ".rs-slip[data-depth='0']:hover { transform: translate(var(--dx), calc(var(--dy) - 4px)) rotate(var(--rot)); filter: drop-shadow(0 1px 1px rgba(0,0,0,0.2)) drop-shadow(0 14px 16px rgba(0,0,0,0.16)); }",
  ".rs-slip[data-hidden='true'] { visibility: hidden; }",
  ".rs-slip[data-anim='pull'] { animation: rs-pull 0.62s cubic-bezier(0.5, 0, 0.75, 0.3) both; pointer-events: none; }",
  ".rs-slip[data-anim='put'] { animation: rs-put 0.62s cubic-bezier(0.2, 0.8, 0.3, 1) both; }",
  ".rs-slip[data-anim='under'] { animation: rs-under 0.4s ease-out both; }",
  ".rs-paper { position: relative; background: var(--rs-paper); padding: 64px 8cqi 9cqi; font-size: 3.6cqi; line-height: 1.6; -webkit-mask: radial-gradient(circle 7px at 50% 38px, transparent 96%, #000 100%); mask: radial-gradient(circle 7px at 50% 38px, transparent 96%, #000 100%); }",
  ".rs-paper::after { content: ''; position: absolute; inset: 0; background-image: var(--rs-tile); background-size: 260px 260px; opacity: 0.55; mix-blend-mode: multiply; pointer-events: none; }",
  ".rs-ring { position: absolute; left: 50%; top: 38px; width: 22px; height: 22px; margin: -11px 0 0 -11px; border-radius: 50%; box-shadow: 0 0 0 1px rgba(0,0,0,0.08), inset 0 0 0 4px rgba(0,0,0,0.04); pointer-events: none; }",
  ".rs-top { display: flex; justify-content: space-between; align-items: center; gap: 4cqi; font-size: 3.1cqi; letter-spacing: 0.1em; text-transform: uppercase; }",
  ".rs-stars { width: 30cqi; flex: none; }",
  ".rs-dash { height: max(2px, 0.5cqi); margin: 5cqi 0; background: repeating-linear-gradient(90deg, currentColor 0 2.6cqi, transparent 2.6cqi 4.6cqi); }",
  ".rs-quote { margin: 0; font-size: 5.2cqi; line-height: 1.45; }",
  ".rs-quote::before { content: '\\201C'; }",
  ".rs-quote::after { content: '\\201D'; }",
  ".rs-kv { display: flex; align-items: baseline; gap: 1.8cqi; font-size: 3.3cqi; text-transform: uppercase; letter-spacing: 0.04em; }",
  ".rs-kv > span:first-child { flex: none; }",
  ".rs-kv > span:last-child { text-align: right; }",
  ".rs-dots { flex: 1; min-width: 3cqi; height: 0.9cqi; align-self: center; background-image: radial-gradient(circle, currentColor 0.26cqi, transparent 0.36cqi); background-size: 1.5cqi 0.9cqi; background-repeat: repeat-x; background-position: right center; }",
  ".rs-code { display: block; height: 8cqi; width: 58%; margin: 6cqi auto 0; }",
  ".rs-spike { position: absolute; left: 50%; top: 38px; width: 120px; height: 120px; margin: -100px 0 0 -60px; pointer-events: none; z-index: 50; overflow: visible; }",
  ".rs-controls { position: relative; display: flex; align-items: center; gap: 18px; font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--rs-head); }",
  ".rs-key { all: unset; box-sizing: border-box; padding: 8px 14px; background: var(--rs-paper); color: var(--rs-ink); cursor: pointer; box-shadow: 0 1px 1px rgba(0,0,0,0.2), 0 4px 0 color-mix(in srgb, var(--rs-ink) 30%, transparent); transition: transform 0.08s steps(2, end), box-shadow 0.08s steps(2, end); }",
  ".rs-key:hover { background: var(--rs-ink); color: var(--rs-paper); }",
  ".rs-key:active { transform: translateY(3px); box-shadow: 0 1px 1px rgba(0,0,0,0.2); }",
  ".rs-key:focus-visible { outline: 2px dashed currentColor; outline-offset: 3px; }",
  ".rs-count { min-width: 76px; text-align: center; font-variant-numeric: tabular-nums; }",
  ".rs-hint { position: relative; margin: -14px 0 0; font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase; opacity: 0.6; color: var(--rs-head); }",
  ".rs-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }",
  "@keyframes rs-pull { 0% { transform: translate(var(--dx), var(--dy)) rotate(var(--rot)); opacity: 1; } 35% { transform: translate(var(--dx), calc(var(--dy) - 34px)) rotate(var(--rot)) scale(1.02); opacity: 1; } 100% { transform: translate(calc(var(--dx) + 120%), -60px) rotate(calc(var(--rot) + 22deg)); opacity: 0; } }",
  "@keyframes rs-put { 0% { transform: translate(calc(var(--dx) - 120%), -60px) rotate(calc(var(--rot) - 22deg)); opacity: 0; } 60% { transform: translate(var(--dx), calc(var(--dy) - 34px)) rotate(var(--rot)) scale(1.02); opacity: 1; } 100% { transform: translate(var(--dx), var(--dy)) rotate(var(--rot)); opacity: 1; } }",
  "@keyframes rs-under { from { opacity: 0; } to { opacity: 1; } }",
  "@media (prefers-reduced-motion: reduce) {",
  "  .rs-slip, .rs-key { transition: none; }",
  "  .rs-slip[data-anim] { animation: none; }",
  "}",
].join("\n")

function PixelText({ text, label, cell = 1.18 }: { text: string; label?: string; cell?: number }) {
  const { runs, cols } = React.useMemo(() => pixelRuns(text), [text])
  return (
    <svg viewBox={"0 0 " + Math.max(1, cols * cell) + " 7"} role="img" aria-label={label ?? text} shapeRendering="crispEdges" style={{ display: "block", width: "100%", height: "auto", maxWidth: "none" }}>
      {runs.map((r, i) => (
        <rect key={i} x={r.x * cell} y={r.y} width={r.w * cell + 0.03} height={1.03} fill="currentColor" />
      ))}
    </svg>
  )
}

function Stars({ rating }: { rating: number }) {
  const { runs } = React.useMemo(() => pixelRuns("*"), [])
  return (
    <svg className="rs-stars" viewBox="0 0 39 7" role="img" aria-label={rating + " out of 5 stars"} shapeRendering="crispEdges" style={{ maxWidth: "none" }}>
      {[0, 1, 2, 3, 4].map((s) => (
        <g key={s} transform={"translate(" + s * 8 + " 0)"} opacity={s < rating ? 1 : 0.18}>
          {runs.map((r, i) => (
            <rect key={i} x={r.x} y={r.y} width={r.w + 0.03} height={1.03} fill="currentColor" />
          ))}
        </g>
      ))}
    </svg>
  )
}

function Barcode({ code }: { code: string }) {
  const bars = React.useMemo(() => barcodeBars(code, 160), [code])
  return (
    <svg className="rs-code" viewBox="0 0 160 10" preserveAspectRatio="none" aria-hidden="true" style={{ maxWidth: "none" }}>
      {bars.map((b, i) => (
        <rect key={i} x={b.x} y={0} width={b.w} height={10} fill="currentColor" />
      ))}
    </svg>
  )
}

/** The steel spike, seen from above and a little in front, and its shadow on the pile. */
function Spike({ uid }: { uid: string }) {
  return (
    <svg className="rs-spike" viewBox="-60 -100 120 120" aria-hidden="true">
      <defs>
        <linearGradient id={uid + "-steel"} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#6d6f73" />
          <stop offset="0.35" stopColor="#f4f5f6" />
          <stop offset="0.55" stopColor="#b8babe" />
          <stop offset="1" stopColor="#55575b" />
        </linearGradient>
        <radialGradient id={uid + "-hole"} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.55" stopColor="#000" stopOpacity="0.55" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <filter id={uid + "-blur"} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.2" />
        </filter>
      </defs>
      <path d="M-2.6 0 L34 22 L36 18 L2.6 -2 Z" fill="#000" opacity="0.28" filter={"url(#" + uid + "-blur)"} />
      <circle cx="0" cy="0" r="8" fill={"url(#" + uid + "-hole)"} />
      <path d="M-3.4 0 L-0.4 -86 L0.4 -86 L3.4 0 Z" fill={"url(#" + uid + "-steel)"} />
      <path d="M-1 -30 L-0.3 -80" stroke="#ffffff" strokeWidth="0.8" strokeLinecap="round" opacity="0.8" />
      <ellipse cx="0" cy="0" rx="3.6" ry="1.4" fill="#3d3f43" />
    </svg>
  )
}

export default function ReceiptSpikeTestimonials({
  title = "Kind words",
  testimonials = DEFAULT_TESTIMONIALS,
  startNo = 1,
  autoplay = 0,
  width = 380,
  height = "100svh",
  wall = "#e8e7e3",
  paper = "#f8f7f3",
  ink = "#141414",
  labelInk,
  fontMono = MONO,
  onChange,
  className = "",
}: ReceiptSpikeTestimonialsProps) {
  const uid = "rs" + React.useId().replace(/[^a-zA-Z0-9]/g, "")
  const n = testimonials.length
  const [order, setOrder] = React.useState<number[]>(() => testimonials.map((_, i) => i))
  const [anim, setAnim] = React.useState<{ i: number; kind: "pull" | "put" | "under" } | null>(null)
  const [reduced, setReduced] = React.useState(false)
  const [paused, setPaused] = React.useState(false)
  const busy = React.useRef(false)

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => setReduced(mq.matches)
    sync()
    mq.addEventListener("change", sync)
    return () => mq.removeEventListener("change", sync)
  }, [])

  React.useEffect(() => {
    setOrder((o) => (o.length === n ? o : Array.from({ length: n }, (_, i) => i)))
  }, [n])

  const top = order[0] ?? 0

  const next = React.useCallback(() => {
    if (n < 2 || busy.current) return
    if (reduced) {
      const o = rotate(order, 1)
      setOrder(o)
      onChange?.(o[0])
      return
    }
    busy.current = true
    setAnim({ i: order[0], kind: "pull" })
  }, [n, reduced, order, onChange])

  const prev = React.useCallback(() => {
    if (n < 2 || busy.current) return
    const o = rotate(order, -1)
    setOrder(o)
    onChange?.(o[0])
    if (reduced) return
    busy.current = true
    setAnim({ i: o[0], kind: "put" })
  }, [n, reduced, order, onChange])

  const onAnimEnd = (e: React.AnimationEvent, i: number) => {
    if (e.target !== e.currentTarget || !anim || anim.i !== i) return
    if (anim.kind === "pull") {
      const o = rotate(order, 1)
      setOrder(o)
      onChange?.(o[0])
      setAnim({ i, kind: "under" })
      busy.current = false
    } else {
      setAnim(null)
      busy.current = false
    }
  }

  React.useEffect(() => {
    if (!autoplay || paused || n < 2) return
    const t = window.setInterval(next, Math.max(1500, autoplay))
    return () => window.clearInterval(t)
  }, [autoplay, paused, n, next])

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault()
      next()
    } else if (e.key === "ArrowLeft") {
      e.preventDefault()
      prev()
    }
  }

  const rootStyle = {
    minHeight: height,
    background: wall,
    "--rs-paper": paper,
    "--rs-ink": ink,
    "--rs-head": labelInk ?? ink,
    "--rs-mono": fontMono,
    "--rs-tile": PAPER_TILE,
  } as React.CSSProperties

  const t = testimonials[top]

  return (
    <section
      className={"rs-root w-full " + className}
      style={rootStyle}
      aria-roledescription="carousel"
      aria-label={(title || "Testimonials") + ", " + n + " reviews"}
      onKeyDown={onKey}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <style>{styles}</style>
      <div className="rs-shade" aria-hidden="true" />
      {title ? (
        <header className="rs-head">
          <div className="rs-head-t">
            <PixelText text={title} />
          </div>
          <div className="rs-head-m">{"Reviews on file: " + String(n).padStart(2, "0")}</div>
        </header>
      ) : null}

      <div className="rs-stage" style={{ width: "min(" + width + "px, 100%)" }}>
        <div className="rs-pile">
          {testimonials.map((item, i) => {
            const depth = order.indexOf(i)
            const pose = slipPose(item.name + item.quote.length, i)
            const isAnim = anim && anim.i === i ? anim.kind : undefined
            const hidden = depth >= VISIBLE && !isAnim
            const style = {
              "--rot": pose.rot + "deg",
              "--dx": pose.dx + "px",
              "--dy": pose.dy + "px",
              zIndex: isAnim === "pull" || isAnim === "put" ? n + 2 : n - depth,
            } as React.CSSProperties
            return (
              <article
                key={i}
                className="rs-slip"
                style={style}
                data-depth={depth}
                data-hidden={hidden ? "true" : "false"}
                data-anim={isAnim}
                aria-hidden={depth === 0 ? undefined : true}
                aria-roledescription="slide"
                aria-label={"Review from " + item.name}
                onClick={depth === 0 ? next : undefined}
                onAnimationEnd={(e) => onAnimEnd(e, i)}
              >
                <div className="rs-paper" style={{ clipPath: tornClip(34, 6) }}>
                  <span className="rs-ring" aria-hidden="true" />
                  <div className="rs-top">
                    <span>{"Review №" + pad3(startNo + i)}</span>
                    <Stars rating={clampRating(item.rating)} />
                  </div>
                  <div className="rs-dash" aria-hidden="true" />
                  <blockquote className="rs-quote">{item.quote}</blockquote>
                  <div className="rs-dash" aria-hidden="true" />
                  <div className="rs-kv">
                    <span>Customer</span>
                    <span className="rs-dots" aria-hidden="true" />
                    <span>{item.name}</span>
                  </div>
                  {item.role ? (
                    <div className="rs-kv">
                      <span>Role</span>
                      <span className="rs-dots" aria-hidden="true" />
                      <span>{item.role}</span>
                    </div>
                  ) : null}
                  {item.project ? (
                    <div className="rs-kv">
                      <span>Project</span>
                      <span className="rs-dots" aria-hidden="true" />
                      <span>{item.project}</span>
                    </div>
                  ) : null}
                  {item.date ? (
                    <div className="rs-kv">
                      <span>Date</span>
                      <span className="rs-dots" aria-hidden="true" />
                      <span>{item.date}</span>
                    </div>
                  ) : null}
                  <Barcode code={item.name + i} />
                </div>
              </article>
            )
          })}
        </div>
        {n ? <Spike uid={uid} /> : null}
      </div>

      {n > 1 ? (
        <>
          <div className="rs-controls">
            <button type="button" className="rs-key" onClick={prev} aria-label="Previous review">
              {"◂ Prev"}
            </button>
            <span className="rs-count" aria-hidden="true">
              {String(top + 1).padStart(2, "0") + " / " + String(n).padStart(2, "0")}
            </span>
            <button type="button" className="rs-key" onClick={next} aria-label="Next review">
              {"Next ▸"}
            </button>
          </div>
          <p className="rs-hint" aria-hidden="true">
            Click the slip to pull it off
          </p>
        </>
      ) : null}

      <p className="rs-sr" aria-live="polite">
        {t ? "Review " + (top + 1) + " of " + n + ", from " + t.name + ": " + t.quote : ""}
      </p>
    </section>
  )
}
