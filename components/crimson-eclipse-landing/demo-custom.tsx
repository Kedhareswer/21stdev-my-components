"use client"

import * as React from "react"
import CrimsonEclipseLanding from "@/components/ui/crimson-eclipse-landing"

// The same world under a cold blue moon, driven by a real (here: faked) load
// instead of the built-in timer, with its own words.
export default function DemoCustom() {
  const [progress, setProgress] = React.useState(0)

  React.useEffect(() => {
    let p = 0
    const id = window.setInterval(() => {
      p = Math.min(100, p + 4 + Math.random() * 11)
      setProgress(p)
      if (p >= 100) window.clearInterval(id)
    }, 260)
    return () => window.clearInterval(id)
  }, [])

  return (
    <div className="w-full">
      <CrimsonEclipseLanding
        hue={214}
        seed={42}
        title="HELLO"
        eyebrow="STUDIO"
        kanji="月光の下で"
        tagline={["QUIET WORK, MADE CAREFULLY.", "SINCE THE FIRST MOON."]}
        navItems={[{ label: "WORK" }, { label: "JOURNAL" }, { label: "STUDIO" }, { label: "SAY HELLO" }]}
        loadingLabels={["FETCHING FRAMES", "COOLING THE WATER", "RAISING THE MOON"]}
        progress={progress}
      />
    </div>
  )
}
