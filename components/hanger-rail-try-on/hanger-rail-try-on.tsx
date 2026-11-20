"use client"

import * as React from "react"

/* Hanger Rail Try-On: garments hang on a clothes rail above a model. Slide the rail
   (drag, swipe, arrow keys, the arrows) and the garment in the middle lifts off its
   hanger while a scan line sweeps down the figure, dressing him in it. Hangers sway
   as the rail moves. Colour swatches recolour the garment on the model, the rail and
   the thumbnail; sizes and add-to-bag report back through callbacks. */

export type FitColor = { name: string; hex: string }

export type FitItem = {
  id: string
  name: string
  price: string
  /** Short category shown in small caps, e.g. "Shirts". */
  kind?: string
  /** Full figure wearing the garment, transparent PNG/WebP. Every look must share one framing. */
  look: string
  /** Same size as the look: opaque where the garment is, used to tint it. */
  mask: string
  /** Square garment cut-out, transparent background, collar touching the top edge (it hangs from there). */
  garment: string
  /** First entry is the garment as photographed; use "#ffffff" for it so the tint is a no-op. */
  colors?: FitColor[]
  sizes?: string[]
}

export type FitSelection = { item: FitItem; size: string; color: FitColor }

export type HangerRailTryOnProps = {
  items?: FitItem[]
  /** Room photo behind the scene. */
  backdrop?: string
  eyebrow?: string
  addLabel?: string
  addedLabel?: string
  initialIndex?: number
  /** Text and the primary button. */
  ink?: string
  /** Panel and button-text colour. */
  paper?: string
  /** Hairlines. */
  line?: string
  /** Rail and hanger metal. */
  rail?: string
  /** Scan line glow. */
  scanColor?: string
  /** Shown while the backdrop loads. */
  background?: string
  height?: string
  className?: string
  onChange?: (selection: FitSelection) => void
  onAddToBag?: (selection: FitSelection) => void
}

const SITE = "https://kedhar-components.pages.dev/hanger-rail-try-on/"
const SIZES = ["S", "M", "L", "XL"]

const DEFAULT_ITEMS: FitItem[] = [
  {
    id: "crew-tee", name: "Crew Tee", kind: "Tees", price: "$38",
    look: SITE + "look-1.webp", mask: SITE + "mask-1.webp", garment: SITE + "garment-1.webp",
    colors: [{ name: "White", hex: "#ffffff" }, { name: "Sand", hex: "#dcc8a6" }, { name: "Sage", hex: "#a7b59a" }, { name: "Navy", hex: "#2f3d5e" }],
  },
  {
    id: "oxford-shirt", name: "Oxford Shirt", kind: "Shirts", price: "$84",
    look: SITE + "look-2.webp", mask: SITE + "mask-2.webp", garment: SITE + "garment-2.webp",
    colors: [{ name: "White", hex: "#ffffff" }, { name: "Sky", hex: "#b7cbe2" }, { name: "Blush", hex: "#e6c1bb" }, { name: "Olive", hex: "#8c8c62" }],
  },
  {
    id: "knit-polo", name: "Knit Polo", kind: "Knitwear", price: "$72",
    look: SITE + "look-3.webp", mask: SITE + "mask-3.webp", garment: SITE + "garment-3.webp",
    colors: [{ name: "Ecru", hex: "#ffffff" }, { name: "Rust", hex: "#c0774c" }, { name: "Forest", hex: "#4a6650" }, { name: "Ink", hex: "#30343f" }],
  },
  {
    id: "crew-sweat", name: "Crew Sweatshirt", kind: "Fleece", price: "$96",
    look: SITE + "look-4.webp", mask: SITE + "mask-4.webp", garment: SITE + "garment-4.webp",
    colors: [{ name: "Oat", hex: "#ffffff" }, { name: "Heather", hex: "#b9b6b1" }, { name: "Clay", hex: "#c99a83" }, { name: "Charcoal", hex: "#45464b" }],
  },
  {
    id: "zip-hoodie", name: "Zip Hoodie", kind: "Fleece", price: "$118",
    look: SITE + "look-5.webp", mask: SITE + "mask-5.webp", garment: SITE + "garment-5.webp",
    colors: [{ name: "Chalk", hex: "#ffffff" }, { name: "Stone", hex: "#cbbfa9" }, { name: "Moss", hex: "#7e8a63" }, { name: "Black", hex: "#2a2a2d" }],
  },
]

// #region geometry
/** Native size of every look image. */
export const LOOK_W = 330
export const LOOK_H = 952
/** Half-widths of the figure as fractions of the look width: sleeves, head, legs. */
const HALF_TORSO = 0.46
const HALF_HEAD = 0.2
const HALF_LEGS = 0.34
/** Rows of the figure as fractions of its height: the shoulder line. */
const SHOULDER = 0.15

export type Layout = {
  w: number; h: number; compact: boolean; g: number
  barH: number; barTop: number
  panelH: number; panelTop: number; panelW: number
  rodY: number; hook: number; gh: number; labelH: number; labelW: number; pitch: number; railBottom: number
  mh: number; mw: number; mTop: number; mLeft: number
}

export function layoutFor(w: number, h: number): Layout {
  const compact = w < 700
  const g = compact ? 16 : Math.round(Math.min(40, Math.max(20, w * 0.025)))
  const barH = compact ? 44 : 48
  const barTop = g
  const barBottom = barTop + barH
  const panelH = compact ? 164 : 104
  const panelTop = h - g - panelH
  // the rail: a rod under the top bar, hooks over it, garments hang below, labels under them
  const rodY = barBottom + (compact ? 22 : 30)
  const hook = compact ? 16 : 22
  const gh = compact ? 84 : Math.round(Math.min(168, Math.max(96, h * 0.16)))
  const labelH = compact ? 48 : 54
  const labelW = gh + (compact ? 32 : 36)
  // neighbours sit a comfortable step apart, always fully on screen with their labels
  const pitch = compact ? Math.min(132, w / 2 - g - labelW / 2) : Math.min(Math.round(gh * 1.6), w / 2 - g - labelW / 2)
  const railBottom = rodY + hook + gh + labelH
  // the model: his head may rise between the neighbouring garments if they clear him
  const inner = pitch - labelW / 2
  const bottom = compact ? panelTop - 12 : h
  let mTop = rodY + hook + gh * 0.5
  let mh = bottom - mTop
  const fit = () => {
    const mw = (mh * LOOK_W) / LOOK_H
    if (HALF_TORSO * mw > w / 2 - g - (compact ? 6 : 24)) return false
    if (mTop < railBottom && HALF_HEAD * mw + 14 > inner) return false
    if (mTop + SHOULDER * mh < railBottom + 6 && HALF_TORSO * mw + 14 > inner) return false
    return true
  }
  if (!compact) mh = Math.min(mh, h * 0.84)
  mTop = bottom - mh
  while (!fit() && mh > 160) {
    mh -= 6
    mTop = bottom - mh
  }
  const mw = (mh * LOOK_W) / LOOK_H
  // bottom panels flank the legs; wider clearance where the hands still reach the panel rows
  const reach = (panelTop - mTop) / mh > 0.74 ? HALF_LEGS : HALF_TORSO
  const panelW = compact ? w - g * 2 : Math.round(Math.min(400, w / 2 - g - reach * mw - 18))
  return {
    w, h, compact, g, barH, barTop, panelH, panelTop, panelW,
    rodY, hook, gh, labelH, labelW, pitch, railBottom,
    mh, mw, mTop, mLeft: (w - mw) / 2,
  }
}

/** Wraps an offset into [-n/2, n/2). */
export function wrapOffset(o: number, n: number) {
  return ((((o + n / 2) % n) + n) % n) - n / 2
}

/** Where a hanger sits for a fractional offset from the selected one. */
export function railPose(o: number, n: number, pitch: number) {
  const a = Math.abs(o)
  const worn = Math.max(0, Math.min(1, (a - 0.18) / 0.5)) // the middle garment is lifted off, he is wearing it
  const edge = Math.max(0, Math.min(1, (n / 2 - a) / 0.4)) // fades only inside the wrap seam so nothing pops
  return {
    x: o * pitch,
    hanger: edge,
    garment: worn * edge,
    lift: (1 - worn) * -18,
    label: Math.max(0, Math.min(1, (a - 0.45) / 0.35)) * edge,
  }
}
// #endregion

const SERIF = "'Iowan Old Style','Palatino Linotype',Palatino,'Book Antiqua',Georgia,serif"

const CSS =
  ".hrt-root{position:relative;overflow:hidden;isolation:isolate;color:var(--hrt-ink);font-family:inherit;-webkit-font-smoothing:antialiased;touch-action:pan-y;user-select:none;-webkit-user-select:none}" +
  ".hrt-root img{max-width:none;display:block}" +
  ".hrt-root button,.hrt-root input{font:inherit;color:inherit}" +
  ".hrt-room{position:absolute;inset:-3%;z-index:0;will-change:transform}" +
  ".hrt-room img{width:100%;height:100%;object-fit:cover;filter:blur(2px) saturate(1.02)}" +
  ".hrt-room:after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(246,242,234,.18),rgba(40,30,20,.12))}" +
  ".hrt-paper{background:var(--hrt-paper);border:1px solid var(--hrt-line);box-shadow:0 14px 34px -26px rgba(40,30,20,.55)}" +
  ".hrt-rod{position:absolute;z-index:4;height:4px;border-radius:2px;background:linear-gradient(180deg,rgba(255,255,255,.55),transparent 55%),var(--hrt-rail);box-shadow:0 2px 3px rgba(40,30,20,.25)}" +
  ".hrt-rod:before,.hrt-rod:after{content:'';position:absolute;top:-4px;width:12px;height:12px;border-radius:50%;background:radial-gradient(circle at 35% 35%,rgba(255,255,255,.7),transparent 45%),var(--hrt-rail)}" +
  ".hrt-rod:before{left:-6px}.hrt-rod:after{right:-6px}" +
  ".hrt-hang{position:absolute;left:0;top:0;padding:0;border:0;background:none;cursor:pointer;z-index:5;will-change:transform,opacity;-webkit-tap-highlight-color:transparent}" +
  ".hrt-hang:focus-visible{outline:none}" +
  ".hrt-hang:focus-visible .hrt-label b{text-decoration:underline;text-underline-offset:4px;text-decoration-thickness:1px}" +
  ".hrt-hang:focus-visible .hrt-g{outline:1px solid var(--hrt-ink);outline-offset:6px;border-radius:4px}" +
  ".hrt-swing{position:absolute;left:0;right:0;top:0;will-change:transform}" +
  ".hrt-hanger{position:absolute;left:50%;top:0;transform:translateX(-50%);overflow:visible}" +
  ".hrt-hanger path{fill:none;stroke:var(--hrt-rail);stroke-linecap:round;stroke-linejoin:round}" +
  ".hrt-g{position:absolute;transition:transform .45s cubic-bezier(.2,.8,.2,1)}" +
  ".hrt-hang:hover .hrt-g{transform:translateY(-4px)}" +
  ".hrt-label{position:absolute;left:50%;bottom:0;transform:translateX(-50%);max-width:100%;box-sizing:border-box;padding:5px 10px 6px;text-align:center;line-height:1.15;background:var(--hrt-paper);border:1px solid var(--hrt-line);border-radius:2px;box-shadow:0 6px 14px -10px rgba(40,30,20,.5);opacity:var(--hrt-label,1)}" +
  ".hrt-label:before{content:'';position:absolute;left:50%;top:-7px;width:1px;height:7px;background:var(--hrt-line)}" +
  ".hrt-label b{display:block;font-family:" + SERIF + ";font-weight:400;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
  ".hrt-label i{display:block;font-style:normal;font-size:10px;letter-spacing:.14em;text-transform:uppercase;opacity:.7;margin-top:3px}" +
  ".hrt-art{position:absolute;inset:0;isolation:isolate}" +
  ".hrt-art img{width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 10px 10px rgba(40,30,20,.18))}" +
  ".hrt-tint{position:absolute;inset:0;mix-blend-mode:multiply;transition:background-color .5s ease;-webkit-mask-size:100% 100%;mask-size:100% 100%;-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;-webkit-mask-position:center;mask-position:center;pointer-events:none}" +
  ".hrt-art .hrt-tint{-webkit-mask-size:contain;mask-size:contain}" +
  ".hrt-model{position:absolute;z-index:10;pointer-events:none}" +
  ".hrt-look{position:absolute;inset:0;isolation:isolate}" +
  ".hrt-look img{width:100%;height:100%}" +
  ".hrt-grid{position:absolute;inset:0;z-index:3;background:repeating-linear-gradient(0deg,transparent 0 5px,rgba(255,255,255,.5) 5px 6px);-webkit-mask-size:100% 100%;mask-size:100% 100%;mix-blend-mode:screen;clip-path:inset(0 0 100% 0)}" +
  ".hrt-scan{position:absolute;left:-14%;width:128%;top:0;height:2px;z-index:4;opacity:0;background:linear-gradient(90deg,transparent,var(--hrt-scan) 18%,var(--hrt-scan) 82%,transparent);box-shadow:0 0 14px 3px var(--hrt-scan),0 0 46px 8px rgba(255,236,206,.5)}" +
  ".hrt-bar{position:absolute;z-index:30;display:flex;align-items:center;gap:10px;border-radius:4px;box-sizing:border-box}" +
  ".hrt-eyebrow{padding:0 18px;font-size:11px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;white-space:nowrap}" +
  ".hrt-eyebrow em{display:inline-block;width:6px;height:6px;border-radius:50%;background:#3f9f6f;margin-right:10px;vertical-align:1px}" +
  ".hrt-nav{padding:3px}" +
  ".hrt-nav button{width:40px;height:40px;border-radius:3px;border:0;background:transparent;display:grid;place-items:center;cursor:pointer;transition:background .25s}" +
  ".hrt-nav button:hover{background:rgba(29,27,24,.06)}" +
  ".hrt-nav button:focus-visible{outline:1px solid var(--hrt-ink);outline-offset:-4px}" +
  ".hrt-nav svg{width:16px;height:16px;stroke:currentColor;fill:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}" +
  ".hrt-count{min-width:64px;text-align:center;font-family:" + SERIF + ";font-size:15px;font-variant-numeric:lining-nums tabular-nums}" +
  ".hrt-count small{font-family:inherit;font-size:11px;letter-spacing:.12em;text-transform:uppercase;opacity:.65;margin-right:8px}" +
  ".hrt-panel{position:absolute;z-index:30;border-radius:4px;display:flex;align-items:center;box-sizing:border-box}" +
  ".hrt-thumb{flex:0 0 auto;border-radius:2px;border:1px solid var(--hrt-line);position:relative;overflow:hidden;box-sizing:border-box}" +
  ".hrt-thumb .hrt-art{left:6px;right:6px;top:8px;bottom:2px}" +
  ".hrt-thumb .hrt-art img{filter:none}" +
  ".hrt-info{flex:1 1 auto;min-width:0}" +
  ".hrt-roll{display:block;position:relative;overflow:hidden;height:1.25em;line-height:1.25}" +
  ".hrt-roll span{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
  ".hrt-roll .hrt-out{position:absolute;left:0;right:0;top:0;animation:hrt-out .32s cubic-bezier(.5,0,.75,0) both}" +
  ".hrt-roll .hrt-in{animation:hrt-in .46s cubic-bezier(.2,.8,.2,1) .14s both}" +
  "@keyframes hrt-out{to{transform:translateY(-110%);opacity:0}}" +
  "@keyframes hrt-in{from{transform:translateY(110%);opacity:0}to{transform:none;opacity:1}}" +
  ".hrt-name{font-family:" + SERIF + ";font-size:18px;font-weight:400}" +
  ".hrt-price{font-size:11px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;opacity:.65;margin-top:5px}" +
  ".hrt-root .hrt-add{flex:0 0 auto;height:44px;padding:0 16px;border:0;border-radius:3px;background:var(--hrt-ink);color:var(--hrt-paper);font-size:11px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;cursor:pointer;white-space:nowrap;transition:background .25s}" +
  ".hrt-root .hrt-add:hover{background:#000}" +
  ".hrt-root .hrt-add:focus-visible{outline:1px solid var(--hrt-ink);outline-offset:3px}" +
  ".hrt-opt{border:0;margin:0;padding:0;min-width:0}" +
  ".hrt-opt legend{padding:0;font-size:10px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;margin-bottom:8px;display:flex;gap:6px;width:100%;line-height:1.25;height:1.25em}" +
  ".hrt-opt legend>span:first-child{opacity:.6}" +
  ".hrt-opt legend .hrt-roll{display:block}" +
  ".hrt-chips{display:flex;gap:6px;align-items:center}" +
  ".hrt-chip{position:relative;display:block;cursor:pointer}" +
  ".hrt-chip input{position:absolute;inset:0;opacity:0;margin:0;cursor:pointer}" +
  ".hrt-size{width:34px;height:34px;border-radius:2px;box-sizing:border-box;border:1px solid var(--hrt-line);display:grid;place-items:center;font-size:11px;font-weight:600;transition:background .25s,color .25s,border-color .25s}" +
  ".hrt-chip input:checked+.hrt-size{background:var(--hrt-ink);border-color:var(--hrt-ink);color:var(--hrt-paper)}" +
  ".hrt-dot{display:block;width:22px;height:22px;border-radius:50%;margin:6px;border:1px solid rgba(0,0,0,.14);box-sizing:border-box;position:relative}" +
  ".hrt-dot:after{content:'';position:absolute;inset:-5px;border-radius:50%;border:1px solid transparent;transition:border-color .25s}" +
  ".hrt-chip input:checked+.hrt-dot:after{border-color:var(--hrt-ink)}" +
  ".hrt-chip input:focus-visible+span{outline:1px solid var(--hrt-ink);outline-offset:4px}" +
  ".hrt-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}" +
  "@media (prefers-reduced-motion:reduce){.hrt-g,.hrt-tint,.hrt-size,.hrt-dot:after,.hrt-nav button{transition:none}.hrt-hang:hover .hrt-g{transform:none}.hrt-roll .hrt-out{display:none}.hrt-roll .hrt-in{animation:none}}"

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
    <span className="hrt-roll">
      {s.prev ? (
        <span key={"o" + s.n} className="hrt-out" aria-hidden="true" onAnimationEnd={() => setS((p) => (p.n === s.n ? { ...p, prev: "" } : p))}>
          {s.prev}
        </span>
      ) : null}
      <span key={"i" + s.n} className={s.n ? "hrt-in" : undefined}>{s.cur}</span>
    </span>
  )
}

function maskStyle(url: string, hex: string): React.CSSProperties {
  const m = "url(" + url + ")"
  return { backgroundColor: hex, WebkitMaskImage: m, maskImage: m }
}

function Art({ item, hex }: { item: FitItem; hex: string }) {
  return (
    <span className="hrt-art">
      <img src={item.garment} alt="" width={400} height={400} draggable={false} style={{ maxWidth: "none" }} />
      <span className="hrt-tint" style={maskStyle(item.garment, hex)} />
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

/** A bent-wire hanger: hook over the rod, shoulders at the bottom of the box. */
function Hanger({ width, hook }: { width: number; hook: number }) {
  const h = hook + 8
  const sw = Math.max(1.6, width / 70)
  const mid = width / 2
  const d =
    "M" + (mid - 5) + " 6 C" + (mid - 5) + " 1 " + (mid + 5) + " 1 " + (mid + 5) + " 6 S" + mid + " 11 " + mid + " " + (h * 0.45) +
    " L" + (width * 0.04) + " " + (h - sw) + " L" + (width * 0.96) + " " + (h - sw) + " L" + mid + " " + (h * 0.45)
  return (
    <svg className="hrt-hanger" width={width} height={h} viewBox={"0 0 " + width + " " + h} aria-hidden="true">
      <path d={d} strokeWidth={sw} />
    </svg>
  )
}

export function HangerRailTryOn({
  items = DEFAULT_ITEMS,
  backdrop = SITE + "room.webp",
  eyebrow = "Virtual fitting room",
  addLabel = "Add to bag",
  addedLabel = "Added",
  initialIndex = 0,
  ink = "#1d1b18",
  paper = "#f6f2ea",
  line = "rgba(29,27,24,0.14)",
  rail = "#a8875a",
  scanColor = "#fffaf0",
  background = "#e7e1d8",
  height = "100svh",
  className,
  onChange,
  onAddToBag,
}: HangerRailTryOnProps) {
  const n = items.length
  const uid = React.useId()
  const rootRef = React.useRef(null as HTMLDivElement | null)
  const roomRef = React.useRef(null as HTMLDivElement | null)
  const hangRefs = React.useRef([] as (HTMLButtonElement | null)[])
  const lookRefs = React.useRef([] as (HTMLDivElement | null)[])
  const incomingRef = React.useRef(null as HTMLDivElement | null)
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
    pos: start, target: start, raf: 0, last: 0, sel: start, vx: 0,
    sway: [] as { a: number; v: number }[],
    drag: null as null | { id: number; x: number; y: number; from: number; pos: number; lastX: number; lastT: number; v: number; moved: boolean; axis: "" | "x" | "y" },
    mx: 0, my: 0, px: 0, py: 0, reduced: false, L: null as Layout | null, wheel: 0, wheelT: 0, suppressClick: false,
  })

  const item = items[sel] || items[0]
  const colors = (it: FitItem) => (it.colors && it.colors.length ? it.colors : [{ name: "Natural", hex: "#ffffff" }])
  const colorFor = (it: FitItem) => colors(it)[Math.min(colorOf[it.id] || 0, colors(it).length - 1)]
  const sizes = item.sizes && item.sizes.length ? item.sizes : SIZES
  const size = sizeOf[item.id] || sizes[Math.min(1, sizes.length - 1)]
  const color = colorFor(item)

  // paint: hanger transforms and sway, parallax. Writes styles directly, no React render per frame.
  const paint = React.useCallback(() => {
    const s = m.current
    const lay = s.L
    if (!lay) return
    const bw = lay.labelW
    for (let i = 0; i < n; i++) {
      const el = hangRefs.current[i]
      if (!el) continue
      const o = wrapOffset(i - s.pos, n)
      const p = railPose(o, n, lay.pitch)
      // phones show one neighbour each side; the next ones would hang off-screen
      const k = lay.compact ? Math.max(0, Math.min(1, (1.6 - Math.abs(o)) / 0.35)) : 1
      const x = lay.w / 2 + p.x - bw / 2
      el.style.transform = "translate3d(" + x.toFixed(2) + "px," + (lay.rodY - 6).toFixed(2) + "px,0)"
      el.style.opacity = (p.hanger * k).toFixed(3)
      const visible = p.garment * k > 0.4
      el.style.pointerEvents = visible ? "auto" : "none"
      el.tabIndex = visible ? 0 : -1
      el.style.setProperty("--hrt-label", (p.label * k).toFixed(3))
      const sw = el.firstElementChild as HTMLElement | null
      if (sw) sw.style.transform = "rotate(" + ((s.sway[i] && s.sway[i].a) || 0).toFixed(3) + "deg)"
      const g = el.querySelector(".hrt-lift") as HTMLElement | null
      if (g) {
        g.style.opacity = p.garment.toFixed(3)
        g.style.transform = "translate3d(0," + p.lift.toFixed(2) + "px,0)"
      }
    }
    if (roomRef.current) roomRef.current.style.transform = "translate3d(" + (-s.px * 12).toFixed(2) + "px," + (-s.py * 8).toFixed(2) + "px,0)"
  }, [n])

  const tick = React.useCallback(
    (t: number) => {
      const s = m.current
      const dt = Math.min(32, s.last ? t - s.last : 16)
      s.last = t
      const goal = s.drag ? s.drag.pos : s.target
      const before = s.pos
      if (s.reduced) s.pos = goal
      else s.pos += (goal - s.pos) * (1 - Math.exp(-dt / (s.drag ? 45 : 170)))
      // rail speed in px/ms drives the hangers: they trail the motion, overshoot and settle
      const pitch = s.L ? s.L.pitch : 200
      s.vx = ((s.pos - before) * pitch) / Math.max(dt, 1)
      let swinging = false
      for (let i = 0; i < n; i++) {
        const w = s.sway[i] || (s.sway[i] = { a: 0, v: 0 })
        if (s.reduced) {
          w.a = 0
          w.v = 0
          continue
        }
        const want = Math.max(-11, Math.min(11, s.vx * 7))
        w.v += ((want - w.a) * 0.00018 - w.v * 0.011) * dt
        w.a += w.v * dt
        if (Math.abs(w.a) > 0.04 || Math.abs(w.v) > 0.0008) swinging = true
      }
      s.px += (s.mx - s.px) * (1 - Math.exp(-dt / 260))
      s.py += (s.my - s.py) * (1 - Math.exp(-dt / 260))
      const r = mod(Math.round(goal), n)
      if (r !== s.sel) {
        s.sel = r
        setSel(r)
      }
      paint()
      const moving = Math.abs(goal - s.pos) > 0.0008 || Math.abs(s.mx - s.px) > 0.002 || Math.abs(s.my - s.py) > 0.002 || swinging
      if (moving || s.drag) s.raf = requestAnimationFrame(tick)
      else {
        s.pos = goal
        for (const w of s.sway) if (w) w.a = w.v = 0
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
      s.target = Math.round(s.target + wrapOffset(i - mod(Math.round(s.target), n), n))
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

  // pointer: drag the rail, parallax on fine pointers
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest(".hrt-panel,.hrt-bar")) return
    const s = m.current
    s.suppressClick = false
    s.drag = { id: e.pointerId, x: e.clientX, y: e.clientY, from: s.target, pos: s.pos, lastX: e.clientX, lastT: e.timeStamp, v: 0, moved: false, axis: "" }
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const s = m.current
    if (e.pointerType === "mouse" && !s.reduced && s.L) {
      s.mx = Math.max(-1, Math.min(1, (e.clientX / window.innerWidth) * 2 - 1))
      s.my = Math.max(-1, Math.min(1, (e.clientY / window.innerHeight) * 2 - 1))
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
        // the rail follows the finger one-to-one: a pitch of drag moves one hanger
        const per = s.L.pitch
        const dt = Math.max(1, e.timeStamp - d.lastT)
        d.v = 0.8 * ((d.lastX - e.clientX) / per / dt) + 0.2 * d.v
        d.lastX = e.clientX
        d.lastT = e.timeStamp
        d.pos = d.from - dx / per
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
  // only sideways wheels move the rail; vertical scrolling stays with the page
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
    if ((e.target as HTMLElement).closest(".hrt-panel")) return
    if (e.key === "ArrowRight") step(1)
    else if (e.key === "ArrowLeft") step(-1)
    else if (e.key === "Home") goTo(0)
    else if (e.key === "End") goTo(n - 1)
    else return
    e.preventDefault()
  }

  const vars = {
    "--hrt-ink": ink,
    "--hrt-paper": paper,
    "--hrt-line": line,
    "--hrt-rail": rail,
    "--hrt-scan": scanColor,
  } as React.CSSProperties

  const pad = (v: number) => (v < 10 ? "0" : "") + v
  const lookAt = (i: number) => items[i] || items[0]

  return (
    <section
      ref={rootRef}
      className={"hrt-root" + (className ? " " + className : "")}
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
      <div ref={roomRef} className="hrt-room" aria-hidden="true">
        <img src={backdrop} alt="" width={1536} height={1024} draggable={false} style={{ maxWidth: "none" }} />
      </div>

      {L ? (
        <>
          <div className="hrt-rod" aria-hidden="true" style={{ left: L.g + 6, right: L.g + 6, top: L.rodY - 2 }} />
          <div role="group" aria-label="Garments">
            {items.map((it, i) => {
              const c = colorFor(it)
              const hw = Math.round(L.gh * 0.8)
              return (
                <button
                  key={it.id}
                  ref={(el) => {
                    hangRefs.current[i] = el
                  }}
                  type="button"
                  className="hrt-hang"
                  style={{ width: L.labelW, height: 6 + L.hook + L.gh + L.labelH, opacity: 0 }}
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
                  <span className="hrt-swing" style={{ height: 6 + L.hook + L.gh, transformOrigin: "50% 6px" }}>
                    <Hanger width={hw} hook={L.hook} />
                    <span className="hrt-lift" style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, display: "block" }}>
                      <span className="hrt-g" style={{ left: (L.labelW - L.gh) / 2, top: 6 + L.hook - L.gh * 0.02, width: L.gh, height: L.gh }}>
                        <Art item={it} hex={c.hex} />
                      </span>
                    </span>
                  </span>
                  <span className="hrt-label">
                    <b style={{ fontSize: L.compact ? 12 : 15 }}>{it.name}</b>
                    <i>{it.price}</i>
                  </span>
                </button>
              )
            })}
          </div>

          <div
            className="hrt-model"
            aria-hidden="true"
            style={{ left: L.mLeft, top: L.mTop, width: L.mw, height: L.mh, ...(L.compact ? FADE : null) }}
          >
            {items.map((it, i) => (
              <div
                key={it.id}
                ref={(el) => {
                  lookRefs.current[i] = el
                }}
                className="hrt-look"
                style={{ opacity: i === worn ? 1 : 0 }}
              >
                <img src={it.look} alt="" width={LOOK_W} height={LOOK_H} draggable={false} style={{ maxWidth: "none" }} />
                <span className="hrt-tint" style={maskStyle(it.mask, colorFor(it).hex)} />
              </div>
            ))}
            {incoming >= 0 ? (
              <>
                <div ref={incomingRef} className="hrt-look" style={{ clipPath: "inset(0 0 100% 0)", zIndex: 2 }}>
                  <img src={lookAt(incoming).look} alt="" width={LOOK_W} height={LOOK_H} draggable={false} style={{ maxWidth: "none" }} />
                  <span className="hrt-tint" style={maskStyle(lookAt(incoming).mask, colorFor(lookAt(incoming)).hex)} />
                </div>
                <div
                  ref={gridRef}
                  className="hrt-grid"
                  style={{ WebkitMaskImage: "url(" + lookAt(incoming).look + ")", maskImage: "url(" + lookAt(incoming).look + ")" }}
                />
                <div ref={scanRef} className="hrt-scan" />
              </>
            ) : null}
          </div>

          <div className="hrt-bar hrt-paper hrt-eyebrow" style={{ left: L.g, top: L.barTop, height: L.barH, display: L.compact ? "none" : "flex" }}>
            <span>
              <em aria-hidden="true" />
              {eyebrow}
            </span>
          </div>
          <div
            className="hrt-bar hrt-paper hrt-nav"
            style={L.compact ? { left: L.g, right: L.g, top: L.barTop, height: L.barH, justifyContent: "space-between" } : { right: L.g, top: L.barTop, height: L.barH }}
          >
            <button type="button" aria-label="Previous garment" onClick={() => step(-1)}>
              <Arrow dir={-1} />
            </button>
            <span className="hrt-count" aria-hidden="true">
              {item.kind ? <small>{item.kind}</small> : null}
              {pad(sel + 1) + " / " + pad(n)}
            </span>
            <button type="button" aria-label="Next garment" onClick={() => step(1)}>
              <Arrow dir={1} />
            </button>
          </div>

          <div
            className="hrt-panel hrt-paper"
            style={
              L.compact
                ? { left: L.g, top: L.panelTop, width: L.panelW, height: L.panelH, padding: 14, flexDirection: "column", alignItems: "stretch", gap: 12 }
                : { left: L.g, top: L.panelTop, width: L.panelW, height: L.panelH, padding: 16, gap: 14 }
            }
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14, height: L.compact ? 56 : 72, flex: "1 1 auto", minWidth: 0 }}>
              <span className="hrt-thumb" style={{ width: L.compact ? 52 : 72, height: L.compact ? 52 : 72 }} aria-hidden="true">
                <Art item={item} hex={color.hex} />
              </span>
              <span className="hrt-info">
                <span className="hrt-name">
                  <Roll text={item.name} />
                </span>
                <span className="hrt-price" style={{ display: "block" }}>
                  <Roll text={item.price} />
                </span>
              </span>
              <button
                type="button"
                className="hrt-add"
                onClick={() => {
                  setAdded(true)
                  onAddToBag && onAddToBag({ item, size, color })
                }}
              >
                <Roll text={added ? addedLabel + " ✓" : addLabel} />
              </button>
            </div>
            {L.compact ? options() : null}
          </div>
          {L.compact ? null : (
            <div
              className="hrt-panel hrt-paper"
              style={{ right: L.g, top: L.panelTop, width: L.panelW, height: L.panelH, padding: "16px 20px", gap: 22, justifyContent: "space-between" }}
            >
              {options()}
            </div>
          )}
        </>
      ) : null}

      <p className="hrt-sr" aria-live="polite">
        {added ? item.name + " added to bag" : "Trying on " + announce}
      </p>
    </section>
  )

  function options() {
    return (
      <div style={{ display: "flex", gap: 18, justifyContent: "space-between", width: "100%", height: 64 }}>
        <fieldset className="hrt-opt">
          <legend>
            <span>Size</span>
          </legend>
          <div className="hrt-chips">
            {sizes.map((z) => (
              <label key={z} className="hrt-chip">
                <input type="radio" name={uid + "-size"} value={z} checked={z === size} onChange={() => setSizeOf((p) => ({ ...p, [item.id]: z }))} />
                <span className="hrt-size">{z}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="hrt-opt">
          <legend style={{ justifyContent: "flex-end" }}>
            <span>{"Colour"}</span>
            <Roll text={color.name} />
          </legend>
          <div className="hrt-chips" style={{ justifyContent: "flex-end", gap: 0 }}>
            {colors(item).map((c, ci) => (
              <label key={c.name} className="hrt-chip" title={c.name}>
                <input
                  type="radio"
                  name={uid + "-color"}
                  value={c.name}
                  aria-label={c.name}
                  checked={c.name === color.name}
                  onChange={() => setColorOf((p) => ({ ...p, [item.id]: ci }))}
                />
                <span className="hrt-dot" style={{ background: c.hex === "#ffffff" ? "#fbf9f4" : c.hex }} />
              </label>
            ))}
          </div>
        </fieldset>
      </div>
    )
  }
}

export default HangerRailTryOn
