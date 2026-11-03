// Install-safety and wheel-logic checks for components/arc-card-carousel.
// Run: node tests/arc-card-carousel.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const dir = new URL("../components/arc-card-carousel/", import.meta.url)
const src = readFileSync(new URL("arc-card-carousel.tsx", dir), "utf8")

// ---- install safety ------------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react", "gsap", "gsap/ScrollTrigger"], "imports are react and gsap only")
const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"))
assert.ok(pkg.dependencies.gsap, "gsap is declared in the root package.json")
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "arc-card-carousel.tsx", "demo.tsx"])

assert.ok(src.includes('height = "100svh"'), "root height defaults to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full: percentage heights collapse on an installed page")
assert.ok(src.includes('className="acc-stage" style={{ height }}'), "the pinned stage takes its height from the prop")
assert.match(src, /"calc\(" \+ height \+ " \* "/, "the scroll track is a definite multiple of the stage height")
assert.doesNotMatch(src, /use(Ref|State|Memo|Callback)</, "no generic hook type arguments (they hang the 21st CLI)")

const cssAt = src.indexOf("const CSS =")
const css = src.slice(cssAt, src.indexOf("\n\n", cssAt))
assert.doesNotMatch(css, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS string")
const flat = css.replace(/"\s*\+\s*\n\s*"/g, "")
let rules = 0
for (const m of flat.matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || sel.startsWith("const CSS")) continue
  rules++
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".acc-")), "unscoped selector: " + sel)
}
assert.ok(rules >= 6, "the scope check saw real rules, saw " + rules)
assert.match(flat, /\.acc-card>img\{[^}]*max-width:none/, "photos override Preflight's max-width")

const allowed = new Set(["--color-background", "--color-foreground", "--color-muted-foreground", "--color-border", "--color-primary"])
for (const [, v] of src.matchAll(/var\((--[a-z-]+)/g)) assert.ok(allowed.has(v), "token not guaranteed in a host: " + v)

assert.deepEqual([...src.matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0]), [], "the component fetches nothing itself")

// ---- motion and runtime hygiene --------------------------------------------------
assert.match(src, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/, "reduced motion is read")
assert.ok(src.includes("reduced ? target :"), "reduced motion follows the scroll with no smoothing")
assert.match(src, /snap: reduced \? undefined/, "reduced motion drops the eased snap")
assert.ok(src.includes("loop = true"), "the wheel loops by default")
assert.ok(src.includes("if (loop && self.progress >= 1 && self.direction > 0)"), "past the end it wraps to the start")
assert.ok(src.includes("laps -= 1"), "up past the start it wraps to the end")
assert.ok(src.includes('ease: "power2.inOut"'), "the snap uses the reference's broad ease")
assert.ok(src.includes('start: "top top"') && src.includes('end: "bottom bottom"'), "the wheel rolls across the whole pinned track")
assert.match(src, /\.acc-stage\{position:sticky;top:0/, "the stage pins with sticky, no pin-spacer")
assert.doesNotMatch(src, /touch-action:none|passive: false/, "the page scroll is never hijacked")
assert.ok(src.includes('window.addEventListener("wheel", onWheel, { passive: true })'), "the top-wrap wheel listener is passive")
for (const gone of ["ro.disconnect()", 'mq.removeEventListener("change", on)', "gsap.ticker.remove(tick)", 'window.removeEventListener("wheel", onWheel)', "trigger.kill()"])
  assert.ok(src.includes(gone), "cleanup is missing " + gone)
assert.ok(src.includes('aria-roledescription="carousel"') && src.includes('aria-live="polite"'), "carousel semantics")

// ---- the lifted wheel logic ------------------------------------------------------
const start = src.indexOf("// #region wheel")
const end = src.indexOf("// #endregion", start)
assert.ok(start > -1 && end > start, "wheel region markers missing")
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))

assert.equal(L.offsetOf(3, 0, 10), 3)
assert.equal(L.offsetOf(9, 0, 10), -1, "wraps to the short side")
assert.equal(L.offsetOf(5, 0, 10), -5, "the half-way card sits at -n/2")
assert.ok(Math.abs(L.offsetOf(0, -0.25, 10) - 0.25) < 1e-12, "fractional positions")
assert.equal(L.offsetOf(0, 0, 0), 0, "empty list")

assert.equal(L.ringSize(0), 0)
assert.equal(L.ringSize(3), 12, "short lists repeat to at least ten")
assert.equal(L.ringSize(10), 10)
assert.equal(L.ringSize(14), 14)

assert.equal(L.wrapIndex(-1, 10), 9)
assert.equal(L.wrapIndex(10.4, 10), 0)

// The reference, 544 x 680: flat card 203 x 123 centred at (193, 323), neighbours 114 apart.
{
  const g = L.geometry(544, 680)
  assert.ok(Math.abs(g.cardW - 204) < 2 && Math.abs(g.cardH - 124) < 2, "card size")
  const flatC = L.place(0, 14, g)
  assert.ok(Math.abs(flatC.x - 193) < 1 && Math.abs(flatC.y - 323) < 1 && flatC.rot === 0, "the flat card")
  const next = L.place(1, 14, g)
  const gap = Math.hypot(next.x - flatC.x, next.y - flatC.y)
  assert.ok(Math.abs(gap - 117) < 4, "neighbour spacing, got " + gap.toFixed(1))
  assert.ok(next.y < flatC.y && next.rot === -14, "the next card waits above, tipped back, so scrolling on rolls the wheel down")
  // At the wrap (5 steps out) a card is off screen to the left, so the jump never shows.
  const wrap = L.place(-5, 14, g)
  assert.ok(wrap.x + g.cardW / 2 < 0, "the wrap happens off screen")
  // A narrow, tall stage shrinks to fit the width.
  const p = L.geometry(320, 900)
  assert.ok(0.284 * (320 / 0.47) + p.cardW / 2 <= 320, "the flat card fits a narrow stage")
}

assert.equal(L.spans(10, true), 10, "looping runs one step past the last card, back to the first")
assert.equal(L.spans(10, false), 9)
assert.equal(L.spans(0, false), 0)
assert.equal(L.scrollFor(0, 10, 100, 1100), 100, "the first card is flat at the top of the track")
assert.equal(L.scrollFor(9, 10, 100, 1100), 1000)
assert.equal(L.scrollFor(3, 9, 100, 1000), 400, "not looping, the last card sits at the bottom")
assert.equal(L.scrollFor(0, 0, 100, 1000), 100, "a single card never divides by zero")
// The wrap is invisible: the end of one lap and the start of the next are the same position,
// and a position a whole lap on shows the same card.
assert.equal(L.positionAt(1, 0, 10), L.positionAt(0, 1, 10))
assert.equal(L.positionAt(0, 0, 10), L.positionAt(1, -1, 10))
assert.equal(L.wrapIndex(L.positionAt(0.3, 2, 10), 10), L.wrapIndex(L.positionAt(0.3, 0, 10), 10))
for (const count of [3, 7, 10]) {
  const n = L.ringSize(count)
  for (let i = 0; i < n; i++)
    assert.ok(Math.abs(L.offsetOf(i, 1.4, n) - L.offsetOf((i + count) % n, 1.4 + count, n)) < 1e-9, "a lap on, the rim looks the same")
}

// ---- demo ---------------------------------------------------------------------------
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")
assert.ok(demo.includes('from "@/components/ui/arc-card-carousel"'), "demo imports the installed path")
assert.ok(demo.includes('className="w-full"'), "demo wrapper keeps full width")
assert.doesNotMatch(demo, /https?:\/\/(?!unsplash\.com\/photos)/, "demo loads nothing off-origin")
assert.ok(statSync(new URL("demo.tsx", dir)).size < 200_000, "demo stays under 200 KB")

const tsconfig = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")
assert.ok(tsconfig.includes('"@/components/ui/arc-card-carousel"'), "tsconfig paths line missing")

console.log("arc-card-carousel: ok")
