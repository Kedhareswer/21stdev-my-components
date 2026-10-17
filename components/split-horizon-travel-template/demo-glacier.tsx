"use client"

import SplitHorizonTravelTemplate from "@/components/ui/split-horizon-travel-template"

// A cold-water expedition company on the glacier palette: its own copy,
// slides, index and steps. Every picture is still a drawn scene, so pass
// `image` on any slide, tour or step to use your own photographs.
export default function DemoGlacier() {
  return (
    <SplitHorizonTravelTemplate
      brand="Northbound"
      palette="glacier"
      hero={{
        title: "Go further north\nthan you planned",
        text: "Small expeditions to the edge of the map, led by guides who grew up there. Fjords, ice and long light, ten travellers at a time.",
        split: 0.44,
        interval: 6,
        slides: [
          {
            place: "Lofoten, Norway",
            coords: "67.93° N · 13.09° E",
            scene: "polar",
            gem: { kicker: "Aurora season", text: "Eight nights in a red rorbu on the water, with a photographer on call whenever the sky turns green.", tour: "lofoten" },
          },
          {
            place: "Isle of Skye, Scotland",
            coords: "57.27° N · 6.21° W",
            scene: "fjord",
            gem: { kicker: "Spring walks", text: "Seven days on the Trotternish ridge and a peat fire waiting at the end of each one.", tour: "skye" },
          },
          {
            place: "Faroe Islands",
            coords: "62.06° N · 7.06° W",
            scene: "cabin",
            gem: { kicker: "Hidden gem", text: "A turf-roofed cabin on a cliff above the Atlantic, and puffins for neighbours.", tour: "faroe" },
          },
        ],
      }}
      search={{ placeholder: "Where to?", suggestions: ["islands", "aurora", "under 1700", "6 days"] }}
      defaultSaved={["lofoten"]}
      about={{
        kicker: "Field notes / How we go",
        title: "Weather first, plans second",
        footnote: "Built around\nthe forecast",
        stats: [
          { value: "10", label: "travellers per expedition, at most" },
          { value: "62°", label: "the furthest south we start" },
          { value: "24h", label: "a guide on call, every day" },
        ],
        steps: [
          { title: "We read the season with you", text: "Light, ice and crowds change by the week up here. We pick your window before we pick a route.", tone: "stone" },
          { title: "", text: "", tone: "image", scene: "polar" },
          { title: "Guides from the place itself", text: "Fishermen, skippers and mountain guides who know when to turn back and where the soup is good.", tone: "ink" },
        ],
      }}
      booking={{ kicker: "Expeditions", title: "Hold a place on the next boat.", text: "We reply within a day with dates, kit list and a price. A place is held for a week, free." }}
    />
  )
}
