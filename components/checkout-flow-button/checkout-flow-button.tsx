"use client"

import React, { useEffect, useRef, useState } from "react"

export interface PayCard {
  id: string
  /** Shown on the chip, e.g. "•• 4242". */
  last4: string
  /** Short name, e.g. "Onyx". */
  name: string
  /** Two colours for the chip's face. */
  from: string
  to: string
}

export type FlowStep = "idle" | "choose" | "confirm" | "busy" | "done" | "error"

export interface CheckoutFlowButtonProps {
  /** Formatted amount, e.g. "$129.00". */
  amount?: string
  cards?: PayCard[]
  /** Charges the chosen card. Return a promise; a rejection shows the error step. */
  onPay?: (card: PayCard) => Promise<unknown> | unknown
  /** Receipt text on success. */
  receipt?: string
  /** Back to idle this long after done / error, in ms. 0 stays put. */
  resetAfter?: number
  /** The authorizing bar always runs at least this long, in ms. */
  minBusy?: number
  font?: string
  className?: string
}

const FONT = '"Geist", "Inter", "SF Pro Text", "Segoe UI Variable Text", ui-sans-serif, system-ui, sans-serif'

const CARDS: PayCard[] = [
  { id: "onyx", name: "Onyx", last4: "4242", from: "#3b3f46", to: "#0f1013" },
  { id: "saffron", name: "Saffron", last4: "8817", from: "#ffcf6e", to: "#e2722b" },
  { id: "tide", name: "Tide", last4: "0019", from: "#6fd3ff", to: "#3a52e0" },
]

const CSS =
  ".cfb-root{--cfb-ok:#2fbf7f;--cfb-bad:#e5484d;position:relative;display:inline-flex;max-width:100%;font-family:var(--cfb-font);-webkit-font-smoothing:antialiased}" +
  ".cfb-pill{position:relative;height:56px;width:var(--cfb-w);max-width:100%;border-radius:999px;overflow:hidden;isolation:isolate;color:#fafafa;" +
  "background:radial-gradient(140% 140% at 50% -40%,#34363c 0%,#141518 55%,#08090b 100%);" +
  "box-shadow:inset 0 1px 0 rgba(255,255,255,.14),inset 0 -1px 0 rgba(0,0,0,.6),0 1px 2px rgba(0,0,0,.25),0 12px 28px -12px rgba(0,0,0,.6),0 30px 50px -30px rgba(0,0,0,.6);" +
  "transition:width .62s cubic-bezier(.3,1.25,.4,1),background .5s,box-shadow .5s}" +
  ".cfb-root[data-s=done] .cfb-pill{background:radial-gradient(140% 140% at 50% -40%,#4fe0a0 0%,#22a86b 55%,#167a4d 100%);box-shadow:inset 0 1px 0 rgba(255,255,255,.35),0 12px 28px -10px rgba(34,168,107,.65)}" +
  ".cfb-root[data-s=error] .cfb-pill{animation:cfb-shake .5s cubic-bezier(.36,.07,.19,.97)}" +
  // authorizing: a lit bar fills the pill from the left over the busy time, with a sheen running across it
  ".cfb-bar{position:absolute;inset:0;z-index:-1;transform-origin:left;transform:scaleX(0);background:linear-gradient(90deg,rgba(255,255,255,.05),rgba(255,255,255,.14));opacity:0;transition:opacity .3s}" +
  ".cfb-root[data-s=busy] .cfb-bar{opacity:1;animation:cfb-fill var(--cfb-busy) cubic-bezier(.3,.1,.2,1) forwards}" +
  ".cfb-bar::after{content:'';position:absolute;inset:0 auto 0 0;width:40%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.22),transparent);animation:cfb-sheen 1.1s linear infinite}" +
  // one row per step, stacked; only the live row is visible and focusable
  ".cfb-row{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:10px;padding:0 8px;opacity:0;visibility:hidden;transform:translateY(16px) scale(.97);filter:blur(5px);transition:opacity .3s,transform .5s cubic-bezier(.2,1.2,.3,1),filter .3s,visibility 0s .5s}" +
  ".cfb-row[data-on]{opacity:1;visibility:visible;transform:none;filter:none;transition:opacity .35s .12s,transform .6s .12s cubic-bezier(.2,1.2,.3,1),filter .35s .12s,visibility 0s}" +
  ".cfb-row[data-was]{transform:translateY(-16px) scale(.97)}" +
  ".cfb-act{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;height:100%;padding:0 22px;border:0;border-radius:999px;background:none;color:inherit;font:inherit;font-size:15.5px;font-weight:580;letter-spacing:-.01em;cursor:pointer;outline:none;white-space:nowrap}" +
  ".cfb-act:focus-visible,.cfb-chip:focus-visible,.cfb-x:focus-visible{box-shadow:inset 0 0 0 2px rgba(255,255,255,.75)}" +
  ".cfb-act:hover .cfb-lock{transform:translateY(-1px) rotate(-8deg)}" +
  ".cfb-ico{width:17px;height:17px;flex:none}.cfb-lock{transition:transform .35s cubic-bezier(.3,1.6,.5,1)}" +
  ".cfb-amt{font-variant-numeric:tabular-nums;opacity:.72;font-weight:520}" +
  // the card chips
  ".cfb-chips{display:flex;gap:6px;min-width:0;flex:0 1 auto}" +
  ".cfb-chip{position:relative;display:flex;flex-direction:column;justify-content:space-between;width:80px;height:42px;padding:5px 7px;border:0;border-radius:9px;cursor:pointer;text-align:left;color:#fff;font:inherit;outline:none;overflow:hidden;" +
  "background:linear-gradient(135deg,var(--a),var(--b));box-shadow:inset 0 1px 0 rgba(255,255,255,.35),inset 0 0 0 1px rgba(255,255,255,.12),0 4px 10px -4px rgba(0,0,0,.6);transform:translateY(calc(var(--n)*6px)) rotate(calc(var(--n)*-4deg));opacity:0;transition:transform .5s cubic-bezier(.3,1.5,.5,1),box-shadow .2s}" +
  ".cfb-row[data-on] .cfb-chip{transform:none;opacity:1;transition:transform .55s calc(.12s + var(--n)*60ms) cubic-bezier(.3,1.5,.5,1),opacity .3s calc(.12s + var(--n)*60ms),box-shadow .2s}" +
  ".cfb-chip:hover{transform:translateY(-3px)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.4),0 8px 16px -6px rgba(0,0,0,.7)}" +
  ".cfb-chip::before{content:'';position:absolute;inset:0;background:linear-gradient(115deg,transparent 30%,rgba(255,255,255,.35) 45%,transparent 60%);transform:translateX(-100%);transition:transform .6s}" +
  ".cfb-chip:hover::before{transform:translateX(100%)}" +
  ".cfb-chip b{max-width:46px;overflow:hidden;text-overflow:clip;white-space:nowrap;font-size:8.5px;font-weight:650;letter-spacing:.06em;text-transform:uppercase;opacity:.9}" +
  ".cfb-chip span{font-size:11px;font-variant-numeric:tabular-nums;letter-spacing:.06em}" +
  ".cfb-emv{position:absolute;right:7px;top:7px;width:12px;height:9px;border-radius:2.5px;background:linear-gradient(135deg,#f7e3a1,#c8a14f);box-shadow:inset 0 0 0 .5px rgba(0,0,0,.25)}" +
  ".cfb-chip.cfb-mini{width:46px;height:30px;padding:3px 5px;cursor:default;opacity:1;transform:none}.cfb-mini{justify-content:flex-end}.cfb-mini .cfb-emv{width:9px;height:7px;top:5px;left:5px;right:auto}.cfb-mini span{font-size:8.5px;letter-spacing:0}" +
  ".cfb-x{display:grid;place-items:center;width:30px;height:30px;flex:none;border:0;border-radius:50%;background:rgba(255,255,255,.08);color:#d9d9de;cursor:pointer;outline:none;transition:background .2s}.cfb-x:hover{background:rgba(255,255,255,.16)}" +
  ".cfb-hint{font-size:12.5px;color:#a5a7ad;white-space:nowrap}" +
  ".cfb-spin{width:17px;height:17px;border-radius:50%;border:2px solid rgba(255,255,255,.2);border-top-color:#fff;animation:cfb-spin .7s linear infinite}" +
  ".cfb-tick{stroke-dasharray:22;stroke-dashoffset:22}.cfb-row[data-on] .cfb-tick{animation:cfb-draw .45s .3s cubic-bezier(.6,0,.2,1) forwards}" +
  ".cfb-root:not([data-in]) .cfb-pill{opacity:0;transform:translateY(10px) scale(.95)}.cfb-root[data-in] .cfb-pill{transition:width .62s cubic-bezier(.3,1.25,.4,1),background .5s,box-shadow .5s,transform .7s cubic-bezier(.3,1.5,.5,1),opacity .4s}" +
  "@keyframes cfb-fill{to{transform:scaleX(1)}}" +
  "@keyframes cfb-sheen{from{transform:translateX(-100%)}to{transform:translateX(260%)}}" +
  "@keyframes cfb-spin{to{transform:rotate(360deg)}}" +
  "@keyframes cfb-draw{to{stroke-dashoffset:0}}" +
  "@keyframes cfb-shake{10%,90%{transform:translateX(-1px)}20%,80%{transform:translateX(3px)}30%,50%,70%{transform:translateX(-6px)}40%,60%{transform:translateX(6px)}}" +
  "@media (prefers-reduced-motion:reduce){.cfb-pill,.cfb-row,.cfb-chip,.cfb-row[data-on] .cfb-chip{transition-duration:.01ms!important;transition-delay:0s!important;transform:none!important;filter:none!important}.cfb-bar::after,.cfb-spin,.cfb-root[data-s=error] .cfb-pill{animation:none}.cfb-tick{stroke-dashoffset:0}}"

// #region flow
/** Pill width for each step, in px. */
export const WIDTHS: Record<FlowStep, number> = { idle: 214, choose: 356, confirm: 306, busy: 306, done: 260, error: 306 }

/** Where an event leads. Anything that doesn't fit the current step is ignored. */
export function step(s: FlowStep, ev: "open" | "pick" | "back" | "pay" | "resolve" | "reject" | "retry" | "reset"): FlowStep {
  switch (ev) {
    case "open": return s === "idle" ? "choose" : s
    case "pick": return s === "choose" ? "confirm" : s
    case "back": return s === "choose" ? "idle" : s === "confirm" ? "choose" : s
    case "pay": return s === "confirm" ? "busy" : s
    case "resolve": return s === "busy" ? "done" : s
    case "reject": return s === "busy" ? "error" : s
    case "retry": return s === "error" ? "confirm" : s
    case "reset": return s === "done" || s === "error" ? "idle" : s
  }
}

export function holdFor(startedAt: number, settledAt: number, min: number) {
  return Math.max(0, min - (settledAt - startedAt))
}
// #endregion

const Lock = () => (
  <svg className="cfb-ico cfb-lock" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="5" y="10.5" width="14" height="9.5" rx="2.5" />
    <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
  </svg>
)

function Chip({ card, n, mini, onPick, tab }: { card: PayCard; n: number; mini?: boolean; onPick?: () => void; tab?: number }) {
  const style = { ["--a" as string]: card.from, ["--b" as string]: card.to, ["--n" as string]: n } as React.CSSProperties
  const inner = (
    <>
      <i className="cfb-emv" />
      {!mini && <b>{card.name}</b>}
      <span>•• {card.last4}</span>
    </>
  )
  return mini ? (
    <span className="cfb-chip cfb-mini" style={style} aria-hidden="true">{inner}</span>
  ) : (
    <button type="button" className="cfb-chip" style={style} onClick={onPick} tabIndex={tab} aria-label={"Pay with " + card.name + " ending " + card.last4}>
      {inner}
    </button>
  )
}

export default function CheckoutFlowButton({
  amount = "$129.00",
  cards = CARDS,
  onPay,
  receipt = "Paid · Receipt A-2931",
  resetAfter = 3200,
  minBusy = 1900,
  font = FONT,
  className,
}: CheckoutFlowButtonProps) {
  const [s, setS] = useState("idle" as FlowStep)
  const [prev, setPrev] = useState(null as FlowStep | null)
  const [card, setCard] = useState(cards[0] as PayCard | undefined)
  const [entered, setEntered] = useState(false)
  const timers = useRef([] as number[])
  const alive = useRef(true)
  const root = useRef(null as HTMLDivElement | null)

  const go = (to: FlowStep) => {
    if (!alive.current) return
    setS((from) => {
      if (from !== to) setPrev(from)
      return to
    })
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
    if ((s === "done" || s === "error") && resetAfter > 0) later(() => go(step(s, "reset")), resetAfter)
    // keep keyboard focus inside the pill as its contents swap
    const el = root.current?.querySelector('.cfb-row[data-on] button') as HTMLButtonElement | null
    if (el && root.current?.contains(document.activeElement)) el.focus({ preventScroll: true })
  }, [s])

  const pay = () => {
    if (!card || step(s, "pay") !== "busy") return
    go("busy")
    const startedAt = Date.now()
    const settle = (ok: boolean) => later(() => go(step("busy", ok ? "resolve" : "reject")), holdFor(startedAt, Date.now(), minBusy))
    let r: unknown
    try {
      r = onPay?.(card)
    } catch {
      settle(false)
      return
    }
    if (r && typeof (r as Promise<unknown>).then === "function") (r as Promise<unknown>).then(() => settle(true), () => settle(false))
    else settle(true)
  }

  const row = (id: FlowStep, content: React.ReactNode) => (
    <div className="cfb-row" data-on={s === id ? "" : undefined} data-was={prev === id && s !== id ? "" : undefined} aria-hidden={s !== id}>
      {content}
    </div>
  )
  const tab = (id: FlowStep) => (s === id ? 0 : -1)
  const live = { idle: "", choose: "Choose a card", confirm: "Confirm " + amount, busy: "Authorizing", done: receipt, error: "Payment declined" }[s]

  return (
    <div
      ref={root}
      role="group"
      aria-label={"Pay " + amount}
      className={"cfb-root" + (className ? " " + className : "")}
      data-s={s}
      data-in={entered ? "" : undefined}
      style={{ ["--cfb-font" as string]: font, ["--cfb-w" as string]: WIDTHS[s] + "px", ["--cfb-busy" as string]: minBusy + "ms" } as React.CSSProperties}
    >
      <style>{CSS}</style>
      <div className="cfb-pill">
        <span className="cfb-bar" aria-hidden="true" />
        {row(
          "idle",
          <button type="button" className="cfb-act" tabIndex={tab("idle")} onClick={() => go(step(s, "open"))}>
            <Lock />
            Pay <span className="cfb-amt">{amount}</span>
          </button>,
        )}
        {row(
          "choose",
          <>
            <button type="button" className="cfb-x" tabIndex={tab("choose")} onClick={() => go(step(s, "back"))} aria-label="Cancel">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M2 2l8 8M10 2 2 10" /></svg>
            </button>
            <div className="cfb-chips">
              {cards.slice(0, 3).map((c, i) => (
                <Chip key={c.id} card={c} n={i} tab={tab("choose")} onPick={() => { setCard(c); go(step(s, "pick")) }} />
              ))}
            </div>
          </>,
        )}
        {row(
          "confirm",
          <>
            <button type="button" className="cfb-x" tabIndex={tab("confirm")} onClick={() => go(step(s, "back"))} aria-label="Change card">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7.5 2 3.5 6l4 4" /></svg>
            </button>
            {card && <Chip card={card} n={0} mini />}
            <button type="button" className="cfb-act" style={{ width: "auto", padding: "0 14px 0 6px" }} tabIndex={tab("confirm")} onClick={pay}>
              Confirm <span className="cfb-amt">{amount}</span>
            </button>
          </>,
        )}
        {row(
          "busy",
          <span className="cfb-act" style={{ cursor: "default" }}>
            <span className="cfb-spin" aria-hidden="true" />
            Authorizing<span className="cfb-hint">•• {card?.last4}</span>
          </span>,
        )}
        {row(
          "done",
          <span className="cfb-act" style={{ cursor: "default" }}>
            <svg className="cfb-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path className="cfb-tick" d="M5 12.5 9.8 17 19 7.5" />
            </svg>
            {receipt}
          </span>,
        )}
        {row(
          "error",
          <button type="button" className="cfb-act" tabIndex={tab("error")} onClick={() => go(step(s, "retry"))} style={{ color: "#ffb3b5" }}>
            Declined · try another card
          </button>,
        )}
      </div>
      <span role="status" aria-live="polite" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap" }}>
        {live}
      </span>
    </div>
  )
}
