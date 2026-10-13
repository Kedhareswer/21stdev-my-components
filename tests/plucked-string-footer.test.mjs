// Runnable check for components/plucked-string-footer: the string physics and
// the install-safety rules. Run: node tests/plucked-string-footer.test.mjs
//
// What breaks silently here: a string whose ends drift off the page, a pluck
// that never dies (so the RAF loop never sleeps), a strum that blows the line
// out of its box, and a wordmark that scales a short brand to 600px tall.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const read = (file) =>
  readFileSync(new URL("../components/plucked-string-footer/" + file, import.meta.url), "utf8").replace(/\r\n/g, "\n")
const src = read("plucked-string-footer.tsx")

const start = src.indexOf("// #region string")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "string region markers missing")
const T = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))

// ---- the resting line ----------------------------------------------------------
{
  const base = T.psfBase(T.PSF_N, 9, 40)
  assert.equal(base.length, T.PSF_N)
  assert.deepEqual(T.psfBase(T.PSF_N, 9, 40), base, "same seed, same line")
  const body = base.slice(0, Math.floor(T.PSF_N * 0.9))
  for (const b of body) assert.ok(Math.abs(b) < 8, "the body is a faint wobble, got " + b)
  assert.ok(base[T.PSF_N - 1] < -30, "the pen lifts at the end")
  assert.ok(base[T.PSF_N - 1] < base[T.PSF_N - 5], "and keeps rising to the tip")
}

// ---- a pluck rings, stays in bounds, keeps its ends, and dies -----------------
{
  const n = T.PSF_N
  const y = new Float32Array(n)
  const v = new Float32Array(n)
  T.psfPluck(v, 40, 30)
  assert.ok(v[40] > 0 && v[37] > 0 && v[43] > 0, "spread over neighbours")
  assert.equal(v[35], 0, "and only a few")
  let frames = 0
  let energy = Infinity
  let peak = 0
  while (energy >= 0.02 && frames < 5000) {
    energy = T.psfStep(y, v)
    frames++
    assert.equal(y[0], 0, "left end pinned")
    assert.equal(y[n - 1], 0, "right end pinned")
    for (const p of y) {
      assert.ok(Number.isFinite(p) && Math.abs(p) <= T.PSF_LIMIT, "string left its box: " + p)
      peak = Math.max(peak, Math.abs(p))
    }
  }
  assert.ok(peak > 3, "a pluck is visible, peak " + peak)
  assert.ok(frames > 60, "it rings for a while, not one frame (" + frames + ")")
  assert.ok(frames < 5000, "it goes still, so the loop can sleep")

  // a wild strum: kicks every frame at full force still stays bounded
  const y2 = new Float32Array(n)
  const v2 = new Float32Array(n)
  for (let f = 0; f < 300; f++) {
    T.psfPluck(v2, (f * 7) % n, f % 2 ? 30 : -30)
    T.psfStep(y2, v2)
  }
  for (const p of y2) assert.ok(Number.isFinite(p) && Math.abs(p) <= T.PSF_LIMIT)

  // plucking the ends, or with garbage, never moves them or throws
  const v3 = new Float32Array(n)
  T.psfPluck(v3, 0, 30)
  T.psfPluck(v3, n - 1, 30)
  T.psfPluck(v3, NaN, 30)
  T.psfPluck(v3, 50, NaN)
  assert.equal(v3[0], 0)
  assert.equal(v3[n - 1], 0)
  assert.ok(v3.every(Number.isFinite))
}

// ---- pointer speed to force -----------------------------------------------------
{
  assert.equal(T.psfForce(0, false), 0, "hovering still does nothing")
  assert.equal(T.psfForce(100, false), 30, "clamped")
  assert.equal(T.psfForce(-100, false), -30)
  assert.equal(T.psfForce(1, true), 8, "a slow crossing still plucks")
  assert.equal(T.psfForce(-1, true), -8, "in the direction of travel")
  assert.equal(T.psfForce(NaN, false), 0)
}

// ---- the path -------------------------------------------------------------------
{
  const base = T.psfBase(T.PSF_N, 9, 40)
  const d = T.psfPath(base, new Float32Array(T.PSF_N), 1000, 200)
  assert.match(d, /^M0\.0 [\d.-]+(L[\d.]+ [\d.-]+)+$/, "a polyline")
  assert.equal(d.match(/[ML]/g).length, T.PSF_N)
  assert.ok(d.includes("L1000.0 "), "runs to the right edge")
}

// ---- the wordmark fit --------------------------------------------------------------
{
  assert.ok(Math.abs(T.psfFit(400, 1200, 400) - 300) < 1e-9, "a long word fills the width")
  assert.equal(T.psfFit(100, 1200, 360), 360, "a short word is capped")
  assert.equal(T.psfFit(0, 1200, 360), 0, "nothing measured, no size")
  assert.equal(T.psfFit(400, 0, 360), 0)
  assert.equal(T.psfFit(NaN, 1200, 360), 0)
}

// ---- descenders and the pen lift --------------------------------------------------
{
  // Helvetica-ish metrics at 100px: ascent 77, descent 23. Set at line-height .78
  // the baseline sits 66px down a 78px line box.
  assert.equal(T.psfOverhang(77, 23, 0, 0.78, 300), 0, "no descenders, no overhang")
  const y = T.psfOverhang(77, 23, 21, 0.78, 300)
  assert.ok(Math.abs(y - ((-11 + 77 + 21 - 78) / 100) * 300) < 1e-9, "a y hangs 0.09em below the box, got " + y)
  assert.ok(T.psfOverhang(77, 23, 21, 0.78, 600) > y, "and scales with the size")
  assert.equal(T.psfOverhang(undefined, 23, 21, 0.78, 300), 0, "browsers without the metrics get no adjustment")
  assert.equal(T.psfOverhang(77, 23, 21, 0.78, 0), 0)
  assert.equal(T.psfLift(312), 40, "a big wordmark gets the full lift")
  assert.equal(T.psfLift(85), 17, "a phone-sized one a smaller one")
  assert.equal(T.psfLift(10), 12)
  assert.equal(T.psfLift(NaN), 12)
}

// ---- install safety ----------------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "the only import may be react")

assert.doesNotMatch(
  src.slice(0, src.indexOf("</")),
  /use(State|Ref|Memo|Callback)<|Partial<|Record<|Array<|React\.[A-Za-z]+<|\[[A-Za-z]+ in /,
  "no generics before the first JSX close tag (the 21st CLI tokenizer hangs on them)",
)

const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1")
assert.doesNotMatch(code, /@import/, "no @import — the host owns Tailwind and fonts")
assert.doesNotMatch(code, /["+]\s*(\*|body|:root|html)\s*{/, "no bare global resets")
assert.doesNotMatch(code, /[`]/, "no backticks — CSS is built by concatenation")
assert.doesNotMatch(code, /\$\{/, "no template interpolation")
assert.doesNotMatch(code, /https?:\/\/(?!www\.w3\.org)/, "nothing is fetched")
assert.doesNotMatch(code, /innerWidth|innerHeight|scrollY/, "size from the element, not the window")
assert.doesNotMatch(code, /\bh-(full|screen)\b/, "no percentage-height classes")
assert.doesNotMatch(code, /localStorage|sessionStorage/, "no storage")

// Every rule is scoped under the component's own prefix.
const css = src.slice(src.indexOf("const CSS ="), src.indexOf("/* ------------------------------------------------------------------ helpers"))
for (const m of css.matchAll(/"([^"]*)\{/g)) {
  const sel = m[1].replace(/^.*\}/, "")
  if (!sel || sel.startsWith("@")) continue
  assert.ok(/^\.psf/.test(sel.trim()), "unscoped CSS rule: " + sel)
}

// Height: a footer is intrinsic. The only percentage height is the trace svg,
// absolutely positioned inside the wordmark box, whose height comes from its text.
assert.deepEqual(css.match(/height:\d+%/g), ["height:100%"], "one percentage height, the overlay svg")
assert.ok(css.includes(".psf-word svg{position:absolute;left:0;top:0;width:100%;height:100%"))
assert.ok(/\.psf-word>span\{display:block;width:max-content;font-size:clamp\(/.test(css), "the wordmark box has a definite, text-driven height")
assert.ok(css.includes("container-type:inline-size"), "the root is a size container")
assert.ok(css.includes("@container (max-width: 600px)") && css.includes("@container (max-width: 960px)"), "stacks when narrow")
assert.ok(css.includes(".psf :where(svg){display:block;max-width:none}"), "Preflight max-width is undone")

// Theme.
assert.ok(src.includes('root.classList.contains("dark")'), "auto follows .dark on <html>")
assert.ok(css.includes('.psf[data-theme=dark]'), "dark palette")

// Motion.
assert.ok(src.includes("prefers-reduced-motion"), "reads prefers-reduced-motion")
assert.ok(css.includes("@media (prefers-reduced-motion: reduce){"))
assert.ok(src.includes("if (running || reduced || !visible) return"), "never animates when it may not")
assert.ok(src.includes("if (reduced) return"), "a pluck does nothing under reduced motion")
assert.ok(src.includes("new IntersectionObserver"), "sleeps off screen")
assert.ok(src.includes("if (energy < 0.02)"), "sleeps when still")

// Cleanup.
for (const gone of ["io.disconnect()", "ro.disconnect()", "mo.disconnect()", "cancelAnimationFrame(raf)", 'removeEventListener("pointermove", move)', 'removeEventListener("pointerleave", leave)', 'removeEventListener("pointerdown", down)', 'removeEventListener?.("change", onMq)']) {
  assert.ok(src.includes(gone), "cleanup is missing " + gone)
}

// Accessibility.
assert.ok(src.includes('role={interactive ? "button" : undefined}'), "the string is a button when it can move")
assert.ok(src.includes('aria-label={interactive ? "Pluck the string" : undefined}'))
assert.ok(src.includes('if (e.key !== "Enter" && e.key !== " ") return'), "Enter and Space pluck it")
assert.ok(src.includes('<nav className="psf-cols" aria-label="Footer"'))
assert.ok(src.includes('if (!href || href === "#") e.preventDefault()'), "# links leave the host hash alone")
assert.ok(src.includes("touch-action:pan-y"), "the page still scrolls over the string on touch")

// Defaults are generic, not the template's earthquake copy.
assert.doesNotMatch(src, /quake|seism|foreshock|survey|helicorder/i, "no earthquake copy left in the defaults")

// A demo wrapper left at width:auto collapses inside 21st's centring flex.
for (const f of ["demo.tsx", "demo-dark.tsx"]) {
  const demo = read(f)
  assert.deepEqual([...demo.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1]), ["@/components/ui/plucked-string-footer"], f + " imports the installer path only")
  for (const cls of demo.match(/className="[^"]*"/g) ?? []) assert.ok(/\bw-(full|screen|\[|\d)/.test(cls), f + ": " + cls + " has no width")
}

// tsc needs its own line per component.
const tsconfig = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")
assert.ok(tsconfig.includes('"@/components/ui/plucked-string-footer": ["./components/plucked-string-footer/plucked-string-footer.tsx"]'), "tsconfig path missing")

console.log("plucked-string-footer: ok")
