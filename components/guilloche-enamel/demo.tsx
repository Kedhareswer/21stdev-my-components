"use client"

import * as React from "react"
import GuillocheEnamel, { type GuillochePreset } from "@/components/ui/guilloche-enamel"

// A watchmaker's hero: the enamelled plate is the dial being sold, and the
// swatches change its enamel live.
const ENAMELS = [
  { key: "forest", label: "Forest", swatch: "#2f6b4c" },
  { key: "cobalt", label: "Cobalt", swatch: "#2d4fb0" },
  { key: "salmon", label: "Salmon", swatch: "#e39a80" },
  { key: "argent", label: "Argenté", swatch: "#c9ccd1" },
] as { key: GuillochePreset; label: string; swatch: string }[]

export default function Demo() {
  const [enamel, setEnamel] = React.useState("forest" as GuillochePreset)
  const current = ENAMELS.find((e) => e.key === enamel) ?? ENAMELS[0]

  return (
    <div className="w-full">
      <GuillocheEnamel preset={enamel}>
        <div className="pointer-events-none relative flex h-full w-full flex-col bg-gradient-to-t from-black/80 via-black/25 to-black/30 text-white sm:bg-gradient-to-r sm:from-black/70 sm:via-black/25 sm:to-transparent">
          <header className="pointer-events-auto flex items-center justify-between px-5 pt-5 sm:px-[6vw] sm:pt-7">
            <a href="#" className="flex items-baseline gap-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
              <span className="text-[15px] font-semibold tracking-[0.32em]">HALDEN</span>
              <span className="text-[11px] tracking-[0.18em] text-white/55 uppercase">Genève</span>
            </a>
            <nav aria-label="Main" className="hidden items-center gap-8 text-[14px] text-white/75 md:flex">
              {["Collections", "Atelier", "Enamels", "Boutiques"].map((l) => (
                <a key={l} href="#" className="transition-colors duration-150 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
                  {l}
                </a>
              ))}
            </nav>
            <a
              href="#"
              className="inline-flex min-h-10 items-center rounded-full border border-white/35 px-4 text-[13px] font-medium transition-colors duration-150 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              Book a viewing
            </a>
          </header>

          <div className="flex flex-1 items-end px-5 pb-8 sm:items-center sm:px-[6vw] sm:pb-0">
            <div className="pointer-events-auto max-w-[30rem]">
              <p className="text-[12px] font-medium tracking-[0.16em] text-white/65 uppercase">Ref. 3170 · Grand-feu flinqué</p>
              <h1 className="mt-4 text-[clamp(2.3rem,4.6vw,4rem)] leading-[1.02] font-semibold tracking-[-0.03em] text-balance">
                Cut by hand. Fired eighteen times.
              </h1>
              <p className="mt-5 max-w-[24rem] text-[16px] leading-relaxed text-white/75 sm:text-[17px]">
                Every dial is engine-turned on a 1912 rose engine, then fired under translucent enamel until the guilloché glows through. Move your cursor to turn it in the light.
              </p>

              <div className="mt-7">
                <p id="enamel-label" className="text-[12px] tracking-[0.12em] text-white/60 uppercase">
                  Enamel · <span className="text-white">{current.label}</span>
                </p>
                <div role="radiogroup" aria-labelledby="enamel-label" className="mt-3 flex gap-2.5">
                  {ENAMELS.map((e) => (
                    <button
                      key={e.key}
                      type="button"
                      role="radio"
                      aria-checked={enamel === e.key}
                      aria-label={e.label}
                      onClick={() => setEnamel(e.key)}
                      className={
                        "size-9 rounded-full border transition-transform duration-150 ease-out hover:scale-105 active:scale-95 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white " +
                        (enamel === e.key ? "border-white ring-2 ring-white/40" : "border-white/30")
                      }
                      style={{ background: e.swatch }}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                <a
                  href="#"
                  className="inline-flex min-h-11 items-center rounded-full bg-white px-6 text-[15px] font-semibold text-neutral-950 transition-transform duration-150 ease-out hover:-translate-y-px active:scale-[0.97] motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                >
                  Reserve the 3170
                </a>
                <a href="#" className="text-[15px] text-white/80 underline-offset-4 transition-colors duration-150 hover:text-white hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
                  Watch a dial being made →
                </a>
              </div>
            </div>
          </div>

          <dl className="pointer-events-auto hidden grid-cols-4 gap-8 border-t border-white/15 px-[6vw] py-5 text-[13px] sm:grid">
            {[
              ["Case", "38 mm white gold"],
              ["Movement", "Hand-wound, 72 h"],
              ["Dial", "18 layers of enamel"],
              ["Edition", "Each one numbered"],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-white/50">{k}</dt>
                <dd className="mt-1 text-white/90">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </GuillocheEnamel>
    </div>
  )
}
