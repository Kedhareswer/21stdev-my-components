// Install-safety and pose-logic checks for components/journal-spread-carousel.
// Run: node tests/journal-spread-carousel.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const dir = new URL("../components/journal-spread-carousel/", import.meta.url)
const src = readFileSync(new URL("journal-spread-carousel.tsx", dir), "utf8")
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")

// ---- install safety ------------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo.tsx", "journal-spread-carousel.tsx"])

assert.ok(src.includes('height = "100svh"'), "stage height defaults to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full: percentage heights collapse on an installed page")
assert.doesNotMatch(src, /use(Ref|State|Memo|Callback|Effect)</, "no generic hook type arguments (they hang the 21st CLI)")
assert.doesNotMatch(demo, /use(Ref|State|Memo|Callback|Effect)</, "the demo has no generic hook type arguments either")
assert.ok(src.length < 60_000, "the component stays lean: " + src.length)
assert.ok(Buffer.byteLength(demo) < 200_000, "the demo stays under 200 KB: " + Buffer.byteLength(demo))
assert.deepEqual([...demo.matchAll(/(?<!unsplash\.com\/photos\/<id>:?)https?:\/\/[^"'\s)]+/g)].map((m) => m[0]), [], "the demo fetches nothing off-origin")

const cssAt = src.indexOf("const CSS =")
const css = src.slice(cssAt, src.indexOf("\n\n", cssAt))
assert.doesNotMatch(css, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS string")
const flat = css.replace(/"\s*\+\s*\n\s*"/g, "")
let rules = 0
for (const m of flat.matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || sel.startsWith("const CSS") || sel === "FONT +") continue
  rules++
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".jsc-")), "unscoped selector: " + sel)
}
assert.ok(rules >= 30, "the scope check saw real rules, saw " + rules)
assert.match(flat, /\.jsc-bg\{[^}]*max-width:none/, "spread photos override Preflight's max-width")
assert.match(flat, /\.jsc-print img\{[^}]*max-width:none/, "prints override Preflight's max-width")
assert.match(flat, /\.jsc-page\{[^}]*backface-visibility:hidden/, "pages folded past edge-on disappear")
assert.match(flat, /\.jsc-stage\{[^}]*touch-action:pan-y/, "a vertical swipe still scrolls the page")
assert.ok(src.includes("font-family:JSC Hand") && src.includes("data:font/woff2;base64,"), "the handwriting face ships inside the file")

const allowed = new Set(["--jsc-w", "--jsc-h", "--jsc-s"])
for (const [, v] of src.matchAll(/var\((--[a-z-]+)/g)) assert.ok(allowed.has(v), "token not guaranteed in a host: " + v)
assert.deepEqual([...src.matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0]), [], "the component fetches nothing itself")

// ---- motion and runtime hygiene --------------------------------------------------
assert.match(src, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/, "reduced motion is read")
assert.ok(src.includes("const dur = reducedRef.current ? 0 :"), "reduced motion jumps instead of turning")
assert.ok(src.includes("if (!autoPlay || reduced || n < 2 || !root) return"), "reduced motion never autoplays")
assert.ok(src.includes("if (touched.current || !visible || document.hidden || drag.current) return"), "autoplay yields to the reader, off-screen and hidden tabs")
assert.match(flat, /@media \(prefers-reduced-motion:reduce\)/, "CSS transitions honour reduced motion")
assert.ok(src.includes('stage.addEventListener("wheel", onWheel, { passive: true })'), "the wheel listener is passive")
assert.ok(src.includes("if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return"), "a vertical wheel is left to the page")
for (const gone of ['mq.removeEventListener("change", on)', 'stage.removeEventListener("wheel", onWheel)', "ro.disconnect()", "io.disconnect()", "window.clearInterval(id)", "cancelAnimationFrame(raf.current)"])
  assert.ok(src.includes(gone), "cleanup is missing " + gone)
assert.ok(src.includes('aria-roledescription="carousel"') && src.includes('aria-live="polite"'), "carousel semantics")

// Layout is measured only by the ResizeObserver; paint() and frame() read the cache.
assert.doesNotMatch(src, /getBoundingClientRect|offset(Top|Left|Width|Height)|client(Width|Height)|scrollHeight|getComputedStyle|inner(Width|Height)/, "no layout reads")
const body = (name) => {
  const at = src.indexOf("const " + name + " = React.useCallback")
  return src.slice(at, src.indexOf("\n  }, [", at))
}
for (const name of ["paint", "frame"]) {
  const b = body(name)
  assert.ok(b.length > 50, name + " found")
  assert.doesNotMatch(b, /contentRect|ResizeObserver|getBoundingClientRect/, name + " never measures")
  assert.doesNotMatch(b, /\.style\.(width|height|left|top)\b/, name + " writes transforms and opacity only")
}

// ---- the lifted pose logic ---------------------------------------------------------
const start = src.indexOf("// #region pose")
const end = src.indexOf("// #endregion", start)
assert.ok(start > -1 && end > start, "pose region markers missing")
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))

const W = 1000
const c = L.poseFor(0, W)
assert.equal(c.x, 0)
assert.equal(c.z, -0)
assert.ok(c.left > 0 && c.left < 10 && c.right < 0 && c.right > -10, "the open spread keeps a slight V")
assert.equal(c.shadeLeft, 0)
const r1 = L.poseFor(1, W)
assert.ok(r1.x > W / 2, "the first right page clears the open spread")
assert.ok(r1.right < -70 && r1.right > -90, "stacked right pages turn edge-on towards the middle")
assert.ok(r1.left > 90, "the left page folds shut, past edge-on, so it hides")
const l1 = L.poseFor(-1, W)
assert.equal(l1.x, -r1.x, "the stacks mirror")
assert.equal(l1.left, -r1.right)
const r3 = L.poseFor(3, W)
assert.ok(r3.x > r1.x && r3.z < r1.z, "further pages step out and back")
assert.ok(L.poseFor(8, W).hidden && !L.poseFor(7, W).hidden, "only seven pages a side render")
// Mid-turn the leaving and arriving spreads overlap, so the stage never shows a hole.
const leaving = L.poseFor(-0.5, W)
const arriving = L.poseFor(0.5, W)
assert.ok(Math.abs(leaving.right) < 90 && Math.abs(arriving.left) < 90, "both folding pages still face the reader halfway")
const reach = (q, deg) => (W / 2) * Math.cos((Math.abs(deg) * Math.PI) / 180)
assert.ok(leaving.x + reach(leaving, leaving.right) > arriving.x - reach(arriving, arriving.left), "halfway the two spreads meet")

assert.equal(L.spreadAspect(375, 700), 0.86, "portrait phones get taller pages")
assert.equal(L.spreadAspect(1280, 800), 1.25)
assert.equal(L.spreadWidth(0, 500), 0)
assert.equal(L.spreadWidth(1280, 700), Math.round(Math.min(1280 * 0.54, 700 * 0.9 * 1.25)))
assert.ok(L.spreadWidth(4000, 3000) <= 980, "capped on huge screens")
assert.equal(L.settle(2.4, 0, 9), 2)
assert.equal(L.settle(2.4, 3, 9), 3, "a flick carries to the next spread")
assert.equal(L.settle(0.2, -20, 9), 0, "clamped at the first spread")
assert.equal(L.settle(7.9, 20, 9), 8, "clamped at the last spread")
assert.equal(L.durationFor(0), 0)
assert.equal(L.durationFor(1), 560)
assert.ok(L.durationFor(8) < 8 * 560 / 2, "long jumps riffle faster per page")
assert.equal(L.easeInOut(0), 0)
assert.equal(L.easeInOut(1), 1)
assert.equal(L.easeOut(1), 1)
assert.equal(L.clamp(5, 0, 3), 3)

console.log("journal-spread-carousel: ok")
