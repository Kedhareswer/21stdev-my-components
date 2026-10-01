"use client"

import FrostedFolderWindow from "@/components/ui/frosted-folder-window"

// Everything is a prop: someone else's trips, renamed tabs, a cooler glass and
// warmer ink, a different painted garden, and a place lit at dusk.
export default function DemoCustom() {
  return (
    <FrostedFolderWindow
      seed={42}
      tint="#d6e4d8"
      ink="#fff4dc"
      defaultIndex={1}
      tabLabels={{ places: "Trips", journal: "Diary", archive: "Boxes" }}
      notePlaceholder="What do you want to remember?"
      places={[
        {
          title: "Rain Gardens",
          location: "Kyoto, Japan",
          date: "Jun 18, 2025",
          tagline: "Moss after rain.\nNo one else on the path.",
          sizeMB: 6.8,
          light: "morning",
          journal: ["The moss garden smelled like a cellar and a forest at once. We whispered without deciding to."],
        },
        {
          title: "Long Evenings",
          location: "Lisbon, Portugal",
          date: "Aug 2, 2025",
          tagline: "Tiles still warm.\nTrams going home empty.",
          sizeMB: 5.1,
          light: "dusk",
          journal: [
            "Up the hill to the miradouro as the lamps came on, one street at a time.",
            "Sardines, bad wine, a guitarist who only knew three songs and played them all twice.",
          ],
        },
        {
          title: "Salt\nHours",
          location: "Hydra, Greece",
          date: "Sep 9, 2024",
          tagline: "No cars. Just donkeys\nand the sound of the sea.",
          sizeMB: 3.6,
          light: "golden",
        },
        {
          title: "Paper Lanterns",
          location: "Hội An, Vietnam",
          date: "Feb 24, 2024",
          tagline: "Full moon on the river.\nA wish for a dollar.",
          sizeMB: 2.4,
          light: "dusk",
        },
      ]}
    />
  )
}
