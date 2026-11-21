import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, type Plugin } from 'vite'
import { readdirSync, readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
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

/**
 * Dev-only: tools/thumbs/ POSTs rendered thumbnails to /__thumbs/<id>,
 * written to public/thumbs/<id>.webp. Not part of the production build.
 */
function thumbnailWriter(): Plugin {
  return {
    name: 'thumbnail-writer',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__thumbs/', (req, res) => {
        const id = (req.url ?? '').replace(/^\//, '')
        if (req.method !== 'POST' || !/^[a-z0-9-]+$/.test(id)) {
          res.statusCode = 400
          return res.end()
        }
        const chunks: Buffer[] = []
        req.on('data', (c: Buffer) => chunks.push(c))
        req.on('end', () => {
          const dir = resolve(import.meta.dirname, 'public/thumbs')
          mkdirSync(dir, { recursive: true })
          writeFileSync(resolve(dir, `${id}.webp`), Buffer.concat(chunks))
          res.end('ok')
        })
      })
    },
  }
}

/** The global security headers from vercel.json, so `npm run preview` behaves like production. */
function productionHeaders(): Record<string, string> {
  const cfg = JSON.parse(readFileSync(resolve(import.meta.dirname, 'vercel.json'), 'utf8')) as {
    headers: { source: string; headers: { key: string; value: string }[] }[]
  }
  const all = cfg.headers.find((h) => h.source === '/(.*)')
  return Object.fromEntries((all?.headers ?? []).map((h) => [h.key, h.value]))
}

export default defineConfig({
  plugins: [react(), tailwindcss(), modelManifest(), thumbnailWriter()],
  build: { chunkSizeWarningLimit: 1500 },
  preview: { headers: productionHeaders() },
})
