"use client"

import * as React from "react"
import gsap from "gsap"

/*
 * Tumble Deck Showcase — a stack of website screenshots standing on edge, one
 * behind the other. The front card tips forward on its bottom edge and lands
 * flat on the floor, the deck slides up to the line, the next one falls. It
 * never runs out: after the last card the first one is already standing behind
 * it, so the deck keeps tumbling forward forever.
 *
 * Pure CSS 3D (one perspective, every card hinged on the same floor line) with
 * GSAP driving a single number — the deck position, which only ever grows. A
 * small pool of card elements is recycled along it: slot j always holds the
 * virtual card k ≡ j (mod pool), showing image k mod n, and a slot is only
 * re-pointed while it is invisible (under the floor pile or past the back).
 */

export type TumbleCard = {
  src: string
  alt?: string
}

export type TumbleDeckShowcaseProps = {
  cards: TumbleCard[]
  /** Any CSS length. Default 100svh. */
  height?: number | string
  /** Card width ÷ height. Images are cropped to it from the top. */
  aspect?: number
  /** Seconds a card stands at the front before it falls. */
  dwell?: number
  /** Seconds for one fall. */
  fall?: number
  /** Turn autoplay off and only step on click / keys. */
  autoplay?: boolean
  /** How many upright cards show behind the front one. */
  depth?: number
  background?: string
  className?: string
  style?: React.CSSProperties
  ariaLabel?: string
}

// #region pose
export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)

/** Euclidean modulo: card k of an endless deck shows image wrap(k, n). */
export const wrap = (k: number, n: number) => (n ? ((k % n) + n) % n : 0)

/**
 * Hinge angle (deg, CSS rotateX) of a card `t` of the way through its fall.
 * 0 stands upright, -90 lies flat towards the viewer. Gravity eases in, then
 * the card kicks once off the floor and settles.
 */
export function fallAngle(t: number): number {
  const u = clamp01(t)
  const land = 0.78
  if (u <= land) {
    const k = u / land
    return -90 * k * k * k
  }
  const k = (u - land) / (1 - land)
  return -90 + 6 * Math.sin(Math.PI * k) * (1 - k)
}

/** How far the deck has slid forward, in card gaps, at deck position `pos`. */
export function deckAdvance(pos: number): number {
  const i = Math.floor(pos)
  const f = pos - i
  const k = clamp01((f - 0.28) / 0.6)
  return i + k * k * (3 - 2 * k)
}

export type Pose = { angle: number; z: number; lift: number; opacity: number; flat: boolean }

/**
 * Pose of virtual card `k` when the deck is at `pos` (card k is at the front
 * when pos = k). Both may run past the number of images, and below zero.
 */
export function cardPose(k: number, pos: number, depth: number): Pose {
  const t = pos - k
  // Floor cards lie a hair apart, the newest highest. Relative to the front
  // index so the pile doesn't creep upward as the loop runs on.
  const lift = (k - Math.floor(pos) + 3) * 0.6
  if (t >= 1) {
    // On the floor. Only the two latest show.
    return { angle: -90, z: 0, lift, opacity: t < 3 ? 1 : 0, flat: true }
  }
  if (t > 0) return { angle: fallAngle(t), z: 0, lift, opacity: 1, flat: false }
  const rel = k - deckAdvance(pos)
  const opacity = clamp01(depth + 1 - rel)
  return { angle: 0, z: -Math.max(rel, 0), lift: 0, opacity, flat: false }
}
// #endregion

export default function TumbleDeckShowcase({
  cards,
  height = "100svh",
  aspect = 2.06,
  dwell = 0.26,
  fall = 0.42,
  autoplay = true,
  depth = 5,
  background = "var(--color-background)",
  className,
  style,
  ariaLabel = "Website showcase",
}: TumbleDeckShowcaseProps) {
  const rootRef = React.useRef<HTMLDivElement>(null)
  const sceneRef = React.useRef<HTMLDivElement>(null)
  const cardRefs = React.useRef<(HTMLDivElement | null)[]>([])
  const imgRefs = React.useRef<(HTMLImageElement | null)[]>([])
  const slotK = React.useRef<number[]>([])
  const state = React.useRef({ pos: 0 })
  const geo = React.useRef({ h: 200, gap: 44 })
  const n = cards.length
  // Two on the floor, the falling one, the front one, `depth` behind, one fading in.
  const pool = n ? depth + 5 : 0

  const paint = React.useCallback(() => {
    const { pos } = state.current
    const { gap } = geo.current
    const base = Math.floor(pos) - 2
    cardRefs.current.forEach((el, j) => {
      const img = imgRefs.current[j]
      if (!el || !img || j >= pool) return
      const k = base + wrap(j - base, pool)
      if (slotK.current[j] !== k) {
        slotK.current[j] = k
        const c = cards[wrap(k, n)]
        img.src = c.src
        img.alt = c.alt ?? ""
      }
      const p = cardPose(k, pos, depth)
      el.style.transform = `translate3d(0, ${-p.lift}px, ${p.z * gap}px) rotateX(${p.angle}deg)`
      el.style.opacity = String(p.opacity)
      el.style.visibility = p.opacity > 0 ? "visible" : "hidden"
      // Light falls from above: a card darkens a touch as it tips away from it.
      const shade = p.flat ? 0.06 : (-p.angle / 90) * 0.06
      el.style.setProperty("--td-shade", String(shade))
    })
  }, [depth, pool, cards, n])

  // New images: re-point every slot on the next paint.
  React.useLayoutEffect(() => {
    slotK.current = []
  }, [cards])

  // Fit: the card, the deck above it and the floor card below all inside the
  // root. Perspective and eye height are fixed ratios of the card height,
  // measured off the reference composition.
  React.useLayoutEffect(() => {
    const root = rootRef.current
    const scene = sceneRef.current
    if (!root || !scene) return
    const fit = () => {
      const W0 = root.clientWidth
      const H0 = root.clientHeight
      const wFrac = W0 < 420 ? 0.76 : 0.655
      const h = Math.max(60, Math.min((W0 * wFrac) / aspect, H0 * 0.42, 620))
      const w = h * aspect
      const top = H0 / 2 - 0.62 * h
      geo.current = { h, gap: 0.24 * h }
      scene.style.perspective = `${6 * h}px`
      scene.style.perspectiveOrigin = `50% ${top - 1.66 * h}px`
      root.style.setProperty("--td-w", `${w}px`)
      root.style.setProperty("--td-h", `${h}px`)
      root.style.setProperty("--td-top", `${top}px`)
      paint()
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(root)
    return () => ro.disconnect()
  }, [aspect, paint])

  // Playback. One tween at a time on `pos`; the pose functions do the easing.
  const api = React.useRef<{ step: (dir: 1 | -1) => void }>({ step: () => {} })
  React.useEffect(() => {
    const root = rootRef.current
    if (!root || n === 0) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const s = state.current
    let tween: gsap.core.Tween | gsap.core.Tween[] | null = null
    let wait: gsap.core.Tween | null = null
    let visible = true

    const kill = () => {
      ;[tween, wait].flat().forEach((t) => t && t.kill())
      tween = wait = null
    }
    const go = (to: number, duration: number, then?: () => void) => {
      if (reduce) {
        s.pos = to
        paint()
        then?.()
        return
      }
      tween = gsap.to(s, { pos: to, duration, ease: "none", onUpdate: paint, onComplete: then })
    }
    const schedule = () => {
      kill()
      if (!autoplay || reduce || !visible) return
      wait = gsap.delayedCall(dwell, () => go(Math.round(s.pos) + 1, fall, schedule))
    }
    api.current.step = (dir) => {
      kill()
      go(Math.round(s.pos) + dir, fall, schedule)
    }

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      if (visible) schedule()
      else kill()
    })
    io.observe(root)
    paint()
    schedule()
    return () => {
      kill()
      io.disconnect()
    }
  }, [n, autoplay, dwell, fall, paint])

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " " || e.key === "Enter") {
      e.preventDefault()
      api.current.step(1)
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault()
      api.current.step(-1)
    }
  }

  return (
    <div
      ref={rootRef}
      role="region"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      tabIndex={0}
      onKeyDown={onKey}
      onClick={() => api.current.step(1)}
      className={["td-root relative w-full overflow-hidden outline-none select-none", className]
        .filter(Boolean)
        .join(" ")}
      style={{ height, background, ...style }}
    >
      <style>{`
        .td-scene { position: absolute; inset: 0; transform-style: preserve-3d; }
        .td-card {
          position: absolute; left: 50%; top: var(--td-top);
          width: var(--td-w); height: var(--td-h); margin-left: calc(var(--td-w) / -2);
          transform-origin: 50% 100%; transform-style: preserve-3d;
          backface-visibility: visible; will-change: transform;
          border-radius: 3px; overflow: hidden; cursor: pointer;
          background: color-mix(in oklab, var(--color-foreground) 8%, var(--color-background));
          box-shadow: 0 0 0 1px color-mix(in oklab, var(--color-foreground) 10%, transparent);
        }
        .td-card img {
          display: block; width: 100%; height: 100%; max-width: none;
          object-fit: cover; object-position: 50% 0%; pointer-events: none;
        }
        .td-card::after {
          content: ""; position: absolute; inset: 0; pointer-events: none;
          background: #000; opacity: var(--td-shade, 0);
        }
        .td-root:focus-visible { box-shadow: inset 0 0 0 2px var(--color-primary); }
      `}</style>
      <div ref={sceneRef} className="td-scene">
        {Array.from({ length: pool }, (_, j) => (
          <div
            key={j}
            ref={(el) => {
              cardRefs.current[j] = el
            }}
            className="td-card"
          >
            {/* src/alt are set in paint() as the slot moves along the deck. */}
            <img
              ref={(el) => {
                imgRefs.current[j] = el
              }}
              alt=""
              width={720}
              height={Math.round(720 / aspect)}
              draggable={false}
              decoding="async"
            />
          </div>
        ))}
      </div>
      <span className="sr-only" aria-live="polite">
        {n} pages. Click, or press the arrow keys, to flip through them.
      </span>
    </div>
  )
}
