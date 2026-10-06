// Install-safety checks shared by every ink-orbit library piece, plus the logic
// of the three pieces lifted out last (hero, features, navbar).
// Run: node tests/ink-orbit-library.test.mjs
//
// Each piece must survive installation on its own: React is the only import,
// nothing loads from the network, no generics before the JSX (they hang the
// 21st CLI tokenizer), and every root claims full width inside 21st's flex
// wrapper.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const read = (slug, f = slug + ".tsx") =>
  readFileSync(new URL(`../components/${slug}/${f}`, import.meta.url), "utf8").replace(/\r\n/g, "\n")

const PIECES = [
  "ink-orbit-navbar",
  "ink-orbit-hero",
  "ink-orbit-sculpture",
  "ink-orbit-features",
  "ink-orbit-testimonials",
  "ink-orbit-pricing",
  "ink-orbit-faq",
  "ink-orbit-footer",
]

for (const slug of PIECES) {
  const src = read(slug)
  const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
  assert.deepEqual(imports, ["react"], `${slug}: react is the only import`)
  assert.doesNotMatch(src, /@import|@font-face|fetch\(|new Image\(|https?:\/\//, `${slug}: nothing loads at runtime`)
  assert.doesNotMatch(src, /\bh-full\b/, `${slug}: no h-full`)
  assert.doesNotMatch(src, /@\/components\/ui\/|from "\.\.?\//, `${slug}: no imports from sibling pieces`)
  // generics before the first JSX close tag hang the 21st CLI; aliases may sit at the very end
  const firstClose = src.indexOf("</")
  const head = src.slice(0, firstClose)
  assert.doesNotMatch(head, /use(State|Ref|Memo|Callback)<|Partial<|Record<|React\.(Ref|PointerEvent|KeyboardEvent|MouseEvent)</, `${slug}: no generics before the JSX`)
  const sheets = [...src.matchAll(/const [A-Z]+_CSS = `([\s\S]*?)`/g)].map((m) => m[1])
  assert.ok(sheets.length, `${slug}: styles travel inside the file`)
  for (const css of sheets) {
    assert.doesNotMatch(css, /\$\{|(^|[\s}])(\*|body|html|:root)\s*\{/, `${slug}: no interpolation, no global resets`)
    assert.match(css, /prefers-reduced-motion:reduce/, `${slug}: reduced motion is honoured`)
  }
  assert.ok(sheets.some((css) => /-root\{[^}]*width:100%/.test(css)) || /"[^"]*\brelative w-full\b/.test(src), `${slug}: the root claims full width`)
  const demo = read(slug, "demo.tsx")
  assert.match(demo, new RegExp(`from "@/components/ui/${slug}"`), `${slug}: the demo imports the installed path`)
  assert.doesNotMatch(demo, /https?:\/\//, `${slug}: the demo is self-contained`)
}

/* ---------- hero ---------- */
{
  const src = read("ink-orbit-hero")
  assert.match(src, /function InkOrbitSculpture\(/, "the hero carries its own copy of the sculpture")
  assert.doesNotMatch(src, /seed-flower|a tiny figure for scale/, "...the cleaned-up one, with nothing drawn inside the glass")
  assert.match(src, /className="ih-art-fill"/, "the sculpture fills an absolutely-positioned box, so its 100% height resolves")
  assert.match(src, /\.ih-art-fill\{position:absolute;inset:0\}/)
  assert.match(src, /if \(demoSteps\.length\) setDemo\(true\)/, "an empty demoSteps means no dialog")
  assert.match(src, /e\.key === "Escape" && onClose\(\)/, "Esc closes the dialog")
}

/* ---------- features ---------- */
{
  const src = read("ink-orbit-features")
  assert.doesNotMatch(src, /height: "100%"/, "cards stretch with flex, not percentage heights")
  const a = src.indexOf("// #region logic\n")
  const b = src.indexOf("// #endregion logic\n")
  const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(a, b)) + "\nexport { chartPaths, nearestIndex }"))
  const { line, area, points } = L.chartPaths([1, 3, 2], 300, 130, 14)
  assert.equal(points.length, 3)
  assert.deepEqual(points[0], [14, 116], "the lowest value sits on the bottom padding")
  assert.equal(points[1][1], 14, "the highest value touches the top padding")
  assert.match(line, /^M14\.0,116\.0 C/)
  assert.match(area, / Z$/, "the area closes")
  const flat = L.chartPaths([5, 5, 5], 300, 130, 14)
  assert.ok(flat.points.every((p) => Number.isFinite(p[1])), "a flat series doesn't divide by zero")
  assert.equal(L.nearestIndex([0, 100, 200], 140), 1)
  assert.equal(L.nearestIndex([0, 100, 200], 999), 2)
}

/* ---------- navbar ---------- */
{
  const src = read("ink-orbit-navbar")
  const a = src.indexOf("// #region logic\n")
  const b = src.indexOf("// #endregion logic\n")
  const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(a, b)) + "\nexport { sectionId }"))
  assert.equal(L.sectionId("#pricing"), "pricing")
  assert.equal(L.sectionId(" #faq-2 "), "faq-2")
  for (const notSection of ["#", "/pricing", "https://x.io/#a", "#1abc", "pricing", ""]) assert.equal(L.sectionId(notSection), null, notSection)
  assert.match(src, /\.in-sticky\{position:sticky;top:0\}/, "sticky lives on the root, where it can work")
  assert.match(src, /aria-expanded=\{menu\}/, "the menu button reports its state")
}

console.log("ink-orbit-library: ok")
