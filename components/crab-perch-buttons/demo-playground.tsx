"use client"

import * as React from "react"
import CrabButton, { CrabDropdown, CrabMascot, CrabToggle } from "@/components/ui/crab-perch-buttons"

const CRABS = ["red", "blue", "gold", "pearl", "violet", "mint"] as const
const TONES = ["moss", "ink", "clay", "sea", "plum", "sand"] as const
const SWATCH = {
  red: "#e4562c", blue: "#3f7fcf", gold: "#e3a43b", pearl: "#e6d7c3", violet: "#8d5bd2", mint: "#41b38a",
  moss: "#566341", ink: "#26292f", clay: "#a3532f", sea: "#2c5b6c", plum: "#5a3a57", sand: "#ebe7e0",
} as const

function Swatches({ label, items, value, onChange }: { label: string; items: readonly (keyof typeof SWATCH)[]; value: string; onChange: (v: string) => void }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-[11px] font-medium uppercase tracking-[0.24em] text-muted-foreground">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {items.map((k) => (
          <button
            key={k}
            type="button"
            aria-label={k}
            aria-pressed={value === k}
            onClick={() => onChange(k)}
            className="size-8 rounded-full border border-border shadow-sm transition-transform hover:scale-110 aria-pressed:ring-2 aria-pressed:ring-foreground aria-pressed:ring-offset-2 aria-pressed:ring-offset-background"
            style={{ background: SWATCH[k] }}
          />
        ))}
      </div>
    </fieldset>
  )
}

// Make it yours: shell colour, button tone, size. Every piece follows along.
export default function DemoPlayground() {
  const [crab, setCrab] = React.useState("red")
  const [tone, setTone] = React.useState("moss")
  const [size, setSize] = React.useState("md" as "sm" | "md" | "lg")
  const [busy, setBusy] = React.useState(false)
  const [clicks, setClicks] = React.useState(0)

  return (
    <div className="flex min-h-[100svh] w-full flex-col items-center justify-center gap-14 bg-background px-4 py-16 text-foreground">
      <div className="flex flex-col items-center gap-2 text-center">
        <CrabMascot crab={crab} size={150} title="A crab, waving" />
        <h1 className="text-2xl font-semibold tracking-tight">Pick your crab</h1>
        <p className="max-w-sm text-sm text-muted-foreground">Hover a button and the crab scuttles after you. Press it and it ducks. Click it and it blows bubbles.</p>
      </div>

      <div className="flex flex-wrap items-end justify-center gap-x-10 gap-y-28 pt-10">
        <CrabButton crab={crab} tone={tone} size={size} onClick={() => setClicks((n) => n + 1)}>
          {clicks ? "Snipped ×" + clicks : "Say hello"}
        </CrabButton>
        <CrabButton
          crab={crab}
          tone={tone}
          size={size}
          loading={busy}
          onClick={() => {
            setBusy(true)
            setTimeout(() => setBusy(false), 2200)
          }}
        >
          {busy ? "Digging" : "Dig in"}
        </CrabButton>
        <CrabButton variant="outline" crab={crab} tone={tone} size={size}>
          Outline
        </CrabButton>
        <CrabButton variant="icon" crab={crab} tone={tone} size={size}>
          Continue
        </CrabButton>
        <CrabToggle crab={crab} tone={tone} size={size} defaultChecked aria-label="Crab mode" />
        <CrabDropdown crab={crab} size={size} placeholder="Shore" aria-label="Pick a shore" options={["Rock pool", "Sand bar", "Kelp forest", { value: "deep", label: "Abyss", disabled: true }]} />
        <CrabButton variant="ghost" crab={crab} tone={tone} size={size}>
          Ghost
        </CrabButton>
        <CrabButton crab={crab} tone={tone} size={size} disabled>
          Asleep
        </CrabButton>
      </div>

      <div className="flex flex-wrap items-start justify-center gap-10 rounded-3xl border border-border px-8 py-6">
        <Swatches label="Crab" items={CRABS} value={crab} onChange={setCrab} />
        <Swatches label="Tone" items={TONES} value={tone} onChange={setTone} />
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-[11px] font-medium uppercase tracking-[0.24em] text-muted-foreground">Size</legend>
          <div className="flex gap-1 rounded-full border border-border p-1">
            {(["sm", "md", "lg"] as const).map((s) => (
              <button key={s} type="button" aria-pressed={size === s} onClick={() => setSize(s)} className="rounded-full px-3 py-1 text-sm aria-pressed:bg-primary aria-pressed:text-primary-foreground">
                {s}
              </button>
            ))}
          </div>
        </fieldset>
      </div>
    </div>
  )
}
