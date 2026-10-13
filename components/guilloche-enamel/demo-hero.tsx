"use client"

import GuillocheEnamel from "@/components/ui/guilloche-enamel"

export default function HeroDemo() {
  return (
    <GuillocheEnamel>
      <div className="pointer-events-none flex h-full w-full items-end bg-gradient-to-t from-black/70 via-black/10 to-transparent px-5 pb-12 sm:items-center sm:bg-gradient-to-r sm:from-black/55 sm:via-black/15 sm:px-[7vw] sm:pb-0">
        <div className="pointer-events-auto max-w-[26rem] text-white">
          <p className="text-[13px] font-medium tracking-[0.08em] text-white/70 uppercase">Grand-feu flinqué</p>
          <h1 className="mt-4 text-[clamp(2.2rem,4.2vw,3.6rem)] leading-[1.02] font-semibold tracking-[-0.03em] text-balance">
            Cut on a rose engine. Fired in glass.
          </h1>
          <p className="mt-5 max-w-[21rem] text-[17px] leading-relaxed text-white/75">
            Every groove on this plate is turned by hand before the enamel goes on. Move the light across it and watch them catch.
          </p>
          <a
            href="#"
            className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-6 text-[15px] font-semibold text-neutral-950 transition-transform duration-150 ease-out hover:-translate-y-px active:scale-[0.97] motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            See the dials
          </a>
        </div>
      </div>
    </GuillocheEnamel>
  )
}
