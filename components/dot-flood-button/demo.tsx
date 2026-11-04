"use client"

import DotFloodButton from "@/components/ui/dot-flood-button"

const serif = '"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif'
const sans = "'Geist','Inter','SF Pro Text','Segoe UI Variable Text',ui-sans-serif,system-ui,sans-serif"

export default function Demo() {
  return (
    <div className="flex min-h-[max(620px,100svh)] w-full items-center justify-center bg-background px-4 py-16">
      <div
        className="relative w-full max-w-[720px] overflow-hidden rounded-[28px] px-7 py-12 sm:px-14 sm:py-16"
        style={{
          fontFamily: sans,
          color: "#141210",
          background: "linear-gradient(180deg,#f7f3ec,#efe8dc)",
          boxShadow: "inset 0 1px 0 #fff, inset 0 0 0 1px rgba(20,18,16,.06), 0 40px 80px -40px rgba(60,40,20,.4)",
        }}
      >
        <div className="flex items-center justify-between text-[12px] tracking-[0.16em] text-[#8a7f70]">
          <span>HALVARD & CO.</span>
          <span className="hidden sm:inline">INDEPENDENT DESIGN STUDIO</span>
        </div>
        <h2 className="mt-12 max-w-[520px] text-[44px] leading-[0.98] sm:text-[64px]" style={{ fontFamily: serif, letterSpacing: "-0.03em" }}>
          Quiet brands, <em className="text-[#ff5a36]">loud</em> results.
        </h2>
        <p className="mt-6 max-w-[380px] text-[15px] leading-relaxed text-[#6d6356]">
          Identity, packaging and sites for makers who'd rather be making. Booking spring 2027.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <DotFloodButton size="lg">Start a project</DotFloodButton>
          <DotFloodButton tone="ink" accent="#ffb347">See our work</DotFloodButton>
        </div>
      </div>
    </div>
  )
}
