"use client"

import PeacockTrainPreloader from "@/components/ui/peacock-train-preloader"

// The dark preset: luminous teal and violet plumes on night paper, a lusher train.
export default function DemoMidnight() {
  return (
    <PeacockTrainPreloader
      loop
      preset="midnight"
      density="lush"
      spread={320}
      seed={11}
      title="Nocturne"
      subtitle="Vol. II"
      meta={["Autumn 2026", "Selected work · after dark"]}
      message="Good evening."
      signature="©NOCTURNE"
      label="Opening"
    />
  )
}
