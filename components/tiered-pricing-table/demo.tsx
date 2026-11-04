"use client"

import TieredPricingTable from "@/components/ui/tiered-pricing-table"

export default function Demo() {
  return (
    <div className="flex min-h-[900px] w-full items-center justify-center bg-background px-4 py-12">
      <TieredPricingTable onSelect={(tier, plan) => console.log(tier, plan)} />
    </div>
  )
}
