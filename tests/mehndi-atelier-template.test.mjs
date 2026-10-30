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
// once:true triggers kill themselves during a refresh, which mutates ScrollTrigger's
// list while matchMedia re-creates triggers mid-page (resize, rotate) and throws.
assert.doesNotMatch(src, /once:\s*true/, "no self-killing once:true triggers")
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

// Preflight: every positioned <img> guards max-width (product photos are SVG <image>s).
for (const cls of ["mat-win-img", "mat-tile-img"]) assert.ok(new RegExp("\\." + cls + "\\{[^}]*max-width:none").test(css), cls + " guards max-width")

// A size container is the containing block for position:fixed, so the drawer, the
// toast and the flying drop must live outside it or they open off-screen once scrolled.
assert.doesNotMatch(css.match(/\.mat-root\{[^}]*\}/)[0], /container-type/, "the root is not the container")
assert.match(css, /\.mat-page\{[^}]*container-type:inline-size/, ".mat-page is the container")
const pageOpen = src.indexOf('<div className="mat-page">')
const pageClose = src.indexOf("</footer>\n      </div>")
for (const overlay of ['className={"mat-toast"', 'className={"mat-drawer-wrap"'])
  assert.ok(src.indexOf(overlay) > pageClose && pageClose > pageOpen, overlay + " sits outside the container")
assert.match(css, /\.mat-flydrop\{position:fixed/, "the flying drop is fixed")

// The hero window is morphed by regenerating the arch every frame.
assert.ok(src.includes("img.style.clipPath = 'path(\"' + archPath("), "the window clip is a regenerated arch")

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
  const O = await lift(["rng", "ornament"], "petalPath, scallopPath, mandalaRings, ringMarks")
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
}

const nums = (d) => (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number)

{
  const C = await lift(["ornament", "curve"], "bez, sampleCubics, resample, area, centroid, normals, smoothPath, leafPath, dotPath, spiral")
  assert.deepEqual(C.bez([0, 0, 0, 10, 10, 10, 10, 0], 0), [0, 0])
  assert.deepEqual(C.bez([0, 0, 0, 10, 10, 10, 10, 0], 1), [10, 0])
  assert.equal(C.sampleCubics([[0, 0, 1, 1, 2, 2, 3, 3], [3, 3, 4, 4, 5, 5, 6, 6]], 8).length, 16)

  const line = [[0, 0], [100, 0]]
  const rs = C.resample(line, 10, false)
  assert.equal(rs.length, 11, "a point every 10 units, ends included")
  for (let i = 1; i < rs.length; i++) assert.ok(Math.abs(Math.hypot(rs[i][0] - rs[i - 1][0], rs[i][1] - rs[i - 1][1]) - 10) < 1e-9)

  const sq = [[0, 0], [10, 0], [10, 10], [0, 10]] // clockwise on screen
  assert.equal(C.area(sq), 100)
  assert.equal(C.area(sq.slice().reverse()), -100)
  assert.deepEqual(C.centroid(sq), [5, 5])
  for (const pts of [sq, sq.slice().reverse()]) {
    const ns = C.normals(pts)
    pts.forEach((p, i) => {
      const out = [p[0] + ns[i][0] - 5, p[1] + ns[i][1] - 5]
      assert.ok(Math.hypot(...out) > Math.hypot(p[0] - 5, p[1] - 5), "normals point out of the loop either way round")
    })
  }
  const sp = C.smoothPath([[0, 0], [10, 5], [20, 0]], false)
  assert.match(sp, /^M0,0C.*20,0$/, "an open curve starts and ends on its points")
  assert.match(C.smoothPath(sq, true), /Z$/)
  assert.match(C.leafPath([0, 0], [10, 0], 3), /^M0,0Q5,3 10,0Q5,-3 0,0Z$/)
  assert.match(C.dotPath([5, 5], 2), /^M3,5a2,2 0 1 0 4,0a2,2 0 1 0 -4,0$/)
  const s = C.spiral([0, 0], 0, 10, 1, 1, 20)
  assert.ok(Math.hypot(s[0][0], s[0][1]) < 1e-9, "a spiral leaves from its start point")
  assert.ok(s[1][0] > 0, "heading along its heading")
  const r = (p) => Math.hypot(p[0] - 0, p[1] - 10)
  assert.ok(r(s[s.length - 1]) < r(s[0]) * 0.3, "and tightens round its centre")
}

{
  const A = await lift(["ornament", "curve", "arch"], "archPath")
  const commands = (d) => d.replace(/[^MLQZ]/g, "")
  const full = A.archPath(0, 0, 300, 390, 1, 4)
  assert.match(full, /^M0,390L0,[\d.]+(Q[-\d.]+,[-\d.]+ [-\d.]+,[-\d.]+){8}L300,390Z$/, "jambs, eight cusped lobes, sill")
  assert.doesNotMatch(full, /NaN|Infinity/)
  for (const k of [0, 0.25, 0.5, 0.75, 1]) assert.equal(commands(A.archPath(10, 20, 300, 390, k, 4)), commands(full), "same commands at every k, so it can be regenerated mid-morph")
  // the crown points (every second number pair after the jambs) are mirror images
  const n = nums(full)
  const crown = []
  for (let i = 4; i + 3 < n.length - 4; i += 4) crown.push([n[i + 2], n[i + 3]])
  crown.forEach((p, i) => {
    const q = crown[crown.length - 1 - i]
    if (i < crown.length / 2) {
      assert.ok(Math.abs(p[0] + q[0] - 300) < 0.02, "symmetric across the centre")
      assert.ok(Math.abs(p[1] - q[1]) < 0.02)
    }
  })
  const apex = Math.min(...crown.map((p) => p[1]))
  assert.ok(Math.abs(apex) < 0.02, "the crown touches the top of the box")
  const flat = nums(A.archPath(0, 0, 720, 900, 0, 4))
  for (let i = 0; i < flat.length; i += 2) assert.ok(flat[i + 1] === 0 || flat[i + 1] === 900, "k = 0 is the plain rectangle")
  for (const [w, h] of [[0, 0], [400, 10], [10, 400]]) assert.doesNotMatch(A.archPath(0, 0, w, h, 0.6, 4), /NaN|Infinity/, "degenerate boxes stay finite")
}

{
  const P = await lift(["rng", "ornament", "curve", "paisley"], "paisleyOrnament")
  const a = P.paisleyOrnament(7)
  for (const [k, v] of Object.entries(a)) {
    const str = typeof v === "string" ? v : JSON.stringify(v)
    assert.doesNotMatch(str, /NaN|Infinity|undefined/, k + " is finite")
  }
  for (const k of ["outline", "scallops", "echo1", "echo2"]) assert.match(a[k], /^M.*Z$/, k + " is a closed loop")
  assert.ok(a.feathers.split("M").length > 40, "a full band of feathers")
  assert.ok(a.beadRow.split("M").length > 30, "a full row of beads")
  assert.ok(Math.abs(a.core.cx) < 40 && a.core.cy > 0, "the rosette sits in the bulb")
  assert.deepEqual(P.paisleyOrnament(7), a, "deterministic for a seed")
  assert.notDeepEqual(P.paisleyOrnament(8).vine, a.vine, "another seed bends the vine differently")
}

{
  const F = await lift(["rng", "ornament", "curve", "filigree"], "filigreeArm")
  const a = F.filigreeArm(178, 20, 3, 5)
  assert.equal(a.tendrils.length, 3, "one tendril per wave")
  for (const d of [a.vine, a.leaves, a.dots, ...a.tendrils]) assert.doesNotMatch(d, /NaN|Infinity/)
  const xs = nums(a.vine).filter((_, i) => i % 2 === 0)
  assert.ok(Math.min(...xs) >= -1 && Math.max(...xs) <= 178 + 20, "the vine runs along its arm")
  assert.deepEqual(F.filigreeArm(178, 20, 3, 5), a, "deterministic")
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
