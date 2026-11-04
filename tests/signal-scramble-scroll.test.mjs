// Install-safety and decode-logic checks for components/signal-scramble-scroll.
// Run: node tests/signal-scramble-scroll.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const dir = new URL("../components/signal-scramble-scroll/", import.meta.url)
const src = readFileSync(new URL("signal-scramble-scroll.tsx", dir), "utf8")

const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react", "gsap", "gsap/ScrollTrigger"], "imports are react and gsap only")
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo.tsx", "signal-scramble-scroll.tsx"])
assert.ok(src.includes('height = "100svh"'), "stage height defaults to a definite length")
assert.match(src, /"calc\(" \+ height \+ " \* "/, "the scroll track is a definite multiple of the stage height")
assert.match(src, /\.sss-stage\{position:sticky;top:0/, "the stage pins with sticky, no pin-spacer")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.doesNotMatch(src, /use(Ref|State|Memo|Callback|LayoutEffect|Effect)</, "no generic hook type arguments")
assert.ok(src.length < 90_000, "lean: " + src.length)

const cssAt = src.indexOf("const CSS =")
const css = src.slice(cssAt, src.indexOf("\n\n", cssAt))
assert.doesNotMatch(css, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS string")
const flat = css.replace(/"\s*\+\s*\n\s*"/g, "")
let rules = 0
for (const m of flat.matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || sel.startsWith("const CSS") || sel === "FONT +" || /^(\d+%)$/.test(sel)) continue
  rules++
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".sss-")), "unscoped selector: " + sel)
}
assert.ok(rules >= 20, "the scope check saw real rules, saw " + rules)
const allowed = new Set(["--sss-accent", "--sss-ground", "--sss-ink", "--sss-g", "--sss-go"])
for (const [, v] of src.matchAll(/var\((--[a-z-]+)/g)) assert.ok(allowed.has(v), "token not guaranteed in a host: " + v)
assert.deepEqual([...src.matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0]), [], "fetches nothing")

// Layout is read in measure() only; render() (ScrollTrigger onUpdate and the churn interval) writes transforms.
const render = src.slice(src.indexOf("const render = "), src.indexOf("\n    }\n", src.indexOf("const render = ")))
assert.ok(render.length > 200, "found render()")
assert.doesNotMatch(render, /getBoundingClientRect|offset(Top|Left|Width|Height)|client(Width|Height)|scrollHeight|getComputedStyle|inner(Width|Height)/, "render reads no layout")
assert.match(render, /style\.transform =/, "render writes transforms")
assert.ok(src.includes("onRefresh: (self) => {\n        measure()"), "measured on ScrollTrigger refresh (init, resize)")
assert.ok(src.includes("document.fonts?.ready.then(() => ScrollTrigger.refresh())"), "re-measured once the font lands")
assert.match(src, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/, "reduced motion is read")
assert.ok(src.includes("if (reduce) {"), "reduced motion shows the plain sentence")
for (const gone of ["window.clearInterval(id)", "st.kill()"]) assert.ok(src.includes(gone), "cleanup is missing " + gone)
assert.ok(src.includes('className="sss-sr"'), "screen readers get the real text")

const start = src.indexOf("// #region decode")
const end = src.indexOf("// #endregion", start)
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))
assert.equal(L.scramble("signal", 1, 5), "signal", "done is the word")
const mid = L.scramble("signal", 0.75, 5)
assert.equal(mid.length, 6, "the shape holds")
assert.equal(mid.slice(0, 3), "sig", "locks left to right")
assert.notEqual(L.scramble("abcdef", 0, 1, 0.45, 0), L.scramble("abcdef", 0, 1, 0.45, 1), "words churn differently")
assert.equal(L.scramble("a,b", 0, 3)[1], ",", "punctuation stays put")
assert.equal(L.wordProgress(0, 0, 10), 0)
assert.equal(L.wordProgress(1, 9, 10), 1)
assert.ok(L.wordProgress(0.5, 0, 10) > L.wordProgress(0.5, 9, 10), "later words trail")
assert.equal(L.wordProgress(0.3, 0, 1), 0.3)
assert.equal(L.easeInOut(0), 0)
assert.equal(L.easeInOut(1), 1)
assert.equal(L.easeInOut(0.5), 0.5)
assert.deepEqual(L.tokens("Every *signal* starts, the *pattern*, then *clear*."), [
  { word: "Every", hot: false }, { word: "signal", hot: true }, { word: "starts,", hot: false }, { word: "the", hot: false },
  { word: "pattern,", hot: true }, { word: "then", hot: false }, { word: "clear.", hot: true },
])
for (let i = 0; i < 50; i++) { const r = L.rand(i); assert.ok(r >= 0 && r < 1) }

console.log("signal-scramble-scroll: ok")
