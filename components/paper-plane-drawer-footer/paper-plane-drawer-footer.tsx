import { useEffect, useId, useRef, type CSSProperties } from "react"

// #region motion
// Pure timing and flight maths, measured off the reference at 60 fps. The test lifts this region.

/** Pulling the drawer out takes this long; pushing it back in is quicker. */
export const OPEN_MS = 630
export const CLOSE_MS = 370
/** A new plane leaves this long after the drawer starts to open, and glides for FLIGHT_MS. */
export const LAUNCH_MS = 450
export const FLIGHT_MS = 1200
/** The front lifts this many px as it unseats (and overshoots by the same as it seats again). */
export const LIFT_PX = 5

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
/** Where p sits between a and b, 0..1. */
export const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a))
export const easeOut = (t: number) => 1 - (1 - t) ** 3
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

/**
 * The drawer at progress p (0 shut, 1 out). The same curve runs backwards to close, so the
 * close ends with the same small lift-and-seat the open starts with.
 * - reveal: how much of the interior box shows above the front (0..1, grows upward)
 * - rise:   the pile of stationery coming up from behind the front (0..1)
 * - front:  px the front sits below its resting place (negative = lifted)
 * - pull:   the handle turning from a dark recess into the cream pull (0..1)
 */
export function drawerAt(p: number, shift: number) {
  return {
    reveal: easeInOut(seg(p, 0.2, 0.45)),
    rise: easeOut(seg(p, 0.38, 1)),
    front: -LIFT_PX * Math.sin(Math.PI * seg(p, 0, 0.24)) + shift * easeOut(seg(p, 0.2, 1)),
    pull: seg(p, 0.25, 0.6),
  }
}

export type Flight = {
  /** start, bend and landing, as fractions of the drawer box (x of width, y of height) */
  from: [number, number]
  bend: [number, number]
  land: [number, number]
  /** heading once it has settled, degrees (0 = nose to the right) */
  rest: number
}

/** One new plane per opening, landing in these spots in turn; the first two are the reference's. */
export const FLIGHTS: Flight[] = [
  { from: [0.1, -0.55], bend: [0.38, 0.02], land: [0.63, 0.44], rest: -7 },
  { from: [-0.22, 0.46], bend: [0.18, 0.64], land: [0.45, 0.84], rest: 3 },
  { from: [-0.24, 0.02], bend: [0.04, 0.34], land: [0.2, 0.6], rest: -15 },
  { from: [0.34, -0.6], bend: [0.7, 0.16], land: [0.85, 0.72], rest: 11 },
  { from: [-0.2, -0.3], bend: [0.12, 0.12], land: [0.32, 0.36], rest: -21 },
]

/**
 * Pose of a plane t (0..1) through its flight, in px for a box of w by h.
 * Heading follows the path and settles onto `rest`; altitude falls to 0, and the shadow,
 * thrown far below the plane while it is high, slides in under it as it lands.
 */
export function poseAt(f: Flight, t: number, w: number, h: number) {
  t = clamp01(t)
  const s = 1 - (1 - t) ** 2
  const u = 1 - s
  const bx = u * u * f.from[0] + 2 * u * s * f.bend[0] + s * s * f.land[0]
  const by = u * u * f.from[1] + 2 * u * s * f.bend[1] + s * s * f.land[1]
  const dx = 2 * u * (f.bend[0] - f.from[0]) + 2 * s * (f.land[0] - f.bend[0])
  const dy = 2 * u * (f.bend[1] - f.from[1]) + 2 * s * (f.land[1] - f.bend[1])
  // a glider keeps its nose near level: it leans into the path, it does not point down it
  const heading = Math.max(-26, Math.min(26, ((Math.atan2(dy * h, dx * w) * 180) / Math.PI) * 0.55))
  const settle = seg(t, 0.7, 1) ** 2 * (3 - 2 * seg(t, 0.7, 1))
  const alt = (1 - t) ** 1.4
  const x = bx * w
  const y = by * h + Math.sin(t * Math.PI * 3) * (1 - t) * 0.012 * h
  return {
    x,
    y,
    rot: heading * (1 - settle) + f.rest * settle,
    alt,
    /** plane drawn at most at 1, a touch larger while high (never scaled up past its laid-out size) */
    scale: (1 + 0.14 * alt) / 1.14,
    sx: x - alt * 0.06 * w - 0.012 * w,
    sy: y + alt * 0.42 * h + 0.045 * h,
    shadow: (0.24 + 0.26 * (1 - alt)) * seg(t, 0, 0.15),
  }
}
// #endregion

/* ------------------------------------------------------------- content */

export type FooterLink = { label: string; href: string; external?: boolean }
export type FooterColumn = { title: string; links: FooterLink[] }

export type PaperPlaneDrawerFooterProps = {
  /** The name pressed into the bottom of the footer. */
  brand?: string
  /** The red line over the tagline. */
  copyright?: string
  /** Two short lines under it; "\n" breaks the line. */
  tagline?: string
  columns?: FooterColumn[]
  /** Picture of the drawer's contents, wide, back wall in the top third. */
  drawerImage?: string
  /** Start with the drawer out (and the first plane on its way). */
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** Minimum height of the whole footer. A definite length. */
  height?: string
  /** Height of the desk strip the drawer comes out of. A definite length. */
  drawerHeight?: string
  className?: string
  style?: CSSProperties
}

const IMG_BASE = "https://kedhar-components.pages.dev/paper-plane-drawer-footer/"

const DEFAULT_COLUMNS: FooterColumn[] = [
  {
    title: "Product",
    links: [
      { label: "Overview", href: "#" },
      { label: "Pricing", href: "#" },
      { label: "Changelog", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
    ],
  },
]

/* ------------------------------------------------------------- drawings */

// Topographic contour lines for the desk top: a few ring families, deterministic.
function contours() {
  const out: string[] = []
  const peaks = [
    [180, 120, 0.4],
    [640, 300, 1.7],
    [1060, 90, 2.9],
  ]
  for (const [cx, cy, ph] of peaks) {
    for (let k = 0; k < 9; k++) {
      const r0 = 26 + k * 30
      let d = ""
      const n = 48
      for (let i = 0; i <= n; i++) {
        const a = (i / n) * Math.PI * 2
        const r = r0 * (1 + 0.16 * Math.sin(3 * a + ph + k * 0.21) + 0.07 * Math.sin(5 * a - ph * 2 + k * 0.4))
        const x = cx + Math.cos(a) * r * 1.35
        const y = cy + Math.sin(a) * r * 0.8
        d += (i ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1)
      }
      out.push(d + "Z")
    }
  }
  return out
}
const CONTOURS = contours()

/** Paper dart seen from above, nose to the right. viewBox 0 0 200 100. */
const PLANE_TOP = "M0 4L200 50L58 55Z"
const PLANE_LOW = "M24 96L200 50L50 80Z"
const PLANE_KEEL = "M58 55L200 50L50 80Z"
const PLANE_ALL = "M0 4L200 50L24 96L50 80L58 55Z"

/** The brand mark: a folded dart, pressed in like the name. viewBox 0 0 120 100. */
const MARK = "M4 58L116 8L58 92L50 64Z"

/* ------------------------------------------------------------- styles */

const CSS =
  ".ppd-root{--ppd-face:color-mix(in oklab,var(--color-background) 84%,#a8957b);--ppd-desk:color-mix(in oklab,var(--color-background) 93%,#c9b99d);--ppd-hi:color-mix(in oklab,var(--ppd-face) 55%,white);--ppd-lo:color-mix(in oklab,var(--ppd-face) 72%,black);--ppd-ink:var(--color-foreground);--ppd-muted:var(--color-muted-foreground);--ppd-accent:color-mix(in oklab,#b4462f 82%,var(--color-foreground));--ppd-gutter:24px;position:relative;isolation:isolate;overflow:hidden;width:100%;display:flex;flex-direction:column;background:var(--ppd-face);color:var(--ppd-ink)}" +
  ".ppd-root *{box-sizing:border-box}" +
  ".ppd-root img,.ppd-root svg{max-width:none}" +
  ".ppd-desk{position:relative;flex:none;background:var(--ppd-desk)}" +
  ".ppd-box{position:absolute;left:0;right:0;top:0;height:calc(100% + 64px);overflow:hidden;background:linear-gradient(#6a4d37,#86654a 40%,#9a7657);z-index:1}" +
  ".ppd-floor{position:absolute;inset:0}" +
  ".ppd-floor>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 22%;max-width:none;-webkit-mask-image:linear-gradient(transparent,#000 22%);mask-image:linear-gradient(transparent,#000 22%);user-select:none;pointer-events:none}" +
  ".ppd-wall{position:absolute;top:0;bottom:0;width:7%;pointer-events:none}" +
  ".ppd-shade{position:absolute;inset:0;pointer-events:none;background:linear-gradient(rgba(30,18,8,.5),rgba(30,18,8,0) 22%),linear-gradient(0deg,rgba(30,18,8,.28),rgba(30,18,8,0) 64px)}" +
  ".ppd-plane,.ppd-shadow{position:absolute;left:0;top:0;pointer-events:none;transform-origin:50% 50%;opacity:0}" +
  ".ppd-shadow{filter:blur(3px)}" +
  ".ppd-front{position:relative;z-index:2;flex:1;display:flex;flex-direction:column;background:var(--ppd-face);padding-bottom:clamp(20px,3.2vw,48px)}" +
  ".ppd-lip{position:absolute;left:0;right:0;top:-1px;height:3px;background:linear-gradient(90deg,transparent,var(--ppd-lo) 12%,var(--ppd-lo) 88%,transparent);box-shadow:0 1px 0 var(--ppd-hi)}" +
  ".ppd-handle{position:relative;display:block;margin:clamp(14px,2.1vw,26px) auto 0;width:clamp(96px,13vw,220px);height:clamp(26px,3.1vw,52px);border:0;padding:0;border-radius:999px;background:none;cursor:pointer;-webkit-tap-highlight-color:transparent}" +
  ".ppd-handle:focus-visible{outline:2px solid var(--ppd-ink);outline-offset:4px}" +
  ".ppd-skin{position:absolute;inset:0;border-radius:inherit}" +
  ".ppd-recess{background:linear-gradient(90deg,#4f4236,#7d6b58 50%,#4f4236);box-shadow:inset 0 3px 6px rgba(0,0,0,.45),0 1px 0 var(--ppd-hi)}" +
  ".ppd-pull{background:linear-gradient(#f5e9d3,#e8d6b6);box-shadow:inset 0 -2px 0 rgba(120,90,55,.35),0 4px 8px -2px rgba(60,40,20,.35);display:flex;align-items:center;justify-content:flex-end;padding-right:9%}" +
  ".ppd-pull svg{width:18%;height:auto;opacity:.5}" +
  ".ppd-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:24px;row-gap:36px;padding:0 var(--ppd-gutter);margin-top:clamp(32px,4.4vw,72px)}" +
  ".ppd-brand{grid-column:1/-1}" +
  "@media (min-width:768px){.ppd-root{--ppd-gutter:clamp(20px,14vw,260px)}.ppd-grid{grid-template-columns:1.8fr 1fr 1fr .8fr}.ppd-brand{grid-column:auto}}" +
  ".ppd-copy{margin:0;font-size:11px;line-height:16px;letter-spacing:.08em;text-transform:uppercase;font-weight:600;color:var(--ppd-accent)}" +
  ".ppd-tag{margin:14px 0 0;font-size:13px;line-height:18px;color:var(--ppd-muted);white-space:pre-line}" +
  ".ppd-col h3{margin:0;font-size:14px;line-height:20px;font-weight:500;color:var(--ppd-ink)}" +
  ".ppd-col ul{list-style:none;margin:10px 0 0;padding:0;display:grid;gap:4px}" +
  ".ppd-col a{display:inline-block;font-size:13px;line-height:20px;color:var(--ppd-muted);text-decoration:none;transition:color .2s}" +
  ".ppd-col a:hover{color:var(--ppd-ink)}" +
  ".ppd-col a:focus-visible{outline:2px solid var(--ppd-ink);outline-offset:2px;border-radius:2px}" +
  ".ppd-word{display:block;width:100%;height:auto;margin-top:auto;padding:clamp(40px,6vw,96px) var(--ppd-gutter) 0}" +
  "@media (prefers-reduced-motion:reduce){.ppd-col a{transition:none}}"

/* ------------------------------------------------------------- component */

type PlaneState = { state: "hidden" | "flying" | "landed"; t0: number }

export default function PaperPlaneDrawerFooter({
  brand = "Northfold",
  copyright = "© 2026 Northfold",
  tagline = "Keeping every\nloose page in order.",
  columns = DEFAULT_COLUMNS,
  drawerImage = IMG_BASE + "drawer.webp",
  defaultOpen = false,
  onOpenChange,
  height = "100svh",
  drawerHeight = "clamp(200px, min(30vw, 42svh), 520px)",
  className = "",
  style,
}: PaperPlaneDrawerFooterProps) {
  const rootRef = useRef<HTMLElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const floorRef = useRef<HTMLDivElement>(null)
  const frontRef = useRef<HTMLDivElement>(null)
  const handleRef = useRef<HTMLButtonElement>(null)
  const pullRef = useRef<HTMLSpanElement>(null)
  const wordRef = useRef<SVGSVGElement>(null)
  const planeRefs = useRef<(HTMLDivElement | null)[]>([])
  const shadowRefs = useRef<(HTMLDivElement | null)[]>([])
  const api = useRef<{ setHover: (v: boolean) => void; togglePin: () => void } | null>(null)
  const fid = "ppd-press-" + useId().replace(/[^a-zA-Z0-9_-]/g, "")
  const onChange = useRef(onOpenChange)
  onChange.current = onOpenChange

  useEffect(() => {
    const root = rootRef.current!
    const box = boxRef.current!
    const floor = floorRef.current!
    const front = frontRef.current!
    const handle = handleRef.current!
    const pull = pullRef.current!
    const word = wordRef.current!
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)")

    let w = 0
    let h = 0
    let shift = 0
    let planeW = 0
    let p = defaultOpen ? 1 : 0
    let target = defaultOpen ? 1 : 0
    let hover = false
    let pinned = defaultOpen
    let suppress = false
    let launches = 0
    let launchAt = defaultOpen ? performance.now() + LAUNCH_MS - OPEN_MS : -1
    let raf = 0
    let last = 0
    let closeTimer = 0
    const planes: PlaneState[] = FLIGHTS.map(() => ({ state: "hidden", t0: 0 }))

    const measure = () => {
      w = box.clientWidth
      h = root.querySelector<HTMLElement>(".ppd-desk")!.clientHeight
      shift = Math.round(Math.min(48, Math.max(20, w * 0.03)))
      planeW = Math.round(Math.min(260, Math.max(96, w * 0.19)) * 1.14)
      for (const el of [...planeRefs.current, ...shadowRefs.current]) {
        if (!el) continue
        el.style.width = planeW + "px"
        el.style.height = planeW / 2 + "px"
      }
    }

    const paint = (now: number) => {
      const d = drawerAt(p, shift)
      box.style.clipPath = "inset(" + ((1 - d.reveal) * 100).toFixed(3) + "% 0 0 0)"
      floor.style.transform = "translate3d(0," + ((1 - d.rise) * 55).toFixed(3) + "%,0)"
      front.style.transform = "translate3d(0," + d.front.toFixed(2) + "px,0)"
      pull.style.opacity = d.pull.toFixed(3)
      // the front tips toward you as it comes out: its top travels, its foot (the pressed name) barely moves
      word.style.transform = "translate3d(0," + (-0.85 * Math.max(0, d.front)).toFixed(2) + "px,0)"
      planes.forEach((pl, i) => {
        const el = planeRefs.current[i]
        const sh = shadowRefs.current[i]
        if (!el || !sh) return
        if (pl.state === "hidden") {
          el.style.opacity = "0"
          sh.style.opacity = "0"
          return
        }
        const t = pl.state === "landed" ? 1 : (now - pl.t0) / FLIGHT_MS
        if (t >= 1) pl.state = "landed"
        const q = poseAt(FLIGHTS[i], t, w, h)
        const half = planeW / 2
        el.style.opacity = "1"
        el.style.transform =
          "translate3d(" + (q.x - half).toFixed(1) + "px," + (q.y - half / 2).toFixed(1) + "px,0) rotate(" + q.rot.toFixed(2) + "deg) scale(" + q.scale.toFixed(4) + ")"
        sh.style.opacity = q.shadow.toFixed(3)
        sh.style.transform =
          "translate3d(" + (q.sx - half).toFixed(1) + "px," + (q.sy - half / 2).toFixed(1) + "px,0) rotate(" + q.rot.toFixed(2) + "deg) scale(" + (q.scale * 0.98).toFixed(4) + ")"
      })
    }

    const launch = (now: number) => {
      const i = launches % FLIGHTS.length
      // a plane already resting in this spot stays put; it is only recycled while the drawer is shut
      if (planes[i].state !== "hidden") return
      launches++
      planes[i] = reduce.matches ? { state: "landed", t0: now } : { state: "flying", t0: now }
    }

    const shut = () => {
      // drawer fully in: finish any flight out of sight, and free the next spot once every spot is used
      for (const pl of planes) if (pl.state === "flying") pl.state = "landed"
      const next = launches % FLIGHTS.length
      if (launches >= FLIGHTS.length) planes[next] = { state: "hidden", t0: 0 }
    }

    const tick = (now: number) => {
      const dt = last ? Math.min(64, now - last) : 16
      last = now
      if (reduce.matches) p = target
      else if (p < target) p = Math.min(target, p + dt / OPEN_MS)
      else if (p > target) p = Math.max(target, p - dt / CLOSE_MS)
      if (launchAt >= 0 && now >= launchAt) {
        launchAt = -1
        if (target === 1) launch(now)
      }
      if (p === 0 && target === 0) shut()
      paint(now)
      const busy = p !== target || launchAt >= 0 || planes.some((pl) => pl.state === "flying")
      raf = busy ? requestAnimationFrame(tick) : 0
      if (!busy) last = 0
    }
    const wake = () => {
      if (!raf) raf = requestAnimationFrame(tick)
    }

    const setTarget = (open: boolean) => {
      const next = open ? 1 : 0
      if (next === target) return
      target = next
      handle.setAttribute("aria-expanded", String(open))
      handle.setAttribute("aria-label", open ? "Close the drawer" : "Open the drawer")
      if (open) launchAt = performance.now() + (reduce.matches ? 0 : LAUNCH_MS)
      else launchAt = -1
      onChange.current?.(open)
      wake()
    }
    const sync = () => {
      window.clearTimeout(closeTimer)
      if (hover || pinned) setTarget(true)
      else closeTimer = window.setTimeout(() => setTarget(false), 120)
    }
    api.current = {
      setHover: (v) => {
        // after a click pushed it in, the cursor has to leave the zone before it can pull it out again
        if (!v) suppress = false
        if (suppress || v === hover) return
        hover = v
        sync()
      },
      togglePin: () => {
        const open = target === 1
        pinned = !open
        if (open) {
          hover = false
          suppress = true
          // a deliberate click or key press closes at once; only the hover exit waits
          window.clearTimeout(closeTimer)
          setTarget(false)
          return
        }
        sync()
      },
    }

    // The drawer comes out as the cursor nears it: anywhere over the desk strip, the handle, or
    // just under the handle. Dropping to the link rows pushes it back in.
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return
      const hb = handle.getBoundingClientRect()
      const rb = root.getBoundingClientRect()
      api.current!.setHover(e.clientY >= rb.top && e.clientY <= hb.bottom + 28)
    }
    const onLeave = () => api.current!.setHover(false)

    measure()
    paint(performance.now())
    if (defaultOpen) wake()
    const ro = new ResizeObserver(() => {
      measure()
      paint(performance.now())
    })
    ro.observe(root)
    root.addEventListener("pointermove", onMove)
    root.addEventListener("pointerleave", onLeave)
    return () => {
      ro.disconnect()
      root.removeEventListener("pointermove", onMove)
      root.removeEventListener("pointerleave", onLeave)
      cancelAnimationFrame(raf)
      window.clearTimeout(closeTimer)
      api.current = null
    }
    // the drawer runs on its own once mounted; defaultOpen is read once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <footer
      ref={rootRef}
      className={"ppd-root font-sans " + className}
      style={{ minHeight: height, ...style }}
    >
      <style>{CSS}</style>

      {/* the desk strip, and the drawer box that comes out of it */}
      <div className="ppd-desk" style={{ height: drawerHeight }}>
        <svg
          aria-hidden="true"
          className="absolute inset-0"
          width="100%"
          height="100%"
          viewBox="0 0 1200 400"
          preserveAspectRatio="xMidYMid slice"
        >
          <g fill="none" stroke="currentColor" strokeWidth="1" opacity="0.08" vectorEffect="non-scaling-stroke">
            {CONTOURS.map((d, i) => (
              <path key={i} d={d} vectorEffect="non-scaling-stroke" />
            ))}
          </g>
        </svg>
        <div ref={boxRef} className="ppd-box" style={{ clipPath: "inset(100% 0 0 0)" }} aria-hidden="true">
          <div ref={floorRef} className="ppd-floor" style={{ transform: "translate3d(0,55%,0)" }}>
            <img src={drawerImage} alt="" width={1942} height={809} draggable={false} decoding="async" />
            {FLIGHTS.map((_, i) => (
              <div key={"s" + i} ref={(el) => void (shadowRefs.current[i] = el)} className="ppd-shadow">
                <svg viewBox="0 0 200 100" width="100%" height="100%">
                  <path d={PLANE_ALL} fill="#2a1a0c" />
                </svg>
              </div>
            ))}
            {FLIGHTS.map((_, i) => (
              <div key={"p" + i} ref={(el) => void (planeRefs.current[i] = el)} className="ppd-plane">
                <svg viewBox="0 0 200 100" width="100%" height="100%">
                  <path d={PLANE_LOW} fill="#e6d4b4" />
                  <path d={PLANE_KEEL} fill="#cbb38c" />
                  <path d={PLANE_TOP} fill="#f7ecd9" />
                  <path d="M58 55L200 50" stroke="#b79d76" strokeWidth="1.2" />
                  <path d="M0 4L200 50L24 96" fill="none" stroke="rgba(120,90,55,.35)" strokeWidth="1" strokeLinejoin="round" />
                </svg>
              </div>
            ))}
          </div>
          <div className="ppd-wall" style={{ left: 0, background: "linear-gradient(90deg,rgba(40,24,12,.4),rgba(40,24,12,0))" }} />
          <div className="ppd-wall" style={{ right: 0, background: "linear-gradient(270deg,rgba(40,24,12,.4),rgba(40,24,12,0))" }} />
          <div className="ppd-shade" />
        </div>
      </div>

      {/* the drawer front: the footer itself */}
      <div ref={frontRef} className="ppd-front">
        <span className="ppd-lip" aria-hidden="true" />
        <button
          ref={handleRef}
          type="button"
          className="ppd-handle"
          aria-expanded={defaultOpen}
          aria-label={defaultOpen ? "Close the drawer" : "Open the drawer"}
          onClick={() => api.current?.togglePin()}
        >
          <span className="ppd-skin ppd-recess" />
          <span ref={pullRef} className="ppd-skin ppd-pull" style={{ opacity: defaultOpen ? 1 : 0 }}>
            <svg viewBox="0 0 120 100" aria-hidden="true">
              <path d={MARK} fill="#8a7253" />
              <path d="M50 64L116 8" stroke="#f3e6cf" strokeWidth="5" />
            </svg>
          </span>
        </button>

        <div className="ppd-grid">
          <div className="ppd-brand">
            <p className="ppd-copy">{copyright}</p>
            <p className="ppd-tag">{tagline}</p>
          </div>
          {columns.map((col) => (
            <nav key={col.title} className="ppd-col" aria-label={col.title}>
              <h3>{col.title}</h3>
              <ul>
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      {...(l.external ? { target: "_blank", rel: "noreferrer" } : {})}
                    >
                      {l.label}
                      {l.external ? " ↗" : ""}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* the name, pressed into the paper: shadow inside the top edges, light inside the bottom ones, a lit lip below */}
        <svg ref={wordRef} className="ppd-word" viewBox="0 0 1000 200" role="img" aria-label={brand}>
          <defs>
            <filter id={fid} x="-2%" y="-10%" width="104%" height="125%" colorInterpolationFilters="sRGB">
              <feOffset in="SourceAlpha" dy="4" result="dn" />
              <feGaussianBlur in="dn" stdDeviation="2.4" result="dnb" />
              <feComposite in="SourceAlpha" in2="dnb" operator="out" result="top" />
              <feFlood style={{ floodColor: "var(--ppd-lo)" }} floodOpacity="0.85" />
              <feComposite in2="top" operator="in" result="dark" />
              <feOffset in="SourceAlpha" dy="-3" result="up" />
              <feGaussianBlur in="up" stdDeviation="1.6" result="upb" />
              <feComposite in="SourceAlpha" in2="upb" operator="out" result="bot" />
              <feFlood style={{ floodColor: "var(--ppd-hi)" }} floodOpacity="0.9" />
              <feComposite in2="bot" operator="in" result="light" />
              <feOffset in="SourceAlpha" dy="1.6" result="lp" />
              <feComposite in="lp" in2="SourceAlpha" operator="out" result="lipa" />
              <feFlood style={{ floodColor: "var(--ppd-hi)" }} floodOpacity="0.85" />
              <feComposite in2="lipa" operator="in" result="lip" />
              <feMerge>
                <feMergeNode in="lip" />
                <feMergeNode in="SourceGraphic" />
                <feMergeNode in="dark" />
                <feMergeNode in="light" />
              </feMerge>
            </filter>
          </defs>
          <g className="ppd-press" filter={"url(#" + fid + ")"} style={{ fill: "color-mix(in oklab, var(--ppd-face) 95%, black)" }}>
            <path d={MARK} transform="translate(-6.2 22) scale(1.55)" />
            <text x="215" y="172" fontSize="196" textLength="785" lengthAdjust="spacingAndGlyphs" fontFamily="ui-serif, Georgia, 'Times New Roman', serif">
              {brand}
            </text>
          </g>
        </svg>
      </div>
    </footer>
  )
}
