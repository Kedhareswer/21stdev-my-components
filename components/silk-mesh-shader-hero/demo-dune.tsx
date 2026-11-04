"use client"

import SilkMeshShaderHero from "@/components/ui/silk-mesh-shader-hero"

export default function DemoDune() {
  return (
    <SilkMeshShaderHero
      eyebrow="Studio sessions — open booking"
      title={"Sound you can\n*almost* touch."}
      description="A mastering room in the hills, tuned by ear and lit like late afternoon."
      primaryCta={{ label: "Book a session", href: "#" }}
      secondaryCta={{ label: "Hear the room" }}
      caption={"Studio Dune\nEst. 2014"}
      palette="dune"
    />
  )
}
