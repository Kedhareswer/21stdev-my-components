// Install-safety, pen-mark geometry and QR encoder checks for
// components/marginalia-portfolio-template.
// Run: node tests/marginalia-portfolio-template.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const dir = new URL("../components/marginalia-portfolio-template/", import.meta.url)
const src = readFileSync(new URL("marginalia-portfolio-template.tsx", dir), "utf8")
const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"))

// ---- install safety ------------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react", "gsap", "gsap/ScrollTrigger", "gsap/ScrollToPlugin", "gsap/MorphSVGPlugin"], "react + gsap only")
assert.ok(pkg.dependencies.gsap, "gsap is declared at the root")
for (const f of readdirSync(dir))
  assert.ok(/^(marginalia-portfolio-template\.tsx|demo(-[a-z0-9-]+)?\.tsx|README\.md)$/.test(f), "unexpected file in the folder: " + f)

assert.ok(src.includes('height = "100svh"'), "a screen defaults to a definite length")
assert.ok(src.includes('"--mgn-h": height'), "sheet heights come from the height prop")
assert.doesNotMatch(src, /className=["'][^"']*\bh-full\b/, "no h-full")
assert.doesNotMatch(src, /@import|@font-face|fetch\(|new Image\(/, "no fetches, no CSS imports")
for (const m of src.matchAll(/https?:\/\/[^"'`\s)]+/g))
  assert.match(m[0], /^https:\/\/(images\.unsplash\.com\/(photo-)?|fonts\.googleapis\.com\/css2|example\.com|www\.behance\.net|dribbble\.com|www\.linkedin\.com|github\.com)/, "unexpected remote: " + m[0])
assert.match(src, /\{fontHref && <link rel="stylesheet" href=\{fontHref\} \/>\}/, "the web fonts are optional")
assert.ok(src.includes("fonts.href === undefined ? DEFAULT_FONT : fonts.href"), "fonts.href null loads nothing")

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
  for (const one of parts) assert.ok(one.trim().startsWith(".mgn-"), "unscoped selector: " + one)
}
assert.ok(css.includes("prefers-reduced-motion"), "CSS honours reduced motion")
assert.ok(css.includes("@container"), "layout answers the component's width, not the window")
assert.ok(css.includes(".mgn-root :where(img){max-width:none"), "Preflight's img max-width is undone")
assert.ok(css.includes(".mgn-canvas{position:absolute;inset:0;width:100%;height:100%;max-width:none"), "the ink canvas guards max-width")
assert.ok(/\.mgn-deal-stage\{position:sticky;top:0;height:var\(--mgn-h\)/.test(css), "the deal stage is sticky, sized by the prop")

// 21st's CLI tokenizer hangs on generics before the first JSX close tag.
const head = src.slice(0, src.indexOf("</"))
assert.doesNotMatch(head, /use(State|Ref|Memo|Callback)<|Partial<|Record<|Array<|Map<|React\.[A-Za-z]+<|\[K in /, "no generics before the JSX")

// Runtime hygiene.
assert.ok(src.includes("gsap.matchMedia()") && src.includes("mm.revert()"), "animations live in a matchMedia context that reverts")
assert.ok(src.includes('reduce: "(prefers-reduced-motion: reduce)"') && src.includes("if (!motion) return"), "reduced motion gets the static page")
assert.ok(src.includes("Math.min(window.devicePixelRatio || 1, 2)"), "cap DPR at 2")
for (const gone of ["cancelAnimationFrame(raf)", "ro.disconnect()", 'host.removeEventListener("pointermove", onMove)', 'window.removeEventListener("load", refresh)'])
  assert.ok(src.includes(gone), "cleanup is missing " + gone)
assert.doesNotMatch(src, /\.fromTo\(\s*cards,/, "no staggered fromTo on the deck (only the first card would pre-render)")

// ---- logic ---------------------------------------------------------------------
const region = src.slice(src.indexOf("// #region logic"), src.indexOf("// #endregion logic"))
const L = new Function(
  stripTypeScriptTypes(region.replace(/^export /gm, "")) +
    "\nreturn { rand, ovalPath, underlinePath, underlineMorph, arrowPaths, sparklePath, heartPath, parseMarks, formatCount, pileOffset, orbitPoint, qrMatrix, isLight, handLine }",
)()

assert.deepEqual(L.parseMarks("a *b* [c] d"), [
  { text: "a ", mark: "" },
  { text: "b", mark: "under" },
  { text: " ", mark: "" },
  { text: "c", mark: "oval" },
  { text: " d", mark: "" },
])
assert.deepEqual(L.parseMarks("open [bracket"), [{ text: "open [bracket", mark: "" }], "unclosed markers stay literal")

assert.equal(L.ovalPath(120, 40, 3), L.ovalPath(120, 40, 3), "pen marks are deterministic")
assert.notEqual(L.ovalPath(120, 40, 3), L.ovalPath(120, 40, 4), "seeds vary the mark")
assert.doesNotMatch(L.ovalPath(120, 40, 3), /Z/i, "a hand oval is never closed")
assert.doesNotMatch(L.ovalPath(120, 40, 3) + L.underlinePath(80, 20, 1), /NaN/, "no NaN in paths")

const um = L.underlineMorph(300, 7)
const cmds = (d) => d.replace(/[^MCLQZ]/gi, "")
assert.equal(cmds(um.from), cmds(um.to), "morph shapes share their command structure")
assert.equal(cmds(L.sparklePath(0, 0, 10)), cmds(L.heartPath(0, 0, 10)), "sparkle and heart morph cleanly")

const ar = L.arrowPaths([0, 0], [100, 0], 0.2, 9)
assert.ok(ar.head.includes("L100 0"), "the arrowhead meets the tip")

assert.equal(L.formatCount(431.4, 0), "431")
assert.equal(L.formatCount(1234, 0), "1,234")
assert.equal(L.formatCount(49.52, 1), "49.5")
assert.deepEqual(L.pileOffset(2, 5), L.pileOffset(2, 5), "the pile is seeded")
assert.ok(L.orbitPoint(0.25, 92, 30, 0).front && !L.orbitPoint(0.75, 92, 30, 0).front, "the star passes in front, then behind")
assert.ok(L.isLight("#f2efe8") && !L.isLight("#1f1f21") && L.isLight("#fff"), "spine text colour picks contrast")
assert.ok(L.handLine(2, 100, 8, 1).startsWith("M2 "), "language bars start at the track")

// QR: sizes by version, finder patterns, a valid format word, and a hard length cap.
const finderOk = (g, x0, y0) => {
  for (let y = 0; y < 7; y++)
    for (let x = 0; x < 7; x++) {
      const d = Math.max(Math.abs(x - 3), Math.abs(y - 3))
      if (g[y0 + y][x0 + x] !== (d !== 2)) return false
    }
  return true
}
for (const [text, size] of [["hi", 21], ["https://example.com/cv.pdf", 25], ["x".repeat(42), 29], ["x".repeat(84), 37], ["x".repeat(106), 41]]) {
  const g = L.qrMatrix(text)
  assert.equal(g.length, size, "version for " + text.length + " bytes")
  assert.ok(finderOk(g, 0, 0) && finderOk(g, size - 7, 0) && finderOk(g, 0, size - 7), "finder patterns")
  for (let i = 8; i < size - 8; i++) assert.equal(g[6][i], i % 2 === 0, "timing pattern")
  assert.equal(g[size - 8][8], true, "dark module")
  // read the format word back from around the top-left finder and BCH-check it
  let f = 0
  const bits = []
  for (let i = 0; i <= 5; i++) bits[i] = g[i][8]
  bits[6] = g[7][8]
  bits[7] = g[8][8]
  bits[8] = g[8][7]
  for (let i = 9; i < 15; i++) bits[i] = g[8][14 - i]
  bits.forEach((b, i) => (f |= (b ? 1 : 0) << i))
  f ^= 0x5412
  assert.equal(f >> 13, 0, "error correction level M")
  let rem = f >> 10
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537)
  assert.equal(rem & 0x3ff, f & 0x3ff, "format word passes its BCH check")
}
assert.equal(L.qrMatrix("x".repeat(107)), null, "too long for version 6 → no code")
assert.equal(L.qrMatrix("é".repeat(53)).length, 41, "UTF-8 bytes count, not characters")

console.log("marginalia-portfolio-template: ok")
