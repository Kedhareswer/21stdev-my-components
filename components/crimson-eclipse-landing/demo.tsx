"use client"

import CrimsonEclipseLanding from "@/components/ui/crimson-eclipse-landing"

export default function Demo() {
  // w-full is load-bearing: 21st centres every demo in a flex wrapper, and a
  // flex item left at width:auto shrinks to its contents — 0px here.
  return (
    <div className="w-full">
      <CrimsonEclipseLanding />
    </div>
  )
}
