"use client"

import * as React from "react"

/**
 * Alter Ego Mask Reveal: a portrait landing page with a secret.
 *
 * A quiet civilian portrait sits on a charcoal backdrop. Move the pointer over
 * it and a gooey, liquid blob follows you, uncovering the masked hero
 * underneath, but only where you have been. The trail melts back within a
 * second, so the mask closes up behind you and disappears once you leave. Click
 * (or press Enter) to suit up completely; click again to take the mask off.
 *
 * Both portraits are SVG drawn from numbers, sharing one face geometry so the
 * mask lands exactly on the face. No images, no fonts, React is the only
 * import. Pass `baseSrc` / `revealSrc` to use your own two photos instead.
 */

export interface AlterEgoMaskRevealProps {
  /** Big stretched word behind the civilian. */
  word?: string
  /** Big stretched word behind the hero, seen through the mask. */
  revealWord?: string
  /** Civilian name line, top left. */
  name?: string
  /** Hero line, top left, seen through the mask. */
  revealName?: string
  /** Small label above the name. */
  label?: string
  /** Small label above the hero line. */
  revealLabel?: string
  /** Line along the bottom edge. Empty hides it. */
  caption?: string
  /** Hint shown until the first interaction. Empty hides it. */
  hint?: string
  /** Civilian photo. Replaces the drawn civilian portrait (3:4 works best). */
  baseSrc?: string
  /** Hero photo. Replaces the drawn masked portrait. */
  revealSrc?: string
  /** Nudge `revealSrc` so its face lands on the base face: offsets in % of the portrait, scale 1 = cover. */
  revealFit?: { x?: number; y?: number; scale?: number }
  /** Brush radius, in 1/1000ths of the stage height. */
  brush?: number
  /** How long the trail lingers before it melts away (ms). */
  linger?: number
  /** Suit colour, the rim of the blob and the hero word. */
  accent?: string
  /** Civilian backdrop. */
  backdrop?: string
  /** Hero backdrop. */
  revealBackdrop?: string
  /** A ghost pointer circles the face until someone interacts. */
  autoPeek?: boolean
  /** Font stack for the big words. Any bold condensed face; nothing is loaded. */
  fontFamily?: string
  /** Stage height. A definite length, never a percentage. */
  height?: string
  /** Extra root class names. */
  className?: string
}

// #region trail
export type Blob = { x: number; y: number; r: number; age: number; life: number; size: number; seed: number }

export const clamp01 = (x: number) => (x <= 0 ? 0 : x > 1 ? 1 : x)

/** Radius of a trail blob over its life: swells in fast, holds, then melts. */
export function blobRadius(age: number, life: number, size: number) {
  if (age <= 0 || age >= life) return 0
  const grow = Math.min(140, life * 0.25)
  if (age < grow) {
    // easeOutBack: a little over-full, like a drop landing
    const u = age / grow - 1
    return size * (1 + 2.70158 * u * u * u + 1.70158 * u * u)
  }
  const t = (age - grow) / (life - grow)
  return size * (1 - t * t * t)
}

/** Points to stamp between two pointer samples, so fast moves leave no gaps. */
export function stampsBetween(ax: number, ay: number, bx: number, by: number, spacing: number) {
  const d = Math.hypot(bx - ax, by - ay)
  const n = Math.min(12, Math.floor(d / Math.max(1, spacing)))
  const out: [number, number][] = []
  for (let i = 1; i <= n; i++) out.push([ax + ((bx - ax) * i) / n, ay + ((by - ay) * i) / n])
  return out
}

/** Frame-rate independent approach of `v` towards `to`. */
export function approach(v: number, to: number, rate: number, dt: number) {
  return to + (v - to) * Math.exp(-rate * dt)
}

/** Where the portrait sits in a stage `vw` wide and 1000 tall: bottom anchored, centred. */
export function portraitBox(vw: number) {
  const s = Math.min(930 / 800, (vw * 0.98) / 600)
  return { s, x: (vw - 600 * s) / 2, y: 1000 - 800 * s }
}
// #endregion

const MAX = 40
const FLOOD = 0
const HEAD = 1
const PEEK = 2
const FIRST_TRAIL = 3

const AEM_CSS = `
.aem-root { position: relative; overflow: hidden; isolation: isolate; user-select: none; -webkit-user-select: none; touch-action: pan-y; cursor: crosshair; outline: none; }
.aem-root:focus-visible { box-shadow: inset 0 0 0 2px var(--aem-accent); }
.aem-svg { position: absolute; inset: 0; display: block; width: 100%; height: 100%; max-width: none; }
.aem-hint { position: absolute; left: 50%; bottom: 7%; transform: translateX(-50%); display: flex; align-items: center; gap: 10px; padding: 8px 14px 8px 12px; border-radius: 999px; font: 500 11px/1 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; letter-spacing: 0.22em; text-transform: uppercase; color: #ece6dc; background: rgba(10, 12, 13, 0.55); border: 1px solid rgba(236, 230, 220, 0.16); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); pointer-events: none; transition: opacity 600ms ease, transform 600ms ease; white-space: nowrap; }
.aem-hint[data-gone="true"] { opacity: 0; transform: translate(-50%, 8px); }
.aem-dot { position: relative; width: 8px; height: 8px; border-radius: 50%; background: var(--aem-accent); }
.aem-dot::after { content: ""; position: absolute; inset: -5px; border-radius: 50%; border: 1px solid var(--aem-accent); animation: aem-ping 1.8s cubic-bezier(0.2, 0.7, 0.3, 1) infinite; }
@keyframes aem-ping { from { transform: scale(0.4); opacity: 1; } to { transform: scale(1.6); opacity: 0; } }
@media (prefers-reduced-motion: reduce) {
  .aem-dot::after { animation: none; }
  .aem-hint { transition: none; }
}
`

const DEFAULT_FONT = "Anton, 'Bebas Neue', Oswald, Impact, 'Arial Narrow', sans-serif"
const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"

// ---- shared face geometry (portrait space: 600 x 800) ------------------------
const FACE =
  "M185 300C182 230 225 190 300 188C375 190 418 230 415 300C414 360 408 410 390 450C372 490 340 522 300 526C260 522 228 490 210 450C192 410 186 360 185 300Z"
const HOOD =
  "M172 318C166 226 218 150 300 146C382 150 434 226 428 318C426 380 414 424 394 460C374 498 340 530 300 534C260 530 226 498 206 460C186 424 174 380 172 318Z"
const TORSO =
  "M-260 820L-260 800C-150 700 90 640 240 606C266 634 334 634 360 606C510 640 750 700 860 800L860 820Z"
const NECK = "M246 470C250 530 248 580 240 614C266 642 334 642 360 614C352 580 350 530 354 470Z"
const LENS =
  "M318 374C320 334 344 300 396 290C420 286 432 302 428 330C422 370 384 396 342 396C326 396 316 388 318 374Z"
const EYES = [
  { x: 252, y: 336 },
  { x: 348, y: 336 },
] as const

/** A radial web: spokes from a centre plus sagging rings between them. */
function webPath(cx: number, cy: number, spokes: number, rings: number[], tilt = 0) {
  let d = ""
  const ang = (i: number) => tilt + (i / spokes) * Math.PI * 2
  const far = rings[rings.length - 1] * 1.4
  for (let i = 0; i < spokes; i++) {
    const a = ang(i)
    d += `M${cx.toFixed(1)} ${cy.toFixed(1)}L${(cx + Math.cos(a) * far).toFixed(1)} ${(cy + Math.sin(a) * far).toFixed(1)}`
  }
  for (const r of rings) {
    for (let i = 0; i < spokes; i++) {
      const a0 = ang(i)
      const a1 = ang(i + 1)
      const am = (a0 + a1) / 2
      const x0 = cx + Math.cos(a0) * r
      const y0 = cy + Math.sin(a0) * r
      const x1 = cx + Math.cos(a1) * r
      const y1 = cy + Math.sin(a1) * r
      const qr = r * 0.86
      d += `M${x0.toFixed(1)} ${y0.toFixed(1)}Q${(cx + Math.cos(am) * qr).toFixed(1)} ${(cy + Math.sin(am) * qr).toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`
    }
  }
  return d
}

const HEAD_WEB = webPath(300, 352, 22, [34, 66, 102, 142, 186, 234, 288], -Math.PI / 2)
const CHEST_WEB = webPath(300, 830, 26, [70, 130, 196, 266, 340, 420], -Math.PI / 2)

function Civilian({ id, eyeRefs }: { id: (s: string) => string; eyeRefs: React.MutableRefObject<(SVGGElement | null)[]> }) {
  return (
    <g>
      <defs>
        <radialGradient id={id("skin")} cx="0.46" cy="0.4" r="0.62">
          <stop offset="0" stopColor="#efc4a8" />
          <stop offset="0.55" stopColor="#dca283" />
          <stop offset="1" stopColor="#b97a5d" />
        </radialGradient>
        <linearGradient id={id("neck")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8e563f" />
          <stop offset="0.35" stopColor="#c28565" />
          <stop offset="1" stopColor="#cf9373" />
        </linearGradient>
        <radialGradient id={id("iris")} cx="0.4" cy="0.4" r="0.6">
          <stop offset="0" stopColor="#8a5a2e" />
          <stop offset="0.7" stopColor="#5a371c" />
          <stop offset="1" stopColor="#2d1b0f" />
        </radialGradient>
        <linearGradient id={id("hair")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a2a20" />
          <stop offset="1" stopColor="#1c1410" />
        </linearGradient>
        <linearGradient id={id("tee")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1b1e20" />
          <stop offset="1" stopColor="#0c0d0e" />
        </linearGradient>
        {EYES.map((e, i) => (
          <clipPath key={i} id={id("eye" + i)}>
            <path d={`M${e.x - 25} ${e.y}C${e.x - 14} ${e.y - 13} ${e.x + 14} ${e.y - 13} ${e.x + 25} ${e.y}C${e.x + 14} ${e.y + 9} ${e.x - 14} ${e.y + 9} ${e.x - 25} ${e.y}Z`} />
          </clipPath>
        ))}
      </defs>

      {/* body */}
      <path d={NECK} fill={`url(#${id("neck")})`} />
      <path d={TORSO} fill={`url(#${id("tee")})`} />
      <path d="M240 606C266 648 334 648 360 606" fill="none" stroke="#070808" strokeWidth="12" strokeLinecap="round" />
      <path d="M246 490C270 520 330 520 354 490L352 540C330 556 270 556 248 540Z" fill="#7d4834" opacity="0.35" />
      <path d="M-40 760C60 710 150 682 214 668M640 760C540 710 450 682 386 668" fill="none" stroke="#2c3134" strokeWidth="3" strokeLinecap="round" opacity="0.8" />

      {/* ears */}
      <path d="M192 318C168 304 152 322 158 352C163 384 176 410 200 418Z" fill="#cf9173" />
      <path d="M408 318C432 304 448 322 442 352C437 384 424 410 400 418Z" fill="#cf9173" />
      <path d="M186 336C176 332 170 344 174 360C177 374 184 386 194 392" fill="none" stroke="#9c5f47" strokeWidth="3" strokeLinecap="round" />
      <path d="M414 336C424 332 430 344 426 360C423 374 416 386 406 392" fill="none" stroke="#9c5f47" strokeWidth="3" strokeLinecap="round" />

      {/* face */}
      <path d={FACE} fill={`url(#${id("skin")})`} />
      <path d="M210 450C228 490 260 522 300 526C340 522 372 490 390 450C372 500 340 530 300 532C260 530 228 500 210 450Z" fill="#9c5f47" opacity="0.45" />
      <ellipse cx="226" cy="408" rx="26" ry="18" fill="#e08c7a" opacity="0.18" />
      <ellipse cx="374" cy="408" rx="26" ry="18" fill="#e08c7a" opacity="0.18" />
      <path d="M386 250C404 300 404 380 380 450C398 400 404 330 386 250Z" fill="#9c5f47" opacity="0.35" />

      {/* brows */}
      <path d="M220 308C236 294 262 290 284 300L282 309C262 302 240 304 222 315Z" fill="#2c1e16" />
      <path d="M380 306C364 293 338 290 316 299L318 308C338 301 360 303 378 313Z" fill="#2c1e16" />

      {/* eyes: iris groups are moved by the pointer */}
      {EYES.map((e, i) => (
        <g key={i}>
          <path d={`M${e.x - 25} ${e.y}C${e.x - 14} ${e.y - 13} ${e.x + 14} ${e.y - 13} ${e.x + 25} ${e.y}C${e.x + 14} ${e.y + 9} ${e.x - 14} ${e.y + 9} ${e.x - 25} ${e.y}Z`} fill="#efe4dc" />
          <g clipPath={`url(#${id("eye" + i)})`}>
            <g ref={(el) => { eyeRefs.current[i] = el }}>
              <circle cx={e.x} cy={e.y - 1} r="10.5" fill={`url(#${id("iris")})`} />
              <circle cx={e.x} cy={e.y - 1} r="4.6" fill="#120b07" />
              <circle cx={e.x + 3.4} cy={e.y - 4.4} r="2" fill="#fff" opacity="0.9" />
            </g>
          </g>
          <path d={`M${e.x - 26} ${e.y + 1}C${e.x - 14} ${e.y - 14} ${e.x + 14} ${e.y - 14} ${e.x + 26} ${e.y + 1}`} fill="none" stroke="#2a1b14" strokeWidth="2.8" strokeLinecap="round" />
          <path d={`M${e.x - 20} ${e.y + 9}C${e.x - 8} ${e.y + 14} ${e.x + 8} ${e.y + 14} ${e.x + 20} ${e.y + 9}`} fill="none" stroke="#a9694f" strokeWidth="1.6" opacity="0.5" />
        </g>
      ))}

      {/* nose */}
      <path d="M286 344C282 372 276 394 274 406C280 398 288 376 292 346Z" fill="#a9694f" opacity="0.28" />
      <path d="M314 360C318 380 324 396 326 408" fill="none" stroke="#a9694f" strokeWidth="2" strokeLinecap="round" opacity="0.35" />
      <path d="M278 414C286 424 294 424 300 426C306 424 314 424 322 414" fill="none" stroke="#8a4f3c" strokeWidth="3" strokeLinecap="round" opacity="0.65" />
      <ellipse cx="302" cy="404" rx="10" ry="7" fill="#f6d2bb" opacity="0.5" />

      {/* mouth: a half smile, a touch higher on one side */}
      <path d="M262 463C280 456 291 458 300 461C309 458 322 455 340 460C322 467 280 468 262 463Z" fill="#b06f5f" />
      <path d="M266 465C284 478 318 478 336 463C318 470 282 471 266 465Z" fill="#c4806e" />
      <path d="M260 463C282 467 318 467 342 459" fill="none" stroke="#6f3a31" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M288 492C296 496 306 496 314 492" fill="none" stroke="#a9694f" strokeWidth="1.6" strokeLinecap="round" opacity="0.5" />

      {/* freckles */}
      {[[262, 380], [272, 388], [252, 392], [336, 382], [346, 390], [326, 390], [290, 372]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1.3" fill="#9c5f47" opacity="0.45" />
      ))}

      {/* hair: short sides, volume swept up and back */}
      <path
        d="M182 332C166 272 168 214 196 178C220 146 262 118 312 114C372 110 424 134 444 182C460 222 454 272 434 328C430 302 424 280 412 266C402 252 390 240 374 242C360 228 340 234 322 224C302 216 286 230 264 226C244 232 226 244 214 262C200 282 194 304 190 332Z"
        fill={`url(#${id("hair")})`}
      />
      <path d="M216 240C228 184 290 148 366 158C332 166 300 184 284 216C270 210 240 222 216 240Z" fill="#4a3528" opacity="0.7" />
      <path
        d="M206 206C236 158 296 132 364 142M232 222C262 184 318 166 388 182M258 146C298 124 350 124 402 150M300 214C336 198 384 206 418 240M204 250C216 222 240 200 274 188M336 120C380 124 418 146 436 180"
        fill="none"
        stroke="#6a4e3b"
        strokeWidth="2.6"
        strokeLinecap="round"
        opacity="0.6"
      />
      <path d="M187 318C185 338 188 356 193 370C195 350 196 334 197 318Z" fill="#2a1d16" opacity="0.8" />
      <path d="M413 318C415 338 412 356 407 370C405 350 404 334 403 318Z" fill="#2a1d16" opacity="0.8" />
    </g>
  )
}

function Masked({ id }: { id: (s: string) => string }) {
  return (
    <g>
      <defs>
        <radialGradient id={id("red")} cx="0.44" cy="0.36" r="0.7">
          <stop offset="0" stopColor="#ea3a46" />
          <stop offset="0.5" stopColor="#b91d2c" />
          <stop offset="1" stopColor="#5c0a14" />
        </radialGradient>
        <linearGradient id={id("suit")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b31c2a" />
          <stop offset="1" stopColor="#6a0c17" />
        </linearGradient>
        <linearGradient id={id("lens")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.6" stopColor="#d8dde2" />
          <stop offset="1" stopColor="#9aa3ab" />
        </linearGradient>
        <pattern id={id("mesh")} width="5" height="5" patternUnits="userSpaceOnUse">
          <circle cx="2.5" cy="2.5" r="0.9" fill="#6b747c" opacity="0.5" />
        </pattern>
        <pattern id={id("weave")} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <path d="M0 3.5H7M3.5 0V7" stroke="#000" strokeWidth="0.8" opacity="0.18" />
        </pattern>
        <radialGradient id={id("chin")}>
          <stop offset="0" stopColor="#000" stopOpacity="0.45" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <clipPath id={id("hood")}>
          <path d={HOOD} />
          <path d={NECK} />
        </clipPath>
        <clipPath id={id("torso")}>
          <path d={TORSO} />
        </clipPath>
      </defs>

      {/* suit */}
      <path d={NECK} fill={`url(#${id("suit")})`} />
      <path d={TORSO} fill={`url(#${id("suit")})`} />
      <g clipPath={`url(#${id("torso")})`}>
        <path d="M-260 800C-160 730 -40 700 60 700L30 820L-260 820Z" fill="#1d3480" stroke="#07070a" strokeWidth="4" />
        <path d="M860 800C760 730 640 700 540 700L570 820L860 820Z" fill="#1d3480" stroke="#07070a" strokeWidth="4" />
        <path d={CHEST_WEB} fill="none" stroke="#1a0508" strokeWidth="2" opacity="0.8" />
        <rect x="-260" width="1120" height="820" fill={`url(#${id("weave")})`} />
      </g>
      {/* chest emblem: a small generic spider */}
      <g transform="translate(300 760)" fill="#0a0708" stroke="#0a0708" strokeLinecap="round">
        <ellipse cx="0" cy="-6" rx="7" ry="9" />
        <ellipse cx="0" cy="14" rx="9" ry="15" />
        <path d="M-5 -8L-26 -30L-30 -52M5 -8L26 -30L30 -52M-6 -2L-34 -12L-44 -4M6 -2L34 -12L44 -4M-6 6L-32 16L-40 34M6 6L32 16L40 34M-5 12L-22 34L-24 56M5 12L22 34L24 56" fill="none" strokeWidth="3.5" />
      </g>

      {/* hood */}
      <path d={HOOD} fill={`url(#${id("red")})`} />
      <g clipPath={`url(#${id("hood")})`}>
        <path d={HEAD_WEB} fill="none" stroke="#1a0508" strokeWidth="2.1" opacity="0.85" />
        <rect width="600" height="800" fill={`url(#${id("weave")})`} />
        {/* chin shadow onto the neck, highlight across the brow */}
        <ellipse cx="300" cy="548" rx="92" ry="44" fill={`url(#${id("chin")})`} />
        <ellipse cx="284" cy="238" rx="90" ry="44" fill="#ff8a8a" opacity="0.12" />
      </g>

      {/* lenses: mirrored pair, black frames, mesh-white glass */}
      {[1, -1].map((sx) => (
        <g key={sx} transform={sx === 1 ? undefined : "translate(600 0) scale(-1 1)"}>
          <path d={LENS} fill="#0b0b0d" stroke="#0b0b0d" strokeWidth="26" strokeLinejoin="round" />
          <path d={LENS} fill={`url(#${id("lens")})`} />
          <path d={LENS} fill={`url(#${id("mesh")})`} />
          <path d="M338 330C348 312 368 302 392 298" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
          <path d={LENS} fill="none" stroke="#6d757d" strokeWidth="2" opacity="0.6" />
        </g>
      ))}
    </g>
  )
}

export default function AlterEgoMaskReveal({
  word = "PARKER",
  revealWord = "THWIP!",
  name = "Peter Parker",
  revealName = "Your friendly neighbour",
  label = "File 001 · Civilian",
  revealLabel = "File 001 · Masked",
  caption = "Queens, NY — 40.7282° N, 73.7949° W",
  hint = "Hover his face",
  baseSrc,
  revealSrc,
  revealFit,
  brush = 78,
  linger = 950,
  accent = "#e23a44",
  backdrop = "#1c2225",
  revealBackdrop = "#070708",
  autoPeek = true,
  fontFamily = DEFAULT_FONT,
  height = "100svh",
  className = "",
}: AlterEgoMaskRevealProps) {
  const rootRef = React.useRef<HTMLDivElement>(null)
  const svgRef = React.useRef<SVGSVGElement>(null)
  const circleRefs = React.useRef<(SVGCircleElement | null)[]>([])
  const eyeRefs = React.useRef<(SVGGElement | null)[]>([])
  const [vw, setVw] = React.useState(1600)
  const [touched, setTouched] = React.useState(false)

  const rawId = React.useId()
  const uid = "aem" + rawId.replace(/[^a-zA-Z0-9_-]/g, "")
  const id = React.useCallback((s: string) => uid + "-" + s, [uid])

  // Mutable simulation state, read by the animation loop.
  const sim = React.useRef({
    blobs: Array.from({ length: MAX }, (): Blob => ({ x: 0, y: 0, r: 0, age: 0, life: 0, size: 0, seed: 0 })),
    next: FIRST_TRAIL,
    px: 0,
    py: 0,
    inside: false,
    last: null as null | [number, number],
    flood: false,
    touched: false,
    reduced: false,
    raf: 0,
    t0: 0,
    eye: [0, 0] as [number, number],
    vw: 1600,
  })

  const box = portraitBox(vw)
  // The brush is sized for a full-height portrait; on a narrow stage it shrinks with the face.
  const brushAt = React.useCallback((w: number) => brush * (portraitBox(w).s / (930 / 800)), [brush])

  // ---- stage size → viewBox width ----------------------------------------------
  React.useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const measure = () => {
      const r = el.getBoundingClientRect()
      if (r.width > 0 && r.height > 0) {
        const w = Math.round((1000 * r.width) / r.height)
        sim.current.vw = w
        setVw(w)
      }
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // ---- animation loop ----------------------------------------------------------
  const tick = React.useCallback(
    (now: number) => {
      const S = sim.current
      const dt = Math.min(0.05, (now - (S.t0 || now)) / 1000)
      S.t0 = now
      const b = S.blobs
      let alive = false

      // flood: the whole-suit reveal
      const W = S.vw
      const full = Math.hypot(W, 1000) * 1.05
      b[FLOOD].r = S.reduced ? (S.flood ? full : 0) : approach(b[FLOOD].r, S.flood ? full : 0, S.flood ? 3.2 : 4.5, dt)
      if (b[FLOOD].r < 1) b[FLOOD].r = 0
      if (b[FLOOD].r > 0 || S.flood) alive = true

      // head: sits under the pointer while it is over the stage
      const hs = brushAt(W) * 1.05
      b[HEAD].x = S.reduced ? S.px : approach(b[HEAD].x, S.px, 22, dt)
      b[HEAD].y = S.reduced ? S.py : approach(b[HEAD].y, S.py, 22, dt)
      b[HEAD].r = approach(b[HEAD].r, S.inside ? hs : 0, S.inside ? 12 : 7, dt)
      if (b[HEAD].r < 0.5) b[HEAD].r = 0
      if (b[HEAD].r > 0 || S.inside) alive = true

      // peek: a ghost pointer that circles the face until someone interacts
      if (autoPeek && !S.touched && !S.reduced) {
        const bx = portraitBox(W)
        const t = now / 1000
        const cx = bx.x + 300 * bx.s
        const cy = bx.y + 360 * bx.s
        const phase = (t % 5.2) / 5.2
        const on = Math.sin(Math.PI * clamp01(phase * 1.3)) // swell in and out each loop
        b[PEEK].x = cx + Math.cos(t * 1.25) * 88 * bx.s
        b[PEEK].y = cy + Math.sin(t * 1.9) * 70 * bx.s
        b[PEEK].r = brushAt(W) * 1.1 * on * on
        alive = true
      } else {
        b[PEEK].r = approach(b[PEEK].r, 0, 6, dt)
        if (b[PEEK].r < 0.5) b[PEEK].r = 0
        else alive = true
      }

      // trail
      for (let i = FIRST_TRAIL; i < MAX; i++) {
        const k = b[i]
        if (k.life <= 0) continue
        k.age += dt * 1000
        k.r = blobRadius(k.age, k.life, k.size)
        if (k.age >= k.life) {
          k.life = 0
          k.r = 0
        } else {
          alive = true
          if (!S.reduced) {
            // a slow drip: melting blobs sag a little
            k.y += dt * 18 * (k.age / k.life)
            k.x += Math.sin(now / 400 + k.seed * 6.28) * dt * 6
          }
        }
      }

      for (let i = 0; i < MAX; i++) {
        const c = circleRefs.current[i]
        if (!c) continue
        c.setAttribute("cx", b[i].x.toFixed(1))
        c.setAttribute("cy", b[i].y.toFixed(1))
        c.setAttribute("r", Math.max(0, b[i].r).toFixed(1))
      }

      // the civilian's eyes follow the pointer
      const bx = portraitBox(W)
      const tx = S.inside ? (S.px - bx.x) / bx.s : 300
      const ty = S.inside ? (S.py - bx.y) / bx.s : 336
      const dx = tx - 300
      const dy = ty - 336
      const d = Math.hypot(dx, dy) || 1
      const m = Math.min(5.5, d / 30)
      S.eye[0] = approach(S.eye[0], (dx / d) * m, 10, dt)
      S.eye[1] = approach(S.eye[1], (dy / d) * m * 0.6, 10, dt)
      const look = `translate(${S.eye[0].toFixed(2)} ${S.eye[1].toFixed(2)})`
      for (const g of eyeRefs.current) g?.setAttribute("transform", look)
      if (Math.abs(S.eye[0]) + Math.abs(S.eye[1]) > 0.05) alive = true

      S.raf = alive ? requestAnimationFrame(tick) : 0
      if (!alive) S.t0 = 0
    },
    [autoPeek, brushAt],
  )

  const wake = React.useCallback(() => {
    const S = sim.current
    if (!S.raf) S.raf = requestAnimationFrame(tick)
  }, [tick])

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const set = () => {
      sim.current.reduced = mq.matches
      wake()
    }
    set()
    mq.addEventListener("change", set)
    return () => {
      mq.removeEventListener("change", set)
      cancelAnimationFrame(sim.current.raf)
      sim.current.raf = 0
    }
  }, [wake])

  // ---- pointer → stage coordinates ---------------------------------------------
  const toStage = (clientX: number, clientY: number): [number, number] | null => {
    const svg = svgRef.current
    const m = svg?.getScreenCTM()
    if (!svg || !m) return null
    const p = new DOMPoint(clientX, clientY).matrixTransform(m.inverse())
    return [p.x, p.y]
  }

  const markTouched = () => {
    if (!sim.current.touched) {
      sim.current.touched = true
      setTouched(true)
    }
  }

  const stamp = (x: number, y: number) => {
    const S = sim.current
    const k = S.blobs[S.next]
    S.next = S.next + 1 >= MAX ? FIRST_TRAIL : S.next + 1
    const seed = Math.random()
    k.x = x
    k.y = y
    k.age = 0
    k.seed = seed
    k.size = brushAt(S.vw) * (0.72 + seed * 0.42)
    k.life = S.reduced ? linger * 0.6 : linger * (0.8 + seed * 0.4)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    const p = toStage(e.clientX, e.clientY)
    if (!p) return
    const S = sim.current
    markTouched()
    if (!S.inside) {
      S.inside = true
      S.blobs[HEAD].x = p[0]
      S.blobs[HEAD].y = p[1]
    }
    S.px = p[0]
    S.py = p[1]
    if (!S.last) {
      stamp(p[0], p[1])
      S.last = p
    } else {
      const dots = stampsBetween(S.last[0], S.last[1], p[0], p[1], brushAt(S.vw) * 0.42)
      for (const [x, y] of dots) stamp(x, y)
      if (dots.length) S.last = p
    }
    wake()
  }

  const onPointerLeave = () => {
    const S = sim.current
    S.inside = false
    S.last = null
    wake()
  }

  const toggleSuit = (x?: number, y?: number) => {
    const S = sim.current
    markTouched()
    if (!S.flood) {
      const bx = portraitBox(S.vw)
      S.blobs[FLOOD].x = x ?? bx.x + 300 * bx.s
      S.blobs[FLOOD].y = y ?? bx.y + 350 * bx.s
    }
    S.flood = !S.flood
    wake()
  }

  const onClick = (e: React.MouseEvent) => {
    const p = toStage(e.clientX, e.clientY)
    toggleSuit(p?.[0], p?.[1])
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      toggleSuit()
    }
  }

  // ---- layout ------------------------------------------------------------------
  const wordW = vw * 0.94
  const wordSize = Math.min(360, wordW / Math.max(3, word.length) * 1.55, wordW / Math.max(3, revealWord.length) * 1.55)
  const wordY = 150 + wordSize * 0.84
  const pad = Math.max(28, vw * 0.035)
  const portrait = `translate(${box.x.toFixed(1)} ${box.y.toFixed(1)}) scale(${box.s.toFixed(4)})`
  const fit = { x: 0, y: 0, scale: 1, ...revealFit }

  const labels = (kicker: string, title: string, ink: string, dim: string) => (
    <g fontFamily={MONO}>
      <text x={pad} y={pad + 14} fontSize="15" letterSpacing="4" fill={dim}>{kicker.toUpperCase()}</text>
      <text x={pad} y={pad + 44} fontSize="22" letterSpacing="1.5" fill={ink} fontWeight="600">{title}</text>
      {caption && (
        <text x={vw - pad} y={1000 - pad} fontSize="14" letterSpacing="3" fill={dim} textAnchor="end">{caption.toUpperCase()}</text>
      )}
    </g>
  )

  const bigWord = (text: string, props: React.SVGProps<SVGTextElement>) =>
    text ? (
      <text
        x={vw / 2}
        y={wordY}
        textAnchor="middle"
        fontFamily={fontFamily}
        fontSize={wordSize}
        fontWeight={900}
        textLength={wordW}
        lengthAdjust="spacingAndGlyphs"
        {...props}
      >
        {text}
      </text>
    ) : null

  return (
    <div
      ref={rootRef}
      className={"aem-root w-full " + className}
      style={{ height, background: backdrop, ["--aem-accent" as string]: accent } as React.CSSProperties}
      onPointerMove={onPointerMove}
      onPointerDown={onPointerMove}
      onPointerLeave={onPointerLeave}
      onPointerCancel={onPointerLeave}
      onClick={onClick}
      onKeyDown={onKeyDown}
      tabIndex={0}
      role="img"
      aria-label={`${name}. Hover to reveal the mask; press Enter to put it on or take it off.`}
    >
      <style>{AEM_CSS}</style>
      <svg
        ref={svgRef}
        className="aem-svg"
        viewBox={`0 0 ${vw} 1000`}
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id={id("bg")} cx="0.5" cy="0.42" r="0.75">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.07" />
            <stop offset="1" stopColor="#000000" stopOpacity="0.35" />
          </radialGradient>
          <radialGradient id={id("glow")} cx="0.5" cy="0.4" r="0.55">
            <stop offset="0" stopColor={accent} stopOpacity="0.32" />
            <stop offset="1" stopColor={accent} stopOpacity="0" />
          </radialGradient>
          <filter id={id("goo")} filterUnits="userSpaceOnUse" x="-100" y="-100" width={vw + 200} height="1200">
            <feGaussianBlur in="SourceGraphic" stdDeviation="16" result="b" />
            <feColorMatrix in="b" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 26 -11" result="g" />
            <feTurbulence type="fractalNoise" baseFrequency="0.014" numOctaves="2" seed="7" result="n" />
            <feDisplacementMap in="g" in2="n" scale="22" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <filter id={id("rim")} filterUnits="userSpaceOnUse" x="-100" y="-100" width={vw + 200} height="1200">
            <feGaussianBlur in="SourceGraphic" stdDeviation="16" result="b" />
            <feColorMatrix in="b" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 26 -11" result="g" />
            <feTurbulence type="fractalNoise" baseFrequency="0.014" numOctaves="2" seed="7" result="n" />
            <feDisplacementMap in="g" in2="n" scale="22" xChannelSelector="R" yChannelSelector="G" result="shape" />
            <feMorphology in="shape" operator="dilate" radius="3" result="fat" />
            <feComposite in="fat" in2="shape" operator="out" result="ring" />
            <feFlood floodColor={accent} result="c" />
            <feComposite in="c" in2="ring" operator="in" result="edge" />
            <feGaussianBlur in="edge" stdDeviation="5" result="halo" />
            <feMerge>
              <feMergeNode in="halo" />
              <feMergeNode in="edge" />
            </feMerge>
          </filter>
          <g id={id("blobs")}>
            {Array.from({ length: MAX }, (_, i) => (
              <circle key={i} ref={(el) => { circleRefs.current[i] = el }} cx="0" cy="0" r="0" fill="#fff" />
            ))}
          </g>
          <mask id={id("mask")} maskUnits="userSpaceOnUse" x="-100" y="-100" width={vw + 200} height="1200">
            <g filter={`url(#${id("goo")})`}>
              <use href={`#${id("blobs")}`} />
            </g>
          </mask>
          {/* photos melt into the backdrop instead of ending in a hard rectangle */}
          <radialGradient id={id("fade")} cx="0.5" cy="0.44" r="0.5">
            <stop offset="0.6" stopColor="#fff" />
            <stop offset="1" stopColor="#000" />
          </radialGradient>
          <mask id={id("feather")} maskContentUnits="objectBoundingBox">
            <rect width="1" height="1" fill={`url(#${id("fade")})`} />
          </mask>
        </defs>

        {/* ---- civilian layer ---- */}
        <g>
          <rect x="-100" y="-100" width={vw + 200} height="1200" fill={backdrop} />
          <rect width={vw} height="1000" fill={`url(#${id("bg")})`} />
          {bigWord(word, { fill: "none", stroke: "#ece6dc", strokeWidth: 1.4, opacity: 0.22 })}
          <g transform={portrait}>
            {baseSrc ? (
              <image href={baseSrc} width="600" height="800" preserveAspectRatio="xMidYMid slice" mask={`url(#${id("feather")})`} />
            ) : (
              <Civilian id={id} eyeRefs={eyeRefs} />
            )}
          </g>
          {labels(label, name, "#ece6dc", "rgba(236,230,220,0.5)")}
        </g>

        {/* ---- hero layer, only where the goo is ---- */}
        <g mask={`url(#${id("mask")})`}>
          <rect x="-100" y="-100" width={vw + 200} height="1200" fill={revealBackdrop} />
          <rect width={vw} height="1000" fill={`url(#${id("glow")})`} />
          <path
            d={webPath(vw / 2, box.y + 352 * box.s, 30, [120, 230, 350, 480, 620, 780, 950], -Math.PI / 2)}
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.2"
            opacity="0.09"
          />
          {bigWord(revealWord, { fill: accent, opacity: 0.95 })}
          <g transform={portrait}>
            {revealSrc ? (
              <g transform={`translate(${300 + fit.x * 6} ${400 + fit.y * 8}) scale(${fit.scale}) translate(-300 -400)`}>
                <image href={revealSrc} width="600" height="800" preserveAspectRatio="xMidYMid slice" mask={`url(#${id("feather")})`} />
              </g>
            ) : (
              <Masked id={id} />
            )}
          </g>
          {labels(revealLabel, revealName, "#ffffff", accent)}
        </g>

        {/* ---- glowing edge of the goo ---- */}
        <g filter={`url(#${id("rim")})`} pointerEvents="none">
          <use href={`#${id("blobs")}`} />
        </g>
      </svg>

      {hint && (
        <div className="aem-hint" data-gone={touched ? "true" : "false"} aria-hidden="true">
          <span className="aem-dot" />
          {hint}
        </div>
      )}
    </div>
  )
}
