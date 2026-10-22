// Install-safety and logic checks for components/infinite-shot-stack.
// Run: node tests/infinite-shot-stack.test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const SLUG = "infinite-shot-stack"
const read = (file) => readFileSync(new URL(`../components/${SLUG}/${file}`, import.meta.url), "utf8").replace(/\r\n/g, "\n")
const src = read(`${SLUG}.tsx`)

/* ---------- nothing travels with it ---------- */

const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "react is the only import")
assert.doesNotMatch(src, /@import|@font-face|<link\b|fetch\(/, "no fonts or fetches")
for (const m of src.matchAll(/https?:\/\/([^/"']+)/g)) assert.equal(m[1], "images.unsplash.com", "the only host is Unsplash, for the default photos")
assert.ok(src.includes('height = "100svh"'), "height defaults to a definite length")
assert.match(src, /\["--iss-h" as string\]: height/, "the height prop reaches the root")
assert.match(src, /\.iss-frame\{position:relative;height:var\(--iss-h\)/, "the frame takes that height")
assert.match(src, /\.iss-root\[data-mode="pin"\]\{height:calc\(var\(--iss-h\) \+ var\(--iss-n\) \* 42vh\)\}/, "pinned, the run is a definite length per shot")
assert.match(src, /\.iss-root\[data-mode="pin"\] \.iss-frame\{position:sticky;top:0\}/, "and the frame sticks")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full")
for (const m of src.matchAll(/([.\w>*-]+)\{[^}]*height:100%/g)) assert.match(m[0], /position:absolute|inset:0/, `a percentage height only on absolutely placed media: ${m[1]}`)
assert.match(src, /\.iss-card img\{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;max-width:none/, "photos are guarded against Preflight")
assert.match(src, /React\.useId\(\)\.replace/, "ids are namespaced per instance")
const head = src.slice(0, src.indexOf("</"))
assert.doesNotMatch(head, /use(State|Ref|Memo|Callback)<|Partial<|Record<|Array<|Map<|Promise<|React\.[A-Za-z]+<|\[K in /, "no generics before the first JSX close tag (21st CLI tokenizer)")
assert.doesNotMatch(src, /use(State|Ref|Memo|Callback)</, "hooks are typed without <generics>")
assert.match(src, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/, "reduced motion skips the spring")
assert.doesNotMatch(src, /[—–]/, "no em or en dashes anywhere")
for (const demo of ["demo.tsx", "demo-pinned.tsx"]) {
  const d = read(demo)
  assert.doesNotMatch(d, /[—–]|https?:\/\//, `${demo}: no dashes, no URLs`)
  assert.deepEqual([...d.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1]), ["@/components/ui/" + SLUG], `${demo} imports only the component`)
}

const css = src.match(/const ISS_CSS = `([\s\S]*?)`/)
assert.ok(css, "CSS block present")
assert.doesNotMatch(css[1], /\$\{|`/, "no interpolation inside the CSS string")
assert.doesNotMatch(css[1], /url\(/, "no url() in the style block")
assert.ok(css[1].includes("prefers-reduced-motion:reduce"), "honours reduced motion in CSS")
for (const m of css[1].replace(/\/\*[\s\S]*?\*\//g, "").replace(/@media[^{]*\{/g, "").replace(/@keyframes[^{]*\{/g, "").matchAll(/(?<=^|[{}])\s*([^{}@]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (/^(from|to|[\d.,%\s]+)$/.test(sel)) continue
  for (const s of sel.split(/,(?![^(]*\))/)) assert.match(s.trim(), /^\.iss-/, `selector escapes the component: ${s.trim()}`)
}
assert.match(css[1], /\.iss-root\[data-theme="light"\]\{/, "a designed light sheet")
assert.match(css[1], /\.iss-stage\{[^}]*touch-action:pan-y/, "phones keep their vertical scroll")

/* ---------- it is usable, not a trap ---------- */

assert.match(src, /mode = "pin"/, "by default the page scroll drives it and then lets go")
assert.match(src, /if \(!stage \|\| mode !== "wheel"\) return/, "the wheel is only captured when asked for")
assert.match(src, /addEventListener\("wheel", onWheel, \{ passive: false \}\)/)
assert.match(src, /s\.axis = e\.pointerType === "mouse" \? "y" : "x"/, "touch drags sideways, so a phone can still scroll the page")
assert.match(src, /aria-roledescription="carousel"/)
assert.match(src, /tabIndex=\{front \? 0 : -1\}/, "only the front shot is in the tab order")
assert.match(src, /aria-hidden=\{!front\}/)
assert.match(src, /aria-live="polite"/, "the caption announces the new shot")
assert.match(src, /e\.key === "ArrowDown"/, "arrow keys move the deck")
assert.match(src, /window\.addEventListener\("click", stop, \{ capture: true, once: true \}\)/, "a drag never counts as a click")
assert.ok(src.indexOf("setPointerCapture") > src.indexOf("s.drag.moved = true"), "the pointer is captured only once it is a drag, so clicks reach the shots")

/* ---------- the deck, lifted out and run ---------- */

const a = src.indexOf("// #region deck\n")
const b = src.indexOf("// #endregion")
assert.ok(a > -1 && b > a, "region deck")
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(a, b))))

assert.equal(L.issWrap(-1, 9), 8)
assert.equal(L.issDepth(0, 0, 9), 0, "the first shot is in front at 0")
assert.equal(L.issDepth(1, 0, 9), 1, "the next stands behind it")
assert.ok(Math.abs(L.issDepth(0, 0.4, 9) + 0.4) < 1e-9, "moving on, the front shot is leaving")
assert.equal(L.issDepth(0, 8, 9), 1, "and it comes round again: infinite")
assert.equal(L.issDepth(8, 0, 9), 8)

const f = L.issPose(0, 6)
assert.deepEqual([f.y, f.scale, f.dim, f.alpha], [0, 1, 0, 1], "the front shot is full size, undimmed")
let prevY = 0, prevS = 1
for (let d = 1; d < 6; d++) {
  const p = L.issPose(d, 6)
  assert.ok(p.y < prevY, "each shot behind sits higher")
  assert.ok(p.scale < prevS, "and smaller")
  assert.ok(p.dim > L.issPose(d - 1, 6).dim, "and darker")
  assert.ok(prevY - p.y < (d === 1 ? 1 : L.issPose(d - 2, 6).y - L.issPose(d - 1, 6).y + 1e-9), "with gaps that shrink toward the back")
  prevY = p.y
  prevS = p.scale
}
assert.ok(L.issPose(5.5, 6).alpha === 0.5, "the last one fades in at the back")
const leaving = L.issPose(-0.5, 6)
assert.ok(leaving.y > 0 && leaving.alpha === 0.5, "a leaving shot falls and fades")

let p = 0
for (let i = 0; i < 400; i++) p = L.issStep(p, 1, 1 / 60)
assert.equal(p, 1, "the spring settles exactly on the target")
const fast = L.issStep(0, 1, 1 / 30), slow = L.issStep(0, 1, 1 / 120)
assert.ok(fast > slow, "a longer frame moves further: frame-rate independent")
assert.equal(L.issSettle(2.3, 0), 2)
assert.equal(L.issSettle(2.3, 4), 3, "a flick carries to the next shot")
assert.equal(L.issSettle(2.3, 100), 4, "but never more than a shot and a half")
assert.equal(L.issPad(7), "07")

console.log(`${SLUG}: ok`)
