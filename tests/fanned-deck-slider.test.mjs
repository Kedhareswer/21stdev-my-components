// Install-safety and fan-logic checks for components/fanned-deck-slider.
// Run: node tests/fanned-deck-slider.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const dir = new URL("../components/fanned-deck-slider/", import.meta.url)
const src = readFileSync(new URL("fanned-deck-slider.tsx", dir), "utf8")

// ---- install safety ------------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "imports react only")
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo.tsx", "fanned-deck-slider.tsx"])
assert.ok(src.includes('height = "100svh"'), "stage height defaults to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full: percentage heights collapse on an installed page")
assert.doesNotMatch(src, /use(Ref|State|Memo|Callback|Effect|LayoutEffect)</, "no generic hook type arguments (they hang the 21st CLI)")
assert.ok(src.length < 40_000, "the component stays lean: " + src.length)

const cssAt = src.indexOf("const CSS =")
const css = src.slice(cssAt, src.indexOf("\n\n", cssAt))
assert.doesNotMatch(css, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS string")
const flat = css.replace(/"\s*\+\s*\n\s*"/g, "")
let rules = 0
for (const m of flat.matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || sel.startsWith("const CSS") || /^(from|to)$/.test(sel)) continue
  rules++
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".fds-")), "unscoped selector: " + sel)
}
assert.ok(rules >= 30, "the scope check saw real rules, saw " + rules)
assert.match(flat, /\.fds-card>img\{[^}]*max-width:none/, "photos override Preflight's max-width")
const allowed = new Set(["--fds-ink", "--fds-accent"])
for (const [, v] of src.matchAll(/var\((--[a-z-]+)/g)) assert.ok(allowed.has(v), "token not guaranteed in a host: " + v)
assert.deepEqual([...src.matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0]), [], "the component fetches nothing itself")

// ---- runtime hygiene -------------------------------------------------------------
assert.match(src, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/, "reduced motion is read")
assert.match(flat, /@media \(prefers-reduced-motion:reduce\)/, "CSS animations honour reduced motion")
assert.ok(src.includes("new ResizeObserver") && src.includes("entries[0].contentRect"), "sizes come from ResizeObserver")
assert.ok(src.includes("new IntersectionObserver"), "pauses off-screen")
assert.doesNotMatch(src, /getBoundingClientRect|offset(Top|Left|Width|Height|X|Y)|client(Width|Height)|scrollHeight|getComputedStyle|inner(Width|Height)/, "no layout reads")
assert.doesNotMatch(src, /touch-action:none|passive: false|addEventListener\("wheel"/, "the page scroll is never hijacked")
assert.match(flat, /touch-action:pan-y/, "vertical swipes still scroll the page")
for (const gone of ["cancelAnimationFrame(raf)", "ro.disconnect()", "io.disconnect()", 'deck.removeEventListener("pointermove", onMove)', 'deck.removeEventListener("click", onClick, true)', 'root.removeEventListener("keydown", onKey)', 'mq.removeEventListener("change", onMq)'])
  assert.ok(src.includes(gone), "cleanup is missing " + gone)
assert.ok(src.includes('aria-roledescription="carousel"') && src.includes('aria-live="polite"'), "carousel semantics")
assert.ok(src.includes("aria-current={i === index}"), "the chosen card is marked")
assert.doesNotMatch(src, /autoplay|setInterval/, "no autoplay")

// ---- the lifted fan logic -----------------------------------------------------------
const start = src.indexOf("// #region fan")
const end = src.indexOf("// #endregion", start)
assert.ok(start > -1 && end > start, "fan region markers missing")
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))

const mid = L.fanPose(0, 200, 7), right = L.fanPose(2, 200, 7), left = L.fanPose(-2, 200, 7)
assert.equal(mid.r, 0)
assert.ok(mid.y < 0 && mid.s > 1, "the chosen card is lifted and larger")
assert.ok(right.r > 0 && left.r < 0 && right.r === -left.r, "the fan is symmetric")
assert.ok(right.x === -left.x && right.y === left.y)
assert.ok(right.s < mid.s && right.y > mid.y, "outer cards sit lower and smaller")
assert.ok(L.fanPose(30, 200, 7).r <= 60, "tilt is capped")
assert.ok(L.stiffness(0) > L.stiffness(3), "outer cards answer later")
let x = 0, v = 0, peak = 0
const k = L.stiffness(0), c = 2 * Math.sqrt(k) * 0.72
for (let i = 0; i < 90; i++) {
  ;[x, v] = L.springTo(x, v, 1, 1 / 60, k, c)
  peak = Math.max(peak, x)
}
assert.ok(Math.abs(x - 1) < 0.01, "settles in a second and a half: " + x)
assert.ok(peak > 1.005 && peak < 1.12, "a small, springy overshoot: " + peak)
assert.equal(L.clampIndex(-3, 9), 0)
assert.equal(L.clampIndex(4.4, 9), 4)
assert.equal(L.clampIndex(40, 9), 8)
assert.ok(L.cardWidth(1440, 900) <= 280 && L.cardWidth(375, 812) < 375 * 0.6, "cards size to the stage")

console.log("fanned-deck-slider: ok")
