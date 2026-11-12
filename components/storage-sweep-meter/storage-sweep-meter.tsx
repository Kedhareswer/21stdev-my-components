"use client"

import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type PointerEvent as ReactPointerEvent } from "react"

/* Storage Sweep Meter — a disk-usage card whose bar is an LED dot matrix.
   A scan fills the bar left to right behind a white-hot front, a 3 x 3 legend
   isolates one category on hover, and "Clear" sweeps a segment away: its lit
   cells lift off as pixels, the segment folds shut and everything to its right
   slides over while the counter ticks down. One canvas, no dependencies. */

export type StorageIcon = "apps" | "film" | "gear" | "code" | "doc" | "box" | "photo" | "music" | "trash" | "dot"

export type StorageTexture = "lattice" | "rain" | "rise" | "diamond" | "scatter"

export type StorageCategory = {
  id: string
  label: string
  /** Size in GB. */
  size: number
  /** Any hex colour, "#rrggbb". */
  color: string
  icon?: StorageIcon
  /** How the lit cells are laid out in the segment. */
  texture?: StorageTexture
  /** Shown in the status line while this category is highlighted. */
  note?: string
  /** Makes the category clearable from the footer. `{size}` in `message` is replaced. */
  clear?: { keep: number; message: string; action: string; verb: string; paths?: string[] }
}

export type StorageSweepMeterProps = {
  categories?: StorageCategory[]
  /** Disk capacity in GB. */
  total?: number
  /** Paths flicked through in the status line while scanning. */
  scanPaths?: string[]
  /** Order the bar draws in (ids). Defaults to `categories` order. */
  barOrder?: string[]
  onClear?: (id: string, freedGB: number) => void
  height?: string | number
  className?: string
  style?: CSSProperties
}

// #region model
// Pure layout math. The test lifts this region and runs it.

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

/** Whole columns per size, by largest remainder. Anything non-zero gets at least one. */
export function allocateColumns(sizes: number[], total: number, cols: number): number[] {
  const cap = Math.max(1, total)
  const exact = sizes.map((s) => (Math.max(0, s) / cap) * cols)
  const out = exact.map((e, i) => (sizes[i] > 0.05 ? Math.max(1, Math.floor(e)) : 0))
  const want = Math.min(cols, Math.round(exact.reduce((a, b) => a + b, 0)))
  const order = exact.map((e, i) => [e - Math.floor(e), i]).sort((a, b) => b[0] - a[0])
  let sum = out.reduce((a, b) => a + b, 0)
  for (let k = 0; sum < want && k < order.length; k++) {
    const i = order[k][1]
    if (sizes[i] > 0.05) {
      out[i]++
      sum++
    }
  }
  // Over budget (minimums on a tiny bar): take from the widest until it fits.
  while (sum > cols) {
    let w = 0
    for (let i = 1; i < out.length; i++) if (out[i] > out[w]) w = i
    if (out[w] <= 1) break
    out[w]--
    sum--
  }
  return out
}

export function formatGB(n: number): string {
  const v = Math.round(Math.max(0, n) * 10) / 10
  return v.toFixed(1) + " GB"
}

/** Index of the first category still worth clearing, or -1. */
export function nextClearable(cats: { size: number; clear?: { keep: number } }[]): number {
  for (let i = 0; i < cats.length; i++) {
    const c = cats[i].clear
    if (c && cats[i].size - c.keep > 0.05) return i
  }
  return -1
}

export function hexRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "")
  const f = h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6)
  const n = parseInt(f, 16)
  return Number.isFinite(n) ? [(n >> 16) & 255, (n >> 8) & 255, n & 255] : [200, 200, 200]
}

/** Chance a lattice cell is lit. u = column 0..1 across the segment, v = row 0..1 top to bottom. */
export function textureDensity(texture: string, u: number, v: number): number {
  switch (texture) {
    case "rain":
      return 0.06 + 0.9 * Math.pow(1 - v, 1.7)
    case "rise":
      return 0.06 + 0.85 * Math.pow(v, 1.7)
    case "diamond":
      return 0.1 + 0.85 * Math.max(0, 1 - Math.abs(Math.abs(u - 0.5) - Math.abs(v - 0.5)) * 4.5)
    case "scatter":
      return 0.26
    default:
      return 0.82
  }
}

export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
// #endregion

const DEFAULT_CATEGORIES: StorageCategory[] = [
  { id: "apps", label: "Apps", size: 52.6, color: "#22c3e6", icon: "apps", texture: "lattice", note: "214 apps. Three of them haven't opened since spring." },
  { id: "movies", label: "Movies", size: 44.1, color: "#9b6cf6", icon: "film", texture: "rain", note: "Screen recordings take 24.6 GB, most from this autumn." },
  { id: "system", label: "System data", size: 34.2, color: "#a3acb9", icon: "gear", texture: "lattice", note: "Managed by the system. It shrinks on its own." },
  { id: "developer", label: "Developer", size: 36.3, color: "#34d399", icon: "code", texture: "scatter", note: "Toolchains, simulators and 41 dependency folders." },
  { id: "documents", label: "Documents", size: 41.7, color: "#3b82f6", icon: "doc", texture: "lattice", note: "Mostly exports and an old project archive." },
  {
    id: "caches",
    label: "Caches",
    size: 46.3,
    color: "#f59e0b",
    icon: "box",
    texture: "scatter",
    note: "Temporary files apps keep to start faster.",
    clear: {
      keep: 1.2,
      message: "Caches are using {size}. Apps rebuild them when they need them.",
      action: "Clear caches",
      verb: "Clearing caches",
      paths: ["~/Library/Caches/thumbnails", "~/Library/Caches/browser/cache2", "~/.cache/pip/wheels", "~/Library/Caches/editor/CachedData", "~/Library/Caches/maps/tiles", "~/.npm/_cacache/content-v2", "~/Library/Caches/fonts", "~/Library/Caches/photos/derivatives"],
    },
  },
  { id: "photos", label: "Photos", size: 58.6, color: "#ec4899", icon: "photo", texture: "diamond", note: "18,402 photos. 2.3 GB of them are near-duplicates." },
  { id: "music", label: "Music", size: 12.6, color: "#facc15", icon: "music", texture: "lattice", note: "Downloaded albums, mostly from one long summer." },
  {
    id: "trash",
    label: "Trash",
    size: 31.4,
    color: "#ef4444",
    icon: "trash",
    texture: "rise",
    note: "Deleted files that still count against the disk.",
    clear: {
      keep: 0,
      message: "The Trash is holding {size} you already threw away.",
      action: "Empty Trash",
      verb: "Emptying Trash",
      paths: ["~/.Trash/old-renders", "~/.Trash/archive-2023.zip", "~/.Trash/screen-recording-04.mov", "~/.Trash/installer.dmg", "~/.Trash/drafts", "~/.Trash/node_modules"],
    },
  },
]

const DEFAULT_ORDER = ["apps", "documents", "developer", "photos", "movies", "system", "music", "caches", "trash"]

const DEFAULT_PATHS = [
  "/Applications/Sketchpad.app",
  "~/Documents/Taxes/2024",
  "~/Projects/atlas/node_modules",
  "~/Movies/Screen recordings",
  "~/Pictures/Library/originals",
  "/System/Library/Fonts",
  "~/Music/Downloads/Albums",
  "~/Library/Caches/thumbnails",
  "~/Developer/simulators/runtime",
  "~/Projects/halftone/previews",
  "~/Desktop/old-exports",
  "~/.Trash/archive-2023.zip",
]

// Bar geometry, CSS px.
const P = 4.5 // cell pitch
const ROWS = 18
const BAR_H = ROWS * P
const RADIUS = 9
const OX = 18 // canvas overhang left / right (bloom)
const OY = 150 // canvas overhang above: the dissolved pixels rise into it
const OB = 18 // overhang below
const PEACH: [number, number, number] = [255, 233, 214]

// Two-tone filled glyphs: [path, tone]. 0 = colour, 1 = shade, 2 = highlight, 3 = shade stroke.
const ICONS: Record<StorageIcon, [string, number][]> = {
  apps: [
    ["M2 3.6A1.6 1.6 0 0 1 3.6 2h8.8A1.6 1.6 0 0 1 14 3.6v8.8a1.6 1.6 0 0 1-1.6 1.6H3.6A1.6 1.6 0 0 1 2 12.4z", 0],
    ["M2 5.4h12V3.6A1.6 1.6 0 0 0 12.4 2H3.6A1.6 1.6 0 0 0 2 3.6z", 2],
    ["M4.3 7.6h3.2v3.6H4.3zM9 7.6h2.7v1.3H9zM9 9.9h2.7v1.3H9z", 1],
  ],
  film: [
    ["M2 3h12v10H2z", 0],
    ["M3 4.1h1.4v1.4H3zM3 7.3h1.4v1.4H3zM3 10.5h1.4v1.4H3zM11.6 4.1H13v1.4h-1.4zM11.6 7.3H13v1.4h-1.4zM11.6 10.5H13v1.4h-1.4z", 1],
    ["M5.5 4h5v8h-5z", 2],
  ],
  gear: [
    ["M8 1.4l1.3 1.7 2.1-.5.5 2.1 1.7 1.3-.9 1.9.9 1.9-1.7 1.3-.5 2.1-2.1-.5L8 14.6l-1.3-1.7-2.1.5-.5-2.1-1.7-1.3.9-1.9-.9-1.9 1.7-1.3.5-2.1 2.1.5z", 0],
    ["M8 5.5a2.5 2.5 0 1 0 0 5a2.5 2.5 0 1 0 0-5z", 1],
  ],
  code: [
    ["M2 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z", 0],
    ["M2 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1H2z", 2],
    ["M4.8 7.4l2 1.6-2 1.6M8.4 11h2.8", 3],
  ],
  doc: [
    ["M3.8 1.8h5.4l3 3.2v9.2H3.8z", 0],
    ["M9.2 1.8V5h3z", 2],
    ["M5.8 8h4.4M5.8 10.2h4.4M5.8 12.3h2.8", 3],
  ],
  box: [
    ["M8 1.8l5.6 2.8v6.8L8 14.2l-5.6-2.8V4.6z", 0],
    ["M13.6 4.6L8 7.4v6.8l5.6-2.8z", 1],
    ["M8 1.8l5.6 2.8L8 7.4 2.4 4.6z", 2],
  ],
  photo: [
    ["M1.6 13.4L6 6.4l2.7 4.1 1.9-2.5 3.8 5.4z", 0],
    ["M11.4 2.8a1.6 1.6 0 1 0 0 3.2a1.6 1.6 0 1 0 0-3.2z", 0],
    ["M6 6.4l1.4 2.1L6 9.6 4.7 8.5z", 2],
  ],
  music: [
    ["M6 3.6l7-1.6v8.7a2 2 0 1 1-1.4-1.9V5.2L7.4 6.2v6.3A2 2 0 1 1 6 10.6z", 0],
    ["M6 3.6l7-1.6v1.6L6 5.2z", 2],
  ],
  trash: [
    ["M3 3.5h10v1.7H3zM6.3 1.9h3.4v1.6H6.3z", 0],
    ["M4 5.9h8l-.7 8.2H4.7z", 0],
    ["M6.4 7.6v4.8M9.6 7.6v4.8", 3],
  ],
  dot: [["M8 4.5a3.5 3.5 0 1 0 0 7a3.5 3.5 0 1 0 0-7z", 0]],
}

function Glyph({ name, color, size = 16 }: { name: StorageIcon; color: string; size?: number }) {
  return (
    <svg className="ssm-glyph" width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      {(ICONS[name] || ICONS.dot).map(([d, tone], i) =>
        tone === 3 ? (
          <path key={i} d={d} fill="none" stroke="rgba(0,0,0,.5)" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <path key={i} d={d} fill={tone === 0 ? color : tone === 1 ? "rgba(0,0,0,.32)" : "rgba(255,255,255,.3)"} />
        ),
      )}
    </svg>
  )
}

const CSS =
  ".ssm-stage{position:relative;display:grid;place-items:center;width:100%;overflow:hidden;background:var(--color-background);color:var(--color-foreground);padding:24px 16px;box-sizing:border-box;font-variant-numeric:tabular-nums;-webkit-font-smoothing:antialiased}" +
  ".ssm-card{position:relative;width:100%;max-width:640px;box-sizing:border-box;border-radius:18px;background:#1b1b1d;color:#ececee;padding:24px 24px 0;border:1px solid color-mix(in oklab,var(--color-foreground) 10%,rgba(255,255,255,.06));box-shadow:0 1px 0 rgba(255,255,255,.05) inset,0 34px 70px -30px rgba(0,0,0,.6),0 12px 28px -16px rgba(0,0,0,.45)}" +
  ".ssm-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;position:relative;z-index:2}" +
  ".ssm-total{display:flex;align-items:baseline;gap:9px;margin:0;line-height:1}" +
  ".ssm-used{font-size:31px;font-weight:600;letter-spacing:-.025em;color:#f5f5f6}" +
  ".ssm-of{font-size:15px;color:#8e8e94}" +
  ".ssm-status{display:flex;align-items:center;gap:8px;margin-top:12px;min-height:20px;font-size:14px;color:#c9c9ce;white-space:nowrap;overflow:hidden}" +
  ".ssm-status b{font-weight:500;color:#ececee;flex:none}" +
  ".ssm-status .ssm-glyph{flex:none}" +
  ".ssm-muted{color:#7f7f86;overflow:hidden;text-overflow:ellipsis;min-width:0}" +
  ".ssm-faint{color:#5d5d63}" +
  ".ssm-path{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:13px}" +
  ".ssm-check{flex:none;color:#4ade80}" +
  ".ssm-btn{appearance:none;display:inline-flex;align-items:center;gap:7px;border:0;background:#2c2c2f;color:#f2f2f4;font:inherit;font-size:14px;font-weight:500;line-height:1;padding:10px 14px;border-radius:10px;cursor:pointer;transition:background .2s,color .2s,transform .15s,opacity .2s;flex:none}" +
  ".ssm-btn:hover{background:#363639}" +
  ".ssm-btn:active{transform:translateY(1px)}" +
  ".ssm-btn:disabled{opacity:.35;cursor:default;transform:none}" +
  ".ssm-btn:focus-visible,.ssm-item:focus-visible{outline:2px solid rgba(255,255,255,.5);outline-offset:2px}" +
  ".ssm-btn-ghost{background:transparent;color:#a3a3a9;font-weight:400;padding:6px 4px}" +
  ".ssm-btn-ghost:hover{background:transparent;color:#f2f2f4}" +
  ".ssm-btn svg{flex:none}" +
  ".ssm-spin{animation:ssm-spin 1s linear infinite}" +
  "@keyframes ssm-spin{to{transform:rotate(360deg)}}" +
  ".ssm-bar{position:relative;height:" + BAR_H + "px;margin:20px 0 18px;touch-action:pan-y}" +
  ".ssm-canvas{position:absolute;left:-" + OX + "px;top:-" + OY + "px;pointer-events:none;display:block;max-width:none}" +
  ".ssm-legend{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));grid-auto-flow:column;grid-template-rows:repeat(3,auto);gap:2px 18px;margin:0 -8px;padding:0;list-style:none}" +
  ".ssm-item{appearance:none;width:100%;display:flex;align-items:center;gap:10px;border:0;background:transparent;color:#d9d9dd;font:inherit;font-size:14px;text-align:left;padding:7px 8px;border-radius:9px;cursor:pointer;transition:background .2s,color .2s,opacity .25s}" +
  ".ssm-item:hover,.ssm-item[data-on='1']{background:rgba(255,255,255,.06);color:#fafafa}" +
  ".ssm-item[data-dim='1']{opacity:.42}" +
  ".ssm-item-label{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}" +
  ".ssm-item-size{flex:none;color:#8e8e94}" +
  ".ssm-foot{display:flex;align-items:center;gap:12px;margin:16px -24px 0;padding:12px 14px 12px 24px;border-top:1px solid rgba(255,255,255,.06);min-height:64px;box-sizing:border-box;font-size:14px;color:#9d9da3}" +
  ".ssm-foot-msg{flex:1 1 auto;min-width:0;display:flex;align-items:center;gap:10px;animation:ssm-in .45s cubic-bezier(.2,.8,.2,1)}" +
  ".ssm-foot-msg span{min-width:0}" +
  "@keyframes ssm-in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}" +
  ".ssm-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}" +
  "@media (max-width:560px){.ssm-card{padding:18px 16px 0}.ssm-legend{grid-template-columns:repeat(2,minmax(0,1fr));grid-auto-flow:row;grid-template-rows:none;gap:0 10px}.ssm-item{font-size:13px}.ssm-foot{margin:14px -16px 0;padding:12px 12px 12px 16px;flex-wrap:wrap;font-size:13px}.ssm-used{font-size:25px}.ssm-of{font-size:13px}.ssm-status{font-size:13px}}" +
  "@media (prefers-reduced-motion:reduce){.ssm-spin,.ssm-foot-msg{animation:none}.ssm-btn,.ssm-item{transition:none}}"

type Phase = "scan" | "idle" | "clear"

type Seg = {
  cat: StorageCategory
  rgb: [number, number, number]
  x: number // columns, animated
  w: number // columns, animated
  lit: Float32Array // per cell intensity, 0 = unlit
  phase: Float32Array
}

type Particle = { x: number; y: number; vx: number; vy: number; age: number; life: number; s: number; r: number; g: number; b: number }

type Clearing = { idx: number; t: number; from: number; to: number; w0: number; w1: number; d: number; lastCol: number }

const mix = (a: [number, number, number], b: [number, number, number], k: number) =>
  Math.round(a[0] + (b[0] - a[0]) * k) + "," + Math.round(a[1] + (b[1] - a[1]) * k) + "," + Math.round(a[2] + (b[2] - a[2]) * k)

export default function StorageSweepMeter({
  categories = DEFAULT_CATEGORIES,
  total = 512,
  scanPaths = DEFAULT_PATHS,
  barOrder,
  onClear,
  height = "100svh",
  className,
  style,
}: StorageSweepMeterProps) {
  const barRef = useRef(null as HTMLDivElement | null)
  const canvasRef = useRef(null as HTMLCanvasElement | null)
  const usedRef = useRef(null as HTMLSpanElement | null)
  const pathRef = useRef(null as HTMLSpanElement | null)
  const sizeRefs = useRef([] as (HTMLSpanElement | null)[])
  const onClearRef = useRef(onClear)
  onClearRef.current = onClear

  const [phase, setPhase] = useState("scan" as Phase)
  const [sizes, setSizes] = useState(() => categories.map((c) => c.size))
  const [hover, setHover] = useState(-1)
  const [pinned, setPinned] = useState(-1)
  const [freed, setFreed] = useState(0)
  const [clearing, setClearing] = useState(-1)
  const [runId, setRunId] = useState(0)

  // Everything the frame loop reads lives here, so the loop never restarts.
  const S = useRef({
    segs: [] as Seg[],
    cols: 0,
    width: 0,
    phase: "scan" as Phase,
    scanT: 0,
    scanDur: 3.2,
    sizes: categories.map((c) => c.size),
    disp: categories.map(() => 0),
    hi: -1,
    hiK: [] as number[], // eased highlight per category
    particles: [] as Particle[],
    clear: null as Clearing | null,
    px: -999,
    py: -999,
    reduced: false,
    fine: false,
    pathT: 0,
    pathI: 0,
    lastUsed: "",
    lastSizes: [] as string[],
    rebuild: true,
  })

  const order = (barOrder ?? DEFAULT_ORDER).map((id) => categories.findIndex((c) => c.id === id)).filter((i) => i >= 0)
  const barIdx = order.length === categories.length ? order : categories.map((_, i) => i)
  const orderKey = barIdx.join(",")
  const catKey = categories.map((c) => c.id + ":" + c.size + c.color + (c.texture ?? "")).join("|")

  // Latest props for the loop.
  const catsRef = useRef(categories)
  catsRef.current = categories
  const totalRef = useRef(total)
  totalRef.current = total
  const pathsRef = useRef(scanPaths)
  pathsRef.current = scanPaths
  const barIdxRef = useRef(barIdx)
  barIdxRef.current = barIdx

  const hi = hover >= 0 ? hover : pinned
  S.current.hi = hi

  // Reset whenever the data changes or Rescan is pressed.
  useEffect(() => {
    const s = S.current
    s.sizes = categories.map((c) => c.size)
    s.disp = categories.map(() => 0)
    s.hiK = categories.map(() => 0)
    s.phase = "scan"
    s.scanT = 0
    s.clear = null
    s.particles = []
    s.segs = []
    s.rebuild = true
    s.lastSizes = []
    setSizes(s.sizes.slice())
    setPhase("scan")
    setFreed(0)
    setClearing(-1)
    setPinned(-1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catKey, orderKey, total, runId])

  useEffect(() => {
    const bar = barRef.current
    const canvas = canvasRef.current
    if (!bar || !canvas) return
    const ctx = canvas.getContext("2d")
    const off = document.createElement("canvas") // the bar, drawn once, composited twice (bloom + sharp)
    const bx = off.getContext("2d")
    if (!ctx || !bx) return
    const s = S.current
    const mqR = window.matchMedia("(prefers-reduced-motion: reduce)")
    const mqF = window.matchMedia("(hover: hover) and (pointer: fine)")
    const sync = () => {
      s.reduced = mqR.matches
      s.fine = mqF.matches
    }
    sync()
    mqR.addEventListener("change", sync)
    mqF.addEventListener("change", sync)

    let dpr = 1
    let cssW = 0
    let cssH = 0
    const resize = (w: number) => {
      s.width = w
      dpr = Math.min(2, window.devicePixelRatio || 1)
      cssW = w + OX * 2
      cssH = BAR_H + OY + OB
      canvas.width = off.width = Math.round(cssW * dpr)
      canvas.height = off.height = Math.round(cssH * dpr)
      canvas.style.width = cssW + "px"
      canvas.style.height = cssH + "px"
      s.rebuild = true
    }
    const ro = new ResizeObserver((es) => {
      for (const e of es) resize(e.contentRect.width)
    })
    ro.observe(bar)

    let visible = true
    const io = new IntersectionObserver((es) => {
      visible = es[0]?.isIntersecting ?? true
    })
    io.observe(bar)

    const build = () => {
      const cols = Math.max(16, Math.floor(s.width / P))
      s.cols = cols
      const idx = barIdxRef.current
      const cats = catsRef.current
      const alloc = allocateColumns(idx.map((i) => s.sizes[i]), totalRef.current, cols)
      s.segs = idx.map((ci, k) => {
        const cat = cats[ci]
        const rnd = mulberry32(0x9e37 + ci * 7919 + cat.id.length * 131)
        const n = cols * ROWS
        const lit = new Float32Array(n)
        const ph = new Float32Array(n)
        // Texture is laid out over the segment's full-size width, so a cleared
        // sliver keeps the same look it had before.
        const span = Math.max(1, allocateColumns([cat.size], totalRef.current, cols)[0])
        const tex = cat.texture ?? "lattice"
        for (let c = 0; c < cols; c++) {
          for (let r = 0; r < ROWS; r++) {
            const i = c * ROWS + r
            const edge = r === 0 || r === ROWS - 1
            const onLattice = (r + c) % 2 === 0
            const p = edge ? 0.92 : onLattice ? textureDensity(tex, (c + 0.5) / span, r / (ROWS - 1)) : 0.015
            lit[i] = rnd() < p ? 0.62 + rnd() * 0.38 : 0
            ph[i] = rnd() * 6.283
          }
        }
        return { cat, rgb: hexRgb(cat.color), x: 0, w: alloc[k], lit, phase: ph }
      })
      let x = 0
      for (const g of s.segs) {
        g.x = x
        x += g.w
      }
      s.rebuild = false
    }

    const spawn = (x: number, y: number, rgb: [number, number, number], strong: boolean) => {
      if (s.particles.length > 2600) return
      const k = 0.25 + Math.random() * 0.6 // how far toward peach-white
      s.particles.push({
        x: x + (Math.random() - 0.5) * P * 0.8,
        y: y + (Math.random() - 0.5) * P * 0.8,
        vx: (Math.random() - 0.35) * (strong ? 26 : 14),
        vy: -(strong ? 14 + Math.random() * 50 : 10 + Math.random() * 30),
        age: 0,
        life: strong ? 1.3 + Math.random() * 1.5 : 0.6 + Math.random() * 0.7,
        s: P * (strong ? 0.55 + Math.random() * 0.35 : 0.5),
        r: rgb[0] + (PEACH[0] - rgb[0]) * k,
        g: rgb[1] + (PEACH[1] - rgb[1]) * k,
        b: rgb[2] + (PEACH[2] - rgb[2]) * k,
      })
    }

    const rr = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
      const q = Math.max(0, Math.min(r, w / 2, h / 2))
      c.beginPath()
      c.moveTo(x + q, y)
      c.arcTo(x + w, y, x + w, y + h, q)
      c.arcTo(x + w, y + h, x, y + h, q)
      c.arcTo(x, y + h, x, y, q)
      c.arcTo(x, y, x + w, y, q)
      c.closePath()
    }

    let raf = 0
    let last = performance.now()
    let time = 0

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (!visible || document.hidden || s.width <= 0) return
      if (s.rebuild) build()
      time += dt
      const reduced = s.reduced
      const cats = catsRef.current

      // ---- advance state ----
      const usedCols = s.segs.reduce((a, g) => a + g.w, 0)
      let front = Infinity
      if (s.phase === "scan") {
        s.scanT += reduced ? 99 : dt
        const p = Math.min(1, s.scanT / s.scanDur)
        front = easeInOut(p) * usedCols
        for (const g of s.segs) {
          const ci = cats.indexOf(g.cat)
          s.disp[ci] = s.sizes[ci] * Math.max(0, Math.min(1, (front - g.x) / Math.max(0.001, g.w)))
        }
        if (!reduced && p < 1) {
          const seg = s.segs.find((g) => front >= g.x && front < g.x + g.w)
          for (let k = 0; k < 3; k++) {
            if (Math.random() < 0.6) spawn(OX + (s.width - s.cols * P) / 2 + front * P, OY + Math.random() * BAR_H, seg ? seg.rgb : PEACH, false)
          }
        }
        if (p >= 1) {
          s.phase = "idle"
          front = Infinity
          setPhase("idle")
        }
      } else {
        for (let i = 0; i < s.disp.length; i++) if (!s.clear || s.clear.idx !== i) s.disp[i] = s.sizes[i]
      }

      const gx = OX + (s.width - s.cols * P) / 2
      const gy = OY
      const cl = s.clear
      let edge = -1 // column where the clearing segment is being eaten
      let clearSeg: Seg | undefined
      if (cl) {
        cl.t += reduced ? 99 : dt
        clearSeg = s.segs.find((q) => cats.indexOf(q.cat) === cl.idx)
        if (clearSeg) {
          const g = clearSeg
          const p = Math.min(1, cl.t / cl.d)
          g.w = cl.w0 + (cl.w1 - cl.w0) * easeInOut(p)
          s.disp[cl.idx] = cl.from + (cl.to - cl.from) * easeInOut(p)
          let x = 0
          for (const q of s.segs) {
            q.x = x
            x += q.w
          }
          edge = g.w
          // every column the hot edge has passed lifts off as pixels
          const upto = Math.max(0, Math.floor(g.w))
          if (!reduced) {
            for (let c = cl.lastCol - 1; c >= upto; c--) {
              for (let r = 0; r < ROWS; r++) {
                const i = c * ROWS + r
                const cx = gx + (g.x + c + 0.5) * P
                const cy = gy + (r + 0.5) * P
                if (g.lit[i] > 0) {
                  spawn(cx, cy, g.rgb, true)
                  if (Math.random() < 0.5) spawn(cx, cy, g.rgb, true)
                } else if (Math.random() < 0.22) spawn(cx, cy, g.rgb, true)
              }
            }
            // a steady wisp off the edge itself
            for (let k = 0; k < 4; k++) spawn(gx + (g.x + g.w) * P, gy + Math.random() * BAR_H, g.rgb, Math.random() < 0.5)
          }
          cl.lastCol = Math.min(cl.lastCol, upto)
          if (p >= 1) {
            g.w = cl.w1
            s.sizes[cl.idx] = cl.to
            s.disp[cl.idx] = cl.to
            s.clear = null
            s.phase = "idle"
            edge = -1
            const gone = cl.from - cl.to
            setSizes(s.sizes.slice())
            setFreed((f) => f + gone)
            setClearing(-1)
            setPhase("idle")
            onClearRef.current?.(cats[cl.idx].id, gone)
          }
        }
      }

      // status path flicker
      if (s.phase !== "idle" && pathRef.current) {
        s.pathT += dt
        if (s.pathT > (reduced ? 0.6 : 0.085)) {
          s.pathT = 0
          const list = s.phase === "clear" && s.clear ? cats[s.clear.idx].clear?.paths ?? pathsRef.current : pathsRef.current
          s.pathI = (s.pathI + 1) % Math.max(1, list.length)
          pathRef.current.textContent = list[s.pathI] ?? ""
        }
      }

      // numbers, written straight to the DOM
      const used = s.disp.reduce((a, b) => a + b, 0)
      const u = formatGB(used)
      if (u !== s.lastUsed && usedRef.current) {
        usedRef.current.textContent = u
        s.lastUsed = u
      }
      for (let i = 0; i < s.disp.length; i++) {
        const t = formatGB(s.disp[i])
        if (t !== s.lastSizes[i] && sizeRefs.current[i]) {
          sizeRefs.current[i]!.textContent = t
          s.lastSizes[i] = t
        }
      }

      // eased highlight: 1 for the isolated category (or everyone when none is)
      const hiIdx = s.clear ? -1 : s.hi
      for (let i = 0; i < cats.length; i++) {
        const want = hiIdx < 0 || hiIdx === i ? 1 : 0
        const k = s.hiK[i] ?? 1
        s.hiK[i] = reduced ? want : k + (want - k) * Math.min(1, dt * 10)
      }

      // ---- draw the bar into the offscreen canvas ----
      bx.setTransform(dpr, 0, 0, dpr, 0, 0)
      bx.clearRect(0, 0, cssW, cssH)
      const pointer = s.fine && s.px > -900
      const near = (cx: number, cy: number) => {
        if (!pointer) return 0
        const d = Math.hypot(cx - s.px, cy - s.py)
        return d < 30 ? 1 - d / 30 : 0
      }
      const barW = s.cols * P

      // track and free space
      rr(bx, gx + 0.5, gy + 0.5, barW - 1, BAR_H - 1, RADIUS)
      bx.fillStyle = "rgba(255,255,255,0.015)"
      bx.fill()
      bx.strokeStyle = "rgba(255,255,255,0.07)"
      bx.lineWidth = 1
      bx.stroke()
      const usedEnd = Math.min(front, s.segs.reduce((a, g) => a + g.w, 0))
      for (let c = Math.max(0, Math.floor(usedEnd)); c < s.cols; c++) {
        for (let r = 0; r < ROWS; r++) {
          const cx = gx + (c + 0.5) * P
          if (cx < gx + usedEnd * P + 1) continue
          const cy = gy + (r + 0.5) * P
          const k = near(cx, cy)
          bx.fillStyle = "rgba(255,255,255," + (0.08 + k * 0.32).toFixed(3) + ")"
          const d = 1.1 + k * 1.3
          bx.fillRect(cx - d / 2, cy - d / 2, d, d)
        }
      }

      const usedPx = usedEnd * P
      if (usedPx > 0.5) {
        // one continuous, rounded bar; segments are slices of it
        bx.save()
        rr(bx, gx, gy, usedPx, BAR_H, RADIUS)
        bx.clip()
        for (const g of s.segs) {
          const vis = Math.min(g.w, front - g.x)
          if (vis <= 0.01) continue
          const ci = cats.indexOf(g.cat)
          const m = 0.22 + 0.78 * (s.hiK[ci] ?? 1)
          const isHi = s.hi === ci && !s.clear
          const x0 = gx + g.x * P
          bx.fillStyle = "rgba(" + g.rgb.join(",") + "," + ((isHi ? 0.26 : 0.15) * m).toFixed(3) + ")"
          bx.fillRect(x0, gy, vis * P, BAR_H)
          const cEnd = Math.ceil(vis)
          const isClear = clearSeg === g && edge >= 0
          for (let c = 0; c < cEnd; c++) {
            const ac = g.x + c // absolute column
            let heat = 0
            if (front < Infinity) heat = Math.max(0, 1 - (front - ac) / 3)
            else if (edge >= 0 && clearSeg) {
              const ex = clearSeg.x + edge
              heat = isClear ? Math.max(0, 1 - (ex - ac - 0.5) / 3.2) : g.x >= ex - 0.01 ? Math.max(0, 0.7 - (ac - ex) / 3.5) : 0
            }
            for (let r = 0; r < ROWS; r++) {
              const i = c * ROWS + r
              const cx = x0 + (c + 0.5) * P
              const cy = gy + (r + 0.5) * P
              const k = near(cx, cy)
              let a = g.lit[i]
              // the hot edge ignites unlit cells too
              if (a === 0 && heat > 0.35 && g.phase[i] < heat * 2.4) a = 0.45 + heat * 0.45
              if (a > 0) {
                const tw = reduced ? 1 : 0.86 + 0.14 * Math.sin(time * 1.5 + g.phase[i])
                const al = Math.min(1, (a * tw + k * 0.35) * m + heat * 0.4)
                const sz = P * 0.7 + k * 0.9
                bx.fillStyle = "rgba(" + (heat > 0 ? mix(g.rgb, PEACH, Math.min(1, heat * 1.1)) : g.rgb.join(",")) + "," + al.toFixed(3) + ")"
                bx.fillRect(cx - sz / 2, cy - sz / 2, sz, sz)
              } else {
                const d = 1.15 + k * 1.2
                bx.fillStyle = "rgba(" + g.rgb.join(",") + "," + ((0.34 + k * 0.4) * m).toFixed(3) + ")"
                bx.fillRect(cx - d / 2, cy - d / 2, d, d)
              }
            }
          }
        }
        bx.restore()

        // each slice's share of the outline, in its own colour
        for (const g of s.segs) {
          const vis = Math.min(g.w, front - g.x)
          if (vis <= 0.01) continue
          const ci = cats.indexOf(g.cat)
          const m = 0.25 + 0.75 * (s.hiK[ci] ?? 1)
          bx.save()
          bx.beginPath()
          bx.rect(gx + g.x * P, gy - 4, vis * P, BAR_H + 8)
          bx.clip()
          rr(bx, gx + 0.75, gy + 0.75, usedPx - 1.5, BAR_H - 1.5, RADIUS)
          bx.strokeStyle = "rgba(" + g.rgb.join(",") + "," + m.toFixed(3) + ")"
          bx.lineWidth = s.hi === ci ? 2 : 1.5
          bx.stroke()
          bx.restore()
        }
        // hairline dividers
        bx.fillStyle = "rgba(235,235,240,0.55)"
        for (let k = 1; k < s.segs.length; k++) {
          const xc = s.segs[k].x
          if (xc >= usedEnd - 0.05 || s.segs[k].w < 0.01) continue
          bx.fillRect(gx + xc * P - 0.5, gy + 1, 1, BAR_H - 2)
        }
      }

      // white-hot fronts: the scan, and the edge eating a cleared segment
      const drawFront = (xPx: number, strength: number, glowW: number) => {
        bx.save()
        bx.globalCompositeOperation = "lighter"
        const grad = bx.createLinearGradient(xPx - glowW, 0, xPx + 4, 0)
        grad.addColorStop(0, "rgba(255,235,215,0)")
        grad.addColorStop(0.85, "rgba(255,240,225," + (0.28 * strength).toFixed(3) + ")")
        grad.addColorStop(1, "rgba(255,255,255,0)")
        bx.fillStyle = grad
        bx.fillRect(xPx - glowW, gy, glowW + 4, BAR_H)
        bx.fillStyle = "rgba(255,250,244," + strength.toFixed(3) + ")"
        bx.fillRect(xPx - 1.25, gy - 1, 2.5, BAR_H + 2)
        bx.restore()
      }
      if (front < Infinity && !reduced) drawFront(gx + front * P, Math.min(1, s.scanT * 3), 26)
      if (clearSeg && edge >= 0 && !reduced) drawFront(gx + (clearSeg.x + edge) * P, 1, 18)

      // ---- composite: LED bloom, then the sharp bar, then pixels in flight ----
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.save()
      ctx.globalCompositeOperation = "lighter"
      ctx.globalAlpha = 0.75
      ctx.filter = "blur(" + Math.round(5 * dpr) + "px)"
      ctx.drawImage(off, 0, 0)
      ctx.restore()
      ctx.drawImage(off, 0, 0)

      if (s.particles.length) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        ctx.save()
        ctx.globalCompositeOperation = "lighter"
        const out: Particle[] = []
        for (const q of s.particles) {
          q.age += dt
          if (q.age >= q.life) continue
          q.vy -= 26 * dt
          q.vx += (6 - q.vx) * 0.6 * dt // drift gently up and to the right
          q.x += q.vx * dt
          q.y += q.vy * dt
          const t = q.age / q.life
          const a = Math.pow(1 - t, 1.4) * Math.max(0, Math.min(1, (q.y - 8) / 50))
          if (a <= 0.01) {
            if (q.y > 0) out.push(q)
            continue
          }
          ctx.fillStyle = "rgba(" + Math.round(q.r) + "," + Math.round(q.g) + "," + Math.round(q.b) + "," + a.toFixed(3) + ")"
          const sz = q.s * (1 - t * 0.35)
          ctx.fillRect(q.x - sz / 2, q.y - sz / 2, sz, sz)
          out.push(q)
        }
        s.particles = out
        ctx.restore()
      }
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      mqR.removeEventListener("change", sync)
      mqF.removeEventListener("change", sync)
    }
  }, [])

  const startClear = (idx: number) => {
    const s = S.current
    if (s.phase !== "idle" || idx < 0) return
    const cat = categories[idx]
    const seg = s.segs.find((g) => g.cat.id === cat.id)
    if (!cat.clear || !seg) return
    const to = Math.min(s.sizes[idx], cat.clear.keep)
    const after = s.sizes.slice()
    after[idx] = to
    const alloc = allocateColumns(barIdx.map((i) => after[i]), total, s.cols)
    const w1 = alloc[barIdx.indexOf(idx)]
    const d = Math.max(1.8, Math.min(3, 1.2 + seg.w * 0.07))
    s.clear = { idx, t: 0, from: s.sizes[idx], to, w0: seg.w, w1, d, lastCol: Math.ceil(seg.w) }
    s.phase = "clear"
    setPinned(-1)
    setHover(-1)
    setClearing(idx)
    setPhase("clear")
  }

  const colAt = (x: number) => {
    const s = S.current
    return (x - (s.width - s.cols * P) / 2) / P
  }
  const onBarMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const s = S.current
    if (!s.fine || e.pointerType !== "mouse") return
    s.px = e.nativeEvent.offsetX + OX
    s.py = e.nativeEvent.offsetY + OY
    const col = colAt(e.nativeEvent.offsetX)
    const g = s.segs.find((q) => col >= q.x && col < q.x + q.w)
    const ci = g && s.phase === "idle" ? categories.findIndex((c) => c.id === g.cat.id) : -1
    if (ci !== hover) setHover(ci)
  }
  const onBarLeave = () => {
    S.current.px = -999
    S.current.py = -999
    setHover(-1)
  }
  const onBarTap = (e: ReactPointerEvent<HTMLDivElement>) => {
    const s = S.current
    if (s.phase !== "idle") return
    const col = colAt(e.nativeEvent.offsetX)
    const g = s.segs.find((q) => col >= q.x && col < q.x + q.w)
    const ci = g ? categories.findIndex((c) => c.id === g.cat.id) : -1
    setPinned((p) => (p === ci ? -1 : ci))
  }

  const used = sizes.reduce((a, b) => a + b, 0)
  const suggest = nextClearable(categories.map((c, i) => ({ size: sizes[i], clear: c.clear })))
  const hiCat = hi >= 0 && phase === "idle" ? categories[hi] : null
  const clearCat = clearing >= 0 ? categories[clearing] : null

  const check = (
    <svg className="ssm-check" width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 8.5l3.2 3L13 4.5" />
    </svg>
  )

  let status: ReactNode
  if (phase === "scan") {
    status = (
      <>
        <b>Calculating</b>
        <span className="ssm-muted ssm-path" ref={pathRef} />
      </>
    )
  } else if (clearCat) {
    status = (
      <>
        <b>{clearCat.clear?.verb ?? "Clearing"}</b>
        <span className="ssm-muted ssm-path" ref={pathRef} />
      </>
    )
  } else if (hiCat) {
    status = (
      <>
        <Glyph name={hiCat.icon ?? "dot"} color={hiCat.color} />
        <b>{hiCat.label}</b>
        <span className="ssm-muted">{formatGB(sizes[hi])}</span>
        {hiCat.note ? <span className="ssm-muted">{hiCat.note}</span> : null}
      </>
    )
  } else if (freed > 0.05) {
    status = (
      <>
        {check}
        <b>Freed {formatGB(freed)}</b>
        <span className="ssm-muted">{formatGB(total - used)} available</span>
      </>
    )
  } else {
    status = <span className="ssm-faint">{formatGB(total - used)} available</span>
  }

  const spin = (cls?: string) => (
    <svg className={cls} width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
      <path d="M13.5 8A5.5 5.5 0 1 1 11.6 3.8M13.5 2.5v3.2h-3.2" />
    </svg>
  )

  let foot: ReactNode
  if (phase === "scan") {
    foot = (
      <div className="ssm-foot-msg" key="scan">
        {spin("ssm-spin")}
        <span>Looking for things you can clear</span>
      </div>
    )
  } else if (suggest >= 0 || clearCat) {
    const c = clearCat ?? categories[suggest]
    const i = clearCat ? clearing : suggest
    foot = (
      <>
        <div className="ssm-foot-msg" key={"s" + c.id}>
          <Glyph name={c.icon ?? "dot"} color={c.color} />
          <span>{(c.clear?.message ?? "").replace("{size}", formatGB(clearCat ? S.current.sizes[i] : sizes[i]))}</span>
        </div>
        <button
          type="button"
          className="ssm-btn"
          disabled={phase !== "idle"}
          onClick={() => startClear(i)}
          onMouseEnter={() => phase === "idle" && setHover(i)}
          onMouseLeave={() => setHover(-1)}
        >
          {c.clear?.action ?? "Clear"}
        </button>
      </>
    )
  } else {
    foot = (
      <div className="ssm-foot-msg" key="done">
        {check}
        <span>Nothing else is worth clearing right now.</span>
      </div>
    )
  }

  const summary = categories.map((c, i) => c.label + " " + formatGB(sizes[i])).join(", ")

  return (
    <div className={"ssm-stage" + (className ? " " + className : "")} style={{ height, ...style }}>
      <style>{CSS}</style>
      <section className="ssm-card" aria-label="Storage">
        <div className="ssm-head">
          <div style={{ minWidth: 0 }}>
            <p className="ssm-total">
              <span className="ssm-used" ref={usedRef}>
                {formatGB(phase === "scan" ? 0 : used)}
              </span>
              <span className="ssm-of">of {total} GB used</span>
            </p>
            <div className="ssm-status" aria-live="polite">
              {status}
            </div>
          </div>
          <button type="button" className="ssm-btn ssm-btn-ghost" disabled={phase !== "idle"} onClick={() => setRunId((r) => r + 1)}>
            {spin()}
            Rescan
          </button>
        </div>

        <div className="ssm-bar" ref={barRef} onPointerMove={onBarMove} onPointerLeave={onBarLeave} onPointerDown={onBarTap}>
          <canvas className="ssm-canvas" ref={canvasRef} role="img" aria-label={"Disk usage: " + summary} />
        </div>

        <ul className="ssm-legend">
          {categories.map((c, i) => (
            <li key={c.id}>
              <button
                type="button"
                className="ssm-item"
                data-on={hi === i ? "1" : "0"}
                data-dim={hi >= 0 && hi !== i ? "1" : "0"}
                aria-pressed={pinned === i}
                onMouseEnter={() => phase === "idle" && setHover(i)}
                onMouseLeave={() => setHover(-1)}
                onFocus={() => phase === "idle" && setHover(i)}
                onBlur={() => setHover(-1)}
                onClick={() => phase === "idle" && setPinned((p) => (p === i ? -1 : i))}
              >
                <Glyph name={c.icon ?? "dot"} color={c.color} />
                <span className="ssm-item-label">{c.label}</span>
                <span
                  className="ssm-item-size"
                  ref={(el) => {
                    sizeRefs.current[i] = el
                  }}
                >
                  {formatGB(phase === "scan" ? 0 : sizes[i])}
                </span>
              </button>
            </li>
          ))}
        </ul>

        <div className="ssm-foot">{foot}</div>
        <p className="ssm-sr">{summary}</p>
      </section>
    </div>
  )
}
