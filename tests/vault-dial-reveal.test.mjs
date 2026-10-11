// Runnable check for the dial math in components/vault-dial-reveal, plus the
// install-safety rules the .tsx has to keep.
// Run: node tests/vault-dial-reveal.test.mjs
//
// The door and the coin are CSS 3D and cannot be asserted here. What can is the
// small chain that turns a dragged pointer into a number under the index,
// because the whole lock reads it: get the sign wrong and the wheel opens on
// the mirror of the code; get the wrap wrong and crossing twelve o'clock spins
// the wheel a full turn backwards.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const read = (f) => readFileSync(new URL("../components/vault-dial-reveal/" + f, import.meta.url), "utf8")
const src = read("vault-dial-reveal.tsx")

const start = src.indexOf("// #region dial")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "dial region markers missing")

const js = src
  .slice(start, end)
  .replace(/:\s*number\[\]/g, "")
  .replace(/:\s*number/g, "")
  .replace(/:\s*boolean/g, "")
const { mod, unwrapDelta, pointerAngle, valueAt, angleFor, normalizeCode, matches, labelEvery } = await import(
  "data:text/javascript," + encodeURIComponent(js)
)

// ---- wrapping -------------------------------------------------------------
{
  assert.equal(mod(-1, 40), 39)
  assert.equal(mod(41, 40), 1)
  // Crossing twelve o'clock: 179 -> -179 is a 2 degree turn, not -358.
  assert.equal(unwrapDelta(-179 - 179), 2)
  assert.equal(unwrapDelta(179 - -179), -2)
  for (let d = -1000; d <= 1000; d += 7) {
    const u = unwrapDelta(d)
    assert.ok(u > -180 && u <= 180, "unwrap left its range at " + d + ": " + u)
    assert.ok(Math.abs(mod(u - d, 360)) < 1e-9 || Math.abs(mod(u - d, 360) - 360) < 1e-9, "unwrap changed the angle at " + d)
  }
  assert.equal(unwrapDelta(NaN), 0, "NaN must not reach the wheel")
}

// ---- pointer angle: 0 at the top, clockwise -------------------------------
{
  const near = (a, b) => Math.abs(a - b) < 1e-9
  assert.ok(near(pointerAngle(0, -10, 0, 0), 0), "straight up is 0")
  assert.ok(near(pointerAngle(10, 0, 0, 0), 90), "right is 90")
  assert.ok(near(pointerAngle(0, 10, 0, 0), 180), "down is 180")
  assert.ok(near(pointerAngle(-10, 0, 0, 0), -90), "left is -90")
}

// ---- the number under the index ------------------------------------------
{
  const ticks = 40
  const step = 360 / ticks
  assert.equal(valueAt(0, ticks), 0)
  // Numbers are printed clockwise, so turning right counts down, as on a real dial.
  assert.equal(valueAt(step, ticks), 39, "a click right reads one less")
  assert.equal(valueAt(-step, ticks), 1, "a click left reads one more")
  assert.equal(valueAt(-12 * step, ticks), 12)
  // Whole turns do not change the reading, and -0 never leaks out.
  for (const v of [0, 7, 12, 30, 39]) {
    for (const turns of [-3, -1, 0, 1, 2]) {
      const r = valueAt(-v * step + turns * 360, ticks)
      assert.equal(r, v)
      assert.ok(!Object.is(r, -0), "negative zero at " + v)
    }
  }
  // Half a click either side still reads the nearest number.
  assert.equal(valueAt(-12 * step + step * 0.49, ticks), 12)
  assert.equal(valueAt(-12 * step - step * 0.49, ticks), 12)
}

// ---- snapping to a number takes the short way round ----------------------
{
  const ticks = 40
  for (const from of [-725, -360, -12.3, 0, 4.4, 181, 999]) {
    for (const v of [0, 1, 12, 20, 39]) {
      const a = angleFor(v, ticks, from)
      assert.equal(valueAt(a, ticks), v, "angleFor(" + v + ") from " + from + " reads " + valueAt(a, ticks))
      assert.ok(Math.abs(a - from) <= 180 + 1e-9, "snapping from " + from + " to " + v + " spun " + (a - from))
    }
  }
}

// ---- the code -------------------------------------------------------------
{
  assert.deepEqual(normalizeCode([12, 30, 7], 40), [12, 30, 7])
  assert.deepEqual(normalizeCode([41, -1, 7.6], 40), [1, 39, 8], "codes wrap onto the dial")
  assert.deepEqual(normalizeCode([1, NaN, 2], 40), [1, 2], "junk is dropped")
  assert.equal(normalizeCode([1, 2, 3, 4, 5, 6, 7, 8], 40).length, 6, "six numbers at most")
  assert.ok(matches([12, 30, 7], [12, 30, 7]))
  assert.ok(!matches([12, 30], [12, 30, 7]), "a short entry is not a match")
  assert.ok(!matches([7, 30, 12], [12, 30, 7]), "order matters")
  assert.ok(!matches([], []), "an empty code never opens")
  assert.equal(labelEvery(40), 5)
  assert.equal(labelEvery(100), 10)
  assert.equal(labelEvery(12), 1)
}

// ---- install safety ------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "the only import may be react")
assert.doesNotMatch(src, /@import/, "no @import — the host owns Tailwind and fonts")
assert.doesNotMatch(src, /^\s*(\*|body|:root|html)\s*{/m, "no bare global resets")
assert.doesNotMatch(src, /https?:\/\/|url\(["']?(?!#)/, "no external assets: the capture sandbox blocks other origins")

// The CSS string must survive being pasted anywhere: no template literal.
const css = src.slice(src.indexOf("const CSS ="), src.indexOf("const abs"))
assert.doesNotMatch(css, /`|\$\{/, "no backticks or ${ in the CSS string")
assert.ok(/@keyframes vdr-/.test(css) && !/@keyframes (?!vdr-)/.test(css), "keyframes are scoped by prefix")

// A definite height, never a percentage that collapses without a height chain.
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.doesNotMatch(src, /\bh-full\b|\bh-screen\b/, "no h-full / h-screen")
assert.doesNotMatch(src, /innerWidth|innerHeight/, "size from the element, not the window")
assert.ok(src.includes("new ResizeObserver") && src.includes("observer.disconnect()"), "the stage refits and cleans up")

// Preflight would collapse the absolutely-placed SVGs.
const svgs = (src.match(/<svg\b/g) ?? []).length
const guarded = (src.match(/maxWidth: "none"/g) ?? []).length
assert.ok(guarded >= svgs, "every svg needs maxWidth none (" + guarded + "/" + svgs + ")")

// SVG ids must be unique per mount, or two vaults on a page share gradients.
assert.ok(src.includes("React.useId()"), "gradient ids come from useId")
assert.doesNotMatch(src, /id="[a-z]/, "no hard-coded svg ids")

// Chrome's plane sorting can draw what is inside over a shut door.
assert.ok(/visibility: doorOpen \|\| phase === "closing"/.test(src), "the inside is not drawn behind a shut door")
assert.ok((src.match(/backfaceVisibility: "hidden"/g) ?? []).length >= 4, "door faces and edges hide their backs")

// Reduced motion.
assert.ok(src.includes("prefers-reduced-motion"), "must read prefers-reduced-motion")
assert.ok(/motion-reduce:/.test(src), "and use motion-reduce utilities")
assert.ok(/const sway = reduced \? 0/.test(src), "no idle sway when motion is reduced")

// It is a real control.
assert.ok(src.includes('role="slider"') && src.includes("aria-valuenow={dial}"), "the dial is a slider")
assert.ok(src.includes('touchAction: "none"'), "dragging the wheel must not scroll the page")
for (const key of ["ArrowRight", "ArrowLeft", "Enter", "Backspace", "Escape"]) {
  assert.ok(src.includes('"' + key + '"'), "keyboard: " + key)
}
assert.ok(src.includes("aria-live"), "status is announced")
assert.ok(src.includes("d.moved >= step * 0.5"), "a tap is not a turn")

// Timers, frames and audio are all released.
assert.ok(src.includes("clearTimeout") && src.includes("cancelAnimationFrame(raf)"), "timers and frames are released")
assert.ok(src.includes("ctx.close()"), "the audio context is closed")

// Demos: imports by the installer's path, and never a width:auto wrapper.
for (const f of ["demo.tsx", "demo-custom.tsx", "demo-contents.tsx"]) {
  const demo = read(f)
  assert.ok(demo.includes('from "@/components/ui/vault-dial-reveal"'), f + " imports the installed path")
  assert.ok(/export default function/.test(demo), f + " has a default export")
  const first = demo.match(/return \(\s*<div className="([^"]*)"/)
  assert.ok(first && /\bw-full\b/.test(first[1]), f + " outer wrapper needs w-full")
}

console.log("vault-dial-reveal: ok")
