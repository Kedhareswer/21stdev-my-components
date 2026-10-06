// Install-safety and logic checks for components/ink-orbit-saas-template.
// Run: node tests/ink-orbit-saas-template.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const SLUG = "ink-orbit-saas-template"
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
assert.doesNotMatch(src, /https?:\/\//, "no external URL anywhere")
assert.match(src, /<img src=\{t\.avatar\}/, "the only <img> is a caller-supplied avatar")
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.match(src, /minHeight: height/, "the height prop reaches the root")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
{
  // the only percentage heights: the canvas, absolutely filling a panel that has
  // its own min-height, and cards filling grid rows — none leans on html/body
  const css = src.match(/const NF_CSS = `([\s\S]*?)`/)[1]
  const rules = [...css.matchAll(/([^{}]+)\{[^}]*\bheight:100%/g)].map((m) => m[1].trim())
  assert.deepEqual(rules, [".nf-art canvas"], "percentage height only on the absolutely-placed canvas")
  assert.match(css, /\.nf-art\{[^}]*min-height:360px/, "...whose panel has a definite height")
}
assert.match(src, /React\.useId\(\)/, "svg ids are namespaced per instance")
assert.doesNotMatch(src, /use(State|Ref|Memo|Callback)</, "hooks are typed without <generics>, so the 21st CLI tokenizer stays linear")
assert.doesNotMatch(src, /location\.hash|history\.(push|replace)State/, "the host's URL is untouched")
assert.match(src, /scrollIntoView\(\{ behavior: reduced \? "auto" : "smooth"/, "nav scrolls to sections, instantly under reduced motion")

const css = src.match(/const NF_CSS = `([\s\S]*?)`/)
assert.ok(css, "CSS block present")
assert.doesNotMatch(css[1], /\$\{|`/, "no interpolation inside the CSS string")
assert.doesNotMatch(css[1], /url\(/, "no url() in the style block")
assert.ok(css[1].includes("prefers-reduced-motion:reduce"), "honours reduced motion")
for (const m of css[1].replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(?<=^|[{}])\s*([^{}@]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (/^(from|to|[\d.,%\s]+)$/.test(sel)) continue
  for (const s of sel.split(/,(?![^(]*\))/)) assert.match(s.trim(), /^(\.nf-|\[data-in)/, `selector escapes the component: ${s.trim()}`)
}
assert.match(css[1], /\.nf-root :where\(button\)\{/, "base resets carry no specificity")
assert.match(css[1], /\.nf-root :where\(svg\)\{display:block;max-width:none/, "svg guarded against Preflight")
assert.match(css[1], /\.nf-root :where\(img\)\{display:block;max-width:none/, "img guarded against Preflight")
assert.match(css[1], /\.nf-shell\{[^}]*container-type:inline-size/, "the layout responds to its own width")
assert.match(css[1], /\.nf-track\{[^}]*grid-auto-columns:100%/, "one testimonial per view on phones, never squeezed")

/* ---------- the interactions are wired ---------- */

assert.match(src, /setPointerCapture/, "the sculpture can be grabbed")
assert.match(src, /< 4\) onReforge\(\)/, "a click without a drag reforges")
assert.match(src, /e\.key === "Escape" && onClose\(\)/, "the demo dialog closes on Escape")
assert.match(src, /aria-modal="true"/, "the demo is a modal dialog")
assert.match(src, /onSelectPlan\?\.\(name, billing\)/, "plans hand over name + billing")
assert.match(src, /if \(onSubscribe\) await onSubscribe\(email\.trim\(\)\)/, "sign-up hands over the email")
assert.match(src, /aria-expanded=\{open === i\}/, "FAQ items are disclosure buttons")
assert.match(src, /data-theme=\{theme\}/, "the theme is scoped to the root")
assert.match(src, /classList\.contains\("dark"\)/, "system theme follows the host's .dark class")
assert.ok(read("demo.tsx").includes("<InkOrbitSaasTemplate />"), "default demo is the component, full bleed")
assert.doesNotMatch(read("demo.tsx"), /<div/, "default demo has no wrapper")

/* ---------- logic, executed ---------- */

const L = await import(
  "data:text/javascript," +
    encodeURIComponent(
      stripTypeScriptTypes(region("logic")) +
        "\nexport { clamp, mulberry32, isEmail, parseTitle, planPrice, yearlySaving, splitStat, formatStat, hexToRgb, mixHex, chartPaths, nearestIndex, buildCloud, project, CORE_N, GRAIN_N, SPIKE_N, SPHERE_R }\n",
    )
)

assert.ok(L.isEmail("a@b.co") && !L.isEmail("a@b") && !L.isEmail("a b@c.co"))

const r1 = L.mulberry32(42)
const r2 = L.mulberry32(42)
for (let i = 0; i < 5; i++) {
  const v = r1()
  assert.equal(v, r2(), "seeded rng repeats")
  assert.ok(v >= 0 && v < 1)
}

assert.deepEqual(L.parseTitle("Smart *Workflow*\nAutomation"), [
  [{ text: "Smart ", muted: false }, { text: "Workflow", muted: true }],
  [{ text: "Automation", muted: false }],
])
assert.deepEqual(L.parseTitle("a\\nb"), [[{ text: "a", muted: false }], [{ text: "b", muted: false }]], "a JSX-attribute \\n breaks too")

assert.equal(L.planPrice(49, "monthly", 0.2), 49)
assert.equal(L.planPrice(49, "yearly", 0.2), 39)
assert.equal(L.planPrice(null, "yearly", 0.2), null)
assert.equal(L.planPrice(10, "yearly", 5), 1, "discount is clamped")
assert.equal(L.yearlySaving(49, 0.2), 120)
assert.equal(L.yearlySaving(null, 0.2), 0)

assert.deepEqual(L.splitStat("38M"), { prefix: "", value: 38, decimals: 0, suffix: "M" })
assert.deepEqual(L.splitStat("99.98%"), { prefix: "", value: 99.98, decimals: 2, suffix: "%" })
assert.deepEqual(L.splitStat("$1,200+"), { prefix: "$", value: 1200, decimals: 0, suffix: "+" })
assert.equal(L.splitStat("none"), null)
assert.equal(L.formatStat("12,400+", 1), "12,400+")
assert.equal(L.formatStat("4.9/5", 1), "4.9/5")
assert.equal(L.formatStat("4.9/5", 0), "0.0/5")
assert.equal(L.formatStat("Soon", 0.5), "Soon", "non-numbers pass through")

assert.deepEqual(L.hexToRgb("#fff"), [255, 255, 255])
assert.deepEqual(L.hexToRgb("#141414"), [20, 20, 20])
assert.equal(L.mixHex("#000000", "#ffffff", 0.5), "rgb(128,128,128)")
assert.equal(L.mixHex("#000000", "#ffffff", 4), "rgb(255,255,255)", "mix is clamped")

const ch = L.chartPaths([1, 3, 2], 100, 50, 10)
assert.equal(ch.points.length, 3)
assert.deepEqual(ch.points[0], [10, 40], "lowest value sits on the floor")
assert.deepEqual(ch.points[1], [50, 10], "highest value touches the ceiling")
assert.ok(ch.line.startsWith("M10.0,40.0") && ch.area.endsWith("Z"))
assert.equal(L.nearestIndex([0, 10, 20], 14), 1)

const a = L.buildCloud(7)
const b = L.buildCloud(7)
const c = L.buildCloud(8)
assert.equal(a.core.length, L.CORE_N * 4)
assert.equal(a.grain.length, L.GRAIN_N * 3)
assert.equal(a.spikes.length, L.SPIKE_N * 6)
assert.equal(c.core.length, a.core.length, "every seed has the same grain count, so any two can morph")
assert.deepEqual(a.core.slice(0, 40), b.core.slice(0, 40), "a seed always forges the same shape")
assert.notDeepEqual(a.core.slice(0, 40), c.core.slice(0, 40), "different seeds differ")
assert.ok(a.core.every((v) => Number.isFinite(v)) && a.grain.every((v) => Number.isFinite(v)), "no NaN in the cloud")
let minR = Infinity
for (let i = 0; i < L.CORE_N; i++) minR = Math.min(minR, Math.hypot(a.core[i * 4], a.core[i * 4 + 1], a.core[i * 4 + 2]))
assert.ok(minR > L.SPHERE_R + 0.15, "the ink never pierces the glass sphere")

const [px, py, pz, ps] = L.project(1, 0, 0, Math.PI / 2, 0, 3)
assert.ok(Math.abs(px) < 1e-9 && Math.abs(py) < 1e-9, "a quarter turn sends +x to depth")
assert.ok(pz < 0 && ps < 1, "...behind the centre, so it draws smaller")

console.log("ink-orbit-saas-template: ok")
