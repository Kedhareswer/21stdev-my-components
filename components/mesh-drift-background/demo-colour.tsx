"use client"

import MeshDriftBackground from "@/components/ui/mesh-drift-background"

// Same shader, a four-colour palette and a swirl under the pointer.
export default function ColourDemo() {
  return (
    <div className="w-full">
      <MeshDriftBackground
        colors={["#0b1026", "#3b2bd9", "#f0587a", "#ffc46b"]}
        brightness={0}
        contrast={1}
        grain={0.08}
        cursor="swirl"
        height="80svh"
      >
        <div className="flex h-full items-end p-8 sm:p-12">
          <h2 className="text-4xl font-semibold tracking-tight text-white sm:text-6xl">Mesh drift</h2>
        </div>
      </MeshDriftBackground>
    </div>
  )
}
