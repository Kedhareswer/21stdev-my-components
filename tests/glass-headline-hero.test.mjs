// Install-safety, shader and behaviour checks for glass-headline-hero.
// Run: node tests/glass-headline-hero.test.mjs

import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const dir = new URL("../components/glass-headline-hero/", import.meta.url)
const src = readFileSync(new URL("glass-headline-hero.tsx", dir), "utf8")
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")

// ---- install safety --------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import the component may have")
assert.doesNotMatch(src, /@import/, "no @import")
assert.ok(src.includes('height = "100svh"'), "height prop defaults to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")

const css = src.match(/const CSS =\n([\s\S]*?)\n\n/)
assert.ok(css, "CSS block is present")
assert.doesNotMatch(css[1].replace(/^\s*\/\/[^\n]*$/gm, ""), /\$\{|`/, "no backticks or interpolation inside the CSS strings")
const flat = css[1].replace(/^\s*\/\/[^\n]*\n/gm, "").replace(/"\s*\+\s*\n\s*"/g, "").replace(/^\s*"|"\s*$/g, "")
let rules = 0
for (const m of flat.matchAll(/(?<=^|[{}])\s*([^{}]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || /^(from|to)$/.test(sel)) continue
  rules++
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".ghr-")), `unscoped CSS selector would leak into the host app: ${sel}`)
}
assert.ok(rules > 15, `expected the scope check to see real rules, saw ${rules}`)
assert.match(flat, /\.ghr-canvas\{[^}]*max-width:none/, "canvas overrides Preflight's max-width")
assert.match(flat, /:focus-visible/, "keyboard focus is visible, and only for keyboard users")
assert.match(flat, /@media \(hover:hover\) and \(pointer:fine\)/, "hover styles are gated off touch")
assert.match(flat, /prefers-reduced-motion:reduce/, "the entrance honours reduced motion")
assert.match(src, /prefers-reduced-motion: reduce/, "the field honours reduced motion")

// ---- the headline is real text ------------------------------------------------
assert.match(src, /<h1 ref=\{titleRef\} className="ghr-title">/, "the headline is an h1, for search engines and screen readers")
assert.match(src, /className="ghr-word"/, "every word is its own span, so the glass can follow the browser's layout")
assert.match(src, /<canvas ref=\{canvasRef\} className="ghr-canvas" aria-hidden="true"/, "the canvas is paint, hidden from assistive tech")
assert.match(flat, /\[data-glass='true'\] \.ghr-title\{color:transparent\}/, "the h1 only goes transparent once the glass is drawn")
// The glass is measured from where each word sits; animating the headline
// would bake the entrance offset into the glass.
const animated = flat.match(/([^{}]+)\{animation:ghr-in/)
assert.ok(animated, "an entrance exists")
assert.doesNotMatch(animated[1], /ghr-title|ghr-content>\*/, "the headline is never moved by the entrance animation")

// ---- nothing fetched --------------------------------------------------------
for (const [name, text] of [["component", src], ["demo", demo]]) {
  const urls = [...text.matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0])
  assert.deepEqual(urls, [], `${name} must make no network requests: ${urls.join(", ")}`)
}

// ---- shaders ----------------------------------------------------------------
assert.match(src, /const VERT = `#version 300 es\n/, "vertex shader opens with #version")
assert.match(src, /const HEAD = `#version 300 es\n/, "fragment shaders open with #version")
for (const name of ["FIELD", "BLUR", "GLASS"]) assert.match(src, new RegExp("const " + name + " =\\n  HEAD \\+"), `${name} is built on HEAD`)
const glsl = src.slice(src.indexOf("const VERT ="), src.indexOf("const CSS =")).replace(/\/\/[^\n]*/g, "")
for (const word of ["flat", "smooth", "noperspective", "patch", "sample", "filter", "input", "output", "cast", "half", "fixed", "long", "short", "double", "unsigned", "active", "common", "partition", "resource", "union", "enum", "class", "namespace", "using", "sizeof", "goto", "static", "template", "attribute", "varying"]) {
  assert.doesNotMatch(glsl, new RegExp("\\b" + word + "\\b"), `GLSL ES 3.00 reserved word used in a shader: ${word}`)
}
assert.match(glsl, /smoothstep\(0\.08, 0\.92, hv\.g\)/, "faint anti-alias seams between overlapping glyphs never count as glass")

// ---- the loop ---------------------------------------------------------------
assert.match(src, /if \(visible && \(animating\(\) \|\| catching \|\| forming\)\) raf = requestAnimationFrame\(frame\)/, "nothing is drawn off screen or in a hidden tab: not the glide, not the forming")
assert.match(src, /new IntersectionObserver/, "it knows when it is scrolled away")
assert.match(src, /slow \+= raw > CRAWL_FRAME_S \? 3 : 1/, "a software renderer trips the watchdog within a few frames")
assert.match(src, /const dpr = lite \? 0\.65 :/, "the light path draws the glass below CSS resolution")
assert.match(src, /if \(layout === built\) return/, "the mask is only rebuilt when the layout actually changed: first paint asked for it four times")

// ---- pure logic (lifted from the #region block) --------------------------------
const region = src.match(/\/\/ #region glass([\s\S]*?)\/\/ #endregion/)
assert.ok(region, "glass region is present")
const js = region[1]
  .replace(/\): (number\[\]\[\]|number\[\] \| null|number\[\]|string\[\]|number|string) \{/g, ") {")
  .replace(/(\w+): (string\[\] \| undefined|number\[\]\[\]|number\[\]|string|number)/g, "$1")
  .replace(/ as number\[\]/g, "")
const { DEFAULT_COLORS, hexToRgb, paletteOf, splitWords, bevelPx, formed, fallbackBackground, follow, orbit } =
  await import("data:text/javascript," + encodeURIComponent(js))

assert.deepEqual(hexToRgb("#ffffff"), [1, 1, 1])
assert.deepEqual(hexToRgb("000000"), [0, 0, 0])
assert.equal(hexToRgb("#fff"), null, "short hex is rejected rather than misread")
assert.equal(hexToRgb("orange"), null)
const pal = paletteOf(["#000000", "not a colour"])
assert.equal(pal.length, 5, "always five colours")
assert.deepEqual(pal[0], [0, 0, 0], "a valid colour is used")
assert.deepEqual(pal[1], hexToRgb(DEFAULT_COLORS[1]), "a malformed colour falls back to the default in its slot")
assert.deepEqual(pal[4], hexToRgb(DEFAULT_COLORS[4]), "a missing colour falls back too")

assert.deepEqual(splitWords("  Bend   the\nlight "), ["Bend", "the", "light"])
assert.deepEqual(splitWords("   "), [])

assert.equal(bevelPx(10, 1), 2, "the bevel never collapses under two pixels")
assert.ok(Math.abs(bevelPx(200, 1.5) - 22.5) < 1e-9, "the bevel scales with the type and the mask")

// The glass forms on first paint: clear to full, easing out, and done on time.
assert.equal(formed(0, 1100), 0, "the glass starts clear")
assert.equal(formed(1100, 1100), 1, "and is fully formed on time")
assert.equal(formed(5000, 1100), 1, "and stays formed")
assert.ok(formed(550, 1100) > 0.5, "ease-out: most of the forming happens early")
let last = -1
for (let t = 0; t <= 1100; t += 50) { const f = formed(t, 1100); assert.ok(f >= last, "forming never reverses"); last = f }

// The fallback shows before the glass and instead of it. One malformed colour
// (an rgb() with hex alpha glued on, which is what shipped first) drops the
// whole declaration and leaves white type on white.
const bg = fallbackBackground(paletteOf(undefined))
assert.doesNotMatch(bg, /\)[0-9a-f]/i, "no hex alpha glued onto a colour function")
assert.equal((bg.match(/rgba\(\d+,\d+,\d+,[\d.]+\)/g) ?? []).length, 4, "four well-formed rgba() colours")
assert.match(bg, /rgba\(13,10,20,1\)$/, "the ground colour is the final, solid layer")

// Following the pointer is frame-rate independent: two half steps land where one full step does.
const once = follow(0, 1, 0.1, 7)
const twice = follow(follow(0, 1, 0.05, 7), 1, 0.05, 7)
assert.ok(Math.abs(once - twice) < 1e-12, "follow() does not depend on the frame rate")
assert.ok(follow(0, 1, 10, 7) > 0.999, "and it gets there")
for (let t = 0; t < 200; t += 0.37) {
  const [x, y] = orbit(t)
  assert.ok(x > 0.1 && x < 0.9 && y > 0.3 && y < 0.8, `the idle light stays over the headline (t=${t.toFixed(2)})`)
}

console.log("glass-headline-hero: ok")
