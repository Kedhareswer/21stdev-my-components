"use client"

import { useState } from "react"

export type UsageCategory = { name: string; color: string }
export type UsageBar = { label: string; values: number[] }
export type UsageView = {
  id: string
  /** Tab label, e.g. "Day". */
  label: string
  /** Line under the total, e.g. "Tuesday, 4 Nov". */
  caption?: string
  /** Change vs the previous period, e.g. -18 for 18% less. */
  delta?: number
  bars: UsageBar[]
  /** Labels under the chart; spread evenly. */
  axis?: string[]
}

export type FocusUsageCardProps = {
  title?: string
  categories: UsageCategory[]
  views: UsageView[]
  height?: string
  className?: string
}

// #region usage
export const fmtMinutes = (m: number) => {
  const t = Math.max(0, Math.round(m))
  const h = Math.floor(t / 60)
  const r = t % 60
  return h ? h + "h " + (r < 10 ? "0" : "") + r + "m" : r + "m"
}

/** Totals per category, the grand total and the tallest bar, for one view. */
export function summarise(bars: UsageBar[], nCats: number) {
  const perCat = new Array(nCats).fill(0)
  let max = 0
  for (const b of bars) {
    let s = 0
    for (let c = 0; c < nCats; c++) {
      const v = b.values[c] ?? 0
      perCat[c] += v
      s += v
    }
    if (s > max) max = s
  }
  const total = perCat.reduce((a, b) => a + b, 0)
  return { perCat, total, max }
}

/** A round top for the y axis: 15, 30, 60, 90, 120 minutes and up. */
export function niceMax(max: number) {
  const steps = [15, 30, 60, 90, 120, 180, 240, 360, 480, 600, 720, 900, 1200]
  for (const s of steps) if (max <= s) return s
  return Math.ceil(max / 300) * 300
}

/** Tooltip anchor, in percent of the chart width, kept clear of the edges. */
export const tipLeft = (i: number, n: number) => Math.min(84, Math.max(16, ((i + 0.5) / Math.max(n, 1)) * 100))
// #endregion

const SANS = 'ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif'
const MONO = 'ui-monospace,"SF Mono","Cascadia Mono",Menlo,Consolas,monospace'
const EASE = "cubic-bezier(.22,1,.36,1)"
const SPRING = "cubic-bezier(.34,1.56,.64,1)"
const INK = "#1b1a17"

const CSS =
  ".fuc-stage{display:flex;align-items:center;justify-content:center;padding:48px 16px;box-sizing:border-box;background:var(--color-background);font-family:" + SANS + "}" +
  ".fuc-card{position:relative;width:100%;max-width:640px;border-radius:30px;padding:26px 26px 22px;box-sizing:border-box;color:" + INK + ";" +
  "background:radial-gradient(120% 80% at 100% 0%,rgba(61,90,254,.07),transparent 55%),linear-gradient(180deg,#fffefb,#f7f4ee);" +
  "box-shadow:0 1px 0 #fff inset,0 0 0 1px rgba(27,26,23,.07),0 2px 4px rgba(27,26,23,.04),0 30px 60px -28px rgba(27,26,23,.35);animation:fuc-in .9s " + EASE + " both}" +
  "@keyframes fuc-in{from{opacity:0;transform:translateY(24px) scale(.98)}to{opacity:1;transform:none}}" +
  ".fuc-top{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:18px}" +
  ".fuc-title{display:flex;align-items:center;gap:9px;font:600 13px/1 " + SANS + ";color:rgba(27,26,23,.62);margin:0}" +
  ".fuc-title i{width:8px;height:8px;border-radius:50%;background:#3d5afe;box-shadow:0 0 0 4px rgba(61,90,254,.14)}" +
  ".fuc-seg{position:relative;display:grid;grid-auto-flow:column;grid-auto-columns:1fr;padding:3px;border-radius:999px;background:rgba(27,26,23,.06);box-shadow:inset 0 1px 2px rgba(27,26,23,.08)}" +
  ".fuc-seg button{position:relative;z-index:1;border:0;background:none;padding:7px 14px;font:600 12.5px/1 " + SANS + ";color:rgba(27,26,23,.55);cursor:pointer;border-radius:999px;transition:color .3s}" +
  ".fuc-seg button[aria-pressed=true]{color:" + INK + "}" +
  ".fuc-seg button:focus-visible{outline:2px solid #3d5afe;outline-offset:1px}" +
  ".fuc-pill{position:absolute;top:3px;bottom:3px;left:3px;border-radius:999px;background:#fff;box-shadow:0 1px 2px rgba(27,26,23,.12),0 4px 10px -4px rgba(27,26,23,.2);transition:transform .55s " + SPRING + "}" +
  ".fuc-sum{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:20px}" +
  ".fuc-total{font:700 clamp(40px,8vw,56px)/.9 " + SANS + ";letter-spacing:-.05em;font-variant-numeric:tabular-nums;animation:fuc-num .6s " + EASE + " both}" +
  "@keyframes fuc-num{from{opacity:0;transform:translateY(12px);filter:blur(4px)}to{opacity:1;transform:none;filter:none}}" +
  ".fuc-cap{font:500 12px/1 " + MONO + ";color:rgba(27,26,23,.5);margin-top:10px}" +
  ".fuc-delta{display:inline-flex;align-items:center;gap:5px;font:600 12px/1 " + SANS + ";padding:7px 10px;border-radius:999px}" +
  ".fuc-delta[data-good=true]{color:#0d7a4f;background:rgba(13,122,79,.1)}" +
  ".fuc-delta[data-good=false]{color:#c2410c;background:rgba(194,65,12,.1)}" +
  ".fuc-chart{position:relative;display:grid;grid-template-columns:1fr auto;gap:10px}" +
  ".fuc-plot{position:relative;height:170px}" +
  ".fuc-grid{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:space-between;pointer-events:none}" +
  ".fuc-grid i{height:0;border-top:1px dashed rgba(27,26,23,.12)}" +
  ".fuc-bars{position:absolute;inset:0;display:flex;align-items:flex-end;gap:var(--fuc-gap)}" +
  ".fuc-bar{position:relative;flex:1;height:100%;display:flex;flex-direction:column-reverse;border:0;padding:0;background:none;cursor:pointer;outline:none;transition:opacity .25s}" +
  ".fuc-stack{display:flex;flex-direction:column-reverse;gap:2px;width:100%;transform-origin:50% 100%;animation:fuc-grow .9s " + SPRING + " both;animation-delay:calc(var(--i) * 22ms + 80ms)}" +
  "@keyframes fuc-grow{from{transform:scaleY(0)}to{transform:scaleY(1)}}" +
  ".fuc-stack i{display:block;width:100%;border-radius:4px;min-height:0}" +
  ".fuc-stack i:last-child{border-radius:6px 6px 4px 4px}" +
  ".fuc-bar[data-empty=true] .fuc-stack::before{content:'';display:block;height:4px;border-radius:3px;background:rgba(27,26,23,.1)}" +
  ".fuc-bars[data-hover=true] .fuc-bar:not([data-on=true]){opacity:.35}" +
  ".fuc-bar:focus-visible .fuc-stack{outline:2px solid #3d5afe;outline-offset:2px;border-radius:4px}" +
  ".fuc-y{display:flex;flex-direction:column;justify-content:space-between;height:170px;font:500 10.5px/1 " + MONO + ";color:rgba(27,26,23,.42);text-align:right;margin-top:-5px}" +
  ".fuc-x{display:flex;justify-content:space-between;margin:10px 0 0;padding-right:36px;font:500 10.5px/1 " + MONO + ";color:rgba(27,26,23,.45)}" +
  ".fuc-tip{position:absolute;bottom:calc(100% + 10px);z-index:3;transform:translateX(-50%);min-width:150px;padding:10px 12px;border-radius:14px;color:#fff;background:rgba(27,26,23,.94);" +
  "box-shadow:0 12px 24px -10px rgba(27,26,23,.5);pointer-events:none;animation:fuc-tip .3s " + SPRING + " both;transition:left .25s " + EASE + "}" +
  "@keyframes fuc-tip{from{opacity:0;transform:translate(-50%,6px) scale(.96)}to{opacity:1;transform:translateX(-50%)}}" +
  ".fuc-tip b{display:flex;justify-content:space-between;font:600 12px/1 " + SANS + ";margin-bottom:8px}" +
  ".fuc-tip b span{font-family:" + MONO + ";font-weight:500;color:rgba(255,255,255,.6)}" +
  ".fuc-tip div{display:flex;align-items:center;gap:7px;font:500 11.5px/1.7 " + SANS + ";color:rgba(255,255,255,.82)}" +
  ".fuc-tip div i{width:7px;height:7px;border-radius:2px}" +
  ".fuc-tip div em{margin-left:auto;font-style:normal;font-family:" + MONO + "}" +
  ".fuc-legend{display:grid;grid-template-columns:repeat(var(--fuc-n),1fr);gap:10px;margin:22px 0 0;padding:16px 0 0;border-top:1px solid rgba(27,26,23,.08);list-style:none}" +
  ".fuc-legend li{display:flex;flex-direction:column;gap:7px;min-width:0}" +
  ".fuc-legend li>span{display:flex;align-items:center;gap:7px;font:500 12px/1.35 " + SANS + ";color:rgba(27,26,23,.6);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
  ".fuc-legend li>span i{flex:none;width:8px;height:8px;border-radius:3px}" +
  ".fuc-legend b{font:650 16px/1 " + SANS + ";letter-spacing:-.02em;font-variant-numeric:tabular-nums}" +
  ".fuc-meter{height:4px;border-radius:4px;background:rgba(27,26,23,.07);overflow:hidden}" +
  ".fuc-meter i{display:block;height:100%;border-radius:4px;transform-origin:0 50%;animation:fuc-meter 1.1s " + EASE + " both;animation-delay:.25s}" +
  "@keyframes fuc-meter{from{transform:scaleX(0)}}" +
  "@media (max-width:480px){.fuc-card{padding:22px 18px 18px;border-radius:26px}.fuc-legend{grid-template-columns:1fr 1fr}.fuc-x{padding-right:30px}}" +
  "@media (prefers-reduced-motion:reduce){.fuc-card,.fuc-total,.fuc-stack,.fuc-tip,.fuc-meter i{animation:none}.fuc-pill,.fuc-tip,.fuc-bar,.fuc-seg button{transition:none}}"

export default function FocusUsageCard({ title = "Screen time", categories, views, height = "100svh", className = "" }: FocusUsageCardProps) {
  const [vi, setVi] = useState(0)
  const [hover, setHover] = useState(-1)
  const view = views[Math.min(vi, views.length - 1)]
  if (!view) return null
  const n = categories.length
  const { perCat, total, max } = summarise(view.bars, n)
  const top = niceMax(max || 1)
  const bars = view.bars
  const gap = bars.length > 14 ? 3 : 10
  const h = hover >= 0 && hover < bars.length ? bars[hover] : null

  return (
    <div className={"fuc-stage " + className} style={{ minHeight: height }}>
      <style>{CSS}</style>
      <section className="fuc-card" aria-label={title}>
        <div className="fuc-top">
          <p className="fuc-title">
            <i aria-hidden="true" />
            {title}
          </p>
          {views.length > 1 && (
            <div className="fuc-seg" role="group" aria-label="Period">
              <span className="fuc-pill" aria-hidden="true" style={{ width: "calc((100% - 6px) / " + views.length + ")", transform: "translateX(" + vi * 100 + "%)" }} />
              {views.map((v, i) => (
                <button
                  key={v.id}
                  type="button"
                  aria-pressed={i === vi}
                  onClick={() => {
                    setVi(i)
                    setHover(-1)
                  }}
                >
                  {v.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="fuc-sum">
          <div>
            <div className="fuc-total" key={view.id} aria-live="polite">
              {fmtMinutes(total)}
            </div>
            {view.caption && <div className="fuc-cap">{view.caption}</div>}
          </div>
          {typeof view.delta === "number" && (
            <span className="fuc-delta" data-good={view.delta <= 0}>
              <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" style={{ transform: view.delta <= 0 ? "rotate(180deg)" : undefined }}>
                <path d="M5 1.5 8.5 7h-7z" fill="currentColor" />
              </svg>
              {Math.abs(view.delta)}% vs last {view.label.toLowerCase()}
            </span>
          )}
        </div>

        <div className="fuc-chart">
          <div className="fuc-plot">
            <div className="fuc-grid" aria-hidden="true">
              <i />
              <i />
              <i />
            </div>
            {h && (
              <div className="fuc-tip" style={{ left: tipLeft(hover, bars.length) + "%" }} role="status">
                <b>
                  {h.label}
                  <span>{fmtMinutes(h.values.reduce((a, b) => a + b, 0))}</span>
                </b>
                {categories.map((c, k) => (
                  <div key={c.name}>
                    <i style={{ background: c.color }} />
                    {c.name}
                    <em>{fmtMinutes(h.values[k] ?? 0)}</em>
                  </div>
                ))}
              </div>
            )}
            <div className="fuc-bars" data-hover={hover >= 0} key={view.id} style={{ ["--fuc-gap" as string]: gap + "px" }} onMouseLeave={() => setHover(-1)}>
              {bars.map((b, i) => {
                const sum = b.values.reduce((a, v) => a + v, 0)
                return (
                  <button
                    key={b.label + i}
                    type="button"
                    className="fuc-bar"
                    data-on={i === hover}
                    data-empty={sum === 0}
                    aria-label={b.label + ": " + fmtMinutes(sum)}
                    onMouseEnter={() => setHover(i)}
                    onFocus={() => setHover(i)}
                    onBlur={() => setHover(-1)}
                  >
                    <span className="fuc-stack" style={{ ["--i" as string]: i, height: (sum / top) * 100 + "%" }}>
                      {categories.map((c, k) => {
                        const v = b.values[k] ?? 0
                        return v > 0 ? <i key={c.name} style={{ background: c.color, flex: v + " 0 0" }} /> : null
                      })}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
          <div className="fuc-y" aria-hidden="true">
            <span>{fmtMinutes(top)}</span>
            <span>{fmtMinutes(top / 2)}</span>
            <span>0</span>
          </div>
        </div>
        {view.axis && (
          <div className="fuc-x" aria-hidden="true">
            {view.axis.map((a) => (
              <span key={a}>{a}</span>
            ))}
          </div>
        )}

        <ul className="fuc-legend" style={{ ["--fuc-n" as string]: n }} key={"l" + view.id}>
          {categories.map((c, k) => (
            <li key={c.name}>
              <span>
                <i style={{ background: c.color }} />
                {c.name}
              </span>
              <b>{fmtMinutes(perCat[k])}</b>
              <div className="fuc-meter">
                <i style={{ background: c.color, width: (total ? (perCat[k] / total) * 100 : 0) + "%" }} />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
