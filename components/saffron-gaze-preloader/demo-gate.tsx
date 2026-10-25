"use client"

import * as React from "react"
import SaffronGazePreloader from "@/components/ui/saffron-gaze-preloader"

// The real use: the preloader guards a page. The eyes close, the window folds
// into its slit, and the black parts to reveal whatever is underneath.
export default function DemoGate() {
  const [run, setRun] = React.useState(0)

  return (
    <SaffronGazePreloader key={run} title="AARUSHI" subtitle="आरुषि" kicker="Studio Aarushi" credit={{ eyebrow: "Portfolio · 2026", name: "AARUSHI", note: "Illustration & motion" }} monogram="A">
      <main className="flex min-h-full flex-col items-center justify-center gap-6 bg-background px-6 py-16 text-center text-foreground">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Studio Aarushi · Selected work</p>
        <h1 className="text-5xl font-semibold tracking-tight sm:text-7xl">The eyes are open.</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Whatever you pass as children sits here, mounted the whole time underneath the gate, and is revealed when the black parts.
        </p>
        <button
          type="button"
          onClick={() => setRun((n) => n + 1)}
          className="rounded-full border border-border px-5 py-2 text-sm hover:bg-primary hover:text-primary-foreground"
        >
          Replay the opening
        </button>
      </main>
    </SaffronGazePreloader>
  )
}
