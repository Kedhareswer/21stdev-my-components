// Install-safety + scrub-math check for components/crumple-changelog.
// Run: node tests/crumple-changelog.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const src = readFileSync(
  new URL("../components/crumple-changelog/crumple-changelog.tsx", import.meta.url),
  "utf8",
)
const demo = readFileSync(new URL("../components/crumple-changelog/demo.tsx", import.meta.url), "utf8")

// --- the knob → stage mapping, lifted out of the component ---
const start = src.indexOf("// #region scrub-math")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "scrub-math region markers missing")
const js = src
  .slice(start, end)
  .replace(/\):\s*\{[^}]*\}\s*\{/g, ") {")
  .replace(/:\s*(number|string)\b/g, "")
const { scrubToView, formatLong, formatShort } = await import("data:text/javascript," + encodeURIComponent(js))

assert.deepEqual(scrubToView(0, 6), { index: 0, crumple: 0 }, "rest on the first poster")
assert.deepEqual(scrubToView(0.25, 6), { index: 0, crumple: 0.5 }, "first half of a gap crumples the current poster")
assert.deepEqual(scrubToView(0.5, 6), { index: 1, crumple: 1 }, "the midpoint is a ball, already the next poster")
assert.deepEqual(scrubToView(0.75, 6), { index: 1, crumple: 0.5 }, "second half unfolds the next poster")
assert.deepEqual(scrubToView(5, 6), { index: 5, crumple: 0 }, "rest on the last poster")
assert.deepEqual(scrubToView(9, 6), { index: 5, crumple: 0 }, "clamped past the end")
assert.deepEqual(scrubToView(-2, 6), { index: 0, crumple: 0 }, "clamped before the start")
assert.deepEqual(scrubToView(0.3, 1), { index: 0, crumple: 0 }, "a single update never crumples")
// continuity: crumple never jumps while the knob moves
let prev = scrubToView(0, 6)
for (let p = 0.001; p <= 5; p += 0.001) {
  const v = scrubToView(p, 6)
  assert.ok(Math.abs(v.crumple - prev.crumple) < 0.01, "crumple jumped at p=" + p.toFixed(3))
  if (v.index !== prev.index) assert.ok(v.crumple > 0.99, "poster swapped outside the ball at p=" + p.toFixed(3))
  prev = v
}
assert.equal(formatLong("2026-10-14"), "Oct 14, 2026")
assert.equal(formatLong("2026-01-01"), "Jan 1, 2026", "no timezone drift on the 1st")
assert.equal(formatShort("2026-10-09"), "Oct 9")

// --- install safety: 21st ships this one file ---
assert.ok(/height = "100svh"/.test(src), "root height must default to a definite length")
assert.ok(src.includes("style={{ height }}"), "the height prop must reach the root")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full anywhere — it collapses once installed")
assert.doesNotMatch(src, /@import/, "no @import — fonts are embedded")
assert.doesNotMatch(src, /^\s*(\*|body|html|:root)\s*[{,]/m, "no bare global resets")
const css = src.slice(src.indexOf("const CSS = `") + 13, src.indexOf("`", src.indexOf("const CSS = `") + 13))
assert.ok(css.length > 1000, "scoped CSS block not found")
assert.ok(!css.includes("${"), "no interpolation inside the CSS string")
for (const sel of css.match(/(^|})\s*([^@{}][^{}]*){/g) ?? []) {
  const s = sel.replace(/^[}\s]+/, "").replace(/{$/, "")
  if (s.trim().startsWith("@")) continue
  for (const part of s.split(","))
    assert.ok(/^\s*\.cc-/.test(part), "unscoped selector in CSS: " + part.trim())
}
// only the five semantic tokens
const vars = new Set(src.match(/var\(--[a-z-]+/g)?.map((v) => v.slice(4)))
for (const v of vars)
  assert.ok(
    ["--color-background", "--color-foreground", "--color-muted-foreground", "--color-border", "--color-primary"].includes(v),
    "unknown token " + v,
  )
// nothing off-origin: fonts are data URIs, posters are painted
assert.doesNotMatch(src, /https?:\/\/(?!21st)/, "no remote URLs")
assert.ok(/FONT_MARKER = "d09GMg/.test(src), "Permanent Marker must be embedded as woff2")
assert.ok(/FONT_SERIF_ITALIC = "d09GMg/.test(src), "Instrument Serif Italic must be embedded as woff2")
assert.ok(Buffer.byteLength(src) < 200_000, "component file must stay under 200 KB")
// preflight would collapse the fallback poster image
assert.ok(src.includes('maxWidth: "none"'), "images need an explicit max-width escape")
// motion
assert.ok(src.includes("prefers-reduced-motion: reduce"), "must honour prefers-reduced-motion in JS")
assert.ok(src.includes("motion-reduce:transition-none"), "must honour prefers-reduced-motion in CSS")
assert.ok(src.includes("uMix"), "reduced motion crossfades instead of crumpling")
// the crumple is geometry, not a scale trick
assert.ok(src.includes("new THREE.PlaneGeometry(1, ASPECT, 110, 156)"), "the poster is a dense plane")
assert.ok(src.includes("aCrease"), "the crease map drives the deformation")
// deps the installer needs
const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"))
for (const dep of ["three", "gsap"]) assert.ok(pkg.dependencies?.[dep], dep + " must be in the root package.json")
assert.ok(demo.includes('from "@/components/ui/crumple-changelog"'), "demo imports the installed path")

console.log("crumple-changelog: ok")

// 21st centres every demo in a flex row; an unsized wrapper collapses to 0 px
// there because .cc-root is a size container (seen live 2026-11-01: blank preview).
assert.ok(/width: "100%"/.test(demo), "demo wrapper must be width 100% or it is 0 px wide on 21st")
