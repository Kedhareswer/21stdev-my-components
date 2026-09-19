"use client"

import NotebookTestimonials from "@/components/ui/notebook-testimonials"

const ITEMS = [
  {
    quote: "A story that lingers long after the last page. Not loud, but deeply impactful.",
    handle: "@the_sleepy_reader",
    rating: 5,
    date: "Oct 31, 2025",
  },
  {
    quote: "One of those books you keep thinking about. Worth the read.",
    handle: "@emmaonbooks",
    rating: 5,
    date: "Sep 10, 2024",
  },
  {
    quote: "A thoughtful and well-paced read that stays with you.",
    handle: "@pageswithtea",
    rating: 5,
    date: "Jul 23, 2026",
  },
]

export default function Demo() {
  return (
    <div className="flex w-full items-center justify-center bg-[#ececec] px-6 py-24">
      <NotebookTestimonials items={ITEMS} />
    </div>
  )
}
