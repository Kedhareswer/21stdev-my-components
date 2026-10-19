"use client"

import * as React from "react"
import SkeletonKeyPreloader from "@/components/ui/skeleton-key-preloader"

// The real use: the gate guards the portfolio, waits at 100 for the visitor to
// drop the key into the lock (or click it, or press Enter), then dives through
// the keyhole onto the page. "Lock it again" remounts it.

const WORK = [
  { t: "Reverie", k: "Identity", y: "2026" },
  { t: "Salt & Ash", k: "Editorial", y: "2025" },
  { t: "Night Garden", k: "Motion", y: "2025" },
  { t: "Paper Saints", k: "Type", y: "2024" },
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
          <span>lacrimaez — portfolio 1.0</span>
          <button
            onClick={() => setKey((k) => k + 1)}
            className="rounded-full border border-border px-4 py-2 transition-colors hover:bg-foreground hover:text-background"
          >
            Lock it again
          </button>
        </header>
        <h1 className="font-medium leading-[0.9] tracking-tight" style={{ fontSize: "clamp(44px, 9vw, 140px)" }}>
          Selected work,
          <br />
          <span className="text-muted-foreground">unlocked.</span>
        </h1>
        <ul className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-4">
          {WORK.map((w) => (
            <li key={w.t} className="flex flex-col gap-6 bg-background p-5">
              <span className="text-xs uppercase tracking-widest text-muted-foreground">
                {w.k} · {w.y}
              </span>
              <span className="text-lg font-medium">{w.t}</span>
            </li>
          ))}
        </ul>
      </main>
    </SkeletonKeyPreloader>
  )
}
