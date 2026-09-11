// Install-safety check for components/pinboard-portfolio-hero.
// Run: node tests/pinboard-portfolio-hero.test.mjs
//
// The failures worth guarding here are the quiet ones. The poster draws its own
// display face and its own handwriting, so a character with no glyph does not
// throw and does not look broken in review — it silently renders as a space in
// the middle of a label. The rest is the usual install surface: a style block
// that escapes the component root, a percentage height that collapses to 0px on
// an installed page, and an id that two instances on one page would share.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const src = readFileSync(
  new URL("../components/pinboard-portfolio-hero/pinboard-portfolio-hero.tsx", import.meta.url),
  "utf8",
)

const css = src.slice(src.indexOf("const CSS = `") + 13, src.indexOf("\n`\n"))
assert.ok(css.length > 600, "could not extract the style block")

/* ---------- install safety ---------- */

assert.doesNotMatch(css, /@import/, "no @import in the inline style block")
assert.doesNotMatch(css, /[`]|\$\{/, "no backticks or template holes inside the CSS")
assert.doesNotMatch(src, /https?:\/\/(?!www\.w3\.org)/, "no external origins — the capture sandbox blocks them")

for (const line of css.split("\n")) {
  const m = line.match(/^\s*([^@{}/*][^{]*)\{/)
  if (!m) continue
  for (const sel of m[1].split(",")) {
    const s = sel.trim()
    if (!s) continue
    assert.ok(s.startsWith(".pph"), `selector escapes the component root: ${s}`)
  }
}

/* ---------- the height has to survive installation ---------- */

// dev/styles.css gives html, body and #root a height. An installed page does
// not, so anything percentage-based below the root paints at 0px there while
// still looking correct in the workshop.
assert.match(src, /height = "100svh"/, "height must default to a definite length")
assert.doesNotMatch(src, /h-full/, "no h-full on the component root")

// The root takes its height from the prop, never from a percentage in the style
// block. The full-bleed layers inside it may use 100% — they are absolutely
// positioned against a root that already has a definite height.
const rootRule = css.match(/\.pph-root\{([^}]*)\}/)
assert.ok(rootRule, "missing the .pph-root rule")
assert.doesNotMatch(rootRule[1], /height/, "the root must not set its own height")
for (const m of css.matchAll(/(\.pph-[\w-]+)\{([^}]*height:\s*100%[^}]*)\}/g)) {
  assert.match(m[2], /position:absolute/, `${m[1]} uses a percentage height without being positioned`)
}

/* ---------- two on one page must not fight over ids ---------- */

assert.match(src, /React\.useId\(\)/, "ids must be namespaced per instance")
// Every url(#...) has to go through the namespacing helper, never a literal.
const literalRefs = src.match(/url\(#(?!")/g)
assert.equal(literalRefs, null, "every url(#...) must be built by u(), not hard-coded")

/* ---------- every character in the copy has a glyph ---------- */

const block = (name) => {
  const start = src.indexOf(name)
  assert.ok(start > -1, `missing ${name}`)
  return src.slice(start, src.indexOf("\n}", start))
}

const drawn = new Set()
for (const m of block("const HANDWRITING").matchAll(/^\s*(?:"([^"]+)"|([A-Za-z0-9]))\s*:\s*\{\s*w:/gm)) {
  drawn.add(m[1] ?? m[2])
}
for (const m of block("const COMPOSED").matchAll(/^\s*"([^"]+)"\s*:\s*\{\s*base:/gm)) {
  drawn.add(m[1])
}
assert.ok(drawn.size > 40, `only found ${drawn.size} glyphs — the regex stopped matching`)

// Everything the poster actually sets in the drawn hand.
const copy = []
for (const m of src.matchAll(/\bt:\s*"([^"]*)"/g)) copy.push(m[1])
for (const name of ["const PRINT_NOTE", "const COMMS_NOTE", "const UX_NOTE"]) {
  const line = src.slice(src.indexOf(name), src.indexOf("\n", src.indexOf(name)))
  for (const m of line.matchAll(/"([^"]*)"/g)) copy.push(m[1])
}
copy.push(src.match(/name = "([^"]+)"/)[1])
assert.ok(copy.length >= 16, `only collected ${copy.length} strings of copy`)

const missing = new Set()
for (const line of copy) {
  for (const ch of line) if (!drawn.has(ch)) missing.add(ch)
}
assert.deepEqual(
  [...missing],
  [],
  `copy uses characters with no drawn glyph: ${[...missing].map((c) => JSON.stringify(c)).join(", ")}`,
)

// The uppercase fallback is a safety net, not a licence to skip a capital: a
// missing "U" would quietly set "ux/ui design" in the middle of the wall.
for (const ch of "ABCDEIKMNPSTUXĐ") {
  assert.ok(drawn.has(ch), `capital ${ch} has no glyph of its own`)
}

/* ---------- the lockup is measured, not eyeballed ---------- */

// Both rows are scaled to the widths the poster measures. If a glyph advance
// changes, these keep the rows aligned instead of drifting apart.
assert.match(src, /const TOP_S = 464 \/ TOP\.width/, "top row must be fitted to its measured width")
assert.match(src, /const BOT_S = 434 \/ BOTTOM\.width/, "bottom row must be fitted to its measured width")
// FOLIO is mirrored on its baseline — a positive y scale would un-flip it.
assert.match(src, /scale\(" \+ BOT_S \+ " " \+ -BOT_S \+ "\)/, "the lower line must stay mirrored")

console.log("ok - pinboard-portfolio-hero")
