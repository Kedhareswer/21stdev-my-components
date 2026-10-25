"use client"

import HoneyLabelFooter from "@/components/ui/honey-label-footer"

export default function DemoAmber() {
  return (
    <div className="w-full">
      <HoneyLabelFooter
        preset="amber"
        seed={23}
        name="Acre"
        tagline="Acacia blossom honey"
        medalNote="Cold-spun, never heated"
        claim={{ value: "1 km", label: "from hive to jar" }}
        headline={{ eyebrow: "Estate honey", title: "Acacia", meta: "Net wt. 450 g (15.9 oz)" }}
        barcode="4006381333931"
        blurb={{
          title: "From the orchard",
          paragraphs: [
            "Acacia blooms for three weeks in May. The bees work it from first light, and we take only the frames they have capped.",
            "Pale, slow to set, and clean enough to taste the tree.",
          ],
        }}
        columns={[
          { title: "Jars", links: [{ label: "Acacia", href: "#" }, { label: "Orange blossom", href: "#" }, { label: "Chestnut", href: "#" }, { label: "Tasting flight", href: "#" }] },
          { title: "Estate", links: [{ label: "Visit", href: "#" }, { label: "The orchard", href: "#" }, { label: "Wholesale", href: "#" }, { label: "Contact", href: "#" }] },
        ]}
        socials={[
          { icon: "instagram", href: "#" },
          { icon: "youtube", href: "#" },
          { icon: "linkedin", href: "#" },
        ]}
        copyright="© 2026 Acre Apiaries. Pressed in the valley."
      />
    </div>
  )
}
