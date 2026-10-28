"use client"

import PromptComposer from "@/components/ui/prompt-composer"

export default function Demo() {
  return (
    <div
      style={{
        minHeight: "100svh",
        display: "grid",
        placeItems: "center",
        padding: "48px 20px",
        background:
          "radial-gradient(40% 35% at 30% 35%, rgba(95,178,242,.28), transparent 70%), radial-gradient(35% 30% at 72% 65%, rgba(196,140,255,.22), transparent 70%), #08080a",
      }}
    >
      <PromptComposer onSubmit={(s) => console.log("build", s)} />
    </div>
  )
}
