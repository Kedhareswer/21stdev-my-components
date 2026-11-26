"use client"

import { useEffect, useRef } from "react"
import type { CSSProperties, ReactNode } from "react"

// #region wheel
export const IDLE = 14 // deg/s the wheel drifts at rest
export const BURST = 760 // deg/s on entry
export const SETTLE = 1.15 // s for speed to fall most of the way back to idle

/** Spin speed after dt seconds: it relaxes exponentially toward the idle drift, keeping its direction. */
export function relax(vel: number, dt: number) {
  const idle = vel < 0 ? -IDLE : IDLE
  return idle + (vel - idle) * Math.exp(-dt / (SETTLE / 2.3))
}

/** How much the cards bow and trail at a given speed (0 at idle, 1 at full burst). */
export function blurAmount(vel: number) {
  const k = (Math.abs(vel) - IDLE * 1.5) / (BURST * 0.55)
  return k < 0 ? 0 : k > 1 ? 1 : k
}

/** Angles of the cards around the axis, evenly spread. */
export function cardAngles(n: number) {
  return Array.from({ length: n }, (_, i) => (360 / n) * i)
}

/** Camera move as the section scrolls away: 0 at rest, 1 when it has scrolled one screen. */
export function zoomFor(progress: number) {
  const p = progress < 0 ? 0 : progress > 1 ? 1 : progress
  const e = p * p * (3 - 2 * p)
  return { scale: 1 + e * 0.75, tilt: -58 + e * 40, lift: e * 6 }
}
// #endregion

export type PinwheelImage = { src: string; alt?: string }

export type PinwheelGalleryProps = {
  images?: PinwheelImage[]
  eyebrow?: string
  title?: ReactNode
  subtitle?: string
  cta?: { label: string; href: string }
  /** How many cards hang on the wheel (3–12); images beyond it are not used. */
  count?: number
  height?: string
  className?: string
  style?: CSSProperties
}

const IMG = "https://kedhar-components.pages.dev/pinwheel-gallery/"
const DEFAULT_IMAGES: PinwheelImage[] = [
  "Orange starburst on cobalt", "Portrait in shield sunglasses under pink light", "Cobalt chrome ribbon numeral",
  "Concentric target rings", "Boxer in red gloves", "Chrome sunglasses on electric blue",
  "Portrait with yellow paper shapes", "Yellow and red op-art swirl", "Model in a blue fur hood",
].map((alt, i) => ({ src: IMG + "poster-0" + (i + 1) + ".webp", alt }))

const STRIPS = 3
const GHOSTS = 2

const CSS =
  ".pwg-root{position:relative;display:grid;width:100%;overflow:hidden;background:#0c0c0e;color:#f4f4f2;" +
  "grid-template-columns:minmax(0,1fr);grid-template-rows:minmax(0,1fr) auto;--g:clamp(20px,4vw,56px);" +
  "font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;isolation:isolate}" +
  ".pwg-stage{grid-area:1/1/3/2;position:relative;perspective:1600px;touch-action:pan-y;cursor:grab;z-index:0}" +
  ".pwg-stage:active{cursor:grabbing}" +
  ".pwg-cam{position:absolute;left:71%;top:46%;width:0;height:0;transform-style:preserve-3d}" +
  ".pwg-wheel{position:absolute;left:0;top:0;transform-style:preserve-3d}" +
  ".pwg-card{position:absolute;left:0;top:calc(var(--h) / -2);width:var(--w);height:var(--h);transform-origin:0 50%;transform-style:preserve-3d}" +
  ".pwg-strip{position:absolute;top:0;left:0;width:calc(var(--w) / 3);height:100%;transform-origin:0 50%;transform-style:preserve-3d}" +
  ".pwg-strip>.pwg-strip{left:100%}" +
  ".pwg-face{position:absolute;inset:0 -.5px;backface-visibility:hidden;-webkit-backface-visibility:hidden;background-size:300% 100%;background-repeat:no-repeat;background-color:#1b1b20}" +
  ".pwg-back{transform:rotateY(180deg)}" +
  ".pwg-ghost{pointer-events:none}" +
  ".pwg-copy{grid-area:2/1/3/2;position:relative;z-index:1;display:grid;gap:14px;justify-items:start;padding:0 var(--g) var(--g);max-width:760px;pointer-events:none}" +
  ".pwg-copy a{pointer-events:auto}" +
  ".pwg-eyebrow{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:rgba(244,244,242,.62)}" +
  ".pwg-title{margin:0;font-size:clamp(40px,7.2vw,116px);line-height:.9;letter-spacing:-.04em;font-weight:700}" +
  ".pwg-title span{display:block}.pwg-title span+span{padding-left:.9em}" +
  ".pwg-sub{margin:0;max-width:34ch;font-size:clamp(14px,1.2vw,17px);line-height:1.45;color:rgba(244,244,242,.7)}" +
  ".pwg-cta{display:inline-flex;align-items:center;gap:10px;height:46px;padding:0 22px;border-radius:999px;background:#f4f4f2;color:#0c0c0e;font-weight:600;font-size:15px;text-decoration:none;outline:none;transition:transform .3s}" +
  ".pwg-cta:hover{transform:translateY(-2px)}" +
  ".pwg-cta:focus-visible{box-shadow:0 0 0 3px #0c0c0e,0 0 0 5px var(--color-primary)}" +
  ".pwg-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}" +
  "@media (max-width:900px){.pwg-root{--h:min(32svh,52vw,360px)!important;--w:calc(min(32svh,52vw,360px) * .72)!important}.pwg-cam{left:50%;top:29%}.pwg-title span+span{padding-left:.5em}}" +
  "@media (prefers-reduced-motion:reduce){.pwg-stage{cursor:default}.pwg-cta{transition:none}}"

export default function PinwheelGallery({
  images = DEFAULT_IMAGES,
  eyebrow = "Motion & identity · Kedhareswer",
  title = (
    <>
      <span>I set brands</span>
      <span>in motion.</span>
    </>
  ),
  subtitle = "Sequences and identities that move. A few each year, built one frame at a time.",
  cta = { label: "Start a project", href: "mailto:kedhareswer.12110626@gmail.com" },
  count = 7,
  height = "100svh",
  className,
  style,
}: PinwheelGalleryProps) {
  const rootRef = useRef(null as HTMLElement | null)
  const list = (images.length ? images : DEFAULT_IMAGES).slice(0, Math.max(3, Math.min(12, count)))

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const stage = root.querySelector(".pwg-stage") as HTMLElement
    const cam = root.querySelector(".pwg-cam") as HTMLElement
    const wheel = root.querySelector(".pwg-wheel") as HTMLElement
    const cards = [...root.querySelectorAll(".pwg-card")] as HTMLElement[]
    const stripsOf = cards.map((el) => [...el.querySelectorAll(".pwg-strip")] as HTMLElement[])
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)")
    const n = list.length
    const angles = cardAngles(n)
    const st = { angle: -30, vel: reduce.matches ? 0 : BURST, drag: false, lastX: 0, lastT: 0, zoom: 0, zoomT: 0 }
    let raf = 0
    let last = performance.now()
    let visible = true

    const readScroll = () => {
      const r = root.getBoundingClientRect()
      st.zoomT = r.height > 0 ? -r.top / r.height : 0
    }
    window.addEventListener("scroll", readScroll, { passive: true })
    readScroll()

    const frame = () => {
      const now = performance.now()
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (!st.drag) st.vel = reduce.matches ? 0 : relax(st.vel, dt)
      st.angle += st.vel * dt
      st.zoom += (Math.max(0, Math.min(1, st.zoomT)) - st.zoom) * (reduce.matches ? 1 : Math.min(1, dt * 6))
      const z = zoomFor(st.zoom)
      cam.style.transform = "translateY(" + -z.lift + "vh) scale(" + z.scale + ") rotateX(" + z.tilt + "deg) rotateZ(-14deg)"
      wheel.style.transform = "rotateY(" + st.angle + "deg)"
      const blur = blurAmount(st.vel)
      // cards bow against the spin, harder the faster it goes; ghosts trail behind
      const bow = (st.vel < 0 ? -1 : 1) * (8 + blur * 26)
      for (let c = 0; c < cards.length; c++) {
        const el = cards[c]
        const k = Number(el.dataset.k)
        const ghost = Number(el.dataset.g)
        const lag = ghost * (st.vel / 60) * 2.4
        el.style.transform = "rotateY(" + (angles[k] - lag) + "deg)"
        el.style.opacity = ghost === 0 ? "1" : String(blur * (ghost === 1 ? 0.3 : 0.12))
        el.style.visibility = ghost && blur < 0.02 ? "hidden" : "visible"
        stripsOf[c].forEach((s, j) => (s.style.transform = j === 0 ? "none" : "rotateY(" + -bow / STRIPS + "deg)"))
      }
      raf = visible ? requestAnimationFrame(frame) : 0
    }

    const down = (e: PointerEvent) => {
      if (reduce.matches) return
      st.drag = true
      st.lastX = e.clientX
      st.lastT = performance.now()
      stage.setPointerCapture(e.pointerId)
    }
    const move = (e: PointerEvent) => {
      if (!st.drag) return
      const now = performance.now()
      const dx = e.clientX - st.lastX
      const dtm = Math.max(8, now - st.lastT)
      st.angle += dx * 0.35
      st.vel = st.vel * 0.6 + ((dx * 0.35) / dtm) * 1000 * 0.4
      st.lastX = e.clientX
      st.lastT = now
    }
    const up = () => {
      st.drag = false
    }
    stage.addEventListener("pointerdown", down)
    stage.addEventListener("pointermove", move)
    stage.addEventListener("pointerup", up)
    stage.addEventListener("pointercancel", up)
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      if (visible && !raf) {
        last = performance.now()
        raf = requestAnimationFrame(frame)
      }
    })
    io.observe(root)
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      window.removeEventListener("scroll", readScroll)
      stage.removeEventListener("pointerdown", down)
      stage.removeEventListener("pointermove", move)
      stage.removeEventListener("pointerup", up)
      stage.removeEventListener("pointercancel", up)
    }
  }, [list])

  const card = (im: PinwheelImage, k: number, g: number) => {
    const strips = Array.from({ length: STRIPS }).reduceRight(
      (child: ReactNode, _, j) => (
        <div className="pwg-strip" key={j}>
          <div className="pwg-face" style={{ backgroundImage: "url(" + JSON.stringify(im.src) + ")", backgroundPosition: (j / (STRIPS - 1)) * 100 + "% 0", borderRadius: j === 0 ? "10px 0 0 10px" : j === STRIPS - 1 ? "0 10px 10px 0" : 0 }} />
          <div className="pwg-face pwg-back" style={{ backgroundImage: "url(" + JSON.stringify(im.src) + ")", backgroundPosition: ((STRIPS - 1 - j) / (STRIPS - 1)) * 100 + "% 0", borderRadius: j === 0 ? "10px 0 0 10px" : j === STRIPS - 1 ? "0 10px 10px 0" : 0 }} />
          {child}
        </div>
      ),
      null,
    )
    return (
      <div className={"pwg-card" + (g ? " pwg-ghost" : "")} key={k + ":" + g} data-k={k} data-g={g}>
        {strips}
      </div>
    )
  }

  return (
    <section
      ref={rootRef}
      className={"pwg-root" + (className ? " " + className : "")}
      style={{ minHeight: height, height, ["--h" as string]: "min(44svh, 40vw, 460px)", ["--w" as string]: "calc(min(44svh, 40vw, 460px) * .72)", ...style } as CSSProperties}
    >
      <style>{CSS}</style>
      <div className="pwg-stage" aria-hidden="true">
        <div className="pwg-cam">
          <div className="pwg-wheel">
            {list.map((im, k) => Array.from({ length: GHOSTS + 1 }, (_, g) => card(im, k, GHOSTS - g)))}
          </div>
        </div>
      </div>
      <div className="pwg-copy">
        {eyebrow ? <span className="pwg-eyebrow">{eyebrow}</span> : null}
        <h2 className="pwg-title">{title}</h2>
        {subtitle ? <p className="pwg-sub">{subtitle}</p> : null}
        {cta ? (
          <a className="pwg-cta" href={cta.href}>
            {cta.label} <span aria-hidden="true">↗</span>
          </a>
        ) : null}
      </div>
      <ul className="pwg-sr">
        {list.map((im, i) => (
          <li key={i}>{im.alt ?? "Image " + (i + 1)}</li>
        ))}
      </ul>
    </section>
  )
}
