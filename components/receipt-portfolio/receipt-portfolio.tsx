"use client"

import * as React from "react"

/**
 * Receipt Portfolio — a one-page portfolio printed on a till roll.
 *
 * A chrome printer slot is screwed to the wall. When the piece scrolls into
 * view it feeds out a thermal receipt in jerky steps: a pixel-font headline, a
 * heavy rule, the receipt header, and one line item per section of the
 * portfolio, dot leaders running to a three-digit code. Click a line item and
 * the roll feeds a little more paper to print what is inside: dithered
 * illustrations, specs with leaders, tags and links. Pull the strip at the
 * bottom (or press FEED on the printer) and the receipt tears off, falls, and
 * the next copy prints with the receipt number bumped.
 *
 * Nothing is loaded. The headline face is a 5 × 7 bitmap drawn as SVG runs,
 * the illustrations are vector shapes filled with 4 × 4 Bayer dither patterns,
 * the crumpled paper is an SVG turbulence tile, and the barcode is seeded from
 * its text — so it looks the same everywhere and needs no font or image.
 */

export type ReceiptArt = "portrait" | "marks" | "brand" | "box" | "glyphs" | "stamp"

export type ReceiptBlock =
  /** A paragraph of small print. */
  | { type: "text"; text: string }
  /** A label, a dot leader, a value. With `href` the value is a link. */
  | { type: "row"; label: string; value: string; href?: string }
  /** One of the built-in dithered drawings. */
  | { type: "art"; art: ReceiptArt; caption?: string }
  /** Your own picture, printed through a halftone screen. */
  | { type: "image"; src: string; alt: string; caption?: string }
  /** Bracketed chips: [BRAND] [PRINT]. */
  | { type: "tags"; items: string[] }
  /** A dashed rule. */
  | { type: "rule" }

export type ReceiptItem = {
  label: string
  /** Right-hand code. Defaults to the item's position, 001, 002, … */
  code?: string
  /** What prints when the item is opened. No blocks, no toggle. */
  blocks?: ReceiptBlock[]
}

export type ReceiptPortfolioProps = {
  /** Pixel headline. A–Z, 0–9 and . - ! ? & ' / : are drawn. */
  title?: string
  /** First receipt number. Each reprint adds one. */
  receiptNo?: number
  /** Printed after DATE:. Defaults to today, DD.MM.YYYY. */
  date?: string
  cashier?: string
  terminal?: string
  /** Italic note between the header and the items. Newlines are kept. */
  note?: string
  items?: ReceiptItem[]
  totalLabel?: string
  totalValue?: string
  /** Small print under the total barcode. "" hides it. */
  footer?: string
  /** Item open on first print. -1 for none. */
  defaultOpen?: number
  /** Feed the receipt out of the slot when it scrolls into view. */
  print?: boolean
  /** Show the pull-to-tear strip and the FEED button. */
  tearable?: boolean
  /** Receipt width in px. It shrinks to fit narrow screens. */
  width?: number
  /** Minimum height of the wall. Must be a definite length. */
  height?: string
  wall?: string
  paper?: string
  ink?: string
  /** Monospace stack for everything but the headline. No font is loaded. */
  fontMono?: string
  /** Called with the opened item's index, or -1 when it closes. */
  onOpen?: (index: number) => void
  /** Called with the new receipt number after a tear. */
  onReprint?: (receiptNo: number) => void
  className?: string
}

// #region receipt
/** 5 × 7 bitmap. '#' is ink. Space is 3 wide, everything else 5. */
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

/**
 * Horizontal ink runs for `text`, one rect each, so a word is a few dozen
 * rects instead of hundreds of pixels and never shows hairline seams.
 * Unknown characters print as a space.
 */
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

/** The classic 4 × 4 ordered-dither threshold map. */
export const BAYER4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
]

/** Inked cells of a 4 × 4 tile at `level` sixteenths of coverage. */
export const ditherCells = (level: number): [number, number][] => {
  const cells: [number, number][] = []
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) if (BAYER4[y][x] < level) cells.push([x, y])
  return cells
}

/** Coverage, in sixteenths, of the four dither fills d1…d4. */
export const DITHER_LEVELS = [2, 4, 8, 12] as const

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

/** Bars packed into `width`. Same text, same bars. */
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

/** A clip-path with a torn, saw-tooth bottom edge. */
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

export const formatDate = (d: Date): string =>
  String(d.getDate()).padStart(2, "0") + "." + String(d.getMonth() + 1).padStart(2, "0") + "." + d.getFullYear()

/** Seconds to feed `px` of paper: long receipts print longer, within reason. */
export const feedSeconds = (px: number): number => Math.min(3.2, Math.max(1.4, px / 520))

/** How far the paper gives when pulled `d` px: stiff, and never past `limit`. */
export const rubber = (d: number, limit: number): number => (d > 0 ? limit * (1 - 1 / (d / (limit * 1.6) + 1)) : 0)

/** A pull this long tears the receipt off. */
export const TEAR_AT = 96
// #endregion

const MONO = '"Courier Prime", "Courier New", Courier, FreeMono, "Nimbus Mono PS", "Liberation Mono", ui-monospace, monospace'

/** Crumpled-paper tile: lit turbulence, stitched so it repeats without seams. */
const PAPER_TILE =
  'url("data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="260" height="260"><filter id="p" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.018 0.026" numOctaves="5" seed="7" stitchTiles="stitch"/><feDiffuseLighting lighting-color="#ffffff" surfaceScale="2.6" diffuseConstant="1.05"><feDistantLight azimuth="235" elevation="58"/></feDiffuseLighting></filter><rect width="100%" height="100%" filter="url(#p)"/></svg>',
  ) +
  '")'

const DEFAULT_ITEMS: ReceiptItem[] = [
  {
    label: "About me",
    blocks: [
      { type: "art", art: "portrait", caption: "The designer, dithered" },
      {
        type: "text",
        text: "Independent graphic designer. I make identities that fit on a receipt and still hold up on a billboard: simple marks, honest type, a little humour.",
      },
      { type: "row", label: "Based in", value: "Lisbon, PT" },
      { type: "row", label: "Practice", value: "Est. 2017" },
      { type: "row", label: "Clients", value: "40+" },
      { type: "row", label: "Status", value: "Booking Q1" },
    ],
  },
  {
    label: "Logofolio",
    blocks: [
      { type: "art", art: "marks", caption: "Selected marks, 2019 to 2026" },
      { type: "row", label: "Marks shipped", value: "48" },
      { type: "row", label: "Average concepts", value: "3" },
      { type: "row", label: "Rounds of revision", value: "2" },
      { type: "tags", items: ["Monograms", "Symbols", "Wordmarks"] },
    ],
  },
  {
    label: "Branding",
    blocks: [
      { type: "art", art: "brand", caption: "Oat & Ember, stationery set" },
      { type: "row", label: "Oat & Ember", value: "2026" },
      { type: "row", label: "Norte Coffee", value: "2025" },
      { type: "row", label: "Studio Halde", value: "2024" },
      { type: "text", text: "Full identities: strategy, mark, type, colour, and the rules that keep them together." },
      { type: "tags", items: ["Identity", "Guidelines", "Print"] },
    ],
  },
  {
    label: "Packaging",
    blocks: [
      { type: "art", art: "box", caption: "Mailer box and can, Norte Coffee" },
      { type: "row", label: "SKUs designed", value: "112" },
      { type: "row", label: "Dielines drawn", value: "37" },
      { type: "row", label: "Shelf tests won", value: "9/11" },
      { type: "tags", items: ["Dielines", "Labels", "Print-ready"] },
    ],
  },
  {
    label: "Font",
    blocks: [
      { type: "art", art: "glyphs", caption: "Till Sans, a 5 × 7 display face" },
      { type: "text", text: "A bitmap display face drawn for this receipt. Uppercase, figures and the punctuation a till needs." },
      { type: "row", label: "Glyphs", value: "47" },
      { type: "row", label: "Grid", value: "5 × 7" },
      { type: "row", label: "Licence", value: "Free" },
    ],
  },
  {
    label: "Contacts",
    blocks: [
      { type: "art", art: "stamp", caption: "Stamped and approved" },
      { type: "row", label: "Email", value: "hello@example.com", href: "mailto:hello@example.com" },
      { type: "row", label: "Instagram", value: "@till.roll", href: "#" },
      { type: "row", label: "Behance", value: "/till-roll", href: "#" },
      { type: "row", label: "Telegram", value: "@tillroll", href: "#" },
      { type: "text", text: "Replies within one working day. Coffee is on me if you are in town." },
    ],
  },
]

const styles = [
  ".rp-root { position: relative; display: flex; align-items: flex-start; justify-content: center; overflow: clip; isolation: isolate; }",
  ".rp-door { position: absolute; inset: 18px; border-radius: 6px; pointer-events: none; box-shadow: inset 0 0 0 1px rgba(255,255,255,0.55), inset 0 2px 0 rgba(255,255,255,0.7), inset 0 -2px 0 rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.05); }",
  ".rp-shade { position: absolute; inset: 0; pointer-events: none; background: radial-gradient(120% 70% at 50% 0%, rgba(255,255,255,0.35), transparent 60%), radial-gradient(100% 80% at 50% 110%, rgba(0,0,0,0.12), transparent 60%); }",
  ".rp-rig { position: relative; margin: 28px 0 96px; }",
  ".rp-slot { position: absolute; left: -38px; right: -38px; top: 0; height: 58px; z-index: 3; pointer-events: none; }",
  ".rp-slot-back { position: absolute; left: 10px; right: 10px; top: 4px; height: 26px; border-radius: 6px 6px 2px 2px; background: linear-gradient(180deg, #f4f4f5, #c3c4c7 45%, #8d8f93); box-shadow: 0 1px 0 rgba(255,255,255,0.8) inset; }",
  ".rp-slit { position: absolute; left: 34px; right: 34px; top: 22px; height: 8px; border-radius: 2px; background: linear-gradient(180deg, #0c0c0d, #2c2d30); box-shadow: inset 0 2px 2px rgba(0,0,0,0.8); }",
  ".rp-lip { position: absolute; left: 0; right: 0; top: 26px; height: 32px; border-radius: 4px 4px 7px 7px; background: linear-gradient(180deg, #8e9095 0%, #f7f7f8 14%, #d5d6d9 30%, #ffffff 44%, #a9abaf 62%, #e6e7e9 80%, #9a9ca0 100%); box-shadow: 0 10px 14px -6px rgba(0,0,0,0.35), 0 2px 3px rgba(0,0,0,0.2), inset 0 -1px 0 rgba(0,0,0,0.25); }",
  ".rp-lip::before, .rp-lip::after { content: ''; position: absolute; top: 5px; bottom: 5px; width: 22px; border-radius: 4px; background: linear-gradient(90deg, #b7b9bd, #f2f2f3 40%, #9fa1a5); box-shadow: inset 0 0 0 1px rgba(0,0,0,0.12); }",
  ".rp-lip::before { left: 6px; }",
  ".rp-lip::after { right: 6px; }",
  ".rp-feedbtn { pointer-events: auto; position: absolute; right: 36px; top: 34px; height: 16px; display: flex; align-items: center; gap: 5px; padding: 0 7px 0 5px; border-radius: 3px; border: 0; background: linear-gradient(180deg, #3a3b3e, #151516); color: #d8d8da; font: 700 8px/1 var(--rp-mono); letter-spacing: 0.14em; cursor: pointer; box-shadow: 0 1px 0 rgba(255,255,255,0.6), inset 0 1px 0 rgba(255,255,255,0.15); }",
  ".rp-feedbtn:active { transform: translateY(1px); }",
  ".rp-feedbtn:focus-visible { outline: 2px solid var(--rp-ink); outline-offset: 2px; }",
  ".rp-led { width: 6px; height: 6px; border-radius: 50%; background: #1f4d2b; box-shadow: inset 0 0 0 1px rgba(0,0,0,0.4); }",
  ".rp-root[data-phase='printing'] .rp-led, .rp-root[data-phase='falling'] .rp-led { background: #52e37f; box-shadow: 0 0 6px #52e37f; animation: rp-blink 0.28s steps(2, end) infinite; }",
  ".rp-feed { position: relative; z-index: 2; margin-top: 30px; clip-path: inset(0 -400px -400vh -400px); }",
  ".rp-paper { position: relative; container-type: inline-size; filter: drop-shadow(0 1px 1px rgba(0,0,0,0.18)) drop-shadow(0 14px 18px rgba(0,0,0,0.16)); will-change: transform; }",
  ".rp-paper::before { content: ''; position: absolute; left: 0; right: 0; bottom: 100%; height: 120px; background: var(--rp-paper); }",
  ".rp-root[data-phase='waiting'] .rp-paper { transform: translateY(-102%); }",
  ".rp-root[data-phase='printing'] .rp-paper { animation: rp-feed var(--rp-dur, 2s) steps(var(--rp-steps, 32), end) both; }",
  ".rp-root[data-phase='falling'] .rp-paper { transition: transform 0.95s cubic-bezier(0.55, 0, 0.9, 0.45), opacity 0.95s ease-in; opacity: 0; }",
  ".rp-root[data-drag='true'] .rp-paper { transition: none; }",
  ".rp-root[data-phase='ready'][data-drag='false'] .rp-paper { transition: transform 0.5s cubic-bezier(0.2, 1.6, 0.4, 1); }",
  ".rp-receipt { position: relative; background: var(--rp-paper); color: var(--rp-ink); font-family: var(--rp-mono); padding: 14px 7cqi 5cqi; }",
  ".rp-receipt::after { content: ''; position: absolute; inset: 0; background-image: var(--rp-tile); background-size: 260px 260px; opacity: 0.55; mix-blend-mode: multiply; pointer-events: none; }",
  ".rp-receipt::before { content: ''; position: absolute; left: 0; right: 0; top: 0; height: 60px; background: linear-gradient(180deg, rgba(0,0,0,0.16), transparent); pointer-events: none; z-index: 1; }",
  ".rp-code { display: block; height: 7cqi; overflow: visible; }",
  ".rp-title { margin-top: 11cqi; }",
  ".rp-bar { height: 2.4cqi; margin-top: 4.5cqi; background: currentColor; }",
  ".rp-meta { margin: 7cqi 0 0; text-align: center; font-size: 3.3cqi; line-height: 1.95; letter-spacing: 0.04em; text-transform: uppercase; }",
  ".rp-dash { height: max(2px, 0.55cqi); margin: 6.5cqi 0; background: repeating-linear-gradient(90deg, currentColor 0 3cqi, transparent 3cqi 5.4cqi); }",
  ".rp-note { margin: 0; text-align: center; font-size: 3.5cqi; line-height: 1.75; font-style: italic; white-space: pre-line; }",
  ".rp-items { list-style: none; margin: 0; padding: 0; }",
  ".rp-row { all: unset; box-sizing: border-box; display: flex; align-items: baseline; gap: 2.4cqi; width: calc(100% + 2.4cqi); margin: 0 -1.2cqi; padding: 0.2cqi 1.2cqi; font-size: 6.3cqi; line-height: 1.42; cursor: pointer; transition: background-color 0.12s steps(2, end), color 0.12s steps(2, end); }",
  ".rp-row[aria-disabled='true'] { cursor: default; }",
  ".rp-row:hover:not([aria-disabled='true']), .rp-row:focus-visible, .rp-row[aria-expanded='true'] { background: var(--rp-ink); color: var(--rp-paper); }",
  ".rp-row:focus-visible { outline: 2px dashed var(--rp-ink); outline-offset: 2px; }",
  ".rp-row-label { white-space: nowrap; }",
  ".rp-dots { flex: 1; min-width: 4cqi; align-self: center; height: 1.2cqi; background-image: radial-gradient(circle, currentColor 0.34cqi, transparent 0.44cqi); background-size: 1.9cqi 1.2cqi; background-repeat: repeat-x; background-position: right center; }",
  ".rp-row-code { white-space: nowrap; font-variant-numeric: tabular-nums; }",
  ".rp-detail { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 0.6s steps(16, end); }",
  ".rp-detail[data-open='true'] { grid-template-rows: 1fr; }",
  ".rp-detail-inner { min-height: 0; overflow: hidden; visibility: hidden; transition: visibility 0s linear 0.6s; }",
  ".rp-detail[data-open='true'] .rp-detail-inner { visibility: visible; transition-delay: 0s; }",
  ".rp-sheet { position: relative; margin: 2.6cqi 0 3.4cqi; padding: 4cqi 0 1cqi; border-top: max(1px, 0.4cqi) dashed currentColor; border-bottom: max(1px, 0.4cqi) dashed currentColor; font-size: 3.35cqi; line-height: 1.65; }",
  ".rp-sheet > * { margin: 0 0 3cqi; }",
  ".rp-detail[data-open='true'] .rp-sheet > * { animation: rp-line 0.32s steps(4, end) both; animation-delay: calc(0.16s + var(--i, 0) * 0.08s); }",
  ".rp-sheet > .rp-kv { margin-bottom: 0.9cqi; }",
  ".rp-art-wrap { margin: 0; }",
  ".rp-art { display: block; width: 100%; height: auto; max-width: none; border: max(1px, 0.4cqi) solid currentColor; }",
  ".rp-cap { margin-top: 1.4cqi; font-size: 2.8cqi; letter-spacing: 0.08em; text-transform: uppercase; }",
  ".rp-img { position: relative; aspect-ratio: 16 / 9; overflow: hidden; border: max(1px, 0.4cqi) solid currentColor; background: var(--rp-paper); }",
  ".rp-img img { position: absolute; inset: 0; width: 100%; height: 100%; max-width: none; object-fit: cover; filter: grayscale(1) contrast(1.9) brightness(1.08); mix-blend-mode: multiply; }",
  ".rp-img::after { content: ''; position: absolute; inset: 0; background: radial-gradient(circle, transparent 0.7px, var(--rp-paper) 1.35px) 0 0 / 3px 3px; mix-blend-mode: lighten; opacity: 0.85; pointer-events: none; }",
  ".rp-kv { display: flex; align-items: baseline; gap: 1.6cqi; }",
  ".rp-kv .rp-dots { height: 0.8cqi; background-image: radial-gradient(circle, currentColor 0.22cqi, transparent 0.3cqi); background-size: 1.3cqi 0.8cqi; }",
  ".rp-kv a { color: inherit; text-decoration: underline; text-decoration-thickness: max(1px, 0.25cqi); text-underline-offset: 0.6cqi; }",
  ".rp-kv a:hover, .rp-kv a:focus-visible { background: var(--rp-ink); color: var(--rp-paper); text-decoration: none; outline: none; }",
  ".rp-tags { display: flex; flex-wrap: wrap; gap: 0.6cqi 2.4cqi; text-transform: uppercase; letter-spacing: 0.06em; }",
  ".rp-total { display: flex; justify-content: space-between; gap: 4cqi; font-size: 6.3cqi; line-height: 1.3; }",
  ".rp-foot { margin-top: 6cqi; text-align: center; font-size: 2.8cqi; letter-spacing: 0.18em; text-transform: uppercase; }",
  ".rp-foot .rp-code { height: 7cqi; margin: 0 auto 2cqi; width: 62%; }",
  ".rp-tear { all: unset; box-sizing: border-box; display: flex; align-items: center; gap: 2cqi; width: 100%; margin-top: 7cqi; padding: 2.5cqi 0; font-size: 2.6cqi; letter-spacing: 0.2em; text-transform: uppercase; cursor: grab; touch-action: none; user-select: none; opacity: 0.8; }",
  ".rp-tear:active { cursor: grabbing; }",
  ".rp-tear:hover, .rp-tear:focus-visible { opacity: 1; }",
  ".rp-tear:focus-visible { outline: 2px dashed var(--rp-ink); outline-offset: 2px; }",
  ".rp-tear-line { flex: 1; height: max(1px, 0.35cqi); background: repeating-linear-gradient(90deg, currentColor 0 1.2cqi, transparent 1.2cqi 2.4cqi); }",
  ".rp-clip { position: absolute; z-index: 4; bottom: 34px; width: 62px; height: 24px; border-radius: 5px; background: linear-gradient(180deg, #f5f5f6, #b9bbbf 55%, #8f9195); box-shadow: 0 4px 6px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(0,0,0,0.25); pointer-events: none; }",
  ".rp-clip::before, .rp-clip::after { content: ''; position: absolute; top: 8px; width: 7px; height: 7px; border-radius: 50%; background: radial-gradient(circle at 35% 35%, #ffffff, #7c7e82 70%); box-shadow: inset 0 0 0 1px rgba(0,0,0,0.25); }",
  ".rp-clip::before { left: 8px; }",
  ".rp-clip::after { right: 8px; }",
  ".rp-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }",
  "@keyframes rp-feed { from { transform: translateY(-102%); } to { transform: translateY(0); } }",
  "@keyframes rp-line { from { clip-path: inset(0 0 100% 0); opacity: 0.4; } to { clip-path: inset(0 0 0 0); opacity: 1; } }",
  "@keyframes rp-blink { 50% { opacity: 0.35; } }",
  "@media (prefers-reduced-motion: reduce) {",
  "  .rp-root[data-phase] .rp-paper { animation: none; transition: none; }",
  "  .rp-detail, .rp-detail-inner, .rp-row { transition: none; }",
  "  .rp-detail[data-open='true'] .rp-sheet > * { animation: none; }",
  "  .rp-root[data-phase] .rp-led { animation: none; }",
  "}",
].join("\n")

type Phase = "waiting" | "printing" | "ready" | "falling"

/** A word in the bitmap face, as SVG. `cell` stretches the pixels sideways. */
function PixelText({ text, cell = 1.18, label, filter }: { text: string; cell?: number; label?: string; filter?: string }) {
  const { runs, cols } = React.useMemo(() => pixelRuns(text), [text])
  return (
    <svg
      viewBox={"0 0 " + Math.max(1, cols * cell) + " 7"}
      role="img"
      aria-label={label ?? text}
      shapeRendering="crispEdges"
      style={{ display: "block", width: "100%", height: "auto", maxWidth: "none", overflow: "visible" }}
    >
      <g filter={filter}>
        {runs.map((r, i) => (
          <rect key={i} x={r.x * cell} y={r.y} width={r.w * cell + 0.03} height={1.03} fill="currentColor" />
        ))}
      </g>
    </svg>
  )
}

/** Pixel runs placed inside another drawing. */
function PixelGroup({ text, x, y, unit, cell = 1.18 }: { text: string; x: number; y: number; unit: number; cell?: number }) {
  const { runs } = React.useMemo(() => pixelRuns(text), [text])
  return (
    <g transform={"translate(" + x + " " + y + ") scale(" + unit + ")"} shapeRendering="crispEdges">
      {runs.map((r, i) => (
        <rect key={i} x={r.x * cell} y={r.y} width={r.w * cell + 0.03} height={1.03} fill="currentColor" />
      ))}
    </g>
  )
}

export const pixelWidth = (text: string, unit: number, cell = 1.18): number => pixelRuns(text).cols * cell * unit

function Barcode({ code, className }: { code: string; className?: string }) {
  const bars = React.useMemo(() => barcodeBars(code, 160), [code])
  return (
    <svg className={className} viewBox="0 0 160 10" preserveAspectRatio="none" aria-hidden="true" style={{ width: "100%", maxWidth: "none" }}>
      {bars.map((b, i) => (
        <rect key={i} x={b.x} y={0} width={b.w} height={10} fill="currentColor" />
      ))}
    </svg>
  )
}

/** Dither fills and the worn-ink filter, shared by every drawing on the receipt. */
function Defs({ uid }: { uid: string }) {
  return (
    <svg width="0" height="0" aria-hidden="true" style={{ position: "absolute" }}>
      <defs>
        {DITHER_LEVELS.map((level, k) => (
          <pattern key={level} id={uid + "-d" + (k + 1)} width="8" height="8" patternUnits="userSpaceOnUse">
            {ditherCells(level).map(([x, y]) => (
              <rect key={x + "-" + y} x={x * 2} y={y * 2} width="2" height="2" fill="currentColor" />
            ))}
          </pattern>
        ))}
        <filter id={uid + "-wear"} x="-2%" y="-10%" width="104%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="2.2" numOctaves="1" seed="4" result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.4 2.45" result="m" />
          <feComposite in="SourceGraphic" in2="m" operator="in" />
        </filter>
        <filter id={uid + "-stamp"} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.22" numOctaves="3" seed="9" result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -3 2.3" result="m" />
          <feComposite in="SourceGraphic" in2="m" operator="in" />
        </filter>
      </defs>
    </svg>
  )
}

/** The built-in drawings, 320 × 180, in ink and four dither tones. */
function Art({ name, uid, paper, initials }: { name: ReceiptArt; uid: string; paper: string; initials: string }) {
  const d = (k: 1 | 2 | 3 | 4) => "url(#" + uid + "-d" + k + ")"
  const ink = "currentColor"
  const line = { stroke: ink, strokeWidth: 2, strokeLinejoin: "round" as const, strokeLinecap: "round" as const }
  let body: React.ReactNode = null

  if (name === "portrait") {
    body = (
      <>
        <rect width="320" height="180" fill={d(1)} />
        <circle cx="258" cy="44" r="20" fill={d(3)} {...line} />
        <path d="M78 182 C84 138 116 124 160 124 C204 124 236 138 242 182 Z" fill={paper} />
        <path d="M78 182 C84 138 116 124 160 124 C204 124 236 138 242 182 Z" fill={d(3)} {...line} />
        <path d="M160 124 C204 124 236 138 242 182 L160 182 Z" fill={d(4)} />
        <path d="M142 125 L160 152 L178 125" fill={paper} {...line} />
        <rect x="148" y="100" width="24" height="26" fill={paper} {...line} />
        <rect x="148" y="100" width="24" height="26" fill={d(2)} />
        <clipPath id={uid + "-head"}>
          <ellipse cx="160" cy="74" rx="32" ry="38" />
        </clipPath>
        <ellipse cx="160" cy="74" rx="32" ry="38" fill={paper} />
        <ellipse cx="160" cy="74" rx="32" ry="38" fill={d(1)} />
        <ellipse cx="184" cy="80" rx="24" ry="40" fill={d(2)} clipPath={"url(#" + uid + "-head)"} />
        <ellipse cx="160" cy="74" rx="32" ry="38" fill="none" {...line} />
        <path d="M125 80 C118 34 146 24 164 26 C192 28 204 50 197 86 L197 116 L185 116 L186 66 C168 64 150 56 142 44 C136 58 136 78 136 116 L124 116 Z" fill={ink} />
        <circle cx="148" cy="80" r="9.5" fill="none" {...line} strokeWidth={2.6} />
        <circle cx="173" cy="80" r="9.5" fill="none" {...line} strokeWidth={2.6} />
        <path d="M157.5 80 L163.5 80" {...line} strokeWidth={2.6} />
        <path d="M152 99 Q160 104 168 99" fill="none" {...line} />
        <rect x="1" y="1" width="318" height="178" fill="none" {...line} />
        <rect x="10" y="150" width="62" height="20" fill={paper} {...line} />
        <text x="41" y="164" textAnchor="middle" fontSize="11" fill={ink} fontFamily="inherit" letterSpacing="1">
          ID 001
        </text>
      </>
    )
  } else if (name === "marks") {
    const mono = initials.slice(0, 2) || "A"
    const mw = pixelWidth(mono, 3)
    body = (
      <>
        <path d="M107 12 V168 M213 12 V168 M12 90 H308" {...line} strokeWidth={1.5} strokeDasharray="3 5" />
        <circle cx="60" cy="50" r="28" fill={ink} />
        <path d="M60 50 L60 22 A28 28 0 0 1 88 50 Z" fill={paper} />
        <path d="M160 22 L190 74 L130 74 Z" fill={d(3)} {...line} />
        <path d="M160 46 L174 70 L146 70 Z" fill={ink} />
        <circle cx="248" cy="50" r="22" fill={d(2)} {...line} />
        <circle cx="272" cy="50" r="22" fill={d(4)} {...line} />
        <rect x="34" y="104" width="52" height="52" rx="12" fill={ink} />
        <circle cx="72" cy="118" r="9" fill={paper} />
        <circle cx="160" cy="130" r="30" fill={paper} {...line} strokeWidth={2.5} />
        <circle cx="160" cy="130" r="25" fill="none" {...line} strokeWidth={1} />
        <g color={ink}>
          <PixelGroup text={mono} x={160 - mw / 2} y={130 - 10.5} unit={3} />
        </g>
        {Array.from({ length: 16 }, (_, i) => {
          const a = (i / 16) * Math.PI * 2
          const r0 = i % 2 ? 12 : 10
          const r1 = i % 2 ? 22 : 30
          return (
            <path
              key={i}
              d={"M" + (260 + Math.cos(a) * r0).toFixed(2) + " " + (130 + Math.sin(a) * r0).toFixed(2) + " L" + (260 + Math.cos(a) * r1).toFixed(2) + " " + (130 + Math.sin(a) * r1).toFixed(2)}
              {...line}
              strokeWidth={3}
            />
          )
        })}
        <circle cx="260" cy="130" r="6" fill={ink} />
      </>
    )
  } else if (name === "brand") {
    body = (
      <>
        <rect width="320" height="180" fill={d(1)} />
        <g transform="rotate(-5 110 95)">
          <rect x="50" y="24" width="122" height="152" fill={d(3)} />
          <rect x="42" y="16" width="122" height="152" fill={paper} {...line} />
          <circle cx="60" cy="36" r="7" fill={ink} />
          <rect x="72" y="33" width="44" height="3" fill={ink} />
          <rect x="54" y="62" width="96" height="3" fill={d(4)} />
          <rect x="54" y="72" width="88" height="3" fill={d(4)} />
          <rect x="54" y="82" width="98" height="3" fill={d(4)} />
          <rect x="54" y="92" width="64" height="3" fill={d(4)} />
          <rect x="54" y="110" width="92" height="3" fill={d(4)} />
          <rect x="54" y="120" width="70" height="3" fill={d(4)} />
          <path d="M56 150 C64 138 70 156 78 144 C84 136 88 152 96 146 C102 142 108 146 116 144" fill="none" {...line} />
        </g>
        <g transform="rotate(-11 232 56)">
          <rect x="180" y="26" width="108" height="62" rx="3" fill={paper} {...line} />
          <rect x="180" y="26" width="108" height="62" rx="3" fill={d(1)} />
          <path d="M198 64 L210 42 L222 64 Z" fill={ink} />
          <rect x="232" y="46" width="42" height="3" fill={ink} />
          <rect x="232" y="56" width="30" height="3" fill={d(4)} />
        </g>
        <g transform="rotate(7 222 116)">
          <rect x="164" y="84" width="124" height="70" rx="3" fill={d(3)} transform="translate(5 6)" />
          <rect x="164" y="84" width="124" height="70" rx="3" fill={ink} />
          <circle cx="188" cy="108" r="11" fill={paper} />
          <circle cx="188" cy="108" r="5" fill={ink} />
          <rect x="208" y="102" width="62" height="3" fill={paper} />
          <rect x="208" y="112" width="44" height="3" fill={paper} />
          <rect x="176" y="136" width="36" height="3" fill={paper} />
        </g>
        <circle cx="270" cy="166" r="9" fill={ink} />
        <circle cx="292" cy="166" r="9" fill={d(3)} {...line} />
        <circle cx="248" cy="166" r="9" fill={paper} {...line} />
      </>
    )
  } else if (name === "box") {
    body = (
      <>
        <ellipse cx="132" cy="166" rx="78" ry="9" fill={d(2)} />
        <ellipse cx="252" cy="166" rx="38" ry="7" fill={d(2)} />
        <path d="M70 70 L130 40 L190 70 L130 100 Z" fill={paper} {...line} />
        <path d="M70 70 L130 40 L190 70 L130 100 Z" fill={d(1)} />
        <path d="M70 70 L130 100 L130 160 L70 130 Z" fill={d(3)} {...line} />
        <path d="M130 100 L190 70 L190 130 L130 160 Z" fill={paper} {...line} />
        <path d="M130 100 L190 70 L190 130 L130 160 Z" fill={d(2)} />
        <path d="M97 56 L103 53 L163 83 L157 86 Z" fill={d(3)} />
        <path d="M70 70 L130 40 L190 70 L130 100 Z M70 70 L130 100 L130 160 L70 130 Z M130 100 L190 70 L190 130 L130 160 Z" fill="none" {...line} />
        <path d="M142 110 L180 91 L180 117 L142 136 Z" fill={paper} {...line} />
        <path d="M148 114 L172 102 M148 121 L166 112 M148 128 L174 115" {...line} strokeWidth={1.6} />
        <path d="M222 64 L222 158 A28 8 0 0 0 278 158 L278 64 Z" fill={paper} {...line} />
        <path d="M222 64 L222 158 A28 8 0 0 0 278 158 L278 64 Z" fill={d(2)} />
        <path d="M260 64 L260 165.5 A28 8 0 0 0 278 158 L278 64 Z" fill={d(3)} />
        <rect x="222" y="94" width="56" height="34" fill={ink} />
        <rect x="230" y="104" width="30" height="3" fill={paper} />
        <rect x="230" y="113" width="20" height="3" fill={paper} />
        <path d="M222 64 L222 158 A28 8 0 0 0 278 158 L278 64" fill="none" {...line} />
        <ellipse cx="250" cy="64" rx="28" ry="8" fill={paper} {...line} />
        <ellipse cx="250" cy="64" rx="18" ry="4.5" fill={d(2)} />
      </>
    )
  } else if (name === "glyphs") {
    const rows = ["ABCDEF", "GHIJKL", "MNOPQR", "STUVWX", "YZ0123"]
    return (
      <svg viewBox="0 0 320 180" className="rp-art" aria-hidden="true" style={{ color: "inherit" }}>
        <path d="M10 50 H310 M10 130 H310" {...line} strokeWidth={1.2} strokeDasharray="2 4" />
        <text x="12" y="44" fontSize="9" fill={ink} fontFamily="inherit" letterSpacing="1">
          CAP 7
        </text>
        <text x="12" y="145" fontSize="9" fill={ink} fontFamily="inherit" letterSpacing="1">
          BASE 0
        </text>
        <g color={ink}>
          <PixelGroup text="AG" x={22} y={50} unit={80 / 7} />
          {rows.map((r, i) => (
            <PixelGroup key={r} text={r} x={204} y={52 + i * 16.5} unit={2.2} />
          ))}
        </g>
        <text x="12" y="166" fontSize="10" fill={ink} fontFamily="inherit" letterSpacing="2">
          TILL SANS / 5X7 / 47 GLYPHS
        </text>
      </svg>
    )
  } else {
    const hw = pixelWidth("HIRE", 4)
    body = (
      <>
        <path d="M22 150 C40 118 52 168 70 136 C80 118 90 150 104 138 C112 131 118 140 128 134" fill="none" {...line} strokeWidth={1.6} />
        <path d="M18 160 H132" {...line} strokeWidth={1} strokeDasharray="2 3" />
        <text x="18" y="174" fontSize="9" fill={ink} fontFamily="inherit" letterSpacing="1">
          SIGNATURE
        </text>
        <g transform="rotate(-9 214 90)" filter={"url(#" + uid + "-stamp)"}>
          <circle cx="214" cy="90" r="74" fill="none" {...line} strokeWidth={4} />
          <circle cx="214" cy="90" r="64" fill="none" {...line} strokeWidth={1.5} />
          <text x="214" y="56" textAnchor="middle" fontSize="12" fill={ink} fontFamily="inherit" fontWeight="700" letterSpacing="3">
            OPEN FOR
          </text>
          <g color={ink}>
            <PixelGroup text="HIRE" x={214 - hw / 2} y={90 - 14} unit={4} />
          </g>
          <text x="214" y="132" textAnchor="middle" fontSize="12" fill={ink} fontFamily="inherit" fontWeight="700" letterSpacing="3">
            * 2026 *
          </text>
        </g>
      </>
    )
  }

  return (
    <svg viewBox="0 0 320 180" className="rp-art" aria-hidden="true">
      {body}
    </svg>
  )
}

function Block({ block, i, uid, paper, initials, fig }: { block: ReceiptBlock; i: number; uid: string; paper: string; initials: string; fig: string }) {
  const style = { "--i": i } as React.CSSProperties
  switch (block.type) {
    case "text":
      return (
        <p style={style} className="rp-text">
          {block.text}
        </p>
      )
    case "row":
      return (
        <div style={style} className="rp-kv">
          <span>{block.label}</span>
          <span className="rp-dots" aria-hidden="true" />
          {block.href ? (
            <a href={block.href} target={/^https?:/.test(block.href) ? "_blank" : undefined} rel="noreferrer">
              {block.value}
            </a>
          ) : (
            <span>{block.value}</span>
          )}
        </div>
      )
    case "art":
      return (
        <figure style={style} className="rp-art-wrap">
          <Art name={block.art} uid={uid} paper={paper} initials={initials} />
          {block.caption ? <figcaption className="rp-cap">{"Fig. " + fig + " / " + block.caption}</figcaption> : null}
        </figure>
      )
    case "image":
      return (
        <figure style={style} className="rp-art-wrap">
          <div className="rp-img">
            <img src={block.src} alt={block.alt} width={640} height={360} loading="lazy" style={{ maxWidth: "none" }} />
          </div>
          {block.caption ? <figcaption className="rp-cap">{"Fig. " + fig + " / " + block.caption}</figcaption> : null}
        </figure>
      )
    case "tags":
      return (
        <div style={style} className="rp-tags">
          {block.items.map((t) => (
            <span key={t}>{"[" + t + "]"}</span>
          ))}
        </div>
      )
    default:
      return <div style={style} className="rp-dash" aria-hidden="true" />
  }
}

export default function ReceiptPortfolio({
  title = "Portfolio",
  receiptNo = 1,
  date,
  cashier = "Mira Voss",
  terminal = "01",
  note = "Each line item is a project.\nClick to see what's inside.",
  items = DEFAULT_ITEMS,
  totalLabel = "Total",
  totalValue = "1 designer",
  footer = "Thank you. Come again.",
  defaultOpen = -1,
  print = true,
  tearable = true,
  width = 440,
  height = "100svh",
  wall = "#e8e7e3",
  paper = "#f8f7f3",
  ink = "#141414",
  fontMono = MONO,
  onOpen,
  onReprint,
  className = "",
}: ReceiptPortfolioProps) {
  const uid = "rp" + React.useId().replace(/[^a-zA-Z0-9]/g, "")
  const rootRef = React.useRef<HTMLElement>(null)
  const paperRef = React.useRef<HTMLDivElement>(null)
  const [reduced, setReduced] = React.useState(false)
  const [phase, setPhase] = React.useState<Phase>(print ? "waiting" : "ready")
  const [no, setNo] = React.useState(receiptNo)
  const [open, setOpen] = React.useState(defaultOpen)
  const [today, setToday] = React.useState("")
  const [pull, setPull] = React.useState<{ x: number; y: number } | null>(null)
  const [fall, setFall] = React.useState(0)
  const [dur, setDur] = React.useState(2)
  const drag = React.useRef<{ id: number; x0: number; y0: number } | null>(null)
  const timer = React.useRef<number | undefined>(undefined)

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => setReduced(mq.matches)
    sync()
    mq.addEventListener("change", sync)
    return () => mq.removeEventListener("change", sync)
  }, [])

  // The date is the visitor's today, set after mount so server and client agree.
  React.useEffect(() => {
    if (!date) setToday(formatDate(new Date()))
  }, [date])

  const startPrint = React.useCallback(() => {
    const h = paperRef.current?.offsetHeight ?? 900
    setDur(feedSeconds(h))
    setPhase("printing")
  }, [])

  // Print once it is actually on screen, so the feed is seen.
  React.useEffect(() => {
    if (phase !== "waiting") return
    if (reduced) {
      setPhase("ready")
      return
    }
    const el = rootRef.current
    if (!el || typeof IntersectionObserver === "undefined") {
      startPrint()
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect()
          startPrint()
        }
      },
      { threshold: 0.2 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [phase, reduced, startPrint])

  React.useEffect(() => () => window.clearTimeout(timer.current), [])

  const toggle = (i: number) => {
    const next = open === i ? -1 : i
    setOpen(next)
    onOpen?.(next)
  }

  const tear = React.useCallback(
    (dx = 0) => {
      if (phase === "falling" || phase === "waiting") return
      const next = no + 1
      const reprint = () => {
        setNo(next)
        setOpen(-1)
        setPull(null)
        onReprint?.(next)
        if (reduced) setPhase("ready")
        else {
          setPhase("waiting")
          window.setTimeout(startPrint, 60)
        }
      }
      if (reduced) {
        reprint()
        return
      }
      setFall(dx >= 0 ? 1 : -1)
      setPhase("falling")
      timer.current = window.setTimeout(reprint, 950)
    },
    [phase, no, reduced, onReprint, startPrint],
  )

  const onDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (phase !== "ready") return
    drag.current = { id: e.pointerId, x0: e.clientX, y0: e.clientY }
    e.currentTarget.setPointerCapture(e.pointerId)
    setPull({ x: 0, y: 0 })
  }
  const onMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const g = drag.current
    if (!g || g.id !== e.pointerId) return
    setPull({ x: e.clientX - g.x0, y: e.clientY - g.y0 })
  }
  const onUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    const g = drag.current
    if (!g || g.id !== e.pointerId) return
    drag.current = null
    const dy = e.clientY - g.y0
    const dx = e.clientX - g.x0
    if (dy > TEAR_AT) tear(dx)
    else setPull(null)
  }

  let transform: string | undefined
  if (phase === "falling") {
    transform = "translate(" + fall * 60 + "px, 115vh) rotate(" + fall * 14 + "deg)"
  } else if (phase === "ready" && pull) {
    const y = rubber(pull.y, 34)
    const r = Math.max(-2.5, Math.min(2.5, pull.x * 0.02))
    transform = "translate(" + (Math.max(-12, Math.min(12, pull.x * 0.08))).toFixed(2) + "px, " + y.toFixed(2) + "px) rotate(" + r.toFixed(2) + "deg)"
  }

  const status =
    phase === "printing" ? "Printing receipt number " + pad3(no) : phase === "falling" ? "Receipt torn off" : ""

  const initials = cashier
    .split(/\s+/)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase()

  const rootStyle = {
    minHeight: height,
    background: wall,
    "--rp-paper": paper,
    "--rp-ink": ink,
    "--rp-mono": fontMono,
    "--rp-tile": PAPER_TILE,
    "--rp-dur": dur + "s",
    "--rp-steps": Math.round(dur * 16),
  } as React.CSSProperties

  return (
    <section
      ref={rootRef}
      className={"rp-root w-full " + className}
      style={rootStyle}
      data-phase={phase}
      data-drag={pull ? "true" : "false"}
      aria-label={title + " receipt"}
    >
      <style>{styles}</style>
      <div className="rp-shade" aria-hidden="true" />
      <div className="rp-door" aria-hidden="true" />
      <div className="rp-rig" style={{ width: "min(" + width + "px, calc(100% - 96px))", minWidth: 240 }}>
        <div className="rp-slot">
          <div className="rp-slot-back" />
          <div className="rp-slit" />
          <div className="rp-lip" />
          {tearable ? (
            <button type="button" className="rp-feedbtn" onClick={() => tear(1)} aria-label="Tear off and print a new copy">
              <span className="rp-led" />
              FEED
            </button>
          ) : null}
        </div>

        <div className="rp-feed">
          <div
            ref={paperRef}
            className="rp-paper"
            style={{ transform }}
            onAnimationEnd={(e) => {
              if (e.target === e.currentTarget && phase === "printing") setPhase("ready")
            }}
          >
            <article className="rp-receipt" style={{ clipPath: zigzagClip(40, 7) }}>
              <Defs uid={uid} />
              <Barcode code={"RECEIPT" + no + title} className="rp-code" />

              <div className="rp-title">
                <PixelText text={title} filter={"url(#" + uid + "-wear)"} />
              </div>
              <div className="rp-bar" aria-hidden="true" />

              <p className="rp-meta">
                {"Receipt №" + pad3(no)}
                <br />
                {"Date: " + (date ?? (today || "--.--.----"))}
                <br />
                {"Cashier: " + cashier}
                <br />
                {"Terminal: " + terminal}
              </p>

              <div className="rp-dash" aria-hidden="true" />
              {note ? <p className="rp-note">{note}</p> : null}
              <div className="rp-dash" aria-hidden="true" />

              <ul className="rp-items">
                {items.map((item, i) => {
                  const code = item.code ?? pad3(i + 1)
                  const blocks = item.blocks ?? []
                  const has = blocks.length > 0
                  const isOpen = open === i && has
                  let figs = 0
                  return (
                    <li key={item.label + i}>
                      <button
                        type="button"
                        id={uid + "-row" + i}
                        className="rp-row"
                        aria-expanded={has ? isOpen : undefined}
                        aria-controls={has ? uid + "-item" + i : undefined}
                        aria-disabled={has ? undefined : true}
                        onClick={() => has && toggle(i)}
                      >
                        <span className="rp-row-label">{item.label}</span>
                        <span className="rp-dots" aria-hidden="true" />
                        <span className="rp-row-code">{code}</span>
                      </button>
                      {has ? (
                        <div
                          id={uid + "-item" + i}
                          role="region"
                          aria-labelledby={uid + "-row" + i}
                          className="rp-detail"
                          data-open={isOpen ? "true" : "false"}
                        >
                          <div className="rp-detail-inner">
                            <div className="rp-sheet">
                              {blocks.map((b, k) => {
                                if (b.type === "art" || b.type === "image") figs++
                                return <Block key={k} block={b} i={k} uid={uid} paper={paper} initials={initials} fig={code + "." + figs} />
                              })}
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </li>
                  )
                })}
              </ul>

              <div className="rp-dash" aria-hidden="true" />
              <div className="rp-total">
                <span>{totalLabel}</span>
                <span>{totalValue}</span>
              </div>

              {footer ? (
                <div className="rp-foot">
                  <Barcode code={footer + no} className="rp-code" />
                  {footer}
                </div>
              ) : null}

              {tearable ? (
                <button
                  type="button"
                  className="rp-tear"
                  aria-label="Tear off this receipt and print a new copy"
                  onPointerDown={onDown}
                  onPointerMove={onMove}
                  onPointerUp={onUp}
                  onPointerCancel={() => {
                    drag.current = null
                    setPull(null)
                  }}
                  onClick={(e) => {
                    // Pointer drags handle themselves; this is the keyboard path.
                    if (e.detail === 0) tear(1)
                  }}
                >
                  <span className="rp-tear-line" />
                  <span aria-hidden="true">{"✂ pull to tear"}</span>
                  <span className="rp-tear-line" />
                </button>
              ) : null}
            </article>
          </div>
        </div>

        <span className="rp-clip" style={{ left: -30 }} aria-hidden="true" />
        <span className="rp-clip" style={{ right: -30 }} aria-hidden="true" />
      </div>
      <p className="rp-sr" aria-live="polite">
        {status}
      </p>
    </section>
  )
}
