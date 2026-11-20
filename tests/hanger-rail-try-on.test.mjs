// Install-safety, accessibility and geometry checks for components/hanger-rail-try-on.
// Run: node tests/hanger-rail-try-on.test.mjs
//
// Layout and ring maths live in the `geometry` region (no layout reads); it is lifted out and
// run here as shipped, at every viewport the UI audit covers.
import assert from "node:assert/strict"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { liftRegion } from "./_component-safety.mjs"

// terse regex asserts: a failure names the rule instead of dumping the whole file
const match = (s, re, m) => assert.ok(re.test(s), m)
const noMatch = (s, re, m) => assert.ok(!re.test(s), m)

const slug = "hanger-rail-try-on"
const dir = new URL("../components/" + slug + "/", import.meta.url)
const src = readFileSync(new URL(slug + ".tsx", dir), "utf8").replace(/\r\n/g, "\n")
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")
const tsconfig = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")

// --- install safety -------------------------------------------------------
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo.tsx", slug + ".tsx"], "folder holds only the publishable files")
assert.ok(tsconfig.includes('"@/components/ui/' + slug + '": ["./components/' + slug + "/" + slug + '.tsx"]'), "tsconfig paths line")
match(demo, /from "@\/components\/ui\/hanger-rail-try-on"/, "demo imports the installed path")
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "React is the only import")
assert.ok(/height = "100svh"/.test(src), "height defaults to a definite length")
assert.ok(src.includes("height, minHeight: height"), "the root carries the height prop")
noMatch(src, /\bh-full\b/, "no h-full")
assert.ok(!/`/.test(src), "no backticks in the file")
noMatch(src, /\$\{/, "no ${ in the file")
assert.ok(!/@import/.test(src), "no @import")
noMatch(src + demo, /use(Ref|State|Memo|Callback|Reducer|Context)</, "no generic hook type arguments")
assert.ok(Buffer.byteLength(src) < 200 * 1024, "21st rejects component files over 200 kB")
assert.ok(!/var\(--color-/.test(src), "assumes no theme tokens: the scene carries its own colours")
for (const v of src.matchAll(/var\((--[a-z0-9-]+)/g)) assert.ok(v[1].startsWith("--hrt-"), "only its own variables: " + v[1])
noMatch(src, /getBoundingClientRect|offset(Top|Left|Width|Height)|client(Width|Height)|scrollHeight|getComputedStyle/, "no layout reads")
match(src, /new ResizeObserver/, "sized from the observer")
match(src, /ro\.disconnect\(\)/, "observer cleaned up")
match(src, /cancelAnimationFrame\(m\.current\.raf\)/, "frame loop stops on unmount")
noMatch(src, /backdrop-filter|blur\(20px\)/, "no frosted glass: panels are solid paper")
match(src, /\.hrt-paper\{background:var\(--hrt-paper\);border:1px solid var\(--hrt-line\)/, "paper panels with a hairline")
noMatch(src, /cursor:\s*none/, "the system cursor is never hidden")

// CSS string: scoped, Preflight-guarded, honours reduced motion
const cssAt = src.indexOf("const CSS =")
const css = src.slice(cssAt, src.indexOf("\n\n", cssAt)).replace(/"\s*\+\s*\n\s*"/g, "")
let rules = 0
for (const m of css.matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || sel.startsWith("const CSS") || /^(from|to|\d)/.test(sel)) continue
  rules++
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".hrt-")), "unscoped selector: " + sel)
}
assert.ok(rules > 40, "the scope check saw real rules, saw " + rules)
match(css, /\.hrt-root img\{max-width:none/, "images escape Preflight's max-width")
match(css, /@media \(prefers-reduced-motion:reduce\)/, "CSS honours reduced motion")
match(src, /prefers-reduced-motion: reduce/, "reduced motion is read at runtime")
match(src, /if \(m\.current\.reduced \|\| !wrap/, "reduced motion skips the scan")
match(src, /if \(s\.reduced\) s\.pos = goal/, "reduced motion jumps the rail")
noMatch(css, /transform:scale\(1\.[0-9]|scale\(1\.[0-9]/, "nothing is enlarged with transform: scale")
for (const tag of src.matchAll(/<img [^>]*>/g)) {
  match(tag[0], /width=\{[^}]+\} height=\{[^}]+\}/, "img carries width/height: " + tag[0].slice(0, 40))
  match(tag[0], /maxWidth: "none"/, "img escapes Preflight inline too")
}

// hosted pictures: only the catalogue site, and every default file exists locally
const hosts = new Set((src.match(/https:\/\/[a-z0-9.-]+/gi) || []).map((u) => u.toLowerCase()))
assert.deepEqual([...hosts], ["https://kedhar-components.pages.dev"], "pictures come from the catalogue site only")
match(src, /const SITE = "https:\/\/kedhar-components\.pages\.dev\/hanger-rail-try-on\/"/, "site folder is the slug")
const files = ["room.webp", ...[1, 2, 3, 4, 5].flatMap((i) => ["look-" + i + ".webp", "mask-" + i + ".webp", "garment-" + i + ".webp"])]
for (const f of files) {
  assert.ok(src.includes('"' + f + '"'), "default references " + f)
  const st = statSync(new URL("../dev/public/" + slug + "/" + f, import.meta.url))
  assert.ok(st.size > 1000 && st.size < 200 * 1024, f + " exists and stays under 200 kB")
}

// --- accessibility and interaction -----------------------------------------
match(src, /aria-roledescription="carousel"/, "announced as a carousel")
match(src, /aria-pressed=\{i === sel\}/, "hangers report the worn garment")
match(src, /aria-label=\{"Try on " \+ it\.name/, "hangers are labelled")
assert.ok(/aria-live="polite"/.test(src), "changes are announced")
match(src, /type="radio" name=\{uid \+ "-size"\}/, "sizes are a native radio group")
match(src, /type="radio"\s+name=\{uid \+ "-color"\}/, "colours are a native radio group")
match(src, /e\.key === "ArrowRight"/, "arrow keys turn the ring")
match(src, /e\.key === "Home"/, "Home and End jump")
match(src, /el\.tabIndex = visible \? 0 : -1/, "hidden hangers leave the tab order")
match(src, /touch-action:pan-y/, "vertical page scroll survives on touch")
match(src, /if \(Math\.abs\(dx\) < Math\.abs\(e\.deltaY\) && !e\.shiftKey\) return/, "vertical wheels scroll the page, not the rail")
match(src, /setPointerCapture/, "drags keep the pointer")
match(src, /onAddToBag && onAddToBag\(\{ item, size, color \}\)/, "add-to-bag reports the selection")

// --- motion rules -----------------------------------------------------------
// the try-on is a wipe between layers with identical framing, never a crossfade; scans queue
match(src, /clipPath: "inset\(0 0 100% 0\)" \}, \{ clipPath: "inset\(0 0 0% 0\)" \}/, "incoming look is wiped in")
match(src, /if \(incoming < 0 && sel !== worn\) setIncoming\(sel\)/, "a scan finishes before the next starts")
match(src, /maskImage: "url\(" \+ lookAt\(incoming\)\.look \+ "\)"/, "scan grid is masked to the body")
match(src, /1 - Math\.exp\(-dt \/ \(s\.drag \? 45 : 170\)\)/, "rail position is eased, frame-rate independent")
match(src, /w\.v \+= \(\(want - w\.a\) \* 0\.00018 - w\.v \* 0\.011\) \* dt/, "hangers sway on a damped spring driven by rail speed")
match(src, /if \(s\.reduced\) \{\s*w\.a = 0/, "reduced motion: no sway")
match(css, /\.hrt-roll \.hrt-in\{animation:hrt-in \.46s cubic-bezier\(\.2,\.8,\.2,1\) \.14s both\}/, "new text enters after the old starts leaving")

// --- geometry, run as shipped ----------------------------------------------
const g = await liftRegion(src, "geometry")
const { layoutFor, railPose, wrapOffset, LOOK_W, LOOK_H } = g
assert.equal(wrapOffset(4, 5), -1)
assert.equal(wrapOffset(-3, 5), 2)
assert.ok(railPose(0, 5, 200).garment === 0, "the middle garment is lifted off: he is wearing it")
assert.ok(railPose(0, 5, 200).hanger === 1, "its empty hanger stays on the rail")
for (const o of [1, -1, 2, -2]) { const p = railPose(o, 5, 200); assert.ok(p.garment === 1 && p.label === 1 && p.x === o * 200, "settled neighbours are fully shown at o=" + o) }
assert.ok(railPose(2.49, 5, 200).hanger < 0.05, "hangers fade out at the wrap seam")

for (const [w, h] of [[1440, 900], [1280, 720], [1920, 1080], [1024, 768], [390, 844], [1536, 720], [360, 740]]) {
  const L = layoutFor(w, h)
  const tag = w + "x" + h
  assert.ok(Math.abs(L.mw / L.mh - LOOK_W / LOOK_H) < 1e-9, tag + ": model keeps the look aspect")
  assert.ok(L.rodY > L.barTop + L.barH + 8, tag + ": rail under the top bar")
  assert.ok(w / 2 + L.pitch + L.labelW / 2 <= w - L.g + 0.5, tag + ": neighbours and their tags stay inside the gutter")
  const inner = L.pitch - L.labelW / 2
  if (L.mTop < L.railBottom) assert.ok(0.2 * L.mw + 13.5 <= inner, tag + ": the head clears the neighbouring garments")
  if (L.mTop + 0.15 * L.mh < L.railBottom + 6) assert.ok(0.46 * L.mw + 13.5 <= inner, tag + ": the shoulders clear the neighbouring garments")
  if (!L.compact) {
    const reach = (L.panelTop - L.mTop) / L.mh > 0.74 ? 0.34 : 0.46
    assert.ok(L.g + L.panelW <= w / 2 - reach * L.mw - 17, tag + ": panels clear the figure")
  } else {
    assert.ok(L.mTop + L.mh <= L.panelTop - 11.5, tag + ": figure ends above the panel")
  }
}

console.log("hanger-rail-try-on: ok")
