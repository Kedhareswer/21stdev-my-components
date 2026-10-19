"use client"

import StringTieFooter from "@/components/ui/string-tie-footer"

// The footer at the end of a page: scroll down and the cord winds itself shut.
export default function DemoScroll() {
  return (
    <div className="w-full bg-background text-foreground">
      <section className="mx-auto flex min-h-[110svh] max-w-3xl flex-col justify-center gap-6 px-4 py-24">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Case study · 04 / 04</p>
        <h1 className="font-serif text-5xl leading-[1.05] tracking-tight sm:text-7xl">
          That&rsquo;s the whole story — the brief, the mess in the middle, and the thing we shipped.
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          Keep scrolling. The envelope at the bottom seals itself as it comes into view; click either button to open it
          again.
        </p>
        <div className="mt-6 h-px w-full bg-border" />
      </section>
      <StringTieFooter
        meta={["Portfolio", "2021–2026", "Selected work"]}
        tapes={["Looking Forward to", "Connect with You!"]}
        note={{
          kicker: "P.S.",
          text: "Taking on two new projects this spring. If yours is one of them, write — I read everything.",
          cta: "Start a project",
        }}
        height="100svh"
      />
    </div>
  )
}
