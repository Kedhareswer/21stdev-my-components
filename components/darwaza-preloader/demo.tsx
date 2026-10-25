"use client"

import DarwazaPreloader from "@/components/ui/darwaza-preloader"

const WORK = [
  { n: "01", t: "Haveli Hotels", d: "Identity and booking site for a family of heritage stays.", c: "#e0226d" },
  { n: "02", t: "Neel Textiles", d: "A catalogue that dyes itself as you scroll.", c: "#3d5a99" },
  { n: "03", t: "Chai & Co.", d: "Packaging, menus and a very small website.", c: "#c98b2b" },
]

// Load, then scroll: the doors open onto the page behind them.
export default function Demo() {
  return (
    <DarwazaPreloader>
      <main className="min-h-svh bg-[#fbf3ee] text-[#2a1418]">
        <section className="mx-auto flex min-h-svh max-w-5xl flex-col justify-center px-6 py-24">
          <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-[#2a1418]/60">Aanya Mehra · Designer, Jaipur</p>
          <h1 className="mt-6 font-serif text-5xl leading-[1.02] tracking-tight sm:text-7xl">
            Work made with
            <br />
            <em className="text-[#e0226d]">warmth</em> and a steady hand.
          </h1>
          <p className="mt-8 max-w-lg text-lg leading-relaxed text-[#2a1418]/70">
            Brand systems, editorial sites and objects for studios who would rather be remembered than noticed.
          </p>
        </section>
        <section className="mx-auto max-w-5xl px-6 pb-32">
          <div className="grid gap-5 sm:grid-cols-3">
            {WORK.map((w) => (
              <article key={w.n} className="rounded-3xl border border-[#2a1418]/10 bg-white/70 p-7">
                <div className="h-28 rounded-2xl" style={{ background: w.c }} />
                <p className="mt-6 font-mono text-xs text-[#2a1418]/50">{w.n}</p>
                <h2 className="mt-1 text-xl font-medium">{w.t}</h2>
                <p className="mt-2 text-sm leading-relaxed text-[#2a1418]/65">{w.d}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </DarwazaPreloader>
  )
}
