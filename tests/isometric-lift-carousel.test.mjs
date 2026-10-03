// Install-safety and spring checks for components/isometric-lift-carousel.
// Run: node tests/isometric-lift-carousel.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const slug = "isometric-lift-carousel"
const P = "ilc"
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
assert.ok(src.includes("items: IsometricLiftItem[]"), "items are required")
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
assert.match(flat, /\.ilc-card>img\{[^}]*max-width:none/, "photos override Preflight's max-width")
assert.match(flat, /prefers-reduced-motion:reduce/, "reduced motion")
const allowed = new Set(["--color-background", "--color-foreground", "--color-muted-foreground", "--color-border", "--color-primary"])
for (const [, v] of src.matchAll(/var\((--[a-z-]+)/g)) assert.ok(allowed.has(v) || v.startsWith("--" + P + "-"), "token not guaranteed in a host: " + v)

// ---- the pen's 3D, kept exactly ---------------------------------------------------
assert.ok(src.includes("transform-style:preserve-3d"), "the row keeps its 3D context")
assert.ok(src.includes("perspective:1200px"), "each slot has the pen's perspective")
assert.ok(src.includes('"translateZ(" + (n - i) * 20 + "px) translateX(-150px)"'), "slots step forward so every card stays clickable")
assert.ok(src.includes('"rotateY(-90deg) translateY(" + (isActive ? -lift : 0) + "px)"'), "cards stand on edge; the chosen one lifts")
assert.ok(src.includes("tiltX = -10") && src.includes("rotateY = 50"), "the pen's row tilt")
assert.ok(src.includes("bounce = 0.25") && src.includes("duration = 0.6"), "the pen's spring")
// Accessibility.
assert.ok(src.includes('aria-roledescription="carousel"') && src.includes('aria-live="polite"'), "carousel semantics")
assert.ok(src.includes('"ArrowRight"') && src.includes('"Home"') && src.includes('"End"'), "keyboard")

// ---- lifted logic -----------------------------------------------------------------------
const start = src.indexOf("// #region spring")
const end = src.indexOf("// #endregion", start)
assert.ok(start > -1 && end > start, "region markers")
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))

assert.equal(L.springAt(0, 0.25, 0.6), 0, "starts at 0")
let peak = 0
for (let t = 0; t < 2; t += 0.005) peak = Math.max(peak, L.springAt(t, 0.25, 0.6))
assert.ok(peak > 1.01 && peak < 1.2, "bounce 0.25 overshoots a little: " + peak.toFixed(3))
let critPeak = 0
for (let t = 0; t < 2; t += 0.005) critPeak = Math.max(critPeak, L.springAt(t, 0, 0.6))
assert.ok(critPeak <= 1 + 1e-9, "bounce 0 never overshoots")
{
  const T = L.settleTime(0.25, 0.6)
  for (let t = T; t < T + 1; t += 0.01) assert.ok(Math.abs(L.springAt(t, 0.25, 0.6) - 1) < 1.5e-3, "settled after settleTime")
  const e = L.springEasing(0.25, 0.6)
  assert.match(e.easing, /^linear\(0, [-\d., ]+, 1\)$/, "a CSS linear() easing from 0 to 1")
  assert.equal(e.easing.split(",").length, 49, "48 samples + 1")
  assert.doesNotMatch(e.easing, /NaN|Infinity|e-/, "finite, no exponent notation CSS would reject")
  assert.ok(e.ms > 300 && e.ms < 1500, "a sane duration: " + e.ms)
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
