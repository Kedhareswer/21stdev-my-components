// Install-safety and wheel-logic checks for components/rotating-flavor-slider.
// Run: node tests/rotating-flavor-slider.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const dir = new URL("../components/rotating-flavor-slider/", import.meta.url)
const src = readFileSync(new URL("rotating-flavor-slider.tsx", dir), "utf8")

// ---- install safety ------------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react", "gsap", "gsap/ScrollTrigger"], "imports are react and gsap only")
const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"))
assert.ok(pkg.dependencies.gsap, "gsap is declared in the root package.json")
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo.tsx", "rotating-flavor-slider.tsx"])

assert.ok(src.includes('height = "100svh"'), "stage height defaults to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full: percentage heights collapse on an installed page")
assert.match(src, /"calc\(" \+ height \+ " \* "/, "the scroll track is a definite multiple of the stage height")
assert.doesNotMatch(src, /use(Ref|State|Memo|Callback)</, "no generic hook type arguments (they hang the 21st CLI)")
assert.ok(src.length < 30_000, "the component stays lean: " + src.length)

const cssAt = src.indexOf("const CSS =")
const css = src.slice(cssAt, src.indexOf("\n\n", cssAt))
assert.doesNotMatch(css, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS string")
const flat = css.replace(/"\s*\+\s*\n\s*"/g, "")
let rules = 0
for (const m of flat.matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || sel.startsWith("const CSS")) continue
  rules++
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".rfs-")), "unscoped selector: " + sel)
}
assert.ok(rules >= 25, "the scope check saw real rules, saw " + rules)
assert.match(flat, /\.rfs-cake>img\{[^}]*max-width:none/, "the photo overrides Preflight's max-width")
assert.match(flat, /\.rfs-decor\{[^}]*max-width:none/, "the garnish overrides Preflight's max-width")
assert.match(flat, /\.rfs-root\{position:sticky;top:0/, "the stage pins with sticky, no pin-spacer")
// container-type:size stops the stage sizing from its content; inside 21st's centring
// flex parent it would collapse to 0 px without explicit widths.
assert.match(flat, /\.rfs-track\{[^}]*width:100%/, "the track carries its own width")
assert.match(flat, /\.rfs-root\{[^}]*width:100%[^}]*container-type:size/, "the size-contained stage carries its own width")
assert.match(flat, /\.rfs-stage\{[^}]*--u:min\(1cqw,1\.7cqh\)/, "one unit scales the whole stage to its box")

const allowed = new Set(["--color-background", "--u"])
for (const [, v] of src.matchAll(/var\((--[a-z-]+)/g)) assert.ok(allowed.has(v), "token not guaranteed in a host: " + v)
assert.deepEqual([...src.matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0]), [], "the component fetches nothing itself")

// ---- motion and runtime hygiene --------------------------------------------------
assert.match(src, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/, "reduced motion is read")
assert.ok(src.includes("still ? 0 : p * turn"), "reduced motion keeps the photo still")
assert.ok(src.includes("reduced.current || n < 2"), "reduced motion drops the eased snap")
assert.ok(src.includes('start: "top top"') && src.includes('end: "bottom bottom"'), "scrubs across the whole track")
assert.ok(src.includes("onUpdate: (self) => apply(positionAt(self.progress, n))"), "the scroll drives one continuous position")
for (const gone of ['mq.removeEventListener("change", onMq)', "st.kill()"]) assert.ok(src.includes(gone), "cleanup is missing " + gone)
assert.ok(src.includes('aria-roledescription="carousel"') && src.includes('aria-live="polite"'), "carousel semantics")
assert.ok(src.includes('aria-label="Previous flavour"') && src.includes('aria-label="Next flavour"'), "labelled arrows")
assert.ok(src.includes('role="button"') && src.includes('e.key === "Enter"'), "ring names work from the keyboard")
assert.doesNotMatch(src, /touch-action:none|passive: false|preventDefault\(\)\s*\}\s*,\s*\{ passive/, "the page scroll is never hijacked")
// The per-frame path (ScrollTrigger onUpdate -> apply) writes transform, opacity and colour only.
assert.doesNotMatch(src, /getBoundingClientRect|offset(Top|Left|Width|Height)|client(Width|Height)|scrollHeight|getComputedStyle|inner(Width|Height)/, "no layout reads")
const applyAt = src.indexOf("const apply = (p: number) => {")
const applyBody = src.slice(applyAt, src.indexOf("\n    }\n", applyAt))
for (const [, prop] of applyBody.matchAll(/style\.([a-zA-Z]+) =/g))
  assert.ok(["transform", "opacity", "backgroundColor", "visibility"].includes(prop), "apply writes a layout property: " + prop)
assert.doesNotMatch(src, /requestAnimationFrame|setInterval|autoplay/i, "no frame loop of its own, no autoplay")

// ---- the lifted wheel logic ---------------------------------------------------------
const start = src.indexOf("// #region wheel")
const end = src.indexOf("// #endregion", start)
assert.ok(start > -1 && end > start, "wheel region markers missing")
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))

assert.equal(L.clamp(5, 0, 3), 3)
assert.equal(L.clamp(-1, 0, 3), 0)
assert.deepEqual(L.ringAngles(5), [-66, -33, 0, 33, 66], "five names centre on the top")
assert.deepEqual(L.ringAngles(1), [0])
assert.deepEqual(L.ringAngles(0), [])
const many = L.ringAngles(12)
assert.ok(Math.abs(many[0] + 70) < 1e-9 && Math.abs(many[11] - 70) < 1e-9, "many names squeeze into the span")
assert.equal(L.pathOffset(0), 25, "the top is a quarter along a path from 9 o'clock")
assert.equal(L.pathOffset(-90), 0)
assert.equal(L.pathOffset(90), 50)
assert.equal(L.positionAt(0, 5), 0)
assert.equal(L.positionAt(0.5, 5), 2)
assert.equal(L.positionAt(1.4, 5), 4, "clamped")
assert.equal(L.positionAt(0.7, 1), 0, "one slide never moves")
assert.equal(L.lerpAt([-64, -32, 0], 0.5), -48, "the dot glides between names")
assert.equal(L.lerpAt([-64, -32, 0], 2), 0, "the last name holds")
assert.equal(L.lerpAt([], 1), 0)
assert.equal(L.photoOpacity(1, 1.25), 1, "the lower photo stays solid")
assert.equal(L.photoOpacity(2, 1.25), 0.25, "the next fades over it")
assert.equal(L.photoOpacity(0, 1.25), 0)
assert.equal(L.photoOpacity(4, 4), 1, "the last rests solid")
assert.equal(L.scrollFor(2, 5, 100, 500), 300)
assert.equal(L.scrollFor(0, 1, 100, 500), 100)

console.log("rotating-flavor-slider: ok")
