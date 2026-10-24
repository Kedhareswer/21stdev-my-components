"use client"

import DuneHaulFooter from "@/components/ui/dune-haul-footer"

export default function DemoDusk() {
  // Night run: stars out, headlights on, the horizon still warm.
  return (
    <div className="w-full">
      <DuneHaulFooter preset="dusk" name="Nightfreight" honk="BEEP!" />
    </div>
  )
}
