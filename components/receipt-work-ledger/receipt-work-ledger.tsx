"use client"

import * as React from "react"

/**
 * Receipt Work Ledger — a project index printed as an itemised statement on
 * continuous-feed paper.
 *
 * Tractor holes run down both margins, perforations cross the sheet, and
 * every third line sits on a faint bar, like the old line-printer stock. Each
 * project is one line: number, title with a dot leader, department, year.
 * Filter by department with the bracketed tabs (the rows reprint as the
 * filter changes), sort by number or year, hover a line and a small dithered
 * print of the project follows the cursor, click it and the line feeds open
 * to its summary, a larger print and a link.
 *
 * Nothing is loaded. The headline is a 5 × 7 bitmap drawn as SVG, the project
 * prints are generated from each title (same title, same picture) and filled
 * with Bayer dither, and the paper is an SVG turbulence tile.
 */

export type LedgerEntry = {
  title: string
  /** Department, used for the filter tabs. */
  dept: string
  year: number | string
  client?: string
  /** What prints when the line is opened. */
  summary?: string
  /** "View case" link when opened. */
  href?: string
  /** Your own picture instead of the generated print. */
  image?: string
}

export type ReceiptWorkLedgerProps = {
  /** Pixel headline. A–Z, 0–9 and . - ! ? & ' / : are drawn. */
  title?: string
  statementNo?: number
  account?: string
  entries?: LedgerEntry[]
  /** Last line of the statement. "" hides it. */
  balance?: string
  /** Sheet width in px. It shrinks to fit. */
  width?: number
  /** Minimum height of the wall. Must be a definite length. */
  height?: string
  wall?: string
  paper?: string
  ink?: string
  /** Faint band behind every third line. "" turns it off. */
  band?: string
  fontMono?: string
  /** Show the print that follows the cursor. */
  preview?: boolean
  /** Called when a line opens (its index in `entries`) or closes (-1). */
  onSelect?: (index: number) => void
  className?: string
}

// #region ledger
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

export const BAYER4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
]

export const ditherCells = (level: number): [number, number][] => {
  const cells: [number, number][] = []
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) if (BAYER4[y][x] < level) cells.push([x, y])
  return cells
}

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

export const pad3 = (n: number): string => String(Math.max(0, Math.floor(n))).padStart(3, "0")

/** tone 0 is paper, 1–4 the dither fills, 5 solid ink. */
export type PosterShape =
  | { kind: "circle"; x: number; y: number; r: number; tone: number }
  | { kind: "rect"; x: number; y: number; w: number; h: number; tone: number }
  | { kind: "tri"; pts: [number, number][]; tone: number }
  | { kind: "bars"; x: number; y: number; w: number; h: number; n: number; tone: number }

export const POSTER_W = 200
export const POSTER_H = 130

/**
 * A small abstract print for a project, 200 × 130, from its title. One large
 * form, a couple of smaller ones, a set of bars: enough to tell lines apart,
 * and always the same picture for the same title.
 */
export const posterShapes = (seed: string): PosterShape[] => {
  const rnd = mulberry32(hashString(seed))
  const pick = <T,>(a: readonly T[]): T => a[Math.floor(rnd() * a.length) % a.length]
  const shapes: PosterShape[] = [{ kind: "rect", x: 0, y: 0, w: POSTER_W, h: POSTER_H, tone: pick([0, 1, 1, 2]) }]
  const big = pick(["circle", "rect", "tri"] as const)
  const cx = 50 + rnd() * 100
  const cy = 45 + rnd() * 40
  if (big === "circle") shapes.push({ kind: "circle", x: cx, y: cy, r: 34 + rnd() * 18, tone: pick([3, 4, 5]) })
  else if (big === "rect") shapes.push({ kind: "rect", x: cx - 40, y: cy - 34, w: 80, h: 68, tone: pick([3, 4, 5]) })
  else shapes.push({ kind: "tri", pts: [[cx, cy - 46], [cx + 50, cy + 38], [cx - 50, cy + 38]], tone: pick([3, 4, 5]) })
  const n = 2 + Math.floor(rnd() * 2)
  for (let i = 0; i < n; i++) {
    const x = 16 + rnd() * 168
    const y = 14 + rnd() * 100
    const tone = pick([0, 2, 5])
    if (rnd() < 0.5) shapes.push({ kind: "circle", x, y, r: 7 + rnd() * 12, tone })
    else shapes.push({ kind: "rect", x: x - 10, y: y - 10, w: 14 + rnd() * 18, h: 14 + rnd() * 18, tone })
  }
  shapes.push({ kind: "bars", x: 12 + rnd() * 24, y: 100 + rnd() * 12, w: 60 + rnd() * 60, h: 3, n: 2 + Math.floor(rnd() * 3), tone: 5 })
  return shapes
}

export type SortKey = "no" | "year"

/** Indices of `entries` in `dept` (or all), ordered by `sort`. Ties keep list order. */
export const ledgerView = (entries: { dept: string; year: number | string }[], dept: string, sort: SortKey): number[] => {
  const idx = entries.map((_, i) => i).filter((i) => dept === "" || entries[i].dept === dept)
  if (sort === "year") idx.sort((a, b) => Number(entries[b].year) - Number(entries[a].year) || a - b)
  return idx
}

/** Departments in first-seen order, with how many lines each has. */
export const departments = (entries: { dept: string }[]): { dept: string; count: number }[] => {
  const out: { dept: string; count: number }[] = []
  for (const e of entries) {
    const hit = out.find((d) => d.dept === e.dept)
    if (hit) hit.count++
    else out.push({ dept: e.dept, count: 1 })
  }
  return out
}

/** "2019–2026", or one year, or "" for none. */
export const yearSpan = (entries: { year: number | string }[]): string => {
  const ys = entries.map((e) => Number(e.year)).filter(Number.isFinite)
  if (!ys.length) return ""
  const a = Math.min(...ys)
  const b = Math.max(...ys)
  return a === b ? String(a) : a + "–" + b
}

/** Frame-rate independent chase toward a target. */
export const follow = (cur: number, target: number, dt: number, tau: number): number => {
  if (tau <= 0) return target
  const next = cur + (target - cur) * (1 - Math.exp(-dt / tau))
  return Math.abs(target - next) < 0.05 ? target : next
}
// #endregion

const MONO = '"Courier Prime", "Courier New", Courier, FreeMono, "Nimbus Mono PS", "Liberation Mono", ui-monospace, monospace'

const PAPER_TILE =
  'url("data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="260" height="260"><filter id="p" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.018 0.026" numOctaves="5" seed="3" stitchTiles="stitch"/><feDiffuseLighting lighting-color="#ffffff" surfaceScale="2.2" diffuseConstant="1.05"><feDistantLight azimuth="235" elevation="60"/></feDiffuseLighting></filter><rect width="100%" height="100%" filter="url(#p)"/></svg>',
  ) +
  '")'

const DEFAULT_ENTRIES: LedgerEntry[] = [
  { title: "Oat & Ember identity", dept: "Brand", year: 2026, client: "Oat & Ember", summary: "A bakery that only opens at dawn. A wordmark set in flour-dust dither, a stamp for every box, and a menu board that changes with the oven.", href: "#" },
  { title: "Norte Coffee cans", dept: "Pack", year: 2025, client: "Norte", summary: "Twelve single-origin cans, one grid. Each label is a topographic line drawing of the farm it came from.", href: "#" },
  { title: "Till Sans", dept: "Type", year: 2025, summary: "A 5 × 7 bitmap display face drawn for thermal printers, with figures and till punctuation.", href: "#" },
  { title: "Halde studio site", dept: "Web", year: 2024, client: "Studio Halde", summary: "A portfolio for an architecture studio where every project page is a folded drawing set.", href: "#" },
  { title: "Fika festival", dept: "Brand", year: 2024, client: "Fika Fest", summary: "Posters, wristbands and a stage identity for a three-day coffee festival, printed on one riso drum.", href: "#" },
  { title: "Ferro olive oil", dept: "Pack", year: 2023, client: "Ferro", summary: "A tin that looks like a ledger page. Harvest data set as line items, the oil as the total.", href: "#" },
  { title: "Kiln ceramics shop", dept: "Web", year: 2023, client: "Kiln", summary: "Storefront with a glaze filter and a checkout that prints you a receipt.", href: "#" },
  { title: "Moss & Co monogram", dept: "Brand", year: 2022, client: "Moss & Co", summary: "A monogram that works stitched, embossed and at 12 pixels.", href: "#" },
  { title: "Grotto Mono", dept: "Type", year: 2021, summary: "A monospaced companion to Till Sans, for small print and prices.", href: "#" },
  { title: "Lune tea tins", dept: "Pack", year: 2020, client: "Lune", summary: "Seven tins, seven moon phases, one die line.", href: "#" },
  { title: "Paper Weekly", dept: "Brand", year: 2019, client: "Paper Weekly", summary: "Masthead and grid for an independent print magazine.", href: "#" },
]

const styles = [
  ".rl-root { position: relative; display: flex; align-items: flex-start; justify-content: center; overflow: clip; isolation: isolate; padding: 40px 12px 64px; box-sizing: border-box; }",
  ".rl-shade { position: absolute; inset: 0; pointer-events: none; background: radial-gradient(120% 70% at 50% 0%, rgba(255,255,255,0.35), transparent 60%), radial-gradient(100% 80% at 50% 110%, rgba(0,0,0,0.12), transparent 60%); }",
  ".rl-sheet { position: relative; container-type: inline-size; filter: drop-shadow(0 1px 1px rgba(0,0,0,0.16)) drop-shadow(0 18px 22px rgba(0,0,0,0.14)); }",
  ".rl-paper { position: relative; background: var(--rl-paper); color: var(--rl-ink); font-family: var(--rl-mono); padding: 5cqi 11cqi 7cqi; }",
  ".rl-paper::after { content: ''; position: absolute; inset: 0; background-image: var(--rl-tile); background-size: 260px 260px; opacity: 0.5; mix-blend-mode: multiply; pointer-events: none; }",
  ".rl-holes { position: absolute; top: 0; bottom: 0; width: 7cqi; pointer-events: none; background-image: radial-gradient(circle, var(--rl-wall) 0.95cqi, transparent calc(0.95cqi + 0.5px)); background-size: 7cqi 4.4cqi; background-repeat: repeat-y; background-position: center 1.6cqi; }",
  ".rl-holes::after { content: ''; position: absolute; top: 0; bottom: 0; width: 0; border-left: max(1px, 0.18cqi) dashed color-mix(in srgb, var(--rl-ink) 35%, transparent); }",
  ".rl-holes-l { left: 0; }",
  ".rl-holes-l::after { right: 0; }",
  ".rl-holes-r { right: 0; }",
  ".rl-holes-r::after { left: 0; }",
  ".rl-perf { position: absolute; left: 0; right: 0; height: 0; border-top: max(1px, 0.18cqi) dashed color-mix(in srgb, var(--rl-ink) 28%, transparent); pointer-events: none; }",
  ".rl-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 4cqi; }",
  ".rl-title { flex: 1 1 auto; max-width: 62%; }",
  ".rl-stmt { text-align: right; font-size: 1.9cqi; line-height: 1.6; letter-spacing: 0.08em; text-transform: uppercase; white-space: nowrap; }",
  ".rl-bar { height: 1.3cqi; margin-top: 2.4cqi; background: currentColor; }",
  ".rl-meta { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 1cqi 4cqi; margin-top: 2.4cqi; font-size: 1.9cqi; letter-spacing: 0.08em; text-transform: uppercase; }",
  ".rl-dash { height: max(2px, 0.3cqi); margin: 3.2cqi 0; background: repeating-linear-gradient(90deg, currentColor 0 1.6cqi, transparent 1.6cqi 2.8cqi); }",
  ".rl-controls { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: baseline; gap: 1.6cqi 4cqi; font-size: 2cqi; text-transform: uppercase; letter-spacing: 0.06em; }",
  ".rl-group { display: flex; flex-wrap: wrap; align-items: baseline; gap: 0.6cqi 1.4cqi; }",
  ".rl-tab { all: unset; box-sizing: border-box; cursor: pointer; padding: 0.2cqi 0.8cqi; white-space: nowrap; transition: background-color 0.1s steps(2, end), color 0.1s steps(2, end); }",
  ".rl-tab:hover, .rl-tab[aria-pressed='true'] { background: var(--rl-ink); color: var(--rl-paper); }",
  ".rl-tab:focus-visible { outline: 2px dashed var(--rl-ink); outline-offset: 2px; }",
  ".rl-cols, .rl-row { display: grid; grid-template-columns: 6.5cqi minmax(0, 1fr) 14cqi 7cqi; column-gap: 2cqi; align-items: baseline; }",
  ".rl-cols { font-size: 1.7cqi; letter-spacing: 0.14em; text-transform: uppercase; opacity: 0.75; margin-bottom: 1.2cqi; }",
  ".rl-list { list-style: none; margin: 0; padding: 0; }",
  ".rl-li { position: relative; }",
  ".rl-li[data-band='true']::before { content: ''; position: absolute; inset: 0 -3cqi; background: var(--rl-band); pointer-events: none; }",
  ".rl-row { all: unset; box-sizing: border-box; position: relative; display: grid; grid-template-columns: 6.5cqi minmax(0, 1fr) 14cqi 7cqi; column-gap: 2cqi; align-items: baseline; width: calc(100% + 2cqi); margin: 0 -1cqi; padding: 0.5cqi 1cqi; font-size: 2.9cqi; line-height: 1.5; cursor: pointer; transition: background-color 0.1s steps(2, end), color 0.1s steps(2, end); }",
  ".rl-row:hover, .rl-row:focus-visible, .rl-row[aria-expanded='true'] { background: var(--rl-ink); color: var(--rl-paper); }",
  ".rl-row:focus-visible { outline: 2px dashed var(--rl-ink); outline-offset: 2px; }",
  ".rl-item { display: flex; align-items: baseline; gap: 1.2cqi; min-width: 0; }",
  ".rl-item-t { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }",
  ".rl-dots { flex: 1; min-width: 3cqi; align-self: center; height: 0.8cqi; background-image: radial-gradient(circle, currentColor 0.2cqi, transparent 0.28cqi); background-size: 1.2cqi 0.8cqi; background-repeat: repeat-x; background-position: right center; }",
  ".rl-dept, .rl-year { white-space: nowrap; text-transform: uppercase; }",
  ".rl-row .rl-dept { overflow: hidden; text-overflow: ellipsis; font-size: 0.78em; letter-spacing: 0.04em; }",
  ".rl-year { text-align: right; font-variant-numeric: tabular-nums; }",
  ".rl-li[data-print='true'] .rl-row { animation: rl-print 0.34s steps(5, end) both; animation-delay: calc(var(--k, 0) * 0.05s); }",
  ".rl-open { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 0.5s steps(12, end); }",
  ".rl-open[data-open='true'] { grid-template-rows: 1fr; }",
  ".rl-open-in { min-height: 0; overflow: hidden; visibility: hidden; transition: visibility 0s linear 0.5s; }",
  ".rl-open[data-open='true'] .rl-open-in { visibility: visible; transition-delay: 0s; }",
  ".rl-card { display: grid; grid-template-columns: minmax(0, 40cqi) minmax(0, 1fr); gap: 3cqi; margin: 1.6cqi 0 2.4cqi 8.5cqi; padding: 2.4cqi 0; border-top: max(1px, 0.2cqi) dashed currentColor; border-bottom: max(1px, 0.2cqi) dashed currentColor; font-size: 2.2cqi; line-height: 1.6; }",
  ".rl-card p { margin: 0 0 1.6cqi; }",
  ".rl-card a { color: inherit; text-transform: uppercase; letter-spacing: 0.08em; text-decoration: underline; text-underline-offset: 0.5cqi; }",
  ".rl-card a:hover, .rl-card a:focus-visible { background: var(--rl-ink); color: var(--rl-paper); text-decoration: none; outline: none; }",
  ".rl-kv { display: flex; align-items: baseline; gap: 1cqi; text-transform: uppercase; font-size: 1.9cqi; letter-spacing: 0.06em; }",
  ".rl-print { display: block; width: 100%; height: auto; max-width: none; border: max(1px, 0.2cqi) solid currentColor; }",
  ".rl-img { position: relative; aspect-ratio: 200 / 130; overflow: hidden; border: max(1px, 0.2cqi) solid currentColor; background: var(--rl-paper); }",
  ".rl-img img { position: absolute; inset: 0; width: 100%; height: 100%; max-width: none; object-fit: cover; filter: grayscale(1) contrast(1.9) brightness(1.08); mix-blend-mode: multiply; }",
  ".rl-img::after { content: ''; position: absolute; inset: 0; background: radial-gradient(circle, transparent 0.7px, var(--rl-paper) 1.35px) 0 0 / 3px 3px; mix-blend-mode: lighten; opacity: 0.85; pointer-events: none; }",
  ".rl-empty { padding: 3cqi 0; text-align: center; font-size: 2.2cqi; text-transform: uppercase; letter-spacing: 0.12em; }",
  ".rl-sum { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 2cqi; font-size: 2.2cqi; text-transform: uppercase; letter-spacing: 0.06em; }",
  ".rl-sum b { display: block; font-size: 3.6cqi; font-weight: 400; letter-spacing: 0; }",
  ".rl-balance { display: flex; justify-content: space-between; gap: 3cqi; margin-top: 3cqi; font-size: 2.9cqi; }",
  ".rl-code { display: block; height: 5cqi; width: 46%; margin: 4cqi auto 1cqi; }",
  ".rl-fine { text-align: center; font-size: 1.7cqi; letter-spacing: 0.2em; text-transform: uppercase; }",
  ".rl-float { position: absolute; left: 0; top: 0; z-index: 5; width: 220px; pointer-events: none; opacity: 0; transition: opacity 0.18s steps(3, end); filter: drop-shadow(0 12px 16px rgba(0,0,0,0.22)); will-change: transform; }",
  ".rl-float[data-on='true'] { opacity: 1; }",
  ".rl-float-in { background: var(--rl-paper); color: var(--rl-ink); font-family: var(--rl-mono); padding: 10px 10px 16px; font-size: 11px; line-height: 1.45; text-transform: uppercase; letter-spacing: 0.05em; }",
  ".rl-float-in .rl-print { border-width: 1px; margin-bottom: 7px; }",
  ".rl-float-t { font-size: 12px; letter-spacing: 0; text-transform: none; margin-bottom: 2px; }",
  ".rl-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }",
  "@container (max-width: 560px) {",
  "  .rl-paper { padding-left: 10cqi; padding-right: 10cqi; }",
  "  .rl-cols, .rl-row { grid-template-columns: 8cqi minmax(0, 1fr) 11cqi; }",
  "  .rl-dept { display: none; }",
  "  .rl-row { font-size: 4.2cqi; }",
  "  .rl-cols, .rl-stmt, .rl-meta, .rl-kv, .rl-fine { font-size: 2.8cqi; }",
  "  .rl-controls, .rl-sum, .rl-empty { font-size: 3.2cqi; }",
  "  .rl-card { grid-template-columns: 1fr; margin-left: 0; font-size: 3.4cqi; }",
  "  .rl-balance { font-size: 3.8cqi; }",
  "}",
  "@keyframes rl-print { from { clip-path: inset(0 100% 0 0); } to { clip-path: inset(0 0 0 0); } }",
  "@media (prefers-reduced-motion: reduce) {",
  "  .rl-li[data-print='true'] .rl-row { animation: none; }",
  "  .rl-open, .rl-open-in, .rl-row, .rl-tab, .rl-float { transition: none; }",
  "}",
  "@media (hover: none) { .rl-float { display: none; } }",
].join("\n")

function PixelText({ text, label }: { text: string; label?: string }) {
  const { runs, cols } = React.useMemo(() => pixelRuns(text), [text])
  const cell = 1.18
  return (
    <svg
      viewBox={"0 0 " + Math.max(1, cols * cell) + " 7"}
      role="img"
      aria-label={label ?? text}
      shapeRendering="crispEdges"
      style={{ display: "block", width: "100%", height: "auto", maxWidth: "none" }}
    >
      {runs.map((r, i) => (
        <rect key={i} x={r.x * cell} y={r.y} width={r.w * cell + 0.03} height={1.03} fill="currentColor" />
      ))}
    </svg>
  )
}

function Barcode({ code, className }: { code: string; className?: string }) {
  const bars = React.useMemo(() => barcodeBars(code, 160), [code])
  return (
    <svg className={className} viewBox="0 0 160 10" preserveAspectRatio="none" aria-hidden="true" style={{ maxWidth: "none" }}>
      {bars.map((b, i) => (
        <rect key={i} x={b.x} y={0} width={b.w} height={10} fill="currentColor" />
      ))}
    </svg>
  )
}

function Defs({ uid }: { uid: string }) {
  return (
    <svg width="0" height="0" aria-hidden="true" style={{ position: "absolute" }}>
      <defs>
        {DITHER_LEVELS.map((level, k) => (
          <pattern key={level} id={uid + "-d" + (k + 1)} width="4" height="4" patternUnits="userSpaceOnUse">
            {ditherCells(level).map(([x, y]) => (
              <rect key={x + "-" + y} x={x} y={y} width="1" height="1" fill="currentColor" />
            ))}
          </pattern>
        ))}
      </defs>
    </svg>
  )
}

function Poster({ seed, uid, paper }: { seed: string; uid: string; paper: string }) {
  const shapes = React.useMemo(() => posterShapes(seed), [seed])
  const fill = (tone: number) => (tone <= 0 ? paper : tone >= 5 ? "currentColor" : "url(#" + uid + "-d" + tone + ")")
  return (
    <svg className="rl-print" viewBox={"0 0 " + POSTER_W + " " + POSTER_H} aria-hidden="true">
      {shapes.map((s, i) => {
        const f = fill(s.tone)
        const stroke = i > 0 && s.tone < 5 ? { stroke: "currentColor", strokeWidth: 1.2 } : {}
        if (s.kind === "circle") return <circle key={i} cx={s.x} cy={s.y} r={s.r} fill={f} {...stroke} />
        if (s.kind === "rect") return <rect key={i} x={s.x} y={s.y} width={s.w} height={s.h} fill={f} {...stroke} />
        if (s.kind === "tri") return <path key={i} d={"M" + s.pts.map((p) => p.join(" ")).join(" L") + " Z"} fill={f} {...stroke} />
        return (
          <g key={i}>
            {Array.from({ length: s.n }, (_, k) => (
              <rect key={k} x={s.x} y={s.y + k * (s.h + 3)} width={s.w * (1 - k * 0.22)} height={s.h} fill={f} />
            ))}
          </g>
        )
      })}
    </svg>
  )
}

function Print({ entry, uid, paper }: { entry: LedgerEntry; uid: string; paper: string }) {
  if (entry.image)
    return (
      <div className="rl-img">
        <img src={entry.image} alt="" width={400} height={260} loading="lazy" style={{ maxWidth: "none" }} />
      </div>
    )
  return <Poster seed={entry.title} uid={uid} paper={paper} />
}

export default function ReceiptWorkLedger({
  title = "Index",
  statementNo = 14,
  account = "Mira Voss",
  entries = DEFAULT_ENTRIES,
  balance = "Your project",
  width = 760,
  height = "100svh",
  wall = "#e8e7e3",
  paper = "#f8f7f3",
  ink = "#141414",
  band = "rgba(20, 20, 20, 0.045)",
  fontMono = MONO,
  preview = true,
  onSelect,
  className = "",
}: ReceiptWorkLedgerProps) {
  const uid = "rl" + React.useId().replace(/[^a-zA-Z0-9]/g, "")
  const rootRef = React.useRef<HTMLElement>(null)
  const floatRef = React.useRef<HTMLDivElement>(null)
  const [dept, setDept] = React.useState("")
  const [sort, setSort] = React.useState<SortKey>("no")
  const [open, setOpen] = React.useState(-1)
  const [hover, setHover] = React.useState(-1)
  const [printKey, setPrintKey] = React.useState(0)
  const [reduced, setReduced] = React.useState(false)
  const pos = React.useRef({ x: 0, y: 0, tx: 0, ty: 0, vx: 0, seen: false })
  const raf = React.useRef(0)

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => setReduced(mq.matches)
    sync()
    mq.addEventListener("change", sync)
    return () => mq.removeEventListener("change", sync)
  }, [])

  React.useEffect(() => () => cancelAnimationFrame(raf.current), [])

  const depts = React.useMemo(() => departments(entries), [entries])
  const view = React.useMemo(() => ledgerView(entries, dept, sort), [entries, dept, sort])
  const span = React.useMemo(() => yearSpan(entries), [entries])

  const choose = (d: string) => {
    setDept(d)
    setOpen(-1)
    setPrintKey((k) => k + 1)
  }
  const order = (s: SortKey) => {
    setSort(s)
    setPrintKey((k) => k + 1)
  }
  const toggle = (i: number) => {
    const next = open === i ? -1 : i
    setOpen(next)
    onSelect?.(next)
  }

  // The print chases the cursor on its own loop and writes the transform
  // directly, so moving the mouse never re-renders the list.
  const tick = React.useCallback(() => {
    const p = pos.current
    const el = floatRef.current
    let last = performance.now()
    const step = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const px = p.x
      p.x = follow(p.x, p.tx, dt, reduced ? 0 : 0.09)
      p.y = follow(p.y, p.ty, dt, reduced ? 0 : 0.09)
      p.vx = dt > 0 ? (p.x - px) / dt : 0
      const tilt = Math.max(-8, Math.min(8, p.vx * 0.012))
      if (el) el.style.transform = "translate3d(" + p.x.toFixed(1) + "px, " + p.y.toFixed(1) + "px, 0) rotate(" + (tilt - 2).toFixed(2) + "deg)"
      if (p.x !== p.tx || p.y !== p.ty) raf.current = requestAnimationFrame(step)
      else raf.current = 0
    }
    if (!raf.current) raf.current = requestAnimationFrame(step)
  }, [reduced])

  const onMove = (e: React.PointerEvent) => {
    if (!preview || e.pointerType !== "mouse") return
    const root = rootRef.current
    if (!root) return
    const r = root.getBoundingClientRect()
    const x = e.clientX - r.left + 26
    const y = e.clientY - r.top - 60
    const p = pos.current
    p.tx = Math.min(x, r.width - 236)
    p.ty = y
    if (!p.seen) {
      p.x = p.tx
      p.y = p.ty
      p.seen = true
    }
    tick()
  }

  const hovered = hover >= 0 ? entries[hover] : null
  const rows = view.length

  const rootStyle = {
    minHeight: height,
    background: wall,
    color: ink,
    "--rl-wall": wall,
    "--rl-paper": paper,
    "--rl-ink": ink,
    "--rl-band": band || "transparent",
    "--rl-mono": fontMono,
    "--rl-tile": PAPER_TILE,
  } as React.CSSProperties

  return (
    <section
      ref={rootRef}
      className={"rl-root w-full " + className}
      style={rootStyle}
      aria-label={title + " ledger"}
      onPointerMove={onMove}
      onPointerLeave={() => {
        setHover(-1)
        pos.current.seen = false
      }}
    >
      <style>{styles}</style>
      <div className="rl-shade" aria-hidden="true" />
      <Defs uid={uid} />
      <div className="rl-sheet" style={{ width: "min(" + width + "px, 100%)" }}>
        <article className="rl-paper">
          <span className="rl-holes rl-holes-l" aria-hidden="true" />
          <span className="rl-holes rl-holes-r" aria-hidden="true" />
          <span className="rl-perf" style={{ top: 0 }} aria-hidden="true" />
          <span className="rl-perf" style={{ bottom: 0 }} aria-hidden="true" />

          <header className="rl-head">
            <div className="rl-title">
              <PixelText text={title} />
            </div>
            <div className="rl-stmt">
              {"Statement №" + pad3(statementNo)}
              <br />
              {"Page 01 of 01"}
            </div>
          </header>
          <div className="rl-bar" aria-hidden="true" />
          <div className="rl-meta">
            <span>{"Account: " + account}</span>
            {span ? <span>{"Period: " + span}</span> : null}
            <span>{"Lines: " + entries.length}</span>
          </div>

          <div className="rl-dash" aria-hidden="true" />
          <div className="rl-controls">
            <div className="rl-group" role="group" aria-label="Department">
              <span>Dept:</span>
              <button type="button" className="rl-tab" aria-pressed={dept === ""} onClick={() => choose("")}>
                {"[All " + entries.length + "]"}
              </button>
              {depts.map((d) => (
                <button key={d.dept} type="button" className="rl-tab" aria-pressed={dept === d.dept} onClick={() => choose(d.dept)}>
                  {"[" + d.dept + " " + d.count + "]"}
                </button>
              ))}
            </div>
            <div className="rl-group" role="group" aria-label="Sort">
              <span>Sort:</span>
              <button type="button" className="rl-tab" aria-pressed={sort === "no"} onClick={() => order("no")}>
                [No.]
              </button>
              <button type="button" className="rl-tab" aria-pressed={sort === "year"} onClick={() => order("year")}>
                [Year]
              </button>
            </div>
          </div>
          <div className="rl-dash" aria-hidden="true" />

          <div className="rl-cols" aria-hidden="true">
            <span>No.</span>
            <span>Item</span>
            <span className="rl-dept">Dept</span>
            <span className="rl-year">Year</span>
          </div>

          <ul className="rl-list" key={printKey}>
            {view.map((i, k) => {
              const e = entries[i]
              const isOpen = open === i
              return (
                <li key={i} className="rl-li" data-band={band && k % 3 === 2 ? "true" : "false"} data-print={printKey > 0 && !reduced ? "true" : "false"} style={{ "--k": k } as React.CSSProperties}>
                  <button
                    type="button"
                    id={uid + "-r" + i}
                    className="rl-row"
                    aria-expanded={isOpen}
                    aria-controls={uid + "-o" + i}
                    onClick={() => toggle(i)}
                    onPointerEnter={(ev) => ev.pointerType === "mouse" && setHover(i)}
                    onPointerLeave={() => setHover(-1)}
                  >
                    <span>{pad3(i + 1)}</span>
                    <span className="rl-item">
                      <span className="rl-item-t">{e.title}</span>
                      <span className="rl-dots" aria-hidden="true" />
                    </span>
                    <span className="rl-dept">{e.dept}</span>
                    <span className="rl-year">{e.year}</span>
                  </button>
                  <div id={uid + "-o" + i} role="region" aria-labelledby={uid + "-r" + i} className="rl-open" data-open={isOpen ? "true" : "false"}>
                    <div className="rl-open-in">
                      <div className="rl-card">
                        <Print entry={e} uid={uid} paper={paper} />
                        <div>
                          {e.summary ? <p>{e.summary}</p> : null}
                          {e.client ? (
                            <div className="rl-kv">
                              <span>Client</span>
                              <span className="rl-dots" aria-hidden="true" />
                              <span>{e.client}</span>
                            </div>
                          ) : null}
                          <div className="rl-kv">
                            <span>Dept</span>
                            <span className="rl-dots" aria-hidden="true" />
                            <span>{e.dept}</span>
                          </div>
                          <div className="rl-kv" style={{ marginBottom: "1.6cqi" }}>
                            <span>Year</span>
                            <span className="rl-dots" aria-hidden="true" />
                            <span>{e.year}</span>
                          </div>
                          {e.href ? (
                            <a href={e.href} target={/^https?:/.test(e.href) ? "_blank" : undefined} rel="noreferrer">
                              {"View case ↗"}
                            </a>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
          {rows === 0 ? <p className="rl-empty">** No lines in this department **</p> : null}

          <div className="rl-dash" aria-hidden="true" />
          <div className="rl-sum">
            <span>
              Items
              <b>{String(rows).padStart(2, "0")}</b>
            </span>
            <span>
              Depts
              <b>{String(dept ? 1 : depts.length).padStart(2, "0")}</b>
            </span>
            <span>
              Period
              <b>{yearSpan(view.map((i) => entries[i])) || "–"}</b>
            </span>
          </div>
          {balance ? (
            <>
              <div className="rl-dash" aria-hidden="true" />
              <div className="rl-balance">
                <span>Balance due</span>
                <span>{balance}</span>
              </div>
            </>
          ) : null}
          <Barcode code={title + statementNo + dept} className="rl-code" />
          <p className="rl-fine">** Customer copy **</p>
        </article>
      </div>

      {preview ? (
        <div ref={floatRef} className="rl-float" data-on={hovered && open !== hover ? "true" : "false"} aria-hidden="true">
          {hovered ? (
            <div className="rl-float-in">
              <Print entry={hovered} uid={uid} paper={paper} />
              <div className="rl-float-t">{hovered.title}</div>
              <div>{pad3(hover + 1) + " / " + hovered.dept + " / " + hovered.year}</div>
            </div>
          ) : null}
        </div>
      ) : null}

      <p className="rl-sr" aria-live="polite">
        {rows + " of " + entries.length + " lines" + (dept ? " in " + dept : "")}
      </p>
    </section>
  )
}
