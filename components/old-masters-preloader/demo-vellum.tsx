"use client"

import OldMastersPreloader from "@/components/ui/old-masters-preloader"

const U = "https://images.unsplash.com/photo-"
const Q = "?q=80&w=1600&auto=format&fit=crop"

// Ink on paper: the National Gallery of Art's Perseus watercolour is keyed the
// other way round (subject "dark"), so the figure lifts off its cream ground.
export default function DemoVellum() {
  return (
    <OldMastersPreloader
      tone="vellum"
      wordmark="Artifex"
      figures={[
        { src: U + "1767257147797-9628b6c3d934" + Q, alt: "Perseus holding up the head of Medusa, a watercolour", x: 50, y: 103, h: 112, depth: 1, subject: "dark", threshold: 0.7, softness: 0.12 },
      ]}
      backdrop={null}
      tagline="A person who works with their hands, their brain, and their heart is an artist."
      eyebrow="Be an artist"
      brand="A."
      labels={["Manus", "Mens · Cor"]}
      nav={[{ label: "Works" }, { label: "Sketchbook" }, { label: "Commissions" }, { label: "Letters" }]}
      asides={[
        { title: "Hands", text: "A person who works with their hands is a labourer. The hand learns first; everything else follows it." },
        { title: "Heart", text: "Add the brain and you have a craftsman. Add the heart and the work starts to mean something." },
      ]}
      annotations={[{ x: 26, y: 48, label: "Fig. 1" }]}
      plate="Pl. IV"
      loadingLabel="Preparing"
      cta={{ label: "Enter the studio" }}
    />
  )
}
