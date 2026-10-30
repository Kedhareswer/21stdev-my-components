"use client"

import SaffronGazePreloader from "@/components/ui/saffron-gaze-preloader"

// A second palette: a moonlit teal painting with silver clouds and green eyes,
// an English subtitle, and a Latin credit.
export default function DemoMoonlit() {
  return (
    <SaffronGazePreloader
      loop
      title="NOCTURNE"
      subtitle="a night studio"
      kicker="Lumen & Co"
      kickerSub="present"
      loadingSub="just a moment"
      enterSub="step inside"
      credit={{ eyebrow: "Portfolio · Edition two", name: "LUMEN", note: "Film & photography" }}
      monogram="L"
      palette={{
        stage: "#05080c",
        skin: "#2f6a7c",
        skinLight: "#6fb3bf",
        skinDeep: "#0f2a38",
        ink: "#06111a",
        cream: "#eef3ea",
        iris: "#7fb07a",
        irisDeep: "#1f4a33",
        bindi: "#e2b64a",
        cloud: "#b9c7cf",
        cloudLight: "#f2f6f6",
        cloudDeep: "#5b7585",
        title: "#dce9e8",
        text: "#d8e3e4",
      }}
    />
  )
}
