"use client"

import type { CSSProperties } from "react"
import CrumpleChangelog from "@/components/ui/crumple-changelog"

// Six updates, newest first. Every poster is printed from this data.
// Shown on a dark page: the five tokens are set here, so the loud inks pop
// whatever theme the host page is in.
// width: 21st centres demos in a flex row, where an unsized wrapper shrinks
// to 0 px (the component is a size container, so its content gives no width).
const DARK = {
  width: "100%",
  "--color-background": "#0b0b0c",
  "--color-foreground": "#f4f2ee",
  "--color-muted-foreground": "#a19d97",
  "--color-border": "#2a2928",
  "--color-primary": "#f4f2ee",
} as CSSProperties

export default function Demo() {
  return (
    <div style={DARK}>
      <CrumpleChangelog />
    </div>
  )
}
