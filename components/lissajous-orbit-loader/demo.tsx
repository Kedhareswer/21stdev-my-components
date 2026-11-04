"use client"

import { useEffect, useState } from "react"
import LissajousOrbitLoader from "@/components/ui/lissajous-orbit-loader"

export default function Demo() {
  // A fake upload that creeps to 100 % and starts over.
  const [p, setP] = useState(0.18)
  useEffect(() => {
    const t = setInterval(() => setP((v) => (v >= 1 ? 0 : Math.min(1, v + 0.012 + Math.random() * 0.02))), 160)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="flex min-h-[600px] w-full flex-wrap items-center justify-center gap-16 bg-background px-4 py-12">
      <LissajousOrbitLoader />
      <LissajousOrbitLoader progress={p} label="Exporting 4K master" steps={["Encoding frames", "Muxing audio", "Writing file"]} colors={["#ffb14a", "#ff5f7e", "#ffe27a"]} />
    </div>
  )
}
