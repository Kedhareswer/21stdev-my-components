// Install-safety and strip-logic checks for components/bending-strip-carousel.
// Run: node tests/bending-strip-carousel.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const dir = new URL("../components/bending-strip-carousel/", import.meta.url)
const src = readFileSync(new URL("bending-strip-carousel.tsx", dir), "utf8")

// ---- install safety ------------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react", "gsap", "gsap/ScrollTrigger"], "imports react and gsap only")
const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"))
assert.ok(pkg.dependencies.gsap, "gsap is declared in the root package.json")
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "bending-strip-carousel.tsx", "demo.tsx"])
assert.ok(src.includes('height = "100svh"'), "stage height defaults to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full: percentage heights collapse on an installed page")
assert.match(src, /"calc\(" \+ height \+ " \* "/, "the scroll track is a definite multiple of the stage height")
assert.doesNotMatch(src, /use(Ref|State|Memo|Callback|Effect|LayoutEffect)</, "no generic hook type arguments (they hang the 21st CLI)")
assert.ok(src.length < 60_000, "the component stays lean: " + src.length)

const cssAt = src.indexOf("const CSS =")
const css = src.slice(cssAt, src.indexOf("\n\n", cssAt))
assert.doesNotMatch(css, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS string")
const flat = css.replace(/"\s*\+\s*\n\s*"/g, "")
let rules = 0
for (const m of flat.matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || sel.startsWith("const CSS") || sel.startsWith("FONT +") || /^(from|to)$/.test(sel)) continue
  rules++
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".bsc-")), "unscoped selector: " + sel)
}
assert.ok(rules >= 30, "the scope check saw real rules, saw " + rules)
assert.match(flat, /\.bsc-panel>img\{[^}]*max-width:none/, "strip photos override Preflight's max-width")
assert.match(flat, /\.bsc-pic>img\{[^}]*max-width:none/, "the open photo overrides Preflight's max-width")
assert.match(flat, /\.bsc-stage\{position:sticky;top:0/, "the stage pins with sticky, no pin-spacer")
const allowed = new Set(["--bsc-ink", "--bsc-accent", "--bsc-font"])
for (const [, v] of src.matchAll(/var\((--[a-z-]+)/g)) assert.ok(allowed.has(v), "token not guaranteed in a host: " + v)
assert.deepEqual([...src.matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0]), [], "the component fetches nothing itself")

// ---- runtime hygiene -------------------------------------------------------------
assert.match(src, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/, "reduced motion is read")
assert.match(flat, /@media \(prefers-reduced-motion:reduce\)/, "CSS transitions honour reduced motion")
assert.ok(src.includes('start: "top top"') && src.includes('end: "bottom bottom"'), "follows the whole track")
assert.ok(src.includes("self.getVelocity()"), "the bend comes from ScrollTrigger's own speed reading")
assert.ok(src.includes("new ResizeObserver") && src.includes("entries[0].contentRect"), "sizes come from ResizeObserver")
assert.ok(src.includes("new IntersectionObserver"), "pauses off-screen")
// No layout reads anywhere: the open view grows from a rect worked out from cached numbers.
assert.doesNotMatch(src, /getBoundingClientRect|offset(Top|Left|Width|Height)|client(Width|Height)|scrollHeight|getComputedStyle|inner(Width|Height)/, "no layout reads")
assert.doesNotMatch(src, /touch-action:none|passive: false|addEventListener\("wheel"/, "the page scroll is never hijacked")
for (const gone of ["cancelAnimationFrame(raf)", "trigger.kill()", "ro.disconnect()", "io.disconnect()", 'mq.removeEventListener("change", onMq)', "tl.kill()"])
  assert.ok(src.includes(gone), "cleanup is missing " + gone)
assert.ok(src.includes('aria-roledescription="carousel"') && src.includes('aria-live="polite"'), "carousel semantics")
assert.ok(src.includes('role="dialog"') && src.includes('e.key === "Escape"'), "the open view is a dialog that Esc closes")
assert.match(src, /tabIndex=\{i < n \? 0 : -1\}/, "loop copies stay out of the tab order")
assert.doesNotMatch(src, /autoplay|setInterval/, "no autoplay: the scroll drives it")

// ---- the lifted strip logic ---------------------------------------------------------
const start = src.indexOf("// #region strip")
const end = src.indexOf("// #endregion", start)
assert.ok(start > -1 && end > start, "strip region markers missing")
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))

const flatPose = L.panelPose(3, 100, 0)
assert.deepEqual([flatPose.x, flatPose.ry, flatPose.sy], [300, -0, 1], "at rest the strip is flat")
assert.ok(Math.abs(flatPose.z) === 0, "and has no depth")
const bent = L.panelPose(3, 100, 0.8), mirror = L.panelPose(-3, 100, -0.8)
assert.ok(bent.z < -100 && bent.ry < 0, "bent, outer panels sink and turn in")
assert.equal(bent.z, mirror.z, "the drum is symmetric whichever way you scroll")
assert.equal(bent.ry, -mirror.ry)
assert.ok(L.panelPose(40, 100, 1).ry >= -72, "turns are capped")
assert.equal(L.bendFor(0, 1), 0)
assert.equal(L.bendFor(1e6, 1), 1, "bend is clamped")
assert.equal(L.bendFor(-1e6, 1), -1)
assert.equal(L.bendFor(5000, 0), 0, "bend 0 keeps it flat")
assert.equal(L.loopOffset(0, 0, 20), 0)
assert.equal(L.loopOffset(19, 0, 20), -1, "the strip wraps the short way round")
assert.ok(L.copiesFor(10) * 10 >= 24 && L.copiesFor(30) === 2, "enough copies to fill a wide stage")
assert.equal(L.scrollFor(0, 10, 100, 1000), 100)
assert.equal(L.scrollFor(9, 10, 100, 1000), 1000)
assert.equal(L.scrollFor(42, 10, 100, 1000), 1000, "clamped")
assert.equal(L.scrollFor(3, 1, 100, 1000), 100)
assert.equal(L.insetFor(1000, 800, 450, 200, 100, 400, 4), "inset(200px 450px 200px 450px round 4px)")
const [pw, ph] = L.panelSize(1440, 900)
assert.ok(pw >= 60 && pw <= 120 && ph > pw * 3, "desktop panels are tall and narrow " + pw + "x" + ph)
assert.equal(L.pad2(7), "07")

console.log("bending-strip-carousel: ok")
