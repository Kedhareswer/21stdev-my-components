// Install-safety and ribbon-geometry checks for components/spiral-ribbon-gallery.
// Run: node tests/spiral-ribbon-gallery.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync, existsSync } from "node:fs"
import { liftRegion } from "./_component-safety.mjs"

const slug = "spiral-ribbon-gallery"
const dir = new URL("../components/" + slug + "/", import.meta.url)
const src = readFileSync(new URL(slug + ".tsx", dir), "utf8").replace(/\r\n/g, "\n")
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")

assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo.tsx", slug + ".tsx"].sort(), "folder holds only the publishable files")
assert.deepEqual([...new Set([...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1]))], ["react", "three"], "React and three only")
const ts = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")
assert.ok(ts.includes('"@/components/ui/' + slug + '": ["./components/' + slug + "/" + slug + '.tsx"]'), "tsconfig paths line")
assert.match(demo, /from "@\/components\/ui\/spiral-ribbon-gallery"/, "demo imports the installed path")
assert.doesNotMatch(demo, /https?:\/\//, "the demo links nowhere")
assert.match(src, /^"use client"/, "client component")
assert.match(src, /export default function SpiralRibbonGallery\(/, "default export")
assert.doesNotMatch(src + demo, /\bh-full\b/, "no h-full")
assert.doesNotMatch(src + demo, /use(Ref|State|Memo|Callback|Reducer|Context)</, "no generic hook type arguments")
assert.doesNotMatch(src, /DEBUG|__srg/, "no debug hooks left")
assert.match(src, /height = "100svh"/, "height defaults to a definite length")
assert.match(src, /autoPlay = true/, "the unattended ripple is on by default")
assert.match(src, /\.srg-root\{[^}]*width:100%/, "root states its width")
assert.ok(src.includes('const IMG = "https://kedhar-components.pages.dev/spiral-ribbon-gallery/"'), "image base is the catalogue")
for (const h of new Set(src.match(/https:\/\/[a-z0-9.-]+/gi))) assert.equal(h, "https://kedhar-components.pages.dev", "unexpected host " + h)
for (let i = 1; i <= 9; i++) assert.ok(existsSync(new URL("../dev/public/" + slug + "/portrait-0" + i + ".webp", import.meta.url)), "portrait " + i)
const css = src.slice(src.indexOf("const CSS ="), src.indexOf("\n\n", src.indexOf("const CSS =")))
assert.doesNotMatch(css, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS string")
for (const m of css.replace(/"\s*\+\s*\n\s*"/g, "").matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || sel.startsWith("const CSS")) continue
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".srg-")), "unscoped selector: " + sel)
}
assert.match(css, /@media \(prefers-reduced-motion:reduce\)/, "CSS honours reduced motion")
assert.match(src, /const m = reduce\.matches \? 1 : unfurl\(t\)/, "reduced motion starts unfurled")
assert.match(src, /shape\(m, t, reduce\.matches \? null : st\.touch\)/, "reduced motion drops ripples")
assert.match(src, /gl\.dispose\(\)/, "renderer is disposed")
assert.match(src, /IntersectionObserver/, "the loop pauses off screen")
assert.ok(existsSync(new URL("../media/" + slug + "/cover.png", import.meta.url)), "cover exists")
assert.ok(existsSync(new URL("../media/" + slug + "/thumb.webp", import.meta.url)), "thumb exists")

const { RIB, ribbonSize, ribbonPoint, ripple, unfurl, photoFor, spanOf, widthOf, yAt, cropOf } = await liftRegion(src, "ribbon")
const { h, pitch, panels } = ribbonSize()
assert.ok(pitch > h * 1.2, "turns of the ribbon never overlap and leave a gap")
assert.ok(h / RIB.radius < 0.6, "bands are low against the radius, like a coil, not a stack")
assert.ok(spanOf(panels - 1).a1 >= RIB.turns * Math.PI * 2, "enough panels to wind every turn")
const widths = Array.from({ length: panels }, (_, p) => widthOf(p))
assert.ok(Math.max(...widths) / Math.min(...widths) > 1.3, "photos come in mixed widths")
const a = ribbonPoint(0, 1, 0.5, 1), b = ribbonPoint(1, 0, 0.5, 1)
assert.ok(Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z) < 0.2, "panels meet nearly edge to edge along the ribbon")
const q = ribbonPoint(4, 0.3, 0.2, 1)
assert.ok(Math.abs(Math.hypot(q.x, q.z) - RIB.radius) < 1e-9, "at m = 1 every point sits on the cylinder")
assert.ok(Math.abs(yAt(Math.PI * 2 + 1, 1) - yAt(1, 1) - pitch) < 1e-9, "one turn up is one pitch")
const crumpled = ribbonPoint(4, 0.3, 0.2, 0)
assert.ok(Math.hypot(crumpled.x, crumpled.z) < RIB.radius * 0.6, "at m = 0 the ribbon is a small clump")
for (let p = 0; p < panels; p++) {
  const [ku, kv] = cropOf(p)
  assert.ok(ku <= 1 && kv <= 1 && (ku === 1 || kv === 1), "photos are cropped, never stretched")
}
assert.equal(unfurl(0), 0, "starts crumpled")
assert.equal(unfurl(3), 1, "fully unfurled after two seconds")
assert.equal(ripple(1, 2, 0), 0, "no ripple without a touch")
// neighbours: along the ribbon, and any panel overlapping it on the turn above
for (let p = 0; p < panels; p++) {
  if (p + 1 < panels) assert.notEqual(photoFor(p, 9), photoFor(p + 1, 9), "neighbours along the ribbon repeat")
  const { a0, a1 } = spanOf(p)
  for (let o = p + 1; o < panels; o++) {
    const s2 = spanOf(o)
    if (s2.a0 - Math.PI * 2 < a1 && s2.a1 - Math.PI * 2 > a0) assert.notEqual(photoFor(p, 9), photoFor(o, 9), "the panel above repeats (" + p + "," + o + ")")
  }
}
console.log("spiral-ribbon-gallery: ok")
