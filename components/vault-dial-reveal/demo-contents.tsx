"use client"

import VaultDialReveal from "@/components/ui/vault-dial-reveal"

// Anything can go in the safe. Children replace the coin and pick up the glow.
export default function Demo() {
  return (
    <div className="w-full">
      <VaultDialReveal code={[4, 20]} tone="bone" metal="rose" engraving="LETTERS · DO NOT FORWARD" caption={null}>
        <div
          style={{
            width: 230,
            padding: "26px 22px",
            background: "linear-gradient(160deg, #fffaf2, #efe3cf)",
            borderRadius: 6,
            boxShadow: "0 18px 40px rgba(80,40,20,.35), 0 0 60px rgba(255,160,120,.35)",
            transform: "rotate(-4deg)",
            color: "#5a3b2c",
            fontFamily: "Georgia, 'Times New Roman', serif",
          }}
        >
          <div style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", opacity: 0.6 }}>For you</div>
          <div style={{ fontSize: 26, lineHeight: 1.15, margin: "10px 0 12px", fontStyle: "italic" }}>
            You found the combination.
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.5, opacity: 0.8 }}>Some things are worth turning a wheel for.</div>
        </div>
      </VaultDialReveal>
    </div>
  )
}
