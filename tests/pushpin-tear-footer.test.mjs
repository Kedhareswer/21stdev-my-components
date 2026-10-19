// Runnable check for components/pushpin-tear-footer: the tear, the flaps, the
// rip and re-rip timing, the stat counter and colour maths, plus the
// install-safety rules.
// Run: node tests/pushpin-tear-footer.test.mjs
//
// What breaks silently here: a ridge that climbs over the poster's own text
// (white ink on white paper, every check still green), a rip that never quite
// finishes so the sheet keeps a sliver of blue across the bottom, a flap whose
// path has a NaN in it (it just doesn't draw), a re-rip whose two tears have
// different x positions (the morph slides sideways), and "50,5%" counting up
// as "50.5%" or "505%".
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const read = (file) =>
  readFileSync(new URL("../components/pushpin-tear-footer/" + file, import.meta.url), "utf8").replace(/\r\n/g, "\n")
const src = read("pushpin-tear-footer.tsx")

const start = src.indexOf("// #region tear")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "tear region markers missing")
const T = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))

// ---- the tear is deterministic and stays clear of the poster ------------------
{
  assert.deepEqual(T.makeTear(7), T.makeTear(7), "same seed, same tear")
  assert.notDeepEqual(T.makeTear(7).ys, T.makeTear(8).ys, "a new seed is a new edge")
  assert.equal(T.XS.length, T.RIDGE_N)
  for (let i = 1; i < T.XS.length; i++) assert.ok(T.XS[i] > T.XS[i - 1], "ridge x runs left to right")
  assert.ok(T.XS[0] < 0 && T.XS[T.XS.length - 1] > 1, "the ridge runs past both edges, so no corner is left uncovered")

  for (let seed = 0; seed < 400; seed++) {
    const t = T.makeTear(seed)
    assert.equal(t.ys.length, T.RIDGE_N)
    t.ys.forEach((y, i) => {
      const x = T.XS[i]
      assert.ok(Number.isFinite(y), "seed " + seed + ": NaN in the ridge")
      assert.ok(y >= T.ridgeFloor(x), "seed " + seed + ": the ridge climbs over the poster at x=" + x.toFixed(2))
      assert.ok(y <= 0.8, "seed " + seed + ": the ridge drops into the paper's own text")
    })
    // the side stats (x < .25 / x > .75, down to y≈.47) stay on the sheet
    t.ys.forEach((y, i) => {
      if (Math.abs(T.XS[i] - 0.5) >= 0.25) assert.ok(y >= 0.5, "a side stat would sit on the paper")
    })
    assert.ok(t.rim.every((r) => r >= 1 && r <= 5), "the fibre rim is a few pixels")
    assert.ok(t.lag.every((l) => l >= 0 && l <= 0.48), "every point starts ripping in time to finish")
    assert.equal(t.flaps.length, T.FLAPS)
    for (const f of t.flaps) {
      assert.ok(f.at >= 0 && f.at + f.span <= T.RIDGE_N - 1, "a flap hangs off the ridge, not past its end")
      assert.ok(f.dir === 1 || f.dir === -1)
      assert.ok(f.len > 0 && f.len < 0.13, "flaps are curls, not sheets")
    }
    assert.equal(t.flaps.filter((f) => f.dir < 0).length, 2, "two flaps curl back over the sheet")
  }
  // the rip starts under the pin and spreads outwards
  const t = T.makeTear(7)
  const mid = t.lag[Math.floor(T.RIDGE_N / 2)]
  assert.ok(mid < t.lag[0] && mid < t.lag[T.RIDGE_N - 1], "centre rips first")
  assert.equal(T.ridgeFloor(0.5), 0.39)
  assert.equal(T.ridgeFloor(0.05), 0.5)
}

// ---- the opening rip: whole sheet → finished tear -----------------------------
{
  const t = T.makeTear(11)
  assert.ok(T.introYs(t, 0).every((y) => y >= 1), "at t=0 the sheet is whole")
  assert.deepEqual(T.introYs(t, 1).map((y) => +y.toFixed(9)), t.ys.map((y) => +y.toFixed(9)), "at t=1 it is exactly the tear")
  for (const f of t.flaps) {
    assert.equal(T.flapOpen(t, f, 0), 0, "flaps start folded")
    assert.ok(Math.abs(T.flapOpen(t, f, 1) - 1) < 1e-9, "and finish open")
  }
  assert.equal(T.easeTear(0), 0)
  assert.equal(T.easeTear(1), 1)
  assert.equal(T.easeTear(NaN), 0, "a bad clock is time zero")
  let peak = 0
  for (let x = 0; x <= 1; x += 0.01) peak = Math.max(peak, T.easeTear(x))
  assert.ok(peak > 1 && peak < 1.12, "a small overshoot, not a bounce: " + peak)

  // re-rip: from one tear to the next, ending exactly on the new one
  const a = T.makeTear(3)
  const b = T.makeTear(4)
  assert.deepEqual(T.morphYs(a.ys, b, 0), a.ys, "the morph starts on the old edge")
  T.morphYs(a.ys, b, 1).forEach((y, i) => assert.ok(Math.abs(y - b.ys[i]) < 1e-9, "and ends on the new one"))
  for (let p = 0; p <= 1; p += 0.05) {
    T.morphYs(a.ys, b, p).forEach((y, i) => {
      const lo = Math.min(a.ys[i], b.ys[i]) - 1e-9
      const hi = Math.max(a.ys[i], b.ys[i]) + 1e-9
      assert.ok(y >= lo && y <= hi, "mid-morph the edge stays between the two tears")
    })
  }
}

// ---- flaps and paths are finite, closed and the right shape --------------------
{
  const t = T.makeTear(19)
  const W = 1280
  const H = 800
  for (const f of t.flaps) {
    const pts = T.flapPoly(t.ys, f, W, H, 1)
    assert.equal(pts.length, f.span + 1 + 5, "ridge segment, two jagged sides, one tip")
    assert.ok(pts.flat().every(Number.isFinite), "NaN in a flap")
    const tip = pts[f.span + 3]
    const top = (t.ys[f.at] + t.ys[f.at + f.span]) / 2 * H
    assert.ok(f.dir > 0 ? tip[1] > top : tip[1] < top, "the tip hangs the way the flap curls")
    // folded shut, the flap collapses onto its own edge
    const shut = T.flapPoly(t.ys, f, W, H, 0)
    const ry = shut.slice(f.span + 1).map((p) => p[1])
    assert.ok(Math.max(...ry) - Math.min(...ry) <= Math.abs(t.ys[f.at] - t.ys[f.at + f.span]) * H + 1e-6, "a shut flap has no area off the ridge")
    const d = T.polyD(pts)
    assert.match(d, /^M[\d.\- ]+(L[\d.\- ]+)+Z$/, "a flap is one closed polygon")
  }
  assert.equal(T.polyD([]), "")
  const d = T.sheetD(t.ys, W, H, t.rim)
  assert.ok(d.startsWith("M-20 -20L1300 -20") && d.endsWith("Z"), "the sheet covers the top edge past both corners")
  assert.doesNotMatch(d, /NaN|Infinity/)
  assert.equal(d.match(/L/g).length, T.RIDGE_N + 1, "one vertex per ridge point")
}

// ---- stats count up in their own format ---------------------------------------
{
  assert.deepEqual(T.parseStat("50,5%"), { pre: "", post: "%", n: 50.5, dec: ",", decimals: 1, group: "" })
  assert.equal(T.parseStat("1,200").n, 1200, "three digits after a comma are thousands")
  assert.equal(T.parseStat("1,200").group, ",")
  assert.equal(T.parseStat("€3.450,75").n, 3450.75)
  assert.equal(T.parseStat("no digits"), null)
  assert.equal(T.formatStat("50,5%", 1), "50,5%", "finished is the string as written")
  assert.equal(T.formatStat("50,5%", 0), "0,0%")
  assert.equal(T.formatStat("50,5%", 0.5), "25,3%", "comma decimals stay commas")
  assert.equal(T.formatStat("12,745,012", 0.5), "6,372,506")
  assert.equal(T.formatStat("x", 0.3), "x", "unparseable values are shown as-is")
  assert.equal(T.formatStat("86,2%", NaN), "0,0%")
}

// ---- colour --------------------------------------------------------------------
{
  assert.equal(T.mixHex("#000000", "#ffffff", 0.5), "#808080")
  assert.equal(T.mixHex("#1a7ff0", "#1a7ff0", 0.3), "#1a7ff0")
  assert.equal(T.mixHex("#fff", "#000", 0), "#ffffff", "short hex expands")
  assert.equal(T.mixHex("#123456", "#abcdef", 7), "#abcdef", "t is clamped")
  assert.equal(T.rng(1)(), T.rng(1)())
  const r = T.rng(5)
  for (let i = 0; i < 1000; i++) {
    const v = r()
    assert.ok(v >= 0 && v < 1)
  }
}

// ---- install safety ----------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "the only import may be react")

const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1")
assert.doesNotMatch(code, /@import/, "no @import — the host owns Tailwind and fonts")
assert.doesNotMatch(code, /["+]\s*(\*|body|:root|html)\s*{/, "no bare global resets")
assert.doesNotMatch(code, /[`]/, "no backticks — CSS is built by concatenation")
assert.doesNotMatch(code, /\$\{/, "no template interpolation")
assert.doesNotMatch(code, /https?:\/\/(?!www\.w3\.org)/, "nothing is fetched")
assert.doesNotMatch(code, /innerWidth|innerHeight|scrollY/, "size from the element, not the window")
assert.doesNotMatch(code, /\bh-(full|screen)\b/, "no percentage-height classes")
assert.doesNotMatch(code, /localStorage|sessionStorage/, "no storage")

// No generics before the first JSX close tag: 21st's parser reads <T> as JSX.
const firstClose = src.indexOf("</")
assert.ok(firstClose > 0)
assert.doesNotMatch(src.slice(0, firstClose), /\w<[A-Z"(]/, "a generic before the first JSX close tag")

// Every rule is scoped under the component's own prefix.
const css = src.slice(src.indexOf("const CSS ="), src.indexOf("const DEFAULT_SOCIALS"))
for (const m of css.matchAll(/"([^"]*)\{/g)) {
  for (const part of m[1].replace(/^.*\}/, "").split(",")) {
    const sel = part.trim()
    if (!sel || sel.startsWith("@")) continue
    assert.ok(/^(\.tpf|:where\(\.tpf\)|from|to|\d+%)/.test(sel), "unscoped CSS rule: " + sel)
  }
}
assert.ok(!/"\.tpf (a|button|input)\{/.test(css), "element resets go through :where(.tpf)")
assert.ok(css.includes(":where(.tpf) button{"), "buttons are reset at zero specificity")

// Height: a definite default, never a percentage chain.
assert.ok(src.includes('height = "100svh"'), "explicit height prop with a definite default")
assert.ok(css.includes("container-type:size"), "sizes come off the component, not the viewport")
assert.ok(css.includes("min-height:620px"), "never squashed below a readable poster")
assert.ok(css.includes("@container (max-width: 620px)"), "a designed phone layout")

// Preflight: the stage, the pin and every icon opt out of max-width.
for (const cls of [".tpf-stage{", ".tpf-ico{", ".tpf-pin-svg{", ".tpf-seal{", ".tpf-mark{"]) {
  const rule = css.slice(css.indexOf(cls), css.indexOf("}", css.indexOf(cls)))
  assert.ok(rule.includes("max-width:none"), cls + " needs max-width:none")
}

// Assembly never fights an element's own centring transform.
assert.ok(css.includes(".tpf:not(.s1) .tpf-h{opacity:0;translate:0 10px"), "hidden HUD offsets with translate, not transform")
assert.ok(css.includes(".tpf:not(.s3) .tpf-p{opacity:0;translate:0 18px"))

// Motion.
assert.ok(src.includes("prefers-reduced-motion"), "reads prefers-reduced-motion")
assert.ok(css.includes("@media (prefers-reduced-motion: reduce){"), "and stops the CSS animation")
assert.ok(src.includes("const still = reduced || calm"), "the calm switch is the same still state")
assert.ok(src.includes('s.mode = still ? "rest" : "morph"'), "a still re-tear jumps, never animates")
assert.ok(src.includes("new IntersectionObserver"), "the opening waits until it is seen")

// Cleanup.
for (const gone of ["io.disconnect()", "ro.disconnect()", "cancelAnimationFrame(s.raf)", "cancelAnimationFrame(raf)", "clearTimeout(id)", 'removeEventListener("change", onMq)']) {
  assert.ok(src.includes(gone), "cleanup is missing " + gone)
}

// Accessibility.
assert.ok(src.includes('role="switch"') && src.includes("aria-checked={calm}") && src.includes("aria-checked={sub}"), "the switches are switches")
assert.ok(src.includes('role="radiogroup"') && src.includes("aria-checked={!inverted}"), "the swatches are a radio group")
assert.ok(src.includes('aria-label="Re-pin: tear a new edge"'), "the pin says what it does")
assert.ok(src.includes('aria-label="Back to top"'))
assert.ok(src.includes('htmlFor={uid + "e"}'), "the email field is labelled")
assert.ok(src.includes('role="status" aria-live="polite"'), "the toast is announced")
assert.ok(src.includes('<svg ref={svgRef} className="tpf-stage" aria-hidden="true">'), "the paper art is decoration")
assert.ok(src.includes('if (!href || href === "#") e.preventDefault()'), "\"#\" links never rewrite the host page's hash")

// Defaults match the reference.
assert.ok(src.includes('brand = "adv."'))
assert.ok(src.includes('switchLabels = ["àcc", "súb"]'))
assert.ok(src.includes('value: "50,5%"'))

// A demo wrapper left at width:auto collapses inside 21st's centring flex.
for (const f of ["demo.tsx", "demo-ember.tsx"]) {
  const demo = read(f)
  assert.ok(demo.includes('from "@/components/ui/pushpin-tear-footer"'), f + " imports the installer path")
  for (const cls of demo.match(/className="[^"]*"/g) ?? []) assert.ok(/\bw-(full|screen|\[|\d)/.test(cls), f + ": " + cls + " has no width")
}

// tsc needs its own line per component.
const tsconfig = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")
assert.ok(tsconfig.includes('"@/components/ui/pushpin-tear-footer": ["./components/pushpin-tear-footer/pushpin-tear-footer.tsx"]'), "tsconfig path missing")

console.log("pushpin-tear-footer: ok")
