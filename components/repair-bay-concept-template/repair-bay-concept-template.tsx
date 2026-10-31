"use client"

import * as React from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

/**
 * Repair Bay Concept Template: a one-page showcase for a single piece of
 * concept art, laid out like an art-book entry.
 *
 * Storyboard
 * - Poster: a mustard poster. The giant title drops in letter by letter, the
 *   HUD frame and its crossing lines draw themselves, the speech bubble pops,
 *   and the chain hoist hangs in front of the title.
 * - Problem: scrolling pushes the camera in and the letters fly off. The room
 *   goes dark and a dry-brush chapter title is wiped on.
 * - Room: while it is dark, the flat poster shrinks into the window frame.
 *   The lights come back as the camera pulls out, revealing the whole
 *   workshop: glowing window, drifting jellyfish, hanging cables, sparks and a
 *   flickering CRT. Pointer parallax moves four depth layers.
 * - Explore: numbered hotspots appear. Each opens a note in the caption panel.
 * - Details: eight crops of the same live scene, each wiped in. Clicking one
 *   opens a viewer that pans the camera across the scene from crop to crop
 *   (← →), and can zoom out to show where the crop sits.
 * - Dynamics: the live scene in a film frame with a running timecode, and
 *   switches for power, sparks, freeze and the window's mood colour.
 * - Credits: a marquee, the credits and the signature.
 * - Reduced motion: no camera moves, no loops; phases change with fades.
 *
 * The scene is drawn here as layered SVG and nothing is fetched apart from
 * the optional Google Fonts stylesheet. Pass `sceneImage` (a 16:9 render) to
 * show your own artwork; the poster morph, hotspots, details and viewer then
 * work on it the same way.
 *
 * GSAP and ScrollTrigger run inside one gsap.context, reverted on unmount.
 * The stage is CSS-sticky inside a tall section, with no ScrollTrigger
 * pinning.
 */

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger)

// ---- public types -----------------------------------------------------------

/** A point of interest in scene coordinates (the scene is 1600 × 900). */
export type RbHotspot = { x: number; y: number; label: string; note: string }
/** A square crop of the scene, in scene coordinates. */
export type RbCrop = { x: number; y: number; size: number; caption: string }
export type RbCredit = { role: string; name: string }
export type RbMood = { name: string; tint: string | null }
export type RbRect = { x: number; y: number; w: number; h: number }

export type RepairBayConceptTemplateProps = {
  /** Issue tag in the corner of the poster. */
  issue?: string
  kicker?: string
  /** The giant poster word. Keep it to one word of 6–10 letters. */
  title?: string
  year?: string
  date?: string
  /** The speech bubble. `null` hides it. */
  bubble?: string | null
  /** Small mono note on the right of the poster. */
  note?: string
  recordLabel?: string
  signature?: string
  /** The dry-brush chapter title shown while the room is dark. */
  problem?: { top: string; bottom: string; tag: string }
  hotspots?: RbHotspot[]
  crops?: RbCrop[]
  credits?: RbCredit[]
  moods?: RbMood[]
  detailsLabel?: string
  motionLabel?: string
  /** Poster colour. The ✱ button cycles through it and `accents`. */
  accent?: string
  accents?: string[]
  /** A 16:9 render to use instead of the drawn scene (cover-fit to 1600 × 900). */
  sceneImage?: string
  sceneAlt?: string
  /** Where the poster shrinks into, in scene coordinates. Set it when you use `sceneImage`. */
  windowRect?: RbRect
  /** Height of the sticky stage. A definite length. */
  height?: string
  /** Google Fonts stylesheet. `null` loads nothing. */
  fontHref?: string | null
  displayFont?: string
  brushFont?: string
  monoFont?: string
  scriptFont?: string
  className?: string
}

// #region art
export const RB_W = 1600
export const RB_H = 900

/** Deterministic PRNG (mulberry32), so the drawn clutter never changes. */
export function rbRng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const r1 = (n: number) => Math.round(n * 10) / 10

/** A cable hanging between two points, sagging by `sag`. */
export function rbCable(x1: number, y1: number, x2: number, y2: number, sag: number) {
  const mx = (x1 + x2) / 2
  const my = Math.max(y1, y2) + sag
  return "M" + r1(x1) + " " + r1(y1) + " Q" + r1(mx) + " " + r1(my * 2 - (y1 + y2) / 2) + " " + r1(x2) + " " + r1(y2)
}

/** A jellyfish bell of radius r, centred on its rim. */
export function rbBell(r: number) {
  const k = r * 1.3
  return (
    "M" + r1(-r) + " 0 C" + r1(-r) + " " + r1(-k) + " " + r1(r) + " " + r1(-k) + " " + r1(r) + " 0" +
    " C" + r1(r * 0.62) + " " + r1(r * 0.2) + " " + r1(r * 0.3) + " " + r1(-r * 0.04) + " 0 " + r1(r * 0.12) +
    " C" + r1(-r * 0.3) + " " + r1(-r * 0.04) + " " + r1(-r * 0.62) + " " + r1(r * 0.2) + " " + r1(-r) + " 0Z"
  )
}

/** A wavy tentacle hanging from (x, 0). */
export function rbTentacle(x: number, len: number, wave: number) {
  return (
    "M" + r1(x) + " 0 C" + r1(x + wave) + " " + r1(len * 0.33) + " " + r1(x - wave) + " " + r1(len * 0.66) +
    " " + r1(x + wave * 0.5) + " " + r1(len)
  )
}

export type RbJelly = { x: number; y: number; r: number; o: number; d: number; delay: number; len: number }

/** Jellyfish inside the window, biggest and faintest first. */
export function rbJellies(seed: number, win: RbRect) {
  const rnd = rbRng(seed)
  const out: RbJelly[] = [
    { x: win.x + win.w * 0.47, y: win.y + win.h * 0.42, r: 190, o: 0.32, d: 14, delay: 0, len: 260 },
  ]
  for (let i = 0; i < 9; i++) {
    const r = 18 + rnd() * 42
    out.push({
      x: r1(win.x + 50 + rnd() * (win.w - 100)),
      y: r1(win.y + 60 + rnd() * (win.h - 200)),
      r: r1(r),
      o: r1(0.45 + rnd() * 0.5),
      d: r1(6 + rnd() * 7),
      delay: r1(-rnd() * 8),
      len: r1(r * (1.6 + rnd() * 1.4)),
    })
  }
  return out
}

export type RbMote = { x: number; y: number; r: number; o: number; d: number; delay: number }

/** Dust motes floating in the window light. */
export function rbDust(seed: number, n: number) {
  const rnd = rbRng(seed)
  const out: RbMote[] = []
  for (let i = 0; i < n; i++)
    out.push({
      x: r1(200 + rnd() * 1200),
      y: r1(120 + rnd() * 700),
      r: r1(0.8 + rnd() * 2.2),
      o: r1(0.25 + rnd() * 0.6),
      d: r1(9 + rnd() * 14),
      delay: r1(-rnd() * 20),
    })
  return out
}

export type RbBox = { x: number; y: number; w: number; h: number; tone: number }

/** Boxes, tins and binders sitting on a shelf from x to x + w at height y. */
export function rbShelf(seed: number, x: number, y: number, w: number, maxH: number) {
  const rnd = rbRng(seed)
  const out: RbBox[] = []
  let cx = x + 4
  while (cx < x + w - 14) {
    const bw = 10 + rnd() * 36
    if (cx + bw > x + w - 4) break
    const bh = maxH * (0.35 + rnd() * 0.65)
    out.push({ x: r1(cx), y: r1(y - bh), w: r1(bw), h: r1(bh), tone: Math.floor(rnd() * 4) })
    cx += bw + 2 + rnd() * 10
  }
  return out
}

/** Hours:minutes:seconds:frames. */
export function rbTimecode(sec: number, fps = 24) {
  const s = Math.max(0, sec)
  const f = Math.floor((s % 1) * fps)
  const t = Math.floor(s)
  const p = (n: number) => String(n).padStart(2, "0")
  return p(Math.floor(t / 3600)) + ":" + p(Math.floor(t / 60) % 60) + ":" + p(t % 60) + ":" + p(f)
}

/**
 * The smallest view of the given aspect that contains the crop, centred on
 * it and kept inside the scene.
 */
export function rbFitView(c: { x: number; y: number; size: number }, aspect: number, pad = 1.35) {
  let h = Math.min(RB_H, c.size * pad)
  let w = h * aspect
  if (w > RB_W) {
    w = RB_W
    h = w / aspect
  }
  const cx = c.x + c.size / 2
  const cy = c.y + c.size / 2
  const x = Math.min(Math.max(cx - w / 2, 0), RB_W - w)
  const y = Math.min(Math.max(cy - h / 2, 0), RB_H - h)
  return { x: r1(x), y: r1(y), w: r1(w), h: r1(h) }
}

export const rbView = (v: { x: number; y: number; w: number; h: number }) => v.x + " " + v.y + " " + v.w + " " + v.h
// #endregion

// ---- defaults ---------------------------------------------------------------

export const RB_WINDOW: RbRect = { x: 230, y: 92, w: 1140, h: 548 }

export const RB_HOTSPOTS: RbHotspot[] = [
  { x: 836, y: 398, label: "Brass goggles", note: "Ground from two jam-jar bottoms. One lens is cracked, so he only ever squints with the left." },
  { x: 738, y: 520, label: "The patient", note: "A pocket radio that swears it is fine. It hums one note, and only when the jellyfish are watching." },
  { x: 556, y: 492, label: "Oscilloscope", note: "The same green wave for eleven nights. Tonight it skipped a beat." },
  { x: 432, y: 318, label: "Chain hoist", note: "Holds the space heater up, and keeps everyone's head down." },
  { x: 650, y: 498, label: "The apprentice", note: "Hands over the wrong screwdriver on purpose, to see if anyone is paying attention." },
  { x: 1046, y: 262, label: "The tank", note: "A flooded cargo hold behind six inches of glass. The jellyfish came with the building." },
]

export const RB_CROPS: RbCrop[] = [
  { x: 10, y: 250, size: 300, caption: "Shelf of lost causes" },
  { x: 250, y: 600, size: 280, caption: "The night chair" },
  { x: 460, y: 380, size: 220, caption: "Scope & lamp" },
  { x: 700, y: 300, size: 300, caption: "Goggles down" },
  { x: 380, y: 520, size: 300, caption: "Under the bench" },
  { x: 620, y: 440, size: 180, caption: "Apprentice & patient" },
  { x: 1040, y: 430, size: 260, caption: "Radio corner" },
  { x: 1300, y: 560, size: 320, caption: "Locker & crate" },
]

export const RB_CREDITS: RbCredit[] = [
  { role: "Concept & story", name: "Wren Okafor" },
  { role: "Modelling", name: "Studio Tidewater" },
  { role: "Lighting & look-dev", name: "M. Halvorsen" },
  { role: "Tools", name: "Blender · Substance · Nuke" },
]

export const RB_MOODS: RbMood[] = [
  { name: "Amber", tint: null },
  { name: "Abyss", tint: "#1fc8c0" },
  { name: "Coral", tint: "#ff5a6e" },
  { name: "Ultra", tint: "#7f62ff" },
]

const RB_FONTS =
  "https://fonts.googleapis.com/css2?family=Outfit:wght@600;800;900&family=Permanent+Marker&family=JetBrains+Mono:wght@400;600&family=Caveat:wght@600&display=swap"

// ---- the drawn scene ----------------------------------------------------------

const INK = "#080c0d"
const SH = "#0d1415"

type ArtProps = { p: string; image?: string; imageAlt?: string; win: RbRect }

/** Gradients and the four depth layers, as <defs> content. */
function RbArt({ p, image, imageAlt, win }: ArtProps) {
  const u = (id: string) => "url(#" + p + "-" + id + ")"
  const jellies = React.useMemo(() => rbJellies(11, win), [win])
  const dust = React.useMemo(() => rbDust(5, 70), [])
  const shelves = React.useMemo(
    () => [
      ...rbShelf(1, 18, 300, 190, 70),
      ...rbShelf(2, 18, 430, 190, 90),
      ...rbShelf(3, 18, 560, 190, 80),
    ],
    [],
  )
  const tones = ["#14201f", "#1b2a28", "#2a2a20", "#3a2f18"]
  const grime = React.useMemo(() => {
    const rnd = rbRng(23)
    return Array.from({ length: 46 }, () => ({
      x: r1(win.x + rnd() * win.w),
      y: r1(win.y + rnd() * win.h),
      r: r1(2 + rnd() * 22),
      o: r1(0.04 + rnd() * 0.12),
    }))
  }, [win])

  return (
    <>
      <linearGradient id={p + "-wall"} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#0c1819" />
        <stop offset="1" stopColor="#05090a" />
      </linearGradient>
      <radialGradient id={p + "-win"} cx="0.5" cy="0.42" r="0.72">
        <stop offset="0" stopColor="#fff3b8" />
        <stop offset="0.28" stopColor="#ffd440" />
        <stop offset="0.62" stopColor="#e2a113" />
        <stop offset="1" stopColor="#6e4405" />
      </radialGradient>
      <linearGradient id={p + "-spillL"} x1="1" y1="0" x2="0" y2="0">
        <stop offset="0" stopColor="#f2b52a" stopOpacity="0.32" />
        <stop offset="1" stopColor="#f2b52a" stopOpacity="0" />
      </linearGradient>
      <linearGradient id={p + "-spillR"} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#f2b52a" stopOpacity="0.3" />
        <stop offset="1" stopColor="#f2b52a" stopOpacity="0" />
      </linearGradient>
      <linearGradient id={p + "-floor"} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#1d1f17" />
        <stop offset="1" stopColor="#040505" />
      </linearGradient>
      <linearGradient id={p + "-pool"} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#f6bf32" stopOpacity="0.34" />
        <stop offset="1" stopColor="#f6bf32" stopOpacity="0" />
      </linearGradient>
      <radialGradient id={p + "-jelly"} cx="0.5" cy="0.75" r="0.7">
        <stop offset="0" stopColor="#fffdf0" stopOpacity="0.95" />
        <stop offset="0.45" stopColor="#ffe891" stopOpacity="0.55" />
        <stop offset="1" stopColor="#ffd23f" stopOpacity="0.05" />
      </radialGradient>
      <radialGradient id={p + "-jglow"}>
        <stop offset="0" stopColor="#fff4c0" stopOpacity="0.55" />
        <stop offset="1" stopColor="#fff4c0" stopOpacity="0" />
      </radialGradient>
      <linearGradient id={p + "-body"} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#3b3229" />
        <stop offset="1" stopColor="#0b0a09" />
      </linearGradient>
      <linearGradient id={p + "-fox"} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#8a3f15" />
        <stop offset="1" stopColor="#2a1206" />
      </linearGradient>
      <linearGradient id={p + "-rim"} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ffd45a" stopOpacity="1" />
        <stop offset="0.4" stopColor="#ffb52a" stopOpacity="0" />
      </linearGradient>
      <linearGradient id={p + "-rimS"} x1="1" y1="0" x2="0" y2="0">
        <stop offset="0" stopColor="#ffd45a" stopOpacity="0.9" />
        <stop offset="0.5" stopColor="#ffb52a" stopOpacity="0" />
      </linearGradient>
      <linearGradient id={p + "-cone"} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fff7d6" stopOpacity="0.6" />
        <stop offset="1" stopColor="#fff7d6" stopOpacity="0" />
      </linearGradient>
      <radialGradient id={p + "-screen"} cx="0.5" cy="0.5" r="0.7">
        <stop offset="0" stopColor="#d6ffe2" />
        <stop offset="0.45" stopColor="#3fe08a" />
        <stop offset="1" stopColor="#06321b" />
      </radialGradient>
      <radialGradient id={p + "-glint"} cx="0.35" cy="0.35" r="0.75">
        <stop offset="0" stopColor="#fffbe0" />
        <stop offset="0.35" stopColor="#f5bc35" />
        <stop offset="1" stopColor="#3c2603" />
      </radialGradient>
      <radialGradient id={p + "-haze"}>
        <stop offset="0" stopColor="#ffcf4a" stopOpacity="0.3" />
        <stop offset="1" stopColor="#ffcf4a" stopOpacity="0" />
      </radialGradient>
      <radialGradient id={p + "-spark"}>
        <stop offset="0" stopColor="#ffffff" />
        <stop offset="0.3" stopColor="#bff6ff" stopOpacity="0.9" />
        <stop offset="1" stopColor="#59d4ff" stopOpacity="0" />
      </radialGradient>
      <radialGradient id={p + "-vig"} cx="0.5" cy="0.48" r="0.75">
        <stop offset="0.55" stopColor="#000" stopOpacity="0" />
        <stop offset="1" stopColor="#000" stopOpacity="0.78" />
      </radialGradient>
      <pattern id={p + "-scan"} width="4" height="4" patternUnits="userSpaceOnUse">
        <rect width="4" height="2" fill="#000" opacity="0.28" />
      </pattern>
      <clipPath id={p + "-winclip"}>
        <rect x={win.x} y={win.y} width={win.w} height={win.h} />
      </clipPath>

      {/* ---- L0: room shell, window and the tank ------------------------- */}
      <g id={p + "-L0"}>
        {image ? (
          <image href={image} x="0" y="0" width={RB_W} height={RB_H} preserveAspectRatio="xMidYMid slice">
            {imageAlt ? <title>{imageAlt}</title> : null}
          </image>
        ) : (
          <>
            <rect width={RB_W} height={RB_H} fill={u("wall")} />
            <rect x={win.x - 230} y={win.y - 40} width="230" height={win.h + 80} fill={u("spillL")} />
            <rect x={win.x + win.w} y={win.y - 40} width="230" height={win.h + 80} fill={u("spillR")} />
            {/* the tank */}
            <rect x={win.x} y={win.y} width={win.w} height={win.h} fill={u("win")} />
            <g clipPath={u("winclip")}>
              {jellies.map((j, i) => (
                <g key={i} transform={"translate(" + j.x + " " + j.y + ")"}>
                  <g className="rb-jelly" style={{ animationDuration: j.d + "s", animationDelay: j.delay + "s" }}>
                    <circle r={j.r * 2.1} cy={-j.r * 0.3} fill={u("jglow")} opacity={j.o} />
                    <g opacity={j.o}>
                      {[-0.6, -0.3, 0, 0.3, 0.6].map((t, k) => (
                        <path
                          key={k}
                          className="rb-tent"
                          d={rbTentacle(t * j.r, j.len * (0.75 + ((k * 37) % 5) * 0.08), j.r * 0.16)}
                          fill="none"
                          stroke="#fff1b5"
                          strokeWidth={Math.max(1, j.r * 0.035)}
                          strokeLinecap="round"
                          opacity="0.75"
                          style={{ animationDelay: -k * 0.4 + "s" }}
                        />
                      ))}
                      <path d={rbBell(j.r)} fill={u("jelly")} stroke="#fffbe6" strokeOpacity="0.7" strokeWidth={Math.max(1, j.r * 0.03)} />
                      <path d={rbBell(j.r * 0.55)} fill="#fffbe6" opacity="0.35" transform={"translate(0 " + -j.r * 0.12 + ")"} />
                    </g>
                  </g>
                </g>
              ))}
              {grime.map((g, i) => (
                <circle key={i} cx={g.x} cy={g.y} r={g.r} fill="#3a2a05" opacity={g.o} />
              ))}
              <path d={"M" + (win.x + 80) + " " + (win.y + win.h) + " L" + (win.x + 260) + " " + win.y} stroke="#fff6cf" strokeOpacity="0.12" strokeWidth="40" />
              <path d={"M" + (win.x + 330) + " " + (win.y + win.h) + " L" + (win.x + 420) + " " + win.y} stroke="#fff6cf" strokeOpacity="0.08" strokeWidth="18" />
            </g>
            {/* mood tint: a per-instance colour wash over the tank */}
            <rect x={win.x} y={win.y} width={win.w} height={win.h} className="rb-tint" />
            {/* window frame and mullions */}
            <rect x={win.x} y={win.y} width={win.w} height={win.h} fill="none" stroke={INK} strokeWidth="22" />
            <rect x={win.x - 14} y={win.y - 14} width={win.w + 28} height={win.h + 28} fill="none" stroke="#16211f" strokeWidth="6" />
            {[0.333, 0.666].map((t) => (
              <rect key={t} x={win.x + win.w * t - 4} y={win.y} width="8" height={win.h} fill={INK} opacity="0.85" />
            ))}
            {/* rivets */}
            {Array.from({ length: 24 }, (_, i) => (
              <circle key={i} cx={win.x + 20 + (i * (win.w - 40)) / 23} cy={win.y - 6} r="2.2" fill="#2a3533" />
            ))}
            {/* ceiling */}
            <rect width={RB_W} height="70" fill="#040606" />
            <rect y="62" width={RB_W} height="10" fill="#111a19" />
            {[140, 520, 980, 1420].map((x) => (
              <rect key={x} x={x} y="20" width="16" height="50" fill="#0b1112" />
            ))}
            <rect y="34" width={RB_W} height="12" fill="#0f1716" />
            {[
              [0, 40, 620, 60, 70],
              [180, 50, 900, 40, 110],
              [520, 46, 1600, 70, 90],
              [860, 40, 1340, 56, 140],
              [1100, 44, 1600, 30, 60],
              [-20, 60, 420, 50, 160],
            ].map(([a, b, c, d, s], i) => (
              <path key={i} d={rbCable(a, b, c, d, s)} fill="none" stroke={INK} strokeWidth={5 + (i % 3) * 3} />
            ))}
            {/* droppers down to the bench */}
            {[
              [612, 58, 640, 470, 60],
              [690, 56, 700, 440, 30],
              [1010, 52, 990, 300, 40],
              [1160, 60, 1180, 470, 50],
            ].map(([a, b, c, d, s], i) => (
              <path
                key={i}
                d={"M" + a + " " + b + " C" + (a + s) + " " + (b + 140) + " " + (c - s) + " " + (d - 160) + " " + c + " " + d}
                fill="none"
                stroke={INK}
                strokeWidth={4 + (i % 2) * 3}
              />
            ))}
            {/* left wall: shelves */}
            <rect x="10" y="190" width="206" height="460" fill="#0a1112" />
            {[190, 300, 430, 560].map((y) => (
              <rect key={y} x="10" y={y} width="206" height="7" fill="#1c2a28" />
            ))}
            <rect x="10" y="190" width="7" height="460" fill="#16211f" />
            <rect x="209" y="190" width="7" height="460" fill="#25332f" />
            {shelves.map((b, i) => (
              <g key={i}>
                <rect x={b.x} y={b.y} width={b.w} height={b.h} fill={tones[b.tone]} />
                <rect x={b.x + b.w - 2} y={b.y} width="2" height={b.h} fill="#f2b52a" opacity="0.28" />
              </g>
            ))}
            <rect x="36" y="214" width="56" height="70" fill="#d8cfa8" opacity="0.5" transform="rotate(-3 64 249)" />
            <path d="M40 232h44M40 244h36M40 256h40" stroke="#2a2a20" strokeWidth="3" opacity="0.6" />
            <text x="132" y="262" fill="#c9b98a" opacity="0.55" fontFamily="monospace" fontWeight="700" fontSize="30">10</text>
            {/* right wall: locker */}
            <rect x="1394" y="170" width="190" height="490" rx="6" fill="#0d1516" />
            <rect x="1404" y="182" width="80" height="466" fill="#132021" />
            <rect x="1494" y="182" width="80" height="466" fill="#101a1b" />
            <rect x="1394" y="170" width="190" height="490" rx="6" fill="none" stroke={u("rimS")} strokeWidth="3" />
            <rect x="1468" y="380" width="6" height="60" rx="3" fill="#3b4744" />
            <rect x="1506" y="380" width="6" height="60" rx="3" fill="#3b4744" />
            {[0, 1, 2, 3].map((i) => (
              <rect key={i} x="1416" y={200 + i * 10} width="56" height="4" fill="#060a0a" />
            ))}
            <path d="M1528 470 l26 46 h-52 z" fill="#e9b518" opacity="0.85" />
            <path d="M1528 486 v16" stroke="#000" strokeWidth="5" />
            <circle cx="1528" cy="508" r="2.6" fill="#000" />
            <rect x="1414" y="540" width="60" height="44" fill="#d8cfa8" opacity="0.4" transform="rotate(4 1444 562)" />
            {/* floor */}
            <rect y={win.y + win.h} width={RB_W} height={RB_H - win.y - win.h} fill={u("floor")} />
            <path
              d={"M" + win.x + " " + (win.y + win.h) + " L" + (win.x + win.w) + " " + (win.y + win.h) + " L1560 900 L40 900 Z"}
              fill={u("pool")}
            />
            <path d={"M0 " + (win.y + win.h) + " H" + RB_W} stroke="#2b2a1d" strokeWidth="3" />
          </>
        )}
      </g>

      {/* ---- L1: cables, hoist and ceiling lamp ---------------------------- */}
      <g id={p + "-L1"}>
        {image ? null : (
          <>
            {/* ceiling lamp */}
            <path d="M760 62 v40" stroke={INK} strokeWidth="4" />
            <path d="M728 128 q32 -34 64 0 z" fill="#121b1a" />
            <ellipse cx="760" cy="128" rx="32" ry="6" fill="#fff0b0" className="rb-power" />
            {/* chain hoist */}
            <g className="rb-swing">
              <path d="M416 0 V290 M444 0 V290" stroke="#121918" strokeWidth="5" strokeDasharray="9 5" />
              <path d="M416 0 V290 M444 0 V290" stroke="#e9b518" strokeOpacity="0.35" strokeWidth="1.5" strokeDasharray="9 5" />
              <rect x="400" y="120" width="60" height="44" rx="6" fill="#141c1b" />
              <circle cx="420" cy="142" r="13" fill="#0a1010" stroke="#2c3836" strokeWidth="3" />
              <circle cx="444" cy="142" r="9" fill="#0a1010" stroke="#2c3836" strokeWidth="3" />
              <path d="M430 290 q0 18 -12 18" fill="none" stroke="#1d2726" strokeWidth="5" />
              <rect x="396" y="300" width="72" height="56" rx="5" fill="#111818" />
              <rect x="396" y="300" width="72" height="56" rx="5" fill="none" stroke={u("rim")} strokeWidth="3" />
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <rect key={i} x="404" y={308 + i * 7.5} width="56" height="3" fill="#2d3a37" />
              ))}
              <rect x="410" y="350" width="44" height="12" fill="#0a0f0f" />
            </g>
          </>
        )}
      </g>

      {/* ---- L2: the bench, the mechanic and the apprentice ---------------- */}
      <g id={p + "-L2"}>
        {image ? null : (
          <>
            <ellipse cx="800" cy="676" rx="520" ry="34" fill="#000" opacity="0.6" />
            {/* lamp light cone */}
            <path d="M518 432 L440 560 L650 560 Z" fill={u("cone")} className="rb-power rb-cone" />
            {/* mechanic: body, back-lit */}
            <path
              d="M1112 560 C1122 470 1090 398 1012 376 C958 362 900 376 868 420 C846 452 838 502 830 560 Z"
              fill={u("body")}
            />
            <path
              d="M1112 560 C1122 470 1090 398 1012 376 C958 362 900 376 868 420"
              fill="none"
              stroke="#ffcf4a"
              strokeOpacity="0.85"
              strokeWidth="3.5"
            />
            {/* apron */}
            <path d="M880 470 C900 452 960 452 1000 470 L1010 560 L872 560 Z" fill="#4a3220" opacity="0.75" />
            <path d="M930 470 V560" stroke="#2a1b10" strokeWidth="3" />
            {/* far arm resting on the bench */}
            <path d="M1060 452 C1080 500 1040 540 990 548" fill="none" stroke="#1d1915" strokeWidth="36" strokeLinecap="round" />
            <circle cx="984" cy="550" r="16" fill="#2a241e" />
            {/* head, leaning down to the work */}
            <path
              d="M912 360 C886 342 840 348 814 374 C794 394 780 430 770 456 C766 470 778 478 792 472 C818 462 852 452 884 440 C914 428 932 394 912 360 Z"
              fill="#24201c"
            />
            <path
              d="M790 462 C806 414 842 378 890 356 L904 368 C856 388 818 424 800 468 Z"
              fill="#d8d0bb"
              opacity="0.92"
            />
            <path
              d="M912 360 C886 342 840 348 814 374"
              fill="none"
              stroke="#ffd45a"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle cx="900" cy="352" r="13" fill="#1a1714" />
            <circle cx="868" cy="344" r="12" fill="#1a1714" />
            <path d="M856 336 a12 12 0 0 1 22 2" fill="none" stroke="#ffd45a" strokeWidth="2.5" />
            <path d="M890 342 a13 13 0 0 1 22 4" fill="none" stroke="#ffd45a" strokeWidth="2.5" />
            <circle cx="774" cy="464" r="7" fill="#0b0a09" />
            {/* goggles */}
            <path d="M796 428 C830 410 870 394 908 384" fill="none" stroke="#2b1f14" strokeWidth="8" />
            <circle cx="846" cy="396" r="17" fill={u("glint")} stroke="#b8892a" strokeWidth="5" />
            <circle cx="816" cy="414" r="14" fill={u("glint")} stroke="#b8892a" strokeWidth="5" />
            <path d="M838 388 l6 -3" stroke="#fffbe6" strokeWidth="3" strokeLinecap="round" className="rb-glint" />
            <path d="M846 404 l-8 6 M850 392 l-4 10" stroke="#3c2603" strokeWidth="1.5" opacity="0.7" />
            {/* near arm with the soldering iron */}
            <path d="M902 452 C880 490 836 520 800 528" fill="none" stroke="#2c2620" strokeWidth="32" strokeLinecap="round" />
            <path d="M902 452 C880 490 836 520 800 528" fill="none" stroke="#ffcf4a" strokeOpacity="0.35" strokeWidth="2" transform="translate(0 -15)" />
            <circle cx="796" cy="530" r="15" fill="#3a3129" />
            <path d="M790 528 L756 530" stroke="#8a8f88" strokeWidth="5" strokeLinecap="round" />
            <path d="M770 529 L796 529" stroke="#1b3c4a" strokeWidth="8" strokeLinecap="round" />
            {/* the patient: a boxy pocket radio-bot */}
            <g>
              <rect x="706" y="508" width="44" height="50" rx="6" fill="#2b3a35" />
              <rect x="706" y="508" width="44" height="50" rx="6" fill="none" stroke={u("rim")} strokeWidth="2.5" />
              <rect x="712" y="514" width="32" height="20" rx="3" fill={u("screen")} className="rb-power rb-crt" />
              <circle cx="721" cy="524" r="2.6" fill="#06321b" />
              <circle cx="735" cy="524" r="2.6" fill="#06321b" />
              <circle cx="718" cy="546" r="5" fill="#141c1b" stroke="#4f6158" strokeWidth="1.5" />
              <path d="M730 542 h14 M730 548 h14" stroke="#4f6158" strokeWidth="2" />
              <path d="M740 508 L752 478" stroke="#6e7a72" strokeWidth="2.5" />
              <circle cx="752" cy="477" r="3.5" fill="#ff5a3c" className="rb-blink" />
              <path d="M712 558 L708 566 M744 558 L748 566" stroke="#2b3a35" strokeWidth="5" />
            </g>
            {/* sparks at the iron tip */}
            <g className="rb-sparks" transform="translate(754 530)">
              <circle r="20" fill={u("spark")} className="rb-spark-core" />
              {[-160, -130, -95, -60, -30, 10, -110, -75].map((a, i) => (
                <path
                  key={i}
                  className="rb-spark"
                  d={"M0 0 L" + r1(Math.cos((a * Math.PI) / 180) * (18 + (i % 3) * 10)) + " " + r1(Math.sin((a * Math.PI) / 180) * (18 + (i % 3) * 10))}
                  stroke="#e9fbff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  style={{ animationDelay: -i * 0.13 + "s" }}
                />
              ))}
            </g>
            {/* apprentice fox */}
            <g>
              <path d="M662 556 C700 560 712 530 690 520 C676 514 668 530 680 536" fill="none" stroke={u("fox")} strokeWidth="12" strokeLinecap="round" />
              <ellipse cx="650" cy="532" rx="20" ry="26" fill={u("fox")} />
              <ellipse cx="648" cy="540" rx="10" ry="15" fill="#e8d6b4" opacity="0.8" />
              <circle cx="648" cy="498" r="15" fill="#7a3612" />
              <path d="M634 494 L624 458 L646 486 Z" fill="#7a3612" />
              <path d="M660 494 L674 458 L652 486 Z" fill="#7a3612" />
              <path d="M634 491 L627 466 L642 486 Z" fill="#2a1206" opacity="0.6" />
              <path d="M624 458 L646 486 M674 458 L652 486" stroke="#ffd45a" strokeWidth="2" />
              <path d="M638 506 Q648 516 658 506 L648 514 Z" fill="#e8d6b4" />
              <circle cx="642" cy="499" r="2.2" fill="#ffe27a" />
              <circle cx="654" cy="499" r="2.2" fill="#ffe27a" />
              <path d="M664 528 L690 506" stroke="#d6dad2" strokeWidth="3" strokeLinecap="round" />
              <path d="M664 528 L674 520" stroke="#c23a2a" strokeWidth="6" strokeLinecap="round" />
            </g>
            {/* desk lamp */}
            <path d="M462 560 h44 v-8 h-44z" fill="#151d1c" />
            <path d="M484 552 L452 470 L512 420" fill="none" stroke="#1d2726" strokeWidth="7" strokeLinecap="round" />
            <path d="M484 552 L452 470 L512 420" fill="none" stroke="#ffcf4a" strokeOpacity="0.4" strokeWidth="1.5" />
            <path d="M498 404 L540 420 L528 446 L494 428 Z" fill="#202b29" />
            <ellipse cx="520" cy="434" rx="16" ry="5" transform="rotate(25 520 434)" fill="#fff7d6" className="rb-power" />
            {/* oscilloscope / CRT */}
            <path d="M500 450 h118 l-6 106 h-106 z" fill="#18211f" />
            <path d="M500 450 h118" stroke="#ffcf4a" strokeOpacity="0.7" strokeWidth="2.5" />
            <rect x="512" y="462" width="84" height="62" rx="6" fill={u("screen")} className="rb-power rb-crt" />
            <rect x="512" y="462" width="84" height="62" rx="6" fill={u("scan")} />
            <path
              className="rb-wave"
              d="M516 494 l8 0 l4 -14 l5 26 l5 -20 l4 8 l10 0 l4 -10 l4 18 l4 -8 l8 0 l4 -6 l4 6 l12 0"
              fill="none"
              stroke="#eafff0"
              strokeWidth="2"
              pathLength={1}
            />
            {[0, 1, 2].map((i) => (
              <circle key={i} cx={526 + i * 22} cy="540" r="5" fill="#0a1010" stroke="#3b4a45" strokeWidth="2" />
            ))}
            {/* papers, mug, books, radio */}
            <rect x="560" y="550" width="70" height="8" fill="#d6caa4" opacity="0.8" transform="rotate(-4 595 554)" />
            <rect x="820" y="552" width="90" height="7" fill="#e3d8b5" opacity="0.75" transform="rotate(3 865 556)" />
            <g>
              <rect x="684" y="530" width="20" height="26" rx="3" fill="#bfb8a4" />
              <path d="M704 536 q10 2 0 14" fill="none" stroke="#bfb8a4" strokeWidth="4" />
              <path className="rb-steam" d="M690 524 q-6 -12 2 -22 q8 -10 0 -22" fill="none" stroke="#fff6dc" strokeOpacity="0.5" strokeWidth="3" strokeLinecap="round" />
              <path className="rb-steam" d="M698 524 q6 -12 -2 -22 q-8 -10 0 -22" fill="none" stroke="#fff6dc" strokeOpacity="0.4" strokeWidth="2.5" strokeLinecap="round" style={{ animationDelay: "-1.3s" }} />
            </g>
            {[
              [1130, 540, 96, 16, "#5a2f1c"],
              [1136, 524, 84, 16, "#24433f"],
              [1126, 508, 100, 16, "#6b5420"],
              [1140, 494, 76, 14, "#30302a"],
            ].map(([x, y, w, h, c], i) => (
              <g key={i}>
                <rect x={x} y={y} width={w} height={h} fill={c as string} />
                <rect x={x} y={y} width={w} height="2" fill="#ffcf4a" opacity="0.45" />
              </g>
            ))}
            <g>
              <rect x="1052" y="508" width="66" height="48" rx="6" fill="#3a2a1c" />
              <rect x="1058" y="514" width="30" height="36" rx="3" fill="#1c1410" />
              {[0, 1, 2, 3, 4].map((i) => (
                <rect key={i} x="1060" y={518 + i * 6} width="26" height="2.5" fill="#5d4630" />
              ))}
              <circle cx="1104" cy="524" r="8" fill="#f2b52a" opacity="0.85" className="rb-power" />
              <circle cx="1104" cy="544" r="5" fill="#1c1410" stroke="#7a6040" strokeWidth="1.5" />
              <path d="M1110 508 L1140 452" stroke="#6e7a72" strokeWidth="2" />
            </g>
            {/* desk-top fan */}
            <g transform="translate(1214 484)">
              <path d="M0 22 V72" stroke="#1d2726" strokeWidth="6" />
              <ellipse cx="0" cy="74" rx="20" ry="5" fill="#151d1c" />
              <circle r="24" fill="none" stroke="#b8892a" strokeWidth="2.5" />
              <path d="M-24 0 H24 M0 -24 V24 M-17 -17 L17 17 M-17 17 L17 -17" stroke="#b8892a" strokeWidth="1" opacity="0.7" />
              <g className="rb-fan">
                {[0, 120, 240].map((a) => (
                  <ellipse key={a} rx="5" ry="16" cy="-10" fill="#3a4a46" transform={"rotate(" + a + ")"} />
                ))}
              </g>
              <circle r="4" fill="#b8892a" />
            </g>
            {/* bench top and body */}
            <rect x="360" y="556" width="900" height="22" fill="#121715" />
            <rect x="360" y="556" width="900" height="3" fill="#ffcf4a" opacity="0.55" />
            <rect x="380" y="578" width="150" height="150" fill="#0d1211" />
            {[0, 1, 2].map((i) => (
              <g key={i}>
                <rect x="388" y={590 + i * 46} width="134" height="38" fill="#141b1a" />
                <rect x="440" y={604 + i * 46} width="30" height="5" rx="2" fill="#3b4a45" />
              </g>
            ))}
            <rect x="1200" y="578" width="22" height="200" fill="#0d1211" />
            <rect x="760" y="578" width="18" height="180" fill="#0d1211" />
            <path d="M560 600 C620 700 700 640 740 720 C760 760 700 790 640 770" fill="none" stroke="#0a0f0f" strokeWidth="9" />
            <path d="M600 610 C640 680 720 700 760 690" fill="none" stroke="#1c2726" strokeWidth="5" />
            <rect x="900" y="660" width="170" height="90" fill="#121a18" />
            <rect x="900" y="660" width="170" height="90" fill="none" stroke="#2c3a36" strokeWidth="3" />
            <path d="M912 686 h146 M912 712 h146" stroke="#1f2b28" strokeWidth="4" />
            <text x="930" y="742" fontFamily="monospace" fontSize="14" fill="#e9b518" opacity="0.6">FRAGILE ⟂</text>
          </>
        )}
      </g>

      {/* ---- L3: foreground, haze and dust --------------------------------- */}
      <g id={p + "-L3"}>
        {image ? null : (
          <>
            {/* chair */}
            <g>
              <path d="M262 708 L250 900 M352 708 L366 900 M300 730 L304 900" stroke={SH} strokeWidth="10" />
              <path d="M240 700 Q300 684 372 700 L372 718 Q300 704 240 718 Z" fill="#3a2c18" />
              <path d="M240 700 Q300 684 372 700" fill="none" stroke="#ffcf4a" strokeOpacity="0.6" strokeWidth="2.5" />
              <path d="M360 700 L384 560" stroke={SH} strokeWidth="9" />
              <path d="M364 560 Q390 548 414 566 L404 610 Q382 596 358 604 Z" fill="#3a2c18" />
            </g>
            {/* trolley on the left */}
            <g>
              <path d="M30 560 V860 M200 560 V860" stroke="#111817" strokeWidth="8" />
              <rect x="22" y="560" width="190" height="8" fill="#16201f" />
              <rect x="22" y="700" width="190" height="8" fill="#16201f" />
              <rect x="22" y="830" width="190" height="8" fill="#16201f" />
              <rect x="44" y="520" width="70" height="40" fill="#1a2423" />
              <rect x="124" y="640" width="64" height="60" fill="#18201e" />
              <rect x="40" y="664" width="60" height="36" fill="#2a2418" />
              <rect x="22" y="560" width="190" height="2" fill="#ffcf4a" opacity="0.4" />
              <circle cx="36" cy="874" r="10" fill="#0a0f0f" />
              <circle cx="196" cy="874" r="10" fill="#0a0f0f" />
            </g>
            {/* crate, bottom right */}
            <g>
              <rect x="1290" y="750" width="210" height="130" fill="#141c1a" />
              <rect x="1290" y="750" width="210" height="130" fill="none" stroke="#25322f" strokeWidth="5" />
              <path d="M1290 750 L1500 880 M1500 750 L1290 880" stroke="#1f2a27" strokeWidth="6" />
              <rect x="1290" y="750" width="210" height="3" fill="#ffcf4a" opacity="0.35" />
            </g>
            {[
              [520, 820, -8],
              [1060, 840, 6],
              [640, 868, 14],
            ].map(([x, y, a], i) => (
              <rect key={i} x={x} y={y} width="60" height="40" fill="#cfc5a0" opacity="0.18" transform={"rotate(" + a + " " + (x + 30) + " " + (y + 20) + ")"} />
            ))}
            <ellipse cx="800" cy="380" rx="620" ry="300" fill={u("haze")} className="rb-power" />
            <g className="rb-dust-all">
              {dust.map((m, i) => (
                <circle
                  key={i}
                  className="rb-dust"
                  cx={m.x}
                  cy={m.y}
                  r={m.r}
                  fill="#fff1c0"
                  opacity={m.o}
                  style={{ animationDuration: m.d + "s", animationDelay: m.delay + "s" }}
                />
              ))}
            </g>
          </>
        )}
        <rect width={RB_W} height={RB_H} fill={u("vig")} />
        <rect width={RB_W} height={RB_H} className="rb-dark" />
      </g>

      <symbol id={p + "-scene"} viewBox={"0 0 " + RB_W + " " + RB_H}>
        <use href={"#" + p + "-L0"} />
        <use href={"#" + p + "-L1"} />
        <use href={"#" + p + "-L2"} />
        <use href={"#" + p + "-L3"} />
      </symbol>
    </>
  )
}

// ---- styles ---------------------------------------------------------------

const RB_CSS = `
.rb-root{position:relative;width:100%;background:#050607;color:#f3efe2;font-family:var(--rb-mono);overflow-x:clip;-webkit-font-smoothing:antialiased}
.rb-root *{box-sizing:border-box}
.rb-root svg,.rb-root img{max-width:none}
.rb-root :where(button){font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer}
.rb-root :focus-visible{outline:2px solid var(--rb-accent);outline-offset:3px}
.rb-defs{position:absolute;width:0;height:0;overflow:hidden;pointer-events:none}

.rb-hero{position:relative;height:calc(var(--h) * 5)}
.rb-stage{position:sticky;top:0;height:var(--h);overflow:hidden;background:#000}
.rb-cam{position:absolute;inset:0;transform-origin:52% 58%;will-change:transform}
.rb-cam>svg{position:absolute;inset:0;width:100%;height:100%;display:block}
.rb-front{pointer-events:none}
.rb-front .rb-hot{pointer-events:auto}
.rb-black{position:absolute;inset:0;background:#030404;opacity:0;pointer-events:none}

.rb-poster{position:absolute;left:0;right:0;top:9%;height:44%;pointer-events:none}
.rb-titlebox{position:absolute;left:50%;top:0;transform:translateX(-50%);width:min(88vw,1240px)}
.rb-title{display:flex;justify-content:center;font-family:var(--rb-display);font-weight:900;color:#fffdf4;font-size:clamp(64px,15.5vw,250px);line-height:.82;letter-spacing:-.045em;margin:0;white-space:nowrap;text-shadow:0 .02em 0 rgba(120,80,0,.25)}
.rb-ch{display:inline-block;overflow:hidden;padding:.04em .005em .08em}
.rb-ch>span{display:inline-block;will-change:transform}
.rb-hud{position:absolute;inset:-4% -2% -6% -2%;width:104%;height:110%;overflow:visible}
.rb-hud path,.rb-hud rect{vector-effect:non-scaling-stroke}
.rb-issue{position:absolute;left:3%;top:-22%;display:flex;flex-direction:column;align-items:flex-start;font-family:var(--rb-display);color:#fffdf4;line-height:1}
.rb-issue b{font-weight:800;font-size:clamp(16px,2.3vw,34px);border:2px solid #fffdf4;padding:.05em .25em;background:var(--rb-accent)}
.rb-issue i{font-style:normal;font-size:clamp(9px,.9vw,13px);background:#fffdf4;color:#1b1503;padding:.15em .45em;font-weight:600;letter-spacing:.04em}
.rb-date{position:absolute;left:3%;top:76%;font-family:var(--rb-display);color:#fffdf4;font-weight:800;line-height:.95;font-size:clamp(18px,2.6vw,40px)}
.rb-date small{display:block;font-size:.55em;font-weight:600;letter-spacing:.06em}
.rb-icons{position:absolute;left:3%;top:118%;display:flex;gap:6px;pointer-events:auto}
.rb-icon{width:clamp(26px,2.4vw,36px);height:clamp(26px,2.4vw,36px);border:2px solid #fffdf4;display:grid;place-items:center;color:#fffdf4;transition:background .25s,color .25s,transform .25s}
.rb-icon:hover{background:#fffdf4;color:#1b1503;transform:translateY(-2px)}
.rb-icon svg{width:62%;height:62%}
.rb-bubble{position:absolute;left:56%;top:52%;font-family:var(--rb-brush);color:#121212;font-size:clamp(12px,1.6vw,24px);background:#fffdf4;border:2.5px solid #121212;border-radius:50%;padding:.55em 1em;transform:rotate(-8deg);white-space:nowrap;box-shadow:4px 4px 0 rgba(0,0,0,.25)}
.rb-bubble:after{content:"";position:absolute;left:38%;bottom:-14px;border:8px solid transparent;border-top:14px solid #121212;transform:skewX(-20deg)}
.rb-note{position:absolute;right:3%;top:calc(100% + 6px);margin:0;max-width:min(40vw,340px);text-align:right;font-size:clamp(9px,.85vw,12px);line-height:1.5;color:#fffdf4;opacity:.92}
.rb-record{position:absolute;right:3%;top:calc(100% + 84px);display:flex;align-items:center;gap:.6em;border:1.5px solid #fffdf4;background:rgba(255,253,244,.18);padding:.2em .7em;font-size:clamp(9px,.85vw,12px);color:#fffdf4}
.rb-record em{font-family:var(--rb-script);font-style:normal;font-size:2em;line-height:1}

.rb-chapters{position:absolute;right:clamp(12px,2.4vw,32px);bottom:clamp(16px,3vw,40px);display:flex;flex-direction:column;gap:12px;z-index:3;font-size:10px;letter-spacing:.18em;text-transform:uppercase}
.rb-chap{display:flex;align-items:center;gap:10px;opacity:.38;transition:opacity .4s;justify-content:flex-end}
.rb-chap i{width:18px;height:2px;background:currentColor;transition:width .4s,background .4s}
.rb-chap.is-on{opacity:1}
.rb-chap.is-on i{width:38px;background:var(--rb-accent)}
.rb-scrollhint{position:absolute;left:50%;bottom:22px;transform:translateX(-50%);font-size:10px;letter-spacing:.3em;text-transform:uppercase;color:#fffdf4;display:flex;flex-direction:column;align-items:center;gap:8px;z-index:3}
.rb-scrollhint span{width:1px;height:34px;background:linear-gradient(#fffdf4,transparent);animation:rb-hint 1.8s ease-in-out infinite;transform-origin:top}

.rb-brush{position:absolute;inset:0;display:grid;place-items:center;pointer-events:none;opacity:0}
.rb-brush-in{display:flex;flex-direction:column;align-items:center;transform:rotate(-6deg) skewX(-6deg);filter:url(#rb-rough)}
.rb-brush-line{display:flex;font-family:var(--rb-brush);color:var(--rb-accent);font-size:clamp(56px,11vw,170px);line-height:.85;letter-spacing:-.01em}
.rb-brush-line span{display:inline-block}
.rb-brush-line+.rb-brush-line{margin-left:-.3em}
.rb-brush-tag{display:flex;align-items:center;gap:.8em;color:var(--rb-accent);font-size:clamp(10px,1.1vw,14px);letter-spacing:.3em;text-transform:uppercase;margin:.3em 0;white-space:nowrap;font-family:var(--rb-mono)}
.rb-brush-tag:before,.rb-brush-tag:after{content:"";width:3em;height:2px;background:currentColor}

.rb-panel{position:absolute;left:clamp(12px,3vw,40px);bottom:clamp(12px,3vw,40px);width:min(360px,calc(100% - 24px));z-index:3;background:rgba(6,9,9,.72);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1px solid rgba(255,253,244,.14);border-left:3px solid var(--rb-accent);padding:16px 18px;opacity:0;pointer-events:none}
.rb-panel.is-live{pointer-events:auto}
.rb-panel-top{display:flex;justify-content:space-between;align-items:center;font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:var(--rb-accent)}
.rb-panel h3{margin:8px 0 6px;font-family:var(--rb-display);font-weight:800;font-size:22px;letter-spacing:-.01em;color:#fffdf4}
.rb-panel p{margin:0;font-size:12px;line-height:1.6;color:rgba(243,239,226,.78);min-height:3.2em}
.rb-panel-nav{display:flex;gap:6px}
.rb-panel-nav button{width:26px;height:26px;border:1px solid rgba(255,253,244,.3);display:grid;place-items:center;transition:background .2s,color .2s}
.rb-panel-nav button:hover{background:var(--rb-accent);color:#111;border-color:var(--rb-accent)}

.rb-hot{cursor:pointer;outline:none}
.rb-hot .rb-ring{fill:none;stroke:#fffdf4;stroke-width:2;transform-box:fill-box;transform-origin:center;animation:rb-ping 2.2s ease-out infinite}
.rb-hot .rb-dot{fill:rgba(5,6,7,.65);stroke:#fffdf4;stroke-width:2;transition:fill .3s}
.rb-hot text{font-family:var(--rb-mono);font-size:13px;font-weight:600;fill:#fffdf4;text-anchor:middle;dominant-baseline:central;pointer-events:none}
.rb-hot.is-on .rb-dot,.rb-hot:hover .rb-dot,.rb-hot:focus-visible .rb-dot{fill:var(--rb-accent)}
.rb-hot.is-on text,.rb-hot:hover text,.rb-hot:focus-visible text{fill:#111}

.rb-grain{position:absolute;inset:-50%;width:200%;height:200%;opacity:.13;mix-blend-mode:overlay;pointer-events:none;animation:rb-grain 1s steps(6) infinite;z-index:2}

.rb-sec{position:relative;padding:clamp(72px,12vw,150px) clamp(16px,5vw,72px)}
.rb-label{display:flex;align-items:center;justify-content:center;gap:1em;font-family:var(--rb-brush);color:var(--rb-accent);font-size:clamp(20px,2.4vw,30px);margin:0 0 clamp(32px,5vw,64px);letter-spacing:.06em;transform:skewX(-8deg)}
.rb-label:before,.rb-label:after{content:"";width:clamp(28px,5vw,60px);height:2px;background:currentColor}
.rb-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:clamp(8px,1.4vw,18px);max-width:1180px;margin:0 auto}
.rb-tile{position:relative;aspect-ratio:1/1;overflow:hidden;background:#0b0f10;display:block;width:100%;text-align:left}
.rb-tile-in{position:absolute;inset:0;transition:transform .9s cubic-bezier(.2,.7,.2,1)}
.rb-tile-in svg{width:100%;height:100%;display:block}
.rb-tile:hover .rb-tile-in,.rb-tile:focus-visible .rb-tile-in{transform:scale(1.09)}
.rb-tile-cap{position:absolute;left:0;right:0;bottom:0;padding:28px 12px 10px;background:linear-gradient(transparent,rgba(0,0,0,.85));font-size:11px;letter-spacing:.08em;display:flex;justify-content:space-between;align-items:flex-end;transform:translateY(100%);transition:transform .5s cubic-bezier(.2,.7,.2,1)}
.rb-tile-cap b{color:var(--rb-accent);font-weight:600}
.rb-tile:hover .rb-tile-cap,.rb-tile:focus-visible .rb-tile-cap{transform:none}
.rb-tile-no{position:absolute;left:10px;top:8px;font-size:10px;letter-spacing:.15em;color:#fffdf4;mix-blend-mode:difference}
.rb-tile:after{content:"";position:absolute;inset:0;border:1px solid rgba(255,253,244,.08);pointer-events:none;transition:border-color .4s}
.rb-tile:hover:after{border-color:var(--rb-accent)}

.rb-motion{max-width:1240px;margin:0 auto}
.rb-film{position:relative;aspect-ratio:16/9;overflow:hidden;background:#000;border-radius:4px;will-change:transform}
.rb-film svg{width:100%;height:100%;display:block}
.rb-film-hud{position:absolute;inset:0;pointer-events:none;font-size:clamp(9px,1vw,12px);letter-spacing:.14em;color:#fffdf4}
.rb-film-hud>*{position:absolute}
.rb-rec{left:3%;top:5%;display:flex;align-items:center;gap:8px}
.rb-rec i{width:9px;height:9px;border-radius:50%;background:#ff3b30;animation:rb-blink 1.2s steps(2) infinite}
.rb-tc{right:3%;top:5%;font-variant-numeric:tabular-nums}
.rb-meta{left:3%;bottom:5%;opacity:.75}
.rb-corner{width:22px;height:22px;border-color:rgba(255,253,244,.8);border-style:solid;border-width:0}
.rb-corner.a{left:1.5%;top:2.5%;border-left-width:2px;border-top-width:2px}
.rb-corner.b{right:1.5%;top:2.5%;border-right-width:2px;border-top-width:2px}
.rb-corner.c{left:1.5%;bottom:2.5%;border-left-width:2px;border-bottom-width:2px}
.rb-corner.d{right:1.5%;bottom:2.5%;border-right-width:2px;border-bottom-width:2px}
.rb-bars{position:absolute;left:0;right:0;height:9%;background:#000;pointer-events:none}
.rb-controls{display:flex;flex-wrap:wrap;gap:10px;justify-content:space-between;align-items:center;margin-top:18px}
.rb-toggles{display:flex;flex-wrap:wrap;gap:8px}
.rb-tog{display:flex;align-items:center;gap:8px;border:1px solid rgba(255,253,244,.22);padding:8px 14px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;transition:background .25s,color .25s,border-color .25s}
.rb-tog i{width:7px;height:7px;border-radius:50%;background:rgba(255,253,244,.3);transition:background .25s,box-shadow .25s}
.rb-tog[aria-pressed=true] i{background:var(--rb-accent);box-shadow:0 0 10px var(--rb-accent)}
.rb-tog:hover{border-color:var(--rb-accent)}
.rb-moods{display:flex;align-items:center;gap:8px;font-size:11px;letter-spacing:.14em;text-transform:uppercase}
.rb-sw{width:26px;height:26px;border-radius:50%;border:2px solid transparent;outline:1px solid rgba(255,253,244,.25);outline-offset:2px;transition:transform .25s,outline-color .25s}
.rb-sw[aria-pressed=true]{outline-color:#fffdf4;transform:scale(1.12)}

.rb-marquee{overflow:hidden;border-block:1px solid rgba(255,253,244,.1);padding:18px 0;background:var(--rb-accent);color:#120f04}
.rb-track{display:flex;width:max-content;font-family:var(--rb-display);font-weight:900;font-size:clamp(28px,5vw,64px);letter-spacing:-.02em;line-height:1;will-change:transform}
.rb-track span{padding-right:.6em;white-space:nowrap}
.rb-credits{display:grid;grid-template-columns:1.3fr 1fr;gap:clamp(32px,6vw,90px);max-width:1180px;margin:0 auto;align-items:end}
.rb-big{font-family:var(--rb-display);font-weight:900;font-size:clamp(56px,11vw,170px);line-height:.85;letter-spacing:-.05em;margin:0;color:transparent;-webkit-text-stroke:1.5px rgba(255,253,244,.5);position:relative}
.rb-big span{position:absolute;left:0;top:0;color:var(--rb-accent);-webkit-text-stroke:0;clip-path:inset(0 100% 0 0)}
.rb-roles{list-style:none;margin:0;padding:0;display:grid;gap:14px}
.rb-roles li{display:flex;justify-content:space-between;gap:16px;border-bottom:1px solid rgba(255,253,244,.12);padding-bottom:12px;font-size:12px}
.rb-roles span{color:rgba(243,239,226,.55);letter-spacing:.12em;text-transform:uppercase;font-size:10px}
.rb-sig{display:flex;align-items:center;justify-content:space-between;gap:16px;max-width:1180px;margin:clamp(40px,6vw,80px) auto 0;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:rgba(243,239,226,.6)}
.rb-sig em{font-family:var(--rb-script);font-style:normal;font-size:44px;letter-spacing:0;text-transform:none;color:var(--rb-accent)}
.rb-top{border:1px solid rgba(255,253,244,.25);padding:10px 16px;transition:background .25s,color .25s}
.rb-top:hover{background:var(--rb-accent);color:#111}

.rb-lb{position:fixed;inset:0;z-index:60;display:grid;place-items:center;background:rgba(2,3,3,.92);opacity:0;pointer-events:none}
.rb-lb.is-open{pointer-events:auto}
.rb-lb-frame{position:relative;width:min(92vw,calc((100svh - 160px) * 16 / 9));aspect-ratio:16/9;background:#000;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.6)}
.rb-lb-frame svg{width:100%;height:100%;display:block}
.rb-lb-bar{display:flex;justify-content:space-between;align-items:center;gap:12px;width:min(92vw,calc((100svh - 160px) * 16 / 9));margin-top:14px;font-size:11px;letter-spacing:.12em;text-transform:uppercase}
.rb-lb-bar h4{margin:0;font-family:var(--rb-display);font-size:clamp(16px,2vw,24px);letter-spacing:-.01em;text-transform:none;font-weight:800;color:#fffdf4}
.rb-lb-bar b{color:var(--rb-accent);font-weight:600}
.rb-lb-btns{display:flex;gap:6px}
.rb-lb-btns button{border:1px solid rgba(255,253,244,.25);padding:8px 12px;transition:background .2s,color .2s}
.rb-lb-btns button:hover{background:var(--rb-accent);color:#111}
.rb-lb-mark{fill:none;stroke:var(--rb-accent);stroke-width:3;vector-effect:non-scaling-stroke}

.rb-jelly{transform-box:fill-box;transform-origin:50% 30%;animation:rb-jelly 9s ease-in-out infinite;animation-play-state:var(--rb-play,running)}
.rb-tent{transform-box:fill-box;transform-origin:50% 0;animation:rb-tent 3.2s ease-in-out infinite;animation-play-state:var(--rb-play,running)}
.rb-swing{transform-box:view-box;transform-origin:430px 0;animation:rb-swing 6s ease-in-out infinite;animation-play-state:var(--rb-play,running)}
.rb-dust{animation:rb-dust 14s linear infinite;animation-play-state:var(--rb-play,running)}
.rb-steam{animation:rb-steam 3.6s ease-in-out infinite;animation-play-state:var(--rb-play,running)}
.rb-spark{stroke-dasharray:6 40;animation:rb-spark .9s linear infinite;animation-play-state:var(--rb-play,running)}
.rb-sparks{opacity:var(--rb-sparks,1)}
.rb-spark-core{animation:rb-flash .45s steps(3) infinite;animation-play-state:var(--rb-play,running)}
.rb-wave{stroke-dasharray:.25 .75;animation:rb-wave 2.4s linear infinite;animation-play-state:var(--rb-play,running);opacity:var(--rb-lamp,1)}
.rb-crt{animation:rb-crt 4s steps(1) infinite;animation-play-state:var(--rb-play,running)}
.rb-power{opacity:var(--rb-lamp,1)}
.rb-cone{mix-blend-mode:screen}
.rb-blink{animation:rb-blink 1.4s steps(2) infinite;animation-play-state:var(--rb-play,running)}
.rb-fan{transform-box:fill-box;transform-origin:center;animation:rb-spin .5s linear infinite;animation-play-state:var(--rb-play,running)}
.rb-glint{animation:rb-glint 5s ease-in-out infinite;animation-play-state:var(--rb-play,running)}
.rb-tint{fill:var(--rb-tint,transparent);mix-blend-mode:color;opacity:.85}
.rb-dark{fill:#02060a;opacity:var(--rb-dark,0);pointer-events:none}

@keyframes rb-jelly{0%,100%{transform:translateY(0) scale(1,1)}25%{transform:translateY(-14px) scale(1.04,.94)}50%{transform:translateY(-30px) scale(.97,1.05)}75%{transform:translateY(-12px) scale(1.02,.97)}}
@keyframes rb-tent{0%,100%{transform:skewX(0)}50%{transform:skewX(8deg)}}
@keyframes rb-swing{0%,100%{transform:rotate(-1.4deg)}50%{transform:rotate(1.4deg)}}
@keyframes rb-dust{0%{transform:translate(0,0)}25%{transform:translate(14px,-22px)}50%{transform:translate(-6px,-44px)}75%{transform:translate(-18px,-20px)}100%{transform:translate(0,0)}}
@keyframes rb-steam{0%{transform:translateY(6px);opacity:0}30%{opacity:1}100%{transform:translateY(-18px);opacity:0}}
@keyframes rb-spark{0%{stroke-dashoffset:46;opacity:1}100%{stroke-dashoffset:0;opacity:0}}
@keyframes rb-flash{0%{opacity:1}50%{opacity:.35}100%{opacity:.8}}
@keyframes rb-wave{to{stroke-dashoffset:-1}}
@keyframes rb-crt{0%,100%{opacity:1}47%{opacity:1}48%{opacity:.55}49%{opacity:1}83%{opacity:.8}84%{opacity:1}}
@keyframes rb-blink{to{opacity:.15}}
@keyframes rb-spin{to{transform:rotate(360deg)}}
@keyframes rb-glint{0%,70%,100%{opacity:.3}80%{opacity:1}}
@keyframes rb-ping{0%{transform:scale(.9);opacity:.9}100%{transform:scale(2.1);opacity:0}}
@keyframes rb-grain{0%{transform:translate(0,0)}20%{transform:translate(-4%,3%)}40%{transform:translate(3%,-5%)}60%{transform:translate(-6%,-2%)}80%{transform:translate(5%,4%)}100%{transform:translate(0,0)}}
@keyframes rb-hint{0%{transform:scaleY(0)}50%{transform:scaleY(1)}100%{transform:scaleY(0);transform-origin:bottom}}

@media (max-width:760px){
.rb-grid{grid-template-columns:repeat(2,1fr)}
.rb-credits{grid-template-columns:1fr}
.rb-chapters{display:none}
.rb-note{display:none}
.rb-poster{top:17%}
.rb-titlebox{width:94vw}
.rb-title{font-size:20vw}
.rb-barcode{display:none}
.rb-issue{top:-62%;left:2%}
.rb-date{top:calc(100% + 14px);left:2%}
.rb-icons{top:calc(100% + 70px);left:2%}
.rb-record{top:calc(100% + 18px);right:2%}
.rb-bubble{left:58%;top:74%}
.rb-lb-bar{flex-wrap:wrap}
.rb-lb-btns button{padding:8px 10px}
.rb-sig{flex-direction:column;align-items:flex-start}
}
@media (prefers-reduced-motion:reduce){
.rb-jelly,.rb-tent,.rb-swing,.rb-dust,.rb-steam,.rb-spark,.rb-spark-core,.rb-wave,.rb-crt,.rb-blink,.rb-fan,.rb-glint,.rb-grain,.rb-hot .rb-ring,.rb-rec i,.rb-scrollhint span{animation:none}
.rb-tile-in,.rb-tile-cap{transition:none}
}
`

// ---- helpers ------------------------------------------------------------------

const useIso = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect

function Chars({ text, className }: { text: string; className?: string }) {
  return (
    <>
      {Array.from(text).map((c, i) => (
        <span key={i} className={className} aria-hidden="true">
          <span>{c === " " ? " " : c}</span>
        </span>
      ))}
    </>
  )
}

const Arrow = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <path d="M18 6 L6 18 M6 8 V18 H16" />
  </svg>
)
const Star = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <path d="M12 3 V21 M4 7.5 L20 16.5 M20 7.5 L4 16.5" />
  </svg>
)
const Cross = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <path d="M5 5 L19 19 M19 5 L5 19" />
  </svg>
)

// ---- the template ---------------------------------------------------------------

export default function RepairBayConceptTemplate({
  issue = "No.11",
  kicker = "Concept art",
  title = "Tinkerer",
  year = "2026",
  date = "10 / 31",
  bubble = "BZZZT!!",
  note = "</ tonight: a pocket radio that swears it is fine. it hums one note at the jellyfish, and breaks again the moment you look away />",
  recordLabel = "Record by",
  signature = "Wren",
  problem = { top: "STRANGE", bottom: "SIGNAL", tag: "the night shift" },
  hotspots = RB_HOTSPOTS,
  crops = RB_CROPS,
  credits = RB_CREDITS,
  moods = RB_MOODS,
  detailsLabel = "Details",
  motionLabel = "Dynamics",
  accent = "#e9b518",
  accents = ["#ff6b3d", "#36c9b5", "#f2f0e6"],
  sceneImage,
  sceneAlt = "Concept art: an old badger mechanic and a fox apprentice repairing a small radio at a cluttered bench, in front of a glowing tank of jellyfish",
  windowRect = RB_WINDOW,
  height = "100svh",
  fontHref = RB_FONTS,
  displayFont = "'Outfit', ui-sans-serif, system-ui, sans-serif",
  brushFont = "'Permanent Marker', 'Comic Sans MS', cursive",
  monoFont = "'JetBrains Mono', ui-monospace, SFMono-Regular, monospace",
  scriptFont = "'Caveat', 'Segoe Script', cursive",
  className,
}: RepairBayConceptTemplateProps) {
  const p = "rb" + React.useId().replace(/[^a-zA-Z0-9]/g, "")
  const L = (n: number) => "#" + p + "-L" + n
  const scene = "#" + p + "-scene"
  const win = windowRect

  const rootRef = React.useRef(null as HTMLDivElement | null)
  const lbRef = React.useRef(null as HTMLDivElement | null)
  const lbSvgRef = React.useRef(null as SVGSVGElement | null)
  const filmRef = React.useRef(null as HTMLDivElement | null)
  const tcRef = React.useRef(null as HTMLSpanElement | null)
  const lastFocus = React.useRef(null as HTMLElement | null)

  const [rm, setRm] = React.useState(false)
  const [phase, setPhase] = React.useState(0)
  const [hot, setHot] = React.useState(0)
  const [accentIdx, setAccentIdx] = React.useState(0)
  const [frozen, setFrozen] = React.useState(false)
  const [power, setPower] = React.useState(true)
  const [sparks, setSparks] = React.useState(true)
  const [mood, setMood] = React.useState(0)
  const [open, setOpen] = React.useState(-1)
  const [zoomOut, setZoomOut] = React.useState(false)

  const palette = [accent, ...accents]
  const acc = palette[accentIdx % palette.length]
  const phaseRef = React.useRef(0)

  // reduced motion
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const on = () => setRm(mq.matches)
    on()
    mq.addEventListener("change", on)
    return () => mq.removeEventListener("change", on)
  }, [])

  // intro + the long scroll timeline of the sticky stage
  useIso(() => {
    const root = rootRef.current
    if (!root) return
    const q = gsap.utils.selector(root)
    let alive = true
    const ctx = gsap.context(() => {
      const chars = q(".rb-title .rb-ch")
      const inner = q(".rb-title .rb-ch > span")
      const hudLines = q(".rb-hud .rb-draw")
      const hudBits = q(".rb-hud-bit")
      const bubbleEl = q(".rb-bubble")
      const poster = q(".rb-yellow")
      const cam = q(".rb-cam")
      const black = q(".rb-black")
      const brush = q(".rb-brush")
      const brushIn = q(".rb-brush-in")
      const brushChars = q(".rb-brush-line span")
      const brushTag = q(".rb-brush-tag")
      const hots = q(".rb-hot > g")
      const panel = q(".rb-panel")
      const hint = q(".rb-scrollhint")

      // intro
      gsap.set(hudLines, { strokeDasharray: 1, strokeDashoffset: rm ? 0 : 1 })
      const intro = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } })
      if (rm) {
        intro.from([inner, hudBits, bubbleEl], { opacity: 0, duration: 0.6 })
      } else {
        intro
          .from(q(".rb-cam > svg"), { opacity: 0, duration: 1.4, ease: "power2.out" }, 0)
          .from(poster, { attr: { height: 0 }, duration: 0.9, ease: "power4.inOut" }, 0)
          .from(inner, { yPercent: 115, rotate: 8, duration: 0.9, stagger: 0.05 }, 0.35)
          .to(hudLines, { strokeDashoffset: 0, duration: 1.1, stagger: 0.06, ease: "power2.inOut" }, 0.6)
          .from(hudBits, { opacity: 0, y: 14, duration: 0.6, stagger: 0.06 }, 0.9)
          .from(bubbleEl, { scale: 0, rotate: -30, duration: 0.9, ease: "elastic.out(1, 0.45)" }, 1.25)
          .from(hint, { opacity: 0, y: 10, duration: 0.6 }, 1.5)
      }
      const fonts = (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts
      const go = () => alive && intro.play()
      const t = window.setTimeout(go, 900)
      fonts?.ready.then(() => {
        window.clearTimeout(t)
        go()
      })

      // scroll
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: q(".rb-hero")[0],
          start: "top top",
          end: "bottom bottom",
          scrub: rm ? true : 0.7,
          onUpdate: (self) => {
            const pr = self.progress
            const ph = pr < 0.2 ? 0 : pr < 0.56 ? 1 : pr < 0.8 ? 2 : 3
            if (ph !== phaseRef.current) {
              phaseRef.current = ph
              setPhase(ph)
            }
          },
        },
      })
      tl.set({}, {}, 1)
      if (rm) {
        tl.to([chars, hudBits, bubbleEl, q(".rb-hud")], { opacity: 0, duration: 0.1 }, 0.06)
          .to(black, { opacity: 1, duration: 0.08 }, 0.18)
          .to(brush, { opacity: 1, duration: 0.06 }, 0.28)
          .to(brush, { opacity: 0, duration: 0.06 }, 0.5)
          .to(poster, { opacity: 0, duration: 0.01 }, 0.45)
          .to(black, { opacity: 0, duration: 0.08 }, 0.58)
          .to(panel, { opacity: 1, duration: 0.05 }, 0.82)
          .fromTo(hots, { opacity: 0 }, { opacity: 1, duration: 0.05 }, 0.82)
      } else {
        tl.to(hint, { opacity: 0, duration: 0.04 }, 0.01)
          .to(cam, { scale: 1.12, duration: 0.22, ease: "power1.in" }, 0)
          .to(chars, { yPercent: -130, opacity: 0, rotate: (i: number) => (i % 2 ? 10 : -10), duration: 0.12, stagger: { each: 0.008, from: "center" } }, 0.04)
          .to(q(".rb-hud"), { opacity: 0, y: -40, duration: 0.1 }, 0.05)
          .to(hudBits, { opacity: 0, y: -24, duration: 0.08, stagger: 0.008 }, 0.04)
          .to(bubbleEl, { scale: 0, rotate: 25, duration: 0.06 }, 0.05)
          .to(black, { opacity: 1, duration: 0.08 }, 0.17)
          .set(brush, { opacity: 1 }, 0.24)
          .fromTo(brushIn, { clipPath: "inset(0% 100% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.12, ease: "power2.out" }, 0.25)
          .fromTo(brushChars, { yPercent: 50, rotate: -12, opacity: 0 }, { yPercent: 0, rotate: 0, opacity: 1, duration: 0.08, stagger: 0.006, ease: "back.out(2)" }, 0.25)
          .fromTo(brushTag, { opacity: 0, letterSpacing: "1.2em" }, { opacity: 1, letterSpacing: "0.3em", duration: 0.08 }, 0.32)
          .fromTo(brushIn, { scale: 1 }, { scale: 1.08, duration: 0.2 }, 0.3)
          .to(brushChars, { yPercent: -60, opacity: 0, rotate: 10, duration: 0.07, stagger: { each: 0.004, from: "random" } }, 0.48)
          .to(brushTag, { opacity: 0, duration: 0.04 }, 0.48)
          // the poster shrinks into the window while the room is dark
          .to(poster, { attr: { x: win.x, y: win.y, width: win.w, height: win.h }, duration: 0.16, ease: "power2.inOut" }, 0.3)
          .set(cam, { scale: 1.4 }, 0.52)
          .to(black, { opacity: 0, duration: 0.1 }, 0.56)
          .to(cam, { scale: 1, duration: 0.26, ease: "power2.out" }, 0.56)
          .to(poster, { opacity: 0, duration: 0.14, ease: "power1.in" }, 0.6)
          .fromTo(hots, { scale: 0, opacity: 0, transformOrigin: "50% 50%" }, { scale: 1, opacity: 1, duration: 0.05, stagger: 0.015, ease: "back.out(3)" }, 0.8)
          .fromTo(panel, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.06 }, 0.83)
      }

      // details: tiles wipe in
      const tiles = q(".rb-tile")
      if (tiles.length) {
        gsap.fromTo(
          tiles,
          rm ? { opacity: 0 } : { clipPath: "inset(100% 0% 0% 0%)", y: 40 },
          {
            ...(rm ? { opacity: 1 } : { clipPath: "inset(0% 0% 0% 0%)", y: 0 }),
            duration: 1,
            ease: "power3.out",
            stagger: { each: 0.08, grid: "auto", from: "start" },
            scrollTrigger: { trigger: q(".rb-grid")[0], start: "top 80%" },
          },
        )
        if (!rm)
          gsap.fromTo(
            q(".rb-tile-in"),
            { scale: 1.35 },
            { scale: 1, duration: 1.4, ease: "power3.out", stagger: 0.08, scrollTrigger: { trigger: q(".rb-grid")[0], start: "top 80%" }, clearProps: "transform" },
          )
      }

      // dynamics: the film frame opens up as it scrolls in
      if (!rm) {
        gsap.fromTo(
          q(".rb-film"),
          { scale: 0.82, borderRadius: 28 },
          { scale: 1, borderRadius: 4, ease: "none", scrollTrigger: { trigger: q(".rb-film")[0], start: "top bottom", end: "center center", scrub: 0.6 } },
        )
        gsap.fromTo(q(".rb-bars.t"), { yPercent: 0 }, { yPercent: -100, ease: "none", scrollTrigger: { trigger: q(".rb-film")[0], start: "top 70%", end: "center center", scrub: 0.6 } })
        gsap.fromTo(q(".rb-bars.b"), { yPercent: 0 }, { yPercent: 100, ease: "none", scrollTrigger: { trigger: q(".rb-film")[0], start: "top 70%", end: "center center", scrub: 0.6 } })
      }

      // credits: the outlined word fills in
      gsap.to(q(".rb-big span"), {
        clipPath: "inset(0 0% 0 0)",
        ease: "none",
        scrollTrigger: { trigger: q(".rb-credits")[0], start: "top 85%", end: "top 35%", scrub: rm ? true : 0.6 },
      })
      // marquee: runs on its own, faster with scroll velocity
      const track = q(".rb-track")[0]
      if (track && !rm) {
        const loop = gsap.to(track, { xPercent: -50, duration: 22, ease: "none", repeat: -1 })
        ScrollTrigger.create({
          trigger: track,
          start: "top bottom",
          end: "bottom top",
          onUpdate: (self) => {
            const v = Math.min(4, 1 + Math.abs(self.getVelocity()) / 600)
            gsap.to(loop, { timeScale: self.direction < 0 ? -v : v, duration: 0.3, overwrite: true })
          },
        })
      }
    }, root)
    return () => {
      alive = false
      ctx.revert()
    }
  }, [rm, win.x, win.y, win.w, win.h])

  // pointer parallax on the four layers of the stage
  React.useEffect(() => {
    const root = rootRef.current
    if (!root || rm) return
    const stage = root.querySelector(".rb-stage") as HTMLElement | null
    if (!stage) return
    const layers = Array.from(root.querySelectorAll(".rb-par")) as Element[]
    const depth = [6, 14, 22, 36]
    const xs = layers.map((el) => gsap.quickTo(el, "x", { duration: 1, ease: "power3.out" }))
    const ys = layers.map((el) => gsap.quickTo(el, "y", { duration: 1, ease: "power3.out" }))
    const titleEl = root.querySelector(".rb-titlebox")
    const tx = titleEl ? gsap.quickTo(titleEl, "x", { duration: 1.2, ease: "power3.out" }) : null
    const onMove = (e: PointerEvent) => {
      const r = stage.getBoundingClientRect()
      const nx = (e.clientX - r.left) / r.width - 0.5
      const ny = (e.clientY - r.top) / r.height - 0.5
      layers.forEach((el, i) => {
        const d = depth[Number((el as HTMLElement).dataset.depth ?? i) % depth.length]
        xs[i](-nx * d)
        ys[i](-ny * d * 0.6)
      })
      tx?.(nx * 18)
    }
    stage.addEventListener("pointermove", onMove)
    return () => stage.removeEventListener("pointermove", onMove)
  }, [rm])

  // film timecode
  React.useEffect(() => {
    let raf = 0
    const t0 = performance.now()
    let paused = 0
    let pausedAt = 0
    const tick = (now: number) => {
      if (frozen) {
        if (!pausedAt) pausedAt = now
      } else if (pausedAt) {
        paused += now - pausedAt
        pausedAt = 0
      }
      const el = tcRef.current
      if (el && !pausedAt) el.textContent = rbTimecode((now - t0 - paused) / 1000)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [frozen])

  // power: a flicker down or up, tweened on the film's CSS variables
  const flip = React.useCallback(
    (on: boolean) => {
      setPower(on)
      const el = filmRef.current
      if (!el) return
      if (rm) {
        gsap.set(el, { "--rb-lamp": on ? 1 : 0.08, "--rb-dark": on ? 0 : 0.55 })
        return
      }
      const tl = gsap.timeline()
      if (on)
        tl.to(el, { "--rb-lamp": 0.6, "--rb-dark": 0.3, duration: 0.05 })
          .to(el, { "--rb-lamp": 0.1, "--rb-dark": 0.5, duration: 0.06 })
          .to(el, { "--rb-lamp": 0.9, "--rb-dark": 0.1, duration: 0.05 })
          .to(el, { "--rb-lamp": 0.3, duration: 0.08 })
          .to(el, { "--rb-lamp": 1, "--rb-dark": 0, duration: 0.4, ease: "power2.out" })
      else
        tl.to(el, { "--rb-lamp": 0.3, duration: 0.05 })
          .to(el, { "--rb-lamp": 0.9, duration: 0.05 })
          .to(el, { "--rb-lamp": 0.08, "--rb-dark": 0.55, duration: 0.6, ease: "power2.in" })
    },
    [rm],
  )

  // ---- the viewer ------------------------------------------------------------
  const view = (i: number, out: boolean) => (out ? { x: 0, y: 0, w: RB_W, h: RB_H } : rbFitView(crops[i], 16 / 9))

  const openAt = (i: number, from: HTMLElement) => {
    lastFocus.current = from
    setZoomOut(false)
    setOpen(i)
    const lb = lbRef.current
    const svg = lbSvgRef.current
    if (!lb || !svg) return
    const c = crops[i]
    svg.setAttribute("viewBox", rbView(rm ? view(i, false) : { x: c.x, y: c.y, w: c.size, h: c.size }))
    gsap.to(lb, { opacity: 1, duration: rm ? 0.2 : 0.35 })
    if (!rm) {
      const frame = lb.querySelector(".rb-lb-frame") as HTMLElement
      const a = from.getBoundingClientRect()
      const b = frame.getBoundingClientRect()
      gsap.fromTo(
        frame,
        { x: a.left + a.width / 2 - (b.left + b.width / 2), y: a.top + a.height / 2 - (b.top + b.height / 2), scale: a.width / b.width },
        { x: 0, y: 0, scale: 1, duration: 0.8, ease: "expo.out" },
      )
      gsap.to(svg, { attr: { viewBox: rbView(view(i, false)) }, duration: 1, ease: "expo.out" })
    }
  }
  const go = React.useCallback(
    (i: number, out: boolean) => {
      const svg = lbSvgRef.current
      const n = crops.length
      const k = ((i % n) + n) % n
      setOpen(k)
      setZoomOut(out)
      if (svg) gsap.to(svg, { attr: { viewBox: rbView(view(k, out)) }, duration: rm ? 0 : 1.1, ease: "power3.inOut", overwrite: true })
    },
    [crops, rm],
  )
  const close = React.useCallback(() => {
    const lb = lbRef.current
    if (!lb) return
    gsap.to(lb, {
      opacity: 0,
      duration: 0.3,
      onComplete: () => {
        setOpen(-1)
        lastFocus.current?.focus()
      },
    })
  }, [])

  React.useEffect(() => {
    if (open < 0) return
    const html = document.documentElement
    const prev = html.style.overflow
    html.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close()
      else if (e.key === "ArrowRight") go(open + 1, zoomOut)
      else if (e.key === "ArrowLeft") go(open - 1, zoomOut)
    }
    window.addEventListener("keydown", onKey)
    ;(lbRef.current?.querySelector(".rb-lb-close") as HTMLElement | null)?.focus()
    return () => {
      window.removeEventListener("keydown", onKey)
      html.style.overflow = prev
    }
  }, [open, zoomOut, go, close])

  const scrollToSel = (sel: string) => {
    const el = rootRef.current?.querySelector(sel)
    if (el) el.scrollIntoView({ behavior: rm ? "auto" : "smooth", block: "start" })
  }

  const h = hotspots[hot]
  const film = {
    "--rb-play": frozen ? "paused" : "running",
    "--rb-sparks": sparks ? 1 : 0,
    "--rb-tint": moods[mood]?.tint ?? "transparent",
  } as React.CSSProperties
  const oc = open >= 0 ? crops[open] : null

  return (
    <div
      ref={rootRef}
      className={"rb-root" + (className ? " " + className : "")}
      style={
        {
          "--h": height,
          "--rb-accent": acc,
          "--rb-display": displayFont,
          "--rb-brush": brushFont,
          "--rb-mono": monoFont,
          "--rb-script": scriptFont,
          "--rb-play": frozen ? "paused" : "running",
        } as React.CSSProperties
      }
    >
      {fontHref && <link rel="stylesheet" href={fontHref} />}
      <style>{RB_CSS}</style>

      <svg className="rb-defs" aria-hidden="true" focusable="false">
        <defs>
          <filter id="rb-rough" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="4" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="7" xChannelSelector="R" yChannelSelector="G" result="d" />
            <feTurbulence type="fractalNoise" baseFrequency="0.004 0.22" numOctaves="2" seed="9" result="g" />
            <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -3.2 0 0 0 2.6" result="m" />
            <feComposite in="d" in2="m" operator="in" />
          </filter>
          <filter id={p + "-noise"}>
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <RbArt p={p} image={sceneImage} imageAlt={sceneAlt} win={win} />
        </defs>
      </svg>

      {/* ---- hero: poster → problem → room → explore --------------------- */}
      <section className="rb-hero" aria-label={title + ", " + kicker + " " + issue}>
        <div className="rb-stage">
          <div className="rb-cam">
            <svg viewBox={"0 0 " + RB_W + " " + RB_H} preserveAspectRatio="xMidYMid slice" role="img" aria-label={sceneAlt}>
              <g className="rb-par" data-depth="0">
                <use href={L(0)} />
              </g>
              <rect className="rb-yellow" x="-60" y="58" width={RB_W + 120} height={win.y + win.h - 58} fill={acc} />
            </svg>
            <div className="rb-poster">
              <div className="rb-titlebox">
                <svg className="rb-hud" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                  <rect className="rb-draw" x="0.5" y="0.5" width="99" height="99" fill="none" stroke="#fffdf4" strokeOpacity="0.85" strokeWidth="1.2" pathLength={1} />
                  <path className="rb-draw" d="M0 0 L100 100 M100 0 L0 100" stroke="#fffdf4" strokeOpacity="0.4" strokeWidth="1" pathLength={1} />
                  <path className="rb-draw" d="M0 62 H100 M34 0 V100" stroke="#fffdf4" strokeOpacity="0.3" strokeWidth="1" pathLength={1} />
                </svg>
                <div className="rb-issue rb-hud-bit">
                  <b>{issue}</b>
                  <i>{kicker}</i>
                </div>
                <svg className="rb-hud-bit rb-barcode" viewBox="0 0 200 14" style={{ position: "absolute", right: "3%", top: "-14%", width: "min(28vw, 300px)", height: "auto" }} aria-hidden="true">
                  <rect x="0" y="0" width="96" height="14" fill="#fffdf4" />
                  {[104, 112, 118, 130, 134, 146, 150, 154, 166, 172, 180, 186, 194].map((x, i) => (
                    <rect key={x} x={x} y="0" width={i % 3 ? 2.5 : 5} height="14" fill="#fffdf4" />
                  ))}
                </svg>
                <h1 className="rb-title" aria-label={title}>
                  <Chars text={title} className="rb-ch" />
                </h1>
                <div className="rb-date rb-hud-bit">
                  {year}
                  <small>{date}</small>
                </div>
                <div className="rb-icons rb-hud-bit">
                  <button type="button" className="rb-icon" aria-label="Jump to the details" onClick={() => scrollToSel(".rb-details")}>
                    <Arrow />
                  </button>
                  <button type="button" className="rb-icon" aria-label="Change the poster colour" onClick={() => setAccentIdx((i) => i + 1)}>
                    <Star />
                  </button>
                  <button
                    type="button"
                    className="rb-icon"
                    aria-label={frozen ? "Resume the animation" : "Freeze the animation"}
                    aria-pressed={frozen}
                    onClick={() => setFrozen((f) => !f)}
                  >
                    <Cross />
                  </button>
                </div>
                {bubble ? <div className="rb-bubble">{bubble}</div> : null}
                <p className="rb-note rb-hud-bit">{note}</p>
                <div className="rb-record rb-hud-bit">
                  {recordLabel} <em>{signature}</em>
                </div>
              </div>
            </div>
            <svg className="rb-front" viewBox={"0 0 " + RB_W + " " + RB_H} preserveAspectRatio="xMidYMid slice" aria-hidden={phase < 3}>
              <g className="rb-par" data-depth="1">
                <use href={L(1)} />
              </g>
              <g className="rb-par" data-depth="2">
                <use href={L(2)} />
              </g>
              <g className="rb-par" data-depth="3">
                <use href={L(3)} />
              </g>
              <g className="rb-par" data-depth="2" style={{ visibility: phase >= 3 ? "visible" : "hidden" }}>
                {hotspots.map((s, i) => (
                  <g
                    key={i}
                    className={"rb-hot" + (i === hot ? " is-on" : "")}
                    transform={"translate(" + s.x + " " + s.y + ")"}
                    role="button"
                    tabIndex={phase >= 3 ? 0 : -1}
                    aria-label={String(i + 1).padStart(2, "0") + ": " + s.label}
                    aria-pressed={i === hot}
                    onClick={() => setHot(i)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        setHot(i)
                      }
                    }}
                  >
                    <g>
                      <circle className="rb-ring" r="16" />
                      <circle className="rb-dot" r="16" />
                      <text>{i + 1}</text>
                    </g>
                  </g>
                ))}
              </g>
            </svg>
          </div>
          <div className="rb-black" />
          <div className="rb-brush" aria-hidden={phase !== 1}>
            <div className="rb-brush-in">
              <div className="rb-brush-line">
                {Array.from(problem.top).map((c, i) => (
                  <span key={i}>{c === " " ? " " : c}</span>
                ))}
              </div>
              <div className="rb-brush-tag">{problem.tag}</div>
              <div className="rb-brush-line">
                {Array.from(problem.bottom).map((c, i) => (
                  <span key={i}>{c === " " ? " " : c}</span>
                ))}
              </div>
            </div>
          </div>
          <svg className="rb-grain" aria-hidden="true">
            <rect width="100%" height="100%" filter={"url(#" + p + "-noise)"} />
          </svg>
          <nav className="rb-chapters" aria-label="Chapters">
            {["Poster", problem.top.toLowerCase(), "The room", "Explore"].map((t, i) => (
              <div key={i} className={"rb-chap" + (phase === i ? " is-on" : "")}>
                <span>{String(i + 1).padStart(2, "0") + " " + t}</span>
                <i />
              </div>
            ))}
          </nav>
          <div className="rb-scrollhint" aria-hidden="true">
            scroll
            <span />
          </div>
          <div className={"rb-panel" + (phase >= 3 ? " is-live" : "")} aria-live="polite">
            <div className="rb-panel-top">
              <span>
                Exhibit {String(hot + 1).padStart(2, "0")} / {String(hotspots.length).padStart(2, "0")}
              </span>
              <div className="rb-panel-nav">
                <button type="button" aria-label="Previous exhibit" tabIndex={phase >= 3 ? 0 : -1} onClick={() => setHot((hot - 1 + hotspots.length) % hotspots.length)}>
                  ←
                </button>
                <button type="button" aria-label="Next exhibit" tabIndex={phase >= 3 ? 0 : -1} onClick={() => setHot((hot + 1) % hotspots.length)}>
                  →
                </button>
              </div>
            </div>
            <h3>{h?.label}</h3>
            <p>{h?.note}</p>
          </div>
        </div>
      </section>

      {/* ---- details ------------------------------------------------------------ */}
      <section className="rb-sec rb-details" aria-label={detailsLabel}>
        <h2 className="rb-label">{detailsLabel}</h2>
        <div className="rb-grid">
          {crops.map((c, i) => (
            <button key={i} type="button" className="rb-tile" aria-label={"Open detail " + (i + 1) + ": " + c.caption} onClick={(e) => openAt(i, e.currentTarget)}>
              <div className="rb-tile-in">
                <svg viewBox={c.x + " " + c.y + " " + c.size + " " + c.size} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
                  <use href={scene} width={RB_W} height={RB_H} />
                </svg>
              </div>
              <span className="rb-tile-no">{String(i + 1).padStart(2, "0")}</span>
              <span className="rb-tile-cap">
                <span>{c.caption}</span>
                <b>↗</b>
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* ---- dynamics ----------------------------------------------------------- */}
      <section className="rb-sec rb-dyn" aria-label={motionLabel} style={{ paddingTop: 0 }}>
        <h2 className="rb-label">{motionLabel}</h2>
        <div className="rb-motion">
          <div className="rb-film" ref={filmRef} style={film}>
            <svg viewBox={"0 0 " + RB_W + " " + RB_H} preserveAspectRatio="xMidYMid slice" role="img" aria-label={sceneAlt}>
              <use href={scene} width={RB_W} height={RB_H} />
            </svg>
            <div className="rb-bars t" style={{ top: 0 }} />
            <div className="rb-bars b" style={{ bottom: 0 }} />
            <div className="rb-film-hud" aria-hidden="true">
              <span className="rb-rec">
                <i /> {frozen ? "PAUSED" : "REC"}
              </span>
              <span className="rb-tc" ref={tcRef}>
                00:00:00:00
              </span>
              <span className="rb-meta">
                {issue} · {title.toUpperCase()} · 24 FPS · {moods[mood]?.name.toUpperCase()}
              </span>
              <span className="rb-corner a" />
              <span className="rb-corner b" />
              <span className="rb-corner c" />
              <span className="rb-corner d" />
            </div>
          </div>
          <div className="rb-controls">
            <div className="rb-toggles">
              <button type="button" className="rb-tog" aria-pressed={power} onClick={() => flip(!power)}>
                <i /> Power
              </button>
              <button type="button" className="rb-tog" aria-pressed={sparks} onClick={() => setSparks((s) => !s)}>
                <i /> Sparks
              </button>
              <button type="button" className="rb-tog" aria-pressed={!frozen} onClick={() => setFrozen((f) => !f)}>
                <i /> {frozen ? "Frozen" : "Playing"}
              </button>
            </div>
            <div className="rb-moods" role="group" aria-label="Window mood">
              <span>Mood</span>
              {moods.map((m, i) => (
                <button
                  key={m.name}
                  type="button"
                  className="rb-sw"
                  aria-label={m.name}
                  aria-pressed={mood === i}
                  style={{ background: m.tint ?? "radial-gradient(circle at 40% 35%, #fff3b8, #e2a113 70%)" }}
                  onClick={() => setMood(i)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---- credits ------------------------------------------------------------ */}
      <div className="rb-marquee" aria-hidden="true">
        <div className="rb-track">
          {[0, 1].map((k) => (
            <span key={k}>
              {(issue + " ✱ " + kicker + " ✱ " + title + " ✱ " + problem.top + " " + problem.bottom + " ✱ " + year + " ✱ ").repeat(2)}
            </span>
          ))}
        </div>
      </div>
      <footer className="rb-sec">
        <div className="rb-credits">
          <h2 className="rb-big">
            {title}
            <span aria-hidden="true">{title}</span>
          </h2>
          <ul className="rb-roles">
            {credits.map((c) => (
              <li key={c.role}>
                <span>{c.role}</span>
                {c.name}
              </li>
            ))}
          </ul>
        </div>
        <div className="rb-sig">
          <span>
            {recordLabel} <em>{signature}</em>
          </span>
          <span>
            {issue} · {kicker} · {year}
          </span>
          <button type="button" className="rb-top" onClick={() => rootRef.current?.scrollIntoView({ behavior: rm ? "auto" : "smooth" })}>
            Back to the poster ↑
          </button>
        </div>
      </footer>

      {/* ---- viewer -------------------------------------------------------------- */}
      <div
        ref={lbRef}
        className={"rb-lb" + (open >= 0 ? " is-open" : "")}
        role="dialog"
        aria-modal="true"
        aria-hidden={open < 0}
        aria-label={oc ? "Detail: " + oc.caption : "Detail viewer"}
        onClick={(e) => {
          if (e.target === e.currentTarget) close()
        }}
      >
        <div>
          <div className="rb-lb-frame">
            <svg ref={lbSvgRef} viewBox={"0 0 " + RB_W + " " + RB_H} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
              <use href={scene} width={RB_W} height={RB_H} />
              {oc && zoomOut ? <rect className="rb-lb-mark" x={oc.x} y={oc.y} width={oc.size} height={oc.size} /> : null}
            </svg>
          </div>
          <div className="rb-lb-bar">
            <div>
              <b>
                {String(open + 1).padStart(2, "0")} / {String(crops.length).padStart(2, "0")}
              </b>
              <h4>{oc?.caption}</h4>
            </div>
            <div className="rb-lb-btns">
              <button type="button" onClick={() => go(open - 1, zoomOut)} aria-label="Previous detail" tabIndex={open < 0 ? -1 : 0}>
                ←
              </button>
              <button type="button" onClick={() => go(open, !zoomOut)} tabIndex={open < 0 ? -1 : 0}>
                {zoomOut ? "Zoom in" : "In the scene"}
              </button>
              <button type="button" onClick={() => go(open + 1, zoomOut)} aria-label="Next detail" tabIndex={open < 0 ? -1 : 0}>
                →
              </button>
              <button type="button" className="rb-lb-close" onClick={close} tabIndex={open < 0 ? -1 : 0}>
                Close ✕
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
