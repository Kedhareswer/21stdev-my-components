// Runnable check for the index/easing/cover math in components/morph-gallery,
// plus the install-safety rules the .tsx has to keep.
// Run: node tests/morph-gallery.test.mjs
//
// The dissolve itself is a shader and cannot be asserted here. What is checked
// is the part that decides *which* images are on screen and how the frame is
// fitted to the box — where the failures are quiet: an index that walks off
// the end, an easing that never arrives, a cover that stretches.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const src = readFileSync(
  new URL("../components/morph-gallery/morph-gallery.tsx", import.meta.url),
  "utf8",
)

const start = src.indexOf("// #region gallery")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "gallery region markers missing")

const js = src
  .slice(start, end)
  .replace(/:\s*\[number, number\]/g, "")
  .replace(/:\s*(number|boolean)(?=[,)\s={])/g, "")
const { wrapIndex, easeInOutQuint, coverScale } = await import(
  "data:text/javascript," + encodeURIComponent(js)
)

// ---- the index never leaves the gallery ----------------------------------
{
  const n = 6
  for (let i = -20; i <= 20; i++) {
    const w = wrapIndex(i, n, true)
    assert.ok(Number.isInteger(w) && w >= 0 && w < n, `looping index ${i} -> ${w}`)
    const c = wrapIndex(i, n, false)
    assert.ok(c >= 0 && c < n, `clamped index ${i} -> ${c}`)
  }
  // Looping wraps in both directions; clamping stops dead at the ends.
  assert.equal(wrapIndex(6, 6, true), 0, "past the end wraps to the start")
  assert.equal(wrapIndex(-1, 6, true), 5, "before the start wraps to the end")
  assert.equal(wrapIndex(6, 6, false), 5, "without loop it stops at the last")
  assert.equal(wrapIndex(-1, 6, false), 0, "and at the first")
  // An empty gallery must not produce NaN or -1 and index items with it.
  assert.equal(wrapIndex(3, 0, true), 0, "an empty gallery has no index but 0")
  assert.equal(wrapIndex(3, 0, false), 0, "and the same without loop")
}

// ---- the easing arrives, and only goes forwards ---------------------------
{
  assert.equal(easeInOutQuint(0), 0, "starts at 0")
  assert.equal(easeInOutQuint(1), 1, "and finishes at 1")
  // Out-of-range time is clamped, not extrapolated: a stalled tab that hands
  // in a huge elapsed must not send the mix past the incoming image.
  assert.equal(easeInOutQuint(5), 1, "a late frame clamps rather than overshoots")
  assert.equal(easeInOutQuint(-3), 0, "and so does a negative one")
  let prev = -Infinity
  for (let t = 0; t <= 1.00001; t += 0.01) {
    const v = easeInOutQuint(t)
    assert.ok(v >= prev - 1e-12, `easing went backwards at t=${t}`)
    assert.ok(v >= -1e-12 && v <= 1 + 1e-12, `easing left [0,1] at t=${t}`)
    prev = v
  }
  // In-out, so it is symmetric about the middle and half-way at half-time.
  assert.ok(Math.abs(easeInOutQuint(0.5) - 0.5) < 1e-9, "half-time is half-way")
  for (const t of [0.1, 0.25, 0.4]) {
    assert.ok(
      Math.abs(easeInOutQuint(t) + easeInOutQuint(1 - t) - 1) < 1e-9,
      `not symmetric at ${t}`,
    )
  }
}

// ---- cover crops, and never stretches ------------------------------------
{
  for (const canvas of [0.4, 1, 1.78, 3]) {
    for (const img of [0.5, 1, 1.5, 2.4]) {
      const [sx, sy] = coverScale(canvas, img)
      // Both factors <= 1 means the sampled window only ever shrinks, which is
      // what makes it a crop. A factor > 1 would sample outside the image and
      // smear the clamped edge across the frame.
      assert.ok(sx > 0 && sx <= 1 + 1e-12, `scale x out of range: ${sx}`)
      assert.ok(sy > 0 && sy <= 1 + 1e-12, `scale y out of range: ${sy}`)
      // Exactly one axis is untouched — the one that already fills the box.
      assert.ok(
        Math.abs(sx - 1) < 1e-12 || Math.abs(sy - 1) < 1e-12,
        `neither axis fills the box at ${canvas}/${img}`,
      )
      // And the result is undistorted: the sampled window has the box's aspect.
      assert.ok(
        Math.abs((img * sx) / sy - canvas) < 1e-9,
        `aspect not preserved at ${canvas}/${img}`,
      )
    }
  }
  assert.deepEqual(coverScale(1, 1), [1, 1], "a square in a square is untouched")
}

// ---- install safety ------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "the only import may be react")
assert.doesNotMatch(src, /@import/, "no @import — the host owns Tailwind and fonts")
assert.doesNotMatch(src, /^\s*(\*|body|:root|html)\s*{/m, "no bare global resets")

// The pen sized from the window. A component is not the viewport and its box
// can move, so both the drawing buffer and the pointer come off the element.
assert.doesNotMatch(src, /innerWidth|innerHeight/, "size from the element, not the window")
assert.ok(src.includes("canvas.clientWidth"), "the canvas measures its own box")
assert.ok(src.includes("new ResizeObserver"), "a resized box must resize the drawing buffer")

// A full-bleed piece still needs a definite height of its own.
assert.ok(/height = "100svh"/.test(src), "root height must default to a definite length")
const root = src.slice(src.indexOf("<section"), src.indexOf("{failed ?"))
assert.doesNotMatch(root, /\bh-(full|screen)\b/, "no percentage height on the root")

// Cross-origin images cannot be uploaded to WebGL without CORS, and a host
// whose CDN omits the header must get a working gallery, not a black box.
assert.ok(src.includes('crossOrigin = "anonymous"'), "textures need CORS-enabled images")
assert.ok(src.includes("setFailed(true)"), "a failure has to be recorded, not swallowed")
assert.ok(
  /failed \?/.test(src) && /object-cover/.test(src),
  "the fallback must still show the pictures",
)
assert.ok(
  src.includes("webglcontextlost") && src.includes("webglcontextrestored"),
  "a dropped context must rebuild rather than stay black",
)

// One program, one buffer and a texture per image are allocated per mount; a
// route change that leaks them exhausts the context in a few visits.
for (const gone of [
  "gl.deleteProgram(program)",
  "gl.deleteBuffer(buffer)",
  "gl.deleteTexture(tex)",
  "gl.deleteShader(vert)",
  "observer.disconnect()",
  "cancelAnimationFrame(raf)",
]) {
  assert.ok(src.includes(gone), `cleanup is missing ${gone}`)
}

// Motion is the whole effect, so reduced motion has to land on the next slide
// rather than merely dissolve more slowly.
assert.ok(src.includes("prefers-reduced-motion"), "must read prefers-reduced-motion")
assert.ok(/t\.reduced \? 0 :/.test(src), "reduced motion must skip the dissolve, not slow it")
assert.ok(/!autoplay \|\| reduced/.test(src), "and must stop autoplay moving the page by itself")

// Preflight's img { max-width: 100% } collapses the thumbnail strip.
assert.ok(src.includes('maxWidth: "none"'), "thumbnails must opt out of Preflight")
assert.ok(/width=\{80\}/.test(src) && /height=\{50\}/.test(src), "thumbnails need explicit size")

// WebGL1 cannot mipmap or repeat a non-power-of-two texture, and photographs
// never are; the wrong pair renders every slide black with no error.
assert.ok(src.includes("CLAMP_TO_EDGE") && src.includes("gl.LINEAR"), "NPOT-safe sampling")
assert.doesNotMatch(src, /generateMipmap/, "mipmaps are illegal on NPOT textures here")

// Every uniform the shader declares has to be set, and every one set has to
// exist — a typo in either list silently freezes that control.
const declared = [...src.matchAll(/^uniform\s+\w+\s+u_(\w+);/gm)].map((m) => m[1])
const named = [...src.matchAll(/uniforms\.(\w+)[,)]/g)].map((m) => m[1])
for (const name of declared) {
  assert.ok(named.includes(name), `uniform u_${name} is declared but never set`)
}
for (const name of new Set(named)) {
  assert.ok(declared.includes(name), `uniforms.${name} is set but no shader declares it`)
}
assert.equal(declared.length, 10, `expected 10 uniforms, saw ${declared.length}`)

// The demo wrapper collapses to 0px wide inside 21st's centring flex if it is
// left at width:auto — the same trap as h-full, one axis over.
for (const cls of readFileSync(
  new URL("../components/morph-gallery/demo.tsx", import.meta.url),
  "utf8",
).match(/className="[^"]*"/g) ?? []) {
  if (!/\brelative\b/.test(cls)) continue
  assert.ok(/\bw-(full|screen|\[|\d)/.test(cls), `${cls} wraps the gallery without a width`)
}

console.log("morph-gallery: ok")
