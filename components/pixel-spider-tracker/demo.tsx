"use client"

import * as React from "react"
import PixelSpiderTracker from "@/components/ui/pixel-spider-tracker"

// Pick a sound option, then search anywhere: "Tokyo", "India", "48.85, 2.35".
// The spider drops in while it looks, then the globe spins round to the hit.
export default function Demo() {
  return (
    // w-full: 21st centres demos in a flex wrapper that would shrink this to 0px.
    <div className="w-full">
      <PixelSpiderTracker />
    </div>
  )
}
