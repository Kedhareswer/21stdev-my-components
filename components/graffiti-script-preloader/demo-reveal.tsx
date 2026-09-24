"use client"

import GraffitiScriptPreloader, { GraffitiLettering } from "@/components/ui/graffiti-script-preloader"

export default function Demo() {
  return (
    <GraffitiScriptPreloader word="WELCOME">
      <main className="grid h-[100svh] place-items-center bg-[#f8f4ea] px-4">
        <GraffitiLettering
          lines={["Welcome", "Home"]}
          mode="draw"
          orbit
          stars={6}
          interactive
          className="h-auto w-[min(92vw,960px)]"
        />
      </main>
    </GraffitiScriptPreloader>
  )
}
