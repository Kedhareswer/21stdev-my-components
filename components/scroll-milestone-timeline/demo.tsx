"use client"

import ScrollMilestoneTimeline from "@/components/ui/scroll-milestone-timeline"

export default function Demo() {
  // w-full is load-bearing: 21st centres every demo in a flex wrapper, and a
  // flex item left at width:auto shrinks to its contents — the stage would
  // measure 0px wide and lay the whole timeline out on nothing.
  return (
    <div className="w-full">
      <ScrollMilestoneTimeline />
    </div>
  )
}
