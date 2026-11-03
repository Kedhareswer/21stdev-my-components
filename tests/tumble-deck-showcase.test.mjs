// Install-safety and pose checks for components/tumble-deck-showcase.
// Run: node tests/tumble-deck-showcase.test.mjs
//
// Every card's transform is a function of one deck position, so the pose math
// is lifted out of the .tsx and run here; the rest are source assertions for
// the rules that break silently once the file is installed elsewhere.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const src = readFileSync(
  new URL("../components/tumble-deck-showcase/tumble-deck-showcase.tsx", import.meta.url),
  "utf8",
)

// #region pose — run the real math
const start = src.indexOf("// #region pose")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "pose region markers missing")
const js = src
  .slice(start, end)
  .replace(/^export type Pose = .*$/m, "")
  .replace(/:\s*(number|Pose)(?=[,)=\s{])/g, "")
const { fallAngle, deckAdvance, cardPose, wrap } = await import(
  "data:text/javascript," + encodeURIComponent(js)
)

// Upright before the fall, flat (towards the viewer) after it, and the drop
// accelerates: the first half of the time covers well under half the angle.
assert.equal(fallAngle(0), -0)
assert.equal(fallAngle(1), -90)
assert.ok(fallAngle(0.39) > -45, "fall should ease in like gravity")
for (let t = 0; t <= 1; t += 0.01) {
  const a = fallAngle(t)
  assert.ok(a <= 0 && a >= -90, `angle out of range at ${t}: ${a}`)
}

// The deck only slides once the card is well on its way, and lands on whole gaps.
assert.equal(deckAdvance(2), 2)
assert.equal(deckAdvance(2.2), 2)
assert.equal(deckAdvance(2.95), 3)

// At rest the front card stands at the hinge line, the ones behind step back,
// fallen cards lie flat and only the two latest stay visible.
const front = cardPose(3, 3, 5)
assert.deepEqual([front.angle, front.z, front.opacity], [0, -0, 1])
assert.equal(cardPose(5, 3, 5).z, -2)
assert.equal(cardPose(2, 3, 5).angle, -90)
assert.equal(cardPose(2, 3, 5).opacity, 1)
assert.equal(cardPose(0, 3, 5).opacity, 0)
assert.equal(cardPose(9, 3, 5).opacity, 0, "cards past `depth` are hidden")
// Newer floor cards lie higher, so the 3D sort keeps the latest on top...
assert.ok(cardPose(2, 3, 5).lift > cardPose(1, 3, 5).lift)
// ...and the pile doesn't creep up as the endless loop runs on.
assert.equal(cardPose(1002, 1003, 5).lift, cardPose(2, 3, 5).lift)

// Endless deck: virtual card k shows image wrap(k, n), negatives included, so
// the first image stands right behind the last one.
assert.equal(wrap(9, 9), 0)
assert.equal(wrap(-1, 9), 8)
assert.equal(wrap(20, 9), 2)
// Past the last image the deck keeps going forward; nothing rewinds.
assert.doesNotMatch(src, /rewind/, "the loop runs forward, no rewind")
// #endregion

// A root that inherits its height renders here and collapses to 0px installed.
assert.ok(/height = "100svh"/.test(src), "root height must default to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")

// Tailwind Preflight's img { max-width: 100% } must not reach the card images.
assert.ok(src.includes("max-width: none"), "card images need a max-width escape")

// 21st ships this file alone.
assert.doesNotMatch(src, /@import/, "no @import")
assert.doesNotMatch(src, /^\s*(\*|body|:root)\s*{/m, "no bare global resets")
const css = src.slice(src.indexOf("<style>{`") + 9, src.indexOf("`}</style>"))
assert.ok(!css.includes("${"), "no interpolation inside the CSS string")
for (const v of css.match(/var\(--color-[a-z-]+/g) ?? []) {
  assert.ok(
    ["background", "foreground", "muted-foreground", "border", "primary"].includes(
      v.slice(12),
    ),
    `only the semantic tokens: ${v}`,
  )
}

// Motion is not optional.
assert.ok(src.includes("prefers-reduced-motion: reduce"), "must honour prefers-reduced-motion")

// The demo must travel: no off-origin images, and under 21st's 200 KB cap.
const demo = readFileSync(
  new URL("../components/tumble-deck-showcase/demo.tsx", import.meta.url),
  "utf8",
)
assert.doesNotMatch(demo, /https?:\/\//, "demo must not load off-origin media")
assert.ok(demo.length < 200_000, `demo is ${demo.length} bytes`)

console.log("tumble-deck-showcase: ok")
