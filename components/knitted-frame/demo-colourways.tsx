"use client"

import * as React from "react"
import KnittedFrame, { type KnitPattern } from "@/components/ui/knitted-frame"

// Hand-picked, the way the original app picks a colourway per app rather than
// reading it off an icon.
const WAYS: { name: string; yarn: string[]; pattern: KnitPattern }[] = [
  { name: "Cabin", yarn: ["#c8452f", "#f2e4cf", "#2e4a6b"], pattern: "fairisle" },
  { name: "Moss", yarn: ["#4a6b3d", "#e8e2cf"], pattern: "seed" },
  { name: "Harbour", yarn: ["#2e4a6b", "#dfe7ee"], pattern: "chevron" },
  { name: "Heather", yarn: ["#7b5ea7", "#efe6f5", "#c9a6e0"], pattern: "argyle" },
  { name: "Oat", yarn: ["#b99a6b", "#f6efe2"], pattern: "ribbing" },
  { name: "Ember", yarn: ["#a8321f", "#f0c26b"], pattern: "stripes" },
]

export default function Demo() {
  const [i, setI] = React.useState(0)
  const way = WAYS[i]

  return (
    <div className="flex w-full flex-col items-center gap-7 bg-[#f4efe6] px-6 py-16">
      <div className="flex flex-wrap justify-center gap-2">
        {WAYS.map((w, n) => (
          <button
            key={w.name}
            type="button"
            onClick={() => setI(n)}
            className={
              "flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[12px] transition " +
              (i === n
                ? "border-[#2b2118] bg-[#2b2118] text-[#f4efe6]"
                : "border-black/15 text-[#5b4a3c] hover:border-black/40")
            }
          >
            <span
              className="h-3 w-3 rounded-full ring-1 ring-black/10"
              style={{ background: w.yarn[0] }}
            />
            {w.name}
          </button>
        ))}
      </div>

      <KnittedFrame
        key={way.name}
        pattern={way.pattern}
        yarn={way.yarn}
        stitches={5}
        stitchSize={13}
        background="#fffaf2"
        className="w-full max-w-md"
      >
        <div className="px-6 py-8 text-center">
          <p className="m-0 font-mono text-[11px] uppercase tracking-[0.24em] text-[#8a7461]">
            {way.pattern}
          </p>
          <h3 className="m-0 mt-2 text-2xl font-semibold text-[#2b2118]">{way.name}</h3>
          <p className="m-0 mt-2 text-sm text-[#6b5847]">
            Same frame, different yarn and chart.
          </p>
        </div>
      </KnittedFrame>
    </div>
  )
}
