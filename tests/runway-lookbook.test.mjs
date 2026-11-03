// Install-safety and queue-logic checks for components/runway-lookbook.
// Run: node tests/runway-lookbook.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const dir = new URL("../components/runway-lookbook/", import.meta.url)
const src = readFileSync(new URL("runway-lookbook.tsx", dir), "utf8")

// ---- install safety ------------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react", "gsap", "gsap/ScrollTrigger"], "imports are react and gsap only")
const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"))
assert.ok(pkg.dependencies.gsap, "gsap is declared in the root package.json")
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo.tsx", "runway-lookbook.tsx"])

assert.ok(src.includes('height = "100svh"'), "root height defaults to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full: percentage heights collapse on an installed page")
assert.ok(src.includes('className="rwl-pin" style={{ height }}'), "the pinned stage takes its height from the prop")
assert.match(src, /"calc\(" \+ height \+ " \* "/, "the scroll track is a definite multiple of the stage height")
assert.doesNotMatch(src, /use(Ref|State|Memo|Callback)</, "no generic hook type arguments (they hang the 21st CLI)")

const cssAt = src.indexOf("const CSS =")
const css = src.slice(cssAt, src.indexOf("\n\n", cssAt))
assert.doesNotMatch(css, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS string")
const flat = css.replace(/"\s*\+\s*\n\s*"/g, "").replace(/" \+ FONT \+ "/g, "rwl-display")
let rules = 0
for (const m of flat.matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || sel.startsWith("const CSS")) continue
  rules++
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".rwl-")), "unscoped selector: " + sel)
}
assert.ok(rules >= 20, "the scope check saw real rules, saw " + rules)
assert.match(flat, /\.rwl-fig>img\{[^}]*max-width:none/, "figures override Preflight's max-width")
assert.match(flat, /\.rwl-pic>img\{[^}]*max-width:none/, "product crops override Preflight's max-width")

const allowed = new Set(["--color-background", "--color-foreground", "--color-muted-foreground", "--color-border", "--color-primary"])
for (const [, v] of src.matchAll(/var\((--[a-z-]+)/g)) assert.ok(allowed.has(v), "token not guaranteed in a host: " + v)

assert.deepEqual([...src.matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0]), [], "the component fetches nothing itself")
assert.match(src, /const FONT_DATA = "data:font\/woff2;base64,[A-Za-z0-9+/=]{1000,}"/, "the display face is embedded")
assert.ok(src.includes("SIL Open Font License"), "the embedded font's licence is named")
assert.ok(statSync(new URL("runway-lookbook.tsx", dir)).size < 200_000, "component stays under 200 KB")

// ---- motion and runtime hygiene --------------------------------------------------
assert.match(src, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/, "reduced motion is read")
assert.ok(src.includes("reduced ? target :"), "reduced motion follows the scroll with no smoothing")
assert.match(src, /snap: reduced \? undefined/, "reduced motion drops the eased snap")
assert.ok(src.includes("if (reduced || !ref.current) return"), "reduced motion drops the digit roll")
assert.ok(src.includes("loop = true"), "the queue loops by default")
assert.ok(src.includes("if (loop && self.progress >= 1 && self.direction > 0)"), "past the end it wraps to the start")
assert.ok(src.includes("laps -= 1"), "up past the start it wraps to the end")
assert.ok(src.includes('ease: "power2.inOut"'), "the snap uses a broad ease")
assert.match(src, /\.rwl-pin\{position:sticky;top:0/, "the stage pins with sticky, no pin-spacer")
assert.doesNotMatch(src, /touch-action:none|passive: false/, "the page scroll is never hijacked")
assert.ok(src.includes('window.addEventListener("wheel", onWheel, { passive: true })'), "the top-wrap wheel listener is passive")
for (const gone of ["ro.disconnect()", 'mq.removeEventListener("change", on)', "gsap.ticker.remove(tick)", 'window.removeEventListener("wheel", onWheel)', "trigger.kill()", "tw.kill()"])
  assert.ok(src.includes(gone), "cleanup is missing " + gone)
assert.ok(src.includes('aria-current={current ? "page" : undefined}'), "the current tab and category are marked for assistive tech")
assert.match(flat, /@media \(prefers-reduced-motion:reduce\)\{\.rwl-lnk,\.rwl-nav \.rwl-lnk::after\{transition:none\}\}/, "reduced motion drops the link transitions")
assert.match(flat, /\.rwl-nav\{[^}]*overflow-x:auto/, "the category row scrolls sideways rather than clipping")
for (const label of ['aria-label="Search"', 'aria-label="Wishlist"', '"Cart, "']) assert.ok(src.includes(label), "icon-only header actions are labelled: " + label)
assert.ok(src.includes('aria-roledescription="carousel"') && src.includes('aria-live="polite"'), "carousel semantics")

// ---- the lifted queue logic --------------------------------------------------------
const start = src.indexOf("// #region queue")
const end = src.indexOf("// #endregion", start)
assert.ok(start > -1 && end > start, "queue region markers missing")
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))

assert.equal(L.offsetOf(0, 0, 6), 0, "the current look is at the front")
assert.equal(L.offsetOf(4, 0, 6), 4, "later looks queue behind")
assert.equal(L.offsetOf(5, 0, 6), -1, "the look before has walked off")
assert.ok(Math.abs(L.offsetOf(0, 0.3, 6) + 0.3) < 1e-12, "fractional positions walk the front look off")
assert.equal(L.offsetOf(0, 0, 0), 0, "empty list")
assert.equal(L.wrapIndex(-1, 6), 5)
assert.equal(L.wrapIndex(6.4, 6), 0)

// The reference stage, 492 x 384: front look 0.79 tall centred 0.74 across, feet 0.90 down.
{
  const w = 492
  const h = 384
  const f = L.pose(0, w, h, 6)
  assert.ok(Math.abs(f.x - 364) < 2 && Math.abs(f.y - 346) < 2 && f.scale === 1 && f.blur === 0 && f.alpha === 1, "the front look")
  assert.ok(Math.abs(f.base - 303) < 2, "front height")
  let prev = f
  for (let d = 1; d <= 4; d++) {
    const q = L.pose(d, w, h, 6)
    assert.ok(q.x < prev.x && q.y < prev.y && q.scale < prev.scale, "each look further back is left, higher and smaller")
    assert.ok(q.blur >= prev.blur && q.alpha <= prev.alpha, "and softer and paler")
    prev = q
  }
  const second = L.pose(1, w, h, 6)
  assert.ok(Math.abs(second.scale * f.base - 0.58 * h) < 2, "the second look stands 0.58 tall")
  const gone = L.pose(-1, w, h, 6)
  assert.ok(gone.x - (gone.scale * gone.base) * 0.3 > w, "the look before has walked off the right edge")
  assert.equal(L.pose(5, w, h, 6).alpha, 0, "the look rejoining the back fades in from nothing")
  // Continuous: half a step lands between the two slots.
  const mid = L.pose(0.5, w, h, 6)
  assert.ok(Math.abs(mid.x - (f.x + second.x) / 2) < 1e-9, "poses interpolate")
  // Narrow stages shrink the figures so the front look fits.
  const p = L.pose(0, 390, 700, 6)
  assert.ok(p.base * 0.5 < 390 && p.x + p.base * 0.15 < 390, "the front look fits a phone")
}

{
  const s = L.railStops([2, 2, 3], 100, 4)
  assert.deepEqual(s.groups, [0, 208, 416])
  assert.equal(s.total, 728)
  assert.equal(L.railScroll(0, s.groups, s.total), 0)
  assert.equal(L.railScroll(1, s.groups, s.total), 208, "each look scrolls the rail to its own pieces")
  assert.equal(L.railScroll(1.5, s.groups, s.total), 312, "and glides between them")
  assert.equal(L.railScroll(3, s.groups, s.total), 728, "a lap on, the rail has run once round")
  assert.equal(L.railScroll(-1, s.groups, s.total), 416 - 728, "and backwards too")
  assert.equal(L.wrapOffset(-104, 728, 104), -104, "a card just above stays above")
  assert.equal(L.wrapOffset(-208, 728, 104), 520, "a card further up comes round below")
}

assert.equal(L.spans(6, true), 6, "looping runs one look past the last, back to the first")
assert.equal(L.spans(6, false), 5)
assert.equal(L.positionAt(1, 0, 6), L.positionAt(0, 1, 6), "the wrap is the same position")
for (let i = 0; i < 6; i++)
  assert.ok(Math.abs(L.offsetOf(i, 1.4, 6) - L.offsetOf(i, 7.4, 6)) < 1e-9, "a lap on, the queue looks the same")

// ---- demo ---------------------------------------------------------------------------
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")
assert.ok(demo.includes('from "@/components/ui/runway-lookbook"'), "demo imports the installed path")
assert.doesNotMatch(demo, /https?:\/\//, "demo loads nothing off-origin")
assert.ok(statSync(new URL("demo.tsx", dir)).size < 200_000, "demo stays under 200 KB")

const tsconfig = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")
assert.ok(tsconfig.includes('"@/components/ui/runway-lookbook"'), "tsconfig paths line missing")

console.log("runway-lookbook: ok")
