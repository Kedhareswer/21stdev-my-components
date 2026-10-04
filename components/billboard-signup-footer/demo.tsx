"use client"

import BillboardSignupFooter from "@/components/ui/billboard-signup-footer"

export default function Demo() {
  // w-full is load-bearing: 21st centres every demo in a flex wrapper, and a
  // flex item left at width:auto shrinks to its contents.
  return (
    <div className="w-full bg-[#ff4419]">
      <BillboardSignupFooter />
    </div>
  )
}
