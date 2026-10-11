"use client"

import * as React from "react"

/*
 * Scrubber Carousel — a full-bleed picture with a video-style timeline. Move
 * across the picture (or drag on touch) and the photos flick past like
 * scrubbing through footage, with a playhead, a ticking timecode and the
 * frame's title. Left alone, it plays slowly on its own.
 *
 * Hover or drag to scrub, ←/→ to step a frame. Slides without an `image` get
 * a painted landscape, so it works with no assets at all.
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

export type ScrubberCarouselProps = {
  slides?: Slide[]
  /** Any CSS length. Default 100svh. */
  height?: number | string
  /** ms each photo plays for when nobody is scrubbing; 0 turns playback off. */
  autoplay?: number
  /** Frame rate the timecode counts in. */
  fps?: number
  /** Colour of the timeline, timecode and text. */
  ink?: string
  onChange?: (index: number) => void
  className?: string
  style?: React.CSSProperties
  ariaLabel?: string
}

// #region logic
export function clamp01(v: number): number {
  return Math.min(0.9999, Math.max(0, v))
}

/** The photo under playhead position p (0..1). */
export function frameAt(p: number, n: number): number {
  return Math.min(n - 1, Math.floor(clamp01(p) * n))
}

/** Playhead position at the middle of photo i. */
export function centerOf(i: number, n: number): number {
  return (i + 0.5) / n
}

/** Timecode for playhead p when each photo lasts one second: MM:SS:FF. */
export function timecode(p: number, n: number, fps: number): string {
  const f = Math.floor(clamp01(p) * n * fps)
  const two = (v: number) => (v < 10 ? "0" : "") + v
  return two(Math.floor(f / fps / 60)) + ":" + two(Math.floor(f / fps) % 60) + ":" + two(f % fps)
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

const SC_CSS = [
  ".sc-root{position:relative;width:100%;overflow:hidden;background:#0d0d0f;color:var(--sc-ink);user-select:none;-webkit-user-select:none;touch-action:pan-y;outline:none;cursor:ew-resize}",
  ".sc-root:focus-visible{box-shadow:inset 0 0 0 2px var(--sc-ink)}",
  ".sc-img{position:absolute;inset:0;width:100%;height:100%;max-width:none;object-fit:cover;display:block;pointer-events:none;opacity:0}",
  ".sc-img[data-on='1']{opacity:1}",
  ".sc-shade{position:absolute;inset:auto 0 0 0;height:50%;background:linear-gradient(to top,rgba(0,0,0,.62),rgba(0,0,0,0));pointer-events:none}",
  ".sc-top{position:absolute;left:clamp(20px,4vw,56px);right:clamp(20px,4vw,56px);top:clamp(18px,3.5vh,32px);display:flex;justify-content:space-between;align-items:center;font:500 12px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.14em;text-shadow:0 1px 8px rgba(0,0,0,.5);pointer-events:none}",
  ".sc-rec{display:flex;align-items:center;gap:8px}",
  ".sc-rec i{width:8px;height:8px;border-radius:50%;background:#ff4d3d;box-shadow:0 0 10px #ff4d3d;animation:sc-blink 1.2s steps(2) infinite}",
  ".sc-root[data-scrub='1'] .sc-rec i{animation:none;background:var(--sc-ink);box-shadow:none}",
  ".sc-text{position:absolute;left:clamp(20px,4vw,56px);right:clamp(20px,4vw,56px);bottom:calc(clamp(20px,3.5vh,36px) + 64px);pointer-events:none}",
  ".sc-title{display:block;font:500 clamp(30px,5.5vw,76px)/1 ui-serif,Georgia,'Times New Roman',serif;letter-spacing:-.02em;padding-bottom:.08em}",
  ".sc-cap{display:block;margin-top:10px;font:400 14px/1.4 ui-sans-serif,system-ui,sans-serif;opacity:.82;max-width:44ch}",
  ".sc-bar{position:absolute;left:clamp(20px,4vw,56px);right:clamp(20px,4vw,56px);bottom:clamp(20px,3.5vh,36px);height:48px}",
  ".sc-ticks{position:absolute;left:0;right:0;bottom:0;height:22px;background:repeating-linear-gradient(90deg,color-mix(in srgb,var(--sc-ink) 50%,transparent) 0 1px,transparent 1px 8px);-webkit-mask:linear-gradient(transparent,#000);mask:linear-gradient(transparent,#000)}",
  ".sc-cut{position:absolute;bottom:0;width:1px;height:32px;background:var(--sc-ink);opacity:.7}",
  ".sc-cut b{position:absolute;left:6px;top:0;font:500 10px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.1em;opacity:.8}",
  ".sc-head{position:absolute;bottom:0;width:2px;height:48px;margin-left:-1px;background:var(--sc-ink);box-shadow:0 0 12px var(--sc-ink)}",
  ".sc-head::before{content:'';position:absolute;left:-4px;top:-6px;border:5px solid transparent;border-top-color:var(--sc-ink)}",
  ".sc-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}",
  "@keyframes sc-blink{50%{opacity:.15}}",
  "@media (prefers-reduced-motion:reduce){.sc-rec i{animation:none}}",
].join("\n")

export default function ScrubberCarousel({
  slides = DEFAULT_SLIDES,
  height = "100svh",
  autoplay = 3200,
  fps = 24,
  ink = "#ffffff",
  onChange,
  className,
  style,
  ariaLabel = "Image carousel",
}: ScrubberCarouselProps) {
  const n = slides.length
  const srcs = useSlideImages(slides)
  const [p, setP] = React.useState(0)
  const [scrubbing, setScrubbing] = React.useState(false)
  const rootRef = React.useRef(null as HTMLDivElement | null)
  const barRef = React.useRef(null as HTMLDivElement | null)
  const pRef = React.useRef(0)
  pRef.current = p
  const lastTouch = React.useRef(-1e9)
  const drag = React.useRef(false)
  const idle = React.useRef(0)
  const frame = frameAt(p, n)

  React.useEffect(() => {
    onChange?.(frame)
  }, [frame, onChange])

  // slow playback when nobody is scrubbing
  React.useEffect(() => {
    if (!autoplay || n < 2) return
    const root = rootRef.current
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    let seen = true
    const io = new IntersectionObserver(([e]) => (seen = e.isIntersecting))
    if (root) io.observe(root)
    let raf = 0
    let prev = performance.now()
    let held = 0
    const tick = (now: number) => {
      const dt = Math.min(100, now - prev)
      prev = now
      if (seen && !document.hidden && now - lastTouch.current > 2200) {
        if (reduce) {
          held += dt
          if (held >= autoplay) {
            held = 0
            setP(centerOf((frameAt(pRef.current, n) + 1) % n, n))
          }
        } else setP((v) => (v + dt / (autoplay * n)) % 1)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
    }
  }, [autoplay, n])

  const fromEvent = (e: React.PointerEvent) => {
    const b = barRef.current!.getBoundingClientRect()
    return (e.clientX - b.left) / b.width
  }
  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" || drag.current) {
      lastTouch.current = performance.now()
      setP(clamp01(fromEvent(e)))
      setScrubbing(true)
      window.clearTimeout(idle.current)
      if (!drag.current) idle.current = window.setTimeout(() => setScrubbing(false), 900)
    }
  }
  const onDown = (e: React.PointerEvent) => {
    lastTouch.current = performance.now()
    drag.current = true
    setScrubbing(true)
    if (e.pointerType !== "mouse") rootRef.current?.setPointerCapture(e.pointerId)
    setP(clamp01(fromEvent(e)))
  }
  const onUp = () => {
    drag.current = false
    window.clearTimeout(idle.current)
    idle.current = window.setTimeout(() => setScrubbing(false), 900)
    lastTouch.current = performance.now()
  }
  const onKey = (e: React.KeyboardEvent) => {
    let d = 0
    if (e.key === "ArrowRight") d = 1
    else if (e.key === "ArrowLeft") d = -1
    else return
    e.preventDefault()
    lastTouch.current = performance.now()
    setP(centerOf((frame + d + n) % n, n))
  }

  const s = slides[frame] || {}

  return (
    <div
      ref={rootRef}
      className={["sc-root", className].filter(Boolean).join(" ")}
      style={{ height, ["--sc-ink" as string]: ink, ...style }}
      data-scrub={scrubbing ? "1" : "0"}
      role="region"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      tabIndex={0}
      onKeyDown={onKey}
      onPointerMove={onMove}
      onPointerDown={onDown}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onPointerLeave={() => !drag.current && (lastTouch.current = performance.now())}
    >
      <style>{SC_CSS}</style>
      {slides.map((sl, i) =>
        srcs[i] ? <img key={i} className="sc-img" src={srcs[i]} alt={i === frame ? sl.alt || sl.title || "" : ""} data-on={i === frame ? "1" : "0"} draggable={false} /> : null,
      )}
      <div className="sc-shade" aria-hidden="true" />
      <div className="sc-top" aria-hidden="true">
        <span className="sc-rec">
          <i />
          {scrubbing ? "SCRUB" : "PLAY"}
        </span>
        <span>
          {timecode(p, n, fps)} · {String(frame + 1).padStart(2, "0")}/{String(n).padStart(2, "0")}
        </span>
      </div>
      <div className="sc-text" aria-hidden="true">
        {s.title ? <span className="sc-title">{s.title}</span> : null}
        {s.caption ? <span className="sc-cap">{s.caption}</span> : null}
      </div>
      <div ref={barRef} className="sc-bar" aria-hidden="true">
        <div className="sc-ticks" />
        {slides.map((sl, i) => (
          <div key={i} className="sc-cut" style={{ left: (i / n) * 100 + "%" }}>
            <b>{String(i + 1).padStart(2, "0")}</b>
          </div>
        ))}
        <div className="sc-head" style={{ left: p * 100 + "%" }} />
      </div>
      <div className="sc-sr" aria-live="polite">
        {"Photo " + (frame + 1) + " of " + n + (s.title ? ": " + s.title : "")}
      </div>
    </div>
  )
}
