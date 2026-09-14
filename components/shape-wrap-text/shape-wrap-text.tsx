"use client"

import * as React from "react"

/**
 * Shape Wrap Text — a paragraph that flows around a shape you can drag.
 *
 * CSS can float text past a `shape-outside`, but only on one side of one
 * floated box. Text that closes back up on both sides of an object in the
 * middle of a column is a layout the browser will not do, so this does the
 * layout itself: canvas `measureText` for widths, `Intl.Segmenter` for break
 * opportunities, and a per-line pass that asks the shape how wide it is at that
 * line and fills what is left. Nothing measures the DOM, so re-routing every
 * line while the shape is dragged costs no reflow.
 *
 * Self-contained: Tailwind utilities only, no CSS file, React is the only
 * import. Text colour and the shape both come from the host's semantic tokens.
 *
 * Technique after Cheng Lou's pretext (github.com/chenglou/pretext), which
 * measures and lays out text arithmetically instead of through the DOM. The
 * line-breaking here is written for this component, not taken from it.
 */

export type ShapeKind = "circle" | "diamond" | "squircle"

/** One token and whether a space separates it from the token before it. */
export type Token = { t: string; sp: boolean }

export type Measure = (text: string) => number

/** A run of usable horizontal space on one line: [left, right] in px. */
export type Run = [number, number]

export type FlowOpts = {
  lineHeight: number
  maxLines: number
  justify: boolean
  /** Usable runs on the line starting at `top`, left to right. */
  runsFor: (top: number) => Run[]
}

/** A placed piece of a line, ready to be positioned absolutely. */
export type Frag = { x: number; y: number; text: string; wordSpacing: number }

/** The obstacle the text has to route around, in px within the column. */
export type Shape = { x: number; y: number; radius: number; kind: ShapeKind; gutter: number }

// #region flow
/** Below this fitted radius the wrap is not worth having. */
const STACK_FLOOR = 34

/**
 * How big the shape may be in this column, and whether wrapping is worth it.
 *
 * A shape that leaves 30px of column on either side does not read as
 * typesetting, it reads as breakage: one word per line, rivers, and any long
 * word overflowing. Shrink it until both runs clear `minRun`; if it cannot get
 * there, say so and let the caller stack it above the paragraph instead.
 */
export function fitShape(width: number, radius: number, gutter: number, minRun: number) {
  const fit = Math.min(radius, (width - 2 * gutter - 2 * minRun) / 2)
  return fit >= STACK_FLOOR ? { radius: fit, wraps: true } : { radius, wraps: false }
}

/**
 * Greedy line breaking across an arbitrary set of per-line runs.
 *
 * Pure and DOM-free: `measure` is the only thing that knows about fonts, which
 * is what makes this testable and what keeps a drag from touching layout.
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

      // The last line of the paragraph sets ragged, the way justified text
      // always has — stretching it would pull four words across the column.
      const justify = opts.justify && gaps > 0 && i < tokens.length && width < avail
      frags.push({
        x: left,
        y: line * opts.lineHeight,
        text,
        wordSpacing: justify ? (avail - width) / gaps : 0,
      })
    }

    line++
  }

  return frags
}

/**
 * Half-width of the shape at `dy` from its centre. Zero past the edge, so a
 * line clear of the shape gets the full column back.
 */
export function halfWidthAt(kind: ShapeKind, dy: number, radius: number): number {
  if (dy >= radius) return 0
  if (kind === "diamond") return radius - dy
  if (kind === "squircle") return radius * Math.cbrt(1 - Math.pow(dy / radius, 3))
  return Math.sqrt(radius * radius - dy * dy)
}

/**
 * Usable runs on one line band, given a shape to avoid. Returns the whole
 * column when the shape misses this line, and nothing when it swallows it.
 */
export function runsAround(
  width: number,
  top: number,
  lineHeight: number,
  shape: Shape,
): Run[] {
  const bottom = top + lineHeight
  // Widest point of the shape inside this band, so no glyph can clip a corner.
  const dy = top > shape.y ? top - shape.y : bottom < shape.y ? shape.y - bottom : 0
  const half = halfWidthAt(shape.kind, dy, shape.radius)
  if (half <= 0) return [[0, width]]

  const left = shape.x - half - shape.gutter
  const right = shape.x + half + shape.gutter
  const runs: Run[] = []
  if (left > 0) runs.push([0, Math.min(left, width)])
  if (right < width) runs.push([Math.max(right, 0), width])
  return runs
}
// #endregion

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
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")
  if (!ctx) return null
  ctx.font = font

  const spacing = Number.parseFloat(letterSpacing) || 0
  const native = "letterSpacing" in ctx
  if (native && spacing) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = letterSpacing

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

export type ShapeWrapTextProps = {
  /** The paragraph to flow. */
  text?: string
  shape?: ShapeKind
  /** Shape radius in px. */
  radius?: number
  /** Starting shape centre, as a fraction of the box (0–1). */
  origin?: { x: number; y: number }
  /** Clear space kept between the shape and the text, in px. */
  gutter?: number
  /**
   * Narrowest run of text the wrap may leave beside the shape, in px. The shape
   * shrinks to respect it, and stacks above the paragraph when it cannot.
   */
  minRun?: number
  /** Stretch spaces so both edges of every run line up. */
  justify?: boolean
  /** Drag the shape to re-route the text. */
  draggable?: boolean
  /** Safety cap on lines laid out. */
  maxLines?: number
  /** Rendered inside the shape — a number, a word, an inline SVG. */
  children?: React.ReactNode
  className?: string
}

const SAMPLE =
  "Type is not a surface. A column of text is a set of decisions about where each line ends, and every one of those decisions is arithmetic someone has to do. The browser will do it for you, quickly, in a straight line, and it will refuse the moment you ask for a hole in the middle. So measure the words yourself: ask the font how wide each one is, ask the shape how much room it leaves on this line, and put down what fits. Drag the shape and the whole paragraph finds a new set of endings, without a single element being measured."

export default function ShapeWrapText({
  text = SAMPLE,
  shape = "circle",
  radius = 118,
  origin = { x: 0.5, y: 0.46 },
  gutter = 16,
  minRun = 116,
  justify = true,
  draggable = true,
  maxLines = 400,
  children,
  className = "",
}: ShapeWrapTextProps) {
  const boxRef = React.useRef<HTMLDivElement>(null)
  const probeRef = React.useRef<HTMLParagraphElement>(null)

  const [box, setBox] = React.useState({ width: 0, lineHeight: 0 })
  const [measurer, setMeasurer] = React.useState<{ fn: Measure } | null>(null)
  const [centre, setCentre] = React.useState<{ x: number; y: number } | null>(null)

  const tokens = React.useMemo(() => tokenize(text), [text])

  // Width and font both come off the live element, so the component inherits
  // whatever type the host has set instead of assuming its own.
  React.useEffect(() => {
    const el = boxRef.current
    const probe = probeRef.current
    if (!el || !probe) return

    const read = () => {
      const cs = getComputedStyle(probe)
      const size = Number.parseFloat(cs.fontSize) || 16
      const lh = cs.lineHeight === "normal" ? size * 1.5 : Number.parseFloat(cs.lineHeight) || size * 1.5
      const font = `${cs.fontStyle} ${cs.fontWeight} ${size}px ${cs.fontFamily}`
      const fn = makeMeasurer(font, cs.letterSpacing)
      setBox({ width: el.clientWidth, lineHeight: lh })
      setMeasurer(fn ? { fn } : null)
    }

    read()
    const ro = new ResizeObserver(read)
    ro.observe(el)
    // A webfont landing after first paint changes every width on the page.
    document.fonts?.ready.then(read).catch(() => {})
    return () => ro.disconnect()
  }, [])

  const { frags, height, shapeState } = React.useMemo(() => {
    const empty = { frags: [] as Frag[], height: 0, shapeState: null }
    if (!measurer || box.width <= 0 || box.lineHeight <= 0) return empty

    const opts = { lineHeight: box.lineHeight, maxLines, justify }

    const { radius: r, wraps } = fitShape(box.width, radius, gutter, minRun)

    if (!wraps) {
      // Stacked: the shape keeps its size and sits above a plain paragraph.
      const top = r * 2 + gutter
      const placed = flowText(tokens, measurer.fn, {
        ...opts,
        runsFor: () => [[0, box.width]],
      })
      const lines = placed.map((f) => ({ ...f, y: f.y + top }))
      const lastLine = lines.length ? lines[lines.length - 1].y + box.lineHeight : top
      return {
        frags: lines,
        height: lastLine,
        shapeState: { x: box.width / 2, y: r, radius: r, kind: shape, gutter, wraps },
      }
    }

    // `origin` is a fraction of the paragraph, but the paragraph's height
    // depends on the shape — so measure it once without one. The word cache
    // makes the second pass nearly free.
    let y = centre ? centre.y : 0
    if (!centre) {
      const natural = flowText(tokens, measurer.fn, { ...opts, runsFor: () => [[0, box.width]] })
      const naturalHeight = natural.length ? natural[natural.length - 1].y + box.lineHeight : 0
      y = Math.max(r, naturalHeight * origin.y)
    }

    const placed_shape = {
      // A dragged position is in px, so a column that narrows later (a phone,
      // a resized pane) would strand the shape outside it. Clamp on the way in,
      // not just on the way out of the drag.
      x: centre ? Math.min(box.width + r, Math.max(-r, centre.x)) : box.width * origin.x,
      y: Math.max(r, y),
      radius: r,
      kind: shape,
      gutter,
    }

    const placed = flowText(tokens, measurer.fn, {
      ...opts,
      runsFor: (top) => runsAround(box.width, top, box.lineHeight, placed_shape),
    })
    const lastLine = placed.length ? placed[placed.length - 1].y + box.lineHeight : 0
    return {
      frags: placed,
      height: Math.max(lastLine, placed_shape.y + r),
      shapeState: { ...placed_shape, wraps },
    }
  }, [
    minRun,
    measurer,
    box.width,
    box.lineHeight,
    tokens,
    maxLines,
    justify,
    centre,
    origin.x,
    origin.y,
    radius,
    shape,
    gutter,
  ])

  const drag = React.useRef(false)
  const onPointerDown = (e: React.PointerEvent) => {
    if (!draggable || !shapeState?.wraps) return
    drag.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
    e.preventDefault()
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current || !boxRef.current) return
    const r = boxRef.current.getBoundingClientRect()
    setCentre({
      // Sideways it may hang off the column — half a shape at the margin is a
      // good look. Upward it may not, or it climbs into whatever sits above.
      x: Math.min(r.width + drawn, Math.max(-drawn, e.clientX - r.left)),
      y: Math.max(drawn, e.clientY - r.top),
    })
  }
  const endDrag = (e: React.PointerEvent) => {
    drag.current = false
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId)
  }

  const drawn = shapeState?.radius ?? radius
  const shapeStyle: React.CSSProperties = {
    left: (shapeState?.x ?? 0) - drawn,
    top: (shapeState?.y ?? 0) - drawn,
    visibility: shapeState ? undefined : "hidden",
    width: drawn * 2,
    height: drawn * 2,
    borderRadius: shape === "circle" ? "50%" : shape === "squircle" ? "32%" : undefined,
    clipPath: shape === "diamond" ? "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" : undefined,
  }

  return (
    <div
      ref={boxRef}
      className={"relative w-full text-foreground " + className}
      style={{ height: height || undefined }}
    >
      {/* The laid-out fragments are decoration; this is the actual text for
          screen readers, selection and crawlers. */}
      <p ref={probeRef} className="sr-only">
        {text}
      </p>

      {frags.map((f, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="absolute whitespace-pre"
          style={{ left: f.x, top: f.y, wordSpacing: f.wordSpacing ? `${f.wordSpacing}px` : undefined }}
        >
          {f.text}
        </span>
      ))}

      <div
        aria-hidden="true"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className={
          "absolute grid touch-none select-none place-items-center border border-border bg-muted text-muted-foreground " +
          (draggable && shapeState?.wraps ? "cursor-grab active:cursor-grabbing" : "")
        }
        style={shapeStyle}
      >
        {children}
      </div>
    </div>
  )
}
