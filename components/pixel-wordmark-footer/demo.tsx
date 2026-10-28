"use client"

import PixelWordmarkFooter from "@/components/ui/pixel-wordmark-footer"

export default function Demo() {
  return (
    <div style={{ background: "#050506" }}>
      <div style={{ height: "60svh", display: "grid", placeItems: "center", color: "rgba(255,255,255,.55)", fontSize: 15, fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
        Scroll down: the wordmark gathers its pixels.
      </div>
      <PixelWordmarkFooter />
    </div>
  )
}
