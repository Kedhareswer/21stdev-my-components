// Install-safety, layout and motion checks for components/fuzzy-gaze-footer.
// Run: node tests/fuzzy-gaze-footer.test.mjs
//
// The eye and mist maths live in the one published .tsx between `// #region gaze` and
// `// #endregion`; the test lifts that region out, strips the types and runs it, so the
// behaviour is tested as shipped.
import assert from "node:assert/strict"
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const slug = "fuzzy-gaze-footer"
const dir = new URL("../components/" + slug + "/", import.meta.url)
const src = readFileSync(new URL(slug + ".tsx", dir), "utf8").replace(/\r\n/g, "\n")
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")

// ---------- install safety ----------
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo.tsx", slug + ".tsx"].sort(), "folder holds only the publishable files")
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "the component needs nothing but React")
const ts = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")
assert.ok(ts.includes('"@/components/ui/' + slug + '": ["./components/' + slug + "/" + slug + '.tsx"]'), "tsconfig paths line")
assert.match(demo, /from "@\/components\/ui\/fuzzy-gaze-footer"/, "demo imports the installed path")
assert.match(src, /^"use client"/, "client component")
assert.match(src, /export default function FuzzyGazeFooter\(/, "default export, capitalised")
assert.doesNotMatch(src + demo, /\bh-full\b/, "no h-full")
assert.doesNotMatch(src + demo, /use(Ref|State|Memo|Callback|Reducer|Context)</, "no generic hook type arguments (they hang the 21st CLI)")
assert.ok(Buffer.byteLength(src) < 200_000, "component under 21st's 200 kB limit, " + Buffer.byteLength(src))
assert.ok(Buffer.byteLength(demo) < 200_000, "demo under 21st's 200 kB limit")

// the scoped CSS string
const cssAt = src.indexOf("const CSS =")
const css = src.slice(cssAt, src.indexOf("\n\n", cssAt))
assert.doesNotMatch(css, /`|\$\{|@import/, "no backticks, ${ or @import in the CSS string")
const flat = css.replace(/"\s*\+\s*\n\s*"/g, "").replace(/url\(data:[^)]*\)/g, "url(data:)")
let rules = 0
for (const m of flat.matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || sel.startsWith("const CSS")) continue
  rules++
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".fgf-")), "unscoped selector: " + sel)
}
assert.ok(rules >= 30, "the scope check saw real rules, saw " + rules)
const rule = (sel) => { const at = flat.indexOf(sel + "{"); return at < 0 ? "" : flat.slice(at, flat.indexOf("}", at) + 1) }

// height: the root takes a definite min-height from a prop; nothing in flow uses a percentage height
assert.match(src, /height = "100svh"/, "height defaults to a definite length")
assert.match(src, /minHeight: height,/, "the root's min-height comes from the prop")
assert.ok(rule(".fgf-root") && !/[^-]height:/.test(rule(".fgf-root")), "the root sets no height in CSS")
assert.match(rule(".fgf-in"), /min-height:inherit/, "the content column inherits that min-height instead of using 100%")
assert.deepEqual(
  [...flat.matchAll(/\.(fgf-[a-z-]+)\{[^}]*[;{]height:[^;}]*%/g)].map((m) => m[1]).sort(),
  ["fgf-art", "fgf-img", "fgf-pupil", "fgf-rim", "fgf-shade"],
  "percentage heights only on absolutely positioned art (they resolve against the positioned root, not a height chain)",
)
for (const sel of [".fgf-art", ".fgf-img", ".fgf-pupil", ".fgf-rim", ".fgf-shade"]) assert.match(rule(sel), /position:absolute/, sel + " is absolutely positioned")
assert.match(rule(".fgf-root"), /position:relative;isolation:isolate;overflow:hidden;container-type:inline-size/, "the root positions, clips and sizes its art")
assert.doesNotMatch(rule(".fgf-root"), /padding/, "no padding on the size container (cqw would stop meaning the footer's width)")
assert.match(rule(".fgf-img"), /max-width:none/, "the picture escapes Preflight's max-width")
assert.match(src, /style=\{\{ maxWidth: "none" \}\}/, "and says so inline too")
assert.match(src, /width=\{1536\}\s+height=\{1024\}/, "the picture carries its intrinsic size")

// colours and assets
for (const [, v] of src.matchAll(/var\((--[a-z0-9-]+)/g)) assert.ok(v.startsWith("--fgf-"), "only the footer's own custom properties: " + v)
assert.deepEqual(
  [...src.matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0]),
  ["https://kedhar-components.pages.dev/fuzzy-gaze-footer/"],
  "the only remote origin is the component site that hosts the creature",
)
for (const f of ["creature.webp", "creature-960.webp"]) {
  const file = new URL("../dev/public/" + slug + "/" + f, import.meta.url)
  assert.ok(existsSync(file) && statSync(file).size > 20_000, f + " is in dev/public for the site to serve")
  assert.ok(src.includes('"' + f + '"'), f + " is referenced")
}
assert.deepEqual([...demo.matchAll(/https?:\/\/[^"'\s)]+/g)].map((m) => m[0]), [], "the demo adds no origin")
assert.equal((flat.match(/@font-face\{[^}]*src:url\(data:\) format\('woff2'\)/g) || []).length, 3, "three embedded font subsets, none fetched")
assert.doesNotMatch(src + demo + readFileSync(new URL("README.md", dir), "utf8"), /oobi|pinterest|pinimg/i, "no identifiers from the reference")
assert.match(src, /email = "hello@example\.com"/, "placeholder email on a reserved domain")

// ---------- layout, as source ----------
assert.match(rule(".fgf-top"), /grid-template-columns:minmax\(0,1fr\) auto minmax\(0,1fr\)/, "wordmark centred between two equal sides")
assert.match(rule(".fgf-logo"), /justify-self:center/, "wordmark centred in its track")
assert.match(rule(".fgf-mail"), /align-self:center/, "email centred")
assert.match(rule(".fgf-art"), /transform:translate\(calc\(-50% \+ var\(--fgf-shift\) \* 100%\),calc\(var\(--fgf-crown\) \* -100%\)\)/, "the picture is centred on the eyes and hung from the head top")
assert.equal((flat.match(/\.fgf-art[^{]*\{[^}]*transform:/g) || []).length, 1, "that centring transform is never overridden by another state")
assert.match(rule(".fgf-art"), /height:min\(var\(--fgf-a\),calc\(\(100% - 96px - var\(--fgf-top\)\) \/ \(var\(--fgf-chin\) - var\(--fgf-crown\)\)\)\)/, "the picture shrinks before its eyes can reach the email")
assert.match(flat, /@container \(max-width:959px\)\{[^@]*\.fgf-gap\{min-height:calc\(var\(--fgf-a\) \* \(1 - var\(--fgf-crown\)\) - 30px\)\}/, "stacked: the links get the room above the head")
assert.match(flat, /@container \(max-width:599px\)/, "phone layout")
assert.match(rule(".fgf-eye"), /aspect-ratio:1;border-radius:50%;overflow:hidden/, "eyes are clipped circles laid out at their on-screen size")
assert.doesNotMatch(flat, /scale\((?!X\(0\)|X\(1\))/, "nothing is enlarged with transform: scale")
assert.doesNotMatch(flat, /will-change/, "no will-change")

// ---------- behaviour, as source ----------
assert.equal((src.match(/window\.matchMedia\("\(prefers-reduced-motion: reduce\)"\)\.matches\) return/g) || []).length, 2, "both effects stand down under reduced motion")
assert.match(flat, /@media \(prefers-reduced-motion:reduce\)\{\.fgf-link,\.fgf-link::after,\.fgf-mail::after,\.fgf-eye\{transition:none\}\}/, "CSS honours reduced motion")
assert.match(rule(".fgf-eye"), /--fgf-lid:47%/, "without script the eyes rest half-lidded, not shut or blank")
assert.match(rule(".fgf-pupil"), /left:26\.5%;top:26\.5%;width:47%;height:47%/, "the pupil is laid out at the size the gaze maths assumes")
assert.match(src, /pupil: 0\.47,/, "and the two agree")
assert.match(rule(".fgf-ball"), /clip-path:circle\(160% at 50% calc\(var\(--fgf-lid\) \+ 160%\)\)/, "the open eye is clipped at a curved lid line, so the lid is the picture itself")
assert.match(flat, /\.fgf-art\[data-ready\] \.fgf-eye\{opacity:1\}/, "eyes appear only once the picture has loaded")
assert.match(src, /if \(img && img\.complete && img\.naturalWidth > 0\) setReady\(true\)/, "a cached picture still shows its eyes")
assert.match(src, /window\.addEventListener\("pointermove", onMove, \{ passive: true \}\)/, "pointer tracking is passive")
assert.match(src, /if \(!onScreen \|\| document\.hidden\) return/, "the eye loop stops off screen and in a hidden tab")
assert.match(src, /const k = 1 - Math\.exp\(-dt \/ GAZE\.ease\)/, "the gaze is eased, not locked to the pointer")
assert.match(src, /io\.disconnect\(\)/, "the observer is cleaned up")
assert.equal((src.match(/cancelAnimationFrame\(raf\)/g) || []).length, 2, "both loops are cancelled on unmount")
for (const ev of ["pointermove", "pointerdown", "visibilitychange", "pointerenter", "focus"]) assert.ok(src.includes('removeEventListener("' + ev + '"'), ev + " listener removed")
assert.match(src, /if \(amount <= 0\.001\) \{[\s\S]*?word\.style\.filter = ""/, "the wordmark is plain, unfiltered text at rest")
assert.match(src, /raf = amount > 0 \|\| goal === 1 \? requestAnimationFrame\(frame\) : 0/, "the mist loop stops when the word has re-formed")
assert.match(src, /link\.addEventListener\("focus", start\)/, "keyboard focus mists the wordmark too")
assert.match(src, /className="fgf-art"\s+aria-hidden="true"/, "the creature is decorative")
assert.match(src, /alt=""/, "empty alt on the decorative picture")
assert.match(src, /href=\{"mailto:" \+ email\}/, "the email is a mailto link")
assert.match(src, /aria-label=\{wordmark\}/, "the wordmark link is named")
assert.match(flat, /@media \(hover:hover\)\{\.fgf-link:hover,\.fgf-mail:hover\{color:#fff\}/, "hover styles only where hover exists")
assert.match(flat, /\.fgf-link:focus-visible,\.fgf-mail:focus-visible\{outline:2px solid #fff/, "visible focus ring")
assert.match(flat, /transform:scaleX\(0\);transform-origin:100% 50%;transition:transform \.32s/, "underlines leave to the right")
assert.match(flat, /:hover::after\{transform:scaleX\(1\);transform-origin:0 50%\}/, "and enter from the left")

// ---------- the eye and mist maths, as shipped ----------
const start = src.indexOf("// #region gaze"), end = src.indexOf("// #endregion", start)
assert.ok(start > -1 && end > start, "gaze region markers")
const code = stripTypeScriptTypes(src.slice(start, end)) + "\nexport { GAZE, MIST, gazeFor, pupilPose, lidFor, blinkAt, mistAt, eyeShift, eyeFloor }"
const g = await import("data:text/javascript," + encodeURIComponent(code))
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, msg + ": " + a + " vs " + b)

// gaze: a unit-bounded pull toward the target that grows with distance
assert.deepEqual(g.gazeFor(0, 0, 200), { x: 0, y: 0 }, "no target offset, no gaze")
assert.deepEqual(g.gazeFor(50, 50, 0), { x: 0, y: 0 }, "an unlaid-out eye does not divide by zero")
let last = 0
for (const dist of [10, 50, 150, 400, 1000, 5000]) {
  const v = g.gazeFor(dist, 0, 200)
  assert.ok(v.x > last && v.x <= 1 && v.y === 0, "pull grows with distance and stays within 1")
  last = v.x
}
near(Math.atan2(g.gazeFor(-300, 400, 200).y, g.gazeFor(-300, 400, 200).x), Math.atan2(400, -300), 1e-9, "gaze points at the target")
assert.ok(g.gazeFor(280, 0, 200).x > 0.6 && g.gazeFor(280, 0, 200).x < 0.66, "about two thirds of full turn at 1.4 eye-widths")

// pupil: never leaves the eye, flattens toward the rim, stays visible when looking up
const R = 50 / g.GAZE.pupil // eye radius in percent of the pupil's size
for (let a = 0; a < 360; a += 5) for (const m of [0, 0.3, 0.7, 1, 3]) {
  const gx = Math.cos((a * Math.PI) / 180) * m, gy = Math.sin((a * Math.PI) / 180) * m
  const p = g.pupilPose(gx, gy)
  const off = Math.hypot(p.x, p.y)
  assert.ok(p.squash > 0.6 && p.squash <= 1, "squash stays sane: " + p.squash)
  assert.ok(off + 50 * p.squash <= R + 1e-6, "pupil's far edge stays inside the eye at " + a + "° x" + m + ": " + (off + 50 * p.squash) + " of " + R)
  if (m > 1) { const one = g.pupilPose(gx / m, gy / m); near(p.x, one.x, 1e-9, "gaze beyond 1 is clamped"); near(p.y, one.y, 1e-9, "gaze beyond 1 is clamped") }
}
assert.deepEqual(g.pupilPose(0, 0), { x: 0, y: 0, angle: 0, squash: 1 }, "straight ahead: a round, centred pupil")
assert.ok(g.pupilPose(1, 0).squash < 0.65 && g.pupilPose(1, 0).x > 70, "looking sideways slides to the rim and flattens")
near(g.pupilPose(1, 0).x, -g.pupilPose(-1, 0).x, 1e-9, "left and right mirror")
{
  // looking straight up: the lid line sits at (2 * lid - 1) eye radii from the centre; at least 40 % of the pupil must show below it
  const p = g.pupilPose(0, -1), lid = g.lidFor(-1, 0)
  const lidLine = (2 * lid - 1) * R, bottom = p.y + 50, top = p.y - 50
  const showing = (bottom - lidLine) / (bottom - top)
  assert.ok(showing > 0.4 && showing < 0.7, "looking up tucks the pupil under the lid but leaves about half showing: " + showing.toFixed(2))
  assert.ok(Math.abs(p.y) < Math.abs(g.pupilPose(0, 1).y) * 0.2, "upward travel is a fraction of downward travel")
}

// lid: opens looking down, droops a touch looking up, shuts past the bottom on a blink
near(g.lidFor(0, 0), 0.47, 1e-9, "resting lid")
assert.ok(g.lidFor(1, 0) < g.lidFor(0, 0) && g.lidFor(-1, 0) > g.lidFor(0, 0), "lid follows the gaze")
assert.ok(g.lidFor(5, 0) >= 0.36 && g.lidFor(-5, 0) <= 0.5, "lid follow is clamped")
for (const gy of [-1, 0, 1]) { assert.ok(g.lidFor(gy, 1) >= 1.03, "a shut lid carries its rim out of the eye"); assert.ok(g.lidFor(gy, 0.5) > g.lidFor(gy, 0) && g.lidFor(gy, 0.5) < g.lidFor(gy, 1), "blink is monotonic") }

// blink: 80 ms down, 40 ms shut, 150 ms up, no jumps
assert.equal(g.blinkAt(0), 0); assert.equal(g.blinkAt(-50), 0); assert.equal(g.blinkAt(270), 0); assert.equal(g.blinkAt(900), 0)
assert.equal(g.blinkAt(80), 1); assert.equal(g.blinkAt(100), 1); near(g.blinkAt(40), 0.5, 1e-9, "half shut at 40 ms")
for (let t = 0; t <= 270; t += 4) assert.ok(Math.abs(g.blinkAt(t + 4) - g.blinkAt(t)) < 0.12, "blink has no jump at " + t + " ms")

// mist: nothing at 0, a faint grainy cloud at 1, monotonic between, scaled to the font size
assert.deepEqual(g.mistAt(0, 76), { push: 0, blur: 0, k1: 0, k2: 1, opacity: 1 }, "amount 0 is the untouched word")
{
  const full = g.mistAt(1, 76)
  assert.ok(full.k2 < 0.1 && full.k1 > 1.5 && full.opacity >= 0.45 && full.opacity <= 0.6 && full.blur > 4 && full.push > 20, "amount 1 is mostly grain, soft and displaced")
  near(g.mistAt(1, 38).push, full.push / 2, 1e-9, "push scales with the font size"); near(g.mistAt(1, 38).blur, full.blur / 2, 1e-9, "blur scales with the font size")
  assert.deepEqual(g.mistAt(4, 76), full, "amount is clamped"); assert.deepEqual(g.mistAt(-1, 76), g.mistAt(0, 76), "amount is clamped below")
  let prev = g.mistAt(0, 76)
  for (let a = 0.05; a <= 1.0001; a += 0.05) { const m = g.mistAt(a, 76); assert.ok(m.push >= prev.push && m.blur >= prev.blur && m.k2 <= prev.k2 && m.opacity <= prev.opacity, "mist deepens steadily"); prev = m }
}
assert.deepEqual(g.MIST, { rise: 500, hold: 1300, fall: 600 }, "mist timing: 0.5 s out, held 1.3 s from the last hover, 0.6 s back")

// picture placement from the eyes
const eyes = [...src.matchAll(/\{ x: ([\d.]+), y: ([\d.]+), r: ([\d.]+) \}/g)].map((m) => ({ x: +m[1], y: +m[2], r: +m[3] }))
assert.equal(eyes.length, 2, "two default eyes")
near(g.eyeShift(eyes), 0.5 - (eyes[0].x + eyes[1].x) / 2, 1e-5, "the picture slides so the eyes straddle the centre line")
assert.equal(g.eyeShift([]), 0, "no eyes, no shift")
near(g.eyeFloor(eyes, 0.161), eyes[0].y + eyes[0].r * 1.5, 1e-4, "the eyes' lowest point, in picture heights")
assert.ok(g.eyeFloor([], 0.161) > 0.161, "no eyes still gives a usable divisor")
near(eyes[0].y, eyes[1].y, 1e-9, "eyes level"); near(eyes[0].r, eyes[1].r, 1e-9, "eyes equal")

console.log("fuzzy-gaze-footer: all checks passed")
