"use client"

import ElsewherePoster from "@/components/ui/elsewhere-poster"

// Every word, colour and place is a prop. This one is a personal travel log in
// English, on cream paper with green ink, with a palette of its own for the
// third stop.
export default function DemoCustom() {
  return (
    <div className="flex min-h-[100svh] w-full items-center justify-center bg-[#16201c] p-4 sm:p-8">
      <ElsewherePoster
        maxWidth="760px"
        script="Wander & Rest"
        marquee={["HERE", "OR", "THERE", "ALL", "SAME"]}
        tagline="GO FAR ENOUGH AND YOU MEET YOURSELF COMING BACK"
        pairs={[
          ["BE", "PRESENT"],
          ["YOU &", "ME"],
        ]}
        ring="WE FIND OUR HAPPINESS ELSEWHERE"
        corner={["THE MOST", "BEAUTIFUL THING", "IN THE WORLD"]}
        gateLabel="BE ELSEWHERE"
        credits={[
          ["LOG", "VOL. 03"],
          ["KEDHAR", "ESWER"],
          ["FIELD", "NOTES"],
        ]}
        arcTop="A NEW WORLD AT YOUR FINGERTIPS"
        arcBottom="WE WILL ALWAYS BE BETTER ELSEWHERE THAN WHERE WE THOUGHT WE WOULD SPEND OUR LIVES"
        notes={[
          ["ELSEWHERE", "WITH ME"],
          ["FINDING EACH OTHER", "HAPPINESS"],
        ]}
        footer="ALONE WITH YOU"
        colors={{ paper: "#efe8da", ink: "#1f2f29", mat: "#16201c", accent: "#b5562b" }}
        destinations={[
          { title: "Lofoten", scene: "night", seed: 5, code: "LOF-68N-13E", tagline: "THE SUN NEVER QUITE SETS UP HERE" },
          { title: "Patagonia", scene: "dusk", seed: 12, code: "PAT-50S-73W" },
          {
            title: "Dolomites",
            seed: 8,
            code: "DOL-46N-11E",
            tagline: "PALE MOUNTAINS, GREEN WATER",
            scene: {
              skyTop: "#9fb7b3",
              skyHorizon: "#eef0dd",
              peakLit: "#f1e3c4",
              peakShade: "#8e9a9a",
              water: "#7fb3a4",
              waterDeep: "#2f5a50",
              grass: "#6f8a45",
            },
          },
          { title: "Elsewhere", scene: "golden", seed: 3 },
        ]}
      />
    </div>
  )
}
