"use client"

import PushpinTearFooter from "@/components/ui/pushpin-tear-footer"

export default function Demo() {
  // w-full is load-bearing: 21st centres every demo in a flex wrapper, and a
  // flex item left at width:auto shrinks to its contents.
  return (
    <div className="w-full bg-[#1a7ff0]">
      <PushpinTearFooter />
    </div>
  )
}
