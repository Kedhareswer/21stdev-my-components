"use client"

import AgentMachineConsole from "@/components/ui/agent-machine-console"

// A blank session on paper. Pick a suggestion or type a task: the built-in
// planner writes a machine for it, and it waits for your approval.
export default function AgentMachineConsoleBlankDemo() {
  return <AgentMachineConsole sessions={[]} theme="paper" brand="Thimble" project="side-quests" cwd="~/code/side-quests" />
}
