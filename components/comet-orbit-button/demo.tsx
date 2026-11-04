"use client"

import CometOrbitButton from "@/components/ui/comet-orbit-button"

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))
let attempts = 0

export default function Demo() {
  return (
    <div className="flex min-h-[600px] w-full items-center justify-center bg-background px-4 py-16">
      <div
        className="relative w-full max-w-[420px] overflow-hidden rounded-[30px] p-7 text-[#f4efe6] sm:p-9"
        style={{
          background: "radial-gradient(130% 80% at 85% -10%, #3a3122 0%, #17181c 45%, #0c0d10 100%)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,.08), 0 2px 4px rgba(0,0,0,.2), 0 40px 80px -40px rgba(0,0,0,.75)",
          fontFamily: '"Geist", "Inter", "SF Pro Text", "Segoe UI Variable Text", ui-sans-serif, system-ui, sans-serif',
        }}
      >
        <div className="flex items-center justify-between text-[12px] tracking-[0.16em] text-[#a99d89]">
          <span>OPERATING · USD</span>
          <span className="rounded-full px-2.5 py-1 text-[11px] tracking-normal text-[#f2d6a2]" style={{ background: "rgba(242,214,162,.08)", boxShadow: "inset 0 0 0 1px rgba(242,214,162,.18)" }}>
            Instant
          </span>
        </div>
        <p className="mt-8 text-[13px] text-[#a99d89]">Available to withdraw</p>
        <p className="mt-1 text-[46px] font-[520] leading-none tracking-[-0.035em] tabular-nums">
          $1,240<span className="text-[#6f6758]">.00</span>
        </p>
        <div className="mt-6 flex items-center gap-3 rounded-2xl p-3.5" style={{ background: "rgba(255,255,255,.035)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,.06)" }}>
          <span className="grid h-9 w-12 place-items-center rounded-md text-[10px] font-semibold tracking-wider text-[#1a1408]" style={{ background: "linear-gradient(135deg,#f6e2b8,#c9a46a 55%,#8c6a35)" }}>
            BANK
          </span>
          <div className="text-[13px] leading-tight">
            <p>Halden Savings</p>
            <p className="text-[#8e8473]">Checking •• 4021 · arrives in seconds</p>
          </div>
        </div>
        <div className="mt-8">
          <CometOrbitButton width="100%" onAction={() => wait(2200)} />
        </div>
        <div className="mt-3">
          <CometOrbitButton
            width="100%"
            label="Withdraw to card"
            doneLabel="Sent to •• 8817"
            onAction={async () => {
              await wait(1600)
              if (attempts++ % 2 === 0) throw new Error("declined")
            }}
          />
        </div>
        <p className="mt-5 text-center text-[12px] text-[#6f6758]">The card withdrawal declines every other try, to show the error ring.</p>
      </div>
    </div>
  )
}
