"use client"

import RidgelineDitherFooter from "@/components/ui/ridgeline-dither-footer"

export default function Demo() {
  // w-full matters: 21st centres demos in a flex wrapper, and a flex item
  // left at width:auto shrinks the canvas to 0px wide.
  return (
    <div className="w-full">
      <RidgelineDitherFooter />
    </div>
  )
}
