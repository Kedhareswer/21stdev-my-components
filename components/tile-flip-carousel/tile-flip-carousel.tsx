"use client"

import * as React from "react"

/*
 * Tile Flip Carousel — a full-bleed image carousel where the picture breaks
 * into a grid of tiles that flip over in a wave spreading from where you tap,
 * each tile carrying its piece of the next picture on its back.
 *
 * Tap the picture, use the arrows, swipe, ←/→ or let it autoplay. Slides
 * without an `image` get a painted landscape, so it works with no assets.
 */

export type LandPalette = "dawn" | "alpine" | "dusk" | "mist"

export type Slide = {
  image?: string
  title?: string
  caption?: string
  alt?: string
  /** Palette and seed of the painted landscape used when `image` is empty. */
  palette?: LandPalette
  seed?: number
}

export type TileFlipCarouselProps = {
  slides?: Slide[]
  /** Any CSS length. Default 100svh. */
  height?: number | string
  /** ms the transition takes. */
  duration?: number
  /** Tiles across and down. */
  cols?: number
  rows?: number
  /** ms per slide; 0 turns autoplay off. */
  autoplay?: number
  /** Colour of text, buttons and the progress line. */
  ink?: string
  onChange?: (index: number) => void
  className?: string
  style?: React.CSSProperties
  ariaLabel?: string
}

// #region logic
export function wrap(i: number, n: number): number {
  return n ? ((i % n) + n) % n : 0
}

export function pad2(n: number): string {
  return n < 10 ? "0" + n : String(n)
}

/** Where an untargeted transition starts: right of centre going forward, left going back. */
export function defaultOrigin(dir: number, w: number, h: number, r: number): [number, number] {
  return [w * (dir >= 0 ? 0.62 + r * 0.25 : 0.13 + r * 0.25), h * (0.3 + r * 0.4)]
}

/** Start delay of a tile: a wave spreading from (x, y) across the grid, 0..spread ms. */
export function tileDelay(cx: number, cy: number, x: number, y: number, w: number, h: number, spread: number): number {
  return (Math.hypot(cx - x, cy - y) / Math.hypot(w, h)) * spread
}
// #endregion logic

/* ------------------------------------------------------- painted images */

const PALETTES = {
  dawn: { top: "#e7b7a5", bottom: "#f8e8d6", sun: "#fff4df", far: "#d2b2bb", near: "#3a2a3b", mist: "255,240,232" },
  alpine: { top: "#7ea5c8", bottom: "#e3ecf2", sun: "#ffffff", far: "#a9bfd0", near: "#1c3044", mist: "236,244,250" },
  dusk: { top: "#2a2450", bottom: "#ef8d60", sun: "#ffd9a6", far: "#93607c", near: "#18121f", mist: "255,196,160" },
  mist: { top: "#c4d0cb", bottom: "#eef1ec", sun: "#ffffff", far: "#aebcb5", near: "#2c3a33", mist: "246,248,245" },
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
function hexRgb(h: string): [number, number, number] {
  const v = parseInt(h.replace("#", ""), 16)
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255]
}
function mixRgb(a: string, b: string, t: number): string {
  const A = hexRgb(a)
  const B = hexRgb(b)
  return "rgb(" + A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(",") + ")"
}

// A layered-ridge landscape: sky, a low sun, five ridges fading into haze with
// mist between them, a tree line on the nearest, film grain. Painted once.
function paintLandscape(seed: number, palette: LandPalette, w = 1600, h = 1000): string {
  if (typeof document === "undefined") return ""
  const c = document.createElement("canvas")
  c.width = w
  c.height = h
  const g = c.getContext("2d")
  if (!g) return ""
  const P = PALETTES[palette] ?? PALETTES.dawn
  const r = mulberry32(seed * 104729 + 7)

  const sky = g.createLinearGradient(0, 0, 0, h * 0.72)
  sky.addColorStop(0, P.top)
  sky.addColorStop(1, P.bottom)
  g.fillStyle = sky
  g.fillRect(0, 0, w, h)
  const sx = w * (0.22 + r() * 0.56)
  const sy = h * (0.26 + r() * 0.16)
  const halo = g.createRadialGradient(sx, sy, 0, sx, sy, w * 0.45)
  halo.addColorStop(0, "rgba(" + hexRgb(P.sun).join(",") + ",.85)")
  halo.addColorStop(0.08, "rgba(" + hexRgb(P.sun).join(",") + ",.55)")
  halo.addColorStop(1, "rgba(" + hexRgb(P.sun).join(",") + ",0)")
  g.fillStyle = halo
  g.fillRect(0, 0, w, h)
  g.fillStyle = P.sun
  g.beginPath()
  g.arc(sx, sy, h * 0.045, 0, Math.PI * 2)
  g.fill()

  const layers = 5
  for (let L = 0; L < layers; L++) {
    const k = L / (layers - 1)
    const base = h * (0.42 + k * 0.4)
    const amp = h * (0.07 + k * 0.1)
    const ph = [r(), r(), r(), r()].map((v) => v * Math.PI * 2)
    const fr = [1.3 + r(), 3.1 + r() * 2, 7 + r() * 4, 17 + r() * 8]
    const ridge = (x: number) => {
      const u = x / w
      return (
        base -
        amp *
          (0.55 * Math.sin(u * fr[0] + ph[0]) +
            0.28 * Math.sin(u * fr[1] + ph[1]) +
            0.12 * Math.abs(Math.sin(u * fr[2] + ph[2])) +
            0.05 * Math.sin(u * fr[3] + ph[3]))
      )
    }
    const mist = g.createLinearGradient(0, base - amp * 1.4, 0, base + amp * 0.4)
    mist.addColorStop(0, "rgba(" + P.mist + ",0)")
    mist.addColorStop(1, "rgba(" + P.mist + "," + (0.55 - k * 0.35).toFixed(2) + ")")
    g.fillStyle = mist
    g.fillRect(0, base - amp * 1.4, w, amp * 1.8)
    const body = g.createLinearGradient(0, base - amp, 0, h)
    body.addColorStop(0, mixRgb(P.far, P.near, Math.pow(k, 1.3)))
    body.addColorStop(1, mixRgb(P.far, P.near, Math.min(1, Math.pow(k, 1.3) + 0.18)))
    g.fillStyle = body
    g.beginPath()
    g.moveTo(0, h)
    for (let x = 0; x <= w; x += 6) g.lineTo(x, ridge(x))
    g.lineTo(w, h)
    g.closePath()
    g.fill()
    if (L >= layers - 2) {
      g.fillStyle = mixRgb(P.far, P.near, Math.min(1, Math.pow(k, 1.3) + 0.08))
      for (let x = 0; x < w; x += 7 + r() * 9) {
        if (r() < 0.35) continue
        const y = ridge(x) + 2
        const th = h * (0.025 + r() * 0.035) * (0.6 + k)
        const tw = th * 0.32
        g.beginPath()
        g.moveTo(x, y - th)
        g.lineTo(x + tw, y)
        g.lineTo(x - tw, y)
        g.closePath()
        g.fill()
      }
    }
  }

  const vig = g.createRadialGradient(w / 2, h * 0.45, h * 0.3, w / 2, h / 2, w * 0.78)
  vig.addColorStop(0, "rgba(0,0,0,0)")
  vig.addColorStop(1, "rgba(0,0,0,.32)")
  g.fillStyle = vig
  g.fillRect(0, 0, w, h)
  const grain = g.getImageData(0, 0, w, h)
  const d = grain.data
  for (let i = 0; i < d.length; i += 4) {
    const v = (r() - 0.5) * 14
    d[i] += v
    d[i + 1] += v
    d[i + 2] += v
  }
  g.putImageData(grain, 0, 0)
  return c.toDataURL("image/jpeg", 0.88)
}

const DEFAULT_SLIDES: Slide[] = [
  { title: "First Light", caption: "Haze lifting off the eastern ridges.", palette: "dawn", seed: 3 },
  { title: "High Pass", caption: "Cold air, clear to the far range.", palette: "alpine", seed: 8 },
  { title: "Ember Hour", caption: "The last of the sun on the valley floor.", palette: "dusk", seed: 14 },
  { title: "Still Valley", caption: "Morning mist that never quite lifts.", palette: "mist", seed: 21 },
  { title: "Rose Ridge", caption: "Five ridges, one long exhale.", palette: "dawn", seed: 34 },
  { title: "Blue Hour", caption: "Pines going dark against the snow.", palette: "alpine", seed: 55 },
]

// Every slide as an image URL; slides without one are painted after mount.
function useSlideImages(slides: Slide[]): string[] {
  const key = slides.map((s) => s.image || (s.palette || "dawn") + ":" + (s.seed ?? 1)).join("|")
  const [painted, setPainted] = React.useState(() => slides.map(() => ""))
  React.useEffect(() => {
    setPainted(slides.map((s, i) => (s.image ? "" : paintLandscape(s.seed ?? i + 1, s.palette || "dawn"))))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  return slides.map((s, i) => s.image || painted[i] || "")
}

type LayerProps = {
  from: string
  to: string
  x: number
  y: number
  w: number
  h: number
  dir: number
  duration: number
  opts: { [k: string]: number }
  onDone: () => void
}

// The grid: every tile holds a stage-sized copy of each picture, offset so its
// window shows its own piece. The wave's last tile commits the slide.
function Layer({ from, to, x, y, w, h, dir, duration, opts, onDone }: LayerProps) {
  const C = Math.max(2, Math.round(opts.cols || 10))
  const R = Math.max(2, Math.round(opts.rows || 6))
  const tw = w / C
  const th = h / R
  const spread = duration * 0.55
  const flip = duration - spread
  const cells = []
  let last = 0
  let lastKey = 0
  for (let r = 0; r < R; r++)
    for (let c = 0; c < C; c++) {
      const d = tileDelay(x, y, (c + 0.5) * tw, (r + 0.5) * th, w, h, spread)
      if (d >= last) {
        last = d
        lastKey = r * C + c
      }
      cells.push({ r, c, d })
    }
  const piece = (src: string, r: number, c: number) => (
    <img className="tf-piece" src={src} alt="" draggable={false} style={{ width: w, height: h, left: -c * tw, top: -r * th }} />
  )
  return (
    <div className="tf-in" aria-hidden="true" data-dir={dir >= 0 ? "1" : "-1"} style={{ ["--tf-flip" as string]: flip + "ms" }}>
      {cells.map(({ r, c, d }) => (
        <div
          key={r * C + c}
          className="tf-tile"
          style={{ left: c * tw, top: r * th, width: Math.ceil(tw) + 1, height: Math.ceil(th) + 1, animationDelay: d + "ms" }}
          onAnimationEnd={r * C + c === lastKey ? onDone : undefined}
        >
          <div className="tf-face">{piece(from, r, c)}</div>
          <div className="tf-face tf-back">{piece(to, r, c)}</div>
        </div>
      ))}
    </div>
  )
}

const TF_CSS = [
  ".tf-root{position:relative;width:100%;overflow:hidden;background:#0d0d0f;color:var(--tf-ink);user-select:none;-webkit-user-select:none;touch-action:pan-y;outline:none;cursor:pointer}",
  ".tf-root:focus-visible{box-shadow:inset 0 0 0 2px var(--tf-ink)}",
  ".tf-base{position:absolute;inset:0}",
  ".tf-img{position:absolute;inset:0;width:100%;height:100%;max-width:none;object-fit:cover;display:block;pointer-events:none}",
  ".tf-in{position:absolute;inset:0;perspective:1600px;pointer-events:none}",
  ".tf-tile{position:absolute;transform-style:preserve-3d;animation:tf-flip var(--tf-flip) cubic-bezier(.3,.7,.2,1) both}",
  ".tf-in[data-dir='-1'] .tf-tile{animation-name:tf-flip-back}",
  ".tf-face{position:absolute;inset:0;overflow:hidden;backface-visibility:hidden;-webkit-backface-visibility:hidden}",
  ".tf-back{transform:rotateY(180deg)}",
  ".tf-in[data-dir='-1'] .tf-back{transform:rotateY(-180deg)}",
  ".tf-piece{position:absolute;max-width:none;object-fit:cover;display:block}",
  "@keyframes tf-flip{from{transform:none}to{transform:rotateY(180deg)}}",
  "@keyframes tf-flip-back{from{transform:none}to{transform:rotateY(-180deg)}}",
  "@media (prefers-reduced-motion:reduce){.tf-tile{animation:tf-fade .3s ease both!important;animation-delay:0s!important}.tf-face:not(.tf-back){display:none}.tf-back{transform:none!important}}",
  "@keyframes tf-fade{from{opacity:0}to{opacity:1}}",
  ".tf-shade{position:absolute;inset:auto 0 0 0;height:46%;background:linear-gradient(to top,rgba(0,0,0,.6),rgba(0,0,0,0));pointer-events:none}",
  ".tf-text{position:absolute;left:clamp(20px,4vw,56px);bottom:clamp(44px,8vh,80px);right:clamp(140px,20vw,280px);pointer-events:none}",
  ".tf-line{display:block;overflow:hidden;padding-bottom:.08em}",
  ".tf-line>span{display:block;animation:tf-rise .9s cubic-bezier(.2,.8,.2,1) both}",
  ".tf-title{font:500 clamp(34px,6vw,84px)/1 ui-serif,Georgia,'Times New Roman',serif;letter-spacing:-.02em}",
  ".tf-cap{margin-top:12px;font:400 14px/1.4 ui-sans-serif,system-ui,sans-serif;opacity:.82;max-width:44ch}",
  ".tf-cap>span{animation-delay:.08s}",
  ".tf-nav{position:absolute;right:clamp(20px,4vw,56px);bottom:clamp(44px,8vh,80px);display:flex;align-items:center;gap:14px;cursor:default}",
  ".tf-count{font:500 12px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.14em}",
  ".tf-btn{appearance:none;width:44px;height:44px;border-radius:50%;border:1px solid color-mix(in srgb,var(--tf-ink) 45%,transparent);background:transparent;color:inherit;display:grid;place-items:center;cursor:pointer;transition:background .2s ease,color .2s ease}",
  ".tf-btn:hover{background:var(--tf-ink);color:#0d0d0f}",
  ".tf-btn:focus-visible{outline:2px solid var(--tf-ink);outline-offset:2px}",
  ".tf-track{position:absolute;left:clamp(20px,4vw,56px);right:clamp(20px,4vw,56px);bottom:clamp(20px,3.5vh,36px);height:1px;background:color-mix(in srgb,var(--tf-ink) 28%,transparent)}",
  ".tf-fill{height:100%;background:var(--tf-ink);transform-origin:left;transform:scaleX(0)}",
  ".tf-fill[data-run='1']{animation:tf-auto var(--tf-auto) linear forwards}",
  ".tf-root[data-paused='1'] .tf-fill{animation-play-state:paused}",
  ".tf-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}",
  "@keyframes tf-rise{from{transform:translateY(105%)}to{transform:none}}",
  "@keyframes tf-auto{to{transform:scaleX(1)}}",
  "@media (prefers-reduced-motion:reduce){.tf-line>span{animation:none}}",
].join("\n")

export default function TileFlipCarousel({
  slides = DEFAULT_SLIDES,
  height = "100svh",
  duration = 1500,
  cols = 10,
  rows = 6,
  autoplay = 6000,
  ink = "#ffffff",
  onChange,
  className,
  style,
  ariaLabel = "Image carousel",
}: TileFlipCarouselProps) {
  const opts = { cols, rows }
  const n = slides.length
  const srcs = useSlideImages(slides)
  const [index, setIndex] = React.useState(0)
  const [incoming, setIncoming] = React.useState(null as null | { to: number; dir: number; x: number; y: number; w: number; h: number; id: number })
  const [paused, setPaused] = React.useState(false)
  const rootRef = React.useRef(null as HTMLDivElement | null)
  const down = React.useRef(null as null | { x: number; y: number })
  const seq = React.useRef(0)

  const go = (dir: number, px?: number, py?: number) => {
    const root = rootRef.current
    if (!root || incoming || n < 2) return
    const w = root.clientWidth
    const h = root.clientHeight
    seq.current += 1
    const [dx, dy] = defaultOrigin(dir, w, h, (seq.current * 0.618) % 1)
    setIncoming({ to: wrap(index + dir, n), dir, x: px ?? dx, y: py ?? dy, w, h, id: Date.now() })
  }
  const commit = () => {
    if (!incoming) return
    setIndex(incoming.to)
    setIncoming(null)
  }

  React.useEffect(() => {
    onChange?.(index)
  }, [index, onChange])

  // warm the cache so a tap starts its transition at once
  React.useEffect(() => {
    srcs.forEach((src) => {
      if (src) new Image().src = src
    })
  }, [srcs.join("|")]) // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    const root = rootRef.current
    if (!root) return
    let seen = true
    const sync = () => setPaused(!seen || document.hidden)
    const io = new IntersectionObserver(([e]) => {
      seen = e.isIntersecting
      sync()
    })
    io.observe(root)
    document.addEventListener("visibilitychange", sync)
    return () => {
      io.disconnect()
      document.removeEventListener("visibilitychange", sync)
    }
  }, [])

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") go(1)
    else if (e.key === "ArrowLeft") go(-1)
    else return
    e.preventDefault()
  }
  const onDown = (e: React.PointerEvent) => {
    down.current = { x: e.clientX, y: e.clientY }
  }
  const onUp = (e: React.PointerEvent) => {
    const s = down.current
    down.current = null
    if (!s || !rootRef.current) return
    const dx = e.clientX - s.x
    const b = rootRef.current.getBoundingClientRect()
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(e.clientY - s.y)) go(dx < 0 ? 1 : -1)
    else if (Math.abs(dx) < 8) go(1, e.clientX - b.left, e.clientY - b.top)
  }
  const stop = (e: React.PointerEvent) => e.stopPropagation()

  const shown = incoming ? incoming.to : index
  const s = slides[shown] || {}

  return (
    <div
      ref={rootRef}
      className={["tf-root", className].filter(Boolean).join(" ")}
      style={{ height, ["--tf-ink" as string]: ink, ["--tf-auto" as string]: autoplay + "ms", ...style }}
      data-paused={paused ? "1" : "0"}
      role="region"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      tabIndex={0}
      onKeyDown={onKey}
      onPointerDown={onDown}
      onPointerUp={onUp}
    >
      <style>{TF_CSS}</style>
      <div className="tf-base">
        {srcs[index] ? <img className="tf-img" src={srcs[index]} alt={slides[index]?.alt || slides[index]?.title || ""} draggable={false} /> : null}
      </div>
      {incoming && srcs[index] && srcs[incoming.to] ? (
        <Layer
          key={incoming.id}
          from={srcs[index]}
          to={srcs[incoming.to]}
          x={incoming.x}
          y={incoming.y}
          w={incoming.w}
          h={incoming.h}
          dir={incoming.dir}
          duration={duration}
          opts={opts}
          onDone={commit}
        />
      ) : null}
      <div className="tf-shade" aria-hidden="true" />
      <div className="tf-text" key={"t" + shown} aria-hidden="true">
        {s.title ? (
          <span className="tf-line tf-title">
            <span>{s.title}</span>
          </span>
        ) : null}
        {s.caption ? (
          <span className="tf-line tf-cap">
            <span>{s.caption}</span>
          </span>
        ) : null}
      </div>
      <div className="tf-nav" onPointerDown={stop} onPointerUp={stop}>
        <span className="tf-count" aria-hidden="true">
          {pad2(shown + 1)} / {pad2(n)}
        </span>
        <button type="button" className="tf-btn" aria-label="Previous" onClick={() => go(-1)}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M10 3 5 8l5 5" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </button>
        <button type="button" className="tf-btn" aria-label="Next" onClick={() => go(1)}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="m6 3 5 5-5 5" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </button>
      </div>
      <div className="tf-track" aria-hidden="true">
        <div key={"f" + index} className="tf-fill" data-run={autoplay > 0 && n > 1 && !incoming ? "1" : "0"} onAnimationEnd={() => go(1)} />
      </div>
      <div className="tf-sr" aria-live="polite">
        {"Slide " + (shown + 1) + " of " + n + (s.title ? ": " + s.title : "")}
      </div>
    </div>
  )
}
