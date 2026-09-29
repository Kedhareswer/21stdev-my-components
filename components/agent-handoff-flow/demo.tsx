"use client"

import * as React from "react"
import AgentHandoffFlow, { ICONS, type HandoffAgent } from "@/components/ui/agent-handoff-flow"

// A support desk: four agents with custom pixel icons,
// the night theme, and an async `resolve` standing in for a real model call.
const HEADSET = [
  "...#####...",
  "..#.....#..",
  ".#.......#.",
  "#.........#",
  "###.....###",
  "###.....###",
  "###.....###",
  "..#......#.",
  "...#...###.",
]

const DESK: HandoffAgent[] = [
  {
    id: "triage",
    name: "Triage",
    icon: ICONS.mail,
    description: "Reads the ticket, tags it and answers the easy ones.",
    working: "tagging the ticket",
    reply: () => "Thanks for writing in! That's covered in our help centre, so I've sent you the article.",
  },
  {
    id: "billing",
    name: "Billing",
    icon: ICONS.database,
    description: "Looks up invoices, plans and payment history.",
    working: "checking 3 invoices",
    keywords: ["invoice", "charge", "charged", "refund", "plan", "billing", "payment", "card"],
  },
  {
    id: "engineer",
    name: "Engineer",
    icon: ICONS.braces,
    description: "Reproduces bugs and reads the logs.",
    working: "tailing the logs",
    keywords: ["bug", "error", "crash", "broken", "500", "api", "timeout"],
  },
  {
    id: "human",
    name: "Human",
    icon: HEADSET,
    description: "A real person, for anything the agents should not decide alone.",
    working: "paging the on-call",
    keywords: ["angry", "cancel", "lawyer", "urgent", "manager"],
  },
]

async function resolve(task: string, agent: HandoffAgent, chain: HandoffAgent[]) {
  // Swap this for your model or agent API.
  await new Promise((r) => setTimeout(r, 700))
  const path = chain.map((a) => a.name).join(" → ")
  return agent.name + " took it (" + path + "): “" + task + "” is resolved and the customer has been emailed."
}

export default function Demo() {
  return (
    <div className="w-full">
      <AgentHandoffFlow
        theme="night"
        agents={DESK}
        resolve={resolve}
        title="Support desk"
        subtitle="Tickets start at triage and move down the line until someone can close them."
        tasks={[
          { task: "Urgent: I want to cancel my account" },
          { task: "I was charged twice for my plan" },
          { task: "The API returns a 500 error on upload" },
          { task: "How do I reset my password?" },
        ]}
      />
    </div>
  )
}
