// Install-safety, staircase and spring checks for components/staircase-carousel.
// Run: node tests/staircase-carousel.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const slug = "staircase-carousel"
const P = "stc"
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
assert.ok(src.includes("items: StaircaseItem[]"), "items are required")
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
assert.match(flat, /\.stc-slide>img\{[^}]*max-width:none/, "photos override Preflight's max-width")
assert.match(flat, /prefers-reduced-motion:reduce/, "reduced motion")
const allowed = new Set(["--color-background", "--color-foreground", "--color-muted-foreground", "--color-border", "--color-primary"])
for (const [, v] of src.matchAll(/var\((--[a-z-]+)/g)) assert.ok(allowed.has(v) || v.startsWith("--" + P + "-"), "token not guaranteed in a host: " + v)

// ---- the pen's staircase, kept exactly ---------------------------------------------
assert.ok(src.includes('slideWidth = "clamp(120px, 20vw, 240px)"'), "the pen's slide width")
assert.ok(src.includes("inactiveScale = 0.8") && src.includes("step = 1"), "the pen's step and scale")
assert.ok(src.includes("bounce = 0.1") && src.includes("duration = 0.8") && src.includes("stepDuration = 0.6"), "the pen's timings")
assert.ok(src.includes('"ms ease-in-out"'), "steps ease in and out, as in the pen")
assert.ok(src.includes('"translateX(calc(" + -active + " * var(--stc-w)))"'), "the strip moves one photo width per step")
assert.ok(src.includes("springEasing(0.2, 0.8)"), "titles pop on the pen's spring")
assert.ok(src.includes("@keyframes stc-in{from{opacity:0;transform:scale(.5);filter:blur(2px)}"), "titles pop in from half size and a blur")
assert.ok(src.includes("@keyframes stc-out{"), "and pop out the same way")
assert.ok(flat.includes("z-index:-1") && flat.includes("isolation:isolate"), "the title sits behind the photos without vanishing behind the background")
// Accessibility.
assert.ok(src.includes('aria-roledescription="carousel"') && src.includes('aria-live="polite"'), "carousel semantics")
assert.ok(src.includes('"ArrowRight"') && src.includes('"Home"') && src.includes('"End"'), "keyboard")

// ---- lifted logic -----------------------------------------------------------------------
const start = src.indexOf("// #region motion")
const end = src.indexOf("// #endregion", start)
assert.ok(start > -1 && end > start, "region markers")
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))

assert.equal(L.stepOf(1, 3), -1, "before the chosen photo: a storey up")
assert.equal(L.stepOf(3, 3), 0, "the chosen photo: level")
assert.equal(L.stepOf(7, 3), 1, "after it: a storey down")
assert.equal(L.slideTransform(3, 3, 1, 0.8), "translateY(0%) scale(1)", "the chosen photo is level and full size")
assert.equal(L.slideTransform(0, 3, 1, 0.8), "translateY(-100%) scale(0.8)", "before: up a whole photo, shrunk")
assert.equal(L.slideTransform(9, 3, 1, 0.8), "translateY(100%) scale(0.8)", "after: down a whole photo, shrunk")
assert.equal(L.slideTransform(9, 3, 0.5, 0.7), "translateY(50%) scale(0.7)", "step and scale are props")
{
  let peak = 0
  for (let t = 0; t < 2; t += 0.005) peak = Math.max(peak, L.springAt(t, 0.1, 0.8))
  assert.ok(peak > 1.0005 && peak < 1.2, "the strip's spring overshoots a little: " + peak.toFixed(3))
  const e = L.springEasing(0.1, 0.8)
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
