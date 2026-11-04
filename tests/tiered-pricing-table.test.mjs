// Install-safety and pricing-math checks for components/tiered-pricing-table.
// Run: node tests/tiered-pricing-table.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const slug = "tiered-pricing-table"
const dir = new URL("../components/" + slug + "/", import.meta.url)
const src = readFileSync(new URL(slug + ".tsx", dir), "utf8")
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")

// ---- install safety ------------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo.tsx", slug + ".tsx"])
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.doesNotMatch(src + demo, /use(Ref|State|Memo|Callback|Effect)</, "no generic hook type arguments")
assert.doesNotMatch(src, /\binert\b/, "no inert: React 18 and 19 disagree on its value")
assert.ok(src.length < 100_000, "lean: " + src.length)

const cssAt = src.indexOf("const CSS =")
const css = src.slice(cssAt, src.indexOf("\n\n", cssAt))
assert.doesNotMatch(css, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS string")
const flat = css.replace(/"\s*\+\s*\n\s*"/g, "").replace(/url\([^)]*\)/g, "url()")
let rules = 0
for (const m of flat.matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || sel.startsWith("const CSS") || sel.startsWith("FONT") || /^(from|to|\d+%)/.test(sel)) continue
  rules++
  assert.ok(sel.split(",").every((s) => s.trim().replace(/^:where\(\.dark\)\s+/, "").startsWith(".tpt-")), "unscoped selector: " + sel)
}
assert.ok(rules >= 80, "the scope check saw real rules, saw " + rules)
for (const [, v] of src.matchAll(/var\((--[a-z-]+)/g)) assert.ok(v.startsWith("--tpt-"), "token not guaranteed in a host: " + v)
assert.deepEqual([...src.matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0]), [], "fetches nothing")
assert.deepEqual([...demo.matchAll(/["'(]https?:\/\//g)], [], "demo is self-contained")

// ---- a11y and motion ---------------------------------------------------------------
assert.ok(src.includes('role="radiogroup"') && src.includes('role="radio"') && src.includes('e.key === "ArrowLeft"'), "billing is a keyboard radiogroup")
assert.ok(src.includes('className="tpt-sr"') && src.includes("per month"), "the rolling price has a readable twin")
assert.ok(src.includes('aria-label="Remove a seat"') && src.includes('aria-label="Add a seat"') && src.includes('htmlFor={uid + "seats"}'), "seat stepper is labelled")
assert.ok(src.includes("aria-expanded={open}") && src.includes('aria-controls={uid + "cmp"}'), "the fold is announced")
assert.match(flat, /\.tpt-fold:not\(\[data-open=true\]\)>div\{visibility:hidden/, "a closed fold leaves the tab order")
assert.ok(src.includes("<caption") && src.includes('scope="row"') && src.includes('>Not included<'), "comparison table semantics")
assert.match(flat, /@media \(prefers-reduced-motion:reduce\)/, "reduced motion honoured")
assert.doesNotMatch(src, /getBoundingClientRect|offset(Top|Left|Width|Height)|client(Width|Height)|scrollHeight|getComputedStyle|inner(Width|Height)|requestAnimationFrame/, "no layout reads, no RAF")

// ---- the lifted pricing math -------------------------------------------------------
const start = src.indexOf("// #region pricing")
const end = src.indexOf("// #endregion", start)
assert.ok(start > -1 && end > start, "region markers missing")
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))

assert.equal(L.priceFor(24, false, 0.2), 24)
assert.equal(L.priceFor(24, true, 0.2), 19, "24 × 0.8 = 19.2 rounds to 19")
assert.equal(L.priceFor(18, true, 0.2, 5), 70, "per-seat rounds the unit, then multiplies")
assert.equal(L.priceFor(0, true, 0.2), 0)
assert.equal(L.priceFor(null, true, 0.2), null, "talk-to-us tiers have no price")
assert.equal(L.priceFor(18, false, 0.2, 0), 18, "at least one seat")
assert.equal(L.billedTotal(24, true, 0.2), 228, "yearly invoices 12 months")
assert.equal(L.billedTotal(24, false, 0.2), 24)
assert.equal(L.billedTotal(null, true, 0.2), null)
assert.equal(L.clampSeats(NaN), 1, "garbage input falls back to one seat")
assert.equal(L.clampSeats(0), 1)
assert.equal(L.clampSeats(9999), 500)
assert.equal(L.clampSeats(7.6), 8)
assert.equal(L.money(1260), "1,260")

console.log(slug + ": ok")
