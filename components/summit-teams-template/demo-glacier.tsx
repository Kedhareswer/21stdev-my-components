"use client"

import SummitTeamsTemplate from "@/components/ui/summit-teams-template"

const U = (id: string, w: number) => "https://images.unsplash.com/photo-" + id + "?auto=format&fit=crop&w=" + w + "&q=80"

/* The same template as another product: a cooler accent, its own copy,
   plans and photographs, and callbacks wired to the console. */
export default function DemoGlacier() {
  return (
    <SummitTeamsTemplate
      accent="#8fc8ff"
      brand={{ name: "Halden", tagline: "Shift planning and access for field teams." }}
      hero={{
        eyebrow: "Built for crews",
        eyebrowTag: "out in the field",
        eyebrowFaces: [U("1500648767791-00dcc994a43e", 160), U("1494790108377-be9c29b29330", 160), U("1531123897727-8f129e1688ce", 160)],
        title: ["Every crew, shift", "and keycard, sorted."],
        text: "Plan rotations, hand out site access and see who is on the mountain today, from one calm dashboard.",
        cta: "Get early access",
        photo: { src: U("1519681393784-d120267933ba", 2400), alt: "A snowy mountain under a sky full of stars", focus: "50% 70%" },
      }}
      pricing={{
        label: "Plans",
        title: "Pricing that scales with the season",
        text: "Pay for the crews you run. Pause seats in the off-season without losing a thing.",
        monthlyLabel: "Monthly",
        yearlyLabel: "Yearly",
        discount: 0.25,
        ribbon: "Most crews pick this",
        note: "Pause or cancel any time.",
        ribbonPhoto: { src: U("1500534314209-a25ddb2bd429", 900), alt: "Blue ridges in haze" },
      }}
      plans={[
        { id: "crew", name: "Crew", blurb: "One site, one team.", price: 8, unit: "Per User", icon: "bolt", cta: "Start Crew", features: ["Up to 10 people", "Shift rotations", "Site keycards", "Email support"] },
        { id: "site", name: "Site", blurb: "Several crews on one mountain.", price: 22, unit: "40 Users", icon: "flag", cta: "Start Site", featured: true, features: ["Up to 40 people", "Crew roles & leads", "Live roster", "Incident log", "Offline mode", "Priority support"] },
        { id: "range", name: "Range", blurb: "Every site, every season.", price: 36, unit: "120 Users", icon: "spark", cta: "Talk to us", features: ["Unlimited sites", "SSO & audit trail", "Custom reports", "Dedicated manager", "24/7 support"] },
      ]}
      cta={{
        title: "Get the whole crew on one page",
        text: "Rosters, roles and access that keep up with the weather.",
        primary: "Start free",
        secondary: "Talk to sales",
        photo: { src: U("1506905925346-21bda4d32df4", 2000), alt: "Peaks above a sea of cloud at sunrise" },
        flags: true,
      }}
      onJoin={(email) => console.log("waitlist", email)}
      onSelectPlan={(plan, billing) => console.log("plan", plan.id, billing)}
      onCta={(which) => console.log("cta", which)}
    />
  )
}
