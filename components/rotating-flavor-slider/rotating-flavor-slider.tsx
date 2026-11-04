"use client"

import * as React from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

// Scroll-driven rotating product slider: one big top-down photo sits half below
// the bottom edge and a ring of curved flavour names arcs over it. The stage
// sticks while the page scrolls, and the scroll scrubs one continuous position:
// the photo turns and morphs into the next, the page colour blends between
// slides, the marker dot slides round the ring, the copy and the corner garnish
// trade places. Letting go eases to the nearest slide.

export type FlavorSlide = {
  /** Short name on the ring, e.g. "lemon". */
  name: string
  title: string
  description?: string
  /** Round, top-down photo (a cake, a pizza, a bowl), cropped square. */
  image: string
  alt?: string
  /** Page colour for this slide (hex or rgb). */
  color: string
  /** Garnish for the top corners: [left, right]. One image is reused, mirrored. */
  decor?: string[]
}

export type RotatingFlavorSliderProps = {
  slides: FlavorSlide[]
  /** Degrees the photo turns per slide. */
  turn?: number
  /** Page scroll per slide, as a fraction of `height`. */
  scrollPerSlide?: number
  /** Stage height. Keep it a definite length; percentages collapse once installed. */
  height?: string
  className?: string
  onChange?: (index: number) => void
}

// #region wheel
/** Clamps into lo..hi. */
export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v
}

/** Angle of each name on the ring, degrees clockwise from the top, centred. */
export function ringAngles(n: number, gap = 33, maxSpan = 140): number[] {
  if (n < 2) return n === 1 ? [0] : []
  const step = Math.min(gap, maxSpan / (n - 1))
  return Array.from({ length: n }, (_, i) => (i - (n - 1) / 2) * step)
}

/** startOffset (%) on a circle path that begins at 9 o'clock and runs clockwise. */
export function pathOffset(angle: number): number {
  return ((((angle + 90) % 360) + 360) % 360) / 3.6
}

/** Continuous slide position (0..n-1) for a scroll progress (0-1). */
export function positionAt(progress: number, n: number): number {
  return clamp(progress, 0, 1) * Math.max(0, n - 1)
}

/** Linear blend between two neighbours of a list at a continuous position. */
export function lerpAt(values: number[], p: number): number {
  if (!values.length) return 0
  const i = clamp(Math.floor(p), 0, values.length - 1)
  const j = Math.min(i + 1, values.length - 1)
  return values[i] + (values[j] - values[i]) * (p - i)
}

/** Opacity of photo i at position p: the lower one stays solid, the next fades over it. */
export function photoOpacity(i: number, p: number): number {
  const base = Math.floor(p)
  return i === base ? 1 : i === base + 1 ? p - base : 0
}

/** Scroll offset that rests on slide i. */
export function scrollFor(i: number, n: number, start: number, end: number): number {
  return n > 1 ? start + ((end - start) * i) / (n - 1) : start
}
// #endregion

const R_TEXT = 92.8 // viewBox units; the SVG spans -100..100 (42u)
const R_LINE = 87
const RING_PATH =
  "M " + -R_TEXT + " 0 A " + R_TEXT + " " + R_TEXT + " 0 1 1 " + R_TEXT + " 0 A " + R_TEXT + " " + R_TEXT + " 0 1 1 " + -R_TEXT + " 0"

const CSS =
  ".rfs-track{position:relative;width:100%}" +
  ".rfs-root{position:sticky;top:0;width:100%;overflow:hidden;container-type:size;color:#fff;outline:none;user-select:none}" +
  ".rfs-root:focus-visible{box-shadow:inset 0 0 0 2px #fff}" +
  ".rfs-stage{position:absolute;inset:0;--u:min(1cqw,1.7cqh)}" +
  "@container (max-width:640px){.rfs-stage{--u:min(1.25cqw,1.2cqh)}.rfs-stage .rfs-wheel{top:76%}.rfs-stage .rfs-copy{top:calc(var(--u) * 14)}}" +
  ".rfs-shade{position:absolute;inset:0;background:var(--color-background);mix-blend-mode:multiply;opacity:.3;pointer-events:none}" +
  ".rfs-copy{position:absolute;left:50%;top:calc(var(--u) * 6.5);transform:translateX(-50%);width:min(88%,calc(var(--u) * 46));display:grid;text-align:center}" +
  ".rfs-txt{grid-area:1/1;will-change:opacity,transform}" +
  ".rfs-title{margin:0;font-size:max(20px,calc(var(--u) * 1.9));font-weight:500;letter-spacing:.01em;line-height:1.15}" +
  ".rfs-desc{margin:calc(var(--u) * .8) 0 0;font-size:max(12px,calc(var(--u) * .95));line-height:1.6;opacity:.82}" +
  ".rfs-wheel{position:absolute;left:50%;top:calc(100% + var(--u) * .5);width:0;height:0}" +
  ".rfs-ring{position:absolute;left:calc(var(--u) * -42);top:calc(var(--u) * -42);width:calc(var(--u) * 84);height:calc(var(--u) * 84);overflow:visible}" +
  ".rfs-ring text{fill:#fff;font-size:3.9px;letter-spacing:.1em;cursor:pointer}" +
  ".rfs-ring text:focus-visible{outline:none;text-decoration:underline}" +
  ".rfs-dot{transform-box:view-box;transform-origin:0 0}" +
  ".rfs-cake{position:absolute;left:calc(var(--u) * -30);top:calc(var(--u) * -30);width:calc(var(--u) * 60);height:calc(var(--u) * 60);border-radius:50%;" +
  "box-shadow:0 calc(var(--u) * -.6) calc(var(--u) * 3) rgba(0,0,0,.28);will-change:transform}" +
  ".rfs-cake>img{position:absolute;inset:0;width:100%;height:100%;max-width:none;border-radius:50%;object-fit:cover}" +
  ".rfs-decor{position:absolute;top:calc(var(--u) * -4);width:calc(var(--u) * 21);height:calc(var(--u) * 21);max-width:none;object-fit:contain;pointer-events:none;will-change:opacity,transform}" +
  ".rfs-decor[data-side=l]{left:calc(var(--u) * -4)}" +
  ".rfs-decor[data-side=r]{right:calc(var(--u) * -4)}" +
  ".rfs-decor[data-flip=true]{scale:-1 1}" +
  ".rfs-nav{position:absolute;bottom:calc(var(--u) * 2.4);width:max(34px,calc(var(--u) * 2.6));height:max(34px,calc(var(--u) * 2.6));border-radius:50%;" +
  "display:grid;place-items:center;border:0;padding:0;color:#fff;background:rgba(255,255,255,.16);cursor:pointer;transition:background-color .2s}" +
  ".rfs-nav:hover{background:rgba(255,255,255,.3)}" +
  ".rfs-nav:focus-visible{outline:2px solid #fff;outline-offset:2px}" +
  ".rfs-nav[data-dir=prev]{left:calc(var(--u) * 2.4)}" +
  ".rfs-nav[data-dir=next]{right:calc(var(--u) * 2.4)}" +
  ".rfs-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}"

function Chevron({ flip }: { flip?: boolean }) {
  return (
    <svg width="40%" height="40%" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={flip ? { transform: "scaleX(-1)" } : undefined}>
      <path d="M10 3 5 8l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function RotatingFlavorSlider({
  slides,
  turn = 45,
  scrollPerSlide = 0.8,
  height = "100svh",
  className,
  onChange,
}: RotatingFlavorSliderProps) {
  const n = slides.length
  const [active, setActive] = React.useState(0)
  const id = React.useId().replace(/:/g, "")
  const angles = React.useMemo(() => ringAngles(n), [n])

  const track = React.useRef(null as HTMLDivElement | null)
  const root = React.useRef(null as HTMLElement | null)
  const cake = React.useRef(null as HTMLDivElement | null)
  const dot = React.useRef(null as SVGGElement | null)
  const photos = React.useRef([] as (HTMLImageElement | null)[])
  const texts = React.useRef([] as (HTMLDivElement | null)[])
  const names = React.useRef([] as (SVGTextElement | null)[])
  const decors = React.useRef([] as (HTMLImageElement | null)[][])
  const trigger = React.useRef(null as ScrollTrigger | null)
  const reduced = React.useRef(false)
  const last = React.useRef(0)
  const changed = React.useRef(onChange)
  changed.current = onChange

  React.useEffect(() => {
    if (!n || !track.current || !root.current) return
    const mixers = slides.map((s, i) => gsap.utils.interpolate(s.color, slides[Math.min(i + 1, n - 1)].color))
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    reduced.current = mq.matches

    // Writes only: transform, opacity and colour. Every number comes from the scroll.
    const apply = (p: number) => {
      const still = reduced.current
      const base = clamp(Math.floor(p), 0, n - 1)
      root.current!.style.backgroundColor = mixers[base](p - base)
      if (cake.current) cake.current.style.transform = "rotate(" + (still ? 0 : p * turn) + "deg)"
      if (dot.current) dot.current.style.transform = "rotate(" + lerpAt(angles, p) + "deg)"
      for (let i = 0; i < n; i++) {
        const d = p - i
        const near = Math.max(0, 1 - Math.abs(d))
        const ph = photos.current[i]
        if (ph) ph.style.opacity = String(photoOpacity(i, p))
        const tx = texts.current[i]
        if (tx) {
          tx.style.opacity = String(Math.max(0, 1 - Math.abs(d) * 1.6))
          tx.style.transform = still ? "none" : "translateY(calc(var(--u) * " + (-d * 1.6).toFixed(3) + "))"
          tx.style.visibility = Math.abs(d) < 0.7 ? "visible" : "hidden"
        }
        const nm = names.current[i]
        if (nm) nm.style.opacity = String(0.62 + 0.38 * near)
        const [l, r] = decors.current[i] ?? []
        const t = clamp(d, -1, 1)
        const a = Math.abs(t)
        if (l) {
          l.style.opacity = String(1 - a)
          l.style.transform = still ? "none" : "translate(calc(var(--u) * " + -5 * a + "),calc(var(--u) * " + -5 * a + ")) rotate(" + -28 * t + "deg) scale(" + (1 - 0.2 * a) + ")"
        }
        if (r) {
          r.style.opacity = String(1 - a)
          r.style.transform = still ? "none" : "translate(calc(var(--u) * " + 5 * a + "),calc(var(--u) * " + -5 * a + ")) rotate(" + 28 * t + "deg) scale(" + (1 - 0.2 * a) + ")"
        }
      }
      const now = Math.round(p)
      if (now !== last.current) {
        last.current = now
        setActive(now)
        changed.current?.(now)
      }
    }

    const st = ScrollTrigger.create({
      trigger: track.current,
      start: "top top",
      end: "bottom bottom",
      snap:
        reduced.current || n < 2
          ? undefined
          : { snapTo: 1 / (n - 1), duration: { min: 0.25, max: 0.7 }, delay: 0.08, ease: "power2.inOut" },
      onUpdate: (self) => apply(positionAt(self.progress, n)),
      onRefresh: (self) => apply(positionAt(self.progress, n)),
    })
    trigger.current = st
    apply(positionAt(st.progress, n))

    const onMq = () => {
      reduced.current = mq.matches
      apply(positionAt(st.progress, n))
    }
    mq.addEventListener("change", onMq)
    return () => {
      mq.removeEventListener("change", onMq)
      st.kill()
      trigger.current = null
    }
  }, [n, slides, angles, turn])

  // Jump the page to a slide; the scroll then drives the morph.
  const go = (i: number) => {
    const st = trigger.current
    if (!st) return
    const to = clamp(i, 0, n - 1)
    window.scrollTo({ top: scrollFor(to, n, st.start, st.end), behavior: reduced.current ? "auto" : "smooth" })
  }

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") go(active + 1)
    else if (e.key === "ArrowLeft") go(active - 1)
    else return
    e.preventDefault()
  }

  if (!n) return null
  const slide = slides[active]

  return (
    <div ref={track} className={"rfs-track" + (className ? " " + className : "")} style={{ height: "calc(" + height + " * " + (1 + (n - 1) * scrollPerSlide) + ")" }}>
      <style>{CSS}</style>
      <section
        ref={root}
        className="rfs-root"
        style={{ height, backgroundColor: slides[0].color }}
        aria-roledescription="carousel"
        aria-label="Flavours"
        tabIndex={0}
        onKeyDown={onKey}
      >
        <div className="rfs-shade" />
        <div className="rfs-stage">
          {slides.map((s, i) => {
            const [l, r] = s.decor ?? []
            const set = (k: 0 | 1) => (el: HTMLImageElement | null) => {
              ;(decors.current[i] ??= [])[k] = el
            }
            return (
              <React.Fragment key={"d" + i}>
                {l && <img ref={set(0)} className="rfs-decor" data-side="l" src={l} alt="" width={240} height={240} draggable={false} style={{ opacity: i ? 0 : 1 }} />}
                {(r || l) && (
                  <img ref={set(1)} className="rfs-decor" data-side="r" data-flip={!r} src={r || l} alt="" width={240} height={240} draggable={false} style={{ opacity: i ? 0 : 1 }} />
                )}
              </React.Fragment>
            )
          })}

          <div className="rfs-copy">
            {slides.map((s, i) => (
              <div key={"t" + i} ref={(el) => { texts.current[i] = el }} className="rfs-txt" aria-hidden={i !== active} style={{ opacity: i ? 0 : 1 }}>
                <h2 className="rfs-title">{s.title}</h2>
                {s.description && <p className="rfs-desc">{s.description}</p>}
              </div>
            ))}
          </div>

          <div className="rfs-wheel">
            <div ref={cake} className="rfs-cake">
              {slides.map((s, i) => (
                <img
                  key={"c" + i}
                  ref={(el) => { photos.current[i] = el }}
                  src={s.image}
                  alt={i === active ? s.alt ?? s.title : ""}
                  width={440}
                  height={440}
                  draggable={false}
                  style={{ opacity: i ? 0 : 1 }}
                />
              ))}
            </div>
            <svg className="rfs-ring" viewBox="-100 -100 200 200" role="group" aria-label="Choose a flavour">
              <defs>
                <path id={id + "p"} d={RING_PATH} />
              </defs>
              <circle r={R_LINE} fill="none" stroke="rgba(255,255,255,.28)" strokeWidth=".3" />
              <g ref={dot} className="rfs-dot" style={{ transform: "rotate(" + (angles[0] ?? 0) + "deg)" }}>
                <circle cy={-R_LINE} r="1.25" fill="#fff" />
              </g>
              {slides.map((s, i) => (
                <text
                  key={"n" + i}
                  ref={(el) => { names.current[i] = el }}
                  textAnchor="middle"
                  role="button"
                  tabIndex={0}
                  aria-label={"Show " + s.name}
                  aria-pressed={i === active}
                  onClick={() => go(i)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      e.stopPropagation()
                      go(i)
                    }
                  }}
                >
                  <textPath href={"#" + id + "p"} startOffset={pathOffset(angles[i]) + "%"}>
                    {s.name}
                  </textPath>
                </text>
              ))}
            </svg>
          </div>

          <button type="button" className="rfs-nav" data-dir="prev" aria-label="Previous flavour" onClick={() => go(active - 1)}>
            <Chevron />
          </button>
          <button type="button" className="rfs-nav" data-dir="next" aria-label="Next flavour" onClick={() => go(active + 1)}>
            <Chevron flip />
          </button>
          <span className="rfs-sr" aria-live="polite">{active + 1 + " of " + n + ": " + slide.title}</span>
        </div>
      </section>
    </div>
  )
}
