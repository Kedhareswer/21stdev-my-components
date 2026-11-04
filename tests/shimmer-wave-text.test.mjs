// Install-safety and timing checks for components/shimmer-wave-text.
// Run: node tests/shimmer-wave-text.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const dir = new URL("../components/shimmer-wave-text/", import.meta.url)
const src = readFileSync(new URL("shimmer-wave-text.tsx", dir), "utf8")

const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react only")
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo.tsx", "shimmer-wave-text.tsx"])
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.doesNotMatch(src, /use(Ref|State|Memo|Callback|LayoutEffect|Effect)</, "no generic hook type arguments")
assert.doesNotMatch(src, /requestAnimationFrame|setInterval|addEventListener/, "pure CSS: no JS per frame")

const cssAt = src.indexOf("const CSS =")
const css = src.slice(cssAt, src.indexOf("\n\n", cssAt))
assert.doesNotMatch(css, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS string")
const flat = css.replace(/"\s*\+\s*\n\s*"/g, "")
for (const m of flat.matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || sel.startsWith("const CSS") || /^[\d%,]+$/.test(sel)) continue
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".swt-")), "unscoped selector: " + sel)
}
const allowed = new Set(["--swt-base", "--swt-hi", "--swt-d", "--swt-step", "--swt-lift", "--i", "--color-muted-foreground", "--color-foreground"])
for (const [, v] of src.matchAll(/var\((--[a-z-]+)/g)) assert.ok(allowed.has(v), "token not guaranteed in a host: " + v)
assert.match(flat, /\.swt-w\{display:inline-block;white-space:nowrap\}/, "words stay whole, so lines break only between words")
assert.match(flat, /@media \(prefers-reduced-motion:reduce\)\{\.swt-wave \.swt-c\{animation-name:swt-sweep\}\}/, "reduced motion drops the lift, keeps a gentle light")
assert.ok(src.includes("aria-label={text}") && src.includes('className="swt-w" aria-hidden="true"'), "read as one string, not letter by letter")

const start = src.indexOf("// #region timing")
const end = src.indexOf("// #endregion", start)
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))
assert.equal(L.autoStep(1, 2), 0)
assert.equal(L.autoStep(11, 2), 0.12, "crest crosses in 60% of the pass")
const w = L.letters("Syncing  3 of 12")
assert.deepEqual(w.map((x) => x.map((c) => c.ch).join("")), ["Syncing", "3", "of", "12"], "double spaces collapse")
assert.deepEqual(w.flat().map((c) => c.i), [...Array(12).keys()], "indices run on across words")
assert.deepEqual(L.letters(""), [])

console.log("shimmer-wave-text: ok")
