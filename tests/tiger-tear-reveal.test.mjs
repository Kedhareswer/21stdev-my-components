// Runnable check for the tear geometry in components/tiger-tear-reveal, plus
// the install-safety rules the .tsx has to keep.
// Run: node tests/tiger-tear-reveal.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const src = readFileSync(new URL("../components/tiger-tear-reveal/tiger-tear-reveal.tsx", import.meta.url), "utf8")
const start = src.indexOf("// #region tear")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "tear region markers missing")
const { rng, smooth, easeOutBack, scrollProgress, stages, profile, tearEdges, area } = await import(
  "data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end)))
)

// ---- the page starts as a plain slogan: no hole, no crack -------------------
{
  const s = stages(0)
  assert.deepEqual([s.crack, s.open, s.pop, s.shake], [0, 0, 0, 0], "nothing happens before the scroll")
  const e = tearEdges(0, 560, 124)
  assert.equal(area(e.top.concat([...e.bottom].reverse())), 0, "a closed tear has no area")
}

// ---- and ends fully torn with the eyes out ----------------------------------
{
  const s = stages(1)
  assert.equal(s.open, 1)
  assert.equal(s.pop, 1)
  assert.equal(s.shake, 0, "the jolt is over by the end")
}

// ---- the beats come in order: crack, then rip, then eyes --------------------
{
  const firstAt = (k) => { for (let p = 0; p <= 1; p += 0.001) if (stages(p)[k] > 0.01) return p; return 2 }
  assert.ok(firstAt("crack") < firstAt("open") && firstAt("open") < firstAt("pop"), "crack, open, pop")
  let prev = -1
  for (let p = 0; p <= 1; p += 0.01) {
    const o = stages(p).open
    assert.ok(o >= prev - 1e-12, "the tear never closes while scrolling forward")
    prev = o
  }
}

// ---- the hole only grows, and its edges never cross -------------------------
{
  let prev = -1
  for (const o of [0, 0.1, 0.3, 0.5, 0.8, 1]) {
    const e = tearEdges(o, 560, 124)
    for (let i = 0; i < e.top.length; i++) {
      assert.ok(e.top[i][1] <= 0 && e.bottom[i][1] >= 0, "top edge above the axis, bottom below")
      assert.ok(e.curlTop[i] >= 0 && e.curlTop[i] <= -e.top[i][1] * 0.42 + 1e-9, "a curl never rolls past the hole")
      assert.ok(e.curlBottom[i] >= 0 && e.curlBottom[i] <= e.bottom[i][1] * 0.42 + 1e-9)
    }
    const a = area(e.top.concat([...e.bottom].reverse()))
    assert.ok(a >= prev, `hole area must grow with open (${a} < ${prev} at ${o})`)
    prev = a
  }
  const e = tearEdges(1, 560, 124)
  assert.ok(Math.abs(e.top[0][1]) < 1e-9, "the tear is closed at its ends")
  assert.ok(Math.abs(e.bottom.at(-1)[1]) < 1e-9)
}

// ---- deterministic: same tear every visit -----------------------------------
assert.deepEqual(tearEdges(0.7, 560, 124), tearEdges(0.7, 560, 124))
{
  const a = rng(5), b = rng(5)
  for (let i = 0; i < 10; i++) assert.equal(a(), b())
}

// ---- small helpers -----------------------------------------------------------
assert.equal(scrollProgress(0, 2000, 800), 0)
assert.equal(scrollProgress(-1200, 2000, 800), 1)
assert.equal(scrollProgress(-600, 2000, 800), 0.5)
assert.equal(scrollProgress(-5000, 2000, 800), 1, "clamped")
assert.equal(scrollProgress(0, 800, 800), 1, "no scroll range: treat as revealed")
assert.equal(smooth(0, 1, 0.5), 0.5)
assert.ok(Math.abs(easeOutBack(1) - 1) < 1e-9 && Math.abs(easeOutBack(0)) < 1e-9)
assert.ok(Math.max(...Array.from({ length: 101 }, (_, i) => easeOutBack(i / 100))) > 1, "the eyes overshoot, then settle")
assert.ok(profile(0) === 0 && profile(1) < 1e-6 && profile(0.5) > 0.9)

// ---- install safety -----------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "the only import may be react")
assert.doesNotMatch(src, /@import|<img\b|fetch\(|new Image\(/, "nothing loads at runtime: the tiger is drawn")
assert.doesNotMatch(src, /innerWidth|innerHeight/, "size from the element, not the window")
assert.ok(/height = "100svh"/.test(src), "stage height defaults to a definite length")
const root = src.slice(src.indexOf("<section"), src.indexOf("<svg"))
assert.doesNotMatch(root, /\bh-(full|screen)\b/, "no percentage height on the root or stage")
assert.ok(/overflow: "clip"/.test(src), "root clips without becoming a scroll container, or sticky breaks")
assert.ok(/className="sticky top-0/.test(src), "the stage pins while the tear plays")
assert.ok(src.includes('maxWidth: "none"'), "Preflight's max-width must be overridden on the svg")
assert.ok(src.includes("prefers-reduced-motion") && /c\.reduced \?/.test(src), "reduced motion takes its own path")
assert.ok(src.includes("aria-label"), "the torn poster needs a text alternative")
for (const gone of ["cancelAnimationFrame(raf)", "io.disconnect()"]) assert.ok(src.includes(gone), `cleanup is missing ${gone}`)
assert.ok(/React\.useId\(\)/.test(src), "svg ids must be unique so two instances do not share masks")

for (const name of ["demo.tsx", "demo-revealed.tsx", "demo-custom.tsx"]) {
  const demo = readFileSync(new URL(`../components/tiger-tear-reveal/${name}`, import.meta.url), "utf8")
  assert.ok(/className="w-full"/.test(demo), `${name}: wrapper must be w-full`)
}

console.log("tiger-tear-reveal: ok")
