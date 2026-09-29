# Agent Handoff Flow

An interactive diagram of a multi-agent pipeline, drawn on graph paper. A task
card sends a checklist chip into a row of agents. Each agent works on it, then
its gate decides: **answer** (the packet drops down the dashed branch to the
Answer card) or **hand off** (the packet moves on to the next agent, carrying
everything learned so far). A live trace, a typed-out answer and chunky pixel
icons give it some character.

Everything is drawn at runtime: pixel icons are inline SVG grids, the lines are
SVG paths, and the grid paper is a CSS gradient. **No images, fonts or packages.**
React is the only import.

## Interaction

There are no buttons or inputs around the diagram; everything happens on it.

- **It plays itself.** Once the flow scrolls into view it runs `tasks` in order,
  pausing on each answer, and loops (`autoPlay={false}` turns that off). Routing is
  keyword based: the furthest agent whose keyword appears in the task answers it,
  so "chart the weather" goes Router → Web search → Code.
- **Click the Task card** to skip to the next task.
- **Pin an agent.** Click any agent to make it the one that answers, whatever the
  task says. Click it again to unpin.
- **Hover** (or tab to) any card, chip or gate for a short explanation.
- `Esc` stops the loop; clicking the Task card starts it again.

The layout picks itself: a row on wide screens, a column with agent descriptions
on phones (`layout="row" | "column"` forces one). With `prefers-reduced-motion`,
the dashes stop marching, nothing bobs, the packet moves 3× faster and the answer
appears at once instead of being typed.

## Usage

```tsx
import AgentHandoffFlow from "@/components/ui/agent-handoff-flow"

<AgentHandoffFlow />

// your own agents, icons and a real model behind the Answer card
import AgentHandoffFlow, { ICONS } from "@/components/ui/agent-handoff-flow"

<AgentHandoffFlow
  theme="night"
  title="Support desk"
  tasks={[{ task: "I was charged twice for my plan" }, { task: "The API returns a 500 error" }]}
  agents={[
    { id: "triage", name: "Triage", icon: ICONS.mail, description: "Tags every ticket." },
    { id: "billing", name: "Billing", icon: ICONS.database, keywords: ["refund", "invoice"] },
    { id: "eng", name: "Engineer", icon: "..#..|.###.|#####", keywords: ["bug", "error"] },
  ]}
  resolve={async (task, agent, chain) => {
    const r = await fetch("/api/agents", { method: "POST", body: JSON.stringify({ task, agent: agent.id }) })
    return (await r.json()).answer
  }}
  onAnswer={(r) => console.log(r.agent.name, "answered in", r.ms, "ms")}
/>
```

The flow waits at the Answer card until `resolve` settles, so a slow model call
just shows as the Answer card "typing".

Also exported: `ICONS` (router, person, bubble, globe, braces, doc, checklist, dots,
database, mail, spark), `DEFAULT_AGENTS`, `DEFAULT_TASKS`, `routeTask`.

## Props

| Prop | Default | Notes |
|---|---|---|
| `agents` | Router, Web search, Code | 1 to 6. `{ id, name, icon?, description?, working?, keywords?, reply? }`. The first is the orchestrator (painted in the accent colour). |
| `tasks` | 4 sample tasks | `{ task, answer? }`, played in order and looped. A task's `answer` is used when it routes normally. |
| `resolve` | none | `(task, agent, chain) => string \| Promise<string>`. Otherwise the agent's `reply`, then a generic line. |
| `onAnswer` | none | `({ task, agent, answer, handoffs, ms })` when the answer lands. |
| `title` / `subtitle` | "Agent handoffs" | The subtitle shows in the row layout only. |
| `theme` | `"paper"` | `"paper"` (cream, orange) or `"night"` (ink, mint). |
| `colors` | from theme | Any of `paper`, `grid`, `ink`, `box`, `boxText`, `node`, `nodeText`, `accent`, `accentText`, `card`, `muted`. |
| `autoPlay` | `true` | Start when the flow is first on screen, then keep cycling through `tasks`. |
| `layout` | `"auto"` | `"auto"`, `"row"` or `"column"`. |
| `height` | `"100svh"` | Always a definite length, never a percentage. |
| `className` | none | Added to the root `<section>`. |

## Icons

An icon is a pixel grid: rows of `#` (on) and `.` (off), either an array of strings
or one string with rows split by `|`. It is scaled to fit the card and painted in
`currentColor`, so it follows the theme.

## Notes

- No dependencies beyond React. Needs Tailwind for a handful of layout utilities.
- The orchestrator's default mark is an original pixel critter, not any company's logo.
- The diagram is drawn at a fixed design size and scaled to fit, so it stays crisp
  and in proportion at any size you give it.
