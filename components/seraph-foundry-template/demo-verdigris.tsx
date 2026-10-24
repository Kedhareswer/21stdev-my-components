"use client"

import SeraphFoundryTemplate from "@/components/ui/seraph-foundry-template"

// A second foundry on the same template: verdigris ink and fluorescent orange,
// a different face name, copy, records and artwork.
export default function DemoVerdigris() {
  return (
    <div className="w-full">
      <SeraphFoundryTemplate
        preset="verdigris"
        typeface={{ name: "Verdance", foundry: "Old Copper Letterworks", glyphs: 1120 }}
        hero={{
          kicker: "Salt & Patina",
          sub: "A face for weathered things",
          lines: ["Ve[rd]ant", "and", "Ru[st]ed"],
          note: "Copper turns green in the rain, and the green is the part that lasts. Verdance is cut for harbour signs, ferry tickets and the covers of slow records.",
        }}
        pressings={[
          { title: "Lowtide", kicker: "Songs from the Pier", label: "TID" },
          { title: "Brine", kicker: "Harbour Hymns", label: "RIN" },
        ]}
        samples={["Ferries leave at dawn", "Verdant and Rusted", "Pier 7 — Lowtide, 1964"]}
        images={{
          crest: { src: "https://images.unsplash.com/photo-1573823252145-4df9430b057a?auto=format&fit=crop&w=1400&q=80", focus: [0.5, 0.3], levels: [0.1, 0.85], alt: "A bronze angel in fog" },
        }}
        closing={{ kicker: "Fair Winds", title: "Farewell", vertical: "Letterworks" }}
        currency="€"
      />
    </div>
  )
}
