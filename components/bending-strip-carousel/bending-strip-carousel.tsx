"use client"

import * as React from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

// A strip of narrow project panels that scrolls sideways as the page scrolls down.
// At rest it lies flat; the faster you scroll, the harder it bends round into a
// drum, the panels turning and sinking away from the middle. The centred panel
// takes its colour back. Click any panel and it opens out into a project view.

export type StripProject = {
  title: string
  /** Photo URL. Tall portrait crops read best in the strip. */
  image: string
  alt?: string
  client?: string
  year?: string
  role?: string
  /** One or two lines for the open view. */
  summary?: string
  href?: string
}

export type BendingStripCarouselProps = {
  projects: StripProject[]
  /** Wordmark, top left. */
  brand?: React.ReactNode
  /** Small line, bottom left. */
  note?: React.ReactNode
  /** How far the strip bends at full scroll speed. 0 keeps it flat. */
  bend?: number
  /** Page scroll per project, as a fraction of `height`. */
  scrollPerProject?: number
  background?: string
  ink?: string
  accent?: string
  /** Stage height. Keep it a definite length; percentages collapse once installed. */
  height?: string
  className?: string
  onOpen?: (project: StripProject, index: number) => void
}

// #region strip
/** Panel width and height in px for a stage of w × h. */
export function panelSize(w: number, h: number): [number, number] {
  const pw = w < 640 ? Math.max(48, w * 0.15) : Math.min(120, Math.max(60, w * 0.068))
  return [Math.round(pw), Math.round(Math.min(h * 0.5, pw * 3.9))]
}

/** Transform for a panel `d` slots from the centre, with the strip bent by `b` (-1..1, signed by direction). */
export function panelPose(d: number, step: number, b: number): { x: number; z: number; ry: number; y: number; sy: number } {
  const a = Math.abs(b)
  const ry = Math.max(-72, Math.min(72, -d * a * 9))
  return {
    x: d * step * (1 - a * 0.08 * Math.min(4, Math.abs(d)) / 4),
    z: -Math.min(1100, d * d * a * 30),
    ry,
    y: Math.sin(d * 0.45) * b * 14,
    sy: 1 + a * 0.1,
  }
}

/** Smooths a raw scroll-speed reading into a bend amount in -1..1. */
export function bendFor(velocityPxPerS: number, strength: number): number {
  const v = (velocityPxPerS / 2600) * strength
  return Math.max(-1, Math.min(1, v))
}

/** The page offset (px, from the track start) that centres project i of n. */
export function scrollFor(i: number, n: number, start: number, end: number): number {
  if (n <= 1) return start
  return start + (Math.max(0, Math.min(n - 1, i)) / (n - 1)) * (end - start)
}

/** Clip-path inset for a w × h stage that shows only the rectangle (x, y, rw, rh). */
export function insetFor(w: number, h: number, x: number, y: number, rw: number, rh: number, r: number): string {
  const px = (v: number) => Math.max(0, Math.round(v)) + "px"
  return "inset(" + px(y) + " " + px(w - x - rw) + " " + px(h - y - rh) + " " + px(x) + " round " + r + "px)"
}

/** Signed slot distance of panel i from position s on a loop of m panels, the short way round. */
export function loopOffset(i: number, s: number, m: number): number {
  if (m <= 0) return 0
  return ((((i - s + m / 2) % m) + m) % m) - m / 2
}

/** How many copies of the projects the strip needs so its loop never shows a gap. */
export function copiesFor(n: number): number {
  return n <= 0 ? 0 : Math.max(2, Math.ceil(24 / n))
}

export function pad2(n: number): string {
  return n < 10 ? "0" + n : String(n)
}
// #endregion

const FONT =
  "@font-face{font-family:BSC Serif;font-style:italic;font-weight:400;font-display:swap;" +
  "src:url(data:font/woff2;base64,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) format('woff2')}"

const CSS =
  FONT +
  ".bsc-track{position:relative;width:100%}" +
  ".bsc-stage{position:sticky;top:0;overflow:hidden;isolation:isolate;color:var(--bsc-ink);font-family:ui-sans-serif,system-ui,sans-serif;outline:none}" +
  ".bsc-stage:focus-visible{box-shadow:inset 0 0 0 2px var(--bsc-accent)}" +
  ".bsc-vig{position:absolute;inset:0;pointer-events:none;background:radial-gradient(70% 60% at 50% 50%,transparent 40%,rgba(0,0,0,.55))}" +
  ".bsc-floor{position:absolute;left:0;right:0;top:50%;height:50%;pointer-events:none;background:linear-gradient(180deg,transparent,rgba(255,255,255,.02) 40%,transparent)}" +
  ".bsc-strip{position:absolute;left:50%;top:50%;width:0;height:0;perspective:1100px;transform-style:preserve-3d}" +
  ".bsc-panel{position:absolute;left:0;top:0;padding:0;border:0;margin:0;cursor:pointer;border-radius:4px;overflow:hidden;background:#1d1b19;will-change:transform;transform-origin:50% 50%;" +
  "box-shadow:0 30px 60px -30px rgba(0,0,0,.9),inset 0 0 0 1px rgba(255,255,255,.06)}" +
  ".bsc-panel>img{position:absolute;inset:0;width:100%;height:100%;max-width:none;object-fit:cover;filter:grayscale(1) contrast(1.05) brightness(.72);transition:filter .7s ease,transform .9s cubic-bezier(.2,.8,.2,1);pointer-events:none}" +
  ".bsc-panel::after{content:'';position:absolute;inset:0;background:linear-gradient(100deg,rgba(255,255,255,.14),transparent 35%,transparent 70%,rgba(0,0,0,.35));pointer-events:none}" +
  ".bsc-panel:hover>img,.bsc-panel.bsc-on>img{filter:none}" +
  ".bsc-panel:hover>img{transform:scale(1.06)}" +
  ".bsc-panel:focus-visible{outline:2px solid var(--bsc-accent);outline-offset:3px}" +
  ".bsc-top{position:absolute;left:clamp(20px,3.4vw,44px);right:clamp(20px,3.4vw,44px);top:clamp(18px,3vw,34px);display:flex;align-items:center;justify-content:space-between;gap:16px;font-size:11px;letter-spacing:.2em;text-transform:uppercase}" +
  ".bsc-brand{font-family:var(--bsc-font);font-style:italic;font-size:26px;letter-spacing:-.01em;text-transform:none}" +
  ".bsc-ruler{display:flex;gap:4px;align-items:flex-end;height:14px}" +
  ".bsc-ruler>i{display:block;width:1px;height:8px;background:currentColor;opacity:.28;transition:height .4s cubic-bezier(.3,1.5,.5,1),opacity .4s ease}" +
  ".bsc-ruler>i.bsc-on{height:14px;opacity:1;background:var(--bsc-accent)}" +
  ".bsc-top a,.bsc-top span{opacity:.7}" +
  ".bsc-foot{position:absolute;left:clamp(20px,3.4vw,44px);right:clamp(20px,3.4vw,44px);bottom:clamp(20px,3.4vw,38px);display:flex;align-items:flex-end;justify-content:space-between;gap:24px;pointer-events:none}" +
  ".bsc-note{font-size:11px;line-height:1.6;letter-spacing:.16em;text-transform:uppercase;opacity:.6;max-width:28ch}" +
  ".bsc-now{text-align:right}" +
  ".bsc-now b{display:block;font-family:var(--bsc-font);font-style:italic;font-weight:400;font-size:clamp(30px,4.2vw,58px);line-height:1;letter-spacing:-.01em;overflow:hidden;padding-bottom:.08em}" +
  ".bsc-now b>span{display:inline-block;animation:bsc-rise .8s cubic-bezier(.2,.9,.1,1) both}" +
  ".bsc-now small{display:block;margin-top:8px;font-size:11px;letter-spacing:.2em;text-transform:uppercase;opacity:.6;font-variant-numeric:tabular-nums}" +
  ".bsc-now small em{font-style:normal;color:var(--bsc-accent);opacity:1}" +
  ".bsc-hint{position:absolute;left:50%;bottom:clamp(86px,12vh,130px);transform:translateX(-50%);font-size:10px;letter-spacing:.3em;text-transform:uppercase;opacity:.45;pointer-events:none;transition:opacity .6s ease}" +
  ".bsc-view{position:absolute;inset:0;z-index:5;background:#0b0a09;will-change:clip-path}" +
  ".bsc-pic{position:absolute;top:0;right:0;bottom:0;width:56%;overflow:hidden}" +
  ".bsc-pic>img{position:absolute;inset:0;width:100%;height:100%;max-width:none;object-fit:cover;transform-origin:50% 50%}" +
  ".bsc-shade{position:absolute;inset:0;background:linear-gradient(90deg,#0b0a09,rgba(11,10,9,0) 30%),linear-gradient(0deg,rgba(11,10,9,.55),transparent 35%)}" +
  ".bsc-body{position:absolute;left:clamp(20px,5vw,72px);bottom:clamp(28px,7vh,80px);width:min(620px,52%);color:#f4efe7}" +
  ".bsc-body>*{opacity:0;transform:translateY(18px)}" +
  ".bsc-body h3{margin:0;font-family:var(--bsc-font);font-style:italic;font-weight:400;font-size:clamp(48px,8vw,120px);line-height:.9;letter-spacing:-.02em}" +
  ".bsc-body p{margin:18px 0 0;font-size:15px;line-height:1.6;opacity:.78;max-width:46ch}" +
  ".bsc-meta{display:flex;flex-wrap:wrap;gap:10px 34px;margin-top:26px;font-size:11px;letter-spacing:.18em;text-transform:uppercase}" +
  ".bsc-meta dt{opacity:.5;margin-bottom:6px}.bsc-meta dd{margin:0}" +
  ".bsc-cta{display:inline-flex;align-items:center;gap:10px;margin-top:28px;padding:13px 20px;border-radius:999px;background:var(--bsc-accent);color:#120f0c;font-size:12px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;text-decoration:none;white-space:nowrap;box-shadow:0 14px 30px -12px var(--bsc-accent);transition:transform .35s cubic-bezier(.3,1.6,.5,1),box-shadow .35s ease}" +
  ".bsc-cta:hover{transform:translateY(-2px);box-shadow:0 20px 38px -12px var(--bsc-accent)}" +
  ".bsc-cta:focus-visible,.bsc-x:focus-visible,.bsc-nav button:focus-visible{outline:2px solid #f4efe7;outline-offset:3px}" +
  ".bsc-x{position:absolute;top:clamp(16px,3vw,30px);right:clamp(16px,3vw,30px);z-index:2;display:flex;align-items:center;gap:10px;padding:10px 16px 10px 12px;border-radius:999px;border:1px solid rgba(255,255,255,.18);background:rgba(20,18,16,.5);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);color:#f4efe7;font-size:11px;letter-spacing:.2em;text-transform:uppercase;cursor:pointer;opacity:0;transition:background .3s ease,transform .35s cubic-bezier(.3,1.6,.5,1)}" +
  ".bsc-x:hover{background:rgba(40,36,32,.7);transform:scale(1.04)}" +
  ".bsc-x svg{width:16px;height:16px}" +
  ".bsc-nav{position:absolute;right:clamp(16px,3vw,30px);bottom:clamp(28px,7vh,80px);display:flex;gap:8px;opacity:0}" +
  ".bsc-nav button{width:44px;height:44px;border-radius:999px;border:1px solid rgba(255,255,255,.2);background:rgba(20,18,16,.45);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);color:#f4efe7;display:grid;place-items:center;cursor:pointer;transition:transform .35s cubic-bezier(.3,1.6,.5,1),background .3s ease}" +
  ".bsc-nav button:hover{transform:translateY(-2px);background:rgba(40,36,32,.7)}" +
  ".bsc-nav svg{width:16px;height:16px}" +
  "@keyframes bsc-rise{from{transform:translateY(105%)}to{transform:none}}" +
  "@media (max-width:640px){.bsc-pic{width:100%}.bsc-shade{background:linear-gradient(0deg,#0b0a09 30%,rgba(11,10,9,.2) 70%)}.bsc-body{width:auto;right:20px}.bsc-ruler{display:none}.bsc-foot{flex-direction:column;align-items:flex-start}.bsc-now{text-align:left}.bsc-nav{bottom:auto;top:72px}}" +
  "@media (prefers-reduced-motion:reduce){.bsc-panel>img,.bsc-ruler>i,.bsc-cta,.bsc-x,.bsc-nav button{transition:none}.bsc-now b>span{animation:none}}"

const Arrow = ({ flip }: { flip?: boolean }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={flip ? { transform: "scaleX(-1)" } : undefined}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
)

export default function BendingStripCarousel({
  projects,
  brand = "Northwall",
  note = "Selected work, 2019 — 2026",
  bend = 1,
  scrollPerProject = 0.22,
  background = "#121110",
  ink = "#ece6dc",
  accent = "#d4643f",
  height = "100svh",
  className,
  onOpen,
}: BendingStripCarouselProps) {
  const n = projects.length
  const trackRef = React.useRef(null as HTMLDivElement | null)
  const stageRef = React.useRef(null as HTMLDivElement | null)
  const panels = React.useRef([] as (HTMLButtonElement | null)[])
  const viewRef = React.useRef(null as HTMLDivElement | null)
  const [active, setActive] = React.useState(0)
  const [open, setOpen] = React.useState(-1)
  const [moved, setMoved] = React.useState(false)
  const st = React.useRef(null as ScrollTrigger | null)
  // Numbers the frame loop and the open view read: measured on resize only.
  const geo = React.useRef({ W: 1, H: 1, pw: 1, ph: 1, step: 1, s: 0 })
  const reduced = React.useRef(false)
  const shownRef = React.useRef(-1)
  const onOpenRef = React.useRef(onOpen)
  onOpenRef.current = onOpen

  React.useEffect(() => {
    const track = trackRef.current
    const stage = stageRef.current
    if (!track || !stage || n === 0) return
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    reduced.current = mq.matches
    const g = geo.current
    let target = 0, s = 0, b = 0, vel = 0, raf = 0, last = 0, cur = -1, t0 = -1, intro = mq.matches ? 2 : 0, visible = true

    const resize = (w: number, h: number) => {
      g.W = Math.max(1, w)
      g.H = Math.max(1, h)
      ;[g.pw, g.ph] = panelSize(g.W, g.H)
      g.step = g.pw + Math.max(8, g.pw * 0.16)
      for (const el of panels.current) {
        if (!el) continue
        el.style.width = g.pw + "px"
        el.style.height = g.ph + "px"
        el.style.marginLeft = -g.pw / 2 + "px"
        el.style.marginTop = -g.ph / 2 + "px"
      }
      kick()
    }

    const frame = (now: number) => {
      raf = 0
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60
      last = now
      if (t0 < 0) t0 = now
      if (intro < 2) intro = Math.min(2, (now - t0) / 900)
      if (reduced.current) {
        s = target
        b = 0
      } else {
        s += (target - s) * (1 - Math.exp(-dt * 9))
        b += (bendFor(vel, bend) - b) * (1 - Math.exp(-dt * 6))
        vel *= Math.exp(-dt * 7)
      }
      g.s = s
      const half = g.W / 2 + g.step * 2
      const m = n * copiesFor(n)
      for (let i = 0; i < m; i++) {
        const el = panels.current[i]
        if (!el) continue
        const d = loopOffset(i, s, m)
        const p = panelPose(d, g.step, b)
        if (Math.abs(p.x) > half) {
          el.style.visibility = "hidden"
          continue
        }
        const k = Math.max(0, Math.min(1, (intro - Math.abs(d) * 0.06) / 0.9))
        const e = 1 - Math.pow(1 - k, 4)
        el.style.visibility = "visible"
        el.style.opacity = String(e)
        el.style.transform =
          "translate3d(" + p.x.toFixed(2) + "px," + (p.y + (1 - e) * g.ph * 0.35).toFixed(2) + "px," + p.z.toFixed(1) + "px) rotateY(" + p.ry.toFixed(2) + "deg) scaleY(" + (p.sy * (0.6 + 0.4 * e)).toFixed(4) + ")"
      }
      const idx = ((Math.round(s) % n) + n) % n
      if (idx !== cur) {
        cur = idx
        setActive(idx)
      }
      const busy = Math.abs(target - s) > 0.0005 || Math.abs(b) > 0.002 || Math.abs(vel) > 1 || intro < 2
      if (busy && visible) raf = requestAnimationFrame(frame)
      else last = 0
    }
    function kick() {
      if (!raf && visible) raf = requestAnimationFrame(frame)
    }

    const trigger = ScrollTrigger.create({
      trigger: track,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        target = self.progress * (n - 1)
        vel = self.getVelocity()
        if (self.progress > 0.002) setMoved(true)
        kick()
      },
    })
    st.current = trigger

    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect
      resize(r.width, r.height)
    })
    ro.observe(stage)
    const io = new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting
      kick()
    })
    io.observe(stage)
    const onMq = () => {
      reduced.current = mq.matches
      kick()
    }
    mq.addEventListener("change", onMq)

    return () => {
      cancelAnimationFrame(raf)
      trigger.kill()
      st.current = null
      ro.disconnect()
      io.disconnect()
      mq.removeEventListener("change", onMq)
    }
  }, [n, bend])

  const goTo = React.useCallback(
    (i: number) => {
      const t = st.current
      if (!t) return
      window.scrollTo({ top: scrollFor(i, n, t.start, t.end), behavior: reduced.current ? "auto" : "smooth" })
    },
    [n]
  )

  // Open view: grow out of the panel's spot, worked out from the cached geometry.
  const fromRect = (i: number) => {
    const g = geo.current
    const x = g.W / 2 + (i - g.s) * g.step - g.pw / 2
    return insetFor(g.W, g.H, x, g.H / 2 - g.ph / 2, g.pw, g.ph, 4)
  }

  React.useLayoutEffect(() => {
    const view = viewRef.current
    if (open < 0 || !view) return
    const parts = view.querySelectorAll(".bsc-body>*, .bsc-x, .bsc-nav")
    const img = view.querySelector(".bsc-pic>img")
    if (reduced.current) {
      gsap.set(view, { clipPath: "inset(0px 0px 0px 0px round 0px)" })
      gsap.fromTo(view, { opacity: 0 }, { opacity: 1, duration: 0.25 })
      gsap.set(parts, { opacity: 1, y: 0 })
      return
    }
    const tl = gsap.timeline()
    const swap = shownRef.current >= 0
    shownRef.current = open
    if (swap) {
      tl.fromTo(img, { opacity: 0, scale: 1.08 }, { opacity: 1, scale: 1, duration: 0.9, ease: "expo.out" })
      tl.fromTo(parts, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.05, ease: "power3.out" }, 0.1)
      return () => {
        tl.kill()
      }
    }
    tl.fromTo(view, { clipPath: fromRect(open) }, { clipPath: "inset(0px 0px 0px 0px round 0px)", duration: 1, ease: "expo.inOut" })
    tl.fromTo(img, { scale: 1.35, filter: "grayscale(1)" }, { scale: 1, filter: "grayscale(0)", duration: 1.3, ease: "expo.out" }, 0.1)
    tl.to(parts, { opacity: 1, y: 0, duration: 0.8, stagger: 0.07, ease: "power3.out" }, 0.55)
    return () => {
      tl.kill()
    }
    // fromRect reads the cached geometry ref only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const close = React.useCallback(() => {
    const view = viewRef.current
    if (!view || reduced.current) {
      shownRef.current = -1
      return setOpen(-1)
    }
    const i = open
    gsap.to(view.querySelectorAll(".bsc-body>*, .bsc-x, .bsc-nav"), { opacity: 0, y: 10, duration: 0.25, ease: "power2.in" })
    gsap.to(view, {
      clipPath: fromRect(i),
      duration: 0.8,
      ease: "expo.inOut",
      delay: 0.12,
      onComplete: () => {
        shownRef.current = -1
        setOpen(-1)
      },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const show = (i: number) => {
    const k = ((i % n) + n) % n
    setOpen(k)
    onOpenRef.current?.(projects[k], k)
  }

  const onKey = (e: React.KeyboardEvent) => {
    if (open >= 0) {
      if (e.key === "Escape") close()
      else if (e.key === "ArrowRight") setOpen((o) => (o + 1) % n)
      else if (e.key === "ArrowLeft") setOpen((o) => (o - 1 + n) % n)
      else return
    } else if (e.key === "ArrowRight") goTo(active + 1)
    else if (e.key === "ArrowLeft") goTo(active - 1)
    else return
    e.preventDefault()
  }

  if (n === 0) return null
  const p = projects[active]
  const o = open >= 0 ? projects[open] : null
  const trackH = "calc(" + height + " * " + (1 + (n - 1) * scrollPerProject).toFixed(3) + ")"
  const vars = { height, background, "--bsc-ink": ink, "--bsc-accent": accent, "--bsc-font": "BSC Serif, ui-serif, Georgia, serif" } as React.CSSProperties

  return (
    <div ref={trackRef} className={"bsc-track" + (className ? " " + className : "")} style={{ height: trackH }}>
      <style>{CSS}</style>
      <div ref={stageRef} className="bsc-stage" style={vars} tabIndex={0} onKeyDown={onKey} role="region" aria-roledescription="carousel" aria-label="Projects">
        <div className="bsc-floor" aria-hidden="true" />
        <div className="bsc-strip">
          {Array.from({ length: n * copiesFor(n) }, (_, i) => projects[i % n]).map((pr, i) => (
            <button
              key={i}
              ref={(el) => {
                panels.current[i] = el
              }}
              type="button"
              className={"bsc-panel" + (i % n === active ? " bsc-on" : "")}
              style={{ visibility: "hidden" }}
              aria-label={"Open " + pr.title}
              tabIndex={i < n ? 0 : -1}
              aria-hidden={i < n ? undefined : true}
              onClick={() => show(i % n)}
            >
              <img src={pr.image} alt={pr.alt ?? ""} draggable={false} />
            </button>
          ))}
        </div>
        <div className="bsc-vig" aria-hidden="true" />
        <header className="bsc-top">
          <span className="bsc-brand">{brand}</span>
          <span className="bsc-ruler" aria-hidden="true">
            {projects.map((_, i) => (
              <i key={i} className={i === active ? "bsc-on" : undefined} />
            ))}
          </span>
          <span>{pad2(n)} projects</span>
        </header>
        <div className="bsc-hint" style={{ opacity: moved ? 0 : 0.45 }} aria-hidden="true">
          Scroll to bend · click to open
        </div>
        <footer className="bsc-foot">
          <span className="bsc-note">{note}</span>
          <span className="bsc-now" aria-live="polite">
            <b>
              <span key={active}>{p.title}</span>
            </b>
            <small>
              <em>{pad2(active + 1)}</em> / {pad2(n)} {p.client ? " · " + p.client : ""}
            </small>
          </span>
        </footer>
        {o ? (
          <div ref={viewRef} className="bsc-view" role="dialog" aria-modal="false" aria-label={o.title}>
            <div className="bsc-pic">
              <img src={o.image} alt={o.alt ?? ""} />
              <div className="bsc-shade" />
            </div>
            <button type="button" className="bsc-x" onClick={close} autoFocus>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
              Close
            </button>
            <div className="bsc-body" key={open}>
              <small style={{ display: "block", fontSize: 11, letterSpacing: ".22em", textTransform: "uppercase", opacity: 0.6, marginBottom: 14 }}>
                Project {pad2(open + 1)} / {pad2(n)}
              </small>
              <h3>{o.title}</h3>
              {o.summary ? <p>{o.summary}</p> : null}
              <dl className="bsc-meta">
                {o.client ? (<div><dt>Client</dt><dd>{o.client}</dd></div>) : null}
                {o.year ? (<div><dt>Year</dt><dd>{o.year}</dd></div>) : null}
                {o.role ? (<div><dt>Role</dt><dd>{o.role}</dd></div>) : null}
              </dl>
              {o.href ? (
                <a className="bsc-cta" href={o.href}>
                  View case study <Arrow />
                </a>
              ) : null}
            </div>
            <div className="bsc-nav">
              <button type="button" aria-label="Previous project" onClick={() => show(open - 1)}>
                <Arrow flip />
              </button>
              <button type="button" aria-label="Next project" onClick={() => show(open + 1)}>
                <Arrow />
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
