// Install-safety, broad-nib, engraving and licence-maths checks for
// components/seraph-foundry-template.
// Run: node tests/seraph-foundry-template.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const root = new URL("../", import.meta.url)
const dir = new URL("components/seraph-foundry-template/", root)
const src = readFileSync(new URL("seraph-foundry-template.tsx", dir), "utf8")
const pkg = JSON.parse(readFileSync(new URL("package.json", root), "utf8"))

// ---- install safety ------------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react", "gsap", "gsap/ScrollTrigger"], "only react and gsap")
assert.ok(pkg.dependencies?.gsap, "gsap must be declared in the root package.json")
assert.match(src, /gsap\.registerPlugin\(ScrollTrigger\)/, "ScrollTrigger is registered")
for (const f of readdirSync(dir))
  assert.ok(/^(seraph-foundry-template\.tsx|demo(-[a-z0-9-]+)?\.tsx|README\.md)$/.test(f), "unexpected file in the folder: " + f)

assert.ok(src.includes('height = "100svh"'), "stage height defaults to a definite length")
assert.ok(src.includes(".sft-press{position:relative;height:calc(var(--h) * 2.6)"), "the sleeve's scroll length comes from the height prop")
assert.ok(src.includes('"--h": height'), "the height prop feeds --h")
assert.doesNotMatch(src, /className=["'][^"']*\bh-full\b/, "no h-full")
assert.ok(/\.sft-press-stage\{position:sticky;top:0;/.test(src), "the sleeve stage is sticky, not a pin spacer")
assert.doesNotMatch(src, /pin:\s*true/, "no ScrollTrigger pinning (it rewrites React's DOM)")
assert.ok(src.includes("ctx.revert()"), "every trigger and tween is reverted on unmount")

// Fonts: a <link> only when asked for, never an @import.
assert.doesNotMatch(src, /@import/, "no @import")
assert.ok(src.includes("{fontHref && <link rel=\"stylesheet\" href={fontHref} />}"), "fontHref null loads nothing")

// The scoped CSS string: prefixed selectors only, no bare resets, no template holes.
const css = src.match(/const CSS = `([\s\S]*?)`/)[1].replace(/\/\*[\s\S]*?\*\//g, "")
assert.doesNotMatch(css, /\$\{/, "no ${ in the CSS string")
for (const bad of [/(^|[},])\s*\*\s*\{/, /(^|[},])\s*body\s*\{/, /:root/, /(^|[},])\s*html\s*\{/])
  assert.doesNotMatch(css, bad, "no bare resets in the CSS: " + bad)
for (const rule of css.matchAll(/(?:^|\})\s*(?!@)([^{}\s][^{}]*)\{/g)) {
  const sel = rule[1].trim()
  if (!sel || /^(from|to|\d+%)/.test(sel)) continue
  const parts = []
  let depth = 0
  let cur = ""
  for (const ch of sel) {
    if (ch === "(") depth++
    if (ch === ")") depth--
    if (ch === "," && depth === 0) {
      parts.push(cur)
      cur = ""
    } else cur += ch
  }
  parts.push(cur)
  for (const one of parts) {
    const s = one.trim()
    assert.ok(s.startsWith(".sft-") || s.startsWith(":where(.sft-root)") || s.startsWith(":where(.dark) .sft-root"), "unscoped selector: " + s)
  }
}
assert.ok(css.includes("prefers-reduced-motion"), "CSS honours reduced motion")
assert.ok(src.includes('motion: "(prefers-reduced-motion: no-preference)"'), "GSAP choreography only runs with motion allowed")
assert.ok(css.includes("@container"), "layout answers the component's width, not the window")
assert.ok(css.includes(":where(.dark) .sft-root"), "dark mode follows a .dark ancestor")

// Preflight: the canvases and fallback images must not be clamped.
assert.ok(/\.sft-engr-cv\{[^}]*max-width:none/.test(css), "engraving canvas guards max-width")
assert.ok(/\.sft-engr-flat\{[^}]*max-width:none/.test(css), "fallback image guards max-width")

// 21st's CLI tokenizer hangs on generics before the first JSX close tag.
const head = src.slice(0, src.indexOf("</"))
assert.doesNotMatch(head, /use(State|Ref|Memo|Callback)<|Partial<|Record<|Array<|Map<|React\.[A-Za-z]+<|\[K in /, "no generics before the JSX")

// Runtime hygiene.
assert.ok(src.includes('img.crossOrigin = "anonymous"'), "photos are read cross-origin")
assert.ok(src.includes('setState("flat")'), "a tainted or failed photo falls back to a duotone")
assert.ok(src.includes("Math.min(window.devicePixelRatio || 1, 2)"), "cap DPR at 2")
for (const gone of [
  "ro.disconnect()", "io.disconnect()", "gsap.ticker.remove(tick)", "cancelAnimationFrame(raf)",
  'hero?.removeEventListener("pointermove", onMove)', 'disc.removeEventListener("pointerdown", down)',
]) assert.ok(src.includes(gone), "cleanup is missing " + gone)
assert.ok(/images\.unsplash\.com/.test(src), "default photos come from Unsplash")
for (const m of src.matchAll(/https:\/\/([a-z0-9.-]+)\//g))
  assert.ok(["images.unsplash.com", "fonts.googleapis.com", "www.w3.org"].includes(m[1]), "unexpected host " + m[1])

// ---- the lifted logic ---------------------------------------------------------------
const region = (name) => {
  const start = src.indexOf("// #region " + name)
  const end = src.indexOf("// #endregion", start)
  assert.ok(start > -1 && end > start, name + " region markers missing")
  return src.slice(start, end)
}
const lift = (names, exports) =>
  import(
    "data:text/javascript," +
      encodeURIComponent(stripTypeScriptTypes(names.map(region).join("\n")) + "\nexport { " + exports + " }")
  )

{
  const { splitMarked, plainText } = await lift(["split"], "splitMarked, plainText")
  assert.deepEqual(
    splitMarked("Gr[an]der").map((c) => c.ch + (c.hi ? "*" : "")),
    ["G", "r", "a*", "n*", "d", "e", "r"],
  )
  assert.equal(plainText("He[av]en"), "Heaven")
  assert.equal(splitMarked("the").every((c) => !c.hi), true)
  assert.equal(splitMarked("[ab").length, 2, "an unclosed bracket marks to the end, nothing is lost")
}

{
  const N = await lift(["nib"], "spline, nibStroke, starPath")
  const pts = [[0, 0], [100, 0], [200, 80], [300, 80]]
  const c = N.spline(pts, 10)
  assert.equal(c.length, 31)
  assert.deepEqual(c[0], [0, 0], "starts on the first point")
  assert.deepEqual(c[c.length - 1], [300, 80], "ends on the last point")
  for (let i = 0; i < pts.length; i++) assert.deepEqual(c[i * 10], pts[i], "passes through point " + i)

  const s = N.nibStroke(pts, { width: 20, angle: 0, min: 0.1, taper: 0.12 })
  assert.match(s.d, /^M[-\d.]+,[-\d.]+(L[-\d.]+,[-\d.]+)+Z$/, "a closed outline")
  assert.doesNotMatch(s.d + s.line, /NaN|Infinity/)
  assert.ok(s.length > 300 && s.length < 400, "length is sane: " + s.length)
  const w = s.widths
  assert.ok(w[0] < w[Math.floor(w.length / 2)], "tapers at the start")
  assert.ok(w[w.length - 1] < 2.5, "tapers to a hairline at the end")
  assert.ok(Math.max(...w) <= 20 + 1e-9, "never wider than the nib")
  // the pen: a flat nib at 0 rad draws verticals thick and horizontals thin
  const h = N.nibStroke([[0, 0], [50, 0], [100, 0], [150, 0]], { width: 20, angle: 0, min: 0.1, taper: 0.01 })
  const v = N.nibStroke([[0, 0], [0, 50], [0, 100], [0, 150]], { width: 20, angle: 0, min: 0.1, taper: 0.01 })
  const mid = (a) => a[Math.floor(a.length / 2)]
  assert.ok(mid(v.widths) > mid(h.widths) * 5, "thick down, thin across")
  assert.deepEqual(N.nibStroke(pts, { width: 20, angle: 0.3, min: 0.1, taper: 0.12 }), N.nibStroke(pts, { width: 20, angle: 0.3, min: 0.1, taper: 0.12 }), "deterministic")
  assert.match(N.starPath(10), /^M0,-10C.*Z$/)
}

{
  const E = await lift(["engrave"], "levels, coverage, toneGrid, sampleLum, engrave, rng")
  assert.equal(E.levels(0.5, 0.25, 0.75), 0.5)
  assert.equal(E.levels(-1, 0, 1), 0)
  assert.equal(E.levels(2, 0, 1), 1)
  assert.equal(E.coverage(1, 1, 1), 0, "white carries no ink")
  assert.equal(E.coverage(0, 1, 1), 1, "black fills the pitch")
  for (let l = 0; l < 1; l += 0.05) assert.ok(E.coverage(l, 1, 1.2) >= E.coverage(l + 0.05, 1, 1.2), "darker never carries less ink")

  const gw = 40
  const gh = 30
  const flat = (v) => {
    const a = new Uint8ClampedArray(gw * gh * 4)
    for (let i = 0; i < gw * gh; i++) a.set([v, v, v, 255], i * 4)
    return a
  }
  const black = E.toneGrid(flat(0), gw, gh, 0, 1, 0)
  assert.ok(black.every((v) => v === 0))
  const faded = E.toneGrid(flat(0), gw, gh, 0, 1, 0.3)
  assert.ok(faded[0] > 0.99, "corners fade to paper")
  assert.ok(faded[Math.floor(gh / 2) * gw + gw / 2] < 0.01, "the middle keeps its tone")
  assert.equal(E.sampleLum(black, gw, gh, 1e6, -1e6), 0, "sampling clamps to the grid")

  const o = { spacing: 4, angle: 0, threshold: 1, gamma: 1, bend: 0.9, step: 2, fill: 0.9 }
  const W = 200
  const H = 150
  assert.equal(E.engrave(E.toneGrid(flat(255), gw, gh, 0, 1, 0), gw, gh, W, H, o).length, 0, "white paper stays clean")
  const runs = E.engrave(black, gw, gh, W, H, o)
  assert.ok(runs.length >= Math.floor(H / 4) - 1, "one ribbon per line across black")
  for (const r of runs) {
    assert.equal(r.length % 4, 0)
    assert.ok(r.every(Number.isFinite))
    for (let i = 0; i < r.length; i += 4) {
      assert.ok(r[i] >= -4 && r[i] <= W + 4 && r[i + 1] >= -6 && r[i + 1] <= H + 6, "stays on the field")
      assert.ok(Math.abs(Math.abs(r[i + 1] - r[i + 3]) - 4 * 0.9) < 1e-3, "black fills fill × pitch")
    }
  }
  const hatch = E.engrave(E.toneGrid(flat(200), gw, gh, 0, 1, 0), gw, gh, W, H, { ...o, threshold: 0.34, angle: -0.95 })
  assert.equal(hatch.length, 0, "the cross-hatch only cuts the shadows")
  const a = E.rng(5)
  const b = E.rng(5)
  for (let i = 0; i < 20; i++) {
    const x = a()
    assert.equal(x, b(), "seeded speckle repeats")
    assert.ok(x >= 0 && x < 1)
  }
}

{
  const L = await lift(["license"], "seatMultiplier, orderTotal")
  assert.deepEqual([1, 3, 5, 10, 25].map(L.seatMultiplier), [1, 2, 3, 5, 9])
  assert.equal(L.orderTotal([], 1), 0)
  assert.equal(L.orderTotal([49], 1), 49)
  assert.equal(L.orderTotal([49, 69], 1), 106, "two licences save 10%")
  assert.equal(L.orderTotal([49, 69, 129], 5), 593, "three save 20%, times the seat tier")
  for (const s of [1, 3, 5, 10, 25]) assert.ok(L.orderTotal([49, 69], s) <= L.orderTotal([49, 69, 129], s), "more licences never cost less")
}

// ---- demos -----------------------------------------------------------------------------
for (const f of readdirSync(dir).filter((f) => f.startsWith("demo"))) {
  const demo = readFileSync(new URL(f, dir), "utf8")
  const di = [...demo.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
  assert.deepEqual(di, ["@/components/ui/seraph-foundry-template"], f + " imports only the installed path")
  assert.ok(demo.includes('className="w-full"'), f + ": wrapper keeps full width")
}

const tsconfig = readFileSync(new URL("tsconfig.json", root), "utf8")
assert.ok(tsconfig.includes('"@/components/ui/seraph-foundry-template"'), "tsconfig paths line missing")

console.log("seraph-foundry-template: ok")
