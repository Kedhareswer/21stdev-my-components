"use client"

import HoneyLabelFooter from "@/components/ui/honey-label-footer"

export default function Demo() {
  // w-full matters: 21st centres demos in a flex wrapper, and a flex item
  // left at width:auto shrinks the label to 0px wide.
  return (
    <div className="w-full">
      <HoneyLabelFooter />
    </div>
  )
}
