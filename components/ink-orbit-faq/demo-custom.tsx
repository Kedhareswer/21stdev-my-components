"use client"

import InkOrbitFaq from "@/components/ui/ink-orbit-faq"

// A support-desk product: its own story, stats and questions, light theme,
// every answer closed on load.
export default function DemoCustom() {
  return (
    <div className="w-full">
      <InkOrbitFaq
        theme="light"
        defaultOpen={-1}
        about={{
          title: "Made by former\n*support agents.*",
          body: "We spent years answering the same twelve questions. Tessellate is the colleague we wished we’d had.",
          stats: [
            { value: "2,300+", label: "Support teams" },
            { value: "91M", label: "Tickets triaged" },
            { value: "9min", label: "Median first response" },
            { value: "4.8/5", label: "G2 rating" },
          ],
        }}
        faq={[
          { question: "Does it replace my helpdesk?", answer: "No — it sits on top of the one you already use and works through its API." },
          { question: "Who sees the drafts?", answer: "Only your agents. Nothing is sent to a customer until a person approves it." },
          { question: "How is it priced?", answer: "Per seat, with unlimited tickets on every plan." },
        ]}
      />
    </div>
  )
}
