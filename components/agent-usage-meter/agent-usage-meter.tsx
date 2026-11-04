"use client"
import { useEffect, useRef, useState } from "react"

/**
 * Agent Usage Meter — a usage card for an AI agent's monthly allowance. A row
 * of pill segments fills left to right when the card scrolls in; the leading
 * segment breathes while the agent is live. Play/pause runs the meter: hours
 * and spend tick up together and every new segment pops into place. A cost
 * drawer slides open with bars that grow in turn. Heights animate through
 * grid rows (0fr → 1fr), so nothing is measured.
 */

export type UsageLine = { label: string; amount: number; hint?: string }

export interface AgentUsageMeterProps {
  name?: string
  description?: string
  /** Initials or a glyph for the agent badge. */
  badge?: string
  used?: number
  limit?: number
  unit?: string
  /** Soft cap as a fraction of `limit`; a tick marks it. */
  softCap?: number
  resetsIn?: string
  /** Cost per unit. */
  rate?: number
  breakdown?: UsageLine[]
  segments?: number
  /** Start live: the meter ticks up while the card is on screen. */
  live?: boolean
  /** Units added per tick while live. */
  step?: number
  accent?: string
  className?: string
}

// #region meter
export function litSegments(used: number, limit: number, segments: number) {
  if (!(limit > 0) || segments <= 0) return 0
  return Math.min(segments, Math.max(0, Math.round((used / limit) * segments)))
}
export function money(n: number) {
  return "$" + n.toFixed(2)
}
export function shares(lines: { amount: number }[]) {
  const total = lines.reduce((s, l) => s + Math.max(0, l.amount), 0)
  return lines.map((l) => (total > 0 ? Math.max(0, l.amount) / total : 0))
}
// #endregion

const SPRING =
  "linear(0,0.009,0.035 2.1%,0.141,0.281 6.7%,0.723 12.9%,0.938 16.7%,1.017,1.077,1.121,1.149 24.3%,1.159,1.163,1.161,1.154 29.9%,1.129 32.8%,1.051 39.6%,1.017 43.1%,0.991,0.977 51%,0.974 53.8%,0.975 57.1%,0.997 69.8%,1.003 76.9%,1)"
const MONO = "'JetBrains Mono','SF Mono',ui-monospace,monospace"

const CSS = [
  ".aum-root{--aum-accent:#6a4cff;position:relative;width:100%;max-width:520px;border-radius:24px;padding:6px;color:#17151f;",
  "font-family:'Inter Tight','Inter',ui-sans-serif,system-ui,sans-serif;background:linear-gradient(180deg,#ecebf2,#e2e0ea);",
  "box-shadow:0 0 0 1px rgba(23,21,31,.07),0 1px 0 #fff inset,0 30px 60px -30px rgba(40,30,90,.45),0 8px 18px -10px rgba(40,30,90,.25)}",
  ".aum-card{position:relative;border-radius:19px;padding:20px 20px 18px;overflow:hidden;background:#fff;",
  "background-image:radial-gradient(90% 70% at 100% 0%,color-mix(in oklab,var(--aum-accent) 10%,transparent),transparent 60%);",
  "box-shadow:0 0 0 1px rgba(23,21,31,.06),0 1px 2px rgba(23,21,31,.06),0 6px 14px -8px rgba(23,21,31,.18)}",
  ".aum-top{display:flex;align-items:flex-start;gap:14px}",
  ".aum-orb{position:relative;flex:none;width:44px;height:44px;border-radius:14px;display:grid;place-items:center;color:#fff;font-weight:700;font-size:15px;letter-spacing:-.02em;",
  "background:radial-gradient(120% 120% at 20% 10%,color-mix(in oklab,var(--aum-accent) 40%,#fff),var(--aum-accent) 55%,color-mix(in oklab,var(--aum-accent) 60%,#000));",
  "box-shadow:0 1px 0 rgba(255,255,255,.5) inset,0 8px 18px -6px color-mix(in oklab,var(--aum-accent) 70%,transparent)}",
  ".aum-orb:after{content:'';position:absolute;right:-3px;bottom:-3px;width:12px;height:12px;border-radius:50%;background:#b8b6c4;box-shadow:0 0 0 3px #fff;transition:background .3s}",
  ".aum-live .aum-orb:after{background:#1fc77e;animation:aum-ping 1.8s ease-out infinite}",
  ".aum-name{font-size:17px;font-weight:650;letter-spacing:-.02em}",
  ".aum-desc{font-size:13px;color:rgba(23,21,31,.55);margin-top:3px}",
  ".aum-play{margin-left:auto;flex:none;appearance:none;border:0;cursor:pointer;width:38px;height:38px;border-radius:12px;display:grid;place-items:center;color:#17151f;",
  "background:linear-gradient(180deg,#fff,#f1f0f5);box-shadow:0 0 0 1px rgba(23,21,31,.1),0 1px 0 #fff inset,0 2px 4px rgba(23,21,31,.08);transition:transform .3s " + SPRING + ",box-shadow .2s}",
  ".aum-play:hover{transform:translateY(-1px);box-shadow:0 0 0 1px rgba(23,21,31,.16),0 6px 12px -4px rgba(23,21,31,.2)}",
  ".aum-play:active{transform:scale(.92)}",
  ".aum-play:focus-visible,.aum-toggle:focus-visible{outline:2px solid var(--aum-accent);outline-offset:2px}",
  ".aum-play svg{transition:transform .35s " + SPRING + "}",
  ".aum-play:active svg{transform:scale(.8)}",
  ".aum-meter{position:relative;display:flex;gap:3px;margin-top:30px;height:12px}",
  ".aum-seg{flex:1;border-radius:99px;background:rgba(23,21,31,.07);transform-origin:50% 50%;transition:background .35s ease}",
  ".aum-in .aum-on{background:linear-gradient(180deg,color-mix(in oklab,var(--aum-accent) 70%,#fff),var(--aum-accent));animation:aum-pop .5s " + SPRING + " both;animation-delay:calc(var(--i)*22ms)}",
  ".aum-in .aum-on.aum-new{animation-delay:0s}",
  ".aum-live .aum-lead{animation:aum-pop .5s " + SPRING + " both,aum-breathe 1.6s ease-in-out .5s infinite}",
  ".aum-cap{position:absolute;top:-6px;bottom:-6px;width:2px;margin-left:-1px;border-radius:2px;background:#17151f;opacity:.75}",
  ".aum-cap span{position:absolute;bottom:calc(100% + 4px);left:50%;transform:translateX(-50%);font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:rgba(23,21,31,.5);white-space:nowrap}",
  ".aum-row{display:flex;justify-content:space-between;align-items:baseline;margin-top:12px;font-size:13px;color:rgba(23,21,31,.5)}",
  ".aum-row b{font:600 14px/1 " + MONO + ";color:#17151f;font-variant-numeric:tabular-nums}",
  ".aum-foot{display:flex;align-items:center;justify-content:space-between;padding:12px 10px 6px 12px}",
  ".aum-toggle{appearance:none;border:0;background:transparent;cursor:pointer;display:inline-flex;align-items:center;gap:6px;font-size:13.5px;font-weight:500;line-height:1;font-family:inherit;color:rgba(23,21,31,.62);padding:8px 10px;border-radius:10px;transition:background .2s,color .2s}",
  ".aum-toggle:hover{background:rgba(23,21,31,.05);color:#17151f}",
  ".aum-toggle svg{transition:transform .45s " + SPRING + "}",
  ".aum-open .aum-toggle svg{transform:rotate(180deg)}",
  ".aum-rate{font:650 20px/1 " + MONO + ";letter-spacing:-.03em;font-variant-numeric:tabular-nums}",
  ".aum-rate small{font-size:12px;font-weight:500;font-family:inherit;color:rgba(23,21,31,.45);margin-left:3px;letter-spacing:0}",
  ".aum-drawer{display:grid;grid-template-rows:0fr;transition:grid-template-rows .55s " + SPRING + "}",
  ".aum-open .aum-drawer{grid-template-rows:1fr}",
  ".aum-dwrap{overflow:hidden;min-height:0}",
  ".aum-list{padding:4px 12px 12px}",
  ".aum-line{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:6px 12px;padding:10px 0;border-top:1px dashed rgba(23,21,31,.12);",
  "opacity:0;transform:translateY(-6px);transition:opacity .3s,transform .5s " + SPRING + ";transition-delay:calc(var(--i)*60ms)}",
  ".aum-open .aum-line{opacity:1;transform:none}",
  ".aum-ll{font-size:13px;font-weight:550}",
  ".aum-ll span{display:block;font-size:11.5px;font-weight:400;color:rgba(23,21,31,.45);margin-top:2px}",
  ".aum-lv{font:600 13px/1 " + MONO + ";align-self:center;font-variant-numeric:tabular-nums}",
  ".aum-lbar{grid-column:1/-1;height:4px;border-radius:99px;background:rgba(23,21,31,.06);overflow:hidden}",
  ".aum-lbar i{display:block;height:100%;border-radius:inherit;background:color-mix(in oklab,var(--aum-accent) calc(55% + var(--o)*45%),#fff);transform-origin:0 50%;transform:scaleX(0);",
  "transition:transform .8s " + SPRING + ";transition-delay:calc(120ms + var(--i)*70ms)}",
  ".aum-open .aum-lbar i{transform:scaleX(var(--s))}",
  ".aum-total{display:flex;justify-content:space-between;padding-top:10px;border-top:1px solid rgba(23,21,31,.12);font-size:13px;font-weight:600}",
  ".aum-total b{font-family:" + MONO + "}",
  ".aum-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}",
  "@keyframes aum-pop{0%{transform:scale(.3,.3);opacity:0}100%{transform:none;opacity:1}}",
  "@keyframes aum-breathe{50%{filter:brightness(1.25) saturate(1.2);box-shadow:0 0 10px color-mix(in oklab,var(--aum-accent) 60%,transparent)}}",
  "@keyframes aum-ping{0%{box-shadow:0 0 0 3px #fff,0 0 0 3px rgba(31,199,126,.5)}100%{box-shadow:0 0 0 3px #fff,0 0 0 10px rgba(31,199,126,0)}}",
  "@media (max-width:420px){.aum-card{padding:16px 14px 14px}.aum-meter{gap:2px}}",
  "@media (prefers-reduced-motion:reduce){.aum-root *,.aum-root *:after{animation:none!important;transition:none!important}}",
].join("")

function useReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const on = () => setReduced(mq.matches)
    on()
    mq.addEventListener("change", on)
    return () => mq.removeEventListener("change", on)
  }, [])
  return reduced
}

export default function AgentUsageMeter({
  name = "Support Agent",
  description = "Monthly active processing time",
  badge = "SA",
  used: startUsed = 162,
  limit = 320,
  unit = "h",
  softCap = 0.8,
  resetsIn = "12 days",
  rate = 1.26,
  breakdown = [
    { label: "Model tokens", amount: 118.4, hint: "41.2M in · 6.8M out" },
    { label: "Voice minutes", amount: 54.9, hint: "1,830 min transcribed" },
    { label: "Tool calls", amount: 22.3, hint: "9,412 calls · 14 tools" },
    { label: "Knowledge search", amount: 8.5, hint: "2,106 retrievals" },
  ],
  segments = 40,
  live: startLive = false,
  step = 2,
  accent = "#6a4cff",
  className = "",
}: AgentUsageMeterProps) {
  const root = useRef(null as HTMLDivElement | null)
  const reduced = useReducedMotion()
  const [seen, setSeen] = useState(false)
  const [live, setLive] = useState(startLive)
  const [open, setOpen] = useState(false)
  const [used, setUsed] = useState(startUsed)
  const [grew, setGrew] = useState(-1)

  useEffect(() => {
    const el = root.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true)
          io.disconnect()
        }
      },
      { threshold: 0.3 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // Live mode: a slow tick, not a frame loop. Stops itself at the limit.
  useEffect(() => {
    if (!live || !seen) return
    const id = window.setInterval(() => {
      setUsed((u) => {
        const next = Math.min(limit, u + step)
        if (next >= limit) setLive(false)
        return next
      })
    }, reduced ? 1600 : 1000)
    return () => window.clearInterval(id)
  }, [live, seen, limit, step, reduced])

  const lit = litSegments(used, limit, segments)
  const prevLit = useRef(lit)
  useEffect(() => {
    if (lit > prevLit.current) setGrew(lit - 1)
    prevLit.current = lit
  }, [lit])

  // Live hours add to the spend at the hourly rate.
  const spend = breakdown.reduce((s, l) => s + l.amount, 0) + Math.max(0, used - startUsed) * rate
  const sh = shares(breakdown)
  const maxShare = Math.max(0, ...sh)

  return (
    <div ref={root} className={"aum-root " + (seen ? "aum-in " : "") + (live ? "aum-live " : "") + (open ? "aum-open " : "") + className} style={{ ["--aum-accent" as string]: accent }}>
      <style>{CSS}</style>
      <div className="aum-card">
        <div className="aum-top">
          <span className="aum-orb" aria-hidden="true">
            {badge}
          </span>
          <div>
            <div className="aum-name">{name}</div>
            <div className="aum-desc">{description}</div>
          </div>
          <button type="button" className="aum-play" aria-pressed={live} aria-label={live ? "Pause agent" : "Run agent"} onClick={() => setLive((v) => !v)} disabled={used >= limit && !live}>
            {live ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <rect x="6" y="5" width="4" height="14" rx="1.2" />
                <rect x="14" y="5" width="4" height="14" rx="1.2" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" aria-hidden="true">
                <path d="M7 5.5v13a1 1 0 0 0 1.5.86l11-6.5a1 1 0 0 0 0-1.72l-11-6.5A1 1 0 0 0 7 5.5z" />
              </svg>
            )}
          </button>
        </div>

        <div
          className="aum-meter"
          role="meter"
          aria-valuemin={0}
          aria-valuemax={limit}
          aria-valuenow={used}
          aria-label={name + " usage, " + used + " of " + limit + unit}
        >
          {Array.from({ length: segments }, (_, i) => (
            <span
              key={i}
              className={"aum-seg" + (i < lit ? " aum-on" : "") + (i === lit - 1 ? " aum-lead" : "") + (i === grew ? " aum-new" : "")}
              style={{ ["--i" as string]: i }}
            />
          ))}
          {softCap > 0 && softCap < 1 && (
            <span className="aum-cap" style={{ left: softCap * 100 + "%" }} aria-hidden="true">
              <span>Soft cap</span>
            </span>
          )}
        </div>
        <div className="aum-row">
          <span aria-live="polite">
            <b>
              {used} / {limit}
              {unit}
            </b>
          </span>
          <span>Resets in {resetsIn}</span>
        </div>
      </div>

      <div className="aum-foot">
        <button type="button" className="aum-toggle" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          Cost breakdown
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        <span className="aum-rate">
          {money(rate)}
          <small>/ {unit}</small>
        </span>
      </div>
      <div className="aum-drawer" aria-hidden={!open}>
        <div className="aum-dwrap">
          <div className="aum-list">
            {breakdown.map((l, i) => (
              <div key={l.label} className="aum-line" style={{ ["--i" as string]: i }}>
                <span className="aum-ll">
                  {l.label}
                  {l.hint && <span>{l.hint}</span>}
                </span>
                <span className="aum-lv">{money(l.amount)}</span>
                <span className="aum-lbar" aria-hidden="true">
                  <i style={{ ["--s" as string]: maxShare > 0 ? sh[i] / maxShare : 0, ["--o" as string]: maxShare > 0 ? sh[i] / maxShare : 0, ["--i" as string]: i }} />
                </span>
              </div>
            ))}
            <div className="aum-total">
              <span>Spent this cycle</span>
              <b>{money(spend)}</b>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
