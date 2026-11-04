"use client"

import PulseStripeHero from "@/components/ui/pulse-stripe-hero"

export default function DemoPaper() {
  return (
    <PulseStripeHero
      palette="paper"
      eyebrow="Risograph & letterpress, est. 1998"
      title="Short runs, *pulled by hand.*"
      description="A two-press print shop for zines, posters and wedding stationery, inked in small batches and dried on the line."
      cta={{ label: "Request a quote", href: "#" }}
      stats={[
        { value: 26, label: "Spot inks on the shelf" },
        { value: 1800, label: "Sheets an hour, flat out" },
        { value: 48, suffix: "h", label: "Proof turnaround" },
        { value: 27, label: "Years on the same street" },
      ]}
      logos={["Folio Press", "THE QUARTERLY", "Hen & Ink", "Marginalia", "loose leaf", "Paper Moon", "GRAIN", "Atlas Books"]}
      statementLabel="How we work"
      statement="Every job is proofed on the paper it will be printed on, under the same lamp, before a single sheet runs."
    />
  )
}
