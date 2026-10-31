"use client"

import PrismSilkFooter from "@/components/ui/prism-silk-footer"

export default function Demo() {
  return (
    <div className="w-full">
      <PrismSilkFooter
        preset="nocturne"
        seed={11}
        name="Afterglow"
        tagline="Night-shift tooling for teams who ship while the city sleeps."
        socials={[
          { icon: "x", href: "https://x.com" },
          { icon: "github", href: "https://github.com" },
          { icon: "dribbble", href: "https://dribbble.com" },
        ]}
        columns={[
          { title: "Product", links: [{ label: "Overview" }, { label: "Agents", badge: "Beta" }, { label: "Pricing" }, { label: "Changelog" }] },
          { title: "Company", links: [{ label: "Manifesto" }, { label: "Careers", badge: "Hiring" }, { label: "Contact" }] },
          { title: "Legal", links: [{ label: "Privacy" }, { label: "Terms" }, { label: "Security" }] },
        ]}
        credit={{ label: "Makora Studio", href: "#" }}
      />
    </div>
  )
}
