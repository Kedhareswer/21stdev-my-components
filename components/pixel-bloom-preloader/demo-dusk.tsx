"use client"

import PixelBloomPreloader from "@/components/ui/pixel-bloom-preloader"

// Your own sentence and colours: a moss field at dusk, lilac blooms, a finer pixel.
export default function DemoDusk() {
  return (
    <PixelBloomPreloader
      loop
      word="within"
      before={["Look", "for", "it"]}
      after={["Not", "out"]}
      flowers={16}
      pixel={0.85}
      palette={{ field: "#163a2b", ink: "#f1ead8", bloom: "#c8a2f0", rose: "#ff7a59", leaf: "#7cc46a" }}
    />
  )
}
