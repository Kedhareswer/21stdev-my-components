"use client"

import * as React from "react"

/* Perimeter wordmark preloader.
 *
 * The letters of a short word start spread around the edge of a gradient
 * panel: the first already sits in its place at the bottom left, the rest wait
 * at the bottom-right, top-right and top-left corners. Once a second, every
 * waiting letter moves one corner along the edge and the one at the bottom
 * right slides home, so the word assembles left to right. With the last letter
 * the panel drops away and the page underneath is left holding the wordmark.
 *
 * Geometry is container units and percentages only, so no box is measured and
 * a resize needs no code. The clock drives two numbers per letter:
 *   --pwp-u  0 = start of its run, 1 = flush with the right gutter
 *   --pwp-v  0 = on the bottom line, 1 = on the top line
 */

// #region timeline
/** Lengths in periods. One period is the gap between two moves (1 s in the reference). */
export const PWP_HOLD = 0.4
export const PWP_MOVE = 0.78
export const PWP_WIPE_AT = 0.22
export const PWP_WIPE = 0.76

function pwpClamp(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x
}

/** cubic-bezier(0.65, 0, 0.35, 1): fitted to the reference, rms error under 1%. */
export function pwpEase(x: number): number {
  const u = pwpClamp(x)
  // The end of the run is a sum of lengths, so it can land a rounding error short of 1.
  if (u < 1e-9) return 0
  if (u > 1 - 1e-9) return 1
  let lo = 0
  let hi = 1
  for (let i = 0; i < 26; i++) {
    const m = (lo + hi) / 2
    const bx = 3 * (1 - m) * (1 - m) * m * 0.65 + 3 * (1 - m) * m * m * 0.35 + m * m * m
    if (bx < u) lo = m
    else hi = m
  }
  const m = (lo + hi) / 2
  return 3 * (1 - m) * m * m + m * m * m
}

/** How many periods the whole sequence takes for a word of n letters. */
export function pwpUnits(n: number): number {
  const moves = Math.max(n - 1, 1)
  return PWP_HOLD + (moves - 1) + PWP_WIPE_AT + PWP_WIPE
}

/** t is 0..1 of the duration. A letter's station is how many moves it still has to make. */
export function pwpPose(t: number, n: number) {
  const moves = Math.max(n - 1, 1)
  const tau = pwpClamp(t) * pwpUnits(n) - PWP_HOLD
  const stations: number[] = []
  for (let i = 0; i < n; i++) {
    let s = i
    for (let j = 0; j < i; j++) s -= pwpEase((tau - j) / PWP_MOVE)
    stations.push(s)
  }
  const wipeFrom = moves - 1 + PWP_WIPE_AT
  return { stations: stations, wipe: pwpEase((tau - wipeFrom) / PWP_WIPE), revealAt: (wipeFrom + PWP_HOLD) / pwpUnits(n) }
}

/** Distance from the bottom-right corner, going up the right edge and then left along the top. */
function pwpDistance(station: number, n: number, rise: number): number {
  const q = n > 2 ? (2 * (station - 1)) / (n - 2) : 0
  return q <= 1 ? q * rise : rise + (q - 1)
}

/** Station to position. rise is the right edge's length as a share of the top edge's. */
export function pwpPoint(station: number, n: number, rise: number) {
  if (station <= 1) return { u: Math.max(station, 0), v: 0, top: false }
  const a = Math.floor(station)
  const b = Math.min(a + 1, Math.max(n - 1, 1))
  const from = pwpDistance(a, n, rise)
  const d = from + (pwpDistance(b, n, rise) - from) * (station - a)
  if (d <= rise) return { u: 1, v: rise > 0 ? d / rise : 1, top: true }
  return { u: pwpClamp(1 - (d - rise)), v: 1, top: true }
}

/** Advance widths of a bold grotesque, in em. Only used to size the word, so near enough is enough. */
export function pwpAdvance(text: string): number {
  const wide = "MW"
  const mid = "ABCDGHKNOQRUVXY&"
  let sum = 0
  for (const ch of text) {
    const c = ch.toUpperCase()
    if (c === "I" || c === "." || c === "!" || c === "1") sum += 0.3
    else if (wide.indexOf(c) > -1) sum += 0.9
    else if (mid.indexOf(c) > -1) sum += ch === c ? 0.73 : 0.6
    else sum += ch === c ? 0.64 : 0.56
  }
  return sum
}
// #endregion

const CSS =
  ".pwp-root{position:relative;width:100%;overflow:hidden;container-type:size;isolation:isolate}" +
  ".pwp-frame{position:absolute;inset:0;--pwp-cap:.716;--pwp-g:max(12px,2.1cqw);--pwp-iy:max(20px,4.35cqw);--pwp-fs:min(calc(51.7cqw / var(--pwp-sum)),20.7cqw,36cqh)}" +
  "@container (max-aspect-ratio:1/1){.pwp-frame{--pwp-fs:min(calc(70cqw / var(--pwp-sum)),20cqh);--pwp-iy:max(20px,4.35cqw,calc(var(--pwp-fs) * .24))}}" +
  ".pwp-content{position:absolute;inset:0}" +
  ".pwp-panel{position:absolute;inset:0;z-index:1;will-change:transform}" +
  ".pwp-frame[data-phase=done] .pwp-panel{display:none}" +
  ".pwp-word{position:absolute;inset:0;z-index:2;pointer-events:none;font-size:var(--pwp-fs);font-weight:700;letter-spacing:0;font-kerning:none;-webkit-font-smoothing:antialiased}" +
  ".pwp-frame[data-phase=done] .pwp-word[data-keep=false]{display:none}" +
  ".pwp-lane{position:absolute;left:calc(var(--pwp-g) - var(--pwp-l0,0) * 1em);right:calc(var(--pwp-g) - var(--pwp-r,0) * 1em);bottom:var(--pwp-iy);display:flex;align-items:flex-end;transform:translate3d(0,calc(var(--pwp-v,0) * (100% + 2 * var(--pwp-iy) - 100cqh)),0)}" +
  ".pwp-pre{display:flex;flex:none;visibility:hidden}" +
  ".pwp-lane[data-top]{left:calc(var(--pwp-g) - var(--pwp-l,0) * 1em)}" +
  ".pwp-lane[data-top] .pwp-pre{display:none}" +
  ".pwp-run{display:flex;flex:1 1 0;min-width:0;container-type:inline-size}" +
  ".pwp-g{display:flex;align-items:baseline;flex:none;white-space:pre;height:calc(var(--pwp-cap) * 1em);line-height:0}" +
  ".pwp-g::before{content:\"\";width:0;height:calc(var(--pwp-cap) * 1em)}" +
  ".pwp-glyph{transform:translate3d(calc(var(--pwp-u,0) * (100cqw - 100%)),0,0)}" +
  "@media (prefers-reduced-motion:reduce){.pwp-panel{transition:opacity .4s linear}.pwp-word[data-keep=false]{transition:opacity .4s linear}}"

/** A deep blue field with a pale top-left corner and a lighter bottom-right one. */
const PANEL =
  "radial-gradient(52% 70% at 0% 0%,#e6eef4 0%,rgba(214,227,237,.84) 15%,rgba(150,182,208,.4) 36%,rgba(90,140,180,0) 64%)," +
  "radial-gradient(46% 20% at 18% 0%,rgba(168,198,220,.78) 0%,rgba(150,185,212,.4) 48%,rgba(120,165,200,0) 100%)," +
  "radial-gradient(11% 72% at 0% 22%,rgba(160,190,214,.8) 0%,rgba(120,160,195,.42) 50%,rgba(90,140,180,0) 100%)," +
  "radial-gradient(50% 44% at 100% 104%,rgba(158,196,222,.96) 0%,rgba(120,168,203,.6) 45%,rgba(84,140,184,0) 100%)," +
  "radial-gradient(50% 72% at 104% 42%,rgba(86,152,190,.9) 0%,rgba(70,138,180,.46) 50%,rgba(56,124,170,0) 100%)," +
  "radial-gradient(95% 70% at 62% -6%,rgba(58,128,174,.95) 0%,rgba(52,122,169,.6) 50%,rgba(40,108,158,0) 100%)," +
  "radial-gradient(74% 86% at 30% 84%,#004480 0%,#00447f 26%,#0c528b 55%,#1f6398 100%)"

/* Ink, not boxes, meets the gutters: a canvas reports each letter's side
 * bearings and the font's cap height, and the CSS subtracts them. Each letter
 * is a box one cap height tall whose empty ::before puts the flex baseline on
 * its bottom edge, so the text baseline lands there whatever the font's ascent.
 * Without a canvas the cap height is a bold grotesque's and the boxes line up. */
function pwpInk(letters: string[], font: string) {
  if (typeof document === "undefined") return null
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d", { willReadFrequently: true })
  if (!ctx) return null
  // Text metrics come back rounded to whole pixels (and coarser at large sizes),
  // which is two or three pixels at display size. So draw each letter once and
  // read where its ink really starts and stops, to a fraction of a pixel.
  const px = 320
  const pad = 48
  const base = pad + px
  const spec = "700 " + px + "px " + font
  canvas.height = base + pad
  const scan = (ch: string) => {
    ctx.font = spec
    const adv = ctx.measureText(ch).width
    const w = Math.ceil(adv) + 2 * pad
    canvas.width = w
    ctx.font = spec
    ctx.textBaseline = "alphabetic"
    ctx.fillStyle = "#000"
    ctx.fillText(ch, pad, base)
    const data = ctx.getImageData(0, 0, w, canvas.height).data
    let left = -1
    let right = -1
    let top = -1
    for (let y = 0; y < canvas.height && top < 0; y++) {
      let most = 0
      for (let x = 0; x < w; x++) most = Math.max(most, data[(y * w + x) * 4 + 3])
      if (most > 8) top = y + 1 - most / 255
    }
    for (let x = 0; x < w; x++) {
      let most = 0
      for (let y = 0; y < canvas.height; y++) most = Math.max(most, data[(y * w + x) * 4 + 3])
      if (most <= 8) continue
      if (left < 0) left = x + 1 - most / 255
      right = x + most / 255
    }
    return { adv: adv, left: left, right: right, top: top }
  }
  try {
    const h = scan("H")
    if (h.top < 0) return null
    let sum = 0
    const sides = letters.map((ch) => {
      const g = scan(ch)
      sum += g.adv
      if (g.left < 0) return { l: 0, r: 0 }
      return { l: (g.left - pad) / px, r: (pad + g.adv - g.right) / px }
    })
    return { cap: (base - h.top) / px, sum: sum / px, sides: sides }
  } catch (e) {
    return null
  }
}

const useLayout = typeof window === "undefined" ? React.useEffect : React.useLayoutEffect

const FONT = '"Helvetica Neue", Helvetica, Arial, "Liberation Sans", sans-serif'

export interface PerimeterWordmarkPreloaderProps {
  /** The word. Each letter takes one move, so two to six letters read best. Spaces are dropped. */
  text?: string
  /** Whole sequence in milliseconds, from the first frame to the panel being gone. */
  duration?: number
  /** Called once, when the panel has left and the page is interactive. */
  onComplete?: () => void
  /** Called once, when the panel starts to drop and the page first shows. */
  onReveal?: () => void
  /** The page underneath. It is rendered from the start and uncovered at the end. */
  children?: React.ReactNode
  /** Height of the stage. Must be a definite length. */
  height?: string | number
  /** CSS background of the panel. */
  panel?: string
  /** Letter colour. */
  color?: string
  /** Font stack for the letters. A bold grotesque keeps the proportions. */
  fontFamily?: string
  /** Leave the assembled word on the page once the panel is gone. */
  keepWordmark?: boolean
  className?: string
}

export default function PerimeterWordmarkPreloader({
  text = "NOIR",
  duration = 3400,
  onComplete,
  onReveal,
  children,
  height = "100svh",
  panel = PANEL,
  color = "#fcfcfc",
  fontFamily = FONT,
  keepWordmark = true,
  className,
}: PerimeterWordmarkPreloaderProps) {
  const letters = React.useMemo(() => Array.from(text).filter((ch) => ch.trim() !== ""), [text])
  const word = letters.join("")
  const sum = Math.max(pwpAdvance(word), 0.9)
  const [phase, setPhase] = React.useState("loading")

  const frameRef = React.useRef(null as HTMLDivElement | null)
  const panelRef = React.useRef(null as HTMLDivElement | null)
  const wordRef = React.useRef(null as HTMLDivElement | null)
  const contentRef = React.useRef(null as HTMLDivElement | null)
  const onCompleteRef = React.useRef(onComplete)
  const onRevealRef = React.useRef(onReveal)
  onCompleteRef.current = onComplete
  onRevealRef.current = onReveal

  React.useEffect(() => {
    const el = contentRef.current
    if (el) el.toggleAttribute("inert", phase !== "done")
  }, [phase])

  useLayout(() => {
    const frame = frameRef.current
    const wordEl = wordRef.current
    if (!frame || !wordEl) return
    let live = true
    const fit = () => {
      const ink = live ? pwpInk(letters, fontFamily) : null
      if (!ink || ink.sum <= 0) return
      frame.style.setProperty("--pwp-cap", ink.cap.toFixed(4))
      frame.style.setProperty("--pwp-sum", ink.sum.toFixed(4))
      wordEl.style.setProperty("--pwp-l0", ink.sides[0].l.toFixed(4))
      const lanes = wordEl.querySelectorAll(".pwp-lane")
      ink.sides.forEach((side, i) => {
        const lane = lanes[i] as HTMLElement | undefined
        if (!lane) return
        lane.style.setProperty("--pwp-l", side.l.toFixed(4))
        lane.style.setProperty("--pwp-r", side.r.toFixed(4))
      })
    }
    fit()
    // A web font that lands late has different bearings than its fallback.
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit)
    return () => {
      live = false
    }
  }, [letters, fontFamily])

  React.useEffect(() => {
    const frame = frameRef.current
    const panelEl = panelRef.current
    const wordEl = wordRef.current
    if (!frame || !panelEl || !wordEl) return
    const lanes = Array.from(wordEl.querySelectorAll(".pwp-lane")) as HTMLElement[]
    const n = lanes.length
    const total = Math.max(duration, 1)
    let rise = 0.42
    let raf = 0
    let timer = 0
    let revealed = false
    let finished = false

    // Only the corner-to-corner pacing of words that are not four letters long
    // needs the edge lengths, and the observer hands them over without a read.
    const ro =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver((entries) => {
            const box = entries[0].contentRect
            if (box.width < 1 || box.height < 1) return
            const tall = box.width / box.height <= 1
            const fs = tall ? Math.min((0.7 * box.width) / sum, 0.2 * box.height) : Math.min((0.517 * box.width) / sum, 0.207 * box.width, 0.36 * box.height)
            const up = box.height - 2 * Math.max(20, 0.0435 * box.width, tall ? 0.24 * fs : 0) - 0.716 * fs
            const across = box.width - 2 * Math.max(12, 0.021 * box.width) - (fs * sum) / Math.max(n, 1)
            if (up > 0 && across > 0) rise = up / across
          })
    if (ro) ro.observe(frame)

    const place = (stations: number[]) => {
      for (let i = 0; i < n; i++) {
        const p = pwpPoint(stations[i], n, rise)
        lanes[i].style.setProperty("--pwp-u", p.u.toFixed(5))
        lanes[i].style.setProperty("--pwp-v", p.v.toFixed(5))
        lanes[i].toggleAttribute("data-top", p.top)
      }
    }
    const reveal = () => {
      if (revealed) return
      revealed = true
      setPhase("reveal")
      if (onRevealRef.current) onRevealRef.current()
    }
    const finish = () => {
      if (finished) return
      finished = true
      setPhase("done")
      if (onCompleteRef.current) onCompleteRef.current()
    }

    setPhase("loading")
    panelEl.style.opacity = "1"
    panelEl.style.transform = "translate3d(0,0,0)"
    wordEl.style.opacity = "1"

    const still = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (still) {
      // No travelling letters and no sliding panel: the finished word, then a fade.
      place(lanes.map(() => 0))
      timer = window.setTimeout(() => {
        reveal()
        panelEl.style.opacity = "0"
        if (!keepWordmark) wordEl.style.opacity = "0"
        timer = window.setTimeout(finish, 420)
      }, Math.min(total, 700))
    } else {
      const revealAt = pwpPose(0, n).revealAt
      let start = -1
      const tick = (now: number) => {
        if (start < 0) start = now
        const t = Math.min((now - start) / total, 1)
        const pose = pwpPose(t, n)
        place(pose.stations)
        panelEl.style.transform = "translate3d(0," + (pose.wipe * 100).toFixed(3) + "%,0)"
        if (!keepWordmark) wordEl.style.opacity = (1 - pose.wipe).toFixed(3)
        if (t >= revealAt) reveal()
        if (t >= 1) finish()
        else raf = requestAnimationFrame(tick)
      }
      place(pwpPose(0, n).stations)
      raf = requestAnimationFrame(tick)
    }

    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(timer)
      if (ro) ro.disconnect()
    }
  }, [word, duration, keepWordmark, sum])

  const start = pwpPose(0, letters.length).stations

  return (
    <div
      className={"pwp-root" + (className ? " " + className : "")}
      style={{ height: height }}
      aria-busy={phase !== "done"}
    >
      <style>{CSS}</style>
      <div ref={frameRef} className="pwp-frame" data-phase={phase} style={{ ["--pwp-sum" as string]: sum.toFixed(3) }}>
        <div ref={contentRef} className="pwp-content">
          {children}
        </div>
        <div ref={panelRef} className="pwp-panel" aria-hidden="true" style={{ background: panel }} />
        <div
          ref={wordRef}
          className="pwp-word"
          role="img"
          aria-label={word}
          data-keep={keepWordmark ? "true" : "false"}
          style={{ color: color, fontFamily: fontFamily }}
        >
          {letters.map((ch, i) => {
            const p = pwpPoint(start[i], letters.length, 0.42)
            return (
              <div
                key={i + ch}
                className="pwp-lane"
                aria-hidden="true"
                data-top={p.top ? "" : undefined}
                style={{ ["--pwp-u" as string]: p.u, ["--pwp-v" as string]: p.v }}
              >
                <span className="pwp-pre">
                  {letters.slice(0, i).map((c, j) => (
                    <span key={j} className="pwp-g">
                      {c}
                    </span>
                  ))}
                </span>
                <span className="pwp-run">
                  <span className="pwp-g pwp-glyph">{ch}</span>
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
