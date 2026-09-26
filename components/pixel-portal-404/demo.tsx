"use client"

import * as React from "react"
import PixelPortal404 from "@/components/ui/pixel-portal-404"

// Click the door to step through. `onEnter` stands in for your router here, so
// the demo lands on a stand-in home page instead of reloading the preview.
export default function Demo() {
  const [home, setHome] = React.useState(false)

  if (home) {
    return (
      <div
        className="flex w-full flex-col items-center justify-center gap-6 px-6 text-center"
        style={{ height: "100svh", background: "linear-gradient(180deg, #2a55c9 0%, #79acf7 70%, #ffffff 100%)" }}
      >
        <p className="text-sm font-medium tracking-[0.3em] text-white/80 uppercase">Welcome back</p>
        <h2 className="text-4xl font-semibold tracking-tight text-white sm:text-6xl">You made it home.</h2>
        <button
          type="button"
          onClick={() => setHome(false)}
          className="rounded-full bg-white/90 px-5 py-2 text-sm font-medium text-[#2a2270] shadow-sm transition hover:bg-white"
        >
          Get lost again
        </button>
      </div>
    )
  }

  return (
    // w-full: 21st centres demos in a flex wrapper that would shrink this to 0px.
    <div className="w-full">
      <PixelPortal404 onEnter={() => setHome(true)} />
    </div>
  )
}
