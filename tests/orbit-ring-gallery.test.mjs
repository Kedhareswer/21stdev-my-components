// Install-safety and ring-logic checks for components/orbit-ring-gallery.
// Run: node tests/orbit-ring-gallery.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const dir = new URL("../components/orbit-ring-gallery/", import.meta.url)
const src = readFileSync(new URL("orbit-ring-gallery.tsx", dir), "utf8")

// ---- install safety ------------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react", "gsap", "gsap/ScrollTrigger"], "imports react and gsap only")
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo.tsx", "orbit-ring-gallery.tsx"])
assert.ok(src.includes('height = "100svh"'), "stage height defaults to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full: percentage heights collapse on an installed page")
assert.match(src, /"calc\(" \+ height \+ " \* "/, "the scroll track is a definite multiple of the stage height")
assert.doesNotMatch(src, /use(Ref|State|Memo|Callback|Effect|LayoutEffect)</, "no generic hook type arguments (they hang the 21st CLI)")
assert.ok(src.length < 60_000, "the component stays lean: " + src.length)

const cssAt = src.indexOf("const CSS =")
const css = src.slice(cssAt, src.indexOf("\n\n", cssAt))
assert.doesNotMatch(css, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS string")
const flat = css.replace(/"\s*\+\s*\n\s*"/g, "").replace(/url\(\\"data:.*?\\"\)/g, "url()")
let rules = 0
for (const m of flat.matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || sel.startsWith("const CSS") || sel.startsWith("FONT +") || /^(from|to)$/.test(sel)) continue
  rules++
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".org-")), "unscoped selector: " + sel)
}
assert.ok(rules >= 30, "the scope check saw real rules, saw " + rules)
assert.match(flat, /\.org-card>img\{[^}]*max-width:none/, "photos override Preflight's max-width")
assert.match(flat, /\.org-stage\{position:sticky;top:0/, "the stage pins with sticky, no pin-spacer")
const allowed = new Set(["--org-bg", "--org-ink", "--org-accent", "--org-font"])
for (const [, v] of src.matchAll(/var\((--[a-z-]+)/g)) assert.ok(allowed.has(v), "token not guaranteed in a host: " + v)
const urls = [...src.matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0]).filter((u) => !u.startsWith("http://www.w3.org/2000/svg"))
assert.deepEqual(urls, [], "the component fetches nothing itself")

// ---- runtime hygiene -------------------------------------------------------------
assert.match(src, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/, "reduced motion is read")
assert.match(flat, /@media \(prefers-reduced-motion:reduce\)/, "CSS animations honour reduced motion")
assert.ok(src.includes("ring = reduced.current ? target"), "reduced motion turns the ring rigidly")
assert.ok(src.includes("new ResizeObserver") && src.includes("entries[0].contentRect"), "sizes come from ResizeObserver")
assert.ok(src.includes("new IntersectionObserver"), "pauses off-screen")
assert.doesNotMatch(src, /getBoundingClientRect|offset(Top|Left|Width|Height)|client(Width|Height)|scrollHeight|getComputedStyle|inner(Width|Height)/, "no layout reads")
assert.doesNotMatch(src, /touch-action:none|passive: false|addEventListener\("wheel"/, "the page scroll is never hijacked")
assert.match(flat, /touch-action:pan-y/, "vertical swipes still scroll the page")
for (const gone of ["cancelAnimationFrame(raf)", "trigger.kill()", "ro.disconnect()", "io.disconnect()", 'stage.removeEventListener("pointermove", onMove)', 'stage.removeEventListener("click", onClick, true)', 'mq.removeEventListener("change", onMq)'])
  assert.ok(src.includes(gone), "cleanup is missing " + gone)
assert.ok(src.includes('aria-roledescription="carousel"') && src.includes('aria-live="polite"'), "carousel semantics")
assert.ok(src.includes("aria-current={i === active}"), "the index marks the front work")
assert.doesNotMatch(src, /autoplay|setInterval/, "no autoplay")

// ---- the lifted ring logic -----------------------------------------------------------
const start = src.indexOf("// #region ring")
const end = src.indexOf("// #endregion", start)
assert.ok(start > -1 && end > start, "ring region markers missing")
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))

const near = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-9, msg + ": " + a + " vs " + b)
near(L.angleOf(0, 0, 12), Math.PI / 2, "card 0 starts at the front")
near(L.angleOf(3, 3, 12), Math.PI / 2, "turning 3 steps brings card 3 to the front")
const front = L.ringPose(Math.PI / 2, 400, 100), back = L.ringPose(-Math.PI / 2, 400, 100)
near(front.depth, 1, "front depth")
near(back.depth, 0, "back depth")
assert.ok(front.scale > back.scale * 2, "far cards are much smaller")
near(front.y, 100, "the front sits low on the ellipse")
assert.equal(L.frontIndex(2.4, 12), 2)
assert.equal(L.frontIndex(-1, 12), 11, "wraps backwards")
assert.equal(L.frontIndex(12.2, 12), 0)
assert.equal(L.lagRate(0, 0), 18, "no viscosity, no lag")
assert.ok(L.lagRate(1, 1) !== L.lagRate(2, 1), "neighbours trail by different amounts")
for (let i = 0; i < 20; i++) assert.ok(L.lagRate(i, 1) > 4, "every card still catches up")
const [rx, ry, cw] = L.ringSize(1440, 900)
assert.ok(rx > ry * 2 && cw >= 90 && cw <= 150, "a wide, flat ellipse on desktop")
const [mrx, mry] = L.ringSize(375, 812)
assert.ok(mrx < 375 / 2 && mry > mrx * 0.6, "a rounder ring on a phone")
assert.equal(L.wrap(-13, 12), 11)
assert.equal(L.pad2(12), "12")

console.log("orbit-ring-gallery: ok")
