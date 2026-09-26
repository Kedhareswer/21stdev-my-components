"use client"

import ChromeDragonPoster from "@/components/ui/chrome-dragon-poster"

export default function Demo() {
  // w-full is load-bearing: 21st centres every demo in a flex wrapper, and a
  // flex item left at width:auto shrinks to fit its contents — which, with a
  // canvas asking for 100%, resolves to 0px wide.
  return (
    <div className="w-full">
      <ChromeDragonPoster />
    </div>
  )
}
