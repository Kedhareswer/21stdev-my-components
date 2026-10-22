"use client"

import InfiniteShotStack from "@/components/ui/infinite-shot-stack"

// Inside a page: the deck pins, page scroll walks it once round, and then the page carries on.
const band = {
  minHeight: "70svh",
  display: "grid",
  placeContent: "center",
  padding: "0 24px",
  textAlign: "center",
  fontFamily: "Inter, Helvetica, Arial, sans-serif",
  background: "#efede8",
  color: "#121110",
} as const

export default function DemoPinned() {
  return (
    <div>
      <section style={band}>
        <p style={{ fontSize: 14, letterSpacing: ".14em", textTransform: "uppercase", opacity: 0.6 }}>Halden studio</p>
        <h2 style={{ fontSize: "clamp(40px, 7vw, 96px)", margin: "12px 0 0", letterSpacing: "-.04em", fontWeight: 600 }}>Selected work</h2>
        <p style={{ marginTop: 16, opacity: 0.7 }}>Scroll on.</p>
      </section>
      <InfiniteShotStack theme="light" brand="halden" />
      <section style={band}>
        <h2 style={{ fontSize: "clamp(32px, 5vw, 64px)", margin: 0, letterSpacing: "-.04em", fontWeight: 600 }}>Have a project?</h2>
        <p style={{ marginTop: 16, opacity: 0.7 }}>hello@halden.studio</p>
      </section>
    </div>
  )
}
