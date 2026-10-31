"use client"

import CutoutSentence, { FLOCK_PIECES } from "@/components/ui/cutout-sentence"

// Same photo, a different sentence and a night palette, and no scroll: it
// plays once when it comes into view, then keeps a replay button. Pieces are
// just an id, the word they show and where they sit in the photo, so a new
// sentence can reuse the same cuts.
const cut = (id: string, word: string) => {
  const p = FLOCK_PIECES.find((q) => q.id === id)
  return { id, word, region: p ? p.region : ([0, 0, 0.1, 0.1] as [number, number, number, number]) }
}

export default function DemoAutoplay() {
  return (
    <div className="w-full">
      <CutoutSentence
        mode="auto"
        sentence="Morning flight: a {wings}scarlet wing, a {paint}yellow flash, a {tranq}green streak, and {vast}nothing but blue."
        pieces={[cut("wings", "scarlet wing"), cut("paint", "yellow flash"), cut("tranq", "green streak"), cut("vast", "blue")]}
        background="#0e1726"
        ink="#eef2f8"
        muted="#8c9ab0"
        fontFamily='"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif'
        fontScale={1.08}
      />
    </div>
  )
}
