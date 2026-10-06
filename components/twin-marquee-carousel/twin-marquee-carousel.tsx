"use client"

import * as React from "react"

/*
 * Twin Marquee Carousel — two rows of photos drifting in opposite directions,
 * endlessly. Hover the band and both rows stop; the photo under the pointer
 * lifts while the rest fade back. Click (or press Enter on) a photo to open
 * it full size; ←/→ step through, Esc or a click closes.
 *
 * Slides without an `image` get a painted landscape, so it works with no
 * assets at all. Page colours follow the theme tokens.
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

export type TwinMarqueeCarouselProps = {
  slides?: Slide[]
  /** Any CSS length. Default 100svh. */
  height?: number | string
  /** Height of a photo, any CSS length. */
  cardHeight?: string
  /** Seconds a photo takes to drift past its own width; higher is slower. */
  speed?: number
  background?: string
  ink?: string
  onOpen?: (index: number) => void
  className?: string
  style?: React.CSSProperties
  ariaLabel?: string
}

// #region logic
export function wrap(i: number, n: number): number {
  return n ? ((i % n) + n) % n : 0
}

/** The two rows: all slides in order, then all slides reversed and rotated by half. */
export function rowOrders(n: number): [number[], number[]] {
  const a = Array.from({ length: n }, (_, i) => i)
  const b = a.slice().reverse()
  const k = Math.floor(n / 2)
  return [a, b.slice(k).concat(b.slice(0, k))]
}

/** Loop duration in seconds for a row of n photos. */
export function loopSeconds(n: number, speed: number): number {
  return Math.max(8, n * speed)
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

const TM_CSS = [
  ".tm-root{position:relative;width:100%;display:flex;flex-direction:column;justify-content:center;gap:clamp(12px,2.4vh,22px);overflow:hidden;background:var(--tm-bg);color:var(--tm-ink)}",
  ".tm-row{display:flex;gap:clamp(12px,2.4vh,22px);width:max-content;animation:tm-slide var(--tm-dur) linear infinite;will-change:transform}",
  ".tm-row[data-rev='1']{animation-direction:reverse;animation-duration:calc(var(--tm-dur) * 1.17)}",
  ".tm-root:hover .tm-row,.tm-root:focus-within .tm-row,.tm-root[data-paused='1'] .tm-row{animation-play-state:paused}",
  ".tm-card{appearance:none;flex:none;position:relative;height:var(--tm-ch);aspect-ratio:3/2;padding:0;border:0;border-radius:4px;overflow:hidden;background:var(--tm-line);cursor:zoom-in;transition:transform .45s cubic-bezier(.2,.7,.2,1),filter .45s ease,box-shadow .45s ease}",
  ".tm-card img{position:absolute;inset:0;width:100%;height:100%;max-width:none;object-fit:cover;display:block;pointer-events:none}",
  ".tm-root:hover .tm-card{filter:grayscale(.7) brightness(.9)}",
  ".tm-root .tm-card:hover,.tm-root .tm-card:focus-visible{filter:none;transform:translateY(-6px) scale(1.1);z-index:2;box-shadow:0 30px 50px -25px rgba(0,0,0,.6)}",
  ".tm-card:focus-visible{outline:2px solid var(--tm-ink);outline-offset:3px}",
  ".tm-tag{position:absolute;left:10px;bottom:8px;font:500 12px/1.2 ui-serif,Georgia,'Times New Roman',serif;color:#fff;text-shadow:0 1px 8px rgba(0,0,0,.7);opacity:0;transform:translateY(4px);transition:opacity .3s ease,transform .3s ease}",
  ".tm-card:hover .tm-tag,.tm-card:focus-visible .tm-tag{opacity:1;transform:none}",
  ".tm-box{position:fixed;inset:0;z-index:60;display:grid;place-items:center;padding:clamp(16px,5vw,64px);background:rgba(10,10,10,.92);cursor:zoom-out;animation:tm-in .35s ease}",
  ".tm-box figure{margin:0;display:grid;gap:12px;justify-items:center;max-width:100%}",
  ".tm-box img{max-width:min(92vw,1600px);max-height:78vh;width:auto;height:auto;border-radius:4px;display:block;animation:tm-zoom .45s cubic-bezier(.2,.7,.2,1)}",
  ".tm-box figcaption{color:#f2efe8;text-align:center;font:500 18px/1.3 ui-serif,Georgia,'Times New Roman',serif}",
  ".tm-box figcaption small{display:block;margin-top:4px;font:400 13px/1.4 ui-sans-serif,system-ui,sans-serif;opacity:.7}",
  "@keyframes tm-slide{to{transform:translateX(-50%)}}",
  "@keyframes tm-in{from{opacity:0}}",
  "@keyframes tm-zoom{from{transform:scale(.94);opacity:0}}",
  "@media (prefers-reduced-motion:reduce){.tm-root{overflow-x:auto}.tm-row{animation:none}.tm-box,.tm-box img{animation:none}}",
].join("\n")

export default function TwinMarqueeCarousel({
  slides = DEFAULT_SLIDES,
  height = "100svh",
  cardHeight = "min(28vh, 260px)",
  speed = 7,
  background = "var(--color-background, #f2efe8)",
  ink = "var(--color-foreground, #161513)",
  onOpen,
  className,
  style,
  ariaLabel = "Photo marquee",
}: TwinMarqueeCarouselProps) {
  const n = slides.length
  const srcs = useSlideImages(slides)
  const [open, setOpen] = React.useState(-1)
  const [paused, setPaused] = React.useState(false)
  const rootRef = React.useRef(null as HTMLDivElement | null)
  const rows = rowOrders(n)

  // stop drifting off-screen
  React.useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const io = new IntersectionObserver(([e]) => setPaused(!e.isIntersecting))
    io.observe(root)
    return () => io.disconnect()
  }, [])

  React.useEffect(() => {
    if (open < 0) return
    onOpen?.(open)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(-1)
      else if (e.key === "ArrowRight") setOpen((i) => wrap(i + 1, n))
      else if (e.key === "ArrowLeft") setOpen((i) => wrap(i - 1, n))
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, n, onOpen])

  const o = open >= 0 ? slides[open] || {} : null

  return (
    <div
      ref={rootRef}
      className={["tm-root", className].filter(Boolean).join(" ")}
      style={{
        height,
        ["--tm-bg" as string]: background,
        ["--tm-ink" as string]: ink,
        ["--tm-line" as string]: "color-mix(in srgb, var(--tm-ink) 12%, transparent)",
        ["--tm-ch" as string]: cardHeight,
        ["--tm-dur" as string]: loopSeconds(n, speed) + "s",
        ...style,
      }}
      data-paused={paused || open >= 0 ? "1" : "0"}
      role="region"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
    >
      <style>{TM_CSS}</style>
      {rows.map((order, r) => (
        <div key={r} className="tm-row" data-rev={r ? "1" : "0"}>
          {order.concat(order).map((i, k) => {
            const sl = slides[i] || {}
            const copy = k >= order.length
            return (
              <button
                key={k}
                type="button"
                className="tm-card"
                tabIndex={copy || r ? -1 : 0}
                aria-hidden={copy || r ? true : undefined}
                aria-label={"Open " + (sl.title || "photo " + (i + 1))}
                onClick={() => setOpen(i)}
              >
                {srcs[i] ? <img src={srcs[i]} alt="" draggable={false} loading="lazy" /> : null}
                {sl.title ? <span className="tm-tag">{sl.title}</span> : null}
              </button>
            )
          })}
        </div>
      ))}
      {o ? (
        <div className="tm-box" role="dialog" aria-modal="true" aria-label={o.title || "Photo"} onClick={() => setOpen(-1)}>
          <figure>
            {srcs[open] ? <img key={open} src={srcs[open]} alt={o.alt || o.title || ""} /> : null}
            {o.title || o.caption ? (
              <figcaption>
                {o.title}
                {o.caption ? <small>{o.caption}</small> : null}
              </figcaption>
            ) : null}
          </figure>
        </div>
      ) : null}
      <div style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }} aria-live="polite">
        {o ? "Opened " + (o.title || "photo " + (open + 1)) + ", " + (open + 1) + " of " + n : ""}
      </div>
    </div>
  )
}
