"use client"

import InkOrbitSculpture from "@/components/ui/ink-orbit-sculpture"

export default function Demo() {
  return (
    // w-full matters: 21st centres demos in a flex wrapper, and a flex item
    // left at width:auto shrinks the canvas to 0px wide.
    <div className="relative w-full">
      <InkOrbitSculpture theme="dark" />
    </div>
  )
}
