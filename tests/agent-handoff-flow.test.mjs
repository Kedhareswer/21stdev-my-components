// Install-safety, wiring and routing check for components/agent-handoff-flow.
// Run: node tests/agent-handoff-flow.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const src = readFileSync(new URL("../components/agent-handoff-flow/agent-handoff-flow.tsx", import.meta.url), "utf8").replace(/\r\n/g, "\n")

/* ---------- install safety ---------- */

const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "the only import may be react")
assert.doesNotMatch(src, /@import|https?:\/\/|\bfetch\(|<img|@font-face/, "no external assets: every icon is a pixel grid drawn inline")
// The 21st CLI's dependency scanner reads `<Name` as a JSX tag and can hang on generic calls in the body.
assert.doesNotMatch(src, /\b(?:useRef|useState|useMemo|useCallback|new Map|new Set)<[A-Za-z"{(]/, "no generic type arguments in the body, use `x as T`")

assert.ok(src.includes('height = "100svh"'), "root height must default to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full anywhere: the stage is sized by the height prop")
assert.match(src, /className="ahf-icon"[\s\S]{0,200}/, "icons carry the ahf-icon class")

const css = src.slice(src.indexOf("const CSS = `") + 13, src.indexOf("\n`\n", src.indexOf("const CSS = `")))
assert.ok(css.length > 1500, "could not extract the style block")
assert.doesNotMatch(css, /`|\$\{/, "no template syntax inside the CSS string")
assert.doesNotMatch(css, /@import/, "no @import")
for (const line of css.split("\n")) {
  const m = line.match(/^\s*([^@{}/*][^{]*)\{/)
  if (!m) continue
  for (const sel of m[1].split(",")) {
    const s = sel.trim()
    if (!s || /^(from|to|\d+%)/.test(s)) continue
    assert.ok(s.startsWith(".ahf-"), "selector escapes the component: " + s)
  }
}
assert.match(css, /\.ahf-icon\{[^}]*max-width:none/, "guard Preflight on the pixel icons")
assert.match(css, /prefers-reduced-motion: reduce/, "reduced motion switches the CSS motion off")
assert.match(src, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/, "and the JS timeline honours it too")

// Ids are per instance, so two flows on one page don't share arrowheads.
assert.match(src, /React\.useId\(\)/)
assert.doesNotMatch(src, /\bid="/, "no literal ids")

// Cleanup.
for (const gone of ["ro.disconnect()", "io.disconnect()", "cancelAnimationFrame(raf)", "clearInterval(iv)", 'removeEventListener("change", on)']) {
  assert.ok(src.includes(gone), "cleanup is missing " + gone)
}

// Accessibility.
assert.match(src, /aria-pressed=\{pinned === i\}/, "agents are toggle buttons for pinning")
assert.match(src, /role="status"/, "progress reaches screen readers")
assert.match(src, /aria-live="polite"/, "the answer is announced")
assert.match(src, /e\.key === "Escape"/, "Escape stops a run")

// Demos import the installer's path and fill the width.
const tsconfig = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")
assert.ok(tsconfig.includes('"@/components/ui/agent-handoff-flow"'), "tsconfig paths line is missing")
for (const demo of ["demo.tsx", "demo-night.tsx"]) {
  const d = readFileSync(new URL("../components/agent-handoff-flow/" + demo, import.meta.url), "utf8")
  assert.ok(d.includes('from "@/components/ui/agent-handoff-flow"'), demo + " must import the installed path")
  assert.ok(d.includes('className="w-full"'), demo + " must not shrink inside 21st's flex wrapper")
}

/* ---------- the real logic ---------- */

const start = src.indexOf("// #region flow")
const end = src.indexOf("// #endregion", start)
assert.ok(start > -1 && end > start, "flow region markers missing")
const m = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))

const inside = (b, frame) => b.x >= frame.x && b.y >= frame.y && b.x + b.w <= frame.x + frame.w && b.y + b.h <= frame.y + frame.h
const overlap = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h

for (const orientation of ["row", "column"]) {
  for (let n = 1; n <= m.MAX_AGENTS; n++) {
    const L = m.layoutFlow(n, orientation)
    const tag = orientation + "/" + n
    assert.equal(L.agents.length, n, tag)
    assert.equal(L.gates.length, n, tag + ": one gate per agent, the last is the tail")
    assert.equal(L.chips.length, n, tag + ": the intake chip plus one per handoff")
    const all = [...L.agents, ...L.gates, ...L.chips, L.task, L.answer, L.output, L.title, ...(L.log ? [L.log] : [])]
    for (const b of all) assert.ok(b.x >= 0 && b.y >= 0 && b.x + b.w <= L.w && b.y + b.h <= L.h, tag + ": box off the stage " + JSON.stringify(b))
    for (const b of [...L.agents, ...L.gates]) assert.ok(inside(b, L.frame), tag + ": node outside the dashed frame")
    // Nothing solid overlaps.
    const solid = [...L.agents, ...L.gates, L.task, L.answer, L.output, ...(L.log ? [L.log] : [])]
    for (let i = 0; i < solid.length; i++)
      for (let j = i + 1; j < solid.length; j++) assert.ok(!overlap(solid[i], solid[j]), tag + ": boxes " + i + " and " + j + " overlap")
    // Every path the timeline needs exists and has length.
    for (const id of ["intake", "out", ...Array.from({ length: n }, (_, i) => ["a" + i, "b" + i]).flat(), ...Array.from({ length: n - 1 }, (_, i) => "h" + i)]) {
      assert.ok(L.paths[id] && m.pathLength(L.paths[id]) > 10, tag + ": path " + id)
    }
    // Branches all end at the merge point; the out path starts there and ends on the Answer card.
    for (let i = 0; i < n; i++) assert.deepEqual(L.paths["b" + i].at(-1), L.merge, tag + ": b" + i + " misses the merge")
    assert.deepEqual(L.paths.out[0], L.merge)
    const e = L.paths.out.at(-1)
    assert.ok(e[0] >= L.answer.x && e[0] <= L.answer.x + L.answer.w && e[1] >= L.answer.y && e[1] <= L.answer.y + L.answer.h, tag + ": out misses the Answer card")
    // The intake starts on the Task card and the packet lands on the first agent.
    const s = L.paths.intake[0]
    assert.ok(s[0] === L.task.x && s[1] > L.task.y && s[1] < L.task.y + L.task.h, tag)
    assert.equal(L.entry[1], L.agents[0].y)
  }
}
assert.equal(m.layoutFlow(3, "row").w, 1200, "three agents fill the 1200-wide reference")
{
  const L = m.layoutFlow(3, "row")
  assert.ok(L.title.y + L.title.h <= L.chips[0].y, "the intake line and its chip run below the title band")
}
assert.equal(m.layoutFlow(0, "row").agents.length, 1, "clamped below")
assert.equal(m.layoutFlow(99, "row").agents.length, m.MAX_AGENTS, "clamped above")

// Orientation follows the shape of the space.
assert.equal(m.pickOrientation(1440, 800, 3), "row")
assert.equal(m.pickOrientation(390, 700, 3), "column")
assert.equal(m.pickOrientation(0, 0, 3), "row")

// Geometry helpers.
{
  const pts = [[0, 0], [100, 0], [100, 100]]
  const sm = m.smooth(pts)
  assert.deepEqual(sm[0], [0, 0])
  assert.deepEqual(sm.at(-1), [100, 100])
  assert.ok(sm.length > 3, "corners are sampled")
  assert.ok(m.pathLength(sm) < 200 && m.pathLength(sm) > 190, "a rounded corner is a little shorter")
  assert.deepEqual(m.smooth([[0, 0], [0, 0], [5, 0]]), [[0, 0], [5, 0]], "duplicate points are dropped")
  assert.deepEqual(m.pointAt([[0, 0], [10, 0]], 0.5), [5, 0])
  assert.deepEqual(m.pointAt([[0, 0], [10, 0], [10, 10]], 0.75), [10, 5])
  assert.deepEqual(m.pointAt([[0, 0], [10, 0]], 2), [10, 0], "t is clamped")
  assert.match(m.pathD(pts), /^M0 0 L/)
  assert.equal(m.easeInOut(0), 0)
  assert.equal(m.easeInOut(1), 1)
  assert.equal(m.easeInOut(0.5), 0.5)
}

// Routing: the furthest matching agent answers; nothing matching stays with the first.
{
  const agents = [{}, { keywords: ["latest", "weather", "look up"] }, { keywords: ["plot", "chart", "csv"] }]
  assert.equal(m.routeTask("Say hi to the team", agents), 0)
  assert.equal(m.routeTask("Find the LATEST news", agents), 1, "case-insensitive")
  assert.equal(m.routeTask("Chart this week's weather", agents), 2, "a chain answers at its furthest stop")
  assert.equal(m.routeTask("plots please", agents), 2, "keywords match word prefixes")
  assert.equal(m.routeTask("a scatterplot", agents), 0, "but not the middle of a word")
  assert.equal(m.routeTask("can you look up rust", agents), 1, "multi-word keywords")
  assert.equal(m.routeTask("sum sales.csv", agents), 2, "punctuation splits words")
  assert.equal(m.routeTask("", agents), 0)
  assert.equal(m.routeTask("tips for Node.js", [{}, { keywords: ["node.js"] }]), 1, "keywords are split the same way")
}

// Timelines: the packet visits every agent up to the answerer, in order, then leaves by that agent's branch.
{
  const L = m.layoutFlow(3, "row")
  for (let k = 0; k < 3; k++) {
    const steps = m.buildTimeline(L, k)
    const moves = steps.filter((s) => s.kind === "move").map((s) => s.path)
    const expect = ["intake"]
    for (let i = 0; i <= k; i++) {
      expect.push("a" + i)
      if (i < k) expect.push("h" + i)
    }
    expect.push("b" + k, "out")
    assert.deepEqual(moves, expect, "route to " + k)
    const said = steps.filter((s) => s.kind === "hold").map((s) => s.say.what + s.say.who)
    assert.equal(said[0], "receive0")
    assert.equal(said.at(-1), "deliver" + k)
    assert.equal(said.filter((x) => x.startsWith("handoff")).length, k)
    assert.equal(said.filter((x) => x.startsWith("answer")).length, 1)
    for (const s of steps) assert.ok(s.ms > 0 && s.ms <= 1500, "every step takes a sane time")
    const entry = steps[1].pts.at(-1)
    assert.deepEqual(entry, L.entry, "the intake packet lands on the first agent")
    // Moves chain end to start.
    const mv = steps.filter((s) => s.kind === "move")
    for (let i = 1; i < mv.length; i++) {
      const a = mv[i - 1].pts.at(-1)
      const b = mv[i].pts[0]
      assert.ok(Math.hypot(a[0] - b[0], a[1] - b[1]) < 130, "the packet jumps between " + mv[i - 1].path + " and " + mv[i].path)
    }
  }
  assert.equal(m.buildTimeline(L, 99).filter((s) => s.kind === "move").at(-2).path, "b2", "answerer is clamped")
  assert.equal(m.buildTimeline(m.layoutFlow(4, "column"), 3).length, m.buildTimeline(m.layoutFlow(4, "row"), 3).length, "same trip in either orientation")
}

// Pixel art.
{
  for (const [name, rows] of Object.entries(m.ICONS)) {
    assert.ok(rows.length > 1 && rows.every((r) => /^[#.]+$/.test(r) && r.length === rows[0].length), "icon " + name + " is not a clean rectangle")
    assert.ok(rows.join("").includes("#"), name + " is empty")
  }
  for (const name of ["globe", "braces", "router", "dots", "database", "mail", "spark"]) {
    for (const r of m.ICONS[name]) assert.equal(r, [...r].reverse().join(""), name + " should be mirror-symmetric")
  }
  assert.deepEqual(m.parseIcon("#.|.#"), ["#.", ".#"])
  assert.deepEqual(m.parseIcon(undefined), m.ICONS.spark)
  assert.deepEqual(m.parseIcon(" | "), m.ICONS.spark)
  assert.equal(m.gridPath(["##.", ".##"]), "M0 0h2v1h-2zM1 1h2v1h-2z", "runs are merged per row")
}

console.log("agent-handoff-flow: ok")
