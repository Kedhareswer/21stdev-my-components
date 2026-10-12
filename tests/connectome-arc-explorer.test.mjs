// Runnable check for components/connectome-arc-explorer: the arc layout, the
// geometry, profile aggregation, the sample connectome, and install safety.
// Run: node tests/connectome-arc-explorer.test.mjs
//
// What breaks silently here is geometry and bookkeeping: arcs that are no
// longer mirror images (a region stops reading straight across), tiles that
// overlap or leave the span, a group that sums its children wrong, a label
// rotated upside down, or sample data that drifts between renders.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stripTypeScriptTypes } from "node:module"

const read = (file) =>
  readFileSync(new URL("../components/connectome-arc-explorer/" + file, import.meta.url), "utf8").replace(/\r\n/g, "\n")
const src = read("connectome-arc-explorer.tsx")

const start = src.indexOf("// #region connectome")
const end = src.indexOf("// #endregion")
assert.ok(start > -1 && end > start, "region markers missing")
const C = await import("data:text/javascript," + encodeURIComponent(stripTypeScriptTypes(src.slice(start, end))))

const near = (a, b, eps = 1e-9) => Math.abs(a - b) < eps
const deg = (r) => (r * 180) / Math.PI

// ---- layout: ordered, inside [0, 1], groups and supers wrap their regions ----------
{
  const L = C.layoutArc(C.SAMPLE_REGION_GROUPS, C.SAMPLE_SUPERS)
  const total = C.SAMPLE_REGION_GROUPS.reduce((n, g) => n + g.regions.length, 0)
  assert.equal(L.regions.length, total)
  assert.equal(L.regions[0].u0, 0, "the first tile starts the arc")
  assert.ok(near(L.regions.at(-1).u1, 1), "the last tile ends it")
  for (let i = 0; i < L.regions.length; i++) {
    const r = L.regions[i]
    assert.ok(r.u1 > r.u0, r.id)
    if (i) assert.ok(r.u0 >= L.regions[i - 1].u1 - 1e-12, "tiles never overlap")
  }
  const widths = L.regions.map((r) => r.u1 - r.u0)
  assert.ok(widths.every((w) => near(w, widths[0])), "every region gets the same share")
  for (const g of L.groups) {
    const rs = g.regions.map((i) => L.regions[i])
    assert.ok(near(g.u0, rs[0].u0) && near(g.u1, rs.at(-1).u1), g.id + " spans exactly its regions")
  }
  // a gap between groups, a bigger one where the super-region ends
  const gapAfter = (gi) => L.groups[gi + 1].u0 - L.groups[gi].u1
  assert.ok(gapAfter(0) > 0, "groups are separated")
  const lastMB = C.SAMPLE_REGION_GROUPS.findLastIndex((g) => g.within === "MB")
  assert.ok(gapAfter(lastMB) > gapAfter(0) + 1e-9, "leaving the mushroom body opens a wider gap")
  assert.equal(L.supers.length, 1)
  assert.equal(L.supers[0].regions.length, C.SAMPLE_REGION_GROUPS.filter((g) => g.within === "MB").reduce((n, g) => n + g.regions.length, 0))
  assert.deepEqual(C.layoutArc([], []).regions, [], "empty data lays out nothing")
  assert.deepEqual(C.layoutArc(C.SAMPLE_REGION_GROUPS, [{ id: "nope", label: "x" }]).supers, [], "a super with no groups is dropped")
}

// ---- geometry: the two arcs mirror each other ---------------------------------------------
{
  for (const u of [0, 0.25, 0.5, 0.77, 1]) {
    const [xi, yi] = C.polar(300, C.angleAt(u, "in"))
    const [xo, yo] = C.polar(300, C.angleAt(u, "out"))
    assert.ok(near(xi + xo, 2 * C.STAGE.CX, 1e-6), "mirrored about the column")
    assert.ok(near(yi, yo, 1e-6), "a region sits at the same height on both arcs")
    assert.ok(xi < C.STAGE.CX && xo > C.STAGE.CX, "input left, output right")
  }
  assert.ok(C.polar(300, C.angleAt(0, "in"))[1] < C.polar(300, C.angleAt(1, "in"))[1], "u runs top to bottom")
  // the arcs stay clear of the column and inside the stage
  for (const u of [0, 1]) {
    const [x, y] = C.polar(C.RING.superIn, C.angleAt(u, "in"))
    assert.ok(x < C.COLUMN.x - 16, "the inner ring clears the column")
    const [, yo] = C.polar(C.RING.tileOut, C.angleAt(u, "in"))
    assert.ok(yo > 60 && yo < C.STAGE.H - 60, "tiles stay on the stage")
    void y
  }
  // sector paths are closed and stay within their radii
  const d = C.sectorPath(100, 140, 0.2, 0.6, 2)
  assert.match(d, /^M[\d. -]+A100|^M[\d. -]+A140/)
  assert.ok(d.endsWith("Z"))
  const nums = [...d.matchAll(/-?\d+(?:\.\d+)?/g)].map(Number)
  assert.ok(nums.every(Number.isFinite))
  assert.equal(C.sectorPath(100, 140, 0.6, 0.2), C.sectorPath(100, 140, 0.2, 0.6), "angle order doesn't matter")
  assert.doesNotMatch(C.sectorPath(100, 140, 0.3, 0.3001, 50), /NaN/, "a pad wider than the tile collapses it, not NaN")
  // links leave their node flat and land on the tile's outer edge
  const a = C.angleAt(0.4, "in")
  const lp = C.linkPath(112, 300, a)
  const n = [...lp.matchAll(/-?\d+(?:\.\d+)?/g)].map(Number)
  assert.equal(n[1], 300)
  assert.equal(n[3], 300, "first control point keeps the node's height, so a node's curves bundle")
  const [ex, ey] = C.polar(C.RING.tileOut + 3, a)
  assert.ok(near(n[6], Math.round(ex * 100) / 100) && near(n[7], Math.round(ey * 100) / 100), "lands on the arc")
}

// ---- labels never read upside down ---------------------------------------------------------
{
  for (let u = 0; u <= 1; u += 0.05) {
    for (const side of ["in", "out"]) {
      const a = C.angleAt(u, side)
      const r = ((C.radialLabelRotation(a, side) % 360) + 540) % 360 - 180
      assert.ok(Math.abs(r) <= C.SPAN + 1e-9, `radial label at u=${u.toFixed(2)} ${side} is upright (${r.toFixed(1)}°)`)
      const t = ((C.tangentLabelRotation(a, side) % 360) + 540) % 360 - 180
      assert.ok(Math.abs(Math.abs(t) - 90) <= C.SPAN + 1e-9, "band labels run along the arc")
      // tangent really is perpendicular to the radius
      assert.ok(near(Math.abs(Math.cos(((t - deg(a)) * Math.PI) / 180)), 0, 1e-9))
    }
  }
}

// ---- nodes ---------------------------------------------------------------------------------------
{
  for (const n of [1, 2, 5, 9]) {
    const ys = C.nodeYs(n)
    assert.equal(ys.length, n)
    assert.ok(near((ys[0] + ys.at(-1)) / 2, C.STAGE.CY), "centred on the arcs' axis")
    assert.ok(ys.at(-1) - ys[0] <= 470 + 1e-9, "stays within the arcs")
  }
  assert.equal(C.nodeRadius(0, 10), 4, "an empty node is a small marker, not nothing")
  assert.ok(C.nodeRadius(10, 10) > C.nodeRadius(1, 10))
  assert.equal(C.tint(0, 10), 0)
  assert.ok(C.tint(1e-6, 10) >= 0.1, "one synapse still shows")
  assert.equal(C.tint(10, 10), 1)
  assert.equal(C.tint(50, 10), 1, "clamped")
  assert.equal(C.tint(5, 0), 0)
  assert.equal(C.linkWidth(5, 0), 0)
}

// ---- profiles: packing, groups sum their children ---------------------------------------------
{
  const data = {
    cellTypes: [{ id: "G", label: "G", children: [{ id: "a", label: "a" }, { id: "b", label: "b" }] }, { id: "lone", label: "lone" }],
    profiles: {
      a: { count: 3, inputs: { r1: 10, r2: 5 }, outputs: { r2: 7 }, inputLinks: { n1: { r1: 4 } }, innervation: { r1: 3 } },
      b: { count: 2, inputs: { r1: 1, r3: -4 }, outputs: { r1: Number.NaN }, inputLinks: { n1: { r1: 2 }, n2: { r2: 9 } }, innervation: { r1: 2 } },
    },
  }
  const g = C.resolveProfile(data, "G")
  assert.equal(g.count, 5)
  assert.deepEqual(g.inputs, { r1: 11, r2: 5 }, "negative and NaN counts are dropped")
  assert.deepEqual(g.outputs, { r2: 7 })
  assert.deepEqual(g.inputLinks, { n1: { r1: 6 }, n2: { r2: 9 } })
  assert.equal(g.innervation.r1, 5)
  assert.equal(C.resolveProfile(data, "a"), data.profiles.a, "a leaf's own profile is used as is")
  assert.equal(C.resolveProfile(data, "lone").count, 0, "missing data is empty, not a crash")
  assert.equal(C.resolveProfile(data, "nope").count, 0)
  assert.equal(C.sumProfiles([{ count: 2, innervation: { r: 9 } }]).innervation.r, 2, "innervation never passes the count")

  const ids = ["r1", "r2", "r3"]
  const o = C.offsets(3, 2, 1)
  const p = C.packProfile(g, ids, ["n1", "n2"], ["m1"])
  assert.equal(p.length, o.length)
  assert.equal(p[0], 5)
  assert.equal(p[o.inp + 0], 11)
  assert.equal(p[o.inp + 2], 0)
  assert.equal(p[o.out + 1], 7)
  assert.equal(p[o.inLinks + 0 * 3 + 0], 6)
  assert.equal(p[o.inLinks + 1 * 3 + 1], 9)
  assert.equal(p[o.inn + 0], 5)
  assert.ok([...p].every((x) => Number.isFinite(x) && x >= 0))

  const mid = C.lerpArrays(new Float64Array([0, 10]), new Float64Array([10, 0]), 0.5)
  assert.deepEqual([...mid], [5, 5])
  assert.equal(C.easeInOutCubic(0), 0)
  assert.equal(C.easeInOutCubic(1), 1)
  assert.ok(near(C.easeInOutCubic(0.5), 0.5))
}

// ---- column rows ----------------------------------------------------------------------------------
{
  const rows = C.visibleRows(C.SAMPLE_CELL_TYPES, new Set(["KC"]))
  assert.deepEqual(rows.slice(0, 3), ["PAM", "PPL1", "KC"])
  assert.equal(rows.length, C.SAMPLE_CELL_TYPES.length + C.SAMPLE_CELL_TYPES.find((g) => g.id === "KC").children.length)
  assert.equal(C.findCellType(C.SAMPLE_CELL_TYPES, "PAM05").parent.id, "PAM")
  assert.equal(C.findCellType(C.SAMPLE_CELL_TYPES, "PAM").parent, null)
  assert.equal(C.findCellType(C.SAMPLE_CELL_TYPES, "x"), null)
}

// ---- the sample connectome ----------------------------------------------------------------------
{
  const S = C.sampleConnectome(7)
  assert.deepEqual(S, C.sampleConnectome(7), "same seed, same numbers")
  assert.notDeepEqual(S.profiles.PAM05, C.sampleConnectome(8).profiles.PAM05, "the seed matters")
  const regionIds = new Set(S.regionGroups.flatMap((g) => g.regions.map((r) => r.id)))
  const inIds = new Set(S.inputNeurons.map((n) => n.id))
  const outIds = new Set(S.outputNeurons.map((n) => n.id))
  assert.equal(regionIds.size, S.regionGroups.flatMap((g) => g.regions).length, "region ids are unique")
  const leaves = S.cellTypes.flatMap((g) => g.children)
  assert.equal(leaves.length, 36)
  assert.equal(S.cellTypes.find((g) => g.id === "PAM").children.length, 14, "PAM01 to PAM14")
  for (const leaf of leaves) {
    const p = S.profiles[leaf.id]
    assert.ok(p, leaf.id + " has a profile")
    for (const k of [...Object.keys(p.inputs), ...Object.keys(p.outputs), ...Object.keys(p.innervation)]) assert.ok(regionIds.has(k), leaf.id + " → unknown region " + k)
    for (const n in p.inputLinks) {
      assert.ok(inIds.has(n), n)
      for (const r in p.inputLinks[n]) assert.ok(p.inputLinks[n][r] <= p.inputs[r], "a link never carries more than its region receives")
    }
    for (const n in p.outputLinks) {
      assert.ok(outIds.has(n), n)
      for (const r in p.outputLinks[n]) assert.ok(p.outputLinks[n][r] <= p.outputs[r])
    }
    for (const r in p.innervation) assert.ok(p.innervation[r] >= 1 && p.innervation[r] <= p.count)
    assert.ok(Object.values(p.inputs).every((v) => Number.isInteger(v) && v > 0))
  }
  // anatomy the sample should get right
  const top = (rec) => Object.entries(rec).sort((a, b) => b[1] - a[1])[0][0]
  assert.equal(top(S.profiles.PAM08.outputs), "g4", "PAM08 targets γ4")
  assert.equal(top(S.profiles.KCg.inputs), "CA", "Kenyon cells listen in the calyx")
  assert.ok(Object.keys(S.profiles.KCg.outputs).every((r) => r.startsWith("g")), "γ KCs output only in the γ lobe")
  assert.ok(top(S.profiles.KCg.inputLinks.olf) === "CA", "olfactory input arrives in the calyx")
  assert.ok(["g5", "bp2"].includes(top(S.profiles.MBON01.inputs)))
  // groups sum to their children
  const pam = C.resolveProfile(S, "PAM")
  const sum = S.cellTypes.find((g) => g.id === "PAM").children.reduce((n, c) => n + S.profiles[c.id].count, 0)
  assert.equal(pam.count, sum)
  const L = C.layoutArc(S.regionGroups, S.supers)
  const packed = C.packProfile(pam, L.regions.map((r) => r.id), [...inIds], [...outIds])
  assert.ok([...packed].every(Number.isFinite))
}

// ---- install safety -----------------------------------------------------------------------------
const imports = [...src.matchAll(/^import .*?from ["']([^"']+)["']/gm)].map((m) => m[1])
assert.deepEqual(imports, ["react"], "the only import may be react")
assert.doesNotMatch(src, /https?:\/\//, "no external origins")
assert.doesNotMatch(src, /@import/, "no @import")
assert.doesNotMatch(src, /^\s*(\*|body|:root)\s*{/m, "no bare global resets")
assert.doesNotMatch(src, /\bh-(full|screen)\b/, "no percentage-height classes")
const css = src.slice(src.indexOf("const CSS ="), src.indexOf("export default function"))
assert.doesNotMatch(css, /`|\$\{/, "no backticks or ${ in the CSS string")
for (const rule of css.match(/"[^"]*"/g) ?? []) {
  for (const sel of rule.slice(1, -1).split("}")) {
    const s = sel.split("{")[0].trim()
    if (s && !s.startsWith("@") && !/^(from|to|\d+%)$/.test(s)) assert.ok(s.split(",").every((part) => part.trim().startsWith(".cae-root")), "scoped: " + s)
  }
}
assert.ok(src.includes('maxWidth: "none"'), "the svg is guarded against Preflight's max-width")
for (const token of ["--color-background, ", "--color-foreground, ", "--color-border, ", "--color-muted-foreground, "]) {
  assert.ok(src.includes("var(" + token), `${token.slice(0, -2)} carries a literal fallback`)
}

// cleanup
for (const gone of ["ro.disconnect()", "io.disconnect()", "cancelAnimationFrame(raf)", 'mq.removeEventListener("change"', 'window.removeEventListener("keydown"', "window.clearTimeout(clearTimer.current)"]) {
  assert.ok(src.includes(gone), `cleanup is missing ${gone}`)
}

// motion
assert.ok(src.includes('matchMedia("(prefers-reduced-motion: reduce)")'))
assert.ok(src.includes("useTween(target, reduced ? 0 : duration)"), "reduced motion snaps the morph")
assert.ok(src.includes("@media (prefers-reduced-motion: reduce)"), "keyframes stop under reduced motion")
assert.ok(src.includes("if (on && !reduced)"), "no flowing dashes under reduced motion")
assert.ok((src.match(/motion-reduce:transition-none/g) ?? []).length >= 5, "DOM transitions honour reduced motion")

// accessibility
assert.ok(src.includes('role="tree"') && src.includes('role="treeitem"'), "the column is a tree")
assert.ok(src.includes("aria-expanded={kids.length ? open : undefined}"))
assert.ok(src.includes('aria-live="polite"'), "focus and selection are announced")
assert.ok(src.includes("tabIndex={roving.side === side && roving.i === i ? 0 : -1}"), "the arcs are one tab stop with arrow keys inside")
for (const key of ['"ArrowLeft"', '"ArrowRight"', '"ArrowUp"', '"ArrowDown"', '"Home"', '"End"', '"Escape"', '"Enter"']) assert.ok(src.includes(key), key)

// Demos import the installer path and keep a width inside 21st's centring flex.
for (const f of ["demo.tsx", "demo-palettes.tsx"]) {
  const demo = read(f)
  assert.ok(demo.includes('from "@/components/ui/connectome-arc-explorer"'), `${f} imports the installer path`)
  assert.ok(/className="w-full/.test(demo), `${f}: the outer wrapper has a width`)
  assert.doesNotMatch(demo, /\bh-full\b/)
}

const tsconfig = readFileSync(new URL("../tsconfig.json", import.meta.url), "utf8")
assert.ok(tsconfig.includes('"@/components/ui/connectome-arc-explorer"'), "tsconfig paths line for npm run check")

console.log("connectome-arc-explorer: ok")
