"use client"

import InlineLabelComposer, { type Label } from "@/components/ui/inline-label-composer"

const labels: Label[] = [
  { id: "bug", name: "Bug", color: "#e5484d" },
  { id: "checkout", name: "Checkout", color: "#f76b15" },
  { id: "safari", name: "Safari", color: "#0090ff" },
  { id: "ux", name: "UX polish", color: "#6e56cf" },
  { id: "perf", name: "Performance", color: "#30a46c" },
  { id: "p1", name: "P1", color: "#d6409f" },
  { id: "q3", name: "Q3 launch", color: "#12a594" },
]

const row = { display: "grid", gridTemplateColumns: "120px 1fr", alignItems: "center", gap: 12, minHeight: 46 } as const
const key = { fontSize: 14, color: "var(--color-muted-foreground)", display: "flex", alignItems: "center", gap: 8 } as const

export default function Demo() {
  return (
    <div
      style={{
        minHeight: "100svh",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "max(40px, 8vh) 16px 48px",
        background: "var(--color-background)",
        color: "var(--color-foreground)",
        fontFamily: "'Inter Tight', ui-sans-serif, system-ui, sans-serif",
      }}
    >
      <article
        style={{
          width: "min(680px, 100%)",
          minHeight: 600,
          padding: "30px 32px 32px",
          borderRadius: 22,
          background: "color-mix(in oklab, var(--color-background) 97%, var(--color-foreground))",
          boxShadow: "0 0 0 1px var(--color-border), 0 30px 60px -40px rgba(0,0,0,.35)",
        }}
      >
        <div style={{ fontSize: 13, color: "var(--color-muted-foreground)", marginBottom: 12 }}>Storefront / Issues / SF-482</div>
        <h1 style={{ margin: "0 0 14px", fontSize: 36, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.1 }}>Checkout button flickers on Safari 17</h1>
        <p style={{ margin: "0 0 26px", fontSize: 15.5, lineHeight: 1.65, color: "var(--color-muted-foreground)", maxWidth: "56ch" }}>
          On Safari 17 the primary button repaints twice when the shipping total updates. Repro on the cart page with two items and a discount code.
        </p>
        <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: 14 }}>
          <div style={row}>
            <span style={key}>Status</span>
            <span style={{ fontSize: 14.5, display: "inline-flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: 99, background: "#ffb224" }} /> In progress
            </span>
          </div>
          <div style={row}>
            <span style={key}>Assignee</span>
            <span style={{ fontSize: 14.5, display: "inline-flex", alignItems: "center", gap: 8 }}>
              <img
                src="https://images.unsplash.com/photo-1580489944761-15a19d654956?w=64&h=64&fit=crop&crop=faces&q=70"
                alt=""
                width={24}
                height={24}
                style={{ borderRadius: 99, objectFit: "cover", maxWidth: "none" }}
              />
              Priya Raman
            </span>
          </div>
          {/* labels sit last, so the picker opens over the panel's open space instead of over text */}
          <div style={row}>
            <span style={key}>Labels</span>
            <InlineLabelComposer labels={labels} defaultValue={["bug", "safari", "checkout"]} />
          </div>
        </div>
      </article>
    </div>
  )
}
