"use client"

import ReceiptWorkLedger from "@/components/ui/receipt-work-ledger"

export default function Demo() {
  // w-full is load-bearing: 21st centres every demo in a flex wrapper, and a
  // flex item left at width:auto shrinks to its contents.
  return (
    <div className="w-full">
      <ReceiptWorkLedger />
    </div>
  )
}
