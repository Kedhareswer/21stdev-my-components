// Install-safety and ledger-logic checks for components/ledger-ops-dashboard.
// Run: node tests/ledger-ops-dashboard.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const dir = new URL("../components/ledger-ops-dashboard/", import.meta.url)
const src = readFileSync(new URL("ledger-ops-dashboard.tsx", dir), "utf8")

const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo.tsx", "ledger-ops-dashboard.tsx"])
assert.ok(src.includes('height = "100svh"'), "page height defaults to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.doesNotMatch(src, /use(Ref|State|Memo|Callback|Effect)</, "no generic hook type arguments (they hang the 21st CLI)")

const css = src.slice(src.indexOf("const CSS = ["), src.indexOf('].join("")'))
assert.doesNotMatch(css, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS")
assert.doesNotMatch(css, /font:[^;"]*inherit\b[^;"]*;font-family/, "no font shorthand with inherit")
const flat = css.replace(/",\s*\n\s*"/g, "").replace(/"\s*\+\s*(SPRING|SERIF)\s*\+\s*"/g, "")
let rules = 0
for (const m of flat.matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || sel.startsWith("const CSS") || /^(\d+%(,\d+%)*|to|from)$/.test(sel)) continue
  rules++
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".lod-")), "unscoped selector: " + sel)
}
assert.ok(rules >= 80, "scope check saw real rules: " + rules)
for (const [, v] of src.matchAll(/var\((--[a-z-]+)/g)) assert.match(v, /^--(bg|panel|ink|mute|faint|line|side|acc|heat|n|r|i|v|h|d|c|s)$/, "token not guaranteed in a host: " + v)
assert.deepEqual([...src.matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0]), [], "fetches nothing")
assert.match(flat, /\.lod-root\[data-theme=dark\]\{--bg:/, "dark theme is its own token set")
assert.match(flat, /\.lod-in \.lod-bar i\{[^}]*animation:lod-grow/, "bars re-grow on range change through a keyframe, not a transition")

assert.match(src, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/, "reduced motion is read")
assert.match(flat, /@media \(prefers-reduced-motion:reduce\)/, "CSS honours reduced motion")
assert.ok(src.includes("cancelAnimationFrame(raf)") && src.includes("io.disconnect()"), "count-up and observer are cleaned up")
assert.doesNotMatch(src, /getBoundingClientRect|offset(Top|Left|Width|Height)|client(Width|Height)|scrollHeight|getComputedStyle|inner(Width|Height)/, "no layout reads")
assert.ok(src.includes('role="switch"') && src.includes('role="tablist"') && src.includes('aria-pressed={r === range}'), "switch, tabs and range semantics")
assert.ok(src.includes('el.closest(".dark")'), "follows a host .dark class when no theme is forced")

const start = src.indexOf("// #region ledger")
const end = src.indexOf("// #endregion", start)
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))
assert.equal(L.niceTop(184), 200)
assert.equal(L.niceTop(748), 800)
assert.equal(L.niceTop(38), 40)
assert.equal(L.niceTop(0), 1)
assert.equal(L.usd(12800.4), "$12,800")
const rows = [
  { name: "a", stage: "Active", health: "On track" },
  { name: "b", stage: "Planning", health: "At risk" },
  { name: "c", stage: "Review", health: "Needs input" },
]
assert.equal(L.filterRows(rows, "All").length, 3)
assert.deepEqual(L.filterRows(rows, "Active").map((r) => r.name), ["a"])
assert.deepEqual(L.filterRows(rows, "At risk").map((r) => r.name), ["b", "c"], "at risk includes needs input")
console.log("ledger-ops-dashboard ok")
