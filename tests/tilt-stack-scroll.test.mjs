// Install-safety and pose-logic checks for components/tilt-stack-scroll.
// Run: node tests/tilt-stack-scroll.test.mjs
import assert from "node:assert/strict"
import { checkComponent, liftRegion } from "./_component-safety.mjs"

const { src, css } = checkComponent("tilt-stack-scroll", {
  prefix: "tss-",
  imports: ["react", "gsap", "gsap/ScrollTrigger"],
  vars: ["--tss-accent"],
  minRules: 30,
})

assert.match(css, /\.tss-stage\{position:sticky;top:0/, "the stage pins with sticky, no pin-spacer")
assert.match(src, /"calc\(" \+ height \+ " \* "/, "the track is a definite multiple of the stage height")
assert.match(css, /\.tss-card>img\{[^}]*max-width:none/, "photos override Preflight")
assert.ok(src.includes('start: "top top"') && src.includes('end: "bottom bottom"'), "progress spans the whole track")
assert.ok(src.includes("snap: snap && !reduced"), "reduced motion drops the eased snap")
assert.ok(src.includes("gsap.context("), "the intro lives in a context so a remount reverts it")
for (const c of ['mq.removeEventListener("change", on)', "trigger.kill()", "ctx.revert()"]) assert.ok(src.includes(c), "cleanup is missing " + c)
assert.doesNotMatch(src, /touch-action:none|passive: false/, "the page scroll is never hijacked")
assert.ok(src.includes('aria-roledescription="carousel"') && src.includes('aria-roledescription="slide"'), "carousel semantics")
// onUpdate writes transform and opacity only
const upd = src.slice(src.indexOf("const paint = () => {"), src.indexOf("const trigger ="))
assert.doesNotMatch(upd, /style\.(width|height|top|left)\b/, "per-frame paint writes transforms and opacity only")

const L = await liftRegion(src, "pose")
const front = L.pose(2, 2, false)
assert.deepEqual([front.y, front.scale, front.rx, front.rz, front.shade, front.opacity], [0, 1, 0, 0, 0, 1], "the current card sits flat")
const coming = L.pose(1, 3, false)
assert.ok(coming.y >= 100, "cards two ahead wait below the stage")
const landing = L.pose(1.5, 2, false)
assert.ok(landing.y > 0 && landing.rx > 0 && landing.rz !== 0 && landing.scale < 1, "a landing card is tilted, turned and small")
const under = L.pose(3, 1, false)
assert.ok(under.y < 0 && under.scale < 1 && under.rx < 0 && under.shade > 0, "cards underneath tip back, shrink and darken")
assert.equal(L.pose(5, 0, false).opacity, 0, "cards buried deep fade out")
assert.equal(L.pose(0, 0, false).y, 0, "the first card starts in place")
const r = L.pose(1.5, 2, true)
assert.deepEqual([r.y, r.scale, r.rx, r.rz], [0, 1, 0, 0], "reduced motion: no slide, tilt or scale")
assert.equal(r.opacity, 0.5, "reduced motion crossfades")
assert.match(L.toTransform(front), /^translate3d\(0,0\.000%,0\) perspective\(1400px\) rotateX\(0\.000deg\)/)
assert.equal(L.clamp(5, 0, 3), 3)
assert.equal(L.pad2(3), "03")

console.log("tilt-stack-scroll: ok")
