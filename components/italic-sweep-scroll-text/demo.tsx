"use client"

import ItalicSweepScrollText from "@/components/ui/italic-sweep-scroll-text"

const PAPER = "color-mix(in oklab, var(--color-background) 95%, var(--color-foreground))"
const LABEL = "text-[12px] uppercase tracking-[0.18em] text-muted-foreground"

export default function Demo() {
  return (
    <main className="text-foreground" style={{ background: PAPER }}>
      <section className="flex flex-col items-center justify-center gap-5 px-6 text-center" style={{ minHeight: "100svh" }}>
        <p className={LABEL}>Scroll-linked type</p>
        <h1 className="max-w-[18ch] text-balance text-[clamp(28px,4vw,56px)] leading-[1.05] tracking-[-0.02em]">
          Keep scrolling. The next sentence writes itself.
        </h1>
        <p className={LABEL}>Scroll down</p>
      </section>

      <ItalicSweepScrollText />

      <section className="flex flex-col items-center justify-center gap-5 px-6 text-center" style={{ minHeight: "100svh" }}>
        <p className={LABEL}>That was one eased scroll value</p>
        <h2 className="max-w-[20ch] text-balance text-[clamp(28px,4vw,56px)] leading-[1.05] tracking-[-0.02em]">
          Scroll back up and it plays in reverse.
        </h2>
      </section>
    </main>
  )
}
