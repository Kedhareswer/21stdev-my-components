import React from "react"
import ConciergeMorphChat from "@/components/ui/concierge-morph-chat"

/**
 * A quiet storefront with the concierge waiting in the corner. Press the
 * portrait and it morphs into the chat; the close button morphs it back.
 */
export default function ConciergeMorphChatDemo() {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100svh",
        minHeight: 720,
        overflow: "hidden",
        background: "linear-gradient(160deg, #f7f4ef 0%, #efe9e1 55%, #e4dccf 100%)",
        color: "#1a1714",
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
      }}
    >
      <nav
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "22px 32px",
          fontSize: 13,
          letterSpacing: "0.02em",
        }}
      >
        <span style={{ fontFamily: "Georgia, serif", fontSize: 22, letterSpacing: "-0.03em" }}>maison</span>
        <span style={{ display: "flex", gap: 24, opacity: 0.7 }}>
          <span>New in</span>
          <span>Linen</span>
          <span>Journal</span>
          <span>Bag (0)</span>
        </span>
      </nav>
      <div style={{ padding: "8vh 32px 0", maxWidth: 560 }}>
        <p style={{ fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", opacity: 0.55, margin: 0 }}>
          The summer edit
        </p>
        <h1
          style={{
            fontFamily: '"Iowan Old Style", "Palatino Linotype", Georgia, serif',
            fontWeight: 400,
            fontSize: "clamp(40px, 7vw, 76px)",
            lineHeight: 1,
            letterSpacing: "-0.04em",
            margin: "14px 0 18px",
          }}
        >
          Made for
          <br />
          slow, warm days.
        </h1>
        <p style={{ fontSize: 15, lineHeight: 1.6, opacity: 0.7, maxWidth: 380, margin: 0 }}>
          Washed linen, gauze and cotton — cut loose, made to soften. Not sure where to start? Ask Lana in the corner.
        </p>
      </div>
      <ConciergeMorphChat placement="absolute" />
    </div>
  )
}
