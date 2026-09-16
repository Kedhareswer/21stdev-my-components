"use client"

import CausticPool from "@/components/ui/caustic-pool"

export default function Demo() {
  return (
    <div className="relative">
      <CausticPool preset="deep-ocean" resolution={512} touch="draw" />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center p-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.34em] text-white/45">
          stir the water
        </p>
      </div>
    </div>
  )
}
