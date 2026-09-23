// Install-safety, shader and pour-timing checks for ink-flow-carousel.
// Run: node tests/ink-flow-carousel.test.mjs

import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const dir = new URL("../components/ink-flow-carousel/", import.meta.url)
const src = readFileSync(new URL("ink-flow-carousel.tsx", dir), "utf8")
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")

// ---- install safety --------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import the component may have")
assert.doesNotMatch(src, /@import/, "no @import")
assert.ok(src.includes('height = "100svh"'), "height prop defaults to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")

const css = src.match(/const CSS =\n([\s\S]*?)\n\n/)
assert.ok(css, "CSS block is present")
assert.doesNotMatch(css[1], /\$\{|`/, "no backticks or interpolation inside the CSS strings")
const flat = css[1].replace(/"\s*\+\s*\n\s*"/g, "").replace(/^\s*"|"\s*$/g, "")
let rules = 0
for (const m of flat.matchAll(/(?<=^|[{}])\s*([^{}]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || /^(from|to)$/.test(sel)) continue
  rules++
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".ifc-")), `unscoped CSS selector would leak into the host app: ${sel}`)
}
assert.ok(rules > 20, `expected the scope check to see real rules, saw ${rules}`)
assert.match(flat, /\.ifc-canvas,\.ifc-fallback\{[^}]*max-width:none/, "canvas and fallback override Preflight's max-width")
assert.match(flat, /:focus-visible/, "keyboard focus is visible, and only for keyboard users")
assert.match(flat, /prefers-reduced-motion:reduce/, "caption motion honours reduced motion")
assert.match(src, /prefers-reduced-motion: reduce/, "the fluid honours reduced motion")

const allowed = new Set(["--color-background", "--color-foreground", "--color-muted-foreground", "--color-border", "--color-primary"])
for (const [, v] of src.matchAll(/var\((--[a-z-]+)/g)) assert.ok(allowed.has(v), `token not guaranteed in a host: ${v}`)

// ---- nothing fetched --------------------------------------------------------
// 21st's capture sandbox refuses off-origin requests; a demo that makes one
// publishes with no video. The demo paints its posters instead.
for (const [name, text] of [["component", src], ["demo", demo]]) {
  const urls = [...text.matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0])
  assert.deepEqual(urls, [], `${name} must make no network requests: ${urls.join(", ")}`)
}
assert.doesNotMatch(demo, /<select|<input|<label/, "demo must not ship controls")

// ---- shaders ----------------------------------------------------------------
// GLSL ES 3.00 requires #version on the very first line. A template literal
// that opens with a newline fails the compile, and the only symptom is the
// fallback images.
assert.match(src, /const VERT = `#version 300 es\n/, "vertex shader opens with #version")
assert.match(src, /const HEAD = `#version 300 es\n/, "every fragment shader opens with #version")
assert.equal((src.match(/HEAD \+/g) ?? []).length, (src.match(/^  [a-z]+:\n?\s*HEAD/gm) ?? []).length, "every fragment shader is built on HEAD")
const glsl = src.slice(src.indexOf("const VERT ="), src.indexOf("type Tex =")).replace(/\/\/[^\n]*/g, "")
for (const word of ["flat", "smooth", "noperspective", "patch", "sample", "filter", "input", "output", "cast", "half", "fixed", "long", "short", "double", "unsigned", "active", "common", "partition", "resource", "union", "enum", "class", "namespace", "using", "sizeof", "goto", "static", "template", "attribute", "varying"]) {
  assert.doesNotMatch(glsl, new RegExp("\\b" + word + "\\b"), `GLSL ES 3.00 reserved word used in a shader: ${word}`)
}
assert.match(glsl, /textureGrad\(/, "images sample with a steady mip level, not the smeared coordinate's")

// ---- the coordinate map needs precision --------------------------------------
assert.match(src, /map = double\(dw, dh, true\)/, "the coordinate map asks for a 32-bit target")
assert.match(src, /full \? gl\.RGBA32F : gl\.RGBA16F/, "...and falls back to half float where 32-bit cannot be rendered")

// ---- the loop idles and adapts ------------------------------------------------
assert.match(src, /if \(E\.pour \|\| \(!still && now - E\.energy < SETTLE_S \* 1000\)\)/, "frames only run while something moves")
assert.match(src, /if \(slow >= SLOW_FRAMES\)/, "a device that cannot keep up drops to the light simulation")
assert.match(src, /const elapsed = Math\.min\(raw, 0\.25\)/, "a pour keeps to the clock on slow frames")

// ---- autoplay ----------------------------------------------------------------
const paused = src.match(/const paused = ([^\n]+)/)
assert.ok(paused, "pause condition is present")
assert.doesNotMatch(paused[1], /hover/i, "resting the pointer on the stage must not pause autoplay")
for (const reason of ["overRail", "focused", "hidden", "!inView"]) assert.ok(paused[1].includes(reason), `autoplay pauses for: ${reason}`)
assert.match(src, /const playing = [^\n]*!stopped/, "a user who took over is never rotated again")
assert.ok((src.match(/setStopped\(true\)/g) ?? []).length >= 4, "press, keys and both buttons all stop rotation")

// ---- pour timing (lifted from the #region block) -------------------------------
const region = src.match(/\/\/ #region ink([\s\S]*?)\/\/ #endregion/)
assert.ok(region, "ink region is present")
const js = region[1].replace(/\): (number|boolean) \{/g, ") {").replace(/(\w+): (number|boolean)/g, "$1")
const { POUR, FILL_START, RELAX, DISSIPATION, SETTLE_S, VISCOSITY, wrapIndex, smooth, fillLevel, jetStrength, bloomReach, residual } =
  await import("data:text/javascript," + encodeURIComponent(js))

assert.equal(wrapIndex(5, 5, true), 0, "wraps forward")
assert.equal(wrapIndex(-1, 5, true), 4, "wraps back")
assert.equal(wrapIndex(9, 5, false), 4, "clamps without loop")
assert.equal(smooth(0, 1, -1), 0)
assert.equal(smooth(0, 1, 2), 1)

// The swap is invisible only if the new slide's ink covers everything on the
// frame it lands. A floor, not an increment, so this holds at any frame rate.
assert.equal(fillLevel(1), 1, "the stage is fully inked when the pour lands")
assert.equal(fillLevel(FILL_START), 0, "nothing is topped up before the floor starts rising")
assert.equal(fillLevel(0.2), 0, "early on, the flow alone carries the ink")
let prev = -1
for (let p = 0; p <= 1.0001; p += 0.01) {
  const f = fillLevel(p)
  assert.ok(f >= prev, `the floor never drops (p=${p.toFixed(2)})`)
  prev = f
}

assert.equal(jetStrength(0), 1, "the jet starts at full strength")
assert.equal(jetStrength(POUR), 0, "the jet stops when the pour phase ends")
assert.ok(bloomReach(FILL_START + 0.06) === 1, "the bloom reaches the far corner just after the floor starts")
assert.ok(bloomReach(POUR) > 0.2 && bloomReach(POUR) < 0.6, "the jet has the stage mostly to itself early on")

// Stopping the loop snaps the last of the distortion flat; that snap must be
// invisible, so what is left by then has to be under 1%.
assert.ok(residual(SETTLE_S) < 0.01, `distortion left at the stop: ${(residual(SETTLE_S) * 100).toFixed(2)}%`)
assert.ok(RELAX > 0 && DISSIPATION > 0 && VISCOSITY > RELAX, "fine detail must smooth out faster than the broad swirls relax")

console.log("ink-flow-carousel: ok")
