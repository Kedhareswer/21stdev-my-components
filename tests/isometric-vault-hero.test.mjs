// Install-safety and behaviour check for components/isometric-vault-hero.
// Run: node tests/isometric-vault-hero.test.mjs
//
// Two halves. The install surface — a style block that escapes the root, a
// height that collapses on an installed page, SVG ids two instances would
// fight over, a light mode sneaking in. And the scene maths: the pure helpers
// in the `// #region scene` block are lifted out and run for real.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const src = readFileSync(
  new URL("../components/isometric-vault-hero/isometric-vault-hero.tsx", import.meta.url),
  "utf8",
).replace(/\r\n/g, "\n")

const css = src.slice(src.indexOf("const CSS = `") + 13, src.indexOf("\n`\n", src.indexOf("const CSS = `")))
assert.ok(css.length > 2000, "could not extract the style block")

/* ---------- install safety ---------- */

assert.doesNotMatch(css, /@import/, "no @import in the inline style block")
assert.doesNotMatch(css, /[`]|\$\{/, "no backticks or template holes inside the CSS")
assert.doesNotMatch(src, /https?:\/\//, "no external origins — the capture sandbox blocks them")
for (const bad of [/<img/, /@font-face/, /\.png/, /\.jpe?g/, /\.webp/]) {
  assert.doesNotMatch(src, bad, `the machine is drawn, no asset may travel with it (${bad})`)
}
assert.doesNotMatch(src, /^import (?!\* as React from "react")/m, "React is the only import")

let depth = 0
for (const line of css.split("\n")) {
  if (/^@(media|container)/.test(line.trim())) { depth++; continue }
  if (line.trim() === "}" && depth) { depth--; continue }
  const m = line.match(/^\s*([^@{}/*][^{]*)\{/)
  if (!m) continue
  for (const sel of m[1].split(",")) {
    const s = sel.trim()
    if (!s || /^(from|to|\d+%)/.test(s)) continue
    assert.ok(s.startsWith(".ivh"), `selector escapes the component root: ${s}`)
  }
}
assert.doesNotMatch(css, /(^|[\s,}])(body|html|:root)\s*[{,]/, "no global resets")

assert.match(src, /height = "100svh"/, "height must default to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full anywhere")
const rootRule = css.match(/\.ivh\{([^}]*)\}/)
assert.ok(rootRule, "missing the .ivh root rule")
assert.doesNotMatch(rootRule[1], /(^|;)\s*height/, "the root must take its height from the prop")
assert.match(rootRule[1], /container:ivh \/ size/, "the root is the size container the layout queries")
assert.match(css, /\.ivh-svg\{[^}]*max-width:none/, "guard Preflight on the stage SVG")

// Dark only: it paints its own background and never reads the page theme.
assert.match(rootRule[1], /color-scheme:dark/, "declares itself dark")
assert.match(rootRule[1], /background:var\(--ivh-bg\)/, "paints its own background")
assert.doesNotMatch(src, /\bdark:/, "no dark: variants — there is no light mode to vary from")
assert.doesNotMatch(src, /prefers-color-scheme/, "does not follow the OS theme")
assert.doesNotMatch(src, /var\(--color-/, "does not borrow the host page's theme tokens")

assert.match(src, /React\.useId\(\)/, "ids must be namespaced per instance")
assert.doesNotMatch(src, /url\(#[a-z]/i, "every url(#...) must be built by id(), not hard-coded")
assert.doesNotMatch(src, /\bid="/, "no literal SVG ids")

assert.match(css, /prefers-reduced-motion: reduce/, "reduced motion must switch the CSS motion off")
assert.match(src, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/, "and the JS loop must honour it too")
assert.match(src, /if \(reduced\) return/, "no frame loop under reduced motion")

for (const ev of ["pointermove", "pointerleave", "pointerdown", "keydown"]) {
  assert.match(src, new RegExp('removeEventListener\\("' + ev + '"'), `${ev} listener must be removed`)
}
assert.match(src, /cancelAnimationFrame\(raf\)/, "the frame loop must be cancelled on unmount")
assert.match(src, /io\.disconnect\(\)/, "the visibility observer must be disconnected")
assert.match(src, /ro\.disconnect\(\)/, "the resize observer must be disconnected")
assert.match(src, /clearTimeout\(tm\)/, "the walkthrough timer must be cleared")

// Interactive, and reachable without a mouse.
assert.equal((src.match(/role: "slider"/g) || []).length, 1, "the plate's knobs are sliders")
assert.match(src, /"aria-valuenow"/, "sliders report their value")
assert.match(src, /e\.key === "ArrowRight"/, "sliders move from the keyboard")
assert.match(src, /setPointerCapture/, "a drag keeps tracking off the knob")
assert.match(src, /aria-label="Run a scan pulse"/, "the vault is a button")
assert.match(src, /aria-expanded=\{open === l\.label\}/, "dropdowns announce their state")
assert.match(src, /e\.key === "Escape"/, "Escape closes a dropdown")
assert.match(src, /aria-pressed=\{tour !== null\}/, "the walkthrough button is a toggle")

const ts = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")
assert.match(ts, /"@\/components\/ui\/isometric-vault-hero"/, "tsconfig paths needs the alias line")

/* ---------- the scene maths, run for real ---------- */

const start = src.indexOf("// #region scene")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "scene region markers missing")
const js = src
  .slice(start, end)
  .replace(/\): \[number, number\] \{/g, ") {")
  .replace(/:\s*(number|string|P3|Box|Verdict)(\[\])?(?=\s*[,)={;])/g, "")
const S = await import("data:text/javascript," + encodeURIComponent(js))

const near = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-9, `${msg}: ${a} vs ${b}`)

// Projection: +x runs down-right, +y down-left, +z straight up.
assert.deepEqual(S.iso(0, 0, 0), [0, 0])
const [ax, ay] = S.iso(100, 0, 0)
assert.ok(ax > 0 && ay > 0, "+x goes down-right")
const [bx, by] = S.iso(0, 100, 0)
assert.ok(bx < 0 && by > 0, "+y goes down-left")
assert.deepEqual(S.iso(0, 0, 50), [0, -50], "+z goes straight up")
near(ay / ax, Math.tan(Math.PI / 6), "true 30° isometric")

// The floor transform agrees with iso() to well under a pixel — the chips on a cube's lid depend on it.
const m = S.floorAt(10, 20, 30).match(/matrix\(([^)]+)\)/)[1].split(" ").map(Number)
const apply = (u, v) => [m[0] * u + m[2] * v + m[4], m[1] * u + m[3] * v + m[5]]
for (const [u, v] of [[0, 0], [40, 0], [0, 40], [17, 33]]) {
  const want = S.iso(10 + u, 20 + v, 30)
  const got = apply(u, v)
  assert.ok(Math.abs(got[0] - want[0]) < 0.05 && Math.abs(got[1] - want[1]) < 0.05, `floorAt(${u},${v})`)
}
const wx = S.wallX(96).match(/matrix\(([^)]+)\)/)[1].split(" ").map(Number)
const onX = [wx[0] * 20 + wx[4], wx[1] * 20 + wx[3] * -35 + wx[5]]
const wantX = S.iso(96, 20, 35)
assert.ok(Math.abs(onX[0] - wantX[0]) < 0.05 && Math.abs(onX[1] - wantX[1]) < 0.05, "wallX maps (y, -z)")
const wy = S.wallY(96).match(/matrix\(([^)]+)\)/)[1].split(" ").map(Number)
const onY = [wy[0] * 20 + wy[4], wy[1] * 20 + wy[3] * -35 + wy[5]]
const wantY = S.iso(20, 96, 35)
assert.ok(Math.abs(onY[0] - wantY[0]) < 0.05 && Math.abs(onY[1] - wantY[1]) < 0.05, "wallY maps (x, -z)")

const f = S.faces({ x0: 0, x1: 10, y0: 0, y1: 10, z0: 0, z1: 10 })
for (const k of ["top", "left", "right"]) assert.equal(f[k].split(" ").length, 4, `${k} is a quad`)

// Records: evenly spaced, upstream first, each crossing the centre exactly once.
const pos = 24 * S.SPACING + 60
const ks = S.visibleRecords(pos)
const xs = ks.map((k) => S.recordX(pos, k))
for (let i = 1; i < xs.length; i++) near(xs[i] - xs[i - 1], S.SPACING, "records are evenly spaced, back to front")
assert.ok(xs.every((x) => Math.abs(x) <= S.REACH), "only records within reach are drawn")
assert.ok(xs.length >= 8, "the belt is never empty")
near(S.recordX(7 * S.SPACING, 7), 0, "record k is at the centre when pos = k * SPACING")

assert.deepEqual(S.crossings(0, S.SPACING * 3), [1, 2, 3])
assert.deepEqual(S.crossings(10, 20), [], "no crossing, no count")
assert.deepEqual(S.crossings(S.SPACING - 1, S.SPACING), [1], "the boundary counts once")
// Frame by frame adds up to the same thing as one jump.
let p0 = 0, seen = []
for (let i = 0; i < 500; i++) { const p1 = p0 + 7.3; seen.push(...S.crossings(p0, p1)); p0 = p1 }
assert.deepEqual(seen, S.crossings(0, p0), "per-frame crossings neither skip nor double count")

// GUARD: zero quarantines nothing, full quarantines ~30%, and more guard never un-quarantines.
const N = 4000
const q = (s) => Array.from({ length: N }, (_, k) => S.verdict(k, s)).filter((v) => v === "quarantine").length
assert.equal(q(0), 0)
assert.ok(q(1) / N > 0.25 && q(1) / N < 0.35, `full guard quarantines about 30%: ${q(1) / N}`)
for (let k = 0; k < 500; k++) {
  if (S.verdict(k, 0.3) === "quarantine") assert.equal(S.verdict(k, 0.9), "quarantine", "guard is monotonic")
}
assert.equal(S.verdict(5, 7), S.verdict(5, 1), "strictness is clamped")

// Diversion stays on the belt until well clear of the vault's slot.
assert.equal(S.divert(S.VAULT + S.HALF), 0)
assert.equal(S.divert(400), 1)
assert.ok(S.divert(230) > 0 && S.divert(230) < 1)

// Slider <-> speed round-trips, and the ends are the documented range.
near(S.speedFromSlider(0), 0.25, "slow end")
near(S.speedFromSlider(1), 2.5, "fast end")
near(S.sliderFromSpeed(S.speedFromSlider(0.37)), 0.37, "round trip")
assert.ok(S.flowRate(2) > S.flowRate(1))

assert.ok(S.hash(1) >= 0 && S.hash(1) < 1 && S.hash(1) === S.hash(1), "hash is stable and in [0, 1)")

console.log("isometric-vault-hero: all checks passed")
