"use client"

import * as React from "react"
import HollowTidePreloader from "@/components/ui/hollow-tide-preloader"

// The real use: driven by real progress, the preloader guards a page and lifts
// off it at the end. Here the "assets" are fake fetches resolving at random.
export default function DemoGate() {
  const [run, setRun] = React.useState(0)
  const [loaded, setLoaded] = React.useState(0)

  React.useEffect(() => {
    setLoaded(0)
    const timers = Array.from({ length: 12 }, (_, i) =>
      setTimeout(() => setLoaded((n) => n + 1), 300 + i * 180 + Math.random() * 1600),
    )
    return () => timers.forEach(clearTimeout)
  }, [run])

  return (
    <HollowTidePreloader key={run} progress={(loaded / 12) * 100} label="Fetching" doneLabel="Ready">
      <main className="flex min-h-full flex-col items-center justify-center gap-6 bg-background px-6 py-16 text-center text-foreground">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">12 of 12 assets</p>
        <h1 className="text-5xl font-bold tracking-tight sm:text-7xl">Everything's in.</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          The tide has gone out. Whatever you pass as children sits here, mounted the whole time underneath.
        </p>
        <button
          type="button"
          onClick={() => setRun((n) => n + 1)}
          className="rounded-full border border-border px-5 py-2 text-sm hover:bg-primary hover:text-primary-foreground"
        >
          Replay the loader
        </button>
      </main>
    </HollowTidePreloader>
  )
}
