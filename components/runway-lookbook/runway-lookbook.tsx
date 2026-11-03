"use client"

import * as React from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

/**
 * Runway Lookbook — a fashion-house runway page. The collection's looks queue
 * up in depth across the stage, smaller, softer and paler the further back
 * they stand. Scroll and the front look walks off to the right while the whole
 * queue steps forward, sharpening as it comes; the look number rolls over and
 * the product rail beside the stage scrolls to the pieces of the new look.
 *
 * The page scroll drives it. The stage pins while you scroll through the
 * section, one look per stretch of scroll, and letting go settles on the
 * nearest look with a broad ease in and out. With `loop` on (the default) it
 * runs on forever both ways.
 *
 * One number, the position, drives everything. GSAP's ScrollTrigger scrubs it
 * and frames are written straight to each figure's transform and filter.
 *
 * Looks want cut-out figures: transparent PNG or WebP, head to toe, cropped
 * tight. Products reuse the look's own image, cropped to the piece.
 */

gsap.registerPlugin(ScrollTrigger)

export type RunwayProduct = {
  name: string
  price: string
  /** Image for the card. Defaults to the look's own image. */
  src?: string
  /**
   * The slice of the image to show, as fractions of its height: from `top`
   * to `bottom`, centred on `x` (a fraction of its width). Default: all of it.
   */
  crop?: { top: number; bottom: number; x?: number }
}

export type RunwayLink = string | { label: string; href?: string }

export type RunwayLook = {
  /** A cut-out figure on a transparent background. */
  src: string
  alt?: string
  products?: RunwayProduct[]
}

export type RunwayLookbookProps = {
  looks: RunwayLook[]
  /** Height of the pinned stage. **Must be a definite length.** */
  height?: string
  brand?: string
  /** Header tabs: a label, or a label with an `href`. */
  tabs?: RunwayLink[]
  /** Index of the current tab. */
  activeTab?: number
  /** The category row under the header. */
  nav?: RunwayLink[]
  /** Index of the current category, or -1 for none. */
  activeNav?: number
  /** Called when a tab, category or header action without an `href` is pressed. */
  onNavigate?: (target: { kind: "tab" | "nav" | "login" | "search" | "wishlist" | "cart"; index?: number; label?: string }) => void
  title?: string
  blurb?: string
  /** Number of the first look. */
  firstNumber?: number
  ctaLabel?: string
  onShopLook?: (index: number) => void
  cartCount?: number
  /** Show the product rail (it hides itself on narrow stages). */
  rail?: boolean
  /** Scroll per look, as a fraction of the stage height. */
  scrollPerLook?: number
  /**
   * Scroll on forever: past the last look the first walks in again, and up
   * past the first the last comes back. Use it as the page or a full view.
   */
  loop?: boolean
  /** Display face for the wide capitals. Defaults to an embedded Lexend Zetta; `null` keeps the host font. */
  fontSrc?: string | null
  onIndexChange?: (index: number) => void
  ariaLabel?: string
  className?: string
}

// #region queue
/**
 * Where look `i` stands relative to the position, wrapped to [-1, n-1): 0 is
 * the front, 1 to n-2 queue behind, and one look at most has walked off.
 */
export function offsetOf(i: number, pos: number, n: number): number {
  if (n <= 0) return 0
  const d = (((i - pos + 1) % n) + n) % n
  return d - 1
}

export function wrapIndex(i: number, n: number): number {
  if (n <= 0) return 0
  return ((Math.round(i) % n) + n) % n
}

/**
 * The queue, measured off the reference: slot -1 has walked off right, 0 is
 * the front look, 1-5 wait behind. x is the centre and feet the floor line as
 * fractions of the stage; h is the figure's height and blur its softness as
 * fractions of the stage height.
 */
const SLOTS = [
  { x: 1.28, feet: 0.93, h: 0.83, blur: 0, alpha: 1 },
  { x: 0.74, feet: 0.9, h: 0.79, blur: 0, alpha: 1 },
  { x: 0.47, feet: 0.82, h: 0.58, blur: 0.0022, alpha: 1 },
  { x: 0.33, feet: 0.745, h: 0.42, blur: 0.0065, alpha: 0.95 },
  { x: 0.245, feet: 0.7, h: 0.32, blur: 0.011, alpha: 0.78 },
  { x: 0.17, feet: 0.667, h: 0.26, blur: 0.016, alpha: 0.52 },
  { x: 0.11, feet: 0.65, h: 0.22, blur: 0.021, alpha: 0.26 },
  { x: 0.07, feet: 0.64, h: 0.19, blur: 0.026, alpha: 0 },
]

/** On narrow stages the queue tucks left and the figures shrink to fit. */
const NARROW_X = [1.3, 0.64, 0.36, 0.24, 0.16, 0.1, 0.06, 0.03]

export type Pose = { x: number; y: number; scale: number; blur: number; alpha: number }

/**
 * Pose of a look `d` places behind the front, for a stage `w` x `h`. `base`
 * is the front figure's height in px, so `scale` is relative to it.
 */
export function pose(d: number, w: number, h: number, n = Infinity): Pose & { base: number } {
  const narrow = w < 0.9 * h
  const k = narrow ? Math.min(1, w / (0.62 * h)) : 1
  const s = Math.max(-1, Math.min(SLOTS.length - 2, d)) + 1
  const i = Math.min(SLOTS.length - 2, Math.floor(s))
  const t = s - i
  const a = SLOTS[i]
  const b = SLOTS[i + 1]
  const mix = (p: number, q: number) => p + (q - p) * t
  const xs = narrow ? mix(NARROW_X[i], NARROW_X[i + 1]) : mix(a.x, b.x)
  const base = SLOTS[1].h * h * k
  return {
    base,
    x: xs * w,
    y: mix(a.feet, b.feet) * h,
    scale: (mix(a.h, b.h) * h * k) / base,
    blur: mix(a.blur, b.blur) * h,
    // The look rejoining the back of the queue fades in rather than popping.
    alpha: mix(a.alpha, b.alpha) * Math.max(0, Math.min(1, n - 1 - d)),
  }
}

/** Card offsets down the rail: products of look 0, then look 1, and so on. */
export function railStops(counts: number[], cardH: number, gap: number): { tops: number[]; groups: number[]; total: number } {
  const tops: number[] = []
  const groups: number[] = []
  let y = 0
  for (const c of counts) {
    groups.push(y)
    for (let j = 0; j < c; j++) {
      tops.push(y)
      y += cardH + gap
    }
  }
  return { tops, groups, total: y }
}

/** How far the rail has scrolled at position `pos`, gliding between groups. */
export function railScroll(pos: number, groups: number[], total: number): number {
  const n = groups.length
  if (!n) return 0
  const lap = Math.floor(pos / n)
  const p = pos - lap * n
  const i = Math.floor(p)
  const t = p - i
  const from = groups[i]
  const to = i + 1 < n ? groups[i + 1] : total
  return lap * total + from + (to - from) * t
}

/** Wrap a card's offset into [-span, total - span) so the rail never runs dry. */
export function wrapOffset(y: number, total: number, span: number): number {
  if (total <= 0) return y
  return ((((y + span) % total) + total) % total) - span
}

/** Card steps along the section. Looping, it runs one look past the last, back to the first. */
export function spans(count: number, loop: boolean): number {
  return Math.max(0, loop ? count : count - 1)
}

/** The position for a scroll progress (0-1) after `laps` trips through the section. */
export function positionAt(progress: number, laps: number, steps: number): number {
  return (progress + laps) * steps
}
// #endregion

const FONT = "rwl-display"

const CSS =
  ".rwl-track{position:relative;background:var(--color-background);color:var(--color-foreground)}" +
  ".rwl-pin{position:sticky;top:0;display:flex;flex-direction:column;overflow:hidden;background:var(--color-background)}" +
  ".rwl-cap{font-family:" + FONT + ",ui-sans-serif,system-ui,sans-serif;text-transform:uppercase}" +
  ".rwl-head{flex:none;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;padding:0 clamp(16px,3.4vw,44px);height:clamp(48px,6.4vh,64px)}" +
  ".rwl-brand{font-size:11px;font-weight:600;letter-spacing:.06em;white-space:nowrap}" +
  ".rwl-lnk{appearance:none;background:none;border:0;margin:0;padding:0;font:inherit;letter-spacing:inherit;text-transform:inherit;color:inherit;text-decoration:none;cursor:pointer;white-space:nowrap;transition:color .25s ease,opacity .25s ease}" +
  ".rwl-lnk:focus-visible{outline:2px solid var(--color-primary);outline-offset:4px;border-radius:2px}" +
  ".rwl-tabs{display:flex;align-items:center;gap:clamp(16px,2.2vw,34px);font-size:clamp(11px,1vw,14px);font-weight:600;letter-spacing:.05em}" +
  ".rwl-tabs .rwl-lnk{color:color-mix(in oklab,var(--color-muted-foreground) 50%,transparent)}" +
  ".rwl-tabs .rwl-lnk:hover,.rwl-tabs .rwl-lnk[aria-current]{color:var(--color-foreground)}" +
  ".rwl-util{justify-self:end;display:flex;align-items:center;gap:14px;font-size:9px;font-weight:600;letter-spacing:.08em;white-space:nowrap}" +
  ".rwl-util .rwl-lnk{display:inline-flex;align-items:center;gap:6px;color:var(--color-foreground)}" +
  ".rwl-util .rwl-lnk:hover{opacity:.55}" +
  ".rwl-util svg{width:14px;height:14px;display:block}" +
  ".rwl-badge{display:inline-grid;place-items:center;min-width:15px;height:15px;padding:0 4px;border-radius:999px;font-size:8px;letter-spacing:0;" +
  "background:var(--color-foreground);color:var(--color-background)}" +
  ".rwl-nav{flex:none;display:flex;justify-content:center;gap:clamp(22px,3.6vw,56px);padding:2px 16px 0;font-size:9px;font-weight:600;letter-spacing:.1em;white-space:nowrap;" +
  "overflow-x:auto;scrollbar-width:none;border-bottom:1px solid color-mix(in oklab,var(--color-border) 70%,transparent)}" +
  ".rwl-nav::-webkit-scrollbar{display:none}" +
  ".rwl-nav .rwl-lnk{position:relative;flex:none;padding:6px 0 13px;color:var(--color-muted-foreground)}" +
  ".rwl-nav .rwl-lnk::after{content:'';position:absolute;left:0;right:0;bottom:0;height:1px;background:currentColor;transform:scaleX(0);transition:transform .35s cubic-bezier(.2,.7,.2,1)}" +
  ".rwl-nav .rwl-lnk:hover,.rwl-nav .rwl-lnk[aria-current]{color:var(--color-foreground)}" +
  ".rwl-nav .rwl-lnk:hover::after,.rwl-nav .rwl-lnk[aria-current]::after{transform:scaleX(1)}" +
  "@media (prefers-reduced-motion:reduce){.rwl-lnk,.rwl-nav .rwl-lnk::after{transition:none}}" +
  ".rwl-body{position:relative;flex:1;min-height:0;display:flex}" +
  ".rwl-stage{position:relative;flex:1;min-width:0;overflow:hidden;cursor:default;" +
  "background:linear-gradient(90deg,color-mix(in oklab,var(--color-foreground) 3%,var(--color-background)),color-mix(in oklab,var(--color-foreground) 6.5%,var(--color-background)) 62%,color-mix(in oklab,var(--color-foreground) 4.5%,var(--color-background)))}" +
  ".rwl-fig{position:absolute;left:0;top:0;width:0;height:0;will-change:transform,filter,opacity;transform-origin:0 0}" +
  ".rwl-fig>img{position:absolute;bottom:0;left:0;width:auto;max-width:none;transform:translateX(-50%);pointer-events:none;user-select:none}" +
  ".rwl-fig>i{position:absolute;left:0;bottom:-1px;transform:translate(-50%,50%);border-radius:50%;pointer-events:none;" +
  "background:radial-gradient(closest-side,color-mix(in oklab,var(--color-foreground) 22%,transparent),transparent)}" +
  ".rwl-hit{position:absolute;bottom:0;left:0;transform:translateX(-50%);background:none;border:0;padding:0;cursor:pointer;border-radius:4px}" +
  ".rwl-hit:focus-visible{outline:2px solid var(--color-primary);outline-offset:4px}" +
  ".rwl-copy{position:absolute;left:clamp(16px,3.4vw,44px);top:clamp(20px,4.5vh,44px);z-index:500;max-width:min(440px,52%);pointer-events:none}" +
  ".rwl-title{margin:0 0 16px;font-size:clamp(15px,1.5vw,22px);font-weight:300;letter-spacing:.08em;line-height:1.2}" +
  ".rwl-blurb{margin:0;max-width:300px;font-size:clamp(10px,.82vw,12px);line-height:1.65;color:var(--color-muted-foreground)}" +
  ".rwl-foot{position:absolute;left:clamp(16px,3.4vw,44px);bottom:clamp(20px,4.5vh,40px);z-index:500}" +
  ".rwl-look{margin:0;display:flex;align-items:flex-end;gap:.55em;font-size:clamp(18px,2vw,30px);font-weight:400;letter-spacing:.1em;line-height:1}" +
  ".rwl-look>span:first-child{line-height:1.15em}" +
  ".rwl-num{display:flex;font-variant-numeric:tabular-nums}" +
  ".rwl-dg{display:block;overflow:hidden;height:1.15em;line-height:1.15em}" +
  ".rwl-dg>span{display:block}" +
  ".rwl-shop{margin-top:12px;display:inline-block;background:none;border:0;padding:0 0 1px;color:var(--color-foreground);cursor:pointer;" +
  "font-size:8px;font-weight:600;letter-spacing:.06em;border-bottom:1px solid currentColor}" +
  ".rwl-shop:focus-visible{outline:2px solid var(--color-primary);outline-offset:3px}" +
  ".rwl-rail{position:relative;flex:none;width:24%;min-width:200px;max-width:340px;overflow:hidden;background:var(--color-background)}" +
  ".rwl-card{position:absolute;left:0;right:0;top:0;display:flex;flex-direction:column;padding:14px 16px 14px;will-change:transform}" +
  ".rwl-card[data-tint]{background:color-mix(in oklab,var(--color-foreground) 4%,var(--color-background))}" +
  ".rwl-heart{width:13px;height:13px;flex:none}" +
  ".rwl-pic{position:relative;flex:1;min-height:0;overflow:hidden;margin:6px 16% 14px}" +
  ".rwl-pic>img{position:absolute;left:50%;max-width:none;width:auto;pointer-events:none;user-select:none}" +
  ".rwl-meta{display:grid;grid-template-columns:1fr auto;align-items:end;gap:4px 10px}" +
  ".rwl-pname{font-size:8px;font-weight:600;letter-spacing:.05em;line-height:1.5}" +
  ".rwl-price{grid-column:1;font-size:9px;letter-spacing:.06em;color:var(--color-muted-foreground)}" +
  ".rwl-plus{grid-row:1/3;grid-column:2;width:12px;height:12px;color:var(--color-muted-foreground)}" +
  ".rwl-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}" +
  ".rwl-track[data-narrow] .rwl-tabs,.rwl-track[data-narrow] .rwl-rail,.rwl-track[data-narrow] .rwl-login,.rwl-track[data-narrow] .rwl-wish{display:none}" +
  ".rwl-track[data-narrow] .rwl-nav{justify-content:flex-start;gap:26px;padding:2px 20px 0;" +
  "mask-image:linear-gradient(90deg,transparent,#000 20px,#000 calc(100% - 28px),transparent)}" +
  ".rwl-track[data-narrow] .rwl-head{grid-template-columns:1fr auto}" +
  ".rwl-track[data-narrow] .rwl-copy{max-width:62%}"

const icon = { fill: "none", stroke: "currentColor", strokeWidth: 1.3, strokeLinecap: "round" as const, strokeLinejoin: "round" as const }
const Heart = (p: { className?: string }) => (
  <svg viewBox="0 0 16 16" aria-hidden="true" className={p.className} {...icon}>
    <path d="M8 13.4S2.2 9.9 2.2 6.1A2.9 2.9 0 0 1 8 4.8a2.9 2.9 0 0 1 5.8 1.3C13.8 9.9 8 13.4 8 13.4Z" />
  </svg>
)

const labelOf = (l: RunwayLink) => (typeof l === "string" ? l : l.label)

/** A header link: an anchor when it has an `href`, otherwise a button. */
function NavLink({ link, current, onPress }: { link: RunwayLink; current: boolean; onPress: () => void }) {
  const href = typeof link === "string" ? undefined : link.href
  const label = labelOf(link)
  if (href)
    return (
      <a className="rwl-lnk" href={href} aria-current={current ? "page" : undefined}>
        {label}
      </a>
    )
  return (
    <button type="button" className="rwl-lnk" aria-current={current ? "page" : undefined} onClick={onPress}>
      {label}
    </button>
  )
}

/** One digit of the look number; when it changes the new one rolls up from below. */
function Digit({ ch, reduced }: { ch: string; reduced: boolean }) {
  const ref = React.useRef(null as HTMLSpanElement | null)
  const first = React.useRef(true)
  React.useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    if (reduced || !ref.current) return
    const tw = gsap.fromTo(ref.current, { yPercent: 105 }, { yPercent: 0, duration: 0.55, ease: "power3.out" })
    return () => void tw.kill()
  }, [ch, reduced])
  return (
    <span className="rwl-dg">
      <span ref={ref}>{ch}</span>
    </span>
  )
}

export default function RunwayLookbook({
  looks,
  height = "100svh",
  brand = "Maison Halden",
  tabs = ["Runway", "The House", "Atelier"],
  activeTab = 0,
  nav = ["Collections", "Clothing", "Lookbook", "Beauty", "Accessories", "The Edit"],
  activeNav = 2,
  onNavigate,
  title = "Spring Summer 2026",
  blurb = "Cut close and finished by hand. Every piece in the collection is made in our own workshop, in runs small enough to keep each one exact.",
  firstNumber = 1,
  ctaLabel = "Shop the look",
  onShopLook,
  cartCount = 0,
  rail = true,
  scrollPerLook = 0.55,
  loop = true,
  fontSrc = FONT_DATA,
  onIndexChange,
  ariaLabel = "Runway lookbook",
  className = "",
}: RunwayLookbookProps) {
  const count = looks.length
  const trackRef = React.useRef(null as HTMLDivElement | null)
  const stageRef = React.useRef(null as HTMLDivElement | null)
  const railRef = React.useRef(null as HTMLDivElement | null)
  const figRefs = React.useRef([] as (HTMLDivElement | null)[])
  const cardRefs = React.useRef([] as (HTMLDivElement | null)[])
  const pos = React.useRef({ v: 0 })
  const st = React.useRef(null as ScrollTrigger | null)
  const size = React.useRef({ w: 1, h: 1, railH: 1 })
  const [index, setIndex] = React.useState(0)
  const [narrow, setNarrow] = React.useState(false)
  const [reduced, setReduced] = React.useState(false)
  const onIndexRef = React.useRef(onIndexChange)
  onIndexRef.current = onIndexChange

  const cards = React.useMemo(() => {
    const out: { look: number; j: number; p: RunwayProduct; src: string }[] = []
    looks.forEach((lk, look) => (lk.products ?? []).forEach((p, j) => out.push({ look, j, p, src: p.src ?? lk.src })))
    return out
  }, [looks])
  const counts = React.useMemo(() => looks.map((lk) => (lk.products ?? []).length), [looks])

  const render = React.useCallback(() => {
    const { w, h, railH } = size.current
    const p = pos.current.v
    for (let i = 0; i < count; i++) {
      const el = figRefs.current[i]
      if (!el) continue
      const d = offsetOf(i, p, count)
      const q = pose(d, w, h, count)
      el.style.transform =
        "translate3d(" + q.x.toFixed(2) + "px," + q.y.toFixed(2) + "px,0) scale(" + q.scale.toFixed(4) + ")"
      el.style.filter = q.blur > 0.15 ? "blur(" + (q.blur / q.scale).toFixed(2) + "px)" : "none"
      el.style.opacity = q.alpha.toFixed(3)
      el.style.visibility = q.alpha < 0.01 || q.x > w * 1.6 ? "hidden" : "visible"
      el.style.zIndex = String(Math.round(400 - d * 40))
    }
    // The rail glides from one look's pieces to the next.
    const cardH = Math.max(150, railH * 0.47)
    const gap = 4
    const stops = railStops(counts, cardH, gap)
    const scroll = railScroll(p, stops.groups, stops.total)
    for (let c = 0; c < cards.length; c++) {
      const el = cardRefs.current[c]
      if (!el) continue
      const y = wrapOffset(stops.tops[c] - scroll, stops.total, cardH + gap)
      el.style.height = cardH + "px"
      el.style.transform = "translate3d(0," + y.toFixed(2) + "px,0)"
    }
    const now = wrapIndex(p, count)
    setIndex((prev) => (prev === now ? prev : now))
  }, [count, counts, cards.length])

  React.useEffect(() => {
    onIndexRef.current?.(index)
  }, [index])

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const on = () => setReduced(mq.matches)
    on()
    mq.addEventListener("change", on)
    return () => mq.removeEventListener("change", on)
  }, [])

  // Size: the queue is laid out in fractions of the stage.
  React.useEffect(() => {
    const el = stageRef.current
    const track = trackRef.current
    if (!el || !track) return
    const ro = new ResizeObserver(() => {
      const isNarrow = track.clientWidth < 720
      setNarrow(isNarrow)
      size.current = { w: el.clientWidth, h: el.clientHeight, railH: railRef.current?.clientHeight ?? el.clientHeight }
      const base = pose(0, el.clientWidth, el.clientHeight).base
      for (const f of figRefs.current) {
        if (!f) continue
        const img = f.firstElementChild as HTMLImageElement | null
        if (img) img.style.height = base + "px"
        const shadow = f.children[1] as HTMLElement | undefined
        if (shadow) {
          shadow.style.width = base * 0.36 + "px"
          shadow.style.height = base * 0.035 + "px"
        }
        const hit = f.children[2] as HTMLElement | undefined
        if (hit) {
          hit.style.height = base + "px"
          hit.style.width = base * 0.3 + "px"
        }
      }
      render()
    })
    ro.observe(el)
    ro.observe(track)
    return () => ro.disconnect()
  }, [render])

  // The page scroll walks the queue; letting go settles on the nearest look.
  const steps = spans(count, loop)
  React.useEffect(() => {
    const track = trackRef.current
    if (!track || count < 2) return
    let laps = 0
    let target = 0
    const trigger = ScrollTrigger.create({
      trigger: track,
      start: "top top",
      end: "bottom bottom",
      snap: reduced ? undefined : { snapTo: 1 / steps, duration: { min: 0.45, max: 1.1 }, delay: 0.1, ease: "power2.inOut" },
      onUpdate: (self) => {
        // Looping: the bottom of the section looks like its top, so jump there unseen.
        if (loop && self.progress >= 1 && self.direction > 0) {
          laps += 1
          self.scroll(self.start + 1)
          return
        }
        target = positionAt(self.progress, laps, steps)
      },
    })
    // At the very top there is no scroll left to fire onUpdate, so a wheel up wraps.
    const onWheel = (e: WheelEvent) => {
      if (!loop || e.deltaY >= 0 || trigger.scroll() > trigger.start + 1) return
      const r = track.getBoundingClientRect()
      if (r.top > 1 || r.bottom < window.innerHeight - 1) return
      laps -= 1
      trigger.scroll(trigger.end - 1)
    }
    window.addEventListener("wheel", onWheel, { passive: true })
    target = positionAt(trigger.progress, 0, steps)
    pos.current.v = target
    const tick = (_t: number, dt: number) => {
      const p = pos.current.v
      const next = reduced ? target : p + (target - p) * (1 - Math.exp(-dt / 160))
      if (Math.abs(next - p) < 1e-4 && next === target) return
      pos.current.v = Math.abs(target - next) < 1e-4 ? target : next
      render()
    }
    gsap.ticker.add(tick)
    st.current = trigger
    render()
    return () => {
      gsap.ticker.remove(tick)
      window.removeEventListener("wheel", onWheel)
      trigger.kill()
      st.current = null
    }
  }, [count, steps, loop, reduced, render])

  /** Scroll so look `i` stands at the front. */
  const bringForward = (i: number) => {
    const s = st.current
    if (!s || !steps) return
    let k = i
    if (loop && i < index) k = i + count
    const top = s.start + (Math.min(k, steps) / steps) * (s.end - s.start)
    window.scrollTo({ top, behavior: reduced ? "auto" : "smooth" })
  }

  const number = String(firstNumber + index)
  const look = looks[index]
  return (
    <div
      ref={trackRef}
      className={"rwl-track " + className}
      data-narrow={narrow ? "" : undefined}
      style={{ height: "calc(" + height + " * " + (1 + steps * scrollPerLook) + ")" }}
      role="region"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
    >
      <style>
        {(fontSrc ? "@font-face{font-family:" + FONT + ";src:url(" + fontSrc + ") format('woff2');font-weight:200 600;font-display:swap}" : "") + CSS}
      </style>
      <div className="rwl-pin" style={{ height }}>
        <header className="rwl-head rwl-cap">
          <span className="rwl-brand">{brand}</span>
          <nav className="rwl-tabs" aria-label="Sections">
            {tabs.map((t, i) => (
              <NavLink key={i} link={t} current={i === activeTab} onPress={() => onNavigate?.({ kind: "tab", index: i, label: labelOf(t) })} />
            ))}
          </nav>
          <div className="rwl-util">
            <button type="button" className="rwl-lnk rwl-login" onClick={() => onNavigate?.({ kind: "login" })}>
              Login
            </button>
            <button type="button" className="rwl-lnk" aria-label="Search" onClick={() => onNavigate?.({ kind: "search" })}>
              <svg viewBox="0 0 16 16" aria-hidden="true" {...icon}>
                <circle cx="7" cy="7" r="4.3" />
                <path d="m10.2 10.2 3.3 3.3" />
              </svg>
            </button>
            <button type="button" className="rwl-lnk rwl-wish" aria-label="Wishlist" onClick={() => onNavigate?.({ kind: "wishlist" })}>
              <Heart />
            </button>
            <button
              type="button"
              className="rwl-lnk"
              aria-label={"Cart, " + cartCount + (cartCount === 1 ? " item" : " items")}
              onClick={() => onNavigate?.({ kind: "cart" })}
            >
              <svg viewBox="0 0 16 16" aria-hidden="true" {...icon}>
                <path d="M3.2 5.5h9.6l-.7 8H3.9Z" />
                <path d="M5.8 5.5V4.4a2.2 2.2 0 0 1 4.4 0v1.1" />
              </svg>
              <span aria-hidden="true">Cart</span>
              {cartCount > 0 ? (
                <span className="rwl-badge" aria-hidden="true">
                  {cartCount}
                </span>
              ) : (
                <span aria-hidden="true">(0)</span>
              )}
            </button>
          </div>
        </header>
        <nav className="rwl-nav rwl-cap" aria-label="Categories">
          {nav.map((t, i) => (
            <NavLink key={i} link={t} current={i === activeNav} onPress={() => onNavigate?.({ kind: "nav", index: i, label: labelOf(t) })} />
          ))}
        </nav>
        <div className="rwl-body">
          <div ref={stageRef} className="rwl-stage">
            <div className="rwl-copy">
              <h2 className="rwl-title rwl-cap">{title}</h2>
              {blurb && <p className="rwl-blurb">{blurb}</p>}
            </div>
            {looks.map((lk, i) => (
              <div
                key={i}
                ref={(el) => {
                  figRefs.current[i] = el
                }}
                className="rwl-fig"
              >
                <img src={lk.src} alt={lk.alt ?? ""} draggable={false} decoding="async" />
                <i />
                <button
                  type="button"
                  className="rwl-hit"
                  tabIndex={i === index ? -1 : 0}
                  aria-label={"Look " + (firstNumber + i) + (lk.alt ? ": " + lk.alt : "")}
                  onClick={() => bringForward(i)}
                />
              </div>
            ))}
            <div className="rwl-foot">
              <p className="rwl-look rwl-cap" aria-hidden="true">
                <span>Look</span>
                <span className="rwl-num">
                  {number.split("").map((ch, i) => (
                    <Digit key={number.length + "-" + i} ch={ch} reduced={reduced} />
                  ))}
                </span>
              </p>
              <button type="button" className="rwl-shop rwl-cap" onClick={() => onShopLook?.(index)}>
                {ctaLabel}
              </button>
            </div>
          </div>
          {rail && cards.length > 0 && (
            <div ref={railRef} className="rwl-rail" aria-label={"Pieces in look " + number}>
              {cards.map((c, k) => {
                const crop = c.p.crop ?? { top: 0, bottom: 1 }
                const span = Math.max(0.05, crop.bottom - crop.top)
                return (
                  <div
                    key={k}
                    ref={(el) => {
                      cardRefs.current[k] = el
                    }}
                    className="rwl-card"
                    data-tint={c.j % 2 === 0 ? "" : undefined}
                    aria-hidden={c.look !== index}
                  >
                    <Heart className="rwl-heart" />
                    <div className="rwl-pic">
                      <img
                        src={c.src}
                        alt=""
                        draggable={false}
                        decoding="async"
                        style={{
                          height: (100 / span).toFixed(3) + "%",
                          top: ((-crop.top / span) * 100).toFixed(3) + "%",
                          transform: "translateX(" + (-(crop.x ?? 0.5) * 100).toFixed(2) + "%)",
                        }}
                      />
                    </div>
                    <div className="rwl-meta">
                      <span className="rwl-pname rwl-cap">{c.p.name}</span>
                      <span className="rwl-price">{c.p.price}</span>
                      <svg className="rwl-plus" viewBox="0 0 16 16" aria-hidden="true" {...icon}>
                        <path d="M8 2.5v11M2.5 8h11" />
                      </svg>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
        <p className="rwl-sr" aria-live="polite">
          {count ? "Look " + number + " of " + count + (look?.alt ? ": " + look.alt : "") : ""}
        </p>
      </div>
    </div>
  )
}

/** Lexend Zetta (SIL Open Font License), weights 200-600, Basic Latin subset. */
const FONT_DATA = "data:font/woff2;base64,d09GMgABAAAAAD1YABQAAAAAeJQAADzrAAEBywAAAAAAAAAAAAAAAAAAAAAAAAAAGkMbvkAcKj9IVkFSg0MGYD9TVEFUZiceAIFOL1YRCArAILIdMNpeATYCJAODHAuBUAAEIAWGKgcgDAcbYW8l7JgvuB2A1Gvtm0dRCzIrGUWJJs0y+/+PyY0xsQfVsgc6BDoUZcGsqq4ghJXttJNWOCDC2EzAjI3UEiEIIWzZbch0yqjxeDccJ1fbLpuyb6EJG7hcD8gPyN+OE7wE2UhQo6xRtpWE33E3jARJ7T+SRv+s0viesDyOHiqjcwM6Nt1+6eZirIyQZLaF/2itfL+qu2d2j2kuTIpQSEbFFiWCjIxClAQymj2qzPC0zX/qwlwaYAJSBilSgh5RUikWInKICFYsdFV/00W3Lit+8/RwMN/d/UBLAwk14sFojvv53PzvAAlJiN+b5EaUxJECFf1mshs1eIz6ZmvrmdU3s7ZP6/5/a6/3zc7SfKAJEO0HpLBKUdja1VWRMtL3VD9U4RqfX8z+k235M8iXeTssEbioyQiBGLoXEdn8jqujpyJY9SuxorEjnUVVVVezxJY9hLt7gJQehxckD0E4Lc8+Rh99foi0BDNskCxt2nTYV08ZJk8pTICsArlA+l70oIICenR9qDNqZDsEe9kjgK67qvImx03HDxURL1AcsGVZFs1IImhuprLQwhVzWxF8HsZwZTLMVkGK4Z1QhjFnOMeB/fzrNL/pCGi9qThPlyrlsVvfDsROHKOYvpBMspMr1bJ0miuDlb3zkIcMq0YekoLE+NQlgTKFg1kHgEsdiN1TgeSeDutUwO6dBJIyAM/xZFfmnbNRA7v/mjVXD/Ic7y3fWJd+ZGzqog8/CFKfuiAIPgv/almz9DdfW3ek7EK0FMJ8UqQgMf6qL3Td9g8pLSEkF3e+b2u3dj5GNDiExsWgEAqH0FEKyr/QOKwH/ssf7u/ZBaiKuGNaM5ryIEDKx9f7f2+zF2K13TMuk9NJM5ahPESC5Eoo3iCJ61u+3utDOM3y3R0iGEMMFcRwDEEIqH2B9k+4YC4IcEDw9R8LBFQZhi544WKVCQzYtb7BDwYQAPYsW+3cXOcHoVA5hoCdbFSzVc0fRQwwK8EaJaZuSyyb6jRFS4f0v22Isc1gdbbYttt+u2j/+Wa7aZ+t9wdbaiOGcLpD7vMOny9BwPhuP+jn/bo/9bfTX+iQHnShKYwJXWFpxMeZcXn8nerS+vQ6/cz6ZDOyfAQjL1FDBKZZjhdJZVSIxkCYLA5XIBRpS+UKpUpH18DQyKw58xYsWrJsxZqTnaaho6tnYGhqZmHp0bM37z58YyFLvebBMAtGAWC87Josf27PFwY5Vs7j0pxmdzvf2lyDmxa5MpS4XTISwF5iBGOBNKAyl5MlDZ7sqghGjWomipPlHWbMkzBvwlTcwz0iswFxj5jcxBzSlg0zUSDVZcsNJwFvymVJDT5Ns1zV7XSXTZc9ipaWOHnxe8cAW4cN6NbXWuSRBoiCtyoxgG0GlZVVwMlkUmSjQYMgQ/5FqWdXMbDMS3kC+WahkYcIu4GhqUnBakqhOjpFKq4KPVptYGtAcL5DQtWzcpeqwpEyRhtDjGhpdYHUrTJBEzEbveCKQAhwKvBbIOQ505ZUrk2IAdlFQCkmMteVSYpsyT9LcYJlvw4o+wI9j/1WhCewaLasLmVNUDZEDt3nlNnPDTWBQJVpqvlcI/QPe1VsYhy6l/Z5eVViiBpbAkAiVGJL2VqRHYK7uIcHeIFXwU1oxragS9IsyBAsiLgnAAIMB3E+NbZWBICybiNL0aHzp4zJIossMph6bGYWu2AGlgXXm2EoJGJCFoQZBpXtB9mNDhERCQkJSWJdVf35Fbks8eqipgBSpJqERLQJZ8NKct2ZulbWRDoIUnQAN04AgJtFUKvLVKsHrdqTBIF7xoArFeDgl3bojoG47EAAuc/kYQlJwgeQ/YZMG/uKlEiZ1sC/LUaxEFZ3vnEKeZ53UYN1zpQpnAJMv9i6SRRRMp1L15ealH5m628O2GmvVYPFPAHX5oY4gogl1wWzuZHznfxIw7J4GdK/TVWW+IUqJPgXFmVqFbosi+NUzoCgToK+NCcW0KtN/fm5pqYReTsBwiQiJDbR/SR63issrrcgjWhKLwH83uQ6S3ul227keVWHpxnM60P2cPWIERZmj77832E06sjkMtIdv4ntGaD056tKOJXKSQwh6gD/ZR+uOfNX5Fg+rnAZ5bQvWCFtK9O8htVMbAI30VXSXGUxpnJoM76CmiQDcr3AYpRoqoGtOE+zLDAmKxwag6iqQqDHOvAuktvW5VfqIqKWqSpLtUdb9UThObjU4tRkAJWJ2tCxbMGd3lgT8S2p3docG/uccSrARIVfD3HGjLYK2NPaKZ46NPQ2/MZTg15RZNfay6DVml4MdGnfiC5n0VhwJkp8jT+PGkObHYdPTLhL/sk+lIRq2h4/Tfmg2U0/YCpNxZjkCk2qMBAubL/pgmsyenNWH0fqVS0tRehxN6SrYSbD0QUXZpbY0UgzFekh/6c07dlhUEu8XaCAmzNFXStDB4cX7RmLS9h+Ji4P+xta1/XbzXP53ylqpKcgTuBHlOd0Mi2NPa46PfFrqqqIO6TSboqUfgjkXQxNUsfepCcudDs6xRZXwaupLdk0HxxQyYhZMJ/i+GEps2JfVxyFaHR3KXbFyrdtB46sv4aXgZFSYjMPJAgAnFdnnciipC2eXx+c2Ji6qlxB0by+WiY7OY93dlXHHc78CEtLvfU0v4h9mFM1pCNtb+jnolMxzRXsdVrdlaT+jh6LddV8ba4O+Vsax5PyLw2c6mPuDB91P3Vo2stchkn0NFjH3Rht6k2m2FdTG8p1dRyejSHs17BUI33MglHLxBQEDdGXSxpxIkrq2Tiv0HDnco8eXO35fO+8tzLs3UzYPoMsULaof5TItpoCb4R2hSMnWQIQlnmadtk4RmSTzLIIuQYTDTCeyNWh0OVbcKhNdu8OAy6MpcvJIAwVDwNi6lWav42VUpYhNl6pxgjwQCQr5wEa66LBOrCmxvfrJKQNhoBo7ObscGTthwBId9MPAOB36Xz9KwpvPZRvo8Dz/gFN0RpwDLnGpptvrKn58kVMUOS/lLjEOW6Q5lUXGgAE/6PEGwACgKra/mb3qx3czfAvne/Kb+z/VP9k/9nB04NyYN2dQ+UhHB0ddqN2/Kcj1dEfHd0fZclfj9FsS3nvxAcnPj3xxYn1+fGDwwdi8eypD099fGp/8d7pT05/foau3ruwd+tLF9dvu+/Sk5eaqw9fefDK59f+5//y+v/DH9w4cu/Bnf8mf77TutK8tvPYv7r/ePpKPPQH3lLPrKvepjB0NxB8itC+K1FxWtsui2wKUIAunbtkkqKOQ4KIVpzZcWxb1EbjglhCSVVOUUrCrS0XkjEJ0b20rIw7DU21AEUR2eTQmtNoksh6jYSp5aBGyioenMRCPgbt2RMT4/Fcq8t3SE+XC0ZsJEkqCFIvQO6PTxKIv14bMCweT9+8FB2KbMzBpHfvPv/bpaeCw6DeG43XpYJwXeMEejlWZ48BFEIQIm8R0PeJvYIPbPU0BAEAyEsYdLkSs+W8KJang8ahbbaiTpGyIvto0q9sZmbLTiBi65rzWA+/XaCA/m1xRYPBD7cKMeNr9eEhgG6DhFBlIg6InUObEZayp9BQSNRGZlCg4hIoVKad7eHLEcq2nu/7pIXPD+5j/qNtgugGmAFsuMNS+bc3h4SVQhEXOxsdPbkSQioC+UTEypRykCpgomRWTsvNoJCRUxDQKBjRqi9VIAmyPDywbCcC0Wc6W7UKRE6pTpE/R/VKt/4CqEGZ+E413l0oowby7Faf9w7AFUDlIKDuHoAxAJP23uiFgualaYlRqoSYYJTNEmaJEwUpZJtI2ZkKlMugl0wZIehPtjaP84yOKzNHkgpiEGt8KxNllgppQC0THCrSNExNE3nqHqH4RdZQ42bVESxl1kMLFTpVKh4lBFD+yFMUsmkZK0VsswpLUaqgCCwVl0IevsmZorh3NQTBE0wqq5SkLGu1DAKXocihZvNg+mkFy4YspbiIYuXBLbhBnN9KSlJmLP1SpN2Y5pCScjDThEgE+WE2s5oycOKhCbFW6SNRouAvGNQ6504wasuwHjPgtLOcNSwKJDhbyMeKgLuxlTyP3nX1qbCFnWXEXtXaBCQOzCpSBEUPMUVFBpMTv2QBrCKls3TOsU9XMP349f3EmHTNtMiKpYqAwEgwRUQAcgfn6g67zG9u7r/P40/568le/AgeT9GA9ENhoKEZP9HARIx6TM72kcDcSASJyuiTqd+iUcC4Pvo07ms6T4BE/fq3LS/udzJ0AEgvTBSDsVCxTqx3RF/rLwLS75G3qPOlGQ9V8O0b2iMBeUchrDcM9PQsiSosr2Yl69lmCPnF/ZHN3TrqqFnBKlLkNmzCRjC8h5T/4hzkJlz6WB4p71qUuB6b6YL4+7N8TU9Pnr6FPWk7xU2JqcFfhMS52KEGAuD3WzXu0MQ4To080JSL+BYaAD/bbsEqerxDdQY3i49L7ei4OSfw4vdtNvMxH/Mxr9VcLd1bETHBsCmxVfhJIP9Ljco27GYFrL5teWFL+RCl7dIZwd2wI97RvHkWQafilIm1mTtb8zA1v7o2ljNQd4fKkA8j+F/L7ZrYIbP7G9HBti/dTKLXjjRva4/fPZTz1QT78qnjEaGMn7tjZYhPI/gZNF0NtmC9dXw9zchv4sJFM1+xntErtdasDRNoS2KnwleYv2Vm4ujaMyPPEEbYEBd+cjaV1qEfmJ12wRELMqX5aa+HmwHZE3l8u1/ojKUG1y7NGWF/aNIGHiYAx0q0JPPmxSynFtrNvSCbI12gt7dQ+pHaNlt6ojsKKrBu4+By59d1deXhf7Vl+/rI9uzmuxEwBXYQJwehoVAsoEfw0i8t3lzk59NX5aUlrrLpy8QpHapYEQC+3G/ROJNCgluiJvaqP5ukxmTrFAOsLQ6kF+VbQlETFbA+cHta9Zo3MyHBdB1TBM+yMBSqlF4yYO3GVaJSvKZtbGwZm7OeyQMyfzyouQ/OU5U1VXinKZhy34bPvWfz42FcAF/vW541ML2Q29M4HMjMxKP2LRIuipQttuLzYJ3WUdQJ7JVgY03dizlLFIa+YSW4NX2Tg/Hb9vYqWxuXzsppKKmwctuyorqpc7KHm29Iks7MCBkqj0dcHYfZUiVN2zZHqF1jeWNDHrAT8o2sYk5U4wRrQ357xB0cwfqoLzGM/CF+oDGE9YIlOQ2/6+39dNlYWGbgMpd9/HlM8I5ekRsbHCzd6MZdImTZLeFNjAnopDmoSRsTctV3gC8SwGb8WGwOsSKOq9fg8l2sotsZnHPyV/D8zkt4ITFF8+IkxGs5twVDkjdTmXPRbENC6rHv9DRyrMyMEoIhIbZARE+Ju6ix2Tw9zOyRyDyW1B453B7oZUNzREZdtzXWLpSpHdEjEqXTPaZFABD5G57PIxT/niJlzWR/0BzTqWabMvydqzkuxu5rLnAoE7ge2v0oHQz/7kkjFWOJccuLyoY/hdtnMwksKT0fezBkwd11ueWdvA65nNDczy8OJrbbR0H+uCpWiILohBvt1cx1UlfdjsX59Tb3cn492Dzcnb3x3wQjAmH+PXzn3nsGIce7r8bxs9rPWibvBDNyg0sYoQt+xsWsxlilt3cpz/LvYjdypnorVtF1M5hcO1TDkcJbI7KNgAd7+XXsfhTsGViS01BDgkPTmR6DhOr4+V+cXV8NCa1z5Ptw2KWBnzi3OugtiHd+ywOtlVivaBnfMk1lyC9vfsD7crklJL/MG99ebHz2t/6hxfjPMz7etU398OfPCzJXaKlWDe1uestpyNZIzFFzWAqddJDzjDaDls/iU7U6UtkQWgZMpcpjFqfq23QIPqMSj72hSKSaCLnxYGiYqYvuL+GP0auhzkDpDIZe3I5xMe7n2fl6UgmSne3C6CFKESePVmLOq0JxecXJCtKNrILdjuw2LNjd63R0scodtOEyOW1EeWkX0/GjKP270osTiVC2LDrKKhJ78cpftqY4iefO+zueMLrnmmfxZezrlaV4PngeZnkiPSAlzDiLVF8gHFegFHQ2ORZm21UdaGf2QYkmx0AsiqOL6nAWEcXOFNIdVr4/icf3xmrT96Ejf2RUTk8eHNZHy2v0q+biQUSvr/dIWoSHBbDZAw5W7Xm5p+ru9DMGpodBDpwwu264TIkI/NhFyDFlkazZzM1Vi6vGQEy8S6nzk0HwpvaQrqWfe3p9va/obULzyMv1tE3XjXW9uZPw37r3GUkz9p8RoVxLgIU4ayOUU8GYttexKhbPpu4nDpEH5wMZ+qWvt5pKiBpMK1BlJqQCfFjxPGatkz9KqUwss2IXF1UhtysXK/RIavFGMamIyXTmzIsSSZ1DJmQy/pcM7O6dl+tm88t4eSJ3gCdCBnsH4iE0jE4pg5LwAwHtsD/UbqP2teZTNvNObP+QU4cIMrM396+WB5xyRJInZ5OoABKO4xsZpYirBGRK+d+raMJQX7KKQpSQaWSViVGTIJTWJ9iZt2SabQqyJY7GNMfFpyS8aNEM/LE7EGPFZwmyxfqKLhbwm8I94zyDTCCsr3eRzTrP6fd5JZDPzxfLA3zIJ/HCfqd13iIbWCLsadu/tHhmkuBQy+dNGB1G17tx+UhuDygJ6mnunt/45ati3DofASUIL3SgPcNSzsULphY0QSv33n5VtqK7IaVHefZm6rmr4KqeYx/ZHU52TwlXDeNp/iGRxFzl5/RpYCdnqKr50uxBjrgwxzjTToUAuLTBMc5B3vGa4FgDwwu2hJVOkSjbtTpd2x+SYm55vCKjE3FlAhwFz2DFbc/PdCQklYhhMkdHp3O0MFksgslcLZ3O1cFkgA5jFCXI0h4ZrnXAT2At1XheSixEMmxTJaZWndbQPl3qKhW5yVwdPYurdZNEIg+Jq826RjzYSa6oS2ZuV2vMbfmPkqKiRdmXOMZ1mjQrIgMqIzN1DAZX5yTzmJZYMfoQS1s7PcvI61oKP/+w3ec8y8T2FrWQ6XbIhuOlwnqsVUQtCu3LidX/eokQPCtKZIgDaMFuaom2PUOvr0wLzlRfs2OrYkBUZB7TUca8fyvkJ/2LsSVa4+nLxqZEUkLjJs8vPV4Kvr4o7MB5Us0Ff5mGMrgFJLotj7+6UMtpxknsEySqdq1O3zZdUhInipDHQsmNsdZ2+ISaXmtWVGF1XHEFia3LYrC1FWSxxEfmF4fO1319FsD99+Eq/QmVopYq1FXyst25TBiXSRapcJQMeYrgdHxsVnw8uCfCUYxJaFpKkgg1+RmBjuP4QrGFTaxUTIJXFIvHNyhCu3V//P4hjo0I1MROL4h8Xvx8+CCMSKirAFffh5+D06JnLjz2upxcmsxlFaZy5CyW40iKNMOSRLM6+WlwHs2DzkwQ3aCTNYnbUUL8f57UTJRAhuOmS5Jpe5HR4L4Iz9RXyBUuap7Rz2MZu1ygwq5Khk5hDzj3QomtXauztbnsdi+QWDrtkoFVFIv9JEg3NBrSyhSXjrZPiDFSgHuvvfW0/m6TM/04qHSKWNN6enFN2xRJkbSemM9tXVT6hCZ2u5h7F4h7M40Na180+8QjyG7fz943OddX/skUPYdu/FDYyhgMnGQgP76yCBqQSJIlodYn9wHLwormkZgSqKE6XRg/hv9nDGbaKUGk+KwbQejcgUsdLyM4ojlk96Bi7L/Z0h3KFO1gHHJM0u+hkU9PTdMN+QVXIsyHIlLYEmUDHuC3wdsGrnXddYFtYZJKiNtqCoWfilMLVSRemhxRkyLO+AlHwf6ECxJeFRGMTIts/dR7+q8TDfRIEHs4shZ0LixbIrUtlwUtXOi5Hik7OV0RcW4h2PH6NSNiwILTDwenJewIj5PyD93559dLspPnuwHpxdRvGrWqdX4yVkRzN0XdIFeiBbOSWwhDhj0CLkt3ZegqS4Rpuou2wQKWhrmnFsmXezyJZd/tmlAkLcyYBcvLHN4Jw4dTdLhqYPwnD2RT2TXri/HWneXOWSFUT4cHzEXpP1++fyrmBRJ1f04GXoUUsy6oWU+s6roMqbyCyjSycAmi/+ae2Ltp0bvtHlAXVj7e/MAoJFoVeCrJgphHTw+SxWBiUnfvwAnCfk2b5voxVBLbf/wxMZKkS/6JVWTKNd7RHHD8d8LAEia73E4qGLEC7gWBfupxuQ9YpjeVDBrThKFAZHykLpWWIR6I6ceWEYnLXSVPUQ8y921XRmLlzWyZWypR+0dBYCLXnaqGMuysTKQxU5ejju6c0sHZsVciKMi0V+TJ1eNlGVYkQ1rHFcNCqbSpQ2orpxsxdAEZQ4IM6Uy2jpABYfHpIm0auB41H1rr+hUljm0Cs4JNHRy5MwfXBP/TZkNk7AlJYYps9QyZvI4htDEx0TeRv7D3grjopBy5s4NjKmcYkr6h0AMN8Vl0Y3wKGhViSMpipQuRw5ORsDAuI0McByOTh4uRII8zdF9f+WTBTEE0QVjJ45dzFapAB6RhlaUqc9NNdFScgqAlayvcmyhWtg67AY3drMGxM1WodxmoBfl4MDg8m4hJJGdPf7fAxrM//+7GDpkVpqxOxAlxmBsBYvI/cigTfP/MIEYNmARJ10qhqElxo34m/y3zcfVcRS74Lhz0KvlkHGqNcAhWW88ema8uWaqEda1ZYhsHS4DE2Rbi+8H2yV33nLYFEtj9JybWmSmq7aVXlpi4ynGl9v7zS0NX3xpTtBYvtmWvsHCUrYbT/SeCpOYe11yLX+S846xYVLa7dZfzthNUj0Yeg8Yhd0Ag2ot4RuhAhhDAsM8Ot8OP+Vp8vXhZCVTiLCmeBvLvvhOaQ6/HjDn8OoeYqrX5S/ZWVSXGM4B1+z7exFJ95YsM3KfGOZGq9DQRDZSEqljyjEKSPF8UAkqAdoR9ZsxgI8GQ1C8ySJugyBdEBQsHKhQJQdqoY4aEKjDtFOeICPkyuSLCG3DUkOi93VuVuwKzDrRNLcFYry7Al4DyA+9TU9uAaKxjrndw42/VoiRh4aqomC5tTG5kzExdDKhelaHj/7i/dhXM5gd8/BmmRmfPxnFPpB2N27ktbv44tYZWY1H4MLzMI98SBtgTW26boLJUKtNIoKqYVGKZSuejipialJc6jBS5roL42OTYi0jag05RZ9sKOtfJWmp72ZOqVAsrpJSAWVuTLuSoI+TIF1j9DAvaFR2qz1Qn7LzKrYwk3RlL4JrpZBU+4yn4rLLeO7unEWKeJwgxRLa2mqmW+fCavGa5pLCOkZ2sSkIMQl9K+hDyIX3iggMDfZNzRS621NHgxIll6qEcaQYq34yVEeyxWkaWXVQjJwe0eiejEgkOHF7VuAo84Hxb8gQyUcHGMaLCtO3OtogxFJk+d+J6F+SdHV6s6maudhLapTvpRa0irLx/ylZUgbQwfReltggaa1bzO6tLuxnWdF24Mvo/qjNQNJie58Fo8tILWPzMIm2uJ4WHebVlPs357xGij0C/KnkXVPyua2obFIPOt/XV9Y2vs4ZngeZ8b4m3+JynxAN6Qiim1xesYj8Vby/qgTikY9a32lmQER2rtsyv3OodlNg3ubiP0lKijRk3xR838djCIRhun+KgTJxelQUKAgh3AylHP06kP08BUU96fK97HJFsPTeznJfblw1cdrk8l0f+RWQUJGDCsHgkOiGeHo/FpVPrmoSu3mnIaQHkFW8qhvTThllI8AgEANnS0XEWRwg/hDJojLvkJDbLpS7dRuW18r82Q+QVaess/l3+N0PddFmJnD4AAcKAL8AA8AMATDeFJ8JIoEId02P9n8y1Uqu1FXbP07zce/zvUB8mhN3hSaRFfQzErvgpqdLs9CXLz8blwfmCHM6X5UfzqxWoMrpyRKebRV6SClgLh+AnSIVB/6+yWDmmJCjFyv+U06e0L1lvOW35Jd2tHlJPqnfULLVc7ciQ9arVb82whq39z/7kxNYBn7tqTz1VdamT1H+eWkFXomq0Cn0F/ez0j/A/h8Lgd9qDs0wV6Gv6dfpq/ZvnSmPVWD0Vnm8vCAToQw36AEAE/mhn3w5aQcb/L2m2a2yXx4sGfuQwe+kVVwioWaNy4dyLeCA7Su5NyeN8mNxZWmORgJhZVMciKdjND7Nf0SzHkATNsgwFrK+9RLTAFXBRZeWcnOwCL4VOmIVT6rlf1FDsoPbE5k9468Z2glj0L0DkusdGTVhnMGqnwuCHgz7pzWDQpl3ycpasL5hqWs1sx8SZjzFCag6LRsp1uuUFVuo/R70tVfXiiu4EMVyH1nUipvFgxShDMtRo0lVorkq7z1C4FC4M5GuIZULcRZlqOMAr/YwYe8doX+lRbTmXV9pBAzmHnTywUJIorPaiE9E/2ptdUvV9nhZregfvDYk9i6urmSBhT1hIbJokmbaf+ewO/LQgdRoQpAhGLhMdQSvUG0jEUknRNvKPPQuex8uJ2YEbjYTer4yEVVgOec5N+D6pwKoo1X/cmrnJzlAp2+Jc/wwDs3ysSDHsYQzJtwdSYUoG6e5gAVmbejPbNVGGhSmCUbtGs2v2nlJFRegOY1DCz7mPgFgnWSCVq3NwYgf1fAoTKLXmFjAKicyn3F0M+rb5Qj73UeCUTQLdyEvMbg1DaUufUDevtE5BEuSryID/HAR/lWzw7SuwAO3U/VKaRP4E+RDocCe55XQwHPICxdhFmtRC3BEZTb78/2Tb5x8ry7nVWTnzbJk6lCWEmuYhD7t5ENKqPr/Si06df8ZgdkHVD/neFUy/VS7uTK963gdWWllGPTKHz8DWot9dcmp8FNnymdbJStyJY1uyYlr5QZCGMPY+stm8ZeDD4R6xHFHaHAWuowoKSnRuByqXILmk5WhaqKFx3ZaHFMH7vbD5waE/ztkRQrcuA4j3vNN4y94fN7VSIIT/FMdzZX0Jexc4QrVOfqz/xcv/4Dks/mB9S6DEZ83MzlHr7wGzTAiskBUxuPFqVQbWiZb6mTQqZl2ZmzvceHEkC18I6aQq4S+DmIwV5KLFy4sTOlXBPoXVWntKsnZsaGF1BWWaafuCCJRLkT7EfmGHEZ4t6b+psMQgvlc7mGC+d+Lv+CPfdu7n2IXdfw3BvzD+9Vu4+tlmnB0rTtod+KoarwBdk5rh+ouhJHCEK1ECKWMx9aMDGBCz+03mAK4HPvRI+RkD4twvc7b/qX8niX3L/rz9L5HGcQyUeY0/GiD+BSetLl8mim/M5Z2xPIbM7C3mRj1XPslPiTqdlfB0wIX/8r8Y6wVBv+gzAYZkuPtgOffbC5rpt5M0ST71r74iCSyJY5iGdPpz7/3/D/48DIaIfvvvWq8phzL/c2vccNfRIndPKJ91bDiKtGinVc9cPe20HFqRb3OXF2EQQl4XXCmtbNWWhFAjWpaEFDktBSX7s2uq2VSiixOiPw+hVSBDvdeSDx5lUyisCNshTM18f70a2byVxy7qY6yPFHlDEIqePZZJhdpTs/m+T3RpEENyj066cRG72pgW7HNiMPv1v8G4eVMIZsHs4CwM7nGzgyan3v9R7hwGoRNoNIhnXMo4dj5FglemYD3bmMFwsBxf6NwR8XI3jo4h0Ki6F/B5v3Oq3v5jgQNO4aytr/U+9IGbyNlvVdB76imIhuO1IpL5f+NGcYcV1DzPDXMU0q1VHcyVxrkQfuWc38DQQAN4fdCS+2eZZ0IgmzqGXW+/QWNGNSzktGZbyB9BTcabzIKaiCdV45zyl/2qWuCkqLsZibKTG/6H9knV37cRriqZ+7uA/msebOtW2rKVU1SvpdjZvYgB32zr6wBLD6eR+K+873fuSuI4dDTRDgyB8DrLt85mWGrBdlOa6H+oUGvmK8MwcTcEuvCsfpd+i+JKoRTULUzH833UBEZih6KtsffGedVeKOJ54bq2G2V8U9Dq+QqOlmEeFhKdrKVOHYMTquHlAoVLlI2T1CgEynXMVa6nt1zcJdmiDoXAM1q5sAKnCc+9kaKmFlIbhDcofbkl1pClgtL6TpQjrGuioutQA0/4UZqR2Dvu1R+2tpovwUKgVPfKYKH+D6CjIYRIsAVyAnUSyBgh8s/PdsLp4FXBnC6ymS3rkzjpA/SP6H6fjvZCiOAsCiYkZBJWLh5RuNPiDFInlNkMCFurhbTzMQAgQ1/7o+1ZuuXPrKLH3xkAKER4D9saYd0tGDkZu16cNjfXCQ7ktJ5svu3hMezntXtqfzDsl+V9uP9LY+HCjp8DkDxu/qw3HI2G46IV0ld//E4S0f9U1bRd10m+/Y7AygL4IdTRL7vdE2n++NJ3/vo6+++/rzeS67nZ+ecnv7D6DI1plkYwzn7eulfcRkuppDAyjOh00jPsifWeCPH68OLLOilhP6+XnjbsZQci+xlXM5o2U0aeFwZx3p3pT2t3/U0wO4QBQC6+bH3pm/80/P+/++Kfj/4A/nUAVwOsc24eAPHOm+lRkGv9i3EQw//JggeqSExTlX7tYXX782OKAuYwDz4+muOvyQ08Kzfjc7fvDuaMCcDhT7CACy4ywTfnO5mH4YcfNyHwHYg/vbS4OGns39fvb9al46mbJBtAARTkEbwxJ++BaxtIC9dErgKoVO8iLXkPbNLS9D60Lzu2IUfm1E9XRSl74hLfQsYasIWkQ+r1SFpT6rJdY17JfZNDeK4pyXq42RMatBb8fyTyxAbJq1k0Rje1aMv4NP48LEWjXQ+O7P7GQScrXWcEUJhGRGx7JI1PPHOoqPMhwtqaxlKq+3ooMQN3anTmavHcWLXT0EGD/XjEWWmrnq16716mQ7e8hnuY7iuJomg1g1suVA1NdoSFz/0jKQbN3gLB+5CnBOQsjLa6OD4PrZqFKk03TNMnvXVP+MfeWO9gpASFNKqrCyrzmV8KbZM/DFhEdUQeY3+0RkLKw4MkhANYXcUMNnxPsAmZLh10gjPhdD9qrTaBYzzflHM5ho1LrKt0GIzmXR+fCA1HwlpHIUKvk1P11G51Or/V8f/R6Sl6blZU8KJeJe28z3dDN8MkKoQHuipp2J1LKfBhbxRJMJSNznlhUVGd+FG42dHULfQBuCpzhX2GG0pLuuHX9nRQoDfkc4paPxfyuugWRnGXa50aupQOVnY6JAymT5ep2XqxrHhIzxz8pqsZizc7BEIJz47pyT1rHRHvtJJ8H6cb/xTahKHITi+2fh5ltIxsCSARB0KorPdqXC2cdR7W1/XBbIYvVlxzZOXBFXC5Vz6MCxMpFd84nmuqitIVrxi6ZVO3TaqnpgYsVOHsf4JTwC/VFhn2gvDY56Nc/SIKw/KGjqhAhMPHVMKQW1FYXZWwOyLeBj4wRZ2773l+jtFULksaklOd7hHyOOyh4FEiwS6GMHS9N7z9eb6fjiw2YakjjxawAHOWrcHbnS2ySrqVOZ7nVF22cKnOze++l+6bdIuSdo8O+2g3T6aNF/P+xVPzSHhuQdhEG8VxZSjUmFWlHEfj9uI8JJSZj3qd22i3BAc4IMH3xN8qAKzccPP6DNqWFa+7Vu2ndVMVCjasdErXVmWC6hc0Q/Eqa81TQZMLjhptdbt9/D0Unsv4F45mUAlR56ZCqYnjCGEfpeaMcmuExhHsBowiTLYrZotkPDthkP09qEebYYFknJBlYYg3PjPFXXiPm4gQG9yHs7TW3ABzRbAqDhWBLta/X6pkLU1dNI6Jl23XVSWppXZOM1ujFBsEr+Javk5TW8EAwHSQwZQOVx2aY4McoU1TeRIxSrTzHES1PdKiGguqCHNL6X5AlLuS/M+NqbnTM3SMdXTiZJ3WwG7gBL5AU4gujXLDGLUQHOxZvXNvi0uj3hk8HgFtWaLExdUv2vrvprQP4efViMAha70p5mHbPYhagFYS/1E4hl0aVLrEELm7Fo0a/CWHqoJJVRVZtmG74YZbeDM2U/qtKKv1OlllqoOg5pq86iAPKpEu64XcS0dRWgJFIJObDKw7FBfUTFsbpcs1wUvYQimwwe6c+Fts76uIvyKPun8MQZ+I/1DjCgdHV/H2Lj5+wtwd7GabMYRVuQHmJ2KqAUwS0OfyB1+D78J/ylpsgCQAA/e0dy/ALPOPMeh4UGIYgoXZ2rEM05FUJ8hVWpzJytYkcoqmJ6pU6Ek9CB1UDUoFK+N8NNtU5dQzamxVmQ6iZeQ4E46LrLRXBSpzGJ6xnbSLThY4BGm2pluORYjl+pATNKY2WQpiskuDiQsnznFww3jEnI4MtSWltkkS+SSyUs2sgqVZ6blRSQkrcFaNFMTCHNZg7V35iD9ELUXSNNHvlummBny5Uw8DB75BG7zhxdrpM1x45AZu9UyMdIus1bnNrmnz+j4ZkjIrXdS7GmzODb4DkeYYQX+re6r5oj/f3d561e0E7PQK2+52cRekee166OuAR8CQ/ppSc/BbHeIjATZPKCSJpRTYrxBIv6WDaGQReiYmVZ6HuiUKRvCH29dOnQx9GMqJLwMoEH8wQRU3qXZuYElRyvfZhh0OFyz9TxB73HLj0Zj1sa9yf+7WVNIwqiMfGOH9+JoML3Ql85PdvuraUlef0Mg1YHSMohkaUiQVO4ZlTja16J4hNUfpNCd144hZSq12WlQQjrELR+k8yVJbH1b0E7gWrkmqVh3SnCijfZLHL7TcR+vZ0PnQDlev7ZstNXtHwDGMs0Domgad5x4Ne+KhYHpdIfZ+y+h5mO50fait7AnneOKjaCobqZSOiIK2FbxuyuJQY/Fib1TFTLoa78qRAYcx0wIpHG1iBC9pnyRG/YdE+to5IeXOA3WTAC0UZWo4mYwwkRdkctQfOgq2HZQNPmHqXC8F8DmLcy0PSt/8OZmaW31FQYZl2a6KBOPLFsbbPilHeuefnd/zok+qVpiGNnwXvocvN8rA31ZB4+2yh7rbs+kGGUkB9VZp43CBRJru3nUSh1PVrynNixL5oXF4roH3b9EW0pzCgYtLYhuqqCHxY9BO4+1+OxvzFApOAAazfVSgbcaWwwqLVlClSnwHMfVT0kIupCSyDTQaF5p1IawbuqRdFeYRjUPPIuVMr1tiUxeCMHmuwFzTWQqJpkM0WkkhNQaIfanOag5SSxdJGZdkDbaWve0bD4dca0GAPRu+s7dzNqh5FqiTW3ZGjhmoeyNYql4CANN1nYv+66BJSXIXqUn5K/JQZxEXOUyErC2NGn8+QsdyWdXUSkIuVhVRHq52RMj9tIcFtdBNzG32VkveB1i5Eu4BMS96lYdrIU44M6O3PueADnoK7lR845di89dd8Ec4kA3+DeuklY08M1C3HinA32CXJiuL4gmkkH79qBPxvT8rq98Fzuo3kyb/ew/8GQ5s4/6En0LPEjXm+JTs56qVT4raKDHJ7qM9bs3pQRDGlvlaIafXSooDPnRUQpbJUqztDfwX/4qizduPffPHzu1XAKGPgiyoBjeLXMltYP5R4zI/7rF8mum5dbU7Ezcu7q0lPsWMl9RJM23gPIu+9CafKxUgnGfi64cCb67s0S+/7qQH/v9YltAo9PGXfqfP9t/9NynnP0cPakmPFZ5GKNE24i4Ngf2xLF51HBqV4WR6nXXXh2jd7pZ7Lm+JUujvzOcf/bsGeBa3v7/fbu/gvQ/y/KbRiNSNewfKQB4/btFjmO+2CdYgFgx5cojD7qdIY6S0NpddDugHePoAHAyBFwhS1LmQsOPh5+mCC08XYsLHiayPRGxFsXgU9UZKLyKIlwvixkUX+teUPgAhigT7ETY3JThyyV1KSDanYEe3DW3etmVvwb/4ocX6w3fC14FvPO+Xe7m4AQbHZtyyZ1LS/fE6f3oGqjChP4jNJW4Gfg9nkXPDMK7SpxfFcJmODCxmwU8Y0BTU+1irBUVXPUi8eZD/fs+4bmnE/ZHam+u4By1RexVFSYbNpPt6r7e5c1rxoqSoElmp9b0kPco1+SitWvJxksQUZcp0vJpOlLbW1IOXKjdKiQC+u/Y+ROhro+AKuBovIk/w4sy60e5o1tOO2rzAru288Hwt+lgVl24XzRPsxY7C4zBcwD8vnISClUvWhlgv1I8+Mzc3aeRaU+lIdmmoyK+euKzStGZbJjFEaULtkwzpJj7SsXY9bVtSXL+dFXbiNRa1T3rJ9ioDR2VwJklq294N02lnx7Y/2qwVs0gSgID3MaCeu4Ce729QPx/+Yswb5tsougH6HnfhYSJtR81pcjCyoyU+JrqA60CFc+FidFzMPNx+ksZBMe9Oh3ANSbKD2B9xOKW4ZSeCoRDjkCO8kKhRej2o8qFXRvGhZmtwJJxqv0Tw/7iWt3qcC1FsWqWWqGMlsetZrnLrXl1HGdZ6NRjBgMOhCivLhSKChOO1oIqTVcZ3nA09D5nSeklJCNwt3czUMFcRHkqnkrhbPDmh9SSQDwSlnGdKG6WMH3VXqIHNwecrEDYgDDN7iFTGtludxUqi2/oA1//AsNKRQFUlmKqf/I+qzmJcMGvzvFDH/yPP0Iq63lu8U3iXL+aEIFHrQxPv8Ysqb40FRZlJRq7YlEEOYYCC2XvZmqiFt6nvwCdvie+mq47OC+iYS2UUvfi7w1XkMsLvR++/32Asmp44Pz+B0wmP7F2luroAZpS9YbazFv4AfxHVEbFeMcvD006i+1hwSiHCjhbxC3K4Q9rT5Q5ils+LypXa2X/GlFCwPOlSkYSTC+6zbi8AQ0g7Zw1GIXIhSktDlvXTdaZhKYpzSklqHQb4afBxnQ08z9MazZ6fBEGZRssngOstAda3yMs0bTYc+oWBVA4bo0KmXVqoBblA7TrpkEK8pmlNmUT7yqV0XoumNdzS1uUwt1UexFBvIdskjVwXkZWx1phFSsXYh3GSKy3GsDkiSDBigS7wqYkKoqqikdRa3YESaeIcXrhBfEEBoPeWqyjCi7RiCtqRLY5SJuGSpSSg3BB5g5Oghq4C77dWtDV0eeC/PM0JN96SiYL9kRCtqbfxAn5ySiVL9kbaNpHEETtGlkYD040s6EHMKISUp26cq/WQmmRkf4J0zbB0ZurnDpqIGc9TE1LRBVXG01xmJ0pvDTBGYIEGgDFcDtMKtwUQcSdYjRQrcL08HNofoai9n93Vfja6KWPvjtDchU5a6XjcdEmJWxLk86N0/hiid5Dbc2USCt+Kf3Rj6bAJb6qejFoNuicKZfIfsxFehfO4N5ViVKuNBSGyG08p+j6Stb1MspTEM4MONWVWzOQFTKAJWw2/wP7J6aF0NA8X56AVbQFAI0X4covtTTfUBNy0YegN80JrLeovLy29LopWYUZ7SyEn/PH/zLT/EqHRmV+DwJGQsPTfG9GgThdrbWKI5KbJeDnyWoo8leoUuaPL9tBJ5VoKYRR4ZyWRMSS0c8FIeCwsjQ9xmMIH83iwsro4illKg7GXZ0enqu+nYQ7UVPthiXdOxwSM+rCEw45d/l93MwMiz2ZRFqtG71AK0GplUBUGJln1UqafEaSF4mUqwG0vKS2rJrT1aS5M8pIMoo4KU2mQoBHUkJSi19QTysKQ4tqgydsLhD0tOF/U+ulq6PjL803gdDhhBAvfT9aIuI0laTeq54R8EceNrRf6+/k+AoeCe+LyyWeEA1fUddvmjqfiMJLXTlpdqqaWtHl90tWTpOR4w9ajnut2I2KHkARyHEh0JOmVll4yBb/KMvNpCHwK818hEQBQO+1N+aYU3O6Y3bf6ul4jEd9hMrqPoMIYPngt69eeevABvN/9t/tj8L4YfGCdmaqIuzHvVx2Kr2TFBGRhenaXP/erBwmkGPqp7bdCsC/AxTluTM/owTbYARZ6qOWJhNNp/f0d4J7jUXTOAATNsrgFrbtWNuyPB1PqOd7yUFrPPHmQ4W8FvxIrn4eXppNlok8u/Ub2id16cn4Q6zcI6qK+iWnjKHxl2aTXDd4fQztkAYB8LyhC2TrD3k+t/3AI0jw2lmHP2jtdDo6dmch/mCX/uO57NkEJU9t7OG4RpM+mKjKua/fLFVOylJELs0NS6RtwBm7DO6EJhB6n2QlxxcrczHmfd2uV8RJ2FH/PHLgcLpXyxxaLTO3TYVEYUhSL8MgeD1iGpaFtmzTTC0eoBZb5PkvrjWiHI8inB1rBzDtzD1FY4PQi9lE11G4MCbnaopZCRY30B6LCUj8uDcZaUzssRFgywAfRUoi1birIyZ+7Zq0E37LD0uSio4wCm3jkBVNTBX7QH8ZJnBqaRtLkI9Tv6kKqZ6WpkwASBAzjyFzQOvN3LzUwsShe7WL2Qz/pYXvGZ5eFk3MeD4xQ7iTUVTQbYwWqFRHtkyTDxMLWlFtX+HsYAR9ke7utzclBELchN9OmMPSwdWst8yBfTdZHsDYVxCm0BU25f11IkHQPUSzceUFPrF7c6CcSnutArJaOM6794f7kFYScKs7HjLg/L8x///p+8+/Mo0McxiSdwvPVrr7yBvZnhu7aYsaHvGaly0qEmPus5zZuhj3wf7lClZe3tnLqEjXWOJDl4UmnX+kOjI4k9E1zuN7fVsJK68hoKaPCNMQl6VGYCS5qjMwtv7Lok2UAADdPf8gevfl1H+j+1xby03q02AmhG2CVY0s5rJYhmpFOF4/ereC8RwTCAT48jEy3AE5J0yRyodI4FSYS00JFhVXOI8unrQpPo8SbiqBm0lxyuVuOTl3pc8qljW69P4Vy/oI/8KHMIdbi5mRgegnKIrm/oVg4SVVrK7ms5p1IGYJjl2c6a9E6f6SQWGoWtZm3QsYstvlasksHKluLVpbPJsPfSxxptJI0etF6R2XTUzKFRKRgRAF0GJ4M2pkZo9KVUj96jOGzQJ7y5LpWgiIrf+jdnQb96nxgYp4TzV6iw6XEc2FJSLLVSgl5IHhFcLbVD5GYS//om6gzw5BrXhCFcJQvKLI2NGoqoI2EGmIdDSStmCZSYqYHkMKP2voBQDPOJdjYT4+WEfadIdhfkbrjf35B+M0J3nfDQSvFcYU3qN/V5s+i9WAUVQPYak1I4SUH+0cVJAXXGO9RFBMQPKWDmwfVTmF4YzQGba5iWZcXe05ttmFHFHE5XwssRh7v6uJIZ97agIApFw8s6wQN4swKNW9cDee5vVMkK+phF25y3z8YWxUM4wLviwLHUMEK442j/eXUx86f0jRPb4tI6ydl21SBf4UbI3Gdn0qX6Jz4O2tgKYqcEni6+XQb/lsqWJ/D+6cPYBW+Bz9MWDsWEv9F2tH+qwOqk9RjznbxeXe88h1PlVusKeTu96764vd4y9RN2Iyf3kze0f88K74HhlDJ2c9xJUspgcs0YmqSkQ3q6XxpfoaYtoiTnevYXqA9KCnnOcLcvfVibmXdus6lLAuab+60qSJLTBVS1CVRKDIHDbW2gznrk6PxC3IE7GUyD6BDeGojFxce3p0lWU0LI4VsbxIYi9LT3USuKKrDsbZ1rYwBRjOHHFwl3cxEMlfqUsesAebG4c3yAs7+e23Zbglp7MfL7n6w6oPgWIlFiPl4Xj59eNPfydxCX5KdGmF4Owl6+LF/Xv/YOzdtlJKm+irppCRulMo+8mVYzeBUES5JUZxFvm3U6Wo+nwYSJk+MqzbLTGH6m6EP2fGlST1lqTjJGnAAhVQlPbNd08GU8JbDONe3chh/oSC894l3B07V2X4trIwRdgkkwZczImbq2vko15IZuJVqu8vhZfqH4/VDp+7milaF1Zwa7Wb3gOiNBt79PvvnrmzDGc8Dma4+ta+YX+TzKddUhpHUkxhqQZ/fTIvjBdctpS7QZNwcu55KK5v7C+6H/gWiuRsvpal59jAo11M5grPh7M5Gy1qzy2LfiG1R3+FSj6NpIjuFwwJp+mdBNYKDsLlkeoGFdScU07CYR7Rr2UES+1joe/lgaRoVqr5tG+RkxZixg8ledsp7Z3RPTLifRhZEITjmZRQnSRxKFAS7B12I4NdLbEec80FuxkBysqHfkCe/AwdFI3PAFy9HLnA6OFJe0jYk3dQ02NfNksAp1E0FiHdgO1RImhCjz0OYj1W840ebsj9nVnv+pEo7dsIw+zpKDa8I+il39OOnLHvoHfcHo2DJVlEE4tnSfxiHzQ1Qwl2fE4lYTl5QrGAmwSJVb7ju2pogr75p3pc1c7TqXHQ6n3/RDTaFQG222cZsoA6hKGXbt5mFGrFmwOXpTB+itIgHgMbiYIMvxTT+ET7+PFEnejamExodGiuCAOn17m7dK1V5v/sh/gMAn2d4rwMA3xs+1/73M/rK1jABQMIAEPiPUkF1+P8ilC5MEFkzWyuHuMcU7Rm7/QYdAZ2NBYl0FAJ3CaSohYNey/CjFGNUzZjrULZZQ4fvK8i3bl/DHHNdNOt9L0X3j3XvaHOH0a0B127Tspfc9xpG+XH0FVT0LjP8zTL+F/ctntNmxb495kXwKc6A1bRW6DG+ZONquxEFSaroB4bvxtGBVWC+WMx7zBzfgr93cI2Dq3OY4v2X4X+wL5zF/VUKQwD7FBItCx3LC8C8zoaxXn8xvLAsD06OdT4tknUXtrY9moh/yYw3R4t+0aXjSptQ6DoYSn1/MltbGuMzM8wVM9H14k+9Zn30ZcX+Y7y+cBAe0Vjoq2WUa2hZEMfQ6CNd1iLNbt14owDO6PtPiCBgK5f+7BLqtlyo7qrZQ0JQqABXAWVWdFqeNep5mHVmOp0NjEqfbKQ7maclRkR6NkGtdmWd1rRkA1Udy0fVnGQTtbqQzWjM8mwt47I9W8eQPJxZryfbwLCCA2+EWCwiATVa1akE82iAQkdFw5kM0woqfJUKLcT7uaDo1AnwTrly0aJAYy56BGpGveeIKtho1CzquSgoYJVcrcV3Iisfc9UMltl4ephPBbfhPzbqazN9mh4qTa9hN662WMaAD2vkK/PXoSGjomLJoaFNhmRqlGucPASJ3DvlD4Wali0qrMtVmjkDpe/+0AHWfoCLEi0T1K1TrTa8G+omwzX6jaoZC1R7QgG+SqpIj6qsIrGIXEt7RS9NG7Ut5D//7Iouv/G+/n9riqcCAAA="
