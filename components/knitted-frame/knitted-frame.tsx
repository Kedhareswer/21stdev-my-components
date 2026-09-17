"use client"

import * as React from "react"

/**
 * Knitted Frame — wraps anything in a border of real knitting.
 *
 * Every stitch is drawn, not tiled: a stockinette V struck twice, once in
 * shadow and once in yarn, on a grid whose columns line up the way stitches
 * actually stack. Each one is nudged by a hash of its own position, so the
 * rows wander by a fraction of a millimetre like hand knitting does and never
 * like a repeating texture.
 *
 * Colour comes from a chart — the same idea as a knitting pattern — so
 * stripes, ribbing, seed, chevron, fair isle and argyle are all one function
 * of (column, row) rather than six different renderers.
 *
 * Self-contained: canvas 2D, React is the only import. No images, no CSS file,
 * nothing to load.
 */

export type KnitPattern =
  | "stripes"
  | "ribbing"
  | "seed"
  | "chevron"
  | "fairisle"
  | "argyle"
  | "plain"

export type KnittedFrameProps = {
  children?: React.ReactNode
  /** Border thickness, in stitches. */
  stitches?: number
  /** Size of one stitch in px. Smaller is finer yarn. */
  stitchSize?: number
  pattern?: KnitPattern
  /**
   * The colourway. The first is the ground; the rest are the contrast yarns.
   * Two is plenty for most charts — fair isle and argyle use three.
   */
  yarn?: string[]
  /** Which hand knitted it. Changes the wander, nothing else. */
  seed?: number
  /** Corner rounding, in stitches. */
  radius?: number
  /** Paint behind the children. Leave unset for transparent. */
  background?: string
  /** Knit itself on, row by row, when it first appears. */
  knitIn?: boolean
  className?: string
}

// #region knitting
/**
 * A stable 0..1 for one stitch. Deterministic on purpose: `Math.random()` here
 * would re-knit the whole border on every re-render, and the wander is the
 * thing that has to hold still.
 */
export const stitchNoise = (col: number, row: number, seed: number): number => {
  let h = (col + 1) * 374761393 + (row + 1) * 668265263 + seed * 2147483647
  h = (h ^ (h >>> 13)) * 1274126177
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

/**
 * A modulo that is always positive. JavaScript's `%` keeps the sign of the
 * left operand, so a negative row yields a negative index, `yarn[-1]` is
 * `undefined`, and canvas takes `undefined` as a stroke style without
 * complaint — it simply draws black.
 */
const mod = (a: number, n: number): number => ((a % n) + n) % n

/**
 * The chart: which yarn a stitch is knitted in.
 *
 * Returns an index into the colourway, always in range, so a two-colour yarn
 * list can be handed to a chart that wants three without reaching past the end
 * of the array and painting `undefined`.
 */
export const stitchColorIndex = (
  col: number,
  row: number,
  pattern: KnitPattern,
  colors: number,
): number => {
  if (colors <= 1) return 0
  const n = colors
  switch (pattern) {
    case "plain":
      return 0
    case "stripes":
      // Bands of three rows, which is about where a stripe stops reading as a
      // mistake and starts reading as a stripe.
      return mod(Math.floor(row / 3), n)
    case "ribbing":
      return mod(col, 2) === 0 ? 0 : 1 % n
    case "seed":
      // The classic moss stitch: alternate every stitch *and* every row, so no
      // two neighbours match in either direction.
      return mod(col + row, 2) === 0 ? 0 : 1 % n
    case "chevron": {
      // A triangle wave across the columns, which the row index then walks
      // along. Banding every two rows is what makes it a zigzag; alternating
      // every single row just reads as diagonal stripes.
      const period = 8
      const t = Math.abs(((col % period) + period) % period - period / 2)
      return mod(Math.floor((row + t) / 2), n)
    }
    case "fairisle": {
      // Bands of motif separated by plain ground, as a real fair isle yoke is.
      const band = ((row % 8) + 8) % 8
      if (band < 4) return 0
      if (band === 4 || band === 7) return 1 % n
      return ((col + (band === 5 ? 0 : 2)) % 4 === 0 ? 2 : 0) % n
    }
    case "argyle": {
      // Diamonds on the diagonal. The lattice line is the third yarn.
      const size = 10
      const u = (((col + row) % size) + size) % size
      const v = (((col - row) % size) + size) % size
      if (Math.abs(u - v) < 1) return 2 % n
      return u + v < size ? 0 : 1 % n
    }
    default:
      return 0
  }
}

/**
 * Is this cell part of the border?
 *
 * The corners are mitred by distance rather than by a square cut, so a rounded
 * frame loses its corner stitches the way a real one would rather than leaving
 * a step.
 */
export const inBorder = (
  col: number,
  row: number,
  cols: number,
  rows: number,
  band: number,
  radius: number,
): boolean => {
  if (cols <= 0 || rows <= 0) return false
  const outside = col < band || row < band || col >= cols - band || row >= rows - band
  if (!outside) return false
  if (radius <= 0) return true
  // Clip the four corners to a quarter circle of `radius` stitches.
  const cx = col < radius ? radius : col >= cols - radius ? cols - 1 - radius : col
  const cy = row < radius ? radius : row >= rows - radius ? rows - 1 - radius : row
  const dx = col - cx
  const dy = row - cy
  if (dx === 0 || dy === 0) return true
  return Math.hypot(dx, dy) <= radius + 0.5
}
// #endregion

const DEFAULT_YARN = ["#c8452f", "#f2e4cf", "#2e4a6b"]

/** Darken a hex colour toward black, for the shadow under each stitch. */
const shade = (hex: string, amount: number): string => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  // Anything that is not a plain 6-digit hex (a named colour, an rgb() string)
  // gets a translucent black instead of a wrong guess at its channels.
  if (!m) return "rgba(0,0,0,0.35)"
  const v = parseInt(m[1], 16)
  const r = Math.round(((v >> 16) & 255) * (1 - amount))
  const g = Math.round(((v >> 8) & 255) * (1 - amount))
  const b = Math.round((v & 255) * (1 - amount))
  return "rgb(" + r + "," + g + "," + b + ")"
}

export default function KnittedFrame({
  children,
  stitches = 4,
  stitchSize = 15,
  pattern = "chevron",
  yarn = DEFAULT_YARN,
  seed = 1,
  radius = 2,
  background,
  knitIn = true,
  className = "",
}: KnittedFrameProps) {
  const hostRef = React.useRef<HTMLDivElement | null>(null)
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
  const [reduced, setReduced] = React.useState(false)

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => setReduced(mq.matches)
    sync()
    mq.addEventListener("change", sync)
    return () => mq.removeEventListener("change", sync)
  }, [])

  const look = React.useRef({ stitches, stitchSize, pattern, yarn, seed, radius, knitIn, reduced })
  look.current = { stitches, stitchSize, pattern, yarn, seed, radius, knitIn, reduced }

  React.useEffect(() => {
    const host = hostRef.current
    const canvas = canvasRef.current
    if (!host || !canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let raf = 0
    let disposed = false
    let startedAt = 0

    const draw = (progress: number) => {
      const L = look.current
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = host.clientWidth
      const h = host.clientHeight
      if (w === 0 || h === 0) return

      const pw = Math.round(w * dpr)
      const ph = Math.round(h * dpr)
      if (canvas.width !== pw || canvas.height !== ph) {
        canvas.width = pw
        canvas.height = ph
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)

      const s = Math.max(L.stitchSize, 4)
      const cols = Math.ceil(w / s)
      const rows = Math.ceil(h / s)
      // The grid rarely divides the box exactly, so the whole thing is centred
      // on the leftover — otherwise every frame is a half stitch short on two
      // sides and it reads as a misprint.
      const offX = (w - cols * s) / 2
      const offY = (h - rows * s) / 2

      const band = Math.max(1, Math.round(L.stitches))
      const colors = L.yarn.length

      ctx.lineCap = "round"
      ctx.lineJoin = "round"

      for (let row = 0; row < rows; row++) {
        // Knitting happens one row at a time, from the bottom up, so that is
        // how it arrives.
        if (progress < 1) {
          const rowAt = 1 - row / Math.max(rows - 1, 1)
          if (rowAt > progress) continue
        }
        for (let col = 0; col < cols; col++) {
          if (!inBorder(col, row, cols, rows, band, L.radius)) continue

          const idx = stitchColorIndex(col, row, L.pattern, colors)
          const color = L.yarn[Math.min(idx, colors - 1)] ?? DEFAULT_YARN[0]

          const n = stitchNoise(col, row, L.seed)
          const n2 = stitchNoise(col + 91, row + 17, L.seed)
          // A fraction of a stitch of wander. Any more and it stops looking
          // hand-made and starts looking broken.
          const jx = (n - 0.5) * s * 0.12
          const jy = (n2 - 0.5) * s * 0.12
          const x = offX + col * s + jx
          const y = offY + row * s + jy

          // The shadow, struck low so the stitch above appears to sit on it.
          ctx.strokeStyle = shade(color, 0.42)
          ctx.lineWidth = s * 0.62
          ctx.beginPath()
          ctx.moveTo(x + s * 0.06, y + s * 0.2)
          ctx.quadraticCurveTo(x + s * 0.5, y + s * 0.98, x + s * 0.94, y + s * 0.2)
          ctx.stroke()

          // The yarn itself.
          ctx.strokeStyle = color
          ctx.lineWidth = s * 0.48
          ctx.beginPath()
          ctx.moveTo(x + s * 0.06, y + s * 0.1)
          ctx.quadraticCurveTo(x + s * 0.5, y + s * 0.86, x + s * 0.94, y + s * 0.1)
          ctx.stroke()

          // A highlight along the top of the loop, which is what makes wool
          // look round instead of like a painted line.
          ctx.strokeStyle = "rgba(255,255,255," + (0.13 + 0.07 * n) + ")"
          ctx.lineWidth = s * 0.14
          ctx.beginPath()
          ctx.moveTo(x + s * 0.14, y + s * 0.14)
          ctx.quadraticCurveTo(x + s * 0.5, y + s * 0.74, x + s * 0.86, y + s * 0.14)
          ctx.stroke()
        }
      }
    }

    const frame = () => {
      if (disposed) return
      const L = look.current
      const span = 900
      const t = L.knitIn && !L.reduced ? Math.min((performance.now() - startedAt) / span, 1) : 1
      draw(t)
      if (t < 1) raf = requestAnimationFrame(frame)
    }

    const restart = () => {
      cancelAnimationFrame(raf)
      startedAt = performance.now()
      raf = requestAnimationFrame(frame)
    }

    // A resize re-knits at full progress rather than replaying the animation,
    // which would make every window drag look like a glitch.
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(raf)
      draw(1)
    })
    observer.observe(host)

    restart()

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      observer.disconnect()
    }
  }, [stitches, stitchSize, pattern, yarn, seed, radius, knitIn, reduced])

  const pad = Math.max(1, Math.round(stitches)) * Math.max(stitchSize, 4)

  return (
    <div ref={hostRef} className={"relative " + className}>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full"
      />
      {/* The padding is what the border is knitted into, so it has to stay
          transparent. Putting the panel on this box instead paints straight
          over the canvas and hides every stitch but the corners. */}
      <div className="relative" style={{ padding: pad }}>
        <div
          style={{
            background,
            borderRadius: background ? Math.round(radius * stitchSize) : undefined,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
