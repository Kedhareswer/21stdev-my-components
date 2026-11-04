// Install-safety and geometry checks for components/route-branch-connector.
// Run: node tests/route-branch-connector.test.mjs
import assert from "node:assert/strict"
import { checkComponent, liftRegion } from "./_component-safety.mjs"

const { src, css } = checkComponent("route-branch-connector", {
  prefix: "rbc-",
  imports: ["react"],
  vars: ["--rbc-c", "--c", "--k"],
  minRules: 40,
})

assert.ok(src.includes("pathLength={100}"), "draw-in and packet use a normalised length")
assert.doesNotMatch(css, /vector-effect/, "no non-scaling strokes: they break pathLength dashes")
assert.ok(src.includes("new ResizeObserver(") && src.includes("ro.disconnect()"), "width comes from a ResizeObserver, cleaned up")
assert.ok(src.includes("new IntersectionObserver(") && src.includes("io.disconnect()"), "auto-play waits for the card to be on screen")
assert.ok(src.includes("if (!interval || paused || hovering || !inView || n < 2) return"), "auto-play stops when paused, hovered or off screen")
assert.match(src, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)\.matches\) return/, "reduced motion stops auto-play")
assert.ok(src.includes("window.clearTimeout(t)") && src.includes("n, active])"), "every pick restarts the step timer")
assert.ok(src.includes("aria-pressed={i === wrap(active, n)}"), "targets expose which route is active")
assert.doesNotMatch(src, /requestAnimationFrame|addEventListener\("(scroll|pointermove|mousemove)"/, "no per-frame JavaScript")

const L = await liftRegion(src, "geometry")
assert.equal(L.diagramHeight(4), 4 * L.ROW + 2 * L.PAD)
assert.equal(L.diagramHeight(0), L.ROW + 2 * L.PAD, "never zero height")
assert.equal(L.targetY(0), L.PAD + L.ROW / 2)
const h = L.diagramHeight(3)
assert.equal(L.branchPath(1, 3, 600), "M198 " + h / 2 + " H378", "the middle target of an odd set is a straight line")
const up = L.branchPath(0, 4, 600)
assert.match(up, /^M198 \d+(\.\d+)? H/, "starts at the source column")
assert.match(up, / H378$/, "ends at the target column")
assert.match(up, / Q282 /, "bends at the elbow column")
const nums = (d) => d.match(/-?\d+(\.\d+)?/g).map(Number)
assert.ok(nums(L.branchPath(3, 4, 320)).every((v) => v >= 0 && v <= Math.max(320, L.diagramHeight(4))), "stays inside the diagram")
assert.equal(L.wrap(-1, 4), 3)
assert.equal(L.wrap(5, 0), 0, "empty")

console.log("route-branch-connector: ok")
