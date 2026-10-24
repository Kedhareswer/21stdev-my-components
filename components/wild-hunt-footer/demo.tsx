"use client"

import WildHuntFooter from "@/components/ui/wild-hunt-footer"

export default function Demo() {
  // w-full matters: 21st centres demos in a flex wrapper, and a flex item
  // left at width:auto shrinks the canvases to 0px wide.
  return (
    <div className="w-full">
      <WildHuntFooter />
    </div>
  )
}
