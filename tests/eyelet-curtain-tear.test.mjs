// Install-safety and cloth-physics checks for components/eyelet-curtain-tear.
// Run: node tests/eyelet-curtain-tear.test.mjs
//
// The cloth solver lives in the one published .tsx; the marked region is lifted
// out and type-stripped, so the physics is tested as shipped.
import assert from "node:assert/strict"
import { checkComponent, liftRegion } from "./_component-safety.mjs"

const slug = "eyelet-curtain-tear"
const { src, demo } = checkComponent(slug, { prefix: "ect-", imports: ["react", "three", "three/examples/jsm/postprocessing/EffectComposer.js", "three/examples/jsm/postprocessing/RenderPass.js", "three/examples/jsm/postprocessing/UnrealBloomPass.js", "three/examples/jsm/postprocessing/OutputPass.js"] })

assert.match(demo, /from "@\/components\/ui\/eyelet-curtain-tear"/, "demo imports the installed path")
assert.match(src, /\(hover:hover\) and \(pointer:fine\)/, "grab cursor only for fine pointers")
assert.match(src, /\(hover: hover\) and \(pointer: fine\)/, "the brush-past nudge only runs for fine pointers")
assert.match(src, /wind: reduced \? 0/, "reduced motion stills the breeze")
assert.match(src, /if \(!fine \|\| reduced\) return/, "reduced motion drops the hover nudge")
assert.match(src, /maxWidth|max-width:none/, "canvases escape Preflight's max-width")
assert.match(src, /\.ect-canvas\{[^}]*max-width:none/, "the WebGL canvas overrides max-width")
assert.match(src, /type="button"/, "the take-down / re-hang control is a real button")
assert.match(src, /className="ect-sr"/, "screen-reader description")
assert.match(src, /gl\.dispose\(\)/, "the renderer is disposed on unmount")
assert.match(src, /io\.disconnect\(\)/, "offscreen pause observer is cleaned up")

const g = await liftRegion(src, "cloth")
const env = (o = {}) => ({ dt: 1 / 90, t: 0, gravity: 980, wind: 0, tear: 2.3, iters: 6, ...o })
const finite = (c) => c.pos.every(Number.isFinite)

for (const [W, H] of [[390, 844], [1280, 800], [1920, 1080], [320, 568]]) {
  const c = g.makeCloth(W, H)
  const tag = W + "x" + H
  assert.ok(c.cols >= 24 && c.cols <= 84 && c.rows >= 22 && c.rows <= 60, tag + ": grid in budget")
  const idx = new Uint32Array((c.cols - 1) * (c.rows - 1) * 6)
  const n0 = g.buildIndex(c, idx)
  assert.equal(n0, idx.length, tag + ": every cell drawn at rest")
  assert.ok(idx.every((v) => v < c.cols * c.rows), tag + ": indices in range")

  // hanging under gravity and breeze for 8 s: it must not tear itself
  for (let s = 0; s < 720; s++) g.stepCloth(c, env({ t: s / 90, wind: 1 }))
  assert.equal(c.broken, 0, tag + ": gravity + wind alone tear nothing")
  assert.ok(finite(c), tag + ": finite")
  let lowest = Infinity
  for (let k = 0; k < c.cols * c.rows; k++) lowest = Math.min(lowest, c.pos[k * 3 + 1])
  assert.ok(lowest > -H / 2 - H * 0.12, tag + ": hem hangs near the sill, not on the floor (" + Math.round(lowest) + ")")
  assert.ok(lowest < -H / 2 + H * 0.15, tag + ": cloth reaches down the window")
  assert.equal(g.attachedFraction(c), 1, tag + ": all of it on the rod")

  // a firm yank tears it
  const y0 = 0
  assert.ok(g.grabAt(c, 0, y0, 40) > 0, tag + ": grabbed the middle")
  for (let s = 0; s < 120; s++) {
    g.moveGrab(c, (s / 120) * W * 0.9, y0 - (s / 120) * H * 0.9)
    g.stepCloth(c, env())
  }
  g.letGo(c)
  assert.ok(c.broken > 0, tag + ": a yank snaps threads")
  assert.ok(finite(c), tag + ": finite after tearing")
  const n1 = g.buildIndex(c, idx)
  assert.ok(n1 < n0 && n1 % 6 === 0, tag + ": torn cells leave the mesh")
}

// "Pull it down": snapping every rod loop drops the whole curtain
const c = g.makeCloth(1280, 800)
for (let i = 0; i < c.cols; i++) g.releaseLoop(c, i)
assert.equal(g.attachedFraction(c), 0, "nothing left on the rod")
for (let s = 0; s < 400; s++) g.stepCloth(c, env())
assert.ok(c.frozen.some((f) => f), "fallen cloth leaves the frame and stops simulating")
assert.ok(finite(c))

// normals are unit length
const small = g.makeCloth(800, 600)
const nrm = new Float32Array(small.pos.length)
g.gridNormals(small, nrm)
for (let k = 0; k < nrm.length; k += 3) assert.ok(Math.abs(Math.hypot(nrm[k], nrm[k + 1], nrm[k + 2]) - 1) < 1e-3, "unit normal")

console.log(slug + ": ok")
