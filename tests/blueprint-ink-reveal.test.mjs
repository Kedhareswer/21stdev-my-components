// Install-safety + de-branding checks for blueprint-ink-reveal.
// Run: node tests/blueprint-ink-reveal.test.mjs

import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const dir = new URL("../components/blueprint-ink-reveal/", import.meta.url)
const src = readFileSync(new URL("blueprint-ink-reveal.tsx", dir), "utf8")
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")
const shipped = src + demo

// ---- install safety --------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import the component may have")
assert.doesNotMatch(src, /@import/, "no @import — the host project owns fonts and Tailwind")
assert.doesNotMatch(src, /^\s*(\*|body|html|:root)\s*\{/m, "no bare global resets")

// A footer sizes to its content, so it takes no height prop. What matters is
// that its ROOT never asks for a percentage height: inner `h-full` is fine,
// because those sit inside `absolute inset-0` parents that do have one.
const rootCls = src.match(/ref=\{containerRef\}[\s\S]{0,600}?className=\{`([^`]*)`/)
assert.ok(rootCls, "found the root element's className")
assert.doesNotMatch(rootCls[1], /\bh-full\b|\bh-\[100%\]/, "root must not depend on a height chain")
assert.match(rootCls[1], /\bw-full\b/, "root spans its container")

// ---- nothing borrowed ------------------------------------------------------
// This started life as a reproduction of another company's footer, down to
// their wordmark bitmaps, logo mark, address, emails and social profiles.
for (const brand of [/heron/i, /bearplus/i, /bear\.plus/i, /martin pl/i, /fa3600/i]) {
  assert.doesNotMatch(shipped, brand, `branded string must not ship: ${brand}`)
}

// The wordmark is drawn at runtime; no bitmap of anyone's logotype rides along.
assert.doesNotMatch(src, /data:image\/(png|jpe?g|webp);base64/, "no embedded bitmaps")
assert.match(src, /function drawWordmark\(/, "the wordmark is generated, not shipped")

// Every URL must be inert or a namespace, never a real profile or map pin.
for (const url of shipped.matchAll(/https?:\/\/[^"'\s)]+/g)) {
  assert.match(
    url[0],
    /^http:\/\/www\.w3\.org\/2000\/svg$/,
    `component must not link out to a real destination: ${url[0]}`,
  )
}

// ---- it is the plate, not a footer -----------------------------------------
// The link columns, subscribe form, address, contacts, socials, logo mark and
// copyright bar were all scaffolding around the one thing worth shipping.
for (const gone of ["FooterLink", "SocialLink", "RollingLink", "IsometricMark",
                    "subscribe", "copyrightText", "policyLinks", "companyLinks"]) {
  assert.ok(!src.includes(gone), `footer chrome came back: ${gone}`)
}
assert.doesNotMatch(src, /<form|<input/, "no form left in the component")

// ---- the hover fix ---------------------------------------------------------
// The ink circle used to be placed by scaling the pointer against the outer
// container's width. The ink layer is inset by padding, capped by max-width
// and letterboxed by preserveAspectRatio, so that put it up to 208px off at
// the edges while looking correct dead centre. The SVG's own screen matrix is
// the only mapping that survives all three.
assert.match(src, /getScreenCTM\(\)/, "pointer mapping goes through the SVG's own matrix")
assert.match(src, /createSVGPoint\(\)/, "…using an SVG point, not hand-rolled arithmetic")
assert.doesNotMatch(
  src,
  /cx=\{[^}]*containerRef|cx=\{\(\s*springCoords\.x\s*\/[^}]*\bdims\b/,
  "the mask must not be positioned from container dimensions again",
)
// preserveAspectRatio is what makes the naive mapping wrong; if it ever goes
// away the letterbox goes with it, so keep them in sync deliberately.
assert.match(src, /preserveAspectRatio="xMidYMid meet"/, "ink layer is letterboxed on purpose")
assert.match(src, /const VIEW_W = 1000/, "the viewBox is named, not repeated as a literal")
assert.match(src, /const VIEW_H = 300/, "…both axes")

// The radius is a screen measurement, so it has to be divided by the same
// scale the coordinates were, or it grows and shrinks with the viewport.
assert.match(src, /r=\{currentRadius \/ Math\.max\(0\.0001, viewScale\)\}/, "radius converts px to viewBox units")

assert.match(src, /prefers-reduced-motion/, "honours reduced motion")

// ---- demo ------------------------------------------------------------------
assert.doesNotMatch(demo, /<select|<button|<label/, "demo must not ship controls")
assert.ok(demo.includes("<BlueprintInkReveal"), "demo renders the component")

console.log("blueprint-ink-reveal: ok")
