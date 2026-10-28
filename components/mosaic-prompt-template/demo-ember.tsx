"use client"

import MosaicPromptTemplate from "@/components/ui/mosaic-prompt-template"

// The same page in a warmer key, retitled for a team that builds internal tools.
export default function Demo() {
  return (
    <MosaicPromptTemplate
      brand="Foundry"
      accent="ember"
      headline={["Describe the tool", "Ship it by lunch"]}
      prompts={[
        "An approvals queue for expense reports, with Slack nudges...",
        "A stock counter for our three warehouses, scanned by phone...",
        "An on-call handover board with notes that roll over each shift...",
      ]}
      platforms={[
        { label: "Internal tool", icon: "window" },
        { label: "Field app", icon: "phone" },
        { label: "Report", icon: "bars" },
      ]}
      models={["Quick", "Thorough"]}
      featuresTitle="Less glue"
      pricingTitle="Per team"
      footerNote="Tools your team asked for."
    />
  )
}
