"use client"

import { useEffect, useRef, useState } from "react"
import type { CSSProperties, ReactNode } from "react"

// #region reel
export const UP = 20 // the top card of the waiting stack leans back this far (deg)
export const DOWN = -156 // the top card of the fallen stack lies this far over (deg)
export const SPREAD = 1.5 // each card deeper in a stack fans this much further (deg): hairline edges, like real card stock
export const DEPTH = 5 // cards drawn in each stack

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)

/** Gravity-like fall: slow to tip over the top, fast through the middle, a soft landing bounce. */
export function fallEase(q: number) {
  q = clamp01(q)
  if (q < 0.86) {
    const k = q / 0.86
    return k * k * (2.2 - 1.2 * k) * 1.035
  }
  const k = (q - 0.86) / 0.14
  return 1.035 - 0.035 * Math.sin(k * Math.PI * 0.5)
}

/** Pose of a card `d` places from the flip front (d ≥ 0 waiting, d ≤ -1 fallen, between = falling). */
export function pose(d: number) {
  if (d >= 0) {
    return { angle: UP + d * SPREAD, curl: 0, opacity: clamp01(DEPTH - d), falling: 0 }
  }
  if (d <= -1) {
    const k = -1 - d
    return { angle: DOWN - k * SPREAD, curl: 0, opacity: clamp01(DEPTH - k), falling: 1 }
  }
  const q = -d
  const e = fallEase(q)
  // the card bends only in mid-air: flat as it leaves the stack and flat again before it lands,
  // so it never dips into either stack
  const bend = q < 0.08 || q > 0.78 ? 0 : Math.sin((Math.PI * (q - 0.08)) / 0.7)
  return { angle: UP + (DOWN - UP) * Math.min(1, e), curl: bend * 50, opacity: 1, falling: q }
}

/** How far to slide the stack (in card widths) so a card tipped by `lift` stays centred on screen.
 * Measured: a hovered lean (0.3) needs more correction on big cards, a full tip about 0.124. */
export function leanShift(lift: number, size: number) {
  const hover = 0.013 + Math.max(0, size - 209) * 0.000176
  if (lift <= 0.3) return (lift / 0.3) * hover
  return hover + (0.124 - hover) * ((lift - 0.3) / 0.7)
}

/** Where the reel is at time t (ms): whole flips done plus the progress of the current one. */
export function reelAt(t: number, interval: number, flip: number) {
  const n = Math.floor(t / interval)
  const local = t - n * interval
  return n + clamp01(local / flip)
}
// #endregion

export type ReelImage = { src: string; alt?: string }

export type FoldingCardReelProps = {
  images?: ReelImage[]
  /** Card edge in px (cards are square). */
  cardSize?: number
  /** ms between flips. */
  interval?: number
  /** ms one flip takes. */
  flipDuration?: number
  /** Keep flipping on its own. */
  autoPlay?: boolean
  height?: string
  className?: string
  style?: CSSProperties
}

const IMG = "https://kedhar-components.pages.dev/folding-card-reel/"
const DEFAULT_IMAGES: ReelImage[] = [
  { src: IMG + "card-01.webp", alt: "Knotted cobalt ribbon sculpture on blue" },
  { src: IMG + "card-02.webp", alt: "A bold black letter K on grey paper" },
  { src: IMG + "card-03.webp", alt: "Sand ceramic ring vase on beige" },
  { src: IMG + "card-04.webp", alt: "Portrait with cobalt visor sunglasses" },
  { src: IMG + "card-05.webp", alt: "Red poster with the word fold" },
  { src: IMG + "card-06.webp", alt: "Black and white portrait with cropped hair" },
  { src: IMG + "card-07.webp", alt: "Red poster with a leaping dancer" },
  { src: IMG + "card-08.webp", alt: "Blue and white concentric rings" },
  { src: IMG + "card-09.webp", alt: "Chrome liquid metal on ultramarine" },
]

const STRIPS = 6
const POOL = DEPTH * 2 + 2

const CSS =
  ".fcr-root{position:relative;display:grid;place-items:center;width:100%;overflow:hidden;perspective:1500px;cursor:zoom-in;-webkit-tap-highlight-color:transparent}" +
  ".fcr-root[data-open=true]{cursor:zoom-out}" +
  ".fcr-stage{position:relative;width:var(--s);height:0;transform-style:preserve-3d;transform:translate(calc(var(--s) * (.014 + var(--lx, 0))),calc(var(--s) * .08)) rotateX(16deg) rotateY(-24deg) rotateZ(-5deg)}" +
  ".fcr-shadow{position:absolute;left:-10%;right:-10%;top:calc(var(--s) * .55);height:calc(var(--s) * .7);border-radius:50%;background:radial-gradient(closest-side,rgba(0,0,0,.28),transparent);transform:rotateX(90deg);filter:blur(6px);pointer-events:none}" +
  ".fcr-card{position:absolute;left:0;top:calc(-1 * var(--s));width:100%;height:var(--s);transform-origin:50% 100%;transform-style:preserve-3d;pointer-events:none}" +
  ".fcr-strip{position:absolute;left:0;bottom:0;width:100%;height:calc(var(--s) / 6);transform-origin:50% 100%;transform-style:preserve-3d}" +
  ".fcr-strip>.fcr-strip{bottom:100%}" +
  ".fcr-face{position:absolute;inset:-1px 0 0 0;backface-visibility:hidden;-webkit-backface-visibility:hidden;background-size:100% var(--s);background-repeat:no-repeat;background-color:#d9dbe4}" +
  ".fcr-back{transform:rotateX(180deg)}" +
  ".fcr-shade{position:absolute;inset:0;background:#0a0c18;pointer-events:none}" +
  ".fcr-hit{position:absolute;inset:0;z-index:2;border:0;padding:0;margin:0;background:transparent;cursor:inherit;outline:none}" +
  ".fcr-hit:focus-visible{box-shadow:inset 0 0 0 3px var(--color-primary)}" +
  ".fcr-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}" +
  "@media (prefers-reduced-motion:reduce){.fcr-root{cursor:default}}"

const radius = (j: number) => (j === 0 ? "0 0 22px 22px" : j === STRIPS - 1 ? "22px 22px 0 0" : "0")

export default function FoldingCardReel({
  images = DEFAULT_IMAGES,
  cardSize = 340,
  interval = 760,
  flipDuration = 520,
  autoPlay = true,
  height = "100svh",
  className,
  style,
}: FoldingCardReelProps) {
  const rootRef = useRef(null as HTMLDivElement | null)
  const [open, setOpen] = useState(false)
  const live = useRef({ open: false, hover: false, lift: 0 })
  live.current.open = open
  const list = images.length ? images : DEFAULT_IMAGES

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)")
    const cards = [...root.querySelectorAll(".fcr-card")] as HTMLElement[]
    const stage = root.querySelector(".fcr-stage") as HTMLElement
    const slots = cards.map((el) => ({
      el,
      strips: [...el.querySelectorAll(".fcr-strip")] as HTMLElement[],
      fronts: [...el.querySelectorAll(".fcr-front")] as HTMLElement[],
      backs: [...el.querySelectorAll(".fcr-back")] as HTMLElement[],
      shadeF: [...el.querySelectorAll(".fcr-front>.fcr-shade")] as HTMLElement[],
      shadeB: [...el.querySelectorAll(".fcr-back>.fcr-shade")] as HTMLElement[],
      shown: -1,
    }))
    const st = live.current
    let clock = 0 // reel time in ms, paused while hovered or open
    let last = performance.now()
    let raf = 0
    let visible = true
    const n = list.length

    const paint = () => {
      const now = performance.now()
      const dt = Math.min(64, now - last)
      last = now
      const hold = st.hover || st.open || !autoPlay || reduce.matches
      // finish a flip that is in the air before holding still
      const inFlight = clock % interval < flipDuration && clock % interval > 0
      if (!hold || inFlight) clock += dt
      st.lift += ((st.open ? 1 : st.hover ? 0.3 : 0) - st.lift) * (reduce.matches ? 1 : Math.min(1, dt / 90))
      // the stage is yawed, so a card tipping toward you leans left on screen; move the whole stack
      // to keep the picture centred (the card never leaves its hinge)
      stage.style.setProperty("--lx", String(leanShift(st.lift, Math.min(cardSize, window.innerWidth * 0.62, window.innerHeight * 0.36))))
      const f = reelAt(clock, interval, flipDuration)
      const base = Math.floor(f)
      for (let s = 0; s < slots.length; s++) {
        // the absolute card this slot shows: same residue mod POOL, nearest the flip front
        let a = base - DEPTH - 1 + ((s - (base - DEPTH - 1)) % POOL + POOL) % POOL
        const slot = slots[s]
        const img = list[((a % n) + n) % n]
        if (slot.shown !== a) {
          slot.shown = a
          const url = "url(" + JSON.stringify(img.src) + ")"
          // strip j (counted up from the hinge) shows its own band of the photo
          slot.fronts.forEach((el, j) => {
            el.style.backgroundImage = url
            el.style.backgroundPosition = "0 calc(1px - var(--s) * " + (STRIPS - 1 - j) / STRIPS + ")"
          })
          slot.backs.forEach((el, j) => {
            el.style.backgroundImage = url
            el.style.backgroundPosition = "0 calc(1px - var(--s) * " + j / STRIPS + ")"
          })
        }
        const d = a - f
        const p = pose(d)
        let angle = p.angle
        let sc = 1
        if (d >= 0 && d < 1) {
          // the front card stays on its hinge: hovered it lifts off the stack a little, opened it
          // tips right over toward you, like a page held up to look at
          angle = angle + (-34 - angle) * st.lift
          sc = 1 + st.lift * 0.05
        }
        slot.el.style.transform = "translateZ(" + -Math.abs(d) * 0.6 + "px) rotateX(" + angle + "deg) scale(" + sc + ")"
        slot.el.style.opacity = String(p.opacity)
        slot.el.style.zIndex = String(100 - Math.round(Math.abs(d) * 4))
        const per = p.curl / STRIPS
        slot.strips.forEach((el, j) => (el.style.transform = j === 0 ? "none" : "rotateX(" + per + "deg)"))
        const deep = Math.max(0, Math.abs(d) - (d < 0 ? 1 : 0))
        const front = d >= 0 ? 0.05 + deep * 0.09 : 0.2 + p.falling * 0.35
        const back = d <= -1 ? 0.04 + deep * 0.1 : 0.45 * (1 - p.falling)
        slot.shadeF.forEach((el) => (el.style.opacity = String(Math.min(0.75, front * (1 - st.lift * (d >= 0 && d < 1 ? 1 : 0))))))
        slot.shadeB.forEach((el) => (el.style.opacity = String(Math.min(0.75, back))))
      }
      raf = visible ? requestAnimationFrame(paint) : 0
    }
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      if (visible && !raf) {
        last = performance.now()
        raf = requestAnimationFrame(paint)
      }
    })
    io.observe(root)
    const enter = () => (st.hover = true)
    const leave = () => (st.hover = false)
    root.addEventListener("pointerenter", enter)
    root.addEventListener("pointerleave", leave)
    raf = requestAnimationFrame(paint)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      root.removeEventListener("pointerenter", enter)
      root.removeEventListener("pointerleave", leave)
    }
  }, [list, interval, flipDuration, autoPlay])

  const strips = (face: "front" | "back") =>
    Array.from({ length: STRIPS }).reduceRight(
      (child: ReactNode, _, j) => (
        <div className="fcr-strip" key={face + j}>
          <div className={"fcr-face fcr-front"} style={{ borderRadius: radius(j) }}>
            <span className="fcr-shade" />
          </div>
          <div className={"fcr-face fcr-back"} style={{ borderRadius: radius(STRIPS - 1 - j) }}>
            <span className="fcr-shade" />
          </div>
          {child}
        </div>
      ),
      null,
    )

  return (
    <div
      ref={rootRef}
      className={"fcr-root" + (className ? " " + className : "")}
      data-open={open}
      style={{ minHeight: height, height, ["--s" as string]: "min(" + cardSize + "px, 62vw, 36svh)", ...style } as CSSProperties}
    >
      <style>{CSS}</style>
      <div className="fcr-stage" aria-hidden="true">
        <div className="fcr-shadow" />
        {Array.from({ length: POOL }).map((_, s) => (
          <div className="fcr-card" key={s}>
            {strips("front")}
          </div>
        ))}
      </div>
      <button type="button" className="fcr-hit" aria-pressed={open} aria-label={open ? "Put the card back" : "Lift the front card"} onClick={() => setOpen((o) => !o)} />
      <ul className="fcr-sr">
        {list.map((im, i) => (
          <li key={i}>{im.alt ?? "Image " + (i + 1)}</li>
        ))}
      </ul>
    </div>
  )
}
