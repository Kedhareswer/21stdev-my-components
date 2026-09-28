// Install-safety and deck-logic checks for lens-projector-carousel.
// Run: node tests/lens-projector-carousel.test.mjs

import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const dir = new URL("../components/lens-projector-carousel/", import.meta.url)
const src = readFileSync(new URL("lens-projector-carousel.tsx", dir), "utf8")
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")
const drawn = readFileSync(new URL("demo-drawn.tsx", dir), "utf8")

// ---- install safety --------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import the component may have")
assert.doesNotMatch(src, /@import/, "no @import")
assert.ok(src.includes('height = "100svh"'), "height prop defaults to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")

const block = src.match(/const CSS = \[\n([\s\S]*?)\n\]\.join\(""\)/)
assert.ok(block, "CSS block is present")
assert.doesNotMatch(block[1], /\$\{|`/, "no backticks or interpolation inside the CSS")
// Strip string quoting and the NOISE/GRAIN concatenations, keep the rules.
const flat = [...block[1].replace(/"\s*\+\s*[A-Z]+\s*\+\s*"/g, "url(x)").matchAll(/^\s*"((?:[^"\\]|\\.)*)"/gm)].map((m) => m[1]).join("")
let rules = 0
for (const m of flat.matchAll(/(?<=^|[{}])\s*([^{}@]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (/^(from|to|\d+%(,\d+%)*)$/.test(sel)) continue
  rules++
  assert.ok(sel.split(",").every((s) => /^\.lp-|^(?:\.lp-[\w-]+\s+)/.test(s.trim())), `unscoped CSS selector would leak into the host app: ${sel}`)
}
assert.ok(rules > 40, `expected the scope check to see real rules, saw ${rules}`)
assert.doesNotMatch(flat.match(/\.lp-root\{[^}]*\}/)[0], /height:/, "the root's height comes only from the prop")
assert.match(flat, /\.lp-card img\{[^}]*max-width:none/, "images override Preflight's max-width")
assert.match(flat, /prefers-reduced-motion:reduce/, "motion honours reduced motion")
assert.match(flat, /:focus-visible/, "keyboard focus is visible")
assert.doesNotMatch(flat, /[^.\w-](body|html|:root|\*)\s*\{/, "no global resets")

// only the tokens dev/styles.css guarantees; this component uses none of its own
for (const [, v] of src.matchAll(/var\((--[a-z-]+)/g)) assert.match(v, /^--lp-/, `unexpected token: ${v}`)

// ---- nothing fetched --------------------------------------------------------
// The photo demo may reach Unsplash and nothing else; the drawn one, nothing.
const hosts = [...demo.matchAll(/https?:\/\/[^/"'`\s)]+/g)].map((m) => m[0])
assert.ok(hosts.length > 0 && hosts.every((h) => h === "https://images.unsplash.com"), `photo demo hosts: ${hosts.join(", ")}`)
for (const [name, text] of [["component", src], ["drawn demo", drawn]]) {
  const urls = [...text.matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0]).filter((u) => u !== "http://www.w3.org/2000/svg")
  assert.deepEqual(urls, [], `${name} must make no network requests: ${urls.join(", ")}`)
}

// ---- interaction contract ---------------------------------------------------
assert.match(src, /aria-current/, "the active number is exposed")
assert.match(src, /ArrowRight/, "arrow keys work")
assert.match(src, /setStopped\(true\)/, "taking over stops autoplay")
assert.match(src, /const paused = focused \|\| hidden \|\| !inView \|\| !on/, "autoplay pauses off-screen, hidden, on focus and when the camera is off")
assert.match(src, /prefers-reduced-motion: reduce/, "autoplay is off under reduced motion")

// ---- the camera is interactive ------------------------------------------------
assert.match(src, /const togglePower/, "the red button switches the camera")
assert.match(src, /aria-pressed=\{h\.pressed\}/, "the power button exposes its state")
assert.match(flat, /\.lp-off \.lp-beam\{opacity:0/, "an off camera projects nothing")
assert.match(src, /reelRef\.current\?\.animate/, "focus pull uses the Web Animations API, not a remount")

// ---- deck logic (lifted from the #region block) -----------------------------
const region = src.match(/\/\/ #region deck([\s\S]*?)\/\/ #endregion/)
assert.ok(region, "deck region is present")
const js = region[1].replace(/\): (number|boolean) \{/g, ") {").replace(/(\w+): (number|boolean)/g, "$1")
const { SWIPE_PX, wrapIndex, stepDirection, swipeStep } = await import("data:text/javascript," + encodeURIComponent(js))

assert.equal(wrapIndex(5, 5, true), 0, "wraps forward")
assert.equal(wrapIndex(-1, 5, true), 4, "wraps back")
assert.equal(wrapIndex(9, 5, false), 4, "clamps at the end")
assert.equal(wrapIndex(-3, 5, false), 0, "clamps at the start")
assert.equal(wrapIndex(3, 0, true), 0, "an empty deck is safe")

assert.equal(stepDirection(0, 1, 5), 1)
assert.equal(stepDirection(1, 0, 5), -1)
assert.equal(stepDirection(4, 0, 5), 1, "wrapping past the end still reads as forward")
assert.equal(stepDirection(0, 4, 5), -1, "wrapping past the start still reads as back")
assert.equal(stepDirection(0, 0, 1), 1)

assert.equal(swipeStep(-SWIPE_PX), 1, "drag left is next")
assert.equal(swipeStep(SWIPE_PX), -1, "drag right is previous")
assert.equal(swipeStep(SWIPE_PX - 1), 0, "a short drag is a click, not a swipe")

console.log("lens-projector-carousel: ok")
