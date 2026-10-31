"use client"

import CutoutSentence from "@/components/ui/cutout-sentence"

export default function Demo() {
  // w-full is load-bearing: 21st centres every demo in a flex wrapper, and a
  // flex item left at width:auto shrinks to its contents. The spacer below
  // gives the last scroll beat somewhere to land.
  return (
    <div className="w-full">
      <CutoutSentence />
      <div className="h-[40svh]" />
    </div>
  )
}
