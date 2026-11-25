// Install-safety and timeline checks for components/halo-arch-hero.
// Run: node tests/halo-arch-hero.test.mjs
//
// The timeline (card flights, odometer, arch spin, opening pose) lives in the one
// published .tsx between `// #region timeline` and `// #endregion`; the test lifts it
// out, strips the types and runs it, so the motion is tested as shipped.
import assert from "node:assert/strict"
import { readFileSync, readdirSync, existsSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const slug = "halo-arch-hero"
const dir = new URL("../components/" + slug + "/", import.meta.url)
const src = readFileSync(new URL(slug + ".tsx", dir), "utf8").replace(/\r\n/g, "\n")
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")

// ---------- install safety ----------
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo.tsx", slug + ".tsx"].sort(), "folder holds only the publishable files")
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react", "three"], "imports")
const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"))
for (const i of imports) assert.ok(pkg.dependencies[i], i + " is declared in the root package.json")
const ts = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")
assert.ok(ts.includes('"@/components/ui/' + slug + '": ["./components/' + slug + "/" + slug + '.tsx"]'), "tsconfig paths line")
assert.match(demo, /from "@\/components\/ui\/halo-arch-hero"/, "demo imports the installed path")
assert.match(src, /^"use client"/, "client component")
assert.doesNotMatch(src + demo, /\bh-full\b/, "no h-full")
assert.doesNotMatch(src + demo, /use(Ref|State|Memo|Callback|Reducer|Context)</, "no generic hook type arguments")
assert.match(src, /height = "100svh"/, "definite default height")
assert.ok(src.length < 60_000, "component stays lean, " + src.length)

const cssAt = src.indexOf("const CSS =")
const css = src.slice(cssAt, src.indexOf("\n\n", cssAt))
assert.doesNotMatch(css, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS string")
assert.doesNotMatch(css, /"\s*(\*|body|html|:root)\s*[{,]/, "no global resets (rules start with a scoped class)")
for (const rule of css.match(/"[^"]+\{/g) || []) {
  const sel = rule.slice(1)
  if (!sel.startsWith("@")) assert.ok(sel.startsWith(".hah-"), "rule is scoped: " + sel)
}
assert.match(css, /\.hah-root\{[^}]*width:100%/, "root states its width (21st centres demos in a flex row)")
assert.match(css, /\.hah-root\{[^}]*container-type:size/, "root is the size container")
for (const v of (css.match(/var\(--[\w-]+/g) || []).map((s) => s.slice(4))) {
  assert.ok(["--color-background", "--color-foreground", "--hah-g", "--hah-nav", "--hah-bar", "--hah-markw"].includes(v), "only semantic tokens or own vars: " + v)
}
assert.match(src, /prefers-reduced-motion: reduce/, "honours reduced motion")
assert.match(src, /new IntersectionObserver/, "stops rendering off screen")
assert.match(src, /renderer\??\.dispose\(\)/, "disposes the GL context")

// hosted pictures exist locally (served from dev/public until deployed)
const site = "https://kedhar-components.pages.dev/" + slug + "/"
assert.ok(src.includes(site), "pictures come from the deployed site")
for (let i = 1; i <= 40; i++) assert.ok(existsSync(new URL("../dev/public/" + slug + "/card-" + String(i).padStart(2, "0") + ".webp", import.meta.url)), "card " + i)
assert.ok(existsSync(new URL("../dev/public/" + slug + "/sky.webp", import.meta.url)), "sky")
assert.ok(existsSync(new URL("../media/" + slug + "/cover.png", import.meta.url)), "cover")
assert.ok(existsSync(new URL("../media/" + slug + "/thumb.webp", import.meta.url)), "thumb")

// no identifiers from the reference
assert.doesNotMatch(src + demo, /\bAvi\b|Vashishta/i, "no reference names")

// ---------- timeline, run as shipped ----------
const region = src.slice(src.indexOf("// #region timeline"), src.indexOf("// #endregion"))
const code = stripTypeScriptTypes(region) + "\nexport { T, cardAngle, flightStart, flight, countAt, odometer, spinAt, poseAt }"
const m = await import("data:text/javascript," + encodeURIComponent(code))
const { T } = m
const n = 40

// every picture is different (no repeats in one composition)
const cardUrls = [...src.matchAll(/card-" \+ String\(i \+ 1\)/g)]
assert.equal(cardUrls.length, 1, "default cards are generated, one per index")
assert.match(src, /Array\.from\(\{ length: 40 \}/, "forty distinct default pictures")

// flights: the crown first, then outwards, the visible arch closed by the end of the build
const crown = [...Array(n).keys()].sort((a, b) => Math.abs(Math.cos(m.cardAngle(a, n))) - Math.abs(Math.cos(m.cardAngle(b, n))))[0]
assert.ok(Math.abs(m.flightStart(crown, n) - T.build[0]) < 1e-9, "crown card leaves first")
for (let k = 0; k < n; k++) {
  const a = m.cardAngle(k, n)
  const s = m.flightStart(k, n)
  if (Math.sin(a) > 0.15) assert.ok(s + T.fly <= T.build[1] + 1e-9, "upper card " + k + " lands by the end of the build")
  assert.ok(s + T.fly <= T.open[0] + 1e-9, "every card has landed before the arch opens")
  assert.ok(s >= 0, "no card is parked in place at the start (nothing waits at the feet)")
}
// higher cards never land after lower ones on the same side
for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
  const ai = m.cardAngle(i, n), aj = m.cardAngle(j, n)
  if (Math.sign(Math.cos(ai)) === Math.sign(Math.cos(aj)) && Math.sin(ai) > Math.sin(aj) + 1e-6) assert.ok(m.flightStart(i, n) <= m.flightStart(j, n) + 1e-9, "arch fills from the crown down")
}
assert.equal(m.flight(T.open[0], 0, n), 1, "landed")

// count: monotonic, 100 before the arch closes
let prev = -1
for (let t = 0; t <= 1.3; t += 0.01) {
  const c = m.countAt(t)
  assert.ok(c >= prev - 1e-9, "count never goes back")
  prev = c
}
assert.equal(Math.round(m.countAt(T.count[1])), 100, "count lands on 100")
assert.ok(T.count[1] < T.build[1], "count finishes before the arch closes")
assert.equal(m.odometer(45, 1), 4, "tens holds mid-decade")
assert.equal(m.odometer(100, 2), 1, "hundreds shows 1 at 100")

// spin: one direction, never stops once it has started (continuity)
const slot = (2 * Math.PI) / n
const dt = 1 / 60
let minW = Infinity
for (let t = 1.6; t < 8; t += dt) minW = Math.min(minW, (m.spinAt(t + dt, slot) - m.spinAt(t, slot)) / dt)
assert.ok(minW > 0.02, "arch keeps drifting from the build into the idle, min " + minW.toFixed(3) + " rad/s")
assert.ok(Math.abs((m.spinAt(9 + dt, slot) - m.spinAt(9, slot)) / dt - slot / 2.6) < 1e-6, "idle drift is one slot per 2.6 s")

// opening: every pose value moves monotonically from the arch to the open arc
const arch = { cy: 638, r: 336, tilt: 0, lean: 0.35, card: 149 }
const open = { cy: 900, r: 1100, tilt: 0.45, lean: 0.52, card: 262 }
let last = m.poseAt(T.open[0] - 0.1, arch, open)
for (let t = T.open[0]; t <= T.open[1] + 0.1; t += dt) {
  const p = m.poseAt(t, arch, open)
  for (const key of ["cy", "r", "tilt", "lean", "card"]) assert.ok(p[key] >= last[key] - 1e-9, key + " never reverses while the arch opens")
  last = p
}
assert.deepEqual(m.poseAt(T.open[1], arch, open), open, "ends on the open pose")

// phases overlap in the reference's order
assert.ok(T.sky[0] < T.open[0] + 0.1 && T.open[0] < T.sky[1], "the arch starts opening while the sky comes in")
assert.ok(T.frame[0] <= T.open[1] && T.line1[0] < T.frame[1], "page frames itself as the arc settles")
assert.ok(T.stats[0] < T.line2[1], "stats start before the headline finishes")

console.log(slug + ": ok")
