"use client"

import FruitStickerFooter from "@/components/ui/fruit-sticker-footer"

// Same component, re-worded and re-stickered: a juice bar's closing panel in
// grape and lime, with its own farewells and a different fruit bowl.
export default function DemoRemix() {
  return (
    <div className="w-full">
      <FruitStickerFooter
        headline="Stay fresh,"
        farewells={["see ya!", "cheers!", "toodles!"]}
        lines={["Cold-pressed daily on Fulton St.", "Open 7am – 7pm, every day."]}
        email="squeeze@pulpandpeel.co"
        links={[
          { label: "Menu", href: "#" },
          { label: "Order ahead", href: "#" },
          { label: "Instagram", href: "#" },
        ]}
        name="Pulp & Peel"
        accent="#7b3fe4"
        background="#eef3e2"
        ink="#1d2416"
        muted="#5d6852"
        stickers={[
          { fruit: "watermelon", x: 3, y: 70, size: 0.9, rotate: -10 },
          { fruit: "lemon", x: 14, y: 102, size: 0.66, rotate: 8, shape: "oval" },
          { fruit: "cherry", x: 56, y: -24, size: 0.7, rotate: 8, behind: true },
          { fruit: "pear", x: 98, y: 74, size: 0.64, rotate: -6 },
        ]}
      />
    </div>
  )
}
