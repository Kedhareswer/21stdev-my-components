"use client"

import * as React from "react"

/**
 * Receipt Order Form — a contact form filled in on an order slip, which the
 * printer takes back and answers with a receipt.
 *
 * The slip hangs from the same chrome slot as the rest of the family. Name
 * and email are typed on dotted lines, services are line items with − / +
 * quantity keys, budget and timeline are bracketed options, the message is a
 * ruled box. A running tally at the bottom counts items and estimates weeks.
 * Press PRINT ORDER: missing fields print as inverted ERR lines; a valid
 * order is pulled up into the slot in steps and a confirmation receipt feeds
 * out with an order number, the lines you picked, the estimate, and a
 * barcode. NEW ORDER starts again.
 *
 * `onSubmit` receives the order. Return a promise and the printer waits for
 * it; throw and the slip comes back with the error printed on it.
 *
 * Nothing is loaded: the headline is a 5 × 7 bitmap drawn as SVG, the paper
 * an SVG turbulence tile.
 */

export type OrderService = {
  label: string
  /** Weeks per unit, for the estimate. */
  weeks?: number
  /** Most a visitor can order. */
  max?: number
}

export type OrderData = {
  name: string
  email: string
  company: string
  services: { label: string; qty: number }[]
  budget: string
  timeline: string
  message: string
  weeks: number
  orderNo: string
}

export type ReceiptOrderFormProps = {
  /** Pixel headline on the slip. */
  title?: string
  /** Pixel headline on the confirmation. */
  confirmTitle?: string
  /** Prefix of the order number, e.g. A-014. */
  series?: string
  /** First order number. */
  startNo?: number
  services?: OrderService[]
  budgets?: string[]
  timelines?: string[]
  /** Small print on the confirmation. */
  reply?: string
  /** Receives the order. May return a promise; a rejection is printed as an error. */
  onSubmit?: (order: OrderData) => void | Promise<void>
  width?: number
  /** Minimum height of the wall. Must be a definite length. */
  height?: string
  wall?: string
  paper?: string
  ink?: string
  fontMono?: string
  className?: string
}

// #region order
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

export const zigzagClip = (teeth: number, depth: number): string => {
  const n = Math.max(1, Math.round(teeth))
  const pts = ["0 0", "100% 0"]
  for (let i = n; i >= 0; i--) {
    const x = Math.round((i / n) * 10000) / 100 + "%"
    pts.push(i % 2 === 0 ? x + " calc(100% - " + depth + "px)" : x + " 100%")
  }
  return "polygon(" + pts.join(", ") + ")"
}

export const pad3 = (n: number): string => String(Math.max(0, Math.floor(n))).padStart(3, "0")

export const orderNumber = (series: string, n: number): string => (series ? series + "-" : "") + pad3(n)

/** Clamp a quantity to 0…max, whole units only. */
export const clampQty = (q: number, max: number): number => Math.max(0, Math.min(Math.max(0, max), Math.round(q) || 0))

/**
 * Weeks for an order. Work in parallel overlaps, so after the longest line
 * every other week counts at half: honest enough for a receipt.
 */
export const estimateWeeks = (lines: { qty: number; weeks: number }[]): number => {
  const spans = lines.filter((l) => l.qty > 0 && l.weeks > 0).map((l) => l.qty * l.weeks)
  if (!spans.length) return 0
  spans.sort((a, b) => b - a)
  const rest = spans.slice(1).reduce((s, w) => s + w, 0)
  return Math.ceil(spans[0] + rest / 2)
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type OrderErrors = Partial<Record<"name" | "email" | "services", string>>

/** What is wrong with an order, keyed by field. Empty means it can print. */
export const validateOrder = (o: { name: string; email: string; items: number; message: string }): OrderErrors => {
  const e: OrderErrors = {}
  if (!o.name.trim()) e.name = "Name required"
  if (!o.email.trim()) e.email = "Email required"
  else if (!EMAIL_RE.test(o.email.trim())) e.email = "Email looks wrong"
  if (o.items <= 0 && !o.message.trim()) e.services = "Pick a service or write a message"
  return e
}
// #endregion

const MONO = '"Courier Prime", "Courier New", Courier, FreeMono, "Nimbus Mono PS", "Liberation Mono", ui-monospace, monospace'

const PAPER_TILE =
  'url("data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="260" height="260"><filter id="p" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.018 0.026" numOctaves="5" seed="11" stitchTiles="stitch"/><feDiffuseLighting lighting-color="#ffffff" surfaceScale="2.4" diffuseConstant="1.05"><feDistantLight azimuth="235" elevation="58"/></feDiffuseLighting></filter><rect width="100%" height="100%" filter="url(#p)"/></svg>',
  ) +
  '")'

const DEFAULT_SERVICES: OrderService[] = [
  { label: "Logo design", weeks: 2, max: 3 },
  { label: "Brand identity", weeks: 5, max: 1 },
  { label: "Packaging", weeks: 3, max: 9 },
  { label: "Custom font", weeks: 8, max: 1 },
]

type Phase = "form" | "sending" | "printing" | "done"

const styles = [
  ".ro-root { position: relative; display: flex; align-items: flex-start; justify-content: center; overflow: clip; isolation: isolate; }",
  ".ro-shade { position: absolute; inset: 0; pointer-events: none; background: radial-gradient(120% 70% at 50% 0%, rgba(255,255,255,0.35), transparent 60%), radial-gradient(100% 80% at 50% 110%, rgba(0,0,0,0.12), transparent 60%); }",
  ".ro-rig { position: relative; margin: 28px 0 72px; }",
  ".ro-slot { position: absolute; left: -38px; right: -38px; top: 0; height: 58px; z-index: 3; pointer-events: none; }",
  ".ro-slot-back { position: absolute; left: 10px; right: 10px; top: 4px; height: 26px; border-radius: 6px 6px 2px 2px; background: linear-gradient(180deg, #f4f4f5, #c3c4c7 45%, #8d8f93); }",
  ".ro-slit { position: absolute; left: 34px; right: 34px; top: 22px; height: 8px; border-radius: 2px; background: linear-gradient(180deg, #0c0c0d, #2c2d30); box-shadow: inset 0 2px 2px rgba(0,0,0,0.8); }",
  ".ro-lip { position: absolute; left: 0; right: 0; top: 26px; height: 32px; border-radius: 4px 4px 7px 7px; background: linear-gradient(180deg, #8e9095 0%, #f7f7f8 14%, #d5d6d9 30%, #ffffff 44%, #a9abaf 62%, #e6e7e9 80%, #9a9ca0 100%); box-shadow: 0 10px 14px -6px rgba(0,0,0,0.35), 0 2px 3px rgba(0,0,0,0.2), inset 0 -1px 0 rgba(0,0,0,0.25); }",
  ".ro-lip::before, .ro-lip::after { content: ''; position: absolute; top: 5px; bottom: 5px; width: 22px; border-radius: 4px; background: linear-gradient(90deg, #b7b9bd, #f2f2f3 40%, #9fa1a5); box-shadow: inset 0 0 0 1px rgba(0,0,0,0.12); }",
  ".ro-lip::before { left: 6px; }",
  ".ro-lip::after { right: 6px; }",
  ".ro-led { position: absolute; right: 40px; top: 39px; width: 6px; height: 6px; border-radius: 50%; background: #1f4d2b; box-shadow: inset 0 0 0 1px rgba(0,0,0,0.4); }",
  ".ro-root[data-phase='sending'] .ro-led, .ro-root[data-phase='printing'] .ro-led { background: #52e37f; box-shadow: 0 0 6px #52e37f; animation: ro-blink 0.28s steps(2, end) infinite; }",
  ".ro-feed { position: relative; z-index: 2; margin-top: 30px; clip-path: inset(0 -400px -400vh -400px); container-type: inline-size; }",
  ".ro-paper { position: relative; filter: drop-shadow(0 1px 1px rgba(0,0,0,0.18)) drop-shadow(0 14px 18px rgba(0,0,0,0.16)); }",
  ".ro-root[data-phase='sending'] .ro-paper { animation: ro-in 1.1s steps(18, end) both; }",
  ".ro-root[data-phase='printing'] .ro-paper { animation: ro-out 1.8s steps(28, end) both; }",
  ".ro-slip { position: relative; background: var(--ro-paper); color: var(--ro-ink); font-family: var(--ro-mono); padding: 14px 7cqi 7cqi; font-size: 3.4cqi; line-height: 1.6; }",
  ".ro-slip::after { content: ''; position: absolute; inset: 0; background-image: var(--ro-tile); background-size: 260px 260px; opacity: 0.55; mix-blend-mode: multiply; pointer-events: none; }",
  ".ro-slip::before { content: ''; position: absolute; left: 0; right: 0; top: 0; height: 60px; background: linear-gradient(180deg, rgba(0,0,0,0.16), transparent); pointer-events: none; z-index: 1; }",
  ".ro-code { display: block; height: 6cqi; width: 100%; }",
  ".ro-title { margin-top: 9cqi; }",
  ".ro-bar { height: 2.2cqi; margin-top: 4cqi; background: currentColor; }",
  ".ro-meta { margin: 5cqi 0 0; text-align: center; font-size: 3.1cqi; line-height: 1.9; letter-spacing: 0.04em; text-transform: uppercase; }",
  ".ro-dash { height: max(2px, 0.55cqi); margin: 5.5cqi 0; background: repeating-linear-gradient(90deg, currentColor 0 3cqi, transparent 3cqi 5.4cqi); }",
  ".ro-h { margin: 0 0 2cqi; font-size: 3cqi; letter-spacing: 0.16em; text-transform: uppercase; }",
  ".ro-field { position: relative; z-index: 2; display: flex; align-items: baseline; gap: 2cqi; margin-bottom: 2.4cqi; text-transform: uppercase; }",
  ".ro-field label { flex: none; min-width: 19cqi; letter-spacing: 0.06em; }",
  ".ro-input { all: unset; box-sizing: border-box; flex: 1; min-width: 0; padding: 0.4cqi 0.6cqi; font: inherit; font-size: 4.2cqi; text-transform: none; background-image: radial-gradient(circle, currentColor 0.28cqi, transparent 0.38cqi); background-size: 1.5cqi 0.9cqi; background-repeat: repeat-x; background-position: left bottom; caret-color: currentColor; }",
  ".ro-input::placeholder { color: currentColor; opacity: 0.35; }",
  ".ro-input:focus-visible { outline: 2px dashed var(--ro-ink); outline-offset: 2px; }",
  ".ro-err { position: relative; z-index: 2; display: inline-block; margin: -1.2cqi 0 2.4cqi; padding: 0 1.4cqi; background: var(--ro-ink); color: var(--ro-paper); font-size: 2.9cqi; letter-spacing: 0.08em; text-transform: uppercase; animation: ro-err 0.3s steps(3, end) both; }",
  ".ro-line { position: relative; z-index: 2; display: flex; align-items: center; gap: 2cqi; font-size: 4.6cqi; line-height: 1.55; }",
  ".ro-line-l { white-space: nowrap; }",
  ".ro-dots { flex: 1; min-width: 3cqi; height: 1cqi; background-image: radial-gradient(circle, currentColor 0.3cqi, transparent 0.4cqi); background-size: 1.7cqi 1cqi; background-repeat: repeat-x; background-position: right center; }",
  ".ro-qty { display: flex; align-items: center; gap: 1cqi; font-variant-numeric: tabular-nums; }",
  ".ro-key { all: unset; box-sizing: border-box; display: grid; place-items: center; width: 5.6cqi; height: 5.6cqi; border: max(1px, 0.4cqi) solid currentColor; font-size: 3.6cqi; line-height: 1; cursor: pointer; user-select: none; }",
  ".ro-key:hover:not(:disabled), .ro-key:focus-visible { background: var(--ro-ink); color: var(--ro-paper); }",
  ".ro-key:focus-visible { outline: 2px dashed var(--ro-ink); outline-offset: 2px; }",
  ".ro-key:disabled { opacity: 0.3; cursor: default; }",
  ".ro-qty output { min-width: 3cqi; text-align: center; }",
  ".ro-opts { position: relative; z-index: 2; display: flex; flex-wrap: wrap; align-items: baseline; gap: 1cqi 2.4cqi; margin-bottom: 2.6cqi; text-transform: uppercase; }",
  ".ro-opts > span { min-width: 19cqi; letter-spacing: 0.06em; }",
  ".ro-opt { all: unset; box-sizing: border-box; cursor: pointer; padding: 0 0.8cqi; white-space: nowrap; }",
  ".ro-opt:hover, .ro-opt[aria-checked='true'] { background: var(--ro-ink); color: var(--ro-paper); }",
  ".ro-opt:focus-visible { outline: 2px dashed var(--ro-ink); outline-offset: 2px; }",
  ".ro-msg { all: unset; box-sizing: border-box; position: relative; z-index: 2; display: block; width: 100%; min-height: 26cqi; padding: 0 1cqi; font: inherit; font-size: 3.8cqi; line-height: 6.4cqi; background-image: linear-gradient(transparent calc(6.4cqi - 1px), color-mix(in srgb, currentColor 35%, transparent) calc(6.4cqi - 1px)); background-size: 100% 6.4cqi; background-attachment: local; resize: vertical; white-space: pre-wrap; }",
  ".ro-msg::placeholder { color: currentColor; opacity: 0.35; }",
  ".ro-msg:focus-visible { outline: 2px dashed var(--ro-ink); outline-offset: 2px; }",
  ".ro-tot { position: relative; z-index: 2; display: flex; justify-content: space-between; gap: 3cqi; font-size: 5.4cqi; line-height: 1.4; }",
  ".ro-print { all: unset; box-sizing: border-box; position: relative; z-index: 2; display: block; width: 100%; margin-top: 6cqi; padding: 3.4cqi; text-align: center; background: var(--ro-ink); color: var(--ro-paper); font-size: 4.2cqi; letter-spacing: 0.2em; text-transform: uppercase; cursor: pointer; box-shadow: 0 0.8cqi 0 color-mix(in srgb, var(--ro-ink) 40%, transparent); transition: transform 0.08s steps(2, end), box-shadow 0.08s steps(2, end); }",
  ".ro-print:hover { letter-spacing: 0.26em; }",
  ".ro-print:active { transform: translateY(0.8cqi); box-shadow: none; }",
  ".ro-print:focus-visible { outline: 2px dashed var(--ro-ink); outline-offset: 3px; }",
  ".ro-print[aria-busy='true'] { cursor: progress; }",
  ".ro-fine { margin-top: 4cqi; text-align: center; font-size: 2.6cqi; letter-spacing: 0.18em; text-transform: uppercase; }",
  ".ro-conf .ro-line { font-size: 4cqi; }",
  ".ro-code-foot { height: 9cqi; width: 70%; margin: 7cqi auto 2cqi; }",
  ".ro-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }",
  "@keyframes ro-in { from { transform: translateY(0); } to { transform: translateY(-102%); } }",
  "@keyframes ro-out { from { transform: translateY(-102%); } to { transform: translateY(0); } }",
  "@keyframes ro-err { from { clip-path: inset(0 100% 0 0); } to { clip-path: inset(0 0 0 0); } }",
  "@keyframes ro-blink { 50% { opacity: 0.35; } }",
  "@media (prefers-reduced-motion: reduce) {",
  "  .ro-root[data-phase] .ro-paper, .ro-err, .ro-root[data-phase] .ro-led { animation: none; }",
  "  .ro-print { transition: none; }",
  "}",
].join("\n")

function PixelText({ text }: { text: string }) {
  const { runs, cols } = React.useMemo(() => pixelRuns(text), [text])
  const cell = 1.18
  return (
    <svg viewBox={"0 0 " + Math.max(1, cols * cell) + " 7"} role="img" aria-label={text} shapeRendering="crispEdges" style={{ display: "block", width: "100%", height: "auto", maxWidth: "none" }}>
      {runs.map((r, i) => (
        <rect key={i} x={r.x * cell} y={r.y} width={r.w * cell + 0.03} height={1.03} fill="currentColor" />
      ))}
    </svg>
  )
}

function Barcode({ code, foot }: { code: string; foot?: boolean }) {
  const bars = React.useMemo(() => barcodeBars(code, 160), [code])
  return (
    <svg className={foot ? "ro-code ro-code-foot" : "ro-code"} viewBox="0 0 160 10" preserveAspectRatio="none" aria-hidden="true" style={{ maxWidth: "none" }}>
      {bars.map((b, i) => (
        <rect key={i} x={b.x} y={0} width={b.w} height={10} fill="currentColor" />
      ))}
    </svg>
  )
}

function Options({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  const refs = React.useRef<(HTMLButtonElement | null)[]>([])
  const onKey = (e: React.KeyboardEvent, i: number) => {
    const d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0
    if (!d) return
    e.preventDefault()
    const n = (i + d + options.length) % options.length
    onChange(options[n])
    refs.current[n]?.focus()
  }
  const current = Math.max(0, options.indexOf(value))
  return (
    <div className="ro-opts" role="radiogroup" aria-label={label}>
      <span aria-hidden="true">{label}</span>
      {options.map((o, i) => (
        <button
          key={o}
          ref={(el) => {
            refs.current[i] = el
          }}
          type="button"
          role="radio"
          aria-checked={value === o}
          tabIndex={i === current ? 0 : -1}
          className="ro-opt"
          onClick={() => onChange(o)}
          onKeyDown={(e) => onKey(e, i)}
        >
          {"[" + o + "]"}
        </button>
      ))}
    </div>
  )
}

export default function ReceiptOrderForm({
  title = "Order",
  confirmTitle = "Thanks!",
  series = "A",
  startNo = 1,
  services = DEFAULT_SERVICES,
  budgets = ["<5K", "5-15K", "15K+"],
  timelines = ["ASAP", "1-3 MO", "Flexible"],
  reply = "We reply within one working day",
  onSubmit,
  width = 460,
  height = "100svh",
  wall = "#e8e7e3",
  paper = "#f8f7f3",
  ink = "#141414",
  fontMono = MONO,
  className = "",
}: ReceiptOrderFormProps) {
  const uid = "ro" + React.useId().replace(/[^a-zA-Z0-9]/g, "")
  const [phase, setPhase] = React.useState<Phase>("form")
  const [reduced, setReduced] = React.useState(false)
  const [no, setNo] = React.useState(startNo)
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [company, setCompany] = React.useState("")
  const [qty, setQty] = React.useState<number[]>(() => services.map(() => 0))
  const [budget, setBudget] = React.useState(budgets[1] ?? budgets[0] ?? "")
  const [timeline, setTimeline] = React.useState(timelines[1] ?? timelines[0] ?? "")
  const [message, setMessage] = React.useState("")
  const [errors, setErrors] = React.useState<OrderErrors & { submit?: string }>({})
  const [sent, setSent] = React.useState<OrderData | null>(null)
  const [today, setToday] = React.useState("")
  const nameRef = React.useRef<HTMLInputElement>(null)
  const emailRef = React.useRef<HTMLInputElement>(null)
  const firstKey = React.useRef<HTMLButtonElement>(null)
  const againRef = React.useRef<HTMLButtonElement>(null)
  const pending = React.useRef<Promise<void> | null>(null)

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => setReduced(mq.matches)
    sync()
    mq.addEventListener("change", sync)
    return () => mq.removeEventListener("change", sync)
  }, [])

  React.useEffect(() => {
    const d = new Date()
    setToday(String(d.getDate()).padStart(2, "0") + "." + String(d.getMonth() + 1).padStart(2, "0") + "." + d.getFullYear())
  }, [])

  // Keyed on the count, so an inline services array doesn't reset every render.
  React.useEffect(() => {
    setQty((q) => (q.length === services.length ? q : services.map((_, i) => q[i] ?? 0)))
  }, [services.length])

  const lines = services.map((s, i) => ({ label: s.label, qty: qty[i] ?? 0, weeks: s.weeks ?? 0 }))
  const items = lines.reduce((s, l) => s + l.qty, 0)
  const weeks = estimateWeeks(lines)
  const number = orderNumber(series, no)

  const bump = (i: number, d: number) => {
    setQty((q) => q.map((v, k) => (k === i ? clampQty(v + d, services[i].max ?? 9) : v)))
    setErrors((e) => ({ ...e, services: undefined }))
  }

  const finish = React.useCallback(async () => {
    try {
      await pending.current
      if (reduced) setPhase("done")
      else setPhase("printing")
      window.setTimeout(() => againRef.current?.focus(), 50)
    } catch (err) {
      setSent(null)
      setPhase("form")
      setErrors({ submit: err instanceof Error ? err.message : "Could not send, try again" })
    }
  }, [reduced])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (phase !== "form") return
    const errs = validateOrder({ name, email, items, message })
    setErrors(errs)
    if (errs.name) return nameRef.current?.focus()
    if (errs.email) return emailRef.current?.focus()
    if (errs.services) return firstKey.current?.focus()
    const order: OrderData = {
      name: name.trim(),
      email: email.trim(),
      company: company.trim(),
      services: lines.filter((l) => l.qty > 0).map((l) => ({ label: l.label, qty: l.qty })),
      budget,
      timeline,
      message: message.trim(),
      weeks,
      orderNo: number,
    }
    pending.current = Promise.resolve().then(() => onSubmit?.(order))
    setSent(order)
    if (reduced) finish()
    else setPhase("sending")
  }

  const again = () => {
    setNo((n) => n + 1)
    setName("")
    setEmail("")
    setCompany("")
    setMessage("")
    setQty(services.map(() => 0))
    setErrors({})
    setSent(null)
    setPhase("form")
    window.setTimeout(() => nameRef.current?.focus(), 50)
  }

  const onAnimEnd = (e: React.AnimationEvent) => {
    if (e.target !== e.currentTarget) return
    if (phase === "sending") finish()
    else if (phase === "printing") setPhase("done")
  }

  const showConf = (phase === "printing" || phase === "done") && sent

  const rootStyle = {
    minHeight: height,
    background: wall,
    "--ro-paper": paper,
    "--ro-ink": ink,
    "--ro-mono": fontMono,
    "--ro-tile": PAPER_TILE,
  } as React.CSSProperties

  return (
    <section className={"ro-root w-full " + className} style={rootStyle} data-phase={phase} aria-label={title + " form"}>
      <style>{styles}</style>
      <div className="ro-shade" aria-hidden="true" />
      <div className="ro-rig" style={{ width: "min(" + width + "px, calc(100% - 96px))", minWidth: 260 }}>
        <div className="ro-slot" aria-hidden="true">
          <div className="ro-slot-back" />
          <div className="ro-slit" />
          <div className="ro-lip" />
          <span className="ro-led" />
        </div>
        <div className="ro-feed">
          <div className="ro-paper" onAnimationEnd={onAnimEnd}>
            {showConf && sent ? (
              <article className="ro-slip ro-conf" style={{ clipPath: zigzagClip(40, 7) }} aria-label="Order confirmation">
                <Barcode code={"CONF" + sent.orderNo} />
                <div className="ro-title">
                  <PixelText text={confirmTitle} />
                </div>
                <div className="ro-bar" aria-hidden="true" />
                <p className="ro-meta">
                  {"Order №" + sent.orderNo}
                  <br />
                  {"Date: " + (today || "--.--.----")}
                  <br />
                  {"Customer: " + sent.name}
                  {sent.company ? (
                    <>
                      <br />
                      {sent.company}
                    </>
                  ) : null}
                </p>
                <div className="ro-dash" aria-hidden="true" />
                {sent.services.length ? (
                  sent.services.map((s) => (
                    <div key={s.label} className="ro-line">
                      <span className="ro-line-l">{s.label}</span>
                      <span className="ro-dots" aria-hidden="true" />
                      <span>{"x" + s.qty}</span>
                    </div>
                  ))
                ) : (
                  <div className="ro-line">
                    <span className="ro-line-l">Message only</span>
                    <span className="ro-dots" aria-hidden="true" />
                    <span>x1</span>
                  </div>
                )}
                <div className="ro-line">
                  <span className="ro-line-l">Budget</span>
                  <span className="ro-dots" aria-hidden="true" />
                  <span>{sent.budget}</span>
                </div>
                <div className="ro-line">
                  <span className="ro-line-l">Timeline</span>
                  <span className="ro-dots" aria-hidden="true" />
                  <span>{sent.timeline}</span>
                </div>
                <div className="ro-dash" aria-hidden="true" />
                <div className="ro-tot">
                  <span>Est.</span>
                  <span>{sent.weeks ? sent.weeks + (sent.weeks === 1 ? " week" : " weeks") : "To discuss"}</span>
                </div>
                <Barcode code={sent.orderNo + sent.email} foot />
                <p className="ro-fine" style={{ marginTop: 0 }}>
                  {reply}
                  <br />
                  {"Copy sent to " + sent.email}
                </p>
                <button ref={againRef} type="button" className="ro-print" onClick={again}>
                  New order
                </button>
              </article>
            ) : (
              <form className="ro-slip" style={{ clipPath: zigzagClip(40, 7) }} onSubmit={submit} noValidate aria-describedby={errors.submit ? uid + "-submit" : undefined}>
                <Barcode code={"ORDER" + number} />
                <div className="ro-title">
                  <PixelText text={title} />
                </div>
                <div className="ro-bar" aria-hidden="true" />
                <p className="ro-meta">
                  New project request
                  <br />
                  {"Form №" + number}
                  <br />
                  {"Date: " + (today || "--.--.----")}
                </p>
                <div className="ro-dash" aria-hidden="true" />

                <div className="ro-field">
                  <label htmlFor={uid + "-name"}>Name</label>
                  <input
                    ref={nameRef}
                    id={uid + "-name"}
                    className="ro-input"
                    value={name}
                    autoComplete="name"
                    placeholder="Your name"
                    aria-invalid={errors.name ? true : undefined}
                    aria-describedby={errors.name ? uid + "-name-err" : undefined}
                    onChange={(e) => {
                      setName(e.target.value)
                      if (errors.name) setErrors((x) => ({ ...x, name: undefined }))
                    }}
                  />
                </div>
                {errors.name ? (
                  <span id={uid + "-name-err"} className="ro-err">
                    {"ERR: " + errors.name}
                  </span>
                ) : null}
                <div className="ro-field">
                  <label htmlFor={uid + "-email"}>Email</label>
                  <input
                    ref={emailRef}
                    id={uid + "-email"}
                    className="ro-input"
                    type="email"
                    value={email}
                    autoComplete="email"
                    placeholder="you@studio.com"
                    aria-invalid={errors.email ? true : undefined}
                    aria-describedby={errors.email ? uid + "-email-err" : undefined}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (errors.email) setErrors((x) => ({ ...x, email: undefined }))
                    }}
                  />
                </div>
                {errors.email ? (
                  <span id={uid + "-email-err"} className="ro-err">
                    {"ERR: " + errors.email}
                  </span>
                ) : null}
                <div className="ro-field">
                  <label htmlFor={uid + "-co"}>Company</label>
                  <input id={uid + "-co"} className="ro-input" value={company} autoComplete="organization" placeholder="Optional" onChange={(e) => setCompany(e.target.value)} />
                </div>

                <div className="ro-dash" aria-hidden="true" />
                <p className="ro-h">Services / Qty</p>
                {services.map((s, i) => {
                  const q = qty[i] ?? 0
                  const max = s.max ?? 9
                  return (
                    <div key={s.label} className="ro-line">
                      <span className="ro-line-l" id={uid + "-s" + i}>
                        {s.label}
                      </span>
                      <span className="ro-dots" aria-hidden="true" />
                      <span className="ro-qty">
                        <button ref={i === 0 ? firstKey : undefined} type="button" className="ro-key" disabled={q <= 0} aria-label={"Fewer " + s.label} onClick={() => bump(i, -1)}>
                          {"−"}
                        </button>
                        <output aria-labelledby={uid + "-s" + i} aria-live="polite">
                          {q}
                        </output>
                        <button type="button" className="ro-key" disabled={q >= max} aria-label={"More " + s.label} onClick={() => bump(i, 1)}>
                          +
                        </button>
                      </span>
                    </div>
                  )
                })}
                {errors.services ? <span className="ro-err" style={{ marginTop: "1.6cqi" }}>{"ERR: " + errors.services}</span> : null}

                <div className="ro-dash" aria-hidden="true" />
                <Options label="Budget" options={budgets} value={budget} onChange={setBudget} />
                <Options label="Timeline" options={timelines} value={timeline} onChange={setTimeline} />
                <label className="ro-h" htmlFor={uid + "-msg"} style={{ display: "block", marginTop: "3cqi" }}>
                  Message
                </label>
                <textarea
                  id={uid + "-msg"}
                  className="ro-msg"
                  rows={4}
                  value={message}
                  placeholder="Tell me about the project..."
                  onChange={(e) => {
                    setMessage(e.target.value)
                    if (errors.services) setErrors((x) => ({ ...x, services: undefined }))
                  }}
                />

                <div className="ro-dash" aria-hidden="true" />
                <div className="ro-line" style={{ fontSize: "3.6cqi" }}>
                  <span className="ro-line-l">Items</span>
                  <span className="ro-dots" aria-hidden="true" />
                  <span>{items}</span>
                </div>
                <div className="ro-tot">
                  <span>Est.</span>
                  <span>{weeks ? weeks + (weeks === 1 ? " week" : " weeks") : "–"}</span>
                </div>
                {errors.submit ? (
                  <span id={uid + "-submit"} className="ro-err" style={{ marginTop: "3cqi" }}>
                    {"ERR: " + errors.submit}
                  </span>
                ) : null}
                <button type="submit" className="ro-print" aria-busy={phase === "sending"}>
                  {"Print order ↵"}
                </button>
                <p className="ro-fine">** Keep the slip, we keep a copy **</p>
              </form>
            )}
          </div>
        </div>
      </div>
      <p className="ro-sr" aria-live="polite">
        {phase === "sending" ? "Sending order " + number : phase === "done" && sent ? "Order " + sent.orderNo + " confirmed" : ""}
      </p>
    </section>
  )
}
