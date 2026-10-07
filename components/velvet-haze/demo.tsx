"use client"

import VelvetHaze from "@/components/ui/velvet-haze"

// The haze as a framed card on the page, the way the reference sits: the
// padding is room for the shadow and the violet glow it casts outside the box.
export default function Demo() {
  return (
    // w-full matters: 21st centres demos in a flex wrapper, and a flex item
    // left at width:auto shrinks the haze to 0px wide.
    <div className="relative flex min-h-[100svh] w-full items-center justify-center bg-background px-4 py-14 sm:px-12">
      <div className="relative w-full max-w-6xl">
        <VelvetHaze height="min(78svh, 680px)" radius="4px" />
      </div>
    </div>
  )
}
