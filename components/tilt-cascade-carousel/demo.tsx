"use client"

import TiltCascadeCarousel from "@/components/ui/tilt-cascade-carousel"

// Ten drawn travel-journal scenes, no images and no network requests.
export default function Demo() {
  // w-full is load-bearing: 21st centres every demo in a flex wrapper, and a
  // flex item left at width:auto shrinks to fit its contents.
  return (
    <div className="w-full">
      <TiltCascadeCarousel />
    </div>
  )
}
