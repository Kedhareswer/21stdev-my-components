"use client"

import * as React from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

/**
 * Cutout Sentence — a photograph that drops pieces of itself into the words
 * describing it.
 *
 * It opens on one full-bleed photo. Scroll, and the photo's lower edge rises
 * to make room: the photo settles into the top of the stage and a sentence
 * writes itself underneath, every image slot an empty pair of braces waiting
 * — "A {    }kaleidoscope of {    }painted {    }wings…". Cut lines are
 * traced into the photo, then the rectangles lift out one by one — leaving
 * clean holes the colour of the page — and drop down into the braces in
 * reading order, each beside the word it shows. On the way they tilt, swell
 * and re-crop (the window opens on a little more of the photo mid-air, then
 * closes on its slot), and the braces clamp shut as each one lands. Scroll
 * back and every piece rises home into its own hole.
 *
 * `mode="auto"` plays it once when the section comes into view instead, with
 * a replay button. Reduced motion shows the finished sentence, no flight.
 */

// #region cutout
// Pure: sentence parsing, layout and the scroll → choreography mapping. Lifted out and run by the test.

/** [x, y, w, h] as fractions of the image (0–1). */
export type Region = [number, number, number, number]
export type Rect = { x: number; y: number; w: number; h: number }

export type CutoutPiece = {
  /** Matches a `{id}` placeholder in `sentence`. */
  id: string
  /** The word this piece shows — its accessible name and hover tag. */
  word: string
  /** Which part of the image is cut out. */
  region: Region
  /** Slot width ÷ height in the sentence. Defaults to the region's own shape; anything else re-crops on landing. */
  aspect?: number
}

export type Token =
  | { kind: "word"; text: string; w: number }
  | { kind: "piece"; id: string; index: number; at: number }

export const clamp01 = (v: number): number => (v > 0 ? (v < 1 ? v : 1) : 0)
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t
/** 0 before a, 1 after b, linear between. */
export const ramp = (p: number, a: number, b: number): number => (b <= a ? (p >= b ? 1 : 0) : clamp01((p - a) / (b - a)))
export const easeInOutCubic = (x: number): number => {
  const t = clamp01(x)
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}
export const easeOutCubic = (x: number): number => 1 - Math.pow(1 - clamp01(x), 3)
export const easeOutBack = (x: number, s = 2.2): number => {
  const t = clamp01(x) - 1
  return 1 + (s + 1) * t * t * t + s * t * t
}
export const lerpRect = (a: Rect, b: Rect, t: number): Rect => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
  w: lerp(a.w, b.w, t),
  h: lerp(a.h, b.h, t),
})

/**
 * Splits "A {kal}kaleidoscope of {paint}painted…" into nowrap groups. Words
 * are separated by whitespace; a piece written flush against a word
 * ("{kal}kaleidoscope", "sky{x}") is kept on the same line as it, which is
 * how the braces hug their word. Unknown or repeated ids are dropped.
 * Each word gets its reading index `w`; each piece records `at`, the number
 * of words before it, so its braces can appear in step with the text.
 */
export function parseSentence(sentence: string, ids: string[]) {
  const known = new Set(ids)
  const groups: Token[][] = []
  const order: string[] = []
  let words = 0
  let glue = false
  const parts = sentence.split(/\{([^{}\s]+)\}/)
  parts.forEach((part, i) => {
    if (i % 2 === 1) {
      if (!known.has(part) || order.includes(part)) return
      const tok: Token = { kind: "piece", id: part, index: order.length, at: words }
      order.push(part)
      const prev = parts[i - 1]
      const touches = groups.length > 0 && (prev.length > 0 ? !/\s$/.test(prev) : glue)
      if (touches) groups[groups.length - 1].push(tok)
      else groups.push([tok])
      glue = true
      return
    }
    const lead = part.length > 0 && /^\s/.test(part)
    part
      .split(/\s+/)
      .filter(Boolean)
      .forEach((text, k) => {
        const tok: Token = { kind: "word", text, w: words++ }
        if (k === 0 && glue && !lead && groups.length) groups[groups.length - 1].push(tok)
        else groups.push([tok])
      })
    if (part.length) glue = false
  })
  return { groups, order, words }
}

/**
 * Where the image sits inside `box`. Covers the box and centres the regions'
 * bounding box; with `fit`, shrinks until every region (plus `margin`) is in
 * view — then a picture narrower than the box is centred, and one shorter
 * than it sits against the `anchor` edge.
 */
export function placeImage(aspect: number, box: Rect, bb: Region, margin: number, fit: boolean, anchor: "top" | "bottom" = "top"): Rect {
  let w = Math.max(box.w, box.h * aspect)
  if (fit) {
    const needW = (box.w - 2 * margin) / Math.max(bb[2], 1e-6)
    const needH = ((box.h - 2 * margin) / Math.max(bb[3], 1e-6)) * aspect
    w = Math.max(1, Math.min(w, needW, needH))
  }
  const h = w / aspect
  let x = box.x + box.w / 2 - (bb[0] + bb[2] / 2) * w
  let y = box.y + box.h / 2 - (bb[1] + bb[3] / 2) * h
  x = w >= box.w ? Math.min(box.x, Math.max(box.x + box.w - w, x)) : box.x + (box.w - w) / 2
  y = h >= box.h ? Math.min(box.y, Math.max(box.y + box.h - h, y)) : anchor === "top" ? box.y : box.y + box.h - h
  return { x, y, w, h }
}

export const intersect = (a: Rect, b: Rect): Rect => {
  const x = Math.max(a.x, b.x)
  const y = Math.max(a.y, b.y)
  return { x, y, w: Math.max(0, Math.min(a.x + a.w, b.x + b.w) - x), h: Math.max(0, Math.min(a.y + a.h, b.y + b.h) - y) }
}

export const regionsBox = (regions: Region[]): Region => {
  if (!regions.length) return [0, 0, 1, 1]
  let x0 = 1, y0 = 1, x1 = 0, y1 = 0
  for (const [x, y, w, h] of regions) {
    x0 = Math.min(x0, x); y0 = Math.min(y0, y)
    x1 = Math.max(x1, x + w); y1 = Math.max(y1, y + h)
  }
  return [x0, y0, x1 - x0, y1 - y0]
}

/** The beats, as fractions of the whole progress. */
export const LOWER: [number, number] = [0.04, 0.26] // the photo's lower edge rises
export const TYPE: [number, number] = [0.18, 0.4] // the sentence writes itself, braces empty
export const SCORE: [number, number] = [0.3, 0.4] // cut lines traced
export const FLY: [number, number] = [0.4, 0.95] // pieces drop in
export const FLY_LEN = 0.22
export const SETTLED = 0.985

/** When piece i of n lifts and lands. Staggered so three or four are in the air at once. */
export const flightWindow = (i: number, n: number): [number, number] => {
  const len = Math.min(FLY_LEN, FLY[1] - FLY[0])
  const stagger = n > 1 ? (FLY[1] - FLY[0] - len) / (n - 1) : 0
  const a = FLY[0] + i * stagger
  return [a, a + len]
}

/** When piece i's outline is scored into the photo. */
export const scoreWindow = (i: number, n: number): [number, number] => {
  const step = n > 1 ? (SCORE[1] - SCORE[0]) / n : 0
  const a = SCORE[0] + i * step
  return [a, a + 0.06]
}

/** Word w of `total` rises out of a blur; the sentence types left to right. Fractional w places braces between words. */
export const wordWindow = (w: number, total: number): [number, number] => {
  const len = 0.07
  const s = TYPE[0] + (total > 1 ? clamp01(w / (total - 1)) : 0) * (TYPE[1] - TYPE[0] - len)
  return [s, s + len]
}

export type FlightFrame = { x: number; y: number; w: number; h: number; rot: number; scale: number; zoom: number; shadow: number; edge: number }

/**
 * A piece u of the way through its flight from hole `a` to slot `b`: lifts
 * toward you (scale up, shadow, a small rise), drops along a gently bowed
 * path while tilting, opens its window mid-air (w/h swell, crop zooms out),
 * then lands with a small overshoot. u = 0 is exactly the hole, u = 1
 * exactly the slot.
 */
export function flight(u: number, a: Rect, b: Rect, side: number): FlightFrame {
  const lift = easeOutCubic(ramp(u, 0, 0.18))
  const t = easeInOutCubic(ramp(u, 0.1, 0.88))
  const settle = ramp(u, 0.82, 1)
  const ax = a.x + a.w / 2, ay = a.y + a.h / 2
  const bx = b.x + b.w / 2, by = b.y + b.h / 2
  const dist = Math.hypot(bx - ax, by - ay)
  const cx = (ax + bx) / 2 + side * dist * 0.14
  const cy = (ay + by) / 2
  const k = 1 - t
  const x = k * k * ax + 2 * k * t * cx + t * t * bx
  const y = k * k * ay + 2 * k * t * cy + t * t * by - lift * k * 14
  const breathe = Math.sin(Math.PI * t)
  const w = lerp(a.w, b.w, t) * (1 + breathe * 0.12)
  const h = lerp(a.h, b.h, t) * (1 + breathe * 0.08)
  return {
    x: x - w / 2,
    y: y - h / 2,
    w,
    h,
    rot: side * (6 * breathe - 2 * lift * k),
    scale: 1 + 0.06 * lift - 0.06 * easeOutBack(settle),
    zoom: 1 - 0.24 * breathe,
    shadow: lift * (1 - settle),
    edge: lift * (1 - t),
  }
}

/**
 * How to draw the whole image inside a w × h window so `region` covers it,
 * centred. `zoom` < 1 opens the window onto the surroundings. At the hole's
 * own size this is exactly the photo's own scale and offset.
 */
export function cropFor(region: Region, aspect: number, w: number, h: number, zoom = 1) {
  const [rx, ry, rw, rh] = region
  let D = Math.max(w / Math.max(rw, 1e-6), (h * aspect) / Math.max(rh, 1e-6)) * zoom
  D = Math.max(D, w, h * aspect)
  const Dh = D / aspect
  let ix = w / 2 - (rx + rw / 2) * D
  let iy = h / 2 - (ry + rh / 2) * Dh
  ix = Math.min(0, Math.max(w - D, ix))
  iy = Math.min(0, Math.max(h - Dh, iy))
  return { D, Dh, ix, iy }
}
// #endregion

// ---------------------------------------------------------------------------
// Default content: a flock of painted pigeons in an open blue sky
// (generated for this component; served from the repo through jsDelivr).

export const FLOCK_SRC = "https://cdn.jsdelivr.net/gh/Kedhareswer/21stdev-my-components@main/media/cutout-sentence/flock.jpg"

export const FLOCK_SENTENCE =
  "A {kal}kaleidoscope of {paint}painted {wings}wings dances {dance}across the {vast}vast and {tranq}tranquil cerulean {sky}sky."

export const FLOCK_PIECES: CutoutPiece[] = [
  { id: "kal", word: "kaleidoscope", region: [0.5573, 0.6816, 0.0911, 0.0918] },
  { id: "paint", word: "painted", region: [0.4417, 0.375, 0.0667, 0.0813] },
  { id: "wings", word: "wings", region: [0.4792, 0.5688, 0.0667, 0.1] },
  { id: "dance", word: "across", region: [0.6458, 0.5875, 0.0792, 0.0938] },
  { id: "vast", word: "vast", region: [0.0333, 0.3375, 0.1417, 0.1188] },
  { id: "tranq", word: "tranquil", region: [0.5958, 0.3875, 0.0625, 0.075] },
  { id: "sky", word: "sky", region: [0.3333, 0.475, 0.075, 0.1125] },
]

export type CutoutSentenceProps = {
  /** The photo. */
  src?: string
  alt?: string
  /** Width ÷ height of `src`, used until it has loaded. */
  imageAspect?: number
  /** Words with `{id}` placeholders where pieces land. Write `{id}word` to hug the word. */
  sentence?: string
  pieces?: CutoutPiece[]
  /** `scroll` scrubs with the page; `auto` plays once on view, then offers a replay. */
  mode?: "scroll" | "auto"
  /** Stage height. Must be a definite length. */
  height?: string
  /** Scroll mode: extra stage-heights of scroll the story takes. */
  scrollLength?: number
  /** Share of the stage kept for the sentence once the photo settles (0–1). Grows if the sentence needs more. */
  split?: number
  /** Slot height in em. */
  pieceHeight?: number
  /** Multiplies the fluid sentence size. */
  fontScale?: number
  /** Small line above the sentence. Empty by default. */
  eyebrow?: string
  /** Line on the photo before it starts. `""` hides it. */
  hint?: string
  background?: string
  ink?: string
  muted?: string
  fontFamily?: string
  className?: string
  onComplete?: () => void
}

const useIsoLayoutEffect = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect

function useReducedMotion() {
  const [reduced, setReduced] = React.useState(false)
  useIsoLayoutEffect(() => {
    if (typeof matchMedia !== "function") return
    const mq = matchMedia("(prefers-reduced-motion: reduce)")
    const on = () => setReduced(mq.matches)
    on()
    mq.addEventListener("change", on)
    return () => mq.removeEventListener("change", on)
  }, [])
  return reduced
}

type Geo = {
  frame0: Rect
  frame1: Rect
  img0: Rect
  img1: Rect
  holes: Rect[]
  slots: Rect[]
  sides: number[]
}

const CSS = `
.cs-root{position:relative;width:100%;overflow:clip}
.cs-stage{position:sticky;top:0;width:100%;overflow:hidden}
.cs-frame{position:absolute;left:0;top:0;overflow:hidden;will-change:transform;background:color-mix(in oklab,var(--cs-ink) 10%,var(--cs-bg))}
.cs-img{position:absolute;left:0;top:0;max-width:none;display:block;user-select:none;-webkit-user-drag:none;transition:opacity .9s ease}
.cs-cut{position:absolute;box-sizing:border-box}
.cs-hole{pointer-events:none;background:var(--cs-bg)}
.cs-hole .cs-tag{position:absolute;left:50%;top:calc(100% + 8px);transform:translate(-50%,-4px);opacity:0;white-space:nowrap;font-size:12px;letter-spacing:.04em;padding:4px 9px;border-radius:999px;background:var(--cs-ink);color:var(--cs-bg);pointer-events:none;transition:opacity .3s ease,transform .3s ease}
.cs-score{position:absolute;inset:-1px;width:calc(100% + 2px);height:calc(100% + 2px);overflow:visible;pointer-events:none}
.cs-score rect{fill:none;stroke:#fff;stroke-width:1.5;filter:drop-shadow(0 0 2px rgba(0,0,0,.35))}
.cs-sentence{position:absolute;left:0;top:0;margin:0;text-align:center;line-height:1.35;font-weight:400;letter-spacing:-.01em}
.cs-eyebrow{display:block;margin-bottom:1em;font-size:.4em;letter-spacing:.22em;text-transform:uppercase;color:var(--cs-muted);font-weight:500}
.cs-g{display:inline-block;white-space:nowrap}
.cs-w{display:inline-block;will-change:transform,opacity,filter}
.cs-brace{display:inline-block;font-weight:300;transform-origin:50% 55%}
.cs-slot{display:inline-block;vertical-align:middle;margin:.1em .14em}
.cs-layer{position:absolute;inset:0;pointer-events:none}
.cs-piece{position:absolute;left:0;top:0;pointer-events:none;transform-origin:50% 50%;will-change:transform;visibility:hidden}
.cs-card{position:absolute;inset:0;overflow:hidden;transition:transform .5s cubic-bezier(.2,.9,.25,1.25),box-shadow .5s ease}
.cs-card img{position:absolute;left:0;top:0;max-width:none;display:block;pointer-events:none;user-select:none}
.cs-root[data-settled] .cs-piece,.cs-root[data-settled] .cs-hole{pointer-events:auto;cursor:pointer}
.cs-piece.is-hot .cs-card{transform:translateY(-3px) scale(1.06);box-shadow:0 16px 30px -14px rgba(0,0,0,.5)}
.cs-hole.is-hot{animation:cs-pulse 1.4s ease-in-out infinite}
.cs-hole.is-hot .cs-tag{opacity:1;transform:translate(-50%,0)}
@keyframes cs-pulse{0%,100%{box-shadow:inset 0 0 0 1.5px var(--cs-ink)}50%{box-shadow:inset 0 0 0 4px color-mix(in oklab,var(--cs-ink) 30%,transparent)}}
.cs-hint{position:absolute;left:0;right:0;bottom:clamp(18px,5vh,44px);display:flex;flex-direction:column;align-items:center;gap:12px;color:#fff;font-size:12px;letter-spacing:.24em;text-transform:uppercase;text-shadow:0 1px 10px rgba(0,0,0,.35);pointer-events:none}
.cs-hint i{display:block;width:1px;height:42px;background:linear-gradient(#fff,transparent);transform-origin:top;animation:cs-drip 2.2s cubic-bezier(.6,0,.2,1) infinite}
@keyframes cs-drip{0%{transform:scaleY(0);opacity:1}60%{transform:scaleY(1);opacity:1}100%{transform:scaleY(1);opacity:0}}
.cs-replay{position:absolute;right:clamp(16px,3vw,32px);bottom:clamp(16px,3vw,28px);display:inline-flex;align-items:center;gap:8px;padding:9px 15px;border-radius:999px;border:1px solid color-mix(in oklab,var(--cs-ink) 14%,transparent);background:transparent;color:var(--cs-ink);font:500 13px/1 var(--cs-font);letter-spacing:.02em;cursor:pointer;opacity:0;transform:translateY(8px);pointer-events:none;transition:opacity .4s ease,transform .4s ease,background .2s ease}
.cs-replay:hover{background:color-mix(in oklab,var(--cs-ink) 7%,transparent)}
.cs-root[data-settled] .cs-replay{opacity:1;transform:none;pointer-events:auto}
.cs-replay:focus-visible{outline:2px solid var(--cs-ink);outline-offset:2px}
@media (prefers-reduced-motion: reduce){.cs-card,.cs-img,.cs-hole .cs-tag{transition:none}.cs-hole.is-hot{animation:none;box-shadow:inset 0 0 0 2px var(--cs-ink)}.cs-hint i{animation:none}}
`

export default function CutoutSentence({
  src = FLOCK_SRC,
  alt = "A flock of brightly coloured pigeons flying across a clear blue sky.",
  imageAspect = 1.5,
  sentence = FLOCK_SENTENCE,
  pieces = FLOCK_PIECES,
  mode = "scroll",
  height = "100svh",
  scrollLength = 2.6,
  split = 0.48,
  pieceHeight = 2.9,
  fontScale = 1,
  eyebrow = "",
  hint = "Scroll to read the picture",
  background = "color-mix(in oklab, var(--color-foreground, #111) 7.5%, var(--color-background, #fff))",
  ink = "var(--color-foreground, #141414)",
  muted = "var(--color-muted-foreground, #6b6b6b)",
  fontFamily = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  className = "",
  onComplete,
}: CutoutSentenceProps) {
  const reduced = useReducedMotion()
  const [aspect, setAspect] = React.useState(imageAspect)
  const [loaded, setLoaded] = React.useState(false)

  const rootRef = React.useRef<HTMLElement | null>(null)
  const stageRef = React.useRef<HTMLDivElement | null>(null)
  const frameRef = React.useRef<HTMLDivElement | null>(null)
  const imgBoxRef = React.useRef<HTMLDivElement | null>(null)
  const sentRef = React.useRef<HTMLParagraphElement | null>(null)
  const hintRef = React.useRef<HTMLDivElement | null>(null)
  const eyebrowRef = React.useRef<HTMLSpanElement | null>(null)
  const pieceEls = React.useRef<(HTMLDivElement | null)[]>([])
  const cardImgs = React.useRef<(HTMLImageElement | null)[]>([])
  const holeEls = React.useRef<(HTMLDivElement | null)[]>([])
  const scoreEls = React.useRef<(SVGSVGElement | null)[]>([])
  const slotEls = React.useRef<(HTMLSpanElement | null)[]>([])
  const braceEls = React.useRef<(HTMLSpanElement | null)[]>([])
  const wordEls = React.useRef<(HTMLSpanElement | null)[]>([])
  const geo = React.useRef<Geo | null>(null)
  const prog = React.useRef(0)
  const tease = React.useRef(0)
  const done = React.useRef(false)
  const last = React.useRef<Map<Element, string>>(new Map())
  const player = React.useRef<gsap.core.Animation | null>(null)

  const photo = React.useRef<HTMLImageElement | null>(null)
  React.useEffect(() => {
    // a cached photo can fire onLoad before this runs, so read it instead of assuming it is pending
    const im = photo.current
    setLoaded(!!(im && im.complete && im.naturalWidth))
  }, [src])

  // the sentence, in reading order; pieces drop in that order
  const model = React.useMemo(() => {
    const byId = new Map(pieces.map((p) => [p.id, p]))
    const parsed = parseSentence(sentence, pieces.map((p) => p.id))
    const list = parsed.order.map((id) => byId.get(id) as CutoutPiece)
    const at = parsed.groups.flat().flatMap((t) => (t.kind === "piece" ? [t.at] : []))
    return { ...parsed, list, at }
  }, [sentence, pieces])
  const n = model.list.length
  const bbox = React.useMemo(() => regionsBox(model.list.map((p) => p.region)), [model])

  const write = (el: Element | null | undefined, key: string, apply: (s: CSSStyleDeclaration) => void) => {
    if (!el) return
    const m = last.current
    if (m.get(el) === key) return
    m.set(el, key)
    apply((el as HTMLElement).style)
  }

  const render = React.useCallback(
    (p: number) => {
      const g = geo.current
      if (!g) return
      const lo = easeInOutCubic(ramp(p, LOWER[0], LOWER[1]))
      const fr = lerpRect(g.frame0, g.frame1, lo)
      const im = lerpRect(g.img0, g.img1, lo)
      const frame = frameRef.current
      if (frame) {
        frame.style.transform = "translate3d(" + fr.x + "px," + fr.y + "px,0)"
        frame.style.width = fr.w + "px"
        frame.style.height = fr.h + "px"
      }
      const box = imgBoxRef.current
      if (box) {
        box.style.transform = "translate3d(" + (im.x - fr.x) + "px," + (im.y - fr.y) + "px,0)"
        box.style.width = im.w + "px"
        box.style.height = im.h + "px"
      }
      const hintO = 1 - ramp(p, 0, 0.06)
      write(hintRef.current, "o" + hintO.toFixed(3), (s) => {
        s.opacity = String(hintO)
        s.transform = "translateY(" + (1 - hintO) * 14 + "px)"
      })

      const teaseOn = tease.current * (1 - ramp(p, 0, 0.05))
      for (let i = 0; i < n; i++) {
        const [a, b] = flightWindow(i, n)
        const u = ramp(p, a, b)
        const [sa, sb] = scoreWindow(i, n)
        const draw = Math.max(easeOutCubic(ramp(p, sa, sb)), teaseOn)
        // the line goes the instant its piece leaves; the hole is edge enough
        const scoreO = u > 0 ? 0 : draw
        const score = scoreEls.current[i]
        write(score, "s" + scoreO.toFixed(3) + draw.toFixed(3), (s) => {
          s.opacity = String(scoreO)
          const r = score?.firstElementChild as SVGRectElement | null
          if (r) r.style.strokeDashoffset = String(1 - draw)
        })
        write(holeEls.current[i], u > 0 ? "h1" : "h0", (s) => {
          s.opacity = u > 0 ? "1" : "0"
        })
        const el = pieceEls.current[i]
        const img = cardImgs.current[i]
        if (el && img) {
          if (u <= 0) {
            write(el, "off", (s) => {
              s.visibility = "hidden"
            })
          } else {
            const f = flight(u, g.holes[i], g.slots[i], g.sides[i])
            const c = cropFor(model.list[i].region, aspect, f.w, f.h, f.zoom)
            last.current.delete(el)
            el.style.visibility = "visible"
            el.style.width = f.w + "px"
            el.style.height = f.h + "px"
            el.style.transform = "translate3d(" + f.x + "px," + f.y + "px,0) rotate(" + f.rot + "deg) scale(" + f.scale + ")"
            el.style.zIndex = u < 1 ? String(10 + Math.round(f.shadow * 10)) : "1"
            img.style.width = c.D + "px"
            img.style.height = c.Dh + "px"
            img.style.transform = "translate3d(" + c.ix + "px," + c.iy + "px,0)"
            const card = img.parentElement
            if (card) {
              card.style.boxShadow =
                f.shadow > 0.01 || f.edge > 0.01
                  ? "0 " + (4 + f.shadow * 22) + "px " + (8 + f.shadow * 36) + "px -6px rgba(0,0,0," + (0.36 * f.shadow).toFixed(3) + "), inset 0 0 0 1.5px rgba(255,255,255," + (0.85 * f.edge).toFixed(3) + ")"
                  : ""
            }
          }
        }
        // braces appear with the text around them, empty; they clamp as the piece lands
        const [ws, we] = wordWindow(model.at[i] - 0.5, model.words)
        const o = easeOutCubic(ramp(p, ws, we))
        const clamp = Math.sin(Math.PI * ramp(p, b - 0.035, b + 0.025))
        const L = braceEls.current[i * 2]
        const R = braceEls.current[i * 2 + 1]
        const key = "b" + o.toFixed(3) + clamp.toFixed(3)
        write(L, key, (s) => {
          s.opacity = String(o)
          s.transform = "translate(" + clamp * 0.1 + "em," + (1 - o) * 0.4 + "em)"
        })
        write(R, key, (s) => {
          s.opacity = String(o)
          s.transform = "translate(" + -clamp * 0.1 + "em," + (1 - o) * 0.4 + "em)"
        })
      }

      for (let w = 0; w < model.words; w++) {
        const [s0, s1] = wordWindow(w, model.words)
        const r = easeOutCubic(ramp(p, s0, s1))
        write(wordEls.current[w], "w" + r.toFixed(3), (s) => {
          s.opacity = String(r)
          s.transform = r >= 1 ? "" : "translateY(" + (1 - r) * 0.4 + "em)"
          s.filter = r >= 1 ? "" : "blur(" + (1 - r) * 7 + "px)"
        })
      }
      const eb = easeOutCubic(ramp(p, TYPE[0] - 0.04, TYPE[0] + 0.04))
      write(eyebrowRef.current, "e" + eb.toFixed(3), (s) => {
        s.opacity = String(eb)
        s.transform = "translateY(" + (1 - eb) * 0.6 + "em)"
      })

      const root = rootRef.current
      if (root) {
        const settled = p >= SETTLED
        if (settled !== root.hasAttribute("data-settled")) root.toggleAttribute("data-settled", settled)
        if (settled && !done.current) {
          done.current = true
          onComplete?.()
        }
        if (p < 0.5) done.current = false
      }
    },
    [model, n, aspect, onComplete],
  )

  const measure = React.useCallback(() => {
    const stage = stageRef.current
    const sent = sentRef.current
    if (!stage || !sent) return
    const W = stage.clientWidth
    const H = stage.clientHeight
    if (!W || !H) return
    const fs = Math.max(17, Math.min(32, W * 0.021 + 3)) * fontScale
    const gutter = W < 640 ? 16 : Math.max(24, W * 0.06)
    const sw = Math.min(W - gutter * 2, fs * 31)
    sent.style.fontSize = fs + "px"
    sent.style.width = sw + "px"
    sent.style.left = (W - sw) / 2 + "px"
    const sh = sent.offsetHeight
    const pad = Math.max(20, H * 0.06)
    const picH = Math.max(H * 0.3, Math.min(H * (1 - split), H - sh - pad * 2))
    const avail: Rect = { x: 0, y: 0, w: W, h: picH }
    // flush to the top edge; on narrow screens it may come out shorter than
    // its share (it shrinks to keep every cut in view) and the sentence takes the rest
    const img1 = placeImage(aspect, avail, bbox, Math.max(10, W * 0.012), true, "top")
    const frame1 = intersect(avail, img1)
    const below = frame1.y + frame1.h
    const sentTop = below + Math.max(pad * 0.6, (H - below - sh) / 2)
    sent.style.top = sentTop + "px"
    const frame0: Rect = { x: 0, y: 0, w: W, h: H }
    const img0 = placeImage(aspect, frame0, bbox, 0, false)
    const holes = model.list.map(({ region: [x, y, w, h] }) => ({
      x: img1.x + x * img1.w,
      y: img1.y + y * img1.h,
      w: w * img1.w,
      h: h * img1.h,
    }))
    const sl = sent.offsetLeft
    const st = sent.offsetTop
    const slots = model.list.map((_, i) => {
      const el = slotEls.current[i]
      return el ? { x: sl + el.offsetLeft, y: st + el.offsetTop, w: el.offsetWidth, h: el.offsetHeight } : holes[i]
    })
    const sides = holes.map((h, i) => {
      const d = slots[i].x + slots[i].w / 2 - (h.x + h.w / 2)
      return Math.abs(d) < 8 ? (i % 2 ? 1 : -1) : Math.sign(d)
    })
    geo.current = { frame0, frame1, img0, img1, holes, slots, sides }
    last.current.clear()
    render(prog.current)
  }, [aspect, bbox, fontScale, model, render, split])

  useIsoLayoutEffect(() => {
    measure()
    const stage = stageRef.current
    if (!stage || typeof ResizeObserver === "undefined") return
    const ro = new ResizeObserver(() => measure())
    ro.observe(stage)
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts
    fonts?.ready.then(() => measure())
    return () => ro.disconnect()
  }, [measure])

  // the pieces' copies of the photo need their crop as soon as it exists
  React.useEffect(() => {
    if (loaded) measure()
  }, [loaded, measure])

  // drive the progress: scrubbed by scroll, played once on view, or parked at the end
  useIsoLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    if (reduced) {
      prog.current = 1
      render(1)
      return
    }
    gsap.registerPlugin(ScrollTrigger)
    const state = { p: prog.current }
    const ctx = gsap.context(() => {
      if (mode === "scroll") {
        gsap.to(state, {
          p: 1,
          ease: "none",
          onUpdate: () => {
            prog.current = state.p
            render(state.p)
          },
          scrollTrigger: { trigger: root, start: "top top", end: "bottom bottom", scrub: 0.65 },
        })
        // first impression: the cuts are traced on the whole photo once, then fade
        const t = { v: 0 }
        gsap
          .timeline({ delay: 1.2 })
          .to(t, { v: 1, duration: 1.1, ease: "power2.inOut" })
          .to(t, { v: 0, duration: 0.8, ease: "power2.in" }, "+=0.9")
          .eventCallback("onUpdate", () => {
            tease.current = t.v
            if (prog.current < 0.06) render(prog.current)
          })
      } else {
        ScrollTrigger.create({
          trigger: root,
          start: "top 60%",
          once: true,
          onEnter: () => {
            player.current = gsap.to(state, {
              p: 1,
              duration: 7,
              ease: "power1.inOut",
              delay: 0.5,
              onUpdate: () => {
                prog.current = state.p
                render(state.p)
              },
            })
          },
        })
      }
    }, root)
    return () => {
      ctx.revert()
      player.current?.kill()
    }
  }, [mode, reduced, render])

  const replay = () => {
    const state = { p: prog.current }
    const step = () => {
      prog.current = state.p
      render(state.p)
    }
    player.current?.kill()
    player.current = gsap
      .timeline()
      .to(state, { p: 0.3, duration: 1.8, ease: "power2.inOut", onUpdate: step })
      .to(state, { p: 1, duration: 5.4, ease: "power1.inOut", delay: 0.25, onUpdate: step })
  }

  const hot = (i: number, on: boolean) => {
    pieceEls.current[i]?.classList.toggle("is-hot", on)
    holeEls.current[i]?.classList.toggle("is-hot", on)
  }

  const scrolls = mode === "scroll" && !reduced
  const regionAspect = (p: CutoutPiece) => (p.region[2] * aspect) / Math.max(p.region[3], 1e-6)
  let braceIndex = 0

  return (
    <section
      ref={rootRef}
      data-cutout=""
      aria-label={sentence.replace(/\{[^{}]*\}/g, "").replace(/\s+/g, " ").trim()}
      className={"cs-root " + className}
      style={
        {
          height: scrolls ? "calc(" + height + " * " + (1 + scrollLength) + ")" : height,
          background,
          color: ink,
          fontFamily,
          "--cs-bg": background,
          "--cs-ink": ink,
          "--cs-muted": muted,
          "--cs-font": fontFamily,
        } as React.CSSProperties
      }
    >
      <style>{CSS}</style>
      <div ref={stageRef} className="cs-stage" style={{ height }}>
        <div ref={frameRef} className="cs-frame">
          <div ref={imgBoxRef} style={{ position: "absolute", left: 0, top: 0 }}>
            <img
              ref={photo}
              className="cs-img"
              src={src}
              alt={alt}
              draggable={false}
              onLoad={(e) => {
                const im = e.currentTarget
                if (im.naturalWidth && im.naturalHeight) setAspect(im.naturalWidth / im.naturalHeight)
                setLoaded(true)
              }}
              style={{ width: "100%", height: "100%", maxWidth: "none", opacity: loaded ? 1 : 0 }}
            />
            {model.list.map((pc, i) => (
              <div
                key={pc.id}
                ref={(el) => {
                  holeEls.current[i] = el
                }}
                className="cs-cut cs-hole"
                onPointerEnter={() => hot(i, true)}
                onPointerLeave={() => hot(i, false)}
                style={{
                  left: pc.region[0] * 100 + "%",
                  top: pc.region[1] * 100 + "%",
                  width: pc.region[2] * 100 + "%",
                  height: pc.region[3] * 100 + "%",
                  opacity: 0,
                }}
              >
                <span className="cs-tag">{pc.word}</span>
              </div>
            ))}
            {model.list.map((pc, i) => (
              <div
                key={pc.id + "-s"}
                className="cs-cut"
                aria-hidden="true"
                style={{
                  left: pc.region[0] * 100 + "%",
                  top: pc.region[1] * 100 + "%",
                  width: pc.region[2] * 100 + "%",
                  height: pc.region[3] * 100 + "%",
                  pointerEvents: "none",
                }}
              >
                <svg
                  ref={(el) => {
                    scoreEls.current[i] = el
                  }}
                  className="cs-score"
                  style={{ opacity: 0 }}
                >
                  <rect x="1" y="1" width="calc(100% - 2px)" height="calc(100% - 2px)" pathLength={1} strokeDasharray="1" strokeDashoffset="1" />
                </svg>
              </div>
            ))}
          </div>
        </div>

        <p ref={sentRef} className="cs-sentence">
          {eyebrow ? (
            <span ref={eyebrowRef} className="cs-eyebrow" aria-hidden="true">
              {eyebrow}
            </span>
          ) : null}
          {model.groups.map((grp, gi) => (
            <React.Fragment key={gi}>
              {gi > 0 ? " " : null}
              <span className="cs-g">
                {grp.map((t, ti) => {
                  const tight = ti > 0 ? "0.06em" : undefined
                  if (t.kind === "word") {
                    return (
                      <span
                        key={ti}
                        ref={(el) => {
                          wordEls.current[t.w] = el
                        }}
                        className="cs-w"
                        style={{ opacity: 0, marginLeft: tight }}
                      >
                        {t.text}
                      </span>
                    )
                  }
                  const pc = model.list[t.index]
                  const ar = pc.aspect ?? regionAspect(pc)
                  const w = Math.max(0.9, Math.min(5, pieceHeight * ar))
                  const bl = braceIndex++
                  const br = braceIndex++
                  return (
                    <span key={ti} aria-hidden="true" style={{ marginLeft: tight }}>
                      <span
                        ref={(el) => {
                          braceEls.current[bl] = el
                        }}
                        className="cs-brace"
                        style={{ opacity: 0 }}
                      >
                        {"{"}
                      </span>
                      <span
                        ref={(el) => {
                          slotEls.current[t.index] = el
                        }}
                        className="cs-slot"
                        style={{ width: w + "em", height: pieceHeight + "em" }}
                      />
                      <span
                        ref={(el) => {
                          braceEls.current[br] = el
                        }}
                        className="cs-brace"
                        style={{ opacity: 0 }}
                      >
                        {"}"}
                      </span>
                    </span>
                  )
                })}
              </span>
            </React.Fragment>
          ))}
        </p>

        <div className="cs-layer" aria-hidden="true">
          {model.list.map((pc, i) => (
            <div
              key={pc.id}
              ref={(el) => {
                pieceEls.current[i] = el
              }}
              className="cs-piece"
              onPointerEnter={() => hot(i, true)}
              onPointerLeave={() => hot(i, false)}
            >
              <div className="cs-card">
                <img
                  ref={(el) => {
                    cardImgs.current[i] = el
                  }}
                  src={src}
                  alt=""
                  draggable={false}
                  style={{ maxWidth: "none" }}
                />
              </div>
            </div>
          ))}
        </div>

        {scrolls && hint ? (
          <div ref={hintRef} className="cs-hint" aria-hidden="true">
            <span>{hint}</span>
            <i />
          </div>
        ) : null}

        {mode === "auto" && !reduced ? (
          <button type="button" className="cs-replay" onClick={replay}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 12a9 9 0 1 0 3-6.7" />
              <path d="M3 4v5h5" />
            </svg>
            Replay
          </button>
        ) : null}
      </div>
    </section>
  )
}
