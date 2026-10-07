"use client"

import VelvetHaze from "@/components/ui/velvet-haze"

// Full-bleed, as a page background. No cast shadow — there is no page around it.
export default function Demo() {
  return (
    <div className="relative w-full">
      <VelvetHaze params={{ cast: 0 }} />
    </div>
  )
}
