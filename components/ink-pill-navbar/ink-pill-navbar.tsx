"use client"

import * as React from "react"
import gsap from "gsap"

// A floating navbar with an ink pill that follows the pointer. The pill is a
// clipped layer of ink with an inverted copy of the labels inside it, so text
// flips colour exactly where the ink passes. Its two edges move on separate
// springs: the leading edge darts ahead and the trailing one catches up, so the
// pill stretches as it travels and settles with a soft wobble. Each label rolls
// its letters as the pill arrives.

export type InkNavItem = { label: string; href?: string }

export type InkPillNavbarProps = {
  items: InkNavItem[]
  /** Logo or wordmark on the left. */
  brand?: React.ReactNode
  /** Button on the right. */
  cta?: { label: string; href?: string }
  /** Index of the current page; gets a small dot. */
  current?: number
  accent?: string
  className?: string
  onNavigate?: (item: InkNavItem, index: number) => void
}

// #region ink
export type Box = { left: number; width: number }

/** Clip insets that show only the span from `l` to `r` across a row `total` wide. */
export function clipFor(l: number, r: number, total: number): string {
  const a = Math.max(0, l)
  const b = Math.max(0, total - r)
  return "inset(0px " + b.toFixed(2) + "px 0px " + a.toFixed(2) + "px round 999px)"
}

/** Edge timings: the edge on the side you're heading leads, the other trails. */
export function edgeTimes(from: Box | null, to: Box): { left: number; right: number } {
  if (!from) return { left: 0.42, right: 0.42 }
  const right = to.left > from.left
  return right ? { left: 0.72, right: 0.36 } : { left: 0.36, right: 0.72 }
}

/** Easing per edge: the leader darts out, the trailer holds back then overshoots into place. */
export function edgeEase(duration: number): string {
  return duration > 0.5 ? "back.inOut(1.3)" : "power3.out"
}

/** Letters of a label with their stagger index; spaces stay spaces. */
export function letters(label: string): { ch: string; i: number }[] {
  return Array.from(label).map((ch, i) => ({ ch: ch === " " ? " " : ch, i }))
}
// #endregion

const FONT =
  "@font-face{font-family:ipn-sans;font-style:normal;font-weight:400 700;font-display:swap;src:url(data:font/woff2;base64,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) format('woff2')}"

const CSS =
  FONT +
  ".ipn-root{display:flex;justify-content:center;width:100%;font-family:ipn-sans,ui-sans-serif,system-ui,sans-serif;container-type:inline-size}" +
  ".ipn-bar{display:flex;align-items:center;gap:6px;padding:6px;border-radius:999px;background:var(--color-background);color:var(--color-foreground);box-shadow:0 0 0 1px color-mix(in oklab,var(--color-foreground) 8%,transparent),inset 0 1px 0 color-mix(in oklab,var(--color-background) 60%,white),0 2px 4px -2px rgba(0,0,0,.12),0 16px 40px -18px rgba(0,0,0,.35);animation:ipn-in .9s cubic-bezier(.22,1,.36,1) both}" +
  "@keyframes ipn-in{from{opacity:0;transform:translateY(-12px) scale(.96)}to{opacity:1;transform:none}}" +
  ".ipn-brand{display:grid;place-items:center;flex:none;height:40px;min-width:40px;padding:0 10px;border-radius:999px;font-weight:700;font-size:15px;letter-spacing:-.02em}" +
  ".ipn-row{position:relative}" +
  ".ipn-list{display:flex;margin:0;padding:0;list-style:none}" +
  ".ipn-ink{position:absolute;inset:0;pointer-events:none;background:var(--color-foreground);color:var(--color-background);clip-path:inset(0px 50% 0px 50% round 999px);will-change:clip-path}" +
  ".ipn-ink .ipn-link{color:inherit}" +
  ".ipn-link{position:relative;display:flex;align-items:center;height:40px;padding:0 16px;border-radius:999px;color:inherit;font-size:15px;font-weight:500;letter-spacing:-.01em;text-decoration:none;white-space:nowrap;outline:none}" +
  ".ipn-link:focus-visible{box-shadow:inset 0 0 0 2px var(--ipn-accent)}" +
  ".ipn-word{display:flex;overflow:hidden;height:1.2em;line-height:1.2em}" +
  ".ipn-ch{display:block;transition:transform .55s cubic-bezier(.65,0,.2,1) calc(var(--c) * 16ms)}" +
  ".ipn-ch>span{display:block}" +
  ".ipn-list>[data-hot]>.ipn-link .ipn-ch{transform:translateY(-100%)}" +
  ".ipn-dot{position:absolute;left:50%;bottom:5px;width:4px;height:4px;margin-left:-2px;border-radius:999px;background:var(--ipn-accent)}" +
  ".ipn-cta{position:relative;display:flex;align-items:center;gap:8px;flex:none;height:40px;padding:0 8px 0 18px;margin-left:4px;border-radius:999px;background:var(--ipn-accent);color:#fff;font-size:15px;font-weight:600;letter-spacing:-.01em;text-decoration:none;overflow:hidden;isolation:isolate;box-shadow:inset 0 1px 0 rgba(255,255,255,.28),0 8px 18px -8px var(--ipn-accent);transition:transform .3s cubic-bezier(.22,1,.36,1)}" +
  ".ipn-cta::before{content:'';position:absolute;inset:0;z-index:-1;background:var(--color-foreground);border-radius:inherit;transform:translateY(135%) rotate(-6deg) scale(1.25);transition:transform .55s cubic-bezier(.65,0,.2,1)}" +
  ".ipn-cta:hover::before,.ipn-cta:focus-visible::before{transform:none}" +
  ".ipn-cta:hover{color:var(--color-background)}" +
  ".ipn-cta:active{transform:scale(.96)}" +
  ".ipn-cta:focus-visible{outline:2px solid var(--ipn-accent);outline-offset:2px}" +
  ".ipn-arrow{display:grid;place-items:center;width:28px;height:28px;border-radius:999px;background:rgba(255,255,255,.22);transition:transform .55s cubic-bezier(.65,0,.2,1),background .4s}" +
  ".ipn-cta:hover .ipn-arrow{transform:rotate(-45deg);background:var(--ipn-accent);color:#fff}" +
  ".ipn-cta svg{width:14px;height:14px}" +
  "@container (max-width:620px){.ipn-cta{display:none}.ipn-link{padding:0 11px;font-size:14px}.ipn-brand{padding:0 6px}}" +
  "@container (max-width:380px){.ipn-link{padding:0 8px;font-size:13px}}" +
  "@media (prefers-reduced-motion:reduce){.ipn-bar{animation:none}.ipn-ch,.ipn-cta::before,.ipn-arrow{transition-duration:.01ms!important;transition-delay:0s!important}}"

function Word({ label }: { label: string }) {
  return (
    <span className="ipn-word" aria-hidden="true">
      {letters(label).map(({ ch, i }) => (
        <span key={i} className="ipn-ch" style={{ ["--c" as string]: i }}>
          <span>{ch}</span>
          <span>{ch}</span>
        </span>
      ))}
    </span>
  )
}

export default function InkPillNavbar({ items, brand, cta, current = -1, accent = "#ff4d2e", className, onNavigate }: InkPillNavbarProps) {
  const [hot, setHot] = React.useState(-1)
  const row = React.useRef(null as HTMLDivElement | null)
  const ink = React.useRef(null as HTMLDivElement | null)
  const links = React.useRef([] as (HTMLAnchorElement | null)[])
  const boxes = React.useRef([] as Box[])
  const total = React.useRef(0)
  const edge = React.useRef({ l: 0, r: 0 })
  const last = React.useRef(null as Box | null)
  const reduced = React.useRef(false)

  // Positions are measured on mount, on resize and after fonts load; the pointer
  // handlers and the tween only ever read these cached numbers.
  React.useEffect(() => {
    const measure = () => {
      boxes.current = links.current.map((a) => (a ? { left: a.offsetLeft, width: a.offsetWidth } : { left: 0, width: 0 }))
      total.current = row.current?.offsetWidth ?? 0
    }
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const onMq = () => (reduced.current = mq.matches)
    onMq()
    mq.addEventListener("change", onMq)
    const ro = new ResizeObserver(measure)
    if (row.current) ro.observe(row.current)
    measure()
    document.fonts?.ready.then(measure)
    return () => {
      ro.disconnect()
      mq.removeEventListener("change", onMq)
      gsap.killTweensOf(edge.current)
    }
  }, [items.length])

  const paint = () => {
    if (ink.current) ink.current.style.clipPath = clipFor(edge.current.l, edge.current.r, total.current)
  }

  const moveTo = (i: number) => {
    const to = boxes.current[i]
    if (!to) return
    setHot(i)
    const e = edge.current
    const from = last.current
    if (!from) {
      // Arriving from outside: grow out of the item's centre.
      e.l = e.r = to.left + to.width / 2
    }
    gsap.killTweensOf(e)
    if (reduced.current) {
      e.l = to.left
      e.r = to.left + to.width
      paint()
    } else {
      const t = edgeTimes(from, to)
      const first = !from
      gsap.to(e, { l: to.left, duration: t.left, ease: first ? "back.out(1.6)" : edgeEase(t.left), onUpdate: paint })
      gsap.to(e, { r: to.left + to.width, duration: t.right, ease: first ? "back.out(1.6)" : edgeEase(t.right), onUpdate: paint })
    }
    last.current = to
  }

  const leave = () => {
    setHot(-1)
    const to = last.current
    last.current = null
    if (!to) return
    const e = edge.current
    const mid = to.left + to.width / 2
    gsap.killTweensOf(e)
    if (reduced.current) {
      e.l = e.r = mid
      paint()
      return
    }
    gsap.to(e, { l: mid, r: mid, duration: 0.4, ease: "power3.in", onUpdate: paint })
  }

  // A press squashes the pill for a beat.
  const press = () => {
    if (reduced.current || !ink.current) return
    gsap.fromTo(ink.current, { scaleY: 0.86 }, { scaleY: 1, duration: 0.6, ease: "elastic.out(1,0.45)" })
  }

  const list = (inked: boolean) => (
    <ul className="ipn-list" role={inked ? "presentation" : undefined}>
      {items.map((it, i) => (
        <li key={it.label + i} data-hot={hot === i ? "" : undefined}>
          {inked ? (
            <span className="ipn-link">
              <Word label={it.label} />
            </span>
          ) : (
            <a
              ref={(el) => {
                links.current[i] = el
              }}
              className="ipn-link"
              href={it.href ?? "#"}
              aria-current={current === i ? "page" : undefined}
              aria-label={it.label}
              onPointerEnter={() => moveTo(i)}
              onFocus={() => moveTo(i)}
              onBlur={leave}
              onPointerDown={press}
              onClick={(e) => {
                if (!it.href) e.preventDefault()
                onNavigate?.(it, i)
              }}
            >
              <Word label={it.label} />
              {current === i ? <span className="ipn-dot" aria-hidden="true" /> : null}
            </a>
          )}
        </li>
      ))}
    </ul>
  )

  return (
    <nav className={"ipn-root" + (className ? " " + className : "")} style={{ ["--ipn-accent" as string]: accent }} aria-label="Main">
      <style>{CSS}</style>
      <div className="ipn-bar">
        {brand ? <div className="ipn-brand">{brand}</div> : null}
        <div ref={row} className="ipn-row" onPointerLeave={leave}>
          {list(false)}
          <div ref={ink} className="ipn-ink" aria-hidden="true">
            {list(true)}
          </div>
        </div>
        {cta ? (
          <a className="ipn-cta" href={cta.href ?? "#"}>
            {cta.label}
            <span className="ipn-arrow" aria-hidden="true">
              <svg viewBox="0 0 14 14">
                <path d="M3 7h8M7.5 3.5 11 7l-3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </a>
        ) : null}
      </div>
    </nav>
  )
}
