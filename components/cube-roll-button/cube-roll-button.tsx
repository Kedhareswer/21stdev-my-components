"use client"

import React, { useEffect, useRef, useState } from "react"

export interface CubeRollButtonProps {
  /** Label on the resting face. */
  label?: string
  /** Label that rolls up from underneath on hover / focus. Same length reads best. */
  revealLabel?: string
  /** Renders an <a> when set. */
  href?: string
  onClick?: (e: React.MouseEvent) => void
  /** "porcelain" = ivory face that rolls to ink; "ink" = the reverse. */
  tone?: "porcelain" | "ink"
  size?: "md" | "lg"
  /** Max tilt in degrees when the pointer moves across the button. 0 turns it off. */
  tilt?: number
  font?: string
  className?: string
  "aria-label"?: string
}

const FONT = '"Geist", "Inter", "SF Pro Display", "Segoe UI Variable Display", ui-sans-serif, system-ui, sans-serif'

const CSS =
  ".crb-root{--crb-face:#f7f2ea;--crb-face2:#e8dfd2;--crb-ink:#1c1712;--crb-back:#1c1712;--crb-back2:#2c241c;--crb-glint:#e9b98a;display:inline-flex;perspective:900px;font-family:var(--crb-font);-webkit-font-smoothing:antialiased}" +
  ".crb-root[data-tone=ink]{--crb-face:#1d1813;--crb-face2:#2d251d;--crb-ink:#f4ede3;--crb-back:#f7f2ea;--crb-back2:#e6dccd;--crb-glint:#8a4b22}" +
  ".crb-btn{position:relative;display:inline-flex;align-items:stretch;gap:8px;padding:0;border:0;background:none;cursor:pointer;text-decoration:none;color:inherit;transform-style:preserve-3d;transform:rotateX(var(--crb-rx,0deg)) rotateY(var(--crb-ry,0deg));transition:transform .5s cubic-bezier(.2,.9,.25,1);outline:none;-webkit-tap-highlight-color:transparent}" +
  ".crb-root[data-size=md] .crb-btn{font-size:17px;--crb-h:52px}.crb-root[data-size=lg] .crb-btn{font-size:30px;--crb-h:84px}" +
  ".crb-pill,.crb-tile{position:relative;display:inline-flex;align-items:center;justify-content:center;height:var(--crb-h);overflow:hidden;isolation:isolate;" +
  "background:linear-gradient(180deg,var(--crb-face),var(--crb-face2));color:var(--crb-ink);" +
  "box-shadow:inset 0 1px 0 rgba(255,255,255,.75),inset 0 -2px 5px rgba(60,40,20,.08),0 1px 1px rgba(40,25,10,.10),0 6px 14px -6px rgba(40,25,10,.28),0 22px 40px -20px rgba(40,25,10,.45);" +
  "transition:box-shadow .5s,transform .45s cubic-bezier(.3,1.5,.5,1)}" +
  ".crb-root[data-tone=ink] .crb-pill,.crb-root[data-tone=ink] .crb-tile{box-shadow:inset 0 1px 0 rgba(255,255,255,.14),inset 0 -2px 6px rgba(0,0,0,.4),0 1px 1px rgba(0,0,0,.3),0 6px 14px -6px rgba(0,0,0,.5),0 22px 40px -20px rgba(0,0,0,.65)}" +
  ".crb-pill{padding:0 1.35em;border-radius:999px;font-weight:560;letter-spacing:-.015em}" +
  ".crb-tile{width:var(--crb-h);border-radius:calc(var(--crb-h)*.3);perspective:320px}" +
  // the flood: the back colour rises from the bottom edge as the letters roll
  ".crb-pill::before,.crb-tile::before{content:'';position:absolute;inset:0;z-index:-1;background:radial-gradient(120% 90% at 50% 0%,var(--crb-back2),var(--crb-back) 70%);transform:translateY(102%);transition:transform .55s cubic-bezier(.7,0,.2,1)}" +
  ".crb-tile::before{transition-delay:.06s}" +
  // a glint that sweeps once per hover
  ".crb-pill::after{content:'';position:absolute;inset:-20% auto -20% 0;width:38%;z-index:2;pointer-events:none;background:linear-gradient(100deg,transparent,rgba(255,255,255,.55),transparent);transform:translateX(-160%) skewX(-18deg);opacity:0}" +
  ".crb-row{display:inline-grid;perspective:320px}" +
  ".crb-line{grid-area:1/1;display:inline-flex;justify-content:center;white-space:pre}" +
  // each glyph is one face of an imaginary cube: it turns about a pivot half a line-height behind it
  ".crb-l{display:inline-block;height:1.15em;line-height:1.15em;transform-origin:50% 50% -.575em;backface-visibility:hidden;-webkit-backface-visibility:hidden;transition:transform .62s cubic-bezier(.3,1.35,.45,1) calc(var(--i)*26ms),opacity .3s calc(var(--i)*26ms)}" +
  ".crb-front .crb-l{transform:rotateX(var(--crb-f,0deg))}" +
  ".crb-back .crb-l{transform:rotateX(var(--crb-b,-90deg));color:var(--crb-glint)}" +
  ".crb-arrow{display:block;width:.95em;height:.95em}" +
  ".crb-tile .crb-l{height:1em;line-height:1em;transform-origin:50% 50% -.5em}" +
  ".crb-tile .crb-back .crb-arrow{transform:rotate(-45deg)}" +
  // entrance: everything rolls in from underneath
  ".crb-root:not([data-in]) .crb-l{--crb-f:-90deg;transition:none}.crb-root:not([data-in]) .crb-pill,.crb-root:not([data-in]) .crb-tile{transform:translateY(10px) scale(.96);opacity:0}" +
  ".crb-root[data-in] .crb-pill,.crb-root[data-in] .crb-tile{opacity:1;transition:box-shadow .5s,transform .7s cubic-bezier(.3,1.5,.5,1),opacity .4s}.crb-root[data-in] .crb-tile{transition-delay:0s,.08s,.08s}" +
  ".crb-btn:hover .crb-l,.crb-btn:focus-visible .crb-l{--crb-f:90deg;--crb-b:0deg}" +
  ".crb-btn:hover .crb-pill::before,.crb-btn:focus-visible .crb-pill::before,.crb-btn:hover .crb-tile::before,.crb-btn:focus-visible .crb-tile::before{transform:translateY(0)}" +
  ".crb-btn:hover .crb-pill::after,.crb-btn:focus-visible .crb-pill::after{animation:crb-glint .9s .18s cubic-bezier(.4,0,.2,1) both}" +
  ".crb-btn:hover .crb-tile{transform:translateX(3px)}" +
  ".crb-btn:active .crb-pill,.crb-btn:active .crb-tile{transform:scale(.965);box-shadow:inset 0 2px 6px rgba(0,0,0,.25),0 1px 2px rgba(40,25,10,.2)}" +
  ".crb-btn:focus-visible .crb-pill,.crb-btn:focus-visible .crb-tile{outline:2px solid var(--crb-glint);outline-offset:3px}" +
  "@keyframes crb-glint{0%{transform:translateX(-160%) skewX(-18deg);opacity:0}20%{opacity:1}100%{transform:translateX(380%) skewX(-18deg);opacity:0}}" +
  "@media (prefers-reduced-motion:reduce){.crb-btn,.crb-l,.crb-pill,.crb-tile,.crb-pill::before,.crb-tile::before{transition-duration:.01ms!important;transition-delay:0s!important}.crb-btn:hover .crb-pill::after,.crb-btn:focus-visible .crb-pill::after{animation:none}}"

// #region tilt
/** Pointer position inside a cached rect -> tilt in degrees, clamped to ±max. */
export function tiltFor(px: number, py: number, rect: { left: number; top: number; width: number; height: number }, max: number) {
  if (!rect.width || !rect.height || !max) return { rx: 0, ry: 0 }
  const nx = Math.min(1, Math.max(-1, ((px - rect.left) / rect.width) * 2 - 1))
  const ny = Math.min(1, Math.max(-1, ((py - rect.top) / rect.height) * 2 - 1))
  return { rx: +(-ny * max).toFixed(2), ry: +(nx * max).toFixed(2) }
}
// #endregion

function Arrow() {
  return (
    <svg className="crb-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 12h15M13 5.5 19.5 12 13 18.5" />
    </svg>
  )
}

export default function CubeRollButton({
  label = "Book a visit",
  revealLabel = "Let's go now",
  href,
  onClick,
  tone = "porcelain",
  size = "md",
  tilt = 8,
  font = FONT,
  className,
  "aria-label": ariaLabel,
}: CubeRollButtonProps) {
  const root = useRef(null as HTMLSpanElement | null)
  const rect = useRef({ left: 0, top: 0, width: 0, height: 0 })
  const [entered, setEntered] = useState(false)
  const reduced = useRef(false)

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    reduced.current = mq.matches
    const on = () => (reduced.current = mq.matches)
    mq.addEventListener("change", on)
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setEntered(true)))
    return () => {
      cancelAnimationFrame(id)
      mq.removeEventListener("change", on)
    }
  }, [])

  // Measured once per hover (and never per move): the move handler reads only the cache.
  const measure = () => {
    const el = root.current
    if (!el) return
    const r = el.getBoundingClientRect()
    rect.current = { left: r.left, top: r.top, width: r.width, height: r.height }
  }
  const setTilt = (rx: number, ry: number) => {
    const el = root.current
    if (!el) return
    el.style.setProperty("--crb-rx", rx + "deg")
    el.style.setProperty("--crb-ry", ry + "deg")
  }
  const onMove = (e: React.PointerEvent) => {
    if (reduced.current || e.pointerType !== "mouse") return
    const t = tiltFor(e.clientX, e.clientY, rect.current, tilt)
    setTilt(t.rx, t.ry)
  }

  const line = (text: string, side: "front" | "back", offset = 0) => (
    <span className={"crb-line crb-" + side} aria-hidden="true">
      {Array.from(text).map((c, i) => (
        <span className="crb-l" key={i} style={{ ["--i" as string]: i + offset } as React.CSSProperties}>
          {c}
        </span>
      ))}
    </span>
  )
  const arrow = (side: "front" | "back") => (
    <span className={"crb-line crb-" + side} aria-hidden="true">
      <span className="crb-l" style={{ ["--i" as string]: Math.min(label.length, 14) } as React.CSSProperties}>
        <Arrow />
      </span>
    </span>
  )

  const inner = (
    <>
      <span className="crb-pill">
        <span className="crb-row">
          {line(label, "front")}
          {line(revealLabel, "back", 2)}
        </span>
      </span>
      <span className="crb-tile">
        <span className="crb-row">
          {arrow("front")}
          {arrow("back")}
        </span>
      </span>
    </>
  )

  const common = {
    className: "crb-btn",
    "aria-label": ariaLabel ?? label,
    onClick,
    onPointerEnter: measure,
    onPointerMove: onMove,
    onPointerLeave: () => setTilt(0, 0),
  }

  return (
    <span
      ref={root}
      className={"crb-root" + (className ? " " + className : "")}
      data-tone={tone}
      data-size={size}
      data-in={entered ? "" : undefined}
      style={{ ["--crb-font" as string]: font } as React.CSSProperties}
    >
      <style>{CSS}</style>
      {href ? <a href={href} {...common}>{inner}</a> : <button type="button" {...common}>{inner}</button>}
    </span>
  )
}
