// Install-safety and logic checks for components/ink-orbit-testimonials.
// Run: node tests/ink-orbit-testimonials.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const SLUG = "ink-orbit-testimonials"
const read = (f) => readFileSync(new URL(`../components/${SLUG}/${f}`, import.meta.url), "utf8").replace(/\r\n/g, "\n")
const src = read(`${SLUG}.tsx`)

/* ---------- install safety ---------- */

const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.doesNotMatch(src, /@import|@font-face|fetch\(|new Image\(|https?:\/\//, "nothing loads at runtime")
assert.doesNotMatch(src, /\bh-full\b|height:100%/, "no percentage heights anywhere")
assert.doesNotMatch(src, /use(State|Ref|Memo|Callback)</, "hooks typed without <generics> (21st CLI tokenizer)")
assert.match(src, /React\.useId\(\)/, "svg gradient ids are namespaced per instance")
assert.match(src, /maxWidth: "none"/, "a caller's avatar <img> is guarded against Preflight")
{
  const css = src.match(/const IT_CSS = `([\s\S]*?)`/)[1]
  assert.doesNotMatch(css, /\$\{|(^|[\s}])(\*|body|html|:root)\s*\{/, "no interpolation, no global resets")
  assert.match(css, /repeating-linear-gradient\(135deg/, "the hatched page background travels with it")
  assert.match(css, /@keyframes it-marq/, "the marquee animation travels with it")
  assert.match(css, /prefers-reduced-motion:reduce\)\{[\s\S]*\.it-marquee-row\{animation:none\}/, "reduced motion stops the marquee")
  assert.match(css, /\.it-root\{[^}]*width:100%/, "the root claims full width inside a flex wrapper")
}
for (const d of ["demo.tsx", "demo-custom.tsx"]) {
  const demo = read(d)
  assert.match(demo, /from "@\/components\/ui\/ink-orbit-testimonials"/, `${d} imports the installed path`)
  assert.doesNotMatch(demo, /https?:\/\//, `${d} is self-contained, so 21st can capture it`)
}

/* ---------- logic ---------- */

const a = src.indexOf("// #region logic\n")
const b = src.indexOf("// #endregion logic\n")
assert.ok(a > -1 && b > a, "logic region missing")
const L = await import(
  "data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(a, b)) + "\nexport { parseTitle, pageOf }")
)

assert.deepEqual(L.parseTitle("Trusted by *Teams*\nWorldwide."), [
  [{ text: "Trusted by ", muted: false }, { text: "Teams", muted: true }],
  [{ text: "Worldwide.", muted: false }],
])
assert.deepEqual(L.parseTitle("a\\nb"), [[{ text: "a", muted: false }], [{ text: "b", muted: false }]], "a literal \\n from a JSX attribute breaks too")
assert.deepEqual(L.parseTitle(""), [[]])

// 3 cards per view, 6 cards → 2 pages
assert.deepEqual(L.pageOf(0, 900, 300, 6), { i: 0, n: 2 })
assert.deepEqual(L.pageOf(900, 900, 300, 6), { i: 1, n: 2 })
assert.deepEqual(L.pageOf(5000, 900, 300, 6), { i: 1, n: 2 }, "overscroll clamps to the last page")
assert.deepEqual(L.pageOf(0, 400, 400, 4), { i: 0, n: 4 }, "one card per view on a phone")
assert.deepEqual(L.pageOf(0, 900, 300, 0), { i: 0, n: 1 }, "no cards still means one page, never zero")
assert.deepEqual(L.pageOf(0, 0, 0, 3), { i: 0, n: 3 }, "a zero-width track doesn't divide by zero")

console.log(`${SLUG}: ok`)
