"use client"

import * as React from "react"

/*
 * Contact Sheet Carousel — every picture laid out like a photographer's
 * contact sheet: numbered frames on a quiet page. Pick one and it grows out of
 * its frame into a full viewer while the sheet fades away; step through with
 * the arrows, then "Index" folds the picture back into its frame.
 *
 * Arrows, swipe, ←/→, Esc, and autoplay while viewing. Slides without an
 * `image` get a painted landscape, so it works with no assets at all.
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

export type ContactSheetCarouselProps = {
  slides?: Slide[]
  /** Any CSS length. Default 100svh. */
  height?: number | string
  /** Smallest frame width on the sheet, px. */
  frameWidth?: number
  /** Open on this frame instead of the sheet. */
  startOpen?: number
  /** ms per slide while viewing; 0 turns autoplay off. */
  autoplay?: number
  /** Label in the sheet's header. */
  label?: string
  background?: string
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

export type Box = { left: number; top: number; width: number; height: number }

/** An element's box relative to a container box. */
export function relBox(el: Box, root: Box): Box {
  return { left: el.left - root.left, top: el.top - root.top, width: el.width, height: el.height }
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

const CS_CSS = [
  ".cs-root{position:relative;width:100%;overflow:hidden;background:var(--cs-bg);color:var(--cs-ink);outline:none}",
  ".cs-root:focus-visible{box-shadow:inset 0 0 0 2px var(--cs-ink)}",
  ".cs-sheet{position:absolute;inset:0;overflow:auto;padding:clamp(20px,4vw,56px);transition:opacity .45s ease,transform .6s cubic-bezier(.2,.7,.2,1)}",
  ".cs-root[data-phase='open'] .cs-sheet,.cs-root[data-phase='opening'] .cs-sheet{opacity:0;transform:scale(.97);pointer-events:none}",
  ".cs-head{display:flex;justify-content:space-between;align-items:baseline;gap:16px;margin-bottom:clamp(16px,3vh,28px);font:500 12px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.14em;text-transform:uppercase;color:var(--cs-muted)}",
  ".cs-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,var(--cs-fw)),1fr));gap:clamp(14px,2.2vw,28px)}",
  ".cs-frame{appearance:none;border:0;padding:0;background:transparent;color:inherit;text-align:left;cursor:zoom-in;display:block}",
  ".cs-frame:focus-visible{outline:2px solid var(--cs-ink);outline-offset:4px}",
  ".cs-shot{position:relative;aspect-ratio:3/2;overflow:hidden;border-radius:3px;background:var(--cs-line)}",
  ".cs-shot img{position:absolute;inset:0;width:100%;height:100%;max-width:none;object-fit:cover;display:block;transition:transform .6s cubic-bezier(.2,.7,.2,1)}",
  ".cs-frame:hover .cs-shot img{transform:scale(1.04)}",
  ".cs-shot[data-hide='1'] img{visibility:hidden}",
  ".cs-meta{display:flex;gap:10px;align-items:baseline;margin-top:10px}",
  ".cs-num{font:500 11px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.12em;color:var(--cs-muted)}",
  ".cs-name{font:400 15px/1.2 ui-serif,Georgia,'Times New Roman',serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
  ".cs-view{position:absolute;inset:0;opacity:0;pointer-events:none;transition:opacity .35s ease;touch-action:pan-y}",
  ".cs-root[data-phase='open'] .cs-view{opacity:1;pointer-events:auto}",
  ".cs-stage{position:absolute;left:clamp(16px,4vw,56px);right:clamp(16px,4vw,56px);top:clamp(16px,4vh,40px);bottom:clamp(96px,14vh,128px);overflow:hidden;border-radius:4px}",
  ".cs-stage img,.cs-fly{position:absolute;max-width:none;object-fit:cover;display:block}",
  ".cs-stage img{inset:0;width:100%;height:100%;animation:cs-swap .55s cubic-bezier(.2,.7,.2,1) both}",
  ".cs-fly{z-index:3;border-radius:4px;pointer-events:none}",
  ".cs-bar{position:absolute;left:clamp(16px,4vw,56px);right:clamp(16px,4vw,56px);bottom:clamp(24px,4vh,40px);display:flex;align-items:center;gap:clamp(12px,2vw,24px)}",
  ".cs-cap{flex:1;min-width:0;overflow:hidden;padding-bottom:.15em}",
  ".cs-cap>*{display:block;animation:cs-in .55s cubic-bezier(.2,.8,.2,1) both}",
  ".cs-title{font:500 clamp(18px,2.2vw,26px)/1.15 ui-serif,Georgia,'Times New Roman',serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
  ".cs-sub{margin-top:4px;font:400 13px/1.4 ui-sans-serif,system-ui,sans-serif;color:var(--cs-muted)}",
  ".cs-count{font:500 12px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.14em;color:var(--cs-muted)}",
  ".cs-count b{color:var(--cs-ink);font-weight:500}",
  ".cs-btn{appearance:none;height:40px;min-width:40px;padding:0 12px;border-radius:999px;border:1px solid var(--cs-line);background:transparent;color:inherit;display:inline-flex;align-items:center;justify-content:center;gap:8px;cursor:pointer;font:500 12px/1 ui-sans-serif,system-ui,sans-serif;letter-spacing:.06em;transition:background .2s ease,color .2s ease}",
  ".cs-btn:hover{background:var(--cs-ink);color:var(--cs-bg)}",
  ".cs-btn:focus-visible{outline:2px solid var(--cs-ink);outline-offset:2px}",
  ".cs-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}",
  "@keyframes cs-swap{from{opacity:0;transform:translateX(calc(var(--cs-dir,1) * 3%)) scale(1.02)}to{opacity:1;transform:none}}",
  "@keyframes cs-in{from{transform:translateY(100%);opacity:0}to{transform:none;opacity:1}}",
  "@media (max-width:560px){.cs-count{display:none}.cs-btn span{display:none}}",
  "@media (prefers-reduced-motion:reduce){.cs-stage img,.cs-cap>*{animation:none}.cs-sheet{transition:opacity .2s ease}}",
].join("\n")

type Fly = { src: string; from: Box; to: Box; closing: boolean; id: number }

export default function ContactSheetCarousel({
  slides = DEFAULT_SLIDES,
  height = "100svh",
  frameWidth = 380,
  startOpen,
  autoplay = 5000,
  label = "Contact sheet",
  background = "var(--color-background, #f4f1ea)",
  ink = "var(--color-foreground, #161513)",
  onChange,
  className,
  style,
  ariaLabel = "Image carousel",
}: ContactSheetCarouselProps) {
  const n = slides.length
  const srcs = useSlideImages(slides)
  const [index, setIndex] = React.useState(startOpen != null ? wrap(startOpen, n) : 0)
  const [dir, setDir] = React.useState(1)
  const [phase, setPhase] = React.useState(startOpen != null ? "open" : "sheet")
  const [fly, setFly] = React.useState(null as Fly | null)
  const rootRef = React.useRef(null as HTMLDivElement | null)
  const stageRef = React.useRef(null as HTMLDivElement | null)
  const flyRef = React.useRef(null as HTMLImageElement | null)
  const shots = React.useRef([] as (HTMLDivElement | null)[])
  const down = React.useRef(null as null | { x: number; y: number })
  const lastTouch = React.useRef(0)

  const boxOf = (el: Element | null | undefined): Box | null => {
    const root = rootRef.current
    if (!el || !root) return null
    return relBox(el.getBoundingClientRect(), root.getBoundingClientRect())
  }
  const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches

  const open = (i: number) => {
    if (phase !== "sheet") return
    setIndex(i)
    const from = boxOf(shots.current[i])
    const to = boxOf(stageRef.current)
    if (!from || !to || !srcs[i] || reduced()) return setPhase("open")
    setPhase("opening")
    setFly({ src: srcs[i], from, to, closing: false, id: Date.now() })
  }
  const close = () => {
    if (phase !== "open") return
    shots.current[index]?.scrollIntoView({ block: "nearest" })
    const from = boxOf(stageRef.current)
    const to = boxOf(shots.current[index])
    if (!from || !to || !srcs[index] || reduced()) return setPhase("sheet")
    setPhase("closing")
    setFly({ src: srcs[index], from, to, closing: true, id: Date.now() })
  }
  const step = (d: number) => {
    if (phase !== "open" || n < 2) return
    setDir(d)
    setIndex((i) => wrap(i + d, n))
  }

  React.useLayoutEffect(() => {
    const el = flyRef.current
    if (!fly || !el) return
    const px = (b: Box) => ({ left: b.left + "px", top: b.top + "px", width: b.width + "px", height: b.height + "px" })
    const a = el.animate([px(fly.from), px(fly.to)], { duration: 640, easing: "cubic-bezier(.7,0,.2,1)", fill: "both" })
    a.onfinish = () => {
      setPhase(fly.closing ? "sheet" : "open")
      setFly(null)
    }
    return () => a.cancel()
  }, [fly])

  React.useEffect(() => {
    onChange?.(index)
  }, [index, onChange])

  // autoplay while viewing, on screen and untouched
  React.useEffect(() => {
    if (!autoplay || n < 2 || phase !== "open") return
    const root = rootRef.current
    let seen = true
    const io = new IntersectionObserver(([e]) => (seen = e.isIntersecting))
    if (root) io.observe(root)
    const t = window.setInterval(() => {
      if (!seen || document.hidden || performance.now() - lastTouch.current < autoplay) return
      setDir(1)
      setIndex((i) => wrap(i + 1, n))
    }, autoplay)
    return () => {
      window.clearInterval(t)
      io.disconnect()
    }
  }, [autoplay, n, phase])

  const touch = () => (lastTouch.current = performance.now())
  const onKey = (e: React.KeyboardEvent) => {
    if (phase !== "open") return
    touch()
    if (e.key === "ArrowRight") step(1)
    else if (e.key === "ArrowLeft") step(-1)
    else if (e.key === "Escape") close()
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
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(e.clientY - s.y)) {
      touch()
      step(dx < 0 ? 1 : -1)
    }
  }

  const s = slides[index] || {}
  const viewing = phase === "open"
  const hidden = phase === "opening" || phase === "closing" ? index : -1

  return (
    <div
      ref={rootRef}
      className={["cs-root", className].filter(Boolean).join(" ")}
      style={{
        height,
        ["--cs-bg" as string]: background,
        ["--cs-ink" as string]: ink,
        ["--cs-muted" as string]: "color-mix(in srgb, var(--cs-ink) 55%, transparent)",
        ["--cs-line" as string]: "color-mix(in srgb, var(--cs-ink) 16%, transparent)",
        ["--cs-fw" as string]: frameWidth + "px",
        ...style,
      }}
      data-phase={phase}
      role="region"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      tabIndex={0}
      onKeyDown={onKey}
    >
      <style>{CS_CSS}</style>
      <div className="cs-sheet" aria-hidden={viewing ? true : undefined}>
        <div className="cs-head">
          <span>{label}</span>
          <span>{pad2(n)} frames</span>
        </div>
        <div className="cs-grid">
          {slides.map((sl, i) => (
            <button key={i} type="button" className="cs-frame" onClick={() => open(i)} tabIndex={viewing ? -1 : 0} aria-label={"Open " + (sl.title || "frame " + (i + 1))}>
              <div className="cs-shot" ref={(el) => void (shots.current[i] = el)} data-hide={hidden === i ? "1" : "0"}>
                {srcs[i] ? <img src={srcs[i]} alt={sl.alt || sl.title || ""} draggable={false} loading="lazy" /> : null}
              </div>
              <div className="cs-meta">
                <span className="cs-num">{pad2(i + 1)}</span>
                {sl.title ? <span className="cs-name">{sl.title}</span> : null}
              </div>
            </button>
          ))}
        </div>
      </div>
      <div className="cs-view" aria-hidden={viewing ? undefined : true} onPointerDown={onDown} onPointerUp={onUp}>
        <div className="cs-stage" ref={stageRef} style={{ ["--cs-dir" as string]: String(dir) }}>
          {viewing && srcs[index] ? <img key={index} src={srcs[index]} alt={s.alt || s.title || ""} draggable={false} /> : null}
        </div>
        <div className="cs-bar">
          <button type="button" className="cs-btn" onClick={close} tabIndex={viewing ? 0 : -1} aria-label="Back to the contact sheet">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
              <rect x="0" y="0" width="6" height="6" rx="1" />
              <rect x="8" y="0" width="6" height="6" rx="1" />
              <rect x="0" y="8" width="6" height="6" rx="1" />
              <rect x="8" y="8" width="6" height="6" rx="1" />
            </svg>
            <span>Index</span>
          </button>
          <div className="cs-cap" key={index} aria-hidden="true">
            {s.title ? <span className="cs-title">{s.title}</span> : null}
            {s.caption ? <span className="cs-sub">{s.caption}</span> : null}
          </div>
          <span className="cs-count" aria-hidden="true">
            <b>{pad2(index + 1)}</b> / {pad2(n)}
          </span>
          <button type="button" className="cs-btn" aria-label="Previous" tabIndex={viewing ? 0 : -1} onClick={() => (touch(), step(-1))}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M10 3 5 8l5 5" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          </button>
          <button type="button" className="cs-btn" aria-label="Next" tabIndex={viewing ? 0 : -1} onClick={() => (touch(), step(1))}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="m6 3 5 5-5 5" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          </button>
        </div>
      </div>
      {fly ? <img ref={flyRef} key={fly.id} className="cs-fly" src={fly.src} alt="" aria-hidden="true" style={{ left: fly.from.left, top: fly.from.top, width: fly.from.width, height: fly.from.height }} /> : null}
      <div className="cs-sr" aria-live="polite">
        {viewing ? "Frame " + (index + 1) + " of " + n + (s.title ? ": " + s.title : "") : ""}
      </div>
    </div>
  )
}
