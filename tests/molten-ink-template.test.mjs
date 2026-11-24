// Install-safety and timeline checks for components/molten-ink-template.
// Run: node tests/molten-ink-template.test.mjs
//
// The timeline, the swoosh path and the ink drying curve live in the one published
// .tsx between `// #region timeline` and `// #endregion`; the test lifts them out,
// strips the types and runs them, so the motion is tested as shipped.
import assert from "node:assert/strict"
import { readFileSync, readdirSync, existsSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const slug = "molten-ink-template"
const dir = new URL("../components/" + slug + "/", import.meta.url)
const src = readFileSync(new URL(slug + ".tsx", dir), "utf8").replace(/\r\n/g, "\n")
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")

// ---------- install safety ----------
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo.tsx", slug + ".tsx"].sort(), "folder holds only the publishable files")
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
const ts = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")
assert.ok(ts.includes('"@/components/ui/' + slug + '": ["./components/' + slug + "/" + slug + '.tsx"]'), "tsconfig paths line")
assert.match(demo, /from "@\/components\/ui\/molten-ink-template"/, "demo imports the installed path")
assert.match(src, /^"use client"/, "client component")
assert.doesNotMatch(src + demo, /\bh-full\b/, "no h-full")
assert.doesNotMatch(src + demo, /use(Ref|State|Memo|Callback|Reducer|Context)</, "no generic hook type arguments")
assert.match(src, /height = "100svh"/, "definite default height")
assert.ok(src.length < 60_000, "component stays lean, " + src.length)

const cssAt = src.indexOf("const CSS =")
const css = src.slice(cssAt, src.indexOf("\n\n", cssAt))
assert.doesNotMatch(css, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS string")
for (const rule of css.match(/"[^"]+\{/g) || []) {
  const sel = rule.slice(1)
  if (!sel.startsWith("@")) assert.ok(sel.startsWith(".mit-"), "rule is scoped: " + sel)
}
assert.match(css, /\.mit-root\{[^}]*width:100%/, "root states its width (21st centres demos in a flex row)")
assert.match(css, /\.mit-root img\{max-width:none\}/, "guards Preflight's img max-width")
for (const v of (css.match(/var\(--[\w-]+/g) || []).map((s) => s.slice(4))) assert.ok(["--w"].includes(v), "only its own vars: " + v)
assert.match(src, /prefers-reduced-motion: reduce/, "honours reduced motion")
assert.match(src, /if \(!still\) wander \+= /, "the works blob holds still under reduced motion")

// GL: a lost or blocked context must not paint white, and StrictMode remounts reuse the contexts
assert.match(src, /addEventListener\("webglcontextlost", off\)/, "a lost context hides its canvas")
assert.match(src, /isContextLost\(\)\) return off\(\)/, "an already-lost context hides its canvas")
assert.doesNotMatch(src, /loseContext\(\)/, "cleanup does not kill contexts a remount will reuse")
assert.match(src, /deleteTexture/, "textures are released on unmount")

// hosted pictures exist locally (served from dev/public until deployed)
assert.ok(src.includes("https://kedhar-components.pages.dev/" + slug + "/"), "pictures come from the deployed site")
const pub = (f) => new URL("../dev/public/" + slug + "/" + f, import.meta.url)
for (let i = 1; i <= 12; i++) assert.ok(existsSync(pub("gadget-" + String(i).padStart(2, "0") + ".webp")), "gadget " + i)
for (const f of ["console.webp", "glove.webp", "reel.webp"]) assert.ok(existsSync(pub(f)), f)
assert.ok(existsSync(new URL("../media/" + slug + "/cover.png", import.meta.url)), "cover")
assert.ok(existsSync(new URL("../media/" + slug + "/thumb.webp", import.meta.url)), "thumb")

// copy is about Kedhar; works are placeholders
assert.match(src, /email = "kedhareswer\.12110626@gmail\.com"/, "default email")
assert.match(src, /title: "Client " \+ \(i \+ 1\)/, "placeholder client names")
assert.match(src, /length: 12 \}/, "twelve default works, one picture each")
assert.doesNotMatch(src + demo, /\bframer\b|\bmade in \w+\b(?! interfaces)|template by|buttermax/i, "no reference identifiers")

// ---------- timeline, run as shipped ----------
const region = src.slice(src.indexOf("// #region timeline"), src.indexOf("// #endregion"))
const code = stripTypeScriptTypes(region) + "\nexport { T, LOADER_END, swooshAt, inkLife, span, clamp01 }"
const m = await import("data:text/javascript," + encodeURIComponent(code))
const { T } = m

// loader phases run in order and the hero takes over as the loader fades
const order = [T.dot, T.split, T.markYellow, T.markOut, T.field, T.flood, T.loaderOut]
for (let i = 0; i < order.length; i++) assert.ok(order[i][0] < order[i][1], "phase " + i + " has length")
for (let i = 1; i < order.length; i++) assert.ok(order[i][0] >= order[i - 1][0], "phase " + i + " starts after phase " + (i - 1))
assert.equal(m.LOADER_END, T.loaderOut[1])
assert.ok(T.heroIn >= T.flood[0] && T.heroIn <= T.loaderOut[1], "the hero comes in under the yellow flood, so there is no gap")
assert.ok(T.scriptWrite[0] >= T.heroIn && T.swoosh[0] >= T.heroIn, "script and swoosh start once the hero is in")

// the swoosh: continuous, inside the hero, sweeping right then back under the wordmark
let prev = m.swooshAt(0)
let maxStep = 0
let rightmost = 0
for (let u = 0.002; u <= 1.0001; u += 0.002) {
  const p = m.swooshAt(u)
  assert.ok(p[0] >= 0 && p[0] <= 1 && p[1] >= 0 && p[1] <= 1, "swoosh stays inside the hero at u=" + u.toFixed(3))
  maxStep = Math.max(maxStep, Math.hypot(p[0] - prev[0], p[1] - prev[1]))
  rightmost = Math.max(rightmost, p[0])
  prev = p
}
assert.ok(maxStep < 0.02, "swoosh path has no jumps, max step " + maxStep)
assert.ok(rightmost > 0.8, "swoosh reaches across the page")
// y is in name heights: the return pass cuts through the name (so letters turn chrome)
// and never drops below the name's bottom edge, where the tagline sits
let throughName = 0
for (let u = 0.6; u <= 1; u += 0.02) {
  const v = m.swooshAt(u)[1]
  assert.ok(v <= 1, "return pass stays above the tagline at u=" + u.toFixed(2))
  if (v >= 0.2 && v <= 0.95) throughName++
}
assert.ok(throughName >= 15, "return pass runs through the name")
assert.ok(m.swooshAt(1)[0] < 0.1, "swoosh ends at the left edge")

// ink dries: full width while held, then shrinks to nothing, never grows back
assert.equal(m.inkLife(0, 1.2), 1)
assert.equal(m.inkLife(1.19, 1.2), 1)
assert.equal(m.inkLife(1.2 + 0.3, 1.2), 0)
let last = 1
for (let a = 0; a <= 2; a += 0.01) {
  const k = m.inkLife(a, 1.2)
  assert.ok(k <= last + 1e-12 && k >= 0, "inkLife is monotone at " + a.toFixed(2))
  last = k
}

console.log("molten-ink-template: all checks passed")
