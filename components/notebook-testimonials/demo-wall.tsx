"use client"

import NotebookTestimonials from "@/components/ui/notebook-testimonials"

const ITEMS = [
  { quote: "Shipped it on a Friday. Nothing caught fire.", handle: "@dep_loyed", rating: 5, date: "Mar 04, 2026" },
  { quote: "Replaced four hundred lines of config with a single flag.", handle: "@tiny_diffs", rating: 5, date: "Feb 19, 2026" },
  { quote: "The docs answered the question I was about to ask. Twice.", handle: "@rtfm_enjoyer", rating: 4, date: "Feb 02, 2026" },
  { quote: "Onboarded a new hire in an afternoon.", handle: "@lead_dev_amy", rating: 5, date: "Jan 27, 2026" },
  { quote: "It does one thing. I keep finding that refreshing.", handle: "@unixbrain", rating: 5, date: "Jan 08, 2026" },
  { quote: "Our bundle got smaller. I still do not fully believe it.", handle: "@perfbudget", rating: 5, date: "Dec 15, 2025" },
]

export default function Demo() {
  return (
    <div className="w-full bg-[#e6e3dd] px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <NotebookTestimonials
          items={ITEMS}
          cardWidth={300}
          rowSize={32}
          tilt={7}
          seed={4}
          paper="#faf8f4"
        />
      </div>
    </div>
  )
}
