// Runnable check for the tilt/accent math in components/notebook-testimonials,
// plus the install-safety rules the .tsx has to keep.
// Run: node tests/notebook-testimonials.test.mjs
//
// The piece is all CSS, so what is worth executing is the small amount of
// arithmetic that decides how the cards are laid out — which is exactly where
// a silent failure lives: a tilt that lands flat, an accent that repeats
// next to itself, or a shuffle that disagrees between server and browser.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const src = readFileSync(
  new URL("../components/notebook-testimonials/notebook-testimonials.tsx", import.meta.url),
  "utf8",
)

const start = src.indexOf("// #region layout")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "layout region markers missing")

const js = src
  .slice(start, end)
  .replace(/:\s*\{ accent\?: string \}/g, "")
  .replace(/:\s*string\[\]/g, "")
  .replace(/:\s*number/g, "")
  .replace(/:\s*string/g, "")
const { shuffle, tiltFor, accentFor } = await import(
  "data:text/javascript," + encodeURIComponent(js)
)

// ---- the shuffle is a hash, not a random number --------------------------
{
  // It runs during render. If it were random the server and the browser would
  // disagree and React would throw away the markup on hydration.
  for (let i = 0; i < 50; i++) {
    const v = shuffle(i, 1)
    assert.ok(Number.isFinite(v), `non-finite at ${i}`)
    assert.ok(v >= 0 && v < 1, `out of range at ${i}: ${v}`)
    assert.equal(shuffle(i, 1), v, `not deterministic at ${i}`)
  }
  // A different seed has to actually give a different arrangement.
  const a = Array.from({ length: 12 }, (_, i) => shuffle(i, 1))
  const b = Array.from({ length: 12 }, (_, i) => shuffle(i, 2))
  assert.ok(a.some((v, i) => v !== b[i]), "the seed changes nothing")
  // And it must not collapse to a handful of values.
  assert.ok(new Set(a).size >= 10, `too few distinct values: ${new Set(a).size}`)
}

// ---- every card is visibly tilted, and the row zig-zags -------------------
{
  const max = 5
  let lastSign = 0
  for (let i = 0; i < 40; i++) {
    const t = tiltFor(i, 1, max)
    const mag = Math.abs(t)
    // Never flat: a single upright card among tilted ones reads as a bug.
    assert.ok(mag >= 0.45 * max - 1e-9, `card ${i} is too flat: ${t}`)
    assert.ok(mag <= max + 1e-9, `card ${i} exceeds the maximum: ${t}`)
    const sign = Math.sign(t)
    if (i > 0) assert.notEqual(sign, lastSign, `cards ${i - 1} and ${i} lean the same way`)
    lastSign = sign
  }
  // tilt={0} has to mean flat, not "very slightly crooked".
  for (let i = 0; i < 6; i++) assert.equal(tiltFor(i, 1, 0), 0, "tilt 0 must lay them flat")
}

// ---- accents cycle, and never sit next to themselves ----------------------
{
  const palette = ["red", "green", "blue"]
  assert.equal(accentFor({}, 0, palette), "red")
  assert.equal(accentFor({}, 3, palette), "red", "the palette cycles")
  for (let i = 1; i < 12; i++) {
    assert.notEqual(
      accentFor({}, i, palette),
      accentFor({}, i - 1, palette),
      `neighbours ${i - 1} and ${i} share an accent`,
    )
  }
  assert.equal(accentFor({ accent: "hotpink" }, 1, palette), "hotpink", "an item overrides")
  // An empty palette must not index undefined into a style property.
  assert.equal(accentFor({}, 2, []), "currentColor", "an empty palette needs a fallback")
}

// ---- install safety ------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "the only import may be react")

// The rules below are about what the component *does*, so they are checked
// against the code with the prose stripped out — a doc comment that mentions
// a forbidden token is not a use of it.
const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1")

// The pen pulled Special Elite off Google Fonts. Loading a font is the host
// page's job — an @import from a component reaches outside its own styles.
assert.doesNotMatch(code, /@import/, "no @import — the host owns Tailwind and fonts")
assert.ok(/fontFamily = /.test(code), "the typewriter face must be a prop instead")
assert.ok(/Courier/.test(code), "and must degrade to something without a download")
assert.doesNotMatch(code, /^\s*(\*|body|:root|html)\s*{/m, "no bare global resets")

// Every CSS value here is built by concatenation for a reason: a stray
// backtick inside a template literal closes the string early and the style
// silently becomes garbage.
assert.doesNotMatch(code, /[`]/, "no backticks — build CSS strings with concatenation")

// Rendering must not depend on the render happening in a browser, or the
// markup is thrown away on hydration.
assert.doesNotMatch(code, /Math\.random|Date\.now/, "layout must be deterministic")

const root = src.slice(src.indexOf("<div"), src.indexOf("{items.map"))
assert.doesNotMatch(root, /\bh-(full|screen)\b/, "no percentage height on the root")

// The holes are the piece. `subtract` is what makes them holes rather than
// painted dots, and Safari needs the legacy keyword alongside the standard.
assert.ok(src.includes("maskComposite") && src.includes('"subtract"'), "holes need subtract")
assert.ok(src.includes("WebkitMaskComposite"), "Safari needs the prefixed composite too")
assert.ok(
  src.indexOf("WebkitMaskComposite") < src.indexOf("maskComposite: "),
  "the standard property must come last so it wins where both are supported",
)

// The ruled lines and the text share one number. Any other pairing and the
// writing drifts off the rules as the quote gets longer — which only shows up
// with a quote longer than the demo's.
assert.ok(/lineHeight: rowSize \+ "px"/.test(src), "line-height must be the row size")
assert.ok(
  /repeating-linear-gradient\(transparent 0 " \+\s*\(rowSize - 1\)/.test(src),
  "the rules must be drawn at the row size, not a constant",
)

// Motion and a11y.
assert.ok(src.includes("motion-reduce:transition-none"), "honour prefers-reduced-motion")
assert.ok(/aria-label=\{stars \+ " out of 5"\}/.test(src), "stars need a text equivalent")
assert.ok(src.includes("<blockquote") && src.includes("<figcaption"), "quotes deserve semantics")

// A demo wrapper left at width:auto collapses inside 21st's centring flex.
for (const cls of readFileSync(
  new URL("../components/notebook-testimonials/demo.tsx", import.meta.url),
  "utf8",
).match(/className="[^"]*"/g) ?? []) {
  if (!/\brelative\b/.test(cls) && !/\bflex\b/.test(cls)) continue
  assert.ok(/\bw-(full|screen|\[|\d)/.test(cls), `${cls} wraps the cards without a width`)
}

console.log("notebook-testimonials: ok")
