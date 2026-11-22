"use client"

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactElement,
  type PointerEvent as ReactPointerEvent,
} from "react"

// #region layout
// Scales, stacking, geometry and keyboard movement. Pure: no React, no DOM.
// The test lifts this region and runs it.

export const PITCH = 10
export const DOT = 8.2

export type Stack = { up: number[]; down: number[]; flat: number[] }
export type Geometry = {
  W: number
  H: number
  left: number
  right: number
  top: number
  y0: number
  up: number
  down: number
  plotBottom: number
  flatTop: number
  flatRows: number
}

export const DEFAULT_THRESHOLDS = [-0.8, -0.6, -0.4, -0.2, 0, 0.2, 0.4, 0.6, 0.8]

/** Which colour bin a value falls in: "−0.8% and below" is the first, "+0.8% and above" the last. */
export function binOf(v: number, thresholds: number[]) {
  let b = 0
  for (const t of thresholds) if (v < 0 ? t < v : t <= v) b++
  return b
}

/** Sector indices for one month: risers from the baseline up, fallers from the baseline down. */
export function stackMonth(row: (number | null | undefined)[]): Stack {
  const up: number[] = []
  const down: number[] = []
  const flat: number[] = []
  row.forEach((v, s) => {
    if (v == null || !Number.isFinite(v)) return
    if (v > 0) up.push(s)
    else if (v < 0) down.push(s)
    else flat.push(s)
  })
  up.sort((a, b) => (row[a] as number) - (row[b] as number) || a - b)
  down.sort((a, b) => (row[b] as number) - (row[a] as number) || a - b)
  return { up, down, flat }
}

/** Top-to-bottom visual order of a column, the order ↑ and ↓ walk through. */
export function columnOrder(st: Stack) {
  return [...st.up].reverse().concat(st.down, st.flat)
}

/** The tallest stack on each side, so the axes are no longer than the data needs. */
export function extent(stacks: Stack[]) {
  let up = 0
  let down = 0
  let flat = 0
  for (const st of stacks) {
    if (st.up.length > up) up = st.up.length
    if (st.down.length > down) down = st.down.length
    if (st.flat.length > flat) flat = st.flat.length
  }
  return { up, down, flat }
}

/** Chart geometry in viewBox units. The two axes are rounded up to the next 5. */
export function geometry(months: number, up: number, down = up, flatRows = 1): Geometry {
  const left = 70
  const right = 14
  const top = 6
  const u = Math.max(5, Math.ceil(up / 5) * 5)
  const d = Math.max(5, Math.ceil(down / 5) * 5)
  const rows = Math.max(1, flatRows)
  const y0 = top + u * PITCH
  const plotBottom = y0 + d * PITCH
  const flatTop = plotBottom + 18
  return { W: left + months * PITCH + right, H: flatTop + rows * PITCH + 6, left, right, top, y0, up: u, down: d, plotBottom, flatTop, flatRows: rows }
}

/** Top-left of the k-th dot (1-based) on a side: 1 rising, -1 falling, 0 flat. */
export function dotAt(g: Geometry, m: number, side: number, k: number) {
  const pad = (PITCH - DOT) / 2
  const x = g.left + m * PITCH + pad
  const y = side > 0 ? g.y0 - k * PITCH + pad : side < 0 ? g.y0 + (k - 1) * PITCH + pad : g.flatTop + (k - 1) * PITCH + pad
  return { x, y }
}

/** "2006-01" → months since year 0. */
export function parseMonth(s: string) {
  const m = /^(\d{4})-(\d{1,2})$/.exec(String(s).trim())
  if (!m) return 0
  return Number(m[1]) * 12 + Number(m[2]) - 1
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

export function monthName(abs: number, short = false) {
  const y = Math.floor(abs / 12)
  const n = MONTHS[abs - y * 12]
  return (short ? n.slice(0, 3) : n) + " " + y
}

export function fmtPct(v: number) {
  if (v === 0) return "0.00%"
  return (v > 0 ? "+" : "−") + Math.abs(v).toFixed(2) + "%"
}

/** A legend boundary: "−0.5%", "0%", "+1%". */
export function tickLabel(v: number) {
  return v === 0 ? "0%" : (v > 0 ? "+" : "−") + Math.abs(v) + "%"
}

/** Every other boundary once there are too many to label them all. */
export function defaultTicks(thresholds: number[]) {
  return thresholds.length > 5 ? thresholds.filter((_, i) => i % 2 === 0) : thresholds.slice()
}

export function ordinal(n: number) {
  const t = n % 100
  if (t >= 11 && t <= 13) return n + "th"
  return n + (["th", "st", "nd", "rd"][n % 10] || "th")
}

/** Where a sector sits in its month, in words. */
export function rankText(st: Stack, s: number) {
  let i = st.up.indexOf(s)
  if (i > -1) return st.up.length - i === 1 ? "Strongest gain of " + st.up.length + " rising" : ordinal(st.up.length - i) + " of " + st.up.length + " rising"
  i = st.down.indexOf(s)
  if (i > -1) return st.down.length - i === 1 ? "Steepest loss of " + st.down.length + " falling" : ordinal(st.down.length - i) + " of " + st.down.length + " falling"
  return "No change this month"
}

/** Keyboard: ←/→ keep following the same sector through time, ↑/↓ walk the column. */
export function step(stacks: Stack[], m: number, s: number, key: string, shift = false) {
  const last = stacks.length - 1
  const col = (mm: number) => columnOrder(stacks[mm])
  const keep = (mm: number) => {
    const o = col(mm)
    return o.includes(s) ? s : o.length ? o[0] : -1
  }
  if (key === "ArrowLeft" || key === "ArrowRight") {
    const d = (key === "ArrowLeft" ? -1 : 1) * (shift ? 12 : 1)
    const mm = Math.max(0, Math.min(last, m + d))
    return { m: mm, s: keep(mm) }
  }
  if (key === "Home") return { m: 0, s: keep(0) }
  if (key === "End") return { m: last, s: keep(last) }
  if (key === "ArrowUp" || key === "ArrowDown") {
    const o = col(m)
    if (!o.length) return { m, s: -1 }
    const i = o.indexOf(s)
    const j = i < 0 ? 0 : Math.max(0, Math.min(o.length - 1, i + (key === "ArrowUp" ? -1 : 1)))
    return { m, s: o[j] }
  }
  return { m, s }
}

/** The "what if it never happened" values a band with imagine swaps in. Deterministic. */
export function imagined(v: number, m: number, s: number) {
  const wobble = ((m * 7 + s * 13) % 10) / 100
  return Math.round((Math.abs(v) * 0.3 + 0.06 + wobble) * 100) / 100
}

/** The month with the most fallers and the month with the most risers. null when there is no data. */
export function summarize(stacks: Stack[], start: number) {
  if (!stacks.length) return null
  let worst = 0
  let best = 0
  stacks.forEach((st, m) => {
    if (st.down.length > stacks[worst].down.length) worst = m
    if (st.up.length > stacks[best].up.length) best = m
  })
  return {
    worst: { m: worst, label: monthName(start + worst), falling: stacks[worst].down.length },
    best: { m: best, label: monthName(start + best), rising: stacks[best].up.length },
  }
}

/** One sector across the whole series: how many months it rose, fell and stood still. */
export function sectorStats(rows: (number | null)[][], s: number) {
  let up = 0
  let down = 0
  let flat = 0
  for (const row of rows) {
    const v = row[s]
    if (v == null || !Number.isFinite(v)) continue
    if (v > 0) up++
    else if (v < 0) down++
    else flat++
  }
  return { up, down, flat }
}

/** Squares the input off: one value per name in every row, null for anything missing or not a number. */
export function normalize(data: (number | null | undefined)[][], names: string[]) {
  let cols = names.length
  for (const row of data) if (row && row.length > cols) cols = row.length
  const sectors = Array.from({ length: cols }, (_, i) => names[i] ?? "Series " + (i + 1))
  const rows = data.map((row) => sectors.map((_, s) => (row && typeof row[s] === "number" && Number.isFinite(row[s]) ? (row[s] as number) : null)))
  return { sectors, rows }
}
// #endregion

export type TideBand = {
  /** First month, "YYYY-MM". */
  from: string
  /** Last month, "YYYY-MM". */
  to: string
  label: string
  /** Makes the label a button that briefly redraws these months as if every sector had grown. Off by default. */
  imagine?: boolean
}
export type TideScale = { thresholds: number[]; colors: string[] }
export type TideLabels = { rising?: string; falling?: string; flat?: string }

export type SectorTideMatrixProps = {
  /** One row per month, one value per sector: the change from the month before. 0 is unchanged, null is missing. */
  data?: (number | null)[][]
  /** Sector names, in the same order as each row of data. */
  sectors?: string[]
  /** First month of data, "YYYY-MM". */
  start?: string
  /** Shaded periods, such as a recession. */
  bands?: TideBand[]
  /** thresholds.length + 1 colours, from the steepest loss to the strongest gain. */
  scale?: TideScale
  /** Boundary values printed under the legend. Defaults to every other threshold. */
  legendTicks?: number[]
  /** The sector followed on load, by name. */
  defaultPinned?: string | null
  onPinChange?: (sector: string | null) => void
  /** How a value is written in tooltips, the picker and announcements. Defaults to a signed percentage. */
  formatValue?: (value: number) => string
  eyebrow?: string
  title?: string
  description?: string
  legendLabel?: string
  footnote?: string
  labels?: TideLabels
  /** Shown instead of the chart when data is empty. */
  emptyMessage?: string
  /** Height of the stage. Any CSS length. */
  height?: string | number
  className?: string
  style?: CSSProperties
}

// A diverging scale: two hues that stay apart under colour-vision deficiency, each
// mixed into the host background so a small move is "less ink" in light and dark alike.
const LOSS = "#e2512a"
const GAIN = "#2a72d8"
const STEPS = [100, 84, 68, 53, 38]
const tint = (hex: string, p: number) => (p >= 100 ? hex : "color-mix(in oklab, " + hex + " " + p + "%, var(--color-background))")
const DEFAULT_COLORS = STEPS.map((p) => tint(LOSS, p)).concat(STEPS.slice().reverse().map((p) => tint(GAIN, p)))
const FLAT_COLOR = "var(--stm-flat)"

/** Fixed pixels above the dots: the year axis and the band labels. Matches 44px in the CSS. */
const HEAD = 44
/** How far the dots may flatten to fill a short stage before the chart narrows instead. Matches .74 in the CSS. */
const SQUASH = 0.74
/** The frame's padding, a side: room for the focus ring outside the plot. Matches 6px in the CSS. */
const FRAME_PAD = 6
const NO_BANDS: TideBand[] = []
const NO_DATA: (number | null)[][] = []
const NO_NAMES: string[] = []

const CSS =
  ".stm-root{position:relative;display:flex;flex-direction:column;width:100%;overflow:hidden;container:stm / inline-size;background:var(--color-background);color:var(--color-foreground);font-variant-numeric:tabular-nums;-webkit-font-smoothing:antialiased;--stm-ink:color-mix(in oklab,var(--color-foreground) 6%,transparent);--stm-flat:color-mix(in oklab,var(--color-muted-foreground) 62%,var(--color-background));--stm-gain:#2a72d8}" +
  ".stm-wrap{display:flex;flex-direction:column;flex:1 1 auto;min-height:0;overflow-y:auto;scrollbar-width:thin;width:100%;max-width:1320px;margin:0 auto;padding:clamp(20px,4.5vh,48px) clamp(16px,3.2cqw,44px) clamp(12px,2.4vh,22px)}" +
  ".stm-head{display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:18px 56px}" +
  ".stm-copy{min-width:0;max-width:620px}" +
  ".stm-eyebrow{display:flex;align-items:center;gap:10px;margin:0 0 10px;font-size:11px;line-height:1.2;letter-spacing:.16em;text-transform:uppercase;color:var(--color-muted-foreground)}" +
  ".stm-eyebrow i{display:block;flex:none;width:18px;height:1px;background:currentColor}" +
  ".stm-title{margin:0;font-size:clamp(22px,2.6cqw,32px);font-weight:600;line-height:1.1;letter-spacing:-.025em;text-wrap:balance}" +
  ".stm-desc{margin:8px 0 0;font-size:14px;line-height:1.55;color:var(--color-muted-foreground);text-wrap:pretty}" +
  ".stm-legend{display:flex;flex-direction:column;gap:2px;min-width:0;margin:0;padding:0;border:0}" +
  ".stm-legend-cap{font-size:12px;line-height:1.3;color:var(--color-muted-foreground)}" +
  ".stm-scale{display:flex;align-items:flex-start;gap:16px}" +
  ".stm-ramp{min-width:0}" +
  ".stm-sws{display:flex}" +
  ".stm-sw{flex:none;width:30px;height:28px;padding:6px 1px;border:0;background:none;cursor:pointer}" +
  ".stm-sw i{display:block;height:16px;border-radius:2px;background:var(--c);transition:transform .25s cubic-bezier(.3,1.4,.5,1),opacity .2s,box-shadow .2s}" +
  ".stm-sw:first-child i{border-radius:5px 2px 2px 5px}" +
  ".stm-sw:last-child i{border-radius:2px 5px 5px 2px}" +
  ".stm-sw:hover i{transform:translateY(-2px)}" +
  ".stm-sw:focus-visible{outline:0}" +
  ".stm-sw:focus-visible i{box-shadow:0 0 0 2px var(--color-background),0 0 0 4px var(--color-foreground)}" +
  ".stm-legend[data-f] .stm-sw[aria-pressed=false] i{opacity:.28}" +
  ".stm-sw[aria-pressed=true] i{transform:translateY(-2px);box-shadow:0 0 0 2px var(--color-background),0 0 0 3.5px var(--color-foreground)}" +
  ".stm-ticks{position:relative;height:14px;font-size:11px;line-height:14px;color:var(--color-muted-foreground)}" +
  ".stm-ticks span{position:absolute;top:0;transform:translateX(-50%);white-space:nowrap}" +
  ".stm-ticks span:before{content:'';position:absolute;left:50%;top:-4px;width:1px;height:4px;background:currentColor;opacity:.6}" +
  ".stm-none{display:inline-flex;flex:none;align-items:center;gap:7px;height:28px;font-size:11.5px;line-height:1;white-space:nowrap;color:var(--color-muted-foreground)}" +
  ".stm-none i{display:block;width:14px;height:14px;border-radius:3px;background:var(--stm-flat)}" +
  ".stm-btn{display:inline-flex;align-items:center;gap:8px;height:36px;padding:0 14px;border:1px solid var(--color-border);border-radius:999px;background:var(--color-background);color:var(--color-foreground);font:inherit;font-size:13px;line-height:1;white-space:nowrap;cursor:pointer;transition:border-color .2s,background-color .2s,opacity .2s,transform .12s ease-out}" +
  ".stm-btn:hover:not(:disabled){border-color:color-mix(in oklab,var(--color-foreground) 32%,transparent);background:color-mix(in oklab,var(--color-foreground) 5%,var(--color-background))}" +
  ".stm-btn:active:not(:disabled){transform:scale(.97)}" +
  ".stm-btn:focus-visible{outline:2px solid var(--color-foreground);outline-offset:2px}" +
  ".stm-btn:disabled{opacity:.4;cursor:default}" +
  ".stm-btn svg{flex:none}" +
  ".stm-pip{display:block;flex:none;width:8px;height:8px;border-radius:2.5px;background:var(--color-foreground)}" +
  ".stm-pip[data-off]{background:none;box-shadow:inset 0 0 0 1.2px var(--color-muted-foreground)}" +
  ".stm-bar{position:relative;z-index:4;display:flex;flex-wrap:wrap;align-items:center;gap:10px 16px;margin-top:clamp(16px,2.8vh,26px);padding:10px 0;border-top:1px solid var(--color-border);border-bottom:1px solid var(--color-border)}" +
  ".stm-pickwrap{position:relative;flex:none;min-width:0}" +
  ".stm-pick{position:relative;max-width:100%;padding:0 34px 0 14px}" +
  ".stm-pick em{font-style:normal;color:var(--color-muted-foreground)}" +
  ".stm-pick strong{max-width:210px;overflow:hidden;font-weight:500;line-height:1.4;text-overflow:ellipsis}" +
  ".stm-pick>svg{position:absolute;right:13px;top:50%;margin-top:-5px;transition:transform .25s}" +
  ".stm-pick[data-open]>svg{transform:rotate(180deg)}" +
  ".stm-pick[data-open]{border-color:color-mix(in oklab,var(--color-foreground) 32%,transparent)}" +
  ".stm-menu{position:absolute;left:0;top:calc(100% + 8px);width:300px;max-width:calc(100cqw - 32px);max-height:min(360px,56svh);overflow-y:auto;overscroll-behavior:contain;padding:0 6px 6px;border-radius:12px;background:var(--color-background);box-shadow:0 0 0 1px var(--color-border),0 24px 48px -20px rgba(0,0,0,.4);outline:0;scrollbar-width:thin;animation:stm-menu .2s cubic-bezier(.2,.8,.2,1);transform-origin:20px 0}" +
  "@keyframes stm-menu{from{opacity:0;transform:translateY(-6px) scale(.98)}}" +
  ".stm-menu-cap{position:sticky;top:0;z-index:1;display:flex;justify-content:space-between;margin:0 -6px 4px;padding:10px 16px 8px;background:var(--color-background);border-bottom:1px solid var(--color-border);font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--color-muted-foreground)}" +
  ".stm-opt{display:flex;align-items:center;gap:8px;padding:7px 10px 7px 6px;border-radius:7px;font-size:13px;line-height:1.3;white-space:nowrap;cursor:pointer}" +
  ".stm-opt[data-hi]{background:color-mix(in oklab,var(--color-foreground) 7%,transparent)}" +
  ".stm-opt[aria-selected=true]{font-weight:600}" +
  ".stm-opt-none{margin-bottom:4px;color:var(--color-muted-foreground)}" +
  ".stm-check{display:flex;flex:none;width:14px;justify-content:center}" +
  ".stm-opt-name{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis}" +
  ".stm-chip{display:inline-flex;flex:none;align-items:center;gap:7px;font-size:11.5px;font-weight:400;color:var(--color-muted-foreground)}" +
  ".stm-chip i{display:block;width:9px;height:9px;border-radius:2.5px;background:var(--c)}" +
  ".stm-read{flex:1 1 220px;min-width:0;margin:0;overflow:hidden;font-size:12.5px;line-height:1.4;white-space:nowrap;text-overflow:ellipsis;color:var(--color-muted-foreground)}" +
  ".stm-read strong{font-weight:600;color:var(--color-foreground)}" +
  ".stm-read>*+*:before{content:'';display:inline-block;width:3px;height:3px;margin:0 9px 2px;border-radius:50%;background:var(--color-muted-foreground);opacity:.7;vertical-align:middle}" +
  ".stm-acts{display:flex;flex:none;gap:8px;margin-left:auto}" +
  ".stm-stage{position:relative;display:flex;flex:1 1 0;min-height:0;margin-top:clamp(12px,2.4vh,24px)}" +
  ".stm-stage:after{content:'';position:absolute;top:0;right:-6px;bottom:0;z-index:1;width:46px;pointer-events:none;background:linear-gradient(to right,transparent,var(--color-background) 87%);opacity:0;transition:opacity .25s}" +
  ".stm-stage[data-more]:after{opacity:1}" +
  ".stm-stage:before{content:'';position:absolute;top:0;left:-6px;z-index:1;width:46px;height:44px;pointer-events:none;background:linear-gradient(to left,transparent,var(--color-background) 62%);opacity:0;transition:opacity .25s}" +
  ".stm-stage[data-less]:before{opacity:1}" +
  ".stm-frame{position:relative;display:flex;flex:1 1 0;min-width:0;margin:-6px;padding:6px;container-type:size;overflow-x:auto;overflow-y:hidden;overscroll-behavior-x:contain;scrollbar-width:thin}" +
  ".stm-plot{--stm-pw:max(var(--stm-mn),min(100cqw,var(--stm-mx),calc((100cqh - 44px) * var(--stm-r) / .74)));--stm-ph:calc(44px + clamp(calc(var(--stm-pw) / var(--stm-r) * .74),calc(100cqh - 44px),calc(var(--stm-pw) / var(--stm-r))));position:relative;display:flex;flex-direction:column;flex:none;width:var(--stm-pw);height:var(--stm-ph);margin:max(0px,calc((100cqh - var(--stm-ph)) * .33)) auto auto;outline:0;border-radius:8px;touch-action:pan-x pan-y}" +
  ".stm-plot:focus-visible{outline:2px solid var(--color-foreground);outline-offset:3px}" +
  ".stm-band{position:absolute;top:22px;border-radius:4px;background:var(--stm-ink);pointer-events:none;transition:background-color .5s}" +
  ".stm-band[data-on]{background:color-mix(in oklab,var(--stm-gain) 13%,transparent)}" +
  ".stm-top{position:relative;flex:none;height:44px}" +
  ".stm-yrs{position:absolute;inset:0;pointer-events:none}" +
  ".stm-yr{position:absolute;top:1px;transform:translateX(-50%);font-size:12px;font-weight:500;line-height:14px;white-space:nowrap;transition:opacity .2s}" +
  ".stm-yr:after{content:'';position:absolute;left:50%;top:16px;width:1px;height:4px;background:var(--color-muted-foreground);opacity:.55}" +
  ".stm-yrs[data-dim] .stm-yr{opacity:.3}" +
  ".stm-yrs .stm-yr[data-off]{opacity:0}" +
  ".stm-pill{position:absolute;top:0;transform:translateX(-50%);padding:0 9px;border-radius:999px;background:var(--color-foreground);color:var(--color-background);font-size:11px;font-weight:600;line-height:18px;white-space:nowrap}" +
  ".stm-tag{position:absolute;top:25px;z-index:2;transform:translateX(-50%);margin:0;padding:1px 6px 1px 8px;border:0;border-radius:6px;background:none;color:var(--color-muted-foreground);font:inherit;font-size:10.5px;line-height:14px;letter-spacing:.18em;text-transform:uppercase;white-space:nowrap;transition:color .3s,background-color .3s}" +
  ".stm-tag[data-egg]{cursor:pointer}" +
  ".stm-tag[data-egg]:hover{color:var(--color-foreground)}" +
  ".stm-tag[data-egg]:focus-visible{outline:2px solid var(--color-foreground)}" +
  ".stm-tag[data-on]{color:var(--color-foreground);background:color-mix(in oklab,var(--stm-gain) 22%,var(--color-background))}" +
  ".stm-body{position:relative;display:flex;flex:1 1 0;min-height:0}" +
  ".stm-y{position:sticky;left:0;z-index:2;flex:none;font-size:11px;line-height:1;color:var(--color-muted-foreground);background:linear-gradient(to right,var(--color-background) 88%,transparent)}" +
  ".stm-stage[data-less] .stm-y{box-shadow:-6px 0 0 var(--color-background)}" +
  ".stm-y span{position:absolute;right:11px;transform:translateY(-50%);white-space:nowrap}" +
  ".stm-y b{position:absolute;left:1px;writing-mode:vertical-rl;transform:translateY(-50%) rotate(180deg);font-size:10px;font-weight:400;letter-spacing:.14em;text-transform:uppercase;white-space:nowrap}" +
  ".stm-svg{position:absolute;inset:0;display:block;width:100%;height:100%;max-width:none;overflow:visible}" +
  ".stm-base{stroke:var(--color-foreground);stroke-width:1px;opacity:.3;vector-effect:non-scaling-stroke}" +
  ".stm-hair{fill:color-mix(in oklab,var(--color-foreground) 9%,transparent)}" +
  ".stm-hit{fill:transparent}" +
  ".stm-dot{cursor:pointer;transform-box:fill-box;transform-origin:50% 50%;transition:translate .9s cubic-bezier(.65,0,.25,1) calc(var(--k) * 16ms),fill .6s ease calc(var(--k) * 16ms),opacity .3s}" +
  ".stm-flat{fill:var(--stm-flat)}" +
  ".stm-dots[data-follow]:not([data-filter]) .stm-dot{opacity:.34}" +
  ".stm-dots .stm-dot.is-dim{opacity:.1}" +
  ".stm-build .stm-dot{animation:stm-rise .62s cubic-bezier(.2,.85,.3,1.18) var(--d) backwards}" +
  "@keyframes stm-rise{from{transform:translateY(var(--o)) scale(.25);opacity:0}}" +
  ".stm-trail{fill:none;stroke:var(--color-foreground);stroke-width:1;stroke-linejoin:round;stroke-linecap:round;opacity:.42;transition:opacity .4s}" +
  ".stm-trail[data-off]{opacity:0}" +
  ".stm-draw{stroke-dasharray:1;animation:stm-draw 1.5s cubic-bezier(.45,0,.2,1) var(--d,0ms) backwards}" +
  "@keyframes stm-draw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}" +
  ".stm-pin{cursor:pointer;stroke:var(--color-foreground);stroke-width:1.5px;vector-effect:non-scaling-stroke;transition:translate .9s cubic-bezier(.65,0,.25,1) calc(var(--k) * 16ms),fill .6s ease}" +
  ".stm-pins{animation:stm-fade .5s ease var(--d,0ms) backwards}" +
  "@keyframes stm-fade{from{opacity:0}}" +
  ".stm-ring{fill:none;stroke:var(--color-foreground);stroke-width:2px;vector-effect:non-scaling-stroke;pointer-events:none}" +
  ".stm-tip{position:absolute;z-index:3;width:max-content;min-width:150px;max-width:260px;pointer-events:none;border-radius:8px;overflow:hidden;background:var(--color-background);box-shadow:0 0 0 1px var(--color-border),0 12px 32px -12px rgba(0,0,0,.35);font-size:12.5px;line-height:1.35;animation:stm-pop .16s ease-out}" +
  ".stm-tip b{display:block;padding:7px 11px 6px;background:var(--color-foreground);color:var(--color-background);font-weight:600}" +
  ".stm-tip span{display:flex;align-items:center;gap:8px;padding:8px 11px 0;white-space:nowrap}" +
  ".stm-tip span i{flex:none;width:9px;height:9px;border-radius:2.5px;background:var(--c)}" +
  ".stm-tip small{display:block;padding:3px 11px 9px;font-size:11.5px;color:var(--color-muted-foreground)}" +
  ".stm-tip em{display:block;padding:6px 11px 7px;border-top:1px solid var(--color-border);font-size:11px;font-style:normal;color:var(--color-muted-foreground)}" +
  "@keyframes stm-pop{from{opacity:0}}" +
  ".stm-empty{display:flex;flex:1 1 0;flex-direction:column;align-items:center;justify-content:center;gap:6px;min-height:200px;margin-top:clamp(16px,2.8vh,26px);padding:24px;border:1px dashed var(--color-border);border-radius:12px;font-size:13px;line-height:1.5;text-align:center;color:var(--color-muted-foreground)}" +
  ".stm-empty strong{font-size:14px;font-weight:600;color:var(--color-foreground)}" +
  ".stm-foot{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px 24px;margin-top:auto;padding-top:clamp(10px,2vh,18px);font-size:11.5px;line-height:1.5;color:var(--color-muted-foreground);transition:opacity .2s}" +
  ".stm-root[data-toast] .stm-foot{opacity:0}" +
  ".stm-keys{margin-left:auto}" +
  ".stm-foot kbd{display:inline-block;min-width:18px;margin:0 2px;padding:1px 5px;border:1px solid var(--color-border);border-bottom-width:2px;border-radius:4px;font:inherit;font-size:10.5px;text-align:center;color:var(--color-foreground)}" +
  ".stm-toast{position:absolute;left:50%;bottom:clamp(8px,1.6vh,18px);z-index:5;padding:10px 16px;border-radius:999px;background:var(--color-foreground);color:var(--color-background);font-size:13px;white-space:nowrap;pointer-events:none;opacity:0;transform:translate(-50%,10px) scale(.96);transition:opacity .3s,transform .5s cubic-bezier(.3,1.5,.5,1)}" +
  ".stm-toast[data-on]{opacity:1;transform:translate(-50%,0);transition-delay:.15s}" +
  ".stm-sr{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}" +
  "@container stm (max-width:640px){.stm-head{gap:14px}.stm-desc{font-size:13px}.stm-legend{width:100%}.stm-ramp{flex:1 1 auto}.stm-sw{flex:1 1 0;width:auto}.stm-read{order:3;flex:1 1 100%}.stm-pickwrap{flex:1 1 0}.stm-pick{width:100%}.stm-pick em{display:none}.stm-pick strong{flex:1 1 auto;max-width:none;text-align:left}.stm-stage{flex:none}.stm-frame{container-type:inline-size}.stm-plot{--stm-ph:calc(44px + var(--stm-pw) / var(--stm-r));margin-top:0}.stm-keys{display:none}}" +
  "@media (hover:none){.stm-keys{display:none}}" +
  "@media (prefers-reduced-motion:reduce){.stm-build .stm-dot,.stm-draw,.stm-pins,.stm-tip,.stm-menu{animation:none}.stm-dot,.stm-pin,.stm-sw i,.stm-btn,.stm-pick>svg,.stm-tag,.stm-band,.stm-toast,.stm-trail,.stm-yr,.stm-foot,.stm-stage:after,.stm-stage:before{transition:none}}"

type Cell = { m: number; s: number; v: number; side: number; k: number; bin: number; x: number; y: number }
type Active = { m: number; s: number }

// Layout effects warn on the server; this one only ever nudges a tooltip in the browser.
const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect

const ChevronDown = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 3.8 5 6.8l3-3" />
  </svg>
)

const Check = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2.5 6.3 5 8.7l4.6-5.2" />
  </svg>
)

/** A listbox, not a native select: styled, sized to the stage, and it never leaves the screen. */
function SectorPicker({
  sectors,
  pinned,
  latest,
  latestLabel,
  colors,
  thresholds,
  fmt,
  onPick,
}: {
  sectors: string[]
  pinned: number
  latest: (number | null)[]
  latestLabel: string
  colors: string[]
  thresholds: number[]
  fmt: (v: number) => string
  onPick: (s: number) => void
}) {
  const id = "stmp" + useId().replace(/[^a-zA-Z0-9]/g, "")
  const [open, setOpen] = useState(false)
  const [hi, setHi] = useState(0)
  const wrapRef = useRef(null as HTMLDivElement | null)
  const btnRef = useRef(null as HTMLButtonElement | null)
  const listRef = useRef(null as HTMLDivElement | null)
  const count = sectors.length + 1

  useEffect(() => {
    if (!open) return
    const off = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("pointerdown", off)
    listRef.current?.focus({ preventScroll: true })
    return () => document.removeEventListener("pointerdown", off)
  }, [open])

  useEffect(() => {
    if (!open) return
    const el = listRef.current?.querySelector("[data-hi]") as HTMLElement | null
    el?.scrollIntoView({ block: "nearest" })
  }, [open, hi])

  const show = () => {
    setHi(pinned + 1)
    setOpen(true)
  }
  const close = (refocus: boolean) => {
    setOpen(false)
    if (refocus) btnRef.current?.focus()
  }
  const pick = (i: number) => {
    onPick(i - 1)
    close(true)
  }

  const onListKey = (e: ReactKeyboardEvent) => {
    const k = e.key
    if (k === "ArrowDown" || k === "ArrowUp") {
      e.preventDefault()
      setHi((h) => Math.max(0, Math.min(count - 1, h + (k === "ArrowDown" ? 1 : -1))))
    } else if (k === "Home" || k === "End") {
      e.preventDefault()
      setHi(k === "Home" ? 0 : count - 1)
    } else if (k === "Enter" || k === " ") {
      e.preventDefault()
      pick(hi)
    } else if (k === "Escape") {
      e.preventDefault()
      e.stopPropagation()
      close(true)
    } else if (k === "Tab") {
      setOpen(false)
    } else if (k.length === 1 && /\S/.test(k)) {
      // type-ahead: the next sector starting with that letter
      const c = k.toLowerCase()
      for (let n = 1; n <= sectors.length; n++) {
        const i = (((hi - 1 + n) % sectors.length) + sectors.length) % sectors.length
        if (sectors[i].toLowerCase().startsWith(c)) {
          setHi(i + 1)
          break
        }
      }
    }
  }

  return (
    <div ref={wrapRef} className="stm-pickwrap">
      <button
        ref={btnRef}
        type="button"
        className="stm-btn stm-pick"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        data-open={open ? "" : undefined}
        onClick={() => (open ? close(false) : show())}
        onKeyDown={(e) => {
          if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
            e.preventDefault()
            show()
          }
        }}
      >
        <i className="stm-pip" data-off={pinned < 0 ? "" : undefined} aria-hidden="true" />
        {pinned > -1 && <em>Follow</em>}
        <strong>{pinned < 0 ? "Follow a sector" : sectors[pinned]}</strong>
        <ChevronDown />
      </button>
      {open && (
        <div ref={listRef} id={id} className="stm-menu" role="listbox" tabIndex={-1} aria-label="Follow a sector" aria-activedescendant={id + "-" + hi} onKeyDown={onListKey}>
          <div className="stm-menu-cap" aria-hidden="true">
            <span>Sector</span>
            <span>{latestLabel}</span>
          </div>
          {[null, ...sectors].map((name, i) => {
            const v = i > 0 ? latest[i - 1] : null
            return (
              <div
                key={i}
                id={id + "-" + i}
                role="option"
                aria-selected={i === pinned + 1}
                className={"stm-opt" + (i === 0 ? " stm-opt-none" : "")}
                data-hi={i === hi ? "" : undefined}
                onPointerMove={() => i !== hi && setHi(i)}
                onClick={() => pick(i)}
              >
                <span className="stm-check">{i === pinned + 1 ? <Check /> : null}</span>
                <span className="stm-opt-name">{name ?? "No sector"}</span>
                {v != null && (
                  <span className="stm-chip">
                    {fmt(v)}
                    <i style={{ ["--c" as string]: v === 0 ? FLAT_COLOR : colors[binOf(v, thresholds)] } as CSSProperties} />
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function SectorTideMatrix({
  data: dataProp,
  sectors: sectorsProp,
  start = "2006-01",
  bands = NO_BANDS,
  scale,
  legendTicks,
  defaultPinned = null,
  onPinChange,
  formatValue = fmtPct,
  eyebrow,
  title,
  description,
  legendLabel,
  footnote,
  labels,
  emptyMessage = "No data to chart yet",
  height = "100svh",
  className,
  style,
}: SectorTideMatrixProps) {
  const uid = "stm" + useId().replace(/[^a-zA-Z0-9]/g, "")
  // keyed on the names themselves, so an inline array literal doesn't rebuild 2,000 dots on every parent render
  const nameKey = (sectorsProp ?? NO_NAMES).join("\u0001")
  const { sectors, rows: data } = useMemo(
    () => normalize(dataProp ?? NO_DATA, nameKey ? nameKey.split("\u0001") : NO_NAMES),
    [dataProp, nameKey],
  )
  const thresholds = scale?.thresholds ?? DEFAULT_THRESHOLDS
  const colors = scale?.colors ?? DEFAULT_COLORS
  const ticks = legendTicks ?? defaultTicks(thresholds)
  const fmt = formatValue
  const L = { rising: "Sectors rising", falling: "Sectors falling", flat: "Flat", ...labels }
  const startAbs = parseMonth(start)
  const months = data.length
  const empty = months === 0 || sectors.length === 0

  const [pinnedRaw, setPinned] = useState(() => (defaultPinned ? sectors.indexOf(defaultPinned) : -1))
  const pinned = pinnedRaw < sectors.length ? pinnedRaw : -1
  const [filter, setFilter] = useState([] as number[])
  const [active, setActive] = useState(null as Active | null)
  const [build, setBuild] = useState(0)
  const [egg, setEgg] = useState(-1)
  const [toast, setToast] = useState({ text: "", on: false })
  const [say, setSay] = useState("")
  const [still, setStill] = useState(false)

  const stageRef = useRef(null as HTMLDivElement | null)
  const frameRef = useRef(null as HTMLDivElement | null)
  const tipRef = useRef(null as HTMLDivElement | null)
  const st = useRef({
    active: null as Active | null,
    pinned: -1,
    downOn: "",
    touch: false,
    focus: false,
    byKeys: false,
    keyed: false,
    eggTimer: 0,
    toastTimer: 0,
    eggs: 0,
  })
  st.current.active = active
  st.current.pinned = pinned
  const pinChanged = useRef(onPinChange)
  pinChanged.current = onPinChange

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => setStill(rm.matches)
    sync()
    rm.addEventListener("change", sync)
    const timers = st.current
    return () => {
      rm.removeEventListener("change", sync)
      clearTimeout(timers.eggTimer)
      clearTimeout(timers.toastTimer)
    }
  }, [])

  const bandCols = useMemo(
    () =>
      bands
        .map((b) => ({ ...b, m0: Math.max(0, parseMonth(b.from) - startAbs), m1: Math.min(months - 1, parseMonth(b.to) - startAbs) }))
        .filter((b) => b.m1 >= b.m0),
    [bands, startAbs, months],
  )

  // the values on screen: the real series, or (briefly) an imagined band
  const shown = useMemo(() => {
    const b = bandCols[egg]
    if (!b) return data
    return data.map((row, m) => (m < b.m0 || m > b.m1 ? row : row.map((v, s) => (v == null ? null : imagined(v, m, s)))))
  }, [data, egg, bandCols])

  const realStacks = useMemo(() => data.map((row) => stackMonth(row)), [data])
  const stacks = useMemo(() => (shown === data ? realStacks : shown.map((row) => stackMonth(row))), [shown, data, realStacks])

  // sized from the real series, with room for an imagined band (every sector rising) so the axes never jump
  const g = useMemo(() => {
    const e = extent(realStacks)
    let up = e.up
    for (const b of bandCols) if (b.imagine) for (let m = b.m0; m <= b.m1; m++) up = Math.max(up, data[m].filter((v) => v != null).length)
    return geometry(months, up, e.down, e.flat)
  }, [realStacks, bandCols, data, months])

  const grid = useMemo(() => {
    const out: (Cell | null)[][] = shown.map((row) => row.map(() => null))
    stacks.forEach((stk, m) => {
      const put = (list: number[], side: number) =>
        list.forEach((s, i) => {
          const v = shown[m][s] as number
          out[m][s] = { m, s, v, side, k: i + 1, bin: side === 0 ? -1 : binOf(v, thresholds), ...dotAt(g, m, side, i + 1) }
        })
      put(stk.up, 1)
      put(stk.down, -1)
      put(stk.flat, 0)
    })
    return out
  }, [shown, stacks, g, thresholds])

  const summary = useMemo(() => summarize(realStacks, startAbs), [realStacks, startAbs])
  const followed = useMemo(() => (pinned > -1 ? sectorStats(data, pinned) : null), [data, pinned])

  const announce = useCallback((text: string) => setSay(text), [])
  const flash = useCallback((text: string, ms = 2600) => {
    clearTimeout(st.current.toastTimer)
    setToast({ text, on: true })
    st.current.toastTimer = window.setTimeout(() => setToast((t) => ({ ...t, on: false })), ms)
  }, [])

  const pin = useCallback(
    (s: number) => {
      const next = st.current.pinned === s ? -1 : s
      setPinned(next)
      st.current.pinned = next
      pinChanged.current?.(next < 0 ? null : sectors[next])
      announce(next < 0 ? "Stopped following " + sectors[s] + "." : "Following " + sectors[next] + " in every month.")
    },
    [sectors, announce],
  )

  const choose = useCallback(
    (s: number) => {
      if (s === st.current.pinned) return
      if (s < 0) pin(st.current.pinned)
      else pin(s)
    },
    [pin],
  )

  const toggleBin = useCallback(
    (b: number) => {
      setFilter((f) => {
        const next = f.includes(b) ? f.filter((x) => x !== b) : [...f, b].sort((x, y) => x - y)
        announce(next.length ? "Showing " + next.length + " of " + colors.length + " ranges." : "Showing every range.")
        return next
      })
    },
    [colors.length, announce],
  )

  const reset = useCallback(() => {
    setFilter([])
    setPinned(-1)
    pinChanged.current?.(null)
    announce("Cleared the filter and the followed sector.")
  }, [announce])

  const replay = useCallback(() => {
    setBuild((n) => n + 1)
    announce("Replaying the build.")
  }, [announce])

  const playEgg = useCallback(
    (bi: number) => {
      const s = st.current
      clearTimeout(s.eggTimer)
      if (egg === bi) {
        setEgg(-1)
        flash("Back to the record.")
        return
      }
      s.eggs++
      const name = bandCols[bi].label.toLowerCase()
      setEgg(bi)
      const line = s.eggs > 2 ? "Still wishing? The " + name + " happened " + s.eggs + " times now." : "Imagine there was no " + name + "…"
      flash(line, 3000)
      announce("The " + name + " months redrawn as if every sector grew.")
      s.eggTimer = window.setTimeout(() => {
        setEgg(-1)
        flash("…but the data remembers.", 2400)
      }, 4200)
    },
    [egg, bandCols, flash, announce],
  )

  const describe = (m: number, s: number) => {
    const stk = stacks[m]
    const head = monthName(startAbs + m) + ": " + stk.up.length + " rising, " + stk.down.length + " falling, " + stk.flat.length + " flat."
    if (s < 0 || shown[m][s] == null) return head
    return sectors[s] + ", " + fmt(shown[m][s] as number) + " in " + monthName(startAbs + m) + ". " + rankText(stk, s) + ". " + head
  }

  // ---- pointer over the chart: every dot and column carries its month and sector, so hovering reads no layout ----
  const readTarget = (t: EventTarget | null): Active | null => {
    const el = t as Element | null
    if (!el || !el.getAttribute) return null
    const m = el.getAttribute("data-m")
    if (m == null) return null
    const s = el.getAttribute("data-s")
    return { m: Number(m), s: s == null ? -1 : Number(s) }
  }

  const onPlotMove = useCallback((e: ReactPointerEvent) => {
    const hit = readTarget(e.target)
    if (!hit) return
    st.current.byKeys = false
    const a = st.current.active
    if (a && a.m === hit.m && a.s === hit.s) return
    setActive(hit)
  }, [])

  const onPlotLeave = useCallback((e: ReactPointerEvent) => {
    // a touch pointer "leaves" the moment the finger lifts: keep what the tap opened
    if (e.pointerType !== "mouse") return
    // a keyboard reader keeps their place while the pointer wanders off; a mouse reader does not
    if (!(st.current.focus && st.current.byKeys)) setActive(null)
  }, [])

  const onPlotDown = useCallback((e: ReactPointerEvent) => {
    const s = st.current
    s.touch = e.pointerType !== "mouse"
    const hit = readTarget(e.target)
    const a = s.active
    s.downOn = hit && a && a.m === hit.m && a.s === hit.s ? "same" : ""
    if (hit && s.touch) setActive(hit)
  }, [])

  const onPlotClick = useCallback(
    (e: ReactMouseEvent) => {
      const hit = readTarget(e.target)
      if (!hit || hit.s < 0) return
      // on touch the first tap reads the dot, a second tap on the same dot follows it
      if (st.current.touch && st.current.downOn !== "same") return
      pin(hit.s)
    },
    [pin],
  )

  const onKey = useCallback(
    (e: ReactKeyboardEvent) => {
      if (e.target !== e.currentTarget) return
      const k = e.key
      const a = st.current.active
      if (k === "Escape") {
        if (filter.length || pinned > -1) reset()
        setActive(null)
        return
      }
      if (k === "Enter" || k === " ") {
        if (a && a.s > -1) {
          e.preventDefault()
          pin(a.s)
        }
        return
      }
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(k)) return
      e.preventDefault()
      const from = a ?? { m: months - 1, s: pinned > -1 ? pinned : columnOrder(stacks[months - 1])[0] ?? -1 }
      const next = a ? step(stacks, from.m, from.s, k, e.shiftKey) : from
      st.current.keyed = true
      st.current.byKeys = true
      setActive(next)
      announce(describe(next.m, next.s))
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filter.length, pinned, months, stacks, pin, reset, announce, shown],
  )

  const onPlotFocus = useCallback(() => {
    st.current.focus = true
  }, [])
  const onPlotBlur = useCallback(() => {
    st.current.focus = false
    setActive(null)
  }, [])

  // a press anywhere outside the chart puts the tooltip away (touch has no hover to end)
  const plotRef = useRef(null as HTMLDivElement | null)
  const open = active != null
  useEffect(() => {
    if (!open) return
    const off = (e: PointerEvent) => {
      if (plotRef.current && !plotRef.current.contains(e.target as Node)) setActive(null)
    }
    document.addEventListener("pointerdown", off)
    return () => document.removeEventListener("pointerdown", off)
  }, [open])

  // ---- a narrow stage scrolls sideways: fade the edge while there is more to the right ----
  const syncMore = useCallback(() => {
    const f = frameRef.current
    const s = stageRef.current
    if (!f || !s) return
    // measured from the plot, not the scroll box, so a tooltip that briefly overhangs changes nothing
    const full = plotRef.current ? plotRef.current.offsetWidth + FRAME_PAD * 2 : f.scrollWidth
    if (full - f.clientWidth - f.scrollLeft > 6) s.setAttribute("data-more", "")
    else s.removeAttribute("data-more")
    if (f.scrollLeft > 6) s.setAttribute("data-less", "")
    else s.removeAttribute("data-less")
  }, [])

  useEffect(() => {
    const f = frameRef.current
    if (!f) return
    syncMore()
    if (typeof ResizeObserver === "undefined") return
    const ro = new ResizeObserver(syncMore)
    ro.observe(f)
    return () => ro.disconnect()
  }, [syncMore, months, empty])

  // ---- the tooltip is placed in chart coordinates; once per change it is nudged back inside the visible frame ----
  useIsoLayoutEffect(() => {
    const tip = tipRef.current
    const f = frameRef.current
    if (!tip || !f || !active) return
    const pw = plotRef.current ? plotRef.current.offsetWidth : 0
    if (st.current.keyed && pw + FRAME_PAD * 2 > f.clientWidth + 1) {
      // keyboard moves bring their column into view on a chart wide enough to scroll
      const x = ((g.left + active.m * PITCH + PITCH / 2) / g.W) * pw
      const gutter = (g.left / g.W) * pw
      if (x - gutter - 24 < f.scrollLeft) f.scrollLeft = Math.max(0, x - gutter - 24)
      else if (x + 40 > f.scrollLeft + f.clientWidth) f.scrollLeft = Math.min(pw + FRAME_PAD * 2 - f.clientWidth, x + 40 + FRAME_PAD * 2 - f.clientWidth)
    }
    st.current.keyed = false
    tip.style.setProperty("--stm-nx", "0px")
    const t = tip.getBoundingClientRect()
    const b = f.getBoundingClientRect()
    const nx = t.left < b.left + 6 ? b.left + 6 - t.left : t.right > b.right - 6 ? b.right - 6 - t.right : 0
    if (nx) tip.style.setProperty("--stm-nx", nx.toFixed(1) + "px")
  }, [active, pinned, egg, g])

  // ---- the dots: memoised so hovering never re-renders 2,000 rects ----
  const filterKey = filter.join(",")
  const dots = useMemo(() => {
    const out: ReactElement[] = []
    const on = filterKey ? filterKey.split(",").map(Number) : []
    for (let m = 0; m < grid.length; m++) {
      for (const c of grid[m]) {
        if (!c) continue
        const dim = on.length > 0 && c.s !== pinned && !on.includes(c.bin)
        const cls = "stm-dot" + (c.side === 0 ? " stm-flat" : "") + (dim ? " is-dim" : "")
        const vars = {
          translate: c.x + "px " + c.y + "px",
          fill: c.side === 0 ? undefined : colors[c.bin],
          "--o": c.side === 0 ? "6px" : (g.y0 - c.y - DOT / 2).toFixed(1) + "px",
          "--d": Math.round(m * 7 + (c.side === 0 ? 420 : c.k * 18)) + "ms",
          "--k": c.k,
        } as CSSProperties
        out.push(<rect key={m + "-" + c.s} className={cls} width={DOT} height={DOT} rx={2.5} data-m={m} data-s={c.s} style={vars} />)
      }
    }
    return out
  }, [grid, pinned, filterKey, colors, g.y0])

  const trail = useMemo(() => {
    if (pinned < 0) return { d: "", pts: [] as Cell[] }
    let d = ""
    let pen = false
    const pts: Cell[] = []
    for (let m = 0; m < grid.length; m++) {
      const c = grid[m][pinned]
      if (!c) {
        pen = false
        continue
      }
      pts.push(c)
      if (c.side === 0) {
        pen = false
        continue
      }
      d += (pen ? "L" : "M") + (c.x + DOT / 2).toFixed(1) + " " + (c.y + DOT / 2).toFixed(1)
      pen = true
    }
    return { d, pts }
  }, [grid, pinned])

  const years = useMemo(() => {
    const out: { m: number; text: string }[] = []
    for (let m = 0; m < months; m++) if ((startAbs + m) % 12 === 0) out.push({ m, text: String((startAbs + m) / 12) })
    // a series that starts mid-year still names the year it opens in
    if (months && (!out.length || out[0].m > 5)) out.unshift({ m: 0, text: String(Math.floor(startAbs / 12)) })
    return out
  }, [months, startAbs])

  const yTicks = useMemo(() => {
    const out: number[] = []
    for (let v = -g.down; v <= g.up; v += 5) out.push(v)
    return out
  }, [g.down, g.up])
  const tickY = (v: number) => (v > 0 ? g.y0 - v * PITCH + PITCH / 2 : v < 0 ? g.y0 - v * PITCH - PITCH / 2 : g.y0)

  const header = (eyebrow || title || description) && (
    <div className="stm-copy">
      {eyebrow && (
        <p className="stm-eyebrow">
          <i />
          {eyebrow}
        </p>
      )}
      {title && <h2 className="stm-title">{title}</h2>}
      {description && <p className="stm-desc">{description}</p>}
    </div>
  )

  if (empty) {
    return (
      <div className={"stm-root" + (className ? " " + className : "")} style={{ height, ...style }}>
        <style>{CSS}</style>
        <div className="stm-wrap">
          {header && <header className="stm-head">{header}</header>}
          <div className="stm-empty" role="status">
            <strong>{emptyMessage}</strong>
            <span>Pass one row per month and one value per sector.</span>
          </div>
          {footnote && (
            <footer className="stm-foot">
              <span>{footnote}</span>
            </footer>
          )}
        </div>
      </div>
    )
  }

  const a = active && active.m < months ? active : null
  const cell = a && a.s > -1 && a.s < sectors.length ? grid[a.m][a.s] : null
  const colX = a ? g.left + a.m * PITCH + PITCH / 2 : 0
  const pct = (v: number, of: number) => ((v / of) * 100).toFixed(3) + "%"
  const ratio = g.W / g.H
  const building = !still

  let tip: ReactElement | null = null
  if (a) {
    const stk = stacks[a.m]
    const ax = cell ? cell.x + DOT / 2 : colX
    const ay = cell ? cell.y : g.y0
    const below = ay / g.H < 0.42
    const ty = below ? (cell ? cell.y + DOT : g.y0) : ay
    const t = "translate(calc(-50% + var(--stm-nx, 0px))," + (below ? "12px" : "calc(-100% - 10px)") + ")"
    const inEgg = egg > -1 && a.m >= bandCols[egg].m0 && a.m <= bandCols[egg].m1
    tip = (
      <div ref={tipRef} className="stm-tip" role="presentation" style={{ left: pct(ax, g.W), top: pct(ty, g.H), transform: t }}>
        {cell ? (
          <>
            <b>{sectors[cell.s]}</b>
            <span>
              <i style={{ ["--c" as string]: cell.side === 0 ? FLAT_COLOR : colors[cell.bin] } as CSSProperties} />
              {fmt(cell.v)} in {monthName(startAbs + a.m)}
              {inEgg ? " (imagined)" : ""}
            </span>
            <small>{rankText(stk, cell.s)}</small>
            <em>{pinned === cell.s ? (st.current.touch ? "Following · tap again to stop" : "Following · click to stop") : st.current.touch ? "Tap again to follow" : "Click to follow"}</em>
          </>
        ) : (
          <>
            <b>{monthName(startAbs + a.m)}</b>
            <span>
              {stk.up.length} rising · {stk.down.length} falling
            </span>
            <small>{stk.flat.length ? stk.flat.length + " unchanged" : "None unchanged"}</small>
          </>
        )}
      </div>
    )
  }

  // the chart never shrinks below a legible dot, and never balloons past a sensible one
  const plotVars = { "--stm-mn": Math.round(g.W * 0.72) + "px", "--stm-mx": Math.round(g.W * 1.6) + "px", "--stm-r": ratio.toFixed(4) } as CSSProperties
  const stageMin = HEAD + Math.ceil(((g.W * 0.72) / ratio) * SQUASH) + 16
  const titled = Math.min(g.up, g.down) >= 15

  return (
    <div className={"stm-root" + (className ? " " + className : "")} style={{ height, ...style }} data-toast={toast.on ? "" : undefined}>
      <style>{CSS}</style>
      <div className="stm-wrap">
        <header className="stm-head">
          {header}
          <fieldset className="stm-legend" data-f={filter.length ? "" : undefined}>
            <legend className="stm-sr">Filter by range</legend>
            {legendLabel && (
              <span className="stm-legend-cap" aria-hidden="true">
                {legendLabel}
              </span>
            )}
            <div className="stm-scale">
              <div className="stm-ramp">
                <div className="stm-sws">
                  {colors.map((c, b) => {
                    const lo = b === 0 ? null : thresholds[b - 1]
                    const hi = b === colors.length - 1 ? null : thresholds[b]
                    const range = lo == null ? fmt(hi as number) + " or less" : hi == null ? fmt(lo) + " or more" : fmt(lo) + " to " + fmt(hi)
                    const on = filter.includes(b)
                    return (
                      <button key={b} type="button" className="stm-sw" style={{ ["--c" as string]: c } as CSSProperties} aria-pressed={on} aria-label={"Show only " + range} title={range} onClick={() => toggleBin(b)}>
                        <i />
                      </button>
                    )
                  })}
                </div>
                <div className="stm-ticks" aria-hidden="true">
                  {ticks.map((v) => {
                    const i = thresholds.indexOf(v)
                    if (i < 0) return null
                    return (
                      <span key={v} style={{ left: pct(i + 1, colors.length) }}>
                        {tickLabel(v)}
                      </span>
                    )
                  })}
                </div>
              </div>
              <span className="stm-none">
                <i />
                {L.flat}
              </span>
            </div>
          </fieldset>
        </header>

        <div className="stm-bar">
          <SectorPicker sectors={sectors} pinned={pinned} latest={shown[months - 1] ?? []} latestLabel={monthName(startAbs + months - 1, true)} colors={colors} thresholds={thresholds} fmt={fmt} onPick={choose} />
          <p className="stm-read" aria-hidden="true">
            {a ? (
              <>
                <strong>{monthName(startAbs + a.m)}</strong>
                <span>{stacks[a.m].up.length} rising</span>
                <span>{stacks[a.m].down.length} falling</span>
                <span>{stacks[a.m].flat.length} flat</span>
              </>
            ) : followed ? (
              <>
                <strong>{sectors[pinned]}</strong>
                <span>
                  rose in {followed.up} of {months} months
                </span>
                <span>fell in {followed.down}</span>
              </>
            ) : summary ? (
              <>
                <span>Toughest month</span>
                <strong>{summary.worst.label}</strong>
                <span>
                  {summary.worst.falling} of {sectors.length} falling
                </span>
              </>
            ) : null}
          </p>
          <div className="stm-acts">
            <button type="button" className="stm-btn" onClick={reset} disabled={!filter.length && pinned < 0}>
              Reset
            </button>
            <button type="button" className="stm-btn" onClick={replay}>
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M2.2 7a4.8 4.8 0 1 0 1.5-3.5" />
                <path d="M2 1.6v2.6h2.6" />
              </svg>
              Replay
            </button>
          </div>
        </div>

        <div ref={stageRef} className="stm-stage" style={{ minHeight: stageMin }}>
          <div ref={frameRef} className="stm-frame" onScroll={syncMore}>
            <div
              ref={plotRef}
              className="stm-plot"
              tabIndex={0}
              role="application"
              aria-roledescription="dot matrix chart"
              aria-label={(title ? title + ". " : "") + "Arrow keys move between months and sectors, Enter follows a sector, Escape clears."}
              aria-describedby={uid + "-sum"}
              style={plotVars}
              onKeyDown={onKey}
              onFocus={onPlotFocus}
              onBlur={onPlotBlur}
            >
              {bandCols.map((b, i) => (
                <div
                  key={i}
                  className="stm-band"
                  data-on={egg === i ? "" : undefined}
                  style={{ left: pct(g.left + b.m0 * PITCH, g.W), width: pct((b.m1 - b.m0 + 1) * PITCH, g.W), bottom: "calc((100% - " + HEAD + "px) * " + ((g.H - g.plotBottom - 5) / g.H).toFixed(4) + ")" }}
                />
              ))}

              <div className="stm-top">
                <div className="stm-yrs" aria-hidden="true" data-dim={a ? "" : undefined}>
                  {years.map((y) => (
                    <span key={y.m} className="stm-yr" data-off={a && Math.abs(y.m - a.m) < 6 ? "" : undefined} style={{ left: pct(g.left + y.m * PITCH + PITCH / 2, g.W) }}>
                      {y.text}
                    </span>
                  ))}
                  {a && (
                    <span className="stm-pill" style={{ left: "clamp(34px, " + pct(colX, g.W) + ", calc(100% - 34px))" }}>
                      {monthName(startAbs + a.m, true)}
                    </span>
                  )}
                </div>
                {bandCols.map((b, i) => {
                  const half = Math.round(b.label.length * 4.4 + 10)
                  const pos = { left: "clamp(" + half + "px, " + pct(g.left + ((b.m0 + b.m1 + 1) / 2) * PITCH, g.W) + ", calc(100% - " + half + "px))" }
                  return b.imagine ? (
                    <button key={i} type="button" className="stm-tag" data-egg="" data-on={egg === i ? "" : undefined} style={pos} aria-label={egg === i ? "Show the real " + b.label.toLowerCase() + " again" : b.label + ": imagine it never happened"} onClick={() => playEgg(i)}>
                      {egg === i ? "If only" : b.label}
                    </button>
                  ) : (
                    <span key={i} className="stm-tag" style={pos}>
                      {b.label}
                    </span>
                  )
                })}
              </div>

              <div className="stm-body">
                <div className="stm-y" aria-hidden="true" style={{ width: pct(g.left - 4, g.W) }}>
                  {yTicks.map((v) => (
                    <span key={v} style={{ top: pct(tickY(v), g.H) }}>
                      {v === 0 ? "0" : v > 0 ? v : "−" + -v}
                    </span>
                  ))}
                  <span style={{ top: pct(g.flatTop + PITCH / 2, g.H) }}>{L.flat}</span>
                  {titled && <b style={{ top: pct(g.y0 - (g.up * PITCH) / 2, g.H) }}>{L.rising}</b>}
                  {titled && <b style={{ top: pct(g.y0 + (g.down * PITCH) / 2, g.H) }}>{L.falling}</b>}
                </div>

                <svg className="stm-svg" viewBox={"0 0 " + g.W + " " + g.H} preserveAspectRatio="none" aria-hidden="true" onPointerMove={onPlotMove} onPointerLeave={onPlotLeave} onPointerDown={onPlotDown} onClick={onPlotClick}>
                  {a && <rect className="stm-hair" x={colX - PITCH / 2} y={0} width={PITCH} height={g.H} rx={3} />}
                  <line className="stm-base" x1={g.left} x2={g.W - g.right} y1={g.y0} y2={g.y0} />

                  {Array.from({ length: months }, (_, m) => (
                    <rect key={m} className="stm-hit" data-m={m} x={g.left + m * PITCH} y={0} width={PITCH} height={g.H} />
                  ))}

                  <g key={build} className={"stm-dots" + (building ? " stm-build" : "")} data-follow={pinned > -1 ? "" : undefined} data-filter={filter.length ? "" : undefined}>
                    {dots}
                  </g>

                  {trail.pts.length > 0 && (
                    <g key={"p" + pinned + "-" + build} className="stm-pins" style={{ ["--d" as string]: build === 0 && building ? "1200ms" : "0ms" } as CSSProperties}>
                      {trail.d && <path className={"stm-trail" + (building ? " stm-draw" : "")} data-off={egg > -1 ? "" : undefined} d={trail.d} pathLength={1} style={{ ["--d" as string]: build === 0 && building ? "1200ms" : "0ms" } as CSSProperties} />}
                      {trail.pts.map((c) => (
                        <rect
                          key={c.m}
                          className="stm-pin"
                          width={DOT + 1.6}
                          height={DOT + 1.6}
                          rx={3.2}
                          data-m={c.m}
                          data-s={c.s}
                          style={{ translate: c.x - 0.8 + "px " + (c.y - 0.8) + "px", fill: c.side === 0 ? FLAT_COLOR : colors[c.bin], ["--k" as string]: c.k } as CSSProperties}
                        />
                      ))}
                    </g>
                  )}

                  {cell && <rect className="stm-ring" x={cell.x - 1.8} y={cell.y - 1.8} width={DOT + 3.6} height={DOT + 3.6} rx={3.8} />}
                </svg>
                {tip}
              </div>
            </div>
          </div>
        </div>

        <footer className="stm-foot">
          {footnote && <span>{footnote}</span>}
          <span className="stm-keys" aria-hidden="true">
            <kbd>←</kbd>
            <kbd>→</kbd> months · <kbd>↑</kbd>
            <kbd>↓</kbd> sectors · <kbd>↵</kbd> follow · <kbd>esc</kbd> clear
          </span>
        </footer>
      </div>

      <p id={uid + "-sum"} className="stm-sr">
        {months} months of {sectors.length} sectors.
        {summary ? " The most fell in " + summary.worst.label + ": " + summary.worst.falling + " of " + sectors.length + ". The most rose in " + summary.best.label + ": " + summary.best.rising + "." : ""}
      </p>
      <p className="stm-sr" aria-live="polite">
        {say}
      </p>
      <div className="stm-toast" data-on={toast.on ? "" : undefined} role="status">
        {toast.text}
      </div>
    </div>
  )
}
