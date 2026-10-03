"use client"

import LedStatusSign from "@/components/ui/led-status-sign"

// A shelf of signs: three finishes, three inks, each on its own little loop.
export default function Demo() {
  return (
    <div className="grid w-full md:grid-cols-3">
      <LedStatusSign
        height="100svh"
        finish="graphite"
        palette="crimson"
        autoCycle={4}
        statuses={[
          { text: "ON AIR", icon: "rec", effect: "pulse" },
          { text: "RECORDING", icon: "mic" },
        ]}
      />
      <LedStatusSign
        height="100svh"
        finish="silver"
        palette="amber"
        autoCycle={5}
        transition="wipe"
        statuses={[
          { text: "FOCUS", icon: "focus" },
          { text: "LO-FI ON", icon: "music" },
          { text: "NO MEETINGS TODAY", icon: "moon" },
        ]}
      />
      <LedStatusSign
        height="100svh"
        finish="white"
        palette="lime"
        autoCycle={6}
        transition="dissolve"
        statuses={[
          { text: "FREE", icon: "check" },
          { text: "SAY HI", icon: "heart", palette: "violet" },
          { text: "BRB", icon: "coffee", effect: "blink", palette: "ice" },
        ]}
      />
    </div>
  )
}
