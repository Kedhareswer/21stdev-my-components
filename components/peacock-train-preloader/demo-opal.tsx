"use client"

import * as React from "react"
import PeacockTrainPreloader from "@/components/ui/peacock-train-preloader"

// Real usage: the preloader wraps a page and the page arrives through the ring.
// The opal preset is the ornamental one — beaded, pastel, lilac and sea-glass.
export default function DemoOpal() {
  const [run, setRun] = React.useState(0)
  const [ready, setReady] = React.useState(false)
  return (
    <PeacockTrainPreloader
      key={run}
      preset="opal"
      density="sparse"
      spread={330}
      seed={5}
      durationMs={4200}
      title="Maya Iyer"
      subtitle="Studio"
      meta={["Spring 2026", "Textile · Print · Pattern"]}
      onComplete={() => setReady(true)}
    >
      <main
        style={{
          minHeight: "100svh",
          background: "#f3f3f1",
          color: "#2a2f3a",
          fontFamily: '"Bodoni Moda", "Didot", "Playfair Display", Georgia, serif',
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "clamp(20px, 4vw, 48px)",
          boxSizing: "border-box",
        }}
      >
        <header style={{ display: "flex", justifyContent: "space-between", fontFamily: '"JetBrains Mono", Menlo, monospace', fontSize: 11, letterSpacing: ".22em", textTransform: "uppercase", opacity: 0.7 }}>
          <span>Maya Iyer — Studio</span>
          <span>Work · About · Contact</span>
        </header>
        <section style={{ maxWidth: 820 }}>
          <h1 style={{ margin: 0, fontWeight: 500, fontSize: "clamp(40px, 7.5vw, 112px)", lineHeight: 0.98, letterSpacing: "-.01em" }}>
            Pattern for cloth,
            <br />
            paper and the wall.
          </h1>
          <p style={{ marginTop: 28, maxWidth: 520, fontFamily: "Georgia, serif", fontSize: 18, lineHeight: 1.5, opacity: 0.8 }}>
            Hand-drawn repeats and painted plumage for fashion houses, hotels and homes. Twelve collections, four continents, one sketchbook.
          </p>
        </section>
        <footer style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: '"JetBrains Mono", Menlo, monospace', fontSize: 11, letterSpacing: ".22em", textTransform: "uppercase", opacity: 0.7 }}>
          <span>{ready ? "Loaded through the ring" : "Loading"}</span>
          <button
            type="button"
            onClick={() => {
              setReady(false)
              setRun((r) => r + 1)
            }}
            style={{ font: "inherit", letterSpacing: "inherit", textTransform: "inherit", background: "none", border: "1px solid currentColor", borderRadius: 999, padding: "10px 18px", color: "inherit", cursor: "pointer" }}
          >
            Replay the preloader
          </button>
        </footer>
      </main>
    </PeacockTrainPreloader>
  )
}
