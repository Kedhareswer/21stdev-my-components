"use client"

import * as React from "react"
import SkeletonKeyPreloader from "@/components/ui/skeleton-key-preloader"

// unlock="key": the gate holds at 100 until the key goes into the lock (drop
// it in, click it, or press Enter). Behind it is just an empty stage, so the
// dive has somewhere to land; "Lock it again" remounts the gate.
export default function DemoGate() {
  const [key, setKey] = React.useState(0)
  return (
    <SkeletonKeyPreloader key={key} unlock="key" height="100svh">
      <div className="flex items-center justify-center bg-background" style={{ height: "100svh" }}>
        <button
          onClick={() => setKey((k) => k + 1)}
          className="rounded-full border border-border px-5 py-2.5 text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:bg-foreground hover:text-background"
        >
          Lock it again
        </button>
      </div>
    </SkeletonKeyPreloader>
  )
}
