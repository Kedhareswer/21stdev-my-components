"use client"

import * as React from "react"

/**
 * Infinite Shot Stack: a selected-work gallery for a studio or portfolio. Shots stand in a
 * deck that recedes up the screen, each one smaller, darker and higher than the one in front,
 * until only their top edges show. Scroll, drag, swipe, the arrow keys or the buttons cycle
 * the deck forever: the front shot falls away and the next one comes forward on a spring.
 * A rotating "View case" badge follows the pointer over the front shot, and the caption
 * underneath names the work.
 */

// #region deck
export function issWrap(i: number, n: number) {
  return ((i % n) + n) % n
}

/** Depth of item i when the deck sits at position p: 0 is the front, 1 the next behind, -1..0 leaving. */
export function issDepth(i: number, p: number, n: number) {
  let d = issWrap(i - p, n)
  if (d > n - 1) d -= n
  return d
}

/**
 * Where a shot sits at depth d, as fractions of the stage: top edge (y), scale, how dark,
 * and how visible. The deck recedes upward with each gap a little smaller than the last.
 */
export function issPose(d: number, visible: number, gap = 0.06, shrink = 0.84, fall = 0.85) {
  if (d < 0) {
    const t = Math.min(1, -d)
    return { y: t * fall, scale: 1 + t * 0.06, dim: 0, alpha: 1 - t }
  }
  const scale = Math.pow(shrink, d)
  const y = (gap * (Math.pow(0.8, d) - 1)) / 0.2
  const dim = 1 - Math.pow(0.74, d)
  const alpha = d > visible - 1 ? Math.max(0, visible - d) : 1
  return { y, scale, dim, alpha }
}

/** One spring step toward the target, frame-rate independent. */
export function issStep(p: number, target: number, dt: number, stiffness = 7) {
  const k = 1 - Math.exp(-dt * stiffness)
  const next = p + (target - p) * k
  return Math.abs(target - next) < 0.0006 ? target : next
}

/** Where a drag or flick lets go: rounded to a whole shot, carried a little by velocity. */
export function issSettle(target: number, velocity: number) {
  return Math.round(target + Math.max(-1.5, Math.min(1.5, velocity * 0.25)))
}

export function issPad(i: number) {
  return String(i).padStart(2, "0")
}
// #endregion

const PHOTO = (id: string) => "https://images.unsplash.com/" + id + "?auto=format&fit=crop&w=1600&h=1000&q=80"

const DEFAULT_ITEMS = [
  { image: PHOTO("photo-1784407051790-ad22ec93c24b"), title: "Petal", client: "Petal Florists", year: "2026", tags: ["iOS app", "Ordering"], alt: "A phone showing a sculptural orange app screen on a dark surface" },
  { image: PHOTO("photo-1618005198919-d3d4b5a92ead"), title: "Lumen", client: "Lumen Bank", year: "2026", tags: ["Brand", "3D"], alt: "Soft pastel spheres floating on a lilac gradient" },
  { image: PHOTO("photo-1670589953882-b94c9cb380f5"), title: "Casa Verano", client: "Verano Estates", year: "2025", tags: ["Web", "Real estate"], alt: "A modern white house with a long pool and glass walls" },
  { image: PHOTO("photo-1781606989061-420b8dda8a17"), title: "Fieldnotes", client: "Fieldnotes Magazine", year: "2025", tags: ["Editorial", "Web"], alt: "A tablet showing a magazine website with photo cards" },
  { image: PHOTO("photo-1650943574955-ac02c65cfc71"), title: "Tidal", client: "Tidal Energy", year: "2025", tags: ["Motion", "Identity"], alt: "A spiral of thin blue blades with glowing teal edges" },
  { image: PHOTO("photo-1766445318570-1dc4bf3f5d79"), title: "Grain", client: "Grain Joinery", year: "2024", tags: ["Brand", "Interiors"], alt: "A curved wooden ceiling lit with warm light" },
  { image: PHOTO("photo-1783194588870-c00c3b134780"), title: "Ember", client: "Ember Audio", year: "2024", tags: ["Product", "Android"], alt: "A phone with a red screen resting inside a white torus" },
  { image: PHOTO("photo-1467232004584-a241de8bcf5d"), title: "Northlight", client: "Northlight Studio", year: "2024", tags: ["Desktop", "Tools"], alt: "A desk at night with an iMac, a second monitor and a lamp" },
  { image: PHOTO("photo-1777503810337-e78757a41278"), title: "Kinship", client: "Kinship Community", year: "2023", tags: ["Platform", "Illustration"], alt: "A tablet showing a playful community app among 3D shapes" },
]

export default function InfiniteShotStack({
  items = DEFAULT_ITEMS,
  brand = "halden",
  tagline = "",
  links = [],
  visible = 6,
  badge = "View case",
  mode = "pin",
  autoPlay = 0,
  theme = "dark",
  height = "100svh",
  onSelect,
  className,
}: InfiniteShotStackProps) {
  const uid = "iss" + React.useId().replace(/[^a-zA-Z0-9]/g, "")
  const n = items.length
  const rootRef = React.useRef(null as HTMLElement | null)
  const frameRef = React.useRef(null as HTMLDivElement | null)
  const stageRef = React.useRef(null as HTMLDivElement | null)
  const cardRefs = React.useRef([] as (HTMLElement | null)[])
  const badgeRef = React.useRef(null as HTMLDivElement | null)
  const st = React.useRef({ p: 0, target: 0, raf: 0, last: 0, drag: null as null | { y: number; t: number; target: number; vy: number; moved: boolean }, axis: "y", wheelT: 0, w: 0, h: 0 })
  const [active, setActive] = React.useState(0)
  const [reduced, setReduced] = React.useState(false)
  const [hover, setHover] = React.useState(false)
  const [focusIn, setFocusIn] = React.useState(false)
  const [onScreen, setOnScreen] = React.useState(true)
  const [dark, setDark] = React.useState(theme !== "light")

  React.useEffect(() => {
    if (theme !== "system") {
      setDark(theme === "dark")
      return
    }
    const mq = matchMedia("(prefers-color-scheme: dark)")
    const read = () => {
      const el = document.documentElement
      if (el.classList.contains("dark")) return setDark(true)
      if (el.classList.contains("light")) return setDark(false)
      setDark(mq.matches)
    }
    read()
    const mo = new MutationObserver(read)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    mq.addEventListener("change", read)
    return () => {
      mo.disconnect()
      mq.removeEventListener("change", read)
    }
  }, [theme])

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const read = () => setReduced(mq.matches)
    read()
    mq.addEventListener("change", read)
    return () => mq.removeEventListener("change", read)
  }, [])

  // Lay every shot out for the current position. Transforms only; React hears about the front changing.
  const paint = React.useCallback(() => {
    const s = st.current
    const stage = stageRef.current
    if (!stage) return
    const H = s.h || stage.clientHeight
    const top0 = H * 0.25
    cardRefs.current.forEach((el, i) => {
      if (!el) return
      const d = issDepth(i, s.p, n)
      if (d >= visible || d <= -1) {
        el.style.visibility = "hidden"
        return
      }
      const pose = issPose(d, visible)
      el.style.visibility = "visible"
      el.style.transform = "translate3d(-50%," + (top0 + pose.y * H).toFixed(1) + "px,0) scale(" + pose.scale.toFixed(4) + ")"
      el.style.opacity = pose.alpha.toFixed(3)
      el.style.zIndex = String(1000 - Math.round(d * 100))
      el.style.setProperty("--iss-dim", pose.dim.toFixed(3))
    })
    const front = issWrap(Math.round(s.p), n)
    setActive((a) => (a === front ? a : front))
  }, [n, visible])

  const kick = React.useCallback(() => {
    const s = st.current
    if (s.raf) return
    s.last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - s.last) / 1000)
      s.last = now
      s.p = reduced ? s.target : issStep(s.p, s.target, dt)
      paint()
      s.raf = s.p === s.target && !s.drag ? 0 : requestAnimationFrame(tick)
    }
    s.raf = requestAnimationFrame(tick)
  }, [paint, reduced])

  const go = React.useCallback(
    (step: number) => {
      const s = st.current
      const root = rootRef.current
      const frame = frameRef.current
      if (mode === "pin" && root && frame) {
        // Pinned: the page scroll is the source of truth, so move the page by whole shots.
        const run = root.offsetHeight - frame.clientHeight
        const top = root.getBoundingClientRect().top + window.scrollY
        const at = Math.round(s.target) + step
        const y = top + Math.max(0, Math.min(run, (at / n) * run)) + 1
        window.scrollTo({ top: y, behavior: reduced ? "auto" : "smooth" })
        return
      }
      s.target = Math.round(s.target) + step
      kick()
    },
    [kick, mode, n, reduced],
  )

  // Pinned: page scroll through the run walks the deck once round; scroll back and it walks back.
  React.useEffect(() => {
    if (mode !== "pin") return
    const root = rootRef.current
    const frame = frameRef.current
    if (!root || !frame) return
    const s = st.current
    let raf = 0
    const read = () => {
      raf = 0
      const r = root.getBoundingClientRect()
      const run = root.offsetHeight - frame.clientHeight
      const prog = run > 0 ? Math.max(0, Math.min(1, -r.top / run)) : 0
      s.target = prog * n
      kick()
    }
    const on = () => {
      if (!raf) raf = requestAnimationFrame(read)
    }
    read()
    window.addEventListener("scroll", on, { passive: true })
    window.addEventListener("resize", on)
    return () => {
      window.removeEventListener("scroll", on)
      window.removeEventListener("resize", on)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [mode, n, kick])

  React.useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const s = st.current
    const ro = new ResizeObserver(() => {
      s.w = stage.clientWidth
      s.h = stage.clientHeight
      paint()
    })
    ro.observe(stage)
    const io = new IntersectionObserver((e) => setOnScreen(!!e[0] && e[0].isIntersecting))
    io.observe(stage)
    return () => {
      ro.disconnect()
      io.disconnect()
      if (s.raf) cancelAnimationFrame(s.raf)
      s.raf = 0
    }
  }, [paint])

  // Wheel and trackpad: only while the pointer is over the deck, and only when asked to.
  React.useEffect(() => {
    const stage = stageRef.current
    if (!stage || mode !== "wheel") return
    const s = st.current
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) < Math.abs(e.deltaX) * 0.6) return
      e.preventDefault()
      const px = e.deltaMode === 1 ? e.deltaY * 32 : e.deltaY
      s.target += Math.max(-0.6, Math.min(0.6, px * 0.0024))
      kick()
      window.clearTimeout(s.wheelT)
      s.wheelT = window.setTimeout(() => {
        s.target = Math.round(s.target)
        kick()
      }, 140)
    }
    stage.addEventListener("wheel", onWheel, { passive: false })
    return () => stage.removeEventListener("wheel", onWheel)
  }, [mode, kick])

  // Autoplay: one shot at a time, never while someone is looking closely.
  React.useEffect(() => {
    if (!autoPlay || mode === "pin" || reduced || hover || focusIn || !onScreen || n < 2) return
    const t = window.setInterval(() => go(1), autoPlay)
    return () => window.clearInterval(t)
  }, [autoPlay, mode, reduced, hover, focusIn, onScreen, n, go])

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 || mode === "pin") return
    const s = st.current
    // Touch drags sideways so the page can still scroll vertically; a mouse drags up and down like the deck.
    s.axis = e.pointerType === "mouse" ? "y" : "x"
    s.drag = { y: s.axis === "y" ? e.clientY : e.clientX, t: performance.now(), target: s.target, vy: 0, moved: false }
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const s = st.current
    const stage = stageRef.current
    if (badgeRef.current && stage && e.pointerType === "mouse") {
      const r = stage.getBoundingClientRect()
      badgeRef.current.style.transform = "translate3d(" + (e.clientX - r.left).toFixed(0) + "px," + (e.clientY - r.top).toFixed(0) + "px,0)"
    }
    if (!s.drag) return
    const H = s.h || 600
    const dy = s.drag.y - (s.axis === "y" ? e.clientY : e.clientX)
    if (!s.drag.moved && Math.abs(dy) > 6) {
      // Capture only once it is a real drag, so a plain click still reaches the shot under it.
      s.drag.moved = true
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    }
    const now = performance.now()
    const next = s.drag.target + dy / (H * 0.32)
    const dt = Math.max(1, now - s.drag.t) / 1000
    s.drag.vy = (next - s.target) / dt
    s.drag.t = now
    s.target = next
    if (reduced) s.p = next
    kick()
  }
  const onPointerUp = () => {
    const s = st.current
    if (!s.drag) return
    const moved = s.drag.moved
    s.target = issSettle(s.target, moved ? s.drag.vy : 0)
    s.drag = null
    kick()
    if (!moved) return
    // A drag is not a click on the front shot.
    const stop = (ev: Event) => {
      ev.preventDefault()
      ev.stopPropagation()
    }
    window.addEventListener("click", stop, { capture: true, once: true })
    window.setTimeout(() => window.removeEventListener("click", stop, { capture: true }), 0)
  }

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowRight" || e.key === "PageDown") (e.preventDefault(), go(1))
    if (e.key === "ArrowUp" || e.key === "ArrowLeft" || e.key === "PageUp") (e.preventDefault(), go(-1))
  }

  const openFront = (e: React.MouseEvent, i: number) => {
    const item = items[i]
    if (i !== active) {
      e.preventDefault()
      const d = issDepth(i, st.current.p, n)
      go(Math.round(d))
      return
    }
    if (onSelect) {
      e.preventDefault()
      onSelect(item, i)
    } else if (!item.href) e.preventDefault()
  }

  const cur = items[active] || items[0]
  const badgeChars = (badge.toUpperCase() + " · ").repeat(2)

  return (
    <section
      ref={rootRef}
      className={"iss-root" + (className ? " " + className : "")}
      data-theme={dark ? "dark" : "light"}
      data-mode={mode}
      data-reduced={reduced ? "1" : "0"}
      style={{ ["--iss-h" as string]: height, ["--iss-n" as string]: String(n) }}
      aria-roledescription="carousel"
      aria-label={"Selected work by " + brand}
      onFocus={() => setFocusIn(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setFocusIn(false)
      }}
    >
      <style>{ISS_CSS}</style>
      <div ref={frameRef} className="iss-frame">
      {tagline || links.length ? (
        <header className="iss-top">
          {tagline ? <p className="iss-tagline">{tagline}</p> : <span />}
          {links.length ? (
            <nav aria-label={brand + " links"}>
              {links.map((l, i) => (
                <React.Fragment key={i}>
                  {i > 0 ? <span aria-hidden="true">/</span> : null}
                  <a href={l.href}>{l.label}</a>
                </React.Fragment>
              ))}
            </nav>
          ) : null}
        </header>
      ) : null}

      <p className="iss-wordmark" aria-hidden="true">
        {brand}
      </p>

      <div
        ref={stageRef}
        className="iss-stage"
        tabIndex={0}
        aria-label="Shots. Use the arrow keys to move through them."
        onKeyDown={onKey}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerEnter={() => setHover(true)}
        onPointerLeave={() => setHover(false)}
      >
        {items.map((item, i) => {
          const front = i === active
          return (
            <a
              key={i}
              ref={(el) => {
                cardRefs.current[i] = el
              }}
              className="iss-card"
              href={item.href || undefined}
              data-front={front ? "1" : "0"}
              tabIndex={front ? 0 : -1}
              aria-hidden={!front}
              aria-label={front ? item.title + ", " + item.client + ", " + item.year : undefined}
              onClick={(e) => openFront(e, i)}
              onKeyDown={(e) => {
                // Without an href a link ignores Enter; hand it to onSelect instead.
                if (e.key === "Enter" && !item.href && onSelect && front) onSelect(item, i)
              }}
              draggable={false}
            >
              <img src={item.image} alt={item.alt || ""} draggable={false} loading={i < visible + 1 ? "eager" : "lazy"} decoding="async" />
              <span className="iss-shade" aria-hidden="true" />
            </a>
          )
        })}
        <div ref={badgeRef} className="iss-badge" data-on={hover ? "1" : "0"} aria-hidden="true">
          <svg viewBox="-60 -60 120 120" width="120" height="120">
            <defs>
              <path id={uid + "-ring"} d="M0 -42A42 42 0 1 1 -0.01 -42" />
            </defs>
            <circle r="56" className="iss-badge-disc" />
            <g className="iss-badge-spin">
              <text className="iss-badge-text">
                <textPath href={"#" + uid + "-ring"}>{badgeChars}</textPath>
              </text>
            </g>
            <path d="M-8 8L8 -8M-4 -8H8V4" className="iss-badge-arrow" />
          </svg>
        </div>
      </div>

      <footer className="iss-bottom">
        <p className="iss-count" aria-hidden="true">
          {issPad(active + 1)} <span>/ {issPad(n)}</span>
        </p>
        <div className="iss-caption" aria-live="polite">
          <p className="iss-title">{cur.title}</p>
          <p className="iss-meta">
            {cur.client} {"·"} {cur.year}
          </p>
          {cur.tags && cur.tags.length ? (
            <ul className="iss-tags">
              {cur.tags.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="iss-controls">
          <span className="iss-hint">{mode === "buttons" ? "Drag or use the arrows" : mode === "wheel" ? "Scroll or drag" : "Keep scrolling"}</span>
          <button type="button" onClick={() => go(-1)} aria-label="Previous shot">
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M8 13V3M3.5 7.5L8 3L12.5 7.5" stroke="currentColor" strokeWidth="1.6" fill="none" />
            </svg>
          </button>
          <button type="button" onClick={() => go(1)} aria-label="Next shot">
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M8 3V13M3.5 8.5L8 13L12.5 8.5" stroke="currentColor" strokeWidth="1.6" fill="none" />
            </svg>
          </button>
        </div>
      </footer>
      </div>
    </section>
  )
}

const ISS_CSS = `
.iss-root{--iss-bg:#050505;--iss-fg:#f2f0ec;--iss-muted:#8f8b85;--iss-word:rgba(255,255,255,.055);--iss-shade:#000;--iss-ease:cubic-bezier(.16,1,.3,1);--iss-sans:"Inter","Helvetica Neue",Helvetica,Arial,system-ui,sans-serif;position:relative;background:var(--iss-bg);color:var(--iss-fg);font-family:var(--iss-sans);isolation:isolate;color-scheme:dark}
.iss-root[data-mode="pin"]{height:calc(var(--iss-h) + var(--iss-n) * 42vh)}
.iss-frame{position:relative;height:var(--iss-h);min-height:560px;overflow:hidden}
.iss-root[data-mode="pin"] .iss-frame{position:sticky;top:0}
.iss-root[data-theme="light"]{--iss-bg:#efede8;--iss-fg:#121110;--iss-muted:#6d6a65;--iss-word:rgba(0,0,0,.055);--iss-shade:#efede8;color-scheme:light}
.iss-root *,.iss-root *::before,.iss-root *::after{box-sizing:border-box}
.iss-root img,.iss-root svg,.iss-root canvas{max-width:none}
.iss-root :where(p,ul){margin:0;padding:0}
.iss-root :where(ul){list-style:none}
.iss-root :where(button){font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer}
.iss-root a{color:inherit;text-decoration:none}
.iss-root :where(a,button,[tabindex]):focus-visible{outline:2px solid var(--iss-fg);outline-offset:4px}
.iss-top{position:absolute;left:0;right:0;top:0;z-index:2000;display:flex;justify-content:space-between;align-items:flex-start;gap:24px;padding:22px clamp(18px,2.4vw,32px);pointer-events:none}
.iss-top>*{pointer-events:auto}
.iss-tagline{max-width:15ch;font-size:clamp(15px,1.3vw,19px);line-height:1.2;letter-spacing:-.01em}
.iss-top nav{display:flex;gap:10px;font-size:clamp(14px,1.2vw,18px);color:var(--iss-fg)}
.iss-top nav span{color:var(--iss-muted)}
.iss-top nav a{transition:opacity .2s ease}
.iss-top nav a:hover{opacity:.6}
.iss-wordmark{position:absolute;left:50%;bottom:-.16em;transform:translateX(-50%);z-index:0;font-weight:500;font-size:clamp(120px,25vw,420px);line-height:1;letter-spacing:-.06em;color:var(--iss-word);white-space:nowrap;pointer-events:none;user-select:none}
.iss-stage{position:absolute;inset:0;z-index:1;cursor:grab;touch-action:pan-y;outline:none}
.iss-stage:active{cursor:grabbing}
.iss-root[data-mode="pin"] .iss-stage{cursor:default}
.iss-stage:focus-visible{outline:2px solid var(--iss-fg);outline-offset:-6px}
.iss-card{position:absolute;left:50%;top:0;width:min(58vw,calc(var(--iss-h) * .52 * 1.6),940px);aspect-ratio:16/10;transform-origin:50% 0;will-change:transform,opacity;user-select:none;-webkit-user-drag:none;border-radius:2px;overflow:hidden;box-shadow:0 -1px 0 rgba(255,255,255,.06),0 30px 60px rgba(0,0,0,.35)}
.iss-root[data-theme="light"] .iss-card{box-shadow:0 30px 60px rgba(0,0,0,.14)}
.iss-card img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;max-width:none;pointer-events:none}
.iss-shade{position:absolute;inset:0;background:var(--iss-shade);opacity:var(--iss-dim,0);pointer-events:none}
.iss-card[data-front="1"]{cursor:none}
.iss-card[data-front="0"]{cursor:pointer}
.iss-badge{position:absolute;left:0;top:0;z-index:1500;width:120px;height:120px;margin:-60px 0 0 -60px;pointer-events:none;opacity:0;scale:.4;transition:opacity .25s ease,scale .35s var(--iss-ease)}
.iss-badge[data-on="1"]{opacity:1;scale:1}
.iss-stage:not(:has(.iss-card[data-front="1"]:hover)) .iss-badge{opacity:0;scale:.4}
.iss-badge-disc{fill:var(--iss-fg)}
.iss-badge-text{font-size:11px;font-weight:600;letter-spacing:.18em;fill:var(--iss-bg)}
.iss-badge-arrow{stroke:var(--iss-bg);stroke-width:2.2;fill:none;stroke-linecap:round;stroke-linejoin:round}
.iss-badge-spin{animation:iss-spin 9s linear infinite;transform-origin:0 0}
@keyframes iss-spin{to{transform:rotate(360deg)}}
.iss-bottom{position:absolute;left:0;right:0;bottom:0;z-index:2000;display:grid;grid-template-columns:auto 1fr auto;align-items:end;gap:24px;padding:22px clamp(18px,2.4vw,32px);pointer-events:none;background:linear-gradient(0deg,color-mix(in srgb,var(--iss-bg) 75%,transparent),transparent)}
.iss-bottom>*{pointer-events:auto}
.iss-count{font-size:clamp(28px,3vw,44px);font-weight:500;letter-spacing:-.04em;line-height:1;font-variant-numeric:tabular-nums}
.iss-count span{color:var(--iss-muted)}
.iss-caption{display:grid;gap:4px;justify-self:center;text-align:center}
.iss-title{font-size:clamp(18px,1.6vw,24px);font-weight:600;letter-spacing:-.02em}
.iss-meta{font-size:14px;color:var(--iss-muted)}
.iss-tags{display:flex;gap:6px;justify-content:center;margin-top:6px}
.iss-tags li{padding:4px 10px;border-radius:999px;border:1px solid color-mix(in srgb,var(--iss-fg) 22%,transparent);font-size:12px}
.iss-controls{display:flex;align-items:center;gap:8px}
.iss-hint{font-size:13px;color:var(--iss-muted);margin-right:6px}
.iss-controls button{width:44px;height:44px;display:grid;place-items:center;border-radius:50%;border:1px solid color-mix(in srgb,var(--iss-fg) 25%,transparent);transition:background-color .2s ease,transform .16s ease}
.iss-controls button:hover{background:color-mix(in srgb,var(--iss-fg) 12%,transparent)}
.iss-controls button:active{transform:scale(.92)}
@media (max-width:760px){
.iss-card{width:min(88vw,calc(var(--iss-h) * .44 * 1.6))}
.iss-top nav{display:none}
.iss-bottom{grid-template-columns:1fr auto;gap:14px}
.iss-caption{grid-column:1/-1;grid-row:1;justify-self:start;text-align:left}
.iss-tags{justify-content:flex-start}
.iss-hint{display:none}
.iss-badge{display:none}
.iss-card[data-front="1"]{cursor:pointer}
}
@media (hover:none){
.iss-badge{display:none}
.iss-card[data-front="1"]{cursor:pointer}
}
@media (prefers-reduced-motion:reduce){
.iss-badge-spin{animation:none}
.iss-badge{transition:none}
}
`

// Declared after the JSX: the 21st CLI tokenizer hangs on generics before it.
export type IssItem = {
  image: string
  alt?: string
  title: string
  client: string
  year: string
  tags?: string[]
  /** Where the front shot links. */
  href?: string
}
export type InfiniteShotStackProps = {
  items?: IssItem[]
  /** The big faint word behind the deck, and the label for screen readers. */
  brand?: string
  /** Optional line top left; empty hides it. */
  tagline?: string
  /** Optional links top right; empty hides them. */
  links?: { label: string; href: string }[]
  /** How many shots stand in the deck at once. */
  visible?: number
  /** The word on the rotating badge over the front shot. */
  badge?: string
  /**
   * "pin" (default): the section pins and page scroll walks the deck once round, then lets go.
   * "wheel": the wheel and trackpad drive the deck while the pointer is over it, forever (best as a full page).
   * "buttons": only drag, swipe, arrow keys and the buttons.
   */
  mode?: "pin" | "wheel" | "buttons"
  /** Milliseconds per shot; 0 is off. Pauses on hover, focus and off screen. */
  autoPlay?: number
  theme?: "dark" | "light" | "system"
  /** The visible frame's height. A definite length. Pinned, the section scrolls for about 0.42 viewports per shot beyond it. */
  height?: string
  /** Called when the front shot is clicked; without it the shot's href is followed. */
  onSelect?: (item: IssItem, index: number) => void
  className?: string
}
