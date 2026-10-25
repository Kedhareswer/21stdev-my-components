"use client"

import GildedGazeFooter from "@/components/ui/gilded-gaze-footer"

export default function Demo() {
  // w-full matters: 21st centres demos in a flex wrapper, and a flex item
  // left at width:auto shrinks the scene to 0px wide.
  return (
    <div className="w-full">
      <GildedGazeFooter fontHref="https://fonts.googleapis.com/css2?family=Anton&display=swap" />
    </div>
  )
}
