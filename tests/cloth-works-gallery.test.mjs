// Install-safety and layout-logic check for components/cloth-works-gallery.
// Run: node tests/cloth-works-gallery.test.mjs
//
// The first half asserts the rules that only fail once the file is installed
// elsewhere. The second half lifts the "// #region layout" block out of the
// component and runs it: the endless row never wraps a card while any of it
// is on screen, the title follows the middle card, the row's spring never
// overshoots, and the cloth is pinned at the middle and free at the edges.
import assert from "node:assert/strict"
import { readFileSync, statSync } from "node:fs"

const src = readFileSync(new URL("../components/cloth-works-gallery/cloth-works-gallery.tsx", import.meta.url), "utf8")
const demo = readFileSync(new URL("../components/cloth-works-gallery/demo.tsx", import.meta.url), "utf8")
const readme = readFileSync(new URL("../components/cloth-works-gallery/README.md", import.meta.url), "utf8")
const tsconfig = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")

// --- install safety -------------------------------------------------------
assert.match(src, /height = "100svh"/, "section height defaults to a definite length")
assert.ok(src.includes('style={{ height, width: "100%" }}'), "the root states its height and width: 100%")
assert.ok(src.includes(".cwg-root{position:relative;width:100%;"), "the root is full width in CSS too")
assert.ok(!/\bh-full\b/.test(src), "no h-full")
assert.ok(!/@import/.test(src), "no @import")
assert.ok(!/`/.test(src), "no backticks in the file")
assert.ok(!/\$\{/.test(src), "no ${ in the file")
assert.ok(!/(^|[{}"])\s*(\*|body|html|:root)\s*\{/m.test(src), "no bare global resets")
assert.ok(Buffer.byteLength(src) < 200 * 1024, "21st rejects component files over 200 kB")
const imports = (src.match(/^import .* from "([^"]+)"/gm) || []).map((l) => l.replace(/.*from "/, "").replace(/"$/, ""))
assert.deepEqual(imports, ["react", "three"], "React and three are the only imports")
const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"))
assert.ok(pkg.dependencies.three, "three is declared at the root")
for (const t of src.match(/var\(--[a-z-]+\)/g) || []) {
  assert.ok(["var(--color-background)", "var(--color-foreground)", "var(--color-muted-foreground)", "var(--cwg-gutter)"].includes(t), "only the semantic tokens: " + t)
}

// The demo, as 21st shows it: a full-width root in its flex shell, moving on its own.
assert.match(demo, /from "@\/components\/ui\/cloth-works-gallery"/, "demo imports the installed path")
assert.match(demo, /<main style=\{\{ width: "100%" \}\}>/, "the demo root fills 21st's flex shell")
assert.match(demo, /<ClothWorksGallery autoPlay \/>/, "the demo drifts on its own")
assert.doesNotMatch(demo, /https?:\/\//, "the demo links nowhere")
assert.ok(tsconfig.includes('"@/components/ui/cloth-works-gallery": ["./components/cloth-works-gallery/cloth-works-gallery.tsx"]'), "tsconfig needs its paths line")

// Preflight guards on every <img>, which also carry intrinsic sizes.
assert.ok(src.includes(".cwg-root img{max-width:none}"), "CSS guard against img max-width:100%")
const imgs = src.match(/<img [^>]*>/g) || []
assert.ok(imgs.length >= 2, "index tiles and the no-WebGL fallback")
for (const t of imgs) {
  assert.ok(/maxWidth: "none"/.test(t), "inline Preflight guard on " + t.slice(0, 40))
  assert.ok(/width=\{\d+\} height=\{\d+\}/.test(t), "intrinsic size on " + t.slice(0, 40))
}
assert.ok(!/scale\(/.test(src), "nothing is enlarged with transform: scale")

// The cloth is real geometry, not a flat image with a CSS wobble.
assert.ok(src.includes("new THREE.PlaneGeometry(1, 1, SEG_X, SEG_Y)"), "each poster is a subdivided plane")
assert.ok(src.includes("c.geo.computeVertexNormals()"), "folds are re-lit every frame")
assert.ok(src.includes('"float fs = clamp(0.3 + 0.7 * dot(fn, fl) / fl.z, 0.38, 1.12);"'), "flat cloth shades to exactly 1: the picture's own colours")
assert.ok(src.includes("t.colorSpace = THREE.SRGBColorSpace") && src.includes("gl.outputColorSpace = THREE.SRGBColorSpace"), "colours are not washed out")
assert.ok(src.includes("loader.setCrossOrigin(\"anonymous\")"), "textures load cross-origin")
assert.ok(src.includes("engine.dispose()") && src.includes("gl.dispose()"), "WebGL is released on unmount")
assert.ok(src.includes("new IntersectionObserver") && src.includes("io.disconnect()"), "the loop idles off screen")
assert.ok(src.includes("setWebgl(false)"), "a row of plain images when WebGL is missing")

// Motion rules.
assert.ok(src.includes('window.matchMedia("(prefers-reduced-motion: reduce)")') && src.includes("@media (prefers-reduced-motion:reduce)"), "honours reduced motion in JS and CSS")
assert.ok(src.includes("if (r) for (const c of cards) c.cloth.settle()") && src.includes("if (!reduced && visible && c.appear > 0.01)"), "reduced motion: the cloth never folds")
assert.ok(src.includes("autoPlay = false,"), "autoplay is opt-in")
assert.ok(src.includes("userRef.current || hoverRef.current"), "autoplay stops for good on input and pauses under the cursor")
assert.ok(src.includes('band.addEventListener("wheel", onWheel, { passive: false })') && src.includes('band.removeEventListener("wheel", onWheel)'), "wheel drives the row only over the row")
assert.ok(src.includes('aria-roledescription="carousel"') && src.includes("onKeyDown={onKey}"), "keyboard reachable")
// view switches: the outgoing layer leaves before the incoming one arrives (no double exposure)
assert.ok(src.includes("enterAt = v === \"gallery\" ? t + (state.reduced ? 0 : 0.24) : Infinity"), "cards come back only after the tiles have gone")
assert.ok(src.includes("viewMix - frame / (reduced ? 0.01 : 0.15)"), "cards leave in 0.15 s")
assert.ok(src.includes('transitionDelay: view === "index" ? 180 + i * 45 + "ms"'), "tiles start after the cards have left")
assert.ok(src.includes(".cwg-root[data-view='index'] .cwg-info{opacity:1;transition-delay:.16s}"), "index caption waits for the cards to clear")
assert.ok(!/position:absolute;inset:0;[^"]*cwg-index/.test(src) && src.includes(".cwg-index{grid-row:2/4;"), "the index is laid out in the grid, not overlaid")

// Pictures come from the catalogue site and exist locally, each once.
assert.ok(src.includes('const IMG = "https://kedhar-components.pages.dev/cloth-works-gallery/"'), "image base is the catalogue")
const hosts = new Set((src.match(/https:\/\/[a-z0-9.-]+/gi) || []).map((u) => u.toLowerCase()))
for (const h of hosts) assert.ok(["https://kedhar-components.pages.dev", "https://fonts.googleapis.com"].includes(h), "unexpected host " + h)
const names = [...src.matchAll(/IMG \+ "([a-z0-9-]+\.webp)"/g)].map((m) => m[1])
assert.equal(names.length, 8, "eight projects")
assert.equal(new Set(names).size, 8, "no picture is used twice")
for (const n of names) {
  const size = statSync(new URL("../dev/public/cloth-works-gallery/" + n, import.meta.url)).size
  assert.ok(size > 1000 && size < 200 * 1024, n + " present and small")
}
for (const f of ["cover.png", "thumb.webp"]) assert.ok(statSync(new URL("../media/cloth-works-gallery/" + f, import.meta.url)).size > 1000, f + " present")

// No identifiers from the reference; placeholder copy is Kedhareswer's.
for (const banned of [/bruto/i, /cuke/i, /lush/i, /wild grove/i, /seoul/i, /costra/i, /gastown/i, /korean/i, /blue ?berry/i, /made for more/i, /visual.?dept/i, /vercel/i, /instagram/i, /vivek/i]) {
  for (const [name, text] of [["component", src], ["demo", demo], ["readme", readme]]) assert.doesNotMatch(text, banned, "no reference identifiers in the " + name + ": " + banned)
}
assert.ok(src.includes("kedhareswer.12110626@gmail.com") && src.includes("Kedhareswer builds"), "placeholder copy is about Kedhareswer")
assert.ok(src.includes('title: "Project 01"') && src.includes('title: "Project 08"'), "placeholder project names")

// --- the layout logic, executed ----------------------------------------------
const start = src.indexOf("// #region layout")
const end = src.indexOf("// #endregion")
assert.ok(start > 0 && end > start, "layout region present")
const body = src.slice(start, end).replace(/export /g, "").replace(/: number/g, "")
const m = new Function(body + "\nreturn { CARD_ASPECT, REST_TILT, REST_DROP, cardMetrics, cardLeft, activeCard, copiesFor, springStep, edgeWeight }")()

assert.equal(m.REST_TILT.length, m.REST_DROP.length, "a drop for every tilt")
for (const t of m.REST_TILT) assert.ok(Math.abs(t) >= 2 && Math.abs(t) <= 6, "resting tilts are small, like the reference")

for (const [W, H] of [[1440, 900], [1280, 720], [1920, 1080], [1024, 768], [390, 844], [1342, 663], [607, 582]]) {
  const bandH = H * 0.55
  const { cw, ch, pitch } = m.cardMetrics(W, bandH)
  assert.ok(cw >= 110 && ch <= bandH * 0.8, W + "x" + H + ": cards fit the row")
  assert.ok(Math.abs(cw / ch - m.CARD_ASPECT) < 1e-9, "poster aspect kept")
  const n = 8 * m.copiesFor(8, pitch, W)
  const gutter = 24
  // tilt (6 deg) and the largest fold widen a card by at most this much either side
  const slack = cw * 0.25
  for (let i = 0; i < n; i++) {
    let prev = m.cardLeft(i, 0, pitch, n, gutter)
    for (let s = 3; s <= pitch * n * 1.5; s += 3) {
      const x = m.cardLeft(i, s, pitch, n, gutter)
      if (x > prev) {
        // a wrap: it must leave and arrive off screen
        assert.ok(prev + cw + slack < 0, W + ": card " + i + " wraps while visible on the left (" + (prev + cw).toFixed(1) + ")")
        assert.ok(x - slack > W, W + ": card " + i + " appears on screen on the right (" + x.toFixed(1) + ")")
      } else assert.ok(Math.abs(prev - x - 3) < 1e-6, "moves with the scroll")
      prev = x
    }
  }
  // the middle card names the title
  for (let s = 0; s < pitch * n; s += pitch / 3) {
    const a = m.activeCard(s, pitch, n, gutter, cw, W / 2)
    const d = Math.abs(m.cardLeft(a, s, pitch, n, gutter) + cw / 2 - W / 2)
    for (let i = 0; i < n; i++) assert.ok(Math.abs(m.cardLeft(i, s, pitch, n, gutter) + cw / 2 - W / 2) >= d - 1e-9, "active is the nearest")
  }
}
assert.equal(m.cardLeft(0, 0, 200, 8, 24), 24, "the first card starts at the gutter")
assert.equal(m.cardLeft(1, 0, 200, 8, 24), 224, "one pitch apart")

// The row's spring is critically damped: smooth, and never past the target.
for (const omega of [6.5, 26, 40]) {
  let p = 0, v = 0, last = 0
  for (let k = 0; k < 600; k++) {
    const r = m.springStep(p, v, 1000, omega, 1 / 120)
    assert.ok(r.pos <= 1000 + 1e-6, "no overshoot at omega " + omega)
    assert.ok(r.pos >= last - 1e-9, "never runs backwards")
    assert.ok(r.pos - last < 1000 * omega / 120, "no jumps")
    last = r.pos; p = r.pos; v = r.vel
  }
  assert.ok(Math.abs(p - 1000) < 1, "settles on the target at omega " + omega)
}

// The cloth: pinned at the middle, free at the edges, symmetric.
assert.equal(m.edgeWeight(0.5, 0.5), 0)
for (let u = 0; u <= 1; u += 0.05) for (let v = 0; v <= 1; v += 0.05) {
  const e = m.edgeWeight(u, v)
  assert.ok(e >= 0 && e <= 1, "weight in range")
  assert.ok(Math.abs(e - m.edgeWeight(1 - u, 1 - v)) < 1e-9, "symmetric")
}
assert.ok(m.edgeWeight(0, 0.5) > 0.7 && m.edgeWeight(1, 0.5) > 0.7, "the side edges are the freest, so they flap")
assert.ok(m.edgeWeight(0.5, 0) < m.edgeWeight(0, 0.5), "top and bottom flap less than the sides")

console.log("cloth-works-gallery: ok")
