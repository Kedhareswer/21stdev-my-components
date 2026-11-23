"use client"

import * as React from "react"
import PerimeterWordmarkPreloader from "@/components/ui/perimeter-wordmark-preloader"

// The preloader on its own, looping: when the panel has gone and the word has
// held for a moment, it remounts and plays again. On a page, render it once
// wrapped around your page (see the README).
// from the moment the panel starts to drop: its fall, then about a second on the word
const HOLD = 1800

export default function Demo() {
  const [run, setRun] = React.useState(0)
  const timer = React.useRef(0)
  React.useEffect(() => () => window.clearTimeout(timer.current), [])
  const again = () => {
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setRun((r) => r + 1), HOLD)
  }
  return (
    <div className="w-full" style={{ background: "#050505" }}>
      <PerimeterWordmarkPreloader key={run} text="NOIR" duration={3400} onReveal={again} />
    </div>
  )
}
