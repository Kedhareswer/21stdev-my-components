"use client"

import HoloStickerLogo from "@/components/ui/holo-sticker-logo"

// Your own mark, on paper: a filled logo path cross-dissolves with the stroke
// presets, a violet foil, and the corner peeling from the top left instead.
const BOLT = { name: "Bolt", d: "M57 12 L27 55 H47 L41 88 L73 42 H53 Z" }

export default function DemoStudio() {
  return (
    <HoloStickerLogo
      tone="studio"
      tint="#8b6bff"
      ink="#1b1030"
      peel={0.38}
      peelAngle={132}
      glyphs={["smile", BOLT, "spark", "play"]}
      label="Studio sticker"
      cycle={4200}
    />
  )
}
