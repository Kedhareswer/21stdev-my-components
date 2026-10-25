"use client"

import * as React from "react"
import OldMastersPreloader from "@/components/ui/old-masters-preloader"

// Used as a real gate, paced by real progress: a stand-in asset queue that
// surges and stalls. The page sits behind the stage from the first frame; a
// scroll, the call to action, or holdMs lifts the stage off it.
const STEPS = [5, 3, 12, 2, 0, 0, 9, 14, 4, 0, 6, 11, 5, 0, 0, 8, 10, 11]

export default function DemoGate() {
  const [loaded, setLoaded] = React.useState(0)
  const [done, setDone] = React.useState(false)

  React.useEffect(() => {
    let i = 0
    let v = 0
    const t = setInterval(() => {
      v = Math.min(100, v + (STEPS[i++ % STEPS.length] ?? 5))
      setLoaded(v)
      if (v >= 100) clearInterval(t)
    }, 230)
    return () => clearInterval(t)
  }, [])

  return (
    <OldMastersPreloader progress={loaded} holdMs={4200} onComplete={() => setDone(true)}>
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
          Your page goes here. The preloader renders it underneath from the first frame, so its images and fonts start
          loading while the word is still filling.
        </p>
      </main>
    </OldMastersPreloader>
  )
}
