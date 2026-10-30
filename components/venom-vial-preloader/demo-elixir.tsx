"use client"

import VenomVialPreloader from "@/components/ui/venom-vial-preloader"

// Your own colours: a golden elixir under a ruby stopper, a finer pixel.
export default function DemoElixir() {
  return (
    <VenomVialPreloader
      loop
      total={3.4}
      unit="GB"
      doneLabel="The elixir is ready."
      pixel={0.85}
      palette={{
        void: "#0b0712",
        venom: "#ffb238",
        gem: "#ff3b6b",
        brass: "#c7ccd8",
        mark: "#ffcf3a",
        silk: "#fff4e0",
      }}
    />
  )
}
