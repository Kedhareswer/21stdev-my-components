// Install-safety and logic checks for components/long-exposure-agency-template.
// Run: node tests/long-exposure-agency-template.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const SLUG = "long-exposure-agency-template"
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
assert.deepEqual(imports, ["react"], "react is the only import")
assert.doesNotMatch(src, /@import|@font-face|<link\b|<img\b|fetch\(|new Image\(/, "nothing loads at runtime")
assert.doesNotMatch(src, /https?:\/\//, "no external URLs")
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.match(src, /minHeight: height/, "the height prop reaches the root")
assert.doesNotMatch(src, /\bh-full\b/, "no percentage height on the root")
assert.doesNotMatch(src, /use(State|Ref|Memo|Callback|Effect)</, "hooks are typed without <generics>, so the 21st CLI tokenizer stays linear")
assert.doesNotMatch(src, /(Pointer|Mouse|Keyboard|Form|Change)Event</, "events are typed without <generics>")
assert.doesNotMatch(src, /location\.hash|history\.(push|replace)State/, "the host's URL is untouched")
assert.match(src, /if \(t\.kind === "external"\) return\n\s+e\?\.preventDefault\(\)/, "in-template links never navigate the host")

const css = src.match(/const LX_CSS = `([\s\S]*?)`/)
assert.ok(css, "CSS block present")
assert.doesNotMatch(css[1], /\$\{|`/, "no interpolation inside the CSS string")
assert.doesNotMatch(css[1], /url\(/, "no url() in the style block")
assert.ok(css[1].includes("prefers-reduced-motion:reduce"), "honours reduced motion")
let rules = 0
for (const m of css[1].replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(?<=^|[{}])\s*([^{}@]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (/^(from|to|[\d.,%\s]+)$/.test(sel)) continue
  rules++
  for (const s of sel.split(/,(?![^(]*\))/)) assert.match(s.trim(), /^\.lx-/, `selector escapes the component: ${s.trim()}`)
}
assert.ok(rules > 150, `scope check saw ${rules} rules`)
assert.match(css[1], /\.lx-root :where\(button\)\{/, "base resets carry no specificity")
assert.match(css[1], /\.lx-root :where\(svg,canvas\)\{display:block;max-width:none\}/, "media guarded against Preflight")
assert.match(css[1], /\.lx-frame\{[^}]*container-type:inline-size/, "the layout follows the template's own width")
assert.match(css[1], /\.lx-cases\{grid-template-columns:minmax\(0,1fr\)\}/, "one-column cards can shrink below their content")
assert.match(css[1], /\.lx-svc-t small>span\{min-height:0;overflow:hidden\}/, "closed service tabs collapse their description")

/* ---------- one shared WebGL context ---------- */

assert.equal((src.match(/getContext\("webgl2"/g) ?? []).length, 1, "every picture shares one context")
assert.match(src, /if \(glState && !glState\.gl\.isContextLost\(\)\) return glState/, "a lost context is rebuilt")
assert.match(src, /ctx\.drawImage\(canvas, 0, MAX_H - h, w, h, 0, 0, w, h\)/, "copies the bottom-left GL region to the top-left 2D origin")
assert.match(src, /setFailed\(true\)/, "no WebGL2 → the CSS gradient stays")
assert.match(src, /background: mode === 1 \? "#0d0f11" : fieldBackground\(f\.colors\)/, "every picture has a gradient underneath")
assert.match(src, /new IntersectionObserver\(\n\s+\(\[e\]\) => \{\n\s+visible = e\.isIntersecting/, "pictures sleep offscreen")
const frag = src.match(/const FRAG = `([\s\S]*?)`/)
assert.ok(frag && !frag[1].includes("${"), "shader has no interpolation")
assert.match(frag[1], /col=clamp\(col\/\(1\.0\+0\.15\*col\),0\.0,1\.0\);\n\s+col=mix\(col,col\*col\*\(3\.0-2\.0\*col\)/, "the contrast curve only sees 0..1 (no inverted channels)")

/* ---------- the interactions are wired ---------- */

assert.match(src, /role="tablist" aria-label="Services"/, "services are tabs")
assert.match(src, /aria-expanded=\{on\} aria-controls=/, "FAQ questions are disclosure buttons")
assert.match(src, /role="dialog" aria-modal="true"/, "booking is a modal dialog")
assert.match(src, /if \(e\.key === "Escape"\) onClose\(\)/, "Escape closes the dialog")
assert.match(src, /const res = onBook \? await onBook\(booking\)/, "booking hands over the form")
assert.match(src, /setStatus\(res === false \? "error" : "done"\)/, "false from onBook shows an error")
assert.match(src, /setShown\(\(n\) => n \+ pageSize\)/, "Load more pages the grid")
assert.match(src, /aria-label="Back to case studies"/, "case page has a back button")
assert.match(src, /aria-label=\{"Next case study: " \+ next\.name\}/, "case page has a next button")
assert.match(src, /if \(h\.dataset\.rv === "1"\) return/, "reveal re-observes what an earlier StrictMode run hid")
assert.match(src, /data-theme=\{theme\}/, "the theme is scoped to the root")
assert.match(src, /classList\.contains\("dark"\)/, "system theme follows the host's .dark class")
assert.ok(read("demo.tsx").includes("<LongExposureAgencyTemplate />"), "default demo is the component, full bleed")
assert.doesNotMatch(read("demo.tsx"), /<div/, "default demo has no wrapper")

/* ---------- logic, executed ---------- */

const L = await import(
  "data:text/javascript," +
    encodeURIComponent(
      stripTypeScriptTypes(region("logic")) +
        "\nexport { clamp, isEmail, countValue, formatStat, hashStr, hexToRgb, FIELDS, resolveField, parseTarget, nextIndex, nextWeekdays, dayKey, slotTaken, stepAt }\n",
    )
)

assert.ok(L.isEmail("a@b.co") && !L.isEmail("a@b") && !L.isEmail("a b@c.co"))
assert.equal(L.countValue(64, 0), 0)
assert.equal(L.countValue(64, 1), 64)
assert.equal(L.countValue(4.8, 1, 1), 4.8)
assert.equal(L.formatStat(1200), "1,200")
assert.equal(L.formatStat(99.7, 1), "99.7")
assert.deepEqual(L.hexToRgb("#ff0000"), [1, 0, 0])
assert.deepEqual(L.hexToRgb("#0f0"), [0, 1, 0])
assert.deepEqual(L.hexToRgb("tomato", [0.5, 0.5, 0.5]), [0.5, 0.5, 0.5], "non-hex falls back")
assert.equal(L.hashStr("abc"), L.hashStr("abc"))
assert.notEqual(L.hashStr("abc"), L.hashStr("abd"))

for (const [name, f] of Object.entries(L.FIELDS)) {
  assert.equal(f.colors.length, 5, `${name} has five stops`)
  for (const c of f.colors) assert.match(c, /^#[0-9a-f]{6}$/, `${name}: ${c}`)
}
const ember = L.resolveField("ember", "x")
assert.deepEqual(ember.colors, L.FIELDS.ember.colors)
assert.deepEqual(L.resolveField(undefined, "same"), L.resolveField(undefined, "same"), "no field → a stable preset per salt")
const custom = L.resolveField({ colors: ["#000000", "#111111", "#222222", "#333333", "#444444"], seed: 2, angle: 0.4 }, "x")
assert.equal(custom.seed, 2)
assert.equal(custom.angle, 0.4)

const ids = ["corvane", "kintsu"]
assert.deepEqual(L.parseTarget(undefined, ids), { kind: "none" })
assert.deepEqual(L.parseTarget("#", ids), { kind: "none" })
assert.deepEqual(L.parseTarget("https://example.com", ids), { kind: "external" })
assert.deepEqual(L.parseTarget("/about", ids), { kind: "external" })
assert.deepEqual(L.parseTarget("#book", ids), { kind: "book" })
assert.deepEqual(L.parseTarget("#cases", ids), { kind: "page", page: { name: "cases" } })
assert.deepEqual(L.parseTarget("#home", ids), { kind: "page", page: { name: "home" } })
assert.deepEqual(L.parseTarget("#case:kintsu", ids), { kind: "page", page: { name: "case", id: "kintsu" } })
assert.deepEqual(L.parseTarget("#case:nope", ids), { kind: "page", page: { name: "404" } })
assert.deepEqual(L.parseTarget("#services", ids), { kind: "page", page: { name: "home" }, section: "services" })
assert.deepEqual(L.parseTarget("#pricing", ids), { kind: "page", page: { name: "404" } }, "unknown anchors land on the 404 page")

assert.equal(L.nextIndex(3, 1, 4), 0, "wraps forward")
assert.equal(L.nextIndex(0, -1, 4), 3, "wraps back")
assert.equal(L.nextIndex(0, 1, 0), 0)

// Friday → Mon..Fri of next week; never a weekend, never today
const days = L.nextWeekdays(new Date(2026, 9, 9), 5)
assert.deepEqual(days.map(L.dayKey), ["2026-10-12", "2026-10-13", "2026-10-14", "2026-10-15", "2026-10-16"])
for (const d of L.nextWeekdays(new Date(2026, 9, 7), 10)) assert.ok(d.getDay() !== 0 && d.getDay() !== 6)
assert.equal(L.slotTaken("2026-10-12", "09:30"), L.slotTaken("2026-10-12", "09:30"), "the calendar is stable")
let taken = 0
for (let i = 1; i <= 28; i++) for (const t of ["09:30", "11:00", "14:00", "16:30"]) taken += L.slotTaken("2026-11-" + String(i).padStart(2, "0"), t) ? 1 : 0
assert.ok(taken > 10 && taken < 50, `about a quarter of slots taken (${taken}/112)`)

const spans = [[1, 1], [2, 10], [11, 35], [36, 45]]
assert.equal(L.stepAt(spans, 1), 0)
assert.equal(L.stepAt(spans, 10), 1)
assert.equal(L.stepAt(spans, 20), 2)
assert.equal(L.stepAt(spans, 45), 3)
assert.equal(L.stepAt(spans, 99), 3, "past the end stays on the last step")

console.log("long-exposure-agency-template: ok")
