"use client"

import HelixRibbonHero from "@/components/ui/helix-ribbon-hero"

export default function Demo() {
  return (
    // width: 100% is load-bearing. 21st centres every demo in a flex wrapper,
    // and a flex item left at width: auto shrinks a full-bleed hero to a strip.
    <main style={{ width: "100%" }}>
      {/* autoPlay is for this unattended preview: the scroll story loops until you scroll. */}
      <HelixRibbonHero autoPlay />
    </main>
  )
}
