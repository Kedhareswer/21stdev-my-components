// Install-safety, timeline and artwork checks for old-masters-preloader.
// Run: node tests/old-masters-preloader.test.mjs

import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const dir = new URL("../components/old-masters-preloader/", import.meta.url)
const src = readFileSync(new URL("old-masters-preloader.tsx", dir), "utf8")
const demos = Object.fromEntries(
  ["demo", "demo-carmine", "demo-gilt", "demo-vellum", "demo-gate"].map((name) => [name, readFileSync(new URL(name + ".tsx", dir), "utf8")]),
)
const tsconfig = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")

// ---- 1. Install safety -----------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import the component may have")
assert.doesNotMatch(src, /@import/, "no @import: fonts arrive by an injected <link>")
assert.ok(src.includes('document.createElement("link")'), "fonts arrive by an injected link")
assert.ok(src.includes("if (!fontHref)"), "fontHref={null} loads nothing")
for (const url of src.matchAll(/https?:\/\/[^\s"'`)]+/g)) {
  assert.match(url[0], /^https:\/\/fonts\.googleapis\.com\/|^https:\/\/images\.unsplash\.com\//, "unexpected external host: " + url[0])
}
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.doesNotMatch(src, /className=["'][^"']*\bh-full\b/, "no h-full")
assert.ok(src.includes("prefers-reduced-motion"), "honours reduced motion")
assert.ok(src.includes('role="progressbar"'), "reports progress to assistive tech")
assert.ok(src.includes("aria-valuenow={pct}"), "progressbar carries its value")
assert.ok(src.includes('aria-live="polite"'), "the landing is announced")
assert.ok(src.includes("onLoadedRef.current"), "calls onLoaded through a ref")
assert.ok(src.includes("onCompleteRef.current"), "calls onComplete through a ref")
assert.doesNotMatch(src, /\}, \[[^\]]*\bon(Loaded|Complete|Enter)\b[^\]]*\]\)/, "effects must not depend on callback identity")
assert.ok(src.includes("cancelAnimationFrame(raf)"), "the frame loop is torn down on unmount")
assert.ok(src.includes("ro.disconnect()"), "resize observers are torn down on unmount")
assert.doesNotMatch(src, /console\./, "no debug logging ships")
assert.doesNotMatch(src, /toBlob\(/, "the grain is encoded synchronously")
assert.ok(src.includes('maxWidth: "none"'), "the photograph escapes Preflight's img max-width")
assert.doesNotMatch(src, /href=["']#["']/, "no placeholder # links")
// Hooks run in the same order on every render: nothing may be called after the
// early return that hands the page back.
const doneReturn = src.indexOf('if (phase === "done") return')
assert.ok(doneReturn > 0, "the component hands back its children once the stage has lifted")
assert.doesNotMatch(src.slice(doneReturn), /React\.use(State|Effect|Memo|Ref|Callback)\(/, "no hooks after the early return")
// The 21st CLI hangs on generic type arguments ahead of the first JSX close.
const head = src.slice(0, src.indexOf("</"))
assert.doesNotMatch(head, /use(State|Ref|Memo|Callback)<|Partial<|Record<|Array<|Map<|React\.[A-Za-z]+<|\[K in /, "no generics before the JSX")

// ---- 2. Scoped CSS ---------------------------------------------------------
const cssMatch = src.match(/const OM_CSS = `([\s\S]*?)`/)
assert.ok(cssMatch, "OM_CSS block is present")
const css = cssMatch[1]
assert.doesNotMatch(css, /\$\{|`/, "no interpolation or backticks in the CSS string")
assert.doesNotMatch(css, /^\s*(\*|body|html|:root)\s*\{/m, "no bare global resets")
assert.match(css, /\.om-root svg, \.om-root canvas, \.om-root img \{ max-width: none; \}/, "media overrides Preflight's max-width")

let rules = 0
for (const match of css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(?<=^|[{}])\s*([^{}]+?)\s*\{/g)) {
  const sel = match[1].trim()
  if (sel.startsWith("@") || /^(from|to|[\d.]+%)/.test(sel)) continue
  rules++
  assert.ok(
    sel.split(",").every((s) => s.trim().startsWith(".om-")),
    `unscoped CSS selector would leak into the host app: ${sel}`,
  )
}
assert.ok(rules >= 90, `expected a full scoped sheet, saw ${rules} rules`)

for (const phase of ["load", "unveil", "landing", "exit"]) {
  assert.ok(css.includes(`[data-phase="${phase}"]`), `phase ${phase} is styled`)
}
assert.match(css, /\.om-root \.om-cta \{/, "the call to action outranks the button reset")

const reduced = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"))
assert.match(reduced, /--om-px: 0px !important/, "no parallax under reduced motion")
assert.match(reduced, /\.om-star svg, \.om-grain \{ animation: none; \}/, "the stars and grain hold still")
assert.match(reduced, /\.om-l, \.om-init \{ transform: none; opacity: 0;/, "letters fade in instead of rising")

// ---- 3. The pure region, executed ------------------------------------------
const start = src.indexOf("// #region timeline")
const end = src.indexOf("// #endregion", start)
assert.ok(start > -1 && end > start, "timeline region markers missing")
const js = src
  .slice(start, end)
  .replace(/:\s*"light" \| "dark"(?=\s*[,)])/g, "")
  .replace(/:\s*\{ x: number; w: number \}\[\]/g, "")
  .replace(/:\s*(?:number|string|boolean)(?:\[\])*(?=\s*(?:[,)=;{]))/g, "")
const m = await import("data:text/javascript," + encodeURIComponent(js))

// simulated load
assert.equal(m.omSimulated(-1), 0)
assert.equal(m.omSimulated(0), 0)
assert.equal(m.omSimulated(1), 1)
assert.equal(m.omSimulated(2), 1)
let prev = 0
for (let i = 1; i <= 500; i++) {
  const v = m.omSimulated(i / 500)
  assert.ok(v >= prev - 1e-9, `simulated progress must never run backwards (t=${i / 500})`)
  assert.ok(v >= 0 && v <= 1, "simulated progress stays in range")
  prev = v
}
assert.ok(m.omSimulated(0.26) - m.omSimulated(0.12) < 0.08, "the first stall is present")
assert.ok(m.omSimulated(0.5) > 0.5, "the surge after it gets past half")

// the ratio read-out
assert.equal(m.omRatio(0), "0.0000")
assert.equal(m.omRatio(0.47), "0.4700")
assert.equal(m.omRatio(1), "1.0000")
assert.equal(m.omRatio(3), "1.0000")
assert.equal(m.omRatio(-1), "0.0000")

// the meander: one continuous path of arcs and lines, closing on itself
const key = m.omMeander(200, 200, 162, 24, 28)
assert.match(key, /^M-?[\d.]+ -?[\d.]+/, "the meander starts with a move")
assert.doesNotMatch(key, /NaN|Infinity|undefined/, "the meander has no NaN")
assert.match(key, /^[MLA0-9 .\-]+$/, "the meander is plain path data")
assert.equal((key.match(/M/g) || []).length, 1, "one continuous stroke, so it can draw with dashoffset")
assert.equal((key.match(/ A/g) || []).length, 28 * 3, "three arcs per hook")
assert.equal((key.match(/ L/g) || []).length, 28 * 3, "three radial lines per hook")
const first = key.match(/^M(-?[\d.]+) (-?[\d.]+)/)
const last = key.match(/(-?[\d.]+) (-?[\d.]+)$/)
assert.ok(Math.hypot(+first[1] - +last[1], +first[2] - +last[2]) < 0.05, "the ring closes on its start")
const radii = key
  .split(/(?=[MLA])/)
  .map((seg) => seg.trim().slice(1).trim().split(" ").map(Number))
  .map((nums) => Math.hypot(nums[nums.length - 2] - 200, nums[nums.length - 1] - 200))
assert.ok(Math.min(...radii) >= 150 - 0.1 && Math.max(...radii) <= 174 + 0.1, "the band stays within its depth")
assert.notEqual(m.omMeander(0, 0, 100, 10, 12), m.omMeander(0, 0, 100, 10, 16), "the unit count changes the path")
assert.equal((m.omMeander(0, 0, 100, 10, 2).match(/ A/g) || []).length, 4 * 3, "fewer than four units are raised to four")

// the cover rect, the same arithmetic as object-fit: cover
assert.deepEqual(m.omCover(2000, 3000, 1440, 900, 0.5, 0.5), { x: 0, y: -630, w: 1440, h: 2160 })
assert.deepEqual(m.omCover(3000, 2000, 1440, 900, 0.5, 0.5), { x: 0, y: -30, w: 1440, h: 960 })
assert.deepEqual(m.omCover(2000, 3000, 1440, 900, 0.5, 0), { x: 0, y: 0, w: 1440, h: 2160 }, "focal 0 pins the top")
assert.deepEqual(m.omCover(2000, 3000, 1440, 900, 0.5, 1), { x: 0, y: -1260, w: 1440, h: 2160 }, "focal 1 pins the bottom")
assert.deepEqual(m.omCover(2000, 3000, 1440, 900, 0.5, 4), m.omCover(2000, 3000, 1440, 900, 0.5, 1), "focal is clamped")
assert.deepEqual(m.omCover(0, 0, 1440, 900, 0.5, 0.5), { x: 0, y: 0, w: 1440, h: 900 }, "no natural size yet fills the stage")

// the fit
assert.equal(m.omFit(500, 1000, 400, 36), 200)
assert.equal(m.omFit(500, 5000, 400, 36), 400, "capped by height")
assert.equal(m.omFit(500, 10, 400, 36), 36, "never below the floor")
assert.equal(m.omFit(0, 1000, 400, 36), 36, "nothing measured yet falls to the floor")

// the luminance transfer
const light = m.omTransfer(0.4, 0.2, "light")
assert.equal(light.slope, -5)
assert.equal(light.intercept, 2.5)
assert.equal(light.slope * 0.3 + light.intercept, 1, "dark ground shows the word")
assert.equal(light.slope * 0.5 + light.intercept, 0, "lit figure covers it")
const dark = m.omTransfer(0.74, 0.18, "dark")
assert.ok(dark.slope > 0, "a dark figure flips the ramp")
assert.ok(dark.slope * 0.83 + dark.intercept >= 1 - 1e-9, "paper shows the word")
assert.ok(dark.slope * 0.6 + dark.intercept <= 0, "ink covers it")
assert.ok(m.omTransfer(0.5, 0, "light").slope < -40, "zero softness becomes a hard edge, not a division by zero")

// seeded noise, the hash and the barcode
const a = m.omRng(42)
const b = m.omRng(42)
const seq = Array.from({ length: 50 }, () => a())
assert.deepEqual(seq, Array.from({ length: 50 }, () => b()), "the grain is the same on every mount")
assert.ok(seq.every((v) => v >= 0 && v < 1), "rng stays in [0, 1)")
assert.notDeepEqual(seq, Array.from({ length: 50 }, m.omRng(43)), "different seeds differ")
assert.equal(m.omHash("Kallisto"), m.omHash("Kallisto"))
assert.notEqual(m.omHash("Kallisto"), m.omHash("Arcadia"))
assert.ok(m.omHash("") > 0, "the empty string still seeds")
const bars = m.omBars(7, 34, 92)
assert.equal(bars.length, 34)
assert.ok(bars.every((bar) => bar.w >= 1 && bar.x >= 0 && bar.x + bar.w <= 92.01), "bars stay inside the plate")
assert.deepEqual(bars, m.omBars(7, 34, 92), "the barcode is stable")

// the split
assert.deepEqual(m.omSplit("Erudition", true), { initial: "E", rest: ["r", "u", "d", "i", "t", "i", "o", "n"] })
assert.deepEqual(m.omSplit("Kallisto", false), { initial: "", rest: ["K", "a", "l", "l", "i", "s", "t", "o"] })
assert.deepEqual(m.omSplit("", true), { initial: "", rest: [] })

// the baseline of a line-height: 1 box
assert.equal(m.omBaseline(1.13, 0.4), 0.135, "Bodoni's ascent and descent put the baseline 0.135em up")
assert.equal(m.omBaseline(0.8, 0.2), 0.2)
assert.equal(m.omBaseline(0, 0), 0.2, "no metrics falls back")

// ---- 4. No borrowed copy ---------------------------------------------------
for (const mark of [/atlantis/i, /your money/i, /conclusion/i, /talica/i]) {
  assert.doesNotMatch(src + Object.values(demos).join(""), mark, `borrowed reference copy must not ship: ${mark}`)
}

// ---- 5. Demos and wiring ---------------------------------------------------
for (const [name, d] of Object.entries(demos)) {
  assert.ok(d.includes('from "@/components/ui/old-masters-preloader"'), `${name} imports the canonical path`)
  assert.doesNotMatch(d, /href=/, `${name} must not navigate: the workshop routes on the hash`)
  for (const url of d.matchAll(/https?:\/\/[^\s"'`)]+/g)) {
    assert.match(url[0], /^https:\/\/images\.unsplash\.com\//, `${name}: unexpected external host ${url[0]}`)
  }
}
assert.match(demos.demo, /<OldMastersPreloader\s*\/>/, "default demo is the component, untouched")
assert.doesNotMatch(demos.demo, /<div/, "default demo must not wrap the component")
assert.match(demos["demo-carmine"], /progress=\{loaded\}/, "one demo drives real progress")
assert.match(demos["demo-carmine"], /tone="carmine"/, "one demo shows the red tone")
assert.match(demos["demo-gilt"], /scriptInitial/, "one demo shows the script initial")
assert.match(demos["demo-vellum"], /tone="vellum"/, "one demo shows the light tone")
assert.match(demos["demo-vellum"], /subject="dark"/, "the light tone demo flips the mask for ink on paper")
assert.match(demos["demo-gate"], /onComplete=/, "one demo uses it as a gate over a page")
assert.ok(
  tsconfig.includes('"@/components/ui/old-masters-preloader": ["./components/old-masters-preloader/old-masters-preloader.tsx"]'),
  "tsconfig maps the canonical import for npm run check",
)

console.log("old-masters-preloader: ok")
