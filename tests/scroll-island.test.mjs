// Install-safety, motion and token check for components/scroll-island.
// Run: node tests/scroll-island.test.mjs
//
// Guards the failures that still look fine in a screenshot: a root that stops
// pinning to the viewport, an open state that only answers a mouse, labels
// collapsed in a way that takes the buttons' accessible names with them, and
// layout-animating properties creeping back into the reveal.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const src = readFileSync(
  new URL("../components/scroll-island/scroll-island.tsx", import.meta.url),
  "utf8",
)

const css = src.slice(src.indexOf("const styles = `") + 16, src.indexOf("\n`\n"))
assert.ok(css.length > 2000, "could not extract the style block")

/* ---------- install safety ---------- */

assert.doesNotMatch(css, /@import/, "no @import in the inline style block")
assert.doesNotMatch(css, /[`]|\$\{/, "no backticks or template holes inside the CSS")

for (const line of css.split("\n")) {
  const m = line.match(/^\s*([^@{}/*][^{]*)\{\s*$/)
  if (!m) continue
  for (const sel of m[1].split(",")) {
    const s = sel.trim()
    if (!s || s.startsWith("from") || s.startsWith("to") || /^[\d.]+%/.test(s)) continue
    assert.ok(s.startsWith(".sil"), `selector escapes the component root: ${s}`)
  }
}
assert.match(css, /\.sil img \{ max-width: none; \}/, "must opt out of Tailwind Preflight's img rule")

/* ---------- it has to actually pin to the viewport ---------- */

// The whole point of the component. `absolute` or `sticky` still screenshots
// correctly and silently stops riding the scroll.
const root = css.slice(css.indexOf("\n.sil {\n  position"), css.indexOf(".sil, .sil * {"))
assert.match(root, /position: fixed;/, "the root must be position: fixed to ride the scroll")
assert.match(root, /z-index:/, "a fixed overlay needs an explicit stacking order")

/* ---------- the reveal must not run layout ---------- */

// Opening is a clip, not a resize: the card sits at its open width and the
// closed state clips everything but the glyph column away. That is what keeps
// the glyphs still and the text from re-wrapping mid-transition.
const card = css.slice(css.indexOf("\n.sil__card {"), css.indexOf("\n.sil__edge {"))
assert.match(card, /transition: clip-path/, "the card reveals by clip-path")
assert.match(card, /width: var\(--sil-open\);/, "the card is always at its open width")
assert.match(css, /\.sil--right \.sil__card \{\s*clip-path: inset\(/, "right side clips to the rail")
assert.match(css, /\.sil--left \.sil__card \{\s*clip-path: inset\(/, "left side clips to the rail")

// Every one of these animated layout on the previous pass.
for (const prop of ["width", "padding", "gap", "font-size", "height"]) {
  const re = new RegExp("transition:[^;]*\\b" + prop + "\\b", "s")
  assert.doesNotMatch(css, re, `must not transition ${prop} — it triggers layout every frame`)
}

// grid-template-rows is the one exception: auto height has no transform
// analogue, and a max-height guess eases wrong and clips tall children.
const head = css.slice(css.indexOf("\n.sil__head {"), css.indexOf("\n.sil__head > div"))
assert.match(head, /grid-template-rows: 0fr;/, "collapsed panel uses 0fr")
assert.doesNotMatch(head, /max-height/, "no max-height guessing")

// clip-path clips the element's own shadow away with it.
assert.match(css, /\.sil__shell \{ filter: var\(--sil-shadow\); \}/, "elevation comes from a filter, not box-shadow")

/* ---------- motion values ---------- */

const num = (name) => Number((css.match(new RegExp("--sil-" + name + ": (\\d+)ms")) || [])[1])
const enter = num("dur-enter")
const exit = num("dur-exit")
assert.ok(enter > 0 && enter <= 300, `enter is ${enter}ms; UI motion stays under 300ms`)
assert.ok(exit < enter, `exit (${exit}ms) must be faster than enter (${enter}ms)`)
assert.ok(num("dur-press") <= 160, "press feedback stays under 160ms")

// ease-in anywhere would delay the first frame, the exact moment being watched.
assert.doesNotMatch(css, /cubic-bezier\(0\.4?2?,\s*0,\s*1,\s*1\)|\bease-in\b(?!-out)/, "no ease-in on UI motion")

// Rows are pressable and must say so.
assert.match(css, /\.sil__row:active \{ transform: scale\(0\.9[0-8]\); \}/, "rows need press feedback")

// Hover on a touch device sticks after a tap.
assert.match(
  css,
  /@media \(hover: hover\) and \(pointer: fine\) \{\s*\.sil__row:hover/,
  "row hover must be gated behind a real pointer",
)

// Labels arriving all at once reads flat; staggering on exit reads slow.
assert.match(css, /transition-delay: calc\(var\(--sil-i\) \* var\(--sil-stagger\)\);/, "labels stagger in")
const closedLbl = css.slice(css.indexOf("\n.sil__lbl {"), css.indexOf("\n.sil__meta {"))
assert.doesNotMatch(closedLbl, /transition-delay/, "no stagger on the way out")

// Nothing should appear from nothing.
assert.match(css, /\.sil--right \.sil__lbl, \.sil--right \.sil__meta \{ transform: translateX\(6px\); \}/, "labels slide the last few px in")

/* ---------- the glyph column hugs the pinned edge ---------- */

// If the glyphs were not ordered to the clipped-open edge, the closed rail
// would show the trailing meta text instead of the icons.
assert.match(css, /\.sil--right \.sil__ico \{ order: 3; \}/, "right-side glyphs sit at the edge")
assert.match(css, /\.sil--right \.sil__lbl \{ order: 1; \}/, "right-side labels lead")

/* ---------- open on more than hover ---------- */

assert.match(
  src,
  /const open = hovered \|\| focused \|\| pinned/,
  "open state must be the union of hover, focus and pin",
)
// Touch fires mouseenter on tap, opening by hover and pinning in one gesture.
assert.match(src, /onPointerEnter/, "hover-to-open must come from a pointer event")
assert.match(src, /if \(e\.pointerType === "mouse"\) setHovered\(true\)/, "only a real mouse opens on hover")
assert.doesNotMatch(src, /onMouseEnter/, "onMouseEnter cannot distinguish a tap")
assert.match(src, /e\.key !== "Escape"/, "Escape must unpin")
assert.match(
  src,
  /if \(!e\.currentTarget\.contains\(e\.relatedTarget as Node\)\) setFocused\(false\)/,
  "blur must ignore focus moving within the island",
)

/* ---------- accessible names survive the closed state ---------- */

assert.match(src, /aria-label=\{item\.label\}/, "each row names itself from its label")
assert.match(closedLbl, /opacity: 0;/, "labels fade rather than unmount")
assert.doesNotMatch(closedLbl, /display: none|visibility: hidden/, "labels must stay in the tree")
assert.match(css, /\.sil__row:focus-visible \{[^}]*outline:/s, "rows need a visible focus ring")

/* ---------- tokens ---------- */

// Semantic names, and every one of them defined for both surfaces — a token
// that only exists on the dark theme renders as nothing on the light one.
const semantic = [
  "surface", "surface-2", "surface-hover", "text", "text-muted",
  "border", "ring", "accent", "shadow",
]
const darkBlock = css.slice(css.indexOf(".sil {"), css.indexOf('.sil[data-theme="light"]'))
const lightBlock = css.slice(css.indexOf('.sil[data-theme="light"]'), css.indexOf("@media (prefers-color-scheme: light)"))
const autoBlock = css.slice(css.indexOf("@media (prefers-color-scheme: light)"), css.indexOf("\n.sil {\n  position"))
for (const t of semantic) {
  assert.ok(darkBlock.includes("--sil-" + t + ":"), `dark theme is missing --sil-${t}`)
  assert.ok(lightBlock.includes("--sil-" + t + ":"), `light theme is missing --sil-${t}`)
  assert.ok(autoBlock.includes("--sil-" + t + ":"), `auto theme is missing --sil-${t}`)
}

// Raw colours belong in the token block, not sprinkled through the rules.
const rules = css.slice(css.indexOf("\n.sil {\n  position"))
const strayHex = rules.match(/#[0-9A-Fa-f]{3,8}\b/g)
assert.equal(strayHex, null, `hardcoded colours outside the token layer: ${strayHex}`)
const strayRgba = rules.match(/rgba?\(/g)
assert.equal(strayRgba, null, "colours must come from tokens, not inline rgba()")

/* ---------- the clock cannot desync SSR ---------- */

assert.match(src, /const \[now, setNow\] = React\.useState<Date \| null>\(null\)/, "clock starts null")
assert.match(src, /if \(!now\) return null/, "clock renders nothing before mount")

/* ---------- reduced motion ---------- */

const rm = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"))
assert.match(rm, /transition-duration: 1ms !important;/, "reduced motion collapses the transitions")
assert.match(rm, /transition-delay: 0ms !important;/, "reduced motion drops the stagger")
assert.match(rm, /\.sil__lbl, \.sil__meta \{ transform: none !important; \}/, "reduced motion removes the slide")
assert.match(rm, /\.sil__row:active \{ transform: none; \}/, "reduced motion removes the press scale")

console.log("scroll-island: ok")
