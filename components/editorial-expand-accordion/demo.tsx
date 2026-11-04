"use client"

import EditorialExpandAccordion, { type EditorialItem } from "@/components/ui/editorial-expand-accordion"

// Free Unsplash photos. Swap in your own.
const photo = (id: string) => "https://images.unsplash.com/photo-" + id + "?w=960&h=720&fit=crop&q=75"

const items: EditorialItem[] = [
  {
    title: "Brand & identity",
    description: "Names, marks and type systems that hold up from a favicon to a forty-foot billboard. We start with what you stand for and end with a toolkit your team can actually use.",
    image: photo("1561070791-2526d30994b5"),
    imageAlt: "Colour swatches and a tablet sketch on a desk",
    tags: ["Naming", "Logo & wordmark", "Type & colour", "Guidelines"],
    duration: "6–10 weeks",
    href: "#",
  },
  {
    title: "Product engineering",
    description: "Fast, accessible web apps built on boring, durable tech. Design and code ship together, so what you approved is what goes live.",
    image: photo("1498050108023-c5249f4df085"),
    imageAlt: "A laptop showing code on a bright desk",
    tags: ["React & Next.js", "Design systems", "Performance", "QA"],
    duration: "From 8 weeks",
    href: "#",
  },
  {
    title: "Strategy & research",
    description: "Interviews, audits and workshops that turn hunches into a plan. You leave with a ranked roadmap, not a slide deck that gathers dust.",
    image: photo("1552664730-d307ca884978"),
    imageAlt: "A team mapping ideas on sticky notes",
    tags: ["User interviews", "Workshops", "Roadmaps"],
    duration: "3–5 weeks",
    href: "#",
  },
  {
    title: "Growth & analytics",
    description: "Experiments, funnels and dashboards wired to the numbers that matter. We find the leak, fix it, and prove it moved.",
    image: photo("1460925895917-afdab827c52f"),
    imageAlt: "A laptop showing an analytics dashboard",
    tags: ["A/B testing", "Lifecycle email", "Dashboards"],
    duration: "Ongoing",
    href: "#",
  },
]

export default function Demo() {
  return (
    <div style={{ minHeight: "100svh", padding: "72px 20px 96px", background: "var(--color-background)" }}>
      <EditorialExpandAccordion
        items={items}
        intro="A small studio for teams who care how things look and how they work. Pick a lane, or mix all four."
      />
    </div>
  )
}
