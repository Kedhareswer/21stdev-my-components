"use client"

import React, { useEffect, useRef, useState } from "react"

export interface HoldTraceButtonProps {
  label?: string
  /** Shown above the button while hovering / holding. Empty string hides it. */
  hint?: string
  doneLabel?: string
  undoLabel?: string
  /** How long the press must be held, in ms. */
  holdMs?: number
  /** Fires once the hold completes. */
  onConfirm?: () => void
  /** Fires when Undo is pressed. Undo is offered for `undoMs`; 0 hides it. */
  onUndo?: () => void
  undoMs?: number
  /** Danger colour: the trace, the flood and the text. */
  color?: string
  font?: string
  className?: string
}

const FONT = '"Geist", "Inter", "SF Pro Text", "Segoe UI Variable Text", ui-sans-serif, system-ui, sans-serif'

const CSS =
  "@property --htb-p{syntax:'<number>';inherits:true;initial-value:0}" +
  ".htb-root{--htb-c:#d0233a;--htb-p:0;position:relative;display:inline-flex;flex-direction:column;align-items:center;font-family:var(--htb-font);-webkit-font-smoothing:antialiased;transition:--htb-p var(--htb-rew,380ms) cubic-bezier(.2,.8,.2,1)}" +
  ".htb-root[data-hold]{--htb-p:1;transition:--htb-p var(--htb-ms) linear}" +
  ".htb-root[data-done]{--htb-p:1;transition:none}" +
  ".htb-btn{position:relative;display:inline-flex;align-items:center;gap:9px;height:48px;padding:0 22px 0 18px;border:0;border-radius:999px;cursor:pointer;font:inherit;font-size:15px;font-weight:580;letter-spacing:-.005em;color:var(--htb-c);user-select:none;-webkit-user-select:none;touch-action:manipulation;outline:none;-webkit-tap-highlight-color:transparent;isolation:isolate;" +
  "background:linear-gradient(180deg,#fffafa,#fdeeee);" +
  "box-shadow:inset 0 1px 0 #fff,inset 0 0 0 1px color-mix(in oklab,var(--htb-c) 22%,transparent),0 1px 2px rgba(120,20,30,.08),0 8px 18px -8px color-mix(in oklab,var(--htb-c) 45%,transparent);" +
  "transform:scale(calc(1 - var(--htb-p)*.04));transition:box-shadow .3s,transform .2s}" +
  ".htb-btn:hover{box-shadow:inset 0 1px 0 #fff,inset 0 0 0 1px color-mix(in oklab,var(--htb-c) 35%,transparent),0 1px 2px rgba(120,20,30,.1),0 12px 24px -10px color-mix(in oklab,var(--htb-c) 60%,transparent)}" +
  ".htb-btn:focus-visible{box-shadow:0 0 0 2px #fff,0 0 0 4px var(--htb-c)}" +
  // the flood: crimson rises left to right with the hold, and a white copy of the label rides on top of it
  ".htb-flood{position:absolute;inset:0;border-radius:inherit;z-index:-1;background:linear-gradient(180deg,color-mix(in oklab,var(--htb-c) 82%,#fff),var(--htb-c));clip-path:inset(0 calc((1 - var(--htb-p))*100%) 0 0 round 999px)}" +
  ".htb-face{display:inline-flex;align-items:center;gap:9px}" +
  ".htb-face.htb-white{position:absolute;inset:0;padding:inherit;color:#fff;clip-path:inset(0 calc((1 - var(--htb-p))*100%) 0 0);pointer-events:none}" +
  // the trace: an SVG rect drawn with pathLength=100 so the dash needs no measuring of its own
  ".htb-svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none}" +
  ".htb-trace{fill:none;stroke:var(--htb-c);stroke-width:2.2;stroke-linecap:round;stroke-dasharray:100 100;stroke-dashoffset:calc(100 - var(--htb-p)*100);filter:drop-shadow(0 0 4px color-mix(in oklab,var(--htb-c) 70%,transparent))}" +
  ".htb-ants{fill:none;stroke:var(--htb-c);stroke-width:1.2;stroke-dasharray:1.2 2.2;opacity:0;transition:opacity .3s}" +
  ".htb-btn:hover .htb-ants{opacity:.55;animation:htb-ants 3s linear infinite}.htb-root[data-hold] .htb-ants,.htb-root[data-done] .htb-ants{opacity:0}" +
  // the bin: lid lifts on hover, rattles while held
  ".htb-ico{width:18px;height:18px;flex:none;overflow:visible}" +
  ".htb-lid{transform-origin:19px 6px;transition:transform .35s cubic-bezier(.3,1.6,.5,1)}" +
  ".htb-btn:hover .htb-lid{transform:translateY(-1.5px) rotate(14deg)}" +
  ".htb-root[data-hold] .htb-lid{animation:htb-rattle .14s linear infinite}" +
  ".htb-root[data-hold] .htb-face .htb-ico{animation:htb-shiver .1s linear infinite}" +
  // hint bubble
  ".htb-hint{position:absolute;bottom:calc(100% + 10px);left:50%;padding:6px 10px;border-radius:8px;white-space:nowrap;font-size:12px;font-weight:520;color:#fff;background:#1d1416;box-shadow:0 6px 16px -6px rgba(0,0,0,.5);opacity:0;transform:translate(-50%,4px) scale(.96);transition:opacity .2s,transform .3s cubic-bezier(.3,1.5,.5,1);pointer-events:none}" +
  ".htb-hint::after{content:'';position:absolute;top:100%;left:50%;margin-left:-5px;border:5px solid transparent;border-top-color:#1d1416}" +
  ".htb-hint b{font-weight:620;font-variant-numeric:tabular-nums;color:#ff9aa6}" +
  ".htb-btn:hover+.htb-hint,.htb-btn:focus-visible+.htb-hint,.htb-root[data-hold] .htb-hint{opacity:1;transform:translate(-50%,0)}" +
  ".htb-root[data-done] .htb-hint{opacity:0!important}" +
  // done: the pill flashes, everything inside swaps for the confirmation, and a ring blooms out
  ".htb-swap{display:inline-flex;align-items:center;gap:9px;transition:opacity .25s,transform .45s cubic-bezier(.3,1.5,.5,1),filter .25s}" +
  ".htb-root[data-done] .htb-face{opacity:0;transform:translateY(-10px);filter:blur(4px)}" +
  ".htb-ok{position:absolute;inset:0;display:inline-flex;align-items:center;justify-content:center;gap:8px;color:#fff;opacity:0;transform:translateY(10px);filter:blur(4px);transition:opacity .3s .1s,transform .5s .1s cubic-bezier(.3,1.5,.5,1),filter .3s .1s}" +
  ".htb-root[data-done] .htb-ok{opacity:1;transform:none;filter:none}" +
  ".htb-root[data-done] .htb-btn{animation:htb-pop .5s cubic-bezier(.3,1.6,.5,1)}" +
  ".htb-ring{position:absolute;inset:0;border-radius:999px;pointer-events:none;box-shadow:0 0 0 2px var(--htb-c);opacity:0}" +
  ".htb-root[data-done] .htb-ring{animation:htb-ring .8s cubic-bezier(.2,.7,.2,1)}" +
  ".htb-tick{stroke-dasharray:20;stroke-dashoffset:20}.htb-root[data-done] .htb-tick{animation:htb-draw .45s .2s cubic-bezier(.6,0,.2,1) forwards}" +
  ".htb-undo{margin-top:12px;padding:4px 10px;border:0;border-radius:999px;background:none;font:inherit;font-size:13px;font-weight:560;color:var(--htb-c);cursor:pointer;opacity:0;transform:translateY(-4px);transition:opacity .3s .25s,transform .4s .25s;pointer-events:none}" +
  ".htb-undo:hover{background:color-mix(in oklab,var(--htb-c) 10%,transparent)}.htb-undo:focus-visible{outline:2px solid var(--htb-c);outline-offset:2px}" +
  ".htb-root[data-done] .htb-undo{opacity:1;transform:none;pointer-events:auto}" +
  ".htb-root:not([data-in]) .htb-btn{opacity:0;transform:translateY(8px) scale(.95)}.htb-root[data-in] .htb-btn{transition:box-shadow .3s,transform .7s cubic-bezier(.3,1.5,.5,1),opacity .4s}" +
  "@keyframes htb-ants{to{stroke-dashoffset:-34}}" +
  "@keyframes htb-rattle{0%,100%{transform:translateY(-2px) rotate(10deg)}50%{transform:translateY(-3px) rotate(22deg)}}" +
  "@keyframes htb-shiver{0%,100%{transform:translateX(0)}25%{transform:translateX(-.6px)}75%{transform:translateX(.6px)}}" +
  "@keyframes htb-pop{0%{transform:scale(.96)}45%{transform:scale(1.06)}100%{transform:scale(1)}}" +
  "@keyframes htb-ring{0%{opacity:.8;transform:scale(1)}100%{opacity:0;transform:scale(1.25,1.7)}}" +
  "@keyframes htb-draw{to{stroke-dashoffset:0}}" +
  "@media (prefers-reduced-motion:reduce){.htb-btn,.htb-btn:hover .htb-ants,.htb-lid,.htb-ico,.htb-ring,.htb-swap,.htb-ok{animation:none!important;transition-duration:.01ms!important}.htb-root[data-hold] .htb-lid,.htb-root[data-hold] .htb-face .htb-ico{animation:none}.htb-tick{stroke-dashoffset:0}}"

// #region hold
/** Keys that hold the button down from the keyboard. */
export function isHoldKey(key: string) {
  return key === " " || key === "Enter"
}

/** A short hold snaps back fast; a long one unwinds a little slower, so the rewind always reads. */
export function rewindMs(heldMs: number, holdMs: number) {
  const f = Math.min(1, Math.max(0, heldMs / holdMs))
  return Math.round(160 + f * 260)
}

/** Seconds left on the countdown shown in the hint, one decimal. */
export function secondsLeft(heldMs: number, holdMs: number) {
  return Math.max(0, (holdMs - heldMs) / 1000).toFixed(1)
}
// #endregion

const Bin = ({ lid = true }: { lid?: boolean }) => (
  <svg className="htb-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 8.5h12l-.9 10.6a2 2 0 0 1-2 1.9H8.9a2 2 0 0 1-2-1.9L6 8.5Z" />
    <path d="M10 12v5M14 12v5" />
    {lid && <path className="htb-lid" d="M4 6h16M9.5 6V4.5A1.5 1.5 0 0 1 11 3h2a1.5 1.5 0 0 1 1.5 1.5V6" />}
  </svg>
)

export default function HoldTraceButton({
  label = "Remove",
  hint = "Hold to remove",
  doneLabel = "Removed",
  undoLabel = "Undo",
  holdMs = 1100,
  onConfirm,
  onUndo,
  undoMs = 4000,
  color,
  font = FONT,
  className,
}: HoldTraceButtonProps) {
  const root = useRef(null as HTMLSpanElement | null)
  const btn = useRef(null as HTMLButtonElement | null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [holding, setHolding] = useState(false)
  const [done, setDone] = useState(false)
  const [entered, setEntered] = useState(false)
  const [left, setLeft] = useState(secondsLeft(0, holdMs))
  const startedAt = useRef(0)
  const timer = useRef(0)
  const ticker = useRef(0)
  const undoTimer = useRef(0)

  useEffect(() => {
    const el = btn.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => {
      const b = e.borderBoxSize?.[0]
      setSize({ w: b ? b.inlineSize : e.contentRect.width, h: b ? b.blockSize : e.contentRect.height })
    })
    ro.observe(el)
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setEntered(true)))
    return () => {
      ro.disconnect()
      cancelAnimationFrame(id)
      clearTimeout(timer.current)
      clearInterval(ticker.current)
      clearTimeout(undoTimer.current)
    }
  }, [])

  const start = () => {
    if (done || holding) return
    startedAt.current = performance.now()
    root.current?.style.setProperty("--htb-ms", holdMs + "ms")
    setHolding(true)
    setLeft(secondsLeft(0, holdMs))
    // a coarse countdown for the hint; the trace itself is a CSS transition
    ticker.current = window.setInterval(() => setLeft(secondsLeft(performance.now() - startedAt.current, holdMs)), 100)
    timer.current = window.setTimeout(() => {
      clearInterval(ticker.current)
      setHolding(false)
      setDone(true)
      onConfirm?.()
      if (undoMs > 0) undoTimer.current = window.setTimeout(() => setDone(false), undoMs)
    }, holdMs)
  }
  const cancel = () => {
    if (!holding) return
    clearTimeout(timer.current)
    clearInterval(ticker.current)
    root.current?.style.setProperty("--htb-rew", rewindMs(performance.now() - startedAt.current, holdMs) + "ms")
    setHolding(false)
  }
  const undo = () => {
    clearTimeout(undoTimer.current)
    setDone(false)
    onUndo?.()
    btn.current?.focus()
  }

  const { w, h } = size
  const face = (white: boolean) => (
    <span className={"htb-face htb-swap" + (white ? " htb-white" : "")} aria-hidden={white || undefined}>
      <Bin />
      {label}
    </span>
  )

  return (
    <span
      ref={root}
      className={"htb-root" + (className ? " " + className : "")}
      data-hold={holding ? "" : undefined}
      data-done={done ? "" : undefined}
      data-in={entered ? "" : undefined}
      style={{ ["--htb-font" as string]: font, ...(color ? { ["--htb-c" as string]: color } : {}) } as React.CSSProperties}
    >
      <style>{CSS}</style>
      <button
        ref={btn}
        type="button"
        className="htb-btn"
        aria-label={done ? doneLabel : label + (hint ? " (" + hint.toLowerCase() + ")" : "")}
        aria-disabled={done || undefined}
        onPointerDown={(e) => {
          if (e.button !== 0) return
          e.currentTarget.setPointerCapture?.(e.pointerId)
          start()
        }}
        onPointerUp={cancel}
        onPointerCancel={cancel}
        onLostPointerCapture={cancel}
        onKeyDown={(e) => {
          if (!isHoldKey(e.key)) return
          e.preventDefault()
          if (!e.repeat) start()
        }}
        onKeyUp={(e) => isHoldKey(e.key) && cancel()}
        onBlur={cancel}
        onContextMenu={(e) => e.preventDefault()}
      >
        <span className="htb-flood" />
        {face(false)}
        {face(true)}
        <span className="htb-ok" aria-hidden="true">
          <svg className="htb-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path className="htb-tick" d="M5.5 12.5 10 17 18.5 7.5" />
          </svg>
          {doneLabel}
        </span>
        {w > 0 && (
          <svg className="htb-svg" viewBox={"0 0 " + w + " " + h} aria-hidden="true">
            <rect className="htb-ants" x="1" y="1" width={w - 2} height={h - 2} rx={(h - 2) / 2} pathLength={34} />
            <rect className="htb-trace" x="1" y="1" width={w - 2} height={h - 2} rx={(h - 2) / 2} pathLength={100} />
          </svg>
        )}
        <span className="htb-ring" aria-hidden="true" />
      </button>
      {hint && (
        <span className="htb-hint" aria-hidden="true">
          {holding ? <><b>{left}s</b> keep holding</> : hint}
        </span>
      )}
      {undoMs > 0 && (
        <button type="button" className="htb-undo" onClick={undo} tabIndex={done ? 0 : -1}>
          {undoLabel}
        </button>
      )}
      <span role="status" aria-live="polite" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap" }}>
        {done ? doneLabel : ""}
      </span>
    </span>
  )
}
