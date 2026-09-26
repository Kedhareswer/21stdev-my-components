"use client"

import ClockMascotChat from "@/components/ui/clock-mascot-chat"

// The blush-pink poster look, with her renamed and a few lines rewritten.
export default function DemoPeach() {
  return (
    <ClockMascotChat
      theme="peach"
      name="Penny Pendulum"
      org="Office of Good Timing"
      motto="Never early. Never late."
      petName="darlin'"
      suggestions={["Hi Penny!", "What's the date?", "I'm so behind on my deadline", "Sing me something"]}
      lines={{
        greeting: ["Well, look who's right on time! I'm {name}. What can the {org} do for you today, {user}?"],
        joke: ["What did the pendulum say to the clock? Quit swingin' my way! Oh, I'm hilarious."],
      }}
    />
  )
}
