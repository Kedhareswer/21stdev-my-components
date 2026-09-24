"use client"

import BubbleGraffitiLanding from "@/components/ui/bubble-graffiti-landing"

/** No intro, a night palette, and your own words. */
export default function NightDemo() {
  return (
    <BubbleGraffitiLanding
      intro={false}
      word="pop!"
      brand="nocturne"
      tagline="drawn in code, lit at night"
      servicesTop={["Motion", "Type Design"]}
      servicesBottom={["Brand Systems", "Art Direction"]}
      from="2019"
      to="2026"
      studio="/ after hours studio"
      palette={{ paper: "#121216", ink: "#f3efe3", balloon: "#ff6fae", shine: "#fff7fb", grid: "rgba(243,239,227,0.07)" }}
    />
  )
}
