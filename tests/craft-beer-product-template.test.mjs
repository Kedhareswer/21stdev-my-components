// Install-safety and behaviour checks for components/craft-beer-product-template.
// Run: node tests/craft-beer-product-template.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const slug = "craft-beer-product-template"
const root = new URL("../", import.meta.url)
const dir = new URL("components/" + slug + "/", root)
const src = readFileSync(new URL(slug + ".tsx", dir), "utf8")
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")
const pkg = JSON.parse(readFileSync(new URL("package.json", root), "utf8"))
const tsconfig = readFileSync(new URL("tsconfig.json", root), "utf8")

// ---- install safety ------------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react", "gsap", "gsap/ScrollTrigger"], "only react and gsap")
assert.ok(pkg.dependencies?.gsap, "gsap must be declared in the root package.json")
assert.match(src, /gsap\.registerPlugin\(ScrollTrigger\)/, "ScrollTrigger is registered")
for (const f of readdirSync(dir))
  assert.ok(new RegExp("^(" + slug + "\\.tsx|demo(-[a-z0-9-]+)?\\.tsx|README\\.md)$").test(f), "unexpected file in the folder: " + f)
assert.ok(tsconfig.includes('"@/components/ui/' + slug + '": ["./components/' + slug + "/" + slug + '.tsx"]'), "tsconfig paths line")
assert.ok(demo.includes('from "@/components/ui/' + slug + '"'), "demo imports the installed path")

assert.ok(src.includes('height = "100svh"'), "stage height defaults to a definite length")
assert.ok(src.includes('"--h": height'), "the height prop feeds --h")
assert.doesNotMatch(src, /className=["'][^"']*\bh-full\b/, "no h-full")
assert.doesNotMatch(src, /pin:\s*true/, "no ScrollTrigger pinning")
assert.ok(src.includes("ctx.revert()") && src.includes("mm.revert()"), "every trigger and tween is reverted on unmount")
assert.doesNotMatch(src, /@import/, "no @import")
assert.ok(src.includes('{fontHref && <link rel="stylesheet" href={fontHref} />}'), "fontHref null loads nothing")
for (const m of src.matchAll(/https?:\/\/([a-z0-9.-]+)\//g))
  assert.ok(["fonts.googleapis.com", "www.w3.org"].includes(m[1]), "unexpected host " + m[1])
// The demo is self-contained: every photo is inlined.
assert.doesNotMatch(demo, /https?:\/\//, "demo loads no remote media")
assert.ok((demo.match(/data:image\/avif;base64,/g) || []).length >= 8, "demo inlines its photos")

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
  for (const one of sel.split(/,(?![^(]*\))/)) assert.ok(one.trim().startsWith(".tb-"), "unscoped selector: " + one.trim())
}
assert.match(css, /\.tb-root img\{max-width:none/, "Preflight's img max-width is undone")

// The bottle travels on a sticky layer; phones and reduced motion get it parked instead.
assert.match(css, /\.tb-sticky\{position:sticky;top:0;height:var\(--h\)/, "sticky stage sized by --h")
const parked = css.slice(css.indexOf("@media (max-width:900px),(prefers-reduced-motion: reduce)"))
assert.ok(parked.includes(".tb-track{display:none}") && parked.includes(".tb-root .tb-static{display:block}"), "parked bottles for phones and reduced motion")
assert.ok(src.includes('mm.add("(min-width: 901px) and (prefers-reduced-motion: no-preference)"'), "travel only on desktop with motion")
assert.ok(/prefers-reduced-motion: reduce\)\{[^@]*\.tb-rain\{animation:none\}/.test(css), "the rain stops under reduced motion")
// Landing is measured from layout offsets, not transformed rects.
assert.ok(src.includes("n.offsetParent") && src.includes("inStage(slot)"), "landing uses layout offsets")

// ---- the splat generator runs and is deterministic -----------------------------------
const region = src.match(/\/\/ #region splat([\s\S]*?)\/\/ #endregion splat/)[1]
const js = stripTypeScriptTypes(region).replace(/export function/g, "function")
const splatShape = new Function(js + "; return splatShape")()
const a = splatShape(11)
const b = splatShape(11)
assert.equal(a.d, b.d, "same seed, same splat")
assert.notEqual(a.d, splatShape(48).d, "different seeds differ")
assert.match(a.d, /^M[\d. L]+Z$/, "a closed path")
for (const c of a.drops) assert.ok(c.r > 0 && Number.isFinite(c.cx) && Number.isFinite(c.cy), "droplets are finite")
const xs = [...a.d.matchAll(/([\d.]+) ([\d.]+)/g)].map((m) => [+m[1], +m[2]])
assert.ok(xs.every(([x, y]) => x > -40 && x < 240 && y > -40 && y < 240), "the splat stays near its 200px box")

console.log("craft-beer-product-template: ok")
