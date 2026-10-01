// Install-safety and pendulum-logic checks for components/hanging-chapter-select.
// Run: node tests/hanging-chapter-select.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const SLUG = "hanging-chapter-select"
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
assert.doesNotMatch(src, /https?:\/\//, "no external URLs")
assert.doesNotMatch(read("demo-original.tsx"), /https?:\/\//, "original demo loads nothing either")
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.doesNotMatch(src, /h-full/, "never h-full")
assert.match(src, /className=\{"hc-root " \+ className\}/, "root is the scoped class")
assert.match(src, /sid\(React\.useId\(\)\)/, "svg ids are namespaced per instance")
assert.doesNotMatch(src, /use(State|Ref|Memo|Callback)</, "hook types written without generics (21st CLI tokenizer)")
assert.match(src, /<img [^>]*maxWidth: "none"/, "a custom QR image is guarded against Preflight")

const css = src.match(/const HC_CSS = `([\s\S]*?)`/)
assert.ok(css, "CSS block present")
assert.doesNotMatch(css[1], /\$\{/, "no interpolation inside the CSS string")
assert.doesNotMatch(css[1], /url\(/, "no url() in the style block")
for (const m of css[1].replace(/\/\*[\s\S]*?\*\//g, "").replace(/@keyframes [\w-]+\{(?:[^{}]*\{[^}]*\})*\s*\}/g, "").matchAll(/(?<=^|[{}])\s*([^{}@]+?)\s*\{/g)) {
  const sel = m[1].trim()
  for (const s of sel.split(/,(?![^(]*\))/)) assert.match(s.trim(), /^\.hc-/, `selector escapes the component: ${s.trim()}`)
}
assert.match(css[1], /\.hc-svg\{display:block;max-width:none\}/, "svgs are guarded against Preflight")
assert.doesNotMatch(css[1].match(/\.hc-root\{[^}]*\}/)[0], /height/, "the root takes its height from the prop, never a percentage")
assert.match(css[1], /container:hc \/ size/, "the root is a size container (cq units resolve against it)")
assert.match(css[1], /\.hc-scene\{--hc-w:/, "card size lives below the container so its own query can change it")
assert.ok(css[1].includes("@media (prefers-reduced-motion:reduce)"), "honours reduced motion in CSS")
assert.match(src, /if \(s\.reduced\) \{\s*th = 0/, "reduced motion stills the pendulums")

/* ---------- it behaves like a chapter select ---------- */

assert.match(src, /role="tablist"/, "sections are a real tablist")
assert.match(src, /role="dialog" aria-modal="true"/, "the letter is a modal dialog")
assert.match(src, /scene\.inert = !!open/, "everything behind the letter is inert")
assert.match(src, /e\.key === "Escape" && open\) closeCard\(\)/, "Escape closes the letter")
assert.match(src, /tabIndex=\{k === active \? 0 : -1\}/, "roving tabindex on the cards")
assert.match(src, /addEventListener\("wheel", onWheel, \{ passive: false \}\)/, "wheel is non-passive so it can stop the page")
assert.match(src, /target <= 0 && d < 0\) \|\| \(s\.target >= s\.n - 1 && d > 0\)\)\) return/, "wheel lets the page scroll past either end")
assert.match(src, /it\.card\.locked\) \{\s*poke\(k, 220\)/, "a locked card shakes instead of opening")
assert.match(src, /\{ \.\.\.\(ART_COLORS\[art\] \?\? ART_COLORS\.brush\), \.\.\.card\.colors \}/, "a card without colours wears its poster style's own")
assert.match(read("demo.tsx"), /<HangingChapterSelect[\s/>]/, "default demo is the component, full bleed")
assert.doesNotMatch(read("demo.tsx"), /<div/, "default demo has no wrapper")

/* ---------- logic, executed ---------- */

const code = region("logic") + "\nexport { clamp, rng, easeOutBack, hash, layout, settle, rubber, swing, spring, dropY, breezeAt, hangTransform, frond, codeBits, sid }\n"
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(code)))

const a = L.rng(7), b = L.rng(7)
assert.equal(a(), b(), "rng is seeded")
assert.ok([...Array(200)].map(L.rng(3)).every((v) => v >= 0 && v < 1))
assert.equal(L.hash("春露"), L.hash("春露"), "hash is stable")
assert.notEqual(L.hash("a"), L.hash("b"))


const front = L.layout(0)
assert.deepEqual([front.scale, front.lift, front.opacity, front.z], [1, 1.6, 1, 100], "the front card is full size and lifted")
assert.deepEqual(L.layout(-2), L.layout(2), "depth is symmetric")
assert.ok(L.layout(1).scale < 1 && L.layout(1).z < 100, "neighbours sit smaller and behind")
assert.equal(L.layout(6).opacity, 0, "far cards fade out")
for (let d = 0; d < 8; d += 0.25) assert.ok(L.layout(d).scale >= L.layout(d + 0.25).scale, "smaller as it goes back")

assert.equal(L.settle(2.2, 0, 6), 2, "a slow release rounds to the nearest card")
assert.equal(L.settle(2.2, 8, 6), 3, "a flick carries to the next card")
assert.equal(L.settle(0.2, -20, 6), 0, "never before the first card")
assert.equal(L.settle(5, 40, 6), 5, "never past the last card")
assert.equal(L.settle(0, 0, 0), 0, "an empty line rests at 0")
assert.equal(L.rubber(2, 6), 2)
assert.ok(L.rubber(-1, 6) > -1 && L.rubber(-1, 6) < 0, "pulling past the start resists")
assert.ok(L.rubber(6, 6) < 6 && L.rubber(6, 6) > 5, "pulling past the end resists")

// a pushed pendulum swings, then comes back to rest
let th = 0, om = 0
;[th, om] = L.swing(th, om, 0, -400, 28, 1 / 60)
assert.ok(th > 0, "pushing the pivot left swings the card right")
let peak = 0
for (let i = 0; i < 600; i++) {
  ;[th, om] = L.swing(th, om, 0, 0, 28, 1 / 60)
  peak = Math.max(peak, Math.abs(th))
}
assert.ok(peak > 0, "it swings")
assert.ok(Math.abs(th) < 0.05 && Math.abs(om) < 0.5, "damping brings it to rest")
assert.equal(L.swing(0, 1e5, 0, 0, 28, 1 / 60)[0], 20, "the swing is clamped")
let [x, v] = [0, 0]
for (let i = 0; i < 240; i++) [x, v] = L.spring(x, v, 3, 1 / 60)
assert.ok(Math.abs(x - 3) < 0.01, "the line springs onto its target")

assert.equal(L.dropY(-1), -75, "waiting above the wall")
assert.equal(L.dropY(0.85), 0, "landed")
assert.ok(Math.min(...[...Array(85)].map((_, i) => -L.dropY(i / 100))) < 0, "overshoots, like a card on a string")
assert.ok(Math.abs(L.breezeAt(3, 2)) < 1.31, "the idle breeze is gentle")

assert.equal(L.hangTransform(1.5, -2, 3.25), "translate3d(calc(1.5000 * var(--hc-gap) - 50%),-2.00cqh,0) rotate(3.250deg)")

const f = L.frond(11, 200, -60, 20, 10)
assert.equal(f.leaves.length, 20, "a pair of leaflets per step")
assert.ok(f.rib.startsWith("M0 0 Q"), "the midrib grows from the base")
assert.deepEqual(L.frond(11, 200, -60, 20, 10), f, "fronds are deterministic (same on server and client)")
assert.ok(f.leaves.every((d) => /^M[-\d. ]+ Q[-\d. ]+ Q[-\d. ]+Z$/.test(d)), "leaflets are closed quadratic shapes")

const bits = L.codeBits(5, 21)
assert.equal(bits.length, 441)
for (const [fx, fy] of [[0, 0], [14, 0], [0, 14]]) {
  assert.equal(bits[fy * 21 + fx], true, "finder eye corner")
  assert.equal(bits[(fy + 1) * 21 + fx + 1], false, "finder eye ring")
  assert.equal(bits[(fy + 3) * 21 + fx + 3], true, "finder eye centre")
}
assert.deepEqual(L.codeBits(5, 21), bits, "the code is deterministic")
assert.equal(L.sid(":r1:"), "r1")

console.log("hanging-chapter-select: ok")
