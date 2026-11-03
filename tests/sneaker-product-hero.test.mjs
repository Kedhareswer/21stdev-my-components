// Install-safety checks for components/sneaker-product-hero.
// Run: node tests/sneaker-product-hero.test.mjs
//
// The component is layout plus a few GSAP tweens, so these are source
// assertions for the rules that break silently once the file is installed.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const src = readFileSync(
  new URL("../components/sneaker-product-hero/sneaker-product-hero.tsx", import.meta.url),
  "utf8",
)

// A root that inherits its height renders here and collapses to 0px installed.
assert.ok(/height = "100svh"/.test(src), "root height must default to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")

// Tailwind Preflight's img { max-width: 100% } must not reach the shoe images.
assert.ok(src.includes("img{max-width:none"), "images need a max-width escape")

// The host's button reset must not lose to ours, nor ours to the host's:
// the local reset is zero-specificity so .snp-size / .snp-swatch keep their looks.
assert.ok(src.includes(":where(.snp-root) :where(button)"), "button reset must be :where()")

// The colourway swap: the old shoe lifts out the top, the new one rises from below.
assert.ok(src.includes("yPercent: -130"), "outgoing shoe leaves upwards")
assert.ok(src.includes("{ yPercent: 130, rotation: 9, autoAlpha: 0 }"), "incoming shoe enters from below")

// #region logic — run the real helpers
const start = src.indexOf("// #region logic")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "logic region markers missing")
const js = src
  .slice(start, end)
  .replace("f: number, z: number", "f, z")
  .replace(/size: \{[^}]*\} \| undefined,/, "size,")
  .replace(/base: \{[^}]*\},/, "base,")
  .replace(/size: \{ label: string[^}]*\} \| undefined,/, "size,")
  .replace(/variant: \{ soldOut[^}]*\} \| undefined,/, "variant,")
const { focusPosition, sizeStats, availability } = await import("data:text/javascript," + encodeURIComponent(js))

// Zoom 1 shows the whole photo; a zoomed focus lands mid-frame and never
// pushes the photo past its own edge.
assert.equal(focusPosition(0.9, 1), 50)
assert.equal(focusPosition(0.5, 2), 50)
assert.equal(focusPosition(0.75, 2), 100)
assert.equal(focusPosition(0.99, 3), 100)
assert.equal(focusPosition(0.01, 3), 0)

// A size carries its own price, rating and review count; gaps fall back.
const base = { price: 250, rating: 4.5, reviews: 120 }
assert.deepEqual(sizeStats({ price: 265, rating: 4.8, reviews: 59 }, base), { price: 265, rating: 4.8, reviews: 59 })
assert.deepEqual(sizeStats({ price: 240 }, base), { price: 240, rating: 4.5, reviews: 120 })
assert.deepEqual(sizeStats(undefined, base), base)
assert.equal(sizeStats({ rating: 9 }, base).rating, 5, "rating is clamped to 5")

// Stock is per size and per colour: a colour can sell out of one size, and
// its own count beats the size's.
const s39 = { label: "39", stock: 8 }
assert.deepEqual(availability(s39, undefined), { soldOut: false, stock: 8 })
assert.deepEqual(availability(s39, { stock: { "39": 2 } }), { soldOut: false, stock: 2 })
assert.deepEqual(availability(s39, { soldOut: ["39"] }), { soldOut: true, stock: 0 })
assert.deepEqual(availability(s39, { stock: { "39": 0 } }), { soldOut: true, stock: 0 })
assert.equal(availability({ label: "38", soldOut: true }, {}).soldOut, true)
assert.equal(availability(undefined, {}).soldOut, true)
// #endregion

// Every photo is reachable: thumbnails and the +N chip open the gallery,
// which steps with the arrow keys and closes on Escape.
assert.ok(src.includes('aria-label={`View all ${views.length} photos`}'), "+N opens the gallery")
for (const k of ['"Escape"', '"ArrowRight"', '"ArrowLeft"']) assert.ok(src.includes(k), `gallery key ${k}`)
assert.ok(src.includes('role="dialog"') && src.includes('aria-modal="true"'), "gallery is a modal dialog")

// Add to cart answers in the button itself: spinner, then a ticked "ADDED".
for (const st of ['"busy"', '"done"']) assert.ok(src.includes(`data-state="${st.slice(1, -1)}"`) || src.includes(st), `cart state ${st}`)
assert.ok(src.includes("ADDED"), "cart button confirms")
assert.ok(src.includes("cartTimers.current.forEach(clearTimeout)"), "cart timers are cleared on unmount")

// Depth and the loupe stay off for touch and reduced motion.
assert.ok(src.includes('window.matchMedia("(pointer: fine)")'), "tilt only follows a fine pointer")
assert.ok(src.includes('e.pointerType === "touch"'), "the loupe is mouse/pen only; touch opens the photos")

// Liking says so out loud.
assert.ok(src.includes('"Saved to favourites"'), "like confirms with a message")

// The section brings no site header: the host page owns navigation.
assert.doesNotMatch(src, /<header|<nav|navLinks/, "no nav bar inside the component")

// It is a product section, not a show reel: nothing changes on a timer except
// the toast hiding itself.
assert.doesNotMatch(src, /setInterval|autoplay/, "no autoplay")
assert.equal(src.match(/delayedCall/g)?.length, 2, "only the toast's own hide timer")

// 21st ships this file alone.
assert.doesNotMatch(src, /@import/, "no @import")
assert.doesNotMatch(src, /^\s*(\*|body|:root)\s*{/m, "no bare global resets")
const css = src.slice(src.indexOf("<style>{`") + 9, src.indexOf("`}</style>"))
assert.ok(css.length > 1000, "style block found")
assert.ok(!css.includes("${"), "no interpolation inside the CSS string")
for (const v of css.match(/var\(--color-[a-z-]+/g) ?? []) {
  assert.ok(
    ["background", "foreground", "muted-foreground", "border", "primary"].includes(v.slice(12)),
    `only the semantic tokens: ${v}`,
  )
}

// Motion is not optional.
assert.ok(src.includes("prefers-reduced-motion: reduce"), "must honour prefers-reduced-motion")
assert.ok(src.includes("const prefersReduced"), "GSAP paths check reduced motion too")

// The demo must travel: no off-origin images, and under 21st's 200 KB cap.
const demo = readFileSync(new URL("../components/sneaker-product-hero/demo.tsx", import.meta.url), "utf8")
assert.doesNotMatch(demo, /https?:\/\//, "demo must not load off-origin media")
assert.ok(demo.length < 200_000, `demo is ${demo.length} bytes`)

console.log("sneaker-product-hero: ok")
