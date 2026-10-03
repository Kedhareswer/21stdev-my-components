// Install-safety and timeline checks for stardust-stage-preloader.
// Run: node tests/stardust-stage-preloader.test.mjs

import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const dir = new URL("../components/stardust-stage-preloader/", import.meta.url)
const src = readFileSync(new URL("stardust-stage-preloader.tsx", dir), "utf8")
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")
const gate = readFileSync(new URL("demo-gate.tsx", dir), "utf8")
const sepia = readFileSync(new URL("demo-sepia.tsx", dir), "utf8")

// ---- 1. Install safety -----------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import the component may have")
assert.doesNotMatch(src, /@import/, "no @import — fonts come from the host or the fallback stack")
assert.doesNotMatch(src, /https?:\/\//, "no external assets: every texture is painted on canvas")
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.doesNotMatch(src, /className=["'][^"']*\bh-full\b/, "no h-full")
assert.ok(src.includes("prefers-reduced-motion"), "honours reduced motion")
assert.ok(src.includes('role="progressbar"'), "reports progress to assistive tech")
assert.ok(src.includes("aria-valuenow={pct}"), "progressbar carries its value")
assert.ok(src.includes("onCompleteRef.current"), "calls onComplete through a ref")
assert.doesNotMatch(src, /\}, \[[^\]]*\bonComplete\b[^\]]*\]\)/, "effects must not depend on onComplete identity")
assert.doesNotMatch(src, /console\./, "no debug logging ships")
assert.doesNotMatch(src, /toBlob\(/, "textures are encoded synchronously")
assert.doesNotMatch(src, /useMemo\([^)]*paintAll/, "textures are painted in an effect, not during render")
assert.match(src, /cancelAnimationFrame\(raf\)/, "the frame loops are cancelled on unmount")

// ---- 2. Scoped CSS ---------------------------------------------------------
const cssMatch = src.match(/const SSP_CSS = `([\s\S]*?)`/)
assert.ok(cssMatch, "SSP_CSS block is present")
const css = cssMatch[1]
assert.doesNotMatch(css, /\$\{|`/, "no interpolation or backticks in the CSS string")
assert.doesNotMatch(css, /^\s*(\*|body|html|:root)\s*\{/m, "no bare global resets")
assert.match(css, /\.ssp-root svg, \.ssp-root canvas, \.ssp-root img \{[^}]*max-width: none/, "media overrides Preflight's max-width")

let rules = 0
for (const match of css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(?<=^|[{}])\s*([^{}]+?)\s*\{/g)) {
  const sel = match[1].trim()
  if (sel.startsWith("@") || /^(from|to|[\d.]+%)/.test(sel) || /^\d+%,/.test(sel)) continue
  rules++
  assert.ok(
    sel.split(",").every((s) => s.trim().startsWith(".ssp-")),
    `unscoped CSS selector would leak into the host app: ${sel}`,
  )
}
assert.ok(rules >= 60, `expected a full scoped sheet, saw ${rules} rules`)
assert.doesNotMatch(css, /\.ssp-root \*/, "nothing reaches into the children the gate guards")

for (const phase of ["load", "morph", "reveal", "lift"]) {
  assert.ok(css.includes(`[data-phase="${phase}"]`), `phase ${phase} is styled`)
}

const reduced = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"))
assert.match(reduced, /\.ssp-rays line/, "warp lines hold still under reduced motion")
assert.match(reduced, /\.ssp-rain \{ display: none; \}/, "no rain under reduced motion")
assert.match(reduced, /\.ssp-grain \{ animation: none; \}/, "grain holds still under reduced motion")
assert.match(src, /if \(still\) \{\s*x = e < 0\.5 \? ax : bx/, "dots cross-fade instead of flying under reduced motion")

// The stipple only reads when every dot lands on one device pixel, so
// textures are painted at the size they are shown, not scaled down.
assert.match(src, /paintAll\(colors, dense, sspSizes\(stRef\.current, q\)\)/, "textures are painted at display size")

// ---- 3. Timeline and geometry, executed ------------------------------------
const start = src.indexOf("// #region timeline")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "timeline region markers missing")
const js = src
  .slice(start, end)
  .replace(/st: \{[^}]*\},/, "st,")
  .replace(/:\s*(number|string)(?=[,)])/g, "")
const { sspSimulated, sspEase, sspMorph, sspRingLit, sspAct, sspStage, sspArchPoint, sspRng } = await import(
  "data:text/javascript," + encodeURIComponent(js)
)

assert.equal(sspSimulated(-1), 0)
assert.equal(sspSimulated(0), 0)
assert.equal(sspSimulated(1), 1)
assert.equal(sspSimulated(3), 1)
let prev = 0
for (let i = 1; i <= 400; i++) {
  const v = sspSimulated(i / 400)
  assert.ok(v >= prev - 1e-9, `simulated progress must never run backwards (t=${i / 400})`)
  assert.ok(v >= 0 && v <= 1, "simulated progress stays in range")
  prev = v
}
assert.ok(sspSimulated(0.31) - sspSimulated(0.21) < 0.05, "first stall is present")

assert.equal(sspEase(0), 0)
assert.equal(sspEase(1), 1)
assert.equal(sspEase(0.5), 0.5)
assert.equal(sspEase(2), 1, "ease clamps")

// every dot has landed by the end of the flight, whatever its delay
for (const delay of [0, 0.1, 0.25, 0.4]) {
  assert.equal(sspMorph(0, delay), 0)
  assert.equal(sspMorph(1, delay), 1, `a dot delayed ${delay} must land by m = 1`)
  assert.equal(sspMorph(delay, delay), 0, "and waits out its delay")
}

// the orbit fills clockwise from twelve
assert.equal(sspRingLit(0.5, 0.2), 0)
assert.equal(sspRingLit(0.1, 0.5), 1)
assert.equal(sspRingLit(0.999, 1), 1, "the whole orbit is lit at 100%")
assert.equal(sspRingLit(0.001, 0), 0, "and none of it at 0%")
assert.equal(sspRingLit(0.5, 1), 1)

assert.equal(sspAct(0, 4), 0)
assert.equal(sspAct(0.26, 4), 1)
assert.equal(sspAct(1, 4), 3, "last act holds at 100%")
assert.equal(sspAct(2, 4), 3)

for (const [w, h] of [[1440, 900], [390, 844], [1280, 720], [2560, 1080], [800, 800]]) {
  const st = sspStage(w, h)
  const where = `${w}×${h}`
  assert.ok(st.x0 >= 0 && st.x0 + st.W <= w + 0.01, `${where}: stage fits across`)
  assert.ok(st.y0 >= 0 && st.y0 + st.H <= h + 0.01, `${where}: stage fits down`)
  assert.ok(st.crown < st.moonY - st.moonR && st.moonY + st.moonR < st.spring, `${where}: moon hangs under the arch`)
  assert.ok(st.spring < st.floor, `${where}: columns stand on the floor`)
  assert.ok(st.left < st.cx && st.cx < st.right, `${where}: arch is centred`)

  const a = sspArchPoint(st, 0, 0)
  const top = sspArchPoint(st, 0.5, 0)
  const b = sspArchPoint(st, 1, 0)
  assert.deepEqual([a.x, a.y], [st.left, st.floor], `${where}: the arch starts at the foot of the left column`)
  assert.ok(Math.abs(top.x - st.cx) < 1e-6 && Math.abs(top.y - st.crown) < 1e-6, `${where}: halfway is the crown`)
  assert.ok(Math.abs(b.x - st.right) < 1e-6 && Math.abs(b.y - st.floor) < 1e-6, `${where}: and ends at the right foot`)
  for (let i = 0; i <= 50; i++) {
    const p = sspArchPoint(st, i / 50, st.W * 0.028)
    assert.ok(p.x >= st.left && p.x <= st.right && p.y >= st.crown && p.y <= st.floor, `${where}: inner moulding stays inside`)
  }
}

const r1 = sspRng(42)
const r2 = sspRng(42)
const seq = Array.from({ length: 50 }, () => r1())
assert.deepEqual(seq, Array.from({ length: 50 }, () => r2()), "the sky is the same on every mount")
assert.ok(seq.every((v) => v >= 0 && v < 1), "rng stays in [0, 1)")

// ---- 4. Demos ---------------------------------------------------------------
for (const [name, d] of [["demo", demo], ["demo-gate", gate], ["demo-sepia", sepia]]) {
  assert.ok(d.includes('from "@/components/ui/stardust-stage-preloader"'), `${name} imports the canonical path`)
}
assert.match(demo, /<StardustStagePreloader\s+loop[\s/>]/, "default demo is the looping component, full bleed")
assert.doesNotMatch(demo, /<div/, "default demo must not wrap the component")
assert.match(gate, /<StardustStagePreloader key=\{run\}/, "gate demo can replay itself")

console.log("stardust-stage-preloader: ok")
