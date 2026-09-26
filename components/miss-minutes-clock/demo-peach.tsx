"use client"

import MissMinutesClock from "@/components/ui/miss-minutes-clock"

// The blush-pink poster: warm glow, orange boots, no hologram scanlines.
export default function DemoPeach() {
  return (
    <MissMinutesClock
      theme="peach"
      petName="darlin'"
      lines={{ greet: ["Well hey there, {user}! Right on time, as always."] }}
    />
  )
}
