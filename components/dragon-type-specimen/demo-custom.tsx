"use client"

import DragonTypeSpecimen from "@/components/ui/dragon-type-specimen"

export default function DemoCustom() {
  return (
    <div className="w-full">
      <DragonTypeSpecimen
        title="WYVERN"
        subtitle="DISPLAY"
        studio="NORTH FORGE"
        year="2027"
        specimenWord="VENOM"
        background="#0f3b2c"
        night="#050807"
        ink="#e8f0c8"
        dragonColor="#23201c"
        eyeColor="#9dff3a"
        defaultStyle="bold"
        scrollDistance="600svh"
      />
    </div>
  )
}
