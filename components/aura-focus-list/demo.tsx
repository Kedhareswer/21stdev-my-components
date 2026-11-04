"use client"

import AuraFocusList from "@/components/ui/aura-focus-list"

export default function Demo() {
  return (
    <AuraFocusList
      label="What we do"
      items={[
        { title: "Brand identity", meta: "38 projects", href: "#" },
        { title: "Art direction", meta: "24 projects", href: "#" },
        { title: "Interaction design", meta: "41 projects", href: "#" },
        { title: "Creative coding", meta: "17 projects", href: "#" },
        { title: "Motion & film", meta: "29 projects", href: "#" },
      ]}
    />
  )
}
