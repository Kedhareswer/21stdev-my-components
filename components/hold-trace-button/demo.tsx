"use client"

import { useState } from "react"
import HoldTraceButton from "@/components/ui/hold-trace-button"

const files = [
  { name: "Northwind — brand book v4.pdf", meta: "38.2 MB · edited 2 days ago", tint: "#d0233a" },
  { name: "Launch film, final cut.mov", meta: "1.4 GB · edited last week", tint: "#7a4de0" },
  { name: "Pricing model 2027.xlsx", meta: "412 KB · edited today", tint: "#1f8a5b" },
]

export default function Demo() {
  const [gone, setGone] = useState(-1)
  return (
    <div className="flex min-h-[620px] w-full items-center justify-center bg-background px-4 py-16">
      <div
        className="w-full max-w-[520px] rounded-[26px] p-3"
        style={{
          background: "linear-gradient(180deg,#ffffff,#f7f3f2)",
          boxShadow: "inset 0 0 0 1px rgba(60,20,25,.06), 0 1px 2px rgba(60,20,25,.06), 0 30px 60px -30px rgba(60,20,25,.3)",
          fontFamily: '"Geist", "Inter", "SF Pro Text", "Segoe UI Variable Text", ui-sans-serif, system-ui, sans-serif',
        }}
      >
        <div className="flex items-center justify-between px-4 pb-3 pt-3">
          <p className="text-[15px] font-semibold tracking-[-0.01em] text-[#1d1416]">Shared with the studio</p>
          <p className="text-[12px] text-[#9b8a8c]">3 files</p>
        </div>
        <ul className="space-y-1.5">
          {files.map((f, i) => (
            <li
              key={f.name}
              className="flex items-center gap-3 rounded-[18px] bg-white px-3 py-3 transition-opacity duration-500 sm:px-4"
              style={{ boxShadow: "inset 0 0 0 1px rgba(60,20,25,.06)", opacity: gone === i ? 0.45 : 1 }}
            >
              <span className="grid h-10 w-10 flex-none place-items-center rounded-xl text-[10px] font-bold tracking-wide text-white" style={{ background: "linear-gradient(160deg," + f.tint + "cc," + f.tint + ")" }}>
                {f.name.split(".").pop()!.toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-medium text-[#1d1416]" style={{ textDecoration: gone === i ? "line-through" : "none" }}>{f.name}</span>
                <span className="block truncate text-[12px] text-[#9b8a8c]">{f.meta}</span>
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex flex-col items-center gap-1 rounded-[18px] px-4 pb-2 pt-12" style={{ background: "repeating-linear-gradient(135deg,#fdf1f1 0 10px,#fbecec 10px 20px)" }}>
          <HoldTraceButton label="Remove brand book" onConfirm={() => setGone(0)} onUndo={() => setGone(-1)} />
          <p className="text-[12px] text-[#a07f84]">Removes it for everyone in the studio.</p>
        </div>
      </div>
    </div>
  )
}
