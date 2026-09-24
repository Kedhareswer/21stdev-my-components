// Install-safety check for components/mascot-portfolio-hero.
// Run: node tests/mascot-portfolio-hero.test.mjs
//
// Two things can break here. The install surface — a style block that escapes
// the root, a height that collapses to 0px on an installed page, gradient ids
// two heroes would fight over. And the gaze: the character's head turn is a
// stack of parallax layers driven by a few pure functions, so those are lifted
// out of the .tsx and run for real.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const src = readFileSync(
  new URL("../components/mascot-portfolio-hero/mascot-portfolio-hero.tsx", import.meta.url),
  "utf8",
).replace(/\r\n/g, "\n") // a Windows checkout is CRLF; the slices below look for "\n"

const css = src.slice(src.indexOf("const CSS = `") + 13, src.indexOf("\n`\n"))
assert.ok(css.length > 500, "could not extract the style block")

/* ---------- install safety ---------- */

assert.doesNotMatch(css, /@import/, "no @import in the inline style block")
assert.doesNotMatch(css, /[`]|\$\{/, "no backticks or template holes inside the CSS")
assert.doesNotMatch(src, /https?:\/\//, "no external origins — the capture sandbox blocks them")
for (const bad of [/<img/, /@font-face/, /\.png/, /\.jpe?g/, /\.webp/]) {
  assert.doesNotMatch(src, bad, `the character is drawn, no asset may travel with it (${bad})`)
}

for (const line of css.split("\n")) {
  const m = line.match(/^\s*([^@{}/*][^{]*)\{/)
  if (!m || /^\s*(from|to|\d+%)/.test(m[1])) continue
  for (const sel of m[1].split(",")) {
    const s = sel.trim()
    if (!s) continue
    assert.ok(s.startsWith(".mph"), `selector escapes the component root: ${s}`)
  }
}

assert.match(src, /height = "100svh"/, "height must default to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full on the component root")
const rootRule = css.match(/\.mph-root\{([^}]*)\}/)
assert.ok(rootRule, "missing the .mph-root rule")
assert.doesNotMatch(rootRule[1], /(^|;)\s*height/, "the root must take its height from the prop")
assert.match(rootRule[1], /container:mph \/ size/, "the root is the size container the layout queries")

assert.match(src, /React\.useId\(\)/, "ids must be namespaced per instance")
assert.equal(src.match(/url\(#(?!")/g), null, "every url(#...) must be built by u(), not hard-coded")

assert.match(css, /prefers-reduced-motion: reduce/, "reduced motion must switch the CSS motion off")
assert.match(src, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/, "and the JS loop must honour it too")

// The layer loop writes to the DOM directly. It must be torn down.
for (const ev of ["pointermove", "pointerdown", "blur"]) {
  assert.match(src, new RegExp('removeEventListener\\("' + ev + '"'), `${ev} listener must be removed`)
}
assert.match(src, /cancelAnimationFrame\(raf\)/, "the frame loop must be cancelled on unmount")

const ts = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")
assert.match(ts, /"@\/components\/ui\/mascot-portfolio-hero"/, "tsconfig paths needs the alias line")

/* ---------- the gaze, run for real ---------- */

const start = src.indexOf("// #region gaze")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "gaze region markers missing")
const js = src.slice(start, end).replace(/:\s*number/g, "")
const { aim, approach, pose, blink } = await import("data:text/javascript," + encodeURIComponent(js))

const close = (a, b, eps = 1e-9) => Math.abs(a - b) < eps

// Straight at the face is dead centre; far away saturates but never hits 1.
assert.deepEqual(aim(500, 300, 500, 300, 400, 300), [0, 0])
const [fx, fy] = aim(1e6, -1e6, 0, 0, 400, 300)
assert.ok(fx < 1 && fx > 0.999 && fy > -1 && fy < -0.999, "aim must saturate softly")
// Right of the head looks right, above looks up, and further is further.
const a1 = aim(600, 300, 500, 300, 400, 300)[0]
const a2 = aim(900, 300, 500, 300, 400, 300)[0]
assert.ok(a1 > 0 && a2 > a1, "aim must be monotonic")
assert.ok(aim(500, 0, 500, 300, 400, 300)[1] < 0, "pointer above must look up")

// Easing converges and does not depend on the frame rate.
assert.ok(close(approach(0, 1, 1e3, 7), 1, 1e-6), "approach must converge")
const one = approach(0, 1, 1 / 30, 7)
const two = approach(approach(0, 1, 1 / 60, 7), 1, 1 / 60, 7)
assert.ok(close(one, two, 1e-12), "two half-frames must equal one full frame")

// At rest nothing moves — the drawing is exactly as drawn.
const rest = pose(0, 0, 0)
for (const [k, v] of Object.entries(rest)) {
  for (const [f, n] of Object.entries(v)) {
    const want = f === "scale" || f === "lead" || f === "trail" ? 1 : 0
    assert.ok(close(n, want), `${k}.${f} must rest at ${want}, got ${n}`)
  }
}

// A turn is mirror-symmetric left to right.
const r = pose(0.7, 0.3, 0)
const l = pose(-0.7, 0.3, 0)
assert.ok(close(r.face.dx, -l.face.dx) && close(r.head.rot, -l.head.rot), "turn must mirror")
assert.ok(close(r.ears.lead, l.ears.trail), "ear foreshortening must mirror")

// Parallax is the whole illusion: the further a layer sits from the neck, the
// further it moves. Features ride over the skull, the nose over the features,
// and the ears go the other way.
const x = pose(1, 0, 0)
assert.ok(x.face.dx + x.nose.dx > x.face.dx, "nose must lead the face")
assert.ok(x.face.dx > x.beanie.dx && x.beanie.dx > x.head.dx && x.head.dx > x.body.dx, "parallax order broken")
assert.ok(x.ears.dx < 0, "ears must counter-move")
assert.ok(x.ears.lead > 1 && x.ears.trail < 1, "turning right shows more of the left ear")

// Getting close widens the eyes and lifts the brows.
const n = pose(0, 0, 1)
assert.ok(n.eyes.scale > 1 && n.brows.dy < 0, "near must read as surprise")

// Blink: open outside the window, nearly shut in the middle, never inverted.
assert.equal(blink(-1), 1)
assert.equal(blink(1), 1)
assert.ok(blink(0.075) < 0.1 && blink(0.075) > 0, "blink must nearly close the eye")

console.log("ok - mascot-portfolio-hero")
