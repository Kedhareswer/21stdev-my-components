// Install-safety check for components/hover-expand-gallery.
// Run: node tests/hover-expand-gallery.test.mjs
//
// Everything this component does is CSS, so the failures worth guarding are the
// silent ones: a root that collapses on a page with no height chain, a layout
// that stops animating, styles that only exist in this repo's dev harness.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const src = readFileSync(
  new URL("../components/hover-expand-gallery/hover-expand-gallery.tsx", import.meta.url),
  "utf8",
)

// A component root that inherits its height renders fine here and collapses to
// 0px once installed. It must carry its own definite length.
assert.ok(/height = "100svh"/.test(src), "root height must default to a definite length")
assert.doesNotMatch(src, /className={?`?[^`"]*\bh-full\b[^`"]*`?}?\s*>/, "no h-full on the root")

// The desktop open/close is a flex-basis transition, rail width to open width.
// Growing into the free space under a max-width cap animates on paper and snaps
// in practice — the clamp is reached in the first fifth of the travel.
for (const need of [
  "lg:[flex-basis:var(--hx-basis)]",
  "lg:transition-[flex-basis]",
  '"--hx-basis": isActive ? "var(--hx-max)" : "var(--hx-rail)"',
]) {
  assert.ok(src.includes(need), `missing ${need} — the panel would snap open`)
}

// Tailwind Preflight's `img { max-width: 100% }` reaches into the pinned image
// and collapses it inside the rail-offset box.
assert.ok(/maxWidth: "none"/.test(src), "images need an explicit max-width escape")

// 21st ships this file alone. Anything that assumes the host's stylesheet, or
// restyles the host's page, does not survive the trip.
assert.doesNotMatch(src, /@import/, "no @import — the host owns Tailwind and fonts")
assert.doesNotMatch(src, /^\s*(\*|body|:root)\s*{/m, "no bare global resets")

// Motion is not optional.
assert.ok(src.includes("motion-reduce:transition-none"), "must honour prefers-reduced-motion")

console.log("hover-expand-gallery: ok")
