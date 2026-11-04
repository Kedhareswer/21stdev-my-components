// Install-safety and typing-logic checks for components/aurora-feature-bento.
// Run: node tests/aurora-feature-bento.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const dir = new URL("../components/aurora-feature-bento/", import.meta.url)
const src = readFileSync(new URL("aurora-feature-bento.tsx", dir), "utf8")

const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "aurora-feature-bento.tsx", "demo.tsx"])
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.doesNotMatch(src, /use(Ref|State|Memo|Callback|Effect)</, "no generic hook type arguments (they hang the 21st CLI)")

const css = src.slice(src.indexOf("const CSS = ["), src.indexOf('].join("")'))
assert.doesNotMatch(css, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS")
const flat = css.replace(/",\s*\n\s*"/g, "").replace(/"\s*\+\s*SPRING\s*\+\s*"/g, "")
let rules = 0
for (const m of flat.matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || sel.startsWith("const CSS") || /^(\d+%(,\d+%)*|to|from)$/.test(sel)) continue
  rules++
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".afb-")), "unscoped selector: " + sel)
}
assert.ok(rules >= 45, "scope check saw real rules: " + rules)
for (const [, v] of src.matchAll(/var\((--[a-z-]+)/g)) assert.match(v, /^--(i|a|b|c|t|k|path)$/, "token not guaranteed in a host: " + v)
assert.deepEqual([...src.matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0]), [], "fetches nothing")
assert.match(flat, /\.afb-ui\{position:absolute/, "the mini interfaces sit above the copy")
assert.doesNotMatch(flat, /\.afb-[a-z]+\{position:relative\}/, "nothing overrides the absolute ui panel")

assert.match(src, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/, "reduced motion is read")
assert.match(flat, /@media \(prefers-reduced-motion:reduce\)/, "CSS honours reduced motion")
assert.ok(src.includes("window.clearInterval(id)") && src.includes("window.clearTimeout(done)") && src.includes("io.disconnect()"), "timers and observer are cleaned up")
assert.doesNotMatch(src, /requestAnimationFrame|getBoundingClientRect|offset(Top|Left|Width|Height)|client(Width|Height)|scrollHeight|getComputedStyle|inner(Width|Height)/, "no frame loop, no layout reads")
assert.ok(src.includes('className="afb-sr"') && src.includes('aria-live="polite"'), "full prompt for screen readers, live tool name")

const start = src.indexOf("// #region type")
const end = src.indexOf("// #endregion", start)
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))
assert.deepEqual(L.runs("a *b* c"), [{ text: "a ", bold: false }, { text: "b", bold: true }, { text: " c", bold: false }])
assert.deepEqual(L.runs("*x*"), [{ text: "x", bold: true }])
const r = L.runs("ab *cd* e")
assert.deepEqual(L.sliceRuns(r, 4), [{ text: "ab ", bold: false }, { text: "c", bold: true }])
assert.deepEqual(L.sliceRuns(r, 0), [])
assert.equal(L.sliceRuns(r, 99).map((x) => x.text).join(""), "ab cd e")
assert.equal(L.initials("Meera Shah"), "MS")
assert.equal(L.initials("  theo  "), "T")
console.log("aurora-feature-bento ok")
