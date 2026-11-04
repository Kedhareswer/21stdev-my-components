// Install-safety and share-math checks for components/channel-share-bar.
// Run: node tests/channel-share-bar.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const dir = new URL("../components/channel-share-bar/", import.meta.url)
const src = readFileSync(new URL("channel-share-bar.tsx", dir), "utf8")

const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "channel-share-bar.tsx", "demo.tsx"])
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.doesNotMatch(src, /use(Ref|State|Memo|Callback)</, "no generic hook type arguments (they hang the 21st CLI)")
assert.doesNotMatch(src, /getBoundingClientRect|offset(Width|Height|Top|Left)|client(Width|Height)|getComputedStyle|innerWidth/, "no layout reads")
assert.match(src, /prefers-reduced-motion/, "honours reduced motion")

const cssAt = src.indexOf("const CSS =")
const css = src.slice(cssAt, src.indexOf("\n\n", cssAt)).replace(/"\s*\+\s*\n\s*"/g, "")
assert.doesNotMatch(css, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS string")
for (const m of css.matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || sel.startsWith("const CSS")) continue
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".csb-")), "unscoped selector: " + sel)
}

// share math, lifted from the #region
const region = src.slice(src.indexOf("// #region math"), src.indexOf("// #endregion"))
const mod = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(region)))
const sum = (a) => Math.round(a.reduce((x, y) => x + y, 0) * 10) / 10
for (const vals of [[8410, 6115, 2490, 1832, 755, 318], [1, 1, 1], [3, 3, 3, 3, 3, 3, 3], [5, 0, 0], [999, 1]]) {
  const p = mod.shares(vals)
  assert.equal(sum(p), 100, "shares add to 100: " + p)
  assert.ok(p.every((x) => Math.round(x * 10) === x * 10), "one decimal")
}
assert.deepEqual(mod.shares([0, 0]), [0, 0], "all-zero input gives zeros")
assert.deepEqual(mod.starts([42.2, 30.7, 27.1]), [0, 42.2, 72.9])
console.log("channel-share-bar: ok")
