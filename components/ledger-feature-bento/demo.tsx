"use client"

import LedgerFeatureBento from "@/components/ui/ledger-feature-bento"

export default function Demo() {
  return (
    <LedgerFeatureBento
      eyebrow="Ledgerline · Autopilot"
      heading="Bookkeeping that"
      headingAccent="keeps itself."
      matched={1284}
      total={1290}
      receipts={[
        { merchant: "Figma", amount: "€45.00", category: "Software", color: "#a259ff" },
        { merchant: "Lufthansa", amount: "€318.20", category: "Travel", color: "#ffb000" },
        { merchant: "AWS", amount: "€212.33", category: "Hosting", color: "#ff9900" },
        { merchant: "Blue Bottle", amount: "€6.50", category: "Meals", color: "#3fa9f5" },
        { merchant: "WeWork", amount: "€740.00", category: "Office", color: "#e8e8e8" },
      ]}
    />
  )
}
