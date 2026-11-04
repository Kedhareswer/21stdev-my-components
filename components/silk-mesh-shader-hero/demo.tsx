"use client"

import SilkMeshShaderHero from "@/components/ui/silk-mesh-shader-hero"

export default function Demo() {
  return (
    <SilkMeshShaderHero
      eyebrow="New — the Atelier 04 collection"
      title={"Light, *woven*\ninto motion."}
      description="Hand-finished silks dyed in small batches, cut to move with you and catch every lamp in the room."
      primaryCta={{ label: "Explore the collection", href: "#" }}
      secondaryCta={{ label: "Watch the film" }}
      caption={"Atelier 04\nAutumn / Winter"}
      palette="claret"
    />
  )
}
