"use client"

import DuneHaulFooter from "@/components/ui/dune-haul-footer"

export default function DemoSage() {
  return (
    <div className="w-full">
      <DuneHaulFooter
        preset="sage"
        seed={4}
        name="Greenlane"
        tripSeconds={14}
        honk="Toot toot!"
        columns={[
          { title: "Farm box", links: [{ label: "This week" }, { label: "Our growers" }, { label: "Delivery map" }] },
          { title: "Company", links: [{ label: "About" }, { label: "Careers" }, { label: "Press" }] },
          { title: "Help", links: [{ label: "FAQ" }, { label: "Contact", href: "mailto:hello@greenlane.farm" }] },
        ]}
        socials={[
          { icon: "instagram", href: "https://instagram.com" },
          { icon: "youtube", href: "https://youtube.com" },
          { icon: "github", href: "https://github.com" },
        ]}
      />
    </div>
  )
}
