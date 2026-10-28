"use client"

import GlassPricingCards from "@/components/ui/glass-pricing-cards"

export default function Demo() {
  return <GlassPricingCards onPlanSelect={(plan, yearly) => console.log(plan.name, yearly ? "yearly" : "monthly")} />
}
