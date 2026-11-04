"use client"

import { useState } from "react"
import ChainNetworkSelector, { type Network } from "@/components/ui/chain-network-selector"

// Monogram marks in each network's colour; pass `logo` to use real logos.
const networks: Network[] = [
  { id: "eth", name: "Ethereum", color: "#627eea", value: "$12,480.22", detail: "Gas 14 gwei" },
  { id: "base", name: "Base", color: "#0052ff", value: "$3,912.07", detail: "Gas 0.02 gwei" },
  { id: "arb", name: "Arbitrum", color: "#2d9cdb", value: "$2,105.90", detail: "Gas 0.01 gwei" },
  { id: "op", name: "Optimism", color: "#ff0420", value: "$846.15", detail: "Gas 0.004 gwei" },
  { id: "poly", name: "Polygon", color: "#8247e5", value: "$412.60", detail: "Gas 31 gwei" },
  { id: "sol", name: "Solana", color: "#14b88a", value: "$1,377.48", detail: "Fee 0.000005 SOL" },
]

const assets = [
  { sym: "ETH", name: "Ether", chain: "eth", amount: "3.412", usd: 11204.5, change: 2.4 },
  { sym: "USDC", name: "USD Coin", chain: "base", amount: "3,910.00", usd: 3910, change: 0 },
  { sym: "ARB", name: "Arbitrum", chain: "arb", amount: "2,640.8", usd: 2105.9, change: -1.8 },
  { sym: "SOL", name: "Solana", chain: "sol", amount: "8.91", usd: 1377.48, change: 4.1 },
  { sym: "LINK", name: "Chainlink", chain: "eth", amount: "71.4", usd: 1275.72, change: 1.2 },
  { sym: "OP", name: "Optimism", chain: "op", amount: "512.3", usd: 846.15, change: -0.6 },
  { sym: "POL", name: "Polygon", chain: "poly", amount: "1,804", usd: 412.6, change: 3.3 },
]

const usd = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function Demo() {
  const [sel, setSel] = useState(["eth", "base", "arb", "op", "poly"])
  const shown = assets.filter((a) => sel.includes(a.chain))
  const total = shown.reduce((t, a) => t + a.usd, 0)
  const color = (id: string) => networks.find((n) => n.id === id)?.color

  return (
    <div
      style={{
        minHeight: "100svh",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "max(48px, 12vh) 16px 48px",
        background: "var(--color-background)",
        color: "var(--color-foreground)",
        fontFamily: "'Inter Tight', ui-sans-serif, system-ui, sans-serif",
      }}
    >
      <section
        style={{
          width: "min(560px, 100%)",
          padding: 24,
          borderRadius: 26,
          background: "color-mix(in oklab, var(--color-background) 96%, var(--color-foreground))",
          boxShadow: "0 0 0 1px var(--color-border), 0 30px 60px -36px rgba(40,24,120,.45)",
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 650, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--color-muted-foreground)" }}>Portfolio</div>
        <div style={{ margin: "6px 0 18px", fontSize: 40, fontWeight: 700, letterSpacing: "-0.04em", fontVariantNumeric: "tabular-nums" }}>{usd(total)}</div>
        <ChainNetworkSelector networks={networks} defaultValue={sel} onChange={setSel} />
        <ul style={{ listStyle: "none", margin: "20px 0 0", padding: 0, borderTop: "1px solid var(--color-border)" }}>
          {shown.map((a) => (
            <li key={a.sym} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 2px", borderBottom: "1px solid var(--color-border)" }}>
              <span style={{ width: 34, height: 34, borderRadius: 99, display: "grid", placeItems: "center", fontSize: 11, fontWeight: 750, color: "#fff", background: color(a.chain) }}>{a.sym.slice(0, 3)}</span>
              <span style={{ flex: 1, minWidth: 0, lineHeight: 1.25 }}>
                <b style={{ display: "block", fontSize: 14, fontWeight: 620 }}>{a.name}</b>
                <small style={{ fontSize: 12, color: "var(--color-muted-foreground)" }}>
                  {a.amount} {a.sym} · {networks.find((n) => n.id === a.chain)?.name}
                </small>
              </span>
              <span style={{ textAlign: "right", lineHeight: 1.25, fontVariantNumeric: "tabular-nums" }}>
                <b style={{ display: "block", fontSize: 14, fontWeight: 620 }}>{usd(a.usd)}</b>
                <small style={{ fontSize: 12, color: a.change > 0 ? "#16a36a" : a.change < 0 ? "#e5484d" : "var(--color-muted-foreground)" }}>
                  {a.change > 0 ? "+" : ""}
                  {a.change.toFixed(1)}%
                </small>
              </span>
            </li>
          ))}
          {!shown.length && <li style={{ padding: "18px 2px", fontSize: 13.5, color: "var(--color-muted-foreground)" }}>Pick a network to see its assets.</li>}
        </ul>
      </section>
    </div>
  )
}
