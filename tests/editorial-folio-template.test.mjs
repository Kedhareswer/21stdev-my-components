// Install-safety and logic checks for components/editorial-folio-template.
// Run: node tests/editorial-folio-template.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const SLUG = "editorial-folio-template"
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
assert.doesNotMatch(src, /@import|@font-face|<link\b|fetch\(|new Image\(/, "nothing loads at runtime")
assert.doesNotMatch(src.replace(/https:\/\/(linkedin|instagram|pinterest)\.com"/g, ""), /https?:\/\//, "no external URL beyond the placeholder profile links")
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.match(src, /minHeight: height/, "the height prop reaches the root")
assert.doesNotMatch(src, /\bh-full\b|height:100%/, "no percentage heights")
assert.match(src, /React\.useId\(\)/, "svg ids are namespaced per instance")
assert.doesNotMatch(src, /url\(#[a-z]/, "svg references are built from the instance id")
assert.doesNotMatch(src, /use(State|Ref|Memo|Callback)</, "hooks are typed without <generics>, so the 21st CLI tokenizer stays linear")
for (const m of src.matchAll(/<img [^>]*\/>/g)) {
  assert.match(m[0], /style=\{\{ maxWidth: "none"/, "every image is guarded against Preflight")
  assert.match(m[0], /width=\{\d+\} height=\{\d+\}/, "every image has explicit size")
}
assert.doesNotMatch(src, /location\.hash|history\.(push|replace)State/, "sheets are internal; the host's URL is untouched")

const css = src.match(/const EFO_CSS = `([\s\S]*?)`/)
assert.ok(css, "CSS block present")
assert.doesNotMatch(css[1], /\$\{|`/, "no interpolation inside the CSS string")
assert.doesNotMatch(css[1], /url\(/, "no url() in the style block")
assert.ok(css[1].includes("prefers-reduced-motion:reduce"), "honours reduced motion")
for (const m of css[1].replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(?<=^|[{}])\s*([^{}@]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (/^(from|to|[\d.,%\s]+)$/.test(sel)) continue
  for (const s of sel.split(/,(?![^(]*\))/)) assert.match(s.trim(), /^\.efo-/, `selector escapes the component: ${s.trim()}`)
}
assert.match(css[1], /\.efo-root :where\(button\)\{/, "base resets carry no specificity, so component classes win")
assert.match(css[1], /\.efo-root :where\(svg\)\{display:block;max-width:none/, "svg guarded against Preflight")
assert.match(css[1], /\.efo-sheet\{container-type:inline-size/, "each sheet lays itself out from its own width")
assert.doesNotMatch(css[1], /\.efo-root\{[^}]*container-type/, "the root is not a container, so the fixed overlays stay on the viewport")

/* ---------- the interactions are wired ---------- */

assert.match(src, /if \(k === "g"\)/, "G toggles the contact sheet")
assert.match(src, /e\.key === "ArrowRight" \|\| k === "j"/, "→ / J step to the next sheet")
assert.match(src, /t\.isContentEditable \|\| \/\^\(INPUT\|TEXTAREA\|SELECT\)\$\/\.test\(t\.tagName\)/, "shortcuts never fire while typing")
assert.match(src, /aria-label="Contact sheet"/, "the contact sheet is a labelled dialog")
assert.match(src, /setAttribute\("inert", ""\)/, "contact-sheet thumbnails are inert")
assert.match(src, /aria-label=\{"Postcard: " \+ w\.title\}/, "the postcard viewer is a labelled dialog")
assert.match(src, /e\.key\.toLowerCase\(\) === "f"/, "F flips the postcard")
assert.match(src, /aria-pressed=\{liked\}/, "likes are toggle buttons")
assert.match(src, /onDoubleClick=/, "double-click likes a post")
assert.match(src, /role="tablist"/, "roles are tabs")
assert.match(src, /aria-current=\{i === cur \? "true" : undefined\}/, "the index marks the current sheet")
assert.match(src, /data-theme=\{theme\}/, "the theme is scoped to the root")
assert.match(src, /classList\.contains\("dark"\)/, "system theme follows the host's .dark class")
assert.match(src, /el\.style\.overflow = "hidden"/, "overlays lock the page behind them")
assert.ok(read("demo.tsx").includes("<EditorialFolioTemplate />"), "default demo is the component, full bleed")
assert.doesNotMatch(read("demo.tsx"), /<div/, "default demo has no wrapper")

/* ---------- logic, executed ---------- */

const L = await import(
  "data:text/javascript," +
    encodeURIComponent(
      stripTypeScriptTypes(region("logic")) +
        "\nexport { clamp, pad2, hashString, mulberry32, normalizeSections, splitWord, toolMark, formatCompact, easeOutCubic, roughRectPath, trendPath, nearestIndex, mailtoHref }\n",
    )
)

assert.equal(L.pad2(3), "03")
assert.equal(L.pad2(12), "12")

assert.deepEqual(L.normalizeSections(undefined), ["cover", "about", "postcards", "socials", "experience", "connect"])
assert.deepEqual(L.normalizeSections(["connect", "cover", "connect", "nope"]), ["connect", "cover"], "keeps order, drops repeats and unknowns")
assert.deepEqual(L.normalizeSections([]).length, 6, "an empty list falls back to every sheet")

assert.deepEqual(L.splitWord("Portfolio"), ["Port", "folio"])
assert.deepEqual(L.splitWord("Portfolio", 5), ["Portf", "olio"])
assert.deepEqual(L.splitWord("Hi", 0), ["H", "i"], "both halves always have a letter")
assert.deepEqual(L.splitWord("A"), ["A", ""])

assert.deepEqual(L.toolMark("Adobe Photoshop"), { name: "Adobe Photoshop", mark: "Ps", round: false })
assert.equal(L.toolMark("Illustrator").mark, "Ai")
assert.equal(L.toolMark("Canva").round, true)
assert.equal(L.toolMark("Blender").mark, "Bl", "unknown tools use their first letters")
assert.equal(L.toolMark({ name: "Risograph", mark: "Ri", round: true }).mark, "Ri")

assert.equal(L.formatCompact(864), "864")
assert.equal(L.formatCompact(27600), "27.6k")
assert.equal(L.formatCompact(1234), "1.23k")
assert.equal(L.formatCompact(2000), "2k", "no trailing zeros")
assert.equal(L.formatCompact(2400000), "2.4M")
assert.equal(L.formatCompact(863.6), "864", "counting up rounds")

assert.equal(L.easeOutCubic(0), 0)
assert.equal(L.easeOutCubic(1), 1)
assert.equal(L.easeOutCubic(2), 1, "clamped")
assert.ok(L.easeOutCubic(0.5) > 0.5, "fast start, slow finish")

const r1 = L.mulberry32(7)
const r2 = L.mulberry32(7)
const seq = Array.from({ length: 5 }, () => r1())
assert.deepEqual(seq, Array.from({ length: 5 }, () => r2()), "seeded artwork is stable between renders")
assert.ok(seq.every((v) => v >= 0 && v < 1))
assert.notEqual(L.hashString("a"), L.hashString("b"))

const torn = L.roughRectPath(100, 60, 2, 10, 3)
assert.match(torn, /^M[-\d. ]+(L[-\d. ]+)+Z$/, "a closed path")
const nums = torn.match(/-?\d+(\.\d+)?/g).map(Number)
const xs = nums.filter((_, i) => i % 2 === 0)
const ys = nums.filter((_, i) => i % 2 === 1)
assert.ok(Math.min(...xs) >= -2 && Math.max(...xs) <= 102 && Math.min(...ys) >= -2 && Math.max(...ys) <= 62, "the torn edge stays within its jitter")
assert.equal(torn, L.roughRectPath(100, 60, 2, 10, 3), "same seed, same tear")

const t = L.trendPath([1, 5, 3], 100, 50, 5)
assert.equal(t.pts.length, 3)
assert.deepEqual(t.pts[0], { x: 5, y: 45 }, "the minimum sits on the floor")
assert.deepEqual(t.pts[1], { x: 50, y: 5 }, "the maximum touches the ceiling")
assert.equal(L.trendPath([4], 100, 50, 5).d, "", "one point draws nothing")
assert.equal(L.trendPath([2, 2], 100, 50, 5).pts[0].y, 45, "a flat line does not divide by zero")

assert.equal(L.nearestIndex(5, 100, 5, 3), 0)
assert.equal(L.nearestIndex(52, 100, 5, 3), 1)
assert.equal(L.nearestIndex(500, 100, 5, 3), 2, "clamped")

assert.equal(L.mailtoHref("a@b.co", "", ""), "mailto:a@b.co")
assert.equal(L.mailtoHref("a@b.co", "Hi & bye", "line\nnext"), "mailto:a@b.co?subject=Hi%20%26%20bye&body=line%0Anext")

console.log("editorial-folio-template: ok")
