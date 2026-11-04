"use client"

import PulseStripeHero from "@/components/ui/pulse-stripe-hero"

export default function DemoEmber() {
  return (
    <PulseStripeHero
      palette="ember"
      eyebrow="Payments infrastructure"
      title="Get paid in 40 countries by Friday"
      description="One integration for cards, wallets and bank transfers, with payouts that land the same day."
      cta={{ label: "Talk to sales", href: "#" }}
      stats={[
        { value: 40, label: "Countries live" },
        { value: 2.4, decimals: 1, prefix: "$", suffix: "B", label: "Processed last year" },
        { value: 99.995, decimals: 3, suffix: "%", label: "API uptime" },
        { value: 180, suffix: "ms", label: "Median authorisation" },
      ]}
      statementLabel="Why teams switch"
      statement="Finance stops chasing settlements, engineering stops maintaining five gateways, and customers just see a checkout that works."
    />
  )
}
