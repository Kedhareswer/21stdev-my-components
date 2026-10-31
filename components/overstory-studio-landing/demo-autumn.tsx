"use client"

import OverstoryStudioLanding from "@/components/ui/overstory-studio-landing"

// The same studio in October: amber leaves, a different ring of trees, and its
// own words in the headline.
export default function DemoAutumn() {
  return (
    <OverstoryStudioLanding
      brand="Understory"
      season="autumn"
      seed={23}
      status="Two seats left for the winter cohort"
      hero={{ lead: "Design and Eng For", words: ["Seed", "Series A", "B2B", "AI"], tail: "Startups." }}
      email="hello@understory.studio"
      footer={{ city: "Montreal", timeZone: "America/Toronto", note: "Made under falling leaves." }}
      onBook={() => {
        if (typeof window !== "undefined") window.alert("This is where your booking link opens.")
      }}
    />
  )
}
