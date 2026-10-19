"use client"

import PushpinTearFooter from "@/components/ui/pushpin-tear-footer"

// Re-branded: a print shop on vermilion stock, its own copy and contacts.
export default function DemoEmber() {
  return (
    <div className="w-full bg-[#ff4a1c]">
      <PushpinTearFooter
        brand="ink."
        eyebrow="riso co."
        sheet="#ff4a1c"
        paper="#f1ede4"
        paperInk="#1b1712"
        seed={23}
        switchLabels={["càlm", "néws"]}
        edition={["RUN 0412", "ED. 1088"]}
        contacts={[
          { name: "Halvorsen", role: "Print orders", handle: "@halvorsen.ink", href: "mailto:orders@example.com" },
          { name: "Adeyemi", role: "Studio visits", handle: "@adeyemi.ink", href: "mailto:visits@example.com" },
          { name: "Sato", role: "Collabs", handle: "@sato.ink", href: "mailto:collab@example.com" },
        ]}
        progress={{ label: "sold out", value: "86,2%", href: "#" }}
        utility={{
          label: "etc.",
          links: [
            { icon: "globe", label: "Stockists", href: "#" },
            { icon: "mail", label: "Wholesale", href: "#" },
          ],
          word: { label: "shop.", href: "#" },
        }}
        socials={[
          { icon: "ig", label: "Instagram", href: "#" },
          { icon: "x", label: "X", href: "#" },
        ]}
        sideLinks={[
          { icon: "dribbble", label: "zines", href: "#" },
          { icon: "at", label: "12,11", href: "#" },
        ]}
        chat={{ label: "order", href: "mailto:orders@example.com" }}
        legal={[{ label: "© 2026 ink. riso co." }, { label: "Shipping", href: "#" }, { label: "Terms", href: "#" }]}
      />
    </div>
  )
}
