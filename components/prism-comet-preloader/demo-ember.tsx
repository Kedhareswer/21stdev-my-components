"use client"

import PrismCometPreloader from "@/components/ui/prism-comet-preloader"

// Your own words and light: an ember palette, your own pass labels, a faster
// flow, and no compositing grid.
export default function DemoEmber() {
  return (
    <PrismCometPreloader
      loop
      word="Solstice"
      caption="Festival of light · Night one"
      passes={["Kindling", "Bloom", "Flame", "Meteor", "Solstice"]}
      palette={{
        background: "#070302",
        blue: "#b3261e",
        violet: "#ff6a1a",
        magenta: "#ffb02e",
        cyan: "#fff1c2",
        gold: "#ffd36b",
      }}
      speed={1.4}
      grid={false}
      durationMs={5200}
    />
  )
}
