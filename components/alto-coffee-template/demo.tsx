"use client"

import AltoCoffeeTemplate from "@/components/ui/alto-coffee-template"

export default function Demo() {
  // w-full is load-bearing: 21st centres every demo in a flex wrapper, and a
  // flex item left at width:auto shrinks to fit its contents.
  return (
    <div className="w-full">
      <AltoCoffeeTemplate />
    </div>
  )
}
