"use client"

import HollowTidePreloader from "@/components/ui/hollow-tide-preloader"

// Customised: paper-and-ink palette, a heavier outline, a bare count and a
// slower, busier marquee.
export default function Demo() {
  return (
    <HollowTidePreloader
      loop
      label="Developing"
      doneLabel="Fixed"
      palette={{ background: "#ece8df", ink: "#1b1a18" }}
      strokeWidth={1.6}
      fontWeight={800}
      grain={0.7}
      marqueeSpeed={70}
      durationMs={5200}
    />
  )
}
