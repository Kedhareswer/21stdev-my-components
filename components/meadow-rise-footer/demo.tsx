"use client"

import MeadowRiseFooter from "@/components/ui/meadow-rise-footer"

export default function Demo() {
  // w-full matters: 21st centres demos in a flex wrapper, and a flex item
  // left at width:auto shrinks the canvas to 0px wide.
  return (
    <div className="w-full">
      <MeadowRiseFooter />
    </div>
  )
}
