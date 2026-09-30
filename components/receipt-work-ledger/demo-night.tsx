"use client"

import ReceiptWorkLedger from "@/components/ui/receipt-work-ledger"

// A photographer's index on a dark wall, with no banding and a short list.
export default function DemoNight() {
  return (
    <div className="w-full">
      <ReceiptWorkLedger
        title="Shoots"
        statementNo={3}
        account="Ana Ruiz"
        wall="#18181a"
        paper="#efece4"
        ink="#111111"
        band=""
        balance="One more roll"
        entries={[
          { title: "Salt flats, dawn", dept: "Travel", year: 2026, client: "Kite Magazine", summary: "Four mornings, one tripod, no wind." },
          { title: "Hands of the market", dept: "Portrait", year: 2025, summary: "Forty stallholders photographed at the same height." },
          { title: "Night bus 47", dept: "Street", year: 2025, summary: "The last route of the night, end to end." },
          { title: "Kiln, second firing", dept: "Commercial", year: 2024, client: "Kiln", summary: "Product stills for a ceramics shop." },
          { title: "Grandmother's garden", dept: "Portrait", year: 2023, summary: "A year of Sundays." },
          { title: "Harbour fog", dept: "Travel", year: 2022, summary: "Eleven frames from the same pier." },
        ]}
      />
    </div>
  )
}
