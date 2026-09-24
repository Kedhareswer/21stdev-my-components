// Runnable check for the rope physics in components/lanyard-badge, plus the
// install-safety rules the .tsx has to keep.
// Run: node tests/lanyard-badge.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const src = readFileSync(
  new URL("../components/lanyard-badge/lanyard-badge.tsx", import.meta.url),
  "utf8",
)

const start = src.indexOf("// #region physics")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "physics region markers missing")
const js = src
  .slice(start, end)
  .replace(/^export type .*$/gm, "")
  .replace(/:\s*(Pt\[\]|Link\[\]|Pt|Spin|number)(?=[,)])/g, "")
const { integrate, solve, spinStep, swingAngle } = await import(
  "data:text/javascript," + encodeURIComponent(js)
)

const pt = (x, y, w) => ({ x, y, px: x, py: y, w })

// ---- a rope with a heavy end settles hanging straight, at its own length ---
{
  const pts = [pt(0, 0, 0)]
  const links = []
  for (let i = 1; i <= 10; i++) {
    // start it sticking out sideways so it has to swing down
    pts.push(pt(i * 20, 0, i === 10 ? 0.25 : 1))
    links.push([i - 1, i, 20])
  }
  for (let s = 0; s < 6000; s++) {
    integrate(pts, 1 / 120, 2400, 0.992)
    solve(pts, links, 18)
  }
  const tip = pts[10]
  assert.ok(Number.isFinite(tip.x) && Number.isFinite(tip.y), "rope went non-finite")
  assert.ok(Math.abs(tip.x) < 2, `the tip should hang under the anchor, x=${tip.x}`)
  assert.ok(tip.y > 190, `the tip should hang ~200px down, y=${tip.y}`)
  for (const [i, j, r] of links) {
    const d = Math.hypot(pts[j].x - pts[i].x, pts[j].y - pts[i].y)
    assert.ok(Math.abs(d - r) / r < 0.02, `link ${i}-${j} stretched to ${d}`)
  }
  assert.deepEqual([pts[0].x, pts[0].y], [0, 0], "a pinned point never moves")
}

// ---- the card turns over and settles, without blowing up -----------------
{
  const s = { a: 0, v: 0 }
  for (let i = 0; i < 480; i++) spinStep(s, Math.PI, 1 / 120, 0)
  assert.ok(Math.abs(s.a - Math.PI) < 0.02, `flip should settle at pi, got ${s.a}`)
  // a violent flick still comes back to rest
  s.v = 80
  for (let i = 0; i < 1200; i++) spinStep(s, 0, 1 / 120, 0)
  assert.ok(Math.abs(s.a) < 0.02 && Math.abs(s.v) < 0.05, "a flick must unwind")
}

// ---- swing sign ----------------------------------------------------------
assert.equal(swingAngle(pt(0, 0), pt(0, 10)), 0)
assert.ok(swingAngle(pt(0, 0), pt(5, 10)) > 0, "a card swung right is positive")

// ---- install safety ------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "the only import may be react")
assert.doesNotMatch(src, /@import/, "no @import")
assert.doesNotMatch(src, /innerWidth|innerHeight/, "size from the element, not the window")
assert.ok(src.includes("new ResizeObserver"), "a resized box must rebuild the rope")
assert.ok(src.includes("getBoundingClientRect"), "pointer coordinates are relative to the root")
assert.ok(/height = "100svh"/.test(src), "root height must default to a definite length")
const root = src.slice(src.indexOf("<section"), src.indexOf("style={{ height }}"))
assert.doesNotMatch(root, /\bh-(full|screen)\b/, "no percentage height on the root")
assert.ok(src.includes('maxWidth: "none"'), "Preflight's max-width must be overridden")
assert.ok(src.includes("prefers-reduced-motion"), "must read prefers-reduced-motion")
assert.ok(/touchAction: "none"/.test(src), "dragging on touch must not scroll the page")
assert.ok(/onKeyDown/.test(src) && /tabIndex=\{0\}/.test(src), "the flip must be reachable by keyboard")
for (const gone of ["cancelAnimationFrame(raf)", "observer.disconnect()", 'removeEventListener("pointerdown"']) {
  assert.ok(src.includes(gone), `cleanup is missing ${gone}`)
}

const demo = readFileSync(new URL("../components/lanyard-badge/demo.tsx", import.meta.url), "utf8")
assert.ok(/className="relative w-full/.test(demo), "demo wrapper must be w-full")

console.log("lanyard-badge: ok")
