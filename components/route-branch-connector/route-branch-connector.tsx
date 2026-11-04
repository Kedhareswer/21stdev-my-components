"use client"

import { useEffect, useRef, useState } from "react"

export type RouteTarget = {
  name: string
  /** Small line under the name, e.g. "p95 · 140 ms". */
  meta?: string
  /** Example request that this route would take, shown in the source node. */
  example?: string
  /** Why this route was picked, shown under the diagram. */
  reason?: string
  color?: string
}

export type RouteBranchConnectorProps = {
  targets: RouteTarget[]
  eyebrow?: string
  heading?: string
  /** Label on the source node. */
  source?: string
  /** Milliseconds between automatic route changes; 0 turns it off. */
  interval?: number
  height?: string
  className?: string
}

// #region geometry
export const ROW = 68
export const PAD = 26
const SRC_X = 33
const BEND_X = 47
const DST_X = 63

/** Height of the diagram for n targets, in px (and in viewBox units). */
export const diagramHeight = (n: number) => Math.max(n, 1) * ROW + PAD * 2

/** Centre of target i, in px from the top of the diagram. */
export const targetY = (i: number) => PAD + ROW * i + ROW / 2

/** An elbow from the source to target i with rounded corners, in px for a
 *  diagram w px wide. The node columns sit at fixed percentages of w. */
export function branchPath(i: number, n: number, w: number) {
  const h = diagramHeight(n)
  const x0 = (SRC_X / 100) * w
  const xb = (BEND_X / 100) * w
  const x1 = (DST_X / 100) * w
  const ys = h / 2
  const yt = targetY(i)
  const dy = yt - ys
  const f = (v: number) => Math.round(v * 10) / 10
  if (Math.abs(dy) < 0.5) return "M" + f(x0) + " " + ys + " H" + f(x1)
  const s = dy > 0 ? 1 : -1
  const r = Math.min(14, Math.abs(dy) / 2, (xb - x0) / 2)
  return (
    "M" + f(x0) + " " + ys +
    " H" + f(xb - r) +
    " Q" + f(xb) + " " + ys + " " + f(xb) + " " + (ys + s * r) +
    " V" + (yt - s * r) +
    " Q" + f(xb) + " " + yt + " " + f(xb + r) + " " + yt +
    " H" + f(x1)
  )
}
export const wrap = (i: number, n: number) => (n > 0 ? ((i % n) + n) % n : 0)
// #endregion

const SANS = 'ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif'
const MONO = 'ui-monospace,"SF Mono","Cascadia Mono",Menlo,Consolas,monospace'
const EASE = "cubic-bezier(.22,1,.36,1)"
const SPRING = "cubic-bezier(.34,1.56,.64,1)"
const PALETTE = ["#38bdf8", "#a78bfa", "#fbbf24", "#a3e635", "#fb7185"]

const CSS =
  ".rbc-stage{display:flex;align-items:center;justify-content:center;padding:48px 16px;box-sizing:border-box;background:var(--color-background);font-family:" + SANS + "}" +
  ".rbc-card{position:relative;width:100%;max-width:720px;border-radius:28px;padding:26px 26px 22px;box-sizing:border-box;color:#e8ecf6;overflow:hidden;isolation:isolate;" +
  "background:radial-gradient(80% 60% at 50% 0%,color-mix(in srgb,var(--rbc-c) 16%,transparent),transparent 70%),linear-gradient(180deg,#0e1322,#080b14);" +
  "box-shadow:0 1px 0 rgba(255,255,255,.08) inset,0 0 0 1px rgba(255,255,255,.06),0 40px 80px -40px rgba(4,8,24,.75);transition:background 1s;animation:rbc-in .9s " + EASE + " both}" +
  "@keyframes rbc-in{from{opacity:0;transform:translateY(24px) scale(.98)}to{opacity:1;transform:none}}" +
  ".rbc-card::before{content:'';position:absolute;inset:0;z-index:-1;background:radial-gradient(rgba(148,163,200,.16) 1px,transparent 1.3px) 0 0/18px 18px;-webkit-mask-image:radial-gradient(90% 80% at 50% 50%,#000,transparent);mask-image:radial-gradient(90% 80% at 50% 50%,#000,transparent)}" +
  ".rbc-top{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;margin-bottom:10px}" +
  ".rbc-eyebrow{display:flex;align-items:center;gap:8px;font:500 11px/1 " + MONO + ";letter-spacing:.18em;text-transform:uppercase;color:rgba(232,236,246,.5);margin:0 0 10px}" +
  ".rbc-eyebrow i{width:6px;height:6px;border-radius:50%;background:var(--rbc-c);box-shadow:0 0 10px var(--rbc-c);transition:background .6s,box-shadow .6s}" +
  ".rbc-h{font:650 clamp(22px,3.6vw,30px)/1.1 " + SANS + ";letter-spacing:-.03em;margin:0}" +
  ".rbc-live{flex:none;display:inline-flex;align-items:center;gap:7px;font:500 11px/1 " + MONO + ";letter-spacing:.08em;color:rgba(232,236,246,.55);padding:7px 10px;border-radius:999px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);cursor:pointer}" +
  ".rbc-live b{width:7px;height:7px;border-radius:50%;background:#22c55e;animation:rbc-blink 1.6s ease-in-out infinite}" +
  ".rbc-live[aria-pressed=true] b{background:#f59e0b;animation:none}" +
  ".rbc-live:focus-visible,.rbc-node:focus-visible{outline:2px solid var(--rbc-c);outline-offset:3px}" +
  "@keyframes rbc-blink{50%{opacity:.35}}" +
  ".rbc-dia{position:relative;width:100%}" +
  ".rbc-svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}" +
  ".rbc-svg path{fill:none;stroke-linecap:round;stroke-linejoin:round}" +
  ".rbc-base{stroke:rgba(148,163,200,.18);stroke-width:1.5;transition:stroke .5s}" +
  ".rbc-lit{stroke:var(--c);stroke-width:2.2;stroke-dasharray:100;stroke-dashoffset:100;opacity:0;transition:stroke-dashoffset .9s " + EASE + ",opacity .4s;filter:drop-shadow(0 0 6px var(--c))}" +
  ".rbc-lit[data-on=true]{stroke-dashoffset:0;opacity:1}" +
  ".rbc-pkt{stroke:#fff;stroke-width:3.2;stroke-dasharray:5 105;stroke-dashoffset:5;opacity:0;filter:drop-shadow(0 0 4px #fff) drop-shadow(0 0 10px var(--c))}" +
  ".rbc-pkt[data-on=true]{animation:rbc-run 1.6s cubic-bezier(.5,0,.3,1) .5s infinite}" +
  "@keyframes rbc-run{0%{stroke-dashoffset:5;opacity:1}75%{stroke-dashoffset:-98;opacity:1}100%{stroke-dashoffset:-98;opacity:0}}" +
  ".rbc-src{position:absolute;left:0;top:50%;transform:translateY(-50%);width:33%;padding:14px 14px 13px;box-sizing:border-box;border-radius:18px;" +
  "background:linear-gradient(180deg,rgba(255,255,255,.08),rgba(255,255,255,.03));border:1px solid rgba(255,255,255,.12);box-shadow:0 18px 30px -18px rgba(0,0,0,.8),inset 0 1px 0 rgba(255,255,255,.1)}" +
  ".rbc-src::after{content:'';position:absolute;right:-5px;top:50%;width:9px;height:9px;margin-top:-4.5px;border-radius:50%;background:var(--rbc-c);box-shadow:0 0 0 4px color-mix(in srgb,var(--rbc-c) 25%,transparent),0 0 14px var(--rbc-c);transition:background .6s}" +
  ".rbc-src small{display:flex;align-items:center;gap:6px;font:500 10px/1 " + MONO + ";letter-spacing:.14em;text-transform:uppercase;color:rgba(232,236,246,.5);margin-bottom:9px}" +
  ".rbc-q{display:block;font:500 13px/1.4 " + SANS + ";color:#f4f6fb;animation:rbc-q .55s " + EASE + " both}" +
  "@keyframes rbc-q{from{opacity:0;transform:translateY(8px);filter:blur(3px)}to{opacity:1;transform:none;filter:none}}" +
  ".rbc-node{position:absolute;left:63%;right:0;display:flex;align-items:center;gap:11px;height:50px;margin-top:-25px;padding:0 14px 0 12px;box-sizing:border-box;border-radius:15px;cursor:pointer;text-align:left;color:inherit;font:inherit;" +
  "background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.08);transition:background .45s,border-color .45s,transform .55s " + SPRING + ",box-shadow .45s;animation:rbc-node .7s " + SPRING + " both;animation-delay:calc(var(--k) * 80ms + 200ms)}" +
  "@keyframes rbc-node{from{opacity:0;translate:16px 0}to{opacity:1;translate:0 0}}" +
  ".rbc-node:hover{background:rgba(255,255,255,.07)}" +
  ".rbc-node[aria-pressed=true]{transform:translateX(4px);background:color-mix(in srgb,var(--c) 14%,rgba(255,255,255,.04));border-color:color-mix(in srgb,var(--c) 55%,transparent);" +
  "box-shadow:0 0 0 4px color-mix(in srgb,var(--c) 10%,transparent),0 16px 30px -16px color-mix(in srgb,var(--c) 70%,transparent)}" +
  ".rbc-node::before{content:'';position:absolute;left:-5px;top:50%;width:9px;height:9px;margin-top:-4.5px;border-radius:50%;background:#0b0f1a;border:1.5px solid rgba(148,163,200,.4);transition:background .4s,border-color .4s}" +
  ".rbc-node[aria-pressed=true]::before{background:var(--c);border-color:var(--c)}" +
  ".rbc-ic{flex:none;width:28px;height:28px;border-radius:9px;display:grid;place-items:center;background:rgba(255,255,255,.06);color:rgba(232,236,246,.6);transition:background .45s,color .45s}" +
  ".rbc-node[aria-pressed=true] .rbc-ic{background:var(--c);color:#0b0f1a}" +
  ".rbc-nm{flex:1;min-width:0}" +
  ".rbc-nm b{display:block;font:600 13.5px/1.2 " + SANS + ";white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:rgba(232,236,246,.7);transition:color .4s}" +
  ".rbc-node[aria-pressed=true] .rbc-nm b{color:#fff}" +
  ".rbc-nm span{display:block;font:500 10.5px/1.3 " + MONO + ";color:rgba(232,236,246,.42);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
  ".rbc-why{display:flex;align-items:center;gap:10px;margin-top:8px;padding:12px 14px;border-radius:14px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.07);font:400 13px/1.45 " + SANS + ";color:rgba(232,236,246,.72);min-height:44px;box-sizing:border-box}" +
  ".rbc-why b{flex:none;font:600 10px/1 " + MONO + ";letter-spacing:.12em;text-transform:uppercase;color:var(--rbc-c);transition:color .6s}" +
  ".rbc-why span{animation:rbc-q .55s " + EASE + " both}" +
  "@media (max-width:560px){.rbc-card{padding:22px 16px 16px}.rbc-src{padding:11px 10px}.rbc-q{font-size:11.5px}.rbc-node{gap:8px;padding:0 8px 0 10px}.rbc-ic{display:none}.rbc-nm b{font-size:12.5px}.rbc-top{flex-direction:column;align-items:flex-start}}" +
  "@media (prefers-reduced-motion:reduce){.rbc-card,.rbc-node,.rbc-q,.rbc-why span,.rbc-live b{animation:none}.rbc-pkt[data-on=true]{animation:none}.rbc-lit,.rbc-node,.rbc-card{transition:none}}"

function TargetIcon({ i }: { i: number }) {
  const d = ["M9 2 3.5 9H8l-1 5 5.5-7H8z", "M3 8h10M8 3v10", "M8 2.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11zM8 5v3l2 1.5", "M2.5 8s2-4 5.5-4 5.5 4 5.5 4-2 4-5.5 4-5.5-4-5.5-4zM8 6.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z", "M3 3h10v10H3z"][i % 5]
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d={d} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function RouteBranchConnector({
  targets,
  eyebrow = "Model router",
  heading = "Every request finds its route",
  source = "Incoming",
  interval = 2800,
  height = "100svh",
  className = "",
}: RouteBranchConnectorProps) {
  const n = targets.length
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const [hovering, setHovering] = useState(false)
  const [inView, setInView] = useState(false)
  const card = useRef(null as HTMLElement | null)
  const dia = useRef(null as HTMLDivElement | null)
  const [w, setW] = useState(640)
  const h = diagramHeight(n)
  const cur = targets[wrap(active, n)]
  const color = (i: number) => targets[i]?.color ?? PALETTE[i % PALETTE.length]

  useEffect(() => {
    const el = card.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.25 })
    io.observe(el)
    // Width is measured on resize only and kept in state; nothing reads layout while it animates.
    const ro = new ResizeObserver(([e]) => setW(Math.max(1, Math.round(e.contentRect.width))))
    if (dia.current) ro.observe(dia.current)
    return () => {
      io.disconnect()
      ro.disconnect()
    }
  }, [])

  useEffect(() => {
    if (!interval || paused || hovering || !inView || n < 2) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    // A timeout per step, so a manual pick always gets a full interval on screen.
    const t = window.setTimeout(() => setActive((a) => wrap(a + 1, n)), interval)
    return () => window.clearTimeout(t)
  }, [interval, paused, hovering, inView, n, active])

  if (!cur) return null

  return (
    <div className={"rbc-stage " + className} style={{ minHeight: height }}>
      <style>{CSS}</style>
      <section
        ref={card}
        className="rbc-card"
        style={{ ["--rbc-c" as string]: color(wrap(active, n)) }}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        aria-label={heading}
      >
        <div className="rbc-top">
          <div>
            <p className="rbc-eyebrow">
              <i aria-hidden="true" />
              {eyebrow}
            </p>
            <h2 className="rbc-h">{heading}</h2>
          </div>
          {interval > 0 && (
            <button type="button" className="rbc-live" aria-pressed={paused} onClick={() => setPaused((p) => !p)}>
              <b aria-hidden="true" />
              {paused ? "Paused" : "Live"}
            </button>
          )}
        </div>

        <div className="rbc-dia" ref={dia} style={{ height: h }}>
          <svg className="rbc-svg" viewBox={"0 0 " + w + " " + h} aria-hidden="true">
            {targets.map((_, i) => {
              const d = branchPath(i, n, w)
              const on = i === wrap(active, n)
              return (
                <g key={i} style={{ ["--c" as string]: color(i) }}>
                  <path className="rbc-base" d={d} />
                  <path className="rbc-lit" d={d} pathLength={100} data-on={on} />
                  <path className="rbc-pkt" d={d} pathLength={100} data-on={on} key={on ? "on" + active : "off"} />
                </g>
              )
            })}
          </svg>

          <div className="rbc-src">
            <small>{source}</small>
            <span className="rbc-q" key={active} aria-live="polite">
              {cur.example ?? cur.name}
            </span>
          </div>

          {targets.map((t, i) => (
            <button
              key={t.name + i}
              type="button"
              className="rbc-node"
              aria-pressed={i === wrap(active, n)}
              onClick={() => setActive(i)}
              onFocus={() => setActive(i)}
              style={{ top: targetY(i), ["--c" as string]: color(i), ["--k" as string]: i }}
            >
              <span className="rbc-ic">
                <TargetIcon i={i} />
              </span>
              <span className="rbc-nm">
                <b>{t.name}</b>
                {t.meta && <span>{t.meta}</span>}
              </span>
            </button>
          ))}
        </div>

        {cur.reason && (
          <p className="rbc-why">
            <b>Why</b>
            <span key={active}>{cur.reason}</span>
          </p>
        )}
      </section>
    </div>
  )
}
