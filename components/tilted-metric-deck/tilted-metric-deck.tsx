"use client"
import { useEffect, useRef, useState } from "react"

/**
 * Tilted Metric Deck — a pile of glass metric cards lying in 3D, each edge
 * glowing its own colour, beside an upright detail card. Hover, tap or arrow
 * through the pile: the picked card lifts and slides out of the stack, and the
 * detail card redraws for it. The value rises in, the sparkline draws itself,
 * the monthly bars grow one after another and the target bar fills. While
 * nobody touches it, the deck flips through on its own. Pure CSS 3D;
 * nothing reads layout.
 */

export type DeckMetric = {
  label: string
  value: string
  /** Change, already formatted, e.g. "+8.2%". Leading "-" or "−" reads as a drop. */
  delta: string
  /** Sparkline points, any scale. */
  trend: number[]
  /** Monthly rows: label and a 0–100 score. */
  rows: { label: string; score: number }[]
  /** Progress to target, 0–100. */
  target: number
  updated?: string
  color?: string
}

export interface TiltedMetricDeckProps {
  metrics: DeckMetric[]
  /** Advance on its own every N ms until the user interacts. 0 turns it off. */
  autoplay?: number
  className?: string
}

// #region deck
const PALETTE = ["#ff7a59", "#3ddc97", "#5aa9ff", "#ffc14d", "#b58cff", "#ff6fae"]
export function colorFor(i: number, color?: string) {
  return color || PALETTE[i % PALETTE.length]
}
export function isDrop(delta: string) {
  return /^[-−]/.test(delta.trim())
}
/** An SVG path through the points, scaled into a w×h box with a little air. */
export function sparkPath(points: number[], w: number, h: number) {
  if (points.length < 2) return ""
  const min = Math.min(...points)
  const max = Math.max(...points)
  const span = max - min || 1
  return points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * w
      const y = h - 3 - ((p - min) / span) * (h - 6)
      return (i ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1)
    })
    .join(" ")
}
// #endregion

const SPRING =
  "linear(0,0.009,0.035 2.1%,0.141,0.281 6.7%,0.723 12.9%,0.938 16.7%,1.017,1.077,1.121,1.149 24.3%,1.159,1.163,1.161,1.154 29.9%,1.129 32.8%,1.051 39.6%,1.017 43.1%,0.991,0.977 51%,0.974 53.8%,0.975 57.1%,0.997 69.8%,1.003 76.9%,1)"
const MONO = "'JetBrains Mono','SF Mono',ui-monospace,monospace"

const CSS = [
  ".tmd-root{position:relative;width:100%;max-width:900px;border-radius:28px;overflow:hidden;color:#f1eef4;isolation:isolate;",
  "font-family:'Inter Tight','Inter',ui-sans-serif,system-ui,sans-serif;",
  "background:radial-gradient(70% 60% at 30% 40%,color-mix(in oklab,var(--tmd-c) 16%,transparent),transparent 70%),radial-gradient(60% 50% at 85% 20%,rgba(255,255,255,.05),transparent 70%),linear-gradient(160deg,#1a161d,#0d0b0f);",
  "box-shadow:0 0 0 1px rgba(255,255,255,.06) inset,0 40px 90px -40px rgba(0,0,0,.8);transition:background .8s}",
  ".tmd-stage{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);align-items:center;gap:8px;min-height:460px;padding:28px}",
  ".tmd-scene{position:relative;height:400px;perspective:1400px}",
  ".tmd-pile{position:absolute;left:42%;top:60%;width:230px;height:150px;margin:-75px 0 0 -115px;transform-style:preserve-3d;transform:rotateX(58deg) rotateZ(-34deg)}",
  ".tmd-card{position:absolute;inset:0;appearance:none;border:0;padding:14px 16px;text-align:left;cursor:pointer;color:inherit;font:inherit;border-radius:16px;",
  "background:linear-gradient(150deg,#2a2530,#17141b);",
  "box-shadow:0 0 0 1px rgba(255,255,255,.11) inset,0 0 0 1px color-mix(in oklab,var(--c) 0%,transparent),0 18px 30px -18px rgba(0,0,0,.9);",
  "transform:translateZ(calc(var(--z)*30px));opacity:0;transition:transform .7s " + SPRING + ",box-shadow .35s,background .35s,opacity .5s;transition-delay:calc(var(--d)*70ms),0s,0s,calc(var(--d)*70ms)}",
  ".tmd-in .tmd-card{opacity:1}",
  ".tmd-card:before{content:'';position:absolute;left:14px;right:14px;bottom:0;height:2px;border-radius:2px;background:var(--c);opacity:.55;box-shadow:0 0 12px var(--c);transition:opacity .3s}",
  ".tmd-card:focus-visible{outline:2px solid var(--c);outline-offset:3px}",
  ".tmd-card.tmd-up{transform:translateZ(calc(var(--top)*30px)) translateX(min(150px,26vw)) translateY(-8px);transition-delay:0s;",
  "background:linear-gradient(150deg,color-mix(in oklab,var(--c) 34%,#2a2530),#18151c);",
  "box-shadow:0 0 0 1px color-mix(in oklab,var(--c) 55%,transparent) inset,0 30px 50px -20px rgba(0,0,0,.9),0 0 40px -10px var(--c)}",
  ".tmd-card.tmd-up:before{opacity:1}",
  ".tmd-cl{font-size:10.5px;letter-spacing:.18em;text-transform:uppercase;font-weight:650;color:rgba(241,238,244,.62)}",
  ".tmd-up .tmd-cl{color:#fff}",
  ".tmd-cv{font:600 22px/1 " + MONO + ";margin-top:10px;letter-spacing:-.04em;color:rgba(241,238,244,.38);transition:color .3s}",
  ".tmd-up .tmd-cv{color:#fff}",
  ".tmd-floor{position:absolute;left:50%;top:70%;width:300px;height:120px;margin-left:-150px;border-radius:50%;background:radial-gradient(closest-side,color-mix(in oklab,var(--tmd-c) 30%,transparent),transparent);filter:blur(18px);opacity:.7;transition:background .8s}",
  ".tmd-detail{position:relative;justify-self:center;width:100%;max-width:330px;border-radius:22px;padding:20px 20px 18px;",
  "background:linear-gradient(180deg,#1c1920,#121015);box-shadow:0 0 0 1px rgba(255,255,255,.08) inset,0 1px 0 rgba(255,255,255,.08) inset,0 40px 70px -30px rgba(0,0,0,.9),0 0 0 1px color-mix(in oklab,var(--tmd-c) 22%,transparent);",
  "opacity:0;transform:translateY(16px) scale(.97);transition:opacity .6s .35s,transform .9s .35s " + SPRING + ",box-shadow .6s}",
  ".tmd-in .tmd-detail{opacity:1;transform:none}",
  ".tmd-dh{display:flex;justify-content:space-between;align-items:center}",
  ".tmd-dl{font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:rgba(241,238,244,.55);font-weight:650;display:flex;align-items:center;gap:8px}",
  ".tmd-dl i{width:8px;height:8px;border-radius:2px;background:var(--tmd-c);box-shadow:0 0 10px var(--tmd-c)}",
  ".tmd-delta{font:600 11.5px/1 " + MONO + ";padding:5px 8px;border-radius:7px;background:rgba(61,220,151,.13);color:#6cefb4}",
  ".tmd-delta.tmd-down{background:rgba(255,97,120,.13);color:#ff8d9e}",
  ".tmd-dv{font:650 40px/1 " + MONO + ";letter-spacing:-.05em;margin-top:14px;animation:tmd-rise .6s " + SPRING + " both}",
  ".tmd-spark{display:block;width:100%;height:56px;margin-top:12px;overflow:visible}",
  ".tmd-spark path{fill:none;stroke:var(--tmd-c);stroke-width:2;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:1;stroke-dashoffset:1;animation:tmd-draw 1.1s .1s cubic-bezier(.6,0,.2,1) forwards}",
  ".tmd-spark .tmd-area{stroke:none;fill:url(#tmd-fade);stroke-dasharray:none;animation:tmd-fade .8s .5s both}",
  ".tmd-rows{margin-top:14px;display:grid;gap:7px}",
  ".tmd-row{display:grid;grid-template-columns:32px minmax(0,1fr) 26px;align-items:center;gap:10px;font-size:11.5px;color:rgba(241,238,244,.5)}",
  ".tmd-row b{font:500 11px/1 " + MONO + ";color:rgba(241,238,244,.75);text-align:right}",
  ".tmd-bar{height:4px;border-radius:99px;background:rgba(255,255,255,.07);overflow:hidden}",
  ".tmd-bar i{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,rgba(255,255,255,.35),rgba(255,255,255,.9));transform-origin:0 50%;animation:tmd-grow .8s " + SPRING + " both;animation-delay:calc(200ms + var(--i)*60ms)}",
  ".tmd-target{margin-top:16px;padding-top:14px;border-top:1px solid rgba(255,255,255,.08)}",
  ".tmd-tt{display:flex;justify-content:space-between;font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:rgba(241,238,244,.5);font-weight:650}",
  ".tmd-tt b{font-family:" + MONO + ";letter-spacing:0;color:#fff}",
  ".tmd-tbar{height:6px;margin-top:9px;border-radius:99px;background:rgba(255,255,255,.07);overflow:hidden}",
  ".tmd-tbar i{display:block;height:100%;border-radius:inherit;background:var(--tmd-c);box-shadow:0 0 12px var(--tmd-c);transform-origin:0 50%;animation:tmd-grow 1s .55s " + SPRING + " both}",
  ".tmd-upd{margin-top:12px;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:rgba(241,238,244,.3)}",
  ".tmd-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}",
  "@keyframes tmd-rise{0%{opacity:0;transform:translateY(12px);filter:blur(4px)}100%{opacity:1;transform:none;filter:none}}",
  "@keyframes tmd-draw{to{stroke-dashoffset:0}}",
  "@keyframes tmd-fade{0%{opacity:0}100%{opacity:1}}",
  "@keyframes tmd-grow{0%{transform:scaleX(0)}100%{transform:scaleX(var(--s))}}",
  "@media (max-width:720px){.tmd-stage{grid-template-columns:1fr;padding:18px 16px 22px;min-height:0}.tmd-scene{height:320px}.tmd-pile{top:70%;left:38%;transform:rotateX(58deg) rotateZ(-34deg) scale(.82)}}",
  "@media (prefers-reduced-motion:reduce){.tmd-root *,.tmd-root *:before{animation:none!important;transition:none!important}.tmd-spark path{stroke-dashoffset:0}.tmd-bar i,.tmd-tbar i{transform:scaleX(var(--s))}}",
].join("")

export default function TiltedMetricDeck({ metrics, autoplay = 3200, className = "" }: TiltedMetricDeckProps) {
  const root = useRef(null as HTMLDivElement | null)
  const [seen, setSeen] = useState(false)
  const [k, setK] = useState(0)
  const [touched, setTouched] = useState(false)
  const n = metrics.length

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

  useEffect(() => {
    if (!seen || touched || !autoplay || n < 2) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const id = window.setInterval(() => setK((x) => (x + 1) % n), autoplay)
    return () => window.clearInterval(id)
  }, [seen, touched, autoplay, n])

  if (!n) return null
  const m = metrics[k]
  const c = colorFor(k, m.color)
  const pick = (i: number) => {
    setTouched(true)
    setK(i)
  }
  const onKey = (e: React.KeyboardEvent) => {
    const d = e.key === "ArrowUp" || e.key === "ArrowRight" ? 1 : e.key === "ArrowDown" || e.key === "ArrowLeft" ? -1 : 0
    if (!d) return
    e.preventDefault()
    pick((k + d + n) % n)
    const next = root.current?.querySelectorAll("[role=tab]")[(k + d + n) % n] as HTMLElement | undefined
    next?.focus()
  }

  return (
    <div ref={root} className={"tmd-root " + (seen ? "tmd-in " : "") + className} style={{ ["--tmd-c" as string]: c }}>
      <style>{CSS}</style>
      <div className="tmd-stage">
        <div className="tmd-scene">
          <span className="tmd-floor" aria-hidden="true" />
          <div className="tmd-pile" style={{ ["--top" as string]: n }} role="tablist" aria-label="Metrics" aria-orientation="vertical" onKeyDown={onKey}>
            {metrics.map((x, i) => (
              <button
                key={x.label}
                type="button"
                role="tab"
                aria-selected={i === k}
                aria-controls="tmd-detail"
                tabIndex={i === k ? 0 : -1}
                className={"tmd-card" + (i === k ? " tmd-up" : "")}
                style={{ ["--z" as string]: n - 1 - i, ["--d" as string]: n - 1 - i, ["--c" as string]: colorFor(i, x.color) }}
                onPointerEnter={(e) => e.pointerType === "mouse" && pick(i)}
                onClick={() => pick(i)}
              >
                <span className="tmd-cl" style={{ display: "block" }}>
                  {x.label}
                </span>
                <span className="tmd-cv" style={{ display: "block" }}>
                  {x.value}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="tmd-detail" id="tmd-detail" role="tabpanel" aria-live="polite" key={k}>
          <div className="tmd-dh">
            <span className="tmd-dl">
              <i aria-hidden="true" />
              {m.label}
            </span>
            <span className={"tmd-delta" + (isDrop(m.delta) ? " tmd-down" : "")}>{m.delta}</span>
          </div>
          <div className="tmd-dv">{m.value}</div>
          <svg className="tmd-spark" viewBox="0 0 280 56" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <linearGradient id="tmd-fade" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={c} stopOpacity=".28" />
                <stop offset="1" stopColor={c} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path className="tmd-area" d={sparkPath(m.trend, 280, 56) + " L280 56 L0 56 Z"} />
            <path d={sparkPath(m.trend, 280, 56)} pathLength={1} />
          </svg>
          <div className="tmd-rows">
            {m.rows.map((r, i) => (
              <div key={r.label} className="tmd-row">
                <span>{r.label}</span>
                <span className="tmd-bar">
                  <i style={{ ["--s" as string]: Math.max(0, Math.min(100, r.score)) / 100, ["--i" as string]: i }} />
                </span>
                <b>{r.score}</b>
              </div>
            ))}
          </div>
          <div className="tmd-target">
            <div className="tmd-tt">
              <span>Target</span>
              <b>{m.target}%</b>
            </div>
            <div className="tmd-tbar">
              <i style={{ ["--s" as string]: Math.max(0, Math.min(100, m.target)) / 100 }} />
            </div>
          </div>
          {m.updated && <div className="tmd-upd">Updated {m.updated}</div>}
        </div>
      </div>
    </div>
  )
}
