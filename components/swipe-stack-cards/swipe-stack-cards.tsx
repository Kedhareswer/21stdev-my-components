"use client"

import * as React from "react"
import gsap from "gsap"

// A deck of story cards stacked with the ones behind peeking over the top. Drag
// the front card down and let go: past the line (or flicked) it drops off the
// bottom and slides in again at the back of the deck. Drag up, or press Back, to
// pull the last card round to the front. Cards settle on a soft elastic.

export type StackStory = {
  title: string
  image: string
  alt?: string
  /** Small label over the photo, e.g. a section. */
  kicker?: string
  /** Who picked it. Initials are drawn as an avatar. */
  curator?: string
  /** e.g. "6 min read". */
  length?: string
  href?: string
}

export type SwipeStackCardsProps = {
  stories: StackStory[]
  /** Heading beside the deck. */
  heading?: React.ReactNode
  /** Paragraph under the heading. */
  intro?: React.ReactNode
  readLabel?: string
  /** Stage height. Keep it a definite length; percentages collapse once installed. */
  height?: string
  className?: string
  onChange?: (story: StackStory, index: number) => void
}

// #region deck
/** Move the front card to the back. */
export function sendBack(order: number[]): number[] {
  return order.length < 2 ? order.slice() : [...order.slice(1), order[0]]
}

/** Bring the back card to the front. */
export function bringFront(order: number[]): number[] {
  return order.length < 2 ? order.slice() : [order[order.length - 1], ...order.slice(0, -1)]
}

/** Resting pose for a card in slot k (0 is the front): peek upwards, smaller, dimmer. */
export function slotPose(k: number, peek: number): { y: number; scale: number; dim: number; opacity: number } {
  const v = Math.min(k, 3)
  return { y: -v * peek, scale: 1 - v * 0.055, dim: Math.min(0.5, v * 0.16), opacity: k > 3 ? 0 : 1 }
}

/** Whether a release deals the card away: far enough, or flicked hard enough, downwards (+1) or upwards (-1). */
export function releaseAction(dy: number, vy: number, threshold: number): 1 | -1 | 0 {
  if (dy > threshold || vy > 900) return 1
  if (dy < -threshold * 0.7 || vy < -900) return -1
  return 0
}

/** Drag resistance: free downwards, stiffer upwards. */
export function dragY(dy: number): number {
  return dy >= 0 ? dy : -Math.pow(-dy, 0.82)
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("")
}
// #endregion

const CSS =
  ".ssc-root{position:relative;overflow:hidden;isolation:isolate;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);align-items:center;gap:clamp(24px,5vw,80px);padding:0 clamp(20px,6vw,96px);" +
  "background:var(--color-background,#f4f0ea);color:var(--color-foreground,#17140f);font-family:ui-sans-serif,system-ui,sans-serif;outline:none}" +
  ".ssc-root:focus-visible{box-shadow:inset 0 0 0 2px var(--color-primary,#17140f)}" +
  ".ssc-bg{position:absolute;inset:0;z-index:-1;pointer-events:none;background:radial-gradient(60% 70% at 72% 55%,color-mix(in srgb,var(--color-foreground,#17140f) 7%,transparent),transparent 70%)}" +
  ".ssc-halo{position:absolute;left:50%;top:50%;width:150%;height:130%;transform:translate(-50%,-46%);z-index:-1;pointer-events:none;border-radius:50%;overflow:hidden;" +
  "-webkit-mask-image:radial-gradient(closest-side,#000 30%,transparent);mask-image:radial-gradient(closest-side,#000 30%,transparent)}" +
  ".ssc-halo>img{position:absolute;inset:0;width:100%;height:100%;max-width:none;object-fit:cover;filter:blur(40px) saturate(1.6);opacity:.62}" +
  ".ssc-copy{max-width:440px;justify-self:end}" +
  ".ssc-eyebrow{font-size:11px;letter-spacing:.24em;text-transform:uppercase;color:var(--color-muted-foreground,#6f675c)}" +
  ".ssc-h{margin:14px 0 0;font-family:ui-serif,Georgia,'Times New Roman',serif;font-weight:400;font-size:clamp(38px,4.6vw,66px);line-height:.98;letter-spacing:-.025em}" +
  ".ssc-h em{font-style:italic}" +
  ".ssc-p{margin:18px 0 0;font-size:15px;line-height:1.6;color:var(--color-muted-foreground,#6f675c);max-width:36ch}" +
  ".ssc-ctl{display:flex;align-items:center;gap:10px;margin-top:28px}" +
  ".ssc-btn{display:inline-flex;align-items:center;gap:8px;height:44px;padding:0 18px;border-radius:999px;cursor:pointer;font:inherit;font-size:13px;font-weight:600;" +
  "border:1px solid var(--color-border,#ddd5c9);background:transparent;color:inherit;transition:transform .35s cubic-bezier(.3,1.6,.5,1),background .3s ease}" +
  ".ssc-btn:hover{transform:translateY(-2px);background:color-mix(in srgb,var(--color-foreground,#17140f) 6%,transparent)}" +
  ".ssc-btn:active{transform:scale(.96)}" +
  ".ssc-btn.ssc-solid{background:var(--color-foreground,#17140f);color:var(--color-background,#f4f0ea);border-color:transparent}" +
  ".ssc-btn.ssc-solid:hover{background:color-mix(in srgb,var(--color-foreground,#17140f) 86%,var(--color-background,#f4f0ea))}" +
  ".ssc-btn:focus-visible,.ssc-read:focus-visible,.ssc-card:focus-visible{outline:2px solid var(--color-primary,#17140f);outline-offset:3px}" +
  ".ssc-btn svg,.ssc-read svg{width:15px;height:15px}" +
  ".ssc-count{margin-left:6px;font-size:12px;letter-spacing:.14em;font-variant-numeric:tabular-nums;color:var(--color-muted-foreground,#6f675c)}" +
  ".ssc-deck{position:relative;justify-self:start;width:min(400px,100%);aspect-ratio:4/5.1;margin-top:56px}" +
  ".ssc-card{position:absolute;inset:0;border-radius:22px;overflow:hidden;display:flex;flex-direction:column;touch-action:none;cursor:grab;will-change:transform;transform-origin:50% 0%;" +
  "background:color-mix(in srgb,var(--color-background,#f4f0ea) 92%,#fff);border:1px solid var(--color-border,#ddd5c9);" +
  "box-shadow:0 1px 0 rgba(255,255,255,.7) inset,0 30px 60px -32px rgba(30,22,12,.45),0 10px 22px -14px rgba(30,22,12,.3)}" +
  ".ssc-card:active{cursor:grabbing}" +
  ".ssc-ph{position:relative;flex:1 1 auto;margin:10px 10px 0;border-radius:14px;overflow:hidden;background:#cfc7ba}" +
  ".ssc-ph>img{position:absolute;inset:0;width:100%;height:100%;max-width:none;object-fit:cover;pointer-events:none;transform:scale(1.04)}" +
  ".ssc-kick{position:absolute;left:12px;top:12px;padding:5px 10px;border-radius:999px;font-size:10px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:#fff;background:rgba(20,16,12,.4);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.25)}" +
  ".ssc-body{flex:none;padding:16px 18px 18px}" +
  ".ssc-t{display:block;font-family:ui-serif,Georgia,serif;font-size:26px;line-height:1.05;letter-spacing:-.015em}" +
  ".ssc-row{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:14px}" +
  ".ssc-by{display:flex;align-items:center;gap:10px;font-size:12px;color:var(--color-muted-foreground,#6f675c);min-width:0}" +
  ".ssc-by b{color:var(--color-foreground,#17140f);font-weight:600}" +
  ".ssc-av{flex:none;width:30px;height:30px;border-radius:999px;display:grid;place-items:center;font-size:11px;font-weight:700;color:#fff;background:linear-gradient(135deg,#c0573a,#7a2f1d);box-shadow:0 0 0 2px color-mix(in srgb,var(--color-background,#f4f0ea) 92%,#fff)}" +
  ".ssc-read{flex:none;display:inline-flex;align-items:center;gap:6px;height:34px;padding:0 14px;border-radius:999px;font-size:12px;font-weight:600;text-decoration:none;color:var(--color-background,#f4f0ea);background:var(--color-foreground,#17140f);transition:transform .35s cubic-bezier(.3,1.6,.5,1)}" +
  ".ssc-read:hover{transform:translateX(3px)}" +
  ".ssc-dim{position:absolute;inset:0;background:var(--color-background,#f4f0ea);pointer-events:none;opacity:0}" +
  ".ssc-hint{position:absolute;left:50%;bottom:-44px;transform:translateX(-50%);display:flex;align-items:center;gap:8px;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--color-muted-foreground,#6f675c);white-space:nowrap}" +
  ".ssc-hint i{display:block;width:1px;height:18px;background:currentColor;animation:ssc-drip 1.8s cubic-bezier(.6,0,.4,1) infinite;transform-origin:50% 0}" +
  "@keyframes ssc-drip{0%{transform:scaleY(0)}50%{transform:scaleY(1)}100%{transform:scaleY(1) translateY(18px);opacity:0}}" +
  "@media (max-width:760px){.ssc-root{grid-template-columns:1fr;align-content:center;gap:28px;padding:0 20px}.ssc-copy{justify-self:center;text-align:center}.ssc-p{display:none}.ssc-ctl{justify-content:center}.ssc-deck{justify-self:center;width:min(300px,82vw);margin-top:40px}}" +
  "@media (prefers-reduced-motion:reduce){.ssc-hint i{animation:none}.ssc-btn,.ssc-read{transition:none}}"

const Icon = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)

export default function SwipeStackCards({
  stories,
  heading = (
    <>
      Worth your
      <br />
      <em>slow</em> Sunday
    </>
  ),
  intro = "Six long reads chosen by our editors this week. Drag a card down to put it to the back of the pile.",
  readLabel = "Read",
  height = "100svh",
  className,
  onChange,
}: SwipeStackCardsProps) {
  const n = stories.length
  const deckRef = React.useRef(null as HTMLDivElement | null)
  const cards = React.useRef([] as (HTMLDivElement | null)[])
  const dims = React.useRef([] as (HTMLElement | null)[])
  const order = React.useRef(stories.map((_, i) => i))
  const [front, setFront] = React.useState(0)
  const api = React.useRef({ next: () => {}, prev: () => {} })
  const onChangeRef = React.useRef(onChange)
  onChangeRef.current = onChange

  React.useEffect(() => {
    const deck = deckRef.current
    if (!deck || n === 0) return
    order.current = stories.map((_, i) => i)
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    let H = 520, peek = 16, busy = false
    const ctx = gsap.context(() => {}, deck)

    const layout = (instant = false, stagger = 0) => {
      const fast = mq.matches
      order.current.forEach((ci, k) => {
        const el = cards.current[ci]
        if (!el) return
        const p = slotPose(k, peek)
        el.style.zIndex = String(100 - k)
        el.style.pointerEvents = k === 0 ? "auto" : "none"
        el.setAttribute("aria-hidden", k === 0 ? "false" : "true")
        const vars = { y: p.y, x: 0, scale: p.scale, rotation: 0, opacity: p.opacity, overwrite: "auto" as const }
        if (instant) gsap.set(el, vars)
        else ctx.add(() => gsap.to(el, { ...vars, duration: fast ? 0.2 : 0.9, ease: fast ? "power1.out" : "elastic.out(1,0.78)", delay: stagger ? (3 - Math.min(k, 3)) * stagger : 0 }))
        const d = dims.current[ci]
        if (d) gsap.to(d, { opacity: p.dim, duration: fast ? 0.2 : 0.5 })
      })
      const f = order.current[0]
      setFront(f)
    }

    const report = () => onChangeRef.current?.(stories[order.current[0]], order.current[0])

    const deal = (dir: 1 | -1) => {
      if (busy || n < 2) return
      busy = true
      const fast = mq.matches
      if (dir === 1) {
        const el = cards.current[order.current[0]]
        if (!el) return
        gsap.to(el, {
          y: H * 0.75,
          rotation: (Math.random() < 0.5 ? -1 : 1) * 9,
          opacity: 0,
          duration: fast ? 0.15 : 0.45,
          ease: "power2.in",
          onComplete: () => {
            order.current = sendBack(order.current)
            gsap.set(el, { y: -4 * peek, scale: 0.8, rotation: 0, opacity: 0 })
            layout()
            busy = false
            report()
          },
        })
      } else {
        order.current = bringFront(order.current)
        const el = cards.current[order.current[0]]
        if (el) gsap.set(el, { y: H * 0.6, rotation: -7, opacity: 0, scale: 1 })
        layout()
        busy = false
        report()
      }
    }
    api.current.next = () => deal(1)
    api.current.prev = () => deal(-1)

    // drag the front card
    let el: HTMLDivElement | null = null
    let sx = 0, sy = 0, ly = 0, lt = 0, vy = 0, dragging = false
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0 || busy) return
      const t = e.target as Element
      if (t.closest("a,button")) return
      el = cards.current[order.current[0]]
      if (!el || !el.contains(t)) return
      dragging = true
      sx = e.clientX
      sy = ly = e.clientY
      lt = e.timeStamp
      vy = 0
      el.setPointerCapture(e.pointerId)
      gsap.killTweensOf(el)
    }
    const onMove = (e: PointerEvent) => {
      if (!dragging || !el) return
      const dy = e.clientY - sy, dx = e.clientX - sx
      const dts = Math.max(1, e.timeStamp - lt) / 1000
      vy = vy * 0.5 + ((e.clientY - ly) / dts) * 0.5
      ly = e.clientY
      lt = e.timeStamp
      gsap.set(el, { y: dragY(dy), x: dx * 0.35, rotation: dx * 0.03 + dy * 0.012, scale: 1 - Math.min(0.04, Math.abs(dy) / 4000) })
    }
    const onUp = (e: PointerEvent) => {
      if (!dragging) return
      dragging = false
      const act = releaseAction(e.clientY - sy, vy, Math.min(140, H * 0.2))
      if (act === 1) deal(1)
      else if (act === -1) {
        layout()
        deal(-1)
      } else layout()
    }
    deck.addEventListener("pointerdown", onDown)
    deck.addEventListener("pointermove", onMove)
    deck.addEventListener("pointerup", onUp)
    deck.addEventListener("pointercancel", onUp)

    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect
      H = Math.max(1, r.height)
      peek = Math.max(10, Math.min(18, r.width * 0.045))
      if (!busy && !dragging) layout(true)
    })
    ro.observe(deck)

    // entrance: deal the deck in from below, back card first
    order.current.forEach((ci) => {
      const c = cards.current[ci]
      if (c) gsap.set(c, { y: mq.matches ? 0 : 120, opacity: 0, scale: 0.92 })
    })
    layout(false, mq.matches ? 0 : 0.09)
    const onMq = () => layout(true)
    mq.addEventListener("change", onMq)

    return () => {
      deck.removeEventListener("pointerdown", onDown)
      deck.removeEventListener("pointermove", onMove)
      deck.removeEventListener("pointerup", onUp)
      deck.removeEventListener("pointercancel", onUp)
      ro.disconnect()
      mq.removeEventListener("change", onMq)
      ctx.revert()
      gsap.killTweensOf(cards.current.filter(Boolean))
    }
  }, [n, stories])

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") api.current.next()
    else if (e.key === "ArrowUp" || e.key === "ArrowLeft") api.current.prev()
    else return
    e.preventDefault()
  }

  if (n === 0) return null
  const pad = (v: number) => (v < 10 ? "0" + v : String(v))

  return (
    <div className={"ssc-root" + (className ? " " + className : "")} style={{ height }} tabIndex={0} onKeyDown={onKey} role="region" aria-roledescription="carousel" aria-label="Story stack">
      <style>{CSS}</style>
      <div className="ssc-bg" aria-hidden="true" />
      <div className="ssc-copy">
        <span className="ssc-eyebrow">The weekend pile</span>
        <h2 className="ssc-h">{heading}</h2>
        <p className="ssc-p">{intro}</p>
        <div className="ssc-ctl">
          <button type="button" className="ssc-btn" onClick={() => api.current.prev()} aria-label="Previous story">
            <Icon d="M12 19V5M6 11l6-6 6 6" />
            Back
          </button>
          <button type="button" className="ssc-btn ssc-solid" onClick={() => api.current.next()} aria-label="Next story">
            Next
            <Icon d="M12 5v14M6 13l6 6 6-6" />
          </button>
          <span className="ssc-count" aria-live="polite">
            {pad(front + 1)} / {pad(n)}
          </span>
        </div>
      </div>
      <div ref={deckRef} className="ssc-deck">
        <div className="ssc-halo" aria-hidden="true">
          <img key={front} src={stories[front].image} alt="" />
        </div>
        {stories.map((s, i) => (
          <div
            key={i}
            ref={(el) => {
              cards.current[i] = el
            }}
            className="ssc-card"
            style={{ opacity: 0 }}
          >
            <div className="ssc-ph">
              <img src={s.image} alt={s.alt ?? ""} draggable={false} />
              {s.kicker ? <span className="ssc-kick">{s.kicker}</span> : null}
            </div>
            <div className="ssc-body">
              <b className="ssc-t">{s.title}</b>
              <div className="ssc-row">
                <span className="ssc-by">
                  {s.curator ? <span className="ssc-av">{initials(s.curator)}</span> : null}
                  <span>
                    {s.curator ? (
                      <>
                        Picked by <b>{s.curator}</b>
                      </>
                    ) : null}
                    {s.length ? <span style={{ display: "block" }}>{s.length}</span> : null}
                  </span>
                </span>
                <a className="ssc-read" href={s.href ?? "#"} tabIndex={i === front ? 0 : -1}>
                  {readLabel}
                  <Icon d="M5 12h14M13 6l6 6-6 6" />
                </a>
              </div>
            </div>
            <i
              className="ssc-dim"
              ref={(el) => {
                dims.current[i] = el
              }}
            />
          </div>
        ))}
        <span className="ssc-hint" aria-hidden="true">
          <i /> Drag down
        </span>
      </div>
    </div>
  )
}
