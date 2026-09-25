"use client"

import * as React from "react"

/**
 * Tiger Tear Reveal: a poster word that rips open as you scroll.
 *
 * The page starts as a plain slogan: a small tagline over one huge red word.
 * Scroll, and a crack runs across the word, the paper tears open along a
 * jagged diagonal with its edges curling back, and a tiger's eyes push through
 * the hole. Once they are out they follow your pointer and blink; click them
 * and they squint at you.
 *
 * Everything is SVG built from numbers: the fur, the stripes, the irises, the
 * torn paper. No images, no fonts to load, React is the only import.
 */

export interface TigerTearRevealProps {
  /** The big word that gets torn. */
  word?: string
  /** Small line above the word. Empty hides it. */
  tagline?: string
  /** Word colour. */
  ink?: string
  /** Paper colour, the page behind everything. */
  paper?: string
  /** Tagline colour. */
  taglineColor?: string
  /** Iris colour. */
  eyeColor?: string
  /** Fur colour. */
  furColor?: string
  /** Font stack for the word. It is stretched to a fixed width, so any bold face fits. */
  fontFamily?: string
  /** Height of the pinned stage. A definite length, never a percentage. */
  height?: string
  /** Extra scroll distance the tear plays over, on top of `height`. */
  scrollDistance?: string
  /** 0..1. Drive the tear yourself instead of from scroll (1 = fully torn). */
  progress?: number
  /** Show the "scroll" hint before the tear starts. */
  hint?: boolean
  /** Extra root class names. */
  className?: string
}

// #region tear
export type Pt = [number, number]

/** Seeded PRNG (mulberry32), so the tear and the fur are the same every visit. */
export function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const clamp01 = (x: number) => (x <= 0 ? 0 : x > 1 ? 1 : x)

export function smooth(a: number, b: number, x: number) {
  const t = clamp01((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}

/** Overshoot ease: the eyes arrive a little too far, then settle. */
export function easeOutBack(t: number) {
  const c = 1.70158
  const u = clamp01(t) - 1
  return 1 + (c + 1) * u * u * u + c * u * u
}

/** How far through the pinned scroll we are: 0 at the top, 1 when the stage lets go. */
export function scrollProgress(top: number, height: number, viewport: number) {
  const range = height - viewport
  if (range <= 0) return top <= 0 ? 1 : 0
  return clamp01(-top / range)
}

/** One scroll value drives four beats. */
export function stages(p: number) {
  return {
    crack: smooth(0.04, 0.24, p), // a hairline runs across the word
    open: smooth(0.2, 0.68, p), // the paper rips apart
    pop: smooth(0.5, 0.86, p), // the eyes push through
    shake: smooth(0.18, 0.26, p) * (1 - smooth(0.3, 0.4, p)), // the jolt of the rip
  }
}

/** Opening along the tear: closed at both ends, widest a little right of centre. */
export function profile(t: number) {
  if (t <= 0 || t >= 1) return 0 // sin(PI) is not exactly 0 in floating point
  return Math.pow(Math.sin(Math.PI * clamp01(t)), 0.55) * (0.74 + 0.38 * t)
}

/**
 * The two torn edges, in axis space (u along the tear, v across it, y down).
 * top is always at or above 0 and bottom at or below it, so at open = 0 they
 * meet and the hole has no area. `curl` is how much paper rolls back per point.
 */
export function tearEdges(open: number, len: number, half: number, seed = 11, n = 64) {
  const r = rng(seed)
  const top: Pt[] = []
  const bottom: Pt[] = []
  const curlTop: number[] = []
  const curlBottom: number[] = []
  const jag = 5 * Math.min(1, open * 3)
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const u = (t - 0.5) * len
    const tooth = () => {
      const v = (r() - 0.5) * 2
      return r() < 0.12 ? v * 2.6 : v
    }
    const jt = tooth()
    const jb = tooth()
    // slow wander, so the edge reads as ripped paper rather than a saw
    const wob = Math.sin(t * 13.3 + seed) * 1.6 + Math.sin(t * 4.1) * 2.2
    const w = open * half * profile(t)
    const vt = -Math.max(0, w + jag * (jt + wob * 0.6) * Math.min(1, profile(t) * 3))
    const vb = Math.max(0, w + jag * (jb - wob * 0.4) * Math.min(1, profile(t) * 3))
    top.push([u, vt])
    bottom.push([u, vb])
    // the paper rolls back in a few broad curls, not per-tooth
    const curl = (ph: number) => Math.max(0, 0.55 + 0.55 * Math.sin(t * 8.5 + ph) + 0.25 * Math.sin(t * 21 + ph * 2))
    const roll = open * 34 * profile(t)
    curlTop.push(Math.min(-vt * 0.42, roll * curl(seed)))
    curlBottom.push(Math.min(vb * 0.42, roll * curl(seed + 2.3)))
  }
  return { top, bottom, curlTop, curlBottom }
}

/** Area of a closed polygon (shoelace). */
export function area(pts: Pt[]) {
  let s = 0
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i]
    const [x2, y2] = pts[(i + 1) % pts.length]
    s += x1 * y2 - x2 * y1
  }
  return Math.abs(s) / 2
}
// #endregion

// ---------------------------------------------------------------- geometry

const VIEW_W = 1000
const VIEW_H = 520
// the visible frame: cropped to the artwork so it fills small screens
const FRAME = "36 92 928 380"
const AXIS = { cx: 492, cy: 318, angle: -12, len: 560, half: 124 }
const EYES: Pt[] = [
  [-138, 6],
  [138, -4],
]

const d = (pts: Pt[], close = true) =>
  "M" + pts.map(([x, y]) => x.toFixed(1) + " " + y.toFixed(1)).join("L") + (close ? "Z" : "")

/** A stripe: a quadratic spine with a width that tapers to points at both ends. */
function stripe(p0: Pt, p1: Pt, p2: Pt, w: number, n = 18) {
  const left: Pt[] = []
  const right: Pt[] = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const m = 1 - t
    const x = m * m * p0[0] + 2 * m * t * p1[0] + t * t * p2[0]
    const y = m * m * p0[1] + 2 * m * t * p1[1] + t * t * p2[1]
    const dx = 2 * m * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0])
    const dy = 2 * m * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1])
    const l = Math.hypot(dx, dy) || 1
    const h = (w / 2) * Math.pow(Math.sin(Math.PI * t), 0.6)
    left.push([x - (dy / l) * h, y + (dx / l) * h])
    right.push([x + (dy / l) * h, y - (dx / l) * h])
  }
  return d(left.concat(right.reverse()))
}

/** The whole face's stripes, as one path. Deterministic. */
function buildStripes() {
  const r = rng(29)
  const j = (a: number) => (r() - 0.5) * a
  const out: string[] = []
  // forehead: a fan of short stripes converging above the nose
  for (const k of [-2, -1, 0, 1, 2]) {
    out.push(stripe([k * 27 + j(8), -205], [k * 21 + j(6), -140], [k * 11, -72 + Math.abs(k) * 10], 13 - Math.abs(k) * 2))
  }
  for (const s of [-1, 1]) {
    // brow arcs over the white patches
    out.push(stripe([s * 50, -108], [s * 138, -140 + j(8)], [s * 228, -96], 13))
    out.push(stripe([s * 72, -158], [s * 150, -188 + j(8)], [s * 250, -150], 11))
    // cheek bars reaching in from the sides
    for (const y of [-160, -104, -48, 14, 76, 138]) {
      out.push(stripe([s * 350, y + j(10)], [s * 292, y + j(26)], [s * (222 + r() * 30), y + j(34)], 18 + r() * 8))
    }
    // under-eye streaks
    out.push(stripe([s * 212, 38], [s * 256, 72], [s * 330, 98], 14))
    out.push(stripe([s * 182, 74], [s * 226, 120], [s * 312, 156], 12))
    // sides of the nose
    out.push(stripe([s * 64, 22], [s * 50, 88], [s * 42, 178], 8))
  }
  return out.join("")
}

/** Short hairs that flow outward from the nose, in three tones. */
function buildHairs() {
  const r = rng(53)
  const tones = ["", "", ""]
  for (let i = 0; i < 1300; i++) {
    const x = (r() - 0.5) * 720
    const y = (r() - 0.5) * 420
    const a = Math.atan2(y - 150, x) + (r() - 0.5) * 0.5
    const l = 9 + r() * 12
    const seg = "M" + x.toFixed(1) + " " + y.toFixed(1) + "l" + (Math.cos(a) * l).toFixed(1) + " " + (Math.sin(a) * l).toFixed(1)
    tones[r() < 0.45 ? 0 : r() < 0.7 ? 1 : 2] += seg
  }
  return tones
}

/** Fine radial fibres in an iris. */
function buildFibres() {
  const r = rng(71)
  let s = ""
  for (let i = 0; i < 56; i++) {
    const a = (i / 56) * Math.PI * 2 + r() * 0.08
    const r0 = 12 + r() * 4
    const r1 = 30 + r() * 5
    s += "M" + (Math.cos(a) * r0).toFixed(1) + " " + (Math.sin(a) * r0).toFixed(1) + "L" + (Math.cos(a) * r1).toFixed(1) + " " + (Math.sin(a) * r1).toFixed(1)
  }
  return s
}

// An almond eye: sharp outer corner, inner corner dipping toward the nose
// (drawn for the right eye; the left one is mirrored).
const ALMOND = "M-78 10 C-52 -40 30 -56 80 -8 C44 40 -30 50 -78 10Z"

// ---------------------------------------------------------------- the face

const Fur = React.memo(function Fur({ id, fur }: { id: string; fur: string }) {
  const stripes = React.useMemo(buildStripes, [])
  const hairs = React.useMemo(buildHairs, [])
  return (
    <g>
      <rect x={-380} y={-240} width={760} height={480} fill={fur} />
      <rect x={-380} y={-240} width={760} height={480} fill={"url(#" + id + "-shade)"} />
      <g filter={"url(#" + id + "-soft)"} fill="#fbf6ec">
        {EYES.map(([x, y], i) => (
          <React.Fragment key={i}>
            <ellipse cx={x} cy={y - 52} rx={78} ry={22} />
            <ellipse cx={x} cy={y + 44} rx={64} ry={15} opacity={0.9} />
          </React.Fragment>
        ))}
        <ellipse cx={0} cy={188} rx={96} ry={52} opacity={0.85} />
      </g>
      <g filter={"url(#" + id + "-rough)"}>
        <path d={stripes} fill="#140b05" />
      </g>
      <path d={hairs[0]} stroke="#3b1c07" strokeWidth={1.4} opacity={0.35} strokeLinecap="round" />
      <path d={hairs[1]} stroke="#f7c46e" strokeWidth={1.2} opacity={0.35} strokeLinecap="round" />
      <path d={hairs[2]} stroke="#fff6e4" strokeWidth={1} opacity={0.22} strokeLinecap="round" />
    </g>
  )
})

function Eye({
  id,
  x,
  y,
  flip,
  look,
  blink,
  pupil,
  scale,
  fibres,
}: {
  id: string
  x: number
  y: number
  flip: boolean
  look: Pt
  blink: number
  pupil: number
  scale: number
  fibres: string
}) {
  const clip = id + (flip ? "-cl" : "-cr")
  const lx = look[0] * (flip ? -1 : 1)
  return (
    <g transform={"translate(" + x + " " + y + ") scale(" + (flip ? -scale : scale) + " " + scale + ")"}>
      <clipPath id={clip}>
        <path d={ALMOND} />
      </clipPath>
      {/* dark skin around the eye and the tear-mark toward the nose */}
      <path d={ALMOND} fill="#0c0603" stroke="#0c0603" strokeWidth={11} strokeLinejoin="round" />
      <path d="M-80 8 C-86 20 -96 30 -98 44 C-90 34 -80 24 -70 18Z" fill="#0c0603" />
      <g clipPath={"url(#" + clip + ")"}>
        <ellipse cx={0} cy={0} rx={80} ry={52} fill="#3d1a05" />
        <g transform={"translate(" + (lx * 13).toFixed(2) + " " + (4 + look[1] * 7).toFixed(2) + ")"}>
          <circle r={38} fill={"url(#" + id + "-iris)"} />
          <path d={fibres} stroke="#6b2d05" strokeWidth={1} opacity={0.35} />
          <circle r={38} fill="none" stroke="#3a1602" strokeWidth={3} opacity={0.8} />
          <circle r={13 * pupil} fill="#050302" />
          <ellipse cx={-12} cy={-13} rx={7.5} ry={5.5} fill="#fff" opacity={0.92} />
          <circle cx={9} cy={10} r={2.6} fill="#fff" opacity={0.6} />
        </g>
        {/* the upper lid's shadow, and the lid itself when it blinks */}
        <ellipse cx={0} cy={-46} rx={90} ry={34} fill={"url(#" + id + "-lid)"} />
        <g transform={"translate(0 " + (-62 + blink * 70).toFixed(2) + ")"}>
          <rect x={-90} y={-80} width={180} height={80} fill="#9c5212" />
          <path d="M-90 0 H90" stroke="#0c0603" strokeWidth={8} />
        </g>
      </g>
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

type Frame = { p: number; look: Pt; blink: number; squint: number }

export default function TigerTearReveal({
  word = "COURAGE",
  tagline = "HAVE NO FEAR",
  ink = "#cf2e3d",
  paper = "#f2f1ee",
  taglineColor = "#2a2a2a",
  eyeColor = "#f0a526",
  furColor = "#d9832c",
  fontFamily = '"Anton", Impact, "Bebas Neue", "Oswald", "Arial Narrow", "Arial Black", sans-serif',
  height = "100svh",
  scrollDistance = "140svh",
  progress,
  hint = true,
  className = "",
}: TigerTearRevealProps) {
  const rootRef = React.useRef<HTMLElement | null>(null)
  const stageRef = React.useRef<HTMLDivElement | null>(null)
  const reduced = usePrefersReducedMotion()
  const id = "ttr" + React.useId().replace(/[^a-zA-Z0-9]/g, "")
  const fibres = React.useMemo(buildFibres, [])
  const [f, setF] = React.useState<Frame>({ p: progress ?? 0, look: [0, 0], blink: 0, squint: 0 })

  const controlled = progress !== undefined
  const cfg = React.useRef({ progress, controlled, reduced })
  cfg.current = { progress, controlled, reduced }
  const pointer = React.useRef<{ x: number; y: number } | null>(null)
  const squintAt = React.useRef(-1e9)

  React.useEffect(() => {
    const root = rootRef.current
    const stage = stageRef.current
    if (!root || !stage) return
    let raf = 0
    let visible = true
    let p = cfg.current.progress ?? 0
    let look: Pt = [0, 0]
    let idle: Pt = [0, 0]
    let nextIdle = 0
    let nextBlink = performance.now() + 2500
    let last: Frame | null = null

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      if (visible && !raf) raf = requestAnimationFrame(tick)
    })
    io.observe(root)

    function tick(now: number) {
      raf = 0
      if (!visible) return
      const c = cfg.current
      const target = c.controlled
        ? clamp01(c.progress ?? 0)
        : scrollProgress(root!.getBoundingClientRect().top, root!.offsetHeight, stage!.offsetHeight)
      p = c.reduced ? (target > 0.3 ? 1 : 0) : p + (target - p) * 0.16
      if (Math.abs(target - p) < 0.0005) p = target

      // where the eyes look: the pointer if there is one, else a wandering gaze
      let want: Pt
      if (pointer.current) {
        const r = stage!.getBoundingClientRect()
        want = [
          Math.max(-1, Math.min(1, (pointer.current.x - r.left - r.width / 2) / (r.width * 0.35))),
          Math.max(-1, Math.min(1, (pointer.current.y - r.top - r.height * 0.58) / (r.height * 0.35))),
        ]
      } else {
        if (now > nextIdle && !c.reduced) {
          const g = rng(Math.floor(now))
          idle = [(g() - 0.5) * 1.4, (g() - 0.5) * 0.8]
          nextIdle = now + 1400 + g() * 1800
        }
        want = c.reduced ? [0, 0] : idle
      }
      look = [look[0] + (want[0] - look[0]) * 0.14, look[1] + (want[1] - look[1]) * 0.14]

      // blinks: a quick close and open every few seconds
      let blink = 0
      if (!c.reduced) {
        const since = now - nextBlink
        if (since > 0) blink = since < 90 ? since / 90 : since < 200 ? 1 - (since - 90) / 110 : 0
        if (since > 200) nextBlink = now + 2600 + Math.random() * 3200
      }
      const squint = c.reduced ? 0 : Math.max(0, 1 - (now - squintAt.current) / 900)

      const next: Frame = { p, look, blink, squint }
      if (
        !last ||
        Math.abs(next.p - last.p) > 1e-4 ||
        Math.abs(next.look[0] - last.look[0]) > 1e-3 ||
        Math.abs(next.look[1] - last.look[1]) > 1e-3 ||
        next.blink !== last.blink ||
        next.squint !== last.squint
      ) {
        last = next
        setF(next)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
    }
  }, [])

  const s = stages(f.p)
  const edges = tearEdges(s.open, AXIS.len, AXIS.half)
  const hole = edges.top.concat([...edges.bottom].reverse())
  const flapTop = edges.top.concat(edges.top.map(([u, v], i) => [u, v + edges.curlTop[i]] as Pt).reverse())
  const flapBottom = edges.bottom.concat(edges.bottom.map(([u, v], i) => [u, v - edges.curlBottom[i]] as Pt).reverse())
  const crackN = Math.round(s.crack * 64)
  const crack = tearEdges(0.02, AXIS.len, AXIS.half, 11).top.slice(0, crackN + 1).map(([u], i) => [u, Math.sin(i * 2.7) * 4 + Math.sin(i * 0.9) * 3] as Pt)

  const pop = reduced ? s.pop : easeOutBack(s.pop)
  const eyeScale = 0.62 + 0.36 * pop
  const zoom = 1.22 - 0.22 * s.open
  const pupil = 1.25 - 0.45 * s.pop + 0.35 * f.squint
  const blink = Math.max(f.blink, f.squint * 0.45)
  const shake = reduced ? 0 : Math.sin(f.p * 900) * 5 * s.shake
  const axis = "translate(" + AXIS.cx + " " + AXIS.cy + ") rotate(" + AXIS.angle + ")"

  return (
    <section
      ref={rootRef}
      className={"relative w-full " + className}
      style={{ height: controlled ? height : "calc(" + height + " + " + scrollDistance + ")", background: paper, overflow: "clip" }}
    >
      <div
        ref={stageRef}
        className="sticky top-0 w-full overflow-hidden"
        style={{ height, cursor: s.pop > 0.9 ? "crosshair" : undefined }}
        onPointerMove={(e) => (pointer.current = { x: e.clientX, y: e.clientY })}
        onPointerLeave={() => (pointer.current = null)}
        onPointerDown={() => s.pop > 0.5 && (squintAt.current = performance.now())}
      >
        <svg
          viewBox={FRAME}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={(tagline ? tagline + ". " : "") + word + ", torn open to reveal a tiger's eyes."}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", maxWidth: "none", display: "block" }}
        >
          <defs>
            <linearGradient id={id + "-shade"} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#2a1203" stopOpacity={0.45} />
              <stop offset="0.45" stopColor="#ffd08a" stopOpacity={0.12} />
              <stop offset="1" stopColor="#2a1203" stopOpacity={0.5} />
            </linearGradient>
            <radialGradient id={id + "-iris"}>
              <stop offset="0" stopColor="#fff0a8" />
              <stop offset="0.35" stopColor={eyeColor} />
              <stop offset="0.8" stopColor="#b8570f" />
              <stop offset="1" stopColor="#4d1f03" />
            </radialGradient>
            <linearGradient id={id + "-lid"} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#000" stopOpacity={0.75} />
              <stop offset="1" stopColor="#000" stopOpacity={0} />
            </linearGradient>
            <linearGradient id={id + "-flap"} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="1" stopColor="#dedad3" />
            </linearGradient>
            <filter id={id + "-soft"} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="7" />
            </filter>
            <filter id={id + "-rough"} x="-10%" y="-10%" width="120%" height="120%">
              <feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves="2" seed="4" />
              <feDisplacementMap in="SourceGraphic" scale="9" />
            </filter>
            <filter id={id + "-shadowDown"} x="-10%" y="-40%" width="120%" height="180%">
              <feDropShadow dx="0" dy="7" stdDeviation="6" floodColor="#000" floodOpacity="0.45" />
            </filter>
            <filter id={id + "-shadowUp"} x="-10%" y="-80%" width="120%" height="180%">
              <feDropShadow dx="0" dy="-7" stdDeviation="6" floodColor="#000" floodOpacity="0.45" />
            </filter>
            <filter id={id + "-glow"} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="9" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <clipPath id={id + "-hole"}>
              <path transform={axis} d={d(hole)} />
            </clipPath>
            <mask id={id + "-paper"} maskUnits="userSpaceOnUse" x={0} y={0} width={VIEW_W} height={VIEW_H}>
              <rect width={VIEW_W} height={VIEW_H} fill="#fff" />
              <path transform={axis} d={d(hole)} fill="#000" />
            </mask>
          </defs>

          <g transform={"translate(" + shake.toFixed(2) + " " + (shake * 0.4).toFixed(2) + ")"}>
            {tagline ? (
              <text
                x={VIEW_W / 2}
                y={148}
                textAnchor="middle"
                fill={taglineColor}
                style={{ font: '700 32px "Helvetica Neue", Helvetica, Arial, sans-serif', letterSpacing: "0.42em" }}
              >
                {tagline}
              </text>
            ) : null}

            {/* what is behind the paper */}
            {s.open > 0 ? (
              <g clipPath={"url(#" + id + "-hole)"}>
                <g transform={axis + " scale(" + zoom.toFixed(4) + ")"}>
                  <Fur id={id} fur={furColor} />
                  <g filter={s.pop > 0.02 ? "url(#" + id + "-glow)" : undefined} opacity={0.35 + 0.65 * smooth(0, 0.4, s.pop)}>
                    {EYES.map(([x, y], i) => (
                      <Eye
                        key={i}
                        id={id}
                        x={x}
                        y={y}
                        flip={i === 0}
                        look={f.look}
                        blink={blink}
                        pupil={pupil}
                        scale={eyeScale}
                        fibres={fibres}
                      />
                    ))}
                  </g>
                </g>
                {/* depth: the hole is darker toward its edges */}
                <path transform={axis} d={d(hole)} fill="none" stroke="#000" strokeOpacity={0.35} strokeWidth={26} filter={"url(#" + id + "-soft)"} />
              </g>
            ) : null}

            {/* the paper with the word on it, with the hole cut out */}
            <g mask={"url(#" + id + "-paper)"}>
              <text
                x={VIEW_W / 2}
                y={404}
                textAnchor="middle"
                textLength={880}
                lengthAdjust="spacingAndGlyphs"
                fill={ink}
                style={{ fontFamily, fontSize: 250, fontWeight: 400, letterSpacing: 0 }}
              >
                {word}
              </text>
            </g>

            <g transform={axis}>
              {/* the crack, before it gives way */}
              {s.crack > 0 && s.open < 0.2 ? (
                <path d={d(crack, false)} fill="none" stroke="#1d0f07" strokeWidth={2.2} strokeLinejoin="bevel" opacity={1 - s.open * 5} />
              ) : null}
              {s.open > 0 ? (
                <>
                  {/* exposed paper fibres along the torn edge */}
                  <path d={d(edges.top, false)} fill="none" stroke="#fff" strokeWidth={3} strokeLinejoin="round" opacity={Math.min(1, s.open * 4)} />
                  <path d={d(edges.bottom, false)} fill="none" stroke="#fff" strokeWidth={3} strokeLinejoin="round" opacity={Math.min(1, s.open * 4)} />
                  {/* the paper curling back over the hole */}
                  <path d={d(flapTop)} fill={"url(#" + id + "-flap)"} filter={"url(#" + id + "-shadowDown)"} />
                  <path d={d(flapBottom)} fill={"url(#" + id + "-flap)"} filter={"url(#" + id + "-shadowUp)"} />
                </>
              ) : null}
            </g>
          </g>
        </svg>

        {hint && !controlled ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-6 flex flex-col items-center gap-2 font-mono text-[10px] uppercase tracking-[0.35em] motion-reduce:transition-none"
            style={{ color: taglineColor, opacity: Math.max(0, 0.7 - s.crack * 3) }}
          >
            scroll
            <span className="block h-6 w-px animate-pulse motion-reduce:animate-none" style={{ background: taglineColor }} />
          </div>
        ) : null}
      </div>
    </section>
  )
}
