// Install-safety and behaviour check for components/miss-minutes-clock.
// Run: node tests/miss-minutes-clock.test.mjs
//
// Two halves. The install surface — a style block that escapes the root, a
// height that collapses on an installed page, SVG ids two instances would
// fight over, listeners left behind. And the script: the pure helpers in the
// `// #region script` block are lifted out and run for real.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const src = readFileSync(
  new URL("../components/miss-minutes-clock/miss-minutes-clock.tsx", import.meta.url),
  "utf8",
).replace(/\r\n/g, "\n")

const css = src.slice(src.indexOf("const CSS = `") + 13, src.lastIndexOf("\n`\n"))
assert.ok(css.length > 1000, "could not extract the style block")

/* ---------- install safety ---------- */

assert.doesNotMatch(css, /@import/, "no @import in the inline style block")
assert.doesNotMatch(css, /[`]|\$\{/, "no backticks or template holes inside the CSS")
assert.doesNotMatch(src, /https?:\/\//, "no external origins — the capture sandbox blocks them")
for (const bad of [/<img/, /@font-face/, /\.png/, /\.jpe?g/, /\.webp/]) {
  assert.doesNotMatch(src, bad, `the character is drawn, no asset may travel with it (${bad})`)
}
assert.doesNotMatch(src, /^import (?!\* as React from "react")/m, "React is the only import")

for (const line of css.split("\n")) {
  const m = line.match(/^\s*([^@{}/*][^{]*)\{/)
  if (!m) continue
  for (const sel of m[1].split(",")) {
    const s = sel.trim()
    if (!s || /^(from|to|\d+%)/.test(s)) continue
    assert.ok(s.startsWith(".rcc"), `selector escapes the component root: ${s}`)
  }
}

assert.match(src, /height = "100svh"/, "height must default to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full on the component root")
const rootRule = css.match(/\.rcc-root\{([^}]*)\}/)
assert.ok(rootRule, "missing the .rcc-root rule")
assert.doesNotMatch(rootRule[1], /(^|;)\s*height/, "the root must take its height from the prop")
assert.match(rootRule[1], /container:rcc \/ size/, "the root is the size container the layout queries")
assert.match(css, /\.rcc-svg\{[^}]*max-width:none/, "guard Preflight on the stage SVG")

assert.match(src, /React\.useId\(\)/, "ids must be namespaced per instance")
assert.equal(src.match(/url\(#(?!")/g), null, "every url(#...) must be built by u(), not hard-coded")
assert.doesNotMatch(src, /\bid="/, "no literal SVG ids")

assert.match(css, /prefers-reduced-motion: reduce/, "reduced motion must switch the CSS motion off")
assert.match(src, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/, "and the JS loop must honour it too")

for (const ev of ["pointermove", "pointerdown", "blur"]) {
  assert.match(src, new RegExp('removeEventListener\\("' + ev + '"'), `${ev} listener must be removed`)
}
assert.match(src, /cancelAnimationFrame\(raf\)/, "the frame loop must be cancelled on unmount")
assert.match(src, /clearInterval\(iv\)/, "the idle interval must be cleared on unmount")
assert.match(src, /role="status"/, "her lines must reach screen readers")
assert.match(src, /role="button"[\s\S]{0,40}tabIndex=\{0\}/, "she can be poked from the keyboard")

// No chat: she is a character, not a chatbot.
for (const gone of [/<input/, /<form/, /onAsk/, /SpeechRecognition/]) {
  assert.doesNotMatch(src, gone, `no chat surface (${gone})`)
}

const ts = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")
assert.match(ts, /"@\/components\/ui\/miss-minutes-clock"/, "tsconfig paths needs the alias line")

/* ---------- the script, run for real ---------- */

const start = src.indexOf("// #region script")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "script region markers missing")
const js = src
  .slice(start, end)
  .replace(/:\s*(string|number|boolean|Vars|Lines|Date)(\[\])?(?=\s*[,)={;])/g, "")
const B = await import("data:text/javascript," + encodeURIComponent(js))

// Every line fills cleanly, and every dock reaction has something to say.
const vars = { name: "N", org: "O", user: "U", User: "U", time: "T" }
for (const [key, list] of Object.entries(B.LINES)) {
  assert.ok(list.length > 0, `${key} has lines`)
  for (const l of list) assert.doesNotMatch(B.fill(l, vars), /\{\w+\}/, `unknown placeholder in ${key}: ${l}`)
  for (const l of list) assert.doesNotMatch(l, /\bsugar\b/i, `pet name is a prop, not hard-coded: ${l}`)
}
const reactions = [...src.matchAll(/\{ id: "(\w+)", label:/g)].map((m) => m[1])
assert.equal(reactions.length, 8)
for (const r of reactions) assert.ok(B.LINES[r], `dock reaction ${r} has no lines`)
for (const k of ["greet", "poke", "wake", "dizzy", "dance", "antic"]) assert.ok(B.LINES[k], `${k} lines`)

assert.equal(B.fill("Hi {user}, I'm {name} {x}", { user: "Ada", name: "M" }), "Hi Ada, I'm M {x}", "unknown keys are left alone")
assert.equal(B.pick(["a", "b", "c"], 4), "b")
assert.equal(B.pick(["a", "b"], -1), "b", "negative seeds wrap")
assert.equal(B.formatTime(new Date(2026, 0, 1, 0, 5)), "12:05 AM")
assert.equal(B.formatTime(new Date(2026, 0, 1, 15, 7)), "3:07 PM")

// Pokes escalate: giggle, startle, wink, then cross, then a glitch that stays.
assert.deepEqual([1, 2, 3, 4, 5, 9].map((n) => B.pokeStep(n).mood), ["happy", "surprised", "wink", "stern", "stern", "stern"])
assert.equal(B.pokeStep(4).glitch, false)
assert.equal(B.pokeStep(5).glitch, true)
assert.equal(B.pokeStep(9).line, 4, "the ladder tops out on the last line")
assert.equal(B.pokeStep(0).line, 0)

// Nearness: 1 on the nose, 0 far off, monotonic in between.
assert.equal(B.nearness(100, 100, 100, 100, 50), 1)
assert.equal(B.nearness(1000, 100, 100, 100, 50), 0)
assert.ok(B.nearness(160, 100, 100, 100, 50) > B.nearness(200, 100, 100, 100, 50))

// Shake: fast scribbles within the window count, old travel does not.
const trail = []
for (let i = 0; i < 20; i++) trail.push(1000 + i * 16, 150)
assert.ok(B.isShake(trail, 1320, 800, 2600), "3000px in 300ms is a shake")
assert.ok(!B.isShake(trail, 5000, 800, 2600), "stale travel is forgotten")
assert.ok(!B.isShake([1000, 40, 1016, 40], 1016, 800, 2600), "a normal move is not a shake")

// Lip-sync and pacing.
assert.equal(B.cadence("a"), 1)
assert.ok(B.cadence("m") < 0.1 && B.cadence(" ") === 0)
assert.ok(B.typeDelay(".") > B.typeDelay(",") && B.typeDelay(",") > B.typeDelay("a"))

// The mouth: closed is a single curve, open lips part, a smile dips in the middle.
const nums = (d) => d.match(/-?\d+(\.\d+)?/g).map(Number)
const shut = nums(B.mouthPath(24, 7, 0, 0))
assert.equal(shut[3], shut[7], "closed lips share one control point")
const open = nums(B.mouthPath(24, 7, 10, 0))
assert.ok(open[7] - open[3] > 25, "an open mouth parts its lips")
assert.ok(shut[3] > 232, "a positive curve is a smile")
assert.ok(nums(B.mouthPath(24, -6, 0, 0))[3] < 232, "a negative curve is a frown")

console.log("ok - miss-minutes-clock")
