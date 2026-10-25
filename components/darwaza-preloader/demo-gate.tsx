"use client"

import * as React from "react"
import DarwazaPreloader from "@/components/ui/darwaza-preloader"

// The gate in front of a page: real progress, children revealed through the doors.
export default function DemoGate() {
  const [progress, setProgress] = React.useState(0)
  const [ready, setReady] = React.useState(false)

  // Stand-in for whatever you are really waiting on: fonts, a hero video, an API.
  React.useEffect(() => {
    const t = setInterval(() => setProgress((p) => Math.min(100, p + 2 + Math.random() * 7)), 180)
    return () => clearInterval(t)
  }, [])

  return (
    <DarwazaPreloader progress={progress} meta="Studio · 2026" title="Pesh Karte Hain" onComplete={() => setReady(true)}>
      <main className="min-h-svh bg-background text-foreground">
        <div className="mx-auto max-w-3xl px-6 py-24 sm:py-32">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            {ready ? "Doors open" : "Behind the doors"}
          </p>
          <h1 className="mt-6 text-5xl font-semibold tracking-tight sm:text-7xl">A portfolio, presented.</h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            The page is already here while the doors are shut. The gate holds its own height, then lets the page flow
            once the camera has passed through the doorway.
          </p>
          <div className="mt-14 grid gap-4 sm:grid-cols-3">
            {["Work", "About", "Contact"].map((s) => (
              <div key={s} className="rounded-2xl border border-border p-6">
                <p className="text-sm text-muted-foreground">0{["Work", "About", "Contact"].indexOf(s) + 1}</p>
                <p className="mt-2 text-xl font-medium">{s}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </DarwazaPreloader>
  )
}
