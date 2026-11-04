"use client"

import * as React from "react"

// Product cards held like a hand of playing cards. The chosen card stands up
// in the middle; the rest fan out round a pivot below the deck, tilting and
// sinking the further they are from it. Every card rides its own spring, the
// outer ones a beat behind, so a change ripples through the hand.

export type DeckCard = {
  title: string
  image: string
  alt?: string
  /** Small chip, top left of the card. */
  tag?: string
  /** Right-aligned line under the title, e.g. a price. */
  price?: string
  /** One line in the panel under the deck. */
  blurb?: string
  href?: string
}

export type FannedDeckSliderProps = {
  cards: DeckCard[]
  /** Heading over the deck. */
  title?: React.ReactNode
  /** Small line above the heading. */
  eyebrow?: React.ReactNode
  /** Button label under the deck. */
  ctaLabel?: string
  /** Degrees each card tilts per step from the centre. */
  spread?: number
  background?: string
  ink?: string
  accent?: string
  /** Stage height. Keep it a definite length; percentages collapse once installed. */
  height?: string
  className?: string
  onChange?: (index: number) => void
  onCta?: (card: DeckCard, index: number) => void
}

// #region fan
export type Pose = { r: number; x: number; y: number; s: number }

/** Clamps i into 0..n-1. */
export function clampIndex(i: number, n: number): number {
  return Math.max(0, Math.min(n - 1, Math.round(i)))
}

/** Pose of a card `d` steps from the chosen one, for card width cw and a spread in degrees. */
export function fanPose(d: number, cw: number, spread: number): Pose {
  const a = Math.abs(d)
  const lift = Math.max(0, 1 - a)
  return {
    r: Math.max(-60, Math.min(60, d * spread)),
    x: d * cw * 0.34,
    y: Math.pow(a, 1.2) * cw * 0.02 - lift * cw * 0.1,
    s: 1 - Math.min(a, 4) * 0.055 + lift * 0.06,
  }
}

/** One step of a damped spring on a single value. Stiffer for cards near the centre. */
export function springTo(x: number, v: number, to: number, dt: number, k: number, c: number): [number, number] {
  const a = (to - x) * k - v * c
  const nv = v + a * dt
  return [x + nv * dt, nv]
}

/** Stiffness for a card `a` steps out: the outer cards answer a beat later. */
export function stiffness(a: number): number {
  return 260 / (1 + Math.min(a, 5) * 0.32)
}

/** Card width in px for a w × h stage. */
export function cardWidth(w: number, h: number): number {
  return Math.round(Math.min(w < 640 ? w * 0.52 : w * 0.17, h * 0.3, 280))
}
// #endregion

const CSS =
  ".fds-root{position:relative;overflow:hidden;isolation:isolate;color:var(--fds-ink);font-family:ui-sans-serif,system-ui,sans-serif;outline:none;user-select:none;-webkit-user-select:none;touch-action:pan-y}" +
  ".fds-root:focus-visible{box-shadow:inset 0 0 0 2px var(--fds-accent)}" +
  ".fds-spot{position:absolute;left:50%;top:58%;width:120vmax;height:120vmax;transform:translate(-50%,-50%);background:radial-gradient(closest-side,color-mix(in srgb,var(--fds-accent) 22%,transparent),transparent 62%);opacity:.55;pointer-events:none;transition:background .8s ease}" +
  ".fds-floor{position:absolute;left:0;right:0;bottom:0;height:42%;background:linear-gradient(180deg,transparent,rgba(0,0,0,.45));pointer-events:none}" +
  ".fds-head{position:absolute;left:0;right:0;top:clamp(26px,6vh,64px);text-align:center;padding:0 20px;pointer-events:none}" +
  ".fds-eyebrow{display:inline-flex;align-items:center;gap:8px;font-size:11px;letter-spacing:.24em;text-transform:uppercase;opacity:.7}" +
  ".fds-eyebrow::before{content:'';width:6px;height:6px;border-radius:9px;background:var(--fds-accent);box-shadow:0 0 12px var(--fds-accent)}" +
  ".fds-h{margin:12px 0 0;font-family:ui-serif,Georgia,'Times New Roman',serif;font-weight:400;font-size:clamp(34px,4.6vw,64px);line-height:1;letter-spacing:-.02em}" +
  ".fds-h em{font-style:italic;color:var(--fds-accent)}" +
  ".fds-deck{position:absolute;left:50%;top:51%;width:0;height:0;cursor:grab}" +
  ".fds-deck:active{cursor:grabbing}" +
  ".fds-card{position:absolute;left:0;top:0;padding:0;margin:0;border:0;border-radius:18px;overflow:hidden;background:#221b22;cursor:pointer;transform-origin:50% 190%;will-change:transform;" +
  "box-shadow:0 1px 0 rgba(255,255,255,.18) inset,0 0 0 1px rgba(255,255,255,.06) inset,0 40px 60px -30px rgba(0,0,0,.85),0 12px 24px -12px rgba(0,0,0,.6)}" +
  ".fds-card>img{position:absolute;inset:0;width:100%;height:100%;max-width:none;object-fit:cover;pointer-events:none;transition:transform 1.2s cubic-bezier(.16,1,.3,1)}" +
  ".fds-card:hover>img{transform:scale(1.05)}" +
  ".fds-card:focus-visible{outline:2px solid var(--fds-accent);outline-offset:4px}" +
  ".fds-shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.32),transparent 28%,transparent 52%,rgba(8,4,8,.86));pointer-events:none}" +
  ".fds-dim{position:absolute;inset:0;background:#0b080c;pointer-events:none}" +
  ".fds-gloss{position:absolute;inset:-40%;background:linear-gradient(115deg,transparent 42%,rgba(255,255,255,.28) 50%,transparent 58%);transform:translateX(-60%);pointer-events:none}" +
  ".fds-on .fds-gloss{animation:fds-gloss 1.4s cubic-bezier(.3,.7,.2,1) .15s both}" +
  ".fds-tag{position:absolute;left:12px;top:12px;padding:5px 9px;border-radius:999px;font-size:10px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:#fff;background:rgba(18,12,18,.45);border:1px solid rgba(255,255,255,.2);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}" +
  ".fds-cap{position:absolute;left:14px;right:14px;bottom:13px;display:flex;align-items:flex-end;justify-content:space-between;gap:8px;color:#fff;text-align:left}" +
  ".fds-cap b{font-family:ui-serif,Georgia,serif;font-weight:400;font-size:21px;line-height:1.05;letter-spacing:-.01em}" +
  ".fds-cap span{font-size:12px;font-variant-numeric:tabular-nums;opacity:.85;white-space:nowrap}" +
  ".fds-panel{position:absolute;left:50%;bottom:clamp(22px,5vh,52px);transform:translateX(-50%);width:min(560px,calc(100% - 40px));display:flex;align-items:center;justify-content:space-between;gap:18px}" +
  ".fds-blurb{font-size:14px;line-height:1.5;opacity:.75;max-width:34ch;animation:fds-up .7s cubic-bezier(.16,1,.3,1) both}" +
  ".fds-cta{flex:none;display:inline-flex;align-items:center;gap:10px;padding:13px 20px;border-radius:999px;border:0;cursor:pointer;font:inherit;font-size:12px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;text-decoration:none;color:#170d0a;" +
  "background:linear-gradient(180deg,color-mix(in srgb,var(--fds-accent) 70%,#fff),var(--fds-accent));box-shadow:0 1px 0 rgba(255,255,255,.5) inset,0 16px 30px -14px var(--fds-accent);transition:transform .35s cubic-bezier(.3,1.6,.5,1),box-shadow .35s ease}" +
  ".fds-cta:hover{transform:translateY(-2px);box-shadow:0 1px 0 rgba(255,255,255,.5) inset,0 22px 38px -14px var(--fds-accent)}" +
  ".fds-cta:active{transform:scale(.96)}" +
  ".fds-cta:focus-visible,.fds-arrow:focus-visible{outline:2px solid var(--fds-ink);outline-offset:3px}" +
  ".fds-nav{position:absolute;left:clamp(16px,4vw,48px);right:clamp(16px,4vw,48px);top:54%;display:flex;justify-content:space-between;pointer-events:none}" +
  ".fds-arrow{pointer-events:auto;width:48px;height:48px;border-radius:999px;display:grid;place-items:center;cursor:pointer;color:var(--fds-ink);background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);transition:transform .35s cubic-bezier(.3,1.6,.5,1),background .3s ease,opacity .3s ease}" +
  ".fds-arrow:hover{transform:scale(1.08);background:rgba(255,255,255,.12)}" +
  ".fds-arrow:disabled{opacity:.25;cursor:default;transform:none}" +
  ".fds-arrow svg{width:18px;height:18px}" +
  ".fds-dots{position:absolute;left:50%;bottom:calc(clamp(22px,5vh,52px) + 64px);transform:translateX(-50%);display:flex;gap:6px}" +
  ".fds-dots i{display:block;width:6px;height:6px;border-radius:9px;background:var(--fds-ink);opacity:.25;transition:width .5s cubic-bezier(.16,1,.3,1),opacity .4s ease,background .4s ease}" +
  ".fds-dots i.fds-on{width:22px;opacity:1;background:var(--fds-accent)}" +
  "@keyframes fds-gloss{from{transform:translateX(-60%)}to{transform:translateX(60%)}}" +
  "@keyframes fds-up{from{opacity:0;transform:translateY(10px)}to{opacity:.75;transform:none}}" +
  "@media (max-width:640px){.fds-nav{display:none}.fds-panel{flex-direction:column;text-align:center}.fds-dots{bottom:calc(clamp(22px,5vh,52px) + 118px)}}" +
  "@media (prefers-reduced-motion:reduce){.fds-on .fds-gloss,.fds-blurb{animation:none}.fds-card>img,.fds-dots i,.fds-cta,.fds-arrow{transition:none}}"

const Chevron = ({ left }: { left?: boolean }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d={left ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} />
  </svg>
)

export default function FannedDeckSlider({
  cards,
  title = (
    <>
      The autumn <em>edit</em>
    </>
  ),
  eyebrow = "Drop 07 · twelve pieces",
  ctaLabel = "Reserve",
  spread = 7,
  background = "#120e14",
  ink = "#f6efe8",
  accent = "#ff7a45",
  height = "100svh",
  className,
  onChange,
  onCta,
}: FannedDeckSliderProps) {
  const n = cards.length
  const rootRef = React.useRef(null as HTMLDivElement | null)
  const deckRef = React.useRef(null as HTMLDivElement | null)
  const els = React.useRef([] as (HTMLButtonElement | null)[])
  const dims = React.useRef([] as (HTMLElement | null)[])
  const [index, setIndex] = React.useState(Math.min(2, Math.max(0, n - 1)))
  const api = React.useRef({ go: (_i: number) => {} })
  const onChangeRef = React.useRef(onChange)
  onChangeRef.current = onChange

  React.useEffect(() => {
    const root = rootRef.current
    const deck = deckRef.current
    if (!root || !deck || n === 0) return
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    let W = 1, H = 1, cw = 1, ch = 1
    let pos = Math.min(2, n - 1), target = pos
    // per-card spring state: rotation, x, y, scale and their velocities
    const st = Array.from({ length: n }, () => ({ r: 0, x: 0, y: 60, s: 0.8, vr: 0, vx: 0, vy: 0, vs: 0, o: 0 }))
    let raf = 0, last = 0, visible = true, cur = pos, t0 = -1
    let dragging = false, downX = 0, downPos = 0, moved = 0

    const resize = (w: number, h: number) => {
      W = Math.max(1, w)
      H = Math.max(1, h)
      cw = cardWidth(W, H)
      ch = Math.round(cw * 1.42)
      for (const el of els.current) {
        if (!el) continue
        el.style.width = cw + "px"
        el.style.height = ch + "px"
        el.style.marginLeft = -cw / 2 + "px"
        el.style.marginTop = -ch / 2 + "px"
      }
      kick()
    }

    const frame = (now: number) => {
      raf = 0
      const dt = last ? Math.min(0.033, (now - last) / 1000) : 1 / 60
      last = now
      if (t0 < 0) t0 = now
      const elapsed = (now - t0) / 1000
      if (!dragging) pos = mq.matches ? target : pos + (target - pos) * (1 - Math.exp(-dt * 14))
      let busy = dragging || Math.abs(target - pos) > 0.0005
      for (let i = 0; i < n; i++) {
        const d = i - pos
        const a = Math.abs(d)
        const goal = fanPose(d, cw, spread)
        const c = st[i]
        // the hand deals out from a stack, outer cards a little later
        const live = mq.matches || elapsed > 0.15 + a * 0.07
        const g = live ? goal : { r: 0, x: 0, y: ch * 0.5, s: 0.82 }
        if (mq.matches) {
          c.r = g.r; c.x = g.x; c.y = g.y; c.s = g.s
          c.vr = c.vx = c.vy = c.vs = 0
        } else {
          const k = stiffness(a), damp = 2 * Math.sqrt(k) * 0.72
          ;[c.r, c.vr] = springTo(c.r, c.vr, g.r, dt, k, damp)
          ;[c.x, c.vx] = springTo(c.x, c.vx, g.x, dt, k, damp)
          ;[c.y, c.vy] = springTo(c.y, c.vy, g.y, dt, k, damp)
          ;[c.s, c.vs] = springTo(c.s, c.vs, g.s, dt, k, damp)
        }
        c.o = live ? Math.min(1, c.o + dt * 4) : c.o
        if (mq.matches) c.o = 1
        if (!live || Math.abs(c.vr) + Math.abs(c.vx) + Math.abs(c.vy) > 0.05 || Math.abs(c.r - g.r) + Math.abs(c.x - g.x) > 0.05 || c.o < 1) busy = true
        const el = els.current[i]
        if (!el) continue
        el.style.transform = "translate3d(" + c.x.toFixed(2) + "px," + c.y.toFixed(2) + "px,0) rotate(" + c.r.toFixed(3) + "deg) scale(" + c.s.toFixed(4) + ")"
        el.style.zIndex = String(100 - Math.round(a * 10))
        el.style.opacity = a > 4.6 ? "0" : c.o.toFixed(3)
        const dim = dims.current[i]
        if (dim) dim.style.opacity = Math.min(0.7, a * 0.2).toFixed(3)
      }
      const idx = Math.max(0, Math.min(n - 1, Math.round(pos)))
      if (idx !== cur) {
        cur = idx
        setIndex(idx)
        onChangeRef.current?.(idx)
      }
      if (busy && visible) raf = requestAnimationFrame(frame)
      else last = 0
    }
    function kick() {
      if (!raf && visible) raf = requestAnimationFrame(frame)
    }

    api.current.go = (i: number) => {
      target = Math.max(0, Math.min(n - 1, i))
      kick()
    }

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return
      dragging = true
      downX = e.clientX
      downPos = pos
      moved = 0
      deck.setPointerCapture(e.pointerId)
      kick()
    }
    const onMove = (e: PointerEvent) => {
      if (!dragging) return
      const dx = e.clientX - downX
      moved = Math.max(moved, Math.abs(dx))
      // rubber-band past the ends
      let p = downPos - dx / (cw * 0.5)
      if (p < 0) p = p * 0.3
      if (p > n - 1) p = n - 1 + (p - (n - 1)) * 0.3
      pos = p
      kick()
    }
    const onUp = () => {
      if (!dragging) return
      dragging = false
      target = clampIndex(pos, n)
      kick()
    }
    const onClick = (e: MouseEvent) => {
      if (moved > 6) {
        e.stopPropagation()
        e.preventDefault()
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") api.current.go(Math.round(target) + 1)
      else if (e.key === "ArrowLeft") api.current.go(Math.round(target) - 1)
      else if (e.key === "Home") api.current.go(0)
      else if (e.key === "End") api.current.go(n - 1)
      else return
      e.preventDefault()
    }
    const onMq = () => kick()

    deck.addEventListener("pointerdown", onDown)
    deck.addEventListener("pointermove", onMove)
    deck.addEventListener("pointerup", onUp)
    deck.addEventListener("pointercancel", onUp)
    deck.addEventListener("click", onClick, true)
    root.addEventListener("keydown", onKey)
    mq.addEventListener("change", onMq)
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect
      resize(r.width, r.height)
    })
    ro.observe(root)
    const io = new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting
      kick()
    })
    io.observe(root)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      deck.removeEventListener("pointerdown", onDown)
      deck.removeEventListener("pointermove", onMove)
      deck.removeEventListener("pointerup", onUp)
      deck.removeEventListener("pointercancel", onUp)
      deck.removeEventListener("click", onClick, true)
      root.removeEventListener("keydown", onKey)
      mq.removeEventListener("change", onMq)
    }
  }, [n, spread])

  if (n === 0) return null
  const c = cards[index]
  const vars = { height, background, "--fds-ink": ink, "--fds-accent": accent } as React.CSSProperties

  return (
    <div ref={rootRef} className={"fds-root" + (className ? " " + className : "")} style={vars} tabIndex={0} role="region" aria-roledescription="carousel" aria-label="Product cards">
      <style>{CSS}</style>
      <div className="fds-spot" aria-hidden="true" />
      <div className="fds-floor" aria-hidden="true" />
      <header className="fds-head">
        <span className="fds-eyebrow">{eyebrow}</span>
        <h2 className="fds-h">{title}</h2>
      </header>
      <div ref={deckRef} className="fds-deck">
        {cards.map((card, i) => (
          <button
            key={i}
            ref={(el) => {
              els.current[i] = el
            }}
            type="button"
            className={"fds-card" + (i === index ? " fds-on" : "")}
            style={{ opacity: 0 }}
            aria-label={card.title + (card.price ? ", " + card.price : "")}
            aria-current={i === index}
            onClick={() => api.current.go(i)}
          >
            <img src={card.image} alt={card.alt ?? ""} draggable={false} />
            <span className="fds-shade" />
            <span className="fds-gloss" key={i === index ? "on" + index : "off"} />
            {card.tag ? <span className="fds-tag">{card.tag}</span> : null}
            <span className="fds-cap">
              <b>{card.title}</b>
              {card.price ? <span>{card.price}</span> : null}
            </span>
            <i
              className="fds-dim"
              ref={(el) => {
                dims.current[i] = el
              }}
            />
          </button>
        ))}
      </div>
      <div className="fds-nav">
        <button type="button" className="fds-arrow" aria-label="Previous card" disabled={index === 0} onClick={() => api.current.go(index - 1)}>
          <Chevron left />
        </button>
        <button type="button" className="fds-arrow" aria-label="Next card" disabled={index === n - 1} onClick={() => api.current.go(index + 1)}>
          <Chevron />
        </button>
      </div>
      <div className="fds-dots" aria-hidden="true">
        {cards.map((_, i) => (
          <i key={i} className={i === index ? "fds-on" : undefined} />
        ))}
      </div>
      <div className="fds-panel" aria-live="polite">
        <span className="fds-blurb" key={index}>
          {c.blurb ?? c.title}
        </span>
        {c.href ? (
          <a className="fds-cta" href={c.href} onClick={() => onCta?.(c, index)}>
            {ctaLabel}
            <Chevron />
          </a>
        ) : (
          <button type="button" className="fds-cta" onClick={() => onCta?.(c, index)}>
            {ctaLabel}
            <Chevron />
          </button>
        )}
      </div>
    </div>
  )
}
