"use client"

import StickerSlapFooter from "@/components/ui/sticker-slap-footer"

// Scroll down: the panel grows out of the frame as the footer arrives, then
// the wordmark writes itself and the stickers slap on.
export default function DemoScroll() {
  return (
    <div className="w-full bg-[#f6efe2]">
      <section className="flex min-h-[110svh] flex-col items-center justify-center gap-4 px-6 text-center text-[#1d1a16]">
        <p className="text-sm font-semibold tracking-wide uppercase opacity-60">the end of a very good page</p>
        <h2 className="max-w-3xl text-5xl font-extrabold tracking-tight md:text-7xl">keep scrolling, the good bit is at the bottom</h2>
        <span className="mt-6 text-3xl motion-safe:animate-bounce" aria-hidden="true">
          ↓
        </span>
      </section>
      <StickerSlapFooter
        wordmark="juicy"
        paper="#f6efe2"
        panel="#1f7a4d"
        ink="#1d1a16"
        accent="#ffd23f"
        navLabel="cases"
        jobsLabel="we're hiring"
        jobs={[{ title: "freelance illustrator", href: "#" }]}
        officeLabel="studio"
        address={["Rua do Norte 48", "1200-286 Lisboa"]}
        email="ola@juicy.pt"
        chatLabel="text us on signal"
        note="*we answer faster than we should."
        socials={[
          { kind: "instagram", href: "#" },
          { kind: "dribbble", href: "#" },
          { kind: "youtube", href: "#" },
          { kind: "x", href: "#" },
        ]}
        stickers={[{ kind: "burst", text: "yay" }, "heart", { kind: "bubble", text: "oi!" }, "bolt", "daisy", "smiley"]}
        credits={[
          { role: "made by", name: "juicy studio, lisbon" },
          { role: "fuelled by", name: "pastéis de nata" },
        ]}
      />
    </div>
  )
}
