"use client"

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

export default function Demo() {
  return (
    <div
      style={{
        minHeight: "100svh",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "72px 16px",
        background: "radial-gradient(60% 45% at 50% 0%, rgba(106,76,255,.16), transparent 70%), var(--color-background)",
      }}
    >
      <div style={{ width: "min(320px, 100%)" }}>
        <ChainNetworkSelector networks={networks} defaultValue={["eth", "base", "arb", "op", "poly"]} defaultOpen />
      </div>
    </div>
  )
}
