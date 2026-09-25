"use client"

import * as React from "react"

/**
 * Glint Portfolio Hero: an anime poster cover that looks back at you.
 *
 * A cream-framed sky poster with one huge headline and a letterboxed close-up
 * underneath: a face behind a pair of glasses, eyes turned away. On a loop
 * they turn toward the screen, the head comes round, and a star glint flashes
 * off the lenses, bursting past the frame while the headline hops letter by
 * letter. Then the gaze drifts off again.
 *
 * Hover and the eyes turn to you and follow the pointer; click to fire the
 * glint on demand. The cat sticker in the corner can be peeled off and dragged
 * anywhere; tap it and it bounces.
 *
 * Everything is SVG built from numbers: the face, the glasses, the sticker,
 * the glint. No images, no fonts to load, React is the only import.
 */

export interface GlintPortfolioHeroProps {
  /** The headline. Letters are laid out to fill the width, so any short word fits. */
  title?: string
  /** Owner name, shown top-left as "<name>'s Portfolio". */
  name?: string
  /** Overrides the whole top-left line. */
  caption?: string
  /** Top-right line. Empty hides it. */
  edition?: string
  /** Sky gradient, top. */
  skyFrom?: string
  /** Sky gradient, bottom. */
  skyTo?: string
  /** The poster's border and the headline fill. */
  paper?: string
  /** Outlines, shadows, lashes. */
  ink?: string
  /** Iris colour. */
  irisColor?: string
  /** Skin colour of the close-up. */
  skinColor?: string
  /** Hair colour. */
  hairColor?: string
  /** Hair clip and the cat's bow tie. */
  accentColor?: string
  /** Seconds per loop: look away, turn, glint, drift back. */
  cycle?: number
  /** Show the draggable cat sticker. */
  sticker?: boolean
  /** Hold the turned-and-glinting pose instead of looping. */
  paused?: boolean
  /** Font stack for the headline. It is stretched to fit, so any heavy face works. */
  fontFamily?: string
  /** Component height. A definite length, never a percentage. */
  height?: string
  /** Extra root class names. */
  className?: string
}

// #region timeline
export type Pt = [number, number]

export const clamp01 = (x: number) => (x <= 0 ? 0 : x > 1 ? 1 : x)

export function smooth(a: number, b: number, x: number) {
  const t = clamp01((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}

/** A soft bump: 0 outside [at - w, at + w], 1 at `at`. */
export function pulse(u: number, at: number, w: number) {
  const x = 1 - Math.abs(u - at) / w
  return x <= 0 ? 0 : x * x * (3 - 2 * x)
}

/** Overshoot ease: the glint bursts a little too big, then settles. */
export function easeOutBack(t: number) {
  const c = 1.9
  const u = clamp01(t) - 1
  return 1 + (c + 1) * u * u * u + c * u * u
}

/** Beat boundaries of one loop, as fractions of `cycle`. */
export const BEATS = {
  turnStart: 0.24, // eyes and head start coming round
  turnEnd: 0.38, // looking straight at the screen
  glintStart: 0.4, // the star bursts off the lenses
  glintPeak: 0.5,
  glintFadeStart: 0.68,
  glintEnd: 0.8,
  backStart: 0.84, // the gaze drifts away again
  backEnd: 0.97,
}

/**
 * Everything the loop does at phase `t` (any number; only the fraction counts).
 * `turn` 0 = looking away, 1 = looking at you. `spark` is the glint's scale.
 */
export function glance(t: number) {
  const b = BEATS
  const u = ((t % 1) + 1) % 1
  const turn = smooth(b.turnStart, b.turnEnd, u) * (1 - smooth(b.backStart, b.backEnd, u))
  const grow = smooth(b.glintStart, b.glintPeak, u)
  const fade = smooth(b.glintFadeStart, b.glintEnd, u)
  const spark = easeOutBack(grow) * (1 - fade)
  const spin = -40 * (1 - grow) + 28 * fade
  const flash = pulse(u, 0.425, 0.03)
  // a lazy blink while looking away, one mid-turn, one after the glint
  const blink = Math.max(pulse(u, 0.12, 0.018), pulse(u, 0.31, 0.02), pulse(u, 0.64, 0.016))
  const swipe = smooth(0.39, 0.52, u) // glare travelling across the lens
  return { u, turn, spark, spin, flash, blink, swipe }
}

/** The headline hops letter by letter as the glint hits, left to right. */
export function letterHop(i: number, n: number, u: number) {
  const at = 0.42 + (i / Math.max(1, n - 1)) * 0.09
  return pulse(u, at, 0.035)
}

/** Relative advance of each headline letter, so I stays narrow and M stays wide. */
export function letterWidths(word: string) {
  return [...word].map((ch) => (/[IJ1!|.,:;'’]/.test(ch) ? 0.42 : /[MW]/.test(ch) ? 1.28 : ch === " " ? 0.45 : 1))
}

/** Lay the headline out across [x0, x1]: [left, width] per letter. */
export function layoutLetters(word: string, x0: number, x1: number, gap = 0.07): Pt[] {
  const w = letterWidths(word)
  const units = w.reduce((a, b) => a + b, 0) + gap * Math.max(0, w.length - 1)
  const k = units > 0 ? (x1 - x0) / units : 0
  const out: Pt[] = []
  let x = x0
  for (const wi of w) {
    out.push([x, wi * k])
    x += (wi + gap) * k
  }
  return out
}

/**
 * A four-point star with long, uneven rays and pinched sides. `tips` go round
 * the centre in order; `waist` is how fat the rays are where they meet.
 */
export function starPath(tips: Pt[], waist: number) {
  const ang = tips.map(([x, y]) => Math.atan2(y, x))
  let s = "M" + tips[0][0].toFixed(1) + " " + tips[0][1].toFixed(1)
  for (let i = 0; i < tips.length; i++) {
    const j = (i + 1) % tips.length
    let a = ang[j] - ang[i]
    while (a < 0) a += Math.PI * 2
    const mid = ang[i] + a / 2
    const w: Pt = [Math.cos(mid) * waist, Math.sin(mid) * waist]
    // tip -> pinched waist -> next tip, each leg bowed inward
    const c0: Pt = [w[0] * 0.35 + tips[i][0] * 0.07, w[1] * 0.35 + tips[i][1] * 0.07]
    const c1: Pt = [w[0] * 0.35 + tips[j][0] * 0.07, w[1] * 0.35 + tips[j][1] * 0.07]
    s += "Q" + c0[0].toFixed(1) + " " + c0[1].toFixed(1) + " " + w[0].toFixed(1) + " " + w[1].toFixed(1)
    s += "Q" + c1[0].toFixed(1) + " " + c1[1].toFixed(1) + " " + tips[j][0].toFixed(1) + " " + tips[j][1].toFixed(1)
  }
  return s + "Z"
}
/** The close-up's size: 1014 x 304 artwork units, however it is framed. */
export const FACE: Pt = [1014, 304]

/**
 * How the poster is framed for a container of this aspect (width / height).
 * Wide: the whole letterbox. Tall (phones): the letterbox grows and the camera
 * pushes in on the near eye, so the close-up fills the screen instead of
 * shrinking to a strip. `toPanel` maps face artwork into the panel's box.
 */
export function frameLayout(aspect: number) {
  const portrait = aspect < 0.85
  const zoom = portrait ? 2.8 : 1
  const h = FACE[1] * zoom
  const focus: Pt = portrait ? [530, 152] : [FACE[0] / 2, FACE[1] / 2]
  const view = portrait ? [60, 28, 1090, 392 + h + 80] : [32, 28, 1136, 787]
  const toPanel = ([x, y]: Pt): Pt => [FACE[0] / 2 + (x - focus[0]) * zoom, h / 2 + (y - focus[1]) * zoom]
  return { portrait, zoom, h, focus, view, toPanel, rays: portrait ? 1.3 : 1 }
}
// #endregion

// ---------------------------------------------------------------- geometry

// Artwork space. The cream border is CSS; this is the sky panel inside it.
const PANEL = { x: 96, y: 420, w: FACE[0] }
const TITLE = { x0: 104, x1: 1110, base: 372, size: 282 }
const LENS_CORNER: Pt = [676, 72] // where the glint strikes, face-local
// the glint's four rays, clockwise from top-right; deliberately uneven
const RAYS: Pt[] = [
  [318, -400],
  [276, 226],
  [-262, 356],
  [-286, -190],
]
const CAT_AT: Pt = [1076, 384]
const EYE_R: Pt = [470, 162] // the eye behind the big lens, panel-local
const EYE_L: Pt = [128, 170] // the one at the edge of frame

const TWINKLES: [number, number, number][] = [
  [212, 128, 0.9],
  [640, 96, 1.4],
  [1004, 150, 0.7],
  [420, 400, 1.1],
  [150, 770, 0.8],
  [1080, 770, 1.3],
]

// ---------------------------------------------------------------- the face

// The upper lid: inner corner, apex, outer corner. The lash and the lid edge
// both follow it, so a lowered lid always meets the lash exactly.
const LID = "M-84 18Q-20 -122 98 -42"
const SCLERA = LID + "C112 28 74 102 0 102C-62 102 -88 62 -84 18Z"

function Eye({
  id,
  cx,
  cy,
  look,
  lid,
  blink,
  squash,
  scale,
  iris,
  ink,
  skin,
}: {
  id: string
  cx: number
  cy: number
  look: Pt
  lid: number
  blink: number
  squash: number
  scale: number
  iris: string
  ink: string
  skin: string
}) {
  const open = 1 - 0.94 * blink
  const ix = look[0] * 30
  const iy = 10 + look[1] * 14
  const shut = clamp01((blink - 0.55) / 0.45)
  return (
    <g transform={"translate(" + cx + " " + cy + ") scale(" + (scale * squash).toFixed(4) + " " + scale + ")"}>
      {/* a shut eye is its own stroke: squashing the open one would flatten the lash too */}
      {shut > 0 ? (
        <g opacity={shut}>
          <path d="M-84 -6Q4 26 100 -10" fill="none" stroke={ink} strokeWidth={11} strokeLinecap="round" />
          <path d="M90 -8Q116 -20 134 -40Q122 -12 102 2Z" fill={ink} />
        </g>
      ) : null}
      <g transform={"scale(1 " + open.toFixed(4) + ") translate(0 -40)"} opacity={1 - shut}>
        <clipPath id={id}>
          <path d={SCLERA} />
        </clipPath>
        <path d={SCLERA} fill="#fdf4e2" />
        <g clipPath={"url(#" + id + ")"}>
          <g transform={"translate(" + ix.toFixed(2) + " " + iy.toFixed(2) + ")"}>
            <ellipse rx={50} ry={74} fill={iris} />
            <ellipse rx={50} ry={74} fill="none" stroke={ink} strokeWidth={3} opacity={0.7} />
            <ellipse cx={2} cy={4} rx={19} ry={46} fill="#fdf0da" />
            <ellipse cx={-22} cy={-34} rx={8} ry={11} fill="#fff" opacity={0.85} />
          </g>
          {/* the shade the lid casts, then the lid itself when it droops */}
          <path d={LID} fill="none" stroke="#5a2f45" strokeWidth={40} opacity={0.32} transform={"translate(0 " + (lid + 12) + ")"} />
          <path d={LID + "L98 -220L-84 -220Z"} fill={skin} transform={"translate(0 " + lid + ")"} />
        </g>
        <path d="M-58 84Q0 112 62 88" fill="none" stroke={ink} strokeWidth={3} strokeLinecap="round" opacity={0.75} />
        <g transform={"translate(0 " + lid + ")"}>
          <path d={LID} fill="none" stroke={ink} strokeWidth={13} strokeLinecap="round" />
          {/* the flick at the outer corner */}
          <path d="M86 -48Q112 -62 132 -86Q118 -52 100 -30Z" fill={ink} />
        </g>
        <path
          d="M-56 -78Q10 -132 88 -84"
          fill="none"
          stroke={ink}
          strokeWidth={2.5}
          strokeLinecap="round"
          opacity={0.6}
          transform={"translate(0 " + (lid * 0.35).toFixed(2) + ")"}
        />
      </g>
    </g>
  )
}

/** The hair and far side of the head: static shapes, moved as layers. */
const HairFront = React.memo(function HairFront({ hair }: { hair: string }) {
  return (
    <g>
      {/* strands falling in at the left edge */}
      <path d="M-60 -20H70C48 60 30 150 44 330H-60Z" fill={hair} />
      <path d="M44 330C30 190 56 90 118 -20H150C92 80 70 190 88 330Z" fill={hair} opacity={0.92} />
      {/* bangs catching the light, top left */}
      <path d="M118 -20H236C196 16 164 40 138 84C140 44 132 14 118 -20Z" fill="#e2acc9" />
      <path d="M138 84C164 40 196 16 236 -20H258C214 18 176 46 138 84Z" fill={hair} opacity={0.4} />
    </g>
  )
})

const FarSide = React.memo(function FarSide({ hair, skin, ink, accent }: { hair: string; skin: string; ink: string; accent: string }) {
  return (
    <g>
      {/* hair behind the bridge of the glasses */}
      <path d="M704 -20H772C766 30 748 70 716 96C730 56 724 18 704 -20Z" fill={hair} />
      {/* the ear, pink on pink, with its inner fold */}
      <path d="M800 -20C880 30 910 120 880 220C860 290 800 320 780 330H1000V-20Z" fill={skin} />
      <path d="M800 -20C880 30 910 120 880 220C860 290 800 320 780 330" fill="none" stroke="#e79ab8" strokeWidth={10} opacity={0.7} />
      <path
        d="M836 60C876 92 884 160 860 214C846 244 822 262 804 270"
        fill="none"
        stroke="#e693b3"
        strokeWidth={18}
        strokeLinecap="round"
        opacity={0.75}
      />
      <path d="M836 60C876 92 884 160 860 214" fill="none" stroke={ink} strokeWidth={2.2} opacity={0.4} strokeLinecap="round" />
      {/* the hair clip */}
      <g transform="translate(900 92) rotate(-14)">
        <rect x={-58} y={-24} width={124} height={48} rx={6} fill={accent} />
        <rect x={-58} y={-24} width={124} height={12} fill="#fff" opacity={0.18} />
      </g>
      {/* the hair beyond, with a soft rim of light */}
      <path d="M960 -20C920 60 930 200 990 330H1100V-20Z" fill={hair} />
      <path d="M960 -20C920 60 930 200 990 330" fill="none" stroke="#7b2d4b" strokeWidth={5} opacity={0.6} />
    </g>
  )
})

function Glasses({ ink, id, swipe, flash }: { ink: string; id: string; swipe: number; flash: number }) {
  const lens = "M306 34C420 14 590 18 650 44C686 62 682 196 648 250C610 300 380 300 312 266C262 240 250 60 306 34Z"
  const clip = id + "-lens"
  const sx = -260 + swipe * 760
  return (
    <g>
      <clipPath id={clip}>
        <path d={lens} />
      </clipPath>
      <path d={lens} fill="#ffffff" opacity={0.1} />
      <g clipPath={"url(#" + clip + ")"} opacity={swipe > 0 && swipe < 1 ? 1 : 0}>
        <path d={"M" + sx + " 330L" + (sx + 150) + " -20L" + (sx + 240) + " -20L" + (sx + 90) + " 330Z"} fill="#fff" opacity={0.55} />
        <path
          d={"M" + (sx + 120) + " 330L" + (sx + 270) + " -20L" + (sx + 296) + " -20L" + (sx + 146) + " 330Z"}
          fill="#fff"
          opacity={0.4}
        />
      </g>
      <path d={lens} fill="#fff" opacity={flash * 0.35} />
      {/* faint reflection lines that are always there */}
      <path
        d="M580 40Q640 90 636 170M300 80Q286 160 318 236"
        fill="none"
        stroke="#fff"
        strokeWidth={4}
        opacity={0.45}
        strokeLinecap="round"
      />
      <path d={lens} fill="none" stroke={ink} strokeWidth={4.5} />
      {/* the other lens, cut by the frame edge, and the bridge */}
      <path d="M-40 36C60 20 170 34 196 70C216 110 214 220 184 262C150 300 20 300 -40 282" fill="none" stroke={ink} strokeWidth={4.5} />
      <path d="M200 118C226 100 258 100 282 114" fill="none" stroke={ink} strokeWidth={5} strokeLinecap="round" />
      {/* the arm, going back over the ear */}
      <path d="M660 70L800 58L920 96" fill="none" stroke={ink} strokeWidth={13} strokeLinejoin="round" />
    </g>
  )
}

// ---------------------------------------------------------------- the sticker

function Cat({ ink, accent, wave, squint, lift }: { ink: string; accent: string; wave: number; squint: number; lift: number }) {
  const head = "M-46 -8L-54 -66L-18 -40Q0 -46 18 -40L54 -66L46 -8Q52 32 0 38Q-52 32 -46 -8Z"
  const pawR = "M40 20C54 4 76 8 78 26C80 42 62 52 48 44Z"
  const pawL = "M-44 30C-64 22 -80 34 -74 50C-68 64 -48 60 -40 50Z"
  const eyeRy = 9 * (1 - 0.85 * squint)
  const art = (
    <>
      <path d="M22 18C60 10 96 34 92 64C70 56 44 58 24 50Z" fill="#3563d6" />
      <path d={head} />
      <g transform={"rotate(" + wave.toFixed(2) + " 46 30)"}>
        <path d={pawR} />
      </g>
      <path d={pawL} />
      <path d="M-16 34L-30 26L-30 50L-16 42L0 46L16 42L30 50L30 26L16 34Z" />
    </>
  )
  return (
    <g transform={"translate(0 " + lift.toFixed(2) + ")"}>
      {/* the white die-cut border and its shadow */}
      <g fill="#fff" stroke="#fff" strokeWidth={16} strokeLinejoin="round" filter="drop-shadow(0 6px 5px rgba(20,8,12,0.28))">
        {art}
      </g>
      <path d="M22 18C60 10 96 34 92 64C70 56 44 58 24 50Z" fill="#3563d6" stroke={ink} strokeWidth={2.5} />
      <path d={head} fill="#fff" stroke={ink} strokeWidth={2.5} strokeLinejoin="round" />
      {/* pink tuft between the ears */}
      <path
        d="M-40 -20C-40 -52 -20 -60 -6 -44C0 -64 26 -60 30 -40C44 -44 48 -28 40 -18C20 -30 -20 -30 -40 -20Z"
        fill="#e24a86"
        stroke={ink}
        strokeWidth={2}
      />
      <path d="M-44 -46L-38 -18M44 -46L38 -18" stroke="#f6a5c4" strokeWidth={5} strokeLinecap="round" />
      {[-18, 18].map((x) => (
        <g key={x}>
          <ellipse cx={x} cy={2} rx={10} ry={eyeRy} fill="#f24b5a" stroke={ink} strokeWidth={2} />
          <ellipse cx={x + 1} cy={2} rx={2.2} ry={eyeRy * 0.8} fill={ink} />
          <path
            d={"M" + (x - 12) + " " + (x < 0 ? -18 : -10) + "L" + (x + 12) + " " + (x < 0 ? -10 : -18)}
            stroke={ink}
            strokeWidth={3}
            strokeLinecap="round"
          />
        </g>
      ))}
      <path d="M-4 14L4 14L0 19Z" fill="#f2849e" />
      <path d="M0 19Q-6 26 -11 22M0 19Q6 26 11 22" fill="none" stroke={ink} strokeWidth={2} strokeLinecap="round" />
      <path d="M-24 16L-86 8M-24 22L-90 26M24 16L96 6M24 22L100 26" stroke={ink} strokeWidth={1.8} strokeLinecap="round" />
      <path
        d="M-16 34L-30 26L-30 50L-16 42L0 46L16 42L30 50L30 26L16 34Z"
        fill={accent}
        stroke={ink}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <circle cx={0} cy={38} r={5} fill={accent} stroke={ink} strokeWidth={2} />
      <g transform={"rotate(" + wave.toFixed(2) + " 46 30)"}>
        <path d={pawR} fill="#fff" stroke={ink} strokeWidth={2.5} />
        <path d="M60 10L58 20M70 14L66 24" stroke={ink} strokeWidth={1.8} strokeLinecap="round" />
      </g>
      <path d={pawL} fill="#fff" stroke={ink} strokeWidth={2.5} />
      <path d="M-62 34L-58 44M-70 42L-62 50" stroke={ink} strokeWidth={1.8} strokeLinecap="round" />
    </g>
  )
}

// ---------------------------------------------------------------- component

function usePrefersReducedMotion() {
  const [reduced, setReduced] = React.useState(false)
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReduced(mq.matches)
    const h = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener("change", h)
    return () => mq.removeEventListener("change", h)
  }, [])
  return reduced
}

type Frame = {
  time: number
  u: number
  turn: number
  look: Pt
  hops: number[]
  catLift: number
  catSquint: number
}

const STILL = 0.56 // the pose held when paused or with reduced motion

export default function GlintPortfolioHero({
  title = "PORTFOLIO",
  name = "Rin Aoki",
  caption,
  edition = "2026 ver.",
  skyFrom = "#3a7ff6",
  skyTo = "#eceee2",
  paper = "#f7f2e1",
  ink = "#1a0a10",
  irisColor = "#ef3d2b",
  skinColor = "#f8c6d8",
  hairColor = "#2b0a16",
  accentColor = "#ee3b2a",
  cycle = 7,
  sticker = true,
  paused = false,
  fontFamily = '"Bebas Neue", "Anton", "Oswald", Impact, "Haettenschweiler", "Arial Narrow", "Arial Black", sans-serif',
  height = "100svh",
  className = "",
}: GlintPortfolioHeroProps) {
  const rootRef = React.useRef<HTMLDivElement | null>(null)
  const svgRef = React.useRef<SVGSVGElement | null>(null)
  const reduced = usePrefersReducedMotion()
  const id = "gph" + React.useId().replace(/[^a-zA-Z0-9]/g, "")
  const letters = React.useMemo(() => layoutLetters(title, TITLE.x0, TITLE.x1), [title])
  const glyphs = React.useMemo(() => [...title], [title])

  const [f, setF] = React.useState<Frame>({
    time: 0,
    u: STILL,
    turn: 1,
    look: [0.05, 0.05],
    hops: glyphs.map(() => 0),
    catLift: 0,
    catSquint: 0,
  })
  const [cat, setCat] = React.useState<Pt>([0, 0])
  const [grabbing, setGrabbing] = React.useState(false)

  const [aspect, setAspect] = React.useState(1.4)
  const L = React.useMemo(() => frameLayout(aspect), [aspect])
  const eyeAt = L.toPanel(EYE_R)
  const eye: Pt = [PANEL.x + eyeAt[0], PANEL.y + eyeAt[1]]
  const glintAt = L.toPanel(LENS_CORNER)
  const GLINT: Pt = [PANEL.x + glintAt[0], PANEL.y + glintAt[1]]
  const [vx, vy, vw, vh] = L.view
  const CAT: Pt = L.portrait ? [1030, 372] : CAT_AT

  const cfg = React.useRef({ cycle, still: paused || reduced, n: glyphs.length, eye })
  cfg.current = { cycle, still: paused || reduced, n: glyphs.length, eye }
  const pointer = React.useRef<Pt | null>(null) // artwork coordinates
  const kick = React.useRef(false) // click: fire the glint now
  const boopAt = React.useRef(-1e9)
  const drag = React.useRef<{ from: Pt; start: Pt; moved: boolean } | null>(null)

  const toArt = React.useCallback((clientX: number, clientY: number): Pt | null => {
    const svg = svgRef.current
    const m = svg?.getScreenCTM()
    if (!svg || !m) return null
    const p = new DOMPoint(clientX, clientY).matrixTransform(m.inverse())
    return [p.x, p.y]
  }, [])

  React.useEffect(() => {
    const box = svgRef.current?.parentElement
    if (!box) return
    const ro = new ResizeObserver(() => {
      if (box.clientHeight > 0) setAspect(box.clientWidth / box.clientHeight)
    })
    ro.observe(box)
    return () => ro.disconnect()
  }, [])

  React.useEffect(() => {
    const root = rootRef.current
    if (!root) return
    let raf = 0
    let visible = true
    let prev = 0
    let time = 0
    let u = 0.05
    let turn = 0
    let look: Pt = [-1, -0.2]
    let hops: number[] = []

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      if (visible && !raf) {
        prev = 0
        raf = requestAnimationFrame(tick)
      }
    })
    io.observe(root)

    function tick(now: number) {
      raf = 0
      if (!visible) return
      const c = cfg.current
      const dt = prev ? Math.min(0.05, (now - prev) / 1000) : 0
      prev = now
      time += dt
      const hovering = pointer.current !== null

      if (c.still) {
        u = STILL
      } else {
        if (kick.current) {
          kick.current = false
          u = BEATS.turnEnd
        }
        if (hovering) {
          // noticed: come round fast, glint, then hold the gaze while you stay
          if (u < BEATS.turnStart || u >= BEATS.backStart) u = BEATS.turnEnd
          u = Math.min(BEATS.backStart - 0.001, u + (dt / c.cycle) * (u < BEATS.turnEnd ? 2.5 : 1))
        } else {
          u = (u + dt / c.cycle) % 1
        }
      }
      const g = glance(u)

      const k = 1 - Math.exp(-dt * 9)
      turn = c.still ? 1 : turn + (g.turn - turn) * k
      let want: Pt = [-1 + 1.05 * turn, -0.2 + 0.25 * turn]
      const p = pointer.current
      if (p && !c.still) {
        const [ex, ey] = c.eye
        const at: Pt = [Math.max(-1, Math.min(1, (p[0] - ex) / 420)), Math.max(-1, Math.min(1, (p[1] - ey) / 260))]
        want = [want[0] + (at[0] - want[0]) * turn, want[1] + (at[1] - want[1]) * turn]
      }
      look = c.still && !p ? [0.05, 0.05] : [look[0] + (want[0] - look[0]) * k * 1.4, look[1] + (want[1] - look[1]) * k * 1.4]

      // the headline: a wave with the glint, plus a lift near the pointer
      if (hops.length !== c.n) hops = Array.from({ length: c.n }, () => 0)
      hops = hops.map((h, i) => {
        let lift = c.still ? 0 : letterHop(i, c.n, u)
        if (p && p[1] > 120 && p[1] < 400) {
          const [lx, lw] = letters[i] ?? [0, 0]
          lift = Math.max(lift, 0.55 * clamp01(1 - Math.abs(p[0] - (lx + lw / 2)) / 150))
        }
        return h + (lift - h) * Math.min(1, k * 2.2)
      })

      const boop = clamp01(1 - (now - boopAt.current) / 700)
      const catLift = c.still ? 0 : -18 * pulse(u, 0.45, 0.05) - 22 * Math.sin(Math.PI * Math.min(1, boop * 1.4)) * boop

      setF({ time, u, turn, look, hops, catLift, catSquint: Math.max(boop, c.still ? 0 : pulse(u, 0.44, 0.04)) })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
    }
  }, [letters])

  const still = paused || reduced
  const g = glance(f.u)
  const turn = f.turn
  const blink = still ? 0 : g.blink
  // head coming round: the near side slides a little, the far side a lot
  const near = (-38 * (1 - turn)).toFixed(2)
  const far = (-78 * (1 - turn)).toFixed(2)
  const hairShift = (-16 * (1 - turn)).toFixed(2)
  const lid = 34 * (1 - turn) // a bored, heavy lid while looking away
  const squash = 0.9 + 0.1 * turn
  const zoom = 1 + 0.035 * turn + (still ? 0 : 0.02 * g.flash)
  const spark = g.spark
  const tips = RAYS.map(([x, y]) => [x * spark * L.rays, y * spark * L.rays] as Pt)
  // the paw waves for a moment every few seconds
  const wavePhase = f.time % 4.2
  const wave = still ? 0 : wavePhase < 1.3 ? Math.sin(wavePhase * 14) * 16 * Math.sin((Math.PI * wavePhase) / 1.3) : 0
  const line = caption ?? (name ? name + "’s Portfolio" : "")

  const endDrag = (e: React.PointerEvent) => {
    const d = drag.current
    drag.current = null
    setGrabbing(false)
    if (d && !d.moved) boopAt.current = performance.now()
    if ((e.target as Element).hasPointerCapture?.(e.pointerId)) (e.target as Element).releasePointerCapture(e.pointerId)
  }

  return (
    <div
      ref={rootRef}
      className={"relative w-full overflow-hidden " + className}
      style={{ height, boxSizing: "border-box", background: paper, padding: "clamp(10px, 2.6vmin, 30px)" }}
    >
      <div
        className="relative w-full overflow-hidden"
        style={{ height: "100%", background: "linear-gradient(180deg, " + skyFrom + " 0%, " + skyTo + " 100%)" }}
      >
        <svg
          ref={svgRef}
          viewBox={vx + " " + vy + " " + vw + " " + vh}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          tabIndex={0}
          aria-label={
            (line ? line + ". " : "") +
            title +
            ". A close-up of a face in glasses that turns to look at you as a glint flashes off the lenses."
          }
          className="outline-none focus-visible:outline-2 focus-visible:outline-offset-[-4px]"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            maxWidth: "none",
            display: "block",
            cursor: grabbing ? "grabbing" : "pointer",
            touchAction: "manipulation",
            outlineColor: ink,
          }}
          onPointerMove={(e) => {
            const p = toArt(e.clientX, e.clientY)
            if (e.pointerType !== "touch") pointer.current = p
            const d = drag.current
            if (d && p) {
              const dx = p[0] - d.from[0]
              const dy = p[1] - d.from[1]
              if (Math.hypot(dx, dy) > 4) d.moved = true
              setCat([
                Math.max(vx - CAT[0] + 60, Math.min(vx + vw - CAT[0] - 60, d.start[0] + dx)),
                Math.max(vy - CAT[1] + 60, Math.min(vy + vh - CAT[1] - 60, d.start[1] + dy)),
              ])
            }
          }}
          onPointerLeave={() => (pointer.current = null)}
          onPointerDown={(e) => {
            if (!drag.current) kick.current = true
            if (e.pointerType === "touch") pointer.current = null
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              kick.current = true
            }
          }}
        >
          <defs>
            <clipPath id={id + "-panel"}>
              <rect width={PANEL.w} height={L.h} />
            </clipPath>
            <linearGradient id={id + "-skin"} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor={skinColor} />
              <stop offset="1" stopColor="#f3a9c4" />
            </linearGradient>
            <radialGradient id={id + "-blush"}>
              <stop offset="0" stopColor="#ff6f8a" stopOpacity={0.55} />
              <stop offset="1" stopColor="#ff6f8a" stopOpacity={0} />
            </radialGradient>
            <radialGradient id={id + "-bloom"}>
              <stop offset="0" stopColor="#fffbea" stopOpacity={0.95} />
              <stop offset="0.35" stopColor="#fff3cf" stopOpacity={0.45} />
              <stop offset="1" stopColor="#fff3cf" stopOpacity={0} />
            </radialGradient>
          </defs>

          {/* sky twinkles */}
          <g fill={paper}>
            {TWINKLES.map(([x, y, s], i) => {
              const tw = still ? 0.5 : 0.5 + 0.5 * Math.sin(f.time * (1.3 + i * 0.37) + i * 2.1)
              const r = 7 * s * (0.4 + 0.6 * tw)
              return (
                <path
                  key={i}
                  d={starPath(
                    [
                      [r, -r * 1.6],
                      [r * 1.6, r],
                      [-r, r * 1.6],
                      [-r * 1.6, -r],
                    ].map(([a, b]) => [a * 0.7, b * 0.7] as Pt),
                    r * 0.14,
                  )}
                  transform={"translate(" + x + " " + y + ") rotate(45)"}
                  opacity={0.35 + 0.5 * tw}
                />
              )
            })}
          </g>

          {/* top lines */}
          <g
            style={{
              font: "italic 500 " + (L.portrait ? 34 : 21) + 'px "Helvetica Neue", Helvetica, Arial, sans-serif',
              letterSpacing: "0.01em",
            }}
            fill={paper}
          >
            {line ? (
              <text x={TITLE.x0} y={78}>
                {line}
              </text>
            ) : null}
            {edition ? (
              <text x={TITLE.x1} y={78} textAnchor="end">
                {edition}
              </text>
            ) : null}
          </g>

          {/* the headline: a hard ink shadow under each cream letter */}
          <g style={{ fontFamily, fontSize: TITLE.size, fontWeight: 900 }}>
            {glyphs.map((ch, i) => {
              const [x, w] = letters[i]
              const hop = (f.hops[i] ?? 0) * -26
              return ch === " " ? null : (
                <g key={i} transform={"translate(0 " + hop.toFixed(2) + ")"}>
                  <text
                    x={x - 9}
                    y={TITLE.base + 9 - hop * 0.3}
                    textLength={w}
                    lengthAdjust="spacingAndGlyphs"
                    fill={ink}
                    stroke={ink}
                    strokeWidth={4}
                  >
                    {ch}
                  </text>
                  <text
                    x={x}
                    y={TITLE.base}
                    textLength={w}
                    lengthAdjust="spacingAndGlyphs"
                    fill={paper}
                    stroke={ink}
                    strokeWidth={3.5}
                    strokeLinejoin="round"
                    style={{ paintOrder: "stroke" }}
                  >
                    {ch}
                  </text>
                </g>
              )
            })}
          </g>

          {/* the letterboxed close-up */}
          <g transform={"translate(" + PANEL.x + " " + PANEL.y + ")"}>
            <g clipPath={"url(#" + id + "-panel)"}>
              <g
                transform={
                  "translate(" + FACE[0] / 2 + " " + L.h / 2 + ") scale(" + L.zoom + ") translate(" + -L.focus[0] + " " + -L.focus[1] + ")"
                }
              >
                {/* a slow push-in as they turn to camera */}
                <g
                  transform={
                    "translate(" +
                    EYE_R[0] +
                    " " +
                    EYE_R[1] +
                    ") scale(" +
                    zoom.toFixed(4) +
                    ") translate(" +
                    -EYE_R[0] +
                    " " +
                    -EYE_R[1] +
                    ")"
                  }
                >
                  <rect x={-10} y={-10} width={FACE[0] + 20} height={FACE[1] + 20} fill={"url(#" + id + "-skin)"} />
                  <ellipse cx={560} cy={290} rx={200} ry={70} fill={"url(#" + id + "-blush)"} />
                  <ellipse cx={170} cy={300} rx={140} ry={60} fill={"url(#" + id + "-blush)"} />
                  <ellipse cx={420} cy={20} rx={260} ry={60} fill="#fff" opacity={0.18} />

                  <g transform={"translate(" + far + " 0)"}>
                    <FarSide hair={hairColor} skin={skinColor} ink={ink} accent={accentColor} />
                  </g>
                  <g transform={"translate(" + near + " 0)"}>
                    <path d="M742 250Q760 268 746 286" fill="none" stroke={ink} strokeWidth={2.5} strokeLinecap="round" opacity={0.5} />
                    <Eye
                      id={id + "-el"}
                      cx={EYE_L[0]}
                      cy={EYE_L[1]}
                      look={f.look}
                      lid={lid}
                      blink={blink}
                      squash={squash}
                      scale={0.9}
                      iris={irisColor}
                      ink={ink}
                      skin={skinColor}
                    />
                    <Eye
                      id={id + "-er"}
                      cx={EYE_R[0]}
                      cy={EYE_R[1]}
                      look={f.look}
                      lid={lid}
                      blink={blink}
                      squash={squash}
                      scale={1}
                      iris={irisColor}
                      ink={ink}
                      skin={skinColor}
                    />
                    <Glasses ink={ink} id={id} swipe={still ? 0 : g.swipe} flash={still ? 0 : g.flash} />
                  </g>
                  <g transform={"translate(" + hairShift + " 0)"}>
                    <HairFront hair={hairColor} />
                  </g>
                </g>
              </g>
              <rect width={PANEL.w} height={L.h} fill="#fffbea" opacity={still ? 0 : g.flash * 0.3} />
            </g>
            <rect width={PANEL.w} height={L.h} fill="none" stroke={ink} strokeWidth={3} />
          </g>

          {/* the glint */}
          {spark > 0.001 ? (
            <g transform={"translate(" + GLINT[0] + " " + GLINT[1] + ")"} className="pointer-events-none">
              <circle r={190 * Math.min(1.2, spark)} fill={"url(#" + id + "-bloom)"} />
              <g transform={"rotate(" + g.spin.toFixed(2) + ")"}>
                <path
                  d={starPath(tips, 30 * Math.min(1, spark))}
                  fill={paper}
                  stroke={ink}
                  strokeWidth={2.2}
                  strokeLinejoin="miter"
                  strokeMiterlimit={40}
                />
              </g>
              {/* little sparks thrown off the burst */}
              {[
                [-150, -110, 0.0],
                [180, 40, 0.05],
                [-70, 150, 0.1],
              ].map(([x, y, delay], i) => {
                const s = pulse(f.u, BEATS.glintPeak + delay, 0.08) * 22
                return s > 0.3 ? (
                  <path
                    key={i}
                    d={starPath(
                      [
                        [s * 0.6, -s],
                        [s, s * 0.6],
                        [-s * 0.6, s],
                        [-s, -s * 0.6],
                      ],
                      s * 0.12,
                    )}
                    transform={"translate(" + x + " " + y + ")"}
                    fill={paper}
                    stroke={ink}
                    strokeWidth={1.5}
                  />
                ) : null
              })}
            </g>
          ) : null}

          {/* the cat sticker: peel it off and put it anywhere */}
          {sticker ? (
            <g
              transform={
                "translate(" +
                (CAT[0] + cat[0]).toFixed(1) +
                " " +
                (CAT[1] + cat[1]).toFixed(1) +
                ") rotate(" +
                (grabbing ? -2 : -9) +
                ") scale(" +
                (grabbing ? 1.1 : 1) +
                ")"
              }
              style={{ cursor: grabbing ? "grabbing" : "grab" }}
              onPointerDown={(e) => {
                e.stopPropagation()
                const p = toArt(e.clientX, e.clientY)
                if (!p) return
                ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
                drag.current = { from: p, start: cat, moved: false }
                setGrabbing(true)
              }}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
            >
              <Cat ink={ink} accent={accentColor} wave={wave} squint={f.catSquint} lift={f.catLift} />
            </g>
          ) : null}
        </svg>
      </div>
    </div>
  )
}
