"use client"

import * as React from "react"

/*
 * Split Pane Carousel — a full-bleed image carousel where a hairline seam
 * draws down the middle of the picture, then the two halves slide apart like
 * doors to reveal the next picture settling in underneath. Split vertically
 * or horizontally.
 *
 * Arrows, swipe, ←/→ and autoplay. Slides without an `image` get a painted
 * landscape, so it works with no assets at all.
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

export type SplitPaneCarouselProps = {
  slides?: Slide[]
  /** Any CSS length. Default 100svh. */
  height?: number | string
  /** ms for the seam to draw and the halves to part. */
  duration?: number
  /** Split down the middle ("vertical") or across it ("horizontal"). */
  axis?: "vertical" | "horizontal"
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

/** clip-path insets of the two halves for a split along the axis. */
export function halves(axis: string): [string, string] {
  return axis === "horizontal" ? ["inset(0 0 50% 0)", "inset(50% 0 0 0)"] : ["inset(0 50% 0 0)", "inset(0 0 0 50%)"]
}

/** Where each half slides to. */
export function partTo(axis: string, h: number): string {
  const d = h ? "56%" : "-56%"
  return axis === "horizontal" ? "translateY(" + d + ")" : "translateX(" + d + ")"
}

export function pad2(n: number): string {
  return n < 10 ? "0" + n : String(n)
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

const SP_CSS = [
  ".sp-root{position:relative;width:100%;overflow:hidden;background:#0d0d0f;color:var(--sp-ink);user-select:none;-webkit-user-select:none;touch-action:pan-y;outline:none}",
  ".sp-root:focus-visible{box-shadow:inset 0 0 0 2px var(--sp-ink)}",
  ".sp-base{position:absolute;inset:0;transition:filter .9s ease,transform 1.4s cubic-bezier(.2,.7,.2,1)}",
  ".sp-root[data-moving='1'] .sp-base{filter:brightness(.42);transform:scale(1.04)}",
  ".sp-img{position:absolute;inset:0;width:100%;height:100%;max-width:none;object-fit:cover;display:block;pointer-events:none}",
  ".sp-in{position:absolute;inset:0;overflow:hidden}",
  ".sp-under{position:absolute;inset:0;animation:sp-settle var(--sp-d) cubic-bezier(.2,.7,.2,1) both}",
  ".sp-half{position:absolute;inset:0;animation:sp-part var(--sp-d) cubic-bezier(.7,0,.2,1) both}",
  ".sp-seam{position:absolute;background:var(--sp-ink);box-shadow:0 0 12px var(--sp-ink);animation:sp-seam var(--sp-d) ease both}",
  ".sp-in[data-axis='vertical'] .sp-seam{left:50%;top:0;bottom:0;width:1px;transform-origin:50% 0}",
  ".sp-in[data-axis='horizontal'] .sp-seam{top:50%;left:0;right:0;height:1px;transform-origin:0 50%}",
  ".sp-shade{position:absolute;inset:auto 0 0 0;height:46%;background:linear-gradient(to top,rgba(0,0,0,.6),rgba(0,0,0,0));pointer-events:none}",
  ".sp-text{position:absolute;left:clamp(20px,4vw,56px);bottom:clamp(44px,8vh,80px);right:clamp(140px,20vw,280px);pointer-events:none}",
  ".sp-line{display:block;overflow:hidden;padding-bottom:.08em}",
  ".sp-line>span{display:block;animation:sp-rise .9s cubic-bezier(.2,.8,.2,1) both}",
  ".sp-title{font:500 clamp(34px,6vw,84px)/1 ui-serif,Georgia,'Times New Roman',serif;letter-spacing:-.02em}",
  ".sp-cap{margin-top:12px;font:400 14px/1.4 ui-sans-serif,system-ui,sans-serif;opacity:.82;max-width:44ch}",
  ".sp-cap>span{animation-delay:.08s}",
  ".sp-nav{position:absolute;right:clamp(20px,4vw,56px);bottom:clamp(44px,8vh,80px);display:flex;align-items:center;gap:14px}",
  ".sp-count{font:500 12px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.14em}",
  ".sp-btn{appearance:none;width:44px;height:44px;border-radius:50%;border:1px solid color-mix(in srgb,var(--sp-ink) 45%,transparent);background:transparent;color:inherit;display:grid;place-items:center;cursor:pointer;transition:background .2s ease,color .2s ease}",
  ".sp-btn:hover{background:var(--sp-ink);color:#0d0d0f}",
  ".sp-btn:focus-visible{outline:2px solid var(--sp-ink);outline-offset:2px}",
  ".sp-track{position:absolute;left:clamp(20px,4vw,56px);right:clamp(20px,4vw,56px);bottom:clamp(20px,3.5vh,36px);height:1px;background:color-mix(in srgb,var(--sp-ink) 28%,transparent)}",
  ".sp-fill{height:100%;background:var(--sp-ink);transform-origin:left;transform:scaleX(0)}",
  ".sp-fill[data-run='1']{animation:sp-fill var(--sp-auto) linear forwards}",
  ".sp-root[data-paused='1'] .sp-fill{animation-play-state:paused}",
  ".sp-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}",
  "@keyframes sp-settle{from{transform:scale(1.14);filter:brightness(.55)}30%{transform:scale(1.14);filter:brightness(.55)}to{transform:none;filter:none}}",
  "@keyframes sp-part{0%,26%{transform:none;filter:none}to{transform:var(--sp-to);filter:brightness(.35)}}",
  "@keyframes sp-seam{0%{transform:var(--sp-from);opacity:1}24%{transform:none;opacity:1}42%,to{transform:none;opacity:0}}",
  "@keyframes sp-out{to{opacity:0}}",
  "@keyframes sp-rise{from{transform:translateY(105%)}to{transform:none}}",
  "@keyframes sp-fill{to{transform:scaleX(1)}}",
  "@keyframes sp-fade{from{opacity:0}to{opacity:1}}",
  "@media (prefers-reduced-motion:reduce){.sp-half{animation-name:sp-out}.sp-seam{display:none}.sp-under{animation:none}.sp-line>span{animation:none}.sp-base{transition:none}}",
].join("\n")

export default function SplitPaneCarousel({
  slides = DEFAULT_SLIDES,
  height = "100svh",
  duration = 1250,
  axis = "vertical",
  autoplay = 6000,
  ink = "#ffffff",
  onChange,
  className,
  style,
  ariaLabel = "Image carousel",
}: SplitPaneCarouselProps) {
  const n = slides.length
  const srcs = useSlideImages(slides)
  const [index, setIndex] = React.useState(0)
  const [incoming, setIncoming] = React.useState(null as null | { to: number; dir: number; id: number })
  const [paused, setPaused] = React.useState(false)
  const rootRef = React.useRef(null as HTMLDivElement | null)
  const down = React.useRef(null as null | { x: number; y: number })

  const go = (dir: number) => {
    if (incoming || n < 2) return
    setIncoming({ to: wrap(index + dir, n), dir, id: Date.now() })
  }
  const commit = () => {
    if (!incoming) return
    setIndex(incoming.to)
    setIncoming(null)
  }

  React.useEffect(() => {
    onChange?.(index)
  }, [index, onChange])

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
    if (!s) return
    const dx = e.clientX - s.x
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(e.clientY - s.y)) go(dx < 0 ? 1 : -1)
  }

  const shown = incoming ? incoming.to : index
  const s = slides[shown] || {}

  return (
    <div
      ref={rootRef}
      className={["sp-root", className].filter(Boolean).join(" ")}
      style={{ height, ["--sp-ink" as string]: ink, ["--sp-d" as string]: duration + "ms", ["--sp-auto" as string]: autoplay + "ms", ...style }}
      data-moving={incoming ? "1" : "0"}
      data-paused={paused ? "1" : "0"}
      role="region"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      tabIndex={0}
      onKeyDown={onKey}
      onPointerDown={onDown}
      onPointerUp={onUp}
    >
      <style>{SP_CSS}</style>
      <div className="sp-base">
        {srcs[index] ? <img className="sp-img" src={srcs[index]} alt={slides[index]?.alt || slides[index]?.title || ""} draggable={false} /> : null}
      </div>
      {incoming ? (
        <div className="sp-in" key={incoming.id} data-axis={axis} aria-hidden="true">
          <div className="sp-under">{srcs[incoming.to] ? <img className="sp-img" src={srcs[incoming.to]} alt="" draggable={false} /> : null}</div>
          {halves(axis).map((clip, h) => (
            <div
              key={h}
              className="sp-half"
              style={{ clipPath: clip, ["--sp-to" as string]: partTo(axis, h) }}
              onAnimationEnd={h ? undefined : (e) => e.target === e.currentTarget && commit()}
            >
              {srcs[index] ? <img className="sp-img" src={srcs[index]} alt="" draggable={false} /> : null}
            </div>
          ))}
          <div className="sp-seam" style={{ ["--sp-from" as string]: axis === "horizontal" ? "scale(0,1)" : "scale(1,0)" }} />
        </div>
      ) : null}
      <div className="sp-shade" aria-hidden="true" />
      <div className="sp-text" key={"t" + shown} aria-hidden="true">
        {s.title ? (
          <span className="sp-line sp-title">
            <span>{s.title}</span>
          </span>
        ) : null}
        {s.caption ? (
          <span className="sp-line sp-cap">
            <span>{s.caption}</span>
          </span>
        ) : null}
      </div>
      <div className="sp-nav">
        <span className="sp-count" aria-hidden="true">
          {pad2(shown + 1)} / {pad2(n)}
        </span>
        <button type="button" className="sp-btn" aria-label="Previous" onClick={() => go(-1)} onPointerDown={(e) => e.stopPropagation()}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M10 3 5 8l5 5" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </button>
        <button type="button" className="sp-btn" aria-label="Next" onClick={() => go(1)} onPointerDown={(e) => e.stopPropagation()}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="m6 3 5 5-5 5" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </button>
      </div>
      <div className="sp-track" aria-hidden="true">
        <div key={"f" + index} className="sp-fill" data-run={autoplay > 0 && n > 1 && !incoming ? "1" : "0"} onAnimationEnd={() => go(1)} />
      </div>
      <div className="sp-sr" aria-live="polite">
        {"Slide " + (shown + 1) + " of " + n + (s.title ? ": " + s.title : "")}
      </div>
    </div>
  )
}
