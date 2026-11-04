"use client"

import DriftingInterestPicker from "@/components/ui/drifting-interest-picker"

const labels = [
  "Photography", "Film", "Jazz", "Hiking", "Ceramics", "Coffee", "Typography", "Surfing", "Cooking",
  "Gardening", "Climbing", "Synths", "Poetry", "Architecture", "Running", "Board games", "Astronomy", "Vinyl",
  "Cycling", "Natural wine", "Baking", "Sketching", "Yoga", "Travel", "Podcasts", "Fashion", "Product design",
  "Chess", "Sailing", "Skateboarding", "Anime", "Tea", "Robotics", "Theatre", "Swimming", "Birdwatching",
]

const interests = labels.map((label) => ({ id: label.toLowerCase().replace(/\s+/g, "-"), label }))

export default function Demo() {
  return (
    <div
      style={{
        minHeight: "100svh",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "72px 16px",
        background: "var(--color-background)",
      }}
    >
      <DriftingInterestPicker interests={interests} defaultValue={["photography", "coffee", "typography"]} />
    </div>
  )
}
