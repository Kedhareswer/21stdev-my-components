"use client"

import AuroraRingButton from "@/components/ui/aurora-ring-button"

const sans = "'Geist','Inter','SF Pro Display','Segoe UI Variable Display',ui-sans-serif,system-ui,sans-serif"

export default function Demo() {
  return (
    <div className="flex min-h-[640px] w-full items-center justify-center bg-background px-4 py-16">
      <div className="grid w-full max-w-[860px] gap-5 md:grid-cols-[1.25fr_1fr]" style={{ fontFamily: sans }}>
        <section
          className="relative flex flex-col items-start overflow-hidden rounded-[30px] p-8 sm:p-10"
          style={{
            color: "#f4f2fb",
            background: "radial-gradient(90% 70% at 85% 0%, rgba(124,92,255,.32), transparent 60%), radial-gradient(70% 60% at 0% 100%, rgba(46,230,197,.18), transparent 60%), linear-gradient(180deg,#121218,#09090c)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,.07), 0 40px 80px -40px rgba(0,0,0,.8)",
          }}
        >
          <span className="rounded-full px-3 py-1 text-[11px] font-medium tracking-[0.18em] text-[#c9c2ff]" style={{ background: "rgba(124,92,255,.14)", boxShadow: "inset 0 0 0 1px rgba(124,92,255,.3)" }}>
            STUDIO PRO
          </span>
          <h2 className="mt-6 max-w-[360px] text-[36px] font-semibold leading-[1.02] tracking-[-0.035em] sm:text-[44px]">
            Render in colour you can feel.
          </h2>
          <p className="mt-4 max-w-[330px] text-[15px] leading-relaxed text-[#a19db2]">
            Unlimited 8K exports, HDR grading and the full LUT library. Cancel any time.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-6">
            <AuroraRingButton size="lg">Get Pro</AuroraRingButton>
            <span className="text-[14px] text-[#8c88a0]">
              <b className="text-[18px] font-semibold text-white">$12</b> / month
            </span>
          </div>
        </section>
        <section
          className="flex flex-col items-center justify-center gap-6 rounded-[30px] p-10 text-center"
          style={{
            color: "#16161c",
            background: "radial-gradient(100% 80% at 50% 0%, #ffffff, #f2f1f6 60%, #e8e6ef)",
            boxShadow: "inset 0 1px 0 #fff, inset 0 0 0 1px rgba(20,20,40,.05), 0 30px 60px -30px rgba(20,20,40,.3)",
          }}
        >
          <p className="text-[13px] font-medium tracking-[0.14em] text-[#8a879a]">ON A LIGHT PAGE</p>
          <AuroraRingButton colors={["#ff7a59", "#ff3d81", "#8a5cff", "#2ec5ff"]}>Start free trial</AuroraRingButton>
          <p className="max-w-[220px] text-[13px] leading-relaxed text-[#8a879a]">Hover for the spotlight and sparkles; any four colours.</p>
        </section>
      </div>
    </div>
  )
}
