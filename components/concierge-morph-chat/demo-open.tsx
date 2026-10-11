import React from "react"
import ConciergeMorphChat from "@/components/ui/concierge-morph-chat"

/**
 * Open on load, re-dressed for a bookshop: a different persona, headline,
 * chips, accent and brand, and a custom `onSend` answering in its own voice.
 */
export default function ConciergeMorphChatOpenDemo() {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100svh",
        minHeight: 720,
        overflow: "hidden",
        background: "radial-gradient(120% 90% at 20% 10%, #eef0ea 0%, #dfe3da 60%, #cfd5c9 100%)",
      }}
    >
      <ConciergeMorphChat
        placement="absolute"
        defaultOpen
        name="Theo"
        role="Bookseller, fiction & poetry"
        greeting="Need a next read? I have opinions."
        accent="#2f4a3a"
        avatar={<Monogram />}
        title={
          <>
            Tell me what you loved,
            <br />
            I'll find what's next.
          </>
        }
        intro={["Recommendations from people who read.", "Signed copies, pre-orders and gift wrap."]}
        suggestions={["Surprise me", "Short & sad", "Gift for dad"]}
        placeholders={["Something like Normal People", "A thriller I won't guess", "Poetry for a rainy week"]}
        brand={{ name: "paperleaf" }}
        onSend={(text) =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  text:
                    "“" + text + "” — good brief. Start with Claire Keegan's Small Things Like These: short, quiet and it lands like a stone in a pond.",
                  suggestions: ["Something longer", "More like that", "Gift wrap it"],
                }),
              900,
            ),
          )
        }
      />
    </div>
  )
}

/** Any node can stand in for the portrait — here, a bookplate monogram. */
function Monogram() {
  return (
    <svg viewBox="0 0 36 36" width={36} height={36} style={{ display: "block", maxWidth: "none" }}>
      <circle cx="18" cy="18" r="18" fill="#2f4a3a" />
      <circle cx="18" cy="18" r="14.5" fill="none" stroke="#e9e4d4" strokeOpacity="0.45" strokeWidth="0.6" />
      <text
        x="18"
        y="23.4"
        textAnchor="middle"
        fill="#f1ecdc"
        fontFamily='"Iowan Old Style", "Palatino Linotype", Georgia, serif'
        fontSize="17"
        fontStyle="italic"
      >
        T
      </text>
    </svg>
  )
}
