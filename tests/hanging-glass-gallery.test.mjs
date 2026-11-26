// Install-safety and shatter-geometry checks for components/hanging-glass-gallery.
// Run: node tests/hanging-glass-gallery.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync, existsSync } from "node:fs"
import { liftRegion } from "./_component-safety.mjs"

const slug = "hanging-glass-gallery"
const dir = new URL("../components/" + slug + "/", import.meta.url)
const src = readFileSync(new URL(slug + ".tsx", dir), "utf8").replace(/\r\n/g, "\n")
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")

assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo.tsx", slug + ".tsx"].sort(), "folder holds only the publishable files")
assert.deepEqual([...new Set([...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1]))], ["react", "three", "three/examples/jsm/environments/RoomEnvironment.js"], "React and three only")
const ts = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")
assert.ok(ts.includes('"@/components/ui/' + slug + '": ["./components/' + slug + "/" + slug + '.tsx"]'), "tsconfig paths line")
assert.match(demo, /from "@\/components\/ui\/hanging-glass-gallery"/, "demo imports the installed path")
assert.doesNotMatch(demo, /https?:\/\//, "the demo links nowhere")
assert.match(src, /^"use client"/, "client component")
assert.match(src, /export default function HangingGlassGallery\(/, "default export")
assert.doesNotMatch(src + demo, /\bh-full\b/, "no h-full")
assert.doesNotMatch(src + demo, /use(Ref|State|Memo|Callback|Reducer|Context)</, "no generic hook type arguments")
assert.match(src, /height = "100svh"/, "height defaults to a definite length")
assert.match(src, /autoPlay = true/, "unattended breaks by default")
assert.match(src, /\.hgg-root\{[^}]*width:100%/, "root states its width")
assert.doesNotMatch(src, /SIGNAL|New world/, "no copy from the reference")
assert.ok(src.includes('const IMG = "https://kedhar-components.pages.dev/hanging-glass-gallery/"'), "image base is the catalogue")
for (const h of new Set(src.match(/https:\/\/[a-z0-9.-]+/gi))) assert.equal(h, "https://kedhar-components.pages.dev", "unexpected host " + h)
for (let i = 1; i <= 9; i++) assert.ok(existsSync(new URL("../dev/public/" + slug + "/portrait-0" + i + ".webp", import.meta.url)), "portrait " + i)
const css = src.slice(src.indexOf("const CSS ="), src.indexOf("\n\n", src.indexOf("const CSS =")))
assert.doesNotMatch(css, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS string")
for (const m of css.replace(/"\s*\+\s*\n\s*"/g, "").matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || sel.startsWith("const CSS")) continue
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".hgg-")), "unscoped selector: " + sel)
}
for (const [, v] of src.matchAll(/var\((--[a-z0-9-]+)/g)) assert.equal(v, "--g", "token not guaranteed: " + v)
assert.match(css, /@media \(prefers-reduced-motion:reduce\)/, "CSS honours reduced motion")
assert.match(src, /const s = strike\(still \? 2\.6 : clock - fr\.hit\.t0\)/, "reduced motion swaps without the shatter")
assert.match(src, /autoPlay && !st\.touched && !still/, "no unattended breaks once touched or under reduced motion")
assert.match(src, /h\.faceMat\.dispose\(\)/, "per-strike materials are disposed")
assert.match(src, /gl\.dispose\(\)/, "renderer is disposed")
assert.match(src, /IntersectionObserver/, "the loop pauses off screen")
assert.ok(existsSync(new URL("../media/" + slug + "/cover.png", import.meta.url)), "cover exists")
assert.ok(existsSync(new URL("../media/" + slug + "/thumb.webp", import.meta.url)), "thumb exists")

const { shatter, clipRect, area, strike, rng } = await liftRegion(src, "glass")
const W = 2.7, H = 3.5
for (const [cx, cy, seed] of [[1.2, 2, 7], [0.1, 0.1, 3], [2.6, 3.4, 99], [1.35, 1.75, 1234]]) {
  const sh = shatter(W, H, cx, cy, seed)
  const total = sh.reduce((s, p) => s + area(p), 0)
  assert.ok(Math.abs(total - W * H) < 1e-6, "shards tile the pane exactly (" + total.toFixed(6) + ")")
  for (const p of sh) for (const [x, y] of p) assert.ok(x >= -1e-9 && x <= W + 1e-9 && y >= -1e-9 && y <= H + 1e-9, "shards stay inside the pane")
  const central = cx > 0.5 && cx < W - 0.5 && cy > 0.5 && cy < H - 0.5
  assert.ok(sh.length >= (central ? 40 : 14), "enough shards to read as shattered glass (" + sh.length + ")")
  const near = sh.filter((p) => p.some(([x, y]) => Math.hypot(x - cx, y - cy) < 0.3)).map(area)
  const far = sh.filter((p) => p.every(([x, y]) => Math.hypot(x - cx, y - cy) > 1.2)).map(area)
  if (near.length && far.length) assert.ok(Math.max(...near) < Math.max(...far), "small pieces at the impact, big ones at the edge")
}
assert.deepEqual(shatter(W, H, 1, 1, 5), shatter(W, H, 1, 1, 5), "a seed gives the same pattern")
assert.equal(area(clipRect([[-1, -1], [2, -1], [2, 2], [-1, 2]], 1, 1)), 1, "clip to the unit square")
const r = rng(1); const vals = Array.from({ length: 200 }, r)
assert.ok(vals.every((v) => v >= 0 && v < 1) && new Set(vals).size > 150, "rng spreads")
assert.deepEqual(strike(0), { crack: 0, burst: 0, reform: 0, done: false }, "a strike starts whole")
assert.ok(strike(0.35).crack === 1 && strike(0.35).burst === 0, "it cracks before it breaks")
assert.ok(strike(1).burst > 0 && strike(1).reform === 0, "then bursts")
assert.ok(strike(2.6).done && strike(2.6).reform === 1, "and the glass re-forms")
console.log("hanging-glass-gallery: ok")
