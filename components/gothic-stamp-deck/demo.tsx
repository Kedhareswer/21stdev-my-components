"use client"

import GothicStampDeck from "@/components/ui/gothic-stamp-deck"

export default function Demo() {
  // w-full is load-bearing: 21st centres every demo in a flex wrapper, and a
  // flex item left at width:auto shrinks to fit its contents.
  return (
    <div className="w-full">
      <GothicStampDeck />
    </div>
  )
}
