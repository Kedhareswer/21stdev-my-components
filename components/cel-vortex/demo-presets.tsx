"use client"

import * as React from "react"
import CelVortex, { VORTEX_PRESETS } from "@/components/ui/cel-vortex"

/**
 * The same tunnel inked six ways, boxed rather than full-bleed — the shape you
 * want inside a page. Switching presets never restarts WebGL; the shader just
 * gets new numbers.
 */
const NAMES = Object.keys(VORTEX_PRESETS) as (keyof typeof VORTEX_PRESETS)[]

export default function PresetsDemo() {
  const [active, setActive] = React.useState<keyof typeof VORTEX_PRESETS>("cobalt")
  const [smooth, setSmooth] = React.useState(false)
  const params = React.useMemo(() => (smooth ? { fps: 0 } : undefined), [smooth])

  return (
    <div className="min-h-screen w-full bg-background px-6 py-14 text-foreground">
      <div className="mx-auto w-full max-w-3xl">
        <p className="mb-2 font-mono text-xs uppercase tracking-[0.28em] text-muted-foreground">
          Cel Vortex
        </p>
        <h2 className="mb-6 text-3xl font-semibold tracking-tight">Six inks</h2>

        <div className="mb-5 flex flex-wrap items-center gap-2">
          {NAMES.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setActive(name)}
              className={
                "rounded-full border px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] transition-colors " +
                (name === active
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:text-foreground")
              }
            >
              {name}
            </button>
          ))}
          <label className="ml-auto flex cursor-pointer items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            <input type="checkbox" checked={smooth} onChange={(e) => setSmooth(e.target.checked)} />
            smooth (fps 0)
          </label>
        </div>

        <div className="w-full overflow-hidden rounded-2xl border border-border">
          <CelVortex preset={active} params={params} height="440px" />
        </div>

        <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          move to steer the eye · click for a shock ring · hold to surge
        </p>
      </div>
    </div>
  )
}
