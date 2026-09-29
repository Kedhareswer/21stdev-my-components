"use client"

import * as React from "react"

/**
 * Scroll Milestone Timeline — a horizontal company timeline you travel by
 * scrolling.
 *
 * One axis, milestones above it as coloured pills, engineering notes below it
 * as plain type, every one hung off a dashed stem. Scroll inks the axis left to
 * right; as the pen passes an event its stem grows out of the axis, the dot
 * pops, the pill wipes open and the text types itself in. Scroll back and it
 * all un-writes. When the track is wider than the screen it pans with the pen.
 * No assets, no dependencies — just DOM, driven by the element's own position.
 */

export type TimelineSide = "above" | "below"

export type TimelineEvent = {
  /** Where on the axis. Any numeric scale — equal steps are equal gaps. */
  at: number
  /** The small bold line beside the dot, e.g. "Summer 2018". */
  date: string
  /** The body. "\n" breaks a line, the way the reference sets its type. */
  title: string
  /** Default: "above" when the event has a colour, otherwise "below". */
  side?: TimelineSide
  /** Stem length in rows (1 is shortest). Stagger these so labels never collide. */
  level?: number
  /** A pill background (any CSS colour). Omit for a plain note with an ink dot. */
  color?: string
  /** Optional longer text, shown in a card while the event is hovered or focused. */
  detail?: string
}

export type ScrollMilestoneTimelineProps = {
  events?: TimelineEvent[]
  /** Small caption over the title, top left. */
  kicker?: string
  /** Top-left heading. Empty string hides it. */
  title?: string
  /** Height of the sticky stage. Must be a definite length. */
  height?: string
  /** Stage-heights of scroll per event. The root is (1 + events × this) stages tall. */
  scrollPerEvent?: number
  /** Narrowest gap, in px, between the two closest events. Below this the track pans. */
  minSlot?: number
  /** Widest gap, in px, between the two closest events. */
  maxSlot?: number
  /** Stage background. Default: a paper tint of the installer's --color-background. */
  background?: string
  /** Lines, dots and type. Default: the installer's --color-foreground. */
  ink?: string
  /** Text colour on pills — pills keep their colour in both themes, so this does too. */
  pillInk?: string
  fontSans?: string
  fontMono?: string
  /** Type the text in as the pen passes. false fades it in instead. */
  typewriter?: boolean
  /** Heading, counter, mini-map and scroll hint. */
  hud?: boolean
  /** Called with the index (in `events` order) of the latest event written, or -1. */
  onActiveChange?: (index: number) => void
  className?: string
}

// #region timeline
// Pure: size + scroll → where everything is. Lifted out and run by the test.

export const clamp01 = (v: number): number => (v > 0 ? (v > 1 ? 1 : v) : 0)

export const smoothstep = (edge0: number, edge1: number, x: number): number => {
  if (edge0 === edge1) return x < edge0 ? 0 : 1
  const t = clamp01((x - edge0) / (edge1 - edge0))
  return t * t * (3 - 2 * t)
}

/** 0 → 1 with a small overshoot past 1 on the way. The dot's pop. */
export const easeOutBack = (x: number): number => {
  const t = clamp01(x)
  if (t === 0 || t === 1) return t
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

/**
 * 0 when the root's top meets the stage's top, 1 when the sticky stage is
 * about to leave. Measured from the element, so it works anywhere on a page.
 */
export const progressFrom = (top: number, height: number, stage: number): number => {
  const travel = height - stage
  if (!(travel > 0)) return 0
  return clamp01(-top / travel)
}

export type ResolvedEvent = TimelineEvent & { side: TimelineSide; level: number; source: number }

/** Sorted by `at` (stable), with side and level filled in. `source` is the index in the input. */
export const resolveEvents = (events: TimelineEvent[]): ResolvedEvent[] => {
  const sorted = events
    .map((e, source) => ({ e, source }))
    .filter(({ e }) => Number.isFinite(e.at))
    .sort((a, b) => a.e.at - b.e.at || a.source - b.source)
  let above = 0
  let below = 0
  return sorted.map(({ e, source }) => {
    const side: TimelineSide = e.side ?? (e.color ? "above" : "below")
    const auto = side === "above" ? [2, 4][above++ % 2] : [1, 3][below++ % 2]
    const level = Math.max(1, Math.min(8, Math.round(e.level ?? auto)))
    return { ...e, side, level, source }
  })
}

/** Rows needed on each side of the axis. */
export const extentsOf = (events: ResolvedEvent[]): { above: number; below: number } => {
  let above = 0
  let below = 0
  for (const e of events) {
    if (e.side === "above") above = Math.max(above, e.level)
    else below = Math.max(below, e.level)
  }
  return { above, below }
}

/** Height of one stem row: as tall as fits between the HUD bands, 20–52px. */
export const rowGapFor = (h: number, above: number, below: number, hud: boolean): number => {
  const rows = above + below
  if (!(rows > 0)) return 52
  const free = h - (hud ? 170 : 50) - 16 - 56
  return Math.max(20, Math.min(52, free / rows))
}

/** The smallest gap between two distinct `at` values; 1 when there is none. */
export const stepOf = (ats: number[]): number => {
  const u = [...new Set(ats.filter(Number.isFinite))].sort((a, b) => a - b)
  let step = Infinity
  for (let i = 1; i < u.length; i++) step = Math.min(step, u[i] - u[i - 1])
  return Number.isFinite(step) && step > 1e-9 ? step : 1
}

export type LayoutItem = { x: number; dotY: number; stemTop: number; stemHeight: number }

export type TimelineLayout = {
  items: LayoutItem[]
  slot: number
  trackWidth: number
  axisY: number
  /** Where the pen starts and stops, in track px. */
  axisStart: number
  axisEnd: number
  /** Pen travel over which one event writes itself in. */
  revealSpan: number
  rowGap: number
}

export const layoutTimeline = (
  events: ResolvedEvent[],
  w: number,
  h: number,
  opts: { minSlot?: number; maxSlot?: number; hud?: boolean } = {},
): TimelineLayout => {
  const hud = opts.hud ?? true
  const minSlot = Math.max(24, opts.minSlot ?? 104)
  const maxSlot = Math.max(minSlot, opts.maxSlot ?? 136)
  const ats = events.map((e) => e.at)
  const first = ats.length ? Math.min(...ats) : 0
  const span = ats.length ? Math.max(...ats) - first : 0
  // The slot limits are for the closest pair of events, so `at` can be in any unit.
  const step = stepOf(ats)
  const steps = span / step
  const lead = 28
  // Room after the last dot for its label and the arrow.
  const tailFor = (slot: number) => Math.max(180, slot * 1.35)
  const margin = Math.max(16, w * 0.06)
  const fit = steps > 0 ? (w - 2 * margin - lead - tailFor(maxSlot)) / steps : maxSlot
  const slot = Math.max(minSlot, Math.min(maxSlot, fit))
  const perUnit = slot / step
  const trackWidth = lead + steps * slot + tailFor(slot)

  const { above, below } = extentsOf(events)
  const rowGap = rowGapFor(h, above, below, hud)
  const topBand = hud ? 96 : 24
  const bottomBand = hud ? 74 : 24
  const up = above * rowGap + 16
  const down = below * rowGap + 56
  const axisY = Math.round((topBand + h - bottomBand) / 2 + (up - down) / 2)

  const items = events.map((e) => {
    const x = lead + (e.at - first) * perUnit
    const len = e.level * rowGap
    const dotY = e.side === "above" ? axisY - len : axisY + len
    // The stem runs between the axis and the edge of the 10px dot.
    const stemTop = e.side === "above" ? dotY + 5 : axisY
    return { x, dotY, stemTop, stemHeight: Math.max(0, len - 5) }
  })

  return {
    items,
    slot,
    trackWidth,
    axisY,
    axisStart: 0,
    axisEnd: trackWidth - 20,
    revealSpan: Math.max(40, slot * 0.85),
    rowGap,
  }
}

/** The last stretch of scroll is a hold on the finished timeline. */
export const OUTRO = 0.07

/** Where the pen is, in track px, for a scroll progress. */
export const playheadAt = (p: number, L: Pick<TimelineLayout, "axisStart" | "axisEnd">): number =>
  L.axisStart + clamp01(p / (1 - OUTRO)) * (L.axisEnd - L.axisStart)

/** The progress that puts the pen at `ph`. Inverse of playheadAt. */
export const progressForPlayhead = (ph: number, L: Pick<TimelineLayout, "axisStart" | "axisEnd">): number => {
  const len = L.axisEnd - L.axisStart
  if (!(len > 0)) return 0
  return clamp01((ph - L.axisStart) / len) * (1 - OUTRO)
}

/** 0 until the pen reaches the dot, 1 once it is `span` past it. */
export const revealAt = (ph: number, x: number, span: number): number =>
  span > 0 ? clamp01((ph - x) / span) : ph >= x ? 1 : 0

/** One reveal, split into the beats of the write-in. */
export const phasesOf = (r: number) => {
  const body = clamp01((r - 0.42) / 0.58)
  return {
    stem: smoothstep(0, 0.34, r),
    dot: easeOutBack((r - 0.24) / 0.22),
    label: smoothstep(0.34, 0.58, r),
    pill: 1 - Math.pow(1 - clamp01(body / 0.32), 3),
    typed: clamp01((body - 0.12) / 0.88),
  }
}

/** How many characters are on screen at typing progress t. */
export const typedCount = (text: string, t: number): number => {
  const n = text.length
  if (t >= 1) return n
  return Math.min(n, Math.max(0, Math.ceil(clamp01(t) * n)))
}

/**
 * The track's translateX. A track that fits is centred; a wider one follows the
 * pen, held a little past the middle, and stops at either end.
 */
export const panFor = (ph: number, trackWidth: number, w: number, gutter = 16): number => {
  if (trackWidth <= w - 2 * gutter) return Math.round((w - trackWidth) / 2)
  const max = trackWidth - w + 2 * gutter
  const want = ph - w * 0.58
  return Math.round(gutter - Math.max(0, Math.min(max, want)))
}

/** The latest event more than half written, or -1. */
export const activeAt = (reveals: number[]): number => {
  let a = -1
  for (let i = 0; i < reveals.length; i++) if (reveals[i] > 0.5) a = i
  return a
}
// #endregion

// ---------------------------------------------------------------------------

const SANS = '"Inter", "Helvetica Neue", Helvetica, Arial, ui-sans-serif, system-ui, sans-serif'
const MONO = '"JetBrains Mono", "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'

// The reference: a lab-robotics company, winter 2017 to winter 2019. `at` counts
// seasons, so the empty slot between Fall 2018 and Spring 2019 is Winter 2018.
const DEFAULT_EVENTS: TimelineEvent[] = [
  { at: 0, date: "Winter 2017", title: "Work Starts", color: "#e0643a", level: 2, detail: "Two founders, one borrowed liquid handler, a spare room." },
  { at: 1, date: "Spring 2018", title: "Motion Router Performance\nNon-Exponential", level: 5 },
  { at: 2, date: "Summer 2018", title: "MIT / YCombinator", color: "#f0ae78", level: 4, detail: "Accepted into the summer batch." },
  { at: 2, date: "Summer 2018", title: "Coordinate Frame\nGeometry System", level: 3 },
  { at: 3, date: "Fall 2018", title: "Started Working with\nBig Pharma & Academia", color: "#f6d84c", level: 2 },
  { at: 3, date: "Fall 2018", title: "Runtime Code-Generation\nfor Robots", level: 1 },
  { at: 5, date: "Spring 2019", title: "Well Allocator Performance\nNon-Exponential", level: 3 },
  { at: 6, date: "Summer 2019", title: "Closed Seed Financing", color: "#72bb88", level: 4, detail: "A seed round to take the platform into production labs." },
  { at: 7, date: "Fall 2019", title: "First Pilots for\nProduction Lab", color: "#8b9cf6", level: 2 },
  { at: 8, date: "Winter 2019", title: "Runtime Virtual\nMachine Starts", level: 1 },
]

// useLayoutEffect warns during a server render; the measurement only matters in the browser.
const useIsoLayoutEffect = typeof window === "undefined" ? React.useEffect : React.useLayoutEffect

const styles = [
  ".smt-root{background:var(--color-background,#f7f7f5);background:color-mix(in oklab,var(--color-background,#f7f7f5) 96.5%,var(--color-foreground,#111))}",
  ".smt-ev{transition:opacity .3s ease}",
  ".smt-root[data-hot] .smt-ev:not([data-hot]){opacity:.28}",
  ".smt-stem{opacity:.55;clip-path:inset(calc((1 - var(--s, 0)) * 100%) 0 0 0)}",
  ".smt-stem[data-below]{clip-path:inset(0 0 calc((1 - var(--s, 0)) * 100%) 0)}",
  ".smt-ev[data-hot] .smt-stem{opacity:1}",
  ".smt-btn{pointer-events:none}",
  ".smt-ev[data-on] .smt-btn{pointer-events:auto}",
  ".smt-dot{transform:scale(var(--d, 0))}",
  ".smt-date{opacity:var(--l, 0);transform:translateX(calc((1 - var(--l, 0)) * -8px))}",
  ".smt-pill{clip-path:inset(0 calc((1 - var(--p, 0)) * 100%) 0 0 round 8px);transition:transform .25s cubic-bezier(.2,.8,.2,1),box-shadow .25s}",
  ".smt-ev[data-hot] .smt-pill{transform:translateY(-2px);box-shadow:0 6px 16px -8px rgba(0,0,0,.45)}",
  ".smt-caret{position:relative;display:inline-block;width:0;visibility:hidden}",
  ".smt-caret::after{content:\"\";position:absolute;left:1px;top:.12em;width:.52em;height:1.05em;background:currentColor;animation:smt-blink 1s steps(2,start) infinite}",
  ".smt-ev[data-typing] .smt-caret{visibility:visible}",
  "@keyframes smt-blink{to{visibility:hidden}}",
  ".smt-ring{opacity:0}",
  ".smt-ev[data-active] .smt-ring{animation:smt-ring 1.8s cubic-bezier(.2,.7,.3,1) infinite}",
  "@keyframes smt-ring{0%{transform:scale(1);opacity:.55}100%{transform:scale(3.2);opacity:0}}",
  ".smt-card{opacity:0;transform:translateY(4px);transition:opacity .2s,transform .2s;pointer-events:none}",
  ".smt-ev[data-hot] .smt-card{opacity:1;transform:none}",
  ".smt-btn:focus-visible{outline:2px solid currentColor;outline-offset:4px;border-radius:6px}",
  ".smt-tick{transition:transform .2s}",
  ".smt-tick-btn:hover .smt-tick,.smt-tick-btn:focus-visible .smt-tick{transform:scaleY(1.8)}",
  "@keyframes smt-hint{0%{transform:scaleX(0);transform-origin:left}50%{transform:scaleX(1);transform-origin:left}51%{transform-origin:right}100%{transform:scaleX(0);transform-origin:right}}",
  ".smt-hint-line{animation:smt-hint 2.4s cubic-bezier(.7,0,.3,1) infinite}",
  "@media (prefers-reduced-motion: reduce){.smt-ev,.smt-pill,.smt-card,.smt-tick{transition:none}.smt-caret::after,.smt-hint-line{animation:none}.smt-ev[data-active] .smt-ring{animation:none}}",
].join("\n")

export default function ScrollMilestoneTimeline({
  events = DEFAULT_EVENTS,
  kicker = "Company timeline · 2017 — 2019",
  title = "From a spare room to production labs",
  height = "100svh",
  scrollPerEvent = 0.45,
  minSlot = 104,
  maxSlot = 136,
  background,
  ink = "var(--color-foreground, #141414)",
  pillInk = "#1b1b1b",
  fontSans = SANS,
  fontMono = MONO,
  typewriter = true,
  hud = true,
  onActiveChange,
  className = "",
}: ScrollMilestoneTimelineProps) {
  const rootRef = React.useRef<HTMLElement | null>(null)
  const stageRef = React.useRef<HTMLDivElement | null>(null)
  const trackRef = React.useRef<HTMLDivElement | null>(null)
  const inkRef = React.useRef<HTMLDivElement | null>(null)
  const penRef = React.useRef<HTMLDivElement | null>(null)
  const arrowRef = React.useRef<SVGSVGElement | null>(null)
  const markerRef = React.useRef<HTMLDivElement | null>(null)
  const hintRef = React.useRef<HTMLDivElement | null>(null)
  const evRefs = React.useRef<(HTMLDivElement | null)[]>([])

  // A guess until the stage is measured, so the server render is laid out too.
  const [size, setSize] = React.useState({ w: 1280, h: 800 })
  const [reduced, setReduced] = React.useState(false)
  const [active, setActive] = React.useState(-1)
  const [hot, setHot] = React.useState<number | null>(null)

  const resolved = React.useMemo(() => resolveEvents(events), [events])
  const layout = React.useMemo(
    () => layoutTimeline(resolved, size.w, size.h, { minSlot, maxSlot, hud }),
    [resolved, size.w, size.h, minSlot, maxSlot, hud],
  )

  const onActive = React.useRef(onActiveChange)
  onActive.current = onActiveChange

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => setReduced(mq.matches)
    sync()
    mq.addEventListener("change", sync)
    return () => mq.removeEventListener("change", sync)
  }, [])

  useIsoLayoutEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const measure = () => {
      const w = Math.round(stage.clientWidth)
      const h = Math.round(stage.clientHeight)
      if (w > 0 && h > 0) setSize((s) => (s.w === w && s.h === h ? s : { w, h }))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(stage)
    return () => observer.disconnect()
  }, [])

  // Scroll writes styles straight to the DOM; React only hears about the active event.
  React.useEffect(() => {
    const root = rootRef.current
    const stage = stageRef.current
    const track = trackRef.current
    if (!root || !stage || !track) return

    const els = resolved.map((_, i) => {
      const el = evRefs.current[i]
      return {
        el,
        typed: el?.querySelector<HTMLElement>("[data-typed]") ?? null,
        rest: el?.querySelector<HTMLElement>("[data-rest]") ?? null,
        last: -1,
        count: -1,
      }
    })
    const reveals = resolved.map(() => 0)
    let shown = -2
    let raf = 0

    const update = () => {
      raf = 0
      const r = root.getBoundingClientRect()
      const p = progressFrom(r.top, r.height, stage.offsetHeight)
      const ph = playheadAt(p, layout)

      track.style.transform = "translate3d(" + panFor(ph, layout.trackWidth, size.w) + "px,0,0)"
      const inked = Math.max(0, Math.min(layout.axisEnd, ph) - layout.axisStart)
      if (inkRef.current) inkRef.current.style.width = inked + "px"
      if (penRef.current) {
        penRef.current.style.transform = "translate3d(" + (layout.axisStart + inked) + "px,0,0)"
        // The pen lifts before it reaches the arrow.
        penRef.current.style.opacity = String(1 - smoothstep(layout.axisEnd - 40, layout.axisEnd - 12, ph))
      }
      if (arrowRef.current) arrowRef.current.style.opacity = String(0.25 + 0.75 * smoothstep(0.9, 1, p / (1 - OUTRO)))
      if (markerRef.current) markerRef.current.style.left = (100 * clamp01(p / (1 - OUTRO))).toFixed(2) + "%"
      if (hintRef.current) hintRef.current.style.opacity = String(1 - smoothstep(0.005, 0.04, p))

      resolved.forEach((e, i) => {
        const item = layout.items[i]
        const rv = revealAt(ph, item.x, layout.revealSpan)
        reveals[i] = rv
        const slot = els[i]
        if (!slot.el || Math.abs(rv - slot.last) < 0.0005) return
        slot.last = rv
        const f = phasesOf(rv)
        const s = slot.el.style
        s.setProperty("--s", f.stem.toFixed(4))
        s.setProperty("--d", f.dot.toFixed(4))
        s.setProperty("--l", f.label.toFixed(4))
        s.setProperty("--p", (e.color ? f.pill : 1).toFixed(4))
        slot.el.toggleAttribute("data-on", f.label > 0.05)
        const body = slot.el.querySelector<HTMLElement>("[data-body]")
        if (typewriter) {
          const n = typedCount(e.title, f.typed)
          slot.el.toggleAttribute("data-typing", f.typed > 0 && f.typed < 1)
          if (body) body.style.opacity = f.typed > 0 || (e.color && f.pill > 0) ? "1" : "0"
          if (n !== slot.count && slot.typed && slot.rest) {
            slot.count = n
            slot.typed.textContent = e.title.slice(0, n)
            slot.rest.textContent = e.title.slice(n)
          }
        } else if (body) {
          body.style.opacity = String(e.color ? 1 : f.label)
        }
      })

      const a = activeAt(reveals)
      if (a !== shown) {
        shown = a
        els.forEach((slot, i) => slot.el?.toggleAttribute("data-active", i === a))
        setActive(a)
        onActive.current?.(a >= 0 ? resolved[a].source : -1)
      }
    }

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    addEventListener("scroll", schedule, { passive: true })
    addEventListener("resize", schedule)
    return () => {
      cancelAnimationFrame(raf)
      removeEventListener("scroll", schedule)
      removeEventListener("resize", schedule)
    }
  }, [resolved, layout, size.w, typewriter])

  /** Scroll the page so event `i` has just finished writing itself in. */
  const goTo = (i: number) => {
    const root = rootRef.current
    const stage = stageRef.current
    const item = layout.items[i]
    if (!root || !stage || !item) return
    const r = root.getBoundingClientRect()
    const travel = r.height - stage.offsetHeight
    if (!(travel > 0)) return
    const p = progressForPlayhead(item.x + layout.revealSpan + 2, layout)
    window.scrollBy({ top: r.top + p * travel, behavior: reduced ? "auto" : "smooth" })
  }

  const count = resolved.length
  const pad = (v: number) => String(v).padStart(2, "0")
  const current = active >= 0 ? resolved[active] : null
  const muted = { opacity: 0.55 }

  return (
    <section
      ref={rootRef}
      className={"smt-root relative w-full " + className}
      data-hot={hot !== null ? "" : undefined}
      style={{
        height: "calc(" + (1 + Math.max(1, count) * scrollPerEvent) + " * " + height + ")",
        color: ink,
        ...(background ? { background } : null),
      }}
      aria-label={title || "Timeline"}
    >
      <style>{styles}</style>
      <div ref={stageRef} className="sticky top-0 w-full overflow-hidden" style={{ height }}>
        <div
          ref={trackRef}
          className="absolute left-0 top-0"
          style={{ width: layout.trackWidth, height: "100%", willChange: "transform" }}
        >
          {/* The axis: faint all the way, inked up to the pen. */}
          <div
            className="absolute"
            style={{ left: layout.axisStart, top: layout.axisY, width: layout.axisEnd - layout.axisStart, height: 1, background: "currentColor", opacity: 0.25 }}
            aria-hidden="true"
          />
          <div
            ref={inkRef}
            className="absolute"
            style={{ left: layout.axisStart, top: layout.axisY, width: 0, height: 1, background: "currentColor", opacity: 0.8 }}
            aria-hidden="true"
          />
          <div
            ref={penRef}
            className="absolute"
            style={{ left: -3, top: layout.axisY - 3, width: 7, height: 7, borderRadius: 9, background: "currentColor" }}
            aria-hidden="true"
          />
          <svg
            ref={arrowRef}
            className="absolute"
            width="10"
            height="12"
            viewBox="0 0 10 12"
            style={{ left: layout.axisEnd - 8, top: layout.axisY - 6, overflow: "visible", opacity: 0.25, maxWidth: "none" }}
            aria-hidden="true"
          >
            <path d="M1 1 L8.5 6 L1 11" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
          </svg>

          {resolved.map((e, i) => {
            const item = layout.items[i]
            const below = e.side === "below"
            const dotColor = e.color ?? "currentColor"
            const lines = e.title.split("\n")
            return (
              <div
                key={e.source}
                ref={(el) => {
                  evRefs.current[i] = el
                }}
                className="smt-ev"
                data-hot={hot === i ? "" : undefined}
              >
                <div
                  className="smt-stem absolute"
                  data-below={below ? "" : undefined}
                  style={{
                    left: item.x,
                    top: item.stemTop,
                    width: 1,
                    height: item.stemHeight,
                    backgroundImage: "repeating-linear-gradient(to bottom, currentColor 0 3px, transparent 3px 6px)",
                  }}
                  aria-hidden="true"
                />
                <button
                  type="button"
                  className="smt-btn absolute block cursor-pointer border-0 bg-transparent p-0 text-left"
                  style={{ left: item.x - 6, top: item.dotY - 9, paddingLeft: 20, paddingRight: 4, color: "inherit", font: "inherit" }}
                  aria-label={e.date + ": " + e.title.replace(/\n/g, " ")}
                  aria-current={active === i ? "step" : undefined}
                  onPointerEnter={() => setHot(i)}
                  onPointerLeave={() => setHot((h) => (h === i ? null : h))}
                  onFocus={(ev) => {
                    setHot(i)
                    // Tabbing through the timeline travels it.
                    if (ev.currentTarget.matches(":focus-visible")) goTo(i)
                  }}
                  onBlur={() => setHot((h) => (h === i ? null : h))}
                  onClick={() => goTo(i)}
                >
                  <span className="absolute block" style={{ left: 1, top: 4, width: 10, height: 10 }} aria-hidden="true">
                    <span className="smt-ring absolute inset-0 block rounded-full" style={{ background: dotColor }} />
                    <span className="smt-dot absolute inset-0 block rounded-full" style={{ background: dotColor }} />
                  </span>
                  <span
                    className="smt-date block whitespace-nowrap"
                    style={{ fontFamily: fontSans, fontSize: 12, fontWeight: 700, lineHeight: "18px", letterSpacing: "-0.01em" }}
                    aria-hidden="true"
                  >
                    {e.date}
                  </span>
                  <span
                    data-body=""
                    className={"block whitespace-pre " + (e.color ? "smt-pill" : "")}
                    style={{
                      fontFamily: fontMono,
                      fontSize: 11,
                      lineHeight: "16px",
                      letterSpacing: "0.02em",
                      opacity: 0,
                      ...(e.color
                        ? { display: "inline-block", marginTop: 6, padding: lines.length > 1 ? "6px 14px" : "2px 14px", borderRadius: 8, background: e.color, color: pillInk }
                        : { marginTop: 4, lineHeight: "17px" }),
                    }}
                    aria-hidden="true"
                  >
                    {typewriter ? (
                      <>
                        <span data-typed="" />
                        <span className="smt-caret" />
                        <span data-rest="" style={{ visibility: "hidden" }}>
                          {e.title}
                        </span>
                      </>
                    ) : (
                      e.title
                    )}
                  </span>
                  {e.detail ? (
                    <span
                      className="smt-card absolute block"
                      style={{
                        left: 20,
                        ...(below ? { top: "100%", marginTop: 10 } : { bottom: "100%", marginBottom: 8 }),
                        width: 220,
                        padding: "10px 12px",
                        borderRadius: 10,
                        fontFamily: fontMono,
                        fontSize: 11,
                        lineHeight: "16px",
                        whiteSpace: "normal",
                        background: "var(--color-background, #fff)",
                        border: "1px solid var(--color-border, rgba(0,0,0,0.12))",
                        boxShadow: "0 12px 32px -16px rgba(0,0,0,0.35)",
                      }}
                      aria-hidden="true"
                    >
                      {e.color ? (
                        <span className="mb-1.5 block rounded-full" style={{ width: 18, height: 3, background: e.color }} />
                      ) : null}
                      {e.detail}
                    </span>
                  ) : null}
                </button>
              </div>
            )
          })}
        </div>

        {hud && (
          <>
            <div className="pointer-events-none absolute left-4 right-4 top-5 flex items-start justify-between gap-6 sm:left-10 sm:right-10 sm:top-8">
              <div className="min-w-0">
                {kicker ? (
                  <p className="m-0 uppercase" style={{ ...muted, fontFamily: fontMono, fontSize: 10, letterSpacing: "0.22em" }}>
                    {kicker}
                  </p>
                ) : null}
                {title ? (
                  <h2 className="m-0 mt-1.5" style={{ fontFamily: fontSans, fontSize: "clamp(1rem, 2.2vw, 1.35rem)", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                    {title}
                  </h2>
                ) : null}
              </div>
              <div className="shrink-0 text-right" aria-live="polite">
                <p className="m-0" style={{ fontFamily: fontMono, fontSize: 11, letterSpacing: "0.12em", fontVariantNumeric: "tabular-nums" }}>
                  <span style={{ fontWeight: 700 }}>{pad(active + 1)}</span>
                  <span style={muted}> / {pad(count)}</span>
                </p>
                <p className="m-0 mt-1 hidden sm:block" style={{ ...muted, fontFamily: fontSans, fontSize: 11, fontWeight: 600, minHeight: 16 }}>
                  {current ? current.date : "Scroll to begin"}
                </p>
              </div>
            </div>

            <div className="absolute bottom-5 left-4 right-4 sm:bottom-7 sm:left-10 sm:right-10">
              <div
                ref={hintRef}
                className="pointer-events-none mb-3 flex items-center gap-3 uppercase"
                style={{ fontFamily: fontMono, fontSize: 10, letterSpacing: "0.22em" }}
              >
                <span style={muted}>Scroll to travel</span>
                <span className="relative block overflow-hidden" style={{ width: 36, height: 1 }}>
                  <span className="absolute inset-0 block" style={{ background: "currentColor", opacity: 0.2 }} />
                  <span className="smt-hint-line absolute inset-0 block" style={{ background: "currentColor" }} />
                </span>
              </div>
              {/* The mini-map: the whole timeline in one line, each tick a way to jump there. */}
              <nav aria-label="Timeline events" className="relative" style={{ height: 22 }}>
                <div className="absolute inset-x-0" style={{ top: 11, height: 1, background: "currentColor", opacity: 0.2 }} />
                {resolved.map((e, i) => {
                  const x = layout.axisEnd > 0 ? (layout.items[i].x - layout.axisStart) / (layout.axisEnd - layout.axisStart) : 0
                  const below = e.side === "below"
                  return (
                    <button
                      key={e.source}
                      type="button"
                      tabIndex={-1}
                      className="smt-tick-btn absolute cursor-pointer border-0 bg-transparent p-0"
                      style={{ left: "calc(" + (x * 100).toFixed(3) + "% - 6px)", top: 0, width: 12, height: 22 }}
                      aria-label={"Go to " + e.date + ": " + e.title.replace(/\n/g, " ")}
                      onClick={() => goTo(i)}
                    >
                      <span
                        className="smt-tick absolute block"
                        style={{
                          left: 5,
                          width: 2,
                          height: 6,
                          top: below ? 12 : 5,
                          transformOrigin: below ? "top" : "bottom",
                          borderRadius: 1,
                          background: e.color ?? "currentColor",
                          opacity: i <= active ? 1 : 0.4,
                        }}
                      />
                    </button>
                  )
                })}
                <div
                  ref={markerRef}
                  className="pointer-events-none absolute"
                  style={{ left: 0, top: 8, width: 7, height: 7, marginLeft: -3.5, borderRadius: 9, background: "currentColor" }}
                  aria-hidden="true"
                />
              </nav>
            </div>
          </>
        )}
      </div>

      {/* The timeline as text, in order, for anything that will not see it drawn. */}
      <ol className="sr-only">
        {resolved.map((e) => (
          <li key={e.source}>
            {e.date}: {e.title.replace(/\n/g, " ")}
            {e.detail ? " — " + e.detail : ""}
          </li>
        ))}
      </ol>
    </section>
  )
}
