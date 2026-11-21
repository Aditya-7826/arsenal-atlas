#!/usr/bin/env node
/**
 * Compress raw GLB/GLTF models for the web.
 *
 *   models-raw/<id>.glb  ->  public/models/<id>.glb
 *
 * Uses gltf-transform optimize: dedupe, prune, weld, Meshopt geometry compression,
 * textures resized to 2048 px max and converted to WebP. Run with `npm run models:optimize` (add `-- --force` to
 * re-process files that are already up to date).
 */
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { basename, dirname, extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const RAW = join(root, 'models-raw')
const OUT = join(root, 'public', 'models')
const force = process.argv.includes('--force')

const cli = join(root, 'node_modules', '@gltf-transform', 'cli', 'bin', 'cli.js')
if (!existsSync(cli)) {
  console.error('gltf-transform is not installed. Run `npm install` first.')
  process.exit(1)
}

const ids = new Set(JSON.parse(readFileSync(join(root, 'data', 'firearms.json'), 'utf8')).map((f) => f.id))

if (!existsSync(RAW)) {
  console.log('No models-raw/ folder. Create it and add <id>.glb files (see MODELS.md).')
  process.exit(0)
}
mkdirSync(OUT, { recursive: true })

const files = readdirSync(RAW).filter((f) => ['.glb', '.gltf'].includes(extname(f).toLowerCase()))
if (!files.length) {
  console.log('models-raw/ is empty. Add <id>.glb files (see MODELS.md).')
  process.exit(0)
}

const kb = (n) => `${(n / 1024).toFixed(0)} KB`
let ok = 0, skipped = 0, failed = 0, unknown = 0

for (const file of files) {
  const id = basename(file, extname(file))
  if (!ids.has(id)) {
    console.warn(`!  ${file}: "${id}" is not an id in data/firearms.json, skipped (rename it to <id>.glb)`)
    unknown++
    continue
  }
  const src = join(RAW, file)
  const dst = join(OUT, `${id}.glb`)
  if (!force && existsSync(dst) && statSync(dst).mtimeMs >= statSync(src).mtimeMs) {
    console.log(`=  ${id}: up to date`)
    skipped++
    continue
  }
  // dedupe + prune + weld + meshopt, textures capped at 2048 px and converted to WebP.
  // Geometry is otherwise left as authored: no automatic simplify/join/flatten/instancing.
  const args = [
    cli, 'optimize', src, dst,
    '--compress', 'meshopt',
    '--texture-compress', 'webp',
    '--texture-size', '2048',
    '--prune', 'true',
    '--weld', 'true',
    '--simplify', 'false',
    '--join', 'false',
    '--instance', 'false',
    '--flatten', 'false',
    '--palette', 'false',
  ]
  const r = spawnSync(process.execPath, args, { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' })
  if (r.status !== 0) {
    console.error(`x  ${id}: gltf-transform failed\n${(r.stderr || r.stdout).trim()}`)
    failed++
    continue
  }
  console.log(`✓  ${id}: ${kb(statSync(src).size)} -> ${kb(statSync(dst).size)}`)
  ok++
}

console.log(`\nOptimised ${ok}, up to date ${skipped}, unknown names ${unknown}, failed ${failed}.`)
console.log('Next: add attribution to data/credits.json, then run `npm run models:check`.')
process.exit(failed ? 1 : 0)
