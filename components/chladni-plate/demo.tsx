"use client"

import ChladniPlate from "@/components/ui/chladni-plate"

export default function Demo() {
  // The plate alone. w-full matters: 21st centres demos in a flex wrapper, and
  // a flex item left at width:auto shrinks the canvas to 0px wide.
  return (
    <div className="w-full">
      <ChladniPlate />
    </div>
  )
}
