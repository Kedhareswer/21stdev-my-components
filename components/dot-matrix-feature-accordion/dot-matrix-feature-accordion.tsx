"use client"

import {
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react"

/* ------------------------------------------------------------------------- */
/* Types                                                                      */
/* ------------------------------------------------------------------------- */

export type DotMatrixFeature = {
  /** Stable key. */
  id: string
  /** Row title in the accordion. */
  title: string
  /** Body copy revealed under the active title. */
  description: string
  /** Card colour while this feature is active (any CSS colour). */
  color: string
  /** The small UI snippet floated in the middle of the card. */
  snippet: ReactNode
}

export interface DotMatrixFeatureAccordionProps {
  /** Section headline, top of the left column. */
  heading?: ReactNode
  /** Rows, in order. Defaults to a six-step personal-finance walkthrough. */
  features?: DotMatrixFeature[]
  /** Dwell time per feature in ms before auto-advancing. Measured off the reference: 1850. */
  interval?: number
  /** Cycle on its own. Hovering a row always takes over and pauses the cycle. */
  autoPlay?: boolean
  className?: string
}

/* ------------------------------------------------------------------------- */
/* Timings (measured frame by frame off the reference, 60 fps)                */
/* ------------------------------------------------------------------------- */

const COLOR_MS = 350 // card background cross-fade
const SNIPPET_OUT_MS = 140 // old snippet blurs out first…
const SNIPPET_IN_MS = 240 // …then the new one blurs in (never both at once)
const DOTS_MS = 460 // dot clusters scatter and re-form
const PANEL_TAU = 70 // ms time-constant of the sliding grey panel
const BAR_SPAN = 0.28 // the progress pill reaches ~28% of the panel by the time the row advances

// Interaction extras (not in the reference)
const TILT_DEG = 6 // max card tilt toward the cursor
const PARALLAX_PX = 12 // snippet drifts against the tilt for depth
const SWIPE_PX = 40 // horizontal travel that counts as a swipe

// Chips pop in just after their card lands. Scoped by class name; no globals.
const DMFA_CSS =
  "@keyframes dmfa-pop{0%{opacity:0;transform:translateY(6px) scale(.94)}100%{opacity:1;transform:translateY(0) scale(1)}}" +
  ".dmfa-pop{animation:dmfa-pop 420ms cubic-bezier(.2,.8,.2,1) 180ms both}" +
  "@media (prefers-reduced-motion: reduce){.dmfa-pop{animation:none}}"

/* ------------------------------------------------------------------------- */
/* Dot-matrix patterns                                                        */
/* ------------------------------------------------------------------------- */

// #region dot-patterns
const GRID = 41 // cells across the square card
const BAND = 8 // clusters live within this many cells of an edge

type Dot = { x: number; y: number; a: number }

function mulberry32(seed: number) {
  let t = seed >>> 0
  return () => {
    t = (t + 0x6d2b79f5) >>> 0
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

/** Grid-aligned blobs of dots hugging the card's edges, deterministic per seed. */
export function makeDotPattern(seed: number): Dot[] {
  const rnd = mulberry32(seed * 9973 + 17)
  const taken = new Set<string>()
  const dots: Dot[] = []
  const clusters = 9 + Math.floor(rnd() * 3)
  for (let c = 0; c < clusters; c++) {
    // Walk the perimeter evenly, with jitter, so every edge gets something.
    const t = (c + rnd() * 0.7) / clusters
    const side = Math.floor(t * 4)
    const along = 2 + Math.floor(((t * 4) % 1) * (GRID - 4))
    const inset = 1 + Math.floor(rnd() * 3)
    let cx = 0
    let cy = 0
    if (side === 0) [cx, cy] = [along, inset]
    else if (side === 1) [cx, cy] = [GRID - 1 - inset, along]
    else if (side === 2) [cx, cy] = [GRID - 1 - along, GRID - 1 - inset]
    else [cx, cy] = [inset, GRID - 1 - along]
    const rx = 1.6 + rnd() * 2.6
    const ry = 1.6 + rnd() * 2.6
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        if (x < 1 || y < 1 || x > GRID - 2 || y > GRID - 2) continue
        const edge = Math.min(x, y, GRID - 1 - x, GRID - 1 - y)
        if (edge > BAND) continue
        const d = Math.hypot((x - cx) / rx, (y - cy) / ry)
        if (d > 1.05 || rnd() > 0.92 - d * 0.55) continue
        const k = x + "," + y
        if (taken.has(k)) continue
        taken.add(k)
        dots.push({ x, y, a: rnd() < 0.3 ? 0.5 : 1 })
      }
    }
  }
  return dots
}
// #endregion dot-patterns

type Particle = {
  x0: number
  y0: number
  a0: number
  x1: number
  y1: number
  a1: number
  jx: number
  jy: number
  x: number
  y: number
  a: number
  s: number
  /** shimmer phase */
  ph: number
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const angleOf = (d: { x: number; y: number }) => Math.atan2(d.y - (GRID - 1) / 2, d.x - (GRID - 1) / 2)

/** Pair what is on screen now with the next pattern, going round the card so dots travel short arcs. */
function retarget(current: Particle[], next: Dot[], seed: number): Particle[] {
  const rnd = mulberry32(seed + 404)
  const from = current.filter((p) => p.a > 0.02).sort((a, b) => angleOf(a) - angleOf(b))
  const to = [...next].sort((a, b) => angleOf(a) - angleOf(b))
  const n = Math.max(from.length, to.length)
  const usedFrom = new Set<number>()
  const usedTo = new Set<number>()
  const out: Particle[] = []
  for (let k = 0; k < n; k++) {
    const fi = from.length ? Math.floor((k * from.length) / n) : -1
    const ti = Math.floor((k * to.length) / n)
    const f = fi >= 0 ? from[fi] : null
    const t = to[ti]
    const ang = rnd() * Math.PI * 2
    const amp = 0.4 + rnd() * 1.2
    // A dot shared by two particles would double its alpha; only one of them shows.
    const a0 = f && !usedFrom.has(fi) ? f.a : 0
    const a1 = !usedTo.has(ti) ? t.a : 0
    usedFrom.add(fi)
    usedTo.add(ti)
    const x0 = f ? f.x : t.x
    const y0 = f ? f.y : t.y
    out.push({ x0, y0, a0, x1: t.x, y1: t.y, a1, jx: Math.cos(ang) * amp, jy: Math.sin(ang) * amp, x: x0, y: y0, a: a0, s: 1, ph: rnd() * Math.PI * 2 })
  }
  return out
}

type MaskBox = { l: number; t: number; r: number; b: number }

/**
 * Union of the snippet's layout boxes relative to the card, in CSS px. Uses
 * offset geometry, not client rects, so the card's pointer tilt doesn't skew it.
 */
function measureMask(card: HTMLElement | null, el: HTMLElement | null): MaskBox | null {
  if (!el || !card) return null
  let box: MaskBox | null = null
  for (const n of el.querySelectorAll<HTMLElement>("*")) {
    if (n.offsetWidth < 1 || n.offsetHeight < 1) continue
    let x = 0
    let y = 0
    let o: HTMLElement | null = n
    while (o && o !== card) {
      x += o.offsetLeft
      y += o.offsetTop
      o = o.offsetParent as HTMLElement | null
    }
    if (o !== card) continue
    const r = { l: x, t: y, r: x + n.offsetWidth, b: y + n.offsetHeight }
    box = box ? { l: Math.min(box.l, r.l), t: Math.min(box.t, r.t), r: Math.max(box.r, r.r), b: Math.max(box.b, r.b) } : r
  }
  return box
}

/** Live pointer + ripple input the card writes and the dot field reads each frame (CSS px, card space). */
export type FieldInput = { x: number; y: number; inside: boolean; ripples: { x: number; y: number; t: number }[] }

const POINTER_R = 6 // cells: radius the cursor pushes dots within
const RIPPLE_SPEED = 34 // cells per second
const RIPPLE_LIFE = 950 // ms
const ENTRY_MS = 900 // first assembly when the card scrolls into view
const ENTRY_PENDING = -2

function DotField({
  index,
  seedOffset,
  reduced,
  maskRef,
  maskKey,
  inputRef,
}: {
  index: number
  seedOffset: number
  reduced: boolean
  /** Dots fade out near this element (the snippet), so they never crowd or hide under it. */
  maskRef: RefObject<HTMLElement | null>
  maskKey: number
  inputRef: RefObject<FieldInput>
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particles = useRef<Particle[]>([])
  const raf = useRef(0)
  const transStart = useRef(-1)
  const transDur = useRef(DOTS_MS)
  const patternKey = useRef("")
  const size = useRef({ w: 0, h: 0, dpr: 1 })
  const ptr = useRef({ x: 0, y: 0, str: 0, last: 0 })
  const visible = useRef(true)

  const draw = useCallback(
    (now: number) => {
      const cv = canvasRef.current
      if (!cv) return
      const ctx = cv.getContext("2d")
      if (!ctx) return
      const { w, h, dpr } = size.current
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, cv.width, cv.height)
      if (w < 1) return
      const cell = w / GRID // CSS px per cell
      const pitch = cell * dpr
      const pitchY = (h * dpr) / GRID
      const r = pitch * 0.26
      const m = measureMask(cv.parentElement, maskRef.current)
      const clear = pitch * 1.1

      // Smoothed pointer, in cells; its strength eases in and out with hover.
      const inp = inputRef.current
      const P = ptr.current
      const dt = Math.min(64, now - (P.last || now))
      P.last = now
      const tx = inp ? inp.x / cell : P.x
      const ty = inp ? inp.y / cell : P.y
      if (P.str < 0.01) {
        P.x = tx
        P.y = ty
      } else {
        const k = 1 - Math.exp(-dt / 90)
        P.x += (tx - P.x) * k
        P.y += (ty - P.y) * k
      }
      P.str += ((inp && inp.inside && !reduced ? 1 : 0) - P.str) * (1 - Math.exp(-dt / 160))
      const ripples = inp ? (inp.ripples = inp.ripples.filter((q) => now - q.t < RIPPLE_LIFE)) : []

      ctx.fillStyle = "#fff"
      for (const p of particles.current) {
        if (p.a <= 0.01) continue
        let cx = p.x + 0.5
        let cy = p.y + 0.5
        let a = p.a
        let s = p.s
        if (!reduced) a *= 0.8 + 0.2 * (0.5 + 0.5 * Math.sin(now * 0.0018 + p.ph))
        // Cursor: nearby dots swell, brighten and drift away from it.
        if (P.str > 0.01) {
          const dx = cx - P.x
          const dy = cy - P.y
          const d = Math.hypot(dx, dy) || 0.0001
          if (d < POINTER_R) {
            const f = Math.pow(1 - d / POINTER_R, 2) * P.str
            cx += (dx / d) * f * 1.4
            cy += (dy / d) * f * 1.4
            s *= 1 + 0.55 * f
            a = Math.min(1, a + 0.6 * f)
          }
        }
        // Click ripples: a ring that lifts the dots it passes.
        for (const q of ripples) {
          const age = (now - q.t) / 1000
          const dx = cx - q.x / cell
          const dy = cy - q.y / cell
          const d = Math.hypot(dx, dy) || 0.0001
          const ring = Math.exp(-Math.pow((d - age * RIPPLE_SPEED) / 2.2, 2)) * (1 - (now - q.t) / RIPPLE_LIFE)
          if (ring > 0.01) {
            cx += (dx / d) * ring * 0.9
            cy += (dy / d) * ring * 0.9
            s *= 1 + 0.7 * ring
            a = Math.min(1, a + 0.5 * ring)
          }
        }
        const x = cx * pitch
        const y = cy * pitchY
        if (m) {
          const ddx = Math.max(m.l * dpr - x, 0, x - m.r * dpr)
          const ddy = Math.max(m.t * dpr - y, 0, y - m.b * dpr)
          const d = Math.hypot(ddx, ddy) - r * s - clear
          if (d <= 0) continue
          if (d < pitch) a *= d / pitch
        }
        ctx.globalAlpha = a
        ctx.beginPath()
        ctx.arc(x, y, r * s, 0, Math.PI * 2)
        ctx.fill()
      }
      // The ripple itself: a ring of lit cells on the same lattice, spreading from the click.
      for (const q of ripples) {
        const life = (now - q.t) / RIPPLE_LIFE
        const R = ((now - q.t) / 1000) * RIPPLE_SPEED
        const qx = q.x / cell
        const qy = q.y / cell
        for (let gy = 0; gy < GRID; gy++) {
          for (let gx = 0; gx < GRID; gx++) {
            const cx = gx + 0.5
            const cy = gy + 0.5
            const ring = Math.exp(-Math.pow((Math.hypot(cx - qx, cy - qy) - R) / 0.9, 2))
            let a = ring * 0.55 * (1 - life)
            if (a < 0.03) continue
            const x = cx * pitch
            const y = cy * pitchY
            if (m) {
              const ddx = Math.max(m.l * dpr - x, 0, x - m.r * dpr)
              const ddy = Math.max(m.t * dpr - y, 0, y - m.b * dpr)
              const d = Math.hypot(ddx, ddy) - r - clear
              if (d <= 0) continue
              if (d < pitch) a *= d / pitch
            }
            ctx.globalAlpha = a
            ctx.beginPath()
            ctx.arc(x, y, r * 0.8, 0, Math.PI * 2)
            ctx.fill()
          }
        }
      }
      ctx.globalAlpha = 1
    },
    [maskRef, inputRef, reduced],
  )

  // One loop drives the pattern morph, pointer, ripples and shimmer. It stops off-screen, in a hidden tab and under reduced motion.
  const tick = useCallback(
    (now: number) => {
      raf.current = 0
      const t0 = transStart.current
      if (t0 >= 0) {
        const t = Math.min(1, (now - t0) / transDur.current)
        const e = easeInOut(t)
        const bump = Math.sin(Math.PI * t)
        for (const p of particles.current) {
          p.x = p.x0 + (p.x1 - p.x0) * e + p.jx * bump
          p.y = p.y0 + (p.y1 - p.y0) * e + p.jy * bump
          p.a = (p.a0 + (p.a1 - p.a0) * e) * (1 - 0.15 * bump)
          p.s = 1 - 0.18 * bump
        }
        if (t >= 1) {
          transStart.current = -1
          particles.current = particles.current.filter((p) => p.a > 0.01)
        }
      }
      draw(now)
      if (!reduced && visible.current && !document.hidden) raf.current = requestAnimationFrame(tick)
    },
    [draw, reduced],
  )
  const kick = useCallback(() => {
    if (!raf.current) raf.current = requestAnimationFrame(tick)
  }, [tick])

  // Keep the backing store at the laid-out size × DPR (never CSS-scaled).
  useLayoutEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const fit = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = cv.offsetWidth
      const h = cv.offsetHeight
      size.current = { w, h, dpr }
      cv.width = Math.max(1, Math.round(w * dpr))
      cv.height = Math.max(1, Math.round(h * dpr))
      draw(performance.now())
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(cv)
    return () => ro.disconnect()
  }, [draw])

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const io = new IntersectionObserver(
      ([e]) => {
        visible.current = e.isIntersecting
        if (!e.isIntersecting) return
        // First time on screen: the waiting entry assembly starts now.
        if (transStart.current === ENTRY_PENDING) transStart.current = performance.now()
        kick()
      },
      { threshold: 0.25 },
    )
    io.observe(cv)
    const vis = () => {
      if (!document.hidden) kick()
    }
    document.addEventListener("visibilitychange", vis)
    return () => {
      io.disconnect()
      document.removeEventListener("visibilitychange", vis)
      cancelAnimationFrame(raf.current)
      raf.current = 0
    }
  }, [kick])

  useEffect(() => {
    // Same pattern as already showing (e.g. StrictMode's second effect run): nothing to morph.
    const key = index + seedOffset + (reduced ? "r" : "")
    if (patternKey.current === key) {
      if (reduced) draw(performance.now())
      else kick()
      return
    }
    const first = patternKey.current === ""
    patternKey.current = key
    const next = makeDotPattern(index + seedOffset)
    if (reduced) {
      particles.current = next.map((d, i) => ({ x0: d.x, y0: d.y, a0: d.a, x1: d.x, y1: d.y, a1: d.a, jx: 0, jy: 0, x: d.x, y: d.y, a: d.a, s: 1, ph: (i * 2.399) % (Math.PI * 2) }))
      transStart.current = -1
      draw(performance.now())
      return
    }
    if (first) {
      // Entry: dots drift in from loose positions and assemble once the card is on screen.
      const rnd = mulberry32(911 + index)
      particles.current = next.map((d, i) => {
        const x0 = d.x + (rnd() - 0.5) * 7
        const y0 = d.y + (rnd() - 0.5) * 7
        return { x0, y0, a0: 0, x1: d.x, y1: d.y, a1: d.a, jx: 0, jy: 0, x: x0, y: y0, a: 0, s: 1, ph: (i * 2.399) % (Math.PI * 2) }
      })
      transDur.current = ENTRY_MS
      transStart.current = ENTRY_PENDING
    } else {
      particles.current = retarget(particles.current, next, index + seedOffset)
      transDur.current = DOTS_MS
      transStart.current = performance.now()
    }
    kick()
  }, [index, seedOffset, reduced, draw, kick])

  // Reduced motion runs no loop: repaint once the new snippet is in, so the clear zone fits it.
  useEffect(() => {
    const t = window.setTimeout(() => draw(performance.now()), SNIPPET_IN_MS + 40)
    return () => window.clearTimeout(t)
  }, [maskKey, draw])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 block"
      style={{ width: "100%", height: "100%", maxWidth: "none" }}
    />
  )
}

/* ------------------------------------------------------------------------- */
/* Default snippets                                                           */
/* ------------------------------------------------------------------------- */

const ink = "#141414"
const sub = "#8b8b8b"
const plus = "#22b35a"

const COUNT_MS = 720

/**
 * Counts up to `value` when the snippet mounts. Starts at the same digit count
 * so the figure never changes width mid-count. Screen readers get the final value.
 */
export function CountUp({
  value,
  decimals = 2,
  prefix = "$",
  suffix = "",
  sign = "",
}: {
  value: number
  decimals?: number
  prefix?: string
  suffix?: string
  sign?: string
}) {
  const fmt = (n: number) =>
    sign + prefix + n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix
  const floor = Math.pow(10, Math.floor(Math.log10(Math.max(1, value))))
  const from = value - (value - floor) * 0.5
  const [n, setN] = useState(from)
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setN(value)
      return
    }
    let raf = 0
    const t0 = performance.now() + 120
    const step = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - t0) / COUNT_MS))
      setN(from + (value - from) * (1 - Math.pow(1 - t, 3)))
      if (t < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [value, from])
  return (
    <span aria-label={fmt(value)} role="text">
      <span aria-hidden>{fmt(n)}</span>
    </span>
  )
}

const lift =
  " transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(0,0,0,0.16)] motion-reduce:transition-none"

function Row({ icon, title, meta, amount, amountColor = ink }: { icon: ReactNode; title: string; meta: string; amount: ReactNode; amountColor?: string }) {
  return (
    <div className="flex items-center gap-3">
      {icon}
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] leading-5 font-semibold" style={{ color: ink }}>
          {title}
        </div>
        <div className="truncate text-[12.5px] leading-[18px]" style={{ color: sub }}>
          {meta}
        </div>
      </div>
      <div className="shrink-0 text-[16px] leading-5 font-semibold tabular-nums" style={{ color: amountColor }}>
        {amount}
      </div>
    </div>
  )
}

function Disc({ bg, children, ring }: { bg: string; children: ReactNode; ring?: boolean }) {
  return (
    <span
      className="grid size-9 shrink-0 place-items-center rounded-full text-[13px] font-semibold text-white"
      style={{ background: bg, boxShadow: ring ? "0 0 0 2px #fff" : undefined }}
    >
      {children}
    </span>
  )
}

/** Progress meter that fills from empty each time its snippet enters. */
function Meter({ value, left, right }: { value: number; left: string; right: ReactNode }) {
  const [on, setOn] = useState(false)
  useEffect(() => {
    let inner = 0
    const outer = requestAnimationFrame(() => (inner = requestAnimationFrame(() => setOn(true))))
    return () => {
      cancelAnimationFrame(outer)
      cancelAnimationFrame(inner)
    }
  }, [])
  return (
    <div className="mt-3">
      <div className="h-[5px] w-full overflow-hidden rounded-full" style={{ background: "#ececec" }}>
        <div
          className="h-[5px] rounded-full transition-[width] delay-150 duration-[900ms] ease-[cubic-bezier(.2,.8,.2,1)] motion-reduce:transition-none"
          style={{ width: (on ? value : 0) + "%", background: plus }}
        />
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] leading-4" style={{ color: sub }}>
        <span>{left}</span>
        <span className="tabular-nums">{right}</span>
      </div>
    </div>
  )
}

const shell = "w-[min(304px,100%)] rounded-[14px] bg-white px-3 py-3 shadow-[0_6px_24px_rgba(0,0,0,0.10)]" + lift
const chip = "dmfa-pop rounded-full bg-white px-3 py-[5px] text-[12.5px] leading-4 font-medium shadow-[0_4px_14px_rgba(0,0,0,0.10)]"

const icons = {
  moon: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="#fff" aria-hidden>
      <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
    </svg>
  ),
  cup: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <path d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5V9Z" />
      <path d="M16 11h1.5a2.5 2.5 0 0 1 0 5H16" />
      <path d="M9 3.5v2M12 3.5v2" />
    </svg>
  ),
  shield: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#fff" strokeWidth="2" strokeLinejoin="round" aria-hidden>
      <rect x="4" y="6" width="16" height="12" rx="3" />
      <path d="M15 12h2" strokeLinecap="round" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m6 12 4 4 8-8" />
    </svg>
  ),
}

export const DEFAULT_FEATURES: DotMatrixFeature[] = [
  {
    id: "payday",
    title: "Payday",
    description: "When your salary lands, a share slips into savings before you can spend it, or even notice it happened.",
    color: "#2bd655",
    snippet: (
      <div className="flex w-[min(304px,100%)] flex-col items-center gap-2.5">
        <span className={chip} style={{ color: plus }}>
          +$320.00 to savings
        </span>
        <div className={shell}>
          <Row icon={<Disc bg={ink}>N</Disc>} title="Northwind Co." meta="Salary · Fri, 9:00 AM" amount={<CountUp value={3200} />} />
        </div>
      </div>
    ),
  },
  {
    id: "round-ups",
    title: "Round-ups",
    description: "Every coffee, cab and late-night order rounds up to the next dollar. Small change that quietly stacks up.",
    color: "#ec9a26",
    snippet: (
      <div className="relative w-[min(304px,100%)]">
        <div className={shell}>
          <Row icon={<Disc bg="#c9781a">{icons.cup}</Disc>} title="Corner Café" meta="Coffee · 8:14 AM" amount={<CountUp value={4.6} />} />
        </div>
        <span className={chip + " absolute -top-3 -right-2 px-2 py-[3px] text-[11px]"} style={{ color: plus }}>
          +$0.40
        </span>
      </div>
    ),
  },
  {
    id: "morning",
    title: "Morning",
    description: "Start the day with a single number: what your savings earned overnight. No charts to decode.",
    color: "#7e42ef",
    snippet: (
      <div className={shell}>
        <Row icon={<Disc bg={plus}>{icons.moon}</Disc>} title="Good morning" meta="Earned while you slept" amount={<CountUp value={1.84} sign="+" />} amountColor={plus} />
      </div>
    ),
  },
  {
    id: "safe-to-spend",
    title: "Safe to spend",
    description: "One figure for what is truly yours this week, with rent and bills already set aside.",
    color: "#f2642d",
    snippet: (
      <div className={shell}>
        <Row icon={<Disc bg="#f2642d">{icons.shield}</Disc>} title="Safe to spend" meta="Until Sunday" amount={<CountUp value={214} />} />
        <Meter value={64} left="Rent and bills covered" right={<CountUp value={64} decimals={0} prefix="" suffix="% left" />} />
      </div>
    ),
  },
  {
    id: "group-pots",
    title: "Group pots",
    description: "Planning a trip with friends? Open a shared pot, invite the group and see who has chipped in.",
    color: "#f13f96",
    snippet: (
      <div className={shell}>
        <Row
          icon={
            <span className="flex shrink-0">
              <Disc bg="#f2642d" ring>
                AL
              </Disc>
              <span className="-ml-1.5">
                <Disc bg="#3a59f7" ring>
                  JK
                </Disc>
              </span>
              <span className="-ml-1.5">
                <Disc bg="#d6336c" ring>
                  RM
                </Disc>
              </span>
            </span>
          }
          title="Lisbon trip"
          meta="3 friends, one pot"
          amount={<CountUp value={1240} decimals={0} />}
        />
        <Meter value={62} left="Goal $2,000" right={<CountUp value={62} decimals={0} prefix="" suffix="%" />} />
      </div>
    ),
  },
  {
    id: "anytime",
    title: "Anytime",
    description: "Withdraw whenever you like. No lock-in periods, no penalties, no guilt-trip screens.",
    color: "#3a59f7",
    snippet: (
      <div className="flex w-[min(304px,100%)] flex-col items-center gap-2.5">
        <div className={shell}>
          <Row icon={<Disc bg="#f2642d">MR</Disc>} title="Maya Reyes" meta="•••• 4821" amount={<CountUp value={500} />} amountColor={plus} />
        </div>
        <span className={chip + " flex items-center gap-1.5 py-[4px] pl-1 text-[11.5px]"} style={{ color: ink }}>
          <span className="grid size-[18px] place-items-center rounded-full" style={{ background: plus }}>
            {icons.check}
          </span>
          Arrived in 4s
        </span>
      </div>
    ),
  },
]

/* ------------------------------------------------------------------------- */
/* Component                                                                  */
/* ------------------------------------------------------------------------- */

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const on = () => setReduced(mq.matches)
    on()
    mq.addEventListener("change", on)
    return () => mq.removeEventListener("change", on)
  }, [])
  return reduced
}

export default function DotMatrixFeatureAccordion({
  heading = (
    <>
      Your money moves
      <br />
      while you&rsquo;re busy living.
    </>
  ),
  features = DEFAULT_FEATURES,
  interval = 1850,
  autoPlay = true,
  className = "",
}: DotMatrixFeatureAccordionProps) {
  const count = features.length
  const [active, setActive] = useState(0)
  const [shown, setShown] = useState(0) // snippet lags `active` by the exit time
  const [snippetIn, setSnippetIn] = useState(true)
  const [hovering, setHovering] = useState(false)
  const [keyboard, setKeyboard] = useState(false) // keyboard focus inside the list also holds the cycle
  const reduced = usePrefersReducedMotion()

  const rootRef = useRef<HTMLElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const rowRefs = useRef<(HTMLDivElement | null)[]>([])
  const panelRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const snippetRef = useRef<HTMLDivElement>(null)
  const elapsed = useRef(0)
  const visible = useRef(true)

  const select = useCallback(
    (i: number) => {
      elapsed.current = 0
      setActive(((i % count) + count) % count)
    },
    [count],
  )

  /* --- Card interaction: cursor-reactive dots, tilt, click/tap/swipe/keys to step --- */
  const [cardHover, setCardHover] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const parallaxRef = useRef<HTMLDivElement>(null)
  const fieldInput = useRef<FieldInput>({ x: 0, y: 0, inside: false, ripples: [] })
  const swipe = useRef<{ x: number; y: number; swiped: boolean } | null>(null)
  const activeRef = useRef(active)
  activeRef.current = active

  // Pointer position in the card's own (untransformed) px, plus -0.5..0.5 offsets for tilt.
  const cardPoint = (e: { clientX: number; clientY: number }) => {
    const card = cardRef.current
    if (!card) return { x: 0, y: 0, nx: 0, ny: 0 }
    const r = card.getBoundingClientRect()
    const fx = (e.clientX - r.left) / Math.max(1, r.width)
    const fy = (e.clientY - r.top) / Math.max(1, r.height)
    return { x: fx * card.offsetWidth, y: fy * card.offsetHeight, nx: fx - 0.5, ny: fy - 0.5 }
  }
  const setTilt = (nx: number, ny: number) => {
    const card = cardRef.current
    const par = parallaxRef.current
    if (!card || !par || reduced) return
    card.style.transform = "perspective(1100px) rotateX(" + (-ny * TILT_DEG).toFixed(2) + "deg) rotateY(" + (nx * TILT_DEG).toFixed(2) + "deg)"
    par.style.transform = "translate3d(" + (nx * -PARALLAX_PX).toFixed(2) + "px, " + (ny * -PARALLAX_PX).toFixed(2) + "px, 0)"
  }
  const step = (dir: number, at?: { x: number; y: number }) => {
    const card = cardRef.current
    if (card && !reduced) {
      const p = at ?? { x: card.offsetWidth / 2, y: card.offsetHeight / 2 }
      fieldInput.current.ripples.push({ x: p.x, y: p.y, t: performance.now() })
    }
    select(activeRef.current + dir)
  }

  // Snippet: exit, then enter. One layer at a time, so no double exposure.
  useEffect(() => {
    if (shown === active) return
    if (reduced) {
      setShown(active)
      return
    }
    setSnippetIn(false)
    const t = window.setTimeout(() => {
      setShown(active)
      setSnippetIn(true)
    }, SNIPPET_OUT_MS)
    return () => window.clearTimeout(t)
  }, [active, shown, reduced])

  // Pause while off-screen.
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => (visible.current = e.isIntersecting), { threshold: 0.15 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // Auto-advance + progress pill, driven off one rAF (no per-frame re-render).
  useEffect(() => {
    let raf = 0
    let last = performance.now()
    const paused = !autoPlay || hovering || keyboard || cardHover
    const tick = (now: number) => {
      const dt = Math.min(64, now - last)
      last = now
      if (!paused && visible.current && !document.hidden) elapsed.current += dt
      const bar = barRef.current
      if (bar) {
        bar.style.width = paused ? "0%" : (Math.min(1, elapsed.current / interval) * BAR_SPAN * 100).toFixed(3) + "%"
        bar.style.opacity = paused ? "0" : "1"
      }
      if (!paused && elapsed.current >= interval) {
        elapsed.current = 0
        setActive((a) => (a + 1) % count)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [autoPlay, hovering, keyboard, cardHover, interval, count])

  // Grey panel follows the active row with an eased slide while rows open/close.
  // It reads the row's live box every frame (rows are mid-resize), lerps toward
  // it, and stops once settled; a ResizeObserver wakes it on reflow.
  const panelPos = useRef({ top: -1, h: 0 })
  useLayoutEffect(() => {
    const panel = panelRef.current
    const list = listRef.current
    if (!panel || !list) return
    const cur = panelPos.current
    const changedAt = performance.now()
    let raf = 0
    let last = changedAt
    const run = (now: number) => {
      const row = rowRefs.current[active]
      if (!row) return
      const top = row.offsetTop
      const h = row.offsetHeight
      const dt = Math.min(64, now - last)
      last = now
      if (cur.top < 0 || reduced) {
        cur.top = top
        cur.h = h
      } else {
        const k = 1 - Math.exp(-dt / PANEL_TAU)
        cur.top += (top - cur.top) * k
        cur.h += (h - cur.h) * k
        if (Math.abs(top - cur.top) < 0.05) cur.top = top
        if (Math.abs(h - cur.h) < 0.05) cur.h = h
      }
      panel.style.transform = "translateY(" + cur.top.toFixed(2) + "px)"
      panel.style.height = cur.h.toFixed(2) + "px"
      const settled = cur.top === top && cur.h === h && now - changedAt > 500
      raf = settled ? 0 : requestAnimationFrame(run)
    }
    const wake = () => {
      if (raf) return
      last = performance.now()
      raf = requestAnimationFrame(run)
    }
    run(performance.now())
    const ro = new ResizeObserver(wake)
    ro.observe(list)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [active, reduced])

  const color = features[active]?.color ?? "#2bd655"

  return (
    <section
      ref={rootRef}
      className={"relative w-full bg-background px-6 py-16 text-foreground sm:px-10 md:py-24 " + className}
      style={{ "--dmfa-accent": color } as CSSProperties}
    >
      <style>{DMFA_CSS}</style>
      <div className="mx-auto grid w-full max-w-[968px] grid-cols-1 items-start gap-10 md:grid-cols-[minmax(0,352px)_minmax(0,1fr)] md:gap-[78px]">
        {/* Left: headline + accordion */}
        <div className="min-w-0 max-md:contents">
          <h2 data-dmfa="heading" className="px-[18px] max-md:order-1 text-[24px] leading-[1.22] font-medium tracking-[-0.015em] sm:text-[26px]">{heading}</h2>

          <div
            ref={listRef}
            data-dmfa="list"
            className="relative mt-10 max-md:order-3 max-md:mt-0"
            onPointerEnter={(e) => e.pointerType === "mouse" && setHovering(true)}
            onPointerLeave={(e) => {
              if (e.pointerType !== "mouse") return
              elapsed.current = 0
              setHovering(false)
            }}
            onFocus={(e) => (e.target as HTMLElement).matches(":focus-visible") && setKeyboard(true)}
            onBlur={(e) => {
              if (e.currentTarget.contains(e.relatedTarget as Node | null)) return
              elapsed.current = 0
              setKeyboard(false)
            }}
            onKeyDown={(e) => {
              const keys: Record<string, number> = { ArrowDown: 1, ArrowUp: -1, Home: -Infinity, End: Infinity }
              if (!(e.key in keys)) return
              e.preventDefault()
              const btns = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>("[data-dmfa=row] > button"))
              const cur = btns.indexOf(document.activeElement as HTMLButtonElement)
              const d = keys[e.key]
              const next = d === -Infinity ? 0 : d === Infinity ? btns.length - 1 : (Math.max(0, cur) + d + btns.length) % btns.length
              btns[next]?.focus()
            }}
          >
            {/* Sliding grey panel, behind the rows */}
            <div
              ref={panelRef}
              data-dmfa="panel"
              aria-hidden
              className="pointer-events-none absolute top-0 right-0 left-0 z-0 rounded-[18px]"
              style={{ background: "color-mix(in oklab, var(--color-foreground) 6%, transparent)", height: 0 }}
            >
              <div
                ref={barRef}
                className="absolute -top-px left-2 h-[3px] rounded-full transition-[background-color] duration-300 motion-reduce:transition-none"
                style={{ width: "0%", background: "var(--dmfa-accent)" }}
              />
            </div>

            {features.map((f, i) => {
              const isActive = i === active
              const nextIsActive = i + 1 === active
              const descId = "dmfa-desc-" + f.id
              return (
                <div key={f.id} data-dmfa="row" ref={(el) => void (rowRefs.current[i] = el)} className="relative z-10">
                  <button
                    type="button"
                    aria-expanded={isActive}
                    aria-controls={descId}
                    onPointerEnter={(e) => e.pointerType === "mouse" && select(i)}
                    onClick={() => select(i)}
                    onFocus={() => select(i)}
                    className="block w-full cursor-pointer rounded-[18px] px-[18px] py-[19px] text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--dmfa-accent)]"
                  >
                    <span
                      className={
                        "block text-[15px] leading-[22px] transition-colors duration-300 motion-reduce:transition-none " +
                        (isActive ? "font-medium text-foreground" : "text-muted-foreground")
                      }
                    >
                      {f.title}
                    </span>
                    <span
                      id={descId}
                      className="grid transition-[grid-template-rows] duration-[360ms] ease-[cubic-bezier(.3,.7,.2,1)] motion-reduce:transition-none"
                      style={{ gridTemplateRows: isActive ? "1fr" : "0fr" }}
                    >
                      <span className="min-h-0 overflow-hidden">
                        <span
                          className="block pt-3 text-[14px] leading-[21px] text-muted-foreground transition-[opacity,filter] motion-reduce:transition-none"
                          style={{
                            opacity: isActive ? 1 : 0,
                            filter: isActive ? "blur(0px)" : "blur(4px)",
                            transitionDuration: isActive ? "320ms" : "180ms",
                            transitionDelay: isActive ? "90ms" : "0ms",
                          }}
                        >
                          {f.description}
                        </span>
                      </span>
                    </span>
                  </button>
                  {/* Hairline divider; hidden where the panel sits */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute right-[18px] bottom-0 left-[18px] h-px bg-border transition-opacity duration-300 motion-reduce:transition-none"
                    style={{ opacity: isActive || nextIsActive ? 0 : 0.7 }}
                  />
                </div>
              )
            })}
          </div>
        </div>

        {/* Right: colour card with dot matrix and the floating snippet */}
        <div
          ref={cardRef}
          data-dmfa="card"
          role="button"
          tabIndex={0}
          aria-label={"Show next feature (now: " + (features[active]?.title ?? "") + ")"}
          className="relative aspect-square w-full cursor-pointer overflow-hidden rounded-[18px] outline-none select-none max-md:order-2 focus-visible:ring-2 focus-visible:ring-[var(--dmfa-accent)] focus-visible:ring-offset-4 focus-visible:ring-offset-background"
          style={{
            backgroundColor: color,
            touchAction: "pan-y",
            transition: reduced
              ? "none"
              : "background-color " + COLOR_MS + "ms cubic-bezier(.45,0,.55,1), transform 520ms cubic-bezier(.2,.8,.2,1)",
          }}
          onPointerEnter={(e) => {
            if (e.pointerType === "mouse") setCardHover(true)
          }}
          onPointerMove={(e) => {
            const p = cardPoint(e)
            const fi = fieldInput.current
            fi.x = p.x
            fi.y = p.y
            if (e.pointerType === "mouse" || swipe.current) fi.inside = true
            if (e.pointerType === "mouse") setTilt(p.nx, p.ny)
          }}
          onPointerLeave={(e) => {
            fieldInput.current.inside = false
            setTilt(0, 0)
            if (e.pointerType === "mouse") {
              elapsed.current = 0
              setCardHover(false)
            }
          }}
          onPointerDown={(e) => {
            const p = cardPoint(e)
            swipe.current = { x: e.clientX, y: e.clientY, swiped: false }
            fieldInput.current = { ...fieldInput.current, x: p.x, y: p.y, inside: true }
          }}
          onPointerUp={(e) => {
            const s = swipe.current
            if (e.pointerType !== "mouse") fieldInput.current.inside = false
            if (!s) return
            const dx = e.clientX - s.x
            const dy = e.clientY - s.y
            if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(dy) * 1.2) {
              s.swiped = true
              step(dx < 0 ? 1 : -1, cardPoint(e))
            } else if (e.pointerType !== "mouse" && Math.hypot(dx, dy) < 10) {
              // Touch/pen tap: act on release, not on the (possibly delayed) click that follows.
              s.swiped = true
              step(1, cardPoint(e))
            }
          }}
          onPointerCancel={() => {
            swipe.current = null
            fieldInput.current.inside = false
          }}
          onClick={(e) => {
            const s = swipe.current
            swipe.current = null
            if (s?.swiped) return
            step(1, e.detail === 0 ? undefined : cardPoint(e))
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
              e.preventDefault()
              step(e.key === "ArrowRight" ? 1 : -1)
            } else if (e.key === " " || e.key === "Enter") {
              e.preventDefault()
              step(1)
            }
          }}
        >
          <DotField index={active} seedOffset={3} reduced={reduced} maskRef={snippetRef} maskKey={shown} inputRef={fieldInput} />
          <div
            ref={parallaxRef}
            className="pointer-events-none absolute inset-0 grid place-items-center px-[6%]"
            style={{ transition: reduced ? "none" : "transform 520ms cubic-bezier(.2,.8,.2,1)" }}
          >
            <div
              ref={snippetRef}
              data-dmfa="snippet"
              className="pointer-events-auto flex w-full justify-center transition-[opacity,filter,transform] motion-reduce:transition-none"
              style={{
                opacity: snippetIn ? 1 : 0,
                filter: snippetIn ? "blur(0px)" : "blur(8px)",
                transform: snippetIn ? "translateY(0px) scale(1)" : "translateY(4px) scale(0.985)",
                transitionDuration: (snippetIn ? SNIPPET_IN_MS : SNIPPET_OUT_MS) + "ms",
                transitionTimingFunction: "cubic-bezier(.2,.7,.2,1)",
              }}
            >
              <Fragment key={features[shown]?.id}>{features[shown]?.snippet}</Fragment>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
