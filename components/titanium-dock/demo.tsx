"use client"

import { useState } from "react"
import TitaniumDock from "@/components/ui/titanium-dock"

const sans = '"Geist", "Inter", "SF Pro Text", "Segoe UI Variable Text", ui-sans-serif, system-ui, sans-serif'
const names: Record<string, string> = { orders: "Orders", help: "Help centre", profile: "Your profile", send: "Share a link", done: "All done" }

function Stage({ dark }: { dark?: boolean }) {
  const [v, setV] = useState(dark ? "send" : "orders")
  return (
    <div
      className="flex w-full max-w-[560px] flex-col items-center gap-7 rounded-[30px] px-4 pb-10 pt-14"
      style={{
        fontFamily: sans,
        background: dark
          ? "radial-gradient(120% 90% at 50% 0%, #2a2d33 0%, #15171a 60%, #0d0e10 100%)"
          : "radial-gradient(120% 90% at 50% 0%, #ffffff 0%, #eef0f3 55%, #e2e5ea 100%)",
        boxShadow: dark ? "inset 0 1px 0 rgba(255,255,255,.06), 0 30px 60px -30px rgba(0,0,0,.8)" : "inset 0 1px 0 #fff, inset 0 0 0 1px rgba(30,35,45,.05), 0 30px 60px -30px rgba(30,35,45,.35)",
      }}
    >
      <TitaniumDock finish={dark ? "graphite" : "silver"} value={v} onChange={setV} />
      <p className="text-[13px] tracking-[0.02em]" style={{ color: dark ? "#8f949c" : "#7b8089" }}>
        {names[v]}
      </p>
    </div>
  )
}

export default function Demo() {
  return (
    <div className="flex min-h-[max(640px,100svh)] w-full flex-col items-center justify-center gap-6 bg-background px-4 py-16">
      <Stage />
      <Stage dark />
    </div>
  )
}
