// Install-safety and choreography verification for elastic-editorial-about.
// Run: node tests/elastic-editorial-about.test.mjs

import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const dir = new URL("../components/elastic-editorial-about/", import.meta.url)
const src = readFileSync(new URL("elastic-editorial-about.tsx", dir), "utf8")
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")

// ---- 1. Install safety -----------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import the component may have")

assert.doesNotMatch(src, /@import/, "no @import — host project owns fonts and styles")
assert.doesNotMatch(src, /^\s*(\*|body|html|:root)\s*\{/m, "no bare global resets")
assert.ok(src.includes('height = "100svh"'), "height prop defaults to a definite length")
assert.doesNotMatch(src, /className=["'][^"']*\bh-full\b/, "no h-full on root element")

// ---- 2. Scoped CSS Block ---------------------------------------------------
const cssMatch = src.match(/const EEA_CSS = `([\s\S]*?)`/)
assert.ok(cssMatch, "EEA_CSS block is present")
const css = cssMatch[1]

assert.doesNotMatch(css, /\$\{|`/, "no interpolation or unescaped backticks in CSS string")

const noComments = css.replace(/\/\*[\s\S]*?\*\//g, "")
let ruleCount = 0
for (const match of noComments.matchAll(/(?<=^|[{}])\s*([^{}]+?)\s*\{/g)) {
  const sel = match[1].trim()
  if (sel.startsWith("@") || /^(from|to|[\d.]+%)/.test(sel)) continue
  ruleCount++
  assert.ok(
    sel.split(",").every((s) => s.trim().startsWith(".eea-")),
    `unscoped CSS selector would leak into the host app: ${sel}`,
  )
}
assert.ok(ruleCount >= 15, `expected at least 15 scoped rules, saw ${ruleCount}`)

// ---- 3. No third-party branding or inspiration hotlinks --------------------
// The replicated site's name, crew, and copy must not appear anywhere in the component or demo.
const shipped = src + demo
for (const brand of [/kirifuda/i, /切札/, /arikata/i, /kenshiro/i, /tomigaya/i]) {
  assert.doesNotMatch(shipped, brand, `replicated site branding must not ship: ${brand}`)
}

// ---- 4. Reference Fidelity (Animations & Parabolic Warp Geometry) -----------
assert.ok(css.includes("@keyframes eea_keyframe_y"), "eea_keyframe_y keyframes are present")
assert.ok(css.includes("@keyframes eea_keyframe_y_scale_color"), "eea_keyframe_y_scale_color keyframes are present")
assert.ok(css.includes("@keyframes eea_keyframe_y_scale_color_g"), "eea_keyframe_y_scale_color_g keyframes are present")
assert.ok(css.includes("@keyframes eea_keyframe_y_scale_opacity"), "eea_keyframe_y_scale_opacity keyframes are present")

// Keyframe checks
assert.ok(css.includes("transform: translate(0, 140%)"), "title reveals from translate(0, 140%)")
assert.ok(css.includes("scale(1.2)"), "scale-in starts from 1.2x scale")
assert.ok(css.includes("cubic-bezier(0.215, 0.610, 0.355, 1.000)"), "authentic easeOutCubic curve used")

// Parabolic curvature in WebGL shader
assert.ok(src.includes("pow(abs(vUv.x - 0.5), 2.0)"), "parabolic horizontal curvature formula in WebGL")
assert.ok(src.includes("u_about_delta"), "scroll velocity delta uniform in shader")

// Content sections
for (const section of ["WHO WE ARE", "OUR CREWS", "AWARDS", "COMPANY PROFILE"]) {
  assert.ok(src.includes(section), `editorial section missing: ${section}`)
}

// ---- 5. Accessibility and Motion -------------------------------------------
assert.ok(src.includes("prefers-reduced-motion"), "honours prefers-reduced-motion")

// ---- 6. Canonical Demo Import ----------------------------------------------
assert.ok(
  demo.includes("@/components/ui/elastic-editorial-about"),
  "demo imports the canonical path",
)

console.log("elastic-editorial-about: ok")
