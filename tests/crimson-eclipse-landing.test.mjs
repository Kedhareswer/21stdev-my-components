// Runnable check for the intro clock and canopy layout in
// components/crimson-eclipse-landing, plus the install-safety rules the .tsx
// has to keep.
// Run: node tests/crimson-eclipse-landing.test.mjs
//
// The canvas cannot be asserted here. What can — and what breaks silently — is
// the arithmetic around it: a counter that ticks backwards, a phase clock that
// never reaches "landing" (the gate stays up forever over a finished page), a
// seed that grows different trees on every mount, or a density field that puts
// leaves over the eclipse or under the water.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const read = (file) =>
  readFileSync(new URL(`../components/crimson-eclipse-landing/${file}`, import.meta.url), "utf8")
const src = read("crimson-eclipse-landing.tsx")

const start = src.indexOf("// #region intro")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "intro region markers missing")

const js = src
  .slice(start, end)
  .replace(/:\s*(number|IntroPhase)\b/g, "")
const { clamp01, smoothstep, easeInOutCubic, easeOutCubic, introProgress, afterLoad, mulberry32, foliageDensity, IGNITE_MS, REVEAL_MS } =
  await import("data:text/javascript," + encodeURIComponent(js))

const ECLIPSE_Y = Number(src.match(/const ECLIPSE_Y = ([\d.]+)/)[1])
const HORIZON = Number(src.match(/const HORIZON = ([\d.]+)/)[1])

// ---- the counter ----------------------------------------------------------
{
  assert.equal(introProgress(0), 0, "starts at 0")
  assert.ok(Math.abs(introProgress(1) - 100) < 1e-9, "ends at exactly 100, or the gate never ignites")
  assert.equal(introProgress(-1), 0, "clamps below")
  assert.ok(Math.abs(introProgress(5) - 100) < 1e-9, "clamps above")
  assert.equal(introProgress(NaN), 0, "NaN is not a percentage")
  let prev = -1
  for (let t = 0; t <= 1.0001; t += 0.001) {
    const p = introProgress(t)
    assert.ok(p >= prev - 1e-9, `counter ran backwards at t=${t.toFixed(3)}`)
    assert.ok(p >= 0 && p <= 100 + 1e-9, `counter left [0,100] at t=${t}`)
    prev = p
  }
  // the stall is the character of the thing — a straight line reads as fake
  const inStall = introProgress(0.56)
  assert.ok(inStall > 60 && inStall < 69, "hangs in the 60s band mid-load")
}

// ---- the phase clock ------------------------------------------------------
{
  assert.equal(afterLoad(-1), "load")
  assert.equal(afterLoad(NaN), "load", "a NaN clock stays on the loader")
  assert.equal(afterLoad(0), "ignite")
  assert.equal(afterLoad(IGNITE_MS - 1), "ignite")
  assert.equal(afterLoad(IGNITE_MS), "reveal")
  assert.equal(afterLoad(IGNITE_MS + REVEAL_MS - 1), "reveal")
  assert.equal(afterLoad(IGNITE_MS + REVEAL_MS), "landing")
  assert.equal(afterLoad(1e9), "landing", "and stays there")
  // the CSS ring travel runs .25s + .9s; the iris must not open before it lands
  assert.ok(IGNITE_MS >= 1100, "ignite outlasts the ring's CSS travel")
}

// ---- easing and clamps ----------------------------------------------------
{
  assert.equal(clamp01(NaN), 0)
  assert.equal(clamp01(-0), 0)
  assert.equal(clamp01(3), 1)
  assert.equal(smoothstep(0.5, 0.5, 0.4), 0, "equal edges must not divide by zero")
  assert.equal(smoothstep(0.5, 0.5, 0.6), 1)
  for (const f of [easeInOutCubic, easeOutCubic]) {
    assert.equal(f(0), 0)
    assert.equal(f(1), 1)
    assert.equal(f(2), 1, "clamped, or the iris overshoots the screen")
    let prev = -1
    for (let x = 0; x <= 1.0001; x += 0.01) {
      assert.ok(f(x) >= prev - 1e-12, "easing must be monotonic")
      prev = f(x)
    }
  }
}

// ---- the seed -------------------------------------------------------------
{
  const a = mulberry32(11)
  const b = mulberry32(11)
  const c = mulberry32(12)
  const seqA = Array.from({ length: 64 }, a)
  assert.deepEqual(seqA, Array.from({ length: 64 }, b), "same seed, same trees")
  assert.notDeepEqual(seqA, Array.from({ length: 64 }, c), "a different seed grows different trees")
  for (const x of seqA) assert.ok(x >= 0 && x < 1, `rand out of [0,1): ${x}`)
}

// ---- where the canopy grows ------------------------------------------------
{
  for (const aspect of [1.6, 2.4, 1, 0.46]) {
    const d = (u, v) => foliageDensity(u, v, ECLIPSE_Y, HORIZON, aspect)
    assert.equal(d(0.5, ECLIPSE_Y), 0, `leaves over the eclipse at aspect ${aspect}`)
    assert.equal(d(0.5, ECLIPSE_Y + 0.12), 0, `leaves over the title at aspect ${aspect}`)
    assert.equal(d(0.3, HORIZON + 0.05), 0, "nothing grows under the water")
    assert.equal(d(0.95, 0.99), 0, "not even at the edges")
    assert.ok(d(0.03, 0.2) > 0.5, `the sides are dense at aspect ${aspect}`)
    for (let u = -0.08; u <= 1.08; u += 0.037) {
      for (let v = -0.08; v <= HORIZON + 0.05; v += 0.041) {
        const x = d(u, v)
        assert.ok(x >= 0 && x <= 1, `density left [0,1] at ${u},${v}`)
        assert.ok(Math.abs(x - d(1 - u, v)) < 1e-12, `not mirror-symmetric at ${u},${v}`)
      }
    }
  }
  // a tall screen must open the pocket wider than a wide one
  assert.ok(
    foliageDensity(0.3, ECLIPSE_Y, ECLIPSE_Y, HORIZON, 0.46) < foliageDensity(0.3, ECLIPSE_Y, ECLIPSE_Y, HORIZON, 1.6),
    "the pocket widens on portrait",
  )
}

// ---- install safety ------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "the only import may be react")

const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1")
assert.doesNotMatch(code, /@import/, "no @import — the host owns Tailwind and fonts")

const cssStart = src.indexOf("const CEL_CSS = [")
const cssEnd = src.indexOf('].join("\\n")', cssStart)
assert.ok(cssStart > -1 && cssEnd > cssStart, "CSS block present")
const css = src.slice(cssStart, cssEnd)
assert.doesNotMatch(css, /[`]|\$\{/, "no backticks or interpolation in the CSS")
const rules = [...css.matchAll(/"([^"]*)"/g)].map((m) => m[1]).join("\n").replace(/\/\*[\s\S]*?\*\//g, "")
let selectors = 0
for (const match of rules.matchAll(/(?<=^|[{}\n])\s*([^{}\n]+?)\s*\{/g)) {
  const sel = match[1].trim()
  selectors++
  if (sel.startsWith("@") || /^(from|to|[\d.]+%)/.test(sel)) continue
  assert.ok(
    sel.split(",").every((x) => x.trim().startsWith(".cel-")),
    `unscoped CSS selector would leak into the host app: ${sel}`,
  )
}
assert.ok(selectors > 40, `selector scan found only ${selectors} rules — the parser is broken`)
assert.match(rules, /\.cel-canvas \{[^}]*max-width: none/, "the canvas overrides Preflight's max-width")

assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.doesNotMatch(src, /className=["'][^"']*\bh-(full|screen)\b/, "no h-full on anything")
assert.match(rules, /\.cel-root \{[^}]*width: 100%/, "the root claims its width inside 21st's flex wrapper")
assert.ok(src.includes("prefers-reduced-motion"), "honours reduced motion")
assert.ok(/if \(reduced\)/.test(src), "reduced motion takes its own draw path")
assert.ok(src.includes('role="progressbar"'), "the loader reports progress to assistive tech")
assert.ok(src.includes('aria-hidden="true" />') || src.includes('className="cel-canvas" aria-hidden="true"'), "the canvas is hidden from the tree")
assert.ok(/<h1[^>]*aria-label=\{title\}/.test(src), "the title is real text for anything that cannot see it")

// one rAF, two observers, three listeners per mount — a route change that
// leaks them keeps painting a canvas that is no longer on the page
for (const gone of [
  "cancelAnimationFrame(raf)",
  "observer.disconnect()",
  "io.disconnect()",
  'removeEventListener("pointermove"',
  'removeEventListener("pointerleave"',
  'removeEventListener("pointerdown"',
]) {
  assert.ok(src.includes(gone), `cleanup is missing ${gone}`)
}
assert.ok(src.includes("{ passive: true }"), "the pointermove listener is passive")

// the canopy is grown across frames; building it in one go froze the page
assert.ok(/function\* buildScene/.test(src), "the scene builds incrementally")
assert.ok(/intro\.shown >= 100 && scene/.test(src), "the gate never opens onto an unbuilt scene")

// no third-party hotlinks — every pixel is generated
assert.doesNotMatch(src, /https?:\/\//, "no external assets")

// ---- demos ----------------------------------------------------------------
for (const file of ["demo.tsx", "demo-custom.tsx"]) {
  const demo = read(file)
  assert.ok(demo.includes('from "@/components/ui/crimson-eclipse-landing"'), `${file} imports the installed path`)
  for (const cls of demo.match(/className="[^"]*"/g) ?? []) {
    assert.ok(/\bw-(full|screen|\[|\d)/.test(cls), `${file}: ${cls} wraps the component without a width`)
  }
}

console.log("crimson-eclipse-landing: ok")
