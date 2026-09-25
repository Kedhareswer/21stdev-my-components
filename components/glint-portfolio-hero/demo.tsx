"use client"

import GlintPortfolioHero from "@/components/ui/glint-portfolio-hero"

// Hover to catch their eye, click for the glint, drag the cat sticker around.
export default function Demo() {
  return (
    // w-full: 21st centres demos in a flex wrapper that would shrink this to 0px.
    <div className="w-full">
      <GlintPortfolioHero />
    </div>
  )
}
