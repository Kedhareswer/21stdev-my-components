# Agent Console Template

A complete, working front end for an agent that plans its work as a small
state machine. You ask for something, the agent writes a machine for it, and
nothing runs until you approve. Then it runs state by state while you watch
the transcript, a live state graph, and the store it writes to.

It fills the page. Sessions are on the left, the transcript is in the middle
and the machine is on the right. Three hand-drawn crew members keep watch from
the bottom of the sidebar.

```
http://localhost:5173/#agent-console-template         # mid-run on the first visit, then whatever you left it as
http://localhost:5173/#agent-console-template/live    # a real agent: async planner + an executor that audits this page
http://localhost:5173/#agent-console-template/blank   # a blank start on paper, with suggestions
http://localhost:5173/#agent-console-template/night   # your own brand, theme and machine, awaiting approval
http://localhost:5173/?dark#agent-console-template    # the dark check (the app paints its own theme)
```

```tsx
import AgentConsoleTemplate from "@/components/ui/agent-console-template"

export default function Page() {
  return <AgentConsoleTemplate brand="Cairn" project="atelier" />
}
```

## What works

| Do this | And |
|---|---|
| Type a task, `⌘↵` | A machine is written for it (named from the request: *create a CLI… TODOs* → `BuildTodoCli`) and waits for you |
| **Approve** / **Decline** / **Edit** | Nothing runs before you approve. Edit opens the machine's source |
| Edit the source | A real editor: syntax colouring, a live graph, lint warnings, errors with line numbers. **Save** (`⌘↵` or `⌘S`) swaps the machine in before it runs |
| Watch it run | Steps stream into the transcript, store writes land in the panel, each finished state folds into a row with its duration |
| A check fails | The run takes the repair loop and comes back. Every state gets `maxVisits` (3) before the run is abandoned |
| `⌘.` or the square | Stops exactly where it is. **Resume** carries on, **End run** finishes it |
| Ask again in the same session | Follow-ups stack up as turns, each with its own machine. Click a machine's name to show an earlier one in the panel |
| Click a graph node | Inspect its writes, exits and prompt. **Follow run** goes back to the live state |
| Click a `set` value in the store | Change it, mid-run too. The change is logged in the transcript |
| `[ ]` / `[x]` lines | Real checkboxes |
| Sessions | `+` new, search (`⌘K`), double-click or **⋯ → Rename**, **⋯ → Export transcript** (Markdown), **⋯ → Delete** |
| Settings (sliders icon) | Theme, simulation speed, auto-approve, the crew, import a `.cairn` file, export the session, clear everything, and the shortcuts |
| Reload the page | Everything is still there: sessions, runs mid-flight, settings |
| Click a crew member | They say something about the run. The Seer's orb glows while authoring, the Menhir's rune pulses on every store write, the Warden flaps through checks and follows your pointer, and all three hop when a run finishes |

## Wiring a real agent

Two props turn the simulation into a real agent. Both receive an
`AbortSignal` that fires when the run is stopped or deleted.

```tsx
import AgentConsoleTemplate, { type Planner, type StateExecutor } from "@/components/ui/agent-console-template"

// Write the machine. Return it, or a promise of it.
const planner: Planner = async (prompt, { signal, previous }) => {
  const res = await fetch("/api/plan", { method: "POST", body: JSON.stringify({ prompt, previous }), signal })
  return res.json() // a Machine: { name, states: [...], store: [...] }
}

// Do one state's work. Stream lines with log, set values with write.
// When it resolves, the exit is picked from the store (when → otherwise).
// Throwing stops the run with your error, and Resume retries the state.
const executor: StateExecutor = async ({ state, prompt, store, signal, log, write }) => {
  const res = await fetch("/api/run-state", { method: "POST", body: JSON.stringify({ state, prompt, store }), signal })
  const reader = res.body!.pipeThrough(new TextDecoderStream()).getReader()
  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    for (const line of value.split("\n").filter(Boolean)) {
      const msg = JSON.parse(line) // e.g. { log: "…" } or { write: ["checksPassed", true] }
      if (msg.log) log(msg.log)
      if (msg.write) write(msg.write[0], msg.write[1])
    }
  }
}

<AgentConsoleTemplate planner={planner} executor={executor} />
```

`simulateState(ctx)` plays a state's scripted `steps`/`values` through the
same interface, so you can wire states one at a time:
`executor={(ctx) => myStates[ctx.state.id]?.(ctx) ?? simulateState(ctx)}`.
`demo-live.tsx` does exactly that. Its audit states do real work (they count
the page's controls, check their accessible names, and read the heading
outline), and everything else falls back to the simulation.

Without an `executor`, a built-in clock plays the machines' scripts, paced by
the speed setting. Without a `planner`, the built-in one writes a seven-state
machine named after the request.

### Machines

```ts
const machine: Machine = {
  name: "ShipRelease",
  maxVisits: 2,                 // per state, then the failure state (default 3)
  store: [
    { key: "releaseTag", kind: "set", value: "v4.12.0" },  // given up front, editable in the panel
    { key: "testsGreen", kind: "observed" },               // read off the world
    { key: "failingSuite" },                               // written by the agent
  ],
  states: [
    { id: "RunTestMatrix", prompt: "…", writes: ["testsGreen"],
      when: [{ key: "testsGreen", to: "Ship" }], next: "TriageFailures",
      // simulation only:
      steps: [["$ ci run", "3 of 40 failed"], ["$ ci run", "40 of 40 passed"]],
      values: { testsGreen: [false, true] } },
    { id: "TriageFailures", writes: ["failingSuite"], next: "RunTestMatrix" },
    { id: "Ship", final: true },
    { id: "RolledBack", final: true, outcome: "failure" },
  ],
}
```

The first state is the initial one. `when` exits are tried in order against
the store, and `next` is the fallback. A final state named like *Abandoned*
or *Failed* counts as a failure unless `outcome` says otherwise.

### The `.cairn` source format

What the viewer shows, the editor edits, and **Download** / **Import** read
and write. The extension follows `brand`.

```
machine ShipNotes
  max visits 3

store
  agent     notes
  set       audience = "the team"

initial WriteNotes
  writes notes
  otherwise -> Review
  prompt
    | Write the release notes from the merged pull requests.

state Review
  when notes -> Done
  otherwise -> Abandoned

final Done
final Abandoned failure
```

`machineSource(machine)` writes it and `parseMachine(text)` reads it back
(`{ machine, errors }`, with line numbers). They round-trip.

## Props

| Prop | Default | Notes |
|---|---|---|
| `brand` / `logo` / `project` / `cwd` | Cairn / cairn mark / atelier / a sample path | Title bar and footer |
| `sessions` | three sample sessions | Used when nothing is saved yet. `{ id?, title?, prompt, machine?, status?, at? }[]`. `status`: `deciding`, `awaiting`, `running`, `done`. `[]` opens blank |
| `planner` | built-in | `(prompt, { signal, previous }) => Machine \| Promise<Machine>` |
| `executor` | the simulation | `(ctx) => void \| Promise<void>`. See above |
| `suggestions` | three tasks | One-click prompts on a blank session |
| `theme` | `"sage"` | `"sage"`, `"paper"`, `"lilac"`, `"night"`, or a partial palette |
| `speed` | `1` | Simulation speed (½×–4× in Settings) |
| `autoApprove` | `false` | Skip the approval step |
| `crew` | `true` | Show the crew |
| `storageKey` | `"agent-console-template"` | localStorage key. `null` keeps nothing between visits. Give each instance on a site its own |
| `defaultPanelOpen` | `true` | Machine panel on wide screens |
| `height` / `minHeight` | `100svh` / `560` | Never a percentage |
| `onSend` / `onApprove` / `onFinish` | | `(prompt, sessionId)`, `(run)`, `({ id, session, prompt, machine, outcome })` |

The engine is exported too, and every function is pure: `planMachine`,
`machineName`, `lintMachine`, `layoutMachine`, `machineSource`,
`parseMachine`, `createRun`, `tick`, `approve`, `decline`, `stop`, `resume`,
`endRun`, `logStep`, `writeStore`, `advanceRun`, `editMachine`,
`transcriptMarkdown`, `readSnapshot`, `simulateState`, `wait`, and the sample
`TODO_MACHINE`.

## Layout

The root takes a definite `height` and lays the app out inside it as a
column, so nothing depends on a parent height chain. The layout answers to
the app's own width:

| Width | Layout |
|---|---|
| ≥ 1000px | sessions, transcript and machine side by side |
| 720–999px | the machine panel becomes a drawer from the right |
| < 720px | the sessions become a drawer too |

## Keyboard

| Keys | Does |
|---|---|
| `⌘↵` / `Ctrl ↵` | Send, approve, or save in the editor |
| `⌘.` | Stop, or resume |
| `⌘K` | Search sessions |
| `⌘\` | Machine panel |
| `Esc` | Close whatever is open |

The app only takes these while focus is inside it, or nowhere at all.

## Install notes

Self-contained: React is the only import, and there are no remote assets. The
crew and every icon are inline SVG. All CSS sits in one scoped `<style>`
block under `.act-`, and SVG ids come from `useId`, so two consoles on one
page do not collide.

`Inter` and `JetBrains Mono` are named with system fallbacks, not imported. If
the host does not load them, the layout stays the same.

Saving is throttled, not debounced, so a running machine is saved too, and it
flushes on `pagehide`. If storage is blocked or full, the app keeps working
and simply forgets on reload. After a reload, a run that was mid-state with a
live `executor` comes back stopped, because a promise cannot survive a reload.
Press Resume to redo that state.

`prefers-reduced-motion` turns off the spinners, pulses, the travelling edge
dot and the crew's animations. The runs themselves still play.
