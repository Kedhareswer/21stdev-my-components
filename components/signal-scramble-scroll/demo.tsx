"use client"

import SignalScrambleScroll from "@/components/ui/signal-scramble-scroll"

export default function Demo() {
  return (
    <div>
      <SignalScrambleScroll />
      <div style={{ height: "60svh", display: "grid", placeItems: "center", background: "#070707", color: "#ece7dc", fontFamily: "ui-monospace, monospace", letterSpacing: ".2em", fontSize: 12 }}>
        END OF TRANSMISSION
      </div>
    </div>
  )
}
