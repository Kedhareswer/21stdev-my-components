"use client"

import { useEffect, useId, useRef, useState } from "react"
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react"

// #region goo
export const OPEN_SECONDS = 0.9
export const W = 520
export const H = 220
export const PILL_W = 250
export const PILL_H = 84
export const CHIP_W = 150
export const CHIP_H = 80

export type Shape = { cx: number; cy: number; w: number; h: number }

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a))
const lerp = (a: number, b: number, k: number) => a + (b - a) * k
const inOut = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2)
const outCubic = (k: number) => 1 - Math.pow(1 - k, 3)

/** The three blobs at progress p (0 = a single "Delete" pill, 1 = pill + ✕ chip + ✓ chip).
 * The pill stretches, its right end swells into a bulb, and the bulb pinches into two chips. */
export function shapesAt(p: number) {
  const bump = Math.sin(Math.PI * seg(p, 0, 0.6))
  const main: Shape = { cx: 10 * bump, cy: 0, w: PILL_W + 36 * bump, h: PILL_H - 4 * bump }
  const grow = outCubic(seg(p, 0.06, 0.46))
  const split = inOut(seg(p, 0.46, 0.84))
  const settle = seg(p, 0.8, 1)
  const wob = Math.sin(settle * Math.PI * 2.5) * (1 - settle) * 0.06
  const chipX = PILL_W / 2 + 18 + CHIP_W / 2
  // the bulb swells out of the pill's right end and stays joined to it by a neck...
  const bulb = lerp(30, 150, grow)
  const joined = PILL_W / 2 + bulb / 2 - 34
  // ...until it pulls away to the right and pinches into two chips
  const cx = lerp(lerp(PILL_W / 2 - 24, joined, grow), chipX, split)
  const w = lerp(bulb, CHIP_W, split) * (1 + wob)
  const h = lerp(bulb, CHIP_H, split) * (1 - wob)
  const dy = lerp(0, CHIP_H / 2 + 15, split)
  const on = grow > 0 ? 1 : 0
  const top: Shape = { cx, cy: -dy, w: w * on, h: h * on }
  const bottom: Shape = { cx, cy: dy, w: top.w, h: top.h }
  return { main, top, bottom }
}

/** Horizontal shift that keeps the visible blobs centred in the frame. */
export function centreShift(s: ReturnType<typeof shapesAt>) {
  let l = s.main.cx - s.main.w / 2
  let r = s.main.cx + s.main.w / 2
  for (const b of [s.top, s.bottom]) {
    if (b.w < 6) continue
    l = Math.min(l, b.cx - b.w / 2)
    r = Math.max(r, b.cx + b.w / 2)
  }
  return -(l + r) / 2
}

/** Label opacities at progress p: "Delete" blurs out as "Delete file?" blurs in, then the icons. */
export function labelsAt(p: number) {
  return { idle: 1 - seg(p, 0, 0.18), ask: seg(p, 0.12, 0.36), icons: seg(p, 0.7, 0.96) }
}
// #endregion

export type GooeyDeleteConfirmProps = {
  label?: string
  question?: string
  doneLabel?: string
  /** Called when ✓ is chosen. */
  onConfirm?: () => void
  onCancel?: () => void
  /** Loop a hover, open and choice on its own until someone interacts. */
  autoPlay?: boolean
  className?: string
  style?: CSSProperties
}

const CSS =
  ".gdc-root{position:relative;display:block;width:100%;max-width:520px;aspect-ratio:520/220;-webkit-tap-highlight-color:transparent}" +
  ".gdc-svg{position:absolute;inset:0;width:100%;height:100%;display:block;overflow:visible;pointer-events:none}" +
  ".gdc-label{font:600 30px/1 ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;letter-spacing:-.01em;fill:#2b2b2d}" +
  ".gdc-hit{position:absolute;padding:0;margin:0;border:0;background:transparent;cursor:pointer;border-radius:999px;outline:none;color:transparent}" +
  ".gdc-hit:focus-visible{box-shadow:0 0 0 3px var(--color-background),0 0 0 5px var(--color-primary)}" +
  ".gdc-hit[hidden]{display:none}" +
  ".gdc-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}" +
  "@media (prefers-reduced-motion:reduce){.gdc-hit{transition:none}}"

type Mode = "idle" | "open" | "done"

export default function GooeyDeleteConfirm({
  label = "Delete",
  question = "Delete file?",
  doneLabel = "Deleted",
  onConfirm,
  onCancel,
  autoPlay = false,
  className,
  style,
}: GooeyDeleteConfirmProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "")
  const ids = { goo: "gdc-goo-" + uid, fill: "gdc-fill-" + uid, spot: "gdc-spot-" + uid, clip: "gdc-clip-" + uid }
  const [mode, setMode] = useState("idle" as Mode)
  const svgRef = useRef(null as SVGSVGElement | null)
  const mainHit = useRef(null as HTMLButtonElement | null)
  const noHit = useRef(null as HTMLButtonElement | null)
  const yesHit = useRef(null as HTMLButtonElement | null)
  const live = useRef({ scale: 1, p: 0, target: 0, spotX: 0, spot: 0, spotTarget: 0, touched: false, mode: "idle" as Mode, done: 0 })

  useEffect(() => {
    live.current.mode = mode
    live.current.target = mode === "open" ? 1 : 0
    if (mode === "done") live.current.done = 1
  }, [mode])

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const q = (s: string) => svg.querySelector(s) as SVGElement
    const rects = { main: q(".gdc-main"), top: q(".gdc-top"), bottom: q(".gdc-bottom") }
    const group = q(".gdc-g"), clip = q(".gdc-cliprect"), spot = q(".gdc-spotc")
    const tIdle = q(".gdc-t-idle"), tAsk = q(".gdc-t-ask"), tDone = q(".gdc-t-done")
    const iNo = q(".gdc-i-no"), iYes = q(".gdc-i-yes")
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)")
    const st = live.current
    let raf = 0
    let last = performance.now()
    let visible = true
    const born = last
    const place = (el: SVGElement, s: Shape) => {
      el.setAttribute("x", String(s.cx - s.w / 2))
      el.setAttribute("y", String(s.cy - s.h / 2))
      el.setAttribute("width", String(Math.max(0, s.w)))
      el.setAttribute("height", String(Math.max(0, s.h)))
      el.setAttribute("rx", String(Math.max(0, Math.min(s.w, s.h) / 2)))
    }
    const hitBox = (el: HTMLElement | null, s: Shape, shift: number, show: boolean) => {
      if (!el) return
      el.hidden = !show
      el.style.left = ((W / 2 + shift + s.cx - s.w / 2) / W) * 100 + "%"
      el.style.top = ((H / 2 + s.cy - s.h / 2) / H) * 100 + "%"
      el.style.width = (s.w / W) * 100 + "%"
      el.style.height = (s.h / H) * 100 + "%"
    }
    // the unattended loop: sweep the press-spot across, open, wait, choose, repeat
    const ghost = (now: number) => {
      const c = ((now - born) / 1000) % 7
      const was = st.mode
      if (c < 1.5) {
        st.spotTarget = 1
        st.spotX = lerp(-PILL_W / 2 + 30, PILL_W / 2 - 40, inOut(seg(c, 0.1, 1.4)))
        if (was !== "idle") setMode("idle")
      } else if (c < 4.2) {
        st.spotTarget = 0
        if (was === "idle") setMode("open")
      } else if (c < 4.3) {
        if (was === "open") setMode(Math.floor((now - born) / 7000) % 2 ? "done" : "idle")
      }
    }
    const paint = () => {
      const now = performance.now()
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (autoPlay && !st.touched && !reduce.matches) ghost(now)
      const step = reduce.matches ? 1 : dt / OPEN_SECONDS
      st.p = st.p < st.target ? Math.min(st.target, st.p + step) : Math.max(st.target, st.p - step * 1.2)
      st.spot += (st.spotTarget - st.spot) * (reduce.matches ? 1 : 0.16)
      if (st.mode === "done") {
        st.done += dt
        if (st.done > 2.4) setMode("idle")
      }
      const s = shapesAt(st.p)
      const shift = reduce.matches ? centreShift(shapesAt(st.target)) : centreShift(s)
      group.setAttribute("transform", "translate(" + (W / 2 + shift) + " " + H / 2 + ")")
      place(rects.main, s.main)
      place(rects.top, s.top)
      place(rects.bottom, s.bottom)
      place(clip, s.main)
      spot.setAttribute("cx", String(st.spotX))
      spot.style.opacity = String(st.spot * (1 - st.p))
      const L = labelsAt(st.p)
      const doneOn = st.mode === "done" && st.p < 0.05
      tIdle.style.opacity = String(doneOn ? 0 : L.idle)
      tIdle.style.filter = "blur(" + (1 - L.idle) * 6 + "px)"
      tAsk.style.opacity = String(L.ask)
      tAsk.style.filter = "blur(" + (1 - L.ask) * 6 + "px)"
      tDone.style.opacity = doneOn ? "1" : "0"
      for (const t of [tIdle, tAsk, tDone]) t.setAttribute("x", String(s.main.cx))
      for (const [el, b] of [[iNo, s.top], [iYes, s.bottom]] as const) {
        el.setAttribute("transform", "translate(" + b.cx + " " + b.cy + ") scale(" + (0.6 + 0.4 * L.icons) + ")")
        el.style.opacity = String(L.icons)
      }
      const open = st.p > 0.98
      hitBox(mainHit.current, s.main, shift, !open || st.mode !== "open")
      hitBox(noHit.current, s.top, shift, open && st.mode === "open")
      hitBox(yesHit.current, s.bottom, shift, open && st.mode === "open")
      const busy = st.p !== st.target || Math.abs(st.spot - st.spotTarget) > 0.002 || st.mode === "done" || (autoPlay && !st.touched && !reduce.matches)
      raf = visible && busy ? requestAnimationFrame(paint) : 0
    }
    const kick = () => {
      if (!raf && visible) {
        last = performance.now()
        raf = requestAnimationFrame(paint)
      }
    }
    ;(svg as SVGSVGElement & { __kick?: () => void }).__kick = kick
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      if (visible) kick()
    })
    io.observe(svg)
    const ro = new ResizeObserver(([e]) => {
      st.scale = e.contentRect.width / W || 1
    })
    ro.observe(svg)
    raf = requestAnimationFrame(paint)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      ro.disconnect()
    }
  }, [autoPlay])

  const kick = () => (svgRef.current as (SVGSVGElement & { __kick?: () => void }) | null)?.__kick?.()
  useEffect(kick, [mode])
  const touch = () => {
    live.current.touched = true
  }
  const onMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    touch()
    const st = live.current
    st.spotX = e.nativeEvent.offsetX / st.scale - PILL_W / 2
    st.spotTarget = 1
    kick()
  }
  const onLeave = () => {
    live.current.spotTarget = 0
    kick()
  }

  return (
    <div className={"gdc-root" + (className ? " " + className : "")} style={style}>
      <style>{CSS}</style>
      <svg ref={svgRef} className="gdc-svg" viewBox={"0 0 " + W + " " + H} aria-hidden="true">
        <defs>
          <filter id={ids.goo} x="-20%" y="-40%" width="140%" height="180%" colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceGraphic" stdDeviation="11" result="b" />
            <feColorMatrix in="b" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 26 -11" result="g" />
            <feComposite in="SourceGraphic" in2="g" operator="atop" result="c" />
            <feDropShadow in="c" dx="0" dy="6" stdDeviation="7" floodColor="#000" floodOpacity="0.35" />
          </filter>
          <linearGradient id={ids.fill} gradientUnits="userSpaceOnUse" x1="-30" y1="-150" x2="30" y2="150">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.5" stopColor="#ececea" />
            <stop offset="1" stopColor="#d6d6d2" />
          </linearGradient>
          <radialGradient id={ids.spot}>
            <stop offset="0" stopColor="#0b0b0c" stopOpacity="0.92" />
            <stop offset="0.3" stopColor="#121212" stopOpacity="0.7" />
            <stop offset="0.65" stopColor="#141414" stopOpacity="0.25" />
            <stop offset="1" stopColor="#141414" stopOpacity="0" />
          </radialGradient>
          <clipPath id={ids.clip}>
            <rect className="gdc-cliprect" />
          </clipPath>
        </defs>
        <g className="gdc-g">
          <g filter={"url(#" + ids.goo + ")"} fill={"url(#" + ids.fill + ")"}>
            <rect className="gdc-main" />
            <rect className="gdc-top" />
            <rect className="gdc-bottom" />
          </g>
          <g clipPath={"url(#" + ids.clip + ")"}>
            <circle className="gdc-spotc" cx="0" cy="0" r="150" fill={"url(#" + ids.spot + ")"} style={{ opacity: 0 }} />
          </g>
          <text className="gdc-label gdc-t-idle" y="10" textAnchor="middle">{label}</text>
          <text className="gdc-label gdc-t-ask" y="10" textAnchor="middle" style={{ opacity: 0 }}>{question}</text>
          <text className="gdc-label gdc-t-done" y="10" textAnchor="middle" style={{ opacity: 0 }}>{doneLabel}</text>
          <g className="gdc-i-no" style={{ opacity: 0 }}>
            <path d="M-11 -11L11 11M11 -11L-11 11" stroke="#2b2b2d" strokeWidth="3" strokeLinecap="round" fill="none" />
          </g>
          <g className="gdc-i-yes" style={{ opacity: 0 }}>
            <path d="M-13 1L-4 10L13 -9" stroke="#2b2b2d" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </g>
        </g>
      </svg>
      <button
        ref={mainHit}
        type="button"
        className="gdc-hit"
        aria-label={mode === "done" ? doneLabel : label}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        onClick={() => {
          touch()
          if (mode !== "open") setMode("open")
        }}
      />
      <button
        ref={noHit}
        type="button"
        className="gdc-hit"
        aria-label="Cancel"
        hidden
        onClick={() => {
          touch()
          setMode("idle")
          onCancel?.()
        }}
      />
      <button
        ref={yesHit}
        type="button"
        className="gdc-hit"
        aria-label={"Confirm: " + question}
        hidden
        onClick={() => {
          touch()
          setMode("done")
          onConfirm?.()
        }}
      />
      <span className="gdc-sr" aria-live="polite">{mode === "open" ? question : mode === "done" ? doneLabel : ""}</span>
    </div>
  )
}
