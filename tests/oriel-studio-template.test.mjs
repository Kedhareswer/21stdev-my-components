// Install-safety and behaviour checks for components/oriel-studio-template.
// Run: node tests/oriel-studio-template.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const slug = "oriel-studio-template"
const root = new URL("../", import.meta.url)
const dir = new URL("components/" + slug + "/", root)
const src = readFileSync(new URL(slug + ".tsx", dir), "utf8")
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")
const pkg = JSON.parse(readFileSync(new URL("package.json", root), "utf8"))
const tsconfig = readFileSync(new URL("tsconfig.json", root), "utf8")

// ---- install safety ------------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react", "gsap", "gsap/ScrollTrigger", "three", "three/examples/jsm/environments/RoomEnvironment.js"])
assert.ok(pkg.dependencies?.gsap && pkg.dependencies?.three, "gsap and three are declared in the root package.json")
assert.match(src, /gsap\.registerPlugin\(ScrollTrigger\)/, "ScrollTrigger is registered")
for (const f of readdirSync(dir))
  assert.ok(new RegExp("^(" + slug + "\\.tsx|demo(-[a-z0-9-]+)?\\.tsx|README\\.md)$").test(f), "unexpected file in the folder: " + f)
assert.ok(tsconfig.includes('"@/components/ui/' + slug + '": ["./components/' + slug + "/" + slug + '.tsx"]'), "tsconfig paths line")
assert.ok(demo.includes('from "@/components/ui/' + slug + '"'), "demo imports the installer path")

assert.ok(src.includes('height = "100svh"'), "frame height defaults to a definite length")
assert.ok(src.includes('"--h": height'), "the height prop feeds --h")
assert.doesNotMatch(src, /className=["'][^"']*\bh-full\b/, "no h-full")
assert.doesNotMatch(src, /pin:\s*true/, "no ScrollTrigger pinning: stages are position:sticky")
assert.ok(src.includes("ctx.revert()"), "every tween and trigger is reverted on unmount / mode change")
assert.doesNotMatch(src, /@import/, "no @import")
assert.ok(src.includes("{fontHref && <link rel=\"stylesheet\" href={fontHref} />}"), "fontHref null loads nothing")
for (const m of src.matchAll(/https?:\/\/([a-z0-9.-]+)\//g))
  assert.ok(["fonts.googleapis.com", "images.pexels.com", "videos.pexels.com"].includes(m[1]), "unexpected host " + m[1])

const allowed = ["--color-background", "--color-foreground", "--color-muted-foreground", "--color-border", "--color-primary"]
for (const m of src.matchAll(/var\((--color-[a-z-]+)/g)) assert.ok(allowed.includes(m[1]), "unknown host token " + m[1])

// ---- the scoped CSS string --------------------------------------------------------
const css = src.match(/const CSS = rr\(`([\s\S]*?)`\)/)[1].replace(/\/\*[\s\S]*?\*\//g, "")
assert.doesNotMatch(css, /\$\{/, "no ${ in the CSS string")
for (const bad of [/(^|[},])\s*\*\s*\{/, /(^|[},])\s*body\s*\{/, /:root/, /(^|[},])\s*html\s*\{/])
  assert.doesNotMatch(css, bad, "no bare resets in the CSS: " + bad)
for (const rule of css.matchAll(/(?:^|[{}])\s*(?!@)([^{}\s][^{}]*)\{/g)) {
  const sel = rule[1].trim()
  if (!sel || /^(from|to|[\d.]+%)/.test(sel)) continue
  for (const one of sel.split(/,(?![^(]*\))/)) assert.ok(one.trim().startsWith(".or-"), "unscoped selector: " + one.trim())
}
assert.match(css, /\.or-root img,\.or-root video,\.or-root canvas\{max-width:none/, "Preflight cannot collapse media")
assert.ok(css.includes("container-type:size") && css.includes("--r:min(calc(100cqw / 90),calc(100cqh / 56.25))"), "the deck zooms (fluid R unit), it doesn't reflow")
assert.ok(css.includes(".or-stage{position:sticky"), "pinned stages are sticky")
assert.ok(/\.or-stack \.or-about-row\{[^}]*flex-direction:column/.test(css), "horizontal cards stack on mobile")
assert.ok(css.includes(".or-stack .or-sheet{position:fixed") && css.includes(".or-stack .or-sheet.is-open{transform:none}"), "the form is a bottom sheet on mobile")
// stacked mode must not be a container: containment would trap the fixed header and sheet
assert.ok(css.includes(".or-root.or-stack{height:auto;overflow:visible;overflow-x:clip;container-type:normal"), "stacked root is not a containing block")

// ---- the deck logic, lifted and run ------------------------------------------------
const start = src.indexOf("// #region deck-logic")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "deck-logic region markers missing")
const js = stripTypeScriptTypes(src.slice(start, end))
const L = await import("data:text/javascript," + encodeURIComponent(js))

// soft scroll: converges, frame-rate independent, settles exactly
let a = 0, b = 0
for (let k = 0; k < 60; k++) a = L.glide(a, 1000, 0.06, 1000 / 60)
for (let k = 0; k < 120; k++) b = L.glide(b, 1000, 0.06, 1000 / 120)
assert.ok(Math.abs(a - b) < 2, "same glide at 60 and 120 Hz")
let c = 0
for (let k = 0; k < 400; k++) c = L.glide(c, 500, 0.06, 16.7)
assert.equal(c, 500, "glide lands on its target")

// wheel: scrolls inside first, then holds a buffer at the edge before turning
const max = 2000
let s = { target: 0, push: 0 }
let r = L.wheelStep(s, 100, 0, max, L.EDGE_BUFFER, 1)
assert.deepEqual([r.target, r.turn], [100, 0], "inside the scene a tick scrolls")
r = L.wheelStep({ target: max, push: 0 }, 100, max - 300, max, L.EDGE_BUFFER, 1)
assert.equal(r.turn, 0, "no turn while the glide is still travelling")
assert.equal(r.push, 0)
let st = { target: max, push: 0 }
r = L.wheelStep(st, 100, max, max, L.EDGE_BUFFER, 1)
assert.equal(r.turn, 0, "one extra tick at the edge never turns the scene")
st = r
r = L.wheelStep(st, 100, max, max, L.EDGE_BUFFER, 1)
assert.equal(r.turn, 0, "nor does a second")
r = L.wheelStep(r, 100, max, max, L.EDGE_BUFFER, 1)
assert.equal(r.turn, 1, "a deliberate push does")
assert.equal(r.push, 0, "and the buffer resets")
r = L.wheelStep({ target: max, push: 200 }, -100, max, max, L.EDGE_BUFFER, 1)
assert.deepEqual([r.turn, r.push], [0, 0], "reversing scrolls back and drops the held push")
r = L.wheelStep({ target: 0, push: -200 }, -100, 0, max, L.EDGE_BUFFER, 1)
assert.equal(r.turn, -1, "the same buffer guards the top edge")
r = L.wheelStep({ target: 0, push: 0 }, 100, 0, 5000, L.EDGE_BUFFER, 3, 200)
assert.equal(r.target, 200, "a tick glides far, but the lead over the current position is capped")
r = L.wheelStep({ target: 4000, push: 0 }, -100, 4000, 5000, L.EDGE_BUFFER, 3, 200)
assert.equal(r.target, 3800, "the cap holds going up too")
assert.equal(L.normalizeWheel(3, 1, 900), 96, "line-mode wheels are scaled to px")
assert.equal(L.normalizeWheel(1, 2, 900), 900, "page-mode wheels are a page")

assert.equal(L.stepIndex(0, -1, 9), -1, "no scene before the first")
assert.equal(L.stepIndex(8, 1, 9), -1, "no scene after the last")
assert.equal(L.stepIndex(3, 1, 9), 4)

// keyboard
assert.deepEqual(L.keyIntent("PageDown", false, 9), { kind: "step", to: 1 })
assert.deepEqual(L.keyIntent(" ", true, 9), { kind: "step", to: -1 })
assert.deepEqual(L.keyIntent("End", false, 9), { kind: "jump", to: 8 })
assert.deepEqual(L.keyIntent("3", false, 9), { kind: "jump", to: 2 })
assert.equal(L.keyIntent("a", false, 9), null)

// scrub → timed pops
assert.equal(L.crossed(0.2, 0.31, 0.3), 1)
assert.equal(L.crossed(0.31, 0.29, 0.3), -1)
assert.equal(L.crossed(0.31, 0.5, 0.3), 0)
const stops = [0.3, 0.47, 0.64, 0.82]
assert.deepEqual([0.1, 0.3, 0.5, 0.7, 0.9].map((p) => L.slotIndex(p, stops)), [-1, 0, 1, 2, 3], "slot machine rolls in order")
assert.equal(L.litCount(0, 80), 0)
assert.equal(L.litCount(0.95, 80), 80, "the whole quote is lit before the scrub ends")
assert.equal(L.litCount(0.5, 80), 43)

// carousel ring
assert.deepEqual([0, 1, 6].map((i) => L.ringOffset(i, 0, 7)), [0, 1, -1], "neighbours sit either side of a looping ring")
assert.equal(L.wrap(-1, 7), 6)

// which cut plays where
assert.ok(L.interstitial("about", "make") && !L.interstitial("make", "about") && !L.interstitial("home", "about"), "the marquee flash plays on one cut only")
assert.equal(L.discColor("dark"), "light")
assert.equal(L.discColor("light"), "dark")

// ---- the film, by source ----------------------------------------------------------
assert.ok(src.includes('{ passive: false }') && src.includes("normalizeWheel(e.deltaY"), "the wheel is taken over, normalised")
assert.ok(src.includes("if (r.turn && !turn(r.turn)) return"), "first top / last bottom hand the wheel back to the page")
assert.ok(src.includes("S.stale") && src.includes("GESTURE_GAP"), "inertia from a turn never turns the next scene")
assert.ok(src.includes('on(root, "focusin"'), "tabbing into another scene brings it in")
assert.ok(/Math\.abs\(sc\.scrollTop - S\.written\) > 2\) S\.cur = S\.target/.test(src), "native scrolling (focus, find, screen readers) is adopted")
assert.doesNotMatch(src, /visibility: k === to/, "off-frame scenes stay in the accessibility tree")
assert.ok(src.includes("prefers-reduced-motion: reduce") && src.includes('setMode(fine.matches && !rm.matches'), "reduced motion and touch get the stacked page")
assert.ok(src.includes("if (reduced) {\n          tl.progress(rest)"), "reduced motion rests every scrub on a key frame")
assert.equal((src.match(/gsap\.timeline\(\{ paused: true/g) || []).length, 6, "scrubbed timelines never free-run")
assert.ok(src.includes("scroller: scrollerOf(scenes[i])"), "scrubs follow the scene's own scroller")
assert.ok(src.includes("containerAnimation: slide"), "pill windows slide inside the sideways cards")
assert.ok(src.includes('(hover: hover) and (pointer: fine)'), "deck only with a fine pointer")
assert.ok(src.includes("mix-blend-mode:difference"), "difference-blend cursor dot")
assert.ok(src.includes("eye.classList.add(\"is-asleep\"), 2000"), "the eye falls asleep after 2 s idle")

// the rope is a scrubbed image sequence: given frames, or frames baked once from the 3D rope as WebP blobs
assert.ok(src.includes("ropeFrames?: string[]") && src.includes("const ROPE_FRAMES = 48"), "rope frames are a prop, 48 by default")
assert.ok(src.includes('"image/webp", 0.88') && src.includes("decoded.size > 8"), "baked frames are compressed and decoded on demand with a small cache")
assert.ok(src.includes("Math.round(rv * (frames.length - 1))"), "scroll picks the frame")
assert.ok(src.includes('preload="none"') && !/sautoPlay[s=>{]/.test(src), "videos load and play only when their scene is on screen")

console.log("oriel-studio-template: ok")
