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
        portrait={{
          src: "https://images.unsplash.com/photo-1782036179042-2b144a09a22c?auto=format&fit=crop&crop=focalpoint&fp-x=0.5&fp-y=0.33&fp-z=1.2&w=1100&h=1375&q=85",
          alt: "An elderly woman in a deep blue printed headscarf, smiling",
          eyes: [
            [0.381, 0.414],
            [0.59, 0.414],
          ],
          outline: [
            [0.445, 0.106], [0.595, 0.125], [0.68, 0.18], [0.733, 0.25], [0.762, 0.334], [0.79, 0.436], [0.82, 0.52],
            [0.875, 0.6], [0.92, 0.68], [0.93, 0.78], [0.9, 0.9], [0.86, 1.02], [0.14, 1.02], [0.1, 0.9], [0.07, 0.78],
            [0.08, 0.66], [0.12, 0.57], [0.155, 0.48], [0.174, 0.38], [0.19, 0.29], [0.228, 0.205], [0.295, 0.138],
          ],
        }}
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
