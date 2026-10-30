// Install-safety and logic checks for components/summit-teams-template.
// Run: node tests/summit-teams-template.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const SLUG = "summit-teams-template"
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
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.match(src, /"--stt-h": height/, "the height prop reaches the root")
assert.match(src, /\.stt-root\{[^}]*min-height:var\(--stt-h\)/, "the root has a definite floor")
assert.match(src, /\.stt-hero\{[^}]*height:max\(var\(--stt-h\),660px\)/, "the hero has a definite height")
assert.match(src, /\.stt-hero-frame\{[^}]*height:calc\(max\(var\(--stt-h\),660px\) - 24px\)/, "and so does its frame")
assert.match(src, /\.stt-app\{[^}]*height:600px/, "the app preview has a definite height")
assert.match(src, /\.stt-how-visual\{[^}]*min-height:440px/, "the step visual has a definite floor")
assert.match(src, /\.stt-cta-card\{[^}]*min-height:460px/, "the CTA card has a definite floor")
assert.match(src, /\.stt-footer\{[^}]*min-height:max\(calc\(var\(--stt-h\) \* \.9\),620px\)/, "the footer has a definite floor")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
for (const m of src.matchAll(/([.\w>*\s,:()\[\]="-]+)\{[^}]*\bheight:100%/g)) assert.match(m[0], /position:absolute|inset:0/, `a percentage height only on absolutely placed layers: ${m[1].trim()}`)
assert.match(src, /style=\{\{ objectPosition: photo\.focus \|\| "50% 50%", maxWidth: "none" \}\}/, "photos are guarded against Preflight inline too")
assert.match(src, /\.stt-range\{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;max-width:none/, "the painted range covers its layer")
assert.match(src, /const needRange = !photo \|\| state === "error" \|\| \(waited && state !== "ready"\)/, "the range is painted only when the photograph is missing or slow")
assert.match(src, /while \(y < H && performance\.now\(\) - t0 < 10\)/, "and painted in slices that never block a frame")
assert.match(src, /const RANGE_JOBS = \{\}/, "once per tone and seed, shared across instances")
assert.match(src, /React\.useId\(\)\.replace/, "ids are namespaced per instance")
const head = src.slice(0, src.indexOf("</"))
assert.doesNotMatch(head, /use(State|Ref|Memo|Callback)<|Partial<|Required<|Record<|Array<|Map<|Promise<|NonNullable<|React\.[A-Za-z]+<|\[K in /, "no generics before the first JSX close tag (21st CLI tokenizer)")
assert.doesNotMatch(src, /use(State|Ref|Memo|Callback)</, "hooks are typed without <generics>")
assert.match(src, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/, "reduced motion is read in JS")
assert.doesNotMatch(src, /[—–]/, "no em or en dashes anywhere")
assert.doesNotMatch(src, />[^<{]*\\u[0-9a-f]{4}/i, "no \\u escapes inside JSX text")

const css = src.match(/const STT_CSS = `([\s\S]*?)`/)
assert.ok(css, "CSS block present")
assert.doesNotMatch(css[1], /\$\{|`/, "no interpolation inside the CSS string")
assert.doesNotMatch(css[1], /url\(/, "no url() in the style block")
assert.ok(css[1].includes("prefers-reduced-motion:reduce"), "honours reduced motion in CSS")
for (const m of css[1].replace(/\/\*[\s\S]*?\*\//g, "").replace(/@media[^{]*\{/g, "").replace(/@keyframes[^{]*\{/g, "").matchAll(/(?<=^|[{}])\s*([^{}@]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (/^(from|to|[\d.,%\s]+)$/.test(sel)) continue
  for (const s of sel.split(/,(?![^(]*\))/)) assert.match(s.trim(), /^\.stt-/, `selector escapes the component: ${s.trim()}`)
}
assert.match(css[1], /\.stt-root :where\(svg,canvas,img\)\{display:block;max-width:none\}/, "media are guarded against Preflight")
assert.match(css[1], /\.stt-root\{[^}]*overflow-x:clip/, "the root clips sideways without breaking the sticky nav")
assert.doesNotMatch(css[1], /\.stt-root\{[^}]*overflow:hidden/, "overflow:hidden on the root would break position:sticky")
assert.match(css[1], /\.stt-navwrap\{position:sticky;top:0;z-index:60;height:0\}/, "the nav sticks without taking room")
assert.match(css[1], /\.stt-photo-img\{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;max-width:none/, "photos cover their layer")
assert.match(css[1], /\.stt-root\[data-motion="reduced"\] \.stt-logos-track/, "reduced motion stops the marquees")
assert.match(css[1], /@media \(max-width:760px\)\{/, "a designed phone layout")
assert.match(css[1], /@media \(max-width:1024px\)\{/, "and a tablet one")
assert.match(css[1], /:focus-visible\{outline:2px solid var\(--stt-accent\)/, "visible keyboard focus")

/* ---------- motion that cleans up after itself ---------- */

assert.match(src, /gsap\.registerPlugin\(ScrollTrigger\)/)
assert.match(src, /const ctx = gsap\.context\(\(\) => \{/, "page motion lives in contexts")
assert.match(src, /ctx2\.revert\(\)\n\s+ctx\.revert\(\)/, "both are reverted on unmount")
assert.match(src, /function findScroller\(/, "it scrolls with whatever scrolls the host, not just the window")
assert.match(src, /new ResizeObserver\(/, "late layout changes re-measure the triggers")
assert.match(src, /clipPath: "inset\(70px 48px 0px 48px round 44px\)"/, "the hero frame morphs closed on scroll")
assert.match(src, /rotateX: 24, scale: 0\.86/, "the app tilts up into place")
assert.match(src, /attr: \{ d: \(i: number\) => \(i \? paths\.area : paths\.line\) \}/, "the chart morphs between ranges")
assert.match(src, /gsap\.fromTo\(el, \{ x: dx, y: dy \}/, "deals FLIP into their new column")
assert.match(src, /attr: \{ textLength: 1560 \}/, "the footer wordmark spreads on scroll")
assert.match(src, /if \(!R && hero\) \{/, "hero motion only runs without reduced motion")
assert.match(src, /\.stt-step-progress\{[^}]*animation:stt-fill linear forwards/, "steps advance on a CSS progress line")
assert.match(src, /animationPlayState: playing \? "running" : "paused"/, "which pauses off screen and on hover")

/* ---------- it behaves like a real landing page ---------- */

assert.match(src, /<main>/, "a main landmark")
assert.match(src, /<footer className="stt-footer"/, "a footer")
assert.match(src, /aria-labelledby=\{uid \+ "-title"\}/, "the hero is labelled by its headline")
assert.match(src, /role="tablist" aria-label="Features"/, "feature tabs are a tablist")
assert.match(src, /e\.key !== "ArrowRight" && e\.key !== "ArrowLeft"/, "with arrow-key navigation")
assert.match(src, /role="dialog" aria-modal="true"/, "the waitlist is a modal dialog")
assert.match(src, /e\.key === "Escape" && onClose\(\)/, "that closes on Escape")
assert.match(src, /role="switch" aria-checked=\{on\}/, "toggles are switches")
assert.match(src, /if \(onSelect\) onSelect\(p, billing\)/, "onSelectPlan gets the plan and billing")
assert.match(src, /onJoin\(email\.trim\(\)\)/, "onJoin gets the email")
assert.ok(read("demo.tsx").includes("<SummitTeamsTemplate />"), "default demo is the component, full bleed")
assert.doesNotMatch(read("demo.tsx"), /<div/, "default demo has no wrapper")
for (const demo of ["demo.tsx", "demo-glacier.tsx"]) {
  const d = read(demo)
  assert.doesNotMatch(d, /[—–]/, `${demo}: no dashes`)
  assert.deepEqual([...d.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1]), ["@/components/ui/" + SLUG], `${demo} imports only the component`)
  for (const m of d.matchAll(/https?:\/\/([^/"'\s]+)/g)) assert.equal(m[1], "images.unsplash.com", `${demo}: unexpected host ${m[1]}`)
}

/* ---------- logic, executed ---------- */

const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(region("logic") + region("content"))))

// the painted range: deterministic, opaque, and shaped like a landscape
const R = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(region("range"))))
const paint = (tone, seed, W = 96, H = 60) => {
  const buf = new Uint8ClampedArray(W * H * 4)
  R.paintRows(R.planRange(W, H, R.RANGE_TONES[tone], seed), buf, 0, H)
  return buf
}
for (const tone of Object.keys(R.RANGE_TONES)) {
  const a1 = paint(tone, 3)
  assert.deepEqual(a1, paint(tone, 3), tone + ": same seed, same picture")
  for (let i = 3; i < a1.length; i += 4) assert.equal(a1[i], 255, tone + ": fully opaque")
}
assert.notDeepEqual(paint("golden", 3), paint("golden", 4), "another seed, another range")
const lum = (buf, W, x, y) => { const o = (y * W + x) * 4; return buf[o] * 0.3 + buf[o + 1] * 0.59 + buf[o + 2] * 0.11 }
const g = paint("golden", 2, 160, 100)
let top = 0, low = 0
for (let x = 0; x < 160; x++) { top += lum(g, 160, x, 2); low += lum(g, 160, x, 97) }
assert.ok(top / 160 < 170, "the sky darkens toward the zenith")
assert.ok(low < top, "the foreground is darker than the sky")
const plan = R.planRange(200, 120, R.RANGE_TONES.golden, 2)
assert.equal(plan.ridges.length, 6, "six layers from far range to foreground")
for (let i = 1; i < plan.bases.length - 1; i++) {
  const mean = (arr) => arr.reduce((s, v) => s + v, 0) / arr.length
  assert.ok(mean(plan.bases[i]) > mean(plan.bases[i - 1]), "nearer layers sit lower")
}
const fg = plan.bases[plan.bases.length - 1]
assert.ok(fg[100] > fg[5] && fg[100] > fg[195], "the foreground opens into a valley in the middle")
const out = [0, 0, 0]
R.shadePixel(plan, 100, 115, 5, out)
const water = [...out]
assert.ok(water.every((c) => c >= 0 && c <= 255), "the lake shades to real colours")

// pricing
assert.deepEqual(L.priceFor(10, "monthly", 0.2), { perMonth: 10, billed: 10 })
assert.deepEqual(L.priceFor(10, "yearly", 0.2), { perMonth: 8, billed: 96 })
assert.deepEqual(L.priceFor(39, "yearly", 0.2), { perMonth: 31.2, billed: 374.4 })
assert.equal(L.formatMoney(8), "8")
assert.equal(L.formatMoney(31.2), "31.20")
assert.equal(L.compactMoney(48000), "$48k")
assert.equal(L.compactMoney(12500), "$12.5k")
assert.equal(L.compactMoney(1200000), "$1.2M")
assert.equal(L.compactMoney(950), "$950")

// forms and filters
assert.ok(L.isEmail("me@team.co"))
assert.ok(L.isEmail("  nora.vale@fernhall.com "))
for (const bad of ["", "nope", "a@b", "a@b.c", "a b@c.com"]) assert.ok(!L.isEmail(bad), "rejects " + JSON.stringify(bad))
assert.equal(L.initials("Mitchell Saint"), "MS")
assert.equal(L.initials("priya"), "P")
assert.equal(L.initials("  "), "?")
assert.equal(L.filterUsers(L.DEFAULT_USERS, "", "All").length, L.DEFAULT_USERS.length)
assert.ok(L.filterUsers(L.DEFAULT_USERS, "", "Admin").every((u) => u.role === "Admin"))
assert.deepEqual(L.filterUsers(L.DEFAULT_USERS, "LENA", "All").map((u) => u.name), ["Lena Rodriguez"], "search is case-insensitive")
assert.equal(L.filterUsers(L.DEFAULT_USERS, "nexora.co", "Manager").length, 2, "search matches emails and respects the role")
assert.equal(L.todoSummary(L.DEFAULT_USERS[0].todos), "3 Pending, 1 completed")
assert.equal(L.todoSummary([]), "0 Pending, 0 completed")

// pipeline
const moved = L.advanceDeal(L.DEFAULT_DEALS, "d2", 4)
assert.equal(moved.find((d) => d.id === "d2").stage, 1, "a deal moves one stage")
assert.equal(L.DEFAULT_DEALS.find((d) => d.id === "d2").stage, 0, "without mutating the input")
assert.equal(L.advanceDeal(L.DEFAULT_DEALS, "d4", 4).find((d) => d.id === "d4").stage, 3, "won deals stay won")
assert.equal(L.stageTotal(L.DEFAULT_DEALS, 3), 31000)

// chart: equal-length series share a command structure, so they can morph
const a = L.areaPath([1, 3, 2, 5], 100, 50)
const b = L.areaPath([4, 1, 6, 2], 100, 50)
assert.equal(a.line.replace(/[\d.-]+/g, "#"), b.line.replace(/[\d.-]+/g, "#"), "same shape of path for equal lengths")
assert.match(a.area, / L100,50 L0,50 Z$/, "the area closes to the floor")
assert.equal(a.points.length, 4)
assert.ok(a.points.every(([x, y]) => x >= 0 && x <= 100 && y >= 0 && y <= 50))
for (const r of L.DEFAULT_ACTIVITY.ranges) assert.equal(r.values.length, L.DEFAULT_ACTIVITY.ranges[0].values.length, "every range has the same number of points")

// prayer flags hang along their string
const fs = L.flagString(0, 0, 100, 0, 40, 5)
assert.equal(fs.flags.length, 5)
assert.ok(fs.flags[2].y > fs.flags[0].y, "the string sags in the middle")
assert.ok(Math.abs(fs.flags[2].angle) < 1e-9, "and is level at its lowest point")
assert.ok(fs.flags[0].angle > 0 && fs.flags[4].angle < 0, "and slopes down then up")
assert.equal(L.FLAG_COLORS.length, 5, "the five traditional colours")

// default content
for (const p of [L.DEFAULT_HERO.photo, L.DEFAULT_HOW.photo, L.DEFAULT_FEATURES.photo, L.DEFAULT_PRICING.ribbonPhoto, L.DEFAULT_TESTIMONIALS_PHOTO, L.DEFAULT_CTA.photo, L.DEFAULT_FOOTER.photo]) {
  assert.match(p.src, /^https:\/\/images\.unsplash\.com\/photo-\d+-[0-9a-f]{12}\?auto=format&fit=crop&w=\d+&q=80$/, "Unsplash URL " + p.src)
  assert.ok(p.alt && p.alt.length > 10, "alt for " + p.src)
}
assert.equal(L.DEFAULT_PLANS.filter((p) => p.featured).length, 1, "one recommended plan")
assert.equal(L.DEFAULT_TABS.length, 4)
assert.deepEqual(L.DEFAULT_TABS.map((t) => t.view), ["users", "activity", "pipeline", "access"])
assert.equal(L.DEFAULT_STEPS.length, 4)
assert.ok(L.DEFAULT_ACCESS.permissions.every((p) => p.grants.length === L.DEFAULT_ACCESS.roles.length), "a grant per role")
assert.equal(new Set(L.DEFAULT_USERS.map((u) => u.id)).size, L.DEFAULT_USERS.length, "user ids are unique")

console.log("summit-teams-template: ok")
