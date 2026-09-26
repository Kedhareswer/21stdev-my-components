"use client"

import * as React from "react"
import FoundationPrimitives, { type FoundationItem } from "@/components/ui/foundation-primitives"

// Your own primitives: other shapes, other palettes, your own specimen content,
// and the selection lifted out so the page around it can react.
const ITEMS: FoundationItem[] = [
  {
    label: "Radius",
    description: "Corner radii from sharp to fully round, one step per surface size.",
    shape: "cube",
    colors: ["#14b8a6", "#b8f3e8"],
    tile: "disc",
    meta: "6 steps",
    specimen: (
      <div className="flex flex-wrap items-end gap-3">
        {[0, 4, 8, 12, 20, 999].map((r) => (
          <div key={r} className="flex flex-col items-center gap-2 text-xs text-muted-foreground">
            <div className="size-14 border-2 border-teal-500/70 bg-teal-500/10" style={{ borderRadius: Math.min(r, 28) }} />
            {r === 999 ? "full" : r}
          </div>
        ))}
      </div>
    ),
  },
  {
    label: "Elevation",
    description: "Five depths of shadow and blur that say what sits above what.",
    shape: "torus",
    colors: ["#f43f5e", "#fecdd3"],
    tile: "square",
    meta: "5 levels",
    specimen: "none",
  },
  {
    label: "Motion",
    description: "Durations and easing curves that make every transition feel related.",
    shape: "pill",
    colors: ["#eab308", "#fef08a"],
    tile: "square",
    meta: "3 curves",
    specimen: "spacing",
  },
  {
    label: "Color",
    description: "Brand and semantic colours with their tints, ready as tokens.",
    shape: "sphere",
    colors: ["#6366f1", "#c7d2fe"],
    tile: "none",
    meta: "40 tokens",
    specimen: "color",
  },
]

export default function DemoCustom() {
  const [picked, setPicked] = React.useState<number | null>(0)
  return (
    <div className="w-full">
      <FoundationPrimitives
        title="Primitives"
        description="Four more building blocks. Pick one in the card or in the list, the two stay in step."
        sectionTitle={picked == null ? "Tokens" : "Tokens · " + ITEMS[picked].label}
        items={ITEMS}
        selected={picked}
        onSelect={setPicked}
        glow={0.8}
        shadow={0.7}
      />
    </div>
  )
}
