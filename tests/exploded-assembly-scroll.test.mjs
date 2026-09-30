// Runnable check for components/exploded-assembly-scroll: the scroll → assembly
// mapping, the isometric geometry, and the install-safety rules.
// Run: node tests/exploded-assembly-scroll.test.mjs
//
// What breaks silently here is timing and geometry: a stage whose last part
// never lands before the hold, a snap that fights the reader's direction, a
// cylinder whose far cap is drawn instead of the near one, or a viewBox that
// crops a part while it floats in the exploded view.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const read = (file) =>
  readFileSync(new URL("../components/exploded-assembly-scroll/" + file, import.meta.url), "utf8").replace(/\r\n/g, "\n")
const src = read("exploded-assembly-scroll.tsx")

const start = src.indexOf("// #region assembly")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "assembly region markers missing")
const A = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))

const near = (a, b, eps = 1e-9) => Math.abs(a - b) < eps

// ---- progress comes off the element and clamps --------------------------
{
  assert.equal(A.progressFrom(0, 4000, 800), 0)
  assert.equal(A.progressFrom(-3200, 4000, 800), 1)
  assert.equal(A.progressFrom(500, 4000, 800), 0, "before it arrives")
  assert.equal(A.progressFrom(-1e6, 4000, 800), 1, "after it leaves")
  assert.equal(A.progressFrom(-10, 600, 800), 0, "no travel, no progress — never a negative divide")
}

// ---- stages tile the scroll, each ends in a hold -------------------------
{
  const n = 4
  assert.equal(A.stageAt(0, n), -1, "nothing is being built before the intro ends")
  assert.equal(A.stageAt(A.INTRO, n), -1)
  assert.equal(A.stageAt(1, n), n - 1, "the outro holds the last stage")
  let prev = -1
  for (let p = 0; p <= 1; p += 0.001) {
    const s = A.stageAt(p, n)
    assert.ok(s >= prev && s - prev <= 1, "stages advance one at a time")
    prev = s
  }
  for (let k = 0; k < n; k++) {
    const h = A.holdAt(k, n)
    assert.equal(A.stageAt(h, n), k, `hold ${k} is inside its stage`)
    assert.ok(A.stageT(h, k, n) >= 1 - A.HOLD, `hold ${k} is past the build`)
    assert.equal(A.snapTarget(h, n, 1), null, "a hold is already settled")
    assert.equal(A.snapTarget(h, n, -1), null)
    assert.equal(A.rowState(k, k, A.stageT(h, k, n)), "held")
  }
  assert.equal(A.rowState(0, 2, 0.1), "done")
  assert.equal(A.rowState(3, 2, 0.1), "idle")
  assert.equal(A.rowState(2, 2, 0.1), "active")
}

// ---- every part is fully drawn and home by the time its stage holds -------
{
  for (const m of [1, 2, 3, 5]) {
    for (let j = 0; j < m; j++) {
      const z = A.partPhase(0, j, m)
      assert.deepEqual([z.draw, z.fly], [0, 0], "nothing before the stage starts")
      const done = A.partPhase(1 - A.HOLD, j, m)
      assert.ok(near(done.draw, 1) && near(done.fly, 1), `part ${j}/${m} lands before the hold`)
      let f0 = -1
      let d0 = -1
      for (let t = 0; t <= 1; t += 0.005) {
        const f = A.partPhase(t, j, m)
        assert.ok(f.fly >= f0 - 1e-12 && f.draw >= d0 - 1e-12, "scrolling forward never undoes a part")
        assert.ok(f.fly <= f.draw + 1e-9, "a part is traced before it moves")
        f0 = f.fly
        d0 = f.draw
      }
    }
    if (m > 1) {
      const t = 0.2
      assert.ok(A.partPhase(t, 0, m).u > A.partPhase(t, m - 1, m).u, "parts in a stage are staggered")
    }
  }
}

// ---- snap finishes a stage in the direction of travel ----------------------
{
  const n = 4
  const mid = A.INTRO + 1.3 * A.stageSpan(n) // early in stage 1
  assert.equal(A.snapTarget(mid, n, 1), A.holdAt(1, n), "scrolling down completes the stage")
  assert.equal(A.snapTarget(mid, n, -1), A.holdAt(0, n), "scrolling up backs out of it")
  const first = A.INTRO + 0.2 * A.stageSpan(n)
  assert.ok(A.snapTarget(first, n, -1) < A.INTRO, "backing out of the first stage returns to the empty drawing")
  assert.equal(A.snapTarget(0, n, 1), null, "no snapping before the panel pins")
  assert.equal(A.snapTarget(0.999, n, -1), null, "or after")
  assert.equal(A.snapTarget(0.5, 0, 1), null, "no stages, nothing to snap to")
}

// ---- follow eases, never overshoots, and settles exactly -------------------
{
  let cur = 0
  for (let i = 0; i < 400; i++) {
    const next = A.follow(cur, 1, 1 / 60, 0.09)
    assert.ok(next >= cur && next <= 1)
    cur = next
  }
  assert.equal(cur, 1, "snaps onto the target once close")
  assert.equal(A.follow(0.2, 0.8, 0.016, 0), 0.8, "no smoothing means 1:1")
  assert.ok(A.follow(0, 1, 1 / 30, 0.09) > A.follow(0, 1, 1 / 120, 0.09), "frame-rate independent: a longer frame moves further")
}

// ---- projection and primitives ---------------------------------------------
{
  assert.deepEqual(A.iso(0, 0, 0), [0, 0])
  assert.ok(near(A.iso(0, 0, 10)[1], -10), "+z is up the screen")
  assert.ok(A.iso(10, 0, 0)[0] > 0 && A.iso(0, 10, 0)[0] < 0, "+x goes right, +y goes left")
  const h = A.hull([[0, 0], [2, 0], [1, 1], [2, 2], [0, 2], [1, 0.5]])
  assert.equal(h.length, 4, "interior points drop out of the hull")

  const b = A.box(0, 0, 0, 10, 10, 10)
  assert.deepEqual(b.map((s) => s.tone), ["left", "right", "top"], "a box shows exactly its three near faces")
  const top = b[2].pts
  assert.ok(Math.max(...top.map((p) => p[1])) <= Math.min(...b[0].pts.map((p) => p[1])) + 1e-9 + 10, "the top sits above the sides")

  const c = A.cyl([0, 0, 0], "z", 50, 10, [25])
  assert.deepEqual(c.map((s) => s.tone), ["side", "line", "top"], "body, then seams, then the near cap")
  const cap = A.boundsOf(c[2].pts)
  assert.ok(near(cap.maxX - cap.minX, 2 * 10 * 1.2247, 0.05), "a horizontal circle is 1.2247 r wide either side")
  assert.ok(near((cap.minY + cap.maxY) / 2, -50, 0.05), "the visible cap is the top one")
  for (const axis of ["x", "y"]) {
    const s = A.cyl([0, 0, 0], axis, 30, 8)
    const capC = A.boundsOf(s[s.length - 1].pts)
    const far = A.iso(...(axis === "x" ? [30, 0, 0] : [0, 30, 0]))
    assert.ok(near((capC.minX + capC.maxX) / 2, far[0], 0.2), `the ${axis} cylinder shows its far (+${axis}) cap`)
  }

  const p = A.pipe([[0, 0, 0], [40, 0, 0], [40, 0, 30], [40, -20, 30]], 5)
  const knuckles = p.filter((s) => s.tone === "side" && s.pts.length === 24)
  assert.equal(knuckles.length, 2, "one knuckle per bend")
  for (const s of p) assert.doesNotMatch(s.d, /NaN|Infinity/)

  const d = A.dome([0, 0, 0], 20, 10)
  assert.ok(A.boundsOf(d[0].pts).minY < A.iso(0, 0, 10)[1] + 0.5, "a head rises to its crown")
}

// ---- colour mixing ------------------------------------------------------------
{
  assert.equal(A.mixHex("#000000", "#ffffff", 0.5), "#808080")
  assert.equal(A.mixHex("#ec5d1a", "#ffffff", 0), "#ec5d1a")
  assert.equal(A.mixHex("#EC5D1A", "#000000", 1), "#000000")
  assert.equal(A.mixHex("tomato", "#ffffff", 0.2), null, "named colours fall back to color-mix in CSS")
  assert.equal(A.mixHex("#abc", "#ffffff", 0.2), null)
}

// ---- the default skid ---------------------------------------------------------
{
  const parts = A.buildSkid()
  assert.equal(parts.length, 12, "twelve parts")
  const prepared = A.prepareParts(parts, 4)
  assert.equal(prepared.length, 12)
  for (let k = 0; k < 4; k++) {
    const own = prepared.filter((p) => p.step === k)
    assert.equal(own.length, 3, `stage ${k} has three parts`)
    assert.deepEqual(own.map((p) => p.j), [0, 1, 2])
    assert.ok(own.every((p) => p.m === 3))
  }
  assert.deepEqual(
    [...prepared].sort((a, b) => a.step - b.step || a.j - b.j).map((p) => p.no),
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    "items are numbered stage by stage, whatever order they are painted in",
  )
  for (const part of prepared) {
    assert.ok(part.shapes.length > 0 && part.label)
    for (const s of part.shapes) assert.doesNotMatch(s.d, /NaN|Infinity|undefined/, part.label)
  }

  const [x, y, w, h] = A.viewBoxFor(prepared)
  assert.ok([x, y, w, h].every(Number.isFinite) && w > 0 && h > 0)
  for (const part of prepared) {
    for (const s of part.shapes) {
      for (const [px, py] of s.pts) {
        for (const k of [0, 1]) {
          const qx = px + part.shift[0] * k
          const qy = py + part.shift[1] * k
          assert.ok(qx >= x && qx <= x + w && qy >= y && qy <= y + h, `${part.label} leaves the drawing ${k ? "exploded" : "assembled"}`)
        }
      }
    }
  }

  assert.equal(A.prepareParts([{ step: 9, label: "x", offset: [0, 0, 0], shapes: A.box(0, 0, 0, 1, 1, 1) }], 4).length, 0, "a part for a missing stage is dropped")
  assert.deepEqual(A.viewBoxFor([]), [-100, -100, 200, 200], "no parts, no NaN")
  assert.equal(A.assembled([]), 0)
  assert.equal(A.assembled([{ draw: 1, fly: 1 }, { draw: 0, fly: 0 }]), 0.5)
}

// ---- install safety -------------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "the only import may be react")
assert.doesNotMatch(src, /https?:\/\//, "no external origins")
for (const bad of [/<img/, /@font-face/, /\.png/, /\.jpe?g/, /\.webp/]) assert.doesNotMatch(src, bad, `drawn, not shipped (${bad})`)

const styleBlock = src.slice(src.indexOf("const styles = ["), src.indexOf('].join("\\n")'))
assert.ok(styleBlock.length > 500, "style block not found")
assert.doesNotMatch(styleBlock, /[`]|\$\{/, "no backticks or interpolation inside the CSS")
assert.doesNotMatch(styleBlock, /@import/, "no @import")
assert.ok(styleBlock.includes("prefers-reduced-motion"), "CSS motion must be opt-out")
for (const [, rule] of styleBlock.matchAll(/^\s*"([^"\\]*(?:\\.[^"\\]*)*)",?$/gm)) {
  const sel = rule.split("{")[0].trim()
  if (!sel || sel.startsWith("@") || sel === "}" || !rule.includes("{")) continue
  for (const s of sel.split(",")) assert.ok(s.trim().startsWith(".eas"), `selector escapes the component: ${s}`)
}

const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1")
assert.doesNotMatch(code, /scrollY|pageYOffset/, "measure from the element, not the document")
assert.ok(src.includes("getBoundingClientRect"), "progress comes from the element's rect")
assert.ok(/addEventListener\("scroll", schedule, \{ passive: true \}\)/.test(src), "scroll listener is passive")
for (const gone of ["cancelAnimationFrame(raf)", "window.clearTimeout(snapTimer)", 'removeEventListener("scroll"', 'removeEventListener("touchstart"', 'mq.removeEventListener("change"']) {
  assert.ok(src.includes(gone), `cleanup is missing ${gone}`)
}

// Height: a definite stage, the track's height is the scroll budget, sticky is not trapped.
assert.ok(/height = "100svh"/.test(src), "panel height defaults to a definite length")
assert.ok(src.includes('"calc(" + (1 + Math.max(1, n) * scrollPerStep) + " * " + height + ")"'), "track height derives from stage count")
assert.doesNotMatch(src, /\bh-(full|screen)\b/, "no percentage-height classes")
assert.ok(src.includes('className="sticky top-0 w-full p-3 sm:p-6" style={{ height }}'), "the stage is sticky at the height prop")
assert.ok(src.includes('overflow: "clip"') && !/overflow: "hidden"/.test(src), "the card clips without becoming a scroll container (that would break sticky)")
assert.ok(src.includes('maxWidth: "none"'), "svgs are guarded against Preflight's max-width")

// Reduced motion: no easing, no snapping, no smooth jumps.
assert.ok(src.includes("reduced || !smooth ? target"), "reduced motion follows scroll 1:1")
assert.ok(src.includes("if (snap && !reduced)"), "reduced motion never auto-scrolls")
assert.ok(src.includes('behavior: reduced ? "auto" : "smooth"'))
assert.ok(src.includes("if (touching) return"), "never snap under a finger")

// Accessibility.
assert.ok(src.includes('type="button"'))
assert.ok(src.includes('aria-live="polite"'), "the stage line announces progress")
assert.ok(src.includes('aria-current={active === k ? "step" : undefined}'))
assert.ok(src.includes('role="img"'), "the drawing is labelled")

// Default copy follows the reference: three capabilities, four stages.
const count = (name) => (src.slice(src.indexOf("const " + name), src.indexOf("]\n", src.indexOf("const " + name))).match(/title: "/g) ?? []).length
assert.equal(count("DEFAULT_FEATURES"), 3)
assert.equal(count("DEFAULT_STEPS"), 4)

// Demos import the installer path and keep a width inside 21st's centring flex.
for (const f of ["demo.tsx", "demo-graphite.tsx"]) {
  const demo = read(f)
  assert.ok(demo.includes('from "@/components/ui/exploded-assembly-scroll"'), `${f} imports the installer path`)
  for (const cls of demo.match(/className="[^"]*"/g) ?? []) assert.ok(/\bw-(full|screen|\[|\d)/.test(cls), `${f}: ${cls} has no width`)
}

console.log("exploded-assembly-scroll: ok")
