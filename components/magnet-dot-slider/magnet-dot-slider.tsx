"use client"

import React, { useEffect, useRef, useState } from "react"

export interface MagnetDotSliderProps {
  label?: string
  value?: number
  defaultValue?: number
  min?: number
  max?: number
  step?: number
  onChange?: (value: number) => void
  /** Appended to the readout, e.g. "%". */
  suffix?: string
  /** Number of dots along the track. */
  dots?: number
  /** Two colours for the lit dots, low end to high end. */
  from?: string
  to?: string
  font?: string
  className?: string
}

const FONT = "'Geist','Inter','SF Pro Text','Segoe UI Variable Text',ui-sans-serif,system-ui,sans-serif"

const CSS =
  ".mds-root{--mds-from:#ffcf6b;--mds-to:#ff5d3a;position:relative;width:100%;max-width:520px;padding:22px 22px 26px;border-radius:24px;color:#ece9e4;font-family:var(--mds-font);-webkit-font-smoothing:antialiased;user-select:none;-webkit-user-select:none;" +
  "background:radial-gradient(120% 140% at 50% -40%,#24262c 0%,#141519 55%,#0c0d10 100%);box-shadow:inset 0 1px 0 rgba(255,255,255,.08),inset 0 0 0 1px rgba(255,255,255,.04),0 2px 4px rgba(0,0,0,.25),0 30px 60px -30px rgba(0,0,0,.75)}" +
  ".mds-head{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:22px}" +
  ".mds-lbl{font-size:14px;font-weight:560;color:#cfcac2;letter-spacing:-.005em}" +
  ".mds-out{font-size:22px;font-weight:600;letter-spacing:-.03em;font-variant-numeric:tabular-nums;background:linear-gradient(90deg,var(--mds-from),var(--mds-to));-webkit-background-clip:text;background-clip:text;color:transparent}" +
  ".mds-out small{font-size:14px;margin-left:2px;opacity:.8}" +
  ".mds-track{position:relative;height:34px;border-radius:999px;cursor:pointer;touch-action:pan-y;outline:none;" +
  "background:linear-gradient(180deg,#0a0b0d,#16171b);box-shadow:inset 0 2px 5px rgba(0,0,0,.7),inset 0 -1px 0 rgba(255,255,255,.05),0 1px 0 rgba(255,255,255,.06)}" +
  ".mds-track:focus-visible{box-shadow:inset 0 2px 5px rgba(0,0,0,.7),0 0 0 2px #0c0d10,0 0 0 4px var(--mds-to)}" +
  ".mds-row{position:absolute;inset:0 17px;pointer-events:none}" +
  ".mds-d{position:absolute;top:50%;left:0;width:4px;height:4px;margin:-2px 0 0 -2px;border-radius:50%;background:#3b3e46;will-change:transform}" +
  ".mds-d[data-lit]{background:var(--c);box-shadow:0 0 6px var(--c)}" +
  // the pit: a recessed lens with a hot rim; it never reads layout, only the stored x
  ".mds-pit{position:absolute;top:50%;left:0;width:26px;height:26px;margin:-13px 0 0 -13px;border-radius:50%;pointer-events:none;will-change:transform;" +
  "background:radial-gradient(circle at 50% 60%,#050506 0 38%,#1b1c20 62%,#2e3036 100%);box-shadow:inset 0 2px 4px rgba(0,0,0,.9),inset 0 -1px 1px rgba(255,255,255,.18),0 0 0 1.5px color-mix(in oklab,var(--mds-to) 70%,#fff),0 0 18px 2px color-mix(in oklab,var(--mds-to) 55%,transparent),0 0 40px 6px color-mix(in oklab,var(--mds-from) 22%,transparent)}" +
  ".mds-pit::after{content:'';position:absolute;inset:7px;border-radius:50%;background:radial-gradient(circle,var(--mds-from),transparent 70%);opacity:.35;transition:opacity .3s}" +
  ".mds-root[data-drag] .mds-pit::after{opacity:.9}" +
  ".mds-tip{position:absolute;bottom:calc(100% + 10px);left:0;padding:4px 8px;border-radius:8px;font-size:12px;font-weight:600;font-variant-numeric:tabular-nums;color:#16110c;white-space:nowrap;background:linear-gradient(180deg,var(--mds-from),color-mix(in oklab,var(--mds-from) 60%,var(--mds-to)));box-shadow:0 6px 14px -6px color-mix(in oklab,var(--mds-to) 70%,transparent);opacity:0;transform:translateX(-50%) translateY(6px) scale(.9);transition:opacity .2s,transform .35s cubic-bezier(.3,1.6,.5,1);pointer-events:none}" +
  ".mds-tipw{position:absolute;top:0;left:0;will-change:transform}" +
  ".mds-root[data-drag] .mds-tip,.mds-track:focus-visible .mds-tip{opacity:1;transform:translateX(-50%) translateY(0) scale(1)}" +
  ".mds-ticks{display:flex;justify-content:space-between;margin-top:12px;padding:0 17px;font-size:11px;color:#6d6a66;font-variant-numeric:tabular-nums}" +
  ".mds-root:not([data-in]){opacity:0;transform:translateY(10px)}.mds-root[data-in]{transition:opacity .5s,transform .8s cubic-bezier(.3,1.4,.5,1)}" +
  "@media (prefers-reduced-motion:reduce){.mds-root,.mds-tip{transition-duration:.01ms!important}}"

// #region physics
/** Pull strength 0..1 for a dot `dx` px from the pit: a smooth bell over `reach`. */
export function pull(dx: number, reach: number) {
  const x = Math.abs(dx) / reach
  return x >= 1 ? 0 : (1 - x * x) * (1 - x * x)
}

/** One spring step toward target (critically-ish damped). Returns [pos, vel]. */
export function spring(pos: number, vel: number, target: number, dt: number, k = 260, c = 26): [number, number] {
  const h = Math.min(dt, 1 / 30)
  const a = k * (target - pos) - c * vel
  const v = vel + a * h
  return [pos + v * h, v]
}

/** Snap a 0..1 fraction to the step grid and return the value. */
export function valueAt(f: number, min: number, max: number, step: number) {
  const raw = min + Math.min(1, Math.max(0, f)) * (max - min)
  const v = Math.round((raw - min) / step) * step + min
  return +Math.min(max, Math.max(min, v)).toFixed(6)
}

export function fracOf(v: number, min: number, max: number) {
  return max === min ? 0 : Math.min(1, Math.max(0, (v - min) / (max - min)))
}

/** Mix two #rrggbb colours. */
export function mix(a: string, b: string, t: number) {
  const p = (h: string, i: number) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16)
  return "#" + [0, 1, 2].map((i) => Math.round(p(a, i) + (p(b, i) - p(a, i)) * t).toString(16).padStart(2, "0")).join("")
}
// #endregion

export default function MagnetDotSlider({
  label = "Intensity",
  value,
  defaultValue = 42,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  suffix = "%",
  dots = 41,
  from = "#ffcf6b",
  to = "#ff5d3a",
  font = FONT,
  className,
}: MagnetDotSliderProps) {
  const [own, setOwn] = useState(defaultValue)
  const v = value ?? own
  const [drag, setDrag] = useState(false)
  const [entered, setEntered] = useState(false)
  const track = useRef(null as HTMLDivElement | null)
  const row = useRef(null as HTMLDivElement | null)
  const pit = useRef(null as HTMLDivElement | null)
  const tip = useRef(null as HTMLDivElement | null)
  const sim = useRef({ pos: fracOf(v, min, max), vel: 0, target: fracOf(v, min, max), w: 0, left: 0, raf: 0, last: 0, reduced: false })

  const setValue = (nv: number) => {
    if (nv === v) return
    if (value === undefined) setOwn(nv)
    onChange?.(nv)
  }

  // Draw one frame from stored numbers only: transforms, nothing measured.
  const paint = () => {
    const s = sim.current
    const r = row.current
    if (!r || !s.w) return
    const x = s.pos * s.w
    const speed = Math.min(1, Math.abs(s.vel) * 0.35)
    const reach = 66 + speed * 50
    const kids = r.children
    for (let i = 0; i < kids.length; i++) {
      const dx0 = (i / (kids.length - 1)) * s.w
      const dx = dx0 - x
      const p = pull(dx, reach)
      const el = kids[i] as HTMLElement
      el.style.transform = "translateX(" + (dx0 - Math.sign(dx) * p * (13 + speed * 10)).toFixed(2) + "px) scale(" + (1 + p * 1.5).toFixed(3) + ")"
      const lit = dx0 <= x
      if (lit !== el.hasAttribute("data-lit")) lit ? el.setAttribute("data-lit", "") : el.removeAttribute("data-lit")
    }
    if (pit.current) pit.current.style.transform = "translateX(" + (17 + x).toFixed(2) + "px) scale(" + (1 + speed * 0.12).toFixed(3) + "," + (1 - speed * 0.08).toFixed(3) + ")"
    if (tip.current) tip.current.style.transform = "translateX(" + (17 + x).toFixed(2) + "px)"
  }

  const tick = (t: number) => {
    const s = sim.current
    const dt = s.last ? (t - s.last) / 1000 : 1 / 60
    s.last = t
    ;[s.pos, s.vel] = s.reduced ? [s.target, 0] : spring(s.pos, s.vel, s.target, dt)
    paint()
    if (Math.abs(s.target - s.pos) > 0.0005 || Math.abs(s.vel) > 0.002) s.raf = requestAnimationFrame(tick)
    else {
      s.pos = s.target
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
    sim.current.target = fracOf(v, min, max)
    kick()
  }, [v, min, max])

  useEffect(() => {
    const s = sim.current
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    s.reduced = mq.matches
    const on = () => (s.reduced = mq.matches)
    mq.addEventListener("change", on)
    const el = row.current
    // the dot row's width, kept current; the animation reads only this number
    const ro = new ResizeObserver(([e]) => {
      s.w = e.contentRect.width
      paint()
    })
    if (el) ro.observe(el)
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setEntered(true)))
    return () => {
      ro.disconnect()
      mq.removeEventListener("change", on)
      cancelAnimationFrame(id)
      cancelAnimationFrame(s.raf)
      s.raf = 0
    }
  }, [])

  const fromPointer = (clientX: number) => (clientX - sim.current.left - 17) / (sim.current.w || 1)

  const onDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return
    const t = track.current
    if (!t) return
    // measured once per press; the moves that follow use this edge
    const r = t.getBoundingClientRect()
    sim.current.left = r.left
    // a press can beat the ResizeObserver's first callback; take the width from the same read
    if (!sim.current.w) sim.current.w = r.width - 34
    t.setPointerCapture?.(e.pointerId)
    setDrag(true)
    const f = fromPointer(e.clientX)
    sim.current.target = Math.min(1, Math.max(0, f))
    setValue(valueAt(f, min, max, step))
    kick()
  }
  const onMove = (e: React.PointerEvent) => {
    if (!drag) return
    const f = fromPointer(e.clientX)
    sim.current.target = Math.min(1, Math.max(0, f))
    setValue(valueAt(f, min, max, step))
    kick()
  }
  const onUp = () => {
    if (!drag) return
    setDrag(false)
    sim.current.target = fracOf(v, min, max)
    kick()
  }
  const onKey = (e: React.KeyboardEvent) => {
    const big = Math.max(step, (max - min) / 10)
    const map: Record<string, number> = { ArrowRight: step, ArrowUp: step, ArrowLeft: -step, ArrowDown: -step, PageUp: big, PageDown: -big }
    let nv: number | null = null
    if (e.key in map) nv = v + map[e.key]
    else if (e.key === "Home") nv = min
    else if (e.key === "End") nv = max
    if (nv === null) return
    e.preventDefault()
    setValue(valueAt(fracOf(nv, min, max), min, max, step))
  }

  const n = Math.max(2, dots)
  const shown = Number.isInteger(step) ? String(v) : v.toFixed(String(step).split(".")[1]?.length ?? 1)

  return (
    <div
      className={"mds-root" + (className ? " " + className : "")}
      data-drag={drag ? "" : undefined}
      data-in={entered ? "" : undefined}
      style={{ ["--mds-font" as string]: font, ["--mds-from" as string]: from, ["--mds-to" as string]: to } as React.CSSProperties}
    >
      <style>{CSS}</style>
      <div className="mds-head">
        <span className="mds-lbl" id={"mds-l-" + label.replace(/\W+/g, "")}>{label}</span>
        <span className="mds-out" aria-hidden="true">
          {shown}
          <small>{suffix}</small>
        </span>
      </div>
      <div
        ref={track}
        className="mds-track"
        role="slider"
        tabIndex={0}
        aria-labelledby={"mds-l-" + label.replace(/\W+/g, "")}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={v}
        aria-valuetext={shown + suffix}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onKeyDown={onKey}
      >
        <div ref={row} className="mds-row">
          {Array.from({ length: n }, (_, i) => (
            <span key={i} className="mds-d" style={{ ["--c" as string]: mix(from, to, i / (n - 1)) } as React.CSSProperties} />
          ))}
        </div>
        <div ref={pit} className="mds-pit" />
        <div ref={tip} className="mds-tipw" aria-hidden="true">
          <span className="mds-tip">
            {shown}
            {suffix}
          </span>
        </div>
      </div>
      <div className="mds-ticks" aria-hidden="true">
        <span>{min}</span>
        <span>{(min + max) / 2}</span>
        <span>{max}</span>
      </div>
    </div>
  )
}
