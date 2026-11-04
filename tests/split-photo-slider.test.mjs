// Install-safety and step-logic checks for components/split-photo-slider.
// Run: node tests/split-photo-slider.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const dir = new URL("../components/split-photo-slider/", import.meta.url)
const src = readFileSync(new URL("split-photo-slider.tsx", dir), "utf8")

// ---- install safety ------------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react", "gsap", "gsap/ScrollTrigger"], "imports are react and gsap only")
const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"))
assert.ok(pkg.dependencies.gsap, "gsap is declared in the root package.json")
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo.tsx", "split-photo-slider.tsx"])

assert.ok(src.includes('height = "100svh"'), "stage height defaults to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full: percentage heights collapse on an installed page")
assert.match(src, /"calc\(" \+ height \+ " \* "/, "the scroll track is a definite multiple of the stage height")
assert.doesNotMatch(src, /use(Ref|State|Memo|Callback)</, "no generic hook type arguments (they hang the 21st CLI)")
assert.ok(src.length < 60_000, "the component stays lean: " + src.length)

const cssAt = src.indexOf("const CSS =")
const css = src.slice(cssAt, src.indexOf("\n\n", cssAt))
assert.doesNotMatch(css, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS string")
const flat = css.replace(/"\s*\+\s*\n\s*"/g, "")
let rules = 0
for (const m of flat.matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || sel.startsWith("const CSS") || sel === "FONT +") continue
  rules++
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".sps-")), "unscoped selector: " + sel)
}
assert.ok(rules >= 20, "the scope check saw real rules, saw " + rules)
assert.match(flat, /\.sps-img>img\{[^}]*max-width:none/, "photos override Preflight's max-width")
assert.match(flat, /\.sps-dot>img\{[^}]*max-width:none/, "thumbnails override Preflight's max-width")
assert.match(flat, /\.sps-root\{position:sticky;top:0/, "the stage pins with sticky, no pin-spacer")
// container-type:inline-size stops the track sizing from its content; inside a centring
// flex parent (21st's preview) it would collapse to 0 px without an explicit width.
assert.match(flat, /\.sps-track\{[^}]*width:100%[^}]*container-type:inline-size/, "the size-contained track carries its own width")

const allowed = new Set(["--color-background", "--color-foreground", "--color-muted-foreground", "--color-border", "--color-primary", "--sps-accent", "--sps-ring", "--sps-font"])
for (const [, v] of src.matchAll(/var\((--[a-z-]+)/g)) assert.ok(allowed.has(v), "token not guaranteed in a host: " + v)
assert.deepEqual([...src.matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0]), [], "the component fetches nothing itself")

// ---- motion and runtime hygiene --------------------------------------------------
assert.match(src, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/, "reduced motion is read")
assert.match(src, /snap: reducedMotion \? undefined/, "reduced motion drops the eased snap")
assert.ok(src.includes("if (reduced.current)"), "reduced motion swaps with a short fade")
assert.match(flat, /@media \(prefers-reduced-motion:reduce\)/, "CSS transitions honour reduced motion")
assert.ok(src.includes("loop = true"), "loops by default")
assert.ok(src.includes("if (loop && self.progress >= 1 && self.direction > 0)"), "past the end it wraps to the start")
assert.ok(src.includes("trigger.scroll(trigger.end - 1)"), "up past the start it wraps to the end")
assert.ok(src.includes('start: "top top"') && src.includes('end: "bottom bottom"'), "steps across the whole track")
assert.doesNotMatch(src, /touch-action:none|passive: false/, "the page scroll is never hijacked")
assert.ok(src.includes('window.addEventListener("wheel", onWheel, { passive: true })'), "the wheel listener is passive")
for (const gone of ['mq.removeEventListener("change", on)', 'window.removeEventListener("wheel", onWheel)', "trigger.kill()", "tl.current?.kill()"])
  assert.ok(src.includes(gone), "cleanup is missing " + gone)
assert.ok(src.includes('aria-roledescription="carousel"') && src.includes('aria-live="polite"'), "carousel semantics")
// No layout reads anywhere: transforms are percentages, the scroll is ScrollTrigger's.
assert.doesNotMatch(src, /getBoundingClientRect|offset(Top|Left|Width|Height)|client(Width|Height)|scrollHeight|getComputedStyle|inner(Width|Height)/, "no layout reads")
assert.doesNotMatch(src, /autoplay|setInterval/, "no autoplay: the scroll drives it")

// ---- the lifted step logic ---------------------------------------------------------
const start = src.indexOf("// #region steps")
const end = src.indexOf("// #endregion", start)
assert.ok(start > -1 && end > start, "steps region markers missing")
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))

assert.equal(L.wrap(-1, 5), 4)
assert.equal(L.wrap(5, 5), 0)
assert.equal(L.wrap(3, 0), 0, "empty list")
assert.equal(L.directionFor(0, 1, 5), 1)
assert.equal(L.directionFor(0, 4, 5), -1, "dots take the short way round")
assert.equal(L.directionFor(4, 0, 5), 1, "last to first reads as next")
assert.equal(L.pad2(5), "05")
assert.equal(L.pad2(12), "12")
assert.equal(L.spans(5, true), 5, "looping runs one step back round to the first")
assert.equal(L.spans(5, false), 4)
assert.equal(L.spans(0, false), 0)
assert.equal(L.stepAt(0, 5), 0)
assert.equal(L.stepAt(0.09, 5), 0, "under half a step stays")
assert.equal(L.stepAt(0.11, 5), 1, "past half a step moves on")
assert.equal(L.stepAt(1.2, 5), 5, "clamped")
assert.equal(L.wrap(L.stepAt(1, 5), 5), 0, "the looping end shows the first slide")
assert.equal(L.scrollFor(2, 5, 100, 600), 300)
assert.equal(L.scrollFor(3, 0, 100, 600), 100)

console.log("split-photo-slider: ok")
