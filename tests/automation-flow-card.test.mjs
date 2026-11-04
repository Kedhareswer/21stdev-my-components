// Install-safety checks for components/automation-flow-card.
// Run: node tests/automation-flow-card.test.mjs
import assert from "node:assert/strict"
import { checkComponent } from "./_component-safety.mjs"

const { src, css } = checkComponent("automation-flow-card", {
  prefix: "afc-",
  imports: ["react"],
  vars: ["--dl", "--k", "--t"],
  minRules: 50,
  runtimeMotion: false, // CSS-only motion
})

assert.match(css, /\.afc-people img\{[^}]*max-width:none/, "faces override Preflight")
assert.match(css, /\.afc-card\[data-active=false\] \.afc-blob[^{]*\{animation-play-state:paused\}/, "pausing freezes the cover")
assert.match(css, /@media \(prefers-reduced-motion:reduce\)\{[^@]*\.afc-blob[^{]*\{animation:none\}/, "reduced motion stops the cover")
assert.ok(src.includes('role="switch"') && src.includes("aria-checked={active}"), "the switch is a real switch")
assert.ok(src.includes('aria-haspopup="menu"') && src.includes('role="menuitem"'), "menu semantics")
assert.ok(src.includes('e.key === "Escape"') && src.includes('document.removeEventListener("pointerdown", onDown)'), "the menu closes and cleans up")
// node chips and wires share one percentage space so the cover never measures
assert.ok(src.includes('viewBox="0 0 400 210" preserveAspectRatio="none"'), "wires stretch with the cover")
assert.match(src, /left: POS\[k\]\[0\] \+ "%"/, "nodes sit at percentages")
assert.doesNotMatch(src, /requestAnimationFrame|addEventListener\("(scroll|pointermove|mousemove)"/, "no per-frame JavaScript")

console.log("automation-flow-card: ok")
