"use client"
import { useEffect, useMemo, useRef, useState } from "react"

/**
 * LED Matrix Sales — a revenue card whose chart is a board of LED dots.
 * Every column is a day; it lights from the bottom up to that day's level.
 * The board sweeps on left to right when it scrolls into view, hovering or
 * arrowing a column lifts it, dims the rest and floats a tooltip whose digits
 * roll like an odometer. No layout is read anywhere: the board is an SVG
 * viewBox and every position is a percentage of it.
 */

export type SalesPoint = { label: string; value: number }

export interface LedMatrixSalesProps {
  data: SalesPoint[]
  title?: string
  caption?: string
  /** Change versus the previous period, in percent. */
  delta?: number
  deltaLabel?: string
  /** Dot rows in the board. */
  rows?: number
  /** Formats money in the header and tooltip. */
  format?: (n: number) => string
  /** LED colour. */
  accent?: string
  className?: string
}

// #region matrix
export function levels(values: number[], rows: number) {
  const max = Math.max(0, ...values)
  if (max <= 0 || rows <= 0) return values.map(() => 0)
  return values.map((v) => (v <= 0 ? 0 : Math.max(1, Math.round((v / max) * rows))))
}
export function clampIndex(i: number, n: number) {
  return n <= 0 ? -1 : Math.min(n - 1, Math.max(0, i))
}
export function dollars(n: number) {
  return "$" + Math.round(n).toLocaleString("en-US")
}
// #endregion

const SPRING =
  "linear(0,0.009,0.035 2.1%,0.141,0.281 6.7%,0.723 12.9%,0.938 16.7%,1.017,1.077,1.121,1.149 24.3%,1.159,1.163,1.161,1.154 29.9%,1.129 32.8%,1.051 39.6%,1.017 43.1%,0.991,0.977 51%,0.974 53.8%,0.975 57.1%,0.997 69.8%,1.003 76.9%,1)"

const CSS = [
  ".lms-root{--lms-accent:#ffb547;position:relative;width:100%;max-width:980px;border-radius:28px;padding:28px 30px 22px;color:#f6ead8;",
  "background:radial-gradient(120% 90% at 100% 0%,color-mix(in oklab,var(--lms-accent) 26%,transparent),transparent 55%),radial-gradient(80% 60% at 0% 100%,#2a1d12,transparent 70%),linear-gradient(180deg,#1b140e,#100c08);",
  "box-shadow:0 1px 0 rgba(255,236,200,.09) inset,0 0 0 1px rgba(255,214,150,.07) inset,0 30px 60px -24px rgba(20,10,0,.55),0 12px 24px -12px rgba(20,10,0,.4);",
  "font-family:'Inter Tight','Inter',ui-sans-serif,system-ui,sans-serif;overflow:hidden;isolation:isolate}",
  ".lms-root:before{content:'';position:absolute;inset:0;z-index:-1;opacity:.22;mix-blend-mode:overlay;pointer-events:none;",
  "background-image:url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")}",
  ".lms-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap}",
  ".lms-id{display:flex;align-items:center;gap:12px}",
  ".lms-chip{width:38px;height:38px;border-radius:12px;display:grid;place-items:center;color:#2a1700;",
  "background:linear-gradient(160deg,color-mix(in oklab,var(--lms-accent) 70%,#fff),var(--lms-accent));box-shadow:0 1px 0 rgba(255,255,255,.55) inset,0 6px 16px -4px color-mix(in oklab,var(--lms-accent) 60%,transparent)}",
  ".lms-title{font-size:17px;font-weight:600;letter-spacing:-.01em}",
  ".lms-cap{font-size:12px;color:rgba(246,234,216,.55);margin-top:2px}",
  ".lms-sum{text-align:right}",
  ".lms-big{font:600 42px/1 'JetBrains Mono','SF Mono',ui-monospace,monospace;letter-spacing:-.04em;display:flex;justify-content:flex-end}",
  ".lms-delta{display:inline-flex;align-items:center;gap:6px;margin-top:8px;font-size:12px;color:rgba(246,234,216,.55)}",
  ".lms-pill{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:999px;font-weight:600;font-variant-numeric:tabular-nums}",
  ".lms-up{background:rgba(124,220,150,.12);color:#8ee6a8;box-shadow:0 0 0 1px rgba(124,220,150,.22) inset}",
  ".lms-down{background:rgba(255,120,110,.12);color:#ff9a8f;box-shadow:0 0 0 1px rgba(255,120,110,.22) inset}",
  ".lms-roll{display:inline-flex;overflow:hidden;height:1em;line-height:1}",
  ".lms-strip{display:flex;flex-direction:column;align-self:flex-start;transition:transform .7s " + SPRING + "}",
  ".lms-strip>span{height:1em;display:block;text-align:center}",
  ".lms-plot{position:relative;margin-top:22px;outline:none;border-radius:14px}",
  ".lms-plot:focus-visible{box-shadow:0 0 0 2px var(--lms-accent)}",
  ".lms-svg{display:block;width:100%;height:auto;overflow:visible}",
  ".lms-dot{fill:#3b2d20;transition:fill .5s ease,opacity .35s ease;transition-delay:calc(var(--c)*14ms + var(--r)*22ms)}",
  ".lms-on .lms-lit{fill:color-mix(in oklab,var(--lms-accent) 78%,#3b2d20)}",
  ".lms-on .lms-top{fill:color-mix(in oklab,var(--lms-accent) 55%,#fff6dc)}",
  ".lms-col{transition:opacity .3s ease}",
  ".lms-hot .lms-col{opacity:.32}",
  ".lms-hot .lms-col.lms-near{opacity:.62}",
  ".lms-hot .lms-col.lms-act{opacity:1}",
  ".lms-hot .lms-col .lms-dot{transition-delay:0s}",
  ".lms-act .lms-lit{fill:color-mix(in oklab,var(--lms-accent) 45%,#fff3d6);filter:url(#lms-glow)}",
  ".lms-act .lms-top{fill:#fffaf0}",
  ".lms-guide{position:absolute;top:0;bottom:0;width:1px;margin-left:-.5px;pointer-events:none;opacity:0;",
  "background:linear-gradient(180deg,transparent,rgba(255,236,200,.5) 30%,rgba(255,236,200,.08));transition:left .45s " + SPRING + ",opacity .2s}",
  ".lms-tip{position:absolute;z-index:2;pointer-events:none;transform:translate(16px,-50%) scale(.9);transform-origin:0 50%;opacity:0;",
  "transition:left .45s " + SPRING + ",top .45s " + SPRING + ",opacity .2s,transform .35s " + SPRING + ";",
  "background:linear-gradient(180deg,#fffaf2,#f3e7d4);color:#24160a;border-radius:12px;padding:7px 11px 8px;white-space:nowrap;",
  "box-shadow:0 1px 0 #fff inset,0 10px 24px -8px rgba(0,0,0,.6),0 0 0 1px rgba(0,0,0,.06)}",
  ".lms-hot .lms-tip,.lms-hot .lms-guide{opacity:1}",
  ".lms-hot .lms-tip{transform:translate(16px,-50%) scale(1)}",
  ".lms-tip.lms-flipx{transform:translate(calc(-100% - 16px),-50%) scale(.9);transform-origin:100% 50%}",
  ".lms-hot .lms-tip.lms-flipx{transform:translate(calc(-100% - 16px),-50%) scale(1)}",
  ".lms-tip-d{font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#8a6b4c;font-weight:600}",
  ".lms-tip-v{font:700 15px/1 'JetBrains Mono','SF Mono',ui-monospace,monospace;margin-top:4px;display:flex}",
  ".lms-hit{fill:transparent;cursor:crosshair}",
  ".lms-axis{display:flex;justify-content:space-between;margin-top:10px;font-size:11px;color:rgba(246,234,216,.38);font-variant-numeric:tabular-nums}",
  ".lms-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}",
  "@media (max-width:520px){.lms-root{padding:18px 16px 14px;border-radius:22px}.lms-big{font-size:26px}.lms-sum{text-align:left}.lms-big{justify-content:flex-start}}",
  "@media (prefers-reduced-motion:reduce){.lms-dot,.lms-strip,.lms-tip,.lms-guide{transition:none!important}}",
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

/** Digits roll on vertical strips; anything that isn't a digit sits still. */
function Rolling({ text }: { text: string }) {
  return (
    <span aria-hidden="true" style={{ display: "inline-flex" }}>
      {text.split("").map((ch, i) => {
        const d = ch.charCodeAt(0) - 48
        if (d < 0 || d > 9) return <span key={i + ch}>{ch}</span>
        return (
          <span key={i} className="lms-roll">
            <span className="lms-strip" style={{ transform: "translateY(" + -d + "em)" }}>
              {"0123456789".split("").map((n) => (
                <span key={n}>{n}</span>
              ))}
            </span>
          </span>
        )
      })}
    </span>
  )
}

export default function LedMatrixSales({
  data,
  title = "Net sales",
  caption = "Daily revenue, last six weeks",
  delta = 12.4,
  deltaLabel = "vs previous period",
  rows = 9,
  format = dollars,
  accent = "#ffb547",
  className = "",
}: LedMatrixSalesProps) {
  const root = useRef(null as HTMLDivElement | null)
  const reduced = useReducedMotion()
  const [on, setOn] = useState(false)
  const [active, setActive] = useState(-1)
  const n = data.length
  const lv = useMemo(() => levels(data.map((d) => d.value), rows), [data, rows])
  const total = useMemo(() => data.reduce((s, d) => s + d.value, 0), [data])

  // Light the board once it is on screen; start at zero so the digits roll up.
  useEffect(() => {
    const el = root.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setOn(true)
          io.disconnect()
        }
      },
      { threshold: 0.3 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const W = n * 10
  const H = rows * 10
  const shownTotal = on ? format(total) : format(total).replace(/[0-9]/g, "0")
  const a = active >= 0 ? data[active] : null
  const peak = active >= 0 ? lv[active] : 0

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault()
      setActive((i) => clampIndex((i < 0 ? (e.key === "ArrowRight" ? -1 : n) : i) + (e.key === "ArrowRight" ? 1 : -1), n))
    } else if (e.key === "Escape") setActive(-1)
  }

  return (
    <div
      ref={root}
      className={"lms-root " + (on ? "lms-on " : "") + (active >= 0 ? "lms-hot " : "") + className}
      style={{ ["--lms-accent" as string]: accent }}
    >
      <style>{CSS}</style>
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <filter id="lms-glow" x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="1.6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </svg>

      <div className="lms-head">
        <div className="lms-id">
          <span className="lms-chip" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <path d="M5 20V12M12 20V5M19 20v-9" />
            </svg>
          </span>
          <div>
            <div className="lms-title">{title}</div>
            <div className="lms-cap">{caption}</div>
          </div>
        </div>
        <div className="lms-sum">
          <div className="lms-big">
            <span className="lms-sr">{format(total)}</span>
            <Rolling text={shownTotal} />
          </div>
          <div className="lms-delta">
            <span className={"lms-pill " + (delta >= 0 ? "lms-up" : "lms-down")}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {delta >= 0 ? <path d="M3 17l6-6 4 4 8-8M15 7h6v6" /> : <path d="M3 7l6 6 4-4 8 8M15 17h6v-6" />}
              </svg>
              {(delta >= 0 ? "+" : "") + delta.toFixed(1) + "%"}
            </span>
            {deltaLabel}
          </div>
        </div>
      </div>

      <div
        className="lms-plot"
        tabIndex={0}
        role="img"
        aria-label={title + ": " + data.map((d) => d.label + " " + format(d.value)).join(", ")}
        onKeyDown={onKey}
        onPointerLeave={() => setActive(-1)}
        onBlur={() => setActive(-1)}
      >
        <svg className="lms-svg" viewBox={"0 0 " + W + " " + H} preserveAspectRatio="none" aria-hidden="true">
          {lv.map((level, c) => {
            const cls = "lms-col" + (c === active ? " lms-act" : Math.abs(c - active) === 1 && active >= 0 ? " lms-near" : "")
            return (
              <g key={c} className={cls}>
                {Array.from({ length: rows }, (_, r) => {
                  const fromBottom = rows - 1 - r
                  const lit = fromBottom < level
                  const top = lit && fromBottom === level - 1
                  return (
                    <circle
                      key={r}
                      cx={c * 10 + 5}
                      cy={r * 10 + 5}
                      r={2.7}
                      className={"lms-dot" + (lit ? " lms-lit" : "") + (top ? " lms-top" : "")}
                      style={{ ["--c" as string]: reduced ? 0 : c, ["--r" as string]: reduced ? 0 : fromBottom }}
                    />
                  )
                })}
                <rect className="lms-hit" x={c * 10} y={0} width={10} height={H} onPointerEnter={() => setActive(c)} onPointerDown={() => setActive(c)} />
              </g>
            )
          })}
        </svg>
        <div className="lms-guide" style={{ left: ((Math.max(active, 0) + 0.5) / Math.max(n, 1)) * 100 + "%" }} />
        <div
          className={"lms-tip" + (active > n * 0.66 ? " lms-flipx" : "")}
          aria-live="polite"
          style={{
            left: ((Math.max(active, 0) + 0.5) / Math.max(n, 1)) * 100 + "%",
            // Beside the column's top dot, clamped inside the board so it never reaches the header.
            top: "clamp(26px," + ((1 - peak / rows) * 100 + 50 / rows) + "%,calc(100% - 26px))",
          }}
        >
          <div className="lms-tip-d">{a ? a.label : ""}</div>
          <div className="lms-tip-v">
            <span className="lms-sr">{a ? format(a.value) : ""}</span>
            <Rolling text={"+" + format(a ? a.value : 0)} />
          </div>
        </div>
      </div>
      <div className="lms-axis" aria-hidden="true">
        <span>{data[0]?.label}</span>
        <span>{data[Math.floor(n / 2)]?.label}</span>
        <span>{data[n - 1]?.label}</span>
      </div>
    </div>
  )
}
