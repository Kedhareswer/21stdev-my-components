"use client"

import ChladniPlate from "@/components/ui/chladni-plate"

export default function Demo() {
  // w-full matters: 21st centres demos in a flex wrapper, and a flex item
  // left at width:auto shrinks the canvas to 0px wide.
  return (
    <div className="w-full">
      <ChladniPlate align="aside">
        <div className="flex h-full flex-col justify-end px-6 pb-20 md:w-[42%] md:justify-center md:pb-0 md:pl-[7vw]">
          <h1 className="max-w-[11ch] text-4xl font-medium leading-[1.02] tracking-[-0.03em] text-white/90 sm:text-6xl">
            Every note draws its own figure.
          </h1>
          <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-white/60">
            Draw the bow across the brass edge. The sand leaps off everything that moves and settles on the still lines between.
          </p>
        </div>
      </ChladniPlate>
    </div>
  )
}
