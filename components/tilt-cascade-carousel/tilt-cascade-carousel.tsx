"use client"

import * as React from "react"

/**
 * Tilt Cascade Carousel — square cards on a slanted line. The one in front sits
 * upright at full size; every card after it drops down and to the right, turning
 * clockwise and shrinking, and every card before it climbs up and to the left
 * the other way. Moving through them, the whole line slides along while each
 * card swings into place a moment behind it.
 *
 * Everything is one number, the position, chased by two springs: a stiff one
 * for the slide along the line and a looser one for the tilt, drop and scale.
 * The second spring trailing the first is what makes the cards swing. Drag,
 * flick, horizontal trackpad swipes, arrow keys, the dots and the buttons all
 * just move the target. Frames are written straight to the DOM and stop when
 * the springs settle.
 *
 * Ships ten illustrated travel-journal scenes, drawn in SVG, so it renders with
 * no images and no network requests. Pass `src` on an item for your own photo.
 * React is the only import.
 */

export type TiltCascadeArt =
  | "cable-car"
  | "house"
  | "blossoms"
  | "bottles"
  | "avenue"
  | "train-window"
  | "sunbeams"
  | "seagulls"
  | "pink-flowers"
  | "paddleboard"

export type TiltCascadeItem = {
  /** Shown above the card in front. */
  title: string
  /** Optional small line under the card in front. */
  caption?: string
  /** Your own image. Without it the card draws `art`. */
  src?: string
  alt?: string
  /** A built-in scene. Defaults to the scenes in order. */
  art?: TiltCascadeArt
}

export type TiltCascadeCarouselProps = {
  items?: TiltCascadeItem[]
  /** Root height. **Must be a definite length.** */
  height?: string
  /** Width (and height) of the card in front, any CSS length. */
  slideSize?: string
  /** Degrees each step away from the front turns a card. */
  angle?: number
  /** How far each step drops a card, as a fraction of the card. */
  drop?: number
  /** Scale of every card that isn't in front. */
  inactiveScale?: number
  /** Card corner radius in px. */
  radius?: number
  /** Spring bounce, 0 (none) to about 0.5. */
  bounce?: number
  /** Roughly how long a move takes, in seconds. */
  duration?: number
  /** Wrap past the ends. */
  loop?: boolean
  /** Milliseconds between automatic moves. 0 (default) is off. */
  autoplay?: number
  titles?: boolean
  captions?: boolean
  /** The prev / dots / next pill. */
  controls?: boolean
  /** Root background, any CSS colour or gradient. */
  background?: string
  /** Text, dots and buttons. Defaults to the theme's foreground. */
  color?: string
  fontFamily?: string
  /** A stylesheet to load for `fontFamily`, e.g. a Google Fonts URL. Nothing loads by default. */
  fontHref?: string | null
  /** Controlled index. Omit for uncontrolled. */
  index?: number
  defaultIndex?: number
  onIndexChange?: (index: number) => void
  /** Clicking (or Enter on) the card that's already in front. */
  onSelect?: (item: TiltCascadeItem, index: number) => void
  ariaLabel?: string
  className?: string
}

// #region motion
export const ARTS = [
  "cable-car",
  "house",
  "blossoms",
  "bottles",
  "avenue",
  "train-window",
  "sunbeams",
  "seagulls",
  "pink-flowers",
  "paddleboard",
]

export function wrapIndex(i: number, n: number): number {
  if (n <= 0) return 0
  return ((i % n) + n) % n
}

/** The slide showing at a position. Without looping, a drag past an end still means the end slide. */
export function indexAt(pos: number, n: number, loop: boolean): number {
  if (n <= 0) return 0
  const i = Math.round(pos)
  return loop ? wrapIndex(i, n) : Math.min(Math.max(i, 0), n - 1)
}

/** Signed distance from the position to slide i, in slides. Looping takes the short way round. */
export function offsetOf(i: number, pos: number, n: number, loop: boolean): number {
  const d = i - pos
  return loop && n > 0 ? d - n * Math.round(d / n) : d
}

/** Scale for a card `d` slides from the front: 1 in front, `min` from one step out. */
export function scaleAt(d: number, min: number): number {
  return 1 - (1 - min) * Math.min(Math.abs(d), 1)
}

/** Past either end the line still follows a drag, at a third of the speed. */
export function rubber(pos: number, n: number): number {
  if (pos < 0) return pos / 3
  if (pos > n - 1) return n - 1 + (pos - (n - 1)) / 3
  return pos
}

/** Damping ratios and natural frequency from a framer-style bounce and duration. */
export function springOf(bounce: number, duration: number): { omega: number; slide: number; tilt: number } {
  const b = Math.min(Math.max(bounce, 0), 0.9)
  return { omega: (2 * Math.PI) / Math.max(duration, 0.1), slide: 1 - b / 2, tilt: 1 - b }
}

/** One semi-implicit Euler step, sub-stepped so a long frame can't blow it up. */
export function springStep(x: number, v: number, target: number, omega: number, zeta: number, dt: number): number[] {
  const steps = Math.max(1, Math.ceil(dt / (1 / 240)))
  const h = dt / steps
  for (let k = 0; k < steps; k++) {
    v += (-omega * omega * (x - target) - 2 * zeta * omega * v) * h
    x += v * h
  }
  return [x, v]
}

/**
 * Where a released drag comes to rest. `velocity` is in slides per second; a
 * flick carries about a fifth of a second of it, and never more than three
 * slides past where the finger let go.
 */
export function releaseTarget(pos: number, velocity: number, n: number, loop: boolean): number {
  const here = Math.round(pos)
  let t = Math.round(pos + velocity * 0.2)
  t = Math.min(Math.max(t, here - 3), here + 3)
  return loop ? t : Math.min(Math.max(t, 0), n - 1)
}

/** The nearest position showing slide i, from where the target is now. */
export function targetFor(i: number, target: number, n: number, loop: boolean): number {
  if (!loop) return Math.min(Math.max(i, 0), n - 1)
  const here = Math.round(target)
  let d = i - wrapIndex(here, n)
  d -= n * Math.round(d / n)
  return here + d
}
// #endregion

const DEFAULT_ITEMS: TiltCascadeItem[] = [
  { title: "cable car station", caption: "ridge line · 09:12", art: "cable-car" },
  { title: "light-colored house", caption: "the cat's window", art: "house" },
  { title: "cherry blossoms", caption: "canal walk · april", art: "blossoms" },
  { title: "bottles of drinks", caption: "corner shop, ¥130", art: "bottles" },
  { title: "tree-lined road", caption: "golden hour, slow", art: "avenue" },
  { title: "train window view", caption: "local line, seat 7a", art: "train-window" },
  { title: "sunlight streams", caption: "cedar wood, noon", art: "sunbeams" },
  { title: "seagulls", caption: "harbour, low tide", art: "seagulls" },
  { title: "pink flowers", caption: "someone's garden", art: "pink-flowers" },
  { title: "paddleboarding", caption: "glass water, 7am", art: "paddleboard" },
]

const CSS =
  ".tcc-root{position:relative;overflow:hidden;display:grid;place-items:center;width:100%;" +
  "color:var(--color-foreground,#262626);user-select:none;-webkit-user-select:none;touch-action:pan-y;" +
  "outline:none;-webkit-tap-highlight-color:transparent}" +
  ".tcc-root:focus-visible{box-shadow:inset 0 0 0 2px var(--color-primary,#171717)}" +
  ".tcc-root[data-dragging]{cursor:grabbing}" +
  ".tcc-root[data-dragging] .tcc-slide{cursor:grabbing}" +
  ".tcc-stage{position:relative;aspect-ratio:1/1;margin-top:2rem}" +
  ".tcc-slide{position:absolute;inset:0;margin:0;padding:0;border:0;background:none;color:inherit;font:inherit;" +
  "cursor:pointer;will-change:transform;transform-origin:50% 50%;-webkit-tap-highlight-color:transparent}" +
  ".tcc-slide:focus-visible{outline:none}" +
  ".tcc-slide:focus-visible .tcc-frame{box-shadow:0 0 0 3px var(--color-background,#fff),0 0 0 5px var(--color-primary,#171717)}" +
  ".tcc-frame{position:absolute;inset:0;overflow:hidden;border-radius:var(--tcc-r);" +
  "background:color-mix(in oklab,currentColor 10%,transparent);" +
  "box-shadow:0 24px 44px -24px rgba(0,0,0,.5),0 2px 6px -2px rgba(0,0,0,.18)}" +
  ".tcc-frame>img,.tcc-frame>svg{position:absolute;inset:0;width:100%;height:100%;max-width:none;display:block;object-fit:cover}" +
  ".tcc-title,.tcc-cap{position:absolute;left:50%;white-space:nowrap;pointer-events:none;opacity:0;" +
  "transform:translateX(-50%) scale(.7);filter:blur(4px);transition:opacity .3s,transform .3s,filter .3s}" +
  ".tcc-title{bottom:calc(100% + 8px);font-size:12px;line-height:16px}" +
  ".tcc-cap{top:calc(100% + 10px);font-size:11px;line-height:14px;letter-spacing:.02em;" +
  "color:color-mix(in oklab,currentColor 58%,transparent)}" +
  ".tcc-slide[data-active] .tcc-title,.tcc-slide[data-active] .tcc-cap{opacity:1;transform:translateX(-50%) scale(1);filter:blur(0)}" +
  ".tcc-num{font-variant-numeric:tabular-nums;opacity:.45;margin-right:.5em}" +
  "@media (min-width:768px){.tcc-title{font-size:14px;line-height:18px}.tcc-cap{font-size:12px}}" +
  ".tcc-controls{position:absolute;bottom:16px;left:50%;transform:translateX(-50%);display:flex;align-items:center;" +
  "gap:16px;padding:0 8px;border-radius:999px;" +
  "background:color-mix(in oklab,currentColor 7%,transparent);" +
  "border:1px solid color-mix(in oklab,currentColor 12%,transparent);" +
  "-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);" +
  "box-shadow:0 1px 2px rgba(0,0,0,.06),0 8px 24px -10px rgba(0,0,0,.25)}" +
  ".tcc-btn{display:grid;place-items:center;margin:0;padding:8px;border:0;border-radius:999px;background:none;" +
  "color:inherit;cursor:pointer;transition:opacity .2s,transform .2s}" +
  ".tcc-btn:disabled{opacity:.3;cursor:default}" +
  ".tcc-btn:not(:disabled):active{transform:scale(.88)}" +
  ".tcc-btn:focus-visible,.tcc-dot:focus-visible{outline:2px solid currentColor;outline-offset:2px}" +
  ".tcc-dots{min-width:180px;display:flex;justify-content:center;align-items:center;gap:8px}" +
  ".tcc-dot{position:relative;width:8px;height:8px;margin:0;padding:0;border:0;border-radius:999px;" +
  "background:currentColor;opacity:.3;cursor:pointer;transition:width .3s,opacity .3s}" +
  ".tcc-dot::after{content:\"\";position:absolute;inset:-10px -4px}" +
  ".tcc-dot[aria-current]{width:28px;opacity:1}" +
  ".tcc-count{font-size:13px;font-variant-numeric:tabular-nums}" +
  ".tcc-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}" +
  ".tcc-a-sway,.tcc-a-flap,.tcc-a-ring,.tcc-a-fall,.tcc-a-rise{transform-box:fill-box}" +
  ".tcc-a-sway{transform-origin:50% 0}" +
  ".tcc-a-flap,.tcc-a-ring,.tcc-a-fall{transform-origin:50% 50%}" +
  ".tcc-slide[data-active] .tcc-a-sway{animation:tcc-sway 3.4s ease-in-out infinite}" +
  ".tcc-slide[data-active] .tcc-a-fall{animation:tcc-fall 7s linear infinite}" +
  ".tcc-slide[data-active] .tcc-a-rise{animation:tcc-rise 2.6s ease-in infinite}" +
  ".tcc-slide[data-active] .tcc-a-flap{animation:tcc-flap .9s ease-in-out infinite}" +
  ".tcc-slide[data-active] .tcc-a-scroll{animation:tcc-scroll 2.4s linear infinite}" +
  ".tcc-slide[data-active] .tcc-a-pulse{animation:tcc-pulse 4s ease-in-out infinite}" +
  ".tcc-slide[data-active] .tcc-a-drift{animation:tcc-drift 5s ease-in-out infinite alternate}" +
  ".tcc-slide[data-active] .tcc-a-ring{animation:tcc-ring 2.8s ease-out infinite}" +
  ".tcc-slide[data-active] .tcc-a-glide{animation:tcc-glide 6s ease-in-out infinite alternate}" +
  "@keyframes tcc-sway{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(3deg)}}" +
  "@keyframes tcc-fall{0%{transform:translate(0,-40px) rotate(0);opacity:0}10%{opacity:1}" +
  "90%{opacity:1}100%{transform:translate(-50px,330px) rotate(540deg);opacity:0}}" +
  "@keyframes tcc-rise{0%{transform:translateY(0);opacity:0}20%{opacity:.9}100%{transform:translateY(-70px);opacity:0}}" +
  "@keyframes tcc-flap{0%,100%{transform:scaleY(1)}50%{transform:scaleY(.25)}}" +
  "@keyframes tcc-scroll{from{transform:translateX(0)}to{transform:translateX(-100px)}}" +
  "@keyframes tcc-pulse{0%,100%{opacity:.55}50%{opacity:1}}" +
  "@keyframes tcc-drift{from{transform:translate(0,0)}to{transform:translate(-14px,8px)}}" +
  "@keyframes tcc-ring{0%{transform:scale(.3);opacity:.9}100%{transform:scale(1.8);opacity:0}}" +
  "@keyframes tcc-glide{from{transform:translate(0,0)}to{transform:translate(18px,-10px)}}" +
  "@media (prefers-reduced-motion:reduce){" +
  ".tcc-slide[data-active] .tcc-a-sway,.tcc-slide[data-active] .tcc-a-fall,.tcc-slide[data-active] .tcc-a-rise," +
  ".tcc-slide[data-active] .tcc-a-flap,.tcc-slide[data-active] .tcc-a-scroll,.tcc-slide[data-active] .tcc-a-pulse," +
  ".tcc-slide[data-active] .tcc-a-drift,.tcc-slide[data-active] .tcc-a-ring,.tcc-slide[data-active] .tcc-a-glide{animation:none}" +
  ".tcc-title,.tcc-cap,.tcc-dot,.tcc-btn{transition:none}}"

// ---- scenes -------------------------------------------------------------------------
// Every scene is a 300 x 300 drawing. Ids are prefixed per instance so two
// carousels on one page don't share gradients.

function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Blossom clusters along the branches, fixed so server and client agree.
const BLOOMS = (() => {
  const r = rng(7)
  const along = [
    [-10, 260, 60, 220, 90, 160, 170, 140],
    [170, 140, 230, 125, 270, 90, 320, 60],
    [95, 175, 110, 130, 140, 100, 150, 55],
    [200, 128, 225, 150, 255, 170, 305, 172],
  ]
  const out: { x: number; y: number; r: number; c: number }[] = []
  for (const [x0, y0, x1, y1, x2, y2, x3, y3] of along) {
    for (let k = 0; k < 9; k++) {
      const t = 0.15 + (k / 8) * 0.85
      const u = 1 - t
      const x = u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3
      const y = u * u * u * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3
      for (let j = 0; j < 3; j++) {
        out.push({ x: x + (r() - 0.5) * 34, y: y + (r() - 0.5) * 30, r: 5 + r() * 5, c: Math.floor(r() * 3) })
      }
    }
  }
  return out
})()

const PETAL_RING = [0, 45, 90, 135, 180, 225, 270, 315]

function Grain({ id }: { id: string }) {
  return (
    <>
      <filter id={id + "grain"} x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} stitchTiles="stitch" />
        <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.09 0" />
      </filter>
    </>
  )
}

function Scene({ art, label }: { art: TiltCascadeArt; label: string }) {
  const id = "tcc" + React.useId().replace(/[^a-zA-Z0-9]/g, "")
  const u = (k: string) => "url(#" + id + k + ")"
  let body: React.ReactNode = null

  if (art === "cable-car") {
    body = (
      <>
        <defs>
          <linearGradient id={id + "sky"} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#cfe3ee" />
            <stop offset="1" stopColor="#f6efe4" />
          </linearGradient>
        </defs>
        <rect width="300" height="300" fill={u("sky")} />
        <circle cx="236" cy="62" r="20" fill="#fff6dc" />
        <path d="M0 190 L58 122 L104 160 L168 92 L228 148 L300 108 L300 300 L0 300 Z" fill="#a9bccb" />
        <path d="M0 236 Q80 196 150 220 T300 206 L300 300 L0 300 Z" fill="#7f9a86" />
        <path d="M0 268 Q100 246 180 262 T300 254 L300 300 L0 300 Z" fill="#62806c" />
        {/* pylon */}
        <path d="M30 268 L44 74 L58 268 M34 210 L54 210 M37 160 L51 160 M40 115 L48 115 M34 210 L51 160 M37 160 L48 115" stroke="#39434d" strokeWidth="2" fill="none" />
        <rect x="34" y="68" width="20" height="6" rx="1" fill="#39434d" />
        {/* cables */}
        <path d="M-10 40 L232 190" stroke="#2f363d" strokeWidth="1.4" />
        <path d="M-10 48 L232 198" stroke="#2f363d" strokeWidth="1" opacity=".6" />
        {/* station */}
        <rect x="214" y="168" width="100" height="132" fill="#efe6d6" />
        <rect x="206" y="156" width="110" height="14" fill="#3e4a5a" />
        <rect x="226" y="180" width="90" height="42" fill="#2b313a" />
        <rect x="226" y="236" width="18" height="24" fill="#c9b99c" />
        <rect x="252" y="236" width="18" height="24" fill="#c9b99c" />
        <rect x="278" y="236" width="18" height="24" fill="#c9b99c" />
        <rect x="214" y="278" width="100" height="22" fill="#d8ccb7" />
        {/* the gondola hangs off the cable and swings */}
        <g transform="translate(120 109)">
          <g className="tcc-a-sway">
            <rect x="-9" y="-4" width="18" height="6" rx="2" fill="#2f363d" />
            <path d="M0 2 L0 26" stroke="#2f363d" strokeWidth="2" />
            <rect x="-24" y="24" width="48" height="6" rx="2" fill="#2f363d" />
            <rect x="-22" y="28" width="44" height="44" rx="7" fill="#d9473f" />
            <rect x="-18" y="34" width="36" height="17" rx="3" fill="#f4e9d8" />
            <path d="M-6 34 L-6 51 M6 34 L6 51" stroke="#d9473f" strokeWidth="2" />
            <rect x="-22" y="58" width="44" height="4" fill="#f4e9d8" opacity=".85" />
          </g>
        </g>
      </>
    )
  } else if (art === "house") {
    body = (
      <>
        <defs>
          <linearGradient id={id + "sky"} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#b9d6e6" />
            <stop offset="1" stopColor="#eef4f1" />
          </linearGradient>
        </defs>
        <rect width="300" height="300" fill={u("sky")} />
        <rect y="252" width="300" height="48" fill="#cfc6b3" />
        <path d="M0 262 L300 262" stroke="#b8ad97" strokeWidth="2" />
        <path d="M240 252 L300 236 L300 252 Z" fill="#000" opacity=".06" />
        {/* walls and roof */}
        <rect x="60" y="130" width="180" height="124" fill="#f4ede1" />
        <rect x="60" y="130" width="180" height="10" fill="#dcd2bf" />
        <path d="M46 136 L150 60 L254 136 Z" fill="#8aa3b5" />
        <path d="M46 136 L150 60 L254 136" stroke="#6e889b" strokeWidth="4" fill="none" strokeLinejoin="round" />
        <circle cx="150" cy="106" r="12" fill="#a9c2cd" stroke="#fff" strokeWidth="3" />
        {/* left window, with the cat */}
        <rect x="84" y="156" width="42" height="42" fill="#a9c2cd" />
        <g transform="translate(105 198)">
          <path d="M-12 0 Q-13 -16 -8 -20 L-9 -28 L-3 -22 Q0 -23 3 -22 L9 -28 L8 -20 Q13 -16 12 0 Z" fill="#3a3330" />
          <g className="tcc-a-sway">
            <path d="M10 -2 Q22 -6 20 -18" stroke="#3a3330" strokeWidth="3" fill="none" strokeLinecap="round" />
          </g>
        </g>
        <rect x="84" y="156" width="42" height="42" fill="none" stroke="#fff" strokeWidth="4" />
        <path d="M105 156 L105 198 M84 177 L126 177" stroke="#fff" strokeWidth="2.5" opacity=".9" />
        <rect x="78" y="198" width="54" height="6" fill="#e6dccb" />
        <rect x="174" y="156" width="42" height="42" fill="#a9c2cd" stroke="#fff" strokeWidth="4" />
        <path d="M195 156 L195 198 M174 177 L216 177" stroke="#fff" strokeWidth="2.5" />
        <rect x="168" y="198" width="54" height="6" fill="#e6dccb" />
        {/* door and step */}
        <rect x="134" y="200" width="32" height="54" rx="2" fill="#c97b5a" />
        <circle cx="160" cy="228" r="2" fill="#f4ede1" />
        <rect x="128" y="252" width="44" height="6" fill="#bdb29c" />
        {/* shrubs */}
        <circle cx="62" cy="244" r="18" fill="#8fb08a" />
        <circle cx="82" cy="250" r="13" fill="#7ea078" />
        <circle cx="242" cy="246" r="15" fill="#8fb08a" />
      </>
    )
  } else if (art === "blossoms") {
    const pinks = ["#f6c1cf", "#fadbe3", "#ee9fb6"]
    body = (
      <>
        <defs>
          <linearGradient id={id + "sky"} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#96c6e6" />
            <stop offset="1" stopColor="#e9f4f8" />
          </linearGradient>
        </defs>
        <rect width="300" height="300" fill={u("sky")} />
        <circle cx="70" cy="70" r="40" fill="#fff" opacity=".25" />
        <g stroke="#5a3d35" fill="none" strokeLinecap="round">
          <path d="M-10 260 C60 220 90 160 170 140" strokeWidth="11" />
          <path d="M170 140 C230 125 270 90 320 60" strokeWidth="7" />
          <path d="M95 175 C110 130 140 100 150 55" strokeWidth="5" />
          <path d="M200 128 C225 150 255 170 305 172" strokeWidth="4" />
        </g>
        {BLOOMS.map((b, i) => (
          <g key={i}>
            <circle cx={b.x} cy={b.y} r={b.r} fill={pinks[b.c]} />
            <circle cx={b.x} cy={b.y} r={b.r * 0.28} fill="#d9577e" opacity=".8" />
          </g>
        ))}
        {[30, 80, 130, 180, 230, 270, 110, 200].map((x, i) => (
          <g key={"p" + i} transform={"translate(" + x + " " + (i * 23) % 120 + ")"}>
            <ellipse className="tcc-a-fall" rx="4" ry="2.4" fill="#f6c1cf" style={{ animationDelay: -i * 0.9 + "s" }} />
          </g>
        ))}
      </>
    )
  } else if (art === "bottles") {
    const bottles = [
      { x: 18, w: 38, h: 120, c: "#6fb7a8", band: "#2f7d8c" },
      { x: 64, w: 40, h: 104, c: "#e78f52", band: "#b14a2a" },
      { x: 112, w: 36, h: 128, c: "#f2c94c", band: "#9b7a14" },
      { x: 156, w: 40, h: 110, c: "#b85c6e", band: "#6e2d3b" },
      { x: 204, w: 36, h: 124, c: "#7aa2d6", band: "#2f5b94" },
      { x: 248, w: 38, h: 100, c: "#5e8b5a", band: "#2e4d2b" },
    ]
    body = (
      <>
        <defs>
          <linearGradient id={id + "wall"} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f6e8cf" />
            <stop offset="1" stopColor="#e8d3b0" />
          </linearGradient>
        </defs>
        <rect width="300" height="300" fill={u("wall")} />
        <rect y="222" width="300" height="78" fill="#8a5a3c" />
        <rect y="210" width="300" height="14" fill="#a7714b" />
        <rect y="224" width="300" height="10" fill="#000" opacity=".12" />
        {bottles.map((b, i) => {
          const top = 210 - b.h
          const cx = b.x + b.w / 2
          return (
            <g key={i}>
              <rect x={cx - 5} y={top - 30} width="10" height="34" rx="3" fill={b.c} />
              <rect x={cx - 6} y={top - 36} width="12" height="8" rx="2" fill={b.band} />
              <ellipse cx={cx} cy={top + 4} rx={b.w / 2} ry="14" fill={b.c} />
              <rect x={b.x} y={top + 4} width={b.w} height={b.h - 4} rx="7" fill={b.c} />
              <rect x={b.x} y={210 - b.h * 0.58} width={b.w} height={b.h * 0.3} fill="#fbf6ec" opacity=".92" />
              <rect x={b.x} y={210 - b.h * 0.47} width={b.w} height="5" fill={b.band} opacity=".8" />
              <rect x={b.x + 5} y={top + 8} width="4" height={b.h - 22} rx="2" fill="#fff" opacity=".45" />
            </g>
          )
        })}
        {/* fizz in the ramune */}
        {[0, 1, 2, 3, 4].map((k) => (
          <g key={"b" + k} transform={"translate(" + (28 + k * 4) + " " + (200 - k * 6) + ")"}>
            <circle className="tcc-a-rise" r={1.6 + (k % 2)} fill="#fff" opacity=".85" style={{ animationDelay: -k * 0.5 + "s" }} />
          </g>
        ))}
        <g opacity=".85">
          {[30, 90, 150, 210, 270].map((x, i) => (
            <g key={"l" + i}>
              <rect x={x - 14} y={256 + (i % 2) * 8} width="28" height="60" rx="6" fill={["#c9573a", "#e3b23c", "#4f8a8b", "#9b4f6a", "#6c8a3c"][i]} />
              <rect x={x - 5} y={244 + (i % 2) * 8} width="10" height="16" rx="3" fill={["#c9573a", "#e3b23c", "#4f8a8b", "#9b4f6a", "#6c8a3c"][i]} />
            </g>
          ))}
        </g>
      </>
    )
  } else if (art === "avenue") {
    const trees: React.ReactNode[] = []
    for (let k = 0; k < 8; k++) {
      const t = 0.08 + (k / 7) * 0.95
      const y = 142 + t * 150
      const off = 12 + t * 150
      const trunk = 6 + t * 110
      const crown = 6 + t * 46
      for (const side of [-1, 1]) {
        const x = 150 + side * off
        trees.push(
          <g key={k + "" + side}>
            <rect x={x - Math.max(1, t * 5)} y={y - trunk} width={Math.max(2, t * 10)} height={trunk} fill="#5b4636" />
            <circle cx={x} cy={y - trunk} r={crown} fill={k % 2 ? "#86a35c" : "#6f8f4e"} />
            <circle cx={x + side * crown * 0.5} cy={y - trunk + crown * 0.3} r={crown * 0.72} fill={k % 2 ? "#6f8f4e" : "#86a35c"} />
          </g>,
        )
      }
    }
    body = (
      <>
        <defs>
          <linearGradient id={id + "sky"} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f3d2ae" />
            <stop offset="1" stopColor="#fbefdc" />
          </linearGradient>
          <radialGradient id={id + "glow"} cx="0.5" cy="0.47" r="0.35">
            <stop offset="0" stopColor="#fff4d6" />
            <stop offset="1" stopColor="#fff4d6" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="300" height="300" fill={u("sky")} />
        <rect y="140" width="300" height="160" fill="#b9c48f" />
        <path d="M144 140 L156 140 L262 300 L38 300 Z" fill="#77706a" />
        <path d="M144 140 L38 300 M156 140 L262 300" stroke="#e9dcc4" strokeWidth="2" />
        {[0.12, 0.3, 0.55, 0.85].map((t, i) => (
          <rect key={i} x={150 - 0.8 - t * 3} y={140 + t * 150} width={1.6 + t * 6} height={4 + t * 22} fill="#f2e6cc" />
        ))}
        {/* long tree shadows across the road */}
        <g fill="#2d2a26" opacity=".18">
          <path d="M40 300 L262 268 L262 282 L40 300 Z" />
          <path d="M70 240 L230 226 L232 234 L74 248 Z" />
          <path d="M104 196 L196 189 L197 194 L106 200 Z" />
        </g>
        <rect width="300" height="300" fill={u("glow")} className="tcc-a-pulse" />
        {trees}
      </>
    )
  } else if (art === "train-window") {
    body = (
      <>
        <defs>
          <linearGradient id={id + "sky"} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#bfe0ea" />
            <stop offset="1" stopColor="#f2f7ee" />
          </linearGradient>
          <clipPath id={id + "glass"}>
            <rect x="40" y="46" width="220" height="168" rx="26" />
          </clipPath>
        </defs>
        <g clipPath={u("glass")}>
          <rect width="300" height="300" fill={u("sky")} />
          <path d="M40 150 Q90 128 140 146 T260 140 L260 160 L40 160 Z" fill="#a8bfc6" />
          <rect x="40" y="156" width="220" height="30" fill="#6fb1c5" />
          <rect x="40" y="166" width="220" height="2" fill="#fff" opacity=".5" />
          <rect x="40" y="184" width="220" height="40" fill="#9cc47a" />
          <g className="tcc-a-scroll">
            {[0, 1, 2, 3, 4].map((k) => (
              <g key={k} transform={"translate(" + (40 + k * 100) + " 0)"}>
                <rect x="20" y="96" width="3" height="100" fill="#4a4a46" />
                <rect x="12" y="102" width="19" height="3" fill="#4a4a46" />
                <path d="M21 104 Q71 116 121 104" stroke="#4a4a46" strokeWidth="1" fill="none" />
                <circle cx="70" cy="196" r="14" fill="#6f9a52" />
                <circle cx="84" cy="200" r="10" fill="#80a95f" />
              </g>
            ))}
          </g>
          <path d="M60 46 L130 46 L60 214 L40 214 Z" fill="#fff" opacity=".18" />
        </g>
        {/* the carriage around the window */}
        <path fillRule="evenodd" d="M0 0 H300 V300 H0 Z M66 46 H234 A26 26 0 0 1 260 72 V188 A26 26 0 0 1 234 214 H66 A26 26 0 0 1 40 188 V72 A26 26 0 0 1 66 46 Z" fill="#dccfb9" />
        <rect x="40" y="46" width="220" height="168" rx="26" fill="none" stroke="#9c8a72" strokeWidth="6" />
        <path d="M0 20 Q30 120 18 236 L0 236 Z" fill="#e9d6b5" />
        <path d="M8 30 Q30 120 20 230" stroke="#d4bf99" strokeWidth="3" fill="none" />
        <rect x="26" y="220" width="248" height="14" rx="3" fill="#b59f84" />
        <rect x="196" y="196" width="20" height="26" rx="4" fill="#e1574a" />
        <rect x="196" y="204" width="20" height="8" fill="#fbf2e4" />
        <rect x="222" y="214" width="34" height="8" rx="1" fill="#f3efe6" transform="rotate(-6 239 218)" />
        <path d="M0 262 Q0 246 18 246 H282 Q300 246 300 262 V300 H0 Z" fill="#4c6a8a" />
        <rect x="0" y="270" width="300" height="4" fill="#3f5a76" />
      </>
    )
  } else if (art === "sunbeams") {
    body = (
      <>
        <defs>
          <linearGradient id={id + "bg"} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#9cb27a" />
            <stop offset="1" stopColor="#2f4636" />
          </linearGradient>
          <linearGradient id={id + "beam"} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff8dc" stopOpacity=".75" />
            <stop offset="1" stopColor="#fff8dc" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect width="300" height="300" fill={u("bg")} />
        {[20, 70, 140, 205, 255].map((x, i) => (
          <rect key={"f" + i} x={x} y="0" width={8 + (i % 2) * 4} height="300" fill="#5d7650" opacity=".7" />
        ))}
        <g className="tcc-a-pulse">
          <path d="M-20 -20 L60 -20 L320 250 L240 300 Z" fill={u("beam")} />
          <path d="M80 -20 L120 -20 L320 160 L310 200 Z" fill={u("beam")} opacity=".7" />
          <path d="M-20 60 L0 30 L200 320 L130 320 Z" fill={u("beam")} opacity=".6" />
        </g>
        {[[38, 18], [104, 26], [178, 20], [232, 30]].map(([x, w], i) => (
          <rect key={"t" + i} x={x} y="0" width={w} height="300" fill="#2a3326" />
        ))}
        <path d="M0 262 Q40 240 70 258 Q110 236 150 256 Q200 238 240 258 Q275 244 300 256 L300 300 L0 300 Z" fill="#3c5a3a" />
        <path d="M0 282 Q60 266 120 280 Q190 264 300 280 L300 300 L0 300 Z" fill="#2f4a30" />
        {[[90, 120], [150, 170], [210, 110], [120, 210], [250, 190]].map(([x, y], i) => (
          <g key={"m" + i} transform={"translate(" + x + " " + y + ")"}>
            <circle className="tcc-a-glide" r="1.8" fill="#fff8dc" opacity=".9" style={{ animationDelay: -i * 1.1 + "s" }} />
          </g>
        ))}
      </>
    )
  } else if (art === "seagulls") {
    const gulls = [
      { x: 110, y: 96, s: 1.6, d: 0 },
      { x: 196, y: 70, s: 1, d: -0.3 },
      { x: 236, y: 120, s: 0.7, d: -0.6 },
      { x: 60, y: 60, s: 0.6, d: -0.15 },
    ]
    body = (
      <>
        <defs>
          <linearGradient id={id + "sky"} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#c9dbe6" />
            <stop offset="1" stopColor="#f7d9c4" />
          </linearGradient>
          <linearGradient id={id + "sea"} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#7aa7bf" />
            <stop offset="1" stopColor="#3f6c86" />
          </linearGradient>
        </defs>
        <rect width="300" height="300" fill={u("sky")} />
        <circle cx="200" cy="200" r="28" fill="#ffe9cf" />
        <rect y="200" width="300" height="100" fill={u("sea")} />
        {[[160, 208, 80], [176, 220, 48], [188, 234, 24]].map(([x, y, w], i) => (
          <rect key={i} x={x} y={y} width={w} height="3" rx="1.5" fill="#ffe9cf" opacity={0.7 - i * 0.15} />
        ))}
        <g stroke="#fff" strokeWidth="1.5" opacity=".35" fill="none">
          <path d="M20 250 q10 -5 20 0 t20 0" />
          <path d="M90 270 q10 -5 20 0 t20 0" />
          <path d="M230 262 q10 -5 20 0 t20 0" />
        </g>
        {/* pier posts */}
        <rect x="24" y="186" width="8" height="56" fill="#4b3c34" />
        <rect x="46" y="192" width="7" height="46" fill="#4b3c34" />
        <rect x="18" y="182" width="40" height="7" fill="#5c4a40" />
        {gulls.map((g, i) => (
          <g key={i} transform={"translate(" + g.x + " " + g.y + ") scale(" + g.s + ")"}>
            <ellipse cx="0" cy="2" rx="8" ry="3.4" fill="#fbfbf8" />
            <g className="tcc-a-flap" style={{ animationDelay: g.d + "s" }}>
              <path d="M-2 0 Q-12 -14 -26 -6 Q-14 -6 -4 4 Z" fill="#fbfbf8" stroke="#8a96a0" strokeWidth=".8" />
              <path d="M2 0 Q12 -14 26 -6 Q14 -6 4 4 Z" fill="#fbfbf8" stroke="#8a96a0" strokeWidth=".8" />
              <path d="M-26 -6 L-21 -7.5 L-19 -4 Z M26 -6 L21 -7.5 L19 -4 Z" fill="#3b4148" />
            </g>
            <path d="M7 1 L11 2 L7 3 Z" fill="#f2b33d" />
          </g>
        ))}
      </>
    )
  } else if (art === "pink-flowers") {
    const flowers = [
      { x: 104, y: 120, r: 34, c: "#f2a7bf", d: "#e07a9b" },
      { x: 206, y: 176, r: 28, c: "#ee8fae", d: "#d2678a" },
      { x: 92, y: 226, r: 22, c: "#f7c0d1", d: "#e590ab" },
    ]
    body = (
      <>
        <defs>
          <linearGradient id={id + "bg"} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#dbe8cb" />
            <stop offset="1" stopColor="#f4e6e0" />
          </linearGradient>
        </defs>
        <rect width="300" height="300" fill={u("bg")} />
        {[[40, 40, 30], [250, 60, 40], [230, 260, 34], [150, 40, 18], [20, 170, 22]].map(([x, y, r], i) => (
          <circle key={"k" + i} cx={x} cy={y} r={r} fill="#fff" opacity=".35" />
        ))}
        <g stroke="#6d9a5b" strokeWidth="4" fill="none" strokeLinecap="round">
          <path d="M104 150 Q110 230 120 320" />
          <path d="M206 200 Q196 260 186 320" />
          <path d="M92 244 Q96 290 100 320" />
          <path d="M160 320 Q164 220 150 190" strokeWidth="3" />
        </g>
        <path d="M112 236 Q140 214 162 232 Q138 246 112 236 Z" fill="#7fae69" />
        <path d="M194 262 Q168 240 148 258 Q170 272 194 262 Z" fill="#6d9a5b" />
        <ellipse cx="150" cy="182" rx="7" ry="11" fill="#e98aa9" />
        {flowers.map((f, i) => (
          <g key={i} transform={"translate(" + f.x + " " + f.y + ")"}>
            <g className={i === 0 ? "tcc-a-sway" : undefined}>
              {PETAL_RING.map((a) => (
                <ellipse key={a} cx="0" cy={-f.r * 0.55} rx={f.r * 0.3} ry={f.r * 0.55} fill={f.c} stroke={f.d} strokeWidth=".8" transform={"rotate(" + (a + i * 12) + ")"} />
              ))}
              <circle r={f.r * 0.24} fill="#f6c945" />
              <circle r={f.r * 0.12} fill="#e2a72e" />
            </g>
          </g>
        ))}
        {/* a butterfly stopping by */}
        <g transform="translate(222 92)">
          <g className="tcc-a-glide">
            <g className="tcc-a-flap">
              <path d="M0 0 Q-16 -18 -18 -2 Q-12 8 0 0 Z M0 0 Q16 -18 18 -2 Q12 8 0 0 Z" fill="#f6c945" />
              <path d="M0 0 Q-10 10 -8 16 Q-2 12 0 0 Z M0 0 Q10 10 8 16 Q2 12 0 0 Z" fill="#e9a23b" />
            </g>
            <rect x="-1" y="-6" width="2" height="16" rx="1" fill="#3b3330" />
          </g>
        </g>
      </>
    )
  } else {
    body = (
      <>
        <defs>
          <linearGradient id={id + "sea"} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#5cc8c8" />
            <stop offset="1" stopColor="#1d8aa3" />
          </linearGradient>
        </defs>
        <rect width="300" height="300" fill={u("sea")} />
        <g className="tcc-a-drift" stroke="#e8fffb" strokeWidth="2" fill="none" opacity=".35" strokeLinecap="round">
          {[30, 74, 118, 162, 206, 250, 294].map((y, i) => (
            <path key={i} d={"M-20 " + y + " q25 -10 50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0"} />
          ))}
        </g>
        {/* wake */}
        <path d="M70 250 L118 196 M96 268 L130 206" stroke="#e8fffb" strokeWidth="2" opacity=".5" strokeLinecap="round" />
        {/* board, rider, paddle */}
        <g transform="translate(160 150) rotate(-38)">
          <ellipse cx="2" cy="6" rx="22" ry="86" fill="#0d5566" opacity=".35" />
          <ellipse cx="0" cy="0" rx="20" ry="84" fill="#f6efe2" />
          <path d="M0 -84 L0 84" stroke="#e8704c" strokeWidth="5" />
          <ellipse cx="0" cy="8" rx="14" ry="10" fill="#f6efe2" />
          <ellipse cx="0" cy="8" rx="17" ry="8" fill="#f2c14e" />
          <circle cx="0" cy="8" r="7" fill="#3b2b25" />
          <path d="M-14 6 L-30 -20" stroke="#d8a27a" strokeWidth="4" strokeLinecap="round" />
          <path d="M-30 -48 L-30 20" stroke="#2d2d2d" strokeWidth="3" strokeLinecap="round" />
          <ellipse cx="-30" cy="-54" rx="5" ry="10" fill="#2d2d2d" />
        </g>
        {/* the paddle's ripples */}
        <g transform="translate(168 102)">
          <circle className="tcc-a-ring" r="16" stroke="#e8fffb" strokeWidth="2" fill="none" />
          <circle className="tcc-a-ring" r="16" stroke="#e8fffb" strokeWidth="2" fill="none" style={{ animationDelay: "-1.4s" }} />
        </g>
      </>
    )
  }

  return (
    <svg viewBox="0 0 300 300" preserveAspectRatio="xMidYMid slice" role="img" aria-label={label} style={{ maxWidth: "none" }}>
      <defs>
        <Grain id={id} />
      </defs>
      {body}
      <rect width="300" height="300" filter={u("grain")} />
    </svg>
  )
}

// ---- icons ---------------------------------------------------------------------------
function Chevron({ dir }: { dir: -1 | 1 }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ maxWidth: "none" }}>
      <path d={dir < 0 ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"} />
    </svg>
  )
}

const pad = (n: number) => (n < 10 ? "0" + n : "" + n)

// ---- component ----------------------------------------------------------------------
export default function TiltCascadeCarousel({
  items = DEFAULT_ITEMS,
  height = "100svh",
  slideSize = "clamp(120px, 80vmin, 300px)",
  angle = 30,
  drop = 0.5,
  inactiveScale = 0.6,
  radius = 16,
  bounce = 0.2,
  duration = 0.8,
  loop = false,
  autoplay = 0,
  titles = true,
  captions = true,
  controls = true,
  color,
  background = "color-mix(in oklab, var(--color-foreground, #000) 7%, var(--color-background, #fff))",
  fontFamily = '"Bricolage Grotesque", ui-sans-serif, system-ui, sans-serif',
  fontHref = null,
  index,
  defaultIndex = 3,
  onIndexChange,
  onSelect,
  ariaLabel = "Photo carousel",
  className = "",
}: TiltCascadeCarouselProps) {
  const n = items.length
  const start = Math.min(Math.max(Math.round(index ?? defaultIndex), 0), Math.max(n - 1, 0))
  const [active, setActive] = React.useState(start)
  const [dragging, setDragging] = React.useState(false)
  const [stopped, setStopped] = React.useState(false)
  const [focused, setFocused] = React.useState(false)
  const [visible, setVisible] = React.useState(true)

  const rootRef = React.useRef(null as HTMLDivElement | null)
  const stageRef = React.useRef(null as HTMLDivElement | null)
  const slideRefs = React.useRef([] as (HTMLButtonElement | null)[])

  // Everything the frame loop reads, kept off React state so a frame costs no render.
  const E = React.useRef({
    a: start, va: 0, b: start, vb: 0, target: start,
    raf: 0, last: 0, size: 300, reduced: false,
    drag: null as null | { id: number; x0: number; pos0: number; moved: boolean; samples: { t: number; x: number }[] },
    clickBlock: false, wheel: 0, wheelAt: 0, stepAt: 0,
  }).current
  const cfg = React.useRef({ n, loop, angle, drop, inactiveScale, bounce, duration })
  cfg.current = { n, loop, angle, drop, inactiveScale, bounce, duration }
  const cb = React.useRef({ onIndexChange, active })
  cb.current = { onIndexChange, active }

  const transformFor = (i: number, a: number, b: number) => {
    const c = cfg.current
    const dx = offsetOf(i, a, c.n, c.loop)
    const d = offsetOf(i, b, c.n, c.loop)
    return {
      transform:
        "translate3d(calc(" + dx.toFixed(4) + " * var(--tcc-s)), " + (d * c.drop * 100).toFixed(3) + "%, 0) " +
        "scale(" + scaleAt(d, c.inactiveScale).toFixed(4) + ") rotate(" + (d * c.angle).toFixed(3) + "deg)",
      zIndex: 100 - Math.round(Math.abs(d) * 10),
      hidden: Math.abs(dx) > 6.5,
    }
  }

  const paint = () => {
    for (let i = 0; i < slideRefs.current.length; i++) {
      const el = slideRefs.current[i]
      if (!el) continue
      const t = transformFor(i, E.a, E.b)
      el.style.transform = t.transform
      el.style.zIndex = "" + t.zIndex
      el.style.visibility = t.hidden ? "hidden" : ""
    }
  }

  const frame = (now: number) => {
    const dt = Math.min((now - (E.last || now)) / 1000, 1 / 20)
    E.last = now
    const c = cfg.current
    const s = springOf(c.bounce, c.duration)
    if (E.reduced && !E.drag) {
      E.a = E.b = E.target
      E.va = E.vb = 0
    } else {
      // While dragging the line is under the finger and only the tilt chases it.
      if (!E.drag) [E.a, E.va] = springStep(E.a, E.va, E.target, s.omega, s.slide, dt)
      ;[E.b, E.vb] = springStep(E.b, E.vb, E.a, s.omega * 1.05, s.tilt, dt)
    }
    paint()
    const settled =
      !E.drag && Math.abs(E.a - E.target) < 1e-3 && Math.abs(E.va) < 1e-2 && Math.abs(E.b - E.a) < 1e-3 && Math.abs(E.vb) < 1e-2
    if (settled) {
      E.a = E.b = E.target
      E.va = E.vb = 0
      paint()
      E.raf = 0
      E.last = 0
      return
    }
    E.raf = requestAnimationFrame(frame)
  }

  const kick = () => {
    if (!E.raf) E.raf = requestAnimationFrame(frame)
  }

  const setTarget = (t: number) => {
    const c = cfg.current
    if (!c.n) return
    E.target = c.loop ? t : Math.min(Math.max(t, 0), c.n - 1)
    const i = indexAt(E.target, c.n, c.loop)
    if (i !== cb.current.active) {
      setActive(i)
      cb.current.onIndexChange?.(i)
    }
    kick()
  }

  const goTo = (i: number) => setTarget(targetFor(i, E.target, cfg.current.n, cfg.current.loop))
  const step = (by: number) => setTarget(Math.round(E.target) + by)

  // controlled index
  React.useEffect(() => {
    if (index == null || !n) return
    if (wrapIndex(Math.round(E.target), n) !== wrapIndex(index, n)) goTo(wrapIndex(index, n))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, n])

  // a shorter list mustn't leave the position past its end
  React.useEffect(() => {
    if (n && !loop && E.target > n - 1) setTarget(n - 1)
    paint()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n, loop, angle, drop, inactiveScale])

  // reduced motion
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const on = () => {
      E.reduced = mq.matches
    }
    on()
    mq.addEventListener("change", on)
    return () => mq.removeEventListener("change", on)
  }, [E])

  // the card size in px, for turning drag distance into slides
  React.useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const measure = () => {
      E.size = el.offsetWidth || 300
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [E])

  React.useEffect(() => () => cancelAnimationFrame(E.raf), [E])

  // fonts arrive by <link>, and only when asked for
  React.useEffect(() => {
    if (!fontHref) return
    const exists = Array.from(document.querySelectorAll("link[rel=stylesheet]")).some(
      (l) => (l as HTMLLinkElement).href === fontHref,
    )
    if (exists) return
    const link = document.createElement("link")
    link.rel = "stylesheet"
    link.href = fontHref
    link.setAttribute("data-tilt-cascade-font", "")
    document.head.appendChild(link)
  }, [fontHref])

  // Horizontal trackpad swipes step through; vertical wheel is left to the page.
  React.useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return
      e.preventDefault()
      const now = performance.now()
      if (now - E.wheelAt > 160) E.wheel = 0
      E.wheelAt = now
      E.wheel += e.deltaX
      if (Math.abs(E.wheel) > 50 && now - E.stepAt > 320) {
        setStopped(true)
        step(Math.sign(E.wheel))
        E.wheel = 0
        E.stepAt = now
      }
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [E])

  // autoplay pauses off-screen and in a hidden tab
  React.useEffect(() => {
    const el = rootRef.current
    if (!el || !autoplay) return
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting && !document.hidden))
    io.observe(el)
    const onVis = () => setVisible(!document.hidden)
    document.addEventListener("visibilitychange", onVis)
    return () => {
      io.disconnect()
      document.removeEventListener("visibilitychange", onVis)
    }
  }, [autoplay])

  const playing = autoplay > 0 && n > 1 && !stopped && !focused && !dragging && visible
  React.useEffect(() => {
    if (!playing || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const t = window.setTimeout(() => {
      const c = cfg.current
      if (!c.loop && Math.round(E.target) >= c.n - 1) goTo(0)
      else step(1)
    }, autoplay)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, active, autoplay])

  // ---- pointer ------------------------------------------------------------------------
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 || !n) return
    if ((e.target as Element).closest("[data-tcc-controls]")) return
    E.drag = { id: e.pointerId, x0: e.clientX, pos0: E.a, moved: false, samples: [{ t: e.timeStamp, x: e.clientX }] }
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const d = E.drag
    if (!d || d.id !== e.pointerId) return
    const dx = e.clientX - d.x0
    if (!d.moved) {
      if (Math.abs(dx) < 6) return
      d.moved = true
      d.x0 = e.clientX
      d.pos0 = E.a
      E.va = 0
      rootRef.current?.setPointerCapture(e.pointerId)
      setDragging(true)
      setStopped(true)
    }
    const c = cfg.current
    const raw = d.pos0 - (e.clientX - d.x0) / E.size
    E.a = c.loop ? raw : rubber(raw, c.n)
    d.samples.push({ t: e.timeStamp, x: e.clientX })
    if (d.samples.length > 6) d.samples.shift()
    const i = indexAt(E.a, c.n, c.loop)
    if (i !== cb.current.active) {
      setActive(i)
      cb.current.onIndexChange?.(i)
    }
    kick()
  }
  const onPointerUp = (e: React.PointerEvent) => {
    const d = E.drag
    if (!d || d.id !== e.pointerId) return
    E.drag = null
    if (!d.moved) return
    setDragging(false)
    E.clickBlock = true
    window.setTimeout(() => {
      E.clickBlock = false
    }, 0)
    const first = d.samples[0]
    const last = d.samples[d.samples.length - 1]
    const ms = Math.max(last.t - first.t, 1)
    // px per ms → slides per second, against the drag direction
    const v = e.type === "pointercancel" ? 0 : (-(last.x - first.x) / ms / E.size) * 1000
    E.va = v
    setTarget(releaseTarget(E.a, v, cfg.current.n, cfg.current.loop))
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    let handled = true
    if (e.key === "ArrowRight" || e.key === "ArrowDown") step(1)
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") step(-1)
    else if (e.key === "Home") goTo(0)
    else if (e.key === "End") goTo(n - 1)
    else handled = false
    if (handled) {
      e.preventDefault()
      setStopped(true)
    }
  }

  const onSlideClick = (i: number) => {
    if (E.clickBlock) return
    setStopped(true)
    if (i === active) onSelect?.(items[i], i)
    else goTo(i)
  }

  const atStart = !loop && active <= 0
  const atEnd = !loop && active >= n - 1
  const manyDots = n > 14
  const current = items[active]

  return (
    <div
      ref={rootRef}
      className={"tcc-root " + className}
      style={{ height, background, color, fontFamily }}
      role="region"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      tabIndex={0}
      data-dragging={dragging ? "" : undefined}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false)
      }}
    >
      <style>{CSS}</style>

      <div
        ref={stageRef}
        className="tcc-stage"
        style={{ width: slideSize, ["--tcc-s" as string]: slideSize, ["--tcc-r" as string]: radius + "px" } as React.CSSProperties}
      >
        {items.map((item, i) => {
          const t = transformFor(i, E.a, E.b)
          const isActive = i === active
          return (
            <button
              key={i}
              ref={(el) => {
                slideRefs.current[i] = el
              }}
              type="button"
              className="tcc-slide"
              data-active={isActive ? "" : undefined}
              tabIndex={isActive ? 0 : -1}
              aria-roledescription="slide"
              aria-label={i + 1 + " of " + n + ": " + item.title}
              aria-current={isActive ? "true" : undefined}
              onClick={() => onSlideClick(i)}
              style={{ transform: t.transform, zIndex: t.zIndex, visibility: t.hidden ? "hidden" : undefined }}
            >
              <span className="tcc-frame">
                {item.src ? (
                  <img
                    src={item.src}
                    alt={item.alt ?? item.title}
                    draggable={false}
                    loading={Math.abs(i - start) > 3 ? "lazy" : undefined}
                    decoding="async"
                    width={600}
                    height={600}
                    style={{ maxWidth: "none" }}
                  />
                ) : (
                  <Scene art={item.art ?? (ARTS[i % ARTS.length] as TiltCascadeArt)} label={item.alt ?? item.title} />
                )}
              </span>
              {titles ? (
                <span className="tcc-title" aria-hidden="true">
                  <span className="tcc-num">{pad(i + 1)}</span>
                  {item.title}
                </span>
              ) : null}
              {captions && item.caption ? (
                <span className="tcc-cap" aria-hidden="true">
                  {item.caption}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>

      {controls && n > 1 ? (
        <div className="tcc-controls" data-tcc-controls="">
          <button type="button" className="tcc-btn" aria-label="Previous slide" disabled={atStart} onClick={() => { setStopped(true); step(-1) }}>
            <Chevron dir={-1} />
          </button>
          <div className="tcc-dots">
            {manyDots ? (
              <span className="tcc-count">
                {pad(active + 1)} / {pad(n)}
              </span>
            ) : (
              items.map((item, i) => (
                <button
                  key={i}
                  type="button"
                  className="tcc-dot"
                  aria-label={"Go to slide " + (i + 1) + ": " + item.title}
                  aria-current={i === active ? "true" : undefined}
                  onClick={() => {
                    setStopped(true)
                    goTo(i)
                  }}
                />
              ))
            )}
          </div>
          <button type="button" className="tcc-btn" aria-label="Next slide" disabled={atEnd} onClick={() => { setStopped(true); step(1) }}>
            <Chevron dir={1} />
          </button>
        </div>
      ) : null}

      <div className="tcc-sr" aria-live="polite" aria-atomic="true">
        {current ? "Slide " + (active + 1) + " of " + n + ": " + current.title : ""}
      </div>
    </div>
  )
}
