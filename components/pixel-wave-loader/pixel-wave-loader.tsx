"use client"

import * as React from "react"

// A loader made of a small grid of soft pixels. A wave rolls through it (in a
// diagonal, out from the centre, as a ripple, or snaking row by row) and each
// pixel swells and brightens as it passes, tinted along the grid from one
// colour to another. Pure CSS: one keyframe, a delay per pixel.

export type PixelWavePattern = "diagonal" | "radial" | "ripple" | "snake"

export type PixelWaveLoaderProps = {
  rows?: number
  cols?: number
  /** Pixel size, any CSS length. */
  size?: string
  /** Gap between pixels, any CSS length. */
  gap?: string
  pattern?: PixelWavePattern
  /** Seconds for one wave. */
  duration?: number
  /** Colours at the start and end of the grid. Default to the host foreground. */
  from?: string
  to?: string
  /** Text under the grid. Also the accessible name. */
  label?: string
  className?: string
  style?: React.CSSProperties
}

// #region pattern
/** Wave phase (0..1) of the pixel at row y, column x: when in the cycle it peaks. */
export function phase(pattern: PixelWavePattern, x: number, y: number, cols: number, rows: number): number {
  const mx = Math.max(1, cols - 1)
  const my = Math.max(1, rows - 1)
  if (pattern === "diagonal") return (x + y) / (mx + my)
  const cx = mx / 2
  const cy = my / 2
  const d = Math.hypot(x - cx, y - cy) / Math.max(1e-6, Math.hypot(cx, cy))
  if (pattern === "radial") return d
  if (pattern === "ripple") return (d * 2) % 1
  // snake: left to right, then right to left on the next row
  const i = y * cols + (y % 2 ? cols - 1 - x : x)
  return i / Math.max(1, cols * rows - 1)
}

/** Share of the gradient a pixel takes: top left 0, bottom right 1. */
export function tint(x: number, y: number, cols: number, rows: number): number {
  const t = (x + y) / Math.max(1, cols - 1 + rows - 1)
  return Math.round(t * 100)
}
// #endregion

const CSS =
  ".pwl-root{display:inline-flex;flex-direction:column;align-items:center;gap:14px;color:var(--color-foreground,#111)}" +
  ".pwl-grid{display:grid;grid-template-columns:repeat(var(--pwl-cols),var(--pwl-size));gap:var(--pwl-gap)}" +
  ".pwl-p{width:var(--pwl-size);height:var(--pwl-size);border-radius:28%;background:color-mix(in oklab,var(--pwl-to) var(--t),var(--pwl-from));" +
  "transform:scale(.38);opacity:.2;animation:pwl-wave var(--pwl-d) cubic-bezier(.45,0,.4,1) infinite;animation-delay:calc(var(--ph) * var(--pwl-d) * .7 - var(--pwl-d));will-change:transform,opacity}" +
  ".pwl-label{font-size:12px;letter-spacing:.14em;text-transform:uppercase;opacity:.6;font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif}" +
  "@keyframes pwl-wave{0%,62%,100%{transform:scale(.38);opacity:.2}18%{transform:scale(1.06);opacity:1}32%{transform:scale(.92);opacity:.86}}" +
  "@media (prefers-reduced-motion:reduce){.pwl-p{animation-name:pwl-glow}@keyframes pwl-glow{0%,62%,100%{opacity:.3}18%{opacity:1}}.pwl-p{transform:scale(.8)}}"

export default function PixelWaveLoader({
  rows = 4,
  cols = 4,
  size = "10px",
  gap = "4px",
  pattern = "diagonal",
  duration = 1.5,
  from,
  to,
  label,
  className,
  style,
}: PixelWaveLoaderProps) {
  const r = Math.max(1, Math.round(rows))
  const c = Math.max(1, Math.round(cols))
  const cells = []
  for (let y = 0; y < r; y++)
    for (let x = 0; x < c; x++)
      cells.push(
        <span
          className="pwl-p"
          key={y * c + x}
          style={{ "--ph": phase(pattern, x, y, c, r).toFixed(3), "--t": tint(x, y, c, r) + "%" } as React.CSSProperties}
        />,
      )
  return (
    <span
      role="status"
      aria-label={label || "Loading"}
      className={"pwl-root" + (className ? " " + className : "")}
      style={
        {
          "--pwl-cols": c,
          "--pwl-size": size,
          "--pwl-gap": gap,
          "--pwl-d": duration + "s",
          "--pwl-from": from || "var(--color-foreground, #111)",
          "--pwl-to": to || from || "var(--color-foreground, #111)",
          ...style,
        } as React.CSSProperties
      }
    >
      <style>{CSS}</style>
      <span className="pwl-grid" aria-hidden="true">
        {cells}
      </span>
      {label ? (
        <span className="pwl-label" aria-hidden="true">
          {label}
        </span>
      ) : null}
    </span>
  )
}
