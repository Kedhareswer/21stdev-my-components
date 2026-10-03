// Install-safety, shader and dissolve-timeline checks for particle-dissolve-carousel.
// Run: node tests/particle-dissolve-carousel.test.mjs

import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"

const dir = new URL("../components/particle-dissolve-carousel/", import.meta.url)
const src = readFileSync(new URL("particle-dissolve-carousel.tsx", dir), "utf8")
const demos = readdirSync(dir)
  .filter((f) => /^demo.*\.tsx$/.test(f))
  .map((f) => [f, readFileSync(new URL(f, dir), "utf8")])

// ---- folder anatomy ----------------------------------------------------------
for (const f of readdirSync(dir)) {
  assert.ok(f === "particle-dissolve-carousel.tsx" || f === "README.md" || /^demo(-[a-z-]+)?\.tsx$/.test(f), `nothing else ships in the folder: ${f}`)
}

// ---- install safety --------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import the component may have")
assert.doesNotMatch(src, /@import/, "no @import")
assert.ok(src.includes('height = "100svh"'), "height prop defaults to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
for (const [name, text] of demos) {
  const from = [...text.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
  assert.deepEqual(from, ["react", "@/components/ui/particle-dissolve-carousel"], `${name} imports only react and the component`)
  assert.doesNotMatch(text, /<select|<input|<label/, `${name} must not ship controls`)
}

const css = src.match(/const CSS =\n([\s\S]*?)\n\n/)
assert.ok(css, "CSS block is present")
assert.doesNotMatch(css[1], /\$\{|`/, "no backticks or interpolation inside the CSS strings")
const flat = css[1].replace(/"\s*\+\s*\n\s*"/g, "").replace(/^\s*"|"\s*$/g, "")
let rules = 0
for (const m of flat.matchAll(/(?<=^|[{}])\s*([^{}]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || /^(from|to)$/.test(sel)) continue
  rules++
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".pdc-")), `unscoped CSS selector would leak into the host app: ${sel}`)
}
assert.ok(rules > 30, `expected the scope check to see real rules, saw ${rules}`)
assert.match(flat, /\.pdc-canvas,\.pdc-fallback\{[^}]*max-width:none/, "canvas and fallback override Preflight's max-width")
assert.match(flat, /\.pdc-thumb img\{[^}]*max-width:none/, "the up-next thumbnail overrides Preflight's max-width")
assert.match(src, /<img src=\{nextItem\.src\} alt="" width=\{96\} height=\{64\}/, "the thumbnail has explicit dimensions")
assert.match(flat, /:focus-visible/, "keyboard focus is visible, and only for keyboard users")
assert.match(flat, /@media \(hover:hover\) and \(pointer:fine\)/, "hover styles are gated off touch")
assert.match(flat, /prefers-reduced-motion:reduce/, "text motion honours reduced motion")
assert.match(src, /prefers-reduced-motion: reduce/, "the particles honour reduced motion")

const allowed = new Set(["--color-background", "--color-foreground", "--color-muted-foreground", "--color-border", "--color-primary"])
for (const [, v] of src.matchAll(/var\((--[a-z-]+)/g)) assert.ok(allowed.has(v), `token not guaranteed in a host: ${v}`)

// ---- nothing fetched --------------------------------------------------------
// 21st's capture sandbox refuses off-origin requests; a demo that makes one
// publishes with no video. The demos paint their pictures instead.
for (const [name, text] of [["component", src], ...demos]) {
  const urls = [...text.matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0])
  assert.deepEqual(urls, [], `${name} must make no network requests: ${urls.join(", ")}`)
}

// ---- shaders ----------------------------------------------------------------
// GLSL ES 3.00 requires #version on the very first line; a leading newline
// fails the compile and the only symptom is the fallback images.
for (const name of ["QUAD_VERT", "GRAIN_FRAG"]) {
  assert.match(src, new RegExp("const " + name + " = `#version 300 es\\n"), `${name} opens with #version`)
}
for (const name of ["PICTURE_FRAG", "GRAIN_VERT"]) {
  assert.match(src, new RegExp("const " + name + " =\\n  `#version 300 es\\n"), `${name} opens with #version`)
}
const glsl = src.slice(src.indexOf("const TIMELINE ="), src.indexOf("type Picture =")).replace(/\/\/[^\n]*/g, "")
for (const word of ["flat", "smooth", "noperspective", "patch", "sample", "filter", "input", "output", "cast", "half", "fixed", "long", "short", "double", "unsigned", "active", "common", "partition", "resource", "union", "enum", "class", "namespace", "using", "sizeof", "goto", "static", "template", "attribute", "varying"]) {
  assert.doesNotMatch(glsl, new RegExp("\\b" + word + "\\b"), `GLSL ES 3.00 reserved word used in a shader: ${word}`)
}
// The picture and the grains must agree on every place's timeline, or a
// grain lifts off somewhere the picture is still whole.
assert.equal((src.match(/^  TIMELINE \+$/gm) ?? []).length, 2, "both the picture and the grains are built on TIMELINE")
assert.match(src, /transformFeedbackVaryings\(prog, varyings, gl\.SEPARATE_ATTRIBS\)/, "grain state is written back by transform feedback")
assert.match(src, /grainProg = program\(GRAIN_VERT, GRAIN_FRAG, \["v_state", "v_life"\]\)/, "...into the two state buffers")
assert.match(src, /gl\.bindBufferBase\(gl\.TRANSFORM_FEEDBACK_BUFFER, 0, null\)/, "feedback buffers are unbound before they are read as attributes")
assert.match(src, /if \(back >= 1\.0\) \{\s*\/\/[^\n]*\n\s*d = vec2\(0\.0\);\s*v = vec2\(0\.0\);/, "a grain that lands drops its flight, so nothing springs back after the swap")

// ---- the loop idles and adapts ------------------------------------------------
assert.match(src, /if \(E\.wave \|\| \(L\.awake && \(shedding \|\| now - E\.energy < SETTLE_S \* 1000\)\)\)/, "frames only run while something moves, and never off screen")
assert.match(src, /if \(slow >= SLOW_FRAMES\)/, "a device that cannot keep up drops to half the grains")
assert.match(src, /const elapsed = Math\.min\(raw, 0\.25\)/, "a dissolve keeps to the clock on slow frames")
assert.match(src, /E\.queued = active/, "a slide asked for mid-dissolve waits instead of cutting the running one")

// ---- autoplay ----------------------------------------------------------------
const paused = src.match(/const paused = ([^\n]+)/)
assert.ok(paused, "pause condition is present")
assert.doesNotMatch(paused[1], /hover/i, "resting the pointer on the picture must not pause autoplay")
for (const reason of ["overControls", "focused", "hidden", "!inView"]) assert.ok(paused[1].includes(reason), `autoplay pauses for: ${reason}`)
assert.match(src, /const playing = [^\n]*!stopped/, "a user who took over is never rotated again")
assert.ok((src.match(/setStopped\(true\)/g) ?? []).length >= 4, "tap, keys, bars and buttons all stop rotation")

// ---- dissolve timeline (lifted from the #region block) ---------------------------
const region = src.match(/\/\/ #region dust([\s\S]*?)\/\/ #endregion/)
assert.ok(region, "dust region is present")
const js = region[1]
  .replace(/: \[number, number, number\] = \[/g, " = [")
  .replace(/ as \[number, number, number\]/g, "")
  .replace(/\): [^{]+\{/g, ") {")
  .replace(/(\w+)\??: (number|boolean|string|\[number, number\] \| null)/g, "$1")
const { STAGGER, RELEASE, RETURN_START, RETURN_END, LAND_START, wrapIndex, grainPhase, grainCount, grid, parseHex, waveReach } =
  await import("data:text/javascript," + encodeURIComponent(js))

assert.equal(wrapIndex(5, 5, true), 0, "wraps forward")
assert.equal(wrapIndex(-1, 5, true), 4, "wraps back")
assert.equal(wrapIndex(9, 5, false), 4, "clamps without loop")

// The swap is invisible only if every grain is home and the new picture whole
// on the frame the dissolve lands, whatever a place's order in the wave.
for (let i = 0; i <= 20; i++) {
  const o = i / 20
  assert.equal(grainPhase(1, o), 1, `every grain is home at the end (order ${o.toFixed(2)})`)
  assert.equal(grainPhase(0, o), 0, `no grain has left at the start (order ${o.toFixed(2)})`)
  let prev = -1
  for (let p = 0; p <= 1.0001; p += 0.02) {
    const l = grainPhase(p, o)
    assert.ok(l >= prev, "a grain's timeline never runs backwards")
    prev = l
  }
}
assert.ok(grainPhase(0.3, 0) > grainPhase(0.3, 1), "the front of the wave goes first")
assert.ok(0 < RELEASE && RELEASE < RETURN_START && RETURN_START < LAND_START && LAND_START < RETURN_END && RETURN_END < 1, "lift off, fly, come home, land, in that order")
assert.ok((1 - STAGGER) * (RETURN_START - RELEASE) > 0.12, "every grain gets a real flight, not a twitch")

// The shaders hold the same numbers as the region.
for (const [k, v] of Object.entries({ STAGGER, RELEASE, RETURN_START, RETURN_END, LAND_START })) {
  assert.match(src, new RegExp('"const float ' + k + ' = " \\+ f\\(' + k + '\\)'), `${k} reaches the shaders from the region`)
  assert.ok(v > 0 && v < 1, `${k} is a share of the timeline`)
}

assert.equal(grainCount(1440, 900, 160000), 160000, "a full-screen stage gets the full budget")
assert.ok(grainCount(400, 300, 160000) < 30000, "a small stage gets fewer grains")
const [cols, rows] = grid(160000, 1.6)
assert.ok(Math.abs(cols * rows - 160000) / 160000 < 0.01, "the grid has about as many cells as asked")
assert.ok(Math.abs(cols / rows - 1.6) < 0.02, "...in the stage's aspect")

assert.deepEqual(parseHex("#ffffff"), [1, 1, 1])
assert.deepEqual(parseHex("#000"), [0, 0, 0])
assert.deepEqual(parseHex("tomato", [0.1, 0.2, 0.3]), [0.1, 0.2, 0.3], "anything not hex falls back")

assert.ok(Math.abs(waveReach(0, 0.5, 1.6, null) - Math.hypot(1.6, 0.5)) < 1e-9, "a point wave reaches the farthest corner")
assert.ok(Math.abs(waveReach(1.6, 0.5, 1.6, [-1, 0]) - 1.6) < 1e-9, "an edge sweep crosses the whole stage")

console.log("particle-dissolve-carousel: ok")
