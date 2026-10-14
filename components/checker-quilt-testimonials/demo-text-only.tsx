import CheckerQuiltTestimonials from "@/components/ui/checker-quilt-testimonials"

// No photos: every portrait tile becomes a monogram plate in the preset's third tone.
export default function CheckerQuiltTextOnlyDemo() {
  return (
    <div className="w-full">
      <CheckerQuiltTestimonials
        preset="mint"
        heading="Finance teams that closed the month early."
        cta={{ label: "See pricing", href: "#pricing" }}
        autoplay={0}
        testimonials={[
          {
            quote: "Month-end used to take us nine working days. We closed September in four, and nobody stayed past six.",
            name: "Amara Okafor",
            context: "Controller, Fieldnote Coffee",
          },
          {
            quote: "The receipt matching alone pays for it. Our auditors asked which firm we had hired.",
            name: "Jonas Weber",
            context: "CFO, Brightline Studio",
          },
          {
            quote: "I approve spend from my phone between site visits. The team stopped chasing me on Slack.",
            name: "Lucía Herrera",
            context: "Founder, Herrera Build",
          },
          {
            quote: "Setup took an afternoon. It read our old spreadsheets better than we did.",
            name: "Sam Patel",
            context: "Operations lead, Northpaw Vets",
          },
        ]}
      />
    </div>
  )
}
