"use client"

import * as React from "react"

// An endless wall of photos that drifts slowly on a diagonal. The wall sits
// muted and grey; a soft lens follows the pointer and shows the full-colour
// layer underneath. Drag to throw the wall in any direction; it never ends.
// A density switch re-deals it in larger or smaller tiles.

export type PanPhoto = {
  src: string
  alt?: string
  /** Shown in the lens over the tile. */
  caption?: string
}

export type InfinitePanGridProps = {
  photos: PanPhoto[]
  /** Wordmark, top left. */
  brand?: React.ReactNode
  /** Short line, top right. */
  note?: React.ReactNode
  /** Starting density. */
  density?: "loose" | "regular" | "dense"
  /** Lens radius in px. */
  lens?: number
  /** Idle drift speed in px/s. 0 holds the wall still. */
  drift?: number
  background?: string
  ink?: string
  /** Stage height. Keep it a definite length; percentages collapse once installed. */
  height?: string
  className?: string
}

// #region grid
/** Cell size in px for a density on a stage w px wide. */
export function cellFor(density: "loose" | "regular" | "dense", w: number): number {
  const phone = w < 640
  if (density === "loose") return phone ? 200 : 300
  if (density === "dense") return phone ? 104 : 150
  return phone ? 148 : 214
}

/** Pattern size in cells: wide and tall enough that two copies always cover a w × h stage. */
export function patternFor(w: number, h: number, cell: number): [number, number] {
  return [Math.max(2, Math.ceil(w / cell)), Math.max(2, Math.ceil(h / cell))]
}

/** Wraps an offset into (-span, 0], so a 2 × 2 tiling of the pattern always covers the stage. */
export function wrapOffset(o: number, span: number): number {
  if (span <= 0) return 0
  const m = ((o % span) + span) % span
  return m === 0 ? 0 : m - span
}

/** Photo index for cell (x, y) of a cols-wide pattern: a stride that keeps neighbours different. */
export function photoAt(x: number, y: number, cols: number, n: number): number {
  if (n <= 0) return 0
  return (((x * 7 + y * (cols * 7 + 3)) % n) + n) % n
}

/** Velocity left after dt seconds of friction. */
export function coast(v: number, dt: number): number {
  return v * Math.exp(-dt * 3.2)
}
// #endregion

const DENSITIES = ["loose", "regular", "dense"] as const

const CSS =
  ".ipg-root{position:relative;overflow:hidden;isolation:isolate;color:var(--ipg-ink);font-family:ui-sans-serif,system-ui,sans-serif;cursor:grab;touch-action:pan-y;user-select:none;-webkit-user-select:none;outline:none}" +
  ".ipg-root:active{cursor:grabbing}" +
  ".ipg-root:focus-visible{box-shadow:inset 0 0 0 2px var(--ipg-ink)}" +
  ".ipg-layer{position:absolute;left:0;top:0;will-change:transform;transition:opacity .35s ease}" +
  ".ipg-tile{position:absolute;padding:6px;box-sizing:border-box}" +
  ".ipg-tile>span{position:relative;display:block;width:100%;height:100%;border-radius:12px;overflow:hidden;background:#d8d4cd}" +
  ".ipg-tile img{position:absolute;inset:0;width:100%;height:100%;max-width:none;object-fit:cover;pointer-events:none}" +
  ".ipg-base .ipg-tile img{filter:grayscale(1) contrast(.82) brightness(1.12);opacity:.42}" +
  ".ipg-base .ipg-tile>span{background:color-mix(in srgb,var(--ipg-ink) 8%,var(--ipg-bg))}" +
  ".ipg-top{-webkit-mask-image:radial-gradient(circle var(--ipg-r,0px) at var(--ipg-mx,-999px) var(--ipg-my,-999px),#000 62%,transparent 100%);mask-image:radial-gradient(circle var(--ipg-r,0px) at var(--ipg-mx,-999px) var(--ipg-my,-999px),#000 62%,transparent 100%)}" +
  ".ipg-top .ipg-tile>span{box-shadow:0 18px 40px -20px rgba(0,0,0,.5)}" +
  ".ipg-top figcaption{position:absolute;left:10px;bottom:9px;right:10px;font-size:11px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#fff;text-shadow:0 1px 10px rgba(0,0,0,.6)}" +
  ".ipg-ring{position:absolute;left:0;top:0;border-radius:50%;pointer-events:none;border:1px solid color-mix(in srgb,var(--ipg-ink) 35%,transparent);transform:translate(-999px,-999px)}" +
  ".ipg-ring>b{position:absolute;left:50%;top:100%;margin-top:10px;transform:translateX(-50%);font-size:10px;font-weight:600;letter-spacing:.22em;text-transform:uppercase;white-space:nowrap;opacity:.6}" +
  ".ipg-edge{position:absolute;inset:0;pointer-events:none;background:radial-gradient(120% 90% at 50% 50%,transparent 55%,var(--ipg-bg) 100%)}" +
  ".ipg-top-bar{position:absolute;left:clamp(18px,3vw,40px);right:clamp(18px,3vw,40px);top:clamp(16px,3vw,32px);display:flex;justify-content:space-between;align-items:center;pointer-events:none;font-size:11px;letter-spacing:.22em;text-transform:uppercase}" +
  ".ipg-brand{display:flex;align-items:center;gap:10px;font-size:15px;font-weight:700;letter-spacing:-.01em;text-transform:none}" +
  ".ipg-brand i{width:22px;height:22px;border-radius:6px;background:conic-gradient(from 45deg,var(--ipg-ink) 0 25%,transparent 0 50%,var(--ipg-ink) 0 75%,transparent 0);border:1.5px solid var(--ipg-ink)}" +
  ".ipg-top-bar span{opacity:.6}" +
  ".ipg-dock{position:absolute;left:50%;bottom:clamp(18px,4vh,36px);transform:translateX(-50%);display:flex;align-items:center;gap:4px;padding:5px;border-radius:999px;cursor:default;" +
  "background:color-mix(in srgb,var(--ipg-bg) 72%,transparent);border:1px solid color-mix(in srgb,var(--ipg-ink) 14%,transparent);backdrop-filter:blur(16px) saturate(1.4);-webkit-backdrop-filter:blur(16px) saturate(1.4);" +
  "box-shadow:0 1px 0 rgba(255,255,255,.4) inset,0 20px 40px -20px rgba(0,0,0,.35)}" +
  ".ipg-dock>small{padding:0 10px 0 12px;font-size:10px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;opacity:.55}" +
  ".ipg-dock button{all:unset;cursor:pointer;position:relative;padding:9px 15px;border-radius:999px;font-size:12px;font-weight:600;text-transform:capitalize;transition:color .3s ease}" +
  ".ipg-dock button:focus-visible{outline:2px solid var(--ipg-ink);outline-offset:2px}" +
  ".ipg-dock button[aria-pressed=true]{color:var(--ipg-bg)}" +
  ".ipg-pill{position:absolute;top:5px;bottom:5px;left:0;border-radius:999px;background:var(--ipg-ink);transition:transform .55s cubic-bezier(.3,1.4,.4,1),width .55s cubic-bezier(.3,1.4,.4,1)}" +
  ".ipg-dock button>span{position:relative}" +
  "@media (hover:none){.ipg-ring{display:none}}" +
  "@media (prefers-reduced-motion:reduce){.ipg-layer,.ipg-pill,.ipg-dock button{transition:none}}"

export default function InfinitePanGrid({
  photos,
  brand = "Loupe",
  note = "Drag anywhere",
  density: initialDensity = "regular",
  lens = 170,
  drift = 14,
  background = "#f1efea",
  ink = "#121110",
  height = "100svh",
  className,
}: InfinitePanGridProps) {
  const n = photos.length
  const rootRef = React.useRef(null as HTMLDivElement | null)
  const baseRef = React.useRef(null as HTMLDivElement | null)
  const topRef = React.useRef(null as HTMLDivElement | null)
  const ringRef = React.useRef(null as HTMLDivElement | null)
  const [density, setDensity] = React.useState(initialDensity)
  const [size, setSize] = React.useState({ w: 0, h: 0 })
  const [shown, setShown] = React.useState(false)
  const btns = React.useRef([] as (HTMLButtonElement | null)[])
  const [pill, setPill] = React.useState({ x: 0, w: 0 })

  const cell = cellFor(density, size.w)
  const [cols, rows] = patternFor(size.w || 1, size.h || 1, cell)
  const spanX = cols * cell, spanY = rows * cell
  const geo = React.useRef({ spanX, spanY })
  geo.current = { spanX, spanY }

  // Pattern tiles, laid out 2 × 2 so the wrapped layers always cover the stage.
  const tiles = React.useMemo(() => {
    const out: { key: string; x: number; y: number; i: number }[] = []
    if (!size.w) return out
    for (let ty = 0; ty < 2; ty++)
      for (let tx = 0; tx < 2; tx++)
        for (let y = 0; y < rows; y++)
          for (let x = 0; x < cols; x++) out.push({ key: tx + "." + ty + "." + x + "." + y, x: tx * spanX + x * cell, y: ty * spanY + y * cell, i: photoAt(x, y, cols, n) })
    return out
  }, [size.w, rows, cols, cell, spanX, spanY, n])

  React.useEffect(() => {
    const root = rootRef.current
    if (!root || n === 0) return
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    let ox = 0, oy = 0, vx = 0, vy = 0
    let mx = -999, my = -999, r = 0, rTarget = 0
    let raf = 0, last = 0, visible = true
    let dragging = false, lx = 0, ly = 0, lt = 0
    // stage position in document coordinates, so the lens needs only scrollY while moving
    let docLeft = 0, docTop = 0
    const measure = () => {
      const b = root.getBoundingClientRect()
      docLeft = b.left + window.scrollX
      docTop = b.top + window.scrollY
    }

    const frame = (now: number) => {
      raf = 0
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60
      last = now
      const still = mq.matches
      if (!dragging) {
        ox += vx * dt
        oy += vy * dt
        vx = coast(vx, dt)
        vy = coast(vy, dt)
        if (!still) {
          ox -= drift * dt
          oy -= drift * 0.6 * dt
        }
      }
      r += (rTarget - r) * (1 - Math.exp(-dt * (still ? 60 : 10)))
      const { spanX: sx, spanY: sy } = geo.current
      const tx = wrapOffset(ox, sx), ty = wrapOffset(oy, sy)
      const t = "translate3d(" + tx.toFixed(2) + "px," + ty.toFixed(2) + "px,0)"
      if (baseRef.current) baseRef.current.style.transform = t
      if (topRef.current) {
        topRef.current.style.transform = t
        // the mask lives in the layer's own space, so undo its offset
        topRef.current.style.setProperty("--ipg-mx", (mx - tx).toFixed(1) + "px")
        topRef.current.style.setProperty("--ipg-my", (my - ty).toFixed(1) + "px")
        topRef.current.style.setProperty("--ipg-r", r.toFixed(1) + "px")
      }
      const ring = ringRef.current
      if (ring) {
        ring.style.transform = "translate(" + (mx - lens).toFixed(1) + "px," + (my - lens).toFixed(1) + "px) scale(" + (r / lens).toFixed(3) + ")"
        ring.style.opacity = (r / lens).toFixed(3)
      }
      const moving = (!still && drift > 0) || dragging || Math.abs(vx) + Math.abs(vy) > 0.5 || Math.abs(rTarget - r) > 0.3
      if (moving && visible) raf = requestAnimationFrame(frame)
      else last = 0
    }
    function kick() {
      if (!raf && visible) raf = requestAnimationFrame(frame)
    }

    const local = (e: PointerEvent) => {
      mx = e.clientX + window.scrollX - docLeft
      my = e.clientY + window.scrollY - docTop
    }
    const onEnter = (e: PointerEvent) => {
      measure()
      local(e)
      rTarget = e.pointerType === "mouse" ? lens : 0
      kick()
    }
    const onMove = (e: PointerEvent) => {
      local(e)
      if (dragging) {
        const dts = Math.max(1, e.timeStamp - lt) / 1000
        const dx = e.clientX - lx, dy = e.clientY - ly
        ox += dx
        oy += dy
        vx = vx * 0.4 + (dx / dts) * 0.6
        vy = vy * 0.4 + (dy / dts) * 0.6
        lx = e.clientX
        ly = e.clientY
        lt = e.timeStamp
      }
      kick()
    }
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0 || (e.target as Element).closest(".ipg-dock")) return
      measure()
      dragging = true
      lx = e.clientX
      ly = e.clientY
      lt = e.timeStamp
      vx = vy = 0
      root.setPointerCapture(e.pointerId)
      if (e.pointerType !== "mouse") rTarget = lens * 0.8
      local(e)
      kick()
    }
    const onUp = (e: PointerEvent) => {
      dragging = false
      if (e.pointerType !== "mouse") rTarget = 0
      if (mq.matches) vx = vy = 0
      kick()
    }
    const onLeave = () => {
      rTarget = 0
      kick()
    }
    const onKey = (e: KeyboardEvent) => {
      const step = 160
      if (e.key === "ArrowLeft") vx += step * 3
      else if (e.key === "ArrowRight") vx -= step * 3
      else if (e.key === "ArrowUp") vy += step * 3
      else if (e.key === "ArrowDown") vy -= step * 3
      else return
      e.preventDefault()
      kick()
    }
    const onMq = () => kick()

    root.addEventListener("pointerenter", onEnter)
    root.addEventListener("pointermove", onMove)
    root.addEventListener("pointerdown", onDown)
    root.addEventListener("pointerup", onUp)
    root.addEventListener("pointercancel", onUp)
    root.addEventListener("pointerleave", onLeave)
    root.addEventListener("keydown", onKey)
    mq.addEventListener("change", onMq)
    const ro = new ResizeObserver((entries) => {
      const b = entries[0].contentRect
      setSize({ w: Math.round(b.width), h: Math.round(b.height) })
      measure()
      kick()
    })
    ro.observe(root)
    const io = new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting
      if (visible) setShown(true)
      kick()
    })
    io.observe(root)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      root.removeEventListener("pointerenter", onEnter)
      root.removeEventListener("pointermove", onMove)
      root.removeEventListener("pointerdown", onDown)
      root.removeEventListener("pointerup", onUp)
      root.removeEventListener("pointercancel", onUp)
      root.removeEventListener("pointerleave", onLeave)
      root.removeEventListener("keydown", onKey)
      mq.removeEventListener("change", onMq)
    }
  }, [n, lens, drift])

  // Re-deal on a density change: fade the wall, swap the tiles, bring it back.
  const [dealing, setDealing] = React.useState(false)
  const choose = (d: (typeof DENSITIES)[number]) => {
    if (d === density) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduce) return setDensity(d)
    setDealing(true)
    window.setTimeout(() => {
      setDensity(d)
      window.requestAnimationFrame(() => setDealing(false))
    }, 260)
  }

  // The sliding pill under the chosen density, placed from the buttons' own layout once per change.
  React.useLayoutEffect(() => {
    const b = btns.current[DENSITIES.indexOf(density)]
    if (b) setPill({ x: b.offsetLeft, w: b.offsetWidth })
  }, [density, size.w])

  if (n === 0) return null
  const vars = { height, background, "--ipg-bg": background, "--ipg-ink": ink } as React.CSSProperties
  const layer = (top: boolean) => (
    <div ref={top ? topRef : baseRef} className={"ipg-layer " + (top ? "ipg-top" : "ipg-base")} style={{ width: spanX * 2, height: spanY * 2, opacity: shown && !dealing ? 1 : 0 }} aria-hidden={top ? true : undefined}>
      {tiles.map((t) => {
        const p = photos[t.i]
        return (
          <figure key={t.key} className="ipg-tile" style={{ left: t.x, top: t.y, width: cell, height: cell, margin: 0 }}>
            <span>
              <img src={p.src} alt={!top && t.key.startsWith("0.0.") ? p.alt ?? "" : ""} draggable={false} decoding="async" />
              {top && p.caption ? <figcaption>{p.caption}</figcaption> : null}
            </span>
          </figure>
        )
      })}
    </div>
  )

  return (
    <div ref={rootRef} className={"ipg-root" + (className ? " " + className : "")} style={vars} tabIndex={0} role="region" aria-label="Photo wall">
      <style>{CSS}</style>
      {layer(false)}
      {layer(true)}
      <div className="ipg-edge" aria-hidden="true" />
      <div ref={ringRef} className="ipg-ring" style={{ width: lens * 2, height: lens * 2 }} aria-hidden="true">
        <b>Drag</b>
      </div>
      <header className="ipg-top-bar">
        <span className="ipg-brand">
          <i aria-hidden="true" />
          {brand}
        </span>
        <span>{note}</span>
      </header>
      <div className="ipg-dock" role="group" aria-label="Grid density">
        <small>Density</small>
        <span className="ipg-pill" style={{ transform: "translateX(" + pill.x + "px)", width: pill.w }} aria-hidden="true" />
        {DENSITIES.map((d, i) => (
          <button
            key={d}
            type="button"
            ref={(el) => {
              btns.current[i] = el
            }}
            aria-pressed={d === density}
            onClick={() => choose(d)}
          >
            <span>{d}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
