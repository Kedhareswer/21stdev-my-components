// Runnable check for components/beam-wordmark-footer: the colour, fit, baseline
// and beam maths, plus the install-safety rules.
// Run: node tests/beam-wordmark-footer.test.mjs
//
// What breaks silently here: a two-letter wordmark that fits the width and
// stands 600px tall, a crop computed from the line box instead of the baseline
// (so one font shows descenders and another loses half its letters), a beam
// that snaps instead of easing at 144Hz, and a letter whose slice of the beam
// doesn't line up with the backdrop because it paints in its own frame.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const read = (file) =>
  readFileSync(new URL("../components/beam-wordmark-footer/" + file, import.meta.url), "utf8").replace(/\r\n/g, "\n")
const src = read("beam-wordmark-footer.tsx")

const start = src.indexOf("// #region beam")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "beam region markers missing")
const T = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))

// ---- colours -----------------------------------------------------------------
{
  assert.equal(T.hexToRgb("#3d6bff"), "61, 107, 255")
  assert.equal(T.hexToRgb("3D6BFF"), "61, 107, 255", "no hash, upper case")
  assert.equal(T.hexToRgb("#36f"), "51, 102, 255", "shorthand expands")
  assert.equal(T.hexToRgb(" #000000 "), "0, 0, 0")
  for (const bad of ["", "red", "#12345", "rgb(1,2,3)", undefined]) {
    assert.equal(T.hexToRgb(bad, "1, 2, 3"), "1, 2, 3", "unparseable " + bad + " falls back")
  }
}

// ---- the wordmark fits, and a short one doesn't tower ------------------------
{
  // "Zephyr" measured 300px wide at 100px: 960px of column → 320px type.
  assert.ok(Math.abs(T.fitSize(300, 960, 960 * 0.42) - 320) < 1e-9, "a long word fills the width")
  // "Io" measured 80px wide would want 1200px type; the cap holds it.
  assert.equal(T.fitSize(80, 960, 960 * 0.42), 960 * 0.42, "a short word is capped")
  assert.equal(T.fitSize(80, 960, 0), 1200, "no cap means no cap")
  for (const [m, t] of [[0, 960], [300, 0], [NaN, 960], [300, NaN], [-5, 960]]) {
    assert.equal(T.fitSize(m, t, 400), 0, "bad measure " + m + "/" + t + " is 0, not Infinity")
  }
}

// ---- the crop follows the font's baseline -----------------------------------
{
  // A font with ascent 92 / descent 24 at 100px overflows its 100px line box
  // by 16px, split evenly: the baseline sits at 92 - 8 = 84px.
  assert.ok(Math.abs(T.baselineAt(92, 24) - 0.84) < 1e-9)
  // Ascent 80 / descent 20 fills the box exactly: baseline at 80px.
  assert.ok(Math.abs(T.baselineAt(80, 20) - 0.8) < 1e-9)
  assert.equal(T.baselineAt(undefined, undefined), 0.8, "no metrics (old Safari) is a typical baseline")
  assert.equal(T.baselineAt(0, 20), 0.8)
  assert.ok(T.baselineAt(900, 0) <= 1.2, "absurd metrics are clamped")
  assert.ok(Math.abs(T.wordHeight(300, 0.8, 0.14) - 282) < 1e-9, "the box ends `cut` em under the baseline")
  assert.equal(T.wordHeight(300, 0.8, 0), 240, "cut 0 sits on the baseline")
  assert.ok(T.wordHeight(300, 0.8, -0.2) < 240, "a negative cut eats into the letters")
  assert.ok(Math.abs(T.wordHeight(300, 0.8, 9) - 360) < 1e-9, "cut is clamped")
  assert.equal(T.wordHeight(300, 0.8, NaN), 240, "a bad cut is 0")
  assert.equal(T.wordHeight(0, 0.8, 0.14), 0)
}

// ---- the beam ------------------------------------------------------------------
{
  assert.equal(T.beamTarget(0), 30)
  assert.equal(T.beamTarget(1), 82)
  assert.equal(T.beamTarget(0.5), 56)
  assert.equal(T.beamTarget(-3), 30, "a pointer left of the section is the left edge")
  assert.equal(T.beamTarget(7), 82)
  assert.equal(T.beamTarget(NaN), 56, "no pointer is the middle")
  let lo = Infinity
  let hi = -Infinity
  for (let t = 0; t < 600; t += 0.25) {
    const b = T.drift(t)
    lo = Math.min(lo, b)
    hi = Math.max(hi, b)
  }
  assert.ok(lo >= 58 - 9 - 1e-9 && hi <= 58 + 9 + 1e-9, "the sway stays within its amplitude")
  assert.ok(hi - lo > 10, "but really moves")
  assert.ok(Math.abs(T.drift(1) - T.drift(1.001)) < 0.01, "and moves slowly")

  // Easing is frame-rate independent: one 1/30s step equals two 1/60s steps.
  const one = T.approach(0, 100, 0.1, 1 / 30)
  const two = T.approach(T.approach(0, 100, 0.1, 1 / 60), 100, 0.1, 1 / 60)
  assert.ok(Math.abs(one - two) < 1e-9, "30Hz and 60Hz arrive at the same place")
  assert.ok(Math.abs(T.approach(0, 100, 0.1, 1 / 60) - 10) < 1e-9, "k is the share closed per 1/60s")
  assert.equal(T.approach(5, 100, 0.1, 0), 5, "no time, no move")
  assert.ok(T.approach(0, 100, 0.1, 5) < 100, "a long stall (tab in background) never overshoots or jumps")
  assert.equal(T.approach(0, 100, 1, 1 / 60), 100)
}

// ---- install safety ----------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "the only import may be react")

const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1")
assert.doesNotMatch(code, /@import/, "no @import — the host owns Tailwind and fonts")
assert.doesNotMatch(code, /["+]\s*(\*|body|:root|html)\s*{/, "no bare global resets")
assert.doesNotMatch(code, /[`]/, "no backticks — CSS is built by concatenation")
assert.doesNotMatch(code, /\$\{/, "no template interpolation")
assert.doesNotMatch(code, /url\(["']?https?:/, "nothing is fetched")
assert.doesNotMatch(code, /<img|new Image|fetch\(/, "no images or requests")
assert.doesNotMatch(code, /innerWidth|innerHeight|scrollY/, "size from the element, not the window")
assert.doesNotMatch(code, /\bh-(full|screen)\b|height:100%/, "no percentage heights on the root")
assert.doesNotMatch(code, /localStorage|sessionStorage/, "no storage")

// Every rule is scoped under the component's own prefix.
const css = src.slice(src.indexOf("const CSS ="), src.indexOf("const Arrow ="))
for (const m of css.matchAll(/"([^"]*)\{/g)) {
  const sel = m[1].replace(/^.*\}/, "")
  if (!sel || sel.startsWith("@")) continue
  for (const part of sel.split(",")) {
    assert.ok(/^(\.bwf|:where\(\.bwf\)|from|to|\d+%)/.test(part.trim()), "unscoped CSS rule: " + part)
  }
}
assert.ok(!/"\.bwf (a|button|ul|p)\{/.test(css), "element resets go through :where(.bwf)")
assert.ok(css.includes(":where(.bwf) a{"), "links are reset at zero specificity")

// Intrinsic height, sized by its own width.
assert.ok(css.includes("container-type:inline-size"), "the root is a size container")
assert.ok(/cqw/.test(css), "sizes scale with the component, not the viewport")
assert.ok(css.includes("@container (max-width: 760px)"), "stacks when narrow")
assert.ok(src.includes("wordHeight(size, base, cut)"), "the wordmark box is a pixel height from the font")
assert.ok(src.includes("fontBoundingBoxAscent"), "the baseline comes from the real font")
assert.ok(src.includes("document.fonts?.ready"), "re-fits once web fonts land")

// Preflight: svgs opt out of max-width, and both grids are border-box either way.
assert.ok(css.includes(".bwf svg{max-width:none"), "svgs opt out of max-width")
assert.equal((css.match(/box-sizing:border-box/g) || []).length, 2, "column grid and wordmark agree on box-sizing")

// Every letter paints in the section's frame, so the beam lines up.
assert.ok(css.includes("background-size:var(--bwf-rw) var(--bwf-rh)"), "letters paint a section-sized background")
assert.ok(css.includes("background-position:calc(var(--bwf-x) * -1) calc(var(--bwf-y) * -1)"), "shifted back by their offset")
assert.ok(src.includes("el.offsetLeft") && src.includes("el.offsetTop"), "offsets ignore the reveal translate")
const beamAngle = (css.match(/var\(--bwf-ang\)/g) || []).length
assert.ok(beamAngle >= 3, "backdrop and letters share one beam angle")

// Motion.
assert.ok(src.includes("prefers-reduced-motion"), "reads prefers-reduced-motion")
assert.ok(css.includes("@media (prefers-reduced-motion: reduce){"), "and stops the CSS transitions")
assert.ok(src.includes("const still = reduced || !animate"), "the beam holds still when asked")
assert.ok(src.includes("if (reduced) return"), "letters don't hop")
assert.ok(src.includes("new IntersectionObserver"), "work stops off screen")
assert.ok(src.includes('data-in={seen || reduced ? "true" : "false"}'), "reduced motion never waits for a reveal")

// Cleanup.
for (const gone of ["io.disconnect()", "ro.disconnect()", "cancelAnimationFrame(raf)", "cancelAnimationFrame(frame)", 'removeEventListener("change", onMq)', 'removeEventListener("pointermove", onMove)']) {
  assert.ok(src.includes(gone), "cleanup is missing " + gone)
}

// Accessibility.
assert.ok(src.includes('<p className="sr-only">{word}</p>'), "the wordmark exists as text")
assert.ok(src.includes('className="bwf-word-in" aria-hidden="true"'), "the letter spans are not read one by one")
assert.ok(src.includes("aria-label={s.label}"), "icon links are named")
assert.ok(src.includes("aria-label={col.title}"), "each column is a named nav")
assert.ok(css.includes(".bwf-soc:focus-visible"), "keyboard focus is visible on icons")
assert.ok(css.includes(".bwf-link:focus-visible"), "and on links")
assert.ok(src.includes('if (!href || href === "#") e.preventDefault()'), "'#' never rewrites the host's hash")

// Defaults match the reference: four socials, two columns of four.
const defaults = (name) => (src.match(new RegExp("const " + name + "[^=]*= \\[([\\s\\S]*?)\\n\\]")) ?? [, ""])[1]
assert.equal(defaults("DEFAULT_SOCIALS").match(/label:/g).length, 4)
assert.equal(defaults("DEFAULT_COLUMNS").match(/title:/g).length, 2)
assert.equal(defaults("DEFAULT_COLUMNS").match(/label:/g).length, 8)
for (const icon of ["x", "linkedin", "youtube", "instagram", "github", "dribbble"]) {
  assert.ok(new RegExp("\\n  " + icon + ": \\(").test(src), "built-in icon " + icon)
}

// A demo wrapper left at width:auto collapses inside 21st's centring flex.
for (const f of ["demo.tsx", "demo-ember.tsx"]) {
  const demo = read(f)
  assert.ok(demo.includes('from "@/components/ui/beam-wordmark-footer"'), f + " imports the installer path")
  for (const cls of demo.match(/className="[^"]*"/g) ?? []) assert.ok(/\bw-(full|screen|\[|\d)/.test(cls), f + ": " + cls + " has no width")
}

const tsconfig = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")
assert.ok(tsconfig.includes('"@/components/ui/beam-wordmark-footer": ["./components/beam-wordmark-footer/beam-wordmark-footer.tsx"]'), "tsconfig path missing")

console.log("beam-wordmark-footer: ok")
