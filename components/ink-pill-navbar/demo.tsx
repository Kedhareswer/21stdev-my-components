"use client"

import InkPillNavbar from "@/components/ui/ink-pill-navbar"

export default function Demo() {
  return (
    <div
      style={{
        position: "relative",
        minHeight: "max(560px, 100svh)",
        padding: "28px 16px 64px",
        overflow: "hidden",
        background: "color-mix(in oklab, var(--color-background) 94%, #ff4d2e)",
        color: "var(--color-foreground)",
      }}
    >
      <InkPillNavbar
        brand={
          <svg width="22" height="22" viewBox="0 0 22 22" aria-label="Ostra">
            <circle cx="11" cy="11" r="10" fill="currentColor" />
            <circle cx="11" cy="11" r="4.2" fill="#ff4d2e" />
          </svg>
        }
        items={[{ label: "Work" }, { label: "Studio" }, { label: "Services" }, { label: "Journal" }, { label: "Contact" }]}
        current={0}
        cta={{ label: "Start a project" }}
      />
      <div style={{ maxWidth: 1100, margin: "clamp(56px,12vh,120px) auto 0", padding: "0 8px" }}>
        <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--color-muted-foreground)" }}>
          Ostra — independent design studio, Porto
        </div>
        <h1 style={{ margin: "18px 0 0", fontSize: "clamp(48px,9vw,140px)", fontWeight: 700, lineHeight: 0.9, letterSpacing: "-0.055em" }}>
          Brands with
          <br />a pulse<span style={{ color: "#ff4d2e" }}>.</span>
        </h1>
        <p style={{ maxWidth: 440, marginTop: 24, fontSize: 17, lineHeight: 1.55, color: "var(--color-muted-foreground)" }}>
          Identity, packaging and websites for food, music and hospitality. Twelve people, one long table.
        </p>
      </div>
    </div>
  )
}
