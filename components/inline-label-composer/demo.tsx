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

const row = { display: "grid", gridTemplateColumns: "110px 1fr", alignItems: "center", gap: 12, minHeight: 40 } as const
const key = { fontSize: 13, color: "var(--color-muted-foreground)", display: "flex", alignItems: "center", gap: 8 } as const

export default function Demo() {
  return (
    <div
      style={{
        minHeight: "100svh",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "72px 16px",
        background: "var(--color-background)",
        color: "var(--color-foreground)",
        fontFamily: "'Inter Tight', ui-sans-serif, system-ui, sans-serif",
      }}
    >
      <article style={{ width: "min(560px, 100%)" }}>
        <div style={{ fontSize: 12.5, color: "var(--color-muted-foreground)", marginBottom: 10 }}>Storefront / Issues / SF-482</div>
        <h1 style={{ margin: "0 0 22px", fontSize: 30, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.1 }}>Checkout button flickers on Safari 17</h1>
        <div style={row}>
          <span style={key}>Status</span>
          <span style={{ fontSize: 13.5, display: "inline-flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: 99, background: "#ffb224" }} /> In progress
          </span>
        </div>
        <div style={row}>
          <span style={key}>Assignee</span>
          <span style={{ fontSize: 13.5, display: "inline-flex", alignItems: "center", gap: 8 }}>
            <img
              src="https://images.unsplash.com/photo-1580489944761-15a19d654956?w=64&h=64&fit=crop&crop=faces&q=70"
              alt=""
              width={22}
              height={22}
              style={{ borderRadius: 99, objectFit: "cover", maxWidth: "none" }}
            />
            Priya Raman
          </span>
        </div>
        <div style={row}>
          <span style={key}>Labels</span>
          <InlineLabelComposer labels={labels} defaultValue={["bug", "safari", "checkout"]} />
        </div>
        <p style={{ marginTop: 26, fontSize: 14.5, lineHeight: 1.65, color: "var(--color-muted-foreground)", borderTop: "1px solid var(--color-border)", paddingTop: 20 }}>
          On Safari 17 the primary button repaints twice when the shipping total updates. Repro on the cart page with two items and a discount code.
        </p>
      </article>
    </div>
  )
}
