"use client"

import PluckedStringFooter from "@/components/ui/plucked-string-footer"

export default function DemoDark() {
  return (
    <div className="w-full">
      <PluckedStringFooter
        theme="dark"
        accent="#7ce0b8"
        brand="Orbitly"
        label="Start building"
        heading="Ship your next release on Friday, calmly."
        text="Orbitly runs your previews, checks and rollouts in one place. Start free, invite the team when you're ready."
        email="sales@orbitly.app"
        columns={[
          { title: "Product", links: [{ label: "Features", href: "#" }, { label: "Pricing", href: "#" }, { label: "Changelog", href: "#" }, { label: "Status", href: "#" }] },
          { title: "Developers", links: [{ label: "Docs", href: "#" }, { label: "API", href: "#" }, { label: "CLI", href: "#" }] },
          { title: "Company", links: [{ label: "About", href: "#" }, { label: "Careers", href: "#" }, { label: "Contact", href: "#" }] },
          { title: "Legal", links: [{ label: "Privacy", href: "#" }, { label: "Terms", href: "#" }, { label: "DPA", href: "#" }] },
        ]}
        legal="© 2026 Orbitly, Inc."
        socials={[{ label: "X", href: "#" }, { label: "GitHub", href: "#" }, { label: "Discord", href: "#" }]}
      />
    </div>
  )
}
