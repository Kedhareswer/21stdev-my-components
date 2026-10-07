"use client"

import AfterglowPricing from "@/components/ui/afterglow-pricing"

// Same section, another product: three plans, the lagoon glow, 20% off
// annually (and annual picked by default), no app-bar action.
export default function DemoCustom() {
  return (
    <AfterglowPricing
      brand="Lumen"
      tabs={["Library", "Edits", "Billing"]}
      defaultTab="Billing"
      action=""
      title="Choose your plan"
      glow="lagoon"
      annualDiscount={0.2}
      defaultBilling="annual"
      currency="€"
      plans={[
        {
          label: "Hobby",
          price: 9,
          description: "Batch-edit a weekend of photos in minutes",
          features: ["500 edits a month", "12 film looks", "Web export"],
        },
        {
          label: "Pro",
          price: 24,
          description: "Every look, raw files and a faster queue",
          features: ["Unlimited edits", "All 60 film looks", "RAW + TIFF export", "Priority queue"],
          badge: "Best value",
          featured: true,
          cta: "Start free trial",
        },
        {
          label: "Studio",
          price: 79,
          description: "Shared presets and seats for a whole team",
          features: ["10 seats", "Shared preset library", "Client galleries", "SSO"],
          cta: "Talk to us",
        },
      ]}
      faqTitle="Questions, answered"
      faqs={[
        { question: "Is there a free trial?", answer: "Pro comes with 14 days free. No card needed until the trial ends." },
        { question: "Can I keep my presets if I cancel?", answer: "Yes — export them as .cube files any time, on any plan." },
        { question: "Do you offer education pricing?", answer: "Students and teachers get Pro at half price with a school email." },
      ]}
      defaultOpenFaq={-1}
    />
  )
}
