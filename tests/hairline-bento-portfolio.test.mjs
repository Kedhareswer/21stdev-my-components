// Install-safety and logic checks for components/hairline-bento-portfolio.
// Run: node tests/hairline-bento-portfolio.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const SLUG = "hairline-bento-portfolio"
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
assert.doesNotMatch(src.replace(/https:\/\/(linkedin|instagram|gumroad)\.com"/g, ""), /https?:\/\//, "no external URL beyond the placeholder profile links")
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.match(src, /minHeight: height/, "the height prop reaches the root")
assert.doesNotMatch(src, /\bh-full\b|height:100%/, "no percentage heights")
assert.match(src, /React\.useId\(\)/, "svg ids are namespaced per instance")
assert.doesNotMatch(src, /use(State|Ref|Memo|Callback)</, "hooks are typed without <generics>, so the 21st CLI tokenizer stays linear")
assert.doesNotMatch(src, /location\.hash|history\.(push|replace)State/, "the host's URL is untouched")

const css = src.match(/const HB_CSS = `([\s\S]*?)`/)
assert.ok(css, "CSS block present")
assert.doesNotMatch(css[1], /\$\{|`/, "no interpolation inside the CSS string")
assert.doesNotMatch(css[1], /url\(/, "no url() in the style block")
assert.ok(css[1].includes("prefers-reduced-motion:reduce"), "honours reduced motion")
for (const m of css[1].replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(?<=^|[{}])\s*([^{}@]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (/^(from|to|[\d.,%\s]+)$/.test(sel)) continue
  for (const s of sel.split(/,(?![^(]*\))/)) assert.match(s.trim(), /^\.hb-/, `selector escapes the component: ${s.trim()}`)
}
assert.match(css[1], /\.hb-root :where\(button\)\{/, "base resets carry no specificity")
assert.match(css[1], /\.hb-root :where\(svg\)\{display:block;max-width:none/, "svg guarded against Preflight")
assert.match(css[1], /\.hb-wrap\{[^}]*container-type:inline-size/, "the grid lays out from its own width")
assert.match(css[1], /\.hb-head>span\{display:block\}/, "only headline lines break, not the counted numbers")

/* ---------- the interactions are wired ---------- */

assert.match(src, /setPointerCapture/, "the ring can be grabbed")
assert.match(src, /onPointerEnter=\{\(\) => \(st\.current\.hover = true\)\}/, "the ring speeds up under the pointer")
assert.match(src, /aria-pressed=\{picked\.includes\(t\)\}/, "waitlist topics are toggle buttons")
assert.match(src, /onJoinWaitlist\(\{ email: wlEmail\.trim\(\), topics \}\)/, "the waitlist hands over email and topics")
assert.match(src, /if \(onSubscribe\) await onSubscribe\(mlEmail\.trim\(\)\)/, "subscribe hands over the email")
assert.match(src, /navigator\.clipboard\?\.writeText\(email\)/, "the email copies")
assert.match(src, /data-theme=\{theme\}/, "the theme is scoped to the root")
assert.match(src, /classList\.contains\("dark"\)/, "system theme follows the host's .dark class")
assert.ok(read("demo.tsx").includes("<HairlineBentoPortfolio />"), "default demo is the component, full bleed")
assert.doesNotMatch(read("demo.tsx"), /<div/, "default demo has no wrapper")

/* ---------- logic, executed ---------- */

const L = await import(
  "data:text/javascript," +
    encodeURIComponent(
      stripTypeScriptTypes(region("logic")) +
        "\nexport { clamp, isEmail, splitName, splitNumbers, easeOutCubic, countValue, ringText, ringFontSize, angleDelta, formatClock, mailtoHref, fitFont }\n",
    )
)

assert.ok(L.isEmail("a@b.co") && L.isEmail(" me@site.studio "))
assert.ok(!L.isEmail("nope") && !L.isEmail("a@b") && !L.isEmail("a b@c.co"))

assert.deepEqual(L.splitName("Mira Nowak"), ["Mira", "Nowak"])
assert.deepEqual(L.splitName("Ana de la Cruz"), ["Ana", "de la Cruz"], "first word, then the rest")
assert.deepEqual(L.splitName("Prince"), ["Prince"])
assert.deepEqual(L.splitName("X Y", ["One", " ", "Two"]), ["One", "Two"], "given lines win, blanks dropped")

assert.deepEqual(L.splitNumbers("12 years, 8 UX"), [
  { num: true, value: "12" },
  { num: false, value: " years, " },
  { num: true, value: "8" },
  { num: false, value: " UX" },
])
assert.deepEqual(L.splitNumbers("no digits"), [{ num: false, value: "no digits" }])

assert.equal(L.easeOutCubic(0), 0)
assert.equal(L.easeOutCubic(1), 1)
assert.equal(L.easeOutCubic(3), 1, "clamped")
assert.equal(L.countValue(12, 0), 0)
assert.equal(L.countValue(12, 1), 12)

assert.equal(L.ringText("Hello"), "Hello · ")
assert.equal(L.ringText("Hello ·"), "Hello · ", "no doubled separator")
assert.equal(L.ringText("  "), "")
assert.ok(L.ringFontSize(200) >= 6 && L.ringFontSize(5) <= 10.5, "ring type stays legible")
assert.ok(L.ringFontSize(30) > L.ringFontSize(60), "longer text sets smaller")

assert.equal(L.angleDelta(170, -170), 20, "crosses the seam the short way")
assert.equal(L.angleDelta(-170, 170), -20)
assert.equal(L.angleDelta(10, 40), 30)

assert.match(L.formatClock(new Date(Date.UTC(2026, 0, 1, 9, 5)), "UTC"), /^09:05$/)
assert.match(L.formatClock(new Date(), "Not/AZone"), /^\d\d:\d\d$/, "a bad zone falls back to local time")

assert.equal(L.mailtoHref("a@b.co"), "mailto:a@b.co")
assert.equal(L.mailtoHref("a@b.co", "Hi & bye"), "mailto:a@b.co?subject=Hi%20%26%20bye")

assert.equal(L.fitFont([200, 400], 400, 1, 10, 200), 98, "widest line fills the box")
assert.equal(L.fitFont([400], 400, 2, 10, 200), 49, "stretch is accounted for")
assert.equal(L.fitFont([10], 4000, 1, 10, 112), 112, "capped")
assert.equal(L.fitFont([400], 0, 1, 28, 112), 28, "an unmeasured box takes the minimum")

console.log("hairline-bento-portfolio: ok")
