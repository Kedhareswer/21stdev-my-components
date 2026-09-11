// Install-safety + behaviour check for components/scroll-island.
// Run: node tests/scroll-island.test.mjs
//
// The failures worth guarding here are the ones that still look fine in a
// screenshot: a root that stops pinning to the viewport, an open state that only
// responds to a mouse, and labels collapsed in a way that takes the buttons'
// accessible names with them.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const src = readFileSync(
  new URL("../components/scroll-island/scroll-island.tsx", import.meta.url),
  "utf8",
)

const css = src.slice(src.indexOf("const styles = `") + 16, src.indexOf("\n`\n"))
assert.ok(css.length > 1500, "could not extract the style block")

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

// Tailwind Preflight's img{max-width:100%} collapses absolutely positioned media
// to 0px wide while it still reports a bounding box.
assert.match(css, /\.sil img \{ max-width: none; \}/, "must opt out of Preflight's img rule")

/* ---------- it has to actually pin to the viewport ---------- */

// This is the whole point of the component. `absolute` or `sticky` here still
// renders correctly in a screenshot and silently stops riding the scroll.
const root = css.slice(css.indexOf(".sil {"), css.indexOf(".sil, .sil * {"))
assert.match(root, /position: fixed;/, "the root must be position: fixed to ride the scroll")
assert.match(root, /z-index:/, "a fixed overlay needs an explicit stacking order")
assert.match(css, /\.sil--right \{ right:/, "right edge placement")
assert.match(css, /\.sil--left \{ left:/, "left edge placement")

/* ---------- open on more than hover ---------- */

// Hover alone leaves the island unreachable by keyboard and unusable on touch.
// All three inputs have to feed the open state.
assert.match(src, /onMouseEnter=\{\(\) => setHovered\(true\)\}/, "opens on hover")
assert.match(src, /onFocus=\{\(\) => setFocused\(true\)\}/, "opens on focus")
assert.match(src, /setPinned\(true\)/, "taps pin it open")
assert.match(
  src,
  /const open = hovered \|\| focused \|\| pinned/,
  "open state must be the union of hover, focus and pin",
)

// Leaving by keyboard has to be possible, and a tap outside must dismiss it.
assert.match(src, /e\.key !== "Escape"/, "Escape must unpin")
assert.match(src, /pointerdown/, "an outside tap must dismiss a pinned island")

// Focus must only drop when it leaves the island entirely, or tabbing between
// rows would close the panel under the user.
assert.match(
  src,
  /if \(!e\.currentTarget\.contains\(e\.relatedTarget as Node\)\) setFocused\(false\)/,
  "blur must ignore focus moving within the island",
)

/* ---------- accessible names survive the closed state ---------- */

// The label is the button's accessible name at every size, so it must come from
// aria-label rather than from text that the closed rail clips away.
assert.match(src, /aria-label=\{item\.label\}/, "each row names itself from its label")

// Clipping is fine; display:none or visibility:hidden would remove the text from
// the tree and, with it, any fallback name.
const lbl = css.slice(css.indexOf(".sil__lbl {"), css.indexOf(".sil__meta {"))
assert.match(lbl, /opacity: 0;/, "labels fade rather than unmount")
assert.doesNotMatch(lbl, /display: none|visibility: hidden/, "labels must stay in the tree")

// Focus has to be visible on a dark surface.
assert.match(css, /\.sil__row:focus-visible \{[^}]*outline:/s, "rows need a visible focus ring")

/* ---------- auto height without JS ---------- */

// 0fr -> 1fr is the only way to transition to a content-driven height without
// measuring. A max-height guess eases wrong and clips tall content.
const head = css.slice(css.indexOf(".sil__head {"), css.indexOf(".sil__items {"))
assert.match(head, /grid-template-rows: 0fr;/, "collapsed panel uses 0fr")
assert.match(css, /\.sil\[data-open="true"\] \.sil__head \{[^}]*grid-template-rows: 1fr;/s, "open panel uses 1fr")
assert.doesNotMatch(head, /max-height/, "no max-height guessing")

/* ---------- the clock cannot desync SSR ---------- */

// Rendering a real time on the server and a different one on the client is a
// hydration mismatch. It starts null and fills in after mount.
assert.match(src, /const \[now, setNow\] = React\.useState<Date \| null>\(null\)/, "clock starts null")
assert.match(src, /if \(!now\) return null/, "clock renders nothing before mount")

/* ---------- reduced motion ---------- */

const rm = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"))
assert.match(rm, /transition-duration: 1ms !important;/, "reduced motion collapses the transitions")
assert.match(rm, /transition-delay: 0ms !important;/, "reduced motion drops the staggered delays")
for (const cls of ["sil__card", "sil__head", "sil__lbl"]) {
  assert.ok(rm.includes(cls), `reduced motion must cover .${cls}`)
}

console.log("scroll-island: ok")
