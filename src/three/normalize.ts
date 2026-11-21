import { Box3, Mesh, Vector3, type Object3D } from 'three'

/**
 * Lays a loaded model along X (barrel direction left/right, Y up), scales it so its
 * longest horizontal side equals the real overall length, and returns the offset that
 * centres it on the origin. Shared by the 3D viewer and the thumbnail renderer so both
 * show the model the same way.
 */
export function normalizeModel(scene: Object3D, lengthM: number) {
  scene.rotation.set(0, 0, 0)
  scene.scale.setScalar(1)
  scene.position.set(0, 0, 0)
  scene.updateMatrixWorld(true)
  const size = new Box3().setFromObject(scene, true).getSize(new Vector3())
  const rotY = size.z > size.x ? Math.PI / 2 : 0
  const longest = Math.max(size.x, size.z) || 1
  const scale = lengthM / longest
  scene.rotation.set(0, rotY, 0)
  scene.scale.setScalar(scale)
  scene.updateMatrixWorld(true)
  const box = new Box3().setFromObject(scene, true)
  const offset = box.getCenter(new Vector3()).negate()
  scene.traverse((o) => {
    if (o instanceof Mesh) o.castShadow = true
  })
  return { scale, rotY, offset, size: box.getSize(new Vector3()) }
}
