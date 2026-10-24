"use client"

import DuneHaulFooter from "@/components/ui/dune-haul-footer"

export default function Demo() {
  // w-full matters: 21st centres demos in a flex wrapper, and a flex item
  // left at width:auto shrinks the scene to 0px wide.
  return (
    <div className="w-full">
      <DuneHaulFooter />
    </div>
  )
}
