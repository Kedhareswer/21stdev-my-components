// Install-safety, fold and spring checks for components/viewfinder-flip-carousel.
// Run: node tests/viewfinder-flip-carousel.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const slug = "viewfinder-flip-carousel"
const P = "vfc"
const dir = new URL("../components/" + slug + "/", import.meta.url)
const src = readFileSync(new URL(slug + ".tsx", dir), "utf8")

// ---- install safety ------------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "the only import may be react: motion and lucide-react are replaced")
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo-custom.tsx", "demo.tsx", slug + ".tsx"], "component, demos, README — nothing else")
assert.ok(src.includes('height = "100svh"'), "root height must default to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.ok(/style=\{\{ height,/.test(src), "the root takes its height from the prop")
assert.doesNotMatch(src, /use(Ref|State|Memo|Callback)</, "no generic hook type arguments (they hang the 21st CLI)")
assert.doesNotMatch(src, /@import/, "no @import")
assert.ok(src.includes("fontHref = null") && src.includes("if (!fontHref) return"), "no font loads by default")
assert.ok(src.includes("items: ViewfinderFlipItem[]"), "items are required")
{
  const urls = [...src.matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0])
  assert.deepEqual(urls, [], "the component fetches nothing itself")
}

const cssAt = src.indexOf("const CSS =")
const css = src.slice(cssAt, src.indexOf("\n\n", cssAt))
assert.doesNotMatch(css, /`|\$\{/, "no backticks or ${ in the CSS string")
for (const bad of [/"\*\s*\{/, /[{}"]\s*body\s*\{/, /:root/, /[{}"]\s*html\s*\{/]) assert.doesNotMatch(css, bad, "no bare resets: " + bad)
const flat = css.replace(/"\s*\+\s*\n\s*"/g, "")
let rules = 0
for (const m of flat.matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || /^(from|to|[\d%,]+)$/.test(sel) || sel.startsWith("const CSS")) continue
  rules++
  assert.ok(sel.split(",").every((s) => s.trim().startsWith("." + P + "-")), "unscoped selector: " + sel)
}
assert.ok(rules > 20, "the scope check saw real rules: " + rules)
assert.match(flat, /\.vfc-photo>img\{[^}]*max-width:none/, "photos override Preflight's max-width")
assert.match(flat, /prefers-reduced-motion:reduce/, "reduced motion")
const allowed = new Set(["--color-background", "--color-foreground", "--color-muted-foreground", "--color-border", "--color-primary"])
for (const [, v] of src.matchAll(/var\((--[a-z-]+)/g)) assert.ok(allowed.has(v) || v.startsWith("--" + P + "-"), "token not guaranteed in a host: " + v)

// ---- the pen's fold, kept exactly ---------------------------------------------------
assert.ok(src.includes("perspective:800px"), "each slot has the pen's perspective")
assert.ok(src.includes('"cubic-bezier(1, -0.03, 0.413, 0.965)"'), "the pen's fold curve")
assert.ok(src.includes("size = 200") && src.includes("foldedWidth = 70") && src.includes("openWidth = 300"), "the pen's sizes")
assert.ok(src.includes("tilt = 60") && src.includes("roll = 90"), "the pen's fold angles")
assert.ok(src.includes("key={active}") && src.includes("@keyframes vfc-pulse{0%{transform:scale(1)}50%{transform:scale(1.07)}"), "the frame pulses on every change")
assert.ok(src.includes("lockWhileMoving = true"), "input waits for a move to land, as in the pen")
// Accessibility.
assert.ok(src.includes('aria-roledescription="carousel"') && src.includes('aria-live="polite"'), "carousel semantics")
assert.ok(src.includes('"ArrowRight"') && src.includes('"Home"') && src.includes('"End"'), "keyboard")

// ---- lifted logic -----------------------------------------------------------------------
const start = src.indexOf("// #region fold")
const end = src.indexOf("// #endregion", start)
assert.ok(start > -1 && end > start, "region markers")
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))

assert.equal(L.sideOf(1, 3), 1, "before the open photo")
assert.equal(L.sideOf(3, 3), 0, "the open photo")
assert.equal(L.sideOf(5, 3), -1, "after it")
assert.equal(L.foldTransform(3, 3, 60, 90), "rotateY(0deg) rotateZ(0deg)", "the open photo lies flat")
assert.equal(L.foldTransform(0, 3, 60, 90), "rotateY(60deg) rotateZ(90deg)", "before: folded one way")
assert.equal(L.foldTransform(9, 3, 60, 90), "rotateY(-60deg) rotateZ(-90deg)", "after: folded the other way")
assert.equal(L.stripOffset(3, 70), -210, "the strip moves by folded widths")
assert.equal(L.stripOffset(0, 70) + 0, 0)
assert.equal(L.stackOrder(3, 3, 10), 10, "the open photo is on top")
assert.ok(L.stackOrder(2, 3, 10) > L.stackOrder(0, 3, 10), "nearer stacks above farther")
{
  let peak = 0
  for (let t = 0; t < 2; t += 0.005) peak = Math.max(peak, L.springAt(t, 0.2, 0.8))
  assert.ok(peak > 1.005 && peak < 1.2, "the strip's spring overshoots a little: " + peak.toFixed(3))
  const e = L.springEasing(0.2, 0.8)
  assert.match(e.easing, /^linear\(0, [-\d., ]+, 1\)$/, "a CSS linear() easing from 0 to 1")
  assert.doesNotMatch(e.easing, /NaN|Infinity|e-/, "finite, no exponent notation CSS would reject")
  assert.ok(e.ms > 300 && e.ms < 2000, "a sane duration: " + e.ms)
}
assert.equal(L.clampIndex(-3, 8), 0)
assert.equal(L.clampIndex(99, 8), 7)
assert.equal(L.clampIndex(2.4, 8), 2)
assert.equal(L.clampIndex(5, 0), 0, "empty list")

// ---- demos ---------------------------------------------------------------------------
for (const f of ["demo.tsx", "demo-custom.tsx"]) {
  const demo = readFileSync(new URL(f, dir), "utf8")
  assert.ok(demo.includes('from "@/components/ui/' + slug + '"'), f + " imports the installed path")
  assert.ok(demo.includes('className="w-full"'), f + " wrapper keeps full width")
  assert.doesNotMatch(demo, /from "\.\//, f + " imports nothing local: Studio renames demos")
}
assert.ok(readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8").includes('"@/components/ui/' + slug + '"'), "tsconfig paths line")

console.log(slug + ": ok")
