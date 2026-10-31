"use client"

import * as React from "react"
import CrabButton, { CrabDropdown, CrabToggle } from "@/components/ui/crab-perch-buttons"

function BagIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5.5 8.5h13l-1 11.5h-11z" />
      <path d="M9 8.5V7a3 3 0 0 1 6 0v1.5" />
    </svg>
  )
}

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-end gap-5 pt-24">
      <div className="flex h-24 items-center justify-center">{children}</div>
      <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-muted-foreground">{label}</p>
    </div>
  )
}

// The full sheet: every variant, every pose. The first row freezes hover and
// press so you can see them side by side, and still works when you use it.
export default function Demo() {
  const [on, setOn] = React.useState(true)
  return (
    <div className="flex min-h-[100svh] w-full items-center justify-center bg-background px-4 py-16 text-foreground">
      <div className="grid w-full max-w-4xl grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
        <Cell label="Default">
          <CrabButton size="lg">Button</CrabButton>
        </Cell>
        <Cell label="Hover">
          <CrabButton size="lg" state="hover">Button</CrabButton>
        </Cell>
        <Cell label="Pressed">
          <CrabButton size="lg" state="press">Button</CrabButton>
        </Cell>
        <Cell label="Outline">
          <CrabButton size="lg" variant="outline" crabAt={0.4}>
            Button
          </CrabButton>
        </Cell>
        <Cell label="Ghost">
          <CrabButton size="lg" variant="ghost">Button</CrabButton>
        </Cell>
        <Cell label="Icon">
          <CrabButton size="lg" variant="icon">Next</CrabButton>
        </Cell>
        <Cell label="With icon">
          <CrabButton size="lg" icon={<BagIcon />} crabAt={0.36}>
            Button
          </CrabButton>
        </Cell>
        <Cell label="Dropdown">
          <CrabDropdown size="lg" placeholder="Button" aria-label="Pick a tide" options={["Low tide", "High tide", "Spring tide", "Neap tide"]} />
        </Cell>
        <Cell label="Toggle">
          <CrabToggle size="lg" checked={on} onCheckedChange={setOn} aria-label="Crab mode" />
        </Cell>
      </div>
    </div>
  )
}
