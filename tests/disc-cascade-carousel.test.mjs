// Install-safety, motion and label-art checks for components/disc-cascade-carousel.
// Run: node tests/disc-cascade-carousel.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const dir = new URL("../components/disc-cascade-carousel/", import.meta.url)
const src = readFileSync(new URL("disc-cascade-carousel.tsx", dir), "utf8")

// ---- install safety ------------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "the only import may be react")
assert.deepEqual(
  readdirSync(dir).sort(),
  ["README.md", "demo-photos.tsx", "demo.tsx", "disc-cascade-carousel.tsx"],
  "the folder ships the component, its demos and a README — nothing else",
)

assert.ok(src.includes('height = "100svh"'), "root height must default to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full anywhere: percentage heights collapse on an installed page")
assert.ok(/style=\{\s*\{\s*height,/.test(src), "the root takes its height from the prop")

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
const flat = css.replace(/"\s*\+\s*\n\s*"/g, "").replace(/\\"/g, "'")
let rules = 0
for (const m of flat.matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || /^(from|to|[\d%,]+)$/.test(sel) || sel.startsWith("const CSS")) continue
  rules++
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".dcc-")), "unscoped selector: " + sel)
}
assert.ok(rules > 40, "expected the scope check to see real rules, saw " + rules)
assert.match(flat, /\.dcc-idle>img\{[^}]*max-width:none/, "label photos override Preflight's max-width")
assert.match(flat, /\.dcc-idle>svg,\.dcc-hub\{[^}]*max-width:none/, "label svgs override Preflight's max-width")
assert.match(flat, /prefers-reduced-motion:reduce\)\{[^}]*\.dcc-idle\{animation:none/, "the idle spin honours reduced motion")
assert.match(src, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/, "the springs honour reduced motion")
// The disc has a real hole: the page shows through it.
assert.match(flat, /\.dcc-edge,\.dcc-disc\{[^}]*mask:radial-gradient\(circle closest-side,transparent 16\.6%/, "the hole is masked out")

// Only the semantic tokens in dev/styles.css survive installation.
const allowed = new Set(["--color-background", "--color-foreground", "--color-muted-foreground", "--color-border", "--color-primary"])
for (const [, v] of src.matchAll(/var\((--[a-z-]+)/g)) {
  if (v.startsWith("--dcc-") || v === "--i") continue
  assert.ok(allowed.has(v), "token not guaranteed in a host: " + v)
}

// ---- nothing fetched by the component ------------------------------------------
{
  const urls = [...src.matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0])
  assert.deepEqual(urls, [], "the component must not fetch anything itself: " + urls.join(", "))
  assert.ok(src.includes("items: DiscCascadeItem[]"), "items are required")
}

// SVG ids are per instance: two carousels on one page mustn't share gradients or arc paths.
assert.ok(src.includes('"dcc" + React.useId().replace(/[^a-zA-Z0-9]/g, "")'), "ids come from useId, sanitised for url(#…)")
assert.doesNotMatch(src, /id="[a-z]/, "no fixed SVG ids")

// ---- runtime hygiene ----------------------------------------------------------------
for (const gone of [
  "cancelAnimationFrame(E.raf)", "ro.disconnect()", "io.disconnect()",
  'el.removeEventListener("wheel", onWheel)', 'document.removeEventListener("visibilitychange", onVis)',
  'mq.removeEventListener("change", on)', 'document.removeEventListener("pointerdown", onDown)',
]) assert.ok(src.includes(gone), "cleanup is missing " + gone)
assert.ok(src.includes("{ passive: false }"), "the wheel listener can claim horizontal swipes")
assert.ok(src.includes("Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return"), "vertical wheel is left to the page")
assert.ok(src.includes("if (settled) {"), "the frame loop stops when the springs settle")
assert.ok(src.includes('e.pointerType === "mouse"'), "the lean follows a mouse, not a finger")
assert.ok(src.includes('closest("[data-dcc-ui]")'), "presses on the nav and controls never start a drag")
const playing = src.match(/const playing = ([^\n]+)/)
assert.ok(playing, "autoplay condition present")
assert.doesNotMatch(playing[1], /hover/i, "resting the pointer must not pause autoplay")
for (const r of ["!stopped", "!focused", "!dragging", "!menu", "visible"]) assert.ok(playing[1].includes(r), "autoplay pauses for " + r)
assert.ok((src.match(/setStopped\(true\)/g) ?? []).length >= 7, "every user input stops autoplay for good")
// Accessibility.
assert.ok(src.includes('aria-roledescription="carousel"') && src.includes('aria-roledescription="slide"'), "carousel roles")
assert.ok(src.includes('aria-live="polite"'), "film changes are announced")
assert.ok(src.includes('role="img"'), "generated labels are labelled")
assert.ok(src.includes("aria-expanded={menu}"), "the Index menu reports its state")

// ---- the lifted logic ---------------------------------------------------------------
const lift = async (name) => {
  const start = src.indexOf("// #region " + name)
  const end = src.indexOf("// #endregion", start)
  assert.ok(start > -1 && end > start, name + " region markers missing")
  return import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))
}
const L = await lift("motion")
const A = await lift("art")

assert.equal(L.wrapIndex(-1, 7), 6)
assert.equal(L.wrapIndex(3, 0), 0, "empty list")
assert.equal(L.indexAt(-0.6, 7, false), 0, "rubber-banding past the start is still the first film")
assert.equal(L.indexAt(-0.6, 7, true), 6, "looping wraps")
assert.equal(L.offsetOf(0, 6, 7, true), 1, "looping takes the short way round")
assert.equal(L.offsetOf(0, 6, 7, false), -6)
assert.ok(Math.abs(L.rubber(-0.9, 7) + 0.3) < 1e-12, "past the start moves at a third")
assert.equal(L.releaseTarget(3.4, 1000, 7, false), 6, "never more than three past, clamped to the end")
assert.equal(L.releaseTarget(3.4, 0, 7, false), 3)
assert.equal(L.targetFor(0, 6, 7, true), 7, "looping goes forward to wrap")

// Pose: the line climbs to the right and comes toward the viewer.
{
  const c = { spacing: 1, rise: 0.25, depth: 0.4, yaw: 22, fan: -10, roll: 110 }
  const at = L.poseOf(0, 0, c)
  assert.deepEqual([at.x, at.z, at.yaw, at.roll, at.opacity, at.hidden], [0, 0, 22, 0, 1, false], "the chosen disc sits at the origin")
  const next = L.poseOf(1, 1, c)
  assert.ok(next.x > 0 && next.y < 0 && next.z > 0, "the next disc is right, higher and nearer")
  assert.ok(next.zIndex > at.zIndex, "nearer discs stack on top")
  const prev = L.poseOf(-1, -1, c)
  assert.ok(prev.x < 0 && prev.y > 0 && prev.z < 0, "the previous disc is left, lower and further")
  assert.equal(L.poseOf(5, 5, c).z, L.poseOf(3, 3, c).z, "approaching discs stop short so perspective can't explode")
  assert.equal(L.poseOf(1, 1, c).roll, 110, "a disc rolls a step's worth per step")
  assert.ok(L.poseOf(-3, -3, c).opacity < 1 && L.poseOf(-4, -4, c).opacity === 0, "far discs fade out down the line")
  assert.ok(L.poseOf(3, 3, c).hidden && L.poseOf(-4.5, -4.5, c).hidden, "off-stage discs are hidden")
  const lag = L.poseOf(1, 0.6, c)
  assert.equal(lag.x, 1, "position follows the line")
  assert.ok(lag.yaw !== next.yaw && lag.z < next.z, "turn and depth trail behind: the swing")
}

// Springs: settle in about a second, the swing overshoots, long frames stay stable.
{
  const s = L.springOf(0.22, 0.9)
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
  assert.ok(run(s.slide).t < 1.4, "the slide settles")
  const swing = run(s.tilt)
  assert.ok(swing.t < 1.6 && swing.peak > 1.005, "the swing settles and overshoots a little")
  const [x] = L.springStep(0, 0, 1, s.omega, s.tilt, 0.5)
  assert.ok(Number.isFinite(x) && Math.abs(x) < 2, "sub-stepping keeps a long frame stable")
}

// Label art helpers.
{
  const a = A.rng(42), b = A.rng(42)
  const seqA = [a(), a(), a()], seqB = [b(), b(), b()]
  assert.deepEqual(seqA, seqB, "the PRNG is deterministic: the same label on server and client")
  assert.ok(seqA.every((v) => v >= 0 && v < 1), "the PRNG stays in [0, 1)")
  assert.notDeepEqual(seqA, [A.rng(43)(), 0, 0].slice(0, 3), "different seeds differ")

  assert.equal(A.inkFor("#141414"), "#ffffff", "white print on a dark label")
  assert.equal(A.inkFor("#f0c94c"), "#111111", "dark print on a light label")
  assert.equal(A.inkFor("#fff"), "#111111", "3-digit hex")
  assert.equal(A.inkFor("oklch(50% .1 20)"), "#ffffff", "unparseable falls back to white")

  assert.deepEqual(A.wrapLabel("Somewhere All the Same Night", 11), ["Somewhere", "All the", "Same Night"])
  assert.deepEqual(A.wrapLabel("  Supercalifragilistic  is   long ", 8), ["Supercalifragilistic", "is long"])
  assert.deepEqual(A.wrapLabel("", 8), [])

  assert.equal(A.fitSize(4, 200, 21), 21, "short titles cap at the max size")
  assert.ok(A.fitSize(40, 194, 21) < 9, "long titles shrink")
  assert.equal(A.fitSize(400, 194, 21), 6, "but never below legibility")
  assert.ok(Math.abs(A.textWidth(10, 20) - 112) < 1e-9, "set width is the condensed estimate")
}
assert.ok((src.match(/lengthAdjust="spacingAndGlyphs"/g) ?? []).length >= 2, "disc titles are pinned so a fallback font can't overflow the rim")

// ---- demos ---------------------------------------------------------------------------
for (const f of ["demo.tsx", "demo-photos.tsx"]) {
  const demo = readFileSync(new URL(f, dir), "utf8")
  assert.ok(demo.includes('from "@/components/ui/disc-cascade-carousel"'), f + " imports the installed path")
  assert.ok(demo.includes('className="w-full"'), f + " wrapper keeps full width")
  assert.doesNotMatch(demo, /from "\.\//, f + " imports nothing local: Studio renames demos")
}
{
  const demo = readFileSync(new URL("demo.tsx", dir), "utf8")
  assert.doesNotMatch(demo, /https?:\/\//, "the default demo loads nothing, so 21st can capture its cover")
}

const tsconfig = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")
assert.ok(tsconfig.includes('"@/components/ui/disc-cascade-carousel"'), "tsconfig paths line missing")

console.log("disc-cascade-carousel: ok")
