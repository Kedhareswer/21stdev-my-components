"use client"

import MeadowRiseFooter from "@/components/ui/meadow-rise-footer"

export default function DemoGolden() {
  return (
    <div className="w-full">
      <MeadowRiseFooter
        preset="golden"
        seed={11}
        mist={0.75}
        name="Hearthfield"
        heading={"Slow mornings,\n*well-kept* evenings."}
        subheading="A small guesthouse on the edge of the downs. Twelve rooms, one long table."
        cta={{ label: "Plan a stay", href: "#" }}
        tagline="Seasonal letters from the farm — what's growing, what's cooking, what's open."
        successMessage="Lovely. The next letter comes with the harvest."
        columns={[
          { title: "Stay", links: [{ label: "Rooms" }, { label: "Suppers" }, { label: "Gift a night" }] },
          { title: "The farm", links: [{ label: "Our story" }, { label: "Kitchen garden" }, { label: "Walks" }] },
          { title: "Visit", links: [{ label: "Getting here" }, { label: "Contact" }] },
        ]}
        socials={[{ icon: "instagram", href: "https://instagram.com" }, { icon: "youtube", href: "https://youtube.com" }]}
      />
    </div>
  )
}
