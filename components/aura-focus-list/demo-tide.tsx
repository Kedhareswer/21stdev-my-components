"use client"

import AuraFocusList from "@/components/ui/aura-focus-list"

export default function DemoTide() {
  return (
    <AuraFocusList
      palette="tide"
      label="Courses this term"
      items={[
        { title: "Coastal ecology", meta: "Mon · Wed" },
        { title: "Field sketching", meta: "Tue" },
        { title: "Tides & weather", meta: "Thu" },
        { title: "Night swimming", meta: "Fri" },
      ]}
    />
  )
}
