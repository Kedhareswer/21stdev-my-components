"use client"

// Hollow Tide Preloader — a grainy, monochrome loading gate. The percentage is
// set huge in hairline outline and fills from the bottom like a glass: a live
// waterline with a translucent back-wave rises through the numerals as the load
// climbs. "LOADING" runs in two marquee bands top and bottom that speed up when
// the load surges and idle when it stalls. At 100% the tide spills over: the
// whole stage floods from below (the bands and the numerals invert as the crest
// passes them) and then lifts off whatever it was guarding.
//
// One file, React only. Everything is inline SVG + a scoped <style> where every
// rule is .htp- prefixed; the grain is an feTurbulence filter, nothing is
// fetched. Pointer position tilts the water, hovering the numerals stirs it,
// and a tap during the load sloshes it and rushes to 100%.

import * as React from "react"

export interface HollowTidePalette {
  /** Stage colour behind the numerals, and the inverted type on the flood. */
  background: string
  /** Outline, water, marquee type and the flood that ends the load. */
  ink: string
}

export interface HollowTidePreloaderProps {
  /** Content revealed once the gate lifts. Ignored while `loop` is set. */
  children?: React.ReactNode
  /** Run forever as a showcase: children are never revealed, onComplete never fires. */
  loop?: boolean
  /**
   * Real loading progress, 0–100. Leave undefined to run the built-in
   * simulated load over `durationMs`. The fill holds until this hits 100.
   */
  progress?: number
  /** Length of the simulated load. Defaults to 4200ms. */
  durationMs?: number
  /** Word run in the marquee bands while loading. */
  label?: string
  /** Word the bands switch to once the load completes. */
  doneLabel?: string
  /** Set after the number. Pass "" for a bare count. */
  suffix?: string
  /** Colour overrides, merged over the defaults. */
  palette?: Partial<HollowTidePalette>
  /** Face for the numerals and the bands. The default stack never fetches anything. */
  fontFamily?: string
  /** Weight of the numerals. */
  fontWeight?: number
  /** Outline width in CSS pixels (it does not scale with the numerals). */
  strokeWidth?: number
  /** Film-grain strength, 0–1. 0 removes the grain layer entirely. */
  grain?: number
  /** Marquee drift at rest, in px per second. Surges add to it. */
  marqueeSpeed?: number
  /** Root height. A definite length, never a percentage. */
  height?: string
  /** Fired once, after the gate has lifted. */
  onComplete?: () => void
  /** Extra root class names. */
  className?: string
}

const DEFAULT_PALETTE: HollowTidePalette = {
  background: "#222221",
  ink: "#f4f3ef",
}

const FONT_STACK =
  '"Helvetica Neue", Helvetica, Arial, "Nimbus Sans", "Liberation Sans", "Arimo", system-ui, sans-serif'

// #region timeline
// Pure helpers, lifted out and executed by tests/hollow-tide-preloader.test.mjs.

const clamp01 = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x)
const r1 = (n: number) => Math.round(n * 10) / 10

// A load that feels real: a quick start, a stall around 14%, a long pull to
// 41%, another stall, a surge, a breath at 79%, then the finish.
// [time, progress] knots, eased between.
const KNOTS = [
  [0, 0],
  [0.16, 0.12],
  [0.26, 0.14],
  [0.52, 0.41],
  [0.62, 0.43],
  [0.84, 0.78],
  [0.9, 0.79],
  [1, 1],
]

export function htpSimulated(t: number) {
  if (t <= 0) return 0
  if (t >= 1) return 1
  for (let i = 0; i < KNOTS.length - 1; i++) {
    const a = KNOTS[i]
    const b = KNOTS[i + 1]
    if (t <= b[0]) {
      const local = (t - a[0]) / (b[0] - a[0])
      const eased = 1 - Math.pow(1 - local, 3)
      return a[1] + (b[1] - a[1]) * eased
    }
  }
  return 1
}

// The waterline's resting y for progress p, in the numerals' viewBox. `base`
// is the bottom of the glyphs, `top` the top; `reach` is how far the wave can
// swing either side of its resting line, so 0% shows no water and 100% leaves
// no dry glyph however hard it sloshes.
export function htpLevel(p: number, base: number, top: number, reach: number) {
  const from = base + reach
  const to = top - reach
  return from + (to - from) * clamp01(p)
}

// Closed path: a two-harmonic wave across [0, width] at `level`, tilted by
// `tilt` (y per x, about the centre), then down to `floor` and back.
export function htpWave(level: number, amp: number, phase: number, tilt: number, width: number, floor: number) {
  const n = 40
  let d = ""
  for (let i = 0; i <= n; i++) {
    const x = (width * i) / n
    const swell = Math.sin(x * 0.011 + phase) * 0.72 + Math.sin(x * 0.029 - phase * 1.7) * 0.28
    d += (i ? "L" : "M") + r1(x) + " " + r1(level + tilt * (x - width / 2) + amp * swell)
  }
  return d + "L" + width + " " + floor + "L0 " + floor + "Z"
}

// Marquee offset wrapped into one repeat of the band, [0, span).
export function htpWrap(offset: number, span: number) {
  if (!(span > 0)) return 0
  return ((offset % span) + span) % span
}

// The readout: whole percent, clamped.
export function htpReadout(p: number, suffix: string) {
  return Math.round(clamp01(p) * 100) + suffix
}
// #endregion

// The numerals live in a fixed 1000 x 400 box; CSS scales the box.
const VB_W = 1000
const VB_H = 400
const FS = 340
const CREST_H = 44

const ITEMS = Array.from({ length: 16 }, (_, i) => i)

function Band({
  word,
  where,
  trackRef,
  halfRef,
}: {
  word: string
  where: "top" | "bottom"
  trackRef: (el: HTMLDivElement | null) => void
  halfRef: (el: HTMLSpanElement | null) => void
}) {
  return (
    <div className={"htp-band htp-band-" + where}>
      <div ref={trackRef} className="htp-track">
        {[0, 1].map((h) => (
          <span key={h} ref={h ? undefined : halfRef} className="htp-half">
            {ITEMS.map((i) => (
              <span key={i} className="htp-item">
                {word}
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  )
}

const HTP_CSS = `
.htp-root {
  position: relative;
  width: 100%;
  overflow: hidden;
  isolation: isolate;
  container-type: size;
  background: var(--htp-bg);
  color: var(--htp-ink);
  font-family: var(--htp-font);
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  -webkit-user-select: none;
}
.htp-root svg { max-width: none; display: block; overflow: visible; }
.htp-root:focus-visible { outline: none; }
.htp-gate:focus-visible { outline: 1px solid var(--htp-ink); outline-offset: -8px; }

.htp-dest {
  position: absolute;
  inset: 0;
  overflow-y: auto;
  opacity: 0;
  transition: opacity 0.6s ease;
}
.htp-dest[data-active="true"] { opacity: 1; }

.htp-gate {
  position: absolute;
  inset: 0;
  z-index: 2;
  overflow: hidden;
  background: var(--htp-bg);
  cursor: pointer;
  outline: none;
  transition: transform 1s cubic-bezier(0.76, 0, 0.24, 1);
}
.htp-root[data-phase="lift"] .htp-gate { transform: translate3d(0, -101%, 0); }

/* ---- the stage -------------------------------------------------------------- */
.htp-stage {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.htp-vignette {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 50% 50%, transparent 55%, color-mix(in srgb, #000 20%, transparent) 100%);
  pointer-events: none;
}
.htp-count {
  position: relative;
  width: min(64cqw, 140cqh);
  height: auto;
}
.htp-num {
  font-family: var(--htp-font);
  font-weight: var(--htp-weight);
  font-size: 340px;
  letter-spacing: -6px;
  font-variant-numeric: tabular-nums;
}
.htp-num-line {
  fill: none;
  stroke: var(--htp-ink);
  stroke-width: var(--htp-stroke);
  stroke-linejoin: round;
}
.htp-num-fill { fill: var(--htp-ink); }
.htp-num-back { fill: var(--htp-ink); opacity: 0.26; }

/* ---- marquee bands ------------------------------------------------------------ */
.htp-band {
  position: absolute;
  left: 0;
  right: 0;
  overflow: hidden;
  white-space: nowrap;
  line-height: 1;
  font-size: clamp(11px, 1.5cqw, 19px);
  font-weight: 500;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  pointer-events: none;
}
.htp-band-top { top: clamp(9px, 1.5cqh, 16px); }
.htp-band-bottom { bottom: clamp(9px, 1.5cqh, 16px); }
.htp-track { display: inline-flex; will-change: transform; }
.htp-half { display: inline-flex; flex: none; }
.htp-item { flex: none; padding: 0 clamp(26px, 4cqw, 62px); }

/* ---- the flood: rises from below, its contents held still so they invert in place */
.htp-flood {
  position: absolute;
  inset: 0;
  z-index: 2;
  color: var(--htp-bg);
  transform: translate3d(0, calc(100% + 64px), 0);
  transition: transform 1.15s cubic-bezier(0.76, 0, 0.24, 1);
  pointer-events: none;
}
.htp-crest {
  position: absolute;
  left: 0;
  bottom: calc(100% - 1px);
  width: 100%;
  height: clamp(16px, 3.6cqh, 40px);
  fill: var(--htp-ink);
}
.htp-flood-clip {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: var(--htp-ink);
}
.htp-flood-inner {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: translate3d(0, calc(-100% - 64px), 0);
  transition: transform 1.15s cubic-bezier(0.76, 0, 0.24, 1);
}
.htp-flood-inner .htp-num-solid { fill: var(--htp-bg); }
.htp-root[data-phase="flood"] .htp-flood,
.htp-root[data-phase="lift"] .htp-flood,
.htp-root[data-phase="flood"] .htp-flood-inner,
.htp-root[data-phase="lift"] .htp-flood-inner { transform: translate3d(0, 0, 0); }

/* ---- film grain -------------------------------------------------------------- */
.htp-grain {
  position: absolute;
  left: -50%;
  top: -50%;
  width: 200%;
  height: 200%;
  z-index: 3;
  opacity: var(--htp-grain);
  mix-blend-mode: overlay;
  pointer-events: none;
  animation: htp-grain 0.8s steps(1) infinite;
}
@keyframes htp-grain {
  0% { transform: translate3d(0, 0, 0); }
  17% { transform: translate3d(-3%, 2%, 0); }
  33% { transform: translate3d(2%, -4%, 0); }
  50% { transform: translate3d(-4%, -1%, 0); }
  67% { transform: translate3d(3%, 3%, 0); }
  83% { transform: translate3d(-1%, 4%, 0); }
}

.htp-sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

@container (max-aspect-ratio: 4/5) {
  .htp-count { width: 94cqw; }
  .htp-item { padding: 0 clamp(18px, 5cqw, 40px); }
}

@media (prefers-reduced-motion: reduce) {
  .htp-grain { animation: none; }
  .htp-crest { display: none; }
  .htp-flood,
  .htp-flood-inner,
  .htp-root[data-phase="flood"] .htp-flood,
  .htp-root[data-phase="lift"] .htp-flood,
  .htp-root[data-phase="flood"] .htp-flood-inner,
  .htp-root[data-phase="lift"] .htp-flood-inner { transform: none; }
  .htp-flood { opacity: 0; transition: opacity 0.5s ease; }
  .htp-root[data-phase="flood"] .htp-flood,
  .htp-root[data-phase="lift"] .htp-flood { opacity: 1; }
  .htp-gate { transition: opacity 0.6s ease; }
  .htp-root[data-phase="lift"] .htp-gate { transform: none; opacity: 0; }
}
`

type Phase = "load" | "full" | "flood" | "drain" | "lift" | "done"

const FULL_MS = 950
const FLOOD_MS = 2000
const DRAIN_MS = 1250
const LIFT_MS = 1000

export default function HollowTidePreloader({
  children,
  loop = false,
  progress,
  durationMs = 4200,
  label = "Loading",
  doneLabel = "Loaded",
  suffix = "%",
  palette,
  fontFamily = FONT_STACK,
  fontWeight = 700,
  strokeWidth = 1,
  grain = 0.55,
  marqueeSpeed = 42,
  height = "100svh",
  onComplete,
  className = "",
}: HollowTidePreloaderProps) {
  const [phase, setPhase] = React.useState<Phase>("load")
  const [pct, setPct] = React.useState(0)
  // ascent and descent of the readout's glyphs as a fraction of the font size
  const [metrics, setMetrics] = React.useState({ asc: 0.72, desc: 0 })

  const rootRef = React.useRef<HTMLDivElement>(null)
  const frontRef = React.useRef<SVGPathElement>(null)
  const backRef = React.useRef<SVGPathElement>(null)
  const crestRef = React.useRef<SVGPathElement>(null)
  const tracks = React.useRef<(HTMLDivElement | null)[]>([])
  const halves = React.useRef<(HTMLSpanElement | null)[]>([])

  const phaseRef = React.useRef<Phase>(phase)
  phaseRef.current = phase
  const progressRef = React.useRef(progress)
  progressRef.current = progress
  const durationRef = React.useRef(durationMs)
  durationRef.current = durationMs
  const speedRef = React.useRef(marqueeSpeed)
  speedRef.current = marqueeSpeed
  const onCompleteRef = React.useRef(onComplete)
  onCompleteRef.current = onComplete
  const rushRef = React.useRef(false)
  const kickRef = React.useRef(0)
  const hoverRef = React.useRef(false)
  const mxRef = React.useRef(0)

  const uid = React.useId().replace(/[^a-zA-Z0-9_-]/g, "")
  const colors = { ...DEFAULT_PALETTE, ...palette }

  // Where the glyphs sit in the 1000 x 400 box, centred on their ink, not their em.
  const baseline = VB_H / 2 + ((metrics.asc - metrics.desc) * FS) / 2
  const geo = { base: baseline + metrics.desc * FS, top: baseline - metrics.asc * FS }
  const geoRef = React.useRef(geo)
  geoRef.current = geo

  // Measure the real ink box of the digits in whatever face resolved, so the
  // water runs from the foot of the glyphs to their top, not the em box.
  React.useEffect(() => {
    let alive = true
    const measure = () => {
      const ctx = document.createElement("canvas").getContext("2d")
      if (!ctx) return
      ctx.font = fontWeight + " 100px " + fontFamily
      const m = ctx.measureText("0123456789" + suffix)
      const asc = m.actualBoundingBoxAscent / 100
      const desc = Math.max(0, m.actualBoundingBoxDescent / 100)
      if (alive && asc > 0.3 && asc < 1.2 && desc < 0.4) setMetrics({ asc, desc })
    }
    measure()
    document.fonts?.ready.then(measure)
    return () => {
      alive = false
    }
  }, [fontFamily, fontWeight, suffix])

  // ---- one frame loop: progress, water, marquee ------------------------------
  React.useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
    let raf = 0
    let last = performance.now()
    let loadStart = -1
    let shown = 0
    let prevShown = 0
    let t = 0
    let amp = 6
    let tilt = 0
    let speed = speedRef.current
    let offset = 0
    let shownPct = -1

    const tick = (now: number) => {
      const dt = Math.min(64, now - last)
      last = now
      const ph = phaseRef.current

      // progress
      if (ph === "load") {
        if (loadStart < 0) {
          loadStart = now
          shown = 0
          prevShown = 0
        }
        const external = progressRef.current
        let target =
          external !== undefined
            ? clamp01(external / 100)
            : htpSimulated((now - loadStart) / Math.max(400, durationRef.current))
        if (rushRef.current) target = 1
        // ease toward the target so stepped real progress still glides
        const rate = rushRef.current ? 0.09 : external !== undefined ? 0.1 : 1
        shown += (target - shown) * Math.min(1, rate * (dt / 16.7))
        if (target - shown < 0.002) shown = target
        if (shown >= 1) {
          shown = 1
          loadStart = -1
          phaseRef.current = "full"
          setPhase("full")
        }
      } else if (ph === "drain") {
        shown = 0
        prevShown = 0
      } else {
        shown = 1
      }
      const vel = dt > 0 ? Math.max(0, (shown - prevShown) / dt) * 1000 : 0
      prevShown = shown
      const r = Math.round(shown * 100)
      if (r !== shownPct) {
        shownPct = r
        setPct(r)
      }

      // water: amplitude follows hover, surges and taps; tilt follows the pointer
      kickRef.current *= Math.pow(0.95, dt / 16.7)
      const ampTarget = reduce ? 0 : 5 + (hoverRef.current ? 9 : 0) + Math.min(16, vel * 22) + kickRef.current
      amp += (ampTarget - amp) * Math.min(1, 0.06 * (dt / 16.7))
      const tiltTarget = reduce ? 0 : -mxRef.current * 0.07
      tilt += (tiltTarget - tilt) * Math.min(1, 0.045 * (dt / 16.7))
      if (!reduce) t += (dt / 1000) * (1.7 + (hoverRef.current ? 1.4 : 0) + vel * 2)

      const { base, top } = geoRef.current
      const reach = amp + Math.abs(tilt) * VB_W * 0.42 + 4
      const level = htpLevel(shown, base, top, reach)
      const bell = Math.sin(Math.PI * shown)
      frontRef.current?.setAttribute("d", htpWave(level, amp, t, tilt, VB_W, VB_H + 40))
      backRef.current?.setAttribute(
        "d",
        htpWave(level - (amp * 1.1 + 9) * bell, amp * 0.85 * bell, -t * 0.82 + 2.1, tilt * 1.2, VB_W, VB_H + 40),
      )
      crestRef.current?.setAttribute("d", htpWave(CREST_H / 2, reduce ? 0 : 10, t * 1.4, 0, VB_W, CREST_H + 2))

      // marquee: drifts at rest, races on surges, sprints once loaded
      const speedTarget = reduce
        ? 0
        : speedRef.current * (ph === "load" ? 1 : 3.2) + Math.min(900, vel * 1400) + (rushRef.current ? 260 : 0)
      speed += (speedTarget - speed) * Math.min(1, 0.05 * (dt / 16.7))
      offset += (speed * dt) / 1000
      const spans = halves.current.map((el) => (el ? el.offsetWidth : 0))
      tracks.current.forEach((el, i) => {
        if (!el) return
        const x = htpWrap(offset, spans[i])
        // even tracks are top bands (run left), odd are bottom bands (run right)
        el.style.transform = "translate3d(" + r1(i % 2 ? x - spans[i] : -x) + "px, 0, 0)"
      })

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  // ---- holds between phases --------------------------------------------------
  React.useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    if (phase === "full") timer = setTimeout(() => setPhase("flood"), FULL_MS)
    else if (phase === "flood") timer = setTimeout(() => setPhase(loop ? "drain" : "lift"), FLOOD_MS)
    else if (phase === "drain")
      timer = setTimeout(() => {
        rushRef.current = false
        setPhase("load")
      }, DRAIN_MS)
    else if (phase === "lift")
      timer = setTimeout(() => {
        setPhase("done")
        onCompleteRef.current?.()
      }, LIFT_MS)
    return () => clearTimeout(timer)
  }, [phase, loop])

  // Tap: during the load it sloshes the water and rushes to 100%; after it,
  // it skips the current hold.
  const onActivate = () => {
    const ph = phaseRef.current
    kickRef.current = Math.min(26, kickRef.current + 14)
    if (ph === "load") rushRef.current = true
    else if (ph === "full") setPhase("flood")
    else if (ph === "flood") setPhase(loop ? "drain" : "lift")
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const root = rootRef.current
    if (!root) return
    const r = root.getBoundingClientRect()
    mxRef.current = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1))
  }
  const onPointerLeave = () => {
    mxRef.current = 0
    hoverRef.current = false
  }

  const loading = phase === "load"
  const readout = htpReadout(pct / 100, suffix)
  const word = loading ? label : doneLabel
  const setTrack = (i: number) => (el: HTMLDivElement | null) => {
    tracks.current[i] = el
  }
  const setHalf = (i: number) => (el: HTMLSpanElement | null) => {
    halves.current[i] = el
  }
  const textProps = { x: VB_W / 2, y: r1(baseline), textAnchor: "middle" as const }

  return (
    <div
      ref={rootRef}
      className={"htp-root " + className}
      data-phase={phase}
      style={
        {
          height,
          "--htp-bg": colors.background,
          "--htp-ink": colors.ink,
          "--htp-font": fontFamily,
          "--htp-weight": String(fontWeight),
          "--htp-stroke": strokeWidth + "px",
          "--htp-grain": String(Math.max(0, Math.min(1, grain))),
        } as React.CSSProperties
      }
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      <style>{HTP_CSS}</style>

      {!loop && children ? (
        <div className="htp-dest" data-active={phase === "done"} aria-hidden={phase !== "done"}>
          {children}
        </div>
      ) : null}

      {phase !== "done" ? (
        <div
          className="htp-gate"
          role="progressbar"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          aria-valuetext={loading ? pct + "%" : doneLabel + ". Press Enter to continue."}
          tabIndex={0}
          onClick={onActivate}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              onActivate()
            }
          }}
        >
          <div className="htp-stage" aria-hidden="true">
            <div className="htp-vignette" />
            <svg
              className="htp-count"
              viewBox={"0 0 " + VB_W + " " + VB_H}
              onPointerEnter={() => (hoverRef.current = true)}
              onPointerLeave={() => (hoverRef.current = false)}
            >
              <defs>
                <clipPath id={uid + "-front"}>
                  <path ref={frontRef} d={"M0 " + VB_H + "Z"} />
                </clipPath>
                <clipPath id={uid + "-back"}>
                  <path ref={backRef} d={"M0 " + VB_H + "Z"} />
                </clipPath>
              </defs>
              <text {...textProps} className="htp-num htp-num-back" clipPath={"url(#" + uid + "-back)"}>
                {readout}
              </text>
              <text {...textProps} className="htp-num htp-num-fill" clipPath={"url(#" + uid + "-front)"}>
                {readout}
              </text>
              <text {...textProps} className="htp-num htp-num-line" vectorEffect="non-scaling-stroke">
                {readout}
              </text>
            </svg>
            <Band word={word} where="top" trackRef={setTrack(0)} halfRef={setHalf(0)} />
            <Band word={word} where="bottom" trackRef={setTrack(1)} halfRef={setHalf(1)} />
          </div>

          <div className="htp-flood" aria-hidden="true">
            <svg className="htp-crest" viewBox={"0 0 " + VB_W + " " + CREST_H} preserveAspectRatio="none">
              <path ref={crestRef} />
            </svg>
            <div className="htp-flood-clip">
              <div className="htp-flood-inner">
                <svg className="htp-count" viewBox={"0 0 " + VB_W + " " + VB_H}>
                  <text {...textProps} className="htp-num htp-num-solid">
                    {htpReadout(1, suffix)}
                  </text>
                </svg>
                <Band word={doneLabel} where="top" trackRef={setTrack(2)} halfRef={setHalf(2)} />
                <Band word={doneLabel} where="bottom" trackRef={setTrack(3)} halfRef={setHalf(3)} />
              </div>
            </div>
          </div>

          {grain > 0 ? (
            <svg className="htp-grain" aria-hidden="true">
              <filter id={uid + "-grain"} x="0" y="0" width="100%" height="100%">
                <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves={3} stitchTiles="stitch" />
                <feColorMatrix type="saturate" values="0" />
                <feComponentTransfer>
                  <feFuncR type="linear" slope="2.4" intercept="-0.7" />
                  <feFuncG type="linear" slope="2.4" intercept="-0.7" />
                  <feFuncB type="linear" slope="2.4" intercept="-0.7" />
                </feComponentTransfer>
              </filter>
              <rect width="100%" height="100%" filter={"url(#" + uid + "-grain)"} />
            </svg>
          ) : null}

          <span className="htp-sr" aria-live="polite">
            {loading ? "" : doneLabel}
          </span>
        </div>
      ) : null}
    </div>
  )
}
