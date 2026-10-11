// Install-safety, shader hygiene and sequencing check for components/title-sequence-preloader.
// Run: node tests/title-sequence-preloader.test.mjs
//
// The canvas cannot be asserted here. What can, and what breaks quietly, is
// the director: a reel that ends before the counter reaches 100, a finale that
// fires while the real load is still running, a hover that holds a shot
// forever, a label pushed off the stage on a phone. The logic lives in the
// component between `// #region logic` markers and is lifted out and run.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8")
const src = read("../components/title-sequence-preloader/title-sequence-preloader.tsx")

// ---- install safety -------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "the only import may be react")
assert.doesNotMatch(src, /https?:\/\/|@import|url\(/, "no fonts, images or stylesheets to fetch: every picture is drawn")
// The 21st CLI's dependency scanner reads `<Name` in a type position as an unclosed JSX tag and hangs.
assert.doesNotMatch(
  src,
  /\b(?:useRef|useState|useMemo|new Map|new Set|PointerEvent|KeyboardEvent|MutableRefObject|RefObject|Record|Array|Promise)<[A-Za-z"{]/,
  "no generic type arguments: use `x as T` or a structural type",
)
assert.ok(src.includes('height = "100svh"'), "stage height must default to a definite length")
assert.doesNotMatch(src, /\bh-full\b/, "no h-full anywhere")
assert.ok(src.includes("Math.min(window.devicePixelRatio || 1, 1.5)"), "cap the render scale")
assert.ok(src.includes('"KHR_parallel_shader_compile"') && src.includes("COMPLETION_STATUS_KHR"), "compile the big shader off the main thread")
assert.doesNotMatch(src, /COMPILE_STATUS/, "never block on a compile status right after compiling")
for (const gone of [
  "cancelAnimationFrame(raf)", "ro.disconnect()", "io.disconnect()", "deleteProgram(built.prog)",
  'removeEventListener("webglcontextlost", onLost)', "clearTimeout(timer)", 'mq.removeEventListener("change", on)',
]) assert.ok(src.includes(gone), `cleanup is missing ${gone}`)

// ---- the CSS string ---------------------------------------------------------
{
  const css = src.match(/const CSS = `([\s\S]*?)`/)
  assert.ok(css, "CSS block present")
  assert.doesNotMatch(css[1], /\$\{|`/, "no interpolation inside the CSS string")
  assert.ok(/\.tsp-canvas \{[^}]*max-width: none/.test(css[1]), "the canvas escapes Preflight's max-width")
  assert.ok(css[1].includes("prefers-reduced-motion: reduce"), "reduced motion in CSS")
  for (const m of css[1].replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(?<=^|[{}])\s*([^{}]+?)\s*\{/g)) {
    const sel = m[1].trim()
    if (sel.startsWith("@") || /^(from|to|[\d.]+%)/.test(sel)) continue
    assert.ok(sel.split(",").every((x) => x.trim().startsWith(".tsp-")), `unscoped selector would leak into the host: ${sel}`)
  }
}

// ---- the shader -------------------------------------------------------------
{
  const frag = src.match(/const FRAG = `([\s\S]*?)`/)[1]
  // Reversed smoothstep edges are undefined in GLSL and render black on ANGLE.
  for (const m of frag.matchAll(/smoothstep\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*,/g)) {
    assert.ok(+m[1] < +m[2], `smoothstep edges must rise: ${m[0]}`)
  }
  const declared = [...frag.matchAll(/^uniform \w+ (\w+);/gm)].map((m) => m[1]).sort()
  const listed = src.match(/const UNIFORMS = \[([\s\S]*?)\]/)[1].match(/"(\w+)"/g).map((s) => s.slice(1, -1)).sort()
  assert.deepEqual(listed, declared, "every uniform the shader declares is looked up, and nothing else")
  for (const u of listed) assert.ok(src.includes("U." + u + ","), `${u} is never set`)
  assert.ok(/premultipliedAlpha: false/.test(src) && frag.includes("o = vec4(clamp(g, 0.0, 1.0), alpha)"), "the reveal is a real hole in the canvas")
}

// ---- accessibility and wiring -------------------------------------------------
assert.ok(src.includes('role="progressbar"') && src.includes('setAttribute("aria-valuenow"'), "progress reaches assistive tech")
assert.ok(src.includes('<ul className="sr-only">'), "the credits are readable without the picture")
assert.ok(src.includes('type="button" className="tsp-skip"'), "a real skip button")
assert.ok(src.includes("tabIndex={0}") && src.includes("onKeyDown={onKey}"), "the reel is keyboard drivable")
assert.ok(src.includes("el.inert = "), "the page underneath is inert until the clouds part")
assert.ok(src.includes('"(prefers-reduced-motion: reduce)"'), "reduced motion in the runtime")

// ---- original work only -----------------------------------------------------------
// The storyboard it answers is a real conference's opening titles; none of its
// names, city, year or brand may ship as defaults.
for (const f of ["title-sequence-preloader.tsx", "demo.tsx", "demo-custom.tsx", "demo-loop.tsx", "README.md"]) {
  const text = read("../components/title-sequence-preloader/" + f)
  for (const bad of [/\bFITC\b/i, /amst(e|3)rdam/i, /reitberger|alliban|klingemann|jaworowski|rozema|skinner|olsson|kandylis/i]) {
    assert.doesNotMatch(text, bad, `${f} must not carry the reference's names: ${bad}`)
  }
}

// ---- demos -------------------------------------------------------------------------------
const tsconfig = read("../tsconfig.json")
assert.ok(tsconfig.includes('"@/components/ui/title-sequence-preloader"'), "tsconfig paths line missing")
for (const d of ["demo.tsx", "demo-custom.tsx", "demo-loop.tsx"]) {
  const demo = read("../components/title-sequence-preloader/" + d)
  assert.ok(demo.includes('from "@/components/ui/title-sequence-preloader"'), `${d} imports the installer path`)
  assert.ok(demo.includes('className="w-full"'), `${d} needs the w-full wrapper`)
}

// ---- the logic, lifted out ------------------------------------------------------------------
const start = src.indexOf("// #region logic")
const end = src.indexOf("// #endregion", start)
assert.ok(start > -1 && end > start, "logic region markers missing")
const L = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))

// Shots: every one defined, scenes distinct, slots well formed and alternating.
{
  assert.equal(L.SHOT_IDS.length, 8)
  const scenes = L.SHOT_IDS.map((id) => L.SHOTS[id].scene)
  assert.deepEqual([...new Set(scenes)].sort(), [0, 1, 2, 3, 4, 5, 6, 7])
  assert.ok(!scenes.includes(L.FINALE_SCENE), "the finale has its own scene")
  for (const id of L.SHOT_IDS) {
    const def = L.SHOTS[id]
    assert.ok(def.slots.length >= 2, `${id} credits at least two people`)
    for (const s of def.slots) {
      for (const k of ["a", "e", "p"]) assert.equal(s[k].length, 2, `${id} slot ${k}`)
      for (const v of [...s.e, ...s.p]) assert.ok(Math.abs(v) <= 0.5, `${id} label position leaves the stage`)
    }
    assert.notEqual(def.slots[0].side, def.slots[1].side, `${id}: the first two slots sit on opposite sides`)
  }
}

assert.deepEqual(L.shotList(["moon", "nope", "moon"]), ["moon", "moon"], "unknown ids drop, repeats stay")
assert.deepEqual(L.shotList([]), L.SHOT_IDS)
assert.deepEqual(L.shotList(undefined), L.SHOT_IDS)

assert.deepEqual(L.splitCredit("Ada Lindqvist"), { first: "Ada", rest: "Lindqvist", role: "" })
assert.deepEqual(L.splitCredit({ name: "  Joaquim   de Sá ", role: " Bass " }), { first: "Joaquim", rest: "de Sá", role: "Bass" })
assert.deepEqual(L.splitCredit("Prince"), { first: "Prince", rest: "", role: "" })
assert.deepEqual(L.splitCredit(""), { first: "", rest: "", role: "" })

// Distribution: every name once per pass, spread evenly, moving on each pass.
{
  const caps = L.SHOT_IDS.map((id) => L.SHOTS[id].slots.length)
  const total = caps.reduce((a, b) => a + b, 0)
  for (const n of [1, 5, 8, 13, 24, total, total + 11]) {
    const out = L.distribute(n, caps, 0)
    const flat = out.flat()
    assert.equal(flat.length, Math.min(n, total), `n=${n}: one slot per name`)
    assert.equal(new Set(flat).size, flat.length, `n=${n}: nobody twice in one pass`)
    out.forEach((names, i) => assert.ok(names.length <= caps[i], `n=${n}: shot ${i} over capacity`))
    if (n <= total) {
      const counts = out.map((x) => x.length)
      const open = counts.filter((c, i) => c < caps[i])
      if (open.length) assert.ok(Math.max(...counts) - Math.min(...open) <= 1, `n=${n}: uneven spread ${counts}`)
      assert.deepEqual(flat, [...Array(n).keys()], `n=${n}: names keep reading order`)
    }
  }
  const more = total + 11
  assert.equal(L.distribute(more, caps, 1)[0][0], total % more, "the next pass starts where the last left off")
  assert.deepEqual(L.distribute(0, caps, 0), caps.map(() => []))
}

// The built-in loader: 0 → 100, never backwards.
{
  assert.equal(L.simulatedProgress(0, 16000), 0)
  assert.equal(L.simulatedProgress(16000, 16000), 100)
  assert.equal(L.simulatedProgress(99999, 16000), 100)
  let prev = -1
  for (let t = 0; t <= 16000; t += 40) {
    const p = L.simulatedProgress(t, 16000)
    assert.ok(p >= prev - 1e-9, `loader runs backwards at ${t}`)
    prev = p
  }
}

const opts = (o = {}) => ({
  count: 8, shotMs: 2000, duration: 16000, finaleMs: L.FINALE_MS, revealMs: L.REVEAL_MS,
  target: null, loop: false, hold: false, ...o,
})
const run = (s, o, ms, dt = 16, until = () => false) => {
  for (let t = 0; t < ms && !until(s); t += dt) s = L.advance(s, dt, o)
  return s
}

// Built-in loader: every shot in order, the finale lands on 100, then the reveal, then done.
{
  const o = opts()
  let s = L.initialState()
  const seen = []
  let finaleAt = -1
  let shownPrev = 0
  for (let t = 0; s.phase !== "done" && t < 60000; t += 16) {
    s = L.advance(s, 16, o)
    assert.ok(s.shown >= shownPrev - 1e-9, "the counter never falls")
    shownPrev = s.shown
    if (s.phase === "titles" && seen[seen.length - 1] !== s.shot) seen.push(s.shot)
    if (s.phase === "finale" && finaleAt < 0) {
      finaleAt = t + 16
      assert.ok(s.shown >= 95, `the counter is nearly full when the rocket goes (${s.shown})`)
    }
  }
  assert.deepEqual(seen, [0, 1, 2, 3, 4, 5, 6, 7], "each shot once, in order")
  assert.ok(Math.abs(finaleAt - 16000) <= 16, `finale at the end of the load, got ${finaleAt}`)
  assert.equal(s.phase, "done")
  assert.equal(s.shown, 100)
  assert.ok(Math.abs(s.total - (16000 + L.FINALE_MS + L.REVEAL_MS)) <= 48, "the whole gate runs load + finale + reveal")
}

// Real progress: the reel loops until the load is done, and never overtakes it.
{
  const o = opts({ target: 40, shotMs: 1500 })
  const s = run(L.initialState(), o, 30000)
  assert.equal(s.phase, "titles", "no finale before the load is done")
  assert.ok(s.cycle >= 2, "the reel goes round again while it waits")
  assert.ok(s.shown <= 40 + 1e-9 && s.shown > 39, "the counter follows the real progress")
  const done = run(s, opts({ target: 100, shotMs: 1500 }), 1500, 16, (x) => x.phase !== "titles")
  assert.equal(done.phase, "finale", "complete load → finale within half a shot")
}

// A hovered credit holds the shot, and the built-in loader with it.
{
  let s = run(L.initialState(), opts(), 3000)
  const before = { ...s }
  s = run(s, opts({ hold: true }), 5000)
  assert.equal(s.shot, before.shot)
  assert.equal(s.clock, before.clock, "the loader waits while a credit is held")
  let c = run(L.initialState(), opts({ target: 50 }), 700)
  const local = c.local
  c = run(c, opts({ target: 50, hold: true }), 4000)
  assert.equal(c.local, local)
}

// Loop: after the finale it rolls again, and never reveals.
{
  const o = opts({ loop: true })
  let s = run(L.initialState(), o, 16000 + L.FINALE_MS + 200)
  assert.equal(s.phase, "titles")
  assert.equal(s.cycle, 1)
  s = run(s, o, 60000)
  assert.notEqual(s.phase, "reveal")
  assert.notEqual(s.phase, "done")
  assert.equal(L.skip({ ...s, phase: "finale" }, o).phase, "finale", "skip never lifts a looping reel")
}

// Skip.
{
  assert.equal(L.skip(L.initialState(), opts()).phase, "finale", "built-in loader: straight to the finale")
  const waiting = L.skip(L.initialState(), opts({ target: 60 }))
  assert.equal(waiting.phase, "titles")
  assert.equal(waiting.armed, true, "real loader: skip waits for the load")
  const go = L.advance(waiting, 16, opts({ target: 100 }))
  assert.equal(go.phase, "finale", "an armed skip goes the moment the load completes")
  assert.equal(L.skip({ ...L.initialState(), phase: "finale" }, opts()).phase, "reveal", "skip in the finale reveals")
}

// Cuts.
{
  const o = opts()
  let s = L.cut(L.initialState(), 1, o)
  assert.equal(s.shot, 1)
  assert.equal(s.clock, 2000, "the built-in loader jumps with the cut")
  assert.equal(L.advance(s, 16, o).shot, 1, "the clock and the shot agree after a cut")
  assert.equal(L.cut(L.initialState(), -1, o).shot, 0, "no cutting back past the first shot")
  s = { ...L.initialState(), shot: 7, clock: 14000 }
  assert.equal(L.cut(s, 1, o).phase, "finale", "cutting past the last shot is the finale")
  const r = opts({ target: 30 })
  s = L.cut({ ...L.initialState(), shot: 7 }, 1, r)
  assert.deepEqual([s.shot, s.cycle], [0, 1], "real loader: cuts wrap round")
  assert.equal(L.cut({ ...L.initialState(), phase: "finale" }, 1, r).phase, "finale", "no cuts in the finale")
}

// Type.
{
  assert.equal(L.scramble("Ada Lindqvist", 1, 3), "Ada Lindqvist")
  const noise = L.scramble("Ada Lindqvist", 0, 3)
  assert.equal(noise.length, 13)
  assert.equal(noise[3], " ", "spaces hold still")
  assert.notEqual(noise, "Ada Lindqvist")
  const g = L.leet("LISBON", 2)
  assert.equal(g.length, 6)
  assert.equal([...g].filter((c, i) => c !== "LISBON"[i]).length, 1)
  assert.match(g, /[0-9]/)
  assert.equal(L.leet("lynx", 1), "lynx", "nothing to swap, nothing swapped")
  assert.equal(L.timecode(0), "00:00:00:00")
  assert.equal(L.timecode(1000), "00:00:01:00")
  assert.equal(L.timecode(3723500), "01:02:03:12")
  assert.equal(L.formatDate(new Date(2026, 8, 3)), "03.09.2026")
  assert.deepEqual(L.hexToRgb("#fff"), [1, 1, 1])
  assert.deepEqual(L.hexToRgb("nope"), [0, 0, 0])
}

// Callouts stay on the stage, between the letterbox bars, on every shape of screen.
for (const [w, h] of [[1440, 810], [1280, 720], [390, 844], [768, 1024], [1900, 420], [320, 568]]) {
  const bar = Math.round(Math.min(84, Math.max(40, h * 0.095)))
  const fs = Math.min(15, Math.max(10.5, w * 0.0098))
  const pad = Math.max(14, Math.round(w * 0.025))
  for (const id of L.SHOT_IDS) {
    for (const sl of L.SHOTS[id].slots) {
      const est = L.estimateLabel({ first: "Saoirse", rest: "Callahan", role: "Art direction" }, L.SHOTS[id].look, fs)
      const g = L.layoutCallout(sl, w, h, est.w, est.h, bar, bar)
      const left = g.side === "l" ? g.ex - 8 - est.w : g.ex + 8
      assert.ok(left >= pad - 1 && left + est.w <= w - pad + 1, `${w}x${h} ${id}: label leaves the stage (${left})`)
      assert.ok(g.ey - est.h / 2 >= bar && g.ey + est.h / 2 <= h - bar, `${w}x${h} ${id}: label under a letterbox bar`)
      assert.ok(g.side === "l" ? g.kx > g.ex : g.kx < g.ex, `${w}x${h} ${id}: the knee sits on the anchor side`)
    }
  }
}

console.log("title-sequence-preloader: ok")
