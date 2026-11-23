"use client"

import ItalicSweepScrollText from "@/components/ui/italic-sweep-scroll-text"

const PAPER = "color-mix(in oklab, var(--color-background) 95%, var(--color-foreground))"

// Plays on its own so the effect shows without scrolling. On a page, drop
// autoPlay and the statement follows the scroll instead (see the README).
export default function Demo() {
  return (
    <main className="w-full text-foreground" style={{ background: PAPER }}>
      <ItalicSweepScrollText autoPlay={9} />
    </main>
  )
}
