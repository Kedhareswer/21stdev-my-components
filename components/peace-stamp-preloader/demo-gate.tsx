"use client"

import * as React from "react"
import PeaceStampPreloader from "@/components/ui/peace-stamp-preloader"

// The real use: the stamp guards a page, driven by real progress, and lifts
// off it once everything has arrived.
export default function DemoGate() {
  const [run, setRun] = React.useState(0)
  const [loaded, setLoaded] = React.useState(0)

  // Stand-in for real work: images decoding, fonts arriving, data coming back.
  React.useEffect(() => {
    setLoaded(0)
    let v = 0
    const timer = setInterval(() => {
      v = Math.min(100, v + 2 + Math.random() * 9)
      setLoaded(Math.round(v))
      if (v >= 100) clearInterval(timer)
    }, 220)
    return () => clearInterval(timer)
  }, [run])

  return (
    <PeaceStampPreloader key={run} progress={loaded} word="PAX" leftText="PAR AVION" rightText="AIR MAIL" value={1.2}>
      <main className="flex min-h-full flex-col items-center justify-center gap-6 bg-background px-6 py-16 text-center text-foreground">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Correspondence · 2026</p>
        <h1 className="font-serif text-5xl italic tracking-tight sm:text-7xl">It arrived.</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          The stamp has lifted. Whatever you pass as children sits here, mounted the whole time underneath and inert
          until the gate opens.
        </p>
        <button
          type="button"
          onClick={() => setRun((n) => n + 1)}
          className="rounded-full border border-border px-5 py-2 text-sm hover:bg-primary hover:text-primary-foreground"
        >
          Post it again
        </button>
      </main>
    </PeaceStampPreloader>
  )
}
