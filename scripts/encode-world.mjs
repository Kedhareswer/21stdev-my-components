// Encode Natural Earth 1:110m countries into the WORLD string embedded in
// components/supply-flow-globe/supply-flow-globe.tsx. Local-only, dependency-free.
//
//   curl -sSLO https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson
//   node scripts/encode-world.mjs ne_110m_admin_0_countries.geojson > world.txt
//
// Format (decoded by decodeWorld() in the component):
//   countries joined by "~", each "<ISO A2>;<name>;<label>;<ring>;<ring>…"
//   <label> is Natural Earth's label point (a good visual anchor for flows),
//   a ring is a run of zig-zag varints over [A-Za-z0-9_-] (5 data bits, 32 = more),
//   lon/lat in tenths of a degree, first pair absolute, the rest deltas.
// Only exterior rings are kept: at this scale the one hole (Lesotho in South
// Africa) is its own country and is drawn on top. Natural Earth is public domain.
import { readFileSync } from "node:fs"

const file = process.argv[2]
if (!file) {
  console.error("usage: node scripts/encode-world.mjs <ne_110m_admin_0_countries.geojson>")
  process.exit(1)
}
const TOL = Number(process.argv[3] ?? 0.1) // simplification tolerance, degrees
const Q = 10 // tenths of a degree
const ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-"

const simplify = (pts, tol) => {
  if (pts.length < 4) return pts
  const keep = new Uint8Array(pts.length)
  // a closed ring starts and ends on one point, so split it at its farthest vertex
  let mid = 1
  for (let i = 1; i < pts.length - 1; i++) {
    if (Math.hypot(pts[i][0] - pts[0][0], pts[i][1] - pts[0][1]) > Math.hypot(pts[mid][0] - pts[0][0], pts[mid][1] - pts[0][1])) mid = i
  }
  keep[0] = keep[mid] = keep[pts.length - 1] = 1
  const stack = [[0, mid], [mid, pts.length - 1]]
  while (stack.length) {
    const [a, b] = stack.pop()
    const [ax, ay] = pts[a]
    const [bx, by] = pts[b]
    const dx = bx - ax
    const dy = by - ay
    const len = Math.hypot(dx, dy) || 1e-9
    let best = -1
    let far = 0
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs(dy * pts[i][0] - dx * pts[i][1] + bx * ay - by * ax) / len
      if (d > far) (far = d), (best = i)
    }
    if (far > tol && best > 0) {
      keep[best] = 1
      stack.push([a, best], [best, b])
    }
  }
  return pts.filter((_, i) => keep[i])
}

const varint = (n) => {
  let v = n < 0 ? ~(n << 1) : n << 1
  let s = ""
  do {
    let c = v & 31
    v >>>= 5
    if (v) c |= 32
    s += ALPHA[c]
  } while (v)
  return s
}

const g = JSON.parse(readFileSync(file, "utf8"))
const out = []
let points = 0
for (const f of g.features) {
  const p = f.properties
  let id = p.ISO_A2_EH && p.ISO_A2_EH !== "-99" ? p.ISO_A2_EH : p.ADM0_A3
  const name = p.NAME
  if (p.NAME === "Antarctica") id = "AQ"
  const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates
  const rings = []
  for (const poly of polys) {
    // drop the closing duplicate; the decoder closes the ring
    let r = simplify(poly[0], TOL).slice(0, -1)
    // a ring that crosses the antimeridian edge must keep its ±180 vertices exact
    r = r.map(([x, y]) => [Math.round(x * Q), Math.round(y * Q)])
    r = r.filter((q, i) => i === 0 || q[0] !== r[i - 1][0] || q[1] !== r[i - 1][1])
    if (r.length < 3) continue
    let s = ""
    let px = 0
    let py = 0
    for (const [x, y] of r) {
      s += varint(x - px) + varint(y - py)
      px = x
      py = y
    }
    points += r.length
    rings.push(s)
  }
  const label = varint(Math.round(p.LABEL_X * Q)) + varint(Math.round(p.LABEL_Y * Q))
  if (rings.length) out.push([id, name.replace(/[~;]/g, ""), label, ...rings].join(";"))
}
process.stdout.write(out.join("~"))
console.error(`${out.length} countries, ${points} points, ${out.join("~").length} chars`)
