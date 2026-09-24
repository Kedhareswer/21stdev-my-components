"use client"

import BubbleGraffitiPreloader from "@/components/ui/bubble-graffiti-preloader"

/** Runs once, then pixel-wipes into whatever you wrap. Reload to replay. */
export default function RevealDemo() {
  return (
    <BubbleGraffitiPreloader word="yo!" brand="studio" duration={3600} slate="REEL 02">
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[#6a9fe2] px-6 text-center text-[#131313]">
        <span className="font-mono text-[11px] uppercase tracking-[0.3em]">loaded</span>
        <h2 className="text-5xl font-black tracking-tight sm:text-7xl">You made it in.</h2>
        <p className="max-w-sm text-sm opacity-70">Children render under the pixel wipe once the counter hits 100.</p>
      </div>
    </BubbleGraffitiPreloader>
  )
}
