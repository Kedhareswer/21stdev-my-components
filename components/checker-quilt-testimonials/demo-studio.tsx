import CheckerQuiltTestimonials from "@/components/ui/checker-quilt-testimonials"

const U = "https://images.unsplash.com/"
const Q = "?auto=format&fit=crop&w=1200&q=80"

export default function CheckerQuiltStudioDemo() {
  return (
    <div className="w-full">
      <CheckerQuiltTestimonials
        preset="marigold"
        rows={1}
        height="clamp(480px, 62svh, 640px)"
        heading="Clients, on the record."
        cta={{ label: "Start a project", href: "#contact" }}
        autoplay={6500}
        testimonials={[
          {
            quote: "They renamed us, rebuilt the site and shipped the packaging in eleven weeks. Our reorder rate went up the month it launched.",
            name: "Priya Nair",
            context: "Founder, Hearth & Vine wines",
            photo: U + "photo-1494790108377-be9c29b29330" + Q,
            focus: "50% 28%",
          },
          {
            quote: "The only agency that asked to sit in on our sales calls before drawing a single logo.",
            name: "Daniel Osei",
            context: "Head of growth, Ledgerline",
            photo: U + "photo-1507003211169-0a1dd7228f2d" + Q,
          },
          {
            quote: "Our booking page used to be a PDF. Now it is the reason guests pick us over the hotel across the square.",
            name: "Ellie Marsh",
            context: "Owner, The Salt House",
            photo: U + "photo-1438761681033-6461ffad8d80" + Q,
          },
          {
            quote: "Calm, opinionated and on time. Two years later we still use the type system every day.",
            name: "Graham Whitlock",
            context: "Director, Whitlock Joinery",
            photo: U + "photo-1472099645785-5658abf4ff4e" + Q,
          },
        ]}
      />
    </div>
  )
}
