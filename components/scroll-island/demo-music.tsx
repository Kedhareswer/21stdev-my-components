"use client"

import ScrollIsland from "@/components/ui/scroll-island"

/** Rich content on the open panel: anything passed as children sits above the rows. */
function NowPlaying() {
  return (
    <div className="rounded-xl bg-white/5 p-2.5">
      <div className="flex items-center gap-2.5">
        <div className="h-11 w-11 flex-none rounded-lg bg-gradient-to-br from-emerald-300 via-orange-200 to-zinc-400" />
        <div className="min-w-0">
          <div className="truncate text-[13px] font-medium text-white">Pink + White</div>
          <div className="truncate text-[12px] text-zinc-400">Frank Ocean</div>
        </div>
      </div>
      <div className="mt-2.5 h-[3px] overflow-hidden rounded-full bg-white/15">
        <div className="h-full w-[34%] rounded-full bg-white/70" />
      </div>
    </div>
  )
}

export default function DemoMusic() {
  return (
    <div className="min-h-screen bg-background">
      <ScrollIsland defaultPinned>
        <NowPlaying />
      </ScrollIsland>

      <div className="mx-auto max-w-2xl px-6 py-24">
        <h1 className="text-4xl font-semibold tracking-tight text-foreground">
          With a panel header.
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Children render above the option rows and collapse to nothing when the
          island closes. Starts pinned open here so the panel is visible without
          hovering.
        </p>
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="mt-10 h-48 rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  )
}
