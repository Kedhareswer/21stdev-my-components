// Install-safety and logic checks for components/ink-orbit-faq.
// Run: node tests/ink-orbit-faq.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const SLUG = "ink-orbit-faq"
const read = (f) => readFileSync(new URL(`../components/${SLUG}/${f}`, import.meta.url), "utf8").replace(/\r\n/g, "\n")
const src = read(`${SLUG}.tsx`)

/* ---------- install safety ---------- */

const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.doesNotMatch(src, /@import|@font-face|fetch\(|new Image\(|<img\b|https?:\/\//, "nothing loads at runtime")
assert.doesNotMatch(src, /\bh-full\b|height:\s*"?100%/, "no percentage heights")
assert.doesNotMatch(src, /use(State|Ref|Memo|Callback)</, "hooks typed without <generics> (21st CLI tokenizer)")
assert.match(src, /aria-expanded=\{open === i\}/, "each question reports its state")
assert.match(src, /aria-controls=\{uid \+ "faq" \+ i\}/, "...and points at its answer")
{
  const css = src.match(/const IQ_CSS = `([\s\S]*?)`/)[1]
  assert.doesNotMatch(css, /\$\{|(^|[\s}])(\*|body|html|:root)\s*\{/, "no interpolation, no global resets")
  assert.match(css, /repeating-linear-gradient\(135deg/, "the hatched page background travels with it")
  assert.match(css, /\.iq-root\{[^}]*width:100%/, "the root claims full width inside a flex wrapper")
  assert.match(css, /grid-template-rows:0fr/, "answers open on a grid-row transition, no measured heights")
  assert.match(css, /prefers-reduced-motion:reduce/, "reduced motion is honoured")
}
for (const d of ["demo.tsx", "demo-custom.tsx"]) {
  const demo = read(d)
  assert.match(demo, /from "@\/components\/ui\/ink-orbit-faq"/, `${d} imports the installed path`)
  assert.doesNotMatch(demo, /https?:\/\//, `${d} is self-contained`)
}

/* ---------- logic ---------- */

const a = src.indexOf("// #region logic\n")
const b = src.indexOf("// #endregion logic\n")
assert.ok(a > -1 && b > a, "logic region missing")
const L = await import(
  "data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(a, b)) + "\nexport { splitStat, formatStat, parseTitle }")
)

assert.deepEqual(L.splitStat("12,400+"), { prefix: "", value: 12400, decimals: 0, suffix: "+" })
assert.deepEqual(L.splitStat("99.98%"), { prefix: "", value: 99.98, decimals: 2, suffix: "%" })
assert.deepEqual(L.splitStat("$38M"), { prefix: "$", value: 38, decimals: 0, suffix: "M" })
assert.equal(L.splitStat("N/A"), null)

// the count-up lands exactly on the authored string
for (const s of ["12,400+", "38M", "99.98%", "4.9/5", "9min", "N/A"]) assert.equal(L.formatStat(s, 1), s, `ends on ${s}`)
assert.equal(L.formatStat("12,400+", 0), "0+")
assert.equal(L.formatStat("99.98%", 0), "0.00%", "decimals hold their width while counting")

assert.deepEqual(L.parseTitle("Built by people who\n*hate busywork.*")[1], [{ text: "hate busywork.", muted: true }])

console.log(`${SLUG}: ok`)
