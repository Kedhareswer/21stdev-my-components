"use client"

import CelVortex from "@/components/ui/cel-vortex"

export default function Demo() {
  return (
    // w-full matters: 21st centres demos in a flex wrapper, and a flex item
    // left at width:auto shrinks the vortex to 0px wide.
    <div className="relative w-full">
      <CelVortex>
        <div className="flex h-full flex-col items-center justify-center p-6 text-center sm:p-10">
          <div className="flex max-w-md flex-col items-center">
            <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.34em] text-[#2f6fd6]/80">
              ✺ impact frame
            </p>
            <h1 className="text-5xl font-black leading-[0.9] tracking-tight text-[#2f6fd6] sm:text-7xl">
              Into the
              <br />
              blue.
            </h1>
            <button
              type="button"
              className="pointer-events-auto mt-7 rounded-full bg-[#2f6fd6] px-6 py-2.5 font-mono text-[11px] uppercase tracking-[0.26em] text-[#eceef1] transition-transform hover:scale-105 active:scale-95 motion-reduce:transition-none"
            >
              Fall in →
            </button>
          </div>
        </div>
      </CelVortex>
    </div>
  )
}
