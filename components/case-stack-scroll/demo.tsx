"use client"

import CaseStackScroll from "@/components/ui/case-stack-scroll"

export default function Demo() {
  // w-full is load-bearing: 21st centres every demo in a flex wrapper, and a
  // flex item left at width:auto shrinks to fit its contents.
  return (
    <div className="w-full">
      <CaseStackScroll />
    </div>
  )
}
