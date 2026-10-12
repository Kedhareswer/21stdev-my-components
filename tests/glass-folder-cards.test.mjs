// Install-safety checks for components/glass-folder-cards, plus a real run of
// the generative artwork and the fan maths in its #region.
// Run: node tests/glass-folder-cards.test.mjs

import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const dir = new URL("../components/glass-folder-cards/", import.meta.url)
const src = readFileSync(new URL("glass-folder-cards.tsx", dir), "utf8")
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")
const demoCustom = readFileSync(new URL("demo-custom.tsx", dir), "utf8")

// ---- install safety --------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import the component may have")

assert.doesNotMatch(src, /@import/, "no @import — the host project owns fonts and Tailwind")
assert.doesNotMatch(src, /className=["'][^"']*\bh-full\b/, "no h-full on any element")
assert.match(src, /prefers-reduced-motion/, "honours reduced motion")

const css = src.match(/const GF_CSS = `([\s\S]*?)`\n/)
assert.ok(css, "GF_CSS block is present")
assert.doesNotMatch(css[1], /\$\{|`/, "no backticks or interpolation inside the CSS string")
assert.doesNotMatch(css[1], /^\s*(\*|body|html|:root)\s*[{,]/m, "no bare global resets")

// Every selector must be scoped, or installing this restyles someone's app.
let ruleCount = 0
for (const m of css[1].replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(?<=^|[{}])\s*([^{}]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || /^(from|to|[\d.]+%)/.test(sel)) continue
  ruleCount++
  for (const part of sel.split(",")) {
    const s = part.trim()
    assert.ok(
      /^(\.gf-|canvas\.gf-)/.test(s),
      `unscoped CSS selector would leak into the host app: ${s}`,
    )
  }
}
assert.ok(ruleCount >= 60, `expected the scope check to see real rules, saw ${ruleCount}`)

// The root is sized by its width prop, never by a percentage chain an
// installed page does not have.
const rootRule = css[1].match(/\.gf-root \{([^}]*)\}/)
assert.ok(rootRule, ".gf-root rule missing")
assert.doesNotMatch(rootRule[1], /height:\s*\d+%/, ".gf-root must not take a percentage height")
assert.match(src, /style=\{\{ width, height: \(H \+ HEADROOM\) \* k/, "root height is derived from width in px")

// Preflight sets img/svg/canvas { max-width: 100% }. Every sized media element opts out.
for (const sel of [".gf-art", ".gf-sheet-art", ".gf-rim", ".gf-glyph"]) {
  const block = css[1].match(new RegExp("\\" + sel + "\\s*\\{([^}]*)\\}"))
  assert.ok(block, `${sel} rule missing`)
  assert.match(block[1], /max-width:\s*none/, `${sel} must guard against Preflight`)
}
assert.match(src, /style=\{\{ width: w, height: h, maxWidth: "none" \}\}/, "art canvases carry explicit size")

// The glass must blur what is behind it. clip-path makes an element a
// backdrop root, so the frost and the folder shape have to live on the same
// element — a backdrop-filter on a child of the clipped panel sees nothing.
const front = css[1].match(/\.gf-front \{([^}]*)\}/)
assert.ok(front, ".gf-front rule missing")
assert.match(front[1], /backdrop-filter:\s*blur/, "the front panel frosts")
assert.match(src, /className=\{"gf-front"[\s\S]{0,120}clipPath: "path\('" \+ FRONT_PATH/, "and is clipped on the same element")
for (const sel of [".gf-root", ".gf-stage", ".gf-tilt"]) {
  const block = css[1].match(new RegExp("\\" + sel + " \\{([^}]*)\\}"))
  assert.ok(block, `${sel} rule missing`)
  assert.doesNotMatch(block[1], /(^|\s)(filter|opacity|mask|clip-path):/, `${sel} would cut the glass off from the art`)
}

// ---- behaviour, read off the source ----------------------------------------
assert.match(src, /aria-expanded=\{open\}/, "the folder reports whether it is open")
assert.match(src, /aria-haspopup=\{action === "more" \? "menu"/, "the ··· key announces its menu")
assert.match(src, /role="menu"/, "the menu is a menu")
assert.match(src, /e\.key !== "Escape"/, "Escape closes")
assert.match(src, /e\.key === "ArrowDown"/, "the menu is keyboard driven")
assert.match(src, /toggleAttribute\("inert", !open\)/, "closed files are out of the tab order")
assert.doesNotMatch(src, /\binert=\{/, "inert must be set as an attribute — React 18 has no inert prop")
assert.match(src, /IntersectionObserver/, "the entrance waits until the folder is on screen")

// ---- self-contained, nothing borrowed --------------------------------------
const shipped = src + demo + demoCustom
assert.doesNotMatch(shipped, /https?:\/\/(?!www\.w3\.org)/i, "no remote assets — nothing to 404 after install")
assert.match(demo, /from "@\/components\/ui\/glass-folder-cards"/, "demo imports the installed path")
assert.match(demoCustom, /from "@\/components\/ui\/glass-folder-cards"/, "custom demo imports the installed path")

// ---- the region, run for real ----------------------------------------------
const start = src.indexOf("// #region art")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "art region markers missing")
const js = stripTypeScriptTypes(src.slice(start, end))
const { ART_PRESETS, createArtJob, fanSlot, hexToRgb, hashString, rng } = await import(
  "data:text/javascript," + encodeURIComponent(js)
)

assert.deepEqual(hexToRgb("#ff8a5c"), [255, 138, 92])
assert.deepEqual(hexToRgb("#abc"), [170, 187, 204], "short hex expands")
assert.deepEqual(hexToRgb("tomato"), [128, 128, 128], "unreadable colours fall back to grey")

assert.equal(hashString("Brief.pdf"), hashString("Brief.pdf"), "hash is stable")
assert.notEqual(hashString("Brief.pdf"), hashString("Brief.pdf "))
{
  const a = rng(42)
  const b = rng(42)
  for (let i = 0; i < 5; i++) assert.equal(a(), b(), "rng is deterministic per seed")
  const r = rng(7)
  for (let i = 0; i < 1000; i++) {
    const v = r()
    assert.ok(v >= 0 && v < 1, "rng stays in [0, 1)")
  }
}

// fan slots spread the visible stack symmetrically
assert.equal(fanSlot(0, 1), 0, "one file sits in the middle")
assert.deepEqual([0, 1, 2].map((i) => fanSlot(i, 3)), [-1, 0, 1])
assert.deepEqual([0, 1, 2, 3].map((i) => +fanSlot(i, 4).toFixed(4)), [-1, -0.3333, 0.3333, 1])

const paint = (w, h, recipe, seed) => {
  const job = createArtJob(w, h, recipe, seed)
  let steps = 0
  while (!job.step(3)) steps++
  assert.ok(steps > 2, "the job really is spread over several steps")
  assert.equal(job.step(3), true, "a finished job stays finished")
  return job
}

for (const [name, recipe] of Object.entries(ART_PRESETS)) {
  assert.ok(recipe.colors.length >= 2, `${name} has a palette`)
  // odd sizes exercise the half-resolution grid's edges
  const job = paint(97, 61, recipe, 5)
  assert.equal(job.pixels.length, 97 * 61 * 4)
  let min = 255
  let max = 0
  const seen = new Set()
  for (let i = 0; i < job.pixels.length; i += 4) {
    assert.equal(job.pixels[i + 3], 255, `${name} is opaque`)
    const l = (job.pixels[i] + job.pixels[i + 1] + job.pixels[i + 2]) / 3
    assert.ok(Number.isFinite(l), `${name} has no NaN pixels`)
    min = Math.min(min, l)
    max = Math.max(max, l)
    seen.add((job.pixels[i] >> 4) * 256 + (job.pixels[i + 1] >> 4) * 16 + (job.pixels[i + 2] >> 4))
  }
  // a flat or blown-out picture would mean the normalisation broke
  assert.ok(max - min > 60, `${name} spans real contrast (${min.toFixed(0)}–${max.toFixed(0)})`)
  assert.ok(seen.size > 20, `${name} is a picture, not a few flat colours (${seen.size})`)
}

{
  const a = paint(40, 30, ART_PRESETS.ember, 3).pixels
  const b = paint(40, 30, ART_PRESETS.ember, 3).pixels
  const c = paint(40, 30, ART_PRESETS.ember, 4).pixels
  assert.deepEqual(a, b, "same recipe and seed paint the same picture — the cache relies on it")
  assert.notDeepEqual(a, c, "a different seed is a different arrangement")
}

// a custom recipe with the bare minimum still paints
paint(16, 16, { style: "streak", colors: ["#000", "#fff"] }, 1)
paint(16, 16, { style: "marble", colors: ["#123456"] }, 1)

console.log("glass-folder-cards: ok")
