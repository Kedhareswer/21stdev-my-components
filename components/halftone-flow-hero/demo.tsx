"use client"

import HalftoneFlowHero from "@/components/ui/halftone-flow-hero"

export default function Demo() {
  return <HalftoneFlowHero palette="ember" onSubmit={(v) => console.log("draft:", v)} />
}
