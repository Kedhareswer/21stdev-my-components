// Install-safety and money-logic checks for components/odometer-currency-converter.
// Run: node tests/odometer-currency-converter.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const slug = "odometer-currency-converter"
const dir = new URL("../components/" + slug + "/", import.meta.url)
const src = readFileSync(new URL(slug + ".tsx", dir), "utf8")
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")

// ---- install safety ------------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo.tsx", slug + ".tsx"])
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.doesNotMatch(src, /use(Ref|State|Memo|Callback|Effect)</, "no generic hook type arguments")
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
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".occ-")), "unscoped selector: " + sel)
}
assert.ok(rules >= 50, "the scope check saw real rules, saw " + rules)
for (const [, v] of src.matchAll(/var\((--[a-z-]+)/g)) assert.ok(v.startsWith("--occ-"), "token not guaranteed in a host: " + v)
assert.deepEqual([...src.matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0]).filter((u) => !u.startsWith("http://www.w3.org/")), [], "fetches nothing")
assert.deepEqual([...demo.matchAll(/["'(]https?:\/\//g)], [], "demo is self-contained")

// ---- a11y and motion ---------------------------------------------------------------
assert.ok(src.includes('role="listbox"') && src.includes('role="option"') && src.includes("aria-activedescendant"), "listbox semantics")
assert.ok(src.includes('aria-haspopup="listbox"') && src.includes("aria-expanded={open}"), "picker buttons announce their popup")
for (const k of ['"ArrowDown"', '"ArrowUp"', '"Home"', '"End"', '"Escape"', '"Enter"']) assert.ok(src.includes(k), "listbox key " + k)
assert.ok(src.includes("aria-invalid={tooBig}") && src.includes('role="alert"'), "over-limit amounts are flagged")
assert.match(src, /htmlFor=\{uid \+ "-amt"\}/, "the amount is labelled")
assert.match(flat, /@media \(prefers-reduced-motion:reduce\)/, "reduced motion honoured")
assert.doesNotMatch(src, /getBoundingClientRect|offset(Top|Left|Width|Height)|client(Width|Height)|scrollHeight|getComputedStyle|inner(Width|Height)|requestAnimationFrame/, "no layout reads, no RAF")
assert.ok(src.includes("clearInterval(t)") && src.includes("clearTimeout(t)"), "timers are cleaned up")

// ---- the lifted logic ------------------------------------------------------------
const start = src.indexOf("// #region money")
const end = src.indexOf("// #endregion", start)
assert.ok(start > -1 && end > start, "region markers missing")
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))

assert.equal(L.crossRate(1, 0.92), 0.92)
assert.ok(Math.abs(L.crossRate(0.92, 151.42) - 164.587) < 0.001, "EUR to JPY goes through USD")
assert.equal(L.crossRate(0, 5), 0, "a zero price can't divide")
assert.equal(L.formatAmount(1234.5, 2), "1,234.50")
assert.equal(L.formatAmount(1000000, 0), "1,000,000")
assert.equal(L.formatAmount(0.005, 2), "0.01")
assert.equal(L.formatAmount(-42.1, 2), "-42.10")
assert.equal(L.cleanInput("1,234.567", 2), "1234.56", "commas dropped, two places kept")
assert.equal(L.cleanInput("12.3.4", 2), "12.34", "only one dot survives")
assert.equal(L.cleanInput("abc9x", 2), "9")
assert.equal(L.cleanInput("12.5", 0), "12", "zero-decimal currencies drop the fraction")
assert.equal(L.cleanInput("0005", 2), "5", "leading zeros go")
assert.equal(L.cleanInput("0.5", 2), "0.5", "but not the one before the dot")
assert.equal(L.groupTyped("1234."), "1,234.", "a trailing dot stays while typing")
assert.equal(L.groupTyped("1234567.10"), "1,234,567.10")
assert.equal(L.groupTyped(""), "")
const h = L.history("USDEUR", 0.92)
assert.equal(h.length, 30)
assert.equal(h[29], 0.92, "the history ends on today's rate")
assert.deepEqual(L.history("USDEUR", 0.92), h, "same pair, same history")
assert.notDeepEqual(L.history("USDGBP", 0.92), h, "different pair, different history")

console.log(slug + ": ok")
