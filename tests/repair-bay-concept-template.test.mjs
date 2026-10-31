// Install-safety, scene and layout checks for components/repair-bay-concept-template.
// Run: node tests/repair-bay-concept-template.test.mjs
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const slug = "repair-bay-concept-template"
const root = new URL("../", import.meta.url)
const dir = new URL("components/" + slug + "/", root)
const src = readFileSync(new URL(slug + ".tsx", dir), "utf8").replace(/\r\n/g, "\n")
const pkg = JSON.parse(readFileSync(new URL("package.json", root), "utf8"))

// ---- install safety ------------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react", "gsap", "gsap/ScrollTrigger"], "only react and gsap")
assert.ok(pkg.dependencies?.gsap, "gsap is declared in the root package.json")
assert.match(src, /gsap\.registerPlugin\(ScrollTrigger\)/, "ScrollTrigger is registered")
assert.doesNotMatch(src, /pin:\s*true/, "no ScrollTrigger pinning: the stage is CSS-sticky")
assert.ok(src.includes("ctx.revert()"), "the scroll context is reverted on unmount")
assert.ok(src.includes('height = "100svh"') && src.includes('"--h": height'), "height defaults to a definite length and feeds --h")
assert.doesNotMatch(src, /className=["'][^"']*\bh-full\b/, "no h-full")
assert.doesNotMatch(src, /@import/, "no @import")
assert.ok(src.includes("{fontHref && <link rel=\"stylesheet\" href={fontHref} />}"), "fontHref null loads nothing")
assert.doesNotMatch(src.replace(/\/\/.*$/gm, "").replace(/const RB_FONTS =\s*"[^"]+"/, ""), /https?:\/\//, "nothing else is fetched: the scene is drawn here")
assert.doesNotMatch(src, /console\./, "no debug logging ships")
for (const gone of [
  'mq.removeEventListener("change", on)',
  'stage.removeEventListener("pointermove", onMove)',
  'window.removeEventListener("keydown", onKey)',
  "cancelAnimationFrame(raf)",
  "html.style.overflow = prev",
])
  assert.ok(src.includes(gone), "cleanup is missing " + gone)
assert.doesNotMatch(
  src.slice(0, src.indexOf("</")),
  /use(State|Ref|Memo|Callback)<|Partial<|Record<|Array<|Map<|Promise<|Exclude<|Omit<|React\.[A-Za-z]+<|\[K in /,
  "no generics before the first JSX close tag (the 21st CLI tokenizer hangs on them)",
)
const files = readdirSync(dir).sort()
assert.deepEqual(files, ["README.md", "demo-drawn.tsx", "demo.tsx", slug + ".tsx"], "folder holds only the component, demos and README")
// The rendered demo embeds its images: 21st's capture refuses off-origin requests.
const photos = readFileSync(new URL("demo.tsx", dir), "utf8")
assert.doesNotMatch(photos, /https?:\/\//, "demo.tsx fetches nothing")
assert.equal((photos.match(/"data:image\/avif;base64,/g) || []).length, 4, "scene, poster, cut-out and close-up are embedded")
for (const prop of ["sceneImage={SCENE}", "posterImage={POSTER}", "posterCutout={CUTOUT}", "fx={fx}", "src: MECHANIC"]) assert.ok(photos.includes(prop), "demo.tsx passes " + prop)
for (const f of files.filter((f) => f.startsWith("demo"))) {
  const d = readFileSync(new URL(f, dir), "utf8")
  const di = [...d.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
  assert.deepEqual(di, ["@/components/ui/" + slug], f + ": imports only the component")
  assert.match(d, /className="w-full"/, f + ": full width inside 21st's flex wrapper")
  assert.ok(Buffer.byteLength(d) < 200_000, f + " is under 21st's 200,000-byte demo limit")
}
assert.ok(readFileSync(new URL("tsconfig.json", root), "utf8").includes('"@/components/ui/' + slug + '"'), "tsconfig paths line exists")

// ---- scoped CSS: prefixed selectors, no resets, no template holes ----------------
const cssAll = [...src.matchAll(/const RB_[A-Z_]*CSS = `([\s\S]*?)`/g)].map((m) => m[1]).join("\n")
assert.ok(cssAll.length > 5000, "the CSS string was found")
assert.doesNotMatch(cssAll, /\$\{/, "no ${ in the CSS string")
const css = cssAll.replace(/\/\*[\s\S]*?\*\//g, "")
for (const m of css.matchAll(/(?<=^|[{}])\s*([^{}@]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (/^(from|to|[\d.]+%)/.test(sel)) continue
  for (const part of sel.split(",")) assert.match(part.trim(), /^\.rb-/, "unscoped selector: " + part)
}
assert.ok(css.includes("max-width:none"), "svgs are guarded against Preflight")
assert.ok(css.includes(".rb-cam>svg{"), "only the stage's own svgs are stretched, not the HUD and icons inside it")
assert.ok(css.includes(".rb-root :where(button)"), "the button reset has no more weight than the button styles")
const rm = css.slice(css.indexOf("@media (prefers-reduced-motion:reduce)"))
for (const cls of ["rb-glow", "rb-caustic", "rb-shot", "rb-jelly", "rb-tent", "rb-swing", "rb-dust", "rb-steam", "rb-spark", "rb-wave", "rb-fan", "rb-grain"])
  assert.ok(rm.includes("." + cls), "reduced motion forgets ." + cls)
// Per-instance switches must be custom properties: <use> clones ignore class selectors from their host.
for (const v of ["var(--rb-play,running)", "var(--rb-lamp,1)", "var(--rb-sparks,1)", "var(--rb-dark,0)"])
  assert.ok(css.includes(v), "scene switch " + v + " is a custom property")

// ---- the art region, executed ---------------------------------------------------
const a = src.indexOf("// #region art\n")
const b = src.indexOf("// #endregion", a)
assert.ok(a > -1 && b > a, "art region missing")
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(a, b))))

const g1 = L.rbRng(7)
const g2 = L.rbRng(7)
const seq = Array.from({ length: 200 }, () => g1())
assert.deepEqual(seq, Array.from({ length: 200 }, () => g2()), "same seed, same sequence")
assert.ok(seq.every((v) => v >= 0 && v < 1), "rng in [0, 1)")

assert.match(L.rbCable(0, 40, 600, 60, 80), /^M0 40 Q300 \d+(\.\d)? 600 60$/, "a cable is one quadratic sag")
assert.match(L.rbBell(40), /^M-40 0 C.*Z$/, "a bell is a closed path")
assert.match(L.rbTentacle(0, 100, 5), /^M0 0 C/, "a tentacle hangs from its root")

const win = { x: 230, y: 92, w: 1140, h: 548 }
const jel = L.rbJellies(11, win)
assert.deepEqual(L.rbJellies(11, win), jel, "jellyfish are deterministic")
assert.ok(jel.length >= 8 && jel[0].r > jel[1].r, "one giant jellyfish behind the swarm")
for (const j of jel) assert.ok(j.x >= win.x && j.x <= win.x + win.w && j.y >= win.y && j.y <= win.y + win.h, "jellyfish live in the tank")
const dust = L.rbDust(5, 70)
assert.equal(dust.length, 70)
assert.ok(dust.every((m) => m.x > 0 && m.x < L.RB_W && m.y > 0 && m.y < L.RB_H), "dust is inside the scene")
for (const box of L.rbShelf(1, 18, 300, 190, 70)) assert.ok(box.x >= 18 && box.x + box.w <= 208 && box.y + box.h === 300, "boxes sit on the shelf")

assert.equal(L.rbTimecode(0), "00:00:00:00")
assert.equal(L.rbTimecode(3725.5), "01:02:05:12")

// The viewer's camera: 16:9, contains the crop, never leaves the scene.
for (const c of [{ x: 10, y: 250, size: 300 }, { x: 1300, y: 560, size: 320 }, { x: 700, y: 300, size: 300 }, { x: 0, y: 0, size: 900 }]) {
  const v = L.rbFitView(c, 16 / 9)
  assert.ok(Math.abs(v.w / v.h - 16 / 9) < 0.01, "16:9 view")
  assert.ok(v.x >= 0 && v.y >= 0 && v.x + v.w <= L.RB_W + 0.1 && v.y + v.h <= L.RB_H + 0.1, "view stays in the scene")
  assert.ok(v.x <= c.x + 0.1 && v.y <= c.y + 0.1 && v.x + v.w >= Math.min(L.RB_W, c.x + c.size) - 0.1 && v.y + v.h >= Math.min(L.RB_H, c.y + c.size) - 0.1, "view contains the crop")
}
assert.equal(L.rbView({ x: 1, y: 2, w: 3, h: 4 }), "1 2 3 4")

// ---- structure ---------------------------------------------------------------
for (const id of ['"-L0"', '"-L1"', '"-L2"', '"-L3"', '"-scene"']) assert.ok(src.includes("id={p + " + id + "}"), "layer " + id + " is defined once in defs")
assert.ok(src.includes("sceneImage") && src.includes("<image href={image}"), "a real render can replace the drawn scene")
assert.ok(src.includes('.to(pclip, { attr: { x: win.x, y: win.y, width: win.w, height: win.h }'), "the poster's clip shrinks into the window")
assert.ok(src.includes('<image href={posterCutout}') && src.indexOf('className="rb-front"') < src.indexOf('<image href={posterCutout}'), "the cut-out sits in the front layer, over the title")
assert.ok(src.indexOf('<h1 className="rb-title"') < src.indexOf('className="rb-front"') && src.indexOf('className="rb-poster rb-over"') > src.indexOf('className="rb-front"'), "title behind the cut-out, HUD bits in front of it")
assert.ok(src.includes('.fromTo(fxl, { opacity: 0 }'), "live light waits for the room, so it never floats over the poster")
assert.ok(src.includes('hue-rotate(" + md.hue + "deg)'), "moods grade the film by hue")
assert.ok(/role="dialog"[\s\S]{0,80}aria-modal="true"/.test(src), "the viewer is a modal dialog")
for (const n of ["Brass goggles", "The patient", "Chain hoist"]) assert.ok(src.includes('label: "' + n + '"'), n + " is a hotspot")

console.log(slug + ": ok")
