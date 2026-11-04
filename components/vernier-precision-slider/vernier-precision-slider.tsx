"use client"

import React, { useEffect, useRef, useState } from "react"

export interface VernierPrecisionSliderProps {
  label?: string
  value?: number
  defaultValue?: number
  /** Non-negative range. */
  min?: number
  max?: number
  /** Decimal places kept and shown (0–3). */
  decimals?: number
  onChange?: (value: number) => void
  /** Appended to the readout, e.g. "°C". */
  unit?: string
  /** Ticks along the ruler. */
  ticks?: number
  /** Helper line under the ruler. Empty string hides it. */
  hint?: string
  accent?: string
  font?: string
  className?: string
}

const FONT = "'Geist','Inter','SF Pro Display','Segoe UI Variable Display',ui-sans-serif,system-ui,sans-serif"
const PADX = 18

const CSS =
  ".vps-root{--vps-acc:#e5482d;position:relative;width:100%;max-width:560px;padding:22px 22px 18px;border-radius:26px;color:#1d1b18;font-family:var(--vps-font);-webkit-font-smoothing:antialiased;user-select:none;-webkit-user-select:none;" +
  "background:linear-gradient(180deg,#fbfaf7,#f0ece5);box-shadow:inset 0 1px 0 #fff,inset 0 0 0 1px rgba(40,30,20,.06),0 1px 2px rgba(40,30,20,.06),0 30px 60px -30px rgba(40,30,20,.35)}" +
  ".vps-head{display:flex;align-items:flex-end;justify-content:space-between;gap:12px}" +
  ".vps-lbl{font-size:14px;font-weight:560;color:#6b645a;padding-bottom:6px}" +
  ".vps-read{display:flex;align-items:baseline;gap:6px}" +
  // the odometer: one column of digits per place, rolled continuously by transform
  ".vps-num{display:inline-flex;height:1em;line-height:1em;font-size:40px;font-weight:600;letter-spacing:-.04em;font-variant-numeric:tabular-nums;overflow:hidden;-webkit-mask:linear-gradient(transparent,#000 16%,#000 84%,transparent);mask:linear-gradient(transparent,#000 16%,#000 84%,transparent)}" +
  ".vps-col{display:flex;flex-direction:column;width:.6em;text-align:center;will-change:transform;transition:opacity .25s,width .25s}" +
  ".vps-col[data-off]{opacity:0;width:0}" +
  ".vps-col span{height:1em}" +
  ".vps-dot{width:.24em;text-align:center}" +
  ".vps-unit{font-size:16px;font-weight:560;color:#8d857a}" +
  ".vps-fine{display:inline-flex;align-items:center;gap:5px;margin-left:8px;padding:3px 8px;border-radius:999px;font-size:11px;font-weight:620;letter-spacing:.02em;color:#fff;background:var(--vps-acc);opacity:0;transform:translateY(4px) scale(.9);transition:opacity .2s,transform .35s cubic-bezier(.3,1.6,.5,1)}" +
  ".vps-root[data-fine] .vps-fine{opacity:1;transform:none}" +
  ".vps-track{position:relative;height:64px;margin-top:14px;border-radius:16px;cursor:ew-resize;touch-action:none;outline:none;" +
  "background:linear-gradient(180deg,#ece7df,#f6f3ee);box-shadow:inset 0 2px 4px rgba(40,30,20,.12),inset 0 -1px 0 #fff}" +
  ".vps-track:focus-visible{box-shadow:inset 0 2px 4px rgba(40,30,20,.12),0 0 0 2px #fbfaf7,0 0 0 4px var(--vps-acc)}" +
  ".vps-row{position:absolute;left:" + PADX + "px;right:" + PADX + "px;top:12px;bottom:12px;pointer-events:none}" +
  ".vps-t{position:absolute;bottom:0;left:0;width:1.5px;height:12px;margin-left:-.75px;border-radius:1px;background:#b8b0a4;transform-origin:50% 100%;will-change:transform}" +
  ".vps-t[data-major]{height:18px;background:#a1988b}" +
  ".vps-t[data-on]{background:#2a2622}" +
  // the cursor: a frosted glass slug with a hairline index
  ".vps-cur{position:absolute;top:6px;bottom:6px;left:0;width:34px;margin-left:-17px;border-radius:12px;pointer-events:none;will-change:transform;" +
  "background:linear-gradient(180deg,rgba(255,255,255,.75),rgba(255,255,255,.35));-webkit-backdrop-filter:blur(3px) saturate(1.3);backdrop-filter:blur(3px) saturate(1.3);" +
  "box-shadow:inset 0 1px 0 #fff,inset 0 0 0 1px rgba(255,255,255,.6),0 1px 2px rgba(40,30,20,.15),0 8px 18px -8px rgba(40,30,20,.45);transition:box-shadow .3s}" +
  ".vps-cur::after{content:'';position:absolute;left:50%;top:7px;bottom:7px;width:2px;margin-left:-1px;border-radius:2px;background:var(--vps-acc);box-shadow:0 0 6px color-mix(in oklab,var(--vps-acc) 60%,transparent)}" +
  ".vps-root[data-drag] .vps-cur{box-shadow:inset 0 1px 0 #fff,inset 0 0 0 1px rgba(255,255,255,.6),0 2px 3px rgba(40,30,20,.2),0 14px 26px -10px rgba(40,30,20,.55)}" +
  ".vps-scale{display:flex;justify-content:space-between;margin:8px " + PADX + "px 0;font-size:11px;color:#9a9286;font-variant-numeric:tabular-nums}" +
  ".vps-hint{margin-top:10px;font-size:11.5px;color:#a49c90;text-align:center}" +
  ".vps-root:not([data-in]){opacity:0;transform:translateY(10px)}.vps-root[data-in]{transition:opacity .5s,transform .8s cubic-bezier(.3,1.4,.5,1)}" +
  "@media (prefers-reduced-motion:reduce){.vps-root,.vps-fine,.vps-col{transition-duration:.01ms!important}}"

// #region vernier
/** Drag gain from how far the pointer has strayed vertically from the track: further away = finer. */
export function fineFactor(dy: number) {
  const d = Math.abs(dy)
  return d < 36 ? 1 : d < 90 ? 0.25 : 0.1
}

/** Tick swell 0..1 for a tick `dx` px from the cursor. */
export function lens(dx: number, reach = 44) {
  const x = Math.abs(dx) / reach
  return x >= 1 ? 0 : 0.5 + 0.5 * Math.cos(Math.PI * x)
}

/** Round to `decimals` and clamp. */
export function snap(v: number, min: number, max: number, decimals: number) {
  const f = Math.pow(10, decimals)
  return Math.min(max, Math.max(min, Math.round(v * f) / f))
}

/**
 * Continuous odometer offsets for each digit place of a non-negative value, highest place first.
 * The lowest place turns smoothly; a higher place only turns while every place below it reads 9.
 */
export function odometer(v: number, places: number, decimals: number) {
  const n = Math.max(0, v) * Math.pow(10, decimals)
  const out: number[] = []
  for (let k = places - 1; k >= 0; k--) {
    const p = Math.pow(10, k)
    const digit = Math.floor(n / p) % 10
    const below = n % p
    const roll = k === 0 ? n - Math.floor(n) : Math.max(0, below - (p - 1))
    out.push(digit + roll)
  }
  return out
}
// #endregion

export default function VernierPrecisionSlider({
  label = "Temperature",
  value,
  defaultValue = 21.4,
  min = 0,
  max = 40,
  decimals = 1,
  onChange,
  unit = "°C",
  ticks = 81,
  hint = "Drag away from the ruler for fine control · Shift + arrows for bigger steps",
  accent,
  font = FONT,
  className,
}: VernierPrecisionSliderProps) {
  const dec = Math.min(3, Math.max(0, Math.round(decimals)))
  const [own, setOwn] = useState(snap(defaultValue, min, max, dec))
  const v = value ?? own
  const [drag, setDrag] = useState(false)
  const [fine, setFine] = useState(1)
  const [entered, setEntered] = useState(false)
  const track = useRef(null as HTMLDivElement | null)
  const row = useRef(null as HTMLDivElement | null)
  const cur = useRef(null as HTMLDivElement | null)
  const num = useRef(null as HTMLSpanElement | null)
  const places = String(Math.floor(Math.max(max, 1))).length + dec
  const sim = useRef({ shown: v, vel: 0, target: v, w: 0, left: 0, raf: 0, last: 0, reduced: false, lastX: 0, startY: 0, raw: v })

  const commit = (nv: number) => {
    const s = snap(nv, min, max, dec)
    if (s === v) return
    if (value === undefined) setOwn(s)
    onChange?.(s)
  }

  // One frame from stored numbers only: transforms and attributes, nothing measured.
  const paint = () => {
    const s = sim.current
    const r = row.current
    if (!r || !s.w) return
    const f = max === min ? 0 : (s.shown - min) / (max - min)
    const x = f * s.w
    const kids = r.children
    for (let i = 0; i < kids.length; i++) {
      const tx = (i / (kids.length - 1)) * s.w
      const el = kids[i] as HTMLElement
      el.style.transform = "translateX(" + tx.toFixed(2) + "px) scaleY(" + (1 + lens(tx - x) * 1.35).toFixed(3) + ")"
      const on = tx <= x + 0.5
      if (on !== el.hasAttribute("data-on")) on ? el.setAttribute("data-on", "") : el.removeAttribute("data-on")
    }
    if (cur.current) cur.current.style.transform = "translateX(" + (PADX + x).toFixed(2) + "px)"
    const cols = num.current?.querySelectorAll("[data-col]")
    if (cols) {
      const offs = odometer(s.shown, places, dec)
      const lead = Math.floor(Math.max(0, s.shown)).toString().length
      cols.forEach((c, i) => {
        const el = c as HTMLElement
        el.style.transform = "translateY(" + (-offs[i]).toFixed(3) + "em)"
        // hide leading zeros above the value's own integer places
        const intPlace = places - dec - i
        const off = intPlace > lead && intPlace > 1
        if (off !== el.hasAttribute("data-off")) off ? el.setAttribute("data-off", "") : el.removeAttribute("data-off")
      })
    }
  }

  const tick = (t: number) => {
    const s = sim.current
    const dt = Math.min(1 / 30, s.last ? (t - s.last) / 1000 : 1 / 60)
    s.last = t
    if (s.reduced) {
      s.shown = s.target
      s.vel = 0
    } else {
      const a = 220 * (s.target - s.shown) - 24 * s.vel
      s.vel += a * dt
      s.shown += s.vel * dt
    }
    paint()
    const eps = Math.pow(10, -dec) * 0.02
    if (Math.abs(s.target - s.shown) > eps || Math.abs(s.vel) > eps) s.raf = requestAnimationFrame(tick)
    else {
      s.shown = s.target
      s.vel = 0
      s.raf = 0
      s.last = 0
      paint()
    }
  }
  const kick = () => {
    const s = sim.current
    if (!s.raf) s.raf = requestAnimationFrame(tick)
  }

  useEffect(() => {
    sim.current.target = v
    if (!drag) sim.current.raw = v
    kick()
  }, [v])

  useEffect(() => {
    const s = sim.current
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    s.reduced = mq.matches
    const on = () => (s.reduced = mq.matches)
    mq.addEventListener("change", on)
    const ro = new ResizeObserver(([e]) => {
      s.w = e.contentRect.width
      paint()
    })
    if (row.current) ro.observe(row.current)
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setEntered(true)))
    return () => {
      ro.disconnect()
      mq.removeEventListener("change", on)
      cancelAnimationFrame(id)
      cancelAnimationFrame(s.raf)
      s.raf = 0
    }
  }, [])

  const onDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return
    const t = track.current
    if (!t) return
    const s = sim.current
    // measured once per press; every move after reads this edge and the stored width
    const r = t.getBoundingClientRect()
    s.left = r.left
    // a press can beat the ResizeObserver's first callback; take the width from the same read
    if (!s.w) s.w = r.width - PADX * 2
    t.setPointerCapture?.(e.pointerId)
    s.lastX = e.clientX
    s.startY = e.clientY
    const f = (e.clientX - s.left - PADX) / (s.w || 1)
    s.raw = min + Math.min(1, Math.max(0, f)) * (max - min)
    setDrag(true)
    setFine(1)
    commit(s.raw)
  }
  const onMove = (e: React.PointerEvent) => {
    if (!drag) return
    const s = sim.current
    const k = fineFactor(e.clientY - s.startY)
    if (k !== fine) setFine(k)
    s.raw = Math.min(max, Math.max(min, s.raw + ((e.clientX - s.lastX) / (s.w || 1)) * (max - min) * k))
    s.lastX = e.clientX
    commit(s.raw)
  }
  const onUp = () => {
    if (!drag) return
    setDrag(false)
    setFine(1)
  }
  const onKey = (e: React.KeyboardEvent) => {
    const unitStep = Math.pow(10, -dec)
    const step = e.shiftKey ? unitStep * 10 : unitStep
    const map: Record<string, number> = { ArrowRight: step, ArrowUp: step, ArrowLeft: -step, ArrowDown: -step, PageUp: (max - min) / 10, PageDown: -(max - min) / 10 }
    let nv: number | null = null
    if (e.key in map) nv = v + map[e.key]
    else if (e.key === "Home") nv = min
    else if (e.key === "End") nv = max
    if (nv === null) return
    e.preventDefault()
    commit(nv)
  }

  const n = Math.max(2, ticks)
  const majorEvery = Math.max(1, Math.round((n - 1) / 8))
  const text = v.toFixed(dec)
  const lblId = "vps-l-" + label.replace(/\W+/g, "")

  return (
    <div
      className={"vps-root" + (className ? " " + className : "")}
      data-drag={drag ? "" : undefined}
      data-fine={fine < 1 ? "" : undefined}
      data-in={entered ? "" : undefined}
      style={{ ["--vps-font" as string]: font, ...(accent ? { ["--vps-acc" as string]: accent } : {}) } as React.CSSProperties}
    >
      <style>{CSS}</style>
      <div className="vps-head">
        <span className="vps-lbl" id={lblId}>{label}</span>
        <span className="vps-read">
          <span className="vps-fine" aria-hidden="true">FINE ×{fine}</span>
          <span ref={num} className="vps-num" aria-hidden="true">
            {Array.from({ length: places }, (_, i) => (
              <React.Fragment key={i}>
                {dec > 0 && i === places - dec && <span className="vps-dot">.</span>}
                <span className="vps-col" data-col="">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d, j) => <span key={j}>{d}</span>)}
                </span>
              </React.Fragment>
            ))}
          </span>
          <span className="vps-unit">{unit}</span>
        </span>
      </div>
      <div
        ref={track}
        className="vps-track"
        role="slider"
        tabIndex={0}
        aria-labelledby={lblId}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={v}
        aria-valuetext={text + " " + unit}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onKeyDown={onKey}
      >
        <div ref={row} className="vps-row">
          {Array.from({ length: n }, (_, i) => (
            <span key={i} className="vps-t" data-major={i % majorEvery === 0 ? "" : undefined} />
          ))}
        </div>
        <div ref={cur} className="vps-cur" />
      </div>
      <div className="vps-scale" aria-hidden="true">
        {Array.from({ length: 3 }, (_, i) => (
          <span key={i}>{+(min + ((max - min) * i) / 2).toFixed(dec ? 1 : 0)}</span>
        ))}
      </div>
      {hint && <p className="vps-hint">{hint}</p>}
    </div>
  )
}
