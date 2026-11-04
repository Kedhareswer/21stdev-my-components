"use client"

import * as React from "react"

export type ShareSlice = { label: string; value: number; color: string }
export type SharePeriod = { label: string; slices: ShareSlice[] }

export type ChannelShareBarProps = {
  title?: string
  subtitle?: string
  /** word after the total, e.g. "tickets" */
  unit?: string
  periods?: SharePeriod[]
  /** index of the period shown first */
  defaultPeriod?: number
  /** slices at or above this share (0-100) show their percentage inside the bar; thinner ones get a callout below */
  inlineMin?: number
  /** slices at or above this share also show their name inside the bar */
  labelMin?: number
  className?: string
}

const C = {
  email: "#4f6fa8",
  chat: "#2f8a68",
  phone: "#c98a2e",
  help: "#b4506a",
  social: "#7d7a8c",
  other: "#5a5a60",
}

const DEFAULT_PERIODS: SharePeriod[] = [
  {
    label: "Week",
    slices: [
      { label: "Email", value: 1720, color: C.email },
      { label: "Chat", value: 1490, color: C.chat },
      { label: "Phone", value: 610, color: C.phone },
      { label: "Help center", value: 280, color: C.help },
      { label: "Social", value: 160, color: C.social },
      { label: "Other", value: 64, color: C.other },
    ],
  },
  {
    label: "Month",
    slices: [
      { label: "Email", value: 7310, color: C.email },
      { label: "Chat", value: 5820, color: C.chat },
      { label: "Phone", value: 2140, color: C.phone },
      { label: "Help center", value: 1460, color: C.help },
      { label: "Social", value: 690, color: C.social },
      { label: "Other", value: 300, color: C.other },
    ],
  },
  {
    label: "Quarter",
    slices: [
      { label: "Email", value: 8410, color: C.email },
      { label: "Chat", value: 6115, color: C.chat },
      { label: "Phone", value: 2490, color: C.phone },
      { label: "Help center", value: 1832, color: C.help },
      { label: "Social", value: 755, color: C.social },
      { label: "Other", value: 318, color: C.other },
    ],
  },
]

// #region math
/** Shares in percent, rounded to one decimal, nudged so they add up to exactly 100. */
export function shares(values: number[]): number[] {
  const total = values.reduce((a, b) => a + b, 0)
  if (total <= 0) return values.map(() => 0)
  const raw = values.map((v) => (v / total) * 1000)
  const out = raw.map(Math.floor)
  let left = 1000 - out.reduce((a, b) => a + b, 0)
  const order = raw.map((r, i) => [r - Math.floor(r), i]).sort((a, b) => b[0] - a[0])
  for (let k = 0; left > 0; k++, left--) out[order[k % order.length][1]]++
  return out.map((n) => n / 10)
}
/** Where each slice starts along the bar, in percent. */
export function starts(pcts: number[]): number[] {
  let at = 0
  return pcts.map((p) => {
    const s = at
    at += p
    return s
  })
}
// #endregion

const ease = (t: number) => 1 - Math.pow(1 - t, 3)

/** Tweens a list of numbers toward `to`; no layout reads, values only. */
function useTween(to: number[], ms: number) {
  const [shown, setShown] = React.useState(to)
  const from = React.useRef(to)
  const key = to.join(",")
  React.useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const start = from.current
    if (reduce || start.length !== to.length) {
      from.current = to
      setShown(to)
      return
    }
    let raf = 0
    const t0 = performance.now()
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / ms)
      const e = ease(k)
      const next = to.map((v, i) => start[i] + (v - start[i]) * e)
      from.current = next
      setShown(next)
      if (k < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ms])
  return shown
}

const CSS =
  ".csb-root{--csb-ease:cubic-bezier(.22,1,.36,1);position:relative;width:100%;max-width:640px;min-width:0;padding:24px;border-radius:24px;" +
  "background:var(--color-background);color:var(--color-foreground);border:1px solid var(--color-border);" +
  "font-family:ui-sans-serif,system-ui,sans-serif;font-variant-numeric:tabular-nums;box-sizing:border-box}" +
  ".csb-root *{box-sizing:border-box}" +
  ".csb-tabs{position:relative;display:inline-grid;grid-auto-flow:column;grid-auto-columns:1fr;padding:3px;border-radius:999px;" +
  "background:color-mix(in oklab,var(--color-foreground) 7%,transparent)}" +
  ".csb-pill{position:absolute;top:3px;bottom:3px;left:3px;border-radius:999px;background:var(--color-background);" +
  "box-shadow:0 1px 2px rgba(0,0,0,.12),0 0 0 1px var(--color-border);transition:transform .45s var(--csb-ease)}" +
  ".csb-tab{position:relative;z-index:1;border:0;background:none;color:var(--color-muted-foreground);font-weight:500;font-size:12px;line-height:1;" +
  "padding:7px 14px;border-radius:999px;cursor:pointer;transition:color .3s}" +
  ".csb-tab[aria-selected=true]{color:var(--color-foreground)}" +
  ".csb-tab:focus-visible{outline:2px solid var(--color-primary);outline-offset:1px}" +
  ".csb-head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin:22px 0 14px}" +
  ".csb-title{margin:0;font-weight:600;font-size:15px;line-height:1.3}" +
  ".csb-sub{margin:4px 0 0;font-weight:400;font-size:12px;line-height:1.3;color:var(--color-muted-foreground)}" +
  ".csb-total{text-align:right;font-weight:400;font-size:12px;line-height:1.2;color:var(--color-muted-foreground);white-space:nowrap}" +
  ".csb-total b{display:block;margin-top:2px;font-weight:600;font-size:24px;line-height:1;letter-spacing:-.02em;color:var(--color-foreground)}" +
  ".csb-bar{position:relative;display:flex;gap:3px;height:40px}" +
  ".csb-seg{position:relative;min-width:6px;flex-basis:0;border:0;padding:0 10px;border-radius:7px;background:var(--c);" +
  "display:flex;align-items:center;overflow:hidden;cursor:pointer;color:#fff;font-weight:500;font-size:12px;line-height:1;white-space:nowrap;" +
  "transition:flex-grow .7s var(--csb-ease),opacity .25s,filter .25s}" +
  ".csb-seg::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(255,255,255,.16),transparent 55%);pointer-events:none}" +
  ".csb-seg:first-child{border-radius:12px 7px 7px 12px}.csb-seg:last-child{border-radius:7px 12px 12px 7px}" +
  ".csb-seg:focus-visible{outline:2px solid var(--color-primary);outline-offset:2px}" +
  ".csb-seg>span{transition:opacity .3s}" +
  ".csb-dim .csb-seg:not([data-on]){opacity:.32;filter:saturate(.4)}" +
  ".csb-dim .csb-key:not([data-on]){opacity:.4}" +
  ".csb-calls{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:6px 14px;min-height:30px;margin-top:6px;padding-top:9px;position:relative}" +
  ".csb-calls::before{content:'';position:absolute;top:0;right:6px;height:6px;border-right:1px solid var(--color-border);border-bottom:1px solid var(--color-border);border-bottom-right-radius:4px;width:var(--w)}" +
  ".csb-call{display:flex;align-items:center;gap:6px;font-size:11px;line-height:1;color:var(--color-muted-foreground);white-space:nowrap}" +
  ".csb-call i{width:7px;height:7px;border-radius:2px;background:var(--c)}" +
  ".csb-call b{font-weight:500;color:var(--color-foreground)}" +
  ".csb-legend{display:flex;flex-wrap:wrap;gap:10px 18px;margin:8px 0 0;padding:0;list-style:none}" +
  ".csb-key{display:flex;align-items:center;gap:7px;font-weight:400;font-size:12px;line-height:1;color:var(--color-muted-foreground);transition:opacity .25s}" +
  ".csb-key i{width:9px;height:9px;border-radius:3px;background:var(--c)}" +
  ".csb-key b{font-weight:500;color:var(--color-foreground)}" +
  "@media (max-width:480px){.csb-root{padding:18px}.csb-head{flex-direction:column;align-items:flex-start}.csb-total{text-align:left}}" +
  "@media (prefers-reduced-motion:reduce){.csb-pill,.csb-seg,.csb-call,.csb-key,.csb-seg>span{transition:none}}"

export function ChannelShareBar({
  title = "Support tickets by channel",
  subtitle = "Opened on the help desk",
  unit = "tickets",
  periods = DEFAULT_PERIODS,
  defaultPeriod = periods.length - 1,
  inlineMin = 7,
  labelMin = 20,
  className,
}: ChannelShareBarProps) {
  const [period, setPeriod] = React.useState(Math.min(Math.max(0, defaultPeriod), periods.length - 1))
  const [hot, setHot] = React.useState(-1)
  const slices = periods[period]?.slices ?? []
  const pcts = shares(slices.map((s) => s.value))
  const total = slices.reduce((a, s) => a + s.value, 0)
  const [shownTotal, ...shownPcts] = useTween([total, ...pcts], 700)
  const at = starts(pcts)
  const small = slices.map((_, i) => i).filter((i) => pcts[i] < inlineMin)
  const n = periods.length

  const onTabKey = (e: React.KeyboardEvent) => {
    const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0
    if (!d) return
    e.preventDefault()
    setPeriod((p) => (p + d + n) % n)
  }

  return (
    <div className={"csb-root" + (hot >= 0 ? " csb-dim" : "") + (className ? " " + className : "")}>
      <style>{CSS}</style>
      <div className="csb-tabs" role="tablist" aria-label="Period" onKeyDown={onTabKey}>
        <span
          className="csb-pill"
          aria-hidden
          style={{ width: "calc((100% - 6px) / " + n + ")", transform: "translateX(" + period * 100 + "%)" }}
        />
        {periods.map((p, i) => (
          <button
            key={p.label}
            type="button"
            role="tab"
            className="csb-tab"
            aria-selected={i === period}
            tabIndex={i === period ? 0 : -1}
            onClick={() => setPeriod(i)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="csb-head">
        <div>
          <p className="csb-title">{title}</p>
          <p className="csb-sub">{subtitle}</p>
        </div>
        <div className="csb-total" aria-live="polite">
          Total
          <b>
            {Math.round(shownTotal ?? total).toLocaleString("en-US")}{" "}
            <span style={{ fontSize: 12, fontWeight: 400, color: "var(--color-muted-foreground)" }}>{unit}</span>
          </b>
        </div>
      </div>

      <div className="csb-bar" onMouseLeave={() => setHot(-1)}>
        {slices.map((s, i) => (
          <button
            key={s.label}
            type="button"
            className="csb-seg"
            data-on={hot === i ? "" : undefined}
            aria-label={s.label + ": " + pcts[i] + "%, " + s.value.toLocaleString("en-US") + " " + unit}
            style={{ flexGrow: Math.max(pcts[i], 0.001), ["--c" as string]: s.color }}
            onMouseEnter={() => setHot(i)}
            onFocus={() => setHot(i)}
            onBlur={() => setHot(-1)}
          >
            <span style={{ opacity: pcts[i] >= inlineMin ? 1 : 0 }}>
              {pcts[i] >= labelMin ? s.label + " " : ""}
              {(shownPcts[i] ?? pcts[i]).toFixed(1)}%
            </span>
          </button>
        ))}
      </div>

      <div
        className="csb-calls"
        aria-hidden
        style={{ ["--w" as string]: small.length ? "calc(" + (100 - (small.length ? at[small[0]] : 100)) + "% - 6px)" : "0px", visibility: small.length ? "visible" : "hidden" }}
      >
        {small.map((i) => (
          <span key={slices[i].label} className="csb-call" style={{ ["--c" as string]: slices[i].color }}>
            <i />
            {slices[i].label} <b>{(shownPcts[i] ?? pcts[i]).toFixed(1)}%</b>
          </span>
        ))}
      </div>

      <ul className="csb-legend">
        {slices.map((s, i) => (
          <li key={s.label} className="csb-key" data-on={hot === i ? "" : undefined} style={{ ["--c" as string]: s.color }}>
            <i />
            {s.label}
            <b>{(shownPcts[i] ?? pcts[i]).toFixed(1)}%</b>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default ChannelShareBar
