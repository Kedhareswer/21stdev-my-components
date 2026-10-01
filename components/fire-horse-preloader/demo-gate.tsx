"use client"

import * as React from "react"
import FireHorsePreloader from "@/components/ui/fire-horse-preloader"

// The real use: the preloader guards a page and lifts off it at the end.
export default function DemoGate() {
  const [run, setRun] = React.useState(0)

  return (
    <FireHorsePreloader key={run}>
      <main className="flex min-h-full flex-col items-center justify-center gap-6 bg-background px-6 py-16 text-center text-foreground">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Bính Ngọ · 2026</p>
        <h1 className="font-serif text-5xl italic tracking-tight sm:text-7xl">Chúc Mừng Năm Mới</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          The gate has lifted. Whatever you pass as children sits here, mounted the whole time underneath.
        </p>
        <button
          type="button"
          onClick={() => setRun((n) => n + 1)}
          className="rounded-full border border-border px-5 py-2 text-sm hover:bg-primary hover:text-primary-foreground"
        >
          Replay the loader
        </button>
      </main>
    </FireHorsePreloader>
  )
}
