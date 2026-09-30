// Install-safety and layout checks for components/memory-folder-preloader.
// Run: node tests/memory-folder-preloader.test.mjs
//
// The preloader carries its own photographs and its own lettering, so the
// failures worth guarding are an asset sneaking in from outside, a style rule
// leaking into the host page, and the fan layout dealing a photograph on top of
// the folder it is supposed to be framing.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const dir = new URL("../components/memory-folder-preloader/", import.meta.url)
const src = readFileSync(new URL("memory-folder-preloader.tsx", dir), "utf8")
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")
const gate = readFileSync(new URL("demo-gate.tsx", dir), "utf8")

// ---- 1. install safety ------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import the component may have")
assert.doesNotMatch(src, /@import|@font-face/, "no @import or font files — the lettering is outlines")
assert.doesNotMatch(src, /https?:\/\//, "no remote asset: every default photograph is drawn")
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.ok(src.includes("React.useId()"), "SVG filter/gradient ids are per instance")
for (const d of [demo, gate]) {
  assert.ok(d.includes('from "@/components/ui/memory-folder-preloader"'), "demos import the installed path")
}
assert.doesNotMatch(demo, /<div/, "the default demo stays full-bleed, no wrapper")

// ---- 2. scoped CSS -----------------------------------------------------------
const cssMatch = src.match(/const CSS = `([\s\S]*?)`/)
assert.ok(cssMatch, "CSS block present")
const css = cssMatch[1]
assert.doesNotMatch(css, /\$\{|`/, "no interpolation or backticks inside the CSS string")
assert.doesNotMatch(css, /^\s*(\*|body|html|:root)\s*[{,]/m, "no bare global resets")
let rules = 0
for (const match of css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(?<=^|[{}])\s*([^{}]+?)\s*\{/g)) {
  const sel = match[1].trim()
  if (sel.startsWith("@") || /^(from|to|[\d.]+%)$/.test(sel)) continue
  rules++
  assert.ok(
    sel.split(",").every((s) => s.trim().startsWith(".mfp-")),
    `unscoped selector would leak into the host page: ${sel}`,
  )
}
assert.ok(rules >= 40, `expected the full rule set, saw ${rules}`)
assert.match(css, /\.mfp-root svg\{max-width:none\}/, "SVG media opts out of Preflight's max-width")
assert.match(css, /\.mfp-img > svg,\.mfp-img > img\{[^}]*max-width:none/, "photographs opt out of Preflight's max-width")
assert.match(css, /prefers-reduced-motion: reduce/, "honours reduced motion in CSS")
assert.ok(src.includes('matchMedia("(prefers-reduced-motion: reduce)")'), "and skips the drop sequence in JS")

// The develop effect only reads as one if both ends list the same filter
// functions in the same order — otherwise the browser snaps instead of easing.
const fresh = css.match(/\.mfp-img\[data-fresh\]\{filter:([^}]*)\}/)[1]
const developed = [...src.match(/filter: i < developed \? (.*?) : undefined/)[1].matchAll(/"([^"]*)"/g)].map((m) => m[1]).join("")
const fns = (f) => [...f.matchAll(/([a-z-]+)\(/g)].map((m) => m[1]).join(",")
assert.equal(fns(fresh), fns(developed), "develop filter lists must match to interpolate")

// ---- 3. lettering --------------------------------------------------------------
const glyphs = src.slice(src.indexOf("const GLYPHS"), src.indexOf("const SPACE"))
for (const ch of "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789") {
  const key = /\d/.test(ch) ? `"${ch}"` : ch
  assert.ok(glyphs.includes(`\n  ${key}: [`), `glyph missing: ${ch}`)
}
assert.match(src, /Pinyon Script \(SIL OFL 1\.1/, "the font licence travels with the outlines")

// ---- 4. layout, executed --------------------------------------------------------
const start = src.indexOf("// #region layout")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "layout region markers missing")
const js = src
  .slice(start, end)
  .replace(/ as keyof typeof FRAME_SIZE/g, "")
  .replace(/:\s*(number|string\[\])(?=[,)])/g, "")
const { layoutMemories } = await import("data:text/javascript," + encodeURIComponent(js))

const frames = Array.from({ length: 12 }, (_, i) => ["polaroid", "print", "square"][i % 3])
const overlaps = (a, b) => a.l < b.r && a.r > b.l && a.t < b.b && a.b > b.t

for (const [W, H] of [[1440, 900], [1280, 720], [1920, 1080], [390, 844], [768, 1024], [1024, 768]]) {
  const L = layoutMemories(W, H, frames, 7)
  const f = L.folder
  const where = (m) => `${W}x${H}: ${m}`
  assert.ok(f.w > 0 && f.h > 0 && f.w <= W, where("folder fits the stage"))
  const folderBox = { l: f.x - f.w / 2, r: f.x + f.w / 2, t: f.y - f.h / 2 - f.w * 0.05, b: f.y + f.h / 2 }
  for (const k of ["scatter", "tucked", "fan", "exit"]) assert.equal(L[k].length, 12, where(`${k} has a pose per photo`))

  L.fan.forEach((p, i) => {
    const { w, h } = L.photos[i]
    const box = { l: p.x - w / 2, r: p.x + w / 2, t: p.y - h / 2, b: p.y + h / 2 }
    assert.ok(box.l >= 0 && box.t >= 0 && box.r <= W && box.b <= H, where(`fanned photo ${i} stays on stage`))
    assert.ok(!overlaps(box, folderBox), where(`fanned photo ${i} covers the folder`))
  })
  L.scatter.forEach((p, i) => {
    assert.ok(p.x > 0 && p.x < W && p.y > 0 && p.y < H, where(`dropped photo ${i} lands on the table`))
  })
  L.exit.forEach((p) => {
    const d = Math.hypot(p.x - f.x, p.y - f.y)
    assert.ok(d > Math.hypot(W, H) / 2, where("exit throws every photo clear of the stage"))
  })
}

assert.deepEqual(layoutMemories(1440, 900, frames, 7), layoutMemories(1440, 900, frames, 7), "layout is deterministic for a seed")
assert.notDeepEqual(layoutMemories(1440, 900, frames, 7).scatter, layoutMemories(1440, 900, frames, 8).scatter, "seed changes the mess")

console.log("memory-folder-preloader: ok")
