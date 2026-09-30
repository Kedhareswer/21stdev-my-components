// Install-safety, wiring and logic checks for components/sidebar-portfolio-template.
// Run: node tests/sidebar-portfolio-template.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const SLUG = "sidebar-portfolio-template"
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
assert.doesNotMatch(src, /@import|@font-face|<link\b|fetch\(|new Image\(/, "nothing loads at runtime")
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.match(src, /React\.useId\(\)/, "ids are namespaced per instance")
assert.doesNotMatch(src, /url\(#[a-z]/, "gradient references are built from the instance id")
assert.match(src, /<img src=\{avatarSrc\}[^>]*width=\{76\} height=\{76\} style=\{\{ maxWidth: "none" \}\}/, "the optional photo is guarded against Preflight")
assert.equal((src.match(/<img\b/g) ?? []).length, 1, "the only image is the optional user photo")
assert.ok(src.includes("prefers-reduced-motion: reduce"), "reads reduced motion")

const css = src.match(/const SPT_CSS = `([\s\S]*?)`/)
assert.ok(css, "CSS block present")
assert.doesNotMatch(css[1], /\$\{|`/, "no interpolation inside the CSS string")
assert.doesNotMatch(css[1], /url\(/, "no url() in the style block")
assert.ok(css[1].includes("@media (prefers-reduced-motion:reduce)"), "motion is switched off for reduced motion")
const scoped = /^(:where\(\.spt-root\)|:where\(\.dark\) \.spt-root|\.spt-)/
for (const m of css[1].replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(?<=^|[{}])\s*([^{}@]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (/^(from|to|[\d.,%\s]+)$/.test(sel)) continue
  for (const s of sel.split(/,(?![^(]*\))/)) assert.match(s.trim(), scoped, `selector escapes the component: ${s.trim()}`)
}
assert.match(css[1], /\.spt-root svg\{max-width:none/, "svgs are guarded against Preflight")
assert.match(css[1], /:where\(\.spt-root\) button\{/, "resets sit under :where so component classes win")
assert.match(css[1], /\.spt-bul\{list-style:disc/, "bullets survive Preflight's list reset")
assert.match(css[1], /height:var\(--spt-h\)/, "the sticky sidebar is as tall as the root, not h-full")
assert.match(css[1], /@container spt \(min-width:880px\)/, "layout responds to its own width, not the viewport")

/* ---------- the interactions are wired ---------- */

assert.match(src, /aria-current=\{active === k \? "true" : undefined\}/, "nav follows the scroll")
assert.match(src, /onClick=\{\(\) => pickSkill\(s, n > 0\)\}/, "key skills light up the timeline")
assert.match(src, /data-dim=\{focusSkill && !hit \? "" : undefined\}/, "unrelated roles dim")
assert.match(src, /navigator\.clipboard/, "the mail button copies the address")
assert.match(src, /new Blob\(\[text\]/, "Download CV writes a CV without a cvUrl")
assert.match(src, /role="dialog" aria-modal="true"/, "Contact Me opens a real dialog")
assert.match(src, /e\.key === "Escape"/, "Escape closes it")
assert.match(src, /role="tab"/, "skills are tabs")
assert.match(src, /ArrowRight/, "tabs move with the arrow keys")
assert.match(src, /aria-expanded=\{open\}/, "education highlights fold")
assert.match(src, /role="button"\n\s+tabIndex=\{0\}/, "the hero drawing is keyboard reachable")
assert.match(src, /aria-live="polite"/, "toasts are announced")
assert.ok(read("demo.tsx").includes("<SidebarPortfolioTemplate />"), "default demo is the component, full bleed")
assert.doesNotMatch(read("demo.tsx"), /<div/, "default demo has no wrapper")

/* ---------- dates, signature and CV, executed ---------- */

const code = region("dates") + region("signature") + region("cv") + "\nexport { monthIndex, spanLabel, signatureOf, buildCv }\n"
const E = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(code)))
const now = new Date(2026, 8, 30)
assert.equal(E.spanLabel("Jan 2023", "Dec 2024", now), "2 yrs")
assert.equal(E.spanLabel("Aug 2020", "May 2021", now), "10 mos")
assert.equal(E.spanLabel("Apr 2021", "Dec 2022", now), "1 yr 9 mos")
assert.equal(E.spanLabel("Jan 2025", "Present", now), "1 yr 9 mos", "Present is this month")
assert.equal(E.spanLabel("September 2026", "now", now), "1 mo", "long month names and a single month")
assert.equal(E.spanLabel("2016", "2018", now), "2 yrs 1 mo", "bare years count from January")
assert.equal(E.spanLabel("Dec 2024", "Jan 2023", now), "", "a backwards span shows nothing")
assert.equal(E.spanLabel("someday", "Present", now), "", "an unreadable date shows nothing")

for (const name of ["Oliver Rowland", "Maya Lindqvist", "Jo", "", "李 小龙", "Anna-Sophie Quigley-Jægerström"]) {
  const s = E.signatureOf(name)
  assert.ok(s.d.startsWith("M"), `signature draws for ${JSON.stringify(name)}`)
  assert.doesNotMatch(s.d, /NaN|Infinity|undefined/, `signature is finite for ${JSON.stringify(name)}`)
  assert.ok(s.width > 30 && s.width < 160, `signature width is sane for ${JSON.stringify(name)}`)
}
assert.equal(E.signatureOf("Oliver Rowland").d, E.signatureOf("Oliver Rowland").d, "signatures are deterministic")
assert.notEqual(E.signatureOf("Oliver Rowland").d, E.signatureOf("Maya Lindqvist").d, "different names sign differently")
assert.ok(E.signatureOf("Maximiliano").width > E.signatureOf("Jo").width, "longer names sign longer")

const cv = E.buildCv({
  name: "Oliver Rowland",
  role: "Full Stack Developer",
  bio: "Bio.",
  email: "o@r.dev",
  details: ["Houston, Texas"],
  about: ["About me."],
  experience: [{ company: "Northstack", roles: [{ title: "Senior", type: "Full-Time", start: "Jan 2025", end: "Present", highlights: ["Did a thing"] }] }],
  education: [{ school: "LSU", degree: "B.S.", start: "2016", end: "2020" }],
  skills: [{ name: "Frontend", items: [{ name: "React", level: 90 }, { name: "CSS", level: 80 }] }],
})
assert.ok(cv.startsWith("Oliver Rowland\nFull Stack Developer\no@r.dev  ·  Houston, Texas\n"), "CV opens with name, role, contact")
for (const part of ["EXPERIENCE", "Senior — Northstack (Full-Time)", "  • Did a thing", "B.S. — LSU", "Frontend: React, CSS"]) {
  assert.ok(cv.includes(part), `CV includes ${part}`)
}
const bare = E.buildCv({ name: "A", role: "B", bio: "", email: "", details: [], about: [], experience: [], education: [], skills: [] })
assert.equal(bare, "A\nB\n", "empty sections are left out")

console.log("sidebar-portfolio-template: ok")
