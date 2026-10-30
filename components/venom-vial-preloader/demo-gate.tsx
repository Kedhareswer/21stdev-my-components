"use client"

import * as React from "react"
import VenomVialPreloader from "@/components/ui/venom-vial-preloader"

// The real use: the vial guards a portfolio, and its fog clears onto it.
export default function DemoGate() {
  const [run, setRun] = React.useState(0)

  return (
    <VenomVialPreloader key={run} total={18.6} doneLabel="Everything is brewed.">
      <main className="flex min-h-full flex-col items-center justify-center gap-6 bg-background px-6 py-16 text-center text-foreground">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Selected work · 2019 — 2026</p>
        <h1 className="text-5xl font-semibold tracking-tight sm:text-7xl">Potent things, carefully made.</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          The fog has cleared. Whatever you pass as children sits here, mounted the whole time underneath.
        </p>
        <button
          type="button"
          onClick={() => setRun((n) => n + 1)}
          className="rounded-full border border-border px-5 py-2 text-sm hover:bg-primary hover:text-primary-foreground"
        >
          Brew it again
        </button>
      </main>
    </VenomVialPreloader>
  )
}
