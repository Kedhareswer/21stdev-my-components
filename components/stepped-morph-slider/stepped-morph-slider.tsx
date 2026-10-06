"use client"

// An image slider whose window is a stepped, skyline-like mask. Every slide
// has its own blocky shape; going to the next one morphs the mask column by
// column into the new shape while the picture cross-fades and drifts. Hover
// lifts the column under the pointer; click, drag, swipe, the arrows, the dots
// or ←/→ move between slides, and autoplay runs a progress line.
//
// Slides without an image get one painted on a canvas — abstract architecture
// (lit beams, glass grids, film grain) — so it works with no assets at all.
//
// No dependencies. React is the only import.

import React from "react"

export type SteppedSlide = {
  /** Image URL. Omit to use a painted architecture abstract. */
  image?: string
  title: string
  caption?: string
  /** Seed for this slide's shape (and painted image). */
  seed?: number
  /** Palette for the painted image: "concrete" | "dusk" | "glass" | "rose". */
  palette?: ArchPalette
}

export type ArchPalette = "concrete" | "dusk" | "glass" | "rose"

export type SteppedMorphSliderProps = {
  slides?: SteppedSlide[]
  /** Columns in every shape. More = finer steps. */
  columns?: number
  /** Milliseconds between slides; 0 = no autoplay. */
  autoplay?: number
  /** Morph duration, ms. */
  duration?: number
  /** Width / height of the image window. */
  aspect?: number
  /** Thin outline around the shape. Empty hides it. */
  outline?: string
  background?: string
  ink?: string
  muted?: string
  accent?: string
  onChange?: (index: number) => void
  className?: string
}

/* ------------------------------------------------------------------ logic */

// #region logic
function clamp(v: number, a: number, b: number): number {
  return Math.min(b, Math.max(a, v))
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

function easeInOutCubic(t: number): number {
  const c = clamp(t, 0, 1)
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2
}

/** A stepped shape: K columns, each with its own x-span, top and bottom. */
export type Shape = { xs: number[]; top: number[]; bot: number[] }

// a skyline-like stepped shape inside a w×h box; every shape has the same
// number of columns, so any two can morph corner-for-corner
function makeShape(seed: number, k: number, w: number, h: number): Shape {
  const r = mulberry32(seed * 7919 + 13)
  // column widths: uneven, never thinner than a sliver
  const weights = Array.from({ length: k }, () => 0.45 + r() * 1.1)
  const sum = weights.reduce((a, b) => a + b, 0)
  const xs = [0]
  for (const wt of weights) xs.push(xs[xs.length - 1] + (wt / sum) * w)
  xs[k] = w
  const top: number[] = []
  const bot: number[] = []
  let t = h * (0.12 + r() * 0.3)
  let b = h * (0.62 + r() * 0.3)
  for (let i = 0; i < k; i++) {
    // neighbours step, and sometimes jump, so the outline reads as blocks
    t = clamp(t + (r() - 0.5) * h * (r() < 0.3 ? 0.55 : 0.28), 0, h * 0.46)
    b = clamp(b + (r() - 0.5) * h * (r() < 0.3 ? 0.55 : 0.28), h * 0.56, h)
    if (r() < 0.12) t = 0
    if (r() < 0.12) b = h
    top.push(Math.round(t))
    bot.push(Math.round(b))
  }
  return { xs: xs.map((x) => Math.round(x)), top, bot }
}

// interpolate two shapes; columns move in a left-to-right stagger
function lerpShape(a: Shape, b: Shape, p: number, stagger = 0.35): Shape {
  const k = a.top.length
  const col = (i: number) => easeInOutCubic(clamp((p - (i / Math.max(1, k - 1)) * stagger) / (1 - stagger), 0, 1))
  const xs = a.xs.map((x, i) => {
    const e = col(Math.min(i, k - 1))
    return x + (b.xs[i] - x) * e
  })
  const top = a.top.map((v, i) => v + (b.top[i] - v) * col(i))
  const bot = a.bot.map((v, i) => v + (b.bot[i] - v) * col(i))
  return { xs, top, bot }
}

// the outline: along the tops left→right, down, along the bottoms right→left
function shapePath(s: Shape, lift: number[] = []): string {
  const k = s.top.length
  let d = ""
  for (let i = 0; i < k; i++) {
    const t = s.top[i] - (lift[i] ?? 0)
    d += (i === 0 ? "M" : "L") + s.xs[i].toFixed(1) + " " + t.toFixed(1) + "L" + s.xs[i + 1].toFixed(1) + " " + t.toFixed(1)
  }
  for (let i = k - 1; i >= 0; i--) {
    const b = s.bot[i] + (lift[i] ?? 0)
    d += "L" + s.xs[i + 1].toFixed(1) + " " + b.toFixed(1) + "L" + s.xs[i].toFixed(1) + " " + b.toFixed(1)
  }
  return d + "Z"
}

// which column an x falls in
function columnAt(s: Shape, x: number): number {
  for (let i = 0; i < s.top.length; i++) if (x >= s.xs[i] && x < s.xs[i + 1]) return i
  return -1
}

function wrap(i: number, n: number): number {
  return n ? ((i % n) + n) % n : 0
}
// #endregion logic

/* ------------------------------------------------------- painted images */

const PALETTES = {
  concrete: { sky: ["#141619", "#2a2e33"], beams: ["#c9ccd0", "#8e949b", "#5d636a", "#e6e7e8"], glass: "#1d2a33", glow: "#f3f1ea" },
  dusk: { sky: ["#1c0f10", "#4a2117"], beams: ["#e9a36b", "#b8643e", "#7a3a25", "#f4d3a6"], glass: "#2b1714", glow: "#ffd9a8" },
  glass: { sky: ["#07161d", "#123543"], beams: ["#9fd3dd", "#5a9fb0", "#2f6878", "#d9f1f4"], glass: "#0b2430", glow: "#e8fbff" },
  rose: { sky: ["#1d1216", "#4a2a33"], beams: ["#f0c4c6", "#c98a91", "#8d5560", "#fbe3df"], glass: "#2a1a1f", glow: "#fff0ec" },
}

function paintArchitecture(seed: number, palette: ArchPalette, w = 1600, h = 960): string {
  if (typeof document === "undefined") return ""
  const c = document.createElement("canvas")
  c.width = w
  c.height = h
  const g = c.getContext("2d")
  if (!g) return ""
  const P = PALETTES[palette] ?? PALETTES.concrete
  const r = mulberry32(seed * 104729 + 7)

  // sky
  const sky = g.createLinearGradient(0, 0, w * 0.3, h)
  sky.addColorStop(0, P.sky[1])
  sky.addColorStop(1, P.sky[0])
  g.fillStyle = sky
  g.fillRect(0, 0, w, h)

  // two families of beams: one steep, one shallow — like a facade of fins
  const families = [-0.62 + r() * 0.2, 0.28 + r() * 0.25]
  const count = 16 + Math.floor(r() * 6)
  for (let n = 0; n < count; n++) {
    const fam = families[n % 2]
    const ang = fam + (r() - 0.5) * 0.08
    const len = Math.hypot(w, h) * (0.8 + r() * 0.7)
    const thick = 26 + r() * (n % 3 === 0 ? 150 : 80)
    const cx = w * (r() * 1.2 - 0.1)
    const cy = h * (r() * 1.2 - 0.1)
    g.save()
    g.translate(cx, cy)
    g.rotate(ang)
    // cast shadow first, then the lit body
    g.shadowColor = "rgba(0,0,0,.55)"
    g.shadowBlur = 40
    g.shadowOffsetY = 18
    const tone = P.beams[Math.floor(r() * P.beams.length)]
    const body = g.createLinearGradient(0, -thick / 2, 0, thick / 2)
    body.addColorStop(0, P.glow)
    body.addColorStop(0.12, tone)
    body.addColorStop(0.7, tone)
    body.addColorStop(1, "rgba(0,0,0,.55)")
    g.fillStyle = body
    g.fillRect(-len / 2, -thick / 2, len, thick)
    g.shadowColor = "transparent"
    // glass bands on the fat slabs
    if (thick > 110) {
      g.fillStyle = P.glass
      const band = thick * 0.34
      g.fillRect(-len / 2, -band / 2, len, band)
      g.strokeStyle = "rgba(255,255,255,.08)"
      g.lineWidth = 2
      for (let x = -len / 2; x < len / 2; x += 46 + r() * 30) {
        g.beginPath()
        g.moveTo(x, -band / 2)
        g.lineTo(x, band / 2)
        g.stroke()
      }
      const sheen = g.createLinearGradient(-len / 2, 0, len / 2, 0)
      sheen.addColorStop(0, "rgba(255,255,255,0)")
      sheen.addColorStop(0.5 + (r() - 0.5) * 0.4, "rgba(255,255,255,.18)")
      sheen.addColorStop(1, "rgba(255,255,255,0)")
      g.fillStyle = sheen
      g.fillRect(-len / 2, -band / 2, len, band)
    }
    // a crisp lit edge
    g.fillStyle = "rgba(255,255,255,.55)"
    g.fillRect(-len / 2, -thick / 2, len, Math.max(1.5, thick * 0.025))
    g.restore()
  }

  // atmosphere: a soft key light and a vignette
  const key = g.createRadialGradient(w * (0.3 + r() * 0.4), h * 0.2, 0, w * 0.5, h * 0.4, w * 0.9)
  key.addColorStop(0, "rgba(255,255,255,.16)")
  key.addColorStop(1, "rgba(255,255,255,0)")
  g.fillStyle = key
  g.fillRect(0, 0, w, h)
  const vig = g.createRadialGradient(w / 2, h / 2, h * 0.35, w / 2, h / 2, w * 0.75)
  vig.addColorStop(0, "rgba(0,0,0,0)")
  vig.addColorStop(1, "rgba(0,0,0,.5)")
  g.fillStyle = vig
  g.fillRect(0, 0, w, h)

  // film grain
  const grain = g.getImageData(0, 0, w, h)
  const d = grain.data
  for (let i = 0; i < d.length; i += 4) {
    const v = (r() - 0.5) * 18
    d[i] += v
    d[i + 1] += v
    d[i + 2] += v
  }
  g.putImageData(grain, 0, 0)
  return c.toDataURL("image/jpeg", 0.88)
}

/* --------------------------------------------------------------- defaults */

const D_SLIDES: SteppedSlide[] = [
  { title: "Fin Facade", caption: "Aluminium fins catching the last light.", palette: "concrete", seed: 3 },
  { title: "Copper Hour", caption: "A stair core turned amber at dusk.", palette: "dusk", seed: 11 },
  { title: "Cold Glass", caption: "Curtain wall, harbour side, 7 a.m.", palette: "glass", seed: 27 },
  { title: "Soft Concrete", caption: "Board-formed walls in winter sun.", palette: "rose", seed: 42 },
]

/* -------------------------------------------------------------- component */

const VW = 1000

export default function SteppedMorphSlider({
  slides = D_SLIDES,
  columns = 9,
  autoplay = 5200,
  duration = 1100,
  aspect = 5 / 3,
  outline = "",
  background = "#f6f5f2",
  ink = "#121212",
  muted = "#8a8a86",
  accent = "#121212",
  onChange,
  className = "",
}: SteppedMorphSliderProps) {
  const uid = "sm" + React.useId().replace(/[^a-zA-Z0-9]/g, "")
  const VH = Math.round(VW / clamp(aspect, 0.6, 3))
  const K = clamp(Math.round(columns), 3, 16)
  const n = slides.length

  const [reduced, setReduced] = React.useState(false)
  React.useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const on = () => setReduced(mq.matches)
    on()
    mq.addEventListener?.("change", on)
    return () => mq.removeEventListener?.("change", on)
  }, [])

  // painted stand-ins for slides without an image (client-only)
  const [painted, setPainted] = React.useState([] as string[])
  const paintKey = slides.map((s, i) => (s.image ? "img" : (s.palette ?? "concrete") + (s.seed ?? i))).join("|")
  React.useEffect(() => {
    setPainted(slides.map((s, i) => (s.image ? "" : paintArchitecture(s.seed ?? i + 1, s.palette ?? "concrete"))))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paintKey])
  const src = (i: number) => slides[wrap(i, n)]?.image || painted[wrap(i, n)] || ""

  const shapes = React.useMemo(
    () => slides.map((s, i) => makeShape(s.seed ?? i + 1, K, VW, VH)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [paintKey, K, VH],
  )

  const [index, setIndex] = React.useState(0)
  const [prev, setPrev] = React.useState(0)
  const [p, setP] = React.useState(1)
  const [lift, setLift] = React.useState(new Array(K).fill(0) as number[])
  const [hover, setHover] = React.useState(-1)
  const indexRef = React.useRef(0)
  const [paused, setPaused] = React.useState(false)
  const [progress, setProgress] = React.useState(0)

  const go = (to: number) => {
    if (!n) return
    const cur = indexRef.current
    const nextIx = wrap(to, n)
    if (nextIx === cur) return
    indexRef.current = nextIx
    setPrev(cur)
    setIndex(nextIx)
    setP(reduced ? 1 : 0)
    setProgress(0)
    onChange?.(nextIx)
  }
  const next = () => go(indexRef.current + 1)
  const back = () => go(indexRef.current - 1)
  const nextRef = React.useRef(next)
  nextRef.current = next

  // the morph clock
  React.useEffect(() => {
    if (p >= 1) return
    let raf = 0
    const t0 = performance.now() - p * duration
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / Math.max(1, duration))
      setP(k)
      if (k < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index])

  // autoplay with a progress line; paused on hover, focus, or off-screen
  const rootRef = React.useRef(null as HTMLDivElement | null)
  const [visible, setVisible] = React.useState(true)
  React.useEffect(() => {
    const el = rootRef.current
    if (!el || typeof IntersectionObserver !== "function") return
    const io = new IntersectionObserver((es) => setVisible(es.some((e) => e.isIntersecting)))
    io.observe(el)
    return () => io.disconnect()
  }, [])
  React.useEffect(() => {
    if (!autoplay || reduced || paused || !visible || n < 2) return
    let raf = 0
    const t0 = performance.now() - progress * autoplay
    const tick = (now: number) => {
      const k = (now - t0) / autoplay
      if (k >= 1) {
        setProgress(0)
        nextRef.current()
        return
      }
      setProgress(k)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoplay, reduced, paused, visible, n, index])

  // hover lifts the column under the pointer (springy, settles back)
  React.useEffect(() => {
    if (reduced) return
    let raf = 0
    let last = 0
    const vel = new Array(K).fill(0)
    const cur = lift.slice(0, K)
    while (cur.length < K) cur.push(0)
    const tick = (now: number) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016
      last = now
      let moving = false
      for (let i = 0; i < K; i++) {
        const target = hover === i ? 16 : 0
        vel[i] += (220 * (target - cur[i]) - 18 * vel[i]) * dt
        cur[i] += vel[i] * dt
        if (Math.abs(target - cur[i]) > 0.05 || Math.abs(vel[i]) > 0.05) moving = true
      }
      setLift(cur.slice())
      if (moving) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hover, reduced, K])

  const shape = n ? lerpShape(shapes[wrap(prev, n)], shapes[wrap(index, n)], p) : { xs: [0, VW], top: [0], bot: [VH] }
  const d = shapePath(shape, lift)

  /* pointer: hover column, drag/swipe to change */
  const drag = React.useRef({ x: 0, down: false, moved: false })
  const svgX = (e: PointerSvgEv) => {
    const r = e.currentTarget.getBoundingClientRect()
    return ((e.clientX - r.left) / r.width) * VW
  }
  const onMove = (e: PointerSvgEv) => {
    const col = columnAt(shape, svgX(e))
    if (col !== hover) setHover(col)
    if (drag.current.down && Math.abs(e.clientX - drag.current.x) > 8) drag.current.moved = true
  }
  const onDown = (e: PointerSvgEv) => {
    drag.current = { x: e.clientX, down: true, moved: false }
  }
  const onUp = (e: PointerSvgEv) => {
    const dx = e.clientX - drag.current.x
    const wasDrag = drag.current.moved
    drag.current.down = false
    if (wasDrag && Math.abs(dx) > 40) (dx < 0 ? next : back)()
    else if (!wasDrag) next()
  }
  const onLeave = () => {
    setHover(-1)
    drag.current.down = false
  }
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault()
      next()
    } else if (e.key === "ArrowLeft") {
      e.preventDefault()
      back()
    }
  }

  const cur = slides[wrap(index, n)]
  const ease = easeInOutCubic(p)
  const pad = (v: number) => String(v).padStart(2, "0")

  return (
    <div
      ref={rootRef}
      className={"sm-root " + className}
      style={{ background, color: ink, ["--sm-ink" as string]: ink, ["--sm-muted" as string]: muted, ["--sm-accent" as string]: accent, ["--sm-bg" as string]: background } as React.CSSProperties}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <style>{SM_CSS}</style>
      <div className="sm-stage" role="region" aria-roledescription="carousel" aria-label="Image slider" tabIndex={0} onKeyDown={onKey}>
        <svg
          className="sm-svg"
          viewBox={"-20 -20 " + (VW + 40) + " " + (VH + 40)}
          preserveAspectRatio="xMidYMid meet"
          onPointerMove={onMove}
          onPointerDown={onDown}
          onPointerUp={onUp}
          onPointerLeave={onLeave}
          role="img"
          aria-label={cur ? cur.title + (cur.caption ? " — " + cur.caption : "") : "Slide"}
        >
          <defs>
            <clipPath id={uid + "clip"}>
              <path d={d} />
            </clipPath>
          </defs>
          <g clipPath={"url(#" + uid + "clip)"}>
            <rect x="-20" y="-20" width={VW + 40} height={VH + 40} fill={ink} />
            {p < 1 && src(prev) && (
              <image
                href={src(prev)}
                x="-20"
                y="-20"
                width={VW + 40}
                height={VH + 40}
                preserveAspectRatio="xMidYMid slice"
                opacity={1 - ease}
                style={{ transform: "scale(" + (1 + 0.06 * ease) + ")", transformOrigin: "50% 50%", transformBox: "fill-box" }}
              />
            )}
            {src(index) && (
              <image
                href={src(index)}
                x="-20"
                y="-20"
                width={VW + 40}
                height={VH + 40}
                preserveAspectRatio="xMidYMid slice"
                opacity={ease}
                style={{ transform: "scale(" + (1.08 - 0.08 * ease) + ")", transformOrigin: "50% 50%", transformBox: "fill-box" }}
              />
            )}
          </g>
          {outline && <path d={d} fill="none" stroke={outline} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />}
        </svg>
      </div>

      <div className="sm-bar">
        <div className="sm-count" aria-hidden="true">
          <b>{pad(wrap(index, n) + 1)}</b>
          <span>/ {pad(n)}</span>
        </div>
        <div className="sm-text" aria-live="polite">
          <h3 key={"t" + index} className="sm-title">
            {cur?.title}
          </h3>
          {cur?.caption && (
            <p key={"c" + index} className="sm-caption">
              {cur.caption}
            </p>
          )}
        </div>
        <div className="sm-nav">
          <button type="button" className="sm-arrow" onClick={back} aria-label="Previous slide">
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path d="M11 4 6 9l5 5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="sm-dots">
            {slides.map((s, i) => (
              <button key={i} type="button" className="sm-dot" aria-label={"Go to " + s.title} aria-current={i === wrap(index, n) ? "true" : undefined} onClick={() => go(i)}>
                <i style={{ transform: "scaleX(" + (i === wrap(index, n) ? (autoplay && !reduced ? progress : 1) : 0) + ")" }} />
              </button>
            ))}
          </div>
          <button type="button" className="sm-arrow" onClick={next} aria-label="Next slide">
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path d="m7 4 5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

const SM_CSS = `
.sm-root{position:relative;width:100%;box-sizing:border-box;padding:clamp(16px,3vw,40px) clamp(14px,3vw,44px);font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;-webkit-font-smoothing:antialiased}
.sm-root :where(*){box-sizing:border-box}
.sm-root :where(h3,p){margin:0;padding:0;font-size:inherit;font-weight:inherit}
.sm-root :where(button){font:inherit;color:inherit;background:none;border:0;padding:0;margin:0;cursor:pointer}
.sm-root :focus-visible{outline:2px solid var(--sm-accent);outline-offset:3px}
.sm-stage{position:relative;width:100%;max-width:1180px;margin:0 auto;outline:none}
.sm-svg{display:block;width:100%;height:auto;max-width:none;cursor:pointer;touch-action:pan-y;user-select:none;-webkit-user-select:none}
.sm-bar{display:grid;grid-template-columns:auto 1fr;gap:12px 24px;align-items:end;max-width:1180px;margin:clamp(14px,2.4vw,26px) auto 0}
.sm-count{display:flex;align-items:baseline;gap:6px;font-variant-numeric:tabular-nums;color:var(--sm-muted);font-size:13px;letter-spacing:.04em}
.sm-count b{color:var(--sm-ink);font-size:clamp(28px,4vw,46px);font-weight:600;letter-spacing:-.03em;line-height:.9}
.sm-text{min-width:0;overflow:hidden}
.sm-title{font-size:clamp(18px,2.2vw,26px);font-weight:600;letter-spacing:-.02em;line-height:1.15;animation:sm-up .6s cubic-bezier(.2,.8,.2,1) both}
.sm-caption{margin-top:4px;font-size:14px;color:var(--sm-muted);animation:sm-up .6s .08s cubic-bezier(.2,.8,.2,1) both}
.sm-nav{grid-column:1 / -1;display:flex;align-items:center;gap:14px}
.sm-arrow{display:grid;place-items:center;width:40px;height:40px;border:1px solid color-mix(in srgb,var(--sm-ink) 22%,transparent);border-radius:99px;transition:border-color .2s,background-color .2s,color .2s}
.sm-arrow:hover{border-color:var(--sm-ink);background:var(--sm-ink);color:var(--sm-bg)}
.sm-dots{display:flex;flex:1;gap:6px}
.sm-dot{position:relative;flex:1;height:18px}
.sm-dot::before{content:"";position:absolute;left:0;right:0;top:50%;height:2px;margin-top:-1px;background:color-mix(in srgb,var(--sm-ink) 16%,transparent)}
.sm-dot i{position:absolute;left:0;right:0;top:50%;height:2px;margin-top:-1px;background:var(--sm-accent);transform-origin:0 50%}
@media (min-width:720px){.sm-bar{grid-template-columns:auto 1fr auto}.sm-nav{grid-column:auto;min-width:260px}}
@keyframes sm-up{from{opacity:0;transform:translateY(60%)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.sm-title,.sm-caption{animation:none}.sm-arrow{transition:none}}
`

// event alias lives after the JSX so the 21st CLI tokenizer stays linear
type PointerSvgEv = React.PointerEvent<SVGSVGElement>
