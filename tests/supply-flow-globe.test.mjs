// Runnable check for components/supply-flow-globe: the embedded world, the flow
// geometry, the model, palettes, and the install-safety rules.
// Run: node tests/supply-flow-globe.test.mjs
//
// What breaks silently here is winding. d3-geo reads a spherical ring by its
// direction, so a ribbon or node disc drawn the wrong way round paints the
// whole planet except itself — and the source still "looks" right. Every ring
// the component builds is checked against d3's own area here.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"
import { geoArea, geoBounds, geoContains, geoDistance } from "d3-geo"

const read = (file) =>
  readFileSync(new URL("../components/supply-flow-globe/" + file, import.meta.url), "utf8").replace(/\r\n/g, "\n")
const src = read("supply-flow-globe.tsx")

const start = src.indexOf("// #region geo")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "region markers missing")
const G = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))

const poly = (ring) => ({ type: "Polygon", coordinates: [ring] })
const small = (ring, msg) => assert.ok(geoArea(poly(ring)) < 2 * Math.PI, msg + " winds the small way round")

// ---- the embedded world decodes into real countries ---------------------------
const world = G.decodeWorld(G.WORLD)
{
  assert.ok(world.length >= 170, "every Natural Earth country is there")
  const ids = new Set(world.map((c) => c.id))
  assert.equal(ids.size, world.length, "country ids are unique")
  for (const id of ["BR", "VN", "CO", "ET", "ID", "HN", "DE", "BE", "IT", "US", "FR", "PL", "SE", "RU", "GB", "NL", "GR", "AT", "CA", "JP", "AQ"]) {
    assert.ok(ids.has(id), id)
  }
  for (const c of world) {
    assert.ok(c.rings.length > 0, c.name + " has a shape")
    for (const r of c.rings) {
      assert.ok(r.length >= 4, c.name + " rings are closed polygons")
      assert.deepEqual(r[0], r.at(-1), c.name + " rings close")
      for (const [x, y] of r) assert.ok(Math.abs(x) <= 180 && Math.abs(y) <= 90, c.name + " stays on the planet")
    }
    // the label point is where flows anchor, so it must be on the country itself
    if (["FR", "NO", "RU", "US", "BR", "DE", "JP"].includes(c.id)) {
      assert.ok(geoContains({ type: "MultiPolygon", coordinates: c.rings.map((r) => [r]) }, c.label), c.name + "'s label point sits inside it")
    }
  }
  const br = world.find((c) => c.id === "BR")
  const [[w, s], [e, n]] = geoBounds({ type: "MultiPolygon", coordinates: br.rings.map((r) => [r]) })
  assert.ok(w < -70 && e > -36 && s < -32 && n > 3, "Brazil is where Brazil is")
  // Natural Earth winds land the way d3 wants it; the component relies on that
  let wrong = 0
  for (const c of world) for (const r of c.rings) if (geoArea(poly(r)) > 2 * Math.PI) wrong++
  assert.equal(wrong, 0, "every country ring is small-side clockwise")
}

// ---- varints round-trip ------------------------------------------------------------
assert.deepEqual(G.decodeInts("A"), [0])
assert.deepEqual(G.decodeInts("B"), [-1])
assert.deepEqual(G.decodeInts("C"), [1])

// ---- curves: start and end on the nodes, bow left, take the short way round --------
{
  const br = [-51, -10]
  const de = [10, 51]
  const c = G.flowCurve(br, de, 0.4, 64)
  assert.equal(c.length, 65)
  const ll = c.map(G.toLonLat)
  assert.ok(geoDistance(ll[0], br) < 1e-9 && geoDistance(ll[64], de) < 1e-9, "ends on its nodes")
  for (const v of c) assert.ok(Math.abs(Math.hypot(...v) - 1) < 1e-9, "on the unit sphere")
  const straight = G.flowCurve(br, de, 0, 64).map(G.toLonLat)
  assert.ok(geoDistance(ll[32], straight[32]) > 0.1, "bend moves the middle off the straight route")
  // left of travel: going north-east, the bow leans north-west
  assert.ok(ll[32][0] < straight[32][0], "bows to the left of travel")
  // Indonesia → United States crosses the Pacific, not Africa and the Atlantic
  const pac = G.flowCurve([101.9, -1], [-97.5, 39.5], 0.4).map(G.toLonLat)
  assert.ok(pac.every(([lon]) => lon > 90 || lon < -90), "takes the short way over the antimeridian")
  assert.ok(pac.every(([, lat]) => lat < 85), "never swings over the pole")
  // the same pair the other way round bows to the other side
  const back = G.flowCurve(de, br, 0.4, 64).map(G.toLonLat)
  assert.ok(geoDistance(back[32], ll[32]) > 0.1, "a flow and its return don't overlap")
}

// ---- rings: ribbons and node discs wind the small way ------------------------------
{
  const pairs = [
    [[-51, -10], [10, 51]],
    [[101.9, -1], [-97.5, 39.5]],
    [[-97.5, 39.5], [138.4, 36.1]],
    [[44.7, 58.2], [-101.9, 60.3]],
    [[0, 0], [0.5, 0]],
    [[170, -40], [-170, -45]],
  ]
  for (const [a, b] of pairs) {
    for (const bend of [0, 0.4, 0.9]) {
      const ring = G.ribbonRing(G.flowCurve(a, b, bend), 1.5)
      assert.deepEqual(ring[0], ring.at(-1))
      small(ring, `ribbon ${a} → ${b} @${bend}`)
      assert.ok(geoArea(poly(ring)) > 0, "and isn't empty")
    }
  }
  const thin = geoArea(poly(G.ribbonRing(G.flowCurve([-51, -10], [10, 51]), 0.5)))
  const fat = geoArea(poly(G.ribbonRing(G.flowCurve([-51, -10], [10, 51]), 2)))
  assert.ok(fat > thin * 3, "width scales the ribbon")
  for (const c of [[0, 0], [10, 51], [-170, 89.9], [179.9, -89], [-51, -10]]) {
    const ring = G.circleRing(c, 2)
    small(ring, "disc at " + c)
    for (const p of ring) assert.ok(Math.abs(geoDistance(p, c) - 2 * (Math.PI / 180)) < 1e-6, "a true small circle")
  }
  const curve = G.flowCurve([0, 0], [40, 0], 0, 8)
  assert.ok(geoDistance(G.toLonLat(G.pointAt(curve, 0.5)), [20, 0]) < 1e-6, "pointAt walks the curve")
  assert.ok(geoDistance(G.toLonLat(G.pointAt(curve, 2)), [40, 0]) < 1e-9, "pointAt clamps")
}

// ---- the model -------------------------------------------------------------------------
{
  assert.equal(G.inferRole(0, 5), "producer")
  assert.equal(G.inferRole(5, 5), "hub")
  assert.equal(G.inferRole(5, 0), "consumer")
  const flows = [
    { source: "BR", target: "DE", value: 300 },
    { source: "BR", target: "US", value: 100 },
    { source: "DE", target: "FR", value: 150 },
    { source: "DE", target: "DE", value: 9 },
    { source: "XX", target: "FR", value: 9 },
    { source: "BR", target: "FR", value: -4 },
    { source: "BR", target: "FR", value: Number.NaN },
    { source: "depot", target: "FR", value: 20 },
  ]
  const m = G.buildModel(flows, [{ id: "depot", name: "Depot", coordinates: [5, 45] }, { id: "US", role: "hub" }], world)
  const node = (id) => m.nodes.find((n) => n.id === id)
  assert.equal(m.flows.length, 4, "self-loops, unknown places and non-positive values are dropped")
  assert.equal(node("BR").role, "producer")
  assert.equal(node("DE").role, "hub")
  assert.equal(node("FR").role, "consumer")
  assert.equal(node("US").role, "hub", "a given role wins over the inferred one")
  assert.equal(node("depot").name, "Depot")
  assert.equal(node("BR").name, "Brazil", "names fall back to the country's")
  assert.equal(node("BR").out, 400)
  assert.equal(node("DE").in, 300)
  assert.equal(node("DE").total, 300)
  assert.equal(m.flows.find((f) => f.value === 300).share, 0.75)
  assert.equal(m.max, 300)
  assert.deepEqual(m.order.map((i) => m.flows[i].value), [300, 150, 100, 20], "widest first")
  assert.ok(node("BR").radius > node("FR").radius, "discs grow with throughput")
  for (const n of m.nodes) small(n.ring, n.id)
  for (const f of m.flows) small(f.ring, "flow")
  assert.equal(m.totals.producer, 420, "Brazil's 400 plus the depot's 20")
  for (const f of m.flows) assert.ok(m.particles.some((p) => m.flows[p.flow] === f), "every flow carries particles")
  for (const p of m.particles) assert.ok(p.dur >= 3000 && p.dur <= 6000 && p.phase >= 0 && p.phase < 1)
  assert.deepEqual(G.buildModel(flows, [], world).particles, G.buildModel(flows, [], world).particles, "particles are seeded")
  const empty = G.buildModel([], [], world)
  assert.equal(empty.flows.length, 0)
  assert.equal(empty.max, 0)
}

// ---- palettes ---------------------------------------------------------------------------
{
  const keys = Object.keys(G.PALETTES.coffee.light)
  for (const [name, p] of Object.entries(G.PALETTES)) {
    for (const side of ["light", "dark"]) assert.deepEqual(Object.keys(p[side]).sort(), keys.slice().sort(), name + " " + side + " is complete")
  }
  assert.equal(G.resolveTheme("matcha", true), G.PALETTES.matcha.dark)
  assert.equal(G.resolveTheme("nope", false), G.PALETTES.coffee.light, "unknown names fall back")
  assert.equal(G.resolveTheme({ flow: "red" }, false).flow, "red")
  assert.equal(G.resolveTheme({ flow: "red" }, false).ocean, G.PALETTES.coffee.light.ocean, "partials sit over coffee")
  assert.equal(G.resolveTheme({ light: { flow: "a" }, dark: { flow: "b" } }, true).flow, "b")
  assert.equal(G.particleOf("matcha", undefined), "leaf")
  assert.equal(G.particleOf("matcha", "dot"), "dot")
  assert.equal(G.particleOf({ flow: "red" }, undefined), "bean")
}

// ---- install safety ---------------------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual([...new Set(imports)].sort(), ["d3-geo", "react"], "react and d3-geo only")
const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"))
assert.ok(pkg.dependencies["d3-geo"], "d3-geo is declared in the root package.json")
assert.ok(read("README.md").includes("d3-geo"), "the README names the dependency")
assert.doesNotMatch(src, /https?:\/\/(?!21st)/, "no external origins — the world is embedded")
assert.doesNotMatch(src, /@import|<style/, "styles are Tailwind + inline")
assert.doesNotMatch(src, /\bh-(full|screen)\b/, "no percentage-height classes")
assert.ok(src.includes('height = "100svh"'), "a definite default height")
assert.ok(src.includes('style={{ maxWidth: "none" }}'), "canvas and icons are guarded against Preflight")

// cleanup: everything the engine attaches comes back off
for (const ev of ["pointerdown", "pointermove", "pointerup", "pointercancel", "pointerleave", "dblclick", "wheel", "keydown", "blur"]) {
  assert.ok(src.includes('canvas.addEventListener("' + ev + '"') && src.includes('canvas.removeEventListener("' + ev + '"'), ev)
}
for (const gone of ["cancelAnimationFrame(raf)", "io?.disconnect()", "ro.disconnect()", "mo.disconnect()", 'reduceMq.removeEventListener("change"', 'darkMq.removeEventListener("change"', 'document.removeEventListener("visibilitychange"']) {
  assert.ok(src.includes(gone), `cleanup is missing ${gone}`)
}

// motion
assert.ok(src.includes('matchMedia("(prefers-reduced-motion: reduce)")'))
assert.ok(src.includes("const ease = (dt: number, rate: number) => (reduced ? 1 :"), "eased motion snaps under reduced motion")
assert.ok(src.includes("!reduced && !inside && !dragging"), "no auto-rotation under reduced motion")
assert.ok(src.includes("const u = reduced ? p.phase :"), "particles hold still under reduced motion")
assert.ok((src.match(/motion-reduce:transition-none/g) ?? []).length >= 5, "DOM transitions honour reduced motion")

// wheel zoom must not trap the page scroll by default
assert.ok(src.includes('wheelZoom = "modifier"'))
assert.ok(src.includes('if (m === "modifier" && !e.ctrlKey && !e.metaKey)'))

// accessibility
assert.ok(src.includes("tabIndex={0}") && src.includes('role="img"'), "the globe is focusable and labelled")
assert.ok(src.includes('aria-live="polite"'), "keyboard moves are announced")
assert.ok(src.includes('role="switch"') && src.includes('aria-checked={view === "map"}'), "the projection switch reports its state")
assert.ok(src.includes("aria-pressed={isolate === r}"), "legend filters report their state")
for (const key of ['"ArrowLeft"', '"ArrowRight"', '"ArrowUp"', '"ArrowDown"', '"+"', '"-"', '"Home"', '"Escape"', '"m"', '"n"', '"p"']) assert.ok(src.includes("case " + key), key)

// demos import the installer path and keep a width inside 21st's centring flex
for (const f of ["demo.tsx", "demo-palettes.tsx"]) {
  const demo = read(f)
  assert.ok(demo.includes('from "@/components/ui/supply-flow-globe"'), `${f} imports the installer path`)
  assert.ok(/className="(flex )?w-full/.test(demo), `${f}: the outer wrapper has a width`)
  assert.doesNotMatch(demo, /\bh-full\b/)
}

console.log("supply-flow-globe: ok")
