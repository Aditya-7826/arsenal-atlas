import { useEffect, useMemo } from 'react'
import {
  BufferGeometry,
  CanvasTexture,
  Color,
  CylinderGeometry,
  ExtrudeGeometry,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Path,
  RepeatWrapping,
  SRGBColorSpace,
  Shape,
  type Material,
  type Texture,
} from 'three'
import { parsePath, profileBounds, type Profile, type Seg } from '../profiles'
import type { Mat } from '../silhouette'
import { TOKENS } from './materials'

/* ── procedural textures (colours mixed from the design tokens only) ───── */

function rand(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
}
const mix = (a: string, b: string, t: number) => '#' + new Color(a).lerp(new Color(b), t).getHexString()

/** Walnut-style grain: long wavy streaks with darker figure lines. */
function woodTexture() {
  const w = 1024, h = 256
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const g = c.getContext('2d')!
  const r = rand(7)
  g.fillStyle = mix(TOKENS.bronze, TOKENS.bg, 0.5)
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 420; i++) {
    const y = r() * h
    const amp = 2 + r() * 7
    const freq = 0.004 + r() * 0.01
    const phase = r() * 6.28
    const dark = r() > 0.45
    g.strokeStyle = dark ? mix(TOKENS.bronze, TOKENS.bg, 0.72 + r() * 0.2) : mix(TOKENS.bronze, TOKENS.goldLight, r() * 0.25)
    g.globalAlpha = dark ? 0.12 + r() * 0.22 : 0.05 + r() * 0.1
    g.lineWidth = 0.5 + r() * (dark ? 1.4 : 2.4)
    g.beginPath()
    for (let x = 0; x <= w; x += 8) {
      const yy = y + Math.sin(x * freq + phase) * amp + Math.sin(x * freq * 3.1 + phase) * amp * 0.25
      if (x === 0) g.moveTo(x, yy)
      else g.lineTo(x, yy)
    }
    g.stroke()
  }
  // pores
  g.globalAlpha = 0.18
  g.fillStyle = mix(TOKENS.bronze, TOKENS.bg, 0.85)
  for (let i = 0; i < 2600; i++) g.fillRect(r() * w, r() * h, 1 + r() * 3, 0.8)
  g.globalAlpha = 1
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  return t
}

/** Brushed-steel roughness: fine horizontal streaks. */
function brushedTexture() {
  const w = 512, h = 512
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const g = c.getContext('2d')!
  const r = rand(3)
  g.fillStyle = '#808080'
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 1400; i++) {
    const v = Math.floor(90 + r() * 90)
    g.fillStyle = `rgb(${v},${v},${v})`
    g.globalAlpha = 0.35
    g.fillRect(r() * w, r() * h, 40 + r() * 260, 1)
  }
  return new CanvasTexture(c)
}

type MatSet = Record<Mat, Material>
let base: MatSet | null = null
const withEnv = new Map<Texture, MatSet>()

function baseMaterials(): MatSet {
  if (base) return base
  const wood = woodTexture()
  wood.wrapS = wood.wrapT = RepeatWrapping
  wood.repeat.set(1 / 420, 1 / 220) // extrusion UVs are in millimetres
  const brushed = brushedTexture()
  brushed.wrapS = brushed.wrapT = RepeatWrapping
  brushed.repeat.set(1 / 300, 1 / 300)
  base = {
    // blued / parkerised steel
    metal: new MeshStandardMaterial({ color: mix(TOKENS.bg, TOKENS.muted, 0.32), metalness: 0.8, roughness: 0.48, roughnessMap: brushed }),
    polymer: new MeshStandardMaterial({ color: mix(TOKENS.bg, TOKENS.muted, 0.1), metalness: 0, roughness: 0.78 }),
    // oiled and lacquered wood
    wood: new MeshPhysicalMaterial({ map: wood, roughness: 0.55, metalness: 0, clearcoat: 0.4, clearcoatRoughness: 0.4 }),
  }
  return base
}

function detailedMaterials(envMap?: Texture): MatSet {
  const b = baseMaterials()
  if (!envMap) return b
  let set = withEnv.get(envMap)
  if (!set) {
    set = { metal: b.metal.clone(), polymer: b.polymer.clone(), wood: b.wood.clone() }
    for (const m of Object.values(set)) {
      ;(m as MeshStandardMaterial).envMap = envMap
      ;(m as MeshStandardMaterial).envMapIntensity = 0.8
    }
    withEnv.set(envMap, set)
  }
  return set
}

/* ── geometry ───────────────────────────────────────────────────────── */

function toPath<T extends Path>(p: T, segs: Seg[]) {
  for (const s of segs) {
    if (s[0] === 'M') p.moveTo(s[1], s[2])
    else if (s[0] === 'L') p.lineTo(s[1], s[2])
    else if (s[0] === 'Q') p.quadraticCurveTo(s[1], s[2], s[3], s[4])
    else if (s[0] === 'C') p.bezierCurveTo(s[1], s[2], s[3], s[4], s[5], s[6])
  }
  return p
}

type Built = { geo: BufferGeometry; m: Mat; pos: [number, number, number]; rot: [number, number, number] }

function build(profile: Profile): Built[] {
  return profile.parts.map((part) => {
    if (part.k === 'shape') {
      const [outer, ...holes] = parsePath(part.d)
      const shape = toPath(new Shape(), outer)
      shape.holes = holes.map((h) => toPath(new Path(), h))
      const bevel = Math.min(1.8, part.t * 0.18)
      const depth = Math.max(0.2, part.t - bevel * 2)
      const geo = new ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: Math.min(bevel, 1.2), bevelSegments: 3, curveSegments: 18 })
      geo.translate(0, 0, -depth / 2)
      geo.computeVertexNormals()
      return { geo, m: part.m, pos: [0, 0, part.z ?? 0], rot: [0, 0, 0] }
    }
    if (part.k === 'cyl') {
      // CylinderGeometry's top (+y) ends up at the x0 end after rotating +90° about z
      const geo = new CylinderGeometry(part.r, part.r1 ?? part.r, part.x1 - part.x0, 40)
      return { geo, m: part.m, pos: [(part.x0 + part.x1) / 2, part.y, part.z ?? 0], rot: [0, 0, Math.PI / 2] }
    }
    const geo = new CylinderGeometry(part.r, part.r, part.t, 56)
    return { geo, m: part.m, pos: [part.x, part.y, part.z ?? 0], rot: [Math.PI / 2, 0, 0] }
  })
}

/** A detailed study model: bevelled extrusions of a hand-drawn side profile, scaled to real length and centred. */
export function DetailedModel({ profile, lengthM, envMap }: { profile: Profile; lengthM: number; envMap?: Texture }) {
  const mats = detailedMaterials(envMap)
  const parts = useMemo(() => build(profile), [profile])
  useEffect(() => () => parts.forEach((p) => p.geo.dispose()), [parts])
  const b = profileBounds(profile)
  const s = lengthM / (b.x1 - b.x0)
  const cx = (b.x0 + b.x1) / 2
  const cy = (b.y0 + b.y1) / 2
  return (
    <group scale={s}>
      <group position={[-cx, -cy, 0]}>
        {parts.map((p, i) => (
          <mesh key={i} geometry={p.geo} material={mats[p.m]} position={p.pos} rotation={p.rot} castShadow receiveShadow />
        ))}
      </group>
    </group>
  )
}
