"use client"

import GildedLotusPreloader from "@/components/ui/gilded-lotus-preloader"

// Ink on charcoal, for a dark portfolio: the gold is the only light in the room.
export default function DemoNoir() {
  return (
    <GildedLotusPreloader
      loop
      preset="noir"
      seed={29}
      meta="Nocturne · Motion & Film"
      title="Nocturne"
      tagline="Every frame a quiet one"
    />
  )
}
