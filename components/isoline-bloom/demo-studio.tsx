"use client"

import * as React from "react"
import IsolineBloom, { ISOLINE_DEFAULTS, ISOLINE_PRESETS, type IsolinePreset } from "@/components/ui/isoline-bloom"

/**
 * Every knob worth turning, on a boxed field — the shape you want behind a
 * card or a section. The readout under it is the `params` object to paste.
 */
const NAMES = Object.keys(ISOLINE_PRESETS) as IsolinePreset[]

type Knob = { key: "lobes" | "lobeDepth" | "twist" | "warp" | "rings" | "flow" | "lineWidth" | "glow"; min: number; max: number; step: number }
const KNOBS: Knob[] = [
  { key: "lobes", min: 1, max: 8, step: 1 },
  { key: "lobeDepth", min: 0, max: 0.4, step: 0.01 },
  { key: "twist", min: -2, max: 2, step: 0.05 },
  { key: "warp", min: 0, max: 0.2, step: 0.005 },
  { key: "rings", min: 4, max: 28, step: 1 },
  { key: "flow", min: -0.8, max: 0.8, step: 0.02 },
  { key: "lineWidth", min: 0.6, max: 4, step: 0.1 },
  { key: "glow", min: 0, max: 24, step: 0.5 },
]

export default function StudioDemo() {
  const [preset, setPreset] = React.useState<IsolinePreset>("ultraviolet")
  const [tweaks, setTweaks] = React.useState<Partial<Record<Knob["key"], number>>>({})

  const base = { ...ISOLINE_DEFAULTS, ...ISOLINE_PRESETS[preset] }
  const params = React.useMemo(() => ({ ...tweaks }), [tweaks])

  const chip = (on: boolean) =>
    "rounded-full border px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] transition-colors " +
    (on ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:text-foreground")

  return (
    <div className="min-h-screen w-full bg-background px-5 py-12 text-foreground">
      <div className="mx-auto w-full max-w-3xl">
        <p className="mb-2 font-mono text-xs uppercase tracking-[0.28em] text-muted-foreground">Isoline Bloom</p>
        <h2 className="mb-6 text-3xl font-semibold tracking-tight">Tune the field</h2>

        <div className="mb-4 flex flex-wrap gap-2">
          {NAMES.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => {
                setPreset(name)
                setTweaks({})
              }}
              className={chip(name === preset)}
            >
              {name}
            </button>
          ))}
        </div>

        <div className="mb-5 grid grid-cols-1 gap-x-6 gap-y-3 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground sm:grid-cols-2">
          {KNOBS.map(({ key, min, max, step }) => {
            const value = tweaks[key] ?? base[key]
            return (
              <label key={key} className="flex items-center justify-between gap-3">
                <span>
                  {key} <span className="text-foreground">{Number(value.toFixed(3))}</span>
                </span>
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={value}
                  onChange={(e) => setTweaks((t) => ({ ...t, [key]: Number(e.target.value) }))}
                  className="w-36"
                />
              </label>
            )
          })}
        </div>

        <div className="rounded-2xl border border-border p-1">
          <IsolineBloom
            preset={preset}
            params={params}
            height="480px"
            touch="draw"
            className="rounded-xl [clip-path:inset(0_round_0.75rem)]"
          />
        </div>

        <p className="mt-4 break-all font-mono text-[11px] tracking-[0.04em] text-muted-foreground">
          {"<IsolineBloom preset=\"" + preset + "\"" +
            (Object.keys(tweaks).length ? " params={" + JSON.stringify(tweaks) + "}" : "") +
            " />"}
        </p>
      </div>
    </div>
  )
}
