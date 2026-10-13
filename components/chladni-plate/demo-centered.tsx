"use client"

import ChladniPlate from "@/components/ui/chladni-plate"

export default function CenteredDemo() {
  // The plate alone, in the middle of the frame, opening on the rings-and-diamonds figure.
  return (
    <div className="w-full">
      <ChladniPlate figure={9} />
    </div>
  )
}
