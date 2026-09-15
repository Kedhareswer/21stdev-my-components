"use client"

import * as React from "react"

/**
 * Silhouette Wrap — a paragraph that parts around a falling silhouette and
 * closes back up underneath it, re-typeset on every scroll frame.
 *
 * CSS floats text past a `shape-outside` on one side of one box. Text that
 * opens around an object mid-column, follows its actual outline — a keyhole's
 * waist, a bottle's neck — and rejoins below it is a layout no browser will do.
 * So this does the typesetting itself:
 *
 *   - canvas `measureText` for word widths, cached per font
 *   - `Intl.Segmenter` for break opportunities, so CJK breaks where it should
 *   - an SVG path rasterised once into a left/right profile, then asked for its
 *     width at each line
 *
 * Nothing measures the DOM, so the fall costs no reflow: each frame is a
 * profile lookup and one greedy pass over cached widths.
 *
 * Self-contained: React is the only import. Tailwind utilities, no CSS file,
 * no animation library. Ink is whatever `color` the host has set — the text and
 * the silhouette both inherit it — so the component never fights a palette.
 *
 * Measuring-not-reflowing is the idea behind Cheng Lou's pretext
 * (github.com/chenglou/pretext); the line breaker here is written for this
 * component, and pretext is not a dependency.
 */

/** One token and whether a space separates it from the token before it. */
export type Token = { t: string; sp: boolean }

export type Measure = (text: string) => number

/** A run of usable horizontal space on one line: [left, right] in px. */
export type Run = [number, number]

export type FlowOpts = {
  lineHeight: number
  maxLines: number
  justify: boolean
  /**
   * How far a space may stretch when justifying, as a multiple of its natural
   * width. A line that would need more is set ragged instead — which is what
   * keeps rivers out of the narrow runs beside a silhouette.
   */
  tolerance: number
  /** Usable runs on the line starting at `top`, left to right. */
  runsFor: (top: number) => Run[]
}

/** A placed piece of a line, ready to be positioned absolutely. */
export type Frag = { x: number; y: number; text: string; wordSpacing: number }

/**
 * A silhouette flattened to `rows` scanlines. Each row holds the leftmost and
 * rightmost filled x, as fractions of the shape's own box, or -1 for a row the
 * outline never covers.
 */
export type Profile = { rows: number; span: Float32Array }

/**
 * One piece of a silhouette. `width` strokes the path at that thickness —
 * which is how a coiled body or a limb gets drawn without authoring both sides
 * of its outline; without it the path is filled.
 */
export type Shape = { path: string; width?: number }

/** A silhouette: its pieces, and the viewBox they are drawn in. */
export type Art = { shapes: Shape[]; box: [number, number] }

/** Does the outline cover this point? Coordinates are 0..1 of its own box. */
export type Hit = (x: number, y: number) => boolean

/** Where the silhouette sits in the column, in px. */
export type Placement = { x: number; y: number; width: number; height: number; gutter: number }

// #region flow
/** Below this fitted width the wrap is not worth having. */
const STACK_FLOOR = 110

/**
 * Greedy line breaking across an arbitrary set of per-line runs.
 *
 * Pure and DOM-free: `measure` is the only thing that knows about fonts, which
 * is what makes this testable and what keeps a scroll off the layout path.
 */
export function flowText(tokens: Token[], measure: Measure, opts: FlowOpts): Frag[] {
  const frags: Frag[] = []
  const spaceW = measure(" ")
  let i = 0
  let line = 0

  while (i < tokens.length && line < opts.maxLines) {
    const runs = opts.runsFor(line * opts.lineHeight)
    let placed = false

    for (let k = 0; k < runs.length; k++) {
      const left = runs[k][0]
      const avail = runs[k][1] - left
      if (avail <= 0) continue

      let text = ""
      let width = 0
      let gaps = 0

      while (i < tokens.length) {
        const tok = tokens[i]
        const gap = text === "" ? 0 : tok.sp ? spaceW : 0
        const tw = measure(tok.t)

        if (width + gap + tw > avail) {
          // A token wider than the run would otherwise be retried forever. Let
          // it overflow, but only once nothing else on this line can hold it.
          const stuck = text === "" && !placed && k === runs.length - 1
          if (!stuck) break
        }

        text += (gap ? " " : "") + tok.t
        width += gap + tw
        if (gap) gaps++
        i++
        if (width > avail) break
      }

      if (text === "") continue
      placed = true

      // The last line of a paragraph sets ragged, the way justified text always
      // has — stretching it would pull four words across the column. And a run
      // too narrow to take the slack is left ragged rather than torn open:
      // beside a silhouette that is most of them, and a river down a six-word
      // line looks far worse than an uneven edge.
      const slack = (avail - width) / Math.max(gaps, 1)
      const justify =
        opts.justify &&
        gaps > 0 &&
        i < tokens.length &&
        width < avail &&
        slack <= spaceW * opts.tolerance

      frags.push({
        x: left,
        y: line * opts.lineHeight,
        text,
        wordSpacing: justify ? slack : 0,
      })
    }

    line++
  }

  return frags
}

/**
 * Flatten a filled outline into scanlines. `hit(x, y)` takes normalised
 * coordinates and says whether the outline covers that point; sampling it on a
 * grid once means every later frame is an array lookup instead of geometry.
 */
export function sampleProfile(hit: Hit, rows: number, cols: number): Profile {
  const span = new Float32Array(rows * 2)

  for (let r = 0; r < rows; r++) {
    const y = (r + 0.5) / rows
    let left = -1
    let right = -1
    for (let c = 0; c < cols; c++) {
      const x = (c + 0.5) / cols
      if (!hit(x, y)) continue
      if (left < 0) left = x
      right = x
    }
    span[r * 2] = left
    span[r * 2 + 1] = right
  }

  return { rows, span }
}

/**
 * Usable runs on one line band, given a silhouette to avoid.
 *
 * The band is measured against every scanline it touches and the widest is
 * used, so a glyph can never clip a corner the outline pinches into.
 */
export function runsAround(
  width: number,
  top: number,
  lineHeight: number,
  profile: Profile,
  at: Placement,
): Run[] {
  const full: Run[] = [[0, width]]
  if (at.height <= 0 || at.width <= 0) return full

  const first = Math.floor(((top - at.y) / at.height) * profile.rows)
  const last = Math.ceil(((top + lineHeight - at.y) / at.height) * profile.rows)
  if (last < 0 || first >= profile.rows) return full

  let l = 2
  let r = -1
  for (let row = Math.max(0, first); row < Math.min(profile.rows, last); row++) {
    const rl = profile.span[row * 2]
    if (rl < 0) continue
    l = Math.min(l, rl)
    r = Math.max(r, profile.span[row * 2 + 1])
  }
  if (r < 0) return full

  const left = at.x + l * at.width - at.gutter
  const right = at.x + r * at.width + at.gutter
  const runs: Run[] = []
  if (left > 0) runs.push([0, Math.min(left, width)])
  if (right < width) runs.push([Math.max(right, 0), width])
  return runs
}

/**
 * How wide the silhouette may be in this column, and whether wrapping it is
 * worth doing at all.
 *
 * A shape that leaves 30px of column either side does not read as typesetting,
 * it reads as breakage: one word per line, rivers, and any long word spilling
 * out. Shrink until both runs clear `minRun`; when no width can manage that,
 * say so and let the caller stack the silhouette above the text instead.
 */
export function fitSilhouette(column: number, want: number, gutter: number, minRun: number) {
  const fit = Math.min(want, column - 2 * gutter - 2 * minRun)
  return fit >= STACK_FLOOR ? { width: fit, wraps: true } : { width: want, wraps: false }
}

/**
 * Left edge of the text for the first few lines, so an initial capital gets a
 * notch of its own. Lines past the cap are untouched.
 */
export function withDropCap(runs: Run[], line: number, lines: number, capWidth: number): Run[] {
  if (line >= lines || capWidth <= 0) return runs
  const out: Run[] = []
  for (const [l, r] of runs) {
    const left = Math.max(l, capWidth)
    if (r - left > 0) out.push([left, r])
  }
  return out
}
// #endregion

/**
 * Outlines worth wrapping. Alice picks the lock, drinks the bottle, and falls
 * past the cupboards — so the presets are the objects, not geometry.
 */
export const SILHOUETTES: Record<string, Art> = {
  keyhole: {
    box: [100, 158],
    shapes: [{ path: "M50 12 A34 34 0 1 0 50.01 12 Z M40 70 L29 146 Q50 157 71 146 L60 70 Z" }],
  },
  bottle: {
    box: [100, 150],
    shapes: [
      {
        path: "M42 4 h16 v24 q0 7 6 13 q14 14 14 35 v56 q0 14 -14 14 h-28 q-14 0 -14 -14 v-56 q0 -21 14 -35 q6 -6 6 -13 z",
      },
    ],
  },
  /**
   * A wyrm curled into a C, head raised clear of the coil.
   *
   * The body is arcs stroked at a tapering width, so the coil is authored as a
   * line rather than as both sides of an outline; the spines are anchored on
   * that arc's centre so they grow out of the beast instead of floating beside
   * it. Head, wing and claws are filled.
   */
  dragon: {
    box: [170, 150],
    shapes: [
      {
        path: "M60.1 45.1 L42 29.7 L52.6 51 Z M45.4 60.9 L20 56.7 L42.1 69.8 Z M41.3 82 L18.5 91.7 L43.3 91.3 Z M48.6 101.5 L35.6 118.7 L54 107.5 Z M63 113.6 L60.6 132.1 L70.7 116.4 Z",
      },
      { path: "M78 116 L84 134 M96 108 L108 124", width: 6 },
      { path: "M84 134 l-6 6 M84 134 l5 6 M108 124 l-1 8 M108 124 l7 3", width: 3 },
      { path: "M96 52 C112 22 152 24 150 52 C142 45 136 50 134 60 C128 52 122 50 116 54 C112 46 104 46 98 58 Z" },
      { path: "M104 44 A42 42 0 1 0 108 110", width: 17 },
      { path: "M108 110 C122 106 128 96 126 86", width: 11 },
      { path: "M126 86 C124 76 114 72 108 78", width: 6 },
      { path: "M108 78 C104 82 105 88 110 89", width: 3 },
      { path: "M104 44 C106 28 118 18 132 18", width: 12 },
      { path: "M132 18 C146 14 162 18 165 26 C167 34 158 36 150 34 C142 32 134 30 130 26 Z" },
      { path: "M150 34 C156 38 162 38 165 34 C160 31 155 30 150 30 Z" },
      { path: "M136 16 L138 2 M142 16 L152 6", width: 3.5 },
    ],
  },
  teapot: {
    box: [100, 100],
    shapes: [
      { path: "M30 50 h44 q18 0 18 22 q0 22 -18 22 h-44 q-16 0 -16 -22 q0 -22 16 -22 Z" },
      { path: "M30 54 q-18 2 -18 20 q0 18 18 20", width: 7 },
      { path: "M74 56 q22 4 22 18 q0 12 -12 16", width: 7 },
      { path: "M44 50 q8 -14 20 -6", width: 6 },
    ],
  },
  circle: { box: [100, 100], shapes: [{ path: "M50 6 A44 44 0 1 0 50.01 6 Z" }] },
  diamond: { box: [100, 100], shapes: [{ path: "M50 2 L98 50 L50 98 L2 50 Z" }] },
}

/** Rasterise a silhouette into a scanline profile with an offscreen canvas. */
function profileFromArt(art: Art, rows = 128, cols = 96): Profile | null {
  if (typeof Path2D === "undefined") return null
  const ctx = document.createElement("canvas").getContext("2d")
  if (!ctx) return null

  // Sampled in the art's own coordinates rather than a unit square: scaling the
  // path would scale non-uniformly and a stroke width would stop meaning what
  // it means in the SVG the eye actually sees.
  ctx.lineCap = "round"
  ctx.lineJoin = "round"
  const pieces = art.shapes.map((s) => ({ p: new Path2D(s.path), width: s.width }))
  const [bw, bh] = art.box

  return sampleProfile(
    (x, y) =>
      pieces.some((piece) => {
        if (!piece.width) return ctx.isPointInPath(piece.p, x * bw, y * bh)
        ctx.lineWidth = piece.width
        return ctx.isPointInStroke(piece.p, x * bw, y * bh)
      }),
    rows,
    cols,
  )
}

/** Break text into tokens plus whether each follows a space. */
function tokenize(text: string): Token[] {
  const out: Token[] = []
  const push = (t: string, sp: boolean) => {
    if (t) out.push({ t, sp })
  }

  const Seg = (Intl as unknown as { Segmenter?: typeof Intl.Segmenter }).Segmenter
  if (!Seg) {
    // No Intl.Segmenter: whitespace is the only break opportunity we can see.
    text.split(/\s+/).forEach((w, i) => push(w, i > 0))
    return out
  }

  // Word granularity gives a break opportunity between CJK characters too,
  // where whitespace splitting would hand back one unbreakable paragraph.
  const seg = new Seg(undefined, { granularity: "word" })
  let pending = ""
  let space = false
  for (const piece of seg.segment(text)) {
    const s = piece.segment
    if (/^\s+$/.test(s)) {
      push(pending, space)
      pending = ""
      space = true
      continue
    }
    if (piece.isWordLike && pending) {
      push(pending, space)
      pending = s
      space = false
    } else {
      // Punctuation rides along with the word it hangs off.
      pending += s
    }
  }
  push(pending, space)
  return out
}

/** Canvas 2D text measurement, cached per word for the life of a font. */
function makeMeasurer(font: string, letterSpacing: string) {
  const ctx = document.createElement("canvas").getContext("2d")
  if (!ctx) return null
  ctx.font = font

  const spacing = Number.parseFloat(letterSpacing) || 0
  const native = "letterSpacing" in ctx
  if (native && spacing) {
    ;(ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = letterSpacing
  }

  const cache = new Map<string, number>()
  return (text: string) => {
    const hit = cache.get(text)
    if (hit !== undefined) return hit
    let w = ctx.measureText(text).width
    // Older engines ignore ctx.letterSpacing, so add the tracking by hand.
    if (!native && spacing) w += spacing * [...text].length
    cache.set(text, w)
    return w
  }
}

/** Size, advance and baseline for an initial capital spanning `lines` lines. */
export type CapMetric = (char: string, lines: number) => { size: number; width: number; baseline: number }

/**
 * Measure a drop cap instead of guessing it.
 *
 * The rule compositors use: the cap's top aligns with the cap-height of the
 * first line and its baseline sits on the baseline of the last line it spans.
 * Both of those are font metrics, so both come out of `measureText` —
 * `actualBoundingBoxAscent` for how tall this particular glyph draws, and the
 * font's own ascent/descent for where CSS puts the baseline inside a line box.
 */
function makeCapMetric(cs: CSSStyleDeclaration, fontSize: number, lineHeight: number): CapMetric | null {
  const ctx = document.createElement("canvas").getContext("2d")
  if (!ctx) return null

  ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${fontSize}px ${cs.fontFamily}`
  const body = ctx.measureText("H")
  const ascent = body.fontBoundingBoxAscent || fontSize * 0.8
  const descent = body.fontBoundingBoxDescent || fontSize * 0.2
  const capHeight = body.actualBoundingBoxAscent || fontSize * 0.7
  // Half-leading: CSS centres the font box in the line box.
  const firstBaseline = (lineHeight - (ascent + descent)) / 2 + ascent

  const REF = 100
  return (char, lines) => {
    ctx.font = `${cs.fontStyle} 600 ${REF}px ${cs.fontFamily}`
    const m = ctx.measureText(char)
    const glyphAscent = (m.actualBoundingBoxAscent || REF * 0.7) / REF
    const baseline = firstBaseline + (lines - 1) * lineHeight
    const size = (baseline - (firstBaseline - capHeight)) / glyphAscent
    return { size, width: (m.width / REF) * size, baseline }
  }
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = React.useState(false)
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => setReduced(mq.matches)
    sync()
    mq.addEventListener("change", sync)
    return () => mq.removeEventListener("change", sync)
  }, [])
  return reduced
}

/**
 * How far this element has travelled across the viewport, 0 before it enters
 * and 1 once it has left. Sampled on a rAF tick so a fast wheel coalesces into
 * one re-typeset per frame instead of one per scroll event.
 */
function useTravel(ref: React.RefObject<HTMLElement>, enabled: boolean) {
  const [p, setP] = React.useState(0.5)

  React.useEffect(() => {
    if (!enabled) return
    const el = ref.current
    if (!el) return

    let raf = 0
    const read = () => {
      raf = 0
      const r = el.getBoundingClientRect()
      const span = window.innerHeight + r.height
      setP(span <= 0 ? 0.5 : Math.min(1, Math.max(0, (window.innerHeight - r.top) / span)))
    }
    const tick = () => {
      if (!raf) raf = requestAnimationFrame(read)
    }

    read()
    addEventListener("scroll", tick, { passive: true })
    addEventListener("resize", tick)
    return () => {
      cancelAnimationFrame(raf)
      removeEventListener("scroll", tick)
      removeEventListener("resize", tick)
    }
  }, [ref, enabled])

  return p
}

export type SilhouetteWrapProps = {
  /** The paragraph to typeset. */
  text?: string
  /** A preset name from SILHOUETTES, or your own shapes plus their viewBox. */
  silhouette?: keyof typeof SILHOUETTES | Art
  /** Silhouette width in px, before the column has its say. */
  size?: number
  /** How the silhouette moves: falls with the page, follows the pointer, or holds still. */
  follow?: "scroll" | "drag" | "fixed"
  /** Fraction of the paragraph the fall runs between. */
  travel?: [number, number]
  /** How far the silhouette drifts sideways over the fall, in px. */
  drift?: number
  /** Where a fixed silhouette sits, as fractions of the column and paragraph. */
  origin?: { x: number; y: number }
  /** Clear space held between the outline and the text, in px. */
  gutter?: number
  /** Narrowest strip of text the wrap may leave beside the silhouette. */
  minRun?: number
  /** Stretch spaces so both edges of every run line up, where it can be done cleanly. */
  justify?: boolean
  /** How far a space may stretch before the line is left ragged instead. */
  tolerance?: number
  /** Lines tall for the opening capital. 0 turns it off. */
  dropCap?: number
  /**
   * Opening lines set in `rubricColor` — the incipit a scribe wrote in red
   * before the rest of the page went down in ink.
   */
  rubricLines?: number
  rubricColor?: string
  /** Safety cap on lines typeset. */
  maxLines?: number
  /**
   * An illuminated initial to sit in the drop cap's notch instead of a letter.
   * Given one, the notch becomes a square `dropCap` lines on a side.
   */
  cap?: React.ReactNode
  /** Painted inside the outline instead of the default fill. */
  children?: React.ReactNode
  className?: string
}

/** Alice's Adventures in Wonderland (1865), chapter I — public domain. */
const FALL =
  "Down, down, down. Would the fall never come to an end? “I wonder how many miles I’ve fallen by this time?” she said aloud. “I must be getting somewhere near the centre of the earth. Let me see: that would be four thousand miles down, I think—” for, you see, Alice had learnt several things of this sort in her lessons in the schoolroom, and though this was not a very good opportunity for showing off her knowledge, as there was no one to listen to her, still it was good practice to say it over. “—yes, that’s about the right distance—but then I wonder what Latitude or Longitude I’ve got to?” Presently she began again. “I wonder if I shall fall right through the earth! How funny it’ll seem to come out among the people that walk with their heads downward! The Antipathies, I think—” Down, down, down. There was nothing else to do, so Alice soon began talking again. “Dinah’ll miss me very much to-night, I should think! Do cats eat bats? Do cats eat bats?” and sometimes, “Do bats eat cats?” for, you see, as she couldn’t answer either question, it didn’t much matter which way she put it. She felt that she was dozing off, when suddenly, thump! thump! down she came upon a heap of sticks and dry leaves, and the fall was over."

export default function SilhouetteWrap({
  text = FALL,
  silhouette = "keyhole",
  size = 190,
  follow = "scroll",
  travel = [0.06, 0.82],
  drift = 46,
  origin = { x: 0.52, y: 0.42 },
  gutter = 18,
  minRun = 112,
  justify = true,
  tolerance = 0.62,
  dropCap = 3,
  rubricLines = 0,
  rubricColor,
  maxLines = 500,
  cap,
  children,
  className = "",
}: SilhouetteWrapProps) {
  const boxRef = React.useRef<HTMLDivElement>(null)
  const probeRef = React.useRef<HTMLParagraphElement>(null)
  const reduced = usePrefersReducedMotion()

  const [box, setBox] = React.useState({ width: 0, lineHeight: 0, fontSize: 16 })
  const [measurer, setMeasurer] = React.useState<{ fn: Measure; cap: CapMetric } | null>(null)
  const [dragAt, setDragAt] = React.useState<{ x: number; y: number } | null>(null)

  const tokens = React.useMemo(() => tokenize(text), [text])
  const art = typeof silhouette === "string" ? SILHOUETTES[silhouette] : silhouette
  const artKey = art ? art.box.join() + "|" + art.shapes.map((sh) => sh.path).join("|") : ""
  const profile = React.useMemo(() => (art ? profileFromArt(art) : null), [artKey])

  const travelling = follow === "scroll" && !reduced
  const p = useTravel(boxRef, travelling)

  // Width and font both come off the live element, so the component inherits
  // whatever type the host has set instead of assuming its own.
  React.useEffect(() => {
    const el = boxRef.current
    const probe = probeRef.current
    if (!el || !probe) return

    const read = () => {
      const cs = getComputedStyle(probe)
      const fontSize = Number.parseFloat(cs.fontSize) || 16
      const lineHeight =
        cs.lineHeight === "normal" ? fontSize * 1.5 : Number.parseFloat(cs.lineHeight) || fontSize * 1.5
      const fn = makeMeasurer(
        `${cs.fontStyle} ${cs.fontWeight} ${fontSize}px ${cs.fontFamily}`,
        cs.letterSpacing,
      )
      const cap = makeCapMetric(cs, fontSize, lineHeight)
      setBox({ width: el.clientWidth, lineHeight, fontSize })
      setMeasurer(fn && cap ? { fn, cap } : null)
    }

    read()
    const ro = new ResizeObserver(read)
    ro.observe(el)
    // A webfont landing after first paint changes every width on the page.
    document.fonts?.ready.then(read).catch(() => {})
    return () => ro.disconnect()
  }, [])

  const capChar = dropCap > 0 && !cap ? ([...text.trimStart()][0] ?? "") : ""
  const capAt = capChar && measurer ? measurer.cap(capChar, dropCap) : null
  const capBlock = cap && dropCap > 0 ? box.lineHeight * dropCap : 0
  const capWidth = capBlock || (capAt ? capAt.width : 0)

  const { frags, height, at, wraps, textTop } = React.useMemo(() => {
    const idle = { frags: [] as Frag[], height: 0, at: null, wraps: false, textTop: 0 }
    if (!measurer || box.width <= 0 || box.lineHeight <= 0) return idle

    const aspect = art ? art.box[1] / art.box[0] : 1
    const fitted = fitSilhouette(box.width, size, gutter, minRun)
    const width = fitted.width
    const shapeHeight = width * aspect
    const capGap = capWidth > 0 ? capWidth + gutter * 0.6 : 0

    const base = {
      lineHeight: box.lineHeight,
      maxLines,
      justify,
      tolerance,
    }

    // Lay out once with no silhouette: that gives the paragraph's natural
    // height, which is what `travel` and `origin.y` are fractions of. The word
    // cache makes the second pass nearly free.
    const natural = flowText(tokens, measurer.fn, {
      ...base,
      runsFor: (top) =>
        withDropCap([[0, box.width]], Math.round(top / box.lineHeight), dropCap, capGap),
    })
    const naturalHeight = natural.length ? natural[natural.length - 1].y + box.lineHeight : 0

    if (!profile || !fitted.wraps) {
      // Stacked: the silhouette keeps its size and sits above a plain column.
      const top = shapeHeight + gutter
      const lines = natural.map((f) => ({ ...f, y: f.y + top }))
      return {
        frags: lines,
        height: lines.length ? lines[lines.length - 1].y + box.lineHeight : top,
        at: { x: (box.width - width) / 2, y: 0, width, height: shapeHeight, gutter },
        wraps: false,
        textTop: top,
      }
    }

    // The fall: top of the silhouette runs between the two travel marks of the
    // paragraph, with a slow sideways drift so no two lines break alike.
    const span = Math.max(naturalHeight, box.lineHeight * 4)
    let x: number
    let y: number
    if (follow === "drag" && dragAt) {
      x = dragAt.x - width / 2
      y = dragAt.y - shapeHeight / 2
    } else if (follow === "scroll" && !reduced) {
      const t = travel[0] + (travel[1] - travel[0]) * p
      y = span * t
      x = (box.width - width) / 2 + Math.sin(p * Math.PI * 1.2) * drift
    } else {
      x = box.width * origin.x - width / 2
      y = span * origin.y - shapeHeight / 2
    }
    x = Math.min(box.width - width * 0.25, Math.max(-width * 0.25, x))
    y = Math.max(0, y)

    const at = { x, y, width, height: shapeHeight, gutter }
    const placed = flowText(tokens, measurer.fn, {
      ...base,
      runsFor: (top) =>
        withDropCap(
          runsAround(box.width, top, box.lineHeight, profile, at),
          Math.round(top / box.lineHeight),
          dropCap,
          capGap,
        ),
    })
    const lastLine = placed.length ? placed[placed.length - 1].y + box.lineHeight : 0
    return { frags: placed, height: Math.max(lastLine, y + shapeHeight), at, wraps: true, textTop: 0 }
  }, [
    measurer,
    box.width,
    box.lineHeight,
    tokens,
    art,
    profile,
    size,
    gutter,
    minRun,
    justify,
    tolerance,
    dropCap,
    capWidth,
    maxLines,
    capBlock,
    follow,
    reduced,
    p,
    travel[0],
    travel[1],
    drift,
    origin.x,
    origin.y,
    dragAt,
  ])

  const drag = React.useRef(false)
  const onPointerDown = (e: React.PointerEvent) => {
    if (follow !== "drag" || !wraps) return
    drag.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
    e.preventDefault()
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current || !boxRef.current) return
    const r = boxRef.current.getBoundingClientRect()
    setDragAt({ x: e.clientX - r.left, y: e.clientY - r.top })
  }
  const endDrag = (e: React.PointerEvent) => {
    drag.current = false
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId)
  }

  return (
    <div
      ref={boxRef}
      className={"relative w-full " + className}
      style={{ height: height || undefined }}
    >
      {/* The typeset fragments are decoration; this is the real text, for
          selection, search and screen readers. */}
      <p ref={probeRef} className="sr-only">
        {text}
      </p>

      {capBlock > 0 && frags.length > 0 && (
        <div
          aria-hidden="true"
          className="absolute"
          style={{ left: 0, top: textTop, width: capBlock, height: capBlock }}
        >
          {cap}
        </div>
      )}

      {capAt && frags.length > 0 && (
        // SVG, because HTML gives no way to sit a glyph on a named baseline —
        // and the whole point of a drop cap is that its baseline is shared.
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute overflow-visible"
          style={{ left: 0, top: textTop, width: capAt.width, height: capAt.baseline + 2 }}
        >
          <text x={0} y={capAt.baseline} fontSize={capAt.size} fontWeight={600} fill="currentColor">
            {capChar}
          </text>
        </svg>
      )}

      {frags.map((f, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="absolute whitespace-pre"
          style={{
            left: f.x,
            top: f.y,
            wordSpacing: f.wordSpacing ? `${f.wordSpacing}px` : undefined,
            // Compared as a line index, not as pixels: a line's top lands on an
            // exact multiple of the line height, and comparing those floats
            // directly put the second line inside "the first line".
            color:
              rubricColor && Math.round((f.y - textTop) / box.lineHeight) < rubricLines
                ? rubricColor
                : undefined,
          }}
        >
          {f.text}
        </span>
      ))}

      {art && at && (
        <div
          aria-hidden="true"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          className={
            "absolute touch-none select-none " +
            (follow === "drag" && wraps ? "cursor-grab active:cursor-grabbing" : "")
          }
          style={{ left: at.x, top: at.y, width: at.width, height: at.height }}
        >
          {children ?? (
            // The default drawing is the silhouette itself: every piece painted
            // exactly as the profile sampled it, so what the text avoids and
            // what the eye sees cannot drift apart.
            <svg
              viewBox={`0 0 ${art.box[0]} ${art.box[1]}`}
              width="100%"
              height="100%"
              className="block overflow-visible"
            >
              <g
                className="fill-current stroke-current"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {art.shapes.map((shape, i) => (
                  <path
                    key={i}
                    d={shape.path}
                    fill={shape.width ? "none" : undefined}
                    strokeWidth={shape.width}
                  />
                ))}
              </g>
            </svg>
          )}
        </div>
      )}
    </div>
  )
}
