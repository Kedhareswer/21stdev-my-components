"use client"

import * as React from "react"
import VelvetHaze, { HAZE_PRESETS } from "@/components/ui/velvet-haze"

type Preset = keyof typeof HAZE_PRESETS

// Swatch colours for the picker, lifted from each preset's violet.
const SWATCH: Record<string, string> = {
  velvet: "#9a4fb0",
  chrome: "#a9adb6",
  rose: "#c4507e",
  aqua: "#2f8fa8",
  ember: "#c8582a",
}

export default function Demo() {
  const [preset, setPreset] = React.useState<Preset>("velvet")
  const [grain, setGrain] = React.useState(0.085)
  const params = React.useMemo(() => ({ grain }), [grain])

  return (
    <div className="relative flex min-h-[100svh] w-full flex-col items-center justify-center gap-8 bg-background px-4 py-14 sm:px-12">
      <div className="relative w-full max-w-5xl">
        <VelvetHaze height="min(70svh, 600px)" radius="4px" preset={preset} params={params} />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
        <div className="flex items-center gap-2" role="radiogroup" aria-label="Palette">
          {Object.keys(HAZE_PRESETS).map((name) => (
            <button
              key={name}
              type="button"
              role="radio"
              aria-checked={preset === name}
              aria-label={name}
              title={name}
              onClick={() => setPreset(name)}
              className={
                "h-6 w-6 rounded-full border transition-transform motion-reduce:transition-none " +
                (preset === name ? "scale-110 border-foreground" : "border-border hover:scale-105")
              }
              style={{ background: "radial-gradient(circle at 35% 30%, #e4e3e8 0%, " + SWATCH[name] + " 55%, #0f0f10 100%)" }}
            />
          ))}
        </div>
        <label className="flex items-center gap-3">
          Grain
          <input
            type="range"
            min={0}
            max={0.2}
            step={0.005}
            value={grain}
            onChange={(e) => setGrain(Number(e.target.value))}
            className="w-32 accent-foreground"
          />
        </label>
      </div>
    </div>
  )
}
