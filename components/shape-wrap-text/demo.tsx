"use client"

import ShapeWrapText from "@/components/ui/shape-wrap-text"

export default function Demo() {
  return (
    <div className="min-h-screen w-full bg-background px-6 py-16 text-[17px] leading-[1.75] text-foreground">
      <div className="mx-auto w-full max-w-2xl">
        <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Typesetting
        </p>
        <h2 className="mb-8 text-3xl font-semibold tracking-tight">Where the line ends</h2>
        <ShapeWrapText>
          <span className="font-mono text-xs uppercase tracking-widest">drag</span>
        </ShapeWrapText>
      </div>
    </div>
  )
}
