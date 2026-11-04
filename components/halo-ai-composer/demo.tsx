"use client"

import { useRef, useState } from "react"
import HaloAiComposer, { type ComposerMessage } from "@/components/ui/halo-ai-composer"

type Turn = { who: "you" | "ai"; text: string }

const REPLY =
  "Here's a first pass. Lead with the one thing beta users get that nobody else has, keep it under 120 words, and end on a single button. Want me to write three subject lines to A/B test?"

export default function Demo() {
  const [turns, setTurns] = useState([] as Turn[])
  const stop = useRef(false)

  // Streams a canned reply word by word; the composer shows its stop button until this settles.
  const answer = (m: ComposerMessage) =>
    new Promise<void>((resolve) => {
      stop.current = false
      setTurns((t) => [...t, { who: "you", text: m.text || m.attachments.map((a) => a.name).join(", ") }, { who: "ai", text: "" }])
      const words = REPLY.split(" ")
      let i = 0
      const tick = setInterval(() => {
        i++
        setTurns((t) => [...t.slice(0, -1), { who: "ai", text: words.slice(0, i).join(" ") }])
        if (i >= words.length || stop.current) {
          clearInterval(tick)
          resolve()
        }
      }, 70)
    })

  return (
    <div className="flex min-h-[720px] w-full flex-col items-center justify-end gap-6 bg-background px-4 py-12">
      <div className="flex w-full max-w-[680px] flex-col gap-3">
        {turns.map((t, i) => (
          <div
            key={i}
            className={
              t.who === "you"
                ? "ml-auto max-w-[80%] rounded-2xl rounded-br-md bg-foreground px-4 py-2.5 text-sm text-background"
                : "mr-auto max-w-[85%] text-[15px] leading-relaxed text-foreground"
            }
          >
            {t.text || "…"}
          </div>
        ))}
      </div>
      <HaloAiComposer onSubmit={answer} onStop={() => (stop.current = true)} />
    </div>
  )
}
