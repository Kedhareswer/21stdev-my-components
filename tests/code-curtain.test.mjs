// Runnable check for the cloth physics in components/code-curtain, plus the
// install-safety rules the .tsx has to keep.
// Run: node tests/code-curtain.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const src = readFileSync(
  new URL("../components/code-curtain/code-curtain.tsx", import.meta.url),
  "utf8",
)

const start = src.indexOf("// #region physics")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "physics region markers missing")
const js = src
  .slice(start, end)
  .replace(/^export type .*$/gm, "")
  .replace(/:\s*(Cloth|Hang|number)(?=[,)])/g, "")
const { buildCloth, step, relax, push, nearest, isHook, smoothstep } = await import(
  "data:text/javascript," + encodeURIComponent(js)
)

const run = (cl, n, tear = 0, wind = 0) => {
  for (let s = 0; s < n; s++) {
    step(cl, 0.2, 0.99, wind, s / 60)
    relax(cl, 5, tear)
  }
}
const finite = (cl) => cl.x.every(Number.isFinite) && cl.y.every(Number.isFinite)

// ---- a rod-hung sheet settles straight down, chains at their stretch limit --
{
  const cl = buildCloth(12, 12, 10, 10, "rod", 1.1)
  run(cl, 3000)
  assert.ok(finite(cl), "sheet went non-finite")
  for (let c = 0; c < 12; c++) assert.deepEqual([cl.x[c], cl.y[c]], [c * 10, 0], "rod points never move")
  const bottom = 11 * 12
  for (let c = 0; c < 12; c++) {
    assert.ok(Math.abs(cl.x[bottom + c] - c * 10) < 0.5, `column ${c} should hang plumb`)
    assert.ok(cl.y[bottom + c] > 110 && cl.y[bottom + c] < 11 * 11 * 1.03, `column ${c} length off: ${cl.y[bottom + c]}`)
  }
}

// ---- hung by its corners it drapes: the middle of the hem sags -------------
{
  const cl = buildCloth(21, 10, 10, 10, "corners", 1.1)
  run(cl, 3000)
  assert.ok(finite(cl))
  assert.ok(cl.y[10] > 10, `hem middle should sag, y=${cl.y[10]}`)
  assert.equal(cl.y[0], 0)
  assert.equal(cl.y[20], 0)
}

// ---- hooks ---------------------------------------------------------------
assert.deepEqual([0, 1, 4, 9].map((c) => isHook(c, 10, "loops")), [true, false, true, true])
assert.deepEqual([0, 5, 9].map((c) => isHook(c, 10, "corners")), [true, false, true])

// ---- tearing only happens when asked --------------------------------------
{
  const yank = (tear) => {
    const cl = buildCloth(10, 10, 10, 10, "rod", 1.1)
    const tip = 99
    cl.pin[tip] = 1
    cl.x[tip] = cl.px[tip] = 600
    cl.y[tip] = cl.py[tip] = 600
    run(cl, 200, tear)
    return cl.alive.reduce((s, v) => s + (v ? 0 : 1), 0)
  }
  assert.equal(yank(0), 0, "no tearing with tearAt 0")
  assert.ok(yank(4.5) > 0, "a hard yank should snap threads")
}

// ---- the pointer shoves points away, and the wind stays bounded -----------
{
  const cl = buildCloth(10, 10, 10, 10, "rod", 1.1)
  const i = 5 * 10 + 5
  const before = cl.x[i]
  push(cl, cl.x[i] - 5, cl.y[i], 70, 4, 0, 0)
  assert.ok(cl.x[i] > before, "a point right of the pointer moves right")
  assert.equal(nearest(cl, 51, 49, 20), i)
  assert.equal(nearest(cl, 1000, 1000, 20), -1)
  run(cl, 2000, 0, 1)
  assert.ok(finite(cl), "wind blew it up")
}
assert.equal(smoothstep(10, -4, 0) > 0.5, true)
assert.equal(smoothstep(10, -4, 20), 0)

// ---- install safety ------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "the only import may be react")
assert.doesNotMatch(src, /@import/, "no @import")
assert.doesNotMatch(src, /innerWidth|innerHeight/, "size from the element, not the window")
assert.doesNotMatch(src, /document\.addEventListener/, "listeners belong on the canvas, not the document")
assert.ok(src.includes("new ResizeObserver"), "a resized box must rehang the sheet")
assert.ok(src.includes("getBoundingClientRect"), "pointer coordinates are relative to the canvas")
assert.ok(/height = "100svh"/.test(src), "root height must default to a definite length")
const root = src.slice(src.indexOf("<section"), src.indexOf("style={{ height }}"))
assert.doesNotMatch(root, /\bh-(full|screen)\b/, "no percentage height on the root")
assert.ok(src.includes('maxWidth: "none"'), "Preflight's max-width must be overridden")
assert.ok(src.includes("prefers-reduced-motion"), "must read prefers-reduced-motion")
assert.ok(/mq\.matches \? 0 : k\.wind/.test(src), "reduced motion stills the wind")
assert.ok(/touchAction: "none"/.test(src), "dragging on touch must not scroll the page")
assert.ok(/onKeyDown/.test(src) && /tabIndex=\{0\}/.test(src), "rehang and gusts must be reachable by keyboard")
assert.ok(/Math\.min\(window\.devicePixelRatio \|\| 1, 2\)/.test(src), "DPR capped at 2")
for (const gone of ["cancelAnimationFrame(raf)", "observer.disconnect()", "io.disconnect()", 'removeEventListener("pointerdown"', 'removeEventListener("dblclick"']) {
  assert.ok(src.includes(gone), `cleanup is missing ${gone}`)
}

for (const f of ["demo.tsx", "demo-torn.tsx"]) {
  const demo = readFileSync(new URL("../components/code-curtain/" + f, import.meta.url), "utf8")
  assert.ok(/className="relative w-full/.test(demo), f + " wrapper must be w-full")
  assert.ok(demo.includes('from "@/components/ui/code-curtain"'), f + " imports the installed path")
}

console.log("code-curtain: ok")
