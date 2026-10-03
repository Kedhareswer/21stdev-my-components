"use client"

import TiltCascadeCarousel, { type TiltCascadeItem } from "@/components/ui/tilt-cascade-carousel"

// Your own journal: new titles and captions over the built-in scenes, a
// steeper slant, looping autoplay and an evening background.
const trip: TiltCascadeItem[] = [
  { title: "up the mountain", caption: "day one", art: "cable-car" },
  { title: "the guesthouse", caption: "room 2, top floor", art: "house" },
  { title: "first bloom", caption: "we were a week early", art: "blossoms" },
  { title: "vending machine run", caption: "melon soda, again", art: "bottles" },
  { title: "the long way back", caption: "4 km of shade", art: "avenue" },
  { title: "coast line", caption: "window seat, obviously", art: "train-window" },
  { title: "the cedar path", caption: "too quiet to talk", art: "sunbeams" },
  { title: "harbour", caption: "they wanted my lunch", art: "seagulls" },
]

export default function DemoCustom() {
  return (
    <div className="w-full">
      <TiltCascadeCarousel
        items={trip}
        defaultIndex={0}
        loop
        autoplay={2600}
        angle={22}
        drop={0.62}
        inactiveScale={0.55}
        radius={28}
        bounce={0.3}
        background="radial-gradient(120% 90% at 50% 10%, #2b3a55 0%, #141a26 70%)"
        color="#f3eee6"
        ariaLabel="Trip journal"
      />
    </div>
  )
}
