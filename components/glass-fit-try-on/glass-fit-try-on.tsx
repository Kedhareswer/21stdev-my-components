"use client"

import * as React from "react"

/* Glass Fit Try-On: a ring of frosted product cards orbits a model. Pick a garment
   (click, drag, swipe, arrow keys) and a scan line sweeps down the figure, dressing
   him in it. Colour swatches recolour the garment on the model, the card and the
   thumbnail; sizes and add-to-bag report back through callbacks. */

export type FitColor = { name: string; hex: string }

export type FitItem = {
  id: string
  name: string
  price: string
  /** Full figure wearing the garment, transparent PNG/WebP. Every look must share one framing. */
  look: string
  /** Same size as the look: opaque where the garment is, used to tint it. */
  mask: string
  /** Garment cut-out for the card and thumbnail, transparent background. */
  garment: string
  /** First entry is the garment as photographed; use "#ffffff" for it so the tint is a no-op. */
  colors?: FitColor[]
  sizes?: string[]
}

export type FitSelection = { item: FitItem; size: string; color: FitColor }

export type GlassFitTryOnProps = {
  items?: FitItem[]
  /** Room photo behind the scene. */
  backdrop?: string
  /** Ghost word behind the model. */
  wordmark?: string
  eyebrow?: string
  addLabel?: string
  addedLabel?: string
  initialIndex?: number
  /** Text on glass. */
  ink?: string
  /** Glass fill. */
  glass?: string
  /** Primary button and active chips. */
  accent?: string
  /** Text on the accent. */
  accentInk?: string
  /** Scan line glow. */
  scanColor?: string
  /** Shown while the backdrop loads. */
  background?: string
  height?: string
  className?: string
  onChange?: (selection: FitSelection) => void
  onAddToBag?: (selection: FitSelection) => void
}

const SITE = "https://kedhar-components.pages.dev/glass-fit-try-on/"
const SIZES = ["S", "M", "L", "XL"]

const DEFAULT_ITEMS: FitItem[] = [
  {
    id: "crew-tee", name: "Crew Tee", price: "$38",
    look: SITE + "look-1.webp", mask: SITE + "mask-1.webp", garment: SITE + "garment-1.webp",
    colors: [{ name: "White", hex: "#ffffff" }, { name: "Sand", hex: "#dcc8a6" }, { name: "Sage", hex: "#a7b59a" }, { name: "Navy", hex: "#2f3d5e" }],
  },
  {
    id: "oxford-shirt", name: "Oxford Shirt", price: "$84",
    look: SITE + "look-2.webp", mask: SITE + "mask-2.webp", garment: SITE + "garment-2.webp",
    colors: [{ name: "White", hex: "#ffffff" }, { name: "Sky", hex: "#b7cbe2" }, { name: "Blush", hex: "#e6c1bb" }, { name: "Olive", hex: "#8c8c62" }],
  },
  {
    id: "knit-polo", name: "Knit Polo", price: "$72",
    look: SITE + "look-3.webp", mask: SITE + "mask-3.webp", garment: SITE + "garment-3.webp",
    colors: [{ name: "Ecru", hex: "#ffffff" }, { name: "Rust", hex: "#c0774c" }, { name: "Forest", hex: "#4a6650" }, { name: "Ink", hex: "#30343f" }],
  },
  {
    id: "crew-sweat", name: "Crew Sweatshirt", price: "$96",
    look: SITE + "look-4.webp", mask: SITE + "mask-4.webp", garment: SITE + "garment-4.webp",
    colors: [{ name: "Oat", hex: "#ffffff" }, { name: "Heather", hex: "#b9b6b1" }, { name: "Clay", hex: "#c99a83" }, { name: "Charcoal", hex: "#45464b" }],
  },
  {
    id: "zip-hoodie", name: "Zip Hoodie", price: "$118",
    look: SITE + "look-5.webp", mask: SITE + "mask-5.webp", garment: SITE + "garment-5.webp",
    colors: [{ name: "Chalk", hex: "#ffffff" }, { name: "Stone", hex: "#cbbfa9" }, { name: "Moss", hex: "#7e8a63" }, { name: "Black", hex: "#2a2a2d" }],
  },
]

// #region geometry
/** Native size of every look image. */
export const LOOK_W = 330
export const LOOK_H = 952
/** Widest half of the figure (sleeves) and the half at the legs, as fractions of the look width. */
const HALF_TORSO = 0.46
const HALF_LEGS = 0.34

export type Layout = {
  w: number; h: number; compact: boolean; g: number
  barH: number; barTop: number
  panelH: number; panelTop: number; panelW: number
  mh: number; mw: number; mTop: number; mLeft: number
  cw: number; ch: number; cy: number; x1: number
  wordSize: number; wordTop: number
}

export function layoutFor(w: number, h: number): Layout {
  const compact = w < 700
  const g = compact ? 16 : Math.round(Math.min(40, Math.max(20, w * 0.025)))
  const barH = compact ? 44 : 48
  const barTop = g
  const barBottom = barTop + barH
  const panelH = compact ? 164 : 104
  const panelTop = h - g - panelH
  let cw = compact ? 92 : Math.round(Math.min(196, Math.max(132, w * 0.125)))
  let mh: number
  let mTop: number
  if (compact) {
    const room = w / 2 - g - cw - 12
    const bottom = panelTop - 12
    mh = Math.min(bottom - barBottom - 16, (room / HALF_TORSO) * (LOOK_H / LOOK_W))
    mTop = bottom - mh
  } else {
    mh = Math.min(h * 0.8, h - barBottom - 90)
    mTop = h - mh
  }
  let mw = (mh * LOOK_W) / LOOK_H
  // cards: centred in the space between the sleeve and the gutter, never touching either
  const inner = () => HALF_TORSO * mw + cw / 2 + (compact ? 10 : 28)
  const outer = () => w / 2 - g - cw / 2
  while (!compact && inner() > outer() && cw > 112) cw -= 4
  while (inner() > outer() && mh > 200) { mh -= 8; mw = (mh * LOOK_W) / LOOK_H; if (!compact) mTop = h - mh }
  const x1 = compact ? outer() : (inner() + outer()) / 2
  const ch = Math.round(cw * 1.32)
  const lo = barBottom + 16 + ch / 2
  const hi = (compact ? h : panelTop) - 16 - ch / 2
  const cy = Math.max(lo, Math.min(hi, mTop + mh * (compact ? 0.4 : 0.36)))
  // bottom panels flank the legs; wider half where the hands still reach the panel rows
  const reach = (panelTop - mTop) / mh > 0.74 ? HALF_LEGS : HALF_TORSO
  const panelW = compact ? w - g * 2 : Math.round(Math.min(380, w / 2 - g - reach * mw - 18))
  // the ghost word sits above the head; the hair overlaps only its lower edge
  const wordTop = barBottom + (compact ? 6 : 8)
  // too little room above the head (short phones, small embeds): the head would swallow the word, so drop it
  const wordRoom = mTop + mh * 0.1 - wordTop
  const wordSize = wordRoom < 56 ? 0 : Math.round(Math.min(w * (compact ? 0.3 : 0.26), wordRoom / 0.8))
  return {
    w, h, compact, g, barH, barTop, panelH, panelTop, panelW,
    mh, mw, mTop, mLeft: (w - mw) / 2, cw, ch, cy, x1,
    wordSize, wordTop,
  }
}

/** Wraps a card offset into [-n/2, n/2). */
export function wrapOffset(o: number, n: number) {
  return ((((o + n / 2) % n) + n) % n) - n / 2
}

/** Where a card sits on the ring for a fractional offset from the selected one. */
export function ringPose(o: number, n: number, x1: number) {
  const step = (Math.PI * 2) / Math.max(n, 3)
  const a = o * step
  const r = x1 / Math.sin(step)
  const z = Math.cos(a)
  const zSide = Math.cos(step)
  const zBack = Math.cos(step * 2)
  const t = Math.max(0, Math.min(1, (z - zBack) / (zSide - zBack || 1)))
  const s = 0.7 + 0.3 * t // scale never exceeds 1
  const worn = Math.max(0, Math.min(1, (Math.abs(o) - 0.18) / 0.5)) // the selected card fades as it is "put on"
  return {
    x: Math.sin(a) * r,
    z,
    s,
    opacity: worn * (0.5 + 0.5 * t),
    blur: (1 - t) * 2.2,
    label: Math.max(0, Math.min(1, (t - 0.55) / 0.35)) * worn,
    front: z > zSide - 0.2,
  }
}
// #endregion

const CSS =
  ".gft-root{position:relative;overflow:hidden;isolation:isolate;color:var(--gft-ink);font-family:inherit;-webkit-font-smoothing:antialiased;touch-action:pan-y;user-select:none;-webkit-user-select:none}" +
  ".gft-root img{max-width:none;display:block}" +
  ".gft-root button,.gft-root input{font:inherit;color:inherit}" +
  ".gft-room{position:absolute;inset:-3%;z-index:0;will-change:transform}" +
  ".gft-room img{width:100%;height:100%;object-fit:cover;filter:blur(3px) saturate(1.04)}" +
  ".gft-room:after{content:'';position:absolute;inset:0;background:radial-gradient(70% 60% at 50% 42%,rgba(255,252,246,.12),rgba(40,30,20,.18))}" +
  ".gft-word{position:absolute;left:0;right:0;z-index:1;display:flex;justify-content:center;pointer-events:none;font-weight:800;line-height:.8;letter-spacing:.02em;color:rgba(255,255,255,.3);-webkit-text-stroke:1px rgba(255,255,255,.5);text-shadow:0 1px 0 rgba(255,255,255,.3);white-space:nowrap}" +
  ".gft-word span{display:inline-block;will-change:transform}" +
  ".gft-glass{background:var(--gft-glass);backdrop-filter:blur(20px) saturate(1.45);-webkit-backdrop-filter:blur(20px) saturate(1.45);border:1px solid rgba(255,255,255,.55);box-shadow:inset 0 1px 0 rgba(255,255,255,.7),0 18px 44px -24px rgba(40,30,20,.5)}" +
  ".gft-arc{position:absolute;inset:0}" +
  ".gft-card{position:absolute;left:0;top:0;padding:0;border:0;background:none;cursor:pointer;will-change:transform,opacity;-webkit-tap-highlight-color:transparent}" +
  ".gft-card-in{position:absolute;inset:0;border-radius:20px;overflow:hidden;transition:transform .45s cubic-bezier(.2,.8,.2,1),box-shadow .45s}" +
  ".gft-card:hover .gft-card-in{transform:translateY(-5px)}" +
  ".gft-card:focus-visible{outline:none}" +
  ".gft-card:focus-visible .gft-card-in{box-shadow:0 0 0 2px var(--gft-accent),0 0 0 5px rgba(255,255,255,.7)}" +
  ".gft-card-art{position:absolute;left:9%;right:9%;top:6%;height:64%}" +
  ".gft-label{position:absolute;left:10%;right:10%;bottom:8%;text-align:left;line-height:1.2;opacity:var(--gft-label,1)}" +
  ".gft-label b{display:block;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
  ".gft-label i{display:block;font-style:normal;font-weight:700;margin-top:2px}" +
  ".gft-art{position:absolute;inset:0;isolation:isolate}" +
  ".gft-art img{width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 12px 12px rgba(40,30,20,.2))}" +
  ".gft-art .gft-tint{filter:none}" +
  ".gft-tint{position:absolute;inset:0;mix-blend-mode:multiply;transition:background-color .5s ease;-webkit-mask-size:100% 100%;mask-size:100% 100%;-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;-webkit-mask-position:center;mask-position:center;pointer-events:none}" +
  ".gft-art .gft-tint{-webkit-mask-size:contain;mask-size:contain}" +
  ".gft-model{position:absolute;z-index:10;pointer-events:none}" +
  ".gft-look{position:absolute;inset:0;isolation:isolate}" +
  ".gft-look img{width:100%;height:100%}" +
  ".gft-grid{position:absolute;inset:0;z-index:3;background:repeating-linear-gradient(0deg,transparent 0 5px,rgba(255,255,255,.5) 5px 6px);-webkit-mask-size:100% 100%;mask-size:100% 100%;mix-blend-mode:screen;clip-path:inset(0 0 100% 0)}" +
  ".gft-scan{position:absolute;left:-14%;width:128%;top:0;height:2px;z-index:4;opacity:0;background:linear-gradient(90deg,transparent,var(--gft-scan) 18%,var(--gft-scan) 82%,transparent);box-shadow:0 0 16px 3px var(--gft-scan),0 0 54px 8px rgba(190,225,255,.45)}" +
  ".gft-bar{position:absolute;z-index:30;display:flex;align-items:center;gap:10px;border-radius:999px}" +
  ".gft-eyebrow{padding:0 18px;font-size:13px;font-weight:500;white-space:nowrap}" +
  ".gft-eyebrow em{display:inline-block;width:7px;height:7px;border-radius:50%;background:#3fbf7f;margin-right:9px;box-shadow:0 0 0 3px rgba(63,191,127,.22);vertical-align:1px}" +
  ".gft-nav{padding:4px}" +
  ".gft-nav button{width:38px;height:38px;border-radius:50%;border:0;background:transparent;display:grid;place-items:center;cursor:pointer;transition:background .25s}" +
  ".gft-nav button:hover{background:rgba(255,255,255,.55)}" +
  ".gft-nav button:focus-visible{outline:2px solid var(--gft-accent);outline-offset:-2px}" +
  ".gft-root .gft-add:focus-visible{outline:2px solid var(--gft-accent);outline-offset:2px}" +
  ".gft-nav svg{width:16px;height:16px;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}" +
  ".gft-count{min-width:58px;text-align:center;font-size:13px;font-weight:600;font-variant-numeric:tabular-nums}" +
  ".gft-panel{position:absolute;z-index:30;border-radius:22px;display:flex;align-items:center;box-sizing:border-box}" +
  ".gft-thumb{flex:0 0 auto;border-radius:14px;background:rgba(255,255,255,.4);position:relative;overflow:hidden}" +
  ".gft-thumb .gft-art{inset:7px}" +
  ".gft-info{flex:1 1 auto;min-width:0}" +
  ".gft-roll{display:block;position:relative;overflow:hidden;height:1.25em;line-height:1.25}" +
  ".gft-roll span{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
  ".gft-roll .gft-out{position:absolute;left:0;right:0;top:0;animation:gft-out .32s cubic-bezier(.5,0,.75,0) both}" +
  ".gft-roll .gft-in{animation:gft-in .46s cubic-bezier(.2,.8,.2,1) .14s both}" +
  "@keyframes gft-out{to{transform:translateY(-110%);opacity:0}}" +
  "@keyframes gft-in{from{transform:translateY(110%);opacity:0}to{transform:none;opacity:1}}" +
  ".gft-name{font-size:16px;font-weight:600}" +
  ".gft-price{font-size:14px;font-weight:500;opacity:.78;margin-top:3px}" +
  ".gft-root .gft-add{flex:0 0 auto;height:44px;padding:0 20px;border:0;border-radius:999px;background:var(--gft-accent);color:var(--gft-accent-ink);font-size:14px;font-weight:600;cursor:pointer;white-space:nowrap;transition:transform .2s}" +
  ".gft-add:active{transform:scale(.97)}" +
  ".gft-add .gft-roll{height:1.25em}" +
  ".gft-opt{border:0;margin:0;padding:0;min-width:0}" +
  ".gft-opt legend{padding:0;font-size:12px;font-weight:500;opacity:.8;margin-bottom:8px;display:flex;gap:4px;width:100%;line-height:1.25;height:1.25em}" +
  ".gft-opt legend .gft-roll{display:block}" +
  ".gft-chips{display:flex;gap:6px;align-items:center}" +
  ".gft-chip{position:relative;display:block;cursor:pointer}" +
  ".gft-chip input{position:absolute;inset:0;opacity:0;margin:0;cursor:pointer}" +
  ".gft-size{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;font-size:11px;font-weight:600;background:rgba(255,255,255,.4);transition:background .25s,color .25s}" +
  ".gft-chip input:checked+.gft-size{background:var(--gft-accent);color:var(--gft-accent-ink)}" +
  ".gft-dot{display:block;width:24px;height:24px;border-radius:50%;margin:5px;border:1px solid rgba(0,0,0,.14);box-sizing:border-box;position:relative}" +
  ".gft-dot:after{content:'';position:absolute;inset:-5px;border-radius:50%;border:2px solid transparent;transition:border-color .25s}" +
  ".gft-chip input:checked+.gft-dot:after{border-color:var(--gft-accent)}" +
  ".gft-chip input:focus-visible+span{outline:2px solid var(--gft-accent);outline-offset:3px}" +
  ".gft-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}" +
  "@media (prefers-reduced-motion:reduce){.gft-card-in,.gft-tint,.gft-size,.gft-dot:after{transition:none}.gft-card:hover .gft-card-in{transform:none}.gft-roll .gft-out{display:none}.gft-roll .gft-in{animation:none}}"

// compact: the figure fades out above the panel instead of ending on a hard crop
const FADE: React.CSSProperties = {
  WebkitMaskImage: "linear-gradient(to bottom,#000 80%,transparent 99%)",
  maskImage: "linear-gradient(to bottom,#000 80%,transparent 99%)",
}

function mod(a: number, n: number) {
  return ((a % n) + n) % n
}

function Roll({ text }: { text: string }) {
  const [s, setS] = React.useState({ cur: text, prev: "", n: 0 })
  if (s.cur !== text) setS({ cur: text, prev: s.cur, n: s.n + 1 })
  return (
    <span className="gft-roll">
      {s.prev ? (
        <span key={"o" + s.n} className="gft-out" aria-hidden="true" onAnimationEnd={() => setS((p) => (p.n === s.n ? { ...p, prev: "" } : p))}>
          {s.prev}
        </span>
      ) : null}
      <span key={"i" + s.n} className={s.n ? "gft-in" : undefined}>{s.cur}</span>
    </span>
  )
}

function maskStyle(url: string, hex: string): React.CSSProperties {
  const m = "url(" + url + ")"
  return { backgroundColor: hex, WebkitMaskImage: m, maskImage: m }
}

function Art({ item, hex }: { item: FitItem; hex: string }) {
  return (
    <span className="gft-art">
      <img src={item.garment} alt="" width={400} height={400} draggable={false} style={{ maxWidth: "none" }} />
      <span className="gft-tint" style={maskStyle(item.garment, hex)} />
    </span>
  )
}

function Arrow({ dir }: { dir: 1 | -1 }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={dir < 0 ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} />
    </svg>
  )
}

export function GlassFitTryOn({
  items = DEFAULT_ITEMS,
  backdrop = SITE + "room.webp",
  wordmark = "FIT",
  eyebrow = "Virtual fitting room",
  addLabel = "Add to bag",
  addedLabel = "Added",
  initialIndex = 0,
  ink = "#1d1b18",
  glass = "rgba(255,255,255,0.34)",
  accent = "#1d1b18",
  accentInk = "#ffffff",
  scanColor = "#ffffff",
  background = "#e7e1d8",
  height = "100svh",
  className,
  onChange,
  onAddToBag,
}: GlassFitTryOnProps) {
  const n = items.length
  const uid = React.useId()
  const rootRef = React.useRef(null as HTMLDivElement | null)
  const roomRef = React.useRef(null as HTMLDivElement | null)
  const wordRef = React.useRef(null as HTMLDivElement | null)
  const cardRefs = React.useRef([] as (HTMLButtonElement | null)[])
  const incomingRef = React.useRef(null as HTMLDivElement | null)
  const lookRefs = React.useRef([] as (HTMLDivElement | null)[])
  const gridRef = React.useRef(null as HTMLDivElement | null)
  const scanRef = React.useRef(null as HTMLDivElement | null)

  const start = mod(Math.round(initialIndex), Math.max(n, 1))
  const [L, setL] = React.useState(null as Layout | null)
  const [sel, setSel] = React.useState(start)
  const [worn, setWorn] = React.useState(start)
  const [incoming, setIncoming] = React.useState(-1)
  const [colorOf, setColorOf] = React.useState({} as Record<string, number>)
  const [sizeOf, setSizeOf] = React.useState({} as Record<string, string>)
  const [added, setAdded] = React.useState(false)

  const m = React.useRef({
    pos: start, target: start, raf: 0, last: 0, sel: start,
    drag: null as null | { id: number; x: number; y: number; pos: number; lastX: number; lastT: number; v: number; moved: boolean; axis: "" | "x" | "y" },
    mx: 0, my: 0, px: 0, py: 0, reduced: false, L: null as Layout | null, wheel: 0, wheelT: 0, suppressClick: false,
  })

  const item = items[sel] || items[0]
  const colors = (it: FitItem) => (it.colors && it.colors.length ? it.colors : [{ name: "Natural", hex: "#ffffff" }])
  const colorFor = (it: FitItem) => colors(it)[Math.min(colorOf[it.id] || 0, colors(it).length - 1)]
  const sizes = item.sizes && item.sizes.length ? item.sizes : SIZES
  const size = sizeOf[item.id] || sizes[Math.min(1, sizes.length - 1)]
  const color = colorFor(item)

  // paint: card transforms, parallax. Writes styles directly, no React render per frame.
  const paint = React.useCallback(() => {
    const s = m.current
    const lay = s.L
    if (!lay) return
    for (let i = 0; i < n; i++) {
      const el = cardRefs.current[i]
      if (!el) continue
      const p = ringPose(wrapOffset(i - s.pos, n), n, lay.x1)
      const x = lay.w / 2 + p.x - lay.cw / 2
      const y = lay.cy - lay.ch / 2
      el.style.transform = "translate3d(" + x.toFixed(2) + "px," + y.toFixed(2) + "px,0) scale(" + p.s.toFixed(4) + ")"
      // phones: the far cards would only peek out behind the arms, so they stay hidden
      const op = lay.compact ? p.opacity * Math.max(0, Math.min(1, (p.s - 0.82) / 0.12)) : p.opacity
      el.style.opacity = op.toFixed(3)
      el.style.filter = p.blur > 0.05 ? "blur(" + p.blur.toFixed(2) + "px)" : ""
      el.style.zIndex = String(p.front ? 20 : 5 + Math.round(p.s * 4))
      el.style.pointerEvents = op > 0.4 ? "auto" : "none"
      el.tabIndex = op > 0.4 ? 0 : -1
      el.style.setProperty("--gft-label", p.label.toFixed(3))
    }
    if (roomRef.current) roomRef.current.style.transform = "translate3d(" + (-s.px * 14).toFixed(2) + "px," + (-s.py * 10).toFixed(2) + "px,0)"
    if (wordRef.current) {
      const kids = wordRef.current.children
      for (let i = 0; i < kids.length; i++) {
        const k = (i - (kids.length - 1) / 2) * 0.6 + 1
        ;(kids[i] as HTMLElement).style.transform = "translate3d(" + (s.px * 10 * k).toFixed(2) + "px," + (s.py * 6).toFixed(2) + "px,0)"
      }
    }
  }, [n])

  const tick = React.useCallback(
    (t: number) => {
      const s = m.current
      const dt = Math.min(64, s.last ? t - s.last : 16)
      s.last = t
      const goal = s.drag ? s.drag.pos : s.target
      if (s.reduced) s.pos = goal
      else s.pos += (goal - s.pos) * (1 - Math.exp(-dt / (s.drag ? 45 : 150)))
      s.px += (s.mx - s.px) * (1 - Math.exp(-dt / 240))
      s.py += (s.my - s.py) * (1 - Math.exp(-dt / 240))
      const r = mod(Math.round(s.drag ? s.drag.pos : s.target), n)
      if (r !== s.sel) {
        s.sel = r
        setSel(r)
      }
      paint()
      const moving = Math.abs(goal - s.pos) > 0.0008 || Math.abs(s.mx - s.px) > 0.002 || Math.abs(s.my - s.py) > 0.002
      if (moving || s.drag) s.raf = requestAnimationFrame(tick)
      else {
        s.pos = goal
        paint()
        s.raf = 0
        s.last = 0
      }
    },
    [n, paint],
  )

  const kick = React.useCallback(() => {
    const s = m.current
    if (!s.raf) s.raf = requestAnimationFrame(tick)
  }, [tick])

  const goTo = React.useCallback(
    (i: number) => {
      const s = m.current
      s.target += wrapOffset(i - mod(Math.round(s.target), n), n)
      s.target = Math.round(s.target)
      kick()
    },
    [kick, n],
  )
  const step = React.useCallback(
    (d: number) => {
      const s = m.current
      s.target = Math.round(s.target) + d
      kick()
    },
    [kick],
  )

  // layout from the container size (observer, no layout reads)
  React.useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    m.current.reduced = mq.matches
    const onMq = () => (m.current.reduced = mq.matches)
    mq.addEventListener("change", onMq)
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect
      if (r.width < 10 || r.height < 10) return
      const lay = layoutFor(r.width, r.height)
      m.current.L = lay
      setL(lay)
    })
    ro.observe(el)
    return () => {
      ro.disconnect()
      mq.removeEventListener("change", onMq)
      cancelAnimationFrame(m.current.raf)
      m.current.raf = 0
    }
  }, [])

  React.useLayoutEffect(() => {
    paint()
  }, [L, paint])

  // warm the image cache so try-ons never wait on a decode
  React.useEffect(() => {
    for (const it of items) for (const src of [it.look, it.mask, it.garment]) {
      const im = new Image()
      im.src = src
    }
  }, [items])

  // queue: a scan always finishes before the next one starts, so nothing swaps mid-motion
  React.useEffect(() => {
    if (incoming < 0 && sel !== worn) setIncoming(sel)
  }, [sel, worn, incoming])

  React.useEffect(() => {
    if (incoming < 0) return
    const wrap = incomingRef.current
    const grid = gridRef.current
    const scan = scanRef.current
    const out = lookRefs.current[worn]
    if (m.current.reduced || !wrap || !grid || !scan || !out || !wrap.animate) {
      setWorn(incoming)
      setIncoming(-1)
      return
    }
    const D = 920
    const E = "cubic-bezier(.62,.02,.28,1)"
    const a = [
      wrap.animate([{ clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)" }], { duration: D, easing: E, fill: "forwards" }),
      // a true wipe: the outgoing look is cut away above the line, so a narrower garment never shows the old one behind it
      out.animate([{ clipPath: "inset(0% 0 0 0)" }, { clipPath: "inset(100% 0 0 0)" }], { duration: D, easing: E, fill: "forwards" }),
      grid.animate([{ clipPath: "inset(-16% 0 100% 0)" }, { clipPath: "inset(84% 0 0% 0)" }], { duration: D, easing: E, fill: "forwards" }),
      scan.animate([{ top: "0%" }, { top: "100%" }], { duration: D, easing: E, fill: "forwards" }),
      scan.animate([{ opacity: 0 }, { opacity: 1, offset: 0.08 }, { opacity: 1, offset: 0.86 }, { opacity: 0 }], { duration: D, fill: "forwards" }),
    ]
    let live = true
    a[0].onfinish = () => {
      if (!live) return
      setWorn(incoming)
      setIncoming(-1)
    }
    return () => {
      live = false
      a.forEach((x) => x.cancel())
    }
  }, [incoming]) // eslint-disable-line react-hooks/exhaustive-deps

  const announce = item.name + ", " + color.name + ", size " + size
  const lastSent = React.useRef("")
  React.useEffect(() => {
    if (lastSent.current === announce) return
    lastSent.current = announce
    onChange && onChange({ item, size, color })
  }, [announce]) // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    if (!added) return
    const t = setTimeout(() => setAdded(false), 1600)
    return () => clearTimeout(t)
  }, [added])
  React.useEffect(() => setAdded(false), [sel])

  // pointer: drag the ring, parallax on fine pointers
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest(".gft-panel,.gft-bar")) return
    const s = m.current
    s.suppressClick = false
    s.drag = { id: e.pointerId, x: e.clientX, y: e.clientY, pos: s.pos, lastX: e.clientX, lastT: e.timeStamp, v: 0, moved: false, axis: "" }
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const s = m.current
    if (e.pointerType === "mouse" && !s.reduced && s.L) {
      const r = rootRef.current
      if (r) {
        s.mx = Math.max(-1, Math.min(1, (e.clientX / window.innerWidth) * 2 - 1))
        s.my = Math.max(-1, Math.min(1, (e.clientY / window.innerHeight) * 2 - 1))
      }
    }
    const d = s.drag
    if (d && d.id === e.pointerId && s.L) {
      const dx = e.clientX - d.x
      const dy = e.clientY - d.y
      if (!d.axis && Math.hypot(dx, dy) > 6) {
        d.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y"
        if (d.axis === "x") {
          d.moved = true
          s.suppressClick = true
          ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
        }
      }
      if (d.axis === "y") {
        s.drag = null
        return
      }
      if (d.axis === "x") {
        const per = s.L.x1 * 1.1
        const nextPos = s.target - (e.clientX - d.x) / per
        const dt = Math.max(1, e.timeStamp - d.lastT)
        d.v = 0.8 * ((d.lastX - e.clientX) / per / dt) + 0.2 * d.v
        d.lastX = e.clientX
        d.lastT = e.timeStamp
        d.pos = nextPos
      }
    }
    kick()
  }
  const endDrag = (e: React.PointerEvent) => {
    const s = m.current
    const d = s.drag
    if (!d || d.id !== e.pointerId) return
    s.drag = null
    if (d.moved) s.target = Math.round(d.pos + Math.max(-1, Math.min(1, d.v * 110)))
    kick()
  }
  const onPointerLeave = () => {
    m.current.mx = 0
    m.current.my = 0
    kick()
  }
  // only sideways wheels turn the ring; vertical scrolling stays with the page
  const onWheel = (e: React.WheelEvent) => {
    const dx = e.shiftKey && !e.deltaX ? e.deltaY : e.deltaX
    if (Math.abs(dx) < Math.abs(e.deltaY) && !e.shiftKey) return
    const s = m.current
    s.wheel += dx
    if (Math.abs(s.wheel) > 40 && e.timeStamp - s.wheelT > 280) {
      step(Math.sign(s.wheel))
      s.wheel = 0
      s.wheelT = e.timeStamp
    }
  }
  const onKeyDown = (e: React.KeyboardEvent) => {
    if ((e.target as HTMLElement).closest(".gft-panel")) return
    if (e.key === "ArrowRight") step(1)
    else if (e.key === "ArrowLeft") step(-1)
    else if (e.key === "Home") goTo(0)
    else if (e.key === "End") goTo(n - 1)
    else return
    e.preventDefault()
  }

  const vars = {
    "--gft-ink": ink,
    "--gft-glass": glass,
    "--gft-accent": accent,
    "--gft-accent-ink": accentInk,
    "--gft-scan": scanColor,
  } as React.CSSProperties

  const pad = (v: number) => (v < 10 ? "0" : "") + v
  const lookAt = (i: number) => items[i] || items[0]

  return (
    <section
      ref={rootRef}
      className={"gft-root" + (className ? " " + className : "")}
      style={{ ...vars, height, minHeight: height, background }}
      aria-roledescription="carousel"
      aria-label="Virtual try-on"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerLeave={onPointerLeave}
      onWheel={onWheel}
      onKeyDown={onKeyDown}
    >
      <style>{CSS}</style>
      <div ref={roomRef} className="gft-room" aria-hidden="true">
        <img src={backdrop} alt="" width={1536} height={1024} draggable={false} style={{ maxWidth: "none" }} />
      </div>

      {L ? (
        <>
          <div ref={wordRef} className="gft-word" aria-hidden="true" style={{ top: L.wordTop, fontSize: L.wordSize, display: L.wordSize ? "flex" : "none" }}>
            {wordmark.split("").map((c, i) => (
              <span key={i}>{c}</span>
            ))}
          </div>

          <div className="gft-arc" role="group" aria-label="Garments">
            {items.map((it, i) => {
              const c = colorFor(it)
              return (
                <button
                  key={it.id}
                  ref={(el) => {
                    cardRefs.current[i] = el
                  }}
                  type="button"
                  className="gft-card"
                  style={{ width: L.cw, height: L.ch, transformOrigin: "50% 50%", opacity: 0 }}
                  aria-label={"Try on " + it.name + ", " + it.price}
                  aria-pressed={i === sel}
                  onClick={(e) => {
                    if (m.current.suppressClick) {
                      e.preventDefault()
                      m.current.suppressClick = false
                      return
                    }
                    goTo(i)
                  }}
                >
                  <span className="gft-card-in gft-glass">
                    <span className="gft-card-art" style={L.compact ? { height: "52%" } : undefined}>
                      <Art item={it} hex={c.hex} />
                    </span>
                    <span className="gft-label">
                      <b style={L.compact ? { fontSize: 11, whiteSpace: "normal", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" } : { fontSize: Math.round(L.cw * 0.074) }}>{it.name}</b>
                      <i style={{ fontSize: L.compact ? 12 : Math.round(L.cw * 0.09) }}>{it.price}</i>
                    </span>
                  </span>
                </button>
              )
            })}
          </div>

          <div className="gft-model" aria-hidden="true" style={{ left: L.mLeft, top: L.mTop, width: L.mw, height: L.mh, ...(L.compact ? FADE : null) }}>
            {items.map((it, i) => (
              <div
                key={it.id}
                ref={(el) => {
                  lookRefs.current[i] = el
                }}
                className="gft-look"
                style={{ opacity: i === worn ? 1 : 0 }}
              >
                <img src={it.look} alt="" width={LOOK_W} height={LOOK_H} draggable={false} style={{ maxWidth: "none" }} />
                <span className="gft-tint" style={maskStyle(it.mask, colorFor(it).hex)} />
              </div>
            ))}
            {incoming >= 0 ? (
              <>
                <div ref={incomingRef} className="gft-look" style={{ clipPath: "inset(0 0 100% 0)", zIndex: 2 }}>
                  <img src={lookAt(incoming).look} alt="" width={LOOK_W} height={LOOK_H} draggable={false} style={{ maxWidth: "none" }} />
                  <span className="gft-tint" style={maskStyle(lookAt(incoming).mask, colorFor(lookAt(incoming)).hex)} />
                </div>
                <div
                  ref={gridRef}
                  className="gft-grid"
                  style={{ WebkitMaskImage: "url(" + lookAt(incoming).look + ")", maskImage: "url(" + lookAt(incoming).look + ")" }}
                />
                <div ref={scanRef} className="gft-scan" />
              </>
            ) : null}
          </div>

          <div className="gft-bar gft-glass gft-eyebrow" style={{ left: L.g, top: L.barTop, height: L.barH, display: L.compact ? "none" : "flex" }}>
            <span>
              <em aria-hidden="true" />
              {eyebrow}
            </span>
          </div>
          <div
            className="gft-bar gft-glass gft-nav"
            style={L.compact ? { left: L.g, right: L.g, top: L.barTop, height: L.barH, justifyContent: "space-between" } : { right: L.g, top: L.barTop, height: L.barH }}
          >
            <button type="button" aria-label="Previous garment" onClick={() => step(-1)}>
              <Arrow dir={-1} />
            </button>
            <span className="gft-count" aria-hidden="true">
              {L.compact ? item.name + " · " : ""}
              {pad(sel + 1) + " / " + pad(n)}
            </span>
            <button type="button" aria-label="Next garment" onClick={() => step(1)}>
              <Arrow dir={1} />
            </button>
          </div>

          <div
            className="gft-panel gft-glass"
            style={
              L.compact
                ? { left: L.g, top: L.panelTop, width: L.panelW, height: L.panelH, padding: 14, flexDirection: "column", alignItems: "stretch", gap: 12 }
                : { left: L.g, top: L.panelTop, width: L.panelW, height: L.panelH, padding: 16, gap: 14 }
            }
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, height: L.compact ? 56 : 72, flex: "1 1 auto", minWidth: 0 }}>
              <span className="gft-thumb" style={{ width: L.compact ? 52 : 72, height: L.compact ? 52 : 72 }} aria-hidden="true">
                <Art item={item} hex={color.hex} />
              </span>
              <span className="gft-info">
                <span className="gft-name">
                  <Roll text={item.name} />
                </span>
                <span className="gft-price" style={{ display: "block" }}>
                  <Roll text={item.price} />
                </span>
              </span>
              <button type="button" className="gft-add" onClick={() => {
                setAdded(true)
                onAddToBag && onAddToBag({ item, size, color })
              }}>
                <Roll text={added ? addedLabel + " ✓" : addLabel} />
              </button>
            </div>
            {L.compact ? options() : null}
          </div>
          {L.compact ? null : (
            <div
              className="gft-panel gft-glass"
              style={{ right: L.g, top: L.panelTop, width: L.panelW, height: L.panelH, padding: "16px 20px", gap: 22, justifyContent: "space-between" }}
            >
              {options()}
            </div>
          )}
        </>
      ) : null}

      <p className="gft-sr" aria-live="polite">
        {added ? item.name + " added to bag" : "Trying on " + announce}
      </p>
    </section>
  )

  function options() {
    return (
      <div style={{ display: "flex", gap: 18, justifyContent: "space-between", width: "100%", height: 64 }}>
        <fieldset className="gft-opt">
          <legend>Size</legend>
          <div className="gft-chips">
            {sizes.map((z) => (
              <label key={z} className="gft-chip">
                <input type="radio" name={uid + "-size"} value={z} checked={z === size} onChange={() => setSizeOf((p) => ({ ...p, [item.id]: z }))} />
                <span className="gft-size">{z}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="gft-opt" style={{ textAlign: "right" }}>
          <legend style={{ justifyContent: "flex-end" }}>
            <span>{"Colour ·"}</span>
            <Roll text={color.name} />
          </legend>
          <div className="gft-chips" style={{ justifyContent: "flex-end", gap: 2 }}>
            {colors(item).map((c, ci) => (
              <label key={c.name} className="gft-chip" title={c.name}>
                <input
                  type="radio"
                  name={uid + "-color"}
                  value={c.name}
                  aria-label={c.name}
                  checked={c.name === color.name}
                  onChange={() => setColorOf((p) => ({ ...p, [item.id]: ci }))}
                />
                <span className="gft-dot" style={{ background: c.hex === "#ffffff" ? "#f4f1ea" : c.hex }} />
              </label>
            ))}
          </div>
        </fieldset>
      </div>
    )
  }
}

export default GlassFitTryOn
