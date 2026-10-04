// Install-safety and logic checks for components/sticker-hello-portfolio.
// Run: node tests/sticker-hello-portfolio.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const SLUG = "sticker-hello-portfolio"
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
assert.doesNotMatch(
  src.replace(/https:\/\/(instagram|dribbble|linkedin)\.com"/g, ""),
  /https?:\/\//,
  "no external URL beyond the placeholder social links",
)
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.match(src, /minHeight: height/, "the height prop reaches the root")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
assert.match(src, /React\.useId\(\)/, "svg ids are namespaced per instance")
assert.doesNotMatch(src, /id="[a-z]/, "no hard-coded svg ids")
assert.doesNotMatch(src, /url\(#[a-z]/, "svg references are built from the instance id")
assert.doesNotMatch(src, /use(State|Ref|Memo|Callback)</, "hooks are typed without <generics>, so the 21st CLI tokenizer stays linear")
assert.doesNotMatch(src, /location\.hash|history\.(push|replace)State/, "the host's URL is untouched")
assert.doesNotMatch(src, /document\.body|documentElement\.style/, "the host page is never restyled")
assert.match(src, /<img[\s\S]*?width=\{1600\}[\s\S]*?height=\{720\}[\s\S]*?style=\{\{ maxWidth: "none" \}\}/, "custom images have explicit size and a Preflight guard")

const css = src.match(/const SH_CSS = `([\s\S]*?)`/)
assert.ok(css, "CSS block present")
assert.doesNotMatch(css[1], /\$\{|`/, "no interpolation inside the CSS string")
assert.doesNotMatch(css[1], /url\(/, "no url() in the style block")
assert.ok(css[1].includes("prefers-reduced-motion:reduce"), "honours reduced motion")
const bare = css[1].replace(/\/\*[\s\S]*?\*\//g, "").replace(/@(media|container)[^{]*\{/g, "")
for (const m of bare.matchAll(/(?<=^|[{}])\s*([^{}@]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (/^(from|to|[\d.,%\s]+)$/.test(sel)) continue
  for (const s of sel.split(/,(?![^(]*\))/)) assert.match(s.trim(), /^\.sh-/, `selector escapes the component: ${s.trim()}`)
}
assert.match(css[1], /\.sh-root :where\(button\)\{/, "base resets carry no specificity")
assert.match(css[1], /\.sh-root :where\(svg\)\{display:block;max-width:none/, "svg guarded against Preflight")
assert.match(css[1], /\.sh-page\{container-type:inline-size/, "the page lays out from its own width")
assert.doesNotMatch(css[1], /\.sh-root\{[^}]*container-type/, "the root is not a container, so the fixed case study and toast stay viewport-fixed")

/* ---------- the interactions are wired ---------- */

assert.match(src, /setLine\(\(i\) => cycle\(i, lines\.length\)\)/, "clicking a hero sticker swaps its joke")
assert.match(src, /if \(drag\.current\.moved\) \{/, "a drag doesn't also count as a click")
assert.match(src, /onDoubleClick=\{\(\) => setOff\(\{ x: 0, y: 0 \}\)\}/, "double-click puts a sticker back")
assert.match(src, /setPointerCapture/, "stickers can be grabbed")
assert.match(src, /scrollIntoView\(\{ behavior: reduced \? "auto" : "smooth"/, "nav scrolls, instantly under reduced motion")
assert.match(src, /e\.key === "Escape"\) onClose\(\)/, "Esc closes the case study")
assert.match(src, /e\.key === "ArrowRight"\) onStep\(1\)/, "→ flips to the next case")
assert.match(src, /role="dialog" aria-modal="true"/, "the case study is a modal dialog")
assert.match(src, /lastFocus\.current\?\.focus/, "focus goes back to the artwork on close")
assert.match(src, /e\.key === "Delete" \|\| e\.key === "Backspace"\) peel\(s\.id\)/, "board stickers peel from the keyboard")
assert.match(src, /navigator\.clipboard\?\.writeText\(email\)/, "the email copies")
assert.match(src, /onProjectOpen\?\.\(projects\[i\], i\)/, "opening a case reports it")
assert.match(src, /data-theme=\{theme\}/, "the theme is scoped to the root")
assert.match(src, /classList\.contains\("dark"\)/, "system theme follows the host's .dark class")
assert.match(src, /if \(reduced\) return\n\s+let raf = 0/, "no parallax under reduced motion")
assert.ok(read("demo.tsx").includes("<StickerHelloPortfolio />"), "default demo is the component, full bleed")
assert.doesNotMatch(read("demo.tsx"), /<div/, "default demo has no wrapper")

/* ---------- logic, executed ---------- */

const L = await import(
  "data:text/javascript," +
    encodeURIComponent(
      stripTypeScriptTypes(region("logic")) +
        "\nexport { clamp, cycle, mulberry32, burstPath, parallax, fitFont, splitHighlight, formatClock, mailtoHref, placeSticker }\n",
    )
)

assert.equal(L.clamp(5, 0, 1), 1)
assert.equal(L.clamp(-5, 0, 1), 0)

assert.equal(L.cycle(0, 3), 1)
assert.equal(L.cycle(2, 3), 0, "wraps forward")
assert.equal(L.cycle(0, 3, -1), 2, "wraps backward")
assert.equal(L.cycle(4, 0), 0, "an empty list stays at 0")

const a = L.mulberry32(42)
const b = L.mulberry32(42)
const seq = [a(), a(), a()]
assert.deepEqual(seq, [b(), b(), b()], "same seed, same scenery")
assert.ok(seq.every((v) => v >= 0 && v < 1))

const burst = L.burstPath(50, 50, 12, 48, 38)
assert.match(burst, /^M50\.00 2\.00L/, "the first spike points straight up")
assert.equal((burst.match(/L/g) ?? []).length, 23, "two vertices per spike")
assert.ok(burst.endsWith("Z"))
assert.equal((L.burstPath(0, 0, 1, 1, 1).match(/L/g) ?? []).length, 5, "at least three spikes")

assert.equal(L.parallax(900, 400, 900), -1, "just below the fold")
assert.equal(L.parallax(-400, 400, 900), 1, "just scrolled past")
assert.equal(L.parallax(250, 400, 900), 0, "centred")
assert.equal(L.parallax(0, 0, 0), 0, "no viewport, no drift")

assert.equal(L.fitFont(500, 1000, 1, 32, 230), 188, "fills the width")
assert.equal(L.fitFont(500, 1000, 0.5, 32, 400), 376, "squeeze is accounted for")
assert.equal(L.fitFont(500, 100000, 1, 32, 230), 230, "capped")
assert.equal(L.fitFont(500, 0, 1, 32, 230), 32, "an unmeasured box takes the minimum")

assert.deepEqual(L.splitHighlight("Let’s make something happy.", "happy"), ["Let’s make something ", "happy", "."])
assert.deepEqual(L.splitHighlight("No match here", "happy"), ["No match here", "", ""])
assert.deepEqual(L.splitHighlight("Anything", ""), ["Anything", "", ""])

assert.match(L.formatClock(new Date(Date.UTC(2026, 0, 1, 9, 5)), "UTC"), /^09:05$/)
assert.match(L.formatClock(new Date(), "Not/AZone"), /^\d\d:\d\d$/, "a bad zone falls back to local time")

assert.equal(L.mailtoHref("a@b.co"), "mailto:a@b.co")
assert.equal(L.mailtoHref("a@b.co", "Hi & bye"), "mailto:a@b.co?subject=Hi%20%26%20bye")

const r = L.mulberry32(1)
for (let i = 0; i < 200; i++) {
  const p = L.placeSticker(r)
  assert.ok(p.x >= 0.1 && p.x <= 0.9 && p.y >= 0.14 && p.y <= 0.86, "lands on the sheet, off the edge")
  assert.ok(Math.abs(p.r) <= 18, "a slight tilt")
}

console.log("sticker-hello-portfolio: ok")
