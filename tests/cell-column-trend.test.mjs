// Install-safety and scale checks for components/cell-column-trend.
// Run: node tests/cell-column-trend.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const dir = new URL("../components/cell-column-trend/", import.meta.url)
const src = readFileSync(new URL("cell-column-trend.tsx", dir), "utf8")

const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "cell-column-trend.tsx", "demo.tsx"])
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.doesNotMatch(src, /use(Ref|State|Memo|Callback|Effect)</, "no generic hook type arguments (they hang the 21st CLI)")

const css = src.slice(src.indexOf("const CSS = ["), src.indexOf('].join("")'))
assert.doesNotMatch(css, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS")
const flat = css.replace(/",\s*\n\s*"/g, "").replace(/"\s*\+\s*(SPRING|MONO)\s*\+\s*"/g, "")
let rules = 0
for (const m of flat.matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || sel.startsWith("const CSS") || /^(\d+%|to|from)$/.test(sel)) continue
  rules++
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".cct-")), "unscoped selector: " + sel)
}
assert.ok(rules >= 40, "scope check saw real rules: " + rules)
for (const [, v] of src.matchAll(/var\((--[a-z-]+)/g)) assert.match(v, /^--(cct-[a-z]+|c|r|h|n|k|flip)$/, "token not guaranteed in a host: " + v)
assert.deepEqual([...src.matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0]), [], "fetches nothing")

assert.match(flat, /@media \(prefers-reduced-motion:reduce\)/, "CSS honours reduced motion")
assert.ok(src.includes("io.disconnect()"), "observer is cleaned up")
assert.doesNotMatch(src, /getBoundingClientRect|offset(Top|Left|Width|Height)|client(Width|Height)|scrollHeight|getComputedStyle|inner(Width|Height)/, "no layout reads")
assert.ok(src.includes('k % 2 ? "cct-b" : "cct-a"'), "switching metric swaps the keyframe name so the flip replays")
assert.ok(src.includes('role="tablist"') && src.includes("aria-selected={i === k}") && src.includes('aria-live="polite"'), "tabs and live tooltip")

const start = src.indexOf("// #region scale")
const end = src.indexOf("// #endregion", start)
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))
assert.equal(L.niceMax(640), 800)
assert.equal(L.niceMax(97000), 100000)
assert.equal(L.niceMax(6.8), 8)
assert.equal(L.niceMax(1000), 1000, "exact powers stay")
assert.equal(L.niceMax(0), 1, "empty data")
assert.deepEqual(L.fill([0, 50, 100, 1], 100, 12), [0, 6, 12, 1])
assert.equal(L.better(-7, false), "good", "falling latency is good")
assert.equal(L.better(5, true), "good")
assert.equal(L.better(5, false), "bad")
assert.equal(L.better(0), "flat")
console.log("cell-column-trend ok")
