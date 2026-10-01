// Install-safety and tear-engine checks for components/torn-postcard-portfolio.
// Run: node tests/torn-postcard-portfolio.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const SLUG = "torn-postcard-portfolio"
const read = (file) => readFileSync(new URL(`../components/${SLUG}/${file}`, import.meta.url), "utf8").replace(/\r\n/g, "\n")
const src = read(`${SLUG}.tsx`)
const region = (name) => {
  const a = src.indexOf(`// #region ${name}\n`)
  const b = src.indexOf(`// #endregion ${name}\n`)
  assert.ok(a > -1 && b > a, `region ${name} missing`)
  return src.slice(a, b)
}

/* ---------- nothing travels with it ---------- */

const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.doesNotMatch(src, /@import|@font-face|<link\b|fetch\(|new Image\(/, "nothing loads at runtime")
assert.doesNotMatch(src.replace(/https:\/\/(github|linkedin|dribbble)\.com"|https:\/\/example\.com"/g, ""), /https?:\/\//, "no external URL beyond placeholder links")
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.match(src, /className=\{"tpp-root " \+ className\}/, "root is the scoped class")
assert.match(src, /sid\(React\.useId\(\)\)/, "svg ids are namespaced per instance")
assert.doesNotMatch(src, /useState</, "hook types written without generics (21st CLI tokenizer)")
assert.match(src, /<img [^>]*maxWidth: "none"/, "custom photos are guarded against Preflight")

const css = src.match(/const TPP_CSS = `([\s\S]*?)`/)
assert.ok(css, "CSS block present")
assert.doesNotMatch(css[1], /\$\{/, "no interpolation inside the CSS string")
assert.doesNotMatch(css[1], /url\(/, "no url() in the style block")
for (const m of css[1].replace(/\/\*[\s\S]*?\*\//g, "").replace(/@keyframes [\w-]+\{(?:[^{}]*\{[^}]*\})*\s*\}/g, "").matchAll(/(?<=^|[{}])\s*([^{}@]+?)\s*\{/g)) {
  const sel = m[1].trim()
  for (const s of sel.split(/,(?![^(]*\))/)) assert.match(s.trim(), /^\.tpp-/, `selector escapes the component: ${s.trim()}`)
}
assert.match(css[1], /\.tpp-svg\{display:block;max-width:none\}/, "svgs are guarded against Preflight")
assert.match(css[1], /\.tpp-stage\{position:sticky;[^}]*overflow:clip/, "the stage clips without becoming a scroll container (focus can't scroll it)")
assert.ok(css[1].includes("@media (prefers-reduced-motion:reduce)"), "honours reduced motion in CSS")
assert.match(src, /const stack = reduced/, "reduced motion swaps the pinned tear for a stacked page")

/* ---------- it behaves like a template ---------- */

assert.match(src, /el\.inert = i !== shown/, "only the chapter on screen is focusable")
assert.match(src, /mailtoHref\(email, "A postcard for " \+ name, body\)/, "the postcard sends through mailto")
assert.match(src, /msgRef\.current\?\.focus\(\{ preventScroll: true \}\)/, "an empty postcard shakes and focuses the message")
assert.match(src, /e\.key === "ArrowRight"\) step\(1\)/, "work carousel answers the arrow keys")
assert.match(src, /setFlipped\(true\)/, "the postcard turns over")
assert.ok(read("demo.tsx").includes("<TornPostcardPortfolio />"), "default demo is the component, full bleed")
assert.doesNotMatch(read("demo.tsx"), /<div/, "default demo has no wrapper")

/* ---------- logic, executed ---------- */

const code = region("logic") + "\nexport { clamp, rng, ease, tornEdge, fiberDepth, upperClip, lowerClip, frame, snapTarget, wrap, initials, mailtoHref, ridge, curveThrough, pathFractions, measureCurve, PAD }\n"
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(code)))

const a = L.rng(7), b = L.rng(7)
assert.equal(a(), b(), "rng is seeded")
assert.ok([...Array(200)].map(L.rng(3)).every((v) => v >= 0 && v < 1))

const edge = L.tornEdge(101, 84, 16)
assert.equal(edge.length, 85)
assert.deepEqual(edge, L.tornEdge(101, 84, 16), "tears are deterministic (same on server and client)")
assert.ok(edge.every((v) => Math.abs(v) < 40), "tear stays near the seam")
const depth = L.fiberDepth(1, 84, 6, 22)
assert.ok(depth.every((v) => v >= 6 && v <= 22), "fibre band within bounds")

const up = L.upperClip([0, -3, 4], 0.7)
assert.ok(up.startsWith("polygon(0 0,100% 0,100% calc("), "upper piece starts at the top")
assert.ok(up.includes("calc(40px + (100% - 80px) * 0.7 - 3px)"), "negative offsets are written with minus")
const lo = L.lowerClip([0, -3, 4], 0.7, [1, 1, 1])
assert.ok(lo.endsWith("100% 100%,0 100%)"), "lower piece ends at the bottom")
assert.ok(lo.includes("* 0.7 + 3px)"), "lower fibre band is pulled up by its depth")

// rest → tear → next chapter rests
let f = L.frame(0, 5, 0.32)
assert.deepEqual([f.k, f.split, f.active], [0, 0, 0])
assert.deepEqual(f.chapters.map((c) => c.on), [true, false, false, false, false], "only the cover at rest")
f = L.frame(0.2, 5, 0.32)
assert.equal(f.split, 0, "holds before tearing")
f = L.frame(0.66, 5, 0.32)
assert.ok(f.split > 0.3 && f.split < 0.7, "tears in the middle of the slice")
assert.equal(f.chapters[1].p, f.split, "the next chapter grows with the tear")
assert.ok(f.chapters[0].on && f.chapters[1].on && !f.chapters[2].on, "two chapters on screen while tearing")
f = L.frame(4, 5, 0.32)
assert.deepEqual([f.k, f.split, f.active], [4, 0, 4], "last chapter never tears")
assert.equal(L.frame(99, 5, 0.32).k, 4, "clamped past the end")
for (let s = 0; s < 4; s += 0.01) {
  const x = L.frame(s, 5, 0.32)
  assert.ok(x.split >= 0 && x.split <= 1)
  assert.ok(x.chapters.filter((c) => c.on).length <= 2)
}

assert.equal(L.snapTarget(0, 5, 0.32, 1), null, "nothing to settle at rest")
assert.equal(L.snapTarget(0.2, 5, 0.32, 1), null, "nothing to settle while holding")
assert.equal(L.snapTarget(0.7, 5, 0.32, 1), 1, "scrolling down finishes the tear")
assert.equal(L.snapTarget(0.7, 5, 0.32, -1), 0.32, "scrolling up mends it")
assert.equal(L.snapTarget(0.35, 5, 0.32, 1), 0.32, "a nudge down that barely tore is undone")
assert.equal(L.snapTarget(4, 5, 0.32, 1), null)

assert.equal(L.wrap(-1, 5), 4)
assert.equal(L.wrap(5, 5), 0)
assert.equal(L.initials("Mira Sol"), "MS")
assert.equal(L.initials("kedhareswer"), "K")
assert.equal(L.initials("   "), "·")
assert.equal(L.mailtoHref("a@b.co", "", ""), "mailto:a@b.co")
assert.equal(L.mailtoHref("a@b.co", "Hi & bye", "line\nnext"), "mailto:a@b.co?subject=Hi%20%26%20bye&body=line%0Anext")

const r = L.ridge(11, 0, 1600, 300, 200, 0.55, 6)
assert.equal(r.length, 65)
assert.equal(r[0][0], 0)
assert.equal(r[64][0], 1600)

const pts = [[0, 0], [10, 0], [20, 0]]
assert.ok(L.curveThrough(pts).startsWith("M0 0 C"))
const fr = L.pathFractions(pts)
assert.equal(fr[0], 0)
assert.ok(Math.abs(fr[1] - 0.5) < 0.01, "a straight trail is split evenly")
assert.equal(fr[2], 1)
assert.ok(Math.abs(L.measureCurve(pts).total - 20) < 0.01, "length of a straight trail")

console.log("torn-postcard-portfolio: ok")
