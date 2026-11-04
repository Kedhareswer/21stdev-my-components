// Install-safety checks for components/aura-team-cards.
// Run: node tests/aura-team-cards.test.mjs
import assert from "node:assert/strict"
import { checkComponent } from "./_component-safety.mjs"

const { src, css } = checkComponent("aura-team-cards", {
  prefix: "atc-",
  imports: ["react"],
  vars: ["--a1", "--a2", "--i", "--s"],
  minRules: 40,
  runtimeMotion: false, // CSS-only motion
})

assert.match(css, /\.atc-photo img\{[^}]*max-width:none/, "portraits override Preflight")
assert.match(css, /\.atc-card\[data-active=true\]\{flex-grow:/, "the open card widens through flex, not measured widths")
assert.match(css, /@media \(prefers-reduced-motion:reduce\)\{[^}]*\.atc-card[^{]*\{transition:none;animation:none\}/, "reduced motion stops transitions and entrance")
assert.match(css, /@media \(max-width:760px\)\{[^@]*scroll-snap-type:x mandatory/, "small screens get a snap carousel")
assert.ok(src.includes('window.matchMedia("(hover: none)")'), "touch screens open a card by default")
assert.ok(src.includes("onFocus={() => setActive(i)}") && src.includes("tabIndex={0}"), "keyboard focus opens a card")
assert.ok(src.includes("tabIndex={on ? 0 : -1}"), "links on closed cards are out of the tab order")
assert.doesNotMatch(src, /requestAnimationFrame|addEventListener\("(scroll|pointermove|mousemove)"/, "no per-frame JavaScript")

console.log("aura-team-cards: ok")
