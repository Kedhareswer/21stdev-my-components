// Runnable check for components/murmur-voice-app-landing: the motion constants, the scroll
// maths (hero sink, glass drift, active feature, slider loop and drag), the content rules and the
// install-safety rules.
// Run: node tests/murmur-voice-app-landing.test.mjs
//
// What breaks silently here: a spring string that stops being a valid linear(), a hero that
// sinks the wrong way, a slider that can step past its last page, or copy that drifts away
// from the placeholder rules.
import assert from "node:assert/strict"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { liftRegion } from "./_component-safety.mjs"

const slug = "murmur-voice-app-landing"
const dir = new URL("../components/" + slug + "/", import.meta.url)
const file = new URL(slug + ".tsx", dir)
const src = readFileSync(file, "utf8").replace(/\r\n/g, "\n")
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")

// ---- install safety -------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo.tsx", slug + ".tsx"].sort(), "folder holds only the publishable files")
assert.ok(statSync(file).size < 200_000, "under 21st's 200 kB file limit: " + statSync(file).size)
const ts = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")
assert.ok(ts.includes('"@/components/ui/' + slug + '": ["./components/' + slug + "/" + slug + '.tsx"]'), "tsconfig paths line")
const templates = JSON.parse(readFileSync(new URL("../scripts/templates.json", import.meta.url), "utf8"))
assert.ok(templates.templates.some((t) => t.slug === slug), "listed as a template")
assert.match(demo, /from "@\/components\/ui\/murmur-voice-app-landing"/, "demo imports the installed path")
assert.match(src, /height = "100svh"/, "height defaults to a definite length")
assert.match(src, /\.mm-root\{width:100%;/, "root takes the full width (21st centres demos in a flex box)")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.doesNotMatch(src + demo, /use(Ref|State|Memo|Callback|Reducer|Context)</, "no generic hook type arguments (they hang the 21st CLI)")
assert.doesNotMatch(src, /var\(--color-/, "assumes no host tokens")
const urls = [...(src + demo).matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0]).filter((u) => !u.startsWith("http://www.w3.org/"))
assert.deepEqual(urls, ["https://kedhar-components.pages.dev/murmur-voice-app-landing/"], "the only fetches are the generated pictures, from the component site")
const pub = new URL("../dev/public/" + slug + "/", import.meta.url)
for (const f of ["hand", "p0", "p1", "p2", "p3", "p4", "p5", "g0", "g1", "g2"]) assert.ok(statSync(new URL(f + ".webp", pub)).size < 120_000, "served picture exists and stays small: " + f)
assert.equal((src.match(/<img /g) || []).length, 3, "three img tags: hand, portrait, glass")
for (const m of src.matchAll(/<img [^>]*>/g)) assert.match(m[0], /width=\{\w+\} height=\{\w+\}[^>]*alt=""/, "every img has explicit width/height and empty alt")
assert.doesNotMatch(src, /FACES|GLASS_DEFS|HandBack|HandFront/, "the painted stand-ins are gone")
assert.match(src, /<img className="mm-hand"[^>]*width=\{790\} height=\{1210\}[^>]*maxWidth: "none"/, "the photo has explicit width/height and opts out of Preflight's max-width")
assert.equal((src.match(/@font-face\{font-family:Mm(Head|Body)/g) || []).length, 2, "two embedded, renamed font subsets")
assert.match(src, /prefers-reduced-motion: reduce/, "reduced motion is read at runtime")
assert.match(src, /ev\.pointerType !== "mouse"/, "touch never drives the card light")

const cssAt = src.indexOf("const CSS =")
const css = src.slice(cssAt, src.indexOf("\n\n", cssAt))
assert.doesNotMatch(css, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS string")
const flat = css.replace(/^const CSS =\s*/, "").replace(/"\s*\+\s*EASE_TIP\s*\+\s*"/g, "cubic-bezier(.04,.71,.31,.96)").replace(/"\s*\+\s*EASE\s*\+\s*"/g, "cubic-bezier(.21,.99,.33,1.04)").replace(/"\s*\+\s*(\/\*[^*]*\*\/\s*)?\n\s*"/g, "")
assert.match(flat, /@media \(prefers-reduced-motion:reduce\)/, "CSS honours reduced motion")
assert.match(flat, /@media \(hover:hover\) and \(pointer:fine\)\{\.mm-box:hover::after/, "the cursor light only exists for a fine pointer")
assert.match(flat, /\.mm-root img,\.mm-root svg,\.mm-root canvas\{max-width:none\}/, "guards Preflight's max-width")
let rules = 0
for (const m of flat.matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || /^(from|to|\d)/.test(sel)) continue
  rules++
  assert.ok(sel.split(/,(?![^(]*\))/).every((x) => x.trim().startsWith(".mm-")), "unscoped selector: " + sel)
}
assert.ok(rules > 120, "the scope check saw the real rules: " + rules)

// ---- content rules ---------------------------------------------------------
assert.match(src, /kedhareswer\.12110626@gmail\.com/, "contact email")
assert.match(src, /Kedhareswer built Murmur/, "copy about the person is about Kedhareswer")
for (const c of ["Client 1", "Client 2", "Client 3"]) assert.ok(src.includes(c), "client placeholder " + c)
for (const p of ["Project 01", "Project 02", "Project 03"]) assert.ok(src.includes(p), "work placeholder " + p)
assert.doesNotMatch(src + demo, /framer|iris|oversight|ovo-/i, "nothing identifies the source")

// ---- motion (values read from the reference's shipped animation configs) -----
const M = await liftRegion(src, "motion")
assert.equal(M.EASE, "cubic-bezier(.21,.99,.33,1.04)")
assert.equal(M.EASE_TIP, "cubic-bezier(.04,.71,.31,.96)")
assert.deepEqual(M.TEXT, { start: 0.1, stagger: 0.04, dur: 1, y: 30, blur: 5 })
assert.deepEqual(M.CARD_DELAY, { threads: 0.3, studio: 0.4, fan: 0.2, voice: 0.3, group: 0.5 })
const pts = M.SLIDE.slice(7, -1).split(",").map(Number)
assert.equal(pts[0], 0)
assert.equal(pts.at(-1), 1)
for (let i = 1; i < pts.length; i++) assert.ok(pts[i] >= pts[i - 1], "slide spring is monotonic")
// Overdamped spring (stiffness 200, damping 40): about half way at 0.2 s of the 1 s run.
assert.ok(Math.abs(pts[6] - 0.5) < 0.13, "slide spring half-way point")

assert.match(flat, /\.mm-ch\{[^}]*opacity:\.001;filter:blur\(5px\);transform:translateY\(30px\);transition:opacity 1s[^}]*calc\(\.1s \+ var\(--i,0\) \* 40ms\)/, "letters: blur 5, y 30, 1 s, 40 ms stagger after 0.1 s")
assert.match(flat, /\.mm-card\{--d:1\.1s;transform:perspective\(1200px\) translateY\(100px\) scale\(\.93\) rotateX\(-50deg\)\}/, "card reveal values")
assert.match(flat, /\.mm-tip\{[^}]*transform:perspective\(1200px\) translateY\(30px\) scale\(\.8\) rotateX\(-75deg\)/, "hero phone appear values")
assert.match(flat, /\.mm-rise\{transform:perspective\(1200px\) translateY\(250px\) scale\(\.8\) rotateX\(-45deg\)/, "contact phone appear values")
assert.match(flat, /\.mm-tilt\{--d:\.8s;--dl:\.5s;transform:scale\(\.7\) rotate\(-10deg\) rotateX\(40deg\)\}/, "glass appear values")
assert.match(flat, /@keyframes mm-rot\{to\{rotate:360deg\}\}/, "orbit keyframes")
assert.match(flat, /\.mm-spin\{[^}]*animation:mm-rot 20s linear infinite\}/, "orbit turns once every 20 s")

assert.deepEqual(M.heroSink(0), { y: 0, o: 1 })
assert.deepEqual(M.heroSink(69), { y: 0, o: 1 })
const s300 = M.heroSink(300)
assert.ok(Math.abs(s300.y - 81.39) < 0.05 && Math.abs(s300.o - 0.905) < 0.001, "sink at 300 px matches the reference")
assert.deepEqual(M.heroSink(99999), { y: 600, o: 0.30000000000000004 })

assert.equal(M.glassProgress(900), 0)
assert.equal(M.glassProgress(550), 0)
assert.equal(M.glassProgress(-5000), 1)
assert.ok(Math.abs(M.glassProgress(550 - 350) * 110 - 35.8) < 0.1, "drift matches the measured 0.102 px per px")
assert.deepEqual(M.GLASS_TO, [{ x: 10, y: 110, r: 0 }, { x: -50, y: 110, r: -12 }, { x: -10, y: 60, r: -23 }])

assert.equal(M.nearest([100, 400, 700], 450), 1)
assert.equal(M.recentre(3, 3), 3)
assert.equal(M.recentre(2, 3), 5, "a step before the middle copy hops forward a copy")
assert.equal(M.recentre(6, 3), 3, "a step past it hops back")
assert.equal(M.dragSteps(5, 600), 0, "a tap is not a drag")
assert.equal(M.dragSteps(-200, 600), 1, "dragging left goes forward")
assert.equal(M.dragSteps(700, 600), -1)
assert.equal(M.dragSteps(-1300, 600), 2)

console.log("murmur-voice-app-landing: ok")
