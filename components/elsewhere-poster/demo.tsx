"use client"

import ElsewherePoster from "@/components/ui/elsewhere-poster"

export default function Demo() {
  // w-full is load-bearing: 21st centres every demo in a flex wrapper, and a
  // flex item left at width:auto shrinks to fit its contents.
  return (
    <div className="flex min-h-[100svh] w-full items-center justify-center bg-[#0b0b0b] p-4 sm:p-8">
      <ElsewherePoster />
    </div>
  )
}
