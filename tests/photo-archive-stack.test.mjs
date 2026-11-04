// Install-safety and layout-logic checks for components/photo-archive-stack.
// Run: node tests/photo-archive-stack.test.mjs
import assert from "node:assert/strict"
import { checkComponent, liftRegion } from "./_component-safety.mjs"

const { src, css } = checkComponent("photo-archive-stack", { prefix: "pas-", imports: ["react", "gsap"], minRules: 30 })

assert.match(css, /\.pas-thumb img,\.pas-photo img\{[^}]*max-width:none/, "thumbs and photos override Preflight")
assert.ok(src.includes('e.key === "Escape"'), "Escape collapses")
assert.ok(src.includes("aria-expanded={open && i === active}"), "rows expose their state")
assert.ok(src.includes("const quick = reduced.current"), "reduced motion makes every tween instant")
assert.ok(src.includes("tweens.forEach((tw) => tw.kill())"), "tweens are killed on change and unmount")
assert.doesNotMatch(src, /gsap\.(to|fromTo)\([^)]*\b(height|width|top|left):/, "only transforms, opacity and clip are tweened")

const L = await liftRegion(src, "layout")
const closed = L.layoutStack(7, false, -1, 260, false)
assert.equal(closed.slots[0].y, 0)
assert.equal(closed.slots[0].face, 1, "the top card shows its face")
assert.equal(closed.slots[1].face, 0, "cards under it are blank edges")
assert.ok(closed.slots[1].y > 0 && closed.slots[1].scale < 1, "each card below peeks out smaller")
assert.equal(closed.slots[6].opacity, 0, "cards past the visible depth hide")
assert.deepEqual(closed.slots[4].y, closed.slots[6].y, "hidden cards stay tucked behind")
const fanned = L.layoutStack(7, false, -1, 260, true)
assert.ok(fanned.slots[3].y > closed.slots[3].y, "hover fans the pile")
assert.equal(fanned.total, closed.total, "fanning never changes the reserved height")

const list = L.layoutStack(3, true, -1, 260, false)
assert.deepEqual(list.slots.map((s) => s.y), [0, L.ROW + L.GAP, 2 * (L.ROW + L.GAP)])
assert.equal(list.total, 3 * L.ROW + 2 * L.GAP)
const opened = L.layoutStack(3, true, 0, 260, false)
assert.deepEqual(opened.slots.map((s) => s.y), [0, L.ROW + L.GAP + 260, 2 * (L.ROW + L.GAP) + 260], "rows below the open one make room")
assert.equal(opened.total, list.total + 260)
assert.equal(L.layoutStack(0, true, -1, 260, false).total, 0, "empty list")
assert.equal(L.pad2(7), "07")

console.log("photo-archive-stack: ok")
