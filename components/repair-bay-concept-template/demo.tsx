"use client"

import RepairBayConceptTemplate from "@/components/ui/repair-bay-concept-template"

export default function Demo() {
  // w-full matters: 21st centres demos in a flex wrapper, and a flex item left
  // at width:auto shrinks the page to nothing.
  return (
    <div className="w-full">
      <RepairBayConceptTemplate />
    </div>
  )
}
