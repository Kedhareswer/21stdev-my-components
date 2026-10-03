"use client"

import SupplyFlowGlobe from "@/components/ui/supply-flow-globe"

export default function Demo() {
  // Full-bleed: w-full is load-bearing inside 21st's centring flex, and the
  // component carries its own definite height.
  return (
    <div className="w-full">
      <SupplyFlowGlobe />
    </div>
  )
}
