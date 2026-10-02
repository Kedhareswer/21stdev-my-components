"use client"

import * as React from "react"
import VaultDialReveal, { type CoinMetal, type VaultTone } from "@/components/ui/vault-dial-reveal"

const TONES: { id: VaultTone; label: string }[] = [
  { id: "graphite", label: "Graphite" },
  { id: "midnight", label: "Midnight" },
  { id: "bone", label: "Bone" },
]

const METALS: { id: CoinMetal; label: string; symbol: string }[] = [
  { id: "gold", label: "Gold", symbol: "₿" },
  { id: "silver", label: "Silver", symbol: "Ξ" },
  { id: "rose", label: "Rose", symbol: "♥" },
]

export default function Demo() {
  const [tone, setTone] = React.useState<VaultTone>("midnight")
  const [metal, setMetal] = React.useState<CoinMetal>("silver")
  const [log, setLog] = React.useState("No attempts yet.")
  const symbol = METALS.find((m) => m.id === metal)?.symbol ?? "₿"

  const pill = (on: boolean) =>
    "rounded-full border px-3.5 py-1 font-mono text-[11px] uppercase tracking-[0.18em] transition " +
    (on ? "border-white bg-white text-black" : "border-white/25 text-white/70 hover:border-white/50 hover:text-white")

  return (
    <div className="flex w-full flex-col bg-black">
      <div className="flex flex-wrap items-center justify-center gap-2 px-4 py-4">
        {TONES.map((t) => (
          <button key={t.id} type="button" className={pill(tone === t.id)} onClick={() => setTone(t.id)}>
            {t.label}
          </button>
        ))}
        <span className="mx-2 h-4 w-px bg-white/20" />
        {METALS.map((m) => (
          <button key={m.id} type="button" className={pill(metal === m.id)} onClick={() => setMetal(m.id)}>
            {m.label}
          </button>
        ))}
      </div>

      {/* A four-number code on a 60-number dial, with your own fine print. */}
      <VaultDialReveal
        tone={tone}
        metal={metal}
        symbol={symbol}
        code={[45, 5, 20, 35]}
        ticks={60}
        engraving="PRIVATE RESERVE · KEEP OUT"
        caption="The combination is printed under the readout. Lose it and the wheel will not tell you."
        height="calc(100svh - 64px)"
        onAttempt={(entered, ok) => setLog((ok ? "Opened with " : "Refused ") + entered.join("-"))}
      />

      <p className="m-0 py-3 text-center font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">{log}</p>
    </div>
  )
}
