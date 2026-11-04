"use client"

import * as React from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

// Split-panel product slider: a photo on the left, the copy on the right, round
// thumbnails riding the seam. Each step the copy lifts out and the next rises in,
// then the next photo slides over the last one while it turns square.

export type SplitSlide = {
  title: string
  description: string
  /** Photo for the left panel. Portrait works best (about 9:10). */
  image: string
  /** Small round thumbnail for the seam. Falls back to the photo. */
  thumb?: string
  alt?: string
  /** Button label. Falls back to `ctaLabel`. */
  cta?: string
  href?: string
}

export type SplitSocial = { label: string; href: string; icon: "facebook" | "instagram" | "youtube" }

export type SplitPhotoSliderProps = {
  slides: SplitSlide[]
  /** Wordmark shown over the photo, top left. */
  brand?: React.ReactNode
  socials?: SplitSocial[]
  /** Small vertical line of text, bottom left. */
  credit?: string
  ctaLabel?: string
  /** Button and line colour. */
  accent?: string
  titleFont?: string
  /** Page scroll per slide, as a fraction of `height`. */
  scrollPerSlide?: number
  /** Scrolling past the last slide comes round to the first, both ways. */
  loop?: boolean
  /** Stage height. Keep it a definite length; percentages collapse once installed. */
  height?: string
  className?: string
  onChange?: (index: number) => void
  onCta?: (slide: SplitSlide, index: number) => void
}

// #region steps
/** Wraps any index into 0..n-1, so stepping past either end loops. */
export function wrap(i: number, n: number): number {
  return n > 0 ? ((i % n) + n) % n : 0
}

/** +1 when the move reads as "next", -1 as "previous": dots take the short way round. */
export function directionFor(from: number, to: number, n: number): 1 | -1 {
  const d = wrap(to - from, n)
  return d === 0 || d <= n / 2 ? 1 : -1
}

/** "01" style counter. */
export function pad2(n: number): string {
  return n < 10 ? "0" + n : String(n)
}

/**
 * Scroll steps in the section. Looping, it runs one step past the last slide,
 * back round to the first, so its bottom shows exactly what its top shows and
 * the scroll can jump from one to the other unseen.
 */
export function spans(n: number, loop: boolean): number {
  return Math.max(0, loop ? n : n - 1)
}

/** The step (0..steps) a scroll progress (0-1) rests nearest. */
export function stepAt(progress: number, steps: number): number {
  return Math.round(Math.min(1, Math.max(0, progress)) * steps)
}

/** Scroll offset inside the section that rests on step `s`. */
export function scrollFor(s: number, steps: number, start: number, end: number): number {
  return steps > 0 ? start + (s / steps) * (end - start) : start
}
// #endregion

const FONT =
  "@font-face{font-family:SPS Playfair;font-style:normal;font-weight:700;font-display:swap;" +
  'src:url(data:font/woff2;base64,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) format("woff2")}'

const CSS =
  FONT +
  ".sps-track{position:relative;width:100%;container-type:inline-size}" +
  ".sps-root{position:sticky;top:0;overflow:hidden;display:grid;grid-template-columns:1fr 1fr;" +
  "color:var(--color-foreground);background:color-mix(in oklab,var(--color-background) 76%,var(--sps-accent));font-family:ui-sans-serif,system-ui,sans-serif;outline:none}" +
  ".sps-root:focus-visible{box-shadow:inset 0 0 0 2px var(--sps-accent)}" +
  ".sps-media{position:relative;overflow:hidden;background:color-mix(in oklab,var(--color-foreground) 10%,var(--color-background))}" +
  ".sps-shot{position:absolute;inset:0;overflow:hidden;visibility:hidden}" +
  ".sps-shot[data-on]{visibility:visible;z-index:1}" +
  ".sps-img{position:absolute;inset:0;transform-origin:50% 50%}" +
  ".sps-img>img{display:block;width:100%;height:100%;max-width:none;object-fit:cover;object-position:50% 40%}" +
  ".sps-brand{position:absolute;z-index:3;left:5.5cqw;top:max(18px,3.4cqw);margin:0;font-weight:700;font-size:clamp(13px,1.4cqw,22px);letter-spacing:-.01em;display:flex;align-items:center;gap:.45em;color:#211a15}" +
  ".sps-credit{position:absolute;z-index:3;left:max(16px,2.4cqw);bottom:max(20px,3.4cqw);margin:0;writing-mode:vertical-rl;transform:rotate(180deg);font-size:clamp(9px,.8cqw,13px);letter-spacing:.04em;color:#2c241e}" +
  ".sps-dots{position:absolute;z-index:4;left:50%;top:50%;transform:translate(-50%,-50%);display:flex;flex-direction:column;gap:clamp(10px,1.45cqw,24px);margin:0;padding:0;list-style:none}" +
  ".sps-dot{display:block;width:clamp(22px,2.4cqw,42px);height:clamp(22px,2.4cqw,42px);padding:0;border:0;border-radius:50%;overflow:hidden;cursor:pointer;background:none;" +
  "box-shadow:0 0 0 0 var(--sps-ring),0 2px 6px rgba(0,0,0,.18);transition:box-shadow .45s ease,transform .45s cubic-bezier(.2,.7,.2,1)}" +
  ".sps-dot>img{display:block;width:100%;height:100%;max-width:none;object-fit:cover}" +
  ".sps-dot:hover{transform:scale(1.08)}" +
  ".sps-dot[aria-current=true]{box-shadow:0 0 0 2px var(--sps-ring),0 2px 8px rgba(0,0,0,.22)}" +
  ".sps-dot:focus-visible{outline:2px solid var(--sps-accent);outline-offset:3px}" +
  ".sps-panel{position:relative;display:flex;align-items:center;padding:0 9cqw 0 11cqw}" +
  ".sps-social{position:absolute;top:max(18px,3.4cqw);right:max(18px,2.4cqw);display:flex;gap:clamp(10px,1cqw,16px);margin:0;padding:0;list-style:none}" +
  ".sps-social a{display:block;color:var(--color-foreground);opacity:.9;transition:opacity .2s}" +
  ".sps-social a:hover{opacity:.55}" +
  ".sps-social svg{display:block;width:clamp(11px,1.2cqw,19px);height:clamp(11px,1.2cqw,19px)}" +
  ".sps-copy{display:grid;width:100%;max-width:30em}" +
  ".sps-block{grid-area:1/1;visibility:hidden}" +
  ".sps-block[data-on]{visibility:visible}" +
  ".sps-count{position:relative;width:2.6em;height:2.5em;font-size:clamp(10px,.95cqw,15px);color:var(--color-foreground);margin-bottom:1.4em}" +
  ".sps-now,.sps-all{position:absolute;line-height:1}" +
  ".sps-now{left:0;top:0}" +
  ".sps-all{right:0;bottom:0}" +
  ".sps-count>i{position:absolute;left:.35em;top:50%;width:2.2em;height:1px;background:var(--sps-accent);transform:rotate(-48deg)}" +
  ".sps-title{margin:0 0 .5em;font-family:var(--sps-font);font-weight:700;font-size:clamp(34px,4.1cqw,74px);line-height:1.05;letter-spacing:-.01em}" +
  ".sps-desc{margin:0 0 2.2em;max-width:25em;font-size:clamp(12px,1.12cqw,18px);line-height:1.6;color:var(--color-muted-foreground)}" +
  ".sps-cta{display:inline-flex;align-items:center;justify-content:center;min-width:13.5em;height:3.5em;padding:0 1.6em;border:0;cursor:pointer;" +
  "font:inherit;font-size:clamp(9px,.82cqw,13px);font-weight:700;letter-spacing:.24em;text-transform:uppercase;text-decoration:none;color:#241b14;background:var(--sps-accent);transition:filter .25s}" +
  ".sps-cta:hover{filter:brightness(1.06) saturate(1.1)}" +
  ".sps-cta:focus-visible{outline:2px solid var(--color-foreground);outline-offset:3px}" +
  ".sps-arrows{position:absolute;right:max(18px,2.6cqw);bottom:max(20px,3.6cqw);display:flex;flex-direction:column;gap:clamp(8px,.9cqw,14px)}" +
  ".sps-arrow{display:block;padding:4px;border:0;background:none;cursor:pointer;color:var(--color-foreground);opacity:.6;transition:opacity .2s,transform .3s}" +
  ".sps-arrow:hover{opacity:1}" +
  ".sps-arrow:first-child:hover{transform:translateY(-3px)}" +
  ".sps-arrow:last-child:hover{transform:translateY(3px)}" +
  ".sps-arrow:focus-visible{outline:2px solid var(--sps-accent);opacity:1}" +
  ".sps-arrow svg{display:block;width:clamp(9px,.85cqw,14px);height:clamp(24px,2.9cqw,44px)}" +
  ".sps-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}" +
  "@container (max-width:640px){" +
  ".sps-root{grid-template-columns:1fr;grid-template-rows:56% 1fr}" +
  ".sps-brand{left:20px;top:18px;font-size:14px}" +
  ".sps-credit{display:none}" +
  ".sps-dots{top:56%;flex-direction:row;gap:12px}" +
  ".sps-dot{width:30px;height:30px}" +
  ".sps-panel{align-items:flex-start;padding:44px 24px 24px}" +
  ".sps-social{top:auto;bottom:24px;right:auto;left:24px}" +
  ".sps-title{font-size:clamp(32px,9cqw,44px)}" +
  ".sps-desc{font-size:13px;margin-bottom:1.6em}" +
  ".sps-cta{font-size:10px}" +
  ".sps-count{font-size:11px;margin-bottom:.8em}" +
  ".sps-arrows{right:18px;bottom:20px;flex-direction:row;gap:18px}" +
  ".sps-arrows svg{width:10px;height:28px}}" +
  "@media (prefers-reduced-motion:reduce){.sps-dot,.sps-arrow,.sps-cta,.sps-social a{transition:none}}"

function Icon({ name }: { name: SplitSocial["icon"] }) {
  if (name === "facebook")
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M13.5 22v-8.2h2.8l.4-3.2h-3.2V8.5c0-.9.3-1.6 1.6-1.6h1.7V4.1c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.4H7.3v3.2h2.8V22h3.4z" />
      </svg>
    )
  if (name === "instagram")
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.3" cy="6.7" r=".6" fill="currentColor" />
      </svg>
    )
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22 8.2a3 3 0 0 0-2.1-2.1C18 5.6 12 5.6 12 5.6s-6 0-7.9.5A3 3 0 0 0 2 8.2 31 31 0 0 0 1.6 12 31 31 0 0 0 2 15.8a3 3 0 0 0 2.1 2.1c1.9.5 7.9.5 7.9.5s6 0 7.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .4-3.8 31 31 0 0 0-.4-3.8zM10 15V9l5.2 3L10 15z" />
    </svg>
  )
}

function Arrow({ up }: { up?: boolean }) {
  return (
    <svg viewBox="0 0 12 38" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
      {up ? <path d="M6 37V1M1.5 5.5 6 1l4.5 4.5" /> : <path d="M6 1v36M1.5 32.5 6 37l4.5-4.5" />}
    </svg>
  )
}

export default function SplitPhotoSlider({
  slides,
  brand,
  socials = [],
  credit,
  ctaLabel = "Order now",
  accent = "#c4a27a",
  titleFont = "'SPS Playfair','Playfair Display',Didot,Georgia,serif",
  scrollPerSlide = 0.7,
  loop = true,
  height = "100svh",
  className,
  onChange,
  onCta,
}: SplitPhotoSliderProps) {
  const n = slides.length
  const steps = spans(n, loop)
  const [index, setIndex] = React.useState(0)
  const [reducedMotion, setReducedMotion] = React.useState(false)
  const trackRef = React.useRef(null as HTMLDivElement | null)
  const shots = React.useRef([] as (HTMLDivElement | null)[])
  const blocks = React.useRef([] as (HTMLDivElement | null)[])
  const tl = React.useRef(null as gsap.core.Timeline | null)
  const st = React.useRef(null as ScrollTrigger | null)
  const current = React.useRef(0)
  const reduced = React.useRef(false)
  const onChangeRef = React.useRef(onChange)
  onChangeRef.current = onChange

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const on = () => {
      reduced.current = mq.matches
      setReducedMotion(mq.matches)
    }
    on()
    mq.addEventListener("change", on)
    return () => {
      mq.removeEventListener("change", on)
      tl.current?.kill()
    }
  }, [])

  const go = React.useCallback(
    (target: number, dir?: 1 | -1) => {
      const from = current.current
      const to = wrap(target, n)
      if (to === from || n < 2) return
      const d = dir ?? directionFor(from, to, n)
      tl.current?.progress(1).kill()
      current.current = to
      setIndex(to)
      onChangeRef.current?.(to)

      const oldShot = shots.current[from]
      const newShot = shots.current[to]
      const oldBlock = blocks.current[from]
      const newBlock = blocks.current[to]
      if (!oldShot || !newShot || !oldBlock || !newBlock) return
      const oldImg = oldShot.firstElementChild
      const newImg = newShot.firstElementChild
      const oldLines = oldBlock.querySelectorAll("[data-sps-l]")
      const newLines = newBlock.querySelectorAll("[data-sps-l]")

      // Both stay visible for the whole move; the attributes React sets after this
      // render decide who is left showing once the timeline lets go.
      gsap.set([oldShot, newShot, oldBlock, newBlock], { visibility: "visible" })
      gsap.set(oldShot, { zIndex: 1 })
      gsap.set(newShot, { zIndex: 2 })
      const done = () => {
        gsap.set([oldShot, newShot, oldBlock, newBlock], { clearProps: "visibility,zIndex" })
        gsap.set([oldShot, oldImg, newShot, newImg], { clearProps: "transform" })
        gsap.set([oldLines, newLines], { clearProps: "transform,opacity" })
      }

      if (reduced.current) {
        const t = gsap.timeline({ onComplete: done })
        t.fromTo(newShot, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "none", clearProps: "opacity" })
        t.fromTo(newLines, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "none" }, 0)
        t.set(oldLines, { opacity: 0 }, 0)
        tl.current = t
        return
      }

      const t = gsap.timeline({ onComplete: done })
      // Copy: the old lines lift out top-first, then the new rise in.
      t.to(oldLines, { y: -38 * d, opacity: 0, duration: 0.42, ease: "power2.in", stagger: 0.045 }, 0)
      t.fromTo(newLines, { y: 46 * d, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: "power3.out", stagger: 0.07 }, 0.3)
      // Photo: the next slides over from the top (bottom when going back) turned
      // and a touch large, the last drifts away under it.
      t.fromTo(newShot, { yPercent: -100 * d }, { yPercent: 0, duration: 0.95, ease: "power3.inOut" }, 0.2)
      t.fromTo(oldShot, { yPercent: 0 }, { yPercent: 42 * d, duration: 0.95, ease: "power3.inOut" }, 0.2)
      t.fromTo(newImg, { rotation: -11 * d, scale: 1.34 }, { rotation: 0, scale: 1, duration: 1.35, ease: "power2.out" }, 0.22)
      t.to(oldImg, { rotation: 7 * d, scale: 1.12, duration: 0.95, ease: "power2.in" }, 0.2)
      tl.current = t
    },
    [n],
  )

  // The page scroll steps the slides. Each step past the half-way mark plays the
  // whole transition; letting go snaps the scroll onto the slide.
  React.useEffect(() => {
    const track = trackRef.current
    if (!track || n < 2) return
    const trigger = ScrollTrigger.create({
      trigger: track,
      start: "top top",
      end: "bottom bottom",
      snap: reducedMotion ? undefined : { snapTo: 1 / steps, duration: { min: 0.3, max: 0.8 }, delay: 0.08, ease: "power2.inOut" },
      onUpdate: (self) => {
        // Looping: the bottom of the section shows what its top shows, so jump there unseen.
        if (loop && self.progress >= 1 && self.direction > 0) {
          self.scroll(self.start + 1)
          return
        }
        const i = wrap(stepAt(self.progress, steps), n)
        if (i !== current.current) go(i, self.direction > 0 ? 1 : -1)
      },
    })
    // At the very top there is no scroll left to fire onUpdate, so a wheel up wraps.
    // trigger.scroll() is the cached scroll position, not a layout read.
    const onWheel = (e: WheelEvent) => {
      if (!loop || e.deltaY >= 0 || Math.abs(trigger.scroll() - trigger.start) > 1) return
      trigger.scroll(trigger.end - 1)
    }
    window.addEventListener("wheel", onWheel, { passive: true })
    const first = wrap(stepAt(trigger.progress, steps), n)
    current.current = first
    setIndex(first)
    st.current = trigger
    return () => {
      window.removeEventListener("wheel", onWheel)
      trigger.kill()
      st.current = null
    }
  }, [n, steps, loop, reducedMotion, go])

  // Arrows, dots and keys play the transition and move the scroll to match.
  const jump = (to: number, dir?: 1 | -1) => {
    const i = wrap(to, n)
    go(i, dir)
    const s = st.current
    if (s && s.isActive) window.scrollTo({ top: scrollFor(i, steps, s.start, s.end), behavior: "instant" })
  }

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") jump(current.current + 1, 1)
    else if (e.key === "ArrowUp" || e.key === "ArrowLeft") jump(current.current - 1, -1)
    else return
    e.preventDefault()
  }

  if (n === 0) return null
  const style = { height, "--sps-accent": accent, "--sps-ring": "var(--color-background)", "--sps-font": titleFont } as React.CSSProperties

  return (
    <div ref={trackRef} className="sps-track" style={{ height: "calc(" + height + " * " + (1 + steps * scrollPerSlide) + ")" }}>
      <section
        className={"sps-root" + (className ? " " + className : "")}
        style={style}
        role="region"
        aria-roledescription="carousel"
        aria-label={typeof brand === "string" ? brand : "Product slider"}
        tabIndex={0}
        onKeyDown={onKey}
      >
        <style>{CSS}</style>

        <div className="sps-media">
          {slides.map((s, i) => (
            <div
              key={i}
              className="sps-shot"
              data-on={i === index ? "" : undefined}
              aria-hidden={i !== index}
              ref={(el) => {
                shots.current[i] = el
              }}
            >
              <div className="sps-img">
                <img
                  src={s.image}
                  alt={s.alt ?? s.title}
                  width={800}
                  height={1000}
                  draggable={false}
                  loading={i === index ? "eager" : "lazy"}
                  decoding="async"
                />
              </div>
            </div>
          ))}
          {brand ? <p className="sps-brand">{brand}</p> : null}
          {credit ? <p className="sps-credit">{credit}</p> : null}
        </div>

        <ul className="sps-dots" aria-label="Choose a slide">
          {slides.map((s, i) => (
            <li key={i}>
              <button type="button" className="sps-dot" aria-label={s.title} aria-current={i === index} onClick={() => jump(i)}>
                <img src={s.thumb ?? s.image} alt="" width={42} height={42} draggable={false} />
              </button>
            </li>
          ))}
        </ul>

        <div className="sps-panel">
          {socials.length ? (
            <ul className="sps-social">
              {socials.map((s) => (
                <li key={s.label}>
                  <a href={s.href} aria-label={s.label}>
                    <Icon name={s.icon} />
                  </a>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="sps-copy" aria-live="polite">
            {slides.map((s, i) => (
              <div
                key={i}
                className="sps-block"
                data-on={i === index ? "" : undefined}
                aria-hidden={i !== index}
                ref={(el) => {
                  blocks.current[i] = el
                }}
              >
                <div className="sps-count" data-sps-l="">
                  <span className="sps-now" aria-hidden="true">
                    {pad2(i + 1)}
                  </span>
                  <i />
                  <span className="sps-all" aria-hidden="true">
                    {pad2(n)}
                  </span>
                  <span className="sps-sr">{"Slide " + (i + 1) + " of " + n}</span>
                </div>
                <h2 className="sps-title" data-sps-l="">
                  {s.title}
                </h2>
                <p className="sps-desc" data-sps-l="">
                  {s.description}
                </p>
                <div data-sps-l="">
                  {s.href ? (
                    <a className="sps-cta" href={s.href} tabIndex={i === index ? 0 : -1} onClick={() => onCta?.(s, i)}>
                      {s.cta ?? ctaLabel}
                    </a>
                  ) : (
                    <button type="button" className="sps-cta" tabIndex={i === index ? 0 : -1} onClick={() => onCta?.(s, i)}>
                      {s.cta ?? ctaLabel}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="sps-arrows">
            <button type="button" className="sps-arrow" aria-label="Previous slide" onClick={() => jump(current.current - 1, -1)}>
              <Arrow up />
            </button>
            <button type="button" className="sps-arrow" aria-label="Next slide" onClick={() => jump(current.current + 1, 1)}>
              <Arrow />
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
