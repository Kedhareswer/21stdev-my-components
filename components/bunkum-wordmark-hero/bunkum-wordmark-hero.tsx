import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from "react"

// #region story
// Pure: geometry and easing. No React, no DOM: the test lifts this region and runs it.

export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)
/** Frame-rate independent approach toward a target (tau in ms): a critically smooth ease with no overshoot. */
export const approach = (cur: number, target: number, dt: number, tau: number) => target + (cur - target) * Math.exp(-Math.max(0, dt) / tau)

// ---- the wordmark: a grid of flat letters whose stems lengthen under the pointer
export const WORD = ["B", "U", "N", "K", "U", "M"] as const
export const T = 30 // stem thickness, viewBox units
export const CELLS = [96, 96, 96, 96, 96, 118] as const
export const GAP = 3
export const PAD = 0
export const VB_W = PAD * 2 + CELLS.reduce((a, b) => a + b, 0) + GAP * (CELLS.length - 1)
export const cellX = (i: number) => PAD + CELLS.slice(0, i).reduce((a, b) => a + b, 0) + GAP * i
export const cellMid = (i: number) => cellX(i) + CELLS[i] / 2
/** Measured on the reference: a stretched letter is 1.89× its resting height. */
export const STRETCH = 1.89
/** Full stretch within 0.139 of the viewport width from a letter's centre, back to rest by 0.462. */
export const NEAR = 0.139
export const FAR = 0.462
/** Measured easing: plain exponential, tau 105 ms, no overshoot. */
export const TAU_LETTER = 105
/** Resting letters fill 43% of the stage height, unless that would make them wider than tall. */
export const baseFor = (H: number, scale: number) => (scale > 0 ? Math.max(Math.round((0.43 * H) / scale), 120) : 260)
export const vbH = (base: number) => Math.ceil(base * STRETCH + 4)
/** 0..1 pull on a letter whose centre is d px from the pointer, in a viewport W px wide. */
export const pullAt = (d: number, W: number) => (W > 0 ? clamp01((FAR * W - Math.abs(d)) / ((FAR - NEAR) * W)) : 0)

export const f = (n: number) => (Math.round(n * 10) / 10).toString()
/**
 * One letter as a filled outline (centre-line stroked flat). Only the stems get longer as h grows:
 * bowls, junctions and the M's valley stay pinned to the resting height, so a stretched letter
 * still reads as itself.
 */
export function glyph(ch: string, ox: number, w: number, h: number, base: number) {
  h = Math.max(h, base)
  const a = ox + T / 2
  const b = ox + w - T / 2
  const top = T / 2
  const bot = h - T / 2
  const bb = base - T / 2
  const r = (b - a) / 2
  switch (ch) {
    case "B": {
      const m = top + (bb - top) * 0.44
      const bu = b - 7
      const ru = Math.min(r * 0.9, (m - top) / 2)
      const rl = Math.min(r, (bot - m) / 2)
      return (
        "M" + f(a) + " 0V" + f(h) +
        "M" + f(a) + " " + f(top) + "H" + f(bu - ru) + "A" + f(ru) + " " + f(ru) + " 0 0 1 " + f(bu) + " " + f(top + ru) + "V" + f(m - ru) + "A" + f(ru) + " " + f(ru) + " 0 0 1 " + f(bu - ru) + " " + f(m) + "H" + f(a) +
        "M" + f(a) + " " + f(m) + "H" + f(b - rl) + "A" + f(rl) + " " + f(rl) + " 0 0 1 " + f(b) + " " + f(m + rl) + "V" + f(bot - rl) + "A" + f(rl) + " " + f(rl) + " 0 0 1 " + f(b - rl) + " " + f(bot) + "H" + f(a)
      )
    }
    case "U":
      return "M" + f(a) + " 0V" + f(bot - r) + "A" + f(r) + " " + f(r) + " 0 0 0 " + f(b) + " " + f(bot - r) + "V0"
    case "N":
      return "M" + f(a) + " " + f(h) + "V" + f(top) + "L" + f(b) + " " + f(bot) + "M" + f(b) + " " + f(h) + "V0M" + f(a) + " " + f(top) + "V0"
    case "K": {
      const j = top + (bb - top) * 0.5
      const over = b + 2 + ((b - 2 - a) * T) / j // the arm runs on past the top, where the clip squares it off
      return "M" + f(a) + " 0V" + f(h) + "M" + f(over) + " " + f(-T) + "L" + f(a + 4) + " " + f(j) + "L" + f(b + 2) + " " + f(h)
    }
    case "M": {
      const v = top + (bb - top) * 0.56
      return "M" + f(a) + " " + f(h) + "V" + f(top) + "L" + f((a + b) / 2) + " " + f(v) + "L" + f(b) + " " + f(top) + "V" + f(h) + "M" + f(a) + " " + f(top) + "V0M" + f(b) + " " + f(top) + "V0"
    }
  }
  return ""
}

/** Target height of every letter for a pointer at x px (null: nobody pointing, everything rests). */
export function stretchTargets(px: number | null, centres: number[], W: number, base: number, out: number[]) {
  for (let i = 0; i < WORD.length; i++) out[i] = px === null ? base : base * (1 + (STRETCH - 1) * pullAt((centres[i] ?? 0) - px, W))
  return out
}

// ---- the carton: turns to look at the pointer, and idles round on its own
/** Measured: rotateY = 175° × pointer x (−1..1 from centre), rotateX = −175° × pointer y. */
export const LOOK = 175
export const TAU_LOOK = 300
/** Measured idle spin about Y, degrees per second. */
export const SPIN = 6
export const lookAt = (nx: number, ny: number) => ({ rx: -LOOK * Math.max(-1, Math.min(1, ny)), ry: LOOK * Math.max(-1, Math.min(1, nx)) })

/** Gerald (the gremlin riding the K): a gently damped pendulum, in radians. */
export function pendulum(a: number, w: number, dtMs: number): [number, number] {
  let t = Math.min(64, Math.max(0, dtMs)) / 1000
  while (t > 0) {
    const h = Math.min(t, 1 / 120)
    w += (-11 * Math.sin(a) - 1.4 * w) * h
    a += w * h
    t -= h
  }
  return [a, w]
}
export const LET_GO = 5
/** Every LET_GO-th poke he lets go of the K. */
export const letsGo = (pokes: number) => pokes > 0 && pokes % LET_GO === 0

// ---- themes: the badge cycles them instantly
export const THEMES = [
  { name: "Cobalt", bg: "#2731e8", fg: "#ffe98a", deep: "#0d137a" },
  { name: "Tomato", bg: "#ff4a2e", fg: "#6e0d05", deep: "#3d0702" },
  { name: "Night", bg: "#0c0c10", fg: "#f6f1e3", deep: "#000000" },
  { name: "Pistachio", bg: "#b9e27c", fg: "#1d3a12", deep: "#0f2208" },
] as const
export const nextTheme = (i: number) => (i + 1) % THEMES.length
// #endregion

/* ------------------------------------------------------------- content */

export type BunkumWordmarkHeroLink = { label: string; href: string }
export type BunkumWordmarkHeroProps = {
  /** Height of the stage. Must be a definite length. */
  height?: string
  /** Text in the brand pill. The giant wordmark always spells BUNKUM (its glyphs are hand-drawn). */
  brand?: string
  /** The year after the © in the brand pill. */
  year?: string | number
  /** Where the brand pill goes. */
  brandHref?: string
  links?: BunkumWordmarkHeroLink[]
  /** The line bottom-right. */
  copy?: string
  className?: string
  style?: CSSProperties
}

const LINKS: BunkumWordmarkHeroLink[] = [
  { label: "Studio", href: "#" },
  { label: "Index", href: "#" },
  { label: "Archive", href: "#" },
]
/** Carton faces: front, back, right, left (tall), top and bottom. */
const BOX = ["a1", "b3", "a4", "b8", "a2", "b1"]

/* ------------------------------------------------------------- styles */

const CSS =
  ".bkm-root{--blue:#2731e8;--deep:#0d137a;--butter:#ffe98a;--ink:#0c0c10;position:relative;overflow:clip;color:var(--butter);font-family:BkmSans,ui-sans-serif,system-ui,sans-serif;-webkit-font-smoothing:antialiased;isolation:isolate}" +
  ".dark .bkm-root{--ink:#08080b}" +
  ".bkm-root *{box-sizing:border-box}" +
  ".bkm-root svg,.bkm-root img{max-width:none}" +
  ".bkm-mono{font-family:BkmMono,ui-monospace,monospace;font-size:11px;line-height:1.35;letter-spacing:.06em;text-transform:uppercase}" +
  ".bkm-speck{background-color:var(--blue);background-image:radial-gradient(circle at 30% 40%,rgba(255,255,255,.14) 0 1.2px,transparent 1.8px),radial-gradient(circle at 70% 60%,rgba(0,0,0,.22) 0 1.6px,transparent 2.3px),radial-gradient(circle at 50% 50%,rgba(255,255,255,.08) 0 2.4px,transparent 3px);background-size:37px 41px,53px 47px,113px 97px}" +
  /* nav: pills in the letter colour, labels that roll up right-to-left with a springy settle */
  ".bkm-chrome{position:sticky;top:0;height:0;z-index:50}" +
  ".bkm-nav{position:absolute;left:0;right:0;top:0;display:flex;gap:8px;padding:18px 18px 0;pointer-events:none}" +
  ".bkm-pill{position:relative;display:flex;align-items:center;height:48px;padding:0 14px 0 18px;border:0;border-radius:51px;background:var(--butter);color:var(--deep);font:inherit;font-size:17px;font-weight:700;letter-spacing:-.015em;text-decoration:none;cursor:pointer;pointer-events:auto;transition:transform .55s cubic-bezier(.2,1.6,.4,1)}" +
  ".bkm-pill[data-near]{transition:transform .1s linear}" +
  ".bkm-pill:focus-visible,.bkm-hit:focus-visible{outline:2px solid var(--butter);outline-offset:3px}" +
  ".bkm-brand{flex:2;justify-content:space-between;font-weight:800;letter-spacing:.01em}" +
  ".bkm-brand small{font-size:14px;font-weight:700;letter-spacing:-.02em}" +
  ".bkm-link{flex:1}" +
  ".bkm-roll{position:relative;display:inline-flex;overflow:hidden;line-height:1.16;padding-bottom:.04em}" +
  ".bkm-roll>span{display:inline-block;transition:transform .42s cubic-bezier(.3,1.75,.55,1);transition-delay:calc((var(--n) - 1 - var(--i)) * 30ms);text-shadow:0 1.16em 0 currentColor}" +
  "@media (hover:hover){.bkm-pill:hover .bkm-roll>span{transform:translateY(-1.16em)}}" +
  ".bkm-badge{flex:none;width:48px;padding:0;justify-content:center}" +
  ".bkm-badge svg{width:30px;height:30px;animation:bkm-turn 9s linear infinite}" +
  "@keyframes bkm-turn{to{transform:rotate(360deg)}}" +
  /* the wordmark */
  ".bkm-word{position:absolute;left:18px;right:18px;top:clamp(76px,9.3vh,96px)}" +
  ".bkm-word svg{display:block;width:100%;height:auto;overflow:visible}" +
  ".bkm-word path{fill:none;stroke:var(--butter);stroke-linecap:butt;stroke-linejoin:miter;stroke-miterlimit:2}" +
  ".bkm-perch{transform-box:fill-box;transform-origin:50% 100%}" +
  ".bkm-perch[data-boing]{animation:bkm-boing .6s cubic-bezier(.3,1.8,.5,1)}" +
  "@keyframes bkm-boing{0%{transform:scale(1.25,.7)}45%{transform:scale(.85,1.2) translateY(-14px)}100%{transform:none}}" +
  ".bkm-hit{cursor:pointer;outline:none}" +
  ".bkm-sigfix{position:absolute;left:18px;bottom:16px;width:70px;height:auto;color:var(--butter)}" +
  ".bkm-sigfix path{fill:none;stroke:currentColor;stroke-width:3.4;stroke-linecap:round;stroke-linejoin:round}" +
  ".bkm-copy{position:absolute;right:18px;bottom:18px;max-width:300px;margin:0;text-align:right;font-size:14px;line-height:1.3;font-weight:700;color:var(--butter)}" +
  /* the carton */
  ".bkm-box{position:absolute;left:50%;top:48%;--s:clamp(110px,14.6vw,230px);width:var(--s);height:calc(var(--s) * 1.86);margin:calc(var(--s) * -.93) 0 0 calc(var(--s) * -.5);perspective:1100px;pointer-events:none;z-index:3}" +
  ".bkm-pose,.bkm-look,.bkm-spin,.bkm-body{position:absolute;inset:0;transform-style:preserve-3d}" +
  ".bkm-pose{transform:rotateX(14deg) rotateY(-8deg)}" +
  ".bkm-body{transform:rotateX(-30deg) rotateY(140deg)}" +
  ".bkm-face{position:absolute;left:50%;top:50%;background-size:cover;background-position:center;outline:2px solid var(--ink);outline-offset:-1px;backface-visibility:hidden}" +
  ".bkm-fz{width:var(--s);height:calc(var(--s) * 1.86);margin:calc(var(--s) * -.93) 0 0 calc(var(--s) * -.5)}" +
  ".bkm-fx{width:calc(var(--s) * .62);height:calc(var(--s) * 1.86);margin:calc(var(--s) * -.93) 0 0 calc(var(--s) * -.31)}" +
  ".bkm-fy{width:var(--s);height:calc(var(--s) * .62);margin:calc(var(--s) * -.31) 0 0 calc(var(--s) * -.5)}" +
  ".bkm-f0{transform:translateZ(calc(var(--s) * .31))}" +
  ".bkm-f1{transform:rotateY(180deg) translateZ(calc(var(--s) * .31))}" +
  ".bkm-f2{transform:rotateY(90deg) translateZ(calc(var(--s) * .5))}" +
  ".bkm-f3{transform:rotateY(-90deg) translateZ(calc(var(--s) * .5))}" +
  ".bkm-f4{transform:rotateX(90deg) translateZ(calc(var(--s) * .93))}" +
  ".bkm-f5{transform:rotateX(-90deg) translateZ(calc(var(--s) * .93))}" +
  /* toast + context label (the system cursor stays, as on the reference) */
  ".bkm-toast{position:fixed;left:50%;bottom:24px;z-index:80;transform:translate(-50%,calc(100% + 48px));padding:12px 18px;border-radius:999px;background:var(--butter);color:var(--deep);font-weight:800;font-size:14px;transition:transform .5s cubic-bezier(.2,1.5,.4,1);pointer-events:none;white-space:nowrap}" +
  ".bkm-toast[data-on]{transform:translate(-50%,0)}" +
  ".bkm-cursor{display:none;position:fixed;left:0;top:0;z-index:90;pointer-events:none}" +
  ".bkm-clab{position:absolute;left:16px;top:16px;padding:6px 10px;border-radius:999px;background:var(--butter);color:var(--deep);white-space:nowrap;opacity:0;transform:scale(.5);transform-origin:0 0;transition:transform .3s cubic-bezier(.2,1.5,.4,1),opacity .15s}" +
  ".bkm-cursor[data-label] .bkm-clab{opacity:1;transform:none}" +
  "@media (hover:hover) and (pointer:fine){.bkm-cursor{display:block}}" +
  ".bkm-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}" +
  /* small screens */
  "@media (max-width:640px){.bkm-nav{gap:5px;padding:10px 10px 0}.bkm-pill{height:38px;padding:0 10px 0 12px;font-size:14px}.bkm-brand small{display:none}.bkm-badge{width:38px}.bkm-badge svg{width:24px;height:24px}.bkm-word{left:10px;right:10px;top:62px}.bkm-copy{display:none}}" +
  "@media (prefers-reduced-motion:reduce){.bkm-root *{animation:none!important;transition-duration:.01ms!important;transition-delay:0s!important}}"

/* ------------------------------------------------------------- helpers */

const roll = (text: string) => (
  <span className="bkm-roll" aria-hidden="true" style={{ "--n": text.length } as CSSProperties}>
    {text.split("").map((ch, i) => (
      <span key={i} style={{ "--i": i } as CSSProperties}>
        {ch === " " ? " " : ch}
      </span>
    ))}
  </span>
)
const SIG =
  "M14 62c6-22 10-44 8-50-3 10-4 40 0 52 8-14 24-20 26-8 2 13-18 16-22 6M58 40c-2 10 0 22 8 20 7-2 8-14 8-20 0 8 2 18 8 18M92 58c0-8 0-16 2-18 4 10 10 18 14 16 2-6 0-14 0-18M124 20c-2 16-2 30 0 42M140 36c-8 4-14 10-14 12 8 0 14 6 18 14M156 40c-2 10 0 22 8 20 7-2 8-14 8-20 0 8 2 18 8 18M190 58c0-6 0-14 2-18 3 6 4 12 6 12 2-6 4-12 7-12 3 4 3 12 3 18M20 78c50-6 120-10 190-6"
const bg = (k: string) => ({ backgroundImage: "var(--bk-" + k + ")" }) as CSSProperties

type El = HTMLElement | SVGElement

export default function BunkumWordmarkHero({
  height = "100svh",
  brand = "BUNKUM",
  year = "2026",
  brandHref = "#",
  links = LINKS,
  copy = "Ink, motion and mascots. A two-person studio drawing loud characters for packaging, titles and campaigns.",
  className,
  style,
}: BunkumWordmarkHeroProps) {
  const rootRef = useRef(null as HTMLDivElement | null)
  const cursorRef = useRef(null as HTMLDivElement | null)
  const labelRef = useRef(null as HTMLSpanElement | null)
  const els = useRef({} as Record<string, El | null>)
  const reg = (k: string) => (el: El | null) => {
    els.current[k] = el
  }
  const clipId = "bkm-clip" + useId().replace(/[^a-zA-Z0-9]/g, "")
  const [base, setBase] = useState(260)
  const [theme, setTheme] = useState(0)
  const [toast, setToast] = useState({ text: "", on: false })
  const toastTimer = useRef(0)
  const s = useRef({
    W: 0,
    H: 0,
    base: 260,
    wordX: 0,
    wordW: 1,
    centres: WORD.map(() => 0),
    hs: WORD.map(() => 260),
    tg: WORD.map(() => 260),
    fine: false,
    still: false,
    top: 0,
    left: 0,
    last: 0,
    px: -1,
    py: -1,
    over: false,
    touching: false,
    label: "",
    // the carton
    rx: 0,
    ry: 0,
    spin: 0,
    // Gerald
    ga: 0.12,
    gw: 0,
    pokes: 0,
    fall: 0,
    fy: 0,
    fvy: 0,
    fr: 0,
    hy: 0,
    magnet: null as HTMLElement | null,
    magnetBox: null as DOMRect | null,
    visible: true,
    raf: 0,
    cache: new WeakMap() as WeakMap<object, Record<string, string>>,
  })

  const put = (el: El | null | undefined, prop: string, val: string) => {
    if (!el) return
    const c = s.current.cache
    let m = c.get(el)
    if (!m) c.set(el, (m = {}))
    if (m[prop] === val) return
    m[prop] = val
    if (prop === "d" || prop === "transform@" || prop === "stroke-width") el.setAttribute(prop === "transform@" ? "transform" : prop, val)
    else if (prop.charCodeAt(0) === 45) el.style.setProperty(prop, val)
    else (el.style as unknown as Record<string, string>)[prop] = val
  }
  const flag = (el: El | null | undefined, name: string, on: boolean) => {
    if (!el) return
    if (on !== el.hasAttribute(name)) on ? el.setAttribute(name, "") : el.removeAttribute(name)
  }
  const say = (text: string) => {
    setToast({ text, on: true })
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast((t) => ({ ...t, on: false })), 2800)
  }

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)")
    const fp = window.matchMedia("(hover: hover) and (pointer: fine)")
    const sync = () => {
      s.current.still = rm.matches
      s.current.fine = fp.matches
      schedule()
    }
    sync()
    rm.addEventListener("change", sync)
    fp.addEventListener("change", sync)
    return () => {
      rm.removeEventListener("change", sync)
      fp.removeEventListener("change", sync)
      window.clearTimeout(toastTimer.current)
    }
  }, [])

  // ---- the frame: one layout read (the root's box), then writes only
  const frame = (now: number) => {
    const st = s.current
    st.raf = 0
    const root = rootRef.current
    if (!root || !st.H) return
    const dt = st.last ? Math.min(64, now - st.last) : 16
    st.last = now
    const rect = root.getBoundingClientRect()
    st.left = rect.left
    st.top = rect.top
    const H = st.H
    const W = st.W
    const e = els.current
    let busy = false

    // the morphing letters, the stickers riding them, the carton
    const heroUp = st.top > -H * 0.98
    const pointing = (st.over && st.fine) || st.touching
    const px = !st.still && heroUp && pointing ? st.px - st.left : null
    stretchTargets(px, st.centres, W, st.base, st.tg)
    for (let i = 0; i < WORD.length; i++) {
      st.hs[i] = st.still ? st.tg[i] : approach(st.hs[i], st.tg[i], dt, TAU_LETTER)
      if (Math.abs(st.hs[i] - st.tg[i]) > 0.3) busy = true
      put(e["l" + i], "d", glyph(WORD[i], cellX(i), CELLS[i], st.hs[i], st.base))
    }
    // Gerald rides the bottom of the K and sways
    const kb = st.hs[3] - 2
    if (st.fall > 0) {
      st.fall += dt
      st.fvy += 0.0026 * dt
      st.fy += st.fvy * dt
      st.fr += dt * 0.35
      if (st.fall > 2300) {
        st.fall = 0
        st.fy = 0
        st.fvy = 0
        st.fr = 0
        st.hy = -(st.base * 2.4)
        st.ga = 0.4
        st.gw = 0
      }
      busy = true
    } else if (!st.still) {
      st.hy = approach(st.hy, 0, dt, 140)
      const q = pendulum(st.ga, st.gw, dt)
      st.ga = q[0]
      st.gw = q[1]
      if (Math.abs(st.gw) > 0.01 || Math.abs(st.hy) > 0.5) busy = true
    }
    put(e.gerald, "transform@", "translate(" + f(cellMid(3)) + " " + f(kb + st.hy + st.fy) + ") rotate(" + f((st.ga * 180) / Math.PI + st.fr) + ")")
    // the carton turns to look at the pointer and idles round about Y
    if (!st.still) {
      const look = pointing && heroUp ? lookAt((st.px - st.left - W / 2) / (W / 2), (st.py - st.top - H / 2) / (H / 2)) : { rx: 0, ry: 0 }
      st.rx = approach(st.rx, look.rx, dt, TAU_LOOK)
      st.ry = approach(st.ry, look.ry, dt, TAU_LOOK)
      st.spin = (st.spin + (SPIN * dt) / 1000) % 360
    }
    put(e.look, "transform", "rotateX(" + f(st.rx) + "deg) rotateY(" + f(st.ry) + "deg)")
    put(e.spin, "transform", "rotateY(" + f(st.spin) + "deg)")
    busy = busy || !st.still

    // the context label (mouse only; the system cursor stays)
    if (st.fine && st.over) put(cursorRef.current, "transform", "translate3d(" + f(st.px) + "px," + f(st.py) + "px,0)")

    if (busy && st.visible) schedule()
  }
  const schedule = () => {
    const st = s.current
    if (!st.raf && typeof window !== "undefined") st.raf = window.requestAnimationFrame(frame)
  }

  // ---- measure: the stage and the wordmark's box (resize only)
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const measure = () => {
      const st = s.current
      st.W = root.offsetWidth
      st.H = root.offsetHeight
      const w = els.current.word as HTMLElement | null
      if (w) {
        st.wordX = w.offsetLeft
        st.wordW = w.offsetWidth
      }
      const scale = st.wordW / VB_W
      st.centres = WORD.map((_, i) => st.wordX + cellMid(i) * scale)
      const b = baseFor(st.H, scale)
      if (b !== st.base) {
        st.base = b
        st.hs = WORD.map(() => b)
        st.tg = WORD.map(() => b)
        setBase(b)
      }
      schedule()
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(root)
    const onScroll = () => schedule()
    window.addEventListener("scroll", onScroll, { passive: true })
    const io = new IntersectionObserver((list) => {
      s.current.visible = list.some((x) => x.isIntersecting)
      if (s.current.visible) schedule()
    })
    io.observe(root)
    return () => {
      ro.disconnect()
      io.disconnect()
      window.removeEventListener("scroll", onScroll)
      const st = s.current
      if (st.raf) window.cancelAnimationFrame(st.raf)
      st.raf = 0
    }
  }, [])

  // ---- pointer: letters, carton, context label, magnets
  const releaseMagnet = () => {
    const st = s.current
    const m = st.magnet
    if (m) {
      m.style.transform = ""
      m.removeAttribute("data-near")
    }
    st.magnet = null
    st.magnetBox = null
  }
  const onMove = (ev: ReactPointerEvent<HTMLDivElement>) => {
    const st = s.current
    if (ev.pointerType !== "mouse") {
      if (st.touching) {
        st.px = ev.clientX
        st.py = ev.clientY
        schedule()
      }
      return
    }
    st.px = ev.clientX
    st.py = ev.clientY
    st.over = true
    const t = ev.target as Element
    const hit = t.closest ? (t.closest("[data-cursor]") as HTMLElement | null) : null
    const label = hit ? hit.getAttribute("data-cursor") || "" : ""
    if (label !== st.label) {
      st.label = label
      if (labelRef.current) labelRef.current.textContent = label
      flag(cursorRef.current, "data-label", !!label)
    }
    const mag = st.fine && !st.still && t.closest ? (t.closest("[data-magnet]") as HTMLElement | null) : null
    if (mag !== st.magnet) {
      releaseMagnet()
      if (mag) {
        st.magnet = mag
        st.magnetBox = mag.getBoundingClientRect()
        mag.setAttribute("data-near", "")
      }
    }
    if (st.magnet && st.magnetBox) {
      const bx = st.magnetBox
      const dx = ev.clientX - (bx.left + bx.width / 2)
      const dy = ev.clientY - (bx.top + bx.height / 2)
      st.magnet.style.transform = "translate(" + (dx * 0.22).toFixed(1) + "px," + (dy * 0.32).toFixed(1) + "px)"
    }
    schedule()
  }
  const onLeave = (ev: ReactPointerEvent<HTMLDivElement>) => {
    const st = s.current
    if (ev.pointerType === "mouse") st.over = false
    flag(cursorRef.current, "data-label", false)
    st.label = ""
    releaseMagnet()
    schedule()
  }
  const onDown = (ev: ReactPointerEvent<HTMLDivElement>) => {
    const st = s.current
    if (ev.pointerType !== "mouse") {
      st.touching = true
      st.px = ev.clientX
      st.py = ev.clientY
      schedule()
    }
  }
  const onUp = (ev: ReactPointerEvent<HTMLDivElement>) => {
    if (ev.pointerType !== "mouse") {
      s.current.touching = false
      schedule()
    }
  }

  // ---- Gerald: poke him and he swings; poke him five times and he lets go
  const poke = () => {
    const st = s.current
    if (st.fall > 0) return
    st.pokes += 1
    if (letsGo(st.pokes) && !st.still) {
      st.fall = 1
      st.fvy = -0.55
      say("Gerald let go. He's fine, he bounces.")
    } else {
      st.gw += (st.pokes % 2 ? 1 : -1) * (2.2 + Math.random())
      if (st.pokes === 3) say("Careful. He's not very strong.")
    }
    schedule()
  }
  const pokeKey = (ev: ReactKeyboardEvent) => {
    if (ev.key === "Enter" || ev.key === " ") {
      ev.preventDefault()
      poke()
    }
  }
  const boing = (ev: { currentTarget: Element }) => {
    const el = ev.currentTarget
    el.removeAttribute("data-boing")
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => el.setAttribute("data-boing", "")))
  }
  const rotate = () => {
    const n = nextTheme(theme)
    setTheme(n)
    say(THEMES[n].name + ".")
  }

  const vbh = vbH(base)
  const th = THEMES[theme]
  const vars = { "--blue": th.bg, "--butter": th.fg, "--deep": th.deep } as Record<string, string>
  for (const k of Object.keys(IMG)) vars["--bk-" + k] = "url(" + IMG[k] + ")"
  const rootStyle = { ...vars, ...style, height } as CSSProperties

  return (
    <div
      ref={rootRef}
      className={"bkm-root bkm-speck" + (className ? " " + className : "")}
      style={rootStyle}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      onPointerDown={onDown}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      <style>{FONTS + CSS}</style>

      <div className="bkm-chrome">
        <nav className="bkm-nav" aria-label="Main">
          <a href={brandHref} className="bkm-pill bkm-brand" data-magnet="">
            <span>{brand}</span>
            <small>©{year}</small>
          </a>
          {links.map((l) => (
            <a key={l.label + l.href} href={l.href} className="bkm-pill bkm-link" data-magnet="">
              {roll(l.label)}
              <span className="bkm-sr">{l.label}</span>
            </a>
          ))}
          <button type="button" className="bkm-pill bkm-badge" data-cursor={"Theme: " + th.name} aria-label={"Change colours (now " + th.name + ")"} onClick={rotate}>
            <svg viewBox="0 0 30 30" aria-hidden="true">
              {[0, 1, 2, 3, 4, 5].map((k) => (
                <ellipse key={k} cx="15" cy="8.6" rx="3.6" ry="6" fill="currentColor" transform={"rotate(" + k * 60 + " 15 15)"} opacity={k % 2 ? 0.55 : 1} />
              ))}
              <circle cx="15" cy="15" r="3.4" fill="var(--butter)" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </button>
        </nav>
      </div>

      <section aria-label={brand + ", an illustration and motion studio"}>
        <div ref={reg("word")} className="bkm-word">
          <h1 className="bkm-sr">{brand}</h1>
          <svg viewBox={"0 0 " + VB_W + " " + vbh} aria-hidden="true">
            <clipPath id={clipId}>
              <rect x={-20} y={0} width={VB_W + 40} height={vbh + 400} />
            </clipPath>
            <g clipPath={"url(#" + clipId + ")"}>
              {WORD.map((ch, i) => (
                <path key={i} ref={reg("l" + i)} d={glyph(ch, cellX(i), CELLS[i], base, base)} strokeWidth={T} />
              ))}
            </g>
            {/* the blob peeks out of the cup of the first U */}
            <g transform={"translate(" + (cellMid(1) - 25) + " " + 2 + ")"}>
              <g className="bkm-perch bkm-hit" data-cursor="Boop" onClick={boing}>
                <image href={IMG.s0} width={50} height={54} preserveAspectRatio="xMidYMid meet" />
              </g>
            </g>
            {/* the aubergine hides inside the M's valley */}
            <image href={IMG.s2} x={cellMid(5) - 22} y={base * 0.58 - 24} width={44} height={67} preserveAspectRatio="xMidYMid meet" transform={"rotate(-8 " + cellMid(5) + " " + base * 0.6 + ")"} />
            {/* Gerald rides the bottom of the K */}
            <g ref={reg("gerald")} transform={"translate(" + cellMid(3) + " " + (base - 2) + ")"}>
              <g className="bkm-hit" role="button" tabIndex={0} aria-label="Poke Gerald" data-cursor="Poke" onClick={poke} onKeyDown={pokeKey}>
                <image href={IMG.s1} x={-40} y={-9} width={80} height={100} preserveAspectRatio="xMidYMid meet" />
              </g>
            </g>
          </svg>
        </div>

        <div className="bkm-box" aria-hidden="true">
          <div className="bkm-pose">
            <div ref={reg("look")} className="bkm-look">
              <div ref={reg("spin")} className="bkm-spin">
                <div className="bkm-body">
                  {BOX.map((k, i) => (
                    <div key={k} className={"bkm-face bkm-f" + i + (i < 2 ? " bkm-fz" : i < 4 ? " bkm-fx" : " bkm-fy")} style={bg(k)} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <svg className="bkm-sigfix" viewBox="0 0 220 90" aria-hidden="true">
          <path d={SIG} />
        </svg>
        <p className="bkm-copy">{copy}</p>
      </section>

      <div className="bkm-toast" data-on={toast.on ? "" : undefined} role="status" aria-live="polite">
        {toast.text}
      </div>
      <div ref={cursorRef} className="bkm-cursor" aria-hidden="true">
        <span ref={labelRef} className="bkm-clab bkm-mono" />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------- fonts + pictures */

const FONTS =
  "@font-face{font-family:BkmSans;font-weight:700;font-display:swap;src:url(data:font/woff2;base64,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) format(\"woff2\")}" +
  "@font-face{font-family:BkmMono;font-weight:400 700;font-display:swap;src:url(data:font/woff2;base64,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) format(\"woff2\")}"

/** Only the pictures the hero shows: the carton faces and three stickers. */
/** The drawings, served full-size from the author's site (embedding them would break 21st's 200 kB file limit). */
const IMG_BASE = "https://kedhar-components.pages.dev/bunkum/"
const IMG: Record<string, string> = {
  a1: IMG_BASE + "a1.webp",
  b3: IMG_BASE + "b3.webp",
  a4: IMG_BASE + "a4.webp",
  b8: IMG_BASE + "b8.webp",
  a2: IMG_BASE + "a2.webp",
  b1: IMG_BASE + "b1.webp",
  s0: IMG_BASE + "s0.webp",
  s1: IMG_BASE + "s1.webp",
  s2: IMG_BASE + "s2.webp",
}
