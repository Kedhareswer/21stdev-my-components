// Install-safety and layout checks for components/crumpled-paper-reveal.
// Run: node tests/crumpled-paper-reveal.test.mjs
//
// The stage layout lives in the .tsx (one published file), so the marked
// region is lifted out and type-stripped rather than kept as a second copy.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const dir = new URL("../components/crumpled-paper-reveal/", import.meta.url)
const src = readFileSync(new URL("crumpled-paper-reveal.tsx", dir), "utf8")
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")
const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"))
const tsconfig = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")

// ---- install safety --------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports.sort(), ["gsap", "gsap/ScrollTrigger", "react", "three"])
for (const dep of ["gsap", "three"]) assert.ok(pkg.dependencies[dep], dep + " is declared in the root package.json")
assert.ok(tsconfig.includes('"@/components/ui/crumpled-paper-reveal"'), "tsconfig paths line exists")
assert.match(demo, /from "@\/components\/ui\/crumpled-paper-reveal"/, "demo imports the installed path")

// A root that inherits its height collapses to 0px once installed.
assert.ok(src.includes('height = "100svh"'), "root height defaults to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full anywhere")
assert.doesNotMatch(src + demo, /@import/, "no @import")
assert.doesNotMatch(src, /^\s*(\*|body|:root)\s*{/m, "no bare global resets")
assert.ok(src.includes('maxWidth: "none"'), "fallback canvases escape Preflight's max-width")

// 21st's capture sandbox blocks other origins: nothing may be fetched.
assert.doesNotMatch(src + demo, /https?:\/\/(?!www\.w3\.org)/, "no off-origin URLs in the component or demo")
for (const f of ["__FONT_HAND__", "__FONT_SIGN__", "__FONT_TYPE__", "__FONT_SERIF__"])
  assert.ok(!src.includes(f), f + " placeholder was replaced by the embedded font")
assert.ok(src.length + demo.length < 200_000, "component + demo stay under 200 KB")

// Only the semantic tokens the host is guaranteed to have.
const tokens = [...src.matchAll(/\b(?:text|bg|border|ring|fill|stroke)-((?:muted-)?(?:foreground|background|border|primary))\b/g)].map((m) => m[1])
for (const t of tokens) assert.ok(["foreground", "muted-foreground", "background", "border", "primary"].includes(t), "unknown token " + t)

// Motion and accessibility are not optional.
assert.ok(src.includes("prefers-reduced-motion: reduce"), "reads prefers-reduced-motion")
assert.ok(/motion-reduce:/.test(src), "motion-reduce variants present")
assert.ok(src.includes('className="sr-only"'), "each sheet's text is real text for screen readers")
assert.ok(src.includes("aria-expanded"), "balls expose their open state")
assert.ok(src.includes('e.key === "Escape"'), "Escape crumples the sheet back")

// ---- layout ----------------------------------------------------------------
const start = src.indexOf("// #region layout")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "layout region markers missing")
const js = stripTypeScriptTypes(src.slice(start, end))
const { layoutStage } = await import("data:text/javascript," + encodeURIComponent(js))

for (const [W, H] of [[320, 568], [375, 812], [390, 844], [768, 1024], [1280, 800], [1440, 900], [1920, 1080]]) {
  for (let n = 1; n <= 7; n++) {
    const l = layoutStage(W, H, n, 0.8)
    const tag = `${W}x${H} n=${n}`
    assert.equal(l.balls.length, n, tag)
    for (const b of l.balls) {
      assert.ok(b.x - l.ball / 2 >= 0 && b.x + l.ball / 2 <= W, `${tag}: ball inside horizontally`)
      assert.ok(b.y - l.ball / 2 >= 0 && b.y + l.ball / 2 <= H, `${tag}: ball inside vertically`)
    }
    for (let i = 0; i < n; i++)
      for (let j = i + 1; j < n; j++) {
        const d = Math.hypot(l.balls[i].x - l.balls[j].x, l.balls[i].y - l.balls[j].y)
        assert.ok(d >= l.ball, `${tag}: balls ${i} and ${j} overlap`)
      }
    for (const o of l.open) {
      assert.ok(o.x - l.sheet.w / 2 >= -0.5 && o.x + l.sheet.w / 2 <= W + 0.5, `${tag}: open sheet fits the width`)
      assert.ok(o.y - l.sheet.h / 2 >= -0.5 && o.y + l.sheet.h / 2 <= H + 0.5, `${tag}: open sheet fits the height`)
    }
    // An opened sheet must be readable: on a phone it takes most of the width.
    if (W < 640) assert.ok(l.sheet.w >= W * 0.8 || l.sheet.h >= H * 0.8, `${tag}: phone sheet is readable`)
  }
}

console.log("crumpled-paper-reveal: ok")
