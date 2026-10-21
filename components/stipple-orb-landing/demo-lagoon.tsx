"use client"

import StippleOrbLanding from "@/components/ui/stipple-orb-landing"

export default function DemoLagoon() {
  return (
    <StippleOrbLanding
      brand="Tideline"
      palette="lagoon"
      nav={[
        { label: "Athletes", href: "#stories" },
        { label: "How it works", href: "#how" },
        { label: "FAQ", href: "#faq" },
      ]}
      hero={{
        title: "*Fund the athlete,*\nShare the Podium",
        text: "Back rising athletes before the sponsors arrive, and share in prize money, endorsements and coaching income for ten years.",
        social: "Joined by 640+ backers",
        backers: [
          { name: "Seabright Fund", mark: "wave" },
          { name: "Harrow & Lune", mark: "rings" },
        ],
      }}
      thesis={{
        title: "Sponsors arrive after the medals. *Backers arrive before,* and share in every season that follows.",
        more: 96,
        stake: 0.03,
        streams: [
          { label: "Prize money", value: 48000, icon: "spark" },
          { label: "Endorsements", value: 61000, icon: "megaphone" },
          { label: "Coaching", value: 22000, icon: "case" },
          { label: "Content", value: 15500, icon: "play" },
        ],
      }}
      paths={{
        title: "Back an athlete, or get backed",
        model: { income: 90000, growth: 0.18, share: 0.1, raise: 80000, years: 10 },
        investors: {
          title: "For backers",
          text: "Commit to an athlete's career, not one race. Prize money, sponsorships and coaching all count toward your share.",
          link: "Start backing",
          bullets: ["Every income stream counts", "Ten-year terms", "Quarterly statements"],
          caption: "Your share of every season",
        },
        individuals: {
          title: "For athletes",
          text: "Pay for coaching, travel and kit now, for a share of what you earn later. You keep your sponsors and your say.",
          link: "Apply for funding",
          bullets: ["Train full time", "Keep your sponsors", "Backers in your corner"],
          caption: "Use of funds",
        },
      }}
      cta={{ title: "Back the *next* champion *before* the world *knows their name.*" }}
      footer={{ tagline: "Tideline funds athletes in the seasons that matter most." }}
    />
  )
}
