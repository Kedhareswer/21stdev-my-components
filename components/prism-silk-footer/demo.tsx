"use client"

import PrismSilkFooter from "@/components/ui/prism-silk-footer"

export default function Demo() {
  // w-full matters: 21st centres demos in a flex wrapper, and a flex item
  // left at width:auto shrinks the footer to its content.
  return (
    <div className="w-full">
      <PrismSilkFooter />
    </div>
  )
}
