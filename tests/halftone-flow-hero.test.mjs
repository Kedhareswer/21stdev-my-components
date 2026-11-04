// Install-safety, GL hygiene and helper checks for components/halftone-flow-hero.
// Run: node tests/halftone-flow-hero.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const dir = new URL("../components/halftone-flow-hero/", import.meta.url)
const src = readFileSync(new URL("halftone-flow-hero.tsx", dir), "utf8")

// ---- install safety ------------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react only: raw WebGL, no three")
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo-cobalt.tsx", "demo.tsx", "halftone-flow-hero.tsx"])
assert.ok(src.includes('height = "100svh"'), "stage height defaults to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.doesNotMatch(src, /use(Ref|State|Memo|Callback|LayoutEffect|Effect)</, "no generic hook type arguments")
assert.ok(src.length < 140_000, "lean: " + src.length)

const cssAt = src.indexOf("const CSS =")
const css = src.slice(cssAt, src.indexOf("\n\n", cssAt))
assert.doesNotMatch(css, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS string")
const flat = css.replace(/"\s*\+\s*\n\s*"/g, "")
let rules = 0
for (const m of flat.matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || sel.startsWith("const CSS") || sel === "FONT +" || /^(to|\d+%)$/.test(sel)) continue
  rules++
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".hfh-")), "unscoped selector: " + sel)
}
assert.ok(rules >= 25, "the scope check saw real rules, saw " + rules)
const allowed = new Set(["--hfh-ground", "--hfh-flow", "--hfh-hot", "--hfh-text", "--color-background"])
for (const [, v] of src.matchAll(/var\((--[a-z0-9-]+)/g)) assert.ok(allowed.has(v), "token not guaranteed in a host: " + v)
assert.deepEqual([...src.matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0]), [], "fetches nothing")

// ---- GL and motion hygiene -------------------------------------------------------
assert.ok(src.includes("Math.min(2,"), "device pixel ratio is capped at 2")
assert.ok(src.includes("IntersectionObserver") && src.includes('"visibilitychange"'), "the loop pauses off-screen and in hidden tabs")
assert.ok(src.includes("WEBGL_lose_context") && src.includes("cv.remove()"), "the context is released on unmount")
assert.ok(src.includes('document.createElement("canvas")'), "a fresh canvas per mount, so a StrictMode remount gets a live context")
assert.ok(src.includes("hfh-fallback"), "a CSS fallback when WebGL is missing")
assert.match(src, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/, "reduced motion is read")
assert.match(flat, /@media \(prefers-reduced-motion:reduce\)/, "CSS transitions honour reduced motion")
for (const gone of ["ro.disconnect()", "io.disconnect()", "cancelAnimationFrame(raf)", 'card.removeEventListener("pointermove", onMove)'])
  assert.ok(src.includes(gone), "cleanup is missing " + gone)
// Layout is read only in measure() and pointerenter, never in draw/loop/pointermove.
const body = (name) => src.slice(src.indexOf("const " + name + " = "), src.indexOf("\n    }\n", src.indexOf("const " + name + " = ")))
for (const fn of ["draw", "loop", "onMove"])
  assert.doesNotMatch(body(fn), /getBoundingClientRect|offset(Top|Left|Width|Height)|client(Width|Height)|getComputedStyle|inner(Width|Height)/, fn + " reads layout")
assert.equal((src.match(/getBoundingClientRect/g) || []).length, 2, "only measure() and pointerenter measure")

// ---- the lifted helpers -------------------------------------------------------------
const start = src.indexOf("// #region helpers")
const end = src.indexOf("// #endregion", start)
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))
assert.deepEqual(L.hexToRgb("#ff0000"), [1, 0, 0])
assert.deepEqual(L.hexToRgb("#fff"), [1, 1, 1])
assert.deepEqual(L.hexToRgb("nope"), [0, 0, 0])
assert.equal(L.backing(100, 3), 200, "capped at 2x")
assert.equal(L.backing(100, 0), 100)
assert.equal(L.backing(0, 1), 1, "never a zero-size canvas")
assert.deepEqual(L.runs("only *sooner.*"), [{ text: "only ", em: false }, { text: "sooner.", em: true }])
// the typewriter: types up, holds, deletes, then asks for the next prompt
assert.deepEqual(L.typeStep("ab", 0, false), { shown: 1, deleting: false, wait: 38, next: false })
assert.deepEqual(L.typeStep("ab", 2, false), { shown: 2, deleting: true, wait: 1700, next: false })
assert.deepEqual(L.typeStep("ab", 1, true), { shown: 0, deleting: true, wait: 18, next: false })
assert.deepEqual(L.typeStep("ab", 0, true), { shown: 0, deleting: false, wait: 280, next: true })
let st = { shown: 0, deleting: false, next: false }, steps = 0
while (!st.next && steps < 100) { st = L.typeStep("hello", st.shown, st.deleting); steps++ }
assert.equal(steps, 12, "5 up, 1 hold, 5 down, then the next prompt")
assert.match(src, /onSubmit?.(value.trim() || current)/, "submit sends the typed value, else the shown prompt")
assert.ok(src.includes('aria-label="Tell it what to write"'), "the input is labelled")

console.log("halftone-flow-hero: ok")
