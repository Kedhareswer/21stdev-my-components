"use client"

import CubeRollButton from "@/components/ui/cube-roll-button"

export default function Demo() {
  return (
    <div className="flex min-h-[560px] w-full items-center justify-center bg-background px-4 py-16">
      <div
        className="relative w-full max-w-[640px] overflow-hidden rounded-[28px] px-6 py-14 text-center sm:px-12"
        style={{
          background: "radial-gradient(120% 90% at 50% 0%, #fbf7f1 0%, #efe6da 55%, #e4d8c8 100%)",
          boxShadow: "inset 0 1px 0 #fff, 0 1px 2px rgba(60,40,20,.08), 0 30px 60px -30px rgba(60,40,20,.35)",
        }}
      >
        <p className="text-[11px] font-medium tracking-[0.22em] text-[#9a7a5c]">STUDIO OPEN HOUSE · MARCH 14</p>
        <h2
          className="mx-auto mt-4 max-w-[440px] text-[34px] leading-[1.05] text-[#1c1712] sm:text-[44px]"
          style={{ fontFamily: '"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif', letterSpacing: "-0.02em" }}
        >
          Walk the kilns, meet the makers.
        </h2>
        <p className="mx-auto mt-4 max-w-[380px] text-[15px] leading-relaxed text-[#6f5b49]">
          Twelve places a session. Coffee, clay under the nails, and a cup you throw yourself.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-5">
          <CubeRollButton label="Book a visit" revealLabel="Pick a time" />
          <CubeRollButton tone="ink" label="See the work" revealLabel="Open gallery" />
        </div>
        <div className="mt-12">
          <CubeRollButton size="lg" tone="ink" label="Reserve" revealLabel="Let's go" />
        </div>
      </div>
    </div>
  )
}
