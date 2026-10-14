"use client"

import HitchCargoLanding from "@/components/ui/hitch-cargo-landing"

// The same page as a different company: Kerbside leases cargo bikes to
// delivery and trades fleets. The preset swaps the brand, the safety-yellow
// paint, the builds, the parts list and every line of copy; any of it can be
// overridden again with props, as the parcel box price is here.
export default function DemoFleet() {
  return (
    <HitchCargoLanding
      preset="fleet"
      modules={{ box: { price: 590 } }}
      onReserve={(r) => console.log("quote requested", r)}
    />
  )
}
