import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, type Plugin } from 'vite'
import { readdirSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Exposes `virtual:model-manifest`: the ids of every GLB that exists in /public/models.
 * The app uses it to choose between a real model and the placeholder silhouette,
 * so it works with zero models and never requests a file that is not there.
 * Restart the dev server after adding models.
 */
function modelManifest(): Plugin {
  const id = 'virtual:model-manifest'
  const resolved = '\0' + id
  return {
    name: 'model-manifest',
    resolveId: (s) => (s === id ? resolved : undefined),
    load(s) {
      if (s !== resolved) return
      const dir = resolve(import.meta.dirname, 'public/models')
      const ids = existsSync(dir)
        ? readdirSync(dir).filter((f) => f.endsWith('.glb')).map((f) => f.slice(0, -4))
        : []
      return `export default ${JSON.stringify(ids)}`
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), modelManifest()],
  build: { chunkSizeWarningLimit: 1500 },
})
