"use client"

import ReceiptSpikeTestimonials from "@/components/ui/receipt-spike-testimonials"

// Dark wall, light ink for the headline and keys, and a slow autoplay that
// pauses while the pointer or focus is on it.
export default function DemoNight() {
  return (
    <div className="w-full">
      <ReceiptSpikeTestimonials
        title="On file"
        startNo={101}
        autoplay={5000}
        wall="#18181a"
        paper="#efece4"
        ink="#111111"
        labelInk="#efece4"
        testimonials={[
          { quote: "Shipped the redesign a week early and the Lighthouse score went green across the board.", name: "Priya Nair", role: "PM, Ledgerly", project: "Web app", date: "08.2026", rating: 5 },
          { quote: "Reviewed our codebase in two days and left notes the whole team still quotes.", name: "Jonas Berg", role: "CTO, Kiln", project: "Code review", date: "05.2026", rating: 5 },
          { quote: "Clear estimates, clearer commits.", name: "Ada Mensah", role: "Founder, Tern", project: "Landing page", date: "01.2026", rating: 4 },
          { quote: "The workshop turned three skeptics into the people now running our design system.", name: "Luis Prado", role: "Lead, Fika", project: "Workshop", date: "10.2025", rating: 5 },
        ]}
      />
    </div>
  )
}
