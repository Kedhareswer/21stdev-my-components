"use client"

import React, { useEffect, useRef, useState } from "react"

export type CometState = "idle" | "busy" | "done" | "error"

export interface CometOrbitButtonProps {
  /** Resting label. */
  label?: string
  busyLabel?: string
  doneLabel?: string
  errorLabel?: string
  /** Runs on click. Return a promise to hold the orbit until it settles; a rejection shows the error state. */
  onAction?: () => Promise<unknown> | unknown
  /** The orbit always runs at least this long so it reads, in ms. */
  minBusy?: number
  /** Back to idle this long after done / error, in ms. 0 stays put. */
  resetAfter?: number
  /** Comet colour. */
  accent?: string
  /** Success colour. */
  success?: string
  width?: number | string
  font?: string
  className?: string
}

const FONT = '"Geist", "Inter", "SF Pro Text", "Segoe UI Variable Text", ui-sans-serif, system-ui, sans-serif'

const CSS =
  "@property --cob-a{syntax:'<angle>';inherits:true;initial-value:0deg}" +
  ".cob-root{--cob-accent:#f2d6a2;--cob-ok:#63e2ae;--cob-bad:#ff7a6b;--cob-c:var(--cob-accent);position:relative;display:inline-flex;font-family:var(--cob-font);-webkit-font-smoothing:antialiased;isolation:isolate}" +
  ".cob-btn{position:relative;display:flex;align-items:center;justify-content:center;width:100%;height:60px;padding:0 26px;border:0;border-radius:999px;cursor:pointer;color:#f4efe6;font:inherit;font-size:16px;font-weight:540;letter-spacing:-.01em;outline:none;-webkit-tap-highlight-color:transparent;" +
  "background:radial-gradient(140% 120% at 50% -30%,#2b2f36 0%,#15171b 48%,#0b0c0f 100%);" +
  "box-shadow:inset 0 1px 0 rgba(255,255,255,.13),inset 0 -1px 0 rgba(0,0,0,.6),inset 0 0 0 1px rgba(255,255,255,.05),0 1px 2px rgba(0,0,0,.4),0 10px 24px -10px rgba(0,0,0,.7),0 30px 60px -30px rgba(0,0,0,.8);" +
  "transition:transform .45s cubic-bezier(.3,1.6,.5,1),box-shadow .4s}" +
  ".cob-btn:hover{transform:translateY(-1px)}.cob-btn:active{transform:scale(.97)}" +
  ".cob-btn:focus-visible{box-shadow:0 0 0 2px #0b0c0f,0 0 0 4px var(--cob-c),0 10px 24px -10px rgba(0,0,0,.7)}" +
  ".cob-btn[aria-disabled=true]{cursor:default}" +
  // the orbit: a conic comet masked down to a hairline ring, plus a blurred twin behind for the glow
  ".cob-ring,.cob-glow{position:absolute;pointer-events:none;border-radius:999px;background:conic-gradient(from var(--cob-a),transparent 0turn,transparent .42turn,color-mix(in oklab,var(--cob-c) 30%,transparent) .7turn,var(--cob-c) .93turn,#fff .975turn,var(--cob-c) .99turn,transparent 1turn);opacity:0;transition:opacity .5s}" +
  ".cob-ring{inset:0;padding:2.5px;filter:drop-shadow(0 0 3px var(--cob-c));-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box exclude,linear-gradient(#000 0 0);z-index:2}" +
  ".cob-glow{inset:-3px;filter:blur(11px) saturate(1.5) brightness(1.25);z-index:-1}" +
  ".cob-root[data-s=busy] .cob-btn{box-shadow:inset 0 1px 0 rgba(255,255,255,.13),inset 0 -1px 0 rgba(0,0,0,.6),0 1px 2px rgba(0,0,0,.4),0 10px 30px -8px color-mix(in oklab,var(--cob-c) 35%,transparent),0 30px 60px -30px rgba(0,0,0,.8)}" +
  ".cob-root[data-s=idle]:hover .cob-ring,.cob-root[data-s=idle]:focus-within .cob-ring{opacity:.55}.cob-root[data-s=idle]:hover .cob-glow{opacity:.25}" +
  ".cob-root[data-s=idle] .cob-ring,.cob-root[data-s=idle] .cob-glow{animation:cob-spin 4.2s linear infinite}" +
  ".cob-root[data-s=busy] .cob-ring{opacity:1}.cob-root[data-s=busy] .cob-glow{opacity:1}" +
  ".cob-root[data-s=busy] .cob-ring,.cob-root[data-s=busy] .cob-glow{animation:cob-spin 1.3s linear infinite}" +
  // done / error: the comet's tail closes into a full ring
  ".cob-root[data-s=done]{--cob-c:var(--cob-ok)}.cob-root[data-s=error]{--cob-c:var(--cob-bad)}" +
  ".cob-full{position:absolute;inset:0;border-radius:999px;pointer-events:none;box-shadow:inset 0 0 0 1.5px var(--cob-c),0 0 24px -4px var(--cob-c);opacity:0;transition:opacity .5s,box-shadow .5s;z-index:2}" +
  ".cob-root[data-s=done] .cob-full,.cob-root[data-s=error] .cob-full{opacity:1}" +
  ".cob-wave{position:absolute;inset:0;border-radius:999px;pointer-events:none;border:1.5px solid var(--cob-c);opacity:0;z-index:-1}" +
  ".cob-root[data-s=done] .cob-wave{animation:cob-wave .9s cubic-bezier(.2,.7,.2,1) both}" +
  ".cob-root[data-s=error] .cob-btn{animation:cob-shake .5s cubic-bezier(.36,.07,.19,.97) both}" +
  // labels: one row per state, stacked; the live one is the only one in place
  ".cob-stack{position:relative;display:grid;place-items:center;height:24px;overflow:visible}" +
  ".cob-row{grid-area:1/1;display:inline-flex;align-items:center;gap:10px;white-space:nowrap;opacity:0;transform:translateY(14px);filter:blur(6px);transition:opacity .38s,transform .55s cubic-bezier(.2,1.2,.3,1),filter .38s}" +
  ".cob-row[data-on]{opacity:1;transform:none;filter:none}" +
  ".cob-row[data-was]{transform:translateY(-14px)}" +
  ".cob-ico{width:18px;height:18px;flex:none}" +
  ".cob-busy{background:linear-gradient(90deg,rgba(244,239,230,.45) 0%,#fff 45%,var(--cob-accent) 55%,rgba(244,239,230,.45) 100%);background-size:240% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:cob-sheen 1.6s linear infinite}" +
  ".cob-dots{display:inline-flex;gap:3px}.cob-dots i{width:4px;height:4px;border-radius:50%;background:var(--cob-accent);animation:cob-dot 1s ease-in-out infinite}.cob-dots i:nth-child(2){animation-delay:.15s}.cob-dots i:nth-child(3){animation-delay:.3s}" +
  ".cob-check{stroke-dasharray:24;stroke-dashoffset:24}.cob-row[data-on] .cob-check{animation:cob-draw .5s .15s cubic-bezier(.6,0,.2,1) forwards}" +
  ".cob-okc{color:var(--cob-ok)}.cob-badc{color:var(--cob-bad)}" +
  ".cob-root:not([data-in]) .cob-btn{opacity:0;transform:translateY(12px) scale(.96)}" +
  ".cob-root[data-in] .cob-btn{transition:transform .8s cubic-bezier(.3,1.5,.5,1),opacity .5s,box-shadow .4s}" +
  "@keyframes cob-spin{to{--cob-a:360deg}}" +
  "@keyframes cob-wave{0%{opacity:.9;transform:scale(1)}100%{opacity:0;transform:scale(1.18,1.55)}}" +
  "@keyframes cob-shake{10%,90%{transform:translateX(-1px)}20%,80%{transform:translateX(3px)}30%,50%,70%{transform:translateX(-6px)}40%,60%{transform:translateX(6px)}}" +
  "@keyframes cob-sheen{from{background-position:120% 0}to{background-position:-120% 0}}" +
  "@keyframes cob-dot{0%,100%{opacity:.25;transform:translateY(0)}50%{opacity:1;transform:translateY(-3px)}}" +
  "@keyframes cob-draw{to{stroke-dashoffset:0}}" +
  "@media (prefers-reduced-motion:reduce){.cob-root .cob-ring,.cob-root .cob-glow,.cob-busy,.cob-dots i,.cob-root .cob-wave,.cob-root .cob-btn{animation:none!important}.cob-row{transform:none!important;filter:none!important}.cob-root[data-s=busy] .cob-ring{background:none;box-shadow:inset 0 0 0 1.5px var(--cob-c)}.cob-check{stroke-dashoffset:0}}"

// #region states
export const STATES = ["idle", "busy", "done", "error"] as const

/** Where a click / settle / timeout leads. Clicks only start from idle. */
export function next(state: CometState, event: "click" | "resolve" | "reject" | "reset"): CometState {
  if (event === "click") return state === "idle" ? "busy" : state
  if (event === "resolve") return state === "busy" ? "done" : state
  if (event === "reject") return state === "busy" ? "error" : state
  return state === "done" || state === "error" ? "idle" : state
}

/** How long to keep orbiting after the action settled, so the orbit always runs at least `min` ms. */
export function holdFor(startedAt: number, settledAt: number, min: number) {
  return Math.max(0, min - (settledAt - startedAt))
}
// #endregion

const Tray = () => (
  <svg className="cob-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3.5v11M7.5 10 12 14.5 16.5 10M4 15.5v2.5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2.5" />
  </svg>
)
const Check = () => (
  <svg className="cob-ico cob-okc" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9.2" opacity=".35" />
    <path className="cob-check" d="M7.8 12.3 10.8 15.2 16.4 9.2" />
  </svg>
)
const Alert = () => (
  <svg className="cob-ico cob-badc" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9.2" opacity=".4" />
    <path d="M12 7.5v5.5M12 16.3v.2" />
  </svg>
)

export default function CometOrbitButton({
  label = "Withdraw $1,240.00",
  busyLabel = "Processing",
  doneLabel = "Sent to •• 4021",
  errorLabel = "Declined — try again",
  onAction,
  minBusy = 1800,
  resetAfter = 2800,
  accent,
  success,
  width = 320,
  font = FONT,
  className,
}: CometOrbitButtonProps) {
  const [state, setState] = useState("idle" as CometState)
  const [prev, setPrev] = useState(null as CometState | null)
  const [entered, setEntered] = useState(false)
  const timers = useRef([] as number[])
  const alive = useRef(true)

  const go = (s: CometState, from: CometState) => {
    if (!alive.current) return
    setPrev(from)
    setState(s)
  }
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms))

  useEffect(() => {
    alive.current = true
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setEntered(true)))
    return () => {
      alive.current = false
      cancelAnimationFrame(id)
      timers.current.forEach(clearTimeout)
      timers.current = []
    }
  }, [])

  useEffect(() => {
    if ((state === "done" || state === "error") && resetAfter > 0) later(() => go(next(state, "reset"), state), resetAfter)
  }, [state, resetAfter])

  const settle = (ok: boolean, startedAt: number) => {
    later(() => go(next("busy", ok ? "resolve" : "reject"), "busy"), holdFor(startedAt, Date.now(), minBusy))
  }

  const onClick = () => {
    if (next(state, "click") !== "busy") return
    go("busy", state)
    const startedAt = Date.now()
    let result: unknown
    try {
      result = onAction?.()
    } catch {
      settle(false, startedAt)
      return
    }
    if (result && typeof (result as Promise<unknown>).then === "function")
      (result as Promise<unknown>).then(() => settle(true, startedAt), () => settle(false, startedAt))
    else settle(true, startedAt)
  }

  const row = (s: CometState, content: React.ReactNode) => (
    <span className="cob-row" data-on={state === s ? "" : undefined} data-was={prev === s && state !== s ? "" : undefined} aria-hidden={state !== s}>
      {content}
    </span>
  )
  const live = state === "idle" ? label : state === "busy" ? busyLabel : state === "done" ? doneLabel : errorLabel

  return (
    <span
      className={"cob-root" + (className ? " " + className : "")}
      data-s={state}
      data-in={entered ? "" : undefined}
      style={{ width, maxWidth: "100%", ["--cob-font" as string]: font, ...(accent ? { ["--cob-accent" as string]: accent } : {}), ...(success ? { ["--cob-ok" as string]: success } : {}) } as React.CSSProperties}
    >
      <style>{CSS}</style>
      <span className="cob-glow" aria-hidden="true" />
      <button type="button" className="cob-btn" onClick={onClick} aria-disabled={state !== "idle"} aria-label={live}>
        <span className="cob-stack">
          {row("idle", <><Tray />{label}</>)}
          {row("busy", <><span className="cob-busy">{busyLabel}</span><span className="cob-dots"><i /><i /><i /></span></>)}
          {row("done", <><Check />{doneLabel}</>)}
          {row("error", <><Alert />{errorLabel}</>)}
        </span>
        <span className="cob-ring" aria-hidden="true" />
        <span className="cob-full" aria-hidden="true" />
        <span className="cob-wave" aria-hidden="true" />
      </button>
      <span role="status" aria-live="polite" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap" }}>
        {state === "idle" ? "" : live}
      </span>
    </span>
  )
}
