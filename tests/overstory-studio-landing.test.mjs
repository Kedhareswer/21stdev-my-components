// Install-safety and logic checks for components/overstory-studio-landing.
// Run: node tests/overstory-studio-landing.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const SLUG = "overstory-studio-landing"
const read = (file) => readFileSync(new URL(`../components/${SLUG}/${file}`, import.meta.url), "utf8").replace(/\r\n/g, "\n")
const src = read(`${SLUG}.tsx`)
const region = (name) => {
  const a = src.indexOf(`// #region ${name}\n`)
  const b = src.indexOf(`// #endregion ${name}\n`)
  assert.ok(a > -1 && b > a, `region ${name} missing`)
  return src.slice(a + `// #region ${name}\n`.length, b)
}

/* ---------- nothing travels with it ---------- */

const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react", "gsap", "gsap/ScrollTrigger"], "react and gsap are the only imports")
const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"))
assert.ok(pkg.dependencies.gsap, "gsap is declared at the root")
assert.match(read("README.md"), /requires `gsap`/i, "the README says it needs gsap")
assert.doesNotMatch(src, /@import|@font-face|<link\b|fetch\(|new Image\(|<img\b/, "nothing loads at runtime")
assert.doesNotMatch(src, /https?:\/\//, "no URLs, so it renders in the capture sandbox")
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.match(src, /"--ovs-h": height/, "the height prop reaches the root")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.doesNotMatch(src, /use(State|Ref|Memo|Callback|Context)<|Record<|Array<|Promise<|Partial</, "no <generics> for the 21st CLI tokenizer")
assert.doesNotMatch(src, /\\u[0-9a-f]{4}/i, "no \\u escapes: they print literally in JSX text")
assert.doesNotMatch(src, /[—–]/, "no em or en dashes")
assert.match(src, /React\.useId\(\)\.replace/, "svg ids are namespaced per instance")
assert.match(src, /if \(typeof window !== "undefined"\) gsap\.registerPlugin\(ScrollTrigger\)/, "the plugin registers only in the browser")
assert.match(src, /const useIso = typeof window !== "undefined" \? React\.useLayoutEffect : React\.useEffect/, "no layout-effect warning on the server")
assert.doesNotMatch(src, /\bc\.add\(/, "gsap context.add(fn) runs fn at once; teardown goes in the returned cleanup")
assert.match(src, /undo\.forEach\(\(f\) => f\(\)\)/, "listeners are removed when the media query reverts")
assert.doesNotMatch(src, /\bpin:\s*true/, "nothing is pinned; stages are CSS sticky")

const css = src.match(/const OVS_CSS = `([\s\S]*?)`/)
assert.ok(css, "CSS block present")
assert.doesNotMatch(css[1], /\$\{|`/, "no interpolation inside the CSS string")
assert.doesNotMatch(css[1], /url\(/, "no url() in the style block")
assert.ok(css[1].includes("prefers-reduced-motion:reduce"), "honours reduced motion in CSS")
for (const m of css[1].replace(/\/\*[\s\S]*?\*\//g, "").replace(/@media[^{]*\{/g, "").replace(/@keyframes[^{]*\{/g, "").matchAll(/(?<=^|[{}])\s*([^{}@]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (/^(from|to|[\d.,%\s]+)$/.test(sel)) continue
  for (const s of sel.split(/,(?![^(]*\))/)) assert.match(s.trim(), /^\.ovs-/, `selector escapes the component: ${s.trim()}`)
}
for (const m of css[1].matchAll(/([^{}]+)\{[^}]*(?<![-\w])height:100%/g))
  assert.match(m[1].trim(), /^(\.ovs-cv|\.ovs-work-track i|\.ovs-pic-chart \.ovs-svg)$/, `percentage height on ${m[1].trim()}`)
assert.match(css[1], /\.ovs-svg\{display:block;max-width:none/, "svgs are guarded against Preflight")
assert.match(css[1], /\.ovs-cv\{display:block;max-width:none/, "and so are the canvases")
assert.match(css[1], /\.ovs-root\{[^}]*overflow-x:clip/, "the root clips sideways without breaking sticky")
assert.doesNotMatch(css[1], /\.ovs-root\{[^}]*overflow:hidden/, "overflow:hidden on the root would break sticky")
assert.match(css[1], /\.ovs-nav\{position:sticky/, "the nav sticks")
assert.match(css[1], /\.ovs-stage\{position:sticky;top:0;height:var\(--ovs-h\)/, "the hero stage has a definite height")
assert.match(css[1], /\.ovs-fin-stage\{position:sticky;top:0;height:var\(--ovs-h\)/, "so does the finale")
assert.match(css[1], /\.ovs-hero\{position:relative;height:calc\(var\(--ovs-h\) \* 2\.3\)\}/, "the rise has room to scroll")
assert.match(css[1], /\.ovs-root\[data-still\] \.ovs-hero\{height:auto\}/, "and collapses under reduced motion")
assert.match(css[1], /\.ovs-root\[data-scheme="dark"\]\{/, "a designed dusk scheme")
assert.match(css[1], /\.ovs-window\{[^}]*clip-path:inset\(var\(--ovs-wi\) round var\(--ovs-wr\)\)/, "the finale window is two scroll-driven variables")

/* ---------- it behaves like a product page ---------- */

for (const k of ["top", "about", "services", "work", "process", "quotes", "pricing", "faq", "contact"]) assert.ok(src.includes(`data-sec="${k}"`), `section ${k} is addressable`)
assert.match(src, /scrollIntoView\(\{ behavior: reduced \? "auto" : "smooth", block: "start" \}\)/, "in-page links scroll, instantly under reduced motion")
assert.match(src, /ScrollTrigger\.addEventListener\("refreshInit", fit\)/, "the work track re-measures on every refresh")
assert.match(src, /containerAnimation: slide/, "mocks drift inside the horizontal track")
assert.match(src, /gust\.current\?\.\(/, "clicking the sky sends a gust")
assert.match(src, /closest\("a,button"\)/, "but not when a link or button was clicked")
assert.match(src, /if \(res === false\) ok = false/, "onSubscribe can refuse")
assert.match(src, /isEmail\(mail\)/, "the newsletter validates before sending")
assert.match(src, /aria-expanded=\{open\}/, "services and questions are disclosures")
assert.match(src, /aria-pressed=\{quarterly\}/, "the billing switch reports its state")
assert.match(src, /aria-modal="true"/, "the phone menu is a modal dialog")
assert.match(src, /e\.key === "Escape"/, "Escape closes it")
assert.match(src, /onAnimationEnd=\{\(\) => setQuote/, "quotes advance when the visible timer runs out")
assert.match(src, /<span className="ovs-sr">\{words\[0\]\} <\/span>/, "screen readers get one stable headline")
assert.match(src, /rootMargin: "900px 0px"/, "the finale canopy draws only when it gets near")
assert.match(src, /Math\.abs\(h - size\.h\) < 140/, "a phone toolbar does not regrow the forest")
assert.ok(read("demo.tsx").includes("<OverstoryStudioLanding />"), "default demo is the component, full bleed")
assert.doesNotMatch(read("demo.tsx"), /<div/, "default demo has no wrapper")
assert.match(read("demo-autumn.tsx"), /season="autumn"/, "the second demo grows another season")
const tsconfig = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")
assert.ok(tsconfig.includes(`"@/components/ui/${SLUG}": ["./components/${SLUG}/${SLUG}.tsx"]`), "tsc can see it")

/* ---------- logic, executed ---------- */

const code = region("logic") + "\nexport { SEASONS, SKIES, LAYERS, clamp, smoothstep, mulberry32, noise2, fbm, ellipse, distAt, reachAt, canopyPlan, leafColor, skyAt, formatNumber, planPrice, isEmail, manifestoParts, stepAt }\n"
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(code)))

// noise is bounded, smooth and deterministic
for (let i = 0; i < 300; i++) {
  const x = i * 0.173 - 11
  const y = i * 0.311 + 2
  const n = L.fbm(x, y)
  assert.ok(n >= 0 && n <= 1, "fbm in 0..1")
  assert.equal(n, L.fbm(x, y), "deterministic")
  assert.ok(Math.abs(L.noise2(x, y) - L.noise2(x + 0.001, y)) < 0.01, "continuous")
}
const r1 = L.mulberry32(5)
const r2 = L.mulberry32(5)
for (let i = 0; i < 50; i++) {
  const v = r1()
  assert.equal(v, r2(), "seeded random repeats")
  assert.ok(v >= 0 && v < 1)
}

// the canopy: deterministic, rings outward from far to near, a clear sky in the middle
for (const [w, h] of [[1612, 1008], [437, 945], [2150, 1210]]) {
  let lastReach = 0
  for (let layer = 0; layer < 4; layer++) {
    const a = L.canopyPlan(w, h, layer, 7)
    const b = L.canopyPlan(w, h, layer, 7)
    assert.equal(a.leaves.length, b.leaves.length, "same seed, same forest")
    assert.deepEqual(a.leaves.slice(0, 20), b.leaves.slice(0, 20))
    assert.ok(a.leaves.length > 300, `layer ${layer} has foliage at ${w}x${h}`)
    assert.ok(a.leaves.length < 12000, `layer ${layer} stays within budget at ${w}x${h}`)
    assert.ok(a.twigs.length >= L.LAYERS[layer].twigs, "every branch is kept")
    let inside = 0
    let sum = 0
    for (const f of a.leaves) {
      assert.ok(f.l >= 0 && f.l <= 1, "lightness in 0..1")
      assert.ok(f.s > 0, "leaves have size")
      const d = L.distAt(f.x, f.y, w, h)
      sum += d
      if (d < L.LAYERS[layer].reach * 0.62) inside++
    }
    assert.ok(inside / a.leaves.length < 0.02, `layer ${layer} keeps the sky clear`)
    const mean = sum / a.leaves.length
    assert.ok(mean > lastReach, "each nearer layer sits further out")
    lastReach = mean
  }
}
assert.notEqual(L.canopyPlan(1612, 1008, 2, 7).leaves[0].x, L.canopyPlan(1612, 1008, 2, 8).leaves[0].x, "a new seed grows a new ring")

// the centre is always sky, the corners always trees
assert.equal(L.distAt(500, 300, 1000, 600), 0)
assert.ok(L.distAt(0, 0, 1000, 600) > 1.2, "corners are outside the ring")
for (let t = 0; t < 6.3; t += 0.2) {
  const r = L.reachAt(t, 0, 7)
  assert.ok(r > 0.4 && r < 0.9, "the far ring is lobed but never closes or vanishes")
}

// colours: shadow is darker than sunlight, haze pulls toward the sky, dusk is darker
const pal = L.SEASONS.summer
const lum = (c) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
assert.ok(lum(L.leafColor(pal, 0, [0, 0, 0], 0, 1)) < lum(L.leafColor(pal, 1, [0, 0, 0], 0, 1)), "backlit leaves are brighter")
assert.deepEqual(L.leafColor(pal, 0.5, [200, 210, 220], 1, 1), [200, 210, 220], "full haze is the sky")
assert.ok(lum(L.leafColor(pal, 0.8, [0, 0, 0], 0, L.SKIES.dark.leaf)) < lum(L.leafColor(pal, 0.8, [0, 0, 0], 0, 1)), "dusk leaves are silhouettes")
for (const k of ["summer", "autumn", "blossom"]) assert.match(L.SEASONS[k].accent, /^#[0-9a-f]{6}$/, `${k} has an accent`)
assert.deepEqual(L.skyAt(L.SKIES.light.stops, 0), L.SKIES.light.stops[0][1])
assert.deepEqual(L.skyAt(L.SKIES.light.stops, 1), L.SKIES.light.stops[2][1])

// small helpers
assert.equal(L.formatNumber(14000), "14,000")
assert.equal(L.formatNumber(4.9, 1), "4.9")
assert.equal(L.formatNumber(1234567.25, 2), "1,234,567.25")
assert.equal(L.planPrice({ price: 9800, quarterly: 8820 }, true), 8820)
assert.equal(L.planPrice({ price: 9800, quarterly: 8820 }, false), 9800)
assert.equal(L.planPrice({ price: 14000 }, true), 14000, "a plan without a quarterly price keeps its own")
assert.equal(L.planPrice({ price: null }, true), null)
assert.ok(L.isEmail(" a@b.co "))
assert.ok(!L.isEmail("a@b"))
assert.ok(!L.isEmail("nope"))
const parts = L.manifestoParts("We grow [team] things [chart] fast")
assert.deepEqual(parts.map((p) => p.pic || p.word), ["We", "grow", "team", "things", "chart", "fast"])
assert.equal(parts[2].word, "")
assert.equal(L.stepAt(0, 5), 0)
assert.equal(L.stepAt(0.999, 5), 4)
assert.equal(L.stepAt(1, 5), 4, "the end of the track is the last card")
assert.equal(L.clamp(5, 0, 1), 1)
assert.equal(L.smoothstep(0, 1, 0.5), 0.5)

console.log("overstory-studio-landing: ok")
