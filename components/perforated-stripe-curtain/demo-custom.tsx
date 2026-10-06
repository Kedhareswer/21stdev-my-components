"use client"

import PerforatedStripeCurtain from "@/components/ui/perforated-stripe-curtain"

// A gig-night teaser: thirty sodium-yellow strips on midnight blue, a cobalt
// spotlight behind, faster groove, the band's own words on the stage.
export default function DemoCustom() {
  return (
    <div className="relative w-full">
      <PerforatedStripeCurtain
        strips={30}
        stripColor="#ffd23f"
        idleColor="#3b4a6b"
        background="#0a1022"
        lightColor="#2f6bff"
        captions={["TONIGHT", "MIDNIGHT", "ROOM 27", "SOLD OUT"]}
        title="Kedhar · Live at Room 27"
        credit="Doors 9 pm — press play"
        bpm={132}
        volume={0.6}
      />
    </div>
  )
}
