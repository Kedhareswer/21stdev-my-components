"use client"

import * as React from "react"
import PixelBloomPreloader from "@/components/ui/pixel-bloom-preloader"

// The real use: the garden guards a portfolio, and dissolves into it pixel by pixel.
export default function DemoGate() {
  const [run, setRun] = React.useState(0)

  return (
    <PixelBloomPreloader key={run}>
      <main className="flex min-h-full flex-col items-center justify-center gap-6 bg-background px-6 py-16 text-center text-foreground">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Selected work · 2019 — 2026</p>
        <h1 className="font-serif text-5xl italic tracking-tight sm:text-7xl">Welcome back in.</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          The field has dissolved. Whatever you pass as children sits here, mounted the whole time underneath.
        </p>
        <button
          type="button"
          onClick={() => setRun((n) => n + 1)}
          className="rounded-full border border-border px-5 py-2 text-sm hover:bg-primary hover:text-primary-foreground"
        >
          Grow it again
        </button>
      </main>
    </PixelBloomPreloader>
  )
}
