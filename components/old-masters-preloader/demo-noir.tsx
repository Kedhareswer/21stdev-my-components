"use client"

import OldMastersPreloader from "@/components/ui/old-masters-preloader"

const U = "https://images.unsplash.com/photo-"
const Q = "?q=80&w=1600&auto=format&fit=crop"

// Black and gold, a script initial, three different statues: Content Pixie's
// helmeted Minerva, Filipe Nobre's kneeling figure, ONUR KURT's standing nude.
export default function DemoNoir() {
  return (
    <OldMastersPreloader
      tone="noir"
      face="grotesk"
      scriptInitial
      wordmark="Erudition"
      palette={{ word: "#e2b857", accent: "#f2cf6e" }}
      figures={[
        { src: U + "1670813885725-e3c5391dcd31" + Q, alt: "A helmeted marble head of Minerva", x: 50, y: 110, h: 112, depth: 0.8, threshold: 0.3, softness: 0.24 },
        { src: U + "1786708598101-080be8c5bd45" + Q, alt: "A kneeling marble figure with crossed arms", x: 24, y: 100, h: 70, depth: 1.25, threshold: 0.18 },
        { src: U + "1772617616150-06035fa7ff44" + Q, alt: "A standing marble nude looking down", x: 80, y: 100, h: 92, depth: 1.05, flip: true, threshold: 0.14, phone: false },
      ]}
      backdrop={U + "1584727638096-042c45049ebe" + Q}
      exposure={1.08}
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
        { x: 30, y: 40, label: "0.7324" },
        { x: 64, y: 30, label: "1.1429" },
        { x: 47, y: 56, label: "1.0000" },
      ]}
      plate="Pl. II"
      loadingLabel="Illuminating"
      cta={{ label: "Begin reading" }}
    />
  )
}
