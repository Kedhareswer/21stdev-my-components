"use client"

import * as React from "react"

/**
 * Sketch City Hero — a travel landing hero on warm paper. A header with a
 * logo mark, a "Cities" dropdown, a dotted divider and a second link, then a
 * two-line grotesque headline, a stats line whose numbers count up in coral,
 * and a serif blurb. Behind it a hand-drawn panorama of mixed world cities
 * bleeds off the right and bottom edges, drawn as two layers: pale mint
 * skyline silhouettes at the back and the inked streets in front.
 *
 * Motion: the headline rises word by word, the stats count up, the streets
 * ink in from left to right with the skyline a beat behind, and the skyline
 * drifts and follows the pointer and the scroll a little more than the
 * streets do. All of it stops under prefers-reduced-motion.
 *
 * Self-contained: React is the only import. Pictures come from the catalog
 * site. The drawings were generated with ChatGPT.
 */

export interface SketchCityStat {
  value: number
  label: string
}

export interface SketchCityHeroProps {
  brand?: string
  /** The dropdown in the header and its entries. */
  menuLabel?: string
  menuItems?: string[]
  /** The plain link after the dotted divider. */
  linkLabel?: string
  linkHref?: string
  /** Two lines. */
  headline?: [string, string]
  stats?: SketchCityStat[]
  /** Word after the last stat, e.g. "places." */
  blurb?: string
  /** Numbers, chevron and details. */
  accent?: string
  /** Must be a definite length: percentages collapse on a page with no height chain. */
  height?: string
  /** Where skyline.webp and streets.webp live. */
  imageBase?: string
  /** Google Fonts stylesheet, or null to bring your own. */
  fontHref?: string | null
  className?: string
}

const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,600&family=Newsreader:opsz,wght@6..72,400&display=swap"

const IMG_BASE = "https://kedhar-components.pages.dev/sketch-city-hero/"

const DEFAULT_MENU = ["Lisbon", "Kyoto", "Mexico City", "Istanbul", "Marrakech", "Prague"]
const DEFAULT_STATS: SketchCityStat[] = [
  { value: 18, label: "Cities" },
  { value: 24, label: "Itineraries" },
  { value: 5312, label: "places" },
]

// #region layout
/** The drawing is 1536 x 1024. */
export const ART_W = 1536
export const ART_H = 1024
/** Below this stage width the copy stacks above the drawing. */
export const STACK_BELOW = 720

/**
 * The drawing's skyline: the topmost drawn pixel (of 1024) in each of 48
 * equal columns, measured from the two layers together. Everything above it
 * is open sky, which is where the copy may sit.
 */
export const SKY = [
  649, 645, 655, 635, 646, 643, 633, 641, 650, 646, 648, 622, 650, 644, 638, 634, 623, 631, 599, 586, 574, 569, 551, 537,
  493, 454, 450, 413, 402, 371, 341, 325, 305, 266, 235, 179, 205, 105, 12, 54, 124, 125, 71, 170, 107, 88, 83, 79,
]

export interface Rect {
  l: number
  t: number
  r: number
  b: number
}

/** True when no text rect (plus clearance) reaches below the skyline of a drawing placed at x, y, scale s. */
export function clearOfText(x: number, y: number, s: number, text: Rect[], pad: number) {
  const col = (ART_W / SKY.length) * s
  for (const t of text) {
    const i0 = Math.max(0, Math.floor((t.l - pad - x) / col))
    const i1 = Math.min(SKY.length - 1, Math.floor((t.r + pad - x) / col))
    for (let i = i0; i <= i1; i++) if (y + SKY[i] * s < t.b + pad) return false
  }
  return true
}

/**
 * Where the drawing sits inside its stage (all in CSS px).
 *
 * Stacked (narrow), it fills the stage height, spires and all, and shows
 * the streets right of centre; the copy is above it in the flow.
 *
 * Wide, it sits on the bottom edge and bleeds off the right. Of every scale
 * and rightward bleed that keeps all the copy in open sky (with pad px of
 * clearance) and crops at most a sliver off the tallest spire, it takes the
 * one that shows the most drawing.
 */
export function artBox(stageW: number, stageH: number, stacked: boolean, text: Rect[] = [], pad = 16) {
  if (stacked) {
    const s = stageH / (ART_H * 0.97)
    const w = ART_W * s
    return { s, w, h: ART_H * s, x: Math.min(0, stageW * 0.5 - w * 0.62), y: stageH - ART_H * s }
  }
  const sHi = Math.min((stageH * 1.04) / ART_H, (stageW * 1.12) / ART_W)
  const sLo = (stageH * 0.42) / ART_H
  let best = { s: sLo, w: ART_W * sLo, h: ART_H * sLo, x: stageW - ART_W * sLo, y: stageH - ART_H * sLo }
  let bestArea = -1
  for (let s = sHi; s >= sLo; s -= 0.005) {
    const w = ART_W * s
    const h = ART_H * s
    const y = stageH - h
    if (y < -0.05 * h) continue
    for (let bleed = 0; bleed <= w * 0.45; bleed += 4) {
      const x = stageW - w + bleed
      if (!clearOfText(x, y, s, text, pad)) continue
      const area = (Math.min(stageW, x + w) - Math.max(0, x)) * (stageH - Math.max(0, y))
      if (area > bestArea + 1) {
        bestArea = area
        best = { s, w, h, x, y }
      }
      break // more bleed only shows less
    }
  }
  return best
}

/** Count-up curve: ease-out cubic, clamped. */
export function countAt(target: number, t: number) {
  const k = Math.min(Math.max(t, 0), 1)
  return Math.round(target * (1 - Math.pow(1 - k, 3)))
}

/**
 * Layer offsets in CSS px. The skyline may move at most 13 drawing px against
 * the streets (that is how far it is painted underneath them), so every
 * offset is scaled by the drawing's scale.
 */
export function layerOffsets(px: number, py: number, scroll: number, t: number, s: number) {
  const k = Math.min(s, 1)
  const drift = Math.sin(t / 2200) * 2.5
  return {
    sky: { x: (-px * 7 + drift) * k, y: (-py * 3 + scroll * 7) * k },
    street: { x: -px * 2.5 * k, y: -py * 1.5 * k },
  }
}
// #endregion layout

const fmt = (n: number) => n.toLocaleString("en-US")

const css = [
  ".sch-root{--sch-paper:#faf3eb;--sch-bar:#ffffff;--sch-ink:#2b3033;--sch-soft:#4a4f52;--sch-line:rgba(43,48,51,.14);--sch-gutter:max(20px,6%,calc((100% - 1180px) / 2));container-type:size;container-name:sch;position:relative;width:100%;overflow:hidden;display:flex;flex-direction:column;background:var(--sch-paper);color:var(--sch-ink);font-family:'Newsreader',Georgia,'Times New Roman',serif;isolation:isolate}",
  ".dark .sch-root{--sch-paper:#110a02;--sch-bar:#1a1510;--sch-ink:#efe8de;--sch-soft:#cfc6ba;--sch-line:rgba(239,232,222,.16)}",
  ".sch-root *{box-sizing:border-box}",
  ".sch-root button{font:inherit;color:inherit;background:none;border:0;padding:0;margin:0;cursor:pointer}",
  ".sch-root a{color:inherit;text-decoration:none}",
  ".sch-root img{max-width:none;display:block;user-select:none;-webkit-user-drag:none}",
  ".sch-bar{position:relative;z-index:20;flex:none;height:80px;display:flex;align-items:center;gap:16px;padding:0 var(--sch-gutter);background:var(--sch-bar);box-shadow:0 1px 0 var(--sch-line),0 8px 18px -14px rgba(0,0,0,.28);font-family:'Bricolage Grotesque',ui-sans-serif,system-ui,sans-serif}",
  ".sch-brand{display:flex;align-items:center;gap:9px;font-family:'Newsreader',Georgia,serif;font-size:25px;line-height:1;letter-spacing:-.01em;white-space:nowrap}",
  ".sch-brand svg{width:30px;height:30px;flex:none}",
  ".sch-nav{display:flex;align-items:center;margin-left:clamp(28px,6%,76px);font-size:15px;font-weight:500;letter-spacing:.005em}",
  ".sch-drop{position:relative}",
  ".sch-navbtn{display:flex;align-items:center;gap:10px;height:40px;padding:0 4px;border-radius:8px}",
  ".sch-navbtn svg{width:11px;height:11px;transition:transform .3s cubic-bezier(.2,.7,.2,1)}",
  ".sch-navbtn[aria-expanded=true] svg{transform:rotate(180deg)}",
  ".sch-divider{width:0;height:28px;border-left:2px dotted var(--sch-line);margin:0 26px}",
  ".sch-navlink{display:flex;align-items:center;height:40px;padding:0 4px;border-radius:8px}",
  ".sch-navbtn:focus-visible,.sch-navlink:focus-visible,.sch-icon:focus-visible,.sch-panel a:focus-visible{outline:2px solid var(--sch-accent);outline-offset:2px}",
  ".sch-navlink:hover,.sch-navbtn:hover{color:var(--sch-accent)}",
  ".sch-icons{margin-left:auto;display:flex;align-items:center;gap:6px}",
  ".sch-icon{width:36px;height:36px;display:grid;place-items:center;border-radius:999px;transition:background-color .2s}",
  ".sch-icon:hover{background:var(--sch-line)}",
  ".sch-icon svg{width:19px;height:19px}",
  ".sch-icon[aria-pressed=true] svg path{fill:var(--sch-accent);stroke:var(--sch-accent)}",
  ".sch-panel{position:absolute;top:calc(100% + 10px);z-index:30;min-width:220px;padding:8px;border-radius:14px;background:var(--sch-bar);box-shadow:0 0 0 1px var(--sch-line),0 18px 40px -18px rgba(0,0,0,.35);opacity:0;transform:translateY(-6px);pointer-events:none;transition:opacity .22s ease,transform .3s cubic-bezier(.2,.7,.2,1)}",
  ".sch-panel[data-open=true]{opacity:1;transform:translateY(0);pointer-events:auto}",
  ".sch-drop .sch-panel{left:-8px}",
  ".sch-menu{position:relative}",
  ".sch-menu .sch-panel{right:0}",
  ".sch-panel a{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:9px;font-size:15px;font-weight:500;white-space:nowrap}",
  ".sch-panel a:hover{background:var(--sch-line)}",
  ".sch-panel a i{width:6px;height:6px;border-radius:99px;background:var(--sch-accent);flex:none}",
  ".sch-panel hr{border:0;border-top:2px dotted var(--sch-line);margin:6px 10px}",
  ".sch-body{position:relative;flex:1;min-height:0;display:flex;flex-direction:column}",
  ".sch-stage{position:absolute;inset:0;z-index:0;overflow:hidden;pointer-events:none}",
  ".sch-art{position:absolute;left:0;top:0;-webkit-mask-image:linear-gradient(to right,transparent 0,#000 9%);mask-image:linear-gradient(to right,transparent 0,#000 9%)}",
  ".dark .sch-art{filter:invert(1) hue-rotate(180deg)}",
  ".sch-layer{position:absolute;inset:0}",
  ".sch-layer img{position:absolute;inset:0}",
  // both layers ink in left to right behind a soft edge; the mint wash trails the
  // streets by 0.75 s so its hidden under-fill is never seen ahead of them
  ".sch-layer img{-webkit-mask-image:linear-gradient(to right,#000 40%,transparent 60%);mask-image:linear-gradient(to right,#000 40%,transparent 60%);-webkit-mask-size:260% 100%;mask-size:260% 100%;-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;-webkit-mask-position:0 0;mask-position:0 0}",
  ".sch-ink img{animation:sch-ink 1.7s cubic-bezier(.45,.05,.25,1) .1s both}",
  ".sch-sky img{animation:sch-ink 1.7s cubic-bezier(.45,.05,.25,1) .85s both}",
  ".sch-root:not([data-ready=true]) .sch-word,.sch-root:not([data-ready=true]) .sch-fade{animation-play-state:paused}",
  "@keyframes sch-ink{from{-webkit-mask-position:100% 0;mask-position:100% 0}to{-webkit-mask-position:0 0;mask-position:0 0}}",
  ".sch-copy{position:relative;z-index:1;padding:clamp(32px,min(7.5cqw,11cqh),112px) var(--sch-gutter) 32px;max-width:100%}",
  ".sch-h1{margin:0;font-family:'Bricolage Grotesque',ui-sans-serif,system-ui,sans-serif;font-weight:600;font-size:clamp(40px,min(6.2cqw,9.8cqh),96px);line-height:.98;letter-spacing:-.035em;color:var(--sch-ink)}",
  ".sch-line{display:block;overflow:hidden;padding:0 .08em .24em;margin:0 -.08em -.24em}",
  ".sch-word{display:inline-block;white-space:pre;animation:sch-rise .9s cubic-bezier(.2,.75,.15,1) both}",
  "@keyframes sch-rise{from{transform:translateY(135%)}to{transform:translateY(0)}}",
  ".sch-stats,.sch-blurb{margin:0;font-size:clamp(17px,min(1.55cqw,2.5cqh),21px);line-height:1.55;color:var(--sch-soft);max-width:27.5em}",
  ".sch-stats{margin-top:clamp(20px,min(2.4cqw,3.8cqh),34px);color:var(--sch-ink)}",
  ".sch-num{display:inline-grid;font-variant-numeric:tabular-nums lining-nums;color:var(--sch-accent)}",
  ".sch-num>span{grid-area:1/1}",
  ".sch-ghost{visibility:hidden}",
  ".sch-val{justify-self:start}",
  ".sch-fade{animation:sch-up .9s cubic-bezier(.2,.75,.15,1) both}",
  "@keyframes sch-up{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}",
  "@container sch (max-width: 719px){.sch-bar{height:64px}.sch-nav{display:none}.sch-brand{font-size:22px}.sch-stage{position:relative;inset:auto;flex:1;min-height:240px;order:2}.sch-copy{padding-top:36px;padding-bottom:24px}}",
  "@media (prefers-reduced-motion:reduce){.sch-word,.sch-fade,.sch-layer img{animation:none!important}.sch-layer img{-webkit-mask-image:none;mask-image:none}.sch-panel,.sch-navbtn svg{transition:none}}",
].join("\n")

function Mark() {
  // a folded map with a pin: original mark, drawn to match the line art
  return (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
      <path d="M4 9.5 11 7l10 3 7-2.5v15.5L21 25.5l-10-3L4 25z" />
      <path d="M11 7v15.5M21 10v15.5" />
      <path d="M16 19.5s-4-3.6-4-6.6a4 4 0 0 1 8 0c0 3-4 6.6-4 6.6z" fill="var(--sch-accent)" stroke="var(--sch-ink)" />
      <circle cx="16" cy="12.9" r="1.2" fill="var(--sch-paper)" stroke="none" />
    </svg>
  )
}

const prefersReduced = () =>
  typeof window !== "undefined" && !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches

export default function SketchCityHero({
  brand = "Kedhar's Atlas",
  menuLabel = "Cities",
  menuItems = DEFAULT_MENU,
  linkLabel = "Field Notes",
  linkHref = "#field-notes",
  headline = ["For the unhurried.", "Travel off-script."],
  stats = DEFAULT_STATS,
  blurb = "Corners Kedhareswer would send a friend to, found before the crowds catch on. Hand-picked, zero filler. Scout's honour.",
  accent = "#ee7454",
  height = "100svh",
  imageBase = IMG_BASE,
  fontHref = FONT_HREF,
  className,
}: SketchCityHeroProps) {
  const rootRef = React.useRef(null as HTMLElement | null)
  const stageRef = React.useRef(null as HTMLDivElement | null)
  const skyRef = React.useRef(null as HTMLDivElement | null)
  const streetRef = React.useRef(null as HTMLDivElement | null)
  const copyRef = React.useRef(null as HTMLDivElement | null)
  const linkRef = React.useRef(null as HTMLLinkElement | null)
  const [box, setBox] = React.useState({ s: 0, w: 0, h: 0, x: 0, y: 0 })
  const [artReady, setArtReady] = React.useState(false)
  const boxRef = React.useRef(box)
  boxRef.current = box
  const [open, setOpen] = React.useState<"" | "cities" | "menu">("")
  const [saved, setSaved] = React.useState(false)
  const [counts, setCounts] = React.useState(() => stats.map((st) => (prefersReduced() ? st.value : 0)))
  const id = React.useId().replace(/:/g, "")

  // Lay the drawing out at its on-screen size (never scaled up with transforms).
  React.useEffect(() => {
    const root = rootRef.current
    const stage = stageRef.current
    const copy = copyRef.current
    if (!root || !stage || !copy) return
    let alive = true
    // The copy's text, in stage coordinates, as laid out: the intro animations
    // translate it, so read layout offsets rather than painted boxes.
    const textRects = () => {
      const dx = copy.offsetLeft - stage.offsetLeft
      const dy = copy.offsetTop - stage.offsetTop
      const cr = copy.getBoundingClientRect()
      const rects: Rect[] = []
      copy.querySelectorAll(".sch-word").forEach((n) => {
        const w = n as HTMLElement
        const right = w.offsetLeft + w.offsetWidth - (/\s$/.test(w.textContent || "") ? w.offsetHeight * 0.25 : 0)
        rects.push({ l: w.offsetLeft + dx, t: w.offsetTop + dy, r: right + dx, b: w.offsetTop + w.offsetHeight * 0.92 + dy })
      })
      copy.querySelectorAll("p").forEach((p) => {
        const pr = p.getBoundingClientRect()
        const range = document.createRange()
        range.selectNodeContents(p)
        Array.from(range.getClientRects()).forEach((r) => {
          if (r.width < 1) return
          const t = r.top - pr.top + p.offsetTop
          rects.push({ l: r.left - cr.left + dx, t: t + dy, r: r.right - cr.left + dx, b: t + r.height + dy })
        })
      })
      return rects
    }
    const measure = () => {
      if (!alive) return
      const stacked = root.offsetWidth < STACK_BELOW
      setBox(artBox(stage.offsetWidth, stage.offsetHeight, stacked, stacked ? [] : textRects()))
    }
    measure()
    // The web fonts change the copy's width once they arrive, so the drawing
    // is only placed (and starts inking in) after that, never resized mid-intro.
    const show = () => {
      if (!alive) return
      measure()
      setArtReady(true)
    }
    const late = window.setTimeout(show, 1800)
    // fonts.ready alone can resolve before the stylesheet has even declared the
    // faces, so wait for the stylesheet, then for the two faces themselves.
    const faces = () => {
      if (!document.fonts || !document.fonts.load) return show()
      Promise.all([
        document.fonts.load("600 64px 'Bricolage Grotesque'"),
        document.fonts.load("400 20px 'Newsreader'"),
      ]).then(show, show)
    }
    const link = linkRef.current
    if (link && !link.sheet) {
      link.addEventListener("load", faces, { once: true })
      link.addEventListener("error", show, { once: true })
    } else faces()
    const ro = new ResizeObserver(measure)
    ro.observe(stage)
    ro.observe(root)
    ro.observe(copy)
    return () => {
      alive = false
      window.clearTimeout(late)
      ro.disconnect()
    }
  }, [])

  // Count the stats up once, after the headline has risen.
  React.useEffect(() => {
    if (prefersReduced() || !artReady) return
    let raf = 0
    const t0 = performance.now() + 550
    const tick = (now: number) => {
      const t = (now - t0) / 1500
      setCounts(stats.map((st) => countAt(st.value, t)))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [stats, artReady])

  // Parallax: eased pointer and scroll, skyline moving more than the streets.
  React.useEffect(() => {
    const root = rootRef.current
    if (!root || prefersReduced()) return
    let raf = 0
    let visible = true
    let last = performance.now()
    const target = { x: 0, y: 0 }
    const cur = { x: 0, y: 0, scroll: 0 }
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return
      const r = root.getBoundingClientRect()
      target.x = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width - 0.5) * 2))
      target.y = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height - 0.5) * 2))
    }
    const onLeave = () => {
      target.x = 0
      target.y = 0
    }
    const frame = (now: number) => {
      const dt = Math.min(now - last, 64)
      last = now
      const r = root.getBoundingClientRect()
      const scrollTarget = Math.max(0, Math.min(1, -r.top / Math.max(r.height, 1)))
      const ease = 1 - Math.pow(1 - 0.075, dt / 16.67)
      cur.x += (target.x - cur.x) * ease
      cur.y += (target.y - cur.y) * ease
      cur.scroll += (scrollTarget - cur.scroll) * ease
      const s = boxRef.current.s || 1
      const o = layerOffsets(cur.x, cur.y, cur.scroll, now, s)
      if (skyRef.current) skyRef.current.style.transform = "translate3d(" + o.sky.x.toFixed(2) + "px," + o.sky.y.toFixed(2) + "px,0)"
      if (streetRef.current) streetRef.current.style.transform = "translate3d(" + o.street.x.toFixed(2) + "px," + o.street.y.toFixed(2) + "px,0)"
      if (visible && !document.hidden) raf = requestAnimationFrame(frame)
      else raf = 0
    }
    const wake = () => {
      if (!raf && visible && !document.hidden) {
        last = performance.now()
        raf = requestAnimationFrame(frame)
      }
    }
    const io = new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting
      wake()
    })
    io.observe(root)
    root.addEventListener("pointermove", onMove)
    root.addEventListener("pointerleave", onLeave)
    document.addEventListener("visibilitychange", wake)
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      root.removeEventListener("pointermove", onMove)
      root.removeEventListener("pointerleave", onLeave)
      document.removeEventListener("visibilitychange", wake)
    }
  }, [])

  // Close the panels on Escape or a click elsewhere.
  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen("")
    }
    const onDown = (e: PointerEvent) => {
      const t = e.target as Element | null
      if (!t || !t.closest || !t.closest("[data-sch-pop]")) setOpen("")
    }
    document.addEventListener("keydown", onKey)
    document.addEventListener("pointerdown", onDown)
    return () => {
      document.removeEventListener("keydown", onKey)
      document.removeEventListener("pointerdown", onDown)
    }
  }, [open])

  let wordIndex = 0
  const words = headline.map((line) => line.split(/(?<= )/))
  const totalWords = words.reduce((n, l) => n + l.length, 0)
  const afterWords = 0.12 + totalWords * 0.07

  const rootStyle = { height, width: "100%", ["--sch-accent" as string]: accent } as React.CSSProperties
  const imgStyle = { width: box.w, height: box.h, maxWidth: "none" } as React.CSSProperties

  return (
    <section ref={rootRef} className={"sch-root" + (className ? " " + className : "")} style={rootStyle} data-ready={artReady} aria-label={headline.join(" ")}>
      {fontHref && <link ref={linkRef} rel="stylesheet" href={fontHref} />}
      <style>{css}</style>

      <header className="sch-bar">
        <a className="sch-brand" href="#top" aria-label={brand + ", home"}>
          <Mark />
          <span>{brand}</span>
        </a>
        <nav className="sch-nav" aria-label="Main">
          <div className="sch-drop" data-sch-pop="">
            <button
              type="button"
              className="sch-navbtn"
              aria-expanded={open === "cities"}
              aria-controls={id + "-cities"}
              onClick={() => setOpen(open === "cities" ? "" : "cities")}
            >
              {menuLabel}
              <svg viewBox="0 0 12 12" aria-hidden="true">
                <path d="M2 4.2 6 8l4-3.8" fill="none" stroke={accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div id={id + "-cities"} className="sch-panel" data-open={open === "cities"} role="menu" aria-hidden={open !== "cities"}>
              {menuItems.map((m) => (
                <a key={m} href={"#" + m.toLowerCase().replace(/\s+/g, "-")} role="menuitem" tabIndex={open === "cities" ? 0 : -1} onClick={() => setOpen("")}>
                  <i />
                  {m}
                </a>
              ))}
            </div>
          </div>
          <span className="sch-divider" aria-hidden="true" />
          <a className="sch-navlink" href={linkHref}>
            {linkLabel}
          </a>
        </nav>
        <div className="sch-icons">
          <button type="button" className="sch-icon" aria-label="Search">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="8.6" cy="8.6" r="5.6" />
              <path d="m13 13 4.2 4.2" />
            </svg>
          </button>
          <button type="button" className="sch-icon" aria-label="Saved places" aria-pressed={saved} onClick={() => setSaved(!saved)}>
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
              <path d="M10 16.6S3 12.4 3 7.6A3.6 3.6 0 0 1 10 6a3.6 3.6 0 0 1 7 1.6c0 4.8-7 9-7 9z" />
            </svg>
          </button>
          <div className="sch-menu" data-sch-pop="">
            <button
              type="button"
              className="sch-icon"
              aria-label="Menu"
              aria-expanded={open === "menu"}
              aria-controls={id + "-menu"}
              onClick={() => setOpen(open === "menu" ? "" : "menu")}
            >
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M3 5h14M3 10h14M3 15h14" />
              </svg>
            </button>
            <div id={id + "-menu"} className="sch-panel" data-open={open === "menu"} role="menu" aria-hidden={open !== "menu"}>
              {menuItems.slice(0, 4).map((m) => (
                <a key={m} href={"#" + m.toLowerCase().replace(/\s+/g, "-")} role="menuitem" tabIndex={open === "menu" ? 0 : -1} onClick={() => setOpen("")}>
                  <i />
                  {m}
                </a>
              ))}
              <hr />
              <a href={linkHref} role="menuitem" tabIndex={open === "menu" ? 0 : -1} onClick={() => setOpen("")}>
                {linkLabel}
              </a>
            </div>
          </div>
        </div>
      </header>

      <div className="sch-body">
        <div ref={stageRef} className="sch-stage" aria-hidden="true">
          {artReady && box.w > 0 && (
            <div className="sch-art" style={{ left: box.x, top: box.y, width: box.w, height: box.h }}>
              <div ref={skyRef} className="sch-layer sch-sky">
                <img src={imageBase + "skyline.webp"} alt="" width={Math.round(box.w)} height={Math.round(box.h)} style={imgStyle} draggable={false} />
              </div>
              <div ref={streetRef} className="sch-layer sch-ink">
                <img src={imageBase + "streets.webp"} alt="" width={Math.round(box.w)} height={Math.round(box.h)} style={imgStyle} draggable={false} />
              </div>
            </div>
          )}
        </div>

        <div ref={copyRef} className="sch-copy">
          <h1 className="sch-h1">
            {words.map((line, li) => (
              <span key={li} className="sch-line">
                {line.map((w) => {
                  const d = 0.12 + wordIndex++ * 0.07
                  return (
                    <span key={w + d} className="sch-word" style={{ animationDelay: d.toFixed(2) + "s" }}>
                      {w}
                    </span>
                  )
                })}
              </span>
            ))}
          </h1>
          <p className="sch-stats sch-fade" style={{ animationDelay: afterWords.toFixed(2) + "s" }}>
            {stats.map((st, i) => (
              <React.Fragment key={st.label}>
                <span className="sch-num">
                  <span className="sch-ghost" aria-hidden="true">
                    {fmt(st.value)}
                  </span>
                  <span className="sch-val">{fmt(counts[i] ?? st.value)}</span>
                </span>{" "}
                {st.label}
                {i < stats.length - 1 ? ", " : "."}
              </React.Fragment>
            ))}
          </p>
          <p className="sch-blurb sch-fade" style={{ animationDelay: (afterWords + 0.1).toFixed(2) + "s" }}>
            {blurb}
          </p>
        </div>
      </div>
    </section>
  )
}
