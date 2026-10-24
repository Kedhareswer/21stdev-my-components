"use client"

import OldMastersPreloader from "@/components/ui/old-masters-preloader"

// National Gallery of Art on Unsplash: Perseus with the head of Medusa, a watercolour on paper.
const IMAGE = "https://images.unsplash.com/photo-1767257147797-9628b6c3d934?q=80&w=2000&auto=format&fit=crop"

export default function DemoVellum() {
  return (
    <OldMastersPreloader
      tone="vellum"
      image={IMAGE}
      imageAlt="Perseus holding up the head of Medusa, a watercolour on paper"
      focal={[0.5, 0.3]}
      subject="dark"
      threshold={0.74}
      softness={0.18}
      wordmark="Artifex"
      tagline="A person who works with their hands, their brain, and their heart is an artist."
      eyebrow="Be an artist"
      brand="A."
      labels={["Manus", "Mens · Cor"]}
      nav={[{ label: "Works" }, { label: "Sketchbook" }, { label: "Commissions" }, { label: "Letters" }]}
      asides={[
        { title: "Hands", text: "A person who works with their hands is a labourer. The hand learns first; everything else follows it." },
        { title: "Heart", text: "Add the brain and you have a craftsman. Add the heart and the work starts to mean something." },
      ]}
      annotations={[{ x: 28, y: 50, label: "Fig. 1" }]}
      plate="Pl. IV"
      loadingLabel="Preparing"
      cta={{ label: "Enter the studio" }}
    />
  )
}
