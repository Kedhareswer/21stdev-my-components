// Runnable check for the circle-recognition math in components/zero-melt-preloader.
// Run: node tests/score-zero.test.mjs
//
// The scorer lives in the .tsx so the published component stays one file, so we
// lift the marked region out and strip its three type annotations rather than
// keeping a second copy in sync.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const src = readFileSync(
  new URL("../components/zero-melt-preloader/zero-melt-preloader.tsx", import.meta.url),
  "utf8",
)
const start = src.indexOf("// #region scorer")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "scorer region markers missing")

const js = src.slice(start, end).replace(/:\s*(Pt\[\]|ZeroScore|number)(?=[,)\s{])/g, "")
const { scoreZero } = await import("data:text/javascript," + encodeURIComponent(js))

const arc = (deg, r = 100, ry = r, n = 64) =>
  Array.from({ length: n }, (_, i) => {
    const t = ((deg * Math.PI) / 180) * (i / (n - 1))
    return { x: 200 + Math.cos(t) * r, y: 200 + Math.sin(t) * ry }
  })

const T = 0.6

// A clean circle is unambiguous.
const circle = scoreZero(arc(360), T)
assert.ok(circle.ok, "full circle should unlock")
assert.ok(circle.score > 0.95, `full circle score too low: ${circle.score}`)
assert.ok(Math.abs(circle.cx - 200) < 2 && Math.abs(circle.cy - 200) < 2, "centroid off")
assert.ok(Math.abs(circle.r - 100) < 2, `radius off: ${circle.r}`)

// A hand-drawn zero is an oval, not a circle. It must still pass.
assert.ok(scoreZero(arc(360, 120, 60), T).ok, "2:1 ellipse should unlock")

// A jittery circle — what a real pointer produces — must still pass.
let seed = 7
const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648 - 0.5) * 16
const jittery = arc(360).map((p) => ({ x: p.x + rand(), y: p.y + rand() }))
assert.ok(scoreZero(jittery, T).ok, "jittery circle should unlock")

// Everything that is not a loop must be rejected.
const line = Array.from({ length: 64 }, (_, i) => ({ x: 50 + i * 5, y: 200 }))
assert.ok(!scoreZero(line, T).ok, "straight line should not unlock")
assert.ok(!scoreZero(arc(180), T).ok, "half circle should not unlock")
assert.ok(!scoreZero(arc(360, 15), T).ok, "circle under the minimum radius should not unlock")
assert.ok(!scoreZero(arc(360).slice(0, 8), T).ok, "too few points should not unlock")
assert.ok(!scoreZero([], T).ok, "empty stroke should not unlock")

// Tolerance is the knob it claims to be: a 300-degree arc is a forgiving zero
// at the default, and not a zero at all when the gate is strict.
assert.ok(scoreZero(arc(300), 0.6).ok, "300-degree arc should unlock at default tolerance")
assert.ok(!scoreZero(arc(300), 0.9).ok, "300-degree arc should not unlock at 0.9")

console.log("score-zero: all checks passed")
