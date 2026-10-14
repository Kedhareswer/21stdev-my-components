// Checks for components/duotone-team-roster.
// Run: node tests/duotone-team-roster.test.mjs
//
// The column dealing, headline fitting, palette and tritone maths live in the
// .tsx so the published component stays one file; the marked region is lifted
// out and run. The rest are the install-safety rules: a root with a definite
// height, CSS that cannot leak into the host page, Preflight guards on the
// portraits, reduced motion, and only Unsplash as an image host.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const src = readFileSync(new URL("../components/duotone-team-roster/duotone-team-roster.tsx", import.meta.url), "utf8")

// #region logic
const start = src.indexOf("// #region roster-logic")
const end = src.indexOf("// #endregion roster-logic")
assert.ok(start > -1 && end > start, "logic region markers missing")
const js = src.slice(start, end).replace(/:\s*(string|number|any\[\]\[\]|any\[\]|any|RosterPalette)(?=[,)\s=])/g, "")
const m = await import("data:text/javascript," + encodeURIComponent(js))

// Palettes: presets resolve, unknown presets fall back, overrides win per key.
assert.equal(m.resolvePalette("cobalt").hot, "#2e57f5")
assert.equal(m.resolvePalette("nope").hot, m.PRESETS.ember.hot)
const p = m.resolvePalette("ember", { ink: "#ffffff", nonsense: "x" })
assert.equal(p.ink, "#ffffff")
assert.equal(p.ground, m.PRESETS.ember.ground)
assert.equal(p.nonsense, undefined, "only palette keys are taken")
for (const [name, pal] of Object.entries(m.PRESETS))
  for (const k of ["ground", "deep", "hot", "glow", "ink", "shadow", "highlight"])
    assert.match(pal[k], /^#[0-9a-f]{6}$/, name + "." + k)

// The tritone tables feed feFuncR/G/B: three stops, 0..1, shadow first.
assert.deepEqual(m.hexToUnit("#ff0000"), [1, 0, 0])
assert.deepEqual(m.hexToUnit("#f80"), [1, 0.533, 0])
assert.deepEqual(m.hexToUnit("not a colour"), [0, 0, 0])
const t = m.tritoneTables("#000000", "#808080", "#ffffff")
assert.equal(t.length, 3)
for (const row of t) {
  const v = row.split(" ").map(Number)
  assert.equal(v.length, 3)
  assert.ok(v[0] <= v[1] && v[1] <= v[2], "dark to light")
}

assert.equal(m.mixHex("#000000", "#ffffff", 0.5), "#808080")
assert.equal(m.mixHex("#ff0000", "#0000ff", 0), "#ff0000")
assert.equal(m.mixHex("#ff0000", "#0000ff", 1), "#0000ff")

assert.equal(m.initials("Graham Whitlock"), "GW")
assert.equal(m.initials("  cher "), "C")
assert.equal(m.initials(""), "?")

// Dealing: everyone appears once as an original, neighbours differ, columns are
// padded with flagged repeats so a loop never runs out of faces.
for (const [count, roles, cols, min] of [[10, 0, 3, 4], [7, 2, 3, 4], [3, 0, 3, 3], [9, 1, 2, 5], [12, 0, 4, 3]]) {
  const plan = m.dealColumns(count, roles, cols, min)
  assert.equal(plan.length, cols)
  const originals = plan.flat().filter((e) => !e.dup)
  assert.equal(originals.filter((e) => e.kind === "member").length, count, "every member once")
  assert.equal(originals.filter((e) => e.kind === "role").length, roles, "every open role once")
  for (const col of plan) {
    assert.ok(col.length >= Math.min(min, count + roles), "column padded to the minimum")
    const keys = col.map((e) => e.kind + e.index)
    if (count + roles >= min) assert.equal(new Set(keys).size, keys.length, "no face twice in one column")
  }
}
// Open roles are spread through the wall, not stacked at the end.
const withRoles = m.dealColumns(7, 2, 3, 0).map((c) => c.map((e) => e.kind))
assert.ok(withRoles.filter((c) => c.includes("role")).length === 2, "the two roles sit in different columns")
assert.deepEqual(m.dealColumns(0, 0, 3, 4), [[], [], []], "an empty team is not an infinite loop")

// Headline fitting: fills the column, respects the stretch and the clamps.
assert.equal(m.fitTitleSize(500, 250, 1, 40, 400), 200)
assert.equal(m.fitTitleSize(500, 250, 1.25, 40, 400), 160)
assert.equal(m.fitTitleSize(500, 250, 1, 40, 120), 120)
assert.equal(m.fitTitleSize(0, 250, 1, 40, 120), 40)

assert.equal(m.layoutFor(375, 3), 0, "phones get the strip")
assert.equal(m.layoutFor(820, 3), 2, "tablets get two columns")
assert.equal(m.layoutFor(1440, 3), 3)
assert.equal(m.layoutFor(1440, 9), 4, "columns clamp to 4")
assert.equal(m.layoutFor(0, 3), 3, "first render before measuring is the desktop wall")
assert.deepEqual(m.splitLines("The\n crew \n\n"), ["The", "crew"])
// #endregion

// A root that inherits its height renders here and collapses once installed.
assert.ok(/height = "100svh"/.test(src), "height must default to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full anywhere")
assert.doesNotMatch(src, /height:\s*"100%"/, "no percentage root height")

// 21st ships this file alone; the CSS must not reach the host page.
const open = src.indexOf("const css = `") + 13
const css = src.slice(open, src.indexOf("`", open))
assert.ok(css.length > 2000, "css block not found")
assert.doesNotMatch(css, /@import/, "no @import")
assert.doesNotMatch(css, /\$\{/, "no template expressions in the CSS")
for (const line of css.split("\n")) {
  const sel = line.split("{")[0].trim()
  if (!sel || sel.startsWith("@") || sel.startsWith("}") || /^(from|to|\d+%)$/.test(sel)) continue
  for (const part of sel.split(",")) assert.ok(part.trim().startsWith(".dtr"), "unscoped selector: " + part.trim())
}

// Preflight: absolutely-positioned portraits keep their size.
assert.match(css, /\.dtr-photo img\{[^}]*max-width:none/, "portraits guard img max-width")
assert.match(src, /width=\{720\}\s+height=\{960\}/, "portraits carry explicit dimensions")

// Motion: reduced motion stops the drift and the entrances; the drift can be paused.
const rm = css.slice(css.indexOf("@media (prefers-reduced-motion:reduce)"))
assert.ok(rm.length > 0, "reduced-motion block missing")
assert.match(rm, /\.dtr-track,\.dtr-strip-track\{animation:none/, "drift stops under reduced motion")
assert.match(rm, /\.dtr-col,\.dtr-line>span>span\{animation:none/, "entrances stop under reduced motion")
assert.match(src, /className="dtr-pause"/, "a pause control exists")
assert.match(css, /\.dtr\[data-paused\] \.dtr-track/, "pause stops the columns")
assert.match(css, /@media \(hover:hover\) and \(pointer:fine\)/, "hover effects are gated to real pointers")

// Repeated portraits are hidden from assistive tech and the tab order.
assert.match(src, /tabIndex=\{hidden \? -1 : 0\}/)
assert.match(src, /aria-hidden=\{hidden \? true : undefined\}/)

// Every built-in string can be replaced; the card is a disclosure button, not a focusable article.
for (const k of ["pause", "play", "team", "openRole", "hiring", "roleLink", "memberLink"]) assert.match(src, new RegExp("\\b" + k + ": \""), "label " + k)
assert.match(src, /className="dtr-hit"[\s\S]{0,200}aria-expanded=/, "portrait opens through a button with aria-expanded")
assert.doesNotMatch(src, /<article/, "no focusable article")
assert.doesNotMatch(src, /visibility: titleSize/, "first paint is never hidden")
assert.match(src, /aria-hidden=\{on \? undefined : true\}/, "folded panels are hidden from assistive tech")
assert.match(src, /const still = !drift \|\| !\(driftSeconds > 0\)/, "drift can be switched off, and 0 means still, not fast")
assert.match(css, /\.dtr\[data-static\] \.dtr-track\{animation:none\}/, "the still wall does not move")

// Only Unsplash is used as an image host; no web fonts.
const hosts = new Set([...src.matchAll(/https:\/\/([a-z0-9.-]+)\//g)].map((x) => x[1]))
hosts.delete("www.w3.org")
assert.deepEqual([...hosts], ["images.unsplash.com"])
assert.doesNotMatch(src, /fonts\.googleapis|@font-face/)

// The demo imports the path an installer gets.
for (const demo of ["demo.tsx", "demo-cobalt.tsx"]) {
  const d = readFileSync(new URL("../components/duotone-team-roster/" + demo, import.meta.url), "utf8")
  assert.match(d, /from "@\/components\/ui\/duotone-team-roster"/, demo)
  assert.match(d, /export default function \w*Demo/, demo)
}

console.log("duotone-team-roster: ok")
