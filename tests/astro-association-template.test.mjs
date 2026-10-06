// Install-safety and logic checks for components/astro-association-template.
// Run: node tests/astro-association-template.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const SLUG = "astro-association-template"
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
assert.doesNotMatch(src, /@import|@font-face|<link\b|fetch\(|new Image\(|<img\b/, "nothing loads at runtime")
assert.doesNotMatch(src, /https?:\/\//, "no external URL anywhere")
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.match(src, /minHeight: height/, "the height prop reaches the root")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.match(src, /React\.useId\(\)/, "svg ids are namespaced per instance")
assert.doesNotMatch(src, /use(State|Ref|Memo|Callback)</, "hooks are typed without <generics>, so the 21st CLI tokenizer stays linear")
assert.doesNotMatch(src, /location\.hash|history\.(push|replace)State/, "the host's URL is untouched")
assert.match(src, /scrollIntoView\(\{ behavior: reduced \? "auto" : "smooth"/, "nav scrolls to sections, instantly under reduced motion")

const css = src.match(/const AA_CSS = `([\s\S]*?)`/)
assert.ok(css, "CSS block present")
assert.doesNotMatch(css[1], /\$\{|`/, "no interpolation inside the CSS string")
assert.doesNotMatch(css[1], /url\(/, "no url() in the style block")
assert.ok(css[1].includes("prefers-reduced-motion:reduce"), "honours reduced motion")
for (const m of css[1].replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(?<=^|[{}])\s*([^{}@]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (/^(from|to|[\d.,%\s]+)$/.test(sel)) continue
  for (const s of sel.split(/,(?![^(]*\))/)) assert.match(s.trim(), /^\.aa-/, `selector escapes the component: ${s.trim()}`)
}
{
  // the only percentage height: canvases filling an absolutely-inset host
  // whose parent has its own clamp() height — none leans on html/body
  const rules = [...css[1].matchAll(/([^{}]+)\{[^}]*(?<![-\w])height:100%/g)].map((m) => m[1].trim())
  assert.deepEqual(rules, [".aa-bub canvas", ".aa-bar i"], "percentage heights only on the canvas and inside the fixed 8px bar")
  for (const host of [".aa-wm", ".aa-band", ".aa-foot-band", ".aa-rib", ".aa-stage"])
    assert.match(css[1], new RegExp("\\" + host + "\\{[^}]*height:clamp\\("), `${host} has a definite height`)
}
assert.match(css[1], /\.aa-root :where\(button\)\{/, "base resets carry no specificity")
assert.match(css[1], /\.aa-root :where\(svg\)\{display:block;max-width:none/, "svg guarded against Preflight")
assert.match(css[1], /\.aa-root :where\(canvas\)\{display:block;max-width:none/, "canvas guarded against Preflight")
assert.match(css[1], /\.aa-shell\{[^}]*container-type:inline-size/, "the layout responds to its own width")
assert.match(src, /cv\.clientWidth/, "canvases size from layout, so rotated ribbons don't stretch their bubbles")

/* ---------- the interactions are wired ---------- */

assert.match(src, /getImageData\(/, "only visible bubbles pop")
assert.match(src, /live\.current\.onPop\?\.\(\)/, "pops are reported")
assert.match(src, /role="radiogroup" aria-label="Bubble palette"/, "palette switcher is a radio group")
assert.match(src, /onPaletteChange\?\.\(p\)/, "palette changes are reported")
assert.match(src, /onRsvp\?\.\(n, next\)/, "RSVPs hand over the night")
assert.match(src, /if \(onJoin\) await onJoin\(member\)/, "join hands over the member")
assert.match(src, /aria-expanded=\{isOpen\}/, "dossiers are disclosure buttons")
assert.match(src, /aria-pressed=\{kind === k\}/, "filters are toggle buttons")
assert.match(src, /data-theme=\{theme\}/, "the theme is scoped to the root")
assert.match(src, /classList\.contains\("dark"\)/, "system theme follows the host's .dark class")
assert.match(src, /addEventListener\("pointermove", move/, "the logo's needle follows the pointer")
assert.ok(read("demo.tsx").includes("<AstroAssociationTemplate />"), "default demo is the component, full bleed")
assert.doesNotMatch(read("demo.tsx"), /<div/, "default demo has no wrapper")

/* ---------- logic, executed ---------- */

const L = await import(
  "data:text/javascript," +
    encodeURIComponent(
      stripTypeScriptTypes(region("logic")) +
        "\nexport { clamp, mulberry32, hashStr, isEmail, lines, buildBubbles, bubbleCss, moonPhase, phaseName, moonPath, parseDay, isoDay, memberNumber, firstName, splitStat, formatStat, unwrapAngle }\n",
    )
)

assert.ok(L.isEmail("a@b.co") && !L.isEmail("a@b") && !L.isEmail("a b@c.co"))
assert.deepEqual(L.lines("ASTRO.\nASSOCiATION"), ["ASTRO.", "ASSOCiATION"])
assert.deepEqual(L.lines("a\\nb"), ["a", "b"], "a JSX-attribute \\n breaks too")

const a = L.buildBubbles(7, 800, 300, 12)
const b = L.buildBubbles(7, 800, 300, 12)
assert.deepEqual(a, b, "a seed always lays out the same field")
assert.notDeepEqual(a.slice(0, 5), L.buildBubbles(8, 800, 300, 12).slice(0, 5), "different seeds differ")
assert.ok(a.every((x) => x.c >= 1 && x.c < 12), "colour 0 is the ground, never a bubble")
assert.ok(a.every((x, i) => i === 0 || a[i - 1].r >= x.r), "big bubbles first, small on top")
assert.ok(a.every((x) => Number.isFinite(x.x + x.y + x.r)), "no NaN")
{
  // the field is covered: sum of areas well over the field's area
  const cover = a.reduce((s, x) => s + Math.PI * x.r * x.r, 0) / (800 * 300)
  assert.ok(cover > 1, `bubbles cover the field (${cover.toFixed(2)})`)
}
assert.ok(L.buildBubbles(1, 4000, 4000, 5).length <= 1400, "count is capped")

const bg = L.bubbleCss(3, ["#000", "#111", "#222"], 5)
assert.equal((bg.match(/radial-gradient/g) || []).length, 5)
assert.ok(bg.endsWith(", #000"), "ground colour last")
assert.doesNotMatch(bg, /NaN|undefined/)

// 2024-04-08 18:21 UTC was a new moon (the total solar eclipse); 2024-04-23 23:49 UTC full
const nm = L.moonPhase(Date.UTC(2024, 3, 8, 18, 21))
assert.ok(nm.illumination < 0.01 && nm.name === "New Moon", `new moon: ${nm.name} ${nm.illumination}`)
const fm = L.moonPhase(new Date(Date.UTC(2024, 3, 23, 23, 49)))
assert.ok(fm.illumination > 0.99 && fm.name === "Full Moon", `full moon: ${fm.name}`)
const fq = L.moonPhase(Date.UTC(2024, 3, 15, 19, 13))
assert.equal(fq.name, "First Quarter")
assert.ok(fq.waxing && Math.abs(fq.daysToFull - 8.2) < 0.6)
assert.ok(L.moonPhase(Date.UTC(1990, 0, 1)).fraction >= 0, "dates before the reference wrap")
assert.equal(L.phaseName(0.99), "New Moon")
assert.equal(L.phaseName(0.75), "Last Quarter")

assert.equal(L.moonPath(0, 10), "M0,-10.00A10.00,10.00 0 0 1 0,10.00A10.00,10.00 0 0 0 0,-10.00Z", "new: limb and terminator coincide")
assert.match(L.moonPath(0.499, 10), /^M0,-10\.00A10\.00,10\.00 0 0 1 0,10\.00A10\.00,10\.00 0 0 1 0,-10\.00Z$/, "nearly full: both halves sweep the same way round, a whole disc")
assert.match(L.moonPath(0.25, 10), /A0\.00,10\.00/, "quarter: the terminator is a straight line")
assert.match(L.moonPath(0.8, 10), /^M0,-10\.00A10\.00,10\.00 0 0 0 /, "waning lights the left limb")

assert.deepEqual(L.parseDay("2026-11-14"), { day: "14", mon: "NOV", dow: "SAT", ms: Date.UTC(2026, 10, 14, 21) })
assert.equal(L.parseDay("2026-02-30"), null, "impossible dates are rejected")
assert.equal(L.parseDay("soon"), null)
assert.equal(L.isoDay(new Date(2026, 0, 5)), "2026-01-05")

assert.equal(L.memberNumber("Ada", "a@b.co"), L.memberNumber(" ada ", "A@B.CO"), "card number is stable")
assert.match(L.memberNumber("x", ""), /^#\d{4}$/)
assert.equal(L.firstName("  Ada  Lovelace "), "Ada")

assert.equal(L.formatStat("1,840+", 1), "1,840+")
assert.equal(L.formatStat("48,600", 0), "0")
assert.equal(L.formatStat("Soon", 0.5), "Soon")

assert.equal(L.unwrapAngle(170, -170), 190, "the needle takes the short way round")
assert.equal(L.unwrapAngle(-45, 30), 30)

console.log("astro-association-template: ok")
