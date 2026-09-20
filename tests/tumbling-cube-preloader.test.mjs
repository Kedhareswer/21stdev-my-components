// Install-safety + progress-logic checks for tumbling-cube-preloader.
// Run: node tests/tumbling-cube-preloader.test.mjs

import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const dir = new URL("../components/tumbling-cube-preloader/", import.meta.url)
const src = readFileSync(new URL("tumbling-cube-preloader.tsx", dir), "utf8")
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")

// ---- install safety --------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import the component may have")

assert.doesNotMatch(src, /@import/, "no @import — the host project owns fonts and Tailwind")
assert.doesNotMatch(src, /^\s*(\*|body|html|:root)\s*\{/m, "no bare global resets")
assert.ok(src.includes('height = "100svh"'), "height prop defaults to a definite length")
assert.doesNotMatch(src, /className=["'][^"']*\bh-full\b/, "no h-full on any root element")

// The scoped <style> is a template literal: interpolation would break it, and
// a stray backtick would end it early.
const css = src.match(/const TCP_CSS = `([\s\S]*?)`/)
assert.ok(css, "TCP_CSS block is present")
assert.doesNotMatch(css[1], /\$\{|`/, "no backticks or interpolation inside the CSS string")

// Tailwind Preflight sets `height: auto` on video/canvas, which collapses them
// inside an absolutely-positioned parent — this rule is the guard.
assert.match(
  css[1],
  /\.tcp-root video, \.tcp-root canvas \{[^}]*max-width: none/,
  "video and canvas must override Preflight's max-width",
)
assert.match(css[1], /\.tcp-root video, \.tcp-root canvas \{[^}]*height: 100%/, "…and its height:auto")

// Every rule in the block has to be scoped to the component root.
const noComments = css[1].replace(/\/\*[\s\S]*?\*\//g, "")
let ruleCount = 0
for (const match of noComments.matchAll(/(?<=^|[{}])\s*([^{}]+?)\s*\{/g)) {
  const sel = match[1].trim()
  if (sel.startsWith("@") || /^(from|to|[\d.]+%)/.test(sel)) continue
  ruleCount++
  assert.ok(
    sel.split(",").every((s) => s.trim().startsWith(".tcp-")),
    `unscoped CSS selector would leak into the host app: ${sel}`,
  )
}
assert.ok(ruleCount > 20, `expected the scope check to see real rules, saw ${ruleCount}`)

// ---- no third-party branding or hotlinks -----------------------------------
// Nothing that belongs to the site this was inspired by may ship: not its
// name, not its copy, not its CDN.
const shipped = src + demo + readFileSync(new URL("demo-plate.tsx", dir), "utf8")
for (const brand of [/donprod/i, /double or nothing/i, /born risk takers/i, /director showcase/i, /2023 ?- ?2026/]) {
  assert.doesNotMatch(shipped, brand, `branded string must not ship: ${brand}`)
}
for (const url of shipped.matchAll(/https?:\/\/[^"'\s)]+/g)) {
  assert.match(
    url[0],
    /^https:\/\/mdn\.github\.io\/shared-assets\//,
    `external asset must be a CORS-enabled, openly licensed clip: ${url[0]}`,
  )
}

// ---- motion + a11y ---------------------------------------------------------
assert.ok(src.includes("prefers-reduced-motion"), "must honour prefers-reduced-motion")
assert.ok(src.includes('role="progressbar"'), "the gate reports progress to assistive tech")

// ---- fidelity to the reference plate ---------------------------------------
assert.ok(src.includes("perspective: 800px"), "3D scene perspective")
assert.ok(src.includes("preserve-3d"), "preserve-3d transform style")
assert.ok(src.includes("mix-blend-mode: difference"), "difference blend layer")
assert.ok(src.includes("cubic-bezier(0.83, 0, 0.17, 1)"), "the tumble easing curve")
assert.ok(src.includes("scaleY(1.3)"), "the cube's vertical stretch")
assert.ok(src.includes("backface-visibility: hidden"), "cube faces hide their backs")

// Stripped down to the shader, the cube and the counter — nothing else.
for (const gone of ["tcp-poster", "tcp-hud", "tcp-bracket", "tcp-crosshair", "tcp-strike", "accentColor"]) {
  assert.ok(!src.includes(gone), `removed chrome came back: ${gone}`)
}
assert.ok(src.includes("tcp-perc"), "the percentage counter stays")
assert.ok(src.includes('word = "LOADER"'), "default word is unbranded")

// Looping must actually restart the CSS animations, which only a remount does.
assert.match(src, /key=\{cycle\}/, "the cube is keyed on the cycle so each loop replays")
assert.match(src, /setCycle\(\(c\) => c \+ 1\)/, "loop advances the cycle")
for (const preset of ["cinema", "chroma", "highcontrast", "subtle"]) {
  assert.ok(src.includes(preset + ":"), `shader preset missing: ${preset}`)
}

// The GL program is built once; the grade must reach it through a ref, or every
// slider tweak would tear down and rebuild the context.
assert.match(src, /gradeRef\.current/, "grade is read through a ref inside the render loop")
// Likewise onComplete: depending on its identity restarts the gate every frame.
assert.match(src, /onCompleteRef\.current/, "onComplete is called through a ref")
assert.doesNotMatch(
  src,
  /\}, \[[^\]]*\bonComplete\b[^\]]*\]\)/,
  "no effect may depend on onComplete identity",
)

// ---- progress curve (lifted from the #region block) ------------------------
const region = src.match(/\/\/ #region progress([\s\S]*?)\/\/ #endregion/)
assert.ok(region, "progress region is present")
const { preloaderProgress, preloaderDuration } = await import(
  "data:text/javascript," + encodeURIComponent(region[1].replace(/: ?number|: ?string/g, ""))
)

assert.equal(preloaderProgress(0), 0, "starts at 0")
assert.equal(preloaderProgress(1), 100, "ends at 100")
assert.equal(preloaderProgress(-5), 0, "clamps below 0")
assert.equal(preloaderProgress(5), 100, "clamps above 1")

// Monotonic: the counter must never tick backwards.
let prev = -1
for (let i = 0; i <= 1000; i++) {
  const v = preloaderProgress(i / 1000)
  assert.ok(v >= prev, `counter went backwards at t=${i / 1000}: ${prev} -> ${v}`)
  assert.ok(v >= 0 && v <= 100, `counter left 0..100 at t=${i / 1000}: ${v}`)
  prev = v
}

// The suspense hold: it should linger in the 40s for a good stretch.
assert.equal(preloaderProgress(0.36), 42, "hold starts at 42")
assert.equal(preloaderProgress(0.74), 48, "hold ends at 48")

// Duration derives from word length, with a floor, and speed divides it.
assert.equal(preloaderDuration(6), 4200, "a six-letter word tumbles for 4.2s")
assert.equal(preloaderDuration(1), 3200, "short words still get the 3.2s floor")
assert.equal(preloaderDuration(6, 2), 2100, "speed halves the runtime")

console.log("tumbling-cube-preloader: ok")
