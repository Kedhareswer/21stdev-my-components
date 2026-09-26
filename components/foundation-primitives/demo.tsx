"use client"

import FoundationPrimitives from "@/components/ui/foundation-primitives"

export default function Demo() {
  return (
    // w-full matters: 21st centres demos in a flex wrapper, and a flex item left
    // at width:auto shrinks the page to its content.
    <div className="w-full">
      <FoundationPrimitives />
    </div>
  )
}
