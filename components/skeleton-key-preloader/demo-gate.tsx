"use client"

import * as React from "react"
import SkeletonKeyPreloader from "@/components/ui/skeleton-key-preloader"

// The real use: the gate guards the portfolio, waits at 100 for the visitor to
// drop the key into the lock (or click it, or press Enter), then dives through
// the keyhole onto the page. "Lock it again" remounts it.

const SHELVES = [
  { n: "154", k: "Open components", d: "Published on 21st.dev" },
  { n: "19", k: "Preloaders", d: "Like the one you just unlocked" },
  { n: "18", k: "Carousels", d: "Paper curls, shutters, ink" },
  { n: "17", k: "Templates", d: "Whole pages, one file each" },
]

export default function DemoGate() {
  const [key, setKey] = React.useState(0)
  return (
    <SkeletonKeyPreloader key={key} unlock="key" height="100svh">
      <main
        className="flex flex-col justify-between bg-background text-foreground"
        style={{ height: "100svh", padding: "clamp(20px, 4vw, 48px)" }}
      >
        <header className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-muted-foreground">
          <span>Kedhareswer Naidu — portfolio 1.0</span>
          <button
            onClick={() => setKey((k) => k + 1)}
            className="rounded-full border border-border px-4 py-2 transition-colors hover:bg-foreground hover:text-background"
          >
            Lock it again
          </button>
        </header>
        <div>
          <p className="mb-4 text-xs uppercase tracking-[0.2em] text-muted-foreground">About</p>
          <h1 className="max-w-[16ch] font-medium leading-[0.95] tracking-tight" style={{ fontSize: "clamp(40px, 7.5vw, 120px)" }}>
            Design engineer, building interfaces <span className="text-muted-foreground">that move.</span>
          </h1>
        </div>
        <ul className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-4">
          {SHELVES.map((s) => (
            <li key={s.k} className="flex flex-col gap-1 bg-background p-5">
              <span className="text-3xl font-medium tracking-tight">{s.n}</span>
              <span className="text-sm font-medium">{s.k}</span>
              <span className="text-xs text-muted-foreground">{s.d}</span>
            </li>
          ))}
        </ul>
      </main>
    </SkeletonKeyPreloader>
  )
}
