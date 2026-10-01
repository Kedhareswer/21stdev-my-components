"use client"

import CyanotypeCollageHero from "@/components/ui/cyanotype-collage-hero"

// The same collage as a designer's portfolio cover, in English and printed in
// vermilion: your own files, copy, palette and link — everything is props.
export default function Demo() {
  return (
    <CyanotypeCollageHero
      lang="en"
      palette="vermilion"
      barcode="KM 2026"
      action={{ label: "See the work", href: "#work" }}
      hint="Drag · tap · ← → to page"
      chapters={[
        {
          number: "01",
          kicker: "Kenji Mori,\nindependent designer.\nPrint, type & motion —\nportfolio *2026*.",
          title: "Made in\n*red* summers",
          body: "Posters, zines and identities\nfor festivals, record labels\nand people who still love paper.\nTap the scraps, then say hello.",
          caption: "Studio, Osaka\nAug. 2026",
          sky: "dusk",
          seed: 3,
        },
        {
          number: "02",
          kicker: "Selected work:\nOtsuki Summer Festival,\nidentity & posters,\n*2025*.",
          title: "Ten nights\nof *fireworks*",
          body: "Seventy posters in two inks,\none for every street stall,\nprinted on a riso in a garage\nthree nights before opening.",
          caption: "Otsuki\nJuly 2025",
          sky: "night",
          seed: 9,
        },
        {
          number: "03",
          kicker: "Selected work:\nBlue Hour Records,\nsleeves & type,\n*2024*.",
          title: "Albums for\n*slow* mornings",
          body: "Twelve sleeves, one typeface\nand a sky photographed\nfrom the same rooftop\nevery day for a year.",
          caption: "Rooftop\n365 skies",
          sky: "day",
          seed: 21,
        },
      ]}
    />
  )
}
