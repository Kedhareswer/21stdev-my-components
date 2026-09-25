"use client"

import GlintPortfolioHero from "@/components/ui/glint-portfolio-hero"

export default function DemoCustom() {
  return (
    <div className="w-full">
      <GlintPortfolioHero
        title="SHOWREEL"
        name="Kai Mori"
        edition="Vol. 03"
        skyFrom="#6a4cf0"
        skyTo="#ffe3d3"
        irisColor="#20b39a"
        hairColor="#14213d"
        accentColor="#ffb400"
        cycle={5.5}
      />
    </div>
  )
}
