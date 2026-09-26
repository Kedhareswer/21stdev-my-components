"use client"

import ClockMascotChat, { type AskResult, type ChatMessage } from "@/components/ui/clock-mascot-chat"

// Black-and-white, wired to your own model through `onAsk`. This stand-in
// just waits a beat and answers; swap the body for a fetch to your API route
// and return { text, mood } — or only the text, and her face is read off it.
async function ask(message: string, history: ChatMessage[]): Promise<AskResult> {
  await new Promise((r) => setTimeout(r, 1100))
  const turns = history.filter((m) => m.role === "user").length + 1
  if (/\?$/.test(message.trim())) {
    return { text: "Hmm, that's a question for the model you plug in here. I'm only the face.", mood: "think" }
  }
  return { text: "Filed! That's message number " + turns + " in your permanent record.", mood: "explain" }
}

export default function DemoNoir() {
  return <ClockMascotChat theme="noir" name="Mono" org="Archive of Hours" motto="Every second. On file." onAsk={ask} />
}
