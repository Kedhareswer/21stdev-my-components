"use client"

import * as React from "react"
import AgentHandoffFlow from "@/components/ui/agent-handoff-flow"

// The defaults: paper theme, Router → Web search → Code, cycling four sample tasks.
// Click an agent to make it answer, or the Task card to skip ahead.
export default function DemoPaper() {
  return (
    // w-full: 21st centres demos in a flex wrapper that would shrink this to 0px.
    <div className="w-full">
      <AgentHandoffFlow />
    </div>
  )
}
