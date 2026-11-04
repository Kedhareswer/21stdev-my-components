// Install-safety and split-logic checks for components/presence-avatar-stack.
// Run: node tests/presence-avatar-stack.test.mjs
import assert from "node:assert/strict"
import { checkComponent, liftRegion } from "./_component-safety.mjs"

const { src, css } = checkComponent("presence-avatar-stack", {
  prefix: "pas2-",
  imports: ["react"],
  vars: ["--sz", "--i", "--k", "--st", "--a", "--pas2-ring"],
  minRules: 30,
  runtimeMotion: false, // CSS-only motion
  inline: true, // sizes to its content
})

assert.match(css, /\.pas2-face img\{[^}]*max-width:none/, "faces override Preflight")
assert.match(css, /\.pas2-mini img\{[^}]*max-width:none/, "list faces override Preflight")
assert.match(css, /@media \(hover:hover\)\{\.pas2-root:hover \.pas2-item/, "the fan-out only happens where hover exists")
assert.match(css, /translateX\(calc\(var\(--i\) \* var\(--sz\) \* \.26\)\)/, "the fan-out is a transform from a CSS index")
assert.match(css, /@media \(prefers-reduced-motion:reduce\)\{[^@]*\.pas2-talk[^{]*\{animation:none\}/, "reduced motion stops the speaking ring")
assert.ok(src.includes('role="group"') && src.includes("aria-expanded={open}"), "group and disclosure semantics")
assert.ok(src.includes('e.key === "Escape"') && src.includes('document.removeEventListener("pointerdown", onDown)'), "the list closes and cleans up")
assert.doesNotMatch(src, /requestAnimationFrame|addEventListener\("(scroll|pointermove|mousemove)"/, "no per-frame JavaScript")

const L = await liftRegion(src, "split")
assert.deepEqual(L.splitPeople(8, 4), { shown: 4, hidden: 4 })
assert.deepEqual(L.splitPeople(3, 4), { shown: 3, hidden: 0 }, "no chip when everyone fits")
assert.deepEqual(L.splitPeople(5, 0), { shown: 1, hidden: 4 }, "always at least one face")
assert.deepEqual(L.splitPeople(0, 4), { shown: 0, hidden: 0 })
assert.equal(L.initials("Maya  Lindqvist"), "ML")
assert.equal(L.initials("leo"), "L")

console.log("presence-avatar-stack: ok")
