"use client"

import * as React from "react"
import OldMastersPreloader from "@/components/ui/old-masters-preloader"

// Driven by real progress: a stand-in asset queue that surges and stalls.
const STEPS = [5, 3, 12, 2, 0, 0, 9, 14, 4, 0, 6, 11, 5, 0, 0, 8, 10, 11]

// Nayani Teixeira on Unsplash: the Apollo Belvedere against black, graded here as a two-ink print.
const IMAGE = "https://images.unsplash.com/photo-1574359587026-daf1bfd26baa?q=80&w=2000&auto=format&fit=crop"

export default function DemoCarmine() {
  const [loaded, setLoaded] = React.useState(0)

  React.useEffect(() => {
    let i = 0
    let v = 0
    const t = setInterval(() => {
      v = Math.min(100, v + (STEPS[i++ % STEPS.length] ?? 5))
      setLoaded(v)
      if (v >= 100) clearInterval(t)
    }, 230)
    return () => clearInterval(t)
  }, [])

  return (
    <OldMastersPreloader
      tone="carmine"
      face="condensed"
      progress={loaded}
      image={IMAGE}
      imageAlt="The Apollo Belvedere, a marble statue with a cloak over one arm"
      focal={[0.5, 0.25]}
      exposure={1.15}
      threshold={0.42}
      softness={0.16}
      wordmark="Arcadia"
      tagline="Your craft. Your name. Your rules."
      eyebrow="Studio · Est. MMXIX"
      brand="A."
      labels={["How it works", "Reviews"]}
      nav={[{ label: "Work" }, { label: "Process" }, { label: "About" }, { label: "Contact" }]}
      asides={[
        { title: "Studio", text: "Brand and motion work for founders who want a name that is said in one breath and remembered after it." },
        { title: "Reviews", text: "Twenty-one launches, eleven of them still unchanged two years on. The red is on purpose." },
      ]}
      annotations={[
        { x: 34, y: 52, label: "0.6180" },
        { x: 63, y: 36, label: "1.4142" },
      ]}
      plate="Pl. II"
      cta={{ label: "Sign up" }}
    />
  )
}
