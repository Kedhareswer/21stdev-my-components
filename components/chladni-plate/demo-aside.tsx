"use client"

import ChladniPlate from "@/components/ui/chladni-plate"

export default function AsideDemo() {
  // Copy hung on the plate's own edges: the title level with its top, the
  // caption level with its bottom. The plate publishes where it sits as
  // --cp-plate-top / --cp-plate-bottom; on phones the copy sits under it.
  return (
    <div className="w-full">
      <ChladniPlate align="aside">
        <div className="relative h-full px-6 md:w-[44%] md:pl-[7vw]">
          <div className="absolute inset-x-6 bottom-20 top-[calc(var(--cp-plate-bottom,60vh)+28px)] flex flex-col justify-center md:inset-x-auto md:bottom-auto md:top-[var(--cp-plate-top,10vh)] md:block md:pr-6">
            <h1 className="max-w-[12ch] text-4xl font-medium leading-[1.02] tracking-[-0.03em] text-white/90 [text-wrap:balance] sm:text-6xl">
              Every note draws its own figure.
            </h1>
            <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-white/70 md:hidden">
              Draw the bow across the brass edge. The sand leaps off everything that moves and settles on the still lines between.
            </p>
          </div>
          <p className="absolute hidden max-w-sm -translate-y-full text-[15px] leading-relaxed text-white/70 md:top-[var(--cp-plate-bottom,90vh)] md:block">
            Draw the bow across the brass edge. The sand leaps off everything that moves and settles on the still lines between.
          </p>
        </div>
      </ChladniPlate>
    </div>
  )
}
