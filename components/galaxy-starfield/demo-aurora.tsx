"use client"

import GalaxyStarfield from "@/components/ui/galaxy-starfield"

// The bare sky in the aurora preset, with wheel zoom on.
export default function DemoAurora() {
  return (
    <div className="w-full">
      <GalaxyStarfield preset="aurora" zoom autoRotate={0.25} seed={21} />
    </div>
  )
}
