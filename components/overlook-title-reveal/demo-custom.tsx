"use client"

import OverlookTitleReveal from "@/components/ui/overlook-title-reveal"

// Same ballroom, another print run: night inks on grey stock, your own billing.
export default function DemoCustom() {
  return (
    <div className="w-full">
      <OverlookTitleReveal
        title={"ALL WORK\nNO PLAY"}
        palette={["#07121a", "#0d2a36", "#145a63", "#2e8f8a", "#8fcfb8", "#e8f1e4"]}
        paper="#dfe3dc"
        ink="#12303a"
        accent="#145a63"
        seed={23}
        credit="A studio of one presents"
        billing={[
          ["starring", "Your Name Here"],
          ["music by", "the hum of a CRT"],
          ["shot on", "a 2D canvas"],
        ]}
        edition="04 / 25"
      />
    </div>
  )
}
