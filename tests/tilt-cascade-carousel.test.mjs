// Install-safety and motion-logic checks for components/tilt-cascade-carousel.
// Run: node tests/tilt-cascade-carousel.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const dir = new URL("../components/tilt-cascade-carousel/", import.meta.url)
const src = readFileSync(new URL("tilt-cascade-carousel.tsx", dir), "utf8")

// ---- install safety ------------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "the only import may be react")
assert.deepEqual(
  readdirSync(dir).sort(),
  ["README.md", "demo-custom.tsx", "demo-original.tsx", "demo.tsx", "tilt-cascade-carousel.tsx"],
  "the folder ships the component, its demos and a README — nothing else",
)

assert.ok(src.includes('height = "100svh"'), "root height must default to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full anywhere: percentage heights collapse on an installed page")
assert.ok(/style=\{\{ height,/.test(src), "the root takes its height from the prop")

// Generic type arguments hang the 21st CLI tokenizer.
assert.doesNotMatch(src, /use(Ref|State|Memo|Callback)</, "no generic hook type arguments")
assert.doesNotMatch(src, /\b(Record|Array|MutableRefObject|RefObject)</, "no generic utility types")

// Fonts arrive by <link>, only when asked for.
assert.doesNotMatch(src, /@import/, "no @import")
assert.ok(src.includes("fontHref = null"), "no font loads by default")
assert.ok(src.includes("if (!fontHref) return"), "fontHref={null} must load nothing")

// The scoped CSS string: prefixed selectors only, no bare resets, no template holes.
const cssAt = src.indexOf("const CSS =")
const css = src.slice(cssAt, src.indexOf("\n\n", cssAt))
assert.doesNotMatch(css, /`|\$\{/, "no backticks or ${ in the CSS string")
for (const bad of [/"\*\s*\{/, /[{}"]\s*body\s*\{/, /:root/, /[{}"]\s*html\s*\{/])
  assert.doesNotMatch(css, bad, "no bare resets in the CSS: " + bad)
const flat = css.replace(/"\s*\+\s*\n\s*"/g, "")
let rules = 0
for (const m of flat.matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || /^(from|to|[\d%,]+)$/.test(sel) || sel.startsWith("const CSS")) continue
  rules++
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".tcc-")), "unscoped selector: " + sel)
}
assert.ok(rules > 30, "expected the scope check to see real rules, saw " + rules)
assert.match(flat, /\.tcc-frame>img,\.tcc-frame>svg\{[^}]*max-width:none/, "media override Preflight's max-width")
assert.match(flat, /prefers-reduced-motion:reduce/, "scene animations honour reduced motion")
assert.match(src, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/, "the springs honour reduced motion")
// Scene animations run only on the card in front.
for (const a of ["sway", "fall", "rise", "flap", "scroll", "pulse", "drift", "ring", "glide"]) {
  assert.ok(flat.includes(".tcc-slide[data-active] .tcc-a-" + a + "{animation:"), "only the front card animates: " + a)
  assert.ok(flat.includes("@keyframes tcc-" + a + "{"), "keyframes exist: " + a)
}

// Only the semantic tokens in dev/styles.css survive installation.
const allowed = new Set(["--color-background", "--color-foreground", "--color-muted-foreground", "--color-border", "--color-primary"])
for (const [, v] of src.matchAll(/var\((--[a-z-]+)/g)) {
  if (v.startsWith("--tcc-")) continue
  assert.ok(allowed.has(v), "token not guaranteed in a host: " + v)
}

// ---- nothing fetched --------------------------------------------------------------
// 21st's capture sandbox refuses off-origin requests. The component and the
// published demos draw their scenes; only demo-original (local) loads photos.
for (const f of ["tilt-cascade-carousel.tsx", "demo.tsx", "demo-custom.tsx"]) {
  const text = readFileSync(new URL(f, dir), "utf8")
  const urls = [...text.matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0])
  assert.deepEqual(urls, [], f + " must make no network requests: " + urls.join(", "))
}

// ---- runtime hygiene ----------------------------------------------------------------
for (const gone of [
  "cancelAnimationFrame(E.raf)", "ro.disconnect()", "io.disconnect()",
  'el.removeEventListener("wheel", onWheel)', 'document.removeEventListener("visibilitychange", onVis)',
  'mq.removeEventListener("change", on)',
]) assert.ok(src.includes(gone), "cleanup is missing " + gone)
assert.ok(src.includes("{ passive: false }"), "the wheel listener can claim horizontal swipes")
assert.ok(src.includes("Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return"), "vertical wheel is left to the page")
assert.ok(src.includes("if (settled) {"), "the frame loop stops when the springs settle")
// Autoplay must not pause just because the pointer rests on a full-bleed stage.
const playing = src.match(/const playing = ([^\n]+)/)
assert.ok(playing, "autoplay condition present")
assert.doesNotMatch(playing[1], /hover/i, "resting the pointer must not pause autoplay")
for (const r of ["!stopped", "!focused", "!dragging", "visible"]) assert.ok(playing[1].includes(r), "autoplay pauses for " + r)
assert.ok((src.match(/setStopped\(true\)/g) ?? []).length >= 6, "every user input stops autoplay for good")
// Accessibility.
assert.ok(src.includes('aria-roledescription="carousel"') && src.includes('aria-roledescription="slide"'), "carousel roles")
assert.ok(src.includes('aria-live="polite"'), "slide changes are announced")
assert.ok(src.includes('role="img"'), "the drawn scenes are labelled")

// ---- the lifted logic ---------------------------------------------------------------
const start = src.indexOf("// #region motion")
const end = src.indexOf("// #endregion", start)
assert.ok(start > -1 && end > start, "motion region markers missing")
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))

assert.equal(L.ARTS.length, 10, "ten built-in scenes")
for (const a of L.ARTS) assert.ok(src.includes('art === "' + a + '"') || a === "paddleboard", "scene is drawn: " + a)
assert.ok(src.includes('| "paddleboard"'), "the last scene is in the type")

assert.equal(L.wrapIndex(10, 10), 0)
assert.equal(L.wrapIndex(-1, 10), 9)
assert.equal(L.wrapIndex(3, 0), 0, "empty list")

assert.equal(L.indexAt(-0.6, 10, false), 0, "rubber-banding past the start is still slide 0, not the last")
assert.equal(L.indexAt(9.7, 10, false), 9)
assert.equal(L.indexAt(-0.6, 10, true), 9, "looping wraps")

assert.equal(L.offsetOf(5, 3, 10, false), 2)
assert.equal(L.offsetOf(0, 9, 10, true), 1, "looping takes the short way round")
assert.equal(L.offsetOf(9, 0, 10, true), -1)
assert.equal(L.offsetOf(0, 9, 10, false), -9, "without looping, distance is plain")

assert.equal(L.scaleAt(0, 0.6), 1, "front card is full size")
assert.equal(L.scaleAt(1, 0.6), 0.6)
assert.equal(L.scaleAt(-4, 0.6), 0.6, "never smaller than inactiveScale")
assert.ok(Math.abs(L.scaleAt(0.5, 0.6) - 0.8) < 1e-12, "halfway is halfway")

assert.equal(L.rubber(4, 10), 4)
assert.ok(Math.abs(L.rubber(-0.9, 10) + 0.3) < 1e-12, "past the start moves at a third")
assert.ok(Math.abs(L.rubber(9.9, 10) - 9.3) < 1e-12, "past the end moves at a third")

assert.equal(L.releaseTarget(3.4, 0, 10, false), 3, "a slow release settles on the nearest")
assert.equal(L.releaseTarget(3.4, 10, 10, false), 5, "a flick carries on")
assert.equal(L.releaseTarget(3.4, 1000, 10, false), 6, "never more than three past")
assert.equal(L.releaseTarget(0.2, -20, 10, false), 0, "clamped without looping")
assert.equal(L.releaseTarget(0.2, -20, 10, true), -3, "free with looping")

assert.equal(L.targetFor(7, 3, 10, false), 7)
assert.equal(L.targetFor(12, 3, 10, false), 9, "clamped")
assert.equal(L.targetFor(0, 9, 10, true), 10, "looping goes forward to wrap, not back nine")
assert.equal(L.targetFor(9, 10, 10, true), 9)

// The springs: both settle within about a second, and the tilt has the bounce.
{
  const s = L.springOf(0.2, 0.8)
  assert.ok(s.tilt < s.slide, "the tilt is bouncier than the slide")
  const run = (zeta) => {
    let x = 0, v = 0, t = 0, peak = 0
    while (t < 3) {
      ;[x, v] = L.springStep(x, v, 1, s.omega, zeta, 1 / 60)
      t += 1 / 60
      peak = Math.max(peak, x)
      if (Math.abs(x - 1) < 1e-3 && Math.abs(v) < 1e-2) return { t, peak }
    }
    return { t: Infinity, peak }
  }
  const slide = run(s.slide)
  const tilt = run(s.tilt)
  assert.ok(slide.t < 1.2, "the slide settles in about a second, took " + slide.t.toFixed(2))
  assert.ok(tilt.t < 1.4, "the tilt settles in about a second, took " + tilt.t.toFixed(2))
  assert.ok(tilt.peak > 1.005, "the tilt overshoots a little: that's the swing")
  // A long frame must not blow the integrator up.
  const [x] = L.springStep(0, 0, 1, s.omega, s.tilt, 0.5)
  assert.ok(Number.isFinite(x) && Math.abs(x) < 2, "sub-stepping keeps a long frame stable")
  assert.equal(L.springOf(5, 0).tilt, 1 - 0.9, "bounce is clamped")
}

// ---- demos ---------------------------------------------------------------------------
for (const f of ["demo.tsx", "demo-custom.tsx", "demo-original.tsx"]) {
  const demo = readFileSync(new URL(f, dir), "utf8")
  assert.ok(demo.includes('from "@/components/ui/tilt-cascade-carousel"'), f + " imports the installed path")
  assert.ok(demo.includes('className="w-full"'), f + " wrapper keeps full width")
}

const tsconfig = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")
assert.ok(tsconfig.includes('"@/components/ui/tilt-cascade-carousel"'), "tsconfig paths line missing")

console.log("tilt-cascade-carousel: ok")
