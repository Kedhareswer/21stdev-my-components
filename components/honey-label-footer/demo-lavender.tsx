"use client"

import HoneyLabelFooter from "@/components/ui/honey-label-footer"

export default function DemoLavender() {
  return (
    <div className="w-full">
      <HoneyLabelFooter
        preset="lavender"
        seed={41}
        density={1.2}
        name="Velour"
        tagline="Lavender field honey"
        medalNote="Provence, single estate"
        claim={{ value: "No. 7", label: "harvest of the year" }}
        headline={{ eyebrow: "Limited pour", title: "Lavender", meta: "Net wt. 250 g (8.8 oz)" }}
        barcode="3760123456"
        facts={{
          title: "Harvest Facts",
          serving: "One jar, one field, one week",
          amountLabel: "Per harvest",
          headline: ["Hives", "48"],
          dvLabel: "Of the estate*",
          rows: [
            { label: "Fields", value: "3", pct: "100%" },
            { label: "Altitude", value: "740 m", pct: "" },
            { label: "Extraction", value: "cold", pct: "" },
            { label: "Water", value: "17.2%", sub: true },
          ],
          footnote: "*Numbers from the 2026 lavender bloom.",
        }}
        blurb={{
          title: "From the field",
          paragraphs: [
            "The hives go up the week the lavender turns, and come down the week it fades. Everything in the jar was gathered in between.",
            "Floral, faintly resinous, and slow to set.",
          ],
        }}
        columns={[
          { title: "Jars", links: [{ label: "Lavender", href: "#" }, { label: "Thyme", href: "#" }, { label: "Rosemary", href: "#" }, { label: "Trio", href: "#" }] },
          { title: "Estate", links: [{ label: "The field", href: "#" }, { label: "Visits", href: "#" }, { label: "Journal", href: "#" }] },
          { title: "Help", links: [{ label: "Shipping", href: "#" }, { label: "Stockists", href: "#" }, { label: "Contact", href: "#" }] },
        ]}
        newsletter={{ title: "Bloom notes", hint: "A letter when the field turns purple.", button: "Join" }}
        socials={[{ icon: "instagram", href: "#" }, { icon: "x", href: "#" }]}
        bee={false}
      />
    </div>
  )
}
