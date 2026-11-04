"use client"

import React, { useEffect, useRef, useState } from "react"

export interface DotFloodButtonProps {
  children?: string
  href?: string
  onClick?: (e: React.MouseEvent) => void
  /** "ivory" outline that floods ink, or "ink" fill that floods ivory. */
  tone?: "ivory" | "ink"
  /** Colour of the resting dot and the arrow. */
  accent?: string
  size?: "md" | "lg"
  /** How far (px) the button leans toward the pointer. 0 turns it off. */
  pull?: number
  font?: string
  className?: string
  "aria-label"?: string
}

const FONT = "'Geist','Inter','SF Pro Text','Segoe UI Variable Text',ui-sans-serif,system-ui,sans-serif"
// fine film grain for the flood, inlined so nothing is fetched
const GRAIN = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.5'/%3E%3C/svg%3E\")"

const CSS =
  ".dfb-root{--dfb-paper:#f7f3ec;--dfb-ink:#141210;--dfb-acc:#ff5a36;--dfb-px:0px;--dfb-py:0px;display:inline-flex;font-family:var(--dfb-font);-webkit-font-smoothing:antialiased}" +
  ".dfb-root[data-tone=ink]{--dfb-paper:#141210;--dfb-ink:#f7f3ec}" +
  ".dfb-btn{position:relative;display:inline-flex;align-items:center;border:0;border-radius:999px;cursor:pointer;text-decoration:none;outline:none;overflow:hidden;isolation:isolate;-webkit-tap-highlight-color:transparent;" +
  "color:var(--dfb-ink);background:var(--dfb-paper);box-shadow:inset 0 0 0 1.5px var(--dfb-ink),0 1px 0 rgba(255,255,255,.6),0 10px 22px -14px rgba(20,18,16,.55);" +
  "transform:translate(var(--dfb-px),var(--dfb-py));transition:transform .5s cubic-bezier(.3,1.5,.5,1),box-shadow .4s}" +
  ".dfb-root[data-size=md] .dfb-btn{height:46px;padding:0 22px 0 18px;font-size:15px;--dfb-dot:7px;--dfb-dx:21.5px;--dfb-ar:18px}" +
  ".dfb-root[data-size=lg] .dfb-btn{height:64px;padding:0 32px 0 26px;font-size:21px;--dfb-dot:9px;--dfb-dx:30.5px;--dfb-ar:26px}" +
  ".dfb-btn:focus-visible{box-shadow:inset 0 0 0 1.5px var(--dfb-ink),0 0 0 3px var(--dfb-paper),0 0 0 5px var(--dfb-acc)}" +
  ".dfb-btn:active{transform:translate(var(--dfb-px),var(--dfb-py)) scale(.96);transition-duration:.15s}" +
  // the flood: a circle grown out of the dot's centre until it covers the pill
  ".dfb-flood{position:absolute;inset:0;z-index:-1;background:" + GRAIN + ",radial-gradient(120% 140% at 30% 0%,color-mix(in oklab,var(--dfb-ink) 82%,var(--dfb-paper)),var(--dfb-ink));background-size:120px 120px,100% 100%;background-blend-mode:soft-light,normal;" +
  "clip-path:circle(calc(var(--dfb-dot)/2) at var(--dfb-dx) 50%);opacity:0;transition:clip-path .6s cubic-bezier(.7,0,.2,1),opacity 0s .6s}" +
  ".dfb-btn:hover .dfb-flood,.dfb-btn:focus-visible .dfb-flood{clip-path:circle(150% at var(--dfb-dx) 50%);opacity:1;transition:clip-path .7s cubic-bezier(.65,0,.25,1),opacity 0s}" +
  ".dfb-dot{width:var(--dfb-dot);height:var(--dfb-dot);flex:none;margin-right:10px;border-radius:50%;background:var(--dfb-ink);box-shadow:0 0 0 0 color-mix(in oklab,var(--dfb-acc) 50%,transparent);transition:transform .45s cubic-bezier(.3,1.6,.5,1),background .3s;animation:dfb-breathe 2.6s ease-in-out infinite}" +
  ".dfb-btn:hover .dfb-dot,.dfb-btn:focus-visible .dfb-dot{transform:scale(0);animation:none}" +
  ".dfb-lbl{display:inline-flex;white-space:pre;font-weight:580;letter-spacing:-.015em;transition:transform .55s cubic-bezier(.3,1.3,.5,1)}" +
  ".dfb-btn:hover .dfb-lbl,.dfb-btn:focus-visible .dfb-lbl{transform:translateX(calc(var(--dfb-dot)*-1 - 10px))}" +
  ".dfb-ch{display:inline-block;transition:color .3s calc(.12s + var(--i)*18ms)}" +
  ".dfb-btn:hover .dfb-ch,.dfb-btn:focus-visible .dfb-ch{color:var(--dfb-paper);animation:dfb-wave .55s calc(var(--i)*22ms) cubic-bezier(.3,1.4,.5,1)}" +
  // the arrow slides in at the right edge, in the accent colour
  ".dfb-arw{position:absolute;right:var(--dfb-ar);top:50%;display:grid;place-items:center;width:1.05em;height:1.05em;margin-top:-.525em;overflow:hidden;color:var(--dfb-acc)}" +
  ".dfb-arw svg{width:1.05em;height:1.05em;flex:none;transform:translateX(-130%) rotate(-30deg);transition:transform .6s .08s cubic-bezier(.3,1.5,.5,1)}" +
    ".dfb-btn:hover .dfb-arw svg,.dfb-btn:focus-visible .dfb-arw svg{transform:none}" +
  ".dfb-root:not([data-in]) .dfb-btn{opacity:0;transform:translateY(8px) scale(.96)}.dfb-root[data-in] .dfb-btn{transition:transform .7s cubic-bezier(.3,1.5,.5,1),opacity .4s,box-shadow .4s}" +
  "@keyframes dfb-wave{0%{transform:translateY(0)}35%{transform:translateY(-.22em)}100%{transform:translateY(0)}}" +
  "@keyframes dfb-breathe{0%,100%{background:var(--dfb-ink);box-shadow:0 0 0 0 color-mix(in oklab,var(--dfb-acc) 0%,transparent)}50%{background:var(--dfb-acc);box-shadow:0 0 0 5px color-mix(in oklab,var(--dfb-acc) 18%,transparent)}}" +
  "@media (prefers-reduced-motion:reduce){.dfb-btn,.dfb-flood,.dfb-lbl,.dfb-arw,.dfb-arw svg,.dfb-dot{transition-duration:.01ms!important;transition-delay:0s!important}.dfb-dot,.dfb-btn:hover .dfb-ch,.dfb-btn:focus-visible .dfb-ch{animation:none}}"

// #region pull
/** Lean toward the pointer: offset from the cached centre, scaled to at most `max` px each way. */
export function pullAt(px: number, py: number, r: { left: number; top: number; width: number; height: number }, max: number) {
  if (!r.width || !r.height || !max) return { x: 0, y: 0 }
  const nx = Math.max(-1, Math.min(1, (px - (r.left + r.width / 2)) / (r.width / 2)))
  const ny = Math.max(-1, Math.min(1, (py - (r.top + r.height / 2)) / (r.height / 2)))
  return { x: Math.round(nx * max * 10) / 10, y: Math.round(ny * max * 0.5 * 10) / 10 }
}
// #endregion

export default function DotFloodButton({
  children = "Start a project",
  href,
  onClick,
  tone = "ivory",
  accent,
  size = "md",
  pull = 6,
  font = FONT,
  className,
  "aria-label": ariaLabel,
}: DotFloodButtonProps) {
  const root = useRef(null as HTMLSpanElement | null)
  const rect = useRef({ left: 0, top: 0, width: 0, height: 0 })
  const reduced = useRef(false)
  const [entered, setEntered] = useState(false)

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

  // Measured once as the pointer arrives; moves read only the cache.
  const measure = () => {
    const el = root.current
    if (!el) return
    const r = el.getBoundingClientRect()
    rect.current = { left: r.left, top: r.top, width: r.width, height: r.height }
  }
  const set = (x: number, y: number) => {
    root.current?.style.setProperty("--dfb-px", x + "px")
    root.current?.style.setProperty("--dfb-py", y + "px")
  }
  const onMove = (e: React.PointerEvent) => {
    if (reduced.current || e.pointerType !== "mouse") return
    const p = pullAt(e.clientX, e.clientY, rect.current, pull)
    set(p.x, p.y)
  }

  const inner = (
    <>
      <span className="dfb-flood" aria-hidden="true" />
      <span className="dfb-dot" aria-hidden="true" />
      <span className="dfb-lbl" aria-hidden="true">
        {Array.from(children).map((c, i) => (
          <span className="dfb-ch" key={i} style={{ ["--i" as string]: i } as React.CSSProperties}>{c}</span>
        ))}
      </span>
      <span className="dfb-arw" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h13M13 6l6 6-6 6" />
        </svg>
      </span>
    </>
  )
  const common = {
    className: "dfb-btn",
    onClick,
    "aria-label": ariaLabel ?? children,
    onPointerEnter: measure,
    onPointerMove: onMove,
    onPointerLeave: () => set(0, 0),
  }

  return (
    <span
      ref={root}
      className={"dfb-root" + (className ? " " + className : "")}
      data-tone={tone}
      data-size={size}
      data-in={entered ? "" : undefined}
      style={{ ["--dfb-font" as string]: font, ...(accent ? { ["--dfb-acc" as string]: accent } : {}) } as React.CSSProperties}
    >
      <style>{CSS}</style>
      {href ? <a href={href} {...common}>{inner}</a> : <button type="button" {...common}>{inner}</button>}
    </span>
  )
}
