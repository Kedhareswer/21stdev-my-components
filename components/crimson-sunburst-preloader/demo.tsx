"use client"

import CrimsonSunburstPreloader from "@/components/ui/crimson-sunburst-preloader"

// The same poster, re-cut: your own copy, ray count and a midnight palette.
export default function Demo() {
  return (
    <CrimsonSunburstPreloader
      artist="The Lantern Choir"
      eyebrow="Winter Tour"
      title="NOCTURNE"
      date="2026.12.21"
      venue={["Harbour Hall", "North Pier"]}
      meta="Night 03 — Encore"
      ctaLabel="Reserve a seat"
      statusLines={["Dimming the house", "Hanging the stars", "Raising the moon"]}
      rays={34}
      palette={{
        ink: "#070b14",
        red: "#1f3f78",
        ember: "#4f7fd0",
        deep: "#12224a",
        slate: "#2c2a3d",
        cream: "#e8e2cf",
        gold: "#c9a85a",
      }}
    />
  )
}
