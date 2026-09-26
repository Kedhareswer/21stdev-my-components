"use client"

import * as React from "react"
import PixelPortal404 from "@/components/ui/pixel-portal-404"

// Same door, re-dressed: a 503 with a dusk sky, a rose cloud bank, new copy and
// a different sky of stars. Without `onEnter`, the door navigates to `href`.
export default function Demo503() {
  return (
    <div className="w-full">
      <PixelPortal404
        leftDigit="5"
        rightDigit="3"
        caption="The stars are rebooting. Wait here?"
        hoverCaption="Or slip out the back."
        linkLabel="Leave through the door"
        href="#pixel-portal-404"
        skyColors={["#e0567a", "#ffc38a"]}
        cloudColors={["#7a1050", "#c0287a", "#e6509a", "#ff8cc4", "#ffe1f0"]}
        seed={503}
      />
    </div>
  )
}
