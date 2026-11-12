"use client"

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactElement,
  type PointerEvent as ReactPointerEvent,
} from "react"

// #region data
// A seeded, synthetic payroll series: ~20 sectors over 110 months with a
// slide into recession, a trough, a slow recovery and autocorrelated noise.
// Pure: no React, no DOM. The test lifts this region and runs it.

export function mulberry32(seed: number) {
  let a = seed >>> 0
  return function () {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** [name, base drift %, cycle sensitivity, noise, chance of an exactly flat month] */
export const SECTOR_PROFILES: [string, number, number, number, number][] = [
  ["Construction", -0.02, 1.5, 0.34, 0.01],
  ["Durable goods", -0.08, 1.35, 0.28, 0.01],
  ["Nondurable goods", -0.12, 0.7, 0.2, 0.03],
  ["Wholesale trade", 0.04, 0.8, 0.18, 0.03],
  ["Retail trade", 0.04, 0.8, 0.2, 0.02],
  ["Transportation & warehousing", 0.08, 0.9, 0.3, 0.02],
  ["Utilities", 0.0, 0.15, 0.3, 0.07],
  ["Information", -0.06, 0.6, 0.3, 0.03],
  ["Finance & insurance", 0.02, 0.6, 0.18, 0.03],
  ["Real estate & leasing", 0.02, 0.8, 0.28, 0.03],
  ["Professional & technical", 0.18, 0.7, 0.18, 0.01],
  ["Admin & support", 0.12, 1.5, 0.45, 0.01],
  ["Education services", 0.22, 0.05, 0.3, 0.03],
  ["Health care", 0.24, 0.08, 0.1, 0.01],
  ["Social assistance", 0.3, 0.1, 0.35, 0.02],
  ["Arts & recreation", 0.12, 0.5, 0.45, 0.03],
  ["Accommodation", 0.06, 0.6, 0.4, 0.03],
  ["Food services", 0.18, 0.55, 0.18, 0.01],
  ["Mining & logging", 0.25, 0.9, 0.7, 0.02],
  ["Government", 0.03, 0.15, 0.1, 0.05],
]

export const DEFAULT_SECTORS = SECTOR_PROFILES.map((p) => p[0])

/** The business cycle, months since the first month: [month, strength]. Interpolated linearly. */
const CYCLE: [number, number][] = [
  [0, 0.7], [18, 0.55], [23, 0.2], [30, -0.55], [36, -1.45], [39, -1.75], [42, -1.3],
  [48, -0.35], [54, 0.35], [62, 0.25], [74, 0.5], [92, 0.55], [109, 0.8],
]

export function cycleAt(t: number) {
  if (t <= CYCLE[0][0]) return CYCLE[0][1]
  for (let i = 1; i < CYCLE.length; i++) {
    const [t1, v1] = CYCLE[i]
    if (t <= t1) {
      const [t0, v0] = CYCLE[i - 1]
      return v0 + ((v1 - v0) * (t - t0)) / (t1 - t0)
    }
  }
  return CYCLE[CYCLE.length - 1][1]
}

/** months x sectors, % change from the previous month, rounded to 0.01. 0 means unchanged. */
export function generateSeries(months = 110, seed = 2006): number[][] {
  const r = mulberry32(seed)
  const eps = SECTOR_PROFILES.map(() => 0)
  const out: number[][] = []
  for (let m = 0; m < months; m++) {
    const c = cycleAt(m)
    const row: number[] = []
    SECTOR_PROFILES.forEach((p, s) => {
      const shock = (r() + r() + r() - 1.5) * p[3]
      eps[s] = eps[s] * 0.45 + shock
      let v = p[1] - 0.07 + p[2] * c * 0.55 + eps[s] * 1.2
      v = Math.round(v * 100) / 100
      if (r() < p[4] * 0.6 || Math.abs(v) < 0.01) v = 0
      row.push(v === 0 ? 0 : v)
    })
    out.push(row)
  }
  return out
}
// #endregion

// #region layout
// Scales, stacking and keyboard movement. Pure.

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
  yMax: number
  plotBottom: number
  flatTop: number
}

export const DEFAULT_THRESHOLDS = [-1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75]

/** Which colour bin a value falls in: "-1% and below" is the first, "+0.75% and above" the last. */
export function binOf(v: number, thresholds: number[]) {
  let b = 0
  for (const t of thresholds) if (v < 0 ? t < v : t <= v) b++
  return b
}

/** Sector indices for one month: risers from the baseline up, fallers from the baseline down. */
export function stackMonth(row: (number | null)[]): Stack {
  const up: number[] = []
  const down: number[] = []
  const flat: number[] = []
  row.forEach((v, s) => {
    if (v == null || Number.isNaN(v)) return
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

export function geometry(months: number, sectors: number): Geometry {
  const left = 70
  const right = 14
  const top = 52
  const yMax = Math.max(5, Math.ceil(sectors / 5) * 5)
  const y0 = top + yMax * PITCH
  const plotBottom = y0 + yMax * PITCH
  const flatTop = plotBottom + 16
  return { W: left + months * PITCH + right, H: flatTop + 3 * PITCH + 8, left, right, top, y0, yMax, plotBottom, flatTop }
}

/** Top-left of the k-th dot (1-based) on a side: 1 rising, -1 falling, 0 flat. */
export function dotAt(g: Geometry, m: number, side: number, k: number) {
  const pad = (PITCH - DOT) / 2
  const x = g.left + m * PITCH + pad
  const y =
    side > 0 ? g.y0 - k * PITCH + pad : side < 0 ? g.y0 + (k - 1) * PITCH + pad : g.flatTop + (3 - k) * PITCH + pad
  return { x, y }
}

/** "2006-01" → months since year 0. */
export function parseMonth(s: string) {
  const m = /^(\d{4})-(\d{1,2})$/.exec(s.trim())
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

/** The "what if it never happened" values the Easter egg swaps in. Deterministic. */
export function imagined(v: number, m: number, s: number) {
  const wobble = ((m * 7 + s * 13) % 10) / 100
  return Math.round((Math.abs(v) * 0.3 + 0.06 + wobble) * 100) / 100
}

export function summarize(stacks: Stack[], start: number) {
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
// #endregion

export type TideBand = { from: string; to: string; label: string }
export type TideScale = { thresholds: number[]; colors: string[] }
export type TideLabels = { rising?: string; falling?: string; flat?: string }

export type SectorTideMatrixProps = {
  /** months x sectors, % change from the previous month. null = missing. */
  data?: (number | null)[][]
  sectors?: string[]
  /** First month of `data`, "YYYY-MM". */
  start?: string
  bands?: TideBand[]
  /** `thresholds.length + 1` colours, from the steepest loss to the strongest gain. */
  scale?: TideScale
  /** Boundary values printed under the legend. */
  legendTicks?: number[]
  defaultPinned?: string | null
  onPinChange?: (sector: string | null) => void
  eyebrow?: string
  title?: string
  description?: string
  legendLabel?: string
  footnote?: string
  labels?: TideLabels
  height?: string | number
  className?: string
  style?: CSSProperties
}

const DEFAULT_COLORS = [
  "#c23b2a",
  "#e65f3b",
  "#f2994a",
  "#f5c84c",
  "color-mix(in oklab, #d8ae55 42%, var(--color-background))",
  "color-mix(in oklab, #62b866 40%, var(--color-background))",
  "color-mix(in oklab, #4fae5c 70%, var(--color-background))",
  "#45a35a",
  "#2d8fd0",
]

const DEFAULT_BANDS: TideBand[] = [{ from: "2007-12", to: "2009-06", label: "Recession" }]

const CSS =
  ".stm-root{position:relative;display:flex;flex-direction:column;width:100%;overflow:hidden;background:var(--color-background);color:var(--color-foreground);font-variant-numeric:tabular-nums;-webkit-font-smoothing:antialiased;--stm-ink:color-mix(in oklab,var(--color-foreground) 6%,transparent)}" +
  ".stm-wrap{display:flex;flex-direction:column;flex:1 1 auto;min-height:0;overflow-y:auto;scrollbar-width:none;width:100%;max-width:1320px;margin:0 auto;padding:clamp(20px,4.5vh,48px) clamp(16px,3.2vw,44px) clamp(12px,2.4vh,22px)}" +
  ".stm-head{display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:18px 56px}" +
  ".stm-copy{max-width:620px}" +
  ".stm-eyebrow{display:flex;align-items:center;gap:10px;margin:0;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--color-muted-foreground)}" +
  ".stm-eyebrow i{display:block;width:18px;height:1px;background:currentColor}" +
  ".stm-title{margin:10px 0 8px;font-size:clamp(23px,2.5vw,32px);font-weight:600;line-height:1.08;letter-spacing:-.025em;text-wrap:balance}" +
  ".stm-desc{margin:0;font-size:14px;line-height:1.55;color:var(--color-muted-foreground);text-wrap:pretty}" +
  ".stm-legend{display:flex;flex-direction:column;gap:6px;margin:0;padding:0;border:0}" +
  ".stm-legend-cap{font-size:11px;letter-spacing:.04em;color:var(--color-muted-foreground)}" +
  ".stm-sws{display:flex;gap:2px}" +
  ".stm-sw{position:relative;width:30px;height:16px;padding:0;border:0;border-radius:2px;background:var(--c);transition:transform .35s cubic-bezier(.3,1.6,.5,1),opacity .25s,box-shadow .25s}" +
  ".stm-sw:first-child{border-radius:4px 2px 2px 4px}.stm-sw:last-child{border-radius:2px 4px 4px 2px}" +
  ".stm-sw:hover{transform:translateY(-2px)}" +
  ".stm-sw:focus-visible{outline:2px solid var(--color-foreground);outline-offset:2px}" +
  ".stm-legend[data-f] .stm-sw[aria-pressed=false]{opacity:.26}" +
  ".stm-sw[aria-pressed=true]{transform:translateY(-3px);box-shadow:0 0 0 2px var(--color-background),0 0 0 3px var(--color-foreground)}" +
  ".stm-ticks{position:relative;height:13px;font-size:11px;color:var(--color-muted-foreground)}" +
  ".stm-ticks span{position:absolute;top:0;transform:translateX(-50%);white-space:nowrap}" +
  ".stm-ticks span:before{content:'';position:absolute;left:50%;top:-5px;width:1px;height:4px;background:currentColor;opacity:.6}" +
  ".stm-btn{position:relative;display:inline-flex;align-items:center;height:36px;padding:0 15px;border:1px solid var(--color-border);border-radius:999px;background:var(--color-background);color:var(--color-foreground);font:inherit;font-size:13px;line-height:1;white-space:nowrap;transition:border-color .2s,background-color .2s,color .2s,opacity .2s,transform .12s ease-out}" +
  ".stm-btn>span{display:inline-flex;align-items:center;gap:8px}" +
  ".stm-btn:hover{border-color:color-mix(in oklab,var(--color-foreground) 32%,transparent);background:color-mix(in oklab,var(--color-foreground) 4%,var(--color-background))}" +
  ".stm-btn:active:not(:disabled){transform:scale(.97)}" +
  ".stm-btn[data-solid]:hover{background:color-mix(in oklab,var(--color-foreground) 86%,var(--color-background))}" +
  ".stm-btn:focus-visible,.stm-btn:focus-within{outline:2px solid var(--color-foreground);outline-offset:2px}" +
  ".stm-btn:disabled{opacity:.38}" +
  ".stm-btn[data-solid]{border-color:transparent;background:var(--color-foreground);color:var(--color-background)}" +
  ".stm-btn svg{flex:none}" +
  ".stm-pip{display:block;width:8px;height:8px;border-radius:2.5px;background:var(--color-foreground)}" +
  ".stm-pip[data-off]{background:none;box-shadow:inset 0 0 0 1.2px var(--color-muted-foreground)}" +
  ".stm-bar{position:relative;z-index:4;display:flex;flex-wrap:wrap;align-items:center;gap:10px 16px;margin-top:clamp(16px,2.8vh,26px);padding:10px 0;border-top:1px solid var(--color-border);border-bottom:1px solid var(--color-border)}" +
  ".stm-pickwrap{position:relative;flex:none}" +
  ".stm-pick{padding:0 34px 0 14px}" +
  ".stm-pick em{font-style:normal;color:var(--color-muted-foreground)}" +
  ".stm-pick strong{max-width:210px;overflow:hidden;font-weight:500;text-overflow:ellipsis}" +
  ".stm-pick>svg{position:absolute;right:13px;top:50%;margin-top:-5px;transition:transform .25s}" +
  ".stm-pick[data-open]>svg{transform:rotate(180deg)}" +
  ".stm-pick[data-open]{border-color:color-mix(in oklab,var(--color-foreground) 32%,transparent)}" +
  ".stm-menu{position:absolute;left:0;top:calc(100% + 8px);width:300px;max-width:calc(100vw - 32px);max-height:min(360px,56svh);overflow-y:auto;overscroll-behavior:contain;padding:0 6px 6px;border-radius:12px;background:var(--color-background);box-shadow:0 0 0 1px var(--color-border),0 24px 48px -20px rgba(0,0,0,.4);outline:0;scrollbar-width:thin;animation:stm-menu .2s cubic-bezier(.2,.8,.2,1);transform-origin:20px 0}" +
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
  ".stm-read{display:flex;flex:1 1 240px;align-items:center;gap:6px 0;min-width:0;margin:0;overflow:hidden;font-size:12.5px;white-space:nowrap;color:var(--color-muted-foreground)}" +
  ".stm-read strong{font-weight:600;color:var(--color-foreground)}" +
  ".stm-read>*+*:before{content:'';display:inline-block;width:3px;height:3px;margin:0 10px 2px;border-radius:50%;background:var(--color-muted-foreground);opacity:.7;vertical-align:middle}" +
  ".stm-acts{display:flex;flex:none;gap:8px;margin-left:auto}" +
  ".stm-frame{position:relative;display:flex;flex:1 1 0;min-height:220px;margin-top:clamp(14px,3vh,30px);container-type:size;overflow-x:auto;overflow-y:hidden;overscroll-behavior-x:contain;scrollbar-width:thin}" +
  ".stm-plot{position:relative;flex:none;margin:auto;outline:0;border-radius:8px;touch-action:pan-x pan-y}" +
  ".stm-plot:focus-visible{box-shadow:0 0 0 2px var(--color-background),0 0 0 4px var(--color-foreground)}" +
  ".stm-svg{position:absolute;inset:0;display:block;width:100%;height:100%;max-width:none;overflow:visible}" +
  ".stm-ax{font-size:11px;fill:var(--color-muted-foreground)}" +
  ".stm-axt{font-size:10px;letter-spacing:.14em;text-transform:uppercase;fill:var(--color-muted-foreground)}" +
  ".stm-yr{font-size:12px;font-weight:500;fill:var(--color-foreground);transition:opacity .25s}" +
  ".stm-yrs[data-dim] .stm-yr{opacity:.22}" +
  ".stm-tick{stroke:var(--color-muted-foreground);stroke-width:1;opacity:.55}" +
  ".stm-base{stroke:var(--color-foreground);stroke-width:.8;opacity:.28}" +
  ".stm-band{fill:var(--stm-ink);transition:fill .5s}" +
  ".stm-band[data-on]{fill:color-mix(in oklab,#45a35a 12%,transparent)}" +
  ".stm-hair{fill:color-mix(in oklab,var(--color-foreground) 9%,transparent)}" +
  ".stm-pill{fill:var(--color-foreground)}.stm-pilltx{font-size:11px;font-weight:600;fill:var(--color-background)}" +
  ".stm-hit{fill:transparent}" +
  ".stm-dot{transform-box:fill-box;transform-origin:50% 50%;transition:translate .9s cubic-bezier(.65,0,.25,1) calc(var(--k) * 16ms),fill .6s ease calc(var(--k) * 16ms),opacity .3s}" +
  ".stm-dot.is-dim{opacity:.12}" +
  ".stm-dot.is-pin{fill:var(--color-foreground)}" +
  ".stm-flat{fill:color-mix(in oklab,var(--color-muted-foreground) 70%,var(--color-background))}" +
  ".stm-build .stm-dot{animation:stm-rise .62s cubic-bezier(.2,.85,.3,1.18) var(--d) backwards}" +
  "@keyframes stm-rise{from{transform:translateY(var(--o)) scale(.25);opacity:0}}" +
  ".stm-trail{fill:none;stroke:var(--color-foreground);stroke-width:.9;stroke-linejoin:round;stroke-linecap:round;opacity:.24;transition:opacity .4s}" +
  ".stm-trail[data-off]{opacity:0}" +
  ".stm-draw{stroke-dasharray:1;animation:stm-draw 1.5s cubic-bezier(.45,0,.2,1) var(--d,0ms) backwards}" +
  "@keyframes stm-draw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}" +
  ".stm-pin{fill:var(--color-foreground);stroke:var(--color-background);stroke-width:1.3;paint-order:stroke;transition:translate .9s cubic-bezier(.65,0,.25,1) calc(var(--k) * 16ms)}" +
  ".stm-pins{animation:stm-fade .5s ease var(--d,0ms) backwards}" +
  "@keyframes stm-fade{from{opacity:0}}" +
  ".stm-ring{fill:none;stroke:var(--color-foreground);stroke-width:1.6;pointer-events:none}" +
  ".stm-egg{position:absolute;z-index:2;transform:translate(-50%,0);padding:4px 8px;border:0;border-radius:6px;background:none;color:var(--color-muted-foreground);font:inherit;font-size:11px;letter-spacing:.2em;text-transform:uppercase;white-space:nowrap;transition:color .3s,background-color .3s,letter-spacing .5s cubic-bezier(.3,1.4,.5,1)}" +
  ".stm-egg:hover{color:var(--color-foreground);letter-spacing:.26em}" +
  ".stm-egg:focus-visible{outline:2px solid var(--color-foreground)}" +
  ".stm-egg[data-on]{color:#2f7d43;background:color-mix(in oklab,#45a35a 16%,var(--color-background))}" +
  ".stm-tip{position:absolute;z-index:3;width:max-content;min-width:150px;max-width:260px;pointer-events:none;border-radius:8px;overflow:hidden;background:var(--color-background);box-shadow:0 0 0 1px var(--color-border),0 12px 32px -12px rgba(0,0,0,.35);font-size:12.5px;line-height:1.35;animation:stm-pop .18s ease-out}" +
  ".stm-tip b{display:block;padding:7px 11px 6px;background:var(--color-foreground);color:var(--color-background);font-weight:600}" +
  ".stm-tip span{white-space:nowrap;display:flex;align-items:center;gap:8px;padding:8px 11px 0}" +
  ".stm-tip span i{flex:none;width:9px;height:9px;border-radius:2.5px;background:var(--c)}" +
  ".stm-tip small{display:block;padding:3px 11px 9px;font-size:11.5px;color:var(--color-muted-foreground)}" +
  "@keyframes stm-pop{from{opacity:0;transform:var(--t) translateY(4px)}}" +
  ".stm-foot{display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px 24px;padding-top:clamp(10px,2vh,18px);font-size:11.5px;color:var(--color-muted-foreground)}" +
  ".stm-foot kbd{display:inline-block;min-width:18px;margin:0 2px;padding:1px 5px;border:1px solid var(--color-border);border-bottom-width:2px;border-radius:4px;font:inherit;font-size:10.5px;text-align:center;color:var(--color-foreground)}" +
  ".stm-toast{position:absolute;left:50%;bottom:clamp(16px,4vh,36px);z-index:5;padding:10px 16px;border-radius:999px;background:var(--color-foreground);color:var(--color-background);font-size:13px;white-space:nowrap;pointer-events:none;opacity:0;transform:translate(-50%,10px) scale(.96);transition:opacity .3s,transform .5s cubic-bezier(.3,1.5,.5,1)}" +
  ".stm-toast[data-on]{opacity:1;transform:translate(-50%,0)}" +
  ".stm-sr{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}" +
  ".stm-cursor{display:none;position:fixed;left:0;top:0;z-index:80;pointer-events:none;opacity:0;transition:opacity .2s}" +
  ".stm-cursor[data-on]{opacity:1}" +
  ".stm-cursor-dot{position:absolute;left:-5px;top:-5px;width:10px;height:10px;border-radius:50%;box-shadow:0 0 0 1.5px var(--color-foreground),0 0 0 3px var(--color-background);background:var(--color-foreground);transition:transform .35s cubic-bezier(.3,1.5,.5,1),background-color .2s}" +
  ".stm-cursor[data-mode=dot] .stm-cursor-dot{transform:scale(1.9);background:transparent}" +
  ".stm-cursor[data-label] .stm-cursor-dot{transform:scale(.55)}" +
  ".stm-cursor-label{position:absolute;left:14px;top:14px;padding:6px 11px;border-radius:999px;background:var(--color-foreground);color:var(--color-background);font-size:12px;letter-spacing:.01em;white-space:nowrap;opacity:0;transform:scale(.6) translateY(-4px);transform-origin:0 0;transition:opacity .18s,transform .35s cubic-bezier(.3,1.5,.5,1)}" +
  ".stm-cursor[data-label] .stm-cursor-label{opacity:1;transform:none}" +
  ".stm-cursor[data-flip] .stm-cursor-label{left:auto;right:14px;transform-origin:100% 0}" +
  "@media (hover:hover) and (pointer:fine){.stm-cursor{display:block}.stm-root,.stm-root button,.stm-root .stm-opt{cursor:none}}" +
  "@media (max-width:640px){.stm-head{gap:16px}.stm-title{margin:8px 0 6px}.stm-desc{font-size:13px}.stm-legend{width:100%}.stm-sws{width:100%}.stm-sw{flex:1;width:auto}.stm-bar{flex-wrap:nowrap;gap:8px}.stm-read{display:none}.stm-pickwrap{flex:1 1 auto;min-width:0}.stm-pick{width:100%}.stm-pick>span{min-width:0}.stm-pick em{display:none}.stm-pick strong{max-width:none}.stm-menu{width:min(300px,calc(100vw - 32px))}.stm-frame{flex:none;container-type:inline-size}}" +
  "@media (hover:none){.stm-keys{display:none}}" +
  "@media (prefers-reduced-motion:reduce){.stm-build .stm-dot,.stm-draw,.stm-pins,.stm-tip,.stm-menu{animation:none}.stm-dot,.stm-pin,.stm-sw,.stm-btn,.stm-pick>svg,.stm-egg,.stm-toast,.stm-cursor-dot,.stm-cursor-label,.stm-trail{transition:none}}"

type Cell = { m: number; s: number; v: number; side: number; k: number; bin: number; x: number; y: number }
type Active = { m: number; s: number }

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
  onPick,
}: {
  sectors: string[]
  pinned: number
  latest: (number | null)[]
  latestLabel: string
  colors: string[]
  thresholds: number[]
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
        data-cursor={open ? "Close the list" : "Choose a sector"}
        onClick={() => (open ? close(false) : show())}
        onKeyDown={(e) => {
          if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
            e.preventDefault()
            show()
          }
        }}
      >
        <span>
          <i className="stm-pip" data-off={pinned < 0 ? "" : undefined} aria-hidden="true" />
          <em>Follow</em>
          <strong>{pinned < 0 ? "No sector" : sectors[pinned]}</strong>
        </span>
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
                data-cursor={i === 0 ? "Stop following" : i === pinned + 1 ? "Following" : "Follow " + name}
                onPointerMove={() => i !== hi && setHi(i)}
                onClick={() => pick(i)}
              >
                <span className="stm-check">{i === pinned + 1 ? <Check /> : null}</span>
                <span className="stm-opt-name">{name ?? "No sector"}</span>
                {v != null && (
                  <span className="stm-chip">
                    {fmtPct(v)}
                    <i style={{ ["--c" as string]: v === 0 ? "var(--color-muted-foreground)" : colors[binOf(v, thresholds)] } as CSSProperties} />
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
  bands = DEFAULT_BANDS,
  scale,
  legendTicks = [-1, 0, 0.75],
  defaultPinned = "Construction",
  onPinChange,
  eyebrow = "Payroll tide · 2006 – 2015",
  title = "Who’s hiring, who’s cutting",
  description = "Each dot is an industry. Sectors that added jobs stack above the line, sectors that shed them sink below it, and the shade shows how far each one’s payrolls moved from the month before.",
  legendLabel = "Change in payrolls from the previous month",
  footnote = "Synthetic, seeded data shaped like a downturn and a recovery.",
  labels,
  height = "100svh",
  className,
  style,
}: SectorTideMatrixProps) {
  const uid = "stm" + useId().replace(/[^a-zA-Z0-9]/g, "")
  const data = useMemo(() => dataProp ?? generateSeries(), [dataProp])
  const sectors = sectorsProp ?? DEFAULT_SECTORS
  const thresholds = scale?.thresholds ?? DEFAULT_THRESHOLDS
  const colors = scale?.colors ?? DEFAULT_COLORS
  const L = { rising: "Sectors rising", falling: "Sectors falling", flat: "Flat", ...labels }
  const startAbs = parseMonth(start)
  const months = data.length
  const g = useMemo(() => geometry(months, sectors.length), [months, sectors.length])

  const pinIndex = (name: string | null | undefined) => (name ? sectors.indexOf(name) : -1)
  const [pinned, setPinned] = useState(() => pinIndex(defaultPinned))
  const [filter, setFilter] = useState([] as number[])
  const [active, setActive] = useState(null as Active | null)
  const [build, setBuild] = useState(0)
  const [egg, setEgg] = useState(-1)
  const [toast, setToast] = useState({ text: "", on: false })
  const [say, setSay] = useState("")
  const [still, setStill] = useState(false)

  const rootRef = useRef(null as HTMLDivElement | null)
  const cursorRef = useRef(null as HTMLDivElement | null)
  const labelRef = useRef(null as HTMLSpanElement | null)
  const st = useRef({
    fine: false,
    still: false,
    right: 0,
    active: null as Active | null,
    pinned: -1,
    downOn: "",
    touch: false,
    focus: false,
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
    const fp = window.matchMedia("(hover: hover) and (pointer: fine)")
    const sync = () => {
      st.current.still = rm.matches
      st.current.fine = fp.matches
      setStill(rm.matches)
    }
    sync()
    rm.addEventListener("change", sync)
    fp.addEventListener("change", sync)
    return () => {
      rm.removeEventListener("change", sync)
      fp.removeEventListener("change", sync)
      clearTimeout(st.current.eggTimer)
      clearTimeout(st.current.toastTimer)
    }
  }, [])

  const bandCols = useMemo(
    () =>
      bands
        .map((b) => ({ ...b, m0: Math.max(0, parseMonth(b.from) - startAbs), m1: Math.min(months - 1, parseMonth(b.to) - startAbs) }))
        .filter((b) => b.m1 >= b.m0),
    [bands, startAbs, months],
  )

  // the values on screen: the real series, or (briefly) the Easter egg's imagined one
  const shown = useMemo(() => {
    const b = bandCols[egg]
    if (!b) return data
    return data.map((row, m) => (m < b.m0 || m > b.m1 ? row : row.map((v, s) => (v == null ? null : imagined(v, m, s)))))
  }, [data, egg, bandCols])

  const stacks = useMemo(() => shown.map((row) => stackMonth(row)), [shown])
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

  const summary = useMemo(() => summarize(data.map((r) => stackMonth(r)), startAbs), [data, startAbs])

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
      // the cursor is still on the dot: say what the next click will do, without waiting for a move
      const cur = cursorRef.current
      if (cur && labelRef.current && cur.getAttribute("data-mode") === "dot") labelRef.current.textContent = next === s ? "Unfollow" : "Follow " + sectors[s]
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
      announce("Easter egg: the " + name + " months redrawn as if every sector grew.")
      s.eggTimer = window.setTimeout(() => {
        setEgg(-1)
        flash("…but the data remembers.", 2400)
      }, 4200)
    },
    [egg, bandCols, flash, announce],
  )

  // ---- legend/active text helpers ----
  const describe = (m: number, s: number) => {
    const stk = stacks[m]
    const head = monthName(startAbs + m) + ": " + stk.up.length + " rising, " + stk.down.length + " falling, " + stk.flat.length + " flat."
    if (s < 0 || shown[m][s] == null) return head
    return sectors[s] + ", " + fmtPct(shown[m][s] as number) + " in " + monthName(startAbs + m) + ". " + rankText(stk, s) + ". " + head
  }

  // ---- pointer over the chart: tooltip + crosshair (mouse and touch) ----
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
    const a = st.current.active
    if (a && a.m === hit.m && a.s === hit.s) return
    setActive(hit)
  }, [])

  const onPlotLeave = useCallback(() => {
    if (!st.current.focus) setActive(null)
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

  // ---- the context cursor: mouse on a fine pointer only ----
  const onEnter = useCallback((e: ReactPointerEvent) => {
    if (e.pointerType !== "mouse" || !st.current.fine) return
    // one read per entry: where the stage ends, so the cursor label can flip before it runs off
    st.current.right = rootRef.current ? rootRef.current.getBoundingClientRect().right : 0
    cursorRef.current?.setAttribute("data-on", "")
  }, [])

  const onMove = useCallback(
    (e: ReactPointerEvent) => {
      const s = st.current
      if (e.pointerType !== "mouse" || !s.fine) return
      const cur = cursorRef.current
      if (cur) {
        cur.setAttribute("data-on", "")
        cur.style.transform = "translate3d(" + e.clientX + "px," + e.clientY + "px,0)"
        if (s.right && e.clientX > s.right - 190) cur.setAttribute("data-flip", "")
        else cur.removeAttribute("data-flip")
      }
      const t = e.target as Element
      const hit = t.closest ? (t.closest("[data-cursor]") as HTMLElement | null) : null
      let label = hit ? hit.getAttribute("data-cursor") || "" : ""
      let mode = ""
      const ds = t.getAttribute ? t.getAttribute("data-s") : null
      if (!label && ds != null) {
        const si = Number(ds)
        label = s.pinned === si ? "Unfollow" : "Follow " + sectors[si]
        mode = "dot"
      }
      if (cur && labelRef.current) {
        if (label) {
          if (labelRef.current.textContent !== label) labelRef.current.textContent = label
          cur.setAttribute("data-label", "")
        } else cur.removeAttribute("data-label")
        if (mode) cur.setAttribute("data-mode", mode)
        else cur.removeAttribute("data-mode")
      }
    },
    [sectors],
  )

  const onLeave = useCallback(() => {
    cursorRef.current?.removeAttribute("data-on")
  }, [])

  // ---- the dots: memoised so hovering never re-renders 2,000 rects ----
  const filterKey = filter.join(",")
  const dots = useMemo(() => {
    const out: ReactElement[] = []
    const on = filterKey ? filterKey.split(",").map(Number) : []
    for (let m = 0; m < grid.length; m++) {
      for (const c of grid[m]) {
        if (!c) continue
        const dim = on.length > 0 && c.s !== pinned && !on.includes(c.bin)
        const cls = "stm-dot" + (c.side === 0 ? " stm-flat" : "") + (c.s === pinned ? " is-pin" : "") + (dim ? " is-dim" : "")
        const vars = {
          translate: c.x + "px " + c.y + "px",
          fill: c.side === 0 || c.s === pinned ? undefined : colors[c.bin],
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
      if (!c || c.side === 0) {
        pen = false
        continue
      }
      pts.push(c)
      d += (pen ? "L" : "M") + (c.x + DOT / 2).toFixed(1) + " " + (c.y + DOT / 2).toFixed(1)
      pen = true
    }
    return { d, pts }
  }, [grid, pinned])

  const years = useMemo(() => {
    const out: { m: number; y: number }[] = []
    for (let m = 0; m < months; m++) if ((startAbs + m) % 12 === 0) out.push({ m, y: (startAbs + m) / 12 })
    return out
  }, [months, startAbs])

  const yTicks = useMemo(() => {
    const out: number[] = []
    for (let v = -g.yMax; v <= g.yMax; v += 5) out.push(v)
    return out
  }, [g.yMax])
  const tickY = (v: number) => (v > 0 ? g.y0 - v * PITCH + PITCH / 2 : v < 0 ? g.y0 - v * PITCH - PITCH / 2 : g.y0)

  const a = active && active.m < months ? active : null
  const cell = a && a.s > -1 ? grid[a.m][a.s] : null
  const colX = a ? g.left + a.m * PITCH + PITCH / 2 : 0
  const pct = (v: number, of: number) => (v / of) * 100 + "%"

  let tip: ReactElement | null = null
  if (a) {
    const stk = stacks[a.m]
    const ax = cell ? cell.x + DOT / 2 : colX
    const ay = cell ? cell.y : g.y0
    const below = ay < g.top + g.yMax * PITCH * 0.55
    const fx = ax / g.W
    const tx = fx > 0.8 ? "-100%" : fx < 0.14 ? "0%" : "-50%"
    const t = "translate(" + tx + "," + (below ? "18px" : "calc(-100% - 10px)") + ")"
    const top = below ? (cell ? cell.y + DOT : g.y0) : ay
    tip = (
      <div className="stm-tip" role="presentation" style={{ left: pct(ax + (fx > 0.8 ? 8 : fx < 0.14 ? -8 : 0), g.W), top: pct(top, g.H), transform: t, ["--t" as string]: t } as CSSProperties}>
        {cell ? (
          <>
            <b>{sectors[cell.s]}</b>
            <span>
              <i style={{ ["--c" as string]: cell.side === 0 ? "var(--color-muted-foreground)" : colors[cell.bin] } as CSSProperties} />
              {fmtPct(cell.v)} in {monthName(startAbs + a.m)}
              {egg > -1 && a.m >= bandCols[egg].m0 && a.m <= bandCols[egg].m1 ? " (imagined)" : ""}
            </span>
            <small>{rankText(stk, cell.s) + (pinned !== cell.s ? (st.current.touch ? " · tap again to follow" : "") : " · following")}</small>
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

  const pillW = 64
  const pillX = Math.max(g.left - 8, Math.min(g.W - pillW, colX - pillW / 2))
  const ratio = g.W / g.H
  const building = !still

  return (
    <div
      ref={rootRef}
      className={"stm-root" + (className ? " " + className : "")}
      style={{ height, ...style }}
      onPointerEnter={onEnter}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      <style>{CSS}</style>
      <div className="stm-wrap">
        <header className="stm-head">
          <div className="stm-copy">
            <p className="stm-eyebrow">
              <i />
              {eyebrow}
            </p>
            <h2 className="stm-title">{title}</h2>
            <p className="stm-desc">{description}</p>
          </div>
          <fieldset className="stm-legend" data-f={filter.length ? "" : undefined}>
            <legend className="stm-sr">Filter by range</legend>
            <span className="stm-legend-cap" aria-hidden="true">
              {legendLabel}
            </span>
            <div className="stm-sws">
              {colors.map((c, b) => {
                const lo = b === 0 ? null : thresholds[b - 1]
                const hi = b === colors.length - 1 ? null : thresholds[b]
                const range = lo == null ? fmtPct(hi as number) + " or less" : hi == null ? fmtPct(lo) + " or more" : fmtPct(lo) + " to " + fmtPct(hi)
                const on = filter.includes(b)
                return (
                  <button
                    key={b}
                    type="button"
                    className="stm-sw"
                    style={{ ["--c" as string]: c } as CSSProperties}
                    aria-pressed={on}
                    aria-label={"Show sectors " + range}
                    title={range}
                    data-cursor={on ? (filter.length === 1 ? "Show all" : "Drop " + range) : filter.length ? "Add " + range : "Only " + range}
                    onClick={() => toggleBin(b)}
                  />
                )
              })}
            </div>
            <div className="stm-ticks" aria-hidden="true">
              {legendTicks.map((v) => {
                const i = thresholds.indexOf(v)
                if (i < 0) return null
                return (
                  <span key={v} style={{ left: "calc(" + ((i + 1) / colors.length) * 100 + "% - " + (1 - (i + 1) / colors.length) * 2 + "px)" }}>
                    {v === 0 ? "0%" : (v > 0 ? "+" : "−") + Math.abs(v) + "%"}
                  </span>
                )
              })}
            </div>
          </fieldset>
        </header>

        <div className="stm-bar">
          <SectorPicker sectors={sectors} pinned={pinned} latest={shown[months - 1] ?? []} latestLabel={monthName(startAbs + months - 1, true)} colors={colors} thresholds={thresholds} onPick={choose} />
          <p className="stm-read" aria-hidden="true">
            {a ? (
              <>
                <strong>{monthName(startAbs + a.m)}</strong>
                <span>{stacks[a.m].up.length} rising</span>
                <span>{stacks[a.m].down.length} falling</span>
                <span>{stacks[a.m].flat.length} flat</span>
              </>
            ) : (
              <>
                <span>Toughest month</span>
                <strong>{summary.worst.label}</strong>
                <span>
                  {summary.worst.falling} of {sectors.length} falling
                </span>
              </>
            )}
          </p>
          <div className="stm-acts">
            <button type="button" className="stm-btn" data-cursor="Clear filter & follow" onClick={reset} disabled={!filter.length && pinned < 0}>
              <span>Reset</span>
            </button>
            <button type="button" className="stm-btn" data-solid="" data-cursor="Rebuild the chart" onClick={replay}>
              <span>
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M2.2 7a4.8 4.8 0 1 0 1.5-3.5" />
                  <path d="M2 1.6v2.6h2.6" />
                </svg>
                Replay
              </span>
            </button>
          </div>
        </div>

        <div className="stm-frame" style={{ minHeight: "calc(" + Math.ceil(860 / ratio) + "px + 14px)" }}>
          <div
            className="stm-plot"
            tabIndex={0}
            role="group"
            aria-roledescription="dot matrix chart"
            aria-label={title + ". Use arrow keys to move between months and sectors, Enter to follow a sector, Escape to clear."}
            aria-describedby={uid + "-sum"}
            style={{ width: "max(860px, min(100cqw, calc(100cqh * " + ratio.toFixed(4) + ")))", aspectRatio: g.W + " / " + g.H }}
            onKeyDown={onKey}
            onFocus={onPlotFocus}
            onBlur={onPlotBlur}
          >
            <svg className="stm-svg" viewBox={"0 0 " + g.W + " " + g.H} aria-hidden="true" onPointerMove={onPlotMove} onPointerLeave={onPlotLeave} onPointerDown={onPlotDown} onClick={onPlotClick}>
              {bandCols.map((b, i) => (
                <rect key={i} className="stm-band" data-on={egg === i ? "" : undefined} x={g.left + b.m0 * PITCH} y={g.top - 16} width={(b.m1 - b.m0 + 1) * PITCH} height={g.plotBottom - g.top + 20} rx={3} />
              ))}
              {a && <rect className="stm-hair" x={colX - PITCH / 2} y={g.top - 16} width={PITCH} height={g.flatTop + 3 * PITCH - g.top + 18} rx={3} />}

              <g className="stm-yrs" data-dim={a ? "" : undefined}>
                {years.map((y) => (
                  <g key={y.y}>
                    <text className="stm-yr" x={g.left + y.m * PITCH} y={18} textAnchor="middle">
                      {y.y}
                    </text>
                    <line className="stm-tick" x1={g.left + y.m * PITCH} x2={g.left + y.m * PITCH} y1={25} y2={31} />
                  </g>
                ))}
              </g>
              {a && (
                <g>
                  <rect className="stm-pill" x={pillX} y={4} width={pillW} height={19} rx={9.5} />
                  <text className="stm-pilltx" x={pillX + pillW / 2} y={17.6} textAnchor="middle">
                    {monthName(startAbs + a.m, true)}
                  </text>
                </g>
              )}

              {yTicks.map((v) => (
                <g key={v}>
                  <text className="stm-ax" x={g.left - 14} y={tickY(v) + 3.8} textAnchor="end">
                    {v === 0 ? "0" : v > 0 ? v : "−" + -v}
                  </text>
                  <line className="stm-tick" x1={g.left - 9} x2={g.left - 5} y1={tickY(v)} y2={tickY(v)} />
                </g>
              ))}
              <text className="stm-axt" transform={"translate(14 " + (g.y0 - (g.yMax * PITCH) / 2) + ") rotate(-90)"} textAnchor="middle">
                {L.rising + " ›"}
              </text>
              <text className="stm-axt" transform={"translate(14 " + (g.y0 + (g.yMax * PITCH) / 2) + ") rotate(-90)"} textAnchor="middle">
                {"‹ " + L.falling}
              </text>
              <text className="stm-ax" x={g.left - 14} y={g.flatTop + 2.5 * PITCH + 3.8} textAnchor="end">
                {L.flat}
              </text>
              <line className="stm-base" x1={g.left} x2={g.W - g.right} y1={g.y0} y2={g.y0} />

              {Array.from({ length: months }, (_, m) => (
                <rect key={m} className="stm-hit" data-m={m} x={g.left + m * PITCH} y={g.top - 16} width={PITCH} height={g.flatTop + 3 * PITCH - g.top + 18} />
              ))}

              <g key={build} className={building ? "stm-build" : undefined}>
                {dots}
              </g>

              {trail.d && (
                <g key={"p" + pinned + "-" + build} className="stm-pins" style={{ ["--d" as string]: build === 0 && building ? "1200ms" : "0ms" } as CSSProperties}>
                  <path className={"stm-trail" + (building ? " stm-draw" : "")} data-off={egg > -1 ? "" : undefined} d={trail.d} pathLength={1} style={{ ["--d" as string]: build === 0 && building ? "1200ms" : "0ms" } as CSSProperties} />
                  {trail.pts.map((c) => (
                    <rect key={c.m} className="stm-pin" width={DOT} height={DOT} rx={2.5} data-m={c.m} data-s={c.s} style={{ translate: c.x + "px " + c.y + "px", ["--k" as string]: c.k } as CSSProperties} />
                  ))}
                </g>
              )}

              {cell && <rect className="stm-ring" x={cell.x - 1.6} y={cell.y - 1.6} width={DOT + 3.2} height={DOT + 3.2} rx={3.6} />}
            </svg>

            {bandCols.map((b, i) => (
              <button
                key={i}
                type="button"
                className="stm-egg"
                data-on={egg === i ? "" : undefined}
                style={{ left: pct(g.left + ((b.m0 + b.m1 + 1) / 2) * PITCH, g.W), top: pct(g.top - 13, g.H) }}
                data-cursor={egg === i ? "Back to the record" : "Undo the " + b.label.toLowerCase() + "?"}
                aria-label={egg === i ? "Show the real " + b.label.toLowerCase() + " again" : b.label + ": imagine it never happened"}
                onClick={() => playEgg(i)}
              >
                {egg === i ? "If only" : b.label}
              </button>
            ))}
            {tip}
          </div>
        </div>

        <footer className="stm-foot">
          <span>{footnote}</span>
          <span className="stm-keys" aria-hidden="true">
            <kbd>←</kbd>
            <kbd>→</kbd> months · <kbd>↑</kbd>
            <kbd>↓</kbd> sectors · <kbd>↵</kbd> follow · <kbd>esc</kbd> clear
          </span>
        </footer>
      </div>

      <p id={uid + "-sum"} className="stm-sr">
        {months} months of {sectors.length} sectors. The worst month was {summary.worst.label}, with {summary.worst.falling} sectors shedding jobs. The broadest
        hiring came in {summary.best.label}, with {summary.best.rising} sectors adding jobs.
      </p>
      <p className="stm-sr" aria-live="polite">
        {say}
      </p>
      <div className="stm-toast" data-on={toast.on ? "" : undefined} role="status">
        {toast.text}
      </div>
      <div ref={cursorRef} className="stm-cursor" aria-hidden="true">
        <span className="stm-cursor-dot" />
        <span ref={labelRef} className="stm-cursor-label" />
      </div>
    </div>
  )
}
