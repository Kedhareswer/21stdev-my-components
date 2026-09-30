// Install-safety and logic checks for components/pocket-portfolio.
// Run: node tests/pocket-portfolio.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const SLUG = "pocket-portfolio"
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
assert.doesNotMatch(src, /https?:\/\//, "no external URL — every default asset is drawn")
assert.doesNotMatch(src, /@import|@font-face|<link\b|fetch\(|new Image\(/, "nothing loads at runtime")
assert.ok(src.includes('minHeight = "100svh"'), "min height defaults to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.match(src, /React\.useId\(\)\.replace/, "svg ids are namespaced per instance")
assert.doesNotMatch(src, /url\(#[a-z]/, "gradient/clip references are built from the instance id")
assert.ok(src.includes("prefers-reduced-motion:reduce"), "honours reduced motion")
for (const m of src.matchAll(/<img\b[^>]*>/g)) assert.match(m[0], /maxWidth: "none"/, "img guarded against Preflight")
for (const m of src.matchAll(/<img\b[^>]*>/g)) assert.match(m[0], /width=\{\d+\} height=\{\d+\}/, "img has explicit size")

const css = src.match(/const PPF_CSS = `([\s\S]*?)`/)
assert.ok(css, "CSS block present")
assert.doesNotMatch(css[1], /\$\{|`/, "no interpolation inside the CSS string")
assert.doesNotMatch(css[1], /url\(/, "no url() in the style block")
for (const m of css[1].replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(?<=^|[{}])\s*([^{}@]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (/^(from|to|[\d.,%\s]+)$/.test(sel)) continue
  for (const s of sel.split(/,(?![^(]*\))/)) assert.match(s.trim(), /^(:where\(\.dark\) )?\.ppf-/, `selector escapes the component: ${s.trim()}`)
}
// element resets must lose to component classes, or pills/CTAs render unstyled
assert.doesNotMatch(css[1], /\.ppf-root (button|a)\{/, "element resets are wrapped in :where()")

/* ---------- interactions are wired ---------- */

assert.match(src, /aria-expanded=\{open\.includes\(id\)\} aria-controls=/, "nav pills expose their fold state")
assert.match(src, /aria-pressed=\{l\.code === lang\.code\}/, "language switch is pressable")
assert.match(src, /navigator\.clipboard\.writeText\(email\)/, "email copies to clipboard")
assert.match(src, /e\.key === "Escape"/, "Escape folds an open project")
assert.match(src, /el\.inert = inert/, "folded content is inert")
assert.match(src, /\.ppf-clients:hover \.ppf-track\{animation-play-state:paused\}/, "marquee pauses on hover")
assert.match(src, /@container \(min-width:880px\)/, "splits into two columns on wide containers")
assert.ok(read("demo.tsx").includes("<PocketPortfolio />"), "default demo is the component, full bleed")
assert.doesNotMatch(read("demo.tsx"), /<div/, "default demo has no wrapper")

/* ---------- logic, executed ---------- */

const code = region("logic") + "\nexport { formatClock, pickText, visibleProjects, toggleSection }\n"
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(code)))
const d = new Date(Date.UTC(2026, 0, 15, 13, 55, 19))
assert.equal(L.formatClock(d, "Europe/London", false), "13:55:19")
assert.equal(L.formatClock(d, "Asia/Tokyo", false), "22:55:19")
assert.match(L.formatClock(d, "Europe/London", true), /^01:55:19 PM$/)
assert.match(L.formatClock(d, "Not/AZone", false), /^\d\d:\d\d:\d\d$/, "unknown zone falls back to local")
assert.equal(L.pickText("plain", "CY"), "plain")
assert.equal(L.pickText({ EN: "hi", CY: "helo" }, "CY"), "helo")
assert.equal(L.pickText({ EN: "hi", CY: "helo" }, "FR"), "hi", "missing language falls back to the first")
assert.equal(L.pickText({}, "EN"), "")
const five = [1, 2, 3, 4, 5]
assert.deepEqual(L.visibleProjects(five, false, 2), [1, 2])
assert.deepEqual(L.visibleProjects(five, true, 2), five)
assert.deepEqual(L.visibleProjects(five, false, 0), [1], "always shows at least one")
assert.deepEqual(L.visibleProjects(five, false, NaN), [1, 2])
assert.deepEqual(L.toggleSection(["info"], "contact"), ["info", "contact"])
assert.deepEqual(L.toggleSection(["contact"], "info"), ["info", "contact"], "keeps nav order")
assert.deepEqual(L.toggleSection(["info", "work"], "info"), ["work"])

console.log("pocket-portfolio: ok")
