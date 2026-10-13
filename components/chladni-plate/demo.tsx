"use client"

import ChladniPlate from "@/components/ui/chladni-plate"

export default function Demo() {
  // w-full matters: 21st centres demos in a flex wrapper, and a flex item
  // left at width:auto shrinks the canvas to 0px wide. On phones the copy
  // starts just under the plate, using the position the plate publishes.
  return (
    <div className="w-full">
      <ChladniPlate align="aside">
        <div className="flex h-full flex-col px-6 pt-[calc(var(--cp-plate-bottom,60vh)+36px)] md:w-[42%] md:justify-center md:pl-[7vw] md:pt-0">
          <h1 className="max-w-[11ch] text-4xl font-medium leading-[1.02] tracking-[-0.03em] text-white/90 [text-wrap:balance] sm:text-6xl">
            Every note draws its own figure.
          </h1>
          <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-white/70">
            Draw the bow across the brass edge. The sand leaps off everything that moves and settles on the still lines between.
          </p>
        </div>
      </ChladniPlate>
    </div>
  )
}
