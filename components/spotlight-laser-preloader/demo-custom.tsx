"use client"

import SpotlightLaserPreloader from "@/components/ui/spotlight-laser-preloader"

// Everything is set in code: another name, a green beam, a faster hand.
export default function DemoCustom() {
  return (
    <SpotlightLaserPreloader
      loop
      name="HELLO"
      durationMs={2600}
      palette={{ laser: "#22ff88", hot: "#eafff2" }}
    />
  )
}
