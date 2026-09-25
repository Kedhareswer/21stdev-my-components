// Runnable check for the loop timeline and framing in components/glint-portfolio-hero,
// plus the install-safety rules the .tsx has to keep.
// Run: node tests/glint-portfolio-hero.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const src = readFileSync(new URL("../components/glint-portfolio-hero/glint-portfolio-hero.tsx", import.meta.url), "utf8")
const start = src.indexOf("// #region timeline")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "timeline region markers missing")
const { glance, letterHop, layoutLetters, letterWidths, starPath, frameLayout, easeOutBack, BEATS, FACE } = await import(
  "data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end)))
)

// ---- the loop opens looking away, with nothing glinting ------------------------
{
  const g = glance(0)
  assert.equal(g.turn, 0, "starts looking away")
  assert.equal(g.spark, 0, "no glint before the turn")
}

// ---- beats in order: turn, then glint, then drift back -------------------------
{
  const first = (k, th = 0.01) => { for (let u = 0; u < 1; u += 0.001) if (glance(u)[k] > th) return u; return 2 }
  const turned = first("turn", 0.99)
  const glint = first("spark")
  assert.ok(first("turn") < glint, "the head starts turning before any glint")
  assert.ok(turned <= glint, `looking at the screen (${turned}) before the glint (${glint})`)
  for (let u = 0; u < 1; u += 0.002) {
    if (glance(u).spark > 0.01) assert.ok(glance(u).turn > 0.99, `glint at ${u.toFixed(3)} while not facing the screen`)
  }
  assert.ok(Math.max(...Array.from({ length: 400 }, (_, i) => glance(i / 400).spark)) > 1, "the glint overshoots, then settles")
  assert.ok(glance(0.9).turn < 1 && glance(0.99).turn < 0.01, "and the gaze drifts off again")
  assert.ok(BEATS.glintEnd < BEATS.backStart, "the glint is gone before they look away")
}

// ---- it loops without a seam ----------------------------------------------------
for (const k of ["turn", "spark", "flash", "blink"]) {
  assert.ok(Math.abs(glance(0)[k] - glance(0.99999)[k]) < 1e-3, `${k} jumps at the loop point`)
  assert.equal(glance(1.25)[k], glance(0.25)[k], `${k}: only the fraction of t counts`)
  assert.equal(glance(-0.75)[k], glance(0.25)[k], `${k}: negative time wraps too`)
}
assert.ok([0.12, 0.31, 0.64].every((u) => glance(u).blink > 0.99), "it blinks: away, mid-turn, after the glint")

// ---- the headline hops left to right with the glint ----------------------------
{
  const peak = (i) => { let best = 0, at = 0; for (let u = 0; u < 1; u += 0.001) { const h = letterHop(i, 9, u); if (h > best) { best = h; at = u } } return at }
  const peaks = Array.from({ length: 9 }, (_, i) => peak(i))
  assert.deepEqual([...peaks].sort((a, b) => a - b), peaks, "letters hop in order")
  assert.ok(peaks[0] >= BEATS.glintStart && peaks[8] <= BEATS.glintFadeStart, "during the glint")
}

// ---- letter layout fills the width, I stays narrow ------------------------------
{
  const ls = layoutLetters("PORTFOLIO", 104, 1110)
  assert.equal(ls.length, 9)
  assert.ok(Math.abs(ls.at(-1)[0] + ls.at(-1)[1] - 1110) < 1e-6 && ls[0][0] === 104, "spans exactly x0..x1")
  const w = letterWidths("PORTFOLIO")
  assert.ok(w[7] < w[0] && letterWidths("M")[0] > w[0], "I narrow, M wide")
  assert.deepEqual(layoutLetters("", 0, 100), [], "empty title is fine")
}

// ---- the star: closed path through all four tips --------------------------------
{
  const d = starPath([[10, -40], [30, 20], [-10, 40], [-30, -20]], 4)
  assert.ok(d.startsWith("M10.0 -40.0") && d.endsWith("Z"))
  assert.equal((d.match(/Q/g) || []).length, 8, "two bowed legs per side")
}

// ---- framing: wide shows the whole letterbox, tall pushes in --------------------
{
  const wide = frameLayout(1.5)
  assert.equal(wide.portrait, false)
  assert.deepEqual(wide.toPanel([676, 72]), [676, 72], "wide framing is the artwork as drawn")
  const tall = frameLayout(0.46)
  assert.ok(tall.portrait && tall.zoom > 1 && tall.h > FACE[1], "phones get a taller, closer panel")
  const vAspect = (l) => l.view[2] / l.view[3]
  assert.ok(vAspect(tall) < vAspect(wide), "tall framing is taller")
  const [ex] = tall.toPanel([470, 162])
  const [gx] = tall.toPanel([676, 72])
  assert.ok(ex > 0 && ex < FACE[0] && gx > 0 && gx < FACE[0], "the eye and the glint point stay in shot")
}
assert.ok(Math.abs(easeOutBack(1) - 1) < 1e-9 && Math.abs(easeOutBack(0)) < 1e-9)

// ---- install safety -----------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "the only import may be react")
assert.doesNotMatch(src, /@import|<img\b|fetch\(|new Image\(|url\(["']?http/, "nothing loads at runtime: it is all drawn")
assert.doesNotMatch(src, /innerWidth|innerHeight/, "size from the element, not the window")
assert.ok(/height = "100svh"/.test(src), "height defaults to a definite length")
const root = src.slice(src.indexOf("return (\n    <div"), src.indexOf("<svg"))
assert.doesNotMatch(root, /\bh-(full|screen)\b/, "no percentage height class on the root")
assert.ok(/boxSizing: "border-box"/.test(src), "the frame padding must not add to the given height")
assert.ok(src.includes('maxWidth: "none"'), "Preflight's max-width must be overridden on the svg")
assert.ok(src.includes("prefers-reduced-motion") && /paused \|\| reduced/.test(src), "reduced motion holds a still pose")
assert.ok(src.includes("aria-label") && src.includes("onKeyDown"), "text alternative and a keyboard way to fire the glint")
for (const gone of ["cancelAnimationFrame(raf)", "io.disconnect()", "ro.disconnect()"]) assert.ok(src.includes(gone), `cleanup is missing ${gone}`)
assert.ok(/React\.useId\(\)/.test(src), "svg ids must be unique so two instances do not share clips")
assert.ok(/setPointerCapture/.test(src), "the sticker keeps the drag when the pointer outruns it")
assert.doesNotMatch(src, /(^|[\s{};])(\*|body|:root)\s*\{/m, "no global resets")

for (const name of ["demo.tsx", "demo-custom.tsx"]) {
  const demo = readFileSync(new URL(`../components/glint-portfolio-hero/${name}`, import.meta.url), "utf8")
  assert.ok(/className="w-full"/.test(demo), `${name}: wrapper must be w-full`)
  assert.ok(demo.includes('from "@/components/ui/glint-portfolio-hero"'), `${name}: import the installer's path`)
}

console.log("glint-portfolio-hero: ok")
