"use client"

import * as React from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

// A wall of photo columns that the page scroll pulls in opposite directions.
// Each column hangs on its own spring, so a fast scroll leaves them strung out
// and stretched like elastic, then they catch up and settle. A headline sits
// over the wall in difference blend.

export type ElasticPhoto = {
  src: string
  alt?: string
  /** Shown on hover. */
  caption?: string
}

export type ElasticColumnGalleryProps = {
  photos: ElasticPhoto[]
  /** Big headline over the wall. */
  heading?: React.ReactNode
  /** Small line under the headline. */
  note?: React.ReactNode
  /** Columns on wide stages; phones use three. */
  columns?: number
  /** How much the columns lag and stretch. 0 moves them rigidly. */
  elasticity?: number
  /** Page scroll the section takes, as a multiple of `height`. */
  scrollLength?: number
  background?: string
  /** Stage height. Keep it a definite length; percentages collapse once installed. */
  height?: string
  className?: string
}

// #region columns
/** Which photo goes in slot `row` of column `col`, spread so neighbours (across and down) differ. */
export function photoFor(col: number, row: number, n: number, cols: number): number {
  if (n <= 0) return 0
  const k = row * cols + col
  const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a)
  // a stride that shares no factor with n visits every photo before repeating
  const step = [5, 7, 3, 11, 13, 17].find((s) => gcd(s, n) === 1 && n > 2) ?? 1
  return (k * step) % n
}

/** Tile height as a multiple of the column width: alternating tall and wide frames, offset per column. */
export function tileRatio(col: number, row: number): number {
  const r = [1.32, 0.86, 1.1, 1.42, 0.78, 1.2]
  return r[(row + col * 2) % r.length]
}

/** Total height of a column of `rows` tiles for a column width and gap. */
export function columnHeight(col: number, rows: number, cw: number, gap: number): number {
  let h = 0
  for (let r = 0; r < rows; r++) h += Math.round(cw * tileRatio(col, r)) + gap
  return h - gap
}

/** Target offset of column `col` at scroll progress p: even columns rise, odd ones fall. */
export function columnTarget(col: number, p: number, travel: number): number {
  const t = Math.max(0, Math.min(1, p))
  return col % 2 === 0 ? -t * travel : -(1 - t) * travel
}

/** Spring rate for a column: middle columns are tighter, outer ones lag more. */
export function columnRate(col: number, cols: number, elasticity: number): number {
  const mid = (cols - 1) / 2
  const out = cols > 1 ? Math.abs(col - mid) / mid : 0
  return 16 - Math.max(0, Math.min(1, elasticity)) * (6 + out * 5)
}

/** Stretch along the scroll for a column lagging `lag` px behind its target. */
export function stretchFor(lag: number, h: number): number {
  return Math.min(0.22, Math.abs(lag) / Math.max(1, h) * 0.9)
}
// #endregion

const CSS =
  ".ecg-track{position:relative;width:100%}" +
  ".ecg-stage{position:sticky;top:0;overflow:hidden;isolation:isolate}" +
  ".ecg-wall{position:absolute;inset:0;display:flex;justify-content:center}" +
  ".ecg-col{position:relative;flex:none;will-change:transform}" +
  ".ecg-tile{position:absolute;left:0;right:0;margin:0;overflow:hidden;border-radius:6px;background:#1b1a19}" +
  ".ecg-tile>img{position:absolute;inset:0;width:100%;height:100%;max-width:none;object-fit:cover;filter:saturate(.8) brightness(.7);transition:filter .6s ease,transform 1.1s cubic-bezier(.16,1,.3,1)}" +
  ".ecg-tile:hover>img{filter:none;transform:scale(1.06)}" +
  ".ecg-tile>figcaption{position:absolute;left:10px;right:10px;bottom:10px;font:600 11px/1.3 ui-sans-serif,system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#fff;opacity:0;transform:translateY(8px);transition:opacity .4s ease,transform .5s cubic-bezier(.16,1,.3,1);text-shadow:0 1px 8px rgba(0,0,0,.6)}" +
  ".ecg-tile:hover>figcaption{opacity:1;transform:none}" +
  ".ecg-fade{position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,var(--ecg-bg),transparent 16%,transparent 84%,var(--ecg-bg))}" +
  ".ecg-veil{position:absolute;inset:0;pointer-events:none;background:radial-gradient(46% 38% at 50% 50%,rgba(8,7,6,.78),rgba(8,7,6,.2) 70%,transparent)}" +
  ".ecg-head{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(94%,1100px);text-align:center;color:#f7f2ea;pointer-events:none;font-family:ui-sans-serif,system-ui,sans-serif;text-shadow:0 2px 30px rgba(0,0,0,.45)}" +
  ".ecg-h{display:block;margin:0;font-weight:800;font-size:clamp(54px,11vw,188px);line-height:.84;letter-spacing:-.06em;text-transform:uppercase}" +
  ".ecg-h>span{display:block;overflow:hidden}" +
  ".ecg-h>span>span{display:block;animation:ecg-up 1.2s cubic-bezier(.16,1,.3,1) both}" +
  ".ecg-h>span:nth-child(2)>span{animation-delay:.12s}" +
  ".ecg-note{display:inline-flex;align-items:center;gap:12px;margin-top:22px;font-size:12px;font-weight:600;letter-spacing:.26em;text-transform:uppercase}" +
  ".ecg-note::before,.ecg-note::after{content:'';width:34px;height:1px;background:currentColor}" +
  ".ecg-meter{position:absolute;right:clamp(14px,2.4vw,28px);top:50%;width:2px;height:120px;transform:translateY(-50%);background:rgba(255,255,255,.18);border-radius:2px;overflow:hidden;pointer-events:none}" +
  ".ecg-meter>i{position:absolute;left:0;top:0;width:100%;height:100%;background:#fff;transform-origin:50% 0;transform:scaleY(0)}" +
  "@keyframes ecg-up{from{transform:translateY(105%)}to{transform:none}}" +
  "@media (prefers-reduced-motion:reduce){.ecg-h>span>span{animation:none}.ecg-tile>img,.ecg-tile>figcaption{transition:none}}"

export default function ElasticColumnGallery({
  photos,
  heading = (
    <>
      <span>
        <span>Ten years</span>
      </span>
      <span>
        <span>of looking</span>
      </span>
    </>
  ),
  note = "The archive · 2016 — 2026",
  columns = 5,
  elasticity = 0.8,
  scrollLength = 2.4,
  background = "#0f0e0d",
  height = "100svh",
  className,
}: ElasticColumnGalleryProps) {
  const n = photos.length
  const ROWS = 7
  const trackRef = React.useRef(null as HTMLDivElement | null)
  const stageRef = React.useRef(null as HTMLDivElement | null)
  const meterRef = React.useRef(null as HTMLElement | null)
  const colRefs = React.useRef([] as (HTMLDivElement | null)[])
  const tileRefs = React.useRef([] as (HTMLElement | null)[][])
  const [cols, setCols] = React.useState(columns)

  React.useEffect(() => {
    const track = trackRef.current
    const stage = stageRef.current
    if (!track || !stage || n === 0) return
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    let W = 1, H = 1, cw = 1, gap = 10, count = cols
    let travel = new Float64Array(cols)
    let y = new Float64Array(cols)
    let p = 0, raf = 0, last = 0, visible = true, t0 = -1

    const layout = (w: number, h: number) => {
      W = Math.max(1, w)
      H = Math.max(1, h)
      const want = W < 640 ? 3 : columns
      if (want !== count) {
        count = want
        setCols(want)
        return
      }
      gap = W < 640 ? 8 : Math.max(10, Math.round(W * 0.008))
      cw = Math.floor((W * (W < 640 ? 1.08 : 1.02) - gap * (count - 1)) / count)
      travel = new Float64Array(count)
      const prev = y
      y = new Float64Array(count)
      for (let c = 0; c < count; c++) {
        const colH = columnHeight(c, ROWS, cw, gap)
        travel[c] = Math.max(0, colH - H)
        y[c] = prev[c] ?? columnTarget(c, p, travel[c])
        const col = colRefs.current[c]
        if (col) {
          col.style.width = cw + "px"
          col.style.height = colH + "px"
          col.style.marginRight = c < count - 1 ? gap + "px" : "0px"
        }
        let top = 0
        for (let r = 0; r < ROWS; r++) {
          const el = tileRefs.current[c]?.[r]
          const th = Math.round(cw * tileRatio(c, r))
          if (el) {
            el.style.top = top + "px"
            el.style.height = th + "px"
          }
          top += th + gap
        }
      }
      kick()
    }

    const frame = (now: number) => {
      raf = 0
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60
      last = now
      if (t0 < 0) t0 = now
      const intro = mq.matches ? 1 : Math.min(1, (now - t0) / 1400)
      let busy = intro < 1
      for (let c = 0; c < count; c++) {
        const goal = columnTarget(c, p, travel[c])
        // entrance: columns slide in from alternating sides of their resting place
        const k = Math.max(0, Math.min(1, intro * 1.4 - c * 0.08))
        const e = 1 - Math.pow(1 - k, 4)
        const from = (c % 2 === 0 ? 1 : -1) * H * 0.6 * (1 - e)
        y[c] = mq.matches ? goal : y[c] + (goal - y[c]) * (1 - Math.exp(-dt * columnRate(c, count, elasticity)))
        const lag = goal - y[c]
        if (Math.abs(lag) > 0.3) busy = true
        const s = mq.matches ? 0 : stretchFor(lag, H) * elasticity
        const el = colRefs.current[c]
        if (el) {
          el.style.transformOrigin = "50% " + (lag < 0 ? "100%" : "0%")
          el.style.transform = "translate3d(0," + (y[c] + from).toFixed(2) + "px,0) scaleY(" + (1 + s).toFixed(4) + ")"
          el.style.opacity = String(Math.min(1, e * 1.2))
        }
      }
      const m = meterRef.current
      if (m) m.style.transform = "scaleY(" + p.toFixed(4) + ")"
      if (busy && visible) raf = requestAnimationFrame(frame)
      else last = 0
    }
    function kick() {
      if (!raf && visible) raf = requestAnimationFrame(frame)
    }

    const trigger = ScrollTrigger.create({
      trigger: track,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        p = self.progress
        kick()
      },
    })
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect
      layout(r.width, r.height)
    })
    ro.observe(stage)
    const io = new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting
      kick()
    })
    io.observe(stage)
    const onMq = () => kick()
    mq.addEventListener("change", onMq)

    return () => {
      cancelAnimationFrame(raf)
      trigger.kill()
      ro.disconnect()
      io.disconnect()
      mq.removeEventListener("change", onMq)
    }
  }, [n, cols, columns, elasticity])

  if (n === 0) return null
  const trackH = "calc(" + height + " * " + (1 + scrollLength).toFixed(3) + ")"
  const vars = { height, background, "--ecg-bg": background } as React.CSSProperties

  return (
    <div ref={trackRef} className={"ecg-track" + (className ? " " + className : "")} style={{ height: trackH }}>
      <style>{CSS}</style>
      <div ref={stageRef} className="ecg-stage" style={vars} role="region" aria-label="Photo archive">
        <div className="ecg-wall">
          {Array.from({ length: cols }, (_, c) => (
            <div
              key={c}
              className="ecg-col"
              style={{ opacity: 0 }}
              ref={(el) => {
                colRefs.current[c] = el
              }}
            >
              {Array.from({ length: ROWS }, (_, r) => {
                const ph = photos[photoFor(c, r, n, cols)]
                return (
                  <figure
                    key={r}
                    className="ecg-tile"
                    ref={(el) => {
                      if (!tileRefs.current[c]) tileRefs.current[c] = []
                      tileRefs.current[c][r] = el
                    }}
                  >
                    <img src={ph.src} alt={ph.alt ?? ""} decoding="async" draggable={false} />
                    {ph.caption ? <figcaption>{ph.caption}</figcaption> : null}
                  </figure>
                )
              })}
            </div>
          ))}
        </div>
        <div className="ecg-fade" aria-hidden="true" />
        <div className="ecg-veil" aria-hidden="true" />
        <div className="ecg-head">
          <h2 className="ecg-h">{heading}</h2>
          {note ? <span className="ecg-note">{note}</span> : null}
        </div>
        <span className="ecg-meter" aria-hidden="true">
          <i ref={meterRef} />
        </span>
      </div>
    </div>
  )
}
