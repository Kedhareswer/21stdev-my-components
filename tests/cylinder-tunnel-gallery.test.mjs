// Install-safety and tunnel-geometry checks for components/cylinder-tunnel-gallery.
// Run: node tests/cylinder-tunnel-gallery.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync, existsSync } from "node:fs"
import { liftRegion } from "./_component-safety.mjs"

const slug = "cylinder-tunnel-gallery"
const dir = new URL("../components/" + slug + "/", import.meta.url)
const src = readFileSync(new URL(slug + ".tsx", dir), "utf8").replace(/\r\n/g, "\n")
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")

assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo-scroll.tsx", "demo.tsx", slug + ".tsx"].sort(), "folder holds only the publishable files")
const imports = [...new Set([...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1]))]
assert.deepEqual(imports, ["react", "three"], "React and three only")
const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"))
assert.ok(pkg.dependencies.three, "three is declared")
const ts = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")
assert.ok(ts.includes('"@/components/ui/' + slug + '": ["./components/' + slug + "/" + slug + '.tsx"]'), "tsconfig paths line")
assert.match(demo, /from "@\/components\/ui\/cylinder-tunnel-gallery"/, "demo imports the installed path")
assert.match(demo, /mode="auto"/, "the demo shows the motion unattended")
assert.doesNotMatch(demo, /https?:\/\//, "the demo links nowhere")
assert.match(src, /^"use client"/, "client component")
assert.match(src, /export default function CylinderTunnelGallery\(/, "default export")
assert.doesNotMatch(src + demo, /\bh-full\b/, "no h-full")
assert.doesNotMatch(src + demo, /use(Ref|State|Memo|Callback|Reducer|Context)</, "no generic hook type arguments")
assert.match(src, /height = "100svh"/, "height defaults to a definite length")
assert.match(src, /\.ctg-root\{[^}]*width:100%/, "root states its width")
assert.ok(src.includes('const IMG = "https://kedhar-components.pages.dev/cylinder-tunnel-gallery/"'), "image base is the catalogue")
for (const h of new Set(src.match(/https:\/\/[a-z0-9.-]+/gi))) assert.equal(h, "https://kedhar-components.pages.dev", "unexpected host " + h)
for (let i = 1; i <= 16; i++) assert.ok(existsSync(new URL("../dev/public/" + slug + "/tile-" + String(i).padStart(2, "0") + ".webp", import.meta.url)), "tile " + i)
const css = src.slice(src.indexOf("const CSS ="), src.indexOf("\n\n", src.indexOf("const CSS =")))
assert.doesNotMatch(css, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS string")
for (const m of css.replace(/"\s*\+\s*\n\s*"/g, "").matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || sel.startsWith("const CSS")) continue
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".ctg-")), "unscoped selector: " + sel)
}
assert.doesNotMatch(src, /var\(--/, "no tokens needed")
assert.match(css, /@media \(prefers-reduced-motion:reduce\)/, "CSS honours reduced motion")
assert.match(src, /if \(!reduce\.matches\) twist \+=/, "reduced motion stops the twist")
assert.match(src, /p \+= \(target - p\) \* \(reduce\.matches \? 1 : Math\.min\(1, dt \* 6\)\)/, "scroll input is eased")
assert.match(src, /gl\.dispose\(\)/, "renderer is disposed")
assert.match(src, /IntersectionObserver/, "the loop pauses off screen")
assert.ok(existsSync(new URL("../media/" + slug + "/cover.png", import.meta.url)), "cover exists")
assert.ok(existsSync(new URL("../media/" + slug + "/thumb.webp", import.meta.url)), "thumb exists")

const { TUBE, cameraAt, tileAt, photoFor, autoDive } = await liftRegion(src, "tunnel")
const c0 = cameraAt(0), c1 = cameraAt(1)
assert.equal(c0.pitch, 0, "starts looking down the tube")
assert.ok(Math.abs(c1.pitch - Math.PI / 2) < 1e-9, "ends facing the wall")
assert.ok(c1.z > -TUBE.length + 4, "stops short of the end disc")
let prev = 1
for (let p = 0; p <= 1; p += 0.05) { const z = cameraAt(p).z; assert.ok(z <= prev + 1e-9, "the camera only moves forward as p grows"); prev = z }
const t = tileAt(3, 5)
assert.ok(Math.abs(Math.hypot(t.x, t.y) - TUBE.radius) < 1e-9, "tiles sit on the wall")
assert.ok(t.w < TUBE.radius * ((Math.PI * 2) / TUBE.around), "tiles leave a grout gap around")
assert.ok(t.h < TUBE.length / TUBE.rings, "and along")
assert.ok(Math.abs(tileAt(1, 0).theta - tileAt(0, 0).theta - Math.PI / TUBE.around) < 1e-9, "rings alternate by half a tile")
// the flat tiles' edges must stay in front of the grout cylinder
const edge = TUBE.radius / Math.cos(Math.PI / TUBE.around)
assert.ok(/CylinderGeometry\(TUBE\.radius \+ 0\.45/.test(src) && edge < TUBE.radius + 0.45, "grout sits behind the tile edges")
for (let r = 0; r < TUBE.rings; r++) for (let i = 0; i < TUBE.around; i++) {
  const k = photoFor(r, i, 16)
  assert.notEqual(k, photoFor(r, (i + 1) % TUBE.around, 16), "neighbours around repeat")
  if (r + 1 < TUBE.rings) { assert.notEqual(k, photoFor(r + 1, i, 16), "neighbours along repeat"); assert.notEqual(k, photoFor(r + 1, (i + TUBE.around - 1) % TUBE.around, 16), "brick neighbours repeat") }
}
assert.equal(autoDive(0), 0, "auto loop starts at the mouth")
assert.equal(autoDive(6.5), 1, "holds on the wall")
assert.ok(autoDive(10.9) < 0.01, "floats back out")
console.log("cylinder-tunnel-gallery: ok")
