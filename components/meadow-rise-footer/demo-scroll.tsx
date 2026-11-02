"use client"

import MeadowRiseFooter from "@/components/ui/meadow-rise-footer"

export default function DemoScroll() {
  // A page above the footer, so the hills can settle into place on arrival.
  return (
    <div className="w-full">
      <div
        style={{ height: "110svh", display: "grid", placeItems: "center", padding: "0 24px" }}
        className="bg-background text-foreground"
      >
        <p style={{ maxWidth: "28ch", textAlign: "center", fontSize: 15, lineHeight: 1.6 }} className="text-muted-foreground">
          Scroll down slowly — the range rises and settles as the footer arrives.
        </p>
      </div>
      <MeadowRiseFooter />
    </div>
  )
}
