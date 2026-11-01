// Install-safety and behaviour checks for components/huggo-tape-template.
// Run: node tests/huggo-tape-template.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const slug = "huggo-tape-template"
const root = new URL("../", import.meta.url)
const dir = new URL("components/" + slug + "/", root)
const src = readFileSync(new URL(slug + ".tsx", dir), "utf8")
const pkg = JSON.parse(readFileSync(new URL("package.json", root), "utf8"))
const tsconfig = readFileSync(new URL("tsconfig.json", root), "utf8")

// ---- install safety ------------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react", "gsap", "gsap/ScrollTrigger"], "only react and gsap")
assert.ok(pkg.dependencies?.gsap, "gsap must be declared in the root package.json")
assert.match(src, /gsap\.registerPlugin\(ScrollTrigger\)/, "ScrollTrigger is registered")
for (const f of readdirSync(dir))
  assert.ok(new RegExp("^(" + slug + "\.tsx|demo(-[a-z0-9-]+)?\.tsx|README\.md)$").test(f), "unexpected file in the folder: " + f)
assert.ok(tsconfig.includes('"@/components/ui/' + slug + '": ["./components/' + slug + "/" + slug + '.tsx"]'), "tsconfig paths line")

assert.ok(src.includes('height = "100svh"'), "stage height defaults to a definite length")
assert.ok(src.includes('"--h": height'), "the height prop feeds --h")
assert.doesNotMatch(src, /className=["'][^"']*\bh-full\b/, "no h-full")
assert.doesNotMatch(src, /pin:\s*true/, "no ScrollTrigger pinning (it rewrites React's DOM)")
assert.ok(src.includes("ctx.revert()"), "every trigger and tween is reverted on unmount")
assert.ok(src.includes("ctxRef.current.add("), "click-time tweens join the context")
assert.doesNotMatch(src, /@import/, "no @import")
assert.ok(src.includes("{fontHref && <link rel=\"stylesheet\" href={fontHref} />}"), "fontHref null loads nothing")
for (const m of src.matchAll(/https?:\/\/([a-z0-9.-]+)\//g))
  assert.ok(["fonts.googleapis.com", "www.w3.org"].includes(m[1]), "unexpected host " + m[1] + " (the page must stay self-contained)")

// Only the five semantic tokens may be assumed from the host page.
const allowed = ["--color-background", "--color-foreground", "--color-muted-foreground", "--color-border", "--color-primary"]
for (const m of src.matchAll(/var\((--color-[a-z-]+)/g)) assert.ok(allowed.includes(m[1]), "unknown host token " + m[1])

// ---- the scoped CSS string --------------------------------------------------------
const css = src.match(/const CSS = `([\s\S]*?)`/)[1].replace(/\/\*[\s\S]*?\*\//g, "")
assert.doesNotMatch(css, /\$\{/, "no ${ in the CSS string")
for (const bad of [/(^|[},])\s*\*\s*\{/, /(^|[},])\s*body\s*\{/, /:root/, /(^|[},])\s*html\s*\{/])
  assert.doesNotMatch(css, bad, "no bare resets in the CSS: " + bad)
for (const rule of css.matchAll(/(?:^|[{}])\s*(?!@)([^{}\s][^{}]*)\{/g)) {
  const sel = rule[1].trim()
  if (!sel || /^(from|to|\d+%)/.test(sel)) continue
  for (const one of sel.split(/,(?![^(]*\))/)) assert.ok(one.trim().startsWith(".ht-"), "unscoped selector: " + one.trim())
}
assert.ok(css.includes("container:ht/inline-size") && css.includes("@container ht (max-width:720px)"), "layout answers the component's width")

// Reduced motion: no preloader, no tall scroll stage, and GSAP only choreographs with motion allowed.
const reduced = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"))
for (const s of [".ht-pre{display:none}", ".ht-mask{height:auto}", ".ht-mask-stage{position:relative}"])
  assert.ok(reduced.includes(s), "reduced motion: " + s)
assert.ok(src.includes('mm.add("(prefers-reduced-motion: no-preference)"'), "choreography only runs with motion allowed")
assert.ok(src.includes("mm.add(REDUCE"), "reduced motion still gets a finished page")
assert.ok(/mm\.add\(REDUCE[\s\S]*?drawTape\(true\)[\s\S]*?progress\(1\)/.test(src), "reduced motion lays the whole strip and shows the peeled wall")

// The preloader is hidden until JS shows it, so a page without JS never stays orange.
assert.ok(/\.ht-pre\{[^}]*visibility:hidden/.test(css), "preloader hidden by default")
assert.ok(src.includes("gsap.set(pre, { autoAlpha: 1 })"), "JS reveals the preloader")

// Preflight: svg art must not be clamped by max-width:100%.
for (const cls of ["ht-badge", "ht-hill", "ht-lemon-svg", "ht-gift-bow", "ht-bn-svg", "ht-mask-svg", "ht-daisy"])
  assert.ok(new RegExp("\." + cls + "\{[^}]*max-width:none").test(css), cls + " guards max-width")

// The 3D roll shades its own facets in CSS from --spin; JS only moves it.
assert.ok(css.includes("--a:calc(var(--i) * 11.25deg + var(--spin,0deg))"), "facet angle follows --spin")
assert.ok(css.includes("cos(var(--a))"), "facet shading uses cos()")
assert.ok(src.includes('body.style.setProperty("--spin"'), "the travelling roll spins via --spin")

// 21st's CLI tokenizer hangs on generics before the first JSX close tag.
const head = src.slice(0, src.indexOf("</"))
assert.doesNotMatch(head, /use(State|Ref|Memo|Callback)<|Partial<|Record<|Array<|Map<|React\.[A-Za-z]+<|\[K in /, "no generics before the JSX")

// ---- runtime hygiene & a11y --------------------------------------------------------
for (const gone of ["gsap.ticker.remove(tick)", 'h1.removeEventListener("pointerover", onOver)', 'ScrollTrigger.removeEventListener("refreshInit", onInit)', "ro.disconnect()", "for (const fn of cleanups) fn()"])
  assert.ok(src.includes(gone), "cleanup is missing " + gone)
assert.ok(src.includes('aria-label={headline.join(" ")}'), "the split headline still reads as one heading")
assert.ok(src.includes('aria-live="polite"'), "bag count and sign-up speak their changes")
assert.ok(src.includes('<p className="ht-sr">{marquee.join(". ")}</p>'), "the marquee text is available to screen readers")

// ---- the badge outline, executed --------------------------------------------------
const start = src.indexOf("// #region badge")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "badge region markers missing")
const js = stripTypeScriptTypes(src.slice(start, end)) + "\nexport { scallop }"
const { scallop } = await import("data:text/javascript," + encodeURIComponent(js))
const d = scallop(46, 3.6, 14)
assert.equal((d.match(/Q/g) || []).length, 14, "one curve per bump")
assert.ok(d.startsWith("M106.00 60.00") && d.endsWith("Z"), "starts at angle 0 and closes")
const nums = d.match(/-?\d+\.\d+/g).map(Number)
for (let i = 0; i < nums.length; i += 2) {
  const r = Math.hypot(nums[i] - 60, nums[i + 1] - 60)
  assert.ok(r >= 45.99 && r <= 46 + 3.6 * 2 + 0.01, "every point sits between the circle and the bump tip")
}

console.log("huggo-tape-template: ok")
