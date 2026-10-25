"use client"

import BenthosCollectionTemplate from "@/components/ui/benthos-collection-template"

// A second studio on the same template: the midnight preset (navy water, amber
// coral), a different collection, and two prints that are photographs instead
// of drawings — anything with a `src` hangs in the frame as it is.
const U = (id: string) => "https://images.unsplash.com/photo-" + id + "?auto=format&fit=crop&w=1200&q=80"

export default function DemoMidnight() {
  return (
    <div className="w-full">
      <BenthosCollectionTemplate
        preset="midnight"
        brand="Fathom"
        brandNote="Press"
        hero={{ kicker: "Field notes, 1890 – 2026", title: "Deep Water", script: "specimens", badge: "140+", byline: "by Fathom Press", tagline: "plates, patterns & paper goods from the twilight zone", cta: "Buy the set" }}
        deep={{
          title: "A hundred and forty pieces from below the light.",
          body: "Drawn from dredge logs and glass-plate photographs, then painted in two inks. Everything is layered and loose, so the set comes apart as easily as it goes together.",
          stats: [
            { value: 80, label: "Ink & wash elements", note: "transparent PNG + PSD" },
            { value: 24, label: "Line icons", note: "SVG, single stroke" },
            { value: 12, label: "Seamless patterns", note: "6000 px tiles" },
            { value: 12, label: "Framed plates", note: "A2, 300 dpi" },
            { value: 8, label: "Paper goods", note: "labels, cards, envelopes" },
            { value: 4, label: "Palettes", note: "ASE + CSS" },
          ],
          formats: ["PNG", "SVG", "PSD", "PDF", "ASE"],
        }}
        moodboard={{
          kicker: "From the log book",
          title: "Specimens for the drawing room",
          body: "Hang a plate, line an envelope, label a jar. The set was made for people who keep things in cabinets.",
          posterNumber: "Plate II",
          posterTitle: "Medusae",
          posterNote: "Periphylla · 1 of 12 plates",
          envelopeTitle: "The dredge report",
          envelopeBody: "One letter a season with new plates and a free swatch.",
          envelopePlaceholder: "you@lighthouse.org",
        }}
        palette={[
          { name: "Fathom Navy", hex: "#16303d" },
          { name: "Harbour Blue", hex: "#4a6b86" },
          { name: "Lamp Amber", hex: "#d98a3c" },
          { name: "Bone", hex: "#d3c3a6" },
          { name: "Kelp Dark", hex: "#3f6e68" },
          { name: "Fog", hex: "#e6eaec" },
        ]}
        patterns={[
          { key: "night-reef", name: "Night Reef", note: "a seaweed garden below the light" },
          { key: "octopus-slate", name: "Octopus Slate", note: "octopuses on harbour blue" },
          { key: "kelp-garden", name: "Kelp Garden", note: "watercolour kelp in columns" },
          { key: "shell-toss", name: "Shell Toss", note: "scallops and nautilus on bone" },
        ]}
        plates={[
          { title: "Moon jelly", latin: "Aurelia aurita", art: "jellyfish" },
          { title: "Octopus, in glass", latin: "Octopus vulgaris, 2019", src: U("1545671913-b89ac1b4ac10"), alt: "An octopus spreading its arms against aquarium glass", note: "A photograph printed on the same cotton rag as the drawings." },
          { title: "Chambered nautilus", latin: "Nautilus pompilius", art: "nautilus" },
          { title: "Common octopus", latin: "Octopus vulgaris", art: "octopus" },
          { title: "Anthias over the reef", latin: "Pseudanthias, 2021", src: U("1582967788606-a171c1080cb0"), alt: "Orange anthias schooling over a coral reef", note: "A photograph plate." },
          { title: "Venus sea fan", latin: "Gorgonia ventalina", art: "seafan" },
        ]}
        printsCopy={{ title: "Twelve plates for a dark hallway", body: "Drawn plates and photographic plates hang in the same frame: an ink mat, a hairline border, a Latin name." }}
        licenses={[
          { id: "personal", name: "Personal", blurb: "Your own walls and notebooks.", price: 24, features: ["All 140+ files", "PNG, SVG, PDF", "Lifetime updates"] },
          { id: "studio", name: "Studio", blurb: "Client work and small runs.", price: 64, features: ["Everything in Personal", "PSD sources", "Up to 10,000 end products"], featured: true },
          { id: "press", name: "Press", blurb: "Publishing and print on demand.", price: 180, features: ["Everything in Studio", "Unlimited end products", "Print on demand"] },
        ]}
        currency="€"
        footer={{ title: "Fathom", body: "A small press for the deep sea. Printed in Bergen.", legal: "© 2026 Fathom Press." }}
        onBuy={(order) => console.log("buy", order)}
        onSubscribe={(email) => console.log("subscribe", email)}
      />
    </div>
  )
}
