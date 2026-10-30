"use client"

import StrobeDivaFooter from "@/components/ui/strobe-diva-footer"

export default function Demo() {
  // w-full matters: 21st centres demos in a flex wrapper, and a flex item
  // left at width:auto shrinks the stage to 0px wide.
  return (
    <div className="w-full">
      <StrobeDivaFooter />
    </div>
  )
}
