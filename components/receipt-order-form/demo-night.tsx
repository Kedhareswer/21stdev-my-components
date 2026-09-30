"use client"

import ReceiptOrderForm from "@/components/ui/receipt-order-form"

// A developer's booking slip on a dark wall. The fake request takes a second,
// so the printer visibly waits for it before printing the confirmation.
export default function DemoNight() {
  return (
    <div className="w-full">
      <ReceiptOrderForm
        title="Book"
        confirmTitle="Booked"
        series="DEV"
        startNo={41}
        services={[
          { label: "Landing page", weeks: 2, max: 3 },
          { label: "Web app", weeks: 6, max: 1 },
          { label: "Code review", weeks: 1, max: 5 },
          { label: "Workshop", weeks: 1, max: 2 },
        ]}
        budgets={["Small", "Medium", "Large"]}
        timelines={["This month", "Next quarter"]}
        reply="Calendar invite follows by email"
        wall="#18181a"
        paper="#efece4"
        ink="#111111"
        onSubmit={() => new Promise((resolve) => setTimeout(resolve, 1000))}
      />
    </div>
  )
}
