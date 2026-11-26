"use client"

import { useEffect, useId, useRef } from "react"
import type { CSSProperties, ReactNode } from "react"

// #region formation
export const FORMATION_SECONDS = 1.25

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a))
const lerp = (a: number, b: number, k: number) => a + (b - a) * k
const outCubic = (k: number) => 1 - Math.pow(1 - k, 3)
const inOutCubic = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2)
const outBack = (k: number) => {
  const c = 1.70158
  return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2)
}

export type Frame = {
  w: number
  h: number
  r: number
  sx: number
  sy: number
  eyes: number
  drops: number
  bars: number
  bend: number
  chroma: number
  done: boolean
}

/** The button at `t` seconds into its formation: a bubble grows, squares off into the
 * button, four droplets bead at the corners, run together into bars and curl into brackets. */
export function formation(t: number, W: number, H: number, R: number): Frame {
  const m = Math.min(W, H)
  const grow = outBack(seg(t, 0, 0.3))
  const d = lerp(0.32, 1, grow) * m
  const morph = inOutCubic(seg(t, 0.24, 0.48))
  const w = lerp(d, W, morph)
  const h = lerp(d, H, morph)
  const r = Math.min(lerp(d / 2, R, morph), w / 2, h / 2)
  // a jelly wobble once the bubble has squared off
  const since = t - 0.46
  const wob = since > 0 ? Math.sin(since * 19) * Math.exp(-since * 5) * 0.045 : 0
  const chroma = seg(t, 0, 0.08) * (1 - inOutCubic(seg(t, 0.68, FORMATION_SECONDS)))
  return {
    w,
    h,
    r,
    sx: 1 + wob,
    sy: 1 - wob,
    eyes: outBack(seg(t, 0, 0.16)),
    drops: outBack(seg(t, 0.3, 0.44)),
    bars: inOutCubic(seg(t, 0.4, 0.58)),
    bend: inOutCubic(seg(t, 0.62, 0.86)),
    chroma,
    done: t >= FORMATION_SECONDS,
  }
}

/** A rounded rectangle centred on 0,0 as path data. */
export function roundRect(w: number, h: number, r: number) {
  const x = -w / 2
  const y = -h / 2
  r = Math.max(0, Math.min(r, w / 2, h / 2))
  return (
    "M" + (x + r) + " " + y + "H" + (x + w - r) + "A" + r + " " + r + " 0 0 1 " + (x + w) + " " + (y + r) +
    "V" + (y + h - r) + "A" + r + " " + r + " 0 0 1 " + (x + w - r) + " " + (y + h) +
    "H" + (x + r) + "A" + r + " " + r + " 0 0 1 " + x + " " + (y + h - r) +
    "V" + (y + r) + "A" + r + " " + r + " 0 0 1 " + (x + r) + " " + y + "Z"
  )
}

/** One side of the logo in logo units (logo is 100 units tall). side = -1 left, 1 right. */
export function sidePiece(f: Frame, side: number) {
  const bx = 98 * side
  // droplets bead near the button's corners, then slide into the bracket's ends
  const dx = lerp(86, 98, f.bars) * side
  const dy = lerp(56, 50, f.bars)
  const dropR = f.drops * lerp(lerp(17, 27, f.bars), 11, f.bend)
  const e = 15 * f.bend * -side // the ends curl in toward the face
  const k = 30 * f.bend * side // the middle bows out
  let path = ""
  if (f.bend > 0.001) {
    path = "M" + (bx + e) + " -50Q" + (bx + k) + " 0 " + (bx + e) + " 50"
  } else if (f.bars > 0.02) {
    const reach = lerp(-50, 0, f.bars)
    path = "M" + bx + " -50L" + bx + " " + reach + "M" + bx + " 50L" + bx + " " + -reach
  }
  return { path, top: [dx + e * f.bend, -dy], bottom: [dx + e * f.bend, dy], dropR, stroke: lerp(30, 22, f.bend) }
}
// #endregion

export type GlassLogoButtonProps = {
  /** Button width in px. */
  width?: number
  /** Button height in px. Lower it for a pill. */
  height?: number
  /** Height of the logo in px (shrinks to fit the button). */
  logoHeight?: number
  /** Corner radius in px. */
  radius?: number
  /** Replay the formation every N ms (0 = play once on mount). */
  replayEvery?: number
  /** Accessible name. */
  label?: string
  onClick?: () => void
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

const CSS =
  ".glb-btn{position:relative;display:inline-grid;place-items:center;padding:0;margin:0;border:0;background:none;cursor:pointer;" +
  "-webkit-tap-highlight-color:transparent;border-radius:28px;outline:none;transition:transform .45s cubic-bezier(.34,1.56,.64,1)}" +
  ".glb-btn:hover{transform:translateY(-2px) scale(1.015)}" +
  ".glb-btn:active{transform:translateY(1px) scale(.95);transition-duration:.12s}" +
  ".glb-btn:focus-visible{box-shadow:0 0 0 3px var(--color-background),0 0 0 5px var(--color-primary)}" +
  ".glb-svg{display:block;overflow:visible;pointer-events:none}" +
  ".glb-chroma{mix-blend-mode:screen}" +
  ".glb-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}" +
  "@media (prefers-reduced-motion:reduce){.glb-btn,.glb-btn:hover,.glb-btn:active{transition:none;transform:none}}"

const PAD = 28

export default function GlassLogoButton({
  width = 280,
  height = 250,
  logoHeight = 96,
  radius = 64,
  replayEvery = 0,
  label = "Glass logo button",
  onClick,
  className,
  style,
  children,
}: GlassLogoButtonProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "")
  const ids = { goo: "glb-goo-" + uid, clip: "glb-clip-" + uid, rim: "glb-rim-" + uid, body: "glb-body-" + uid, sheen: "glb-sheen-" + uid, sides: "glb-sides-" + uid, mask: "glb-mask-" + uid }
  const root = useRef(null as SVGSVGElement | null)
  const live = useRef({ hover: 0, burst: 0, start: 0, replay: 0 })

  useEffect(() => {
    const svg = root.current
    if (!svg) return
    const q = (s: string) => svg.querySelector(s) as SVGElement
    const bevel = [...svg.querySelectorAll(".glb-bevel")] as SVGPathElement[]
    const chroma = [...svg.querySelectorAll(".glb-chroma")] as SVGPathElement[]
    const body = q(".glb-body"), clip = q(".glb-cliprect"), shell = q(".glb-shell"), sheen = q(".glb-sheen")
    const inner = q(".glb-inner"), eyes = q(".glb-eyes"), logo = q(".glb-logo")
    const offs = [...svg.querySelectorAll("feOffset")] as SVGFEOffsetElement[]
    const sides = [-1, 1].map((s) => ({
      s,
      bar: svg.querySelector(".glb-bar[data-s='" + s + "']") as SVGPathElement,
      top: svg.querySelector(".glb-drop[data-s='" + s + "'][data-e='t']") as SVGCircleElement,
      bot: svg.querySelector(".glb-drop[data-s='" + s + "'][data-e='b']") as SVGCircleElement,
    }))
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)")
    const s = Math.min(logoHeight / 100, (width * 0.8) / 222, (height * 0.78) / 112)
    const st = live.current
    st.start = performance.now()
    st.replay = st.start
    let raf = 0
    let visible = true

    const paint = () => {
      const now = performance.now()
      if (replayEvery > 0 && now - st.replay > replayEvery) {
        st.replay = now
        st.start = now
      }
      const t = reduce.matches ? FORMATION_SECONDS : (now - st.start) / 1000
      const f = formation(t, width, height, radius)
      st.hover += ((svg.parentElement?.matches(":hover") ? 1 : 0) - st.hover) * 0.12
      st.burst *= 0.93
      const glow = reduce.matches ? 0 : Math.min(1, f.chroma + st.hover * 0.22 + st.burst)
      const m = Math.min(f.w, f.h)
      const t0 = Math.max(5, m * 0.065)
      const outer = roundRect(f.w, f.h, f.r)
      const innerPath = roundRect(f.w - t0 * 2, f.h - t0 * 2, Math.max(0, f.r - t0))
      const ring = outer + innerPath
      for (const b of bevel) b.setAttribute("d", ring)
      body.setAttribute("d", outer)
      inner.setAttribute("d", innerPath)
      clip.setAttribute("d", innerPath)
      sheen.setAttribute("d", innerPath)
      shell.setAttribute("transform", "scale(" + f.sx + " " + f.sy + ")")
      const spread = glow * 7
      chroma.forEach((c, i) => {
        const dir = i === 0 ? -1 : i === 2 ? 1 : 0
        c.setAttribute("d", outer)
        c.setAttribute("transform", "translate(" + dir * spread + " " + (i === 1 ? -spread * 0.35 : 0) + ")")
        c.style.opacity = String(Math.min(1, glow * 1.2))
        c.setAttribute("stroke-width", String(t0 * 0.9))
      })
      offs[0].setAttribute("dx", String(-glow * 5))
      offs[1].setAttribute("dx", String(glow * 5))
      logo.setAttribute("transform", "scale(" + s + ")")
      eyes.setAttribute("transform", "translate(0 -4) scale(" + f.eyes + ")")
      for (const p of sides) {
        const piece = sidePiece(f, p.s)
        p.bar.setAttribute("d", piece.path || "M0 0")
        p.bar.setAttribute("stroke-width", String(piece.stroke))
        p.bar.style.opacity = piece.path ? "1" : "0"
        p.top.setAttribute("cx", String(piece.top[0]))
        p.top.setAttribute("cy", String(piece.top[1]))
        p.bot.setAttribute("cx", String(piece.bottom[0]))
        p.bot.setAttribute("cy", String(piece.bottom[1]))
        p.top.setAttribute("r", String(Math.max(0, piece.dropR)))
        p.bot.setAttribute("r", String(Math.max(0, piece.dropR)))
      }
      const resting = f.done && st.hover < 0.01 && st.burst < 0.01 && replayEvery <= 0
      if (visible && !resting) raf = requestAnimationFrame(paint)
      else raf = 0
    }
    const kick = () => {
      if (!raf && visible) raf = requestAnimationFrame(paint)
    }
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      if (visible) kick()
    })
    io.observe(svg)
    const btn = svg.parentElement!
    const onUp = () => {
      st.burst = 0.85
      kick()
    }
    btn.addEventListener("pointerenter", kick)
    btn.addEventListener("pointerleave", kick)
    btn.addEventListener("pointerup", onUp)
    raf = requestAnimationFrame(paint)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      btn.removeEventListener("pointerenter", kick)
      btn.removeEventListener("pointerleave", kick)
      btn.removeEventListener("pointerup", onUp)
    }
  }, [width, height, logoHeight, radius, replayEvery])

  const vw = width + PAD * 2
  const vh = height + PAD * 2
  const blur = Math.max(3, (logoHeight / 96) * 5.5)
  const channel = (c: number) => {
    const rows = ["0 0 0 0 0", "0 0 0 0 0", "0 0 0 0 0"]
    rows[c] = c === 0 ? "1 0 0 0 0" : c === 1 ? "0 1 0 0 0" : "0 0 1 0 0"
    return rows.join(" ") + " 0 0 0 1 0"
  }

  return (
    <button type="button" className={"glb-btn" + (className ? " " + className : "")} style={style} aria-label={label} onClick={onClick}>
      <style>{CSS}</style>
      <svg ref={root} className="glb-svg" width={vw} height={vh} viewBox={-vw / 2 + " " + -vh / 2 + " " + vw + " " + vh} aria-hidden="true">
        <defs>
          <filter id={ids.goo} x="-30%" y="-30%" width="160%" height="160%" colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceGraphic" stdDeviation={blur} result="b" />
            <feColorMatrix in="b" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 24 -10" result="g" />
            <feOffset in="g" dx="0" result="gl" />
            <feOffset in="g" dx="0" result="gr" />
            <feColorMatrix in="gl" values={channel(0)} result="R" />
            <feColorMatrix in="g" values={channel(1)} result="G" />
            <feColorMatrix in="gr" values={channel(2)} result="B" />
            <feBlend in="R" in2="G" mode="screen" result="RG" />
            <feBlend in="RG" in2="B" mode="screen" />
          </filter>
          <linearGradient id={ids.rim} x1="0" y1="0" x2="0.35" y2="1">
            <stop offset="0" stopColor="#dfe8ff" stopOpacity="0.5" />
            <stop offset="0.3" stopColor="#6c80b8" stopOpacity="0.16" />
            <stop offset="0.75" stopColor="#2c3866" stopOpacity="0.14" />
            <stop offset="1" stopColor="#8fa8ff" stopOpacity="0.42" />
          </linearGradient>
          <radialGradient id={ids.body} cx="0.5" cy="0.38" r="0.75">
            <stop offset="0" stopColor="#0d1120" />
            <stop offset="1" stopColor="#020308" />
          </radialGradient>
          <linearGradient id={ids.sheen} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.08" />
            <stop offset="0.4" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={ids.sides} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#fff" />
            <stop offset="0.2" stopColor="#fff" />
            <stop offset="0.34" stopColor="#fff" stopOpacity="0.12" />
            <stop offset="0.66" stopColor="#fff" stopOpacity="0.12" />
            <stop offset="0.8" stopColor="#fff" />
            <stop offset="1" stopColor="#fff" />
          </linearGradient>
          <mask id={ids.mask} maskContentUnits="objectBoundingBox">
            <rect x="0" y="0" width="1" height="1" fill={"url(#" + ids.sides + ")"} />
          </mask>
          <clipPath id={ids.clip}>
            <path className="glb-cliprect" d="" />
          </clipPath>
        </defs>
        <g className="glb-shell">
          <path className="glb-body" d="" fill={"url(#" + ids.body + ")"} />
          <path className="glb-bevel" d="" fill={"url(#" + ids.rim + ")"} fillRule="evenodd" />
          <path className="glb-bevel" d="" fill="none" stroke="#c9d6ff" strokeOpacity="0.55" strokeWidth="1.4" />
          <path className="glb-inner" d="" fill="none" stroke="#a9bcff" strokeOpacity="0.35" strokeWidth="1" />
          <g mask={"url(#" + ids.mask + ")"}>
            <path className="glb-chroma" d="" fill="none" stroke="#ff2a55" strokeWidth="5" style={{ opacity: 0 }} />
          <path className="glb-chroma" d="" fill="none" stroke="#2affa0" strokeWidth="5" style={{ opacity: 0 }} />
          <path className="glb-chroma" d="" fill="none" stroke="#3d63ff" strokeWidth="5" style={{ opacity: 0 }} />
          </g>
          <g clipPath={"url(#" + ids.clip + ")"}>
            <path className="glb-sheen" d="" fill={"url(#" + ids.sheen + ")"} />
            <g filter={"url(#" + ids.goo + ")"}>
              <g className="glb-logo">
                <g className="glb-eyes">
                  <path d="M-52 10L-32 -12L-12 10M12 10L32 -12L52 10" fill="none" stroke="#fff" strokeWidth="17" strokeLinecap="round" strokeLinejoin="round" />
                </g>
                {[-1, 1].map((s) => (
                  <g key={s}>
                    <path className="glb-bar" data-s={s} d="M0 0" fill="none" stroke="#fff" strokeWidth="22" strokeLinecap="round" style={{ opacity: 0 }} />
                    <circle className="glb-drop" data-s={s} data-e="t" r="0" fill="#fff" />
                    <circle className="glb-drop" data-s={s} data-e="b" r="0" fill="#fff" />
                  </g>
                ))}
              </g>
            </g>
          </g>
        </g>
      </svg>
      {children ? <span className="glb-sr">{children}</span> : null}
    </button>
  )
}
