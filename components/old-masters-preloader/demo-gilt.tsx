"use client"

import OldMastersPreloader from "@/components/ui/old-masters-preloader"

// Europeana on Unsplash: a hermit scholar at his book, painted in candlelight.
const IMAGE = "https://images.unsplash.com/photo-1584727638096-042c45049ebe?q=80&w=2000&auto=format&fit=crop"

export default function DemoGilt() {
  return (
    <OldMastersPreloader
      image={IMAGE}
      imageAlt="A bearded hermit reading by candlelight, an old-master painting"
      focal={[0.5, 0]}
      threshold={0.34}
      softness={0.2}
      face="grotesk"
      scriptInitial
      wordmark="Erudition"
      palette={{ word: "#e2b857", accent: "#f2cf6e" }}
      tagline="We are the product of everything that came before us."
      eyebrow="Philosophia · Sapientia"
      brand="E."
      labels={["Philosophia", "Sapientia"]}
      nav={[{ label: "Essays" }, { label: "Lectures" }, { label: "Library" }, { label: "Letters" }]}
      asides={[
        { title: "Thesis", text: "Humanity has always been driven by the desire to understand. What we discover becomes the foundation for what comes next." },
        { title: "Method", text: "Every great discovery begins with curiosity. A question becomes an observation; an observation becomes an idea." },
      ]}
      annotations={[
        { x: 30, y: 46, label: "0.7324" },
        { x: 60, y: 36, label: "1.1429" },
        { x: 46, y: 60, label: "1.0000" },
      ]}
      plate="Pl. III"
      loadingLabel="Illuminating"
      cta={{ label: "Begin reading" }}
    />
  )
}
