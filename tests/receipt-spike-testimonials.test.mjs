// Runnable check for components/receipt-spike-testimonials: the pile order,
// the seeded poses, the torn edges, and the install-safety rules.
// Run: node tests/receipt-spike-testimonials.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const read = (file) => readFileSync(new URL("../components/receipt-spike-testimonials/" + file, import.meta.url), "utf8").replace(/\r\n/g, "\n")
const src = read("receipt-spike-testimonials.tsx")

const start = src.indexOf("// #region spike")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "spike region markers missing")
const S = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))

// ---- the pile ---------------------------------------------------------------
{
  assert.deepEqual(S.rotate([0, 1, 2, 3], 1), [1, 2, 3, 0], "the top slip goes to the bottom")
  assert.deepEqual(S.rotate([0, 1, 2, 3], -1), [3, 0, 1, 2], "the bottom slip comes back on top")
  assert.deepEqual(S.rotate([5], 1), [5])
  assert.deepEqual(S.rotate([], -1), [])
  const o = [0, 1, 2, 3, 4]
  assert.deepEqual(S.rotate(S.rotate(o, 1), -1), o, "prev undoes next")
  let p = o
  for (let i = 0; i < o.length; i++) p = S.rotate(p, 1)
  assert.deepEqual(p, o, "a full lap comes back to the start")
  const fresh = [0, 1, 2]
  S.rotate(fresh, 1)
  assert.deepEqual(fresh, [0, 1, 2], "never mutates")
}

// ---- poses ------------------------------------------------------------------
{
  assert.deepEqual(S.slipPose("Lena", 0), S.slipPose("Lena", 0), "same slip, same angle")
  for (let i = 0; i < 20; i++) {
    const p = S.slipPose("seed", i)
    assert.ok(Math.abs(p.rot) >= 2 && Math.abs(p.rot) <= 11, "never dead straight, never wild")
    assert.equal(Math.sign(p.rot), i % 2 === 0 ? 1 : -1, "neighbours lean opposite ways")
    assert.ok(Math.abs(p.dx) <= 9 && p.dy >= 0 && p.dy <= 8)
  }
  assert.equal(S.clampRating(undefined), 5)
  assert.equal(S.clampRating(7), 5)
  assert.equal(S.clampRating(-2), 0)
  assert.equal(S.clampRating(3.6), 4)
  assert.equal(S.clampRating(NaN), 5)
}

// ---- edges and glyphs ---------------------------------------------------------
{
  const c = S.tornClip(34, 6)
  assert.ok(c.startsWith("polygon(0% 6px, "), "the top edge is torn too")
  assert.ok(c.includes("calc(100% - 6px)"))
  assert.equal(S.tornClip(33, 6), S.tornClip(34, 6), "an even tooth count, so both edges end on a valley")
  assert.equal(S.PIXEL_FONT["*"].length, 7, "the star is 7 rows")
  assert.equal(S.pixelRuns("*").cols, 7)
  assert.ok(S.VISIBLE >= 3)
}

// ---- install safety ------------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"])
assert.doesNotMatch(src.replaceAll("http://www.w3.org/2000/svg", ""), /https?:\/\//)

const styleBlock = src.slice(src.indexOf("const styles = ["), src.indexOf('].join("\\n")'))
assert.ok(styleBlock.length > 500)
assert.doesNotMatch(styleBlock, /[`]|\$\{/)
assert.doesNotMatch(styleBlock, /@import/)
assert.ok(styleBlock.includes("prefers-reduced-motion"))
for (const [, rule] of styleBlock.matchAll(/^\s*"([^"\\]*(?:\\.[^"\\]*)*)",?$/gm)) {
  const sel = rule.split("{")[0].trim()
  if (!sel || sel.startsWith("@") || sel === "}" || !rule.includes("{")) continue
  for (const s of sel.split(",")) assert.ok(s.trim().startsWith(".rs-"), "selector escapes the component: " + s)
}

assert.ok(/height = "100svh"/.test(src))
assert.doesNotMatch(src, /\bh-(full|screen)\b/)
assert.ok(src.includes('maxWidth: "none"'))
assert.ok(src.includes("window.clearInterval(t)"))
assert.ok(src.includes("paused"), "autoplay pauses")
assert.ok(src.includes('mq.removeEventListener("change"'))
assert.ok(src.includes('e.key === "ArrowRight"') && src.includes('e.key === "ArrowLeft"'))
assert.ok(src.includes('aria-roledescription="carousel"'))
assert.ok(src.includes("aria-hidden={depth === 0 ? undefined : true}"), "only the top slip is read")
assert.ok(src.includes('aria-live="polite"'))
assert.ok(src.includes("mask: radial-gradient"), "the slip is punched through")

for (const f of ["demo.tsx", "demo-night.tsx"]) {
  const demo = read(f)
  assert.ok(demo.includes('from "@/components/ui/receipt-spike-testimonials"'))
  for (const cls of demo.match(/className="[^"]*"/g) ?? []) assert.ok(/\bw-(full|screen|\[|\d)/.test(cls), f + ": " + cls)
}

console.log("receipt-spike-testimonials: ok")
