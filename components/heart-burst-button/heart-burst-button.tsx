"use client"

import React, { useEffect, useRef, useState } from "react"

export interface HeartBurstButtonProps {
  /** Count before the viewer's own like. */
  count?: number
  /** Initial liked state (uncontrolled). */
  defaultLiked?: boolean
  /** Controlled liked state. */
  liked?: boolean
  onChange?: (liked: boolean, count: number) => void
  /** "light" glass pill or "dark" smoked pill. */
  theme?: "light" | "dark"
  /** Particles per burst. */
  particles?: number
  /** Burst palette. */
  colors?: string[]
  label?: string
  font?: string
  className?: string
}

const FONT = '"Geist", "Inter", "SF Pro Text", "Segoe UI Variable Text", ui-sans-serif, system-ui, sans-serif'
const COLORS = ["#ff2e63", "#ff7a45", "#ffc94a", "#c86bfa", "#ff5fa2"]

const CSS =
  ".hbb-root{--hbb-red:#ff2e63;--hbb-red2:#ff5f8f;display:inline-flex;font-family:var(--hbb-font);-webkit-font-smoothing:antialiased}" +
  ".hbb-btn{position:relative;display:inline-flex;align-items:center;gap:8px;height:44px;padding:0 16px 0 13px;border:0;border-radius:999px;cursor:pointer;font:inherit;font-size:15px;font-weight:600;outline:none;-webkit-tap-highlight-color:transparent;" +
  "color:#2a1d22;background:linear-gradient(180deg,rgba(255,255,255,.96),rgba(250,244,246,.92));" +
  "box-shadow:inset 0 1px 0 #fff,inset 0 0 0 1px rgba(80,30,45,.08),0 1px 2px rgba(80,30,45,.08),0 6px 16px -8px rgba(80,30,45,.3);transition:transform .35s cubic-bezier(.3,1.6,.5,1),box-shadow .3s,background .4s,color .3s}" +
  ".hbb-root[data-theme=dark] .hbb-btn{color:#f6eef1;background:linear-gradient(180deg,#2a2226,#1a1518);box-shadow:inset 0 1px 0 rgba(255,255,255,.08),inset 0 0 0 1px rgba(255,255,255,.06),0 1px 2px rgba(0,0,0,.4),0 8px 20px -8px rgba(0,0,0,.7)}" +
  ".hbb-btn:hover{transform:translateY(-1px)}.hbb-btn:active{transform:scale(.94)}" +
  ".hbb-btn:focus-visible{box-shadow:0 0 0 2px #fff,0 0 0 4px var(--hbb-red)}" +
  ".hbb-root[data-on] .hbb-btn{background:linear-gradient(180deg,#fff4f7,#ffe6ee);box-shadow:inset 0 1px 0 #fff,inset 0 0 0 1px rgba(255,46,99,.22),0 1px 2px rgba(255,46,99,.12),0 10px 22px -10px rgba(255,46,99,.55);color:#d81b4f}" +
  ".hbb-root[data-theme=dark][data-on] .hbb-btn{background:linear-gradient(180deg,#3a1a25,#251018);box-shadow:inset 0 1px 0 rgba(255,255,255,.08),inset 0 0 0 1px rgba(255,46,99,.35),0 10px 24px -10px rgba(255,46,99,.6);color:#ff8fb0}" +
  // the heart: an outline, with a filled copy that grows out of its centre
  ".hbb-heart{position:relative;display:grid;width:22px;height:22px}" +
  ".hbb-heart svg{grid-area:1/1;width:22px;height:22px;overflow:visible}" +
  ".hbb-out{transition:opacity .2s}" +
  ".hbb-fill{clip-path:circle(0% at 50% 55%);transition:clip-path .28s cubic-bezier(.5,0,.3,1)}" +
  ".hbb-root[data-on] .hbb-fill{clip-path:circle(75% at 50% 55%)}" +
  ".hbb-root[data-on] .hbb-out{opacity:0}" +
  ".hbb-btn:hover .hbb-heart{animation:hbb-beat 1.1s ease-in-out infinite}" +
  ".hbb-root[data-pop=on] .hbb-heart{animation:hbb-pop .62s cubic-bezier(.2,.9,.3,1.3) both}" +
  ".hbb-root[data-pop=off] .hbb-heart{animation:hbb-deflate .45s cubic-bezier(.3,1.4,.5,1) both}" +
  // the burst: a ring that blooms and thins, and particles flung on deterministic arcs
  ".hbb-fx{position:absolute;left:24px;top:50%;width:0;height:0;pointer-events:none;z-index:2}" +
  ".hbb-ring{position:absolute;left:-14px;top:-14px;width:28px;height:28px;border-radius:50%;border:5px solid var(--hbb-red2);opacity:0;animation:hbb-ring .55s cubic-bezier(.2,.7,.3,1) both}" +
  ".hbb-p{position:absolute;left:0;top:0;width:var(--s);height:var(--s);margin:calc(var(--s)/-2) 0 0 calc(var(--s)/-2);color:var(--c);opacity:0;animation:hbb-fly var(--d) cubic-bezier(.15,.75,.3,1) var(--w) both}" +
  ".hbb-p i{display:block;width:100%;height:100%;border-radius:50%;background:currentColor}" +
  ".hbb-p svg{display:block;width:100%;height:100%}" +
  // odometer: each changed digit slides out one way while its replacement slides in
  ".hbb-num{display:inline-flex;font-variant-numeric:tabular-nums;letter-spacing:-.01em;height:1.2em;line-height:1.2em;overflow:hidden;-webkit-mask:linear-gradient(transparent,#000 25%,#000 75%,transparent);mask:linear-gradient(transparent,#000 25%,#000 75%,transparent)}" +
  ".hbb-dg{position:relative;display:inline-block;width:.62em;text-align:center}.hbb-dg[data-sep]{width:.3em}" +
  ".hbb-dg span{display:block}" +
  ".hbb-dg .hbb-old{position:absolute;inset:0}" +
  ".hbb-dg[data-dir=up] .hbb-new{animation:hbb-in-up .5s cubic-bezier(.2,1.2,.3,1) both}.hbb-dg[data-dir=up] .hbb-old{animation:hbb-out-up .5s cubic-bezier(.2,1,.3,1) both}" +
  ".hbb-dg[data-dir=down] .hbb-new{animation:hbb-in-down .5s cubic-bezier(.2,1.2,.3,1) both}.hbb-dg[data-dir=down] .hbb-old{animation:hbb-out-down .5s cubic-bezier(.2,1,.3,1) both}" +
  ".hbb-root:not([data-in]) .hbb-btn{opacity:0;transform:scale(.8)}.hbb-root[data-in] .hbb-btn{transition:transform .6s cubic-bezier(.3,1.6,.5,1),opacity .3s,box-shadow .3s,background .4s,color .3s}" +
  "@keyframes hbb-beat{0%,40%,100%{transform:scale(1)}15%{transform:scale(1.12)}28%{transform:scale(1.04)}}" +
  "@keyframes hbb-pop{0%{transform:scale(1)}12%{transform:scale(.6,.72)}38%{transform:scale(1.32) rotate(-8deg)}60%{transform:scale(.92) rotate(4deg)}80%{transform:scale(1.06)}100%{transform:scale(1)}}" +
  "@keyframes hbb-deflate{0%{transform:scale(1)}35%{transform:scale(.78,.86)}100%{transform:scale(1)}}" +
  "@keyframes hbb-ring{0%{opacity:1;transform:scale(.2);border-width:12px}70%{opacity:.9}100%{opacity:0;transform:scale(2.3);border-width:0}}" +
  "@keyframes hbb-fly{0%{opacity:1;transform:translate(0,0) scale(.3) rotate(0)}18%{opacity:1}100%{opacity:0;transform:translate(var(--x),var(--y)) scale(1) rotate(var(--r))}}" +
  "@keyframes hbb-in-up{from{transform:translateY(100%)}to{transform:none}}@keyframes hbb-out-up{to{transform:translateY(-100%)}}" +
  "@keyframes hbb-in-down{from{transform:translateY(-100%)}to{transform:none}}@keyframes hbb-out-down{to{transform:translateY(100%)}}" +
  "@media (prefers-reduced-motion:reduce){.hbb-btn:hover .hbb-heart,.hbb-root .hbb-heart,.hbb-dg span{animation:none!important}.hbb-fx{display:none}.hbb-fill{transition-duration:.01ms}}"

// #region burst
/** Deterministic pseudo-random in [0,1) so every burst looks lively but tests can pin it. */
export function rand(seed: number) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

export interface Particle { x: number; y: number; r: number; s: number; d: number; w: number; c: string; heart: boolean }

/** n particles spread round the circle with jitter; hearts fly further and slower than dots. */
export function burst(n: number, seed: number, colors: string[]): Particle[] {
  return Array.from({ length: n }, (_, i) => {
    const heart = i % 2 === 0
    const a = (i / n) * Math.PI * 2 + (rand(seed + i) - 0.5) * 0.5 - Math.PI / 2
    const dist = (heart ? 46 : 34) + rand(seed + i * 7) * 20
    return {
      x: Math.round(Math.cos(a) * dist),
      y: Math.round(Math.sin(a) * dist),
      r: Math.round((rand(seed + i * 3) - 0.5) * 90),
      s: heart ? 9 + Math.round(rand(seed + i * 5) * 4) : 4 + Math.round(rand(seed + i * 5) * 2),
      d: heart ? 720 : 560,
      w: Math.round(rand(seed + i * 11) * 60),
      c: colors[i % colors.length] || "#ff2e63",
      heart,
    }
  })
}

/** Digits of a count with thousands separators, as characters. */
export function digits(n: number) {
  return Array.from(Math.max(0, Math.round(n)).toLocaleString("en-US"))
}
// #endregion

const HEART = "M12 20.6s-7.6-4.6-9.6-9.3C1 8 3 4.4 6.6 4.4c2.2 0 3.7 1.3 5.4 3.3 1.7-2 3.2-3.3 5.4-3.3 3.6 0 5.6 3.6 4.2 6.9-2 4.7-9.6 9.3-9.6 9.3Z"

function Digit({ ch, dir, k }: { ch: string; dir: "up" | "down"; k: number }) {
  const prev = useRef(ch)
  const shown = useRef({ old: ch, k: -1 })
  if (prev.current !== ch) {
    shown.current = { old: prev.current, k }
    prev.current = ch
  }
  const changing = shown.current.k === k
  return (
    <span className="hbb-dg" data-dir={changing ? dir : undefined} data-sep={ch === "," ? "" : undefined}>
      {changing && <span className="hbb-old" key={"o" + k}>{shown.current.old}</span>}
      <span className="hbb-new" key={"n" + (changing ? k : "x")}>{ch}</span>
    </span>
  )
}

export default function HeartBurstButton({
  count = 24,
  defaultLiked = false,
  liked: likedProp,
  onChange,
  theme = "light",
  particles = 14,
  colors = COLORS,
  label = "Like",
  font = FONT,
  className,
}: HeartBurstButtonProps) {
  const [likedState, setLiked] = useState(defaultLiked)
  const liked = likedProp ?? likedState
  const [pop, setPop] = useState(null as "on" | "off" | null)
  const [shot, setShot] = useState(0)
  const [entered, setEntered] = useState(false)
  const reduced = useRef(false)
  const total = count + (liked ? 1 : 0)

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    reduced.current = mq.matches
    const on = () => (reduced.current = mq.matches)
    mq.addEventListener("change", on)
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setEntered(true)))
    return () => {
      cancelAnimationFrame(id)
      mq.removeEventListener("change", on)
    }
  }, [])

  const toggle = () => {
    const next = !liked
    if (likedProp === undefined) setLiked(next)
    setPop(next ? "on" : "off")
    setShot((s) => s + 1)
    onChange?.(next, count + (next ? 1 : 0))
  }

  const ds = digits(total)
  const dir = liked ? "up" : "down"
  const parts = shot > 0 && liked && !reduced.current ? burst(particles, shot * 13, colors) : []

  return (
    <span
      className={"hbb-root" + (className ? " " + className : "")}
      data-theme={theme}
      data-on={liked ? "" : undefined}
      data-pop={pop ?? undefined}
      data-in={entered ? "" : undefined}
      style={{ ["--hbb-font" as string]: font } as React.CSSProperties}
    >
      <style>{CSS}</style>
      <button
        type="button"
        className="hbb-btn"
        aria-pressed={liked}
        aria-label={label + ", " + total.toLocaleString("en-US")}
        onClick={toggle}
        onAnimationEnd={(e) => e.animationName === "hbb-pop" || e.animationName === "hbb-deflate" ? setPop(null) : undefined}
      >
        <span className="hbb-heart" aria-hidden="true" key={"h" + shot}>
          <svg className="hbb-out" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round">
            <path d={HEART} />
          </svg>
          <svg className="hbb-fill" viewBox="0 0 24 24">
            <defs>
              <linearGradient id="hbb-g" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#ff6f9a" />
                <stop offset="1" stopColor="#ff1f55" />
              </linearGradient>
            </defs>
            <path d={HEART} fill="url(#hbb-g)" />
            <path d="M7.2 7.6c-.9.3-1.6 1.1-1.7 2" fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </span>
        {parts.length > 0 && (
          <span className="hbb-fx" key={"fx" + shot}>
            <span className="hbb-ring" />
            {parts.map((p, i) => (
              <span
                key={i}
                className="hbb-p"
                style={{ ["--x" as string]: p.x + "px", ["--y" as string]: p.y + "px", ["--r" as string]: p.r + "deg", ["--s" as string]: p.s + "px", ["--d" as string]: p.d + "ms", ["--w" as string]: p.w + "ms", ["--c" as string]: p.c } as React.CSSProperties}
              >
                {p.heart ? (
                  <svg viewBox="0 0 24 24"><path d={HEART} fill="currentColor" /></svg>
                ) : (
                  <i />
                )}
              </span>
            ))}
          </span>
        )}
        <span className="hbb-num" aria-hidden="true">
          {ds.map((ch, i) => (
            <Digit key={ds.length - i} ch={ch} dir={dir} k={shot} />
          ))}
        </span>
      </button>
    </span>
  )
}
