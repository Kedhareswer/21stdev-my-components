"use client"

import MeshDriftBackground from "@/components/ui/mesh-drift-background"

// Move the pointer over it: the spotlight follows.
export default function Demo() {
  return (
    // w-full: 21st centres demos in a flex wrapper that would shrink this to 0px.
    <div className="w-full">
      <MeshDriftBackground>
        <div className="flex h-full flex-col items-center justify-center gap-5 px-6 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.4em] text-white/45">
            WebGL background
          </p>
          <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-white sm:text-7xl">
            Quiet motion, loud ideas.
          </h1>
          <p className="max-w-md text-base text-white/60">
            Soft blobs drift under film grain. Drop anything on top.
          </p>
        </div>
      </MeshDriftBackground>
    </div>
  )
}
