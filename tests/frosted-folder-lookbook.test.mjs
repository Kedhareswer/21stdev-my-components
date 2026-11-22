// Install-safety, accessibility, motion and geometry checks for components/frosted-folder-lookbook.
// Run: node tests/frosted-folder-lookbook.test.mjs
//
// Layout and the spring motion live in the `geometry` region (no DOM); it is lifted out
// and run here as shipped, at every viewport the UI audit covers.
import assert from "node:assert/strict"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { liftRegion } from "./_component-safety.mjs"

const match = (s, re, m) => assert.ok(re.test(s), m)
const noMatch = (s, re, m) => assert.ok(!re.test(s), m)

const slug = "frosted-folder-lookbook"
const dir = new URL("../components/" + slug + "/", import.meta.url)
const src = readFileSync(new URL(slug + ".tsx", dir), "utf8").replace(/\r\n/g, "\n")
const demo = readFileSync(new URL("demo.tsx", dir), "utf8")
const readme = readFileSync(new URL("README.md", dir), "utf8")
const tsconfig = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")

// --- install safety -------------------------------------------------------
assert.deepEqual(readdirSync(dir).sort(), ["README.md", "demo.tsx", slug + ".tsx"], "folder holds only the publishable files")
assert.ok(tsconfig.includes('"@/components/ui/' + slug + '": ["./components/' + slug + "/" + slug + '.tsx"]'), "tsconfig paths line")
match(demo, /from "@\/components\/ui\/frosted-folder-lookbook"/, "demo imports the installed path")
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "React is the only import")
match(src, /height = "100svh"/, "height defaults to a definite length")
assert.ok(src.includes("height, minHeight: height"), "the root carries the height prop")
noMatch(src, /\bh-full\b/, "no h-full")
assert.ok(!/`/.test(src), "no backticks in the file")
noMatch(src, /\$\{/, "no ${ in the file")
assert.ok(!/@import/.test(src), "no @import")
noMatch(src + demo, /use(Ref|State|Memo|Callback|Reducer|Context)</, "no generic hook type arguments")
assert.ok(Buffer.byteLength(src) < 200 * 1024, "21st rejects component files over 200 kB")
assert.ok(!/var\(--color-/.test(src), "assumes no theme tokens: the scene carries its own colours")
for (const v of src.matchAll(/var\((--[a-z0-9-]+)/g)) assert.ok(v[1].startsWith("--ffl-"), "only its own variables: " + v[1])
noMatch(src, /offset(Top|Left|Width|Height)|client(Width|Height)|scrollHeight|getComputedStyle|inner(Width|Height)/, "no layout reads in the frame loop")
assert.equal((src.match(/getBoundingClientRect/g) || []).length, 1, "the only rect read is the pointer handler's")
match(src, /new ResizeObserver/, "sized from the observer")
match(src, /ro\.disconnect\(\)/, "observer cleaned up")
match(src, /cancelAnimationFrame\(m\.current\.raf\)/, "frame loop stops on unmount")
match(src, /s\.raf = still \? 0 : requestAnimationFrame\(tick\)/, "the loop sleeps once everything has settled")
noMatch(src, /cursor:\s*none/, "the system cursor is never hidden")
noMatch(src, /will-change/, "no will-change on layers that change size")

// CSS string: scoped, Preflight-guarded, honours reduced motion
const cssAt = src.indexOf("const CSS =")
const css = src.slice(cssAt, src.indexOf("\n\n", cssAt)).replace(/"\s*\+\s*\n\s*"/g, "")
let rules = 0
for (const m of css.matchAll(/(?<=^|[{}"])\s*([^{}"]+?)\s*\{/g)) {
  const sel = m[1].trim()
  if (sel.startsWith("@") || sel.startsWith("const CSS") || /^(from|to|\d)/.test(sel)) continue
  rules++
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(".ffl-")), "unscoped selector: " + sel)
}
assert.ok(rules > 30, "the scope check saw real rules, saw " + rules)
match(css, /\.ffl-root img\{max-width:none/, "images escape Preflight's max-width")
match(css, /@media \(prefers-reduced-motion:reduce\)/, "CSS honours reduced motion")
match(src, /prefers-reduced-motion: reduce/, "reduced motion is read at runtime")
match(src, /if \(s\.reduced\) \{\s*s\.S = restState\(s\.S\.prints\.length, s\.open\)\s*s\.tx = s\.ty = s\.vx = s\.vy = s\.lift = s\.vl = 0/, "reduced motion: one step, no tilt or lift")
noMatch(css, /scale\(/, "nothing is resized with transform: scale")
match(css, /\.ffl-hint\{position:absolute;left:0;right:0;margin:0 auto;width:max-content/, "the hint is centred by layout, not by a transform an active state could erase")
let imgs = 0
for (const tag of src.matchAll(/<img [^>]*>/g)) {
  imgs++
  match(tag[0], /width=\{\d+\} height=\{\d+\}/, "img carries width/height")
  match(tag[0], /maxWidth: "none"/, "img escapes Preflight inline too")
}
assert.equal(imgs, 1, "one img template")

// material: real frosted plastic over the sheets, and metal that follows the light
match(css, /\.ffl-cover\{[^}]*backdrop-filter:blur\(7px\)/, "the cover blurs what is behind it")
match(css, /\.ffl-cover\{[^}]*-webkit-backdrop-filter/, "Safari prefix present")
match(css, /\.ffl-sheen\{[^}]*var\(--ffl-lx\) var\(--ffl-ly\)/, "the sheen follows the light")
match(src, /gradRef\.current\.setAttribute\("gradientTransform"/, "the paper clip metal turns with the light")
match(src, /lightRef\.current\.setAttribute\("azimuth"/, "the wordmark's light moves")
match(src, /glossRef\.current\.setAttribute\("x"/, "the binder clip gloss moves")
match(src, /<feDisplacementMap/, "the wordmark is displaced into liquid")
match(src, /<feSpecularLighting/, "and lit like metal")

// hosted pictures: only the catalogue site, and every default file exists locally
const hosts = new Set((src.match(/https:\/\/[a-z0-9.-]+/gi) || []).map((u) => u.toLowerCase()))
assert.deepEqual([...hosts], ["https://kedhar-components.pages.dev"], "pictures come from the catalogue site only")
match(src, /const SITE = "https:\/\/kedhar-components\.pages\.dev\/frosted-folder-lookbook\/"/, "site folder is the slug")
for (const f of [1, 2, 3, 4].map((i) => "look-" + i + ".webp")) {
  assert.ok(src.includes('"' + f + '"'), "default references " + f)
  const st = statSync(new URL("../dev/public/" + slug + "/" + f, import.meta.url))
  assert.ok(st.size > 1000 && st.size < 200 * 1024, f + " exists and stays under 200 kB")
}

// nothing from the reference image survives
noMatch(src + demo + readme, /out\s*of\s*order|drop 01|unisex clothing|new york|made to move/i, "no wording from the reference")

// --- accessibility and interaction -----------------------------------------
match(src, /<button\s+type="button"\s+className="ffl-hint"/, "a real button opens it")
match(src, /aria-expanded=\{open\}/, "the button reports the state")
match(src, /aria-hidden=\{!open\}/, "sheets are hidden from assistive tech while shut")
match(src, /role="img" aria-label=\{wordmark\}/, "the wordmark has a text alternative")
match(src, /alt=\{sh\.alt \|\| sh\.title\}/, "photos carry alt text")
match(src, /if \(e\.key === "Escape"\) toggle\(false\)/, "Escape closes")
match(src, /document\.removeEventListener\("keydown", onKey\)/, "the key listener is removed")
match(src, /e\.pointerType !== "mouse" \|\| s\.reduced/, "tilt and lift follow a mouse only")
match(src, /if \(onOpenChange\) onOpenChange\(to\)/, "open changes are reported")
match(css, /\.ffl-hint:focus-visible\{outline:/, "the button shows keyboard focus")
for (const p of ["title", "subtitle", "line", "footer", "wordmark", "sheets", "openLabel", "closeLabel", "tint", "paper", "background", "defaultOpen", "onOpenChange", "height"]) {
  match(src, new RegExp("\\n  " + p + "\\??:"), "prop declared: " + p)
  assert.ok(readme.includes("`" + p + "`"), "prop documented: " + p)
}

// --- physics rules, as source --------------------------------------------------
match(src, /still = step\(s\.S, s\.open, dt\)/, "motion comes from the spring stepper, not a clock")
noMatch(src, /const DUR|easeIO|easeOut/, "no fixed-duration tween is left")
match(src, /cover\.style\.transform = "rotateY\("/, "the cover only ever swings on its spine")
noMatch(src, /rotateX\(" \+ P\.angle/, "the cover never flips over its top edge")
noMatch(src, /el\.style\.(width|height) =/, "prints are never resized while they move")
match(src, /style=\{\{ width: pw, height: L \? L\.ph : 0 \}\}/, "a print has one size, set by the layout")
match(src, /P\.clip\.x - lay\.jaw\.x - \(P\.bx - lay\.closed\.x\)/, "the set-aside clip stays put on the table while the folder moves")

// --- geometry and motion, run as shipped --------------------------------------
const at = src.indexOf("// #endregion", src.indexOf("// #region geometry"))
const lifted = src.slice(0, at) + "export { layoutFor, pose, step, restState, STACK, PAPER, SPINE, ASPECT, HINT_H, PRINT_RATIO }\n" + src.slice(at)
const { layoutFor, pose, step, restState, STACK, PAPER, SPINE, ASPECT, HINT_H, PRINT_RATIO } = await liftRegion(lifted, "geometry")
const rad = Math.PI / 180
// half extents of a turned box
const ext = (w, h, deg) => [(w * Math.cos(deg * rad) + h * Math.abs(Math.sin(deg * rad))) / 2, (h * Math.cos(deg * rad) + w * Math.abs(Math.sin(deg * rad))) / 2]

// blank pages stay in the folder: never left of the cover, peeking at the top, right and bottom
let pTop = false, pRight = false, pBottom = false
for (const k of PAPER) {
  const [ex, ey] = ext(k.w * ASPECT, k.h, k.r) // in folder-height units
  const cx = (0.5 + k.dx) * ASPECT, cyy = 0.5 + k.dy
  assert.ok(cx - ex > SPINE * ASPECT + 0.002, "a page stays right of the spine")
  if (cyy - ey < -0.004) pTop = true
  if (cx + ex > ASPECT + 0.004) pRight = true
  if (cyy + ey > 1.004) pBottom = true
  assert.ok(cyy - ey > -0.06 && cx + ex < ASPECT * 1.06 && cyy + ey < 1.06, "a page only peeks a little")
}
assert.ok(pTop && pRight && pBottom, "pages peek out at the top, right and bottom")
assert.equal(STACK.length, 4)

for (const [w, h] of [[1440, 900], [1280, 720], [1920, 1080], [1024, 768], [390, 844], [1536, 720], [360, 740], [768, 1024]]) {
  const L = layoutFor(w, h, 4)
  const tag = w + "x" + h
  const hintTop = h - L.vp - HINT_H
  assert.ok(Math.abs(L.fw / L.fh - ASPECT) < 0.01, tag + ": the folder keeps 3:4")
  assert.ok(Math.abs(L.ph / L.pw - PRINT_RATIO) < 0.01 && L.pw >= 110, tag + ": prints keep their shape and stay readable, " + L.pw)

  // closed and at rest
  const C = pose(L, restState(4, false), 0)
  assert.ok(Math.abs(C.bx + L.fw / 2 - w / 2) < 0.01, tag + ": closed folder centred")
  assert.ok(Math.abs(C.by - (hintTop - (C.by + L.fh))) < 0.01, tag + ": equal gap above the folder and down to the hint")
  assert.ok(C.front && C.angle === 0 && C.flash === 0, tag + ": closed pose is at rest")
  assert.ok(Math.abs(C.clip.x - L.jaw.x) < 1e-9 && Math.abs(C.clip.y - L.jaw.y) < 1e-9 && C.clip.r === 0, tag + ": the clip sits on the edge")
  for (const q of C.prints) {
    const [ex, ey] = ext(L.pw, L.ph, q.r)
    assert.ok(q.x - ex > C.bx + L.fw * SPINE + 2 && q.x + ex < C.bx + L.fw - 2, tag + ": a print lies inside the cover, sideways")
    assert.ok(q.y - ey > C.by + 2 && q.y + ey < C.by + L.fh - 2, tag + ": a print lies inside the cover, top to bottom")
  }
  // a hover lifts them out of the top, still on the stage
  const up = pose(L, restState(4, false), 1)
  assert.ok(up.prints.some((q) => q.y - ext(L.pw, L.ph, q.r)[1] < C.by - 3), tag + ": a hover lifts a print out of the top")
  up.prints.forEach((q, i) => {
    assert.ok(q.y < C.prints[i].y - 4, tag + ": hover lifts print " + i)
    assert.ok(q.y - ext(L.pw, L.ph, q.r)[1] > 2, tag + ": a lifted print stays on the stage")
  })

  // open and at rest
  const O = pose(L, restState(4, true), 1)
  assert.ok(!O.front && O.angle === 180 && Math.abs(O.flash) < 1e-9, tag + ": open pose is at rest")
  if (L.compact) {
    assert.ok(Math.abs(O.bx - C.bx) < 1e-9, tag + ": on a phone the back cover stays where it was")
  } else {
    const left = O.bx + L.fw * SPINE - L.fw * (1 - SPINE)
    assert.ok(Math.abs((left + O.bx + L.fw) / 2 - w / 2) < 0.01, tag + ": open spread centred")
    assert.ok(left >= L.g - 0.5, tag + ": open spread inside the gutter")
  }
  const boxes = O.prints.map((q, i) => {
    const [ex, ey] = ext(L.pw, L.ph, q.r)
    assert.ok(Math.abs(q.x - L.cards[i].x) < 1e-9 && Math.abs(q.y - L.cards[i].y) < 1e-9, tag + ": print " + i + " rests on its spot")
    assert.ok(q.x - ex >= L.g - 0.5 && q.x + ex <= w - L.g + 0.5, tag + ": turned prints stay inside the gutter")
    assert.ok(q.y - ey > 4 && q.y + ey < hintTop - 4, tag + ": prints clear the top and the hint")
    return { l: q.x - ex, r: q.x + ex, t: q.y - ey, b: q.y + ey }
  })
  for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) {
    const a = boxes[i], b = boxes[j]
    assert.ok(!(a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b), tag + ": prints " + i + " and " + j + " do not overlap")
  }
  const cols = L.compact ? 2 : 4
  for (let i = 0; i < 4; i++) assert.equal(O.prints[i].y, O.prints[Math.floor(i / cols) * cols].y, tag + ": a row shares one centre line")
  assert.ok(Math.abs(O.prints[0].x + O.prints[cols - 1].x - w) < 0.01, tag + ": print row centred")
  // the clip rests on the table: on the stage, off the folder, clear of the prints and the hint
  const reach = L.bcW * 0.64 // pivot (the jaw) to the tip of the wire handle
  assert.ok(Math.abs(O.clip.x - L.rest.x) < 1e-6 && Math.abs(O.clip.y - L.rest.y) < 1e-6, tag + ": the clip comes to rest where the layout says")
  assert.ok(O.clip.x + L.bcW * 0.25 < w - 4 && O.clip.x - reach > 4, tag + ": resting clip on the stage")
  assert.ok(O.clip.y + reach * 0.45 < hintTop - 2, tag + ": resting clip clear of the hint")
  if (L.compact) assert.ok(O.clip.y - L.bcW * 0.4 > O.by + L.fh, tag + ": resting clip below the folder")
  else assert.ok(O.clip.x - reach > O.bx + L.fw, tag + ": resting clip right of the open folder")
  for (const b of boxes) assert.ok(O.clip.y - L.bcW * 0.42 > b.b || O.clip.x - reach > b.r, tag + ": resting clip clear of the prints")

  // the folder stays centred on screen through the whole swing (the camera follows it; it does not slide on its own)
  if (!L.compact) for (let a = 0; a <= 100; a++) {
    const S = restState(4, false)
    S.cover = a / 100
    const P = pose(L, S, 0)
    const leftEdge = Math.min(P.bx, P.bx + L.fw * SPINE + L.fw * (1 - SPINE) * Math.cos(P.angle * rad))
    assert.ok(Math.abs((leftEdge + P.bx + L.fw) / 2 - w / 2) < 0.01, tag + ": centred at " + P.angle + "deg")
  }
}

// springs: order by condition, real landings, no size or position jumps, and it always comes to rest
const run = (S, open, ms, each) => {
  let t = 0, still = false
  while (!still && t < ms) {
    still = step(S, open, 8)
    t += 8
    if (each) each(S, t)
  }
  return { t, still }
}
{
  const S = restState(4, false)
  let bounced = false, peak = 0, prev = JSON.parse(JSON.stringify(S))
  const o = run(S, true, 4000, (s) => {
    if (s.cover > 0.001) assert.ok(s.clip > 0.4, "the clip is off before the cover moves")
    s.prints.forEach((p, i) => {
      if (p > 0.02) assert.ok(s.cover > 0.5, "print " + i + " leaves only after the cover is past edge-on")
      if (i < 3 && p > 0.02) assert.ok(s.prints[i + 1] > 0.2 - 1e-9, "prints leave from the top of the stack down")
      assert.ok(Math.abs(p - prev.prints[i]) < 0.05, "a print never jumps")
      assert.ok(p < 1.03 && p > -0.03, "a print barely overshoots")
    })
    assert.ok(Math.abs(s.cover - prev.cover) < 0.05 && Math.abs(s.clip - prev.clip) < 0.05, "nothing jumps")
    assert.ok(s.cover >= 0 && s.cover <= 1, "the cover cannot pass through the table")
    if (peak === 1 && s.cover < 0.995) bounced = true
    peak = Math.max(peak, s.cover)
    prev = JSON.parse(JSON.stringify(s))
  })
  assert.ok(o.still && o.t > 900 && o.t < 2200, "opening comes to rest in a sensible time, " + o.t)
  assert.ok(bounced, "the cover lands and bounces instead of easing to a stop")
  assert.deepEqual(S, restState(4, true), "open rest state is exact")

  let coverMoved = false
  prev = JSON.parse(JSON.stringify(S))
  const c = run(S, false, 4000, (s) => {
    if (s.cover < 0.999) {
      coverMoved = true
      s.prints.forEach((p, i) => assert.ok(p < 0.07, "the cover shuts only once print " + i + " is home"))
    }
    if (s.clip < 0.98) assert.ok(s.cover <= 0.02, "the clip goes back on only once the cover is shut")
    s.prints.forEach((p, i) => assert.ok(Math.abs(p - prev.prints[i]) < 0.05, "a print never jumps"))
    prev = JSON.parse(JSON.stringify(s))
  })
  assert.ok(coverMoved && c.still && c.t > 900 && c.t < 2600, "closing comes to rest in a sensible time, " + c.t)
  assert.deepEqual(S, restState(4, false), "closed rest state is exact")
}
// changing your mind at any moment still ends at rest, in either direction
for (const flipAt of [80, 240, 400, 560, 720, 960, 1200]) for (const first of [true, false]) {
  const S = restState(4, !first)
  run(S, first, flipAt)
  const r = run(S, !first, 5000)
  assert.ok(r.still, "settles after a reversal at " + flipAt + "ms")
  assert.deepEqual(S, restState(4, !first), "and lands on the exact rest state")
}
// frame rate does not change where things end up, and a long frame is not a jump
{
  const A = restState(4, false), B = restState(4, false)
  for (let t = 0; t < 600; t += 8) step(A, true, 8)
  for (let t = 0; t < 600; t += 60) step(B, true, 60)
  assert.ok(Math.abs(A.cover - B.cover) < 0.03 && Math.abs(A.prints[3] - B.prints[3]) < 0.03, "the same motion at 16 fps as at 120 fps")
}
// fewer prints still lay out centred and settle
for (const n of [1, 2, 3]) {
  const L = layoutFor(1440, 900, n)
  const S = restState(n, false)
  assert.ok(run(S, true, 4000).still, n + " prints settle")
  const O = pose(L, S, 0)
  assert.equal(O.prints.length, n)
  assert.ok(Math.abs(O.prints[0].x + O.prints[n - 1].x - 1440) < 0.01, n + " prints centred")
}

console.log("frosted-folder-lookbook: ok")
