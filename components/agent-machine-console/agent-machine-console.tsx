"use client"

import * as React from "react"

/**
 * Agent Machine Console
 *
 * A desktop workbench for an agent that turns a request into a small state
 * machine, waits for you to approve it, then runs it one state at a time.
 * Sessions sit on the left, the transcript in the middle and the machine on
 * the right: a live state graph, the state being worked on, and the store it
 * writes to. Three hand-drawn crew members keep watch from the sidebar and
 * react to whatever the run is doing.
 *
 * The run is simulated in the browser, so this works as a living mock-up or
 * as the shell for a real agent. Pass your own machines, or a `planner` that
 * writes one from the prompt.
 *
 * Self-contained: React is the only import. No CSS file, images, fonts or
 * icon package. The backdrop, the crew and every icon are inline SVG.
 */

// #region logic
export type StoreValue = string | number | boolean
export type StoreKind = "agent" | "observed" | "set"

export interface MachineStoreKey {
  key: string
  /** agent: the agent writes it. observed: read off the world, like a test run. set: given up front. */
  kind?: StoreKind
  /** Starting value. Only `set` keys start filled. */
  value?: StoreValue
}

export interface MachineWhen {
  /** Store key to test */
  key: string
  /** State to go to when the key is truthy */
  to: string
}

export interface MachineState {
  /** PascalCase name, unique within the machine */
  id: string
  /** The instruction the agent works from in this state */
  prompt?: string
  /** Store keys this state fills */
  writes?: string[]
  /** Conditional exits, tried in order */
  when?: MachineWhen[]
  /** Where to go when no `when` matches */
  next?: string
  /** A final state ends the run */
  final?: boolean
  /** For final states. Guessed from the name when left out: Abandoned, Failed and Cancelled are failures. */
  outcome?: "success" | "failure"
  /** Transcript lines streamed while the state runs. A list of lists gives one list per visit. */
  steps?: string[] | string[][]
  /** What the state writes. A list gives one value per visit. */
  values?: Record<string, StoreValue | StoreValue[]>
}

export interface Machine {
  name: string
  /** The first state is the initial one */
  states: MachineState[]
  store?: MachineStoreKey[]
  /** Visits a state gets before the run is sent to the failure state (default 3) */
  maxVisits?: number
  /** Extra warnings shown next to the authored machine */
  warnings?: string[]
}

export type RunPhase =
  | "draft"
  | "deciding"
  | "authored"
  | "awaiting"
  | "running"
  | "stopped"
  | "done"
  | "abandoned"
  | "declined"

export type RunEvent =
  | { kind: "note"; text: string }
  | { kind: "authored"; machine: string; warnings: string[] }
  | { kind: "waiting"; machine: string }
  | { kind: "approved"; machine: string; auto: boolean }
  | { kind: "executing"; machine: string; states: number }
  | { kind: "declined"; machine: string }
  | { kind: "enter"; state: string; visit: number }
  | { kind: "step"; state: string; text: string }
  | { kind: "write"; state: string; key: string; value: StoreValue }
  | { kind: "leave"; state: string; to: string; via: string }
  | { kind: "finish"; state: string; outcome: "done" | "abandoned" }
  | { kind: "stopped"; state: string | null }
  | { kind: "resumed"; state: string | null }

export interface Run {
  id: string
  prompt: string
  machine: Machine
  phase: RunPhase
  /** Phase a stopped run goes back to */
  resume: RunPhase | null
  events: RunEvent[]
  current: string | null
  visits: Record<string, number>
  store: Record<string, StoreValue>
  /** Position inside the current visit: its steps, then its writes, then the exit */
  cursor: number
  transitions: number
  edge: { from: string; to: string; via: string } | null
}

export const EMPTY_MACHINE: Machine = { name: "", states: [] }

export function hashString(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function pascal(word: string): string {
  return word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : ""
}

export function singular(word: string): string {
  if (word.length > 4 && /ies$/i.test(word)) return word.slice(0, -3) + "y"
  if (word.length > 3 && /[^s]s$/i.test(word)) return word.slice(0, -1)
  return word
}

const STOP = new Set(
  (
    "a an the and or but of for to in on at by with from into onto over under this that these those it its is are be " +
    "been was were will would should could can may might must i you we they he she me my our your their them us so " +
    "then than as if also just like want need please make sure using use via about after before while when where which " +
    "who what why how all any each every some more most other such only own same too very one two three four five six " +
    "seven eight nine ten first there here do does did done not no yes new way ways thing things kind kinds lot lots " +
    "time times week weeks day days"
  ).split(" "),
)

const FILLER = new Set(
  (
    "allows allow lets let renames rename prove proves passes pass recommend recommends run runs take taken takes keep " +
    "keeps get gets show shows include includes adding support supports represented recording record modifying " +
    "deleting creating viewing against called named"
  ).split(" "),
)

const VERBS = new Map<string, string>()
for (const [verb, words] of [
  ["Build", "build create make write implement scaffold add generate"],
  ["Fix", "fix debug repair patch resolve"],
  ["Research", "research investigate compare explore evaluate find"],
  ["Refactor", "refactor migrate upgrade port rewrite"],
  ["Summarize", "summarise summarize digest condense"],
  ["Draft", "draft plan outline propose"],
  ["Review", "review audit verify check"],
  ["Ship", "deploy ship release publish"],
]) {
  for (const w of words.split(" ")) VERBS.set(w, verb)
}

const SUBJECTS = new Set(
  (
    "cli tool app site website page api script bot dashboard report brief checklist doc readme test suite server " +
    "service database schema migration component library plugin extension game pipeline workflow summary memo " +
    "proposal spec email newsletter deck form widget endpoint job query"
  ).split(" "),
)

/** The three words a machine is named from: a verb, then what it acts on. */
export function nameParts(prompt: string): { verb: string; head: string; tail: string } {
  const tokens = prompt.match(/[A-Za-z][A-Za-z0-9]*/g) ?? []
  let verb = "Run"
  let verbAt = -1
  for (let i = 0; i < tokens.length; i++) {
    const v = VERBS.get(tokens[i].toLowerCase())
    if (v) {
      verb = v
      verbAt = i
      break
    }
  }
  const words = tokens
    .map((t, i) => ({ t, i, low: t.toLowerCase(), acr: /[A-Z]{2,}/.test(t) }))
    .filter((w) => w.i !== verbAt && !STOP.has(w.low) && !FILLER.has(w.low) && (w.t.length > 2 || w.acr))
  const tail = words.find((w) => SUBJECTS.has(singular(w.low))) ?? words[words.length - 1]
  const rest = words.filter((w) => w !== tail)
  const head = (tail && rest.find((w) => w.i === tail.i - 1)) || rest.find((w) => w.acr) || rest[0]
  return { verb, head: head ? singular(head.t) : "", tail: tail ? singular(tail.t) : "Task" }
}

export function machineName(prompt: string): string {
  const p = nameParts(prompt)
  return p.verb + pascal(p.head) + pascal(p.tail)
}

/** The default planner: a seven-state machine named after the request. */
export function planMachine(prompt: string): Machine {
  const { verb, head, tail } = nameParts(prompt)
  const T = pascal(tail) || "Task"
  const name = verb + pascal(head) + T
  const what = (head ? head.toLowerCase() + " " : "") + tail.toLowerCase()
  const file = (head ? head.toLowerCase() + "-" : "") + tail.toLowerCase()
  const brief = prompt.trim().replace(/\s+/g, " ")
  const quoted = "“" + (brief.length > 110 ? brief.slice(0, 108).trimEnd() + "…" : brief) + "”"
  const checks: boolean[] = hashString(brief) % 3 === 0 ? [true] : [false, true]

  if (verb === "Research" || verb === "Summarize" || verb === "Draft" || verb === "Review") {
    const draft = "Draft" + T
    const critique = "Critique" + T
    const revise = "Revise" + T
    const deliver = "Deliver" + T
    return {
      name,
      store: [
        { key: "sources" },
        { key: "draft" },
        { key: "revisionNotes" },
        { key: "meetsBrief", kind: "observed" },
        { key: "audience", kind: "set", value: "whoever asked" },
      ],
      states: [
        {
          id: "GatherSources",
          prompt:
            "Collect what the workspace already knows about " +
            quoted +
            " Record the useful material in sources. Quote it, do not paraphrase it.",
          writes: ["sources"],
          next: draft,
          steps: ["search the workspace for “" + what + "”", "read 9 documents, kept 5", "note two gaps worth flagging"],
          values: { sources: "5 documents: two runbooks, a postmortem, a dashboard export and a thread." },
        },
        {
          id: draft,
          prompt: "Write the " + what + " from sources for the audience. Lead with the answer and keep it to one page.",
          writes: ["draft"],
          next: critique,
          steps: ["outline: answer, evidence, next steps", "write " + file + ".md (480 words)"],
          values: { draft: file + ".md, 480 words in three sections." },
        },
        {
          id: critique,
          prompt:
            "Check the draft against the original request. Set meetsBrief only when every claim traces back to sources and the request is answered in full.",
          writes: ["meetsBrief"],
          when: [{ key: "meetsBrief", to: deliver }],
          next: revise,
          steps: [
            ["trace every claim back to sources", "two claims have no source", "brief not met yet"],
            ["trace every claim back to sources", "every claim has a source", "brief met"],
          ],
          values: { meetsBrief: checks },
        },
        {
          id: revise,
          prompt: "Fix what the critique found and record what changed in revisionNotes. Do not add new material.",
          writes: ["revisionNotes"],
          next: critique,
          steps: ["source one claim, cut the other", "tighten the opening paragraph"],
          values: { revisionNotes: "Sourced the latency claim, cut the unsourced cost estimate." },
        },
        {
          id: deliver,
          prompt: "Hand the " + what + " over where it was asked for, with the source list attached.",
          next: "Done",
          steps: ["attach the source list", "post " + file + ".md to the session"],
        },
        { id: "Done", final: true },
        { id: "Abandoned", final: true, outcome: "failure" },
      ],
    }
  }

  const act = (verb === "Fix" ? "Patch" : verb === "Refactor" ? "Restructure" : verb === "Ship" ? "Prepare" : "Implement") + T
  const verify = "Verify" + T
  const repair = "Repair" + T
  const show = (verb === "Ship" ? "Release" : "Demonstrate") + T
  return {
    name,
    store: [
      { key: "implementationPlan" },
      { key: "repairTarget" },
      { key: "checksPassed", kind: "observed" },
      { key: "scope", kind: "set", value: "this workspace only" },
    ],
    states: [
      {
        id: "InspectWorkspace",
        prompt:
          "Inspect the workspace for anything related to " +
          quoted +
          " Record a concrete plan in implementationPlan: what exists, what changes, and how it will be checked. Do not edit files.",
        writes: ["implementationPlan"],
        next: act,
        steps: ["$ ls -a", ".git  README.md  package.json  src", "read README.md", "nothing named " + what + " yet"],
        values: { implementationPlan: "Add src/" + file + ".ts with its own tests, check with npm test, and touch nothing outside scope." },
      },
      {
        id: act,
        prompt: "Carry out implementationPlan. Keep every change inside scope and leave the checks to verification.",
        next: verify,
        steps: ["write src/" + file + ".ts", "write src/" + file + ".test.ts", "wire it into src/index.ts"],
      },
      {
        id: verify,
        prompt: "Run the checks named in implementationPlan. Set checksPassed only when every one of them passes.",
        writes: ["checksPassed"],
        when: [{ key: "checksPassed", to: show }],
        next: repair,
        steps: [
          ["$ npm test", "4 passed, 1 failed: empty input", "1 of 5 checks failed"],
          ["$ npm test", "5 passed", "5 of 5 checks passed"],
        ],
        values: { checksPassed: checks },
      },
      {
        id: repair,
        prompt: "Read the failing check, record the smallest fix in repairTarget, apply it, and hand back to verification.",
        writes: ["repairTarget"],
        next: verify,
        steps: ["read the failing check", "patch: handle empty input before parsing"],
        values: { repairTarget: "src/" + file + ".ts let empty input reach the parser." },
      },
      {
        id: show,
        prompt: "Show the result working end to end, then write a short note on how to use it.",
        next: "Done",
        steps: ["$ npx " + file + " --help", "write NOTES.md: what changed and how to use it"],
      },
      { id: "Done", final: true },
      { id: "Abandoned", final: true, outcome: "failure" },
    ],
  }
}

export const TODO_PROMPT =
  "I would like you to create a CLI tool that allows for the recording of TODOs and tasks. The tool must support creating, deleting, modifying, and viewing TODOs, with “done” and “not done” statuses represented by a checkbox (checked or unchecked). Finally, use the tool to add tasks and run a simulation by adding the kind of activities a project manager would include."

export const TODO_MACHINE: Machine = {
  name: "BuildTodoCli",
  maxVisits: 3,
  store: [
    { key: "implementationPlan" },
    { key: "repairTarget" },
    { key: "verificationPassed", kind: "observed" },
    { key: "simulationDataDir", kind: "set", value: ".todo-simulation-data" },
  ],
  states: [
    {
      id: "InspectWorkspace",
      prompt:
        "Inspect the project workspace and the existing implementationPlan context. Record a concrete implementation plan in implementationPlan for a command-line TODO tool, including the project language, executable entry point, storage format, and how it will use .todo-simulation-data. Do not edit files.",
      writes: ["implementationPlan"],
      next: "ImplementCli",
      steps: ["$ ls -a", ".git  README.md  package.json", "read package.json: node 20, no dependencies", "no TODO code yet, and .todo-simulation-data is free"],
      values: {
        implementationPlan:
          "Node 20 script at bin/todo.js. One JSON file per list inside simulationDataDir. Commands: add, edit, rm, done, undo, ls.",
      },
    },
    {
      id: "ImplementCli",
      prompt:
        "Build the CLI described in implementationPlan. Support add, edit, rm, done, undo and ls, and render every TODO with a checkbox: [ ] for not done, [x] for done. Keep all data inside simulationDataDir.",
      next: "VerifyCli",
      steps: [
        "write bin/todo.js (142 lines)",
        "write lib/store.js: atomic writes into .todo-simulation-data",
        "$ chmod +x bin/todo.js",
        "add a bin entry for todo to package.json",
      ],
    },
    {
      id: "VerifyCli",
      prompt:
        "Run the CLI end to end against a scratch list: add, edit, mark done, undo, delete and list. Set verificationPassed only if every command exits 0 and the checkboxes render as specified.",
      writes: ["verificationPassed"],
      when: [{ key: "verificationPassed", to: "RunSimulation" }],
      next: "RepairCli",
      steps: [
        ["$ todo add “Smoke test”", "[ ] 1  Smoke test", "$ todo done 1", "TypeError: cannot read properties of undefined (reading “done”)", "1 of 6 checks failed"],
        ["$ todo add “Smoke test”", "[ ] 1  Smoke test", "$ todo done 1", "[x] 1  Smoke test", "$ todo undo 1 && todo rm 1", "6 of 6 checks passed"],
      ],
      values: { verificationPassed: [false, true] },
    },
    {
      id: "RepairCli",
      prompt:
        "Read the failing check, record the smallest fix in repairTarget, apply it, and hand back to verification. Do not touch commands that pass.",
      writes: ["repairTarget"],
      next: "VerifyCli",
      steps: ["read lib/store.js:41", "ids are 1-based on screen but 0-based in the file", "patch: resolve the id before toggling"],
      values: { repairTarget: "lib/store.js:41 looked up a 0-based index with the 1-based id from the screen." },
    },
    {
      id: "RunSimulation",
      prompt:
        "Use the tool the way a project manager would across a week: add the kickoff, stakeholder and delivery tasks, tick off what gets done, edit what changes, and leave the list in a believable state.",
      next: "Done",
      steps: [
        "$ todo add “Draft project charter”",
        "$ todo add “Book kickoff with stakeholders”",
        "$ todo add “Collect requirements from support”",
        "$ todo add “Write risk register”",
        "$ todo add “Set up weekly status email”",
        "$ todo done 1 && todo done 2",
        "$ todo edit 4 “Write risk register (owner: ops)”",
        "$ todo ls",
        "[x] 1  Draft project charter",
        "[x] 2  Book kickoff with stakeholders",
        "[ ] 3  Collect requirements from support",
        "[ ] 4  Write risk register (owner: ops)",
        "[ ] 5  Set up weekly status email",
      ],
    },
    { id: "Done", final: true },
    { id: "Abandoned", final: true, outcome: "failure" },
  ],
}

export function byId(m: Machine, id: string | null): MachineState | undefined {
  return id === null ? undefined : m.states.find((s) => s.id === id)
}

export function targets(s: MachineState): string[] {
  return [...(s.when ?? []).map((w) => w.to), ...(s.next ? [s.next] : [])]
}

export function outcomeOf(s: MachineState): "success" | "failure" {
  return s.outcome ?? (/abandon|fail|error|cancel|abort/i.test(s.id) ? "failure" : "success")
}

export function failureFinal(m: Machine): MachineState | undefined {
  return m.states.find((s) => s.final && outcomeOf(s) === "failure")
}

export function capOf(m: Machine): number {
  return Math.max(1, m.maxVisits ?? 3)
}

/** Every store key, declared or written, with its kind. */
export function storeKeys(m: Machine): { key: string; kind: StoreKind; value?: StoreValue }[] {
  const out: { key: string; kind: StoreKind; value?: StoreValue }[] = []
  const seen = new Set<string>()
  for (const k of m.store ?? []) {
    if (seen.has(k.key)) continue
    seen.add(k.key)
    out.push({ key: k.key, kind: k.kind ?? "agent", value: k.value })
  }
  for (const s of m.states) {
    for (const key of s.writes ?? []) {
      if (seen.has(key)) continue
      seen.add(key)
      out.push({ key, kind: "agent" })
    }
  }
  return out
}

export function normalizeMachine(m: Machine): Machine {
  const seen = new Set<string>()
  const states: MachineState[] = []
  for (const s of m.states ?? []) {
    if (!s || !s.id || seen.has(s.id)) continue
    seen.add(s.id)
    states.push(s)
  }
  return { ...m, name: m.name || "Machine", states }
}

export function reachable(m: Machine): Set<string> {
  const seen = new Set<string>()
  const queue = m.states.length ? [m.states[0].id] : []
  while (queue.length) {
    const id = queue.shift() as string
    if (seen.has(id)) continue
    seen.add(id)
    const s = byId(m, id)
    if (s && !s.final) for (const t of targets(s)) if (byId(m, t)) queue.push(t)
  }
  return seen
}

/** Edges that close a loop, found by a depth-first walk from the initial state. */
export function backEdges(m: Machine): [string, string][] {
  const out: [string, string][] = []
  const mark = new Map<string, number>()
  const walk = (id: string) => {
    mark.set(id, 1)
    const s = byId(m, id)
    if (s && !s.final) {
      for (const t of targets(s)) {
        if (!byId(m, t)) continue
        if (mark.get(t) === 1) out.push([id, t])
        else if (!mark.has(t)) walk(t)
      }
    }
    mark.set(id, 2)
  }
  if (m.states.length) walk(m.states[0].id)
  return out
}

export function lintMachine(m: Machine): string[] {
  const out = [...(m.warnings ?? [])]
  const fail = failureFinal(m)
  for (const s of m.states) {
    if (s.final) continue
    const ts = targets(s)
    for (const t of ts) if (!byId(m, t)) out.push(s.id + " points at " + t + ", which does not exist.")
    if (!ts.length) out.push(s.id + " has no way out, so the run stops there.")
  }
  if (m.states.length && !m.states.some((s) => s.final)) out.push("There is no final state, so only you can stop this run.")
  for (const [a, b] of backEdges(m)) {
    out.push(
      a + " → " + b + " can loop. Each state gets " + capOf(m) + " visits, then " +
        (fail ? "the run goes to " + fail.id : "the run is abandoned") + ".",
    )
  }
  const seen = reachable(m)
  for (const s of m.states) if (!seen.has(s.id) && s !== fail) out.push(s.id + " is never reached.")
  return out
}

export function truthy(v: StoreValue | undefined): boolean {
  if (typeof v === "boolean") return v
  if (typeof v === "number") return v > 0
  return typeof v === "string" && v !== "" && v !== "false"
}

export function formatValue(v: StoreValue | undefined): string {
  return v === undefined ? "—" : String(v)
}

export function stepsFor(s: MachineState, visit: number): string[] {
  const list = s.steps
  if (!list || !list.length) return []
  if (Array.isArray(list[0])) {
    const per = list as string[][]
    return per[Math.min(Math.max(visit, 1), per.length) - 1] ?? []
  }
  return list as string[]
}

export function valueFor(s: MachineState, key: string, visit: number, kind: StoreKind): StoreValue {
  const v = s.values ? s.values[key] : undefined
  if (Array.isArray(v)) return v.length ? v[Math.min(Math.max(visit, 1), v.length) - 1] : kind === "agent" ? "" : true
  if (v !== undefined) return v
  return kind === "agent" ? "Written in " + s.id + "." : true
}

/** Which state comes next, and why. */
export function route(
  m: Machine,
  s: MachineState,
  store: Record<string, StoreValue>,
  visits: Record<string, number>,
): { to: string | null; via: string } {
  let to: string | null = null
  let via = "otherwise"
  for (const w of s.when ?? []) {
    if (truthy(store[w.key])) {
      to = w.to
      via = w.key
      break
    }
  }
  if (!to) to = s.next ?? null
  const fail = failureFinal(m)
  const target = byId(m, to)
  if (!target) return { to: fail ? fail.id : null, via: "dead end" }
  if (!target.final && (visits[target.id] ?? 0) >= capOf(m)) return { to: fail ? fail.id : null, via: "visit cap" }
  return { to: target.id, via }
}

export function createRun(id: string, prompt: string, machine: Machine): Run {
  const store: Record<string, StoreValue> = {}
  for (const k of storeKeys(machine)) if (k.kind === "set" && k.value !== undefined) store[k.key] = k.value
  return {
    id,
    prompt,
    machine,
    phase: prompt ? "deciding" : "draft",
    resume: null,
    events: prompt ? [{ kind: "note", text: "Deciding whether this task needs a machine" }] : [],
    current: null,
    visits: {},
    store,
    cursor: 0,
    transitions: 0,
    edge: null,
  }
}

function enter(run: Run, id: string): Run {
  const visits = { ...run.visits, [id]: (run.visits[id] ?? 0) + 1 }
  const events: RunEvent[] = [...run.events, { kind: "enter", state: id, visit: visits[id] }]
  const s = byId(run.machine, id)
  if (s && s.final) {
    const outcome = outcomeOf(s) === "failure" ? "abandoned" : "done"
    return { ...run, visits, current: id, cursor: 0, phase: outcome, events: [...events, { kind: "finish", state: id, outcome }] }
  }
  return { ...run, visits, current: id, cursor: 0, events }
}

/** One beat of the run. Pure: the same run always produces the same next run. */
export function tick(run: Run): Run {
  const m = run.machine
  if (run.phase === "deciding") {
    return { ...run, phase: "authored", events: [...run.events, { kind: "authored", machine: m.name, warnings: lintMachine(m) }] }
  }
  if (run.phase === "authored") {
    return { ...run, phase: "awaiting", events: [...run.events, { kind: "waiting", machine: m.name }] }
  }
  if (run.phase !== "running") return run
  const s = byId(m, run.current)
  if (!s || s.final) return run
  const visit = run.visits[s.id] ?? 1
  const steps = stepsFor(s, visit)
  const writes = s.writes ?? []
  const c = run.cursor
  if (c < steps.length) {
    return { ...run, cursor: c + 1, events: [...run.events, { kind: "step", state: s.id, text: steps[c] }] }
  }
  if (c < steps.length + writes.length) {
    const key = writes[c - steps.length]
    const kind = storeKeys(m).find((k) => k.key === key)?.kind ?? "agent"
    const value = valueFor(s, key, visit, kind)
    return {
      ...run,
      cursor: c + 1,
      store: { ...run.store, [key]: value },
      events: [...run.events, { kind: "write", state: s.id, key, value }],
    }
  }
  const r = route(m, s, run.store, run.visits)
  const events: RunEvent[] = [...run.events, { kind: "leave", state: s.id, to: r.to ?? "", via: r.via }]
  if (!r.to) {
    return { ...run, phase: "abandoned", cursor: 0, events: [...events, { kind: "finish", state: s.id, outcome: "abandoned" }] }
  }
  return enter({ ...run, events, transitions: run.transitions + 1, edge: { from: s.id, to: r.to, via: r.via } }, r.to)
}

export function approve(run: Run, auto = false): Run {
  if (run.phase !== "awaiting") return run
  const first = run.machine.states[0]
  const events: RunEvent[] = [
    ...run.events,
    { kind: "approved", machine: run.machine.name, auto },
    { kind: "executing", machine: run.machine.name, states: run.machine.states.length },
  ]
  if (!first) return { ...run, phase: "done", events }
  return enter({ ...run, phase: "running", events }, first.id)
}

export function decline(run: Run): Run {
  if (run.phase !== "awaiting") return run
  return { ...run, phase: "declined", events: [...run.events, { kind: "declined", machine: run.machine.name }] }
}

export function stop(run: Run): Run {
  if (run.phase !== "deciding" && run.phase !== "authored" && run.phase !== "running") return run
  return { ...run, phase: "stopped", resume: run.phase, events: [...run.events, { kind: "stopped", state: run.current }] }
}

export function resume(run: Run): Run {
  if (run.phase !== "stopped") return run
  return { ...run, phase: run.resume ?? "running", resume: null, events: [...run.events, { kind: "resumed", state: run.current }] }
}

/** Tick (approving on the way) until `until` holds. */
export function fastForward(run: Run, until: (r: Run) => boolean, limit = 500): Run {
  let r = run
  for (let i = 0; i < limit && !until(r); i++) {
    const n = r.phase === "awaiting" ? approve(r) : tick(r)
    if (n === r) break
    r = n
  }
  return r
}

/** How long, in ms at 1x, before the run's next beat. */
export function beatDelay(run: Run): number {
  if (run.phase === "deciding") return 1500
  if (run.phase === "authored") return 900
  if (run.phase !== "running") return 600
  const s = byId(run.machine, run.current)
  if (!s) return 600
  const steps = stepsFor(s, run.visits[s.id] ?? 1)
  const writes = s.writes ?? []
  if (run.cursor === 0) return 1300
  if (run.cursor < steps.length) return 520 + Math.min(steps[run.cursor].length * 9, 520)
  if (run.cursor < steps.length + writes.length) return 750
  return 950
}

export interface SessionSeed {
  id?: string
  prompt: string
  machine?: Machine
  /** Where the session starts. Default: deciding, so it plays from the top. */
  status?: "deciding" | "awaiting" | "running" | "done"
  /** With status running: fast-forward to this state */
  at?: string
}

export function seedRun(id: string, seed: SessionSeed, plan: (prompt: string) => Machine): Run {
  const machine = normalizeMachine(seed.machine ?? (seed.prompt ? plan(seed.prompt) : EMPTY_MACHINE))
  const run = createRun(id, seed.prompt, machine)
  if (!seed.prompt) return run
  const status = seed.status ?? "deciding"
  if (status === "awaiting") return fastForward(run, (r) => r.phase === "awaiting")
  if (status === "done") return fastForward(run, (r) => r.phase === "done" || r.phase === "abandoned")
  if (status === "running") {
    const started = approve(fastForward(run, (r) => r.phase === "awaiting"))
    const at = seed.at
    return at ? fastForward(started, (r) => (r.current === at && r.cursor === 0) || r.phase !== "running") : started
  }
  return run
}

export interface GraphNode {
  id: string
  x: number
  y: number
  w: number
  h: number
  col: number
  final: boolean
  failure: boolean
}

export interface GraphEdge {
  from: string
  to: string
  kind: "next" | "when" | "cap"
  back: boolean
  d: string
}

export interface GraphLayout {
  nodes: GraphNode[]
  edges: GraphEdge[]
  width: number
  height: number
}

/** Columns by distance from the initial state, finals last; loops arc underneath. */
export function layoutMachine(
  m: Machine,
  size: { w: number; h: number; gapX: number; gapY: number } = { w: 66, h: 18, gapX: 14, gapY: 10 },
): GraphLayout {
  const { w, h, gapX, gapY } = size
  const padX = 14
  const padY = 10
  const depth = new Map<string, number>()
  const order: string[] = []
  if (m.states.length) {
    depth.set(m.states[0].id, 0)
    order.push(m.states[0].id)
  }
  for (let q = 0; q < order.length; q++) {
    const s = byId(m, order[q])
    if (!s || s.final) continue
    for (const t of targets(s)) {
      if (!depth.has(t) && byId(m, t)) {
        depth.set(t, (depth.get(s.id) ?? 0) + 1)
        order.push(t)
      }
    }
  }
  let last = 0
  for (const s of m.states) if (!s.final && depth.has(s.id)) last = Math.max(last, depth.get(s.id) ?? 0)
  const lost = m.states.filter((s) => !s.final && !depth.has(s.id))
  if (lost.length) last += 1
  for (const s of lost) {
    depth.set(s.id, last)
    order.push(s.id)
  }
  const finalCol = m.states.some((s) => !s.final) ? last + 1 : 0
  for (const s of m.states) {
    if (!s.final) continue
    depth.set(s.id, finalCol)
    if (!order.includes(s.id)) order.push(s.id)
  }
  const cols: string[][] = []
  for (const id of order) {
    const d = depth.get(id) ?? 0
    if (!cols[d]) cols[d] = []
    cols[d].push(id)
  }
  const fails = (id: string) => {
    const s = byId(m, id)
    return s && s.final && outcomeOf(s) === "failure" ? 1 : 0
  }
  if (cols[finalCol]) cols[finalCol].sort((a, b) => fails(a) - fails(b))

  const rows = Math.max(1, ...cols.map((c) => (c ? c.length : 0)))
  const block = rows * h + (rows - 1) * gapY
  const nodes: GraphNode[] = []
  cols.forEach((c, ci) => {
    if (!c) return
    const top = padY + (block - (c.length * h + (c.length - 1) * gapY)) / 2
    c.forEach((id, i) => {
      const s = byId(m, id) as MachineState
      nodes.push({
        id,
        x: padX + ci * (w + gapX),
        y: top + i * (h + gapY),
        w,
        h,
        col: ci,
        final: !!s.final,
        failure: !!s.final && outcomeOf(s) === "failure",
      })
    })
  })

  const at = (id: string) => nodes.find((n) => n.id === id)
  const r1 = (v: number) => Math.round(v * 10) / 10
  const bottom = padY + block
  let deepest = bottom
  const curve = (a: GraphNode, b: GraphNode, dip: number): string => {
    if (b.col > a.col) {
      const x1 = a.x + a.w
      const y1 = a.y + a.h / 2
      const x2 = b.x
      const y2 = b.y + b.h / 2
      const mx = (x1 + x2) / 2
      return "M" + r1(x1) + " " + r1(y1) + "C" + r1(mx) + " " + r1(y1) + " " + r1(mx) + " " + r1(y2) + " " + r1(x2) + " " + r1(y2)
    }
    const x1 = a.x + a.w * 0.4
    const x2 = b.x + b.w * 0.6
    deepest = Math.max(deepest, dip)
    return "M" + r1(x1) + " " + r1(a.y + a.h) + "C" + r1(x1) + " " + r1(dip) + " " + r1(x2) + " " + r1(dip) + " " + r1(x2) + " " + r1(b.y + b.h)
  }

  const edges: GraphEdge[] = []
  let loops = 0
  for (const s of m.states) {
    const a = at(s.id)
    if (!a || s.final) continue
    const outs = [
      ...(s.when ?? []).map((x) => ({ to: x.to, kind: "when" as const })),
      ...(s.next ? [{ to: s.next, kind: "next" as const }] : []),
    ]
    for (const o of outs) {
      const b = at(o.to)
      if (!b) continue
      const back = b.col <= a.col
      const dip = back ? bottom + h * 0.9 + 5 * (loops++ % 3) + 2 * Math.abs(a.col - b.col) : 0
      edges.push({ from: s.id, to: o.to, kind: o.kind, back, d: curve(a, b, dip) })
    }
  }
  const fail = failureFinal(m)
  const fb = fail ? at(fail.id) : undefined
  if (fb) {
    const from = new Set<string>()
    for (const [x, y] of backEdges(m)) {
      from.add(x)
      from.add(y)
    }
    for (const id of from) {
      const a = at(id)
      if (!a || a.col >= fb.col || edges.some((e) => e.from === id && e.to === fb.id)) continue
      edges.push({ from: id, to: fb.id, kind: "cap", back: false, d: curve(a, fb, 0) })
    }
  }
  const cols2 = Math.max(1, cols.length)
  return {
    nodes,
    edges,
    width: padX * 2 + cols2 * w + (cols2 - 1) * gapX,
    height: Math.ceil(Math.max(bottom + padY, deepest + 6)),
  }
}

export function wrapText(text: string, width: number): string[] {
  const lines: string[] = []
  let line = ""
  for (const word of text.split(/\s+/).filter(Boolean)) {
    if (line && (line + " " + word).length > width) {
      lines.push(line)
      line = word
    } else line = line ? line + " " + word : word
  }
  if (line) lines.push(line)
  return lines
}

/** The machine as a small, readable source file. */
export function machineSource(m: Machine): string {
  const out: string[] = ["machine " + m.name, "  max visits " + capOf(m), ""]
  const keys = storeKeys(m)
  if (keys.length) {
    out.push("store")
    for (const k of keys) {
      out.push("  " + (k.kind + "         ").slice(0, 9) + k.key + (k.value !== undefined ? " = " + JSON.stringify(k.value) : ""))
    }
    out.push("")
  }
  m.states.forEach((s, i) => {
    const kw = s.final ? "final" : i === 0 ? "initial" : "state"
    out.push(kw + " " + s.id + (s.final && outcomeOf(s) === "failure" ? " failure" : ""))
    if (s.writes && s.writes.length) out.push("  writes " + s.writes.join(", "))
    for (const w of s.when ?? []) out.push("  when " + w.key + " -> " + w.to)
    if (s.next) out.push("  otherwise -> " + s.next)
    if (s.prompt) {
      out.push("  prompt")
      for (const l of wrapText(s.prompt, 58)) out.push("    | " + l)
    }
    out.push("")
  })
  return out.join("\n").trimEnd() + "\n"
}

/** Text split into plain runs and code chips: anything in backticks, plus every store key named. */
export function splitCode(text: string, keys: string[]): { text: string; code: boolean }[] {
  const out: { text: string; code: boolean }[] = []
  const names = keys.filter((k) => /^[A-Za-z_]\w*$/.test(k)).sort((a, b) => b.length - a.length)
  const re = names.length ? new RegExp("\\b(?:" + names.join("|") + ")\\b", "g") : null
  text.split(/`([^`]+)`/).forEach((part, i) => {
    if (i % 2) {
      out.push({ text: part, code: true })
      return
    }
    let last = 0
    if (re) {
      for (const hit of part.matchAll(re)) {
        const at = hit.index ?? 0
        if (at > last) out.push({ text: part.slice(last, at), code: false })
        out.push({ text: hit[0], code: true })
        last = at + hit[0].length
      }
    }
    if (last < part.length) out.push({ text: part.slice(last), code: false })
  })
  return out
}

export function lineKind(text: string): "cmd" | "check" | "fail" | "pass" | "tool" | "out" {
  if (/^\$ /.test(text)) return "cmd"
  if (/^\[[ xX]\] /.test(text)) return "check"
  if (/\b(error|failed|not met|exit [1-9])\b/i.test(text) || /^\w*Error\b/.test(text)) return "fail"
  if (/\b(passed|met|ok)\b/i.test(text)) return "pass"
  if (/^(read|write|patch|search|note|outline|trace|attach|post|wire|add|source|tighten)\b/.test(text)) return "tool"
  return "out"
}
// #endregion logic

/* ------------------------------------------------------------------------ */
/* Theme                                                                     */
/* ------------------------------------------------------------------------ */

export type AgentConsoleThemeName = "sage" | "paper" | "lilac" | "night"

export interface AgentConsolePalette {
  /** The window */
  surface: string
  /** Lifted panels: the store, popovers */
  raised: string
  /** Code chips and pressed controls */
  sunk: string
  /** Graph nodes */
  node: string
  ink: string
  muted: string
  faint: string
  rule: string
  warn: string
  ok: string
  /** The crew's line work */
  crew: string
  crewFill: string
  /** The studio behind the window */
  wall: string
  grid: string
}

const THEMES: Record<AgentConsoleThemeName, AgentConsolePalette> = {
  sage: {
    surface: "#c0d8c8",
    raised: "#cde4d4",
    sunk: "#a9c4b2",
    node: "#93ab9a",
    ink: "#07170c",
    muted: "#3f5747",
    faint: "#5f7868",
    rule: "rgba(7, 23, 12, 0.13)",
    warn: "#8a5711",
    ok: "#1c6a3a",
    crew: "#5b5ea6",
    crewFill: "#aab4cb",
    wall: "#eceeef",
    grid: "#c6ccd1",
  },
  paper: {
    surface: "#ece5d6",
    raised: "#f5f0e5",
    sunk: "#ddd2bd",
    node: "#c8b998",
    ink: "#1c1812",
    muted: "#554b3c",
    faint: "#7d7260",
    rule: "rgba(28, 24, 18, 0.13)",
    warn: "#9a4a12",
    ok: "#2f6a2f",
    crew: "#b0452e",
    crewFill: "#e6c4ad",
    wall: "#f3f1ec",
    grid: "#d8d2c6",
  },
  lilac: {
    surface: "#d5d2ec",
    raised: "#e2e0f4",
    sunk: "#c1bce0",
    node: "#a9a3d0",
    ink: "#13112a",
    muted: "#46426a",
    faint: "#69658d",
    rule: "rgba(19, 17, 42, 0.13)",
    warn: "#8a4f12",
    ok: "#2d6a4a",
    crew: "#2f6b52",
    crewFill: "#b6d3c3",
    wall: "#efeef4",
    grid: "#cfcde0",
  },
  night: {
    surface: "#17211b",
    raised: "#1e2b23",
    sunk: "#2a3a30",
    node: "#34473b",
    ink: "#e2eee5",
    muted: "#a6bcad",
    faint: "#7d9586",
    rule: "rgba(226, 238, 229, 0.12)",
    warn: "#e3b25e",
    ok: "#7fd39a",
    crew: "#aeb2f2",
    crewFill: "#3b406f",
    wall: "#0e1113",
    grid: "#262c31",
  },
}

const THEME_NAMES: AgentConsoleThemeName[] = ["sage", "paper", "lilac", "night"]

function isDark(color: string): boolean {
  const m = color.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)
  if (!m) return false
  const hex = m[1].length === 3 ? m[1].replace(/./g, (c) => c + c) : m[1]
  const n = parseInt(hex, 16)
  return 0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255) < 110
}

/* ------------------------------------------------------------------------ */
/* Styles: every selector is scoped under .amc-                              */
/* ------------------------------------------------------------------------ */

const AMC_CSS = `
.amc-root {
  --amc-sans: "Inter", "Helvetica Neue", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
  --amc-mono: "JetBrains Mono", "IBM Plex Mono", "SF Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  --amc-ease: cubic-bezier(0.2, 0.8, 0.2, 1);
  position: relative;
  width: 100%;
  height: var(--amc-h);
  min-height: var(--amc-minh);
  overflow: hidden;
  isolation: isolate;
  background: var(--amc-wall);
  color: var(--amc-ink);
  font-family: var(--amc-sans);
  font-size: 14px;
  line-height: 1.45;
  text-align: left;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
.amc-root.amc-bare { background: transparent; }
.amc-root *, .amc-root *::before, .amc-root *::after { box-sizing: border-box; }
.amc-root :where(button) {
  appearance: none;
  -webkit-appearance: none;
  background: none;
  border: 0;
  margin: 0;
  padding: 0;
  font: inherit;
  color: inherit;
  letter-spacing: inherit;
  text-align: inherit;
  cursor: pointer;
}
.amc-root :where(button:disabled) { cursor: default; }
.amc-root :where(h2, h3, p, ul, li, dl, dt, dd, pre) { margin: 0; padding: 0; }
.amc-root :where(ul) { list-style: none; }
.amc-root :where(button, textarea, [tabindex]):focus-visible { outline: 2px solid var(--amc-ink); outline-offset: 2px; }
.amc-svg { display: block; max-width: none; flex: none; overflow: visible; }

/* ---- backdrop ------------------------------------------------------------ */
.amc-backdrop { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 0; pointer-events: none; }
.amc-backdrop-slot { position: absolute; inset: 0; z-index: 0; }

/* ---- the window ---------------------------------------------------------- */
.amc-win {
  --amc-sbw: 0px;
  --amc-pnw: 0px;
  position: absolute;
  left: 50%;
  top: 50%;
  z-index: 1;
  width: min(1240px, calc(100% - 48px));
  height: min(800px, calc(100% - 48px));
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 14px;
  background: var(--amc-surface);
  color: var(--amc-ink);
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.3),
    0 2px 6px rgba(15, 25, 20, 0.08),
    0 42px 90px -28px rgba(15, 25, 20, 0.5);
  transform: translate(-50%, -50%);
  transition:
    width 0.5s var(--amc-ease),
    height 0.5s var(--amc-ease),
    border-radius 0.5s var(--amc-ease),
    transform 0.5s var(--amc-ease),
    opacity 0.35s ease,
    visibility 0s linear 0s;
}
.amc-win:not(.amc-ready), .amc-win:not(.amc-ready) * { transition: none !important; }
.amc-win.amc-sb-on { --amc-sbw: 236px; }
.amc-win.amc-pn-on { --amc-pnw: 340px; }
.amc-win.amc-tiny { --amc-sbw: 0px; }
.amc-win.amc-narrow { --amc-pnw: 0px; }
.amc-win.amc-tiny { width: calc(100% - 20px); height: calc(100% - 20px); }
.amc-max .amc-win { width: calc(100% - 16px); height: calc(100% - 16px); border-radius: 10px; }
.amc-gone .amc-win, .amc-mini .amc-win {
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition:
    width 0.5s var(--amc-ease),
    height 0.5s var(--amc-ease),
    transform 0.5s var(--amc-ease),
    opacity 0.35s ease,
    visibility 0s linear 0.5s;
}
.amc-gone .amc-win { transform: translate(-50%, -47%) scale(0.96); }
.amc-mini .amc-win { transform: translate(-50%, 34%) scale(0.16); }

/* ---- title bar ----------------------------------------------------------- */
.amc-bar {
  position: relative;
  flex: none;
  height: 46px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 12px 0 16px;
}
.amc-lights { display: flex; gap: 8px; margin-right: 6px; }
.amc-light {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: rgba(0, 0, 0, 0.55);
  box-shadow: inset 0 0 0 0.5px rgba(0, 0, 0, 0.22);
}
.amc-light-r { background: #ff5f57; }
.amc-light-y { background: #febc2e; }
.amc-light-g { background: #28c840; }
.amc-light svg { opacity: 0; transition: opacity 0.15s ease; }
.amc-lights:hover .amc-light svg, .amc-lights:focus-within .amc-light svg { opacity: 1; }
.amc-iconbtn {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  color: var(--amc-ink);
  transition: background-color 0.2s ease, transform 0.3s var(--amc-ease);
}
.amc-iconbtn:hover { background-color: var(--amc-rule); }
.amc-back svg { transition: transform 0.45s var(--amc-ease); }
.amc-win:not(.amc-sb-on) .amc-back svg { transform: rotate(180deg); }
.amc-crumbs {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  font-family: var(--amc-mono);
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  white-space: nowrap;
}
.amc-crumbs b { font-weight: 800; color: var(--amc-ink); }
.amc-crumbs i { font-style: normal; color: var(--amc-faint); }
.amc-crumbs span { color: var(--amc-muted); overflow: hidden; text-overflow: ellipsis; }
.amc-grow { flex: 1; min-width: 8px; }
.amc-bar-status {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  max-width: 34%;
  margin-right: 6px;
  font-family: var(--amc-mono);
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}
.amc-bar-status span:last-child { overflow: hidden; text-overflow: ellipsis; }
.amc-panelbtn { border-radius: 50%; width: 30px; height: 30px; }
.amc-panelbtn[aria-pressed="true"] { background: var(--amc-ink); color: var(--amc-surface); }
.amc-panelbtn[aria-pressed="true"]:hover { background: var(--amc-ink); transform: scale(1.06); }
.amc-tweakbtn[aria-expanded="true"] { background: var(--amc-sunk); }

/* ---- status marks -------------------------------------------------------- */
.amc-spin {
  display: inline-block;
  flex: none;
  width: 11px;
  height: 11px;
  border-radius: 50%;
  border: 1.6px solid currentColor;
  border-right-color: transparent;
  animation: amc-rot 0.9s linear infinite;
}
.amc-mark { display: inline-grid; place-items: center; flex: none; width: 11px; height: 11px; }
.amc-mark-wait::before { content: ""; width: 7px; height: 7px; border-radius: 50%; background: var(--amc-warn); animation: amc-blink 1.4s ease-in-out infinite; }
.amc-mark-idle::before { content: ""; width: 8px; height: 8px; border-radius: 50%; border: 1.5px solid var(--amc-faint); }
.amc-mark-ok { color: var(--amc-ok); }
.amc-mark-bad { color: var(--amc-warn); }

/* ---- body grid ----------------------------------------------------------- */
.amc-body {
  position: relative;
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: var(--amc-sbw) minmax(0, 1fr) var(--amc-pnw);
  grid-template-rows: minmax(0, 1fr);
  transition: grid-template-columns 0.45s var(--amc-ease);
}
.amc-cap {
  font-family: var(--amc-mono);
  font-size: 10px;
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--amc-muted);
}
.amc-link { color: var(--amc-ink); font-weight: 700; border-radius: 3px; transition: opacity 0.2s ease; }
.amc-link:hover { opacity: 0.6; }
.amc-mono-b { font-family: var(--amc-mono); font-weight: 800; font-size: 12.5px; color: var(--amc-ink); }

/* ---- sidebar ------------------------------------------------------------- */
.amc-side {
  grid-column: 1;
  grid-row: 1;
  display: flex;
  min-width: 0;
  overflow: hidden;
  border-right: 1px solid var(--amc-rule);
}
.amc-win:not(.amc-sb-on) .amc-side { border-right-color: transparent; }
.amc-side-in { position: relative; flex: none; width: 236px; display: flex; flex-direction: column; min-height: 0; }
.amc-side-head { display: flex; align-items: center; justify-content: space-between; padding: 14px 12px 10px 20px; }
.amc-sessions { flex: 1; min-height: 0; overflow-y: auto; scrollbar-width: thin; scrollbar-color: var(--amc-rule) transparent; padding-bottom: 8px; }
.amc-sess { position: relative; }
.amc-sess-btn {
  display: block;
  width: 100%;
  padding: 9px 34px 10px 18px;
  border-left: 2px solid transparent;
  transition: background-color 0.2s ease, border-color 0.2s ease;
}
.amc-sess-btn:hover { background-color: color-mix(in srgb, var(--amc-ink) 5%, transparent); }
.amc-sess-on .amc-sess-btn { border-left-color: var(--amc-ink); }
.amc-sess-title {
  display: block;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--amc-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.amc-sess-on .amc-sess-title { font-weight: 700; }
.amc-sess-status {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
  font-family: var(--amc-mono);
  font-size: 11px;
  font-weight: 700;
  color: var(--amc-ink);
  white-space: nowrap;
  overflow: hidden;
}
.amc-sess-status span:last-child { overflow: hidden; text-overflow: ellipsis; }
.amc-sess-x {
  position: absolute;
  right: 8px;
  top: 9px;
  width: 22px;
  height: 22px;
  border-radius: 6px;
  display: grid;
  place-items: center;
  color: var(--amc-faint);
  opacity: 0;
  transition: opacity 0.2s ease, background-color 0.2s ease;
}
.amc-sess:hover .amc-sess-x, .amc-sess-x:focus-visible { opacity: 1; }
.amc-sess-x:hover { background: var(--amc-rule); color: var(--amc-ink); }

/* ---- the crew ------------------------------------------------------------ */
.amc-crew { position: relative; flex: none; display: flex; align-items: flex-end; gap: 6px; padding: 10px 16px 16px; }
.amc-fig { display: block; border-radius: 8px; transition: transform 0.3s var(--amc-ease); }
.amc-fig:hover { transform: translateY(-3px); }
.amc-fig .amc-svg { width: 40px; height: 64px; }
.amc-fig-body { transform-origin: 20px 61px; animation: amc-breathe 4.2s ease-in-out infinite; }
.amc-fig:nth-of-type(2) .amc-fig-body { animation-delay: -1.4s; }
.amc-fig:nth-of-type(3) .amc-fig-body { animation-delay: -2.8s; }
.amc-orb { transition: fill 0.3s ease; }
.amc-spark { opacity: 0; transform-origin: 35px 5px; }
.amc-mood-authoring .amc-orb { animation: amc-orb 1.1s ease-in-out infinite; }
.amc-mood-authoring .amc-spark { animation: amc-twinkle 1.1s ease-in-out infinite; }
.amc-glyph { transform-origin: 20px 12.5px; }
.amc-glyph-pulse { animation: amc-glyph 0.9s ease-out; }
.amc-mood-waiting .amc-glyph { animation: amc-blink 1.6s ease-in-out infinite; }
.amc-wing-l { transform-origin: 17px 32px; }
.amc-wing-r { transform-origin: 23px 32px; }
.amc-mood-verifying .amc-wing-l { animation: amc-flap-l 0.42s ease-in-out infinite alternate; }
.amc-mood-verifying .amc-wing-r { animation: amc-flap-r 0.42s ease-in-out infinite alternate; }
.amc-mood-done .amc-fig-body { animation: amc-hop 0.7s cubic-bezier(0.3, 1.6, 0.5, 1) 2; }
.amc-mood-done .amc-fig:nth-of-type(2) .amc-fig-body { animation-delay: 0.12s; }
.amc-mood-done .amc-fig:nth-of-type(3) .amc-fig-body { animation-delay: 0.24s; }
.amc-mood-down .amc-fig-body { animation: none; transform: translateY(1px) rotate(-3deg); opacity: 0.78; }
.amc-mood-down .amc-lid { transform: scaleY(1); }
.amc-lid { transform-origin: 20px 18.9px; transform: scaleY(0); transition: transform 0.3s ease; }
.amc-say {
  position: absolute;
  left: 14px;
  right: 14px;
  bottom: calc(100% - 4px);
  padding: 9px 11px 10px;
  border-radius: 10px;
  background: var(--amc-raised);
  box-shadow: 0 0 0 1px var(--amc-rule), 0 12px 28px -14px rgba(0, 0, 0, 0.35);
  font-size: 12px;
  line-height: 1.45;
  animation: amc-pop 0.3s var(--amc-ease) both;
}
.amc-say b { display: block; margin-bottom: 2px; font-family: var(--amc-mono); font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--amc-crew); }
.amc-say::after {
  content: "";
  position: absolute;
  bottom: -5px;
  left: var(--amc-say-x, 30px);
  width: 10px;
  height: 10px;
  background: var(--amc-raised);
  transform: rotate(45deg);
  box-shadow: 1px 1px 0 var(--amc-rule);
}

/* ---- main column --------------------------------------------------------- */
.amc-main { grid-column: 2; grid-row: 1; display: flex; flex-direction: column; min-width: 0; min-height: 0; }
.amc-scroll {
  flex: 1;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  padding: 20px clamp(18px, 5%, 40px) 28px;
  scrollbar-width: thin;
  scrollbar-color: var(--amc-rule) transparent;
  -webkit-mask-image: linear-gradient(to bottom, transparent 0, #000 22px);
  mask-image: linear-gradient(to bottom, transparent 0, #000 22px);
}
.amc-scroll:focus { outline: none; }
.amc-thread { max-width: 720px; }
.amc-ask {
  margin: 8px 0 22px;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.34;
  letter-spacing: -0.012em;
  color: var(--amc-ink);
  overflow-wrap: anywhere;
}
.amc-tiny .amc-ask { font-size: 17px; }
.amc-log { margin: 13px 0; font-size: 12px; line-height: 1.5; color: var(--amc-faint); animation: amc-in 0.4s ease both; }
.amc-kv { display: flex; flex-wrap: wrap; align-items: baseline; column-gap: 16px; row-gap: 4px; margin: 13px 0; animation: amc-in 0.4s ease both; }
.amc-warnbtn { color: var(--amc-warn); }
.amc-warnbtn:hover { opacity: 0.7; }
.amc-okc { color: var(--amc-ok); }
.amc-badc { color: var(--amc-warn); }
.amc-warns { margin: -4px 0 14px; padding: 10px 12px; border-radius: 8px; background: color-mix(in srgb, var(--amc-warn) 10%, transparent); font-size: 12.5px; line-height: 1.5; color: var(--amc-ink); animation: amc-in 0.3s ease both; }
.amc-warns li + li { margin-top: 4px; }
.amc-warns li::before { content: "!"; display: inline-block; width: 16px; font-family: var(--amc-mono); font-weight: 800; color: var(--amc-warn); }
.amc-dots i { font-style: normal; }
.amc-dots-live i { animation: amc-blink 1.2s ease-in-out infinite; }
.amc-dots-live i:nth-child(2) { animation-delay: 0.2s; }
.amc-dots-live i:nth-child(3) { animation-delay: 0.4s; }

.amc-hr { height: 1px; margin: 22px 0 16px; background: var(--amc-ink); opacity: 0.85; }
.amc-state { animation: amc-in 0.45s ease both; }
.amc-state-name {
  margin: 6px 0 10px;
  font-size: 34px;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.028em;
  color: var(--amc-ink);
  overflow-wrap: anywhere;
}
.amc-tiny .amc-state-name { font-size: 27px; }
.amc-instr { font-size: 14px; line-height: 1.62; color: var(--amc-ink); opacity: 0.84; }
.amc-instr-clamp { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.amc-chip {
  padding: 1px 5px;
  border-radius: 3px;
  background: var(--amc-sunk);
  font-family: var(--amc-mono);
  font-size: 0.86em;
  font-weight: 700;
  color: var(--amc-ink);
  -webkit-box-decoration-break: clone;
  box-decoration-break: clone;
}
.amc-more { display: inline-block; margin-top: 9px; }

.amc-steps { display: flex; flex-direction: column; gap: 5px; margin-top: 16px; font-family: var(--amc-mono); font-size: 12px; line-height: 1.5; }
.amc-step { display: flex; gap: 9px; min-width: 0; color: var(--amc-muted); animation: amc-in 0.35s ease both; overflow-wrap: anywhere; }
.amc-step-cmd { color: var(--amc-ink); font-weight: 700; }
.amc-step-cmd .amc-pr { color: var(--amc-faint); font-weight: 400; }
.amc-step-tool b { color: var(--amc-ink); font-weight: 700; }
.amc-step-fail { color: var(--amc-warn); font-weight: 700; }
.amc-step-pass { color: var(--amc-ok); font-weight: 700; }
.amc-step-write { color: var(--amc-ink); }
.amc-step-write em { font-style: normal; color: var(--amc-faint); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
.amc-step-note { font-family: var(--amc-sans); color: var(--amc-faint); }
.amc-glyphs { flex: none; width: 14px; color: var(--amc-faint); text-align: center; }
.amc-check { display: flex; align-items: center; gap: 9px; padding: 1px 0; color: var(--amc-ink); border-radius: 4px; }
.amc-box {
  flex: none;
  width: 14px;
  height: 14px;
  display: grid;
  place-items: center;
  border-radius: 3px;
  border: 1.5px solid var(--amc-ink);
  color: var(--amc-surface);
  transition: background-color 0.2s ease;
}
.amc-check[aria-checked="true"] .amc-box { background: var(--amc-ink); }
.amc-check[aria-checked="true"] .amc-check-t { text-decoration: line-through; text-decoration-thickness: 1px; color: var(--amc-faint); }
.amc-check-n { color: var(--amc-faint); }
.amc-working { display: flex; gap: 4px; margin-top: 12px; height: 8px; align-items: center; }
.amc-working i { width: 5px; height: 5px; border-radius: 50%; background: var(--amc-faint); animation: amc-blink 1s ease-in-out infinite; }
.amc-working i:nth-child(2) { animation-delay: 0.15s; }
.amc-working i:nth-child(3) { animation-delay: 0.3s; }

.amc-past { border-top: 1px solid var(--amc-rule); animation: amc-in 0.4s ease both; }
.amc-past:first-of-type { margin-top: 18px; }
.amc-past-row {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 2px;
  font-family: var(--amc-mono);
  font-size: 12px;
  color: var(--amc-ink);
}
.amc-past-row > b { font-weight: 800; }
.amc-past-meta { flex: 1; min-width: 0; color: var(--amc-faint); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.amc-past-mark { color: var(--amc-ok); }
.amc-past-mark.amc-badc { color: var(--amc-warn); }
.amc-past-row .amc-chev { color: var(--amc-faint); transform: rotate(180deg); transition: transform 0.3s var(--amc-ease); }
.amc-past-row[aria-expanded="true"] .amc-chev { transform: rotate(270deg); }
.amc-past .amc-steps { margin: 0 0 12px 22px; }

.amc-final-sum { font-size: 14px; line-height: 1.6; color: var(--amc-ink); opacity: 0.84; max-width: 560px; }
.amc-stats { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
.amc-stat { padding: 7px 11px; border-radius: 8px; background: var(--amc-raised); font-family: var(--amc-mono); font-size: 11px; color: var(--amc-muted); }
.amc-stat b { display: block; font-size: 18px; font-weight: 800; color: var(--amc-ink); letter-spacing: -0.02em; }
.amc-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 18px; }
.amc-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 32px;
  padding: 0 14px;
  border-radius: 999px;
  background: var(--amc-ink);
  color: var(--amc-surface);
  font-family: var(--amc-mono);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  white-space: nowrap;
  transition: transform 0.25s var(--amc-ease), opacity 0.2s ease;
}
.amc-btn:hover { transform: translateY(-1px); }
.amc-btn:active { transform: none; opacity: 0.85; }
.amc-btn-ghost { background: transparent; color: var(--amc-ink); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--amc-ink) 35%, transparent); }

.amc-empty { padding-top: 6px; animation: amc-in 0.4s ease both; }
.amc-empty-sub { max-width: 520px; font-size: 14px; line-height: 1.6; color: var(--amc-muted); }
.amc-sugs { display: flex; flex-direction: column; gap: 8px; margin-top: 22px; max-width: 560px; }
.amc-sug {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 10px;
  background: color-mix(in srgb, var(--amc-raised) 70%, transparent);
  box-shadow: inset 0 0 0 1px var(--amc-rule);
  font-size: 13px;
  line-height: 1.45;
  color: var(--amc-ink);
  transition: background-color 0.2s ease, transform 0.25s var(--amc-ease);
}
.amc-sug span { flex: 1; }
.amc-sug:hover { background: var(--amc-raised); transform: translateX(3px); }

/* ---- composer ------------------------------------------------------------ */
.amc-composer { flex: none; padding: 0 clamp(18px, 5%, 40px) 12px; }
.amc-crow {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 58px;
  padding: 10px 0;
  border-bottom: 1px solid var(--amc-rule);
}
.amc-crow-text { flex: 1; min-width: 0; font-size: 15px; color: var(--amc-ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.amc-stop { width: 30px; height: 30px; border-radius: 8px; display: grid; place-items: center; transition: background-color 0.2s ease; }
.amc-stop:hover { background: var(--amc-rule); }
.amc-stop i { width: 12px; height: 12px; border-radius: 2px; background: var(--amc-ink); }
.amc-input {
  flex: 1;
  min-width: 0;
  height: 26px;
  max-height: 140px;
  resize: none;
  border: 0;
  outline: none;
  background: transparent;
  color: var(--amc-ink);
  font-family: var(--amc-sans);
  font-size: 15px;
  line-height: 1.6;
  padding: 0;
  margin: 0;
}
.amc-input::placeholder { color: var(--amc-faint); opacity: 1; }
.amc-send {
  flex: none;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: var(--amc-ink);
  color: var(--amc-surface);
  transition: opacity 0.2s ease, transform 0.25s var(--amc-ease);
}
.amc-send:disabled { opacity: 0.28; }
.amc-send:not(:disabled):hover { transform: translateY(-2px); }
.amc-foot {
  display: flex;
  gap: 22px;
  padding-top: 10px;
  font-family: var(--amc-mono);
  font-size: 10.5px;
  color: var(--amc-faint);
  white-space: nowrap;
}
.amc-foot span:last-child { min-width: 0; overflow: hidden; text-overflow: ellipsis; }

/* ---- machine panel ------------------------------------------------------- */
.amc-panel { grid-column: 3; grid-row: 1; display: flex; min-width: 0; overflow: hidden; border-left: 1px solid var(--amc-rule); }
.amc-win:not(.amc-pn-on) .amc-panel { border-left-color: transparent; }
.amc-panel-in {
  flex: none;
  width: 340px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--amc-rule) transparent;
}
.amc-sec { padding: 0 22px; }
.amc-ph { display: flex; align-items: center; gap: 10px; padding: 14px 12px 6px 22px; }
.amc-ph .amc-cap:first-child { flex: 1; }
.amc-ph-status { display: flex; align-items: center; gap: 7px; color: var(--amc-ink); font-weight: 700; }
.amc-graph-wrap { padding: 8px 10px 4px 8px; min-height: 92px; display: flex; align-items: center; }
.amc-graph { width: 100%; height: auto; }
.amc-edge { fill: none; stroke: var(--amc-ink); stroke-opacity: 0.3; stroke-width: 0.9; transition: stroke-opacity 0.4s ease; }
.amc-edge-cap { stroke-dasharray: 2 2.5; stroke-opacity: 0.2; }
.amc-edge-on { stroke-opacity: 0.75; stroke-width: 1.15; }
.amc-arrow { fill: var(--amc-ink); fill-opacity: 0.4; }
.amc-arrow-on { fill-opacity: 0.8; }
.amc-init { fill: var(--amc-ink); }
.amc-node { cursor: pointer; }
.amc-node:focus-visible { outline: none; }
.amc-node-box { fill: var(--amc-node); stroke: var(--amc-ink); stroke-opacity: 0; stroke-width: 1; transition: fill 0.35s ease, stroke-opacity 0.35s ease; }
.amc-node-t { font-family: var(--amc-mono); font-weight: 700; fill: var(--amc-ink); pointer-events: none; }
.amc-node-final .amc-node-box { fill: var(--amc-raised); stroke-opacity: 0.7; }
.amc-node-seen .amc-node-box { stroke-opacity: 0.55; }
.amc-node-cur .amc-node-box { fill: var(--amc-ink); stroke-opacity: 1; }
.amc-node-cur .amc-node-t { fill: var(--amc-surface); }
.amc-node:hover .amc-node-box, .amc-node:focus-visible .amc-node-box { stroke-opacity: 1; stroke-width: 1.4; }
.amc-node-sel .amc-node-box { stroke-dasharray: 3 2; stroke-opacity: 1; stroke-width: 1.3; }
.amc-node-pulse { fill: none; stroke: var(--amc-ink); stroke-width: 1; transform-box: fill-box; transform-origin: center; animation: amc-ring 1.6s ease-out infinite; }
.amc-travel { fill: var(--amc-ink); animation: amc-travel 0.85s ease forwards; }
.amc-skel rect { fill: none; stroke: var(--amc-ink); stroke-opacity: 0.35; stroke-dasharray: 3 3; }
.amc-skel-live rect { animation: amc-blink 1.2s ease-in-out infinite; }
.amc-skel-live rect:nth-child(2) { animation-delay: 0.15s; }
.amc-skel-live rect:nth-child(3) { animation-delay: 0.3s; }
.amc-skel-live rect:nth-child(4) { animation-delay: 0.45s; }
.amc-gcap { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; padding: 6px 22px 18px; }
.amc-gcap .amc-mono-b { font-size: 14px; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.amc-gcap .amc-link { flex: none; }
.amc-rule { height: 1px; margin: 0 22px; background: var(--amc-rule); }
.amc-cur { padding: 16px 22px 20px; }
.amc-cur-head { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
.amc-pstate { margin: 8px 0 6px; font-size: 24px; font-weight: 700; line-height: 1.15; letter-spacing: -0.024em; overflow-wrap: anywhere; }
.amc-dl { display: grid; grid-template-columns: 92px minmax(0, 1fr); row-gap: 7px; margin: 14px 0 16px; align-items: baseline; }
.amc-dl dd { font-family: var(--amc-mono); font-size: 12px; font-weight: 700; color: var(--amc-ink); overflow-wrap: anywhere; }
.amc-ptext { margin-top: 7px; font-size: 12.5px; line-height: 1.6; color: var(--amc-ink); opacity: 0.86; }
.amc-store { flex: 1 0 auto; padding: 16px 22px 22px; background: var(--amc-raised); }
.amc-store-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 8px; }
.amc-legend { display: flex; gap: 10px; }
.amc-legend span { display: inline-flex; align-items: center; gap: 4px; }
.amc-mk { display: inline-block; flex: none; width: 7px; height: 7px; background: var(--amc-ink); }
.amc-mk-agent { border-radius: 50%; }
.amc-mk-observed { border-radius: 1px; }
.amc-mk-set { border-radius: 50%; background: transparent; box-shadow: inset 0 0 0 1.5px var(--amc-ink); }
.amc-srow { border-bottom: 1px solid var(--amc-rule); }
.amc-srow:last-child { border-bottom: 0; }
.amc-srow-btn { display: flex; align-items: center; gap: 10px; width: 100%; padding: 10px 0; font-family: var(--amc-mono); font-size: 12px; }
.amc-srow-btn > b { font-weight: 800; color: var(--amc-ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }
.amc-sval { flex: 1; min-width: 0; text-align: right; color: var(--amc-faint); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.amc-sval-true { color: var(--amc-ok); font-weight: 800; }
.amc-sval-false { color: var(--amc-warn); font-weight: 800; }
.amc-sval-new { animation: amc-flash 1.3s ease; }
.amc-sfull { padding: 0 0 12px 17px; font-size: 12px; line-height: 1.55; color: var(--amc-muted); overflow-wrap: anywhere; animation: amc-in 0.3s ease both; }
.amc-none { padding: 6px 22px 24px; font-size: 12.5px; line-height: 1.55; color: var(--amc-faint); }

/* ---- drawers below the breakpoints --------------------------------------- */
.amc-scrim { position: absolute; inset: 0; z-index: 5; background: rgba(0, 0, 0, 0.16); opacity: 0; pointer-events: none; transition: opacity 0.3s ease; }
.amc-scrim-on { opacity: 1; pointer-events: auto; }
.amc-tiny .amc-side, .amc-narrow .amc-panel {
  position: absolute;
  top: 0;
  bottom: 0;
  z-index: 6;
  background: var(--amc-surface);
  transition: transform 0.42s var(--amc-ease);
}
.amc-tiny .amc-side { left: 0; width: min(272px, 86%); grid-column: auto; grid-row: auto; border-right: 1px solid var(--amc-rule); box-shadow: 30px 0 60px -34px rgba(0, 0, 0, 0.5); transform: translateX(-104%); }
.amc-tiny .amc-side-in { width: 100%; }
.amc-tiny.amc-sb-on .amc-side { transform: none; }
.amc-narrow .amc-panel { right: 0; width: min(340px, 92%); grid-column: auto; grid-row: auto; border-left: 1px solid var(--amc-rule); box-shadow: -30px 0 60px -34px rgba(0, 0, 0, 0.5); transform: translateX(104%); }
.amc-narrow .amc-panel-in { width: 100%; }
.amc-narrow.amc-pn-on .amc-panel { transform: none; }
.amc-tiny .amc-bar-status { display: none; }
.amc-tiny .amc-crumbs span, .amc-tiny .amc-crumbs i { display: none; }

/* ---- tweaks popover ------------------------------------------------------ */
.amc-pop {
  position: absolute;
  top: 44px;
  right: 10px;
  z-index: 20;
  width: 262px;
  padding: 14px;
  border-radius: 12px;
  background: var(--amc-raised);
  box-shadow: 0 0 0 1px var(--amc-rule), 0 24px 50px -20px rgba(0, 0, 0, 0.45);
  animation: amc-pop 0.28s var(--amc-ease) both;
}
.amc-pop .amc-cap { display: block; margin: 12px 0 7px; }
.amc-pop .amc-cap:first-child { margin-top: 0; }
.amc-swatches { display: grid; grid-template-columns: repeat(auto-fit, minmax(48px, 1fr)); gap: 6px; }
.amc-sw {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: 8px 0 6px;
  border-radius: 9px;
  font-family: var(--amc-mono);
  font-size: 9.5px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--amc-muted);
}
.amc-sw:hover { background: var(--amc-rule); }
.amc-sw[aria-pressed="true"] { background: var(--amc-sunk); color: var(--amc-ink); font-weight: 700; }
.amc-sw i { width: 26px; height: 26px; border-radius: 50%; background: var(--amc-sw-bg); box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.15); display: grid; place-items: center; }
.amc-sw i::after { content: ""; width: 8px; height: 8px; border-radius: 50%; background: var(--amc-sw-ink); }
.amc-seg { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); padding: 3px; border-radius: 9px; background: var(--amc-rule); }
.amc-seg button { height: 26px; border-radius: 7px; font-family: var(--amc-mono); font-size: 11px; font-weight: 700; color: var(--amc-muted); text-align: center; }
.amc-seg button[aria-pressed="true"] { background: var(--amc-surface); color: var(--amc-ink); box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12); }
.amc-toggle { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 12px; font-size: 12.5px; color: var(--amc-ink); }
.amc-switch { flex: none; width: 34px; height: 20px; padding: 2px; border-radius: 999px; background: var(--amc-rule); transition: background-color 0.25s ease; }
.amc-switch i { display: block; width: 16px; height: 16px; border-radius: 50%; background: var(--amc-surface); box-shadow: 0 1px 2px rgba(0, 0, 0, 0.25); transition: transform 0.3s var(--amc-ease); }
.amc-switch[aria-checked="true"] { background: var(--amc-ink); }
.amc-switch[aria-checked="true"] i { transform: translateX(14px); }

/* ---- source viewer ------------------------------------------------------- */
.amc-modal-scrim {
  position: absolute;
  inset: 0;
  z-index: 30;
  display: grid;
  place-items: center;
  padding: 16px;
  background: color-mix(in srgb, var(--amc-ink) 22%, transparent);
  -webkit-backdrop-filter: blur(3px);
  backdrop-filter: blur(3px);
  animation: amc-fade 0.25s ease both;
}
.amc-modal {
  width: min(880px, 100%);
  max-height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 14px;
  background: var(--amc-surface);
  box-shadow: 0 0 0 1px var(--amc-rule), 0 40px 90px -30px rgba(0, 0, 0, 0.55);
  animation: amc-pop 0.32s var(--amc-ease) both;
}
.amc-modal-head { display: flex; align-items: center; gap: 12px; padding: 12px 12px 12px 20px; border-bottom: 1px solid var(--amc-rule); }
.amc-modal-head .amc-mono-b { font-size: 13px; }
.amc-modal-body { min-height: 0; overflow: auto; scrollbar-width: thin; }
.amc-modal-graph { padding: 18px 20px 8px; overflow-x: auto; }
.amc-modal-graph .amc-graph { min-width: 560px; }
.amc-code {
  margin: 0;
  padding: 14px 0 22px;
  font-size: 12px;
  line-height: 1.7;
  color: var(--amc-ink);
  background: var(--amc-raised);
  border-top: 1px solid var(--amc-rule);
  overflow-x: auto;
}
.amc-code-line { display: block; padding-right: 20px; white-space: pre; }
.amc-ln { display: inline-block; width: 46px; padding-right: 14px; text-align: right; color: var(--amc-faint); opacity: 0.7; user-select: none; -webkit-user-select: none; }
.amc-tk-kw { color: var(--amc-crew); font-weight: 800; }
.amc-tk-arrow { color: var(--amc-warn); font-weight: 800; }
.amc-tk-str { color: var(--amc-ok); }
.amc-tk-text { color: var(--amc-muted); }

/* ---- closed window ------------------------------------------------------- */
.amc-dock {
  position: absolute;
  left: 50%;
  bottom: 28px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  height: 42px;
  padding: 0 18px 0 14px;
  border-radius: 999px;
  background: var(--amc-surface);
  color: var(--amc-ink);
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1), 0 18px 40px -18px rgba(0, 0, 0, 0.45);
  font-family: var(--amc-mono);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  transform: translateX(-50%);
  animation: amc-dock 0.5s var(--amc-ease) both;
}
.amc-dock span { font-weight: 500; letter-spacing: 0.04em; text-transform: none; color: var(--amc-muted); }
.amc-dock:hover { transform: translateX(-50%) translateY(-2px); }

/* ---- motion -------------------------------------------------------------- */
@keyframes amc-rot { to { transform: rotate(360deg); } }
@keyframes amc-blink { 0%, 100% { opacity: 0.25; } 50% { opacity: 1; } }
@keyframes amc-in { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: none; } }
@keyframes amc-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes amc-pop { from { opacity: 0; transform: translateY(6px) scale(0.98); } to { opacity: 1; transform: none; } }
@keyframes amc-dock { from { opacity: 0; transform: translateX(-50%) translateY(14px); } to { opacity: 1; transform: translateX(-50%); } }
@keyframes amc-ring { from { opacity: 0.6; transform: scale(1); } to { opacity: 0; transform: scale(1.22, 1.6); } }
@keyframes amc-travel { 0% { opacity: 1; } 80% { opacity: 1; } 100% { opacity: 0; } }
@keyframes amc-flash { 0% { opacity: 0; transform: translateX(8px); color: var(--amc-ok); } 55% { opacity: 1; transform: none; color: var(--amc-ok); } }
@keyframes amc-breathe { 0%, 100% { transform: none; } 50% { transform: translateY(-0.6px) scaleY(1.012); } }
@keyframes amc-hop { 0%, 100% { transform: none; } 40% { transform: translateY(-6px); } }
@keyframes amc-orb { 0%, 100% { fill: var(--amc-surface); } 50% { fill: #f2c14e; } }
@keyframes amc-twinkle { 0%, 100% { opacity: 0; transform: scale(0.4); } 50% { opacity: 1; transform: scale(1); } }
@keyframes amc-glyph { 0% { transform: scale(1.7); opacity: 0.3; } 100% { transform: none; opacity: 1; } }
@keyframes amc-flap-l { from { transform: rotate(0deg); } to { transform: rotate(-9deg); } }
@keyframes amc-flap-r { from { transform: rotate(0deg); } to { transform: rotate(9deg); } }

@media (prefers-reduced-motion: reduce) {
  .amc-root *, .amc-root *::before, .amc-root *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    animation-delay: 0s !important;
    transition-duration: 0.001ms !important;
  }
}
`

/* ------------------------------------------------------------------------ */
/* Small parts                                                               */
/* ------------------------------------------------------------------------ */

type IconName = "chevron" | "panel" | "sliders" | "plus" | "close" | "minus" | "arrow" | "check" | "copy" | "zoom"

function Icon({ name, size = 16 }: { name: IconName; size?: number }) {
  const p = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  }
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} className="amc-svg" aria-hidden="true">
      {name === "chevron" && <path d="M10 3.5 5.5 8l4.5 4.5" {...p} />}
      {name === "panel" && (
        <>
          <rect x="2.5" y="3.5" width="11" height="9" rx="2" {...p} />
          <path d="M9.5 3.8v8.4" {...p} />
        </>
      )}
      {name === "sliders" && (
        <>
          <path d="M2.5 5.5h11M2.5 10.5h11" {...p} />
          <circle cx="6" cy="5.5" r="1.7" fill="var(--amc-surface)" stroke="currentColor" strokeWidth={1.6} />
          <circle cx="10.5" cy="10.5" r="1.7" fill="var(--amc-surface)" stroke="currentColor" strokeWidth={1.6} />
        </>
      )}
      {name === "plus" && <path d="M8 3v10M3 8h10" {...p} />}
      {name === "close" && <path d="M4 4l8 8M12 4l-8 8" {...p} />}
      {name === "minus" && <path d="M3.5 8h9" {...p} />}
      {name === "zoom" && <path d="M5 11 11 5M6.5 5H11v4.5" {...p} />}
      {name === "arrow" && <path d="M8 13V3.5M4 7l4-4 4 4" {...p} />}
      {name === "check" && <path d="M3.5 8.5 6.5 11.5 12.5 4.5" {...p} strokeWidth={2} />}
      {name === "copy" && (
        <>
          <rect x="5.5" y="5.5" width="8" height="8" rx="1.6" {...p} />
          <path d="M10.5 3.2V3a.5.5 0 0 0-.5-.5H3a.5.5 0 0 0-.5.5v7a.5.5 0 0 0 .5.5h.2" {...p} />
        </>
      )}
    </svg>
  )
}

type Tone = "spin" | "wait" | "ok" | "bad" | "idle"

function statusOf(run: Run): { label: string; short: string; tone: Tone } {
  switch (run.phase) {
    case "draft":
      return { label: "New session", short: "Idle", tone: "idle" }
    case "deciding":
    case "authored":
      return { label: "Authoring", short: "Authoring", tone: "spin" }
    case "awaiting":
      return { label: "Awaiting approval", short: "Awaiting", tone: "wait" }
    case "running":
      return { label: run.current ?? "Running", short: "Running", tone: "spin" }
    case "stopped":
      return { label: run.current ? "Stopped in " + run.current : "Stopped", short: "Stopped", tone: "idle" }
    case "done":
      return { label: "Done", short: "Finished", tone: "ok" }
    case "abandoned":
      return { label: "Abandoned", short: "Abandoned", tone: "bad" }
    case "declined":
      return { label: "Declined", short: "Declined", tone: "bad" }
  }
}

function Mark({ tone }: { tone: Tone }) {
  if (tone === "spin") return <span className="amc-spin" aria-hidden="true" />
  if (tone === "ok")
    return (
      <span className="amc-mark amc-mark-ok" aria-hidden="true">
        <Icon name="check" size={11} />
      </span>
    )
  if (tone === "bad")
    return (
      <span className="amc-mark amc-mark-bad" aria-hidden="true">
        <Icon name="close" size={10} />
      </span>
    )
  return <span className={"amc-mark amc-mark-" + tone} aria-hidden="true" />
}

function Dots({ live }: { live: boolean }) {
  return (
    <span className={"amc-dots" + (live ? " amc-dots-live" : "")} aria-hidden="true">
      <i>.</i>
      <i>.</i>
      <i>.</i>
    </span>
  )
}

function Rich({ text, keys }: { text: string; keys: string[] }) {
  return (
    <>
      {splitCode(text, keys).map((part, i) =>
        part.code ? (
          <code key={i} className="amc-chip">
            {part.text}
          </code>
        ) : (
          <React.Fragment key={i}>{part.text}</React.Fragment>
        ),
      )}
    </>
  )
}

const TOOL_VERB = /^(read|write|patch|search|note|outline|trace|attach|post|wire|add|source|tighten)\b/

function StepLine({
  text,
  checked,
  onToggle,
}: {
  text: string
  checked: boolean | undefined
  onToggle: (next: boolean) => void
}) {
  const kind = lineKind(text)
  if (kind === "cmd") {
    return (
      <li className="amc-step amc-step-cmd">
        <span className="amc-glyphs amc-pr">$</span>
        <span>{text.slice(2)}</span>
      </li>
    )
  }
  if (kind === "check") {
    const on = checked ?? /^\[[xX]\]/.test(text)
    const body = text.replace(/^\[[ xX]\]\s*/, "")
    const m = body.match(/^(\d+)\s+(.*)$/)
    return (
      <li className="amc-step">
        <span className="amc-glyphs" />
        <button type="button" role="checkbox" aria-checked={on} className="amc-check" onClick={() => onToggle(!on)}>
          <span className="amc-box">{on && <Icon name="check" size={10} />}</span>
          {m && <span className="amc-check-n">{m[1]}</span>}
          <span className="amc-check-t">{m ? m[2] : body}</span>
        </button>
      </li>
    )
  }
  if (kind === "tool") {
    const verb = (text.match(TOOL_VERB) ?? [""])[0]
    return (
      <li className="amc-step amc-step-tool">
        <span className="amc-glyphs">{"→"}</span>
        <span>
          <b>{verb}</b>
          {text.slice(verb.length)}
        </span>
      </li>
    )
  }
  return (
    <li className={"amc-step amc-step-" + kind}>
      <span className="amc-glyphs">{kind === "fail" ? "×" : kind === "pass" ? "✓" : "·"}</span>
      <span>{text}</span>
    </li>
  )
}

/* ------------------------------------------------------------------------ */
/* The studio behind the window                                              */
/* ------------------------------------------------------------------------ */

function Studio({ uid }: { uid: string }) {
  const vx = 800
  const vy = 470
  const bw = 236
  const bh = 146
  const r = (v: number) => Math.round(v)
  const far = (x: number, y: number) => r(vx + (x - vx) * 14) + " " + r(vy + (y - vy) * 14)
  const corners = { tl: [vx - bw, vy - bh], tr: [vx + bw, vy - bh], br: [vx + bw, vy + bh], bl: [vx - bw, vy + bh] }
  const pt = (c: number[]) => c[0] + " " + c[1]
  const poly = (a: number[], b: number[]) => "M" + pt(a) + "L" + pt(b) + "L" + far(b[0], b[1]) + "L" + far(a[0], a[1]) + "Z"

  const rays: string[] = []
  for (let i = 0; i <= 8; i++) {
    const x = vx - bw + (2 * bw * i) / 8
    for (const y of [vy - bh, vy + bh]) rays.push("M" + r(x) + " " + y + "L" + far(x, y))
  }
  for (let i = 1; i < 6; i++) {
    const y = vy - bh + (2 * bh * i) / 6
    for (const x of [vx - bw, vx + bw]) rays.push("M" + x + " " + r(y) + "L" + far(x, y))
  }
  const rings = [1, 1.42, 2.02, 2.87, 4.08, 5.8, 8.2]

  const ribbon = "M-160 1090C240 900 470 770 660 650S1010 400 1180 255 1500 30 1770 -80"
  const nx = 0.55
  const ny = 0.835
  const bands = ["#d9614c", "#ecc160", "#6fae7a", "#5b84d6"]

  return (
    <svg className="amc-svg amc-backdrop" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <filter id={uid + "-soft"} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="26" />
        </filter>
      </defs>
      <rect width="1600" height="1000" style={{ fill: "var(--amc-wall)" }} />
      <path d={poly(corners.tl, corners.tr)} style={{ fill: "var(--amc-bd-lit)" }} />
      <path d={poly(corners.tr, corners.br)} style={{ fill: "var(--amc-bd-lit)", opacity: 0.45 }} />
      <path d={poly(corners.bl, corners.br)} style={{ fill: "var(--amc-bd-shade)" }} />
      <path d={poly(corners.tl, corners.bl)} style={{ fill: "var(--amc-bd-shade)", opacity: 0.5 }} />
      <g style={{ stroke: "var(--amc-grid)" }} fill="none" strokeWidth="1.3">
        {rings.map((s) => (
          <rect key={s} x={r(vx - bw * s)} y={r(vy - bh * s)} width={r(2 * bw * s)} height={r(2 * bh * s)} />
        ))}
        <path d={rays.join("")} />
      </g>
      <path d={ribbon} fill="none" stroke="#000" strokeOpacity="0.16" strokeWidth="190" transform="translate(-10 36)" filter={"url(#" + uid + "-soft)"} />
      {bands.map((c, i) => {
        const k = (i - 1.5) * 42
        return (
          <path
            key={c}
            d={ribbon}
            fill="none"
            stroke={c}
            strokeWidth="43"
            transform={"translate(" + (nx * k).toFixed(1) + " " + (ny * k).toFixed(1) + ")"}
          />
        )
      })}
      <path d={ribbon} fill="none" stroke="#fff" strokeOpacity="0.28" strokeWidth="1.5" transform={"translate(" + (-nx * 84).toFixed(1) + " " + (-ny * 84).toFixed(1) + ")"} />
    </svg>
  )
}

/* ------------------------------------------------------------------------ */
/* The crew                                                                  */
/* ------------------------------------------------------------------------ */

const CREW = [
  {
    name: "The Seer",
    role: "writes the machines",
    lines: [
      "Every task wants a shape. Most of them want about seven states.",
      "I only write the plan. Keeping it is somebody else’s job.",
      "Anything that can loop gets a cap. The Warden insists.",
    ],
  },
  {
    name: "The Menhir",
    role: "keeps the store",
    lines: [
      "Write it to the store or it did not happen.",
      "I remember what is written down. Nothing more.",
      "Values come and go. I stay exactly where I am.",
    ],
  },
  {
    name: "The Warden",
    role: "watches the checks",
    lines: [
      "Nothing runs until you approve it.",
      "I trust a passing check. The second one, especially.",
      "I count every visit. Three, and we stop.",
    ],
  },
]

function crewLine(who: number, run: Run, n: number): string {
  const ctx: string[] = []
  const m = run.machine.name
  if (who === 0) {
    if (run.phase === "deciding" || run.phase === "authored") ctx.push("Hold on. I am drawing the states.")
    else if (run.phase === "awaiting") ctx.push(m + " is written. It waits on you, not me.")
  } else if (who === 1) {
    const k = Object.keys(run.store).length
    if (k) ctx.push("Holding " + k + (k === 1 ? " value" : " values") + " for " + (m || "this session") + ".")
  } else {
    if (run.phase === "awaiting") ctx.push("Read it first. Then approve it.")
    else if (run.phase === "running" && run.current && /verif|check|test|critique|review/i.test(run.current))
      ctx.push("Checking. Do not rush me.")
    else if (run.phase === "done") ctx.push("Every check passed. I am almost pleased.")
  }
  const all = [...ctx, ...CREW[who].lines]
  return all[n % all.length]
}

function Crew({
  uid,
  mood,
  writes,
  pupilRef,
  onSay,
  children,
}: {
  uid: string
  mood: string
  writes: number
  pupilRef: React.RefObject<SVGCircleElement>
  onSay: (who: number) => void
  children?: React.ReactNode
}) {
  const hatch = "url(#" + uid + "-hatch)"
  const line = { fill: "none", stroke: "var(--amc-crew)", strokeWidth: 1.3, strokeLinecap: "round" as const, strokeLinejoin: "round" as const }
  const solid = (fill: string) => ({ ...line, fill })
  return (
    <div className={"amc-crew amc-mood-" + mood}>
      {children}
      <svg width="0" height="0" className="amc-svg" style={{ position: "absolute" }} aria-hidden="true" focusable="false">
        <defs>
          <pattern id={uid + "-hatch"} width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(38)">
            <rect width="3" height="3" style={{ fill: "var(--amc-surface)" }} />
            <path d="M0.75 0V3" style={{ stroke: "var(--amc-crew)" }} strokeWidth="0.75" />
          </pattern>
        </defs>
      </svg>

      <button type="button" className="amc-fig" aria-label={CREW[0].name + ", who " + CREW[0].role} onClick={() => onSay(0)}>
        <svg viewBox="0 0 40 64" className="amc-svg" aria-hidden="true">
          <g className="amc-fig-body">
            <path d="M5 61.5h28" {...line} strokeWidth={2.2} />
            <path d="M15.2 23.6c1.6-1.5 7.8-1.5 9.6 0l3.6 36.6H11.4Z" {...solid(hatch)} />
            <path d="M12 56.6h16.6" {...line} />
            <path d="M15.4 24.2c-.9-6.2 1.3-11.4 4.8-11.4s5.7 5.2 4.8 11.4" {...solid("var(--amc-surface)")} />
            <ellipse cx="20.2" cy="19" rx="2.5" ry="3.1" {...solid("var(--amc-surface)")} />
            <path d="M24.2 27.8c2.6 1.5 4.7 3.3 6.3 5" {...line} />
            <circle cx="30.8" cy="33.2" r="1.3" {...solid("var(--amc-surface)")} />
            <path d="M31.6 9.6v51.4" {...line} strokeWidth={1.5} />
            <circle className="amc-orb" cx="31.6" cy="7.4" r="2.5" {...line} style={{ fill: "var(--amc-surface)" }} />
            <path className="amc-spark" d="M35.6 1.8l.8 1.7 1.7.8-1.7.8-.8 1.7-.8-1.7-1.7-.8 1.7-.8Z" fill="var(--amc-crew)" />
          </g>
        </svg>
      </button>

      <button type="button" className="amc-fig" aria-label={CREW[1].name + ", who " + CREW[1].role} onClick={() => onSay(1)}>
        <svg viewBox="0 0 40 64" className="amc-svg" aria-hidden="true">
          <g className="amc-fig-body">
            <path d="M5 61.5h30" {...line} strokeWidth={2.2} />
            <path d="M11.4 60.6 13 18.8C13.4 9.2 16.9 4.6 20.2 4.6s6.8 4.6 7.2 14.2l1.6 41.8Z" {...solid("var(--amc-crew-fill)")} />
            <path d="M23.8 22.5v33.5M26.2 31v24" {...line} strokeWidth={0.7} opacity={0.55} />
            <path d="M15.8 33.5l2.1 3-1.1 4.2" {...line} strokeWidth={0.8} />
            <path d="M12.4 58.4c1-1.6 2.2-1.6 3.2 0M24.6 58.6c1-1.5 2.2-1.5 3.2 0" {...line} strokeWidth={0.9} />
            <g key={"g" + writes} className={"amc-glyph" + (writes ? " amc-glyph-pulse" : "")}>
              <circle cx="20.2" cy="12.5" r="2.3" {...line} strokeWidth={1.1} />
              <path d="M17.6 12.5h5.2M20.2 16.4v3" {...line} strokeWidth={1.1} />
            </g>
          </g>
        </svg>
      </button>

      <button type="button" className="amc-fig" aria-label={CREW[2].name + ", who " + CREW[2].role} onClick={() => onSay(2)}>
        <svg viewBox="0 0 40 64" className="amc-svg" aria-hidden="true">
          <g className="amc-fig-body">
            <path d="M5 61.5h30" {...line} strokeWidth={2.2} />
            <path className="amc-wing-l" d="M17 30.5C9 28.5 4.4 35.5 4.8 45.2c.4 8.8 5.2 13.8 11.4 14.2Z" {...solid(hatch)} />
            <path className="amc-wing-r" d="M23 30.5c8-2 12.6 5 12.2 14.7-.4 8.8-5.2 13.8-11.4 14.2Z" {...solid(hatch)} />
            <path d="M16.8 30.6c1.2-2.2 5.2-2.2 6.4 0l1.4 29.2h-9.2Z" {...solid("var(--amc-surface)")} />
            <path d="M18.4 59.8v1.6M21.6 59.8v1.6" {...line} />
            <path d="M15.6 17 12.6 12.6M24.4 17l3-4.4M20 15.2v-4.6" {...line} />
            <circle cx="12.4" cy="12.2" r="1" fill="var(--amc-crew)" />
            <circle cx="27.6" cy="12.2" r="1" fill="var(--amc-crew)" />
            <circle cx="20" cy="10.2" r="1" fill="var(--amc-crew)" />
            <circle cx="20" cy="22" r="7" {...solid("var(--amc-surface)")} />
            <circle cx="20" cy="22" r="3.4" {...solid("var(--amc-raised)")} strokeWidth={1.1} />
            <circle ref={pupilRef} cx="20" cy="22" r="1.6" fill="var(--amc-crew)" />
            <path className="amc-lid" d="M16.6 18.9h6.8v3.2h-6.8Z" fill="var(--amc-surface)" />
          </g>
        </svg>
      </button>
    </div>
  )
}

/* ------------------------------------------------------------------------ */
/* The state graph                                                           */
/* ------------------------------------------------------------------------ */

function MachineGraph({
  layout,
  run,
  uid,
  big,
  selected,
  reduced,
  onSelect,
  onHover,
}: {
  layout: GraphLayout
  run: Run
  uid: string
  big?: boolean
  selected: string | null
  reduced: boolean
  onSelect: (id: string) => void
  onHover?: (id: string | null) => void
}) {
  const walked = React.useMemo(() => {
    const s = new Set<string>()
    for (const e of run.events) if (e.kind === "leave") s.add(e.state + ">" + e.to)
    return s
  }, [run.events])
  const edge = run.edge
  const travel = edge ? layout.edges.find((e) => e.from === edge.from && e.to === edge.to) : undefined
  const motion = React.useRef<SVGAnimateMotionElement>(null)
  useIsoLayoutEffect(() => {
    try {
      motion.current?.beginElement()
    } catch {
      /* SMIL unavailable: the dot just stays hidden */
    }
  }, [run.id, run.transitions])

  const arrow = uid + (big ? "-ab" : "-am")
  const fs = big ? 10 : 8.4
  const label = (id: string) => (big || id.length <= 10 ? id : id.slice(0, 9) + "…")
  const first = layout.nodes.find((n) => n.id === run.machine.states[0]?.id)

  return (
    <svg
      className="amc-svg amc-graph"
      viewBox={"0 0 " + layout.width + " " + layout.height}
      width={layout.width}
      height={layout.height}
      role="group"
      aria-label={"State graph for " + run.machine.name}
    >
      <defs>
        <marker id={arrow} viewBox="0 0 6 6" refX="5.6" refY="3" markerWidth="4.6" markerHeight="4.6" orient="auto">
          <path d="M0 .6 5.8 3 0 5.4Z" className="amc-arrow" />
        </marker>
        <marker id={arrow + "-on"} viewBox="0 0 6 6" refX="5.6" refY="3" markerWidth="4.6" markerHeight="4.6" orient="auto">
          <path d="M0 .6 5.8 3 0 5.4Z" className="amc-arrow amc-arrow-on" />
        </marker>
      </defs>
      {layout.edges.map((e) => {
        const on = walked.has(e.from + ">" + e.to)
        return (
          <path
            key={e.from + ">" + e.to + ":" + e.kind}
            d={e.d}
            className={"amc-edge" + (on ? " amc-edge-on" : "") + (e.kind === "cap" ? " amc-edge-cap" : "")}
            markerEnd={"url(#" + (on ? arrow + "-on" : arrow) + ")"}
          />
        )
      })}
      {first && (
        <>
          <circle cx={first.x - 9} cy={first.y + first.h / 2} r={big ? 2.6 : 2} className="amc-init" />
          <path d={"M" + (first.x - 7) + " " + (first.y + first.h / 2) + "H" + first.x} className="amc-edge" />
        </>
      )}
      {layout.nodes.map((n) => {
        const cur = run.current === n.id
        const seen = (run.visits[n.id] ?? 0) > 0
        const cls =
          "amc-node" +
          (cur ? " amc-node-cur" : seen ? " amc-node-seen" : "") +
          (n.final ? " amc-node-final" : "") +
          (selected === n.id ? " amc-node-sel" : "")
        const pick = () => onSelect(n.id)
        return (
          <g
            key={n.id}
            className={cls}
            role="button"
            tabIndex={0}
            aria-pressed={selected === n.id}
            aria-label={
              n.id +
              (cur ? ", current state" : "") +
              (seen ? ", visited " + run.visits[n.id] + (run.visits[n.id] === 1 ? " time" : " times") : "")
            }
            onClick={pick}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                pick()
              }
            }}
            onPointerEnter={() => onHover?.(n.id)}
            onPointerLeave={() => onHover?.(null)}
            onFocus={() => onHover?.(n.id)}
            onBlur={() => onHover?.(null)}
          >
            {cur && run.phase === "running" && !reduced && (
              <rect className="amc-node-pulse" x={n.x} y={n.y} width={n.w} height={n.h} rx={n.final ? n.h / 2 : big ? 6 : 3.5} />
            )}
            <rect className="amc-node-box" x={n.x} y={n.y} width={n.w} height={n.h} rx={n.final ? n.h / 2 : big ? 6 : 3.5} />
            <text className="amc-node-t" x={n.x + n.w / 2} y={n.y + n.h / 2} style={{ fontSize: fs }} textAnchor="middle" dominantBaseline="central">
              {label(n.id)}
            </text>
            <title>{n.id}</title>
          </g>
        )
      })}
      {travel && !reduced && (
        <circle key={run.id + ":" + run.transitions} r={big ? 3.4 : 2.6} className="amc-travel">
          <animateMotion ref={motion} begin="indefinite" dur="0.8s" fill="freeze" path={travel.d} />
        </circle>
      )}
    </svg>
  )
}

function Skeleton({ live }: { live: boolean }) {
  return (
    <svg viewBox="0 0 300 70" className={"amc-svg amc-graph amc-skel" + (live ? " amc-skel-live" : "")} aria-hidden="true">
      <rect x="14" y="27" width="58" height="16" rx="3.5" />
      <rect x="86" y="27" width="58" height="16" rx="3.5" />
      <rect x="158" y="27" width="58" height="16" rx="3.5" />
      <rect x="230" y="15" width="56" height="16" rx="8" />
      <rect x="230" y="40" width="56" height="16" rx="8" />
    </svg>
  )
}

function SourceLine({ line }: { line: string }) {
  if (/^\s*\|/.test(line)) {
    const at = line.indexOf("|")
    return (
      <>
        {line.slice(0, at)}
        <span className="amc-tk-arrow">|</span>
        <span className="amc-tk-text">{line.slice(at + 1)}</span>
      </>
    )
  }
  const parts = line.split(/("[^"]*"|->|\b(?:machine|max visits|store|initial|state|final|failure|writes|when|otherwise|prompt|agent|observed|set)\b)/)
  return (
    <>
      {parts.map((p, i) => {
        if (!p) return null
        if (i % 2 === 0) return <React.Fragment key={i}>{p}</React.Fragment>
        const cls = p === "->" ? "amc-tk-arrow" : p.charAt(0) === '"' ? "amc-tk-str" : "amc-tk-kw"
        return (
          <span key={i} className={cls}>
            {p}
          </span>
        )
      })}
    </>
  )
}

/* ------------------------------------------------------------------------ */
/* Transcript model                                                          */
/* ------------------------------------------------------------------------ */

type LeaveEvent = Extract<RunEvent, { kind: "leave" }>
type FinishEvent = Extract<RunEvent, { kind: "finish" }>
type Row = { ev: RunEvent; i: number }
type VisitItem = { t: "visit"; key: string; state: string; visit: number; rows: Row[]; leave: LeaveEvent | null; finish: FinishEvent | null }
type LineItem = { t: "line"; key: string; ev: RunEvent; i: number }

function buildItems(events: RunEvent[]): (VisitItem | LineItem)[] {
  const out: (VisitItem | LineItem)[] = []
  let cur: VisitItem | null = null
  for (let i = 0; i < events.length; i++) {
    const ev = events[i]
    if (ev.kind === "enter") {
      cur = { t: "visit", key: "v" + i, state: ev.state, visit: ev.visit, rows: [], leave: null, finish: null }
      out.push(cur)
      continue
    }
    if (cur && !cur.leave) {
      if (ev.kind === "leave") {
        cur.leave = ev
        continue
      }
      if (ev.kind === "finish") {
        cur.finish = ev
        continue
      }
      if (ev.kind === "step" || ev.kind === "write" || ev.kind === "stopped" || ev.kind === "resumed") {
        cur.rows.push({ ev, i })
        continue
      }
    }
    out.push({ t: "line", key: "l" + i, ev, i })
  }
  return out
}

const useIsoLayoutEffect = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect

/* ------------------------------------------------------------------------ */
/* The console                                                               */
/* ------------------------------------------------------------------------ */

export interface AgentMachineConsoleProps {
  /** Product name in the title bar. Also names the source format (Cairn → .cairn). */
  brand?: string
  /** Project shown after the brand */
  project?: string
  /** Working directory in the footer */
  cwd?: string
  /** Sessions to start with. An empty list opens on a blank session. */
  sessions?: SessionSeed[]
  /** Writes a machine for a new prompt. Defaults to a built-in seven-state planner. */
  planner?: (prompt: string) => Machine
  /** One-click prompts on a blank session */
  suggestions?: string[]
  /** A built-in theme, or your own palette (missing keys fall back to sage) */
  theme?: AgentConsoleThemeName | Partial<AgentConsolePalette>
  /** Playback speed, 1 = real-ish time */
  speed?: number
  /** Skip the approval step */
  autoApprove?: boolean
  /** Show the three crew members in the sidebar */
  crew?: boolean
  /** The studio scene behind the window, nothing, or your own node */
  backdrop?: "studio" | "none" | React.ReactNode
  /** Start with the machine panel open (on wide screens) */
  defaultPanelOpen?: boolean
  /** Definite height for the whole scene. Never a percentage. */
  height?: string
  minHeight?: string | number
  onSend?: (prompt: string) => void
  onFinish?: (result: { id: string; prompt: string; machine: string; outcome: "done" | "abandoned" }) => void
  className?: string
}

const DEFAULT_SESSIONS: SessionSeed[] = [
  { id: "todo-cli", prompt: TODO_PROMPT, machine: TODO_MACHINE, status: "running" },
  {
    id: "launch-checklist",
    prompt: "Draft a launch checklist for the v2 pricing page, then review it against our analytics events.",
    status: "awaiting",
  },
  { id: "incident-brief", prompt: "Summarise this week’s incident reports into a one-page brief.", status: "done" },
]

const DEFAULT_SUGGESTIONS = [
  "Build a CLI that renames photos by the date they were taken.",
  "Fix the flaky checkout test and prove it passes ten times in a row.",
  "Research three ways to cache our API and recommend one.",
]

const SPEEDS = [0.5, 1, 2, 4]

export default function AgentMachineConsole({
  brand = "Cairn",
  project = "atelier",
  cwd = "/Users/you/Projects/atelier",
  sessions,
  planner,
  suggestions = DEFAULT_SUGGESTIONS,
  theme = "sage",
  speed = 1,
  autoApprove = false,
  crew = true,
  backdrop = "studio",
  defaultPanelOpen = true,
  height = "100svh",
  minHeight = 600,
  onSend,
  onFinish,
  className,
}: AgentMachineConsoleProps) {
  const uid = "amc" + React.useId().replace(/[^A-Za-z0-9_-]/g, "")
  const ext = "." + (brand.toLowerCase().replace(/[^a-z0-9]+/g, "") || "machine")
  const plan = React.useCallback((p: string) => normalizeMachine((planner ?? planMachine)(p)), [planner])

  const [runs, setRuns] = React.useState<Run[]>(() => {
    const list = (sessions ?? DEFAULT_SESSIONS).map((s, i) => seedRun(s.id ?? "session-" + i, s, plan))
    return list.length ? list : [createRun("session-new", "", EMPTY_MACHINE)]
  })
  const [activeId, setActiveId] = React.useState("")
  const active = runs.find((r) => r.id === activeId) ?? runs[0]

  // ---- tweaks ----------------------------------------------------------------
  const custom = typeof theme === "object" ? theme : null
  const [themeKey, setThemeKey] = React.useState<AgentConsoleThemeName | "custom">(custom ? "custom" : (theme as AgentConsoleThemeName))
  const [speedNow, setSpeedNow] = React.useState(speed)
  const [autoNow, setAutoNow] = React.useState(autoApprove)
  const [crewOn, setCrewOn] = React.useState(crew)
  const [tweaksOpen, setTweaksOpen] = React.useState(false)
  const swatches: (AgentConsoleThemeName | "custom")[] = custom ? ["custom", ...THEME_NAMES] : THEME_NAMES
  const pal: AgentConsolePalette =
    themeKey === "custom" ? { ...THEMES.sage, ...(custom ?? {}) } : THEMES[themeKey] ?? THEMES.sage

  // ---- window and layout -------------------------------------------------------
  const [win, setWin] = React.useState<"open" | "gone" | "mini">("open")
  const [maxed, setMaxed] = React.useState(false)
  const [sbOpen, setSbOpen] = React.useState(true)
  const [sbDrawer, setSbDrawer] = React.useState(false)
  const [pnOpen, setPnOpen] = React.useState(defaultPanelOpen)
  const [pnDrawer, setPnDrawer] = React.useState(false)
  const [narrow, setNarrow] = React.useState(false)
  const [tiny, setTiny] = React.useState(false)
  const [ready, setReady] = React.useState(false)
  const sbShown = tiny ? sbDrawer : sbOpen
  const pnShown = narrow ? pnDrawer : pnOpen

  // ---- per-session view state ---------------------------------------------------
  const [draft, setDraft] = React.useState("")
  const [inspect, setInspect] = React.useState<string | null>(null)
  const [hoverNode, setHoverNode] = React.useState<string | null>(null)
  const [whole, setWhole] = React.useState(false)
  const [warnOpen, setWarnOpen] = React.useState(false)
  const [openRows, setOpenRows] = React.useState<Record<string, boolean>>({})
  const [checks, setChecks] = React.useState<Record<string, boolean>>({})
  const [storeOpen, setStoreOpen] = React.useState<string | null>(null)
  const [sourceOpen, setSourceOpen] = React.useState(false)
  const [copied, setCopied] = React.useState(false)
  const [say, setSay] = React.useState<{ who: number; text: string } | null>(null)
  const [reduced, setReduced] = React.useState(false)
  const [isMac, setIsMac] = React.useState(true)

  const winRef = React.useRef<HTMLDivElement>(null)
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLTextAreaElement>(null)
  const popRef = React.useRef<HTMLDivElement>(null)
  const tweakBtnRef = React.useRef<HTMLButtonElement>(null)
  const closeSrcRef = React.useRef<HTMLButtonElement>(null)
  const srcOpener = React.useRef<HTMLElement | null>(null)
  const dockRef = React.useRef<HTMLButtonElement>(null)
  const pupilRef = React.useRef<SVGCircleElement>(null)
  const stick = React.useRef(true)
  const seq = React.useRef(0)
  const sayTimer = React.useRef(0)
  const copyTimer = React.useRef(0)
  const sayCount = React.useRef([0, 0, 0])
  const eyeFrame = React.useRef(0)

  const freshId = () => "session-" + Date.now().toString(36) + "-" + ++seq.current

  // ---- the clock: one interval drives every live session -------------------------
  const runsRef = React.useRef(runs)
  runsRef.current = runs
  const speedRef = React.useRef(speedNow)
  speedRef.current = speedNow
  const autoRef = React.useRef(autoNow)
  autoRef.current = autoNow
  const due = React.useRef<Record<string, number>>({})
  const anyLive = runs.some((r) => r.phase === "deciding" || r.phase === "authored" || r.phase === "running")

  React.useEffect(() => {
    if (!anyLive) return
    const advance = (r: Run, auto: boolean) => {
      const n = tick(r)
      return n.phase === "awaiting" && auto ? approve(n, true) : n
    }
    const timer = window.setInterval(() => {
      const now = performance.now()
      const ready = new Set<string>()
      const auto = autoRef.current
      for (const r of runsRef.current) {
        const live = r.phase === "deciding" || r.phase === "authored" || r.phase === "running"
        if (!live) {
          delete due.current[r.id]
          continue
        }
        const at = due.current[r.id]
        if (at === undefined) {
          due.current[r.id] = now + beatDelay(r) / speedRef.current
          continue
        }
        if (now < at) continue
        ready.add(r.id)
        due.current[r.id] = now + beatDelay(advance(r, auto)) / speedRef.current
      }
      if (ready.size) setRuns((prev) => prev.map((r) => (ready.has(r.id) ? advance(r, auto) : r)))
    }, 90)
    return () => window.clearInterval(timer)
  }, [anyLive])

  // Turning auto-approve on releases anything already waiting.
  React.useEffect(() => {
    if (autoNow) setRuns((prev) => (prev.some((r) => r.phase === "awaiting") ? prev.map((r) => approve(r, true)) : prev))
  }, [autoNow])

  // onFinish fires once per session, on the beat it reaches a final state.
  const finishRef = React.useRef(onFinish)
  finishRef.current = onFinish
  const phases = React.useRef<Record<string, RunPhase>>({})
  React.useEffect(() => {
    const before = phases.current
    const next: Record<string, RunPhase> = {}
    for (const r of runs) {
      next[r.id] = r.phase
      if (before[r.id] && before[r.id] !== r.phase && (r.phase === "done" || r.phase === "abandoned")) {
        finishRef.current?.({ id: r.id, prompt: r.prompt, machine: r.machine.name, outcome: r.phase })
      }
    }
    phases.current = next
  }, [runs])

  // ---- environment ---------------------------------------------------------------
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => setReduced(mq.matches)
    sync()
    mq.addEventListener("change", sync)
    setIsMac(/Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent))
    return () => {
      mq.removeEventListener("change", sync)
      window.clearTimeout(sayTimer.current)
      window.clearTimeout(copyTimer.current)
      cancelAnimationFrame(eyeFrame.current)
    }
  }, [])

  // The layout answers to the window's own width, not the viewport's.
  useIsoLayoutEffect(() => {
    const el = winRef.current
    if (!el) return
    const measure = () => {
      const w = el.offsetWidth
      setNarrow(w < 980)
      setTiny(w < 700)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    // Transitions wait until the first measurement has settled, so a phone
    // does not watch the sidebar fold away on load.
    const f = requestAnimationFrame(() => requestAnimationFrame(() => setReady(true)))
    return () => {
      ro.disconnect()
      cancelAnimationFrame(f)
    }
  }, [])

  // ---- view state follows the active session ---------------------------------------
  React.useEffect(() => {
    setInspect(null)
    setHoverNode(null)
    setWarnOpen(false)
    setStoreOpen(null)
    stick.current = true
  }, [active.id])

  React.useEffect(() => setWhole(false), [active.id, active.current])

  React.useEffect(() => {
    const el = scrollRef.current
    if (el && stick.current) el.scrollTo({ top: el.scrollHeight, behavior: reduced ? "auto" : "smooth" })
  }, [active.id, active.events.length, reduced])

  // The tweaks popover closes on a press outside it.
  React.useEffect(() => {
    if (!tweaksOpen) return
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node
      if (popRef.current?.contains(t) || tweakBtnRef.current?.contains(t)) return
      setTweaksOpen(false)
    }
    document.addEventListener("pointerdown", onDown)
    return () => document.removeEventListener("pointerdown", onDown)
  }, [tweaksOpen])

  React.useEffect(() => {
    if (sourceOpen) closeSrcRef.current?.focus()
  }, [sourceOpen])

  // ---- actions ---------------------------------------------------------------------
  const update = (id: string, fn: (r: Run) => Run) => setRuns((prev) => prev.map((r) => (r.id === id ? fn(r) : r)))

  // The composer swaps its controls as the run moves on. When the focused one
  // goes, hand focus to the transcript so the keyboard stays inside (and ⌘↵
  // still approves).
  const keepFocus = () =>
    requestAnimationFrame(() => {
      const el = document.activeElement
      if (!el || el === document.body || !winRef.current?.contains(el)) scrollRef.current?.focus({ preventScroll: true })
    })
  const act = (fn: (r: Run) => Run) => {
    update(active.id, fn)
    keepFocus()
  }

  const send = (text: string) => {
    const prompt = text.trim()
    if (!prompt) return
    onSend?.(prompt)
    const machine = plan(prompt)
    if (active.phase === "draft") {
      const id = active.id
      setRuns((prev) => prev.map((r) => (r.id === id ? createRun(id, prompt, machine) : r)))
    } else {
      const id = freshId()
      setRuns((prev) => [createRun(id, prompt, machine), ...prev])
      setActiveId(id)
    }
    setDraft("")
    if (inputRef.current) inputRef.current.style.height = ""
    stick.current = true
    keepFocus()
  }

  const newSession = () => {
    const existing = runs.find((r) => r.phase === "draft")
    if (existing) setActiveId(existing.id)
    else {
      const id = freshId()
      setRuns((prev) => [createRun(id, "", EMPTY_MACHINE), ...prev])
      setActiveId(id)
    }
    if (tiny) setSbDrawer(false)
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  const removeSession = (id: string) => {
    const at = runs.findIndex((r) => r.id === id)
    const left = runs.filter((r) => r.id !== id)
    if (!left.length) {
      const fresh = freshId()
      setRuns([createRun(fresh, "", EMPTY_MACHINE)])
      setActiveId(fresh)
      return
    }
    setRuns(left)
    if (id === active.id) setActiveId((left[at] ?? left[at - 1] ?? left[0]).id)
  }

  const runAgain = (run: Run) => {
    const id = freshId()
    setRuns((prev) => [createRun(id, run.prompt, run.machine), ...prev])
    setActiveId(id)
  }

  const openSource = () => {
    srcOpener.current = document.activeElement as HTMLElement | null
    setSourceOpen(true)
  }
  const closeSource = () => {
    setSourceOpen(false)
    requestAnimationFrame(() => srcOpener.current?.focus())
  }

  const copySource = (text: string) => {
    const done = () => {
      setCopied(true)
      window.clearTimeout(copyTimer.current)
      copyTimer.current = window.setTimeout(() => setCopied(false), 1600)
    }
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, () => {})
  }

  const speak = (who: number) => {
    const n = sayCount.current[who]++
    setSay({ who, text: crewLine(who, active, n) })
    window.clearTimeout(sayTimer.current)
    sayTimer.current = window.setTimeout(() => setSay(null), 3800)
  }

  const closeWindow = (how: "gone" | "mini") => {
    setTweaksOpen(false)
    setSourceOpen(false)
    setWin(how)
    window.setTimeout(() => dockRef.current?.focus(), 60)
  }

  const togglePanel = () => (narrow ? setPnDrawer(!pnDrawer) : setPnOpen(!pnOpen))
  const toggleSidebar = () => (tiny ? setSbDrawer(!sbDrawer) : setSbOpen(!sbOpen))

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      if (sourceOpen) closeSource()
      else if (tweaksOpen) {
        setTweaksOpen(false)
        tweakBtnRef.current?.focus()
      } else if (narrow && pnDrawer) setPnDrawer(false)
      else if (tiny && sbDrawer) setSbDrawer(false)
      return
    }
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      if (active.phase === "awaiting") {
        e.preventDefault()
        act((r) => approve(r))
      } else if (composing && draft.trim()) {
        e.preventDefault()
        send(draft)
      }
    }
  }

  const followEye = (e: React.PointerEvent) => {
    if (!crewOn || reduced) return
    const x = e.clientX
    const y = e.clientY
    cancelAnimationFrame(eyeFrame.current)
    eyeFrame.current = requestAnimationFrame(() => {
      const p = pupilRef.current
      const svg = p?.ownerSVGElement
      if (!p || !svg) return
      const b = svg.getBoundingClientRect()
      const dx = x - (b.left + b.width / 2)
      const dy = y - (b.top + b.height * (22 / 64))
      const d = Math.hypot(dx, dy) || 1
      const k = Math.min(1, d / 140) * 1.5
      p.setAttribute("transform", "translate(" + ((dx / d) * k).toFixed(2) + " " + ((dy / d) * k).toFixed(2) + ")")
    })
  }

  // ---- derived -----------------------------------------------------------------------
  const machine = active.machine
  const hasMachine = active.phase !== "draft" && active.phase !== "deciding" && machine.states.length > 0
  const keys = React.useMemo(() => storeKeys(machine), [machine])
  const keyNames = React.useMemo(() => keys.map((k) => k.key), [keys])
  const layout = React.useMemo(() => layoutMachine(machine), [machine])
  const bigLayout = React.useMemo(() => {
    const longest = Math.max(8, ...machine.states.map((s) => s.id.length))
    return layoutMachine(machine, { w: Math.round(longest * 6.2 + 22), h: 26, gapX: 34, gapY: 16 })
  }, [machine])
  const source = React.useMemo(() => (machine.states.length ? machineSource(machine) : ""), [machine])
  const items = React.useMemo(() => buildItems(active.events), [active.events])
  const lastVisit = (() => {
    for (let i = items.length - 1; i >= 0; i--) if (items[i].t === "visit") return i
    return -1
  })()
  const writes = active.events.filter((e) => e.kind === "write").length
  const st = statusOf(active)
  const shownId = inspect ?? active.current ?? (hasMachine ? machine.states[0].id : null)
  const shown = byId(machine, shownId)
  const busy = active.phase === "deciding" || active.phase === "authored" || active.phase === "running"
  const composing = active.phase === "draft" || active.phase === "done" || active.phase === "abandoned" || active.phase === "declined"
  const liveCount = runs.filter((r) => r.phase === "deciding" || r.phase === "authored" || r.phase === "running").length
  const mood =
    active.phase === "deciding" || active.phase === "authored"
      ? "authoring"
      : active.phase === "awaiting"
        ? "waiting"
        : active.phase === "running"
          ? /verif|check|test|critique|review/i.test(active.current ?? "")
            ? "verifying"
            : "working"
          : active.phase === "done"
            ? "done"
            : active.phase === "draft"
              ? "idle"
              : "down"

  const vars = {
    "--amc-h": height,
    "--amc-minh": typeof minHeight === "number" ? minHeight + "px" : minHeight,
    "--amc-surface": pal.surface,
    "--amc-raised": pal.raised,
    "--amc-sunk": pal.sunk,
    "--amc-node": pal.node,
    "--amc-ink": pal.ink,
    "--amc-muted": pal.muted,
    "--amc-faint": pal.faint,
    "--amc-rule": pal.rule,
    "--amc-warn": pal.warn,
    "--amc-ok": pal.ok,
    "--amc-crew": pal.crew,
    "--amc-crew-fill": pal.crewFill,
    "--amc-wall": pal.wall,
    "--amc-grid": pal.grid,
    "--amc-bd-lit": isDark(pal.wall) ? "rgba(255, 255, 255, 0.025)" : "rgba(255, 255, 255, 0.55)",
    "--amc-bd-shade": isDark(pal.wall) ? "rgba(0, 0, 0, 0.25)" : "rgba(20, 30, 40, 0.035)",
  } as React.CSSProperties

  const rootCls =
    "amc-root" +
    (backdrop === "none" ? " amc-bare" : "") +
    (maxed ? " amc-max" : "") +
    (win === "gone" ? " amc-gone" : win === "mini" ? " amc-mini" : "") +
    (className ? " " + className : "")
  const winCls =
    "amc-win" +
    (sbShown ? " amc-sb-on" : "") +
    (pnShown ? " amc-pn-on" : "") +
    (narrow ? " amc-narrow" : "") +
    (tiny ? " amc-tiny" : "") +
    (ready ? " amc-ready" : "")

  // ---- transcript pieces -------------------------------------------------------------
  const rowKey = (i: number) => active.id + ":" + i

  const renderRows = (rows: Row[]) => (
    <ul className="amc-steps">
      {rows.map(({ ev, i }) => {
        if (ev.kind === "step") {
          return (
            <StepLine
              key={i}
              text={ev.text}
              checked={checks[rowKey(i)]}
              onToggle={(next) => setChecks((c) => ({ ...c, [rowKey(i)]: next }))}
            />
          )
        }
        if (ev.kind === "write") {
          const kind = keys.find((k) => k.key === ev.key)?.kind ?? "agent"
          return (
            <li key={i} className="amc-step amc-step-write">
              <span className="amc-glyphs">
                <i className={"amc-mk amc-mk-" + kind} />
              </span>
              <span>
                wrote <code className="amc-chip">{ev.key}</code>
              </span>
              <em>{typeof ev.value === "string" ? "“" + ev.value + "”" : String(ev.value)}</em>
            </li>
          )
        }
        if (ev.kind === "stopped" || ev.kind === "resumed") {
          return (
            <li key={i} className="amc-step amc-step-note">
              <span className="amc-glyphs">{ev.kind === "stopped" ? "■" : "▶"}</span>
              <span>{ev.kind === "stopped" ? "Stopped by you." : "Resumed."}</span>
            </li>
          )
        }
        return null
      })}
    </ul>
  )

  const renderLine = (item: LineItem) => {
    const ev = item.ev
    switch (ev.kind) {
      case "note":
        return (
          <p key={item.key} className="amc-log">
            {ev.text}
            <Dots live={active.phase === "deciding"} />
          </p>
        )
      case "authored": {
        const n = ev.warnings.length
        return (
          <React.Fragment key={item.key}>
            <div className="amc-kv">
              <span className="amc-cap">Machine authored</span>
              <b className="amc-mono-b">{ev.machine}</b>
              {n ? (
                <button type="button" className="amc-cap amc-warnbtn" aria-expanded={warnOpen} onClick={() => setWarnOpen(!warnOpen)}>
                  {n + (n === 1 ? " warning" : " warnings")}
                </button>
              ) : (
                <span className="amc-cap amc-okc">No warnings</span>
              )}
              <button type="button" className="amc-cap amc-link" onClick={openSource}>
                View {ext}
              </button>
            </div>
            {warnOpen && n > 0 && (
              <ul className="amc-warns">
                {ev.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            )}
          </React.Fragment>
        )
      }
      case "waiting":
        return (
          <p key={item.key} className="amc-log">
            Waiting for you to approve {ev.machine} before anything runs
            <Dots live={active.phase === "awaiting"} />
          </p>
        )
      case "approved":
        return (
          <div key={item.key} className="amc-kv">
            <span className="amc-cap">{ev.auto ? "Auto-approved" : "Approved"}</span>
            <b className="amc-mono-b">{ev.machine}</b>
          </div>
        )
      case "executing":
        return (
          <p key={item.key} className="amc-log">
            Executing machine {ev.machine} {"—"} {ev.states} states.
          </p>
        )
      case "declined":
        return (
          <React.Fragment key={item.key}>
            <div className="amc-kv">
              <span className="amc-cap amc-badc">Declined</span>
              <b className="amc-mono-b">{ev.machine}</b>
            </div>
            <p className="amc-log">Nothing ran. Ask again with more detail, or pick up another session.</p>
          </React.Fragment>
        )
      case "stopped":
        return (
          <p key={item.key} className="amc-log">
            Stopped by you before anything ran.
          </p>
        )
      case "resumed":
        return (
          <p key={item.key} className="amc-log">
            Resumed.
          </p>
        )
      default:
        return null
    }
  }

  const renderVisit = (item: VisitItem, last: boolean) => {
    const s = byId(machine, item.state)
    if (last && item.finish) {
      const repairs = Object.entries(active.visits)
        .filter(([id]) => /repair|revise|fix|patch/i.test(id))
        .reduce((a, [, v]) => a + v, 0)
      const prev = active.edge
      const ok = item.finish.outcome === "done"
      return (
        <section key={item.key} className="amc-state" aria-label={ok ? "Run finished" : "Run abandoned"}>
          <div className="amc-hr" role="separator" />
          <p className={"amc-cap" + (ok ? " amc-okc" : " amc-badc")}>{ok ? "Finished" : "Abandoned"}</p>
          <h2 className="amc-state-name">{item.state}</h2>
          <p className="amc-final-sum">
            {ok
              ? "Reached " + item.state + " after " + active.transitions + (active.transitions === 1 ? " transition" : " transitions") + ". Every check on the way passed."
              : prev && prev.via === "visit cap"
                ? "Gave up after " + prev.from + " used every visit it had. Nothing past it ran."
                : "There was no way forward, so the run stopped here."}
          </p>
          <div className="amc-stats">
            <span className="amc-stat">
              <b>{active.transitions}</b>transitions
            </span>
            <span className="amc-stat">
              <b>
                {Object.keys(active.visits).length}/{machine.states.length}
              </b>
              states visited
            </span>
            <span className="amc-stat">
              <b>{repairs}</b>
              {repairs === 1 ? "repair" : "repairs"}
            </span>
            <span className="amc-stat">
              <b>{writes}</b>store writes
            </span>
          </div>
          <div className="amc-actions">
            <button type="button" className="amc-btn" onClick={() => runAgain(active)}>
              Run it again
            </button>
            <button type="button" className="amc-btn amc-btn-ghost" onClick={openSource}>
              View {machine.name + ext}
            </button>
          </div>
        </section>
      )
    }
    if (last && !item.leave) {
      const prompt = s?.prompt ?? ""
      return (
        <section key={item.key} className="amc-state" aria-label={"State " + item.state}>
          <div className="amc-hr" role="separator" />
          <p className="amc-cap">State{item.visit > 1 ? " · visit " + item.visit : ""}</p>
          <h2 className="amc-state-name">{item.state}</h2>
          {prompt && (
            <>
              <p className={"amc-instr" + (whole ? "" : " amc-instr-clamp")}>
                <Rich text={prompt} keys={keyNames} />
              </p>
              {prompt.length > 140 && (
                <button type="button" className="amc-cap amc-link amc-more" aria-expanded={whole} onClick={() => setWhole(!whole)}>
                  {whole ? "Show less" : "Show the whole instruction"}
                </button>
              )}
            </>
          )}
          {item.rows.length > 0 && renderRows(item.rows)}
          {active.phase === "running" && (
            <p className="amc-working" aria-hidden="true">
              <i />
              <i />
              <i />
            </p>
          )}
        </section>
      )
    }
    const leave = item.leave
    const k = rowKey(Number(item.key.slice(1)))
    const open = !!openRows[k]
    const wrote = item.rows.filter((r) => r.ev.kind === "write").map((r) => (r.ev.kind === "write" ? r.ev.key : ""))
    const capped = leave && leave.via !== "otherwise" && !keyNames.includes(leave.via)
    return (
      <div key={item.key} className="amc-past">
        <button type="button" className="amc-past-row" aria-expanded={open} onClick={() => setOpenRows((o) => ({ ...o, [k]: !open }))}>
          <span className={"amc-past-mark" + (capped ? " amc-badc" : "")}>
            <Icon name={capped ? "close" : "check"} size={12} />
          </span>
          <b>{item.state}</b>
          {item.visit > 1 && <span className="amc-cap">visit {item.visit}</span>}
          <span className="amc-past-meta">
            {wrote.length ? "wrote " + wrote.join(", ") + "  " : ""}
            {leave ? "→ " + leave.to + (leave.via !== "otherwise" ? " · " + (keyNames.includes(leave.via) ? "when " + leave.via : leave.via) : "") : ""}
          </span>
          <span className="amc-chev">
            <Icon name="chevron" size={12} />
          </span>
        </button>
        {open && renderRows(item.rows)}
      </div>
    )
  }

  // ---- render ----------------------------------------------------------------------
  return (
    <div className={rootCls} style={vars} onKeyDown={onKeyDown}>
      <style>{AMC_CSS}</style>
      {backdrop === "studio" ? <Studio uid={uid} /> : backdrop !== "none" && backdrop ? <div className="amc-backdrop-slot">{backdrop}</div> : null}

      <div ref={winRef} className={winCls} onPointerMove={followEye} role="region" aria-label={brand + " agent console"}>
        {/* ---- title bar ---- */}
        <div className="amc-bar">
          <div className="amc-lights">
            <button type="button" className="amc-light amc-light-r" aria-label="Close window" onClick={() => closeWindow("gone")}>
              <Icon name="close" size={8} />
            </button>
            <button type="button" className="amc-light amc-light-y" aria-label="Minimize window" onClick={() => closeWindow("mini")}>
              <Icon name="minus" size={8} />
            </button>
            <button type="button" className="amc-light amc-light-g" aria-label={maxed ? "Restore window size" : "Zoom window"} onClick={() => setMaxed(!maxed)}>
              <Icon name="zoom" size={8} />
            </button>
          </div>
          <button type="button" className="amc-iconbtn amc-back" aria-label={sbShown ? "Hide sessions" : "Show sessions"} aria-expanded={sbShown} onClick={toggleSidebar}>
            <Icon name="chevron" />
          </button>
          <div className="amc-crumbs">
            <b>{brand}</b>
            <i>/</i>
            <span>{project}</span>
          </div>
          <div className="amc-grow" />
          <div className="amc-bar-status" title={st.label}>
            <Mark tone={st.tone} />
            <span>{st.label}</span>
          </div>
          <button type="button" className="amc-iconbtn amc-panelbtn" aria-label="Machine panel" aria-pressed={pnShown} onClick={togglePanel}>
            <Icon name="panel" />
          </button>
          <button
            ref={tweakBtnRef}
            type="button"
            className="amc-iconbtn amc-tweakbtn"
            aria-label="Tweaks"
            aria-expanded={tweaksOpen}
            aria-haspopup="dialog"
            onClick={() => setTweaksOpen(!tweaksOpen)}
          >
            <Icon name="sliders" />
          </button>
          {tweaksOpen && (
            <div ref={popRef} className="amc-pop" role="dialog" aria-label="Tweaks">
              <span className="amc-cap">Theme</span>
              <div className="amc-swatches">
                {swatches.map((name) => {
                  const p = name === "custom" ? { ...THEMES.sage, ...custom } : THEMES[name]
                  return (
                    <button
                      key={name}
                      type="button"
                      className="amc-sw"
                      aria-pressed={themeKey === name}
                      onClick={() => setThemeKey(name)}
                      style={{ "--amc-sw-bg": p.surface, "--amc-sw-ink": p.ink } as React.CSSProperties}
                    >
                      <i />
                      {name}
                    </button>
                  )
                })}
              </div>
              <span className="amc-cap">Speed</span>
              <div className="amc-seg" role="group" aria-label="Speed">
                {SPEEDS.map((s) => (
                  <button key={s} type="button" aria-pressed={speedNow === s} onClick={() => setSpeedNow(s)}>
                    {s === 0.5 ? "½" : s}
                    {"×"}
                  </button>
                ))}
              </div>
              <div className="amc-toggle">
                <span id={uid + "-auto"}>Approve machines automatically</span>
                <button type="button" role="switch" aria-checked={autoNow} aria-labelledby={uid + "-auto"} className="amc-switch" onClick={() => setAutoNow(!autoNow)}>
                  <i />
                </button>
              </div>
              <div className="amc-toggle">
                <span id={uid + "-crew"}>Show the crew</span>
                <button type="button" role="switch" aria-checked={crewOn} aria-labelledby={uid + "-crew"} className="amc-switch" onClick={() => setCrewOn(!crewOn)}>
                  <i />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="amc-body">
          {/* ---- sessions ---- */}
          <nav className="amc-side" aria-label="Sessions">
            <div className="amc-side-in">
              <div className="amc-side-head">
                <span className="amc-cap">Sessions</span>
                <button type="button" className="amc-iconbtn" aria-label="New session" onClick={newSession}>
                  <Icon name="plus" />
                </button>
              </div>
              <ul className="amc-sessions">
                {runs.map((r) => {
                  const s = statusOf(r)
                  return (
                    <li key={r.id} className={"amc-sess" + (r.id === active.id ? " amc-sess-on" : "")}>
                      <button
                        type="button"
                        className="amc-sess-btn"
                        aria-current={r.id === active.id ? "true" : undefined}
                        title={r.prompt || "New session"}
                        onClick={() => {
                          setActiveId(r.id)
                          if (tiny) setSbDrawer(false)
                        }}
                      >
                        <span className="amc-sess-title">{r.prompt || "New session"}</span>
                        <span className="amc-sess-status">
                          <Mark tone={s.tone} />
                          <span>{s.label}</span>
                        </span>
                      </button>
                      <button type="button" className="amc-sess-x" aria-label="Remove session" onClick={() => removeSession(r.id)}>
                        <Icon name="close" size={11} />
                      </button>
                    </li>
                  )
                })}
              </ul>
              {crewOn && (
                <Crew uid={uid} mood={mood} writes={writes} pupilRef={pupilRef} onSay={speak}>
                  {say && (
                    <div key={say.who + say.text} className="amc-say" role="status" style={{ "--amc-say-x": 17 + say.who * 46 + "px" } as React.CSSProperties}>
                      <b>{CREW[say.who].name}</b>
                      {say.text}
                    </div>
                  )}
                </Crew>
              )}
            </div>
          </nav>

          {/* ---- transcript ---- */}
          <section className="amc-main" aria-label="Transcript">
            <div
              ref={scrollRef}
              className="amc-scroll"
              tabIndex={-1}
              onScroll={(e) => {
                const el = e.currentTarget
                stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 90
              }}
            >
              <div className="amc-thread">
                {active.phase === "draft" ? (
                  <div className="amc-empty">
                    <p className="amc-cap">New session</p>
                    <h2 className="amc-ask">What should the machine do?</h2>
                    <p className="amc-empty-sub">
                      Describe a task. {brand} decides whether it needs a machine, writes one, and waits for you to approve it before
                      anything runs.
                    </p>
                    {suggestions.length > 0 && (
                      <div className="amc-sugs">
                        {suggestions.map((s) => (
                          <button key={s} type="button" className="amc-sug" onClick={() => send(s)}>
                            <span>{s}</span>
                            <Icon name="arrow" size={14} />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div role="log" aria-label="Run transcript">
                    <p className="amc-cap">You asked</p>
                    <h2 className="amc-ask">{active.prompt}</h2>
                    {items.map((item, idx) => (item.t === "line" ? renderLine(item) : renderVisit(item, idx === lastVisit)))}
                  </div>
                )}
              </div>
            </div>

            {/* ---- composer ---- */}
            <div className="amc-composer">
              {busy && (
                <div className="amc-crow">
                  <p className="amc-crow-text">
                    {active.phase === "running" ? "Running" : "Authoring"}
                    <Dots live />
                  </p>
                  <button type="button" className="amc-stop" aria-label="Stop the run" onClick={() => act(stop)}>
                    <i />
                  </button>
                </div>
              )}
              {active.phase === "awaiting" && (
                <div className="amc-crow">
                  <p className="amc-crow-text">
                    Approve <b className="amc-mono-b">{machine.name}</b> to start.
                  </p>
                  <button type="button" className="amc-btn amc-btn-ghost" onClick={() => act(decline)}>
                    Decline
                  </button>
                  <button type="button" className="amc-btn" onClick={() => act((r) => approve(r))}>
                    Approve
                  </button>
                </div>
              )}
              {active.phase === "stopped" && (
                <div className="amc-crow">
                  <p className="amc-crow-text">
                    Stopped{active.current ? " in " : "."}
                    {active.current && <b className="amc-mono-b">{active.current}</b>}
                  </p>
                  <button type="button" className="amc-btn amc-btn-ghost" onClick={newSession}>
                    New session
                  </button>
                  <button type="button" className="amc-btn" onClick={() => act(resume)}>
                    Resume
                  </button>
                </div>
              )}
              {composing && (
                <form
                  className="amc-crow"
                  onSubmit={(e) => {
                    e.preventDefault()
                    send(draft)
                  }}
                >
                  <textarea
                    ref={inputRef}
                    className="amc-input"
                    rows={1}
                    value={draft}
                    aria-label="Describe a task"
                    placeholder={active.phase === "draft" ? "Describe a task for " + brand + "…" : "Ask for something new…"}
                    onChange={(e) => {
                      setDraft(e.target.value)
                      const el = e.target
                      el.style.height = "auto"
                      el.style.height = Math.min(el.scrollHeight, 140) + "px"
                    }}
                  />
                  <button type="submit" className="amc-send" aria-label="Send" disabled={!draft.trim()}>
                    <Icon name="arrow" size={14} />
                  </button>
                </form>
              )}
              <div className="amc-foot">
                <span>
                  {isMac ? "⌘↵" : "Ctrl ↵"} {active.phase === "awaiting" ? "to approve" : "to send"}
                </span>
                <span title={cwd}>{cwd}</span>
              </div>
            </div>
          </section>

          {/* ---- machine ---- */}
          <aside className="amc-panel" aria-label="Machine">
            <div className="amc-panel-in">
              <div className="amc-ph">
                <span className="amc-cap">Machine</span>
                <span className="amc-cap amc-ph-status">
                  <Mark tone={st.tone} />
                  {st.short}
                </span>
                <button type="button" className="amc-iconbtn" aria-label="Close machine panel" onClick={togglePanel}>
                  <Icon name="close" size={14} />
                </button>
              </div>

              {hasMachine ? (
                <>
                  <div className="amc-graph-wrap">
                    <MachineGraph
                      layout={layout}
                      run={active}
                      uid={uid}
                      selected={inspect}
                      reduced={reduced}
                      onSelect={(id) => setInspect(id === active.current ? null : id)}
                      onHover={setHoverNode}
                    />
                  </div>
                  <div className="amc-gcap">
                    <b className="amc-mono-b">
                      {hoverNode
                        ? hoverNode + (active.visits[hoverNode] ? " · " + active.visits[hoverNode] + "×" : "")
                        : machine.name}
                    </b>
                    <button type="button" className="amc-cap amc-link" onClick={openSource}>
                      View {ext}
                    </button>
                  </div>
                  <div className="amc-rule" />
                  {shown && (
                    <section className="amc-cur" aria-live="polite">
                      <div className="amc-cur-head">
                        <span className="amc-cap">{shown.id === active.current || !inspect ? "Current state" : "Inspecting"}</span>
                        {inspect && active.current && (
                          <button type="button" className="amc-cap amc-link" onClick={() => setInspect(null)}>
                            Follow run
                          </button>
                        )}
                      </div>
                      <h3 className="amc-pstate">{shown.id}</h3>
                      <p className="amc-cap">
                        {[
                          machine.states[0]?.id === shown.id ? "Initial" : "",
                          shown.final ? (outcomeOf(shown) === "failure" ? "Final · failure" : "Final") : "",
                          active.visits[shown.id] ? "Visit " + active.visits[shown.id] : "Not visited",
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      {!shown.final && (
                        <dl className="amc-dl">
                          {shown.writes && shown.writes.length > 0 && (
                            <>
                              <dt className="amc-cap">Writes</dt>
                              <dd>{shown.writes.join(", ")}</dd>
                            </>
                          )}
                          {(shown.when ?? []).map((w) => (
                            <React.Fragment key={w.key + w.to}>
                              <dt className="amc-cap">When</dt>
                              <dd>
                                {w.key} {"→"} {w.to}
                              </dd>
                            </React.Fragment>
                          ))}
                          {shown.next && (
                            <>
                              <dt className="amc-cap">Otherwise</dt>
                              <dd>
                                {"→"} {shown.next}
                              </dd>
                            </>
                          )}
                        </dl>
                      )}
                      {shown.prompt && (
                        <>
                          <p className="amc-cap">Prompt</p>
                          <p className="amc-ptext">{shown.prompt}</p>
                        </>
                      )}
                      {shown.final && (
                        <p className="amc-ptext">
                          {outcomeOf(shown) === "failure"
                            ? "Where the run goes when a state runs out of visits or has no way forward."
                            : "Reaching this state ends the run."}
                        </p>
                      )}
                    </section>
                  )}
                  {keys.length > 0 && (
                    <section className="amc-store" aria-label="Store">
                      <div className="amc-store-head">
                        <span className="amc-cap">Store</span>
                        <span className="amc-cap amc-legend">
                          <span>
                            <i className="amc-mk amc-mk-agent" />
                            Agent
                          </span>
                          <span>
                            <i className="amc-mk amc-mk-observed" />
                            Observed
                          </span>
                          <span>
                            <i className="amc-mk amc-mk-set" />
                            Set
                          </span>
                        </span>
                      </div>
                      <ul>
                        {keys.map((k) => {
                          const has = Object.prototype.hasOwnProperty.call(active.store, k.key)
                          const v = active.store[k.key]
                          let lastWrite = -1
                          active.events.forEach((e, i) => {
                            if (e.kind === "write" && e.key === k.key) lastWrite = i
                          })
                          const open = storeOpen === k.key && has
                          return (
                            <li key={k.key} className="amc-srow">
                              <button
                                type="button"
                                className="amc-srow-btn"
                                aria-expanded={has ? open : undefined}
                                disabled={!has}
                                onClick={() => setStoreOpen(open ? null : k.key)}
                              >
                                <i className={"amc-mk amc-mk-" + k.kind} title={k.kind} />
                                <b>{k.key}</b>
                                <span
                                  key={lastWrite}
                                  className={
                                    "amc-sval" +
                                    (v === true ? " amc-sval-true" : v === false ? " amc-sval-false" : "") +
                                    (lastWrite > -1 ? " amc-sval-new" : "")
                                  }
                                >
                                  {has ? formatValue(v) : "—"}
                                </span>
                              </button>
                              {open && <p className="amc-sfull">{formatValue(v)}</p>}
                            </li>
                          )
                        })}
                      </ul>
                    </section>
                  )}
                </>
              ) : (
                <>
                  <div className="amc-graph-wrap">
                    <Skeleton live={active.phase === "deciding"} />
                  </div>
                  <p className="amc-none">
                    {active.phase === "deciding"
                      ? "Authoring a machine for this request. Its states, store and exits appear here once it is written."
                      : active.phase === "draft"
                        ? "No machine yet. Ask for something and the machine " + brand + " writes for it shows up here."
                        : "This session has no machine."}
                  </p>
                </>
              )}
            </div>
          </aside>

          <div
            className={"amc-scrim" + ((tiny && sbDrawer) || (narrow && pnDrawer) ? " amc-scrim-on" : "")}
            onClick={() => {
              setSbDrawer(false)
              setPnDrawer(false)
            }}
            aria-hidden="true"
          />
        </div>

        {/* ---- source viewer ---- */}
        {sourceOpen && machine.states.length > 0 && (
          <div
            className="amc-modal-scrim"
            onPointerDown={(e) => {
              if (e.target === e.currentTarget) closeSource()
            }}
          >
            <div className="amc-modal" role="dialog" aria-modal="true" aria-labelledby={uid + "-src"}>
              <div className="amc-modal-head">
                <b id={uid + "-src"} className="amc-mono-b">
                  {machine.name + ext}
                </b>
                <span className="amc-cap">
                  {machine.states.length} states {"·"} {keys.length} store keys
                </span>
                <div className="amc-grow" />
                <button type="button" className="amc-btn amc-btn-ghost" onClick={() => copySource(source)}>
                  <Icon name={copied ? "check" : "copy"} size={13} />
                  {copied ? "Copied" : "Copy"}
                </button>
                <button ref={closeSrcRef} type="button" className="amc-iconbtn" aria-label="Close source" onClick={closeSource}>
                  <Icon name="close" />
                </button>
              </div>
              <div className="amc-modal-body">
                <div className="amc-modal-graph">
                  <MachineGraph
                    layout={bigLayout}
                    run={active}
                    uid={uid}
                    big
                    selected={inspect}
                    reduced={reduced}
                    onSelect={(id) => setInspect(id === active.current ? null : id)}
                  />
                </div>
                <pre className="amc-code">
                  <code>
                    {source
                      .trimEnd()
                      .split("\n")
                      .map((l, i) => (
                        <span key={i} className="amc-code-line">
                          <span className="amc-ln">{i + 1}</span>
                          <SourceLine line={l} />
                        </span>
                      ))}
                  </code>
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>

      {win !== "open" && (
        <button ref={dockRef} type="button" className="amc-dock" onClick={() => setWin("open")}>
          {brand}
          <span>{liveCount ? liveCount + (liveCount === 1 ? " machine running" : " machines running") + " · reopen" : "Reopen"}</span>
        </button>
      )}
    </div>
  )
}
