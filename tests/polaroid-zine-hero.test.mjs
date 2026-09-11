// Install-safety check for components/polaroid-zine-hero.
// Run: node tests/polaroid-zine-hero.test.mjs
//
// The failures worth guarding here are the quiet ones. The headline is a drawn
// script, so a character with no glyph does not throw — it renders as a blank
// in the middle of the sentence. The typewritten column is justified by pinning
// each line to one measured width, so losing textLength turns it into ragged
// left-aligned copy that still looks deliberate. And the page animates, so it
// has to stay behind prefers-reduced-motion.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const src = readFileSync(
  new URL("../components/polaroid-zine-hero/polaroid-zine-hero.tsx", import.meta.url),
  "utf8",
)

const css = src.slice(src.indexOf("const CSS = `") + 13, src.indexOf("\n`\n"))
assert.ok(css.length > 400, "could not extract the style block")

/* ---------- install safety ---------- */

assert.doesNotMatch(css, /@import/, "no @import in the inline style block")
assert.doesNotMatch(css, /[`]|\$\{/, "no backticks or template holes inside the CSS")
assert.doesNotMatch(src, /https?:\/\/(?!www\.w3\.org)/, "no external origins — the capture sandbox blocks them")

for (const line of css.split("\n")) {
  const m = line.match(/^\s*([^@{}/*][^{]*)\{/)
  if (!m) continue
  for (const sel of m[1].split(",")) {
    const s = sel.trim()
    if (!s || s.startsWith("from") || s.startsWith("to")) continue
    assert.ok(s.startsWith(".pzh"), `selector escapes the component root: ${s}`)
  }
}

/* ---------- the height has to survive installation ---------- */

assert.match(src, /height = "100svh"/, "height must default to a definite length")
assert.doesNotMatch(src, /h-full/, "no h-full on the component root")
const rootRule = css.match(/\.pzh-root\{([^}]*)\}/)
assert.ok(rootRule, "missing the .pzh-root rule")
assert.doesNotMatch(rootRule[1], /height/, "the root must not set its own height")

/* ---------- motion is opt-out ---------- */

// The page cross-fades when it changes, so both the animation and the
// transition have to be switched off for anyone who asked for that.
const reduced = css.match(/@media \(prefers-reduced-motion: reduce\)\{([^}]*\}[^}]*)\}/)
assert.ok(reduced, "no prefers-reduced-motion block")
assert.match(reduced[1], /animation:none/, "the page change must stop under reduced motion")
assert.match(reduced[1], /transition:none/, "transitions must stop under reduced motion")

/* ---------- two on one page must not fight over ids ---------- */

assert.match(src, /React\.useId\(\)/, "ids must be namespaced per instance")
assert.equal(src.match(/url\(#(?!")/g), null, "every url(#...) must be built by u(), not hard-coded")

/* ---------- the justified column stays justified ---------- */

assert.match(src, /textLength="292"[\s\S]{0,40}lengthAdjust="spacing"/, "body lines must be pinned to one width")
// Both footer lines are pinned too, or a wider mono face runs them together.
assert.ok(
  (src.match(/lengthAdjust="spacing"/g) ?? []).length >= 3,
  "the footer lines must be pinned as well as the body",
)

/* ---------- every character in the drawn hand has a glyph ---------- */

const scriptBlock = src.slice(src.indexOf("const SCRIPT"), src.indexOf("\n}", src.indexOf("const SCRIPT")))
const drawn = new Set()
for (const m of scriptBlock.matchAll(/^\s*(?:"([^"]+)"|([A-Za-z0-9]))\s*:\s*\{\s*w:/gm)) {
  drawn.add(m[1] ?? m[2])
}
assert.ok(drawn.size > 60, `only found ${drawn.size} glyphs — the regex stopped matching`)

const slides = src.slice(src.indexOf("const DEFAULT_SLIDES"), src.indexOf("\n]", src.indexOf("const DEFAULT_SLIDES")))
const handwritten = []
for (const m of slides.matchAll(/\bscript:\s*"([^"]*)"/g)) handwritten.push(m[1])
for (const m of slides.matchAll(/\btail:\s*\[([^\]]*)\]/g)) {
  for (const q of m[1].matchAll(/"([^"]*)"/g)) handwritten.push(q[1])
}
assert.ok(handwritten.length >= 9, `only collected ${handwritten.length} handwritten strings`)

const missing = new Set()
for (const line of handwritten) {
  for (const ch of line) if (!drawn.has(ch)) missing.add(ch)
}
assert.deepEqual(
  [...missing],
  [],
  `the drawn hand is missing: ${[...missing].map((c) => JSON.stringify(c)).join(", ")}`,
)

// a-z has to be complete: the headline is a prop, so any word can arrive.
for (const ch of "abcdefghijklmnopqrstuvwxyz") {
  assert.ok(drawn.has(ch), `lowercase ${ch} has no glyph`)
}

/* ---------- the carousel only appears when there is something to page ---------- */

assert.match(src, /pages\.length > 1 \? \(/, "controls must hide for a single slide")
// Reaching either end unmounts that control; without moving focus back into
// the subtree every later arrow key is swallowed by <body>.
assert.match(src, /rootRef\.current\?\.focus\(\)/, "focus must return to the root at either end")

console.log("ok - polaroid-zine-hero")
