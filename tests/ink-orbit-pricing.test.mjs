// Install-safety and logic checks for components/ink-orbit-pricing.
// Run: node tests/ink-orbit-pricing.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const SLUG = "ink-orbit-pricing"
const read = (f) => readFileSync(new URL(`../components/${SLUG}/${f}`, import.meta.url), "utf8").replace(/\r\n/g, "\n")
const src = read(`${SLUG}.tsx`)

/* ---------- install safety ---------- */

const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.doesNotMatch(src, /@import|@font-face|fetch\(|new Image\(|<img\b|https?:\/\//, "nothing loads at runtime")
assert.doesNotMatch(src, /\bh-full\b|height:\s*"?100%/, "no percentage heights — plan cards stretch with flex")
assert.doesNotMatch(src, /use(State|Ref|Memo|Callback)</, "hooks typed without <generics> (21st CLI tokenizer)")
{
  const css = src.match(/const IP_CSS = `([\s\S]*?)`/)[1]
  assert.doesNotMatch(css, /\$\{|(^|[\s}])(\*|body|html|:root)\s*\{/, "no interpolation, no global resets")
  assert.match(css, /repeating-linear-gradient\(135deg/, "the hatched page background travels with it")
  assert.match(css, /\.ip-root\{[^}]*width:100%/, "the root claims full width inside a flex wrapper")
  assert.match(css, /prefers-reduced-motion:reduce/, "reduced motion is honoured")
}
for (const d of ["demo.tsx", "demo-custom.tsx"]) {
  const demo = read(d)
  assert.match(demo, /from "@\/components\/ui\/ink-orbit-pricing"/, `${d} imports the installed path`)
  assert.doesNotMatch(demo, /https?:\/\//, `${d} is self-contained`)
}

/* ---------- logic ---------- */

const a = src.indexOf("// #region logic\n")
const b = src.indexOf("// #endregion logic\n")
assert.ok(a > -1 && b > a, "logic region missing")
const L = await import(
  "data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(a, b)) + "\nexport { planPrice, yearlySaving, easeOutCubic, parseTitle }")
)

assert.equal(L.planPrice(49, "monthly", 0.2), 49)
assert.equal(L.planPrice(49, "yearly", 0.2), 39, "20% off, rounded to a whole price")
assert.equal(L.planPrice(null, "yearly", 0.2), null, "custom plans stay custom")
assert.equal(L.planPrice(49, "yearly", 0), 49, "no discount, no change")
assert.equal(L.planPrice(49, "yearly", 5), 2, "an absurd discount clamps to 95%, never free or negative")
assert.equal(L.planPrice(49, "yearly", -1), 49, "a negative discount is ignored")

assert.equal(L.yearlySaving(49, 0.2), 120, "(49 − 39) × 12")
assert.equal(L.yearlySaving(null, 0.2), 0)
assert.equal(L.yearlySaving(19, 0), 0)

assert.equal(L.easeOutCubic(0), 0)
assert.equal(L.easeOutCubic(1), 1)
assert.equal(L.easeOutCubic(2), 1, "the ticker never overshoots")

assert.deepEqual(L.parseTitle("Simple, *Transparent*\nPricing")[0][1], { text: "Transparent", muted: true })

console.log(`${SLUG}: ok`)
