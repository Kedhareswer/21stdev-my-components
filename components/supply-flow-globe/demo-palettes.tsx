"use client"

import * as React from "react"
import SupplyFlowGlobe, { type SupplyFlow } from "@/components/ui/supply-flow-globe"

// One story per palette. Coffee is the component's own default; the other three
// figures are illustrative, rounded to read well, not sourced trade statistics.
const STORIES = {
  coffee: {
    label: "Coffee",
    title: "Global Coffee Supply Chain",
    subtitle: "(Thousands of tonnes)",
  },
  matcha: {
    label: "Tea",
    title: "Where the World's Tea Goes",
    subtitle: "(Thousands of tonnes, illustrative)",
    roleLabels: { producer: "Gardens", hub: "Blending hubs", consumer: "Tea drinkers" },
    flows: [
      { source: "KE", target: "PK", value: 180 }, { source: "KE", target: "EG", value: 120 },
      { source: "KE", target: "GB", value: 60 }, { source: "KE", target: "AE", value: 40 },
      { source: "CN", target: "MA", value: 75 }, { source: "CN", target: "US", value: 40 },
      { source: "CN", target: "AE", value: 30 }, { source: "IN", target: "RU", value: 45 },
      { source: "IN", target: "AE", value: 50 }, { source: "IN", target: "GB", value: 20 },
      { source: "LK", target: "RU", value: 30 }, { source: "LK", target: "AE", value: 45 },
      { source: "AE", target: "IR", value: 70 }, { source: "AE", target: "IQ", value: 45 },
      { source: "AE", target: "SA", value: 40 }, { source: "GB", target: "IE", value: 20 },
      { source: "GB", target: "US", value: 25 },
    ] as SupplyFlow[],
  },
  cocoa: {
    label: "Cocoa",
    title: "From Pod to Praline",
    subtitle: "(Thousands of tonnes, illustrative)",
    roleLabels: { producer: "Growers", hub: "Grinders", consumer: "Chocolate markets" },
    flows: [
      { source: "CI", target: "NL", value: 600 }, { source: "CI", target: "BE", value: 250 },
      { source: "CI", target: "US", value: 300 }, { source: "CI", target: "MY", value: 150 },
      { source: "GH", target: "NL", value: 250 }, { source: "GH", target: "MY", value: 120 },
      { source: "EC", target: "US", value: 150 }, { source: "EC", target: "NL", value: 60 },
      { source: "CM", target: "NL", value: 120 }, { source: "CM", target: "BE", value: 60 },
      { source: "NG", target: "NL", value: 90 }, { source: "NL", target: "DE", value: 350 },
      { source: "NL", target: "FR", value: 200 }, { source: "NL", target: "GB", value: 150 },
      { source: "BE", target: "FR", value: 120 }, { source: "BE", target: "GB", value: 80 },
      { source: "DE", target: "PL", value: 100 }, { source: "MY", target: "JP", value: 120 },
      { source: "MY", target: "CN", value: 100 },
    ] as SupplyFlow[],
  },
  atlas: {
    label: "Chips",
    title: "Wafer to Market",
    subtitle: "(US$ billions, illustrative)",
    roleLabels: { producer: "Fabs", hub: "Assembly & test", consumer: "End markets" },
    format: (v: number) => "$" + v + "bn",
    flows: [
      { source: "TW", target: "CN", value: 120 }, { source: "TW", target: "MY", value: 40 },
      { source: "TW", target: "US", value: 30 }, { source: "KR", target: "CN", value: 90 },
      { source: "KR", target: "VN", value: 50 }, { source: "JP", target: "CN", value: 40 },
      { source: "JP", target: "MY", value: 15 }, { source: "CN", target: "US", value: 110 },
      { source: "CN", target: "DE", value: 50 }, { source: "CN", target: "IN", value: 40 },
      { source: "CN", target: "MX", value: 30 }, { source: "MY", target: "US", value: 40 },
      { source: "MY", target: "NL", value: 15 }, { source: "VN", target: "US", value: 35 },
      { source: "VN", target: "DE", value: 15 },
    ] as SupplyFlow[],
  },
} as const

type Palette = keyof typeof STORIES
const PALETTES = Object.keys(STORIES) as Palette[]
const MODES = ["auto", "light", "dark"] as const

export default function DemoPalettes() {
  const [palette, setPalette] = React.useState<Palette>("matcha")
  const [mode, setMode] = React.useState<(typeof MODES)[number]>("auto")
  const [projection, setProjection] = React.useState<"globe" | "map">("globe")
  const [picked, setPicked] = React.useState<string | null>(null)
  const story = STORIES[palette]

  const chip = (on: boolean) =>
    "cursor-pointer rounded-full border border-border px-3 py-1 transition-colors duration-200 motion-reduce:transition-none " +
    (on ? "bg-foreground text-background" : "bg-transparent text-muted-foreground hover:text-foreground")

  return (
    <div className="flex w-full flex-col bg-background text-foreground">
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3 text-[13px] sm:px-6">
        {PALETTES.map((p) => (
          <button key={p} type="button" aria-pressed={palette === p} onClick={() => setPalette(p)} className={chip(palette === p)}>
            {STORIES[p].label}
          </button>
        ))}
        <span className="mx-1 h-4 w-px bg-border" />
        {MODES.map((m) => (
          <button key={m} type="button" aria-pressed={mode === m} onClick={() => setMode(m)} className={chip(mode === m) + " capitalize"}>
            {m}
          </button>
        ))}
        <span className="ml-auto truncate text-muted-foreground max-sm:w-full">{picked ?? "Click a dot to pick a place"}</span>
      </div>

      <SupplyFlowGlobe
        key={palette}
        height="calc(100svh - 57px)"
        palette={palette}
        mode={mode}
        title={story.title}
        subtitle={story.subtitle}
        flows={"flows" in story ? story.flows : undefined}
        roleLabels={"roleLabels" in story ? story.roleLabels : undefined}
        formatValue={"format" in story ? story.format : undefined}
        rotation={palette === "atlas" ? [-110, -25] : palette === "matcha" ? [-55, -22] : [-15, -20]}
        projection={projection}
        onProjectionChange={setProjection}
        onNodeClick={(n) => setPicked(n.name + " — " + n.role)}
      />
    </div>
  )
}
