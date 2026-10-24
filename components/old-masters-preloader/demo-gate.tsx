"use client"

import * as React from "react"
import OldMastersPreloader from "@/components/ui/old-masters-preloader"

// Used as a real gate: the page sits behind the stage, which lifts off it once
// the landing has held for a moment (or when the call to action is pressed).
export default function DemoGate() {
  const [done, setDone] = React.useState(false)
  return (
    <OldMastersPreloader durationMs={2600} minLoadMs={1600} holdMs={3200} onComplete={() => setDone(true)}>
      <main style={{ minHeight: "100svh", padding: "12vh 8vw", background: "#f3eee4", color: "#1a1612", fontFamily: "Georgia, serif" }}>
        <p style={{ margin: 0, fontSize: 12, letterSpacing: "0.3em", textTransform: "uppercase", color: "#7a6d58" }}>
          {done ? "The stage has lifted" : "Behind the stage"}
        </p>
        <h2 style={{ margin: "16px 0 0", fontSize: "clamp(40px, 7vw, 104px)", lineHeight: 0.95, fontWeight: 400, letterSpacing: "-0.02em" }}>
          Selected
          <br />
          work, 2019 –
        </h2>
        <p style={{ maxWidth: 520, marginTop: 32, fontSize: 18, lineHeight: 1.6 }}>
          Your page goes here. The preloader renders it underneath from the first frame, so images and fonts start loading
          while the ring is still drawing.
        </p>
      </main>
    </OldMastersPreloader>
  )
}
