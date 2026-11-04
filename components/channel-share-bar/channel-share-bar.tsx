"use client"

import * as React from "react"

export type ShareSlice = { label: string; value: number; color: string }
export type SharePeriod = { label: string; slices: ShareSlice[] }

export type ChannelShareBarProps = {
  title?: string
  subtitle?: string
  /** small caps line above the title */
  eyebrow?: string
  /** word after the total, e.g. "tickets" */
  unit?: string
  periods?: SharePeriod[]
  /** index of the period shown first */
  defaultPeriod?: number
  /** slices at or above this share (0-100) show their percentage inside the bar; thinner ones get a callout below */
  inlineMin?: number
  /** slices at or above this share also show their name inside the bar */
  labelMin?: number
  /** "dark" is the ink panel, "light" the paper one */
  tone?: "dark" | "light"
  className?: string
}

const C = {
  email: "#5b7fd6",
  chat: "#2fae84",
  phone: "#e3a042",
  help: "#d9607f",
  social: "#9a8fd6",
  other: "#7d8597",
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
/** Percent change from `before` to `after`, one decimal; null when there is no base. */
export function change(before: number, after: number): number | null {
  if (!before) return null
  return Math.round(((after - before) / before) * 1000) / 10
}
// #endregion

const ease = (t: number) => 1 - Math.pow(1 - t, 3)

/** Tweens a list of numbers toward `to`; values only, never layout. */
function useTween(to: number[], ms: number, from0: boolean) {
  const [shown, setShown] = React.useState(() => (from0 ? to.map(() => 0) : to))
  const from = React.useRef(shown)
  const key = to.join(",")
  React.useEffect(() => {
    const start = from.current
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || start.length !== to.length) {
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

/** A number whose digits roll like an odometer; commas stay put. */
function Odometer({ value }: { value: number }) {
  const chars = Math.round(value).toLocaleString("en-US").split("")
  return (
    <span className="csb-odo" aria-label={chars.join("")}>
      {chars.map((ch, i) =>
        /\d/.test(ch) ? (
          <span key={chars.length - i} className="csb-odo-col" aria-hidden>
            <span className="csb-odo-reel" style={{ transform: "translateY(" + -Number(ch) * 10 + "%)" }}>
              {"0123456789".split("").map((d) => (
                <span key={d}>{d}</span>
              ))}
            </span>
          </span>
        ) : (
          <span key={chars.length - i + "s"} aria-hidden>
            {ch}
          </span>
        ),
      )}
    </span>
  )
}

const CSS =
  ".csb-root{--csb-ease:cubic-bezier(.22,1,.36,1);--csb-spring:cubic-bezier(.34,1.4,.64,1);position:relative;width:100%;max-width:680px;min-width:0;" +
  "padding:26px 28px 24px;border-radius:28px;isolation:isolate;overflow:hidden;box-sizing:border-box;" +
  "font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif;font-variant-numeric:tabular-nums;" +
  "color:var(--csb-fg);background:var(--csb-bg);border:1px solid var(--csb-line);" +
  "box-shadow:0 1px 0 var(--csb-hi) inset,0 30px 60px -24px rgba(0,0,0,.45),0 12px 24px -12px rgba(0,0,0,.3);" +
  "animation:csb-rise .8s var(--csb-ease) both}" +
  ".csb-root *{box-sizing:border-box}" +
  ".csb-dark{--csb-bg:radial-gradient(120% 90% at 0% 0%,#1d2230 0%,#12151d 55%,#0d0f15 100%);--csb-fg:#eef1f7;--csb-mute:#8b93a7;" +
  "--csb-line:rgba(255,255,255,.08);--csb-hi:rgba(255,255,255,.07);--csb-dot:rgba(255,255,255,.055);--csb-chip:rgba(255,255,255,.06);" +
  "--csb-pill:linear-gradient(180deg,#3a4152,#2a303d);--csb-pill-edge:rgba(255,255,255,.14);--csb-tip:#1b1f2a;--csb-track:rgba(255,255,255,.04)}" +
  ".csb-light{--csb-bg:radial-gradient(120% 90% at 0% 0%,#ffffff 0%,#f6f5f1 60%,#efede6 100%);--csb-fg:#15171c;--csb-mute:#6c707b;" +
  "--csb-line:rgba(20,22,28,.09);--csb-hi:rgba(255,255,255,.9);--csb-dot:rgba(20,22,28,.07);--csb-chip:rgba(20,22,28,.05);" +
  "--csb-pill:linear-gradient(180deg,#ffffff,#f3f2ee);--csb-pill-edge:rgba(20,22,28,.12);--csb-tip:#ffffff;--csb-track:rgba(20,22,28,.04)}" +
  ".csb-root::before{content:'';position:absolute;inset:0;z-index:-1;pointer-events:none;" +
  "background-image:radial-gradient(var(--csb-dot) 1px,transparent 1.3px);background-size:12px 12px;" +
  "-webkit-mask-image:radial-gradient(90% 70% at 100% 0%,#000 0%,transparent 75%);mask-image:radial-gradient(90% 70% at 100% 0%,#000 0%,transparent 75%)}" +
  ".csb-top{display:flex;align-items:center;justify-content:space-between;gap:16px}" +
  ".csb-eyebrow{display:flex;align-items:center;gap:8px;font-size:11px;font-weight:500;letter-spacing:.08em;text-transform:uppercase;color:var(--csb-mute)}" +
  ".csb-live{position:relative;width:7px;height:7px;border-radius:50%;background:#2fae84;box-shadow:0 0 0 3px rgba(47,174,132,.18)}" +
  ".csb-live::after{content:'';position:absolute;inset:-3px;border-radius:50%;border:1px solid #2fae84;animation:csb-ping 2.4s var(--csb-ease) infinite}" +
  ".csb-tabs{position:relative;display:inline-grid;grid-auto-flow:column;grid-auto-columns:1fr;padding:3px;border-radius:12px;background:var(--csb-chip);border:1px solid var(--csb-line)}" +
  ".csb-pill{position:absolute;top:3px;bottom:3px;left:3px;border-radius:9px;background:var(--csb-pill);" +
  "box-shadow:0 1px 0 var(--csb-pill-edge) inset,0 2px 6px rgba(0,0,0,.25);transition:transform .55s var(--csb-spring)}" +
  ".csb-tab{position:relative;z-index:1;border:0;background:none;color:var(--csb-mute);font:inherit;font-size:12px;font-weight:500;" +
  "padding:7px 14px;border-radius:9px;cursor:pointer;transition:color .3s}" +
  ".csb-tab[aria-selected=true]{color:var(--csb-fg)}" +
  ".csb-tab:focus-visible,.csb-seg:focus-visible,.csb-key:focus-visible{outline:2px solid #5b7fd6;outline-offset:2px}" +
  ".csb-head{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin:22px 0 20px}" +
  ".csb-title{margin:0;font-size:19px;font-weight:600;letter-spacing:-.015em;line-height:1.25}" +
  ".csb-sub{margin:5px 0 0;font-size:13px;color:var(--csb-mute)}" +
  ".csb-total{text-align:right;white-space:nowrap}" +
  ".csb-total small{display:block;font-size:11px;font-weight:500;letter-spacing:.08em;text-transform:uppercase;color:var(--csb-mute)}" +
  ".csb-num{display:flex;align-items:baseline;justify-content:flex-end;gap:7px;margin-top:6px}" +
  ".csb-num>em{font-style:normal;font-size:13px;color:var(--csb-mute)}" +
  ".csb-odo{display:inline-flex;font-size:34px;font-weight:600;letter-spacing:-.03em;line-height:1}" +
  ".csb-odo-col{display:inline-block;height:1em;overflow:hidden}" +
  ".csb-odo-reel{display:flex;flex-direction:column;transition:transform .9s var(--csb-spring)}" +
  ".csb-odo-reel>span{height:1em;display:block}" +
  ".csb-delta{display:inline-flex;align-items:center;gap:3px;margin-top:8px;padding:3px 7px;border-radius:999px;font-size:11px;font-weight:600}" +
  ".csb-up{color:#2fae84;background:rgba(47,174,132,.13)}.csb-down{color:#e0657f;background:rgba(224,101,127,.13)}" +
  ".csb-barwrap{position:relative;padding:6px;border-radius:18px;background:var(--csb-track);border:1px solid var(--csb-line)}" +
  ".csb-bar{position:relative;display:flex;gap:4px;height:52px}" +
  ".csb-seg{position:relative;min-width:8px;flex-basis:0;border:0;padding:0 12px;border-radius:8px;cursor:pointer;" +
  "background:linear-gradient(180deg,color-mix(in oklab,var(--c) 82%,#fff) 0%,var(--c) 46%,color-mix(in oklab,var(--c) 78%,#000) 100%);" +
  "box-shadow:0 1px 0 rgba(255,255,255,.28) inset,0 -1px 0 rgba(0,0,0,.18) inset,0 6px 14px -6px color-mix(in oklab,var(--c) 70%,transparent);" +
  "display:flex;align-items:center;overflow:hidden;color:#fff;font:inherit;font-size:13px;font-weight:600;white-space:nowrap;text-shadow:0 1px 1px rgba(0,0,0,.25);" +
  "transition:flex-grow .9s var(--csb-ease),transform .35s var(--csb-spring),opacity .3s,filter .3s;transition-delay:var(--d,0ms)}" +
  ".csb-seg::after{content:'';position:absolute;inset:0;background:repeating-linear-gradient(115deg,rgba(255,255,255,.07) 0 2px,transparent 2px 7px);" +
  "-webkit-mask-image:linear-gradient(180deg,#000,transparent 70%);mask-image:linear-gradient(180deg,#000,transparent 70%);pointer-events:none}" +
  ".csb-seg:first-child{border-radius:13px 8px 8px 13px}.csb-seg:last-child{border-radius:8px 13px 13px 8px}" +
  ".csb-seg>span{position:relative;z-index:1;transition:opacity .35s}" +
  ".csb-seg small{font-weight:500;opacity:.82;margin-right:6px}" +
  ".csb-seg[data-on]{transform:translateY(-3px);filter:brightness(1.08)}" +
  ".csb-dim .csb-seg:not([data-on]){opacity:.28;filter:saturate(.35)}" +
  ".csb-dim .csb-key:not([data-on]),.csb-dim .csb-call:not([data-on]){opacity:.35}" +
  ".csb-sheen{position:absolute;inset:0;border-radius:12px;pointer-events:none;overflow:hidden}" +
  ".csb-sheen::before{content:'';position:absolute;top:0;bottom:0;width:30%;left:-30%;" +
  "background:linear-gradient(100deg,transparent,rgba(255,255,255,.35),transparent);animation:csb-sweep 1.1s var(--csb-ease) .15s both}" +
  ".csb-tip{position:absolute;bottom:calc(100% + 14px);z-index:3;min-width:150px;padding:10px 12px;border-radius:12px;pointer-events:none;" +
  "background:var(--csb-tip);border:1px solid var(--csb-line);box-shadow:0 18px 40px -12px rgba(0,0,0,.5);" +
  "transform:translateX(-50%);transition:left .35s var(--csb-ease),opacity .2s;font-size:12px;color:var(--csb-mute)}" +
  ".csb-tip b{display:flex;align-items:center;gap:7px;margin-bottom:6px;font-size:13px;font-weight:600;color:var(--csb-fg)}" +
  ".csb-tip b i{width:8px;height:8px;border-radius:3px;background:var(--c)}" +
  ".csb-tip div{display:flex;justify-content:space-between;gap:16px;line-height:1.7}.csb-tip strong{color:var(--csb-fg);font-weight:600}" +
  ".csb-calls{position:relative;margin-top:2px}" +
  ".csb-call{position:absolute;top:0;display:flex;flex-direction:column;align-items:flex-end;transform:translateX(calc(-100% + .5px));" +
  "transition:left .9s var(--csb-ease),opacity .3s;font-size:12px;color:var(--csb-mute);white-space:nowrap}" +
  ".csb-call i{display:block;width:1px;margin-bottom:5px;background:linear-gradient(180deg,var(--c),color-mix(in oklab,var(--c) 10%,transparent))}" +
  ".csb-call span{display:flex;align-items:center;gap:6px}.csb-call b{color:var(--csb-fg);font-weight:600}" +
  ".csb-legend{display:flex;flex-wrap:wrap;gap:8px;margin:18px 0 0;padding:16px 0 0;list-style:none;border-top:1px dashed var(--csb-line)}" +
  ".csb-key{display:flex;align-items:center;gap:8px;padding:6px 10px 6px 8px;border:1px solid var(--csb-line);border-radius:10px;background:var(--csb-chip);" +
  "font:inherit;font-size:12px;color:var(--csb-mute);cursor:pointer;transition:opacity .3s,transform .3s var(--csb-spring),border-color .3s}" +
  ".csb-key[data-on]{transform:translateY(-1px);border-color:color-mix(in oklab,var(--c) 60%,transparent)}" +
  ".csb-key i{width:9px;height:9px;border-radius:3px;background:var(--c);box-shadow:0 0 0 3px color-mix(in oklab,var(--c) 22%,transparent)}" +
  ".csb-key b{font-weight:600;color:var(--csb-fg)}" +
  "@keyframes csb-rise{from{opacity:0;transform:translateY(14px) scale(.985)}to{opacity:1;transform:none}}" +
  "@keyframes csb-sweep{to{left:100%}}" +
  "@keyframes csb-ping{0%{transform:scale(.6);opacity:.9}80%,100%{transform:scale(2.2);opacity:0}}" +
  "@media (max-width:520px){.csb-root{padding:20px 18px}.csb-top{flex-direction:column;align-items:flex-start}" +
  ".csb-head{flex-direction:column;align-items:flex-start}.csb-total{text-align:left}.csb-num{justify-content:flex-start}" +
  ".csb-odo{font-size:30px}.csb-bar{height:46px}.csb-seg{padding:0 6px;font-size:11px;letter-spacing:-.02em}.csb-seg small{display:none}}" +
  "@media (prefers-reduced-motion:reduce){.csb-root,.csb-pill,.csb-seg,.csb-call,.csb-key,.csb-tip,.csb-odo-reel,.csb-seg>span{transition:none;animation:none}" +
  ".csb-sheen::before,.csb-live::after{animation:none;display:none}}"

export function ChannelShareBar({
  title = "Support tickets by channel",
  subtitle = "Where customers opened a conversation",
  eyebrow = "Help desk · live",
  unit = "tickets",
  periods = DEFAULT_PERIODS,
  defaultPeriod = periods.length - 1,
  inlineMin = 7,
  labelMin = 20,
  tone = "dark",
  className,
}: ChannelShareBarProps) {
  const [period, setPeriod] = React.useState(Math.min(Math.max(0, defaultPeriod), periods.length - 1))
  const [prev, setPrev] = React.useState(-1)
  const [hot, setHot] = React.useState(-1)
  const [grown, setGrown] = React.useState(false)
  React.useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setGrown(true)))
    return () => cancelAnimationFrame(id)
  }, [])

  const slices = periods[period]?.slices ?? []
  const pcts = shares(slices.map((s) => s.value))
  const total = slices.reduce((a, s) => a + s.value, 0)
  const shownPcts = useTween(pcts, 900, true)
  const at = starts(pcts)
  const small = slices.map((_, i) => i).filter((i) => pcts[i] < inlineMin)
  const n = periods.length
  const before = prev >= 0 ? (periods[prev]?.slices ?? []).reduce((a, s) => a + s.value, 0) : 0
  const delta = change(before, total)

  const go = (i: number) => {
    if (i === period) return
    setPrev(period)
    setPeriod(i)
  }
  const onTabKey = (e: React.KeyboardEvent) => {
    const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0
    if (!d) return
    e.preventDefault()
    go((period + d + n) % n)
  }
  const hotSlice = hot >= 0 ? slices[hot] : null

  return (
    <div
      className={"csb-root " + (tone === "light" ? "csb-light" : "csb-dark") + (hot >= 0 ? " csb-dim" : "") + (className ? " " + className : "")}
    >
      <style>{CSS}</style>

      <div className="csb-top">
        <span className="csb-eyebrow">
          <span className="csb-live" aria-hidden />
          {eyebrow}
        </span>
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
              onClick={() => go(i)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="csb-head">
        <div>
          <p className="csb-title">{title}</p>
          <p className="csb-sub">{subtitle}</p>
        </div>
        <div className="csb-total">
          <small>Total</small>
          <div className="csb-num">
            <Odometer value={grown ? total : 0} />
            <em>{unit}</em>
          </div>
          {delta !== null ? (
            <span className={"csb-delta " + (delta >= 0 ? "csb-up" : "csb-down")}>
              {delta >= 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}% vs {periods[prev]?.label.toLowerCase()}
            </span>
          ) : null}
        </div>
      </div>

      <div className="csb-barwrap" onMouseLeave={() => setHot(-1)}>
        {hotSlice ? (
          <div
            className="csb-tip"
            role="status"
            style={{
              left: "clamp(80px, " + (at[hot] + pcts[hot] / 2) + "%, calc(100% - 80px))",
              ["--c" as string]: hotSlice.color,
            }}
          >
            <b>
              <i />
              {hotSlice.label}
            </b>
            <div>
              Share <strong>{pcts[hot].toFixed(1)}%</strong>
            </div>
            <div>
              Volume{" "}
              <strong>
                {hotSlice.value.toLocaleString("en-US")} {unit}
              </strong>
            </div>
          </div>
        ) : null}
        <div className="csb-bar">
          {slices.map((s, i) => (
            <button
              key={s.label}
              type="button"
              className="csb-seg"
              data-on={hot === i ? "" : undefined}
              aria-label={s.label + ": " + pcts[i] + "%, " + s.value.toLocaleString("en-US") + " " + unit}
              style={{
                flexGrow: grown ? Math.max(pcts[i], 0.001) : 0.001,
                ["--c" as string]: s.color,
                ["--d" as string]: grown ? "0ms" : i * 70 + "ms",
              }}
              onMouseEnter={() => setHot(i)}
              onFocus={() => setHot(i)}
              onBlur={() => setHot(-1)}
            >
              <span style={{ opacity: pcts[i] >= inlineMin ? 1 : 0 }}>
                {pcts[i] >= labelMin ? <small>{s.label}</small> : null}
                {(shownPcts[i] ?? pcts[i]).toFixed(1)}%
              </span>
            </button>
          ))}
        </div>
        <span key={period} className="csb-sheen" aria-hidden />
      </div>

      <div className="csb-calls" aria-hidden style={{ height: small.length ? 18 + small.length * 20 : 0 }}>
        {small.map((i, k) => {
          const stem = 10 + (small.length - 1 - k) * 20
          return (
            <span
              key={slices[i].label}
              className="csb-call"
              data-on={hot === i ? "" : undefined}
              style={{ left: "calc(" + (at[i] + pcts[i] / 2) + "% + 6px)", ["--c" as string]: slices[i].color }}
            >
              <i style={{ height: stem }} />
              <span>
                {slices[i].label} <b>{(shownPcts[i] ?? pcts[i]).toFixed(1)}%</b>
              </span>
            </span>
          )
        })}
      </div>

      <ul className="csb-legend">
        {slices.map((s, i) => (
          <li key={s.label} style={{ display: "contents" }}>
            <button
              type="button"
              className="csb-key"
              data-on={hot === i ? "" : undefined}
              style={{ ["--c" as string]: s.color }}
              onMouseEnter={() => setHot(i)}
              onMouseLeave={() => setHot(-1)}
              onFocus={() => setHot(i)}
              onBlur={() => setHot(-1)}
            >
              <i />
              {s.label}
              <b>{(shownPcts[i] ?? pcts[i]).toFixed(1)}%</b>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default ChannelShareBar
