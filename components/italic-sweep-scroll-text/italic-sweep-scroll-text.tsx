"use client"

import * as React from "react"

/**
 * Italic Sweep Scroll Text
 *
 * A pinned statement that writes itself as you scroll. Words rise into place one
 * after another, the emphasised phrase leans into italic a letter at a time, and
 * small ink marks open inside the lines and nudge the words apart. Keep scrolling
 * and the marks close and the words lift away in reading order. Everything is a
 * function of one eased scroll value, so scrolling back up plays it in reverse.
 *
 * Text syntax:  *emphasis*  leans into italic,  []  is an inline mark,  \n  forces a line.
 */
export interface ItalicSweepScrollTextProps {
  /** The statement. Wrap a phrase in *asterisks* for the italic sweep, write [] for an inline mark. */
  text?: string
  /** Height of the pinned stage. A definite length. */
  height?: string
  /** Total height of the scroll track the stage is pinned inside. A definite length, taller than height. */
  scrollLength?: string
  /** Scroll progress (0 to 1) at which the entrance starts and ends, then the exit starts and ends. */
  range?: [number, number, number, number]
  /** How early the scroll progress starts counting before the stage pins, and how late it stops after, in stage heights. */
  lead?: number
  /** How far below its line a word starts, in em. */
  rise?: number
  /** How far above its line a word lifts as it leaves, in em. */
  lift?: number
  /** How long one word takes, measured in word-to-word steps. Higher means more words moving at once. */
  overlap?: number
  /** Seconds the eased scroll value takes to catch up with the real one. 0 follows the scrollbar exactly. */
  smoothing?: number
  /** Lift the words away again at the end of the track. */
  exit?: boolean
  /** Sweep the emphasis into italic letter by letter. False keeps it italic throughout. */
  sweep?: boolean
  /** Keep the inline marks shifting shape while they are open. */
  glyphLoop?: boolean
  /**
   * Seconds for one pass when the statement should play on its own instead of
   * following the scroll: it loops (rise, hold, lift away, pause) and the block
   * is only as tall as the stage. Off by default; useful for previews and banners.
   */
  autoPlay?: number | false
  align?: "center" | "left"
  fontFamily?: string
  /** Stylesheet for the font, or null to bring your own. */
  fontHref?: string | null
  className?: string
}

const DEFAULT_TEXT = "A page [] only *comes alive* when someone takes the time to [] scroll it."
const DEFAULT_RANGE: [number, number, number, number] = [0.03, 0.44, 0.6, 0.95]
const FONT = "'Newsreader', 'Iowan Old Style', 'Palatino Linotype', Georgia, serif"
const FONT_HREF = "https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,450;1,6..72,450&display=swap"

// #region timeline
// One clock for everything. A unit is the gap between two words starting.
// The entrance runs on te (0 to plan.enterLen), the exit on tx (0 to plan.exitLen).
export interface IstToken {
  kind: string
  text: string
  /** emphasised characters are text.slice(a, b) */
  a: number
  b: number
}
export interface IstSpan {
  s: number
  d: number
}
export interface IstPlan {
  words: IstSpan[]
  /** start time of each emphasised letter, per word */
  letters: number[][]
  glyphs: IstSpan[]
  enterLen: number
  exitWords: IstSpan[]
  exitGlyphs: IstSpan[]
  exitLen: number
}

const IST_LETTER = 0.93 // units between two letters turning italic
const IST_LETTER_WAIT = 2 // units a word is given to land before its letters start turning
const IST_GLYPH_WAIT = 5.75 // units between the word before a mark starting and the words beside the mark giving way
const IST_GLYPH_OPEN = 2 // units the mark takes to grow
const IST_GLYPH_CLOSE = 1 // units the mark takes to go
const IST_GIVE = 1 // units one word takes to give way, or to come back
const IST_GLYPH_CLOSE_GAP = 2.5
const IST_EXIT_STEP = 0.8
const IST_EXIT_WORD = 1.6
const IST_LAG = 0.5 // units between one word and the next one along giving way to a mark
const IST_LAG_MAX = 4
const IST_GAP = 0.07 // em between the two pieces of a mark
// [width, radius, width, radius] of the two pieces, in em. Narrow, wide, narrow, wide.
const IST_POSES = [
  [0.68, 0.34, 0.26, 0.05],
  [0.68, 0.05, 0.68, 0.34],
  [0.26, 0.05, 0.68, 0.05],
  [0.68, 0.34, 0.68, 0.34],
]
const IST_POSE_SECONDS = 0.42

export function istClamp(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v
}
export function istInOutExpo(u: number): number {
  if (u <= 0) return 0
  if (u >= 1) return 1
  return u < 0.5 ? Math.pow(2, 20 * u - 10) / 2 : (2 - Math.pow(2, 10 - 20 * u)) / 2
}
export function istOutCubic(u: number): number {
  const k = 1 - istClamp(u)
  return 1 - k * k * k
}
export function istInOutCubic(u: number): number {
  const c = istClamp(u)
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(2 - 2 * c, 3) / 2
}

/** Splits the statement into words, inline marks and forced breaks. */
export function istParse(text: string): IstToken[] {
  const out: IstToken[] = []
  let em = false
  let cur = ""
  let a = -1
  let b = -1
  const flush = () => {
    if (cur === "[]") out.push({ kind: "glyph", text: "", a: 0, b: 0 })
    else if (cur) out.push({ kind: "word", text: cur, a: a < 0 ? 0 : a, b: a < 0 ? 0 : b })
    cur = ""
    a = -1
    b = -1
  }
  for (const ch of text) {
    if (ch === "*") {
      em = !em
      continue
    }
    if (ch === "\n") {
      flush()
      out.push({ kind: "break", text: "", a: 0, b: 0 })
      continue
    }
    if (ch === " " || ch === "\t" || ch === "\r") {
      flush()
      continue
    }
    if (em) {
      if (a < 0) a = cur.length
      b = cur.length + ch.length
    }
    cur += ch
  }
  flush()
  return out
}

/** Lays every word, letter and mark out on the two clocks. */
export function istPlan(tokens: IstToken[], overlap: number): IstPlan {
  const words: IstSpan[] = []
  const letters: number[][] = []
  const glyphs: IstSpan[] = []
  let cursor = -1000
  let end = 0
  for (const t of tokens) {
    if (t.kind === "word") {
      const s = words.length
      words.push({ s, d: overlap })
      end = Math.max(end, s + overlap)
      const ls: number[] = []
      for (let k = t.a; k < t.b; k++) {
        cursor = Math.max(cursor + IST_LETTER, s + IST_LETTER_WAIT)
        ls.push(cursor)
        end = Math.max(end, cursor)
      }
      letters.push(ls)
    } else if (t.kind === "glyph") {
      const s = words.length ? words.length - 1 + IST_GLYPH_WAIT : 0
      glyphs.push({ s, d: IST_GLYPH_OPEN })
      end = Math.max(end, s + 0.25 + IST_GLYPH_OPEN)
    }
  }
  const exitGlyphs = glyphs.map((_, g) => ({ s: g * IST_GLYPH_CLOSE_GAP, d: IST_GLYPH_CLOSE }))
  const base = glyphs.length ? glyphs.length * IST_GLYPH_CLOSE_GAP + 0.5 : 0
  const exitWords = words.map((_, i) => ({ s: base + i * IST_EXIT_STEP, d: IST_EXIT_WORD }))
  const exitLen = base + Math.max(0, words.length - 1) * IST_EXIT_STEP + IST_EXIT_WORD
  return { words, letters, glyphs, enterLen: end, exitWords, exitGlyphs, exitLen }
}

/** Scroll progress to the two clocks: [te, tx]. */
export function istTimes(plan: IstPlan, p: number, range: number[], exit: boolean): number[] {
  const te = plan.enterLen * istClamp((p - range[0]) / Math.max(1e-6, range[1] - range[0]))
  const tx = exit ? plan.exitLen * istClamp((p - range[2]) / Math.max(1e-6, range[3] - range[2])) : 0
  return [te, tx]
}

/** One word: [y offset in em, opacity]. It waits low, snaps up, and later lifts away. */
export function istWord(plan: IstPlan, i: number, te: number, tx: number, rise: number, lift: number): number[] {
  const w = plan.words[i]
  const u = istClamp((te - w.s) / w.d)
  const x = plan.exitWords[i]
  const v = istClamp((tx - x.s) / x.d)
  const y = rise * (1 - istInOutExpo(u)) - lift * istOutCubic(v)
  const o = istClamp(u / 0.03) * (1 - istClamp((v - 0.92) / 0.08))
  return [y, o]
}

/**
 * How open the space for mark g looks to a word d steps away from it (0 is the word beside it).
 * The space opens from the outside in and closes from the inside out, so words never run into
 * each other: the farthest word gives way first and is the last to come back.
 */
export function istGap(plan: IstPlan, g: number, te: number, tx: number, d: number): number {
  const k = Math.min(IST_LAG_MAX, Math.max(0, d))
  const a = plan.glyphs[g]
  const b = plan.exitGlyphs[g]
  return istInOutCubic((te - a.s + k * IST_LAG) / IST_GIVE) * (1 - istInOutCubic((tx - b.s - 0.5 - k * IST_LAG) / IST_GIVE))
}

/** How open mark g itself is. It grows last, into the space made for it, and is the first thing to go. */
export function istOpen(plan: IstPlan, g: number, te: number, tx: number): number {
  const a = plan.glyphs[g]
  const b = plan.exitGlyphs[g]
  return istInOutExpo((te - a.s - 0.25) / a.d) * (1 - istInOutCubic((tx - b.s) / b.d))
}

/** How many of word i's emphasised letters are italic by now. */
export function istItalic(plan: IstPlan, i: number, te: number): number {
  const ls = plan.letters[i]
  let n = 0
  while (n < ls.length && te >= ls[n]) n++
  return n
}

/** The two pieces of mark g at a moment in seconds: [width, radius, width, radius] in em. */
export function istGlyphPose(seconds: number, g: number): number[] {
  const at = Math.max(0, seconds) / IST_POSE_SECONDS + g * 1.5
  const i = Math.floor(at)
  const k = istInOutCubic((at - i - 0.6) / 0.4)
  const from = IST_POSES[i % IST_POSES.length]
  const to = IST_POSES[(i + 1) % IST_POSES.length]
  return from.map((v, n) => v + (to[n] - v) * k)
}

/** The widest a mark ever gets, in em. Lines are broken as if every mark were this wide. */
export function istGlyphMax(): number {
  return Math.max(...IST_POSES.map((p) => p[0] + p[2])) + IST_GAP
}
// #endregion timeline

const CSS =
  ".ist-root{position:relative;width:100%}" +
  ".ist-stage{position:sticky;top:0;display:flex;align-items:center;justify-content:center;box-sizing:border-box;width:100%;padding:0 clamp(20px,5vw,72px);overflow:hidden}" +
  ".ist-p{position:relative;margin:0;width:11em;max-width:100%;font-size:clamp(30px,6vw,116px);line-height:.96;letter-spacing:-.022em;font-weight:450;font-kerning:normal;font-variation-settings:'opsz' 18;text-align:center;color:color-mix(in oklab,var(--color-foreground,#111) 82%,var(--color-background,#fff))}" +
  ".ist-p[data-align=left]{text-align:left}" +
  ".ist-line{display:block;white-space:nowrap}" +
  ".ist-root[data-flow] .ist-line{display:inline;white-space:normal}" +
  ".ist-br{display:none}" +
  ".ist-root[data-flow] .ist-br{display:inline}" +
  ".ist-t{display:inline-block;white-space:nowrap;will-change:transform,opacity}" +
  ".ist-i{font-style:italic}" +
  ".ist-slot{display:inline-flex;align-items:stretch;justify-content:center;height:.66em;vertical-align:baseline}" +
  ".ist-pc{display:block;flex:none;background:currentColor}" +
  ".ist-sp{position:absolute;left:0;top:0;visibility:hidden;white-space:pre;pointer-events:none}" +
  ".ist-sr{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}" +
  "@media (prefers-reduced-motion:reduce){.ist-root{height:auto!important}.ist-t{will-change:auto}}"

interface Rows {
  src: IstToken[]
  rows: number[][]
}

export default function ItalicSweepScrollText({
  text = DEFAULT_TEXT,
  height = "100svh",
  scrollLength = "340svh",
  range = DEFAULT_RANGE,
  lead = 0.25,
  rise = 0.59,
  lift = 0.27,
  overlap = 3.5,
  smoothing = 0.14,
  exit = true,
  sweep = true,
  glyphLoop = true,
  autoPlay = false,
  align = "center",
  fontFamily = FONT,
  fontHref = FONT_HREF,
  className,
}: ItalicSweepScrollTextProps) {
  const rootRef = React.useRef(null as HTMLDivElement | null)
  const stageRef = React.useRef(null as HTMLDivElement | null)
  const pRef = React.useRef(null as HTMLParagraphElement | null)
  const spRef = React.useRef(null as HTMLSpanElement | null)

  const tokens = React.useMemo(() => istParse(text), [text])
  const plan = React.useMemo(() => istPlan(tokens, Math.max(0.5, overlap)), [tokens, overlap])
  const [measured, setMeasured] = React.useState(null as Rows | null)
  const rows = measured && measured.src === tokens ? measured.rows : null
  const [r0, r1, r2, r3] = range

  // Everything the frame loop needs, kept out of React state so scrolling never re-renders.
  const live = React.useRef({
    words: [] as HTMLElement[],
    ital: [] as (HTMLElement | null)[],
    rest: [] as (HTMLElement | null)[],
    slots: [] as HTMLElement[],
    links: [] as number[][][],
    tf: [] as string[],
    op: [] as string[],
    it: [] as number[],
    gl: [] as string[],
    sp: 0,
    eased: -1,
    paint: (_mode: number) => {},
  })

  // Collect the nodes after every commit (re-locking the lines remounts them) and paint at once.
  React.useLayoutEffect(() => {
    const root = rootRef.current
    const para = pRef.current
    if (!root || !para) return
    const L = live.current
    L.words = Array.from(para.querySelectorAll("[data-w]")) as HTMLElement[]
    L.ital = L.words.map((w) => w.querySelector(".ist-i") as HTMLElement | null)
    L.rest = L.words.map((w) => w.querySelector(".ist-r") as HTMLElement | null)
    L.slots = Array.from(para.querySelectorAll("[data-g]")) as HTMLElement[]
    L.tf = []
    L.op = []
    L.it = []
    L.gl = []

    // Which marks share a line with each word, on which side, and how far away.
    const wordIdx: number[] = []
    const glyphIdx: number[] = []
    let nw = 0
    let ng = 0
    tokens.forEach((t, n) => {
      if (t.kind === "word") wordIdx[n] = nw++
      else if (t.kind === "glyph") glyphIdx[n] = ng++
    })
    L.links = L.words.map(() => [])
    const before = align === "left" ? 0 : -0.5
    const after = align === "left" ? 1 : 0.5
    for (const row of rows || []) {
      const cells = row.filter((n) => tokens[n].kind !== "break")
      cells.forEach((n, at) => {
        if (tokens[n].kind !== "word") return
        cells.forEach((m, gat) => {
          if (tokens[m].kind !== "glyph") return
          L.links[wordIdx[n]].push([glyphIdx[m], at < gat ? before : after, Math.abs(at - gat) - 1])
        })
      })
    }

    const reduce = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches
    const wordTokens = tokens.filter((t) => t.kind === "word")
    const widest = istGlyphMax()
    let te = 0
    let tx = 0
    let seconds = 0

    // mode 0 follows the clocks. 1 is every mark at its widest, what the lines are broken for.
    // 2 is the settled sentence with the marks at rest, what reduced motion shows.
    const paint = (mode: number) => {
      const final = mode > 0
      for (let i = 0; i < L.words.length; i++) {
        let x = 0
        let y = 0
        let o = 1
        if (!final) {
          const w = istWord(plan, i, te, tx, rise, lift)
          y = w[0]
          o = w[1]
          for (const link of L.links[i]) {
            const pose = istGlyphPose(seconds, link[0])
            x += link[1] * (pose[0] + pose[2] + IST_GAP + L.sp) * (istGap(plan, link[0], te, tx, link[2]) - istGap(plan, link[0], te, tx, 0))
          }
        }
        const tf = "translate(" + x.toFixed(4) + "em," + y.toFixed(4) + "em)"
        if (L.tf[i] !== tf) {
          L.tf[i] = tf
          L.words[i].style.transform = tf
        }
        const op = o.toFixed(3)
        if (L.op[i] !== op) {
          L.op[i] = op
          L.words[i].style.opacity = op
        }
        const tok = wordTokens[i]
        const ital = L.ital[i]
        const rest = L.rest[i]
        if (tok && ital && rest) {
          const n = final || !sweep ? tok.b - tok.a : istItalic(plan, i, te)
          if (L.it[i] !== n) {
            L.it[i] = n
            ital.textContent = tok.text.slice(tok.a, tok.a + n)
            rest.textContent = tok.text.slice(tok.a + n, tok.b)
          }
        }
      }
      for (let g = 0; g < L.slots.length; g++) {
        const open = final ? 1 : istOpen(plan, g, te, tx)
        const room = final ? 1 : istGap(plan, g, te, tx, 0)
        const pose = mode === 1 ? [widest - IST_GAP, 0.05, 0, 0] : istGlyphPose(mode ? 0 : seconds, g)
        const key = open.toFixed(4) + room.toFixed(4) + pose.map((v) => v.toFixed(4)).join()
        if (L.gl[g] === key) continue
        L.gl[g] = key
        const slot = L.slots[g]
        const one = slot.firstElementChild as HTMLElement
        const two = slot.lastElementChild as HTMLElement
        slot.style.gap = (IST_GAP * open).toFixed(4) + "em"
        slot.style.width = ((pose[0] + pose[2] + IST_GAP) * room).toFixed(4) + "em"
        slot.style.marginRight = (L.sp * room).toFixed(4) + "em"
        one.style.width = (pose[0] * open).toFixed(4) + "em"
        one.style.borderRadius = Math.min(pose[1], (pose[0] * open) / 2).toFixed(4) + "em"
        two.style.width = (pose[2] * open).toFixed(4) + "em"
        two.style.borderRadius = Math.min(pose[3], (pose[2] * open) / 2).toFixed(4) + "em"
      }
    }
    L.paint = paint

    // Break the lines once, for the settled state, so no word hops lines while letters and marks change width.
    const measure = () => {
      root.setAttribute("data-flow", "")
      L.tf = []
      L.op = []
      L.it = []
      L.gl = []
      const fs = parseFloat(getComputedStyle(para).fontSize) || 16
      L.sp = spRef.current ? spRef.current.getBoundingClientRect().width / fs : 0.25
      paint(1)
      // An emphasised word is one width in roman and another in italic. Break the lines for the wider of the two.
      const held: HTMLElement[] = []
      L.words.forEach((w, i) => {
        const ital = L.ital[i]
        const rest = L.rest[i]
        const tok = wordTokens[i]
        if (!ital || !rest || !tok) return
        const leaning = w.getBoundingClientRect().width
        ital.textContent = ""
        rest.textContent = tok.text.slice(tok.a, tok.b)
        const upright = w.getBoundingClientRect().width
        w.style.minWidth = Math.max(leaning, upright) + "px"
        held.push(w)
      })
      const cells = Array.from(para.querySelectorAll(".ist-t")) as HTMLElement[]
      const next: number[][] = [[]]
      let top = -1e9
      let c = 0
      tokens.forEach((t, n) => {
        if (t.kind === "break") {
          next[next.length - 1].push(n)
          next.push([])
          top = -1e9
          return
        }
        const y = cells[c++].offsetTop
        if (top > -1e8 && Math.abs(y - top) > 2 && next[next.length - 1].length) next.push([])
        top = y
        next[next.length - 1].push(n)
      })
      for (const w of held) w.style.minWidth = ""
      const clean = next.filter((r) => r.length)
      const same = rows && rows.length === clean.length && rows.every((r, i) => r.join() === clean[i].join())
      if (same) root.removeAttribute("data-flow")
      else setMeasured({ src: tokens, rows: clean })
      L.tf = []
      L.op = []
      L.it = []
      L.gl = []
      paint(reduce ? 2 : 0)
    }

    if (!rows) {
      measure()
      return
    }
    root.removeAttribute("data-flow")

    if (reduce) paint(2)

    let raf = 0
    let last = 0
    let seen = true
    let width = root.offsetWidth

    const target = () => {
      const stage = stageRef.current
      const rect = root.getBoundingClientRect()
      const pinned = rect.height - (stage ? stage.offsetHeight : 0)
      // No room to pin (scrollLength equals height): run across the viewport instead.
      if (pinned < 8) {
        const vh = window.innerHeight || 1
        return istClamp((vh - rect.top) / (vh + rect.height))
      }
      const extra = Math.max(0, lead) * (stage ? stage.offsetHeight : 0)
      return istClamp((extra - rect.top) / (pinned + 2 * extra))
    }

    // autoplay: time stands in for scroll. Both ends of a pass are blank (words
    // below their lines, then lifted away), so the restart is invisible.
    const pass = autoPlay && autoPlay > 0 ? autoPlay : 0
    const PAUSE = 0.6
    let t0 = -1
    const autoGoal = (now: number) => {
      if (t0 < 0) t0 = now
      const s = ((now - t0) / 1000) % (pass + PAUSE)
      return istClamp(s / pass)
    }

    const frame = (now: number) => {
      raf = seen ? requestAnimationFrame(frame) : 0
      const dt = last ? Math.min(0.1, (now - last) / 1000) : 0
      last = now
      const goal = pass ? autoGoal(now) : target()
      // time is already smooth, and easing would replay the loop's restart backwards
      if (pass || L.eased < 0 || smoothing <= 0) L.eased = goal
      else {
        L.eased += (goal - L.eased) * (1 - Math.exp(-dt / smoothing))
        if (Math.abs(goal - L.eased) < 0.0002) L.eased = goal
      }
      const t = istTimes(plan, L.eased, [r0, r1, r2, r3], exit)
      te = t[0]
      tx = t[1]
      seconds = glyphLoop ? now / 1000 : 0
      paint(0)
    }

    if (!reduce) frame(performance.now())

    const io =
      typeof IntersectionObserver === "function"
        ? new IntersectionObserver((entries) => {
            seen = entries[entries.length - 1].isIntersecting
            if (seen && !raf && !reduce) {
              last = 0
              raf = requestAnimationFrame(frame)
            }
          })
        : null
    if (io) io.observe(root)

    // Re-break the lines when the column changes width or the font arrives.
    const ro =
      typeof ResizeObserver === "function"
        ? new ResizeObserver(() => {
            if (Math.abs(root.offsetWidth - width) < 1) return
            width = root.offsetWidth
            measure()
          })
        : null
    if (ro) ro.observe(root)
    let alive = true
    const fonts = (document as Document).fonts
    const onFont = () => {
      if (alive) measure()
    }
    if (fonts && fonts.ready) fonts.ready.then(onFont)
    if (fonts && fonts.addEventListener) fonts.addEventListener("loadingdone", onFont)

    return () => {
      alive = false
      cancelAnimationFrame(raf)
      if (io) io.disconnect()
      if (ro) ro.disconnect()
      if (fonts && fonts.removeEventListener) fonts.removeEventListener("loadingdone", onFont)
    }
  }, [tokens, plan, rows, r0, r1, r2, r3, lead, rise, lift, smoothing, exit, sweep, glyphLoop, align, autoPlay])

  const cell = (n: number) => {
    const t = tokens[n]
    if (t.kind === "break") return <br key={n} className="ist-br" />
    if (t.kind === "glyph") {
      return (
        <span key={n} className="ist-t">
          <span className="ist-slot" data-g="">
            <span className="ist-pc" />
            <span className="ist-pc" />
          </span>
        </span>
      )
    }
    return (
      <React.Fragment key={n}>
        <span className="ist-t" data-w="">
          {t.b > t.a ? (
            <>
              {t.text.slice(0, t.a)}
              <span className="ist-i">{sweep ? "" : t.text.slice(t.a, t.b)}</span>
              <span className="ist-r">{sweep ? t.text.slice(t.a, t.b) : ""}</span>
              {t.text.slice(t.b)}
            </>
          ) : (
            t.text
          )}
        </span>{" "}
      </React.Fragment>
    )
  }

  // What a screen reader gets: the plain sentence, emphasis kept, marks and motion left out.
  const spoken: React.ReactNode[] = []
  tokens.forEach((t, n) => {
    if (t.kind !== "word") return
    if (t.b > t.a) spoken.push(t.text.slice(0, t.a), <em key={n}>{t.text.slice(t.a, t.b)}</em>, t.text.slice(t.b) + " ")
    else spoken.push(t.text + " ")
  })

  const lines = rows || [tokens.map((_, n) => n)]

  return (
    <div ref={rootRef} className={"ist-root" + (className ? " " + className : "")} data-flow="" style={{ height: autoPlay ? height : scrollLength }}>
      <style>{CSS}</style>
      {fontHref && <link rel="stylesheet" href={fontHref} />}
      <div ref={stageRef} className="ist-stage" style={{ height }}>
        <p ref={pRef} className="ist-p" data-align={align} style={{ fontFamily }}>
          <span className="ist-sr">{spoken}</span>
          <span aria-hidden="true">
            <span ref={spRef} className="ist-sp">
              {" "}
            </span>
            {lines.map((row, i) => (
              <span key={i} className="ist-line">
                {row.map(cell)}
              </span>
            ))}
          </span>
        </p>
      </div>
    </div>
  )
}
