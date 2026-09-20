"use client"

import TumblingCubePreloader from "@/components/ui/tumbling-cube-preloader"

/**
 * Fully offline: no reel, so the shader renders its own procedural film plate.
 * This is what an installer sees before they point `videoSrc` at anything, and
 * what shows if their reel is slow, blocked or 404s. Loops forever.
 */
export default function DemoPlate() {
  return (
    <TumblingCubePreloader
      loop
      word="STUDIO"
      videoSrc=""
      shaderPreset="highcontrast"
      height="100svh"
    />
  )
}
