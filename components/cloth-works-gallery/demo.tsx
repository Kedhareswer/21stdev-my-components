"use client"

import ClothWorksGallery from "@/components/ui/cloth-works-gallery"

export default function Demo() {
  return (
    // width: 100% is load-bearing. 21st centres every demo in a flex wrapper,
    // and a flex item left at width: auto shrinks a full-bleed section to a strip.
    <main style={{ width: "100%" }}>
      {/* autoPlay is for this unattended preview: the row drifts on its own until you drag it. */}
      <ClothWorksGallery autoPlay />
    </main>
  )
}
