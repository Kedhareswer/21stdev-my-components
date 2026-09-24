// Install-safety check for components/craft-desk-portfolio-hero.
// Run: node tests/craft-desk-portfolio-hero.test.mjs
//
// The desk is drawn, not photographed, and every object on it is a draggable
// piece placed by a layout table. The failures worth guarding are the ones
// that still look fine locally: a piece missing from one layout, an overlay
// that swallows the pointer, a page that can no longer scroll on a phone, or
// an asset that loads from somewhere the capture sandbox blocks.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const src = readFileSync(
  new URL("../components/craft-desk-portfolio-hero/craft-desk-portfolio-hero.tsx", import.meta.url),
  "utf8",
)

const cssStart = src.indexOf("const CSS = `") + 13
const css = src.slice(cssStart, src.indexOf("\n`\n", cssStart))
assert.ok(css.length > 500, "could not lift the CSS block")

/* ---------- nothing travels with it ---------- */

assert.doesNotMatch(src, /https?:\/\//, "no external URL anywhere in the component")
assert.doesNotMatch(src, /@import|@font-face|<link\b|fetch\(|new Image\(|<img\b/, "nothing may load at runtime")
assert.doesNotMatch(css, /url\(/, "no url() in the style block")
assert.doesNotMatch(css, /[`]|\$\{/, "no backticks or template holes inside the CSS")
assert.doesNotMatch(css, /^\s*(\*|body|html|:root)\s*[{,]/m, "no bare global resets")
for (const line of css.split("\n")) {
  const m = line.match(/^\s*([^@{}/*][^{]*)\{/)
  if (!m || /^(from|to|\d)/.test(m[1].trim())) continue
  for (const sel of m[1].split(",")) {
    const s = sel.trim()
    if (s) assert.ok(s.startsWith(".cdp"), `selector escapes the component root: ${s}`)
  }
}

// Every word on the desk is felt-tip capitals, drawn — a script font stack
// resolves to a serif on the headless box that renders the cover.
assert.match(src, /const CAPS: Record<string, Pen> = \{/, "the marker hand must be drawn, not a font")
for (const ch of "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789") {
  assert.match(src, new RegExp(`^  "?${ch}"?: \\{ w: \\d+, d: "M`, "m"), `glyph ${ch} missing`)
}
assert.doesNotMatch(src, /cursive|Comic Sans|Marker Felt|Bradley Hand|Segoe Print/, "no script font stack")
assert.equal((css.match(/font:(?!inherit)|font-family/g) ?? []).length, 1, "one printed face, for the two buttons; everything else is drawn")

// Tailwind Preflight caps img/svg image widths; the two optional photos are
// absolutely placed inside the drawing.
for (const m of src.matchAll(/<image [^>]*>/g)) {
  assert.match(m[0], /maxWidth: "none"/, `an <image> is exposed to Preflight: ${m[0].slice(0, 60)}`)
}

/* ---------- height ---------- */

assert.match(src, /height = "100svh"/, "height must default to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
const rootRule = css.match(/\.cdp-root\{([^}]*)\}/)
assert.ok(rootRule, "missing the .cdp-root rule")
assert.doesNotMatch(rootRule[1], /(^|;)height/, "the root takes its height from the prop, not CSS")

assert.match(src, /React\.useId\(\)/, "ids must be namespaced per instance")
assert.equal(src.match(/url\(#(?!")/g), null, "every url(#...) must be built by u(), not hard-coded")

/* ---------- layouts ---------- */

// Every piece has a home on both desks. A piece missing from one layout
// crashes the render the moment the box crosses the aspect threshold.
const pieces = [...src.slice(src.indexOf("const PIECES = ["), src.indexOf("] as const")).matchAll(/"([a-z0-9-]+)"/g)].map((m) => m[1])
assert.ok(pieces.length >= 30, "could not read the piece list")
assert.equal(new Set(pieces).size, pieces.length, "duplicate piece id")
for (const name of ["WIDE", "TALL"]) {
  const start = src.indexOf(`const ${name}: Layout = {`)
  const block = src.slice(start, src.indexOf("\n}\n", start))
  const w = Number(block.match(/w: (\d+)/)[1])
  const h = Number(block.match(/h: (\d+)/)[1])
  const placed = [...block.matchAll(/^\s+"?([a-z0-9-]+)"?: \[(-?\d+), (-?\d+), (-?\d+)\],$/gm)]
  assert.deepEqual(placed.map((m) => m[1]).sort(), [...pieces].sort(), `${name} must place every piece exactly once`)
  for (const [, id, x, y] of placed) {
    assert.ok(+x >= 0 && +x <= w && +y >= 0 && +y <= h, `${name}: ${id} is placed off the desk`)
  }
}
// …and a drawing.
const drawStart = src.indexOf("const draw: Record<PieceId, () => React.ReactNode> = {")
assert.ok(drawStart > -1, "draw table missing")
const drawBlock = src.slice(drawStart, src.indexOf("\n  }\n", drawStart))
for (const id of pieces) {
  assert.ok(new RegExp(`^    "?${id}"?: `, "m").test(drawBlock), `no drawing for ${id}`)
}

/* ---------- pointer and motion ---------- */

// Dragging needs touch-action:none, but only on the pieces: on the root it
// would stop a phone scrolling past the hero at all.
assert.match(css, /\.cdp-piece\{[^}]*touch-action:none/, "pieces must opt out of touch panning")
assert.doesNotMatch(rootRule[1], /touch-action/, "the root must still let the page scroll")
assert.doesNotMatch(css, /\.cdp-board\{[^}]*touch-action/, "the board must still let the page scroll")

// The light, the shade and the mat sit over or under the pieces and must never
// take the pointer, or nothing on the desk can be picked up.
for (const layer of ["cdp-mat", "cdp-light", "cdp-shade"]) {
  assert.match(css, new RegExp(`\\.${layer}\\{[^}]*pointer-events:none`), `.${layer} must not take the pointer`)
}

// Taps are resolved from the element the press began on, because the board
// captures the pointer and the click lands on the <svg>.
assert.match(src, /setPointerCapture\(e\.pointerId\)/, "the board must capture the pointer while dragging")
assert.match(src, /closest\("\[data-tap\]"\)/, "taps are dispatched by data-tap")
for (const tap of ["todo:", "crayon:", "glue", "lamp", "avatar", "eraser", "title", "spin", "polaroid", "name"]) {
  assert.match(src, new RegExp(`data-(tap|piece)=\\{?["']${tap}|"${tap}" \\+|data-tap=\\{"${tap}`), `nothing is tagged ${tap}`)
}

// A CSS transform replaces an SVG transform attribute, so anything that
// animates by CSS must not also carry a transform attribute.
for (const cls of ["cdp-lift", "cdp-spin", "cdp-squish", "cdp-wink", "cdp-key", "cdp-twinkle", "cdp-crayon", "cdp-puddle"]) {
  for (const m of src.matchAll(new RegExp(`<g[^>]*className=[^>]*${cls}[^>]*>`, "g"))) {
    assert.doesNotMatch(m[0], /\btransform=/, `.${cls} would drop its own transform attribute: ${m[0]}`)
  }
}

assert.match(css, /@media \(prefers-reduced-motion:reduce\)\{/, "motion must be gated by prefers-reduced-motion")
const reduced = css.slice(css.indexOf("@media (prefers-reduced-motion:reduce)"))
assert.match(reduced, /\.cdp-ink\{animation:none;stroke-dashoffset:0\}/, "reduced motion must show the title fully drawn, not blank")
assert.match(reduced, /\.cdp-light[^{]*\{animation:none\}/, "reduced motion must stop the light drifting")

// Every keyboard-reachable piece has a name; arrow keys move it.
assert.match(src, /ArrowLeft: \[-step, 0\]/, "arrow keys must move the focused piece")
assert.match(src, /role="checkbox"/, "to-do rows are checkboxes to assistive tech")

console.log("ok - craft-desk-portfolio-hero")
