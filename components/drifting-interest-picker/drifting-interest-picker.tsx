"use client"

import { useRef, useState } from "react"

export type Interest = { id: string; label: string; color?: string; icon?: React.ReactNode }

export type DriftingInterestPickerProps = {
  interests: Interest[]
  rows?: number
  /** Seconds for one full lap of a row. */
  speed?: number
  defaultValue?: string[]
  title?: string
  subtitle?: string
  min?: number
  action?: string
  onChange?: (ids: string[]) => void
  onContinue?: (ids: string[]) => void
  className?: string
}

// #region logic
export function chunk(list: unknown[], rows: number): unknown[][] {
  const n = Math.max(1, Math.min(rows, list.length || 1))
  const out: unknown[][] = Array.from({ length: n }, () => [])
  list.forEach((x, i) => out[i % n].push(x))
  return out
}

export function hueFor(i: number): string {
  return "hsl(" + ((i * 47 + 12) % 360) + " 85% 68%)"
}

export function digits(n: number, width = 2): number[] {
  const s = String(Math.max(0, Math.floor(n))).padStart(width, "0")
  return s.split("").map(Number)
}

export function needMore(n: number, min: number): string {
  if (n >= min) return ""
  const left = min - n
  return "Pick " + left + " more"
}

export function flip(sel: string[], id: string): string[] {
  return sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id]
}
// #endregion

const SPRING =
  "linear(0, 0.009, 0.035 2.1%, 0.141, 0.281 6.7%, 0.723 12.9%, 0.938 16.7%, 1.017, 1.077, 1.121, 1.149 24.3%, 1.159, 1.163, 1.161, 1.154 29.9%, 1.129 32.8%, 1.051 39.6%, 1.017 43.1%, 0.991, 0.977 51%, 0.974 53.8%, 0.975 57.1%, 0.997 69.8%, 1.003 76.9%, 1)"
const SOFT =
  "linear(0, 0.006, 0.025 2.8%, 0.101 6.1%, 0.539 18.9%, 0.721 25.3%, 0.849 31.5%, 0.937 38.1%, 0.968 41.8%, 0.991 45.7%, 1.006 50.1%, 1.015 55%, 1.017 63.9%, 1.001 85.9%, 1)"

const CSS =
  ".dip-root{--dip-bg:#120f1a;--dip-text:#f5f2fb;--dip-dim:rgba(236,230,250,.55);--dip-spring:" + SPRING + ";--dip-soft:" + SOFT + ";" +
  "position:relative;width:min(720px,calc(100vw - 32px));padding:28px 0 22px;border-radius:30px;overflow:hidden;color:var(--dip-text);font-family:'Inter Tight','Geist',ui-sans-serif,system-ui,sans-serif;-webkit-font-smoothing:antialiased;" +
  "background:linear-gradient(180deg,#1d1829,var(--dip-bg) 46%);" +
  "box-shadow:inset 0 1px 0 rgba(255,255,255,.08),inset 0 0 0 1px rgba(255,255,255,.05),0 30px 70px -30px rgba(30,10,60,.7);animation:dip-in .8s var(--dip-soft) both}" +
  ".dip-head{padding:0 28px;margin-bottom:22px}" +
  ".dip-head h2{margin:0;font-size:clamp(24px,4vw,32px);font-weight:680;letter-spacing:-.035em;line-height:1.05}" +
  ".dip-head p{margin:8px 0 0;font-size:14px;color:var(--dip-dim)}" +
  ".dip-rows{display:grid;gap:10px;-webkit-mask-image:linear-gradient(90deg,transparent,#000 9%,#000 91%,transparent);mask-image:linear-gradient(90deg,transparent,#000 9%,#000 91%,transparent)}" +
  ".dip-row{display:flex;width:max-content;animation:dip-drift var(--dip-t) linear infinite;animation-direction:var(--dip-dir)}" +
  ".dip-row:hover,.dip-row:focus-within{animation-play-state:paused}" +
  ".dip-set{display:flex;gap:10px;padding-right:10px;animation:dip-up .7s var(--dip-soft) both;animation-delay:calc(.1s + var(--dip-r) * .08s)}" +
  ".dip-chip{position:relative;display:inline-flex;align-items:center;gap:9px;height:44px;padding:0 18px 0 8px;border:0;border-radius:999px;font:inherit;font-size:14px;font-weight:560;letter-spacing:-.01em;white-space:nowrap;cursor:pointer;outline:none;color:rgba(245,242,251,.86);" +
  "background:rgba(255,255,255,.06);box-shadow:inset 0 1px 0 rgba(255,255,255,.07),inset 0 0 0 1px rgba(255,255,255,.07);transition:background .3s,color .25s,box-shadow .3s,transform .5s var(--dip-spring)}" +
  ".dip-chip:hover{background:rgba(255,255,255,.1);transform:translateY(-2px)}" +
  ".dip-chip:active{transform:scale(.94)}" +
  ".dip-chip:focus-visible{box-shadow:inset 0 0 0 1px rgba(255,255,255,.1),0 0 0 2px var(--dip-bg),0 0 0 4px var(--dip-c)}" +
  ".dip-dot{position:relative;flex:none;width:28px;height:28px;border-radius:999px;display:grid;place-items:center;font-size:15px;line-height:1;" +
  "background:radial-gradient(100% 100% at 30% 25%,rgba(255,255,255,.55),transparent 55%),var(--dip-c);box-shadow:0 0 0 1px rgba(255,255,255,.1),0 4px 12px -4px var(--dip-c);transition:transform .5s var(--dip-spring)}" +
  ".dip-dot svg{opacity:0;transform:scale(.4);transition:opacity .2s,transform .45s var(--dip-spring);color:#1a1026}" +
  ".dip-chip[aria-pressed=true]{color:#1a1026;font-weight:650;background:var(--dip-c);box-shadow:inset 0 1px 0 rgba(255,255,255,.5),0 0 0 1px rgba(255,255,255,.2),0 10px 26px -8px var(--dip-c)}" +
  ".dip-chip[aria-pressed=true] .dip-dot{background:rgba(255,255,255,.92);box-shadow:none;transform:rotate(-8deg) scale(.95)}" +
  ".dip-chip[aria-pressed=true] .dip-dot>span{opacity:0}" +
  ".dip-chip[aria-pressed=true] .dip-dot svg{opacity:1;transform:none}" +
  ".dip-dot>span{position:absolute;transition:opacity .2s}" +
  ".dip-chip::after{content:'';position:absolute;inset:-3px;border-radius:inherit;box-shadow:0 0 0 2px var(--dip-c);opacity:0;pointer-events:none}" +
  ".dip-chip[aria-pressed=true]::after{animation:dip-ring .6s cubic-bezier(.2,.7,.3,1)}" +
  ".dip-tray{display:flex;align-items:center;gap:14px;margin:26px 22px 0;padding:10px 10px 10px 18px;border-radius:999px;background:rgba(255,255,255,.06);box-shadow:inset 0 0 0 1px rgba(255,255,255,.08),inset 0 1px 0 rgba(255,255,255,.06)}" +
  ".dip-count{display:flex;align-items:baseline;gap:8px;font-size:13.5px;color:var(--dip-dim)}" +
  ".dip-odo{display:inline-flex;height:28px;overflow:hidden;font-size:24px;font-weight:700;line-height:28px;letter-spacing:-.03em;color:var(--dip-text);font-variant-numeric:tabular-nums}" +
  ".dip-col{display:flex;flex-direction:column;transform:translateY(calc(var(--dip-d) * -28px));transition:transform .7s var(--dip-spring)}" +
  ".dip-col>span{height:28px}" +
  ".dip-faces{flex:1;min-width:0;display:flex;align-items:center;justify-content:flex-end;padding-right:2px}" +
  ".dip-faces>i{width:14px;height:14px;margin-left:-4px;border-radius:999px;background:var(--dip-c);box-shadow:0 0 0 2px var(--dip-bg);animation:dip-pop .45s var(--dip-spring) both}" +
  ".dip-go{flex:none;height:42px;padding:0 20px;border:0;border-radius:999px;font:inherit;font-size:14px;font-weight:650;letter-spacing:-.01em;color:#1a1026;cursor:pointer;outline:none;background:linear-gradient(180deg,#fff,#e9e2f7);box-shadow:inset 0 -2px 0 rgba(26,16,38,.1),0 8px 20px -10px rgba(255,255,255,.6);transition:transform .45s var(--dip-spring),opacity .3s}" +
  ".dip-go:hover{transform:translateY(-1px)}.dip-go:active{transform:scale(.95)}" +
  ".dip-go:focus-visible{box-shadow:0 0 0 2px var(--dip-bg),0 0 0 4px #fff}" +
  ".dip-go:disabled{opacity:.45;cursor:default;transform:none}" +
  ".dip-clear{flex:none;width:38px;height:38px;display:grid;place-items:center;border:0;border-radius:999px;background:none;color:var(--dip-dim);cursor:pointer;outline:none;transition:background .2s,color .2s}" +
  ".dip-clear:hover{background:rgba(255,255,255,.08);color:#fff}.dip-clear:focus-visible{box-shadow:0 0 0 2px #fff}" +
  ".dip-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}" +
  "@keyframes dip-drift{from{transform:translateX(0)}to{transform:translateX(-50%)}}" +
  "@keyframes dip-in{from{opacity:0;transform:translateY(16px) scale(.98)}to{opacity:1;transform:none}}" +
  "@keyframes dip-up{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}" +
  "@keyframes dip-ring{0%{opacity:.9;transform:scale(1)}100%{opacity:0;transform:scale(1.25)}}" +
  "@keyframes dip-pop{from{opacity:0;transform:scale(0)}to{opacity:1;transform:none}}" +
  "@media (max-width:520px){.dip-tray{margin:22px 14px 0;gap:8px}.dip-faces{display:none}}" +
  "@media (prefers-reduced-motion:reduce){.dip-root *,.dip-root *::after{transition-duration:.01ms!important;animation:none!important}.dip-row{width:auto;flex-wrap:wrap;padding:0 28px}.dip-rows{-webkit-mask-image:none;mask-image:none}.dip-set[aria-hidden=true]{display:none}.dip-set{flex-wrap:wrap}}"

const Tick = () => (
  <svg width="14" height="14" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path d="M2.5 6.3l2.3 2.2L9.6 3.6" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export function DriftingInterestPicker({
  interests,
  rows = 4,
  speed = 48,
  defaultValue = [],
  title = "What are you into?",
  subtitle = "Pick a few. We'll tune your feed around them.",
  min = 3,
  action = "Continue",
  onChange,
  onContinue,
  className,
}: DriftingInterestPickerProps) {
  const [sel, setSel] = useState(defaultValue)
  // latest picks, so two toggles in one tick both land
  const latest = useRef(sel)
  const colorOf = (it: Interest) => it.color ?? hueFor(interests.indexOf(it))
  const lanes = chunk(interests, rows) as Interest[][]
  const set = (next: string[]) => {
    latest.current = next
    setSel(next)
    onChange?.(next)
  }
  const d = digits(sel.length)
  const picked = interests.filter((x) => sel.includes(x.id))
  const short = needMore(sel.length, min)

  const chips = (lane: Interest[], copy: boolean) =>
    lane.map((it) => (
      <button
        key={it.id}
        type="button"
        className="dip-chip"
        aria-pressed={sel.includes(it.id)}
        tabIndex={copy ? -1 : undefined}
        style={{ ["--dip-c" as string]: colorOf(it) }}
        onClick={() => set(flip(latest.current, it.id))}
      >
        <span className="dip-dot">
          {it.icon && <span>{it.icon}</span>}
          <Tick />
        </span>
        {it.label}
      </button>
    ))

  return (
    <section className={"dip-root" + (className ? " " + className : "")}>
      <style>{CSS}</style>
      <div className="dip-head">
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <div className="dip-rows" role="group" aria-label={title}>
        {lanes.map((lane, r) => (
          // each lane is drawn twice so the drift loops with no seam; the copy is hidden from assistive tech
          <div
            key={r}
            className="dip-row"
            style={{ ["--dip-t" as string]: Math.max(12, speed + r * 6) + "s", ["--dip-dir" as string]: r % 2 ? "reverse" : "normal", ["--dip-r" as string]: r }}
          >
            <div className="dip-set">{chips(lane, false)}</div>
            <div className="dip-set" aria-hidden="true">
              {chips(lane, true)}
            </div>
          </div>
        ))}
      </div>
      <div className="dip-tray">
        <span className="dip-count">
          <span className="dip-odo" aria-hidden="true">
            {d.map((v, i) => (
              <span key={i} className="dip-col" style={{ ["--dip-d" as string]: v }}>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                  <span key={n}>{n}</span>
                ))}
              </span>
            ))}
          </span>
          {short || "picked"}
        </span>
        <span className="dip-faces" aria-hidden="true">
          {picked.slice(-8).map((p) => (
            <i key={p.id} style={{ ["--dip-c" as string]: colorOf(p) }} />
          ))}
        </span>
        {sel.length > 0 && (
          <button type="button" className="dip-clear" aria-label="Clear all" onClick={() => set([])}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12" />
            </svg>
          </button>
        )}
        <button type="button" className="dip-go" disabled={!!short} onClick={() => onContinue?.(sel)}>
          {action}
        </button>
      </div>
      <span className="dip-sr" aria-live="polite">
        {sel.length + " picked" + (short ? ", " + short.toLowerCase() : "")}
      </span>
    </section>
  )
}

export default DriftingInterestPicker
