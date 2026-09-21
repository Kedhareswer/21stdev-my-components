"use client"

import TumblingCubePreloader from "@/components/ui/tumbling-cube-preloader"

/**
 * No reel at all: the shader renders its own procedural film plate. What an
 * installer sees before pointing `videoSrc` anywhere, and what shows if their
 * reel is slow, blocked or 404s.
 */
export default function DemoPlate() {
  return <TumblingCubePreloader loop word="STUDIO" videoSrc="" shaderPreset="highcontrast" />
}
