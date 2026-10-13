"use client"

import * as React from "react"
import GalaxyStarfield, { type StarfieldPreset } from "@/components/ui/galaxy-starfield"

// A product-launch hero on the starfield. The sky switcher shows the presets live.
const SKIES = [
  { key: "prism", label: "Prism", dot: "linear-gradient(135deg,#ff1e4a,#2a6fff 50%,#23ff4b)" },
  { key: "aurora", label: "Aurora", dot: "linear-gradient(135deg,#5effc1,#2dd4bf)" },
  { key: "ember", label: "Ember", dot: "linear-gradient(135deg,#ffb347,#ff3d6e)" },
  { key: "ice", label: "Ice", dot: "linear-gradient(135deg,#ffffff,#9cc7ff)" },
] as { key: StarfieldPreset; label: string; dot: string }[]

export default function Demo() {
  const [sky, setSky] = React.useState("prism" as StarfieldPreset)

  return (
    <div className="w-full">
      <GalaxyStarfield preset={sky}>
        <div className="flex h-full w-full flex-col bg-[radial-gradient(60%_55%_at_50%_45%,rgba(0,0,0,0.55),transparent_75%)] text-white">
          <header className="flex items-center justify-between px-5 pt-5 sm:px-10 sm:pt-7">
            <a href="#" className="flex items-center gap-2.5 text-[15px] font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
              <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 1.5 14 10l8.5 2-8.5 2-2 8.5-2-8.5L1.5 12 10 10z" fill="currentColor" />
              </svg>
              Northstar
            </a>
            <nav aria-label="Main" className="hidden items-center gap-8 text-[14px] text-white/70 md:flex">
              {["Product", "Customers", "Pricing", "Changelog"].map((l) => (
                <a key={l} href="#" className="transition-colors duration-150 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
                  {l}
                </a>
              ))}
            </nav>
            <a href="#" className="inline-flex min-h-10 items-center rounded-full border border-white/25 bg-white/5 px-4 text-[13px] font-medium backdrop-blur-sm transition-colors duration-150 hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
              Sign in
            </a>
          </header>

          <div className="flex flex-1 flex-col items-center justify-center px-5 text-center">
            <a href="#" className="group inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 py-1 pr-3 pl-1 text-[13px] text-white/80 backdrop-blur-sm transition-colors hover:border-white/30 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
              <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-black">New</span>
              Deep-field search is here
              <span aria-hidden="true" className="transition-transform duration-150 group-hover:translate-x-0.5">→</span>
            </a>
            <h1 className="mt-6 max-w-[16ch] text-[clamp(2.5rem,6.4vw,5.25rem)] leading-[0.98] font-semibold tracking-[-0.035em] text-balance [text-shadow:0_2px_30px_rgba(0,0,0,0.6)]">
              Find the signal in a universe of data.
            </h1>
            <p className="mt-5 max-w-[34rem] text-[16px] leading-relaxed text-white/70 sm:text-[18px]">
              Northstar maps every event, user and trace your product emits, so the one that matters is never lost among millions.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a href="#" className="inline-flex min-h-11 items-center rounded-full bg-white px-6 text-[15px] font-semibold text-black transition-transform duration-150 ease-out hover:-translate-y-px active:scale-[0.97] motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
                Start exploring free
              </a>
              <a href="#" className="inline-flex min-h-11 items-center rounded-full border border-white/25 px-6 text-[15px] font-medium text-white backdrop-blur-sm transition-colors duration-150 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
                Book a demo
              </a>
            </div>
          </div>

          <div className="flex flex-col items-center justify-between gap-3 px-5 pb-5 sm:flex-row sm:px-10 sm:pb-7">
            <p className="text-[12px] tracking-[0.14em] text-white/45 uppercase [@media(hover:none)]:invisible">Drag to orbit</p>
            <div role="radiogroup" aria-label="Sky" className="flex gap-1 rounded-full border border-white/10 bg-black/40 p-1 backdrop-blur-sm">
              {SKIES.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  role="radio"
                  aria-checked={sky === s.key}
                  onClick={() => setSky(s.key)}
                  className={
                    "inline-flex min-h-8 items-center gap-2 rounded-full px-3 text-[12px] font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white " +
                    (sky === s.key ? "bg-white text-black" : "text-white/70 hover:text-white")
                  }
                >
                  <span aria-hidden="true" className="size-2.5 rounded-full" style={{ background: s.dot }} />
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </GalaxyStarfield>
    </div>
  )
}
