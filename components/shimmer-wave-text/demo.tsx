"use client"

import ShimmerWaveText from "@/components/ui/shimmer-wave-text"

// The shimmer where it usually lives: an assistant thinking, a big loading
// line, a busy button and a quiet status chip. Light and dark follow the host.
export default function Demo() {
  return (
    <div className="min-h-[100svh] w-full bg-background text-foreground flex items-center justify-center px-5 py-16">
      <div className="w-full max-w-[860px] flex flex-col gap-10">
        <ShimmerWaveText
          as="h2"
          text="Loading the good part"
          className="text-[52px] sm:text-[88px] leading-[.95] tracking-[-0.035em]"
          style={{ fontFamily: "ui-serif, Georgia, 'Times New Roman', serif" }}
          lift={0.1}
          duration={2.8}
        />

        <div className="rounded-[28px] border border-border p-6 sm:p-8 shadow-[0_40px_80px_-40px_rgba(0,0,0,.35)]">
          <div className="flex items-center gap-4">
            <span
              aria-hidden="true"
              className="h-10 w-10 flex-none rounded-full"
              style={{ background: "radial-gradient(circle at 32% 28%, #ffe1b8, #e2683c 46%, #6e2335)", boxShadow: "0 0 28px rgba(226,104,60,.45)" }}
            />
            <ShimmerWaveText text="Reading 14 sources and drafting your brief…" className="text-[16px] sm:text-[17px] font-medium" />
          </div>
          <div className="mt-7 space-y-3" aria-hidden="true">
            <div className="h-3 w-11/12 rounded-full bg-border" />
            <div className="h-3 w-8/12 rounded-full bg-border" />
            <div className="h-3 w-10/12 rounded-full bg-border" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button type="button" aria-busy="true" className="h-12 rounded-full bg-foreground px-7 text-[15px] font-semibold">
            <ShimmerWaveText
              text="Publishing"
              color="color-mix(in oklab, var(--color-background) 45%, transparent)"
              highlight="var(--color-background)"
              lift={0.12}
              duration={1.8}
            />
          </button>
          <span className="inline-flex h-9 items-center gap-2 rounded-full border border-border px-4 text-[13px]">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-foreground" />
            <ShimmerWaveText text="Syncing 3 of 12 files" variant="sweep" duration={1.6} />
          </span>
        </div>
      </div>
    </div>
  )
}
