// Install-safety and deck-logic checks for components/tilted-metric-deck.
// Run: node tests/tilted-metric-deck.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const dir = new URL("../components/tilted-metric-deck/", import.meta.url)
const src = readFileSync(new URL("tilted-metric-deck.tsx", dir), "utf8")

const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo.tsx", "tilted-metric-deck.tsx"])
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.doesNotMatch(src, /use(Ref|State|Memo|Callback|Effect)</, "no generic hook type arguments (they hang the 21st CLI)")

const css = src.slice(src.indexOf("const CSS = ["), src.indexOf('].join("")'))
assert.doesNotMatch(css, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS")
assert.doesNotMatch(css, /font:[^;"]*inherit\b[^;"]*;font-family/, "no font shorthand with inherit")
const flat = css.replace(/",\s*\n\s*"/g, "").replace(/"\s*\+\s*(SPRING|MONO)\s*\+\s*"/g, "")
let rules = 0
for (const m of flat.matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || sel.startsWith("const CSS") || /^(\d+%|to|from)$/.test(sel)) continue
  rules++
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".tmd-")), "unscoped selector: " + sel)
}
assert.ok(rules >= 40, "scope check saw real rules: " + rules)
for (const [, v] of src.matchAll(/var\((--[a-z-]+)/g)) assert.match(v, /^--(tmd-c|c|z|d|i|s|top)$/, "token not guaranteed in a host: " + v)
assert.deepEqual([...src.matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0]), [], "fetches nothing")

assert.match(src, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)\.matches\) return/, "no autoplay under reduced motion")
assert.match(flat, /@media \(prefers-reduced-motion:reduce\)/, "CSS honours reduced motion")
assert.ok(src.includes("window.clearInterval(id)") && src.includes("io.disconnect()"), "autoplay and observer are cleaned up")
assert.ok(src.includes("setTouched(true)") && src.includes("touched ||"), "the first interaction stops autoplay")
assert.doesNotMatch(src, /requestAnimationFrame|getBoundingClientRect|offset(Top|Left|Width|Height)|client(Width|Height)|scrollHeight|getComputedStyle|inner(Width|Height)/, "no frame loop, no layout reads")
assert.match(flat, /\.tmd-card\.tmd-up\{transform:translateZ\(calc\(var\(--top\)\*30px\)\)/, "the picked card rises above the whole pile")
assert.ok(src.includes('role="tablist"') && src.includes('role="tabpanel"') && src.includes("aria-selected={i === k}"), "tab semantics")

const start = src.indexOf("// #region deck")
const end = src.indexOf("// #endregion", start)
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))
assert.equal(L.colorFor(0), "#ff7a59")
assert.equal(L.colorFor(6), "#ff7a59", "palette wraps")
assert.equal(L.colorFor(1, "#123456"), "#123456", "explicit colour wins")
assert.equal(L.isDrop("−0.4%"), true)
assert.equal(L.isDrop("-3"), true)
assert.equal(L.isDrop("+4 pts"), false)
assert.equal(L.sparkPath([1], 100, 50), "", "one point draws nothing")
assert.equal(L.sparkPath([0, 10], 100, 50), "M0.0 47.0 L100.0 3.0", "min sits low, max sits high")
assert.equal(L.sparkPath([5, 5], 100, 50), "M0.0 47.0 L100.0 47.0", "flat data does not divide by zero")
console.log("tilted-metric-deck ok")
