"use client"

import HalftoneFlowHero from "@/components/ui/halftone-flow-hero"

export default function DemoCobalt() {
  return (
    <HalftoneFlowHero
      palette="cobalt"
      badge="Now with live data"
      title={"Ask your numbers\n*anything.*"}
      description="Plain-English questions in, charts and answers out. Connected to the warehouse you already have."
      prompts={["Why did churn rise in March?", "Show revenue by region this quarter", "Which plan converts best from trial?"]}
      ctaLabel="Ask"
      proof="Answering 40,000 questions a day"
      avatars={["RV", "NO", "TK"]}
    />
  )
}
