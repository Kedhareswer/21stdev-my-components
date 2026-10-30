// Install-safety, vial-geometry and pixel-helper checks for venom-vial-preloader.
// Run: node tests/venom-vial-preloader.test.mjs

import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const dir = new URL("../components/venom-vial-preloader/", import.meta.url)
const read = (f) => readFileSync(new URL(f, dir), "utf8").replace(/\r\n/g, "\n")
const src = read("venom-vial-preloader.tsx")

// ---- 1. Install safety -----------------------------------------------------
assert.deepEqual(
  readdirSync(dir).sort(),
  ["README.md", "demo-elixir.tsx", "demo-gate.tsx", "demo.tsx", "venom-vial-preloader.tsx"],
  "the folder ships the component, its demos and a README, nothing else",
)
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.doesNotMatch(src, /@import/, "no @import — the face arrives by an injected link")
assert.ok(src.includes('document.createElement("link")'), "the face arrives by an injected link")
assert.ok(src.includes("if (!fontHref)"), "fontHref={null} loads nothing")
for (const url of src.matchAll(/https?:\/\/[^"'\s)]+/g))
  assert.match(url[0], /^https:\/\/fonts\.googleapis\.com\//, "unexpected external URL: " + url[0])
assert.doesNotMatch(src, /<img|new Image\(|url\(/, "no image assets — everything is drawn")
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.ok(src.includes("prefers-reduced-motion"), "honours reduced motion")
assert.ok(src.includes('role="progressbar"') && src.includes("aria-valuenow={pct}"), "reports progress")
assert.ok(src.includes('toggleAttribute("inert"'), "the guarded page cannot take focus under the gate")
assert.ok(src.includes("onCompleteRef.current"), "calls onComplete through a ref")
assert.doesNotMatch(src, /\}, \[[^\]]*\bonComplete\b[^\]]*\]\)/, "effects must not depend on onComplete identity")
assert.doesNotMatch(src, /\}, \[[^\]]*\bonFeed\b[^\]]*\]\)/, "effects must not depend on onFeed identity")
assert.ok(src.includes("cancelAnimationFrame(raf)"), "the frame loop is torn down on unmount")
assert.ok(src.includes("ro.disconnect()"), "the resize observer is torn down")
assert.ok(src.includes("clearTimeout(timer)"), "the font timeout is torn down")
assert.ok(src.includes("phaseAtRef.current = performance.now()"), "the arrival is timed from mount, not from 0")
assert.doesNotMatch(src, /console\./, "no debug logging ships")
assert.doesNotMatch(src, /use(State|Ref|Memo|Callback)</, "no generic hook type arguments (the 21st CLI tokenizer hangs on them)")
const generic = src.slice(0, src.indexOf("</")).match(/Partial<|Record<|ReturnType<|React\.[A-Za-z]+</)
assert.equal(generic, null, "no generics before the first JSX close tag: " + (generic && generic[0]))

// ---- 2. Scoped CSS ---------------------------------------------------------
const css = src.match(/const VV_CSS = `([\s\S]*?)`/)[1]
assert.doesNotMatch(css, /\$\{|`/, "no interpolation or backticks in the CSS string")
assert.match(css, /\.vvp-canvas \{[^}]*max-width: none/, "the pixel canvas overrides Preflight's max-width")
assert.match(css, /\.vvp-glow \{[^}]*max-width: none/, "the glow canvas overrides Preflight's max-width")
assert.match(css, /image-rendering: pixelated/, "the art buffer scales up crisp")
let rules = 0
for (const m of css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(?<=^|[{}])\s*([^{}]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || /^(from|to|[\d.]+%)/.test(sel)) continue
  rules++
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".vvp-")), "unscoped selector: " + sel)
}
assert.ok(rules >= 15, `expected a full scoped sheet, saw ${rules} rules`)
for (const k of css.matchAll(/@keyframes ([\w-]+)/g)) assert.ok(k[1].startsWith("vvp-"), "unprefixed keyframes: " + k[1])
for (const phase of ["lift", "rest", "refill"]) assert.ok(css.includes(`[data-phase="${phase}"]`), `phase ${phase} is styled`)

// ---- 3. Vial helpers, executed ----------------------------------------------
const a = src.indexOf("// #region vial")
const b = src.indexOf("// #endregion")
assert.ok(a > -1 && b > a, "vial region missing")
const V = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(a, b))))

// dither and noise
assert.equal(V.VV_BAYER.length, 16)
assert.deepEqual([...V.VV_BAYER].sort((p, q) => p - q), V.VV_BAYER.map((_, i) => (i + 0.5) / 16), "each threshold once")
assert.equal(V.vvBayer(5, 9), V.vvBayer(1, 1), "the matrix tiles every 4 pixels")
for (let i = 0; i < 400; i++) {
  const n = V.vvNoise(i * 0.37 - 20, i * 0.91 + 3)
  const f = V.vvFbm(i * 0.21, -i * 0.43)
  assert.ok(n >= 0 && n <= 1 && f >= 0 && f <= 1, "noise stays in [0, 1]")
}
assert.equal(V.vvNoise(3.2, 7.7), V.vvNoise(3.2, 7.7), "noise is deterministic")
assert.ok(Math.abs(V.vvNoise(4.999, 2) - V.vvNoise(5.001, 2)) < 0.01, "noise is continuous across cells")

// progress
assert.equal(V.vvSimulated(-1), 0)
assert.equal(V.vvSimulated(NaN), 0)
assert.equal(V.vvSimulated(2), 1)
let prev = 0
for (let i = 1; i <= 500; i++) {
  const v = V.vvSimulated(i / 500)
  assert.ok(v >= prev - 1e-9 && v <= 1, "simulated progress never runs backwards")
  prev = v
}

// colours
assert.deepEqual(V.vvRgb("#fff"), [255, 255, 255], "short hex expands")
assert.equal(V.vvRgb("tomato"), null)
assert.equal(V.vvShade("#000000", 1), "#ffffff")
assert.equal(V.vvShade("#ffffff", -1), "#000000")
assert.equal(V.vvShade("#5cf03d", 0), "#5cf03d")
assert.equal(V.vvShade("tomato", 0.5), "tomato", "non-hex passes through untouched")

// layout: the vial fits and centres on every screen
for (const [W, H] of [[1280, 768], [1920, 1080], [2560, 900], [390, 844], [320, 320], [768, 1024]]) {
  for (const px of [0.75, 1, 1.5]) {
    const v = V.vvLayout(W, H, px)
    const tag = `${W}×${H}@${px}`
    assert.ok(v.s >= 2 && Number.isInteger(v.s), tag + ": whole-pixel art scale")
    assert.ok(v.BW * v.s >= W && v.BH * v.s >= H, tag + ": the buffer covers the box")
    assert.ok(v.x0 >= 0 && v.end + 2 <= v.BW, tag + ": the vial is on screen")
    assert.ok(Math.abs(v.x0 + (v.end - v.x0) / 2 - v.BW / 2) <= 1, tag + ": and centred")
    assert.ok(v.cy - V.VV_R - 20 > 0 && v.cy + V.VV_R + 60 < v.BH, tag + ": with room for the widow above and the count below")
    assert.ok(v.x0 < v.xs && v.xs < v.xn && v.xn < v.xc && v.xc < v.xb && v.xb < v.xg, tag + ": parts in order")
    assert.equal(v.end - v.xs, V.VV_TAIL, tag + ": the tail is fixed")
  }
}
assert.ok(V.vvLayout(1920, 1080, 1).s > V.vvLayout(390, 844, 1).s, "bigger screens, bigger pixels")
assert.ok(V.vvLayout(1280, 768, 1.5).s > V.vvLayout(1280, 768, 0.75).s, "pixel scales the art")

// silhouette: continuous, glass inside its outline, closed at the left
const v = V.vvLayout(1280, 768, 1)
assert.equal(V.vvOuter(v, v.x0 - 1), -1, "nothing left of the vial")
assert.equal(V.vvOuter(v, v.xb + 8), -1, "nothing right of the collar")
let last = V.vvOuter(v, v.x0 + 0.5)
for (let x = v.x0 + 1; x < v.xc; x += 0.5) {
  const r = V.vvOuter(v, x)
  assert.ok(Math.abs(r - last) < 3.6, "the glass outline has no jumps at " + x)
  last = r
  const ri = V.vvInner(v, x)
  if (ri > 0) assert.ok(ri <= r - 1.9, "the wall is two pixels thick at " + x)
}
assert.equal(V.vvOuter(v, v.x0 + 30), V.VV_R, "the body is straight")
assert.equal(V.vvInner(v, v.x0 + 0.5), -1, "the rounded end is all wall at its tip")
assert.ok(V.vvInner(v, v.xn + 2) > 0 && V.vvInner(v, v.xn + 2) < V.vvInner(v, v.x0 + 30), "the neck is narrower than the body")
assert.equal(V.vvInner(v, v.xc), -1, "the ring and collar are solid")

// the stopper: symmetric outline, every facet present, a girdle all round
const seen = new Set()
for (let u = -13; u <= 13; u += 0.5) {
  for (let w = -11; w <= 11; w += 0.5) {
    const f = V.vvGem(u, w)
    seen.add(f)
    assert.equal(f === 0, V.vvGem(-u, w) === 0, "the outline is mirror-symmetric")
    assert.equal(f === 0, V.vvGem(u, -w) === 0, "top and bottom match")
  }
}
for (let f = 0; f <= 8; f++) assert.ok(seen.has(f), "facet " + f + " is drawn")
assert.equal(V.vvGem(0, 0), 3, "the table sits in the middle")
assert.equal(V.vvGem(0, -10), 1, "the girdle edges the top")
assert.equal(V.vvGem(12.6, 0), 0, "pointed to the right")
assert.notEqual(V.vvGem(12, 0), 0, "with its point inside")

// the count
for (const ch of "0123456789") {
  const g = V.VV_DIGITS[ch]
  assert.equal(g.length, 7, `digit ${ch} is seven rows`)
  assert.ok(g.every((r) => r.length === 5 && /^[#.]+$/.test(r)), `digit ${ch} is five wide`)
}
assert.notDeepEqual(V.VV_DIGITS["0"], V.VV_DIGITS["8"])
assert.ok(V.VV_PERCENT.every((r) => r.length === 4))
assert.equal(V.vvCountWidth("100", 2), 3 * 12 - 2 + 2 + 4)
assert.ok(V.vvCountWidth("100", 2) > V.vvCountWidth("43", 2))

// the readout
assert.equal(V.vvAmount(43, 48.2, "MB"), "20.7 of 48.2 MB")
assert.equal(V.vvAmount(0, 48.2, "MB"), "0.0 of 48.2 MB")
assert.equal(V.vvAmount(140, 10, "GB"), "10.0 of 10.0 GB", "clamped to the total")
assert.equal(V.vvAmount(50, 0, "MB"), "", "no total, no readout")
assert.equal(V.vvAmount(50, 2, ""), "1.0 of 2.0")

// the fog's dissolve: nothing at 0, everything at 1, and a cleared pixel stays cleared
for (let i = 0; i < 300; i++) {
  const n = V.vvNoise(i * 0.31, i * 0.17)
  const bb = V.VV_BAYER[i % 16]
  assert.equal(V.vvVeil(n, bb, 0), false)
  assert.equal(V.vvVeil(n, bb, 1), true)
  let was = false
  for (let k = 0; k <= 1; k += 0.05) {
    const now = V.vvVeil(n, bb, k)
    assert.ok(!was || now, "the dissolve never un-clears a pixel")
    was = now
  }
}

// ---- 4. Demos ---------------------------------------------------------------
for (const f of ["demo.tsx", "demo-gate.tsx", "demo-elixir.tsx"]) {
  const d = read(f)
  const di = [...d.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1]).filter((m) => m !== "react")
  assert.deepEqual(di, ["@/components/ui/venom-vial-preloader"], f + ": imports only the component")
  assert.doesNotMatch(d, /https?:\/\//, f + ": no external assets")
}
assert.match(read("demo.tsx"), /<VenomVialPreloader loop \/>/, "default demo is the bare looping component")
assert.ok(read("demo-gate.tsx").includes("</VenomVialPreloader>"), "gate demo passes children")

// ---- 5. Wiring --------------------------------------------------------------
const tsconfig = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")
assert.ok(
  tsconfig.includes('"@/components/ui/venom-vial-preloader": ["./components/venom-vial-preloader/venom-vial-preloader.tsx"]'),
  "tsconfig maps the installer path",
)

console.log("venom-vial-preloader: ok")
