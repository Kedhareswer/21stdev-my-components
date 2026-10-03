// Install-safety checks and the run engine, executed, for components/agent-machine-console.
// Run: node tests/agent-machine-console.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const SLUG = "agent-machine-console"
const read = (file) => readFileSync(new URL(`../components/${SLUG}/${file}`, import.meta.url), "utf8").replace(/\r\n/g, "\n")
const src = read(`${SLUG}.tsx`)
const demos = ["demo.tsx", "demo-blank.tsx", "demo-night.tsx"].map(read)

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
for (const d of demos) assert.match(d, /from "@\/components\/ui\/agent-machine-console"/, "demos import the installed path")
assert.match(demos[0], /return <AgentMachineConsole \/>/, "default demo is the component, full bleed")

const css = src.match(/const AMC_CSS = `([\s\S]*?)`\n/)
assert.ok(css, "CSS block present")
assert.doesNotMatch(css[1], /\$\{|`/, "no backticks or interpolation inside the CSS string")
assert.doesNotMatch(css[1], /url\(/, "no url() in the style block")
// Split on top-level commas only: ".amc-root :where(h2, h3)" is one selector.
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
  for (const s of parts(sel)) assert.match(s, /^\.amc-/, `selector escapes the component: ${s}`)
}
assert.ok(rules > 150, `expected the scope check to see real rules, saw ${rules}`)
assert.match(css[1], /\.amc-svg \{[^}]*max-width: none/, "svgs are guarded against Preflight")
assert.match(css[1], /\.amc-root \{[^}]*height: var\(--amc-h\)/, "the root takes its height from the prop")
assert.match(css[1], /\.amc-backdrop \{[^}]*position: absolute/, "the backdrop is positioned, so it fills the root without a height chain")
assert.match(css[1], /\.amc-win \{[^}]*position: absolute/, "and so is the window")

/* ---------- it behaves like an app ---------- */

assert.match(src, /e\.key === "Enter" && \(e\.metaKey \|\| e\.ctrlKey\)/, "⌘/Ctrl+Enter sends, or approves")
assert.match(src, /role="switch" aria-checked=\{autoNow\}/, "auto-approve is a real switch")
assert.match(src, /role="checkbox" aria-checked=\{on\}/, "TODO lines are real checkboxes")
assert.match(src, /role="dialog" aria-modal="true"/, "the source viewer is a modal dialog")
assert.match(src, /role="log"/, "the transcript is announced as a log")
for (const l of ["Close window", "Minimize window", "New session", "Stop the run", "Machine panel", "Tweaks"]) {
  assert.ok(src.includes(`"${l}"`), `${l} is labelled`)
}
assert.match(src, /new ResizeObserver\(measure\)/, "the layout answers to the window's own width")

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

// The default planner writes seven states with a capped repair loop.
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
const broken = { name: "B", states: [{ id: "A", next: "Nowhere" }, { id: "C", next: "A" }] }
const bw = L.lintMachine(broken)
assert.ok(bw.some((w) => /points at Nowhere/.test(w)))
assert.ok(bw.some((w) => /no final state/.test(w)))
assert.ok(bw.some((w) => /C is never reached/.test(w)))

// A run, beat by beat.
let r = L.createRun("t", L.TODO_PROMPT, M)
assert.equal(r.phase, "deciding")
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

// Stopping holds the run exactly where it was.
const held = L.stop(r)
assert.equal(held.phase, "stopped")
assert.equal(L.tick(held), held)
const back = L.resume(held)
assert.equal(back.phase, "running")
assert.equal(back.current, r.current)
assert.equal(back.cursor, r.cursor)

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
assert.equal(end.events.filter((e) => e.kind === "leave" && e.via === "verificationPassed").length, 1)
assert.ok(end.events.some((e) => e.kind === "step" && e.text === "[x] 1  Draft project charter"))
assert.equal(end.events.at(-1).kind, "finish")

// A check that never passes hits the cap and lands in the failure state.
const stuck = { ...M, states: M.states.map((s) => (s.id === "VerifyCli" ? { ...s, values: { verificationPassed: false } } : s)) }
const lost = L.fastForward(L.createRun("s", "x", stuck), (x) => x.phase === "done" || x.phase === "abandoned")
assert.equal(lost.phase, "abandoned")
assert.equal(lost.current, "Abandoned")
assert.equal(lost.edge.via, "visit cap")
assert.equal(lost.visits.VerifyCli, 3, "the cap is three visits")

// Declining ends it without running anything.
const no = L.decline(L.fastForward(L.createRun("d", "x", M), (x) => x.phase === "awaiting"))
assert.equal(no.phase, "declined")
assert.ok(!no.events.some((e) => e.kind === "enter"))

// Sessions can start anywhere.
const plan = (p) => L.planMachine(p)
assert.equal(L.seedRun("a", { prompt: "Build a CLI.", status: "awaiting" }, plan).phase, "awaiting")
assert.equal(L.seedRun("b", { prompt: "Build a CLI.", status: "done" }, plan).phase, "done")
const mid = L.seedRun("c", { prompt: L.TODO_PROMPT, machine: M, status: "running", at: "VerifyCli" }, plan)
assert.equal(mid.current, "VerifyCli")
assert.equal(mid.cursor, 0)
assert.equal(L.seedRun("d", { prompt: "" }, plan).phase, "draft")

// Pacing never stalls.
for (let x = L.approve(L.fastForward(L.createRun("p", "x", M), (y) => y.phase === "awaiting")); x.phase === "running"; x = L.tick(x)) {
  const d = L.beatDelay(x)
  assert.ok(d >= 500 && d <= 1500, "beat " + d)
}

// Layout: columns by depth, finals last, the loop arcs underneath.
const G = L.layoutMachine(M)
assert.equal(G.nodes.length, 7)
const col = Object.fromEntries(G.nodes.map((n) => [n.id, n.col]))
assert.deepEqual(col, { InspectWorkspace: 0, ImplementCli: 1, VerifyCli: 2, RunSimulation: 3, RepairCli: 3, Done: 4, Abandoned: 4 })
assert.ok(G.nodes.find((n) => n.id === "Done").y < G.nodes.find((n) => n.id === "Abandoned").y, "success sits above failure")
const loop = G.edges.find((e) => e.from === "RepairCli" && e.to === "VerifyCli")
assert.ok(loop.back, "RepairCli → VerifyCli is the back edge")
assert.ok(G.edges.some((e) => e.kind === "cap" && e.to === "Abandoned"), "looping states show their way out")
for (const e of G.edges) assert.match(e.d, /^M[\d. -]+C[\d. -]+$/, "edges are plain cubic paths")
for (const n of G.nodes) assert.ok(n.x >= 0 && n.y >= 0 && n.x + n.w <= G.width && n.y + n.h <= G.height, n.id + " fits")
assert.deepEqual(L.layoutMachine({ name: "E", states: [] }).nodes, [])

// Source: readable, and every state in it.
const text = L.machineSource(M)
assert.match(text, /^machine BuildTodoCli\n  max visits 3\n/)
assert.match(text, /\n  set      simulationDataDir = "\.todo-simulation-data"\n/)
assert.match(text, /\ninitial InspectWorkspace\n  writes implementationPlan\n  otherwise -> ImplementCli\n  prompt\n    \| /)
assert.match(text, /\n  when verificationPassed -> RunSimulation\n  otherwise -> RepairCli\n/)
assert.match(text, /\nfinal Abandoned failure\n$/)
for (const l of text.split("\n")) assert.ok(l.length <= 72, "wrapped: " + l)

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
assert.equal(L.lineKind("ids are 1-based on screen"), "out")

console.log("agent-machine-console: ok")
