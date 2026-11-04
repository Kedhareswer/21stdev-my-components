"use client"

import RouteBranchConnector from "@/components/ui/route-branch-connector"

export default function Demo() {
  return (
    <RouteBranchConnector
      eyebrow="Model router"
      heading="Every request finds its route"
      source="Incoming"
      targets={[
        {
          name: "Swift",
          meta: "p95 · 140 ms",
          example: "What's the capital of Portugal?",
          reason: "A short factual question. The smallest model answers it in a blink, at a fraction of the cost.",
          color: "#38bdf8",
        },
        {
          name: "Balanced",
          meta: "p95 · 900 ms",
          example: "Summarise this 12-page contract for a client.",
          reason: "Long input but a familiar task. The mid-size model reads it all and keeps the cost down.",
          color: "#a78bfa",
        },
        {
          name: "Deep reasoning",
          meta: "p95 · 6.2 s",
          example: "Why does this migration deadlock under load?",
          reason: "Multi-step debugging. Worth the extra seconds for a model that thinks it through.",
          color: "#fbbf24",
        },
        {
          name: "Vision",
          meta: "image + text",
          example: "What's wrong with this chart? [screenshot]",
          reason: "The request carries an image, so it goes to the model that can see.",
          color: "#a3e635",
        },
      ]}
    />
  )
}
