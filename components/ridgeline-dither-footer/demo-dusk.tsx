"use client"

import RidgelineDitherFooter from "@/components/ui/ridgeline-dither-footer"

export default function DemoDusk() {
  return (
    <div className="w-full">
      <RidgelineDitherFooter preset="dusk" seed={4} pixel={3} mist={0.9} name="Hollow Pine" height="620px" />
    </div>
  )
}
