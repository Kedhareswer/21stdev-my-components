"use client"

import SerumDiveScrollHero from "@/components/ui/serum-dive-scroll-hero"

const FONT = "'Instrument Sans', ui-sans-serif, system-ui, sans-serif"
const GUTTER = "clamp(20px, 4.4vw, 72px)"

const STEPS = [
  { n: "01", title: "Three drops", body: "Press them into damp skin, morning and night." },
  { n: "02", title: "Two months", body: "One bottle, used twice a day, lasts about eight weeks." },
  { n: "03", title: "Thirty days", body: "Try it for a month. Not for you? Send it back." },
]

export default function Demo() {
  return (
    // width: 100% is load-bearing. 21st centres every demo in a flex wrapper, and
    // a flex item left at width: auto shrinks to fit its contents, which squeezes
    // a full-bleed hero into a narrow strip.
    <main style={{ width: "100%", background: "#f4ece7", color: "#232323", fontFamily: FONT }}>
      {/* autoPlay is for this unattended preview: it plays the dive once, then scrolling is yours. */}
      <SerumDiveScrollHero autoPlay />

      <section
        style={{
          minHeight: "100svh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: "clamp(40px, 7svh, 88px)",
          padding: "clamp(72px, 12svh, 140px) " + GUTTER,
        }}
      >
        <div>
          <p style={{ margin: 0, fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase", color: "#12786d" }}>How to use it</p>
          <h2
            style={{
              margin: "18px 0 0",
              maxWidth: "14em",
              fontSize: "clamp(30px, 4.6vw, 64px)",
              fontWeight: 500,
              lineHeight: 1.04,
              letterSpacing: "-0.025em",
            }}
          >
            Water in. Tightness out.
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "32px clamp(24px, 4vw, 64px)" }}>
          {STEPS.map((s) => (
            <div key={s.n} style={{ borderTop: "1px solid rgba(35, 35, 35, 0.16)", paddingTop: 18 }}>
              <p style={{ margin: 0, fontSize: 13, opacity: 0.55 }}>{s.n}</p>
              <h3 style={{ margin: "14px 0 0", fontSize: 22, fontWeight: 500, letterSpacing: "-0.01em", lineHeight: 1.2 }}>{s.title}</h3>
              <p style={{ margin: "8px 0 0", maxWidth: "30em", fontSize: 15, lineHeight: 1.5, opacity: 0.75 }}>{s.body}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
