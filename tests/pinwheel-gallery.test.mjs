// Install-safety and spin-physics checks for components/pinwheel-gallery.
// Run: node tests/pinwheel-gallery.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync, existsSync } from "node:fs"
import { liftRegion } from "./_component-safety.mjs"

const slug = "pinwheel-gallery"
const dir = new URL("../components/" + slug + "/", import.meta.url)
const src = readFileSync(new URL(slug + ".tsx", dir), "utf8").replace(/\r\n/g, "\n")
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")

assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo.tsx", slug + ".tsx"].sort(), "folder holds only the publishable files")
assert.deepEqual([...new Set([...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1]))], ["react"], "React only")
const ts = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")
assert.ok(ts.includes('"@/components/ui/' + slug + '": ["./components/' + slug + "/" + slug + '.tsx"]'), "tsconfig paths line")
assert.match(demo, /from "@\/components\/ui\/pinwheel-gallery"/, "demo imports the installed path")
assert.doesNotMatch(demo, /https?:\/\//, "the demo links nowhere")
assert.match(src, /^"use client"/, "client component")
assert.match(src, /export default function PinwheelGallery\(/, "default export")
assert.doesNotMatch(src + demo, /\bh-full\b/, "no h-full")
assert.doesNotMatch(src + demo, /use(Ref|State|Memo|Callback|Reducer|Context)</, "no generic hook type arguments")
assert.match(src, /height = "100svh"/, "height defaults to a definite length")
assert.match(src, /\.pwg-root\{[^}]*width:100%/, "root states its width")
assert.ok(src.includes('const IMG = "https://kedhar-components.pages.dev/pinwheel-gallery/"'), "image base is the catalogue")
for (const h of new Set(src.match(/https:\/\/[a-z0-9.-]+/gi))) assert.equal(h, "https://kedhar-components.pages.dev", "unexpected host " + h)
for (let i = 1; i <= 9; i++) assert.ok(existsSync(new URL("../dev/public/" + slug + "/poster-0" + i + ".webp", import.meta.url)), "poster " + i)
const css = src.slice(src.indexOf("const CSS ="), src.indexOf("\n\n", src.indexOf("const CSS =")))
assert.doesNotMatch(css, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS string")
for (const m of css.replace(/"\s*\+\s*\n\s*"/g, "").matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || sel.startsWith("const CSS")) continue
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".pwg-")), "unscoped selector: " + sel)
}
for (const [, v] of src.matchAll(/var\((--[a-z0-9-]+)/g)) assert.ok(["--g", "--h", "--w", "--color-primary"].includes(v), "token not guaranteed: " + v)
assert.match(css, /@media \(prefers-reduced-motion:reduce\)/, "CSS honours reduced motion")
assert.match(src, /vel: reduce\.matches \? 0 : BURST/, "no entry spin under reduced motion")
assert.match(src, /if \(reduce\.matches\) return/, "no fling under reduced motion")
assert.match(src, /mailto:kedhareswer\.12110626@gmail\.com/, "CTA mails Kedhareswer")
assert.equal((src.match(/className="pwg-cta"/g) || []).length, 1, "one primary CTA")
assert.match(src, /IntersectionObserver/, "the loop pauses off screen")
assert.ok(existsSync(new URL("../media/" + slug + "/cover.png", import.meta.url)), "cover exists")
assert.ok(existsSync(new URL("../media/" + slug + "/thumb.webp", import.meta.url)), "thumb exists")

const { relax, blurAmount, cardAngles, zoomFor, IDLE, BURST } = await liftRegion(src, "wheel")
let v = BURST
for (let t = 0; t < 1.15; t += 0.01) v = relax(v, 0.01)
assert.ok(v < BURST * 0.15 && v > IDLE, "the entry spin winds down within SETTLE")
for (let t = 0; t < 10; t += 0.01) v = relax(v, 0.01)
assert.ok(Math.abs(v - IDLE) < 0.01, "then drifts at idle")
assert.ok(Math.abs(relax(-300, 5) + IDLE) < 0.05, "a backwards fling settles to a backwards drift")
assert.equal(blurAmount(IDLE), 0, "no trails at rest")
assert.equal(blurAmount(BURST), 1, "full trails at the burst")
assert.ok(blurAmount(-BURST) === 1, "trails either way")
assert.deepEqual(cardAngles(4), [0, 90, 180, 270], "even spread")
assert.deepEqual(zoomFor(0), { scale: 1, tilt: -58, lift: 0 }, "rest: looking down the axis")
assert.ok(zoomFor(1).scale > 1.5 && zoomFor(1).tilt > -25, "scrolled: closer and swung round")
assert.deepEqual(zoomFor(-1), zoomFor(0), "clamped")
console.log("pinwheel-gallery: ok")
