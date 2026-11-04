"use client"

import { useState } from "react"
import VernierPrecisionSlider from "@/components/ui/vernier-precision-slider"

const sans = "'Geist','Inter','SF Pro Display','Segoe UI Variable Display',ui-sans-serif,system-ui,sans-serif"
const serif = '"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif'

export default function Demo() {
  const [temp, setTemp] = useState(93.5)
  const [dose, setDose] = useState(18.2)
  return (
    <div className="flex min-h-[max(720px,100svh)] w-full items-center justify-center bg-background px-4 py-16">
      <div
        className="w-full max-w-[600px] rounded-[34px] p-4 sm:p-5"
        style={{ fontFamily: sans, background: "linear-gradient(180deg,#e9e4dc,#ddd6cb)", boxShadow: "inset 0 1px 0 rgba(255,255,255,.7), 0 40px 80px -40px rgba(60,45,30,.45)" }}
      >
        <div className="flex items-end justify-between px-3 pb-4 pt-2">
          <div>
            <p className="text-[11px] font-medium tracking-[0.2em] text-[#8d8273]">RECIPE 07 · V60</p>
            <p className="mt-1 text-[26px] leading-none text-[#1d1b18]" style={{ fontFamily: serif, letterSpacing: "-0.02em" }}>
              Ethiopia Guji, washed
            </p>
          </div>
          <p className="text-right text-[12px] leading-tight text-[#8d8273]">
            Ratio
            <br />
            <b className="whitespace-nowrap text-[15px] font-semibold tabular-nums text-[#1d1b18]">1 : {(300 / dose).toFixed(1)}</b>
          </p>
        </div>
        <div className="space-y-3">
          <VernierPrecisionSlider label="Water temperature" min={80} max={100} value={temp} onChange={setTemp} unit="°C" />
          <VernierPrecisionSlider label="Dose" min={10} max={25} value={dose} onChange={setDose} unit="g" accent="#2f6b4f" ticks={61} hint="" />
        </div>
      </div>
    </div>
  )
}
