"use client"

import DragonTypeSpecimen from "@/components/ui/dragon-type-specimen"

export default function Demo() {
  return (
    // w-full: 21st centres demos in a flex wrapper that would shrink this to 0px.
    <div className="w-full">
      <DragonTypeSpecimen />
      <section className="flex h-[60svh] w-full items-center justify-center bg-[#0b0a0b] px-6 text-center">
        <p className="max-w-md font-mono text-xs uppercase leading-relaxed tracking-[0.3em] text-[#f7d117]">
          Scroll back up and the dragon goes back the way it came.
        </p>
      </section>
    </div>
  )
}
