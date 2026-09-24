"use client"

import * as React from "react"
import MarbledFlame, { FLAME_DEFAULTS, FLAME_PRESETS, type FlameParams } from "@/components/ui/marbled-flame"

/**
 * The same fire in five palettes, boxed rather than full-bleed, with the knobs
 * that change its character most: how it sways, how far it reaches, how much
 * it tears apart.
 */
const NAMES = Object.keys(FLAME_PRESETS) as (keyof typeof FLAME_PRESETS)[]

const KNOBS: { key: keyof FlameParams; label: string; min: number; max: number; step: number }[] = [
  { key: "sway", label: "sway", min: 0, max: 0.15, step: 0.005 },
  { key: "swaySpeed", label: "sway speed", min: 0.1, max: 3, step: 0.05 },
  { key: "reach", label: "reach", min: -0.35, max: 0.4, step: 0.01 },
  { key: "turbulence", label: "turbulence", min: 0.3, max: 1.8, step: 0.05 },
  { key: "tendrils", label: "tendrils", min: 0, max: 1.5, step: 0.05 },
  { key: "grain", label: "grain", min: 0, max: 1.5, step: 0.05 },
]

export default function PresetsDemo() {
  const [active, setActive] = React.useState<keyof typeof FLAME_PRESETS>("vermilion")
  const [tuned, setTuned] = React.useState<Partial<FlameParams>>({})
  const params = React.useMemo(() => tuned, [tuned])

  return (
    <div className="min-h-screen w-full bg-background px-6 py-14 text-foreground">
      <div className="mx-auto w-full max-w-3xl">
        <p className="mb-2 font-mono text-xs uppercase tracking-[0.28em] text-muted-foreground">
          Marbled Flame
        </p>
        <h2 className="mb-6 text-3xl font-semibold tracking-tight">Five fires</h2>

        <div className="mb-5 flex flex-wrap gap-2">
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
        </div>

        <div className="overflow-hidden rounded-2xl border border-border">
          <MarbledFlame preset={active} params={params} height="440px" />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
          {KNOBS.map((k) => {
            const value = ((tuned[k.key] ??
              (FLAME_PRESETS[active] as Partial<FlameParams>)[k.key] ??
              FLAME_DEFAULTS[k.key]) as number)
            return (
              <label key={k.key} className="block">
                <span className="mb-1 flex justify-between font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  {k.label}
                  <span className="text-foreground">{value}</span>
                </span>
                <input
                  type="range"
                  min={k.min}
                  max={k.max}
                  step={k.step}
                  value={value}
                  onChange={(e) => setTuned((t) => ({ ...t, [k.key]: Number(e.target.value) }))}
                  className="w-full accent-current"
                />
              </label>
            )
          })}
        </div>

        <button
          type="button"
          onClick={() => setTuned({})}
          className="mt-5 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          reset knobs
        </button>
      </div>
    </div>
  )
}
