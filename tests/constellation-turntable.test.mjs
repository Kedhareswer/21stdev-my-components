// Runnable check for the deck maths in components/constellation-turntable —
// the tonearm geometry, the groove spiral, the motor and the pressed sky — plus
// the install-safety rules the .tsx has to keep.
// Run: node tests/constellation-turntable.test.mjs
//
// The drawing is SVG and the score is Web Audio; neither can be asserted here.
// What can is everything they are driven by: where the stylus lands for a given
// arm angle, which second of which track sits under it, how the platter comes
// up to speed, and where the stars are allowed to fall.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const dir = new URL("../components/constellation-turntable/", import.meta.url)
const src = readFileSync(new URL("constellation-turntable.tsx", dir), "utf8")

const start = src.indexOf("// #region turntable")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "turntable region markers missing")

const js = src
  .slice(start, end)
  .replace(/:\s*(?:Segment\[\]|Segment|Star\[\]|number\[\]\[\]|number\[\]|number|string|boolean)(?=[\s,)=;{])/g, "")
const {
  clamp, mulberry32, hashString, wrapAngle,
  RECORD_R, LABEL_R, WAX_R, GROOVE_OUT, GROOVE_IN, PIVOT, STYLUS,
  armAngle, stylusAt, stylusRadius,
  LEAD_IN, GAP, LEAD_OUT, buildTimeline, sideLength, segmentAt, radiusAt, timeAt, trackStart, trackLevel,
  formatTime, rpmToOmega, approach, makeStars,
} = await import("data:text/javascript," + encodeURIComponent(js))

const close = (a, b, eps = 1e-9) => Math.abs(a - b) < eps

// ---- basics ---------------------------------------------------------------
{
  assert.equal(clamp(NaN, 2, 9), 2, "NaN falls to the low end")
  assert.equal(clamp(99, 2, 9), 9)
  const a = mulberry32(7)
  const b = mulberry32(7)
  for (let i = 0; i < 200; i++) {
    const v = a()
    assert.equal(v, b(), "the sky must be the same on every load (and on the server)")
    assert.ok(v >= 0 && v < 1)
  }
  assert.equal(hashString("Orion"), hashString("Orion"))
  assert.notEqual(hashString("Orion"), hashString("Lyra"))
  for (const x of [0, 1, -1, 3.2, -3.2, 7, -7, 100, Math.PI, -Math.PI]) {
    const w = wrapAngle(x)
    assert.ok(w > -Math.PI - 1e-12 && w <= Math.PI + 1e-12, `wrap(${x}) = ${w}`)
    assert.ok(close(Math.cos(w), Math.cos(x), 1e-9) && close(Math.sin(w), Math.sin(x), 1e-9), "same direction")
  }
}

// ---- the record's rings nest ----------------------------------------------
assert.ok(LABEL_R < WAX_R && WAX_R < GROOVE_IN && GROOVE_IN < GROOVE_OUT && GROOVE_OUT < RECORD_R)

// ---- tonearm --------------------------------------------------------------
{
  // The arm is drawn in the print's pose, so that pose is zero turn.
  assert.ok(close(armAngle(Math.hypot(STYLUS[0], STYLUS[1])), 0, 1e-9), "drawn pose is θ = 0")
  assert.ok(close(stylusAt(0)[0], STYLUS[0], 1e-9) && close(stylusAt(0)[1], STYLUS[1], 1e-9))
  // Every groove is reachable and the inverse is exact.
  let prev = -Infinity
  for (let r = GROOVE_OUT + 60; r >= GROOVE_IN; r -= 7) {
    const th = armAngle(r)
    assert.ok(Number.isFinite(th))
    assert.ok(close(stylusRadius(th), r, 1e-6), `stylus misses r=${r}`)
    assert.ok(th > prev, "inward is a positive, monotonic turn")
    prev = th
  }
  // The stylus keeps its distance from the pivot: it is one rigid arm.
  const L = Math.hypot(STYLUS[0] - PIVOT[0], STYLUS[1] - PIVOT[1])
  for (const th of [-0.2, 0, 0.1, 0.3]) {
    const s = stylusAt(th)
    assert.ok(close(Math.hypot(s[0] - PIVOT[0], s[1] - PIVOT[1]), L, 1e-9))
  }
  // The pivot sits off the record, up and to the right, as on a deck.
  assert.ok(Math.hypot(PIVOT[0], PIVOT[1]) > RECORD_R && PIVOT[0] > 0 && PIVOT[1] < 0)
}

// ---- the groove spiral ----------------------------------------------------
{
  const durs = [204, 245, 168, 231, 270, 192]
  const tl = buildTimeline(durs, GROOVE_OUT, GROOVE_IN)
  assert.deepEqual(tl.map((s) => s.kind), [0, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 3], "lead-in, tracks with gaps, lead-out")
  for (let i = 1; i < tl.length; i++) {
    assert.ok(close(tl[i].t0, tl[i - 1].t1), "time is continuous")
    assert.ok(close(tl[i].r0, tl[i - 1].r1), "the groove is continuous")
  }
  assert.ok(close(tl[0].r0, GROOVE_OUT) && close(tl[tl.length - 1].r1, GROOVE_IN, 1e-9), "fills the grooved area exactly")
  assert.ok(close(sideLength(tl), LEAD_IN + LEAD_OUT + GAP * 5 + durs.reduce((a, b) => a + b, 0)))
  // Constant pitch: a band is as wide as its track is long.
  const bands = tl.filter((s) => s.kind === 1)
  const pitch = (bands[0].r0 - bands[0].r1) / durs[0]
  bands.forEach((b, i) => assert.ok(close((b.r0 - b.r1) / durs[i], pitch, 1e-9), `band ${i} pitch`))
  // The gap before a track carries that track's index, so the player can name what's next.
  assert.equal(segmentAt(tl, trackStart(tl, 3) - 0.5).track, 3)
  assert.equal(segmentAt(tl, trackStart(tl, 3) + 1).kind, 1)
  assert.equal(trackStart(tl, 0), LEAD_IN)

  // radius and time are each other's inverse, and the needle only moves inward.
  let r0 = Infinity
  for (let t = 0; t <= sideLength(tl); t += 3.7) {
    const r = radiusAt(tl, t)
    assert.ok(r <= r0 + 1e-9, "the needle walks inward")
    r0 = r
    assert.ok(close(timeAt(tl, r), t, 1e-6), `timeAt(radiusAt(${t}))`)
  }
  assert.equal(radiusAt(tl, -50), GROOVE_OUT, "before the side clamps to the lead-in")
  assert.ok(close(radiusAt(tl, 1e9), GROOVE_IN, 1e-9), "after it clamps to the run-out")
  assert.equal(timeAt(tl, RECORD_R + 100), 0, "dropping outside the grooves starts at the top")

  // Silence between tracks, sound inside, a short fade at each edge.
  assert.equal(trackLevel(tl[0], 1), 0)
  assert.equal(trackLevel(tl[2], tl[2].t0 + 1), 0)
  assert.equal(trackLevel(tl[1], tl[1].t0 + 60), 1)
  const edge = trackLevel(tl[1], tl[1].t0 + 0.3)
  assert.ok(edge > 0 && edge < 1)

  // Junk durations fall back rather than collapsing the spiral.
  const junk = buildTimeline([NaN, -4, 0, 120], GROOVE_OUT, GROOVE_IN)
  for (const s of junk) assert.ok(s.t1 > s.t0 && s.r0 > s.r1, "every segment has length and width")
  assert.equal(buildTimeline([], GROOVE_OUT, GROOVE_IN).filter((s) => s.kind === 1).length, 1)
}

// ---- motor and clock ------------------------------------------------------
{
  assert.ok(close(rpmToOmega(33), (100 / 3) * (Math.PI / 30)), "33 means 33⅓")
  assert.ok(close(rpmToOmega(45), 1.5 * Math.PI))
  // Spin-up never overshoots and lands within a second or two.
  let w = 0
  const target = rpmToOmega(33)
  for (let i = 0; i < 120; i++) {
    w = approach(w, target, 1 / 60, 0.42)
    assert.ok(w <= target + 1e-12)
  }
  assert.ok(w > target * 0.98, "up to speed in two seconds")
  assert.equal(approach(5, 0, 0.1, 0), 0, "a zero time constant snaps instead of dividing by zero")
  assert.equal(formatTime(0), "0:00")
  assert.equal(formatTime(204), "3:24")
  assert.equal(formatTime(59.99), "0:59")
  assert.equal(formatTime(-3), "0:00")
  assert.equal(formatTime(NaN), "0:00")
}

// ---- the pressed sky ------------------------------------------------------
{
  const avoid = [[-65, 297, 30], [300, 0, 20]]
  const a = makeStars(7, 1, avoid)
  const b = makeStars(7, 1, avoid)
  assert.deepEqual(a, b, "seeded")
  assert.notDeepEqual(makeStars(8, 1, avoid), a, "a new seed is a new sky")
  assert.ok(a.length > 900, `a full sky (${a.length})`)
  for (const s of a) {
    const r = Math.hypot(s.x, s.y)
    assert.ok(r > WAX_R && r < RECORD_R - 5, "stars stay on the grooved vinyl, off the label")
    for (const [x, y, rad] of avoid) assert.ok(Math.hypot(s.x - x, s.y - y) >= rad, "kept clear of planets and names")
    assert.ok(s.r > 0 && s.r < 4 && s.o > 0 && s.o <= 1)
  }
  assert.equal(makeStars(7, 0, []).length, 0)
  assert.ok(makeStars(7, 2, []).length > makeStars(7, 1, []).length)
  assert.equal(makeStars(7, NaN, []).length, 0, "junk density draws nothing rather than throwing")
}

// ---- default sky ----------------------------------------------------------
{
  const block = src.slice(src.indexOf("export const DEFAULT_TRACKS"), src.indexOf("// Positions and sizes off the print"))
  const titles = [...block.matchAll(/title: "([^"]+)"/g)].map((m) => m[1])
  assert.deepEqual(titles, ["Capricorn", "Scorpio", "Ursa Major", "Taurus", "Hercules", "Aries"], "the print's six")
  assert.equal([...block.matchAll(/figure: \[/g)].length, 6, "every default constellation has its figure")
  for (const m of block.matchAll(/\[(-?[\d.]+), (-?[\d.]+)\]/g)) {
    assert.ok(Math.abs(+m[1]) <= 1 && Math.abs(+m[2]) <= 1, "figure points stay in their -1..1 box")
  }
  const planets = src.slice(src.indexOf("const PLANETS"), src.indexOf("const SPARKLES"))
  for (const m of planets.matchAll(/x: (-?\d+), y: (-?\d+), r: ([\d.]+)/g)) {
    const r = Math.hypot(+m[1], +m[2])
    assert.ok(r - +m[3] > WAX_R && r + +m[3] < RECORD_R, "planets sit on the vinyl")
  }
}

// ---- install safety ------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "the only import may be react")
assert.doesNotMatch(src, /@import/, "no @import — the host owns Tailwind and fonts")
assert.doesNotMatch(src, /^\s*(\*|body|:root|html)\s*{/m, "no bare global resets")
assert.doesNotMatch(src, /\$\{/, "no template interpolation anywhere")
const css = src.slice(src.indexOf("const CSS ="), src.indexOf("type Camera"))
assert.doesNotMatch(css, /`/, "no backticks in the CSS string")
for (const rule of css.match(/"\.[^"{]+\{/g) ?? []) {
  assert.ok(rule.startsWith('".ctt-root'), `CSS rule is not scoped: ${rule}`)
}
assert.doesNotMatch(src, /https?:\/\/(?!www\.w3\.org)/, "no remote assets — nothing for a capture sandbox to block")
assert.doesNotMatch(src, /innerWidth|innerHeight/, "size from the element, not the window")
assert.ok(src.includes("new ResizeObserver"), "a resized box must reframe the deck")
assert.ok(src.includes("new IntersectionObserver"), "drawing pauses off-screen")

// Height is an explicit length on the root.
assert.ok(/height = "100svh"/.test(src), "height defaults to a definite length")
const root = src.slice(src.indexOf("<div\n      ref={rootRef}"), src.indexOf("<style>{CSS}</style>"))
assert.ok(root.includes("height,"), "the root takes the height prop")
assert.doesNotMatch(root, /\bh-(full|screen)\b/, "no percentage height on the root")
assert.ok((src.match(/maxWidth: "none"/g) ?? []).length >= 4, "every svg is guarded against Preflight's max-width")

// Everything started is stopped.
for (const gone of [
  "observer.disconnect()",
  "io.disconnect()",
  "cancelAnimationFrame(raf)",
  'media.removeEventListener("change", syncMotion)',
  'document.removeEventListener("visibilitychange", onVisibility)',
  "ctx.close()",
]) {
  assert.ok(src.includes(gone), `cleanup is missing ${gone}`)
}

// Sound only after a gesture: the context is made in one place, behind ensureAudio.
assert.equal((src.match(/\bcreateSound\b/g) ?? []).length, 2, "createSound is defined once and called once")
const ensure = src.slice(src.indexOf("const ensureAudio"), src.indexOf("const play = "))
assert.ok(ensure.includes("createSound("), "and that call is inside ensureAudio")
assert.ok(ensure.includes("if (!t.sound) return"), "sound={false} never creates a context")
assert.ok(src.includes("document.hidden") && src.includes("suspend()"), "a hidden tab goes quiet")

// Reduced motion: the platter stops turning on its own; the reader's own drag still moves it.
assert.ok(src.includes("prefers-reduced-motion"))
assert.ok(/if \(!t\.reduced\) s\.angle \+= s\.omega \* dt/.test(src), "reduced motion stops the visual spin")
assert.ok(/prefers-reduced-motion:reduce\)\{[^}]*ctt-sparkle/.test(css), "and the twinkle")
assert.ok(src.includes("motion-reduce:transition-none"))

// A control, so reachable without a pointer, and it says what it does.
assert.ok(src.includes("tabIndex={0}"))
assert.ok(src.includes('role="application"'))
assert.ok(src.includes('aria-live="polite"'))
for (const label of ['"Previous track"', '"Next track"', '"Pause" : "Play"', '"Speed"']) {
  assert.ok(src.includes(label), `missing control label ${label}`)
}
// Touch keeps the page scrollable over the record; the small arm takes every gesture.
assert.ok(src.includes('touchAction: "pan-y"'), "vertical swipes over the record scroll the page")
assert.ok(src.includes("onPointerCancel={onRecordCancel}"), "a scroll that steals the gesture releases the record")
const cancel = src.slice(src.indexOf("const onRecordCancel"), src.indexOf("const onArmDown"))
assert.doesNotMatch(cancel, /toggle\(|ring\(|cue\(/, "and is never read as a tap")

// Full-bleed demos stay full-bleed and import the installed path.
for (const demo of ["demo.tsx", "demo-deck.tsx"]) {
  const d = readFileSync(new URL(demo, dir), "utf8")
  assert.ok(d.includes('from "@/components/ui/constellation-turntable"'), `${demo} imports the installed path`)
  assert.doesNotMatch(d, /<div/, `${demo} must not wrap the deck`)
}

// tsc needs its one hand-written line.
const tsconfig = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")
assert.ok(
  tsconfig.includes('"@/components/ui/constellation-turntable": ["./components/constellation-turntable/constellation-turntable.tsx"]'),
  "tsconfig paths line missing",
)

console.log("constellation-turntable: ok")
