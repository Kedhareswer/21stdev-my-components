// Install-safety and carousel-logic checks for components/dish-orbit-carousel.
// Run: node tests/dish-orbit-carousel.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const dir = new URL("../components/dish-orbit-carousel/", import.meta.url)
const src = readFileSync(new URL("dish-orbit-carousel.tsx", dir), "utf8")
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")

// ---- install safety ------------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react", "gsap"], "imports are react and gsap only")
const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"))
assert.ok(pkg.dependencies.gsap, "gsap is declared in the root package.json")
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo.tsx", "dish-orbit-carousel.tsx"])
const tsconfig = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")
assert.ok(tsconfig.includes('"@/components/ui/dish-orbit-carousel": ["./components/dish-orbit-carousel/dish-orbit-carousel.tsx"]'), "tsconfig path line")
assert.ok(demo.includes('from "@/components/ui/dish-orbit-carousel"'), "the demo imports the installer's path")

assert.ok(src.includes('height = "100svh"'), "root height defaults to a definite length")
assert.ok(src.includes("style={{ height, minHeight: \"fit-content\" }}"), "the root takes its height from the prop")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full: percentage heights collapse on an installed page")
assert.doesNotMatch(src, /use(Ref|State|Memo|Callback|LayoutEffect|Effect)</, "no generic hook type arguments (they hang the 21st CLI)")

const cssAt = src.indexOf("const CSS =")
const css = src.slice(cssAt, src.indexOf("\n\n", cssAt))
assert.doesNotMatch(css, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS string")
const flat = css
  .replace(/\n\s*\/\/[^\n]*/g, "")
  .replace(/"\s*\+\s*\n\s*"/g, "")
  .replace(/" \+ FONT \+ "/g, "dsh-face")
  .replace(/" \+ ITEM \* VISIBLE \+ "/g, "472")
  .replace(/" \+ ITEM \* 3 \+ "/g, "354")
  .replace(/" \+ ITEM \+ "/g, "118")
let rules = 0
for (const m of flat.matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || sel.startsWith("const CSS") || /^\d+%$/.test(sel)) continue
  rules++
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".dsh-")), "unscoped selector: " + sel)
}
assert.ok(rules >= 40, "the scope check saw real rules, saw " + rules)
assert.match(flat, /\.dsh-orbit>img\{[^}]*max-width:none/, "plates override Preflight's max-width")
assert.match(flat, /\.dsh-th img\{[^}]*max-width:none/, "thumbnails override Preflight's max-width")
assert.match(flat, /\.dsh-bd\{[^}]*max-width:none/, "the backdrop overrides Preflight's max-width")
assert.ok(src.includes("width={245} height={245}") && src.includes("width={56} height={56}"), "animated media has explicit width and height")

const allowed = new Set(["--color-background", "--color-foreground", "--color-muted-foreground", "--color-border", "--color-primary", "--dsh-s"])
for (const [, v] of src.matchAll(/var\((--[a-z-]+)/g)) assert.ok(allowed.has(v), "token not guaranteed in a host: " + v)

assert.deepEqual([...src.matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0]), [], "the component fetches nothing itself")
assert.deepEqual([...demo.matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0]), [], "the demo fetches nothing off-origin")
assert.match(src, /const FONT_DATA = "data:font\/woff2;base64,[A-Za-z0-9+/=]{1000,}"/, "the display face is embedded")
assert.ok(src.includes("SIL Open Font License"), "the embedded font's licence is named")
for (const f of ["dish-orbit-carousel.tsx", "demo.tsx"])
  assert.ok(statSync(new URL(f, dir)).size < 200_000, f + " stays under 200 KB")

// ---- motion and runtime hygiene --------------------------------------------------
assert.match(src, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/, "reduced motion is read")
assert.ok(src.includes("from === -1 || from === to || reducedRef.current"), "reduced motion swaps instantly")
assert.match(flat, /@media \(prefers-reduced-motion:reduce\)\{[^}]*\.dsh-track[^}]*transition:none\}/, "reduced motion drops the CSS transitions")
assert.ok(src.includes("tlRef.current.progress(1).kill()"), "a new swap finishes the running one first")
assert.ok(src.includes("new ResizeObserver(fit)") && src.includes("ro.disconnect()"), "the canvas is fitted on resize, and cleaned up")
assert.ok(src.includes('mq.removeEventListener("change", on)'), "the motion query listener is removed")
assert.ok(src.includes('transform-origin:69% -217%'), "plates swing round a pivot above the canvas")
assert.ok(src.includes('svgOrigin: "900 500"'), "the arc turns about its own centre")
assert.doesNotMatch(src, /setInterval|autoplay/i, "no autoplay: the viewer drives it")
assert.match(flat, /\.dsh-plates\{[^}]*touch-action:pan-y/, "swipes leave vertical page scroll alone")
assert.ok(src.includes('aria-roledescription="carousel"') && src.includes('aria-live="polite"'), "carousel semantics")
for (const label of ['aria-label="Previous dish"', 'aria-label="Next dish"', 'aria-label="Search"', 'aria-label="Voice assistant"'])
  assert.ok(src.includes(label), "icon-only controls are labelled: " + label)
assert.ok(src.includes('e.key === "ArrowRight"') && src.includes('e.key === "ArrowLeft"'), "arrow keys step")

// No layout reads inside a per-frame path: the only measurements live in fit().
const fitAt = src.indexOf("const fit = () =>")
const fitEnd = src.indexOf("fit()", fitAt + 20)
const outside = src.slice(0, fitAt) + src.slice(fitEnd)
assert.doesNotMatch(outside, /getBoundingClientRect|offset(Top|Left|Width|Height)|client(Width|Height)|scrollHeight|getComputedStyle|innerWidth|innerHeight/, "layout is read only in the resize fit")
assert.doesNotMatch(src, /onUpdate|requestAnimationFrame/, "no per-frame callbacks")

// ---- the lifted carousel logic -----------------------------------------------------
const start = src.indexOf("// #region carousel")
const end = src.indexOf("// #endregion", start)
assert.ok(start > -1 && end > start, "carousel region markers missing")
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))

assert.equal(L.wrapIndex(5, 5), 0, "past the last dish wraps to the first")
assert.equal(L.wrapIndex(-1, 5), 4, "before the first wraps to the last")
assert.equal(L.wrapIndex(3, 0), 0, "empty list")
assert.equal(L.stepDirection(0, 1, 5), 1)
assert.equal(L.stepDirection(0, 4, 5), -1, "jumping to the last dish swings backwards, the short way")
assert.equal(L.stepDirection(4, 0, 5), 1, "last to first swings forwards")
assert.equal(L.stepDirection(1, 3, 5), 1)
assert.equal(L.stripStart(0, 5, 4), 0)
assert.equal(L.stripStart(3, 5, 4), 1, "the strip slides to keep the current dish in view")
assert.equal(L.stripStart(4, 5, 4), 1, "it never slides past the end")
assert.equal(L.stripStart(2, 3, 4), 0, "short lists never slide")
assert.equal(L.fitSize(4, 62, 320, 0.64), 62, "short names keep the full size")
assert.ok(L.fitSize(14, 62, 320, 0.64) < 36, "long names shrink to fit")
assert.equal(L.arcTurn(0), -0)
assert.equal(L.arcTurn(4), -11)
assert.equal(L.arcTurn(-1), -22)

console.log("dish-orbit-carousel: ok")
