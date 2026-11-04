"use client"

import HeartBurstButton from "@/components/ui/heart-burst-button"

const sans = '"Geist", "Inter", "SF Pro Text", "Segoe UI Variable Text", ui-sans-serif, system-ui, sans-serif'
const serif = '"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif'

function Post({ dark }: { dark?: boolean }) {
  const ink = dark ? "#f6eef1" : "#2a1d22"
  const mute = dark ? "#9c8a91" : "#9a868d"
  return (
    <article
      className="w-full max-w-[440px] rounded-[28px] p-7"
      style={{
        fontFamily: sans,
        color: ink,
        background: dark ? "linear-gradient(180deg,#1f191c,#151113)" : "linear-gradient(180deg,#ffffff,#fbf6f7)",
        boxShadow: dark
          ? "inset 0 1px 0 rgba(255,255,255,.06), 0 30px 60px -30px rgba(0,0,0,.8)"
          : "inset 0 0 0 1px rgba(80,30,45,.06), 0 1px 2px rgba(80,30,45,.06), 0 30px 60px -30px rgba(80,30,45,.35)",
      }}
    >
      <header className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-full text-[13px] font-semibold text-white" style={{ background: dark ? "linear-gradient(135deg,#7a5cff,#ff5fa2)" : "linear-gradient(135deg,#ff9a5a,#ff2e63)" }}>
          {dark ? "NK" : "AM"}
        </span>
        <div className="leading-tight">
          <p className="text-[14px] font-semibold">{dark ? "Noor Kaplan" : "Ada Marlow"}</p>
          <p className="text-[12px]" style={{ color: mute }}>{dark ? "@noor.builds · 2h" : "@adamarlow · 14m"}</p>
        </div>
      </header>
      <p className="mt-5 text-[24px] leading-[1.28]" style={{ fontFamily: serif, letterSpacing: "-0.01em" }}>
        {dark
          ? "Shipped the offline mode at 2 a.m. The sync conflict screen is the part I'm proudest of."
          : "Took the 6:04 ferry just to watch the fog peel off the harbour. Worth every yawn."}
      </p>
      <footer className="mt-5 flex items-center gap-3">
        <HeartBurstButton theme={dark ? "dark" : "light"} count={dark ? 1289 : 24} defaultLiked={false} />
        <span className="text-[13px]" style={{ color: mute }}>{dark ? "86 replies" : "3 replies"}</span>
      </footer>
    </article>
  )
}

export default function Demo() {
  return (
    <div className="flex min-h-[max(560px,100svh)] w-full flex-wrap items-center justify-center gap-6 bg-background px-4 py-16">
      <Post />
      <Post dark />
    </div>
  )
}
