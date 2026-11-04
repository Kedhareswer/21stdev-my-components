"use client"

import PixelWaveLoader from "@/components/ui/pixel-wave-loader"

const tiles = [
  { pattern: "diagonal" as const, from: "#ffcf8a", to: "#e0573a", label: "Diagonal" },
  { pattern: "radial" as const, from: "#c7b8ff", to: "#5b47e0", label: "Radial" },
  { pattern: "ripple" as const, from: "#d9ffe9", to: "#14a37f", label: "Ripple" },
  { pattern: "snake" as const, label: "Snake" },
]

export default function Demo() {
  return (
    <div className="min-h-[100svh] w-full bg-background text-foreground flex flex-col items-center justify-center gap-14 px-5 py-16">
      <PixelWaveLoader rows={7} cols={7} size="24px" gap="7px" pattern="radial" from="#ffd39a" to="#d8462c" duration={1.7} label="Preparing your workspace" />
      <div className="grid w-full max-w-[820px] grid-cols-2 gap-4 sm:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="flex aspect-square flex-col items-center justify-center gap-5 rounded-[22px] border border-border">
            <PixelWaveLoader pattern={t.pattern} from={t.from} to={t.to} rows={4} cols={4} size="13px" gap="5px" />
            <span className="text-[12px] tracking-[.14em] uppercase opacity-60">{t.label}</span>
          </div>
        ))}
      </div>
      <button type="button" aria-busy="true" className="inline-flex h-12 items-center gap-3 rounded-full bg-foreground px-6 text-[15px] font-semibold text-background">
        <PixelWaveLoader rows={3} cols={3} size="4px" gap="2px" from="var(--color-background)" duration={1.2} />
        Uploading 3 files
      </button>
    </div>
  )
}
