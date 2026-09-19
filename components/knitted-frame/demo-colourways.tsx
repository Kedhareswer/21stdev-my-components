"use client"

import KnittedFrame from "@/components/ui/knitted-frame"

export default function Demo() {
  return (
    <div className="flex w-full flex-col items-center gap-4 bg-[#f4efe6] px-6 py-16">
      {/* controls renders the component's own pattern and yarn pickers. */}
      <KnittedFrame controls background="#fffaf2" className="w-full max-w-md">
        <div className="px-6 py-8 text-center">
          <h3 className="m-0 text-2xl font-semibold text-[#2b2118]">Pick a sweater</h3>
          <p className="m-0 mt-2 text-sm text-[#6b5847]">
            Seven charts, and a colourway tinted from one shade.
          </p>
        </div>
      </KnittedFrame>
    </div>
  )
}
