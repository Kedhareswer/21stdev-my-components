"use client"

import InkOrbitSculpture from "@/components/ui/ink-orbit-sculpture"

// Sepia ink on museum paper, reforging itself every seven seconds — a specimen
// plate for a studio's about page.
export default function DemoCustom() {
  return (
    <div className="relative w-full">
      <InkOrbitSculpture
        ink="#2b1d14"
        background="#f3ece1"
        seed={7}
        autoReforge={7}
        spin={0.1}
        label="SPECIMEN · PLATE VII"
        hint="Drag to turn · Click for the next specimen"
      />
    </div>
  )
}
