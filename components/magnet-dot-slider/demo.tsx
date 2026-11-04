"use client"

import { useState } from "react"
import MagnetDotSlider from "@/components/ui/magnet-dot-slider"

const sans = "'Geist','Inter','SF Pro Text','Segoe UI Variable Text',ui-sans-serif,system-ui,sans-serif"

export default function Demo() {
  const [lux, setLux] = useState(64)
  const [kelvin, setKelvin] = useState(3800)
  // the lamp preview warms and brightens with the sliders
  const warm = Math.min(1, Math.max(0, (6500 - kelvin) / 3800))
  return (
    <div className="flex min-h-[680px] w-full items-center justify-center bg-background px-4 py-16">
      <div
        className="w-full max-w-[560px] rounded-[32px] p-4 sm:p-5"
        style={{
          fontFamily: sans,
          background: "linear-gradient(180deg,#1b1c21,#0f1013)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,.06), 0 40px 80px -40px rgba(0,0,0,.85)",
        }}
      >
        <div className="flex items-center gap-4 px-3 pb-5 pt-3">
          <span
            className="h-11 w-11 flex-none rounded-full"
            style={{
              background: "radial-gradient(circle at 50% 40%, #fff, rgb(255," + Math.round(200 + 40 * (1 - warm)) + "," + Math.round(120 + 130 * (1 - warm)) + ") 45%, transparent 72%)",
              opacity: 0.35 + (lux / 100) * 0.65,
              boxShadow: "0 0 " + (10 + lux / 3) + "px rgba(255," + Math.round(170 + 60 * (1 - warm)) + ",90," + (0.25 + lux / 250) + ")",
            }}
          />
          <div className="leading-tight">
            <p className="text-[15px] font-semibold text-[#f1ede7]">Key light · Studio B</p>
            <p className="text-[12.5px] text-[#7c7871]">Aputure 600d · DMX ch. 14</p>
          </div>
        </div>
        <div className="space-y-3">
          <MagnetDotSlider label="Intensity" value={lux} onChange={setLux} />
          <MagnetDotSlider label="Colour temperature" min={2700} max={6500} step={100} suffix="K" value={kelvin} onChange={setKelvin} from="#ffb347" to="#cfe3ff" />
        </div>
      </div>
    </div>
  )
}
