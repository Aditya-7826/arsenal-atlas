import { useEffect, useMemo } from 'react'
import { BoxGeometry, CylinderGeometry, type Texture } from 'three'
import { SHAPES, bounds, shapeFor } from '../silhouette'
import type { Firearm } from '../data'
import { placeholderMaterials } from './materials'

const HANDGUN = new Set(['pistol', 'revolver'])

/**
 * A stylised silhouette built from three.js primitives (external outline only),
 * scaled to the firearm's overall length in metres and centred on the origin.
 */
export function Placeholder({ firearm, lengthM, envMap }: { firearm: Firearm; lengthM: number; envMap?: Texture }) {
  const shape = shapeFor(firearm)
  const mats = placeholderMaterials(envMap)
  const parts = SHAPES[shape]
  const bb = bounds(parts)
  const depth = (HANDGUN.has(shape) ? 0.14 : 0.045) * lengthM
  const yMid = (bb.y0 + bb.y1) / 2

  const meshes = useMemo(
    () =>
      parts.map((p) => {
        if (p.k === 'cyl') {
          const geo = new CylinderGeometry(p.r * lengthM, p.r * lengthM, (p.x1 - p.x0) * lengthM, 28)
          return { geo, pos: [((p.x0 + p.x1) / 2 - 0.5) * lengthM, (p.y - yMid) * lengthM, 0] as const, rot: [0, 0, Math.PI / 2] as const, m: p.m }
        }
        const geo = new BoxGeometry((p.x1 - p.x0) * lengthM, (p.y1 - p.y0) * lengthM, (p.d ?? 1) * depth)
        return {
          geo,
          pos: [((p.x0 + p.x1) / 2 - 0.5) * lengthM, ((p.y0 + p.y1) / 2 - yMid) * lengthM, 0] as const,
          rot: [0, 0, ((p.rot ?? 0) * Math.PI) / 180] as const,
          m: p.m,
        }
      }),
    [parts, lengthM, depth, yMid],
  )
  // free GPU buffers when the silhouette changes or unmounts (materials are shared and kept)
  useEffect(() => () => meshes.forEach((s) => s.geo.dispose()), [meshes])

  return (
    <group>
      {meshes.map((s, i) => (
        <mesh key={i} geometry={s.geo} material={mats[s.m]} position={[...s.pos]} rotation={[...s.rot]} castShadow />
      ))}
    </group>
  )
}
