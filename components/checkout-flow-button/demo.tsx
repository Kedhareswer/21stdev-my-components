"use client"

import CheckoutFlowButton from "@/components/ui/checkout-flow-button"

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))
const sans = '"Geist", "Inter", "SF Pro Text", "Segoe UI Variable Text", ui-sans-serif, system-ui, sans-serif'

const lines = [
  { name: "Linen field journal", note: "Set of 3 · Oat, Moss, Ink", price: "$96.00", swatch: ["#d9ccb4", "#7d8b62", "#2c3140"] },
  { name: "Brass pen clip", note: "Brushed", price: "$18.00", swatch: ["#c9a35b"] },
  { name: "Express shipping", note: "Arrives Thursday", price: "$15.00", swatch: [] },
]

export default function Demo() {
  return (
    <div className="flex min-h-[max(620px,100svh)] w-full items-center justify-center bg-background px-4 py-16">
      <div
        className="w-full max-w-[440px] rounded-[30px] p-6 sm:p-8"
        style={{
          fontFamily: sans,
          color: "#16171a",
          background: "linear-gradient(180deg,#fbfaf7,#f2efe8)",
          boxShadow: "inset 0 1px 0 #fff, inset 0 0 0 1px rgba(40,35,20,.06), 0 1px 2px rgba(40,35,20,.06), 0 34px 70px -34px rgba(40,35,20,.4)",
        }}
      >
        <div className="flex items-baseline justify-between">
          <p className="text-[13px] font-medium tracking-[0.14em] text-[#8b8576]">ORDER</p>
          <p className="text-[13px] text-[#8b8576]">#A-2931</p>
        </div>
        <ul className="mt-6 space-y-4">
          {lines.map((l) => (
            <li key={l.name} className="flex items-center gap-3">
              <span className="flex w-12 flex-none -space-x-1.5">
                {l.swatch.map((c) => (
                  <span key={c} className="h-5 w-5 rounded-full" style={{ background: c, boxShadow: "0 0 0 2px #f7f5f0, inset 0 -2px 3px rgba(0,0,0,.15)" }} />
                ))}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-medium">{l.name}</span>
                <span className="block text-[12.5px] text-[#8b8576]">{l.note}</span>
              </span>
              <span className="text-[15px] tabular-nums">{l.price}</span>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex items-baseline justify-between border-t border-dashed pt-5" style={{ borderColor: "#d8d2c4" }}>
          <span className="text-[14px] text-[#5d584c]">Total</span>
          <span className="text-[30px] font-semibold tracking-[-0.03em] tabular-nums">$129.00</span>
        </div>
        <div className="mt-7 flex justify-center">
          <CheckoutFlowButton amount="$129.00" onPay={() => wait(2300)} />
        </div>
        <p className="mt-4 text-center text-[12px] text-[#a19a89]">Tap pay, pick a card, confirm.</p>
      </div>
    </div>
  )
}
