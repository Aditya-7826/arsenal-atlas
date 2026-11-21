/**
 * Per-model repairs applied to the raw download before optimisation
 * (rules live in data/model-fixes.json, used by scripts/optimize-models.mjs).
 *
 * Supported rules, applied in this order:
 *   metalRough  true          convert legacy spec-gloss materials (three.js renders them white)
 *   materials   {name|*: {color:[r,g,b], metal, rough}}   override material factors
 *   rotate      [x,y,z] deg   rotate the whole model (e.g. a gun lying on its side)
 *   remove      [regex, ...]  delete nodes whose name matches (display stands, spare guns, loose ammo)
 *   dropRegion  [{min:[x,y,z], max:[x,y,z]}]   delete mesh pieces whose centre lies in this
 *               world-space box (after `rotate`; null = unbounded); works inside merged meshes
 *   level       true          turn and roll it so it is thin along Z (side-on, upright), then
 *               tilt it about Z so its side profile is as low as possible (barrel horizontal).
 *               {pitch: false} skips the last step (pistols, whose grip skews it);
 *               {pitchRange: n} widens that search (default ±45°);
 *               {pitchDeg: n} adds a manual tilt afterwards
 */
import { getBounds } from '@gltf-transform/core'
import { metalRough, prune } from '@gltf-transform/functions'

const deg = Math.PI / 180

function worldPoints(doc, maxPoints = 30000) {
  const pts = []
  const scene = doc.getRoot().getDefaultScene() ?? doc.getRoot().listScenes()[0]
  let total = 0
  scene.traverse((n) => {
    for (const p of n.getMesh()?.listPrimitives() ?? []) total += p.getAttribute('POSITION').getCount()
  })
  const stride = Math.max(1, Math.floor(total / maxPoints))
  scene.traverse((n) => {
    const mesh = n.getMesh()
    if (!mesh) return
    const m = n.getWorldMatrix()
    for (const p of mesh.listPrimitives()) {
      const pos = p.getAttribute('POSITION')
      const v = [0, 0, 0]
      for (let i = 0; i < pos.getCount(); i += stride) {
        pos.getElement(i, v)
        pts.push(apply(m, v))
      }
    }
  })
  return pts
}

function apply(m, [x, y, z]) {
  return [m[0] * x + m[4] * y + m[8] * z + m[12], m[1] * x + m[5] * y + m[9] * z + m[13], m[2] * x + m[6] * y + m[10] * z + m[14]]
}

function extent(pts, f) {
  let lo = Infinity, hi = -Infinity
  for (const p of pts) {
    const v = f(p)
    if (v < lo) lo = v
    if (v > hi) hi = v
  }
  return hi - lo
}

/** Quaternion [x,y,z,w] from XYZ Euler angles in radians. */
function quatFromEuler(x, y, z) {
  const [c1, c2, c3] = [Math.cos(x / 2), Math.cos(y / 2), Math.cos(z / 2)]
  const [s1, s2, s3] = [Math.sin(x / 2), Math.sin(y / 2), Math.sin(z / 2)]
  return [s1 * c2 * c3 + c1 * s2 * s3, c1 * s2 * c3 - s1 * c2 * s3, c1 * c2 * s3 + s1 * s2 * c3, c1 * c2 * c3 - s1 * s2 * s3]
}

/** Wrap every root node of the scene in one parent carrying this rotation. */
function rotateScene(doc, q) {
  const scene = doc.getRoot().getDefaultScene() ?? doc.getRoot().listScenes()[0]
  const pivot = doc.createNode('fix-rotation').setRotation(q)
  for (const child of scene.listChildren()) {
    scene.removeChild(child)
    pivot.addChild(child)
  }
  scene.addChild(pivot)
}

const inBox = (c, { min = [], max = [] }) => c.every((v, i) => (min[i] == null || v >= min[i]) && (max[i] == null || v <= max[i]))

/** Remove connected pieces of every primitive whose world-space centre falls in one of the boxes. */
function dropRegions(doc, boxes) {
  const scene = doc.getRoot().getDefaultScene() ?? doc.getRoot().listScenes()[0]
  scene.traverse((node) => {
    const mesh = node.getMesh()
    if (!mesh) return
    const m = node.getWorldMatrix()
    for (const prim of mesh.listPrimitives()) {
      const pos = prim.getAttribute('POSITION')
      const n = pos.getCount()
      let idx = prim.getIndices()?.getArray()
      if (!idx) idx = Uint32Array.from({ length: n }, (_, i) => i)
      // union-find over vertices that share a triangle or an exact position
      const parent = Uint32Array.from({ length: n }, (_, i) => i)
      const find = (a) => {
        while (parent[a] !== a) a = parent[a] = parent[parent[a]]
        return a
      }
      const union = (a, b) => {
        a = find(a); b = find(b)
        if (a !== b) parent[a] = b
      }
      const v = [0, 0, 0]
      const byPos = new Map()
      for (let i = 0; i < n; i++) {
        pos.getElement(i, v)
        const k = v.map((x) => x.toFixed(5)).join(',')
        const j = byPos.get(k)
        if (j === undefined) byPos.set(k, i)
        else union(i, j)
      }
      for (let t = 0; t < idx.length; t += 3) {
        union(idx[t], idx[t + 1])
        union(idx[t], idx[t + 2])
      }
      const lo = new Map(), hi = new Map()
      for (let i = 0; i < n; i++) {
        pos.getElement(i, v)
        const w = apply(m, v)
        const r = find(i)
        const a = lo.get(r) ?? [Infinity, Infinity, Infinity]
        const b = hi.get(r) ?? [-Infinity, -Infinity, -Infinity]
        for (let k = 0; k < 3; k++) {
          a[k] = Math.min(a[k], w[k])
          b[k] = Math.max(b[k], w[k])
        }
        lo.set(r, a)
        hi.set(r, b)
      }
      const drop = new Set()
      for (const [r, a] of lo) {
        const b = hi.get(r)
        const c = a.map((x, k) => (x + b[k]) / 2)
        if (boxes.some((box) => inBox(c, box))) drop.add(r)
      }
      if (!drop.size) continue
      const kept = []
      for (let t = 0; t < idx.length; t += 3) if (!drop.has(find(idx[t]))) kept.push(idx[t], idx[t + 1], idx[t + 2])
      if (!kept.length) {
        prim.dispose()
        continue
      }
      const acc = doc.createAccessor().setType('SCALAR').setArray(n > 65535 ? Uint32Array.from(kept) : Uint16Array.from(kept))
      prim.setIndices(acc)
    }
  })
}

export async function applyFixes(doc, fix) {
  const root = doc.getRoot()
  if (fix.metalRough) await doc.transform(metalRough())
  for (const [name, o] of Object.entries(fix.materials ?? {})) {
    for (const mat of root.listMaterials()) {
      if (name !== '*' && mat.getName() !== name) continue
      if (o.color) mat.setBaseColorFactor([...o.color, mat.getBaseColorFactor()[3]])
      if (o.metal != null) mat.setMetallicFactor(o.metal)
      if (o.rough != null) mat.setRoughnessFactor(o.rough)
    }
  }
  if (fix.rotate) rotateScene(doc, quatFromEuler(...fix.rotate.map((a) => a * deg)))
  if (fix.remove?.length) {
    const res = fix.remove.map((s) => new RegExp(s))
    for (const node of root.listNodes()) if (res.some((re) => re.test(node.getName()))) node.dispose()
  }
  if (fix.dropRegion?.length) dropRegions(doc, fix.dropRegion)
  await doc.transform(prune())

  if (fix.level) {
    const opts = fix.level === true ? {} : fix.level
    /** Angle in [from, to) that minimises the extent of the rotated points along one axis. */
    const search = (from, to, step, measure) => {
      const pts = worldPoints(doc)
      let best = 0, bestV = Infinity
      for (let a = from; a < to; a += step) {
        const v = extent(pts, (p) => measure(p, Math.cos(a * deg), Math.sin(a * deg)))
        if (v < bestV) [bestV, best] = [v, a]
      }
      return best
    }
    const done = { yaw: 0, roll: 0, pitch: 0 }
    for (let pass = 0; pass < 2; pass++) {
      // yaw about Y: thinnest along Z
      const yaw = search(-90, 90, 0.5, ([x, , z], c, s) => -s * x + c * z)
      rotateScene(doc, quatFromEuler(0, yaw * deg, 0))
      // roll about X (the length): thinnest along Z, i.e. not leaning sideways
      const roll = search(-45, 45, 0.5, ([, y, z], c, s) => s * y + c * z)
      rotateScene(doc, quatFromEuler(roll * deg, 0, 0))
      done.yaw += yaw
      done.roll += roll
    }
    // pitch about Z: lowest side profile, i.e. barrel horizontal (skip for odd shapes)
    if (opts.pitch !== false) {
      const r = opts.pitchRange ?? 45
      done.pitch = search(-r, r, 0.25, ([x, y], c, s) => s * x + c * y)
      rotateScene(doc, quatFromEuler(0, 0, done.pitch * deg))
    }
    if (opts.pitchDeg) rotateScene(doc, quatFromEuler(0, 0, opts.pitchDeg * deg))
    fix._levelled = done
  }
  const b = getBounds(root.getDefaultScene() ?? root.listScenes()[0])
  return { size: b.max.map((v, i) => +(v - b.min[i]).toFixed(3)), ...fix._levelled }
}
