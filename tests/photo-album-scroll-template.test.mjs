// Install-safety and behaviour checks for components/photo-album-scroll-template.
// Run: node tests/photo-album-scroll-template.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const slug = "photo-album-scroll-template"
const root = new URL("../", import.meta.url)
const dir = new URL("components/" + slug + "/", root)
const src = readFileSync(new URL(slug + ".tsx", dir), "utf8")
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")
const tsconfig = readFileSync(new URL("tsconfig.json", root), "utf8")

// ---- install safety ------------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "only react")
for (const f of readdirSync(dir))
  assert.ok(new RegExp("^(" + slug + "\\.tsx|demo(-[a-z0-9-]+)?\\.tsx|README\\.md)$").test(f), "unexpected file in the folder: " + f)
assert.ok(tsconfig.includes('"@/components/ui/' + slug + '": ["./components/' + slug + "/" + slug + '.tsx"]'), "tsconfig paths line")
assert.ok(demo.includes('from "@/components/ui/' + slug + '"'), "demo imports the installed path")

assert.ok(src.includes('height = "100svh"'), "stage height defaults to a definite length")
assert.ok(src.includes('["--h" as string]: height'), "the height prop feeds --h")
assert.doesNotMatch(src, /className=["'][^"']*\bh-full\b/, "no h-full")
assert.doesNotMatch(src, /@import/, "no @import")
assert.ok(src.includes('{fontHref && <link rel="stylesheet" href={fontHref} />}'), "fontHref null loads nothing")
for (const m of src.matchAll(/https?:\/\/([a-z0-9.-]+)\//g))
  assert.ok(["fonts.googleapis.com", "www.w3.org"].includes(m[1]), "unexpected host " + m[1])
// The demo is self-contained: every photo is inlined.
assert.doesNotMatch(demo, /https?:\/\//, "demo loads no remote media")
assert.equal((demo.match(/data:image\/avif;base64,/g) || []).length, 6, "demo inlines its six photos")

const allowed = ["--color-background", "--color-foreground", "--color-muted-foreground", "--color-border", "--color-primary"]
for (const m of src.matchAll(/var\((--color-[a-z-]+)/g)) assert.ok(allowed.includes(m[1]), "unknown host token " + m[1])

// ---- the scoped CSS string --------------------------------------------------------
const css = src.match(/const CSS = `([\s\S]*?)`/)[1].replace(/\/\*[\s\S]*?\*\//g, "")
assert.doesNotMatch(css, /\$\{/, "no ${ in the CSS string")
for (const bad of [/(^|[},])\s*\*\s*\{/, /(^|[},])\s*body\s*\{/, /:root/, /(^|[},])\s*html\s*\{/])
  assert.doesNotMatch(css, bad, "no bare resets in the CSS: " + bad)
for (const rule of css.matchAll(/(?:^|[{}])\s*(?!@)([^{}\s][^{}]*)\{/g)) {
  const sel = rule[1].trim()
  if (!sel || /^(from|to|\d+%)/.test(sel)) continue
  for (const one of sel.split(/,(?![^(]*\))/))
    assert.ok(/^(\.dark )?\.pa-/.test(one.trim()), "unscoped selector: " + one.trim())
}
assert.match(css, /\.pa-root img\{max-width:none/, "Preflight's img max-width is undone")
assert.match(css, /\.pa-sticky\{position:sticky;top:0;height:var\(--h\)/, "sticky stage sized by --h")
const reduced = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"))
assert.ok(reduced.includes(".pa-root{height:auto}") && reduced.includes(".pa-scroll{overflow-x:auto"), "reduced motion: a plain horizontal scroller")
assert.ok(src.includes('window.matchMedia("(prefers-reduced-motion: reduce)")') && src.includes('root.style.height = ""'), "JS stands down under reduced motion")

// ---- no layout reads on the scroll path --------------------------------------------
const LAYOUT = /getBoundingClientRect|offset(Top|Left|Width|Height|Parent)|client(Width|Height)|scroll(Height|Width)|getComputedStyle|inner(Width|Height)/
const framePath = src.match(/const frame = \(\) => \{([\s\S]*?)\n    \}/)[1]
const onScroll = src.match(/const onScroll = \(\) => \{([\s\S]*?)\n    \}/)[1]
assert.doesNotMatch(framePath, LAYOUT, "frame() reads no layout")
assert.doesNotMatch(onScroll, LAYOUT, "onScroll reads no layout")
assert.ok(onScroll.includes("requestAnimationFrame(frame)"), "scroll is rAF-throttled")
assert.match(framePath, /style\.transform/, "frame writes a transform")
assert.doesNotMatch(framePath, /style\.(left|top|width|height)\b/, "frame writes no geometry")
assert.ok(src.includes("new ResizeObserver(measure)") && src.includes("document.fonts?.ready.then(measure)"), "measured on resize and after fonts")

// ---- the frame maths runs ----------------------------------------------------------
const region = src.match(/\/\/ #region frame([\s\S]*?)\/\/ #endregion frame/)[1]
const js = stripTypeScriptTypes(region).replace(/export function/g, "function")
const { sheetX, drift } = new Function(js + "; return { sheetX, drift }")()
assert.equal(sheetX(0, 0, 0), 0, "no overflow, no motion")
assert.equal(sheetX(-50, 100, 800), -0, "before the page, the sheet waits")
assert.equal(sheetX(500, 100, 800), -400, "1:1 with scroll")
assert.equal(sheetX(5000, 100, 800), -800, "clamped at the end")
assert.equal(drift(720, 0, 1440, 0.1), 0, "a print at screen centre does not drift")
assert.equal(drift(1440, -300, 1440, 0.1), 42, "drift grows with distance from centre")

console.log(slug + ": ok")
