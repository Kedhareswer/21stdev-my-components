"use client"

import BenthosCollectionTemplate from "@/components/ui/benthos-collection-template"

export default function Demo() {
  // w-full is load-bearing: 21st centres every demo in a flex wrapper, and a
  // flex item left at width:auto shrinks to fit its contents.
  return (
    <div className="w-full">
      <BenthosCollectionTemplate />
    </div>
  )
}
