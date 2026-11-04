// Install-safety checks for components/postcard-flip-cards.
// Run: node tests/postcard-flip-cards.test.mjs
import assert from "node:assert/strict"
import { checkComponent } from "./_component-safety.mjs"

const { src, css } = checkComponent("postcard-flip-cards", {
  prefix: "pfc-",
  imports: ["react"],
  vars: ["--i", "--s"],
  minRules: 40,
  runtimeMotion: false, // CSS-only motion
})

assert.match(css, /\.pfc-front img\{[^}]*max-width:none/, "front photos override Preflight")
assert.match(css, /\.pfc-stamp img\{[^}]*max-width:none/, "stamp photos override Preflight")
assert.match(css, /\.pfc-face\{[^}]*backface-visibility:hidden/, "faces hide their backs")
assert.match(css, /\.pfc-card\{[^}]*transform-style:preserve-3d/, "the flip is real 3D")
assert.match(css, /\.pfc-item\[data-flipped=true\] \.pfc-card\{transform:rotateY\(180deg\)\}/, "one attribute drives the flip")
assert.match(css, /\.pfc-row\{width:100%/, "the row has a definite width, or the cards collapse on phones")
assert.match(css, /@media \(prefers-reduced-motion:reduce\)\{[^@]*\.pfc-card\{transition:none\}/, "reduced motion flips instantly")
assert.ok(src.includes('window.matchMedia("(hover: hover)")'), "hover flips only where hover exists")
assert.ok(src.includes("pinned.includes(i) || (canHover && hovered === i)"), "a pinned card stays turned while hovered")
assert.ok(src.includes("tabIndex={flipped ? 0 : -1}") && src.includes("tabIndex={flipped ? -1 : 0}"), "the hidden face leaves the tab order")
assert.doesNotMatch(src, /requestAnimationFrame|addEventListener\("(scroll|pointermove|mousemove)"/, "no per-frame JavaScript")

console.log("postcard-flip-cards: ok")
