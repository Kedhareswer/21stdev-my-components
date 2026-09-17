"use client"

import * as React from "react"

/**
 * Knitted Frame — wraps anything in a border of real knitting.
 *
 * The depth is not faked with an offset dark copy. Each run of stitches is one
 * continuous scalloped path; that path is stroked five times into a **height
 * field**, from wide and low to narrow and high, and the finished frame is lit
 * by the surface normals taken from that height. That is the whole difference
 * between wool that looks round and a sticker of wool.
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
  /** Height of one stitch in px. Smaller is finer yarn. */
  stitchSize?: number
  pattern?: KnitPattern
  /**
   * The colourway, explicitly. The first is the ground; the rest are the
   * contrast yarns. Fair isle and argyle use a third.
   */
  yarn?: string[]
  /**
   * One colour instead of a colourway. The contrast yarns are derived from it,
   * so the whole frame is a tint of a single shade rather than a clash — which
   * is how the reference app dresses each window in its own app's colour.
   */
  tint?: string
  /** Which hand knitted it. Changes the wander, nothing else. */
  seed?: number
  /** Corner rounding, in stitches. */
  radius?: number
  /** Paint behind the children. Leave unset for transparent. */
  background?: string
  /** Knit itself on, row by row, when it first appears. */
  knitIn?: boolean
  /** Show the built-in pattern and yarn pickers. */
  controls?: boolean
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

/** Parse #rgb or #rrggbb into 0-255 channels. Anything else is null. */
export const parseHex = (hex: string): [number, number, number] | null => {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return null
  const v = m[1]
  const full = v.length === 3 ? v[0] + v[0] + v[1] + v[1] + v[2] + v[2] : v
  const n = parseInt(full, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/**
 * A whole colourway from one colour.
 *
 * The contrast is that same hue pulled most of the way to a warm off-white;
 * the third is the same hue taken down toward brown. Neither is a new colour,
 * and that is the point — a tinted frame is all one shade, which is what the
 * reference app does when it dresses a window in its app's colour.
 *
 * A colour it cannot parse comes back as a single-yarn colourway rather than
 * as a guess: one plain sweater is a better answer than three wrong ones.
 */
export const tintYarn = (base: string): string[] => {
  const rgb = parseHex(base)
  if (!rgb) return [base]
  const toward = (to: [number, number, number], t: number) =>
    "rgb(" +
    Math.round(rgb[0] + (to[0] - rgb[0]) * t) + "," +
    Math.round(rgb[1] + (to[1] - rgb[1]) * t) + "," +
    Math.round(rgb[2] + (to[2] - rgb[2]) * t) + ")"
  return [base, toward([250, 247, 240], 0.82), toward([26, 22, 20], 0.34)]
}
// #endregion

export const PATTERNS: KnitPattern[] = [
  "chevron",
  "fairisle",
  "argyle",
  "seed",
  "ribbing",
  "stripes",
  "plain",
]

/** A few hand-picked shades, in the spirit of the reference's per-app yarns. */
export const COLOURWAYS: { name: string; hex: string }[] = [
  { name: "Harbour", hex: "#4e8098" },
  { name: "Cabin", hex: "#c8452f" },
  { name: "Moss", hex: "#4a6b3d" },
  { name: "Heather", hex: "#7b5ea7" },
  { name: "Oat", hex: "#b8935f" },
  { name: "Ember", hex: "#d1495b" },
  { name: "Slate", hex: "#3f4a5a" },
]

const DEFAULT_TINT = "#4e8098"

/**
 * The gauge, taken from the reference app's own defaults. These are the
 * numbers that decide whether it reads as knitting or as a pattern fill, and
 * they are gentler than they look like they ought to be — the jitter in
 * particular is a thirtieth of a stitch, not a tenth.
 */
const GAUGE = {
  aspect: 1.35,
  rowOverlap: 0.12,
  yarn: 0.48,
  bow: 0.28,
  jitter: 0.035,
  ground: 0.98,
  shadow: 0.74,
  light: 1.18,
  relief: 0.7,
  sheen: 0.1,
}

const RIDGE_TONE = [0.22, 0.48, 0.7, 0.88, 1]
const RIDGE_WIDTH = [1, 0.8, 0.6, 0.4, 0.2]

const yarnFor = (colors: string[], i: number) =>
  colors[Math.min(i, colors.length - 1)] ?? colors[0]

export default function KnittedFrame({
  children,
  stitches = 5,
  stitchSize = 9,
  pattern = "chevron",
  yarn,
  tint,
  seed = 1,
  radius = 2,
  background,
  knitIn = true,
  controls = false,
  className = "",
}: KnittedFrameProps) {
  const hostRef = React.useRef<HTMLDivElement | null>(null)
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
  const [reduced, setReduced] = React.useState(false)
  const [ownPattern, setOwnPattern] = React.useState<KnitPattern>(pattern)
  const [ownTint, setOwnTint] = React.useState<string>(tint ?? DEFAULT_TINT)

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => setReduced(mq.matches)
    sync()
    mq.addEventListener("change", sync)
    return () => mq.removeEventListener("change", sync)
  }, [])

  // With the pickers on, the component owns the choice; with them off the
  // props do, and the pickers are not in the way at all.
  const activePattern = controls ? ownPattern : pattern
  const yarnKey = (yarn ?? []).join(",")
  const colors = React.useMemo(() => {
    if (controls) return tintYarn(ownTint)
    if (yarn && yarn.length > 0) return yarn
    if (tint) return tintYarn(tint)
    return tintYarn(DEFAULT_TINT)
    // `yarnKey` stands in for `yarn`: an inline array literal is a new
    // reference on every render, and depending on it would re-knit forever.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controls, ownTint, tint, yarnKey])

  const look = React.useRef({
    stitches, stitchSize, activePattern, colors, seed, radius, knitIn, reduced,
  })
  look.current = { stitches, stitchSize, activePattern, colors, seed, radius, knitIn, reduced }

  React.useEffect(() => {
    const host = hostRef.current
    const canvas = canvasRef.current
    if (!host || !canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let raf = 0
    let disposed = false
    let startedAt = 0

    // Two scratch buffers: one for the flat yarn colour, one for the height
    // the wool stands up in. Kept between draws rather than reallocated.
    const paint = document.createElement("canvas")
    const relief = document.createElement("canvas")
    const pc = paint.getContext("2d", { willReadFrequently: true })
    const rc = relief.getContext("2d", { willReadFrequently: true })
    if (!pc || !rc) return

    /** A run of stitches on one row, as a single scalloped path. */
    const layRun = (
      from: number,
      to: number,
      y: number,
      sw: number,
      sh: number,
      row: number,
      jit: number,
      seedN: number,
    ) => {
      const path = new Path2D()
      const jy = (stitchNoise(row, 3, seedN) - 0.5) * jit * 2
      path.moveTo(from * sw, y + jy)
      const bx = sw * GAUGE.bow
      for (let i = from; i < to; i++) {
        const x = i * sw
        const jx = (stitchNoise(i, row, seedN) - 0.5) * jit * 2
        path.quadraticCurveTo(x + bx + jx, y + sh * 0.55 + jy, x + sw * 0.5 + jx, y + sh + jy)
        path.quadraticCurveTo(x + sw - bx + jx, y + sh * 0.55 + jy, x + sw + jx, y + jy)
      }
      return path
    }

    const draw = (progress: number) => {
      const L = look.current
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const cssW = host.clientWidth
      const cssH = host.clientHeight
      if (cssW === 0 || cssH === 0) return

      const w = Math.max(1, Math.round(cssW * dpr))
      const h = Math.max(1, Math.round(cssH * dpr))
      for (const c of [canvas, paint, relief]) {
        if (c.width !== w || c.height !== h) {
          c.width = w
          c.height = h
        }
      }

      const sh = Math.max(3, L.stitchSize) * dpr
      const sw = sh * GAUGE.aspect
      const rowStep = sh * (1 - GAUGE.rowOverlap)
      const cols = Math.ceil(w / sw) + 1
      const rows = Math.ceil(h / rowStep) + 1
      const band = Math.max(1, Math.round(L.stitches))
      const jit = sh * GAUGE.jitter

      pc.clearRect(0, 0, w, h)
      rc.clearRect(0, 0, w, h)
      pc.lineCap = "round"
      pc.lineJoin = "round"
      rc.lineCap = "round"
      rc.lineJoin = "round"

      // Knitting happens from the bottom up, so that is how it arrives.
      const firstRow = progress >= 1 ? 0 : rows - Math.ceil(rows * progress)

      for (let row = firstRow; row < rows; row++) {
        const y = row * rowStep - sh * 0.5
        // Runs of one colour become one path, so a plain row is a single
        // stroke rather than a hundred.
        const runs: { color: string; from: number; to: number }[] = []
        let from = -1
        let cur = ""
        for (let col = 0; col <= cols; col++) {
          const on = col < cols && inBorder(col, row, cols, rows, band, L.radius)
          const color = on
            ? yarnFor(L.colors, stitchColorIndex(col, row, L.activePattern, L.colors.length))
            : ""
          if (color !== cur) {
            if (from >= 0) runs.push({ color: cur, from, to: col })
            from = color ? col : -1
            cur = color
          }
        }

        for (const run of runs) {
          const path = layRun(run.from, run.to, y, sw, sh, row, jit, L.seed)
          pc.strokeStyle = run.color
          pc.lineWidth = sw * GAUGE.yarn
          pc.stroke(path)
          // The same strand into the height field: wide and low, then narrower
          // and higher. Five steps is a round strand of wool; one stroke with
          // an offset dark copy underneath is a sticker of one.
          for (let i = 0; i < 5; i++) {
            const t = Math.round(RIDGE_TONE[i] * 255)
            rc.strokeStyle = "rgb(" + t + "," + t + "," + t + ")"
            rc.lineWidth = sw * GAUGE.yarn * RIDGE_WIDTH[i]
            rc.stroke(path)
          }
        }
      }

      // ---- light it by the normals of the height field --------------------
      const col = pc.getImageData(0, 0, w, h)
      const hgt = rc.getImageData(0, 0, w, h)
      const cd = col.data
      const hd = hgt.data

      for (let y = 0; y < h; y++) {
        const rowOff = y * w * 4
        for (let x = 0; x < w; x++) {
          const i = rowOff + x * 4
          if (cd[i + 3] === 0) continue
          const l = x > 0 ? hd[i - 4] : hd[i]
          const r = x < w - 1 ? hd[i + 4] : hd[i]
          const u = y > 0 ? hd[i - w * 4] : hd[i]
          const d = y < h - 1 ? hd[i + w * 4] : hd[i]
          // The gradient of the height is the surface normal, near enough.
          // Lit from the upper left, as everything on a screen is.
          const nx = (l - r) / 255
          const ny = (u - d) / 255
          const height = hd[i] / 255
          let lit = GAUGE.ground + GAUGE.relief * (nx * 0.6 + ny * 0.62)
          lit += GAUGE.sheen * height * height * height
          if (lit < GAUGE.shadow) lit = GAUGE.shadow
          else if (lit > GAUGE.light) lit = GAUGE.light
          cd[i] = Math.min(255, cd[i] * lit)
          cd[i + 1] = Math.min(255, cd[i + 1] * lit)
          cd[i + 2] = Math.min(255, cd[i + 2] * lit)
        }
      }

      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, w, h)
      ctx.putImageData(col, 0, 0)
    }

    const frame = () => {
      if (disposed) return
      const L = look.current
      const t = L.knitIn && !L.reduced ? Math.min((performance.now() - startedAt) / 900, 1) : 1
      draw(t)
      if (t < 1) raf = requestAnimationFrame(frame)
    }

    // A resize re-knits at full progress rather than replaying the animation,
    // which would make every reflow look like a glitch.
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(raf)
      draw(1)
    })
    observer.observe(host)

    startedAt = performance.now()
    raf = requestAnimationFrame(frame)

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      observer.disconnect()
    }
  }, [stitches, stitchSize, activePattern, colors, seed, radius, knitIn, reduced])

  // A little more than the band, so the innermost row of stitches is not
  // hidden behind the content's own edge.
  const pad = Math.round(Math.max(1, stitches) * Math.max(stitchSize, 3) * 1.15)

  const selectClass =
    "rounded-md border border-black/15 bg-white px-2 py-1 text-[12px] capitalize text-[#3b2f26] " +
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"

  return (
    <div className={className}>
      {controls && (
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-1.5 text-[12px] text-[#6b5847]">
            Pattern
            <select
              className={selectClass}
              value={ownPattern}
              onChange={(e) => setOwnPattern(e.target.value as KnitPattern)}
            >
              {PATTERNS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1.5 text-[12px] text-[#6b5847]">
            Yarn
            <select
              className={selectClass}
              value={ownTint}
              onChange={(e) => setOwnTint(e.target.value)}
            >
              {COLOURWAYS.map((c) => (
                <option key={c.hex} value={c.hex}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      <div ref={hostRef} className="relative">
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
    </div>
  )
}
