"use client"

import SerumDiveScrollHero from "@/components/ui/serum-dive-scroll-hero"

export default function Demo() {
  return (
    <main style={{ background: "#0a3b37" }}>
      <SerumDiveScrollHero />
      <section style={{ height: "100svh", display: "grid", placeItems: "center", color: "#cfe6e1", fontFamily: "ui-sans-serif, system-ui, sans-serif", fontSize: 15 }}>
        The rest of your page continues here.
      </section>
    </main>
  )
}
