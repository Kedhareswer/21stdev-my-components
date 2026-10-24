"use client"

import MarginaliaPortfolioTemplate from "@/components/ui/marginalia-portfolio-template"

const U = "https://images.unsplash.com/photo-"

// Everything is a prop: another person, a terracotta pen on warm paper with a
// deep teal night, a different cover word, three projects and other doodles.
export default function DemoTerracotta() {
  return (
    <MarginaliaPortfolioTemplate
      name="Kenji Ward"
      role="Product Designer"
      year="2027"
      location="Lisbon"
      title="Folio"
      docLabel="Selected Work"
      portrait={U + "1534528741775-53994a69daeb"}
      traits={["curious", "systems thinker", "calm", "kind", "precise", "playful"]}
      greeting="Olá."
      bio="I design calm software for busy people. Four years at a fintech taught me that *trust is a design material*, and that the best interface is often [the one you remove]. Outside work I run, sketch strangers on trams and bake terrible bread."
      educationIntro="Self-taught, then formally taught — in that order."
      education={[
        { title: "M.A. Interaction Design", place: "Umeå Institute of Design", period: "2022", circled: true },
        { title: "B.Sc. Computer Science", place: "Universidade de Lisboa", period: "2019" },
        { title: "Accessibility Specialist (CPACC)", place: "IAAP", period: "2023" },
      ]}
      cvUrl="https://example.com/kenji-ward"
      cvNote="the long version"
      languages={[
        { name: "Portuguese", level: "native", value: 1 },
        { name: "English", level: "C2", value: 0.95 },
        { name: "Japanese", level: "A2", value: 0.3 },
      ]}
      tools={[
        { name: "Figma", mark: "figma", bg: "#1e1e1e", fg: "#ffffff", note: "components all the way down" },
        { name: "Framer", mark: "Fr", bg: "#0055ff", fg: "#ffffff", note: "for prototypes that feel real" },
        { name: "Swift", mark: "Sw", bg: "#f05138", fg: "#ffffff", note: "I can ship a SwiftUI screen" },
      ]}
      toolNote="hover a tool"
      books={[
        { title: "Thinking in Systems", color: "#1f2a2b" },
        { title: "Shape Up", color: "#e0613a" },
        { title: "Inclusive Design Patterns", color: "#efe8dc" },
      ]}
      booksNote="on my desk right now"
      projectsNote="three I'm proudest of"
      projects={[
        {
          name: "Ledger",
          tagline: "Money, minus the anxiety.",
          kind: "Fintech · iOS & Android",
          year: "2026",
          summary: "A spending app for freelancers whose income arrives in lumps. We replaced budgets with [a calm weekly allowance] and moved every scary number *one tap deeper*.",
          challenge: "Explain irregular income without a single pie chart.",
          stats: [
            { value: 38, suffix: "%", label: "fewer support tickets" },
            { value: 4.8, decimals: 1, label: "App Store rating" },
          ],
          images: [U + "1506126613408-eca07ce68773", U + "1505576399279-565b52d4ac71", U + "1544367567-0f2fcb009e0b"],
          screens: ["stats", "cover", "detail"],
          accent: "#1f6f6b",
          tag: "shipped",
        },
        {
          name: "Atelier",
          tagline: "Studio space by the hour.",
          kind: "Marketplace · Web",
          year: "2025",
          summary: "Booking for shared art studios. Painters wanted to *see the light* before paying, so every listing leads with [photos at three times of day].",
          note: "the light-slider was a hallway idea",
          images: [U + "1460661419201-fd4cecdf8a8b", U + "1541961017774-22349e4a1262", U + "1513364776144-60967b0f800f"],
          screens: ["feed", "cover", "detail"],
          accent: "#e0613a",
          tag: "side project",
        },
        {
          name: "Chapter",
          tagline: "Book clubs that actually meet.",
          kind: "Community · Mobile",
          year: "2024",
          summary: "Scheduling is where book clubs die. Chapter proposes [three dates everyone can make] and keeps the discussion *spoiler-safe by page number*.",
          images: [U + "1481627834876-b7833e8f5570", U + "1532012197267-da84d127e765", U + "1495446815901-a7297e633e8d"],
          screens: ["detail", "feed", "cover"],
          accent: "#8a5a2b",
          tag: "research-led",
        },
      ]}
      factsNote="off the clock"
      facts={[
        { doodle: "camera", text: "I shoot everything on a 1982 Olympus" },
        { doodle: "mountain", text: "Climbed Pico, Azores, in the fog" },
        { doodle: "plant", text: "Thirty-one plants, zero casualties (this year)" },
        { doodle: "headphones", text: "Bossa nova only, when I'm in flow" },
      ]}
      thanks="Obrigado"
      email="kenji@example.com"
      links={[
        { label: "Read.cv", href: "https://read.cv" },
        { label: "GitHub", href: "https://github.com" },
      ]}
      letter={"Thanks for reading this far — that already says a lot about you.\n\nIf you're building something that should feel quiet and trustworthy, I'd love to hear about it."}
      colors={{ paper: "#efe8dc", night: "#1f2a2b", ink: "#2a2420", pen: "#e0613a" }}
    />
  )
}
