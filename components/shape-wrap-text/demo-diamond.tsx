"use client"

import ShapeWrapText from "@/components/ui/shape-wrap-text"

/** A ragged-right diamond, pinned off-centre and not draggable — the shape as
 *  a fixed piece of art direction rather than a toy. */
export default function DiamondDemo() {
  return (
    <div className="min-h-screen w-full bg-background px-6 py-16 text-[15px] leading-[1.9] text-foreground">
      <div className="mx-auto w-full max-w-xl">
      <ShapeWrapText
        shape="diamond"
        radius={96}
        origin={{ x: 0.34, y: 0.5 }}
        gutter={22}
        justify={false}
        draggable={false}
        text="A diamond takes the column differently than a circle does: it gives back width linearly, so the rag opens and closes in straight diagonals instead of curving. Same paragraph, same measurements, one different answer to the question of how wide the obstacle is on this particular line."
        />
      </div>
    </div>
  )
}
