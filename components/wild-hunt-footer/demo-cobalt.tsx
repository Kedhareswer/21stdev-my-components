"use client"

import WildHuntFooter from "@/components/ui/wild-hunt-footer"

// The cobalt preset under Aivazovsky's "The Ninth Wave" (1850, public domain),
// with a short page above it so the footer plays its entrance on scroll.
export default function DemoCobalt() {
  return (
    <div className="w-full">
      <section
        style={{
          minHeight: "70svh",
          display: "grid",
          placeItems: "center",
          padding: "48px 24px",
          background: "#0b1030",
          color: "#dfe4ff",
          fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
          textAlign: "center",
        }}
      >
        <div>
          <p style={{ margin: 0, fontSize: 11, letterSpacing: ".2em", textTransform: "uppercase", opacity: 0.6 }}>Scroll down</p>
          <h1 style={{ margin: "14px 0 0", fontSize: "clamp(28px, 5vw, 56px)", fontWeight: 500, letterSpacing: "-.02em" }}>
            The footer rasters in when it arrives.
          </h1>
        </div>
      </section>
      <WildHuntFooter
        preset="cobalt"
        wordmark="MAELSTROM"
        image={{
          src: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Hovhannes_Aivazovsky_-_The_Ninth_Wave_-_Google_Art_Project.jpg/1280px-Hovhannes_Aivazovsky_-_The_Ninth_Wave_-_Google_Art_Project.jpg",
          alt: "The Ninth Wave — survivors on a broken mast at dawn, by Ivan Aivazovsky, 1850",
          position: "50% 72%",
        }}
        imageHeight={0.5}
        dissolve={0.45}
        tagline="A nautical almanac · tides, swells and the ninth wave · since 1850"
        sideNote="Printed in Saint Petersburg · bound in Tallinn · read at sea"
        columns={[
          { title: "Almanac", links: [{ label: "Tide tables" }, { label: "Swell charts" }, { label: "Moon phases" }] },
          { title: "Press", links: [{ label: "About" }, { label: "Stockists" }, { label: "Wholesale" }] },
          { title: "Elsewhere", links: [{ label: "Instagram" }, { label: "Newsletter" }] },
          { title: "Contact", links: [{ label: "post@maelstrom.press" }] },
        ]}
        colophon="Painting: Ivan Aivazovsky, The Ninth Wave, 1850. State Russian Museum. Public domain, via Wikimedia Commons."
        legal="© 2026 Maelstrom Press"
      />
    </div>
  )
}
