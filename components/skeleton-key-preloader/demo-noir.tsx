"use client"

import SkeletonKeyPreloader from "@/components/ui/skeleton-key-preloader"

// Ink on black with a silver key: your own word, tags, handles and signature.
export default function DemoNoir() {
  return (
    <SkeletonKeyPreloader
      loop
      paper="#0e0e0f"
      ink="#f1eee8"
      metal="silver"
      greeting="you found the"
      word="archive"
      tags={["#noir", "#film", "#stills"]}
      handles={[
        { label: "ig/", value: "noctua.lab" },
        { label: "vimeo/", value: "noctua" },
      ]}
      signature="noctua"
      release="2.0"
      durationMs={5400}
    />
  )
}
