// Install-safety and logic checks for components/afterglow-pricing.
// Run: node tests/afterglow-pricing.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const SLUG = "afterglow-pricing"
const read = (f) => readFileSync(new URL(`../components/${SLUG}/${f}`, import.meta.url), "utf8").replace(/\r\n/g, "\n")
const src = read(`${SLUG}.tsx`)

/* ---------- install safety ---------- */

const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.doesNotMatch(src, /@import|@font-face|fetch\(|new Image\(|<img\b|https?:\/\//, "nothing loads at runtime — the glow is painted")
assert.doesNotMatch(src, /\bh-full\b|height:\s*"?100%/, "no percentage heights — the section sizes to its content")
assert.doesNotMatch(src.slice(0, src.indexOf("</")), /use(State|Ref|Memo|Callback)<|Partial<|Record<|RefObject<|React\.[A-Za-z]+</, "no generics before the JSX (21st CLI tokenizer)")
assert.match(src, /typeof document === "undefined"/, "painting is skipped on the server")
assert.match(src, /cssGlow\(palette\)/, "CSS gradients stand in until the canvas paints")
{
  const css = src.match(/const AG_CSS = \[([\s\S]*?)\]\.join/)[1]
  assert.doesNotMatch(css, /\$\{|`|(^|[\s"}])(\*|body|html|:root)\s*\{/, "no interpolation, no global resets")
  assert.match(css, /\.ag-root\{[^}]*width:100%/, "the root claims full width")
  assert.match(css, /prefers-reduced-motion:reduce/, "reduced motion is honoured")
  assert.match(css, /var\(--color-foreground,/, "follows the installer's foreground token, with a fallback")
  assert.match(css, /var\(--color-background,/, "follows the installer's background token, with a fallback")
  assert.match(css, /border:1px dashed/, "plan cards keep the dashed outline")
  assert.match(css, /animation-play-state:running/, "the glow only animates on the lit card")
}
assert.match(src, /role="radiogroup"/, "the billing switch is a radio group")
assert.match(src, /ArrowLeft[\s\S]*ArrowRight/, "arrow keys flip the billing period")
assert.match(src, /aria-expanded=\{isOpen\}/, "FAQ questions announce their state")
assert.match(src, /aria-pressed=\{current\}/, "the subscribed plan's button is pressed")
for (const d of ["demo.tsx", "demo-custom.tsx"]) {
  const demo = read(d)
  assert.match(demo, /from "@\/components\/ui\/afterglow-pricing"/, `${d} imports the installed path`)
  assert.doesNotMatch(demo, /https?:\/\//, `${d} is self-contained, so 21st can capture it`)
}

/* ---------- logic ---------- */

const a = src.indexOf("// #region logic\n")
const b = src.indexOf("// #endregion logic\n")
assert.ok(a > -1 && b > a, "logic region missing")
const L = await import(
  "data:text/javascript," +
    encodeURIComponent(
      stripTypeScriptTypes(src.slice(a, b)) + "\nexport { planPrice, yearlyTotal, splitPrice, discountLabel, litIndex, mulberry32 }",
    )
)

assert.equal(L.planPrice(10, "monthly", 0.15), 10)
assert.equal(L.planPrice(10, "annual", 0.15), 8.5, "15% off, to the cent")
assert.equal(L.planPrice(20, "annual", 0.15), 17)
assert.equal(L.planPrice(19.99, "annual", 0.15), 16.99, "rounded to cents, no float tails")
assert.equal(L.planPrice(10, "annual", 0), 10, "no discount, no change")
assert.equal(L.planPrice(10, "annual", 3), 0.5, "an absurd discount clamps to 95%, never free")
assert.equal(L.planPrice(10, "annual", -1), 10, "a negative discount is ignored")
assert.equal(L.planPrice(-5, "monthly", 0), 0, "never a negative price")

assert.equal(L.yearlyTotal(10, 0.15), 102)
assert.equal(L.yearlyTotal(60, 0.15), 612)

assert.deepEqual(L.splitPrice(10), ["10", ""], "whole prices carry no cents")
assert.deepEqual(L.splitPrice(8.5), ["8", ".50"])
assert.deepEqual(L.splitPrice(0.05), ["0", ".05"])
assert.deepEqual(L.splitPrice(1234.5), ["1,234", ".50"], "thousands separated")
assert.deepEqual(L.splitPrice(9.999), ["10", ""], "cents round up into the next whole")

assert.equal(L.discountLabel(0.15), "-15%")
assert.equal(L.discountLabel(0), "", "no discount hides the chip")

const feat = [false, true, false, false]
assert.equal(L.litIndex(feat, -1, true), 1, "the featured plan is lit before anything is picked")
assert.equal(L.litIndex(feat, 3, true), 3, "the glow follows the subscribed plan")
assert.equal(L.litIndex(feat, 3, false), 1, "…unless told to stay on the featured one")
assert.equal(L.litIndex(feat, 9, true), 1, "an out-of-range pick falls back to featured")
assert.equal(L.litIndex([false, false], -1, true), -1, "no featured plan, nothing lit")

const r1 = L.mulberry32(5)
const r2 = L.mulberry32(5)
assert.equal(r1(), r2(), "the painter is seeded — every render paints the same glow")

console.log(`${SLUG}: ok`)
