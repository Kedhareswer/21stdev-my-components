"use client"

import SkeletonKeyPreloader from "@/components/ui/skeleton-key-preloader"

// Ink on black with a silver key and a 2.0 release.
export default function DemoNoir() {
  return (
    <SkeletonKeyPreloader
      loop
      paper="#0e0e0f"
      ink="#f1eee8"
      metal="silver"
      tags={["#kedhar", "#noir", "#motion"]}
      release="2.0"
      durationMs={5400}
    />
  )
}
