"use client"

import * as React from "react"
import AgentHandoffFlow from "@/components/ui/agent-handoff-flow"

// Watch the first task hop Router → Web search → Code, then try the pills,
// type your own ("plot", "latest", "hello"), or click an agent to make it answer.
export default function Demo() {
  return (
    // w-full: 21st centres demos in a flex wrapper that would shrink this to 0px.
    <div className="w-full">
      <AgentHandoffFlow />
    </div>
  )
}
