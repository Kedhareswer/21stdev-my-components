"use client"

import * as React from "react"
import gsap from "gsap"

/**
 * Arc Card Carousel — photo cards hung on the rim of a wheel whose hub sits
 * off the left edge, so only a gentle arc of them shows. The card on the
 * wheel's equator lies flat; every card above it tips back and every card
 * below tips forward, each one turned to face the hub. A step rolls the whole
 * wheel by one card with a slow ease in and out, so the next card swings down
 * from the top and settles flat while the others ride the rim.
 *
 * One number, the position, drives every card. GSAP tweens it; drag, keys,
 * clicks and autoplay just pick the target. Frames are written straight to
 * each card's transform, with no React render per frame.
 */

export type ArcCardItem = {
  src: string
  alt?: string
}

export type ArcCardCarouselProps = {
  items: ArcCardItem[]
  /** Root height. **Must be a definite length.** */
  height?: string
  /** Milliseconds between automatic steps. 0 is off. */
  autoplay?: number
  /** Degrees of the wheel between neighbouring cards. */
  step?: number
  /** Seconds one step takes. */
  duration?: number
  /** Card corner radius in px. */
  radius?: number
  defaultIndex?: number
  onIndexChange?: (index: number) => void
  ariaLabel?: string
  className?: string
}

// #region wheel
/** Where item `i` sits relative to the position, wrapped to [-n/2, n/2). */
export function offsetOf(i: number, pos: number, n: number): number {
  if (n <= 0) return 0
  const d = (((i - pos) % n) + n) % n
  return d >= n / 2 ? d - n : d
}

/** Cards on the rim: the list repeated to at least ten, so the wrap happens off screen. */
export function ringSize(len: number): number {
  return len > 0 ? Math.ceil(10 / len) * len : 0
}

export function wrapIndex(i: number, n: number): number {
  if (n <= 0) return 0
  return ((Math.round(i) % n) + n) % n
}

/**
 * Proportions measured off the reference at 680px tall: the flat card is
 * 0.30 of the height wide, its centre 0.284 in from the left, and the hub
 * 0.71 of the height behind it. `u` is that height, shrunk on narrow stages.
 */
export function geometry(w: number, h: number) {
  const u = Math.min(h, w / 0.47)
  const cardW = 0.3 * u
  return { cardW, cardH: cardW / 1.65, radius: 0.71 * u, hubX: 0.284 * u - 0.71 * u, hubY: 0.475 * h }
}

/** Centre and turn (degrees) of a card `d` steps from the flat one. */
export function place(d: number, stepDeg: number, g: { radius: number; hubX: number; hubY: number }) {
  const deg = d * stepDeg
  const a = (deg * Math.PI) / 180
  return { x: g.hubX + g.radius * Math.cos(a), y: g.hubY + g.radius * Math.sin(a), rot: deg }
}

/** Where a drag lets go: the nearest card, carried on by a flick, at most two. */
export function releaseTarget(pos: number, velocity: number): number {
  const fling = Math.max(-2, Math.min(2, velocity * 0.25))
  return Math.round(pos + fling)
}

/** The position that brings item `i` flat by the short way round. */
export function targetFor(i: number, pos: number, n: number): number {
  return Math.round(pos) + Math.round(offsetOf(i, Math.round(pos), n))
}
// #endregion

const CSS =
  ".acc-root{position:relative;overflow:hidden;background:var(--color-background);outline:none;touch-action:pan-x;user-select:none;-webkit-user-select:none;cursor:grab}" +
  ".acc-root[data-drag]{cursor:grabbing}" +
  ".acc-card{position:absolute;left:0;top:0;overflow:hidden;will-change:transform;" +
  "box-shadow:0 1px 2px rgba(0,0,0,.08),0 14px 34px -10px rgba(0,0,0,.38);background:var(--color-border)}" +
  ".acc-card>img{display:block;width:100%;height:100%;max-width:none;object-fit:cover;pointer-events:none}" +
  ".acc-root:focus-visible .acc-card[data-flat]{outline:2px solid var(--color-primary);outline-offset:3px}" +
  ".acc-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}"

export default function ArcCardCarousel({
  items,
  height = "100svh",
  autoplay = 3200,
  step = 14,
  duration = 1.7,
  radius = 10,
  defaultIndex = 0,
  onIndexChange,
  ariaLabel = "Photo carousel",
  className = "",
}: ArcCardCarouselProps) {
  const count = items.length
  const n = ringSize(count)
  const cards = React.useMemo(() => Array.from({ length: n }, (_, i) => items[i % count]), [items, n, count])
  const rootRef = React.useRef(null as HTMLDivElement | null)
  const cardRefs = React.useRef([] as (HTMLDivElement | null)[])
  const pos = React.useRef({ v: defaultIndex })
  const tween = React.useRef(null as gsap.core.Tween | null)
  const geo = React.useRef(geometry(1, 1))
  const [index, setIndex] = React.useState(wrapIndex(defaultIndex, n))
  const [stopped, setStopped] = React.useState(false)
  const [reduced, setReduced] = React.useState(false)
  const [visible, setVisible] = React.useState(true)
  const [focused, setFocused] = React.useState(false)
  const [dragging, setDragging] = React.useState(false)
  const onIndexRef = React.useRef(onIndexChange)
  onIndexRef.current = onIndexChange

  const render = React.useCallback(() => {
    const g = geo.current
    const p = pos.current.v
    for (let i = 0; i < n; i++) {
      const el = cardRefs.current[i]
      if (!el) continue
      const d = offsetOf(i, p, n)
      const c = place(d, step, g)
      el.style.transform =
        "translate3d(" + (c.x - g.cardW / 2).toFixed(2) + "px," + (c.y - g.cardH / 2).toFixed(2) + "px,0) rotate(" + c.rot.toFixed(3) + "deg)"
      el.style.zIndex = String(Math.round((d + n) * 10))
      el.style.visibility = Math.abs(c.rot) > 88 ? "hidden" : "visible"
      if (Math.abs(d) < 0.5) el.setAttribute("data-flat", "")
      else el.removeAttribute("data-flat")
    }
    const now = wrapIndex(p, n)
    setIndex((prev) => (prev === now ? prev : now))
  }, [n, step])

  React.useEffect(() => {
    if (count) onIndexRef.current?.(index % count)
  }, [index, count])

  const goTo = React.useCallback(
    (target: number) => {
      tween.current?.kill()
      tween.current = gsap.to(pos.current, {
        v: target,
        duration: reduced ? 0 : duration,
        ease: "power2.inOut",
        onUpdate: render,
      })
    },
    [duration, reduced, render],
  )

  // Size: every length is a fraction of the stage height.
  React.useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      const g = geometry(el.clientWidth, el.clientHeight)
      geo.current = g
      for (const c of cardRefs.current) {
        if (!c) continue
        c.style.width = g.cardW + "px"
        c.style.height = g.cardH + "px"
      }
      render()
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [render])

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const on = () => setReduced(mq.matches)
    on()
    mq.addEventListener("change", on)
    return () => mq.removeEventListener("change", on)
  }, [])

  React.useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting && !document.hidden))
    io.observe(el)
    const onVis = () => setVisible(!document.hidden)
    document.addEventListener("visibilitychange", onVis)
    return () => {
      io.disconnect()
      document.removeEventListener("visibilitychange", onVis)
    }
  }, [])

  React.useEffect(() => () => void tween.current?.kill(), [])

  // Autoplay rolls the wheel down: each new card swings in from the top.
  const playing = autoplay > 0 && !reduced && !stopped && !focused && !dragging && visible && n > 1
  React.useEffect(() => {
    if (!playing) return
    const id = window.setInterval(() => goTo(Math.round(pos.current.v) - 1), autoplay)
    return () => window.clearInterval(id)
  }, [playing, autoplay, goTo])

  // Drag: one card's worth of arc per step, flick to carry on.
  const drag = React.useRef({ id: -1, y: 0, start: 0, last: 0, t: 0, v: 0, moved: false })
  const onPointerDown = (e: React.PointerEvent) => {
    if (n < 2) return
    setStopped(true)
    tween.current?.kill()
    const d = drag.current
    d.id = e.pointerId
    d.y = e.clientY
    d.start = pos.current.v
    d.last = e.clientY
    d.t = performance.now()
    d.v = 0
    d.moved = false
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current
    if (d.id !== e.pointerId) return
    if (!d.moved && Math.abs(e.clientY - d.y) > 4) {
      d.moved = true
      setDragging(true)
      e.currentTarget.setPointerCapture(e.pointerId)
    }
    if (!d.moved) return
    const arc = (geo.current.radius * step * Math.PI) / 180
    pos.current.v = d.start - (e.clientY - d.y) / arc
    const now = performance.now()
    const dt = Math.max(1, now - d.t)
    d.v = 0.8 * (-(e.clientY - d.last) / arc / dt) * 1000 + 0.2 * d.v
    d.last = e.clientY
    d.t = now
    render()
  }
  const onPointerUp = (e: React.PointerEvent) => {
    const d = drag.current
    if (d.id !== e.pointerId) return
    d.id = -1
    if (d.moved) {
      setDragging(false)
      goTo(releaseTarget(pos.current.v, d.v))
      return
    }
    // A click: bring the card under the pointer flat.
    const hit = (e.target as HTMLElement).closest("[data-acc-i]")
    if (hit) goTo(targetFor(Number(hit.getAttribute("data-acc-i")), pos.current.v, n))
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    const k = e.key
    const delta = k === "ArrowDown" || k === "ArrowRight" ? -1 : k === "ArrowUp" || k === "ArrowLeft" ? 1 : 0
    if (!delta) return
    e.preventDefault()
    setStopped(true)
    const base = tween.current?.isActive() ? (tween.current.vars.v as number) : Math.round(pos.current.v)
    goTo(base + delta)
  }

  return (
    <div
      ref={rootRef}
      className={"acc-root " + className}
      style={{ height }}
      role="region"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      tabIndex={0}
      data-drag={dragging ? "" : undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyDown}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      <style>{CSS}</style>
      {cards.map((it, i) => (
        <div
          key={i}
          ref={(el) => {
            cardRefs.current[i] = el
          }}
          className="acc-card"
          data-acc-i={i}
          style={{ borderRadius: radius }}
          aria-roledescription="slide"
          aria-label={(i % count) + 1 + " of " + count}
          aria-hidden={i !== index}
        >
          <img src={it.src} alt={it.alt ?? ""} draggable={false} decoding="async" />
        </div>
      ))}
      <p className="acc-sr" aria-live="polite">
        {count ? "Card " + ((index % count) + 1) + " of " + count + (cards[index]?.alt ? ": " + cards[index].alt : "") : ""}
      </p>
    </div>
  )
}
