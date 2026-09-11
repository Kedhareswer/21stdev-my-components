"use client"

import ScrollIsland from "@/components/ui/scroll-island"

export default function Demo() {
  return (
    <div className="min-h-screen bg-background">
      <ScrollIsland />

      <div className="mx-auto max-w-2xl px-6 py-24">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Scroll</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-foreground">
          The island stays with you.
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          It is pinned to the edge of the viewport, so it rides along as the page
          moves. Hover it to open, tab into it to open, tap it on touch. Escape
          closes it again.
        </p>
        {Array.from({ length: 9 }, (_, i) => (
          <section key={i} className="mt-16 border-t border-border pt-8">
            <h2 className="text-lg font-medium text-foreground">Section {i + 1}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Keep scrolling. The rail does not move, does not reflow the page,
              and does not need a scroll listener — it is position: fixed, which
              is what pinning to the viewport actually means.
            </p>
            <div className="mt-5 h-40 rounded-xl bg-muted" />
          </section>
        ))}
      </div>
    </div>
  )
}
