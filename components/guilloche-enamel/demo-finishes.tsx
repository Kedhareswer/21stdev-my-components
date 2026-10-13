"use client"

import * as React from "react"
import GuillocheEnamel, { GUILLOCHE_PRESETS, type GuillochePreset } from "@/components/ui/guilloche-enamel"

const FINISHES = Object.keys(GUILLOCHE_PRESETS) as GuillochePreset[]

const LABELS = {
  cobalt: "Cobalt",
  forest: "Forest",
  salmon: "Salmon",
  argent: "Argenté",
}

export default function FinishesDemo() {
  const [finish, setFinish] = React.useState("cobalt" as GuillochePreset)

  return (
    <GuillocheEnamel preset={finish}>
      <div className="pointer-events-none flex h-full w-full items-end p-5 sm:p-8">
        <div
          role="radiogroup"
          aria-label="Finish"
          className="pointer-events-auto flex gap-1 rounded-full border border-white/15 bg-black/45 p-1 backdrop-blur-md"
        >
          {FINISHES.map((key) => (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={finish === key}
              onClick={() => setFinish(key)}
              className={
                "flex items-center gap-2 rounded-full px-3 py-1.5 text-[13px] font-medium tracking-tight transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white " +
                (finish === key ? "bg-white/90 text-neutral-900" : "text-white/75 hover:text-white")
              }
            >
              <span
                aria-hidden="true"
                className="h-3 w-3 rounded-full border border-black/20"
                style={{
                  background:
                    GUILLOCHE_PRESETS[key].enamel === "#ffffff"
                      ? GUILLOCHE_PRESETS[key].metal
                      : GUILLOCHE_PRESETS[key].enamel,
                }}
              />
              {LABELS[key]}
            </button>
          ))}
        </div>
      </div>
    </GuillocheEnamel>
  )
}
