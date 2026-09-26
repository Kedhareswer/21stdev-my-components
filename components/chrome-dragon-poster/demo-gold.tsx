"use client"

import ChromeDragonPoster from "@/components/ui/chrome-dragon-poster"

export default function DemoGold() {
  // Same rig, recast: a gold dragon on a dusk sky with a teal star.
  return (
    <div className="w-full">
      <ChromeDragonPoster
        metal="gold"
        skyTop="#1a0b2e"
        skyBottom="#e0795b"
        star="#10c9b4"
        starCore="#fff1b8"
        accent="#10c9b4"
        title="Golden Hour"
        mark="金龍"
        caption="Click anywhere — it roars"
      />
    </div>
  )
}
