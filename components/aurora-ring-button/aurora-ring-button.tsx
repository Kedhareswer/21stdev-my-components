"use client"

import React, { useEffect, useRef, useState } from "react"

export interface AuroraRingButtonProps {
  children?: React.ReactNode
  href?: string
  onClick?: (e: React.MouseEvent) => void
  size?: "md" | "lg"
  /** Four colours the ring and aurora cycle through. */
  colors?: [string, string, string, string]
  /** Show the twinkling sparkles on hover. */
  sparkles?: boolean
  font?: string
  className?: string
  "aria-label"?: string
}

const FONT = "'Geist','Inter','SF Pro Display','Segoe UI Variable Display',ui-sans-serif,system-ui,sans-serif"

const CSS =
  "@property --arb-a{syntax:'<angle>';inherits:true;initial-value:0deg}" +
  ".arb-root{--arb-1:#2ee6c5;--arb-2:#7c5cff;--arb-3:#ff5c8a;--arb-4:#ffb547;--arb-x:50%;--arb-y:50%;position:relative;display:inline-flex;isolation:isolate;font-family:var(--arb-font);-webkit-font-smoothing:antialiased;animation:arb-spin 3.6s linear infinite}" +
  ".arb-ring{background:conic-gradient(from var(--arb-a),var(--arb-1),var(--arb-2),var(--arb-3),var(--arb-4),var(--arb-1))}" +
  // bloom under the button: the same ring, blurred, that swells on hover
  ".arb-glow{position:absolute;inset:4px 10px;border-radius:999px;z-index:-1;filter:blur(18px);opacity:.42;transform:translateY(6px) scale(.92);transition:opacity .5s,transform .6s cubic-bezier(.3,1.4,.5,1),filter .5s}" +
  ".arb-root:hover .arb-glow,.arb-root:focus-within .arb-glow{opacity:.85;transform:translateY(8px) scale(1.04);filter:blur(22px)}" +
  ".arb-btn{position:relative;display:inline-flex;padding:1.6px;border:0;border-radius:999px;cursor:pointer;text-decoration:none;outline:none;color:#fff;-webkit-tap-highlight-color:transparent;transition:transform .45s cubic-bezier(.3,1.6,.5,1)}" +
  ".arb-btn:hover{transform:translateY(-1px)}.arb-btn:active{transform:scale(.96)}" +
  ".arb-btn:focus-visible{box-shadow:0 0 0 3px #fff,0 0 0 5px var(--arb-2)}" +
  ".arb-face{position:relative;display:inline-flex;align-items:center;gap:9px;overflow:hidden;border-radius:999px;isolation:isolate;" +
  "background:radial-gradient(120% 140% at 50% -30%,#24242e 0%,#101016 50%,#08080b 100%);box-shadow:inset 0 1px 0 rgba(255,255,255,.12),inset 0 -1px 0 rgba(0,0,0,.6)}" +
  ".arb-root[data-size=md] .arb-face{height:46px;padding:0 22px;font-size:15px}.arb-root[data-size=lg] .arb-face{height:62px;padding:0 32px;font-size:19px}" +
  // the aurora: three soft blobs drifting slowly inside the face
  ".arb-aur{position:absolute;inset:-60% -20%;z-index:-2;opacity:.5;transition:opacity .6s}" +
  ".arb-root:hover .arb-aur,.arb-root:focus-within .arb-aur{opacity:1}" +
  ".arb-aur i{position:absolute;width:55%;height:120%;border-radius:50%;filter:blur(16px);mix-blend-mode:screen;opacity:.75}" +
  ".arb-aur i:nth-child(1){left:-5%;top:10%;background:var(--arb-1);animation:arb-d1 7s ease-in-out infinite alternate}" +
  ".arb-aur i:nth-child(2){left:30%;top:-15%;background:var(--arb-2);animation:arb-d2 9s ease-in-out infinite alternate}" +
  ".arb-aur i:nth-child(3){left:55%;top:20%;background:var(--arb-3);animation:arb-d3 8s ease-in-out infinite alternate}" +
  // a darkening veil keeps the label readable; the pointer cuts a bright pool through it
  ".arb-veil{position:absolute;inset:0;z-index:-1;background:radial-gradient(70px 50px at var(--arb-x) var(--arb-y),rgba(8,8,11,0),rgba(8,8,11,.38) 75%),linear-gradient(180deg,rgba(8,8,11,.05),rgba(8,8,11,.35))}" +
  ".arb-lbl{position:relative;font-weight:600;letter-spacing:-.015em;white-space:nowrap;background:linear-gradient(90deg,#fff 0%,#fff 40%,var(--arb-4) 50%,#fff 60%,#fff 100%);background-size:250% 100%;background-position:100% 0;-webkit-background-clip:text;background-clip:text;color:transparent;transition:background-position 1s cubic-bezier(.3,0,.2,1)}" +
  ".arb-root:hover .arb-lbl{background-position:0 0}" +
  ".arb-star{width:16px;height:16px;flex:none;color:#fff;filter:drop-shadow(0 0 6px var(--arb-1));transition:transform .6s cubic-bezier(.3,1.6,.5,1)}" +
  ".arb-root:hover .arb-star{transform:rotate(90deg) scale(1.1)}" +
  // sparkles outside the pill
  ".arb-sp{position:absolute;width:12px;height:12px;pointer-events:none;color:#fff;opacity:0;transform:scale(0)}" +
  ".arb-sp svg{width:100%;height:100%;display:block;filter:drop-shadow(0 0 4px var(--arb-3))}" +
  ".arb-sp1{left:-10px;top:-8px}.arb-sp2{right:-12px;top:30%;width:9px!important;height:9px!important}.arb-sp3{left:28%;bottom:-12px;width:8px!important;height:8px!important}" +
  ".arb-root:hover .arb-sp,.arb-root:focus-within .arb-sp{animation:arb-tw 1.6s ease-in-out infinite}" +
  ".arb-root .arb-sp2{animation-delay:.45s!important}.arb-root .arb-sp3{animation-delay:.9s!important}" +
  ".arb-flash{position:absolute;inset:0;border-radius:999px;pointer-events:none;background:radial-gradient(closest-side,rgba(255,255,255,.55),transparent);opacity:0}" +
  ".arb-btn:active .arb-flash{animation:arb-flash .5s ease-out}" +
  ".arb-root:not([data-in]) .arb-btn{opacity:0;transform:translateY(10px) scale(.94)}.arb-root[data-in] .arb-btn{transition:transform .8s cubic-bezier(.3,1.5,.5,1),opacity .5s}" +
  "@keyframes arb-spin{to{--arb-a:360deg}}" +
  "@keyframes arb-d1{to{transform:translate(35%,-20%) scale(1.2)}}" +
  "@keyframes arb-d2{to{transform:translate(-30%,25%) scale(.85)}}" +
  "@keyframes arb-d3{to{transform:translate(-25%,-15%) scale(1.15)}}" +
  "@keyframes arb-tw{0%,100%{opacity:0;transform:scale(0) rotate(0)}40%{opacity:1;transform:scale(1) rotate(45deg)}70%{opacity:.4;transform:scale(.6) rotate(80deg)}}" +
  "@keyframes arb-flash{from{opacity:1}to{opacity:0}}" +
  "@media (prefers-reduced-motion:reduce){.arb-root,.arb-aur i,.arb-sp,.arb-btn:active .arb-flash{animation:none!important}.arb-lbl,.arb-glow,.arb-btn{transition-duration:.01ms}}"

// #region spot
/** Pointer position inside a cached rect, as percentages for the spotlight, clamped to the face. */
export function spotAt(px: number, py: number, r: { left: number; top: number; width: number; height: number }) {
  if (!r.width || !r.height) return { x: 50, y: 50 }
  const c = (v: number) => Math.round(Math.min(100, Math.max(0, v)) * 10) / 10
  return { x: c(((px - r.left) / r.width) * 100), y: c(((py - r.top) / r.height) * 100) }
}
// #endregion

const Star = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2.5c.5 4.6 2.9 7 9.5 9.5-6.6 2.5-9 4.9-9.5 9.5-.5-4.6-2.9-7-9.5-9.5 6.6-2.5 9-4.9 9.5-9.5Z" />
  </svg>
)

export default function AuroraRingButton({
  children = "Get Pro",
  href,
  onClick,
  size = "md",
  colors,
  sparkles = true,
  font = FONT,
  className,
  "aria-label": ariaLabel,
}: AuroraRingButtonProps) {
  const root = useRef(null as HTMLSpanElement | null)
  const rect = useRef({ left: 0, top: 0, width: 0, height: 0 })
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setEntered(true)))
    return () => cancelAnimationFrame(id)
  }, [])

  // Measured once as the pointer arrives; moves only read the cache.
  const measure = () => {
    const el = root.current
    if (!el) return
    const r = el.getBoundingClientRect()
    rect.current = { left: r.left, top: r.top, width: r.width, height: r.height }
  }
  const onMove = (e: React.PointerEvent) => {
    const el = root.current
    if (!el) return
    const p = spotAt(e.clientX, e.clientY, rect.current)
    el.style.setProperty("--arb-x", p.x + "%")
    el.style.setProperty("--arb-y", p.y + "%")
  }
  const onLeave = () => {
    root.current?.style.setProperty("--arb-x", "50%")
    root.current?.style.setProperty("--arb-y", "50%")
  }

  const inner = (
    <span className="arb-face">
      <span className="arb-aur" aria-hidden="true"><i /><i /><i /></span>
      <span className="arb-veil" aria-hidden="true" />
      <Star className="arb-star" />
      <span className="arb-lbl">{children}</span>
      <span className="arb-flash" aria-hidden="true" />
    </span>
  )
  const common = {
    className: "arb-btn arb-ring",
    onClick,
    "aria-label": ariaLabel,
    onPointerEnter: measure,
    onPointerMove: onMove,
    onPointerLeave: onLeave,
  }

  const style = { ["--arb-font" as string]: font } as React.CSSProperties
  if (colors) colors.forEach((c, i) => ((style as Record<string, string>)["--arb-" + (i + 1)] = c))

  return (
    <span ref={root} className={"arb-root" + (className ? " " + className : "")} data-size={size} data-in={entered ? "" : undefined} style={style}>
      <style>{CSS}</style>
      <span className="arb-glow arb-ring" aria-hidden="true" />
      {href ? <a href={href} {...common}>{inner}</a> : <button type="button" {...common}>{inner}</button>}
      {sparkles && (
        <>
          <span className="arb-sp arb-sp1" aria-hidden="true"><Star /></span>
          <span className="arb-sp arb-sp2" aria-hidden="true"><Star /></span>
          <span className="arb-sp arb-sp3" aria-hidden="true"><Star /></span>
        </>
      )}
    </span>
  )
}
