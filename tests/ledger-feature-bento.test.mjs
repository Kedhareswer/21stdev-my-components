// Install-safety and data-logic checks for components/ledger-feature-bento.
// Run: node tests/ledger-feature-bento.test.mjs
import assert from "node:assert/strict"
import { checkComponent, liftRegion } from "./_component-safety.mjs"

const { src, css } = checkComponent("ledger-feature-bento", {
  prefix: "lfb-",
  imports: ["react"],
  vars: ["--i", "--k", "--lfb-c", "--lfb-off"],
  minRules: 50,
})

assert.ok(src.includes("new IntersectionObserver("), "loops start when the bento is on screen")
assert.ok(src.includes("io.disconnect()") && src.includes("window.clearInterval(t)"), "observer and interval are cleaned up")
assert.ok(src.includes("if (!inView || receipts.length < 2) return"), "the inbox interval only runs in view")
assert.match(src, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)\.matches\) return/, "reduced motion stops new receipts")
assert.match(css, /@media \(prefers-reduced-motion:reduce\)\{[^@]*\.lfb-fill\{stroke-dashoffset:var\(--lfb-off\)\}/, "reduced motion shows the finished ring")
// Keyframes that end faded must hold full opacity earlier, or the fade spans the whole loop.
for (const k of ["lfb-fill", "lfb-type", "lfb-draw"]) {
  const body = css.match(new RegExp("@keyframes " + k + "\{(.*?)\}\}"))?.[1] ?? ""
  assert.ok(body.includes("opacity:1"), k + " holds full opacity before it fades")
}
assert.doesNotMatch(src, /requestAnimationFrame/, "no per-frame JavaScript")

const L = await liftRegion(src, "data")
assert.deepEqual(L.inboxWindow(5, 0, 3), [0, 4, 3], "newest first, wrapping round")
assert.deepEqual(L.inboxWindow(5, 7, 3), [2, 1, 0])
assert.deepEqual(L.inboxWindow(2, 3, 3), [1, 0], "never more rows than receipts")
assert.deepEqual(L.inboxWindow(0, 3, 3), [], "empty")
assert.equal(L.percent(1284, 1290), 99.5)
assert.equal(L.percent(5, 0), 0, "no total")
assert.equal(L.percent(12, 10), 100, "clamped")
assert.equal(L.fmt(1284), "1,284")

console.log("ledger-feature-bento: ok")
