// Install-safety and data-logic checks for components/focus-usage-card.
// Run: node tests/focus-usage-card.test.mjs
import assert from "node:assert/strict"
import { checkComponent, liftRegion } from "./_component-safety.mjs"

const { src, css } = checkComponent("focus-usage-card", {
  prefix: "fuc-",
  imports: ["react"],
  vars: ["--i", "--fuc-gap", "--fuc-n"],
  minRules: 40,
  runtimeMotion: false, // CSS-only motion
})

assert.match(css, /\.fuc-stack\{[^}]*transform-origin:50% 100%;animation:fuc-grow/, "bars grow from the baseline with a transform")
assert.match(css, /@media \(prefers-reduced-motion:reduce\)\{[^@]*\.fuc-stack[^{]*\{animation:none\}/, "reduced motion stops the growth")
assert.ok(src.includes("onFocus={() => setHover(i)}") && src.includes('aria-label={b.label + ": " + fmtMinutes(sum)}'), "bars are labelled buttons and focus shows the tooltip")
assert.ok(src.includes("aria-pressed={i === vi}"), "the period switch exposes its state")
assert.ok(src.includes('"translateX(" + vi * 100 + "%)"'), "the pill slides by its own width, no measuring")
assert.doesNotMatch(src, /requestAnimationFrame|addEventListener\(/, "no per-frame JavaScript")

const L = await liftRegion(src, "usage")
assert.equal(L.fmtMinutes(402), "6h 42m")
assert.equal(L.fmtMinutes(65), "1h 05m")
assert.equal(L.fmtMinutes(42), "42m")
assert.equal(L.fmtMinutes(-5), "0m")
const s = L.summarise([{ label: "a", values: [10, 20, 5] }, { label: "b", values: [30] }], 3)
assert.deepEqual(s.perCat, [40, 20, 5], "missing values count as zero")
assert.equal(s.total, 65)
assert.equal(s.max, 35)
assert.equal(L.niceMax(56), 60)
assert.equal(L.niceMax(60), 60)
assert.equal(L.niceMax(548), 600)
assert.equal(L.niceMax(1500), 1500)
assert.equal(L.tipLeft(0, 18), 16, "kept off the left edge")
assert.equal(L.tipLeft(17, 18), 84, "kept off the right edge")
assert.equal(L.tipLeft(3, 7), 50)

console.log("focus-usage-card: ok")
