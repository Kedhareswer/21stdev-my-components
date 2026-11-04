"use client"

import OdometerCurrencyConverter from "@/components/ui/odometer-currency-converter"

export default function Demo() {
  return (
    <div className="flex min-h-[760px] w-full items-center justify-center bg-background px-4 py-12">
      <OdometerCurrencyConverter from="USD" to="EUR" amount={2500} />
    </div>
  )
}
