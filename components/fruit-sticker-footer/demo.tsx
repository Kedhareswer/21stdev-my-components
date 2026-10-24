"use client"

import FruitStickerFooter from "@/components/ui/fruit-sticker-footer"

// The sign-off as it ships: four fruit stickers around "Thank You, bye!".
// Click the script word, tap or drag the stickers, copy the email.
export default function Demo() {
  return (
    <div className="w-full">
      <FruitStickerFooter
        headline="Thank You,"
        farewells={["bye!", "ciao!", "later!", "adios!", "cheers!"]}
        lines={["Don’t forget to contact me.", "Hope to see you later!"]}
        email="hello@noravale.studio"
        links={[
          { label: "Instagram", href: "#" },
          { label: "Dribbble", href: "#" },
          { label: "LinkedIn", href: "#" },
          { label: "Read.cv", href: "#" },
        ]}
        name="Nora Vale"
        year={2026}
      />
    </div>
  )
}
