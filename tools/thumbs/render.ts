/**
 * Dev-only thumbnail renderer. With `npm run dev` running, open
 *   /tools/thumbs/            render every model into a contact sheet (review only)
 *   /tools/thumbs/?save=1     ...and write public/thumbs/<id>.webp through the dev server
 *   /tools/thumbs/?ids=a,b    only these ids
 * Thumbnails use the same normalisation as the 3D viewer (src/three/normalize.ts).
 */
import {
  ACESFilmicToneMapping,
  Box3,
  DirectionalLight,
  EquirectangularReflectionMapping,
  PerspectiveCamera,
  PMREMGenerator,
  Scene,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import modelIds from 'virtual:model-manifest'
import { BY_ID, displayLengthM } from '../../src/data'
import { HDRI } from '../../src/three/materials'
import { normalizeModel } from '../../src/three/normalize'
const W = 960
const H = 540
const params = new URLSearchParams(location.search)
const save = params.has('save')
const only = params.get('ids')?.split(',').filter(Boolean)
const ids = (only ?? modelIds).filter((id) => BY_ID.has(id)).sort()

const renderer = new WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true })
renderer.setPixelRatio(1)
renderer.setSize(W, H)
renderer.toneMapping = ACESFilmicToneMapping
renderer.toneMappingExposure = 1.1
renderer.outputColorSpace = SRGBColorSpace

const draco = new DRACOLoader().setDecoderPath('/draco/')
const loader = new GLTFLoader().setDRACOLoader(draco).setMeshoptDecoder(MeshoptDecoder)

const status = document.getElementById('status')!
const sheet = document.getElementById('sheet')!

async function main() {
  const hdr = await new RGBELoader().loadAsync(HDRI)
  hdr.mapping = EquirectangularReflectionMapping
  const env = new PMREMGenerator(renderer).fromEquirectangular(hdr).texture

  const results: Record<string, string> = {}
  for (const [i, id] of ids.entries()) {
    status.textContent = `Rendering ${i + 1}/${ids.length}: ${id}`
    const f = BY_ID.get(id)!
    try {
      const model = (await loader.loadAsync(`/models/${id}.glb`)).scene
      const { offset } = normalizeModel(model, displayLengthM(f))
      model.position.copy(offset)

      const scene = new Scene()
      scene.environment = env
      const key = new DirectionalLight(0xfff1dc, 1.6)
      key.position.set(1, 2, 3)
      const rim = new DirectionalLight(0xe8c872, 1.2)
      rim.position.set(-2, 1, -2)
      scene.add(key, rim, model)

      // side view (left side of the firearm), slightly from above, framed to the box
      const box = new Box3().setFromObject(model, true)
      const size = box.getSize(new Vector3())
      const fov = 18
      const cam = new PerspectiveCamera(fov, W / H, 0.01, 100)
      const vfov = (fov * Math.PI) / 180
      const hfov = 2 * Math.atan(Math.tan(vfov / 2) * (W / H))
      const dist = Math.max(size.y / 2 / Math.tan(vfov / 2), size.x / 2 / Math.tan(hfov / 2)) * 1.18 + size.z / 2
      cam.position.set(0, dist * 0.12, dist)
      cam.lookAt(0, 0, 0)

      renderer.render(scene, cam)
      const url = renderer.domElement.toDataURL('image/webp', 0.86)
      results[id] = url
      const fig = document.createElement('figure')
      fig.innerHTML = `<img alt="" src="${url}"><figcaption>${id}</figcaption>`
      sheet.append(fig)
      if (save) {
        const blob = await (await fetch(url)).blob()
        const r = await fetch(`/__thumbs/${id}`, { method: 'POST', body: blob })
        if (!r.ok) throw new Error(`save failed ${r.status}`)
      }
      model.traverse((o) => {
        const m = o as unknown as { geometry?: { dispose(): void }; material?: { dispose(): void } | { dispose(): void }[] }
        m.geometry?.dispose()
        for (const mat of [m.material ?? []].flat()) mat.dispose()
      })
    } catch (e) {
      console.error(id, e)
      const fig = document.createElement('figure')
      fig.innerHTML = `<figcaption>${id}: FAILED ${(e as Error).message}</figcaption>`
      sheet.append(fig)
    }
  }
  status.textContent = `Done: ${Object.keys(results).length}/${ids.length}${save ? ' (saved to public/thumbs)' : ''}`
  ;(window as unknown as { __done: boolean }).__done = true
}
main()
