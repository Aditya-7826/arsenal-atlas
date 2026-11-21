import { Component, Suspense, useEffect, useMemo, type ReactNode } from 'react'
import { useGLTF } from '@react-three/drei'
import { Mesh, MeshStandardMaterial, type Material, type Object3D, type Texture } from 'three'
import { hasModel, type Firearm } from '../data'
import { Placeholder } from './Placeholder'
import { normalizeModel } from './normalize'

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

/** Loads a GLB (Draco or Meshopt compressed), lays it along X, scales it to real length and centres it (see normalize.ts). */
function GLTFModel({ path, lengthM, envMap }: { path: string; lengthM: number; envMap?: Texture }) {
  const { scene } = useGLTF(path, '/draco/')

  const { scale, offset, rotY } = useMemo(() => {
    const n = normalizeModel(scene, lengthM)
    if (envMap) {
      scene.traverse((o) => {
        if (o instanceof Mesh) for (const m of [o.material].flat()) if (m instanceof MeshStandardMaterial) m.envMap = envMap
      })
    }
    return n
  }, [scene, lengthM, envMap])

  useEffect(
    () => () => {
      disposeTree(scene)
      useGLTF.clear(path)
    },
    [scene, path],
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
  if (!firearm.modelPath || !hasModel(firearm.id)) return placeholder
  return (
    <ModelBoundary fallback={placeholder}>
      <Suspense fallback={loading ?? null}>
        <GLTFModel path={firearm.modelPath} lengthM={lengthM} envMap={envMap} />
      </Suspense>
    </ModelBoundary>
  )
}
