"use client"

import GildedGazeFooter from "@/components/ui/gilded-gaze-footer"

export default function DemoMoon() {
  return (
    <div className="w-full">
      <GildedGazeFooter
        preset="moon"
        seed={19}
        kicker="A"
        title="House of"
        subtitle="Moonlight"
        quirk="o"
        description="Silverwork, indigo and old stories. A jewellery atelier that has been setting stones by lamplight since 1962, now shipping worldwide."
        brand="Chandra Atelier"
        fontHref="https://fonts.googleapis.com/css2?family=Anton&display=swap"
        columns={[
          { title: "Atelier", links: [{ label: "Collections", href: "#" }, { label: "Bespoke", href: "#" }, { label: "Our makers", href: "#" }] },
          { title: "Visit", links: [{ label: "Jaipur salon", href: "#" }, { label: "Book a fitting", href: "#" }, { label: "Events", href: "#" }] },
          { title: "Care", links: [{ label: "Shipping", href: "#" }, { label: "Repairs", href: "#" }, { label: "Certificates", href: "#" }] },
          { title: "Legal", links: [{ label: "Privacy", href: "#" }, { label: "Terms", href: "#" }] },
        ]}
        socials={[
          { icon: "instagram", href: "https://instagram.com" },
          { icon: "youtube", href: "https://youtube.com" },
          { icon: "mail", href: "mailto:hello@example.com" },
        ]}
      />
    </div>
  )
}
