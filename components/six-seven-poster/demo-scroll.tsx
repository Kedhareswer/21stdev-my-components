"use client"

import SixSevenPoster from "@/components/ui/six-seven-poster"

// The same timeline driven by the page instead of a clock: scroll down and the
// 6 is painted, then the 7, then the title. Scroll back up and it unpaints.
export default function DemoScroll() {
  return (
    <div className="w-full">
      <SixSevenPoster mode="scroll" scrollLength={4.5} />
    </div>
  )
}
