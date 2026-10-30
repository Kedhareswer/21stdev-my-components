// Install-safety, opening-hours, sketch and paging checks for
// components/vernissage-museum-template.
// Run: node tests/vernissage-museum-template.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const slug = "vernissage-museum-template"
const root = new URL("../", import.meta.url)
const dir = new URL("components/" + slug + "/", root)
const src = readFileSync(new URL(slug + ".tsx", dir), "utf8")
const pkg = JSON.parse(readFileSync(new URL("package.json", root), "utf8"))

// ---- install safety ------------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react", "gsap", "gsap/ScrollTrigger"], "only react and gsap")
assert.ok(pkg.dependencies?.gsap, "gsap must be declared in the root package.json")
assert.match(src, /gsap\.registerPlugin\(ScrollTrigger\)/, "ScrollTrigger is registered")
for (const f of readdirSync(dir))
  assert.ok(new RegExp("^(" + slug + "\\.tsx|demo(-[a-z0-9-]+)?\\.tsx|README\\.md)$").test(f), "unexpected file in the folder: " + f)

assert.ok(src.includes('height = "100svh"'), "hero height defaults to a definite length")
assert.ok(src.includes('"--h": height'), "the height prop feeds --h")
assert.ok(src.includes(".vmt-hero{position:relative;height:max(540px,min(calc(var(--h) - var(--tb))"), "the hero takes its height from the prop")
assert.doesNotMatch(src, /className=["'][^"']*\bh-full\b/, "no h-full")
assert.doesNotMatch(src, /pin:\s*true/, "no ScrollTrigger pinning (it rewrites React's DOM)")
assert.ok(src.includes("ctx.revert()"), "every trigger and tween is reverted on unmount")
assert.doesNotMatch(src, /@import/, "no @import")
assert.ok(src.includes('{fontHref && <link rel="stylesheet" href={fontHref} />}'), "fontHref null loads nothing")

// The scoped CSS string: prefixed selectors only, no bare resets, no template holes.
const css = src.match(/const CSS = `([\s\S]*?)`/)[1].replace(/\/\*[\s\S]*?\*\//g, "")
assert.doesNotMatch(css, /\$\{/, "no ${ in the CSS string")
for (const bad of [/(^|[},])\s*\*\s*\{/, /(^|[},])\s*body\s*\{/, /:root/, /(^|[},])\s*html\s*\{/])
  assert.doesNotMatch(css, bad, "no bare resets in the CSS: " + bad)
for (const rule of css.matchAll(/(?:^|\})\s*(?!@)([^{}\s][^{}]*)\{/g)) {
  const sel = rule[1].trim()
  if (!sel || /^(from|to|\d+%)/.test(sel)) continue
  const parts = []
  let depth = 0
  let cur = ""
  for (const ch of sel) {
    if (ch === "(") depth++
    if (ch === ")") depth--
    if (ch === "," && depth === 0) {
      parts.push(cur)
      cur = ""
    } else cur += ch
  }
  parts.push(cur)
  for (const one of parts) {
    const s = one.trim()
    assert.ok(s.startsWith(".vmt-") || s.startsWith(":where(.vmt-root)") || s.startsWith(":where(.dark) .vmt-root"), "unscoped selector: " + s)
  }
}
assert.ok(css.includes("prefers-reduced-motion"), "CSS honours reduced motion")
assert.ok(src.includes('motion: "(prefers-reduced-motion: no-preference)"'), "GSAP choreography only runs with motion allowed")
assert.ok(css.includes("@container"), "layout answers the component's width, not the window")
assert.ok(css.includes(".vmt-page{container-type:inline-size"), "the container is the page, so the drawer and lightbox stay viewport-fixed")
assert.ok(css.includes(":where(.dark) .vmt-root"), "dark mode follows a .dark ancestor")

// Preflight: images and canvases must not be clamped.
for (const cls of ["vmt-hero-img", "vmt-ex-img", "vmt-visit-img", "vmt-art-img", "vmt-drawing"])
  assert.ok(new RegExp("\\." + cls + "\\{[^}]*max-width:none").test(css), cls + " guards max-width")
assert.ok(/\.vmt-lb-media img\{[^}]*max-width:none/.test(css), "lightbox image guards max-width")
assert.ok(/\.vmt-sketch-cv\{[^}]*max-width:none/.test(css), "sketch canvas guards max-width")
assert.ok(/\.vmt-sketch-flat\{[^}]*max-width:none/.test(css), "sketch fallback guards max-width")
// Resets must not outrank component classes (that once hid the hero CTA label).
assert.doesNotMatch(css, /(^|[},])\s*\.vmt-root (a|button|p|ul|img)\b/, "element resets go through :where()")

// 21st's CLI tokenizer hangs on generics before the first JSX close tag.
const head = src.slice(0, src.indexOf("</"))
assert.doesNotMatch(head, /use(State|Ref|Memo|Callback)<|Partial<|Record<|Array<|Map<|React\.[A-Za-z]+<|\[K in /, "no generics before the JSX")

// Runtime hygiene.
assert.ok(src.includes('img.crossOrigin = "anonymous"'), "the study's photo is read cross-origin")
assert.ok(src.includes('setState("flat")'), "a tainted or failed photo falls back to a duotone")
assert.ok(src.includes("Math.min(window.devicePixelRatio || 1, 2)"), "cap DPR at 2")
for (const gone of ['hang.removeEventListener("pointermove", onMove)', 'window.removeEventListener("resize", onResize)', "slideTl.current?.kill()", "ro.disconnect()", "cancelAnimationFrame(raf)", "clearInterval(id)", "tw.kill()", 'document.removeEventListener("keydown", onKey)', 'document.removeEventListener("pointerdown", onDown)'])
  assert.ok(src.includes(gone), "cleanup is missing " + gone)
for (const m of src.matchAll(/https:\/\/([a-z0-9.-]+)\//g))
  assert.ok(["images.unsplash.com", "fonts.googleapis.com"].includes(m[1]), "unexpected host " + m[1])
assert.ok(/aria-modal="true"/.test(src) && src.includes('e.key === "Escape"'), "the lightbox is a modal that Escape closes")
assert.ok(src.includes("aria-expanded={open}"), "accordion buttons expose their state")
// The fixed layers sit outside the container, or position: fixed would bind to it.
assert.ok(src.indexOf('className="vmt-cursor"') > src.indexOf("</footer>") && src.indexOf('className="vmt-lb"') > src.indexOf("</footer>"), "cursor and lightbox live outside .vmt-page")
// The lightbox morphs from the thumbnail it was opened from and flies back on close.
assert.ok(src.includes("fromRect.current = from ? from.getBoundingClientRect() : null"), "opening records the thumbnail rect")
assert.ok(/scaleX: r\.width \/ to\.width/.test(src), "the morph scales between the two rects")
// The welcome drawing is laid down by an ink mask that defaults to fully drawn.
assert.ok(css.includes("var(--ink,1)"), "the ink mask is finished without JavaScript")

// ---- the lifted logic ---------------------------------------------------------------
const region = (name) => {
  const start = src.indexOf("// #region " + name)
  const end = src.indexOf("// #endregion", start)
  assert.ok(start > -1 && end > start, name + " region markers missing")
  return src.slice(start, end)
}
const lift = (names, exports) =>
  import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(names.map(region).join("\n")) + "\nexport { " + exports + " }"))

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const HOURS = [[11, 17], null, [10, 17], [10, 17], [10, 17], [10, 17], [10, 17]]
{
  const H = await lift(["hours"], "fmtHour, openState, groupHours")
  assert.equal(H.fmtHour(10), "10 am")
  assert.equal(H.fmtHour(17.5), "5:30 pm")
  assert.equal(H.fmtHour(12), "12 pm")
  assert.equal(H.fmtHour(0), "12 am")
  assert.equal(H.fmtHour(9.25), "9:15 am")

  // 2026-10-27 is a Tuesday
  const at = (d, h, m = 0) => new Date(2026, 9, 25 + d, h, m)
  assert.deepEqual(H.openState(HOURS, at(2, 12), DAYS), { open: true, label: "Open today · 10 am – 5 pm" })
  assert.equal(H.openState(HOURS, at(2, 9), DAYS).label, "Opens today at 10 am")
  assert.equal(H.openState(HOURS, at(2, 17), DAYS).open, false, "closing time is closed")
  assert.equal(H.openState(HOURS, at(2, 18), DAYS).label, "Closed now · opens tomorrow at 10 am")
  assert.equal(H.openState(HOURS, at(1, 12), DAYS).label, "Closed now · opens tomorrow at 10 am", "Monday is closed")
  assert.equal(H.openState(HOURS, at(0, 18), DAYS).label, "Closed now · opens Tuesday at 10 am", "skips the closed Monday")
  assert.equal(H.openState([null, null, null, null, null, null, null], at(0, 12), DAYS).label, "Closed")

  assert.deepEqual(H.groupHours(HOURS, DAYS).map((r) => r.days + " | " + r.hours), [
    "Monday | Closed",
    "Tuesday – Saturday | 10 am – 5 pm",
    "Sundays | 11 am – 5 pm",
  ])
  const two = H.groupHours([[11, 16], null, null, [11, 17], [11, 20], [11, 17], [11, 17]], DAYS)
  assert.deepEqual(two.map((r) => r.days), ["Monday and Tuesday", "Wednesday", "Thursday", "Friday and Saturday", "Sundays"])
  assert.equal(two.flatMap((r) => r.indices).length, 7, "every day lands in exactly one row")
}

{
  const S = await lift(["sketch"], "toGray, boxBlur, dodge, sketchCoverage")
  assert.equal(S.dodge(200, 200), 255, "flat tone dodges to paper")
  assert.ok(S.dodge(40, 200) < 255, "an edge darker than its surroundings keeps graphite")
  const w = 40
  const h = 30
  const flat = (v) => {
    const a = new Uint8ClampedArray(w * h * 4)
    for (let i = 0; i < w * h; i++) a.set([v, v, v, 255], i * 4)
    return a
  }
  const b = S.boxBlur(S.toGray(flat(128), w, h), w, h, 3)
  assert.ok(b.every((v) => Math.abs(v - 128) < 1e-3), "blur keeps a flat field flat")
  const white = S.sketchCoverage(flat(255), w, h, 3, 2.6, 0)
  assert.ok(white.every((v) => v === 0), "white paper stays clean")
  // a dark square on white: graphite on its edge, the corners faded to paper
  const sq = flat(255)
  for (let y = 10; y < 20; y++) for (let x = 15; x < 25; x++) sq.set([0, 0, 0, 255], (y * w + x) * 4)
  const c = S.sketchCoverage(sq, w, h, 3, 2.6, 0.4)
  assert.ok(c.every((v) => v >= 0 && v <= 1 && Number.isFinite(v)), "coverage stays in 0–1")
  assert.ok(c[10 * w + 15] > 0.3, "the square's edge carries graphite")
  assert.equal(c[0], 0, "corners fade to paper")
}

{
  const P = await lift(["paging"], "wrap, splitWords, nextShown")
  assert.equal(P.wrap(-1, 3), 2)
  assert.equal(P.wrap(3, 3), 0)
  assert.equal(P.wrap(5, 0), 0)
  assert.deepEqual(P.splitWords("  Masterpieces of   the Department "), ["Masterpieces", "of", "the", "Department"])
  assert.equal(P.nextShown(6, 6, 12), 12)
  assert.equal(P.nextShown(6, 6, 9), 9, "never past the end")
  assert.equal(P.nextShown(3, 0, 9), 4, "a zero page size still moves")
}

// ---- demos -----------------------------------------------------------------------------
for (const f of readdirSync(dir).filter((f) => f.startsWith("demo"))) {
  const demo = readFileSync(new URL(f, dir), "utf8")
  const di = [...demo.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
  assert.deepEqual(di, ["@/components/ui/" + slug], f + " imports only the installed path")
  assert.ok(demo.includes('className="w-full"'), f + ": wrapper keeps full width")
}
const tsconfig = readFileSync(new URL("tsconfig.json", root), "utf8")
assert.ok(tsconfig.includes('"@/components/ui/' + slug + '"'), "tsconfig paths line missing")

console.log(slug + ": ok")
