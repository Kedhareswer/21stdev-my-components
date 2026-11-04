// Install-safety, GL hygiene and helper checks for components/aura-focus-list.
// Run: node tests/aura-focus-list.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const dir = new URL("../components/aura-focus-list/", import.meta.url)
const src = readFileSync(new URL("aura-focus-list.tsx", dir), "utf8")

const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react only: raw WebGL")
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "aura-focus-list.tsx", "demo-tide.tsx", "demo.tsx"])
assert.ok(src.includes('height = "100svh"'), "stage height defaults to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.doesNotMatch(src, /use(Ref|State|Memo|Callback|LayoutEffect|Effect)</, "no generic hook type arguments")
assert.ok(src.length < 140_000, "lean: " + src.length)

const cssAt = src.indexOf("const CSS =")
const css = src.slice(cssAt, src.indexOf("\n\n", cssAt)).replace(/" \+ EASE \+ "/g, "ease")
assert.doesNotMatch(css, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS string")
const flat = css.replace(/"\s*\+\s*\n\s*"/g, "")
let rules = 0
for (const m of flat.matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || sel.startsWith("const CSS") || sel === "FONT +") continue
  rules++
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".afl-")), "unscoped selector: " + sel)
}
assert.ok(rules >= 20, "the scope check saw real rules, saw " + rules)
const allowed = new Set(["--afl-ground", "--afl-text"])
for (const [, v] of src.matchAll(/var\((--[a-z-]+)/g)) assert.ok(allowed.has(v), "token not guaranteed in a host: " + v)
assert.deepEqual([...src.matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0]), [], "fetches nothing")

// GL and motion hygiene
assert.ok(src.includes("Math.min(2,"), "pixel ratio capped at 2")
assert.ok(src.includes("IntersectionObserver") && src.includes('"visibilitychange"'), "pauses off-screen and in hidden tabs")
assert.ok(src.includes("const idle ="), "the loop idles once the aura has faded")
assert.ok(src.includes("WEBGL_lose_context") && src.includes("cv.remove()") && src.includes('document.createElement("canvas")'), "fresh canvas per mount, released on unmount")
assert.match(flat, /@media \(prefers-reduced-motion:reduce\)/, "CSS honours reduced motion")
assert.match(src, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/, "JS reads reduced motion")
const body = (name) => src.slice(src.indexOf("const " + name + " = "), src.indexOf("\n    }\n", src.indexOf("const " + name + " = ")))
for (const fn of ["draw", "loop", "onMove"]) assert.doesNotMatch(body(fn), /getBoundingClientRect|offset(Top|Left|Width|Height)|client(Width|Height)|getComputedStyle|inner(Width|Height)/, fn + " reads layout")
assert.ok(body("measure").includes("offsetTop"), "row positions come from measure()")
assert.ok(src.includes("document.fonts?.ready.then(() => measure())"), "re-measured once the font lands")
assert.ok(src.includes("onFocus: () => setActive(i)"), "keyboard focus drives the same state as hover")

const start = src.indexOf("// #region helpers")
const end = src.indexOf("// #endregion", start)
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))
assert.deepEqual(L.hexToRgb("#000"), [0, 0, 0])
assert.equal(L.backing(300, 2.5), 600)
assert.equal(L.pad2(4), "04")
assert.equal(L.approach(0, 10, 0.5, 1 / 60), 5, "one 60 fps frame closes k of the gap")
assert.ok(Math.abs(L.approach(0, 10, 0.5, 2 / 60) - 7.5) < 1e-9, "two frames compound")
assert.equal(L.approach(3, 3, 0.2, 0.016), 3)

console.log("aura-focus-list: ok")
