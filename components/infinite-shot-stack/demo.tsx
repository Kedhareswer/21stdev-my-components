"use client"

import InfiniteShotStack from "@/components/ui/infinite-shot-stack"

// The full-screen version: the wheel, a drag, the arrow keys or the buttons cycle the deck forever.
export default function Demo() {
  return <InfiniteShotStack mode="wheel" autoPlay={3200} />
}
