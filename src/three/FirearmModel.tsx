import { Component, Suspense, useEffect, useMemo, type ReactNode } from 'react'
import { useGLTF } from '@react-three/drei'
import { Box3, Mesh, MeshStandardMaterial, Vector3, type Material, type Object3D, type Texture } from 'three'
import { hasModel, type Firearm } from '../data'
import { Placeholder } from './Placeholder'

class ModelBoundary extends Component<{ fallback: ReactNode; children: ReactNode; onError?: () => void }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch() {
    this.props.onError?.()
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

function disposeTree(root: Object3D) {
  root.traverse((o) => {
    if (!(o instanceof Mesh)) return
    o.geometry?.dispose()
    const mats: Material[] = Array.isArray(o.material) ? o.material : [o.material]
    for (const m of mats) {
      for (const v of Object.values(m)) if (v && (v as Texture).isTexture) (v as Texture).dispose()
      m.dispose()
    }
  })
}

/** Loads a GLB (Draco or Meshopt compressed), lays it along X, scales it to real length and centres it. */
function GLTFModel({ firearm, lengthM, envMap }: { firearm: Firearm; lengthM: number; envMap?: Texture }) {
  const { scene } = useGLTF(firearm.modelPath, '/draco/')

  const { scale, offset, rotY } = useMemo(() => {
    const size = new Box3().setFromObject(scene).getSize(new Vector3())
    const rotY = size.z > size.x ? Math.PI / 2 : 0
    const longest = Math.max(size.x, size.z) || 1
    const scale = lengthM / longest
    scene.rotation.set(0, rotY, 0)
    scene.scale.setScalar(scale)
    scene.position.set(0, 0, 0)
    scene.updateMatrixWorld(true)
    const center = new Box3().setFromObject(scene).getCenter(new Vector3())
    scene.traverse((o) => {
      if (!(o instanceof Mesh)) return
      o.castShadow = true
      if (envMap) for (const m of [o.material].flat()) if (m instanceof MeshStandardMaterial) m.envMap = envMap
    })
    return { scale, offset: center.negate(), rotY }
  }, [scene, lengthM, envMap])

  useEffect(
    () => () => {
      disposeTree(scene)
      useGLTF.clear(firearm.modelPath)
    },
    [scene, firearm.modelPath],
  )

  return (
    <group position={offset}>
      <primitive object={scene} scale={scale} rotation={[0, rotY, 0]} />
    </group>
  )
}

/**
 * Real model if one exists in /public/models, otherwise (or if it fails to load)
 * the primitive placeholder silhouette. The app works with zero models.
 */
export function FirearmModel({ firearm, lengthM, loading, envMap }: { firearm: Firearm; lengthM: number; loading?: ReactNode; envMap?: Texture }) {
  const placeholder = <Placeholder firearm={firearm} lengthM={lengthM} envMap={envMap} />
  if (!hasModel(firearm.id)) return placeholder
  return (
    <ModelBoundary fallback={placeholder}>
      <Suspense fallback={loading ?? null}>
        <GLTFModel firearm={firearm} lengthM={lengthM} envMap={envMap} />
      </Suspense>
    </ModelBoundary>
  )
}
