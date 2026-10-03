// Install-safety checks and the run engine, executed, for components/agent-console-template.
// Run: node tests/agent-console-template.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const SLUG = "agent-console-template"
const read = (file) => readFileSync(new URL(`../components/${SLUG}/${file}`, import.meta.url), "utf8").replace(/\r\n/g, "\n")
const src = read(`${SLUG}.tsx`)
const demoFiles = ["demo.tsx", "demo-blank.tsx", "demo-live.tsx", "demo-night.tsx"]
const demos = demoFiles.map(read)

/* ---------- nothing travels with it ---------- */

const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.doesNotMatch(src, /@import|@font-face|<link\b|<img\b|fetch\(|new Image\(/, "nothing loads at runtime")
assert.doesNotMatch(src + demos.join(""), /https?:\/\/(?!www\.w3\.org)/, "no remote assets")
assert.doesNotMatch(src + demos.join(""), /orcrist/i, "must not reference the app this was studied from")
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.match(src, /React\.useId\(\)/, "svg ids are namespaced per instance")
assert.doesNotMatch(src, /url\(#[a-z]/, "svg references are built from the instance id")
assert.match(src, /prefers-reduced-motion/, "honours reduced motion")
assert.match(src, /\(prefers-reduced-motion: reduce\)"\)/, "and reads it in JS to skip the edge animation")
for (const [i, d] of demos.entries()) assert.match(d, /from "@\/components\/ui\/agent-console-template"/, demoFiles[i] + " imports the installed path")
assert.match(demos[0], /return <AgentConsoleTemplate \/>/, "default demo is the template, full page, no wrapper")
for (const d of demos.slice(1)) assert.match(d, /storageKey="agent-console-template-[a-z]+"/, "each extra demo saves under its own key")

const css = src.match(/const ACT_CSS = `([\s\S]*?)`\n/)
assert.ok(css, "CSS block present")
assert.doesNotMatch(css[1], /\$\{|`/, "no backticks or interpolation inside the CSS string")
assert.doesNotMatch(css[1], /url\(/, "no url() in the style block")
// Split on top-level commas only: ".act-root :where(h2, h3)" is one selector.
const parts = (sel) => {
  const out = [""]
  let depth = 0
  for (const ch of sel) {
    if (ch === "(") depth++
    if (ch === ")") depth--
    if (ch === "," && !depth) out.push("")
    else out[out.length - 1] += ch
  }
  return out.map((x) => x.trim())
}
let rules = 0
for (const m of css[1].replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(?<=^|[{}])\s*([^{}]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || /^(from|to|[\d.,%\s]+)$/.test(sel)) continue
  rules++
  for (const s of parts(sel)) assert.match(s, /^\.act-/, `selector escapes the component: ${s}`)
}
assert.ok(rules > 200, `expected the scope check to see real rules, saw ${rules}`)
assert.match(css[1], /\.act-svg \{[^}]*max-width: none/, "svgs are guarded against Preflight")
assert.match(css[1], /\.act-root \{[^}]*height: var\(--act-h\)/, "the root takes its height from the prop")
assert.match(css[1], /\.act-root \{[^}]*display: flex/, "and lays the app out as a column inside it, with no height chain")
assert.doesNotMatch(src, /act-backdrop|act-win\b|act-dock|Close window/, "no backdrop, floating window or fake window controls")

/* ---------- it behaves like an app ---------- */

assert.match(src, /window\.localStorage\.getItem\(storageKey\)/, "sessions load from storage")
assert.match(src, /window\.localStorage\.setItem\(storageKey/, "and save to it")
assert.match(src, /try \{\s*snap = readSnapshot/, "a blocked storage read cannot break the app")
assert.match(src, /e\.key === "Enter"/, "⌘/Ctrl+Enter sends, approves or saves")
assert.match(src, /e\.key\.toLowerCase\(\) === "k"/, "⌘K searches sessions")
assert.match(src, /role="switch" aria-checked=\{autoNow\}/, "auto-approve is a real switch")
assert.match(src, /role="checkbox" aria-checked=\{on\}/, "TODO lines are real checkboxes")
assert.match(src, /role="dialog" aria-modal="true"/, "the machine viewer is a modal dialog")
assert.match(src, /role="menu"/, "sessions have an actions menu")
assert.match(src, /role="log"/, "the transcript is announced as a log")
for (const l of ["New session", "Stop the run", "Machine panel", "Settings", "Close machine panel"]) {
  assert.ok(src.includes(`"${l}"`), `${l} is labelled`)
}
assert.match(src, /new ResizeObserver\(measure\)/, "the layout answers to the app's own width")
assert.match(src, /job\.ctrl\.abort\(\)/, "stopping or deleting a run aborts its live work")

/* ---------- logic, executed ---------- */

const a = src.indexOf("// #region logic\n")
const b = src.indexOf("// #endregion logic\n")
assert.ok(a > -1 && b > a, "logic region missing")
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(a, b))))

// Machines are named from the request.
assert.equal(L.machineName(L.TODO_PROMPT), "BuildTodoCli")
assert.equal(L.machineName("Fix the flaky checkout test and prove it passes ten times in a row."), "FixCheckoutTest")
assert.equal(L.machineName("Build a CLI that renames photos by the date they were taken."), "BuildPhotoCli")
assert.equal(L.machineName("Research three ways to cache our API and recommend one."), "ResearchCacheApi")
assert.equal(L.machineName("Summarise this week’s incident reports into a one-page brief."), "SummarizeIncidentReport")
assert.equal(L.machineName("Draft a launch checklist for the v2 pricing page."), "DraftLaunchChecklist")
assert.equal(L.machineName(""), "RunTask")
assert.equal(L.machineName("constructor toString"), "RunConstructorTostring", "object keys are not verbs")

// The built-in planner writes seven states with a capped repair loop.
for (const p of ["Build a CLI that renames photos.", "Research three ways to cache our API."]) {
  const m = L.planMachine(p)
  assert.equal(m.states.length, 7, p)
  assert.ok(m.states.at(-2).final && m.states.at(-1).final)
  assert.equal(L.outcomeOf(m.states.at(-1)), "failure")
  const warnings = L.lintMachine(m)
  assert.equal(warnings.length, 1, "only the loop is worth a warning: " + warnings.join(" | "))
  assert.match(warnings[0], /can loop/)
}

// The TODO machine: one warning, seven states, and the screenshot's store.
const M = L.TODO_MACHINE
assert.equal(M.states.length, 7)
assert.deepEqual(L.lintMachine(M), ["RepairCli → VerifyCli can loop. Each state gets 3 visits, then the run goes to Abandoned."])
assert.deepEqual(
  L.storeKeys(M).map((k) => k.key + ":" + k.kind),
  ["implementationPlan:agent", "repairTarget:agent", "verificationPassed:observed", "simulationDataDir:set"],
)

// Lint catches real mistakes.
const bw = L.lintMachine({ name: "B", states: [{ id: "A", next: "Nowhere" }, { id: "C", next: "A" }] })
assert.ok(bw.some((w) => /points at Nowhere/.test(w)))
assert.ok(bw.some((w) => /no final state/.test(w)))
assert.ok(bw.some((w) => /C is never reached/.test(w)))

// A run, beat by beat.
let r = L.createRun("t", "s1", L.TODO_PROMPT, M)
assert.equal(r.phase, "deciding")
assert.equal(r.session, "s1")
assert.equal(r.store.simulationDataDir, ".todo-simulation-data", "set keys start filled")
r = L.tick(r)
assert.equal(r.phase, "authored")
assert.equal(r.events.at(-1).warnings.length, 1)
r = L.tick(r)
assert.equal(r.phase, "awaiting")
assert.equal(L.tick(r), r, "nothing runs before approval")
assert.equal(L.stop(r), r, "and there is nothing to stop")
r = L.approve(r)
assert.equal(r.phase, "running")
assert.equal(r.current, "InspectWorkspace")
assert.deepEqual(r.events.slice(-3).map((e) => e.kind), ["approved", "executing", "enter"])
assert.equal(r.events.at(-2).states, 7)

// A held run waits for its planner; authoring it gives it a machine and its store.
const held = L.createRun("h", "s1", "x", L.EMPTY_MACHINE, true)
assert.equal(L.tick(held), held, "the clock leaves a held run alone")
const authored = L.authorRun(held, M)
assert.equal(authored.held, false)
assert.equal(authored.store.simulationDataDir, ".todo-simulation-data")
assert.equal(L.tick(authored).phase, "authored")
const failed = L.fail(held, "Could not write a machine: offline")
assert.equal(failed.phase, "abandoned")
assert.equal(failed.events.at(-1).kind, "error")

// Stopping holds the run exactly where it was; ending it finishes it.
const paused = L.stop(r)
assert.equal(paused.phase, "stopped")
assert.equal(L.tick(paused), paused)
const back = L.resume(paused)
assert.equal(back.phase, "running")
assert.equal(back.current, r.current)
assert.equal(back.cursor, r.cursor)
const ended = L.endRun(paused)
assert.equal(ended.phase, "abandoned")
assert.deepEqual(ended.events.at(-1), { kind: "finish", state: "InspectWorkspace", outcome: "abandoned" })

// The primitives a live executor uses.
let live = L.logStep(r, "$ ls")
assert.deepEqual(live.events.at(-1), { kind: "step", state: "InspectWorkspace", text: "$ ls" })
live = L.writeStore(live, "implementationPlan", "Plan A")
assert.equal(live.store.implementationPlan, "Plan A")
live = L.advanceRun(live)
assert.equal(live.current, "ImplementCli")
assert.equal(live.transitions, 1)
const typed = L.setInput(live, "simulationDataDir", ".data")
assert.equal(typed.store.simulationDataDir, ".data")
assert.equal(typed.events.at(-1).kind, "input")

// Run to the end: verification fails once, repair, pass, simulate, done.
const end = L.fastForward(r, (x) => x.phase === "done" || x.phase === "abandoned")
assert.equal(end.phase, "done")
assert.equal(end.current, "Done")
assert.deepEqual(
  end.events.filter((e) => e.kind === "enter").map((e) => e.state),
  ["InspectWorkspace", "ImplementCli", "VerifyCli", "RepairCli", "VerifyCli", "RunSimulation", "Done"],
)
assert.equal(end.transitions, 6)
assert.equal(end.visits.VerifyCli, 2)
assert.equal(end.store.verificationPassed, true)
assert.match(end.store.repairTarget, /0-based index/)
assert.ok(end.events.some((e) => e.kind === "step" && e.text === "[x] 1  Draft project charter"))

// A check that never passes hits the cap and lands in the failure state.
const stuck = { ...M, states: M.states.map((s) => (s.id === "VerifyCli" ? { ...s, values: { verificationPassed: false } } : s)) }
const lost = L.fastForward(L.createRun("s", "s1", "x", stuck), (x) => x.phase === "done" || x.phase === "abandoned")
assert.equal(lost.phase, "abandoned")
assert.equal(lost.current, "Abandoned")
assert.equal(lost.edge.via, "visit cap")
assert.equal(lost.visits.VerifyCli, 3, "the cap is three visits")

// Declining ends it without running anything.
const waiting = L.fastForward(L.createRun("d", "s1", "x", M), (x) => x.phase === "awaiting")
const no = L.decline(waiting)
assert.equal(no.phase, "declined")
assert.ok(!no.events.some((e) => e.kind === "enter"))

// Editing before approval swaps the machine and keeps its simulation scripts.
const edited = L.editMachine(waiting, { ...M, states: M.states.map((s) => ({ id: s.id, final: s.final, outcome: s.outcome, next: s.next, when: s.when, writes: s.writes })) })
assert.equal(edited.events.at(-1).kind, "edited")
assert.ok(L.byId(edited.machine, "VerifyCli").steps, "scripts carried over by state id")
assert.equal(L.editMachine(r, M), r, "a running machine can no longer change")

// Source round-trips through the parser.
const text = L.machineSource(M)
assert.match(text, /^machine BuildTodoCli\n  max visits 3\n/)
assert.match(text, /\n  set      simulationDataDir = "\.todo-simulation-data"\n/)
assert.match(text, /\ninitial InspectWorkspace\n  writes implementationPlan\n  otherwise -> ImplementCli\n  prompt\n    \| /)
assert.match(text, /\n  when verificationPassed -> RunSimulation\n  otherwise -> RepairCli\n/)
assert.match(text, /\nfinal Abandoned failure\n$/)
for (const l of text.split("\n")) assert.ok(l.length <= 72, "wrapped: " + l)
const back2 = L.parseMachine(text)
assert.deepEqual(back2.errors, [])
// Store kinds come back spelled out ("agent" is the default either way).
const strip = (m) => ({ ...m, store: m.store.map((k) => ({ kind: "agent", ...k })), states: m.states.map(({ steps, values, ...s }) => s) })
assert.deepEqual(back2.machine, strip(M), "parseMachine(machineSource(m)) gives m back, minus simulation scripts")
assert.deepEqual(L.machineSource(back2.machine), text)

// The parser points at the line that is wrong.
const bad = L.parseMachine("machine X\nstate A\n  otherwise -> B\n  sideways -> C\nfinal B maybe\n")
assert.equal(bad.machine, null)
assert.deepEqual(bad.errors, ["Line 4: expected writes, when, otherwise or prompt.", "Line 5: a final state can only be marked failure or success."])
assert.deepEqual(L.parseMachine("state A").errors, ["Name the machine on the first line: machine YourMachineName"])
const moved = L.parseMachine("machine Y\nstate B\n  otherwise -> A\ninitial A\n  otherwise -> B\nfinal Z\n")
assert.equal(moved.machine.states[0].id, "A", "the initial state moves to the front")
assert.equal(L.parseValue("5"), 5)
assert.equal(L.parseValue("true"), true)
assert.equal(L.parseValue('"x y"'), "x y")
assert.equal(L.parseValue("plain words"), "plain words")

// Sessions can start anywhere.
const plan = (p) => L.planMachine(p)
assert.equal(L.seedRun("a", "s", { prompt: "Build a CLI.", status: "awaiting" }, plan).phase, "awaiting")
assert.equal(L.seedRun("b", "s", { prompt: "Build a CLI.", status: "done" }, plan).phase, "done")
const mid = L.seedRun("c", "s", { prompt: L.TODO_PROMPT, machine: M, status: "running", at: "VerifyCli" }, plan)
assert.equal(mid.current, "VerifyCli")
assert.equal(mid.cursor, 0)

// Pacing never stalls.
for (let x = L.approve(L.fastForward(L.createRun("p", "s", "x", M), (y) => y.phase === "awaiting")); x.phase === "running"; x = L.tick(x)) {
  const d = L.beatDelay(x)
  assert.ok(d >= 500 && d <= 1500, "beat " + d)
}

// The live simulation plays a state's script through the executor interface, and stops when aborted.
{
  const lines = []
  const writes = {}
  const ctrl = new AbortController()
  const state = L.byId(M, "VerifyCli")
  await L.simulateState(
    { machine: M, state, visit: 2, prompt: "x", store: {}, previous: [], signal: ctrl.signal, log: (l) => lines.push(l), write: (k, v) => (writes[k] = v) },
    1000,
  )
  assert.deepEqual(lines, L.stepsFor(state, 2))
  assert.deepEqual(writes, { verificationPassed: true })
  const stopper = new AbortController()
  const pending = L.simulateState(
    { machine: M, state, visit: 1, prompt: "x", store: {}, previous: [], signal: stopper.signal, log: () => {}, write: () => {} },
    1,
  )
  stopper.abort()
  await assert.rejects(pending, /aborted/)
}

// Saved state comes back, and junk does not break anything.
const snap = { v: 1, sessions: [{ id: "s1", title: "T", created: 1 }], runs: [end, { id: "orphan", session: "gone" }], active: "s1", prefs: { theme: "night" } }
const read2 = L.readSnapshot(JSON.stringify(snap))
assert.equal(read2.runs.length, 1, "runs whose session is gone are dropped")
assert.equal(read2.runs[0].phase, "done")
assert.equal(read2.prefs.theme, "night")
for (const junk of [null, "", "{", "[]", '{"v":2}', '{"v":1,"sessions":3,"runs":[]}']) assert.equal(L.readSnapshot(junk), null, "junk: " + junk)

// Markdown export carries the whole session.
const md = L.transcriptMarkdown("Todo CLI", [end], ".cairn")
assert.match(md, /^# Todo CLI\n\n## You asked\n\n> I would like you/)
assert.match(md, /### VerifyCli \(visit 2\)/)
assert.match(md, /- wrote \*\*verificationPassed\*\* = true/)
assert.match(md, /\*\*Finished in Done\.\*\*/)
assert.match(md, /<summary>BuildTodoCli\.cairn<\/summary>/)
assert.equal(L.slugify("Todo CLI: v2!"), "todo-cli-v2")

// Layout: columns by depth, finals last, the loop arcs underneath.
const G = L.layoutMachine(M)
assert.equal(G.nodes.length, 7)
const col = Object.fromEntries(G.nodes.map((n) => [n.id, n.col]))
assert.deepEqual(col, { InspectWorkspace: 0, ImplementCli: 1, VerifyCli: 2, RunSimulation: 3, RepairCli: 3, Done: 4, Abandoned: 4 })
assert.ok(G.nodes.find((n) => n.id === "Done").y < G.nodes.find((n) => n.id === "Abandoned").y, "success sits above failure")
assert.ok(G.edges.find((e) => e.from === "RepairCli" && e.to === "VerifyCli").back, "RepairCli → VerifyCli is the back edge")
assert.ok(G.edges.some((e) => e.kind === "cap" && e.to === "Abandoned"), "looping states show their way out")
for (const e of G.edges) assert.match(e.d, /^M[\d. -]+C[\d. -]+$/, "edges are plain cubic paths")
for (const n of G.nodes) assert.ok(n.x >= 0 && n.y >= 0 && n.x + n.w <= G.width && n.y + n.h <= G.height, n.id + " fits")
assert.deepEqual(L.layoutMachine({ name: "E", states: [] }).nodes, [])

// Store keys and backticked text become chips; everything else stays text.
assert.deepEqual(L.splitCode("Record it in implementationPlan, see `todo ls`.", ["implementationPlan", "plan"]), [
  { text: "Record it in ", code: false },
  { text: "implementationPlan", code: true },
  { text: ", see ", code: false },
  { text: "todo ls", code: true },
  { text: ".", code: false },
])
assert.deepEqual(L.splitCode("no keys here", ["a.b"]), [{ text: "no keys here", code: false }], "odd key names are ignored, not injected")

// Transcript lines are classified for styling.
assert.equal(L.lineKind("$ todo ls"), "cmd")
assert.equal(L.lineKind("[x] 1  Draft project charter"), "check")
assert.equal(L.lineKind("TypeError: cannot read properties"), "fail")
assert.equal(L.lineKind("1 of 6 checks failed"), "fail")
assert.equal(L.lineKind("6 of 6 checks passed"), "pass")
assert.equal(L.lineKind("read lib/store.js:41"), "tool")
assert.equal(L.lineKind("count buttons: 38"), "tool")
assert.equal(L.lineKind("ids are 1-based on screen"), "out")

console.log("agent-console-template: ok")
