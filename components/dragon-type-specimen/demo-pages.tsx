"use client"

import * as React from "react"
import DragonTypeSpecimen from "@/components/ui/dragon-type-specimen"

const PAGES = ["Cover", "Eye", "Glyphs", "Weights", "Styles", "Alternates", "Liquid"]
// the middle of each page, where the dragon rests
const REST = [0.02, 0.4 / 7 + 1 / 7, 0.5 / 7 + 2 / 7, 0.5 / 7 + 3 / 7, 0.5 / 7 + 4 / 7, 0.5 / 7 + 5 / 7, 0.9]

export default function DemoPages() {
  const [page, setPage] = React.useState(0)
  return (
    <div className="w-full">
      <DragonTypeSpecimen progress={REST[page]} height="100svh" />
      <nav className="flex w-full flex-wrap justify-center gap-2 bg-[#0b0a0b] px-4 py-5">
        {PAGES.map((p, i) => (
          <button
            key={p}
            onClick={() => setPage(i)}
            className={
              "rounded-full border border-[#f7d117] px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.25em] " +
              (i === page ? "bg-[#f7d117] text-[#0b0a0b]" : "text-[#f7d117]")
            }
          >
            {p}
          </button>
        ))}
      </nav>
    </div>
  )
}
