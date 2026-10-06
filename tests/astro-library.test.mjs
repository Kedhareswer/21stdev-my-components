// Install-safety checks for every Astro library piece, plus the logic they all
// share with astro-association-template.
// Run: node tests/astro-library.test.mjs
//
// Each piece must survive installation on its own: React is the only import,
// nothing loads from the network, no generics before the JSX (they hang the
// 21st CLI tokenizer), styles travel inside the file, and every root claims
// full width inside 21st's flex wrapper.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const read = (slug, f = slug + ".tsx") =>
  readFileSync(new URL(`../components/${slug}/${f}`, import.meta.url), "utf8").replace(/\r\n/g, "\n")

const PIECES = [
  "astro-navbar",
  "astro-bubble-hero",
  "astro-mission-band",
  "astro-ribbon-stage",
  "astro-project-cards",
  "astro-sky-nights",
  "astro-member-card",
  "astro-footer",
]

for (const slug of PIECES) {
  const src = read(slug)
  const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
  assert.deepEqual(imports, ["react"], `${slug}: react is the only import`)
  assert.doesNotMatch(src, /@import|@font-face|fetch\(|new Image\(|https?:\/\/(?!www\.w3\.org)/, `${slug}: nothing loads at runtime`)
  assert.doesNotMatch(src, /\bh-full\b/, `${slug}: no h-full`)
  assert.doesNotMatch(src, /@\/components\/ui\/|from "\.\.?\//, `${slug}: no imports from sibling pieces`)
  const head = src.slice(0, src.indexOf("</"))
  assert.doesNotMatch(head, /use(State|Ref|Memo|Callback)<|Partial<|Record<|React\.(Ref|PointerEvent|KeyboardEvent|MouseEvent)</, `${slug}: no generics before the JSX`)
  assert.doesNotMatch(src, /as React\.Ref</, `${slug}: ref casts carry no generics`)
  const css = src.match(/const AA_CSS = `([\s\S]*?)`/)[1]
  assert.doesNotMatch(css, /\$\{|(^|[\s}])(\*|body|html|:root)\s*\{/, `${slug}: no interpolation, no global resets`)
  assert.match(css, /\.aa-root\{[^}]*width:100%/, `${slug}: the root claims full width`)
  assert.match(css, /prefers-reduced-motion:reduce/, `${slug}: reduced motion is honoured`)
  assert.match(css, /\.aa-root\[data-theme="dark"\]/, `${slug}: ships a dark theme`)
  assert.match(css, /\.aa-noframe\{border:0\}/, `${slug}: the frame can be turned off for stacking`)
  assert.match(src, /useAstroLook\(palette, defaultTheme, onThemeChange\)/, `${slug}: palette + theme come from one place`)
  const demo = read(slug, "demo.tsx")
  assert.match(demo, new RegExp(`from "@/components/ui/${slug}"`), `${slug}: the demo imports the installed path`)
  assert.doesNotMatch(demo, /https?:\/\//, `${slug}: the demo is self-contained`)
}

/* piece-specific */
assert.match(read("astro-navbar"), /\.aa-sticky\{position:sticky;top:0/, "navbar: sticky lives on the root, where it can work")
assert.match(read("astro-bubble-hero"), /kind: "text" as const, text: wordmark/, "hero: the bubbles are masked to the wordmark")
assert.match(read("astro-mission-band"), /kind: "logo" as const/, "mission: the logo is knocked out of the band")
assert.match(read("astro-ribbon-stage"), /"--w": "190%"/, "ribbons run past every edge of the stage")
assert.match(read("astro-sky-nights"), /moonPhase\(skyDay\)/, "nights: the sky card shows the real phase")
assert.match(read("astro-member-card"), /memberNumber\(name \|\| "guest", email\)/, "member card: the number follows the name")

/* shared logic (identical in every piece; check it once, from the hero) */
const src = read("astro-bubble-hero")
const a = src.indexOf("// #region logic\n")
const b = src.indexOf("// #endregion logic")
const L = await import(
  "data:text/javascript," +
    encodeURIComponent(stripTypeScriptTypes(src.slice(a, b)) + "\nexport { moonPhase, moonPath, memberNumber, formatStat, buildBubbles, unwrapAngle, lines }"),
)

// a known full moon: 2024-01-25 17:54 UTC
assert.ok(L.moonPhase(Date.UTC(2024, 0, 25, 18)).illumination > 0.98, "full moon reads full")
assert.equal(L.moonPhase(Date.UTC(2024, 0, 25, 18)).name, "Full Moon")
assert.ok(L.moonPhase(Date.UTC(2024, 1, 9, 23)).illumination < 0.02, "new moon reads dark")
assert.match(L.moonPath(0.25, 50), /Z$/, "the lit shape closes")
assert.match(L.memberNumber("Ada Lovelace", "ada@x.io"), /^#\d{4}$/)
assert.equal(L.memberNumber("Ada", "a@b.co"), L.memberNumber(" ada ", "A@B.CO"), "the number ignores case and spaces")
assert.equal(L.formatStat("1,840+", 1), "1,840+")
assert.equal(L.formatStat("48,600", 0), "0")
const bub = L.buildBubbles(7, 400, 200, 8)
assert.ok(bub.length >= 12 && bub.every((x) => x.c >= 1 && x.c < 8), "bubbles never use the ground colour")
assert.ok(bub.every((x, i) => i === 0 || bub[i - 1].r >= x.r), "big bubbles first, small on top")
assert.equal(L.unwrapAngle(170, -170), 190, "the needle turns the short way round")
assert.deepEqual(L.lines("ASTRO.\\nASSOCiATION"), ["ASTRO.", "ASSOCiATION"], "a literal \\n from JSX breaks the line")

console.log("astro-library: ok")
