"use client"

import OverlookTitleReveal from "@/components/ui/overlook-title-reveal"

// Scroll: the picture spreads out of the letters and the title becomes a poster.
export default function Demo() {
  return (
    // w-full: 21st centres demos in a flex wrapper that would shrink this to 0px.
    <div className="w-full">
      <OverlookTitleReveal />
    </div>
  )
}
