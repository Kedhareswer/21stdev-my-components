"use client"

import CutoutSentence from "@/components/ui/cutout-sentence"

// Same picture, a different sentence, warm paper colours, and no scroll:
// it plays once when it comes into view, then keeps a replay button.
// Each piece is just an id, the word it shows and where it sits in the image.
export default function DemoAutoplay() {
  return (
    <div className="w-full">
      <CutoutSentence
        mode="auto"
        eyebrow="Postcard from the harbour"
        sentence="Morning light on the water {deep}, a quiet pier {pier} and six bright boats {boats} at rest, with one orange buoy {buoy} keeping watch."
        pieces={[
          { id: "deep", word: "water", region: [0.725, 0.4125, 0.1167, 0.1188] },
          { id: "pier", word: "pier", region: [0.025, 0.45, 0.1167, 0.125], aspect: 1 },
          { id: "boats", word: "boats", region: [0.1708, 0.5563, 0.1125, 0.1375], aspect: 1.6 },
          { id: "buoy", word: "buoy", region: [0.6667, 0.565, 0.0792, 0.09] },
        ]}
        background="#f1ebe1"
        ink="#2b2420"
        muted="#8a7d70"
        fontFamily='"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif'
        pieceHeight={2.3}
        fontScale={1.1}
      />
    </div>
  )
}
