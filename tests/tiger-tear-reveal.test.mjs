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
const { rng, smooth, easeOutBack, scrollProgress, stages, tearLine, pieceMotion, fibreWidths } = await import(
  "data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end)))
)

// ---- the page starts as a plain slogan: nothing torn, nothing moved -------------
{
  const s = stages(0)
  assert.deepEqual([s.crack, s.open, s.rise, s.pop, s.shake], [0, 0, 0, 0, 0], "nothing happens before the scroll")
  const m = pieceMotion(0)
  for (const side of ["top", "bottom"]) {
    assert.deepEqual([m[side].dx, m[side].dy, m[side].rot].map(Math.abs), [0, 0, 0], `${side} half is still at rest`)
  }
  assert.ok(fibreWidths(40, 0).every((w) => w === 0), "no exposed paper core before the tear")
}

// ---- and ends torn apart, tiger up, eyes open ------------------------------------
{
  const s = stages(1)
  assert.deepEqual([s.open, s.rise, s.pop, s.shake], [1, 1, 1, 0])
  const m = pieceMotion(1)
  assert.ok(m.top.dy < -40 && m.bottom.dy > 40, "the halves pull apart: top up, bottom down")
  assert.ok(m.top.rot * m.bottom.rot < 0, "and tip in opposite directions, like paper being ripped")
}

// ---- the beats come in order: crack, tear, rise, eyes -----------------------------
{
  const firstAt = (k) => { for (let p = 0; p <= 1; p += 0.001) if (stages(p)[k] > 0.01) return p; return 2 }
  const order = ["crack", "open", "rise", "pop"].map(firstAt)
  assert.deepEqual([...order].sort((a, b) => a - b), order, `beats out of order: ${order}`)
  for (const k of ["open", "rise", "pop"]) {
    let prev = -1
    for (let p = 0; p <= 1; p += 0.01) {
      const v = stages(p)[k]
      assert.ok(v >= prev - 1e-12, `${k} never reverses while scrolling forward`)
      prev = v
    }
  }
}

// ---- the tear crosses the whole sheet, left to right, through the word ------------
{
  const line = tearLine()
  for (let i = 1; i < line.length; i++) assert.ok(line[i][0] > line[i - 1][0], "x always increases")
  assert.ok(line[0][0] < 36 && line.at(-1)[0] > 964, "it runs off both sides of the frame")
  const mid = line.filter(([x]) => x > 60 && x < 940)
  assert.ok(mid.every(([, y]) => y > 227 && y < 404), "inside the frame it stays within the word's cap height")
  assert.deepEqual(tearLine(), line, "the same tear every visit")
}

// ---- deterministic helpers ---------------------------------------------------------
{
  const a = rng(5), b = rng(5)
  for (let i = 0; i < 10; i++) assert.equal(a(), b())
  assert.ok(fibreWidths(80, 1).every((w) => w > 0 && w < 12), "the paper core is a thin white band")
}
assert.equal(scrollProgress(0, 2000, 800), 0)
assert.equal(scrollProgress(-1200, 2000, 800), 1)
assert.equal(scrollProgress(-600, 2000, 800), 0.5)
assert.equal(scrollProgress(-5000, 2000, 800), 1, "clamped")
assert.equal(scrollProgress(0, 800, 800), 1, "no scroll range: treat as revealed")
assert.equal(smooth(0, 1, 0.5), 0.5)
assert.ok(Math.abs(easeOutBack(1) - 1) < 1e-9 && Math.abs(easeOutBack(0)) < 1e-9)
assert.ok(Math.max(...Array.from({ length: 101 }, (_, i) => easeOutBack(i / 100))) > 1, "the eyes overshoot, then settle")

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
assert.ok(/s\.open > 0 \?/.test(src), "the sheet is drawn whole until it tears, so no seam shows at rest")
for (const gone of ["cancelAnimationFrame(raf)", "io.disconnect()"]) assert.ok(src.includes(gone), `cleanup is missing ${gone}`)
assert.ok(/React\.useId\(\)/.test(src), "svg ids must be unique so two instances do not share masks")

for (const name of ["demo.tsx", "demo-revealed.tsx", "demo-custom.tsx"]) {
  const demo = readFileSync(new URL(`../components/tiger-tear-reveal/${name}`, import.meta.url), "utf8")
  assert.ok(/className="w-full"/.test(demo), `${name}: wrapper must be w-full`)
}

console.log("tiger-tear-reveal: ok")
