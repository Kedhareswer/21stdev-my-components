"use client"

import KilnWordmarkFooter from "@/components/ui/kiln-wordmark-footer"

export default function Demo() {
  // w-full is load-bearing: 21st centres every demo in a flex wrapper, and a
  // flex item left at width:auto shrinks to its contents.
  return (
    <div className="w-full bg-[#1c1b1b] px-[4vw] py-[8vw]">
      <KilnWordmarkFooter />
    </div>
  )
}
