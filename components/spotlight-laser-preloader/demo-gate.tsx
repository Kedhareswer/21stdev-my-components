"use client"

import * as React from "react"
import SpotlightLaserPreloader from "@/components/ui/spotlight-laser-preloader"

// The real use: the preloader guards a page, then fades onto it.
export default function DemoGate() {
  const [run, setRun] = React.useState(0)

  return (
    <SpotlightLaserPreloader key={run} name="KEDHAR">
      <main className="flex min-h-full flex-col items-center justify-center gap-6 bg-background px-6 py-16 text-center text-foreground">
        <p className="font-mono text-xs uppercase tracking-[0.4em] text-muted-foreground">signed in light</p>
        <h1 className="text-5xl font-bold tracking-tight sm:text-7xl">Welcome in.</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          The laser has signed off. Whatever you pass as children sits here, mounted the whole time underneath.
        </p>
        <button
          type="button"
          onClick={() => setRun((n) => n + 1)}
          className="rounded-full border border-border px-5 py-2 text-sm hover:bg-primary hover:text-primary-foreground"
        >
          Replay the loader
        </button>
      </main>
    </SpotlightLaserPreloader>
  )
}
