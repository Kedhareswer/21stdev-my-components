"use client"

import * as React from "react"
import HiringRigPoster from "@/components/ui/hiring-rig-poster"

const pad = (n: number) => (n < 10 ? "0" : "") + n
const mmdd = (d: Date) => pad(d.getMonth() + 1) + "." + pad(d.getDate())

// Your own rig: a night-shift palette on a dark wall, your words, and a live
// window — applications open today and close in twelve days, so clicking the
// date flips it to a running countdown. The second LED line is too long for
// the screen, so it runs as a marquee.
export default function Demo() {
  const [win] = React.useState(() => {
    const open = new Date()
    const close = new Date(open.getTime() + 12 * 864e5)
    close.setHours(18, 0, 0, 0)
    return { from: mmdd(open), to: mmdd(close), deadline: close.getTime() }
  })
  return (
    <div className="w-full">
      <HiringRigPoster
        headline={["NIGHT SHIFT", "IS HIRING ✦ MOTION LEAD ✦ REMOTE OK ✦"]}
        messages={[["SEND THE", "REEL ✦"], ["NO COVER", "LETTERS"]]}
        thanks={["RECEIVED", "SEE YOU ✦"]}
        role="Senior Motion Designer"
        from={win.from}
        to={win.to}
        deadline={win.deadline}
        email="jobs@nightshift.example"
        requirements={[
          { label: "Tools", value: "Houdini" },
          { label: "Renderer", value: "Redshift" },
          { label: "Bonus", value: "Real-time / UE5" },
        ]}
        address="Remote, worldwide. Studio days in Lisbon twice a year."
        tagline="Do your best work"
        studio="after ✦ dark"
        site="nightshift.example"
        palette={{
          backdrop: "#0e0f13",
          glow: "#ff3b6b",
          blush: "#e6e4ff",
          lilac: "#9fb2ff",
          led: "#ffc2d2",
          ink: "#3d0616",
          band: "#181c4a",
          cable: "#ff3b6b",
          cableAlt: "#7ef0ff",
          signal: "#7ef0ff",
        }}
        onApply={() => console.log("applied")}
      />
    </div>
  )
}
