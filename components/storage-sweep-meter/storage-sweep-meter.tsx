"use client"

import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type PointerEvent as ReactPointerEvent } from "react"

/* Storage Sweep Meter — a disk-usage card whose bar is an LED dot matrix.
   A scan fills the bar left to right behind a white-hot front, a 3 x 3 legend
   isolates one category on hover, and "Clear" sweeps a segment away: its lit
   cells lift off as pixels, the segment folds shut and everything to its right
   slides over while the counter ticks down. One canvas, no dependencies. */

export type StorageIcon = "apps" | "film" | "gear" | "code" | "doc" | "box" | "photo" | "music" | "trash" | "dot"

export type StorageCategory = {
  id: string
  label: string
  /** Size in GB. */
  size: number
  /** Any hex colour, "#rrggbb". */
  color: string
  icon?: StorageIcon
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

export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
// #endregion

const DEFAULT_CATEGORIES: StorageCategory[] = [
  { id: "apps", label: "Apps", size: 52.6, color: "#22c3e6", icon: "apps", note: "214 apps. Three of them haven't opened since spring." },
  { id: "movies", label: "Movies", size: 44.1, color: "#9b6cf6", icon: "film", note: "Screen recordings take 24.6 GB, most from this autumn." },
  { id: "system", label: "System data", size: 34.2, color: "#a3acb9", icon: "gear", note: "Managed by the system. It shrinks on its own." },
  { id: "developer", label: "Developer", size: 36.3, color: "#34d399", icon: "code", note: "Toolchains, simulators and 41 dependency folders." },
  { id: "documents", label: "Documents", size: 41.7, color: "#3b82f6", icon: "doc", note: "Mostly exports and an old project archive." },
  {
    id: "caches",
    label: "Caches",
    size: 46.3,
    color: "#f59e0b",
    icon: "box",
    note: "Temporary files apps keep to start faster.",
    clear: {
      keep: 1.2,
      message: "Caches are using {size}. Apps rebuild them when they need them.",
      action: "Clear caches",
      verb: "Clearing caches",
      paths: ["~/Library/Caches/thumbnails", "~/Library/Caches/browser/cache2", "~/.cache/pip/wheels", "~/Library/Caches/editor/CachedData", "~/Library/Caches/maps/tiles", "~/.npm/_cacache/content-v2", "~/Library/Caches/fonts", "~/Library/Caches/photos/derivatives"],
    },
  },
  { id: "photos", label: "Photos", size: 58.6, color: "#ec4899", icon: "photo", note: "18,402 photos. 2.3 GB of them are near-duplicates." },
  { id: "music", label: "Music", size: 12.6, color: "#facc15", icon: "music", note: "Downloaded albums, mostly from one long summer." },
  {
    id: "trash",
    label: "Trash",
    size: 31.4,
    color: "#ef4444",
    icon: "trash",
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
const P = 6 // cell pitch
const ROWS = 12
const PAD = 5 // track padding
const OX = 16 // canvas overhang left / right
const OY = 104 // canvas overhang above (pixels rise into it)
const OB = 16 // overhang below
const BAR_H = ROWS * P + PAD * 2

const ICONS: Record<StorageIcon, string> = {
  apps: "M3 3h4v4H3zM9 3h4v4H9zM3 9h4v4H3zM9 9h4v4H9z",
  film: "M2.5 3.5h11v9h-11zM5 3.5v9M11 3.5v9M2.5 6.5H5M2.5 9.5H5M11 6.5h2.5M11 9.5h2.5",
  gear: "M8 5.6a2.4 2.4 0 1 0 0 4.8a2.4 2.4 0 1 0 0-4.8M8 1.8v2M8 12.2v2M1.8 8h2M12.2 8h2M3.6 3.6l1.4 1.4M11 11l1.4 1.4M3.6 12.4L5 11M11 5l1.4-1.4",
  code: "M5.5 4.5L2 8l3.5 3.5M10.5 4.5L14 8l-3.5 3.5M9 3l-2 10",
  doc: "M4 2h5l3 3v9H4zM9 2v3h3M6 8.5h4M6 11h4",
  box: "M2.5 5L8 2.5L13.5 5v6L8 13.5L2.5 11zM2.5 5L8 7.5L13.5 5M8 7.5v6",
  photo: "M2.5 3.5h11v9h-11zM2.5 10.5l3-3l3 3l2-2l3 3M10.5 6.2a.7.7 0 1 0 0 .1",
  music: "M6 12V3.5l7-1.5V10.5M6 12a1.8 1.8 0 1 1-3.6 0a1.8 1.8 0 1 1 3.6 0M13 10.5a1.8 1.8 0 1 1-3.6 0a1.8 1.8 0 1 1 3.6 0",
  trash: "M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 9h5.8l.6-9M7 7v4.5M9 7v4.5",
  dot: "M8 5a3 3 0 1 0 0 6a3 3 0 1 0 0-6",
}

function Glyph({ name, color, size = 14 }: { name: StorageIcon; color: string; size?: number }) {
  return (
    <svg className="ssm-glyph" width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICONS[name] || ICONS.dot} />
    </svg>
  )
}

const CSS =
  ".ssm-stage{position:relative;display:grid;place-items:center;width:100%;overflow:hidden;background:var(--color-background);color:var(--color-foreground);padding:24px 16px;box-sizing:border-box;font-variant-numeric:tabular-nums;-webkit-font-smoothing:antialiased}" +
  ".ssm-card{position:relative;width:100%;max-width:620px;box-sizing:border-box;border-radius:18px;background:linear-gradient(180deg,#19191c,#121214);color:#ececee;padding:22px 22px 0;border:1px solid color-mix(in oklab,var(--color-foreground) 10%,rgba(255,255,255,.07));box-shadow:0 1px 0 rgba(255,255,255,.06) inset,0 30px 60px -28px rgba(0,0,0,.55),0 10px 24px -14px rgba(0,0,0,.4)}" +
  ".ssm-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;position:relative;z-index:2}" +
  ".ssm-total{display:flex;align-items:baseline;gap:8px;margin:0;line-height:1}" +
  ".ssm-used{font-size:26px;font-weight:600;letter-spacing:-.02em;color:#f4f4f5}" +
  ".ssm-of{font-size:12px;color:#8b8b92}" +
  ".ssm-status{display:flex;align-items:center;gap:8px;margin-top:9px;min-height:18px;font-size:12px;color:#c9c9ce;white-space:nowrap;overflow:hidden}" +
  ".ssm-status b{font-weight:500;color:#ececee;flex:none}" +
  ".ssm-status .ssm-glyph{flex:none}" +
  ".ssm-muted{color:#7d7d85;overflow:hidden;text-overflow:ellipsis;min-width:0}" +
  ".ssm-path{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:11px}" +
  ".ssm-check{flex:none;color:#4ade80}" +
  ".ssm-btn{appearance:none;display:inline-flex;align-items:center;gap:6px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.04);color:#c9c9ce;font:inherit;font-size:12px;line-height:1;padding:7px 10px;border-radius:9px;cursor:pointer;transition:background .2s,color .2s,transform .15s,opacity .2s;flex:none}" +
  ".ssm-btn:hover{background:rgba(255,255,255,.08);color:#f4f4f5}" +
  ".ssm-btn:active{transform:translateY(1px)}" +
  ".ssm-btn:disabled{opacity:.4;cursor:default;transform:none}" +
  ".ssm-btn:focus-visible,.ssm-item:focus-visible{outline:2px solid rgba(255,255,255,.5);outline-offset:2px}" +
  ".ssm-btn-ghost{border-color:transparent;background:transparent;color:#8b8b92}" +
  ".ssm-btn svg{flex:none}" +
  ".ssm-spin{animation:ssm-spin 1s linear infinite}" +
  "@keyframes ssm-spin{to{transform:rotate(360deg)}}" +
  ".ssm-bar{position:relative;height:" + BAR_H + "px;margin:18px 0 16px;touch-action:pan-y}" +
  ".ssm-canvas{position:absolute;left:-" + OX + "px;top:-" + OY + "px;pointer-events:none;display:block;max-width:none}" +
  ".ssm-legend{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));grid-auto-flow:column;grid-template-rows:repeat(3,auto);gap:2px 14px;margin:0 -8px;padding:0;list-style:none}" +
  ".ssm-item{appearance:none;width:100%;display:flex;align-items:center;gap:8px;border:0;background:transparent;color:#c9c9ce;font:inherit;font-size:12px;text-align:left;padding:6px 8px;border-radius:8px;cursor:pointer;transition:background .2s,color .2s,opacity .25s}" +
  ".ssm-item:hover,.ssm-item[data-on='1']{background:rgba(255,255,255,.05);color:#f4f4f5}" +
  ".ssm-item[data-dim='1']{opacity:.45}" +
  ".ssm-item-label{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}" +
  ".ssm-item-size{flex:none;color:#7d7d85;font-size:11px}" +
  ".ssm-foot{display:flex;align-items:center;gap:10px;margin:14px -22px 0;padding:12px 14px 12px 22px;border-top:1px solid rgba(255,255,255,.06);min-height:58px;box-sizing:border-box;font-size:12px;color:#a1a1a8}" +
  ".ssm-foot-msg{flex:1 1 auto;min-width:0;display:flex;align-items:center;gap:8px;animation:ssm-in .45s cubic-bezier(.2,.8,.2,1)}" +
  ".ssm-foot-msg span{min-width:0}" +
  "@keyframes ssm-in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}" +
  ".ssm-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}" +
  "@media (max-width:520px){.ssm-card{padding:18px 16px 0}.ssm-legend{grid-template-columns:repeat(2,minmax(0,1fr));grid-auto-flow:row;grid-template-rows:none}.ssm-foot{margin:14px -16px 0;padding:12px 12px 12px 16px;flex-wrap:wrap}.ssm-used{font-size:22px}}" +
  "@media (prefers-reduced-motion:reduce){.ssm-spin,.ssm-foot-msg{animation:none}.ssm-btn,.ssm-item{transition:none}}"

type Phase = "scan" | "idle" | "clear"

type Seg = {
  cat: StorageCategory
  rgb: [number, number, number]
  x: number // columns, animated
  w: number // columns, animated
  target: number
  lit: Float32Array // per cell intensity, 0 = unlit
  keep: Uint8Array // lit cells that survive a clear
  phase: Float32Array
  swept: number // local columns already swept
}

type Particle = { x: number; y: number; vx: number; vy: number; age: number; life: number; s: number; r: number; g: number; b: number }

type Clearing = { idx: number; t: number; from: number; to: number; w0: number; w1: number; d1: number; d2: number; lastCol: number }

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
    scanDur: 3.4,
    sizes: categories.map((c) => c.size),
    disp: categories.map(() => 0),
    hi: -1,
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
  const catKey = categories.map((c) => c.id + ":" + c.size + c.color).join("|")

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catKey, orderKey, total, runId])

  useEffect(() => {
    const bar = barRef.current
    const canvas = canvasRef.current
    if (!bar || !canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
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
      canvas.width = Math.round(cssW * dpr)
      canvas.height = Math.round(cssH * dpr)
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
      const cols = Math.max(12, Math.floor((s.width - PAD * 2) / P))
      s.cols = cols
      const idx = barIdxRef.current
      const cats = catsRef.current
      const alloc = allocateColumns(idx.map((i) => s.sizes[i]), totalRef.current, cols)
      const prev = s.segs
      s.segs = idx.map((ci, k) => {
        const cat = cats[ci]
        const rnd = mulberry32(0x9e37 + ci * 7919 + cat.id.length * 131)
        const n = cols * ROWS
        const lit = new Float32Array(n)
        const keep = new Uint8Array(n)
        const ph = new Float32Array(n)
        const dens = 0.24 + rnd() * 0.16
        const keepRatio = cat.clear ? Math.max(0, Math.min(1, cat.clear.keep / Math.max(0.01, cat.size))) : 1
        for (let c = 0; c < cols; c++) {
          for (let r = 0; r < ROWS; r++) {
            const i = c * ROWS + r
            const p = r === ROWS - 1 ? 0.7 : r === 0 ? dens * 0.6 : dens
            lit[i] = rnd() < p ? 0.5 + rnd() * 0.5 : 0
            keep[i] = rnd() < keepRatio ? 1 : 0
            ph[i] = rnd() * 6.283
          }
        }
        const old = prev[k]
        return { cat, rgb: hexRgb(cat.color), x: 0, w: alloc[k], target: alloc[k], lit, keep, phase: ph, swept: old && old.cat.id === cat.id ? Math.min(old.swept, alloc[k]) : 0 }
      })
      let x = 0
      for (const g of s.segs) {
        g.x = x
        x += g.w
      }
      s.rebuild = false
    }

    const spawn = (x: number, y: number, rgb: [number, number, number], strong: boolean) => {
      if (s.particles.length > 2200) return
      const life = strong ? 1 + Math.random() * 1.2 : 0.5 + Math.random() * 0.6
      s.particles.push({
        x: x + (Math.random() - 0.5) * P * 0.6,
        y: y + (Math.random() - 0.5) * P * 0.6,
        vx: (Math.random() - 0.5) * (strong ? 40 : 18),
        vy: -(strong ? 30 + Math.random() * 90 : 20 + Math.random() * 46),
        age: 0,
        life,
        s: strong ? P * (0.4 + Math.random() * 0.3) : P * 0.35,
        r: rgb[0],
        g: rgb[1],
        b: rgb[2],
      })
    }

    const rr = (x: number, y: number, w: number, h: number, r: number) => {
      const q = Math.min(r, w / 2, h / 2)
      ctx.beginPath()
      ctx.moveTo(x + q, y)
      ctx.arcTo(x + w, y, x + w, y + h, q)
      ctx.arcTo(x + w, y + h, x, y + h, q)
      ctx.arcTo(x, y + h, x, y, q)
      ctx.arcTo(x, y, x + w, y, q)
      ctx.closePath()
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
      const tot = totalRef.current

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
          // embers kicked up at the scan front
          for (let k = 0; k < 3; k++) {
            if (Math.random() < 0.6) {
              const seg = s.segs.find((g) => front >= g.x && front < g.x + g.w)
              spawn(OX + PAD + front * P, OY + PAD + Math.random() * ROWS * P, seg ? seg.rgb : [255, 255, 255], false)
            }
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

      const cl = s.clear
      if (cl) {
        cl.t += reduced ? 99 : dt
        const g = s.segs.find((q) => cats.indexOf(q.cat) === cl.idx)
        if (g) {
          const sweepP = Math.min(1, cl.t / cl.d1)
          const sweepCol = easeInOut(sweepP) * cl.w0
          // dissolve every column the front crossed this frame
          const upto = Math.min(Math.floor(sweepCol), Math.ceil(cl.w0))
          for (let c = cl.lastCol; c < upto; c++) {
            if (!reduced) {
              for (let r = 0; r < ROWS; r++) {
                const i = c * ROWS + r
                const cx = OX + PAD + (g.x + c + 0.5) * P
                const cy = OY + PAD + (r + 0.5) * P
                if (g.lit[i] > 0 && !g.keep[i]) {
                  spawn(cx, cy, g.rgb, true)
                  spawn(cx, cy, g.rgb, true)
                } else if (Math.random() < 0.3) spawn(cx, cy, g.rgb, false)
              }
            }
          }
          cl.lastCol = Math.max(cl.lastCol, upto)
          g.swept = Math.max(g.swept, sweepCol)
          const shrinkP = Math.max(0, Math.min(1, (cl.t - cl.d1) / cl.d2))
          g.w = cl.w0 + (cl.w1 - cl.w0) * easeOut(shrinkP)
          s.disp[cl.idx] = cl.from + (cl.to - cl.from) * easeInOut(Math.min(1, cl.t / (cl.d1 + cl.d2)))
          let x = 0
          for (const q of s.segs) {
            q.x = x
            x += q.w
          }
          if (shrinkP >= 1) {
            g.w = cl.w1
            g.target = cl.w1
            s.sizes[cl.idx] = cl.to
            s.disp[cl.idx] = cl.to
            s.clear = null
            s.phase = "idle"
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

      // ---- draw ----
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, cssW, cssH)
      const gx = OX + PAD + (s.width - PAD * 2 - s.cols * P) / 2
      const gy = OY + PAD
      const pointer = s.fine && s.px > -900
      const near = (cx: number, cy: number) => {
        if (!pointer) return 0
        const d = Math.hypot(cx - s.px, cy - s.py)
        return d < 36 ? 1 - d / 36 : 0
      }

      // track
      rr(OX + 0.5, OY + 0.5, s.width - 1, BAR_H - 1, 7)
      ctx.fillStyle = "rgba(255,255,255,0.018)"
      ctx.fill()
      ctx.strokeStyle = "rgba(255,255,255,0.06)"
      ctx.lineWidth = 1
      ctx.stroke()
      const usedEnd = Math.min(front, usedCols)
      for (let c = 0; c < s.cols; c++) {
        if (c < usedEnd - 0.5) continue
        for (let r = 0; r < ROWS; r++) {
          const cx = gx + (c + 0.5) * P
          const cy = gy + (r + 0.5) * P
          const k = near(cx, cy)
          ctx.fillStyle = "rgba(255,255,255," + (0.07 + k * 0.3).toFixed(3) + ")"
          const d = 1.2 + k * 1.2
          ctx.fillRect(cx - d / 2, cy - d / 2, d, d)
        }
      }

      // segments
      const hiIdx = s.hi
      for (const g of s.segs) {
        const ci = cats.indexOf(g.cat)
        const vis = Math.min(g.w, front - g.x)
        if (vis <= 0.02) continue
        const [R, G, B] = g.rgb
        const col = R + "," + G + "," + B
        const isHi = hiIdx === ci
        const m = hiIdx < 0 ? 1 : isHi ? 1 : 0.24
        const x0 = gx + g.x * P
        const wPx = vis * P
        const y0 = gy - 2.5
        const hPx = ROWS * P + 5
        ctx.save()
        rr(x0 + 0.75, y0, Math.max(1.5, wPx - 1.5), hPx, 4)
        ctx.fillStyle = "rgba(" + col + "," + ((isHi ? 0.17 : 0.1) * m).toFixed(3) + ")"
        ctx.fill()
        ctx.clip()
        const cEnd = Math.ceil(vis)
        const sweeping = s.clear && s.clear.idx === ci && s.clear.t < s.clear.d1 ? g.swept : -1
        for (let c = 0; c < cEnd; c++) {
          const post = c < g.swept
          for (let r = 0; r < ROWS; r++) {
            const i = c * ROWS + r
            const cx = x0 + (c + 0.5) * P
            const cy = gy + (r + 0.5) * P
            const k = near(cx, cy)
            let a = g.lit[i]
            if (post && !g.keep[i]) a = 0
            if (a > 0) {
              const tw = reduced ? 1 : 0.8 + 0.2 * Math.sin(time * 1.6 + g.phase[i])
              const al = Math.min(1, (a * tw + k * 0.4) * m)
              // fresh cells right behind the scan front burn white
              const heat = front < Infinity ? Math.max(0, 1 - (front - (g.x + c)) / 2.2) : sweeping >= 0 && c >= sweeping - 0.5 ? Math.max(0, 1 - (c - sweeping) / 2.5) : 0
              const s2 = P * 0.62 + k * 1.2
              ctx.fillStyle = heat > 0 ? "rgba(" + Math.round(R + (255 - R) * heat) + "," + Math.round(G + (255 - G) * heat) + "," + Math.round(B + (255 - B) * heat) + "," + Math.min(1, al + heat * 0.5).toFixed(3) + ")" : "rgba(" + col + "," + al.toFixed(3) + ")"
              ctx.fillRect(cx - s2 / 2, cy - s2 / 2, s2, s2)
            } else {
              const d = 1.3 + k * 1.2
              ctx.fillStyle = "rgba(" + col + "," + ((0.32 + k * 0.4) * m).toFixed(3) + ")"
              ctx.fillRect(cx - d / 2, cy - d / 2, d, d)
            }
          }
        }
        ctx.restore()
        // glowing rim
        ctx.save()
        rr(x0 + 0.75, y0, Math.max(1.5, wPx - 1.5), hPx, 4)
        ctx.shadowColor = "rgba(" + col + "," + (0.9 * m).toFixed(3) + ")"
        ctx.shadowBlur = isHi ? 16 : 10
        ctx.strokeStyle = "rgba(" + col + "," + ((isHi ? 1 : 0.85) * m).toFixed(3) + ")"
        ctx.lineWidth = isHi ? 1.6 : 1.25
        ctx.stroke()
        ctx.restore()
      }

      // white-hot fronts: the scan, and the sweep
      const drawFront = (xPx: number, strength: number) => {
        const top = gy - 8
        const h = ROWS * P + 16
        ctx.save()
        ctx.globalCompositeOperation = "lighter"
        const grad = ctx.createLinearGradient(xPx - 18, 0, xPx + 6, 0)
        grad.addColorStop(0, "rgba(255,255,255,0)")
        grad.addColorStop(0.8, "rgba(255,246,230," + (0.22 * strength).toFixed(3) + ")")
        grad.addColorStop(1, "rgba(255,255,255,0)")
        ctx.fillStyle = grad
        ctx.fillRect(xPx - 18, top, 24, h)
        ctx.shadowColor = "rgba(255,255,255,0.95)"
        ctx.shadowBlur = 14
        ctx.fillStyle = "rgba(255,255,255," + (0.95 * strength).toFixed(3) + ")"
        ctx.fillRect(xPx - 1, top + 4, 2, h - 8)
        ctx.restore()
      }
      if (front < Infinity && !reduced) drawFront(gx + front * P, Math.min(1, s.scanT * 3))
      if (s.clear && !reduced) {
        const g = s.segs.find((q) => cats.indexOf(q.cat) === s.clear!.idx)
        if (g && s.clear.t < s.clear.d1 + 0.12) {
          const fade = s.clear.t > s.clear.d1 ? 1 - (s.clear.t - s.clear.d1) / 0.12 : 1
          drawFront(gx + (g.x + Math.min(g.swept, g.w)) * P, fade)
        }
      }

      // pixels in flight
      if (s.particles.length) {
        ctx.save()
        ctx.globalCompositeOperation = "lighter"
        const out: Particle[] = []
        for (const q of s.particles) {
          q.age += dt
          if (q.age >= q.life) continue
          q.vy -= 14 * dt
          q.vx *= 1 - 0.6 * dt
          q.x += q.vx * dt + Math.sin((q.age + q.x) * 6) * 0.15
          q.y += q.vy * dt
          const t = q.age / q.life
          const hot = Math.max(0, 1 - t * 3)
          const a = (1 - t) * (1 - t) * Math.max(0, Math.min(1, q.y / 44))
          ctx.fillStyle = "rgba(" + Math.round(q.r + (255 - q.r) * hot) + "," + Math.round(q.g + (255 - q.g) * hot) + "," + Math.round(q.b + (255 - q.b) * hot) + "," + a.toFixed(3) + ")"
          const sz = q.s * (1 - t * 0.4)
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
    const d1 = Math.max(1.3, Math.min(2.4, 0.8 + seg.w * 0.08))
    s.clear = { idx, t: 0, from: s.sizes[idx], to, w0: seg.w, w1, d1, d2: 0.7, lastCol: Math.floor(seg.swept) }
    s.phase = "clear"
    setPinned(-1)
    setHover(-1)
    setClearing(idx)
    setPhase("clear")
  }

  const onBarMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const s = S.current
    if (!s.fine || e.pointerType !== "mouse") return
    s.px = e.nativeEvent.offsetX + OX
    s.py = e.nativeEvent.offsetY + OY
    const col = (s.px - OX - PAD - (s.width - PAD * 2 - s.cols * P) / 2) / P
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
    const col = (e.nativeEvent.offsetX - PAD - (s.width - PAD * 2 - s.cols * P) / 2) / P
    const g = s.segs.find((q) => col >= q.x && col < q.x + q.w)
    const ci = g ? categories.findIndex((c) => c.id === g.cat.id) : -1
    setPinned((p) => (p === ci ? -1 : ci))
  }

  const used = sizes.reduce((a, b) => a + b, 0)
  const suggest = nextClearable(categories.map((c, i) => ({ size: sizes[i], clear: c.clear })))
  const hiCat = hi >= 0 && phase === "idle" ? categories[hi] : null
  const clearCat = clearing >= 0 ? categories[clearing] : null

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
        <svg className="ssm-check" width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 8.5l3.2 3L13 4.5" />
        </svg>
        <b>Freed {formatGB(freed)}</b>
        <span className="ssm-muted">{formatGB(total - used)} available</span>
      </>
    )
  } else {
    status = (
      <>
        <b>{formatGB(total - used)} available</b>
        <span className="ssm-muted">Scanned just now</span>
      </>
    )
  }

  const spin = (cls?: string) => (
    <svg className={cls} width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
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
        <button type="button" className="ssm-btn" disabled={phase !== "idle"} onClick={() => startClear(i)}>
          {c.clear?.action ?? "Clear"}
        </button>
      </>
    )
  } else {
    foot = (
      <div className="ssm-foot-msg" key="done">
        <svg className="ssm-check" width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 8.5l3.2 3L13 4.5" />
        </svg>
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
