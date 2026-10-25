// Install-safety, ornament, stain-curve and bag checks for
// components/mehndi-atelier-template.
// Run: node tests/mehndi-atelier-template.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const root = new URL("../", import.meta.url)
const dir = new URL("components/mehndi-atelier-template/", root)
const src = readFileSync(new URL("mehndi-atelier-template.tsx", dir), "utf8")
const pkg = JSON.parse(readFileSync(new URL("package.json", root), "utf8"))

// ---- install safety ------------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react", "gsap", "gsap/ScrollTrigger"], "only react and gsap")
assert.ok(pkg.dependencies?.gsap, "gsap must be declared in the root package.json")
assert.match(src, /gsap\.registerPlugin\(ScrollTrigger\)/, "ScrollTrigger is registered")
for (const f of readdirSync(dir))
  assert.ok(/^(mehndi-atelier-template\.tsx|demo(-[a-z0-9-]+)?\.tsx|README\.md)$/.test(f), "unexpected file in the folder: " + f)

assert.ok(src.includes('height = "100svh"'), "hero height defaults to a definite length")
assert.ok(src.includes('"--h": height'), "the height prop feeds --h")
assert.ok(/\.mat-hero\{[^}]*height:var\(--h\)/.test(src), "the hero takes its height from the prop")
assert.doesNotMatch(src, /className=["'][^"']*\bh-full\b/, "no h-full")
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
for (const rule of css.matchAll(/(?:^|[{}])\s*(?!@)([^{}\s][^{}]*)\{/g)) {
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
    assert.ok(s.startsWith(".mat-") || s.startsWith(":where(.mat-root)") || s.startsWith(":where(.dark) .mat-root"), "unscoped selector: " + s)
  }
}
assert.ok(css.includes("prefers-reduced-motion"), "CSS honours reduced motion")
assert.ok(src.includes('motion: "(prefers-reduced-motion: no-preference)"'), "GSAP choreography only runs with motion allowed")
assert.ok(css.includes("@container"), "layout answers the component's width, not the window")
assert.ok(css.includes(":where(.dark) .mat-root"), "dark mode follows a .dark ancestor")

// Preflight: every positioned photo guards max-width.
for (const cls of ["mat-hero-photo", "mat-feature-img"]) assert.ok(new RegExp("\\." + cls + "\\{[^}]*max-width:none").test(css), cls + " guards max-width")
assert.ok(/\.mat-product-media img\{[^}]*max-width:none/.test(css), "product photos guard max-width")

// 21st's CLI tokenizer hangs on generics before the first JSX close tag.
const head = src.slice(0, src.indexOf("</"))
assert.doesNotMatch(head, /use(State|Ref|Memo|Callback)<|Partial<|Record<|Array<|Map<|React\.[A-Za-z]+<|\[K in /, "no generics before the JSX")

// Runtime hygiene.
for (const gone of ['window.removeEventListener("keydown", onKey)', "window.clearTimeout(toastTimer.current)", "drop.remove()"]) assert.ok(src.includes(gone), "cleanup is missing " + gone)
assert.ok(src.includes("pathLength={1}"), "ornament paths normalise their length so --draw is the dash offset")
assert.ok(/images\.unsplash\.com/.test(src), "default photos come from Unsplash")
for (const m of src.matchAll(/https:\/\/([a-z0-9.-]+)\//g))
  assert.ok(["images.unsplash.com", "fonts.googleapis.com"].includes(m[1]), "unexpected host " + m[1])
assert.ok(src.includes('role="dialog"') && src.includes('aria-modal="true"'), "the bag drawer is a dialog")
assert.ok(src.includes('role="radiogroup"'), "shades are a radio group")

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
  const { rng } = await lift(["rng"], "rng")
  const a = rng(7)
  const b = rng(7)
  for (let i = 0; i < 50; i++) {
    const x = a()
    assert.equal(x, b(), "seeded sequence repeats")
    assert.ok(x >= 0 && x < 1)
  }
  assert.notEqual(rng(1)(), rng(2)(), "different seeds differ")
  assert.ok(Number.isFinite(rng(0)()), "seed 0 still produces numbers")
}

{
  const O = await lift(["rng", "ornament"], "petalPath, scallopPath, mandalaRings, ringMarks, paisleyPaths")
  const p = O.petalPath(10, 40, 0, 0.4)
  assert.match(p, /^M10,0Q.*Z$/, "a petal starts at r0 on its angle and closes")
  assert.doesNotMatch(p, /NaN/)
  assert.match(O.scallopPath(50, 12, 0), /^M50,0(A[\d.]+,[\d.]+ 0 0 1 [-\d.]+,[-\d.]+){12}Z$/, "twelve arcs around the circle")

  const rings = O.mandalaRings(7, 98)
  assert.ok(rings.length >= 7, "a mandala has several rings: " + rings.length)
  assert.equal(rings[0].kind, "circle", "it starts with a centre circle")
  for (let i = 1; i < rings.length; i++) {
    assert.ok(rings[i].r >= rings[i - 1].r2 - 1e-9, "rings move outward")
    assert.ok(rings[i].r2 <= 98 * 0.96 + 98 * 0.2, "rings stay inside the field")
    if (i > 1) assert.notEqual(rings[i].kind, rings[i - 1].kind, "kinds never repeat back to back")
    if (rings[i].kind !== "circle") assert.equal(rings[i].n % 8, 0, "repeats come in eights")
  }
  assert.deepEqual(O.mandalaRings(7, 98), rings, "deterministic for a seed")
  assert.notDeepEqual(O.mandalaRings(8, 98), rings, "another seed, another mandala")

  for (const ring of rings) {
    const { paths, dots } = O.ringMarks(ring)
    assert.ok(paths.length + dots.length > 0, "every ring draws something")
    for (const d of paths) assert.doesNotMatch(d, /NaN|Infinity/)
    if (ring.kind === "dots") assert.equal(dots.length, ring.n)
    if (ring.kind === "petal") assert.equal(paths.length, ring.n * 2, "petals carry an inner petal")
    if (ring.kind === "spike" || ring.kind === "ticks") assert.equal(paths.length, ring.n)
  }
  const { outline, echo, spine } = O.paisleyPaths()
  assert.match(outline, /^M0,-92C.*Z$/)
  assert.equal(echo.length, 2)
  assert.match(spine, /^M-4,-70C/)
}

{
  const S = await lift(["stain"], "hexRgb, rgbHex, stainAt, stainOpacity, FRESH")
  assert.deepEqual(S.hexRgb("#ff8000"), [255, 128, 0])
  assert.deepEqual(S.hexRgb("#fff"), [255, 255, 255], "short hex expands")
  assert.equal(S.rgbHex(255, 128, 0), "#ff8000")
  assert.equal(S.rgbHex(300, -5, 12.6), "#ff000d", "channels clamp and round")
  assert.equal(S.stainAt(0, "#5b191c"), S.FRESH, "a fresh stain is pumpkin orange")
  assert.equal(S.stainAt(48, "#5b191c"), "#5b191c", "after two days it is the final shade")
  assert.equal(S.stainAt(99, "#5b191c"), "#5b191c", "hours clamp")
  const lum = (hex) => S.hexRgb(hex).reduce((a, b) => a + b, 0)
  let prev = Infinity
  for (let h = 0; h <= 48; h += 4) {
    const l = lum(S.stainAt(h, "#5b191c"))
    assert.ok(l <= prev + 1e-9, "the stain never gets lighter as it oxidises")
    prev = l
  }
  assert.ok(lum(S.stainAt(24, "#5b191c")) < (lum(S.FRESH) + lum("#5b191c")) / 2, "most of the darkening happens on day one")
  assert.equal(S.stainOpacity(0), 0.62)
  assert.equal(S.stainOpacity(48), 1)
  assert.ok(S.stainOpacity(10) > S.stainOpacity(0) && S.stainOpacity(10) < 1)
}

{
  const B = await lift(["bag"], "formatPrice, addToBag, setQty, bagTotal, bagCount")
  assert.equal(B.formatPrice(349, "₹"), "₹349")
  assert.equal(B.formatPrice(1299, "₹"), "₹1,299")
  assert.equal(B.formatPrice(124999, "₹"), "₹1,24,999", "Indian grouping for rupees")
  assert.equal(B.formatPrice(124999, "$"), "$124,999", "thousands otherwise")
  assert.equal(B.formatPrice(24.4, "€"), "€24", "whole units")
  const p = { id: "cones", name: "Bridal Cones", price: 899 }
  let bag = B.addToBag([], p)
  assert.deepEqual(bag, [{ id: "cones", name: "Bridal Cones", price: 899, qty: 1 }])
  bag = B.addToBag(bag, p)
  assert.equal(bag[0].qty, 2, "adding again raises the quantity")
  bag = B.addToBag(bag, { id: "powder", name: "Powder", price: 349 })
  assert.equal(B.bagCount(bag), 3)
  assert.equal(B.bagTotal(bag), 899 * 2 + 349)
  bag = B.setQty(bag, "cones", 5)
  assert.equal(bag[0].qty, 5)
  bag = B.setQty(bag, "cones", 0)
  assert.deepEqual(bag.map((b) => b.id), ["powder"], "zero removes the line")
  assert.equal(B.bagTotal([]), 0)
}

// ---- demos -----------------------------------------------------------------------------
for (const f of readdirSync(dir).filter((f) => f.startsWith("demo"))) {
  const demo = readFileSync(new URL(f, dir), "utf8")
  const di = [...demo.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
  assert.deepEqual(di, ["@/components/ui/mehndi-atelier-template"], f + " imports only the installed path")
  assert.ok(demo.includes('className="w-full"'), f + ": wrapper keeps full width")
}

const tsconfig = readFileSync(new URL("tsconfig.json", root), "utf8")
assert.ok(tsconfig.includes('"@/components/ui/mehndi-atelier-template"'), "tsconfig paths line missing")

console.log("mehndi-atelier-template: ok")
