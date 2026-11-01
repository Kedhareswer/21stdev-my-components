// Install-safety and behaviour checks for components/torchlit-agency-template.
// Run: node tests/torchlit-agency-template.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const slug = "torchlit-agency-template"
const root = new URL("../", import.meta.url)
const dir = new URL("components/" + slug + "/", root)
const src = readFileSync(new URL(slug + ".tsx", dir), "utf8")
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")
const pkg = JSON.parse(readFileSync(new URL("package.json", root), "utf8"))
const tsconfig = readFileSync(new URL("tsconfig.json", root), "utf8")

// ---- install safety ------------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react", "gsap", "gsap/ScrollTrigger"], "only react and gsap")
assert.ok(pkg.dependencies?.gsap, "gsap must be declared in the root package.json")
assert.match(src, /gsap\.registerPlugin\(ScrollTrigger\)/, "ScrollTrigger is registered")
for (const f of readdirSync(dir))
  assert.ok(new RegExp("^(" + slug + "\\.tsx|demo(-[a-z0-9-]+)?\\.tsx|README\\.md)$").test(f), "unexpected file in the folder: " + f)
assert.ok(tsconfig.includes('"@/components/ui/' + slug + '": ["./components/' + slug + "/" + slug + '.tsx"]'), "tsconfig paths line")
assert.ok(demo.includes('from "@/components/ui/' + slug + '"'), "demo imports the installer path")

assert.ok(src.includes('height = "100svh"'), "hero height defaults to a definite length")
assert.ok(src.includes('"--h": height'), "the height prop feeds --h")
assert.doesNotMatch(src, /className=["'][^"']*\bh-full\b/, "no h-full")
assert.doesNotMatch(src, /pin:\s*true/, "no ScrollTrigger pinning (it rewrites React's DOM)")
assert.ok(src.includes("ctx.revert()"), "page choreography is reverted when the page changes")
assert.doesNotMatch(src, /@import/, "no @import")
assert.ok(src.includes('{fontHref && <link rel="stylesheet" href={fontHref} />}'), "fontHref null loads nothing")
for (const m of src.matchAll(/https?:\/\/([a-z0-9.-]+)\//g))
  assert.ok(["fonts.googleapis.com", "images.unsplash.com"].includes(m[1]), "unexpected host " + m[1])

// Only the five semantic tokens may be assumed from the host page.
const allowed = ["--color-background", "--color-foreground", "--color-muted-foreground", "--color-border", "--color-primary"]
for (const m of src.matchAll(/var\((--color-[a-z-]+)/g)) assert.ok(allowed.includes(m[1]), "unknown host token " + m[1])

// ---- the scoped CSS string --------------------------------------------------------
const css = src.match(/const CSS = `([\s\S]*?)`/)[1].replace(/\/\*[\s\S]*?\*\//g, "")
assert.doesNotMatch(css, /\$\{/, "no ${ in the CSS string")
for (const bad of [/(^|[},])\s*\*\s*\{/, /(^|[},])\s*body\s*\{/, /:root/, /(^|[},])\s*html\s*\{/])
  assert.doesNotMatch(css, bad, "no bare resets in the CSS: " + bad)
for (const rule of css.matchAll(/(?:^|[{}])\s*(?!@)([^{}\s][^{}]*)\{/g)) {
  const sel = rule[1].trim()
  if (!sel || /^(from|to|[\d.]+%)/.test(sel)) continue
  for (const one of sel.split(/,(?![^(]*\))/)) assert.ok(one.trim().startsWith(".tl-"), "unscoped selector: " + one.trim())
}
assert.ok(css.includes("container:tl/inline-size") && css.includes("@container tl (max-width: 720px)"), "layout answers the component's width")
assert.match(css, /\.tl-i img\{[^}]*max-width:none/, "Preflight cannot collapse the absolutely-positioned photos")

// ---- accessibility: the dark is atmosphere, never a lock --------------------------
const lum = (hex) => {
  const c = hex.match(/[0-9a-f]{2}/gi).map((h) => parseInt(h, 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}
const ratio = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05)
const bg = css.match(/--tl-bg:(#[0-9a-f]{6})/i)[1]
const dim = css.match(/--tl-dim:(#[0-9a-f]{6})/i)[1]
const dimLg = css.match(/--tl-dim-lg:(#[0-9a-f]{6})/i)[1]
assert.ok(ratio(dim, bg) >= 4.5, "unlit body text passes AA: " + ratio(dim, bg).toFixed(2))
assert.ok(ratio(dimLg, bg) >= 3, "unlit display text passes AA large: " + ratio(dimLg, bg).toFixed(2))
assert.match(css, /\.tl-t\{[^}]*color:var\(--tl-dim\)/, "text without JS keeps its dim colour (no transparent fill)")
assert.match(css, /\.tl-on \.tl-t\{[^}]*background-clip:text/, "the light only takes over once JS has added .tl-on")
assert.match(css, /@media \(forced-colors:active\)/, "forced colours drop the gradient fill")

// Touch: no torch, the light follows the finger and otherwise rests wide on the screen.
assert.ok(src.includes('window.addEventListener("touchmove", onTouch, { passive: true })'), "touch listeners are passive")
assert.match(src, /if \(S\.touching\) \{[^}]*show = true \}\s*else \{[^}]*Math\.max\(vw, vh\)[^}]*show = false \}/, "parked light is wide and torchless")
assert.ok(src.includes('onFocus') && src.includes(':focus-visible'), "keyboard focus carries the light")
// Reading rects between style writes forced a layout per element: reads come first.
const tick = src.slice(src.indexOf("const tick ="), src.indexOf("raf = requestAnimationFrame(tick)\n    return"))
assert.ok(tick.lastIndexOf("getBoundingClientRect") < tick.indexOf("style.setProperty"), "every rect is read before any style is written")

// Light mode: lights on, no torch, and a way into the dark from the page itself.
assert.ok(src.includes(`theme = "auto"`), "theme follows the host by default")
assert.ok(src.includes(`closest(".dark")`), "auto reads the host .dark class")
assert.ok(css.includes(".tl-frame.tl-day .tl-t,.tl-frame.tl-day .tl-t em{background:none;color:var(--tl-dim);-webkit-text-fill-color:currentColor}"), "light mode drops the torch gradient, italics included")
assert.ok(css.includes(".tl-frame.tl-day .tl-torch,.tl-frame.tl-day .tl-glow"), "no torch with the lights on")
assert.ok(src.includes("Turn the lights off"), "light mode asks to go dark")
assert.ok(src.includes("if (isDay) return"), "the loop idles with the lights on")

// Things that catch fire: the laurel torch starts unlit, the CTA burns like oil, both become light sources.
assert.ok(src.includes('className="tl-emb-wrap" data-ignite="160" data-beacon="380"'), "laurel torch ignites and casts light")
assert.ok(css.includes(".tl-emb-wrap:not(.tl-lit-up) .tl-emb-torch .tl-fl{visibility:hidden}"), "laurel torch starts unlit")
assert.ok(src.includes('className="tl-ignite" href={"mailto:" + email} data-ignite="220"'), "CTA ignites")
assert.ok(css.includes("mask-image:radial-gradient(circle var(--ig,0px) at var(--ix,50%) var(--iy,50%)"), "fire spreads from the touch point")
assert.ok(css.includes("radial-gradient(circle var(--br) at var(--bx) var(--by)"), "lit things light their neighbours")
assert.ok(css.includes(".tl-fm{animation:tl-fm"), "list flames flicker")

// Play: wall sconces to light (counted per page, hidden ones excluded), a warm reward, embers, hold-to-flare, a moth.
assert.ok(src.includes(`data-ignite="140" data-beacon="230" data-sconce=""`), "sconces ignite and cast light")
assert.ok(src.includes("getClientRects().length > 0"), "only sconces you can see count towards the total")
assert.ok(src.includes("torches.lit === torches.total"), "lighting them all warms the room")
assert.ok(src.includes("if (S.hold && show) rT *= 1.45"), "press and hold flares the flame")
assert.match(src, /const emit = \(n: number, power = 1\) => \{\s+if \(calmMq\.matches\) return/, "no embers under reduced motion")
assert.ok(src.includes("if (!calmMq.matches) {") && src.includes("S.still > 1800"), "the moth only comes to a still flame, never under reduced motion")
assert.ok(src.includes("pool.replaceChildren()"), "ember pool is cleaned up on unmount")

// Reduced motion: choreography only with motion allowed; flames freeze on one frame.
assert.ok(src.includes('mm.add("(prefers-reduced-motion: no-preference)"'), "choreography only runs with motion allowed")
assert.ok(src.includes("if (calm()) {"), "page changes skip the curtain under reduced motion")
const reduced = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"))
for (const s of [".tl-fl,.tl-fm,.tl-mw{animation:none}", ".tl-fl:first-child{opacity:1}", ".tl-fm:first-child{opacity:1}"]) assert.ok(reduced.includes(s), "reduced motion: " + s)

// ---- the pixel torch (lifted out and executed) -------------------------------------
const region = src.slice(src.indexOf("// #region pixel-torch"), src.indexOf("// #endregion"))
const mod = new Function(stripTypeScriptTypes(region) + "\nreturn { FLAMES, TORCH_TILT, TORCH_UP, FLAME_MINI, FLAME_MINI_2, FLAME_MINI_3, MOTH_UP, MOTH_DOWN, PAL, MINI_RUNS, TILT_RUNS }")()
for (const rows of [mod.TORCH_TILT, mod.TORCH_UP]) {
  assert.equal(rows.length, 15, "torch body fills rows 11-25")
  for (const r of rows) {
    assert.equal(r.length, 16, "torch row is 16 px wide: " + r)
    for (const c of r) assert.ok(c === "." || mod.PAL[c], "unknown palette key " + c)
  }
}
for (const g of [mod.FLAME_MINI, mod.FLAME_MINI_2, mod.FLAME_MINI_3]) {
  assert.equal(g.length, 9, "mini flame is 9 rows")
  for (const r of g) assert.equal(r.length, 7, "mini flame row is 7 px wide")
}
for (const g of [mod.MOTH_UP, mod.MOTH_DOWN]) {
  assert.equal(g.length, 6, "moth is 6 rows")
  for (const r of g) { assert.equal(r.length, 9, "moth row is 9 px wide"); for (const c of r) assert.ok(c === "." || mod.PAL[c], "unknown palette key " + c) }
}
assert.equal(mod.FLAMES.length, 4, "four flame frames")
const keyOf = (f) => JSON.stringify(f)
assert.equal(new Set(mod.FLAMES.map(keyOf)).size, 4, "every frame differs")
for (const f of mod.FLAMES) {
  const px = f.reduce((n, [, , w]) => n + w, 0)
  assert.ok(px > 40 && px < 120, "flame frame has a believable size: " + px)
  for (const [x, y, w, fill] of f) {
    assert.ok(x >= 0 && x + w <= 16 && y >= 0 && y < 12, "flame stays in its 16 x 12 box")
    assert.ok(Object.values(mod.PAL).includes(fill), "flame uses the palette")
  }
  assert.ok(f.some(([, , , fill]) => fill === mod.PAL.w), "every frame has a white-hot core")
}
// Same seed, same pixels: the server and the client draw the same torch.
const again = new Function(stripTypeScriptTypes(region) + "\nreturn FLAMES")()
assert.equal(keyOf(again), keyOf(mod.FLAMES), "flames are deterministic")

// Light physics: shadows fall away from the flame, the reach flickers, the flame leans, the handle shades below it.
assert.ok(src.includes("const ddx = b.left + b.width / 2 - LX"), "shadow direction runs from the flame through the element")
assert.ok(src.includes("const I = r > 40 ? Math.max(0, 1 - near / (r * 1.25)) : 0"), "shadows fade with the light")
assert.ok(src.includes("const fl = calmMq.matches ? 1 :"), "flicker stops under reduced motion")
assert.ok(css.includes("conic-gradient(from calc(var(--ha,171deg) - 16deg) at var(--tx) var(--ty)"), "the handle casts a wedge of shadow")
assert.ok(!/filter: "blur/.test(src), "no tween fights the per-frame shadow filter")
// Page change burns the old page away from the middle.
assert.ok(src.includes("burning.current = burnAway(frameRef.current!, burnRef.current!, dayRef.current)"), "page changes burn through")
assert.ok(src.includes("burning.current?.finish()"), "a click mid-burn finishes the old burn instead of being ignored")
assert.ok(src.includes("probe.decode().then("), "mask swaps wait for decode, so the snapshot never blinks out")
assert.ok(src.includes("layer.replaceChildren()"), "the snapshot is removed when the burn ends")
const burn = src.slice(src.indexOf("// #region burn"), src.indexOf("// #endregion", src.indexOf("// #region burn")))
const { burnField } = new Function(stripTypeScriptTypes(burn) + "\nreturn { burnField }")()
const { field } = burnField(80, 50, 40, 25, 7)
const at = (x, y) => field[y * 80 + x]
assert.equal(field.length, 4000, "one value per cell")
let first = 0
for (let i = 1; i < field.length; i++) if (field[i] < field[first]) first = i
assert.ok(Math.hypot((first % 80) - 40, Math.floor(first / 80) - 25) < 6, "the fire starts at the spark, not somewhere random")
assert.ok(at(40, 25) < at(2, 2) && at(40, 25) < at(78, 48), "it reaches the corners last")
assert.deepEqual([...burnField(20, 10, 10, 5, 3).field], [...burnField(20, 10, 10, 5, 3).field], "same seed, same fire")

// Motion rules: shared easing tokens, no hand-typed curves, no ease-in in CSS, the torch sits on the pointer.
assert.ok(css.includes("--tl-ease-out:cubic-bezier(0.23,1,0.32,1)") && !/cubic-bezier\(\./.test(css), "curves come from tokens")
assert.ok(!/\bease-in\b(?!-out)/.test(css), "no ease-in in the CSS")
assert.ok(src.includes("rT = S.inside ? base : 0; follow = 1;"), "the torch does not lag the pointer")
assert.ok(css.includes("@media (hover:hover) and (pointer:fine){.tl-card-b:hover"), "card hover is gated to real hover")

console.log("torchlit-agency-template: ok")
