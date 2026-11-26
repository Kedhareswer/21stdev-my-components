// Install-safety and reel-timeline checks for components/folding-card-reel.
// Run: node tests/folding-card-reel.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync, existsSync } from "node:fs"
import { liftRegion } from "./_component-safety.mjs"

const slug = "folding-card-reel"
const dir = new URL("../components/" + slug + "/", import.meta.url)
const src = readFileSync(new URL(slug + ".tsx", dir), "utf8").replace(/\r\n/g, "\n")
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")

// ---------- install safety ----------
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo.tsx", slug + ".tsx"].sort(), "folder holds only the publishable files")
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual([...new Set(imports)], ["react"], "React only")
const ts = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")
assert.ok(ts.includes('"@/components/ui/' + slug + '": ["./components/' + slug + "/" + slug + '.tsx"]'), "tsconfig paths line")
assert.match(demo, /from "@\/components\/ui\/folding-card-reel"/, "demo imports the installed path")
assert.doesNotMatch(demo, /https?:\/\//, "the demo links nowhere")
assert.match(src, /^"use client"/, "client component")
assert.match(src, /export default function FoldingCardReel\(/, "default export")
assert.doesNotMatch(src + demo, /\bh-full\b/, "no h-full")
assert.doesNotMatch(src + demo, /use(Ref|State|Memo|Callback|Reducer|Context)</, "no generic hook type arguments")
assert.match(src, /height = "100svh"/, "height defaults to a definite length")
assert.match(src, /\.fcr-root\{[^}]*width:100%/, "root states its width")
assert.ok(src.includes('const IMG = "https://kedhar-components.pages.dev/folding-card-reel/"'), "image base is the catalogue")
for (const h of new Set(src.match(/https:\/\/[a-z0-9.-]+/gi))) assert.equal(h, "https://kedhar-components.pages.dev", "unexpected host " + h)
for (let i = 1; i <= 9; i++) assert.ok(existsSync(new URL("../dev/public/" + slug + "/card-0" + i + ".webp", import.meta.url)), "image " + i + " is in dev/public")
const css = src.slice(src.indexOf("const CSS ="), src.indexOf("\n\n", src.indexOf("const CSS =")))
assert.doesNotMatch(css, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS string")
for (const m of css.replace(/"\s*\+\s*\n\s*"/g, "").matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || sel.startsWith("const CSS")) continue
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".fcr-")), "unscoped selector: " + sel)
}
for (const [, v] of src.matchAll(/var\((--[a-z0-9-]+)/g)) assert.ok(["--s", "--lx", "--color-primary"].includes(v), "token not guaranteed: " + v)
assert.match(css, /@media \(prefers-reduced-motion:reduce\)/, "CSS honours reduced motion")
assert.match(src, /const hold = st\.hover \|\| st\.open \|\| !autoPlay \|\| reduce\.matches/, "reduced motion holds the reel")
assert.match(src, /IntersectionObserver/, "the loop pauses off screen")
assert.doesNotMatch(src, /getBoundingClientRect|offset(Top|Left|Width|Height)|client(Width|Height)|getComputedStyle/, "no layout reads")
assert.ok(existsSync(new URL("../media/" + slug + "/cover.png", import.meta.url)), "cover exists")
assert.ok(existsSync(new URL("../media/" + slug + "/thumb.webp", import.meta.url)), "thumb exists")

// ---------- the reel, as shipped ----------
const { pose, reelAt, fallEase, leanShift, UP, DOWN, SPREAD, DEPTH } = await liftRegion(src, "reel")
assert.equal(leanShift(0, 300), 0, "no slide at rest")
assert.ok(Math.abs(leanShift(1, 300) - 0.124) < 1e-9, "full tip slides the stack by the measured amount")
assert.ok(leanShift(0.3, 340) > leanShift(0.3, 209), "big cards need more correction when hovered")
for (let l = 0; l < 1; l += 0.05) assert.ok(leanShift(l + 0.05, 280) >= leanShift(l, 280), "the slide grows with the lift")
assert.doesNotMatch(src, /translate3d\(calc/, "the tipped card never slides off its hinge")
assert.equal(pose(0).angle, UP, "front card leans back")
assert.equal(pose(2).angle, UP + 2 * SPREAD, "deeper cards fan further back")
assert.equal(pose(-1).angle, DOWN, "last fallen card lies forward")
assert.equal(pose(-3).angle, DOWN - 2 * SPREAD, "older fallen cards fan further")
assert.equal(pose(DEPTH + 1).opacity, 0, "cards beyond the stack depth are hidden")
const mid = pose(-0.5)
assert.ok(mid.curl > 40, "the falling card bends mid-fall")
assert.equal(pose(0).curl, 0, "resting cards are flat")
assert.equal(pose(-0.05).curl, 0, "flat as it leaves the stack")
assert.equal(pose(-0.85).curl, 0, "flat again before it lands")
let prev = pose(-0.001).angle
for (let q = 0.02; q <= 0.86; q += 0.02) { const a = pose(-q).angle; assert.ok(a <= prev + 1e-9, "the fall only moves forward until landing"); prev = a }
assert.ok(Math.abs(fallEase(1) - 1) < 1e-9, "lands exactly")
assert.ok(fallEase(0.2) < 0.15, "slow to tip over")
assert.ok(Math.max(...Array.from({ length: 20 }, (_, i) => fallEase(0.86 + i * 0.007))) > 1, "a soft bounce on landing")
assert.equal(reelAt(0, 760, 520), 0, "starts at rest")
assert.equal(reelAt(260, 760, 520), 0.5, "half way through the first flip")
assert.equal(reelAt(700, 760, 520), 1, "holds after the flip")
assert.equal(reelAt(760 * 3 + 130, 760, 520), 3.25, "keeps counting")
console.log("folding-card-reel: ok")
