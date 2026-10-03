# Agent Machine Console

A desktop workbench for an agent that turns a request into a small state
machine, waits for you to approve it, then runs it one state at a time.
Sessions sit on the left, the transcript in the middle and the machine on the
right: a live state graph, the state being worked on, and the store it writes
to. Three hand-drawn crew members keep watch from the bottom of the sidebar
and react to whatever the run is doing.

The window floats in a gridded studio with a rainbow ribbon running behind it.
Everything is simulated in the browser, so it works as a living mock-up of an
agent product, or as the shell for a real one.

```
http://localhost:5173/#agent-machine-console          # mid-run: BuildTodoCli inspecting the workspace
http://localhost:5173/#agent-machine-console/blank    # a blank session on paper, with suggestions
http://localhost:5173/#agent-machine-console/night    # your own brand, theme and machine, awaiting approval
http://localhost:5173/?dark#agent-machine-console     # the dark check (the console paints its own theme)
```

## Interaction

- **Ask**: type a task and press `⌘↵` (`Ctrl ↵` elsewhere), or pick a
  suggestion. The planner names the machine from the request (*“create a CLI
  tool… TODOs”* → `BuildTodoCli`) and writes its states.
- **Approve**: nothing runs until you approve. `Approve`, `Decline`, or `⌘↵`
  again. Turn on *Approve machines automatically* in Tweaks to skip this.
- **Watch it run**: every state streams its steps into the transcript. Shell
  commands, tool calls, failures and passes are styled differently. Store
  writes appear inline and in the store panel. Each finished state folds into a
  row you can reopen. When a check fails, the run takes the repair loop and
  comes back to verify again.
- **TODO checkboxes**: any `[ ]` or `[x]` line in a transcript is a real
  checkbox you can tick.
- **Stop / Resume**: the square stops the run exactly where it is.
- **Graph**: the current state pulses and a dot travels along each transition.
  Hover a node to name it. Click one to inspect its writes, exits and prompt;
  *Follow run* goes back to the live state.
- **View .cairn**: the machine as a readable source file, with a large graph
  and syntax colouring, plus Copy. The extension follows `brand`.
- **Warnings**: the authored machine is linted for loops, dead ends,
  unreachable states and missing targets. Click the count to read them.
- **Sessions**: `+` starts one, `×` removes one, and every session keeps
  running in the background while you look at another.
- **Window**: the red and yellow lights close or minimise the window to a pill
  (runs keep going), and green zooms it to fill the scene. The chevron hides
  the sessions, and the round button hides the machine panel.
- **Tweaks** (sliders icon): theme, playback speed, auto-approve, crew.
- **The crew**: the Seer writes the machines, the Menhir keeps the store, and
  the Warden watches the checks. The Seer's orb glows while authoring, the
  Menhir's rune pulses on every store write, the Warden flaps through
  verification and follows your pointer with his eye, and all three hop when a
  run finishes. Click one and they say something about the run.

## Sizing

The root takes a definite `height` (default `100svh`, with a `minHeight` of
600px). The window is centred inside it and capped at 1240 × 800. Nothing
depends on a parent height chain.

The layout answers to the window's own width, not the viewport's:

| Window width | Layout |
|---|---|
| ≥ 980px | sessions, transcript and machine side by side |
| 700–979px | the machine panel becomes a drawer from the right |
| < 700px | the sessions become a drawer too, and the window fills the scene |

## Props

| Prop | Default | Notes |
|---|---|---|
| `brand` / `project` / `cwd` | Cairn / atelier / a sample path | Title bar and footer. `brand` also names the source format (`.cairn`). |
| `sessions` | three sample sessions | `{ id?, prompt, machine?, status?, at? }[]`. `status` is `deciding`, `awaiting`, `running` or `done`. `at` fast-forwards a running session to a state. `[]` opens on a blank session. |
| `planner` | built-in | `(prompt) => Machine`. Writes the machine for each new prompt. |
| `suggestions` | three tasks | One-click prompts on a blank session |
| `theme` | `"sage"` | `"sage"`, `"paper"`, `"lilac"`, `"night"`, or a partial palette object |
| `speed` | `1` | Playback speed. Also in Tweaks: ½×, 1×, 2×, 4×. |
| `autoApprove` | `false` | Skip the approval step |
| `crew` | `true` | Show the three crew members |
| `backdrop` | `"studio"` | `"studio"`, `"none"` (transparent), or your own node |
| `defaultPanelOpen` | `true` | Machine panel on wide windows |
| `height` / `minHeight` | `100svh` / `600` | Never a percentage |
| `onSend` | | `(prompt) => void` |
| `onFinish` | | `({ id, prompt, machine, outcome }) => void`, once per run |

### Machines

```ts
const machine: Machine = {
  name: "ShipRelease",
  maxVisits: 2,                 // per state, then the failure state (default 3)
  store: [
    { key: "releaseTag", kind: "set", value: "v4.12.0" },  // given up front
    { key: "testsGreen", kind: "observed" },               // read off the world
    { key: "failingSuite" },                               // written by the agent
  ],
  states: [
    { id: "RunTestMatrix", prompt: "…", writes: ["testsGreen"],
      when: [{ key: "testsGreen", to: "Ship" }], next: "TriageFailures",
      steps: [["$ ci run", "3 of 40 failed"], ["$ ci run", "40 of 40 passed"]],
      values: { testsGreen: [false, true] } },            // one value per visit
    { id: "TriageFailures", writes: ["failingSuite"], next: "RunTestMatrix" },
    { id: "Ship", final: true },
    { id: "RolledBack", final: true, outcome: "failure" },
  ],
}
```

The first state is the initial one. `when` exits are tried in order against the
store, and `next` is the fallback. `steps` and `values` can be flat lists, or
lists of lists for one entry per visit. A final state named like *Abandoned* or
*Failed* counts as a failure unless `outcome` says otherwise.

The engine is exported for your own use: `planMachine`, `machineName`,
`lintMachine`, `layoutMachine`, `machineSource`, `createRun`, `tick`,
`approve`, `decline`, `stop`, `resume`, `fastForward`, and the sample
`TODO_MACHINE`. They are pure functions, so `tick(run)` always gives the same
next run.

## Install notes

Self-contained: React is the only import, and there are no remote assets. The
studio, the crew and every icon are inline SVG. All CSS is in one scoped
`<style>` block under `.amc-`, and SVG ids come from `useId`, so two consoles on
one page do not collide.

`Inter` and `JetBrains Mono` are named with system fallbacks, not imported. If
the host does not load them, the layout stays the same.

`prefers-reduced-motion` turns off the spinners, pulses, the travelling edge
dot and the crew's animations. The run itself still plays.

Older browsers: `color-mix()` and `backdrop-filter` drop out quietly (hover
washes and the modal's blur), and the graph's travelling dot needs SMIL.
