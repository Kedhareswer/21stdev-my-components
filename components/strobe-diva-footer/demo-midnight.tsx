"use client"

import StrobeDivaFooter from "@/components/ui/strobe-diva-footer"

// The inverted print: a white figure on black, the red word on a bone band.
export default function DemoMidnight() {
  return (
    <div className="w-full">
      <StrobeDivaFooter
        preset="midnight"
        wordmark="NOCTURNE"
        sealText="Nocturne · Paris · Tokyo ·"
        established="1991"
        barcode="4007198813"
        arms={8}
        fanStep={13}
        columns={[
          { title: "House", links: [{ label: "Manifesto", href: "#" }, { label: "Atelier", href: "#" }, { label: "Press", href: "#" }] },
          { title: "Shop", links: [{ label: "New arrivals", href: "#" }, { label: "Eyewear", href: "#" }, { label: "Leather", href: "#" }, { label: "Gift card", href: "#" }] },
          { title: "Help", links: [{ label: "Orders", href: "#" }, { label: "Returns", href: "#" }, { label: "Stockists", href: "#" }] },
          { title: "Social", links: [{ label: "Instagram", href: "https://instagram.com" }, { label: "YouTube", href: "https://youtube.com" }, { label: "Newsletter", href: "#" }] },
        ]}
        copyright="© 2026 Nocturne SAS"
        legalLinks={[{ label: "Privacy", href: "#" }, { label: "Legal notice", href: "#" }]}
      />
    </div>
  )
}
