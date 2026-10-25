"use client"

import * as React from "react"
import GildedLotusPreloader from "@/components/ui/gilded-lotus-preloader"

// Driven by real progress: a stand-in asset queue that surges and stalls.
// When the ink parts, the page underneath is already there.
const STEPS = [5, 3, 9, 2, 0, 0, 8, 12, 4, 0, 6, 11, 5, 0, 0, 7, 9, 10, 9]

export default function DemoIvory() {
  const [loaded, setLoaded] = React.useState(0)

  React.useEffect(() => {
    let i = 0
    let v = 0
    const t = setInterval(() => {
      v = Math.min(100, v + (STEPS[i++ % STEPS.length] ?? 5))
      setLoaded(v)
      if (v >= 100) clearInterval(t)
    }, 230)
    return () => clearInterval(t)
  }, [])

  return (
    <GildedLotusPreloader
      preset="ivory"
      progress={loaded}
      meta="Studio Ōka · Selected work"
      title="Ōka"
      tagline="Lacquer · Light · Line"
    >
      <main className="flex min-h-full flex-col items-center justify-center gap-5 bg-background px-6 py-24 text-center text-foreground">
        <p className="text-[10px] uppercase tracking-[0.34em] text-muted-foreground">Studio Ōka</p>
        <h1 className="max-w-3xl font-serif text-5xl leading-none tracking-tight md:text-7xl">Objects that keep their stillness.</h1>
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
          The preloader has opened onto the page beneath it. Put your own landing here.
        </p>
      </main>
    </GildedLotusPreloader>
  )
}
