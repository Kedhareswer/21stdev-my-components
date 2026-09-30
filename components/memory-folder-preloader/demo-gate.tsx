"use client"

import * as React from "react"
import MemoryFolderPreloader from "@/components/ui/memory-folder-preloader"

export default function DemoGate() {
  const [run, setRun] = React.useState(0)
  return (
    <MemoryFolderPreloader
      key={run}
      kicker="The Naidu family archive"
      tagline="Since 1996"
      name={"Kedhar\n& family"}
      enterLabel="Come in"
    >
      <main className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background px-6 text-center text-foreground">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">You made it in</p>
        <h1 className="max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl">The page behind the folder.</h1>
        <button
          type="button"
          onClick={() => setRun((r) => r + 1)}
          className="rounded-full border border-border px-5 py-2 text-sm font-medium hover:bg-foreground hover:text-background"
        >
          Replay the welcome
        </button>
      </main>
    </MemoryFolderPreloader>
  )
}
