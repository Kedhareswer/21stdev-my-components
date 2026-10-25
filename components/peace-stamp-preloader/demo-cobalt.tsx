"use client"

import PeaceStampPreloader from "@/components/ui/peace-stamp-preloader"

// A second printing: cobalt and coral plates, a coral hand, a dollar value.
export default function DemoCobalt() {
  return (
    <PeaceStampPreloader
      loop
      preset="cobalt"
      word="UNI"
      leftText="FIRST CLASS"
      rightText="REGISTERED"
      year="1968"
      value={0.5}
      currency="$"
      decimal="."
      postmark="RECEIVED"
      label="Arriving"
    />
  )
}
