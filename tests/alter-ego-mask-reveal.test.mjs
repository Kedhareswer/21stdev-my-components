// Install-safety + trail-timing checks for alter-ego-mask-reveal.
// Run: node tests/alter-ego-mask-reveal.test.mjs

import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const dir = new URL("../components/alter-ego-mask-reveal/", import.meta.url)
const src = readFileSync(new URL("alter-ego-mask-reveal.tsx", dir), "utf8")
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")

// ---- install safety --------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import the component may have")

assert.doesNotMatch(src, /@import/, "no @import — the host project owns fonts and Tailwind")
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.doesNotMatch(src, /className=["'][^"']*\bh-full\b/, "no h-full on any root element")
assert.ok(src.includes("prefers-reduced-motion"), "honours reduced motion")

const css = src.match(/const AEM_CSS = `([\s\S]*?)`/)
assert.ok(css, "AEM_CSS block is present")
assert.doesNotMatch(css[1], /\$\{|`/, "no backticks or interpolation inside the CSS string")
assert.match(css[1], /\.aem-svg \{[^}]*max-width: none/, "the stage svg overrides Preflight max-width")

let ruleCount = 0
for (const m of css[1].replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(?<=^|[{}])\s*([^{}]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || /^(from|to|[\d.]+%)/.test(sel)) continue
  ruleCount++
  assert.ok(
    sel.split(",").every((s) => s.trim().startsWith(".aem-")),
    `unscoped CSS selector would leak into the host app: ${sel}`,
  )
}
assert.ok(ruleCount >= 5, `expected the scope check to see real rules, saw ${ruleCount}`)

// SVG ids must be unique per instance or two reveals on one page share a mask.
assert.match(src, /React\.useId\(\)/, "ids come from useId")
assert.match(src, /replace\(\/\[\^a-zA-Z0-9_-\]\/g, ""\)/, "useId colons are stripped before url(#…)")
assert.doesNotMatch(src, /id="[a-z]/, "no hard-coded SVG ids")

// ---- self-contained: embedded, not downloaded ------------------------------
// The default photos ride inside the file, so the capture sandbox and an
// offline install both see them.
const shipped = src + demo
const urls = [...shipped.matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0])
assert.deepEqual(urls, [], `component and demo must make no network requests: ${urls.join(", ")}`)
const hrefs = [...src.matchAll(/<image\s+href=\{(\w+)\}/g)].map((m) => m[1])
assert.deepEqual(hrefs.sort(), ["baseSrc", "revealSrc"], "both layers are photos, overridable by prop")
assert.match(src, /baseSrc = BASE_PHOTO/, "the civilian photo is the default")
assert.match(src, /revealSrc = REVEAL_PHOTO/, "the hero photo is the default")
for (const k of ["BASE_PHOTO", "REVEAL_PHOTO"]) {
  const m = src.match(new RegExp(`const ${k} =\\s*"(data:image/webp;base64,[A-Za-z0-9+/=]+)"`))
  assert.ok(m, `${k} is an embedded webp`)
  assert.ok(m[1].length < 80_000, `${k} stays small (${m[1].length} chars)`)
}
assert.match(src, /revealSrc === REVEAL_PHOTO \? REVEAL_FIT/, "the built-in fit is not forced onto someone else's photo")

// ---- interaction wiring ----------------------------------------------------
assert.match(src, /onPointerLeave=\{onPointerLeave\}/, "leaving the stage lets the mask melt away")
assert.match(src, /S\.inside = false/, "…by releasing the head blob")
assert.match(src, /e\.key === "Enter" \|\| e\.key === " "/, "keyboard can suit up too")
assert.match(src, /tabIndex=\{0\}/, "and the stage is focusable")

// ---- the demo is the component, full bleed, nothing else -------------------
assert.doesNotMatch(demo, /<select|<input|<button|<label/, "demo must not ship controls")
assert.doesNotMatch(demo, /absolute|fixed|z-\[/, "demo must not overlay anything on the component")
assert.ok(demo.includes("<AlterEgoMaskReveal"), "demo renders the component")
assert.ok(demo.includes('from "@/components/ui/alter-ego-mask-reveal"'), "demo imports the installer path")

// ---- trail maths (lifted from the #region block) ---------------------------
const region = src.match(/\/\/ #region trail([\s\S]*?)\/\/ #endregion/)
assert.ok(region, "trail region is present")
const { blobRadius, stampsBetween, approach, portraitBox } = await import(
  "data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(region[1]))
)

// a blob is born empty, swells, and is gone by the end of its life
{
  const life = 900
  const size = 80
  assert.equal(blobRadius(0, life, size), 0)
  assert.equal(blobRadius(life, life, size), 0)
  assert.equal(blobRadius(life + 50, life, size), 0)
  const peak = Math.max(...Array.from({ length: 200 }, (_, i) => blobRadius((i / 200) * life, life, size)))
  assert.ok(peak > size && peak < size * 1.2, `swells a little past full like a landing drop, got ${peak}`)
  let prev = Infinity
  for (let t = 200; t < life; t += 10) {
    const r = blobRadius(t, life, size)
    assert.ok(r <= prev + 1e-9, "once melting, it never grows back")
    prev = r
  }
  assert.ok(blobRadius(life * 0.97, life, size) < size * 0.15, "nearly gone just before the end")
}

// fast strokes are filled in, but never with a runaway number of blobs
{
  assert.deepEqual(stampsBetween(0, 0, 10, 0, 30), [], "tiny moves stamp nothing")
  const pts = stampsBetween(0, 0, 300, 0, 30)
  assert.equal(pts.length, 10)
  assert.deepEqual(pts.at(-1), [300, 0], "the last stamp lands on the pointer")
  for (let i = 1; i < pts.length; i++) assert.ok(pts[i][0] - pts[i - 1][0] <= 30 + 1e-9, "no gaps wider than the spacing")
  assert.equal(stampsBetween(0, 0, 5000, 0, 10).length, 12, "capped per event")
}

// easing converges and is frame-rate independent
{
  let a = 0
  for (let i = 0; i < 60; i++) a = approach(a, 1, 8, 1 / 60)
  let b = 0
  for (let i = 0; i < 30; i++) b = approach(b, 1, 8, 1 / 30)
  assert.ok(Math.abs(a - b) < 1e-9, "60fps and 30fps land in the same place")
  assert.ok(a > 0.99, "and actually get there")
}

// the portrait sits on the bottom edge and always fits across the stage
{
  for (const vw of [400, 750, 1000, 1600, 2400]) {
    const b = portraitBox(vw)
    assert.ok(Math.abs(b.y + 800 * b.s - 1000) < 1e-9, `bottom anchored at vw=${vw}`)
    assert.ok(b.x >= -1e-9 && b.x + 600 * b.s <= vw + 1e-9, `fits the width at vw=${vw}`)
    assert.ok(Math.abs(b.x - (vw - 600 * b.s - b.x)) < 1e-9, `centred at vw=${vw}`)
  }
}

console.log("alter-ego-mask-reveal: ok")
