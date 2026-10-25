// Install-safety and logic checks for components/fresco-interview-template.
// Run: node tests/fresco-interview-template.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const SLUG = "fresco-interview-template"
const read = (file) => readFileSync(new URL(`../components/${SLUG}/${file}`, import.meta.url), "utf8").replace(/\r\n/g, "\n")
const src = read(`${SLUG}.tsx`)
const region = (name) => {
  const a = src.indexOf(`// #region ${name}\n`)
  const b = src.indexOf(`// #endregion ${name}\n`)
  assert.ok(a > -1 && b > a, `region ${name} missing`)
  return src.slice(a, b)
}

/* ---------- nothing travels with it ---------- */

const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react", "gsap", "gsap/ScrollTrigger"], "react and gsap are the only imports")
const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"))
assert.ok(pkg.dependencies.gsap, "gsap is declared at the root, so the 21st build gate accepts it")
assert.doesNotMatch(src, /@import|@font-face|<link\b|fetch\(/, "no fonts, no fetches")
for (const m of src.matchAll(/https?:\/\/([^/"'`\s)]+)/g)) assert.equal(m[1], "images.unsplash.com", "unexpected host " + m[1])
assert.match(src, /const UNSPLASH = "https:\/\/images\.unsplash\.com\/photo-"/, "the only remote pictures are Unsplash photos")
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.match(src, /"--fit-h": height/, "the height prop reaches the root")
assert.match(src, /\.fit-root\{[^}]*min-height:var\(--fit-h\)/, "the root has a definite floor")
assert.match(src, /\.fit-sky\{position:sticky;top:0;height:var\(--fit-h\);margin-bottom:calc\(var\(--fit-h\) \* -1\)/, "the sky is a sticky stage of definite height that takes no room")
assert.match(src, /\.fit-hero\{[^}]*min-height:max\(var\(--fit-h\),640px\)/, "the hero has a definite height")
assert.match(src, /\.fit-quote\{[^}]*height:calc\(var\(--fit-h\) \* 1\.9\)\}/, "the quote run is a definite length")
assert.match(src, /\.fit-quote-stick\{position:sticky;top:0;height:var\(--fit-h\)/, "and its stage sticks at a definite height")
assert.match(src, /\.fit-next\{[^}]*min-height:max\(var\(--fit-h\),640px\)/, "the next story has a definite height")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
for (const m of src.matchAll(/([.\w>*\s,:()-]+)\{[^}]*\bheight:100%/g)) assert.match(m[0], /position:absolute|inset:0/, `a percentage height only on absolutely placed layers: ${m[1].trim()}`)
assert.match(src, /\.fit-cloud\{width:100%;height:auto/, "painted banks keep their own aspect")
assert.match(src, /\.fit-fig-canvas,\.fit-fig-img\{width:100%;height:auto/, "figures keep their own aspect")
assert.match(src, /style=\{\{ maxWidth: "none" \}\}/, "the plain-photo fallback is guarded against Preflight inline too")
assert.match(src, /React\.useId\(\)\.replace/, "ids are namespaced per instance")
const head = src.slice(0, src.indexOf("</"))
assert.doesNotMatch(head, /use(State|Ref|Memo|Callback)<|Partial<|Required<|Record<|Array<|Map<|Promise<|NonNullable<|React\.[A-Za-z]+<|\[K in /, "no generics before the first JSX close tag (21st CLI tokenizer)")
assert.doesNotMatch(src, /use(State|Ref|Memo|Callback)</, "hooks are typed without <generics>")
assert.match(src, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/, "reduced motion is read in JS")
assert.doesNotMatch(src, /[—–]/, "no em or en dashes anywhere")
assert.doesNotMatch(src, />[^<{]*\\u[0-9a-f]{4}/i, "no \\u escapes inside JSX text")

const css = src.match(/const FIT_CSS = `([\s\S]*?)`/)
assert.ok(css, "CSS block present")
assert.doesNotMatch(css[1], /\$\{|`/, "no interpolation inside the CSS string")
assert.doesNotMatch(css[1], /url\(/, "no url() in the style block")
assert.ok(css[1].includes("prefers-reduced-motion:reduce"), "honours reduced motion in CSS")
for (const m of css[1].replace(/\/\*[\s\S]*?\*\//g, "").replace(/@media[^{]*\{/g, "").replace(/@keyframes[^{]*\{/g, "").matchAll(/(?<=^|[{}])\s*([^{}@]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (/^(from|to|[\d.,%\s]+)$/.test(sel)) continue
  for (const s of sel.split(/,(?![^(]*\))/)) assert.match(s.trim(), /^\.fit-/, `selector escapes the component: ${s.trim()}`)
}
assert.match(css[1], /\.fit-root :where\(svg,canvas,img\)\{display:block;max-width:none\}/, "media are guarded against Preflight")
assert.match(css[1], /\.fit-root\{[^}]*overflow-x:clip/, "the root clips sideways without breaking the sticky stages")
assert.doesNotMatch(css[1], /\.fit-root\{[^}]*overflow:hidden/, "overflow:hidden on the root would break position:sticky")
assert.match(css[1], /\.fit-root\[data-motion="reduced"\] \.fit-quote\{height:auto\}/, "reduced motion unpins the quote")
assert.match(css[1], /\.fit-root\[data-motion="reduced"\] \.fit-quote-stick\{position:relative\}/, "but keeps its stage full height, so the front clouds stay below the words")
assert.match(css[1], /\.fit-root\[data-motion="reduced"\] \.fit-fig-float\{animation:none\}/, "and stops the figures floating")
assert.match(css[1], /@media \(max-width:760px\)\{/, "a designed phone layout")
assert.match(css[1], /\.fit-next-title span\{display:block;clip-path:inset\(0 -\.4em/, "the rising name is clipped top and bottom only, so wide glyphs are never cut")
assert.match(css[1], /\.fit-qa-grid\{columns:1\}/, "one column of questions on a phone")
assert.match(css[1], /:focus-visible\{outline:2px solid var\(--fit-gold\)/, "visible keyboard focus")

/* ---------- motion that cleans up after itself ---------- */

assert.match(src, /gsap\.registerPlugin\(ScrollTrigger\)/)
assert.match(src, /const ctx = gsap\.context\(\(self\) => \{/, "every tween and trigger lives in one context")
assert.match(src, /ctx\.revert\(\)/, "and is reverted on unmount")
assert.match(src, /function findScroller\(/, "it scrolls with whatever scrolls the host, not just the window")
assert.match(src, /trigger: root,\n\s+scroller,\n\s+start: "top top",\n\s+end: "bottom bottom",/, "the sky follows the whole page with that scroller")
assert.match(src, /wrapY\(cfg\.base \* stage, cfg\.speed, scrolled, stage, bankH\[i\]/, "banks wrap once they have left the top")
assert.match(src, /onToggle: \(self\) => \{\n\s+if \(self\.isActive\) applyTone\(tone\)/, "each section grades the sky")
assert.match(src, /gsap\.ticker\.add\(draw\)/, "the ribbon only animates while its stage is on screen")
assert.match(src, /gsap\.ticker\.remove\(draw\)/, "and stops when it is not")
assert.match(src, /new ResizeObserver\(/, "late layout changes re-measure the triggers")
assert.match(src, /if \(!R\) \{\n\s+const tl = gsap\.timeline\(\{ scrollTrigger: \{ trigger: heroEl/, "the hero scrub only runs without reduced motion")
assert.match(src, /scheduleCloud\(priority, draw\)/, "banks are painted a frame at a time")
assert.match(src, /const CLOUD_CACHE = \{\}/, "and cached across instances and themes")

/* ---------- it behaves like a real feature page ---------- */

assert.match(src, /<header className="fit-head">/, "a header")
assert.match(src, /<main>/, "a main landmark")
assert.match(src, /aria-labelledby=\{uid \+ "-title"\}/, "the hero is labelled by its headline")
assert.match(src, /role="heading" aria-level=\{2\}/, "the next story is a heading inside its link")
assert.match(src, /crossOrigin = "anonymous"/, "photos ask for CORS so they can be keyed")
assert.match(src, /if \(cors\) setCors\(false\)/, "and retry without it for hosts that refuse")
assert.match(src, /im = null \/\/ a host without CORS taints the canvas/, "a tainted canvas falls back to the plain photo")
assert.match(src, /onNext\(next\)/, "onNext is called with the next story")
assert.match(src, /aria-label=\{s\.label\} title=\{s\.label\}/, "social icons are labelled")
assert.ok(read("demo.tsx").includes("<FrescoInterviewTemplate />"), "default demo is the component, full bleed")
assert.doesNotMatch(read("demo.tsx"), /<div/, "default demo has no wrapper")
for (const demo of ["demo.tsx", "demo-nocturne.tsx"]) {
  const d = read(demo)
  assert.doesNotMatch(d, /[—–]/, `${demo}: no dashes`)
  assert.deepEqual([...d.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1]), ["@/components/ui/" + SLUG], `${demo} imports only the component`)
  for (const m of d.matchAll(/https?:\/\/([^/"'\s]+)/g)) assert.equal(m[1], "images.unsplash.com", `${demo}: unexpected host ${m[1]}`)
}
const noc = read("demo-nocturne.tsx")
assert.match(noc, /palette="nocturne"/, "the second demo is another palette")
assert.match(noc, /front: true/, "and places a figure in front of the copy")

/* ---------- logic, executed ---------- */

const code = region("content") + region("logic")
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(code)))

// default content: real photos, alt text, a way to key each one
const figs = [...L.DEFAULT_STORY.figures, L.DEFAULT_QUOTE.figure, L.DEFAULT_NEXT.figure, L.DEFAULT_SECTIONS[1].ornament]
for (const f of figs) {
  assert.match(f.src, /^https:\/\/images\.unsplash\.com\/photo-\d+-[0-9a-f]{12}$/, "bare Unsplash URL " + f.src)
  assert.ok(f.alt && f.alt.length > 8, "alt for " + f.src)
  assert.ok(["edges", "luma"].includes(f.key), "a key mode for " + f.src)
  assert.ok(f.key !== "luma" || f.range[0] >= 0.18, "luminance keys start high enough to drop a dim background")
}
assert.ok(L.DEFAULT_SECTIONS.every((s) => s.items.length >= 3), "each Q & A has real questions")
for (const name of ["dusk", "dawn", "nocturne"]) {
  const p = L.PALETTES[name]
  for (const k of ["hero", "qa", "quote", "next"]) assert.match(p.tones[k].a, /^#[0-9a-f]{6}$/, name + " " + k)
  assert.ok(p.tones.qa.banks < p.tones.hero.banks, name + ": the sky thins out behind the questions")
}
assert.equal(L.resolvePalette("auto", true), L.PALETTES.dusk, "auto is dusk at night")
assert.equal(L.resolvePalette("auto", false), L.PALETTES.dawn, "and dawn by day")
assert.equal(L.resolvePalette("nocturne", false), L.PALETTES.nocturne)
const custom = { ...L.PALETTES.dusk, ink: "#fff" }
assert.equal(L.resolvePalette(custom, true), custom, "a custom palette is used as given")

// sizing
assert.equal(L.sized("https://images.unsplash.com/photo-1758651794755-465d25631649", 1200), "https://images.unsplash.com/photo-1758651794755-465d25631649?auto=format&fit=max&q=80&w=1200")
assert.equal(L.sized("/local.jpg", 1200), "/local.jpg", "other hosts are left alone")

// rich copy
assert.deepEqual(L.richParts("**Loud Quiet** _got a city_ singing"), [
  { text: "Loud Quiet", kind: "bold" },
  { text: " ", kind: "plain" },
  { text: "got a city", kind: "italic" },
  { text: " singing", kind: "plain" },
])
assert.equal(L.plain("**Loud Quiet** _got_"), "Loud Quiet got")
assert.deepEqual(
  L.richWords("**Breath, harmony** _and company_").map((w) => w.text + ":" + w.kind),
  ["Breath,:bold", "harmony:bold", "and:italic", "company:italic"],
)

// the painter is deterministic and paints a bank with soft edges and empty margins
const a = L.paintCloudPixels(96, 48, 7, L.PALETTES.dusk.cloud)
const b = L.paintCloudPixels(96, 48, 7, L.PALETTES.dusk.cloud)
assert.deepEqual(a, b, "same seed, same cloud")
assert.notDeepEqual(a, L.paintCloudPixels(96, 48, 8, L.PALETTES.dusk.cloud), "another seed, another cloud")
let opaque = 0
let soft = 0
for (let i = 3; i < a.length; i += 4) {
  if (a[i] > 250) opaque++
  else if (a[i] > 5) soft++
}
assert.ok(opaque > 96 * 48 * 0.1, "it has a body")
assert.ok(soft > 96 * 48 * 0.02, "with soft edges")
for (let x = 0; x < 96; x++) assert.equal(a[x * 4 + 3], 0, "the top row is clear, so a bank never shows a hard canvas edge")
assert.ok(L.cloudPuffs(200, 100, 3).every(([x, y, rx, ry]) => x - rx >= 0 && x + rx <= 200 && y - ry >= 0), "puffs stay inside the canvas")

// the keyer: a grey figure on a flat red wall keeps the figure and drops the wall
const W = 24
const H = 24
const px = new Uint8ClampedArray(W * H * 4)
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4
    const fig = x >= 8 && x < 16 && y >= 6
    px[i] = fig ? 200 : 170
    px[i + 1] = fig ? 200 : 20
    px[i + 2] = fig ? 200 : 20
    px[i + 3] = 255
  }
}
L.keyPixels(px, W, H, { mode: "edges", ramp: ["#000000", "#808080", "#ffffff"] })
assert.equal(px[(2 * W + 2) * 4 + 3], 0, "the wall is gone")
assert.ok(px[(14 * W + 12) * 4 + 3] > 240, "the figure stays")
assert.ok(px[(14 * W + 12) * 4] > 150, "and is graded up the ramp")
const lum = new Uint8ClampedArray(W * H * 4)
for (let i = 0; i < W * H; i++) {
  const bright = i % W > 12
  lum[i * 4] = lum[i * 4 + 1] = lum[i * 4 + 2] = bright ? 230 : 20
  lum[i * 4 + 3] = 255
}
L.keyPixels(lum, W, H, { mode: "luma", ramp: ["#000000", "#808080", "#ffffff"], fade: 0.5 })
assert.equal(lum[(2 * W + 2) * 4 + 3], 0, "luma drops the dark")
assert.ok(lum[(2 * W + 20) * 4 + 3] > 240, "and keeps the light")
assert.ok(lum[(23 * W + 20) * 4 + 3] < 12, "the bottom fades out")

// the ribbon draws in from the left and twists
const r0 = L.ribbonPaths(1000, 400, 0, 0, 30)
assert.equal(r0.shape, "", "nothing drawn at progress 0")
const r1 = L.ribbonPaths(1000, 400, 0, 1, 30)
assert.ok(r1.shape.startsWith("M") && r1.shape.endsWith(" Z"), "a closed shape")
assert.equal((r1.shape.match(/ L/g) || []).length, 96 * 2 + 1, "both edges, every segment, at progress 1")
assert.ok((L.ribbonPaths(1000, 400, 0, 0.5, 30).shape.match(/ L/g) || []).length < 100, "half way, half the ribbon")
assert.equal(r1.stops.length, L.RIB_STOPS)
assert.ok(r1.stops.every((st, i, arr) => st.offset >= 0 && st.offset <= 1 && (i === 0 || st.offset >= arr[i - 1].offset)), "gradient stops run left to right")
const lits = r1.stops.map((st) => st.lit)
assert.ok(Math.max(...lits) > 0.8 && Math.min(...lits) < 0.3, "the twist turns the silk from lit to shadow")
assert.notEqual(L.ribbonPaths(1000, 400, 1, 1, 30).edge, r1.edge, "time makes it wave")

// sky banks wrap
assert.equal(L.wrapY(100, 0.5, 0, 900, 300), 100)
assert.equal(L.wrapY(100, 0.5, 200, 900, 300), 0)
const off = L.wrapY(100, 0.5, 1000, 900, 300)
assert.ok(off >= -300 && off <= 900, "a bank that leaves the top comes back under the bottom")
assert.equal(L.SKY_BANKS.length, 5)
assert.ok(L.SKY_BANKS.every((b, i, arr) => i === 0 || b.speed > arr[i - 1].speed), "nearer banks move faster")

// the shell is hinged and closed
const sh = L.shellPaths(120, 150, 100, 9, 160)
assert.match(sh.fan, /^M120\.0 150\.0 L/, "the fan starts at the hinge")
assert.ok(sh.fan.endsWith(" Z") && sh.lip.endsWith(" Z"))
assert.equal((sh.ridges.match(/M/g) || []).length, 8, "a ridge between every scallop")

console.log("ok", SLUG)
