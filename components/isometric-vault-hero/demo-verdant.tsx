"use client"

import IsometricVaultHero from "@/components/ui/isometric-vault-hero"

// The same machine rebranded: a different wordmark, copy, palette and a
// stricter guard out of the box. Still dark — the component has no light mode.
export default function DemoVerdant() {
  return (
    <IsometricVaultHero
      brand="ledgerline"
      eyebrow="SOC 2 · ISO 27001"
      headline={"Every Record,\nVerified."}
      subtitle="Stream, scrub and seal customer data before it ever touches your warehouse."
      primaryCta={{ label: "Book a demo", href: "#" }}
      secondaryCta="Watch the pipeline"
      navCta={{ label: "Start free", href: "#" }}
      accent="#4ade9b"
      ink="#e3ece6"
      background="#0a0f0d"
      surface="#16211c"
      strictness={0.8}
      speed={1.6}
      securedStart={2048000}
      steps={[
        { title: "Collect", body: "Events arrive from apps, forms and partners, untrusted until checked." },
        { title: "Scrub", body: "PII is masked, duplicates merged, schemas enforced in the chamber." },
        { title: "Seal", body: "Verified rows are signed on the way out. Failures wait in quarantine for review." },
      ]}
    />
  )
}
