// Install-safety and glyph/layout checks for components/waving-portfolio-landing.
// Run: node tests/waving-portfolio-landing.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const SLUG = "waving-portfolio-landing"
const read = (file) => readFileSync(new URL(`../components/${SLUG}/${file}`, import.meta.url), "utf8").replace(/\r\n/g, "\n")
const src = read(`${SLUG}.tsx`)
const region = (name) => {
  const a = src.indexOf(`// #region ${name}\n`)
  const b = src.indexOf(`// #endregion ${name}\n`)
  assert.ok(a > -1 && b > a, `region ${name} missing`)
  return src.slice(a, b)
}

/* ---------- nothing travels with it ---------- */

const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.doesNotMatch(src, /https?:\/\//, "no external URL")
assert.doesNotMatch(src, /@import|@font-face|<link\b|<img\b|fetch\(|new Image\(/, "nothing loads at runtime")
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.match(src, /React\.useId\(\)/, "svg ids are namespaced per instance")
assert.doesNotMatch(src, /url\(#[a-z]/, "clip references are built from the instance id")
assert.ok(src.includes("prefers-reduced-motion:reduce"), "honours reduced motion")

const css = src.match(/const WPL_CSS = `([\s\S]*?)`/)
assert.ok(css, "CSS block present")
assert.doesNotMatch(css[1], /\$\{|`/, "no interpolation inside the CSS string")
assert.doesNotMatch(css[1], /url\(/, "no url() in the style block")
for (const m of css[1].replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(?<=^|[{}])\s*([^{}@]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (/^(from|to|[\d.,%\s]+)$/.test(sel)) continue
  for (const s of sel.split(",")) assert.match(s.trim(), /^\.wpl-/, `selector escapes the component: ${s.trim()}`)
}
for (const m of css[1].matchAll(/([^{}]*svg[^{}]*)\{([^}]*)\}/g)) {
  if (/width:/.test(m[2])) assert.match(m[2], /max-width:none/, `svg rule exposed to Preflight: ${m[1].trim()}`)
}

/* ---------- the intro and the interactions are wired ---------- */

assert.match(src, /<div className="wpl-stage" key=\{run\}>/, "replay remounts the intro")
assert.match(src, /data-intro=\{stage\}/, "intro animations are gated on the stage")
assert.match(src, /\.wpl-root\[data-intro="on"\] \.wpl-rise\{animation:wpl-rise/, "the character rises during the intro")
assert.match(src, /\.wpl-char\.is-waving \.wpl-farm\{animation:wpl-wave/, "waving moves the forearm")
assert.match(src, /\.wpl-tilt\{[^}]*transform:rotate\(-7deg\)/, "the resting pose is the lean, so reduced motion lands on it")
assert.match(src, /role="button"\n\s+tabIndex=\{0\}/, "the character is keyboard reachable")
assert.match(src, /closest\("button,\.wpl-char,\.wpl-cell"\)/, "letter bursts never steal a control's click")
assert.match(src, /<h1 className="wpl-sr">\{title\}<\/h1>/, "the drawn headline has real text")
assert.ok(read("demo.tsx").includes("<WavingPortfolioLanding />"), "default demo is the component, full bleed")
assert.doesNotMatch(read("demo.tsx"), /<div/, "default demo has no wrapper")

/* ---------- glyphs + layout, executed ---------- */

const code = region("glyphs") + region("layout") + "\nexport { glyphPath, glyphWidth, layoutPoster }\n"
const E = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(code)))
for (const ch of "ABCDEFGHIJKLMNOPQRSTUVWXYZ") {
  for (const [w, h, s] of [[115, 230, 22], [220, 480, 42], [15, 26, 3.6]]) {
    const d = E.glyphPath(ch, E.glyphWidth(ch, w, s), h, s)
    assert.ok(d.startsWith("M"), `${ch} draws`)
    assert.doesNotMatch(d, /NaN|Infinity/, `${ch} path is finite at ${w}x${h}`)
  }
}
assert.equal(E.glyphPath("7", 100, 200, 20), "", "unknown characters draw nothing")

const P = E.layoutPoster(["P", "F"], "O", ["RT", "LIO"])
assert.equal(P.cells.map((c) => c.ch).join(""), "PFRTLIOO", "P F / RT LIO / giant O")
const giant = P.cells.find((c) => c.giant)
assert.equal(giant.ch, "O")
assert.equal(giant.y + giant.h, P.bottom, "the giant letter spans both rows")
const [p, f] = P.cells
assert.ok(p.x + p.w < giant.x && f.x + f.w < giant.x, "left rows sit before the giant letter")
assert.ok(P.cells.filter((c) => !c.giant && c.x > giant.x).every((c) => c.x > P.gapStart + 400), "right rows leave the character's gap")
assert.ok(P.charX > P.gapStart && P.charX < P.gapStart + 400, "the character stands in the gap")
const C = E.layoutPoster(["P", "F"], "O", ["RT", "LIO"], true)
assert.ok(C.width < P.width * 0.85 && C.charScale < 1, "compact layout is tighter")
const H = E.layoutPoster(["hel", "wor!"], "l", ["o", "d"])
assert.equal(H.cells.map((c) => c.ch).join(""), "HELWORODL", "input is cleaned to A–Z")
assert.equal(E.layoutPoster(["", ""], "", ["", ""]).cells.length, 1, "an empty poster still has its giant letter")

console.log("waving-portfolio-landing: ok")
