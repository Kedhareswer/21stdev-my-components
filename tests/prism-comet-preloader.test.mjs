// Install-safety, shader and timeline checks for prism-comet-preloader.
// Run: node tests/prism-comet-preloader.test.mjs

import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const dir = new URL("../components/prism-comet-preloader/", import.meta.url)
const src = readFileSync(new URL("prism-comet-preloader.tsx", dir), "utf8")
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")
const gate = readFileSync(new URL("demo-gate.tsx", dir), "utf8")
const ember = readFileSync(new URL("demo-ember.tsx", dir), "utf8")

// ---- 1. Install safety -----------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import the component may have")
assert.doesNotMatch(src, /@import/, "no @import — fonts come from the host or the fallback stack")
assert.doesNotMatch(src, /https?:\/\//, "no external assets: every pixel is computed in the shader")
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.doesNotMatch(src, /className=["'][^"']*\bh-full\b/, "no h-full")
assert.ok(src.includes("prefers-reduced-motion"), "honours reduced motion")
assert.ok(src.includes('role="progressbar"'), "reports progress to assistive tech")
assert.ok(src.includes("aria-valuenow={pct}"), "progressbar carries its value")
assert.ok(src.includes("onCompleteRef.current"), "calls onComplete through a ref")
assert.doesNotMatch(src, /\}, \[[^\]]*\bonComplete\b[^\]]*\]\)/, "effects must not depend on onComplete identity")
assert.doesNotMatch(src, /console\./, "no debug logging ships")
assert.doesNotMatch(src, /window as any|__pcp/, "no debug hooks ship")
assert.match(src, /cancelAnimationFrame\(raf\)/, "the frame loops are cancelled on unmount")
assert.match(src, /webglcontextlost/, "a lost context is handled")
assert.match(src, /setFailed\(true\)/, "no WebGL falls back instead of leaving a black box")
assert.match(src, /className="pcp-layer pcp-fallback"/, "the fallback is rendered")
assert.match(src, /IntersectionObserver/, "stops drawing while off screen")

// ---- 2. Scoped CSS ---------------------------------------------------------
const cssMatch = src.match(/const PCP_CSS = `([\s\S]*?)`/)
assert.ok(cssMatch, "PCP_CSS block is present")
const css = cssMatch[1]
assert.doesNotMatch(css, /\$\{|`/, "no interpolation or backticks in the CSS string")
assert.doesNotMatch(css, /^\s*(\*|body|html|:root)\s*\{/m, "no bare global resets")
assert.match(css, /\.pcp-root svg, \.pcp-root canvas, \.pcp-root img \{[^}]*max-width: none/, "media overrides Preflight's max-width")

let rules = 0
for (const match of css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(?<=^|[{}])\s*([^{}]+?)\s*\{/g)) {
  const sel = match[1].trim()
  if (sel.startsWith("@") || /^(from|to|[\d.]+%)/.test(sel) || /^\d+%,/.test(sel)) continue
  rules++
  assert.ok(
    sel.split(",").every((s) => s.trim().startsWith(".pcp-")),
    `unscoped CSS selector would leak into the host app: ${sel}`,
  )
}
assert.ok(rules >= 50, `expected a full scoped sheet, saw ${rules} rules`)

// The page behind the gate is the host's: nothing here may style it.
assert.doesNotMatch(css, /\.pcp-root \*|\.pcp-dest [^{]/, "nothing reaches into the children the gate guards")
const rootRule = css.match(/\n\.pcp-root \{([^}]*)\}/)
assert.ok(rootRule, ".pcp-root rule present")
assert.doesNotMatch(rootRule[1], /^\s*(font-family|color):/m, "type and colour live on the gate, not the root the children inherit from")
assert.match(css, /\.pcp-root:not\(\[data-phase="done"\]\) \{ background/, "the root drops its night once the page is in")

for (const phase of ["load", "ignite", "reveal", "lift", "done"]) {
  assert.ok(css.includes(`[data-phase="${phase}"]`), `phase ${phase} is styled`)
}
assert.match(css, /\[data-phase="lift"\]\[data-hole="true"\] \.pcp-gate \{[^}]*background: transparent/, "the gate opens onto the page")

const reduced = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"))
assert.match(reduced, /\.pcp-letter \{ filter: none; transform: none;/, "letters fade instead of racking focus")
assert.match(reduced, /\.pcp-rec, \.pcp-chip \{ animation: none; \}/, "blink and wipe hold still")

// ---- 3. Shader --------------------------------------------------------------
const frag = src.match(/const FRAG = `([\s\S]*?)`/)[1]
const vert = src.match(/const VERT = `([\s\S]*?)`/)[1]
assert.doesNotMatch(frag + vert, /\$\{/, "shaders are plain strings")
assert.doesNotMatch(frag + vert, /#version 300/, "WebGL 1 shaders, so every browser with WebGL runs them")
const declared = [...frag.matchAll(/^uniform \w+ (\w+);/gm)].map((m) => m[1]).sort()
const listed = [...src.match(/const UNIFORMS = \[([\s\S]*?)\] as const/)[1].matchAll(/"(\w+)"/g)].map((m) => m[1]).sort()
assert.deepEqual(listed, declared, "every uniform the shader declares is looked up, and nothing else")
for (const name of declared) {
  assert.ok(src.includes(`(U.${name},`), `uniform ${name} is set every frame`)
}
// The sheet tiles across x, or the ring would show a seam where it closes.
assert.match(frag, /float x0 = mod\(i\.x, per\);/, "noise wraps across the sheet")
assert.match(frag, /p = p \* 2\.0 \+ vec2\(0\.0, 17\.3\);\s*per \*= 2\.0;/, "each octave keeps the period")

// ---- 4. Timeline and rig, executed -----------------------------------------
const start = src.indexOf("// #region timeline")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "timeline region markers missing")
const js = src.slice(start, end).replace(/:\s*(number|string)(?=[,)])/g, "")
const { pcpSimulated, pcpEase, pcpMorph, pcpPass, pcpView, pcpHead, pcpRig, pcpIgnite, pcpTimecode, pcpHex } =
  await import("data:text/javascript," + encodeURIComponent(js))

const TAU = Math.PI * 2
const near = (a, b, eps, msg) => assert.ok(Math.abs(a - b) < eps, `${msg}: ${a} vs ${b}`)

assert.equal(pcpSimulated(-1), 0)
assert.equal(pcpSimulated(0), 0)
assert.equal(pcpSimulated(1), 1)
let prev = 0
for (let i = 1; i <= 400; i++) {
  const v = pcpSimulated(i / 400)
  assert.ok(v >= prev - 1e-9 && v >= 0 && v <= 1, `simulated progress is monotonic and in range (t=${i / 400})`)
  prev = v
}
assert.ok(pcpSimulated(0.27) - pcpSimulated(0.17) < 0.06, "the load stalls like a real one")

assert.equal(pcpEase(0), 0)
assert.equal(pcpEase(1), 1)
assert.equal(pcpEase(0.5), 0.5)
assert.equal(pcpEase(3), 1, "ease clamps")

// progress → stack position: 0 to 4, never backwards, holding each pass for a beat
assert.equal(pcpMorph(0), 0)
assert.equal(pcpMorph(1), 4)
assert.equal(pcpMorph(2), 4)
prev = 0
for (let i = 1; i <= 1000; i++) {
  const m = pcpMorph(i / 1000)
  assert.ok(m >= prev - 1e-9, `the stack never runs backwards (p=${i / 1000})`)
  assert.ok(m - prev < 0.05, `the stack never jumps (p=${i / 1000})`)
  prev = m
}
for (const k of [1, 2, 3]) {
  near(pcpMorph(k / 4), k, 1e-9, `pass ${k} is fully applied at ${k * 25}%`)
  assert.equal(pcpMorph(k / 4 + 0.05), k, `and holds a beat before the next one starts`)
}

assert.equal(pcpPass(0, 5), 0)
assert.equal(pcpPass(1, 5), 1)
assert.equal(pcpPass(2.6, 5), 3)
assert.equal(pcpPass(4, 5), 4, "the last label belongs to the finished stack")
assert.equal(pcpPass(4, 1), 0)
assert.equal(pcpPass(2, 0), -1, "no labels, no chip")

const ASPECTS = [0.46, 0.75, 1, 1.33, 16 / 9, 2.4]
for (const aspect of ASPECTS) {
  const where = `aspect ${aspect.toFixed(2)}`
  const view = pcpView(aspect)
  assert.ok(view.w >= 0.9 - 1e-9, `${where}: the frame is never narrower than the bloom`)

  // 0 · the flat sheet: a fan so shallow its top edge is the top of the frame
  const r0 = pcpRig(0, aspect)
  near(r0.rho0 * r0.phi, view.w, 1e-9, `${where}: the sheet spans the frame`)
  near(r0.ay - r0.rho0, view.h / 2, 1e-9, `${where}: and hangs from its top edge`)
  near(r0.kv, 1 / view.h, 1e-9, `${where}: and runs to its bottom`)
  assert.equal(r0.edge, 0, `${where}: no fan edges on the flat sheet`)

  // 1 · polar coordinates: a closed ring around the centre
  const r1 = pcpRig(1, aspect)
  near(r1.phi, TAU, 1e-9, `${where}: the ring closes`)
  assert.equal(r1.rho0, 0)
  assert.deepEqual([r1.ax, r1.ay], [0, 0], `${where}: around the centre`)
  assert.equal(r1.closed, 1)
  assert.equal(r1.edge, 0, `${where}: with no seam`)
  assert.equal(r1.narrow, 1, `${where}: sampling the whole sheet, so it tiles`)

  // 2 · the flame stands upright from a tip below centre
  const r2 = pcpRig(2, aspect)
  near(r2.beta, Math.PI / 2, 1e-9, `${where}: the flame points up`)
  assert.ok(r2.phi < 1 && r2.ay < 0, `${where}: narrow, from below centre`)

  // 3 · the comet rides its head, tail up and to the right, inside the frame
  const head = pcpHead(aspect)
  const r3 = pcpRig(3, aspect)
  assert.deepEqual([r3.ax, r3.ay, r3.beta], [head.x, head.y, head.tail], `${where}: comet rides its head`)
  assert.ok(Math.abs(head.x) < view.w / 2 - 0.05 && Math.abs(head.y) < view.h / 2 - 0.05, `${where}: head inside the frame`)
  assert.ok(head.tail > 0 && head.tail < Math.PI / 2, `${where}: tail streams up and right`)
  const tail = 0.8 / r3.kv
  const tx = head.x + Math.cos(head.tail) * tail
  const ty = head.y + Math.sin(head.tail) * tail
  assert.ok(Math.abs(tx) < view.w / 2 && Math.abs(ty) < view.h / 2, `${where}: tail ends inside the frame`)
  assert.equal(r3.star, 0)
  assert.equal(pcpRig(4, aspect).star, 1, `${where}: the star is lit at the end of the stack`)

  // continuous everywhere the apex is on screen: a morph, never a cut
  let last = pcpRig(0.25, aspect)
  for (let i = 1; i <= 3750; i++) {
    const r = pcpRig(0.25 + i / 1000, aspect)
    for (const key of ["ax", "ay", "beta", "phi", "kv", "vf", "narrow", "wave", "bulge", "star"]) {
      assert.ok(Math.abs(r[key] - last[key]) < 0.06, `${where}: ${key} jumps at m=${(0.25 + i / 1000).toFixed(3)}`)
    }
    assert.ok(r.phi > 0 && r.phi <= TAU + 1e-9, `${where}: the fan opening stays a real angle`)
    last = r
  }

  // ignition: from the comet's head to the centre, sparkle to portal
  const i0 = pcpIgnite(0, aspect)
  const i1 = pcpIgnite(1, aspect)
  assert.deepEqual([i0.x, i0.y], [head.x, head.y], `${where}: the star leaves from the comet's head`)
  near(i0.r, 0.05, 1e-9, `${where}: at the size it rode the comet`)
  assert.deepEqual([i0.mode, i0.comet, i0.rot], [0, 1, 0], `${where}: still a sparkle on a comet`)
  near(i1.x, 0, 1e-9, `${where}: lands centred`)
  near(i1.y, 0.1, 1e-9, `${where}: a little above the middle`)
  assert.deepEqual([i1.mode, i1.comet, i1.lines], [1, 0, 0], `${where}: a portal, the comet gone`)
  near(i1.r, 0.28, 1e-9, `${where}: at full size`)
  near(((i1.rot % (Math.PI / 2)) + Math.PI / 2) % (Math.PI / 2), 0.38, 1e-9, `${where}: resting at its turn`)
  let r = 0
  for (let i = 0; i <= 200; i++) {
    const s = pcpIgnite(i / 200, aspect)
    assert.ok(s.r >= r - 1e-12, `${where}: the star only grows`)
    assert.ok(s.bloom >= 0 && s.bloom <= 1, `${where}: bloom stays in range`)
    r = s.r
  }
}

assert.equal(pcpTimecode(0), "00:00:00:00")
assert.equal(pcpTimecode(-50), "00:00:00:00")
assert.equal(pcpTimecode(1000), "00:00:01:00")
assert.equal(pcpTimecode(61500), "00:01:01:12")
assert.equal(pcpTimecode(3600000), "01:00:00:00")

assert.deepEqual(pcpHex("#ffffff"), [1, 1, 1])
assert.deepEqual(pcpHex("#000"), [0, 0, 0])
assert.deepEqual(pcpHex(" 336699 "), [0.2, 0.4, 0.6])
assert.equal(pcpHex("rebeccapurple"), null, "named colours fall back to the default")
assert.equal(pcpHex("#12345"), null)

// ---- 5. Demos ---------------------------------------------------------------
for (const [name, d] of [["demo", demo], ["demo-gate", gate], ["demo-ember", ember]]) {
  assert.ok(d.includes('from "@/components/ui/prism-comet-preloader"'), `${name} imports the canonical path`)
}
assert.match(demo, /<PrismCometPreloader\s+loop[\s/>]/, "default demo is the looping component, full bleed")
assert.doesNotMatch(demo, /<div/, "default demo must not wrap the component")
assert.match(gate, /<PrismCometPreloader key=\{run\}/, "gate demo can replay itself")
assert.match(gate, /<\/PrismCometPreloader>/, "gate demo guards real children")
for (const key of ["background", "blue", "violet", "magenta", "cyan", "gold"]) {
  assert.match(ember, new RegExp(`${key}: "#[0-9a-f]{6}"`), `ember demo overrides ${key} with a hex the shader can read`)
}

console.log("prism-comet-preloader: ok")
