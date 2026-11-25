// Install-safety and opening-timeline checks for components/pestle-pharmacy-hero.
// Run: node tests/pestle-pharmacy-hero.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync, existsSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const slug = "pestle-pharmacy-hero"
const dir = new URL("../components/" + slug + "/", import.meta.url)
const src = readFileSync(new URL(slug + ".tsx", dir), "utf8").replace(/\r\n/g, "\n")
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")

// ---------- install safety ----------
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo.tsx", slug + ".tsx"].sort(), "folder holds only the publishable files")
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
const ts = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")
assert.ok(ts.includes('"@/components/ui/' + slug + '": ["./components/' + slug + "/" + slug + '.tsx"]'), "tsconfig paths line")
assert.match(demo, /from "@\/components\/ui\/pestle-pharmacy-hero"/, "demo imports the installed path")
assert.match(src, /^"use client"/, "client component")
assert.doesNotMatch(src + demo, /\bh-full\b/, "no h-full")
assert.match(src, /height = "100svh"/, "definite default height")
assert.ok(src.length < 70_000, "component stays lean, " + src.length)

const cssAt = src.indexOf("const CSS =")
const css = src.slice(cssAt, src.indexOf("\n\n", cssAt))
assert.doesNotMatch(css.replace(/" \+ [A-Za-z_.]+ \+ "/g, ""), /`|\$\{|@import/, "no backticks, ${ or @import in the CSS string")
for (const rule of css.replace(/" \+ [A-Za-z_.]+ \+ "/g, "X").match(/"[^"]*?\{/g) || []) {
  const sel = rule.slice(1).replace(/\{$/, "")
  if (sel.startsWith("@")) continue
  for (const part of sel.split(",")) assert.ok(/^(\.dark )?\.pph-/.test(part.trim()), "rule is scoped: " + part)
}
assert.match(css, /\.pph-root\{[^}]*width:100%/, "root states its width")
assert.match(css, /\.pph-root\{[^}]*container-type:size/, "root is the size container")
assert.match(css, /\.pph-part img\{[^}]*max-width:none/, "cut-outs are guarded against Preflight")
assert.match(src, /width=\{760\} height=\{682\}/, "cap has explicit dimensions")
assert.match(src, /width=\{983\} height=\{486\}/, "base has explicit dimensions")
assert.match(src, /data-intro="wait"/, "renders in its waiting state; JS plays the intro or finishes it")
assert.match(css, /\[data-intro=done\] \.pph-count\{display:none\}/, "the count leaves the page when the intro ends")
for (const e of ["pointerdown", "keydown", "wheel", "touchstart"]) assert.ok(src.includes('"' + e + '"'), "skippable by " + e)
assert.match(src, /intro = true/, "intro is on by default and can be turned off")
assert.match(src, /prefers-reduced-motion: reduce/, "honours reduced motion in CSS")
assert.match(src, /if \(!intro \|\| reduce\) \{ finish\(\); return \}/, "reduced motion goes straight to the finished hero")
assert.match(src, /cancelAnimationFrame\(raf\)/, "stops its frame loop on unmount")
for (const t of ["__SERIF__", "__SANS__", "__SANSB__"]) assert.ok(!src.includes(t), "font placeholder replaced: " + t)
assert.equal((src.match(/font\/woff2;base64,d09GMg/g) || []).length, 3, "three embedded woff2 fonts")

// one primary CTA, one h1, depth order: cap behind the word, base in front
assert.equal((src.match(/className="pph-cta[ "]/g) || []).length, 1, "exactly one filled call to action")
assert.equal((src.match(/<h1 /g) || []).length, 1, "one h1")
const z = (cls) => +(css.match(new RegExp("\\." + cls + "\\{[^}]*z-index:(\\d+)"))[1])
assert.ok(z("pph-cap") < z("pph-word") && z("pph-word") < z("pph-base"), "cap behind the word, base in front")

// hosted pictures, each exists locally
const site = "https://kedhar-components.pages.dev/" + slug + "/"
assert.ok(src.includes(site), "pictures come from the deployed site")
for (const f of ["white.webp", "red.webp"]) assert.ok(existsSync(new URL("../dev/public/" + slug + "/" + f, import.meta.url)), f)
assert.ok(existsSync(new URL("../media/" + slug + "/cover.png", import.meta.url)), "cover")
assert.ok(existsSync(new URL("../media/" + slug + "/thumb.webp", import.meta.url)), "thumb")
assert.doesNotMatch(src + demo, /@[a-z0-9-]+\.(com|io|dev)\b/i, "no email addresses in the component")

// ---------- timeline, run as shipped ----------
const region = src.slice(src.indexOf("// #region timeline"), src.indexOf("// #endregion"))
const m = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(region)))
const { T, TOTAL, CAP, pose, countAt, capClip } = m
// geometry of the 1440x900 hero, measured in the browser
const g = { W: 1440, H: 900, F: 316, bl: 247, bt: 595, bw: 553, bh: 273, cl: 757, ct: 132, cw: 439, ch: 394 }

// phases run in order and hand off with no gap
const wordEnd = T.word[0] + 7 * T.letter + T.letterDur
assert.equal(T.drop[1], T.settle[0], "the landing follows the drop with no gap")
assert.ok(T.split[0] <= T.settle[1], "the split starts before the bounce has fully settled")
assert.ok(T.word[0] <= T.split[1], "the word starts rising before the cap arrives")
assert.ok(T.ui[0] <= wordEnd, "the nav and copy start before the last letter lands")
assert.equal(TOTAL, T.ui[1], "the intro ends when the last UI part lands")
assert.ok(T.ui[0] + 2 * T.uiStep + T.uiDur <= TOTAL + 1, "every UI part has landed by the end")
assert.ok(T.countMin + TOTAL <= 3000, "count plus intro stays within 3 s: " + (T.countMin + TOTAL))

// the final pose is the resting hero: no offsets, no clip, every part in place
const end = pose(TOTAL, g)
for (const [k, v] of Object.entries({ bx: end.base.x, by: end.base.y, br: end.base.r, cx: end.cap.x, cy: end.cap.y, cr: end.cap.r, clip: end.cap.clip, wide: end.contactWide, count: end.count })) {
  assert.ok(Math.abs(v) < 1e-6, "final " + k + " is 0, got " + v)
}
assert.equal(end.cap.front, false, "the cap ends behind the word")
assert.equal(end.contact, 1)
assert.equal(end.capShadow, 1)
assert.ok(end.letters.every((v) => v === 1) && end.ui.every((v) => v === 1), "every letter and UI part is in place")

// it starts with the closed capsule at the top edge, the cap sleeved over the base
const first = pose(0, g)
assert.ok(g.bt + first.base.y + g.bh < 0.65 * g.bh, "the capsule starts at the top edge")
assert.ok(first.cap.front && first.cap.clip > 0, "closed: the cap is in front, its inside clipped away")
for (const t of [0, 200, 540, T.split[0]]) {
  const p = pose(t, g)
  assert.ok(Math.abs(p.cap.r - (p.base.r + CAP.turn)) < 1e-9, "closed at " + t + " ms: the cap is turned onto the axis of the base")
  // the clip line sits on the mouth of the base
  const rad = (p.base.r * Math.PI) / 180
  const mouth = { x: g.bl + p.base.ox + p.base.x, y: g.bt + p.base.oy + p.base.y }
  const pivot = { x: g.cl + p.cap.ox + p.cap.x, y: g.ct + p.cap.oy + p.cap.y }
  const line = { x: pivot.x + p.cap.clip * Math.cos(rad), y: pivot.y + p.cap.clip * Math.sin(rad) }
  assert.ok(Math.hypot(line.x - mouth.x, line.y - mouth.y) < 0.5, "closed at " + t + " ms: the cut of the cap lies on the mouth of the base")
}

// one clock, no teleports: every part moves less than 0.2 F per 10 ms
let prev = pose(0, g)
for (let t = 10; t <= TOTAL; t += 10) {
  const p = pose(t, g)
  const jump = Math.max(Math.hypot(p.base.x - prev.base.x, p.base.y - prev.base.y), Math.hypot(p.cap.x - prev.cap.x, p.cap.y - prev.cap.y))
  assert.ok(jump < 0.2 * g.F, "no jump at " + t + " ms: " + jump.toFixed(1) + " px")
  assert.ok(Math.abs(p.cap.r - prev.cap.r) < 4, "no snap in the turn of the cap at " + t + " ms")
  assert.ok(p.cap.clip <= prev.cap.clip + 1e-9, "the clip only ever opens")
  prev = p
}
// the cap drops behind the word only once its inside is fully shown, and before any letter appears
const swapAt = [...Array(TOTAL / 10).keys()].map((i) => i * 10).find((t) => !pose(t, g).cap.front)
assert.equal(pose(swapAt, g).cap.clip, 0, "the cap is unclipped before it changes layer")
assert.ok(pose(swapAt, g).letters.every((v) => v === 0), "no letter is visible when the cap changes layer")

// the count: time-led, held below 100 until the pictures are in, 100 at the gate
let last = -1
for (let e = 0; e <= T.countMin; e += 25) {
  const c = countAt(e, true)
  assert.ok(c >= last, "count never goes back")
  last = c
}
assert.equal(countAt(T.countMin, true), 100)
assert.ok(countAt(5000, false) <= 92, "holds below 100 while loading")
assert.equal(capClip(0, 400, 360), "none")
assert.match(capClip(20, 400, 360), /^polygon\(/)

console.log("pestle-pharmacy-hero: ok")
