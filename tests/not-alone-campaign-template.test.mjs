// Install-safety and logic checks for components/not-alone-campaign-template.
// Run: node tests/not-alone-campaign-template.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const SLUG = "not-alone-campaign-template"
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
for (const m of src.matchAll(/https?:\/\/([^/"'`\s)]+)/g)) {
  assert.ok(["images.unsplash.com", "qcmhr.org", "www.intothelightid.org", "www.google.com"].includes(m[1]), "unexpected host " + m[1])
}
assert.match(src, /const UNSPLASH = "https:\/\/images\.unsplash\.com\/photo-"/, "the only remote pictures are Unsplash photos")
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.match(src, /"--nac-h": height/, "the height prop reaches the root")
assert.match(src, /\.nac-root\{[^}]*min-height:var\(--nac-h\)/, "the root has a definite floor")
assert.match(src, /\.nac-hero\{[^}]*min-height:max\(var\(--nac-h\),660px\)/, "the hero has a definite height")
assert.match(src, /\.nac-facts\{position:relative;height:calc\(var\(--nac-h\) \*/, "the facts run is a definite length per fact")
assert.match(src, /\.nac-facts-stick\{position:sticky;top:0;height:var\(--nac-h\)/, "and its stage sticks at a definite height")
assert.match(src, /\.nac-signs\{position:relative;height:calc\(var\(--nac-h\) \+ var\(--nac-run,220vh\)\)\}/, "the sideways run is definite, with a fallback before it is measured")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
for (const m of src.matchAll(/([.\w>*\s-]+)\{[^}]*\bheight:100%/g)) assert.match(m[0], /position:absolute|inset:0/, `a percentage height only on absolutely placed media: ${m[1].trim()}`)
assert.match(src, /\.nac-pic img,\.nac-pic \.nac-hills\{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;max-width:none\}/, "photos are guarded against Preflight")
assert.match(src, /style=\{\{ maxWidth: "none", objectPosition: shot\.focus \}\}/, "and inline, in case the CSS loses")
assert.match(src, /React\.useId\(\)\.replace/, "ids are namespaced per instance")
const head = src.slice(0, src.indexOf("</"))
assert.doesNotMatch(head, /use(State|Ref|Memo|Callback)<|Partial<|Required<|Record<|Array<|Map<|Promise<|React\.[A-Za-z]+<|\[K in /, "no generics before the first JSX close tag (21st CLI tokenizer)")
assert.doesNotMatch(src, /use(State|Ref|Memo|Callback)</, "hooks are typed without <generics>")
assert.match(src, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/, "reduced motion is read in JS")
assert.doesNotMatch(src, /[—–]/, "no em or en dashes anywhere")
assert.doesNotMatch(src, />[^<{]*\\u[0-9a-f]{4}/i, "no \\u escapes inside JSX text")

const css = src.match(/const NAC_CSS = `([\s\S]*?)`/)
assert.ok(css, "CSS block present")
assert.doesNotMatch(css[1], /\$\{|`/, "no interpolation inside the CSS string")
assert.doesNotMatch(css[1], /url\(/, "no url() in the style block")
assert.ok(css[1].includes("prefers-reduced-motion:reduce"), "honours reduced motion in CSS")
for (const m of css[1].replace(/\/\*[\s\S]*?\*\//g, "").replace(/@media[^{]*\{/g, "").replace(/@keyframes[^{]*\{/g, "").matchAll(/(?<=^|[{}])\s*([^{}@]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (/^(from|to|[\d.,%\s]+)$/.test(sel)) continue
  for (const s of sel.split(/,(?![^(]*\))/)) assert.match(s.trim(), /^\.nac-/, `selector escapes the component: ${s.trim()}`)
}
assert.match(css[1], /\.nac-root :where\(svg,canvas,img\)\{display:block;max-width:none\}/, "media are guarded against Preflight")
assert.match(css[1], /\.nac-root\{[^}]*overflow-x:clip/, "the root clips sideways without breaking the sticky stages")
assert.doesNotMatch(css[1], /\.nac-root\{[^}]*overflow:hidden/, "overflow:hidden on the root would break position:sticky")
assert.match(css[1], /\.nac-root\[data-theme="dark"\]\{/, "a designed night theme")
assert.match(css[1], /\.nac-root\[data-theme="dark"\] \.nac-night\{filter:/, "night grades the photographs")
assert.match(css[1], /\.nac-root\[data-motion="reduced"\] \.nac-signs\{height:auto\}/, "reduced motion turns the sideways run into a plain swipe row")

/* ---------- motion that cleans up after itself ---------- */

assert.match(src, /gsap\.registerPlugin\(ScrollTrigger\)/)
assert.match(src, /const ctx = gsap\.context\(/, "every tween and trigger lives in one context")
assert.match(src, /ctx\.revert\(\)/, "and is reverted on unmount")
assert.match(src, /function findScroller\(/, "it scrolls with whatever scrolls the host, not just the window")
assert.match(src, /scroller,\n\s+start: "top top",\n\s+end: "bottom bottom",/, "triggers take that scroller")
assert.match(src, /containerAnimation: slide/, "the sign cards tilt as the row passes them")
assert.match(src, /onRefreshInit: setRun/, "the sideways run is measured before every refresh")
assert.match(src, /if \(!R\) \{\n\s+\/\/ page one/, "the intro only plays without reduced motion")
assert.match(src, /new ResizeObserver\(/, "late layout changes re-measure the triggers")

/* ---------- it behaves like a real campaign page ---------- */

for (const k of ["home", "facts", "signs", "faith", "help", "pledge"]) assert.ok(src.includes(`data-sec="${k}"`), `section ${k} is addressable`)
assert.match(src, /role="slider"/, "the check-in is a real slider")
assert.match(src, /aria-valuetext=\{moodNow\.label\}/, "and speaks its mood")
assert.match(src, /const n = nextIndex\(mood, e\.key, moods\.length\)/, "and works from the keyboard")
assert.match(src, /setPointerCapture/, "and by dragging")
assert.match(src, /window\.location\.replace\(quickExitUrl\)/, "quick exit leaves without a back-button trail")
assert.match(src, /hits\.length >= 3/, "triple Escape is the keyboard quick exit")
assert.match(src, /aria-pressed=\{on\}/, "sign cards are toggle buttons")
assert.match(src, /aria-pressed=\{pledged\}/, "the pledge is a toggle that stays pressed")
assert.match(src, /onPledge\?\.\(\)/, "onPledge is called")
assert.match(src, /onCheckin\?\.\(moods\[target\], target\)/, "onCheckin is called with the mood")
assert.match(src, /href=\{h\.href\}/, "helplines are real links (tel:, sms:, https:)")
assert.match(src, /crossOrigin=\{cors \? "anonymous" : undefined\}/, "photos ask for CORS so they can be printed")
assert.match(src, /if \(cors\) setCors\(false\)/, "and retry without it for hosts that refuse")
assert.match(src, /resolve\(null\) \/\/ a host without CORS taints the canvas/, "a tainted canvas falls back to the plain photo")
assert.match(src, /fallback=\{<HillsArt \/>\}/, "the drawn landscape is the first frame, so 21st's sandboxed capture is never blank")
assert.ok(read("demo.tsx").includes("<NotAloneCampaignTemplate />"), "default demo is the component, full bleed")
assert.doesNotMatch(read("demo.tsx"), /<div/, "default demo has no wrapper")
for (const demo of ["demo.tsx", "demo-campus.tsx"]) {
  const d = read(demo)
  assert.doesNotMatch(d, /[—–]/, `${demo}: no dashes`)
  assert.deepEqual([...d.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1]), ["@/components/ui/" + SLUG], `${demo} imports only the component`)
  for (const m of d.matchAll(/https?:\/\/([^/"'\s]+)/g)) assert.ok(["images.unsplash.com", "digital.nhs.uk"].includes(m[1]), `${demo}: unexpected host ${m[1]}`)
}
const campus = read("demo-campus.tsx")
assert.match(campus, /palette="heather"/, "the second demo is another palette")
assert.match(campus, /faith=\{null\}/, "and drops the faith page")

/* ---------- logic, executed ---------- */

const code = region("content") + region("logic")
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(code)))

// default content: real photos, alt text, a loading tone
const shots = [L.DEFAULT_HERO.landscape, L.DEFAULT_HERO.window, L.DEFAULT_FAITH.shot, L.DEFAULT_PLEDGE.shot, ...L.DEFAULT_SIGNS.map((s) => s.shot)]
for (const s of shots) {
  assert.match(s.src, /^https:\/\/images\.unsplash\.com\/photo-\d+-[0-9a-f]{12}$/, "bare Unsplash URL " + s.src)
  assert.ok(s.alt && s.alt.length > 8, "alt for " + s.src)
  assert.match(s.tone, /^#[0-9a-f]{6}$/, "tone for " + s.src)
}
for (const s of L.DEFAULT_STATS) assert.ok(s.fraction > 0 && s.fraction <= 1, s.value + " has a fraction for the crowd")
assert.equal(L.DEFAULT_SIGNS.filter((s) => s.urgent).length, 1, "one sign is marked urgent")
assert.match(L.DEFAULT_SIGNS.find((s) => s.urgent).help, /112/, "and it says who to call")
assert.ok(L.DEFAULT_HELPLINES.some((h) => h.urgent && /^tel:/.test(h.href)), "an emergency number is always there")
assert.equal(L.DEFAULT_MOODS.length, 5)
for (const m of L.DEFAULT_MOODS) assert.ok(["talk", "breathe", "reach"].includes(m.action))
assert.equal(L.DEFAULT_MOODS[0].action, "talk", "struggling always points to people")
const typeKeys = [...src.match(/export type NacLabels = \{([\s\S]*?)\n\}/)[1].matchAll(/^\s+(\w+)\?:/gm)].map((m) => m[1])
for (const k of typeKeys) assert.ok(k in L.DEFAULT_LABELS, "default label " + k)
assert.equal(Object.keys(L.DEFAULT_LABELS).length, typeKeys.length, "no orphan labels")

// photo URLs
const u = "https://images.unsplash.com/photo-1438786657495-640937046d18"
assert.equal(L.sized(u, 900), u + "?auto=format&fit=crop&q=80&w=900")
assert.equal(L.sized(u + "?w=10", 900.4), u + "?auto=format&fit=crop&q=80&w=900", "existing params are replaced")
assert.equal(L.sized("/field.jpg", 900), "/field.jpg", "other URLs pass through")

// copy
assert.deepEqual(L.richParts("In ==Indo==nesia, **really**"), [
  { text: "In ", kind: "plain" },
  { text: "Indo", kind: "hl" },
  { text: "nesia, ", kind: "plain" },
  { text: "really", kind: "bold" },
])
assert.deepEqual(L.richParts("plain"), [{ text: "plain", kind: "plain" }])
assert.equal(L.plain("Caring is **stewardship** in ==Indo==nesia"), "Caring is stewardship in Indonesia")
assert.equal(L.fill("{count} of every {total} {x}", { count: 17, total: 50 }), "17 of every 50 {x}")
assert.equal(L.grouped(1285), "1,285")

// palettes: the label carries white text, the ink carries body copy
const lum = (hex) => {
  const c = L.hexRgb(hex).map((x) => x / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4))
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort(); return (y + 0.05) / (x + 0.05) }
for (const [name, p] of Object.entries(L.PALETTES)) {
  assert.ok(ratio(p.labelInk, p.label) >= 4.5, name + ": label text")
  assert.ok(ratio(p.ink, p.paper) >= 7, name + ": body text on paper")
  assert.ok(ratio("#59604f", p.paper) >= 4.5, name + ": muted text on paper")
}
assert.equal(L.resolvePalette("tide"), L.PALETTES.tide)
assert.equal(L.resolvePalette("nope"), L.PALETTES.meadow)
const own = { paper: "#ffffff", ink: "#000000", label: "#111111", labelInk: "#ffffff", accent: "#ff0000", buddy: "#ffff00" }
assert.equal(L.resolvePalette(own), own)
assert.equal(L.mixHex("#000000", "#ffffff", 0.5), "#808080")
assert.equal(L.mixHex("#102030", "#ffffff", 0), "#102030")
assert.deepEqual(L.hexRgb("#abc"), [170, 187, 204])

// the screen print: few colours, true to the picture, speckle melted away
const pal = L.medianCut([0, 0, 0, 2, 2, 2, 1, 3, 0, 250, 0, 0, 252, 2, 0, 248, 1, 2], 2)
assert.equal(pal.length, 2)
for (const target of [[1, 2, 1], [250, 1, 1]]) assert.ok(pal.some((c) => c.every((v, i) => Math.abs(v - target[i]) <= 2)), "median cut finds " + target)
assert.equal(L.medianCut([9, 9, 9, 9, 9, 9], 6).length, 1, "a flat picture stays one colour")
assert.equal(L.nearest(pal, 240, 10, 10), pal.findIndex((c) => c[0] > 200))
const w = 24, h = 16
const px = new Uint8ClampedArray(w * h * 4)
for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
  const i = (y * w + x) * 4
  const left = x < w / 2
  px[i] = left ? 60 : 200; px[i + 1] = left ? 140 : 190; px[i + 2] = left ? 40 : 120; px[i + 3] = 255
}
px[(5 * w + 4) * 4] = 255; px[(5 * w + 4) * 4 + 1] = 0; px[(5 * w + 4) * 4 + 2] = 255 // one stray magenta pixel in the field
const used = L.cutoutPixels(px, w, h, 3, 2)
assert.ok(used.length <= 3)
const colours = new Set()
for (let i = 0; i < w * h; i++) colours.add(px[i * 4] + "," + px[i * 4 + 1] + "," + px[i * 4 + 2])
assert.ok(colours.size <= 3, "at most k colours remain")
const at = (x, y) => [px[(y * w + x) * 4], px[(y * w + x) * 4 + 1], px[(y * w + x) * 4 + 2]]
assert.deepEqual(at(4, 5), at(3, 5), "the speckle melts into its field")
assert.ok(at(2, 2)[1] > at(2, 2)[0], "the green half stays green")
assert.ok(at(20, 2)[0] > 150, "the pale half stays pale")
const idx = new Uint8Array([0, 0, 0, 0, 1, 0, 0, 0, 0])
assert.equal(L.modeFilter(idx, 3, 3, 2)[4], 0, "mode filter outvotes a lone index")

// the crowd and the steps
const rank = L.isoOrder(50, 11)
assert.deepEqual([...rank].sort((a, b) => a - b), Array.from({ length: 50 }, (_, i) => i), "the crowd order is a permutation")
assert.deepEqual(L.isoOrder(50, 11), rank, "and holds still between renders")
assert.equal(L.isoCount(0.349, 50), 17)
assert.equal(L.isoCount(0.026, 50), 1, "a small share still lights one person")
assert.equal(L.isoCount(0, 50), 0)
assert.equal(L.isoCount(3, 50), 50)
assert.equal(L.stepAt(0, 3), 0)
assert.equal(L.stepAt(0.34, 3), 1)
assert.equal(L.stepAt(1, 3), 2, "the last fact holds at the end of the run")
assert.equal(L.stepAt(5, 3), 2)
assert.equal(L.stepAt(0.5, 0), 0)

// the check-in face: sad to glad, never angry
const sad = L.moodShape(0, 4), mid = L.moodShape(2, 4), glad = L.moodShape(4, 4)
const bend = (s) => Number(s.mouth.split(" ")[3]) - 78
assert.ok(bend(sad) < 0 && bend(glad) > 0 && bend(mid) === 0, "the mouth turns from down to up")
assert.ok(Number(sad.brow) > 0 && Number(glad.brow) < 0)
assert.match(src, /"M36 " \+ \(40 \+ Number\(s\.brow\) \* 0\.4\) \+ " L50 " \+ \(40 - Number\(s\.brow\) \* 0\.5\)/, "sad brows lift at the middle (worried, not cross)")
assert.equal(L.nextIndex(0, "ArrowLeft", 5), 0)
assert.equal(L.nextIndex(4, "ArrowRight", 5), 4)
assert.equal(L.nextIndex(2, "Home", 5), 0)
assert.equal(L.nextIndex(2, "End", 5), 4)
assert.equal(L.nextIndex(2, "x", 5), -1)

// breathing: 4, 7, 8
assert.deepEqual(L.breathAt(0, [4, 7, 8]), { phase: "in", index: 0, left: 4, round: 0 })
assert.equal(L.breathAt(4.2, [4, 7, 8]).phase, "hold")
assert.equal(L.breathAt(4.2, [4, 7, 8]).left, 7)
assert.equal(L.breathAt(12, [4, 7, 8]).phase, "out")
assert.deepEqual(L.breathAt(19, [4, 7, 8]), { phase: "in", index: 0, left: 4, round: 1 })
assert.equal(L.breathPhases([4, 0, 4]).length, 2, "a zero hold is skipped")

// hand-drawn strokes
const a = L.scrawl([[0, 0], [10, 0], [20, 10]], 5)
assert.equal(a, L.scrawl([[0, 0], [10, 0], [20, 10]], 5), "the same drawing every render")
assert.match(a, /^M0 0 Q[\d.-]+ [\d.-]+ 10 0 Q[\d.-]+ [\d.-]+ 20 10$/)
assert.match(L.headPath(24, 15, 8.5), /^M15\.5 15 a8\.5 8\.5 0 1 0 17 0 a8\.5 8\.5 0 1 0 -17 0$/)

console.log(`ok - ${SLUG}`)
