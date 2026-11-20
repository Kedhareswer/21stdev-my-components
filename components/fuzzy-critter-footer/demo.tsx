"use client"

import FuzzyCritterFooter from "@/components/ui/fuzzy-critter-footer"

export default function FuzzyCritterFooterDemo() {
  return (
    <div className="w-full bg-background text-foreground">
      <section className="grid min-h-[80svh] place-content-center justify-items-center gap-2.5 text-[15px] text-muted-foreground">
        <p>Scroll down</p>
        <span aria-hidden="true" className="text-xl motion-safe:animate-bounce">↓</span>
      </section>
      <FuzzyCritterFooter />
    </div>
  )
}
