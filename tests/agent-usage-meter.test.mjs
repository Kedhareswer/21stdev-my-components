// Install-safety and meter-logic checks for components/agent-usage-meter.
// Run: node tests/agent-usage-meter.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const dir = new URL("../components/agent-usage-meter/", import.meta.url)
const src = readFileSync(new URL("agent-usage-meter.tsx", dir), "utf8")

const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "agent-usage-meter.tsx", "demo.tsx"])
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.doesNotMatch(src, /use(Ref|State|Memo|Callback|Effect)</, "no generic hook type arguments (they hang the 21st CLI)")

const css = src.slice(src.indexOf("const CSS = ["), src.indexOf('].join("")'))
assert.doesNotMatch(css, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS")
assert.doesNotMatch(css, /font:[^;"]*inherit/, "no font shorthand with inherit (invalid, silently dropped)")
const flat = css.replace(/",\s*\n\s*"/g, "").replace(/"\s*\+\s*(SPRING|MONO)\s*\+\s*"/g, "")
let rules = 0
for (const m of flat.matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || sel.startsWith("const CSS") || /^(\d+%|to|from)$/.test(sel)) continue
  rules++
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".aum-")), "unscoped selector: " + sel)
}
assert.ok(rules >= 40, "scope check saw real rules: " + rules)
for (const [, v] of src.matchAll(/var\((--[a-z-]+)/g)) assert.match(v, /^--(aum-accent|i|s|o)$/, "token not guaranteed in a host: " + v)
assert.deepEqual([...src.matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0]), [], "fetches nothing")

assert.match(src, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/, "reduced motion is read")
assert.match(flat, /@media \(prefers-reduced-motion:reduce\)/, "CSS honours reduced motion")
assert.ok(src.includes("window.clearInterval(id)") && src.includes("io.disconnect()"), "tick and observer are cleaned up")
assert.doesNotMatch(src, /requestAnimationFrame|getBoundingClientRect|offset(Top|Left|Width|Height)|client(Width|Height)|scrollHeight|getComputedStyle|inner(Width|Height)/, "no frame loop, no layout reads")
assert.match(flat, /\.aum-drawer\{display:grid;grid-template-rows:0fr/, "drawer height animates through grid rows")
assert.ok(src.includes('role="meter"') && src.includes("aria-pressed={live}") && src.includes("aria-expanded={open}"), "meter and button semantics")

const start = src.indexOf("// #region meter")
const end = src.indexOf("// #endregion", start)
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))
assert.equal(L.litSegments(162, 320, 40), 20)
assert.equal(L.litSegments(400, 320, 40), 40, "over the limit caps at full")
assert.equal(L.litSegments(-5, 320, 40), 0)
assert.equal(L.litSegments(10, 0, 40), 0, "zero limit")
assert.equal(L.money(1.264), "$1.26")
assert.deepEqual(L.shares([{ amount: 3 }, { amount: 1 }]), [0.75, 0.25])
assert.deepEqual(L.shares([{ amount: 0 }]), [0], "empty spend")
console.log("agent-usage-meter ok")
