"use client"

import ScrollIsland from "@/components/ui/scroll-island"

const ITEMS = [
  { id: "inbox", label: "Inbox", meta: "12", active: true, icon: <span>✉</span> },
  { id: "starred", label: "Starred", icon: <span>★</span> },
  { id: "archive", label: "Archive", icon: <span>▤</span> },
]

export default function DemoLeft() {
  return (
    <div className="min-h-screen bg-background">
      <ScrollIsland
        side="left"
        items={ITEMS}
        clock={false}
        accent="#F97316"
        openWidth={210}
        aria-label="Mail shortcuts"
      />

      <div className="mx-auto max-w-2xl px-6 py-24">
        <h1 className="text-4xl font-semibold tracking-tight text-foreground">
          Left edge, own items, no clock.
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Icons are any inline node, so plain characters work as well as SVGs.
        </p>
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="mt-10 h-48 rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  )
}
