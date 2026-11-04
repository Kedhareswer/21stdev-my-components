// Install-safety and level-logic checks for components/led-matrix-sales.
// Run: node tests/led-matrix-sales.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const dir = new URL("../components/led-matrix-sales/", import.meta.url)
const src = readFileSync(new URL("led-matrix-sales.tsx", dir), "utf8")

const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo.tsx", "led-matrix-sales.tsx"])
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.doesNotMatch(src, /use(Ref|State|Memo|Callback|Effect)</, "no generic hook type arguments (they hang the 21st CLI)")

const css = src.slice(src.indexOf("const CSS = ["), src.indexOf('].join("")'))
assert.doesNotMatch(css, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS")
const flat = css.replace(/",\s*\n\s*"/g, "").replace(/"\s*\+\s*SPRING\s*\+\s*"/g, "")
let rules = 0
for (const m of flat.matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || sel.startsWith("const CSS")) continue
  rules++
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".lms-")), "unscoped selector: " + sel)
}
assert.ok(rules >= 25, "scope check saw real rules: " + rules)
for (const [, v] of src.matchAll(/var\((--[a-z-]+)/g)) assert.ok(["--lms-accent", "--c", "--r"].includes(v), "token not guaranteed in a host: " + v)
assert.deepEqual([...src.matchAll(/https?:\/\/(?!www\.w3\.org)[^"'\s)]+/g)].map((m) => m[0]), [], "fetches nothing")

assert.match(src, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/, "reduced motion is read")
assert.match(flat, /@media \(prefers-reduced-motion:reduce\)/, "CSS honours reduced motion")
assert.ok(src.includes('mq.removeEventListener("change", on)') && src.includes("io.disconnect()"), "listeners are cleaned up")
assert.doesNotMatch(src, /getBoundingClientRect|offset(Top|Left|Width|Height)|client(Width|Height)|scrollHeight|getComputedStyle|inner(Width|Height)/, "no layout reads")
assert.ok(src.includes("tabIndex={0}") && src.includes('"ArrowRight"') && src.includes('aria-live="polite"'), "keyboard and live tooltip")

const start = src.indexOf("// #region matrix")
const end = src.indexOf("// #endregion", start)
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))
assert.deepEqual(L.levels([0, 5, 10], 9), [0, 5, 9], "max fills the column, zero stays dark")
assert.deepEqual(L.levels([1, 1000], 9), [1, 9], "tiny non-zero values still light one dot")
assert.deepEqual(L.levels([0, 0], 9), [0, 0], "all-zero board")
assert.deepEqual(L.levels([], 9), [])
assert.equal(L.clampIndex(-3, 5), 0)
assert.equal(L.clampIndex(9, 5), 4)
assert.equal(L.clampIndex(2, 0), -1, "empty data")
assert.equal(L.dollars(101820.4), "$101,820")
console.log("led-matrix-sales ok")
