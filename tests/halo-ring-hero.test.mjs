// Install-safety and timeline checks for components/halo-ring-hero.
// Run: node tests/halo-ring-hero.test.mjs
//
// The timeline (card build order, odometer, ring spin, camera dive) lives in the one
// published .tsx between `// #region timeline` and `// #endregion`; the test lifts it
// out, strips the types and runs it, so the motion is tested as shipped.
import assert from "node:assert/strict"
import { readFileSync, readdirSync, existsSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const slug = "halo-ring-hero"
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
assert.match(demo, /from "@\/components\/ui\/halo-ring-hero"/, "demo imports the installed path")
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
  if (!sel.startsWith("@")) assert.ok(sel.startsWith(".hrh-"), "rule is scoped: " + sel)
}
assert.match(css, /\.hrh-root\{[^}]*width:100%/, "root states its width (21st centres demos in a flex row)")
assert.match(css, /\.hrh-root\{[^}]*container-type:size/, "root is the size container")
for (const v of (css.match(/var\(--[\w-]+/g) || []).map((s) => s.slice(4))) {
  assert.ok(["--color-background", "--color-foreground", "--hrh-g", "--hrh-nav", "--hrh-bar", "--hrh-markw"].includes(v), "only semantic tokens or own vars: " + v)
}
assert.match(src, /prefers-reduced-motion: reduce/, "honours reduced motion")
assert.match(src, /new IntersectionObserver/, "stops rendering off screen")
assert.match(src, /renderer\.dispose\(\)/, "disposes the GL context")

// hosted pictures exist locally (served from dev/public until deployed)
const site = "https://kedhar-components.pages.dev/" + slug + "/"
assert.ok(src.includes(site), "pictures come from the deployed site")
for (let i = 1; i <= 24; i++) assert.ok(existsSync(new URL("../dev/public/" + slug + "/card-" + String(i).padStart(2, "0") + ".webp", import.meta.url)), "card " + i)
assert.ok(existsSync(new URL("../dev/public/" + slug + "/sky.webp", import.meta.url)), "sky")
assert.ok(existsSync(new URL("../media/" + slug + "/cover.png", import.meta.url)), "cover")
assert.ok(existsSync(new URL("../media/" + slug + "/thumb.webp", import.meta.url)), "thumb")

// no identifiers from the reference
assert.doesNotMatch(src + demo, /\bAvi\b|Vashishta/i, "no reference names")

// ---------- timeline, run as shipped ----------
const region = src.slice(src.indexOf("// #region timeline"), src.indexOf("// #endregion"))
const code = stripTypeScriptTypes(region) + "\nexport { T, cardStart, cardShown, countAt, odometer, ringYaw, cameraAt }"
const m = await import("data:text/javascript," + encodeURIComponent(code))
const { T } = m

// cards: in order, all landed before the sky arrives
const n = 24
for (let k = 1; k < n; k++) assert.ok(m.cardStart(k, n) >= m.cardStart(k - 1, n), "cards arrive in order")
assert.ok(Math.abs(m.cardStart(0, n) - T.build[0]) < 1e-9, "first card at the build start")
assert.ok(m.cardStart(n - 1, n) + T.pop <= T.build[1] + 1e-9, "ring closes by the end of the build")
assert.ok(T.build[1] < T.sky[0], "ring closes before the sky")
assert.equal(m.cardShown(T.build[1], n - 1, n), 1, "last card fully in")

// count: monotonic, lands on 100 before the ring closes
let prev = -1
for (let t = 0; t <= 1; t += 0.01) {
  const c = m.countAt(t)
  assert.ok(c >= prev - 1e-9, "count never goes back")
  prev = c
}
assert.equal(Math.round(m.countAt(T.count[1])), 100, "count lands on 100")
// odometer: tens wheel only turns while the ones wheel rolls 9 -> 0
assert.equal(m.odometer(45, 1), 4, "tens holds at 4 mid-decade")
assert.ok(Math.abs(m.odometer(49.5, 1) - 4.5) < 1e-9, "tens half-turned during the carry")
assert.equal(m.odometer(100, 2), 1, "hundreds shows 1 at 100")

// ring: one direction, never stops once moving (the continuity fix)
const slot = (2 * Math.PI) / n
const dt = 1 / 60
let minW = Infinity
for (let t = 0.5; t < 6; t += dt) minW = Math.min(minW, (m.ringYaw(t + dt, slot) - m.ringYaw(t, slot)) / dt)
assert.ok(minW > 0.12, "ring keeps turning through the hand-off, min " + minW.toFixed(3) + " rad/s")
const idle = (m.ringYaw(8 + dt, slot) - m.ringYaw(8, slot)) / dt
assert.ok(Math.abs(idle - slot / 0.9) < 1e-6, "idle spin is one card slot per 0.9 s")

// camera: no stall between the build and the dive
const out = { px: 0, py: 2.5, pz: 3.3, tx: 0.1, ty: -0.04, tz: 0, vfov: 30, roll: 0.13 }
const inn = { px: 0, py: 0, pz: 0.12, tx: 0, ty: 0, tz: -1, vfov: 90, roll: 0 }
const speed = (t) => {
  const a = m.cameraAt(t, out, inn)
  const b = m.cameraAt(t + dt, out, inn)
  return Math.hypot(b.px - a.px, b.py - a.py, b.pz - a.pz) / dt
}
let minV = Infinity
for (let t = 0.3; t < T.dive[1] - 0.1; t += dt) minV = Math.min(minV, speed(t))
assert.ok(minV > 0.05, "camera keeps moving from the build into the dive, min " + minV.toFixed(3))
// the lens only widens once the camera is well into the dive
const early = m.cameraAt(T.dive[0] + (T.dive[1] - T.dive[0]) * 0.3, out, inn)
assert.ok(Math.abs(early.vfov - out.vfov) < 1e-9, "lens unchanged early in the dive (the ring must not shrink)")
const end = m.cameraAt(T.dive[1], out, inn)
assert.ok(Math.abs(end.pz - inn.pz) < 1e-9 && Math.abs(end.vfov - inn.vfov) < 1e-9, "dive ends inside the ring")

// phases overlap in the order the reference uses
assert.ok(T.dive[0] < T.sky[1], "dive starts before the sky finishes")
assert.ok(T.frame[0] < T.dive[1] + 0.4 && T.line1[0] < T.frame[1], "page frames itself as the dive settles")
assert.ok(T.stats[0] < T.line2[1], "stats start before the headline finishes")

console.log(slug + ": ok")
