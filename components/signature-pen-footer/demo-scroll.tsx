"use client"

import SignaturePenFooter from "@/components/ui/signature-pen-footer"

// Scroll down: the pen writes as the footer comes up, and un-writes if you scroll back.
export default function DemoScroll() {
  return (
    <div className="w-full bg-[#f3f3f2]">
      <section className="w-full min-h-[120svh] flex flex-col items-center justify-center gap-3 px-6 text-center text-[#1d1d1f]">
        <p className="text-xs uppercase tracking-[0.2em] text-[#6c6c70]">Case study · 04</p>
        <h1 className="max-w-2xl text-4xl font-normal tracking-tight">A signing flow people actually finish.</h1>
        <p className="max-w-md text-sm text-[#6c6c70]">Scroll to the end to sign off.</p>
      </section>
      <SignaturePenFooter
        trigger="scroll"
        word="Thank you"
        title="Thanks for reading all the way down"
        description="If something here was useful, I'd love to hear about it. I'm taking on two new projects this spring."
        actions={[
          { label: "Read the next one", href: "#", variant: "secondary" },
          { label: "Start a project", href: "#", variant: "primary" },
        ]}
        brand="Mira Okafor"
        links={[
          { label: "Work", href: "#" },
          { label: "About", href: "#" },
          { label: "Journal", href: "#" },
          { label: "Read.cv", href: "#" },
        ]}
        inkFrom="#a3a0f5"
        inkTo="#4338ca"
        accent="#4338ca"
        height="100svh"
      />
    </div>
  )
}
