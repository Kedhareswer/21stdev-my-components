// Install-safety, map, camera and formatting checks for
// components/alto-coffee-template.
// Run: node tests/alto-coffee-template.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const slug = "alto-coffee-template"
const root = new URL("../", import.meta.url)
const dir = new URL("components/" + slug + "/", root)
const src = readFileSync(new URL(slug + ".tsx", dir), "utf8")
const pkg = JSON.parse(readFileSync(new URL("package.json", root), "utf8"))

// ---- install safety ------------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react", "gsap", "gsap/ScrollTrigger", "gsap/MorphSVGPlugin"], "only react and gsap")
assert.ok(pkg.dependencies?.gsap, "gsap must be declared in the root package.json")
assert.match(src, /gsap\.registerPlugin\(ScrollTrigger, MorphSVGPlugin\)/, "plugins are registered")
for (const f of readdirSync(dir))
  assert.ok(new RegExp("^(" + slug + "\\.tsx|demo(-[a-z0-9-]+)?\\.tsx|README\\.md)$").test(f), "unexpected file in the folder: " + f)

assert.ok(src.includes('height = "100svh"'), "stage height defaults to a definite length")
assert.ok(src.includes('"--h": height'), "the height prop feeds --h")
for (const stage of [".ac-hero-stage{position:sticky;top:0;height:var(--h)", ".ac-map-stage{position:sticky;top:0;height:var(--h)", ".ac-strip-stage{position:sticky;top:0;height:var(--h)"])
  assert.ok(src.includes(stage), "sticky stage takes its height from the prop: " + stage)
assert.doesNotMatch(src, /className=["'][^"']*\bh-full\b/, "no h-full")
assert.doesNotMatch(src, /pin:\s*true/, "no ScrollTrigger pinning (it rewrites React's DOM)")
assert.ok(src.includes("ctx.revert()"), "every trigger and tween is reverted on unmount")
assert.ok(src.includes("ctxRef.current.add("), "click-time tweens join the context, so unmount kills them")
assert.doesNotMatch(src, /@import/, "no @import")
assert.ok(src.includes('{fontHref && <link rel="stylesheet" href={fontHref} />}'), "fontHref null loads nothing")

// The scoped CSS string: prefixed selectors only, no bare resets, no template holes.
const css = src.match(/const CSS = `([\s\S]*?)`/)[1].replace(/\/\*[\s\S]*?\*\//g, "")
assert.doesNotMatch(css, /\$\{/, "no ${ in the CSS string")
for (const bad of [/(^|[},])\s*\*\s*\{/, /(^|[},])\s*body\s*\{/, /:root/, /(^|[},])\s*html\s*\{/])
  assert.doesNotMatch(css, bad, "no bare resets in the CSS: " + bad)
for (const rule of css.matchAll(/(?:^|[{}])\s*(?!@)([^{}\s][^{}]*)\{/g)) {
  const sel = rule[1].trim()
  if (!sel || /^(from|to|\d+%)/.test(sel)) continue
  for (const one of sel.split(/,(?![^(]*\))/)) {
    const s = one.trim()
    assert.ok(s.startsWith(".ac-") || s.startsWith(":where(.ac-root)") || s.startsWith(":where(.dark) .ac-root"), "unscoped selector: " + s)
  }
}
assert.ok(css.includes("prefers-reduced-motion"), "CSS honours reduced motion")
assert.ok(src.includes('mm.add("(prefers-reduced-motion: no-preference)"'), "GSAP choreography only runs with motion allowed")
assert.ok(src.includes("mm.add(REDUCE"), "reduced motion still gets a working, still map")
assert.ok(css.includes("@container"), "layout answers the component's width, not the window")
assert.ok(css.includes(".ac-page{position:relative;container-type:inline-size}"), "the container is the page, so the fly-to-bag dot stays viewport-fixed")
assert.ok(src.indexOf('className="ac-fly"') > src.indexOf("</footer>"), "the fixed dot lives outside .ac-page")
assert.ok(css.includes(":where(.dark) .ac-root:not(.ac-light) .ac-hero"), "dark mode follows a .dark ancestor")
assert.ok(css.includes(".ac-root.ac-dark .ac-hero"), "theme=\"dark\" forces the night hero")
// Reduced motion collapses every tall scroll section so nothing is left as empty scroll.
for (const s of [".ac-hero{height:var(--h)}", ".ac-origins{height:auto}", ".ac-strip{height:auto}"])
  assert.ok(css.slice(css.indexOf("@media (prefers-reduced-motion")).includes(s), "reduced motion collapses " + s)

// Preflight: drawn art and photos must not be clamped by img/svg max-width.
for (const cls of ["ac-stars,.ac-far,.ac-peak,.ac-field-art", "ac-cherries", "ac-pack-art", "ac-stick-art", "ac-cup", "ac-map-svg", "ac-photo", "ac-note-motif", "ac-step-icon", "ac-foot-mark"])
  assert.ok(new RegExp("\\." + cls.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\{[^}]*max-width:none").test(css), cls + " guards max-width")

// 21st's CLI tokenizer hangs on generics before the first JSX close tag.
const head = src.slice(0, src.indexOf("</"))
assert.doesNotMatch(head, /use(State|Ref|Memo|Callback)<|Partial<|Record<|Array<|Map<|React\.[A-Za-z]+<|\[K in /, "no generics before the JSX")

// Runtime hygiene.
for (const gone of ['crop.removeEventListener("pointermove", onMove)', 'card.removeEventListener("pointermove", onMove)', 'window.removeEventListener("resize", onResize)', "window.clearTimeout(addedTimer.current)", "for (const fn of cleanups) fn()"])
  assert.ok(src.includes(gone), "cleanup is missing " + gone)
for (const m of src.matchAll(/https:\/\/([a-z0-9.-]+)\//g)) assert.ok(["fonts.googleapis.com"].includes(m[1]), "unexpected host " + m[1])
assert.ok(src.includes('aria-selected={i === step}') && src.includes('role="tablist"'), "the map years are tabs")
assert.ok(src.includes('role="radiogroup"') && src.includes("aria-checked={i === blend}"), "blends are a radio group")
assert.ok(src.includes("aria-expanded={menu}"), "the burger exposes its state")
assert.ok(src.includes('aria-live="polite"'), "bag count, quantity and sign-up speak their changes")
// The step label follows the timeline's own clock: scrub keeps it moving after the last scroll event.
assert.ok(src.includes("onUpdate: () => syncStep()"), "map step is read from the timeline, not the scroll position")
assert.ok(src.includes('morphSVG: { shape: shapes[i].d, type: "rotational" }'), "the red country morphs between origins")
assert.ok(src.includes(".ac-hud\"), { color: \"#ffffff\""), "the altimeter turns light over the coffee rows")
// The canvas textures are optional: a locked-down canvas leaves a clear sky.
assert.ok(/try \{\s*setClouds\(/.test(src), "cloud painting is guarded")

// Every built-in country in the type has an outline and a label.
const typeNames = [...src.match(/export type AltoCountry = ([^\n]+)/)[1].matchAll(/"([a-z-]+)"/g)].map((m) => m[1])
for (const n of typeNames) assert.ok(new RegExp('\\n  "?' + n + '"?: \\{ label: "[^"]+", box: \\[').test(src), "outline missing for " + n)

// ---- the lifted logic ---------------------------------------------------------------
const region = (name) => {
  const start = src.indexOf("// #region " + name)
  const end = src.indexOf("// #endregion", start)
  assert.ok(start > -1 && end > start, name + " region markers missing")
  return src.slice(start, end)
}
const lift = (names, exports) =>
  import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(names.map(region).join("\n")) + "\nexport { " + exports + " }"))

{
  const M = await lift(["dots"], "decodeDots")
  const land = src.match(/const LAND = "([^"]+)"/)[1]
  const { d, count } = M.decodeDots(land, 1.5)
  assert.equal(count, 6836, "the 1.5° land grid holds every dot")
  assert.equal(d.split("M").length - 1, count, "one sub-path per dot")
  for (const m of d.matchAll(/M([\d.]+) ([\d.]+)h0/g)) {
    assert.ok(+m[1] > 0 && +m[1] < 1000 && +m[2] > 0 && +m[2] < 394.4, "dot inside the map")
  }
  // Colombia's centroid (≈ 74° W, 4° N) sits on land; mid-Atlantic does not.
  const has = (x, y) => [...d.matchAll(/M([\d.]+) ([\d.]+)h0/g)].some((m) => Math.abs(+m[1] - x) < 2.2 && Math.abs(+m[2] - y) < 2.2)
  assert.ok(has(((180 - 74) * 1000) / 360, ((84 - 4) * 1000) / 360), "land at Colombia")
  assert.ok(!has(((180 - 35) * 1000) / 360, ((84 - 10) * 1000) / 360), "sea in the Atlantic")
  const { count: none } = M.decodeDots("..", 1.5)
  assert.equal(none, 0, "empty rows decode to nothing")
}

{
  const C = await lift(["camera"], "cameraFor, toScreen")
  const box = [280, 200, 314, 245]
  const wide = C.cameraFor(box, 16 / 9, 260, 4.4)
  assert.ok(Math.abs(wide[2] / wide[3] - 16 / 9) < 1e-9, "the camera matches the stage aspect")
  assert.ok(wide[2] >= 260, "never tighter than minW")
  assert.ok(Math.abs(wide[0] + wide[2] / 2 - 297) < 1e-9 && Math.abs(wide[1] + wide[3] / 2 - 222.5) < 1e-9, "the box is centred")
  const tall = C.cameraFor(box, 0.5, 150, 3)
  assert.ok(tall[3] >= (box[3] - box[1]) * 3 - 1e-9, "a portrait stage still fits the box's height")
  const vb = [100, 50, 200, 100]
  assert.deepEqual(C.toScreen(200, 100, vb, 800, 400), [400, 200], "the viewBox centre lands at the stage centre")
  const [sx] = C.toScreen(100, 100, vb, 400, 400)
  assert.equal(sx, -200, "slice crops the sides of a too-wide viewBox")
}

{
  const F = await lift(["format"], "groupThousands, money, clampQty, isEmail")
  assert.equal(F.groupThousands(3760), "3,760")
  assert.equal(F.groupThousands(1234567), "1,234,567")
  assert.equal(F.groupThousands(999.6), "1,000")
  assert.equal(F.groupThousands(-1500), "-1,500")
  assert.equal(F.money(19, "$"), "$19")
  assert.equal(F.money(38.5, "€"), "€38.50")
  assert.equal(F.money(1200, "£"), "£1,200")
  assert.equal(F.clampQty(0), 1)
  assert.equal(F.clampQty(12), 9)
  assert.equal(F.clampQty(Number.NaN), 1)
  assert.ok(F.isEmail(" me@example.com "))
  assert.ok(!F.isEmail("nope") && !F.isEmail("a@b") && !F.isEmail("a b@c.de"))
}

{
  const N = await lift(["noise"], "noise2, fbm, rng")
  for (let i = 0; i < 200; i++) {
    const x = i * 0.37
    const y = i * 0.19
    const v = N.noise2(x, y, 6, 3)
    assert.ok(v >= 0 && v <= 1, "noise stays in 0–1")
    assert.ok(Math.abs(v - N.noise2(x + 6, y, 6, 3)) < 1e-9, "noise tiles along x, so the cloud bands loop seamlessly")
    const f = N.fbm(x, y, 6, 3, 5)
    assert.ok(f >= 0 && f <= 1, "fbm stays in 0–1")
  }
  const a = N.rng(26)
  const b = N.rng(26)
  for (let i = 0; i < 20; i++) assert.equal(a(), b(), "the scenes are seeded: same art every render")
}

// ---- demos -----------------------------------------------------------------------------
for (const f of readdirSync(dir).filter((f) => f.startsWith("demo"))) {
  const demo = readFileSync(new URL(f, dir), "utf8")
  const di = [...demo.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
  assert.deepEqual(di, ["@/components/ui/" + slug], f + " imports only the installed path")
  assert.ok(demo.includes('className="w-full"'), f + ": wrapper keeps full width")
}
const tsconfig = readFileSync(new URL("tsconfig.json", root), "utf8")
assert.ok(tsconfig.includes('"@/components/ui/' + slug + '"'), "tsconfig paths line missing")

console.log(slug + ": ok")
