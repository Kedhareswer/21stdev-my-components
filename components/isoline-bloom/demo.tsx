"use client"

import IsolineBloom from "@/components/ui/isoline-bloom"

export default function Demo() {
  return (
    // w-full matters: 21st centres demos in a flex wrapper, and a flex item
    // left at width:auto shrinks the canvas to 0px wide.
    <div className="relative w-full">
      <IsolineBloom>
        <div className="flex h-full flex-col justify-between p-6 sm:p-10">
          <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.32em] text-white/45">
            <span>field 03 / ultraviolet</span>
            <span className="hidden sm:inline">resonance · live</span>
          </div>

          <div className="flex flex-col items-center text-center">
            <p className="font-mono text-[11px] uppercase tracking-[0.34em] text-white/40">
              move to bend the lines · click to send a pulse
            </p>
          </div>
        </div>
      </IsolineBloom>
    </div>
  )
}
