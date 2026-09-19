"use client"

import KnittedFrame from "@/components/ui/knitted-frame"

export default function Demo() {
  return (
    <div className="flex w-full items-center justify-center bg-[#f4efe6] px-6 py-16">
      <KnittedFrame
        pattern="chevron"
        tint="#4e8098"
        className="w-full max-w-lg"
      >
        {/* A window, wearing a sweater. */}
        <div className="overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-black/10 bg-[#f6f2ec] px-3 py-2">
            <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
            <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
            <span className="h-3 w-3 rounded-full bg-[#28c840]" />
            <span className="ml-2 font-mono text-[11px] tracking-wide text-black/50">
              readme.md
            </span>
          </div>
          <div className="px-5 py-6">
            <h3 className="m-0 text-lg font-semibold text-[#2b2118]">Cosy by default</h3>
            <p className="m-0 mt-2 text-sm leading-relaxed text-[#5b4a3c]">
              Every stitch is drawn rather than tiled, and each one wanders by a
              fraction of a millimetre — so the rows breathe the way hand
              knitting does instead of repeating.
            </p>
          </div>
        </div>
      </KnittedFrame>
    </div>
  )
}
