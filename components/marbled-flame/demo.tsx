"use client"

import MarbledFlame from "@/components/ui/marbled-flame"

export default function Demo() {
  return (
    // w-full is not decoration: 21st centres every demo in a flex wrapper, and
    // a flex item left at width:auto collapses the canvas to 0px wide.
    <div className="relative w-full">
      <MarbledFlame touch="draw">
        <div className="flex h-full w-full flex-col justify-between p-6 sm:p-10">
          <p className="font-mono text-[11px] uppercase tracking-[0.34em] text-white/50">
            Vol. 07 — Kindling
          </p>

          <div className="max-w-xl">
            <h1 className="text-5xl font-semibold leading-[0.95] tracking-tight text-white sm:text-7xl">
              Burn slow.
              <br />
              <span className="text-[#ff2a3d]">Spread wide.</span>
            </h1>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/60">
              Fire, marbled into raw canvas. Drag through it to smear the paint,
              click to make it flare.
            </p>
          </div>

          <p className="font-mono text-[11px] uppercase tracking-[0.34em] text-white/40">
            drag · click
          </p>
        </div>
      </MarbledFlame>
    </div>
  )
}
