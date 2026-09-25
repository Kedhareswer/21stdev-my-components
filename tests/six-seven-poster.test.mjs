// Runnable check for the timeline in components/six-seven-poster, plus the
// install-safety rules the .tsx has to keep.
// Run: node tests/six-seven-poster.test.mjs
//
// The canvas cannot be asserted here. What can — and what breaks silently — is
// the timeline: a clock that wraps to the wrong place flashes the finished
// poster before the intro, a beat index that runs past the end blanks the
// chips, and a balance that jumps between beats reads as a glitch rather
// than a gesture.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const src = readFileSync(
  new URL("../components/six-seven-poster/six-seven-poster.tsx", import.meta.url),
  "utf8",
)

const start = src.indexOf("// #region timeline")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "timeline region markers missing")

const js = src.slice(start, end).replace(/:\s*(number|boolean)\b/g, "")
const {
  clamp01,
  smoothstep,
  progressFrom,
  beatIndex,
  autoFrame,
  weigh,
  paintAt,
  flashAt,
  BEATS,
  BEAT_START,
  BEAT_HOLD,
} = await import("data:text/javascript," + encodeURIComponent(js))

// ---- beats -----------------------------------------------------------------
{
  assert.deepEqual(BEATS, ["intro", "six", "seven", "pump", "title"])
  assert.equal(BEAT_START.length, BEATS.length)
  assert.equal(BEAT_HOLD.length, BEATS.length)
  for (let i = 1; i < BEAT_START.length; i++) assert.ok(BEAT_START[i] > BEAT_START[i - 1], "beats run in order")
  // Every chip lands inside the beat it names, or the pressed chip lies.
  BEAT_HOLD.forEach((h, i) => assert.equal(beatIndex(h), i, "hold " + h + " is inside beat " + BEATS[i]))
  for (let t = -0.5; t <= 1.5; t += 0.01) {
    const i = beatIndex(t)
    assert.ok(Number.isInteger(i) && i >= 0 && i < BEATS.length, "beat " + i + " at " + t)
  }
  assert.equal(beatIndex(1), BEATS.length - 1, "the end is the title")
  // The six comes before the seven. That is the whole joke.
  assert.ok(BEAT_START[1] < BEAT_START[2])
}

// ---- the auto clock --------------------------------------------------------
{
  const d = 11
  const h = 3.5
  assert.deepEqual(autoFrame(0, d, h, true), { t: 0, blackout: 0 }, "starts at the top")
  assert.equal(autoFrame(d / 2, d, h, true).t, 0.5)
  assert.equal(autoFrame(d, d, h, true).t, 1, "reaches the poster")
  assert.equal(autoFrame(d + 1, d, h, true).t, 1, "and holds it")
  assert.equal(autoFrame(d + 1, d, h, true).blackout, 0, "without fading early")
  assert.ok(autoFrame(d + h - 0.01, d, h, true).blackout > 0.9, "fades to black at the end of the hold")
  assert.equal(autoFrame(d + h, d, h, true).t, 0, "then wraps to the top")
  assert.ok(Math.abs(autoFrame(d + h + 2, d, h, true).t - 2 / d) < 1e-9, "and plays again")
  // Without a loop it stays on the poster, and never blacks out.
  assert.deepEqual(autoFrame(999, d, h, false), { t: 1, blackout: 0 })
  assert.deepEqual(autoFrame(-5, d, h, false), { t: 0, blackout: 0 }, "negative time clamps")
  // Degenerate settings must not divide by zero and paint NaN.
  for (const [dd, hh] of [[0, 0], [-1, -1], [0.1, 0]]) {
    const f = autoFrame(3, dd, hh, true)
    assert.ok(Number.isFinite(f.t) && Number.isFinite(f.blackout), "finite with duration " + dd)
  }
}

// ---- scroll progress -------------------------------------------------------
{
  assert.equal(progressFrom(0, 4000, 1000), 0)
  assert.equal(progressFrom(-3000, 4000, 1000), 1)
  assert.equal(progressFrom(-1500, 4000, 1000), 0.5)
  assert.equal(progressFrom(400, 4000, 1000), 0, "before it enters")
  assert.equal(progressFrom(-99999, 4000, 1000), 1, "after it leaves")
  assert.equal(progressFrom(-10, 800, 1000), 0, "no travel, no progress")
}

// ---- the gesture -----------------------------------------------------------
{
  // Left side up for the six, right side up for the seven.
  const six = weigh(BEAT_HOLD[1])
  assert.ok(six.left > 0.95 && six.right < 0.05, "the six raises the left side")
  const seven = weigh(BEAT_HOLD[2])
  assert.ok(seven.right > 0.95 && seven.left < 0.05, "the seven raises the right side")
  // During the pump the sides go opposite ways — the meme.
  let crossings = 0
  let prev = 0
  for (let t = 0.645; t <= 0.755; t += 0.001) {
    const { left, right } = weigh(t)
    const d = Math.sign(left - right)
    if (prev && d && d !== prev) crossings++
    if (d) prev = d
  }
  assert.ok(crossings >= 4, "the pump swings the sides past each other (" + crossings + ")")
  // No jumps anywhere: a side that teleports between frames reads as a bug.
  // 0.001 of the timeline is about one frame of the default 11s clock; the
  // pump is fast on purpose, but no side may cover a tenth of its travel in it.
  let last = weigh(0)
  for (let t = 0.001; t <= 1; t += 0.001) {
    const cur = weigh(t)
    assert.ok(Math.abs(cur.left - last.left) < 0.1 && Math.abs(cur.right - last.right) < 0.1, "balance jumped at " + t)
    assert.ok(cur.left >= -1e-9 && cur.left <= 1.2 && cur.right >= -1e-9 && cur.right <= 1.2, "lift out of range at " + t)
    last = cur
  }
}

// ---- the paint -------------------------------------------------------------
{
  const intro = paintAt(0.05)
  assert.equal(intro.six, 0, "nothing painted in the intro")
  assert.equal(intro.seven, 0)
  assert.equal(intro.title, 0)
  const a = paintAt(BEAT_HOLD[1])
  assert.equal(a.six, 1, "the six is fully painted by its hold frame")
  assert.equal(a.seven, 0, "and the seven has not started")
  const b = paintAt(BEAT_HOLD[2])
  assert.equal(b.seven, 1, "the seven is fully painted by its hold frame")
  assert.ok(b.sixAlpha < b.sevenAlpha, "the six steps back when the seven arrives")
  const end = paintAt(1)
  assert.equal(end.title, 1, "the title is fully painted at the end")
  assert.equal(end.poster, 1, "and the small print is up")
  assert.equal(end.ghost, 1, "the numerals sink into the field")
  assert.ok(end.sixAlpha < 1e-9 && end.sevenAlpha < 1e-9, "and leave the front for the title")
  for (let t = 0; t <= 1; t += 0.002) {
    const p = paintAt(t)
    for (const k of Object.keys(p)) assert.ok(p[k] >= -1e-9 && p[k] <= 1 + 1e-9, k + " left [0,1] at " + t)
    const f = flashAt(t)
    assert.ok(f >= 0 && f <= 1, "flash out of range at " + t)
  }
  // Reveals only ever move forward, so scrubbing forward never un-paints.
  let p6 = 0
  let pt = 0
  for (let t = 0; t <= 1; t += 0.002) {
    const p = paintAt(t)
    assert.ok(p.six >= p6 - 1e-12 && p.title >= pt - 1e-12, "a reveal went backwards at " + t)
    p6 = p.six
    pt = p.title
  }
  assert.equal(flashAt(0.5), 0, "no flash between cuts")
  assert.equal(flashAt(0.12), 1, "a hard frame at the cut")
}

// ---- helpers ---------------------------------------------------------------
{
  assert.equal(clamp01(NaN), 0)
  assert.equal(clamp01(-0), 0)
  assert.equal(clamp01(3), 1)
  assert.equal(smoothstep(0.5, 0.5, 0.4), 0, "equal edges must not divide by zero")
  assert.equal(smoothstep(0.5, 0.5, 0.6), 1)
}

// ---- install safety --------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.ok(imports.length > 0 && imports.every((m) => m === "react"), "the only import may be react")

const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1")
assert.doesNotMatch(code, /@import/, "no @import — the host owns Tailwind and fonts")
assert.doesNotMatch(code, /^\s*(\*|body|:root|html)\s*{/m, "no bare global resets")
assert.doesNotMatch(code, /[`]/, "no backticks — build strings with concatenation")
assert.doesNotMatch(code, /https?:\/\//, "no remote assets: the capture sandbox blocks them")
assert.doesNotMatch(code, /new Image\(|<img/, "everything is drawn, nothing is loaded")

// Scroll mode measures the element, not the document.
assert.doesNotMatch(code, /scrollY|pageYOffset/, "measure from the element, not the document")
assert.ok(src.includes("getBoundingClientRect"), "progress comes from the element's rect")
assert.ok(/\{ passive: true \}/.test(src), "scroll listeners must be passive")
assert.ok(src.includes("new ResizeObserver"), "a resized box must resize the drawing buffer")
assert.ok(src.includes("canvas.clientWidth"), "the canvas measures its own box")

// Auto is the default, scroll is the alternative.
assert.ok(/mode = "auto"/.test(src), "auto must be the default mode")
assert.ok(/mode === "scroll" \? "sticky top-0 "/.test(src), "scroll mode pins a sticky stage")

// Heights: definite lengths only. A percentage collapses to 0px on an
// installed page that has no html/body/#root height chain.
assert.ok(/height = "100svh"/.test(src), "height defaults to a definite length")
const root = src.slice(src.indexOf("<section"), src.indexOf("<canvas"))
assert.doesNotMatch(root, /\bh-(full|screen)\b/, "no percentage height on the root or stage")
assert.ok(/maxWidth: "none"/.test(src), "guard Preflight's img/canvas max-width")

// Motion: reduced motion must stop the loop and rest on the poster.
assert.ok(src.includes("prefers-reduced-motion"), "must read prefers-reduced-motion")
assert.ok(/if \(reduced && mode === "auto"\)/.test(src), "reduced motion rests on the finished poster")
assert.ok(/if \(!reduced && visible\) raf = requestAnimationFrame/.test(src), "reduced motion must not loop")
for (const gone of ["cancelAnimationFrame(raf)", "observer.disconnect()", "io.disconnect()", 'removeEventListener("scroll"']) {
  assert.ok(src.includes(gone), "cleanup is missing " + gone)
}

// Accessibility: the canvas is decoration, the copy exists as text, the
// controls are real buttons with names.
assert.ok(src.includes('aria-hidden="true"'), "the canvas must be hidden from the tree")
assert.ok(src.includes('className="sr-only"'), "the poster copy must exist as real text")
assert.ok(/aria-label=\{playing \? "Pause" : "Play"\}/.test(src), "play/pause must be named")
assert.ok(src.includes("tabIndex={0}") && src.includes("onKeyDown"), "the stage must be keyboard-reachable")

// No figure, no hands, no stains: the gesture belongs to the numerals.
assert.doesNotMatch(code, /drawHand|drawArm|paintTorso|splatter|blood|shirt/, "no body parts or gore in the poster")

// Every glyph the defaults ask for must exist, or that letter paints nothing.
const glyphs = src.slice(src.indexOf("const GLYPHS"), src.indexOf("const SPACE"))
for (const ch of new Set("SIXSE7EN67THEANSWER42".split(""))) {
  assert.ok(new RegExp("(^|\\s)(\"" + ch + "\"|" + ch + "): \\[").test(glyphs.split("\n").map((l) => l.trim()).join("\n")), "no glyph for " + ch)
}
for (let c = 65; c <= 90; c++) assert.ok(glyphs.includes("  " + String.fromCharCode(c) + ": ["), "alphabet is missing " + String.fromCharCode(c))
for (let d = 0; d <= 9; d++) assert.ok(glyphs.includes('"' + d + '": ['), "digits are missing " + d)

// Demos: a wrapper at width:auto collapses inside 21st's centring flex.
for (const demo of ["demo.tsx", "demo-scroll.tsx", "demo-custom.tsx"]) {
  const d = readFileSync(new URL("../components/six-seven-poster/" + demo, import.meta.url), "utf8")
  assert.ok(d.includes('from "@/components/ui/six-seven-poster"'), demo + " imports the installed path")
  for (const cls of d.match(/className="[^"]*"/g) ?? []) {
    assert.ok(/\bw-(full|screen|\[|\d)/.test(cls), demo + ": " + cls + " wraps the poster without a width")
  }
}
assert.ok(readFileSync(new URL("../components/six-seven-poster/demo-scroll.tsx", import.meta.url), "utf8").includes('mode="scroll"'), "the scroll demo must use scroll mode")

console.log("six-seven-poster: ok")
